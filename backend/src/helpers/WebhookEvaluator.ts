import WebhookConfig from "../models/WebhookConfig";
import Ticket from "../models/Ticket";
import Message from "../models/Message";
import Whatsapp from "../models/Whatsapp";
import Queue from "../models/Queue";
import QueueIntegration from "../models/QueueIntegrations";
import Setting from "../models/Setting";
import request from "request";

interface EvaluationContext {
  ticket: Ticket;
  message?: Message;
  whatsapp?: Whatsapp;
  queue?: Queue;
  integration?: QueueIntegration;
  companyId: number;
}

interface WebhookPayload {
  ticket?: Ticket;
  message?: Message | any; // Allow raw WhatsApp message objects
  whatsapp?: Whatsapp;
  queue?: Queue;
  [key: string]: any;
}

class WebhookEvaluator {
  private context: EvaluationContext;
  private webhookConfig: WebhookConfig | null = null;
  private useOldLogic: boolean = true;

  constructor(context: EvaluationContext) {
    this.context = context;
  }

  /**
   * Evalúa si se debe enviar el webhook según la configuración
   */
  public async shouldSendWebhook(): Promise<boolean> {
    const { ticket, companyId, integration } = this.context;

    // Primero verificamos si existe una configuración de webhook
    if (integration) {
      this.webhookConfig = await WebhookConfig.findOne({
        where: {
          integrationId: integration.id,
          companyId,
          isActive: true
        }
      });
    }

    // Si no hay configuración de webhook, usar lógica antigua
    if (!this.webhookConfig) {
      return this.evaluateOldLogic();
    }

    // Si hay configuración, verificar si está habilitada la lógica antigua como fallback
    const fallbackSetting = await Setting.findOne({
      where: {
        key: "useOldWebhookLogic",
        companyId
      }
    });

    if (fallbackSetting?.value === "enabled") {
      this.useOldLogic = true;
      // Si la lógica antigua está habilitada pero también hay config nueva,
      // usamos OR lógico (enviar si cualquiera de las dos lo permite)
      return (await this.evaluateNewLogic()) || this.evaluateOldLogic();
    }

    // Solo usar la nueva lógica
    return this.evaluateNewLogic();
  }

  /**
   * Evalúa usando la nueva configuración flexible
   */
  private async evaluateNewLogic(): Promise<boolean> {
    if (!this.webhookConfig) {
      console.log('[WebhookEvaluator] No webhook config found');
      return false;
    }

    const { ticket, message, whatsapp, queue } = this.context;
    const config = this.webhookConfig;

    console.log('[WebhookEvaluator] Using new logic evaluation');
    console.log(`  - Config active: ${config.isActive}`);
    console.log(`  - Send new messages: ${config.sendNewMessages}`);
    console.log(`  - Has message: ${!!message}`);
    console.log(`  - Has queue: ${!!queue}`);
    console.log(`  - Send without queue: ${config.sendWithoutQueue}`);
    console.log(`  - Send with queue: ${config.sendWithQueue}`);

    // Verificar si es un mensaje nuevo (si aplica)
    if (config.sendNewMessages && !message) {
      console.log('  ❌ Rejected: sendNewMessages=true but no message');
      return false;
    }

    // Verificar condiciones de cola
    if (!queue && !config.sendWithoutQueue) {
      console.log('  ❌ Rejected: no queue and sendWithoutQueue=false');
      return false;
    }

    if (queue && !config.sendWithQueue) {
      console.log('  ❌ Rejected: has queue but sendWithQueue=false');
      return false;
    }

    // Verificar si la cola está en la lista permitida
    if (config.sendOnlyFromQueues.length > 0 && queue) {
      if (!config.sendOnlyFromQueues.includes(queue.id)) {
        return false;
      }
    }

    // Verificar si el WhatsApp está en la lista permitida
    if (config.sendOnlyFromWhatsapps.length > 0 && whatsapp) {
      if (!config.sendOnlyFromWhatsapps.includes(whatsapp.id)) {
        return false;
      }
    }

    // Verificar usuario asignado
    if (ticket.userId && !config.sendWithAssignedUser) {
      return false;
    }

    // Verificar tipo de mensaje media
    if (message && message.mediaType && message.mediaType !== "chat" && !config.sendMediaMessages) {
      return false;
    }

    // Verificar requisitos de chatbot
    if (config.requireChatbot && !ticket.chatbot) {
      return false;
    }

    // Verificar requisitos de integración
    if (config.requireIntegration && !ticket.useIntegration) {
      return false;
    }

    return true;
  }

