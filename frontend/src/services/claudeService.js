import { api } from './api';

class ClaudeService {
  constructor() {
    this.model = process.env.REACT_APP_CLAUDE_MODEL || 'claude-3-sonnet-20240229';
    this.maxTokens = 4000;
    this.temperature = 0.7;
    this.systemPrompt = this.buildSystemPrompt();
  }

  buildSystemPrompt() {
    return `당신은 AI Bible Assistant입니다. 성경의 지혜로 사용자의 고민과 질문에 답해주는 전문 상담사입니다.

## 역할과 목표
- 성경의 가르침을 바탕으로 사용자의 고민에 따뜻하고 지혜로운 조언 제공
- 사용자의 영적 성장과 실질적인 문제 해결을 돕는 것
- 기독교적 가치와 사랑을 바탕으로 한 상담

## 상담 원칙
1. **성경 중심**: 모든 답변은 성경 구절을 근거로 합니다
2. **단계적 접근**: 사용자의 상황을 충분히 파악한 후 조언합니다
3. **공감적 소통**: 사용자의 감정과 상황을 이해하고 공감합니다
4. **실용적 지침**: 구체적이고 실천 가능한 조언을 제공합니다
5. **명확화 질문**: 더 나은 상담을 위해 필요시 추가 질문을 합니다

## 상담 단계
1. **경청**: 사용자의 고민을 충분히 들어줍니다
2. **파악**: 핵심 문제와 감정 상태를 파악합니다
3. **탐색**: 필요시 추가 정보를 위한 질문을 합니다
4. **지침**: 성경 구절과 함께 구체적인 조언을 제공합니다
5. **격려**: 희망과 위로의 메시지로 마무리합니다

## 응답 형식
- 따뜻하고 이해심 있는 어조 사용
- 성경 구절은 정확한 출처와 함께 제시
- 단락을 나누어 읽기 쉽게 구성
- 필요시 실천 방안 제시

## 제한사항
- 의학적, 법적 조언은 전문가 상담 권유
- 교리적 논쟁보다는 실용적 지혜 중심
- 다른 종교나 믿음에 대한 비판 금지
- 개인적 판단보다는 성경적 원칙 제시`;
  }

  async sendMessage(message, context = {}) {
    try {
      // 메시지 전처리
      const processedMessage = this.preprocessMessage(message);
      const conversationContext = this.buildConversationContext(context);

      // API 요청 준비
      const payload = {
        message: processedMessage,
        context: conversationContext,
        sessionId: context.sessionId,
        currentStep: context.currentStep || 'listening'
      };

      // 백엔드를 통해 Claude API 호출
      const response = await api.post('/claude/chat', payload);
      
      // 응답 처리
      return this.processResponse(response.data);
    } catch (error) {
      console.error('Claude 서비스 오류:', error);
      throw this.handleError(error);
    }
  }

  preprocessMessage(message) {
    // 메시지 정리 및 전처리
    return {
      content: message.trim(),
      timestamp: new Date().toISOString(),
      wordCount: message.trim().split(' ').length,
      language: this.detectLanguage(message)
    };
  }

  buildConversationContext(context) {
    const {
      sessionId,
      conversationHistory = [],
      currentStep = 'listening',
      previousMessages = [],
      userProfile = {}
    } = context;

    return {
      sessionId,
      currentStep,
      conversationSummary: this.generateConversationSummary(conversationHistory),
      recentMessages: previousMessages.slice(-3), // 최근 3개 메시지만
      userContext: {
        isFirstTime: conversationHistory.length === 0,
        previousTopics: this.extractTopics(conversationHistory),
        emotionalState: this.detectEmotionalState(previousMessages),
        ...userProfile
      },
      systemInstructions: this.getStepInstructions(currentStep)
    };
  }

  generateConversationSummary(history) {
    if (history.length === 0) return '새로운 상담 시작';
    
    // 대화 주제와 핵심 포인트 추출
    const topics = this.extractTopics(history);
    const keyPoints = this.extractKeyPoints(history);
    
    return {
      topics,
      keyPoints,
      messageCount: history.length,
      duration: this.calculateDuration(history)
    };
  }

