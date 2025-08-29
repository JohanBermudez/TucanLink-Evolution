import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Channels", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Nombre del canal (ej: WhatsApp Cloud, Instagram, etc.)"
      },
      type: {
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
        allowNull: false,
        comment: "Tipo de canal de comunicación"
      },
      provider: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Proveedor del servicio (Meta, Telegram, etc.)"
      },
      version: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Versión de la API utilizada"
      },
      status: {
        type: DataTypes.ENUM,
        values: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
        defaultValue: "ACTIVE",
        allowNull: false
      },
      capabilities: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Capacidades del canal (text, media, buttons, etc.)"
      },
      rateLimit: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Límites de velocidad del canal"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      configuration: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Configuración específica del canal"
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Metadatos adicionales"
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
    return queryInterface.dropTable("Channels");
  }
};