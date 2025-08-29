import { EventEmitter } from "events";
import { ConnectionStatus } from "../models/ChannelConnection";
import { 
  ChannelProvider, 
  ConnectionInfo, 
  MessagePayload, 
  MessageResult, 
  WebhookPayload,
  ChannelCapabilities
} from "./ChannelManagerInterface";
import { logger } from "../../utils/logger";

export abstract class BaseChannelProvider extends EventEmitter implements ChannelProvider {
  protected connection: ConnectionInfo;
  protected status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  protected retryCount: number = 0;
  protected maxRetries: number = 3;
  protected retryDelay: number = 5000; // 5 seconds

  constructor() {
    super();
    this.setMaxListeners(50); // Increase limit for multiple connections
  }

  /**
   * Initialize the provider with connection info
   */
  async initialize(connection: ConnectionInfo): Promise<void> {
    this.connection = connection;
    this.maxRetries = connection.configuration.retryAttempts || 3;
    
    logger.info(`Initializing ${connection.type} provider`, {
      connectionId: connection.id,
      companyId: connection.companyId
    });

    this.emit("initialized", { connection });
  }

  /**
   * Abstract methods that must be implemented by specific providers
   */
  abstract connect(): Promise<ConnectionStatus>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(payload: MessagePayload): Promise<MessageResult>;
  abstract processWebhook(payload: WebhookPayload): Promise<void>;
  abstract getCapabilities(): ChannelCapabilities;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Update connection status and emit event
   */
  protected updateStatus(newStatus: ConnectionStatus, error?: string): void {
    const previousStatus = this.status;
    this.status = newStatus;

    logger.info(`Channel status changed`, {
      connectionId: this.connection?.id,
      companyId: this.connection?.companyId,
      type: this.connection?.type,
      from: previousStatus,
      to: newStatus,
      error
    });

    this.emit("statusChange", {
      connectionId: this.connection.id,
      previousStatus,
      newStatus,
      error,
      timestamp: new Date()
    });
  }

  /**
   * Basic message validation
   */
  validateMessage(payload: MessagePayload): boolean {
    if (!payload.to || !payload.type) {
      return false;
    }

    if (payload.type === "text" && (!payload.content || !payload.content.text)) {
      return false;
    }

    if (payload.type === "template" && (!payload.content || !payload.content.name)) {
      return false;
    }

    return true;
  }

  /**
   * Handle connection with retry logic
   */
  async connectWithRetry(): Promise<ConnectionStatus> {
    this.retryCount = 0;
    
    while (this.retryCount < this.maxRetries) {
      try {
        this.updateStatus(ConnectionStatus.CONNECTING);
        const status = await this.connect();
        this.retryCount = 0; // Reset on success
        return status;
      } catch (error) {
        this.retryCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error(`Connection attempt ${this.retryCount} failed`, {
          connectionId: this.connection.id,
          error: errorMessage,
          retryCount: this.retryCount,
          maxRetries: this.maxRetries
        });

        if (this.retryCount >= this.maxRetries) {
          this.updateStatus(ConnectionStatus.ERROR, errorMessage);
          throw new Error(`Failed to connect after ${this.maxRetries} attempts: ${errorMessage}`);
        }

        // Wait before retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
        await this.sleep(delay);
      }
    }

    throw new Error("Maximum retry attempts reached");
  }

  /**
   * Handle message sending with retry logic
   */
  async sendMessageWithRetry(payload: MessagePayload, maxRetries: number = 3): Promise<MessageResult> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        if (!this.validateMessage(payload)) {
          throw new Error("Invalid message payload");
        }

        const result = await this.sendMessage(payload);
        
        if (result.status === "sent") {
          this.emit("messageSent", { payload, result });
          return result;
        } else {
          throw new Error(result.error || "Message sending failed");
        }
      } catch (error) {
        attempts++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        logger.error(`Message send attempt ${attempts} failed`, {
          connectionId: this.connection.id,
          error: errorMessage,
          payload: { ...payload, content: "[REDACTED]" }
        });

        if (attempts >= maxRetries) {
          this.emit("messageFailed", { payload, error: errorMessage });
          return {
            id: "",
            status: "failed",
            error: errorMessage
          };
        }

        await this.sleep(1000 * attempts); // Progressive delay
      }
    }

    throw new Error("Message sending failed after all retries");
  }

  /**
   * Handle reconnection logic
   */
  async reconnect(): Promise<ConnectionStatus> {
    logger.info(`Attempting to reconnect`, {
      connectionId: this.connection.id,
      currentStatus: this.status
    });

    try {
      await this.disconnect();
      await this.sleep(2000); // Wait 2 seconds before reconnecting
      return await this.connectWithRetry();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Reconnection failed`, {
        connectionId: this.connection.id,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Handle graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info(`Shutting down channel provider`, {
      connectionId: this.connection?.id,
      type: this.connection?.type
    });

    try {
      await this.disconnect();
    } catch (error) {
      logger.error(`Error during shutdown`, {
        connectionId: this.connection?.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    this.removeAllListeners();
  }

  /**
   * Utility method to sleep
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log activity for debugging and monitoring
   */
  protected logActivity(action: string, data?: any): void {
    logger.debug(`Channel activity`, {
      connectionId: this.connection?.id,
      companyId: this.connection?.companyId,
      type: this.connection?.type,
      action,
      data
    });
  }
}

export default BaseChannelProvider;