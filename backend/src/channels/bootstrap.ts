import ChannelManager from './services/ChannelManager';
import { ChannelType } from './models/Channel';
import WhatsAppCloudProvider from './providers/whatsapp/WhatsAppCloudProvider';
import { logger } from '../utils/logger';
import { initializeMessageQueueService, shutdownMessageQueueService } from '../api/bridge/v1/services/whatsapp-message-queue.service';

/**
 * Channel system bootstrap
 * Registers all available channel providers
 */
export class ChannelBootstrap {
  private static instance: ChannelBootstrap;
  private channelManager: ChannelManager;
  private initialized = false;

  private constructor() {
    this.channelManager = new ChannelManager();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ChannelBootstrap {
    if (!ChannelBootstrap.instance) {
      ChannelBootstrap.instance = new ChannelBootstrap();
    }
    return ChannelBootstrap.instance;
  }

  /**
   * Get the channel manager instance
   */
  getChannelManager(): ChannelManager {
    if (!this.initialized) {
      throw new Error('Channel system not initialized. Call initialize() first.');
    }
    return this.channelManager;
  }

  /**
   * Initialize the channel system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('Channel system already initialized');
      return;
    }

    try {
      logger.info('Initializing channel system...');

      // Register WhatsApp Cloud Provider
      await this.registerWhatsAppCloudProvider();

      // TODO: Register other providers as they're implemented
      // await this.registerInstagramDirectProvider();
      // await this.registerFacebookMessengerProvider();
      // await this.registerTelegramProvider();

      // Initialize message queue service
      initializeMessageQueueService();
      logger.info('Message queue service initialized');

      this.initialized = true;
      logger.info('Channel system initialized successfully');

      // Set up global event handlers
      this.setupGlobalEventHandlers();

    } catch (error) {
      logger.error('Failed to initialize channel system:', error);
      throw error;
    }
  }

  /**
   * Register WhatsApp Cloud Provider
   */
  private async registerWhatsAppCloudProvider(): Promise<void> {
    try {
      const provider = new WhatsAppCloudProvider();
      this.channelManager.registerProvider(ChannelType.WHATSAPP_CLOUD, provider);
      
      logger.info('WhatsApp Cloud Provider registered successfully');
    } catch (error) {
      logger.error('Failed to register WhatsApp Cloud Provider:', error);
      throw error;
    }
  }

  /**
   * Setup global event handlers for channel manager
   */
  private setupGlobalEventHandlers(): void {
    // Connection events
    this.channelManager.on('connectionCreated', (data) => {
      logger.info('Channel connection created', data);
    });

    this.channelManager.on('connectionUpdated', (data) => {
      logger.info('Channel connection updated', { connectionId: data.id, type: data.type });
    });

    this.channelManager.on('connectionDeleted', (data) => {
      logger.info('Channel connection deleted', data);
    });

    this.channelManager.on('channelConnected', (data) => {
      logger.info('Channel connected', data);
    });

    this.channelManager.on('channelDisconnected', (data) => {
      logger.info('Channel disconnected', data);
    });

    // Message events
    this.channelManager.on('messageReceived', (data) => {
      logger.info('Message received from channel', {
        connectionId: data.connectionId,
        from: data.message?.from,
        type: data.message?.type
      });

      // TODO: Integrate with existing ticket/message system
      // This would call the existing TucanLink message processing logic
    });

    this.channelManager.on('messageSent', (data) => {
      logger.info('Message sent via channel', {
        connectionId: data.connectionId,
        messageId: data.messageId
      });
    });

    this.channelManager.on('messageFailed', (data) => {
      logger.warn('Message failed via channel', {
        connectionId: data.connectionId,
        error: data.error
      });
    });

    // Status change events
    this.channelManager.on('connectionStatusChange', (data) => {
      logger.info('Channel connection status changed', data);
    });

    // Provider registration events
    this.channelManager.on('providerRegistered', (data) => {
      logger.info('Channel provider registered', data);
    });

    // Webhook events
    this.channelManager.on('webhookProcessed', (data) => {
      logger.info('Webhook processed', {
        connectionId: data.connectionId,
        eventType: data.payload.eventType
      });
    });
  }

  /**
   * Shutdown the channel system
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      logger.info('Shutting down channel system...');
      
      // Shutdown message queue service first
      await shutdownMessageQueueService();
      logger.info('Message queue service shut down');
      
      await this.channelManager.shutdown();
      this.initialized = false;
      logger.info('Channel system shut down successfully');
    } catch (error) {
      logger.error('Error during channel system shutdown:', error);
      throw error;
    }
  }

  /**
   * Check if system is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Global bootstrap instance
 */
export const channelBootstrap = ChannelBootstrap.getInstance();

/**
 * Helper function to get channel manager
 */
export function getChannelManager(): ChannelManager {
  return channelBootstrap.getChannelManager();
}

/**
 * Helper function to initialize channels
 */
export async function initializeChannels(): Promise<void> {
  await channelBootstrap.initialize();
}

/**
 * Helper function to shutdown channels
 */
export async function shutdownChannels(): Promise<void> {
  await channelBootstrap.shutdown();
}

export default ChannelBootstrap;