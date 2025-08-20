const BibleVerse = require('../models/BibleVerse');

class BibleSearchService {
  constructor() {
    // 성경 책 이름 매핑
    this.bookNames = {
      '창': '창세기', '출': '출애굴기', '레': '레위기', '민': '민수기', '신': '신명기',
      '수': '여호수아', '삣': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
      '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하',
      '스': '에스라', '느': '느헤미야', '에': '에스더', '욕': '욕기', '시': '시편',
      '잠': '잠언', '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
      '애': '예레미야애가', '결': '에스겸', '단': '다니엘', '호': '호세아', '울': '요엘',
      '암': '아모스', '옵': '오바드', '움': '요나', '미': '미가', '나': '나훔',
      '합': '하박국', '습': '스바냐', '학': '학개', '슬': '스가랴', '말': '말라기',
      '마': '마태복음', '막': '마가복음', '누': '누가복음', '요': '요한복음',
      '행': '사도행전', '롤': '로마서', '고전': '고린도전서', '고후': '고린도후서',
      '갈': '갈라디아서', '엡': '에베소서', '빜': '빜립보서', '골': '골로새서',
      '살전': '데살로니가전서', '살후': '데살로니가후서', '딸전': '디모데전서', '딸후': '디모데후서',
      '딧': '디도서', '몬': '빌레몬서', '히': '히브리서', '약': '야고보서',
      '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한일서', '요이': '요한이서',
      '요삼': '요한삼서', '유': '유다서', '계': '요한계시록'
    };

    // 주제별 키워드 매핑
    this.themeKeywords = {
      '사랑': ['사랑', '애정', '자비', '긍혁', '은혜'],
      '믿음': ['믿음', '신뢰', '확신', '신앙'],
      '소망': ['소망', '희망', '기대', '약속'],
      '용서': ['용서', '사함', '화해', '회개'],
      '지혜': ['지혜', '명철', '분별', '깨달음'],
      '위로': ['위로', '안위', '평안', '쉰'],
      '인도': ['인도', '길', '방향', '인도하심'],
      '힘': ['힘', '능력', '강함', '권세'],
      '평화': ['평화', '평안', '화평', '안식'],
      '기쁨': ['기쁨', '즐거움', '감사', '찬양'],
      '기도': ['기도', '간구', '부르짖음', '간청'],
      '구원': ['구원', '구속', '해방', '건짐'],
      '가족': ['가족', '부모', '자녀', '형제'],
      '관계': ['관계', '친구', '이웃', '동료'],
      '일': ['일', '직업', '사명', '부르심'],
      '고난': ['고난', '시험', '환난', '어려움'],
      '치유': ['치유', '고침', '건강', '회복'],
      '감사': ['감사', '찬송', '영광', '찬양'],
      '겸손': ['겸손', '낮춤', '온유', '겸허'],
      '순종': ['순종', '복종', '따름', '청종']
    };
  }

  /**
   * 성경 구절 데이터 로드 (JSON 파일에서)
   */
  async loadBibleData(bibleData) {
    try {
      console.log('성경 데이터 로딩 시작...');
      
      const verses = [];
      let count = 0;
      
      for (const [reference, text] of Object.entries(bibleData)) {
        const verse = this.parseReference(reference, text);
        if (verse) {
          verses.push(verse);
          count++;
          
          // 배치 처리 (1000개씩)
          if (count % 1000 === 0) {
            await BibleVerse.insertMany(verses.splice(0, 1000), { ordered: false });
            console.log(`${count}개 구절 처리 완료...`);
          }
        }
      }
      
      // 남은 데이터 처리
      if (verses.length > 0) {
        await BibleVerse.insertMany(verses, { ordered: false });
      }
      
      console.log(`✅ 총 ${count}개 성경 구절 로딩 완료`);
      return count;
    } catch (error) {
      console.error('성경 데이터 로딩 오류:', error);
      throw error;
    }
  }

  /**
   * 성경 구절 참조 파싱
   */
  parseReference(reference, text) {
    try {
      // "창1:1" 형태에서 책, 장, 절 추출
      const match = reference.match(/^([가-힣]+)(\d+):(\d+)$/);
      if (!match) return null;

      const [, bookShort, chapter, verse] = match;
      const bookFull = this.bookNames[bookShort] || bookShort;
      
      // 주제와 카테고리 분석
      const themes = this.analyzeThemes(text);
      const category = this.categorizeVerse(text, themes);
      const keywords = this.extractKeywords(text);
      
      return {
        reference,
        text: text.trim(),
        book: bookFull,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        keywords,
        themes,
        category,
        testament: this.getTestament(bookShort),
        searchText: `${text} ${themes.join(' ')} ${keywords.join(' ')}`,
        usageCount: 0
      };
    } catch (error) {
      console.error(`구절 파싱 오류 (${reference}):`, error);
      return null;
    }
  }

  /**
   * 구약/신약 구분
   */
  getTestament(bookShort) {
    const oldTestament = [
      '창', '출', '레', '민', '신', '수', '삣', '룻', '삼상', '삼하',
      '왕상', '왕하', '대상', '대하', '스', '느', '에', '욕', '시',
      '잠', '전', '아', '사', '렘', '애', '결', '단', '호', '울',
      '암', '옵', '움', '미', '나', '합', '습', '학', '슬', '말'
    ];
    
    return oldTestament.includes(bookShort) ? 'old' : 'new';
  }

