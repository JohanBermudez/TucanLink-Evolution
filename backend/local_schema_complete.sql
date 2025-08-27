--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Debian 14.18-1.pgdg120+1)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Announcements" (
    id integer NOT NULL,
    priority integer,
    title character varying(255) NOT NULL,
    text text NOT NULL,
    "mediaPath" text,
    "mediaName" text,
    "companyId" integer NOT NULL,
    status boolean,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: Announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Announcements_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Announcements_id_seq" OWNED BY public."Announcements".id;


--
-- Name: Baileys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Baileys" (
    id integer NOT NULL,
    "whatsappId" integer NOT NULL,
    contacts text,
    chats text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: BaileysChats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BaileysChats" (
    id integer NOT NULL,
    "whatsappId" integer,
    jid character varying(255) NOT NULL,
    "conversationTimestamp" character varying(255) NOT NULL,
    "unreadCount" integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: BaileysChats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BaileysChats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BaileysChats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BaileysChats_id_seq" OWNED BY public."BaileysChats".id;


--
-- Name: BaileysMessages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BaileysMessages" (
    id integer NOT NULL,
    "whatsappId" integer,
    "baileysChatId" integer,
    "jsonMessage" json NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: BaileysMessages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BaileysMessages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BaileysMessages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BaileysMessages_id_seq" OWNED BY public."BaileysMessages".id;


--
-- Name: Baileys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Baileys_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Baileys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Baileys_id_seq" OWNED BY public."Baileys".id;


--
-- Name: CampaignSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CampaignSettings" (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value text,
    "companyId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: CampaignSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CampaignSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CampaignSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CampaignSettings_id_seq" OWNED BY public."CampaignSettings".id;


--
-- Name: CampaignShipping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CampaignShipping" (
    id integer NOT NULL,
    "jobId" character varying(255),
    number character varying(255) NOT NULL,
    message text NOT NULL,
    "contactId" integer,
    "campaignId" integer NOT NULL,
    "deliveredAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: CampaignShipping_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CampaignShipping_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CampaignShipping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CampaignShipping_id_seq" OWNED BY public."CampaignShipping".id;


--
-- Name: Campaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Campaigns" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    message1 text DEFAULT ''::text,
    message2 text DEFAULT ''::text,
    message3 text DEFAULT ''::text,
    message4 text DEFAULT ''::text,
    message5 text DEFAULT ''::text,
    status character varying(255),
    "mediaPath" text,
    "mediaName" text,
    "companyId" integer NOT NULL,
    "contactListId" integer,
    "whatsappId" integer,
    "scheduledAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "fileListId" integer,
    "tagId" integer
);


--
-- Name: Campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Campaigns_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Campaigns_id_seq" OWNED BY public."Campaigns".id;


--
-- Name: ChatMessages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatMessages" (
    id integer NOT NULL,
    "chatId" integer NOT NULL,
    "senderId" integer NOT NULL,
    message text DEFAULT ''::text,
    "mediaPath" text,
    "mediaName" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ChatMessages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ChatMessages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ChatMessages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ChatMessages_id_seq" OWNED BY public."ChatMessages".id;


--
-- Name: ChatUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatUsers" (
    id integer NOT NULL,
    "chatId" integer NOT NULL,
    "userId" integer NOT NULL,
    unreads integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ChatUsers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ChatUsers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ChatUsers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ChatUsers_id_seq" OWNED BY public."ChatUsers".id;


--
-- Name: Chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chats" (
    id integer NOT NULL,
    title text DEFAULT ''::text,
    uuid character varying(255) DEFAULT ''::character varying,
    "ownerId" integer NOT NULL,
    "lastMessage" text,
    "companyId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: Chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Chats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Chats_id_seq" OWNED BY public."Chats".id;


--
-- Name: Companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Companies" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(255),
    email character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "planId" integer,
    status boolean DEFAULT true,
    schedules jsonb DEFAULT '[]'::jsonb,
    "dueDate" timestamp with time zone,
    recurrence character varying(255) DEFAULT ''::character varying,
    language character varying(255) DEFAULT 'pt'::character varying
);


--
-- Name: Companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Companies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Companies_id_seq" OWNED BY public."Companies".id;


--
-- Name: ContactCustomFields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContactCustomFields" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255) NOT NULL,
    "contactId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ContactCustomFields_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ContactCustomFields_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ContactCustomFields_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ContactCustomFields_id_seq" OWNED BY public."ContactCustomFields".id;


--
-- Name: ContactListItems; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContactListItems" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    number character varying(255) NOT NULL,
    email character varying(255),
    "contactListId" integer NOT NULL,
    "isWhatsappValid" boolean DEFAULT false,
    "companyId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ContactListItems_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ContactListItems_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ContactListItems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ContactListItems_id_seq" OWNED BY public."ContactListItems".id;


--
-- Name: ContactLists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContactLists" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "companyId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ContactLists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ContactLists_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ContactLists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ContactLists_id_seq" OWNED BY public."ContactLists".id;


