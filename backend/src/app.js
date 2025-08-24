const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 개선된 데이터베이스 연결 클래스
const database = require('./config/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// 미들웨어 설정
app.use(helmet({
  contentSecurityPolicy: false, // Socket.IO 호환성을 위해 비활성화
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate Limiting - API 경로에만 적용
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser 미들웨어
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: '잘못된 JSON 형식입니다.' });
      throw e;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 로깅 미들웨어 - 간소화
app.use((req, res, next) => {
  console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// favicon 처리 - 먼저 처리
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// 기본 라우트 (헬스 체크 겸용)
app.get('/', (req, res) => {
  const dbStatus = database.getConnectionStatus();
  
  res.json({
    message: '🙏 AI Bible Assistant API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      status: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus.readyState] || 'unknown'
    },
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      chat: '/api/chat',
      bible: '/api/bible',
      prayer: '/api/prayer'
    }
  });
});

console.log('🔄 라우터 로드 시작...');

// Health check 라우터 먼저 로드
try {
  const healthRoutes = require('./routes/health');
  app.use('/api', healthRoutes);
  console.log('✅ Health 라우터 로드됨');
} catch (error) {
  console.error('❌ Health 라우터 로드 실패:', error.message);
}

try {
  const chatRoutes = require('./routes/chat');
  app.use('/api/chat', chatRoutes);
  console.log('✅ Chat 라우터 로드됨');
} catch (error) {
  console.error('❌ Chat 라우터 로드 실패:', error.message);
}

try {
  const bibleRoutes = require('./routes/bible');
  app.use('/api/bible', bibleRoutes);
  console.log('✅ Bible 라우터 로드됨');
} catch (error) {
  console.error('❌ Bible 라우터 로드 실패:', error.message);
}

try {
  const prayerRoutes = require('./routes/prayer');
  app.use('/api/prayer', prayerRoutes);
  console.log('✅ Prayer 라우터 로드됨');
} catch (error) {
  console.error('❌ Prayer 라우터 로드 실패:', error.message);
}

console.log('✅ 모든 라우터 로드 완료');

// API 문서 경로
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'AI Bible Assistant API',
    version: '1.0.0',
    description: '성경의 지혜로 상담해주는 AI Assistant API',
    baseURL: req.protocol + '://' + req.get('host'),
    endpoints: {
      'GET /': 'API 기본 정보',
      'GET /api/health': '시스템 상태 확인',
      'GET /api/health/detailed': '상세 시스템 정보',
      'GET /api/health/database': '데이터베이스 상태',
      'GET /api/version': 'API 버전 정보',
      'GET /api/docs': 'API 문서',
      'POST /api/chat/start': '채팅 세션 시작',
      'POST /api/chat/message': '채팅 메시지 전송',
      'GET /api/bible/search': '성경 구절 검색',
      'POST /api/prayer/generate': '기도문 생성'
    },
    websocket: {
      endpoint: '/socket.io',
      events: ['connection', 'join-chat', 'send-message', 'receive-message', 'disconnect']
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
    }
  });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('👤 사용자 연결:', socket.id);

  // 채팅방 입장
  socket.on('join-chat', (userId) => {
    if (!userId) {
      socket.emit('error', { message: '사용자 ID가 필요합니다.' });
      return;
    }
    
    socket.join(`user-${userId}`);
    console.log(`👤 사용자 ${userId}가 채팅방에 입장했습니다.`);
    
    // 환영 메시지
    socket.emit('receive-message', {
      type: 'bot',
      message: '🙏 안녕하세요! AI Bible Assistant입니다. 어떤 고민이나 질문이 있으신가요?',
      timestamp: new Date(),
      sessionId: `session-${Date.now()}`
    });
  });

  // 메시지 전송
  socket.on('send-message', async (data) => {
    try {
      const { userId, message, sessionId } = data;
      
      if (!userId || !message) {
        socket.emit('error', { message: '사용자 ID와 메시지가 필요합니다.' });
        return;
      }

      console.log('📨 메시지 수신:', { userId, message: message.substring(0, 50) + '...', sessionId });
      
      // TODO: 실제 Claude AI 연동 로직 구현
      // 현재는 임시 응답
      const responses = [
        '🤔 좋은 질문이네요. 성경에서 관련된 말씀을 찾아보겠습니다.',
        '📖 "염려하지 말라 내가 너와 함께 함이라" (이사야 41:10)',
        '🙏 어려운 상황이시군요. 함께 기도해보시겠어요?',
        '💡 성경의 지혜로 답변드리겠습니다. 조금 더 구체적으로 말씀해주시겠어요?'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // 응답 전송
      socket.to(`user-${userId}`).emit('receive-message', {
        type: 'bot',
        message: randomResponse,
        timestamp: new Date(),
        sessionId,
        verses: message.includes('성경') ? ['이사야 41:10'] : []
      });
      
    } catch (error) {
      console.error('❌ 메시지 처리 오류:', error);
      socket.emit('error', { 
        message: '메시지 처리 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('👋 사용자 연결 해제:', socket.id);
  });

  // 에러 처리
  socket.on('error', (error) => {
    console.error('🔌 Socket 오류:', error);
  });
});

// 전역 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('🚨 서버 오류:', error);
  
  // 에러 유형별 처리
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: '잘못된 요청 형식입니다.',
      message: '올바른 JSON 형식으로 요청해주세요.'
    });
  }
  
  res.status(error.status || 500).json({
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? error.message : '잠시 후 다시 시도해주세요.',
    timestamp: new Date().toISOString()
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  console.log(`❌ 404 에러: ${req.method} ${req.url}`);
  
  res.status(404).json({
    error: '요청하신 경로를 찾을 수 없습니다.',
    requestedPath: req.url,
    method: req.method,
    message: '올바른 API 경로를 확인해주세요.',
    availableEndpoints: {
      'GET /': 'API 정보',
      'GET /api/health': '시스템 상태',
      'GET /api/docs': 'API 문서',
      'POST /api/chat/start': '채팅 세션 시작',
      'POST /api/chat/message': '채팅 메시지 전송'
    },
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // 데이터베이스 연결
    console.log('🔄 데이터베이스 연결 중...');
    await database.connect();
    console.log('✅ 데이터베이스 연결 완료');
    
    // 서버 시작
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AI Bible Assistant 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📖 API 문서: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 헬스 체크: http://localhost:${PORT}/api/health`);
      console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS 허용: ${process.env.CORS_ORIGINS || 'http://localhost:3000'}`);
    });
    
  } catch (error) {
    console.error('💀 서버 시작 실패:', error);
    process.exit(1);
  }
};

// 서버 시작
startServer();

module.exports = app;
