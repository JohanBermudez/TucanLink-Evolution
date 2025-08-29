import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../../../../logs/api-bridge');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Error file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Combined file transport
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false,
});

// Add HTTP request logging stream
const httpLogStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
const logWithContext = (
  level: string,
  message: string,
  context?: Record<string, any>
) => {
  const logMessage = context
    ? `${message} ${JSON.stringify(context)}`
    : message;
  logger.log(level, logMessage);
};

// Exported logging functions
export const logError = (message: string, error?: Error | any) => {
  if (error) {
    logger.error(`${message}: ${error.message || error}`, { 
      stack: error.stack,
      ...error 
    });
  } else {
    logger.error(message);
  }
};

export const logWarn = (message: string, context?: Record<string, any>) => {
  logWithContext('warn', message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logWithContext('info', message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logWithContext('debug', message, context);
};

export const logHttp = (message: string, context?: Record<string, any>) => {
  logWithContext('http', message, context);
};

// API Key specific logging
export const logApiKeyActivity = (
  action: string,
  apiKeyId: string,
  details?: Record<string, any>
) => {
  logger.info(`API Key Activity: ${action}`, {
    apiKeyId,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Performance logging
export const logPerformance = (
  operation: string,
  duration: number,
  details?: Record<string, any>
) => {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Security logging
export const logSecurity = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details?: Record<string, any>
) => {
  const level = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
  logger.log(level, `Security Event: ${event}`, {
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Export logger instance and stream
export { logger, httpLogStream };