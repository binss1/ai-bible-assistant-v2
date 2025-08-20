import { useState, useEffect, useRef } from 'react';
import { claudeService } from '../services/claudeService';
import { bibleService } from '../services/bibleService';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState('greeting');
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
      id: Date.now(),
      type: 'assistant',
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
    if (!userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    // 사용자 메시지 추가
    const newUserMessage = {
      id: Date.now(),
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
        id: Date.now() + 1,
        type: 'assistant',
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

    } catch (err) {
      console.error('메시지 전송 실패:', err);
      setError('메시지 전송에 실패했습니다. 다시 시도해 주세요.');
      
      // 에러 메시지 추가
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date().toISOString(),
        step: currentStep,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    if (messages.length < 2) return;
    
    // 마지막 사용자 메시지 찾기
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (lastUserMessage) {
      // 마지막 AI 응답 제거하고 다시 시도
      setMessages(prev => prev.filter(msg => 
        !(msg.type === 'assistant' && msg.timestamp > lastUserMessage.timestamp)
      ));
      await sendMessage(lastUserMessage.content);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setError(null);
    setCurrentStep('greeting');
    initializeSession();
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
    messages,
    isLoading,
    error,
    sessionId,
    currentStep,
    conversationHistory,
    sendMessage,
    retryLastMessage,
    clearChat,
    saveConversation,
    loadConversation,
    messagesEndRef
  };
};