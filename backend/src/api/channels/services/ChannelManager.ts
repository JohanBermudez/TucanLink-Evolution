/**
 * Channel Manager Service
 * Central service for managing all communication channels
 */

import { EventEmitter } from 'events';
import {
  ChannelProvider,
  ChannelConfig,
  MessagePayload,
  TemplatePayload,
  MediaPayload,
  MessageResponse,
  ChannelStatus
} from '../providers/base/ChannelProvider';
import { WhatsAppCloudProvider } from '../providers/whatsapp/WhatsAppCloudProvider';
// import { InstagramProvider } from '../providers/instagram/InstagramProvider';
// import { MessengerProvider } from '../providers/messenger/MessengerProvider';
import { logger } from '../../bridge/v1/utils/logger';
import Channel from '../models/Channel';
import ChannelMessage from '../models/ChannelMessage';

interface ChannelProviderMap {
  [key: string]: ChannelProvider;
}

interface SendMessageOptions {
  companyId: number;
  channelId: number;
  to: string;
  message?: MessagePayload;
  template?: TemplatePayload;
  media?: MediaPayload;
  ticketId?: number;
}

/**
 * Singleton Channel Manager
 */
export class ChannelManager extends EventEmitter {
  private static instance: ChannelManager;
  private providers: ChannelProviderMap = {};
  private initializingChannels: Set<string> = new Set();

