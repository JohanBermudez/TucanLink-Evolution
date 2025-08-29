# 📋 PLAN DE IMPLEMENTACIÓN SISTEMA OMNICANAL - TUCANLINK

## 🎯 RESUMEN EJECUTIVO

### Estado Actual
- **✅ Funcional**: CRM TucanLink con WhatsApp no oficial (Baileys) operativo
- **✅ Existente**: API Bridge con 12 endpoints implementados
- **✅ Base inicial**: Estructura de canales en `/backend/src/api/channels/`
- **⚠️ Limitación**: Sistema mono-canal (solo WhatsApp Baileys)
- **⚠️ Riesgo**: Cualquier cambio puede afectar el servicio actual

### Objetivos del Proyecto
1. **Mantener operativo** el WhatsApp actual (Baileys) sin ninguna interrupción
2. **Crear arquitectura multi-canal** que soporte N canales simultáneos
3. **Implementar WhatsApp Cloud API** como segundo canal funcional
4. **Establecer sistema extensible** para agregar futuros canales sin modificar el core
5. **Unificar la experiencia** en un solo inbox con identificación visual por canal

### Principios de Desarrollo
- **Zero Downtime**: El servicio actual NUNCA debe interrumpirse
- **No Breaking Changes**: Compatibilidad total hacia atrás
- **Modular**: Cada canal es un módulo independiente
- **Extensible**: Nuevos canales se agregan sin tocar código existente
- **Unified**: Todos los mensajes en una vista unificada

---

## 📊 ARQUITECTURA OBJETIVO

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND CRM                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │  INBOX UNIFICADO                                  │ │
│  │  [WhatsApp Baileys] [WhatsApp Cloud] [Future...]  │ │
│  └───────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│               CHANNEL MANAGER SERVICE                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │
│  │  WhatsApp    │  │  WhatsApp    │  │   Future   │   │
│  │  Baileys     │  │  Cloud API   │  │  Channels  │   │
│  │  (Current)   │  │  (New)       │  │  (...)     │   │
│  └──────────────┘  └──────────────┘  └────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  TUCANLINK CORE                          │
│                  (Sin modificar)                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 FASE 1: INFRAESTRUCTURA MULTI-CANAL

### 📁 1.1 PREPARACIÓN Y ANÁLISIS

#### 1.1.1 Análisis del Sistema Actual
- [ ] Documentar flujo actual de mensajes WhatsApp Baileys
- [ ] Identificar todas las tablas que usa el sistema actual
- [ ] Mapear los modelos Sequelize existentes
- [ ] Listar todos los eventos Socket.io actuales
- [ ] Documentar estructura de tickets actual
- [ ] Analizar el modelo Contact actual
- [ ] Revisar el modelo Message actual
- [ ] Identificar servicios de WhatsApp en `/backend/src/services/WbotServices/`
- [ ] Documentar helpers existentes en `/backend/src/helpers/`
- [ ] Analizar sistema de colas (queues) actual

#### 1.1.2 Diseño de Base de Datos Multi-canal
- [ ] Diseñar tabla `channels` para gestión de canales
- [ ] Diseñar tabla `channel_connections` para conexiones activas
- [ ] Diseñar tabla `channel_messages` para mensajes multi-canal
- [ ] Diseñar tabla `channel_templates` para plantillas
- [ ] Diseñar tabla `channel_webhooks` para webhooks
- [ ] Crear diagrama ER de nuevas tablas
- [ ] Definir foreign keys con tablas existentes
- [ ] Planificar índices para performance
- [ ] Documentar estrategia de migración
- [ ] Crear script de rollback

### 📂 1.2 ESTRUCTURA DE DIRECTORIOS

#### 1.2.1 Crear Estructura Base
```bash
backend/src/channels/
```
- [ ] Crear directorio `/backend/src/channels/`
- [ ] Crear `/backend/src/channels/core/`
- [ ] Crear `/backend/src/channels/providers/`
- [ ] Crear `/backend/src/channels/adapters/`
- [ ] Crear `/backend/src/channels/models/`
- [ ] Crear `/backend/src/channels/services/`
- [ ] Crear `/backend/src/channels/controllers/`
- [ ] Crear `/backend/src/channels/routes/`
- [ ] Crear `/backend/src/channels/webhooks/`
- [ ] Crear `/backend/src/channels/utils/`
- [ ] Crear `/backend/src/channels/types/`
- [ ] Agregar archivos `.gitkeep` en directorios vacíos
- [ ] Crear `index.ts` en cada directorio

