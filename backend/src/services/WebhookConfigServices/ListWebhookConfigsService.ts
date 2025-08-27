import { Op, Sequelize } from "sequelize";
import WebhookConfig from "../../models/WebhookConfig";
import QueueIntegration from "../../models/QueueIntegrations";

interface Request {
  companyId: number;
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  webhookConfigs: WebhookConfig[];
  count: number;
  hasMore: boolean;
}

const ListWebhookConfigsService = async ({
  companyId,
  searchParam = "",
  pageNumber = "1"
}: Request): Promise<Response> => {
  const whereCondition: any = {
    companyId
  };

  if (searchParam) {
    whereCondition[Op.or] = [
      {
        webhookUrl: Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("webhookUrl")),
          "LIKE",
          `%${searchParam.toLowerCase()}%`
        )
      }
    ];
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: webhookConfigs } = await WebhookConfig.findAndCountAll({
    where: whereCondition,
    include: [
      {
        model: QueueIntegration,
        as: "integration",
        attributes: ["id", "name", "type"]
      }
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]]
  });

  const hasMore = count > offset + webhookConfigs.length;

  return {
    webhookConfigs,
    count,
    hasMore
  };
};

export default ListWebhookConfigsService;