import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState('greeting');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef(null);

  // 세션 초기화
  useEffect(() => {
    if (!sessionId) {
      initializeSession();
    }
  }, [sessionId]);

  // 메시지 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 사용자 ID 가져오기
      const userId = getUserId();
      
      // 백엔드에서 새 세션 시작
      const response = await api.post('/chat/start', {
        userId,
        nickname: '익명'
      });
      
      if (response.data.success) {
        setSessionId(response.data.sessionId);
        
        // 환영 메시지 추가
        const welcomeMessage = {
          messageId: response.data.welcomeMessage.messageId,
          type: 'bot',
          content: response.data.welcomeMessage.content,
          timestamp: response.data.welcomeMessage.timestamp,
          step: 'greeting'
        };
        
        setMessages([welcomeMessage]);
        setCurrentStep('listening');
        setIsConnected(true);
      }
    } catch (error) {
      console.error('세션 초기화 오류:', error);
      setError('세션을 시작할 수 없습니다. 다시 시도해 주세요.');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) {
      return { success: false, error: '메시지를 입력해주세요.' };
    }

    if (!sessionId) {
      setError('세션이 시작되지 않았습니다. 새로고침 후 다시 시도해주세요.');
      return { success: false, error: '세션이 없습니다.' };
    }

    setIsLoading(true);
    setIsTyping(true);
    setError(null);

    // 사용자 메시지 추가
    const newUserMessage = {
      messageId: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      step: currentStep
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const userId = getUserId();
      
      // 백엔드로 메시지 전송
      const response = await api.post('/chat/message', {
        sessionId,
        userId,
        message: userMessage
      });

      if (response.data.success) {
        const { response: botResponse } = response.data;
        
        // AI 응답 메시지 생성
        const assistantMessage = {
          messageId: botResponse.messageId,
          type: 'bot',
          content: botResponse.content,
          bibleVerses: botResponse.bibleReferences || [],
          timestamp: botResponse.timestamp,
          step: botResponse.analysis?.stage || currentStep,
          analysis: botResponse.analysis
        };

        setMessages(prev => [...prev, assistantMessage]);
        setConversationHistory(prev => [...prev, newUserMessage, assistantMessage]);
        setCurrentStep(botResponse.analysis?.stage || currentStep);

        return { success: true };
      } else {
        throw new Error(response.data.error || '메시지 전송에 실패했습니다.');
      }

    } catch (err) {
      console.error('메시지 전송 실패:', err);
      
      let errorMessage = '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      
      if (err.response?.status === 429) {
        errorMessage = 'API 사용량이 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
      } else if (err.response?.status === 401) {
        errorMessage = 'API 키가 유효하지 않습니다. 관리자에게 문의해주세요.';
      }
      
      setError(errorMessage);
      
      // 에러 메시지 추가
      const errorMessageObj = {
        messageId: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date().toISOString(),
        step: currentStep,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessageObj]);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const startNewSession = async () => {
    try {
      setMessages([]);
      setConversationHistory([]);
      setError(null);
      setCurrentStep('greeting');
      setSessionId(null);
      await initializeSession();
      return { success: true };
    } catch (error) {
      console.error('새 세션 시작 실패:', error);
      return { success: false, error: error.message };
    }
  };

  const retryLastMessage = async () => {
    if (messages.length < 2) return;
    
    // 마지막 사용자 메시지 찾기
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (lastUserMessage) {
      // 마지막 AI 응답 제거하고 다시 시도
      setMessages(prev => prev.filter(msg => 
        !(msg.type === 'bot' && msg.timestamp > lastUserMessage.timestamp)
      ));
      await sendMessage(lastUserMessage.content);
    }
  };

  const clearChat = () => {
    startNewSession();
  };

  const submitMessageFeedback = async (messageId, helpful) => {
    try {
      // 피드백 저장 로직 (향후 구현)
      console.log('피드백 제출:', { messageId, helpful });
      return { success: true };
    } catch (error) {
      console.error('피드백 제출 실패:', error);
      return { success: false, error: error.message };
    }
  };

  const saveConversation = async () => {
    try {
      const conversationData = {
        sessionId,
        messages,
        timestamp: new Date().toISOString(),
        summary: generateConversationSummary()
      };
      
      // 로컬 스토리지에 저장 (추후 서버 저장으로 확장 가능)
      const savedConversations = JSON.parse(
        localStorage.getItem('bibleAssistantConversations') || '[]'
      );
      
      savedConversations.push(conversationData);
      localStorage.setItem('bibleAssistantConversations', JSON.stringify(savedConversations));
      
      return true;
    } catch (error) {
      console.error('대화 저장 실패:', error);
      return false;
    }
  };

  const generateConversationSummary = () => {
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length === 0) return '새로운 대화';
    
    const firstMessage = userMessages[0].content;
    return firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage;
  };

  const loadConversation = (conversationData) => {
    setSessionId(conversationData.sessionId);
    setMessages(conversationData.messages);
    setConversationHistory(conversationData.messages);
    setCurrentStep(conversationData.messages[conversationData.messages.length - 1]?.step || 'listening');
  };

  return {
    sessionId,
    messages,
    isLoading,
    isTyping,
    error,
    isConnected,
    currentStep,
    conversationHistory,
    messagesEndRef,
    sendMessage,
    startNewSession,
    retryLastMessage,
    clearChat,
    submitMessageFeedback,
    saveConversation,
    loadConversation,
    setError
  };
};
