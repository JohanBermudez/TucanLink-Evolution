import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(1).required(),
  }),
});

const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }),
});

const oauth2Schema = Joi.object({
  body: Joi.object({
    grant_type: Joi.string().valid('password').required(),
    username: Joi.string().email().required(),
    password: Joi.string().min(1).required(),
  }),
});

/**
 * @route   POST /api/bridge/v1/auth/core/login
 * @desc    Login to Core Service and obtain JWT token
 * @access  Public
 */
router.post(
  '/core/login',
  validateRequest(loginSchema),
  authController.loginToCore.bind(authController)
);

/**
 * @route   POST /api/bridge/v1/auth/core/refresh
 * @desc    Refresh JWT token
 * @access  Public
 */
router.post(
  '/core/refresh',
  validateRequest(refreshSchema),
  authController.refreshToken.bind(authController)
);

/**
 * @route   POST /api/bridge/v1/auth/core/oauth2/token
 * @desc    OAuth2 token endpoint for Swagger UI
 * @access  Public
 */
router.post(
  '/core/oauth2/token',
  validateRequest(oauth2Schema),
  authController.oauth2Token.bind(authController)
);

export default router;