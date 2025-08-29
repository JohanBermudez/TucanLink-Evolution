import axios, { AxiosInstance } from "axios";
import WhatsAppBaseProvider, { WhatsAppMessage, WhatsAppCapabilities } from "../base/WhatsAppBaseProvider";
import { ConnectionStatus } from "../../models/ChannelConnection";
import { MessageResult } from "../../core/ChannelManagerInterface";

export interface WhatsAppCloudConfig {
  accessToken: string;
  businessAccountId: string;
  phoneNumberId: string;
  webhookVerifyToken: string;
  appSecret?: string;
  apiVersion?: string;
}

export class WhatsAppCloudProvider extends WhatsAppBaseProvider {
  private apiClient: AxiosInstance;
  private config: WhatsAppCloudConfig;
  private readonly baseUrl = "https://graph.facebook.com";
  private rateLimitTracker = {
    requests: 0,
    resetTime: Date.now() + 60000, // 1 minute
    maxRequests: 80 // Per second, but we track per minute
  };

  constructor() {
    super();
    this.setupApiClient();
  }

  /**
   * Initialize WhatsApp Cloud API provider
   */
  async initialize(connection: any): Promise<void> {
    await super.initialize(connection);
    
    this.config = connection.configuration as WhatsAppCloudConfig;
    this.phoneNumberId = this.config.phoneNumberId;
    this.businessAccountId = this.config.businessAccountId;
    this.accessToken = this.config.accessToken;
    
    this.setupApiClient();
    this.logActivity("provider_initialized", { phoneNumberId: this.phoneNumberId });
  }