--
-- Name: Contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contacts" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    number character varying(255) NOT NULL,
    "profilePicUrl" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    email character varying(255) DEFAULT ''::character varying NOT NULL,
    "isGroup" boolean DEFAULT false NOT NULL,
    "companyId" integer,
    "whatsappId" integer,
    "disableBot" boolean DEFAULT false NOT NULL
);


--
-- Name: Contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Contacts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Contacts_id_seq" OWNED BY public."Contacts".id;


--
-- Name: Files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Files" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    name character varying(255) NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: FilesOptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FilesOptions" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    path character varying(255) NOT NULL,
    "fileId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "mediaType" character varying(255) DEFAULT ''::character varying
);


--
-- Name: FilesOptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FilesOptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FilesOptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FilesOptions_id_seq" OWNED BY public."FilesOptions".id;


--
-- Name: Files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Files_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Files_id_seq" OWNED BY public."Files".id;


--
-- Name: FlowAudios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FlowAudios" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: FlowAudios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FlowAudios_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FlowAudios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FlowAudios_id_seq" OWNED BY public."FlowAudios".id;


--
-- Name: FlowBuilders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FlowBuilders" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    active boolean DEFAULT true,
    flow json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    company_id integer DEFAULT 0 NOT NULL,
    variables json
);


--
-- Name: FlowBuilders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FlowBuilders_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FlowBuilders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FlowBuilders_id_seq" OWNED BY public."FlowBuilders".id;


--
-- Name: FlowCampaigns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FlowCampaigns" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying(255) NOT NULL,
    "flowId" integer NOT NULL,
    phrase character varying(255) NOT NULL,
    status boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "whatsappId" integer
);


--
-- Name: FlowCampaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FlowCampaigns_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FlowCampaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FlowCampaigns_id_seq" OWNED BY public."FlowCampaigns".id;


--
-- Name: FlowDefaults; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FlowDefaults" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    "userId" integer NOT NULL,
    "flowIdWelcome" integer,
    "flowIdNotPhrase" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: FlowDefaults_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FlowDefaults_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FlowDefaults_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FlowDefaults_id_seq" OWNED BY public."FlowDefaults".id;


--
-- Name: FlowImgs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FlowImgs" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: FlowImgs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FlowImgs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FlowImgs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FlowImgs_id_seq" OWNED BY public."FlowImgs".id;


--
-- Name: Helps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Helps" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    video character varying(255),
    link text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: Helps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Helps_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Helps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Helps_id_seq" OWNED BY public."Helps".id;


--
-- Name: Invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Invoices" (
    id integer NOT NULL,
    detail character varying(255),
    status character varying(255),
    value double precision,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "dueDate" character varying(255),
    "companyId" integer
);


--
-- Name: Invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Invoices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Invoices_id_seq" OWNED BY public."Invoices".id;


--
-- Name: Messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Messages" (
    id character varying(255) NOT NULL,
    body text NOT NULL,
    ack integer DEFAULT 0 NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "mediaType" character varying(255),
    "mediaUrl" character varying(255),
    "ticketId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "fromMe" boolean DEFAULT false NOT NULL,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "contactId" integer,
    "quotedMsgId" character varying(255),
    "companyId" integer,
    "remoteJid" text,
    "dataJson" text,
    participant text,
    "queueId" integer,
    "isEdited" boolean DEFAULT false NOT NULL
);


--
-- Name: Plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Plans" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    users integer DEFAULT 0,
    connections integer DEFAULT 0,
    queues integer DEFAULT 0,
    value double precision DEFAULT '0'::double precision,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "useCampaigns" boolean DEFAULT true,
    "useExternalApi" boolean DEFAULT true,
    "useInternalChat" boolean DEFAULT true,
    "useSchedules" boolean DEFAULT true,
    "useKanban" boolean DEFAULT true,
    "useOpenAi" boolean DEFAULT true,
    "useIntegrations" boolean DEFAULT true
);


--
-- Name: Plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Plans_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Plans_id_seq" OWNED BY public."Plans".id;


--
-- Name: Prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Prompts" (
    id integer NOT NULL,
    name text NOT NULL,
    "apiKey" text NOT NULL,
    prompt text NOT NULL,
    "maxTokens" integer DEFAULT 100 NOT NULL,
    "maxMessages" integer DEFAULT 10 NOT NULL,
    temperature double precision,
    "promptTokens" integer DEFAULT 0 NOT NULL,
    "completionTokens" integer DEFAULT 0 NOT NULL,
    "totalTokens" integer DEFAULT 0 NOT NULL,
    "companyId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    model character varying(255),
    "queueId" integer
);


--
-- Name: Prompts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Prompts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Prompts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Prompts_id_seq" OWNED BY public."Prompts".id;


