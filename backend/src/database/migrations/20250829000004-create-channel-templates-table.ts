import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("ChannelTemplates", {
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
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Nombre de la plantilla"
      },
      externalId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "ID de la plantilla en la plataforma externa"
      },
      category: {
        type: DataTypes.ENUM,
        values: ["MARKETING", "UTILITY", "AUTHENTICATION"],
        allowNull: false
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Código de idioma (es_MX, en_US, etc.)"
      },
      status: {
        type: DataTypes.ENUM,
        values: ["PENDING", "APPROVED", "REJECTED", "PAUSED", "DISABLED"],
        defaultValue: "PENDING",
        allowNull: false
      },
      structure: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Estructura de la plantilla (header, body, footer, buttons)"
      },
      components: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Componentes de la plantilla"
      },
      parameters: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Parámetros requeridos"
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      qualityRating: {
        type: DataTypes.ENUM,
        values: ["GREEN", "YELLOW", "RED", "UNKNOWN"],
        allowNull: true
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
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
    return queryInterface.dropTable("ChannelTemplates");
  }
};