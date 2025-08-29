import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import User from '../../../../models/User';
import Queue from '../../../../models/Queue';
import UserQueue from '../../../../models/UserQueue';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Users Controller for API Bridge
 * Provides RESTful endpoints for user management
 */
export class UsersController {
  /**
   * List users
   * GET /api/bridge/v1/users
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        profile,
        online,
        includeQueues = false,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Users list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (profile) {
        whereConditions.profile = profile;
      }

      if (online !== undefined) {
        whereConditions.online = online === 'true' || online === true;
      }

      // Build include conditions
      const includeConditions: any[] = [];
      
      if (includeQueues === 'true' || includeQueues === true) {
        includeConditions.push({
          model: Queue,
          as: 'queues',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        });
      }

      // Execute query
      const { count, rows: users } = await User.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        distinct: true,
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
        attributes: {
          exclude: ['passwordHash', 'tokenVersion'], // Exclude sensitive data
        },
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          users,
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
      logger.error('Failed to list users', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list users',
      });
    }
  }

  /**
   * Get single user by ID
   * GET /api/bridge/v1/users/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const user = await User.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        attributes: {
          exclude: ['passwordHash', 'tokenVersion'],
        },
        include: [
          {
            model: Queue,
            as: 'queues',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Failed to get user', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user',
      });
    }
  }

  /**
   * Create a new user
   * POST /api/bridge/v1/users
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        email,
        password,
        profile = 'admin',
        allTicket = 'disabled',
        whatsappId,
        queueIds = [],
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('Create user request', { name, email, companyId });

      // Validate required fields
      if (!name || !email || !password) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'name, email, and password are required',
        });
        return;
      }

      // Check if email already exists for this company
      const existingUser = await User.findOne({
        where: {
          email,
          companyId,
        },
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
        return;
      }

      // Create user
      const user = await User.create({
        name,
        email,
        password, // Will be hashed by BeforeCreate hook
        profile,
        allTicket,
        companyId,
        whatsappId,
        online: false,
        super: false,
      });

      // Assign queues if provided
      if (queueIds.length > 0) {
        const queues = await Queue.findAll({
          where: {
            id: queueIds,
            companyId,
          },
        });

        await user.$set('queues', queues);
      }

      // Reload without sensitive data
      const createdUser = await User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash', 'tokenVersion'] },
        include: [{
          model: Queue,
          as: 'queues',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        }],
      });

      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'User created successfully',
      });
    } catch (error) {
      logger.error('Failed to create user', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create user',
      });
    }
  }

  /**
   * Update user
   * PUT /api/bridge/v1/users/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const user = await User.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!user) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
        return;
      }

      // Update only allowed fields
      const allowedUpdates = [
        'name', 'email', 'profile', 'allTicket', 'whatsappId'
      ];

      const updates: any = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Handle password update separately
      if (req.body.password) {
        updates.password = req.body.password;
      }

      await user.update(updates);

      // Handle queue assignments
      if (req.body.queueIds !== undefined) {
        const queues = await Queue.findAll({
          where: {
            id: req.body.queueIds,
            companyId: user.companyId,
          },
        });
        await user.$set('queues', queues);
      }

      // Reload without sensitive data
      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash', 'tokenVersion'] },
        include: [{
          model: Queue,
          as: 'queues',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        }],
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update user', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update user',
      });
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   * DELETE /api/bridge/v1/users/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const user = await User.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!user) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
        return;
      }

      // Don't delete super users
      if (user.super) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Cannot delete super user',
        });
        return;
      }

      // Soft delete by setting user as offline and removing from queues
      await user.update({ online: false });
      await user.$set('queues', []);

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      logger.error('Failed to delete user', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete user',
      });
    }
  }

  /**
   * Assign queues to user
   * POST /api/bridge/v1/users/:id/queues
   */
  async assignQueues(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { queueIds } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      const user = await User.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!user) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
        return;
      }

      if (!Array.isArray(queueIds)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'queueIds must be an array',
        });
        return;
      }

      const queues = await Queue.findAll({
        where: {
          id: queueIds,
          companyId: user.companyId,
        },
      });

      await user.$set('queues', queues);

      const updatedUser = await User.findByPk(user.id, {
        attributes: { exclude: ['passwordHash', 'tokenVersion'] },
        include: [{
          model: Queue,
          as: 'queues',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        }],
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Queues assigned successfully',
      });
    } catch (error) {
      logger.error('Failed to assign queues', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to assign queues',
      });
    }
  }

  /**
   * Update user online status
   * PATCH /api/bridge/v1/users/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { online } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      const user = await User.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!user) {
        res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
        });
        return;
      }

      await user.update({ online });

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          online: user.online,
        },
        message: 'User status updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update user status', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update user status',
      });
    }
  }
}

export const usersController = new UsersController();