#### 1.2.2 Configuración TypeScript
- [ ] Actualizar `tsconfig.json` para incluir `/channels`
- [ ] Configurar path aliases para channels
- [ ] Agregar types para canales
- [ ] Configurar build para incluir channels

### 🗄️ 1.3 MIGRACIONES DE BASE DE DATOS

#### 1.3.1 Crear Migración Principal
```sql
-- Archivo: create-channels-infrastructure.js
```
- [ ] Escribir migración para tabla `channels`
- [ ] Agregar campos: id, name, type, company_id, status
- [ ] Agregar campos: is_default, is_active, credentials (JSONB)
- [ ] Agregar campos: settings (JSONB), metadata (JSONB)
- [ ] Agregar timestamps: created_at, updated_at
- [ ] Crear índices necesarios
- [ ] Agregar constraints y validaciones

#### 1.3.2 Crear Migración de Conexiones
```sql
-- Archivo: create-channel-connections.js
```
- [ ] Escribir migración para `channel_connections`
- [ ] Agregar relación con tabla channels
- [ ] Agregar relación con tabla Companies
- [ ] Agregar campos de configuración
- [ ] Agregar campos de estado y salud
- [ ] Crear índices compuestos

#### 1.3.3 Crear Migración de Mensajes
```sql
-- Archivo: create-channel-messages.js
```
- [ ] Escribir migración para `channel_messages`
- [ ] Agregar campos para soportar múltiples tipos de contenido
- [ ] Agregar relación con tickets
- [ ] Agregar campos de tracking (sent, delivered, read)
- [ ] Crear índices para búsquedas rápidas

#### 1.3.4 Ejecutar Migraciones
- [ ] Ejecutar migraciones en ambiente de desarrollo
- [ ] Verificar que no afectan tablas existentes
- [ ] Validar foreign keys
- [ ] Probar rollback de migraciones

### 🏗️ 1.4 MODELOS SEQUELIZE

#### 1.4.1 Modelo Channel
```typescript
// backend/src/channels/models/Channel.ts
```
- [ ] Crear modelo Channel con Sequelize-TypeScript
- [ ] Definir atributos y tipos
- [ ] Configurar asociaciones con Company
- [ ] Agregar hooks para auditoría
- [ ] Agregar métodos de instancia
- [ ] Agregar métodos estáticos
- [ ] Implementar validaciones
- [ ] Agregar scopes útiles

#### 1.4.2 Modelo ChannelConnection
```typescript
// backend/src/channels/models/ChannelConnection.ts
```
- [ ] Crear modelo ChannelConnection
- [ ] Definir relaciones con Channel y Company
- [ ] Implementar encriptación de credenciales
- [ ] Agregar métodos para health check
- [ ] Implementar gestión de estado
- [ ] Agregar validaciones de credenciales

#### 1.4.3 Modelo ChannelMessage
```typescript
// backend/src/channels/models/ChannelMessage.ts
```
- [ ] Crear modelo ChannelMessage
- [ ] Definir tipos de contenido soportados
- [ ] Implementar relaciones con Ticket
- [ ] Agregar campos para multimedia
- [ ] Implementar tracking de estado
- [ ] Agregar índices para performance

### 🔧 1.5 SERVICIOS CORE

#### 1.5.1 ChannelManager Service
```typescript
// backend/src/channels/services/ChannelManager.ts
```
- [ ] Crear clase ChannelManager (Singleton)
- [ ] Implementar registro de canales disponibles
- [ ] Crear método `registerChannel()`
- [ ] Crear método `getAvailableChannels()`
- [ ] Crear método `createConnection()`
- [ ] Crear método `removeConnection()`
- [ ] Implementar cache de conexiones activas
- [ ] Agregar event emitters
- [ ] Implementar health monitoring
- [ ] Agregar logging detallado

#### 1.5.2 MessageRouter Service
```typescript
// backend/src/channels/services/MessageRouter.ts
```
- [ ] Crear clase MessageRouter
- [ ] Implementar método `routeMessage()`
- [ ] Crear lógica de selección de canal
- [ ] Implementar fallback a canal default
- [ ] Crear queue de mensajes pendientes
- [ ] Implementar retry logic
- [ ] Agregar circuit breaker
- [ ] Implementar batching
- [ ] Agregar métricas de enrutamiento

