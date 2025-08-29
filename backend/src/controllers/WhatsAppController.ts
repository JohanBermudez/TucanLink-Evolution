import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import { removeWbot } from "../libs/wbot";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";

interface WhatsappData {
  name: string;
  queueIds: number[];
  companyId: number;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
  //sendIdQueue?: number;
  //timeSendQueue?: number;
  transferQueueId?: number;
  timeToTransfer?: number;  
  promptId?: number;
  maxUseBotQueues?: number;
  timeUseBotQueues?: number;
  expiresTicket?: number;
  expiresInactiveMessage?: string;
  integrationId?: number
}

interface QueryParams {
  session?: number | string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { session } = req.query as QueryParams;
  const whatsapps = await ListWhatsAppsService({ companyId, session });

  return res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    token,
    //timeSendQueue,
    //sendIdQueue,
	  transferQueueId,
	  timeToTransfer,
    promptId,
    maxUseBotQueues,
    timeUseBotQueues,
    expiresTicket,
    expiresInactiveMessage,
    integrationId
  }: WhatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    companyId,
    token,
    //timeSendQueue,
    //sendIdQueue,
	  transferQueueId,
	  timeToTransfer,	
    promptId,
    maxUseBotQueues,
    timeUseBotQueues,
    expiresTicket,
    expiresInactiveMessage,
    integrationId
  });

  StartWhatsAppSession(whatsapp, companyId);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { session } = req.query;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId, session);

  return res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    companyId
  });

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  await ShowWhatsAppService(whatsappId, companyId);

  await DeleteWhatsAppService(whatsappId);
  removeWbot(+whatsappId);

  const io = getIO();
  io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
    action: "delete",
    whatsappId: +whatsappId
  });

  return res.status(200).json({ message: "Whatsapp deleted." });
};

export const start = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    
    if (!whatsapp) {
      return res.status(404).json({ 
        error: "Not Found", 
        message: "WhatsApp session not found" 
      });
    }

    if (whatsapp.status === "CONNECTED") {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "WhatsApp session is already connected" 
      });
    }

    // Update status and start session
    await whatsapp.update({ status: "OPENING" });
    
    StartWhatsAppSession(whatsapp, companyId);

    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp session initialization started",
      data: {
        id: whatsapp.id,
        name: whatsapp.name,
        status: "OPENING"
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || "Failed to start WhatsApp session" 
    });
  }
};

export const restart = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    
    if (!whatsapp) {
      return res.status(404).json({ 
        error: "Not Found", 
        message: "WhatsApp session not found" 
      });
    }

    // Clear session and restart
    await whatsapp.update({
      status: "OPENING",
      session: "",
      retries: 0,
      qrcode: ""
    });

    StartWhatsAppSession(whatsapp, companyId);

    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp session restart initiated",
      data: {
        id: whatsapp.id,
        name: whatsapp.name,
        status: "OPENING"
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || "Failed to restart WhatsApp session" 
    });
  }
};

export const disconnect = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    
    if (!whatsapp) {
      return res.status(404).json({ 
        error: "Not Found", 
        message: "WhatsApp session not found" 
      });
    }

    if (whatsapp.status === "DISCONNECTED") {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "WhatsApp session is already disconnected" 
      });
    }

    // Disconnect and clear session data
    await whatsapp.update({
      status: "DISCONNECTED",
      qrcode: "",
      session: ""
    });

    // Remove wbot instance
    removeWbot(+whatsappId);

    const io = getIO();
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp
    });

    return res.status(200).json({
      success: true,
      message: "WhatsApp session disconnected successfully",
      data: {
        id: whatsapp.id,
        name: whatsapp.name,
        status: "DISCONNECTED"
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || "Failed to disconnect WhatsApp session" 
    });
  }
};

export const getQR = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;

  try {
    const whatsapp = await ShowWhatsAppService(whatsappId, companyId);
    
    if (!whatsapp) {
      return res.status(404).json({ 
        error: "Not Found", 
        message: "WhatsApp session not found" 
      });
    }

    if (whatsapp.status === "CONNECTED") {
      return res.status(400).json({ 
        error: "Bad Request", 
        message: "WhatsApp session is already connected" 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: whatsapp.id,
        name: whatsapp.name,
        status: whatsapp.status,
        qrcode: whatsapp.qrcode || null,
        retries: whatsapp.retries || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Internal Server Error", 
      message: error.message || "Failed to get QR code" 
    });
  }
};
