import AppError from "../../errors/AppError";
import WebhookConfig from "../../models/WebhookConfig";

const DeleteWebhookConfigService = async (
  id: string | number,
  companyId: number
): Promise<void> => {
  const webhookConfig = await WebhookConfig.findOne({
    where: {
      id,
      companyId
    }
  });

  if (!webhookConfig) {
    throw new AppError("ERR_NO_WEBHOOK_CONFIG_FOUND", 404);
  }

  await webhookConfig.destroy();
};

export default DeleteWebhookConfigService;