#### 1.5.3 ChannelAdapter Service
```typescript
// backend/src/channels/adapters/CoreAdapter.ts
```
- [ ] Crear adaptador para comunicación con core
- [ ] Implementar conversión de mensajes a formato core
- [ ] Mantener compatibilidad con estructura actual
- [ ] Implementar sincronización de tickets
- [ ] Crear mapeo de contactos
- [ ] Implementar eventos bridge
- [ ] Agregar transformadores de datos

### 🎛️ 1.6 SISTEMA DE PLUGINS

#### 1.6.1 Channel Provider Interface
```typescript
// backend/src/channels/core/ChannelProvider.ts
```
- [ ] Actualizar interfaz ChannelProvider existente
- [ ] Definir métodos obligatorios
- [ ] Definir métodos opcionales
- [ ] Especificar estructura de metadata
- [ ] Definir tipos de eventos
- [ ] Especificar formato de errores
- [ ] Documentar lifecycle hooks

#### 1.6.2 Plugin Registry
```typescript
// backend/src/channels/core/PluginRegistry.ts
```
- [ ] Crear sistema de registro de plugins
- [ ] Implementar auto-discovery de plugins
- [ ] Validar plugins al registrar
- [ ] Gestionar versiones de plugins
- [ ] Implementar sistema de dependencias
- [ ] Agregar validación de capacidades

#### 1.6.3 Plugin Loader
```typescript
// backend/src/channels/core/PluginLoader.ts
```
- [ ] Crear cargador dinámico de plugins
- [ ] Implementar lazy loading
- [ ] Gestionar ciclo de vida de plugins
- [ ] Implementar hot-reload en desarrollo
- [ ] Agregar sandboxing básico

### 🔌 1.7 ADAPTADOR WHATSAPP BAILEYS

#### 1.7.1 Crear Provider para Baileys Existente
```typescript
// backend/src/channels/providers/whatsapp-baileys/index.ts
```
- [ ] Crear WhatsAppBaileysProvider
- [ ] Implementar interfaz ChannelProvider
- [ ] Wrappear servicios existentes de Baileys
- [ ] NO modificar código actual, solo wrappear
- [ ] Mantener todos los eventos actuales
- [ ] Implementar métodos de la interfaz
- [ ] Agregar metadata del canal
- [ ] Registrar en PluginRegistry

#### 1.7.2 Adapter para Mensajes Baileys
- [ ] Crear adaptador de mensajes Baileys a formato unificado
- [ ] Mantener estructura actual de tickets
- [ ] Preservar todos los campos actuales
- [ ] Agregar campo channel_type = 'whatsapp-baileys'
- [ ] Implementar backward compatibility total

#### 1.7.3 Testing del Adapter
- [ ] Verificar que Baileys sigue funcionando igual
- [ ] Probar envío de mensajes
- [ ] Probar recepción de mensajes
- [ ] Verificar webhooks
- [ ] Validar que no hay breaking changes

### 🌐 1.8 API ENDPOINTS

#### 1.8.1 Channels CRUD API
```typescript
// backend/src/channels/controllers/ChannelController.ts
```
- [ ] GET `/api/channels` - Listar canales disponibles
- [ ] GET `/api/channels/installed` - Canales instalados por empresa
- [ ] POST `/api/channels/connections` - Crear conexión
- [ ] GET `/api/channels/connections` - Listar conexiones
- [ ] GET `/api/channels/connections/:id` - Detalle conexión
- [ ] PUT `/api/channels/connections/:id` - Actualizar conexión
- [ ] DELETE `/api/channels/connections/:id` - Eliminar conexión
- [ ] POST `/api/channels/connections/:id/test` - Probar conexión
- [ ] GET `/api/channels/connections/:id/health` - Estado de salud

#### 1.8.2 Routes Configuration
```typescript
// backend/src/channels/routes/index.ts
```
- [ ] Configurar rutas de channels
- [ ] Agregar middleware de autenticación
- [ ] Implementar validación con Joi
- [ ] Agregar rate limiting
- [ ] Configurar CORS
- [ ] Documentar en Swagger

#### 1.8.3 Webhook Endpoints
```typescript
// backend/src/channels/webhooks/router.ts
```
- [ ] POST `/webhooks/channels/:channel_type` - Webhook genérico
- [ ] Implementar verificación de firma
- [ ] Router por tipo de canal
- [ ] Procesamiento asíncrono
- [ ] Respuesta inmediata 200 OK
- [ ] Queue para procesamiento

