<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# API Key Wallet - Copilot Instructions

This is a TypeScript/Node.js microservice for API key management with the following key features:

## Architecture
- **Key Management**: Secure storage and encryption of API keys using AES-256
- **Dynamic Routing**: Intelligent routing to external APIs based on key tier and quota
- **Cost Optimization**: Free tier prioritization with automatic fallback to paid tiers
- **Security**: Role-based access control, rate limiting, and secure key validation
- **Monitoring**: Real-time usage tracking and analytics

## Key Components

### Services
- `encryptionService.ts`: AES-256 encryption/decryption and key validation
- `keyManagementService.ts`: CRUD operations for API keys with quota tracking
- `routingService.ts`: Service configuration and routing decision logic
- `proxyService.ts`: HTTP proxy for external API requests with retry logic

### Models
- `types.ts`: TypeScript interfaces for API keys, services, and routing

### Routes
- `keyRoutes.ts`: Key registration, listing, updating, and deletion
- `proxyRoutes.ts`: Proxy endpoint for routing requests to external APIs
- `analyticsRoutes.ts`: Usage analytics and service health monitoring

## Code Patterns
- Use async/await for all asynchronous operations
- Implement proper error handling with custom error types
- Follow REST API conventions for routes
- Use TypeScript strict mode and proper type definitions
- Implement logging with different levels (debug, info, warn, error)
- Use environment variables for configuration

## Security Considerations
- Never log or expose raw API keys
- Use encrypted storage for sensitive data
- Implement rate limiting on all endpoints
- Validate all input data
- Use JWT for authentication

## External Services Supported
- Stripe (payment processing)
- OpenWeather (weather data)
- Google Maps (mapping/geocoding)
- OpenAI (AI/ML APIs)
- And extensible for more services

When suggesting code changes, ensure compatibility with the existing architecture and maintain security best practices.
