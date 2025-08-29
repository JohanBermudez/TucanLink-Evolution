import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../../../../database';
import Whatsapp from '../../../../models/Whatsapp';
import Queue from '../../../../models/Queue';
import WhatsappQueue from '../../../../models/WhatsappQueue';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * WhatsApp Controller for API Bridge
 * Provides RESTful endpoints for WhatsApp session management (CRUD only)
 * 
 * Session control operations (start, restart, disconnect, getQR) are handled 
 * by the Core service directly at:
 * - POST /whatsapp/:id/start
 * - POST /whatsapp/:id/restart
 * - POST /whatsapp/:id/disconnect  
 * - GET /whatsapp/:id/qr
 */
export class WhatsAppController {
  /**
   * List WhatsApp sessions
   * GET /api/bridge/v1/whatsapp
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        includeQueues = false,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('WhatsApp list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: any = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      if (status) {
        whereConditions.status = status;
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
      const { count, rows: whatsapps } = await Whatsapp.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        distinct: true,
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
        attributes: {
          exclude: ['session', 'qrcode'], // Exclude sensitive data
        },
      });

      // Calculate pagination info
      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          whatsapps,
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
      logger.error('Failed to list WhatsApp sessions', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list WhatsApp sessions',
      });
    }
  }

  /**
   * Get single WhatsApp session by ID
   * GET /api/bridge/v1/whatsapp/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeQR = false } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      const attributes: any = {
        exclude: ['session'], // Always exclude session data
      };

      // Only include QR code if explicitly requested
      if (!includeQR) {
        attributes.exclude.push('qrcode');
      }

      const whatsapp = await Whatsapp.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        attributes,
        include: [
          {
            model: Queue,
            as: 'queues',
            attributes: ['id', 'name', 'color'],
            through: { attributes: [] },
          },
        ],
      });

      if (!whatsapp) {
        res.status(404).json({
          error: 'Not Found',
          message: 'WhatsApp session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: whatsapp,
      });
    } catch (error) {
      logger.error('Failed to get WhatsApp session', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get WhatsApp session',
      });
    }
  }

  /**
   * Create a new WhatsApp session
   * POST /api/bridge/v1/whatsapp
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        greetingMessage = '',
        farewellMessage = '',
        complationMessage = '',
        outOfHoursMessage = '',
        ratingMessage = '',
        provider = 'stable',
        isDefault = false,
        token = '',
        sendIdQueue,
        timeSendQueue,
        promptId,
        collectiveVacationMessage,
        collectiveVacationStart,
        collectiveVacationEnd,
        maxUseBotQueues,
        timeUseBotQueues,
        expiresTicket,
        expiresInactiveMessage,
        importOldMessages,
        importRecentMessages,
        closedTicketsPostImported,
        importOldMessagesGroups,
        groupAsTicket = 'disabled',
        queueIdImportMessages,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('Create WhatsApp session request', { name, companyId });

      // Validate required fields
      if (!name) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'name is required',
        });
        return;
      }

      // Check if name already exists for this company
      const existingWhatsapp = await Whatsapp.findOne({
        where: {
          name,
          companyId,
        },
      });

      if (existingWhatsapp) {
        res.status(409).json({
          error: 'Conflict',
          message: 'WhatsApp session with this name already exists',
        });
        return;
      }

      // Create WhatsApp session (always start as DISCONNECTED)
      const whatsapp = await Whatsapp.create({
        name,
        status: 'DISCONNECTED',
        session: '',
        qrcode: '',
        battery: '0',
        plugged: false,
        retries: 0,
        greetingMessage,
        farewellMessage,
        complationMessage,
        outOfHoursMessage,
        ratingMessage,
        provider,
        isDefault,
        companyId,
        token,
        sendIdQueue,
        timeSendQueue,
        promptId,
        collectiveVacationMessage,
        collectiveVacationStart,
        collectiveVacationEnd,
        maxUseBotQueues,
        timeUseBotQueues,
        expiresTicket,
        expiresInactiveMessage,
        importOldMessages,
        importRecentMessages,
        closedTicketsPostImported,
        importOldMessagesGroups,
        groupAsTicket,
        queueIdImportMessages,
      });

      logger.info('WhatsApp session created successfully', {
        whatsappId: whatsapp.id,
        name: whatsapp.name,
        status: 'DISCONNECTED'
      });

      res.status(201).json({
        success: true,
        data: whatsapp,
        message: 'WhatsApp session created successfully. Use Core service endpoints to start/control the session.',
        coreEndpoints: {
          start: `POST /whatsapp/${whatsapp.id}/start`,
          restart: `POST /whatsapp/${whatsapp.id}/restart`,
          disconnect: `POST /whatsapp/${whatsapp.id}/disconnect`,
          getQR: `GET /whatsapp/${whatsapp.id}/qr`
        }
      });
    } catch (error) {
      logger.error('Failed to create WhatsApp session', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create WhatsApp session',
      });
    }
  }

  /**
   * Update WhatsApp session
   * PUT /api/bridge/v1/whatsapp/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const whatsapp = await Whatsapp.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!whatsapp) {
        res.status(404).json({
          error: 'Not Found',
          message: 'WhatsApp session not found',
        });
        return;
      }

      // Update only allowed fields (exclude session, qrcode, status)
      const allowedUpdates = [
        'name', 'greetingMessage', 'farewellMessage', 'complationMessage',
        'outOfHoursMessage', 'ratingMessage', 'isDefault', 'token',
        'sendIdQueue', 'timeSendQueue', 'promptId', 'collectiveVacationMessage',
        'collectiveVacationStart', 'collectiveVacationEnd', 'maxUseBotQueues',
        'timeUseBotQueues', 'expiresTicket', 'expiresInactiveMessage',
        'importOldMessages', 'importRecentMessages', 'closedTicketsPostImported',
        'importOldMessagesGroups', 'groupAsTicket', 'queueIdImportMessages',
      ];

      const updates: any = {};
      allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      await whatsapp.update(updates);

      // Reload without sensitive data
      const updatedWhatsapp = await Whatsapp.findByPk(whatsapp.id, {
        attributes: { exclude: ['session', 'qrcode'] },
        include: [{
          model: Queue,
          as: 'queues',
          attributes: ['id', 'name', 'color'],
          through: { attributes: [] },
        }],
      });

      res.json({
        success: true,
        data: updatedWhatsapp,
        message: 'WhatsApp session updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update WhatsApp session', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update WhatsApp session',
      });
    }
  }

  /**
   * Delete WhatsApp session
   * DELETE /api/bridge/v1/whatsapp/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const whatsapp = await Whatsapp.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!whatsapp) {
        res.status(404).json({
          error: 'Not Found',
          message: 'WhatsApp session not found',
        });
        return;
      }

      await whatsapp.destroy();

      res.json({
        success: true,
        message: 'WhatsApp session deleted successfully',
        note: 'If the session was active, use Core service to properly disconnect it first'
      });
    } catch (error) {
      logger.error('Failed to delete WhatsApp session', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete WhatsApp session',
      });
    }
  }

  /**
   * Get QR code for WhatsApp session
   * GET /api/bridge/v1/whatsapp/:id/qr
   * 
   * Note: This endpoint returns the stored QR code, but for active session 
   * management use the Core service endpoint: GET /whatsapp/:id/qr
   */
  async getQR(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const whatsapp = await Whatsapp.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        attributes: ['id', 'name', 'status', 'qrcode', 'retries'],
      });

      if (!whatsapp) {
        res.status(404).json({
          error: 'Not Found',
          message: 'WhatsApp session not found',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: whatsapp.id,
          name: whatsapp.name,
          status: whatsapp.status,
          qrcode: whatsapp.qrcode,
          retries: whatsapp.retries || 0,
        },
        note: 'For active session control, use Core service endpoint: GET /whatsapp/' + id + '/qr'
      });
    } catch (error) {
      logger.error('Failed to get QR code', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get QR code',
      });
    }
  }
}

export const whatsappController = new WhatsAppController();