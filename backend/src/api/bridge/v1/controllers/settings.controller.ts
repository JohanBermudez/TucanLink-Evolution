import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Setting from '../../../../models/Setting';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Settings Controller for API Bridge
 * Provides RESTful endpoints for settings management
 */
export class SettingsController {
  /**
   * List settings
   * GET /api/bridge/v1/settings
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        key,
        sortBy = 'key',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Settings list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (search) {
        whereConditions[Op.or] = [
          { key: { [Op.iLike]: `%${search}%` } },
          { value: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (key) {
        whereConditions.key = { [Op.iLike]: `%${key}%` };
      }

      // Execute query
      const { count, rows: settings } = await Setting.findAndCountAll({
        where: whereConditions,
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
          settings,
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
      logger.error('Failed to list settings', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list settings',
      });
    }
  }

  /**
   * Get setting by key
   * GET /api/bridge/v1/settings/key/:key
   */
  async getByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const setting = await Setting.findOne({
        where: {
          key,
          ...(companyId && { companyId }),
        },
      });

      if (!setting) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Setting not found',
        });
        return;
      }

      res.json({
        success: true,
        data: setting,
      });
    } catch (error) {
      logger.error('Failed to get setting by key', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get setting by key',
      });
    }
  }

  /**
   * Get single setting by ID
   * GET /api/bridge/v1/settings/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const setting = await Setting.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!setting) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Setting not found',
        });
        return;
      }

      res.json({
        success: true,
        data: setting,
      });
    } catch (error) {
      logger.error('Failed to get setting', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get setting',
      });
    }
  }

  /**
   * Update setting value by key
   * PUT /api/bridge/v1/settings/key/:key
   */
  async updateByKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (value === undefined) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'value is required',
        });
        return;
      }

      const setting = await Setting.findOne({
        where: {
          key,
          ...(companyId && { companyId }),
        },
      });

      if (!setting) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Setting not found',
        });
        return;
      }

      await setting.update({ value: String(value) });

      res.json({
        success: true,
        data: setting,
        message: 'Setting updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update setting by key', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update setting by key',
      });
    }
  }

  /**
   * Update setting
   * PUT /api/bridge/v1/settings/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const setting = await Setting.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!setting) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Setting not found',
        });
        return;
      }

      // Update only allowed fields
      const allowedUpdates = ['key', 'value'];
      const updates: any = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = String(req.body[field]);
        }
      });

      // Check for duplicate key if key is being updated
      if (updates.key && updates.key !== setting.key) {
        const existingSetting = await Setting.findOne({
          where: {
            key: updates.key,
            companyId: setting.companyId,
            id: { [Op.ne]: setting.id },
          },
        });

        if (existingSetting) {
          res.status(409).json({
            error: 'Conflict',
            message: 'Setting with this key already exists',
          });
          return;
        }
      }

      await setting.update(updates);

      res.json({
        success: true,
        data: setting,
        message: 'Setting updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update setting', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update setting',
      });
    }
  }

  /**
   * Create a new setting
   * POST /api/bridge/v1/settings
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { key, value } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('Create setting request', { key, companyId });

      // Validate required fields
      if (!key || value === undefined) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'key and value are required',
        });
        return;
      }

      // Check if setting key already exists for this company
      const existingSetting = await Setting.findOne({
        where: {
          key,
          companyId,
        },
      });

      if (existingSetting) {
        res.status(409).json({
          error: 'Conflict',
          message: 'Setting with this key already exists',
        });
        return;
      }

      // Create setting
      const setting = await Setting.create({
        key,
        value: String(value),
        companyId,
      });

      res.status(201).json({
        success: true,
        data: setting,
        message: 'Setting created successfully',
      });
    } catch (error) {
      logger.error('Failed to create setting', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create setting',
      });
    }
  }

  /**
   * Delete setting
   * DELETE /api/bridge/v1/settings/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const setting = await Setting.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!setting) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Setting not found',
        });
        return;
      }

      await setting.destroy();

      res.json({
        success: true,
        message: 'Setting deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete setting', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete setting',
      });
    }
  }
}

export const settingsController = new SettingsController();