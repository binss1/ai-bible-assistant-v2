import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// PWA 관련
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// 환경 변수 확인
console.log('Environment:', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  console.log('API URL:', process.env.REACT_APP_API_URL);
  console.log('Claude Model:', process.env.REACT_APP_CLAUDE_MODEL);
}

// React 18 방식으로 앱 렌더링
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA 서비스 워커 등록
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('SW registered: ', registration);
  },
  onUpdate: (registration) => {
    console.log('SW updated: ', registration);
    // 업데이트 알림 표시 (선택적)
    if (window.confirm('새 버전이 있습니다. 새로고침하시겠습니까?')) {
      window.location.reload();
    }
  }
});

// 성능 측정 (선택적)
reportWebVitals((metric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vital:', metric);
  }
  
  // 프로덕션에서는 분석 서비스로 전송 가능
  // sendToAnalytics(metric);
});

// 전역 에러 핸들러
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // 에러 리포팅 서비스로 전송 (향후 구현)
  // reportError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Promise 에러 리포팅 (향후 구현)
  // reportError(event.reason);
});

// 오프라인/온라인 상태 감지
window.addEventListener('online', () => {
  console.log('연결이 복구되었습니다');
  // UI 업데이트 또는 재연결 로직
});

window.addEventListener('offline', () => {
  console.log('오프라인 상태입니다');
  // 오프라인 모드 UI 표시
});

// 개발 모드에서만 React DevTools 팁 표시
if (process.env.NODE_ENV === 'development') {
  console.log(
    '%cAI Bible Assistant - Development Mode',
    'color: #4CAF50; font-size: 16px; font-weight: bold;'
  );
  console.log('React DevTools를 사용하여 컴포넌트를 디버깅하세요.');
}