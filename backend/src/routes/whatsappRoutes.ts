import express from "express";
import isAuth from "../middleware/isAuth";

import * as WhatsAppController from "../controllers/WhatsAppController";

const whatsappRoutes = express.Router();

whatsappRoutes.get("/whatsapp/", isAuth, WhatsAppController.index);

whatsappRoutes.post("/whatsapp/", isAuth, WhatsAppController.store);

whatsappRoutes.get("/whatsapp/:whatsappId", isAuth, WhatsAppController.show);

whatsappRoutes.put("/whatsapp/:whatsappId", isAuth, WhatsAppController.update);

whatsappRoutes.delete(
  "/whatsapp/:whatsappId",
  isAuth,
  WhatsAppController.remove
);

// WhatsApp session control endpoints
whatsappRoutes.post(
  "/whatsapp/:whatsappId/start", 
  isAuth, 
  WhatsAppController.start
);

whatsappRoutes.post(
  "/whatsapp/:whatsappId/restart", 
  isAuth, 
  WhatsAppController.restart
);

whatsappRoutes.post(
  "/whatsapp/:whatsappId/disconnect", 
  isAuth, 
  WhatsAppController.disconnect
);

whatsappRoutes.get(
  "/whatsapp/:whatsappId/qr", 
  isAuth, 
  WhatsAppController.getQR
);

export default whatsappRoutes;
