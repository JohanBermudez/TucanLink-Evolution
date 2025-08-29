import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import NodeCache from 'node-cache';
import { config } from '../../../config';
import { database, ApiKey, ApiKeyUsage } from '../../database';
import { logger, logApiKeyActivity, logError, logInfo } from '../../utils/logger';

export interface ApiKeyData {
  id?: string;
  key: string;
  hashedKey: string;
  companyId: number;
  name: string;
  permissions: string[];
  rateLimit?: number;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy?: number;
}

export interface ApiKeyMetrics {
  requestCount: number;
  lastRequestAt?: Date;
  rateLimitRemaining: number;
  rateLimitResetAt: Date;
}

export class ApiKeyService {
  private readonly cache: NodeCache;
  private readonly keyPrefix: string;
  private readonly keyLength: number;
  private readonly saltRounds: number;
  private dbAvailable: boolean = false;

  constructor() {
    // Initialize cache with 5 minute TTL
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.checkPeriod,
      useClones: false,
    });

    this.keyPrefix = config.security.apiKeyPrefix;
    this.keyLength = config.security.apiKeyLength;
    this.saltRounds = config.security.bcryptRounds;

    // Check if database is available
    this.initializeDatabase();
  }

  /**
   * Initialize database connection
   */
  private async initializeDatabase(): Promise<void> {
    try {
      this.dbAvailable = database.isReady();
      if (this.dbAvailable) {
        logInfo('API Key Service: Database persistence enabled');
        await this.syncCacheFromDatabase();
      } else {
        logInfo('API Key Service: Running in memory-only mode');
      }
    } catch (error) {
      logError('Failed to initialize API Key database', error);
      this.dbAvailable = false;
    }
  }

  /**
   * Sync cache from database on startup
   */
  private async syncCacheFromDatabase(): Promise<void> {
    if (!this.dbAvailable) return;

    try {
      const activeKeys = await ApiKey.findAll({
        where: {
          isActive: true,
          revokedAt: null,
        },
      });

      for (const key of activeKeys) {
        const cacheKey = `${this.keyPrefix}${key.keyPrefix}`;
        this.cache.set(cacheKey, {
          id: key.id,
          hashedKey: key.hashedKey,
          companyId: key.companyId,
          name: key.name,
          permissions: key.permissions,
          rateLimit: key.rateLimit,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive,
          metadata: key.metadata,
          createdBy: key.createdBy,
        });
      }

      logInfo(`Synced ${activeKeys.length} API keys from database to cache`);
    } catch (error) {
      logError('Failed to sync API keys from database', error);
    }
  }

  /**
   * Generate a new API key
   */
  async generateApiKey(
    companyId: number,
    name: string,
    permissions: string[] = [],
    expiresInDays?: number,
    createdBy?: number
  ): Promise<{ apiKey: string; apiKeyData: ApiKeyData }> {
    // Generate random bytes for the key
    const randomBytes = crypto.randomBytes(this.keyLength);
    const keyValue = randomBytes.toString('base64url');
    const apiKey = `${this.keyPrefix}${keyValue}`;

    // Hash the API key for storage
    const hashedKey = await bcrypt.hash(apiKey, this.saltRounds);

    // Calculate expiration if specified
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Extract key prefix for storage
    const keyPrefix = apiKey.substring(this.keyPrefix.length, this.keyPrefix.length + 10);

    // Save to database if available
    let apiKeyId: string | undefined;
    if (this.dbAvailable) {
      try {
        const dbApiKey = await ApiKey.create({
          keyPrefix,
          hashedKey,
          companyId,
          name,
          permissions,
          rateLimit: config.rateLimit.maxRequestsPerWindow.apiKey,
          expiresAt,
          isActive: true,
          createdBy,
          metadata: {},
        });
        apiKeyId = dbApiKey.id;

        logApiKeyActivity('created', apiKeyId, {
          companyId,
          name,
          createdBy,
        });
      } catch (error) {
        logError('Failed to persist API key to database', error);
        // Continue with in-memory storage
      }
    }

    const apiKeyData: ApiKeyData = {
      id: apiKeyId,
      key: apiKey.substring(0, 8) + '...',  // Store only first 8 chars for identification
      hashedKey,
      companyId,
      name,
      permissions,
      rateLimit: config.rateLimit.maxRequestsPerWindow.apiKey,
      createdAt: new Date(),
      createdBy,
      expiresAt,
      isActive: true,
    };

    // Cache the key data for faster lookups
    this.cacheApiKey(apiKey, apiKeyData);

    return { apiKey, apiKeyData };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(apiKey: string): Promise<ApiKeyData | null> {
    // Check if key has correct prefix
    if (!apiKey.startsWith(this.keyPrefix)) {
      return null;
    }

    // Check cache first
    const cachedData = this.cache.get<ApiKeyData>(`apikey:${apiKey}`);
    if (cachedData) {
      return this.checkKeyValidity(cachedData);
    }

    // If not in cache, fetch from database (to be implemented)
    // For now, return null (key not found)
    // In production, this should query the database
    return null;
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKey: string): Promise<boolean> {
    // Remove from cache
    this.cache.del(`apikey:${apiKey}`);
    this.cache.del(`metrics:${apiKey}`);

    // In production, update database to mark as revoked
    // For now, just return true
    return true;
  }

  /**
   * Check rate limiting for an API key
   */
  async checkRateLimit(apiKey: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const metricsKey = `metrics:${apiKey}`;
    let metrics = this.cache.get<ApiKeyMetrics>(metricsKey);

    const now = new Date();
    const windowMs = config.rateLimit.windowMs;
    const maxRequests = config.rateLimit.maxRequestsPerWindow.apiKey;

    if (!metrics) {
      // Initialize metrics
      metrics = {
        requestCount: 0,
        rateLimitRemaining: maxRequests,
        rateLimitResetAt: new Date(now.getTime() + windowMs),
      };
    }

    // Check if window has expired
    if (now >= metrics.rateLimitResetAt) {
      // Reset the window
      metrics = {
        requestCount: 0,
        rateLimitRemaining: maxRequests,
        rateLimitResetAt: new Date(now.getTime() + windowMs),
      };
    }

    // Check if rate limit exceeded
    if (metrics.requestCount >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: metrics.rateLimitResetAt,
      };
    }

    // Increment request count
    metrics.requestCount++;
    metrics.rateLimitRemaining = maxRequests - metrics.requestCount;
    metrics.lastRequestAt = now;

    // Update cache
    this.cache.set(metricsKey, metrics, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: metrics.rateLimitRemaining,
      resetAt: metrics.rateLimitResetAt,
    };
  }

  /**
   * Update last used timestamp for an API key
   */
  async updateLastUsed(apiKey: string): Promise<void> {
    const cachedData = this.cache.get<ApiKeyData>(`apikey:${apiKey}`);
    if (cachedData) {
      cachedData.lastUsedAt = new Date();
      this.cache.set(`apikey:${apiKey}`, cachedData);

      // Update in database if available
      if (this.dbAvailable && cachedData.id) {
        try {
          await ApiKey.update(
            { lastUsedAt: new Date() },
            { where: { id: cachedData.id } }
          );
        } catch (error) {
          logError('Failed to update last used in database', error);
        }
      }
    }
  }

  /**
   * Get API key metrics
   */
  getApiKeyMetrics(apiKey: string): ApiKeyMetrics | null {
    return this.cache.get<ApiKeyMetrics>(`metrics:${apiKey}`) || null;
  }

  /**
   * List all API keys for a company
   */
  async listApiKeys(companyId: number): Promise<ApiKeyData[]> {
    if (this.dbAvailable) {
      try {
        const dbKeys = await ApiKey.findByCompany(companyId);
        return dbKeys.map(key => ({
          id: key.id,
          key: `${this.keyPrefix}${key.keyPrefix.substring(0, 5)}...`,
          hashedKey: key.hashedKey,
          companyId: key.companyId,
          name: key.name,
          permissions: key.permissions,
          rateLimit: key.rateLimit,
          createdAt: key.createdAt,
          lastUsedAt: key.lastUsedAt || undefined,
          expiresAt: key.expiresAt || undefined,
          isActive: key.isActive,
          metadata: key.metadata,
          createdBy: key.createdBy || undefined,
        }));
      } catch (error) {
        logError('Failed to list API keys from database', error);
      }
    }

    // Fallback to cache-only
    const keys: ApiKeyData[] = [];
    const allKeys = this.cache.keys();
    for (const key of allKeys) {
      if (key.startsWith('apikey:')) {
        const data = this.cache.get<ApiKeyData>(key);
        if (data && data.companyId === companyId) {
          keys.push(data);
        }
      }
    }
    return keys;
  }

  /**
   * Update API key permissions
   */
  async updatePermissions(apiKey: string, permissions: string[]): Promise<boolean> {
    const cachedData = this.cache.get<ApiKeyData>(`apikey:${apiKey}`);
    if (cachedData) {
      cachedData.permissions = permissions;
      this.cache.set(`apikey:${apiKey}`, cachedData);

      // Update in database if available
      if (this.dbAvailable && cachedData.id) {
        try {
          await ApiKey.update(
            { permissions },
            { where: { id: cachedData.id } }
          );
          logApiKeyActivity('permissions_updated', cachedData.id, {
            newPermissions: permissions,
          });
        } catch (error) {
          logError('Failed to update permissions in database', error);
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Check if API key has specific permission
   */
  hasPermission(apiKeyData: ApiKeyData, permission: string): boolean {
    return apiKeyData.permissions.includes(permission) || 
           apiKeyData.permissions.includes('*');  // Wildcard permission
  }

  /**
   * Cache an API key
   */
  private cacheApiKey(apiKey: string, data: ApiKeyData): void {
    this.cache.set(`apikey:${apiKey}`, data);
  }

  /**
   * Check if key is still valid
   */
  private checkKeyValidity(apiKeyData: ApiKeyData): ApiKeyData | null {
    // Check if key is active
    if (!apiKeyData.isActive) {
      return null;
    }

    // Check expiration
    if (apiKeyData.expiresAt && new Date() > apiKeyData.expiresAt) {
      return null;
    }

    return apiKeyData;
  }

  /**
   * Generate a secure random string (for internal use)
   */
  private generateSecureString(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Compare API key with hashed version
   */
  async verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
    return bcrypt.compare(apiKey, hashedKey);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * Record API key usage for auditing
   */
  async recordUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    if (this.dbAvailable && apiKeyId) {
      try {
        await ApiKeyUsage.recordUsage({
          apiKeyId,
          endpoint,
          method,
          statusCode,
          responseTimeMs,
          ipAddress,
          userAgent,
        });
      } catch (error) {
        // Don't fail the request if usage recording fails
        logError('Failed to record API key usage', error);
      }
    }
  }

  /**
   * Get usage statistics for an API key
   */
  async getUsageStats(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    if (!this.dbAvailable) {
      return null;
    }

    try {
      return await ApiKeyUsage.getUsageStats(apiKeyId, startDate, endDate);
    } catch (error) {
      logError('Failed to get API key usage stats', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys(),
      stats: this.cache.getStats(),
    };
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService();

// Export for testing purposes
export default ApiKeyService;