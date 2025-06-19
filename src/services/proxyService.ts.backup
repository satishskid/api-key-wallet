import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ProxyRequest, ProxyResponse, ServiceConfig, KeyTier } from '../models/types';
import { DatabaseKeyManagementService } from './databaseKeyManagementService';
import { RoutingService } from './routingService';
import { Logger } from '../utils/logger';

export class ProxyService {
  /**
   * Execute a proxied API request
   */
  static async executeRequest(
    userId: string,
    request: ProxyRequest
  ): Promise<ProxyResponse> {
    const startTime = Date.now();

    try {
      // Route the request to find the best key
      const routing = await RoutingService.routeRequest(
        userId,
        request.serviceHint,
        request.endpoint
      );

      // Get the decrypted key
      const decryptedKey = await DatabaseKeyManagementService.getDecryptedKey(routing.keyId);
      if (!decryptedKey) {
        throw new Error('Failed to retrieve API key');
      }

      // Build the request configuration
      const requestConfig = await this.buildRequestConfig(
        request,
        routing.service,
        decryptedKey
      );

      Logger.debug('Executing proxied request', {
        userId,
        keyId: routing.keyId,
        service: routing.service.name,
        method: request.method,
        endpoint: request.endpoint,
        tier: routing.tier
      });

      // Execute the request
      const response = await this.executeWithRetry(requestConfig, routing.service);

      // Record usage
      await DatabaseKeyManagementService.recordUsage(routing.keyId, routing.estimatedCost);

      const responseTime = Date.now() - startTime;

      const proxyResponse: ProxyResponse = {
        status: response.status,
        data: response.data,
        headers: this.filterHeaders(response.headers),
        service: routing.service.name,
        keyUsed: routing.keyId,
        cost: routing.estimatedCost,
        tier: routing.tier,
        responseTime
      };

      Logger.info('Proxied request completed', {
        userId,
        keyId: routing.keyId,
        service: routing.service.name,
        status: response.status,
        responseTime,
        cost: routing.estimatedCost
      });

      return proxyResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      Logger.error('Proxied request failed', {
        userId,
        error: (error as Error).message,
        responseTime,
        request: {
          method: request.method,
          endpoint: request.endpoint,
          serviceHint: request.serviceHint
        }
      });

      throw error;
    }
  }

  /**
   * Build axios request configuration
   */
  private static async buildRequestConfig(
    request: ProxyRequest,
    service: ServiceConfig,
    apiKey: string
  ): Promise<AxiosRequestConfig> {
    const config: AxiosRequestConfig = {
      method: request.method.toLowerCase() as any,
      url: this.buildUrl(service, request.endpoint, request.query),
      headers: { ...request.headers },
      timeout: 30000, // 30 second timeout
      validateStatus: () => true // Don't throw on HTTP errors
    };

    // Add authentication
    this.addAuthentication(config, service, apiKey);

    // Add body for POST/PUT requests
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase())) {
      config.data = request.body;
    }

    // Set default content type if not provided
    if (!config.headers!['Content-Type'] && config.data) {
      config.headers!['Content-Type'] = 'application/json';
    }

    return config;
  }

  /**
   * Build the full URL for the request
   */
  private static buildUrl(
    service: ServiceConfig,
    endpoint?: string,
    query?: Record<string, string>
  ): string {
    let url = service.baseUrl;

    if (endpoint) {
      // Remove leading slash if present
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      url = `${url}/${cleanEndpoint}`;
    }

    // Add query parameters
    if (query && Object.keys(query).length > 0) {
      const queryString = new URLSearchParams(query).toString();
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Add authentication to the request config
   */
  private static addAuthentication(
    config: AxiosRequestConfig,
    service: ServiceConfig,
    apiKey: string
  ): void {
    switch (service.authMethod) {
      case 'bearer':
        config.headers!['Authorization'] = `Bearer ${apiKey}`;
        break;

      case 'header':
        config.headers![service.authKey] = apiKey;
        break;

      case 'query':
        // Add to URL parameters
        const url = new URL(config.url!);
        url.searchParams.set(service.authKey, apiKey);
        config.url = url.toString();
        break;

      case 'basic':
        const encoded = Buffer.from(`${apiKey}:`).toString('base64');
        config.headers!['Authorization'] = `Basic ${encoded}`;
        break;

      default:
        throw new Error(`Unsupported auth method: ${service.authMethod}`);
    }
  }

  /**
   * Execute request with retry logic
   */
  private static async executeWithRetry(
    config: AxiosRequestConfig,
    service: ServiceConfig
  ): Promise<AxiosResponse> {
    const maxRetries = service.retryConfig?.maxRetries || 3;
    const backoffMs = service.retryConfig?.backoffMs || 1000;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios(config);

        // Check if we should retry based on status code
        if (this.shouldRetry(response.status) && attempt < maxRetries) {
          await this.sleep(backoffMs * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        return response;

      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries && this.isRetryableError(error)) {
          Logger.warn(`Request attempt ${attempt + 1} failed, retrying`, {
            error: lastError.message,
            nextAttemptIn: backoffMs * Math.pow(2, attempt)
          });

          await this.sleep(backoffMs * Math.pow(2, attempt));
          continue;
        }

        break;
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Check if HTTP status code indicates a retryable error
   */
  private static shouldRetry(status: number): boolean {
    return status === 429 || // Rate limited
           status === 502 || // Bad Gateway
           status === 503 || // Service Unavailable
           status === 504;   // Gateway Timeout
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network errors are retryable
      return error.code === 'ECONNRESET' ||
             error.code === 'ETIMEDOUT' ||
             error.code === 'ECONNREFUSED';
    }

    return this.shouldRetry(error.response.status);
  }

  /**
   * Sleep utility for delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Filter response headers to remove sensitive information
   */
  private static filterHeaders(headers: any): Record<string, string> {
    const filtered: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'content-length',
      'cache-control',
      'expires',
      'etag',
      'last-modified',
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset'
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (allowedHeaders.includes(key.toLowerCase())) {
        filtered[key] = String(value);
      }
    }

    return filtered;
  }

  /**
   * Get service health status
   */
  static async checkServiceHealth(serviceName: string): Promise<{
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
    error?: string;
  }> {
    const service = RoutingService.getServiceConfig(serviceName);
    if (!service) {
      return {
        service: serviceName,
        status: 'down',
        error: 'Service configuration not found'
      };
    }

    const startTime = Date.now();

    try {
      // Perform a simple health check request
      const response = await axios({
        method: 'GET',
        url: service.baseUrl,
        timeout: 5000,
        validateStatus: () => true
      });

      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (response.status >= 500) {
        status = 'down';
      } else if (response.status >= 400 || responseTime > 2000) {
        status = 'degraded';
      }

      return {
        service: serviceName,
        status,
        responseTime
      };

    } catch (error) {
      return {
        service: serviceName,
        status: 'down',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }
}
