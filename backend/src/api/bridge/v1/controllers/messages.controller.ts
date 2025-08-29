import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Message from '../../../../models/Message';
import Ticket from '../../../../models/Ticket';
import Contact from '../../../../models/Contact';
import Queue from '../../../../models/Queue';
import User from '../../../../models/User';
import SendWhatsAppMessage from '../../../../services/WbotServices/SendWhatsAppMessage';
import SendWhatsAppMedia from '../../../../services/WbotServices/SendWhatsAppMedia';
import ShowTicketService from '../../../../services/TicketServices/ShowTicketService';
import SetTicketMessagesAsRead from '../../../../helpers/SetTicketMessagesAsRead';
import { logger } from '../utils/logger';
import { getIO } from '../../../../libs/socket';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Messages Controller for API Bridge
 * Provides RESTful endpoints for WhatsApp message management
 */
export class MessagesController {
  /**
   * Send a WhatsApp message
   * POST /api/bridge/v1/messages
   */
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId, body, quotedMessageId, mediaUrl } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!ticketId || !body) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ticketId and body are required',
        });
        return;
      }

      // Get ticket with validation
      const ticket = await ShowTicketService(ticketId, companyId);

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      // Handle quoted message if provided
      let quotedMsg;
      if (quotedMessageId) {
        quotedMsg = await Message.findOne({
          where: {
            id: quotedMessageId,
            ticketId,
          },
        });
      }

      // Send message using core service
      let sentMessage;
      if (mediaUrl) {
        // Handle media message (not implemented in this version)
        res.status(501).json({
          error: 'Not Implemented',
          message: 'Media messages not yet supported in this version',
        });
        return;
      } else {
        sentMessage = await SendWhatsAppMessage({
          body,
          ticket,
          quotedMsg,
        });
      }

      // Emit socket event for real-time updates
      const io = getIO();
      io.to(ticketId.toString()).emit(`company-${companyId}-appMessage`, {
        action: 'create',
        message: sentMessage,
        ticket,
        contact: ticket.contact,
      });

      res.status(201).json({
        success: true,
        data: {
          messageId: sentMessage.key.id,
          status: 'sent',
          timestamp: new Date().toISOString(),
        },
        message: 'Message sent successfully',
      });
    } catch (error) {
      logger.error('Failed to send message', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to send message',
      });
    }
  }

  /**
   * List messages with filtering and pagination
   * GET /api/bridge/v1/messages
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        ticketId,
        page = 1,
        limit = 20,
        fromMe,
        startDate,
        endDate,
        sortOrder = 'DESC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (ticketId) {
        whereConditions.ticketId = Number(ticketId);
      }

      if (fromMe !== undefined) {
        whereConditions.fromMe = fromMe === 'true';
      }

      // Date range filter
      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) {
          whereConditions.createdAt[Op.gte] = new Date(startDate as string);
        }
        if (endDate) {
          whereConditions.createdAt[Op.lte] = new Date(endDate as string);
        }
      }

      // Execute query
      const { count, rows: messages } = await Message.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'status', 'queueId'],
            include: [
              {
                model: Contact,
                as: 'contact',
                attributes: ['id', 'name', 'number', 'profilePicUrl'],
              },
            ],
          },
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['createdAt', sortOrder as string]],
        attributes: {
          exclude: ['dataJson'], // Exclude large JSON data field
        },
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages,
            hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to list messages', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list messages',
      });
    }
  }

  /**
   * Get messages by ticket ID
   * GET /api/bridge/v1/messages/ticket/:ticketId
   */
  async getByTicket(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      // Verify ticket exists and belongs to company
      const ticket = await Ticket.findOne({
        where: {
          id: Number(ticketId),
          ...(companyId && { companyId }),
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      // Get messages for the ticket
      const { count, rows: messages } = await Message.findAndCountAll({
        where: {
          ticketId: Number(ticketId),
        },
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number', 'profilePicUrl'],
          },
          {
            model: Message,
            as: 'quotedMsg',
            attributes: ['id', 'body', 'fromMe'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
        attributes: {
          exclude: ['dataJson'],
        },
      });

      // Mark messages as read
      await SetTicketMessagesAsRead(ticket);

      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          ticket: {
            id: ticket.id,
            status: ticket.status,
            unreadMessages: ticket.unreadMessages,
          },
          messages,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages,
            hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get messages by ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get messages',
      });
    }
  }

  /**
   * Mark messages as read
   * PUT /api/bridge/v1/messages/read
   */
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId, messageIds } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!ticketId && !messageIds) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ticketId or messageIds required',
        });
        return;
      }

      if (ticketId) {
        // Mark all messages in ticket as read
        const ticket = await Ticket.findOne({
          where: {
            id: ticketId,
            ...(companyId && { companyId }),
          },
        });

        if (!ticket) {
          res.status(404).json({
            error: 'Not Found',
            message: 'Ticket not found',
          });
          return;
        }

        await SetTicketMessagesAsRead(ticket);

        res.json({
          success: true,
          message: 'Messages marked as read',
        });
      } else if (messageIds && Array.isArray(messageIds)) {
        // Mark specific messages as read
        await Message.update(
          { read: true },
          {
            where: {
              id: {
                [Op.in]: messageIds,
              },
              ...(companyId && { companyId }),
            },
          }
        );

        res.json({
          success: true,
          message: 'Messages marked as read',
        });
      }
    } catch (error) {
      logger.error('Failed to mark messages as read', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark messages as read',
      });
    }
  }

  /**
   * Delete a message
   * DELETE /api/bridge/v1/messages/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const message = await Message.findOne({
        where: {
          id,
          ...(companyId && { companyId }),
        },
      });

      if (!message) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Message not found',
        });
        return;
      }

      // Soft delete by marking as deleted
      await message.update({ isDeleted: true });

      // Emit socket event for real-time updates
      const io = getIO();
      io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
        action: 'delete',
        messageId: message.id,
        ticketId: message.ticketId,
      });

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete message', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete message',
      });
    }
  }

  /**
   * Get message statistics
   * GET /api/bridge/v1/messages/stats
   */
  async stats(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) {
          whereConditions.createdAt[Op.gte] = new Date(startDate as string);
        }
        if (endDate) {
          whereConditions.createdAt[Op.lte] = new Date(endDate as string);
        }
      }

      // Get message statistics
      const totalMessages = await Message.count({ where: whereConditions });
      
      const sentMessages = await Message.count({
        where: { ...whereConditions, fromMe: true },
      });
      
      const receivedMessages = await Message.count({
        where: { ...whereConditions, fromMe: false },
      });
      
      const readMessages = await Message.count({
        where: { ...whereConditions, read: true },
      });
      
      const unreadMessages = await Message.count({
        where: { ...whereConditions, read: false, fromMe: false },
      });

      res.json({
        success: true,
        data: {
          total: totalMessages,
          sent: sentMessages,
          received: receivedMessages,
          read: readMessages,
          unread: unreadMessages,
          readRate: totalMessages > 0 ? (readMessages / totalMessages * 100).toFixed(2) + '%' : '0%',
        },
      });
    } catch (error) {
      logger.error('Failed to get message stats', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get message statistics',
      });
    }
  }
}

export const messagesController = new MessagesController();