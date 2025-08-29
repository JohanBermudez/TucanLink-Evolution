import { Request, Response } from 'express';
import { Op, WhereOptions, Includeable } from 'sequelize';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import sequelize from '../../../../database'; // Import existing database connection
import Ticket from '../../../../models/Ticket';
import Contact from '../../../../models/Contact';
import Queue from '../../../../models/Queue';
import User from '../../../../models/User';
import Tag from '../../../../models/Tag';
import Whatsapp from '../../../../models/Whatsapp';
import Message from '../../../../models/Message';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Tickets Controller for API Bridge
 * Provides RESTful endpoints for ticket management
 */
export class TicketsController {
  /**
   * List tickets with filtering, pagination, and sorting
   * GET /api/bridge/v1/tickets
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        userId,
        queueId,
        contactId,
        dateStart,
        dateEnd,
        searchParam,
        withUnreadMessages,
        sortBy = 'updatedAt',
        sortOrder = 'DESC',
        includeMessages = false,
        includeTags = true,
      } = req.query;

      // Get companyId from auth or query param (for testing)
      const companyId = req.companyId || (req.query.companyId ? Number(req.query.companyId) : undefined);
      const offset = (Number(page) - 1) * Number(limit);

      // Build where conditions
      const whereConditions: WhereOptions = {};
      
      // Only filter by company if companyId is provided
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      // Status filter
      if (status) {
        whereConditions.status = status as string;
      }

      // User filter
      if (userId) {
        whereConditions.userId = Number(userId);
      }

      // Queue filter
      if (queueId !== undefined) {
        if (queueId === 'null' || queueId === '') {
          whereConditions.queueId = null;
        } else {
          whereConditions.queueId = Number(queueId);
        }
      }

      // Contact filter
      if (contactId) {
        whereConditions.contactId = Number(contactId);
      }

      // Date range filter
      if (dateStart || dateEnd) {
        whereConditions.createdAt = {};
        if (dateStart) {
          (whereConditions.createdAt as any)[Op.gte] = startOfDay(parseISO(dateStart as string));
        }
        if (dateEnd) {
          (whereConditions.createdAt as any)[Op.lte] = endOfDay(parseISO(dateEnd as string));
        }
      }

      // Search in contact name or number
      if (searchParam) {
        whereConditions[Op.or] = [
          { '$contact.name$': { [Op.iLike]: `%${searchParam}%` } },
          { '$contact.number$': { [Op.iLike]: `%${searchParam}%` } },
          { lastMessage: { [Op.iLike]: `%${searchParam}%` } },
        ];
      }

      // Unread messages filter
      if (withUnreadMessages === 'true') {
        whereConditions.unreadMessages = { [Op.gt]: 0 };
      }

      // Build include conditions
      const includeConditions: Includeable[] = [
        {
          model: Contact,
          as: 'contact',
          attributes: ['id', 'name', 'number', 'email', 'profilePicUrl'],
          required: searchParam ? true : false,
        },
        {
          model: Queue,
          as: 'queue',
          attributes: ['id', 'name', 'color'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Whatsapp,
          as: 'whatsapp',
          attributes: ['id', 'name', 'status'],
        },
      ];

      // Include tags if requested
      if (includeTags === 'true' || includeTags === true) {
        includeConditions.push({
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        });
      }

      // Include recent messages if requested
      if (includeMessages === 'true' || includeMessages === true) {
        includeConditions.push({
          model: Message,
          as: 'messages',
          attributes: ['id', 'body', 'fromMe', 'read', 'createdAt'],
          limit: 5,
          order: [['createdAt', 'DESC']],
        });
      }

      // Execute query
      const { count, rows: tickets } = await Ticket.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        distinct: true,
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          tickets,
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
      logger.error('Failed to list tickets', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list tickets',
      });
    }
  }

  /**
   * Get single ticket by ID
   * GET /api/bridge/v1/tickets/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const ticket = await Ticket.findOne({
        where: {
          id: Number(id),
          companyId,
        },
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number', 'email', 'profilePicUrl'],
          },
          {
            model: Queue,
            as: 'queue',
            attributes: ['id', 'name', 'color'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Whatsapp,
            as: 'whatsapp',
            attributes: ['id', 'name', 'status'],
          },
          {
            model: Tag,
            as: 'tags',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      logger.error('Failed to get ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get ticket',
      });
    }
  }

  /**
   * Create new ticket
   * POST /api/bridge/v1/tickets
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId!;
      const userId = req.user?.id;
      const {
        contactId,
        status = 'pending',
        queueId,
        whatsappId,
        isGroup = false,
      } = req.body;

      // Validate required fields
      if (!contactId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'contactId is required',
        });
        return;
      }

      // Check if contact exists
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          companyId,
        },
      });

      if (!contact) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found',
        });
        return;
      }

      // Create ticket
      const ticket = await Ticket.create({
        contactId,
        companyId,
        status,
        queueId,
        userId,
        whatsappId,
        isGroup,
        unreadMessages: 0,
      });

      // Reload with associations
      const createdTicket = await Ticket.findByPk(ticket.id, {
        include: [
          { model: Contact, as: 'contact' },
          { model: Queue, as: 'queue' },
          { model: User, as: 'user' },
          { model: Whatsapp, as: 'whatsapp' },
        ],
      });

      // TODO: Trigger ticket.created event

      res.status(201).json({
        success: true,
        data: createdTicket,
        message: 'Ticket created successfully',
      });
    } catch (error) {
      logger.error('Failed to create ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create ticket',
      });
    }
  }

  /**
   * Update ticket
   * PUT /api/bridge/v1/tickets/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;
      const { status, queueId, userId, tags } = req.body;

      const ticket = await Ticket.findOne({
        where: {
          id: Number(id),
          companyId,
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      // Update fields
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (queueId !== undefined) updates.queueId = queueId;
      if (userId !== undefined) updates.userId = userId;

      await ticket.update(updates);

      // Update tags if provided
      if (Array.isArray(tags)) {
        await ticket.$set('tags', tags);
      }

      // Reload with associations
      const updatedTicket = await Ticket.findByPk(ticket.id, {
        include: [
          { model: Contact, as: 'contact' },
          { model: Queue, as: 'queue' },
          { model: User, as: 'user' },
          { model: Whatsapp, as: 'whatsapp' },
          { model: Tag, as: 'tags' },
        ],
      });

      // TODO: Trigger appropriate events based on changes

      res.json({
        success: true,
        data: updatedTicket,
        message: 'Ticket updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update ticket',
      });
    }
  }

  /**
   * Delete ticket
   * DELETE /api/bridge/v1/tickets/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const ticket = await Ticket.findOne({
        where: {
          id: Number(id),
          companyId,
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      await ticket.destroy();

      // TODO: Trigger ticket.deleted event

      res.json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete ticket',
      });
    }
  }

  /**
   * Transfer ticket to another queue or user
   * POST /api/bridge/v1/tickets/:id/transfer
   */
  async transfer(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { queueId, userId } = req.body;
      const companyId = req.companyId!;

      const ticket = await Ticket.findOne({
        where: {
          id: Number(id),
          companyId,
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      const updates: any = {};
      if (queueId !== undefined) updates.queueId = queueId;
      if (userId !== undefined) updates.userId = userId;

      await ticket.update(updates);

      // TODO: Create transfer audit log
      // TODO: Trigger ticket.transferred event

      res.json({
        success: true,
        message: 'Ticket transferred successfully',
      });
    } catch (error) {
      logger.error('Failed to transfer ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to transfer ticket',
      });
    }
  }

  /**
   * Resolve ticket
   * POST /api/bridge/v1/tickets/:id/resolve
   */
  async resolve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const ticket = await Ticket.findOne({
        where: {
          id: Number(id),
          companyId,
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      await ticket.update({ status: 'closed' });

      // TODO: Create resolution audit log
      // TODO: Trigger ticket.resolved event

      res.json({
        success: true,
        message: 'Ticket resolved successfully',
      });
    } catch (error) {
      logger.error('Failed to resolve ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to resolve ticket',
      });
    }
  }

  /**
   * Reopen ticket
   * POST /api/bridge/v1/tickets/:id/reopen
   */
  async reopen(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId!;

      const ticket = await Ticket.findOne({
        where: {
          id: Number(id),
          companyId,
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      await ticket.update({ status: 'open' });

      // TODO: Create reopen audit log
      // TODO: Trigger ticket.reopened event

      res.json({
        success: true,
        message: 'Ticket reopened successfully',
      });
    } catch (error) {
      logger.error('Failed to reopen ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reopen ticket',
      });
    }
  }
}

export const ticketsController = new TicketsController();