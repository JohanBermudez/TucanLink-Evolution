import Bull, { Queue, Job } from 'bull';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { config } from '../../config';
import { logger } from '../../server';
import { eventBus, EventPayload } from './eventBus.service';

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  headers?: Record<string, string>;
  companyId: number;
  createdAt: Date;
  lastTriggeredAt?: Date;
  lastStatus?: number;
  failureCount?: number;
  metadata?: Record<string, any>;
}

export interface WebhookDelivery {
  webhookId: string;
  url: string;
  event: string;
  payload: any;
  headers: Record<string, string>;
  attempt: number;
  timestamp: Date;
}

export interface WebhookResponse {
  success: boolean;
  statusCode?: number;
  response?: any;
  error?: string;
  duration?: number;
  attempt?: number;
}

export class WebhookService {
  private webhookQueue: Queue;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveryHistory: Map<string, WebhookResponse[]> = new Map();
  private circuitBreaker: Map<string, {
    failures: number;
    lastFailure: Date;
    isOpen: boolean;
  }> = new Map();

  constructor() {
    // Initialize Bull queue for webhook delivery
    this.webhookQueue = new Bull('webhook-delivery', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: false,
        attempts: config.webhook.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.webhook.retryDelay,
        },
      },
    });

    this.setupQueueProcessor();
    this.subscribeToEvents();
  }

  /**
   * Setup webhook queue processor
   */
  private setupQueueProcessor(): void {
    this.webhookQueue.process(async (job: Job<WebhookDelivery>) => {
      const delivery = job.data;
      
      try {
        const response = await this.deliverWebhook(delivery);
        
        if (!response.success) {
          throw new Error(response.error || 'Webhook delivery failed');
        }

        logger.info('Webhook delivered successfully', {
          webhookId: delivery.webhookId,
          event: delivery.event,
          statusCode: response.statusCode,
          attempt: delivery.attempt,
        });

        return response;
      } catch (error: any) {
        logger.error('Webhook delivery failed', {
          webhookId: delivery.webhookId,
          event: delivery.event,
          error: error.message,
          attempt: delivery.attempt,
        });

        // Update failure count
        this.updateFailureCount(delivery.webhookId);

        throw error;
      }
    });

    // Handle queue events
    this.webhookQueue.on('failed', (job, err) => {
      logger.error('Webhook job failed', {
        jobId: job.id,
        webhookId: job.data.webhookId,
        error: err.message,
        attempts: job.attemptsMade,
      });

      // Check if max retries reached
      if (job.attemptsMade >= config.webhook.maxRetries) {
        this.handleMaxRetriesReached(job.data);
      }
    });

    this.webhookQueue.on('completed', (job) => {
      logger.debug('Webhook job completed', {
        jobId: job.id,
        webhookId: job.data.webhookId,
      });

      // Reset failure count on success
      this.resetFailureCount(job.data.webhookId);
    });
  }

  /**
   * Register a webhook
   */
  public async registerWebhook(webhookConfig: Omit<WebhookConfig, 'id' | 'secret' | 'createdAt'>): Promise<WebhookConfig> {
    const webhook: WebhookConfig = {
      ...webhookConfig,
      id: this.generateWebhookId(),
      secret: this.generateWebhookSecret(),
      createdAt: new Date(),
      failureCount: 0,
    };

    // Validate URL
    try {
      new URL(webhook.url);
    } catch (error) {
      throw new Error('Invalid webhook URL');
    }

    // Store webhook
    this.webhooks.set(webhook.id, webhook);

    logger.info('Webhook registered', {
      webhookId: webhook.id,
      url: webhook.url,
      events: webhook.events,
      companyId: webhook.companyId,
    });

    return webhook;
  }

  /**
   * Update webhook configuration
   */
  public async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | null> {
    const webhook = this.webhooks.get(webhookId);
    
    if (!webhook) {
      return null;
    }

    const updatedWebhook = {
      ...webhook,
      ...updates,
      id: webhook.id, // Prevent ID change
      secret: webhook.secret, // Prevent secret change
      createdAt: webhook.createdAt, // Prevent creation date change
    };

    this.webhooks.set(webhookId, updatedWebhook);

    logger.info('Webhook updated', {
      webhookId,
      updates: Object.keys(updates),
    });

    return updatedWebhook;
  }

  /**
   * Delete webhook
   */
  public async deleteWebhook(webhookId: string): Promise<boolean> {
    const deleted = this.webhooks.delete(webhookId);
    
    if (deleted) {
      // Clear delivery history
      this.deliveryHistory.delete(webhookId);
      this.circuitBreaker.delete(webhookId);
      
      logger.info('Webhook deleted', { webhookId });
    }

    return deleted;
  }

  /**
   * Get webhook by ID
   */
  public getWebhook(webhookId: string): WebhookConfig | null {
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List webhooks for a company
   */
  public listWebhooks(companyId: number): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(
      webhook => webhook.companyId === companyId
    );
  }

  /**
   * Test webhook
   */
  public async testWebhook(webhookId: string, testPayload?: any): Promise<WebhookResponse> {
    const webhook = this.webhooks.get(webhookId);
    
    if (!webhook) {
      return {
        success: false,
        error: 'Webhook not found',
      };
    }

    const delivery: WebhookDelivery = {
      webhookId: webhook.id,
      url: webhook.url,
      event: 'test',
      payload: testPayload || {
        event: 'test',
        message: 'This is a test webhook delivery',
        timestamp: new Date().toISOString(),
      },
      headers: this.buildHeaders(webhook, 'test', testPayload),
      attempt: 1,
      timestamp: new Date(),
    };

    const response = await this.deliverWebhook(delivery);

    logger.info('Webhook test completed', {
      webhookId,
      success: response.success,
      statusCode: response.statusCode,
    });

    return response;
  }

  /**
   * Subscribe to events for webhook delivery
   */
  private subscribeToEvents(): void {
    // Subscribe to all events
    eventBus.subscribe(['*'], async (payload: EventPayload) => {
      await this.handleEvent(payload);
    });
  }

  /**
   * Handle incoming event
   */
  private async handleEvent(payload: EventPayload): Promise<void> {
    // Find webhooks interested in this event
    const interestedWebhooks = Array.from(this.webhooks.values()).filter(webhook => {
      return webhook.active &&
             webhook.companyId === payload.companyId &&
             (webhook.events.includes('*') || webhook.events.includes(payload.event));
    });

    // Queue delivery for each webhook
    for (const webhook of interestedWebhooks) {
      // Check circuit breaker
      if (this.isCircuitOpen(webhook.id)) {
        logger.warn('Circuit breaker open for webhook', {
          webhookId: webhook.id,
          event: payload.event,
        });
        continue;
      }

      const delivery: WebhookDelivery = {
        webhookId: webhook.id,
        url: webhook.url,
        event: payload.event,
        payload: {
          event: payload.event,
          data: payload.data,
          metadata: payload.metadata,
        },
        headers: this.buildHeaders(webhook, payload.event, payload.data),
        attempt: 1,
        timestamp: new Date(),
      };

      await this.webhookQueue.add(delivery, {
        delay: 0,
        priority: this.getDeliveryPriority(payload.event),
      });

      logger.debug('Webhook delivery queued', {
        webhookId: webhook.id,
        event: payload.event,
      });
    }
  }

  /**
   * Deliver webhook
   */
  private async deliverWebhook(delivery: WebhookDelivery): Promise<WebhookResponse> {
    const startTime = Date.now();

    try {
      const axiosConfig: AxiosRequestConfig = {
        method: 'POST',
        url: delivery.url,
        data: delivery.payload,
        headers: delivery.headers,
        timeout: config.webhook.timeout,
        validateStatus: () => true, // Don't throw on any status
        maxRedirects: 5,
      };

      const response = await axios(axiosConfig);
      const duration = Date.now() - startTime;

      const webhookResponse: WebhookResponse = {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        response: response.data,
        duration,
        attempt: delivery.attempt,
      };

      // Store in history
      this.addToDeliveryHistory(delivery.webhookId, webhookResponse);

      // Update webhook last triggered
      const webhook = this.webhooks.get(delivery.webhookId);
      if (webhook) {
        webhook.lastTriggeredAt = new Date();
        webhook.lastStatus = response.status;
      }

      return webhookResponse;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      let errorMessage = 'Unknown error';
      let statusCode: number | undefined;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        errorMessage = axiosError.message;
        statusCode = axiosError.response?.status;
      } else {
        errorMessage = error.message;
      }

      const webhookResponse: WebhookResponse = {
        success: false,
        statusCode,
        error: errorMessage,
        duration,
        attempt: delivery.attempt,
      };

      // Store in history
      this.addToDeliveryHistory(delivery.webhookId, webhookResponse);

      return webhookResponse;
    }
  }

  /**
   * Build headers for webhook delivery
   */
  private buildHeaders(webhook: WebhookConfig, event: string, payload: any): Record<string, string> {
    const timestamp = Date.now().toString();
    const signature = this.generateSignature(webhook.secret, timestamp, payload);

    return {
      'Content-Type': 'application/json',
      'User-Agent': 'TucanLink-Bridge/1.0',
      'X-Webhook-Event': event,
      'X-Webhook-Signature': signature,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-ID': webhook.id,
      ...webhook.headers, // Custom headers
    };
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(secret: string, timestamp: string, payload: any): string {
    const message = `${timestamp}.${JSON.stringify(payload)}`;
    return crypto
      .createHmac('sha256', secret)
      .update(message, 'utf8')
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  public verifySignature(secret: string, signature: string, timestamp: string, payload: any): boolean {
    const expectedSignature = this.generateSignature(secret, timestamp, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Get delivery priority
   */
  private getDeliveryPriority(event: string): number {
    // High priority for critical events
    if (event.includes('error') || event.includes('failed')) {
      return 1;
    }
    // Medium priority for messages
    if (event.includes('message')) {
      return 5;
    }
    // Default priority
    return 10;
  }

  /**
   * Circuit breaker management
   */
  private isCircuitOpen(webhookId: string): boolean {
    const breaker = this.circuitBreaker.get(webhookId);
    
    if (!breaker || !breaker.isOpen) {
      return false;
    }

    // Check if enough time has passed to attempt recovery
    const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime();
    const recoveryTime = 60 * 1000; // 1 minute

    if (timeSinceLastFailure > recoveryTime) {
      breaker.isOpen = false;
      breaker.failures = 0;
      return false;
    }

    return true;
  }

  private updateFailureCount(webhookId: string): void {
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      webhook.failureCount = (webhook.failureCount || 0) + 1;
    }

    // Update circuit breaker
    const breaker = this.circuitBreaker.get(webhookId) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false,
    };

    breaker.failures++;
    breaker.lastFailure = new Date();

    // Open circuit if too many failures
    if (breaker.failures >= 5) {
      breaker.isOpen = true;
      logger.warn('Circuit breaker opened for webhook', {
        webhookId,
        failures: breaker.failures,
      });
    }

    this.circuitBreaker.set(webhookId, breaker);
  }

  private resetFailureCount(webhookId: string): void {
    const webhook = this.webhooks.get(webhookId);
    if (webhook) {
      webhook.failureCount = 0;
    }

    // Reset circuit breaker
    this.circuitBreaker.delete(webhookId);
  }

  private handleMaxRetriesReached(delivery: WebhookDelivery): void {
    logger.error('Webhook max retries reached', {
      webhookId: delivery.webhookId,
      url: delivery.url,
      event: delivery.event,
    });

    // Emit event for monitoring
    eventBus.publish({
      event: 'webhook.failed',
      companyId: this.webhooks.get(delivery.webhookId)?.companyId || 0,
      data: {
        webhookId: delivery.webhookId,
        event: delivery.event,
        url: delivery.url,
        attempts: config.webhook.maxRetries,
      },
    });

    // Consider deactivating webhook after too many failures
    const webhook = this.webhooks.get(delivery.webhookId);
    if (webhook && webhook.failureCount && webhook.failureCount > 10) {
      webhook.active = false;
      logger.warn('Webhook deactivated due to excessive failures', {
        webhookId: delivery.webhookId,
      });
    }
  }

  /**
   * Delivery history management
   */
  private addToDeliveryHistory(webhookId: string, response: WebhookResponse): void {
    if (!this.deliveryHistory.has(webhookId)) {
      this.deliveryHistory.set(webhookId, []);
    }

    const history = this.deliveryHistory.get(webhookId)!;
    history.unshift(response);

    // Keep only last 100 deliveries
    if (history.length > 100) {
      history.pop();
    }
  }

  public getDeliveryHistory(webhookId: string, limit: number = 10): WebhookResponse[] {
    const history = this.deliveryHistory.get(webhookId) || [];
    return history.slice(0, limit);
  }

  /**
   * Get webhook statistics
   */
  public getWebhookStats(webhookId: string) {
    const webhook = this.webhooks.get(webhookId);
    const history = this.deliveryHistory.get(webhookId) || [];
    const breaker = this.circuitBreaker.get(webhookId);

    if (!webhook) {
      return null;
    }

    const successCount = history.filter(h => h.success).length;
    const totalCount = history.length;

    return {
      webhookId,
      url: webhook.url,
      active: webhook.active,
      circuitBreakerOpen: breaker?.isOpen || false,
      failureCount: webhook.failureCount || 0,
      lastTriggeredAt: webhook.lastTriggeredAt,
      lastStatus: webhook.lastStatus,
      deliveryStats: {
        total: totalCount,
        success: successCount,
        failure: totalCount - successCount,
        successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0,
        averageResponseTime: history.reduce((acc, h) => acc + (h.duration || 0), 0) / (totalCount || 1),
      },
    };
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.webhookQueue.getWaitingCount(),
      this.webhookQueue.getActiveCount(),
      this.webhookQueue.getCompletedCount(),
      this.webhookQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      webhooksCount: this.webhooks.size,
      circuitBreakersOpen: Array.from(this.circuitBreaker.values()).filter(b => b.isOpen).length,
    };
  }

  /**
   * Generate unique IDs
   */
  private generateWebhookId(): string {
    return `whk_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Clean up resources
   */
  public async close(): Promise<void> {
    await this.webhookQueue.close();
    this.webhooks.clear();
    this.deliveryHistory.clear();
    this.circuitBreaker.clear();
    logger.info('Webhook service closed');
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

// Export for testing
export default WebhookService;