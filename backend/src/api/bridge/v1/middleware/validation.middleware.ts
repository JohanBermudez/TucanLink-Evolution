import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

/**
 * Validation middleware for request data
 * @param schema - Joi validation schema (can be a simple schema or a composite schema with body/query/params properties)
 */
export function validateRequest(schema: Joi.Schema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if this is a composite schema (has body, query, or params properties)
      const schemaDescription = schema.describe();
      const hasCompositeKeys = schemaDescription.keys && (
        'body' in schemaDescription.keys ||
        'query' in schemaDescription.keys ||
        'params' in schemaDescription.keys
      );

      let dataToValidate: any;
      let validatedData: any;

      if (hasCompositeKeys) {
        // Composite schema - validate multiple parts of the request
        dataToValidate = {
          body: req.body,
          query: req.query,
          params: req.params,
        };
        
        const { error, value } = schema.validate(dataToValidate, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
          allowUnknown: false,
        });

        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          }));

          logger.warn('Validation failed', {
            path: req.path,
            method: req.method,
            errors,
            ip: req.ip,
          });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Request validation failed',
            errors,
          });
        }

        // Apply validated data back to request
        if (value.body) req.body = value.body;
        if (value.query) req.query = value.query;
        if (value.params) req.params = value.params;
      } else {
        // Simple schema - assume it validates the body
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type,
          }));

          logger.warn('Validation failed', {
            path: req.path,
            method: req.method,
            errors,
            ip: req.ip,
          });

          return res.status(400).json({
            error: 'Validation Error',
            message: 'Request validation failed',
            errors,
          });
        }

        req.body = value;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to validate request',
      });
    }
  };
}

/**
 * Custom Joi validators
 */
export const customValidators = {
  /**
   * Validate Brazilian phone number
   */
  phoneNumber: () =>
    Joi.string()
      .pattern(/^\d{10,11}$/)
      .message('Invalid phone number format'),

  /**
   * Validate email
   */
  email: () =>
    Joi.string()
      .email({ tlds: { allow: false } })
      .message('Invalid email format'),

  /**
   * Validate UUID
   */
  uuid: () =>
    Joi.string()
      .guid({ version: ['uuidv4'] })
      .message('Invalid UUID format'),

  /**
   * Validate date range
   */
  dateRange: () =>
    Joi.object({
      start: Joi.date().iso().required(),
      end: Joi.date().iso().greater(Joi.ref('start')).required(),
    }),

  /**
   * Validate pagination
   */
  pagination: () =>
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),

  /**
   * Validate sorting
   */
  sorting: (allowedFields: string[]) =>
    Joi.object({
      sortBy: Joi.string().valid(...allowedFields),
      sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
    }),
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * ID parameter validation
   */
  idParam: Joi.object({
    id: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().guid({ version: ['uuidv4'] })
    ).required(),
  }),

  /**
   * Pagination query validation
   */
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0),
  }),

  /**
   * Search query validation
   */
  searchQuery: Joi.object({
    search: Joi.string().min(1).max(255),
    searchFields: Joi.array().items(Joi.string()),
  }),

  /**
   * Date range query validation
   */
  dateRangeQuery: Joi.object({
    dateStart: Joi.date().iso(),
    dateEnd: Joi.date().iso().when('dateStart', {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref('dateStart')),
    }),
  }),
};

/**
 * Sanitization helpers
 */
export const sanitize = {
  /**
   * Sanitize HTML content
   */
  html: (input: string): string => {
    // Basic HTML sanitization - in production, use a library like DOMPurify
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Sanitize file name
   */
  fileName: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9._-]/g, '_');
  },

  /**
   * Sanitize SQL input (basic protection)
   */
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  },
};