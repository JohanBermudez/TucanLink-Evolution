import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Company from "../../models/Company";
import Message from "../../models/Message";
import ChannelConnection from "./ChannelConnection";
import { ChannelType } from "./Channel";

export enum MessageDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND"
}

export enum MessageStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
  EXPIRED = "EXPIRED"
}

export enum ProcessingStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

@Table({ tableName: "ChannelMessages" })
class ChannelMessage extends Model<ChannelMessage> {
  @PrimaryKey
  @Column(DataType.STRING)
  id: string;

  @ForeignKey(() => ChannelConnection)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  channelConnectionId: number;

  @BelongsTo(() => ChannelConnection)
  channelConnection: ChannelConnection;

  @ForeignKey(() => Message)
  @AllowNull(false)
  @Column(DataType.STRING)
  messageId: string;

  @BelongsTo(() => Message)
  message: Message;

  @Column(DataType.STRING)
  externalId: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(ChannelType)))
  channelType: ChannelType;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(MessageDirection)))
  direction: MessageDirection;

  @Default(MessageStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(MessageStatus)))
  status: MessageStatus;

  @Column(DataType.JSON)
  channelData: object;

  @Column(DataType.JSON)
  deliveryStatus: object;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(ProcessingStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ProcessingStatus)))
  processingStatus: ProcessingStatus;

  @Column(DataType.TEXT)
  errorDetails: string;

  @Default(0)
  @Column(DataType.INTEGER)
  retryCount: number;

  @Column(DataType.DATE)
  scheduledAt: Date;

  @Column(DataType.DATE)
  deliveredAt: Date;

  @Column(DataType.DATE)
  readAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ChannelMessage;