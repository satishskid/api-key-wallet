# API Key Wallet - API Documentation

## Overview

The API Key Wallet provides a comprehensive RESTful API for managing API keys, routing requests, and monitoring usage. All endpoints require authentication via JWT tokens.

## Base URL

```
http://localhost:6789
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health & Monitoring

#### GET /monitoring/health
Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "uptime": 3600
}
```

#### GET /monitoring/metrics
Prometheus metrics endpoint (Prometheus format).

### API Key Management

#### POST /keys
Register a new API key.

**Request Body:**
```json
{
  "key": "sk_test_1234567890123456789012345678",
  "service": "stripe",
  "tier": "paid",
  "metadata": {
    "type": "payment",
    "quota": 10000,
    "quotaPeriod": "monthly",
    "description": "Production Stripe key"
  }
}
```

**Response:**
```json
{
  "message": "API key registered successfully",
  "key": {
    "id": "key_123456",
    "serviceName": "stripe",
    "serviceType": "payment",
    "tier": "paid",
    "status": "active",
    "quota": 10000,
    "quotaUsed": 0,
    "quotaPeriod": "monthly",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET /keys
List user's API keys with optional filtering.

**Query Parameters:**
- `service` (optional): Filter by service name
- `tier` (optional): Filter by tier (free, paid, premium)
- `status` (optional): Filter by status (active, inactive, expired)
- `type` (optional): Filter by service type

**Response:**
```json
{
  "keys": [
    {
      "id": "key_123456",
      "serviceName": "stripe",
      "serviceType": "payment",
      "tier": "paid",
      "status": "active",
      "quota": 10000,
      "quotaUsed": 245,
      "quotaPeriod": "monthly",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "lastUsed": "2024-01-01T12:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### GET /keys/:id
Get details of a specific API key.

**Response:**
```json
{
  "key": {
    "id": "key_123456",
    "serviceName": "stripe",
    "serviceType": "payment",
    "tier": "paid",
    "status": "active",
    "quota": 10000,
    "quotaUsed": 245,
    "quotaPeriod": "monthly",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "lastUsed": "2024-01-01T12:30:00.000Z"
  },
  "quota": {
    "limit": 10000,
    "used": 245,
    "remaining": 9755,
    "resetDate": "2024-02-01T00:00:00.000Z"
  }
}
```

#### PUT /keys/:id
Update an API key's metadata or status.

**Request Body:**
```json
{
  "metadata": {
    "description": "Updated description"
  },
  "status": "active",
  "tier": "premium"
}
```

**Response:**
```json
{
  "message": "API key updated successfully",
  "key": {
    "id": "key_123456",
    "serviceName": "stripe",
    "tier": "premium",
    "status": "active"
  }
}
```

#### DELETE /keys/:id
Delete an API key.

**Response:**
```json
{
  "message": "API key deleted successfully"
}
```

### Request Proxy

#### POST /proxy
Route and execute API requests through the key wallet.

**Headers:**
- `X-Service-Hint` (optional): Suggest which service to use
- `Content-Type`: application/json

**Request Body:**
```json
{
  "endpoint": "/v1/charges",
  "method": "POST",
  "body": {
    "amount": 2000,
    "currency": "usd",
    "source": "tok_visa"
  }
}
```

**Response:**
```json
{
  "status": 200,
  "data": {
    "id": "ch_1234567890",
    "amount": 2000,
    "currency": "usd",
    "status": "succeeded"
  },
  "headers": {
    "content-type": "application/json"
  }
}
```

**Response Headers:**
- `X-API-Wallet-Service`: Service used
- `X-API-Wallet-Key`: Key ID used
- `X-API-Wallet-Cost`: Request cost
- `X-API-Wallet-Tier`: Key tier used
- `X-API-Wallet-Response-Time`: Response time in ms

### Analytics

#### GET /analytics/overview
Get usage overview and statistics.

**Response:**
```json
{
  "totalKeys": 5,
  "activeKeys": 4,
  "totalUsage": 1250,
  "dailyUsage": 45,
  "monthlyUsage": 1250,
  "keysByTier": {
    "free": 2,
    "paid": 2,
    "premium": 1
  },
  "keysByService": {
    "stripe": 2,
    "openweather": 1,
    "googlemaps": 1,
    "openai": 1
  },
  "quotaUtilization": [
    {
      "keyId": "key_123456",
      "service": "stripe",
      "used": 245,
      "limit": 10000,
      "percentage": 2.45
    }
  ]
}
```

#### GET /analytics/usage
Get detailed usage analytics with optional filtering.

**Query Parameters:**
- `service` (optional): Filter by service
- `period` (optional): Time period (day, week, month, year)
- `startDate` (optional): Start date for custom period
- `endDate` (optional): End date for custom period

**Response:**
```json
{
  "period": "month",
  "service": null,
  "summary": {
    "totalRequests": 1250,
    "totalCost": 12.50,
    "averageResponseTime": 245,
    "successRate": 98.5
  },
  "breakdown": {
    "byService": {
      "stripe": {
        "requests": 500,
        "cost": 10.00,
        "avgResponseTime": 180
      },
      "openweather": {
        "requests": 750,
        "cost": 2.50,
        "avgResponseTime": 120
      }
    },
    "byTier": {
      "free": {
        "requests": 750,
        "cost": 0.00
      },
      "paid": {
        "requests": 500,
        "cost": 12.50
      }
    }
  },
  "timeline": [
    {
      "date": "2024-01-01",
      "requests": 45,
      "cost": 0.45
    }
  ]
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/keys",
  "requestId": "req_123456"
}
```

### Common Error Codes

- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

API endpoints are rate limited based on user tier:

- **Free Tier**: 100 requests per minute
- **Paid Tier**: 1000 requests per minute
- **Premium Tier**: 10000 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## WebSocket Events (Future)

The API will support WebSocket connections for real-time events:

- `key.usage`: Real-time usage updates
- `quota.warning`: Quota threshold warnings
- `service.status`: Service health changes

## SDKs and Libraries

Official SDKs will be available for:
- JavaScript/TypeScript
- Python
- Go
- PHP

## Support

For API support and questions:
- Documentation: [API Docs]
- Support Email: support@api-key-wallet.com
- GitHub Issues: [Repository Issues]
