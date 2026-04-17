<p align="center">
  <h1 align="center">Channer</h1>
  <p align="center">A lightweight, multi-tenant AI Gateway for personal and small team use</p>
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

## Overview

Channer is a lightweight AI Gateway designed for individuals and small teams who need a unified interface to manage multiple AI providers. It provides API key management, request routing, load balancing, and prepaid billing with a clean, modern web interface.

### Key Features

- **Multi-Provider Support**: OpenAI, Anthropic Claude, Google Gemini
- **Multi-Tenant Architecture**: Manage multiple API keys with isolated quotas and balances
- **Smart Load Balancing**: Route requests based on channel priority with automatic failover
- **Prepaid Billing**: Reserve-then-settle billing model for accurate cost tracking
- **Rate Limiting**: Configurable RPM/TPM/RPD/TPD limits per API key
- **Usage Analytics**: Dashboard with real-time statistics and request logs
- **RESTful API**: OpenAI-compatible endpoints for seamless integration

## Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Installation

```bash
# Clone the repository
git clone https://github.com/moehans-official/Channer.git
cd Channer

# Start all services
docker-compose up -d

# Wait for services to initialize (about 30 seconds)
sleep 30
```

### Access the Dashboard

Open your browser and navigate to: `http://localhost:3000`

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

> **Security Note**: Change the default password immediately after first login.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│   Go Backend    │────▶│   PostgreSQL   │
│   (Port 3000)   │     │   (Port 8080)   │     │   (Port 5432)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     Redis       │
                        │   (Port 6379)   │
                        └─────────────────┘
```

### Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | Go 1.25, Gin Framework, GORM |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ |
| Authentication | JWT |
| State Management | Zustand |

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
ENVIRONMENT=production
SERVER_ADDRESS=:8080

# Database Configuration
# Supported types: postgres | sqlite
DB_TYPE=postgres

# PostgreSQL Configuration (used when DB_TYPE=postgres)
DB_HOST=localhost
DB_PORT=5432
DB_USER=channer
DB_PASSWORD=channer
DB_NAME=channer
DB_SSLMODE=disable

# SQLite Configuration (used when DB_TYPE=sqlite)
DB_PATH=./channer.db

# Redis Configuration - Optional, disable to use in-memory storage
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h
```

### Channel Configuration

Channels represent AI provider connections. Configure them in the dashboard:

| Field | Description | Example |
|-------|-------------|---------|
| Name | Unique identifier | `openai-primary` |
| Type | Provider type | `openai`, `anthropic`, `gemini` |
| Base URL | API endpoint | `https://api.openai.com` |
| API Key | Provider API key | `sk-...` |
| Priority | Lower value = higher priority | `0`, `1`, `2` |

### Model Configuration

Define pricing and availability for each model:

| Field | Description | Example |
|-------|-------------|---------|
| Model ID | Provider model identifier | `gpt-4o` |
| Input Price | Cost per 1K input tokens | `0.005` |
| Output Price | Cost per 1K output tokens | `0.015` |

### API Key Quotas

Configure rate limits per API key:

| Limit | Description | Default |
|-------|-------------|---------|
| RPM | Requests per minute | 60 |
| TPM | Tokens per minute | 100,000 |
| RPD | Requests per day | 10,000 |
| TPD | Tokens per day | 1,000,000 |

## API Reference

### Authentication

All tenant API requests require an API key in the Authorization header:

```bash
curl -H "Authorization: Bearer sk-channer-xxx" \
  http://localhost:8080/api/v1/chat/completions
```

### Endpoints

#### Tenant APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/info` | Get API key information |
| POST | `/v1/chat/completions` | OpenAI-compatible chat completions |
| POST | `/v1/responses` | OpenAI Responses API |
| POST | `/v1/messages` | Anthropic Messages API |
| POST | `/v1beta/models/:model:generateContent` | Gemini Generate Content |

#### Admin APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Administrator login |
| GET | `/api/v1/admin/channels` | List channels |
| POST | `/api/v1/admin/channels` | Create channel |
| GET | `/api/v1/admin/models` | List models |
| POST | `/api/v1/admin/models` | Create model |
| GET | `/api/v1/admin/keys` | List API keys |
| POST | `/api/v1/admin/keys` | Create API key |
| POST | `/api/v1/admin/keys/:id/recharge` | Recharge balance |
| GET | `/api/v1/admin/stats/dashboard` | Dashboard statistics |

## Billing Model

Channer uses a reserve-then-settle billing approach:

1. **Pre-deduction**: Each request reserves $0.10 from the API key balance
2. **Settlement**: After request completion, actual cost is calculated based on token usage
3. **Adjustment**: The difference is refunded or additionally charged
4. **Insufficient Balance**: Returns HTTP 402 if balance is below $0.10

### Cost Calculation

```
Total Cost = (Input Tokens × Input Price + Output Tokens × Output Price) / 1000
```

## Development

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Copy environment file
cp .env.example .env

# Run development server
go run cmd/server/main.go
```

The backend will be available at `http://localhost:8080`.

#### Using SQLite (Optional)

For local development without PostgreSQL, you can use SQLite:

```bash
# Edit .env file
DB_TYPE=sqlite
DB_PATH=./channer.db

# Run server
go run cmd/server/main.go
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### Running Tests

```bash
# Backend tests
cd backend
go test ./...

# Frontend tests
cd frontend
npm test
```

## Project Structure

```
Channer/
├── backend/
│   ├── cmd/server/          # Application entry point
│   ├── internal/
│   │   ├── config/          # Configuration management
│   │   ├── handler/         # HTTP request handlers
│   │   ├── middleware/      # HTTP middleware
│   │   ├── model/           # Database models
│   │   ├── repository/      # Data access layer
│   │   └── service/         # Business logic
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   └── stores/          # State management
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Roadmap

- [ ] Support for more AI providers (Azure OpenAI, Cohere, etc.)
- [ ] Streaming response optimization
- [ ] Advanced analytics and reporting
- [ ] Webhook notifications
- [ ] API key usage alerts
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Gin](https://github.com/gin-gonic/gin) web framework
- UI powered by [Tailwind CSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)

---

<p align="center">Made with ❤️ for the AI community</p>
