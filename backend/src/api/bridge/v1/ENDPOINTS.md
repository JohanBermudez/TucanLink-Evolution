# 📋 API Bridge - Endpoint Mapping v1.0

## 🎯 Overview
Este documento mapea los endpoints del core de TucanLink a la nueva API Bridge, manteniendo compatibilidad y agregando mejoras RESTful.

## 🔄 Convenciones de Mapeo

- **Prefijo Base**: `/api/bridge/v1`
- **Versionado**: Todos los endpoints incluyen versión (`v1`)
- **Multi-tenancy**: CompanyId extraído del token JWT o API Key
- **Paginación**: Soporte estándar con `limit`, `offset`, `page`
- **Filtering**: Query params estandarizados
- **Rate Limiting**: Headers `X-RateLimit-*`

## 📊 Endpoints Core Mapeados

### 🎫 **TICKETS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/tickets` | `/api/bridge/v1/tickets` | GET | List all tickets with filters | HIGH |
| `/tickets/:ticketId` | `/api/bridge/v1/tickets/:id` | GET | Get ticket details | HIGH |
| `/tickets` | `/api/bridge/v1/tickets` | POST | Create new ticket | HIGH |
| `/tickets/:ticketId` | `/api/bridge/v1/tickets/:id` | PUT | Update ticket | HIGH |
| `/tickets/:ticketId` | `/api/bridge/v1/tickets/:id` | DELETE | Delete ticket | MEDIUM |
| `/ticket/kanban` | `/api/bridge/v1/tickets/kanban` | GET | Kanban view data | LOW |
| `/tickets/u/:uuid` | `/api/bridge/v1/tickets/uuid/:uuid` | GET | Get ticket by UUID | MEDIUM |

#### Query Parameters (GET /tickets):
- `status`: open, pending, closed
- `queueId`: Filter by queue
- `userId`: Filter by assigned user
- `contactId`: Filter by contact
- `dateStart`, `dateEnd`: Date range
- `searchParam`: Text search
- `showAll`: Boolean
- `withUnreadMessages`: Boolean
- `limit`: Max results (default: 20, max: 100)
- `offset`: Skip results
- `orderBy`: createdAt, updatedAt

### 💬 **MESSAGES**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/messages/:ticketId` | `/api/bridge/v1/messages` | GET | List messages by ticket | HIGH |
| `/messages/:ticketId` | `/api/bridge/v1/messages` | POST | Send message to ticket | HIGH |
| `/messages/:messageId` | `/api/bridge/v1/messages/:id` | DELETE | Delete message | MEDIUM |
| `/api/messages/send` | `/api/bridge/v1/messages/send` | POST | Direct message send | HIGH |
| - | `/api/bridge/v1/messages/:id/status` | PUT | Update message status | MEDIUM |
| - | `/api/bridge/v1/messages/bulk` | POST | Bulk message sending | LOW |

#### Request Body (POST /messages):
```json
{
  "ticketId": 123,
  "body": "Message text",
  "quotedMsg": {...},
  "media": [...],
  "read": false,
  "fromMe": true
}
```

### 👥 **CONTACTS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/contacts` | `/api/bridge/v1/contacts` | GET | List contacts | HIGH |
| `/contacts/:contactId` | `/api/bridge/v1/contacts/:id` | GET | Get contact details | HIGH |
| `/contacts` | `/api/bridge/v1/contacts` | POST | Create contact | HIGH |
| `/contacts/:contactId` | `/api/bridge/v1/contacts/:id` | PUT | Update contact | HIGH |
| `/contacts/:contactId` | `/api/bridge/v1/contacts/:id` | DELETE | Delete contact | MEDIUM |
| `/contacts/import` | `/api/bridge/v1/contacts/import` | POST | Import contacts | MEDIUM |
| `/contacts/upload` | `/api/bridge/v1/contacts/bulk` | POST | Bulk upload | LOW |
| `/contacts/toggleDisableBot/:contactId` | `/api/bridge/v1/contacts/:id/bot` | PATCH | Toggle bot status | LOW |

### 👤 **USERS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/users` | `/api/bridge/v1/users` | GET | List users | HIGH |
| `/users/:userId` | `/api/bridge/v1/users/:id` | GET | Get user details | HIGH |
| `/users` | `/api/bridge/v1/users` | POST | Create user | MEDIUM |
| `/users/:userId` | `/api/bridge/v1/users/:id` | PUT | Update user | MEDIUM |
| `/users/:userId` | `/api/bridge/v1/users/:id` | DELETE | Delete user | LOW |
| `/users/signup` | `/api/bridge/v1/users/invite` | POST | Invite new user | MEDIUM |

