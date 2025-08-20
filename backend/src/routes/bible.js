const express = require('express');
const BibleSearchService = require('../services/BibleSearchService');
const BibleVerse = require('../models/BibleVerse');

const router = express.Router();
const bibleService = new BibleSearchService();

/**
 * 키워드로 성경 구절 검색
 * GET /api/bible/search?q=키워드&category=love&limit=10
 */
router.get('/search', async (req, res) => {
  try {
    const { q, category, testament, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }

    const searchOptions = {
      category: category || null,
      testament: testament || null,
      limit: Math.min(parseInt(limit), 50) // 최대 50개로 제한
    };

    const verses = await bibleService.searchByKeywords(q.trim(), searchOptions);

    res.json({
      success: true,
      query: q,
      options: searchOptions,
      results: verses.map(verse => ({
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        themes: verse.themes,
        category: verse.category,
        usageCount: verse.usageCount
      })),
      count: verses.length
    });

  } catch (error) {
    console.error('성경 검색 오류:', error);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다.' });
  }
});

/**
 * 주제별 성경 구절 검색
 * GET /api/bible/themes?themes=사랑,믿음&limit=10
 */
router.get('/themes', async (req, res) => {
  try {
    const { themes, limit = 10 } = req.query;

    if (!themes) {
      return res.status(400).json({ error: '주제를 선택해주세요.' });
    }

    const themeArray = themes.split(',').map(theme => theme.trim());
    const verses = await bibleService.searchByThemes(
      themeArray, 
      Math.min(parseInt(limit), 50)
    );

    res.json({
      success: true,
      themes: themeArray,
      results: verses.map(verse => ({
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        themes: verse.themes,
        category: verse.category
      })),
      count: verses.length
    });

  } catch (error) {
    console.error('주제별 검색 오류:', error);
    res.status(500).json({ error: '주제별 검색 중 오류가 발생했습니다.' });
  }
});

/**
 * 감정 상태에 맞는 성경 구절 추천
 * GET /api/bible/emotion/:emotion
 */
