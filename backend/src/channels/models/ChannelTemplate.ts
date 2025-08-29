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

export enum TemplateCategory {
  MARKETING = "MARKETING",
  UTILITY = "UTILITY",
  AUTHENTICATION = "AUTHENTICATION"
}

export enum TemplateStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  PAUSED = "PAUSED",
  DISABLED = "DISABLED"
}

export enum QualityRating {
  GREEN = "GREEN",
  YELLOW = "YELLOW", 
  RED = "RED",
  UNKNOWN = "UNKNOWN"
}

@Table({ tableName: "ChannelTemplates" })
class ChannelTemplate extends Model<ChannelTemplate> {
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
  name: string;

  @Column(DataType.STRING)
  externalId: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TemplateCategory)))
  category: TemplateCategory;

  @AllowNull(false)
  @Column(DataType.STRING)
  language: string;

  @Default(TemplateStatus.PENDING)
  @Column(DataType.ENUM(...Object.values(TemplateStatus)))
  status: TemplateStatus;

  @AllowNull(false)
  @Column(DataType.JSON)
  structure: object;

  @Column(DataType.JSON)
  components: object;

  @Column(DataType.JSON)
  parameters: object;

  @ForeignKey(() => Company)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(0)
  @Column(DataType.INTEGER)
  usageCount: number;

  @Column(DataType.DATE)
  lastUsedAt: Date;

  @Column(DataType.ENUM(...Object.values(QualityRating)))
  qualityRating: QualityRating;

  @Column(DataType.TEXT)
  rejectionReason: string;

  @Column(DataType.JSON)
  metadata: object;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ChannelTemplate;