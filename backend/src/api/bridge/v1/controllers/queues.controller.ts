import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Queue from '../../../../models/Queue';
import User from '../../../../models/User';
import Whatsapp from '../../../../models/Whatsapp';
import QueueOption from '../../../../models/QueueOption';
import UserQueue from '../../../../models/UserQueue';
import WhatsappQueue from '../../../../models/WhatsappQueue';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Queues Controller for API Bridge
 * Provides RESTful endpoints for queue management
 */
export class QueuesController {
  /**
   * List queues with filtering and pagination
   * GET /api/bridge/v1/queues
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        includeUsers = false,
        includeWhatsapps = false,
        includeOptions = false,
        sortBy = 'orderQueue',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Queues list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      // Search by name
      if (search) {
        whereConditions.name = { [Op.iLike]: `%${search}%` };
      }

      // Build include conditions
      const includeConditions: any[] = [];
      
      if (includeUsers === 'true' || includeUsers === true) {
        includeConditions.push({
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        });
      }

      if (includeWhatsapps === 'true' || includeWhatsapps === true) {
        includeConditions.push({
          model: Whatsapp,
          as: 'whatsapps',
          attributes: ['id', 'name', 'status'],
          through: { attributes: [] },
        });
      }

      if (includeOptions === 'true' || includeOptions === true) {
        includeConditions.push({
          model: QueueOption,
          as: 'options',
          attributes: ['id', 'title', 'option', 'parentId'],
        });
      }

      // Execute query
      const { count, rows: queues } = await Queue.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        distinct: true,
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
        },
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          queues,
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
      logger.error('Failed to list queues', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list queues',
      });
    }
  }

  /**
   * Get single queue by ID
   * GET /api/bridge/v1/queues/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const queue = await Queue.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'name', 'email'],
            through: { attributes: [] },
          },
          {
            model: Whatsapp,
            as: 'whatsapps',
            attributes: ['id', 'name', 'status'],
            through: { attributes: [] },
          },
          {
            model: QueueOption,
            as: 'options',
            attributes: ['id', 'title', 'option', 'parentId'],
          },
        ],
      });

      if (!queue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Queue not found',
        });
        return;
      }

      res.json({
        success: true,
        data: queue,
      });
    } catch (error) {
      logger.error('Failed to get queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get queue',
      });
    }
  }

  /**
   * Create a new queue
   * POST /api/bridge/v1/queues
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        color,
        greetingMessage = '',
        outOfHoursMessage = '',
        schedules = [],
        orderQueue = 0,
        integrationId,
        promptId,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('Create queue request', { name, color, companyId });

      // Validate required fields
      if (!name || !color) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'name and color are required',
        });
        return;
      }

      // Check if queue name already exists for this company
      const existingQueue = await Queue.findOne({
        where: {
          name,
          companyId,
        },
      });

      if (existingQueue) {
        res.status(409).json({
          error: 'Conflict',
          message: 'Queue with this name already exists',
        });
        return;
      }

      // Create queue
      const queue = await Queue.create({
        name,
        color,
        greetingMessage,
        outOfHoursMessage,
        schedules,
        orderQueue,
        companyId,
        integrationId,
        promptId,
      });

      res.status(201).json({
        success: true,
        data: queue,
        message: 'Queue created successfully',
      });
    } catch (error) {
      logger.error('Failed to create queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create queue',
      });
    }
  }

  /**
   * Update queue
   * PUT /api/bridge/v1/queues/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        color,
        greetingMessage,
        outOfHoursMessage,
        schedules,
        orderQueue,
        integrationId,
        promptId,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      const queue = await Queue.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!queue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Queue not found',
        });
        return;
      }

      // Check if new name conflicts with another queue
      if (name && name !== queue.name) {
        const existingQueue = await Queue.findOne({
          where: {
            name,
            companyId: queue.companyId,
            id: { [Op.ne]: queue.id },
          },
        });

        if (existingQueue) {
          res.status(409).json({
            error: 'Conflict',
            message: 'Queue with this name already exists',
          });
          return;
        }
      }

      // Update fields
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (color !== undefined) updates.color = color;
      if (greetingMessage !== undefined) updates.greetingMessage = greetingMessage;
      if (outOfHoursMessage !== undefined) updates.outOfHoursMessage = outOfHoursMessage;
      if (schedules !== undefined) updates.schedules = schedules;
      if (orderQueue !== undefined) updates.orderQueue = orderQueue;
      if (integrationId !== undefined) updates.integrationId = integrationId;
      if (promptId !== undefined) updates.promptId = promptId;

      await queue.update(updates);

      // Reload with associations
      const updatedQueue = await Queue.findByPk(queue.id, {
        include: [
          { model: User, as: 'users', through: { attributes: [] } },
          { model: Whatsapp, as: 'whatsapps', through: { attributes: [] } },
          { model: QueueOption, as: 'options' },
        ],
      });

      res.json({
        success: true,
        data: updatedQueue,
        message: 'Queue updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update queue',
      });
    }
  }

  /**
   * Delete queue
   * DELETE /api/bridge/v1/queues/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const queue = await Queue.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!queue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Queue not found',
        });
        return;
      }

      await queue.destroy();

      res.json({
        success: true,
        message: 'Queue deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete queue',
      });
    }
  }

  /**
   * Assign users to queue
   * POST /api/bridge/v1/queues/:id/users
   */
  async assignUsers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!Array.isArray(userIds)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'userIds must be an array',
        });
        return;
      }

      const queue = await Queue.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!queue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Queue not found',
        });
        return;
      }

      // Remove existing associations
      await UserQueue.destroy({
        where: { queueId: queue.id },
      });

      // Create new associations
      if (userIds.length > 0) {
        const userQueueData = userIds.map(userId => ({
          userId,
          queueId: queue.id,
        }));
        await UserQueue.bulkCreate(userQueueData);
      }

      // Reload queue with users
      const updatedQueue = await Queue.findByPk(queue.id, {
        include: [{
          model: User,
          as: 'users',
          attributes: ['id', 'name', 'email'],
          through: { attributes: [] },
        }],
      });

      res.json({
        success: true,
        data: updatedQueue,
        message: 'Users assigned successfully',
      });
    } catch (error) {
      logger.error('Failed to assign users to queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign users',
      });
    }
  }

  /**
   * Assign WhatsApp connections to queue
   * POST /api/bridge/v1/queues/:id/whatsapps
   */
  async assignWhatsapps(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { whatsappIds } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!Array.isArray(whatsappIds)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'whatsappIds must be an array',
        });
        return;
      }

      const queue = await Queue.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!queue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Queue not found',
        });
        return;
      }

      // Remove existing associations
      await WhatsappQueue.destroy({
        where: { queueId: queue.id },
      });

      // Create new associations
      if (whatsappIds.length > 0) {
        const whatsappQueueData = whatsappIds.map(whatsappId => ({
          whatsappId,
          queueId: queue.id,
        }));
        await WhatsappQueue.bulkCreate(whatsappQueueData);
      }

      // Reload queue with whatsapps
      const updatedQueue = await Queue.findByPk(queue.id, {
        include: [{
          model: Whatsapp,
          as: 'whatsapps',
          attributes: ['id', 'name', 'status'],
          through: { attributes: [] },
        }],
      });

      res.json({
        success: true,
        data: updatedQueue,
        message: 'WhatsApp connections assigned successfully',
      });
    } catch (error) {
      logger.error('Failed to assign WhatsApps to queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign WhatsApp connections',
      });
    }
  }
}

export const queuesController = new QueuesController();