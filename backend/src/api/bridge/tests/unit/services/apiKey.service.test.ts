import ApiKeyService from '../../../v1/services/auth/apiKey.service';
import bcrypt from 'bcryptjs';
import { config } from '../../../config';

// Mock bcrypt
jest.mock('bcryptjs');

describe('ApiKeyService', () => {
  let apiKeyService: ApiKeyService;

  beforeEach(() => {
    apiKeyService = new ApiKeyService();
    apiKeyService.clearCache();
    jest.clearAllMocks();
  });

  describe('generateApiKey', () => {
    it('should generate a new API key with correct format', async () => {
      const mockHash = 'hashed_api_key';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Test API Key',
        ['tickets:read', 'messages:send']
      );

      expect(apiKey).toMatch(/^tlk_[A-Za-z0-9_-]+$/);
      expect(apiKey.startsWith(config.security.apiKeyPrefix)).toBe(true);
      expect(apiKeyData).toMatchObject({
        hashedKey: mockHash,
        companyId: 1,
        name: 'Test API Key',
        permissions: ['tickets:read', 'messages:send'],
        isActive: true,
      });
      expect(apiKeyData.createdAt).toBeInstanceOf(Date);
      expect(bcrypt.hash).toHaveBeenCalledWith(apiKey, config.security.bcryptRounds);
    });

    it('should set expiration date when specified', async () => {
      const mockHash = 'hashed_api_key';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);

      const expiresInDays = 30;
      const { apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Temporary API Key',
        [],
        expiresInDays
      );

      expect(apiKeyData.expiresAt).toBeInstanceOf(Date);
      const expectedExpiration = new Date();
      expectedExpiration.setDate(expectedExpiration.getDate() + expiresInDays);
      
      // Check that expiration is approximately correct (within 1 second)
      const diff = Math.abs(apiKeyData.expiresAt!.getTime() - expectedExpiration.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should handle empty permissions array', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      const { apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'No Permissions Key',
        []
      );

      expect(apiKeyData.permissions).toEqual([]);
    });

    it('should set default rate limit', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      const { apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Test Key',
        []
      );

      expect(apiKeyData.rateLimit).toBe(config.rateLimit.maxRequestsPerWindow.apiKey);
    });
  });

  describe('validateApiKey', () => {
    it('should return null for key without correct prefix', async () => {
      const result = await apiKeyService.validateApiKey('invalid_key_format');
      expect(result).toBeNull();
    });

    it('should return null for key with correct prefix but not in cache', async () => {
      const result = await apiKeyService.validateApiKey('tlk_nonexistent_key');
      expect(result).toBeNull();
    });

    it('should validate cached API key', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');
      
      // Generate and cache a key
      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Cached Key',
        ['test:permission']
      );

      // Validate the key
      const validated = await apiKeyService.validateApiKey(apiKey);
      
      expect(validated).not.toBeNull();
      expect(validated?.companyId).toBe(1);
      expect(validated?.name).toBe('Cached Key');
      expect(validated?.permissions).toEqual(['test:permission']);
    });

    it('should return null for expired API key', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      // Generate a key that expires immediately
      const { apiKey } = await apiKeyService.generateApiKey(
        1,
        'Expired Key',
        [],
        -1 // Negative days = already expired
      );

      const validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated).toBeNull();
    });

    it('should return null for inactive API key', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Inactive Key',
        []
      );

      // Mark as inactive
      apiKeyData.isActive = false;

      const validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated).toBeNull();
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key and clear cache', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      const { apiKey } = await apiKeyService.generateApiKey(
        1,
        'To Be Revoked',
        []
      );

      // Check key exists in cache
      let validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated).not.toBeNull();

      // Revoke the key
      const result = await apiKeyService.revokeApiKey(apiKey);
      expect(result).toBe(true);

      // Check key is no longer valid
      validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const apiKey = 'tlk_test_rate_limit';
      const maxRequests = config.rateLimit.maxRequestsPerWindow.apiKey;

      // First request
      let result = await apiKeyService.checkRateLimit(apiKey);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - 1);

      // Second request
      result = await apiKeyService.checkRateLimit(apiKey);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - 2);
    });

    it('should block requests exceeding rate limit', async () => {
      const apiKey = 'tlk_test_rate_limit_exceed';
      const maxRequests = config.rateLimit.maxRequestsPerWindow.apiKey;

      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        await apiKeyService.checkRateLimit(apiKey);
      }

      // Next request should be blocked
      const result = await apiKeyService.checkRateLimit(apiKey);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should reset rate limit after window expires', async () => {
      jest.useRealTimers(); // Use real timers for this test
      
      const apiKey = 'tlk_test_rate_limit_reset';
      
      // Set a very short window for testing (1ms)
      const originalWindowMs = config.rateLimit.windowMs;
      config.rateLimit.windowMs = 1;

      // First request
      await apiKeyService.checkRateLimit(apiKey);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 2));

      // Should be allowed again
      const result = await apiKeyService.checkRateLimit(apiKey);
      expect(result.allowed).toBe(true);

      // Restore original config
      config.rateLimit.windowMs = originalWindowMs;
      jest.useFakeTimers(); // Restore fake timers
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used timestamp for cached key', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      const { apiKey } = await apiKeyService.generateApiKey(
        1,
        'Update LastUsed Test',
        []
      );

      // Update last used
      await apiKeyService.updateLastUsed(apiKey);

      // Validate and check lastUsedAt
      const validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated?.lastUsedAt).toBeInstanceOf(Date);
    });

    it('should do nothing for non-existent key', async () => {
      // Should not throw
      await expect(
        apiKeyService.updateLastUsed('tlk_nonexistent')
      ).resolves.toBeUndefined();
    });
  });

  describe('hasPermission', () => {
    it('should return true for exact permission match', () => {
      const apiKeyData: any = {
        permissions: ['tickets:read', 'messages:send'],
      };

      expect(apiKeyService.hasPermission(apiKeyData, 'tickets:read')).toBe(true);
      expect(apiKeyService.hasPermission(apiKeyData, 'messages:send')).toBe(true);
    });

    it('should return false for missing permission', () => {
      const apiKeyData: any = {
        permissions: ['tickets:read'],
      };

      expect(apiKeyService.hasPermission(apiKeyData, 'tickets:write')).toBe(false);
    });

    it('should return true for wildcard permission', () => {
      const apiKeyData: any = {
        permissions: ['*'],
      };

      expect(apiKeyService.hasPermission(apiKeyData, 'any:permission')).toBe(true);
      expect(apiKeyService.hasPermission(apiKeyData, 'tickets:write')).toBe(true);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions for cached API key', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      const { apiKey } = await apiKeyService.generateApiKey(
        1,
        'Update Permissions Test',
        ['old:permission']
      );

      // Update permissions
      const result = await apiKeyService.updatePermissions(apiKey, [
        'new:permission1',
        'new:permission2',
      ]);
      expect(result).toBe(true);

      // Validate and check new permissions
      const validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated?.permissions).toEqual(['new:permission1', 'new:permission2']);
    });

    it('should return false for non-existent key', async () => {
      const result = await apiKeyService.updatePermissions('tlk_nonexistent', ['test']);
      expect(result).toBe(false);
    });
  });

  describe('verifyApiKey', () => {
    it('should verify correct API key against hash', async () => {
      const apiKey = 'tlk_test_verify';
      const hashedKey = 'hashed_version';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await apiKeyService.verifyApiKey(apiKey, hashedKey);
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(apiKey, hashedKey);
    });

    it('should reject incorrect API key', async () => {
      const apiKey = 'tlk_wrong_key';
      const hashedKey = 'hashed_version';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await apiKeyService.verifyApiKey(apiKey, hashedKey);
      expect(result).toBe(false);
    });
  });

  describe('getApiKeyMetrics', () => {
    it('should return metrics for API key with activity', async () => {
      const apiKey = 'tlk_test_metrics';

      // Generate some activity
      await apiKeyService.checkRateLimit(apiKey);
      await apiKeyService.checkRateLimit(apiKey);

      const metrics = apiKeyService.getApiKeyMetrics(apiKey);
      expect(metrics).not.toBeNull();
      expect(metrics?.requestCount).toBe(2);
      expect(metrics?.lastRequestAt).toBeInstanceOf(Date);
      expect(metrics?.rateLimitRemaining).toBe(
        config.rateLimit.maxRequestsPerWindow.apiKey - 2
      );
    });

    it('should return null for API key without activity', () => {
      const metrics = apiKeyService.getApiKeyMetrics('tlk_no_activity');
      expect(metrics).toBeNull();
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      // Generate some keys
      await apiKeyService.generateApiKey(1, 'Key 1', []);
      await apiKeyService.generateApiKey(1, 'Key 2', []);

      const stats = apiKeyService.getCacheStats();
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('stats');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');

      // Generate and cache a key
      const { apiKey } = await apiKeyService.generateApiKey(1, 'To Clear', []);

      // Verify it's cached
      let validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated).not.toBeNull();

      // Clear cache
      apiKeyService.clearCache();

      // Verify it's no longer cached
      validated = await apiKeyService.validateApiKey(apiKey);
      expect(validated).toBeNull();
    });
  });
});