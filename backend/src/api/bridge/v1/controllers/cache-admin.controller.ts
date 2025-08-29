import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import WhatsAppCacheService from '../services/whatsapp-cache.service';

/**
 * Cache Administration Controller
 * Provides endpoints for managing WhatsApp cache system
 */
export class CacheAdminController {

  /**
   * GET /api/cache/stats
   * Get cache statistics
   */
  static async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = WhatsAppCacheService.getCacheStats();
      
      res.json({
        success: true,
        data: {
          ...stats,
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Cache stats retrieved');

    } catch (error) {
      logger.error('Error getting cache stats', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/cache/templates/:businessAccountId/refresh
   * Force refresh templates cache for business account
   */
  static async refreshTemplatesCache(req: Request, res: Response): Promise<void> {
    try {
      const { businessAccountId } = req.params;

      if (!businessAccountId) {
        res.status(400).json({
          success: false,
          error: 'Business account ID is required'
        });
        return;
      }

      // Force refresh templates
      const templates = await WhatsAppCacheService.getTemplates(businessAccountId, true);

      res.json({
        success: true,
        data: {
          businessAccountId,
          templatesCount: templates.length,
          refreshedAt: new Date().toISOString()
        }
      });

      logger.info('Templates cache refreshed', {
        businessAccountId,
        templatesCount: templates.length
      });

    } catch (error) {
      logger.error('Error refreshing templates cache', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId: req.params.businessAccountId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * POST /api/cache/connections/:phoneNumberId/refresh
   * Force refresh connection cache
   */
  static async refreshConnectionCache(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumberId } = req.params;

      if (!phoneNumberId) {
        res.status(400).json({
          success: false,
          error: 'Phone number ID is required'
        });
        return;
      }

      // Force refresh connection
      const connection = await WhatsAppCacheService.getConnection(phoneNumberId, true);

      res.json({
        success: true,
        data: {
          phoneNumberId,
          connectionFound: !!connection,
          refreshedAt: new Date().toISOString()
        }
      });

      logger.info('Connection cache refreshed', {
        phoneNumberId,
        connectionFound: !!connection
      });

    } catch (error) {
      logger.error('Error refreshing connection cache', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumberId: req.params.phoneNumberId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/cache/templates/:businessAccountId
   * Invalidate templates cache for business account
   */
  static async invalidateTemplatesCache(req: Request, res: Response): Promise<void> {
    try {
      const { businessAccountId } = req.params;

      if (!businessAccountId) {
        res.status(400).json({
          success: false,
          error: 'Business account ID is required'
        });
        return;
      }

      WhatsAppCacheService.invalidateTemplateCache(businessAccountId);

      res.json({
        success: true,
        data: {
          businessAccountId,
          invalidatedAt: new Date().toISOString()
        }
      });

      logger.info('Templates cache invalidated', { businessAccountId });

    } catch (error) {
      logger.error('Error invalidating templates cache', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId: req.params.businessAccountId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/cache/connections/:phoneNumberId
   * Invalidate connection cache
   */
  static async invalidateConnectionCache(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumberId } = req.params;

      if (!phoneNumberId) {
        res.status(400).json({
          success: false,
          error: 'Phone number ID is required'
        });
        return;
      }

      WhatsAppCacheService.invalidateConnectionCache(phoneNumberId);

      res.json({
        success: true,
        data: {
          phoneNumberId,
          invalidatedAt: new Date().toISOString()
        }
      });

      logger.info('Connection cache invalidated', { phoneNumberId });

    } catch (error) {
      logger.error('Error invalidating connection cache', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumberId: req.params.phoneNumberId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/cache/business-profiles/:businessAccountId
   * Invalidate business profile cache
   */
  static async invalidateBusinessProfileCache(req: Request, res: Response): Promise<void> {
    try {
      const { businessAccountId } = req.params;

      if (!businessAccountId) {
        res.status(400).json({
          success: false,
          error: 'Business account ID is required'
        });
        return;
      }

      WhatsAppCacheService.invalidateBusinessProfileCache(businessAccountId);

      res.json({
        success: true,
        data: {
          businessAccountId,
          invalidatedAt: new Date().toISOString()
        }
      });

      logger.info('Business profile cache invalidated', { businessAccountId });

    } catch (error) {
      logger.error('Error invalidating business profile cache', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId: req.params.businessAccountId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * DELETE /api/cache/all
   * Clear all caches
   */
  static async clearAllCaches(req: Request, res: Response): Promise<void> {
    try {
      WhatsAppCacheService.clearAllCaches();

      res.json({
        success: true,
        data: {
          clearedAt: new Date().toISOString()
        }
      });

      logger.warn('All caches cleared');

    } catch (error) {
      logger.error('Error clearing all caches', {
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/cache/templates/:businessAccountId
   * Get cached templates for business account
   */
  static async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { businessAccountId } = req.params;
      const { refresh } = req.query;

      if (!businessAccountId) {
        res.status(400).json({
          success: false,
          error: 'Business account ID is required'
        });
        return;
      }

      const templates = await WhatsAppCacheService.getTemplates(
        businessAccountId,
        refresh === 'true'
      );

      res.json({
        success: true,
        data: {
          businessAccountId,
          templates,
          count: templates.length
        }
      });

    } catch (error) {
      logger.error('Error getting templates', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId: req.params.businessAccountId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/cache/templates/:businessAccountId/:templateName
   * Find specific template by name and language
   */
  static async findTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { businessAccountId, templateName } = req.params;
      const { language } = req.query;

      if (!businessAccountId || !templateName) {
        res.status(400).json({
          success: false,
          error: 'Business account ID and template name are required'
        });
        return;
      }

      const template = await WhatsAppCacheService.findTemplate(
        businessAccountId,
        templateName,
        (language as string) || 'en'
      );

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          template
        }
      });

    } catch (error) {
      logger.error('Error finding template', {
        error: error instanceof Error ? error.message : String(error),
        businessAccountId: req.params.businessAccountId,
        templateName: req.params.templateName
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/cache/media/:mediaId
   * Get cached media URL
   */
  static async getCachedMediaUrl(req: Request, res: Response): Promise<void> {
    try {
      const { mediaId } = req.params;

      if (!mediaId) {
        res.status(400).json({
          success: false,
          error: 'Media ID is required'
        });
        return;
      }

      const url = WhatsAppCacheService.getCachedMediaUrl(mediaId);

      if (!url) {
        res.status(404).json({
          success: false,
          error: 'Media URL not found in cache'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          mediaId,
          url
        }
      });

    } catch (error) {
      logger.error('Error getting cached media URL', {
        error: error instanceof Error ? error.message : String(error),
        mediaId: req.params.mediaId
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default CacheAdminController;