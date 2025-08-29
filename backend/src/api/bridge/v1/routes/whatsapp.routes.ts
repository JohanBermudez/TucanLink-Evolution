import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { whatsappController } from '../controllers/whatsapp.controller';

const router = Router();

// Validation schemas
const listWhatsappSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('CONNECTED', 'DISCONNECTED', 'OPENING', 'QRCODE', 'TIMEOUT').optional(),
    includeQueues: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'status', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createWhatsappSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    greetingMessage: Joi.string().allow('').max(1000).optional(),
    farewellMessage: Joi.string().allow('').max(1000).optional(),
    complationMessage: Joi.string().allow('').max(1000).optional(),
    outOfHoursMessage: Joi.string().allow('').max(1000).optional(),
    ratingMessage: Joi.string().allow('').max(1000).optional(),
    provider: Joi.string().valid('stable', 'beta').default('stable'),
    isDefault: Joi.boolean().default(false),
    token: Joi.string().allow('').optional(),
    sendIdQueue: Joi.number().integer().positive().allow(null).optional(),
    timeSendQueue: Joi.number().integer().min(0).optional(),
    promptId: Joi.number().integer().positive().allow(null).optional(),
    collectiveVacationMessage: Joi.string().allow('').optional(),
    collectiveVacationStart: Joi.date().iso().allow(null).optional(),
    collectiveVacationEnd: Joi.date().iso().allow(null).optional(),
    maxUseBotQueues: Joi.number().integer().min(0).optional(),
    timeUseBotQueues: Joi.number().integer().min(0).optional(),
    expiresTicket: Joi.number().integer().min(0).optional(),
    expiresInactiveMessage: Joi.string().allow('').optional(),
    importOldMessages: Joi.boolean().optional(),
    importRecentMessages: Joi.boolean().optional(),
    closedTicketsPostImported: Joi.boolean().optional(),
    importOldMessagesGroups: Joi.boolean().optional(),
    groupAsTicket: Joi.string().valid('disabled', 'enabled').default('disabled'),
    queueIdImportMessages: Joi.number().integer().positive().allow(null).optional(),
  }),
});

const showWhatsappSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    includeQR: Joi.boolean().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateWhatsappSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    greetingMessage: Joi.string().allow('').max(1000).optional(),
    farewellMessage: Joi.string().allow('').max(1000).optional(),
    complationMessage: Joi.string().allow('').max(1000).optional(),
    outOfHoursMessage: Joi.string().allow('').max(1000).optional(),
    ratingMessage: Joi.string().allow('').max(1000).optional(),
    isDefault: Joi.boolean().optional(),
    token: Joi.string().allow('').optional(),
    sendIdQueue: Joi.number().integer().positive().allow(null).optional(),
    timeSendQueue: Joi.number().integer().min(0).optional(),
    promptId: Joi.number().integer().positive().allow(null).optional(),
    collectiveVacationMessage: Joi.string().allow('').optional(),
    collectiveVacationStart: Joi.date().iso().allow(null).optional(),
    collectiveVacationEnd: Joi.date().iso().allow(null).optional(),
    maxUseBotQueues: Joi.number().integer().min(0).optional(),
    timeUseBotQueues: Joi.number().integer().min(0).optional(),
    expiresTicket: Joi.number().integer().min(0).optional(),
    expiresInactiveMessage: Joi.string().allow('').optional(),
    importOldMessages: Joi.boolean().optional(),
    importRecentMessages: Joi.boolean().optional(),
    closedTicketsPostImported: Joi.boolean().optional(),
    importOldMessagesGroups: Joi.boolean().optional(),
    groupAsTicket: Joi.string().valid('disabled', 'enabled').optional(),
    queueIdImportMessages: Joi.number().integer().positive().allow(null).optional(),
  }),
});

const deleteWhatsappSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const idOnlySchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   GET /api/bridge/v1/whatsapp
 * @desc    List WhatsApp sessions
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listWhatsappSchema),
  whatsappController.list.bind(whatsappController)
);

/**
 * @route   POST /api/bridge/v1/whatsapp
 * @desc    Create a new WhatsApp session
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createWhatsappSchema),
  whatsappController.create.bind(whatsappController)
);

/**
 * @route   GET /api/bridge/v1/whatsapp/:id
 * @desc    Get single WhatsApp session by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showWhatsappSchema),
  whatsappController.show.bind(whatsappController)
);

/**
 * @route   PUT /api/bridge/v1/whatsapp/:id
 * @desc    Update WhatsApp session
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateWhatsappSchema),
  whatsappController.update.bind(whatsappController)
);

/**
 * @route   DELETE /api/bridge/v1/whatsapp/:id
 * @desc    Delete WhatsApp session
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteWhatsappSchema),
  whatsappController.delete.bind(whatsappController)
);



export default router;