### 🎨 1.9 FRONTEND - GESTIÓN DE CANALES

#### 1.9.1 Pantalla de Canales
```typescript
// frontend/src/pages/Channels/index.tsx
```
- [ ] Crear página de gestión de canales
- [ ] Listar canales disponibles
- [ ] Mostrar canales conectados
- [ ] Botón para agregar canal
- [ ] Cards con logo y estado de cada canal
- [ ] Indicadores de salud
- [ ] Acciones rápidas (conectar, desconectar, configurar)

#### 1.9.2 Modal de Configuración
```typescript
// frontend/src/components/ChannelConfigModal/index.tsx
```
- [ ] Crear modal de configuración dinámica
- [ ] Formulario dinámico según tipo de canal
- [ ] Validación de credenciales
- [ ] Test de conexión
- [ ] Guardar configuración
- [ ] Feedback de errores

#### 1.9.3 Actualización del Chat/Inbox
```typescript
// frontend/src/components/MessagesList/index.tsx
```
- [ ] Agregar indicador de canal en cada mensaje
- [ ] Mostrar logo/icono del canal
- [ ] Color distintivo por canal
- [ ] Tooltip con información del canal
- [ ] Mantener compatibilidad con mensajes actuales

### 🧪 1.10 TESTING FASE 1

#### 1.10.1 Unit Tests
- [ ] Tests para ChannelManager
- [ ] Tests para MessageRouter
- [ ] Tests para modelos
- [ ] Tests para adaptadores
- [ ] Tests para registry
- [ ] Coverage > 80%

#### 1.10.2 Integration Tests
- [ ] Test de creación de canal
- [ ] Test de envío de mensaje multi-canal
- [ ] Test de recepción por webhook
- [ ] Test de fallback
- [ ] Test de health checks

#### 1.10.3 Validación No Regresión
- [ ] Verificar WhatsApp Baileys funciona igual
- [ ] Validar que no hay cambios en BD existente
- [ ] Confirmar tickets siguen igual
- [ ] Verificar eventos Socket.io
- [ ] Validar performance

---

## 🔵 FASE 2: MÓDULO WHATSAPP CLOUD API

### 📋 2.1 PREPARACIÓN WHATSAPP CLOUD

#### 2.1.1 Configuración Meta Business
- [ ] Crear cuenta Meta Business (si no existe)
- [ ] Crear App en Meta for Developers
- [ ] Configurar WhatsApp Business API
- [ ] Obtener Phone Number ID
- [ ] Obtener Access Token permanente
- [ ] Obtener Business Account ID
- [ ] Configurar Webhook URL
- [ ] Obtener Webhook Verify Token
- [ ] Documentar todas las credenciales

#### 2.1.2 Análisis de la API
- [ ] Estudiar documentación oficial completa
- [ ] Identificar todos los endpoints necesarios
- [ ] Mapear tipos de mensajes soportados
- [ ] Entender sistema de templates
- [ ] Analizar webhooks y eventos
- [ ] Documentar limitaciones y quotas
- [ ] Identificar mejores prácticas

### 📦 2.2 ESTRUCTURA DEL PROVIDER

#### 2.2.1 Crear Estructura de Directorios
```bash
backend/src/channels/providers/whatsapp-cloud/
```
- [ ] Crear directorio principal
- [ ] Crear `/whatsapp-cloud/services/`
- [ ] Crear `/whatsapp-cloud/types/`
- [ ] Crear `/whatsapp-cloud/utils/`
- [ ] Crear `/whatsapp-cloud/templates/`
- [ ] Crear `/whatsapp-cloud/webhooks/`
- [ ] Crear `/whatsapp-cloud/tests/`

#### 2.2.2 Configuración del Provider
```typescript
// backend/src/channels/providers/whatsapp-cloud/config.ts
```
- [ ] Definir configuración requerida
- [ ] Especificar variables de entorno
- [ ] Configurar URLs de la API
- [ ] Definir timeouts y retries
- [ ] Configurar rate limits
- [ ] Especificar versión de API

### 🔧 2.3 IMPLEMENTACIÓN CORE

