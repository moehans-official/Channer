<p align="center">
  <h1 align="center">Channer</h1>
  <p align="center">轻量级多租户 AI Gateway，专为个人和小团队设计</p>
  <p align="center">
    <a href="https://github.com/moehans-official/Channer/stargazers"><img src="https://img.shields.io/github/stars/moehans-official/Channer" alt="Stars"></a>
    <a href="https://github.com/moehans-official/Channer/blob/main/LICENSE"><img src="https://img.shields.io/github/license/moehans-official/Channer" alt="License"></a>
    <a href="https://github.com/moehans-official/Channer/releases"><img src="https://img.shields.io/github/v/release/moehans-official/Channer" alt="Release"></a>
  </p>
  <p align="center">
    <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
  </p>
</p>

---

## 项目简介

Channer 是一个轻量级 AI Gateway，专为需要统一管理多个 AI 提供商的个人和小团队设计。它提供 API 密钥管理、请求路由、负载均衡和预付费计费功能，并配有简洁现代的 Web 管理界面。

### 核心特性

- **多提供商支持**：OpenAI、Anthropic Claude、Google Gemini
- **多租户架构**：管理多个 API 密钥，每个密钥拥有独立的配额和余额
- **智能负载均衡**：基于渠道优先级路由请求，支持自动故障转移
- **预付费计费**：预留-结算计费模式，实现精确的成本追踪
- **速率限制**：为每个 API 密钥配置 RPM/TPM/RPD/TPD 限制
- **用量分析**：实时统计仪表板和请求日志
- **RESTful API**：兼容 OpenAI 的接口，无缝集成

## 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+

### 安装部署

```bash
# 克隆仓库
git clone https://github.com/moehans-official/Channer.git
cd Channer

# 启动所有服务
docker-compose up -d

# 等待服务初始化完成（约30秒）
sleep 30
```

### 访问管理后台

打开浏览器访问：`http://localhost:3000`

**默认登录凭证：**
- 用户名：`admin`
- 密码：`admin123`

> **安全提示**：首次登录后请立即修改默认密码。

## 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React 前端    │────▶│   Go 后端       │────▶│   PostgreSQL   │
│   (端口 3000)   │     │   (端口 8080)   │     │   (端口 5432)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │   (端口 6379)   │
                        └─────────────────┘
```

### 技术栈

| 组件 | 技术 |
|-----------|------------|
| 后端 | Go 1.25, Gin 框架, GORM |
| 前端 | React 18, TypeScript, Vite, Tailwind CSS |
| 数据库 | PostgreSQL 15+ |
| 缓存 | Redis 7+ |
| 认证 | JWT |
| 状态管理 | Zustand |

## 配置说明

### 环境变量

在 `backend` 目录创建 `.env` 文件：

```env
# 服务器配置
ENVIRONMENT=production
SERVER_ADDRESS=:8080

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=channer
DB_PASSWORD=channer
DB_NAME=channer
DB_SSLMODE=disable

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h
```

### 渠道配置

渠道代表 AI 提供商的连接配置。在管理后台进行配置：

| 字段 | 说明 | 示例 |
|-------|-------------|---------|
| 名称 | 唯一标识符 | `openai-primary` |
| 类型 | 提供商类型 | `openai`, `anthropic`, `gemini` |
| API 地址 | API 端点 | `https://api.openai.com` |
| API 密钥 | 提供商 API 密钥 | `sk-...` |
| 优先级 | 数值越小优先级越高 | `0`, `1`, `2` |

### 模型配置

为每个模型定义定价和可用性：

| 字段 | 说明 | 示例 |
|-------|-------------|---------|
| 模型 ID | 提供商模型标识符 | `gpt-4o` |
| 输入价格 | 每 1K 输入令牌的成本 | `0.005` |
| 输出价格 | 每 1K 输出令牌的成本 | `0.015` |

### API 密钥配额

为每个 API 密钥配置速率限制：

| 限制 | 说明 | 默认值 |
|-------|-------------|---------|
| RPM | 每分钟请求数 | 60 |
| TPM | 每分钟令牌数 | 100,000 |
| RPD | 每天请求数 | 10,000 |
| TPD | 每天令牌数 | 1,000,000 |

## API 参考

### 认证方式

所有租户 API 请求需要在 Authorization 头中携带 API 密钥：

```bash
curl -H "Authorization: Bearer sk-channer-xxx" \
  http://localhost:8080/api/v1/chat/completions
```

### 接口列表

#### 租户 API

| 方法 | 端点 | 说明 |
|--------|----------|-------------|
| GET | `/api/v1/info` | 获取 API 密钥信息 |
| POST | `/v1/chat/completions` | OpenAI 兼容的聊天补全 |
| POST | `/v1/responses` | OpenAI Responses API |
| POST | `/v1/messages` | Anthropic Messages API |
| POST | `/v1beta/models/:model:generateContent` | Gemini 生成内容 |

#### 管理 API

| 方法 | 端点 | 说明 |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | 管理员登录 |
| GET | `/api/v1/admin/channels` | 渠道列表 |
| POST | `/api/v1/admin/channels` | 创建渠道 |
| GET | `/api/v1/admin/models` | 模型列表 |
| POST | `/api/v1/admin/models` | 创建模型 |
| GET | `/api/v1/admin/keys` | API 密钥列表 |
| POST | `/api/v1/admin/keys` | 创建 API 密钥 |
| POST | `/api/v1/admin/keys/:id/recharge` | 余额充值 |
| GET | `/api/v1/admin/stats/dashboard` | 仪表板统计 |

## 计费模式

Channer 采用预留-结算计费方式：

1. **预扣费**：每个请求从 API 密钥余额中预留 $0.10
2. **结算**：请求完成后，根据实际令牌使用量计算费用
3. **调整**：多退少补，修正余额
4. **余额不足**：如果余额低于 $0.10，返回 HTTP 402

### 费用计算

```
总费用 = (输入令牌数 × 输入价格 + 输出令牌数 × 输出价格) / 1000
```

## 开发指南

### 后端开发

```bash
cd backend

# 安装依赖
go mod download

# 复制环境文件
cp .env.example .env

# 运行开发服务器
go run cmd/server/main.go
```

后端服务将在 `http://localhost:8080` 运行。

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 `http://localhost:5173` 运行。

### 运行测试

```bash
# 后端测试
cd backend
go test ./...

# 前端测试
cd frontend
npm test
```

## 项目结构

```
Channer/
├── backend/
│   ├── cmd/server/          # 应用入口
│   ├── internal/
│   │   ├── config/          # 配置管理
│   │   ├── handler/         # HTTP 处理器
│   │   ├── middleware/      # HTTP 中间件
│   │   ├── model/           # 数据库模型
│   │   ├── repository/      # 数据访问层
│   │   └── service/         # 业务逻辑层
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面组件
│   │   └── stores/          # 状态管理
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 路线图

- [ ] 支持更多 AI 提供商（Azure OpenAI、Cohere 等）
- [ ] 流式响应优化
- [ ] 高级分析和报表
- [ ] Webhook 通知
- [ ] API 密钥用量告警
- [ ] 多语言支持

## 参与贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 开源协议

本项目采用 MIT 协议开源 - 详情请查看 [LICENSE](LICENSE) 文件。

## 致谢

- 基于 [Gin](https://github.com/gin-gonic/gin) Web 框架构建
- UI 由 [Tailwind CSS](https://tailwindcss.com) 提供支持
- 图标来自 [Lucide](https://lucide.dev)

---

<p align="center">用 ❤️ 为 AI 社区打造</p>
