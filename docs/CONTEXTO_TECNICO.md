# 🚀 TUCANLINK CRM - CONTEXTO TÉCNICO COMPLETO

## 📋 TABLA DE CONTENIDOS

1. [DESCRIPCIÓN GENERAL](#descripción-general)
2. [ARQUITECTURA DEL SISTEMA](#arquitectura-del-sistema)
3. [STACK TECNOLÓGICO](#stack-tecnológico)
4. [ESTRUCTURA DEL PROYECTO](#estructura-del-proyecto)
5. [BASE DE DATOS](#base-de-datos)
6. [FLUJO DE MENSAJES](#flujo-de-mensajes)
7. [SISTEMA DE AUTENTICACIÓN](#sistema-de-autenticación)
8. [SISTEMA DE COLAS Y TICKETS](#sistema-de-colas-y-tickets)
9. [INTEGRACIÓN WHATSAPP](#integración-whatsapp)
10. [SISTEMA DE WEBHOOKS](#sistema-de-webhooks)
11. [SOCKET.IO Y TIEMPO REAL](#socketio-y-tiempo-real)
12. [SISTEMA DE CAMPAÑAS](#sistema-de-campañas)
13. [FLOW BUILDER](#flow-builder)
14. [MULTI-TENANCY](#multi-tenancy)
15. [SISTEMA DE ARCHIVOS](#sistema-de-archivos)
16. [CONFIGURACIÓN DE ENTORNO](#configuración-de-entorno)
17. [APIS Y ENDPOINTS](#apis-y-endpoints)
18. [SISTEMA DE LOGS](#sistema-de-logs)
19. [SEGURIDAD](#seguridad)
20. [OPTIMIZACIÓN Y PERFORMANCE](#optimización-y-performance)

---

## 🎯 DESCRIPCIÓN GENERAL

TucanLink es un **CRM de WhatsApp multiempresa (multi-tenant)** desarrollado como una solución white-label distribuida bajo la marca "Atendechat". El sistema permite gestionar múltiples conexiones de WhatsApp Business, automatizar conversaciones, ejecutar campañas masivas y distribuir la atención entre equipos de trabajo.

### Características Principales

- **Multi-tenant**: Soporte para múltiples empresas con datos completamente aislados
- **WhatsApp Business API**: Integración completa mediante Baileys/WhiskeySockets
- **Sistema de Tickets**: Gestión de conversaciones con estados y asignaciones
- **Colas de Atención**: Distribución inteligente de conversaciones por departamentos
- **Campañas Masivas**: Envío bulk con rate limiting y programación
- **Flow Builder**: Constructor visual de flujos de automatización
- **Webhooks**: Integración con sistemas externos (n8n, Zapier, Make)
- **Chat Interno**: Comunicación entre agentes
- **Real-time**: Actualización instantánea mediante Socket.io
- **Reportes y Analytics**: Dashboard con métricas en tiempo real

### URLs y Accesos

- **Producción**: https://tucanlink.ianebula.com
- **Backend API**: http://localhost:8080 (desarrollo)
- **Frontend**: http://localhost:3000 (desarrollo)
- **Login por defecto**: admin@admin.com / admin

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAPA DE PRESENTACIÓN                              │
├─────────────────────────────────────────────────────────────────────────┤
│  React.js + Material-UI + Socket.io Client + React Query + Context API   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE APLICACIÓN                             │
├─────────────────────────────────────────────────────────────────────────┤
│   Express.js + TypeScript + Socket.io Server + Bull Queue + Sequelize    │
│                     JWT Auth + Multer + Yup Validation                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│      CAPA DE DATOS          │    │      CAPA DE CACHE          │
├─────────────────────────────┤    ├─────────────────────────────┤
│  PostgreSQL 14 + Sequelize  │    │    Redis + Bull Queue       │
│     46 Tablas + Índices     │    │   Sessions + Rate Limit    │
└─────────────────────────────┘    └─────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVICIOS EXTERNOS                                │
├─────────────────────────────────────────────────────────────────────────┤
│   WhatsApp Business API (Baileys) + Webhooks + Storage + Email + SMS     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Componentes Principales

#### Backend (Node.js/Express)
- **API REST**: Endpoints para todas las operaciones CRUD
- **WebSocket Server**: Comunicación bidireccional en tiempo real
- **Queue Workers**: Procesamiento asíncrono de tareas pesadas
- **Session Manager**: Gestión de sesiones de WhatsApp
- **File Handler**: Procesamiento y almacenamiento de archivos multimedia

#### Frontend (React.js)
- **SPA (Single Page Application)**: Navegación client-side
- **Material Design**: Interfaz consistente y responsive
- **Real-time Updates**: Actualización automática de UI
- **PWA Ready**: Capacidades offline y instalación

#### Base de Datos (PostgreSQL)
- **Schema Multi-tenant**: Segregación por companyId
- **Transacciones ACID**: Consistencia de datos garantizada
- **Índices Optimizados**: Búsquedas rápidas
- **Backup Automático**: Respaldo periódico

#### Cache y Queues (Redis)
- **Session Storage**: Almacenamiento de sesiones JWT
- **Message Queue**: Cola de mensajes para WhatsApp
- **Campaign Queue**: Procesamiento de campañas masivas
- **Rate Limiting**: Control de límites de API

---

## 💻 STACK TECNOLÓGICO

### Backend
```json
{
  "runtime": "Node.js v20.x",
  "framework": "Express.js 4.18.x",
  "language": "TypeScript 4.x",
  "orm": "Sequelize 5.22.5",
  "database": "PostgreSQL 14",
  "cache": "Redis 7.x",
  "queue": "Bull 3.x",
  "websocket": "Socket.io 3.1.x",
  "whatsapp": "@whiskeysockets/baileys 6.x",
  "auth": "jsonwebtoken + bcryptjs",
  "validation": "Yup",
  "file-upload": "Multer",
  "testing": "Jest",
  "linting": "ESLint",
  "process-manager": "PM2"
}
```

### Frontend
```json
{
  "framework": "React 17.x",
  "ui-library": "Material-UI 4.x",
  "routing": "React Router 5.x",
  "state": "Context API + useReducer",
  "http-client": "Axios",
  "websocket": "Socket.io-client",
  "forms": "Formik + Yup",
  "tables": "Material-Table",
  "charts": "Recharts",
  "dates": "date-fns",
  "i18n": "i18next",
  "build": "React Scripts 3.4.3",
  "styling": "CSS-in-JS (makeStyles)"
}
```

### DevOps y Herramientas
```json
{
  "vcs": "Git + GitHub",
  "ci/cd": "GitHub Actions",
  "containerization": "Docker + Docker Compose",
  "cloud": "Google Cloud Platform (GCP)",
  "monitoring": "PM2 Monitoring",
  "logging": "Winston + Morgan",
  "reverse-proxy": "Nginx",
  "ssl": "Let's Encrypt (Certbot)",
  "database-migrations": "Sequelize CLI",
  "environment": ".env files + dotenv"
}
```

---

## 📁 ESTRUCTURA DEL PROYECTO

### Estructura de Directorios Principal

```
V2TucanLink/
├── backend/                      # Aplicación servidor
│   ├── src/                      # Código fuente TypeScript
│   │   ├── @types/               # Definiciones de tipos TypeScript
│   │   ├── config/               # Configuraciones (auth, database, upload, etc.)
│   │   ├── controllers/          # Controladores de rutas (40+ controladores)
│   │   ├── database/             # Base de datos
│   │   │   ├── migrations/       # Migraciones de Sequelize
│   │   │   ├── seeds/            # Seeds para datos iniciales
│   │   │   └── index.ts          # Configuración de Sequelize
│   │   ├── errors/               # Clases de error personalizadas
│   │   ├── helpers/              # Funciones auxiliares
│   │   ├── libs/                 # Librerías internas
│   │   │   ├── socket.ts         # Configuración Socket.io
│   │   │   └── wbot.ts           # Manager de WhatsApp
│   │   ├── middleware/           # Express middlewares
│   │   ├── models/               # Modelos Sequelize (46 modelos)
│   │   ├── routes/               # Definición de rutas API
│   │   ├── services/             # Lógica de negocio (patrón Service)
│   │   │   ├── AuthServices/
│   │   │   ├── CampaignServices/
│   │   │   ├── CompanyService/
│   │   │   ├── ContactServices/
│   │   │   ├── FlowBuilderService/
│   │   │   ├── MessageServices/
│   │   │   ├── QueueService/
│   │   │   ├── TicketServices/
│   │   │   ├── UserServices/
│   │   │   ├── WbotServices/
│   │   │   ├── WebhookConfigServices/
│   │   │   └── WhatsappService/
│   │   ├── utils/                # Utilidades generales
│   │   ├── app.ts                # Configuración Express
│   │   ├── queues.ts             # Configuración Bull
│   │   └── server.ts             # Entry point
│   ├── dist/                     # Código compilado JS
│   ├── public/                   # Archivos estáticos
│   ├── .env                      # Variables de entorno
│   ├── package.json              # Dependencias backend
│   └── tsconfig.json             # Configuración TypeScript
│
├── frontend/                     # Aplicación cliente
│   ├── src/
│   │   ├── assets/               # Imágenes y recursos
│   │   ├── components/           # Componentes React reutilizables
│   │   │   ├── Audio/
│   │   │   ├── BackdropLoading/
│   │   │   ├── ChatEnd/
│   │   │   ├── ContactDrawer/
│   │   │   ├── Dashboard/
│   │   │   ├── FlowBuilderPanel/
│   │   │   ├── MessageInput/
│   │   │   ├── MessagesList/
│   │   │   ├── ModalImageCors/
│   │   │   ├── NewTicketModal/
│   │   │   ├── NotificationsPopOver/
│   │   │   ├── QrcodeModal/
│   │   │   ├── TicketActionButtons/
│   │   │   ├── TicketHeader/
│   │   │   ├── TicketInfo/
│   │   │   ├── TicketListItem/
│   │   │   ├── TicketsManager/
│   │   │   ├── TransferTicketModal/
│   │   │   └── WhatsAppModal/
│   │   ├── context/              # React Context providers
│   │   ├── errors/               # Manejo de errores
│   │   ├── helpers/              # Funciones auxiliares
│   │   ├── hooks/                # Custom React hooks
│   │   ├── layout/               # Layouts de página
│   │   ├── pages/                # Páginas/vistas principales
│   │   │   ├── Announcements/
│   │   │   ├── Campaigns/
│   │   │   ├── Chat/
│   │   │   ├── Companies/
│   │   │   ├── Connections/
│   │   │   ├── Contacts/
│   │   │   ├── Dashboard/
│   │   │   ├── FlowBuilder/
│   │   │   ├── Login/
│   │   │   ├── Queues/
│   │   │   ├── QuickMessages/
│   │   │   ├── Reports/
│   │   │   ├── Schedules/
│   │   │   ├── Settings/
│   │   │   ├── Tags/
│   │   │   ├── Tickets/
│   │   │   ├── Users/
│   │   │   └── WebhookConfig/
│   │   ├── routes/               # Configuración de rutas
│   │   ├── services/             # Servicios API
│   │   ├── stores/               # Estado global
│   │   ├── translate/            # i18n traducciones
│   │   ├── App.js                # Componente principal
│   │   └── index.js              # Entry point
│   ├── public/                   # HTML y recursos públicos
│   ├── build/                    # Aplicación compilada
│   ├── .env                      # Variables de entorno
│   └── package.json              # Dependencias frontend
│
├── docs/                         # Documentación unificada
│   ├── CONTEXTO_TECNICO.md       # Este archivo
│   ├── GUIAS_USUARIO.md          # Manuales de usuario
│   └── DESARROLLO.md             # Guías de desarrollo
│
├── .github/                      # GitHub Actions
│   └── workflows/
│       └── deploy-simple.yml     # CI/CD pipeline
│
├── CLAUDE.md                     # Guía para Claude AI
├── .gitignore                    # Archivos ignorados
└── README.md                     # Documentación básica
```

### Patrón de Servicios (Service Layer Pattern)

Cada feature sigue una estructura consistente:

```
services/FeatureServices/
├── CreateFeatureService.ts       # Crear nuevo registro
├── UpdateFeatureService.ts       # Actualizar registro existente
├── DeleteFeatureService.ts       # Eliminar registro
├── ListFeaturesService.ts        # Listar con paginación y filtros
├── ShowFeatureService.ts         # Mostrar registro individual
└── FindFeatureService.ts         # Buscar por criterios específicos
```

---

## 🗄️ BASE DE DATOS

### Esquema de Base de Datos (46 Tablas)

#### Tablas Principales y sus Relaciones

```sql
-- EMPRESAS Y USUARIOS
Companies (id, name, email, phone, planId, status, ...)
├── Users (id, name, email, companyId, profile, ...)
├── Plans (id, name, users, connections, queues, ...)
└── Settings (id, key, value, companyId, ...)

-- WHATSAPP Y CONEXIONES
Whatsapps (id, name, session, qrcode, status, companyId, ...)
├── WhatsappQueues (whatsappId, queueId, ...)
├── Baileys (id, whatsappId, connections, ...)
└── BaileysChats (id, whatsappId, jid, messages, ...)

-- CONTACTOS Y TICKETS
Contacts (id, name, number, email, companyId, ...)
├── ContactCustomFields (id, name, value, contactId, ...)
├── ContactListItems (id, contactId, contactListId, ...)
└── ContactWallets (id, contactId, walletId, ...)

Tickets (id, status, contactId, userId, queueId, companyId, ...)
├── Messages (id, body, ticketId, contactId, fromMe, ...)
├── TicketTags (ticketId, tagId, ...)
├── TicketNotes (id, note, userId, ticketId, ...)
└── TicketTraking (id, ticketId, userId, action, ...)

-- COLAS Y DISTRIBUCIÓN
Queues (id, name, color, companyId, integrationId, ...)
├── UserQueues (userId, queueId, ...)
├── WhatsappQueues (whatsappId, queueId, ...)
└── QueueIntegrations (id, type, name, urlN8N, companyId, ...)

-- CAMPAÑAS
Campaigns (id, name, status, companyId, contactListId, ...)
├── CampaignShipping (id, campaignId, contactId, deliveredAt, ...)
├── CampaignSettings (id, key, value, campaignId, ...)
└── ContactLists (id, name, companyId, ...)

-- FLOW BUILDER
FlowBuilders (id, name, flow, status, companyId, ...)
├── FlowCampaigns (id, name, flowId, status, ...)
├── FlowImgs (id, name, flowId, ...)
└── FlowAudios (id, name, flowId, ...)

-- MENSAJES RÁPIDOS Y ETIQUETAS
QuickMessages (id, shortcut, message, companyId, ...)
Tags (id, name, color, companyId, ...)
Files (id, name, message, companyId, ...)

-- CHAT INTERNO
Chats (id, title, uuid, companyId, ...)
├── ChatUsers (chatId, userId, ...)
└── ChatMessages (id, message, chatId, senderId, ...)

-- INTEGRACIONES Y WEBHOOKS
QueueIntegrations (id, type, name, urlN8N, companyId, ...)
WebhookConfigs (id, name, url, companyId, conditions, ...)
Invoices (id, detail, status, companyId, ...)

-- SISTEMA
Announcements (id, title, text, priority, status, ...)
Helps (id, title, description, video, link, ...)
ScheduledMessages (id, body, sendAt, ticketId, ...)
SettingTickets (id, message, startTime, endTime, ...)
Subscriptions (id, isActive, userPriceCents, companyId, ...)
```

### Índices y Optimizaciones

```sql
-- Índices principales para performance
CREATE INDEX idx_tickets_companyId_status ON "Tickets"(companyId, status);
CREATE INDEX idx_messages_ticketId_createdAt ON "Messages"(ticketId, createdAt);
CREATE INDEX idx_contacts_companyId_number ON "Contacts"(companyId, number);
CREATE INDEX idx_users_companyId_email ON "Users"(companyId, email);
CREATE INDEX idx_whatsapps_companyId_status ON "Whatsapps"(companyId, status);
```

### Migraciones de Base de Datos

Las migraciones se encuentran en `backend/src/database/migrations/` y siguen el formato:

```
YYYYMMDDHHMMSS-action-description.ts
```

Ejemplo:
```typescript
// 20250823031739-create-webhook-configs.ts
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("WebhookConfigs", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: Sequelize.STRING,
      url: Sequelize.TEXT,
      companyId: Sequelize.INTEGER,
      // ...
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable("WebhookConfigs");
  }
};
```

---

## 📨 FLUJO DE MENSAJES

### Flujo de Mensajes Entrantes

```
1. Cliente envía mensaje por WhatsApp
   ↓
2. WhatsApp Business API recibe mensaje
   ↓
3. Baileys/WhiskeySockets captura el evento
   ↓
4. wbotMessageListener.ts procesa el mensaje
   ↓
5. Sistema evalúa condiciones:
   - ¿Es mensaje nuevo o de ticket existente?
   - ¿Tiene chatbot activo?
   - ¿Tiene cola asignada?
   - ¿Requiere webhook?
   ↓
6. CreateOrUpdateContactService actualiza/crea contacto
   ↓
7. FindOrCreateTicketService gestiona el ticket
   ↓
8. CreateMessageService guarda mensaje en BD
   ↓
9. Socket.io broadcast a canales relevantes:
   - ticket-{ticketId}
   - company-{companyId}-{status}
   - queue-{queueId}-{status}
   - user-{userId}
   ↓
10. Frontend actualiza UI en tiempo real
```

### Flujo de Mensajes Salientes

```
1. Agente escribe mensaje en frontend
   ↓
2. Frontend envía POST a /api/messages
   ↓
3. SendMessage Controller valida y procesa
   ↓
4. Mensaje se añade a Bull Queue (messageQueue)
   ↓
5. Rate limiting aplica delay (20-60 segundos)
   ↓
6. SendWhatsAppMessage Service procesa envío
   ↓
7. Baileys envía mensaje vía WhatsApp API
   ↓
8. Confirmación de entrega
   ↓
9. Actualización de estado en BD
   ↓
10. Socket.io notifica actualización
```

### Rate Limiting y Control de Flujo

```javascript
// Configuración en queues.ts
const messageQueue = new Bull("messageQueue", {
  redis: {
    host: process.env.IO_REDIS_SERVER,
    port: +(process.env.IO_REDIS_PORT || 6379),
    password: process.env.IO_REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000
    }
  }
});

// Delay aleatorio entre 20-60 segundos
const randomDelay = Math.floor(Math.random() * 40000) + 20000;
```

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### JWT (JSON Web Tokens)

#### Flujo de Autenticación

```
1. Usuario envía credenciales a /auth/login
   ↓
2. Backend valida contra base de datos
   ↓
3. Genera dos tokens:
   - Access Token (15 minutos)
   - Refresh Token (7 días)
   ↓
4. Frontend almacena tokens en localStorage
   ↓
5. Cada request incluye token en header:
   Authorization: Bearer {token}
   ↓
6. Middleware isAuth valida token
   ↓
7. Token expirado → usar refresh token
```

#### Implementación

```typescript
// backend/src/helpers/CreateTokens.ts
export const createAccessToken = (user: User): string => {
  const { id, name, email, companyId, profile } = user;
  
  return sign(
    { 
      usarname: name, 
      profile, 
      id, 
      companyId,
      email
    },
    authConfig.secret,
    {
      expiresIn: authConfig.expiresIn // 15m
    }
  );
};

export const createRefreshToken = (user: User): string => {
  const { id, name, email, companyId, profile, refreshToken } = user;
  
  return sign(
    { 
      usarname: name,
      profile,
      id,
      companyId,
      refreshToken,
      email
    },
    authConfig.refreshSecret,
    {
      expiresIn: authConfig.refreshExpiresIn // 7d
    }
  );
};
```

### Perfiles y Permisos

```typescript
// Perfiles de usuario
enum UserProfile {
  ADMIN = "admin",      // Acceso total
  SUPERVISOR = "supervisor", // Gestión de equipos
  AGENT = "user"        // Atención básica
}

// Middleware de autorización
const isAuth = (req, res, next) => {
  const authToken = req.headers.authorization;
  
  if (!authToken) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
  
  const [, token] = authToken.split(" ");
  
  try {
    const decoded = verify(token, authConfig.secret);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }
};
```

---

## 🎫 SISTEMA DE COLAS Y TICKETS

### Conceptos Fundamentales

- **Ticket**: Representa una conversación entre un contacto y la empresa
- **Cola (Queue)**: Departamento o área de atención
- **Estados de Ticket**:
  - `pending`: Sin asignar, esperando atención
  - `open`: En conversación activa con agente
  - `closed`: Conversación finalizada
  - `group`: Conversación de grupo

### Flujo de Asignación

```
Mensaje Nuevo
     │
     ▼
¿Ticket existente abierto?
     │
     ├─SI─► Añadir mensaje al ticket
     │
     └─NO─► Crear nuevo ticket
              │
              ▼
         ¿WhatsApp tiene cola?
              │
              ├─SI─► Asignar a esa cola
              │
              └─NO─► ¿Chatbot activo?
                       │
                       ├─SI─► Procesar con bot
                       │
                       └─NO─► Cola por defecto
```

### Distribución de Tickets

```typescript
// Lógica de distribución en FindOrCreateTicketService
const ticket = await Ticket.findOne({
  where: {
    contactId,
    status: ["open", "pending"],
    companyId,
    whatsappId
  }
});

if (!ticket) {
  // Crear nuevo ticket
  const newTicket = await Ticket.create({
    contactId,
    companyId,
    whatsappId,
    status: "pending",
    queueId: defaultQueueId,
    isGroup: false,
    unreadMessages: 0
  });
  
  // Emitir evento para notificar
  io.to(`company-${companyId}-pending`).emit(
    `company-${companyId}-ticket`,
    {
      action: "create",
      ticket: newTicket
    }
  );
}
```

---

## 📱 INTEGRACIÓN WHATSAPP

### Baileys/WhiskeySockets

Baileys es una librería de TypeScript/JavaScript que permite conectarse a WhatsApp Web sin usar Selenium o Puppeteer.

#### Gestión de Sesiones

```typescript
// backend/src/libs/wbot.ts
export const initWbot = async (whatsapp: Whatsapp): Promise<WASocket> => {
  return new Promise((resolve, reject) => {
    const io = getIO();
    const sessionName = whatsapp.name;
    
    const { state, saveCreds } = await useMultiFileAuthState(
      `${__dirname}/sessions/${sessionName}`
    );
    
    const wbot = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: logger.child({}),
      version: [2, 2323, 4],
      browser: ["TucanLink", "Chrome", "10.0.0"],
      syncFullHistory: true
    });
    
    wbot.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        // Actualizar QR en base de datos
        await whatsapp.update({ qrcode: qr, status: "qrcode" });
        io.emit(`whatsappSession-${whatsapp.id}`, {
          action: "update",
          session: whatsapp
        });
      }
      
      if (connection === "open") {
        await whatsapp.update({ 
          status: "CONNECTED",
          qrcode: null,
          retries: 0
        });
      }
      
      if (connection === "close") {
        const shouldReconnect = lastDisconnect?.error?.statusCode !== 401;
        if (shouldReconnect) {
          setTimeout(() => initWbot(whatsapp), 5000);
        }
      }
    });
    
    wbot.ev.on("creds.update", saveCreds);
    
    wbot.ev.on("messages.upsert", async (messageUpdate) => {
      // Procesar mensajes entrantes
      handleMessage(messageUpdate, wbot);
    });
    
    resolve(wbot);
  });
};
```

#### Envío de Mensajes

```typescript
// backend/src/services/WbotServices/SendWhatsAppMessage.ts
export const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg
}: Request): Promise<Message> => {
  const wbot = await GetTicketWbot(ticket);
  const number = `${ticket.contact.number}@${
    ticket.isGroup ? "g.us" : "s.whatsapp.net"
  }`;
  
  let options: any = {};
  
  if (quotedMsg) {
    options.quoted = {
      key: quotedMsg.id,
      message: {
        conversation: quotedMsg.body
      }
    };
  }
  
  const sentMessage = await wbot.sendMessage(number, {
    text: body
  }, options);
  
  // Guardar mensaje en base de datos
  const message = await Message.create({
    body,
    ticketId: ticket.id,
    contactId: ticket.contactId,
    fromMe: true,
    messageId: sentMessage.key.id,
    status: "pending",
    companyId: ticket.companyId
  });
  
  return message;
};
```

### Manejo de Archivos Multimedia

```typescript
// Envío de imagen
const sendImage = async (ticket: Ticket, imagePath: string) => {
  const wbot = await GetTicketWbot(ticket);
  const number = formatNumber(ticket.contact.number);
  
  const sentMessage = await wbot.sendMessage(number, {
    image: { url: imagePath },
    caption: "Imagen enviada desde TucanLink"
  });
  
  return sentMessage;
};

// Recepción de audio
const handleAudioMessage = async (msg: proto.IWebMessageInfo) => {
  const audioStream = await downloadMediaMessage(
    msg,
    "stream",
    {},
    {
      logger,
      reuploadRequest: wbot.updateMediaMessage
    }
  );
  
  const fileName = `audio_${Date.now()}.ogg`;
  const filePath = path.join(__dirname, "..", "..", "public", fileName);
  
  await pipeline(
    audioStream as Readable,
    fs.createWriteStream(filePath)
  );
  
  return {
    fileName,
    filePath,
    mediaUrl: `/public/${fileName}`
  };
};
```

---

## 🔗 SISTEMA DE WEBHOOKS

### Arquitectura de Webhooks

El sistema permite enviar eventos a URLs externas para integración con herramientas como n8n, Zapier, Make, etc.

#### Configuración de Webhooks

```typescript
// Modelo WebhookConfig
interface WebhookConfig {
  id: number;
  name: string;
  url: string;
  companyId: number;
  token?: string;
  conditions: {
    sendOnNewTicket?: boolean;
    sendOnMessage?: boolean;
    sendOnTicketUpdate?: boolean;
    sendOnContactUpdate?: boolean;
    filterByQueue?: number[];
    filterByUser?: number[];
    filterByStatus?: string[];
  };
  isActive: boolean;
}
```

#### Evaluador de Webhooks

```typescript
// backend/src/helpers/WebhookEvaluator.ts
export class WebhookEvaluator {
  static async shouldTrigger(
    event: string,
    data: any,
    config: WebhookConfig
  ): Promise<boolean> {
    // Verificar si el webhook está activo
    if (!config.isActive) return false;
    
    // Verificar condiciones según el evento
    switch (event) {
      case "message.created":
        if (!config.conditions.sendOnMessage) return false;
        if (config.conditions.filterByQueue?.length) {
          if (!config.conditions.filterByQueue.includes(data.queueId)) {
            return false;
          }
        }
        break;
        
      case "ticket.created":
        if (!config.conditions.sendOnNewTicket) return false;
        break;
        
      case "ticket.updated":
        if (!config.conditions.sendOnTicketUpdate) return false;
        if (config.conditions.filterByStatus?.length) {
          if (!config.conditions.filterByStatus.includes(data.status)) {
            return false;
          }
        }
        break;
    }
    
    return true;
  }
  
  static async send(
    url: string,
    data: any,
    token?: string
  ): Promise<void> {
    try {
      const headers: any = {
        "Content-Type": "application/json"
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      await axios.post(url, data, { headers, timeout: 30000 });
    } catch (error) {
      logger.error("Webhook send error:", error);
      // No lanzar error para no afectar el flujo principal
    }
  }
}
```

#### Integración en el Flujo de Mensajes

```typescript
// En wbotMessageListener.ts
const handleMessage = async (msg: proto.IWebMessageInfo) => {
  // ... procesamiento del mensaje ...
  
  // Verificar webhooks configurados
  const webhooks = await WebhookConfig.findAll({
    where: {
      companyId: ticket.companyId,
      isActive: true
    }
  });
  
  for (const webhook of webhooks) {
    if (await WebhookEvaluator.shouldTrigger("message.created", message, webhook)) {
      // Enviar webhook de forma asíncrona
      WebhookEvaluator.send(webhook.url, {
        event: "message.created",
        timestamp: new Date(),
        data: {
          message: message.toJSON(),
          ticket: ticket.toJSON(),
          contact: contact.toJSON()
        }
      }, webhook.token);
    }
  }
};
```

---

## 🔌 SOCKET.IO Y TIEMPO REAL

### Arquitectura de WebSockets

Socket.io permite comunicación bidireccional en tiempo real entre el servidor y los clientes.

#### Configuración del Servidor

```typescript
// backend/src/libs/socket.ts
import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

let io: Server;

export const initIO = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    },
    transports: ["websocket", "polling"]
  });
  
  io.on("connection", (socket) => {
    const { userId, companyId } = socket.handshake.query;
    
    logger.info(`Client connected - userId: ${userId}, companyId: ${companyId}`);
    
    // Unir a canales principales
    socket.join(`company-${companyId}-mainchannel`);
    socket.join(`user-${userId}`);
    
    // Manejo de eventos
    socket.on("joinChatBox", (ticketId) => {
      socket.join(`ticket-${ticketId}`);
    });
    
    socket.on("leaveChatBox", (ticketId) => {
      socket.leave(`ticket-${ticketId}`);
    });
    
    socket.on("joinNotification", () => {
      socket.join(`company-${companyId}-notification`);
    });
    
    socket.on("joinTickets", (status) => {
      socket.join(`company-${companyId}-${status}`);
    });
    
    socket.on("disconnect", () => {
      logger.info(`Client disconnected - userId: ${userId}`);
    });
  });
  
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
```

#### Canales y Eventos

```typescript
// Estructura de canales
const channels = {
  // Canal principal de la empresa
  companyMain: `company-${companyId}-mainchannel`,
  
  // Canales por estado de ticket
  companyOpen: `company-${companyId}-open`,
  companyPending: `company-${companyId}-pending`,
  companyClosed: `company-${companyId}-closed`,
  
  // Canal de notificaciones
  companyNotification: `company-${companyId}-notification`,
  
  // Canales de cola
  queuePending: `queue-${queueId}-pending`,
  queueOpen: `queue-${queueId}-open`,
  
  // Canales específicos
  ticket: `ticket-${ticketId}`,
  user: `user-${userId}`
};

// Eventos emitidos
const events = {
  // Mensajes
  "appMessage": "Nuevo mensaje",
  "appMessage:update": "Mensaje actualizado",
  
  // Tickets
  "ticket": "Actualización de ticket",
  "ticket:create": "Nuevo ticket",
  "ticket:update": "Ticket actualizado",
  "ticket:delete": "Ticket eliminado",
  
  // Contactos
  "contact": "Actualización de contacto",
  "contact:update": "Contacto actualizado",
  
  // WhatsApp
  "whatsappSession": "Estado de sesión WhatsApp",
  "whatsappSession:qrcode": "QR Code actualizado",
  
  // Sistema
  "notification": "Notificación del sistema",
  "user:update": "Usuario actualizado"
};
```

#### Cliente (Frontend)

```javascript
// frontend/src/context/Socket/SocketContext.js
import io from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const socketInstance = io(process.env.REACT_APP_BACKEND_URL, {
      transports: ["websocket", "polling"],
      query: {
        userId: user.id,
        companyId: user.companyId
      }
    });
    
    socketInstance.on("connect", () => {
      console.log("Socket connected");
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);
  
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Uso en componentes
const MessagesList = () => {
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
    };
    
    socket.on("appMessage", handleNewMessage);
    
    return () => {
      socket.off("appMessage", handleNewMessage);
    };
  }, [socket]);
};
```

---

## 📧 SISTEMA DE CAMPAÑAS

### Arquitectura de Campañas

El sistema de campañas permite envío masivo de mensajes con control de rate limiting y programación.

#### Estructura de Campaña

```typescript
interface Campaign {
  id: number;
  name: string;
  status: "INATIVA" | "PROGRAMADA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";
  companyId: number;
  contactListId: number;
  scheduledAt?: Date;
  completedAt?: Date;
  mediaPath?: string;
  mediaName?: string;
  message1: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage?: string;
  statusMessage?: "scheduled" | "sent" | "delivered" | "received";
  whatsappId: number;
  delay: number; // segundos entre mensajes
  messageRandom: boolean;
}
```

#### Procesamiento de Campañas

```typescript
// backend/src/queues.ts - Campaign Queue
campaignQueue.process("processCampaign", async (job) => {
  const { campaignId } = job.data;
  
  const campaign = await Campaign.findByPk(campaignId, {
    include: [
      {
        model: ContactList,
        include: [ContactListItem]
      }
    ]
  });
  
  const wbot = await GetWhatsAppSession(campaign.whatsappId);
  const contacts = campaign.contactList.items;
  
  for (const contact of contacts) {
    try {
      // Preparar mensajes
      const messages = [
        campaign.message1,
        campaign.message2,
        campaign.message3,
        campaign.message4,
        campaign.message5
      ].filter(Boolean);
      
      // Si messageRandom está activo, mezclar mensajes
      if (campaign.messageRandom) {
        messages.sort(() => Math.random() - 0.5);
      }
      
      // Enviar mensajes con delay
      for (const message of messages) {
        await sendCampaignMessage({
          wbot,
          contact,
          message,
          campaign
        });
        
        // Esperar delay configurado
        await new Promise(resolve => 
          setTimeout(resolve, campaign.delay * 1000)
        );
      }
      
      // Actualizar estado de envío
      await CampaignShipping.create({
        campaignId: campaign.id,
        contactId: contact.contactId,
        deliveredAt: new Date(),
        confirmationRequestedAt: null
      });
      
    } catch (error) {
      logger.error(`Error sending campaign to ${contact.number}:`, error);
      
      await CampaignShipping.create({
        campaignId: campaign.id,
        contactId: contact.contactId,
        confirmationRequestedAt: null,
        deliveredAt: null
      });
    }
    
    // Rate limiting entre contactos
    await new Promise(resolve => 
      setTimeout(resolve, randomValue(20000, 60000))
    );
  }
  
  // Actualizar estado de la campaña
  await campaign.update({
    status: "FINALIZADA",
    completedAt: new Date()
  });
});
```

#### Programación de Campañas

```typescript
// Scheduler para campañas programadas
const scheduleMonitor = new CronJob("*/1 * * * *", async () => {
  const campaigns = await Campaign.findAll({
    where: {
      status: "PROGRAMADA",
      scheduledAt: {
        [Op.lte]: new Date()
      }
    }
  });
  
  for (const campaign of campaigns) {
    await campaign.update({ status: "EM_ANDAMENTO" });
    
    campaignQueue.add("processCampaign", {
      campaignId: campaign.id
    }, {
      priority: campaign.priority || 0,
      attempts: 3
    });
  }
});

scheduleMonitor.start();
```

---

## 🔧 FLOW BUILDER

### Sistema de Automatización Visual

Flow Builder permite crear flujos de conversación automatizados usando una interfaz visual drag-and-drop.

#### Estructura de un Flow

```typescript
interface FlowBuilder {
  id: number;
  name: string;
  status: "active" | "inactive";
  companyId: number;
  whatsappId?: number;
  userId?: number;
  flow: FlowNode[];
  createdAt: Date;
  updatedAt: Date;
}

interface FlowNode {
  id: string;
  type: "text" | "image" | "audio" | "video" | "question" | "conditional" | "ticket" | "variable";
  position: { x: number; y: number };
  data: {
    label?: string;
    message?: string;
    mediaUrl?: string;
    variable?: string;
    condition?: string;
    options?: Array<{
      label: string;
      value: string;
      targetId: string;
    }>;
    targetId?: string;
  };
  sourceHandle?: string;
  targetHandle?: string;
}
```

#### Ejecución de Flows

```typescript
// backend/src/services/FlowBuilderService/ExecuteFlowService.ts
export const ExecuteFlow = async (
  flowId: number,
  contact: Contact,
  message: string,
  ticket: Ticket
): Promise<void> => {
  const flow = await FlowBuilder.findByPk(flowId);
  if (!flow || flow.status !== "active") return;
  
  const nodes = JSON.parse(flow.flow);
  let currentNode = nodes.find(n => n.type === "start");
  const variables = {};
  
  while (currentNode) {
    switch (currentNode.type) {
      case "text":
        await sendTextMessage(
          ticket,
          replaceVariables(currentNode.data.message, variables)
        );
        currentNode = findNextNode(nodes, currentNode);
        break;
        
      case "question":
        await sendTextMessage(ticket, currentNode.data.message);
        // Guardar estado esperando respuesta
        await ticket.update({
          flowStopped: currentNode.id,
          flowVariables: variables
        });
        return; // Pausar ejecución esperando respuesta
        
      case "conditional":
        const condition = evaluateCondition(
          currentNode.data.condition,
          variables,
          message
        );
        currentNode = findConditionalTarget(
          nodes,
          currentNode,
          condition
        );
        break;
        
      case "variable":
        variables[currentNode.data.variable] = message;
        currentNode = findNextNode(nodes, currentNode);
        break;
        
      case "ticket":
        // Crear o transferir ticket
        if (currentNode.data.action === "transfer") {
          await TransferTicketService({
            ticketId: ticket.id,
            queueId: currentNode.data.queueId,
            userId: currentNode.data.userId
          });
        }
        currentNode = findNextNode(nodes, currentNode);
        break;
    }
    
    // Delay entre nodos
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Reemplazar variables en el texto
const replaceVariables = (text: string, variables: any): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match;
  });
};
```

#### Integración con React Flow (Frontend)

```javascript
// frontend/src/pages/FlowBuilder/index.js
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';

const FlowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);
  
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback((event) => {
    event.preventDefault();
    
    const type = event.dataTransfer.getData('application/reactflow');
    const position = reactFlowInstance.project({
      x: event.clientX,
      y: event.clientY,
    });
    
    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: { label: `${type} node` },
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance]);
  
  const saveFlow = async () => {
    const flowData = {
      nodes,
      edges,
    };
    
    await api.post('/flowbuilder', {
      name: flowName,
      flow: JSON.stringify(flowData),
      status: 'active'
    });
  };
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <MiniMap />
      <Controls />
      <Background />
    </ReactFlow>
  );
};
```

---

## 🏢 MULTI-TENANCY

### Isolamento de Dados

Todos os dados são segregados por `companyId` para garantir isolamento completo entre empresas.

#### Implementação no Backend

```typescript
// Middleware para adicionar companyId em todas as queries
const addCompanyFilter = (req, res, next) => {
  const { companyId } = req.user;
  
  // Adicionar filtro automático
  if (req.query.filters) {
    req.query.filters = {
      ...req.query.filters,
      companyId
    };
  } else {
    req.query.filters = { companyId };
  }
  
  next();
};

// Nos modelos Sequelize
@Table
class Contact extends Model {
  @BelongsTo(() => Company)
  company: Company;
  
  @ForeignKey(() => Company)
  @Column
  companyId: number;
  
  // Hook para garantir companyId
  @BeforeCreate
  static addCompanyId(instance: Contact) {
    if (!instance.companyId) {
      throw new Error("companyId is required");
    }
  }
}

// Nos serviços
const ListContactsService = async ({
  companyId,
  searchParam,
  pageNumber
}: Request): Promise<Response> => {
  const whereCondition = {
    companyId, // Sempre filtrar por empresa
    [Op.or]: [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { number: { [Op.iLike]: `%${searchParam}%` } }
    ]
  };
  
  const contacts = await Contact.findAndCountAll({
    where: whereCondition,
    limit: 20,
    offset: (pageNumber - 1) * 20
  });
  
  return contacts;
};
```

#### Planos e Limites

```typescript
interface Plan {
  id: number;
  name: string;
  users: number; // Limite de usuários
  connections: number; // Limite de WhatsApp
  queues: number; // Limite de filas
  value: number; // Valor mensal
  useWhatsapp: boolean;
  useFacebook: boolean;
  useInstagram: boolean;
  useCampaigns: boolean;
  useSchedules: boolean;
  useInternalChat: boolean;
  useExternalApi: boolean;
  useIntegrations: boolean;
  useOpenAi: boolean;
}

// Verificação de limites
const checkPlanLimits = async (companyId: number, resource: string) => {
  const company = await Company.findByPk(companyId, {
    include: [Plan]
  });
  
  const plan = company.plan;
  
  switch (resource) {
    case "users":
      const userCount = await User.count({ where: { companyId } });
      if (userCount >= plan.users) {
        throw new AppError("User limit reached", 403);
      }
      break;
      
    case "connections":
      const whatsappCount = await Whatsapp.count({ where: { companyId } });
      if (whatsappCount >= plan.connections) {
        throw new AppError("Connection limit reached", 403);
      }
      break;
  }
};
```

---

## 📂 SISTEMA DE ARCHIVOS

### Almacenamiento Local

```typescript
// Configuración de Multer
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const companyId = req.user.companyId;
      const dir = path.join(
        __dirname,
        "..",
        "..",
        "public",
        `company${companyId}`
      );
      
      // Crear directorio si no existe
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueName}${ext}`);
    }
  }),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "audio/mpeg",
      "audio/ogg",
      "video/mp4",
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});
```

### Procesamiento de Imágenes

```typescript
import sharp from "sharp";

const processImage = async (filePath: string): Promise<string> => {
  const outputPath = filePath.replace(/\.[^/.]+$/, "_thumb.jpg");
  
  await sharp(filePath)
    .resize(800, 800, {
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
  
  return outputPath;
};
```

---

## ⚙️ CONFIGURACIÓN DE ENTORNO

### Variables de Entorno Backend (.env)

```bash
# Node
NODE_ENV=production

# URLs
BACKEND_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
PROXY_PORT=443

# Server
PORT=8080

# Database
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=tucanlink
DB_PASS=tucanlink2024
DB_NAME=tucanlink

# Redis
REDIS_URI=redis://:tucanlink2024@127.0.0.1:6379
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000
IO_REDIS_SERVER=localhost
IO_REDIS_PORT=6379
IO_REDIS_PASSWORD=tucanlink2024

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aqui

# Limits
USER_LIMIT=100
CONNECTIONS_LIMIT=10
CLOSED_SEND_BY_ME=true

# Email
MAIL_HOST=smtp.gmail.com
MAIL_USER=seu@gmail.com
MAIL_PASS=sua_senha_app
MAIL_FROM=seu@gmail.com
MAIL_PORT=465

# Storage
UPLOAD_PATH=./public
MAX_FILE_SIZE=20971520

# Logging
LOG_LEVEL=info
DB_DEBUG=false

# WhatsApp
WHATSAPP_VERSION=[2,2323,4]
WHATSAPP_BROWSER=["TucanLink","Chrome","10.0.0"]

# OpenAI (Opcional)
OPENAI_API_KEY=sua_chave_api

# Gerencianet (Opcional - Pagamentos)
GERENCIANET_SANDBOX=false
GERENCIANET_CLIENT_ID=seu_client_id
GERENCIANET_CLIENT_SECRET=seu_client_secret
GERENCIANET_PIX_CERT=caminho_certificado
GERENCIANET_PIX_KEY=chave_pix
```

### Variables de Entorno Frontend (.env)

```bash
# Backend URL
REACT_APP_BACKEND_URL=http://localhost:8080

# Auto Close Tickets (hours)
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24

# Features Flags
REACT_APP_ENABLE_WEBHOOKS=true
REACT_APP_ENABLE_CAMPAIGNS=true
REACT_APP_ENABLE_FLOW_BUILDER=true
REACT_APP_ENABLE_INTEGRATIONS=true

# Google Analytics (Opcional)
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Sentry (Opcional - Error Tracking)
REACT_APP_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## 🔌 APIS Y ENDPOINTS

### Estructura de APIs REST

```typescript
// Patrón de respuesta estándar
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    count: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Endpoints Principales

#### Autenticación
```
POST   /auth/login           - Login de usuario
POST   /auth/refresh         - Renovar token
POST   /auth/logout          - Cerrar sesión
POST   /auth/forgot-password - Recuperar contraseña
POST   /auth/reset-password  - Resetear contraseña
```

#### Usuarios
```
GET    /users                - Listar usuarios
GET    /users/:id            - Obtener usuario
POST   /users                - Crear usuario
PUT    /users/:id            - Actualizar usuario
DELETE /users/:id            - Eliminar usuario
GET    /users/profile        - Perfil del usuario actual
```

#### Contactos
```
GET    /contacts             - Listar contactos
GET    /contacts/:id         - Obtener contacto
POST   /contacts             - Crear contacto
PUT    /contacts/:id         - Actualizar contacto
DELETE /contacts/:id         - Eliminar contacto
POST   /contacts/import      - Importar contactos (CSV/Excel)
GET    /contacts/export      - Exportar contactos
```

#### Tickets
```
GET    /tickets              - Listar tickets
GET    /tickets/:id          - Obtener ticket
POST   /tickets              - Crear ticket
PUT    /tickets/:id          - Actualizar ticket
DELETE /tickets/:id          - Eliminar ticket
PUT    /tickets/:id/transfer - Transferir ticket
PUT    /tickets/:id/accept   - Aceptar ticket
PUT    /tickets/:id/close    - Cerrar ticket
```

#### Mensajes
```
GET    /messages/:ticketId   - Listar mensajes del ticket
POST   /messages/:ticketId   - Enviar mensaje
PUT    /messages/:id         - Editar mensaje
DELETE /messages/:id         - Eliminar mensaje
POST   /messages/:id/ack     - Marcar como leído
```

#### WhatsApp
```
GET    /whatsapp             - Listar conexiones
GET    /whatsapp/:id         - Obtener conexión
POST   /whatsapp             - Crear conexión
PUT    /whatsapp/:id         - Actualizar conexión
DELETE /whatsapp/:id         - Eliminar conexión
GET    /whatsapp/:id/qr      - Obtener QR Code
POST   /whatsapp/:id/start   - Iniciar sesión
POST   /whatsapp/:id/restart - Reiniciar conexión
```

#### Colas
```
GET    /queues               - Listar colas
GET    /queues/:id           - Obtener cola
POST   /queues               - Crear cola
PUT    /queues/:id           - Actualizar cola
DELETE /queues/:id           - Eliminar cola
POST   /queues/:id/users     - Asignar usuarios
```

#### Campañas
```
GET    /campaigns            - Listar campañas
GET    /campaigns/:id        - Obtener campaña
POST   /campaigns            - Crear campaña
PUT    /campaigns/:id        - Actualizar campaña
DELETE /campaigns/:id        - Eliminar campaña
POST   /campaigns/:id/start  - Iniciar campaña
POST   /campaigns/:id/cancel - Cancelar campaña
GET    /campaigns/:id/report - Reporte de campaña
```

#### Flow Builder
```
GET    /flowbuilder          - Listar flows
GET    /flowbuilder/:id      - Obtener flow
POST   /flowbuilder          - Crear flow
PUT    /flowbuilder/:id      - Actualizar flow
DELETE /flowbuilder/:id      - Eliminar flow
POST   /flowbuilder/:id/test - Probar flow
```

#### Webhooks
```
GET    /webhooks             - Listar webhooks
GET    /webhooks/:id         - Obtener webhook
POST   /webhooks             - Crear webhook
PUT    /webhooks/:id         - Actualizar webhook
DELETE /webhooks/:id         - Eliminar webhook
POST   /webhooks/:id/test   - Probar webhook
```

#### Integraciones
```
GET    /integrations         - Listar integraciones
GET    /integrations/:id     - Obtener integración
POST   /integrations         - Crear integración
PUT    /integrations/:id     - Actualizar integración
DELETE /integrations/:id     - Eliminar integración
```

#### Reportes y Analytics
```
GET    /reports/dashboard    - Dashboard general
GET    /reports/tickets      - Reporte de tickets
GET    /reports/users        - Reporte de usuarios
GET    /reports/messages     - Reporte de mensajes
GET    /reports/contacts     - Reporte de contactos
GET    /reports/export       - Exportar reportes
```

#### Configuraciones
```
GET    /settings             - Obtener configuraciones
PUT    /settings             - Actualizar configuraciones
GET    /settings/company     - Configuración de empresa
PUT    /settings/company     - Actualizar empresa
```

### Paginación

```typescript
// Request
GET /api/contacts?page=1&limit=20&searchParam=john&order=ASC

// Response
{
  "data": [...],
  "pagination": {
    "page": 1,
    "count": 20,
    "total": 150,
    "hasMore": true
  }
}
```

### Filtros y Búsqueda

```typescript
// Búsqueda avanzada
GET /api/tickets?filters={
  "status": ["open", "pending"],
  "queueId": [1, 2],
  "userId": 5,
  "dateStart": "2024-01-01",
  "dateEnd": "2024-12-31",
  "tags": ["vip", "urgent"],
  "searchParam": "problema"
}
```

---

## 📝 SISTEMA DE LOGS

### Configuración de Winston

```typescript
// backend/src/utils/logger.ts
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Archivo de errores
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Archivo combinado
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Console en desarrollo
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

### Logs de Aplicación

```typescript
// Ejemplos de uso
logger.info("Server started", {
  port: process.env.PORT,
  environment: process.env.NODE_ENV
});

logger.error("Database connection failed", {
  error: error.message,
  stack: error.stack
});

logger.warn("Rate limit exceeded", {
  ip: req.ip,
  endpoint: req.path
});

logger.debug("Processing message", {
  messageId: message.id,
  ticketId: ticket.id
});
```

---

## 🔒 SEGURIDAD

### Medidas de Seguridad Implementadas

#### 1. Autenticación y Autorización
- JWT con refresh tokens
- Passwords hasheados con bcrypt (10 rounds)
- Sesiones con expiración configurable
- Rate limiting por IP y usuario

#### 2. Validación de Datos
```typescript
// Validación con Yup
const ticketSchema = Yup.object().shape({
  status: Yup.string().oneOf(["open", "closed", "pending"]),
  userId: Yup.number().positive().integer(),
  contactId: Yup.number().required().positive().integer(),
  queueId: Yup.number().positive().integer().nullable()
});

const validateTicket = async (data) => {
  try {
    await ticketSchema.validate(data);
  } catch (err) {
    throw new AppError(err.message, 400);
  }
};
```

#### 3. Sanitización de Entradas
```typescript
import DOMPurify from "isomorphic-dompurify";

const sanitizeMessage = (message: string): string => {
  return DOMPurify.sanitize(message, {
    ALLOWED_TAGS: ["b", "i", "u", "strike", "code"],
    ALLOWED_ATTR: []
  });
};
```

#### 4. CORS Configuration
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
```

#### 5. Headers de Seguridad
```typescript
import helmet from "helmet";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### 6. SQL Injection Prevention
```typescript
// Usar siempre parameterized queries
const contacts = await sequelize.query(
  "SELECT * FROM Contacts WHERE companyId = :companyId AND name LIKE :search",
  {
    replacements: {
      companyId: req.user.companyId,
      search: `%${searchParam}%`
    },
    type: QueryTypes.SELECT
  }
);
```

#### 7. File Upload Security
```typescript
const fileFilter = (req, file, cb) => {
  // Verificar tipo MIME real
  const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = fileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = fileTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

// Escaneo de virus (opcional)
const scanFile = async (filePath) => {
  // Integración con ClamAV o similar
};
```

---

## ⚡ OPTIMIZACIÓN Y PERFORMANCE

### Estrategias de Optimización

#### 1. Database Query Optimization

```typescript
// Uso de includes y attributes para reducir queries
const tickets = await Ticket.findAll({
  where: { companyId },
  attributes: ["id", "status", "createdAt"],
  include: [
    {
      model: Contact,
      attributes: ["id", "name", "number"],
      required: true
    },
    {
      model: User,
      attributes: ["id", "name"],
      required: false
    },
    {
      model: Queue,
      attributes: ["id", "name", "color"],
      required: false
    }
  ],
  order: [["updatedAt", "DESC"]],
  limit: 20,
  offset: (page - 1) * 20
});
```

#### 2. Caching con Redis

```typescript
// Cache de configuraciones
const getCompanySettings = async (companyId: number) => {
  const cacheKey = `settings:${companyId}`;
  
  // Buscar en cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Buscar en BD
  const settings = await Setting.findAll({
    where: { companyId }
  });
  
  // Guardar en cache por 5 minutos
  await redis.setex(cacheKey, 300, JSON.stringify(settings));
  
  return settings;
};
```

#### 3. Lazy Loading en Frontend

```javascript
// Carga diferida de componentes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const FlowBuilder = lazy(() => import("./pages/FlowBuilder"));
const Reports = lazy(() => import("./pages/Reports"));

// Uso con Suspense
<Suspense fallback={<Loading />}>
  <Route path="/dashboard" component={Dashboard} />
</Suspense>
```

#### 4. Debounce y Throttle

```javascript
// Debounce para búsqueda
const debouncedSearch = useMemo(
  () => debounce((value) => {
    searchContacts(value);
  }, 500),
  []
);

// Throttle para scroll
const throttledScroll = useMemo(
  () => throttle(() => {
    loadMoreMessages();
  }, 1000),
  []
);
```

#### 5. Optimización de Imágenes

```typescript
// Generación de thumbnails
const generateThumbnail = async (imagePath: string) => {
  const thumbnail = await sharp(imagePath)
    .resize(200, 200, {
      fit: "cover",
      position: "center"
    })
    .jpeg({ quality: 70, progressive: true })
    .toBuffer();
  
  return thumbnail;
};
```

#### 6. Connection Pooling

```typescript
// Configuración de pool de PostgreSQL
const sequelize = new Sequelize({
  dialect: "postgres",
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
});

// Pool de Redis
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});
```

#### 7. Compresión

```typescript
import compression from "compression";

app.use(compression({
  level: 6,
  threshold: 10 * 1024, // 10KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

### Métricas de Performance

```typescript
// Monitoreo de tiempo de respuesta
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    
    logger.info("Request processed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    
    // Alertar si es muy lento
    if (duration > 3000) {
      logger.warn("Slow request detected", {
        path: req.path,
        duration
      });
    }
  });
  
  next();
});
```

---

## 📚 NOTAS ADICIONALES

### Versiones Importantes

- **Sequelize**: v5.22.5 (NO v6+) - Importante para sintaxis y decoradores
- **Node.js**: v20.x con `NODE_OPTIONS=--openssl-legacy-provider` para Node 17+
- **PostgreSQL**: v14 con tablas PascalCase con comillas
- **React Scripts**: v3.4.3 requiere configuración especial para Node moderno

### Comandos Útiles de Desarrollo

```bash
# Backend
cd backend
npm run dev:server    # Desarrollo con hot-reload
npm run build         # Compilar TypeScript
npm test              # Ejecutar tests
npm run lint          # Verificar código

# Frontend
cd frontend
npm start             # Desarrollo
npm run build         # Build de producción
npm test              # Tests
npm run analyze       # Analizar bundle

# Base de Datos
npx sequelize db:migrate           # Ejecutar migraciones
npx sequelize db:migrate:undo      # Revertir última migración
npx sequelize db:seed:all          # Ejecutar seeds
npx sequelize migration:generate   # Crear nueva migración

# Docker
docker-compose up -d                # Levantar servicios
docker-compose logs -f backend      # Ver logs
docker-compose restart backend      # Reiniciar servicio

# PM2 (Producción)
pm2 start ecosystem.config.js       # Iniciar aplicación
pm2 logs tucanlink                  # Ver logs
pm2 restart tucanlink-backend       # Reiniciar backend
pm2 monit                           # Monitor en tiempo real
```

### Troubleshooting Común

| Problema | Causa | Solución |
|----------|-------|----------|
| ERR_WAPP_NOT_INITIALIZED | WhatsApp desconectado | Reconectar sesión WhatsApp |
| Migration fails | TypeScript no compilado | Ejecutar `npm run build` primero |
| Frontend no inicia | Node 17+ sin legacy SSL | Agregar `NODE_OPTIONS=--openssl-legacy-provider` |
| Queue not processing | Redis desconectado | Verificar conexión Redis |
| Socket.io no conecta | CORS o proxy mal configurado | Verificar URLs y configuración Nginx |
| Mensajes no llegan | Rate limiting activo | Esperar delay configurado |
| Usuario no ve tickets | Sin permisos o cola | Verificar asignación de colas |

### Contacto y Soporte

- **Empresa**: Atendechat
- **Website**: https://atendechat.com
- **Producción**: https://tucanlink.ianebula.com
- **Desarrollador**: Johan Bermudez

---

*Última actualización: Agosto 2025*
*Versión del sistema: TucanLink v6.0.0*
*Este documento es la fuente única de verdad técnica para el proyecto TucanLink CRM*