-- =========================================
-- CORRECCIÓN COMPLETA DE DIFERENCIAS ENTRE BD LOCAL Y SUPABASE
-- Fecha: 2025-08-12
-- =========================================

-- 1. AGREGAR COLUMNAS FALTANTES EN SUPABASE
-- =========================================

ALTER TABLE public."BaileysChats" ADD COLUMN IF NOT EXISTS "unreadCount" integer DEFAULT 0;
ALTER TABLE public."BaileysMessages" ADD COLUMN IF NOT EXISTS "baileysChatId" integer;
ALTER TABLE public."BaileysMessages" ADD COLUMN IF NOT EXISTS "jsonMessage" json;
ALTER TABLE public."FlowAudios" ADD COLUMN IF NOT EXISTS "userId" integer;
ALTER TABLE public."FlowBuilders" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE public."FlowBuilders" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
ALTER TABLE public."FlowBuilders" ADD COLUMN IF NOT EXISTS "company_id" integer DEFAULT 0;
ALTER TABLE public."FlowCampaigns" ADD COLUMN IF NOT EXISTS "userId" integer;
ALTER TABLE public."FlowDefaults" ADD COLUMN IF NOT EXISTS "userId" integer;
ALTER TABLE public."FlowImgs" ADD COLUMN IF NOT EXISTS "userId" integer;
ALTER TABLE public."Messages" ADD COLUMN IF NOT EXISTS "queueId" integer;
ALTER TABLE public."Messages" ADD COLUMN IF NOT EXISTS "isEdited" boolean DEFAULT false;
ALTER TABLE public."Subscriptions" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp with time zone;
ALTER TABLE public."TicketNotes" ADD COLUMN IF NOT EXISTS "contactId" integer;
ALTER TABLE public."TicketTraking" ADD COLUMN IF NOT EXISTS "chatbotAt" timestamp with time zone;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "resetPassword" character varying(255);
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "user_id" integer;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "hash_id" character varying(255);
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "config" json;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "requestMonth" integer DEFAULT 0;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "requestAll" integer DEFAULT 0;
ALTER TABLE public."Whatsapps" ADD COLUMN IF NOT EXISTS "integrationId" integer;
ALTER TABLE public."Whatsapps" ADD COLUMN IF NOT EXISTS "transferQueueId" integer;
ALTER TABLE public."Whatsapps" ADD COLUMN IF NOT EXISTS "timeToTransfer" integer;

-- 2. ELIMINAR COLUMNAS QUE NO ESTÁN EN LOCAL
-- =========================================

-- BaileysMessages
ALTER TABLE public."BaileysMessages" DROP COLUMN IF EXISTS "jid";
ALTER TABLE public."BaileysMessages" DROP COLUMN IF EXISTS "messageId";
ALTER TABLE public."BaileysMessages" DROP COLUMN IF EXISTS "content";

-- CampaignSettings
ALTER TABLE public."CampaignSettings" DROP COLUMN IF EXISTS "campaignId";

-- CampaignShipping  
ALTER TABLE public."CampaignShipping" DROP COLUMN IF EXISTS "confirmationMessage";
ALTER TABLE public."CampaignShipping" DROP COLUMN IF EXISTS "confirmation";
ALTER TABLE public."CampaignShipping" DROP COLUMN IF EXISTS "confirmationRequestedAt";
ALTER TABLE public."CampaignShipping" DROP COLUMN IF EXISTS "confirmedAt";
ALTER TABLE public."CampaignShipping" DROP COLUMN IF EXISTS "companyId";
ALTER TABLE public."CampaignShipping" DROP COLUMN IF EXISTS "ticketId";

-- Campaigns
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "confirmationMessage1";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "confirmationMessage2";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "confirmationMessage3";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "confirmationMessage4";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "confirmationMessage5";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "confirmation";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "delay";
ALTER TABLE public."Campaigns" DROP COLUMN IF EXISTS "openTicket";

-- 3. CORREGIR TIPOS DE DATOS
-- =========================================

-- Announcements
ALTER TABLE public."Announcements" ALTER COLUMN "mediaPath" TYPE text USING "mediaPath"::text;
ALTER TABLE public."Announcements" ALTER COLUMN "mediaName" TYPE text USING "mediaName"::text;

-- Baileys
ALTER TABLE public."Baileys" ALTER COLUMN contacts TYPE text USING contacts::text;
ALTER TABLE public."Baileys" ALTER COLUMN chats TYPE text USING chats::text;

-- BaileysChats
ALTER TABLE public."BaileysChats" ALTER COLUMN "conversationTimestamp" TYPE character varying(255) USING "conversationTimestamp"::character varying(255);

-- Campaigns
ALTER TABLE public."Campaigns" ALTER COLUMN "mediaPath" TYPE text USING "mediaPath"::text;
ALTER TABLE public."Campaigns" ALTER COLUMN "mediaName" TYPE text USING "mediaName"::text;

-- ChatMessages
ALTER TABLE public."ChatMessages" ALTER COLUMN "mediaPath" TYPE text USING "mediaPath"::text;
ALTER TABLE public."ChatMessages" ALTER COLUMN "mediaName" TYPE text USING "mediaName"::text;

