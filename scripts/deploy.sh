#!/bin/bash

# API Key Wallet Deployment Script
set -e

echo "🚀 Starting API Key Wallet deployment..."

# Check if required environment variables are set
if [ -z "$JWT_SECRET" ] || [ -z "$ENCRYPTION_KEY" ]; then
    echo "❌ Error: JWT_SECRET and ENCRYPTION_KEY environment variables must be set"
    echo "Example:"
    echo "export JWT_SECRET='your-super-secret-jwt-key-min-32-chars'"
    echo "export ENCRYPTION_KEY='your-32-character-encryption-key!!'"
    exit 1
fi

# Set default passwords if not provided
export DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32)}
export REDIS_PASSWORD=${REDIS_PASSWORD:-$(openssl rand -base64 32)}
export GRAFANA_PASSWORD=${GRAFANA_PASSWORD:-admin}

echo "🔧 Environment Configuration:"
echo "- Database Password: [HIDDEN]"
echo "- Redis Password: [HIDDEN]"
echo "- Grafana Password: $GRAFANA_PASSWORD"

# Create production environment file
cat > .env.production << EOF
NODE_ENV=production
PORT=6789
DATABASE_URL=postgresql://apiwalletuser:${DB_PASSWORD}@localhost:5432/api_wallet
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
BCRYPT_ROUNDS=12
GATEWAY_URL=http://localhost:6789
MAX_REQUESTS_PER_MINUTE=1000
DEFAULT_FREE_QUOTA=1000
QUOTA_RESET_INTERVAL=monthly
ENABLE_METRICS=true
PROMETHEUS_PORT=9090
LOG_LEVEL=info
LOG_FILE=./logs/api-wallet.log
EOF

echo "📦 Building and starting services..."

# Build and start core services
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations and seeding
echo "🗄️ Running database migrations..."
npm run migrate

echo "🌱 Seeding database with initial data..."
npm run seed

# Start the main application
echo "🚀 Starting API Wallet application..."
docker-compose up -d api-wallet

# Start monitoring (optional)
if [ "$ENABLE_MONITORING" = "true" ]; then
    echo "📊 Starting monitoring services..."
    docker-compose --profile monitoring up -d prometheus grafana
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Services are now running:"
echo "- API Wallet: http://localhost:6789"
echo "- Health Check: http://localhost:6789/monitoring/health"
echo "- Metrics: http://localhost:6789/monitoring/metrics"

if [ "$ENABLE_MONITORING" = "true" ]; then
    echo "- Prometheus: http://localhost:9090"
    echo "- Grafana: http://localhost:3000 (admin/${GRAFANA_PASSWORD})"
fi

echo ""
echo "📚 API Documentation:"
echo "- Keys: POST/GET/PUT/DELETE /keys"
echo "- Proxy: POST /proxy"
echo "- Analytics: GET /analytics/overview"
echo ""
echo "🔐 Admin credentials saved to .env.production"
echo "💡 Check logs: docker-compose logs -f api-wallet"
