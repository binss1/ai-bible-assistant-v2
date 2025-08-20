#!/usr/bin/env node

/**
 * AI Bible Assistant 프로젝트 설정 스크립트
 * 이 스크립트는 프로젝트 초기 설정을 도와줍니다.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🚀 AI Bible Assistant 프로젝트 설정을 시작합니다.\n');

  // Claude API 키 설정
  const claudeApiKey = await question('Claude API 키를 입력하세요: ');
  
  // MongoDB URI 설정
  const mongoUri = await question('MongoDB URI를 입력하세요 (기본값: mongodb://localhost:27017/ai-bible-assistant): ');
  const finalMongoUri = mongoUri || 'mongodb://localhost:27017/ai-bible-assistant';

  // JWT Secret 생성
  const jwtSecret = generateRandomString(64);

  // .env 파일 업데이트
  const envPath = path.join(__dirname, 'backend', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent = envContent.replace('your_claude_api_key_here', claudeApiKey);
  envContent = envContent.replace('mongodb://localhost:27017/ai-bible-assistant', finalMongoUri);
  envContent = envContent.replace('your_super_secure_jwt_secret_key_here_change_this_in_production', jwtSecret);

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ 환경 설정이 완료되었습니다.');
  console.log('\n📝 다음 단계:');
  console.log('1. 성경 데이터를 data/bible-data.js 파일에 추가하세요');
  console.log('2. npm install을 실행하여 의존성을 설치하세요');
  console.log('3. npm run init-db를 실행하여 데이터베이스를 초기화하세요');
  console.log('4. npm run dev를 실행하여 개발 서버를 시작하세요');
  
  rl.close();
}

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// 스크립트 실행
if (require.main === module) {
  setup().catch(console.error);
}

module.exports = { setup };