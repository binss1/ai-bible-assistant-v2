import { api } from './api';

class BibleService {
  constructor() {
    this.embeddings = null;
    this.bibleData = null;
    this.isInitialized = false;
    this.supportedTranslations = ['개역개정', 'NIV', 'ESV', 'NLT'];
    this.bookNames = this.initializeBookNames();
  }

  initializeBookNames() {
    return {
      // 구약 39권
      '창세기': { english: 'Genesis', testament: 'old', chapters: 50 },
      '출애굽기': { english: 'Exodus', testament: 'old', chapters: 40 },
      '레위기': { english: 'Leviticus', testament: 'old', chapters: 27 },
      '민수기': { english: 'Numbers', testament: 'old', chapters: 36 },
      '신명기': { english: 'Deuteronomy', testament: 'old', chapters: 34 },
      '여호수아': { english: 'Joshua', testament: 'old', chapters: 24 },
      '사사기': { english: 'Judges', testament: 'old', chapters: 21 },
      '룻기': { english: 'Ruth', testament: 'old', chapters: 4 },
      '사무엘상': { english: '1 Samuel', testament: 'old', chapters: 31 },
      '사무엘하': { english: '2 Samuel', testament: 'old', chapters: 24 },
      '열왕기상': { english: '1 Kings', testament: 'old', chapters: 22 },
      '열왕기하': { english: '2 Kings', testament: 'old', chapters: 25 },
      '역대상': { english: '1 Chronicles', testament: 'old', chapters: 29 },
      '역대하': { english: '2 Chronicles', testament: 'old', chapters: 36 },
      '에스라': { english: 'Ezra', testament: 'old', chapters: 10 },
      '느헤미야': { english: 'Nehemiah', testament: 'old', chapters: 13 },
      '에스더': { english: 'Esther', testament: 'old', chapters: 10 },
      '욥기': { english: 'Job', testament: 'old', chapters: 42 },
      '시편': { english: 'Psalms', testament: 'old', chapters: 150 },
      '잠언': { english: 'Proverbs', testament: 'old', chapters: 31 },
      '전도서': { english: 'Ecclesiastes', testament: 'old', chapters: 12 },
      '아가': { english: 'Song of Songs', testament: 'old', chapters: 8 },
      '이사야': { english: 'Isaiah', testament: 'old', chapters: 66 },
      '예레미야': { english: 'Jeremiah', testament: 'old', chapters: 52 },
      '예레미야애가': { english: 'Lamentations', testament: 'old', chapters: 5 },
      '에스겔': { english: 'Ezekiel', testament: 'old', chapters: 48 },
      '다니엘': { english: 'Daniel', testament: 'old', chapters: 12 },
      '호세아': { english: 'Hosea', testament: 'old', chapters: 14 },
      '요엘': { english: 'Joel', testament: 'old', chapters: 3 },
      '아모스': { english: 'Amos', testament: 'old', chapters: 9 },
      '오바댜': { english: 'Obadiah', testament: 'old', chapters: 1 },
      '요나': { english: 'Jonah', testament: 'old', chapters: 4 },
      '미가': { english: 'Micah', testament: 'old', chapters: 7 },
      '나훔': { english: 'Nahum', testament: 'old', chapters: 3 },
      '하박국': { english: 'Habakkuk', testament: 'old', chapters: 3 },
      '스바냐': { english: 'Zephaniah', testament: 'old', chapters: 3 },
      '학개': { english: 'Haggai', testament: 'old', chapters: 2 },
      '스가랴': { english: 'Zechariah', testament: 'old', chapters: 14 },
      '말라기': { english: 'Malachi', testament: 'old', chapters: 4 },

      // 신약 27권
      '마태복음': { english: 'Matthew', testament: 'new', chapters: 28 },
      '마가복음': { english: 'Mark', testament: 'new', chapters: 16 },
      '누가복음': { english: 'Luke', testament: 'new', chapters: 24 },
      '요한복음': { english: 'John', testament: 'new', chapters: 21 },
      '사도행전': { english: 'Acts', testament: 'new', chapters: 28 },
      '로마서': { english: 'Romans', testament: 'new', chapters: 16 },
      '고린도전서': { english: '1 Corinthians', testament: 'new', chapters: 16 },
      '고린도후서': { english: '2 Corinthians', testament: 'new', chapters: 13 },
      '갈라디아서': { english: 'Galatians', testament: 'new', chapters: 6 },
      '에베소서': { english: 'Ephesians', testament: 'new', chapters: 6 },
      '빌립보서': { english: 'Philippians', testament: 'new', chapters: 4 },
      '골로새서': { english: 'Colossians', testament: 'new', chapters: 4 },
      '데살로니가전서': { english: '1 Thessalonians', testament: 'new', chapters: 5 },
      '데살로니가후서': { english: '2 Thessalonians', testament: 'new', chapters: 3 },
      '디모데전서': { english: '1 Timothy', testament: 'new', chapters: 6 },
      '디모데후서': { english: '2 Timothy', testament: 'new', chapters: 4 },
      '디도서': { english: 'Titus', testament: 'new', chapters: 3 },
      '빌레몬서': { english: 'Philemon', testament: 'new', chapters: 1 },
      '히브리서': { english: 'Hebrews', testament: 'new', chapters: 13 },
      '야고보서': { english: 'James', testament: 'new', chapters: 5 },
      '베드로전서': { english: '1 Peter', testament: 'new', chapters: 5 },
      '베드로후서': { english: '2 Peter', testament: 'new', chapters: 3 },
      '요한일서': { english: '1 John', testament: 'new', chapters: 5 },
      '요한이서': { english: '2 John', testament: 'new', chapters: 1 },
      '요한삼서': { english: '3 John', testament: 'new', chapters: 1 },
      '유다서': { english: 'Jude', testament: 'new', chapters: 1 },
      '요한계시록': { english: 'Revelation', testament: 'new', chapters: 22 }
    };
  }

