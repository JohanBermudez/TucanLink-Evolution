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
  BelongsTo
} from "sequelize-typescript";
import Company from "../../models/Company";
import ChannelConnection from "./ChannelConnection";
import { ProcessingStatus } from "./ChannelMessage";

@Table({ tableName: "ChannelWebhooks" })
class ChannelWebhook extends Model<ChannelWebhook> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => ChannelConnection)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  channelConnectionId: number;

  @BelongsTo(() => ChannelConnection)
  channelConnection: ChannelConnection;

  @AllowNull(false)
  @Column(DataType.STRING)
  eventType: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  payload: object;

  @Column(DataType.DATE)
  processedAt: Date;

  @Default(ProcessingStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(ProcessingStatus)))
  processingStatus: ProcessingStatus;

  @Column(DataType.JSON)
  resultData: object;

  @Column(DataType.TEXT)
  errorDetails: string;

  @Default(0)
  @Column(DataType.INTEGER)
  retryCount: number;

  @Column(DataType.STRING)
  signature: string;

  @Column(DataType.STRING)
  sourceIp: string;

  @Column(DataType.TEXT)
  userAgent: string;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Column(DataType.JSON)
  metadata: object;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ChannelWebhook;