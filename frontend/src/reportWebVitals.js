// reportWebVitals.js - 웹 성능 지표 측정 및 리포팅

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// 성능 지표 분석 및 저장
export const analyzePerformance = (metric) => {
  const {
    name,
    value,
    delta,
    entries,
    id,
    navigationType
  } = metric;

  // 개발 모드에서 콘솔 출력
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Web Vital: ${name}`);
    console.log(`Value: ${value.toFixed(2)}`);
    console.log(`Delta: ${delta.toFixed(2)}`);
    console.log(`ID: ${id}`);
    console.log(`Navigation Type: ${navigationType}`);
    console.groupEnd();
  }

  // 성능 임계값 정의
  const thresholds = {
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FID: { good: 100, needsImprovement: 300 },
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    TTFB: { good: 800, needsImprovement: 1800 }
  };

  // 성능 등급 계산
  const getPerformanceGrade = (metricName, value) => {
    const threshold = thresholds[metricName];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const grade = getPerformanceGrade(name, value);

  // 로컬 스토리지에 성능 데이터 저장
  try {
    const performanceData = JSON.parse(
      localStorage.getItem('webVitalsData') || '[]'
    );
    
    const newEntry = {
      name,
      value,
      delta,
      grade,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      connectionType: getConnectionType(),
      deviceMemory: getDeviceMemory(),
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
    };
    
    performanceData.push(newEntry);
    
    // 최근 100개 항목만 유지
    if (performanceData.length > 100) {
      performanceData.splice(0, performanceData.length - 100);
    }
    
    localStorage.setItem('webVitalsData', JSON.stringify(performanceData));
  } catch (error) {
    console.error('Failed to save performance data:', error);
  }

  // 분석 서비스로 전송 (프로덕션 환경)
  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(metric, grade);
  }

  // 성능 경고 표시
  if (grade === 'poor') {
    console.warn(`⚠️ Poor ${name} performance detected: ${value.toFixed(2)}`);
    showPerformanceWarning(name, value, grade);
  }
};

// 네트워크 연결 타입 확인
const getConnectionType = () => {
  if ('connection' in navigator) {
    return navigator.connection.effectiveType || 'unknown';
  }
  return 'unknown';
};

// 디바이스 메모리 확인
const getDeviceMemory = () => {
  if ('deviceMemory' in navigator) {
    return `${navigator.deviceMemory}GB`;
  }
  return 'unknown';
};

// 분석 서비스로 데이터 전송
const sendToAnalytics = (metric, grade) => {
  const { name, value, id } = metric;
  
  // Google Analytics 4로 전송
  if (window.gtag && process.env.REACT_APP_GOOGLE_ANALYTICS_ID) {
    window.gtag('event', name, {
      custom_parameter_1: value,
      custom_parameter_2: id,
      custom_parameter_3: grade
    });
  }
  
  // Mixpanel로 전송
  if (window.mixpanel && process.env.REACT_APP_MIXPANEL_TOKEN) {
    window.mixpanel.track(`Web Vital: ${name}`, {
      value,
      grade,
      metric_id: id,
      url: window.location.pathname
    });
  }
  
  // 커스텀 분석 엔드포인트로 전송
  if (process.env.REACT_APP_ANALYTICS_ENDPOINT) {
    fetch(process.env.REACT_APP_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'web-vital',
        metric: name,
        value,
        grade,
        timestamp: Date.now(),
        url: window.location.pathname,
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.error('Failed to send analytics:', error);
    });
  }
};

// 성능 경고 표시
const showPerformanceWarning = (metricName, value, grade) => {
  // 너무 많은 경고를 방지하기 위한 쿨다운
  const lastWarning = localStorage.getItem('lastPerformanceWarning');
  const now = Date.now();
  
  if (lastWarning && now - parseInt(lastWarning) < 60000) {
    return; // 1분 내에는 경고 표시하지 않음
  }
  
  localStorage.setItem('lastPerformanceWarning', now.toString());
  
  // 성능 경고 이벤트 발송
  window.dispatchEvent(new CustomEvent('performanceWarning', {
    detail: {
      metric: metricName,
      value,
      grade,
      message: getPerformanceMessage(metricName, grade)
    }
  }));
};

// 성능 개선 메시지 생성
const getPerformanceMessage = (metricName, grade) => {
  const messages = {
    CLS: '레이아웃이 불안정합니다. 이미지와 광고의 크기를 미리 지정해보세요.',
    FID: '상호작용 응답이 느립니다. JavaScript 실행을 최적화해보세요.',
    FCP: '첫 콘텐츠 표시가 늦습니다. 중요한 리소스의 로딩을 우선순위화해보세요.',
    LCP: '가장 큰 콘텐츠 요소의 표시가 늦습니다. 이미지 최적화를 고려해보세요.',
    TTFB: '서버 응답이 늦습니다. 서버 성능이나 CDN 사용을 검토해보세요.'
  };
  
  return messages[metricName] || '성능 개선이 필요합니다.';
};

// 성능 리포트 생성
export const generatePerformanceReport = () => {
  try {
    const data = JSON.parse(localStorage.getItem('webVitalsData') || '[]');
    
    if (data.length === 0) {
      return null;
    }
    
    // 메트릭별 통계 계산
    const metrics = ['CLS', 'FID', 'FCP', 'LCP', 'TTFB'];
    const report = {};
    
    metrics.forEach(metric => {
      const metricData = data.filter(item => item.name === metric);
      
      if (metricData.length > 0) {
        const values = metricData.map(item => item.value);
        const grades = metricData.map(item => item.grade);
        
        report[metric] = {
          count: metricData.length,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: metricData[metricData.length - 1],
          gradeDistribution: {
            good: grades.filter(g => g === 'good').length,
            needsImprovement: grades.filter(g => g === 'needs-improvement').length,
            poor: grades.filter(g => g === 'poor').length
          }
        };
      }
    });
    
    return {
      generatedAt: new Date().toISOString(),
      totalMeasurements: data.length,
      timeRange: {
        start: new Date(data[0].timestamp).toISOString(),
        end: new Date(data[data.length - 1].timestamp).toISOString()
      },
      metrics: report
    };
  } catch (error) {
    console.error('Failed to generate performance report:', error);
    return null;
  }
};

// 성능 데이터 내보내기
export const exportPerformanceData = () => {
  try {
    const data = localStorage.getItem('webVitalsData');
    if (!data) return null;
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-vitals-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export performance data:', error);
    return false;
  }
};

// 성능 데이터 초기화
export const clearPerformanceData = () => {
  try {
    localStorage.removeItem('webVitalsData');
    localStorage.removeItem('lastPerformanceWarning');
    return true;
  } catch (error) {
    console.error('Failed to clear performance data:', error);
    return false;
  }
};

export default reportWebVitals;