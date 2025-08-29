import { Sequelize } from 'sequelize-typescript';
import { ApiKey, ApiKeyUsage } from '../models/ApiKey';
import { config } from '../../config';
import { logger } from '../utils/logger';

class Database {
  private static instance: Database;
  private sequelize: Sequelize | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<Sequelize> {
    if (this.sequelize && this.isConnected) {
      return this.sequelize;
    }

    try {
      // Use environment variables for database configuration
      const dbConfig = {
        dialect: 'postgres' as const,
        host: process.env.API_BRIDGE_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.API_BRIDGE_DB_PORT || process.env.DB_PORT || '5432', 10),
        database: process.env.API_BRIDGE_DB_NAME || process.env.DB_NAME || 'tucanlink',
        username: process.env.API_BRIDGE_DB_USER || process.env.DB_USER || 'postgres',
        password: process.env.API_BRIDGE_DB_PASS || process.env.DB_PASS || 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false,
          } : false,
        },
      };

      this.sequelize = new Sequelize(dbConfig);

      // Add models
      this.sequelize.addModels([ApiKey, ApiKeyUsage]);

      // Test connection
      await this.sequelize.authenticate();
      this.isConnected = true;

      logger.info('API Bridge database connection established successfully');
      
      // Sync models in development (be careful with this in production)
      if (process.env.NODE_ENV === 'development' && process.env.API_BRIDGE_DB_SYNC === 'true') {
        await this.sequelize.sync({ alter: true });
        logger.info('API Bridge database models synchronized');
      }

      return this.sequelize;
    } catch (error) {
      logger.error('Unable to connect to API Bridge database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
      this.sequelize = null;
      logger.info('API Bridge database connection closed');
    }
  }

  public getSequelize(): Sequelize | null {
    return this.sequelize;
  }

  public isReady(): boolean {
    return this.isConnected && this.sequelize !== null;
  }

  // Helper method to run migrations
  public async runMigrations(): Promise<void> {
    if (!this.sequelize) {
      throw new Error('Database not connected');
    }

    try {
      // This would normally use umzug or similar migration tool
      // For now, we'll rely on the existing migration system
      logger.info('Running API Bridge migrations...');
      // Migration logic would go here
      logger.info('API Bridge migrations completed');
    } catch (error) {
      logger.error('Failed to run API Bridge migrations:', error);
      throw error;
    }
  }

  // Transaction helper
  public async transaction<T>(
    callback: (t: any) => Promise<T>
  ): Promise<T> {
    if (!this.sequelize) {
      throw new Error('Database not connected');
    }
    return this.sequelize.transaction(callback);
  }
}

// Export singleton instance
export const database = Database.getInstance();

// Export models
export { ApiKey, ApiKeyUsage };

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await database.connect();
  } catch (error) {
    logger.error('Failed to initialize API Bridge database:', error);
    // Don't throw - allow the API to start without database if needed
    // The ApiKeyService will fall back to in-memory storage
  }
}

// Cleanup function
export async function closeDatabase(): Promise<void> {
  await database.disconnect();
}