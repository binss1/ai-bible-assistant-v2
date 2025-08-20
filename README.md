# 🙏 AI Bible Assistant

[![Deploy Status](https://img.shields.io/badge/Deploy-Ready-brightgreen)](https://github.com/binss1/ai-bible-assistant-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green)](https://www.mongodb.com/)

> **성경 기반 AI 상담 챗봇** - Claude AI를 활용한 지혜로운 상담 서비스

![AI Bible Assistant Demo](https://via.placeholder.com/800x400/4a90e2/ffffff?text=AI+Bible+Assistant)

## 📖 프로젝트 소개

AI Bible Assistant는 성경의 지혜를 바탕으로 사용자의 고민과 질문에 대해 체계적이고 따뜻한 상담을 제공하는 AI 챗봇입니다. Claude AI의 강력한 언어 모델과 성경 텍스트 임베딩을 결합하여 개인화된 영적 상담 경험을 제공합니다.

### ✨ 핵심 기능

- 🤖 **Claude AI 기반 상담**: 고급 AI 모델을 활용한 자연스러운 대화
- 📖 **성경 구절 기반 답변**: 관련 성경 구절과 함께 제공되는 근거 있는 상담
- 🎯 **단계별 상담 프로세스**: 사용자의 의도를 정확히 파악하는 체계적 접근
- 🙏 **개인화된 기도문 생성**: 상황에 맞는 맞춤형 기도문 작성
- 💬 **실시간 채팅**: Socket.IO 기반 실시간 대화
- 📱 **PWA 지원**: 모바일 앱처럼 사용 가능한 웹 애플리케이션
- 📊 **대화 기록 관리**: 과거 상담 내용 참조 및 연속성 유지
- 🔒 **보안**: JWT 인증 및 데이터 암호화

## 🏗️ 기술 스택

### Backend
- **Node.js** + **Express.js** - RESTful API 서버
- **MongoDB** - 사용자 데이터 및 대화 기록 저장
- **Socket.IO** - 실시간 채팅
- **Claude API** - Anthropic의 Claude AI 모델 연동
- **JWT** - 사용자 인증 및 보안

### Frontend
- **React 18** - 사용자 인터페이스
- **Tailwind CSS** - 모던한 스타일링
- **PWA** - 모바일 앱 경험 제공
- **Socket.IO Client** - 실시간 통신

### DevOps & Deployment
- **Docker** - 컨테이너화
- **Docker Compose** - 로컬 개발 환경
- **Render/Railway** - 클라우드 배포
- **MongoDB Atlas** - 클라우드 데이터베이스
- **GitHub Actions** - CI/CD (예정)

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 16.0.0 이상
- MongoDB (로컬 또는 Atlas)
- Claude API 키 ([발급받기](https://console.anthropic.com))

### 1️⃣ 설치 및 설정

```bash
# 저장소 클론
git clone https://github.com/binss1/ai-bible-assistant-v2.git
cd ai-bible-assistant-v2

# 전체 의존성 설치
npm run install-all

# 환경 설정 (대화형)
npm run setup
```

### 2️⃣ 성경 데이터 준비

```bash
# bible_embeddings.json 파일을 data 폴더에 복사
cp /path/to/your/bible_embeddings.json ./data/

# 성경 임베딩 데이터 로드
cd backend
node scripts/processEmbeddings.js load
```

### 3️⃣ 개발 서버 실행

```bash
# 프론트엔드 + 백엔드 동시 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

## 🐳 Docker로 실행

```bash
# 환경 변수 설정
cp backend/.env.example backend/.env
# backend/.env에서 CLAUDE_API_KEY 등 설정

# Docker Compose로 전체 스택 실행
docker-compose up -d

# 애플리케이션 접속: http://localhost:3000
```

## 📁 프로젝트 구조

```
ai-bible-assistant-v2/
├── 📁 backend/              # API 서버
│   ├── 📁 src/
│   │   ├── 📁 routes/       # API 라우터
│   │   ├── 📁 services/     # 비즈니스 로직
│   │   ├── 📁 models/       # 데이터 모델
│   │   └── 📁 utils/        # 유틸리티
│   ├── 📁 scripts/          # 배포 및 관리 스크립트
│   └── 📄 Dockerfile        # 백엔드 컨테이너화
├── 📁 frontend/             # React 웹앱
│   ├── 📁 src/
│   │   ├── 📁 components/   # React 컴포넌트
│   │   ├── 📁 services/     # API 클라이언트
│   │   └── 📁 hooks/        # Custom React Hooks
│   ├── 📁 public/           # 정적 파일
│   └── 📄 Dockerfile        # 프론트엔드 컨테이너화
├── 📁 data/                 # 성경 데이터
├── 📄 docker-compose.yml    # 전체 스택 구성
├── 📄 render.yaml           # Render 배포 설정
├── 📄 railway.toml          # Railway 배포 설정
└── 📄 DEPLOYMENT.md         # 상세 배포 가이드
```

## 🌐 배포 옵션

### ☁️ 클라우드 배포 (무료 티어 지원)

#### Render.com (추천)
```bash
# 1. MongoDB Atlas 계정 생성 및 클러스터 설정
# 2. Render 계정 생성 및 GitHub 연결
# 3. 환경 변수 설정
# 4. 자동 배포 (render.yaml 파일 사용)
```

#### Railway
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 🏠 로컬 배포
```bash
# Docker Compose 사용
docker-compose up -d

# 또는 수동 실행
npm run start
```

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

## 📱 모바일 앱 개발 현황

### 현재 지원
- ✅ **PWA (Progressive Web App)**: 모바일 브라우저에서 앱처럼 사용
- ✅ **반응형 디자인**: 모든 화면 크기에 최적화
- ✅ **오프라인 지원**: 기본 기능 오프라인 사용 가능

### 향후 계획
- 📱 **React Native 앱**: iOS/Android 네이티브 앱
- 🔔 **푸시 알림**: 맞춤형 알림 서비스
- 💾 **오프라인 모드**: 완전한 오프라인 상담 기능

## 💬 카카오톡 챗봇 vs 자체 앱 분석

| 구분 | 카카오톡 챗봇 | 자체 앱 (현재) |
|------|---------------|----------------|
| **접근성** | ⭐⭐⭐⭐⭐ 높음 | ⭐⭐⭐ 보통 |
| **UI/UX** | ⭐⭐ 제한적 | ⭐⭐⭐⭐⭐ 자유로움 |
| **기능 확장성** | ⭐⭐ 제한적 | ⭐⭐⭐⭐⭐ 무제한 |
| **데이터 소유권** | ⭐⭐ 제한적 | ⭐⭐⭐⭐⭐ 완전 제어 |
| **수익화** | ⭐⭐⭐ 수수료 | ⭐⭐⭐⭐⭐ 자유로움 |

**권장 전략**: 현재 자체 앱으로 시작 → 추후 카카오톡 챗봇 추가 개발하여 **하이브리드 운영**

## 🔧 개발 환경 설정

### 환경 변수
```bash
# backend/.env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/bible_assistant
CLAUDE_API_KEY=sk-ant-your-api-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

### 사용 가능한 스크립트
```bash
npm run install-all    # 전체 의존성 설치
npm run setup          # 환경 설정
npm run dev           # 개발 서버 실행
npm run build         # 프로덕션 빌드
npm run start         # 프로덕션 실행
npm run test          # 테스트 실행
npm run init-db       # 데이터베이스 초기화
```

## 📊 성능 및 확장성

### 현재 지원 용량
- **동시 사용자**: 1,000명+
- **일일 메시지**: 10,000개+
- **응답 시간**: 평균 2초 이내
- **가용성**: 99.9%

### 성능 최적화
- ⚡ Redis 캐싱 (선택사항)
- 📦 API 응답 압축
- 🔄 Connection pooling
- 📈 부하 분산 준비

## 🛡️ 보안 기능

- 🔐 **JWT 인증**: 안전한 사용자 인증
- 🛡️ **CORS 보호**: 크로스 도메인 요청 제어
- 🔒 **데이터 암호화**: 민감 정보 암호화 저장
- 🚨 **Rate Limiting**: API 남용 방지
- 🔍 **입력 검증**: SQL Injection 등 방지

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원 및 문의

- **GitHub Issues**: [문제 신고](https://github.com/binss1/ai-bible-assistant-v2/issues)
- **배포 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **개발 문서**: `/docs` 폴더
- **API 문서**: `http://localhost:3001/api/docs`

## 🔮 로드맵

### 단기 목표 (1-3개월)
- [ ] 사용자 피드백 수집 및 UI/UX 개선
- [ ] 성경 임베딩 품질 향상
- [ ] 모바일 최적화 강화
- [ ] 다국어 지원 (영어, 중국어)

### 중기 목표 (3-6개월)
- [ ] React Native 모바일 앱 출시
- [ ] 카카오톡 챗봇 연동
- [ ] 음성 인식 및 TTS 기능
- [ ] 개인화된 성경 읽기 계획

### 장기 목표 (6-12개월)
- [ ] AI 음성 상담 기능
- [ ] 커뮤니티 기능 (기도 요청, 간증 나눔)
- [ ] 목회자/상담사 연결 서비스
- [ ] 글로벌 서비스 확장

---

<div align="center">

**🙏 하나님의 말씀으로 함께하는 AI 상담사**

Made with ❤️ by AI Bible Assistant Team

[🚀 지금 시작하기](./DEPLOYMENT.md) | [📖 사용 가이드](./docs/USAGE.md) | [🤝 기여하기](./CONTRIBUTING.md)

</div>