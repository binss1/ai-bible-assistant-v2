import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../services/api';

// 인증 컨텍스트 생성
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    fontSize: 'medium',
    language: 'ko',
    notifications: true,
    autoSave: true
  });

  // 초기화
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      // 저장된 토큰 확인
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('userData');
      const savedPreferences = localStorage.getItem('userPreferences');

      if (token && savedUser) {
        // 토큰 유효성 검증
        const isValid = await validateToken(token);
        if (isValid) {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
          
          if (savedPreferences) {
            setPreferences(JSON.parse(savedPreferences));
          }
        } else {
          // 토큰이 유효하지 않으면 로그아웃
          await logout();
        }
      }
    } catch (error) {
      console.error('인증 초기화 실패:', error);
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token) => {
    try {
      const response = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.valid;
    } catch (error) {
      return false;
    }
  };

  // 게스트 로그인 (간단한 세션 기반)
  const loginAsGuest = useCallback(async (guestName = '방문자') => {
    setIsLoading(true);
    setError(null);

    try {
      const guestUser = {
        id: `guest_${Date.now()}`,
        name: guestName,
        type: 'guest',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      };

      // 게스트 세션 생성
      const sessionToken = generateGuestToken();
      
      setUser(guestUser);
      setIsAuthenticated(true);
      
      // 로컬 스토리지에 저장
      localStorage.setItem('authToken', sessionToken);
      localStorage.setItem('userData', JSON.stringify(guestUser));
      
      return { success: true, user: guestUser };
    } catch (error) {
      setError('게스트 로그인에 실패했습니다.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 이메일 로그인 (향후 확장용)
  const loginWithEmail = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      setUser(userData);
      setIsAuthenticated(true);
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 회원가입 (향후 확장용)
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', userData);
      const { token, user: newUser } = response.data;

      setUser(newUser);
      setIsAuthenticated(true);
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(newUser));
      
      return { success: true, user: newUser };
    } catch (error) {
      setError('회원가입에 실패했습니다. 다시 시도해 주세요.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 서버에 로그아웃 요청 (선택적)
      const token = localStorage.getItem('authToken');
      if (token && user?.type !== 'guest') {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    }

    // 로컬 상태 정리
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    
    // 로컬 스토리지 정리
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    setIsLoading(false);
  }, [user]);

  // 사용자 정보 업데이트
  const updateUser = useCallback(async (updates) => {
    if (!user) return { success: false, error: '로그인이 필요합니다.' };

    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = { ...user, ...updates, lastUpdated: new Date().toISOString() };

      if (user.type !== 'guest') {
        // 서버에 업데이트 요청
        const token = localStorage.getItem('authToken');
        await api.patch('/auth/user', updates, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      setError('사용자 정보 업데이트에 실패했습니다.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 사용자 설정 업데이트
  const updatePreferences = useCallback(async (newPreferences) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('userPreferences', JSON.stringify(updatedPreferences));

    // 서버에 저장 (로그인 사용자만)
    if (user && user.type !== 'guest') {
      try {
        const token = localStorage.getItem('authToken');
        await api.patch('/auth/preferences', updatedPreferences, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('설정 저장 실패:', error);
      }
    }
  }, [preferences, user]);

  // 마지막 활동 시간 업데이트
  const updateLastActive = useCallback(() => {
    if (user) {
      const updatedUser = { ...user, lastActive: new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('userData', JSON.stringify(updatedUser));
    }
  }, [user]);

  // 게스트 토큰 생성
  const generateGuestToken = () => {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  // 사용자 통계 가져오기
  const getUserStats = useCallback(async () => {
    if (!user) return null;

    try {
      const token = localStorage.getItem('authToken');
      const response = await api.get('/auth/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return null;
    }
  }, [user]);

  // 계정 삭제 (향후 확장용)
  const deleteAccount = useCallback(async () => {
    if (!user || user.type === 'guest') {
      return { success: false, error: '게스트 계정은 삭제할 수 없습니다.' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      await api.delete('/auth/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      await logout();
      return { success: true };
    } catch (error) {
      setError('계정 삭제에 실패했습니다.');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [user, logout]);

  // 에러 메시지 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // 상태
    user,
    isLoading,
    isAuthenticated,
    error,
    preferences,

    // 인증 함수들
    loginAsGuest,
    loginWithEmail,
    register,
    logout,

    // 사용자 관리
    updateUser,
    updatePreferences,
    updateLastActive,
    getUserStats,
    deleteAccount,

    // 유틸리티
    clearError
  };
};

// AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};