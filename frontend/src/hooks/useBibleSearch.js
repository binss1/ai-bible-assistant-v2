import { useState, useEffect, useCallback } from 'react';
import { bibleService } from '../services/bibleService';

export const useBibleSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchStats, setSearchStats] = useState({
    totalSearches: 0,
    lastSearchTime: null
  });

  // 로컬 스토리지에서 초기 데이터 로드
  useEffect(() => {
    loadSearchHistory();
    loadFavorites();
    loadSearchStats();
  }, []);

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('bibleSearchHistory') || '[]');
      setSearchHistory(history.slice(0, 20)); // 최근 20개만 유지
    } catch (error) {
      console.error('검색 기록 로드 실패:', error);
    }
  };

  const loadFavorites = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('bibleFavorites') || '[]');
      setFavorites(saved);
    } catch (error) {
      console.error('즐겨찾기 로드 실패:', error);
    }
  };

  const loadSearchStats = () => {
    try {
      const stats = JSON.parse(localStorage.getItem('bibleSearchStats') || '{}');
      setSearchStats({
        totalSearches: stats.totalSearches || 0,
        lastSearchTime: stats.lastSearchTime || null
      });
    } catch (error) {
      console.error('검색 통계 로드 실패:', error);
    }
  };

  const saveSearchHistory = (newHistory) => {
    try {
      localStorage.setItem('bibleSearchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('검색 기록 저장 실패:', error);
    }
  };

  const saveFavorites = (newFavorites) => {
    try {
      localStorage.setItem('bibleFavorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('즐겨찾기 저장 실패:', error);
    }
  };

  const saveSearchStats = (newStats) => {
    try {
      localStorage.setItem('bibleSearchStats', JSON.stringify(newStats));
    } catch (error) {
      console.error('검색 통계 저장 실패:', error);
    }
  };

  // 의미론적 검색 (임베딩 기반)
  const searchByMeaning = useCallback(async (query, options = {}) => {
    if (!query.trim()) return [];

    setIsSearching(true);
    setSearchError(null);

    try {
      const searchOptions = {
        limit: options.limit || 10,
        threshold: options.threshold || 0.7,
        includeContext: options.includeContext || true,
        translations: options.translations || ['개역개정'],
        ...options
      };

      const results = await bibleService.semanticSearch(query, searchOptions);
      
      setSearchResults(results);
      updateSearchHistory(query, 'semantic', results.length);
      updateSearchStats();

      return results;
    } catch (error) {
      console.error('의미론적 검색 실패:', error);
      setSearchError('검색 중 오류가 발생했습니다. 다시 시도해 주세요.');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 키워드 검색
  const searchByKeyword = useCallback(async (keywords, options = {}) => {
    if (!keywords.trim()) return [];

    setIsSearching(true);
    setSearchError(null);

    try {
      const searchOptions = {
        exact: options.exact || false,
        caseSensitive: options.caseSensitive || false,
        book: options.book || null,
        chapter: options.chapter || null,
        limit: options.limit || 20,
        ...options
      };

      const results = await bibleService.keywordSearch(keywords, searchOptions);
      
      setSearchResults(results);
      updateSearchHistory(keywords, 'keyword', results.length);
      updateSearchStats();

      return results;
    } catch (error) {
      console.error('키워드 검색 실패:', error);
      setSearchError('검색 중 오류가 발생했습니다. 다시 시도해 주세요.');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 주제별 검색
  const searchByTopic = useCallback(async (topic, options = {}) => {
    if (!topic.trim()) return [];

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await bibleService.topicSearch(topic, options);
      
      setSearchResults(results);
      updateSearchHistory(topic, 'topic', results.length);
      updateSearchStats();

      return results;
    } catch (error) {
      console.error('주제별 검색 실패:', error);
      setSearchError('검색 중 오류가 발생했습니다. 다시 시도해 주세요.');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 구절 참조로 검색 (예: "요한복음 3:16")
  const searchByReference = useCallback(async (reference) => {
    if (!reference.trim()) return null;

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await bibleService.getVerseByReference(reference);
      
      if (result) {
        setSearchResults([result]);
        updateSearchHistory(reference, 'reference', 1);
        updateSearchStats();
      }

      return result;
    } catch (error) {
      console.error('구절 참조 검색 실패:', error);
      setSearchError('구절을 찾을 수 없습니다. 참조를 확인해 주세요.');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 검색 기록 업데이트
  const updateSearchHistory = (query, type, resultCount) => {
    const newEntry = {
      id: Date.now(),
      query,
      type,
      resultCount,
      timestamp: new Date().toISOString()
    };

    const newHistory = [newEntry, ...searchHistory.filter(entry => 
      entry.query !== query || entry.type !== type
    )].slice(0, 20);

    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // 검색 통계 업데이트
  const updateSearchStats = () => {
    const newStats = {
      totalSearches: searchStats.totalSearches + 1,
      lastSearchTime: new Date().toISOString()
    };

    setSearchStats(newStats);
    saveSearchStats(newStats);
  };

  // 즐겨찾기 추가
  const addToFavorites = useCallback((verse) => {
    const isFavorited = favorites.some(fav => 
      fav.book === verse.book && 
      fav.chapter === verse.chapter && 
      fav.verse === verse.verse
    );

    if (!isFavorited) {
      const newFavorites = [...favorites, {
        ...verse,
        addedAt: new Date().toISOString()
      }];
      
      setFavorites(newFavorites);
      saveFavorites(newFavorites);
      return true;
    }
    return false;
  }, [favorites]);

  // 즐겨찾기 제거
  const removeFromFavorites = useCallback((verse) => {
    const newFavorites = favorites.filter(fav => 
      !(fav.book === verse.book && 
        fav.chapter === verse.chapter && 
        fav.verse === verse.verse)
    );
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [favorites]);

  // 즐겨찾기 여부 확인
  const isFavorited = useCallback((verse) => {
    return favorites.some(fav => 
      fav.book === verse.book && 
      fav.chapter === verse.chapter && 
      fav.verse === verse.verse
    );
  }, [favorites]);

  // 검색 결과 필터링
  const filterResults = useCallback((filters) => {
    if (!searchResults.length) return [];

    let filtered = [...searchResults];

    if (filters.book) {
      filtered = filtered.filter(result => result.book === filters.book);
    }

    if (filters.testament) {
      filtered = filtered.filter(result => result.testament === filters.testament);
    }

    if (filters.minScore) {
      filtered = filtered.filter(result => result.score >= filters.minScore);
    }

    return filtered;
  }, [searchResults]);

  // 검색 기록 삭제
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('bibleSearchHistory');
  };

  // 즐겨찾기 모두 삭제
  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('bibleFavorites');
  };

  return {
    // 검색 결과
    searchResults,
    isSearching,
    searchError,
    
    // 검색 함수들
    searchByMeaning,
    searchByKeyword,
    searchByTopic,
    searchByReference,
    
    // 필터링
    filterResults,
    
    // 즐겨찾기
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    clearFavorites,
    
    // 검색 기록
    searchHistory,
    clearSearchHistory,
    
    // 통계
    searchStats,
    
    // 유틸리티
    setSearchResults,
    setSearchError
  };
};