--
-- Name: QueueIntegrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QueueIntegrations" (
    id integer NOT NULL,
    type character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "projectName" character varying(255) NOT NULL,
    "jsonContent" text NOT NULL,
    language character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "urlN8N" character varying(255) DEFAULT true NOT NULL,
    "companyId" integer,
    "typebotSlug" character varying(255) DEFAULT ''::character varying NOT NULL,
    "typebotKeywordFinish" character varying(255) DEFAULT ''::character varying NOT NULL,
    "typebotUnknownMessage" character varying(255) DEFAULT ''::character varying NOT NULL,
    "typebotExpires" integer DEFAULT 0 NOT NULL,
    "typebotDelayMessage" integer DEFAULT 1000 NOT NULL,
    "typebotKeywordRestart" character varying(255) DEFAULT ''::character varying,
    "typebotRestartMessage" character varying(255) DEFAULT ''::character varying
);


--
-- Name: QueueIntegrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."QueueIntegrations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: QueueIntegrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."QueueIntegrations_id_seq" OWNED BY public."QueueIntegrations".id;


--
-- Name: QueueOptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QueueOptions" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text,
    option text,
    "queueId" integer,
    "parentId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: QueueOptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."QueueOptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: QueueOptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."QueueOptions_id_seq" OWNED BY public."QueueOptions".id;


--
-- Name: Queues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Queues" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(255) NOT NULL,
    "greetingMessage" text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "companyId" integer,
    "outOfHoursMessage" text,
    schedules jsonb DEFAULT '[]'::jsonb,
    "orderQueue" integer,
    "integrationId" integer,
    "promptId" integer
);


--
-- Name: Queues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Queues_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Queues_id_seq" OWNED BY public."Queues".id;


--
-- Name: QuickMessages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuickMessages" (
    id integer NOT NULL,
    shortcode character varying(255) NOT NULL,
    message text,
    "companyId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer,
    "mediaPath" character varying(255) DEFAULT NULL::character varying,
    "mediaName" character varying(255) DEFAULT NULL::character varying
);


--
-- Name: QuickMessages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."QuickMessages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: QuickMessages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."QuickMessages_id_seq" OWNED BY public."QuickMessages".id;


--
-- Name: Schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Schedules" (
    id integer NOT NULL,
    body text NOT NULL,
    "sendAt" timestamp with time zone,
    "sentAt" timestamp with time zone,
    "contactId" integer,
    "ticketId" integer,
    "userId" integer,
    "companyId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    status character varying(255),
    "mediaName" character varying(255) DEFAULT NULL::character varying,
    "mediaPath" character varying(255) DEFAULT NULL::character varying
);


--
-- Name: Schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Schedules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Schedules_id_seq" OWNED BY public."Schedules".id;


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: Settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Settings" (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "companyId" integer,
    id integer NOT NULL
);


--
-- Name: Settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Settings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Settings_id_seq" OWNED BY public."Settings".id;


--
-- Name: Subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subscriptions" (
    id integer NOT NULL,
    "isActive" boolean DEFAULT false,
    "expiresAt" timestamp with time zone NOT NULL,
    "userPriceCents" integer,
    "whatsPriceCents" integer,
    "lastInvoiceUrl" character varying(255),
    "lastPlanChange" timestamp with time zone,
    "companyId" integer,
    "providerSubscriptionId" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: Subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Subscriptions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Subscriptions_id_seq" OWNED BY public."Subscriptions".id;


--
-- Name: Tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tags" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    color character varying(255),
    "companyId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    kanban integer
);


--
-- Name: Tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Tags_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Tags_id_seq" OWNED BY public."Tags".id;


--
-- Name: TicketNotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TicketNotes" (
    id integer NOT NULL,
    note character varying(255) NOT NULL,
    "userId" integer,
    "contactId" integer NOT NULL,
    "ticketId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: TicketNotes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TicketNotes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TicketNotes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TicketNotes_id_seq" OWNED BY public."TicketNotes".id;


--
-- Name: TicketTags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TicketTags" (
    "ticketId" integer NOT NULL,
    "tagId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: TicketTraking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TicketTraking" (
    id integer NOT NULL,
    "ticketId" integer,
    "companyId" integer,
    "whatsappId" integer,
    "userId" integer,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "queuedAt" timestamp with time zone,
    "startedAt" timestamp with time zone,
    "finishedAt" timestamp with time zone,
    "ratingAt" timestamp with time zone,
    rated boolean DEFAULT false,
    "chatbotAt" timestamp with time zone
);


--
-- Name: TicketTraking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TicketTraking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TicketTraking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TicketTraking_id_seq" OWNED BY public."TicketTraking".id;


--
-- Name: Tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tickets" (
    id integer NOT NULL,
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    "lastMessage" text DEFAULT ''::text,
    "contactId" integer,
    "userId" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "whatsappId" integer,
    "isGroup" boolean DEFAULT false NOT NULL,
    "unreadMessages" integer,
    "queueId" integer,
    "companyId" integer,
    uuid uuid DEFAULT public.uuid_generate_v4(),
    chatbot boolean DEFAULT false,
    "queueOptionId" integer,
    "amountUsedBotQueues" integer,
    "fromMe" boolean DEFAULT false NOT NULL,
    "useIntegration" boolean DEFAULT false,
    "integrationId" integer,
    "typebotSessionId" character varying(255) DEFAULT NULL::character varying,
    "typebotStatus" boolean DEFAULT false NOT NULL,
    "promptId" character varying(255) DEFAULT NULL::character varying,
    "flowWebhook" boolean DEFAULT false NOT NULL,
    "lastFlowId" character varying(255),
    "hashFlowId" character varying(255),
    "flowStopped" character varying(255),
    "dataWebhook" json
);


