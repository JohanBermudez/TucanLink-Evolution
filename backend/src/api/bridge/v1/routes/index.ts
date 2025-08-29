import { Router } from 'express';

// Import all route modules
import adminRoutes from './admin.routes';
import apiKeyRoutes from './apiKey.routes';
import authRoutes from './auth.routes';
import cacheAdminRoutes from './cache-admin.routes';
import companyRoutes from './company.routes';
import contactsRoutes from './contacts.routes';
import messagesRoutes from './messages.routes';
import queuesRoutes from './queues.routes';
import scheduleRoutes from './schedule.routes';
import settingsRoutes from './settings.routes';
import statusRoutes from './status.routes';
import tagsRoutes from './tags.routes';
import ticketsRoutes from './tickets.routes';
import usersRoutes from './users.routes';
import whatsappCloudRoutes from './whatsapp-cloud.routes';
import whatsappRoutes from './whatsapp.routes';

const router = Router();

/**
 * API v1 Routes
 * Main router that combines all API endpoints
 */

// Core authentication and authorization routes
router.use('/auth', authRoutes);
router.use('/api-keys', apiKeyRoutes);

// Company and user management routes
router.use('/companies', companyRoutes);
router.use('/users', usersRoutes);

// Ticket system routes
router.use('/tickets', ticketsRoutes);
router.use('/contacts', contactsRoutes);
router.use('/messages', messagesRoutes);
router.use('/queues', queuesRoutes);
router.use('/tags', tagsRoutes);

// WhatsApp integration routes
router.use('/whatsapp', whatsappRoutes);
router.use('/whatsapp-cloud', whatsappCloudRoutes);

// System administration routes
router.use('/admin', adminRoutes);
router.use('/cache', cacheAdminRoutes);

// System utilities routes
router.use('/status', statusRoutes);
router.use('/settings', settingsRoutes);
router.use('/schedule', scheduleRoutes);

export default router;