import { ProcessedMessage, ProcessedStatus } from './whatsapp-webhook-processor.service';
import { logger } from '../utils/logger';

// Import existing TucanLink models
import Contact from '../../../../models/Contact';
import Ticket from '../../../../models/Ticket';
import Message from '../../../../models/Message';
import Queue from '../../../../models/Queue';
import Company from '../../../../models/Company';

export interface TicketCreationResult {
  ticket: any;
  contact: any;
  message?: any;
  isNewTicket: boolean;
  isNewContact: boolean;
}

export interface MessageProcessingResult {
  success: boolean;
  ticket?: any;
  message?: any;
  error?: string;
}

/**
 * WhatsApp to Ticket Adapter Service
 * Handles integration between WhatsApp Cloud messages and TucanLink ticket system
 */
export class WhatsAppTicketAdapterService {
  
  /**
   * Process incoming WhatsApp message and convert to ticket/message
   */
  async processIncomingMessage(
    processedMessage: ProcessedMessage
  ): Promise<MessageProcessingResult> {
    try {
      logger.info('Processing WhatsApp message for ticket system', {
        messageId: processedMessage.messageId,
        from: processedMessage.from,
        connectionId: processedMessage.connectionId,
        companyId: processedMessage.companyId
      });

      // 1. Find or create contact
      const contact = await this.findOrCreateContact(
        processedMessage.from,
        processedMessage.companyId
      );

      // 2. Find or create ticket
      const ticketResult = await this.findOrCreateTicket(
        contact.id,
        processedMessage.companyId,
        processedMessage.connectionId
      );

      // 3. Create message in ticket
      const message = await this.createMessage(
        ticketResult.ticket,
        processedMessage,
        contact
      );

      // 4. Update ticket last activity
      await this.updateTicketActivity(ticketResult.ticket);

      logger.info('WhatsApp message processed successfully', {
        messageId: processedMessage.messageId,
        ticketId: ticketResult.ticket.id,
        contactId: contact.id,
        isNewTicket: ticketResult.isNewTicket
      });

      return {
        success: true,
        ticket: ticketResult.ticket,
        message,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to process WhatsApp message', {
        error: errorMessage,
        messageId: processedMessage.messageId,
        connectionId: processedMessage.connectionId
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Process message status update
   */
  async processStatusUpdate(
    statusUpdate: ProcessedStatus
  ): Promise<void> {
    try {
      logger.debug('Processing WhatsApp status update', {
        messageId: statusUpdate.messageId,
        status: statusUpdate.status,
        connectionId: statusUpdate.connectionId
      });

      // Find message by WhatsApp message ID
      const message = await Message.findOne({
        where: {
          wid: statusUpdate.messageId
        },
        include: [
          {
            model: Ticket,
            as: 'ticket'
          }
        ]
      });

      if (!message) {
        logger.warn('Message not found for status update', {
          messageId: statusUpdate.messageId
        });
        return;
      }

      // Update message status
      await message.update({
        ack: this.mapWhatsAppStatusToAck(statusUpdate.status),
        dataJson: JSON.stringify({
          ...message.dataJson ? JSON.parse(message.dataJson) : {},
          whatsappStatus: statusUpdate.status,
          whatsappStatusTimestamp: statusUpdate.timestamp,
          whatsappErrors: statusUpdate.errors
        })
      });

      logger.debug('Message status updated', {
        messageId: statusUpdate.messageId,
        status: statusUpdate.status,
        ack: this.mapWhatsAppStatusToAck(statusUpdate.status)
      });

    } catch (error) {
      logger.error('Failed to process status update', {
        error: error instanceof Error ? error.message : String(error),
        messageId: statusUpdate.messageId
      });
    }
  }

  /**
   * Find or create contact based on WhatsApp number
   */
  private async findOrCreateContact(
    whatsappNumber: string,
    companyId: number
  ): Promise<any> {
    try {
      // Clean phone number (remove + and any formatting)
      const cleanNumber = whatsappNumber.replace(/^\+/, '').replace(/\D/g, '');

      // Try to find existing contact
      let contact = await Contact.findOne({
        where: {
          number: cleanNumber,
          companyId
        }
      });

      if (!contact) {
        // Create new contact
        contact = await Contact.create({
          name: `WhatsApp ${cleanNumber}`,
          number: cleanNumber,
          companyId,
          isGroup: false,
          channel: 'whatsapp_cloud' // Identify as WhatsApp Cloud contact
        });

        logger.info('New WhatsApp Cloud contact created', {
          contactId: contact.id,
          number: cleanNumber,
          companyId
        });
      }

      return contact;

    } catch (error) {
      logger.error('Error finding/creating contact', {
        error: error instanceof Error ? error.message : String(error),
        whatsappNumber,
        companyId
      });
      throw error;
    }
  }

  /**
   * Find or create ticket for contact
   */
  private async findOrCreateTicket(
    contactId: number,
    companyId: number,
    connectionId: number
  ): Promise<{ ticket: any; isNewTicket: boolean }> {
    try {
      // First, try to find an existing open ticket
      let ticket = await Ticket.findOne({
        where: {
          contactId,
          companyId,
          status: 'open'
        },
        include: [
          {
            model: Contact,
            as: 'contact'
          },
          {
            model: Queue,
            as: 'queue'
          }
        ]
      });

      if (ticket) {
        return { ticket, isNewTicket: false };
      }

      // If no open ticket, create new one
      const defaultQueue = await this.getDefaultQueue(companyId);
      
      ticket = await Ticket.create({
        contactId,
        companyId,
        queueId: defaultQueue?.id || null,
        userId: null, // Will be assigned when agent responds
        status: 'open',
        isGroup: false,
        channel: 'whatsapp_cloud', // Identify source channel
        dataJson: JSON.stringify({
          whatsappConnectionId: connectionId,
          source: 'whatsapp_cloud'
        })
      });

      // Reload with associations
      ticket = await Ticket.findByPk(ticket.id, {
        include: [
          {
            model: Contact,
            as: 'contact'
          },
          {
            model: Queue,
            as: 'queue'
          }
        ]
      });

      logger.info('New WhatsApp Cloud ticket created', {
        ticketId: ticket.id,
        contactId,
        companyId,
        connectionId
      });

      return { ticket, isNewTicket: true };

    } catch (error) {
      logger.error('Error finding/creating ticket', {
        error: error instanceof Error ? error.message : String(error),
        contactId,
        companyId
      });
      throw error;
    }
  }

  /**
   * Create message in ticket
   */
  private async createMessage(
    ticket: any,
    processedMessage: ProcessedMessage,
    contact: any
  ): Promise<any> {
    try {
      const messageBody = this.extractMessageBody(processedMessage);
      const mediaData = this.extractMediaData(processedMessage);

      const message = await Message.create({
        ticketId: ticket.id,
        contactId: contact.id,
        body: messageBody,
        fromMe: false,
        read: false,
        quotedMsgId: processedMessage.context?.quotedMessageId || null,
        wid: processedMessage.messageId, // WhatsApp message ID
        ack: 0, // Received
        dataJson: JSON.stringify({
          whatsappMessageId: processedMessage.messageId,
          whatsappFrom: processedMessage.from,
          whatsappTo: processedMessage.to,
          whatsappType: processedMessage.type,
          whatsappContent: processedMessage.content,
          whatsappContext: processedMessage.context,
          whatsappTimestamp: processedMessage.timestamp,
          connectionId: processedMessage.connectionId,
          source: 'whatsapp_cloud',
          ...mediaData
        }),
        mediaUrl: mediaData.mediaUrl || null,
        mediaType: this.mapWhatsAppTypeToMediaType(processedMessage.type),
        timestamp: processedMessage.timestamp
      });

      return message;

    } catch (error) {
      logger.error('Error creating message', {
        error: error instanceof Error ? error.message : String(error),
        ticketId: ticket.id,
        messageId: processedMessage.messageId
      });
      throw error;
    }
  }

  /**
   * Extract message body from processed message
   */
  private extractMessageBody(processedMessage: ProcessedMessage): string {
    switch (processedMessage.type) {
      case 'text':
        return processedMessage.content.text || '';

      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        return processedMessage.content.media?.caption || 
               `📎 ${processedMessage.type.toUpperCase()} file received`;

      case 'location':
        const loc = processedMessage.content.location;
        return `📍 Location shared: ${loc?.name || ''}\n${loc?.address || ''}\nLat: ${loc?.latitude}, Lng: ${loc?.longitude}`;

      case 'contacts':
        const contacts = processedMessage.content.contacts;
        return `👤 Contact(s) shared: ${contacts?.length || 0} contact(s)`;

      case 'button':
        const button = processedMessage.content.button;
        return `🔘 Button clicked: "${button?.text}" (${button?.payload})`;

      case 'interactive':
        const interactive = processedMessage.content.interactive;
        if (interactive?.buttonReply) {
          return `🔘 Button: "${interactive.buttonReply.title}" (${interactive.buttonReply.id})`;
        }
        if (interactive?.listReply) {
          return `📋 List: "${interactive.listReply.title}" (${interactive.listReply.id})`;
        }
        return '🔄 Interactive message received';

      default:
        return `📱 ${processedMessage.type} message received`;
    }
  }

  /**
   * Extract media data from processed message
   */
  private extractMediaData(processedMessage: ProcessedMessage): any {
    if (!['image', 'video', 'audio', 'document'].includes(processedMessage.type)) {
      return {};
    }

    const media = processedMessage.content.media;
    if (!media) {
      return {};
    }

    return {
      mediaUrl: media.id ? `whatsapp-media://${media.id}` : null, // Use media ID reference
      mediaType: processedMessage.type,
      mediaData: {
        whatsappMediaId: media.id,
        mimeType: media.mimeType,
        sha256: media.sha256,
        filename: media.filename,
        caption: media.caption,
        voice: media.voice
      }
    };
  }

  /**
   * Map WhatsApp message type to TucanLink media type
   */
  private mapWhatsAppTypeToMediaType(type: string): string | null {
    switch (type) {
      case 'image':
        return 'image';
      case 'video':
        return 'video';
      case 'audio':
        return 'audio';
      case 'document':
        return 'application';
      default:
        return null;
    }
  }

  /**
   * Map WhatsApp status to TucanLink ACK status
   */
  private mapWhatsAppStatusToAck(status: string): number {
    switch (status) {
      case 'sent':
        return 1;
      case 'delivered':
        return 2;
      case 'read':
        return 3;
      case 'failed':
        return -1;
      default:
        return 0;
    }
  }

  /**
   * Update ticket last activity
   */
  private async updateTicketActivity(ticket: any): Promise<void> {
    try {
      await ticket.update({
        updatedAt: new Date()
      });
    } catch (error) {
      logger.warn('Failed to update ticket activity', {
        error: error instanceof Error ? error.message : String(error),
        ticketId: ticket.id
      });
    }
  }

  /**
   * Get default queue for company
   */
  private async getDefaultQueue(companyId: number): Promise<any> {
    try {
      const queue = await Queue.findOne({
        where: {
          companyId,
          // Try to find a queue marked as default, or just get the first one
        },
        order: [['id', 'ASC']]
      });

      return queue;

    } catch (error) {
      logger.warn('Failed to get default queue', {
        error: error instanceof Error ? error.message : String(error),
        companyId
      });
      return null;
    }
  }

  /**
   * Handle contact profile updates from WhatsApp
   */
  async processContactUpdate(
    contactData: { waId: string; profile?: { name?: string } },
    connectionId: number,
    companyId: number
  ): Promise<void> {
    try {
      const cleanNumber = contactData.waId.replace(/^\+/, '').replace(/\D/g, '');
      
      const contact = await Contact.findOne({
        where: {
          number: cleanNumber,
          companyId
        }
      });

      if (contact && contactData.profile?.name) {
        // Only update if the current name is auto-generated
        if (contact.name.startsWith('WhatsApp ')) {
          await contact.update({
            name: contactData.profile.name
          });

          logger.info('Contact name updated from WhatsApp profile', {
            contactId: contact.id,
            oldName: contact.name,
            newName: contactData.profile.name
          });
        }
      }

    } catch (error) {
      logger.error('Failed to process contact update', {
        error: error instanceof Error ? error.message : String(error),
        waId: contactData.waId,
        companyId
      });
    }
  }

  /**
   * Send outgoing message through WhatsApp Cloud (from ticket system)
   */
  async sendOutgoingMessage(
    ticketId: number,
    messageBody: string,
    mediaUrl?: string,
    mediaType?: string
  ): Promise<MessageProcessingResult> {
    try {
      // This would be called when an agent sends a message from the TucanLink interface
      // and needs to be sent through WhatsApp Cloud
      
      const ticket = await Ticket.findByPk(ticketId, {
        include: [
          {
            model: Contact,
            as: 'contact'
          }
        ]
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Extract connection ID from ticket data
      const ticketData = ticket.dataJson ? JSON.parse(ticket.dataJson) : {};
      const connectionId = ticketData.whatsappConnectionId;

      if (!connectionId) {
        throw new Error('No WhatsApp connection ID found for ticket');
      }

      // This would integrate with the message queue service
      // to send the message through WhatsApp Cloud
      logger.info('Outgoing message prepared for WhatsApp Cloud', {
        ticketId,
        connectionId,
        to: ticket.contact.number,
        hasMedia: !!mediaUrl
      });

      return {
        success: true,
        ticket
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to send outgoing message', {
        error: errorMessage,
        ticketId
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }
}

// Singleton instance
let adapterInstance: WhatsAppTicketAdapterService;

/**
 * Get singleton instance of WhatsApp ticket adapter
 */
export function getTicketAdapterService(): WhatsAppTicketAdapterService {
  if (!adapterInstance) {
    adapterInstance = new WhatsAppTicketAdapterService();
  }
  return adapterInstance;
}

export default WhatsAppTicketAdapterService;