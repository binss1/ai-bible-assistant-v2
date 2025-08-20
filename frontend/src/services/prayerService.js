import { api } from './apiClient';

class PrayerService {
  /**
   * 개인화된 기도문 생성
   */
  async generatePersonalizedPrayer(sessionId, userId, prayerRequest, includeTopics = []) {
    try {
      const response = await api.post('/prayer/generate', {
        sessionId,
        userId,
        prayerRequest,
        includeTopics
      });

      return {
        success: true,
        prayer: response.prayer,
        usage: response.usage
      };
    } catch (error) {
      throw new Error(error.userMessage || '개인화된 기도문 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 주제별 기도문 템플릿 조회
   */
  async getTemplate(topic) {
    try {
      const response = await api.get(`/prayer/template/${topic}`);

      return {
        success: true,
        template: response.template
      };
    } catch (error) {
      throw new Error(error.userMessage || '기도 템플릿 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 일일 기도문 추천
   */
  async getDailyPrayer(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await api.get('/prayer/daily', params);

      return {
        success: true,
        dailyPrayer: response.dailyPrayer
      };
    } catch (error) {
      throw new Error(error.userMessage || '일일 기도문 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자의 저장된 기도문 목록 조회
   */
  async getSavedPrayers(userId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/prayer/saved/${userId}`, {
        page,
        limit
      });

      return {
        success: true,
        savedPrayers: response.savedPrayers,
        pagination: response.pagination
      };
    } catch (error) {
      throw new Error(error.userMessage || '저장된 기도문 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 기도 주제 목록 조회
   */
  async getTopics() {
    try {
      const response = await api.get('/prayer/topics');

      return {
        success: true,
        topics: response.topics
      };
    } catch (error) {
      throw new Error(error.userMessage || '기도 주제 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 기도문을 로컬 스토리지에 저장
   */
  savePrayerLocally(prayer) {
    try {
      const savedPrayers = this.getLocalPrayers();
      const newPrayer = {
        id: Date.now().toString(),
        ...prayer,
        savedAt: new Date().toISOString()
      };
      
      savedPrayers.unshift(newPrayer);
      
      // 최대 50개까지만 저장
      if (savedPrayers.length > 50) {
        savedPrayers.splice(50);
      }
      
      localStorage.setItem('saved_prayers', JSON.stringify(savedPrayers));
      
      return {
        success: true,
        message: '기도문이 저장되었습니다.',
        id: newPrayer.id
      };
    } catch (error) {
      console.warn('기도문 로컬 저장 오류:', error);
      return {
        success: false,
        message: '기도문 저장에 실패했습니다.'
      };
    }
  }

  /**
   * 로컬에 저장된 기도문 목록 조회
   */
  getLocalPrayers() {
    try {
      const savedPrayers = localStorage.getItem('saved_prayers');
      return savedPrayers ? JSON.parse(savedPrayers) : [];
    } catch (error) {
      console.warn('로컬 기도문 조회 오류:', error);
      return [];
    }
  }

  /**
   * 로컬에 저장된 기도문 삭제
   */
  deleteLocalPrayer(prayerId) {
    try {
      const savedPrayers = this.getLocalPrayers();
      const updatedPrayers = savedPrayers.filter(prayer => prayer.id !== prayerId);
      localStorage.setItem('saved_prayers', JSON.stringify(updatedPrayers));
      
      return {
        success: true,
        message: '기도문이 삭제되었습니다.'
      };
    } catch (error) {
      console.warn('기도문 삭제 오류:', error);
      return {
        success: false,
        message: '기도문 삭제에 실패했습니다.'
      };
    }
  }

  /**
   * 기도문 공유하기 (텍스트로 복사)
   */
  sharePrayer(prayer) {
    try {
      const shareText = `
🙏 AI Bible Assistant 기도문

${prayer.content}

${prayer.bibleReferences && prayer.bibleReferences.length > 0 ? 
  `📖 참고 성경구절:\n${prayer.bibleReferences.map(ref => `• ${ref.reference}: ${ref.text}`).join('\n')}` : 
  ''
}

생성일시: ${new Date(prayer.generatedAt).toLocaleString('ko-KR')}
`.trim();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText);
        return {
          success: true,
          message: '기도문이 클립보드에 복사되었습니다.'
        };
      } else {
        // 클립보드 API를 지원하지 않는 경우
        return {
          success: false,
          message: '브라우저에서 클립보드 복사를 지원하지 않습니다.',
          shareText
        };
      }
    } catch (error) {
      console.warn('기도문 공유 오류:', error);
      return {
        success: false,
        message: '기도문 공유에 실패했습니다.'
      };
    }
  }

  /**
   * 기도 요청 히스토리 관리
   */
  getPrayerHistory() {
    try {
      const history = localStorage.getItem('prayer_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('기도 히스토리 조회 오류:', error);
      return [];
    }
  }

  /**
   * 기도 요청 히스토리에 추가
   */
  addToPrayerHistory(prayerRequest, topics = []) {
    try {
      const history = this.getPrayerHistory();
      const newEntry = {
        id: Date.now().toString(),
        request: prayerRequest,
        topics,
        createdAt: new Date().toISOString()
      };
      
      history.unshift(newEntry);
      
      // 최대 20개까지만 저장
      if (history.length > 20) {
        history.splice(20);
      }
      
      localStorage.setItem('prayer_history', JSON.stringify(history));
      
      return {
        success: true,
        id: newEntry.id
      };
    } catch (error) {
      console.warn('기도 히스토리 추가 오류:', error);
      return {
        success: false
      };
    }
  }

  /**
   * 기도 알림 설정 관리
   */
  getPrayerSettings() {
    try {
      const settings = localStorage.getItem('prayer_settings');
      return settings ? JSON.parse(settings) : {
        dailyReminder: false,
        reminderTime: '09:00',
        favoriteTopics: [],
        notifications: false
      };
    } catch (error) {
      console.warn('기도 설정 조회 오류:', error);
      return {
        dailyReminder: false,
        reminderTime: '09:00',
        favoriteTopics: [],
        notifications: false
      };
    }
  }

  /**
   * 기도 알림 설정 업데이트
   */
  updatePrayerSettings(settings) {
    try {
      const currentSettings = this.getPrayerSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem('prayer_settings', JSON.stringify(updatedSettings));
      
      return {
        success: true,
        message: '설정이 저장되었습니다.',
        settings: updatedSettings
      };
    } catch (error) {
      console.warn('기도 설정 업데이트 오류:', error);
      return {
        success: false,
        message: '설정 저장에 실패했습니다.'
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const prayerService = new PrayerService();

export default prayerService;

// 개별 함수로도 사용 가능하도록 export
export const {
  generatePersonalizedPrayer,
  getTemplate,
  getDailyPrayer,
  getSavedPrayers,
  getTopics,
  savePrayerLocally,
  getLocalPrayers,
  deleteLocalPrayer,
  sharePrayer,
  getPrayerHistory,
  addToPrayerHistory,
  getPrayerSettings,
  updatePrayerSettings
} = prayerService;
