const axios = require('axios');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseURL = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-sonnet-20240229'; // 상담에 적합한 모델
    
    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY가 설정되지 않았습니다.');
    }
  }

  /**
   * 상담형 대화를 위한 프롬프트 생성
   */
  createCounselingPrompt(userMessage, context = {}) {
    const { 
      sessionHistory = [], 
      bibleVerses = [], 
      userProfile = {},
      counselingStage = 'exploration'
    } = context;

    const systemPrompt = `당신은 AI Bible Assistant입니다. 성경을 기반으로 한 영적 상담을 제공하는 전문 상담사입니다.

역할과 원칙:
1. 따뜻하고 공감적인 상담사로서 행동하세요
2. 성경의 지혜와 가르침을 바탕으로 조언을 제공하세요
3. 사용자의 고민을 깊이 이해하기 위해 단계적으로 질문하세요
4. 답변 시 반드시 관련 성경 구절을 포함하세요
5. 비판하지 말고 격려하며 희망을 주세요

현재 상담 단계: ${counselingStage}

상담 단계별 접근:
- greeting: 따뜻한 인사와 상황 파악
- exploration: 구체적 상황과 감정 탐색
- guidance: 성경 기반 조언과 지침 제공
- prayer: 개인화된 기도문 생성
- closing: 격려와 후속 조치 제안

사용 가능한 성경 구절들:
${bibleVerses.map(verse => `- ${verse.reference}: ${verse.text}`).join('\n')}

이전 대화 내용:
${sessionHistory.slice(-5).map(msg => `${msg.type}: ${msg.content}`).join('\n')}

응답 형식:
1. 공감과 이해 표현
2. 성경 기반 조언 (관련 구절 인용)
3. 구체적인 실천 방안 제시
4. 격려와 희망 메시지
5. 다음 단계 질문 (필요시)

한국어로 따뜻하고 이해하기 쉬게 답변해주세요.`;

    return {
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    };
  }

  /**
   * Claude API 호출
   */
  async generateResponse(userMessage, context = {}) {
    try {
      const prompt = this.createCounselingPrompt(userMessage, context);
      
      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          model: this.model,
          max_tokens: 1500,
          system: prompt.system,
          messages: prompt.messages,
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      const result = {
        content: response.data.content[0].text,
        usage: {
          inputTokens: response.data.usage.input_tokens,
          outputTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
        },
        model: this.model,
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      console.error('Claude API 호출 오류:', error.response?.data || error.message);
      
      if (error.response?.status === 429) {
        throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.status === 401) {
        throw new Error('API 키가 유효하지 않습니다.');
      } else {
        throw new Error('AI 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }

  /**
   * 개인화된 기도문 생성
   */
  async generatePersonalizedPrayer(counselingContent, bibleVerses = []) {
    try {
      const prayerPrompt = {
        system: `당신은 개인화된 기도문을 작성하는 전문가입니다. 상담 내용과 성경 구절을 바탕으로 따뜻하고 개인적인 기도문을 작성해주세요.

기도문 작성 원칙:
1. 사용자의 구체적인 상황과 고민을 반영하세요
2. 제공된 성경 구절의 내용을 자연스럽게 포함하세요
3. 감사, 간구, 위로, 소망의 요소를 균형있게 포함하세요
4. 따뜻하고 개인적인 어조로 작성하세요
5. 200-400단어 길이로 작성하세요

참고 성경 구절:
${bibleVerses.map(verse => `${verse.reference}: ${verse.text}`).join('\n')}

기도문은 다음 구조로 작성해주세요:
1. 하나님께 감사 인사
2. 현재 상황에 대한 이해와 공감 표현
3. 구체적인 간구와 요청
4. 성경 말씀에 기반한 확신과 소망
5. 예수님의 이름으로 마무리

한국어로 작성해주세요.`,
        messages: [
          {
            role: 'user',
            content: `다음 상담 내용을 바탕으로 개인화된 기도문을 작성해주세요:\n\n${counselingContent}`
          }
        ]
      };

      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          model: this.model,
          max_tokens: 800,
          system: prayerPrompt.system,
          messages: prayerPrompt.messages,
          temperature: 0.8
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 30000
        }
      );

      return {
        prayer: response.data.content[0].text,
        bibleReferences: bibleVerses.map(v => v.reference),
        generatedAt: new Date(),
        usage: response.data.usage
      };
    } catch (error) {
      console.error('기도문 생성 오류:', error.response?.data || error.message);
      throw new Error('기도문 생성 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 의도 분석
   */
  async analyzeUserIntent(message, context = {}) {
    try {
      const analysisPrompt = {
        system: `사용자의 메시지를 분석하여 다음 정보를 JSON 형식으로 반환해주세요:

{
  "intent": "메시지의 주요 의도 (greeting, question, concern, gratitude, etc.)",
  "emotion": "감지된 감정 (sad, anxious, hopeful, confused, angry, peaceful, etc.)",
  "topics": ["감지된 주제들 배열"],
  "urgency": "긴급도 (low, medium, high)",
  "stage": "적절한 상담 단계 (greeting, exploration, guidance, prayer, closing)",
  "confidence": 0.95
}

감정과 의도를 정확히 파악해주세요.`,
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      };

      const response = await axios.post(
        `${this.baseURL}/messages`,
        {
          model: this.model,
          max_tokens: 300,
          system: analysisPrompt.system,
          messages: analysisPrompt.messages,
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const analysisText = response.data.content[0].text;
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // 기본값 반환
        return {
          intent: 'general',
          emotion: 'neutral',
          topics: [],
          urgency: 'medium',
          stage: 'exploration',
          confidence: 0.5
        };
      }
    } catch (error) {
      console.error('의도 분석 오류:', error);
      return {
        intent: 'general',
        emotion: 'neutral',
        topics: [],
        urgency: 'medium',
        stage: 'exploration',
        confidence: 0.0
      };
    }
  }
}

module.exports = ClaudeService;