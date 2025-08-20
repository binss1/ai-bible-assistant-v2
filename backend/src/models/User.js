const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  nickname: {
    type: String,
    default: '익명'
  },
  email: {
    type: String,
    sparse: true // 선택적 필드
  },
  preferences: {
    // 사용자 선호 설정
    language: {
      type: String,
      default: 'ko'
    },
    bibleVersion: {
      type: String,
      default: 'korean_revised'
    },
    notificationEnabled: {
      type: Boolean,
      default: true
    }
  },
  counselingHistory: {
    // 상담 이력 요약
    totalSessions: {
      type: Number,
      default: 0
    },
    lastSessionDate: {
      type: Date
    },
    commonTopics: [{
      topic: String,
      count: Number
    }],
    favoriteVerses: [{
      verse: String,
      reference: String,
      savedDate: Date
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 인덱스 설정
userSchema.index({ lastActiveAt: -1 });
userSchema.index({ 'counselingHistory.lastSessionDate': -1 });

// 사용자 활동 시간 업데이트 메소드
userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// 상담 세션 카운트 증가 메소드
userSchema.methods.incrementSessionCount = function() {
  this.counselingHistory.totalSessions += 1;
  this.counselingHistory.lastSessionDate = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);