#### 2.3.1 WhatsApp Cloud Provider Principal
```typescript
// backend/src/channels/providers/whatsapp-cloud/index.ts
```
- [ ] Crear clase WhatsAppCloudProvider
- [ ] Extender de ChannelProvider base
- [ ] Implementar constructor con validación
- [ ] Definir metadata del canal
- [ ] Implementar método `connect()`
- [ ] Implementar método `disconnect()`
- [ ] Implementar método `getStatus()`
- [ ] Implementar método `validateCredentials()`
- [ ] Agregar logging detallado
- [ ] Implementar health check

#### 2.3.2 Cliente HTTP para Meta API
```typescript
// backend/src/channels/providers/whatsapp-cloud/services/MetaApiClient.ts
```
- [ ] Crear cliente Axios configurado
- [ ] Implementar autenticación con Bearer Token
- [ ] Configurar interceptors para errores
- [ ] Implementar retry logic
- [ ] Agregar rate limiting
- [ ] Implementar request logging
- [ ] Manejar errores de Meta API
- [ ] Implementar timeout handling

#### 2.3.3 Tipos TypeScript
```typescript
// backend/src/channels/providers/whatsapp-cloud/types/index.ts
```
- [ ] Definir tipos para mensajes
- [ ] Definir tipos para webhooks
- [ ] Definir tipos para templates
- [ ] Definir tipos para media
- [ ] Definir tipos para contactos
- [ ] Definir tipos para errores
- [ ] Definir tipos para respuestas

### 💬 2.4 MENSAJERÍA

#### 2.4.1 Envío de Mensajes de Texto
```typescript
// backend/src/channels/providers/whatsapp-cloud/services/MessageService.ts
```
- [ ] Implementar `sendTextMessage()`
- [ ] Validar formato de número
- [ ] Construir payload según API
- [ ] Enviar request a Meta API
- [ ] Procesar respuesta
- [ ] Guardar message ID
- [ ] Emitir eventos
- [ ] Manejar errores específicos

#### 2.4.2 Envío de Mensajes Multimedia
- [ ] Implementar `sendImageMessage()`
- [ ] Implementar `sendVideoMessage()`
- [ ] Implementar `sendAudioMessage()`
- [ ] Implementar `sendDocumentMessage()`
- [ ] Implementar upload de media
- [ ] Obtener media ID
- [ ] Validar formatos soportados
- [ ] Validar tamaño de archivos
- [ ] Implementar caché de media IDs

#### 2.4.3 Mensajes Interactivos
- [ ] Implementar `sendButtonMessage()`
- [ ] Implementar `sendListMessage()`
- [ ] Validar estructura de botones
- [ ] Validar estructura de listas
- [ ] Manejar límites (3 botones, 10 items)
- [ ] Procesar respuestas interactivas

#### 2.4.4 Ubicación y Contactos
- [ ] Implementar `sendLocationMessage()`
- [ ] Implementar `sendContactMessage()`
- [ ] Validar formato de coordenadas
- [ ] Validar formato vCard

### 📋 2.5 SISTEMA DE TEMPLATES

#### 2.5.1 Template Manager
```typescript
// backend/src/channels/providers/whatsapp-cloud/services/TemplateManager.ts
```
- [ ] Implementar `listTemplates()`
- [ ] Implementar `getTemplate()`
- [ ] Implementar `createTemplate()`
- [ ] Implementar `deleteTemplate()`
- [ ] Sincronizar templates con Meta
- [ ] Cachear templates aprobados
- [ ] Validar estado de templates

#### 2.5.2 Envío de Templates
- [ ] Implementar `sendTemplateMessage()`
- [ ] Sustituir variables dinámicamente
- [ ] Validar parámetros requeridos
- [ ] Manejar componentes (header, body, footer)
- [ ] Soportar media en headers
- [ ] Manejar botones de template

#### 2.5.3 Base de Datos de Templates
- [ ] Guardar templates en BD local
- [ ] Sincronizar con Meta periódicamente
- [ ] Tracking de uso de templates
- [ ] Gestionar múltiples idiomas

### 🔔 2.6 WEBHOOKS

#### 2.6.1 Webhook Controller
```typescript
// backend/src/channels/providers/whatsapp-cloud/webhooks/WebhookController.ts
```
- [ ] Implementar verificación GET (challenge)
- [ ] Implementar recepción POST
- [ ] Verificar firma de webhook
- [ ] Parsear estructura de eventos
- [ ] Router de eventos por tipo
- [ ] Responder 200 inmediatamente
- [ ] Procesar asíncronamente

