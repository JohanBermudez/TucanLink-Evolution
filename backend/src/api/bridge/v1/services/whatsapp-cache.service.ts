import { logger } from '../utils/logger';
import { WhatsAppCloudProvider } from '../../../../channels/providers/whatsapp/WhatsAppCloudProvider';
import ChannelConnection from '../../../../channels/models/ChannelConnection';
import Channel from '../../../../channels/models/Channel';
import { ChannelType } from '../../../../channels/models/Channel';

interface CachedTemplate {
  id: string;
  name: string;
  category: string;
  status: string;
  language: string;
  components: any[];
  lastUpdated: number;
}

interface CachedConnection {
  id: number;
  companyId: number;
  configuration: any;
  capabilities: any;
  rateLimit: any;
  lastUpdated: number;
}

interface CachedBusinessProfile {
  id: string;
  name: string;
  description?: string;
  profilePictureUrl?: string;
  websites?: string[];
  lastUpdated: number;
}

/**
 * WhatsApp Cache Service
 * Manages caching for templates, connections, and business profiles
 * to reduce API calls and improve performance
 */
export class WhatsAppCacheService {
  private static instance: WhatsAppCacheService;
  
  // Cache stores
  private templatesCache = new Map<string, CachedTemplate[]>();
  private connectionsCache = new Map<string, CachedConnection>();
  private businessProfilesCache = new Map<string, CachedBusinessProfile>();
  private mediaUrlCache = new Map<string, { url: string; expires: number }>();

  // Cache TTL (Time To Live) in milliseconds
  private readonly TEMPLATE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly CONNECTION_CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private readonly BUSINESS_PROFILE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MEDIA_URL_CACHE_TTL = 55 * 60 * 1000; // 55 minutes (WhatsApp media URLs expire in 1 hour)

  private constructor() {
    // Start cleanup interval
    this.startCacheCleanup();
  }

  public static getInstance(): WhatsAppCacheService {
    if (!WhatsAppCacheService.instance) {
      WhatsAppCacheService.instance = new WhatsAppCacheService();
    }
    return WhatsAppCacheService.instance;
  }

