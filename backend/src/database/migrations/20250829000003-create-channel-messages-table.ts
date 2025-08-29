import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("ChannelMessages", {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        comment: "ID único del mensaje (compatible con Message existente)"
      },
      channelConnectionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "ChannelConnections", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      messageId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: "Messages", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        comment: "Referencia al mensaje en la tabla Messages existente"
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "ID externo del mensaje en la plataforma (WhatsApp, Instagram, etc.)"
      },
      channelType: {
        type: DataTypes.ENUM,
        values: [
          "whatsapp_baileys",
          "whatsapp_cloud", 
          "instagram_direct",
          "facebook_messenger",
          "telegram",
          "email",
          "sms",
          "custom"
        ],
        allowNull: false
      },
      direction: {
        type: DataTypes.ENUM,
        values: ["INBOUND", "OUTBOUND"],
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM,
        values: [
          "PENDING",
          "SENT", 
          "DELIVERED",
          "READ",
          "FAILED",
          "EXPIRED"
        ],
        defaultValue: "PENDING",
        allowNull: false
      },
      channelData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Datos específicos del canal (metadata, attachments, etc.)"
      },
      deliveryStatus: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Estado de entrega detallado"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      processingStatus: {
        type: DataTypes.ENUM,
        values: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
        defaultValue: "PENDING",
        allowNull: false
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
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Para mensajes programados"
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      readAt: {
        type: DataTypes.DATE,
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
    return queryInterface.dropTable("ChannelMessages");
  }
};