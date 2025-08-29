import { getChannelManager } from '../../../../channels/bootstrap';
import { ChannelType } from '../../../../channels/models/Channel';
import ChannelConnection from '../../../../channels/models/ChannelConnection';
import Channel from '../../../../channels/models/Channel';
import WebhookSecurityService from './webhook-security.service';
import { getTicketAdapterService } from './whatsapp-ticket-adapter.service';
import WhatsAppCacheService from './whatsapp-cache.service';
import { logger } from '../utils/logger';

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          context?: {
            from: string;
            id: string;
          };
          text?: { body: string };
          image?: {
            caption?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          video?: {
            caption?: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          audio?: {
            mime_type: string;
            sha256: string;
            id: string;
            voice: boolean;
          };
          document?: {
            caption?: string;
            filename: string;
            mime_type: string;
            sha256: string;
            id: string;
          };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
          contacts?: Array<{
            name: { formatted_name: string };
            phones: Array<{ phone: string; type?: string }>;
          }>;
          button?: {
            payload: string;
            text: string;
          };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            origin: { type: string };
          };
          pricing?: {
            billable: boolean;
            pricing_model: string;
            category: string;
          };
          errors?: Array<{
            code: number;
            title: string;
            message?: string;
            error_data?: {
              details: string;
            };
          }>;
        }>;
        errors?: Array<{
          code: number;
          title: string;
          message?: string;
          error_data?: {
            details: string;
          };
        }>;
      };
    }>;
  }>;
}

export interface ProcessedMessage {
  connectionId: number;
  companyId: number;
  messageId: string;
  from: string;
  to: string;
  timestamp: Date;
  type: string;
  content: any;
  context?: {
    quotedMessageId?: string;
    quotedFrom?: string;
  };
}

export interface ProcessedStatus {
  connectionId: number;
  companyId: number;
  messageId: string;
  status: string;
  timestamp: Date;
  recipientId: string;
  errors?: any[];
}

/**
 * WhatsApp Webhook Processor Service
 * Processes incoming webhooks from WhatsApp Cloud API
 */
export class WhatsAppWebhookProcessor {
  private channelManager = getChannelManager();
  private ticketAdapter = getTicketAdapterService();
  private cacheService = WhatsAppCacheService;

  /**
   * Process webhook payload completely
   */
  async processWebhook(
    payload: WhatsAppWebhookPayload,
    signature: string,
    sourceIP: string
  ): Promise<void> {
    logger.info('Processing WhatsApp webhook', {
      entriesCount: payload.entry?.length || 0,
      sourceIP
    });

    // Process each entry in the webhook
    for (const entry of payload.entry) {
      await this.processEntry(entry);
    }
  }

  /**
   * Process a single entry from webhook
   */
  private async processEntry(entry: WhatsAppWebhookPayload['entry'][0]): Promise<void> {
    logger.debug('Processing webhook entry', {
      entryId: entry.id,
      changesCount: entry.changes.length
    });

    for (const change of entry.changes) {
      await this.processChange(change);
    }
  }

  /**
   * Process a single change from webhook entry
   */
  private async processChange(change: WhatsAppWebhookPayload['entry'][0]['changes'][0]): Promise<void> {
    const { field, value } = change;
    
    logger.debug('Processing webhook change', {
      field,
      phoneNumberId: value.metadata?.phone_number_id
    });

    // Find connection by phone number ID
    const connection = await this.findConnectionByPhoneNumberId(
      value.metadata.phone_number_id
    );

    if (!connection) {
      logger.warn('No connection found for phone number ID', {
        phoneNumberId: value.metadata.phone_number_id,
        field
      });
      return;
    }

    // Route to appropriate processor based on field
    switch (field) {
      case 'messages':
        await this.processMessages(value, connection);
        break;
      case 'message_template_status_update':
        await this.processTemplateStatusUpdate(value, connection);
        break;
      case 'account_alerts':
        await this.processAccountAlerts(value, connection);
        break;
      case 'phone_number_quality_update':
        await this.processPhoneNumberQualityUpdate(value, connection);
        break;
      default:
        logger.info('Unhandled webhook field type', {
          field,
          connectionId: connection.id
        });
    }
  }

