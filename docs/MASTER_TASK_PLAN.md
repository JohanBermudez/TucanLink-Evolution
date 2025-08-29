# 📋 PLAN MAESTRO DE TAREAS - EVOLUCIÓN TUCANLINK A ARQUITECTURA MODULAR

## 🎯 OBJETIVO FINAL
Transformar TucanLink en una arquitectura de microservicios con API Bridge que permita añadir módulos independientes sin modificar el core, manteniendo WhatsApp activo 24/7.

## 🏆 LOGROS DEL DÍA [2025-08-28]

### APIs Críticas Implementadas (5 nuevas):
1. **Users API** - Gestión completa de usuarios con asignación de colas
2. **Tags API** - Sistema de etiquetado con asociación a tickets
3. **Company API** - Multi-tenancy y gestión de empresas
4. **Settings API** - Configuraciones del sistema con acceso por clave
5. **Schedule API** - Programación de mensajes con validaciones

### Métricas de Progreso:
- **Antes:** 7 APIs implementadas (19% del total)
- **Ahora:** 12 APIs implementadas (33% del total)
- **Incremento:** +71% en APIs implementadas en un día
- **Cobertura funcional crítica:** 100% completada

### Características Destacadas:
- ✅ Todas las APIs críticas para operación básica completadas
- ✅ Sistema de autenticación real con usuarios funcional
- ✅ Multi-tenancy completo implementado
- ✅ Categorización de tickets con tags operativa
- ✅ Configuraciones centralizadas del sistema
- ✅ Zero downtime mantenido durante toda la implementación

## 🤖 INSTRUCCIONES PARA LA IA

### IMPORTANTE - LEE PRIMERO
1. **SIEMPRE** consulta el MCP context7 para documentación actualizada antes de cada tarea
2. **LEE** este archivo completo antes de comenzar cualquier trabajo
3. **REVISA** las tareas completadas y continúa con las pendientes
4. **NO MODIFIQUES** ningún código del core existente
5. **MANTÉN** WhatsApp activo en todo momento
6. **DOCUMENTA** cada API endpoint creado en formato OpenAPI
7. **ACTUALIZA SWAGGER** cada vez que crees o modifiques un endpoint en `/src/api/bridge/v1/swagger/swagger.yaml`
8. **PRUEBA** cada implementación antes de marcarla como completada
9. **REGISTRA** cada archivo nuevo importante en la sección de archivos creados

### 🔴 TAREAS CRÍTICAS PENDIENTES - EJECUTAR INMEDIATAMENTE
**Messages API y Contacts API son FUNDAMENTALES para el funcionamiento**
- ⚠️ Sin Messages API = No se pueden enviar/recibir mensajes WhatsApp
- ⚠️ Sin Contacts API = No se puede gestionar destinatarios
- 🎯 Estas APIs deben implementarse ANTES de continuar
- ⏰ Tiempo estimado: 1-2 días para ambas APIs

### ✅ FASE 1.5 COMPLETADA
**Database Integration para API Keys - COMPLETADO**
- ✅ API Keys ahora persisten en base de datos
- ✅ Sistema híbrido Cache L1 + DB L2 implementado
- ✅ Auditoría y métricas de uso funcionando
- ✅ Script de migración disponible
- **LISTO PARA CONTINUAR CON FASE 2**

### FLUJO DE TRABAJO
```
1. Lee MASTER_TASK_PLAN.md
2. Revisa sección ARCHIVOS CREADOS para contexto
3. Consulta MCP context7 para compatibilidad
4. Identifica próxima tarea pendiente
5. Implementa siguiendo las especificaciones
6. ACTUALIZA SWAGGER.YAML con el nuevo endpoint
7. Ejecuta tests
8. Verifica endpoint en Swagger UI (http://localhost:8090/api/bridge/docs)
9. Actualiza sección ARCHIVOS CREADOS si creaste archivos importantes
10. Marca tarea como completada con ✅
11. Repite hasta completar la fase
```

### 📚 DOCUMENTACIÓN SWAGGER - OBLIGATORIA
**IMPORTANTE:** Cada vez que se crea o modifica un endpoint, es **OBLIGATORIO**:

1. **Actualizar el archivo Swagger:**
   - Ubicación: `/backend/src/api/bridge/v1/swagger/swagger.yaml`
   - Agregar el endpoint en la sección `paths`
   - Definir schemas en `components/schemas`
   - Incluir ejemplos de uso

2. **Verificar en Swagger UI:**
   - Abrir: `http://localhost:8090/api/bridge/docs`
   - Probar el endpoint con "Try it out"
   - Confirmar que la documentación es clara

3. **Elementos requeridos en Swagger:**
   ```yaml
   paths:
     /tu-endpoint:
       get/post/put/delete:
         tags: [Categoría]
         summary: Resumen corto
         description: Descripción detallada
         parameters: # Si aplica
         requestBody: # Si aplica
         responses:
           200/201: Respuesta exitosa con ejemplo
           400: Error de validación
           401: No autorizado
           404: No encontrado
           500: Error del servidor
   ```

**Sin documentación Swagger = Endpoint NO está completo** ❌

## 📁 ARCHIVOS CREADOS - REFERENCIA RÁPIDA

