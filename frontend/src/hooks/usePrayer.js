import { useState, useEffect, useCallback } from 'react';
import prayerService from '../services/prayerService';
import { errorUtils, userUtils } from '../utils';

/**
 * 기도문 생성 관련 상태와 함수들을 관리하는 커스텀 훅
 */
export const usePrayerGeneration = () => {
  const [generatedPrayer, setGeneratedPrayer] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [prayerHistory, setPrayerHistory] = useState([]);

  const userId = userUtils.getUserId();

  /**
   * 개인화된 기도문 생성
   */
  const generatePrayer = useCallback(async (sessionId, prayerRequest, includeTopics = []) => {
    if (!sessionId || !prayerRequest || prayerRequest.trim().length === 0) {
      setError('기도 요청을 입력해주세요.');
      return { success: false, error: '기도 요청을 입력해주세요.' };
    }

    try {
      setIsGenerating(true);
      setError(null);

      const result = await prayerService.generatePersonalizedPrayer(
        sessionId,
        userId,
        prayerRequest.trim(),
        includeTopics
      );

      if (result.success) {
        setGeneratedPrayer(result.prayer);
        
        // 기도 히스토리에 추가
        prayerService.addToPrayerHistory(prayerRequest, includeTopics);
        loadPrayerHistory();

        return { success: true, prayer: result.prayer };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'generatePrayer');
      return { success: false, error: errorMessage };
    } finally {
      setIsGenerating(false);
    }
  }, [userId]);

  /**
   * 기도 히스토리 로드
   */
  const loadPrayerHistory = useCallback(() => {
    try {
      const history = prayerService.getPrayerHistory();
      setPrayerHistory(history);
    } catch (error) {
      errorUtils.logError(error, 'loadPrayerHistory');
    }
  }, []);

  /**
   * 생성된 기도문 초기화
   */
  const clearGeneratedPrayer = useCallback(() => {
    setGeneratedPrayer(null);
    setError(null);
  }, []);

  // 컴포넌트 마운트 시 히스토리 로드
  useEffect(() => {
    loadPrayerHistory();
  }, [loadPrayerHistory]);

  return {
    // 상태
    generatedPrayer,
    isGenerating,
    error,
    prayerHistory,

    // 함수
    generatePrayer,
    loadPrayerHistory,
    clearGeneratedPrayer,

    // 설정
    setError
  };
};

/**
 * 기도문 템플릿 관련 상태와 함수들을 관리하는 커스텀 훅
 */
