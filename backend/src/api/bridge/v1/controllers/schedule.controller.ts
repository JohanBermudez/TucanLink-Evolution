import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Schedule from '../../../../models/Schedule';
import Contact from '../../../../models/Contact';
import Ticket from '../../../../models/Ticket';
import User from '../../../../models/User';
import Company from '../../../../models/Company';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Schedule Controller for API Bridge
 * Provides RESTful endpoints for schedule management
 */
export class ScheduleController {
  /**
   * List schedules
   * GET /api/bridge/v1/schedules
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        contactId,
        ticketId,
        userId,
        includeRelations = false,
        sortBy = 'sendAt',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Schedules list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (search) {
        whereConditions[Op.or] = [
          { body: { [Op.iLike]: `%${search}%` } },
          { status: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        whereConditions.status = status;
      }

      if (contactId) {
        whereConditions.contactId = Number(contactId);
      }

      if (ticketId) {
        whereConditions.ticketId = Number(ticketId);
      }

      if (userId) {
        whereConditions.userId = Number(userId);
      }

      // Build include conditions
      const includeConditions: any[] = [];
      
      if (includeRelations === 'true' || includeRelations === true) {
        includeConditions.push(
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number', 'email'],
          },
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'protocol', 'status'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'name'],
          }
        );
      }

      // Execute query
      const { count, rows: schedules } = await Schedule.findAndCountAll({
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
          schedules,
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
      logger.error('Failed to list schedules', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list schedules',
      });
    }
  }

  /**
   * Get single schedule by ID
   * GET /api/bridge/v1/schedules/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeRelations = true } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      const includeConditions: any[] = [];
      
      if (includeRelations === 'true' || includeRelations === true) {
        includeConditions.push(
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number', 'email'],
          },
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'protocol', 'status'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Company,
            as: 'company',
            attributes: ['id', 'name'],
          }
        );
      }

      const schedule = await Schedule.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        include: includeConditions,
      });

      if (!schedule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Schedule not found',
        });
        return;
      }

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      logger.error('Failed to get schedule', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get schedule',
      });
    }
  }

  /**
   * Create a new schedule
   * POST /api/bridge/v1/schedules
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        body,
        sendAt,
        contactId,
        ticketId,
        userId,
        status = 'pending',
        mediaPath,
        mediaName,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('Create schedule request', { body: body?.substring(0, 50), companyId });

      // Validate required fields
      if (!body || !sendAt || !contactId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'body, sendAt, and contactId are required',
        });
        return;
      }

      // Validate sendAt is a future date
      const sendAtDate = new Date(sendAt);
      if (sendAtDate <= new Date()) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'sendAt must be a future date',
        });
        return;
      }

      // Verify contact exists and belongs to company
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

      // Verify ticket exists if provided
      if (ticketId) {
        const ticket = await Ticket.findOne({
          where: {
            id: ticketId,
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
      }

      // Verify user exists if provided
      if (userId) {
        const user = await User.findOne({
          where: {
            id: userId,
            companyId,
          },
        });

        if (!user) {
          res.status(404).json({
            error: 'Not Found',
            message: 'User not found',
          });
          return;
        }
      }

      // Create schedule
      const schedule = await Schedule.create({
        body,
        sendAt: sendAtDate,
        contactId,
        ticketId,
        userId,
        companyId,
        status,
        mediaPath,
        mediaName,
      });

      // Reload with relations
      const createdSchedule = await Schedule.findByPk(schedule.id, {
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number', 'email'],
          },
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'protocol', 'status'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: createdSchedule,
        message: 'Schedule created successfully',
      });
    } catch (error) {
      logger.error('Failed to create schedule', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create schedule',
      });
    }
  }

  /**
   * Update schedule
   * PUT /api/bridge/v1/schedules/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const schedule = await Schedule.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!schedule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Schedule not found',
        });
        return;
      }

      // Don't allow updating sent schedules
      if (schedule.sentAt) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot update schedule that has already been sent',
        });
        return;
      }

      // Update only allowed fields
      const allowedUpdates = [
        'body', 'sendAt', 'contactId', 'ticketId', 'userId', 'status', 'mediaPath', 'mediaName'
      ];

      const updates: any = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Validate sendAt if provided
      if (updates.sendAt) {
        const sendAtDate = new Date(updates.sendAt);
        if (sendAtDate <= new Date()) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'sendAt must be a future date',
          });
          return;
        }
        updates.sendAt = sendAtDate;
      }

      // Verify contact exists if being updated
      if (updates.contactId) {
        const contact = await Contact.findOne({
          where: {
            id: updates.contactId,
            companyId: schedule.companyId,
          },
        });

        if (!contact) {
          res.status(404).json({
            error: 'Not Found',
            message: 'Contact not found',
          });
          return;
        }
      }

      await schedule.update(updates);

      // Reload with relations
      const updatedSchedule = await Schedule.findByPk(schedule.id, {
        include: [
          {
            model: Contact,
            as: 'contact',
            attributes: ['id', 'name', 'number', 'email'],
          },
          {
            model: Ticket,
            as: 'ticket',
            attributes: ['id', 'protocol', 'status'],
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedSchedule,
        message: 'Schedule updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update schedule', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update schedule',
      });
    }
  }

  /**
   * Delete schedule
   * DELETE /api/bridge/v1/schedules/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const schedule = await Schedule.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!schedule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Schedule not found',
        });
        return;
      }

      // Don't allow deleting sent schedules
      if (schedule.sentAt) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot delete schedule that has already been sent',
        });
        return;
      }

      await schedule.destroy();

      res.json({
        success: true,
        message: 'Schedule deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete schedule', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete schedule',
      });
    }
  }

  /**
   * Mark schedule as sent
   * PATCH /api/bridge/v1/schedules/:id/sent
   */
  async markAsSent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const schedule = await Schedule.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!schedule) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Schedule not found',
        });
        return;
      }

      if (schedule.sentAt) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Schedule has already been marked as sent',
        });
        return;
      }

      await schedule.update({
        sentAt: new Date(),
        status: 'sent',
      });

      res.json({
        success: true,
        data: {
          id: schedule.id,
          status: schedule.status,
          sentAt: schedule.sentAt,
        },
        message: 'Schedule marked as sent successfully',
      });
    } catch (error) {
      logger.error('Failed to mark schedule as sent', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark schedule as sent',
      });
    }
  }
}

export const scheduleController = new ScheduleController();