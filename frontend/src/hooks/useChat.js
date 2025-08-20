import { useState, useEffect, useCallback, useRef } from 'react';
import chatService from '../services/chatService';
import { userUtils, errorUtils } from '../utils';

/**
 * 채팅 관련 상태와 함수들을 관리하는 커스텀 훅
 */
export const useChat = () => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const userId = userUtils.getUserId();
  const userProfile = userUtils.getUserProfile();

  /**
   * 새로운 채팅 세션 시작
   */
  const startNewSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await chatService.startSession(userId, userProfile.nickname);
      
      if (result.success) {
        setSessionId(result.sessionId);
        setMessages([result.welcomeMessage]);
        setIsConnected(true);
        
        // 세션 ID를 로컬 스토리지에 저장
        localStorage.setItem('current_session_id', result.sessionId);
        
        return { success: true, sessionId: result.sessionId };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'startNewSession');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfile.nickname]);

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(async (messageText) => {
    if (!sessionId || !messageText.trim()) {
      return { success: false, error: '세션이 없거나 메시지가 비어있습니다.' };
    }

    try {
      setIsTyping(true);
      setError(null);

      // 사용자 메시지를 즉시 화면에 표시
      const userMessage = {
        messageId: Date.now().toString(),
        type: 'user',
        content: messageText.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // API로 메시지 전송
      const result = await chatService.sendMessage(sessionId, userId, messageText);
      
      if (result.success) {
        // 봇 응답을 메시지 목록에 추가
        setMessages(prev => [...prev, result.response]);
        return { success: true, response: result.response };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'sendMessage');
      
      // 에러 메시지를 채팅에 표시
      const errorMessageObj = {
        messageId: Date.now().toString(),
        type: 'bot',
        content: `죄송합니다. ${errorMessage}`,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
      return { success: false, error: errorMessage };
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, userId]);

  /**
   * 채팅 이력 불러오기
   */
  const loadChatHistory = useCallback(async (targetSessionId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await chatService.getHistory(targetSessionId, userId);
      
      if (result.success) {
        setSessionId(targetSessionId);
        setMessages(result.history);
        setIsConnected(true);
        localStorage.setItem('current_session_id', targetSessionId);
        return { success: true };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadChatHistory');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 세션 종료
   */
  const endSession = useCallback(async (feedback = null) => {
    if (!sessionId) return { success: false, error: '활성화된 세션이 없습니다.' };

    try {
      const result = await chatService.endSession(sessionId, userId, feedback);
      
      if (result.success) {
        setSessionId(null);
        setMessages([]);
        setIsConnected(false);
        localStorage.removeItem('current_session_id');
        return { success: true, summary: result.summary };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'endSession');
      return { success: false, error: errorMessage };
    }
  }, [sessionId, userId]);

  /**
   * 메시지 피드백 제출
   */
  const submitMessageFeedback = useCallback(async (messageId, helpful, rating = null, feedback = null) => {
    try {
      await chatService.submitFeedback(messageId, helpful, rating, feedback);
      return { success: true };
    } catch (error) {
      errorUtils.logError(error, 'submitMessageFeedback');
      return { success: false };
    }
  }, []);

  /**
   * 메시지 목록 끝으로 스크롤
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * 채팅 초기화
   */
  const clearChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    setIsConnected(false);
    localStorage.removeItem('current_session_id');
  }, []);

  // 메시지가 추가될 때마다 자동 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 컴포넌트 마운트 시 이전 세션 복원 시도
  useEffect(() => {
    const savedSessionId = localStorage.getItem('current_session_id');
    if (savedSessionId && !sessionId) {
      loadChatHistory(savedSessionId);
    }
  }, [loadChatHistory, sessionId]);

  return {
    // 상태
    sessionId,
    messages,
    isLoading,
    isTyping,
    error,
    isConnected,
    messagesEndRef,
    
    // 함수
    startNewSession,
    sendMessage,
    loadChatHistory,
    endSession,
    submitMessageFeedback,
    scrollToBottom,
    clearChat,
    
    // 설정
    setError
  };
};

/**
 * 사용자 세션 목록을 관리하는 커스텀 훅
 */
export const useChatSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    hasNext: false
  });

  const userId = userUtils.getUserId();

  /**
   * 세션 목록 로드
   */
  const loadSessions = useCallback(async (page = 1, limit = 20) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await chatService.getUserSessions(userId, page, limit);
      
      if (result.success) {
        if (page === 1) {
          setSessions(result.sessions);
        } else {
          setSessions(prev => [...prev, ...result.sessions]);
        }
        setPagination(result.pagination);
        return { success: true };
      }
    } catch (error) {
      const errorMessage = errorUtils.getUserFriendlyMessage(error);
      setError(errorMessage);
      errorUtils.logError(error, 'loadSessions');
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * 더 많은 세션 로드 (페이지네이션)
   */
  const loadMoreSessions = useCallback(async () => {
    if (pagination.hasNext && !isLoading) {
      return await loadSessions(pagination.currentPage + 1);
    }
    return { success: false, error: '더 이상 불러올 세션이 없습니다.' };
  }, [loadSessions, pagination, isLoading]);

  /**
   * 세션 목록 새로고침
   */
  const refreshSessions = useCallback(async () => {
    return await loadSessions(1);
  }, [loadSessions]);

  // 컴포넌트 마운트 시 세션 목록 로드
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    // 상태
    sessions,
    isLoading,
    error,
    pagination,
    
    // 함수
    loadSessions,
    loadMoreSessions,
    refreshSessions,
    
    // 설정
    setError
  };
};

export default { useChat, useChatSessions };
