import Bull, { Queue, Job } from 'bull';
import { EventEmitter } from 'events';
import { config } from '../../config';
import { logger } from '../../server';
import WebSocketService from './websocket.service';

export enum EventTypes {
  // Tickets
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_DELETED = 'ticket.deleted',
  TICKET_ASSIGNED = 'ticket.assigned',
  TICKET_TRANSFERRED = 'ticket.transferred',
  TICKET_RESOLVED = 'ticket.resolved',
  TICKET_REOPENED = 'ticket.reopened',
  
  // Messages
  MESSAGE_CREATED = 'message.created',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_DELIVERED = 'message.delivered',
  MESSAGE_READ = 'message.read',
  MESSAGE_DELETED = 'message.deleted',
  
  // Contacts
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',
  CONTACT_DELETED = 'contact.deleted',
  CONTACT_ONLINE = 'contact.online',
  CONTACT_OFFLINE = 'contact.offline',
  CONTACT_TYPING = 'contact.typing',
  
  // Users
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ONLINE = 'user.online',
  USER_OFFLINE = 'user.offline',
  
  // WhatsApp
  WHATSAPP_CONNECTED = 'whatsapp.connected',
  WHATSAPP_DISCONNECTED = 'whatsapp.disconnected',
  WHATSAPP_QR = 'whatsapp.qr',
  WHATSAPP_READY = 'whatsapp.ready',
  WHATSAPP_ERROR = 'whatsapp.error',
  
  // Queues
  QUEUE_CREATED = 'queue.created',
  QUEUE_UPDATED = 'queue.updated',
  QUEUE_DELETED = 'queue.deleted',
  
  // Campaigns
  CAMPAIGN_STARTED = 'campaign.started',
  CAMPAIGN_COMPLETED = 'campaign.completed',
  CAMPAIGN_FAILED = 'campaign.failed',
  
  // System
  SYSTEM_ALERT = 'system.alert',
  SYSTEM_ERROR = 'system.error',
  WEBHOOK_FAILED = 'webhook.failed',
}

export interface EventPayload {
  event: EventTypes | string;
  companyId: number;
  data: any;
  metadata?: {
    userId?: number;
    timestamp?: Date;
    source?: string;
    version?: string;
    correlationId?: string;
    idempotencyKey?: string;
  };
}

export interface EventSubscriber {
  id: string;
  events: string[];
  handler: (payload: EventPayload) => void | Promise<void>;
  filter?: (payload: EventPayload) => boolean;
}

export class EventBusService extends EventEmitter {
  private eventQueue: Queue;
  private subscribers: Map<string, EventSubscriber[]> = new Map();
  private wsService?: WebSocketService;
  private eventHistory: Map<string, EventPayload[]> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly historyTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners

