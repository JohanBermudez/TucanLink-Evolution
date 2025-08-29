import { Router } from 'express';
import { ticketsController } from '../controllers/tickets.controller';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import Joi from 'joi';

const router = Router();

/**
 * Ticket validation schemas
 */
const listTicketsSchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid('open', 'pending', 'closed'),
  userId: Joi.number().integer(),
  queueId: Joi.alternatives().try(Joi.number().integer(), Joi.string().valid('null')),
  contactId: Joi.number().integer(),
  dateStart: Joi.date().iso(),
  dateEnd: Joi.date().iso(),
  searchParam: Joi.string(),
  withUnreadMessages: Joi.string().valid('true', 'false'),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'id'),
  sortOrder: Joi.string().valid('ASC', 'DESC'),
  includeMessages: Joi.boolean(),
  includeTags: Joi.boolean(),
});

const createTicketSchema = Joi.object({
  contactId: Joi.number().integer().required(),
  status: Joi.string().valid('open', 'pending', 'closed').default('pending'),
  queueId: Joi.number().integer().allow(null),
  whatsappId: Joi.number().integer(),
  isGroup: Joi.boolean().default(false),
});

const updateTicketSchema = Joi.object({
  status: Joi.string().valid('open', 'pending', 'closed'),
  queueId: Joi.number().integer().allow(null),
  userId: Joi.number().integer().allow(null),
  tags: Joi.array().items(Joi.number().integer()),
});

const transferTicketSchema = Joi.object({
  queueId: Joi.number().integer().allow(null),
  userId: Joi.number().integer().allow(null),
}).or('queueId', 'userId');

/**
 * Ticket Management Routes
 * Support both JWT and API Key authentication
 */

// List tickets with filtering and pagination
router.get(
  '/',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  validateRequest(listTicketsSchema, 'query'),
  ticketsController.list
);

// Get single ticket
router.get(
  '/:id',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  ticketsController.show
);

// Create new ticket
router.post(
  '/',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  validateRequest(createTicketSchema),
  ticketsController.create
);

// Update ticket
router.put(
  '/:id',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  validateRequest(updateTicketSchema),
  ticketsController.update
);

// Delete ticket
router.delete(
  '/:id',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  ticketsController.delete
);

// Transfer ticket
router.post(
  '/:id/transfer',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  validateRequest(transferTicketSchema),
  ticketsController.transfer
);

// Resolve ticket
router.post(
  '/:id/resolve',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  ticketsController.resolve
);

// Reopen ticket
router.post(
  '/:id/reopen',
  authenticateJWT({ required: false }),
  authenticateApiKey({ required: false }),
  ticketsController.reopen
);

export default router;