/**
 * WhatsApp Cloud API Provider
 * Implements the official WhatsApp Business Platform Cloud API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import crypto from 'crypto';
import {
  ChannelProvider,
  ChannelConfig,
  MessagePayload,
  TemplatePayload,
  MediaPayload,
  MessageResponse,
  ChannelStatus,
  ContactData,
  IncomingMessage
} from '../base/ChannelProvider';
import { logger } from '../../../bridge/v1/utils/logger';

// WhatsApp specific types
interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken?: string;
}

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  recipient_type?: 'individual';
  to: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template' | 'interactive';
  [key: string]: any;
}

interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    field: string;
    value: any;
  }>;
}

interface WhatsAppContact {
  wa_id: string;
  profile?: {
    name: string;
  };
}

interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string };
  video?: { id: string; mime_type: string; sha256: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename: string };
  location?: { latitude: number; longitude: number };
  contacts?: Array<any>;
  button?: { text: string; payload: string };
  interactive?: any;
  context?: { from: string; id: string };
  errors?: Array<any>;
}

interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
    error_data?: any;
  }>;
}

/**
 * WhatsApp Cloud API Provider Implementation
 */
export class WhatsAppCloudProvider extends ChannelProvider {
  private apiVersion: string = 'v21.0';
  private baseUrl: string = 'https://graph.facebook.com';
  private axiosClient: AxiosInstance;
  private credentials: WhatsAppCredentials;
  private phoneNumberId: string;
  private accessToken: string;
  private businessAccountId: string;
  private messageStatusMap: Map<string, string> = new Map();