#### 2.6.2 Procesadores de Eventos
- [ ] Procesar `messages` events
- [ ] Procesar `status` events (sent, delivered, read)
- [ ] Procesar `errors` events
- [ ] Procesar `contacts` events
- [ ] Procesar `business` events
- [ ] Convertir a formato unificado
- [ ] Emitir eventos internos

#### 2.6.3 Message Status Tracking
- [ ] Actualizar estado: sent
- [ ] Actualizar estado: delivered
- [ ] Actualizar estado: read
- [ ] Actualizar estado: failed
- [ ] Guardar timestamp de cada estado
- [ ] Emitir eventos de cambio de estado

### 👤 2.7 GESTIÓN DE CONTACTOS

#### 2.7.1 Contact Service
```typescript
// backend/src/channels/providers/whatsapp-cloud/services/ContactService.ts
```
- [ ] Implementar `validatePhoneNumber()`
- [ ] Implementar `getContactInfo()`
- [ ] Implementar `getProfilePicture()`
- [ ] Cachear información de contactos
- [ ] Sincronizar con BD local

#### 2.7.2 Business Profile
- [ ] Implementar `getBusinessProfile()`
- [ ] Implementar `updateBusinessProfile()`
- [ ] Gestionar horario de atención
- [ ] Gestionar mensaje de ausencia
- [ ] Actualizar descripción

### 🔐 2.8 SEGURIDAD Y VALIDACIÓN

#### 2.8.1 Validación de Webhooks
- [ ] Implementar verificación HMAC-SHA256
- [ ] Validar token de verificación
- [ ] Validar origen de IP (Meta)
- [ ] Implementar rate limiting
- [ ] Prevenir replay attacks
- [ ] Log de intentos fallidos

#### 2.8.2 Encriptación de Credenciales
- [ ] Encriptar Access Token en BD
- [ ] Encriptar Webhook Verify Token
- [ ] Implementar rotación de tokens
- [ ] Secure storage de media
- [ ] Sanitización de inputs

### 📊 2.9 MONITOREO Y MÉTRICAS

#### 2.9.1 Health Monitoring
- [ ] Implementar health check endpoint
- [ ] Verificar conectividad con Meta API
- [ ] Verificar validez de token
- [ ] Monitor de quota usage
- [ ] Alertas de errores

#### 2.9.2 Métricas de Uso
- [ ] Contador de mensajes enviados
- [ ] Contador de mensajes recibidos
- [ ] Tracking de errores
- [ ] Response time de API
- [ ] Success rate
- [ ] Template usage stats

### 🧪 2.10 TESTING WHATSAPP CLOUD

#### 2.10.1 Unit Tests
- [ ] Tests para MessageService
- [ ] Tests para TemplateManager
- [ ] Tests para WebhookController
- [ ] Tests para validaciones
- [ ] Tests para transformadores
- [ ] Mock de Meta API

#### 2.10.2 Integration Tests
- [ ] Test envío mensaje real
- [ ] Test recepción webhook
- [ ] Test template sending
- [ ] Test media handling
- [ ] Test error handling

#### 2.10.3 Manual Testing
- [ ] Probar conexión inicial
- [ ] Enviar mensaje de texto
- [ ] Enviar imagen
- [ ] Enviar template
- [ ] Recibir mensajes
- [ ] Verificar estados

### 📚 2.11 DOCUMENTACIÓN

#### 2.11.1 Documentación Técnica
- [ ] README del provider
- [ ] Guía de configuración
- [ ] Ejemplos de uso
- [ ] Troubleshooting guide
- [ ] API reference

#### 2.11.2 Documentación Usuario
- [ ] Guía paso a paso configuración
- [ ] Screenshots del proceso
- [ ] FAQs comunes
- [ ] Video tutorial

---

## ✅ FASE 3: INTEGRACIÓN Y VALIDACIÓN

### 🔄 3.1 INTEGRACIÓN CON CORE

#### 3.1.1 Adapter Pattern Implementation
- [ ] Crear adaptador WhatsApp Cloud a Core
- [ ] Mapear mensajes a formato de tickets
- [ ] Sincronizar contactos
- [ ] Mantener compatibilidad con Baileys
- [ ] Unificar eventos

#### 3.1.2 Testing de Integración
- [ ] Verificar creación de tickets
- [ ] Validar flujo completo de mensajes
- [ ] Probar con ambos WhatsApp simultáneos
- [ ] Verificar no hay conflictos

