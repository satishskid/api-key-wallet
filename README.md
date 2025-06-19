# API Key Wallet

A production-ready API key management system with unified ingestion, dynamic routing, cost optimization, and comprehensive security features.

## 🚀 Features

- **Unified Key Ingestion & Validation**: Support for any API key format with metadata
- **Dynamic Request Routing**: Intelligent routing based on service matching and priority
- **Cost Management**: Free tier optimization with quota tracking and fallback mechanisms
- **Security**: AES-256 encryption, role-based access control, and secure key storage
- **Database Integration**: PostgreSQL with Redis caching for high performance
- **Monitoring**: Prometheus metrics, health checks, and real-time analytics
- **Production Ready**: Docker deployment, rate limiting, audit logs

## 🏗️ Quick Deployment

### Using Docker (Recommended)

1. **Set Environment Variables:**
   ```bash
   export JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
   export ENCRYPTION_KEY="your-32-character-encryption-key!!"
   ```

2. **Deploy with One Command:**
   ```bash
   npm run deploy
   ```

3. **Access Your API:**
   - API Wallet: http://localhost:6789
   - Health Check: http://localhost:6789/monitoring/health
   - Metrics: http://localhost:6789/monitoring/metrics

### Manual Setup

#### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (for deployment)

#### Installation

```bash
# Clone and install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
```

## 📖 API Documentation

### Authentication

All endpoints require JWT authentication:
```bash
curl -H "Authorization: Bearer <jwt-token>" http://localhost:6789/keys
```

### Core Endpoints

#### Key Management
- `POST /keys` - Register a new API key
- `GET /keys` - List registered keys with filtering
- `GET /keys/:id` - Get specific key details
- `PUT /keys/:id` - Update key metadata
- `DELETE /keys/:id` - Remove a key

#### Request Proxy
- `POST /proxy` - Route requests through the wallet

#### Analytics
- `GET /analytics/overview` - Usage overview and statistics
- `GET /analytics/usage` - Detailed usage analytics

#### Monitoring
- `GET /monitoring/health` - Service health status
- `GET /monitoring/metrics` - Prometheus metrics

### Example: Register API Key

```bash
curl -X POST http://localhost:6789/keys \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "sk_test_123...",
    "service": "stripe",
    "tier": "paid",
    "metadata": {
      "type": "payment",
      "quota": 10000,
      "quotaPeriod": "monthly"
    }
  }'
```

### Example: Proxy Request

```bash
curl -X POST http://localhost:6789/proxy \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -H "X-Service-Hint: stripe" \
  -d '{
    "endpoint": "/v1/charges",
    "method": "POST",
    "body": {
      "amount": 2000,
      "currency": "usd"
    }
  }'
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  API Gateway    │───▶│ External APIs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │   Key Wallet    │
                    │                 │
                    │  ┌───────────┐  │
                    │  │PostgreSQL │  │
                    │  └───────────┘  │
                    │  ┌───────────┐  │
                    │  │   Redis   │  │
                    │  └───────────┘  │
                    │  ┌───────────┐  │
                    │  │Prometheus │  │
                    │  └───────────┘  │
                    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Security (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/api_wallet
REDIS_URL=redis://:password@localhost:6379

# Features
ENABLE_METRICS=true
ENABLE_RATE_LIMITING=true
DEFAULT_FREE_QUOTA=1000
```

### Supported Services

The wallet auto-detects and supports:

- **Stripe** (Payment Processing)
- **OpenWeather** (Weather Data)
- **Google Maps** (Mapping/Geocoding)
- **OpenAI** (AI/ML APIs)
- **Extensible** for custom services

## 📊 Monitoring & Analytics

### Health Monitoring
```bash
# Check service health
curl http://localhost:6789/monitoring/health

# View Prometheus metrics
curl http://localhost:6789/monitoring/metrics
```

### Usage Analytics
```bash
# Get overview
curl -H "Authorization: Bearer <token>" http://localhost:6789/analytics/overview

# Detailed usage by service
curl -H "Authorization: Bearer <token>" http://localhost:6789/analytics/usage?service=stripe
```

## 🐳 Docker Commands

```bash
# Build and start all services
npm run docker:up

# View application logs
npm run docker:logs

# Stop all services
npm run docker:down

# Build custom image
npm run docker:build
```

## 📈 Production Monitoring

Access monitoring dashboards:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)

Enable monitoring:
```bash
ENABLE_MONITORING=true npm run deploy
```

## 🔐 Security Features

- **AES-256 Encryption** for API key storage
- **JWT Authentication** with configurable expiration
- **Rate Limiting** by user tier
- **Role-Based Access Control** (USER/ADMIN)
- **Audit Logging** for all operations
- **Secure Headers** with Helmet.js

## 🚧 Future Integrations

The system is prepared for:

- **Clerk** authentication integration
- **Stripe** billing and subscription management
- **WebSocket** real-time notifications
- **Multi-tenant** support

## 📚 Additional Documentation

- [API Reference](./API.md) - Complete API documentation
- [Examples](./EXAMPLES.md) - Usage examples and code samples
- [Deployment Guide](./scripts/deploy.sh) - Production deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
