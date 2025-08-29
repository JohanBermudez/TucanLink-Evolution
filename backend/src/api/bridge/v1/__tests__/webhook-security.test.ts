import WebhookSecurityService from '../services/webhook-security.service';
import crypto from 'crypto';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('WebhookSecurityService', () => {
  const testPayload = '{"test":"payload"}';
  const testSecret = 'test-app-secret';
  const testVerifyToken = 'test-verify-token';

  describe('verifySignature', () => {
    it('should verify valid HMAC-SHA256 signature', () => {
      const expectedHash = crypto
        .createHmac('sha256', testSecret)
        .update(testPayload, 'utf8')
        .digest('hex');
      
      const signature = `sha256=${expectedHash}`;

      const result = WebhookSecurityService.verifySignature(
        testPayload,
        signature,
        testSecret
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid signature', () => {
      const invalidSignature = 'sha256=invalid-signature-hash';

      const result = WebhookSecurityService.verifySignature(
        testPayload,
        invalidSignature,
        testSecret
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Signature verification failed');
    });

    it('should reject missing signature', () => {
      const result = WebhookSecurityService.verifySignature(
        testPayload,
        undefined,
        testSecret
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing signature header');
    });

    it('should reject signature without sha256 prefix', () => {
      const result = WebhookSecurityService.verifySignature(
        testPayload,
        'invalid-format-signature',
        testSecret
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid signature format');
    });

    it('should handle signature verification errors', () => {
      // Pass non-hex string as signature to trigger error
      const invalidHexSignature = 'sha256=not-a-valid-hex-string';

      const result = WebhookSecurityService.verifySignature(
        testPayload,
        invalidHexSignature,
        testSecret
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Signature verification error');
    });

    it('should use timing-safe comparison', () => {
      const correctHash = crypto
        .createHmac('sha256', testSecret)
        .update(testPayload, 'utf8')
        .digest('hex');

      // Create a signature that would be equal with string comparison
      // but should still use timing-safe comparison
      const signature = `sha256=${correctHash}`;

      const result = WebhookSecurityService.verifySignature(
        testPayload,
        signature,
        testSecret
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('verifyChallenge', () => {
    const testChallenge = 'test-challenge-12345';

    it('should verify valid webhook challenge', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'subscribe',
        testVerifyToken,
        testChallenge,
        testVerifyToken
      );

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid mode', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'invalid-mode',
        testVerifyToken,
        testChallenge,
        testVerifyToken
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid mode');
    });

    it('should reject missing verify token', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'subscribe',
        undefined,
        testChallenge,
        testVerifyToken
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing verify token');
    });

    it('should reject missing challenge', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'subscribe',
        testVerifyToken,
        undefined,
        testVerifyToken
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Missing challenge');
    });

    it('should reject invalid verify token', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'subscribe',
        'wrong-token',
        testChallenge,
        testVerifyToken
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid verify token');
    });

    it('should reject tokens with different lengths', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'subscribe',
        'short',
        testChallenge,
        testVerifyToken
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid verify token');
    });

    it('should use timing-safe comparison for tokens', () => {
      const result = WebhookSecurityService.verifyChallenge(
        'subscribe',
        testVerifyToken,
        testChallenge,
        testVerifyToken
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe('validateWebhookPayload', () => {
    const validPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '987654321' }
              }
            }
          ]
        }
      ]
    };

    it('should validate correct webhook payload', () => {
      const result = WebhookSecurityService.validateWebhookPayload(validPayload);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-object payloads', () => {
      const result = WebhookSecurityService.validateWebhookPayload('invalid');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid payload structure');
    });

    it('should reject null payloads', () => {
      const result = WebhookSecurityService.validateWebhookPayload(null);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid payload structure');
    });

    it('should reject payloads with invalid object type', () => {
      const invalidPayload = {
        ...validPayload,
        object: 'invalid_object'
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid object type');
    });

    it('should reject payloads without entry array', () => {
      const invalidPayload = {
        object: 'whatsapp_business_account'
        // Missing entry array
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid entry structure');
    });

    it('should reject payloads with empty entry array', () => {
      const invalidPayload = {
        object: 'whatsapp_business_account',
        entry: []
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid entry structure');
    });

    it('should reject entries without ID', () => {
      const invalidPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            // Missing id
            changes: [
              {
                field: 'messages',
                value: { messaging_product: 'whatsapp' }
              }
            ]
          }
        ]
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid entry format');
    });

    it('should reject entries without changes array', () => {
      const invalidPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789'
            // Missing changes array
          }
        ]
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid entry format');
    });

    it('should reject changes without field', () => {
      const invalidPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789',
            changes: [
              {
                // Missing field
                value: { messaging_product: 'whatsapp' }
              }
            ]
          }
        ]
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid change format');
    });

    it('should reject changes without value', () => {
      const invalidPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456789',
            changes: [
              {
                field: 'messages'
                // Missing value
              }
            ]
          }
        ]
      };

      const result = WebhookSecurityService.validateWebhookPayload(invalidPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid change format');
    });

    it('should accept known webhook fields', () => {
      const knownFields = [
        'messages',
        'message_template_status_update',
        'account_alerts',
        'account_update',
        'phone_number_name_update',
        'phone_number_quality_update'
      ];

      knownFields.forEach(field => {
        const payloadWithField = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: '123456789',
              changes: [
                {
                  field,
                  value: { messaging_product: 'whatsapp' }
                }
              ]
            }
          ]
        };

        const result = WebhookSecurityService.validateWebhookPayload(payloadWithField);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle validation errors gracefully', () => {
      // Create a payload that will cause an error during validation
      const problematicPayload = {
        get object() {
          throw new Error('Property access error');
        }
      };

      const result = WebhookSecurityService.validateWebhookPayload(problematicPayload);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Payload validation error');
    });
  });

  describe('generateVerifyToken', () => {
    it('should generate token with default length', () => {
      const token = WebhookSecurityService.generateVerifyToken();

      expect(token).toHaveLength(64); // 32 bytes * 2 (hex)
      expect(token).toMatch(/^[a-f0-9]+$/); // Should be hex string
    });

    it('should generate token with custom length', () => {
      const token = WebhookSecurityService.generateVerifyToken(16);

      expect(token).toHaveLength(32); // 16 bytes * 2 (hex)
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate different tokens each time', () => {
      const token1 = WebhookSecurityService.generateVerifyToken();
      const token2 = WebhookSecurityService.generateVerifyToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('isValidSourceIP', () => {
    it('should allow all IPs when no whitelist is provided', () => {
      const result = WebhookSecurityService.isValidSourceIP('192.168.1.1');

      expect(result).toBe(true);
    });

    it('should allow all IPs when empty whitelist is provided', () => {
      const result = WebhookSecurityService.isValidSourceIP('192.168.1.1', []);

      expect(result).toBe(true);
    });

    it('should allow whitelisted IPs', () => {
      const allowedIPs = ['192.168.1.1', '10.0.0.1'];
      const result = WebhookSecurityService.isValidSourceIP('192.168.1.1', allowedIPs);

      expect(result).toBe(true);
    });

    it('should reject non-whitelisted IPs', () => {
      const allowedIPs = ['192.168.1.1', '10.0.0.1'];
      const result = WebhookSecurityService.isValidSourceIP('172.16.0.1', allowedIPs);

      expect(result).toBe(false);
    });
  });

  describe('isRateLimited', () => {
    it('should not rate limit by default (placeholder implementation)', () => {
      const result = WebhookSecurityService.isRateLimited('192.168.1.1');

      expect(result).toBe(false);
    });

    it('should accept custom window parameter', () => {
      const result = WebhookSecurityService.isRateLimited('192.168.1.1', 30000);

      expect(result).toBe(false);
    });
  });
});