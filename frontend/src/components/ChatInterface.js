import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageCircle, Settings, Heart, Book } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { 
  MessageBubble, 
  TypingIndicator, 
  LoadingSpinner, 
  ErrorMessage,
  EmptyState 
} from './UIComponents';
import { validationUtils, userUtils } from '../utils';

/**
 * 메인 채팅 인터페이스 컴포넌트
 */
const ChatInterface = ({ 
  onGeneratePrayer = null,
  className = '' 
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  
  const inputRef = useRef(null);
  
  const {
    sessionId,
    messages,
    isLoading,
    isTyping,
    error,
    isConnected,
    messagesEndRef,
    startNewSession,
    sendMessage,
    submitMessageFeedback,
    setError
  } = useChat();

  /**
   * 메시지 전송 핸들러
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const validation = validationUtils.isValidMessage(messageInput);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    const result = await sendMessage(messageInput);
    if (result.success) {
      setMessageInput('');
      setShowWelcome(false);
      
      // 텍스트 영역 높이 리셋
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * 새 세션 시작 핸들러
   */
  const handleStartNewSession = async () => {
    const result = await startNewSession();
    if (result.success) {
      setShowWelcome(true);
      setMessageInput('');
    }
  };

  /**
   * 텍스트 영역 자동 크기 조절
   */
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  /**
   * 메시지 피드백 핸들러
   */
  const handleMessageFeedback = async (messageId, helpful) => {
    await submitMessageFeedback(messageId, helpful);
  };

  /**
   * 기도문 생성 요청 핸들러
   */
  const handlePrayerRequest = () => {
    if (onGeneratePrayer && sessionId) {
      onGeneratePrayer(sessionId);
    }
  };

  /**
   * 엔터 키 처리
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // 컴포넌트 마운트 시 새 세션 시작
  useEffect(() => {
    if (!sessionId) {
      handleStartNewSession();
    }
  }, []);

  // 입력 필드에 포커스
  useEffect(() => {
    if (inputRef.current && isConnected) {
      inputRef.current.focus();
    }
  }, [isConnected]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50 ${className}`}>
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Bible Assistant</h1>
              <p className="text-sm text-gray-500">
                {isConnected ? '성경 기반 상담 진행 중' : '연결 중...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {sessionId && onGeneratePrayer && (
              <button
                onClick={handlePrayerRequest}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <Heart className="w-4 h-4" />
                기도문 생성
              </button>
            )}
            
            <button
              onClick={handleStartNewSession}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              새 상담
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 에러 메시지 */}
        {error && (
          <ErrorMessage 
            error={error} 
            onRetry={() => setError(null)}
            className="mb-4"
          />
        )}

        {/* 환영 메시지 */}
        {showWelcome && messages.length <= 1 && (
          <div className="text-center py-8 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              안녕하세요! 👋
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              저는 성경을 기반으로 상담을 도와드리는 AI Bible Assistant입니다. 
              어떤 고민이나 질문이 있으시면 편안하게 말씀해 주세요.
            </p>
          </div>
        )}

        {/* 메시지 목록 */}
        {messages.length === 0 && isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner text="상담 세션을 준비하고 있습니다..." />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="w-12 h-12" />}
            title="새로운 상담을 시작해보세요"
            description="고민이나 질문을 자유롭게 말씀해 주시면, 성경의 지혜를 바탕으로 답변해 드리겠습니다."
          />
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.messageId}
                message={message}
                onFeedback={handleMessageFeedback}
                showFeedback={message.type === 'bot'}
              />
            ))}
          </div>
        )}

        {/* 타이핑 인디케이터 */}
        {isTyping && <TypingIndicator />}

        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={
                isConnected 
                  ? "고민이나 질문을 입력해주세요... (Shift+Enter로 줄바꿈)"
                  : "연결 중..."
              }
              disabled={!isConnected || isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              style={{ minHeight: '48px' }}
              rows={1}
            />
            
            {/* 글자 수 표시 */}
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {messageInput.length}/2000
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!isConnected || isLoading || !messageInput.trim()}
            className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        {/* 도움말 */}
        <div className="mt-2 text-xs text-gray-500 text-center">
          AI Bible Assistant는 성경을 기반으로 조언을 제공합니다. 전문적인 상담이 필요한 경우 전문가와 상담하세요.
        </div>
      </div>
    </div>
  );
};

/**
 * 빠른 질문 템플릿 컴포넌트
 */
const QuickQuestions = ({ onSelectQuestion, className = '' }) => {
  const quickQuestions = [
    {
      id: 1,
      question: "인생의 방향을 잃었을 때 어떻게 해야 하나요?",
      category: "guidance"
    },
    {
      id: 2,
      question: "어려운 상황에서 어떻게 평안을 찾을 수 있나요?",
      category: "comfort"
    },
    {
      id: 3,
      question: "다른 사람을 용서하기 힘들 때는 어떻게 하나요?",
      category: "forgiveness"
    },
    {
      id: 4,
      question: "믿음이 약해졌을 때 어떻게 회복할 수 있나요?",
      category: "faith"
    },
    {
      id: 5,
      question: "중요한 결정을 내려야 할 때 지혜를 구하는 방법은?",
      category: "wisdom"
    },
    {
      id: 6,
      question: "가족 관계에서 갈등이 있을 때 어떻게 해결하나요?",
      category: "family"
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">자주 묻는 질문</h3>
      <div className="space-y-2">
        {quickQuestions.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectQuestion(item.question)}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <span className="text-gray-700">{item.question}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 채팅 통계 컴포넌트
 */
const ChatStats = ({ className = '' }) => {
  const userProfile = userUtils.getUserProfile();
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">나의 상담 현황</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">닉네임</span>
          <span className="font-medium">{userProfile.nickname}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">가입일</span>
          <span className="font-medium">
            {new Date(userProfile.joinedAt).toLocaleDateString('ko-KR')}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">상담 세션</span>
          <span className="font-medium">
            {userProfile.counselingHistory?.totalSessions || 0}회
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
export { QuickQuestions, ChatStats };
