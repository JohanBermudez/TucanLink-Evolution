import { EventEmitter } from "events";
import {
  ChannelManagerInterface,
  ChannelProvider,
  ConnectionInfo,
  ChannelConfiguration,
  MessagePayload,
  MessageResult,
  WebhookPayload
} from "../core/ChannelManagerInterface";
import { ChannelType } from "../models/Channel";
import { ConnectionStatus } from "../models/ChannelConnection";
import Channel from "../models/Channel";
import ChannelConnection from "../models/ChannelConnection";
import ChannelMessage from "../models/ChannelMessage";
import ChannelWebhook from "../models/ChannelWebhook";
import { logger } from "../../utils/logger";

export class ChannelManager extends EventEmitter implements ChannelManagerInterface {
  private providers: Map<ChannelType, ChannelProvider> = new Map();
  private activeConnections: Map<number, ChannelProvider> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100); // Allow many connections
  }

  /**
   * Register a new channel provider
   */
  registerProvider(type: ChannelType, provider: ChannelProvider): void {
    this.providers.set(type, provider);
    
    logger.info("Channel provider registered", { type });
    this.emit("providerRegistered", { type, provider });
  }

  /**
   * Create a new channel connection
   */
  async createConnection(
    companyId: number,
    type: ChannelType,
    name: string,
    configuration: ChannelConfiguration
  ): Promise<ConnectionInfo> {
    try {
      // Check if provider exists
      const provider = this.providers.get(type);
      if (!provider) {
        throw new Error(`Provider for channel type ${type} not registered`);
      }

      // Create or get channel
      let channel = await Channel.findOne({
        where: { companyId, type }
      });

      if (!channel) {
        channel = await Channel.create({
          name: `${type} Channel`,
          type,
          provider: this.getProviderName(type),
          companyId,
          status: "ACTIVE",
          capabilities: provider.getCapabilities(),
          configuration: {}
        });
      }

      // Create connection
      const connection = await ChannelConnection.create({
        channelId: channel.id,
        connectionName: name,
        status: ConnectionStatus.DISCONNECTED,
        companyId,
        configuration,
        connectionData: {},
        authData: "",
        isDefault: false
      });

      const connectionInfo: ConnectionInfo = {
        id: connection.id,
        name: connection.connectionName,
        type: channel.type,
        status: connection.status,
        companyId: connection.companyId,
        configuration: connection.configuration as ChannelConfiguration,
        capabilities: provider.getCapabilities(),
        rateLimit: channel.rateLimit as any,
        metadata: connection.metadata as Record<string, any>
      };

      logger.info("Channel connection created", {
        connectionId: connection.id,
        companyId,
        type,
        name
      });

      this.emit("connectionCreated", connectionInfo);
      return connectionInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to create connection", {
        companyId,
        type,
        name,
        error: errorMessage
      });
      throw new Error(`Failed to create connection: ${errorMessage}`);
    }
  }

  /**
   * Get connection by ID
   */
  async getConnection(connectionId: number): Promise<ConnectionInfo | null> {
    try {
      const connection = await ChannelConnection.findByPk(connectionId, {
        include: [
          {
            model: Channel,
            as: "channel"
          }
        ]
      });

      if (!connection || !connection.channel) {
        return null;
      }

      const provider = this.providers.get(connection.channel.type);
      const capabilities = provider?.getCapabilities() || {};

      return {
        id: connection.id,
        name: connection.connectionName,
        type: connection.channel.type,
        status: connection.status,
        companyId: connection.companyId,
        configuration: connection.configuration as ChannelConfiguration,
        capabilities,
        rateLimit: connection.channel.rateLimit as any,
        metadata: connection.metadata as Record<string, any>
      };

    } catch (error) {
      logger.error("Failed to get connection", {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * List connections for a company
   */
  async listConnections(companyId: number, type?: ChannelType): Promise<ConnectionInfo[]> {
    try {
      const whereClause: any = { companyId };
      
      const connections = await ChannelConnection.findAll({
        where: whereClause,
        include: [
          {
            model: Channel,
            as: "channel",
            where: type ? { type } : undefined
          }
        ]
      });

      const connectionInfos: ConnectionInfo[] = [];
      
      for (const connection of connections) {
        if (!connection.channel) continue;
        
        const provider = this.providers.get(connection.channel.type);
        const capabilities = provider?.getCapabilities() || {};

        connectionInfos.push({
          id: connection.id,
          name: connection.connectionName,
          type: connection.channel.type,
          status: connection.status,
          companyId: connection.companyId,
          configuration: connection.configuration as ChannelConfiguration,
          capabilities,
          rateLimit: connection.channel.rateLimit as any,
          metadata: connection.metadata as Record<string, any>
        });
      }

      return connectionInfos;

    } catch (error) {
      logger.error("Failed to list connections", {
        companyId,
        type,
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Update connection configuration
   */
  async updateConnection(
    connectionId: number,
    configuration: Partial<ChannelConfiguration>
  ): Promise<ConnectionInfo> {
    try {
      const connection = await ChannelConnection.findByPk(connectionId, {
        include: [{ model: Channel, as: "channel" }]
      });

      if (!connection || !connection.channel) {
        throw new Error("Connection not found");
      }

      // Merge configurations
      const updatedConfig = {
        ...(connection.configuration as ChannelConfiguration),
        ...configuration
      };

      await connection.update({
        configuration: updatedConfig
      });

      // If connection is active, update the provider
      const activeProvider = this.activeConnections.get(connectionId);
      if (activeProvider) {
        const connectionInfo = await this.getConnection(connectionId);
        if (connectionInfo) {
          await activeProvider.initialize(connectionInfo);
        }
      }

      const updatedConnection = await this.getConnection(connectionId);
      if (!updatedConnection) {
        throw new Error("Failed to retrieve updated connection");
      }

      logger.info("Connection updated", { connectionId, configuration });
      this.emit("connectionUpdated", updatedConnection);

      return updatedConnection;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to update connection", {
        connectionId,
        configuration,
        error: errorMessage
      });
      throw new Error(`Failed to update connection: ${errorMessage}`);
    }
  }

  /**
   * Delete connection
   */
  async deleteConnection(connectionId: number): Promise<void> {
    try {
      // Disconnect if active
      if (this.activeConnections.has(connectionId)) {
        await this.disconnectChannel(connectionId);
      }

      // Delete from database
      await ChannelConnection.destroy({
        where: { id: connectionId }
      });

      logger.info("Connection deleted", { connectionId });
      this.emit("connectionDeleted", { connectionId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to delete connection", {
        connectionId,
        error: errorMessage
      });
      throw new Error(`Failed to delete connection: ${errorMessage}`);
    }
  }

  /**
   * Connect a channel
   */
  async connectChannel(connectionId: number): Promise<ConnectionStatus> {
    try {
      const connectionInfo = await this.getConnection(connectionId);
      if (!connectionInfo) {
        throw new Error("Connection not found");
      }

      const provider = this.providers.get(connectionInfo.type);
      if (!provider) {
        throw new Error(`Provider for ${connectionInfo.type} not found`);
      }

      // Initialize provider
      await provider.initialize(connectionInfo);

      // Set up event listeners
      this.setupProviderListeners(connectionId, provider);

      // Connect
      const status = await provider.connect();

      // Update database status
      await ChannelConnection.update(
        { 
          status,
          lastActivity: new Date()
        },
        { where: { id: connectionId } }
      );

      // Store active connection
      this.activeConnections.set(connectionId, provider);

      logger.info("Channel connected", {
        connectionId,
        type: connectionInfo.type,
        status
      });

      this.emit("channelConnected", { connectionId, status });
      return status;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to connect channel", {
        connectionId,
        error: errorMessage
      });

      // Update status to error
      await ChannelConnection.update(
        { 
          status: ConnectionStatus.ERROR,
          lastError: errorMessage
        },
        { where: { id: connectionId } }
      );

      throw new Error(`Failed to connect channel: ${errorMessage}`);
    }
  }

  /**
   * Disconnect a channel
   */
  async disconnectChannel(connectionId: number): Promise<void> {
    try {
      const provider = this.activeConnections.get(connectionId);
      if (provider) {
        await provider.disconnect();
        this.activeConnections.delete(connectionId);
      }

      // Update database status
      await ChannelConnection.update(
        { 
          status: ConnectionStatus.DISCONNECTED,
          lastActivity: new Date()
        },
        { where: { id: connectionId } }
      );

      logger.info("Channel disconnected", { connectionId });
      this.emit("channelDisconnected", { connectionId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to disconnect channel", {
        connectionId,
        error: errorMessage
      });
      throw new Error(`Failed to disconnect channel: ${errorMessage}`);
    }
  }

  /**
   * Send message through specific connection
   */
  async sendMessage(connectionId: number, payload: MessagePayload): Promise<MessageResult> {
    try {
      const provider = this.activeConnections.get(connectionId);
      if (!provider) {
        throw new Error("Channel not connected");
      }

      const result = await provider.sendMessage(payload);

      // Log message in database
      if (result.status === "sent" && result.id) {
        await this.logOutboundMessage(connectionId, payload, result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to send message", {
        connectionId,
        payload: { ...payload, content: "[REDACTED]" },
        error: errorMessage
      });

      return {
        id: "",
        status: "failed",
        error: errorMessage
      };
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(connectionId: number, payload: WebhookPayload): Promise<void> {
    try {
      // Log webhook
      await ChannelWebhook.create({
        channelConnectionId: connectionId,
        eventType: payload.eventType,
        payload: payload.data,
        signature: payload.signature,
        sourceIp: payload.source,
        companyId: 0, // Will be filled by trigger
        processingStatus: "PENDING"
      });

      // Process with provider
      const provider = this.activeConnections.get(connectionId);
      if (provider) {
        await provider.processWebhook(payload);
      }

      this.emit("webhookProcessed", { connectionId, payload });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Failed to process webhook", {
        connectionId,
        eventType: payload.eventType,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(connectionId: number): Promise<ConnectionStatus> {
    const provider = this.activeConnections.get(connectionId);
    if (provider) {
      return provider.getStatus();
    }

    const connection = await ChannelConnection.findByPk(connectionId);
    return connection?.status || ConnectionStatus.DISCONNECTED;
  }

  /**
   * Get all active connections
   */
  async getActiveConnections(companyId?: number): Promise<ConnectionInfo[]> {
    const connections: ConnectionInfo[] = [];

    for (const [connectionId, provider] of this.activeConnections) {
      const connectionInfo = await this.getConnection(connectionId);
      if (connectionInfo && (!companyId || connectionInfo.companyId === companyId)) {
        connections.push(connectionInfo);
      }
    }

    return connections;
  }

  /**
   * Setup event listeners for provider
   */
  private setupProviderListeners(connectionId: number, provider: ChannelProvider): void {
    provider.on("statusChange", (data) => {
      this.emit("connectionStatusChange", { connectionId, ...data });
      
      // Update database
      ChannelConnection.update(
        { 
          status: data.newStatus,
          lastActivity: new Date(),
          lastError: data.error || null
        },
        { where: { id: connectionId } }
      );
    });

    provider.on("messageReceived", (data) => {
      this.emit("messageReceived", { connectionId, ...data });
      // Log inbound message
      this.logInboundMessage(connectionId, data);
    });

    provider.on("messageSent", (data) => {
      this.emit("messageSent", { connectionId, ...data });
    });

    provider.on("messageFailed", (data) => {
      this.emit("messageFailed", { connectionId, ...data });
    });
  }

  /**
   * Log outbound message
   */
  private async logOutboundMessage(
    connectionId: number,
    payload: MessagePayload,
    result: MessageResult
  ): Promise<void> {
    try {
      // This would integrate with the existing Message system
      logger.info("Outbound message logged", {
        connectionId,
        messageId: result.id,
        externalId: result.externalId,
        to: payload.to,
        type: payload.type
      });
    } catch (error) {
      logger.error("Failed to log outbound message", {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Log inbound message
   */
  private async logInboundMessage(connectionId: number, data: any): Promise<void> {
    try {
      // This would integrate with the existing Message and Ticket system
      logger.info("Inbound message logged", {
        connectionId,
        from: data.message?.from,
        messageId: data.message?.id,
        type: data.message?.type
      });
    } catch (error) {
      logger.error("Failed to log inbound message", {
        connectionId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get provider name for channel type
   */
  private getProviderName(type: ChannelType): string {
    switch (type) {
      case ChannelType.WHATSAPP_CLOUD:
        return "Meta WhatsApp Cloud API";
      case ChannelType.WHATSAPP_BAILEYS:
        return "WhatsApp Baileys";
      case ChannelType.INSTAGRAM_DIRECT:
        return "Instagram Direct";
      case ChannelType.FACEBOOK_MESSENGER:
        return "Facebook Messenger";
      case ChannelType.TELEGRAM:
        return "Telegram Bot API";
      case ChannelType.EMAIL:
        return "Email SMTP";
      case ChannelType.SMS:
        return "SMS Gateway";
      default:
        return "Custom Provider";
    }
  }

  /**
   * Shutdown all connections
   */
  async shutdown(): Promise<void> {
    logger.info("Shutting down Channel Manager");

    for (const [connectionId, provider] of this.activeConnections) {
      try {
        await provider.disconnect();
      } catch (error) {
        logger.error("Error disconnecting provider during shutdown", {
          connectionId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    this.activeConnections.clear();
    this.removeAllListeners();
  }
}

export default ChannelManager;