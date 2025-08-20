const mongoose = require('mongoose');

const bibleVerseSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true // 예: "창1:1", "요3:16"
  },
  text: {
    type: String,
    required: true
  },
  book: {
    type: String,
    required: true,
    index: true // 예: "창세기", "요한복음"
  },
  chapter: {
    type: Number,
    required: true,
    index: true
  },
  verse: {
    type: Number,
    required: true
  },
  // 검색을 위한 추가 필드들
  keywords: [{
    type: String,
    index: true
  }],
  themes: [{
    type: String,
    index: true // 예: "사랑", "믿음", "소망", "용서", "지혜"
  }],
  category: {
    type: String,
    enum: [
      'faith', 'love', 'hope', 'forgiveness', 'wisdom', 'comfort', 
      'guidance', 'strength', 'peace', 'joy', 'prayer', 'salvation',
      'family', 'relationship', 'work', 'suffering', 'healing',
      'gratitude', 'humility', 'obedience', 'service', 'other'
    ],
    index: true
  },
  testament: {
    type: String,
    enum: ['old', 'new'],
    required: true,
    index: true
  },
  // 텍스트 검색을 위한 전문 인덱스
  searchText: {
    type: String,
    index: 'text'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// 복합 인덱스 설정
bibleVerseSchema.index({ book: 1, chapter: 1, verse: 1 });
bibleVerseSchema.index({ themes: 1, category: 1 });
bibleVerseSchema.index({ usageCount: -1 });

// 텍스트 검색 인덱스
bibleVerseSchema.index({ 
  text: 'text',
  searchText: 'text',
  keywords: 'text'
});

// 검색용 텍스트 생성 메소드
bibleVerseSchema.pre('save', function(next) {
  // 검색을 위한 통합 텍스트 생성
  this.searchText = `${this.text} ${this.keywords.join(' ')} ${this.themes.join(' ')}`;
  next();
});

// 사용 횟수 증가 메소드
bibleVerseSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// 키워드로 구절 검색 정적 메소드
bibleVerseSchema.statics.searchByKeywords = function(keywords, category = null, limit = 10) {
  const query = {
    $text: { $search: keywords }
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .select('reference text book chapter verse themes category')
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

// 테마로 구절 검색 정적 메소드
bibleVerseSchema.statics.searchByThemes = function(themes, limit = 10) {
  return this.find({ themes: { $in: themes } })
    .select('reference text book chapter verse themes category')
    .sort({ usageCount: -1 })
    .limit(limit);
};

// 카테고리로 구절 검색 정적 메소드
bibleVerseSchema.statics.searchByCategory = function(category, limit = 10) {
  return this.find({ category })
    .select('reference text book chapter verse themes')
    .sort({ usageCount: -1 })
    .limit(limit);
};

module.exports = mongoose.model('BibleVerse', bibleVerseSchema);