# 📊 DIFERENCIAS ENTRE BASE DE DATOS LOCAL Y SUPABASE

## 📅 Fecha de Análisis: Agosto 2025

## 🔍 RESUMEN EJECUTIVO

### Estado General
- **Tablas totales**: 46 en ambas bases de datos ✅
- **Tablas idénticas**: 13 (28%)
- **Tablas con diferencias**: 33 (72%) ⚠️
- **Índices Local**: 63
- **Índices Supabase**: 68

### ⚠️ IMPORTANTE
La base de datos local tiene diferencias significativas con Supabase. Es necesario sincronizar antes de desarrollar para evitar problemas en producción.

## 📝 DIFERENCIAS DETALLADAS POR TABLA

### Tablas Idénticas ✅ (13)
- Baileys
- CampaignSettings
- CampaignShipping
- ContactCustomFields
- ContactLists
- Helps
- SequelizeMeta
- Settings
- TicketTags
- UserQueues
- UserRatings
- WhatsappQueues

### Tablas con Diferencias ⚠️ (33)

#### 1. **Announcements**
- Supabase tiene valores DEFAULT en columnas: mediaName, mediaPath, priority, status

#### 2. **BaileysMessages**
- Local: `jsonMessage` es NOT_NULL
- Supabase: `jsonMessage` permite NULL

#### 3. **Campaigns**
- Supabase: columna `status` tiene valor DEFAULT

#### 4. **ChatMessages**
- Local: `message` tiene DEFAULT
- Supabase: `message` sin DEFAULT

#### 5. **Chats**
- Diferencia en tipo de datos:
  - Local: `uuid` es character varying
  - Supabase: `uuid` es tipo UUID nativo

#### 6. **Companies**
- Supabase: columnas con DEFAULT (email, name, phone)

#### 7. **Contacts**
- Supabase: columnas con DEFAULT (name, number, profilePicUrl)

#### 8. **Files**
- Supabase: `message` tiene DEFAULT

#### 9. **FlowBuilders**
- Local: `company_id` y `user_id` son NOT_NULL
- Supabase: permiten NULL
- Supabase: `flow` y `variables` tienen DEFAULT

#### 10. **FlowAudios/FlowCampaigns/FlowDefaults/FlowImgs**
- Local: `userId` es NOT_NULL
- Supabase: `userId` permite NULL

#### 11. **Invoices**
- Local: `value` es double precision
- Supabase: `value` es real
- Supabase tiene columnas adicionales: payGw, payGwData, xId

#### 12. **Messages** ⚠️ CRÍTICO
- Supabase tiene columnas adicionales:
  - edited (boolean)
  - editedAt (timestamp)
  - isPrivate (boolean)
  - messageId (varchar)
  - scheduleDate (timestamp)
  - stickerUrl (varchar)

#### 13. **Plans**
- Local: `value` es double precision con DEFAULT
- Supabase: `value` es numeric sin DEFAULT
- Supabase tiene columnas adicionales:
  - trial (boolean)
  - trialDays (integer)
  - useFacebook (boolean)
  - useInstagram (boolean)
  - useWhatsapp (boolean)

#### 14. **Prompts**
- Local: `maxTokens` tiene DEFAULT
- Supabase: sin DEFAULT
- Supabase tiene columnas adicionales:
  - voice (varchar)
  - voiceKey (varchar)
  - voiceRegion (varchar)

#### 15. **QueueIntegrations**
- Local: mayoría de campos son NOT_NULL con DEFAULT
- Supabase: campos permiten NULL

#### 16. **QueueOptions**
- Supabase tiene columnas adicionales:
  - mediaName (varchar)
  - mediaPath (varchar)

#### 17. **Queues**
- Supabase tiene columnas adicionales:
  - absenceMessage (varchar)
  - closeTicket (boolean)
  - endWork (varchar)
  - startWork (varchar)

#### 18. **QuickMessages**
- Supabase tiene columnas adicionales:
  - geral (boolean)
  - voiceRecordingPath (varchar)

#### 19. **Schedules**
- Supabase tiene columna adicional:
  - idExterno (varchar)

#### 20. **Subscriptions**
- Local: `expiresAt` es NOT_NULL
- Supabase: permite NULL
- Supabase tiene columna adicional:
  - invoiceId (integer)

