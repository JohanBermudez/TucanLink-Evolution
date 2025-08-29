import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    // Agregar columnas de canal a la tabla Tickets existente
    await queryInterface.addColumn("Tickets", "channelConnectionId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "ChannelConnections", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "Conexión de canal que generó este ticket"
    });

    await queryInterface.addColumn("Tickets", "channelType", {
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
      allowNull: true,
      comment: "Tipo de canal que generó este ticket"
    });

    // Agregar información de canal a la tabla Messages existente  
    await queryInterface.addColumn("Messages", "channelConnectionId", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "ChannelConnections", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "Conexión de canal de este mensaje"
    });

    await queryInterface.addColumn("Messages", "channelType", {
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
      allowNull: true,
      defaultValue: "whatsapp_baileys", // Para mantener compatibilidad con datos existentes
      comment: "Tipo de canal de este mensaje"
    });

    await queryInterface.addColumn("Messages", "externalMessageId", {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID del mensaje en la plataforma externa"
    });

    // Agregar información de canal a la tabla Contacts
    await queryInterface.addColumn("Contacts", "channelData", {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Datos específicos del contacto por canal"
    });

    // Crear índices para optimizar consultas
    await queryInterface.addIndex("Tickets", ["channelConnectionId"]);
    await queryInterface.addIndex("Tickets", ["channelType"]);
    await queryInterface.addIndex("Messages", ["channelConnectionId"]);
    await queryInterface.addIndex("Messages", ["channelType"]);
    await queryInterface.addIndex("Messages", ["externalMessageId"]);
    await queryInterface.addIndex("ChannelConnections", ["companyId", "status"]);
    await queryInterface.addIndex("ChannelMessages", ["channelConnectionId", "status"]);
    await queryInterface.addIndex("ChannelWebhooks", ["processingStatus", "createdAt"]);
  },

  down: async (queryInterface: QueryInterface) => {
    // Remover índices
    await queryInterface.removeIndex("Tickets", ["channelConnectionId"]);
    await queryInterface.removeIndex("Tickets", ["channelType"]);
    await queryInterface.removeIndex("Messages", ["channelConnectionId"]);
    await queryInterface.removeIndex("Messages", ["channelType"]);
    await queryInterface.removeIndex("Messages", ["externalMessageId"]);
    await queryInterface.removeIndex("ChannelConnections", ["companyId", "status"]);
    await queryInterface.removeIndex("ChannelMessages", ["channelConnectionId", "status"]);
    await queryInterface.removeIndex("ChannelWebhooks", ["processingStatus", "createdAt"]);

    // Remover columnas
    await queryInterface.removeColumn("Tickets", "channelConnectionId");
    await queryInterface.removeColumn("Tickets", "channelType");
    await queryInterface.removeColumn("Messages", "channelConnectionId");
    await queryInterface.removeColumn("Messages", "channelType");
    await queryInterface.removeColumn("Messages", "externalMessageId");
    await queryInterface.removeColumn("Contacts", "channelData");
  }
};