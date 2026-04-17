# 前端构建阶段
FROM node:20-alpine AS frontend

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# 后端构建阶段
FROM golang:1.25-alpine AS backend

WORKDIR /app

RUN apk add --no-cache git

ENV GOPROXY=https://goproxy.cn,direct

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ .
COPY --from=frontend /app/dist ./cmd/server/dist

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server cmd/server/main.go

# 运行阶段
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates tzdata && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=backend /app/server .

EXPOSE 8080

CMD ["./server"]