#### 21. **TicketNotes**
- Local: `contactId` es NOT_NULL
- Supabase: permite NULL

#### 22. **Tickets** ⚠️ CRÍTICO
- Supabase tiene columnas adicionales:
  - amountUseBotQueuesNPS (integer)
  - closed (boolean)
  - imported (text)
  - lastMessageAt (timestamp)
  - lgpdAcceptedAt (timestamp)
  - lgpdSendMessageAt (timestamp)
  - maxUseBotQueues (integer)
  - sendInactiveMessage (varchar)
  - statusChatEnd (varchar)

#### 23. **Webhooks**
- Local: `hash_id` y `user_id` son NOT_NULL
- Supabase: permiten NULL

#### 24. **Whatsapps** ⚠️ CRÍTICO
- Supabase tiene columnas adicionales:
  - closedTicketsPostImported (boolean)
  - collectiveVacationEnd (timestamp)
  - collectiveVacationMessage (text)
  - collectiveVacationStart (timestamp)
  - timeCreateNewTicket (integer)
  - timeUseBotQueuesNPS (integer)
  - importOldMessages (text)
  - inactiveMessage (varchar)
  - isMultidevice (boolean)
  - statusImportMessages (varchar)

## 🔧 SCRIPTS DE SINCRONIZACIÓN

### Opción 1: Sincronización Completa (RECOMENDADO)
```bash
# Este script clonará el esquema de Supabase a local
./sync_local_with_supabase.sh
```

### Opción 2: Cambio de Entorno
```bash
# Para desarrollo local
./switch_environment.sh local

# Para conectar a Supabase
./switch_environment.sh production
```

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Para Desarrollo Inmediato:
1. **Ejecutar sincronización completa**
   ```bash
   ./sync_local_with_supabase.sh
   ```

2. **Cambiar a entorno local**
   ```bash
   ./switch_environment.sh local
   ```

3. **Verificar servicios Docker**
   ```bash
   docker ps | grep tucanlink
   # Si no están corriendo:
   docker start tucanlink-postgres tucanlink-redis
   ```

4. **Reiniciar backend**
   ```bash
   cd backend
   npm run dev:server
   ```

### Para Mantenimiento a Largo Plazo:

1. **Siempre desarrollar en local** con esquema sincronizado
2. **Probar migraciones en local** antes de aplicar en producción
3. **Documentar nuevas columnas** añadidas en desarrollo
4. **Sincronizar regularmente** (semanalmente) con producción

## ⚠️ COLUMNAS CRÍTICAS FALTANTES EN LOCAL

Estas columnas existen en Supabase pero no en local y pueden causar errores:

### Messages:
- `messageId` - Usado para tracking de mensajes
- `scheduleDate` - Para mensajes programados
- `isPrivate` - Para mensajes privados

### Tickets:
- `lastMessageAt` - Timestamp del último mensaje
- `closed` - Estado de cierre
- `sendInactiveMessage` - Control de mensajes por inactividad

### Whatsapps:
- `isMultidevice` - Soporte multi-dispositivo
- `importOldMessages` - Importación de historial
- `collectiveVacation*` - Gestión de vacaciones

## 📊 IMPACTO EN EL DESARROLLO

### Alto Impacto 🔴
- Diferencias en tabla `Messages` (mensajería core)
- Diferencias en tabla `Tickets` (gestión de conversaciones)
- Diferencias en tabla `Whatsapps` (conexiones WhatsApp)

### Medio Impacto 🟡
- Diferencias en `Plans` (planes y facturación)
- Diferencias en `Queues` (distribución de tickets)
- Diferencias en `QueueIntegrations` (webhooks)

### Bajo Impacto 🟢
- Diferencias en valores DEFAULT
- Diferencias en NULL/NOT_NULL constraints
- Columnas de metadata adicionales

## 🚨 RECOMENDACIÓN FINAL

**ES CRÍTICO sincronizar la base de datos local con Supabase antes de comenzar el desarrollo** para evitar:
- Errores de migración en producción
- Incompatibilidades de esquema
- Pérdida de funcionalidades
- Bugs difíciles de detectar

Use el script `sync_local_with_supabase.sh` para garantizar compatibilidad total.

---
*Última actualización: Agosto 2025*
*Generado por: compare_schemas.sh*