--
-- Name: Tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Tickets_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Tickets_id_seq" OWNED BY public."Tickets".id;


--
-- Name: UserQueues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserQueues" (
    "userId" integer NOT NULL,
    "queueId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: UserRatings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRatings" (
    id integer NOT NULL,
    "ticketId" integer,
    "companyId" integer,
    "userId" integer,
    rate integer DEFAULT 0,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


--
-- Name: UserRatings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."UserRatings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: UserRatings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."UserRatings_id_seq" OWNED BY public."UserRatings".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    profile character varying(255) DEFAULT 'admin'::character varying NOT NULL,
    "tokenVersion" integer DEFAULT 0 NOT NULL,
    "companyId" integer,
    super boolean DEFAULT false,
    online boolean DEFAULT false,
    "allTicket" character varying(255) DEFAULT 'desabled'::character varying NOT NULL,
    "whatsappId" integer,
    "resetPassword" character varying(255)
);


--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: Webhooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Webhooks" (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    hash_id character varying(255) NOT NULL,
    config json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    active boolean DEFAULT false,
    "requestMonth" integer DEFAULT 0,
    "requestAll" integer DEFAULT 0
);


--
-- Name: Webhooks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Webhooks_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Webhooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Webhooks_id_seq" OWNED BY public."Webhooks".id;


--
-- Name: WhatsappQueues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WhatsappQueues" (
    "whatsappId" integer NOT NULL,
    "queueId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: Whatsapps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Whatsapps" (
    id integer NOT NULL,
    session text,
    qrcode text,
    status character varying(255),
    battery character varying(255),
    plugged boolean,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    name character varying(255) NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    retries integer DEFAULT 0 NOT NULL,
    "greetingMessage" text,
    "companyId" integer,
    "complationMessage" text,
    "outOfHoursMessage" text,
    "ratingMessage" text,
    token text,
    "farewellMessage" text,
    provider text DEFAULT 'stable'::text,
    "sendIdQueue" integer,
    "promptId" integer,
    "integrationId" integer,
    "maxUseBotQueues" integer DEFAULT 3,
    "expiresTicket" integer DEFAULT 0,
    "expiresInactiveMessage" character varying(255) DEFAULT ''::character varying,
    "timeUseBotQueues" integer DEFAULT 0,
    "transferQueueId" integer,
    "timeToTransfer" integer,
    "flowIdNotPhrase" integer,
    "flowIdWelcome" integer
);


--
-- Name: Whatsapps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Whatsapps_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Whatsapps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Whatsapps_id_seq" OWNED BY public."Whatsapps".id;


--
-- Name: Announcements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcements" ALTER COLUMN id SET DEFAULT nextval('public."Announcements_id_seq"'::regclass);


--
-- Name: Baileys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Baileys" ALTER COLUMN id SET DEFAULT nextval('public."Baileys_id_seq"'::regclass);


--
-- Name: BaileysChats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysChats" ALTER COLUMN id SET DEFAULT nextval('public."BaileysChats_id_seq"'::regclass);


--
-- Name: BaileysMessages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysMessages" ALTER COLUMN id SET DEFAULT nextval('public."BaileysMessages_id_seq"'::regclass);


--
-- Name: CampaignSettings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignSettings" ALTER COLUMN id SET DEFAULT nextval('public."CampaignSettings_id_seq"'::regclass);


--
-- Name: CampaignShipping id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignShipping" ALTER COLUMN id SET DEFAULT nextval('public."CampaignShipping_id_seq"'::regclass);


--
-- Name: Campaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns" ALTER COLUMN id SET DEFAULT nextval('public."Campaigns_id_seq"'::regclass);


--
-- Name: ChatMessages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessages" ALTER COLUMN id SET DEFAULT nextval('public."ChatMessages_id_seq"'::regclass);


--
-- Name: ChatUsers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatUsers" ALTER COLUMN id SET DEFAULT nextval('public."ChatUsers_id_seq"'::regclass);


--
-- Name: Chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats" ALTER COLUMN id SET DEFAULT nextval('public."Chats_id_seq"'::regclass);


--
-- Name: Companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Companies" ALTER COLUMN id SET DEFAULT nextval('public."Companies_id_seq"'::regclass);


--
-- Name: ContactCustomFields id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactCustomFields" ALTER COLUMN id SET DEFAULT nextval('public."ContactCustomFields_id_seq"'::regclass);


--
-- Name: ContactListItems id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactListItems" ALTER COLUMN id SET DEFAULT nextval('public."ContactListItems_id_seq"'::regclass);