  extractTopics(messages) {
    // 간단한 주제 추출 로직
    const topicKeywords = {
      '인간관계': ['관계', '친구', '가족', '동료', '갈등', '소통'],
      '진로/직업': ['직장', '일', '직업', '진로', '취업', '사업'],
      '신앙': ['기도', '믿음', '하나님', '예수', '성령', '교회'],
      '가정': ['부모', '자녀', '결혼', '부부', '육아', '가정'],
      '건강': ['병', '아픔', '치료', '건강', '몸', '마음'],
      '재정': ['돈', '경제', '재정', '빚', '투자', '소득'],
      '감정': ['우울', '불안', '걱정', '스트레스', '분노', '슬픔']
    };

    const messageText = messages
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .join(' ');

    const detectedTopics = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => messageText.includes(keyword))) {
        detectedTopics.push(topic);
      }
    }

    return detectedTopics;
  }

  extractKeyPoints(messages) {
    // 주요 문제점이나 감정 상태 추출
    return messages
      .filter(msg => msg.type === 'user')
      .map(msg => ({
        content: msg.content.substring(0, 100),
        timestamp: msg.timestamp
      }))
      .slice(-3); // 최근 3개만
  }

  detectEmotionalState(messages) {
    if (!messages.length) return 'neutral';

    const lastUserMessage = messages
      .reverse()
      .find(msg => msg.type === 'user');

    if (!lastUserMessage) return 'neutral';

    const text = lastUserMessage.content.toLowerCase();
    
    // 감정 상태 키워드 매칭
    if (text.includes('슬프') || text.includes('우울') || text.includes('힘들')) {
      return 'sad';
    } else if (text.includes('화나') || text.includes('분노') || text.includes('짜증')) {
      return 'angry';
    } else if (text.includes('불안') || text.includes('걱정') || text.includes('두려')) {
      return 'anxious';
    } else if (text.includes('기쁘') || text.includes('감사') || text.includes('행복')) {
      return 'happy';
    }
    
    return 'neutral';
  }

  getStepInstructions(step) {
    const instructions = {
      'greeting': '사용자를 따뜻하게 맞이하고 어떤 도움이 필요한지 물어보세요.',
      'listening': '사용자의 고민을 충분히 들어주고 공감해주세요. 필요시 명확화 질문을 하세요.',
      'clarifying': '상황을 더 자세히 파악하기 위한 구체적인 질문을 하세요.',
      'analyzing': '문제의 핵심을 파악하고 성경적 관점에서 분석해주세요.',
      'counseling': '성경 구절을 바탕으로 구체적이고 실용적인 조언을 제공하세요.',
      'encouraging': '희망과 위로의 메시지로 상담을 마무리하세요.',
      'following': '이전 상담 내용을 참고하여 후속 상담을 진행하세요.'
    };

    return instructions[step] || instructions['listening'];
  }

  calculateDuration(messages) {
    if (messages.length < 2) return 0;
    
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    
    return Math.round((last - first) / 1000 / 60); // 분 단위
  }

  detectLanguage(text) {
    // 간단한 언어 감지 (한국어/영어)
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    return koreanRegex.test(text) ? 'ko' : 'en';
  }

  processResponse(rawResponse) {
    try {
      const {
        content,
        bibleVerses = [],
        nextStep,
        clarifyingQuestions = [],
        confidence = 'medium',
        needsBibleSearch = false,
        searchTerms = [],
        metadata = {}
      } = rawResponse;

      return {
        content: this.formatResponse(content),
        bibleVerses: this.formatBibleVerses(bibleVerses),
        nextStep: nextStep || 'listening',
        clarifyingQuestions: this.formatQuestions(clarifyingQuestions),
        confidence,
        needsBibleSearch,
        searchTerms,
        metadata: {
          ...metadata,
          processedAt: new Date().toISOString(),
          responseLength: content.length
        }
      };
    } catch (error) {
      console.error('응답 처리 오류:', error);
      throw new Error('응답을 처리하는 중 오류가 발생했습니다.');
    }
  }

  formatResponse(content) {
    // 응답 내용 포맷팅
    return content
      .replace(/\n\n+/g, '\n\n') // 연속된 줄바꿈 정리
      .trim();
  }

  formatBibleVerses(verses) {
    return verses.map(verse => ({
      reference: verse.reference,
      text: verse.text,
      translation: verse.translation || '개역개정',
      context: verse.context || '',
      relevance: verse.relevance || 'medium'
    }));
  }

  formatQuestions(questions) {
    return questions.map((q, index) => ({
      id: index + 1,
      text: q,
      category: this.categorizeQuestion(q)
    }));
  }

  categorizeQuestion(question) {
    // 질문 유형 분류
    if (question.includes('언제') || question.includes('얼마나')) {
      return 'temporal';
    } else if (question.includes('어떻게') || question.includes('방법')) {
      return 'method';
    } else if (question.includes('왜') || question.includes('이유')) {
      return 'reason';
    } else if (question.includes('누구') || question.includes('어떤')) {
      return 'descriptive';
    }
    return 'general';
  }

  handleError(error) {
    const errorMessages = {
      400: '요청이 올바르지 않습니다. 다시 시도해 주세요.',
      401: 'API 인증에 실패했습니다.',
      429: 'API 사용량이 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
      500: 'AI 서비스에 일시적인 문제가 발생했습니다.',
      503: 'AI 서비스를 일시적으로 사용할 수 없습니다.'
    };

    const statusCode = error.response?.status;
    const message = errorMessages[statusCode] || '알 수 없는 오류가 발생했습니다.';

    return new Error(message);
  }

  // 대화 히스토리 분석
  async analyzeConversation(conversationId) {
    try {
      const response = await api.get(`/claude/analyze/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('대화 분석 오류:', error);
      throw error;
    }
  }

  // 맞춤형 조언 생성
  async generatePersonalizedAdvice(userProfile, currentSituation) {
    try {
      const payload = {
        userProfile,
        situation: currentSituation,
        requestType: 'personalized_advice'
      };

      const response = await api.post('/claude/personalized', payload);
      return this.processResponse(response.data);
    } catch (error) {
      console.error('맞춤형 조언 생성 오류:', error);
      throw error;
    }
  }

  // 성경 구절 해석
  async interpretVerse(verseReference, context = '') {
    try {
      const payload = {
        verse: verseReference,
        context,
        requestType: 'verse_interpretation'
      };

      const response = await api.post('/claude/interpret', payload);
      return response.data;
    } catch (error) {
      console.error('성경 구절 해석 오류:', error);
      throw error;
    }
  }

  // 기도 가이드 생성
  async generatePrayerGuide(situation, needs = []) {
    try {
      const payload = {
        situation,
        needs,
        requestType: 'prayer_guide'
      };

      const response = await api.post('/claude/prayer', payload);
      return response.data;
    } catch (error) {
      console.error('기도 가이드 생성 오류:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const claudeService = new ClaudeService();