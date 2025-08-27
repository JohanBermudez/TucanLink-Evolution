import AppError from "../../errors/AppError";
import WebhookConfig from "../../models/WebhookConfig";
import QueueIntegration from "../../models/QueueIntegrations";

const ShowWebhookConfigService = async (
  id: string | number,
  companyId: number
): Promise<WebhookConfig> => {
  const webhookConfig = await WebhookConfig.findOne({
    where: {
      id,
      companyId
    },
    include: [
      {
        model: QueueIntegration,
        as: "integration",
        attributes: ["id", "name", "type"]
      }
    ]
  });

  if (!webhookConfig) {
    throw new AppError("ERR_NO_WEBHOOK_CONFIG_FOUND", 404);
  }

  return webhookConfig;
};

export default ShowWebhookConfigService;