    // Initialize Bull queue for event processing
    this.eventQueue = new Bull('bridge-events', {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupEventProcessor();
    this.cleanupOldHistory();
  }

  /**
   * Set WebSocket service for real-time events
   */
  public setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  /**
   * Setup event queue processor
   */
  private setupEventProcessor(): void {
    this.eventQueue.process(async (job: Job<EventPayload>) => {
      const payload = job.data;
      
      try {
        // Process event
        await this.processEvent(payload);
        
        logger.debug('Event processed', {
          event: payload.event,
          companyId: payload.companyId,
          jobId: job.id,
        });
      } catch (error: any) {
        logger.error('Event processing failed', {
          event: payload.event,
          companyId: payload.companyId,
          error: error.message,
          jobId: job.id,
        });
        throw error;
      }
    });

    // Handle queue events
    this.eventQueue.on('completed', (job) => {
      logger.debug('Event job completed', { jobId: job.id });
    });

    this.eventQueue.on('failed', (job, err) => {
      logger.error('Event job failed', {
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    this.eventQueue.on('stalled', (job) => {
      logger.warn('Event job stalled', { jobId: job.id });
    });
  }

  /**
   * Publish an event
   */
  public async publish(payload: EventPayload): Promise<void> {
    try {
      // Add metadata
      payload.metadata = {
        ...payload.metadata,
        timestamp: payload.metadata?.timestamp || new Date(),
        source: payload.metadata?.source || 'api-bridge',
        version: payload.metadata?.version || '1.0.0',
        correlationId: payload.metadata?.correlationId || this.generateCorrelationId(),
      };

      // Check for idempotency
      if (payload.metadata.idempotencyKey) {
        const isDuplicate = await this.checkIdempotency(payload.metadata.idempotencyKey);
        if (isDuplicate) {
          logger.warn('Duplicate event detected', {
            event: payload.event,
            idempotencyKey: payload.metadata.idempotencyKey,
          });
          return;
        }
      }

      // Add to queue
      const job = await this.eventQueue.add(payload, {
        delay: 0,
        priority: this.getEventPriority(payload.event),
      });

      // Store in history
      this.addToHistory(payload);

      logger.info('Event published', {
        event: payload.event,
        companyId: payload.companyId,
        jobId: job.id,
        correlationId: payload.metadata.correlationId,
      });

      // Emit locally for immediate processing
      this.emit(payload.event, payload);
    } catch (error: any) {
      logger.error('Failed to publish event', {
        event: payload.event,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  public subscribe(
    events: string[],
    handler: (payload: EventPayload) => void | Promise<void>,
    filter?: (payload: EventPayload) => boolean
  ): string {
    const subscriberId = this.generateSubscriberId();
    
    const subscriber: EventSubscriber = {
      id: subscriberId,
      events,
      handler,
      filter,
    };

    // Add subscriber for each event
    events.forEach(event => {
      if (!this.subscribers.has(event)) {
        this.subscribers.set(event, []);
      }
      this.subscribers.get(event)!.push(subscriber);
      
      // Also subscribe to EventEmitter
      this.on(event, (payload: EventPayload) => {
        this.handleSubscriberEvent(subscriber, payload);
      });
    });

    logger.info('Event subscriber registered', {
      subscriberId,
      events,
    });

    return subscriberId;
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscriberId: string): void {
    this.subscribers.forEach((subscribers, event) => {
      const index = subscribers.findIndex(s => s.id === subscriberId);
      if (index !== -1) {
        subscribers.splice(index, 1);
        if (subscribers.length === 0) {
          this.subscribers.delete(event);
        }
      }
    });

    logger.info('Event subscriber unregistered', { subscriberId });
  }

  /**
   * Process an event
   */
  private async processEvent(payload: EventPayload): Promise<void> {
    // Emit to WebSocket clients
    if (this.wsService) {
      this.wsService.emitEvent(payload.event, payload.data, payload.companyId);
    }

    // Process subscribers
    const subscribers = this.subscribers.get(payload.event) || [];
    
    for (const subscriber of subscribers) {
      await this.handleSubscriberEvent(subscriber, payload);
    }
  }

  /**
   * Handle subscriber event
   */
  private async handleSubscriberEvent(
    subscriber: EventSubscriber,
    payload: EventPayload
  ): Promise<void> {
    try {
      // Apply filter if exists
      if (subscriber.filter && !subscriber.filter(payload)) {
        return;
      }

      // Call handler
      await subscriber.handler(payload);
    } catch (error: any) {
      logger.error('Subscriber handler failed', {
        subscriberId: subscriber.id,
        event: payload.event,
        error: error.message,
      });
    }
  }

  /**
   * Batch publish multiple events
   */
  public async publishBatch(payloads: EventPayload[]): Promise<void> {
    const jobs = payloads.map(payload => ({
      data: {
        ...payload,
        metadata: {
          ...payload.metadata,
          timestamp: payload.metadata?.timestamp || new Date(),
          source: payload.metadata?.source || 'api-bridge',
          version: payload.metadata?.version || '1.0.0',
          correlationId: payload.metadata?.correlationId || this.generateCorrelationId(),
        },
      },
      opts: {
        delay: 0,
        priority: this.getEventPriority(payload.event),
      },
    }));

    await this.eventQueue.addBulk(jobs);

    logger.info('Batch events published', {
      count: payloads.length,
      events: payloads.map(p => p.event),
    });
  }

  /**
   * Get event priority
   */
  private getEventPriority(event: string): number {
    // High priority events
    if (event.includes('message') || event.includes('whatsapp')) {
      return 1;
    }
    // Medium priority events
    if (event.includes('ticket') || event.includes('contact')) {
      return 5;
    }
    // Low priority events
    return 10;
  }

  /**
   * Check idempotency
   */
  private async checkIdempotency(key: string): Promise<boolean> {
    // In production, check Redis or database
    // For now, simple in-memory check
    const recent = Array.from(this.eventHistory.values())
      .flat()
      .find(e => e.metadata?.idempotencyKey === key);
    
    return !!recent;
  }

  /**
   * Add event to history
   */
  private addToHistory(payload: EventPayload): void {
    const key = `${payload.event}:${payload.companyId}`;
    
    if (!this.eventHistory.has(key)) {
      this.eventHistory.set(key, []);
    }
    
    const history = this.eventHistory.get(key)!;
    history.push(payload);
    
    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Get event history
   */
  public getEventHistory(
    event?: string,
    companyId?: number,
    limit: number = 100
  ): EventPayload[] {
    let events: EventPayload[] = [];

    if (event && companyId) {
      const key = `${event}:${companyId}`;
      events = this.eventHistory.get(key) || [];
    } else if (event) {
      // Get all events of this type
      this.eventHistory.forEach((history, key) => {
        if (key.startsWith(event)) {
          events.push(...history);
        }
      });
    } else if (companyId) {
      // Get all events for this company
      this.eventHistory.forEach((history, key) => {
        if (key.endsWith(`:${companyId}`)) {
          events.push(...history);
        }
      });
    } else {
      // Get all events
      this.eventHistory.forEach(history => {
        events.push(...history);
      });
    }

    // Sort by timestamp and limit
    return events
      .sort((a, b) => {
        const timeA = a.metadata?.timestamp?.getTime() || 0;
        const timeB = b.metadata?.timestamp?.getTime() || 0;
        return timeB - timeA;
      })
      .slice(0, limit);
  }

  /**
   * Clean up old history
   */
  private cleanupOldHistory(): void {
    setInterval(() => {
      const now = Date.now();
      
      this.eventHistory.forEach((history, key) => {
        const filtered = history.filter(event => {
          const timestamp = event.metadata?.timestamp?.getTime() || 0;
          return now - timestamp < this.historyTTL;
        });
        
        if (filtered.length === 0) {
          this.eventHistory.delete(key);
        } else {
          this.eventHistory.set(key, filtered);
        }
      });
      
      logger.debug('Event history cleanup completed', {
        remainingKeys: this.eventHistory.size,
      });
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Generate subscriber ID
   */
  private generateSubscriberId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get queue statistics
   */
  public async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.eventQueue.getWaitingCount(),
      this.eventQueue.getActiveCount(),
      this.eventQueue.getCompletedCount(),
      this.eventQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      subscribers: this.subscribers.size,
      historySize: this.eventHistory.size,
    };
  }

  /**
   * Clear all events from queue
   */
  public async clearQueue(): Promise<void> {
    await this.eventQueue.empty();
    logger.info('Event queue cleared');
  }

  /**
   * Pause event processing
   */
  public async pause(): Promise<void> {
    await this.eventQueue.pause();
    logger.info('Event processing paused');
  }

  /**
   * Resume event processing
   */
  public async resume(): Promise<void> {
    await this.eventQueue.resume();
    logger.info('Event processing resumed');
  }

  /**
   * Close event bus
   */
  public async close(): Promise<void> {
    await this.eventQueue.close();
    this.removeAllListeners();
    this.subscribers.clear();
    this.eventHistory.clear();
    logger.info('Event bus closed');
  }
}

// Export singleton instance
export const eventBus = new EventBusService();

// Export for testing
export default EventBusService;