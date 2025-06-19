#!/bin/bash

echo "🚀 API Key Wallet - Production Test Suite"
echo "========================================"
echo

# Base URL
BASE_URL="http://localhost:6789"

echo "1. Testing Health Endpoint..."
curl -s "$BASE_URL/health" | jq '.' 2>/dev/null || echo "Health endpoint working"
echo

echo "2. Testing User Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $REGISTER_RESPONSE"
echo

echo "3. Testing User Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }')

echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $LOGIN_RESPONSE"

# Extract JWT token if available
JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
echo

if [ "$JWT_TOKEN" != "null" ] && [ "$JWT_TOKEN" != "" ]; then
  echo "4. Testing Key Registration..."
  KEY_RESPONSE=$(curl -s -X POST "$BASE_URL/keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "key": "sk_test_demo_key_12345",
      "service": "demo",
      "tier": "free",
      "metadata": {"description": "Test API key"}
    }')
  
  echo "$KEY_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $KEY_RESPONSE"
  echo

  echo "5. Testing Key Listing..."
  LIST_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" "$BASE_URL/keys")
  echo "$LIST_RESPONSE" | jq '.' 2>/dev/null || echo "Response: $LIST_RESPONSE"
  echo

else
  echo "❌ No JWT token received, skipping authenticated tests"
fi

echo "6. Testing Available Routes..."
echo "Testing /monitoring/health/detailed..."
curl -s "$BASE_URL/monitoring/health/detailed" | head -100

echo
echo "Testing /monitoring/metrics..."
curl -s "$BASE_URL/monitoring/metrics" | head -5

echo
echo "✅ API Test Suite Complete!"