### 🏢 **COMPANIES**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/companies` | `/api/bridge/v1/companies` | GET | List companies | MEDIUM |
| `/companies/:id` | `/api/bridge/v1/companies/:id` | GET | Get company details | MEDIUM |
| `/companies` | `/api/bridge/v1/companies/current` | GET | Get current company | HIGH |
| `/companies/:id` | `/api/bridge/v1/companies/:id` | PUT | Update company | MEDIUM |
| `/companies/schedules/:id` | `/api/bridge/v1/companies/:id/schedules` | PUT | Update schedules | LOW |

### 📝 **QUEUES**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/queue` | `/api/bridge/v1/queues` | GET | List queues | HIGH |
| `/queue/:queueId` | `/api/bridge/v1/queues/:id` | GET | Get queue details | HIGH |
| `/queue` | `/api/bridge/v1/queues` | POST | Create queue | MEDIUM |
| `/queue/:queueId` | `/api/bridge/v1/queues/:id` | PUT | Update queue | MEDIUM |
| `/queue/:queueId` | `/api/bridge/v1/queues/:id` | DELETE | Delete queue | LOW |
| - | `/api/bridge/v1/queues/:id/assign` | POST | Assign users to queue | MEDIUM |

### 📱 **WHATSAPP SESSIONS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/whatsapps` | `/api/bridge/v1/whatsapp/sessions` | GET | List sessions | HIGH |
| `/whatsapps/:whatsappId` | `/api/bridge/v1/whatsapp/sessions/:id` | GET | Get session details | HIGH |
| `/whatsapps` | `/api/bridge/v1/whatsapp/sessions` | POST | Create session | LOW |
| `/whatsapps/:whatsappId` | `/api/bridge/v1/whatsapp/sessions/:id` | PUT | Update session | MEDIUM |
| `/whatsapps/:whatsappId` | `/api/bridge/v1/whatsapp/sessions/:id` | DELETE | Delete session | LOW |
| `/whatsappsession/:whatsappId` | `/api/bridge/v1/whatsapp/sessions/:id/qr` | GET | Get QR code | HIGH |
| - | `/api/bridge/v1/whatsapp/sessions/:id/status` | GET | Session status | HIGH |
| - | `/api/bridge/v1/whatsapp/sessions/:id/restart` | POST | Restart session | MEDIUM |

### ⚙️ **SETTINGS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/settings` | `/api/bridge/v1/settings` | GET | List all settings | HIGH |
| `/settings/:settingKey` | `/api/bridge/v1/settings/:key` | GET | Get specific setting | HIGH |
| `/settings/:settingKey` | `/api/bridge/v1/settings/:key` | PUT | Update setting | HIGH |

### 🏷️ **TAGS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/tags` | `/api/bridge/v1/tags` | GET | List tags | MEDIUM |
| `/tags/:tagId` | `/api/bridge/v1/tags/:id` | GET | Get tag details | MEDIUM |
| `/tags` | `/api/bridge/v1/tags` | POST | Create tag | MEDIUM |
| `/tags/:tagId` | `/api/bridge/v1/tags/:id` | PUT | Update tag | MEDIUM |
| `/tags/:tagId` | `/api/bridge/v1/tags/:id` | DELETE | Delete tag | LOW |
| `/tags/kanban` | `/api/bridge/v1/tags/kanban` | GET | Kanban tags | LOW |

### 📊 **DASHBOARD & REPORTS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/dashboard` | `/api/bridge/v1/analytics/dashboard` | GET | Dashboard stats | HIGH |
| - | `/api/bridge/v1/analytics/tickets` | GET | Ticket analytics | MEDIUM |
| - | `/api/bridge/v1/analytics/messages` | GET | Message analytics | MEDIUM |
| - | `/api/bridge/v1/analytics/contacts` | GET | Contact analytics | LOW |
| - | `/api/bridge/v1/reports/generate` | POST | Generate report | LOW |

### 🔄 **CAMPAIGNS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/campaigns` | `/api/bridge/v1/campaigns` | GET | List campaigns | MEDIUM |
| `/campaigns/:id` | `/api/bridge/v1/campaigns/:id` | GET | Get campaign | MEDIUM |
| `/campaigns` | `/api/bridge/v1/campaigns` | POST | Create campaign | MEDIUM |
| `/campaigns/:id` | `/api/bridge/v1/campaigns/:id` | PUT | Update campaign | MEDIUM |
| `/campaigns/:id` | `/api/bridge/v1/campaigns/:id` | DELETE | Delete campaign | LOW |
| `/campaigns/:id/cancel` | `/api/bridge/v1/campaigns/:id/cancel` | POST | Cancel campaign | MEDIUM |
| `/campaigns/:id/restart` | `/api/bridge/v1/campaigns/:id/restart` | POST | Restart campaign | MEDIUM |

