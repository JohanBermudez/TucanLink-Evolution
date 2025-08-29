import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import sequelize from '../../../../database';
import Contact from '../../../../models/Contact';
import ContactCustomField from '../../../../models/ContactCustomField';
import Ticket from '../../../../models/Ticket';
import Whatsapp from '../../../../models/Whatsapp';
import { logger } from '../utils/logger';

// Ensure database is connected
sequelize.authenticate().catch(err => {
  logger.error('Database connection error:', err);
});

/**
 * Contacts Controller for API Bridge
 * Provides RESTful endpoints for contact management
 */
export class ContactsController {
  /**
   * List contacts with filtering, pagination, and search
   * GET /api/bridge/v1/contacts
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        isGroup,
        disableBot,
        whatsappId,
        sortBy = 'name',
        sortOrder = 'ASC',
        includeCustomFields = false,
      } = req.query;

      const companyId = req.companyId || Number(req.query.companyId);
      const offset = (Number(page) - 1) * Number(limit);

      logger.info('Contacts list request', { companyId, page, limit });

      // Build where conditions
      const whereConditions: WhereOptions = {};
      
      if (companyId) {
        whereConditions.companyId = companyId;
      }

      // Search by name, number, or email
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { number: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Filter by group status
      if (isGroup !== undefined) {
        whereConditions.isGroup = isGroup === 'true';
      }

      // Filter by bot status
      if (disableBot !== undefined) {
        whereConditions.disableBot = disableBot === 'true';
      }

      // Filter by WhatsApp connection
      if (whatsappId) {
        whereConditions.whatsappId = Number(whatsappId);
      }

      // Build include conditions
      const includeConditions = [];
      
      if (includeCustomFields === 'true' || includeCustomFields === true) {
        includeConditions.push({
          model: ContactCustomField,
          as: 'extraInfo',
          attributes: ['id', 'name', 'value'],
        });
      }

      logger.info('Executing Contact query with conditions', { whereConditions });

      // Execute query
      const { count, rows: contacts } = await Contact.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        distinct: true,
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
        },
      });

      logger.info('Query completed', { count, rowsReturned: contacts.length });

      // Calculate pagination info
      const totalPages = Math.ceil(count / Number(limit));
      const hasMore = Number(page) < totalPages;

      res.json({
        success: true,
        data: {
          contacts,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages,
            hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to list contacts', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to list contacts',
        details: error.stack,
      });
    }
  }

  /**
   * Create a new contact
   * POST /api/bridge/v1/contacts
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Create contact request', { body: req.body, companyId: req.companyId });
      
      const {
        name,
        number,
        email = '',
        profilePicUrl = '',
        isGroup = false,
        disableBot = false,
        whatsappId,
        customFields = [],
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      // Validate required fields
      if (!name || !number) {
        logger.error('Missing required fields', { name, number, body: req.body });
        res.status(400).json({
          error: 'Bad Request',
          message: 'name and number are required',
          received: req.body,
        });
        return;
      }

      // Format WhatsApp number (remove non-digits and add country code if needed)
      const formattedNumber = number.replace(/\D/g, '');

      // Check if contact already exists
      const existingContact = await Contact.findOne({
        where: {
          number: formattedNumber,
          companyId,
        },
      });

      if (existingContact) {
        res.status(409).json({
          error: 'Conflict',
          message: 'Contact with this number already exists',
          data: existingContact,
        });
        return;
      }

      // Create contact
      const contact = await Contact.create({
        name,
        number: formattedNumber,
        email,
        profilePicUrl,
        isGroup,
        disableBot,
        companyId,
        whatsappId,
      });

      // Add custom fields if provided
      if (Array.isArray(customFields) && customFields.length > 0) {
        const customFieldsData = customFields.map(field => ({
          name: field.name,
          value: field.value,
          contactId: contact.id,
        }));
        
        await ContactCustomField.bulkCreate(customFieldsData);
        
        // Reload contact with custom fields
        await contact.reload({
          include: [{
            model: ContactCustomField,
            as: 'extraInfo',
          }],
        });
      }

      res.status(201).json({
        success: true,
        data: contact,
        message: 'Contact created successfully',
      });
    } catch (error) {
      logger.error('Failed to create contact', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create contact',
      });
    }
  }

  /**
   * Get single contact by ID
   * GET /api/bridge/v1/contacts/:id
   */
  async show(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { includeTickets = false } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      // Build include conditions
      const includeConditions = [
        {
          model: ContactCustomField,
          as: 'extraInfo',
          attributes: ['id', 'name', 'value'],
        },
        {
          model: Whatsapp,
          as: 'whatsapp',
          attributes: ['id', 'name', 'status'],
        },
      ];

      if (includeTickets === 'true' || includeTickets === true) {
        includeConditions.push({
          model: Ticket,
          as: 'tickets',
          limit: 5,
          order: [['updatedAt', 'DESC']],
          attributes: ['id', 'status', 'lastMessage', 'updatedAt'],
        } as any);
      }

      const contact = await Contact.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
        include: includeConditions,
      });

      if (!contact) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found',
        });
        return;
      }

      res.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      logger.error('Failed to get contact', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get contact',
      });
    }
  }

  /**
   * Update contact
   * PUT /api/bridge/v1/contacts/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        email,
        profilePicUrl,
        disableBot,
        customFields,
      } = req.body;

      const companyId = req.companyId || Number(req.query.companyId);

      const contact = await Contact.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!contact) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found',
        });
        return;
      }

      // Update fields (number cannot be changed)
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (profilePicUrl !== undefined) updates.profilePicUrl = profilePicUrl;
      if (disableBot !== undefined) updates.disableBot = disableBot;

      await contact.update(updates);

      // Update custom fields if provided
      if (Array.isArray(customFields)) {
        // Remove existing custom fields
        await ContactCustomField.destroy({
          where: { contactId: contact.id },
        });

        // Add new custom fields
        if (customFields.length > 0) {
          const customFieldsData = customFields.map(field => ({
            name: field.name,
            value: field.value,
            contactId: contact.id,
          }));
          
          await ContactCustomField.bulkCreate(customFieldsData);
        }
      }

      // Reload with associations
      const updatedContact = await Contact.findByPk(contact.id, {
        include: [{
          model: ContactCustomField,
          as: 'extraInfo',
        }],
      });

      res.json({
        success: true,
        data: updatedContact,
        message: 'Contact updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update contact', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update contact',
      });
    }
  }

  /**
   * Delete contact (soft delete)
   * DELETE /api/bridge/v1/contacts/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyId = req.companyId || Number(req.query.companyId);

      const contact = await Contact.findOne({
        where: {
          id: Number(id),
          ...(companyId && { companyId }),
        },
      });

      if (!contact) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Contact not found',
        });
        return;
      }

      // Check if contact has active tickets
      const activeTickets = await Ticket.count({
        where: {
          contactId: contact.id,
          status: {
            [Op.ne]: 'closed',
          },
        },
      });

      if (activeTickets > 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Cannot delete contact with ${activeTickets} active ticket(s)`,
        });
        return;
      }

      await contact.destroy();

      res.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error) {
      logger.error('Failed to delete contact', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete contact',
      });
    }
  }

  /**
   * Search contacts by number or name
   * GET /api/bridge/v1/contacts/search
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit = 10 } = req.query;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!query) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Query parameter is required',
        });
        return;
      }

      const contacts = await Contact.findAll({
        where: {
          ...(companyId && { companyId }),
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } },
            { number: { [Op.iLike]: `%${query}%` } },
          ],
        },
        limit: Number(limit),
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'number', 'email', 'profilePicUrl'],
      });

      res.json({
        success: true,
        data: contacts,
      });
    } catch (error) {
      logger.error('Failed to search contacts', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search contacts',
      });
    }
  }

  /**
   * Check if a WhatsApp number is valid
   * POST /api/bridge/v1/contacts/check-number
   */
  async checkNumber(req: Request, res: Response): Promise<void> {
    try {
      const { number } = req.body;

      if (!number) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Number is required',
        });
        return;
      }

      // Format number (remove non-digits)
      const formattedNumber = number.replace(/\D/g, '');

      // Basic validation (should have at least 10 digits)
      const isValid = formattedNumber.length >= 10 && formattedNumber.length <= 15;

      res.json({
        success: true,
        data: {
          number: formattedNumber,
          isValid,
          formatted: formattedNumber,
        },
      });
    } catch (error) {
      logger.error('Failed to check number', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check number',
      });
    }
  }

  /**
   * Import contacts in bulk
   * POST /api/bridge/v1/contacts/import
   */
  async import(req: Request, res: Response): Promise<void> {
    try {
      const { contacts } = req.body;
      const companyId = req.companyId || Number(req.query.companyId);

      if (!Array.isArray(contacts) || contacts.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Contacts array is required',
        });
        return;
      }

      const results = {
        created: 0,
        updated: 0,
        errors: [],
      };

      for (const contactData of contacts) {
        try {
          const formattedNumber = contactData.number.replace(/\D/g, '');
          
          // Check if contact exists
          const existingContact = await Contact.findOne({
            where: {
              number: formattedNumber,
              companyId,
            },
          });

          if (existingContact) {
            // Update existing contact
            await existingContact.update({
              name: contactData.name || existingContact.name,
              email: contactData.email || existingContact.email,
            });
            results.updated++;
          } else {
            // Create new contact
            await Contact.create({
              name: contactData.name,
              number: formattedNumber,
              email: contactData.email || '',
              companyId,
            });
            results.created++;
          }
        } catch (error) {
          results.errors.push({
            contact: contactData,
            error: error.message,
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
      });
    } catch (error) {
      logger.error('Failed to import contacts', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to import contacts',
      });
    }
  }
}

export const contactsController = new ContactsController();