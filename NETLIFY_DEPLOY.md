# 🚀 Netlify Deployment Guide

## Quick Deploy to Netlify (5 minutes)

### 1. **Connect Repository**
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select: `satishskid/api-key-wallet`

### 2. **Configure Build Settings**
```
Build command: npm run build:netlify
Publish directory: dist
Functions directory: netlify/functions
```

### 3. **Environment Variables**
Add these in Netlify Dashboard → Site settings → Environment variables:

```bash
# Required
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-min-48-chars
ENCRYPTION_KEY=your-32-character-encryption-key!!

# Database (use Supabase, Railway, or Heroku Postgres)
DATABASE_URL=postgresql://username:password@host:5432/dbname

# Optional (Redis for caching)
REDIS_URL=redis://username:password@host:6379
```

### 4. **Database Setup Options**

#### **Option A: Supabase (Recommended)**
```bash
# Sign up at supabase.com
# Create new project
# Copy connection string to DATABASE_URL
```

#### **Option B: Railway**
```bash
# Sign up at railway.app
# Add PostgreSQL service
# Copy connection string to DATABASE_URL
```

### 5. **Deploy**
```bash
# Push to main branch (auto-deploys)
git push origin main
```

### 6. **Post-Deployment**
```bash
# Your API will be live at:
https://your-site-name.netlify.app

# Test endpoints:
curl https://your-site-name.netlify.app/health
```

## ✅ **Why Netlify is Perfect for This Project**

- **✅ Node.js Functions**: Native Express.js support
- **✅ Environment Variables**: Secure secrets management  
- **✅ Database Integration**: Works with all major databases
- **✅ Auto HTTPS**: Built-in SSL certificates
- **✅ Global CDN**: Fast worldwide performance
- **✅ Easy Scaling**: Auto-scaling serverless functions

## 📈 **Production Ready Features**

- **API Key Management**: Full CRUD operations
- **Smart Routing**: Cost-optimized API routing
- **Real-time Analytics**: Usage tracking and insights
- **Enterprise Security**: JWT auth, encryption, rate limiting
- **Monitoring**: Health checks and metrics

Your API Key Wallet will be production-ready on Netlify in under 5 minutes!
