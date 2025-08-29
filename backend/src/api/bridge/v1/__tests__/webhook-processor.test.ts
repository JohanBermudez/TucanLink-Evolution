import WhatsAppWebhookProcessor from '../services/whatsapp-webhook-processor.service';
import WebhookSecurityService from '../services/webhook-security.service';
import ChannelConnection from '../../../../channels/models/ChannelConnection';
import Channel from '../../../../channels/models/Channel';
import { getChannelManager } from '../../../../channels/bootstrap';

// Mock dependencies
jest.mock('../services/webhook-security.service');
jest.mock('../../../../channels/models/ChannelConnection');
jest.mock('../../../../channels/models/Channel');
jest.mock('../../../../channels/bootstrap');
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const mockChannelManager = {
  emit: jest.fn()
};

(getChannelManager as jest.Mock).mockReturnValue(mockChannelManager);

describe('WhatsAppWebhookProcessor', () => {
  let processor: WhatsAppWebhookProcessor;
  let mockConnection: any;

  beforeEach(() => {
    processor = new WhatsAppWebhookProcessor();
    
    mockConnection = {
      id: 1,
      companyId: 1,
      configuration: {
        phoneNumberId: '123456789012345',
        displayPhoneNumber: '+1 234 567 8901',
        appSecret: 'test-app-secret',
        autoMarkAsRead: true
      }
    };

    jest.clearAllMocks();
  });

  describe('processWebhook', () => {
    const mockPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '987654321',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+1 234 567 8901',
                  phone_number_id: '123456789012345'
                },
                messages: [
                  {
                    from: '1234567890',
                    id: 'wamid.ABC123',
                    timestamp: '1629876543',
                    type: 'text',
                    text: {
                      body: 'Hello, World!'
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    it('should process webhook successfully', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      await processor.processWebhook(mockPayload, 'test-signature', '192.168.1.1');

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageReceived', 
        expect.objectContaining({
          connectionId: 1,
          companyId: 1,
          message: expect.objectContaining({
            messageId: 'wamid.ABC123',
            from: '1234567890',
            type: 'text',
            content: { text: 'Hello, World!' }
          })
        })
      );
    });

    it('should handle multiple messages in webhook', async () => {
      const multiMessagePayload = {
        ...mockPayload,
        entry: [
          {
            ...mockPayload.entry[0],
            changes: [
              {
                field: 'messages',
                value: {
                  ...mockPayload.entry[0].changes[0].value,
                  messages: [
                    {
                      from: '1234567890',
                      id: 'wamid.ABC123',
                      timestamp: '1629876543',
                      type: 'text',
                      text: { body: 'Message 1' }
                    },
                    {
                      from: '1234567891',
                      id: 'wamid.DEF456',
                      timestamp: '1629876544',
                      type: 'text',
                      text: { body: 'Message 2' }
                    }
                  ]
                }
              }
            ]
          }
        ]
      };

      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      await processor.processWebhook(multiMessagePayload, 'test-signature', '192.168.1.1');

      expect(mockChannelManager.emit).toHaveBeenCalledTimes(2);
    });

    it('should handle webhook with no connection found', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(null);

      await processor.processWebhook(mockPayload, 'test-signature', '192.168.1.1');

      expect(mockChannelManager.emit).not.toHaveBeenCalled();
    });
  });

  describe('processIncomingMessage', () => {
    it('should process text message correctly', async () => {
      const message = {
        from: '1234567890',
        id: 'wamid.ABC123',
        timestamp: '1629876543',
        type: 'text',
        text: { body: 'Hello, World!' }
      };

      await processor['processIncomingMessage'](message, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageReceived', {
        connectionId: 1,
        companyId: 1,
        message: {
          connectionId: 1,
          companyId: 1,
          messageId: 'wamid.ABC123',
          from: '1234567890',
          to: '123456789012345',
          timestamp: new Date(1629876543000),
          type: 'text',
          content: { text: 'Hello, World!' },
          context: undefined
        },
        metadata: {
          phoneNumberId: '123456789012345',
          displayPhoneNumber: '+1 234 567 8901'
        }
      });
    });

    it('should process image message correctly', async () => {
      const message = {
        from: '1234567890',
        id: 'wamid.DEF456',
        timestamp: '1629876544',
        type: 'image',
        image: {
          id: 'media123',
          mime_type: 'image/jpeg',
          sha256: 'hash123',
          caption: 'Test image'
        }
      };

      await processor['processIncomingMessage'](message, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageReceived', 
        expect.objectContaining({
          message: expect.objectContaining({
            type: 'image',
            content: {
              media: {
                id: 'media123',
                mimeType: 'image/jpeg',
                sha256: 'hash123',
                caption: 'Test image'
              }
            }
          })
        })
      );
    });

    it('should process location message correctly', async () => {
      const message = {
        from: '1234567890',
        id: 'wamid.GHI789',
        timestamp: '1629876545',
        type: 'location',
        location: {
          latitude: -23.5505,
          longitude: -46.6333,
          name: 'São Paulo',
          address: 'São Paulo, SP, Brazil'
        }
      };

      await processor['processIncomingMessage'](message, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageReceived',
        expect.objectContaining({
          message: expect.objectContaining({
            type: 'location',
            content: {
              location: {
                latitude: -23.5505,
                longitude: -46.6333,
                name: 'São Paulo',
                address: 'São Paulo, SP, Brazil'
              }
            }
          })
        })
      );
    });

    it('should handle quoted messages', async () => {
      const message = {
        from: '1234567890',
        id: 'wamid.JKL012',
        timestamp: '1629876546',
        type: 'text',
        text: { body: 'Reply message' },
        context: {
          from: '0987654321',
          id: 'wamid.QUOTED123'
        }
      };

      await processor['processIncomingMessage'](message, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageReceived',
        expect.objectContaining({
          message: expect.objectContaining({
            context: {
              quotedMessageId: 'wamid.QUOTED123',
              quotedFrom: '0987654321'
            }
          })
        })
      );
    });

    it('should emit markMessageAsRead when autoMarkAsRead is true', async () => {
      const message = {
        from: '1234567890',
        id: 'wamid.MNO345',
        timestamp: '1629876547',
        type: 'text',
        text: { body: 'Test message' }
      };

      await processor['processIncomingMessage'](message, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('markMessageAsRead', {
        connectionId: 1,
        messageId: 'wamid.MNO345'
      });
    });

    it('should not emit markMessageAsRead when autoMarkAsRead is false', async () => {
      const connectionWithoutAutoRead = {
        ...mockConnection,
        configuration: {
          ...mockConnection.configuration,
          autoMarkAsRead: false
        }
      };

      const message = {
        from: '1234567890',
        id: 'wamid.PQR678',
        timestamp: '1629876548',
        type: 'text',
        text: { body: 'Test message' }
      };

      await processor['processIncomingMessage'](message, connectionWithoutAutoRead);

      expect(mockChannelManager.emit).not.toHaveBeenCalledWith('markMessageAsRead', expect.anything());
    });
  });

  describe('processMessageStatus', () => {
    it('should process message status update correctly', async () => {
      const status = {
        id: 'wamid.ABC123',
        status: 'delivered',
        timestamp: '1629876549',
        recipient_id: '1234567890',
        errors: []
      };

      await processor['processMessageStatus'](status, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageStatusUpdate', {
        connectionId: 1,
        companyId: 1,
        statusUpdate: {
          connectionId: 1,
          companyId: 1,
          messageId: 'wamid.ABC123',
          status: 'delivered',
          timestamp: new Date(1629876549000),
          recipientId: '1234567890',
          errors: []
        }
      });
    });

    it('should handle status update with errors', async () => {
      const status = {
        id: 'wamid.DEF456',
        status: 'failed',
        timestamp: '1629876550',
        recipient_id: '1234567890',
        errors: [
          {
            code: 131047,
            title: 'Re-engagement message',
            message: 'Re-engagement message was not delivered'
          }
        ]
      };

      await processor['processMessageStatus'](status, mockConnection);

      expect(mockChannelManager.emit).toHaveBeenCalledWith('messageStatusUpdate',
        expect.objectContaining({
          statusUpdate: expect.objectContaining({
            status: 'failed',
            errors: expect.arrayContaining([
              expect.objectContaining({
                code: 131047,
                title: 'Re-engagement message'
              })
            ])
          })
        })
      );
    });
  });

  describe('findConnectionByPhoneNumberId', () => {
    it('should find connection by phone number ID', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      const result = await processor['findConnectionByPhoneNumberId']('123456789012345');

      expect(result).toEqual(mockConnection);
      expect(ChannelConnection.findOne).toHaveBeenCalledWith({
        where: {
          configuration: {
            phoneNumberId: '123456789012345'
          }
        },
        include: [
          {
            model: Channel,
            as: 'channel',
            where: {
              type: 'WHATSAPP_CLOUD'
            }
          }
        ]
      });
    });

    it('should return null when connection not found', async () => {
      (ChannelConnection.findOne as jest.Mock).mockResolvedValue(null);

      const result = await processor['findConnectionByPhoneNumberId']('999999999999999');

      expect(result).toBeNull();
    });

    it('should handle database error', async () => {
      (ChannelConnection.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await processor['findConnectionByPhoneNumberId']('123456789012345');

      expect(result).toBeNull();
    });
  });

  describe('validateWebhookSecurity', () => {
    it('should validate webhook signature successfully', async () => {
      (WebhookSecurityService.verifySignature as jest.Mock).mockReturnValue({
        isValid: true
      });

      const result = await processor.validateWebhookSecurity(
        'payload',
        'sha256=signature',
        mockConnection
      );

      expect(result).toBe(true);
      expect(WebhookSecurityService.verifySignature).toHaveBeenCalledWith(
        'payload',
        'sha256=signature',
        'test-app-secret'
      );
    });

    it('should fail validation with invalid signature', async () => {
      (WebhookSecurityService.verifySignature as jest.Mock).mockReturnValue({
        isValid: false,
        error: 'Invalid signature'
      });

      const result = await processor.validateWebhookSecurity(
        'payload',
        'sha256=invalid-signature',
        mockConnection
      );

      expect(result).toBe(false);
    });

    it('should fail validation when no app secret is configured', async () => {
      const connectionWithoutSecret = {
        ...mockConnection,
        configuration: {
          ...mockConnection.configuration,
          appSecret: undefined
        }
      };

      const result = await processor.validateWebhookSecurity(
        'payload',
        'sha256=signature',
        connectionWithoutSecret
      );

      expect(result).toBe(false);
    });
  });

  describe('extractMessageContent', () => {
    it('should extract text content correctly', () => {
      const message = {
        type: 'text',
        text: { body: 'Hello, World!' }
      };

      const content = processor['extractMessageContent'](message);

      expect(content).toEqual({
        text: 'Hello, World!'
      });
    });

    it('should extract media content correctly', () => {
      const message = {
        type: 'image',
        image: {
          id: 'media123',
          mime_type: 'image/jpeg',
          sha256: 'hash123',
          caption: 'Test image'
        }
      };

      const content = processor['extractMessageContent'](message);

      expect(content).toEqual({
        media: {
          id: 'media123',
          mimeType: 'image/jpeg',
          sha256: 'hash123',
          caption: 'Test image'
        }
      });
    });

    it('should handle unknown message types', () => {
      const message = {
        type: 'unknown',
        data: { some: 'data' }
      };

      const content = processor['extractMessageContent'](message);

      expect(content).toEqual({
        raw: message
      });
    });
  });
});