  /**
   * Get cached templates for a business account
   */
  async getTemplates(businessAccountId: string, forceRefresh = false): Promise<CachedTemplate[]> {
    try {
      const cacheKey = businessAccountId;
      const cached = this.templatesCache.get(cacheKey);

      // Check if cache is valid and not forcing refresh
      if (!forceRefresh && cached && this.isCacheValid(cached[0]?.lastUpdated, this.TEMPLATE_CACHE_TTL)) {
        logger.debug('Returning cached templates', { businessAccountId, count: cached.length });
        return cached;
      }

      // Fetch fresh templates from API
      const templates = await this.fetchTemplatesFromAPI(businessAccountId);
      
      // Cache the results
      this.templatesCache.set(cacheKey, templates);
      
      logger.info('Templates cached successfully', { 
        businessAccountId, 
        count: templates.length 
      });

      return templates;

    } catch (error) {
      logger.error('Error getting cached templates', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId
      });
      
      // Return cached data if available, even if stale
      const fallback = this.templatesCache.get(businessAccountId);
      return fallback || [];
    }
  }

  /**
   * Get cached connection configuration
   */
  async getConnection(phoneNumberId: string, forceRefresh = false): Promise<CachedConnection | null> {
    try {
      const cacheKey = phoneNumberId;
      const cached = this.connectionsCache.get(cacheKey);

      // Check if cache is valid and not forcing refresh
      if (!forceRefresh && cached && this.isCacheValid(cached.lastUpdated, this.CONNECTION_CACHE_TTL)) {
        logger.debug('Returning cached connection', { phoneNumberId });
        return cached;
      }

      // Fetch fresh connection from database
      const connection = await this.fetchConnectionFromDB(phoneNumberId);
      
      if (connection) {
        // Cache the connection
        const cachedConnection: CachedConnection = {
          id: connection.id,
          companyId: connection.companyId,
          configuration: connection.configuration,
          capabilities: connection.capabilities || {},
          rateLimit: connection.rateLimit || {},
          lastUpdated: Date.now()
        };

        this.connectionsCache.set(cacheKey, cachedConnection);
        
        logger.debug('Connection cached successfully', { phoneNumberId });
        return cachedConnection;
      }

      return null;

    } catch (error) {
      logger.error('Error getting cached connection', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumberId
      });
      
      // Return cached data if available, even if stale
      const fallback = this.connectionsCache.get(phoneNumberId);
      return fallback || null;
    }
  }

  /**
   * Get cached business profile
   */
  async getBusinessProfile(businessAccountId: string, forceRefresh = false): Promise<CachedBusinessProfile | null> {
    try {
      const cacheKey = businessAccountId;
      const cached = this.businessProfilesCache.get(cacheKey);

      // Check if cache is valid and not forcing refresh
      if (!forceRefresh && cached && this.isCacheValid(cached.lastUpdated, this.BUSINESS_PROFILE_CACHE_TTL)) {
        logger.debug('Returning cached business profile', { businessAccountId });
        return cached;
      }

      // Fetch fresh business profile from API
      const profile = await this.fetchBusinessProfileFromAPI(businessAccountId);
      
      if (profile) {
        // Cache the profile
        this.businessProfilesCache.set(cacheKey, profile);
        
        logger.debug('Business profile cached successfully', { businessAccountId });
        return profile;
      }

      return null;

    } catch (error) {
      logger.error('Error getting cached business profile', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId
      });
      
      // Return cached data if available, even if stale
      const fallback = this.businessProfilesCache.get(businessAccountId);
      return fallback || null;
    }
  }

  /**
   * Cache media URL with expiration
   */
  cacheMediaUrl(mediaId: string, url: string): void {
    this.mediaUrlCache.set(mediaId, {
      url,
      expires: Date.now() + this.MEDIA_URL_CACHE_TTL
    });
    
    logger.debug('Media URL cached', { mediaId });
  }

  /**
   * Get cached media URL
   */
  getCachedMediaUrl(mediaId: string): string | null {
    const cached = this.mediaUrlCache.get(mediaId);
    
    if (cached && cached.expires > Date.now()) {
      logger.debug('Returning cached media URL', { mediaId });
      return cached.url;
    }

    // Remove expired entry
    if (cached) {
      this.mediaUrlCache.delete(mediaId);
    }

    return null;
  }

  /**
   * Find template by name and language
   */
  async findTemplate(
    businessAccountId: string, 
    templateName: string, 
    language: string
  ): Promise<CachedTemplate | null> {
    const templates = await this.getTemplates(businessAccountId);
    
    return templates.find(template => 
      template.name === templateName && 
      template.language === language &&
      template.status === 'APPROVED'
    ) || null;
  }

  /**
   * Invalidate template cache for a business account
   */
  invalidateTemplateCache(businessAccountId: string): void {
    this.templatesCache.delete(businessAccountId);
    logger.debug('Template cache invalidated', { businessAccountId });
  }

  /**
   * Invalidate connection cache
   */
  invalidateConnectionCache(phoneNumberId: string): void {
    this.connectionsCache.delete(phoneNumberId);
    logger.debug('Connection cache invalidated', { phoneNumberId });
  }

  /**
   * Invalidate business profile cache
   */
  invalidateBusinessProfileCache(businessAccountId: string): void {
    this.businessProfilesCache.delete(businessAccountId);
    logger.debug('Business profile cache invalidated', { businessAccountId });
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.templatesCache.clear();
    this.connectionsCache.clear();
    this.businessProfilesCache.clear();
    this.mediaUrlCache.clear();
    
    logger.info('All caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): object {
    return {
      templates: {
        size: this.templatesCache.size,
        keys: Array.from(this.templatesCache.keys())
      },
      connections: {
        size: this.connectionsCache.size,
        keys: Array.from(this.connectionsCache.keys())
      },
      businessProfiles: {
        size: this.businessProfilesCache.size,
        keys: Array.from(this.businessProfilesCache.keys())
      },
      mediaUrls: {
        size: this.mediaUrlCache.size,
        activeUrls: Array.from(this.mediaUrlCache.values())
          .filter(item => item.expires > Date.now()).length
      }
    };
  }

  /**
   * Fetch templates from WhatsApp API
   */
  private async fetchTemplatesFromAPI(businessAccountId: string): Promise<CachedTemplate[]> {
    try {
      // This would use a WhatsApp provider instance
      // For now, we'll return a placeholder implementation
      // In a real implementation, you'd use the WhatsApp Graph API
      
      logger.info('Fetching templates from WhatsApp API', { businessAccountId });
      
      // Placeholder - replace with actual API call
      const templates: CachedTemplate[] = [];
      
      return templates.map(template => ({
        ...template,
        lastUpdated: Date.now()
      }));

    } catch (error) {
      logger.error('Error fetching templates from API', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId
      });
      throw error;
    }
  }

  /**
   * Fetch connection from database
   */
  private async fetchConnectionFromDB(phoneNumberId: string): Promise<any> {
    return await ChannelConnection.findOne({
      where: {
        configuration: {
          phoneNumberId: phoneNumberId
        }
      },
      include: [
        {
          model: Channel,
          as: 'channel',
          where: {
            type: ChannelType.WHATSAPP_CLOUD
          }
        }
      ]
    });
  }

  /**
   * Fetch business profile from WhatsApp API
   */
  private async fetchBusinessProfileFromAPI(businessAccountId: string): Promise<CachedBusinessProfile | null> {
    try {
      // This would use a WhatsApp provider instance
      // For now, we'll return a placeholder implementation
      
      logger.info('Fetching business profile from WhatsApp API', { businessAccountId });
      
      // Placeholder - replace with actual API call
      return {
        id: businessAccountId,
        name: 'Business Name',
        description: 'Business Description',
        lastUpdated: Date.now()
      };

    } catch (error) {
      logger.error('Error fetching business profile from API', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId
      });
      return null;
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(timestamp: number, ttl: number): boolean {
    return timestamp && (Date.now() - timestamp) < ttl;
  }

  /**
   * Start periodic cache cleanup
   */
  private startCacheCleanup(): void {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, CLEANUP_INTERVAL);
    
    logger.debug('Cache cleanup interval started');
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    let cleanedCount = 0;

    // Clean up templates
    for (const [key, templates] of this.templatesCache.entries()) {
      if (templates.length > 0 && !this.isCacheValid(templates[0].lastUpdated, this.TEMPLATE_CACHE_TTL)) {
        this.templatesCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean up connections
    for (const [key, connection] of this.connectionsCache.entries()) {
      if (!this.isCacheValid(connection.lastUpdated, this.CONNECTION_CACHE_TTL)) {
        this.connectionsCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean up business profiles
    for (const [key, profile] of this.businessProfilesCache.entries()) {
      if (!this.isCacheValid(profile.lastUpdated, this.BUSINESS_PROFILE_CACHE_TTL)) {
        this.businessProfilesCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean up expired media URLs
    const now = Date.now();
    for (const [key, item] of this.mediaUrlCache.entries()) {
      if (item.expires <= now) {
        this.mediaUrlCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cache cleanup completed', { cleanedEntries: cleanedCount });
    }
  }
}

// Export singleton instance
export default WhatsAppCacheService.getInstance();