### Documentación Técnica
- ✅ `/backend/src/api/bridge/STACK.md` - Stack tecnológico definido para API Bridge
- ✅ `/backend/src/api/bridge/v1/ENDPOINTS.md` - Mapeo completo de 30+ endpoints críticos
- ✅ `/backend/src/api/bridge/docs/openapi.yaml` - Especificación OpenAPI 3.0.3 completa (inicial)
- ✅ `/backend/src/api/bridge/v1/swagger/swagger.yaml` - Documentación Swagger completa [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/swagger/swagger.config.ts` - Configuración de Swagger UI [2025-08-28]
- ✅ `/backend/src/api/bridge/DEVELOPMENT_GUIDE.md` - Guía completa de desarrollo con sección Swagger [2025-08-28]

### Configuración
- ✅ `/backend/src/api/bridge/config/index.ts` - Configuración central completa
- ✅ `/backend/src/api/bridge/server.ts` - Servidor Express API Bridge (puerto 8090)

### APIs Implementadas
- ✅ `/backend/src/api/bridge/v1/services/auth/jwt.service.ts` - Servicio JWT completo
- ✅ `/backend/src/api/bridge/v1/services/auth/apiKey.service.ts` - Gestión de API Keys
- ✅ `/backend/src/api/bridge/v1/middleware/auth.middleware.ts` - Middleware de autenticación
- ✅ `/backend/src/api/bridge/v1/services/websocket.service.ts` - WebSocket con Socket.io
- ✅ `/backend/src/api/bridge/v1/services/eventBus.service.ts` - Event Bus con Bull Queue
- ✅ `/backend/src/api/bridge/v1/services/webhook.service.ts` - Webhook Delivery System
- Pendiente: `/backend/src/api/bridge/v1/routes/` - Rutas de la API
- Pendiente: `/backend/src/api/bridge/v1/controllers/` - Controladores

### Database & Persistence
- ✅ `/backend/src/database/migrations/20250827000001-create-api-keys-table.ts` - Migración tabla API Keys
- ✅ `/backend/src/database/migrations/20250827000002-create-api-key-usage-table.ts` - Migración tabla API Key Usage
- ✅ `/backend/src/api/bridge/v1/models/ApiKey.ts` - Modelo Sequelize para API Keys
- ✅ `/backend/src/api/bridge/v1/database/index.ts` - Conexión y gestión de BD para API Bridge
- ✅ `/backend/src/api/bridge/scripts/migrate-api-keys.ts` - Script migración de keys en memoria

### Controllers & Routes
- ✅ `/backend/src/api/bridge/v1/controllers/apiKey.controller.ts` - Controller gestión API Keys
- ✅ `/backend/src/api/bridge/v1/controllers/admin.controller.ts` - Controller administración
- ✅ `/backend/src/api/bridge/v1/controllers/tickets.controller.ts` - Controller tickets completo
- ✅ `/backend/src/api/bridge/v1/controllers/messages.controller.ts` - Controller mensajes WhatsApp
- ✅ `/backend/src/api/bridge/v1/controllers/contacts.controller.ts` - Controller contactos
- ✅ `/backend/src/api/bridge/v1/controllers/queues.controller.ts` - Controller colas
- ✅ `/backend/src/api/bridge/v1/controllers/whatsapp.controller.ts` - Controller WhatsApp
- ✅ `/backend/src/api/bridge/v1/controllers/users.controller.ts` - Controller usuarios [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/controllers/tags.controller.ts` - Controller etiquetas [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/controllers/company.controller.ts` - Controller empresas [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/controllers/settings.controller.ts` - Controller configuraciones [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/controllers/schedule.controller.ts` - Controller programación [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/controllers/status.controller.ts` - Controller status y métricas [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/routes/apiKey.routes.ts` - Rutas API Keys
- ✅ `/backend/src/api/bridge/v1/routes/admin.routes.ts` - Rutas administración
- ✅ `/backend/src/api/bridge/v1/routes/tickets.routes.ts` - Rutas tickets
- ✅ `/backend/src/api/bridge/v1/routes/messages.routes.ts` - Rutas mensajes
- ✅ `/backend/src/api/bridge/v1/routes/contacts.routes.ts` - Rutas contactos
- ✅ `/backend/src/api/bridge/v1/routes/queues.routes.ts` - Rutas colas
- ✅ `/backend/src/api/bridge/v1/routes/whatsapp.routes.ts` - Rutas WhatsApp
- ✅ `/backend/src/api/bridge/v1/routes/users.routes.ts` - Rutas usuarios [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/routes/tags.routes.ts` - Rutas etiquetas [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/routes/company.routes.ts` - Rutas empresas [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/routes/settings.routes.ts` - Rutas configuraciones [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/routes/schedule.routes.ts` - Rutas programación [2025-08-28]
- ✅ `/backend/src/api/bridge/v1/routes/status.routes.ts` - Rutas status y métricas [2025-08-28]

### Utilities
- ✅ `/backend/src/api/bridge/v1/utils/logger.ts` - Logger personalizado para API Bridge

### Tests
- ✅ `/backend/src/api/bridge/jest.config.js` - Configuración de Jest completa
- ✅ `/backend/src/api/bridge/tests/setup.ts` - Setup global para tests
- ✅ `/backend/src/api/bridge/tests/unit/services/jwt.service.test.ts` - Tests JWT Service
- ✅ `/backend/src/api/bridge/tests/unit/services/apiKey.service.test.ts` - Tests API Key Service
- ✅ `/backend/src/api/bridge/tests/unit/services/apiKey.persistence.test.ts` - Tests persistencia API Keys
- ✅ `/backend/src/api/bridge/tests/integration/setup.ts` - Setup para integration tests
- ✅ `/backend/src/api/bridge/tests/integration/health.test.ts` - Tests de endpoints health

## 🎓 LECCIONES APRENDIDAS - MEJORES PRÁCTICAS PARA FUTUROS ENDPOINTS

### ⚠️ ERRORES COMUNES Y SOLUCIONES

#### 1. **Middleware de Autenticación**
**Error:** Pasar `authenticate` sin paréntesis
```typescript
// ❌ INCORRECTO - Causa timeout infinito
router.use(authenticate);

// ✅ CORRECTO - authenticate() retorna el middleware
router.use(authenticate());
```

#### 2. **Esquemas de Validación Joi**
**Estructura correcta para validación compuesta:**
```typescript
// ✅ CORRECTO - Validación de body, params y query
const schema = Joi.object({
  body: Joi.object({
    // campos del body
  }),
  params: Joi.object({
    // parámetros de URL
  }),
  query: Joi.object({
    // query parameters
  })
});
```

#### 3. **Importación de Logger**
**Error:** Importar logger desde server.ts causa dependencia circular
```typescript
// ❌ INCORRECTO
import { logger } from '../../server';

// ✅ CORRECTO
import { logger } from '../utils/logger';
```

#### 4. **Modelos de Base de Datos**
**Importante:** Siempre verificar la estructura real de las tablas antes de usar modelos
```bash
# Verificar estructura de tabla
psql -U tucanlink -d tucanlink -h localhost -c "\d \"TableName\""
```

### 📋 CHECKLIST PARA NUEVOS ENDPOINTS

1. **Antes de implementar:**
   - [ ] Verificar si existen datos de prueba en la BD
   - [ ] Revisar estructura real de las tablas
   - [ ] Verificar relaciones entre modelos

2. **Durante la implementación:**
   - [ ] Usar `authenticate()` con paréntesis
   - [ ] Estructurar esquemas Joi con body/params/query
   - [ ] Importar logger desde utils/logger
   - [ ] Agregar logs para debugging en desarrollo
   - [ ] Manejar casos donde no hay datos

3. **Documentación en Swagger:** 🔴 **OBLIGATORIO**
   - [ ] Actualizar `/src/api/bridge/v1/swagger/swagger.yaml`
   - [ ] Agregar el endpoint en la sección `paths`
   - [ ] Definir schemas necesarios en `components/schemas`
   - [ ] Incluir ejemplos de request/response
   - [ ] Documentar todos los parámetros y sus tipos
   - [ ] Especificar códigos de respuesta (200, 400, 401, 404, 500)
   - [ ] Agregar tags apropiados para categorización

4. **Validación y testing:**
   - [ ] Probar con curl antes de confirmar funcionamiento
   - [ ] Verificar que el bypass de desarrollo funcione
   - [ ] Probar con y sin datos en la BD
   - [ ] Verificar logs del servidor para errores
   - [ ] **Probar el endpoint desde Swagger UI** (`http://localhost:8090/api/bridge/docs`)
   - [ ] Verificar que la documentación Swagger es correcta y completa

### 🛠️ CONFIGURACIÓN DE DESARROLLO

**Bypass de autenticación para testing:**
- En desarrollo, pasar `companyId` como query parameter bypasea autenticación
- Ejemplo: `GET /api/bridge/v1/contacts?companyId=1`

**Middleware de validación actualizado:**
- Ahora soporta esquemas simples (solo body) y compuestos (body/params/query)
- Detecta automáticamente el tipo de esquema

## 📂 ESTRUCTURA DEL PROYECTO

```
V2TucanLink/
├── MASTER_TASK_PLAN.md         # Este archivo - Plan maestro
├── CLAUDE.md                    # Instrucciones para Claude
├── plan_evolution.md            # Visión general del proyecto
├── backend/
│   ├── src/
│   │   ├── api/                 # NUEVA - API Bridge
│   │   │   └── bridge/
│   │   │       ├── v1/          # Versión 1 de la API
│   │   │       │   ├── routes/
│   │   │       │   ├── controllers/
│   │   │       │   ├── middleware/
│   │   │       │   └── validators/
│   │   │       ├── docs/        # Documentación OpenAPI
│   │   │       ├── sdk/         # SDK TypeScript
│   │   │       └── tests/       # Tests de integración
│   │   └── [existing core code] # NO TOCAR
│   └── package.json
├── modules/                     # NUEVA - Módulos independientes
│   ├── template/               # Template base
│   └── [futuros módulos]
└── docs/
```

---

## 📋 FASE 1: SELECCIÓN DE STACK Y ARQUITECTURA [7 DÍAS]

### 🔧 Día 1: Stack Tecnológico y Dependencias

#### TAREA 1.1: Definir Stack Tecnológico ✅
**Instrucciones:**
1. Consulta MCP context7 para versiones compatibles con Node 20.x
2. Crea archivo `/backend/src/api/bridge/STACK.md` con:
   - Framework HTTP: Express 4.19.x (compatible con core existente)
   - Autenticación: jsonwebtoken 9.0.x + bcryptjs 2.4.x
   - Validación: Joi 17.x o express-validator 7.x
   - Documentación: swagger-ui-express 5.x + swagger-jsdoc 6.x
   - Rate Limiting: express-rate-limit 7.x
   - CORS: cors 2.8.x (ya instalado)
   - Logging: winston 3.x o pino 8.x
   - Testing: Jest 29.x + supertest 6.x
3. Justifica cada elección basándote en compatibilidad

#### TAREA 1.2: Actualizar package.json ✅
**Instrucciones:**
1. Consulta MCP context7 sobre npm install flags
2. Añade las nuevas dependencias al backend/package.json:
   ```json
   "swagger-ui-express": "^5.0.0",
   "swagger-jsdoc": "^6.2.8",
   "express-rate-limit": "^7.1.0",
   "joi": "^17.11.0",
   "winston": "^3.11.0"
   ```
3. Ejecuta `npm install --force` si hay conflictos de versiones
4. Verifica que no se rompa ninguna dependencia existente

### 🏗️ Día 2: Estructura Base API Bridge

#### TAREA 2.1: Crear Estructura de Directorios ✅
**Instrucciones:**
1. Crea la siguiente estructura en `/backend/src/api/bridge/`:
```bash
mkdir -p backend/src/api/bridge/v1/{routes,controllers,middleware,validators,services,utils}
mkdir -p backend/src/api/bridge/docs
mkdir -p backend/src/api/bridge/sdk
mkdir -p backend/src/api/bridge/tests/{unit,integration}
mkdir -p backend/src/api/bridge/config
```
2. Crea archivos index.ts vacíos en cada directorio
3. Añade .gitkeep en directorios vacíos

#### TAREA 2.2: Configuración Base ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/config/index.ts`:
   - Puerto API Bridge: 8090
   - Configuración JWT (secret, expiration)
   - Rate limiting defaults
   - CORS settings
   - Logging levels
2. Usa variables de entorno con defaults seguros
3. Documenta cada configuración

#### TAREA 2.3: Server API Bridge ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/server.ts`:
   - Express server independiente en puerto 8090
   - NO importar nada del core existente (aún)
   - Middleware básico: cors, body-parser, helmet
   - Health check endpoint: GET /api/bridge/v1/health
2. Añade script en package.json: `"api:bridge": "ts-node-dev src/api/bridge/server.ts"`
3. Verifica que arranca sin afectar el core

### 📝 Día 3: Sistema de Autenticación

#### TAREA 3.1: JWT Service ✅
**Instrucciones:**
1. Consulta MCP context7 sobre mejores prácticas JWT
2. Crea `/backend/src/api/bridge/v1/services/auth/jwt.service.ts`:
   - generateToken(payload, options)
   - verifyToken(token)
   - refreshToken(oldToken)
   - Token expiration: 15 minutos
   - Refresh token: 7 días
3. Usa RS256 si es posible, HS256 como fallback

#### TAREA 3.2: API Keys Management ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/v1/services/auth/apiKey.service.ts`:
   - generateApiKey()
   - validateApiKey(key)
   - revokeApiKey(key)
   - Rate limiting por API key
2. Almacena en Redis con prefijo `apikey:`
3. Incluye metadata: createdAt, lastUsed, permissions

#### TAREA 3.3: Auth Middleware ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/v1/middleware/auth.middleware.ts`:
   - JWT validation middleware
   - API Key validation middleware
   - Combined auth (JWT o API Key)
   - Extract companyId from token
2. Añade manejo de errores específicos
3. Log intentos fallidos

### 📊 Día 4: Definición de Endpoints Core

#### TAREA 4.1: Mapeo de Endpoints Existentes ✅
**Instrucciones:**
1. Consulta MCP context7 sobre REST best practices
2. Analiza rutas existentes en `/backend/src/routes/`
3. Crea `/backend/src/api/bridge/v1/ENDPOINTS.md` con tabla:
   | Core Route | Bridge Endpoint | Method | Description |
   |------------|-----------------|--------|-------------|
   | /tickets   | /api/bridge/v1/tickets | GET/POST/PUT/DELETE | ... |
4. Define al menos 30 endpoints críticos

#### TAREA 4.2: OpenAPI Specification ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/docs/openapi.yaml`:
   - Versión OpenAPI 3.0.3
   - Info section con descripción completa
   - Security schemes (JWT + API Key)
   - Tags para organizar endpoints
2. Define schemas para todos los modelos
3. Incluye ejemplos de request/response

#### TAREA 4.3: Postman Collection ✅
**Instrucciones:**
1. Exporta OpenAPI a Postman
2. Crea `/backend/src/api/bridge/docs/postman.json`
3. Añade:
   - Variables de entorno
   - Pre-request scripts para auth
   - Tests automáticos
   - Ejemplos de uso

### 🔌 Día 5: WebSocket y Eventos

#### TAREA 5.1: Socket.io Server ✅
**Instrucciones:**
1. Consulta MCP context7 sobre Socket.io namespaces
2. Crea `/backend/src/api/bridge/v1/services/websocket.service.ts`:
   - Servidor Socket.io independiente
   - Namespace `/bridge`
   - Rooms por companyId
   - Authentication middleware
3. No interferir con Socket.io del core

#### TAREA 5.2: Event Bus ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/v1/services/eventBus.service.ts`:
   - Publish eventos a Redis
   - Subscribe a eventos del core
   - Event types enum
   - Event payload validation
2. Prefijo para eventos: `bridge:`
3. TTL de eventos: 24 horas

#### TAREA 5.3: Webhook Delivery ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/v1/services/webhook.service.ts`:
   - Queue de webhooks con Bull
   - Retry logic (3 intentos, backoff exponencial)
   - Webhook signature (HMAC-SHA256)
   - Delivery logs
2. Timeout: 30 segundos
3. Max payload: 10MB

### 🧪 Día 6: Testing Infrastructure

#### TAREA 6.1: Unit Tests Setup ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/jest.config.js`:
   - Coverage threshold: 80%
   - Test match patterns
   - Setup files
2. Crea tests para:
   - JWT service
   - API Key service
   - Auth middleware
3. Mock de Redis y database

#### TAREA 6.2: Integration Tests ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/tests/integration/setup.ts`:
   - Test database setup
   - Test Redis setup
   - Supertest configuration
2. Tests para health check endpoint
3. Tests para auth flow completo

#### TAREA 6.3: Contract Testing ✅
**Instrucciones:**
1. Consulta MCP context7 sobre contract testing
2. Define contratos entre Bridge y Core
3. Implementa tests de contrato básicos
4. Documenta proceso de validación

### 📚 Día 7: SDK y Documentación

#### TAREA 7.1: TypeScript SDK Base ⬜
**Instrucciones:**
1. Crea `/backend/src/api/bridge/sdk/index.ts`:
```typescript
export class TucanLinkSDK {
  constructor(config: SDKConfig)
  tickets: TicketsAPI
  messages: MessagesAPI
  contacts: ContactsAPI
  events: EventsAPI
}
```
2. Implementa cliente HTTP con axios
3. Auto-retry y error handling

#### TAREA 7.2: SDK Documentation ⬜
**Instrucciones:**
1. Crea `/backend/src/api/bridge/sdk/README.md`
2. Incluye:
   - Installation instructions
   - Quick start examples
   - API reference
   - Error codes
3. Genera TypeDoc documentation

#### TAREA 7.3: Migration Guide ⬜
**Instrucciones:**
1. Crea `/backend/src/api/bridge/MIGRATION.md`:
   - Cómo migrar del core a Bridge
   - Mapping de endpoints antiguos a nuevos
   - Breaking changes
   - Deprecation timeline
2. Incluye code snippets before/after

---

## 📋 FASE 1.5: DATABASE INTEGRATION CRÍTICA [1 DÍA]

### 🔴 Día 7: Persistencia de API Keys

#### TAREA 7.1: Crear Migración para API Keys ✅
**Instrucciones:**
1. Crea migración en `/backend/src/database/migrations/`:
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_prefix VARCHAR(10) NOT NULL,
  hashed_key VARCHAR(255) UNIQUE NOT NULL,
  company_id INTEGER NOT NULL REFERENCES Companies(id),
  name VARCHAR(255) NOT NULL,
  permissions JSON DEFAULT '[]',
  rate_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES Users(id),
  metadata JSON,
  INDEX idx_api_keys_company (company_id),
  INDEX idx_api_keys_active (is_active),
  INDEX idx_api_keys_prefix (key_prefix)
);
```
2. Crear tabla de auditoría para tracking
3. Ejecutar migración sin afectar el core

#### TAREA 7.2: Crear Modelo Sequelize ✅
**Instrucciones:**
1. Crea `/backend/src/api/bridge/v1/models/ApiKey.ts`:
   - Modelo Sequelize-TypeScript
   - Asociaciones con Company y User
   - Hooks para auditoría
   - Métodos de instancia para validación
2. NO importar modelos del core
3. Usar conexión separada si es posible

#### TAREA 7.3: Actualizar API Key Service con Persistencia ✅
**Instrucciones:**
1. Modificar `/backend/src/api/bridge/v1/services/auth/apiKey.service.ts`:
   - Agregar métodos `saveToDatabase()` y `fetchFromDatabase()`
   - Implementar flujo híbrido Cache L1 + DB L2:
     ```typescript
     // 1. Check cache first (fast)
     // 2. If not in cache, check database
     // 3. If found in DB, repopulate cache
     // 4. Return validated key data
     ```
2. Mantener compatibilidad con código actual
3. Agregar transacciones para operaciones críticas

#### TAREA 7.4: Implementar Auditoría y Métricas ✅
**Instrucciones:**
1. Crear tabla `api_key_usage`:
```sql
CREATE TABLE api_key_usage (
  id SERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```
2. Implementar logging de uso en middleware
3. Crear endpoint para estadísticas de uso

#### TAREA 7.5: Tests de Persistencia ✅
**Instrucciones:**
1. Crear `/backend/src/api/bridge/tests/unit/services/apiKey.persistence.test.ts`
2. Tests para:
   - Creación y recuperación desde BD
   - Supervivencia a reinicios
   - Sincronización cache-DB
   - Revocación persistente
3. Mock de base de datos para tests unitarios

#### TAREA 7.6: Migración de Keys Existentes ✅
**Instrucciones:**
1. Script para migrar API Keys en memoria a BD
2. Endpoint admin para regenerar keys
3. Documentar proceso de migración
4. Backward compatibility durante transición

### 🎯 Objetivos Críticos:
- ✅ API Keys sobreviven reinicios del servidor
- ✅ Auditabilidad completa de uso
- ✅ Escalabilidad horizontal (múltiples instancias)
- ✅ Recuperación y backup posibles
- ✅ Sin impacto en el core o WhatsApp

### ⚠️ Consideraciones:
- **Cache Strategy**: L1 (NodeCache) → L2 (PostgreSQL) → L3 (Redis opcional)
- **Performance**: Cache hit ratio > 95%
- **Security**: Nunca almacenar keys en texto plano
- **Compatibility**: Mantener funcionamiento actual durante migración

---

## 📋 ANÁLISIS DE APIs FALTANTES - ESTADO ACTUAL

### ✅ APIs COMPLETAMENTE IMPLEMENTADAS [12/36 - 33%]:

#### APIs Core (7):
1. **Tickets API** - Gestión completa de tickets ✅
2. **Messages API** - Envío/recepción de mensajes WhatsApp ✅
3. **Contacts API** - Gestión completa de contactos ✅
4. **Queues API** - Gestión de colas y asignaciones ✅
5. **WhatsApp API** - Sesiones WhatsApp con QR code ✅
6. **API Keys** - Gestión de API keys con persistencia ✅
7. **Admin API** - Endpoints administrativos ✅

#### APIs Críticas (5) - COMPLETADAS HOY:
8. **Users API** - Autenticación y gestión de usuarios ✅ [2025-08-28]
9. **Tags API** - Categorización de tickets ✅ [2025-08-28]
10. **Company API** - Multi-tenancy completo ✅ [2025-08-28]
11. **Settings API** - Configuraciones del sistema ✅ [2025-08-28]
12. **Schedule API** - Mensajes programados ✅ [2025-08-28]

### 🟡 APIs IMPORTANTES FALTANTES - MEDIA PRIORIDAD:
6. **Dashboard API** - Estadísticas y métricas
7. **QuickMessage API** - Respuestas rápidas predefinidas
8. **TicketNote API** - Notas internas en tickets
9. **ContactList API** - Listas de contactos para campañas
10. **ContactListItem API** - Items de listas de contactos
11. **Campaign API** - Campañas de mensajes masivos
12. **CampaignSetting API** - Configuración de campañas

### 🟢 APIs ADICIONALES FALTANTES - BAJA PRIORIDAD:
13. **Announcement API** - Anuncios del sistema
14. **Chat API** - Chat interno entre usuarios
15. **Help API** - Sistema de ayuda
16. **Plan API** - Planes de suscripción
17. **Invoice API** - Facturación
18. **Subscription API** - Suscripciones
19. **Files API** - Gestión de archivos
20. **Prompt API** - Prompts de IA
21. **QueueOption API** - Opciones de colas
22. **QueueIntegration API** - Integraciones con colas
23. **FlowBuilder API** - Constructor de flujos
24. **FlowCampaign API** - Flujos de campañas
25. **FlowDefault API** - Flujos predeterminados
26. **WebhookConfig API** - Configuración de webhooks
27. **TicketTag API** - Relación ticket-tags
28. **UserRating API** - Calificaciones de usuarios
29. **Webhook API** - Webhooks activos

### 📊 RESUMEN DEL ANÁLISIS [Actualizado 2025-08-28]:
- **Total APIs en sistema core:** 36
- **APIs implementadas:** 12 (33%)
- **APIs faltantes:** 24 (67%)
- **APIs críticas pendientes:** 0 (100% completadas)

## 📋 FASE 2: IMPLEMENTACIÓN DE ENDPOINTS CORE [10 DÍAS]

### 🔴 TAREAS CRÍTICAS URGENTES - Messages y Contacts API

#### 🚨 TAREA CRÍTICA 1: Messages Controller ✅ [COMPLETADO]
**Ubicación:** `/backend/src/api/bridge/v1/controllers/messages.controller.ts`
**Instrucciones:**
1. Crear el controlador de mensajes importando modelos del core
2. Implementar métodos esenciales:
   - `send()` - Enviar mensaje usando SendMessage helper del core
   - `list()` - Listar mensajes con paginación
   - `getByTicket()` - Obtener mensajes de un ticket específico
   - `markAsRead()` - Marcar mensajes como leídos
3. Conectar con la base de datos existente (como en tickets.controller)
4. NO modificar la lógica de WhatsApp del core

#### 🚨 TAREA CRÍTICA 2: Messages Routes ✅ [COMPLETADO]
**Ubicación:** `/backend/src/api/bridge/v1/routes/messages.routes.ts`
**Instrucciones:**
1. Crear archivo de rutas con validación Joi
2. Endpoints mínimos requeridos:
   - POST /api/bridge/v1/messages - Enviar mensaje
   - GET /api/bridge/v1/messages - Listar mensajes
   - GET /api/bridge/v1/messages/ticket/:ticketId - Mensajes por ticket
3. Registrar en server.ts
4. Probar envío y recepción

#### 🚨 TAREA CRÍTICA 3: Contacts Controller ✅ [COMPLETADO]
**Ubicación:** `/backend/src/api/bridge/v1/controllers/contacts.controller.ts`
**Instrucciones:**
1. Crear controlador importando modelo Contact del core
2. Métodos principales:
   - `list()` - Listar con paginación y búsqueda
   - `create()` - Crear contacto validando número WhatsApp
   - `update()` - Actualizar datos del contacto
   - `show()` - Obtener contacto por ID
   - `search()` - Buscar por número o nombre
3. Evitar duplicados por número + companyId

#### 🚨 TAREA CRÍTICA 4: Contacts Routes ✅ [COMPLETADO]
**Ubicación:** `/backend/src/api/bridge/v1/routes/contacts.routes.ts`
**Instrucciones:**
1. Crear archivo de rutas con validación
2. Endpoints requeridos:
   - GET /api/bridge/v1/contacts - Listar todos
   - POST /api/bridge/v1/contacts - Crear nuevo
   - GET /api/bridge/v1/contacts/:id - Obtener uno
   - PUT /api/bridge/v1/contacts/:id - Actualizar
3. Registrar en server.ts

---

### 🎫 Día 8-9: Tickets API

#### TAREA 8.1: List Tickets Endpoint ✅
**Instrucciones:**
1. Consulta MCP context7 sobre paginación best practices
2. Crea `/backend/src/api/bridge/v1/controllers/tickets.controller.ts`
3. Implementa GET `/api/bridge/v1/tickets`:
   - Filtros: status, userId, queueId, date range
   - Paginación: limit, offset, cursor
   - Sorting: createdAt, updatedAt, priority
   - Include: messages, contact, user
4. Respeta companyId isolation

#### TAREA 8.2: Create Ticket Endpoint ✅
**Instrucciones:**
1. Implementa POST `/api/bridge/v1/tickets`:
   - Validación con Joi
   - Auto-assign a queue si aplica
   - Trigger eventos: ticket.created
   - Return ticket completo con contact
2. Maneja casos edge: contacto no existe

#### TAREA 8.3: Update Ticket Endpoint ✅
**Instrucciones:**
1. Implementa PUT `/api/bridge/v1/tickets/:id`:
   - Partial updates (PATCH semantics)
   - Status transitions validation
   - Audit trail en TicketTracking
   - Trigger eventos según cambios
2. Validar permisos por usuario

#### TAREA 8.4: Ticket Actions Endpoints ✅
**Instrucciones:**
1. POST `/api/bridge/v1/tickets/:id/transfer` - Transfer a queue/user
2. POST `/api/bridge/v1/tickets/:id/resolve` - Mark as resolved
3. POST `/api/bridge/v1/tickets/:id/reopen` - Reopen ticket
4. GET `/api/bridge/v1/tickets/:id/history` - Audit trail

### 💬 Día 10-11: Messages API

#### TAREA 10.1: Send Message Endpoint ⬜
**Instrucciones:**
1. Consulta MCP context7 sobre WhatsApp message types
2. POST `/api/bridge/v1/messages`:
   - Tipos: text, image, document, audio, video
   - Validación de media (size, format)
   - Queue en Bull para rate limiting
   - Return messageId inmediato, status async
3. Max file size: 16MB

#### TAREA 10.2: List Messages Endpoint ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/messages`:
   - Filter por ticketId (required)
   - Paginación inversa (mensajes más nuevos primero)
   - Include: media URLs con signed URLs
   - Mark as read option
2. Cache de mensajes recientes

#### TAREA 10.3: Message Status Webhook ⬜
**Instrucciones:**
1. POST `/api/bridge/v1/messages/:id/status`:
   - Update delivery status
   - Read receipts
   - Error handling
2. Emit eventos para actualización real-time

#### TAREA 10.4: Bulk Messages Endpoint ⬜
**Instrucciones:**
1. POST `/api/bridge/v1/messages/bulk`:
   - Send a múltiples contactos
   - Template support
   - Variable substitution
   - Progress tracking
2. Return jobId para tracking

### 👥 Día 12: Contacts API

#### TAREA 12.1: Contacts CRUD ⬜
**Instrucciones:**
1. Implementa endpoints completos:
   - GET `/api/bridge/v1/contacts` - List con búsqueda
   - POST `/api/bridge/v1/contacts` - Create/update
   - GET `/api/bridge/v1/contacts/:id` - Get details
   - PUT `/api/bridge/v1/contacts/:id` - Update
   - DELETE `/api/bridge/v1/contacts/:id` - Soft delete
2. Custom fields support

#### TAREA 12.2: Contact Import Endpoint ⬜
**Instrucciones:**
1. POST `/api/bridge/v1/contacts/import`:
   - CSV/Excel support
   - Validation y error reporting
   - Duplicate handling strategies
   - Background processing
2. Return import report

#### TAREA 12.3: Contact Tags ⬜
**Instrucciones:**
1. POST `/api/bridge/v1/contacts/:id/tags` - Add tags
2. DELETE `/api/bridge/v1/contacts/:id/tags/:tagId` - Remove tag
3. GET `/api/bridge/v1/contacts/by-tag/:tagId` - Filter by tag

### 🏢 Día 13: Companies & Users API

#### TAREA 13.1: Companies Endpoints ✅ [COMPLETADO 2025-08-28]
**Instrucciones:**
1. GET `/api/bridge/v1/companies/current` - Current company info
2. PUT `/api/bridge/v1/companies/current` - Update settings
3. GET `/api/bridge/v1/companies/current/stats` - Usage statistics
4. Multi-tenancy validation en todos los endpoints

#### TAREA 13.2: Users Management ✅ [COMPLETADO 2025-08-28]
**Instrucciones:**
1. GET `/api/bridge/v1/users` - List users de la company
2. POST `/api/bridge/v1/users/invite` - Invite new user
3. PUT `/api/bridge/v1/users/:id` - Update permissions
4. DELETE `/api/bridge/v1/users/:id` - Deactivate user

#### TAREA 13.3: Permissions System ⬜
**Instrucciones:**
1. Define permission scopes:
   - tickets:read, tickets:write
   - messages:send
   - contacts:manage
   - settings:admin
2. Middleware para check permissions
3. Return 403 con scope requerido

### 📊 Día 14: Queues & Flows API

#### TAREA 14.1: Queues Management ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/queues` - List queues
2. POST `/api/bridge/v1/queues` - Create queue
3. PUT `/api/bridge/v1/queues/:id` - Update queue
4. POST `/api/bridge/v1/queues/:id/assign` - Assign users

#### TAREA 14.2: Flow Builder Read API ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/flows` - List flows
2. GET `/api/bridge/v1/flows/:id` - Get flow definition
3. GET `/api/bridge/v1/flows/:id/stats` - Execution stats
4. Read-only por ahora

#### TAREA 14.3: Campaigns API ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/campaigns` - List campaigns
2. GET `/api/bridge/v1/campaigns/:id` - Campaign details
3. GET `/api/bridge/v1/campaigns/:id/status` - Execution status
4. POST `/api/bridge/v1/campaigns/:id/pause` - Pause campaign

### 🔧 Día 15: Settings & Configuration API

#### TAREA 15.1: Settings Endpoints ✅ [COMPLETADO 2025-08-28]
**Instrucciones:**
1. GET `/api/bridge/v1/settings` - All settings
2. GET `/api/bridge/v1/settings/:key` - Specific setting
3. PUT `/api/bridge/v1/settings/:key` - Update setting
4. Validate setting values según type

#### TAREA 15.2: WhatsApp Sessions API ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/whatsapp/sessions` - List sessions
2. GET `/api/bridge/v1/whatsapp/sessions/:id/status` - Session status
3. GET `/api/bridge/v1/whatsapp/sessions/:id/qr` - QR code
4. POST `/api/bridge/v1/whatsapp/sessions/:id/restart` - Restart session

#### TAREA 15.3: Webhooks Configuration ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/webhooks` - List configured webhooks
2. POST `/api/bridge/v1/webhooks` - Register webhook
3. PUT `/api/bridge/v1/webhooks/:id` - Update webhook
4. DELETE `/api/bridge/v1/webhooks/:id` - Remove webhook
5. POST `/api/bridge/v1/webhooks/:id/test` - Send test event

### 📈 Día 16-17: Analytics & Reports API

#### TAREA 16.1: Dashboard Stats ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/analytics/dashboard`:
   - Tickets stats (open, closed, pending)
   - Messages count (sent, received)
   - Response time metrics
   - User performance
2. Date range filters
3. Cache por 5 minutos

#### TAREA 16.2: Reports Generation ⬜
**Instrucciones:**
1. POST `/api/bridge/v1/reports/generate`:
   - Report types: tickets, messages, contacts
   - Format: JSON, CSV, PDF
   - Filters y date range
   - Email delivery option
2. Background processing

#### TAREA 16.3: Real-time Metrics ⬜
**Instrucciones:**
1. WebSocket endpoint para metrics:
   - Active users count
   - Messages per minute
   - Queue sizes
   - System health
2. Update cada 10 segundos

---

## 📋 FASE 3: EVENT SYSTEM & WEBHOOKS [5 DÍAS]

### 📡 Día 18: Event Publisher

#### TAREA 18.1: Event Types Definition ⬜
**Instrucciones:**
1. Crea `/backend/src/api/bridge/v1/types/events.ts`:
```typescript
enum EventTypes {
  // Tickets
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_ASSIGNED = 'ticket.assigned',
  // Messages
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_DELIVERED = 'message.delivered',
  // Contacts
  CONTACT_CREATED = 'contact.created',
  // ... más eventos
}
```
2. Define payload interfaces para cada evento
3. Validación con Joi schemas

#### TAREA 18.2: Event Publisher Service ⬜
**Instrucciones:**
1. Crea servicio para publicar eventos:
   - Publish to Redis pub/sub
   - Event metadata: timestamp, companyId, userId
   - Event deduplication (idempotency key)
   - Batch events support
2. Max event size: 256KB

#### TAREA 18.3: Event Listener Integration ⬜
**Instrucciones:**
1. Integra listeners en el core sin modificarlo:
   - Hook into Socket.io emissions
   - Database triggers vía Sequelize hooks
   - Queue job completions
2. Transform core events a Bridge format

### 🪝 Día 19: Webhook Delivery System

#### TAREA 19.1: Webhook Registry ⬜
**Instrucciones:**
1. Modelo WebhookSubscription:
   - URL, events[], active, secret
   - Headers customizados
   - Retry configuration
2. CRUD operations
3. Validation de URL accesible

#### TAREA 19.2: Webhook Queue Processor ⬜
**Instrucciones:**
1. Bull queue para delivery:
   - Retry con backoff exponencial
   - Dead letter queue
   - Delivery logs
   - Circuit breaker pattern
2. Concurrent deliveries: 10

#### TAREA 19.3: Webhook Security ⬜
**Instrucciones:**
1. Implementa signature verification:
   - HMAC-SHA256 con secret
   - Timestamp validation (5 min window)
   - Replay attack prevention
2. Headers: X-Signature, X-Timestamp

### 🔄 Día 20: WebSocket Events

#### TAREA 20.1: Socket.io Namespaces ⬜
**Instrucciones:**
1. Namespace `/api/bridge/v1/events`:
   - Room por companyId
   - Event filtering por subscription
   - Acknowledgment support
2. Max connections: 1000

#### TAREA 20.2: Event Subscription API ⬜
**Instrucciones:**
1. Cliente puede subscribirse a eventos específicos:
```javascript
socket.emit('subscribe', {
  events: ['ticket.created', 'message.received'],
  filters: { queueId: 123 }
});
```
2. Unsubscribe support
3. List active subscriptions

#### TAREA 20.3: Event History ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/events/history`:
   - Last 1000 events
   - Filter por type, date range
   - Pagination
2. Store events en Redis (TTL 7 días)

### 📊 Día 21: Monitoring & Observability

#### TAREA 21.1: Metrics Collection ⬜
**Instrucciones:**
1. Implementa Prometheus metrics:
   - API response times
   - Request counts por endpoint
   - Error rates
   - Active connections
2. Endpoint: `/api/bridge/metrics`

#### TAREA 21.2: Health Checks ⬜
**Instrucciones:**
1. GET `/api/bridge/v1/health/live` - Liveness
2. GET `/api/bridge/v1/health/ready` - Readiness
3. GET `/api/bridge/v1/health/detailed` - Component status:
   - Database connection
   - Redis connection
   - Core API availability
   - Queue sizes

#### TAREA 21.3: Distributed Tracing ⬜
**Instrucciones:**
1. Consulta MCP context7 sobre OpenTelemetry
2. Añade tracing headers:
   - X-Request-ID
   - X-Correlation-ID
   - X-Span-ID
3. Log correlation

### 🔐 Día 22: Security Hardening

#### TAREA 22.1: Rate Limiting ⬜
**Instrucciones:**
1. Implementa rate limiting por:
   - IP address: 100 req/min
   - API Key: 1000 req/min
   - User token: 500 req/min
2. Headers: X-RateLimit-*
3. 429 response con retry-after

#### TAREA 22.2: Input Validation ⬜
**Instrucciones:**
1. Joi schemas para todos los endpoints
2. Sanitización de inputs:
   - SQL injection prevention
   - XSS prevention
   - Path traversal prevention
3. Error messages sin info sensible

#### TAREA 22.3: Audit Logging ⬜
**Instrucciones:**
1. Log todas las operaciones sensibles:
   - Auth attempts
   - Data modifications
   - Permission changes
   - API key usage
2. Formato estructurado (JSON)
3. Retention: 90 días

---

## 📋 FASE 4: SDK & DEVELOPER EXPERIENCE [5 DÍAS]

### 📦 Día 23-24: TypeScript SDK

#### TAREA 23.1: SDK Core Structure ⬜
**Instrucciones:**
1. Estructura del SDK:
```typescript
@tucanlink/bridge-sdk/
├── src/
│   ├── client.ts         // Main SDK class
│   ├── resources/        // API resources
│   │   ├── tickets.ts
│   │   ├── messages.ts
│   │   ├── contacts.ts
│   │   └── ...
│   ├── types/           // TypeScript types
│   ├── errors/          // Custom errors
│   └── utils/           // Helpers
├── tests/
├── examples/
└── package.json
```

#### TAREA 23.2: SDK Resource Implementation ⬜
**Instrucciones:**
1. Implementa recursos principales:
```typescript
class TicketsResource {
  list(filters?: TicketFilters): Promise<PaginatedResponse<Ticket>>
  get(id: string): Promise<Ticket>
  create(data: CreateTicketData): Promise<Ticket>
  update(id: string, data: UpdateTicketData): Promise<Ticket>
}
```
2. Auto-retry con backoff
3. Request/response interceptors

#### TAREA 23.3: SDK Authentication ⬜
**Instrucciones:**
1. Soporte para múltiples auth methods:
   - API Key
   - JWT token
   - OAuth2 (futuro)
2. Auto-refresh de tokens
3. Secure storage recommendations

#### TAREA 24.1: SDK Testing ⬜
**Instrucciones:**
1. Unit tests con Jest:
   - Mock de HTTP client
   - Coverage > 90%
2. Integration tests contra API real
3. Example apps:
   - Basic ticket management
   - Bulk messaging
   - Webhook listener

#### TAREA 24.2: SDK Documentation ⬜
**Instrucciones:**
1. Genera docs con TypeDoc
2. README.md completo:
   - Installation
   - Quick start
   - Authentication
   - Error handling
   - Full API reference
3. Publish to npm registry privado

### 📖 Día 25: Developer Portal

#### TAREA 25.1: API Documentation Site ⬜
**Instrucciones:**
1. Swagger UI hosted en `/api/bridge/docs`
2. Customización:
   - Logo y branding
   - Try it out habilitado
   - Ejemplos múltiples
3. Search functionality

#### TAREA 25.2: Interactive Examples ⬜
**Instrucciones:**
1. Postman collection completa
2. Code examples en:
   - TypeScript/JavaScript
   - Python
   - PHP
   - cURL
3. Runnable en CodeSandbox

#### TAREA 25.3: Changelog & Versioning ⬜
**Instrucciones:**
1. CHANGELOG.md con:
   - Breaking changes
   - New features
   - Deprecations
   - Migration guides
2. Semantic versioning
3. RSS feed para updates

### 🧪 Día 26-27: Testing & QA

#### TAREA 26.1: E2E Test Suite ⬜
**Instrucciones:**
1. Tests end-to-end con Cypress o Playwright:
   - Create ticket flow
   - Send message flow
   - Webhook delivery
2. Data isolation entre tests
3. CI/CD integration

#### TAREA 26.2: Load Testing ⬜
**Instrucciones:**
1. Consulta MCP context7 sobre k6 o Artillery
2. Scenarios:
   - 100 concurrent users
   - 1000 messages/minute
   - Webhook delivery under load
3. Performance benchmarks

#### TAREA 26.3: Security Testing ⬜
**Instrucciones:**
1. OWASP API Security Top 10
2. Penetration testing checklist
3. Dependency vulnerability scan
4. Secrets scanning

#### TAREA 27.1: Backwards Compatibility ⬜
**Instrucciones:**
1. Verifica que el core sigue funcionando
2. Test de regresión completo
3. Monitor de WhatsApp sessions
4. Zero downtime validation

---

## 📋 FASE 5: INFRASTRUCTURE & DEPLOYMENT [3 DÍAS]

### 🎯 Día 28: Production Infrastructure

#### TAREA 28.2: Module SDK Client ⬜
**Instrucciones:**
1. Cliente pre-configurado para Bridge API:
```typescript
import { TucanLinkBridge } from './bridge-client';

export class ModuleBase {
  protected bridge: TucanLinkBridge;
  
  constructor(config: ModuleConfig) {
    this.bridge = new TucanLinkBridge({
      apiKey: config.apiKey,
      baseUrl: config.bridgeUrl
    });
  }
}
```
2. Exportar como npm package interno
3. Documentación de uso para desarrollo interno

### 🐳 Día 29: Docker Configuration

#### TAREA 29.1: Docker Compose Stack ⬜
**Instrucciones:**
1. Crea `/docker-compose.modules.yml`:
```yaml
version: '3.8'
services:
  tucanlink-core:
    build: ./backend
    ports: ["8080:8080"]
    networks: [tucanlink]
    
  api-bridge:
    build: ./backend
    command: npm run api:bridge
    ports: ["8090:8090"]
    networks: [tucanlink]
    
  nginx-gateway:
    image: nginx:alpine
    ports: ["80:80"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    networks: [tucanlink]

networks:
  tucanlink:
    driver: bridge
```

#### TAREA 29.2: Nginx API Gateway ⬜
**Instrucciones:**
1. Configura Nginx como API Gateway:
```nginx
upstream core { server tucanlink-core:8080; }
upstream bridge { server api-bridge:8090; }
upstream module1 { server module1:8081; }

location /api/core { proxy_pass http://core; }
location /api/bridge { proxy_pass http://bridge; }
location /api/modules/module1 { proxy_pass http://module1; }
```
2. Rate limiting en Nginx
3. SSL termination

#### TAREA 29.3: Module Registry ⬜
**Instrucciones:**
1. Service discovery básico:
   - Módulos se registran en Redis
   - Health check automático
   - Auto-unregister si falla
2. API para listar módulos activos

### 🚀 Día 30: CI/CD Pipeline

#### TAREA 30.1: GitHub Actions Workflow ⬜
**Instrucciones:**
1. `.github/workflows/api-bridge.yml`:
   - Build & test on PR
   - Security scanning
   - Docker image build
   - Deploy to staging
2. Matrix testing: Node 18, 20

#### TAREA 30.2: Deployment Scripts ⬜
**Instrucciones:**
1. Scripts de deployment:
   - Blue-green deployment
   - Database migrations
   - Health check validation
   - Rollback automático
2. Zero downtime guarantee

#### TAREA 30.3: Monitoring Setup ⬜
**Instrucciones:**
1. Stack de monitoring:
   - Prometheus para métricas
   - Grafana para dashboards
   - Loki para logs
   - Alertmanager para alertas
2. Dashboards pre-configurados

### 🔄 Día 31-32: Migration Tools

#### TAREA 31.1: Data Migration Scripts ⬜
**Instrucciones:**
1. Scripts para migrar datos del core:
   - Export de tickets
   - Export de contactos
   - Export de mensajes
2. Formato: JSON Lines
3. Chunking para datasets grandes

#### TAREA 31.2: Module Migration Assistant ⬜
**Instrucciones:**
1. Herramienta para migrar código:
   - Analiza código existente
   - Sugiere estructura de módulo
   - Genera boilerplate
2. Report de compatibilidad

#### TAREA 32.1: Backwards Compatibility Layer ⬜
**Instrucciones:**
1. Proxy endpoints antiguos a Bridge:
   - Map old routes to new
   - Transform request/response
   - Deprecation warnings
2. Configurable vía feature flags

---

## 📋 FASE 6: TESTING & VALIDATION [3 DÍAS]

### 📝 Día 33: API Bridge Documentation

#### TAREA 33.1: API Bridge Documentation ⬜
**Instrucciones:**
1. Documentación completa del API Bridge:
   - Endpoints disponibles
   - Autenticación (JWT + API Keys)
   - Rate limiting y permisos
   - WebSocket events
   - Error codes y troubleshooting
2. Postman collection actualizada
3. Examples de integración

### 🧪 Día 34: Integration Testing

#### TAREA 34.1: Core + Bridge Integration ⬜
**Instrucciones:**
1. Test scenarios:
   - Core sigue funcionando normal
   - Bridge puede acceder a todos los datos
   - Eventos se propagan correctamente
   - No hay memory leaks
2. 24 horas de test continuo

### ✅ Día 35: Production Readiness

#### TAREA 35.1: Performance & Security Audit ⬜
**Instrucciones:**
1. Performance testing:
   - Load testing del API Bridge
   - Database query optimization
   - Memory usage monitoring
2. Security review:
   - API Keys security
   - JWT token validation
   - SQL injection prevention
   - Rate limiting effectiveness

---

## 📋 FASE 7: DEPLOYMENT & MONITORING [2 DÍAS]

### ✅ Día 36: Production Deployment

#### TAREA 36.1: Production Deployment Setup ⬜
**Instrucciones:**
1. Production environment setup:
   - SSL certificates configuration
   - Database backup strategy
   - Monitoring and alerting setup
   - Log aggregation configuration
2. Deployment checklist and rollback procedures

### 📊 Día 37: Monitoring & Final Validation

#### TAREA 37.1: Monitoring Setup ⬜
**Instrucciones:**
1. Comprehensive monitoring:
   - API Bridge performance metrics
   - Database connectivity checks
   - WhatsApp service status
   - Memory/CPU usage monitoring
2. Alerting rules and status dashboard

#### TAREA 37.2: Final System Validation ⬜
**Instrucciones:**
1. Complete system validation:
   - Core CRM functioning normally
   - API Bridge endpoints operational
   - Authentication system working
   - Real-time events functioning
   - Load testing passed
2. Business acceptance and project sign-off

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Técnicos
- ✅ Zero downtime durante implementación
- ✅ API response time < 100ms (p95)
- ✅ Test coverage > 80%
- ✅ No memory leaks
- ✅ 99.9% uptime

### KPIs de Negocio
- ✅ API Bridge disponible para desarrollo interno
- ✅ Reducción en tiempo de desarrollo de features CRM
- ✅ 100% backward compatibility
- ✅ Base sólida para escalabilidad del CRM

---

## 🚨 CONTINGENCIAS

### Si WhatsApp se desconecta
1. NUNCA fue culpa del Bridge (no toca el core)
2. Revisar logs del core
3. Restart solo el servicio de WhatsApp

### Si un módulo falla
1. El módulo está aislado, no afecta otros
2. Restart automático del módulo
3. Alertas al admin

### Si el Bridge falla
1. Core sigue funcionando normal
2. Módulos entran en modo degradado
3. Cache local en módulos

---

## 📝 NOTAS FINALES

### Para la IA que ejecute este plan:

1. **SIEMPRE** consulta MCP context7 antes de cada implementación
2. **NUNCA** modifiques código del core existente
3. **MARCA** cada tarea completada con ✅
4. **DOCUMENTA** cada decisión importante
5. **PRUEBA** antes de marcar como completado
6. **COMMITEA** cambios con mensajes descriptivos

### Comandos útiles:
```bash
# Verificar que WhatsApp sigue activo
curl http://localhost:8080/health

# Verificar Bridge API
curl http://localhost:8090/api/bridge/v1/health

# Ver logs en tiempo real
docker logs -f tucanlink-core

# Ejecutar tests
npm test -- --coverage

# Verificar puertos en uso
lsof -i :8080,8090,8081
```

### Archivos clave a NO modificar:
- `/backend/src/services/WbotServices/*`
- `/backend/src/libs/wbot.ts`
- `/backend/src/libs/socket.ts`
- Cualquier archivo fuera de `/backend/src/api/bridge/`

---

**INICIO DEL DESARROLLO:** Comienza con FASE 1, TAREA 1.1

**RECUERDA:** Este es un proyecto CRÍTICO. Zero downtime es OBLIGATORIO.

---

*Documento creado para guiar la implementación paso a paso de la arquitectura Bridge*
*Última actualización: [FECHA_ACTUAL]*
*Versión: 1.0.0*