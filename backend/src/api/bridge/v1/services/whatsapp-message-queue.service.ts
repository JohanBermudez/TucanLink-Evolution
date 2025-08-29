import Bull from 'bull';
import { logger } from '../utils/logger';
import { getChannelManager } from '../../../../channels/bootstrap';
import { MessagePayload, MessageResult } from '../../../../channels/core/ChannelManagerInterface';

export interface QueuedMessage extends MessagePayload {
  connectionId: number;
  priority?: number;
  delay?: number;
  attempts?: number;
}

export interface QueueConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: Bull.JobOptions;
  concurrency?: number;
}

/**
 * WhatsApp Message Queue Service
 * Handles rate limiting and message queuing for WhatsApp Cloud API
 */
export class WhatsAppMessageQueueService {
  private queue: Bull.Queue<QueuedMessage>;
  private channelManager = getChannelManager();

  // Rate limiting configuration
  private readonly RATE_LIMITS = {
    messagesPerSecond: 80,
    messagesPerMinute: 4800,
    messagesPerHour: 288000, // 80 * 3600
    burstSize: 100
  };

  // Queue configuration
  private readonly DEFAULT_CONFIG: QueueConfig = {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0')
    },
    concurrency: this.RATE_LIMITS.messagesPerSecond,
    defaultJobOptions: {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50,     // Keep last 50 failed jobs
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      delay: 0
    }
  };

  constructor(config?: Partial<QueueConfig>) {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Create Bull queue
    this.queue = new Bull('whatsapp-messages', {
      redis: finalConfig.redis,
      defaultJobOptions: finalConfig.defaultJobOptions
    });

    // Set concurrency (messages per second)
    this.queue.process(
      'send-message',
      finalConfig.concurrency || this.RATE_LIMITS.messagesPerSecond,
      this.processMessage.bind(this)
    );

    // Setup event listeners
    this.setupEventListeners();

    logger.info('WhatsApp Message Queue Service initialized', {
      concurrency: finalConfig.concurrency,
      redis: `${finalConfig.redis?.host}:${finalConfig.redis?.port}`
    });
  }

  /**
   * Add message to queue with rate limiting
   */
  async queueMessage(
    message: QueuedMessage,
    options?: Bull.JobOptions
  ): Promise<Bull.Job<QueuedMessage>> {
    try {
      // Calculate priority based on message type and urgency
      const priority = this.calculatePriority(message);
      
      // Check if we need to apply delay for rate limiting
      const delay = await this.calculateDelay(message.connectionId);

      const jobOptions: Bull.JobOptions = {
        ...this.DEFAULT_CONFIG.defaultJobOptions,
        ...options,
        priority,
        delay: delay > 0 ? delay : (options?.delay || 0)
      };

      const job = await this.queue.add('send-message', message, jobOptions);

      logger.debug('Message queued', {
        jobId: job.id,
        connectionId: message.connectionId,
        messageType: message.type,
        priority,
        delay
      });

      return job;

    } catch (error) {
      logger.error('Failed to queue message', {
        error: error instanceof Error ? error.message : String(error),
        connectionId: message.connectionId,
        messageType: message.type
      });
      throw error;
    }
  }

  /**
   * Process queued message
   */
  private async processMessage(job: Bull.Job<QueuedMessage>): Promise<MessageResult> {
    const { connectionId, ...messagePayload } = job.data;

    try {
      logger.debug('Processing queued message', {
        jobId: job.id,
        connectionId,
        messageType: messagePayload.type,
        attempt: job.attemptsMade + 1
      });

      // Update job progress
      await job.progress(10);

      // Send message through channel manager
      const result = await this.channelManager.sendMessage(connectionId, messagePayload);

      // Update job progress
      await job.progress(100);

      if (result.status === 'failed') {
        throw new Error(result.error || 'Message sending failed');
      }

      logger.info('Message sent successfully', {
        jobId: job.id,
        connectionId,
        messageId: result.externalId,
        duration: Date.now() - job.timestamp
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error('Failed to process message', {
        jobId: job.id,
        connectionId,
        error: errorMessage,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts
      });

      // If this is the last attempt, emit failure event
      if (job.attemptsMade >= (job.opts.attempts || 1) - 1) {
        this.channelManager.emit('messageFailed', {
          connectionId,
          jobId: job.id,
          error: errorMessage,
          messagePayload
        });
      }

      throw error;
    }
  }

  /**
   * Calculate message priority (higher number = higher priority)
   */
  private calculatePriority(message: QueuedMessage): number {
    // Custom priority if specified
    if (message.priority !== undefined) {
      return message.priority;
    }

    // Priority based on message type
    switch (message.type) {
      case 'template':
        return 10; // Templates have high priority (often notifications)
      case 'text':
        return 5;  // Standard priority for text messages
      case 'media':
      case 'image':
      case 'video':
      case 'audio':
      case 'document':
        return 3;  // Lower priority for media (larger payloads)
      case 'location':
      case 'contacts':
        return 7;  // Higher priority for location/contacts
      default:
        return 1;  // Lowest priority for unknown types
    }
  }

  /**
   * Calculate delay needed for rate limiting
   */
  private async calculateDelay(connectionId: number): Promise<number> {
    try {
      // Get current queue statistics
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      
      // Calculate current load
      const currentLoad = waiting.length + active.length;
      
      // If we're approaching rate limits, add delay
      if (currentLoad > this.RATE_LIMITS.burstSize) {
        // Calculate delay to spread messages over time
        const delayPerMessage = 1000 / this.RATE_LIMITS.messagesPerSecond;
        const extraDelay = (currentLoad - this.RATE_LIMITS.burstSize) * delayPerMessage;
        
        return Math.min(extraDelay, 30000); // Max 30 second delay
      }

      return 0; // No delay needed

    } catch (error) {
      logger.warn('Error calculating delay, using default', {
        error: error instanceof Error ? error.message : String(error),
        connectionId
      });
      return 0;
    }
  }

  /**
   * Setup event listeners for queue monitoring
   */
  private setupEventListeners(): void {
    this.queue.on('completed', (job: Bull.Job<QueuedMessage>, result: MessageResult) => {
      logger.debug('Job completed', {
        jobId: job.id,
        connectionId: job.data.connectionId,
        messageId: result.externalId,
        processingTime: Date.now() - job.processedOn!
      });

      // Emit success event
      this.channelManager.emit('messageSent', {
        connectionId: job.data.connectionId,
        jobId: job.id,
        messageId: result.externalId,
        result
      });
    });

    this.queue.on('failed', (job: Bull.Job<QueuedMessage>, error: Error) => {
      logger.error('Job failed', {
        jobId: job.id,
        connectionId: job.data.connectionId,
        error: error.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      });
    });

    this.queue.on('stalled', (job: Bull.Job<QueuedMessage>) => {
      logger.warn('Job stalled', {
        jobId: job.id,
        connectionId: job.data.connectionId,
        stalledCount: job.opts.attempts
      });
    });

    this.queue.on('progress', (job: Bull.Job<QueuedMessage>, progress: number) => {
      if (progress % 50 === 0) { // Log every 50% progress
        logger.debug('Job progress', {
          jobId: job.id,
          connectionId: job.data.connectionId,
          progress
        });
      }
    });
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed(),
      this.queue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      paused: await this.queue.isPaused()
    };
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    await this.queue.pause();
    logger.info('WhatsApp message queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.queue.resume();
    logger.info('WhatsApp message queue resumed');
  }

  /**
   * Clean old jobs
   */
  async cleanQueue(
    grace: number = 24 * 60 * 60 * 1000, // 24 hours
    status: 'completed' | 'failed' | 'active' | 'waiting' = 'completed'
  ): Promise<number> {
    const cleaned = await this.queue.clean(grace, status);
    logger.info('Queue cleaned', { status, cleaned: cleaned.length });
    return cleaned.length;
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string | number): Promise<Bull.Job<QueuedMessage> | null> {
    return this.queue.getJob(jobId);
  }

  /**
   * Remove job by ID
   */
  async removeJob(jobId: string | number): Promise<void> {
    const job = await this.getJob(jobId);
    if (job) {
      await job.remove();
      logger.debug('Job removed', { jobId });
    }
  }

  /**
   * Shutdown the queue gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down WhatsApp Message Queue Service...');
    
    await this.queue.close();
    
    logger.info('WhatsApp Message Queue Service shut down complete');
  }

  /**
   * Get the Bull queue instance (for advanced usage)
   */
  getQueue(): Bull.Queue<QueuedMessage> {
    return this.queue;
  }
}

// Singleton instance
let messageQueueInstance: WhatsAppMessageQueueService;

/**
 * Get singleton instance of message queue service
 */
export function getMessageQueueService(): WhatsAppMessageQueueService {
  if (!messageQueueInstance) {
    messageQueueInstance = new WhatsAppMessageQueueService();
  }
  return messageQueueInstance;
}

/**
 * Initialize message queue service with custom config
 */
export function initializeMessageQueueService(config?: Partial<QueueConfig>): WhatsAppMessageQueueService {
  if (messageQueueInstance) {
    logger.warn('Message queue service already initialized, returning existing instance');
    return messageQueueInstance;
  }
  
  messageQueueInstance = new WhatsAppMessageQueueService(config);
  return messageQueueInstance;
}

/**
 * Shutdown message queue service
 */
export async function shutdownMessageQueueService(): Promise<void> {
  if (messageQueueInstance) {
    await messageQueueInstance.shutdown();
    messageQueueInstance = null as any;
  }
}

export default WhatsAppMessageQueueService;