  /**
   * 키워드 추출
   */
  extractKeywords(text) {
    const keywords = [];
    const words = text.split(/\s+/);
    
    // 중요한 단어들 추출 (2글자 이상)
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w가-힣]/g, '');
      if (cleanWord.length >= 2) {
        keywords.push(cleanWord);
      }
    });
    
    return [...new Set(keywords)]; // 중복 제거
  }

  /**
   * 주제 분석
   */
  analyzeThemes(text) {
    const themes = [];
    
    for (const [theme, keywords] of Object.entries(this.themeKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          themes.push(theme);
          break;
        }
      }
    }
    
    return [...new Set(themes)];
  }

  /**
   * 카테고리 분류
   */
  categorizeVerse(text, themes) {
    // 주제 기반 카테고리 매핑
    const categoryMap = {
      '사랑': 'love',
      '믿음': 'faith',
      '소망': 'hope',
      '용서': 'forgiveness',
      '지혜': 'wisdom',
      '위로': 'comfort',
      '인도': 'guidance',
      '힘': 'strength',
      '평화': 'peace',
      '기쁨': 'joy',
      '기도': 'prayer',
      '구원': 'salvation',
      '가족': 'family',
      '관계': 'relationship',
      '일': 'work',
      '고난': 'suffering',
      '치유': 'healing',
      '감사': 'gratitude',
      '겸손': 'humility',
      '순종': 'obedience'
    };
    
    for (const theme of themes) {
      if (categoryMap[theme]) {
        return categoryMap[theme];
      }
    }
    
    return 'other';
  }

  /**
   * 키워드로 성경 구절 검색
   */
  async searchByKeywords(keywords, options = {}) {
    try {
      const {
        category = null,
        testament = null,
        limit = 10,
        includeContext = false
      } = options;

      let query = {
        $text: { $search: keywords }
      };

      if (category) {
        query.category = category;
      }
      
      if (testament) {
        query.testament = testament;
      }

      const verses = await BibleVerse.find(query)
        .select('reference text book chapter verse themes category')
        .sort({ score: { $meta: 'textScore' }, usageCount: -1 })
        .limit(limit);

      // 사용 횟수 증가
      if (verses.length > 0) {
        await Promise.all(verses.map(verse => verse.incrementUsage()));
      }

      return verses;
    } catch (error) {
      console.error('키워드 검색 오류:', error);
      return [];
    }
  }

  /**
   * 주제로 성경 구절 검색
   */
  async searchByThemes(themes, limit = 10) {
    try {
      const verses = await BibleVerse.find({
        themes: { $in: themes }
      })
      .select('reference text book chapter verse themes category')
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(limit);

      return verses;
    } catch (error) {
      console.error('주제 검색 오류:', error);
      return [];
    }
  }

  /**
   * 감정 상태에 맞는 성경 구절 추천
   */
  async getVersesForEmotion(emotion, limit = 5) {
    const emotionThemeMap = {
      'sad': ['위로', '소망', '평안'],
      'anxious': ['평화', '신뢰', '위로'],
      'angry': ['용서', '평화', '겸손'],
      'hopeful': ['소망', '믿음', '기쁨'],
      'grateful': ['감사', '찬양', '기쁨'],
      'confused': ['지혜', '인도', '분별'],
      'lonely': ['사랑', '위로', '동행'],
      'peaceful': ['평안', '감사', '기쁨']
    };

    const themes = emotionThemeMap[emotion] || ['위로', '소망'];
    return await this.searchByThemes(themes, limit);
  }

  /**
   * 상담 주제에 맞는 성경 구절 추천
   */
  async getVersesForCounseling(topic, urgency = 'medium', limit = 8) {
    try {
      const topicThemeMap = {
        'relationship': ['사랑', '용서', '화해', '이해'],
        'family': ['가족', '사랑', '순종', '존경'],
        'work': ['일', '성실', '지혜', '인내'],
        'health': ['치유', '회복', '신뢰', '평안'],
        'financial': ['공급', '신뢰', '지혜', '만족'],
        'faith': ['믿음', '확신', '성장', '순종'],
        'decision': ['지혜', '인도', '분별', '기도']
      };

      const themes = topicThemeMap[topic] || ['지혜', '인도'];
      const verses = await this.searchByThemes(themes, limit);

      // 긴급도에 따라 위로와 소망의 구절 추가
      if (urgency === 'high') {
        const comfortVerses = await this.searchByThemes(['위로', '소망'], 3);
        return [...comfortVerses, ...verses].slice(0, limit);
      }

      return verses;
    } catch (error) {
      console.error('상담 주제 검색 오류:', error);
      return [];
    }
  }

  /**
   * 인기 있는 성경 구절 가져오기
   */
  async getPopularVerses(limit = 10) {
    try {
      return await BibleVerse.find({})
        .select('reference text book chapter verse themes category usageCount')
        .sort({ usageCount: -1 })
        .limit(limit);
    } catch (error) {
      console.error('인기 구절 조회 오류:', error);
      return [];
    }
  }

  /**
   * 무작위 성경 구절 가져오기
   */
  async getRandomVerses(category = null, limit = 5) {
    try {
      let pipeline = [{ $sample: { size: limit * 2 } }];
      
      if (category) {
        pipeline.unshift({ $match: { category } });
      }
      
      pipeline.push({
        $project: {
          reference: 1,
          text: 1,
          book: 1,
          chapter: 1,
          verse: 1,
          themes: 1,
          category: 1
        }
      });
      
      const verses = await BibleVerse.aggregate(pipeline);
      return verses.slice(0, limit);
    } catch (error) {
      console.error('무작위 구절 조회 오류:', error);
      return [];
    }
  }
}

module.exports = BibleSearchService;