### 🎨 3.2 FRONTEND FINAL

#### 3.2.1 UI Improvements
- [ ] Agregar selector de canal al enviar
- [ ] Mostrar canal en cada mensaje
- [ ] Indicador visual de canal activo
- [ ] Estadísticas por canal

#### 3.2.2 Configuration Wizard
- [ ] Wizard para WhatsApp Cloud
- [ ] Validación paso a paso
- [ ] Test de conexión en UI
- [ ] Feedback visual

### 🚀 3.3 DEPLOYMENT (No hacer)

#### 3.3.1 Preparación para Producción
- [ ] Variables de entorno production
- [ ] Configurar webhooks production
- [ ] SSL certificates
- [ ] Backup estrategy

#### 3.3.2 Migración
- [ ] Plan de migración gradual
- [ ] Rollback procedure
- [ ] Monitoring setup
- [ ] Alertas configuradas

### 📝 3.4 DOCUMENTACIÓN FINAL

#### 3.4.1 Documentación Completa
- [ ] Arquitectura general
- [ ] Guías de usuario
- [ ] API documentation
- [ ] Runbook operacional

#### 3.4.2 Training
- [ ] Material de capacitación
- [ ] Videos tutoriales
- [ ] Sesión de handover

---

## 📊 MÉTRICAS DE ÉXITO

### Criterios de Aceptación
- [ ] WhatsApp Baileys sigue funcionando sin cambios
- [ ] WhatsApp Cloud API completamente funcional
- [ ] Ambos canales funcionan simultáneamente
- [ ] Mensajes unificados en un solo inbox
- [ ] Identificación visual clara por canal
- [ ] Sistema preparado para futuros canales
- [ ] Cero downtime durante implementación
- [ ] Performance no degradado
- [ ] Tests con cobertura > 80%
- [ ] Documentación completa

### Validación Técnica
- [ ] No hay cambios breaking en el core
- [ ] APIs respondiendo < 200ms
- [ ] Webhooks procesados < 3 segundos
- [ ] Memory leaks: ninguno
- [ ] Error rate < 1%
- [ ] Uptime > 99.9%

### Validación de Negocio
- [ ] Usuarios pueden configurar WhatsApp Cloud
- [ ] Mensajes se envían y reciben correctamente
- [ ] Templates funcionan
- [ ] Media se maneja correctamente
- [ ] Estados se actualizan en tiempo real
- [ ] Analytics muestra datos de ambos canales

---

## 🛠️ HERRAMIENTAS Y RECURSOS

### Recursos de Desarrollo
- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp
- Meta for Developers: https://developers.facebook.com
- Postman Collection WhatsApp: Disponible en Meta
- Test Phone Numbers: Provisto por Meta

### Herramientas Necesarias
- Node.js 20.x
- PostgreSQL 13+
- Redis (para cache)
- ngrok (para webhooks en desarrollo)
- Postman (para testing)

### Dependencias NPM Clave
```json
{
  "axios": "^1.11.0",
  "crypto": "native",
  "joi": "^17.11.0",
  "sequelize": "^5.22.3",
  "@whiskeysockets/baileys": "latest"
}
```

---

## ⚠️ CONSIDERACIONES CRÍTICAS

### Puntos de Atención
1. **NUNCA** modificar el código de WhatsApp Baileys existente
2. **SIEMPRE** mantener backward compatibility
3. **ENCRIPTAR** todas las credenciales sensibles
4. **VALIDAR** todas las entradas de webhooks
5. **RESPETAR** rate limits de Meta (100/seg)

### Riesgos Identificados
- Duplicación de mensajes
- Pérdida de mensajes durante migración
- Tokens expirados
- Rate limiting de Meta

### Mitigaciones
- Sistema de fallback automático
- Queue persistente de mensajes
- Retry logic con exponential backoff
- Monitoring proactivo
- Circuit breaker pattern

---

## 📈 SIGUIENTE NIVEL (FUTURO)

### Preparado para Expansión
- Instagram Direct Messages
- Facebook Messenger
- Telegram
- Email
- SMS
- Twitter/X DMs
- Custom channels via API

### Arquitectura Lista Para
- Auto-discovery de plugins
- Hot-reload de canales
- Marketplace de integraciones
- Multi-tenant isolation
- Horizontal scaling
- Microservices migration

---

## 🤖 USO DEL SUBAGENTE WHATSAPP API EXPERT

