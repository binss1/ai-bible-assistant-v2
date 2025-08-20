// MongoDB 초기화 스크립트
print('📚 AI Bible Assistant 데이터베이스 초기화 시작...');

// 데이터베이스 선택
db = db.getSiblingDB('bible_assistant');

// 사용자 생성
db.createUser({
  user: 'bible_user',
  pwd: 'bible_password',
  roles: [
    {
      role: 'readWrite',
      db: 'bible_assistant'
    }
  ]
});

// 컬렉션 생성 및 초기 인덱스 설정
db.createCollection('users');
db.createCollection('conversations');
db.createCollection('bible_verses');
db.createCollection('prayers');

// 인덱스 생성
print('📝 인덱스 생성 중...');

// 사용자 컬렉션 인덱스
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

// 대화 컬렉션 인덱스
db.conversations.createIndex({ userId: 1 });
db.conversations.createIndex({ createdAt: 1 });
db.conversations.createIndex({ "messages.timestamp": 1 });

// 성경 구절 컬렉션 인덱스
db.bible_verses.createIndex({ book: 1, chapter: 1, verse: 1 });
db.bible_verses.createIndex({ text: "text" }); // 텍스트 검색용

// 기도문 컬렉션 인덱스
db.prayers.createIndex({ userId: 1 });
db.prayers.createIndex({ createdAt: 1 });
db.prayers.createIndex({ category: 1 });

print('✅ AI Bible Assistant 데이터베이스 초기화 완료!');
print('🔹 사용자: bible_user');
print('🔹 데이터베이스: bible_assistant');
print('🔹 컬렉션: users, conversations, bible_verses, prayers');