--
-- Name: ContactLists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactLists" ALTER COLUMN id SET DEFAULT nextval('public."ContactLists_id_seq"'::regclass);


--
-- Name: Contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts" ALTER COLUMN id SET DEFAULT nextval('public."Contacts_id_seq"'::regclass);


--
-- Name: Files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Files" ALTER COLUMN id SET DEFAULT nextval('public."Files_id_seq"'::regclass);


--
-- Name: FilesOptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FilesOptions" ALTER COLUMN id SET DEFAULT nextval('public."FilesOptions_id_seq"'::regclass);


--
-- Name: FlowAudios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowAudios" ALTER COLUMN id SET DEFAULT nextval('public."FlowAudios_id_seq"'::regclass);


--
-- Name: FlowBuilders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowBuilders" ALTER COLUMN id SET DEFAULT nextval('public."FlowBuilders_id_seq"'::regclass);


--
-- Name: FlowCampaigns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowCampaigns" ALTER COLUMN id SET DEFAULT nextval('public."FlowCampaigns_id_seq"'::regclass);


--
-- Name: FlowDefaults id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowDefaults" ALTER COLUMN id SET DEFAULT nextval('public."FlowDefaults_id_seq"'::regclass);


--
-- Name: FlowImgs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowImgs" ALTER COLUMN id SET DEFAULT nextval('public."FlowImgs_id_seq"'::regclass);


--
-- Name: Helps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Helps" ALTER COLUMN id SET DEFAULT nextval('public."Helps_id_seq"'::regclass);


--
-- Name: Invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoices" ALTER COLUMN id SET DEFAULT nextval('public."Invoices_id_seq"'::regclass);


--
-- Name: Plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plans" ALTER COLUMN id SET DEFAULT nextval('public."Plans_id_seq"'::regclass);


--
-- Name: Prompts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prompts" ALTER COLUMN id SET DEFAULT nextval('public."Prompts_id_seq"'::regclass);


--
-- Name: QueueIntegrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueIntegrations" ALTER COLUMN id SET DEFAULT nextval('public."QueueIntegrations_id_seq"'::regclass);


--
-- Name: QueueOptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueOptions" ALTER COLUMN id SET DEFAULT nextval('public."QueueOptions_id_seq"'::regclass);


--
-- Name: Queues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues" ALTER COLUMN id SET DEFAULT nextval('public."Queues_id_seq"'::regclass);


--
-- Name: QuickMessages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuickMessages" ALTER COLUMN id SET DEFAULT nextval('public."QuickMessages_id_seq"'::regclass);


--
-- Name: Schedules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedules" ALTER COLUMN id SET DEFAULT nextval('public."Schedules_id_seq"'::regclass);


--
-- Name: Settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settings" ALTER COLUMN id SET DEFAULT nextval('public."Settings_id_seq"'::regclass);


--
-- Name: Subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscriptions" ALTER COLUMN id SET DEFAULT nextval('public."Subscriptions_id_seq"'::regclass);


--
-- Name: Tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tags" ALTER COLUMN id SET DEFAULT nextval('public."Tags_id_seq"'::regclass);


--
-- Name: TicketNotes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketNotes" ALTER COLUMN id SET DEFAULT nextval('public."TicketNotes_id_seq"'::regclass);


--
-- Name: TicketTraking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTraking" ALTER COLUMN id SET DEFAULT nextval('public."TicketTraking_id_seq"'::regclass);


--
-- Name: Tickets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets" ALTER COLUMN id SET DEFAULT nextval('public."Tickets_id_seq"'::regclass);


--
-- Name: UserRatings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRatings" ALTER COLUMN id SET DEFAULT nextval('public."UserRatings_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: Webhooks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Webhooks" ALTER COLUMN id SET DEFAULT nextval('public."Webhooks_id_seq"'::regclass);


--
-- Name: Whatsapps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps" ALTER COLUMN id SET DEFAULT nextval('public."Whatsapps_id_seq"'::regclass);


--
-- Name: Announcements Announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcements"
    ADD CONSTRAINT "Announcements_pkey" PRIMARY KEY (id);


--
-- Name: BaileysChats BaileysChats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysChats"
    ADD CONSTRAINT "BaileysChats_pkey" PRIMARY KEY (id);


--
-- Name: BaileysMessages BaileysMessages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysMessages"
    ADD CONSTRAINT "BaileysMessages_pkey" PRIMARY KEY (id);


--
-- Name: Baileys Baileys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Baileys"
    ADD CONSTRAINT "Baileys_pkey" PRIMARY KEY (id, "whatsappId");


--
-- Name: CampaignSettings CampaignSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignSettings"
    ADD CONSTRAINT "CampaignSettings_pkey" PRIMARY KEY (id);


--
-- Name: CampaignShipping CampaignShipping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignShipping"
    ADD CONSTRAINT "CampaignShipping_pkey" PRIMARY KEY (id);


--
-- Name: Campaigns Campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessages ChatMessages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessages"
    ADD CONSTRAINT "ChatMessages_pkey" PRIMARY KEY (id);


