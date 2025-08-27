import { Router } from "express";
import isAuth from "../middleware/isAuth";

import * as WebhookConfigController from "../controllers/WebhookConfigController";

const webhookConfigRoutes = Router();

webhookConfigRoutes.get(
  "/webhook-configs",
  isAuth,
  WebhookConfigController.index
);

webhookConfigRoutes.get(
  "/webhook-configs/:webhookConfigId",
  isAuth,
  WebhookConfigController.show
);

webhookConfigRoutes.post(
  "/webhook-configs",
  isAuth,
  WebhookConfigController.store
);

webhookConfigRoutes.put(
  "/webhook-configs/:webhookConfigId",
  isAuth,
  WebhookConfigController.update
);

webhookConfigRoutes.delete(
  "/webhook-configs/:webhookConfigId",
  isAuth,
  WebhookConfigController.remove
);

webhookConfigRoutes.post(
  "/webhook-configs/test",
  isAuth,
  WebhookConfigController.test
);

export default webhookConfigRoutes;