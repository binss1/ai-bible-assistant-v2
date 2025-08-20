/**
 * 성경 임베딩 데이터 처리 스크립트
 * bible_embeddings.json 파일을 MongoDB에 저장하고 검색 인덱스를 생성합니다.
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// 성경 구절 스키마 정의
const BibleVerseSchema = new mongoose.Schema({
  book: { type: String, required: true, index: true },
  chapter: { type: Number, required: true, index: true },
  verse: { type: Number, required: true, index: true },
  text: { type: String, required: true },
  embedding: [Number], // 임베딩 벡터
  korean_text: String, // 한국어 번역
  english_text: String, // 영어 원문
  theme_tags: [String], // 주제 태그
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// 복합 인덱스 생성
BibleVerseSchema.index({ book: 1, chapter: 1, verse: 1 }, { unique: true });
BibleVerseSchema.index({ text: 'text' }); // 텍스트 검색용

const BibleVerse = mongoose.model('BibleVerse', BibleVerseSchema);

/**
 * 성경 임베딩 데이터 로드 및 저장
 */
async function loadBibleEmbeddings() {
  try {
    console.log('📚 성경 임베딩 데이터 처리 시작...');

    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bible_assistant');
    console.log('✅ MongoDB 연결 성공');

    // 기존 데이터 삭제 (선택사항)
    const deleteExisting = process.argv.includes('--force');
    if (deleteExisting) {
      await BibleVerse.deleteMany({});
      console.log('🗑️ 기존 성경 데이터 삭제 완료');
    }

    // 임베딩 파일 경로
    const embeddingPath = path.join(__dirname, '../../data/bible_embeddings.json');
    
    if (!fs.existsSync(embeddingPath)) {
      console.log('⚠️ bible_embeddings.json 파일을 찾을 수 없습니다.');
      console.log('📁 파일 경로:', embeddingPath);
      console.log('\n📋 bible_embeddings.json 파일 형식 예시:');
      console.log(JSON.stringify([
        {
          "book": "창세기",
          "chapter": 1,
          "verse": 1,
          "text": "태초에 하나님이 천지를 창조하시니라",
          "embedding": [0.1, 0.2, -0.3, 0.4, ...], // 벡터 배열
          "theme_tags": ["창조", "시작", "하나님"]
        }
      ], null, 2));
      return;
    }

    // 임베딩 데이터 로드
    console.log('📖 임베딩 데이터 로드 중...');
    const embeddingData = JSON.parse(fs.readFileSync(embeddingPath, 'utf8'));
    
    if (!Array.isArray(embeddingData)) {
      throw new Error('임베딩 데이터는 배열 형태여야 합니다.');
    }

    console.log(`📊 총 ${embeddingData.length}개의 성경 구절 데이터 발견`);

    // 배치 처리로 데이터 저장
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < embeddingData.length; i += batchSize) {
      const batch = embeddingData.slice(i, i + batchSize);
      
      // 데이터 검증 및 변환
      const validBatch = batch.map(item => ({
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
        text: item.text || item.korean_text,
        embedding: item.embedding,
        korean_text: item.korean_text || item.text,
        english_text: item.english_text,
        theme_tags: item.theme_tags || [],
        created_at: new Date(),
        updated_at: new Date()
      })).filter(item => {
        // 필수 필드 검증
        return item.book && item.chapter && item.verse && item.text && item.embedding;
      });

      if (validBatch.length > 0) {
        try {
          await BibleVerse.insertMany(validBatch, { ordered: false });
          processed += validBatch.length;
          console.log(`✅ ${processed}/${embeddingData.length} 구절 처리 완료`);
        } catch (error) {
          // 중복 데이터 등의 오류 처리
          if (error.code === 11000) {
            console.log(`⚠️ 중복 데이터 건너뜀: ${validBatch.length}개 중 일부`);
          } else {
            console.error('❌ 배치 저장 오류:', error.message);
          }
        }
      }
    }

    console.log(`🎉 성경 임베딩 데이터 처리 완료! 총 ${processed}개 구절 저장`);

    // 인덱스 생성 확인
    console.log('🔍 인덱스 생성 확인 중...');
    const indexes = await BibleVerse.collection.getIndexes();
    console.log('📋 생성된 인덱스:', Object.keys(indexes));

    // 통계 출력
    const stats = await generateStatistics();
    console.log('\n📊 데이터베이스 통계:');
    console.log(stats);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

/**
 * 데이터베이스 통계 생성
 */
async function generateStatistics() {
  const totalVerses = await BibleVerse.countDocuments();
  const books = await BibleVerse.distinct('book');
  const averageEmbeddingLength = await BibleVerse.aggregate([
    {
      $project: {
        embeddingLength: { $size: '$embedding' }
      }
    },
    {
      $group: {
        _id: null,
        avgLength: { $avg: '$embeddingLength' }
      }
    }
  ]);

  return {
    총구절수: totalVerses,
    성경책수: books.length,
    성경책목록: books,
    평균임베딩차원: averageEmbeddingLength[0]?.avgLength || 0
  };
}

/**
 * 특정 구절 검색 테스트
 */
async function testSearch(searchText) {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bible_assistant');
    
    const results = await BibleVerse.find(
      { $text: { $search: searchText } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).limit(5);

    console.log(`\n🔍 "${searchText}" 검색 결과:`);
    results.forEach((verse, index) => {
      console.log(`${index + 1}. ${verse.book} ${verse.chapter}:${verse.verse}`);
      console.log(`   ${verse.text}`);
      console.log(`   점수: ${verse.score?.toFixed(3)}\n`);
    });

  } catch (error) {
    console.error('❌ 검색 테스트 오류:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// CLI 명령어 처리
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'load':
      loadBibleEmbeddings();
      break;
    case 'test':
      const searchText = process.argv[3] || '사랑';
      testSearch(searchText);
      break;
    case 'stats':
      (async () => {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bible_assistant');
        const stats = await generateStatistics();
        console.log('📊 데이터베이스 통계:', stats);
        await mongoose.disconnect();
      })();
      break;
    default:
      console.log(`
📚 AI Bible Assistant - 성경 임베딩 데이터 처리 도구

사용법:
  node processEmbeddings.js load [--force]  # 임베딩 데이터 로드
  node processEmbeddings.js test [검색어]    # 검색 테스트
  node processEmbeddings.js stats           # 통계 조회

옵션:
  --force  기존 데이터를 삭제하고 새로 로드

예시:
  node processEmbeddings.js load --force
  node processEmbeddings.js test 사랑
  node processEmbeddings.js stats
      `);
  }
}

module.exports = {
  loadBibleEmbeddings,
  testSearch,
  generateStatistics,
  BibleVerse
};