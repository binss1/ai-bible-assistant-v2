import { api } from './apiClient';

class ChatService {
  /**
   * 새로운 채팅 세션 시작
   */
  async startSession(userId, nickname = '익명') {
    try {
      const response = await api.post('/chat/start', {
        userId,
        nickname
      });
      
      return {
        success: true,
        sessionId: response.sessionId,
        welcomeMessage: response.welcomeMessage,
        message: response.message
      };
    } catch (error) {
      throw new Error(error.userMessage || '세션 시작 중 오류가 발생했습니다.');
    }
  }

  /**
   * 메시지 전송
   */
  async sendMessage(sessionId, userId, message) {
    try {
      const response = await api.post('/chat/message', {
        sessionId,
        userId,
        message: message.trim()
      });

      return {
        success: true,
        response: response.response
      };
    } catch (error) {
      throw new Error(error.userMessage || '메시지 전송 중 오류가 발생했습니다.');
    }
  }

  /**
   * 채팅 이력 조회
   */
  async getHistory(sessionId, userId) {
    try {
      const response = await api.get(`/chat/history/${sessionId}`, {
        userId
      });

      return {
        success: true,
        session: response.session,
        history: response.history
      };
    } catch (error) {
      throw new Error(error.userMessage || '채팅 이력 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 세션 목록 조회
   */
  async getUserSessions(userId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/chat/sessions/${userId}`, {
        page,
        limit
      });

      return {
        success: true,
        sessions: response.sessions,
        pagination: response.pagination
      };
    } catch (error) {
      throw new Error(error.userMessage || '세션 목록 조회 중 오류가 발생했습니다.');
    }
  }

  /**
   * 세션 종료
   */
  async endSession(sessionId, userId, feedback = null) {
    try {
      const response = await api.post(`/chat/end/${sessionId}`, {
        userId,
        feedback
      });

      return {
        success: true,
        message: response.message,
        summary: response.summary
      };
    } catch (error) {
      throw new Error(error.userMessage || '세션 종료 중 오류가 발생했습니다.');
    }
  }

  /**
   * 메시지 피드백 제출
   */
  async submitFeedback(messageId, helpful, rating, feedback) {
    try {
      const response = await api.post('/chat/feedback', {
        messageId,
        helpful,
        rating,
        feedback
      });

      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.warn('피드백 제출 실패:', error.userMessage);
      // 피드백 실패는 사용자 경험을 방해하지 않도록 조용히 처리
      return {
        success: false,
        message: '피드백 제출에 실패했습니다.'
      };
    }
  }
}

// 싱글톤 인스턴스 생성
const chatService = new ChatService();

export default chatService;

// 개별 함수로도 사용 가능하도록 export
export const {
  startSession,
  sendMessage,
  getHistory,
  getUserSessions,
  endSession,
  submitFeedback
} = chatService;
