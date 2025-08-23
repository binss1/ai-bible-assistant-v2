// backend/scripts/test-db-connection.js
// MongoDB 연결 테스트 스크립트
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB 연결 테스트 시작...\n');

// 환경 변수 확인
console.log('📋 환경 변수 확인:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI 존재:', !!process.env.MONGODB_URI);
console.log('- MONGODB_URI 길이:', process.env.MONGODB_URI?.length || 0);

if (process.env.MONGODB_URI) {
  // 연결 문자열 분석
  const uri = process.env.MONGODB_URI;
  const maskedUri = uri.replace(/(:\/\/)([^:]+):([^@]+)(@)/, '$1$2:***$4');
  console.log('- 연결 문자열 (마스킹):', maskedUri);
  
  // URI 구성 요소 분석
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    console.log('- 호스트:', url.hostname);
    console.log('- 사용자명:', url.username);
    console.log('- 비밀번호 길이:', url.password?.length || 0);
    console.log('- 데이터베이스:', url.pathname.substring(1).split('?')[0]);
  } catch (error) {
    console.error('❌ URI 파싱 오류:', error.message);
  }
}

console.log('\n🔄 연결 시도 중...');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority',
  authSource: 'admin',
  ssl: true,
};

async function testConnection() {
  try {
    console.log('⏱️ 연결 옵션:', JSON.stringify(options, null, 2));
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('\n✅ MongoDB 연결 성공!');
    console.log('📊 연결 상태:', mongoose.connection.readyState);
    console.log('🏢 데이터베이스 이름:', mongoose.connection.name);
    console.log('🔗 호스트:', mongoose.connection.host);
    console.log('🔌 포트:', mongoose.connection.port);
    
    // 간단한 쿼리 테스트
    console.log('\n🧪 데이터베이스 쿼리 테스트 중...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 사용 가능한 컬렉션 수:', collections.length);
    
    if (collections.length > 0) {
      console.log('📋 컬렉션 목록:');
      collections.forEach(col => console.log(`  - ${col.name}`));
    }
    
    console.log('\n🎉 모든 테스트 성공!');
    
  } catch (error) {
    console.error('\n❌ MongoDB 연결 실패:', error.message);
    console.error('🔍 에러 코드:', error.code);
    console.error('📝 에러 상세:', error.codeName);
    
    // 구체적인 오류 해결 방안 제시
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error('\n🔐 인증 문제 해결 방안:');
      console.error('1. MongoDB Atlas → Database Access에서 사용자명/비밀번호 확인');
      console.error('2. 비밀번호에 특수문자가 있다면 URL 인코딩 필요');
      console.error('   예) @ → %40, ! → %21, # → %23');
      console.error('3. 데이터베이스 권한이 "Atlas Admin" 또는 "Read and write"인지 확인');
    }
    
    if (error.message.includes('network') || error.message.includes('timeout')) {
      console.error('\n🌐 네트워크 문제 해결 방안:');
      console.error('1. MongoDB Atlas → Network Access에서 IP 허용 확인');
      console.error('2. "0.0.0.0/0" (모든 IP 허용) 추가');
      console.error('3. 클러스터가 정상 동작 중인지 Atlas 대시보드에서 확인');
    }
    
    if (error.message.includes('server selection')) {
      console.error('\n🖥️ 서버 선택 문제 해결 방안:');
      console.error('1. 연결 문자열 형식 확인');
      console.error('2. 클러스터 주소가 정확한지 Atlas에서 재확인');
      console.error('3. SRV 레코드 문제일 수 있음 - DNS 확인 필요');
    }
  } finally {
    console.log('\n🔄 연결 종료 중...');
    await mongoose.connection.close();
    console.log('👋 연결 종료 완료');
    process.exit(0);
  }
}

testConnection();