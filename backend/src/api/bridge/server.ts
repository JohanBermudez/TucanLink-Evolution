import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import winston from 'winston';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import 'express-async-errors';
import { config, validateConfig } from './config';
import { initializeDatabase } from './v1/database';
import sequelize from '../../database'; // Use existing core database
import apiKeyRoutes from './v1/routes/apiKey.routes';
import adminRoutes from './v1/routes/admin.routes';
import authRoutes from './v1/routes/auth.routes';
import ticketsRoutes from './v1/routes/tickets.routes';
import messagesRoutes from './v1/routes/messages.routes';
import contactsRoutes from './v1/routes/contacts.routes';
import queuesRoutes from './v1/routes/queues.routes';
import whatsappRoutes from './v1/routes/whatsapp.routes';
import usersRoutes from './v1/routes/users.routes';
import tagsRoutes from './v1/routes/tags.routes';
import companyRoutes from './v1/routes/company.routes';
import settingsRoutes from './v1/routes/settings.routes';
import scheduleRoutes from './v1/routes/schedule.routes';
import statusRoutes from './v1/routes/status.routes';

const app: Express = express();
const httpServer: HttpServer = createServer(app);
const io: SocketIOServer = new SocketIOServer(httpServer, {
  cors: config.cors,
  path: '/api/bridge/socket.io/',
});

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-bridge' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Load Swagger documentation
const swaggerDocument = YAML.load(path.join(__dirname, 'v1/swagger/swagger.yaml'));

// Configure Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TucanLink API Bridge Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
    filter: true,
    validatorUrl: null,
    oauth2RedirectUrl: `${config.api.baseUrl || 'http://localhost:8090'}/api/bridge/docs/oauth2-redirect.html`,
    initOAuth: {
      clientId: 'swagger-ui',
      realm: 'tucanlink',
      appName: 'TucanLink API Bridge',
      scopeSeparator: ' ',
      additionalQueryStringParams: {}
    }
  },
};

// Setup Swagger UI before other middlewares
app.use('/api/bridge/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors(config.cors));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
  next();
});

app.get('/api/bridge/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.api.environment,
    version: '1.0.0',
  });
});

app.get('/api/bridge/v1/health/ready', async (_req: Request, res: Response) => {
  const checks = {
    server: true,
    timestamp: new Date().toISOString(),
  };
  
  const allHealthy = Object.values(checks).every(check => check === true || typeof check === 'string');
  
  if (allHealthy) {
    res.json({
      status: 'ready',
      checks,
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      checks,
    });
  }
});

app.get('/api/bridge/v1/health/live', (_req: Request, res: Response) => {
  res.json({
    status: 'live',
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint to debug auth issues
app.get('/api/bridge/v1/test/contacts', async (req: Request, res: Response) => {
  try {
    const Contact = (await import('../../models/Contact')).default;
    const contacts = await Contact.findAll({ limit: 5 });
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (error: any) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// API Key management routes
app.use('/api/bridge/v1/api-keys', apiKeyRoutes);

// Admin routes
app.use('/api/bridge/v1/admin', adminRoutes);

// Authentication routes (public - no auth required)
app.use('/api/bridge/v1/auth', authRoutes);

// Core API routes
app.use('/api/bridge/v1/tickets', ticketsRoutes);
app.use('/api/bridge/v1/messages', messagesRoutes);
app.use('/api/bridge/v1/contacts', contactsRoutes);
app.use('/api/bridge/v1/queues', queuesRoutes);
app.use('/api/bridge/v1/whatsapp', whatsappRoutes);
app.use('/api/bridge/v1/users', usersRoutes);
app.use('/api/bridge/v1/tags', tagsRoutes);
app.use('/api/bridge/v1/companies', companyRoutes);
app.use('/api/bridge/v1/settings', settingsRoutes);
app.use('/api/bridge/v1/schedules', scheduleRoutes);

// Status endpoint (public - no auth required)
app.use('/api/bridge/v1/status', statusRoutes);

app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      ...(config.api.isDevelopment && { stack: err.stack }),
    },
  });
});

io.on('connection', (socket) => {
  logger.info('New WebSocket connection', { socketId: socket.id });
  
  socket.on('subscribe', (data) => {
    logger.info('Client subscribing to events', { socketId: socket.id, data });
  });
  
  socket.on('disconnect', () => {
    logger.info('WebSocket disconnected', { socketId: socket.id });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

const startServer = async (): Promise<void> => {
  try {
    validateConfig();
    
    // Initialize database connections
    await initializeDatabase(); // API Keys database (optional)
    
    // Verify core database connection
    try {
      await sequelize.authenticate();
      logger.info('Core database connection verified');
    } catch (error) {
      logger.error('Core database connection failed:', error);
      throw error;
    }
    
    httpServer.listen(config.api.port, () => {
      logger.info(`🚀 API Bridge server is running on port ${config.api.port}`);
      logger.info(`📡 WebSocket server is ready`);
      logger.info(`🔧 Environment: ${config.api.environment}`);
      logger.info(`📚 API Documentation: http://localhost:${config.api.port}/api/bridge/docs`);
      logger.info(`❤️  Health check: http://localhost:${config.api.port}/api/bridge/v1/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export { app, httpServer, io, logger };