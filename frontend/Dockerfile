# Frontend Dockerfile
FROM node:18-alpine as build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY public/ ./public/
COPY src/ ./src/
COPY tailwind.config.js ./
COPY postcss.config.js ./

# 환경 변수 설정 (기본값)
ENV REACT_APP_API_URL=http://localhost:3001

# 빌드 실행
RUN npm run build

# Nginx를 사용하여 정적 파일 서빙
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 포트 설정
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]