const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ClaudeService = require('../services/ClaudeService');
const BibleSearchService = require('../services/BibleSearchService');
const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// 서비스 인스턴스 생성
const claudeService = new ClaudeService();
const bibleService = new BibleSearchService();

/**
 * 새 채팅 세션 시작
 * POST /api/chat/start
 */
router.post('/start', async (req, res) => {
  try {
    const { userId, nickname } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId가 필요합니다.' });
    }

    // 사용자 확인/생성
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        nickname: nickname || '익명',
        lastActiveAt: new Date()
      });
      await user.save();
    } else {
      await user.updateLastActive();
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

    // 환영 메시지 생성
    const welcomeMessage = new Message({
      messageId: uuidv4(),
      sessionId,
      userId,
      type: 'bot',
      content: {
        text: `안녕하세요, ${user.nickname}님! 저는 AI Bible Assistant입니다. 🙏\n\n성경의 지혜를 바탕으로 여러분의 고민과 질문에 함께 답을 찾아가겠습니다.\n\n어떤 일로 마음이 힘드시거나 궁금한 점이 있으신가요? 편안하게 말씨해 주세요.`,
        metadata: {
          stage: 'greeting',
          intent: 'welcome'
        }
      },
      createdAt: new Date()
    });

    await welcomeMessage.save();
    await session.incrementMessageCount();

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
    console.error('세션 시작 오류:', error);
    res.status(500).json({ error: '세션 시작 중 오류가 발생했습니다.' });
  }
});

/**
 * 메시지 전송
 * POST /api/chat/message
 */
router.post('/message', async (req, res) => {
  try {
    const { sessionId, userId, message } = req.body;

    if (!sessionId || !userId || !message) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    // 세션 확인
    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: '비활성 세션입니다.' });
    }

    // 사용자 메시지 저장
    const userMessage = new Message({
      messageId: uuidv4(),
      sessionId,
      userId,
      type: 'user',
      content: {
        text: message
      },
      createdAt: new Date()
    });

    await userMessage.save();
    await session.incrementMessageCount();

    // 사용자 의도 분석
    const analysis = await claudeService.analyzeUserIntent(message);
    userMessage.content.metadata = analysis;
    await userMessage.save();

    // 이전 대화 내역 가져오기
    const recentMessages = await Message.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type content createdAt');

    const sessionHistory = recentMessages.reverse().map(msg => ({
      type: msg.type,
      content: msg.content.text,
      timestamp: msg.createdAt
    }));

    // 관련 성경 구절 검색
    let bibleVerses = [];
    
    if (analysis.topics && analysis.topics.length > 0) {
      bibleVerses = await bibleService.searchByKeywords(
        analysis.topics.join(' '), 
        { limit: 5 }
      );
    }

    if (bibleVerses.length === 0 && analysis.emotion !== 'neutral') {
      bibleVerses = await bibleService.getVersesForEmotion(analysis.emotion, 5);
    }

    if (bibleVerses.length === 0) {
      bibleVerses = await bibleService.getRandomVerses(null, 3);
    }

    // Claude AI 응답 생성
    const context = {
      sessionHistory,
      bibleVerses: bibleVerses.map(v => ({
        reference: v.reference,
        text: v.text,
        themes: v.themes
      })),
      userProfile: { userId },
      counselingStage: analysis.stage || 'exploration'
    };

    const claudeResponse = await claudeService.generateResponse(message, context);

    // 봇 응답 저장
    const botMessage = new Message({
      messageId: uuidv4(),
      sessionId,
      userId,
      type: 'bot',
      content: {
        text: claudeResponse.content,
        metadata: {
          stage: analysis.stage,
          intent: 'counseling_response',
          confidence: analysis.confidence
        }
      },
      bibleReferences: bibleVerses.map(v => ({
        reference: v.reference,
        text: v.text,
        context: 'counseling_support'
      })),
      claudeResponse: {
        modelUsed: claudeResponse.model,
        tokensUsed: claudeResponse.usage.totalTokens,
        responseTime: new Date() - userMessage.createdAt,
        confidence: analysis.confidence
      },
      createdAt: new Date()
    });

    await botMessage.save();
    await session.incrementMessageCount();

    // 세션에 사용된 성경 구절 추가
    for (const verse of bibleVerses) {
      await session.addBibleReference(verse.reference, verse.text, 1.0);
    }

    // 사용자 활동 업데이트
    const user = await User.findOne({ userId });
    if (user) {
      await user.updateLastActive();
    }

    res.json({
      success: true,
      response: {
        messageId: botMessage.messageId,
        type: 'bot',
        content: claudeResponse.content,
        bibleReferences: bibleVerses.map(v => ({
          reference: v.reference,
          text: v.text,
          themes: v.themes
        })),
        analysis: {
          emotion: analysis.emotion,
          stage: analysis.stage,
          topics: analysis.topics
        },
        timestamp: botMessage.createdAt
      }
    });

  } catch (error) {
    console.error('메시지 처리 오류:', error);
    res.status(500).json({ 
      error: '메시지 처리 중 오류가 발생했습니다.',
      message: '죄송합니다. 잠시 후 다시 시도해 주세요.'
    });
  }
});

/**
 * 세션 이력 조회
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId가 필요합니다.' });
    }

    // 세션 권한 확인
    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    }

    // 메시지 이력 조회
    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 })
      .select('messageId type content bibleReferences createdAt');

    const history = messages.map(msg => ({
      messageId: msg.messageId,
      type: msg.type,
      content: msg.content.text,
      bibleReferences: msg.bibleReferences || [],
      timestamp: msg.createdAt
    }));

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
        startedAt: session.startedAt,
        messageCount: session.messageCount
      },
      history
    });

  } catch (error) {
    console.error('이력 조회 오류:', error);
    res.status(500).json({ error: '이력 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 사용자 세션 목록 조회
 * GET /api/chat/sessions/:userId
 */
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const sessions = await ChatSession.find({ userId })
      .sort({ lastActiveAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('sessionId title status startedAt lastActiveAt messageCount counselingType');

    const totalSessions = await ChatSession.countDocuments({ userId });

    res.json({
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
        counselingType: session.counselingType,
        startedAt: session.startedAt,
        lastActiveAt: session.lastActiveAt,
        messageCount: session.messageCount
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSessions / parseInt(limit)),
        totalSessions,
        hasNext: parseInt(page) * parseInt(limit) < totalSessions
      }
    });

  } catch (error) {
    console.error('세션 목록 조회 오류:', error);
    res.status(500).json({ error: '세션 목록 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 세션 종료
 * POST /api/chat/end/:sessionId
 */
router.post('/end/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, feedback } = req.body;

    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    }

    // 세션 요약 생성 (간단히)
    const summary = {
      mainTopic: session.counselingType || 'general',
      keyInsights: ['성경의 지혜를 통한 위로'],
      suggestedActions: ['지속적인 기도와 말씀 묵상'],
      followUpNeeded: false
    };

    await session.complete(summary);

    // 사용자 세션 카운트 업데이트
    const user = await User.findOne({ userId });
    if (user) {
      await user.incrementSessionCount();
    }

    res.json({
      success: true,
      message: '상담 세션이 종료되었습니다.',
      summary
    });

  } catch (error) {
    console.error('세션 종료 오류:', error);
    res.status(500).json({ error: '세션 종료 중 오류가 발생했습니다.' });
  }
});

module.exports = router;