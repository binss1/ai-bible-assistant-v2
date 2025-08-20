const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['user', 'bot', 'system'],
    required: true
  },
  content: {
    text: {
      type: String,
      required: true
    },
    // 추가 메타데이터
    metadata: {
      intent: String, // 사용자 의도 분석 결과
      emotion: String, // 감정 분석 결과
      confidence: Number, // 분석 신뢰도
      stage: String // 상담 단계 (greeting, exploration, guidance, prayer, closing)
    }
  },
  bibleReferences: [{
    // 이 메시지에서 인용된 성경 구절
    reference: String,
    text: String,
    context: String // 인용 맥락
  }],
  claudeResponse: {
    // Claude API 응답 메타데이터
    modelUsed: String,
    tokensUsed: Number,
    responseTime: Number,
    confidence: Number
  },
  isFollowUpQuestion: {
    type: Boolean,
    default: false
  },
  parentMessageId: {
    type: String,
    index: true // 연관된 이전 메시지 ID
  },
  reactions: {
    // 사용자 반응
    helpful: Boolean,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // createdAt만 사용
});

// 인덱스 설정
messageSchema.index({ sessionId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ type: 1, createdAt: -1 });

// 성경 구절 추가 메소드
messageSchema.methods.addBibleReference = function(reference, text, context) {
  this.bibleReferences.push({
    reference,
    text,
    context
  });
  return this.save();
};

// 사용자 피드백 설정 메소드
messageSchema.methods.setFeedback = function(helpful, rating, feedback) {
  this.reactions = {
    helpful,
    rating,
    feedback
  };
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);