import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany
} from "sequelize-typescript";
import Company from "../../models/Company";
import Channel from "./Channel";
import ChannelMessage from "./ChannelMessage";
import ChannelTemplate from "./ChannelTemplate";
import ChannelWebhook from "./ChannelWebhook";

export enum ConnectionStatus {
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED", 
  QRCODE = "QRCODE",
  TIMEOUT = "TIMEOUT",
  ERROR = "ERROR"
}

@Table({ tableName: "ChannelConnections" })
class ChannelConnection extends Model<ChannelConnection> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Channel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  channelId: number;

  @BelongsTo(() => Channel)
  channel: Channel;

  @AllowNull(false)
  @Column(DataType.STRING)
  connectionName: string;

  @Default(ConnectionStatus.DISCONNECTED)
  @Column(DataType.ENUM(...Object.values(ConnectionStatus)))
  status: ConnectionStatus;

  @Column(DataType.JSON)
  connectionData: object;

  @Column(DataType.TEXT)
  authData: string;

  @Column(DataType.TEXT)
  qrCode: string;

  @Column(DataType.STRING)
  phoneNumber: string;

  @Column(DataType.STRING)
  businessAccountId: string;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDefault: boolean;

  @Column(DataType.DATE)
  lastActivity: Date;

  @Default(0)
  @Column(DataType.INTEGER)
  errorCount: number;

  @Column(DataType.TEXT)
  lastError: string;

  @Column(DataType.STRING)
  webhookUrl: string;

  @Column(DataType.STRING)
  webhookToken: string;

  @Column(DataType.JSON)
  configuration: object;

  @Column(DataType.JSON)
  metadata: object;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => ChannelMessage)
  messages: ChannelMessage[];

  @HasMany(() => ChannelTemplate)
  templates: ChannelTemplate[];

  @HasMany(() => ChannelWebhook)
  webhooks: ChannelWebhook[];
}

export default ChannelConnection;