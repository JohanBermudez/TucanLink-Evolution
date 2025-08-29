import { Request, Response } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Authentication Controller for API Bridge
 * Proxies authentication requests to the Core Service
 */
export class AuthController {
  private coreUrl: string;

  constructor() {
    this.coreUrl = process.env.CORE_SERVICE_URL || 'http://localhost:8080';
  }

  /**
   * Login to Core Service and obtain JWT token
   * POST /api/bridge/v1/auth/core/login
   */
  async loginToCore(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      logger.info('Core Service login attempt', { email });

      // Proxy login request to Core Service
      const coreResponse = await axios.post(
        `${this.coreUrl}/auth/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const { token, user } = coreResponse.data;

      logger.info('Core Service login successful', { 
        userId: user.id, 
        email: user.email,
        companyId: user.companyId 
      });

      // Enhanced response with Core Service endpoints information
      res.json({
        success: true,
        token,
        user,
        message: 'Login successful. Use this token for Core Service endpoints.',
        coreServiceEndpoints: {
          whatsappStart: 'POST /whatsapp/{id}/start',
          whatsappRestart: 'POST /whatsapp/{id}/restart',
          whatsappDisconnect: 'POST /whatsapp/{id}/disconnect',
          whatsappQr: 'GET /whatsapp/{id}/qr'
        },
        usage: {
          baseUrl: this.coreUrl,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          example: `curl -X POST "${this.coreUrl}/whatsapp/1/start" -H "Authorization: Bearer ${token}"`
        }
      });
    } catch (error: any) {
      logger.error('Core Service login failed', {
        error: error.message,
        email: req.body.email,
      });

      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'Core service is not available. Please ensure it\'s running on port 8080.',
          hint: 'Start Core service with: npm run dev'
        });
      } else if (error.response) {
        // Core service responded with an error
        const status = error.response.status;
        const data = error.response.data;

        res.status(status).json({
          error: data.error || 'Authentication Failed',
          message: data.message || 'Invalid credentials'
        });
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to authenticate with Core service'
        });
      }
    }
  }

  /**
   * Refresh JWT token
   * POST /api/bridge/v1/auth/core/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      logger.info('Token refresh attempt');

      // Proxy refresh request to Core Service
      const coreResponse = await axios.post(
        `${this.coreUrl}/auth/refresh`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      logger.info('Token refresh successful');

      res.json({
        success: true,
        ...coreResponse.data
      });
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });

      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'Core service is not available'
        });
      } else if (error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to refresh token'
        });
      }
    }
  }

  /**
   * OAuth2 Token Endpoint for Swagger UI
   * POST /api/bridge/v1/auth/core/oauth2/token
   */
  async oauth2Token(req: Request, res: Response): Promise<void> {
    try {
      const { username, password, grant_type } = req.body;

      if (grant_type !== 'password') {
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only password grant type is supported'
        });
        return;
      }

      logger.info('OAuth2 token request', { username });

      // Use the same login logic but return OAuth2 format
      const coreResponse = await axios.post(
        `${this.coreUrl}/auth/login`,
        { email: username, password },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const { token, user } = coreResponse.data;

      logger.info('OAuth2 token successful', { 
        userId: user.id, 
        email: user.email,
        companyId: user.companyId 
      });

      // Return OAuth2 standard format
      res.json({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 86400, // 24 hours in seconds
        scope: user.profile === 'admin' ? 'admin user' : 'user'
      });
    } catch (error: any) {
      logger.error('OAuth2 token failed', {
        error: error.message,
        username: req.body.username,
      });

      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'service_unavailable',
          error_description: 'Core service is not available'
        });
      } else if (error.response?.status === 401) {
        res.status(401).json({
          error: 'invalid_grant',
          error_description: 'Invalid username or password'
        });
      } else {
        res.status(500).json({
          error: 'server_error',
          error_description: 'Failed to authenticate with Core service'
        });
      }
    }
  }

}

export const authController = new AuthController();