-- Chats
ALTER TABLE public."Chats" ALTER COLUMN title TYPE text USING title::text;
ALTER TABLE public."Chats" ALTER COLUMN "lastMessage" TYPE text USING "lastMessage"::text;

-- FilesOptions
ALTER TABLE public."FilesOptions" ALTER COLUMN path TYPE character varying(255) USING path::character varying(255);

-- FlowBuilders
ALTER TABLE public."FlowBuilders" ALTER COLUMN flow TYPE json USING flow::json;
ALTER TABLE public."FlowBuilders" ALTER COLUMN variables TYPE json USING variables::json;

-- FlowCampaigns
ALTER TABLE public."FlowCampaigns" ALTER COLUMN status TYPE boolean USING (status = 'active');

-- Messages
ALTER TABLE public."Messages" ALTER COLUMN "remoteJid" TYPE text USING "remoteJid"::text;
ALTER TABLE public."Messages" ALTER COLUMN participant TYPE text USING participant::text;

-- Prompts
ALTER TABLE public."Prompts" ALTER COLUMN name TYPE text USING name::text;
ALTER TABLE public."Prompts" ALTER COLUMN "apiKey" TYPE text USING "apiKey"::text;
ALTER TABLE public."Prompts" ALTER COLUMN temperature TYPE double precision USING temperature::double precision;

-- QueueOptions
ALTER TABLE public."QueueOptions" ALTER COLUMN option TYPE text USING option::text;

-- Tickets
ALTER TABLE public."Tickets" ALTER COLUMN "promptId" TYPE character varying(255) USING "promptId"::character varying(255);
ALTER TABLE public."Tickets" ALTER COLUMN "dataWebhook" TYPE json USING "dataWebhook"::json;

-- Whatsapps
ALTER TABLE public."Whatsapps" ALTER COLUMN token TYPE text USING token::text;
ALTER TABLE public."Whatsapps" ALTER COLUMN provider TYPE text USING provider::text;

-- 4. CORREGIR RESTRICCIONES NULL/NOT NULL
-- =========================================

-- BaileysChats
ALTER TABLE public."BaileysChats" ALTER COLUMN "whatsappId" DROP NOT NULL;
ALTER TABLE public."BaileysChats" ALTER COLUMN "conversationTimestamp" SET NOT NULL;

-- BaileysMessages
ALTER TABLE public."BaileysMessages" ALTER COLUMN "whatsappId" DROP NOT NULL;
ALTER TABLE public."BaileysMessages" ALTER COLUMN "jsonMessage" DROP NOT NULL;

-- CampaignShipping
ALTER TABLE public."CampaignShipping" ALTER COLUMN number SET NOT NULL;
ALTER TABLE public."CampaignShipping" ALTER COLUMN message SET NOT NULL;

-- Campaigns
ALTER TABLE public."Campaigns" ALTER COLUMN "companyId" SET NOT NULL;

-- Chats
ALTER TABLE public."Chats" ALTER COLUMN "companyId" SET NOT NULL;

-- Contacts
ALTER TABLE public."Contacts" ALTER COLUMN "isGroup" SET NOT NULL;
ALTER TABLE public."Contacts" ALTER COLUMN "disableBot" SET NOT NULL;

-- Files
ALTER TABLE public."Files" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE public."Files" ALTER COLUMN message SET NOT NULL;

-- FilesOptions
ALTER TABLE public."FilesOptions" ALTER COLUMN path SET NOT NULL;

-- FlowAudios
ALTER TABLE public."FlowAudios" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE public."FlowAudios" ALTER COLUMN "userId" DROP NOT NULL;

-- FlowBuilders
ALTER TABLE public."FlowBuilders" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE public."FlowBuilders" ALTER COLUMN "company_id" DROP NOT NULL;

-- FlowCampaigns
ALTER TABLE public."FlowCampaigns" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE public."FlowCampaigns" ALTER COLUMN status SET NOT NULL;
ALTER TABLE public."FlowCampaigns" ALTER COLUMN "whatsappId" DROP NOT NULL;
ALTER TABLE public."FlowCampaigns" ALTER COLUMN "userId" DROP NOT NULL;

-- FlowDefaults
ALTER TABLE public."FlowDefaults" ALTER COLUMN "userId" DROP NOT NULL;

-- FlowImgs
ALTER TABLE public."FlowImgs" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE public."FlowImgs" ALTER COLUMN "userId" DROP NOT NULL;

-- Messages
ALTER TABLE public."Messages" ALTER COLUMN body SET NOT NULL;
ALTER TABLE public."Messages" ALTER COLUMN ack SET NOT NULL;
ALTER TABLE public."Messages" ALTER COLUMN read SET NOT NULL;
ALTER TABLE public."Messages" ALTER COLUMN "fromMe" SET NOT NULL;
ALTER TABLE public."Messages" ALTER COLUMN "isDeleted" SET NOT NULL;
ALTER TABLE public."Messages" ALTER COLUMN "isEdited" DROP NOT NULL;

