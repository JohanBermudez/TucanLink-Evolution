import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { usersController } from '../controllers/users.controller';

const router = Router();

// Validation schemas
const listUsersSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().optional(),
    profile: Joi.string().valid('admin', 'user', 'supervisor').optional(),
    online: Joi.boolean().optional(),
    includeQueues: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'email', 'profile', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createUserSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    profile: Joi.string().valid('admin', 'user', 'supervisor').default('admin'),
    allTicket: Joi.string().valid('enabled', 'disabled').default('disabled'),
    whatsappId: Joi.number().integer().positive().allow(null).optional(),
    queueIds: Joi.array().items(Joi.number().integer().positive()).optional(),
  }),
});

const showUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(6).optional(),
    profile: Joi.string().valid('admin', 'user', 'supervisor').optional(),
    allTicket: Joi.string().valid('enabled', 'disabled').optional(),
    whatsappId: Joi.number().integer().positive().allow(null).optional(),
    queueIds: Joi.array().items(Joi.number().integer().positive()).optional(),
  }),
});

const deleteUserSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const assignQueuesSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    queueIds: Joi.array().items(Joi.number().integer().positive()).required(),
  }),
});

const updateStatusSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    online: Joi.boolean().required(),
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   GET /api/bridge/v1/users
 * @desc    List users
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listUsersSchema),
  usersController.list.bind(usersController)
);

/**
 * @route   POST /api/bridge/v1/users
 * @desc    Create a new user
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createUserSchema),
  usersController.create.bind(usersController)
);

/**
 * @route   GET /api/bridge/v1/users/:id
 * @desc    Get single user by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showUserSchema),
  usersController.show.bind(usersController)
);

/**
 * @route   PUT /api/bridge/v1/users/:id
 * @desc    Update user
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateUserSchema),
  usersController.update.bind(usersController)
);

/**
 * @route   DELETE /api/bridge/v1/users/:id
 * @desc    Delete/deactivate user
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteUserSchema),
  usersController.delete.bind(usersController)
);

/**
 * @route   POST /api/bridge/v1/users/:id/queues
 * @desc    Assign queues to user
 * @access  Private
 */
router.post(
  '/:id/queues',
  validateRequest(assignQueuesSchema),
  usersController.assignQueues.bind(usersController)
);

/**
 * @route   PATCH /api/bridge/v1/users/:id/status
 * @desc    Update user online status
 * @access  Private
 */
router.patch(
  '/:id/status',
  validateRequest(updateStatusSchema),
  usersController.updateStatus.bind(usersController)
);

export default router;