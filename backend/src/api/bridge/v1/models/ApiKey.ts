import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  Unique,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
  Index,
  AllowNull,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

// Placeholder interfaces for foreign key references
// These are not actual models to maintain independence from core
interface Company {
  id: number;
  name?: string;
}

interface User {
  id: number;
  name?: string;
  email?: string;
}

@Table({
  tableName: 'ApiKeys',
  timestamps: true,
  paranoid: false,
})
class ApiKey extends Model {
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING(10),
    field: 'key_prefix',
  })
  keyPrefix!: string;

  @AllowNull(false)
  @Unique
  @Index('idx_api_keys_hashed')
  @Column({
    type: DataType.STRING(255),
    field: 'hashed_key',
  })
  hashedKey!: string;

  @AllowNull(false)
  @Index('idx_api_keys_company')
  @Column({
    type: DataType.INTEGER,
    field: 'company_id',
  })
  companyId!: number;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  name!: string;

  @Default([])
  @Column(DataType.JSON)
  permissions!: string[];

  @Default(1000)
  @Column({
    type: DataType.INTEGER,
    field: 'rate_limit',
  })
  rateLimit!: number;

  @Index('idx_api_keys_expires')
  @Column({
    type: DataType.DATE,
    field: 'expires_at',
    allowNull: true,
  })
  expiresAt?: Date;

  @Column({
    type: DataType.DATE,
    field: 'last_used_at',
    allowNull: true,
  })
  lastUsedAt?: Date;

  @Column({
    type: DataType.DATE,
    field: 'revoked_at',
    allowNull: true,
  })
  revokedAt?: Date;

  @Default(true)
  @Index('idx_api_keys_active')
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_active',
  })
  isActive!: boolean;

  @Column({
    type: DataType.INTEGER,
    field: 'created_by',
    allowNull: true,
  })
  createdBy?: number;

  @Default({})
  @Column(DataType.JSON)
  metadata?: Record<string, any>;

  @CreatedAt
  @Column({
    field: 'created_at',
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    field: 'updated_at',
  })
  updatedAt!: Date;

  // Associations (only internal models)
  @HasMany(() => ApiKeyUsage)
  usage?: ApiKeyUsage[];

  // Instance methods
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  hasPermission(permission: string): boolean {
    if (!this.permissions || this.permissions.length === 0) return false;
    if (this.permissions.includes('*')) return true;
    return this.permissions.includes(permission);
  }

  canBeUsed(): boolean {
    return this.isActive && !this.isExpired() && !this.revokedAt;
  }

  async revoke(): Promise<void> {
    this.isActive = false;
    this.revokedAt = new Date();
    await this.save();
  }

  async updateLastUsed(): Promise<void> {
    this.lastUsedAt = new Date();
    await this.save();
  }

  async updatePermissions(permissions: string[]): Promise<void> {
    this.permissions = permissions;
    await this.save();
  }

  // Static methods
  static async findActiveByPrefix(prefix: string): Promise<ApiKey | null> {
    return this.findOne({
      where: {
        keyPrefix: prefix,
        isActive: true,
        revokedAt: null,
      },
    });
  }

  static async findByCompany(companyId: number): Promise<ApiKey[]> {
    return this.findAll({
      where: {
        companyId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });
  }

  static async cleanExpired(): Promise<number> {
    const result = await this.update(
      { isActive: false },
      {
        where: {
          expiresAt: {
            [Symbol.for('sequelize.operators').lt]: new Date(),
          },
          isActive: true,
        },
      }
    );
    return result[0];
  }

  // Hooks
  @BeforeCreate
  static addKeyPrefix(instance: ApiKey) {
    if (!instance.keyPrefix && instance.hashedKey) {
      // Extract prefix from hashed key if available
      instance.keyPrefix = instance.hashedKey.substring(0, 10);
    }
  }

  @BeforeUpdate
  static preventKeyChange(instance: ApiKey) {
    if (instance.changed('hashedKey')) {
      throw new Error('Cannot change API key hash after creation');
    }
  }
}

@Table({
  tableName: 'ApiKeyUsage',
  timestamps: false,
})
class ApiKeyUsage extends Model {
  @PrimaryKey
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
  })
  id!: number;

  @AllowNull(false)
  @ForeignKey(() => ApiKey)
  @Index('idx_api_key_usage_key')
  @Column({
    type: DataType.UUID,
    field: 'api_key_id',
  })
  apiKeyId!: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  endpoint!: string;

  @AllowNull(false)
  @Column(DataType.STRING(10))
  method!: string;

  @Column({
    type: DataType.INTEGER,
    field: 'status_code',
    allowNull: true,
  })
  statusCode?: number;

  @Column({
    type: DataType.INTEGER,
    field: 'response_time_ms',
    allowNull: true,
  })
  responseTimeMs?: number;

  @Default(DataType.NOW)
  @Index('idx_api_key_usage_timestamp')
  @Column(DataType.DATE)
  timestamp!: Date;

  @Column({
    type: DataType.STRING(45),
    field: 'ip_address',
    allowNull: true,
  })
  ipAddress?: string;

  @Column({
    type: DataType.TEXT,
    field: 'user_agent',
    allowNull: true,
  })
  userAgent?: string;

  @Column({
    type: DataType.TEXT,
    field: 'error_message',
    allowNull: true,
  })
  errorMessage?: string;

  @Column({
    type: DataType.JSON,
    field: 'request_body',
    allowNull: true,
  })
  requestBody?: any;

  @Column({
    type: DataType.INTEGER,
    field: 'response_size',
    allowNull: true,
  })
  responseSize?: number;

  // Associations
  @BelongsTo(() => ApiKey)
  apiKey?: ApiKey;

  // Static methods for analytics
  static async getUsageStats(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const whereClause: any = { apiKeyId };
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp[Symbol.for('sequelize.operators').gte] = startDate;
      }
      if (endDate) {
        whereClause.timestamp[Symbol.for('sequelize.operators').lte] = endDate;
      }
    }

    const usage = await this.findAll({
      where: whereClause,
      attributes: [
        'endpoint',
        'method',
        'statusCode',
        [
          (this.sequelize?.fn('COUNT', this.sequelize.col('*')) as any),
          'count',
        ],
        [
          (this.sequelize?.fn('AVG', this.sequelize.col('response_time_ms')) as any),
          'avgResponseTime',
        ],
      ],
      group: ['endpoint', 'method', 'statusCode'],
    });

    return usage;
  }

  static async recordUsage(data: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode?: number;
    responseTimeMs?: number;
    ipAddress?: string;
    userAgent?: string;
    errorMessage?: string;
    requestBody?: any;
    responseSize?: number;
  }): Promise<ApiKeyUsage> {
    return this.create(data);
  }
}

export { ApiKey, ApiKeyUsage };
export default ApiKey;