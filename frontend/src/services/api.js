import axios from 'axios';

// API 기본 설정 - /api 경로 제거하여 apiClient.js와 통일
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api`; // /api 경로는 여기서 추가

console.log('🌐 API.js - Base URL:', API_BASE_URL);
console.log('🔗 API.js - Full API URL:', API_URL);

const CLAUDE_API_URL = process.env.REACT_APP_CLAUDE_API_URL || 'https://api.anthropic.com/v1';

// Axios 인스턴스 생성 - 올바른 API_URL 사용
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
  }
});

// Claude API용 별도 인스턴스
const claudeApi = axios.create({
  baseURL: CLAUDE_API_URL,
  timeout: 45000, // 45초 (AI 응답 대기시간 고려)
  headers: {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  }
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 요청 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API.js Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`📍 Full URL: ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// Claude API 요청 인터셉터
claudeApi.interceptors.request.use(
  (config) => {
    const claudeApiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    if (claudeApiKey) {
      config.headers['x-api-key'] = claudeApiKey;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Claude API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Claude API 요청 오류:', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 토큰 갱신
api.interceptors.response.use(
  (response) => {
    // 응답 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API.js Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const original = error.config;

    // 에러 로깅
    console.error('❌ API.js 응답 오류:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      fullURL: error.config?.baseURL + error.config?.url,
      data: error.response?.data
    });

    // 401 에러 (인증 실패) 처리
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      try {
        // 토큰 갱신 시도
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token } = response.data;
          
          localStorage.setItem('authToken', token);
          original.headers.Authorization = `Bearer ${token}`;
          
          return api(original);
        }
      } catch (refreshError) {
        // 리프레시 실패시 로그아웃
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        
        // 로그인 페이지로 리다이렉트 (필요한 경우)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Claude API 응답 인터셉터
claudeApi.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Claude API Response: ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    console.error('Claude API 응답 오류:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Claude API 에러 메시지 변환
    if (error.response?.status === 429) {
      error.userMessage = 'API 사용량이 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
    } else if (error.response?.status === 500) {
      error.userMessage = 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    } else {
      error.userMessage = 'AI 응답을 가져오는 중 오류가 발생했습니다.';
    }

    return Promise.reject(error);
  }
);

// API 엔드포인트 함수들
export const apiService = {
  // 인증 관련
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    validate: () => api.get('/auth/validate'),
    updateProfile: (updates) => api.patch('/auth/profile', updates),
    deleteAccount: () => api.delete('/auth/account')
  },

  // 대화 관련
  conversations: {
    getAll: () => api.get('/conversations'),
    getById: (id) => api.get(`/conversations/${id}`),
    create: (data) => api.post('/conversations', data),
    update: (id, data) => api.patch(`/conversations/${id}`, data),
    delete: (id) => api.delete(`/conversations/${id}`),
    addMessage: (conversationId, message) => 
      api.post(`/conversations/${conversationId}/messages`, message),
    getMessages: (conversationId, options = {}) => 
      api.get(`/conversations/${conversationId}/messages`, { params: options })
  },

  // 성경 관련
  bible: {
    search: (query, options) => api.post('/bible/search', { query, ...options }),
    getVerse: (reference) => api.get(`/bible/verse/${reference}`),
    getChapter: (book, chapter) => api.get(`/bible/chapter/${book}/${chapter}`),
    getBook: (book) => api.get(`/bible/book/${book}`),
    searchSemantic: (query, options) => api.post('/bible/search/semantic', { query, ...options }),
    searchKeyword: (keywords, options) => api.post('/bible/search/keyword', { keywords, ...options }),
    searchTopic: (topic, options) => api.post('/bible/search/topic', { topic, ...options }),
    getFavorites: () => api.get('/bible/favorites'),
    addFavorite: (verse) => api.post('/bible/favorites', verse),
    removeFavorite: (verseId) => api.delete(`/bible/favorites/${verseId}`)
  },

  // 사용자 설정 관련
  settings: {
    get: () => api.get('/settings'),
    update: (settings) => api.patch('/settings', settings),
    reset: () => api.post('/settings/reset')
  },

  // 통계 관련
  stats: {
    getUserStats: () => api.get('/stats/user'),
    getConversationStats: () => api.get('/stats/conversations'),
    getSearchStats: () => api.get('/stats/searches')
  },

  // 피드백 관련
  feedback: {
    submit: (feedback) => api.post('/feedback', feedback),
    getAll: () => api.get('/feedback'),
    respond: (id, response) => api.patch(`/feedback/${id}`, response)
  }
};

// Claude API 함수들
export const claudeApiService = {
  // 메시지 전송
  sendMessage: async (message, context = {}) => {
    try {
      const payload = {
        model: process.env.REACT_APP_CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `당신은 AI Bible Assistant입니다. 성경의 지혜로 사용자의 고민에 답해주는 상담사입니다.

상담 규칙:
1. 항상 성경 구절을 근거로 답변하세요
2. 사용자의 의도를 파악하기 위해 명확화 질문을 하세요
3. 단계적으로 상담을 진행하세요
4. 따뜻하고 공감적인 어조를 유지하세요
5. 구체적이고 실용적인 조언을 제공하세요

현재 대화 컨텍스트: ${JSON.stringify(context)}`
          },
          {
            role: 'user',
            content: message
          }
        ]
      };

      const response = await claudeApi.post('/messages', payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 스트리밍 메시지 (향후 구현)
  streamMessage: async (message, context = {}, onChunk) => {
    // 스트리밍 구현은 백엔드에서 처리하는 것이 더 안전
    throw new Error('스트리밍은 백엔드를 통해 사용해주세요.');
  }
};

// 에러 핸들링 유틸리티
export const handleApiError = (error) => {
  if (error.response) {
    // 서버 응답이 있는 경우
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { message: data.message || '잘못된 요청입니다.', type: 'validation' };
      case 401:
        return { message: '인증이 필요합니다.', type: 'auth' };
      case 403:
        return { message: '권한이 없습니다.', type: 'permission' };
      case 404:
        return { message: '요청한 리소스를 찾을 수 없습니다.', type: 'notFound' };
      case 429:
        return { message: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.', type: 'rateLimit' };
      case 500:
        return { message: '서버 오류가 발생했습니다.', type: 'server' };
      default:
        return { message: data.message || '알 수 없는 오류가 발생했습니다.', type: 'unknown' };
    }
  } else if (error.request) {
    // 네트워크 오류
    return { message: '네트워크 연결을 확인해 주세요.', type: 'network' };
  } else {
    // 기타 오류
    return { message: error.message || '오류가 발생했습니다.', type: 'client' };
  }
};

// API 상태 확인
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return { status: 'ok', data: response.data };
  } catch (error) {
    return { status: 'error', error: handleApiError(error) };
  }
};

// 파일 업로드 (향후 확장용)
export const uploadFile = async (file, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(progress);
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};

export { api, claudeApi };