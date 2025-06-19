import { ApiKey, KeyMetadata, KeyTier, KeyStatus, ServiceType } from '../models/types';
import { EncryptionService } from './encryptionService';
import { Logger } from '../utils/logger';

export class KeyManagementService {
  private static keys: Map<string, ApiKey> = new Map();
  private static keysByHash: Map<string, string> = new Map(); // hash -> keyId

  /**
   * Register a new API key
   */
  static async registerKey(
    userId: string,
    key: string,
    metadata: KeyMetadata,
    tier: KeyTier = KeyTier.FREE
  ): Promise<ApiKey> {
    // Validate key format
    const validation = EncryptionService.validateKeyFormat(key);
    if (!validation.valid) {
      throw new Error(`Invalid key format: ${validation.issues.join(', ')}`);
    }

    // Check for duplicate keys
    const keyHash = EncryptionService.createKeyHash(key);
    if (this.keysByHash.has(keyHash)) {
      throw new Error('Key already exists');
    }

    // Create new API key record
    const apiKey: ApiKey = {
      id: this.generateKeyId(),
      userId,
      key: EncryptionService.encrypt(key),
      keyHash,
      metadata,
      tier,
      status: KeyStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      dailyUsage: 0,
      monthlyUsage: 0
    };

    // Store the key
    this.keys.set(apiKey.id, apiKey);
    this.keysByHash.set(keyHash, apiKey.id);

    Logger.info('API key registered', {
      keyId: apiKey.id,
      userId,
      service: metadata.service,
      tier
    });

    return this.sanitizeKey(apiKey);
  }

  /**
   * Get key by ID
   */
  static async getKey(keyId: string, userId?: string): Promise<ApiKey | null> {
    const key = this.keys.get(keyId);
    
    if (!key) {
      return null;
    }

    // Check ownership if userId provided
    if (userId && key.userId !== userId) {
      return null;
    }

    return this.sanitizeKey(key);
  }

  /**
   * Get key by hash (for internal routing)
   */
  static async getKeyByHash(keyHash: string): Promise<ApiKey | null> {
    const keyId = this.keysByHash.get(keyHash);
    if (!keyId) {
      return null;
    }

    return this.keys.get(keyId) || null;
  }

  /**
   * List keys for a user
   */
  static async listKeys(userId: string, filters?: {
    service?: string;
    tier?: KeyTier;
    status?: KeyStatus;
    type?: ServiceType;
  }): Promise<ApiKey[]> {
    const userKeys = Array.from(this.keys.values())
      .filter(key => key.userId === userId);

    let filteredKeys = userKeys;

    if (filters) {
      if (filters.service) {
        filteredKeys = filteredKeys.filter(key => key.metadata.service === filters.service);
      }
      if (filters.tier) {
        filteredKeys = filteredKeys.filter(key => key.tier === filters.tier);
      }
      if (filters.status) {
        filteredKeys = filteredKeys.filter(key => key.status === filters.status);
      }
      if (filters.type) {
        filteredKeys = filteredKeys.filter(key => key.metadata.type === filters.type);
      }
    }

    return filteredKeys.map(key => this.sanitizeKey(key));
  }

  /**
   * Update key metadata
   */
  static async updateKey(
    keyId: string,
    userId: string,
    updates: Partial<Pick<ApiKey, 'metadata' | 'status' | 'tier'>>
  ): Promise<ApiKey | null> {
    const key = this.keys.get(keyId);
    
    if (!key || key.userId !== userId) {
      return null;
    }

    // Update fields
    if (updates.metadata) {
      key.metadata = { ...key.metadata, ...updates.metadata };
    }
    if (updates.status !== undefined) {
      key.status = updates.status;
    }
    if (updates.tier !== undefined) {
      key.tier = updates.tier;
    }

    key.updatedAt = new Date();

    Logger.info('API key updated', {
      keyId,
      userId,
      updates
    });

    return this.sanitizeKey(key);
  }

  /**
   * Delete a key
   */
  static async deleteKey(keyId: string, userId: string): Promise<boolean> {
    const key = this.keys.get(keyId);
    
    if (!key || key.userId !== userId) {
      return false;
    }

    this.keys.delete(keyId);
    this.keysByHash.delete(key.keyHash);

    Logger.info('API key deleted', {
      keyId,
      userId,
      service: key.metadata.service
    });

    return true;
  }

  /**
   * Record key usage
   */
  static async recordUsage(keyId: string, cost: number = 1): Promise<void> {
    const key = this.keys.get(keyId);
    
    if (!key) {
      return;
    }

    key.usageCount += 1;
    key.dailyUsage += cost;
    key.monthlyUsage += cost;
    key.lastUsed = new Date();
    key.updatedAt = new Date();

    // Update quota used if defined
    if (key.metadata.quotaUsed !== undefined) {
      key.metadata.quotaUsed += cost;
    } else {
      key.metadata.quotaUsed = cost;
    }
  }

  /**
   * Check if key has remaining quota
   */
  static async checkQuota(keyId: string): Promise<{
    hasQuota: boolean;
    remaining: number;
    limit: number;
    used: number;
  }> {
    const key = this.keys.get(keyId);
    
    if (!key) {
      return { hasQuota: false, remaining: 0, limit: 0, used: 0 };
    }

    const limit = key.metadata.quota;
    const used = key.metadata.quotaUsed || 0;
    const remaining = Math.max(0, limit - used);

    return {
      hasQuota: remaining > 0,
      remaining,
      limit,
      used
    };
  }

  /**
   * Get decrypted key for API calls (internal use only)
   */
  static async getDecryptedKey(keyId: string): Promise<string | null> {
    const key = this.keys.get(keyId);
    
    if (!key || key.status !== KeyStatus.ACTIVE) {
      return null;
    }

    try {
      return EncryptionService.decrypt(key.key);
    } catch (error) {
      Logger.error('Failed to decrypt key', { keyId, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Generate a unique key ID
   */
  private static generateKeyId(): string {
    return 'key_' + EncryptionService.generateRandomKey(16);
  }

  /**
   * Remove sensitive data from key object
   */
  private static sanitizeKey(key: ApiKey): ApiKey {
    const sanitized = { ...key };
    // Remove the encrypted key from responses
    delete (sanitized as any).key;
    return sanitized;
  }

  /**
   * Reset daily usage counters (should be called by cron job)
   */
  static resetDailyUsage(): void {
    for (const key of this.keys.values()) {
      key.dailyUsage = 0;
    }
    Logger.info('Daily usage counters reset');
  }

  /**
   * Reset monthly usage counters (should be called by cron job)
   */
  static resetMonthlyUsage(): void {
    for (const key of this.keys.values()) {
      key.monthlyUsage = 0;
      // Reset quota used if it's a monthly quota
      if (key.metadata.quotaPeriod === 'monthly') {
        key.metadata.quotaUsed = 0;
      }
    }
    Logger.info('Monthly usage counters reset');
  }
}
