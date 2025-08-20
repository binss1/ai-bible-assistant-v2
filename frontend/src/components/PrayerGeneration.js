import React, { useState, useEffect } from 'react';
import { Heart, Download, Share2, BookOpen, Clock, Star } from 'lucide-react';
import { usePrayerGeneration, usePrayerTemplates, useDailyPrayer, useSavedPrayers } from '../hooks/usePrayer';
import { 
  LoadingSpinner, 
  ErrorMessage, 
  Modal, 
  Toast,
  BibleVerse,
  EmptyState 
} from './UIComponents';
import { validationUtils, dateUtils } from '../utils';

/**
 * 기도문 생성 메인 컴포넌트
 */
const PrayerGeneration = ({ 
  sessionId, 
  isOpen = false, 
  onClose = null,
  className = '' 
}) => {
  const [prayerRequest, setPrayerRequest] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const {
    generatedPrayer,
    isGenerating,
    error: generationError,
    generatePrayer,
    clearGeneratedPrayer
  } = usePrayerGeneration();

  const {
    topics,
    isLoading: topicsLoading
  } = usePrayerTemplates();

  const {
    savePrayerLocally
  } = useSavedPrayers();

  /**
   * 기도문 생성 핸들러
   */
  const handleGeneratePrayer = async (e) => {
    e.preventDefault();

    const validation = validationUtils.isValidPrayerRequest(prayerRequest);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return;
    }

    if (!sessionId) {
      showToast('활성화된 상담 세션이 필요합니다.', 'error');
      return;
    }

    const result = await generatePrayer(sessionId, prayerRequest, selectedTopics);
    if (result.success) {
      setShowResult(true);
      showToast('개인화된 기도문이 생성되었습니다.', 'success');
    }
  };

  /**
   * 주제 선택/해제 핸들러
   */
  const handleTopicToggle = (topicId) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  /**
   * 기도문 저장 핸들러
   */
  const handleSavePrayer = () => {
    if (!generatedPrayer) return;

    const result = savePrayerLocally(generatedPrayer);
    if (result.success) {
      showToast('기도문이 저장되었습니다.', 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  /**
   * 기도문 공유 핸들러
   */
  const handleSharePrayer = async () => {
    if (!generatedPrayer) return;

    try {
      const shareText = `
🙏 개인화된 기도문

${generatedPrayer.content}

${generatedPrayer.bibleReferences && generatedPrayer.bibleReferences.length > 0 ? 
  `📖 관련 성경구절:\n${generatedPrayer.bibleReferences.map(ref => `• ${ref.reference}: ${ref.text}`).join('\n')}` : 
  ''
}

생성일시: ${dateUtils.formatDate(generatedPrayer.generatedAt, 'YYYY-MM-DD HH:mm')}
AI Bible Assistant
      `.trim();

      await navigator.clipboard.writeText(shareText);
      showToast('기도문이 클립보드에 복사되었습니다.', 'success');
    } catch (error) {
      showToast('공유 기능을 사용할 수 없습니다.', 'error');
    }
  };

  /**
   * 토스트 메시지 표시
   */
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  /**
   * 토스트 닫기
   */
  const closeToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    clearGeneratedPrayer();
    setShowResult(false);
    setPrayerRequest('');
    setSelectedTopics([]);
  };

  /**
   * 다시 생성하기
   */
  const handleRegenerate = () => {
    setShowResult(false);
    clearGeneratedPrayer();
  };

  // 생성된 기도문이 있으면 결과 화면 표시
  useEffect(() => {
    if (generatedPrayer) {
      setShowResult(true);
    }
  }, [generatedPrayer]);

  if (isOpen) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="개인화된 기도문 생성"
        className="max-w-2xl"
      >
        <div className={className}>
          {!showResult ? (
            /* 기도문 생성 폼 */
            <div>
              <form onSubmit={handleGeneratePrayer} className="space-y-6">
                {/* 기도 요청 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기도 요청사항 *
                  </label>
                  <textarea
                    value={prayerRequest}
                    onChange={(e) => setPrayerRequest(e.target.value)}
                    placeholder="어떤 일에 대해 기도하고 싶으신지 자세히 말씀해 주세요..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {prayerRequest.length}/1000자
                  </div>
                </div>

                {/* 주제 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    기도 주제 (선택사항)
                  </label>
                  
                  {topicsLoading ? (
                    <LoadingSpinner size="small" text="주제 로딩 중..." />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {topics.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => handleTopicToggle(topic.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                            selectedTopics.includes(topic.id)
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          <span className="text-lg">{topic.icon}</span>
                          <span className="text-sm font-medium">{topic.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 에러 메시지 */}
                {generationError && (
                  <ErrorMessage error={generationError} />
                )}

                {/* 생성 버튼 */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !prayerRequest.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? (
                      <LoadingSpinner size="small" text="" />
                    ) : (
                      <Heart className="w-4 h-4" />
                    )}
                    기도문 생성
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* 생성된 기도문 결과 */
            <div>
              <div className="prayer-content">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">개인화된 기도문</h3>
                </div>
                
                <div className="whitespace-pre-wrap leading-relaxed">
                  {generatedPrayer?.content}
                </div>
                
                <div className="text-sm opacity-75 mt-4">
                  생성일시: {dateUtils.formatDate(generatedPrayer?.generatedAt, 'YYYY-MM-DD HH:mm')}
                </div>
              </div>

              {/* 관련 성경 구절 */}
              {generatedPrayer?.bibleReferences && generatedPrayer.bibleReferences.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    관련 성경구절
                  </h4>
                  <div className="space-y-3">
                    {generatedPrayer.bibleReferences.map((verse, index) => (
                      <BibleVerse
                        key={index}
                        verse={verse}
                        showActions={false}
                        showThemes={false}
                        className="bg-blue-50 border border-blue-100"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={handleSavePrayer}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  저장
                </button>
                
                <button
                  onClick={handleSharePrayer}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  공유
                </button>
                
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Heart className="w-4 h-4" />
                  다시 생성
                </button>
                
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 토스트 메시지 */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={closeToast}
        />
      </Modal>
    );
  }

  // 인라인 모드 (모달이 아닌 경우)
  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* 인라인 컨텐츠는 필요시 구현 */}
    </div>
  );
};

/**
 * 일일 기도문 컴포넌트
 */
const DailyPrayer = ({ className = '' }) => {
  const {
    dailyPrayer,
    isLoading,
    error,
    refreshDailyPrayer
  } = useDailyPrayer();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <LoadingSpinner text="오늘의 기도문을 준비하고 있습니다..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <ErrorMessage error={error} onRetry={refreshDailyPrayer} />
      </div>
    );
  }

  if (!dailyPrayer) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <EmptyState
          icon={<Clock className="w-12 h-12" />}
          title="오늘의 기도문"
          description="오늘의 기도문을 준비 중입니다."
          actionButton={
            <button
              onClick={refreshDailyPrayer}
              className="btn-primary"
            >
              새로고침
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">오늘의 기도문</h3>
        </div>
        <div className="text-sm text-gray-500">
          {dateUtils.formatDate(dailyPrayer.date, 'YYYY.MM.DD')}
        </div>
      </div>

      <div className="prayer-content mb-4">
        <div className="whitespace-pre-wrap leading-relaxed">
          {dailyPrayer.content}
        </div>
      </div>

      {/* 관련 성경 구절 */}
      {dailyPrayer.bibleReferences && dailyPrayer.bibleReferences.length > 0 && (
        <div className="space-y-2">
          {dailyPrayer.bibleReferences.map((verse, index) => (
            <BibleVerse
              key={index}
              verse={verse}
              showActions={false}
              showThemes={true}
              className="bg-blue-50 border border-blue-100"
            />
          ))}
        </div>
      )}

      {/* 새로고침 버튼 */}
      <div className="flex justify-end mt-4">
        <button
          onClick={refreshDailyPrayer}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          새로운 기도문 받기
        </button>
      </div>
    </div>
  );
};

/**
 * 저장된 기도문 목록 컴포넌트
 */
const SavedPrayersList = ({ className = '' }) => {
  const {
    localPrayers,
    isLoading,
    deleteLocalPrayer,
    sharePrayer
  } = useSavedPrayers();

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleDelete = (prayerId) => {
    const result = deleteLocalPrayer(prayerId);
    if (result.success) {
      setToast({ show: true, message: '기도문이 삭제되었습니다.', type: 'success' });
    }
  };

  const handleShare = (prayer) => {
    const result = sharePrayer(prayer);
    if (result.success) {
      setToast({ show: true, message: '기도문이 클립보드에 복사되었습니다.', type: 'success' });
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <LoadingSpinner text="저장된 기도문을 불러오고 있습니다..." />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">저장된 기도문</h3>
          <span className="text-sm text-gray-500">({localPrayers.length}개)</span>
        </div>
      </div>

      <div className="p-6">
        {localPrayers.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-12 h-12" />}
            title="저장된 기도문이 없습니다"
            description="기도문을 생성하고 저장해보세요."
          />
        ) : (
          <div className="space-y-4">
            {localPrayers.map((prayer) => (
              <div key={prayer.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm text-gray-500">
                    {dateUtils.formatDate(prayer.savedAt, 'YYYY.MM.DD HH:mm')}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleShare(prayer)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="공유"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prayer.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="text-gray-800 text-sm line-clamp-3">
                  {prayer.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 토스트 메시지 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
};

export default PrayerGeneration;
export { DailyPrayer, SavedPrayersList };
