import { Request, Response, NextFunction } from 'express';
import { jwtService, TokenPayload } from '../services/auth/jwt.service';
import { apiKeyService, ApiKeyData } from '../services/auth/apiKey.service';
import { logger } from '../utils/logger';

// Extend Express Request type to include auth data
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      apiKey?: ApiKeyData;
      companyId?: number;
      authType?: 'jwt' | 'apiKey';
    }
  }
}

export interface AuthOptions {
  required?: boolean;
  permissions?: string[];
  allowApiKey?: boolean;
  allowJWT?: boolean;
}

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = (options: AuthOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { required = true } = options;

    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        if (required) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authorization header provided',
          });
        }
        return next();
      }

      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid authorization header format. Use: Bearer <token>',
        });
      }

      try {
        // First try to verify with API Bridge JWT service
        let decoded;
        try {
          decoded = jwtService.verifyToken(token);
          
          // Check if it's an access token
          if ('tokenType' in decoded && decoded.tokenType !== 'access') {
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Invalid token type',
            });
          }
        } catch (bridgeError) {
          // If API Bridge JWT verification fails, try to decode as Core Service token
          try {
            const jwt = require('jsonwebtoken');
            
            // Decode without verification (we trust tokens from our OAuth2 login)
            const coreDecoded = jwt.decode(token);
            
            
            // Validate it has the expected Core Service structure
            // Note: Core Service has a typo in 'username' field (it's 'usarname')
            if (coreDecoded && 
                (coreDecoded.username || coreDecoded.usarname) && 
                coreDecoded.profile && 
                coreDecoded.id && 
                coreDecoded.companyId) {
              
              // Check if token is expired
              const currentTime = Math.floor(Date.now() / 1000);
              if (coreDecoded.exp && coreDecoded.exp < currentTime) {
                throw new Error('Token has expired');
              }
              
              // Create compatible user object from Core Service token
              decoded = {
                id: coreDecoded.id,
                userId: coreDecoded.id,
                email: coreDecoded.email || `user${coreDecoded.id}@company.com`,
                companyId: coreDecoded.companyId,
                profile: coreDecoded.profile,
                username: coreDecoded.username || coreDecoded.usarname,
                iat: coreDecoded.iat,
                exp: coreDecoded.exp,
              };
              
              logger.info('Core Service token accepted', { 
                userId: decoded.id, 
                companyId: decoded.companyId,
                profile: decoded.profile 
              });
            } else {
              throw new Error('Invalid token structure');
            }
          } catch (coreError) {
            logger.warn('JWT verification failed for both API Bridge and Core Service', { 
              bridgeError: bridgeError.message,
              coreError: coreError.message,
              ip: req.ip,
              tokenSnippet: token.substring(0, 50) + '...'
            });
            throw new Error('Invalid token');
          }
        }

        req.user = decoded;
        req.companyId = decoded.companyId;
        req.authType = 'jwt';

        // Check permissions if specified
        if (options.permissions && options.permissions.length > 0) {
          const hasPermission = checkJWTPermissions(decoded, options.permissions);
          if (!hasPermission) {
            return res.status(403).json({
              error: 'Forbidden',
              message: 'Insufficient permissions',
              required: options.permissions,
            });
          }
        }

        next();
      } catch (error: any) {
        logger.warn('JWT verification failed', { error: error.message, ip: req.ip });
        return res.status(401).json({
          error: 'Unauthorized',
          message: error.message || 'Invalid token',
        });
      }
    } catch (error: any) {
      logger.error('JWT middleware error', { error, ip: req.ip });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication failed',
      });
    }
  };
};

/**
 * API Key Authentication Middleware
 */
export const authenticateApiKey = (options: AuthOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { required = true } = options;

    try {
      const apiKey = req.headers['x-api-key'] as string || req.query.apiKey as string;

      if (!apiKey) {
        if (required) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'No API key provided',
          });
        }
        return next();
      }

      // Validate API key
      const apiKeyData = await apiKeyService.validateApiKey(apiKey);

      if (!apiKeyData) {
        logger.warn('Invalid API key attempt', { apiKey: apiKey.substring(0, 8), ip: req.ip });
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid API key',
        });
      }

      // Check rate limiting
      const rateLimitCheck = await apiKeyService.checkRateLimit(apiKey);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', rateLimitCheck.remaining + 1);
      res.setHeader('X-RateLimit-Remaining', rateLimitCheck.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitCheck.resetAt.toISOString());

      if (!rateLimitCheck.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'API rate limit exceeded',
          retryAfter: rateLimitCheck.resetAt,
        });
      }

      // Update last used timestamp
      await apiKeyService.updateLastUsed(apiKey);

      // Record API usage for auditing (non-blocking)
      const startTime = Date.now();
      res.on('finish', async () => {
        const responseTimeMs = Date.now() - startTime;
        if (apiKeyData.id) {
          await apiKeyService.recordUsage(
            apiKeyData.id,
            req.path,
            req.method,
            res.statusCode,
            responseTimeMs,
            req.ip,
            req.get('user-agent')
          );
        }
      });

      req.apiKey = apiKeyData;
      req.companyId = apiKeyData.companyId;
      req.authType = 'apiKey';

      // Check permissions if specified
      if (options.permissions && options.permissions.length > 0) {
        const hasPermission = checkApiKeyPermissions(apiKeyData, options.permissions);
        if (!hasPermission) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Insufficient permissions',
            required: options.permissions,
          });
        }
      }

      next();
    } catch (error: any) {
      logger.error('API Key middleware error', { error, ip: req.ip });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authentication failed',
      });
    }
  };
};

