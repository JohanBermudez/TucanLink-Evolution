import * as Yup from "yup";
import AppError from "../../errors/AppError";
import WebhookConfig from "../../models/WebhookConfig";

interface WebhookConfigData {
  webhookUrl?: string;
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

interface Request {
  webhookConfigData: WebhookConfigData;
  webhookConfigId: number;
  companyId: number;
}

const UpdateWebhookConfigService = async ({
  webhookConfigData,
  webhookConfigId,
  companyId
}: Request): Promise<WebhookConfig> => {
  const schema = Yup.object().shape({
    webhookUrl: Yup.string().url(),
    authType: Yup.string().oneOf(["none", "bearer", "basic", "apikey"]),
    retryAttempts: Yup.number().min(0).max(10),
    retryDelay: Yup.number().min(100).max(60000),
    timeout: Yup.number().min(1000).max(120000)
  });

  try {
    await schema.validate(webhookConfigData);
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const webhookConfig = await WebhookConfig.findOne({
    where: {
      id: webhookConfigId,
      companyId
    }
  });

  if (!webhookConfig) {
    throw new AppError("ERR_NO_WEBHOOK_CONFIG_FOUND", 404);
  }

  await webhookConfig.update(webhookConfigData);

  await webhookConfig.reload({
    include: ["integration"]
  });

  return webhookConfig;
};

export default UpdateWebhookConfigService;