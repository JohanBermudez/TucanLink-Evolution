import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env')
});

export const config = {
  api: {
    port: parseInt(process.env.API_BRIDGE_PORT || '8090', 10),
    prefix: '/api/bridge/v1',
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },
  
  jwt: {
    secret: process.env.API_BRIDGE_JWT_SECRET || 'default-jwt-secret-change-in-production',
    accessTokenExpiration: process.env.API_BRIDGE_ACCESS_TOKEN_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.API_BRIDGE_REFRESH_TOKEN_EXPIRATION || '7d',
    algorithm: 'HS256' as const,
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.API_BRIDGE_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequestsPerWindow: {
      default: parseInt(process.env.API_BRIDGE_RATE_LIMIT_DEFAULT || '100', 10),
      apiKey: parseInt(process.env.API_BRIDGE_RATE_LIMIT_API_KEY || '1000', 10),
      jwt: parseInt(process.env.API_BRIDGE_RATE_LIMIT_JWT || '500', 10),
    },
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  cors: {
    origin: process.env.API_BRIDGE_CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3333'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID', 'X-Company-Id'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400, // 24 hours
  },
  
  logging: {
    level: process.env.API_BRIDGE_LOG_LEVEL || 'info',
    format: process.env.API_BRIDGE_LOG_FORMAT || 'json',
    colorize: process.env.NODE_ENV !== 'production',
    timestamp: true,
    prettyPrint: process.env.NODE_ENV !== 'production',
  },
  
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
    bcryptRounds: 10,
    apiKeyPrefix: 'tlk_',
    apiKeyLength: 32,
  },
  
  cache: {
    ttl: parseInt(process.env.API_BRIDGE_CACHE_TTL || '300', 10), // 5 minutes
    checkPeriod: parseInt(process.env.API_BRIDGE_CACHE_CHECK_PERIOD || '600', 10), // 10 minutes
  },
  
  webhook: {
    maxRetries: parseInt(process.env.API_BRIDGE_WEBHOOK_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.API_BRIDGE_WEBHOOK_RETRY_DELAY || '1000', 10),
    timeout: parseInt(process.env.API_BRIDGE_WEBHOOK_TIMEOUT || '30000', 10),
    maxPayloadSize: '10mb',
  },
  
  pagination: {
    defaultLimit: parseInt(process.env.API_BRIDGE_PAGINATION_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.API_BRIDGE_PAGINATION_MAX_LIMIT || '100', 10),
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: process.env.DB_DIALECT as 'postgres' || 'postgres',
    database: process.env.DB_NAME || 'tucanlink',
    username: process.env.DB_USER || 'tucanlink',
    password: process.env.DB_PASS || 'tucanlink123',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  
  redis: {
    host: process.env.IO_REDIS_SERVER || 'localhost',
    port: parseInt(process.env.IO_REDIS_PORT || '6379', 10),
    password: process.env.IO_REDIS_PASSWORD || undefined,
    db: parseInt(process.env.IO_REDIS_DB || '0', 10),
  },
  
  core: {
    baseUrl: process.env.CORE_BASE_URL || 'http://localhost:8080',
    internalApiKey: process.env.CORE_INTERNAL_API_KEY || 'internal-api-key-for-core-communication',
  },
  
  monitoring: {
    metricsPath: '/api/bridge/metrics',
    healthPath: '/api/bridge/v1/health',
    readinessPath: '/api/bridge/v1/health/ready',
    livenessPath: '/api/bridge/v1/health/live',
  },
};

export const validateConfig = (): void => {
  const requiredEnvVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  if (config.jwt.secret === 'default-jwt-secret-change-in-production' && config.api.isProduction) {
    throw new Error('JWT secret must be changed in production!');
  }
};

export default config;