  private constructor() {
    super();
    this.setupEventHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ChannelManager {
    if (!ChannelManager.instance) {
      ChannelManager.instance = new ChannelManager();
    }
    return ChannelManager.instance;
  }

  /**
   * Initialize a channel and create its provider
   */
  public async initializeChannel(channel: Channel | ChannelConfig): Promise<void> {
    const channelKey = this.getChannelKey(channel.companyId, channel.id);
    
    // Check if already initializing
    if (this.initializingChannels.has(channelKey)) {
      logger.info(`Channel ${channelKey} is already being initialized`);
      return;
    }
    
    // Check if already initialized
    if (this.providers[channelKey]) {
      logger.info(`Channel ${channelKey} is already initialized`);
      return;
    }
    
    try {
      this.initializingChannels.add(channelKey);
      logger.info(`Initializing channel ${channel.id} of type ${channel.type}`);
      
      // Create provider based on channel type
      const provider = this.createProvider(channel);
      
      // Setup provider event listeners
      this.setupProviderEvents(provider);
      
      // Connect to the channel
      await provider.connect();
      
      // Store provider
      this.providers[channelKey] = provider;
      
      // Emit channel initialized event
      this.emit('channelInitialized', {
        channelId: channel.id,
        companyId: channel.companyId,
        type: channel.type
      });
      
      logger.info(`Channel ${channel.id} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize channel ${channel.id}:`, error);
      
      // Emit initialization error
      this.emit('channelInitializationError', {
        channelId: channel.id,
        companyId: channel.companyId,
        error: error.message
      });
      
      throw error;
    } finally {
      this.initializingChannels.delete(channelKey);
    }
  }

  /**
   * Create provider instance based on channel type
   */
  private createProvider(channel: Channel | ChannelConfig): ChannelProvider {
    const config: ChannelConfig = {
      id: channel.id,
      companyId: channel.companyId,
      type: channel.type,
      name: channel.name,
      credentials: channel.credentials || {},
      settings: channel.config || {}
    };
    
    switch (channel.type) {
      case 'whatsapp_cloud':
        return new WhatsAppCloudProvider(config);
      // case 'instagram':
      //   return new InstagramProvider(config);
      // case 'messenger':
      //   return new MessengerProvider(config);
      default:
        throw new Error(`Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Setup event handlers for a provider
   */
  private setupProviderEvents(provider: ChannelProvider): void {
    // Forward provider events
    provider.on('messageReceived', (data) => {
      this.emit('messageReceived', data);
      this.handleIncomingMessage(data);
    });
    
    provider.on('messageStatusUpdate', (data) => {
      this.emit('messageStatusUpdate', data);
      this.updateMessageStatus(data);
    });
    
    provider.on('statusChanged', (data) => {
      this.emit('channelStatusChanged', data);
      this.updateChannelStatus(data);
    });
  }

  /**
   * Get provider for a specific channel
   */
  public getProvider(companyId: number, channelId: number): ChannelProvider | null {
    const key = this.getChannelKey(companyId, channelId);
    return this.providers[key] || null;
  }

  /**
   * Send a message through a channel
   */
  public async sendMessage(options: SendMessageOptions): Promise<MessageResponse> {
    const { companyId, channelId, to, message, template, media, ticketId } = options;
    
    const provider = this.getProvider(companyId, channelId);
    if (!provider) {
      throw new Error(`Channel ${channelId} not initialized`);
    }
    
    let response: MessageResponse;
    
    try {
      if (template) {
        // Send template message
        response = await provider.sendTemplate(to, template);
      } else if (media) {
        // Send media message
        response = await provider.sendMedia(to, media);
      } else if (message) {
        // Send regular message
        response = await provider.sendMessage(to, message);
      } else {
        throw new Error('No message content provided');
      }
      
      // Save message to database if successful
      if (response.success && response.messageId) {
        await this.saveOutgoingMessage({
          channelId,
          messageId: response.messageId,
          ticketId,
          to,
          body: message?.text,
          mediaUrl: media?.url,
          mediaType: media?.type,
          template: template?.name,
          status: response.status || 'sent'
        });
      }
      
      return response;
    } catch (error) {
      logger.error(`Error sending message through channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming webhook for a channel
   */
  public async handleWebhook(channelId: number, payload: any): Promise<void> {
    try {
      // Get channel from database
      const channel = await Channel.findByPk(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }
      
      const provider = this.getProvider(channel.companyId, channelId);
      if (!provider) {
        // Initialize channel if not already initialized
        await this.initializeChannel(channel);
        const newProvider = this.getProvider(channel.companyId, channelId);
        if (!newProvider) {
          throw new Error(`Failed to initialize channel ${channelId}`);
        }
        await newProvider.handleWebhook(payload);
      } else {
        await provider.handleWebhook(payload);
      }
    } catch (error) {
      logger.error(`Error handling webhook for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get status of a channel
   */
  public async getChannelStatus(companyId: number, channelId: number): Promise<ChannelStatus> {
    const provider = this.getProvider(companyId, channelId);
    if (!provider) {
      return {
        connected: false,
        error: 'Channel not initialized'
      };
    }
    
    return provider.getStatus();
  }

  /**
   * Disconnect a channel
   */
  public async disconnectChannel(companyId: number, channelId: number): Promise<void> {
    const key = this.getChannelKey(companyId, channelId);
    const provider = this.providers[key];
    
    if (provider) {
      await provider.disconnect();
      delete this.providers[key];
      
      this.emit('channelDisconnected', {
        channelId,
        companyId
      });
    }
  }

  /**
   * Reconnect a channel
   */
  public async reconnectChannel(companyId: number, channelId: number): Promise<void> {
    await this.disconnectChannel(companyId, channelId);
    
    const channel = await Channel.findOne({
      where: { id: channelId, companyId }
    });
    
    if (channel) {
      await this.initializeChannel(channel);
    }
  }

  /**
   * Initialize all active channels for a company
   */
  public async initializeCompanyChannels(companyId: number): Promise<void> {
    try {
      const channels = await Channel.findAll({
        where: {
          companyId,
          isActive: true
        }
      });
      
      logger.info(`Initializing ${channels.length} channels for company ${companyId}`);
      
      // Initialize channels in parallel
      await Promise.all(
        channels.map(channel => 
          this.initializeChannel(channel).catch(error => {
            logger.error(`Failed to initialize channel ${channel.id}:`, error);
          })
        )
      );
    } catch (error) {
      logger.error(`Error initializing company channels:`, error);
      throw error;
    }
  }

  /**
   * Get all initialized channels for a company
   */
  public getCompanyChannels(companyId: number): ChannelProvider[] {
    const channels: ChannelProvider[] = [];
    
    for (const key in this.providers) {
      if (key.startsWith(`${companyId}_`)) {
        channels.push(this.providers[key]);
      }
    }
    
    return channels;
  }

  /**
   * Validate identifier for a specific channel
   */
  public async validateIdentifier(
    companyId: number,
    channelId: number,
    identifier: string
  ): Promise<boolean> {
    const provider = this.getProvider(companyId, channelId);
    if (!provider) {
      throw new Error(`Channel ${channelId} not initialized`);
    }
    
    return provider.validateIdentifier(identifier);
  }

  /**
   * Get message status
   */
  public async getMessageStatus(
    companyId: number,
    channelId: number,
    messageId: string
  ): Promise<string> {
    const provider = this.getProvider(companyId, channelId);
    if (!provider) {
      return 'unknown';
    }
    
    return provider.getMessageStatus(messageId);
  }

  /**
   * Get statistics for all channels
   */
  public getStatistics(): any {
    const stats = {
      totalChannels: Object.keys(this.providers).length,
      channelsByType: {} as any,
      totalMessages: {
        sent: 0,
        received: 0,
        failed: 0
      }
    };
    
    for (const provider of Object.values(this.providers)) {
      const info = provider.getChannelInfo();
      const messageStats = provider.getMessageStats();
      
      // Count by type
      if (!stats.channelsByType[info.type]) {
        stats.channelsByType[info.type] = 0;
      }
      stats.channelsByType[info.type]++;
      
      // Sum message counts
      stats.totalMessages.sent += messageStats.sent;
      stats.totalMessages.received += messageStats.received;
      stats.totalMessages.failed += messageStats.failed;
    }
    
    return stats;
  }

  /**
   * Cleanup and disconnect all channels
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Channel Manager...');
    
    const disconnectPromises = [];
    
    for (const key in this.providers) {
      const provider = this.providers[key];
      disconnectPromises.push(
        provider.disconnect().catch(error => {
          logger.error(`Error disconnecting provider ${key}:`, error);
        })
      );
    }
    
    await Promise.all(disconnectPromises);
    this.providers = {};
    
    logger.info('Channel Manager shutdown complete');
  }

  // Private helper methods

  /**
   * Generate unique key for channel
   */
  private getChannelKey(companyId: number, channelId: number): string {
    return `${companyId}_${channelId}`;
  }

  /**
   * Setup global event handlers
   */
  private setupEventHandlers(): void {
    // Handle process termination
    process.on('SIGTERM', async () => {
      await this.shutdown();
    });
    
    process.on('SIGINT', async () => {
      await this.shutdown();
    });
  }

  /**
   * Handle incoming message from provider
   */
  private async handleIncomingMessage(data: any): Promise<void> {
    try {
      // Additional processing if needed
      logger.info('Incoming message received:', {
        channelId: data.channelId,
        from: data.message?.from,
        type: data.message?.mediaType || 'text'
      });
      
      // TODO: Create or update ticket
      // TODO: Send to queue system
      // TODO: Trigger automations
    } catch (error) {
      logger.error('Error handling incoming message:', error);
    }
  }

  /**
   * Update message status in database
   */
  private async updateMessageStatus(data: any): Promise<void> {
    try {
      const { channelId, messageId, status } = data;
      
      await ChannelMessage.update(
        { status },
        {
          where: {
            channelId,
            messageId
          }
        }
      );
      
      logger.debug(`Message ${messageId} status updated to ${status}`);
    } catch (error) {
      logger.error('Error updating message status:', error);
    }
  }

  /**
   * Update channel status in database
   */
  private async updateChannelStatus(data: any): Promise<void> {
    try {
      const { channelId, status } = data;
      
      await Channel.update(
        { status },
        { where: { id: channelId } }
      );
      
      logger.info(`Channel ${channelId} status updated to ${status}`);
    } catch (error) {
      logger.error('Error updating channel status:', error);
    }
  }

  /**
   * Save outgoing message to database
   */
  private async saveOutgoingMessage(data: any): Promise<void> {
    try {
      await ChannelMessage.create({
        ...data,
        fromMe: true,
        createdAt: new Date()
      });
    } catch (error) {
      logger.error('Error saving outgoing message:', error);
    }
  }
}

// Export singleton instance
export default ChannelManager.getInstance();
