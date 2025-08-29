import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { queuesController } from '../controllers/queues.controller';

const router = Router();

// Validation schemas
const listQueuesSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    includeUsers: Joi.boolean().optional(),
    includeWhatsapps: Joi.boolean().optional(),
    includeOptions: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'orderQueue', 'createdAt').default('orderQueue'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createQueueSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    color: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .required()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)',
      }),
    greetingMessage: Joi.string().allow('').max(1000).optional(),
    outOfHoursMessage: Joi.string().allow('').max(1000).optional(),
    schedules: Joi.array()
      .items(
        Joi.object({
          weekday: Joi.number().min(0).max(6).required(),
          startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        })
      )
      .optional(),
    orderQueue: Joi.number().integer().min(0).optional(),
    integrationId: Joi.number().integer().positive().optional(),
    promptId: Joi.number().integer().positive().optional(),
  }),
});

const showQueueSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateQueueSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    color: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color code (e.g., #FF5733)',
      }),
    greetingMessage: Joi.string().allow('').max(1000).optional(),
    outOfHoursMessage: Joi.string().allow('').max(1000).optional(),
    schedules: Joi.array()
      .items(
        Joi.object({
          weekday: Joi.number().min(0).max(6).required(),
          startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        })
      )
      .optional(),
    orderQueue: Joi.number().integer().min(0).optional(),
    integrationId: Joi.number().integer().positive().optional(),
    promptId: Joi.number().integer().positive().optional(),
  }),
});

const deleteQueueSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const assignUsersSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    userIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(0)
      .required(),
  }),
});

const assignWhatsappsSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    whatsappIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(0)
      .required(),
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   GET /api/bridge/v1/queues
 * @desc    List queues with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listQueuesSchema),
  queuesController.list.bind(queuesController)
);

/**
 * @route   POST /api/bridge/v1/queues
 * @desc    Create a new queue
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createQueueSchema),
  queuesController.create.bind(queuesController)
);

/**
 * @route   GET /api/bridge/v1/queues/:id
 * @desc    Get single queue by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showQueueSchema),
  queuesController.show.bind(queuesController)
);

/**
 * @route   PUT /api/bridge/v1/queues/:id
 * @desc    Update queue
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateQueueSchema),
  queuesController.update.bind(queuesController)
);

/**
 * @route   DELETE /api/bridge/v1/queues/:id
 * @desc    Delete queue
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteQueueSchema),
  queuesController.delete.bind(queuesController)
);

/**
 * @route   POST /api/bridge/v1/queues/:id/users
 * @desc    Assign users to queue
 * @access  Private
 */
router.post(
  '/:id/users',
  validateRequest(assignUsersSchema),
  queuesController.assignUsers.bind(queuesController)
);

/**
 * @route   POST /api/bridge/v1/queues/:id/whatsapps
 * @desc    Assign WhatsApp connections to queue
 * @access  Private
 */
router.post(
  '/:id/whatsapps',
  validateRequest(assignWhatsappsSchema),
  queuesController.assignWhatsapps.bind(queuesController)
);

export default router;