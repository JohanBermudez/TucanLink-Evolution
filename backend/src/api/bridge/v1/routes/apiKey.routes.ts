import { Router } from 'express';
import { apiKeyController } from '../controllers/apiKey.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

/**
 * API Key Management Routes
 * All routes require JWT authentication and admin permissions
 */

// Create new API key
router.post(
  '/',
  authenticateJWT({ 
    required: true, 
    permissions: ['api-keys:create', 'admin'] 
  }),
  apiKeyController.create
);

// List all API keys for company
router.get(
  '/',
  authenticateJWT({ 
    required: true, 
    permissions: ['api-keys:read', 'admin'] 
  }),
  apiKeyController.list
);

// Revoke API key
router.delete(
  '/:keyId',
  authenticateJWT({ 
    required: true, 
    permissions: ['api-keys:delete', 'admin'] 
  }),
  apiKeyController.revoke
);

// Update API key permissions
router.put(
  '/:keyId/permissions',
  authenticateJWT({ 
    required: true, 
    permissions: ['api-keys:update', 'admin'] 
  }),
  apiKeyController.updatePermissions
);

// Get API key usage statistics
router.get(
  '/:keyId/usage',
  authenticateJWT({ 
    required: true, 
    permissions: ['api-keys:read', 'admin'] 
  }),
  apiKeyController.getUsage
);

// Get rate limit status
router.get(
  '/:keyId/rate-limit',
  authenticateJWT({ 
    required: true, 
    permissions: ['api-keys:read', 'admin'] 
  }),
  apiKeyController.getRateLimit
);

export default router;