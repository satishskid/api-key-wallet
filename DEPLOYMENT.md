# 🚀 API Key Wallet - Production Deployment Guide

*Go from zero to revenue-generating production in under 30 minutes.*

## 📋 **Pre-Deployment Checklist**

### **Requirements**
- [ ] Server/Cloud instance (2GB+ RAM, 20GB+ storage)
- [ ] Domain name for your service
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Email service (SendGrid, Mailgun, or AWS SES)
- [ ] Payment processor account (Stripe recommended)

### **Recommended Infrastructure**
- **Small Scale** (< 1000 users): Single VPS ($20-50/month)
- **Medium Scale** (1K-10K users): Load balanced with RDS ($100-300/month)
- **Enterprise Scale** (10K+ users): Auto-scaling with dedicated DB ($500+/month)

---

## 🏗️ **Production Deployment**

### **Option 1: Docker Compose (Fastest)**

```bash
# 1. Server Setup
ssh root@your-server.com
apt update && apt upgrade -y
apt install docker.io docker-compose git -y

# 2. Clone Repository
git clone https://github.com/satishskid/api-key-wallet.git
cd api-key-wallet

# 3. Configure Environment
cp .env.example .env
nano .env  # Edit with your production values

# 4. Generate Production Secrets
export JWT_SECRET=$(openssl rand -base64 48)
export ENCRYPTION_KEY=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env

# 5. Start Production Services
docker-compose up -d

# 6. Initialize Database
docker exec api-key-wallet_api_1 npm run migrate
docker exec api-key-wallet_api_1 npm run seed

# 7. Verify Deployment
curl http://localhost:6789/monitoring/health
```

### **Option 2: Cloud Platform Deploy**

#### **AWS ECS Deployment**
```bash
# Using AWS CLI and ECS
aws ecs create-cluster --cluster-name api-key-wallet
aws ecs register-task-definition --cli-input-json file://aws-task-definition.json
aws ecs create-service --cluster api-key-wallet --service-name api-wallet-service
```

#### **Google Cloud Run**
```bash
# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT-ID/api-key-wallet
gcloud run deploy --image gcr.io/PROJECT-ID/api-key-wallet --platform managed
```

#### **Azure Container Instances**
```bash
# Deploy to Azure
az container create --resource-group myResourceGroup \
  --name api-key-wallet --image youracr.azurecr.io/api-key-wallet:latest
```

---

## ⚙️ **Production Configuration**

### **Environment Variables** (`.env`)

```env
# Application
NODE_ENV=production
PORT=6789
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Database
DATABASE_URL="postgresql://username:password@db-host:5432/apikey_wallet"
REDIS_URL="redis://redis-host:6379"

# Security (GENERATE NEW VALUES!)
JWT_SECRET="your-super-secure-jwt-secret-min-48-chars"
ENCRYPTION_KEY="your-32-character-encryption-key!!"

# External Services
SENDGRID_API_KEY="your-sendgrid-api-key"
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Monitoring
PROMETHEUS_ENDPOINT="/metrics"
LOG_LEVEL="info"

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX=100        # requests per window
```

---

## 🔒 **Security Hardening**

### **SSL/TLS Setup**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Firewall Configuration**
```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 📊 **Post-Deployment Configuration**

### **1. Admin User Setup**
```bash
# Create first admin user
curl -X POST https://yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!",
    "name": "Admin User"
  }'
```

### **2. Test API Endpoints**
```bash
# Health check
curl https://yourdomain.com/monitoring/health

# Register a test API key
curl -X POST https://yourdomain.com/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "sk_test_demo_key",
    "service": "demo",
    "tier": "free"
  }'
```

---

## 💳 **Revenue Configuration**

### **Stripe Integration**
```bash
# 1. Create Stripe Products
stripe products create \
  --name "API Key Wallet Professional" \
  --description "Professional plan with 100K requests/month"

# 2. Create Pricing Plans
stripe prices create \
  --product prod_XXXXXXXX \
  --unit-amount 4900 \
  --currency usd \
  --recurring[interval]=month

# 3. Configure Webhooks
# URL: https://yourdomain.com/webhooks/stripe
# Events: customer.subscription.created, invoice.payment_succeeded
```

---

## 📈 **Business Operations**

### **Customer Success Automation**
```bash
# Track key business metrics
echo "Monitor these KPIs daily:"
echo "- New user registrations"
echo "- API key registrations"  
echo "- Proxy request volume"
echo "- Error rates and uptime"
echo "- Customer support tickets"
```

### **Analytics Dashboard**
Access your monitoring at:
- **API Health**: https://yourdomain.com/monitoring/health
- **Metrics**: https://yourdomain.com/monitoring/metrics  
- **Grafana**: https://yourdomain.com:3000 (admin/admin)

---

## � **Monitoring & Alerts**

### **Health Check Endpoints**
- `GET /monitoring/health` - Basic health check
- `GET /monitoring/metrics` - Prometheus metrics
- `GET /analytics/overview` - Usage analytics

### **Key Metrics to Monitor**
- API response times (< 200ms target)
- Error rates (< 1% target)
- Database connection health
- Redis connectivity
- Disk and memory usage

---

## 🔄 **Backup & Disaster Recovery**

### **Database Backups**
```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Set up automated backups (add to crontab)
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/backup-$(date +\%Y\%m\%d).sql.gz
```

---

## � **Go-Live Checklist**

### **Pre-Launch** 
- [ ] Production environment deployed
- [ ] SSL certificates installed
- [ ] Database initialized and seeded
- [ ] Admin user created
- [ ] Monitoring active
- [ ] Backups configured

### **Launch Day**
- [ ] DNS pointed to production server
- [ ] All endpoints responding correctly
- [ ] Customer registration working
- [ ] API key management functional
- [ ] Proxy routing operational

### **Post-Launch**
- [ ] Customer feedback collected
- [ ] Performance metrics reviewed
- [ ] Error monitoring active
- [ ] Support documentation ready

---

## 🎯 **Success Metrics**

### **Technical KPIs**
- **Uptime**: > 99.9%
- **Response Time**: < 200ms average
- **Error Rate**: < 1%
- **Customer Onboarding**: < 5 minutes

### **Business KPIs**
- **Customer Acquisition**: Track daily signups
- **API Usage**: Monitor proxy request volume
- **Revenue**: Track subscription upgrades
- **Customer Satisfaction**: Gather user feedback

---

**🎉 Your API Key Wallet is now live and ready to serve customers!**

**Repository**: https://github.com/satishskid/api-key-wallet

**Questions?** Check the issues section or create a new issue for support.
