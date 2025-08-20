import React from 'react';
import { Heart, Copy, BookOpen, Calendar } from 'lucide-react';
import { dateUtils, textUtils } from '../utils';

/**
 * 성경 구절을 표시하는 컴포넌트
 */
const BibleVerse = ({ 
  verse, 
  showActions = true, 
  isFavorite = false, 
  onToggleFavorite = null,
  onCopy = null,
  className = '',
  showThemes = true
}) => {
  const handleCopy = () => {
    const text = `${verse.reference}: ${verse.text}`;
    navigator.clipboard.writeText(text).then(() => {
      if (onCopy) {
        onCopy(text);
      }
    });
  };

  const handleFavoriteToggle = () => {
    if (onToggleFavorite) {
      onToggleFavorite(verse);
    }
  };

  return (
    <div className={`bible-verse ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-orange-700">{verse.reference}</span>
          {verse.book && (
            <span className="text-sm text-gray-600">({verse.book})</span>
          )}
        </div>
        
        {showActions && (
          <div className="flex gap-1">
            {onToggleFavorite && (
              <button
                onClick={handleFavoriteToggle}
                className={`p-1 rounded hover:bg-white/50 transition-colors ${
                  isFavorite ? 'text-red-500' : 'text-gray-400'
                }`}
                title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/50 transition-colors text-gray-400 hover:text-gray-600"
              title="구절 복사"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <p className="text-gray-800 leading-relaxed mb-3">
        {verse.text}
      </p>
      
      {showThemes && verse.themes && verse.themes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {verse.themes.map((theme, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
      
      {verse.usageCount && verse.usageCount > 0 && (
        <div className="text-xs text-gray-500 mt-2">
          {verse.usageCount}번 사용됨
        </div>
      )}
    </div>
  );
};

/**
 * 메시지 버블을 표시하는 컴포넌트
 */
const MessageBubble = ({ 
  message, 
  onFeedback = null,
  showFeedback = true 
}) => {
  const isUser = message.type === 'user';
  const isBot = message.type === 'bot';
  const isError = message.isError;

  const handleFeedback = (helpful) => {
    if (onFeedback && isBot) {
      onFeedback(message.messageId, helpful);
    }
  };

  return (
    <div className={`message-fade-in flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`message-bubble max-w-3xl px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-primary-500 text-white ml-12' 
            : isError
              ? 'bg-red-50 border border-red-200 text-red-700 mr-12'
              : 'bg-white shadow-md border border-gray-100 mr-12'
        }`}
      >
        {/* 메시지 내용 */}
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        {/* 성경 구절 표시 */}
        {isBot && message.bibleReferences && message.bibleReferences.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.bibleReferences.map((verse, index) => (
              <BibleVerse
                key={index}
                verse={verse}
                showActions={false}
                showThemes={false}
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100"
              />
            ))}
          </div>
        )}
        
        {/* 타임스탬프 */}
        <div className={`text-xs mt-2 ${
          isUser ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {dateUtils.formatDate(message.timestamp, 'HH:mm')}
        </div>
        
        {/* 피드백 버튼 (봇 메시지만) */}
        {isBot && showFeedback && !isError && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleFeedback(true)}
              className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              도움됨
            </button>
            <button
              onClick={() => handleFeedback(false)}
              className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
            >
              별로
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 타이핑 인디케이터 컴포넌트
 */
const TypingIndicator = () => {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-white shadow-md border border-gray-100 rounded-2xl px-4 py-3 mr-12">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <span className="ml-2 text-sm text-gray-500">답변을 생성하고 있습니다...</span>
        </div>
      </div>
    </div>
  );
};

/**
 * 로딩 스피너 컴포넌트
 */
const LoadingSpinner = ({ size = 'medium', text = '로딩 중...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`loading-spinner ${sizeClasses[size]}`}></div>
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
};

/**
 * 에러 메시지 컴포넌트
 */
const ErrorMessage = ({ error, onRetry = null, className = '' }) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 text-red-700">
        <span className="text-red-500">⚠️</span>
        <span className="font-medium">오류가 발생했습니다</span>
      </div>
      <p className="text-red-600 mt-1">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
        >
          다시 시도
        </button>
      )}
    </div>
  );
};

/**
 * 빈 상태 컴포넌트
 */
const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionButton = null,
  className = '' 
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {actionButton}
    </div>
  );
};

/**
 * 모달 컴포넌트
 */
const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  showCloseButton = true 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-25"
          onClick={onClose}
        ></div>
        
        <div className={`relative bg-white rounded-lg shadow-xl max-w-lg w-full ${className}`}>
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* 내용 */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 토스트 알림 컴포넌트
 */
const Toast = ({ 
  message, 
  type = 'info', 
  isVisible = false, 
  onClose = null,
  duration = 3000 
}) => {
  const typeClasses = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`px-4 py-3 rounded-lg shadow-lg ${typeClasses[type]} animate-slide-up`}>
        <div className="flex items-center gap-2">
          <span>{message}</span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 text-white/80 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 페이지네이션 컴포넌트
 */
const Pagination = ({ 
  currentPage, 
  totalPages, 
  hasNext, 
  onLoadMore, 
  isLoading = false 
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-6">
      {hasNext && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? <LoadingSpinner size="small" text="" /> : '더보기'}
        </button>
      )}
      
      <div className="text-sm text-gray-500 mt-2">
        {currentPage} / {totalPages} 페이지
      </div>
    </div>
  );
};

export {
  BibleVerse,
  MessageBubble,
  TypingIndicator,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  Modal,
  Toast,
  Pagination
};