  /**
   * Evalúa usando la lógica antigua (compatibilidad hacia atrás)
   */
  private evaluateOldLogic(): boolean {
    const { ticket, queue, integration } = this.context;

    // Lógica original del sistema (muy restrictiva)
    console.log('[WebhookEvaluator] Using old logic evaluation');
    console.log(`  - Has integration: ${!!integration}`);
    console.log(`  - Has queue: ${!!queue}`);
    console.log(`  - Has user: ${!!ticket.userId}`);
    console.log(`  - Chatbot enabled: ${ticket.chatbot}`);
    console.log(`  - Use integration: ${ticket.useIntegration}`);
    
    if (!integration) return false;
    if (!queue) return false;
    if (ticket.userId) return false; // No enviar si hay usuario asignado
    if (!ticket.chatbot) return false; // Solo enviar si chatbot está activo
    if (!ticket.useIntegration) return false; // Solo si usa integración

    return true;
  }

  /**
   * Envía el webhook si la evaluación fue positiva
   */
  public async sendWebhook(payload: WebhookPayload): Promise<void> {
    if (!(await this.shouldSendWebhook())) {
      return;
    }

    let webhookUrl: string | undefined;
    let headers: any = { "Content-Type": "application/json" };
    let authToken: string | undefined;
    let authType = "none";
    let retryAttempts = 3;
    let retryDelay = 1000;
    let timeout = 30000;

    if (this.webhookConfig) {
      // Usar configuración nueva
      webhookUrl = this.webhookConfig.webhookUrl;
      authType = this.webhookConfig.authType;
      authToken = this.webhookConfig.authToken;
      retryAttempts = this.webhookConfig.retryAttempts;
      retryDelay = this.webhookConfig.retryDelay;
      timeout = this.webhookConfig.timeout;

      // Agregar headers personalizados
      if (this.webhookConfig.customHeaders) {
        headers = { ...headers, ...this.webhookConfig.customHeaders };
      }

      // Configurar autenticación
      switch (authType) {
        case "bearer":
          headers["Authorization"] = `Bearer ${authToken}`;
          break;
        case "basic":
          headers["Authorization"] = `Basic ${authToken}`;
          break;
        case "apikey":
          headers["X-API-Key"] = authToken;
          break;
      }
    } else if (this.context.integration) {
      // Usar configuración antigua
      webhookUrl = this.context.integration.urlN8N;
    }

    if (!webhookUrl) {
      console.error("No webhook URL configured");
      return;
    }

    const sendRequest = (attempt: number): void => {
      const options = {
        method: "POST",
        url: webhookUrl,
        headers,
        json: payload,
        timeout
      };

      request(options, (error, response) => {
        if (error) {
          console.error(`Webhook error (attempt ${attempt}):`, error);
          
          if (attempt < retryAttempts) {
            setTimeout(() => {
              sendRequest(attempt + 1);
            }, retryDelay * attempt);
          } else {
            console.error("Webhook failed after all retry attempts");
          }
        } else {
          console.log("Webhook sent successfully:", response.statusCode);
        }
      });
    };

    sendRequest(1);
  }

  /**
   * Método estático para facilitar el uso
   */
  public static async evaluate(
    context: EvaluationContext,
    payload?: WebhookPayload
  ): Promise<boolean> {
    const evaluator = new WebhookEvaluator(context);
    
    if (payload) {
      await evaluator.sendWebhook(payload);
      return true;
    }
    
    return evaluator.shouldSendWebhook();
  }
}

export default WebhookEvaluator;