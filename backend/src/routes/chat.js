const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// 임시 테스트 라우트 추가
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Chat API 테스트 성공!',
    timestamp: new Date(),
    availableRoutes: [
      'POST /api/chat/start - 새 채팅 세션 시작',
      'POST /api/chat/message - 메시지 전송',
      'GET /api/chat/history/:sessionId - 세션 이력 조회',
      'GET /api/chat/sessions/:userId - 사용자 세션 목록',
      'POST /api/chat/end/:sessionId - 세션 종료'
    ]
  });
});

// 간단한 세션 시작 (데이터베이스 의존성 제거)
router.post('/start', async (req, res) => {
  try {
    const { userId, nickname } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId가 필요합니다.' });
    }

    console.log('📝 세션 시작 요청:', { userId, nickname });

    // MongoDB 모델 로드 시도
    let ChatSession, Message, User;
    
    try {
      ChatSession = require('../models/ChatSession');
      Message = require('../models/Message');
      User = require('../models/User');
      console.log('✅ 모델 로드 성공');
    } catch (modelError) {
      console.error('❌ 모델 로드 실패:', modelError.message);
      
      // 임시 응답 (모델 없이)
      const sessionId = uuidv4();
      return res.json({
        success: true,
        sessionId,
        message: '임시 세션이 시작되었습니다 (DB 모델 없음)',
        welcomeMessage: {
          messageId: uuidv4(),
          type: 'bot',
          content: `안녕하세요, ${nickname || '익명'}님! 저는 AI Bible Assistant입니다. 🙏\n\n성경의 지혜를 바탕으로 여러분의 고민과 질문에 함께 답을 찾아가겠습니다.\n\n어떤 일로 마음이 힘드시거나 궁금한 점이 있으신가요? 편안하게 말씀해 주세요.`,
          timestamp: new Date()
        }
      });
    }

    // 데이터베이스 연결 상태 확인
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB 연결 상태:', mongoose.connection.readyState);
      return res.status(503).json({ 
        error: '데이터베이스 연결이 불안정합니다.',
        dbState: mongoose.connection.readyState 
      });
    }

    console.log('✅ MongoDB 연결 상태 양호');

    // 사용자 확인/생성
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        nickname: nickname || '익명',
        lastActiveAt: new Date()
      });
      await user.save();
      console.log('👤 새 사용자 생성:', userId);
    } else {
      await user.updateLastActive();
      console.log('👤 기존 사용자 확인:', userId);
    }

    // 새 세션 생성
    const sessionId = uuidv4();
    const session = new ChatSession({
      sessionId,
      userId,
      title: '새로운 상담',
      status: 'active',
      startedAt: new Date(),
      lastActiveAt: new Date()
    });

    await session.save();
    console.log('💬 새 세션 생성:', sessionId);

    // 환영 메시지 생성
    const welcomeMessage = new Message({
      messageId: uuidv4(),
      sessionId,
      userId,
      type: 'bot',
      content: {
        text: `안녕하세요, ${user.nickname}님! 저는 AI Bible Assistant입니다. 🙏\n\n성경의 지혜를 바탕으로 여러분의 고민과 질문에 함께 답을 찾아가겠습니다.\n\n어떤 일로 마음이 힘드시거나 궁금한 점이 있으신가요? 편안하게 말씀해 주세요.`,
        metadata: {
          stage: 'greeting',
          intent: 'welcome'
        }
      },
      createdAt: new Date()
    });

    await welcomeMessage.save();
    await session.incrementMessageCount();

    console.log('✅ 세션 시작 완료:', sessionId);

    res.json({
      success: true,
      sessionId,
      message: '새로운 상담 세션이 시작되었습니다.',
      welcomeMessage: {
        messageId: welcomeMessage.messageId,
        type: 'bot',
        content: welcomeMessage.content.text,
        timestamp: welcomeMessage.createdAt
      }
    });

  } catch (error) {
    console.error('❌ 세션 시작 오류:', error);
    res.status(500).json({ 
      error: '세션 시작 중 오류가 발생했습니다.',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 기존 메시지 전송 라우트는 그대로 유지...
router.post('/message', async (req, res) => {
  try {
    const { sessionId, userId, message } = req.body;

    if (!sessionId || !userId || !message) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    console.log('📨 메시지 수신:', { sessionId, userId, messagePreview: message.substring(0, 50) });

    // 임시 응답 (Claude AI 없이)
    const responses = [
      '🤔 좋은 질문이네요. 성경에서 관련된 말씀을 찾아보겠습니다.',
      '📖 "염려하지 말라 내가 너와 함께 함이라" (이사야 41:10)',
      '🙏 어려운 상황이시군요. 함께 기도해보시겠어요?',
      '💡 성경의 지혜로 답변드리겠습니다. 조금 더 구체적으로 말씀해주시겠어요?'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      success: true,
      response: {
        messageId: uuidv4(),
        type: 'bot',
        content: randomResponse,
        bibleReferences: [
          {
            reference: '이사야 41:10',
            text: '너는 두려워하지 말라 나는 너와 함께 함이라',
            themes: ['위로', '동행']
          }
        ],
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ 메시지 처리 오류:', error);
    res.status(500).json({ 
      error: '메시지 처리 중 오류가 발생했습니다.',
      message: '죄송합니다. 잠시 후 다시 시도해 주세요.'
    });
  }
});

module.exports = router;