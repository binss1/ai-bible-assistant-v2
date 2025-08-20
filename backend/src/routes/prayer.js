const express = require('express');
const { v4: uuidv4 } = require('uuid');
const ClaudeService = require('../services/ClaudeService');
const BibleSearchService = require('../services/BibleSearchService');
const ChatSession = require('../models/ChatSession');
const Message = require('../models/Message');

const router = express.Router();

// 서비스 인스턴스
const claudeService = new ClaudeService();
const bibleService = new BibleSearchService();

/**
 * 개인화된 기도문 생성
 * POST /api/prayer/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { sessionId, userId, prayerRequest, includeTopics } = req.body;

    if (!sessionId || !userId || !prayerRequest) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    // 세션 확인
    const session = await ChatSession.findOne({ sessionId, userId });
    if (!session) {
      return res.status(404).json({ error: '세션을 찾을 수 없습니다.' });
    }

    // 세션의 대화 내용 가져오기
    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 })
      .select('type content bibleReferences');

    // 상담 내용 요약 생성
    const counselingContent = messages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content.text)
      .join('\n');

    // 세션에서 사용된 성경 구절들 수집
    let sessionBibleVerses = [];
    if (session.bibleReferences && session.bibleReferences.length > 0) {
      sessionBibleVerses = session.bibleReferences.slice(0, 5); // 최대 5개
    }

    // 추가 주제 기반 성경 구절 검색
    if (includeTopics && includeTopics.length > 0) {
      const additionalVerses = await bibleService.searchByThemes(includeTopics, 3);
      const additionalFormattedVerses = additionalVerses.map(v => ({
        reference: v.reference,
        text: v.text
      }));
      sessionBibleVerses = [...sessionBibleVerses, ...additionalFormattedVerses];
    }

    // 기도문이 없을 경우 기본 구절들 추가
    if (sessionBibleVerses.length === 0) {
      const defaultVerses = await bibleService.searchByThemes(['위로', '소망', '감사'], 3);
      sessionBibleVerses = defaultVerses.map(v => ({
        reference: v.reference,
        text: v.text
      }));
    }

    // 기도문 내용 구성
    const prayerContent = `
상담 내용:
${counselingContent}

기도 요청사항:
${prayerRequest}

주요 주제: ${includeTopics ? includeTopics.join(', ') : '일반적인 위로와 인도'}
`;

    // Claude AI로 개인화된 기도문 생성
    const prayerResult = await claudeService.generatePersonalizedPrayer(
      prayerContent,
      sessionBibleVerses
    );

    // 기도문을 세션에 저장
    session.generatedPrayer = {
      content: prayerResult.prayer,
      generatedAt: new Date(),
      bibleReferences: prayerResult.bibleReferences
    };
    await session.save();

    // 기도문 메시지로 저장
    const prayerMessage = new Message({
      messageId: uuidv4(),
      sessionId,
      userId,
      type: 'bot',
      content: {
        text: `🙏 **개인화된 기도문**\n\n${prayerResult.prayer}`,
        metadata: {
          stage: 'prayer',
          intent: 'prayer_generation',
          prayerType: 'personalized'
        }
      },
      bibleReferences: sessionBibleVerses.map(v => ({
        reference: v.reference,
        text: v.text,
        context: 'prayer_support'
      })),
      createdAt: new Date()
    });

    await prayerMessage.save();
    await session.incrementMessageCount();

    res.json({
      success: true,
      prayer: {
        messageId: prayerMessage.messageId,
        content: prayerResult.prayer,
        bibleReferences: sessionBibleVerses.map(v => ({
          reference: v.reference,
          text: v.text
        })),
        generatedAt: prayerResult.generatedAt,
        topics: includeTopics || []
      },
      usage: {
        tokensUsed: prayerResult.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('기도문 생성 오류:', error);
    res.status(500).json({ 
      error: '기도문 생성 중 오류가 발생했습니다.',
      message: error.message
    });
  }
});

/**
 * 주제별 기도문 템플릿 제공
 * GET /api/prayer/template/:topic
 */
