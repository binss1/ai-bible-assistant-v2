import { useState, useEffect, useCallback } from 'react';
import bibleService from '../services/bibleService';
import { errorUtils } from '../utils';

/**
 * 성경 검색 관련 상태와 함수들을 관리하는 커스텀 훅
 */
export const useBibleSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    category: null,
    testament: null,
    limit: 10
  });

  /**
   * 키워드로 성경 구절 검색
   */
  const searchByKeywords = useCallback(async (query, filters = {}) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return { success: false, error: '검색어를 입력해주세요.' };
    }

    try {
      setIsLoading(true);
      setError(null);
      setSearchQuery(query);

      const searchOptions = { ...searchFilters, ...filters };
      const result = await bibleService.searchByKeywords(query.trim(), searchOptions);

      if (result.success) {
        setSearchResults(result.results);
        return { success: true, results: result.results, count: result.count };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'searchByKeywords');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [searchFilters]);

  /**
   * 주제별 성경 구절 검색
   */
  const searchByThemes = useCallback(async (themes, limit = 10) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bibleService.searchByThemes(themes, limit);

      if (result.success) {
        setSearchResults(result.results);
        return { success: true, results: result.results, count: result.count };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'searchByThemes');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 검색 필터 업데이트
   */
  const updateFilters = useCallback((newFilters) => {
    setSearchFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * 검색 결과 초기화
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery('');
    setError(null);
  }, []);

  return {
    // 상태
    searchResults,
    isLoading,
    error,
    searchQuery,
    searchFilters,

    // 함수
    searchByKeywords,
    searchByThemes,
    updateFilters,
    clearSearch,

    // 설정
    setError
  };
};

/**
 * 성경 구절 추천 기능을 관리하는 커스텀 훅
 */
export const useBibleRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [todayVerse, setTodayVerse] = useState(null);

  /**
   * 감정 상태에 맞는 성경 구절 추천
   */
  const getVersesForEmotion = useCallback(async (emotion, limit = 5) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bibleService.getVersesForEmotion(emotion, limit);

      if (result.success) {
        setRecommendations(result.results);
        return { success: true, results: result.results };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'getVersesForEmotion');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 상담 주제에 맞는 성경 구절 추천
   */
  const getVersesForCounseling = useCallback(async (topic, urgency = 'medium', limit = 8) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bibleService.getVersesForCounseling(topic, urgency, limit);

      if (result.success) {
        setRecommendations(result.results);
        return { success: true, results: result.results };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'getVersesForCounseling');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 인기 성경 구절 가져오기
   */
  const getPopularVerses = useCallback(async (limit = 10) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bibleService.getPopularVerses(limit);

      if (result.success) {
        setRecommendations(result.results);
        return { success: true, results: result.results };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'getPopularVerses');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 무작위 성경 구절 가져오기
   */
  const getRandomVerses = useCallback(async (category = null, limit = 5) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bibleService.getRandomVerses(category, limit);

      if (result.success) {
        setRecommendations(result.results);
        return { success: true, results: result.results };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'getRandomVerses');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 오늘의 말씀 가져오기
   */
  const getTodayVerse = useCallback(async () => {
    try {
      const result = await bibleService.getTodayVerse();

      if (result.success) {
        setTodayVerse(result.verse);
        return { success: true, verse: result.verse };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'getTodayVerse');
      return { success: false, error: errorMessage };
    }
  }, []);

  // 컴포넌트 마운트 시 오늘의 말씀 로드
  useEffect(() => {
    getTodayVerse();
  }, [getTodayVerse]);

  return {
    // 상태
    recommendations,
    isLoading,
    error,
    todayVerse,

    // 함수
    getVersesForEmotion,
    getVersesForCounseling,
    getPopularVerses,
    getRandomVerses,
    getTodayVerse,

    // 설정
    setError
  };
};

/**
 * 성경 구절 즐겨찾기 기능을 관리하는 커스텀 훅
 */
export const useBibleFavorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 즐겨찾기 목록 로드
   */
  const loadFavorites = useCallback(() => {
    try {
      setIsLoading(true);
      const favoriteVerses = bibleService.getFavoriteVerses();
      setFavorites(favoriteVerses);
    } catch (error) {
      errorUtils.logError(error, 'loadFavorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 즐겨찾기 추가
   */
  const addToFavorites = useCallback((verse) => {
    const result = bibleService.addToFavorites(verse);
    if (result.success) {
      loadFavorites(); // 목록 새로고침
    }
    return result;
  }, [loadFavorites]);

  /**
   * 즐겨찾기 제거
   */
  const removeFromFavorites = useCallback((reference) => {
    const result = bibleService.removeFromFavorites(reference);
    if (result.success) {
      loadFavorites(); // 목록 새로고침
    }
    return result;
  }, [loadFavorites]);

  /**
   * 즐겨찾기 여부 확인
   */
  const isFavorite = useCallback((reference) => {
    return bibleService.isFavorite(reference);
  }, []);

  /**
   * 즐겨찾기 토글
   */
  const toggleFavorite = useCallback((verse) => {
    if (isFavorite(verse.reference)) {
      return removeFromFavorites(verse.reference);
    } else {
      return addToFavorites(verse);
    }
  }, [isFavorite, addToFavorites, removeFromFavorites]);

  // 컴포넌트 마운트 시 즐겨찾기 목록 로드
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return {
    // 상태
    favorites,
    isLoading,

    // 함수
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite
  };
};

/**
 * 성경 필터 옵션을 관리하는 커스텀 훅
 */
export const useBibleOptions = () => {
  const [options, setOptions] = useState({
    categories: [],
    themes: [],
    books: [],
    emotions: [],
    counselingTopics: [],
    testaments: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 필터 옵션 로드
   */
  const loadOptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bibleService.getFilterOptions();

      if (result.success) {
        setOptions(result.options);
        return { success: true, options: result.options };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadOptions');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 옵션 로드
  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  return {
    // 상태
    options,
    isLoading,
    error,

    // 함수
    loadOptions,

    // 설정
    setError
  };
};

export default {
  useBibleSearch,
  useBibleRecommendations,
  useBibleFavorites,
  useBibleOptions
};
