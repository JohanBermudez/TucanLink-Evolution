import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { messagesController } from '../controllers/messages.controller';

const router = Router();

// Validation schemas
const sendMessageSchema = Joi.object({
  body: Joi.object({
    ticketId: Joi.number().integer().positive().required(),
    body: Joi.string().min(1).max(5000).required(),
    quotedMessageId: Joi.string().optional(),
    mediaUrl: Joi.string().uri().optional(),
  }),
});

const listMessagesSchema = Joi.object({
  query: Joi.object({
    ticketId: Joi.number().integer().positive().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    fromMe: Joi.boolean().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const getByTicketSchema = Joi.object({
  params: Joi.object({
    ticketId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const markAsReadSchema = Joi.object({
  body: Joi.object({
    ticketId: Joi.number().integer().positive().optional(),
    messageIds: Joi.array().items(Joi.string()).optional(),
  }).or('ticketId', 'messageIds'),
});

const deleteMessageSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const statsSchema = Joi.object({
  query: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   POST /api/bridge/v1/messages
 * @desc    Send a WhatsApp message
 * @access  Private
 */
router.post(
  '/',
  validateRequest(sendMessageSchema),
  messagesController.send.bind(messagesController)
);

/**
 * @route   GET /api/bridge/v1/messages
 * @desc    List messages with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listMessagesSchema),
  messagesController.list.bind(messagesController)
);

/**
 * @route   GET /api/bridge/v1/messages/ticket/:ticketId
 * @desc    Get messages for a specific ticket
 * @access  Private
 */
router.get(
  '/ticket/:ticketId',
  validateRequest(getByTicketSchema),
  messagesController.getByTicket.bind(messagesController)
);

/**
 * @route   PUT /api/bridge/v1/messages/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put(
  '/read',
  validateRequest(markAsReadSchema),
  messagesController.markAsRead.bind(messagesController)
);

/**
 * @route   DELETE /api/bridge/v1/messages/:id
 * @desc    Delete a message (soft delete)
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteMessageSchema),
  messagesController.delete.bind(messagesController)
);

/**
 * @route   GET /api/bridge/v1/messages/stats
 * @desc    Get message statistics
 * @access  Private
 */
router.get(
  '/stats',
  validateRequest(statsSchema),
  messagesController.stats.bind(messagesController)
);

export default router;