  /**
   * Process messages from webhook
   */
  private async processMessages(
    value: WhatsAppWebhookPayload['entry'][0]['changes'][0]['value'],
    connection: any
  ): Promise<void> {
    const { messages, statuses, contacts } = value;

    // Process contacts information
    if (contacts && contacts.length > 0) {
      await this.processContacts(contacts, connection);
    }

    // Process incoming messages
    if (messages && messages.length > 0) {
      for (const message of messages) {
        await this.processIncomingMessage(message, connection);
      }
    }

    // Process message statuses
    if (statuses && statuses.length > 0) {
      for (const status of statuses) {
        await this.processMessageStatus(status, connection);
      }
    }
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(
    message: any,
    connection: any
  ): Promise<void> {
    try {
      const processedMessage: ProcessedMessage = {
        connectionId: connection.id,
        companyId: connection.companyId,
        messageId: message.id,
        from: message.from,
        to: connection.configuration.phoneNumberId,
        timestamp: new Date(parseInt(message.timestamp) * 1000),
        type: message.type,
        content: this.extractMessageContent(message),
        context: message.context ? {
          quotedMessageId: message.context.id,
          quotedFrom: message.context.from
        } : undefined
      };

      logger.info('Processing incoming WhatsApp message', {
        connectionId: connection.id,
        messageId: message.id,
        from: message.from,
        type: message.type
      });

      // Process message through ticket adapter
      const adapterResult = await this.ticketAdapter.processIncomingMessage(processedMessage);
      
      if (adapterResult.success) {
        logger.info('Message integrated with ticket system', {
          messageId: message.id,
          ticketId: adapterResult.ticket?.id,
          connectionId: connection.id
        });
      } else {
        logger.error('Failed to integrate message with ticket system', {
          error: adapterResult.error,
          messageId: message.id,
          connectionId: connection.id
        });
      }

      // Emit event for message processing (for other integrations)
      this.channelManager.emit('messageReceived', {
        connectionId: connection.id,
        companyId: connection.companyId,
        message: processedMessage,
        ticketResult: adapterResult,
        metadata: {
          phoneNumberId: connection.configuration.phoneNumberId,
          displayPhoneNumber: connection.configuration.displayPhoneNumber
        }
      });

      // Auto-mark message as read if configured
      if (connection.configuration.autoMarkAsRead !== false) {
        await this.markMessageAsRead(message.id, connection);
      }

    } catch (error) {
      logger.error('Error processing incoming message', {
        error: error instanceof Error ? error.message : String(error),
        messageId: message.id,
        connectionId: connection.id
      });
    }
  }

  /**
   * Process message status update
   */
  private async processMessageStatus(
    status: any,
    connection: any
  ): Promise<void> {
    try {
      const processedStatus: ProcessedStatus = {
        connectionId: connection.id,
        companyId: connection.companyId,
        messageId: status.id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000),
        recipientId: status.recipient_id,
        errors: status.errors
      };

      logger.info('Processing message status update', {
        connectionId: connection.id,
        messageId: status.id,
        status: status.status,
        recipientId: status.recipient_id
      });

      // Process status update through ticket adapter
      await this.ticketAdapter.processStatusUpdate(processedStatus);

      // Emit event for status update processing
      this.channelManager.emit('messageStatusUpdate', {
        connectionId: connection.id,
        companyId: connection.companyId,
        statusUpdate: processedStatus
      });

    } catch (error) {
      logger.error('Error processing message status', {
        error: error instanceof Error ? error.message : String(error),
        messageId: status.id,
        connectionId: connection.id
      });
    }
  }

  /**
   * Process contacts information
   */
  private async processContacts(
    contacts: any[],
    connection: any
  ): Promise<void> {
    for (const contact of contacts) {
      logger.debug('Processing contact update', {
        waId: contact.wa_id,
        name: contact.profile?.name,
        connectionId: connection.id
      });

      // Process contact update through ticket adapter
      await this.ticketAdapter.processContactUpdate(
        {
          waId: contact.wa_id,
          profile: contact.profile
        },
        connection.id,
        connection.companyId
      );

      // Emit event for contact processing
      this.channelManager.emit('contactUpdate', {
        connectionId: connection.id,
        companyId: connection.companyId,
        contact: {
          waId: contact.wa_id,
          profile: contact.profile
        }
      });
    }
  }

  /**
   * Process template status updates
   */
  private async processTemplateStatusUpdate(
    value: any,
    connection: any
  ): Promise<void> {
    logger.info('Template status update received', {
      connectionId: connection.id,
      companyId: connection.companyId
    });

    // Emit event for template status processing
    this.channelManager.emit('templateStatusUpdate', {
      connectionId: connection.id,
      companyId: connection.companyId,
      update: value
    });
  }

