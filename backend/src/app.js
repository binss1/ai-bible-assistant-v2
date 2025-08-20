const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
  }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-bible-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error);
  process.exit(1);
});

// 라우터 설정
const chatRoutes = require('./routes/chat');
const bibleRoutes = require('./routes/bible');
const prayerRoutes = require('./routes/prayer');

app.use('/api/chat', chatRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/prayer', prayerRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'AI Bible Assistant API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('👤 사용자 연결:', socket.id);

  // 채팅방 입장
  socket.on('join-chat', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 사용자 ${userId}가 채팅방에 입장했습니다.`);
  });

  // 메시지 전송
  socket.on('send-message', async (data) => {
    try {
      const { userId, message, sessionId } = data;
      
      // 메시지 처리 로직 (나중에 구현)
      console.log('📨 메시지 수신:', { userId, message, sessionId });
      
      // 클라이언트에게 응답 (임시)
      socket.to(`user-${userId}`).emit('receive-message', {
        type: 'bot',
        message: '안녕하세요! AI Bible Assistant입니다. 어떤 고민이 있으신가요?',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      socket.emit('error', { message: '메시지 처리 중 오류가 발생했습니다.' });
    }
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log('👋 사용자 연결 해제:', socket.id);
  });
});

// 에러 핸들링 미들웨어
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    error: '요청하신 경로를 찾을 수 없습니다.'
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 AI Bible Assistant 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📖 API 문서: http://localhost:${PORT}/`);
});

module.exports = app;