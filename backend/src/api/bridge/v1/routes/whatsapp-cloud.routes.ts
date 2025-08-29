import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { whatsappCloudController } from '../controllers/whatsapp-cloud.controller';

const router = Router();

// Validation schemas
const createConnectionSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    accessToken: Joi.string().min(10).required(),
    phoneNumberId: Joi.string().min(1).required(),
    businessAccountId: Joi.string().min(1).optional(),
    webhookVerifyToken: Joi.string().min(8).optional(),
    isDefault: Joi.boolean().default(false),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const listConnectionsSchema = Joi.object({
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const connectionIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateConnectionSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    accessToken: Joi.string().min(10).optional(),
    phoneNumberId: Joi.string().min(1).optional(),
    businessAccountId: Joi.string().min(1).optional(),
    webhookVerifyToken: Joi.string().min(8).optional(),
    isDefault: Joi.boolean().optional(),
  }),
});

const sendMessageSchema = Joi.object({
  body: Joi.object({
    connectionId: Joi.number().integer().positive().required(),
    to: Joi.string().pattern(/^\+?[1-9]\d{10,14}$/).required(), // E.164 format
    type: Joi.string().valid('text', 'image', 'video', 'audio', 'document', 'location', 'contacts').required(),
    content: Joi.string().min(1).required(),
    mediaUrl: Joi.string().uri().when('type', {
      is: Joi.valid('image', 'video', 'audio', 'document'),
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    caption: Joi.string().max(1024).when('type', {
      is: Joi.valid('image', 'video', 'document'),
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    filename: Joi.string().max(255).when('type', {
      is: 'document',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    latitude: Joi.number().min(-90).max(90).when('type', {
      is: 'location',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    longitude: Joi.number().min(-180).max(180).when('type', {
      is: 'location',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    }),
    locationName: Joi.string().max(1000).when('type', {
      is: 'location',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
    locationAddress: Joi.string().max(1000).when('type', {
      is: 'location',
      then: Joi.optional(),
      otherwise: Joi.forbidden()
    }),
  }),
});

const sendTemplateSchema = Joi.object({
  body: Joi.object({
    connectionId: Joi.number().integer().positive().required(),
    to: Joi.string().pattern(/^\+?[1-9]\d{10,14}$/).required(), // E.164 format
    templateName: Joi.string().min(1).max(512).required(),
    languageCode: Joi.string().min(2).max(10).required(), // ISO 639-1 codes like 'en', 'es', 'pt_BR'
    components: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('header', 'body', 'button').required(),
        parameters: Joi.array().items(
          Joi.object({
            type: Joi.string().valid('text', 'currency', 'date_time', 'image', 'document', 'video').required(),
            text: Joi.string().when('type', {
              is: 'text',
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            currency: Joi.object({
              fallback_value: Joi.string().required(),
              code: Joi.string().length(3).required(),
              amount_1000: Joi.number().integer().required(),
            }).when('type', {
              is: 'currency',
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            date_time: Joi.object({
              fallback_value: Joi.string().required(),
              day_of_week: Joi.number().integer().min(1).max(7).optional(),
              year: Joi.number().integer().min(1900).max(2100).optional(),
              month: Joi.number().integer().min(1).max(12).optional(),
              day_of_month: Joi.number().integer().min(1).max(31).optional(),
              hour: Joi.number().integer().min(0).max(23).optional(),
              minute: Joi.number().integer().min(0).max(59).optional(),
              calendar: Joi.string().valid('GREGORIAN').optional(),
            }).when('type', {
              is: 'date_time',
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            image: Joi.object({
              link: Joi.string().uri().optional(),
              id: Joi.string().optional(),
            }).when('type', {
              is: 'image',
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            document: Joi.object({
              link: Joi.string().uri().optional(),
              id: Joi.string().optional(),
              filename: Joi.string().optional(),
            }).when('type', {
              is: 'document',
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
            video: Joi.object({
              link: Joi.string().uri().optional(),
              id: Joi.string().optional(),
            }).when('type', {
              is: 'video',
              then: Joi.required(),
              otherwise: Joi.forbidden()
            }),
          })
        ).optional(),
        sub_type: Joi.string().when('type', {
          is: 'button',
          then: Joi.valid('quick_reply', 'url').required(),
          otherwise: Joi.forbidden()
        }),
        index: Joi.string().when('type', {
          is: 'button',
          then: Joi.required(),
          otherwise: Joi.forbidden()
        }),
      })
    ).optional(),
  }),
});

const webhookVerificationSchema = Joi.object({
  query: Joi.object({
    'hub.mode': Joi.string().valid('subscribe').required(),
    'hub.challenge': Joi.string().required(),
    'hub.verify_token': Joi.string().required(),
  }),
});

const healthCheckSchema = Joi.object({
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

// Apply authentication middleware to all routes except webhook verification
router.use((req, res, next) => {
  // Skip auth for webhook verification (GET) and webhook processing (POST)
  if (req.path === '/webhook') {
    return next();
  }
  return authenticate()(req, res, next);
});

// Connection management routes

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/connections
 * @desc    Create a new WhatsApp Cloud API connection
 * @access  Private
 */
router.post(
  '/connections',
  validateRequest(createConnectionSchema),
  whatsappCloudController.createConnection.bind(whatsappCloudController)
);

/**
 * @route   GET /api/bridge/v1/whatsapp-cloud/connections
 * @desc    List WhatsApp Cloud API connections
 * @access  Private
 */
router.get(
  '/connections',
  validateRequest(listConnectionsSchema),
  whatsappCloudController.listConnections.bind(whatsappCloudController)
);

/**
 * @route   GET /api/bridge/v1/whatsapp-cloud/connections/:id
 * @desc    Get single WhatsApp Cloud API connection by ID
 * @access  Private
 */
router.get(
  '/connections/:id',
  validateRequest(connectionIdSchema),
  whatsappCloudController.getConnection.bind(whatsappCloudController)
);

/**
 * @route   PUT /api/bridge/v1/whatsapp-cloud/connections/:id
 * @desc    Update WhatsApp Cloud API connection
 * @access  Private
 */
router.put(
  '/connections/:id',
  validateRequest(updateConnectionSchema),
  whatsappCloudController.updateConnection.bind(whatsappCloudController)
);

/**
 * @route   DELETE /api/bridge/v1/whatsapp-cloud/connections/:id
 * @desc    Delete WhatsApp Cloud API connection
 * @access  Private
 */
router.delete(
  '/connections/:id',
  validateRequest(connectionIdSchema),
  whatsappCloudController.deleteConnection.bind(whatsappCloudController)
);

// Connection control routes

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/connections/:id/connect
 * @desc    Connect WhatsApp Cloud API channel
 * @access  Private
 */
router.post(
  '/connections/:id/connect',
  validateRequest(connectionIdSchema),
  whatsappCloudController.connect.bind(whatsappCloudController)
);

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/connections/:id/disconnect
 * @desc    Disconnect WhatsApp Cloud API channel
 * @access  Private
 */
router.post(
  '/connections/:id/disconnect',
  validateRequest(connectionIdSchema),
  whatsappCloudController.disconnect.bind(whatsappCloudController)
);

/**
 * @route   GET /api/bridge/v1/whatsapp-cloud/connections/:id/status
 * @desc    Get WhatsApp Cloud API connection status
 * @access  Private
 */
router.get(
  '/connections/:id/status',
  validateRequest(connectionIdSchema),
  whatsappCloudController.getStatus.bind(whatsappCloudController)
);

// Messaging routes

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/messages
 * @desc    Send message through WhatsApp Cloud API
 * @access  Private
 */
router.post(
  '/messages',
  validateRequest(sendMessageSchema),
  whatsappCloudController.sendMessage.bind(whatsappCloudController)
);

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/templates/send
 * @desc    Send template message through WhatsApp Cloud API
 * @access  Private
 */
router.post(
  '/templates/send',
  validateRequest(sendTemplateSchema),
  whatsappCloudController.sendTemplate.bind(whatsappCloudController)
);

// Webhook routes (no authentication)

/**
 * @route   GET /api/bridge/v1/whatsapp-cloud/webhook
 * @desc    Verify WhatsApp Cloud API webhook
 * @access  Public (webhook verification)
 */
router.get(
  '/webhook',
  validateRequest(webhookVerificationSchema),
  whatsappCloudController.verifyWebhook.bind(whatsappCloudController)
);

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/webhook
 * @desc    Process WhatsApp Cloud API webhook
 * @access  Public (webhook processing)
 */
router.post(
  '/webhook',
  // Note: Webhook payload validation is handled internally due to Meta's specific format
  whatsappCloudController.processWebhook.bind(whatsappCloudController)
);

// Health check route

/**
 * @route   GET /api/bridge/v1/whatsapp-cloud/health
 * @desc    Health check for WhatsApp Cloud API connections
 * @access  Private
 */
router.get(
  '/health',
  validateRequest(healthCheckSchema),
  whatsappCloudController.healthCheck.bind(whatsappCloudController)
);

/**
 * @route   GET /api/bridge/v1/whatsapp-cloud/queue/stats
 * @desc    Get message queue statistics
 * @access  Private
 */
router.get(
  '/queue/stats',
  validateRequest(healthCheckSchema),
  whatsappCloudController.getQueueStats.bind(whatsappCloudController)
);

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/queue/pause
 * @desc    Pause message queue
 * @access  Private
 */
router.post(
  '/queue/pause',
  validateRequest(healthCheckSchema),
  whatsappCloudController.pauseQueue.bind(whatsappCloudController)
);

/**
 * @route   POST /api/bridge/v1/whatsapp-cloud/queue/resume
 * @desc    Resume message queue
 * @access  Private
 */
router.post(
  '/queue/resume',
  validateRequest(healthCheckSchema),
  whatsappCloudController.resumeQueue.bind(whatsappCloudController)
);

export default router;