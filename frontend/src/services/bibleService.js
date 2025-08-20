import { api } from './apiClient';

class BibleService {
  /**
   * 키워드로 성경 구절 검색
   */
  async searchByKeywords(query, options = {}) {
    try {
      const { category, testament, limit = 10 } = options;
      
      const params = {
        q: query,
        limit,
        ...(category && { category }),
        ...(testament && { testament })
      };

      const response = await api.get('/bible/search', params);

      return {
        success: true,
        results: response.results,
        query: response.query,
        count: response.count
      };
    } catch (error) {
      throw new Error(error.userMessage || '성경 구절 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 주제별 성경 구절 검색
   */
  async searchByThemes(themes, limit = 10) {
    try {
      const themesString = Array.isArray(themes) ? themes.join(',') : themes;
      
      const response = await api.get('/bible/themes', {
        themes: themesString,
        limit
      });

      return {
        success: true,
        results: response.results,
        themes: response.themes,
        count: response.count
      };
    } catch (error) {
      throw new Error(error.userMessage || '주제별 검색 중 오류가 발생했습니다.');
    }
  }

  /**
   * 감정 상태에 맞는 성경 구절 추천
   */
  async getVersesForEmotion(emotion, limit = 5) {
    try {
      const response = await api.get(`/bible/emotion/${emotion}`, {
        limit
      });

      return {
        success: true,
        results: response.results,
        emotion: response.emotion,
        message: response.message,
        count: response.count
      };
    } catch (error) {
      throw new Error(error.userMessage || '감정별 구절 추천 중 오류가 발생했습니다.');
    }
  }

  /**
   * 상담 주제에 맞는 성경 구절 추천
   */
  async getVersesForCounseling(topic, urgency = 'medium', limit = 8) {
    try {
      const response = await api.get(`/bible/counseling/${topic}`, {
        urgency,
        limit
      });

      return {
        success: true,
        results: response.results,
        topic: response.topic,
        urgency: response.urgency,
        message: response.message,
        count: response.count
      };
    } catch (error) {
      throw new Error(error.userMessage || '상담 주제별 구절 추천 중 오류가 발생했습니다.');
    }
  }

  /**
   * 인기 성경 구절 조회
   */
  async getPopularVerses(limit = 10) {
    try {
      const response = await api.get('/bible/popular', {
        limit
      });

      return {
        success: true,
        results: response.results,
        message: response.message,
        count: response.count
      };
    } catch (error) {
      throw new Error(error.userMessage || '인기 구절 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 무작위 성경 구절 조회
   */
  async getRandomVerses(category = null, limit = 5) {
    try {
      const params = {
        limit,
        ...(category && { category })
      };

      const response = await api.get('/bible/random', params);

      return {
        success: true,
        results: response.results,
        category: response.category,
        message: response.message,
        count: response.count
      };
    } catch (error) {
      throw new Error(error.userMessage || '무작위 구절 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 특정 성경 구절 조회
   */
  async getVerse(reference) {
    try {
      const response = await api.get(`/bible/verse/${encodeURIComponent(reference)}`);

      return {
        success: true,
        verse: response.verse
      };
    } catch (error) {
      throw new Error(error.userMessage || '성경 구절 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 성경 통계 정보 조회
   */
  async getStatistics() {
    try {
      const response = await api.get('/bible/stats');

      return {
        success: true,
        stats: response.stats
      };
    } catch (error) {
      throw new Error(error.userMessage || '통계 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 필터 옵션 조회
   */
  async getFilterOptions() {
    try {
      const response = await api.get('/bible/options');

      return {
        success: true,
        options: response.options
      };
    } catch (error) {
      throw new Error(error.userMessage || '필터 옵션 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 오늘의 말씀 추천
   */
  async getTodayVerse() {
    try {
      // 오늘의 말씀은 무작위 구절 중에서 선택
      const response = await this.getRandomVerses(null, 1);
      
      if (response.success && response.results.length > 0) {
        return {
          success: true,
          verse: response.results[0],
          date: new Date().toLocaleDateString('ko-KR')
        };
      } else {
        throw new Error('오늘의 말씀을 찾을 수 없습니다.');
      }
    } catch (error) {
      throw new Error(error.userMessage || '오늘의 말씀 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 성경 구절 즐겨찾기 (로컬 스토리지 사용)
   */
  getFavoriteVerses() {
    try {
      const favorites = localStorage.getItem('bible_favorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.warn('즐겨찾기 조회 오류:', error);
      return [];
    }
  }

  /**
   * 성경 구절 즐겨찾기 추가
   */
  addToFavorites(verse) {
    try {
      const favorites = this.getFavoriteVerses();
      const isAlreadyFavorite = favorites.some(fav => fav.reference === verse.reference);
      
      if (!isAlreadyFavorite) {
        const newFavorite = {
          ...verse,
          addedAt: new Date().toISOString()
        };
        favorites.unshift(newFavorite);
        localStorage.setItem('bible_favorites', JSON.stringify(favorites));
        return { success: true, message: '즐겨찾기에 추가되었습니다.' };
      } else {
        return { success: false, message: '이미 즐겨찾기에 추가된 구절입니다.' };
      }
    } catch (error) {
      console.warn('즐겨찾기 추가 오류:', error);
      return { success: false, message: '즐겨찾기 추가에 실패했습니다.' };
    }
  }

  /**
   * 성경 구절 즐겨찾기 제거
   */
  removeFromFavorites(reference) {
    try {
      const favorites = this.getFavoriteVerses();
      const updatedFavorites = favorites.filter(fav => fav.reference !== reference);
      localStorage.setItem('bible_favorites', JSON.stringify(updatedFavorites));
      return { success: true, message: '즐겨찾기에서 제거되었습니다.' };
    } catch (error) {
      console.warn('즐겨찾기 제거 오류:', error);
      return { success: false, message: '즐겨찾기 제거에 실패했습니다.' };
    }
  }

  /**
   * 즐겨찾기 여부 확인
   */
  isFavorite(reference) {
    const favorites = this.getFavoriteVerses();
    return favorites.some(fav => fav.reference === reference);
  }
}

// 싱글톤 인스턴스 생성
const bibleService = new BibleService();

export default bibleService;

// 개별 함수로도 사용 가능하도록 export
export const {
  searchByKeywords,
  searchByThemes,
  getVersesForEmotion,
  getVersesForCounseling,
  getPopularVerses,
  getRandomVerses,
  getVerse,
  getStatistics,
  getFilterOptions,
  getTodayVerse,
  getFavoriteVerses,
  addToFavorites,
  removeFromFavorites,
  isFavorite
} = bibleService;