--
-- Name: ChatUsers ChatUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_pkey" PRIMARY KEY (id);


--
-- Name: Chats Chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats"
    ADD CONSTRAINT "Chats_pkey" PRIMARY KEY (id);


--
-- Name: Companies Companies_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Companies"
    ADD CONSTRAINT "Companies_name_key" UNIQUE (name);


--
-- Name: Companies Companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Companies"
    ADD CONSTRAINT "Companies_pkey" PRIMARY KEY (id);


--
-- Name: ContactCustomFields ContactCustomFields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactCustomFields"
    ADD CONSTRAINT "ContactCustomFields_pkey" PRIMARY KEY (id);


--
-- Name: ContactListItems ContactListItems_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactListItems"
    ADD CONSTRAINT "ContactListItems_pkey" PRIMARY KEY (id);


--
-- Name: ContactLists ContactLists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactLists"
    ADD CONSTRAINT "ContactLists_pkey" PRIMARY KEY (id);


--
-- Name: Contacts Contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts"
    ADD CONSTRAINT "Contacts_pkey" PRIMARY KEY (id);


--
-- Name: FilesOptions FilesOptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FilesOptions"
    ADD CONSTRAINT "FilesOptions_pkey" PRIMARY KEY (id);


--
-- Name: Files Files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Files"
    ADD CONSTRAINT "Files_pkey" PRIMARY KEY (id);


--
-- Name: FlowAudios FlowAudios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowAudios"
    ADD CONSTRAINT "FlowAudios_pkey" PRIMARY KEY (id);


--
-- Name: FlowBuilders FlowBuilders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowBuilders"
    ADD CONSTRAINT "FlowBuilders_pkey" PRIMARY KEY (id);


--
-- Name: FlowCampaigns FlowCampaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowCampaigns"
    ADD CONSTRAINT "FlowCampaigns_pkey" PRIMARY KEY (id);


--
-- Name: FlowDefaults FlowDefaults_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowDefaults"
    ADD CONSTRAINT "FlowDefaults_pkey" PRIMARY KEY (id);


--
-- Name: FlowImgs FlowImgs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowImgs"
    ADD CONSTRAINT "FlowImgs_pkey" PRIMARY KEY (id);


--
-- Name: Helps Helps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Helps"
    ADD CONSTRAINT "Helps_pkey" PRIMARY KEY (id);


--
-- Name: Invoices Invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoices"
    ADD CONSTRAINT "Invoices_pkey" PRIMARY KEY (id);


--
-- Name: Messages Messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_pkey" PRIMARY KEY (id);


--
-- Name: Plans Plans_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plans"
    ADD CONSTRAINT "Plans_name_key" UNIQUE (name);


--
-- Name: Plans Plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Plans"
    ADD CONSTRAINT "Plans_pkey" PRIMARY KEY (id);


--
-- Name: Prompts Prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prompts"
    ADD CONSTRAINT "Prompts_pkey" PRIMARY KEY (id);


--
-- Name: QueueIntegrations QueueIntegrations_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueIntegrations"
    ADD CONSTRAINT "QueueIntegrations_name_key" UNIQUE (name);


--
-- Name: QueueIntegrations QueueIntegrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueIntegrations"
    ADD CONSTRAINT "QueueIntegrations_pkey" PRIMARY KEY (id);


--
-- Name: QueueIntegrations QueueIntegrations_projectName_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueIntegrations"
    ADD CONSTRAINT "QueueIntegrations_projectName_key" UNIQUE ("projectName");


--
-- Name: QueueOptions QueueOptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueOptions"
    ADD CONSTRAINT "QueueOptions_pkey" PRIMARY KEY (id);


--
-- Name: Queues Queues_color_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues"
    ADD CONSTRAINT "Queues_color_key" UNIQUE (color);


--
-- Name: Queues Queues_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues"
    ADD CONSTRAINT "Queues_name_key" UNIQUE (name);


--
-- Name: Queues Queues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues"
    ADD CONSTRAINT "Queues_pkey" PRIMARY KEY (id);


--
-- Name: QuickMessages QuickMessages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuickMessages"
    ADD CONSTRAINT "QuickMessages_pkey" PRIMARY KEY (id);


--
-- Name: Schedules Schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedules"
    ADD CONSTRAINT "Schedules_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: Subscriptions Subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_pkey" PRIMARY KEY (id);


--
-- Name: Tags Tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tags"
    ADD CONSTRAINT "Tags_pkey" PRIMARY KEY (id);


--
-- Name: TicketNotes TicketNotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketNotes"
    ADD CONSTRAINT "TicketNotes_pkey" PRIMARY KEY (id);


--
-- Name: TicketTraking TicketTraking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTraking"
    ADD CONSTRAINT "TicketTraking_pkey" PRIMARY KEY (id);


--
-- Name: Tickets Tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_pkey" PRIMARY KEY (id);


