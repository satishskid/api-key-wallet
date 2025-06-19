export enum ServiceType {
  PAYMENT = 'payment',
  WEATHER = 'weather',
  MAPPING = 'mapping',
  AI = 'ai',
  DATABASE = 'database',
  STORAGE = 'storage',
  MESSAGING = 'messaging',
  ANALYTICS = 'analytics',
  OTHER = 'other'
}

export enum KeyTier {
  FREE = 'free',
  PAID = 'paid',
  PREMIUM = 'premium'
}

export enum KeyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

export interface KeyMetadata {
  type: ServiceType;
  service: string;
  quota: number;
  quotaUsed?: number;
  quotaPeriod?: 'hourly' | 'daily' | 'monthly' | 'yearly';
  expires?: string;
  region?: string;
  permissions?: string[];
  webhook?: string;
  customFields?: Record<string, any>;
}

export interface ApiKey {
  id: string;
  userId: string;
  key: string; // Encrypted in storage
  keyHash: string; // For lookups without decryption
  metadata: KeyMetadata;
  tier: KeyTier;
  status: KeyStatus;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  usageCount: number;
  dailyUsage: number;
  monthlyUsage: number;
}

export interface ServiceConfig {
  name: string;
  type: ServiceType;
  baseUrl: string;
  authMethod: 'header' | 'query' | 'bearer' | 'basic';
  authKey: string; // Header name or query param name
  freeTierLimit: number;
  freeTierPeriod: 'hourly' | 'daily' | 'monthly';
  rateLimitPerSecond?: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
  };
  endpoints?: Record<string, {
    path: string;
    method: string;
    cost: number; // Cost in credits/points
  }>;
}

export interface ProxyRequest {
  method: string;
  endpoint: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  serviceHint?: string; // Optional hint for service routing
}

export interface ProxyResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
  service: string;
  keyUsed: string;
  cost: number;
  tier: KeyTier;
  responseTime: number;
}

export interface QuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  resetTime: Date;
  period: string;
}

export interface RoutingDecision {
  keyId: string;
  service: ServiceConfig;
  reason: string;
  tier: KeyTier;
  estimatedCost: number;
}
