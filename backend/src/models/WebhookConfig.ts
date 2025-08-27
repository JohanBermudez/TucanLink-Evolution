import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  DataType,
  Default
} from "sequelize-typescript";

import Company from "./Company";
import QueueIntegration from "./QueueIntegrations";

@Table
class WebhookConfig extends Model<WebhookConfig> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => QueueIntegration)
  @Column
  integrationId: number;

  @BelongsTo(() => QueueIntegration)
  integration: QueueIntegration;

  @Column
  webhookUrl: string;

  @Default(true)
  @Column
  isActive: boolean;

  @Default(true)
  @Column
  sendNewMessages: boolean;

  @Default(false)
  @Column
  sendWithoutQueue: boolean;

  @Default(true)
  @Column
  sendWithQueue: boolean;

  @Default(false)
  @Column
  sendWithAssignedUser: boolean;

  @Default(true)
  @Column
  sendMediaMessages: boolean;

  @Default([])
  @Column(DataType.ARRAY(DataType.INTEGER))
  sendOnlyFromQueues: number[];

  @Default([])
  @Column(DataType.ARRAY(DataType.INTEGER))
  sendOnlyFromWhatsapps: number[];

  @Default(false)
  @Column
  requireChatbot: boolean;

  @Default(false)
  @Column
  requireIntegration: boolean;

  @Default({})
  @Column(DataType.JSON)
  customHeaders: object;

  @Default("none")
  @Column(DataType.ENUM("none", "bearer", "basic", "apikey"))
  authType: string;

  @Column
  authToken: string;

  @Default(3)
  @Column
  retryAttempts: number;

  @Default(1000)
  @Column
  retryDelay: number;

  @Default(30000)
  @Column
  timeout: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default WebhookConfig;