import { Request, Response } from 'express';
import { getChannelManager } from '../../../../channels/bootstrap';
import { ChannelType } from '../../../../channels/models/Channel';
import { ConnectionStatus } from '../../../../channels/models/ChannelConnection';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import WebhookSecurityService from '../services/webhook-security.service';
import WhatsAppWebhookProcessor from '../services/whatsapp-webhook-processor.service';
import { getMessageQueueService } from '../services/whatsapp-message-queue.service';

/**
 * WhatsApp Cloud API Controller for API Bridge
 * Provides RESTful endpoints for WhatsApp Cloud API integration
 * Integrates with the Channel Manager Service for multi-channel support
 */
export class WhatsAppCloudController {
  /**
   * Create WhatsApp Cloud connection
   * POST /api/bridge/v1/whatsapp-cloud/connections
   */
  async createConnection(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        accessToken,
        phoneNumberId,
        businessAccountId,
        webhookVerifyToken,
        isDefault = false,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('WhatsApp Cloud connection creation request', { 
        companyId, 
        name,
        phoneNumberId: phoneNumberId ? `...${phoneNumberId.slice(-4)}` : 'N/A'
      });

      // Validate required fields
      if (!name || !accessToken || !phoneNumberId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'name, accessToken, and phoneNumberId are required',
        });
        return;
      }

      // Create connection configuration
      const configuration = {
        accessToken,
        phoneNumberId,
        businessAccountId,
        webhookVerifyToken: webhookVerifyToken || crypto.randomBytes(16).toString('hex'),
        isDefault,
        apiVersion: 'v23.0',
        maxRetries: 3,
        retryDelay: 1000,
      };

      const channelManager = getChannelManager();
      const connectionInfo = await channelManager.createConnection(
        companyId,
        ChannelType.WHATSAPP_CLOUD,
        name,
        configuration
      );

      logger.info('WhatsApp Cloud connection created successfully', {
        connectionId: connectionInfo.id,
        companyId,
        name
      });

      res.status(201).json({
        success: true,
        data: {
          ...connectionInfo,
          // Hide sensitive data in response
          configuration: {
            ...connectionInfo.configuration,
            accessToken: `...${accessToken.slice(-8)}`,
            webhookVerifyToken: configuration.webhookVerifyToken,
          }
        },
        message: 'WhatsApp Cloud connection created successfully',
      });

    } catch (error) {
      logger.error('Failed to create WhatsApp Cloud connection', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create WhatsApp Cloud connection',
      });
    }
  }

  /**
   * List WhatsApp Cloud connections
   * GET /api/bridge/v1/whatsapp-cloud/connections
   */
  async listConnections(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId || Number(req.query.companyId);

      logger.info('WhatsApp Cloud connections list request', { companyId });

      const channelManager = getChannelManager();
      const connections = await channelManager.listConnections(
        companyId,
        ChannelType.WHATSAPP_CLOUD
      );

      // Hide sensitive data in response
      const sanitizedConnections = connections.map(conn => ({
        ...conn,
        configuration: {
          ...conn.configuration,
          accessToken: conn.configuration.accessToken 
            ? `...${conn.configuration.accessToken.slice(-8)}`
            : undefined,
        }
      }));

      res.json({
        success: true,
        data: {
          connections: sanitizedConnections,
          total: connections.length,
        },
      });

    } catch (error) {
      logger.error('Failed to list WhatsApp Cloud connections', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list WhatsApp Cloud connections',
      });
    }
  }

  /**
   * Get WhatsApp Cloud connection by ID
   * GET /api/bridge/v1/whatsapp-cloud/connections/:id
   */
  async getConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connectionId = Number(id);

      const channelManager = getChannelManager();
      const connectionInfo = await channelManager.getConnection(connectionId);

      if (!connectionInfo) {
        res.status(404).json({
          error: 'Not Found',
          message: 'WhatsApp Cloud connection not found',
        });
        return;
      }

      // Verify it's a WhatsApp Cloud connection
      if (connectionInfo.type !== ChannelType.WHATSAPP_CLOUD) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Connection is not a WhatsApp Cloud connection',
        });
        return;
      }

      // Hide sensitive data in response
      const sanitizedConnection = {
        ...connectionInfo,
        configuration: {
          ...connectionInfo.configuration,
          accessToken: connectionInfo.configuration.accessToken 
            ? `...${connectionInfo.configuration.accessToken.slice(-8)}`
            : undefined,
        }
      };

      res.json({
        success: true,
        data: sanitizedConnection,
      });

    } catch (error) {
      logger.error('Failed to get WhatsApp Cloud connection', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get WhatsApp Cloud connection',
      });
    }
  }

  /**
   * Update WhatsApp Cloud connection
   * PUT /api/bridge/v1/whatsapp-cloud/connections/:id
   */
  async updateConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connectionId = Number(id);
      const updates = req.body;

      const channelManager = getChannelManager();
      const updatedConnection = await channelManager.updateConnection(
        connectionId,
        updates
      );

      // Hide sensitive data in response
      const sanitizedConnection = {
        ...updatedConnection,
        configuration: {
          ...updatedConnection.configuration,
          accessToken: updatedConnection.configuration.accessToken 
            ? `...${updatedConnection.configuration.accessToken.slice(-8)}`
            : undefined,
        }
      };

      res.json({
        success: true,
        data: sanitizedConnection,
        message: 'WhatsApp Cloud connection updated successfully',
      });

    } catch (error) {
      logger.error('Failed to update WhatsApp Cloud connection', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to update WhatsApp Cloud connection',
      });
    }
  }

  /**
   * Delete WhatsApp Cloud connection
   * DELETE /api/bridge/v1/whatsapp-cloud/connections/:id
   */
  async deleteConnection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connectionId = Number(id);

      const channelManager = getChannelManager();
      await channelManager.deleteConnection(connectionId);

      res.json({
        success: true,
        message: 'WhatsApp Cloud connection deleted successfully',
      });

    } catch (error) {
      logger.error('Failed to delete WhatsApp Cloud connection', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to delete WhatsApp Cloud connection',
      });
    }
  }

  /**
   * Connect WhatsApp Cloud channel
   * POST /api/bridge/v1/whatsapp-cloud/connections/:id/connect
   */
  async connect(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connectionId = Number(id);

      const channelManager = getChannelManager();
      const status = await channelManager.connectChannel(connectionId);

      res.json({
        success: true,
        data: { connectionId, status },
        message: 'WhatsApp Cloud channel connection initiated',
      });

    } catch (error) {
      logger.error('Failed to connect WhatsApp Cloud channel', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to connect WhatsApp Cloud channel',
      });
    }
  }

  /**
   * Disconnect WhatsApp Cloud channel
   * POST /api/bridge/v1/whatsapp-cloud/connections/:id/disconnect
   */
  async disconnect(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connectionId = Number(id);

      const channelManager = getChannelManager();
      await channelManager.disconnectChannel(connectionId);

      res.json({
        success: true,
        data: { connectionId, status: ConnectionStatus.DISCONNECTED },
        message: 'WhatsApp Cloud channel disconnected successfully',
      });

    } catch (error) {
      logger.error('Failed to disconnect WhatsApp Cloud channel', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to disconnect WhatsApp Cloud channel',
      });
    }
  }

  /**
   * Get connection status
   * GET /api/bridge/v1/whatsapp-cloud/connections/:id/status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const connectionId = Number(id);

      const channelManager = getChannelManager();
      const status = await channelManager.getConnectionStatus(connectionId);

      res.json({
        success: true,
        data: { connectionId, status },
      });

    } catch (error) {
      logger.error('Failed to get WhatsApp Cloud connection status', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get connection status',
      });
    }
  }

  /**
   * Send message through WhatsApp Cloud API
   * POST /api/bridge/v1/whatsapp-cloud/messages
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const {
        connectionId,
        to,
        type,
        content,
        mediaUrl,
        caption,
        filename
      } = req.body;

      // Validate required fields
      if (!connectionId || !to || !type || !content) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'connectionId, to, type, and content are required',
        });
        return;
      }

      // Build message payload
      const messagePayload: any = {
        to,
        type,
        content,
      };

      // Add media fields if present
      if (type !== 'text') {
        if (mediaUrl) messagePayload.mediaUrl = mediaUrl;
        if (caption) messagePayload.caption = caption;
        if (filename) messagePayload.filename = filename;
      }

      // Use message queue for better rate limiting
      const messageQueue = getMessageQueueService();
      const job = await messageQueue.queueMessage({
        ...messagePayload,
        connectionId: Number(connectionId)
      });

      // Get the result - for immediate feedback we'll return job info
      const result = {
        id: job.id?.toString() || '',
        externalId: job.id?.toString() || '',
        status: 'queued' as const,
        metadata: {
          jobId: job.id,
          queuePosition: await job.getState()
        }
      };

      if (result.status === 'failed') {
        res.status(400).json({
          success: false,
          error: 'Message Send Failed',
          message: result.error || 'Failed to send message',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
        message: 'Message sent successfully',
      });

    } catch (error) {
      logger.error('Failed to send WhatsApp Cloud message', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to send message',
      });
    }
  }

  /**
   * Send template message
   * POST /api/bridge/v1/whatsapp-cloud/templates/send
   */
  async sendTemplate(req: Request, res: Response): Promise<void> {
    try {
      const {
        connectionId,
        to,
        templateName,
        languageCode,
        components
      } = req.body;

      // Validate required fields
      if (!connectionId || !to || !templateName || !languageCode) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'connectionId, to, templateName, and languageCode are required',
        });
        return;
      }

      const messagePayload = {
        to,
        type: 'template' as const,
        content: {
          templateName,
          languageCode,
          components: components || []
        }
      };

      // Use message queue for templates too (high priority)
      const messageQueue = getMessageQueueService();
      const job = await messageQueue.queueMessage({
        ...messagePayload,
        connectionId: Number(connectionId),
        priority: 10 // High priority for templates
      });

      // Get the result
      const result = {
        id: job.id?.toString() || '',
        externalId: job.id?.toString() || '',
        status: 'queued' as const,
        metadata: {
          jobId: job.id,
          queuePosition: await job.getState(),
          priority: 10
        }
      };

      if (result.status === 'failed') {
        res.status(400).json({
          success: false,
          error: 'Template Send Failed',
          message: result.error || 'Failed to send template',
        });
        return;
      }

      res.json({
        success: true,
        data: result,
        message: 'Template sent successfully',
      });

    } catch (error) {
      logger.error('Failed to send WhatsApp Cloud template', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to send template',
      });
    }
  }

  /**
   * Webhook verification (GET)
   * GET /api/bridge/v1/whatsapp-cloud/webhook
   */
  async verifyWebhook(req: Request, res: Response): Promise<void> {
    try {
      const mode = req.query['hub.mode'] as string;
      const token = req.query['hub.verify_token'] as string;
      const challenge = req.query['hub.challenge'] as string;

      logger.info('WhatsApp Cloud webhook verification request', {
        mode,
        token: token ? `...${token.slice(-4)}` : 'N/A'
      });

      // For webhook verification, we need to find any connection with matching verify token
      const channelManager = getChannelManager();
      const connections = await channelManager.listConnections(0, ChannelType.WHATSAPP_CLOUD);
      
      let validToken = false;
      for (const connection of connections) {
        const verification = WebhookSecurityService.verifyChallenge(
          mode,
          token,
          challenge,
          connection.configuration.webhookVerifyToken
        );
        
        if (verification.isValid) {
          validToken = true;
          logger.info('Webhook verification successful', {
            connectionId: connection.id,
            companyId: connection.companyId
          });
          break;
        }
      }

      if (validToken) {
        res.status(200).send(challenge);
        return;
      }

      logger.warn('Webhook verification failed - no matching token found');
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid verification token',
      });

    } catch (error) {
      logger.error('Webhook verification failed', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Webhook verification failed',
      });
    }
  }

  /**
   * Webhook processing (POST)
   * POST /api/bridge/v1/whatsapp-cloud/webhook
   */
  async processWebhook(req: Request, res: Response): Promise<void> {
    const processor = new WhatsAppWebhookProcessor();
    
    try {
      const webhookPayload = req.body;
      const signature = req.headers['x-hub-signature-256'] as string;
      const sourceIP = req.ip || req.connection.remoteAddress || 'unknown';

      // Always respond with 200 OK first to prevent retries
      res.status(200).json({ success: true });

      // Rate limiting check
      if (WebhookSecurityService.isRateLimited(sourceIP)) {
        logger.warn('Webhook rate limited', { sourceIP });
        return;
      }

      // Validate payload structure
      const payloadValidation = WebhookSecurityService.validateWebhookPayload(webhookPayload);
      if (!payloadValidation.isValid) {
        logger.error('Invalid webhook payload', {
          error: payloadValidation.error,
          sourceIP
        });
        return;
      }

      logger.info('Processing WhatsApp Cloud webhook', {
        object: webhookPayload.object,
        entries: webhookPayload.entry?.length || 0,
        sourceIP
      });

      // Process webhook asynchronously
      setImmediate(async () => {
        try {
          await processor.processWebhook(webhookPayload, signature, sourceIP);
          logger.debug('Webhook processed successfully');
        } catch (error) {
          logger.error('Error in asynchronous webhook processing', {
            error: error instanceof Error ? error.message : String(error),
            sourceIP
          });
        }
      });

    } catch (error) {
      logger.error('Failed to process WhatsApp Cloud webhook', {
        error: error instanceof Error ? error.message : String(error),
        ip: req.ip
      });
      
      // Already responded with 200, so webhook won't be retried
    }
  }

  /**
   * Health check for WhatsApp Cloud connections
   * GET /api/bridge/v1/whatsapp-cloud/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId || Number(req.query.companyId);
      
      const channelManager = getChannelManager();
      const activeConnections = await channelManager.getActiveConnections(companyId);
      const whatsappCloudConnections = activeConnections.filter(
        conn => conn.type === ChannelType.WHATSAPP_CLOUD
      );

      const healthStatus = {
        healthy: whatsappCloudConnections.length > 0,
        totalConnections: whatsappCloudConnections.length,
        connections: whatsappCloudConnections.map(conn => ({
          id: conn.id,
          name: conn.name,
          status: conn.status,
          type: conn.type
        }))
      };

      res.json({
        success: true,
        data: healthStatus,
      });

    } catch (error) {
      logger.error('Health check failed', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Health check failed',
      });
    }
  }

  /**
   * Get queue statistics
   * GET /api/bridge/v1/whatsapp-cloud/queue/stats
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const messageQueue = getMessageQueueService();
      const stats = await messageQueue.getQueueStats();

      res.json({
        success: true,
        data: {
          queue: stats,
          rateLimit: {
            messagesPerSecond: 80,
            messagesPerMinute: 4800,
            messagesPerHour: 288000,
            burstSize: 100
          },
          status: stats.paused ? 'paused' : 'active'
        }
      });

    } catch (error) {
      logger.error('Failed to get queue statistics', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get queue statistics',
      });
    }
  }

  /**
   * Pause message queue
   * POST /api/bridge/v1/whatsapp-cloud/queue/pause
   */
  async pauseQueue(req: Request, res: Response): Promise<void> {
    try {
      const messageQueue = getMessageQueueService();
      await messageQueue.pauseQueue();

      res.json({
        success: true,
        message: 'Message queue paused successfully'
      });

    } catch (error) {
      logger.error('Failed to pause queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to pause queue',
      });
    }
  }

  /**
   * Resume message queue
   * POST /api/bridge/v1/whatsapp-cloud/queue/resume
   */
  async resumeQueue(req: Request, res: Response): Promise<void> {
    try {
      const messageQueue = getMessageQueueService();
      await messageQueue.resumeQueue();

      res.json({
        success: true,
        message: 'Message queue resumed successfully'
      });

    } catch (error) {
      logger.error('Failed to resume queue', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to resume queue',
      });
    }
  }
}

export const whatsappCloudController = new WhatsAppCloudController();