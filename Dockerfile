# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# 패키지 파일 복사 (캐시 최적화)
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# Production stage
FROM nginx:alpine

# nginx 기본 설정 삭제
RUN rm -rf /etc/nginx/conf.d

# 커스텀 nginx 설정 복사
COPY .deployment/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 산출물 복사
COPY --from=builder /app/build /usr/share/nginx/html

# 80포트 오픈
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]