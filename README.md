# AI Bible Assistant

성경 기반 상담 챗봇 시스템

## 프로젝트 개요

AI Bible Assistant는 성경 내용을 기반으로 사용자의 고민과 질문에 대해 체계적인 상담을 제공하는 챗봇입니다.

## 핵심 기능

- 🤖 Claude AI 기반 성경 상담
- 📖 성경 구절 기반 답변 제공
- 🙏 개인화된 기도문 생성
- 💬 단계별 상담 프로세스
- 📱 웹 및 모바일 지원

## 기술 스택

### Backend
- Node.js + Express.js
- MongoDB
- Claude API

### Frontend
- React.js
- Tailwind CSS
- Socket.IO (실시간 채팅)

## 프로젝트 구조

```
ai-bible-assistant/
├── backend/              # API 서버
│   ├── src/
│   │   ├── routes/      # API 라우터
│   │   ├── services/    # 비즈니스 로직
│   │   ├── utils/       # 유틸리티 함수
│   │   └── models/      # 데이터 모델
│   └── package.json
├── frontend/            # React 웹앱
│   ├── src/
│   └── package.json
├── data/               # 성경 데이터
└── README.md
```

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/binss1/ai-bible-assistant-v2.git
cd ai-bible-assistant-v2
```

### 2. 의존성 설치

```bash
npm run install-all
```

### 3. 환경 설정

```bash
npm run setup
```

위 명령어를 실행하면 Claude API 키와 MongoDB URI를 입력하라는 프롬프트가 나타납니다.

### 4. 성경 데이터 준비

`data/bible-data.js` 파일에 전체 성경 텍스트 데이터를 추가해야 합니다.

### 5. 데이터베이스 초기화

```bash
npm run init-db
```

### 6. 개발 서버 실행

```bash
npm run dev
```

### 7. 애플리케이션 접속

브라우저에서 `http://localhost:3000`으로 접속하면 AI Bible Assistant를 사용할 수 있습니다.

---

**AI Bible Assistant** - 성경의 지혜로 함께하는 AI 상담사 🙏