router.get('/emotion/:emotion', async (req, res) => {
  try {
    const { emotion } = req.params;
    const { limit = 5 } = req.query;

    const supportedEmotions = [
      'sad', 'anxious', 'angry', 'hopeful', 'grateful', 
      'confused', 'lonely', 'peaceful'
    ];

    if (!supportedEmotions.includes(emotion)) {
      return res.status(400).json({ 
        error: '지원하지 않는 감정입니다.',
        supportedEmotions
      });
    }

    const verses = await bibleService.getVersesForEmotion(
      emotion, 
      Math.min(parseInt(limit), 20)
    );

    res.json({
      success: true,
      emotion,
      message: `${emotion} 감정에 도움이 되는 성경 구절들입니다.`,
      results: verses.map(verse => ({
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        themes: verse.themes,
        category: verse.category
      })),
      count: verses.length
    });

  } catch (error) {
    console.error('감정별 추천 오류:', error);
    res.status(500).json({ error: '추천 구절 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 상담 주제에 맞는 성경 구절 추천
 * GET /api/bible/counseling/:topic
 */
router.get('/counseling/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const { urgency = 'medium', limit = 8 } = req.query;

    const supportedTopics = [
      'relationship', 'family', 'work', 'health', 
      'financial', 'faith', 'decision'
    ];

    if (!supportedTopics.includes(topic)) {
      return res.status(400).json({ 
        error: '지원하지 않는 상담 주제입니다.',
        supportedTopics
      });
    }

    const verses = await bibleService.getVersesForCounseling(
      topic, 
      urgency, 
      Math.min(parseInt(limit), 20)
    );

    res.json({
      success: true,
      topic,
      urgency,
      message: `${topic} 관련 상담에 도움이 되는 성경 구절들입니다.`,
      results: verses.map(verse => ({
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        themes: verse.themes,
        category: verse.category
      })),
      count: verses.length
    });

  } catch (error) {
    console.error('상담 주제별 추천 오류:', error);
    res.status(500).json({ error: '상담 구절 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 인기 성경 구절 조회
 * GET /api/bible/popular?limit=10
 */
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const verses = await bibleService.getPopularVerses(
      Math.min(parseInt(limit), 50)
    );

    res.json({
      success: true,
      message: '많이 사용된 성경 구절들입니다.',
      results: verses.map(verse => ({
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        themes: verse.themes,
        category: verse.category,
        usageCount: verse.usageCount
      })),
      count: verses.length
    });

  } catch (error) {
    console.error('인기 구절 조회 오류:', error);
    res.status(500).json({ error: '인기 구절 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 무작위 성경 구절 조회
 * GET /api/bible/random?category=love&limit=5
 */
router.get('/random', async (req, res) => {
  try {
    const { category, limit = 5 } = req.query;

    const verses = await bibleService.getRandomVerses(
      category || null,
      Math.min(parseInt(limit), 20)
    );

    res.json({
      success: true,
      category: category || 'all',
      message: '무작위로 선택된 성경 구절들입니다.',
      results: verses.map(verse => ({
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        themes: verse.themes,
        category: verse.category
      })),
      count: verses.length
    });

  } catch (error) {
    console.error('무작위 구절 조회 오류:', error);
    res.status(500).json({ error: '무작위 구절 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 특정 성경 구절 조회
 * GET /api/bible/verse/:reference
 */
router.get('/verse/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const verse = await BibleVerse.findOne({ reference });
    
    if (!verse) {
      return res.status(404).json({ error: '해당 성경 구절을 찾을 수 없습니다.' });
    }

    // 사용 횟수 증가
    await verse.incrementUsage();

    res.json({
      success: true,
      verse: {
        reference: verse.reference,
        text: verse.text,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        themes: verse.themes,
        category: verse.category,
        testament: verse.testament,
        usageCount: verse.usageCount
      }
    });

  } catch (error) {
    console.error('구절 조회 오류:', error);
    res.status(500).json({ error: '구절 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 성경 통계 정보 조회
 * GET /api/bible/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const totalVerses = await BibleVerse.countDocuments();
    const oldTestament = await BibleVerse.countDocuments({ testament: 'old' });
    const newTestament = await BibleVerse.countDocuments({ testament: 'new' });

    // 카테고리별 통계
    const categoryStats = await BibleVerse.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 가장 많이 사용된 주제들
    const topThemes = await BibleVerse.aggregate([
      { $unwind: '$themes' },
      {
        $group: {
          _id: '$themes',
          count: { $sum: 1 },
          usageCount: { $sum: '$usageCount' }
        }
      },
      {
        $sort: { usageCount: -1, count: -1 }
      },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      stats: {
        totalVerses,
        testament: {
          old: oldTestament,
          new: newTestament
        },
        categories: categoryStats,
        topThemes: topThemes.map(theme => ({
          theme: theme._id,
          verseCount: theme.count,
          usageCount: theme.usageCount
        }))
      }
    });

  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
});

/**
 * 사용 가능한 필터 옵션 조회
 * GET /api/bible/options
 */
router.get('/options', async (req, res) => {
  try {
    const categories = await BibleVerse.distinct('category');
    const themes = await BibleVerse.distinct('themes');
    const books = await BibleVerse.distinct('book');

    res.json({
      success: true,
      options: {
        categories: categories.sort(),
        themes: themes.sort(),
        books: books.sort(),
        emotions: [
          'sad', 'anxious', 'angry', 'hopeful', 'grateful', 
          'confused', 'lonely', 'peaceful'
        ],
        counselingTopics: [
          'relationship', 'family', 'work', 'health', 
          'financial', 'faith', 'decision'
        ],
        testaments: ['old', 'new']
      }
    });

  } catch (error) {
    console.error('옵션 조회 오류:', error);
    res.status(500).json({ error: '옵션 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;