  // 초기화 함수
  async initialize() {
    if (this.isInitialized) return;

    try {
      // 백엔드에서 성경 데이터 초기화 상태 확인
      const response = await api.get('/bible/status');
      this.isInitialized = response.data.initialized;
      
      if (!this.isInitialized) {
        console.warn('성경 데이터가 아직 초기화되지 않았습니다.');
      }
    } catch (error) {
      console.error('성경 서비스 초기화 실패:', error);
    }
  }

  // 의미론적 검색 (임베딩 기반)
  async semanticSearch(query, options = {}) {
    await this.initialize();

    try {
      const searchOptions = {
        query: query.trim(),
        limit: options.limit || 10,
        threshold: options.threshold || 0.7,
        includeContext: options.includeContext !== false,
        translations: options.translations || ['개역개정'],
        testament: options.testament || 'both', // 'old', 'new', 'both'
        books: options.books || null,
        ...options
      };

      const response = await api.post('/bible/search/semantic', searchOptions);
      return this.processSearchResults(response.data, 'semantic');
    } catch (error) {
      console.error('의미론적 검색 실패:', error);
      throw new Error('성경 의미 검색 중 오류가 발생했습니다.');
    }
  }

  // 키워드 검색
  async keywordSearch(keywords, options = {}) {
    await this.initialize();

    try {
      const searchOptions = {
        keywords: keywords.trim(),
        exact: options.exact || false,
        caseSensitive: options.caseSensitive || false,
        limit: options.limit || 20,
        book: options.book || null,
        chapter: options.chapter || null,
        testament: options.testament || 'both',
        ...options
      };

      const response = await api.post('/bible/search/keyword', searchOptions);
      return this.processSearchResults(response.data, 'keyword');
    } catch (error) {
      console.error('키워드 검색 실패:', error);
      throw new Error('성경 키워드 검색 중 오류가 발생했습니다.');
    }
  }

  // 주제별 검색
  async topicSearch(topic, options = {}) {
    await this.initialize();

    try {
      const topicMap = this.getTopicKeywords(topic);
      
      const searchOptions = {
        topic: topic.trim(),
        keywords: topicMap.keywords,
        relatedVerses: topicMap.relatedVerses,
        limit: options.limit || 15,
        testament: options.testament || 'both',
        ...options
      };

      const response = await api.post('/bible/search/topic', searchOptions);
      return this.processSearchResults(response.data, 'topic');
    } catch (error) {
      console.error('주제별 검색 실패:', error);
      throw new Error('성경 주제 검색 중 오류가 발생했습니다.');
    }
  }

