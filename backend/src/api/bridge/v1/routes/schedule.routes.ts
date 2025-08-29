import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { scheduleController } from '../controllers/schedule.controller';

const router = Router();

// Validation schemas
const listSchedulesSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().optional(),
    status: Joi.string().valid('pending', 'sent', 'failed', 'cancelled').optional(),
    contactId: Joi.number().integer().positive().optional(),
    ticketId: Joi.number().integer().positive().optional(),
    userId: Joi.number().integer().positive().optional(),
    includeRelations: Joi.boolean().optional(),
    sortBy: Joi.string().valid('sendAt', 'createdAt', 'status').default('sendAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const showScheduleSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    includeRelations: Joi.boolean().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createScheduleSchema = Joi.object({
  body: Joi.object({
    body: Joi.string().min(1).required(),
    sendAt: Joi.date().iso().required(),
    contactId: Joi.number().integer().positive().required(),
    ticketId: Joi.number().integer().positive().optional(),
    userId: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('pending', 'sent', 'failed', 'cancelled').default('pending'),
    mediaPath: Joi.string().optional(),
    mediaName: Joi.string().optional(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateScheduleSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    body: Joi.string().min(1).optional(),
    sendAt: Joi.date().iso().optional(),
    contactId: Joi.number().integer().positive().optional(),
    ticketId: Joi.number().integer().positive().optional(),
    userId: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('pending', 'sent', 'failed', 'cancelled').optional(),
    mediaPath: Joi.string().optional(),
    mediaName: Joi.string().optional(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const deleteScheduleSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const markAsSentSchema = Joi.object({
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
 * @route   GET /api/bridge/v1/schedules
 * @desc    List schedules
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listSchedulesSchema),
  scheduleController.list.bind(scheduleController)
);

/**
 * @route   POST /api/bridge/v1/schedules
 * @desc    Create a new schedule
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createScheduleSchema),
  scheduleController.create.bind(scheduleController)
);

/**
 * @route   GET /api/bridge/v1/schedules/:id
 * @desc    Get single schedule by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showScheduleSchema),
  scheduleController.show.bind(scheduleController)
);

/**
 * @route   PUT /api/bridge/v1/schedules/:id
 * @desc    Update schedule
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateScheduleSchema),
  scheduleController.update.bind(scheduleController)
);

/**
 * @route   DELETE /api/bridge/v1/schedules/:id
 * @desc    Delete schedule
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteScheduleSchema),
  scheduleController.delete.bind(scheduleController)
);

/**
 * @route   PATCH /api/bridge/v1/schedules/:id/sent
 * @desc    Mark schedule as sent
 * @access  Private
 */
router.patch(
  '/:id/sent',
  validateRequest(markAsSentSchema),
  scheduleController.markAsSent.bind(scheduleController)
);

export default router;