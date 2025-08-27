-- =========================================
-- CORRECCIÓN DE SCHEMA EN SUPABASE
-- =========================================
-- Fecha: 2025-08-12
-- Descripción: Agregar columnas faltantes y corregir nombres
-- =========================================

-- 1. Corregir tabla Tickets
-- Las columnas existen pero con nombres incorrectos (minúsculas)
ALTER TABLE public."Tickets" 
  RENAME COLUMN flowwebhook TO "flowWebhook";
  
ALTER TABLE public."Tickets" 
  RENAME COLUMN datawebhook TO "dataWebhook";
  
ALTER TABLE public."Tickets" 
  RENAME COLUMN statuschatend TO "statusChatEnd";

ALTER TABLE public."Tickets"
  RENAME COLUMN lgpdacceptedat TO "lgpdAcceptedAt";
  
ALTER TABLE public."Tickets"
  RENAME COLUMN lgpdsendmessageat TO "lgpdSendMessageAt";

-- Agregar columnas faltantes en Tickets
ALTER TABLE public."Tickets" 
  ADD COLUMN IF NOT EXISTS "lastFlowId" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "hashFlowId" VARCHAR(255);

-- 2. Corregir tabla Queues
ALTER TABLE public."Queues"
  ADD COLUMN IF NOT EXISTS "outOfHoursMessage" TEXT;

-- 3. Corregir tabla Companies  
ALTER TABLE public."Companies"
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS document,
  DROP COLUMN IF EXISTS hostname;

-- 4. Corregir tabla Whatsapps
ALTER TABLE public."Whatsapps"
  RENAME COLUMN statusimportmessages TO "statusImportMessages";

-- 5. Corregir tabla BaileysChats
ALTER TABLE public."BaileysChats"
  RENAME COLUMN conversationtimestamp TO "conversationTimestamp";

-- 6. Corregir tabla Campaigns
ALTER TABLE public."Campaigns"
  RENAME COLUMN confirmationmessage1 TO "confirmationMessage1";
  
ALTER TABLE public."Campaigns"
  RENAME COLUMN confirmationmessage2 TO "confirmationMessage2";
  
ALTER TABLE public."Campaigns"
  RENAME COLUMN confirmationmessage3 TO "confirmationMessage3";
  
ALTER TABLE public."Campaigns"
  RENAME COLUMN confirmationmessage4 TO "confirmationMessage4";
  
ALTER TABLE public."Campaigns"
  RENAME COLUMN confirmationmessage5 TO "confirmationMessage5";

-- 7. Corregir tabla Contacts
ALTER TABLE public."Contacts"
  RENAME COLUMN lgpdacceptedat TO "lgpdAcceptedAt";

-- 8. Verificar y agregar columnas adicionales que puedan faltar
-- basándose en los errores encontrados

-- Para Users (si falta alguna columna)
ALTER TABLE public."Users"
  ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMPTZ;

-- Para Whatsapps (columnas de Flow)
ALTER TABLE public."Whatsapps"
  ADD COLUMN IF NOT EXISTS "flowIdWelcome" INTEGER,
  ADD COLUMN IF NOT EXISTS "flowIdNotPhrase" INTEGER;

-- Agregar índices si no existen
CREATE INDEX IF NOT EXISTS idx_tickets_flowWebhook ON public."Tickets"("flowWebhook");
CREATE INDEX IF NOT EXISTS idx_tickets_lastFlowId ON public."Tickets"("lastFlowId");
CREATE INDEX IF NOT EXISTS idx_tickets_hashFlowId ON public."Tickets"("hashFlowId");

-- Verificar constraints de foreign keys para las nuevas columnas de flow
ALTER TABLE public."Whatsapps"
  ADD CONSTRAINT fk_whatsapps_flowIdWelcome 
    FOREIGN KEY ("flowIdWelcome") 
    REFERENCES public."FlowBuilders"(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public."Whatsapps"
  ADD CONSTRAINT fk_whatsapps_flowIdNotPhrase
    FOREIGN KEY ("flowIdNotPhrase") 
    REFERENCES public."FlowBuilders"(id) 
    ON UPDATE CASCADE ON DELETE SET NULL;

-- =========================================
-- FIN DE CORRECCIONES
-- =========================================