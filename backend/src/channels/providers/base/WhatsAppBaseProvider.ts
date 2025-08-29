import BaseChannelProvider from "../../core/BaseChannelProvider";
import { 
  ChannelCapabilities,
  MessagePayload,
  MessageResult,
  WebhookPayload
} from "../../core/ChannelManagerInterface";
import { ConnectionStatus } from "../../models/ChannelConnection";

export interface WhatsAppCapabilities extends ChannelCapabilities {
  text: true;
  media: true;
  buttons: true;
  lists: true;
  templates: true;
  location: true;
  contacts: true;
  reactions: boolean;
  typing: true;
  read_receipts: true;
  interactive: true;
  groups: boolean;
  broadcast: boolean;
}

export interface WhatsAppMessage {
  to: string;
  from?: string;
  type: "text" | "image" | "document" | "audio" | "video" | "location" | "template" | "interactive";
  content: {
    text?: string;
    media?: {
      url?: string;
      id?: string;
      caption?: string;
      filename?: string;
    };
    template?: {
      name: string;
      language: string;
      components?: any[];
    };
    interactive?: {
      type: "button" | "list";
      body: { text: string };
      action: any;
    };
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
  };
  context?: {
    message_id: string; // For replies
  };
}

export interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          context?: { from: string; id: string };
          text?: { body: string };
          image?: { caption?: string; mime_type: string; sha256: string; id: string };
          document?: { caption?: string; filename: string; mime_type: string; sha256: string; id: string };
          audio?: { mime_type: string; sha256: string; id: string; voice: boolean };
          video?: { caption?: string; mime_type: string; sha256: string; id: string };
          location?: { latitude: number; longitude: number; name?: string; address?: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
          button?: { text: string; payload: string };
        }>;
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
          errors?: Array<{ code: number; title: string; message: string; error_data?: { details: string } }>;
        }>;
      };
    }>;
  }>;
}

export abstract class WhatsAppBaseProvider extends BaseChannelProvider {
  protected phoneNumberId?: string;
  protected businessAccountId?: string;
  protected accessToken?: string;

  /**
   * Common WhatsApp capabilities
   */
  getCapabilities(): WhatsAppCapabilities {
    return {
      text: true,
      media: true,
      buttons: true,
      lists: true,
      templates: true,
      location: true,
      contacts: true,
      reactions: false, // Varies by implementation
      typing: true,
      read_receipts: true,
      interactive: true,
      groups: false, // Varies by implementation
      broadcast: false // Varies by implementation
    };
  }

  /**
   * Enhanced WhatsApp message validation
   */
  validateMessage(payload: MessagePayload): boolean {
    if (!super.validateMessage(payload)) {
      return false;
    }

    // WhatsApp specific validations
    const message = payload as WhatsAppMessage;
    
    // Validate phone number format (should start with + and country code)
    if (!this.isValidPhoneNumber(message.to)) {
      return false;
    }

    // Type specific validations
    switch (message.type) {
      case "text":
        return !!(message.content.text && message.content.text.length <= 4096);
      
      case "template":
        return !!(message.content.template?.name && message.content.template?.language);
      
      case "interactive":
        return !!(message.content.interactive?.type && message.content.interactive?.body);
      
      case "location":
        return !!(
          message.content.location?.latitude && 
          message.content.location?.longitude
        );
      
      case "image":
      case "document":
      case "audio":
      case "video":
        return !!(message.content.media && (message.content.media.url || message.content.media.id));
      
      default:
        return false;
    }
  }

  /**
   * Validate phone number format
   */
  protected isValidPhoneNumber(phoneNumber: string): boolean {
    // WhatsApp requires E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to WhatsApp format
   */
  protected formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = "1"): string {
    // Remove all non-digits except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, "");
    
    // If doesn't start with +, add default country code
    if (!cleaned.startsWith("+")) {
      cleaned = `+${defaultCountryCode}${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Process WhatsApp webhook payload
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      const webhookData = payload.data as WhatsAppWebhook;
      
      if (webhookData.object !== "whatsapp_business_account") {
        this.logActivity("webhook_ignored", { reason: "Invalid object type", object: webhookData.object });
        return;
      }

      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            await this.processMessageUpdate(change.value);
          }
        }
      }
    } catch (error) {
      this.logActivity("webhook_error", { 
        error: error instanceof Error ? error.message : String(error),
        payload 
      });
      throw error;
    }
  }

  /**
   * Process message updates from webhook
   */
  protected async processMessageUpdate(value: any): Promise<void> {
    // Process incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await this.processIncomingMessage(message, value.metadata);
      }
    }

    // Process message status updates
    if (value.statuses) {
      for (const status of value.statuses) {
        await this.processMessageStatus(status);
      }
    }

    // Process contact updates
    if (value.contacts) {
      for (const contact of value.contacts) {
        await this.processContactUpdate(contact);
      }
    }
  }

  /**
   * Abstract methods for specific WhatsApp implementations
   */
  abstract processIncomingMessage(message: any, metadata: any): Promise<void>;
  abstract processMessageStatus(status: any): Promise<void>;
  abstract processContactUpdate(contact: any): Promise<void>;
  abstract markMessageAsRead(messageId: string): Promise<void>;
  abstract sendTypingIndicator(to: string, isTyping: boolean): Promise<void>;

  /**
   * Common message sending wrapper
   */
  async sendMessage(payload: MessagePayload): Promise<MessageResult> {
    try {
      this.logActivity("sending_message", { 
        to: payload.to, 
        type: payload.type 
      });

      const result = await this.sendWhatsAppMessage(payload as WhatsAppMessage);
      
      this.logActivity("message_sent", { 
        messageId: result.id,
        externalId: result.externalId
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logActivity("message_send_error", { 
        error: errorMessage,
        to: payload.to,
        type: payload.type
      });
      
      return {
        id: "",
        status: "failed",
        error: errorMessage
      };
    }
  }

  /**
   * Abstract method for sending WhatsApp messages
   */
  abstract sendWhatsAppMessage(message: WhatsAppMessage): Promise<MessageResult>;

  /**
   * Common error handling for WhatsApp API errors
   */
  protected handleWhatsAppError(error: any): string {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      return `WhatsApp API Error ${apiError.code}: ${apiError.message}`;
    }
    
    return error.message || "Unknown WhatsApp error";
  }

  /**
   * Rate limiting check (to be implemented by specific providers)
   */
  protected abstract checkRateLimit(): Promise<boolean>;

  /**
   * Get media URL (for downloading received media)
   */
  abstract getMediaUrl(mediaId: string): Promise<string>;

  /**
   * Upload media (for sending media messages)
   */
  abstract uploadMedia(filePath: string, mimeType: string): Promise<string>;
}

export default WhatsAppBaseProvider;