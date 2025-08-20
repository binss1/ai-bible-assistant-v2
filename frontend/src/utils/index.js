import { v4 as uuidv4 } from 'uuid';

/**
 * 사용자 ID 생성 및 관리
 */
export const userUtils = {
  /**
   * 새 사용자 ID 생성
   */
  generateUserId() {
    return uuidv4();
  },

  /**
   * 로컬 스토리지에서 사용자 ID 가져오기
   */
  getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('user_id', userId);
    }
    return userId;
  },

  /**
   * 사용자 프로필 가져오기
   */
  getUserProfile() {
    try {
      const profile = localStorage.getItem('user_profile');
      return profile ? JSON.parse(profile) : {
        userId: this.getUserId(),
        nickname: '익명',
        joinedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          fontSize: 'medium',
          notifications: true
        }
      };
    } catch (error) {
      console.warn('사용자 프로필 조회 오류:', error);
      return {
        userId: this.getUserId(),
        nickname: '익명',
        joinedAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          fontSize: 'medium',
          notifications: true
        }
      };
    }
  },

  /**
   * 사용자 프로필 업데이트
   */
  updateUserProfile(updates) {
    try {
      const currentProfile = this.getUserProfile();
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.warn('사용자 프로필 업데이트 오류:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 사용자 닉네임 업데이트
   */
  updateNickname(nickname) {
    if (!nickname || nickname.trim().length === 0) {
      return { success: false, error: '닉네임을 입력해주세요.' };
    }
    
    if (nickname.length > 20) {
      return { success: false, error: '닉네임은 20자 이하로 입력해주세요.' };
    }

    return this.updateUserProfile({ nickname: nickname.trim() });
  },

  /**
   * 사용자 설정 가져오기
   */
  getSettings() {
    try {
      const settings = localStorage.getItem('user_settings');
      return settings ? JSON.parse(settings) : {
        theme: 'light',
        fontSize: 'medium',
        notifications: true,
        autoSave: true,
        soundEnabled: true
      };
    } catch (error) {
      console.warn('설정 조회 오류:', error);
      return {
        theme: 'light',
        fontSize: 'medium',
        notifications: true,
        autoSave: true,
        soundEnabled: true
      };
    }
  },

  /**
   * 사용자 설정 업데이트
   */
  updateSettings(newSettings) {
    try {
      const currentSettings = this.getSettings();
      const updatedSettings = { ...currentSettings, ...newSettings };
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));
      return { success: true, settings: updatedSettings };
    } catch (error) {
      console.warn('설정 업데이트 오류:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * 날짜 및 시간 유틸리티
 */
export const dateUtils = {
  /**
   * 상대적 시간 표시 (예: "5분 전", "어제")
   */
  getRelativeTime(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now - targetDate) / 1000);

    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    } else {
      return targetDate.toLocaleDateString('ko-KR');
    }
  },

  /**
   * 날짜 포맷팅
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY.MM.DD':
        return `${year}.${month}.${day}`;
      case 'MM/DD':
        return `${month}/${day}`;
      case 'HH:mm':
        return `${hours}:${minutes}`;
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      default:
        return d.toLocaleDateString('ko-KR');
    }
  },

  /**
   * 오늘인지 확인
   */
  isToday(date) {
    const today = new Date();
    const targetDate = new Date(date);
    return today.toDateString() === targetDate.toDateString();
  },

  /**
   * 이번 주인지 확인
   */
  isThisWeek(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return targetDate >= startOfWeek && targetDate <= endOfWeek;
  }
};

/**
 * 텍스트 유틸리티
 */
export const textUtils = {
  /**
   * 텍스트 길이 제한
   */
  truncate(text, maxLength = 100, suffix = '...') {
    if (!text || text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength - suffix.length) + suffix;
  },

  /**
   * HTML 태그 제거
   */
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  },

  /**
   * 개행문자를 <br> 태그로 변환
   */
  nl2br(text) {
    return text.replace(/\n/g, '<br>');
  },

  /**
   * 성경 구절 참조 파싱
   */
  parseBibleReference(reference) {
    const match = reference.match(/^([가-힣]+)(\d+):(\d+)$/);
    if (match) {
      return {
        book: match[1],
        chapter: parseInt(match[2]),
        verse: parseInt(match[3]),
        original: reference
      };
    }
    return null;
  },

  /**
   * 검색어 하이라이트
   */
  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
};