--
-- Name: UserQueues UserQueues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserQueues"
    ADD CONSTRAINT "UserQueues_pkey" PRIMARY KEY ("userId", "queueId");


--
-- Name: UserRatings UserRatings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRatings"
    ADD CONSTRAINT "UserRatings_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Webhooks Webhooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Webhooks"
    ADD CONSTRAINT "Webhooks_pkey" PRIMARY KEY (id);


--
-- Name: WhatsappQueues WhatsappQueues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WhatsappQueues"
    ADD CONSTRAINT "WhatsappQueues_pkey" PRIMARY KEY ("whatsappId", "queueId");


--
-- Name: Whatsapps Whatsapps_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_name_key" UNIQUE (name);


--
-- Name: Whatsapps Whatsapps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_pkey" PRIMARY KEY (id);


--
-- Name: Tickets contactid_companyid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT contactid_companyid_unique UNIQUE ("contactId", "companyId", "whatsappId");


--
-- Name: Contacts number_companyid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts"
    ADD CONSTRAINT number_companyid_unique UNIQUE (number, "companyId");


--
-- Name: idx_cont_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cont_company_id ON public."Contacts" USING btree ("companyId");


--
-- Name: idx_cpsh_campaign_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpsh_campaign_id ON public."CampaignShipping" USING btree ("campaignId");


--
-- Name: idx_ctli_contact_list_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ctli_contact_list_id ON public."ContactListItems" USING btree ("contactListId");


--
-- Name: idx_flowbui_id_user_id_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flowbui_id_user_id_active ON public."FlowBuilders" USING btree (id, user_id, active);


--
-- Name: idx_flowcamp_id_company_id_phrase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flowcamp_id_company_id_phrase ON public."FlowCampaigns" USING btree (id, "companyId", phrase);


--
-- Name: idx_flowdefa_id_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_flowdefa_id_company_id ON public."FlowDefaults" USING btree (id, "companyId");


--
-- Name: idx_ms_company_id_ticket_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ms_company_id_ticket_id ON public."Messages" USING btree ("companyId", "ticketId");


--
-- Name: idx_sched_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sched_company_id ON public."Schedules" USING btree ("companyId");


--
-- Name: idx_tg_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tg_company_id ON public."Tags" USING btree ("companyId");


--
-- Name: Announcements Announcements_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Announcements"
    ADD CONSTRAINT "Announcements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BaileysChats BaileysChats_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysChats"
    ADD CONSTRAINT "BaileysChats_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BaileysMessages BaileysMessages_baileysChatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysMessages"
    ADD CONSTRAINT "BaileysMessages_baileysChatId_fkey" FOREIGN KEY ("baileysChatId") REFERENCES public."BaileysChats"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BaileysMessages BaileysMessages_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BaileysMessages"
    ADD CONSTRAINT "BaileysMessages_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampaignSettings CampaignSettings_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignSettings"
    ADD CONSTRAINT "CampaignSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampaignShipping CampaignShipping_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignShipping"
    ADD CONSTRAINT "CampaignShipping_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."Campaigns"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CampaignShipping CampaignShipping_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CampaignShipping"
    ADD CONSTRAINT "CampaignShipping_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."ContactListItems"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Campaigns Campaigns_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Campaigns Campaigns_contactListId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_contactListId_fkey" FOREIGN KEY ("contactListId") REFERENCES public."ContactLists"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Campaigns Campaigns_fileListId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_fileListId_fkey" FOREIGN KEY ("fileListId") REFERENCES public."Files"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Campaigns Campaigns_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tags"(id);


--
-- Name: Campaigns Campaigns_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaigns"
    ADD CONSTRAINT "Campaigns_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: ChatMessages ChatMessages_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessages"
    ADD CONSTRAINT "ChatMessages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."Chats"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessages ChatMessages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessages"
    ADD CONSTRAINT "ChatMessages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatUsers ChatUsers_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public."Chats"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatUsers ChatUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatUsers"
    ADD CONSTRAINT "ChatUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chats Chats_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats"
    ADD CONSTRAINT "Chats_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chats Chats_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chats"
    ADD CONSTRAINT "Chats_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Companies Companies_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Companies"
    ADD CONSTRAINT "Companies_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plans"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ContactCustomFields ContactCustomFields_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactCustomFields"
    ADD CONSTRAINT "ContactCustomFields_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContactListItems ContactListItems_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactListItems"
    ADD CONSTRAINT "ContactListItems_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContactListItems ContactListItems_contactListId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactListItems"
    ADD CONSTRAINT "ContactListItems_contactListId_fkey" FOREIGN KEY ("contactListId") REFERENCES public."ContactLists"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContactLists ContactLists_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContactLists"
    ADD CONSTRAINT "ContactLists_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contacts Contacts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts"
    ADD CONSTRAINT "Contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Contacts Contacts_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contacts"
    ADD CONSTRAINT "Contacts_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FilesOptions FilesOptions_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FilesOptions"
    ADD CONSTRAINT "FilesOptions_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public."Files"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Files Files_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Files"
    ADD CONSTRAINT "Files_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowCampaigns FlowCampaigns_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FlowCampaigns"
    ADD CONSTRAINT "FlowCampaigns_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invoices Invoices_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoices"
    ADD CONSTRAINT "Invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Messages Messages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Messages Messages_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Messages Messages_queueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES public."Queues"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Messages Messages_quotedMsgId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_quotedMsgId_fkey" FOREIGN KEY ("quotedMsgId") REFERENCES public."Messages"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Messages Messages_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Tickets"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Prompts Prompts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prompts"
    ADD CONSTRAINT "Prompts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id);


