import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Book, MessageCircle, Heart, Settings, Menu, X, Home } from 'lucide-react';

// 컴포넌트 import
import ChatInterface from './components/ChatInterface';
import PrayerGeneration, { DailyPrayer, SavedPrayersList } from './components/PrayerGeneration';
import { BibleVerse, LoadingSpinner, Toast } from './components/UIComponents';

// 훅 import
import { useBibleRecommendations, useBibleFavorites } from './hooks/useBible';
import { usePrayerSettings } from './hooks/usePrayer';

// 유틸리티 import
import { userUtils, dateUtils } from './utils';
import { checkApiConnection } from './services/apiClient';

/**
 * 메인 애플리케이션 컴포넌트
 */
function App() {
  // 상태 관리
  const [currentPage, setCurrentPage] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [apiStatus, setApiStatus] = useState({ connected: false, loading: true });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // 사용자 정보
  const [userProfile, setUserProfile] = useState(userUtils.getUserProfile());

  // 훅 사용
  const { todayVerse } = useBibleRecommendations();
  const { favorites } = useBibleFavorites();
  const { settings, updateSettings } = usePrayerSettings();

  /**
   * API 연결 상태 확인
   */
  const checkConnection = async () => {
    try {
      const status = await checkApiConnection();
      setApiStatus({ connected: status.connected, loading: false });
      
      if (!status.connected) {
        showToast('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
      }
    } catch (error) {
      setApiStatus({ connected: false, loading: false });
      showToast('서버 연결을 확인할 수 없습니다.', 'error');
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
   * 페이지 변경 핸들러
   */
  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false); // 모바일에서 사이드바 자동 닫기
  };

  /**
   * 기도문 생성 모달 열기
   */
  const handleOpenPrayerModal = (sessionId) => {
    setCurrentSessionId(sessionId);
    setShowPrayerModal(true);
  };

  /**
   * 기도문 생성 모달 닫기
   */
  const handleClosePrayerModal = () => {
    setShowPrayerModal(false);
    setCurrentSessionId(null);
  };

  /**
   * 사이드바 토글
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    checkConnection();
    
    // 사용자 프로필 업데이트
    const profile = userUtils.getUserProfile();
    setUserProfile(profile);
  }, []);

  // 연결 상태 확인 중
  if (apiStatus.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Book className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Bible Assistant</h1>
          <LoadingSpinner text="시스템을 초기화하고 있습니다..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="flex h-screen">
        {/* 사이드바 */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Book className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900">Bible Assistant</h1>
              </div>
              
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 네비게이션 메뉴 */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                <NavItem
                  icon={<MessageCircle className="w-5 h-5" />}
                  label="AI 상담"
                  active={currentPage === 'chat'}
                  onClick={() => handlePageChange('chat')}
                />
                
                <NavItem
                  icon={<Heart className="w-5 h-5" />}
                  label="기도문"
                  active={currentPage === 'prayer'}
                  onClick={() => handlePageChange('prayer')}
                />
                
                <NavItem
                  icon={<Book className="w-5 h-5" />}
                  label="성경 구절"
                  active={currentPage === 'bible'}
                  onClick={() => handlePageChange('bible')}
                />
                
                <NavItem
                  icon={<Settings className="w-5 h-5" />}
                  label="설정"
                  active={currentPage === 'settings'}
                  onClick={() => handlePageChange('settings')}
                />
              </div>
            </nav>

            {/* 사용자 정보 */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {userProfile.nickname.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {userProfile.nickname}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dateUtils.formatDate(userProfile.joinedAt, 'YYYY.MM.DD')} 가입
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 사이드바 오버레이 (모바일) */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* 메인 컨텐츠 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 상단 헤더 (모바일) */}
          <header className="lg:hidden bg-white shadow-sm border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center">
                  <Book className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-gray-900">AI Bible Assistant</span>
              </div>
              
              <div className={`w-2 h-2 rounded-full ${
                apiStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`} title={apiStatus.connected ? '연결됨' : '연결 안됨'}></div>
            </div>
          </header>

          {/* 페이지 컨텐츠 */}
          <div className="flex-1 overflow-auto">
            {currentPage === 'chat' && (
              <ChatInterface onGeneratePrayer={handleOpenPrayerModal} />
            )}
            
            {currentPage === 'prayer' && (
              <PrayerPage />
            )}
            
            {currentPage === 'bible' && (
              <BiblePage todayVerse={todayVerse} favorites={favorites} />
            )}
            
            {currentPage === 'settings' && (
              <SettingsPage 
                userProfile={userProfile}
                setUserProfile={setUserProfile}
                settings={settings}
                updateSettings={updateSettings}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* 기도문 생성 모달 */}
      <PrayerGeneration
        sessionId={currentSessionId}
        isOpen={showPrayerModal}
        onClose={handleClosePrayerModal}
      />

      {/* 토스트 메시지 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={closeToast}
      />
    </div>
  );
}

/**
 * 네비게이션 아이템 컴포넌트
 */
const NavItem = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

/**
 * 기도문 페이지 컴포넌트
 */
const PrayerPage = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyPrayer />
        <SavedPrayersList />
      </div>
    </div>
  );
};

/**
 * 성경 구절 페이지 컴포넌트
 */
const BiblePage = ({ todayVerse, favorites }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 말씀 */}
        {todayVerse && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-500" />
              오늘의 말씀
            </h3>
            <BibleVerse verse={todayVerse} showActions={true} />
          </div>
        )}

        {/* 즐겨찾기 구절 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            즐겨찾기 ({favorites.length})
          </h3>
          
          {favorites.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              즐겨찾기한 성경 구절이 없습니다.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {favorites.slice(0, 5).map((verse, index) => (
                <BibleVerse
                  key={index}
                  verse={verse}
                  showActions={false}
                  showThemes={true}
                  className="bg-red-50 border border-red-100"
                />
              ))}
              {favorites.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{favorites.length - 5}개 더
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 설정 페이지 컴포넌트
 */
const SettingsPage = ({ userProfile, setUserProfile, settings, updateSettings, showToast }) => {
  const [nickname, setNickname] = useState(userProfile.nickname);

  const handleUpdateNickname = () => {
    const result = userUtils.updateNickname(nickname);
    if (result.success) {
      setUserProfile(result.profile);
      showToast('닉네임이 변경되었습니다.');
    } else {
      showToast(result.error, 'error');
    }
  };

  const handleToggleSetting = (key) => {
    const result = updateSettings({ [key]: !settings[key] });
    if (result.success) {
      showToast('설정이 저장되었습니다.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">설정</h2>
        
        <div className="space-y-6">
          {/* 사용자 정보 */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">사용자 정보</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  닉네임
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={20}
                  />
                  <button
                    onClick={handleUpdateNickname}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    변경
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">가입일</label>
                <p className="text-sm text-gray-600 mt-1">
                  {dateUtils.formatDate(userProfile.joinedAt, 'YYYY년 MM월 DD일')}
                </p>
              </div>
            </div>
          </div>

          {/* 기도 설정 */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">기도 설정</h3>
            <div className="space-y-3">
              <SettingToggle
                label="일일 기도 알림"
                description="매일 기도문을 받아보세요"
                checked={settings.dailyReminder}
                onChange={() => handleToggleSetting('dailyReminder')}
              />
              
              <SettingToggle
                label="알림 받기"
                description="중요한 업데이트를 알림으로 받아보세요"
                checked={settings.notifications}
                onChange={() => handleToggleSetting('notifications')}
              />
            </div>
          </div>

          {/* 앱 정보 */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">앱 정보</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>버전: 1.0.0</p>
              <p>개발: AI Bible Assistant Team</p>
              <p>문의: support@ai-bible-assistant.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 설정 토글 컴포넌트
 */
const SettingToggle = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default App;