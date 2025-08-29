import { Sequelize } from 'sequelize-typescript';
import { logger } from '../utils/logger';
import path from 'path';

// Import all core models
import Ticket from '../../../../models/Ticket';
import Contact from '../../../../models/Contact';
import User from '../../../../models/User';
import Company from '../../../../models/Company';
import Queue from '../../../../models/Queue';
import Whatsapp from '../../../../models/Whatsapp';
import Message from '../../../../models/Message';
import Tag from '../../../../models/Tag';
import TicketTag from '../../../../models/TicketTag';
import QueueOption from '../../../../models/QueueOption';
import QueueIntegrations from '../../../../models/QueueIntegrations';
import Prompt from '../../../../models/Prompt';
import ContactList from '../../../../models/ContactList';
import ContactListItem from '../../../../models/ContactListItem';
import Campaign from '../../../../models/Campaign';
import CampaignSetting from '../../../../models/CampaignSetting';
import Schedule from '../../../../models/Schedule';
import Setting from '../../../../models/Setting';
import Help from '../../../../models/Help';
import QuickMessage from '../../../../models/QuickMessage';
import Chat from '../../../../models/Chat';
import ChatUser from '../../../../models/ChatUser';
import ChatMessage from '../../../../models/ChatMessage';
import Plan from '../../../../models/Plan';
import Announcement from '../../../../models/Announcement';
import UserQueue from '../../../../models/UserQueue';
import WhatsappQueue from '../../../../models/WhatsappQueue';
import TicketNote from '../../../../models/TicketNote';
import TicketTraking from '../../../../models/TicketTraking';
import UserRating from '../../../../models/UserRating';
import Files from '../../../../models/Files';
import FilesOptions from '../../../../models/FilesOptions';
import Subscriptions from '../../../../models/Subscriptions';
import Invoices from '../../../../models/Invoices';
import CampaignShipping from '../../../../models/CampaignShipping';
import ContactCustomField from '../../../../models/ContactCustomField';
import Baileys from '../../../../models/Baileys';
import BaileysChats from '../../../../models/BaileysChats';
import FlowBuilder from '../../../../models/FlowBuilder';
import FlowImg from '../../../../models/FlowImg';
import FlowAudio from '../../../../models/FlowAudio';
import FlowCampaign from '../../../../models/FlowCampaign';
import FlowDefault from '../../../../models/FlowDefault';
import Webhook from '../../../../models/Webhook';
import WebhookConfig from '../../../../models/WebhookConfig';

class CoreDatabase {
  private static instance: CoreDatabase;
  private sequelize: Sequelize | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): CoreDatabase {
    if (!CoreDatabase.instance) {
      CoreDatabase.instance = new CoreDatabase();
    }
    return CoreDatabase.instance;
  }

  public async connect(): Promise<Sequelize> {
    if (this.sequelize && this.isConnected) {
      return this.sequelize;
    }

    try {
      // Use the core database configuration from environment
      const dbConfig = {
        dialect: process.env.DB_DIALECT as any || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'tucanlink',
        username: process.env.DB_USER || 'tucanlink',
        password: process.env.DB_PASS || '',
        logging: process.env.NODE_ENV === 'development' ? false : false,
        pool: {
          max: 30,
          min: 5,
          acquire: 60000,
          idle: 10000,
        },
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false,
          } : false,
        },
      };

      this.sequelize = new Sequelize(dbConfig);

      // Add all core models to the sequelize instance
      const models = [
        Ticket,
        Contact,
        User,
        Company,
        Queue,
        Whatsapp,
        Message,
        Tag,
        TicketTag,
        QueueOption,
        QueueIntegrations,
        Prompt,
        ContactList,
        ContactListItem,
        Campaign,
        CampaignSetting,
        Schedule,
        Setting,
        Help,
        QuickMessage,
        Chat,
        ChatUser,
        ChatMessage,
        Plan,
        Announcement,
        UserQueue,
        WhatsappQueue,
        TicketNote,
        TicketTraking,
        UserRating,
        Files,
        FilesOptions,
        Subscriptions,
        Invoices,
        CampaignShipping,
        ContactCustomField,
        Baileys,
        BaileysChats,
        FlowBuilder,
        FlowImg,
        FlowAudio,
        FlowCampaign,
        FlowDefault,
        Webhook,
        WebhookConfig,
      ];

      this.sequelize.addModels(models);

      // Test connection
      await this.sequelize.authenticate();
      this.isConnected = true;

      logger.info('Core database connection established successfully');

      return this.sequelize;
    } catch (error) {
      logger.error('Unable to connect to core database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.isConnected = false;
      this.sequelize = null;
      logger.info('Core database connection closed');
    }
  }

  public getSequelize(): Sequelize | null {
    return this.sequelize;
  }

  public isReady(): boolean {
    return this.isConnected && this.sequelize !== null;
  }
}

// Export singleton instance
export const coreDatabase = CoreDatabase.getInstance();

// Initialize core database connection
export async function initializeCoreDatabase(): Promise<void> {
  try {
    await coreDatabase.connect();
  } catch (error) {
    logger.error('Failed to initialize core database:', error);
    throw error; // For core database, we need it to work
  }
}

// Cleanup function
export async function closeCoreDatabase(): Promise<void> {
  await coreDatabase.disconnect();
}