--
-- Name: Prompts Prompts_queueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prompts"
    ADD CONSTRAINT "Prompts_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES public."Queues"(id);


--
-- Name: QueueIntegrations QueueIntegrations_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueIntegrations"
    ADD CONSTRAINT "QueueIntegrations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QueueOptions QueueOptions_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueOptions"
    ADD CONSTRAINT "QueueOptions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."QueueOptions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QueueOptions QueueOptions_queueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QueueOptions"
    ADD CONSTRAINT "QueueOptions_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES public."Queues"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Queues Queues_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues"
    ADD CONSTRAINT "Queues_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Queues Queues_integrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues"
    ADD CONSTRAINT "Queues_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."QueueIntegrations"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Queues Queues_promptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Queues"
    ADD CONSTRAINT "Queues_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES public."Prompts"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QuickMessages QuickMessages_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuickMessages"
    ADD CONSTRAINT "QuickMessages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuickMessages QuickMessages_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuickMessages"
    ADD CONSTRAINT "QuickMessages_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedules Schedules_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedules"
    ADD CONSTRAINT "Schedules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedules Schedules_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedules"
    ADD CONSTRAINT "Schedules_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Schedules Schedules_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedules"
    ADD CONSTRAINT "Schedules_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Tickets"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Schedules Schedules_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Schedules"
    ADD CONSTRAINT "Schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Settings Settings_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Subscriptions Subscriptions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscriptions"
    ADD CONSTRAINT "Subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tags Tags_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tags"
    ADD CONSTRAINT "Tags_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketNotes TicketNotes_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketNotes"
    ADD CONSTRAINT "TicketNotes_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketNotes TicketNotes_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketNotes"
    ADD CONSTRAINT "TicketNotes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Tickets"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketNotes TicketNotes_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketNotes"
    ADD CONSTRAINT "TicketNotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TicketTags TicketTags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTags"
    ADD CONSTRAINT "TicketTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tags"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketTags TicketTags_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTags"
    ADD CONSTRAINT "TicketTags_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Tickets"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TicketTraking TicketTraking_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTraking"
    ADD CONSTRAINT "TicketTraking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON DELETE SET NULL;


--
-- Name: TicketTraking TicketTraking_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTraking"
    ADD CONSTRAINT "TicketTraking_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Tickets"(id) ON DELETE SET NULL;


--
-- Name: TicketTraking TicketTraking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTraking"
    ADD CONSTRAINT "TicketTraking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON DELETE SET NULL;


--
-- Name: TicketTraking TicketTraking_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TicketTraking"
    ADD CONSTRAINT "TicketTraking_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON DELETE SET NULL;


--
-- Name: Tickets Tickets_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tickets Tickets_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contacts"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tickets Tickets_integrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."QueueIntegrations"(id);


--
-- Name: Tickets Tickets_queueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES public."Queues"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tickets Tickets_queueOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_queueOptionId_fkey" FOREIGN KEY ("queueOptionId") REFERENCES public."QueueOptions"(id) ON UPDATE SET NULL ON DELETE SET NULL;


--
-- Name: Tickets Tickets_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Tickets Tickets_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tickets"
    ADD CONSTRAINT "Tickets_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserRatings UserRatings_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRatings"
    ADD CONSTRAINT "UserRatings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON DELETE SET NULL;


--
-- Name: UserRatings UserRatings_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRatings"
    ADD CONSTRAINT "UserRatings_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Tickets"(id) ON DELETE SET NULL;


--
-- Name: UserRatings UserRatings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRatings"
    ADD CONSTRAINT "UserRatings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON DELETE SET NULL;


--
-- Name: Users Users_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Users Users_whatsappId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_whatsappId_fkey" FOREIGN KEY ("whatsappId") REFERENCES public."Whatsapps"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Whatsapps Whatsapps_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Companies"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Whatsapps Whatsapps_flowIdNotPhrase_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_flowIdNotPhrase_fkey" FOREIGN KEY ("flowIdNotPhrase") REFERENCES public."FlowBuilders"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Whatsapps Whatsapps_flowIdWelcome_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_flowIdWelcome_fkey" FOREIGN KEY ("flowIdWelcome") REFERENCES public."FlowBuilders"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Whatsapps Whatsapps_integrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."QueueIntegrations"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Whatsapps Whatsapps_promptId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Whatsapps"
    ADD CONSTRAINT "Whatsapps_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES public."Prompts"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

