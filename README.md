# Channer AI Gateway

Channer是一个轻量级个人AI Gateway，支持多租户、API代理转发、负载均衡和预付费计费。

## 技术栈

- **后端**: Go 1.25 + Gin + GORM
- **数据库**: PostgreSQL 15+
- **缓存**: Redis 7+
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS

## 支持的AI提供商

- OpenAI (Chat Completions / Responses API)
- Anthropic Claude
- Google Gemini

## 核心功能

1. **多租户管理**: 管理员创建API Key，无账户系统，用户通过Key查询余额和配额
2. **API代理转发**: 统一转发各AI提供商的API请求
3. **负载均衡**: 支持按优先级分配请求到不同渠道
4. **预付费计费**: 请求时预扣0.1额度，完成后根据实际Token修正计费

## 快速开始

### 使用Docker Compose部署

```bash
# 克隆项目
git clone https://github.com/yourusername/channer.git
cd channer

# 启动服务
docker-compose up -d

# 等待服务启动完成（约30秒）
sleep 30

# 访问管理后台
open http://localhost:3000
```

默认管理员账号:
- 用户名: `admin`
- 密码: `admin123`

### 本地开发

#### 后端开发

```bash
cd backend

# 复制环境变量文件
cp .env.example .env

# 安装依赖
go mod download

# 运行开发服务器
go run cmd/server/main.go
```

后端服务将运行在 `http://localhost:8080`

#### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将运行在 `http://localhost:5173`

## 项目结构

```
channer/
├── backend/              # Go后端服务
│   ├── cmd/server/       # 入口程序
│   ├── internal/         # 内部包
│   │   ├── config/       # 配置管理
│   │   ├── handler/      # HTTP处理器
│   │   ├── middleware/   # 中间件
│   │   ├── model/        # 数据模型
│   │   ├── repository/   # 数据访问层
│   │   └── service/      # 业务逻辑层
│   ├── pkg/              # 公共包
│   ├── Dockerfile
│   └── go.mod
├── frontend/             # React前端
│   ├── src/
│   │   ├── api/          # API客户端
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   └── stores/       # 状态管理
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API端点

### 管理API (需要JWT认证)

- `POST /api/v1/auth/login` - 管理员登录
- `GET /api/v1/admin/channels` - 渠道列表
- `POST /api/v1/admin/channels` - 创建渠道
- `GET /api/v1/admin/models` - 模型列表
- `POST /api/v1/admin/models` - 创建模型
- `GET /api/v1/admin/keys` - API Key列表
- `POST /api/v1/admin/keys` - 创建API Key
- `POST /api/v1/admin/keys/:id/recharge` - 充值
- `GET /api/v1/admin/stats/dashboard` - 仪表板统计

### 租户API (需要API Key)

- `GET /api/v1/info` - 查询API Key信息
- `POST /api/v1/chat/completions` - OpenAI Chat Completions
- `POST /api/v1/responses` - OpenAI Responses
- `POST /api/v1/messages` - Anthropic Messages
- `POST /api/v1beta/models/:model:generateContent` - Gemini Generate

## 配置说明

### 渠道配置

在管理后台添加渠道时需要配置:

- **名称**: 渠道标识
- **类型**: openai / anthropic / gemini
- **API地址**: 提供商API基础URL
- **API Key**: 提供商的API密钥
- **优先级**: 数值越小优先级越高

### 模型配置

配置支持的AI模型:

- **模型ID**: 如 `gpt-4o`, `claude-3-opus-20240229`
- **输入价格**: 每1K Token的价格
- **输出价格**: 每1K Token的价格

### API Key配额

- **RPM**: 每分钟请求数限制
- **TPM**: 每分钟Token数限制
- **RPD**: 每天请求数限制
- **TPD**: 每天Token数限制

## 计费说明

1. 请求时预扣0.1额度
2. 请求完成后根据实际Token使用量计算费用
3. 多退少补，修正余额
4. 余额不足时返回402错误

## 许可证

MIT