  // 구절 참조로 검색
  async getVerseByReference(reference) {
    await this.initialize();

    try {
      const parsedRef = this.parseReference(reference);
      if (!parsedRef) {
        throw new Error('잘못된 구절 참조 형식입니다.');
      }

      const response = await api.get(`/bible/verse/${encodeURIComponent(reference)}`);
      return this.processVerseResult(response.data);
    } catch (error) {
      console.error('구절 참조 검색 실패:', error);
      throw new Error('구절을 찾을 수 없습니다.');
    }
  }

  // 장 전체 가져오기
  async getChapter(book, chapter, translation = '개역개정') {
    await this.initialize();

    try {
      const response = await api.get(`/bible/chapter/${book}/${chapter}`, {
        params: { translation }
      });
      return response.data;
    } catch (error) {
      console.error('장 조회 실패:', error);
      throw new Error('해당 장을 찾을 수 없습니다.');
    }
  }

  // 책 전체 가져오기
  async getBook(book, translation = '개역개정') {
    await this.initialize();

    try {
      const response = await api.get(`/bible/book/${book}`, {
        params: { translation }
      });
      return response.data;
    } catch (error) {
      console.error('책 조회 실패:', error);
      throw new Error('해당 책을 찾을 수 없습니다.');
    }
  }

  // 상황별 구절 추천
  async getVersesForSituation(situation, emotions = [], limit = 5) {
    try {
      const payload = {
        situation,
        emotions,
        limit
      };

      const response = await api.post('/bible/recommend/situation', payload);
      return this.processSearchResults(response.data, 'recommendation');
    } catch (error) {
      console.error('상황별 구절 추천 실패:', error);
      throw new Error('상황에 맞는 구절을 찾을 수 없습니다.');
    }
  }

  // 검색 결과 처리
  processSearchResults(results, searchType) {
    return results.map(result => ({
      id: result.id || `${result.book}_${result.chapter}_${result.verse}`,
      book: result.book,
      chapter: result.chapter,
      verse: result.verse,
      text: result.text,
      translation: result.translation || '개역개정',
      testament: this.bookNames[result.book]?.testament || 'unknown',
      reference: `${result.book} ${result.chapter}:${result.verse}`,
      score: result.score || 0,
      context: result.context || '',
      searchType,
      relevance: this.calculateRelevance(result.score, searchType),
      tags: result.tags || [],
      relatedVerses: result.relatedVerses || [],
      processedAt: new Date().toISOString()
    }));
  }

  // 단일 구절 결과 처리
  processVerseResult(result) {
    return {
      ...result,
      testament: this.bookNames[result.book]?.testament || 'unknown',
      reference: `${result.book} ${result.chapter}:${result.verse}`,
      bookInfo: this.bookNames[result.book] || {},
      processedAt: new Date().toISOString()
    };
  }

  // 관련성 계산
  calculateRelevance(score, searchType) {
    const thresholds = {
      semantic: { high: 0.8, medium: 0.6 },
      keyword: { high: 0.9, medium: 0.7 },
      topic: { high: 0.75, medium: 0.5 },
      recommendation: { high: 0.85, medium: 0.65 }
    };

    const threshold = thresholds[searchType] || thresholds.semantic;
    
    if (score >= threshold.high) return 'high';
    if (score >= threshold.medium) return 'medium';
    return 'low';
  }

  // 구절 참조 파싱
  parseReference(reference) {
    // 예: "요한복음 3:16", "마태복음 5:3-12", "시편 23"
    const patterns = [
      /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/, // 책 장:절 or 책 장:절-절
      /^(.+?)\s+(\d+)$/ // 책 장
    ];

    for (const pattern of patterns) {
      const match = reference.trim().match(pattern);
      if (match) {
        const book = match[1];
        const chapter = parseInt(match[2]);
        const startVerse = match[3] ? parseInt(match[3]) : null;
        const endVerse = match[4] ? parseInt(match[4]) : startVerse;

        if (this.bookNames[book]) {
          return {
            book,
            chapter,
            startVerse,
            endVerse,
            isRange: !!match[4]
          };
        }
      }
    }

    return null;
  }

