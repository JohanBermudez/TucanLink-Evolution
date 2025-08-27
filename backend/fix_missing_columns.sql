-- SQL para agregar columnas faltantes en Supabase

ALTER TABLE public."BaileysChats" ADD COLUMN IF NOT EXISTS "unreadCount" integer DEFAULT 0;
ALTER TABLE public."BaileysMessages" ADD COLUMN IF NOT EXISTS "baileysChatId" integer;
ALTER TABLE public."BaileysMessages" ADD COLUMN IF NOT EXISTS "jsonMessage" json NOT NULL;
ALTER TABLE public."FlowAudios" ADD COLUMN IF NOT EXISTS "userId" integer NOT NULL;
ALTER TABLE public."FlowBuilders" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL;
ALTER TABLE public."FlowBuilders" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
ALTER TABLE public."FlowBuilders" ADD COLUMN IF NOT EXISTS "company_id" integer DEFAULT 0 NOT NULL;
ALTER TABLE public."FlowCampaigns" ADD COLUMN IF NOT EXISTS "userId" integer NOT NULL;
ALTER TABLE public."FlowDefaults" ADD COLUMN IF NOT EXISTS "userId" integer NOT NULL;
ALTER TABLE public."FlowImgs" ADD COLUMN IF NOT EXISTS "userId" integer NOT NULL;
ALTER TABLE public."Messages" ADD COLUMN IF NOT EXISTS "queueId" integer;
ALTER TABLE public."Messages" ADD COLUMN IF NOT EXISTS "isEdited" boolean DEFAULT false NOT NULL;
ALTER TABLE public."Subscriptions" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp with time zone NOT NULL;
ALTER TABLE public."TicketNotes" ADD COLUMN IF NOT EXISTS "contactId" integer NOT NULL;
ALTER TABLE public."TicketTraking" ADD COLUMN IF NOT EXISTS "chatbotAt" timestamp with time zone;
ALTER TABLE public."Users" ADD COLUMN IF NOT EXISTS "resetPassword" character varying(255);
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "hash_id" character varying(255) NOT NULL;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "config" json;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "requestMonth" integer DEFAULT 0;
ALTER TABLE public."Webhooks" ADD COLUMN IF NOT EXISTS "requestAll" integer DEFAULT 0;
ALTER TABLE public."Whatsapps" ADD COLUMN IF NOT EXISTS "integrationId" integer;
ALTER TABLE public."Whatsapps" ADD COLUMN IF NOT EXISTS "transferQueueId" integer;
ALTER TABLE public."Whatsapps" ADD COLUMN IF NOT EXISTS "timeToTransfer" integer;
