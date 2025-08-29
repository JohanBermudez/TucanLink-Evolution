import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('ApiKeyUsage', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      apiKeyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'ApiKeys',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'api_key_id',
      },
      endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      method: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      statusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'status_code',
      },
      responseTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'response_time_ms',
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent',
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message',
      },
      requestBody: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'request_body',
      },
      responseSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'response_size',
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('ApiKeyUsage', ['api_key_id'], {
      name: 'idx_api_key_usage_key',
    });

    await queryInterface.addIndex('ApiKeyUsage', ['timestamp'], {
      name: 'idx_api_key_usage_timestamp',
    });

    await queryInterface.addIndex('ApiKeyUsage', ['endpoint', 'method'], {
      name: 'idx_api_key_usage_endpoint_method',
    });

    await queryInterface.addIndex('ApiKeyUsage', ['status_code'], {
      name: 'idx_api_key_usage_status',
    });

    // Composite index for analytics queries
    await queryInterface.addIndex('ApiKeyUsage', ['api_key_id', 'timestamp', 'status_code'], {
      name: 'idx_api_key_usage_analytics',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex('ApiKeyUsage', 'idx_api_key_usage_analytics');
    await queryInterface.removeIndex('ApiKeyUsage', 'idx_api_key_usage_status');
    await queryInterface.removeIndex('ApiKeyUsage', 'idx_api_key_usage_endpoint_method');
    await queryInterface.removeIndex('ApiKeyUsage', 'idx_api_key_usage_timestamp');
    await queryInterface.removeIndex('ApiKeyUsage', 'idx_api_key_usage_key');
    await queryInterface.dropTable('ApiKeyUsage');
  },
};