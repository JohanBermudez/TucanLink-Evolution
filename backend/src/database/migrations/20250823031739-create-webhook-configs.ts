import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("WebhookConfigs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      integrationId: {
        type: DataTypes.INTEGER,
        references: { model: "QueueIntegrations", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      webhookUrl: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sendNewMessages: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sendWithoutQueue: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      sendWithQueue: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sendWithAssignedUser: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      sendMediaMessages: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      sendOnlyFromQueues: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [],
        allowNull: false
      },
      sendOnlyFromWhatsapps: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [],
        allowNull: false
      },
      requireChatbot: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      requireIntegration: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      customHeaders: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true
      },
      authType: {
        type: DataTypes.ENUM("none", "bearer", "basic", "apikey"),
        defaultValue: "none",
        allowNull: false
      },
      authToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      retryAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        allowNull: false
      },
      retryDelay: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        allowNull: false
      },
      timeout: {
        type: DataTypes.INTEGER,
        defaultValue: 30000,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("WebhookConfigs");
  }
};