/**
 * 유효성 검사 유틸리티
 */
export const validationUtils = {
  /**
   * 이메일 유효성 검사
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * 닉네임 유효성 검사
   */
  isValidNickname(nickname) {
    if (!nickname || nickname.trim().length === 0) {
      return { valid: false, message: '닉네임을 입력해주세요.' };
    }
    
    if (nickname.length > 20) {
      return { valid: false, message: '닉네임은 20자 이하로 입력해주세요.' };
    }
    
    if (nickname.length < 2) {
      return { valid: false, message: '닉네임은 2자 이상 입력해주세요.' };
    }
    
    // 특수문자 제한 (한글, 영문, 숫자, 공백만 허용)
    const nicknameRegex = /^[가-힣a-zA-Z0-9\s]+$/;
    if (!nicknameRegex.test(nickname)) {
      return { valid: false, message: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.' };
    }
    
    return { valid: true };
  },

  /**
   * 기도 요청 텍스트 유효성 검사
   */
  isValidPrayerRequest(text) {
    if (!text || text.trim().length === 0) {
      return { valid: false, message: '기도 요청을 입력해주세요.' };
    }
    
    if (text.length > 1000) {
      return { valid: false, message: '기도 요청은 1000자 이하로 입력해주세요.' };
    }
    
    if (text.length < 10) {
      return { valid: false, message: '기도 요청을 좀 더 자세히 입력해주세요.' };
    }
    
    return { valid: true };
  },

  /**
   * 채팅 메시지 유효성 검사
   */
  isValidMessage(message) {
    if (!message || message.trim().length === 0) {
      return { valid: false, message: '메시지를 입력해주세요.' };
    }
    
    if (message.length > 2000) {
      return { valid: false, message: '메시지는 2000자 이하로 입력해주세요.' };
    }
    
    return { valid: true };
  }
};

/**
 * 로컬 스토리지 유틸리티
 */
export const storageUtils = {
  /**
   * 안전한 로컬 스토리지 get
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`로컬 스토리지 조회 오류 (${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * 안전한 로컬 스토리지 set
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`로컬 스토리지 저장 오류 (${key}):`, error);
      return false;
    }
  },

  /**
   * 안전한 로컬 스토리지 remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`로컬 스토리지 삭제 오류 (${key}):`, error);
      return false;
    }
  },

  /**
   * 로컬 스토리지 전체 정리
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('로컬 스토리지 정리 오류:', error);
      return false;
    }
  }
};

/**
 * 에러 처리 유틸리티
 */
export const errorUtils = {
  /**
   * 사용자 친화적 에러 메시지 생성
   */
  getUserFriendlyMessage(error) {
    if (error.userMessage) {
      return error.userMessage;
    }
    
    if (error.message) {
      // 네트워크 오류
      if (error.message.includes('Network Error') || error.message.includes('ERR_NETWORK')) {
        return '네트워크 연결을 확인해주세요.';
      }
      
      // 타임아웃 오류
      if (error.message.includes('timeout')) {
        return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
      }
      
      return error.message;
    }
    
    return '알 수 없는 오류가 발생했습니다.';
  },

  /**
   * 에러 로깅
   */
  logError(error, context = '') {
    console.error(`[${context}] 오류:`, {
      message: error.message,
      stack: error.stack,
      userMessage: error.userMessage,
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  userUtils,
  dateUtils,
  textUtils,
  validationUtils,
  storageUtils,
  errorUtils
};
