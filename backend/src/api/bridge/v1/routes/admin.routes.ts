import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

/**
 * Admin Management Routes
 * All routes require super admin authentication
 */

// Export API keys from cache
router.get(
  '/export-keys',
  authenticateJWT({ 
    required: true, 
    permissions: ['admin:export', 'super'] 
  }),
  adminController.exportApiKeys
);

// Import API keys to database
router.post(
  '/import-keys',
  authenticateJWT({ 
    required: true, 
    permissions: ['admin:import', 'super'] 
  }),
  adminController.importApiKeys
);

// Get system metrics
router.get(
  '/metrics',
  authenticateJWT({ 
    required: true, 
    permissions: ['admin:metrics', 'admin'] 
  }),
  adminController.getMetrics
);

// Clear API key cache
router.post(
  '/clear-cache',
  authenticateJWT({ 
    required: true, 
    permissions: ['admin:cache', 'super'] 
  }),
  adminController.clearCache
);

export default router;