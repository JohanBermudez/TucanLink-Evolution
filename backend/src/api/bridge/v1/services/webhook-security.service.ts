import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface WebhookSecurityConfig {
  appSecret: string;
  verifyToken: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * WhatsApp Webhook Security Service
 * Handles HMAC-SHA256 signature verification and webhook validation
 */
export class WebhookSecurityService {
  private static readonly SIGNATURE_HEADER = 'x-hub-signature-256';
  private static readonly SIGNATURE_PREFIX = 'sha256=';

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  static verifySignature(
    payload: string,
    signature: string | undefined,
    appSecret: string
  ): WebhookVerificationResult {
    try {
      if (!signature) {
        logger.warn('Missing webhook signature header');
        return {
          isValid: false,
          error: 'Missing signature header'
        };
      }

      if (!signature.startsWith(this.SIGNATURE_PREFIX)) {
        logger.warn('Invalid signature format', { signature: signature.substring(0, 20) });
        return {
          isValid: false,
          error: 'Invalid signature format'
        };
      }

      // Extract the signature hash
      const providedHash = signature.substring(this.SIGNATURE_PREFIX.length);
      
      // Generate expected signature
      const expectedHash = crypto
        .createHmac('sha256', appSecret)
        .update(payload, 'utf8')
        .digest('hex');

      // Use timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(providedHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isValid) {
        logger.warn('Webhook signature verification failed', {
          provided: providedHash.substring(0, 8),
          expected: expectedHash.substring(0, 8)
        });
        return {
          isValid: false,
          error: 'Signature verification failed'
        };
      }

      logger.debug('Webhook signature verified successfully');
      return { isValid: true };

    } catch (error) {
      logger.error('Error during signature verification', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isValid: false,
        error: 'Signature verification error'
      };
    }
  }

  /**
   * Verify webhook challenge for subscription
   */
  static verifyChallenge(
    mode: string | undefined,
    verifyToken: string | undefined,
    challenge: string | undefined,
    expectedVerifyToken: string
  ): WebhookVerificationResult {
    try {
      if (mode !== 'subscribe') {
        logger.warn('Invalid webhook mode', { mode });
        return {
          isValid: false,
          error: 'Invalid mode'
        };
      }

      if (!verifyToken) {
        logger.warn('Missing verify token');
        return {
          isValid: false,
          error: 'Missing verify token'
        };
      }

      if (!challenge) {
        logger.warn('Missing challenge parameter');
        return {
          isValid: false,
          error: 'Missing challenge'
        };
      }

      // Use timing-safe comparison for verify token
      const providedTokenBuffer = Buffer.from(verifyToken, 'utf8');
      const expectedTokenBuffer = Buffer.from(expectedVerifyToken, 'utf8');

      if (providedTokenBuffer.length !== expectedTokenBuffer.length) {
        logger.warn('Verify token length mismatch');
        return {
          isValid: false,
          error: 'Invalid verify token'
        };
      }

      const isValid = crypto.timingSafeEqual(providedTokenBuffer, expectedTokenBuffer);

      if (!isValid) {
        logger.warn('Verify token validation failed');
        return {
          isValid: false,
          error: 'Invalid verify token'
        };
      }

      logger.info('Webhook challenge verification successful');
      return { isValid: true };

    } catch (error) {
      logger.error('Error during challenge verification', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isValid: false,
        error: 'Challenge verification error'
      };
    }
  }

  /**
   * Extract and validate webhook payload structure
   */
  static validateWebhookPayload(payload: any): WebhookVerificationResult {
    try {
      // Basic structure validation
      if (!payload || typeof payload !== 'object') {
        return {
          isValid: false,
          error: 'Invalid payload structure'
        };
      }

      if (payload.object !== 'whatsapp_business_account') {
        logger.warn('Invalid webhook object type', { object: payload.object });
        return {
          isValid: false,
          error: 'Invalid object type'
        };
      }

      if (!Array.isArray(payload.entry) || payload.entry.length === 0) {
        logger.warn('Missing or empty entry array');
        return {
          isValid: false,
          error: 'Invalid entry structure'
        };
      }

      // Validate entry structure
      for (const entry of payload.entry) {
        if (!entry.id || !Array.isArray(entry.changes)) {
          logger.warn('Invalid entry structure', { entryId: entry.id });
          return {
            isValid: false,
            error: 'Invalid entry format'
          };
        }

        // Validate changes
        for (const change of entry.changes) {
          if (!change.field || !change.value) {
            logger.warn('Invalid change structure', { field: change.field });
            return {
              isValid: false,
              error: 'Invalid change format'
            };
          }

          // Validate specific fields
          if (!['messages', 'message_template_status_update', 'account_alerts', 'account_update', 'phone_number_name_update', 'phone_number_quality_update', 'template_category_update', 'message_template_status_update', 'message_template_quality_update'].includes(change.field)) {
            logger.warn('Unknown webhook field', { field: change.field });
            // Don't fail for unknown fields, just log for monitoring
          }
        }
      }

      return { isValid: true };

    } catch (error) {
      logger.error('Error during payload validation', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        isValid: false,
        error: 'Payload validation error'
      };
    }
  }

  /**
   * Rate limiting for webhook processing
   */
  static isRateLimited(ipAddress: string, windowMs: number = 60000): boolean {
    // Simple in-memory rate limiting
    // In production, use Redis for distributed rate limiting
    const now = Date.now();
    const key = `webhook_${ipAddress}`;
    
    // This would be implemented with Redis in production
    // For now, we'll return false (no rate limiting)
    // TODO: Implement proper rate limiting with Redis
    
    return false;
  }

  /**
   * Generate secure verify token
   */
  static generateVerifyToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate IP address (for IP whitelisting if needed)
   */
  static isValidSourceIP(ipAddress: string, allowedIPs?: string[]): boolean {
    if (!allowedIPs || allowedIPs.length === 0) {
      // If no IP whitelist is configured, allow all
      return true;
    }

    // Check if IP is in whitelist
    return allowedIPs.includes(ipAddress);
  }
}

export default WebhookSecurityService;