### 🔨 **WEBHOOKS**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| - | `/api/bridge/v1/webhooks` | GET | List webhooks | HIGH |
| - | `/api/bridge/v1/webhooks/:id` | GET | Get webhook | MEDIUM |
| - | `/api/bridge/v1/webhooks` | POST | Register webhook | HIGH |
| - | `/api/bridge/v1/webhooks/:id` | PUT | Update webhook | MEDIUM |
| - | `/api/bridge/v1/webhooks/:id` | DELETE | Delete webhook | MEDIUM |
| - | `/api/bridge/v1/webhooks/:id/test` | POST | Test webhook | LOW |

### 🔐 **AUTHENTICATION**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/auth/login` | `/api/bridge/v1/auth/login` | POST | User login | HIGH |
| `/auth/refresh_token` | `/api/bridge/v1/auth/refresh` | POST | Refresh token | HIGH |
| `/auth/signup` | `/api/bridge/v1/auth/register` | POST | Register user | MEDIUM |
| `/auth/logout` | `/api/bridge/v1/auth/logout` | POST | Logout user | MEDIUM |
| - | `/api/bridge/v1/auth/apikeys` | GET | List API keys | HIGH |
| - | `/api/bridge/v1/auth/apikeys` | POST | Generate API key | HIGH |
| - | `/api/bridge/v1/auth/apikeys/:id` | DELETE | Revoke API key | MEDIUM |

### 📅 **SCHEDULES**

| Core Route | Bridge Endpoint | Method | Description | Priority |
|------------|-----------------|--------|-------------|----------|
| `/schedules` | `/api/bridge/v1/schedules` | GET | List schedules | LOW |
| `/schedules/:id` | `/api/bridge/v1/schedules/:id` | GET | Get schedule | LOW |
| `/schedules` | `/api/bridge/v1/schedules` | POST | Create schedule | LOW |
| `/schedules/:id` | `/api/bridge/v1/schedules/:id` | PUT | Update schedule | LOW |
| `/schedules/:id` | `/api/bridge/v1/schedules/:id` | DELETE | Delete schedule | LOW |

## 🔌 WebSocket Events

### Events Emitted by Bridge:
```javascript
// Tickets
'ticket.created'
'ticket.updated'
'ticket.deleted'
'ticket.assigned'
'ticket.transferred'

// Messages
'message.created'
'message.received'
'message.sent'
'message.delivered'
'message.read'

// Contacts
'contact.created'
'contact.updated'
'contact.online'
'contact.offline'

// WhatsApp
'whatsapp.connected'
'whatsapp.disconnected'
'whatsapp.qr'
'whatsapp.ready'

// System
'user.online'
'user.offline'
'queue.updated'
```

## 📝 Standard Response Format

### Success Response:
```json
{
  "data": {...},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2025-08-27T23:15:00Z"
}
```

### Error Response:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...],
    "timestamp": "2025-08-27T23:15:00Z"
  }
}
```

## 🔒 Permission Scopes

### Basic Scopes:
- `tickets:read` - View tickets
- `tickets:write` - Create/update tickets
- `messages:send` - Send messages
- `messages:read` - Read messages
- `contacts:read` - View contacts
- `contacts:manage` - Create/update/delete contacts
- `settings:read` - View settings
- `settings:admin` - Modify settings
- `users:manage` - Manage users
- `campaigns:manage` - Manage campaigns

### Admin Scopes:
- `admin:*` - Full admin access
- `company:manage` - Manage company settings
- `whatsapp:manage` - Manage WhatsApp sessions

## 📈 Priority Implementation Plan

### Phase 1 - Core (HIGH Priority)
1. Tickets CRUD
2. Messages send/receive
3. Contacts management
4. Authentication flow
5. WhatsApp session status

### Phase 2 - Extended (MEDIUM Priority)
1. Users management
2. Queues configuration
3. Companies settings
4. Tags system
5. Campaigns

### Phase 3 - Advanced (LOW Priority)
1. Kanban views
2. Schedules
3. Reports generation
4. Bulk operations

## 🔄 Migration Notes

1. **Authentication**: Migrar de cookie-based a JWT Bearer tokens
2. **Multi-tenancy**: CompanyId automático desde token
3. **Rate Limiting**: Implementado por defecto
4. **Versioning**: Todos los endpoints versionados
5. **Pagination**: Estándar en todas las listas
6. **WebSocket**: Namespace separado `/api/bridge`

---

*Documento generado para TucanLink API Bridge v1.0*
*Última actualización: 2025-08-27*