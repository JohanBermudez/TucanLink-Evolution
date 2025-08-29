import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Tag from '../../../../models/Tag';
import Ticket from '../../../../models/Ticket';
import TicketTag from '../../../../models/TicketTag';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Tags Controller for API Bridge
 * Provides RESTful endpoints for tag management
 */
export class TagsController {
  /**
   * List tags
   * GET /api/bridge/v1/tags
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        kanban,
        includeTicketCount = false,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Tags list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (kanban !== undefined) {
        whereConditions.kanban = Number(kanban);
      }

      // Build attributes
      const attributes: any = ['id', 'name', 'color', 'kanban', 'companyId', 'createdAt', 'updatedAt'];
      
      // Add ticket count if requested
      if (includeTicketCount === 'true' || includeTicketCount === true) {
        attributes.push([
          sequelize.literal('(SELECT COUNT(*) FROM "TicketTags" WHERE "TicketTags"."tagId" = "Tag"."id")'),
          'ticketCount'
        ]);
      }

      // Execute query
      const { count, rows: tags } = await Tag.findAndCountAll({
        where: whereConditions,
        attributes,
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
          tags,
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
      logger.error('Failed to list tags', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list tags',
      });
    }
  }

  /**
   * Get single tag by ID
   * GET /api/bridge/v1/tags/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeTickets = false } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      const includeConditions: any[] = [];
      
      if (includeTickets === 'true' || includeTickets === true) {
        includeConditions.push({
          model: Ticket,
          as: 'tickets',
          attributes: ['id', 'protocol', 'status'],
          through: { attributes: [] },
        });
      }

      const tag = await Tag.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        include: includeConditions,
      });

      if (!tag) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tag not found',
        });
        return;
      }

      res.json({
        success: true,
        data: tag,
      });
    } catch (error) {
      logger.error('Failed to get tag', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get tag',
      });
    }
  }

  /**
   * Create a new tag
   * POST /api/bridge/v1/tags
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        color = '#0099FF',
        kanban = 0,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('Create tag request', { name, color, companyId });

      // Validate required fields
      if (!name) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'name is required',
        });
        return;
      }

      // Check if tag name already exists for this company
      const existingTag = await Tag.findOne({
        where: {
          name,
          companyId,
        },
      });

      if (existingTag) {
        res.status(409).json({
          error: 'Conflict',
          message: 'Tag with this name already exists',
        });
        return;
      }

      // Validate color format (hex color)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(color)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid color format. Use hex format like #FF0000',
        });
        return;
      }

      // Create tag
      const tag = await Tag.create({
        name,
        color,
        kanban,
        companyId,
      });

      res.status(201).json({
        success: true,
        data: tag,
        message: 'Tag created successfully',
      });
    } catch (error) {
      logger.error('Failed to create tag', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create tag',
      });
    }
  }

  /**
   * Update tag
   * PUT /api/bridge/v1/tags/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const tag = await Tag.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!tag) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tag not found',
        });
        return;
      }

      // Update only allowed fields
      const allowedUpdates = ['name', 'color', 'kanban'];
      const updates: any = {};
      
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      // Validate color format if provided
      if (updates.color) {
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(updates.color)) {
          res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid color format. Use hex format like #FF0000',
          });
          return;
        }
      }

      // Check for duplicate name if name is being updated
      if (updates.name && updates.name !== tag.name) {
        const existingTag = await Tag.findOne({
          where: {
            name: updates.name,
            companyId: tag.companyId,
            id: { [Op.ne]: tag.id },
          },
        });

        if (existingTag) {
          res.status(409).json({
            error: 'Conflict',
            message: 'Tag with this name already exists',
          });
          return;
        }
      }

      await tag.update(updates);

      res.json({
        success: true,
        data: tag,
        message: 'Tag updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update tag', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update tag',
      });
    }
  }

  /**
   * Delete tag
   * DELETE /api/bridge/v1/tags/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const tag = await Tag.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!tag) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tag not found',
        });
        return;
      }

      // Check if tag is associated with any tickets
      const ticketCount = await TicketTag.count({
        where: { tagId: tag.id },
      });

      if (ticketCount > 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Cannot delete tag. It is associated with ${ticketCount} ticket(s)`,
        });
        return;
      }

      await tag.destroy();

      res.json({
        success: true,
        message: 'Tag deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete tag', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete tag',
      });
    }
  }

  /**
   * Add tag to ticket
   * POST /api/bridge/v1/tags/:id/tickets
   */
  async addToTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { ticketId } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!ticketId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'ticketId is required',
        });
        return;
      }

      const tag = await Tag.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!tag) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tag not found',
        });
        return;
      }

      const ticket = await Ticket.findOne({
        where: {
          id: Number(ticketId),
          companyId: tag.companyId,
        },
      });

      if (!ticket) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Ticket not found',
        });
        return;
      }

      // Check if tag is already assigned
      const existingAssignment = await TicketTag.findOne({
        where: {
          ticketId: ticket.id,
          tagId: tag.id,
        },
      });

      if (existingAssignment) {
        res.status(409).json({
          error: 'Conflict',
          message: 'Tag is already assigned to this ticket',
        });
        return;
      }

      // Add tag to ticket
      await TicketTag.create({
        ticketId: ticket.id,
        tagId: tag.id,
      });

      res.json({
        success: true,
        message: 'Tag added to ticket successfully',
      });
    } catch (error) {
      logger.error('Failed to add tag to ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to add tag to ticket',
      });
    }
  }

  /**
   * Remove tag from ticket
   * DELETE /api/bridge/v1/tags/:id/tickets/:ticketId
   */
  async removeFromTicket(req: Request, res: Response): Promise<void> {
    try {
      const { id, ticketId } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const tag = await Tag.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!tag) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tag not found',
        });
        return;
      }

      const ticketTag = await TicketTag.findOne({
        where: {
          ticketId: Number(ticketId),
          tagId: tag.id,
        },
      });

      if (!ticketTag) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Tag is not assigned to this ticket',
        });
        return;
      }

      await ticketTag.destroy();

      res.json({
        success: true,
        message: 'Tag removed from ticket successfully',
      });
    } catch (error) {
      logger.error('Failed to remove tag from ticket', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to remove tag from ticket',
      });
    }
  }
}

export const tagsController = new TagsController();