  constructor(config: ChannelConfig) {
    super(config);
    
    // Validate required credentials
    this.validateCredentials(['phoneNumberId', 'accessToken', 'businessAccountId']);
    
    this.credentials = config.credentials as WhatsAppCredentials;
    this.phoneNumberId = this.credentials.phoneNumberId;
    this.accessToken = this.credentials.accessToken;
    this.businessAccountId = this.credentials.businessAccountId;
    
    // Initialize axios client with default config
    this.axiosClient = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    });
    
    // Add response interceptor for error handling
    this.axiosClient.interceptors.response.use(
      response => response,
      this.handleAxiosError.bind(this)
    );
  }

  /**
   * Connect to WhatsApp Cloud API
   */
  async connect(): Promise<void> {
    try {
      logger.info(`Connecting WhatsApp Cloud API for channel ${this.channelId}`);
      
      // Verify credentials by fetching phone number details
      const response = await this.axiosClient.get(`/${this.phoneNumberId}`);
      
      if (response.data) {
        const phoneInfo = response.data;
        logger.info(`WhatsApp connected successfully:`, {
          phoneNumber: phoneInfo.display_phone_number,
          verifiedName: phoneInfo.verified_name,
          qualityRating: phoneInfo.quality_rating
        });
        
        await this.updateStatus('connected');
        this.isConnected = true;
        
        // Get business account info
        await this.getBusinessAccountInfo();
      }
    } catch (error) {
      logger.error(`Failed to connect WhatsApp Cloud API:`, error);
      await this.updateStatus('error');
      throw new Error(`WhatsApp connection failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from WhatsApp Cloud API
   */
  async disconnect(): Promise<void> {
    try {
      await this.updateStatus('disconnected');
      this.isConnected = false;
      logger.info(`WhatsApp Cloud API disconnected for channel ${this.channelId}`);
    } catch (error) {
      logger.error(`Error disconnecting WhatsApp:`, error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(to: string, message: MessagePayload): Promise<MessageResponse> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          preview_url: true,
          body: message.text || ''
        }
      };
      
      // Handle interactive messages (buttons, lists)
      if (message.buttons && message.buttons.length > 0) {
        whatsappMessage.type = 'interactive';
        whatsappMessage.interactive = {
          type: 'button',
          body: { text: message.text || '' },
          action: {
            buttons: message.buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        };
        delete whatsappMessage.text;
      } else if (message.listItems && message.listItems.length > 0) {
        whatsappMessage.type = 'interactive';
        whatsappMessage.interactive = {
          type: 'list',
          body: { text: message.text || '' },
          action: {
            button: 'Ver opciones',
            sections: [{
              title: 'Opciones disponibles',
              rows: message.listItems.map(item => ({
                id: item.id,
                title: item.title,
                description: item.description
              }))
            }]
          }
        };
        delete whatsappMessage.text;
      }
      
      const response = await this.axiosClient.post(
        `/${this.phoneNumberId}/messages`,
        whatsappMessage
      );
      
      const messageId = response.data.messages[0].id;
      
      // Log message to database
      await this.logMessage({
        messageId,
        to,
        body: message.text,
        status: 'sent',
        fromMe: true,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error sending WhatsApp message:', error);
      this.messageCount.failed++;
      
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Send a template message
   */
  async sendTemplate(to: string, template: TemplatePayload): Promise<MessageResponse> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: template.name,
          language: {
            code: template.language || 'es'
          }
        }
      };
      
      // Add template parameters if provided
      if (template.parameters && template.parameters.length > 0) {
        whatsappMessage.template.components = [{
          type: 'body',
          parameters: template.parameters.map(param => ({
            type: 'text',
            text: param
          }))
        }];
      }
      
      // Add header parameters if provided
      if (template.headerParams && template.headerParams.length > 0) {
        if (!whatsappMessage.template.components) {
          whatsappMessage.template.components = [];
        }
        whatsappMessage.template.components.unshift({
          type: 'header',
          parameters: template.headerParams.map(param => {
            if (param.type === 'text') {
              return { type: 'text', text: param.value };
            } else {
              return {
                type: param.type,
                [param.type]: {
                  link: param.value
                }
              };
            }
          })
        });
      }
      
      const response = await this.axiosClient.post(
        `/${this.phoneNumberId}/messages`,
        whatsappMessage
      );
      
      const messageId = response.data.messages[0].id;
      
      // Log template message
      await this.logMessage({
        messageId,
        to,
        template: template.name,
        status: 'sent',
        fromMe: true,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error sending WhatsApp template:', error);
      this.messageCount.failed++;
      
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Send media message
   */
  async sendMedia(to: string, media: MediaPayload): Promise<MessageResponse> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: media.type
      };
      
      // Configure media object based on type
      const mediaObject: any = {
        link: media.url
      };
      
      if (media.caption) {
        mediaObject.caption = media.caption;
      }
      
      if (media.filename && media.type === 'document') {
        mediaObject.filename = media.filename;
      }
      
      whatsappMessage[media.type] = mediaObject;
      
      const response = await this.axiosClient.post(
        `/${this.phoneNumberId}/messages`,
        whatsappMessage
      );
      
      const messageId = response.data.messages[0].id;
      
      // Log media message
      await this.logMessage({
        messageId,
        to,
        mediaUrl: media.url,
        mediaType: media.type,
        caption: media.caption,
        status: 'sent',
        fromMe: true,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        messageId,
        status: 'sent',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error sending WhatsApp media:', error);
      this.messageCount.failed++;
      
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Get channel status
   */
  async getStatus(): Promise<ChannelStatus> {
    try {
      const response = await this.axiosClient.get(`/${this.phoneNumberId}`);
      
      return {
        connected: true,
        details: {
          phoneNumber: response.data.display_phone_number,
          verifiedName: response.data.verified_name,
          qualityRating: response.data.quality_rating,
          messagingLimit: response.data.messaging_limit,
          status: response.data.account_mode
        },
        lastActivity: new Date(),
        messagesCount: this.getMessageStats()
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        messagesCount: this.getMessageStats()
      };
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      // Verify webhook signature if configured
      if (this.credentials.webhookVerifyToken) {
        // TODO: Implement signature verification
      }
      
      const { entry } = payload;
      
      if (!entry || !Array.isArray(entry)) {
        logger.warn('Invalid webhook payload structure');
        return;
      }
      
      for (const item of entry) {
        await this.processWebhookEntry(item);
      }
    } catch (error) {
      logger.error('Error handling WhatsApp webhook:', error);
      throw error;
    }
  }

  /**
   * Process a single webhook entry
   */
  private async processWebhookEntry(entry: WhatsAppWebhookEntry): Promise<void> {
    const { changes } = entry;
    
    if (!changes || !Array.isArray(changes)) {
      return;
    }
    
    for (const change of changes) {
      if (change.field === 'messages') {
        await this.processMessagesChange(change.value);
      }
    }
  }

  /**
   * Process messages change from webhook
   */
  private async processMessagesChange(value: any): Promise<void> {
    const { messages, statuses, contacts } = value;
    
    // Process incoming messages
    if (messages && Array.isArray(messages)) {
      for (const message of messages) {
        await this.processIncomingMessage(message, contacts);
      }
    }
    
    // Process message status updates
    if (statuses && Array.isArray(statuses)) {
      for (const status of statuses) {
        await this.processMessageStatus(status);
      }
    }
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(
    message: WhatsAppIncomingMessage,
    contacts: WhatsAppContact[]
  ): Promise<void> {
    try {
      const contact = contacts?.find(c => c.wa_id === message.from);
      
      // Create or update contact
      const contactData: ContactData = {
        number: message.from,
        name: contact?.profile?.name || message.from
      };
      
      // Find or create ticket
      const ticket = await this.findOrCreateTicket(contactData);
      
      // Prepare incoming message data
      const incomingMessage: IncomingMessage = {
        messageId: message.id,
        from: message.from,
        to: this.phoneNumberId,
        timestamp: parseInt(message.timestamp) * 1000,
        metadata: {}
      };
      
      // Process message based on type
      switch (message.type) {
        case 'text':
          incomingMessage.body = message.text?.body;
          break;
        case 'image':
        case 'video':
        case 'audio':
        case 'document':
          incomingMessage.mediaUrl = await this.downloadMedia(message[message.type]?.id);
          incomingMessage.mediaType = message.type;
          if (message[message.type]?.caption) {
            incomingMessage.body = message[message.type].caption;
          }
          break;
        case 'location':
          incomingMessage.metadata.location = message.location;
          incomingMessage.body = `📍 Location: ${message.location?.latitude}, ${message.location?.longitude}`;
          break;
        case 'button':
          incomingMessage.body = message.button?.text;
          incomingMessage.metadata.buttonPayload = message.button?.payload;
          break;
        case 'interactive':
          // Handle interactive responses
          incomingMessage.metadata.interactive = message.interactive;
          break;
      }
      
      // Handle quoted messages
      if (message.context) {
        incomingMessage.quotedMessageId = message.context.id;
      }
      
      // Save incoming message
      await this.saveIncomingMessage(incomingMessage);
      
      // Emit message received event
      this.emitMessageReceived({
        ticketId: ticket.id,
        message: incomingMessage,
        contact: contactData
      });
      
      // Mark message as read
      await this.markAsRead(message.id);
      
    } catch (error) {
      logger.error('Error processing incoming WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Process message status update
   */
  private async processMessageStatus(status: WhatsAppStatus): Promise<void> {
    try {
      // Store status in map
      this.messageStatusMap.set(status.id, status.status);
      
      // Emit status update event
      this.emitMessageStatusUpdate(status.id, status.status);
      
      // Log status update
      logger.info(`Message ${status.id} status updated to: ${status.status}`);
      
      // Handle errors if any
      if (status.errors && status.errors.length > 0) {
        logger.error(`Message ${status.id} failed:`, status.errors);
        this.messageCount.failed++;
      }
    } catch (error) {
      logger.error('Error processing message status:', error);
    }
  }

  /**
   * Validate phone number
   */
  async validateIdentifier(identifier: string): Promise<boolean> {
    try {
      const formattedNumber = this.formatPhoneNumber(identifier);
      
      // Use contacts endpoint to check if number is on WhatsApp
      const response = await this.axiosClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'text',
          text: { body: 'Test' }
        },
        {
          params: { dry_run: true }
        }
      );
      
      return response.data.valid || false;
    } catch (error) {
      logger.error('Error validating WhatsApp number:', error);
      return false;
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<string> {
    // Return cached status if available
    return this.messageStatusMap.get(messageId) || 'unknown';
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.axiosClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        }
      );
      
      logger.debug(`Message ${messageId} marked as read`);
    } catch (error) {
      logger.error(`Error marking message as read:`, error);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(identifier: string): Promise<ContactData> {
    try {
      const formattedNumber = this.formatPhoneNumber(identifier);
      
      // WhatsApp Cloud API doesn't provide direct profile access
      // Return basic data
      return {
        number: formattedNumber,
        name: formattedNumber
      };
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  /**
   * Download media from WhatsApp
   */
  private async downloadMedia(mediaId: string): Promise<string> {
    try {
      // Get media URL
      const response = await this.axiosClient.get(`/${mediaId}`);
      const mediaUrl = response.data.url;
      
      // Download media
      const mediaResponse = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer'
      });
      
      // TODO: Save media to storage and return local URL
      // For now, return the WhatsApp URL
      return mediaUrl;
    } catch (error) {
      logger.error('Error downloading media:', error);
      return '';
    }
  }

  /**
   * Get business account information
   */
  private async getBusinessAccountInfo(): Promise<void> {
    try {
      const response = await this.axiosClient.get(`/${this.businessAccountId}`);
      logger.info('Business account info:', {
        id: response.data.id,
        name: response.data.name,
        timezone: response.data.timezone_id,
        messageTemplateNamespace: response.data.message_template_namespace
      });
    } catch (error) {
      logger.error('Error getting business account info:', error);
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(number: string): string {
    // Remove all non-numeric characters
    let formatted = number.replace(/\D/g, '');
    
    // Remove leading zeros
    formatted = formatted.replace(/^0+/, '');
    
    // Add country code if not present (example: Brazil +55)
    if (!formatted.startsWith('55') && formatted.length <= 11) {
      formatted = '55' + formatted;
    }
    
    return formatted;
  }

  /**
   * Handle axios errors
   */
  private async handleAxiosError(error: AxiosError): Promise<any> {
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle specific WhatsApp API errors
      if (status === 429) {
        // Rate limiting
        const retryAfter = error.response.headers['retry-after'] || 60;
        await this.handleRateLimit(parseInt(retryAfter as string));
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (status === 401) {
        // Invalid token
        await this.updateStatus('error');
        throw new Error('Invalid access token. Please check your credentials.');
      } else if (status === 403) {
        // Permission denied
        throw new Error('Permission denied. Check your WhatsApp Business account permissions.');
      } else if (data && typeof data === 'object' && 'error' in data) {
        // WhatsApp API error
        const apiError = (data as any).error;
        throw new Error(`WhatsApp API Error: ${apiError.message} (Code: ${apiError.code})`);
      }
    }
    
    throw error;
  }
  
  /**
   * Verify webhook signature (for security)
   */
  public static verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    
    return `sha256=${expectedSignature}` === signature;
  }
  
  /**
   * Handle webhook verification (for initial setup)
   */
  public static handleWebhookVerification(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
  ): string | null {
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp webhook verified successfully');
      return challenge;
    }
    
    logger.warn('WhatsApp webhook verification failed');
    return null;
  }
}

export default WhatsAppCloudProvider;