  /**
   * Process account alerts
   */
  private async processAccountAlerts(
    value: any,
    connection: any
  ): Promise<void> {
    logger.warn('Account alert received', {
      connectionId: connection.id,
      companyId: connection.companyId,
      alert: value
    });

    // Emit event for alert processing
    this.channelManager.emit('accountAlert', {
      connectionId: connection.id,
      companyId: connection.companyId,
      alert: value
    });
  }

  /**
   * Process phone number quality updates
   */
  private async processPhoneNumberQualityUpdate(
    value: any,
    connection: any
  ): Promise<void> {
    logger.info('Phone number quality update received', {
      connectionId: connection.id,
      companyId: connection.companyId,
      quality: value
    });

    // Emit event for quality update processing
    this.channelManager.emit('phoneNumberQualityUpdate', {
      connectionId: connection.id,
      companyId: connection.companyId,
      qualityUpdate: value
    });
  }

  /**
   * Find connection by phone number ID (with caching)
   */
  private async findConnectionByPhoneNumberId(phoneNumberId: string): Promise<any> {
    try {
      // First try to get from cache
      const cachedConnection = await this.cacheService.getConnection(phoneNumberId);
      
      if (cachedConnection) {
        logger.debug('Using cached connection', { phoneNumberId });
        return {
          id: cachedConnection.id,
          companyId: cachedConnection.companyId,
          configuration: cachedConnection.configuration,
          capabilities: cachedConnection.capabilities,
          rateLimit: cachedConnection.rateLimit
        };
      }

      // If not in cache, fetch from database
      const connection = await ChannelConnection.findOne({
        where: {
          configuration: {
            phoneNumberId: phoneNumberId
          }
        },
        include: [
          {
            model: Channel,
            as: 'channel',
            where: {
              type: ChannelType.WHATSAPP_CLOUD
            }
          }
        ]
      });

      return connection;

    } catch (error) {
      logger.error('Error finding connection by phone number ID', {
        error: error instanceof Error ? error.message : String(error),
        phoneNumberId
      });
      return null;
    }
  }

  /**
   * Extract message content based on message type
   */
  private extractMessageContent(message: any): any {
    switch (message.type) {
      case 'text':
        return {
          text: message.text?.body || ''
        };

      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        return {
          media: {
            id: message[message.type]?.id,
            mimeType: message[message.type]?.mime_type,
            sha256: message[message.type]?.sha256,
            caption: message[message.type]?.caption,
            filename: message[message.type]?.filename,
            voice: message[message.type]?.voice
          }
        };

      case 'location':
        return {
          location: {
            latitude: message.location.latitude,
            longitude: message.location.longitude,
            name: message.location.name,
            address: message.location.address
          }
        };

      case 'contacts':
        return {
          contacts: message.contacts
        };

      case 'button':
        return {
          button: {
            payload: message.button.payload,
            text: message.button.text
          }
        };

      case 'interactive':
        return {
          interactive: {
            type: message.interactive.type,
            buttonReply: message.interactive.button_reply,
            listReply: message.interactive.list_reply
          }
        };

      default:
        logger.warn('Unknown message type', {
          type: message.type,
          messageId: message.id
        });
        return { raw: message };
    }
  }

  /**
   * Mark message as read
   */
  private async markMessageAsRead(messageId: string, connection: any): Promise<void> {
    try {
      // This would call the WhatsApp Cloud Provider to mark as read
      // For now, we'll just emit an event
      this.channelManager.emit('markMessageAsRead', {
        connectionId: connection.id,
        messageId
      });

      logger.debug('Message marked as read', {
        messageId,
        connectionId: connection.id
      });

    } catch (error) {
      logger.error('Error marking message as read', {
        error: error instanceof Error ? error.message : String(error),
        messageId,
        connectionId: connection.id
      });
    }
  }

  /**
   * Validate webhook security
   */
  async validateWebhookSecurity(
    payload: string,
    signature: string | undefined,
    connection: any
  ): Promise<boolean> {
    if (!connection.configuration.appSecret) {
      logger.warn('No app secret configured for connection', {
        connectionId: connection.id
      });
      return false;
    }

    const verification = WebhookSecurityService.verifySignature(
      payload,
      signature,
      connection.configuration.appSecret
    );

    if (!verification.isValid) {
      logger.error('Webhook signature verification failed', {
        connectionId: connection.id,
        error: verification.error
      });
      return false;
    }

    return true;
  }
}

export default WhatsAppWebhookProcessor;