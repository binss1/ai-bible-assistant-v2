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

// 인덱스 생성
BibleVerseSchema.index({ book: 1, chapter: 1, verse: 1 });
BibleVerseSchema.index({ text: 'text' }); // 텍스트 검색용
BibleVerseSchema.index({ reference: 1 });

const BibleVerse = mongoose.model('BibleVerse', BibleVerseSchema);

/**
 * 성경 구절 참조를 파싱하는 함수
 * 예: "창1:1" → { book: "창세기", chapter: 1, verse: 1 }
 */
function parseReference(ref) {
  // 간단한 파싱 로직 (필요에 따라 확장 가능)
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
        await BibleVerse.deleteMany({});
        console.log('🗑️ 기존 데이터 삭제 완료');
      } else {
        console.log('✋ 기존 데이터가 있습니다. --force 옵션을 사용하여 재로드하세요.');
        console.log('   예: npm run init-db -- --force');
        return;
      }
    }
    
    // 성경 데이터 로드
    console.log('📖 성경 데이터 로드 중...');
    
    try {
      // 상대 경로로 bible-data.js 파일 로드
      const bibleDataPath = path.join(__dirname, '../../../data/bible-data.js');
      const bibleData = require(bibleDataPath);
      
      console.log(`📊 총 ${Object.keys(bibleData).length}개의 성경 구절 발견`);
      
      // 데이터 변환 및 저장
      const verses = [];
      for (const [reference, text] of Object.entries(bibleData)) {
        const parsed = parseReference(reference);
        if (parsed) {
          verses.push({
            reference,
            book: parsed.book,
            chapter: parsed.chapter,
            verse: parsed.verse,
            text,
            created_at: new Date()
          });
        } else {
          console.warn(`⚠️ 파싱 실패: ${reference}`);
        }
      }
      
      if (verses.length > 0) {
        // 배치로 삽입
        await BibleVerse.insertMany(verses);
        console.log(`✅ ${verses.length}개 성경 구절 저장 완료`);
      } else {
        console.log('⚠️ 저장할 성경 구절이 없습니다.');
      }
      
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.log('⚠️ bible-data.js 파일을 찾을 수 없습니다.');
        console.log('📁 파일 위치: data/bible-data.js');
        console.log('💡 샘플 데이터로 계속 진행합니다...');
        
        // 샘플 데이터 생성
        const sampleData = [
          { reference: '창1:1', book: '창세기', chapter: 1, verse: 1, text: '태초에 하나님이 천지를 창조하시니라' },
          { reference: '요3:16', book: '요한복음', chapter: 3, verse: 16, text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 저를 믿는 자마다 멸망치 않고 영생을 얻게 하려 하심이니라' },
          { reference: '롬8:28', book: '로마서', chapter: 8, verse: 28, text: '우리가 알거니와 하나님을 사랑하는 자 곧 그 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라' },
          { reference: '빌4:13', book: '빌립보서', chapter: 4, verse: 13, text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라' },
          { reference: '시23:1', book: '시편', chapter: 23, verse: 1, text: '여호와는 나의 목자시니 내가 부족함이 없으리로다' }
        ];
        
        await BibleVerse.insertMany(sampleData);
        console.log(`✅ ${sampleData.length}개 샘플 성경 구절 저장 완료`);
      } else {
        throw error;
      }
    }
    
    // 인덱스 생성
    console.log('🔍 검색 인덱스 생성 중...');
    await BibleVerse.createIndexes();
    console.log('✅ 인덱스 생성 완료');
    
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
    const searchResult = await BibleVerse.find({ $text: { $search: '사랑' } }).limit(2);
    if (searchResult.length > 0) {
      console.log('🔍 검색 테스트 결과:');
      searchResult.forEach(verse => {
        console.log(`  ${verse.reference}: ${verse.text.substring(0, 50)}...`);
      });
    }
    
    console.log('🎉 데이터베이스 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 초기화 오류:', error.message);
    console.error(error.stack);
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