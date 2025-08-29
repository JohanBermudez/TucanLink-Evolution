import { Router } from 'express';
import Joi from 'joi';
import { validateRequest } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { companyController } from '../controllers/company.controller';

const router = Router();

// Validation schemas
const listCompaniesSchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().optional(),
    status: Joi.boolean().optional(),
    includePlan: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'email', 'status', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC'),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const showCompanySchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    includePlan: Joi.boolean().optional(),
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

const updateCompanySchema = Joi.object({
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().optional(),
    language: Joi.string().max(10).optional(),
    schedules: Joi.array().optional(),
  }),
  query: Joi.object({
    companyId: Joi.number().integer().positive().optional(), // For testing
  }),
});

// Apply authentication middleware to all routes
router.use(authenticate());

/**
 * @route   GET /api/bridge/v1/companies
 * @desc    List companies
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listCompaniesSchema),
  companyController.list.bind(companyController)
);

/**
 * @route   GET /api/bridge/v1/companies/:id
 * @desc    Get single company by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(showCompanySchema),
  companyController.show.bind(companyController)
);

/**
 * @route   PUT /api/bridge/v1/companies/:id
 * @desc    Update company
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateCompanySchema),
  companyController.update.bind(companyController)
);

export default router;