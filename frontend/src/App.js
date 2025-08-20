import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import ChatInterface from './components/ChatInterface';
import BibleSearch from './components/BibleSearch';
import UserProfile from './components/UserProfile';
import Settings from './components/Settings';
import About from './components/About';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import NavigationBar from './components/NavigationBar';
import ConversationHistory from './components/ConversationHistory';

// Hooks
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { useBibleSearch } from './hooks/useBibleSearch';

// Services
import { checkApiHealth } from './services/api';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const [currentPage, setCurrentPage] = useState('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState({ status: 'unknown', message: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 훅 사용
  const { user, isAuthenticated, loginAsGuest, isLoading: authLoading } = useAuth();
  const chatHook = useChat();
  const searchHook = useBibleSearch();

  // 앱 초기화
  useEffect(() => {
    initializeApp();
  }, []);

  // 게스트 자동 로그인 (인증되지 않은 경우)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginAsGuest('방문자');
    }
  }, [authLoading, isAuthenticated, loginAsGuest]);

  const initializeApp = async () => {
    setIsLoading(true);
    
    try {
      // API 상태 확인
      const healthCheck = await checkApiHealth();
      setApiStatus(healthCheck);

      // 초기 설정 로드
      await loadInitialSettings();
      
    } catch (error) {
      console.error('앱 초기화 실패:', error);
      setApiStatus({ 
        status: 'error', 
        message: '서비스 연결에 실패했습니다. 새로고침 후 다시 시도해 주세요.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialSettings = async () => {
    // 사용자 설정 로드, 테마 적용 등
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 폰트 크기 설정
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    document.documentElement.setAttribute('data-font-size', savedFontSize);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'chat':
        return (
          <ChatInterface 
            chatHook={chatHook}
            searchHook={searchHook}
          />
        );
      case 'search':
        return (
          <BibleSearch 
            searchHook={searchHook}
          />
        );
      case 'history':
        return (
          <ConversationHistory 
            chatHook={chatHook}
          />
        );
      case 'profile':
        return (
          <UserProfile 
            user={user}
          />
        );
      case 'settings':
        return (
          <Settings />
        );
      case 'about':
        return (
          <About />
        );
      default:
        return (
          <ChatInterface 
            chatHook={chatHook}
            searchHook={searchHook}
          />
        );
    }
  };

  // 로딩 중이거나 API 상태가 불안정한 경우
  if (isLoading || authLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner size="large" />
        <p>AI Bible Assistant를 준비중입니다...</p>
      </div>
    );
  }

  // API 연결 실패 시
  if (apiStatus.status === 'error') {
    return (
      <div className="app-error">
        <div className="error-container">
          <h2>⚠️ 서비스 연결 오류</h2>
          <p>{apiStatus.message}</p>
          <button 
            onClick={initializeApp}
            className="retry-button"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 네비게이션 바 */}
      <NavigationBar 
        currentPage={currentPage}
        onPageChange={handlePageChange}
        user={user}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="app-main">
        <div className="app-container">
          {renderCurrentPage()}
        </div>
      </main>

      {/* 상태 표시 */}
      {apiStatus.status === 'warning' && (
        <div className="status-warning">
          <p>⚠️ 일부 기능이 제한될 수 있습니다: {apiStatus.message}</p>
        </div>
      )}

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* PWA 설치 안내 (향후 추가) */}
      <InstallPrompt />
    </div>
  );
}

// PWA 설치 프롬프트 컴포넌트
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA가 설치되었습니다');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // 이미 설치를 거부했거나 PWA가 아닌 경우 표시하지 않음
  if (!showInstallPrompt || localStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <h3>📱 앱으로 설치하기</h3>
        <p>AI Bible Assistant를 홈 화면에 추가하여 더 편리하게 사용하세요!</p>
        <div className="install-prompt-actions">
          <button onClick={handleInstall} className="install-button">
            설치하기
          </button>
          <button onClick={handleDismiss} className="dismiss-button">
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;