import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('ApiKeys', {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      keyPrefix: {
        type: DataTypes.STRING(10),
        allowNull: false,
        field: 'key_prefix',
      },
      hashedKey: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        field: 'hashed_key',
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'company_id',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      permissions: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: false,
      },
      rateLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        allowNull: false,
        field: 'rate_limit',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_used_at',
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'is_active',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'created_by',
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true,
      },
    });

    // Create indexes for performance
    await queryInterface.addIndex('ApiKeys', ['company_id'], {
      name: 'idx_api_keys_company',
    });

    await queryInterface.addIndex('ApiKeys', ['is_active'], {
      name: 'idx_api_keys_active',
    });

    await queryInterface.addIndex('ApiKeys', ['key_prefix'], {
      name: 'idx_api_keys_prefix',
    });

    await queryInterface.addIndex('ApiKeys', ['hashed_key'], {
      name: 'idx_api_keys_hashed',
      unique: true,
    });

    await queryInterface.addIndex('ApiKeys', ['expires_at'], {
      name: 'idx_api_keys_expires',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex('ApiKeys', 'idx_api_keys_expires');
    await queryInterface.removeIndex('ApiKeys', 'idx_api_keys_hashed');
    await queryInterface.removeIndex('ApiKeys', 'idx_api_keys_prefix');
    await queryInterface.removeIndex('ApiKeys', 'idx_api_keys_active');
    await queryInterface.removeIndex('ApiKeys', 'idx_api_keys_company');
    await queryInterface.dropTable('ApiKeys');
  },
};