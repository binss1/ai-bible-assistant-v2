const mongoose = require('mongoose');
const BibleSearchService = require('../services/BibleSearchService');
const bibleData = require('../../data/bible-data');
require('dotenv').config();

async function initializeDatabase() {
  try {
    console.log('🔄 데이터베이스 초기화 시작...');
    
    // MongoDB 연결
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-bible-assistant');
    console.log('✅ MongoDB 연결 성공');
    
    // 기존 성경 데이터 삭제 (선택사항)
    const BibleVerse = require('../models/BibleVerse');
    const existingCount = await BibleVerse.countDocuments();
    
    if (existingCount > 0) {
      console.log(`📊 기존 성경 구절 ${existingCount}개 발견`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('기존 데이터를 삭제하고 새로 로드하시겠습니까? (y/N): ', resolve);
      });
      
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        await BibleVerse.deleteMany({});
        console.log('🗱️  기존 데이터 삭제 완료');
      } else {
        console.log('✋ 기존 데이터 유지');
        process.exit(0);
      }
    }
    
    // 성경 데이터 로드
    const bibleService = new BibleSearchService();
    const loadedCount = await bibleService.loadBibleData(bibleData);
    
    console.log(`📖 ${loadedCount}개 성경 구절 로드 완료`);
    
    // 인덱스 생성
    console.log('🔍 검색 인덱스 생성 중...');
    await BibleVerse.createIndexes();
    console.log('✅ 인덱스 생성 완료');
    
    // 데이터 검증
    console.log('🔍 데이터 검증 중...');
    const sampleVerses = await bibleService.searchByKeywords('사랑', { limit: 3 });
    console.log('📋 검색 테스트 결과:');
    sampleVerses.forEach(verse => {
      console.log(`  ${verse.reference}: ${verse.text.substring(0, 50)}...`);
    });
    
    console.log('🎉 데이터베이스 초기화 완료!');
    
  } catch (error) {
    console.error('❌ 초기화 오류:', error);
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

module.exports = initializeDatabase;