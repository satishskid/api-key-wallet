import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { Logger } from '../utils/logger';

export class MonitoringService {
  private static instance: MonitoringService;

  // Counters
  public readonly requestsTotal: Counter<string>;
  public readonly errorsTotal: Counter<string>;
  public readonly apiKeyUsage: Counter<string>;
  
  // Histograms
  public readonly requestDuration: Histogram<string>;
  public readonly responseSize: Histogram<string>;
  
  // Gauges
  public readonly activeConnections: Gauge<string>;
  public readonly activeApiKeys: Gauge<string>;
  public readonly activeUsers: Gauge<string>;
  public readonly quotaUtilization: Gauge<string>;

  private constructor() {
    // Enable default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register });

    // Request metrics
    this.requestsTotal = new Counter({
      name: 'api_wallet_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'service'],
      registers: [register],
    });

    this.errorsTotal = new Counter({
      name: 'api_wallet_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'service', 'error_code'],
      registers: [register],
    });

    this.apiKeyUsage = new Counter({
      name: 'api_wallet_key_usage_total',
      help: 'Total API key usage by service and tier',
      labelNames: ['service', 'tier', 'user_id'],
      registers: [register],
    });

    // Timing metrics
    this.requestDuration = new Histogram({
      name: 'api_wallet_request_duration_seconds',
      help: 'Request duration in seconds',
      labelNames: ['method', 'route', 'service'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [register],
    });

    this.responseSize = new Histogram({
      name: 'api_wallet_response_size_bytes',
      help: 'Response size in bytes',
      labelNames: ['method', 'route', 'service'],
      buckets: [100, 1000, 10000, 100000, 1000000],
      registers: [register],
    });

    // System metrics
    this.activeConnections = new Gauge({
      name: 'api_wallet_active_connections',
      help: 'Number of active connections',
      registers: [register],
    });

    this.activeApiKeys = new Gauge({
      name: 'api_wallet_active_keys',
      help: 'Number of active API keys',
      labelNames: ['service', 'tier'],
      registers: [register],
    });

    this.activeUsers = new Gauge({
      name: 'api_wallet_active_users',
      help: 'Number of active users',
      labelNames: ['plan'],
      registers: [register],
    });

    this.quotaUtilization = new Gauge({
      name: 'api_wallet_quota_utilization_percent',
      help: 'Quota utilization percentage',
      labelNames: ['user_id', 'service', 'tier'],
      registers: [register],
    });

    Logger.info('Monitoring service initialized');
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Helper methods for common metrics
  recordRequest(method: string, route: string, statusCode: number, service: string, duration: number): void {
    this.requestsTotal.inc({ method, route, status_code: statusCode.toString(), service });
    this.requestDuration.observe({ method, route, service }, duration / 1000); // Convert to seconds
  }

  recordError(type: string, service: string, errorCode: string): void {
    this.errorsTotal.inc({ type, service, error_code: errorCode });
  }

  recordApiKeyUsage(service: string, tier: string, userId: string): void {
    this.apiKeyUsage.inc({ service, tier, user_id: userId });
  }

  recordResponseSize(method: string, route: string, service: string, size: number): void {
    this.responseSize.observe({ method, route, service }, size);
  }

  updateQuotaUtilization(userId: string, service: string, tier: string, utilizationPercent: number): void {
    this.quotaUtilization.set({ user_id: userId, service, tier }, utilizationPercent);
  }

  updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  updateActiveApiKeys(service: string, tier: string, count: number): void {
    this.activeApiKeys.set({ service, tier }, count);
  }

  updateActiveUsers(plan: string, count: number): void {
    this.activeUsers.set({ plan }, count);
  }

  // Get metrics in Prometheus format
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Get metrics as JSON (for dashboard)
  async getMetricsJson(): Promise<any> {
    const metrics = await register.getMetricsAsJSON();
    return {
      timestamp: new Date().toISOString(),
      metrics: metrics.reduce((acc, metric) => {
        acc[metric.name] = {
          help: metric.help,
          type: metric.type,
          values: metric.values,
        };
        return acc;
      }, {} as Record<string, any>),
    };
  }

  // Clear all metrics (useful for testing)
  clearMetrics(): void {
    register.clear();
  }
}

export const monitoring = MonitoringService.getInstance();
export default MonitoringService;