  // 주제별 키워드 매핑
  getTopicKeywords(topic) {
    const topicMaps = {
      '사랑': {
        keywords: ['사랑', '애정', '은혜', '자비', '긍휼'],
        relatedVerses: ['요한일서 4:8', '고린도전서 13:4-8', '요한복음 3:16']
      },
      '믿음': {
        keywords: ['믿음', '신뢰', '확신', '소망'],
        relatedVerses: ['히브리서 11:1', '로마서 10:17', '마가복음 11:24']
      },
      '희망': {
        keywords: ['희망', '소망', '기대', '미래'],
        relatedVerses: ['로마서 15:13', '예레미야 29:11', '히브리서 6:19']
      },
      '용서': {
        keywords: ['용서', '회개', '회복', '화해'],
        relatedVerses: ['에베소서 4:32', '마태복음 6:14-15', '요한일서 1:9']
      },
      '평안': {
        keywords: ['평안', '평화', '안식', '위로'],
        relatedVerses: ['요한복음 14:27', '빌립보서 4:7', '마태복음 11:28']
      },
      '지혜': {
        keywords: ['지혜', '명철', '분별', '이해'],
        relatedVerses: ['잠언 9:10', '야고보서 1:5', '전도서 7:12']
      },
      '감사': {
        keywords: ['감사', '찬양', '기쁨', '축복'],
        relatedVerses: ['데살로니가전서 5:18', '시편 100:4', '빌립보서 4:6']
      }
    };

    return topicMaps[topic] || {
      keywords: [topic],
      relatedVerses: []
    };
  }

  // 즐겨찾기 관리
  async getFavorites() {
    try {
      const response = await api.get('/bible/favorites');
      return response.data;
    } catch (error) {
      console.error('즐겨찾기 조회 실패:', error);
      return [];
    }
  }

  async addFavorite(verse) {
    try {
      const response = await api.post('/bible/favorites', verse);
      return response.data;
    } catch (error) {
      console.error('즐겨찾기 추가 실패:', error);
      throw new Error('즐겨찾기 추가에 실패했습니다.');
    }
  }

  async removeFavorite(verseId) {
    try {
      await api.delete(`/bible/favorites/${verseId}`);
      return true;
    } catch (error) {
      console.error('즐겨찾기 제거 실패:', error);
      throw new Error('즐겨찾기 제거에 실패했습니다.');
    }
  }

  // 성경 통계
  async getBibleStats() {
    try {
      const response = await api.get('/bible/stats');
      return response.data;
    } catch (error) {
      console.error('성경 통계 조회 실패:', error);
      return null;
    }
  }

  // 오늘의 말씀
  async getTodaysVerse() {
    try {
      const response = await api.get('/bible/today');
      return this.processVerseResult(response.data);
    } catch (error) {
      console.error('오늘의 말씀 조회 실패:', error);
      throw new Error('오늘의 말씀을 가져올 수 없습니다.');
    }
  }

  // 랜덤 구절
  async getRandomVerse(testament = 'both') {
    try {
      const response = await api.get('/bible/random', {
        params: { testament }
      });
      return this.processVerseResult(response.data);
    } catch (error) {
      console.error('랜덤 구절 조회 실패:', error);
      throw new Error('랜덤 구절을 가져올 수 없습니다.');
    }
  }

  // 유틸리티 함수들
  getAllBooks() {
    return Object.keys(this.bookNames);
  }

  getBooksByTestament(testament) {
    return Object.entries(this.bookNames)
      .filter(([_, info]) => info.testament === testament)
      .map(([name, _]) => name);
  }

  getBookInfo(bookName) {
    return this.bookNames[bookName] || null;
  }

  isValidBook(bookName) {
    return !!this.bookNames[bookName];
  }

  isValidChapter(bookName, chapter) {
    const bookInfo = this.bookNames[bookName];
    return bookInfo && chapter >= 1 && chapter <= bookInfo.chapters;
  }
}

// 싱글톤 인스턴스 생성
export const bibleService = new BibleService();