### Invocación del Subagente
Para implementar funcionalidades de WhatsApp Cloud API en TucanLink:

```bash
claude --agent whatsapp-api-expert
```

### Contexto del Proyecto TucanLink
El subagente ha sido **pre-configurado** con todo el contexto específico de TucanLink:

✅ **Arquitectura**: "Múltiples Puertas, Mismo Procesamiento"  
✅ **Principios**: Zero Downtime, Coexistencia, Multi-tenant  
✅ **Estado Actual**: WhatsApp Baileys operativo, API Bridge implementado  
✅ **Estructura Backend**: Rutas, controladores, middleware existente  
✅ **Patrones**: Ejemplos de código específicos para TucanLink  

### Información Automática que Recibe el Subagente

#### 1. **Contexto del Sistema**
- WhatsApp Baileys (QR) vs WhatsApp Cloud API (Sin QR) son líneas diferentes
- API Bridge en puerto 8090 con 12 endpoints implementados  
- Autenticación JWT + OAuth2 ya funcional
- Multi-tenant: cada empresa configura sus canales independientemente

#### 2. **Arquitectura Actual**
```
backend/src/api/bridge/v1/     # Donde trabajará el subagente
├── controllers/               # Lógica de negocio
├── routes/                   # Rutas REST  
├── middleware/              # Auth, validation existente
├── services/               # Servicios externos
└── swagger/               # Documentación OpenAPI
```

#### 3. **Principios de Implementación**
- PRESERVAR WhatsApp Baileys actual (no tocar)
- SEGUIR patrones de controladores existentes
- REUTILIZAR middleware de autenticación
- INTEGRAR con Channel Manager Service  
- DOCUMENTAR en Swagger existente

### Comandos de Invocación

```bash
# Implementar endpoint para envío de mensajes
claude --agent whatsapp-api-expert "Implementa endpoint POST /whatsapp-cloud/messages siguiendo los patrones existentes del API Bridge"

# Crear webhook para recepción
claude --agent whatsapp-api-expert "Crea webhook endpoint para recibir mensajes de WhatsApp Cloud API integrado con el sistema de tickets actual"

# Configuración multi-tenant
claude --agent whatsapp-api-expert "Implementa sistema de configuración WhatsApp Cloud API por empresa usando el patrón multi-tenant existente"
```

### Lo que el Subagente YA SABE
- ✅ Estructura completa de TucanLink backend
- ✅ Middleware de autenticación implementado  
- ✅ Patrones de controladores actuales
- ✅ Sistema de validación Joi usado
- ✅ Integración con logger existente
- ✅ Formato de respuestas API estándar
- ✅ Configuración Swagger actual
- ✅ Principios Zero Downtime del proyecto

### Lo que el Subagente HARÁ
1. **Seguir patrones existentes** del API Bridge
2. **Reutilizar infraestructura** actual (auth, validation, etc.)
3. **Integrar con sistema de tickets** sin modificar core
4. **Crear endpoints** siguiendo arquitectura actual
5. **Documentar en Swagger** con formato existente
6. **Implementar multi-tenant** por empresa
7. **Mantener compatibilidad** total hacia atrás

### Ejemplos de Prompts Efectivos

```bash
# Implementación completa de un módulo
claude --agent whatsapp-api-expert "Implementa el módulo completo WhatsApp Cloud API con endpoints de envío, webhook de recepción y configuración multi-tenant"

# Feature específica  
claude --agent whatsapp-api-expert "Crea endpoint para enviar plantillas de WhatsApp Cloud API integrándolo con el sistema de tickets existente"

# Integración con sistema actual
claude --agent whatsapp-api-expert "Integra el webhook de WhatsApp Cloud API con el Channel Manager Service para que los mensajes aparezcan en el inbox unificado"
```

### 🎯 **Resultado Esperado**
El subagente implementará WhatsApp Cloud API como una nueva "puerta" que:
- Se integra perfectamente con TucanLink actual
- Mantiene el mismo procesamiento interno  
- Permite coexistencia con WhatsApp Baileys
- Es configurable por empresa independientemente
- No interrumpe el servicio actual bajo ninguna circunstancia

**¡El subagente está listo para agregar WhatsApp Cloud API al sistema omnicanal TucanLink!** 🚀

---

*Este plan está diseñado para ser ejecutado de forma secuencial, marcando cada tarea completada. El sistema resultante será robusto, extensible y mantendrá la operación actual sin interrupciones.*