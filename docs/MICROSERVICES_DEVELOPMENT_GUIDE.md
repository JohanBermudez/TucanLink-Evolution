# 📚 GUÍA COMPLETA DE DESARROLLO DE MICROSERVICIOS - TUCANLINK

## 🎯 INTRODUCCIÓN

### ¿Qué es TucanLink?
TucanLink es un sistema CRM de gestión de WhatsApp Business que permite la atención multiagente, automatización de respuestas, y gestión completa de conversaciones empresariales. La arquitectura ha evolucionado hacia microservicios mediante el **API Bridge**, permitiendo desarrollo modular sin afectar el núcleo del sistema.

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE/FRONTEND                         │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                      NGINX API GATEWAY (:80)                    │
│  ┌──────────────┬──────────────┬──────────────────────────┐   │
│  │   /api/core  │ /api/bridge  │  /api/modules/*          │   │
│  └──────┬───────┴──────┬───────┴──────────┬───────────────┘   │
└─────────┼──────────────┼──────────────────┼────────────────────┘
          │              │                  │
    ┌─────▼─────┐  ┌─────▼─────┐    ┌──────▼──────┐
    │  CORE     │  │   API     │    │   MÓDULOS   │
    │  (:8080)  │  │  BRIDGE   │    │  EXTERNOS   │
    │           │  │  (:8090)  │    │  (:8081+)   │
    │ ✅ Sessions│  │ ✅ CRUD   │    │ ✅ Logic    │
    │ ✅ Socket  │  │ ✅ Multi  │    │ ✅ APIs     │
    │ ✅ WhatsApp│  │ ✅ Auth   │    │             │
    └─────┬─────┘  └─────┬─────┘    └──────┬──────┘
          │              │                  │
    ┌─────▼──────────────▼──────────────────▼─────┐
    │           POSTGRESQL DATABASE                │
    │         (Compartida - Multi-tenant)          │
    └──────────────────────────────────────────────┘
```

### ⚠️ **IMPORTANTE: Separación de Responsabilidades**

| Componente | Responsabilidad | Acceso |
|------------|----------------|--------|
| **Core Service** | Control de sesiones WhatsApp, Socket.io, conexiones activas | JWT Auth |
| **API Bridge** | CRUD operations, Multi-tenancy, API Gateway | API Keys |
| **Módulos** | Lógica de negocio, integraciones, automatización | Bridge SDK |

### Principios Fundamentales
1. **Zero Downtime**: El servicio WhatsApp NUNCA debe interrumpirse
2. **No Modificación del Core**: El código existente permanece intacto
3. **Multi-tenancy**: Aislamiento completo por `companyId`
4. **API-First**: Toda funcionalidad expuesta vía REST API
5. **Escalabilidad Horizontal**: Módulos independientes y escalables
6. **Separación Clara**: Core = Sessions, Bridge = CRUD, Modules = Logic

### 📊 Estado Actual de APIs

| API | Estado | Bridge Endpoints | Core Endpoints | Descripción |
|-----|--------|------------------|----------------|-------------|
| ✅ **Tickets** | Operativa | 8 | 0 | Gestión completa de tickets |
| ✅ **Messages** | Operativa | 6 | 0 | Envío/recepción WhatsApp |
| ✅ **Contacts** | Operativa | 8 | 0 | Gestión de contactos |
| ✅ **Queues** | Operativa | 6 | 0 | Gestión de colas |
| ✅ **WhatsApp** | **Dividido** | 6 | 4 | **CRUD (Bridge) + Control (Core)** |
| ✅ **Users** | Operativa | 7 | 0 | Gestión de usuarios |
| ✅ **Tags** | Operativa | 7 | 0 | Sistema de etiquetas |
| ✅ **Companies** | Operativa | 3 | 0 | Multi-tenancy |
| ✅ **Settings** | Operativa | 5 | 0 | Configuraciones |
| ✅ **Schedules** | Operativa | 6 | 0 | Mensajes programados |

### ⚠️ **Cambios Críticos de Arquitectura**

**❌ DEPRECATED (No usar más):**
- `POST /api/bridge/v1/whatsapp/:id/start` 
- `POST /api/bridge/v1/whatsapp/:id/restart`
- `POST /api/bridge/v1/whatsapp/:id/disconnect`

**✅ NUEVOS ENDPOINTS (Core Service):**
- `POST /whatsapp/:id/start` (JWT Auth)
- `POST /whatsapp/:id/restart` (JWT Auth)  
- `POST /whatsapp/:id/disconnect` (JWT Auth)
- `GET /whatsapp/:id/qr` (JWT Auth)

## 🚀 INICIO RÁPIDO

### Requisitos Previos
- Node.js 20.x
- PostgreSQL 13+
- Redis (opcional para caché)
- Docker & Docker Compose (recomendado)

### Instalación del Sistema Base

```bash
# Clonar repositorio
git clone https://github.com/tucanlink/v2tucanlink.git
cd V2TucanLink

# Instalar dependencias
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
npm run db:migrate

# Iniciar servicios
npm run dev          # Core en puerto 8080
npm run api:bridge   # API Bridge en puerto 8090
```

### Verificación del Sistema

```bash
# Verificar Core
curl http://localhost:8080/health

# Verificar API Bridge
curl http://localhost:8090/api/bridge/v1/health

# Ver documentación Swagger
open http://localhost:8090/api/bridge/docs

# Status completo con indicadores visuales
curl http://localhost:8090/api/bridge/v1/status
```

## 🔌 API BRIDGE - ARQUITECTURA

### Componentes Principales

#### 1. **Servidor Express** (`/src/api/bridge/server.ts`)
- Puerto: 8090
- Middleware: CORS, Helmet, Compression
- Autenticación: JWT + API Keys
- WebSocket: Socket.io para eventos real-time
- Swagger UI integrado

#### 2. **Sistema de Autenticación**

**Tres métodos disponibles:**

```javascript
// 1. JWT Token (Producción)
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
}

// 2. API Key (Integraciones)
headers: {
  'X-API-Key': 'tlk_live_abc123...'
}

// 3. Development Mode (Solo desarrollo)
GET /api/bridge/v1/tickets?companyId=1
```

#### 3. **Estructura de Directorios**

```
backend/src/api/bridge/
├── v1/
│   ├── controllers/     # Lógica de negocio
│   ├── routes/          # Definición de endpoints
│   ├── middleware/      # Auth, validación, etc.
│   ├── validators/      # Esquemas Joi
│   ├── services/        # Servicios compartidos
│   ├── models/          # Modelos Sequelize
│   ├── utils/           # Utilidades
│   └── swagger/         # Documentación OpenAPI
├── config/              # Configuración central
├── tests/               # Tests unitarios e integración
└── server.ts           # Entry point

```

## 📋 APIS DISPONIBLES

### Status del Sistema
El sistema incluye un dashboard visual de status en `/api/bridge/v1/status`:

```json
{
  "overall": {
    "status": "operational",
    "indicator": "✅ All Systems Operational",
    "operational": 12,
    "degraded": 0,
    "down": 0
  },
  "apis": [
    {
      "name": "Tickets",
      "status": "operational",
      "responseTime": 45,
      "indicator": "✅",
      "endpoint": "/api/bridge/v1/tickets"
    }
    // ... más APIs
  ]
}
```

### 1. **Tickets API** 
**Base URL:** `/api/bridge/v1/tickets`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar tickets con filtros |
| POST | / | Crear nuevo ticket |
| GET | /:id | Obtener ticket específico |
| PUT | /:id | Actualizar ticket |
| DELETE | /:id | Eliminar ticket |
| POST | /:id/messages | Enviar mensaje en ticket |
| PUT | /:id/status | Cambiar status |
| POST | /:id/transfer | Transferir a otro agente |

**Ejemplo de uso:**
```bash
# Listar tickets abiertos
curl -H "X-API-Key: $API_KEY" \
  "http://localhost:8090/api/bridge/v1/tickets?status=open&limit=10"

# Crear ticket
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "contactId": 123,
    "queueId": 1,
    "userId": 5,
    "status": "open",
    "isGroup": false
  }' \
  http://localhost:8090/api/bridge/v1/tickets
```

### 2. **Messages API** 
**Base URL:** `/api/bridge/v1/messages`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /send | Enviar mensaje WhatsApp |
| GET | / | Listar mensajes |
| GET | /ticket/:ticketId | Mensajes de un ticket |
| PUT | /:id/read | Marcar como leído |
| DELETE | /:id | Eliminar mensaje |
| GET | /stats | Estadísticas de mensajes |

**Ejemplo envío de mensaje:**
```javascript
const sendMessage = async () => {
  const response = await fetch('http://localhost:8090/api/bridge/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'tlk_live_abc123...'
    },
    body: JSON.stringify({
      ticketId: 456,
      body: "Hola! ¿En qué puedo ayudarte?",
      quotedMsgId: null
    })
  });
  
  const result = await response.json();
  console.log('Mensaje enviado:', result);
};
```

### 3. **Contacts API**
**Base URL:** `/api/bridge/v1/contacts`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar contactos |
| POST | / | Crear contacto |
| GET | /:id | Obtener contacto |
| PUT | /:id | Actualizar contacto |
| DELETE | /:id | Eliminar contacto |
| GET | /search | Buscar por número/nombre |
| POST | /check-number | Verificar número WhatsApp |
| POST | /import | Importar contactos masivos |

### 4. **WhatsApp Sessions API**

#### **⚠️ IMPORTANTE: Cambio Arquitectural**

**Las operaciones de control de sesión se han movido al Core Service para acceso directo a Socket.io**

#### **API Bridge** (`/api/bridge/v1/whatsapp`) - **CRUD Only**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar conexiones |
| POST | / | Crear nueva conexión |
| GET | /:id | Obtener detalles |
| PUT | /:id | Actualizar configuración |
| DELETE | /:id | Eliminar conexión |
| GET | /:id/qr | Obtener QR almacenado (read-only) |

#### **Core Service** (`/whatsapp`) - **Session Control** 

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | /:id/start | Iniciar sesión y generar QR | JWT |
| POST | /:id/restart | Reiniciar sesión | JWT |
| POST | /:id/disconnect | Desconectar sesión | JWT |
| GET | /:id/qr | Obtener QR activo | JWT |

**Flujo Completo para Nueva Conexión:**
```javascript
// 1. Crear sesión en API Bridge
const session = await fetch('/api/bridge/v1/whatsapp', {
  method: 'POST',
  headers: { 'X-API-Key': apiKey },
  body: JSON.stringify({ name: 'Bot Ventas' })
});

const { data: whatsapp, coreEndpoints } = await session.json();
console.log('Usar endpoints del Core:', coreEndpoints);

// 2. Iniciar sesión en Core Service (requiere JWT)
const startResponse = await fetch(`http://core:8080/whatsapp/${whatsapp.id}/start`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

// 3. Obtener QR del Core Service
const qrResponse = await fetch(`http://core:8080/whatsapp/${whatsapp.id}/qr`, {
  headers: { 'Authorization': `Bearer ${jwtToken}` }
});
const { data } = await qrResponse.json();

// 4. Mostrar QR al usuario para escanear
console.log('QR Code:', data.qrcode);
```

### 5. **Users API**
**Base URL:** `/api/bridge/v1/users`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar usuarios |
| POST | / | Crear usuario |
| GET | /:id | Obtener usuario |
| PUT | /:id | Actualizar usuario |
| DELETE | /:id | Eliminar usuario |
| PUT | /:id/queues | Asignar colas |
| PUT | /:id/status | Cambiar status online/offline |

### 6. **Queues API**
**Base URL:** `/api/bridge/v1/queues`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar colas |
| POST | / | Crear cola |
| GET | /:id | Obtener cola |
| PUT | /:id | Actualizar cola |
| DELETE | /:id | Eliminar cola |
| GET | /:id/users | Usuarios asignados |

### 7. **Tags API**
**Base URL:** `/api/bridge/v1/tags`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar etiquetas |
| POST | / | Crear etiqueta |
| PUT | /:id | Actualizar etiqueta |
| DELETE | /:id | Eliminar etiqueta |
| POST | /tickets/:ticketId/add | Agregar a ticket |
| DELETE | /tickets/:ticketId/remove/:tagId | Quitar de ticket |

### 8. **Companies API**
**Base URL:** `/api/bridge/v1/companies`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar empresas |
| POST | / | Crear empresa |
| GET | /:id | Obtener empresa |
| PUT | /:id | Actualizar empresa |
| DELETE | /:id | Eliminar empresa |
| GET | /:id/plan | Plan actual |
| PUT | /:id/plan | Cambiar plan |

### 9. **Settings API**
**Base URL:** `/api/bridge/v1/settings`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar configuraciones |
| GET | /:key | Obtener por clave |
| PUT | /:key | Actualizar valor |
| POST | / | Crear configuración |
| DELETE | /:key | Eliminar configuración |

### 10. **Schedules API**
**Base URL:** `/api/bridge/v1/schedules`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | / | Listar programaciones |
| POST | / | Crear programación |
| GET | /:id | Obtener programación |
| PUT | /:id | Actualizar |
| DELETE | /:id | Eliminar |
| POST | /:id/execute | Ejecutar ahora |

## 🔧 DESARROLLO DE NUEVOS MÓDULOS

### Estructura de un Módulo

```
modules/mi-modulo/
├── src/
│   ├── index.ts           # Entry point
│   ├── routes/            # Endpoints del módulo
│   ├── services/          # Lógica de negocio
│   ├── bridge/            # Cliente API Bridge
│   └── config.ts          # Configuración
├── Dockerfile
├── package.json
└── README.md
```

### Plantilla Base de Módulo

```typescript
// modules/mi-modulo/src/index.ts
import express from 'express';
import { TucanLinkBridge } from './bridge/client';

const app = express();
const bridge = new TucanLinkBridge({
  apiKey: process.env.BRIDGE_API_KEY,
  baseUrl: process.env.BRIDGE_URL || 'http://localhost:8090'
});

// Middleware
app.use(express.json());

// Rutas del módulo
app.post('/api/modules/mi-modulo/process', async (req, res) => {
  try {
    // Obtener datos del Bridge
    const tickets = await bridge.tickets.list({ status: 'open' });
    
    // Lógica del módulo
    const processed = await processTickets(tickets);
    
    // Enviar mensaje vía Bridge
    await bridge.messages.send({
      ticketId: processed.ticketId,
      body: 'Procesado automáticamente'
    });
    
    res.json({ success: true, processed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', module: 'mi-modulo' });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Módulo MI-MODULO corriendo en puerto ${PORT}`);
});
```

### Cliente Bridge SDK

```typescript
// modules/mi-modulo/src/bridge/client.ts
import axios, { AxiosInstance } from 'axios';

export class TucanLinkBridge {
  private bridgeClient: AxiosInstance;
  private coreClient: AxiosInstance;
  
  public tickets: TicketsAPI;
  public messages: MessagesAPI;
  public contacts: ContactsAPI;
  public queues: QueuesAPI;
  public users: UsersAPI;
  public whatsapp: WhatsAppAPI; // CRUD operations
  public whatsappSessions: WhatsAppSessionsAPI; // Session control
  
  constructor(config: BridgeConfig) {
    // API Bridge client (API Keys)
    this.bridgeClient = axios.create({
      baseURL: config.bridgeUrl || 'http://localhost:8090',
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Core Service client (JWT Auth)
    this.coreClient = axios.create({
      baseURL: config.coreUrl || 'http://localhost:8080',
      headers: {
        'Authorization': `Bearer ${config.jwtToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    // Inicializar APIs
    this.tickets = new TicketsAPI(this.bridgeClient);
    this.messages = new MessagesAPI(this.bridgeClient);
    this.contacts = new ContactsAPI(this.bridgeClient);
    this.queues = new QueuesAPI(this.bridgeClient);
    this.users = new UsersAPI(this.bridgeClient);
    this.whatsapp = new WhatsAppAPI(this.bridgeClient); // CRUD only
    this.whatsappSessions = new WhatsAppSessionsAPI(this.coreClient); // Session control
    
    // Setup retry for both clients
    this.setupRetry(this.bridgeClient);
    this.setupRetry(this.coreClient);
  }
  
  private setupRetry(client: AxiosInstance) {
    client.interceptors.response.use(
      response => response,
      async error => {
        const config = error.config;
        
        // Retry logic
        if (error.response?.status === 503 && !config.__retryCount) {
          config.__retryCount = 0;
        }
        
        if (config.__retryCount < 3) {
          config.__retryCount += 1;
          
          // Exponential backoff
          const delay = Math.pow(2, config.__retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return client(config);
        }
        
        return Promise.reject(error);
      }
    );
  }
}

// Ejemplo de API específica
class TicketsAPI {
  constructor(private client: AxiosInstance) {}
  
  async list(filters?: TicketFilters): Promise<Ticket[]> {
    const { data } = await this.client.get('/api/bridge/v1/tickets', {
      params: filters
    });
    return data;
  }
  
  async create(ticket: CreateTicketDTO): Promise<Ticket> {
    const { data } = await this.client.post('/api/bridge/v1/tickets', ticket);
    return data;
  }
  
  async get(id: number): Promise<Ticket> {
    const { data } = await this.client.get(`/api/bridge/v1/tickets/${id}`);
    return data;
  }
  
  async update(id: number, updates: Partial<Ticket>): Promise<Ticket> {
    const { data } = await this.client.put(`/api/bridge/v1/tickets/${id}`, updates);
    return data;
  }
}

// Nueva API de WhatsApp CRUD (API Bridge)
class WhatsAppAPI {
  constructor(private client: AxiosInstance) {}
  
  async list(filters?: WhatsAppFilters): Promise<WhatsApp[]> {
    const { data } = await this.client.get('/api/bridge/v1/whatsapp', {
      params: filters
    });
    return data.data.whatsapps;
  }
  
  async create(whatsapp: CreateWhatsAppDTO): Promise<WhatsApp> {
    const { data } = await this.client.post('/api/bridge/v1/whatsapp', whatsapp);
    return data.data;
  }
  
  async get(id: number): Promise<WhatsApp> {
    const { data } = await this.client.get(`/api/bridge/v1/whatsapp/${id}`);
    return data.data;
  }
  
  async update(id: number, updates: Partial<WhatsApp>): Promise<WhatsApp> {
    const { data } = await this.client.put(`/api/bridge/v1/whatsapp/${id}`, updates);
    return data.data;
  }
  
  async delete(id: number): Promise<void> {
    await this.client.delete(`/api/bridge/v1/whatsapp/${id}`);
  }
  
  async getStoredQR(id: number): Promise<string> {
    const { data } = await this.client.get(`/api/bridge/v1/whatsapp/${id}/qr`);
    return data.data.qrcode;
  }
}

// Nueva API de Control de Sesiones WhatsApp (Core Service)
class WhatsAppSessionsAPI {
  constructor(private client: AxiosInstance) {}
  
  async start(id: number): Promise<SessionResponse> {
    const { data } = await this.client.post(`/whatsapp/${id}/start`);
    return data;
  }
  
  async restart(id: number): Promise<SessionResponse> {
    const { data } = await this.client.post(`/whatsapp/${id}/restart`);
    return data;
  }
  
  async disconnect(id: number): Promise<SessionResponse> {
    const { data } = await this.client.post(`/whatsapp/${id}/disconnect`);
    return data;
  }
  
  async getActiveQR(id: number): Promise<QRResponse> {
    const { data } = await this.client.get(`/whatsapp/${id}/qr`);
    return data;
  }
}

// Ejemplo de uso completo
const example = async () => {
  const bridge = new TucanLinkBridge({
    bridgeUrl: 'http://localhost:8090',
    coreUrl: 'http://localhost:8080',
    apiKey: 'tlk_live_abc123',
    jwtToken: 'eyJhbGciOiJIUzI1NiIs...'
  });

  // 1. Crear sesión WhatsApp (CRUD - API Bridge)
  const whatsapp = await bridge.whatsapp.create({
    name: 'Bot Ventas',
    greetingMessage: 'Hola! ¿Cómo puedo ayudarte?'
  });

  // 2. Iniciar sesión (Control - Core Service)
  const sessionResult = await bridge.whatsappSessions.start(whatsapp.id);
  
  // 3. Obtener QR activo (Core Service)
  const qr = await bridge.whatsappSessions.getActiveQR(whatsapp.id);
  
  console.log('QR Code para escanear:', qr.data.qrcode);
};
```

## 🔄 EVENTOS Y WEBHOOKS

### Sistema de Eventos en Tiempo Real

```javascript
// Conexión WebSocket
import { io } from 'socket.io-client';

const socket = io('http://localhost:8090', {
  path: '/api/bridge/socket.io/',
  auth: {
    token: 'your-jwt-token'
  }
});

// Suscribirse a eventos
socket.on('connect', () => {
  console.log('Conectado al Bridge');
  
  // Suscribirse a room de company
  socket.emit('join', { companyId: 1 });
});

// Escuchar eventos
socket.on('ticket:created', (data) => {
  console.log('Nuevo ticket:', data);
});

socket.on('message:received', (data) => {
  console.log('Mensaje recibido:', data);
  // Actualizar UI o procesar mensaje
});

socket.on('whatsapp:status', (data) => {
  console.log('Estado WhatsApp:', data);
});
```

### Configuración de Webhooks

```javascript
// Registrar webhook
const webhook = await fetch('/api/bridge/v1/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    url: 'https://mi-servidor.com/webhook',
    events: ['ticket.created', 'message.received'],
    secret: 'mi-secret-seguro'
  })
});

// Verificar webhook en tu servidor
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  // Verificar firma HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${JSON.stringify(req.body)}`)
    .digest('hex');
    
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Procesar evento
  const { event, data } = req.body;
  
  switch(event) {
    case 'ticket.created':
      handleNewTicket(data);
      break;
    case 'message.received':
      handleNewMessage(data);
      break;
  }
  
  res.json({ received: true });
});
```

## 🏗️ MEJORES PRÁCTICAS

### 1. Manejo de Errores

```typescript
// Siempre envolver en try-catch
try {
  const result = await bridge.tickets.create(ticketData);
  return result;
} catch (error) {
  if (error.response?.status === 400) {
    // Error de validación
    console.error('Datos inválidos:', error.response.data);
  } else if (error.response?.status === 401) {
    // Token expirado o inválido
    await refreshToken();
  } else if (error.response?.status === 429) {
    // Rate limiting
    const retryAfter = error.response.headers['retry-after'];
    await sleep(retryAfter * 1000);
  } else {
    // Error inesperado
    console.error('Error:', error.message);
  }
}
```

### 2. Paginación

```typescript
// Obtener todos los tickets con paginación
async function getAllTickets() {
  const tickets = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await bridge.tickets.list({
      limit,
      offset,
      orderBy: 'createdAt',
      order: 'DESC'
    });
    
    tickets.push(...batch);
    
    if (batch.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }
  
  return tickets;
}
```

### 3. Cache Local

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

async function getContact(id: number) {
  const cacheKey = `contact:${id}`;
  
  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  // Obtener del Bridge
  const contact = await bridge.contacts.get(id);
  
  // Guardar en cache
  cache.set(cacheKey, contact);
  
  return contact;
}
```

### 4. Validación de Datos

```typescript
import Joi from 'joi';

const ticketSchema = Joi.object({
  contactId: Joi.number().required(),
  queueId: Joi.number().optional(),
  userId: Joi.number().optional(),
  status: Joi.string().valid('open', 'pending', 'closed').default('open'),
  isGroup: Joi.boolean().default(false)
});

function validateTicket(data: any) {
  const { error, value } = ticketSchema.validate(data);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }
  return value;
}
```

## 🔒 SEGURIDAD

### Autenticación Multi-capa

1. **API Keys para Módulos**
   - Únicas por módulo
   - Rotación periódica
   - Permisos granulares

2. **JWT para Usuarios**
   - Expiran en 15 minutos
   - Refresh tokens de 7 días
   - Almacenamiento seguro

3. **Rate Limiting**
   - Por IP: 100 req/min
   - Por API Key: 1000 req/min
   - Por Usuario: 500 req/min

### Ejemplo de Middleware de Seguridad

```typescript
// Validación de API Key
app.use((req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API Key required' });
  }
  
  // Validar contra Bridge
  bridge.validateApiKey(apiKey)
    .then(valid => {
      if (valid) {
        next();
      } else {
        res.status(401).json({ error: 'Invalid API Key' });
      }
    })
    .catch(err => {
      res.status(500).json({ error: 'Auth service error' });
    });
});
```

## 🐳 DEPLOYMENT CON DOCKER

### Docker Compose para Desarrollo

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: tucanlink
      POSTGRES_USER: tucanlink
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  core:
    build: ./backend
    command: npm run dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://tucanlink:secure_password@postgres:5432/tucanlink
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret_here
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - /app/node_modules

  api-bridge:
    build: ./backend
    command: npm run api:bridge
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://tucanlink:secure_password@postgres:5432/tucanlink
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_jwt_secret_here
      API_BRIDGE_PORT: 8090
    ports:
      - "8090:8090"
    depends_on:
      - postgres
      - redis
      - core
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Módulo ejemplo
  modulo-ventas:
    build: ./modules/ventas
    environment:
      BRIDGE_URL: http://api-bridge:8090
      BRIDGE_API_KEY: ${VENTAS_API_KEY}
    ports:
      - "8081:8081"
    depends_on:
      - api-bridge

volumes:
  postgres_data:
```

### Comandos de Deployment

```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f api-bridge

# Ejecutar migraciones
docker-compose exec core npm run db:migrate

# Backup de base de datos
docker-compose exec postgres pg_dump -U tucanlink tucanlink > backup.sql
```

## 📊 MONITOREO Y OBSERVABILIDAD

### Health Checks

```bash
# Health check simple
curl http://localhost:8090/api/bridge/v1/health

# Health check detallado
curl http://localhost:8090/api/bridge/v1/health/ready

# Métricas
curl http://localhost:8090/api/bridge/v1/status/metrics
```

### Logging Estructurado

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'mi-modulo',
    environment: process.env.NODE_ENV 
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Uso
logger.info('Ticket procesado', {
  ticketId: 123,
  userId: 456,
  duration: 250
});
```

## 🧪 TESTING

### Tests de Integración

```typescript
// tests/integration/api.test.ts
import request from 'supertest';

describe('API Bridge Integration', () => {
  let apiKey: string;
  
  beforeAll(async () => {
    // Obtener API key de prueba
    apiKey = process.env.TEST_API_KEY;
  });
  
  test('Crear y obtener ticket', async () => {
    // Crear ticket
    const createResponse = await request('http://localhost:8090')
      .post('/api/bridge/v1/tickets')
      .set('X-API-Key', apiKey)
      .send({
        contactId: 1,
        status: 'open'
      });
      
    expect(createResponse.status).toBe(201);
    const ticketId = createResponse.body.id;
    
    // Obtener ticket
    const getResponse = await request('http://localhost:8090')
      .get(`/api/bridge/v1/tickets/${ticketId}`)
      .set('X-API-Key', apiKey);
      
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(ticketId);
  });
});
```

### Tests Unitarios

```typescript
// tests/unit/services/message.test.ts
import { MessageService } from '../src/services/message.service';

describe('MessageService', () => {
  let service: MessageService;
  
  beforeEach(() => {
    service = new MessageService();
  });
  
  test('formatear mensaje correctamente', () => {
    const formatted = service.formatMessage({
      body: 'Hola',
      from: '1234567890'
    });
    
    expect(formatted).toContain('Hola');
    expect(formatted).toContain('1234567890');
  });
});
```

## 🚨 TROUBLESHOOTING

### Problemas Comunes y Soluciones

#### 1. Error de Autenticación
```
Error: 401 Unauthorized
```
**Solución:**
- Verificar que el API Key es válido
- Verificar que el JWT no ha expirado
- En desarrollo, usar `?companyId=1` para bypass

#### 2. Rate Limiting
```
Error: 429 Too Many Requests
```
**Solución:**
- Implementar backoff exponencial
- Verificar header `retry-after`
- Considerar aumentar límites

#### 3. Error "Service Unavailable" al Iniciar Sesión
```
Error: 503 Service Unavailable
Message: "Cannot start WhatsApp session - core service is not available"
Hint: "Core service is not properly initialized"
```
**Causa:**
- Intentar iniciar sesiones WhatsApp desde API Bridge (INCORRECTO)
- El API Bridge no tiene acceso a Socket.io del Core

**Solución:**
- ✅ Usar endpoints del Core Service en su lugar:
  ```bash
  POST http://localhost:8080/whatsapp/{id}/start
  Authorization: Bearer {JWT_TOKEN}
  ```
- ✅ El API Bridge solo maneja CRUD de sesiones
- ✅ El Core Service maneja control de sesiones (start/restart/disconnect)

#### 4. Conexión WhatsApp Perdida
```
Error: WhatsApp session disconnected
```
**Solución:**
- NO es culpa del API Bridge
- Verificar logs del core
- Reiniciar sesión WhatsApp específica usando Core endpoints

#### 5. Timeout en Requests
```
Error: Request timeout
```
**Solución:**
- Aumentar timeout del cliente
- Verificar latencia de red
- Considerar paginación para datos grandes

## 📚 RECURSOS ADICIONALES

### Documentación
- **Swagger UI**: http://localhost:8090/api/bridge/docs
- **Postman Collection**: Disponible en `/docs/postman.json`
- **API Status**: http://localhost:8090/api/bridge/v1/status

### Ejemplos de Código
- **Módulo Template**: `/modules/template/`
- **SDK TypeScript**: `/backend/src/api/bridge/sdk/`
- **Tests de Integración**: `/backend/src/api/bridge/tests/`

### Comandos Útiles

```bash
# Ver todos los endpoints disponibles
curl http://localhost:8090/api/bridge/v1/status | jq '.apis'

# Probar autenticación
curl -H "X-API-Key: $API_KEY" http://localhost:8090/api/bridge/v1/health

# Generar nueva API Key (requiere auth admin)
curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:8090/api/bridge/v1/api-keys

# Ver logs en tiempo real
tail -f backend/logs/api-bridge.log

# Verificar uso de memoria
ps aux | grep node

# Test de carga
artillery quick --count 100 --num 10 \
  http://localhost:8090/api/bridge/v1/health
```

## 🤝 CONTRIBUCIÓN

### Flujo de Desarrollo

1. **Crear branch desde main**
```bash
git checkout -b feature/mi-nueva-funcionalidad
```

2. **Desarrollar siguiendo estándares**
- Usar TypeScript
- Seguir estructura existente
- Agregar tests
- Actualizar Swagger

3. **Actualizar documentación**
- Actualizar Swagger YAML
- Documentar en README
- Agregar ejemplos

4. **Crear Pull Request**
- Descripción clara
- Tests pasando
- Review de código

### Checklist para Nuevo Endpoint

- [ ] Controller creado en `/v1/controllers/`
- [ ] Routes definidas en `/v1/routes/`
- [ ] Validación Joi implementada
- [ ] Tests unitarios escritos
- [ ] Tests de integración funcionando
- [ ] Documentación Swagger actualizada
- [ ] Ejemplos en Postman agregados
- [ ] README actualizado
- [ ] Logs apropiados añadidos
- [ ] Manejo de errores completo

## 📈 ROADMAP

### Fase Actual (v1.0)
- ✅ API Bridge Core
- ✅ Autenticación JWT + API Keys
- ✅ 12 APIs principales implementadas
- ✅ WebSocket para eventos
- ✅ Documentación Swagger completa

### Próximas Funcionalidades (v2.0)
- ⏳ SDK Python y PHP
- ⏳ Dashboard de métricas
- ⏳ Integraciones con CRM externos
- ⏳ IA para respuestas automáticas
- ⏳ Analytics avanzado
- ⏳ Marketplace de módulos

## 📞 SOPORTE

### Canales de Soporte
- **GitHub Issues**: [github.com/tucanlink/issues](https://github.com/tucanlink/issues)
- **Email**: soporte@tucanlink.com
- **Discord**: [discord.gg/tucanlink](https://discord.gg/tucanlink)

### Información del Sistema
- **Versión Core**: 1.0.0
- **Versión API Bridge**: 1.0.0
- **Node.js Requerido**: 20.x
- **PostgreSQL**: 13+

---

## 📝 LICENCIA

Este proyecto está licenciado bajo MIT License. Ver archivo LICENSE para más detalles.

---

---

## 📝 HISTORIAL DE CAMBIOS

### v2.0.0 (2025-08-28) - Separación Arquitectural
- ✅ **Cambio Crítico**: Separación de responsabilidades WhatsApp
- ✅ **Core Service**: Ahora maneja control de sesiones (start/restart/disconnect/qr)
- ✅ **API Bridge**: Solo maneja CRUD de sesiones WhatsApp
- ✅ **Autenticación Dual**: API Keys (Bridge) + JWT (Core)
- ✅ **Documentación Actualizada**: Nuevos flows y endpoints
- ✅ **SDK Actualizado**: Soporte para ambos servicios
- ✅ **Error 503 Resuelto**: Endpoints movidos al Core

### v1.0.0 (2025-08-27) - Lanzamiento Inicial
- ✅ API Bridge Core implementado
- ✅ 12 APIs principales funcionales
- ✅ Autenticación JWT + API Keys
- ✅ Multi-tenancy completo
- ✅ Documentación Swagger

---

*Última actualización: 2025-08-28*
*Versión del documento: 2.0.0*
*Cambio arquitectural: Core/Bridge separation*