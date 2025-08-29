# 📚 STACK TECNOLÓGICO - API BRIDGE

## 🎯 Objetivo
Definir el stack tecnológico compatible con TucanLink Core (Node 20.x) para la capa API Bridge sin afectar el funcionamiento del WhatsApp existente.

## 🛠️ Stack Seleccionado

### Framework HTTP
**Express 4.19.x**
- **Versión**: ^4.19.0
- **Justificación**: 
  - Ya instalado en el core (v4.17.3), actualización menor compatible
  - Estabilidad comprobada en producción
  - Amplio ecosistema de middleware
  - Compatibilidad total con TypeScript existente
  - Mínimo overhead de aprendizaje para el equipo

### Autenticación
**jsonwebtoken 9.0.x + bcryptjs 2.4.x**
- **Versiones**: 
  - jsonwebtoken: ^9.0.2
  - bcryptjs: ^2.4.3 (ya instalado)
- **Justificación**:
  - JWT para stateless auth en microservicios
  - bcryptjs ya utilizado en el core
  - Compatibilidad con RS256/HS256
  - Soporte para refresh tokens

### Validación
**Joi 17.x**
- **Versión**: ^17.11.0
- **Justificación**:
  - Validación robusta de esquemas
  - Mensajes de error personalizables
  - Mejor rendimiento que express-validator
  - Soporte completo para TypeScript
  - Validación de tipos complejos

### Documentación
**swagger-ui-express 5.x + swagger-jsdoc 6.x**
- **Versiones**:
  - swagger-ui-express: ^5.0.0
  - swagger-jsdoc: ^6.2.8
- **Justificación**:
  - Generación automática desde comentarios JSDoc
  - UI interactiva para testing
  - Compatible con OpenAPI 3.0.3
  - Sin conflictos con dependencias actuales

### Rate Limiting
**express-rate-limit 7.x**
- **Versión**: ^7.1.0
- **Justificación**:
  - Integración nativa con Express
  - Configuración por endpoint
  - Store en memoria o Redis
  - Headers estándar de rate limit

### CORS
**cors 2.8.x** (ya instalado)
- **Versión**: ^2.8.5
- **Justificación**:
  - Ya presente en el proyecto
  - Configuración conocida
  - Sin necesidad de cambios

### Logging
**Winston 3.x**
- **Versión**: ^3.11.0
- **Justificación**:
  - Más robusto que pino para APIs
  - Múltiples transportes (archivo, consola, cloud)
  - Niveles de log configurables
  - Formato JSON estructurado
  - Integración con sistemas de monitoring

### Testing
**Jest 29.x + Supertest 6.x**
- **Versiones**:
  - Jest: ^29.7.0 (actualización desde 27.x)
  - Supertest: ^6.3.3 (ya instalado)
- **Justificación**:
  - Jest ya configurado en el proyecto
  - Supertest para testing de endpoints
  - Coverage reports integrados
  - Mocking capabilities

## 📦 Dependencias Adicionales

### Utilidades
- **helmet**: ^7.1.0 - Seguridad de headers HTTP
- **compression**: ^1.7.4 - Compresión gzip de respuestas
- **express-async-errors**: ya instalado - Manejo de errores async

### WebSocket
- **socket.io**: ^4.7.4 (ya instalado) - Reutilizar para eventos Bridge

### Base de Datos
- **sequelize**: ^5.22.3 (ya instalado) - Mantener compatibilidad
- **pg**: ^8.7.3 (ya instalado) - Cliente PostgreSQL

### Cache y Queue
- **bull**: ^4.8.2 (ya instalado) - Queue para webhooks
- **node-cache**: ^5.1.2 (ya instalado) - Cache en memoria

## 🔒 Consideraciones de Seguridad

1. **JWT Tokens**:
   - Access Token: 15 minutos expiración
   - Refresh Token: 7 días
   - Rotación automática de secrets

2. **API Keys**:
   - Generación con crypto.randomBytes
   - Almacenamiento hasheado
   - Rate limiting por key

3. **Headers de Seguridad**:
   - Helmet middleware configurado
   - CORS restrictivo por defecto
   - CSP headers

## 📊 Compatibilidad

### Node.js
- **Versión Requerida**: 20.x (LTS)
- **Compatibilidad**: Todas las dependencias soportan Node 20

### TypeScript
- **Versión**: ^4.6.3 (mantener actual)
- **tsconfig**: Configuración existente compatible

### PostgreSQL
- **Versión**: 14+ (compatible con actual)
- **Schemas**: Separados por módulo

## 🚀 Scripts NPM

```json
{
  "api:bridge": "ts-node-dev --respawn --transpile-only src/api/bridge/server.ts",
  "api:bridge:build": "tsc -p src/api/bridge/tsconfig.json",
  "api:bridge:test": "jest --config src/api/bridge/jest.config.js",
  "api:bridge:docs": "node src/api/bridge/docs/generate.js"
}
```

## ⚠️ Notas Importantes

1. **NO actualizar** dependencias del core que puedan romper WhatsApp
2. **Usar** versiones exact en package.json para Bridge
3. **Testear** compatibilidad antes de cada instalación
4. **Documentar** cualquier conflicto de versiones encontrado

## 📝 Changelog

- **2025-01-27**: Definición inicial del stack
- Compatible con Node 20.x y dependencias existentes
- Prioridad en estabilidad sobre bleeding edge

---

*Documento generado para TucanLink API Bridge v1.0*