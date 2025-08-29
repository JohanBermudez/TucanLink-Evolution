import { WhatsAppCacheService } from '../services/whatsapp-cache.service';
import ChannelConnection from '../../../../channels/models/ChannelConnection';
import Channel from '../../../../channels/models/Channel';

// Mock dependencies
jest.mock('../../../../channels/models/ChannelConnection');
jest.mock('../../../../channels/models/Channel');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('WhatsAppCacheService', () => {
  let cacheService: WhatsAppCacheService;
  
  beforeEach(() => {
    // Reset singleton for testing
    (WhatsAppCacheService as any).instance = undefined;
    cacheService = WhatsAppCacheService.getInstance();
    
    // Clear all caches before each test
    cacheService.clearAllCaches();
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear timers
    jest.clearAllTimers();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = WhatsAppCacheService.getInstance();
      const instance2 = WhatsAppCacheService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Template Caching', () => {
    const mockTemplates = [
      {
        id: 'template1',
        name: 'hello_world',
        category: 'MARKETING',
        status: 'APPROVED',
        language: 'en',
        components: [],
        lastUpdated: Date.now()
      },
      {
        id: 'template2', 
        name: 'welcome_message',
        category: 'UTILITY',
        status: 'APPROVED',
        language: 'es',
        components: [],
        lastUpdated: Date.now()
      }
    ];

    it('should cache templates successfully', async () => {
      // Mock the private fetchTemplatesFromAPI method
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue(mockTemplates);

      const businessAccountId = '123456789';
      const result = await cacheService.getTemplates(businessAccountId);

      expect(fetchSpy).toHaveBeenCalledWith(businessAccountId);
      expect(result).toEqual(mockTemplates);
    });

    it('should return cached templates on subsequent calls', async () => {
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue(mockTemplates);

      const businessAccountId = '123456789';
      
      // First call - should fetch from API
      await cacheService.getTemplates(businessAccountId);
      
      // Second call - should return from cache
      const result = await cacheService.getTemplates(businessAccountId);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTemplates);
    });

    it('should force refresh when requested', async () => {
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue(mockTemplates);

      const businessAccountId = '123456789';
      
      // First call
      await cacheService.getTemplates(businessAccountId);
      
      // Second call with force refresh
      await cacheService.getTemplates(businessAccountId, true);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should find template by name and language', async () => {
      jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue(mockTemplates);

      const businessAccountId = '123456789';
      await cacheService.getTemplates(businessAccountId);

      const result = await cacheService.findTemplate(businessAccountId, 'hello_world', 'en');

      expect(result).toEqual(mockTemplates[0]);
    });

    it('should return null when template not found', async () => {
      jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue(mockTemplates);

      const businessAccountId = '123456789';
      await cacheService.getTemplates(businessAccountId);

      const result = await cacheService.findTemplate(businessAccountId, 'nonexistent', 'en');

      expect(result).toBeNull();
    });

    it('should invalidate template cache', async () => {
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue(mockTemplates);

      const businessAccountId = '123456789';
      
      // Cache templates
      await cacheService.getTemplates(businessAccountId);
      
      // Invalidate cache
      cacheService.invalidateTemplateCache(businessAccountId);
      
      // Get templates again - should fetch from API
      await cacheService.getTemplates(businessAccountId);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Connection Caching', () => {
    const mockConnection = {
      id: 1,
      companyId: 1,
      configuration: {
        phoneNumberId: '123456789012345',
        accessToken: 'test-token',
        businessAccountId: '987654321'
      },
      capabilities: { text: true, media: true },
      rateLimit: { messagesPerSecond: 80 }
    };

    it('should cache connection successfully', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      const phoneNumberId = '123456789012345';
      const result = await cacheService.getConnection(phoneNumberId);

      expect(result).toEqual(expect.objectContaining({
        id: mockConnection.id,
        companyId: mockConnection.companyId,
        configuration: mockConnection.configuration,
        capabilities: mockConnection.capabilities,
        rateLimit: mockConnection.rateLimit
      }));
    });

    it('should return cached connection on subsequent calls', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      const phoneNumberId = '123456789012345';
      
      // First call
      await cacheService.getConnection(phoneNumberId);
      
      // Second call
      const result = await cacheService.getConnection(phoneNumberId);

      expect(ChannelConnection.findOne).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return null when connection not found', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(null);

      const phoneNumberId = '999999999999999';
      const result = await cacheService.getConnection(phoneNumberId);

      expect(result).toBeNull();
    });

    it('should invalidate connection cache', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      const phoneNumberId = '123456789012345';
      
      // Cache connection
      await cacheService.getConnection(phoneNumberId);
      
      // Invalidate cache
      cacheService.invalidateConnectionCache(phoneNumberId);
      
      // Get connection again
      await cacheService.getConnection(phoneNumberId);

      expect(ChannelConnection.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('Business Profile Caching', () => {
    const mockProfile = {
      id: '123456789',
      name: 'Test Business',
      description: 'Test Description',
      lastUpdated: Date.now()
    };

    it('should cache business profile successfully', async () => {
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchBusinessProfileFromAPI')
        .mockResolvedValue(mockProfile);

      const businessAccountId = '123456789';
      const result = await cacheService.getBusinessProfile(businessAccountId);

      expect(fetchSpy).toHaveBeenCalledWith(businessAccountId);
      expect(result).toEqual(mockProfile);
    });

    it('should return cached profile on subsequent calls', async () => {
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchBusinessProfileFromAPI')
        .mockResolvedValue(mockProfile);

      const businessAccountId = '123456789';
      
      // First call
      await cacheService.getBusinessProfile(businessAccountId);
      
      // Second call
      const result = await cacheService.getBusinessProfile(businessAccountId);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProfile);
    });

    it('should invalidate business profile cache', async () => {
      const fetchSpy = jest.spyOn(cacheService as any, 'fetchBusinessProfileFromAPI')
        .mockResolvedValue(mockProfile);

      const businessAccountId = '123456789';
      
      // Cache profile
      await cacheService.getBusinessProfile(businessAccountId);
      
      // Invalidate cache
      cacheService.invalidateBusinessProfileCache(businessAccountId);
      
      // Get profile again
      await cacheService.getBusinessProfile(businessAccountId);

      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Media URL Caching', () => {
    it('should cache media URL successfully', () => {
      const mediaId = 'media123';
      const url = 'https://example.com/media.jpg';

      cacheService.cacheMediaUrl(mediaId, url);
      const result = cacheService.getCachedMediaUrl(mediaId);

      expect(result).toBe(url);
    });

    it('should return null for non-existent media ID', () => {
      const result = cacheService.getCachedMediaUrl('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for expired media URL', () => {
      const mediaId = 'media123';
      const url = 'https://example.com/media.jpg';

      // Cache URL
      cacheService.cacheMediaUrl(mediaId, url);

      // Mock expired timestamp
      const mediaCache = (cacheService as any).mediaUrlCache;
      mediaCache.set(mediaId, {
        url,
        expires: Date.now() - 1000 // Already expired
      });

      const result = cacheService.getCachedMediaUrl(mediaId);

      expect(result).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', async () => {
      // Add some data to caches
      jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValue([]);
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue({
        id: 1,
        companyId: 1,
        configuration: {},
        capabilities: {},
        rateLimit: {}
      });

      await cacheService.getTemplates('business123');
      await cacheService.getConnection('phone123');
      cacheService.cacheMediaUrl('media123', 'url123');

      const stats = cacheService.getCacheStats();

      expect(stats).toEqual(expect.objectContaining({
        templates: expect.objectContaining({
          size: 1,
          keys: ['business123']
        }),
        connections: expect.objectContaining({
          size: 1,
          keys: ['phone123']
        }),
        mediaUrls: expect.objectContaining({
          size: 1,
          activeUrls: 1
        })
      }));
    });
  });

  describe('Cache Cleanup', () => {
    it('should clear all caches', () => {
      // Add some data
      cacheService.cacheMediaUrl('media123', 'url123');
      
      // Clear all caches
      cacheService.clearAllCaches();
      
      const stats = cacheService.getCacheStats();
      expect(stats.mediaUrls.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle template fetch errors gracefully', async () => {
      jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockRejectedValue(new Error('API Error'));

      const businessAccountId = '123456789';
      const result = await cacheService.getTemplates(businessAccountId);

      expect(result).toEqual([]);
    });

    it('should handle connection fetch errors gracefully', async () => {
      (ChannelConnection.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const phoneNumberId = '123456789012345';
      const result = await cacheService.getConnection(phoneNumberId);

      expect(result).toBeNull();
    });

    it('should return fallback data when API fails but cache exists', async () => {
      const mockTemplates = [{ 
        id: 'template1', 
        name: 'test', 
        category: 'UTILITY',
        status: 'APPROVED',
        language: 'en',
        components: [],
        lastUpdated: Date.now() 
      }];

      // First successful call to populate cache
      jest.spyOn(cacheService as any, 'fetchTemplatesFromAPI')
        .mockResolvedValueOnce(mockTemplates)
        .mockRejectedValueOnce(new Error('API Error'));

      const businessAccountId = '123456789';
      
      // Populate cache
      await cacheService.getTemplates(businessAccountId);
      
      // Invalidate to force refresh, but API will fail
      cacheService.invalidateTemplateCache(businessAccountId);
      
      const result = await cacheService.getTemplates(businessAccountId);

      expect(result).toEqual([]);
    });
  });
});