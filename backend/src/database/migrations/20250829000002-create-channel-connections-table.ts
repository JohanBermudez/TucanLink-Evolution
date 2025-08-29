import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("ChannelConnections", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      channelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Channels", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      connectionName: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Nombre de la conexión específica"
      },
      status: {
        type: DataTypes.ENUM,
        values: [
          "DISCONNECTED",
          "CONNECTING", 
          "CONNECTED",
          "QRCODE",
          "TIMEOUT",
          "ERROR"
        ],
        defaultValue: "DISCONNECTED",
        allowNull: false
      },
      connectionData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Datos específicos de la conexión (tokens, session, etc.)"
      },
      authData: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Datos de autenticación encriptados"
      },
      qrCode: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "QR Code para conexiones que lo requieren"
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Número de teléfono asociado"
      },
      businessAccountId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "ID de cuenta de negocio (WhatsApp Cloud, etc.)"
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
      lastActivity: {
        type: DataTypes.DATE,
        allowNull: true
      },
      errorCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "URL del webhook para este canal"
      },
      webhookToken: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Token de verificación del webhook"
      },
      configuration: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Configuración específica de la conexión"
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
    return queryInterface.dropTable("ChannelConnections");
  }
};