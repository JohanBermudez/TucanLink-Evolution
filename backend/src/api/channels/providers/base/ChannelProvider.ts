/**
 * Base Abstract Class for Channel Providers
 * All communication channel providers (WhatsApp, Instagram, Messenger) must extend this class
 */

import { EventEmitter } from 'events';
import { logger } from '../../../bridge/v1/utils/logger';

// Type definitions
export interface ChannelConfig {
  id: number;
  companyId: number;
  type: string;
  name: string;
  credentials: any;
  settings?: any;
}

export interface MessagePayload {
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  listItems?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

export interface TemplatePayload {
  name: string;
  language?: string;
  parameters?: string[];
  headerParams?: Array<{
    type: 'text' | 'image' | 'video' | 'document';
    value: string;
  }>;
}

export interface MediaPayload {
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  caption?: string;
  filename?: string;
}

export interface MessageResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  timestamp?: number;
}

export interface ChannelStatus {
  connected: boolean;
  details?: any;
  error?: string;
  lastActivity?: Date;
  messagesCount?: {
    sent: number;
    received: number;
    failed: number;
  };
}

export interface ContactData {
  number: string;
  name?: string;
  profilePicUrl?: string;
  metadata?: any;
}

export interface IncomingMessage {
  messageId: string;
  from: string;
  to: string;
  body?: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: number;
  isGroup?: boolean;
  groupId?: string;
  quotedMessageId?: string;
  metadata?: any;
}

/**
 * Abstract base class for all channel providers
 */
export abstract class ChannelProvider extends EventEmitter {
  protected config: ChannelConfig;
  protected companyId: number;
  protected channelId: number;
  protected isConnected: boolean = false;
  protected messageCount = {
    sent: 0,
    received: 0,
    failed: 0
  };

  constructor(config: ChannelConfig) {
    super();
    this.config = config;
    this.companyId = config.companyId;
    this.channelId = config.id;
  }

  /**
   * Initialize and connect to the channel
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the channel
   */
  abstract disconnect(): Promise<void>;

  /**
   * Send a text or rich message
   */
  abstract sendMessage(to: string, message: MessagePayload): Promise<MessageResponse>;

  /**
   * Send a template message
   */
  abstract sendTemplate(to: string, template: TemplatePayload): Promise<MessageResponse>;

  /**
   * Send media (image, video, audio, document)
   */
  abstract sendMedia(to: string, media: MediaPayload): Promise<MessageResponse>;

  /**
   * Get current channel status
   */
  abstract getStatus(): Promise<ChannelStatus>;

  /**
   * Handle incoming webhook payload
   */
  abstract handleWebhook(payload: any): Promise<void>;

  /**
   * Validate if a number/identifier is valid for this channel
   */
  abstract validateIdentifier(identifier: string): Promise<boolean>;

  /**
   * Get message status (sent, delivered, read, failed)
   */
  abstract getMessageStatus(messageId: string): Promise<string>;

  /**
   * Mark message as read
   */
  abstract markAsRead(messageId: string): Promise<void>;

  /**
   * Get user profile information
   */
  abstract getUserProfile(identifier: string): Promise<ContactData>;

  // Common protected methods for all providers

  /**
   * Log message to database
   */
  protected async logMessage(message: any): Promise<void> {
    try {
      // TODO: Save to channel_messages table
      logger.info(`Message logged for channel ${this.channelId}:`, message);
      
      if (message.fromMe) {
        this.messageCount.sent++;
      } else {
        this.messageCount.received++;
      }
    } catch (error) {
      logger.error('Failed to log message:', error);
    }
  }

  /**
   * Update channel status in database
   */
  protected async updateStatus(status: string): Promise<void> {
    try {
      // TODO: Update channels table status field
      this.isConnected = status === 'connected';
      logger.info(`Channel ${this.channelId} status updated to: ${status}`);
      
      // Emit status change event
      this.emit('statusChanged', {
        channelId: this.channelId,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to update channel status:', error);
    }
  }

  /**
   * Find or create a ticket for incoming messages
   */
  protected async findOrCreateTicket(contact: ContactData): Promise<any> {
    try {
      // TODO: Implement ticket creation/retrieval logic
      logger.info(`Finding or creating ticket for contact: ${contact.number}`);
      
      // Placeholder return
      return {
        id: 1,
        contactId: 1,
        channelId: this.channelId,
        companyId: this.companyId,
        status: 'open'
      };
    } catch (error) {
      logger.error('Failed to find or create ticket:', error);
      throw error;
    }
  }

  /**
   * Save incoming message to database
   */
  protected async saveIncomingMessage(message: IncomingMessage): Promise<void> {
    try {
      // TODO: Save to channel_messages table
      logger.info(`Saving incoming message from ${message.from}:`, message);
      
      await this.logMessage({
        ...message,
        fromMe: false,
        channelId: this.channelId,
        companyId: this.companyId
      });
    } catch (error) {
      logger.error('Failed to save incoming message:', error);
      throw error;
    }
  }

  /**
   * Emit message received event for real-time updates
   */
  protected emitMessageReceived(data: any): void {
    this.emit('messageReceived', {
      channelId: this.channelId,
      companyId: this.companyId,
      ...data
    });
  }

  /**
   * Emit message status update event
   */
  protected emitMessageStatusUpdate(messageId: string, status: string): void {
    this.emit('messageStatusUpdate', {
      channelId: this.channelId,
      messageId,
      status,
      timestamp: new Date()
    });
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  protected async handleRateLimit(retryAfter: number = 60): Promise<void> {
    logger.warn(`Rate limit hit for channel ${this.channelId}. Waiting ${retryAfter} seconds.`);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  }

  /**
   * Validate required credentials
   */
  protected validateCredentials(required: string[]): void {
    const missing = required.filter(key => !this.config.credentials[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required credentials: ${missing.join(', ')}`);
    }
  }

  /**
   * Get channel information
   */
  public getChannelInfo(): {
    id: number;
    type: string;
    name: string;
    companyId: number;
    isConnected: boolean;
  } {
    return {
      id: this.channelId,
      type: this.config.type,
      name: this.config.name,
      companyId: this.companyId,
      isConnected: this.isConnected
    };
  }

  /**
   * Get message statistics
   */
  public getMessageStats(): typeof this.messageCount {
    return { ...this.messageCount };
  }

  /**
   * Reset message counters
   */
  public resetMessageStats(): void {
    this.messageCount = {
      sent: 0,
      received: 0,
      failed: 0
    };
  }
}

export default ChannelProvider;
