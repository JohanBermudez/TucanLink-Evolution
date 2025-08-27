import * as Yup from "yup";
import AppError from "../../errors/AppError";
import WebhookConfig from "../../models/WebhookConfig";
import QueueIntegration from "../../models/QueueIntegrations";

interface Request {
  companyId: number;
  integrationId: number;
  webhookUrl?: string; // Hacer opcional, usaremos el de la integración
  isActive?: boolean;
  sendNewMessages?: boolean;
  sendWithoutQueue?: boolean;
  sendWithQueue?: boolean;
  sendWithAssignedUser?: boolean;
  sendMediaMessages?: boolean;
  sendOnlyFromQueues?: number[];
  sendOnlyFromWhatsapps?: number[];
  requireChatbot?: boolean;
  requireIntegration?: boolean;
  customHeaders?: object;
  authType?: string;
  authToken?: string;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

const CreateWebhookConfigService = async ({
  companyId,
  integrationId,
  webhookUrl = "", // Valor por defecto vacío
  isActive = true,
  sendNewMessages = true,
  sendWithoutQueue = false,
  sendWithQueue = true,
  sendWithAssignedUser = false,
  sendMediaMessages = true,
  sendOnlyFromQueues = [],
  sendOnlyFromWhatsapps = [],
  requireChatbot = false,
  requireIntegration = false,
  customHeaders = {},
  authType = "none",
  authToken,
  retryAttempts = 3,
  retryDelay = 1000,
  timeout = 30000
}: Request): Promise<WebhookConfig> => {
  // Si no se proporciona webhookUrl, usar el de la integración
  const integration = await QueueIntegration.findOne({
    where: {
      id: integrationId,
      companyId
    }
  });

  if (!integration) {
    throw new AppError("ERR_INTEGRATION_NOT_FOUND", 404);
  }

  // Usar el webhook URL de la integración si no se proporciona uno nuevo
  if (!webhookUrl && integration.urlN8N) {
    webhookUrl = integration.urlN8N;
  }

  const schema = Yup.object().shape({
    webhookUrl: Yup.string().url().required(),
    authType: Yup.string().oneOf(["none", "bearer", "basic", "apikey"]),
    retryAttempts: Yup.number().min(0).max(10),
    retryDelay: Yup.number().min(100).max(60000),
    timeout: Yup.number().min(1000).max(120000)
  });

  try {
    await schema.validate({
      webhookUrl,
      authType,
      retryAttempts,
      retryDelay,
      timeout
    });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  // Ya verificamos la integración arriba, no necesitamos hacerlo de nuevo

  // Verificar que no exista otra configuración para la misma integración
  const existingConfig = await WebhookConfig.findOne({
    where: {
      integrationId,
      companyId
    }
  });

  if (existingConfig) {
    throw new AppError("ERR_WEBHOOK_CONFIG_ALREADY_EXISTS", 409);
  }

  const webhookConfig = await WebhookConfig.create({
    companyId,
    integrationId,
    webhookUrl,
    isActive,
    sendNewMessages,
    sendWithoutQueue,
    sendWithQueue,
    sendWithAssignedUser,
    sendMediaMessages,
    sendOnlyFromQueues,
    sendOnlyFromWhatsapps,
    requireChatbot,
    requireIntegration,
    customHeaders,
    authType,
    authToken,
    retryAttempts,
    retryDelay,
    timeout
  });

  await webhookConfig.reload({
    include: ["integration"]
  });

  return webhookConfig;
};

export default CreateWebhookConfigService;