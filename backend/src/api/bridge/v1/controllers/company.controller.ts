import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Company from '../../../../models/Company';
import Plan from '../../../../models/Plan';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Company Controller for API Bridge
 * Provides RESTful endpoints for company management
 */
export class CompanyController {
  /**
   * List companies
   * GET /api/bridge/v1/companies
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        includePlan = false,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Companies list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.id = companyId;
      }

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status !== undefined) {
        whereConditions.status = status === 'true' || status === true;
      }

      // Build include conditions
      const includeConditions: any[] = [];
      
      if (includePlan === 'true' || includePlan === true) {
        includeConditions.push({
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'value', 'users', 'connections', 'queues'],
        });
      }

      // Execute query
      const { count, rows: companies } = await Company.findAndCountAll({
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
          companies,
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
      logger.error('Failed to list companies', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list companies',
      });
    }
  }

  /**
   * Get single company by ID
   * GET /api/bridge/v1/companies/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includePlan = true } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      // If companyId is set from auth, user can only view their own company
      const targetId = companyId || Number(id);

      const includeConditions: any[] = [];
      
      if (includePlan === 'true' || includePlan === true) {
        includeConditions.push({
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'value', 'users', 'connections', 'queues'],
        });
      }

      const company = await Company.findOne({
        where: {
          id: targetId,
        },
        include: includeConditions,
      });

      if (!company) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Company not found',
        });
        return;
      }

      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      logger.error('Failed to get company', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get company',
      });
    }
  }

  /**
   * Update company
   * PUT /api/bridge/v1/companies/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      // If companyId is set from auth, user can only update their own company
      const targetId = companyId || Number(id);

      const company = await Company.findOne({
        where: {
          id: targetId,
        },
      });

      if (!company) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Company not found',
        });
        return;
      }

      // Update only allowed fields (excluding sensitive ones like planId)
      const allowedUpdates = [
        'name', 'phone', 'email', 'language', 'schedules'
      ];

      const updates: any = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Validate email format if provided
      if (updates.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updates.email)) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid email format',
          });
          return;
        }
      }

      await company.update(updates);

      // Reload with plan information
      const updatedCompany = await Company.findByPk(company.id, {
        include: [{
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'value', 'users', 'connections', 'queues'],
        }],
      });

      res.json({
        success: true,
        data: updatedCompany,
        message: 'Company updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update company', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update company',
      });
    }
  }
}

export const companyController = new CompanyController();