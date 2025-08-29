import { Router } from 'express';
import CacheAdminController from '../controllers/cache-admin.controller';

const router = Router();

/**
 * Cache Administration Routes
 * Provides endpoints for managing WhatsApp cache system
 */

// GET /api/cache/stats - Get cache statistics
router.get('/stats', CacheAdminController.getCacheStats);

// Template cache management
router.get('/templates/:businessAccountId', CacheAdminController.getTemplates);
router.get('/templates/:businessAccountId/:templateName', CacheAdminController.findTemplate);
router.post('/templates/:businessAccountId/refresh', CacheAdminController.refreshTemplatesCache);
router.delete('/templates/:businessAccountId', CacheAdminController.invalidateTemplatesCache);

// Connection cache management
router.post('/connections/:phoneNumberId/refresh', CacheAdminController.refreshConnectionCache);
router.delete('/connections/:phoneNumberId', CacheAdminController.invalidateConnectionCache);

// Business profile cache management
router.delete('/business-profiles/:businessAccountId', CacheAdminController.invalidateBusinessProfileCache);

// Media URL cache management
router.get('/media/:mediaId', CacheAdminController.getCachedMediaUrl);

// Clear all caches
router.delete('/all', CacheAdminController.clearAllCaches);

export default router;