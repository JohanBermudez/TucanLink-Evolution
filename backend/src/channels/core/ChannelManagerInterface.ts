import { ChannelType } from "../models/Channel";
import { ConnectionStatus } from "../models/ChannelConnection";

export interface ChannelCapabilities {
  text: boolean;
  media: boolean;
  buttons: boolean;
  lists: boolean;
  templates: boolean;
  location: boolean;
  contacts: boolean;
  reactions: boolean;
  typing: boolean;
  read_receipts: boolean;
}

export interface RateLimit {
  messagesPerSecond: number;
  messagesPerMinute?: number;
  messagesPerHour?: number;
  messagesPerDay?: number;
  burstSize?: number;
}

export interface ChannelConfiguration {
  webhookUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retryAttempts?: number;
  encryption?: boolean;
  [key: string]: any;
}

export interface ConnectionInfo {
  id: number;
  name: string;
  type: ChannelType;
  status: ConnectionStatus;
  companyId: number;
  configuration: ChannelConfiguration;
  capabilities: ChannelCapabilities;
  rateLimit: RateLimit;
  metadata?: Record<string, any>;
}

export interface MessagePayload {
  to: string;
  from?: string;
  type: "text" | "media" | "template" | "interactive" | "location";
  content: any;
  metadata?: Record<string, any>;
}

export interface MessageResult {
  id: string;
  externalId?: string;
  status: "sent" | "failed";
  error?: string;
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  eventType: string;
  data: any;
  signature?: string;
  timestamp: Date;
  source: string;
}

export interface ChannelProvider {
  /**
   * Initialize the channel provider
   */
  initialize(connection: ConnectionInfo): Promise<void>;

  /**
   * Connect to the channel service
   */
  connect(): Promise<ConnectionStatus>;

  /**
   * Disconnect from the channel service
   */
  disconnect(): Promise<void>;

  /**
   * Send a message through the channel
   */
  sendMessage(payload: MessagePayload): Promise<MessageResult>;

  /**
   * Process incoming webhook
   */
  processWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus;

  /**
   * Get channel capabilities
   */
  getCapabilities(): ChannelCapabilities;

  /**
   * Validate message payload
   */
  validateMessage(payload: MessagePayload): boolean;

  /**
   * Handle authentication (for channels that require it)
   */
  authenticate?(credentials: Record<string, any>): Promise<boolean>;

  /**
   * Get QR code (for QR-based authentication)
   */
  getQRCode?(): Promise<string>;

  /**
   * Handle reconnection logic
   */
  reconnect?(): Promise<ConnectionStatus>;
}

export interface ChannelManagerInterface {
  /**
   * Register a new channel provider
   */
  registerProvider(type: ChannelType, provider: ChannelProvider): void;

  /**
   * Create a new channel connection
   */
  createConnection(
    companyId: number,
    type: ChannelType,
    name: string,
    configuration: ChannelConfiguration
  ): Promise<ConnectionInfo>;

  /**
   * Get connection by ID
   */
  getConnection(connectionId: number): Promise<ConnectionInfo | null>;

  /**
   * List connections for a company
   */
  listConnections(companyId: number, type?: ChannelType): Promise<ConnectionInfo[]>;

  /**
   * Update connection configuration
   */
  updateConnection(
    connectionId: number, 
    configuration: Partial<ChannelConfiguration>
  ): Promise<ConnectionInfo>;

  /**
   * Delete connection
   */
  deleteConnection(connectionId: number): Promise<void>;

  /**
   * Connect a channel
   */
  connectChannel(connectionId: number): Promise<ConnectionStatus>;

  /**
   * Disconnect a channel
   */
  disconnectChannel(connectionId: number): Promise<void>;

  /**
   * Send message through specific connection
   */
  sendMessage(connectionId: number, payload: MessagePayload): Promise<MessageResult>;

  /**
   * Process incoming webhook
   */
  processWebhook(connectionId: number, payload: WebhookPayload): Promise<void>;

  /**
   * Get connection status
   */
  getConnectionStatus(connectionId: number): Promise<ConnectionStatus>;

  /**
   * Get all active connections
   */
  getActiveConnections(companyId?: number): Promise<ConnectionInfo[]>;
}

export default ChannelManagerInterface;