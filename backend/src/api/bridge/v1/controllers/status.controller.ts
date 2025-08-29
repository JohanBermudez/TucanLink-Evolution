import { Request, Response } from 'express';
import sequelize from '../../../../database';
import { logger } from '../utils/logger';

interface ApiStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  lastCheck: string;
  endpoint: string;
  indicator: string;
}

/**
 * Status Controller for API Bridge
 * Provides real-time status of all API endpoints
 */
export class StatusController {
  private apiEndpoints = [
    { name: 'Tickets', endpoint: '/api/bridge/v1/tickets', model: 'Ticket' },
    { name: 'Messages', endpoint: '/api/bridge/v1/messages', model: 'Message' },
    { name: 'Contacts', endpoint: '/api/bridge/v1/contacts', model: 'Contact' },
    { name: 'Users', endpoint: '/api/bridge/v1/users', model: 'User' },
    { name: 'Tags', endpoint: '/api/bridge/v1/tags', model: 'Tag' },
    { name: 'Queues', endpoint: '/api/bridge/v1/queues', model: 'Queue' },
    { name: 'WhatsApp', endpoint: '/api/bridge/v1/whatsapp', model: 'Whatsapp' },
    { name: 'Companies', endpoint: '/api/bridge/v1/companies', model: 'Company' },
    { name: 'Settings', endpoint: '/api/bridge/v1/settings', model: 'Setting' },
    { name: 'Schedules', endpoint: '/api/bridge/v1/schedules', model: 'Schedule' },
  ];

  /**
   * Get comprehensive API status
   * GET /api/bridge/v1/status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const statuses: ApiStatus[] = [];
      
      // Check database connection first
      let dbStatus = 'operational';
      try {
        await sequelize.authenticate();
      } catch (error) {
        dbStatus = 'down';
        logger.error('Database connection failed during status check', error);
      }

      // Check each API endpoint
      for (const api of this.apiEndpoints) {
        const startTime = Date.now();
        let status: 'operational' | 'degraded' | 'down' = 'operational';
        let indicator = '✅';
        
        try {
          // Try to query the model to verify API is working
          const Model = sequelize.models[api.model];
          if (Model) {
            await Model.findOne({ limit: 1 });
          }
          
          const responseTime = Date.now() - startTime;
          
          // Determine status based on response time
          if (dbStatus === 'down') {
            status = 'down';
            indicator = '❌';
          } else if (responseTime > 1000) {
            status = 'degraded';
            indicator = '⚠️';
          } else {
            status = 'operational';
            indicator = '✅';
          }
          
          statuses.push({
            name: api.name,
            status,
            responseTime,
            lastCheck: new Date().toISOString(),
            endpoint: api.endpoint,
            indicator,
          });
        } catch (error) {
          statuses.push({
            name: api.name,
            status: 'down',
            responseTime: Date.now() - startTime,
            lastCheck: new Date().toISOString(),
            endpoint: api.endpoint,
            indicator: '❌',
          });
        }
      }

      // Calculate overall status
      const downCount = statuses.filter(s => s.status === 'down').length;
      const degradedCount = statuses.filter(s => s.status === 'degraded').length;
      
      let overall: 'operational' | 'degraded' | 'down' = 'operational';
      let overallIndicator = '✅ All Systems Operational';
      
      if (downCount > 0) {
        overall = 'down';
        overallIndicator = `❌ ${downCount} API(s) Down`;
      } else if (degradedCount > 0) {
        overall = 'degraded';
        overallIndicator = `⚠️ ${degradedCount} API(s) Degraded`;
      }

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        overall: {
          status: overall,
          indicator: overallIndicator,
          operational: statuses.filter(s => s.status === 'operational').length,
          degraded: degradedCount,
          down: downCount,
          total: statuses.length,
        },
        database: {
          status: dbStatus,
          indicator: dbStatus === 'operational' ? '✅' : '❌',
        },
        apis: statuses,
        documentation: {
          swagger: `http://localhost:8090/api/bridge/docs`,
          postman: 'Available on request',
        },
        quickTest: {
          development: 'Add ?companyId=1 to any endpoint to bypass auth in dev mode',
          example: 'curl http://localhost:8090/api/bridge/v1/tickets?companyId=1',
        },
      });
    } catch (error) {
      logger.error('Failed to get API status', error);
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve API status',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get simple health status for monitoring
   * GET /api/bridge/v1/status/simple
   */
  async getSimpleStatus(req: Request, res: Response): Promise<void> {
    try {
      // Quick database check
      await sequelize.authenticate();
      
      res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get detailed metrics
   * GET /api/bridge/v1/status/metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.companyId || Number(req.query.companyId);
      
      // Gather metrics from various models
      const metrics: any = {
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          latency: 0,
        },
        counts: {},
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      };

      // Test database connection
      const dbStart = Date.now();
      try {
        await sequelize.authenticate();
        metrics.database.connected = true;
        metrics.database.latency = Date.now() - dbStart;
      } catch (error) {
        metrics.database.connected = false;
      }

      // Get counts if database is connected
      if (metrics.database.connected) {
        try {
          const models = [
            'Ticket', 'Message', 'Contact', 'User', 
            'Tag', 'Queue', 'Whatsapp', 'Company', 
            'Setting', 'Schedule'
          ];

          for (const modelName of models) {
            const Model = sequelize.models[modelName];
            if (Model) {
              const whereClause = companyId && modelName !== 'Company' 
                ? { companyId } 
                : {};
              metrics.counts[modelName.toLowerCase()] = await Model.count({ where: whereClause });
            }
          }
        } catch (error) {
          logger.error('Error getting metrics counts', error);
        }
      }

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to get metrics', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to retrieve metrics',
      });
    }
  }
}

export const statusController = new StatusController();