// backend/src/config/database.js
const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connectionRetries = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5초
  }

  async connect() {
    try {
      // MongoDB Atlas 연결 옵션 최적화
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000, // 10초
        socketTimeoutMS: 45000, // 45초
        maxPoolSize: 10, // 최대 연결 수
        minPoolSize: 1, // 최소 연결 수
        maxIdleTimeMS: 30000, // 30초 유휴 시간
        retryWrites: true,
        w: 'majority',
        authSource: 'admin', // 인증 데이터베이스 명시
        ssl: true, // SSL 강제 사용
      };

      // 연결 문자열 검증
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.');
      }

      console.log('🔄 MongoDB 연결 시도 중...');
      console.log('📍 연결 대상:', this.maskConnectionString(process.env.MONGODB_URI));

      await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      this.connectionRetries = 0;
      
      console.log('✅ MongoDB 연결 성공');
      console.log(`📊 연결 상태: ${mongoose.connection.readyState}`);
      console.log(`🏢 데이터베이스: ${mongoose.connection.name}`);
      
      // 연결 상태 모니터링
      this.setupEventListeners();
      
    } catch (error) {
      this.isConnected = false;
      console.error('❌ MongoDB 연결 실패:', error.message);
      
      // 상세 에러 분석
      this.analyzeError(error);
      
      // 재연결 시도
      await this.handleReconnection(error);
    }
  }

  analyzeError(error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('bad auth') || errorMessage.includes('authentication failed')) {
      console.error('🔐 인증 오류 발생:');
      console.error('   - 사용자명/비밀번호 확인');
      console.error('   - MongoDB Atlas Database Access 설정 확인');
      console.error('   - 비밀번호 특수문자 URL 인코딩 확인');
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      console.error('🌐 네트워크 오류 발생:');
      console.error('   - MongoDB Atlas Network Access 설정 확인');
      console.error('   - IP 주소 허용 목록 확인 (0.0.0.0/0)');
      console.error('   - 클러스터 상태 확인');
    }
    
    if (errorMessage.includes('server selection')) {
      console.error('🖥️ 서버 선택 오류:');
      console.error('   - 연결 문자열 형식 확인');
      console.error('   - 클러스터 주소 정확성 확인');
    }
  }

  async handleReconnection(error) {
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      console.log(`🔄 재연결 시도 ${this.connectionRetries}/${this.maxRetries} (${this.retryDelay/1000}초 후)`);
      
      setTimeout(() => {
        this.connect();
      }, this.retryDelay);
    } else {
      console.error('💀 최대 재연결 시도 횟수 초과. 서버 종료.');
      process.exit(1);
    }
  }

  setupEventListeners() {
    // 연결 해제 이벤트
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB 연결이 해제되었습니다.');
      this.isConnected = false;
    });

    // 재연결 이벤트
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB 재연결 성공');
      this.isConnected = true;
    });

    // 에러 이벤트
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB 연결 에러:', error);
      this.isConnected = false;
    });

    // 프로세스 종료 시 연결 정리
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  async gracefulShutdown() {
    console.log('🔄 MongoDB 연결을 정리하는 중...');
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB 연결이 안전하게 종료되었습니다.');
      process.exit(0);
    } catch (error) {
      console.error('❌ MongoDB 연결 종료 중 오류:', error);
      process.exit(1);
    }
  }

  maskConnectionString(connectionString) {
    // 보안을 위해 비밀번호 마스킹
    return connectionString.replace(/(:\/\/)([^:]+):([^@]+)(@)/, '$1$2:***$4');
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }
}

module.exports = new DatabaseConnection();