export const usePrayerTemplates = () => {
  const [templates, setTemplates] = useState({});
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 기도 주제 목록 로드
   */
  const loadTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await prayerService.getTopics();

      if (result.success) {
        setTopics(result.topics);
        return { success: true, topics: result.topics };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadTopics');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 특정 주제의 기도 템플릿 로드
   */
  const loadTemplate = useCallback(async (topic) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await prayerService.getTemplate(topic);

      if (result.success) {
        setTemplates(prev => ({
          ...prev,
          [topic]: result.template
        }));
        return { success: true, template: result.template };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadTemplate');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 캐시된 템플릿 가져오기
   */
  const getTemplate = useCallback((topic) => {
    return templates[topic] || null;
  }, [templates]);

  // 컴포넌트 마운트 시 주제 목록 로드
  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  return {
    // 상태
    templates,
    topics,
    isLoading,
    error,

    // 함수
    loadTopics,
    loadTemplate,
    getTemplate,

    // 설정
    setError
  };
};

/**
 * 일일 기도문 관련 상태와 함수들을 관리하는 커스텀 훅
 */
export const useDailyPrayer = () => {
  const [dailyPrayer, setDailyPrayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastLoadDate, setLastLoadDate] = useState(null);

  const userId = userUtils.getUserId();

  /**
   * 일일 기도문 로드
   */
  const loadDailyPrayer = useCallback(async (forceRefresh = false) => {
    const today = new Date().toDateString();
    
    // 오늘 이미 로드했고 강제 새로고침이 아닌 경우 스킵
    if (lastLoadDate === today && !forceRefresh && dailyPrayer) {
      return { success: true, prayer: dailyPrayer };
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await prayerService.getDailyPrayer(userId);

      if (result.success) {
        setDailyPrayer(result.dailyPrayer);
        setLastLoadDate(today);
        return { success: true, prayer: result.dailyPrayer };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadDailyPrayer');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId, lastLoadDate, dailyPrayer]);

  /**
   * 일일 기도문 새로고침
   */
  const refreshDailyPrayer = useCallback(async () => {
    return await loadDailyPrayer(true);
  }, [loadDailyPrayer]);

  // 컴포넌트 마운트 시 일일 기도문 로드
  useEffect(() => {
    loadDailyPrayer();
  }, [loadDailyPrayer]);

  return {
    // 상태
    dailyPrayer,
    isLoading,
    error,

    // 함수
    loadDailyPrayer,
    refreshDailyPrayer,

    // 설정
    setError
  };
};

/**
 * 저장된 기도문 관리 커스텀 훅
 */
export const useSavedPrayers = () => {
  const [savedPrayers, setSavedPrayers] = useState([]);
  const [localPrayers, setLocalPrayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false
  });

  const userId = userUtils.getUserId();

  /**
   * 서버에 저장된 기도문 목록 로드
   */
  const loadSavedPrayers = useCallback(async (page = 1, limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await prayerService.getSavedPrayers(userId, page, limit);

      if (result.success) {
        if (page === 1) {
          setSavedPrayers(result.savedPrayers);
        } else {
          setSavedPrayers(prev => [...prev, ...result.savedPrayers]);
        }
        setPagination(result.pagination);
        return { success: true };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadSavedPrayers');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 로컬에 저장된 기도문 목록 로드
   */
  const loadLocalPrayers = useCallback(() => {
    try {
      const prayers = prayerService.getLocalPrayers();
      setLocalPrayers(prayers);
    } catch (error) {
      errorUtils.logError(error, 'loadLocalPrayers');
    }
  }, []);

  /**
   * 기도문을 로컬에 저장
   */
  const savePrayerLocally = useCallback((prayer) => {
    const result = prayerService.savePrayerLocally(prayer);
    if (result.success) {
      loadLocalPrayers(); // 목록 새로고침
    }
    return result;
  }, [loadLocalPrayers]);

  /**
   * 로컬 기도문 삭제
   */
  const deleteLocalPrayer = useCallback((prayerId) => {
    const result = prayerService.deleteLocalPrayer(prayerId);
    if (result.success) {
      loadLocalPrayers(); // 목록 새로고침
    }
    return result;
  }, [loadLocalPrayers]);

  /**
   * 기도문 공유
   */
  const sharePrayer = useCallback((prayer) => {
    return prayerService.sharePrayer(prayer);
  }, []);

  /**
   * 더 많은 기도문 로드 (페이지네이션)
   */
  const loadMorePrayers = useCallback(async () => {
    if (pagination.hasNext && !isLoading) {
      return await loadSavedPrayers(pagination.currentPage + 1);
    }
    return { success: false, error: '더 이상 불러올 기도문이 없습니다.' };
  }, [loadSavedPrayers, pagination, isLoading]);

  /**
   * 기도문 목록 새로고침
   */
  const refreshPrayers = useCallback(async () => {
    loadLocalPrayers();
    return await loadSavedPrayers(1);
  }, [loadLocalPrayers, loadSavedPrayers]);

  // 컴포넌트 마운트 시 기도문 목록 로드
  useEffect(() => {
    loadLocalPrayers();
    loadSavedPrayers();
  }, [loadLocalPrayers, loadSavedPrayers]);

  return {
    // 상태
    savedPrayers,
    localPrayers,
    isLoading,
    error,
    pagination,

    // 함수
    loadSavedPrayers,
    loadLocalPrayers,
    savePrayerLocally,
    deleteLocalPrayer,
    sharePrayer,
    loadMorePrayers,
    refreshPrayers,

    // 설정
    setError
  };
};

/**
 * 기도 설정 관리 커스텀 훅
 */
export const usePrayerSettings = () => {
  const [settings, setSettings] = useState({
    dailyReminder: false,
    reminderTime: '09:00',
    favoriteTopics: [],
    notifications: false
  });

  /**
   * 설정 로드
   */
  const loadSettings = useCallback(() => {
    try {
      const prayerSettings = prayerService.getPrayerSettings();
      setSettings(prayerSettings);
    } catch (error) {
      errorUtils.logError(error, 'loadSettings');
    }
  }, []);

  /**
   * 설정 업데이트
   */
  const updateSettings = useCallback((newSettings) => {
    const result = prayerService.updatePrayerSettings(newSettings);
    if (result.success) {
      setSettings(result.settings);
    }
    return result;
  }, []);

  /**
   * 특정 설정 토글
   */
  const toggleSetting = useCallback((key) => {
    const newValue = !settings[key];
    return updateSettings({ [key]: newValue });
  }, [settings, updateSettings]);

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // 상태
    settings,

    // 함수
    loadSettings,
    updateSettings,
    toggleSetting
  };
};

export default {
  usePrayerGeneration,
  usePrayerTemplates,
  useDailyPrayer,
  useSavedPrayers,
  usePrayerSettings
};
