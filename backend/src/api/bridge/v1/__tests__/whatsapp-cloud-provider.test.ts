import { WhatsAppCloudProvider } from '../../../../channels/providers/whatsapp/WhatsAppCloudProvider';
import { ConnectionStatus } from '../../../../channels/models/ChannelConnection';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('WhatsAppCloudProvider', () => {
  let provider: WhatsAppCloudProvider;
  let mockConnectionInfo: any;

  beforeEach(() => {
    provider = new WhatsAppCloudProvider();
    
    mockConnectionInfo = {
      id: 1,
      name: 'Test Connection',
      type: 'WHATSAPP_CLOUD',
      status: ConnectionStatus.DISCONNECTED,
      companyId: 1,
      configuration: {
        accessToken: 'test-access-token',
        phoneNumberId: '123456789012345',
        businessAccountId: '987654321098765',
        webhookVerifyToken: 'test-verify-token',
        apiVersion: 'v23.0'
      },
      capabilities: {
        text: true,
        media: true,
        buttons: true,
        lists: true,
        templates: true,
        location: true,
        contacts: true,
        reactions: true,
        typing: false,
        read_receipts: true
      },
      rateLimit: {
        messagesPerSecond: 80
      },
      metadata: {}
    };

    // Setup axios create mock
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize provider with connection info', async () => {
      await provider.initialize(mockConnectionInfo);

      expect(provider['config']).toEqual(mockConnectionInfo.configuration);
      expect(provider['phoneNumberId']).toBe(mockConnectionInfo.configuration.phoneNumberId);
      expect(provider['businessAccountId']).toBe(mockConnectionInfo.configuration.businessAccountId);
      expect(provider['accessToken']).toBe(mockConnectionInfo.configuration.accessToken);
    });

    it('should setup API client with correct configuration', async () => {
      await provider.initialize(mockConnectionInfo);

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://graph.facebook.com/v23.0',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockConnectionInfo.configuration.accessToken}`
        }
      });
    });
  });

  describe('connect', () => {
    beforeEach(async () => {
      await provider.initialize(mockConnectionInfo);
    });

    it('should connect successfully with valid business account', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        status: 200,
        data: {
          id: '987654321098765',
          name: 'Test Business',
          message_template_namespace: 'test_namespace'
        }
      });

      const status = await provider.connect();

      expect(status).toBe(ConnectionStatus.CONNECTED);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/987654321098765', {
        params: { fields: 'id,name,message_template_namespace' }
      });
    });

    it('should throw error when business account is invalid', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.get = jest.fn().mockRejectedValue(new Error('Invalid business account'));

      await expect(provider.connect()).rejects.toThrow('WhatsApp Cloud connection failed');
    });

    it('should handle API response without valid ID', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.get = jest.fn().mockResolvedValue({
        status: 200,
        data: { name: 'Test Business' } // No ID
      });

      await expect(provider.connect()).rejects.toThrow('Invalid response from WhatsApp API');
    });
  });

  describe('sendWhatsAppMessage', () => {
    beforeEach(async () => {
      await provider.initialize(mockConnectionInfo);
    });

    it('should send text message successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post = jest.fn().mockResolvedValue({
        data: {
          messages: [{ id: 'wamid.ABC123' }],
          contacts: [{ wa_id: '1234567890', input: '+1 234 567 890' }]
        }
      });

      const message = {
        to: '+1234567890',
        type: 'text' as const,
        content: { text: 'Hello, World!' }
      };

      const result = await provider.sendWhatsAppMessage(message);

      expect(result).toEqual({
        id: 'wamid.ABC123',
        externalId: 'wamid.ABC123',
        status: 'sent',
        metadata: {
          waId: '1234567890',
          input: '+1 234 567 890'
        }
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/123456789012345/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'text',
        text: {
          preview_url: true,
          body: 'Hello, World!'
        }
      });
    });

    it('should send image message successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post = jest.fn().mockResolvedValue({
        data: {
          messages: [{ id: 'wamid.DEF456' }],
          contacts: [{ wa_id: '1234567890' }]
        }
      });

      const message = {
        to: '+1234567890',
        type: 'image' as const,
        content: {
          media: {
            url: 'https://example.com/image.jpg',
            caption: 'Test image'
          }
        }
      };

      const result = await provider.sendWhatsAppMessage(message);

      expect(result.status).toBe('sent');
      expect(result.id).toBe('wamid.DEF456');
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/123456789012345/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'image',
        image: {
          link: 'https://example.com/image.jpg',
          caption: 'Test image'
        }
      });
    });

    it('should send template message successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post = jest.fn().mockResolvedValue({
        data: {
          messages: [{ id: 'wamid.GHI789' }],
          contacts: [{ wa_id: '1234567890' }]
        }
      });

      const message = {
        to: '+1234567890',
        type: 'template' as const,
        content: {
          template: {
            name: 'hello_world',
            language: 'en',
            components: []
          }
        }
      };

      const result = await provider.sendWhatsAppMessage(message);

      expect(result.status).toBe('sent');
      expect(result.id).toBe('wamid.GHI789');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/123456789012345/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en'
          },
          components: []
        }
      });
    });

    it('should handle API error gracefully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post = jest.fn().mockRejectedValue(new Error('API Error'));

      const message = {
        to: '+1234567890',
        type: 'text' as const,
        content: { text: 'Hello, World!' }
      };

      const result = await provider.sendWhatsAppMessage(message);

      expect(result).toEqual({
        id: '',
        status: 'failed',
        error: expect.stringContaining('API Error')
      });
    });

    it('should handle invalid response format', async () => {
      const mockAxiosInstance = mockedAxios.create();
      mockAxiosInstance.post = jest.fn().mockResolvedValue({
        data: { invalid: 'response' } // No messages array
      });

      const message = {
        to: '+1234567890',
        type: 'text' as const,
        content: { text: 'Hello, World!' }
      };

      const result = await provider.sendWhatsAppMessage(message);

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Invalid response format');
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities).toEqual({
        text: true,
        media: true,
        buttons: true,
        lists: true,
        templates: true,
        location: true,
        contacts: true,
        reactions: true,
        typing: false,
        read_receipts: true,
        groups: false,
        broadcast: true
      });
    });
  });

  describe('buildMessagePayload', () => {
    it('should build text message payload correctly', () => {
      const message = {
        to: '+1234567890',
        type: 'text' as const,
        content: { text: 'Hello, World!' }
      };

      const payload = provider['buildMessagePayload'](message);

      expect(payload).toEqual({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'text',
        text: {
          preview_url: true,
          body: 'Hello, World!'
        }
      });
    });

    it('should build template message payload correctly', () => {
      const message = {
        to: '+1234567890',
        type: 'template' as const,
        content: {
          template: {
            name: 'hello_world',
            language: 'en',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: 'John' }
                ]
              }
            ]
          }
        }
      };

      const payload = provider['buildMessagePayload'](message);

      expect(payload).toEqual({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+1234567890',
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: 'John' }
              ]
            }
          ]
        }
      });
    });

    it('should throw error for unsupported message type', () => {
      const message = {
        to: '+1234567890',
        type: 'unsupported' as any,
        content: { text: 'Hello' }
      };

      expect(() => {
        provider['buildMessagePayload'](message);
      }).toThrow('Unsupported message type: unsupported');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await provider.disconnect();

      expect(provider.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });
  });

  describe('rate limiting', () => {
    beforeEach(async () => {
      await provider.initialize(mockConnectionInfo);
    });

    it('should apply rate limiting', async () => {
      const checkRateLimitSpy = jest.spyOn(provider as any, 'checkRateLimit')
        .mockResolvedValue(true);

      await provider['checkRateLimit']();

      expect(checkRateLimitSpy).toHaveBeenCalled();
    });

    it('should wait when rate limit is exceeded', async () => {
      // Mock rate limit exceeded scenario
      const originalTracker = provider['rateLimitTracker'];
      provider['rateLimitTracker'] = {
        ...originalTracker,
        requests: 85, // Exceeds limit of 80
        resetTime: Date.now() + 60000
      };

      const sleepSpy = jest.spyOn(provider as any, 'sleep')
        .mockResolvedValue(undefined);

      await provider['checkRateLimit']();

      expect(sleepSpy).toHaveBeenCalled();
    });
  });
});