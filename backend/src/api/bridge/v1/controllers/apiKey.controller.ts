import { Request, Response } from 'express';
import { apiKeyService } from '../services/auth/apiKey.service';
import { logger } from '../utils/logger';

/**
 * Controller for API Key management
 */
export class ApiKeyController {
  /**
   * Create a new API key
   * POST /api/bridge/v1/api-keys
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, permissions, expiresInDays } = req.body;
      const companyId = req.companyId!;
      const createdBy = req.user?.id;

      // Validate input
      if (!name || typeof name !== 'string') {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Name is required',
        });
        return;
      }

      // Generate API key
      const { apiKey, apiKeyData } = await apiKeyService.generateApiKey(
        companyId,
        name,
        permissions || [],
        expiresInDays,
        createdBy
      );

      res.status(201).json({
        success: true,
        data: {
          apiKey, // Only returned on creation
          id: apiKeyData.id,
          name: apiKeyData.name,
          permissions: apiKeyData.permissions,
          expiresAt: apiKeyData.expiresAt,
          createdAt: apiKeyData.createdAt,
        },
        message: 'API key created successfully. Please save the key securely as it cannot be retrieved again.',
      });
    } catch (error) {
      logger.error('Failed to create API key', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create API key',
      });
    }
  }

  /**
   * List API keys for a company
   * GET /api/bridge/v1/api-keys
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const apiKeys = await apiKeyService.listApiKeys(companyId);

      res.json({
        success: true,
        data: apiKeys.map(key => ({
          id: key.id,
          name: key.name,
          permissions: key.permissions,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive,
          createdAt: key.createdAt,
        })),
      });
    } catch (error) {
      logger.error('Failed to list API keys', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list API keys',
      });
    }
  }

  /**
   * Revoke an API key
   * DELETE /api/bridge/v1/api-keys/:keyId
   */
  async revoke(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;

      // For security, require full key for revocation
      const success = await apiKeyService.revokeApiKey(keyId);

      if (!success) {
        res.status(404).json({
          error: 'Not Found',
          message: 'API key not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'API key revoked successfully',
      });
    } catch (error) {
      logger.error('Failed to revoke API key', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to revoke API key',
      });
    }
  }

  /**
   * Update API key permissions
   * PUT /api/bridge/v1/api-keys/:keyId/permissions
   */
  async updatePermissions(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Permissions must be an array',
        });
        return;
      }

      const success = await apiKeyService.updatePermissions(keyId, permissions);

      if (!success) {
        res.status(404).json({
          error: 'Not Found',
          message: 'API key not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Permissions updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update API key permissions', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update permissions',
      });
    }
  }

  /**
   * Get API key usage statistics
   * GET /api/bridge/v1/api-keys/:keyId/usage
   */
  async getUsage(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const usage = await apiKeyService.getUsageStats(keyId, start, end);

      res.json({
        success: true,
        data: usage || {
          message: 'No usage data available',
        },
      });
    } catch (error) {
      logger.error('Failed to get API key usage', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get usage statistics',
      });
    }
  }

  /**
   * Get current rate limit status for an API key
   * GET /api/bridge/v1/api-keys/:keyId/rate-limit
   */
  async getRateLimit(req: Request, res: Response): Promise<void> {
    try {
      const { keyId } = req.params;
      const metrics = apiKeyService.getApiKeyMetrics(keyId);

      if (!metrics) {
        res.status(404).json({
          error: 'Not Found',
          message: 'No rate limit data available',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          requestCount: metrics.requestCount,
          remaining: metrics.rateLimitRemaining,
          resetAt: metrics.rateLimitResetAt,
          lastRequestAt: metrics.lastRequestAt,
        },
      });
    } catch (error) {
      logger.error('Failed to get rate limit status', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get rate limit status',
      });
    }
  }
}

export const apiKeyController = new ApiKeyController();