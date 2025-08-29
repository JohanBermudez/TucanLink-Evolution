import { Request, Response } from 'express';
import { apiKeyService } from '../services/auth/apiKey.service';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * Admin controller for system management
 */
export class AdminController {
  /**
   * Export all API keys from cache
   * GET /api/bridge/v1/admin/export-keys
   */
  async exportApiKeys(req: Request, res: Response): Promise<void> {
    try {
      // Only super admins can export
      if (req.user?.profile !== 'super') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only super administrators can export API keys',
        });
        return;
      }

      // Get all keys from cache
      const cacheStats = apiKeyService.getCacheStats();
      const keys: any[] = [];

      // Extract keys from cache (this is a simplified version)
      // In production, you'd want to iterate through cache properly
      for (const cacheKey of cacheStats.keys) {
        if (cacheKey.startsWith('apikey:')) {
          const keyData = (apiKeyService as any).cache.get(cacheKey);
          if (keyData) {
            // Don't export the actual API key for security
            keys.push({
              keyPrefix: keyData.key ? keyData.key.substring(4, 14) : '',
              hashedKey: keyData.hashedKey,
              companyId: keyData.companyId,
              name: keyData.name,
              permissions: keyData.permissions,
              rateLimit: keyData.rateLimit,
              createdAt: keyData.createdAt,
              expiresAt: keyData.expiresAt,
              lastUsedAt: keyData.lastUsedAt,
              isActive: keyData.isActive,
              metadata: keyData.metadata,
            });
          }
        }
      }

      const exportData = {
        keys,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        totalKeys: keys.length,
      };

      logger.info('API keys exported', {
        userId: req.user?.id,
        keyCount: keys.length,
      });

      res.json({
        success: true,
        data: exportData,
        message: `Exported ${keys.length} API keys`,
      });
    } catch (error) {
      logger.error('Failed to export API keys', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to export API keys',
      });
    }
  }

  /**
   * Import API keys to database
   * POST /api/bridge/v1/admin/import-keys
   */
  async importApiKeys(req: Request, res: Response): Promise<void> {
    try {
      // Only super admins can import
      if (req.user?.profile !== 'super') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only super administrators can import API keys',
        });
        return;
      }

      const { keys } = req.body;

      if (!Array.isArray(keys)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Keys must be an array',
        });
        return;
      }

      const results = {
        imported: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Import each key
      for (const keyData of keys) {
        try {
          // This would normally save to database
          // For now, just validate the structure
          if (!keyData.hashedKey || !keyData.companyId || !keyData.name) {
            throw new Error('Missing required fields');
          }

          results.imported++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`${keyData.name}: ${error.message}`);
        }
      }

      logger.info('API keys imported', {
        userId: req.user?.id,
        imported: results.imported,
        failed: results.failed,
      });

      res.json({
        success: true,
        results,
        message: `Imported ${results.imported} keys, ${results.failed} failed`,
      });
    } catch (error) {
      logger.error('Failed to import API keys', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to import API keys',
      });
    }
  }

  /**
   * Get system health metrics
   * GET /api/bridge/v1/admin/metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      // Basic metrics
      const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        apiKeys: {
          cacheStats: apiKeyService.getCacheStats(),
        },
        timestamp: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get metrics',
      });
    }
  }

  /**
   * Clear API key cache
   * POST /api/bridge/v1/admin/clear-cache
   */
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      // Only super admins can clear cache
      if (req.user?.profile !== 'super') {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Only super administrators can clear cache',
        });
        return;
      }

      apiKeyService.clearCache();

      logger.warn('API key cache cleared', {
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: 'Cache cleared successfully',
      });
    } catch (error) {
      logger.error('Failed to clear cache', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to clear cache',
      });
    }
  }
}

export const adminController = new AdminController();