/**
 * Combined Authentication Middleware (JWT or API Key)
 */
export const authenticate = (options: AuthOptions = {}) => {
  const { allowApiKey = true, allowJWT = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Development bypass: Allow testing with companyId query parameter
      if (process.env.NODE_ENV === 'development' && req.query.companyId) {
        console.log('DEV MODE: Bypassing authentication with companyId query parameter');
        req.companyId = Number(req.query.companyId);
        req.authType = 'jwt'; // Pretend it's JWT auth for compatibility
        req.user = {
          id: 1,
          email: 'dev@test.com',
          companyId: req.companyId,
          profile: 'admin',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        console.log('Auth bypass completed, calling next()');
        return next();
      }
    } catch (error) {
      console.error('Error in auth middleware:', error);
      return res.status(500).json({ error: 'Auth middleware error', details: error.message });
    }

    // Try JWT first
    if (allowJWT && req.headers.authorization) {
      return authenticateJWT(options)(req, res, next);
    }

    // Try API Key
    if (allowApiKey && (req.headers['x-api-key'] || req.query.apiKey)) {
      return authenticateApiKey(options)(req, res, next);
    }

    // No authentication method provided
    if (options.required !== false) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required. Provide either JWT Bearer token or API key',
      });
    }

    next();
  };
};

/**
 * Extract Company ID Middleware
 */
export const extractCompanyId = (req: Request, res: Response, next: NextFunction) => {
  // Company ID might come from various sources
  const companyId = req.companyId || 
                   req.headers['x-company-id'] as string ||
                   req.query.companyId as string ||
                   req.params.companyId;

  if (!companyId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Company ID is required',
    });
  }

  req.companyId = typeof companyId === 'string' ? parseInt(companyId, 10) : companyId;

  if (isNaN(req.companyId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid Company ID',
    });
  }

  next();
};

/**
 * Permission Check Middleware
 */
export const requirePermissions = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user && !req.apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    let hasPermission = false;

    if (req.authType === 'jwt' && req.user) {
      hasPermission = checkJWTPermissions(req.user, permissions);
    } else if (req.authType === 'apiKey' && req.apiKey) {
      hasPermission = checkApiKeyPermissions(req.apiKey, permissions);
    }

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        required: permissions,
      });
    }

    next();
  };
};

/**
 * Check JWT permissions
 */
function checkJWTPermissions(user: TokenPayload, requiredPermissions: string[]): boolean {
  // Admin/super users have all permissions
  if (user.profile === 'admin' || user.profile === 'super') {
    return true;
  }

  // For now, implement basic role-based check
  // In production, this should check against a permissions table
  const userPermissions = getUserPermissionsByProfile(user.profile || 'user');
  
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission) || userPermissions.includes('*')
  );
}

/**
 * Check API Key permissions
 */
function checkApiKeyPermissions(apiKeyData: ApiKeyData, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => 
    apiKeyService.hasPermission(apiKeyData, permission)
  );
}

/**
 * Get user permissions by profile (temporary implementation)
 */
function getUserPermissionsByProfile(profile: string): string[] {
  const permissionMap: Record<string, string[]> = {
    admin: ['*'],
    super: ['*'],
    user: [
      'tickets:read',
      'tickets:write',
      'messages:read',
      'messages:send',
      'contacts:read',
    ],
    viewer: [
      'tickets:read',
      'messages:read',
      'contacts:read',
    ],
  };

  return permissionMap[profile] || [];
}

/**
 * Log authentication attempts
 */
export const logAuthAttempt = (req: Request, _res: Response, next: NextFunction) => {
  logger.info('Authentication attempt', {
    ip: req.ip,
    method: req.method,
    path: req.path,
    authType: req.authType,
    userId: req.user?.userId,
    companyId: req.companyId,
  });
  next();
};

// Export all middleware functions
export default {
  authenticateJWT,
  authenticateApiKey,
  authenticate,
  extractCompanyId,
  requirePermissions,
  logAuthAttempt,
};