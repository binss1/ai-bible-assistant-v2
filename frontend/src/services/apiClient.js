import axios from 'axios';

// API 기본 설정 - /api 경로를 포함해서 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api`;

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔗 Full API URL:', API_URL);

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 요청 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📍 Full URL: ${config.baseURL}${config.url}`);
    }
    
    // 인증 토큰 추가 (필요시)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    // 성공 응답 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    
    return response;
  },
  (error) => {
    // 에러 응답 처리
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      fullURL: error.config?.baseURL + error.config?.url,
      data: error.response?.data
    });
    
    // 사용자 친화적 에러 메시지 생성
    const errorMessage = getErrorMessage(error);
    
    // 에러 객체에 사용자 메시지 추가
    error.userMessage = errorMessage;
    
    // 인증 에러 처리
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // 로그인 페이지로 리다이렉트 (필요시)
    }
    
    return Promise.reject(error);
  }
);

// 에러 메시지 생성 함수
function getErrorMessage(error) {
  if (!error.response) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  const { status, data } = error.response;
  
  switch (status) {
    case 400:
      return data.error || '잘못된 요청입니다.';
    case 401:
      return '인증이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 API를 찾을 수 없습니다. 서버 설정을 확인해주세요.';
    case 429:
      return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    default:
      return data.error || '알 수 없는 오류가 발생했습니다.';
  }
}

// API 헬퍼 함수들
export const api = {
  // GET 요청
  get: async (url, params = {}) => {
    try {
      const response = await apiClient.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // POST 요청
  post: async (url, data = {}) => {
    try {
      const response = await apiClient.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // PUT 요청
  put: async (url, data = {}) => {
    try {
      const response = await apiClient.put(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // DELETE 요청
  delete: async (url) => {
    try {
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// 연결 상태 확인 - 기본 API 경로가 아닌 루트로 확인
export const checkApiConnection = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return {
      connected: true,
      message: response.data.message || 'API 연결 성공',
      status: response.data.status,
      database: response.data.database
    };
  } catch (error) {
    console.error('🔌 API 연결 확인 실패:', error);
    return {
      connected: false,
      message: error.userMessage || 'API 연결 실패',
      error: error.message
    };
  }
};

export default apiClient;