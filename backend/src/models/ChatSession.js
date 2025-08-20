const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: '새로운 상담'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
    index: true
  },
  counselingType: {
    type: String,
    enum: ['general', 'relationship', 'career', 'family', 'faith', 'health', 'other'],
    default: 'general'
  },
  userInput: {
    // 사용자의 초기 고민/질문
    initialConcern: String,
    detailedSituation: String,
    emotionalState: String,
    previousExperience: String
  },
  bibleReferences: [{
    // 이 세션에서 사용된 성경 구절들
    reference: String, // 예: "요3:16"
    text: String,
    relevanceScore: Number,
    usedAt: Date
  }],
  generatedPrayer: {
    // 생성된 개인화 기도문
    content: String,
    generatedAt: Date,
    bibleReferences: [String]
  },
  summary: {
    // 상담 요약
    mainTopic: String,
    keyInsights: [String],
    suggestedActions: [String],
    followUpNeeded: Boolean
  },
  messageCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 인덱스 설정
chatSessionSchema.index({ userId: 1, startedAt: -1 });
chatSessionSchema.index({ status: 1, lastActiveAt: -1 });
chatSessionSchema.index({ counselingType: 1 });

// 세션 완료 메소드
chatSessionSchema.methods.complete = function(summary) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (summary) {
    this.summary = summary;
  }
  return this.save();
};

// 메시지 카운트 증가 메소드
chatSessionSchema.methods.incrementMessageCount = function() {
  this.messageCount += 1;
  this.lastActiveAt = new Date();
  return this.save();
};

// 성경 구절 추가 메소드
chatSessionSchema.methods.addBibleReference = function(reference, text, relevanceScore = 1.0) {
  this.bibleReferences.push({
    reference,
    text,
    relevanceScore,
    usedAt: new Date()
  });
  return this.save();
};

module.exports = mongoose.model('ChatSession', chatSessionSchema);