-- Prompts
ALTER TABLE public."Prompts" ALTER COLUMN "maxMessages" SET NOT NULL;
ALTER TABLE public."Prompts" ALTER COLUMN temperature DROP NOT NULL;
ALTER TABLE public."Prompts" ALTER COLUMN "promptTokens" SET NOT NULL;
ALTER TABLE public."Prompts" ALTER COLUMN "completionTokens" SET NOT NULL;
ALTER TABLE public."Prompts" ALTER COLUMN "totalTokens" SET NOT NULL;
ALTER TABLE public."Prompts" ALTER COLUMN "companyId" SET NOT NULL;

-- QueueIntegrations
ALTER TABLE public."QueueIntegrations" ALTER COLUMN "jsonContent" SET NOT NULL;
ALTER TABLE public."QueueIntegrations" ALTER COLUMN language SET NOT NULL;

-- QueueOptions
ALTER TABLE public."QueueOptions" ALTER COLUMN option DROP NOT NULL;
ALTER TABLE public."QueueOptions" ALTER COLUMN "queueId" DROP NOT NULL;

-- QuickMessages
ALTER TABLE public."QuickMessages" ALTER COLUMN message DROP NOT NULL;

-- Schedules
ALTER TABLE public."Schedules" ALTER COLUMN body SET NOT NULL;

-- Settings
ALTER TABLE public."Settings" ALTER COLUMN value SET NOT NULL;
ALTER TABLE public."Settings" ALTER COLUMN "companyId" DROP NOT NULL;

-- Subscriptions
ALTER TABLE public."Subscriptions" ALTER COLUMN "providerSubscriptionId" SET NOT NULL;
ALTER TABLE public."Subscriptions" ALTER COLUMN "expiresAt" DROP NOT NULL;

-- Tags
ALTER TABLE public."Tags" ALTER COLUMN "companyId" SET NOT NULL;

-- TicketNotes
ALTER TABLE public."TicketNotes" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE public."TicketNotes" ALTER COLUMN "ticketId" DROP NOT NULL;
ALTER TABLE public."TicketNotes" ALTER COLUMN "contactId" DROP NOT NULL;

-- TicketTraking
ALTER TABLE public."TicketTraking" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE public."TicketTraking" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- Tickets
ALTER TABLE public."Tickets" ALTER COLUMN "flowWebhook" SET NOT NULL;

-- UserRatings
ALTER TABLE public."UserRatings" ALTER COLUMN "ticketId" DROP NOT NULL;
ALTER TABLE public."UserRatings" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE public."UserRatings" ALTER COLUMN "createdAt" DROP NOT NULL;
ALTER TABLE public."UserRatings" ALTER COLUMN "updatedAt" DROP NOT NULL;

-- Users
ALTER TABLE public."Users" ALTER COLUMN profile SET NOT NULL;
ALTER TABLE public."Users" ALTER COLUMN "tokenVersion" SET NOT NULL;
ALTER TABLE public."Users" ALTER COLUMN "allTicket" SET NOT NULL;

-- Whatsapps
ALTER TABLE public."Whatsapps" ALTER COLUMN "isDefault" SET NOT NULL;
ALTER TABLE public."Whatsapps" ALTER COLUMN retries SET NOT NULL;
ALTER TABLE public."Whatsapps" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE public."Whatsapps" ALTER COLUMN "hash_id" DROP NOT NULL;

-- 5. ELIMINAR COLUMNAS EXTRAS EN SUPABASE QUE NO DEBEN EXISTIR
-- =========================================

-- Contacts (estas columnas no están en el modelo local)
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "acceptAudioMessage";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "active";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "channel";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "lastMessageAt";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "pushname";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "presence";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "presenceUpdatedAt";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "remoteJid";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "urlPicture";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "pictureUpdatedAt";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "lgpdAcceptedAt";
ALTER TABLE public."Contacts" DROP COLUMN IF EXISTS "pictureUrl";

-- FlowAudios
ALTER TABLE public."FlowAudios" DROP COLUMN IF EXISTS "url";

-- FlowBuilders
ALTER TABLE public."FlowBuilders" DROP COLUMN IF EXISTS "companyId";
ALTER TABLE public."FlowBuilders" DROP COLUMN IF EXISTS "status";

-- FlowImgs
ALTER TABLE public."FlowImgs" DROP COLUMN IF EXISTS "url";

-- Users
ALTER TABLE public."Users" DROP COLUMN IF EXISTS "startWork";
ALTER TABLE public."Users" DROP COLUMN IF EXISTS "endWork";
ALTER TABLE public."Users" DROP COLUMN IF EXISTS "locale";
ALTER TABLE public."Users" DROP COLUMN IF EXISTS "resetPasswordToken";
ALTER TABLE public."Users" DROP COLUMN IF EXISTS "resetPasswordExpires";

-- Webhooks
ALTER TABLE public."Webhooks" DROP COLUMN IF EXISTS "url";
ALTER TABLE public."Webhooks" DROP COLUMN IF EXISTS "events";
ALTER TABLE public."Webhooks" DROP COLUMN IF EXISTS "companyId";

-- =========================================
-- FIN DE CORRECCIONES
-- =========================================