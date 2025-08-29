# Proyecto: TucanLink V2 - CRM Multicanal

## 📋 Descripción del Proyecto
Sistema CRM empresarial con integración nativa de WhatsApp Business Cloud API y capacidades multicanal para gestión de comunicaciones empresariales.

## 🏗️ Arquitectura del Sistema
- **Frontend**: [Por definir]
- **Backend**: [Por definir]
- **Base de Datos**: [Por definir]
- **Servicios de Mensajería**: WhatsApp Cloud API
- **Infraestructura**: [Por definir]

## 💻 Stack Tecnológico
- **API de WhatsApp**: Cloud API v23.0
- **Autenticación**: System User Tokens (Meta Business)
- **Webhooks**: HTTPS con validación de firma
- **Queue System**: [Por definir]
- **Cache**: [Por definir]

## 📐 Estándares de Desarrollo
- **Formato de código**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Branching**: Git Flow
- **Testing**: Jest + pruebas de integración
- **Documentación**: JSDoc + README por módulo

## 🔒 Archivos Críticos
- `.env` - Variables de entorno (NUNCA commitear)
- `config/whatsapp.js` - Configuración de WhatsApp API
- `webhooks/` - Endpoints de webhooks

## 📝 Guías de Flujo de Trabajo
1. **Desarrollo de nuevas features**: Crear branch desde `develop`
2. **Hotfixes**: Branch desde `main`, merge a `main` y `develop`
3. **Testing**: Obligatorio antes de PR
4. **Code Review**: Requerido para merge a `develop`
5. **Deployment**: Solo desde `main` después de QA

## 🤖 Registro de Subagentes

### WhatsApp API Expert (`whatsapp-api-expert`)
**Invocación**: `claude --agent whatsapp-api-expert`
**Descripción**: Especialista en WhatsApp Business Cloud API con conocimiento profundo de:
- Implementación de envío/recepción de mensajes
- Configuración de webhooks y eventos
- Manejo de plantillas y mensajes interactivos
- Gestión de multimedia y archivos
- Optimización de rendimiento y límites
- Integración con sistemas CRM
- Debugging y resolución de problemas

**Casos de uso**:
- Implementar nuevas funcionalidades de WhatsApp
- Resolver errores de integración con la API
- Optimizar el flujo de mensajes
- Configurar webhooks y procesamiento de eventos
- Diseñar arquitectura de mensajería escalable

## 🚀 Comandos Rápidos

```bash
# Invocar el experto en WhatsApp API
claude --agent whatsapp-api-expert

# Desarrollo general
claude

# Ver todos los agentes disponibles
ls .claude/subagents/
```

## 📚 Documentación Adicional
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Business Management API](https://developers.facebook.com/docs/whatsapp/business-management-api)
- [Webhooks Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks)

## ⚠️ Notas Importantes
- **NUNCA** exponer tokens de acceso en el código
- **SIEMPRE** validar las firmas de los webhooks
- **RESPETAR** los límites de rate (80 msgs/seg)
- **IMPLEMENTAR** manejo de errores robusto
- **MONITOREAR** métricas de entrega continuamente

## 🎯 Objetivos del Proyecto
- [ ] Implementar conector WhatsApp Cloud API
- [ ] Sistema de gestión de conversaciones
- [ ] Automatización de respuestas
- [ ] Panel de analytics en tiempo real
- [ ] Integración con otros canales
- [ ] Sistema de campañas masivas
- [ ] API REST para integraciones externas

---

*Última actualización: 28 de Agosto, 2025*