router.get('/template/:topic', async (req, res) => {
  try {
    const { topic } = req.params;

    const prayerTemplates = {
      gratitude: {
        title: '감사 기도',
        content: '하나님, 오늘도 주님의 은혜와 사랑으로 인도해 주심을 감사드립니다...',
        bibleReferences: ['샴젅1:18', '시100:4', '엥5:20'],
        keywords: ['감사', '은혜', '찬양']
      },
      guidance: {
        title: '인도 기도',
        content: '하나님, 제가 어떤 길로 가야 할지 알려 주시옵소서...',
        bibleReferences: ['시25:9', '잠3:5-6', '사30:21'],
        keywords: ['인도', '지혜', '방향']
      },
      comfort: {
        title: '위로 기도',
        content: '하나님, 지금 제 마음이 무겱고 힘듭니다. 주님의 위로가 필요합니다...',
        bibleReferences: ['시23:4', '마11:28', '고후1:3-4'],
        keywords: ['위로', '평안', '쉰']
      },
      strength: {
        title: '힘 주시는 기도',
        content: '하나님, 제게 힘을 주시옵소서. 주님 안에서 모든 것을 할 수 있습니다...',
        bibleReferences: ['빜4:13', '사40:31', '고후12:9'],
        keywords: ['힘', '능력', '강함']
      },
      forgiveness: {
        title: '용서 기도',
        content: '하나님, 제 죄를 용서해 주시옵소서. 또한 저를 해치는 자들을 용서할 수 있게 도와주세요...',
        bibleReferences: ['요일1:9', '마6:14-15', '엥4:32'],
        keywords: ['용서', '회개', '화해']
      },
      healing: {
        title: '치유 기도',
        content: '하나님, 제 마음과 몸을 치유해 주시옵소서. 주님의 치유하심을 믿습니다...',
        bibleReferences: ['시103:3', '렀17:14', '약5:15'],
        keywords: ['치유', '회복', '건강']
      }
    };

    const template = prayerTemplates[topic];
    if (!template) {
      return res.status(404).json({ 
        error: '지원하지 않는 기도 주제입니다.',
        availableTopics: Object.keys(prayerTemplates)
      });
    }

    // 관련 성경 구절 상세 정보 가져오기
    const detailedVerses = [];
    for (const ref of template.bibleReferences) {
      try {
        const verse = await bibleService.searchByKeywords(ref, { limit: 1 });
        if (verse.length > 0) {
          detailedVerses.push({
            reference: verse[0].reference,
            text: verse[0].text
          });
        }
      } catch (error) {
        console.log(`구절 조회 실패: ${ref}`);
      }
    }

    res.json({
      success: true,
      template: {
        topic,
        title: template.title,
        content: template.content,
        bibleReferences: detailedVerses,
        keywords: template.keywords
      }
    });

  } catch (error) {
    console.error('기도 템플릿 조회 오류:', error);
    res.status(500).json({ error: '기도 템플릿 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 일일 기도문 추천
 * GET /api/prayer/daily
 */
router.get('/daily', async (req, res) => {
  try {
    const { userId } = req.query;

    // 오늘 날짜 기반 시드로 일관된 추천
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // 사용자별 최근 상담 주제 분석 (선택적)
    let userThemes = ['감사', '인도', '평안'];
    
    if (userId) {
      const recentSessions = await ChatSession.find({ userId })
        .sort({ lastActiveAt: -1 })
        .limit(3)
        .select('bibleReferences counselingType');

      // 최근 세션에서 주요 주제 추출
      const recentThemes = [];
      recentSessions.forEach(session => {
        if (session.bibleReferences) {
          session.bibleReferences.forEach(ref => {
            // 주제 추출 로직 (간단히)
            if (ref.text && ref.text.includes('사랑')) recentThemes.push('사랑');
            if (ref.text && ref.text.includes('평안')) recentThemes.push('평안');
            if (ref.text && ref.text.includes('지혜')) recentThemes.push('지혜');
          });
        }
      });

      if (recentThemes.length > 0) {
        userThemes = [...new Set(recentThemes)].slice(0, 3);
      }
    }

    // 추천 성경 구절 가져오기
    const dailyVerses = await bibleService.searchByThemes(userThemes, 5);

    // 오늘의 기도문 생성
    const dailyPrayerPrompt = `
오늘 날짜: ${today.toLocaleDateString('ko-KR')}
추천 주제: ${userThemes.join(', ')}

하루를 시작하며 하나님께 드리는 감사와 간구의 기도문을 작성해주세요.
- 하루를 주신 하나님께 감사
- 하루 동안의 인도와 보호 요청
- 지혜와 평안을 구하는 기도
- 200-300단어 길이
`;

    const dailyPrayerResult = await claudeService.generatePersonalizedPrayer(
      dailyPrayerPrompt,
      dailyVerses.slice(0, 3).map(v => ({
        reference: v.reference,
        text: v.text
      }))
    );

    res.json({
      success: true,
      dailyPrayer: {
        date: dateString,
        content: dailyPrayerResult.prayer,
        themes: userThemes,
        bibleReferences: dailyVerses.slice(0, 3).map(v => ({
          reference: v.reference,
          text: v.text,
          themes: v.themes
        })),
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('일일 기도문 생성 오류:', error);
    res.status(500).json({ error: '일일 기도문 생성 중 오류가 발생했습니다.' });
  }
});

/**
 * 사용자의 저장된 기도문 목록
 * GET /api/prayer/saved/:userId
 */
router.get('/saved/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // 사용자의 기도문이 포함된 세션들 찾기
    const sessions = await ChatSession.find({
      userId,
      'generatedPrayer.content': { $exists: true }
    })
    .sort({ 'generatedPrayer.generatedAt': -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .select('sessionId title generatedPrayer startedAt');

    const savedPrayers = sessions.map(session => ({
      sessionId: session.sessionId,
      sessionTitle: session.title,
      prayer: {
        content: session.generatedPrayer.content,
        bibleReferences: session.generatedPrayer.bibleReferences,
        generatedAt: session.generatedPrayer.generatedAt
      },
      sessionDate: session.startedAt
    }));

    const totalCount = await ChatSession.countDocuments({
      userId,
      'generatedPrayer.content': { $exists: true }
    });

    res.json({
      success: true,
      savedPrayers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: parseInt(page) * parseInt(limit) < totalCount
      }
    });

  } catch (error) {
    console.error('저장된 기도문 조회 오류:', error);
    res.status(500).json({ error: '저장된 기도문 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 기도 주제 목록 조회
 * GET /api/prayer/topics
 */
router.get('/topics', (req, res) => {
  try {
    const prayerTopics = [
      {
        id: 'gratitude',
        name: '감사 기도',
        description: '하나님의 은혜에 대한 감사',
        icon: '🙏'
      },
      {
        id: 'guidance',
        name: '인도 기도',
        description: '길을 인도해 달라는 기도',
        icon: '🧭'
      },
      {
        id: 'comfort',
        name: '위로 기도',
        description: '어려운 시기의 위로를 구하는 기도',
        icon: '🤗'
      },
      {
        id: 'strength',
        name: '힘 주시는 기도',
        description: '어려움을 이겨낼 힘을 구하는 기도',
        icon: '💪'
      },
      {
        id: 'forgiveness',
        name: '용서 기도',
        description: '죄 사함과 화해를 위한 기도',
        icon: '❤️'
      },
      {
        id: 'healing',
        name: '치유 기도',
        description: '마음과 몸의 치유를 위한 기도',
        icon: '✨'
      },
      {
        id: 'wisdom',
        name: '지혜 기도',
        description: '올바른 판단을 위한 지혜를 구하는 기도',
        icon: '🧠'
      },
      {
        id: 'peace',
        name: '평안 기도',
        description: '마음의 평안을 구하는 기도',
        icon: '🕊️'
      }
    ];

    res.json({
      success: true,
      topics: prayerTopics
    });

  } catch (error) {
    console.error('기도 주제 조회 오류:', error);
    res.status(500).json({ error: '기도 주제 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;