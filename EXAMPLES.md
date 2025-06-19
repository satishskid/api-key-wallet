# API Key Wallet Examples

This document provides examples of how to use the API Key Wallet system.

## 1. Register an API Key

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "sk_test_1234567890abcdef",
    "service": "stripe",
    "tier": "free",
    "metadata": {
      "type": "payment",
      "quota": 1000,
      "quotaPeriod": "monthly",
      "permissions": ["charges.create", "customers.create"]
    }
  }'
```

## 2. List Your API Keys

```bash
curl -X GET http://localhost:3000/api/keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 3. Proxy a Request Through the Wallet

```bash
curl -X POST http://localhost:3000/api/proxy/charges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Service-Hint: stripe" \
  -d '{
    "amount": 2000,
    "currency": "usd",
    "source": "tok_visa",
    "description": "Test charge through API wallet"
  }'
```

## 4. Get Analytics

```bash
curl -X GET http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 5. Check Service Health

```bash
curl -X GET http://localhost:3000/api/analytics/health
```

## 6. Weather API Example

Register an OpenWeather API key:

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "your_openweather_api_key_here",
    "service": "openweather",
    "tier": "free",
    "metadata": {
      "type": "weather",
      "quota": 1000,
      "quotaPeriod": "monthly"
    }
  }'
```

Get weather data through the wallet:

```bash
curl -X GET "http://localhost:3000/api/proxy/weather?q=London,uk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Service-Hint: openweather"
```

## 7. Google Maps Example

Register a Google Maps API key:

```bash
curl -X POST http://localhost:3000/api/keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "key": "AIzaSyC1234567890abcdef",
    "service": "googlemaps",
    "tier": "free",
    "metadata": {
      "type": "mapping",
      "quota": 200,
      "quotaPeriod": "monthly"
    }
  }'
```

Geocode an address:

```bash
curl -X GET "http://localhost:3000/api/proxy/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Service-Hint: googlemaps"
```

## Authentication

To get a JWT token for testing, you would typically authenticate through an auth endpoint. For development, you can use a mock JWT token or implement a simple auth system.

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Bad Request",
  "message": "Key and service are required",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/keys"
}
```

## Rate Limiting

The API implements rate limiting with these headers:

- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the current window resets

## Response Headers

Proxied requests include these additional headers:

- `X-API-Wallet-Service`: Which service handled the request
- `X-API-Wallet-Key`: Which key was used (ID only, not the actual key)
- `X-API-Wallet-Cost`: Cost in credits/points
- `X-API-Wallet-Tier`: Tier of the key used
- `X-API-Wallet-Response-Time`: Response time in milliseconds
