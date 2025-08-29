import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// Validation schemas
const listSettingsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    search: Joi.string().optional(),
    key: Joi.string().optional(),
    sortBy: Joi.string().valid('key', 'value', 'createdAt').default('key'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const showSettingSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const getByKeySchema = Joi.object({
  params: Joi.object({
    key: Joi.string().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createSettingSchema = Joi.object({
  body: Joi.object({
    key: Joi.string().min(1).max(255).required(),
    value: Joi.string().allow('').required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateSettingSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    key: Joi.string().min(1).max(255).optional(),
    value: Joi.string().allow('').optional(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateByKeySchema = Joi.object({
  params: Joi.object({
    key: Joi.string().required(),
  }),
  body: Joi.object({
    value: Joi.string().allow('').required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const deleteSettingSchema = Joi.object({
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
 * @route   GET /api/bridge/v1/settings
 * @desc    List settings
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listSettingsSchema),
  settingsController.list.bind(settingsController)
);

/**
 * @route   POST /api/bridge/v1/settings
 * @desc    Create a new setting
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createSettingSchema),
  settingsController.create.bind(settingsController)
);

/**
 * @route   GET /api/bridge/v1/settings/key/:key
 * @desc    Get setting by key
 * @access  Private
 */
router.get(
  '/key/:key',
  validateRequest(getByKeySchema),
  settingsController.getByKey.bind(settingsController)
);

/**
 * @route   PUT /api/bridge/v1/settings/key/:key
 * @desc    Update setting value by key
 * @access  Private
 */
router.put(
  '/key/:key',
  validateRequest(updateByKeySchema),
  settingsController.updateByKey.bind(settingsController)
);

/**
 * @route   GET /api/bridge/v1/settings/:id
 * @desc    Get single setting by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showSettingSchema),
  settingsController.show.bind(settingsController)
);

/**
 * @route   PUT /api/bridge/v1/settings/:id
 * @desc    Update setting
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateSettingSchema),
  settingsController.update.bind(settingsController)
);

/**
 * @route   DELETE /api/bridge/v1/settings/:id
 * @desc    Delete setting
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteSettingSchema),
  settingsController.delete.bind(settingsController)
);

export default router;