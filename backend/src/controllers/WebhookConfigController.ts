import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import CreateWebhookConfigService from "../services/WebhookConfigServices/CreateWebhookConfigService";
import UpdateWebhookConfigService from "../services/WebhookConfigServices/UpdateWebhookConfigService";
import ListWebhookConfigsService from "../services/WebhookConfigServices/ListWebhookConfigsService";
import ShowWebhookConfigService from "../services/WebhookConfigServices/ShowWebhookConfigService";
import DeleteWebhookConfigService from "../services/WebhookConfigServices/DeleteWebhookConfigService";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { webhookConfigs, count, hasMore } = await ListWebhookConfigsService({
    companyId,
    searchParam,
    pageNumber
  });

  return res.json({ webhookConfigs, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const {
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
  } = req.body;

  const webhookConfig = await CreateWebhookConfigService({
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

  const io = getIO();
  io.emit(`company-${companyId}-webhookConfig`, {
    action: "create",
    webhookConfig
  });

  return res.status(200).json(webhookConfig);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { webhookConfigId } = req.params;
  const { companyId } = req.user;

  const webhookConfig = await ShowWebhookConfigService(webhookConfigId, companyId);

  return res.status(200).json(webhookConfig);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { webhookConfigId } = req.params;
  const { companyId } = req.user;
  const webhookConfigData = req.body;

  const webhookConfig = await UpdateWebhookConfigService({
    webhookConfigData,
    webhookConfigId: +webhookConfigId,
    companyId
  });

  const io = getIO();
  io.emit(`company-${companyId}-webhookConfig`, {
    action: "update",
    webhookConfig
  });

  return res.status(200).json(webhookConfig);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { webhookConfigId } = req.params;
  const { companyId } = req.user;

  await DeleteWebhookConfigService(webhookConfigId, companyId);

  const io = getIO();
  io.emit(`company-${companyId}-webhookConfig`, {
    action: "delete",
    webhookConfigId: +webhookConfigId
  });

  return res.status(200).json({ message: "Webhook config deleted" });
};

export const test = async (req: Request, res: Response): Promise<Response> => {
  const { webhookUrl, customHeaders, authType, authToken } = req.body;
  
  try {
    const request = await import("request");
    
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Esta es una prueba de webhook desde TucanLink",
      companyId: req.user.companyId
    };
    
    let headers: any = {
      "Content-Type": "application/json",
      ...customHeaders
    };
    
    // Configurar autenticación
    if (authType === "bearer" && authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    } else if (authType === "basic" && authToken) {
      headers["Authorization"] = `Basic ${authToken}`;
    } else if (authType === "apikey" && authToken) {
      headers["X-API-Key"] = authToken;
    }
    
    const options = {
      method: "POST",
      url: webhookUrl,
      headers,
      json: testPayload,
      timeout: 10000
    };
    
    return new Promise((resolve) => {
      request.default(options, (error: any, response: any) => {
        if (error) {
          resolve(res.status(200).json({ success: false, error: error.message }));
        } else {
          resolve(res.status(200).json({ 
            success: response.statusCode >= 200 && response.statusCode < 300,
            statusCode: response.statusCode,
            error: response.statusCode >= 400 ? `HTTP ${response.statusCode}` : null
          }));
        }
      });
    });
  } catch (error: any) {
    return res.status(200).json({ success: false, error: error.message });
  }
};