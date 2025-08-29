import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("ChannelWebhooks", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      channelConnectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "ChannelConnections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Tipo de evento del webhook (message, status, etc.)"
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Payload completo del webhook"
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      processingStatus: {
        type: DataTypes.ENUM,
        values: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
        defaultValue: "PENDING",
        allowNull: false
      },
      resultData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Datos del resultado del procesamiento"
      },
      errorDetails: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      signature: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Firma de verificación del webhook"
      },
      sourceIp: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "IP origen del webhook"
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
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
    return queryInterface.dropTable("ChannelWebhooks");
  }
};