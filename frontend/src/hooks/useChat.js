import { useState, useEffect, useRef } from 'react';
import { claudeService } from '../services/claudeService';
import { bibleService } from '../services/bibleService';

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
    initializeSession();
  }, []);

  // 메시지 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    // 초기 인사 메시지
    const welcomeMessage = {
      messageId: Date.now(),
      type: 'bot',
      content: `안녕하세요! 저는 **AI Bible Assistant**입니다. 🙏

성경의 지혜로 여러분의 고민과 질문에 답해드리겠습니다.

어떤 고민이나 질문이 있으시나요? 예를 들어:
• 인간관계에서의 어려움
• 인생의 방향성에 대한 고민  
• 영적인 성장에 대한 질문
• 삶의 어려운 상황에 대한 조언

편안하게 말씀해 주세요.`,
      timestamp: new Date().toISOString(),
      step: 'greeting'
    };
    
    setMessages([welcomeMessage]);
    setCurrentStep('listening');
  };

  const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (userMessage) => {
    if (!userMessage.trim()) {
      return { success: false, error: '메시지를 입력해주세요.' };
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
      // 대화 컨텍스트 준비
      const context = {
        sessionId,
        conversationHistory: [...conversationHistory, newUserMessage],
        currentStep,
        previousMessages: messages.slice(-5) // 최근 5개 메시지만 컨텍스트로 사용
      };

      // Claude API 호출
      const response = await claudeService.sendMessage(userMessage, context);
      
      // 성경 구절 검색 (필요한 경우)
      let bibleVerses = [];
      if (response.needsBibleSearch) {
        bibleVerses = await bibleService.searchVerses(response.searchTerms);
      }

      // AI 응답 메시지 생성
      const assistantMessage = {
        messageId: Date.now() + 1,
        type: 'bot',
        content: response.content,
        bibleVerses: bibleVerses,
        timestamp: new Date().toISOString(),
        step: response.nextStep || currentStep,
        clarifyingQuestions: response.clarifyingQuestions || [],
        confidence: response.confidence || 'medium'
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [...prev, newUserMessage, assistantMessage]);
      setCurrentStep(response.nextStep || currentStep);

      return { success: true };

    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setError('메시지 전송에 실패했습니다. 다시 시도해 주세요.');
      
      // 에러 메시지 추가
      const errorMessage = {
        messageId: Date.now() + 1,
        type: 'bot',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toISOString(),
        step: currentStep,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
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
      initializeSession();
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
    startNewSession, // 이제 이 함수가 반환됩니다!
    retryLastMessage,
    clearChat,
    submitMessageFeedback,
    saveConversation,
    loadConversation,
    setError
  };
};