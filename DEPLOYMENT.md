# 🚀 AI Bible Assistant 배포 가이드

## 📋 목차
1. [로컬 개발 환경 설정](#로컬-개발-환경-설정)
2. [Docker를 이용한 로컬 배포](#docker를-이용한-로컬-배포)
3. [클라우드 배포](#클라우드-배포)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [환경 변수 설정](#환경-변수-설정)
6. [모바일 앱 개발](#모바일-앱-개발)
7. [카카오톡 챗봇 vs 자체 앱 비교](#카카오톡-챗봇-vs-자체-앱-비교)

---

## 🛠️ 로컬 개발 환경 설정

### 필수 요구사항
- Node.js 16.0.0 이상
- MongoDB (로컬 또는 Atlas)
- Claude API 키
- Git

### 1단계: 저장소 클론 및 설치
```bash
# 저장소 클론
git clone https://github.com/binss1/ai-bible-assistant-v2.git
cd ai-bible-assistant-v2

# 전체 의존성 설치
npm run install-all
```

### 2단계: 환경 설정
```bash
# 환경 설정 실행 (대화형)
npm run setup
```

### 3단계: 성경 데이터 준비
```bash
# bible_embeddings.json 파일을 data/ 폴더에 복사
cp /path/to/your/bible_embeddings.json ./data/

# 성경 임베딩 데이터 로드
cd backend
node scripts/processEmbeddings.js load
```

### 4단계: 개발 서버 실행
```bash
# 프론트엔드 + 백엔드 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:backend  # 백엔드만
npm run dev:frontend # 프론트엔드만
```

### 5단계: 접속 확인
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001
- API 문서: http://localhost:3001/api/docs

---

## 🐳 Docker를 이용한 로컬 배포

### 전체 스택 실행 (권장)
```bash
# 환경 변수 설정
cp backend/.env.example backend/.env
# backend/.env 파일에서 CLAUDE_API_KEY 등 설정

# Docker Compose로 전체 애플리케이션 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 종료
docker-compose down
```

### 개별 서비스 빌드
```bash
# 백엔드만 빌드
cd backend
docker build -t ai-bible-assistant-backend .

# 프론트엔드만 빌드
cd frontend
docker build -t ai-bible-assistant-frontend .
```

---

## ☁️ 클라우드 배포

### 🎯 Render.com 배포 (무료 티어 지원)

#### 1단계: 데이터베이스 준비
1. [MongoDB Atlas](https://cloud.mongodb.com) 무료 계정 생성
2. 클러스터 생성 및 연결 문자열 복사

#### 2단계: Render 배포
1. [Render](https://render.com) 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정:
   ```
   MONGODB_URI=mongodb+srv://...
   CLAUDE_API_KEY=sk-ant-...
   NODE_ENV=production
   JWT_SECRET=your-secret
   ```

#### 3단계: 자동 배포
- `render.yaml` 파일이 있어 자동으로 백엔드/프론트엔드 배포
- 배포 완료 후 URL 확인

### 🚄 Railway 배포

#### 1단계: Railway CLI 설치
```bash
npm install -g @railway/cli
railway login
```

#### 2단계: 프로젝트 배포
```bash
# 프로젝트 초기화
railway init

# 환경 변수 설정
railway variables set MONGODB_URI=mongodb+srv://...
railway variables set CLAUDE_API_KEY=sk-ant-...

# 배포
railway up
```

### 🌐 다른 플랫폼들

#### Vercel (프론트엔드)
```bash
cd frontend
npm install -g vercel
vercel --prod
```

#### Heroku (백엔드)
```bash
cd backend
heroku create ai-bible-assistant-api
git push heroku main
```

---

## 💾 데이터베이스 설정

### MongoDB Atlas (권장 - 무료 512MB)
1. [MongoDB Atlas](https://cloud.mongodb.com) 가입
2. 무료 클러스터 생성
3. 데이터베이스 사용자 생성
4. IP 화이트리스트 설정 (0.0.0.0/0 for 모든 IP)
5. 연결 문자열 복사

### 로컬 MongoDB
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt-get install mongodb
sudo systemctl start mongodb

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 성경 데이터 초기화
```bash
# 데이터베이스 초기화
npm run init-db

# 성경 임베딩 데이터 로드
cd backend
node scripts/processEmbeddings.js load --force

# 데이터 확인
node scripts/processEmbeddings.js stats
```

---

## 🔧 환경 변수 설정

### 개발 환경 (.env)
```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bible_assistant
CLAUDE_API_KEY=your_claude_api_key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

### 프로덕션 환경
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bible_assistant
CLAUDE_API_KEY=sk-ant-your-api-key
JWT_SECRET=super-secure-production-secret
CORS_ORIGIN=https://your-domain.com
```

### Claude API 키 발급
1. [Anthropic Console](https://console.anthropic.com) 방문
2. 계정 생성 및 로그인
3. API Keys 메뉴에서 새 키 생성
4. 생성된 키를 환경 변수에 설정

---

## 📱 모바일 앱 개발

### PWA (Progressive Web App) - 현재 지원
- 이미 PWA로 구성됨 (manifest.json, service worker)
- 모바일 브라우저에서 "홈 화면에 추가" 가능
- 오프라인 지원 및 푸시 알림 준비

### React Native 앱 (향후 계획)
```bash
# React Native 프로젝트 생성
npx react-native init AIBibleAssistantApp
cd AIBibleAssistantApp

# 기존 React 컴포넌트 재사용
# API 엔드포인트만 변경하여 연동
```

### Flutter 앱 (대안)
```bash
flutter create ai_bible_assistant_app
cd ai_bible_assistant_app
# Dart로 앱 개발
```

---

## 💬 카카오톡 챗봇 vs 자체 앱 비교

### 카카오톡 챗봇의 장점
✅ **사용자 접근성**: 별도 앱 설치 불필요
✅ **높은 사용률**: 한국 내 카카오톡 사용률 90%+
✅ **간편한 시작**: 카카오톡 내에서 바로 사용
✅ **알림 효과**: 카카오톡 메시지 형태로 자연스러운 알림

### 카카오톡 챗봇의 단점
❌ **제한된 UI/UX**: 텍스트 위주의 단순한 인터페이스
❌ **기능 제약**: 복잡한 상호작용 및 멀티미디어 제한
❌ **카카오 의존성**: 카카오톡 정책 변경에 영향
❌ **수익화 제약**: 카카오 플랫폼 수수료 및 정책

### 자체 앱의 장점
✅ **풍부한 UI/UX**: 완전한 사용자 경험 제어
✅ **고급 기능**: 실시간 채팅, 푸시 알림, 오프라인 지원
✅ **데이터 소유권**: 사용자 데이터 완전 제어
✅ **수익화 자유**: 독립적인 비즈니스 모델
✅ **브랜딩**: 독자적인 브랜드 구축

### 자체 앱의 단점
❌ **사용자 획득**: 초기 사용자 확보의 어려움
❌ **개발 복잡성**: 더 많은 개발 및 유지보수 비용
❌ **마케팅 필요**: 별도의 홍보 및 마케팅 전략

### 🎯 권장 전략: 하이브리드 접근
1. **1단계**: 자체 웹/앱으로 시작 (현재 상태)
2. **2단계**: 카카오톡 챗봇 추가 개발
3. **3단계**: 두 플랫폼 모두 운영하여 시너지 효과

---

## 🔍 성능 최적화

### 백엔드 최적화
```javascript
// Redis 캐시 추가
const redis = require('redis');
const client = redis.createClient();

// 성경 구절 캐싱
app.get('/api/verses/:id', cache(300), async (req, res) => {
  // 5분 캐시
});
```

### 프론트엔드 최적화
```javascript
// React.memo 사용
const ChatMessage = React.memo(({ message }) => {
  return <div>{message.text}</div>;
});

// 지연 로딩
const PrayerGeneration = lazy(() => import('./PrayerGeneration'));
```

---

## 🔧 모니터링 및 로깅

### 로그 설정
```javascript
// Winston 로거
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 에러 추적
```javascript
// Sentry 설정
const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## 🚨 문제 해결

### 자주 발생하는 문제들

#### 1. Claude API 오류
```bash
# API 키 확인
echo $CLAUDE_API_KEY

# API 연결 테스트
curl -H "Authorization: Bearer $CLAUDE_API_KEY" https://api.anthropic.com/v1/messages
```

#### 2. MongoDB 연결 오류
```bash
# 연결 문자열 확인
node -e "console.log(process.env.MONGODB_URI)"

# MongoDB 연결 테스트
mongosh "$MONGODB_URI"
```

#### 3. 빌드 오류
```bash
# 노드 버전 확인
node --version  # 16.0.0 이상 필요

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS 오류
```javascript
// backend/src/app.js에서 CORS 설정 확인
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

---

## 📞 지원 및 문의

- **GitHub Issues**: [링크](https://github.com/binss1/ai-bible-assistant-v2/issues)
- **개발 문서**: `/docs` 폴더 참조
- **API 문서**: `http://localhost:3001/api/docs`

---

**🎯 다음 단계**: 이제 모든 준비가 완료되었습니다! 
1. 로컬에서 테스트해보세요
2. 성경 임베딩 데이터를 준비하세요  
3. 클라우드 배포를 진행하세요
4. 사용자 피드백을 받아 개선하세요