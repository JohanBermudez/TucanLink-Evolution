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
  HasMany,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Company from "../../models/Company";
import ChannelConnection from "./ChannelConnection";

export enum ChannelType {
  WHATSAPP_BAILEYS = "whatsapp_baileys",
  WHATSAPP_CLOUD = "whatsapp_cloud",
  INSTAGRAM_DIRECT = "instagram_direct",
  FACEBOOK_MESSENGER = "facebook_messenger",
  TELEGRAM = "telegram",
  EMAIL = "email",
  SMS = "sms",
  CUSTOM = "custom"
}

export enum ChannelStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE", 
  MAINTENANCE = "MAINTENANCE"
}

@Table({ tableName: "Channels" })
class Channel extends Model<Channel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(ChannelType)))
  type: ChannelType;

  @AllowNull(false)
  @Column(DataType.STRING)
  provider: string;

  @Column(DataType.STRING)
  version: string;

  @Default(ChannelStatus.ACTIVE)
  @Column(DataType.ENUM(...Object.values(ChannelStatus)))
  status: ChannelStatus;

  @Column(DataType.JSON)
  capabilities: object;

  @Column(DataType.JSON)
  rateLimit: object;

  @ForeignKey(() => Company)
  @Column(DataType.INTEGER)
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default(false)
  @Column(DataType.BOOLEAN)
  isDefault: boolean;

  @Column(DataType.JSON)
  configuration: object;

  @Column(DataType.JSON)
  metadata: object;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => ChannelConnection)
  connections: ChannelConnection[];
}

export default Channel;