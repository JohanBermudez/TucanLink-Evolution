import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { tagsController } from '../controllers/tags.controller';

const router = Router();

// Validation schemas
const listTagsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    search: Joi.string().optional(),
    kanban: Joi.number().integer().optional(),
    includeTicketCount: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'createdAt', 'kanban').default('name'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createTagSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).default('#0099FF'),
    kanban: Joi.number().integer().default(0),
  }),
});

const showTagSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    includeTickets: Joi.boolean().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateTagSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    color: Joi.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    kanban: Joi.number().integer().optional(),
  }),
});

const deleteTagSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const addToTicketSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    ticketId: Joi.number().integer().positive().required(),
  }),
});

const removeFromTicketSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
    ticketId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   GET /api/bridge/v1/tags
 * @desc    List tags
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listTagsSchema),
  tagsController.list.bind(tagsController)
);

/**
 * @route   POST /api/bridge/v1/tags
 * @desc    Create a new tag
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createTagSchema),
  tagsController.create.bind(tagsController)
);

/**
 * @route   GET /api/bridge/v1/tags/:id
 * @desc    Get single tag by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showTagSchema),
  tagsController.show.bind(tagsController)
);

/**
 * @route   PUT /api/bridge/v1/tags/:id
 * @desc    Update tag
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateTagSchema),
  tagsController.update.bind(tagsController)
);

/**
 * @route   DELETE /api/bridge/v1/tags/:id
 * @desc    Delete tag
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteTagSchema),
  tagsController.delete.bind(tagsController)
);

/**
 * @route   POST /api/bridge/v1/tags/:id/tickets
 * @desc    Add tag to ticket
 * @access  Private
 */
router.post(
  '/:id/tickets',
  validateRequest(addToTicketSchema),
  tagsController.addToTicket.bind(tagsController)
);

/**
 * @route   DELETE /api/bridge/v1/tags/:id/tickets/:ticketId
 * @desc    Remove tag from ticket
 * @access  Private
 */
router.delete(
  '/:id/tickets/:ticketId',
  validateRequest(removeFromTicketSchema),
  tagsController.removeFromTicket.bind(tagsController)
);

export default router;