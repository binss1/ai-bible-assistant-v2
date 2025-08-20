const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// 성경 구절 스키마 정의
const BibleVerseSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  book: { type: String, required: true },
  chapter: { type: Number, required: true },
  verse: { type: Number, required: true },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// 인덱스 생성 (충돌 방지)
BibleVerseSchema.index({ book: 1, chapter: 1, verse: 1 });
BibleVerseSchema.index({ text: 'text' }); // 텍스트 검색용
// reference 인덱스는 unique: true가 스키마에 정의되어 있으므로 중복 생성하지 않음

const BibleVerse = mongoose.model('BibleVerse', BibleVerseSchema);

/**
 * 성경 구절 참조를 파싱하는 함수
 */
function parseReference(ref) {
  const bookMap = {
    '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
    '수': '여호수아', '삿': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
    '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하',
    '스': '에스라', '느': '느헤미야', '에': '에스더', '욥': '욥기', '시': '시편',
    '잠': '잠언', '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
    '애': '예레미야애가', '겔': '에스겔', '단': '다니엘', '호': '호세아', '욜': '요엘',
    '암': '아모스', '옵': '오바댜', '욘': '요나', '미': '미가', '나': '나훔',
    '합': '하박국', '습': '스바냐', '학': '학개', '슥': '스가랴', '말': '말라기',
    '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음',
    '행': '사도행전', '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서',
    '갈': '갈라디아서', '엡': '에베소서', '빌': '빌립보서', '골': '골로새서',
    '살전': '데살로니가전서', '살후': '데살로니가후서', '딤전': '디모데전서',
    '딤후': '디모데후서', '딛': '디도서', '몬': '빌레몬서', '히': '히브리서',
    '약': '야고보서', '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한일서',
    '요이': '요한이서', '요삼': '요한삼서', '유': '유다서', '계': '요한계시록',
    '롤': '로마서', '빜': '빌립보서' // 오타 수정용
  };
  
  const match = ref.match(/^([가-힣\w]+)(\d+):(\d+)$/);
  if (!match) {
    return null;
  }
  
  const [, bookAbbr, chapterStr, verseStr] = match;
  const book = bookMap[bookAbbr] || bookAbbr;
  const chapter = parseInt(chapterStr);
  const verse = parseInt(verseStr);
  
  return { book, chapter, verse };
}

async function initializeDatabase() {
  try {
    console.log('🔄 데이터베이스 초기화 시작...');
    
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bible_assistant';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공');
    
    // 기존 성경 데이터 확인
    const existingCount = await BibleVerse.countDocuments();
    
    if (existingCount > 0) {
      console.log(`📊 기존 성경 구절 ${existingCount}개 발견`);
      
      // 강제 재로드 옵션 확인
      const forceReload = process.argv.includes('--force');
      
      if (forceReload) {
        // 컬렉션 전체 삭제 (인덱스도 함께 삭제됨)
        await BibleVerse.collection.drop();
        console.log('🗑️ 기존 데이터와 인덱스 삭제 완료');
      } else {
        console.log('✋ 기존 데이터가 있습니다. --force 옵션을 사용하여 재로드하세요.');
        console.log('   예: npm run init-db -- --force');
        console.log('🎉 데이터베이스가 이미 초기화되어 있습니다!');
        
        // 간단한 통계 출력
        const sampleVerses = await BibleVerse.find().limit(3);
        console.log('📋 샘플 데이터:');
        sampleVerses.forEach(verse => {
          console.log(`  ${verse.reference}: ${verse.text.substring(0, 50)}...`);
        });
        
        return;
      }
    }
    
    // 성경 데이터 로드
    console.log('📖 성경 데이터 로드 중...');
    
    // 샘플 데이터 사용
    console.log('💡 샘플 데이터로 진행합니다...');
    
    const sampleData = [
      { reference: '창1:1', book: '창세기', chapter: 1, verse: 1, text: '태초에 하나님이 천지를 창조하시니라' },
      { reference: '요3:16', book: '요한복음', chapter: 3, verse: 16, text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라' },
      { reference: '롬8:28', book: '로마서', chapter: 8, verse: 28, text: '우리가 알거니와 하나님을 사랑하는 자 곧 그 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라' },
      { reference: '빌4:13', book: '빌립보서', chapter: 4, verse: 13, text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라' },
      { reference: '시23:1', book: '시편', chapter: 23, verse: 1, text: '여호와는 나의 목자시니 내가 부족함이 없으리로다' },
      { reference: '마11:28', book: '마태복음', chapter: 11, verse: 28, text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라' },
      { reference: '고전13:4', book: '고린도전서', chapter: 13, verse: 4, text: '사랑은 오래 참고 사랑은 온유하며 투기하지 아니하며 사랑은 자랑하지 아니하며 교만하지 아니하며' },
      { reference: '요14:6', book: '요한복음', chapter: 14, verse: 6, text: '예수께서 이르시되 내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라' },
      { reference: '시46:10', book: '시편', chapter: 46, verse: 10, text: '너희는 가만히 있어 내가 하나님 됨을 알지어다 내가 뭇 나라 중에서 높임을 받으리라 내가 세계 중에서 높임을 받으리라' },
      { reference: '잠3:5', book: '잠언', chapter: 3, verse: 5, text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라' }
    ];
    
    await BibleVerse.insertMany(sampleData);
    console.log(`✅ ${sampleData.length}개 샘플 성경 구절 저장 완료`);
    
    // 인덱스 생성 (안전하게)
    console.log('🔍 검색 인덱스 생성 중...');
    try {
      await BibleVerse.createIndexes();
      console.log('✅ 인덱스 생성 완료');
    } catch (indexError) {
      if (indexError.message.includes('already exists')) {
        console.log('ℹ️ 인덱스가 이미 존재합니다 (정상)');
      } else {
        console.warn('⚠️ 인덱스 생성 중 경고:', indexError.message);
      }
    }
    
    // 데이터 검증
    console.log('🔍 데이터 검증 중...');
    const totalCount = await BibleVerse.countDocuments();
    const sampleVerses = await BibleVerse.find().limit(3);
    
    console.log(`📊 총 ${totalCount}개 구절 저장됨`);
    console.log('📋 샘플 데이터:');
    sampleVerses.forEach(verse => {
      console.log(`  ${verse.reference}: ${verse.text.substring(0, 50)}...`);
    });
    
    // 검색 테스트
    try {
      const searchResult = await BibleVerse.find({ $text: { $search: '사랑' } }).limit(2);
      if (searchResult.length > 0) {
        console.log('🔍 검색 테스트 결과:');
        searchResult.forEach(verse => {
          console.log(`  ${verse.reference}: ${verse.text.substring(0, 50)}...`);
        });
      }
    } catch (searchError) {
      console.log('ℹ️ 텍스트 검색 인덱스가 아직 준비되지 않았습니다');
    }
    
    console.log('🎉 데이터베이스 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 초기화 오류:', error.message);
    if (error.message.includes('index')) {
      console.log('💡 인덱스 관련 오류입니다. --force 옵션을 사용해보세요:');
      console.log('   npm run init-db -- --force');
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 데이터베이스 연결 종료');
    process.exit(0);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, BibleVerse };