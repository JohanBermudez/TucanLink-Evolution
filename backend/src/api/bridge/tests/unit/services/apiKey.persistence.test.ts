import { ApiKeyService } from '../../../v1/services/auth/apiKey.service';
import { database, ApiKey, ApiKeyUsage } from '../../../v1/database';
import bcrypt from 'bcryptjs';

// Mock the database module
jest.mock('../../../v1/database', () => ({
  database: {
    isReady: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    transaction: jest.fn(),
  },
  ApiKey: {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCompany: jest.fn(),
    update: jest.fn(),
    cleanExpired: jest.fn(),
  },
  ApiKeyUsage: {
    create: jest.fn(),
    recordUsage: jest.fn(),
    getUsageStats: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('../../../v1/utils/logger');

describe('ApiKeyService - Database Persistence', () => {
  let apiKeyService: ApiKeyService;

  beforeEach(() => {
    apiKeyService = new ApiKeyService();
    jest.clearAllMocks();
    
    // Default mock implementations
    (database.isReady as jest.Mock).mockReturnValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_key');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('Database Integration', () => {
    it('should create API key in database when available', async () => {
      const mockDbKey = {
        id: 'uuid-1234',
        keyPrefix: 'test_prefix',
        hashedKey: 'hashed_key',
        companyId: 1,
        name: 'Test Key',
        permissions: ['read', 'write'],
        rateLimit: 1000,
        createdAt: new Date(),
        isActive: true,
      };

      (ApiKey.create as jest.Mock).mockResolvedValue(mockDbKey);

      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Test Key',
        ['read', 'write'],
        30,
        1
      );

      expect(ApiKey.create).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: 1,
          name: 'Test Key',
          permissions: ['read', 'write'],
          isActive: true,
          createdBy: 1,
        })
      );

      expect(apiKeyData.id).toBe('uuid-1234');
      expect(apiKey).toMatch(/^tlk_/);
    });

    it('should fallback to in-memory when database is unavailable', async () => {
      (database.isReady as jest.Mock).mockReturnValue(false);

      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Fallback Key',
        []
      );

      expect(ApiKey.create).not.toHaveBeenCalled();
      expect(apiKey).toMatch(/^tlk_/);
      expect(apiKeyData.id).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      (ApiKey.create as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Error Key',
        []
      );

      expect(apiKey).toMatch(/^tlk_/);
      expect(apiKeyData.id).toBeUndefined(); // Should work without DB
    });
  });

  describe('Cache and Database Sync', () => {
    it('should fetch from database when not in cache', async () => {
      const mockDbKey = {
        id: 'uuid-5678',
        keyPrefix: 'cached_key',
        hashedKey: 'hashed_cached_key',
        companyId: 2,
        name: 'Cached Key',
        permissions: ['admin'],
        rateLimit: 500,
        createdAt: new Date(),
        isActive: true,
        updateLastUsed: jest.fn(),
      };

      (ApiKey.findAll as jest.Mock).mockResolvedValue([mockDbKey]);

      const validated = await apiKeyService.validateApiKey('tlk_cached_key');

      expect(ApiKey.findAll).toHaveBeenCalledWith({
        where: expect.objectContaining({
          keyPrefix: expect.any(String),
          isActive: true,
          revokedAt: null,
        }),
      });

      expect(validated).not.toBeNull();
      expect(validated?.id).toBe('uuid-5678');
      expect(mockDbKey.updateLastUsed).toHaveBeenCalled();
    });

    it('should cache database results for subsequent requests', async () => {
      const mockDbKey = {
        id: 'uuid-9012',
        keyPrefix: 'perf_key',
        hashedKey: 'hashed_perf_key',
        companyId: 3,
        name: 'Performance Key',
        permissions: [],
        rateLimit: 1000,
        createdAt: new Date(),
        isActive: true,
        updateLastUsed: jest.fn(),
      };

      (ApiKey.findAll as jest.Mock).mockResolvedValue([mockDbKey]);

      // First call - should hit database
      const validated1 = await apiKeyService.validateApiKey('tlk_perf_key');
      expect(ApiKey.findAll).toHaveBeenCalledTimes(1);

      // Clear the mock but keep the cache
      (ApiKey.findAll as jest.Mock).mockClear();

      // Second call - should use cache
      const validated2 = await apiKeyService.validateApiKey('tlk_perf_key');
      expect(ApiKey.findAll).not.toHaveBeenCalled();

      expect(validated1?.id).toBe(validated2?.id);
    });
  });

  describe('Revocation with Persistence', () => {
    it('should revoke key in database and cache', async () => {
      const mockDbKey = {
        id: 'uuid-revoke',
        keyPrefix: 'revoke_key',
        hashedKey: 'hashed_revoke',
        companyId: 1,
        name: 'To Revoke',
        isActive: true,
        revoke: jest.fn(),
      };

      (ApiKey.findAll as jest.Mock).mockResolvedValue([mockDbKey]);

      const result = await apiKeyService.revokeApiKey('tlk_revoke_key');

      expect(mockDbKey.revoke).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle revocation when key not in database', async () => {
      (ApiKey.findAll as jest.Mock).mockResolvedValue([]);

      const result = await apiKeyService.revokeApiKey('tlk_nonexistent');

      expect(result).toBe(true); // Should still return true
    });
  });

  describe('Usage Tracking', () => {
    it('should record API usage in database', async () => {
      await apiKeyService.recordUsage(
        'uuid-usage',
        '/api/test',
        'GET',
        200,
        150,
        '127.0.0.1',
        'Test Agent'
      );

      expect(ApiKeyUsage.recordUsage).toHaveBeenCalledWith({
        apiKeyId: 'uuid-usage',
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTimeMs: 150,
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });
    });

    it('should not fail request if usage recording fails', async () => {
      (ApiKeyUsage.recordUsage as jest.Mock).mockRejectedValue(
        new Error('Usage tracking error')
      );

      // Should not throw
      await expect(
        apiKeyService.recordUsage(
          'uuid-fail',
          '/api/test',
          'POST',
          500,
          100
        )
      ).resolves.not.toThrow();
    });

    it('should retrieve usage statistics', async () => {
      const mockStats = [
        {
          endpoint: '/api/test',
          method: 'GET',
          statusCode: 200,
          count: 100,
          avgResponseTime: 120,
        },
      ];

      (ApiKeyUsage.getUsageStats as jest.Mock).mockResolvedValue(mockStats);

      const stats = await apiKeyService.getUsageStats('uuid-stats');

      expect(ApiKeyUsage.getUsageStats).toHaveBeenCalledWith(
        'uuid-stats',
        undefined,
        undefined
      );
      expect(stats).toEqual(mockStats);
    });
  });

  describe('Permission Updates', () => {
    it('should update permissions in database and cache', async () => {
      const apiKey = 'tlk_perm_update';
      
      // Generate and cache a key first
      const { apiKeyData } = await apiKeyService.generateApiKey(
        1,
        'Permission Test',
        ['read']
      );

      // Update permissions
      (ApiKey.update as jest.Mock).mockResolvedValue([1]);
      
      const result = await apiKeyService.updatePermissions(apiKey, [
        'read',
        'write',
        'admin',
      ]);

      expect(result).toBe(true);
    });
  });

  describe('Listing API Keys', () => {
    it('should list all keys for a company from database', async () => {
      const mockKeys = [
        {
          id: 'uuid-1',
          keyPrefix: 'key1',
          name: 'Key 1',
          companyId: 1,
          permissions: ['read'],
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'uuid-2',
          keyPrefix: 'key2',
          name: 'Key 2',
          companyId: 1,
          permissions: ['write'],
          isActive: true,
          createdAt: new Date(),
        },
      ];

      (ApiKey.findByCompany as jest.Mock).mockResolvedValue(mockKeys);

      const keys = await apiKeyService.listApiKeys(1);

      expect(ApiKey.findByCompany).toHaveBeenCalledWith(1);
      expect(keys).toHaveLength(2);
      expect(keys[0].name).toBe('Key 1');
      expect(keys[1].name).toBe('Key 2');
    });
  });

  describe('Expired Keys Cleanup', () => {
    it('should clean expired keys on validation attempt', async () => {
      const expiredKey = {
        id: 'uuid-expired',
        keyPrefix: 'expired',
        hashedKey: 'hashed_expired',
        companyId: 1,
        name: 'Expired Key',
        expiresAt: new Date(Date.now() - 1000), // Expired
        isActive: true,
        isExpired: () => true,
      };

      (ApiKey.findAll as jest.Mock).mockResolvedValue([expiredKey]);

      const validated = await apiKeyService.validateApiKey('tlk_expired');

      expect(validated).toBeNull();
    });
  });

  describe('Database Recovery', () => {
    it('should sync cache from database on initialization', async () => {
      const activeKeys = [
        {
          id: 'uuid-sync-1',
          keyPrefix: 'sync1',
          hashedKey: 'hash1',
          companyId: 1,
          name: 'Sync Key 1',
          permissions: [],
          rateLimit: 1000,
          createdAt: new Date(),
          isActive: true,
        },
        {
          id: 'uuid-sync-2',
          keyPrefix: 'sync2',
          hashedKey: 'hash2',
          companyId: 2,
          name: 'Sync Key 2',
          permissions: ['admin'],
          rateLimit: 500,
          createdAt: new Date(),
          isActive: true,
        },
      ];

      (ApiKey.findAll as jest.Mock).mockResolvedValue(activeKeys);

      // Simulate initialization
      await (apiKeyService as any).syncCacheFromDatabase();

      expect(ApiKey.findAll).toHaveBeenCalledWith({
        where: {
          isActive: true,
          revokedAt: null,
        },
      });
    });
  });
});