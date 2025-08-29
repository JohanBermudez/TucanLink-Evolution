import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { contactsController } from '../controllers/contacts.controller';

const router = Router();

// Validation schemas
const listContactsSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    isGroup: Joi.boolean().optional(),
    disableBot: Joi.boolean().optional(),
    whatsappId: Joi.number().integer().positive().optional(),
    sortBy: Joi.string().valid('name', 'number', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    includeCustomFields: Joi.boolean().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const createContactSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    number: Joi.string()
      .pattern(/^[+]?[0-9]{10,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Number must be a valid phone number with 10-15 digits',
      }),
    email: Joi.string().email().allow('').optional(),
    profilePicUrl: Joi.string().uri().allow('').optional(),
    isGroup: Joi.boolean().default(false),
    disableBot: Joi.boolean().default(false),
    whatsappId: Joi.number().integer().positive().optional(),
    customFields: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.string().required(),
        })
      )
      .optional(),
  }),
});

const showContactSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    includeTickets: Joi.boolean().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateContactSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    email: Joi.string().email().allow('').optional(),
    profilePicUrl: Joi.string().uri().allow('').optional(),
    disableBot: Joi.boolean().optional(),
    customFields: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.string().required(),
        })
      )
      .optional(),
  }),
});

const deleteContactSchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const searchContactSchema = Joi.object({
  query: Joi.object({
    query: Joi.string().min(1).max(100).required(),
    limit: Joi.number().integer().min(1).max(50).default(10),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const checkNumberSchema = Joi.object({
  body: Joi.object({
    number: Joi.string()
      .pattern(/^[+]?[0-9]{10,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Number must be a valid phone number with 10-15 digits',
      }),
  }),
});

const importContactsSchema = Joi.object({
  body: Joi.object({
    contacts: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().min(1).max(255).required(),
          number: Joi.string()
            .pattern(/^[+]?[0-9]{10,15}$/)
            .required(),
          email: Joi.string().email().allow('').optional(),
        })
      )
      .min(1)
      .max(1000)
      .required(),
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   GET /api/bridge/v1/contacts
 * @desc    List contacts with filtering and pagination
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listContactsSchema),
  contactsController.list.bind(contactsController)
);

/**
 * @route   GET /api/bridge/v1/contacts/search
 * @desc    Search contacts by number or name
 * @access  Private
 */
router.get(
  '/search',
  validateRequest(searchContactSchema),
  contactsController.search.bind(contactsController)
);

/**
 * @route   POST /api/bridge/v1/contacts
 * @desc    Create a new contact
 * @access  Private
 */
router.post(
  '/',
  validateRequest(createContactSchema),
  contactsController.create.bind(contactsController)
);

/**
 * @route   POST /api/bridge/v1/contacts/check-number
 * @desc    Check if a WhatsApp number is valid
 * @access  Private
 */
router.post(
  '/check-number',
  validateRequest(checkNumberSchema),
  contactsController.checkNumber.bind(contactsController)
);

/**
 * @route   POST /api/bridge/v1/contacts/import
 * @desc    Import contacts in bulk
 * @access  Private
 */
router.post(
  '/import',
  validateRequest(importContactsSchema),
  contactsController.import.bind(contactsController)
);

/**
 * @route   GET /api/bridge/v1/contacts/:id
 * @desc    Get single contact by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showContactSchema),
  contactsController.show.bind(contactsController)
);

/**
 * @route   PUT /api/bridge/v1/contacts/:id
 * @desc    Update contact
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateContactSchema),
  contactsController.update.bind(contactsController)
);

/**
 * @route   DELETE /api/bridge/v1/contacts/:id
 * @desc    Delete contact
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(deleteContactSchema),
  contactsController.delete.bind(contactsController)
);

export default router;