  /**
   * Setup axios client with authentication
   */
  private setupApiClient(): void {
    const apiVersion = this.config?.apiVersion || "v23.0";
    
    this.apiClient = axios.create({
      baseURL: `${this.baseUrl}/${apiVersion}`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.accessToken || ""}`
      }
    });

    // Add request interceptor for rate limiting
    this.apiClient.interceptors.request.use(async (config) => {
      await this.checkRateLimit();
      return config;
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logActivity("api_error", {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    );
  }

  /**
   * Connect to WhatsApp Cloud API
   */
  async connect(): Promise<ConnectionStatus> {
    try {
      this.logActivity("connecting");
      
      // Test connection by getting business account info
      const response = await this.apiClient.get(`/${this.businessAccountId}`, {
        params: { fields: "id,name,message_template_namespace" }
      });

      if (response.status === 200 && response.data.id) {
        this.updateStatus(ConnectionStatus.CONNECTED);
        this.logActivity("connected", { businessAccount: response.data });
        return ConnectionStatus.CONNECTED;
      } else {
        throw new Error("Invalid response from WhatsApp API");
      }
    } catch (error) {
      const errorMessage = this.handleWhatsAppError(error);
      this.updateStatus(ConnectionStatus.ERROR, errorMessage);
      throw new Error(`WhatsApp Cloud connection failed: ${errorMessage}`);
    }
  }

  /**
   * Disconnect from WhatsApp Cloud API
   */
  async disconnect(): Promise<void> {
    this.updateStatus(ConnectionStatus.DISCONNECTED);
    this.logActivity("disconnected");
  }

  /**
   * Get enhanced capabilities for Cloud API
   */
  getCapabilities(): WhatsAppCapabilities {
    return {
      ...super.getCapabilities(),
      reactions: true,
      groups: false, // Not supported in Cloud API
      broadcast: true,
    };
  }

  /**
   * Send WhatsApp message via Cloud API
   */
  async sendWhatsAppMessage(message: WhatsAppMessage): Promise<MessageResult> {
    try {
      const payload = this.buildMessagePayload(message);
      
      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        payload
      );

      if (response.data.messages && response.data.messages[0]) {
        const messageData = response.data.messages[0];
        return {
          id: messageData.id,
          externalId: messageData.id,
          status: "sent",
          metadata: {
            waId: response.data.contacts?.[0]?.wa_id,
            input: response.data.contacts?.[0]?.input
          }
        };
      } else {
        throw new Error("Invalid response format from WhatsApp API");
      }
    } catch (error) {
      const errorMessage = this.handleWhatsAppError(error);
      this.logActivity("send_message_error", { error: errorMessage });
      
      return {
        id: "",
        status: "failed",
        error: errorMessage
      };
    }
  }

  /**
   * Build message payload for WhatsApp Cloud API
   */
  private buildMessagePayload(message: WhatsAppMessage): any {
    const basePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: message.to
    };

    // Add context for replies
    if (message.context?.message_id) {
      basePayload["context"] = {
        message_id: message.context.message_id
      };
    }

    switch (message.type) {
      case "text":
        return {
          ...basePayload,
          type: "text",
          text: {
            preview_url: true,
            body: message.content.text
          }
        };

      case "template":
        return {
          ...basePayload,
          type: "template",
          template: {
            name: message.content.template!.name,
            language: {
              code: message.content.template!.language
            },
            components: message.content.template!.components || []
          }
        };

      case "interactive":
        return {
          ...basePayload,
          type: "interactive",
          interactive: message.content.interactive
        };

      case "location":
        return {
          ...basePayload,
          type: "location",
          location: message.content.location
        };

      case "image":
        return {
          ...basePayload,
          type: "image",
          image: {
            ...(message.content.media!.id ? { id: message.content.media!.id } : { link: message.content.media!.url }),
            caption: message.content.media!.caption
          }
        };

      case "document":
        return {
          ...basePayload,
          type: "document",
          document: {
            ...(message.content.media!.id ? { id: message.content.media!.id } : { link: message.content.media!.url }),
            caption: message.content.media!.caption,
            filename: message.content.media!.filename
          }
        };

      case "audio":
        return {
          ...basePayload,
          type: "audio",
          audio: {
            ...(message.content.media!.id ? { id: message.content.media!.id } : { link: message.content.media!.url })
          }
        };

      case "video":
        return {
          ...basePayload,
          type: "video",
          video: {
            ...(message.content.media!.id ? { id: message.content.media!.id } : { link: message.content.media!.url }),
            caption: message.content.media!.caption
          }
        };

      default:
        throw new Error(`Unsupported message type: ${message.type}`);
    }
  }

  /**
   * Process incoming message
   */
  async processIncomingMessage(message: any, metadata: any): Promise<void> {
    this.logActivity("incoming_message", {
      from: message.from,
      type: message.type,
      messageId: message.id
    });

    // Emit event for message processing
    this.emit("messageReceived", {
      connectionId: this.connection.id,
      companyId: this.connection.companyId,
      message,
      metadata
    });

    // Auto-mark as read (optional, can be configured)
    if (this.connection.configuration.autoMarkAsRead !== false) {
      await this.markMessageAsRead(message.id);
    }
  }

  /**
   * Process message status update
   */
  async processMessageStatus(status: any): Promise<void> {
    this.logActivity("message_status_update", {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp
    });

    this.emit("messageStatusUpdate", {
      connectionId: this.connection.id,
      companyId: this.connection.companyId,
      messageId: status.id,
      status: status.status,
      timestamp: new Date(parseInt(status.timestamp) * 1000),
      errors: status.errors
    });
  }

  /**
   * Process contact update
   */
  async processContactUpdate(contact: any): Promise<void> {
    this.logActivity("contact_update", {
      waId: contact.wa_id,
      name: contact.profile?.name
    });

    this.emit("contactUpdate", {
      connectionId: this.connection.id,
      companyId: this.connection.companyId,
      waId: contact.wa_id,
      profile: contact.profile
    });
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await this.apiClient.post(`/${this.phoneNumberId}/messages`, {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId
      });

      this.logActivity("message_marked_read", { messageId });
    } catch (error) {
      this.logActivity("mark_read_error", { 
        messageId, 
        error: this.handleWhatsAppError(error) 
      });
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(to: string, isTyping: boolean): Promise<void> {
    // WhatsApp Cloud API doesn't support typing indicators yet
    // This is a placeholder for when/if it's supported
    this.logActivity("typing_indicator", { to, isTyping });
  }

  /**
   * Check rate limits
   */
  protected async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    
    // Reset counter every minute
    if (now > this.rateLimitTracker.resetTime) {
      this.rateLimitTracker.requests = 0;
      this.rateLimitTracker.resetTime = now + 60000;
    }

    // Check if we're at the limit
    if (this.rateLimitTracker.requests >= this.rateLimitTracker.maxRequests) {
      const waitTime = this.rateLimitTracker.resetTime - now;
      this.logActivity("rate_limit_hit", { waitTime });
      
      await this.sleep(waitTime);
      return this.checkRateLimit(); // Recursive call after waiting
    }

    this.rateLimitTracker.requests++;
    return true;
  }

  /**
   * Get media URL
   */
  async getMediaUrl(mediaId: string): Promise<string> {
    try {
      const response = await this.apiClient.get(`/${mediaId}`);
      return response.data.url;
    } catch (error) {
      throw new Error(`Failed to get media URL: ${this.handleWhatsAppError(error)}`);
    }
  }

  /**
   * Upload media
   */
  async uploadMedia(filePath: string, mimeType: string): Promise<string> {
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', fs.createReadStream(filePath), {
        contentType: mimeType
      });

      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/media`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to upload media: ${this.handleWhatsAppError(error)}`);
    }
  }
}

export default WhatsAppCloudProvider;