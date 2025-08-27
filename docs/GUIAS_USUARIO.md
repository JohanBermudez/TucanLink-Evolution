# 📚 GUÍAS DE USUARIO - TUCANLINK CRM

## 📋 TABLA DE CONTENIDOS

### PARA AGENTES
1. [Inicio Rápido](#inicio-rápido-agente)
2. [Gestión de Conversaciones](#gestión-de-conversaciones)
3. [Uso de Herramientas](#uso-de-herramientas-agente)
4. [Chat Interno](#chat-interno)
5. [Respuestas Rápidas](#respuestas-rápidas)

### PARA ADMINISTRADORES
6. [Panel de Administración](#panel-de-administración)
7. [Gestión de Usuarios](#gestión-de-usuarios)
8. [Configuración de WhatsApp](#configuración-de-whatsapp)
9. [Configuración de Colas](#configuración-de-colas)
10. [Sistema de Campañas](#sistema-de-campañas)
11. [Flow Builder](#flow-builder-automatización)
12. [Configuración de Webhooks](#configuración-de-webhooks)
13. [Integraciones Externas](#integraciones-externas)
14. [Reportes y Analytics](#reportes-y-analytics)
15. [Configuración de la Empresa](#configuración-de-la-empresa)

### SOLUCIÓN DE PROBLEMAS
16. [Problemas Comunes](#problemas-comunes)
17. [FAQ - Preguntas Frecuentes](#faq-preguntas-frecuentes)

---

## 👤 GUÍA PARA AGENTES

## 🚀 Inicio Rápido (Agente)

### Acceso al Sistema

1. **URL de acceso**: https://tucanlink.ianebula.com
2. **Credenciales**: Proporcionadas por tu administrador
3. **Primer login**:
   - Cambiar contraseña temporal
   - Configurar foto de perfil
   - Verificar datos de contacto

### Interfaz Principal

```
┌─────────────────────────────────────────────────────────────┐
│  Logo  │  Tickets  │  Contactos  │  Chat  │     │  👤 Usuario │
├─────────┬───────────────────────────────────────────────────┤
│         │                                                     │
│  Menu   │              Área de Trabajo Principal             │
│   de    │                                                     │
│  Lado   │    - Lista de conversaciones                        │
│         │    - Chat activo                                    │
│         │    - Información del contacto                       │
│         │                                                     │
└─────────┴───────────────────────────────────────────────────┘
```

### Estados de Tickets

- **🟡 PENDIENTE**: Esperando ser atendido
- **🟢 ABIERTO**: En conversación activa contigo
- **⚫ CERRADO**: Conversación finalizada
- **🔵 GRUPO**: Conversación de grupo de WhatsApp

---

## 💬 Gestión de Conversaciones

### Recibir Nuevos Mensajes

1. **Notificación Visual**:
   - Badge con número en la pestaña "Pendientes"
   - Notificación emergente (pop-up)
   - Sonido de alerta (configurable)

2. **Aceptar Conversación**:
   ```
   Tickets → Pendientes → Click en conversación → Botón "Aceptar"
   ```

3. **Visualización del Chat**:
   - Historial completo de mensajes
   - Estado de entrega (✓ enviado, ✓✓ recibido)
   - Hora de cada mensaje
   - Archivos multimedia inline

### Responder Mensajes

#### Texto Simple
1. Escribir en el campo inferior
2. Presionar Enter o click en enviar
3. Esperar confirmación de entrega

#### Envío de Archivos
1. Click en el ícono de clip 📎
2. Seleccionar tipo:
   - **Imagen**: JPG, PNG, GIF (máx. 16MB)
   - **Documento**: PDF, DOC, XLSX (máx. 20MB)
   - **Audio**: Grabación directa o archivo
   - **Video**: MP4 (máx. 16MB)
3. Añadir descripción opcional
4. Enviar

#### Formateo de Texto (WhatsApp)
```
*texto en negrita*
_texto en cursiva_
~texto tachado~
```monospace```
```

### Gestión del Ticket

#### Transferir a Otro Agente
1. Click en menú (⋮) del ticket
2. Seleccionar "Transferir"
3. Elegir:
   - Agente específico
   - Cola/Departamento
4. Añadir nota opcional
5. Confirmar transferencia

#### Cerrar Conversación
1. Verificar que se resolvió el tema
2. Click en "Cerrar ticket"
3. Seleccionar motivo (si aplica)
4. Confirmar cierre

#### Reabrir Ticket
- Si el cliente escribe después del cierre
- Sistema reabre automáticamente
- O manual: Tickets Cerrados → Seleccionar → Reabrir

### Etiquetas y Notas

#### Añadir Etiquetas
1. En panel derecho del chat
2. Sección "Etiquetas"
3. Click en "+" 
4. Seleccionar etiquetas aplicables:
   - VIP
   - Urgente
   - Ventas
   - Soporte
   - Facturación

#### Notas Internas
1. Panel derecho → "Notas"
2. Escribir nota (solo visible para agentes)
3. Guardar
4. Útil para:
   - Contexto del problema
   - Seguimiento requerido
   - Información importante

---

## 🛠️ Uso de Herramientas (Agente)

### Respuestas Rápidas

#### Crear Respuesta Rápida
1. Configuración → Respuestas Rápidas
2. Click en "Nueva"
3. Definir:
   - **Atajo**: `/saludo`
   - **Mensaje**: Texto completo
   - **Categoría**: Tipo de respuesta
4. Guardar

#### Usar Respuesta Rápida
1. En el chat, escribir `/`
2. Aparece lista de respuestas
3. Seleccionar o continuar escribiendo atajo
4. Presionar Tab para insertar
5. Personalizar si es necesario
6. Enviar

### Búsqueda de Contactos

1. **Búsqueda Rápida** (barra superior):
   - Por nombre
   - Por número de teléfono
   - Por email

2. **Búsqueda Avanzada**:
   - Contactos → Filtros
   - Por etiquetas
   - Por fecha de último contacto
   - Por estado de conversación
   - Por canal (WhatsApp/Facebook/Instagram)

### Historial de Conversaciones

1. Click en contacto
2. Panel derecho → "Historial"
3. Ver:
   - Conversaciones anteriores
   - Tickets cerrados
   - Interacciones por fecha
   - Agentes que atendieron

---

## 💬 Chat Interno

### Conversaciones con el Equipo

1. **Acceder**: Menú lateral → Chat Interno

2. **Crear Conversación**:
   - Click en "+"
   - Seleccionar participantes
   - Definir nombre del grupo
   - Iniciar chat

3. **Funcionalidades**:
   - Mensajes en tiempo real
   - Compartir archivos
   - Menciones con @nombre
   - Historial persistente

### Solicitar Ayuda

1. En cualquier ticket, usar @supervisor
2. Automáticamente notifica al supervisor
3. Puede ver el contexto del ticket
4. Responde en chat interno o se une al ticket

---

## 📝 Respuestas Rápidas

### Biblioteca de Respuestas

#### Categorías Predefinidas
- **Saludos**: `/hola`, `/buenos_dias`, `/buenas_tardes`
- **Despedidas**: `/gracias`, `/hasta_luego`, `/buen_dia`
- **Información**: `/horario`, `/direccion`, `/contacto`
- **Procesos**: `/solicitud`, `/reclamo`, `/seguimiento`
- **Problemas Comunes**: `/reiniciar`, `/actualizar`, `/verificar`

### Variables Dinámicas

Usar variables en respuestas:
```
Hola {{name}}, 
Tu ticket #{{protocol}} está en proceso.
Agente: {{attendant}}
Fecha: {{date}}
```

---

## 👨‍💼 GUÍA PARA ADMINISTRADORES

## 🎛️ Panel de Administración

### Acceso Administrativo

1. Login con cuenta admin
2. Menú lateral muestra opciones adicionales:
   - Empresas (super-admin)
   - Usuarios
   - Conexiones
   - Colas
   - Campañas
   - Flow Builder
   - Integraciones
   - Configuraciones

### Dashboard Administrativo

#### Métricas en Tiempo Real
- **Tickets**: Total, abiertos, pendientes, cerrados
- **Agentes**: Online, ocupados, disponibles
- **Mensajes**: Enviados, recibidos, tasa de respuesta
- **Tiempo Promedio**: Primera respuesta, resolución

#### Gráficos Disponibles
- Tickets por hora/día/semana
- Distribución por cola
- Performance por agente
- Satisfacción del cliente
- Tendencias de contacto

---

## 👥 Gestión de Usuarios

### Crear Nuevo Usuario

1. **Navegación**: Usuarios → Nuevo Usuario

2. **Información Básica**:
   ```
   Nombre: [Nombre Completo]
   Email: [correo@empresa.com]
   Teléfono: [+XX XXXXXXXXX]
   Contraseña: [Temporal segura]
   ```

3. **Configuración de Perfil**:
   - **Admin**: Acceso total al sistema
   - **Supervisor**: Gestión de equipos y reportes
   - **Agente**: Atención al cliente básica

4. **Asignación de Colas**:
   - Seleccionar departamentos
   - Definir prioridad
   - Configurar horario (opcional)

5. **Permisos Especiales**:
   - [ ] Ver todos los tickets
   - [ ] Gestionar contactos
   - [ ] Acceder a reportes
   - [ ] Configurar integraciones
   - [ ] Enviar campañas

### Editar Usuario

1. Usuarios → Click en usuario
2. Modificar datos necesarios
3. **Resetear Contraseña**: Botón específico
4. **Cambiar Colas**: Pestaña "Departamentos"
5. **Historial**: Ver actividad del usuario

### Gestión de Permisos

#### Niveles de Acceso
```
Super Admin
    ├── Gestión multi-empresa
    ├── Configuración global
    └── Acceso total

Admin
    ├── Gestión de empresa
    ├── Todos los módulos
    └── Configuraciones

Supervisor
    ├── Gestión de equipos
    ├── Reportes completos
    └── Asignación de tickets

Agente
    ├── Atención de tickets
    ├── Gestión de contactos
    └── Chat interno
```

---

## 📱 Configuración de WhatsApp

### Conectar Nuevo WhatsApp

1. **Navegación**: Conexiones → Nueva Conexión

2. **Configuración Inicial**:
   ```
   Nombre: [Identificador único]
   Número: [Opcional - se detecta al conectar]
   Cola Predeterminada: [Seleccionar]
   Despedida Automática: [Activar/Desactivar]
   Horario de Atención: [Configurar]
   ```

3. **Proceso de Conexión**:
   - Click en "Generar QR"
   - Abrir WhatsApp en teléfono
   - Configuración → WhatsApp Web → Escanear QR
   - Esperar confirmación "CONECTADO"

4. **Verificación**:
   - Estado: CONNECTED (verde)
   - Batería del dispositivo visible
   - Número detectado correctamente

### Configuración Avanzada

#### Mensaje de Bienvenida
```
Hola! 👋
Bienvenido a [Empresa].
En breve serás atendido por uno de nuestros agentes.

Horario de atención:
Lunes a Viernes: 9:00 - 18:00
Sábados: 9:00 - 13:00
```

#### Mensaje Fuera de Horario
```
Gracias por contactarnos.
Nuestro horario de atención es:
Lunes a Viernes: 9:00 - 18:00

Tu mensaje será respondido en el próximo horario hábil.
```

#### Transferencia Automática
1. Activar "Transferencia por Inactividad"
2. Tiempo de espera: [X minutos]
3. Transferir a: [Cola/Agente]
4. Mensaje al transferir: [Personalizable]

### Solución de Problemas WhatsApp

| Problema | Solución |
|----------|----------|
| QR no aparece | Reiniciar sesión, verificar Redis |
| Desconexión frecuente | Verificar internet del teléfono, batería |
| No llegan mensajes | Verificar cola asignada, horario |
| No envía mensajes | Verificar rate limiting, saldo |

---

## 🎯 Configuración de Colas

### Crear Nueva Cola

1. **Navegación**: Colas → Nueva Cola

2. **Información Básica**:
   ```
   Nombre: [Ventas/Soporte/Facturación]
   Color: [Para identificación visual]
   Descripción: [Opcional]
   Saludo: [Mensaje de bienvenida]
   ```

3. **Configuración de Distribución**:
   - **Round Robin**: Distribuye equitativamente
   - **Menos Ocupado**: Al agente con menos tickets
   - **Por Habilidad**: Según expertise del agente
   - **Manual**: Agente toma de lista de pendientes

4. **Horario de Atención**:
   ```
   Lunes-Viernes: 09:00 - 18:00
   Sábado: 09:00 - 13:00
   Domingo: Cerrado
   ```

5. **Integración** (Opcional):
   - Seleccionar integración configurada
   - Definir condiciones de activación

### Asignar Agentes a Colas

1. Cola → Pestaña "Agentes"
2. Seleccionar agentes disponibles
3. Definir:
   - Prioridad en la cola
   - Límite de tickets simultáneos
   - Horario específico (opcional)

### Reglas de Enrutamiento

#### Por Palabra Clave
```
Si mensaje contiene "precio" → Cola: Ventas
Si mensaje contiene "problema" → Cola: Soporte
Si mensaje contiene "pagar" → Cola: Facturación
```

#### Por Horario
```
09:00-13:00 → Cola: Mañana
13:00-18:00 → Cola: Tarde
18:00-21:00 → Cola: Guardia
```

#### Por Cliente
```
Cliente VIP → Cola: Premium
Cliente Regular → Cola: General
Cliente Nuevo → Cola: Onboarding
```

---

## 📨 Sistema de Campañas

### Crear Nueva Campaña

1. **Navegación**: Campañas → Nueva Campaña

2. **Información General**:
   ```
   Nombre: [Identificador de campaña]
   Objetivo: [Ventas/Información/Encuesta]
   WhatsApp: [Seleccionar conexión]
   ```

3. **Selección de Contactos**:
   - **Lista Existente**: Seleccionar lista creada
   - **Filtros**: 
     - Por etiquetas
     - Por última interacción
     - Por estado
   - **Importar CSV**: Subir archivo con contactos

4. **Configuración de Mensajes**:
   ```
   Mensaje 1: [Obligatorio - Mensaje principal]
   Mensaje 2-5: [Opcionales - Seguimiento]
   
   [ ] Orden aleatorio de mensajes
   [ ] Incluir archivo multimedia
   ```

5. **Configuración de Envío**:
   - **Inmediato**: Comenzar ahora
   - **Programado**: Fecha y hora específica
   - **Delay entre mensajes**: 30-180 segundos
   - **Mensajes por día**: Máximo 1000

### Variables en Campañas

```
Hola {{firstName}},

Te informamos sobre nuestra promoción en {{product}}.
Válido hasta {{endDate}}.

{{company}}
```

### Importar Contactos

#### Formato CSV
```csv
name,number,email,tag
Juan Pérez,+5491123456789,juan@email.com,cliente-vip
María García,+5491198765432,maria@email.com,prospecto
```

#### Proceso de Importación
1. Campañas → Lista de Contactos → Importar
2. Seleccionar archivo CSV
3. Mapear columnas
4. Validar datos
5. Confirmar importación

### Monitoreo de Campaña

#### Métricas en Tiempo Real
- **Enviados**: Total de mensajes enviados
- **Entregados**: Confirmados por WhatsApp
- **Leídos**: Con doble check azul
- **Respondidos**: Generaron conversación
- **Errores**: Números inválidos o bloqueados

#### Acciones Durante Campaña
- **Pausar**: Detener temporalmente
- **Cancelar**: Detener definitivamente
- **Exportar Reporte**: Descargar resultados

---

## 🔄 Flow Builder (Automatización)

### Conceptos Básicos

**Flow Builder** permite crear flujos de conversación automatizados visualmente.

#### Tipos de Nodos

1. **Inicio**: Punto de entrada del flow
2. **Texto**: Enviar mensaje de texto
3. **Pregunta**: Hacer pregunta y esperar respuesta
4. **Condicional**: Bifurcar según respuesta
5. **Multimedia**: Enviar imagen/audio/video
6. **Variable**: Guardar información
7. **Acción**: Transferir, etiquetar, crear ticket
8. **Fin**: Terminar el flow

### Crear Nuevo Flow

1. **Navegación**: Flow Builder → Nuevo Flow

2. **Diseño Visual**:
   - Arrastrar nodos desde panel lateral
   - Conectar con flechas
   - Configurar cada nodo

3. **Ejemplo: Flow de Atención Inicial**:
   ```
   [Inicio]
      ↓
   [Texto: "Hola! Bienvenido a Empresa"]
      ↓
   [Pregunta: "¿En qué podemos ayudarte?
   1. Ventas
   2. Soporte
   3. Facturación"]
      ↓
   [Condicional]
      ├─"1"→ [Transferir a Cola: Ventas]
      ├─"2"→ [Transferir a Cola: Soporte]
      └─"3"→ [Transferir a Cola: Facturación]
   ```

### Configuración de Nodos

#### Nodo de Texto
```
Mensaje: "Texto a enviar"
[ ] Incluir variable {{nombre}}
Delay: 2 segundos
```

#### Nodo de Pregunta
```
Pregunta: "¿Cuál es tu nombre?"
Guardar respuesta en: {{nombre}}
Timeout: 5 minutos
```

#### Nodo Condicional
```
Evaluar: {{respuesta}}
Condiciones:
- Si contiene "sí" → Nodo A
- Si contiene "no" → Nodo B
- Por defecto → Nodo C
```

### Activación de Flows

1. **Por Palabra Clave**:
   ```
   Si mensaje = "menu" → Activar Flow: Menu Principal
   ```

2. **Por Nuevo Contacto**:
   ```
   Primera vez que escribe → Flow: Bienvenida
   ```

3. **Por Horario**:
   ```
   Fuera de horario → Flow: Mensaje Fuera de Horario
   ```

4. **Manual**:
   ```
   Agente activa con comando: /flow:nombre
   ```

### Testing de Flows

1. Flow Builder → Seleccionar flow
2. Click en "Probar"
3. Simular conversación
4. Verificar cada rama
5. Ajustar según necesidad

---

## 🔗 Configuración de Webhooks

### ¿Qué son los Webhooks?

Los webhooks permiten enviar información a sistemas externos cuando ocurren eventos en TucanLink.

### Crear Webhook

1. **Navegación**: Integraciones → Webhooks → Nuevo

2. **Configuración Básica**:
   ```
   Nombre: [Identificador]
   URL: https://tu-sistema.com/webhook
   Token: [Opcional - para autenticación]
   ```

3. **Eventos a Enviar**:
   - [ ] Nuevo mensaje recibido
   - [ ] Mensaje enviado
   - [ ] Ticket creado
   - [ ] Ticket actualizado
   - [ ] Ticket cerrado
   - [ ] Contacto creado/actualizado

4. **Filtros** (Opcional):
   - Por cola específica
   - Por estado de ticket
   - Por etiquetas
   - Por agente

### Formato de Datos Enviados

```json
{
  "event": "message.received",
  "timestamp": "2024-08-26T10:30:00Z",
  "data": {
    "ticket": {
      "id": 123,
      "status": "open",
      "queue": "Ventas"
    },
    "contact": {
      "name": "Juan Pérez",
      "number": "+5491123456789"
    },
    "message": {
      "body": "Hola, necesito información",
      "type": "text",
      "timestamp": "2024-08-26T10:30:00Z"
    }
  }
}
```

### Integración con n8n

1. En n8n, crear Webhook node
2. Copiar URL del webhook
3. En TucanLink, crear integración:
   ```
   Tipo: n8n
   URL: [URL copiada de n8n]
   ```
4. Asignar a cola correspondiente
5. Probar con mensaje de prueba

### Integración con Zapier

1. En Zapier, crear Zap con Webhooks trigger
2. Copiar URL del webhook
3. Configurar en TucanLink
4. Enviar datos de prueba
5. Mapear campos en Zapier

### Integración con Make (Integromat)

Similar a Zapier:
1. Crear scenario con Webhook
2. Configurar en TucanLink
3. Probar y mapear datos

---

## 🔌 Integraciones Externas

### Tipos de Integraciones Disponibles

1. **CRM**: Salesforce, HubSpot, Pipedrive
2. **E-commerce**: Shopify, WooCommerce, Magento
3. **Email**: Gmail, Outlook, SendGrid
4. **Automatización**: n8n, Zapier, Make
5. **Analytics**: Google Analytics, Mixpanel
6. **Pago**: Stripe, PayPal, MercadoPago

### Configuración de API Externa

1. **Navegación**: Integraciones → API Externa

2. **Credenciales**:
   ```
   Nombre: [Identificador]
   Base URL: https://api.sistema.com
   API Key: [Tu clave API]
   Secret: [Si requiere]
   ```

3. **Mapeo de Campos**:
   ```
   TucanLink → Sistema Externo
   contact.name → customer.full_name
   contact.number → customer.phone
   ticket.id → case.reference
   ```

### Sincronización de Datos

#### Sincronización Manual
1. Integraciones → [Integración]
2. Click en "Sincronizar Ahora"
3. Ver progreso
4. Revisar log de errores

#### Sincronización Automática
```
Frecuencia: Cada 15 minutos
Dirección: Bidireccional
Conflictos: Último cambio gana
```

---

## 📊 Reportes y Analytics

### Dashboard Principal

#### Widgets Disponibles
- **Resumen del Día**: Tickets, mensajes, tiempo promedio
- **Performance por Hora**: Gráfico de actividad
- **Top Agentes**: Ranking por tickets resueltos
- **Satisfacción**: NPS y evaluaciones
- **Colas**: Distribución y tiempos de espera

### Reportes Predefinidos

#### Reporte de Tickets
```
Período: [Seleccionar rango]
Filtros:
- Por estado
- Por cola
- Por agente
- Por etiqueta

Métricas:
- Total de tickets
- Tiempo primera respuesta
- Tiempo de resolución
- Tickets por agente
- Satisfacción promedio
```

#### Reporte de Agentes
```
Métricas por agente:
- Tickets atendidos
- Tiempo promedio respuesta
- Mensajes enviados
- Evaluación promedio
- Horas trabajadas
```

#### Reporte de Contactos
```
- Nuevos contactos
- Contactos activos
- Por canal (WhatsApp/Web)
- Por fuente
- Tasa de conversión
```

### Exportar Reportes

1. Seleccionar reporte
2. Configurar filtros
3. Click en "Exportar"
4. Formatos disponibles:
   - PDF (con gráficos)
   - Excel (datos raw)
   - CSV (para análisis)

### Programar Reportes

1. Reportes → Programados → Nuevo
2. Configurar:
   ```
   Reporte: [Seleccionar tipo]
   Frecuencia: Diario/Semanal/Mensual
   Hora de envío: 08:00
   Destinatarios: emails
   Formato: PDF
   ```

---

## ⚙️ Configuración de la Empresa

### Datos de la Empresa

1. **Navegación**: Configuración → Empresa

2. **Información Básica**:
   ```
   Nombre: [Nombre de la empresa]
   Email: contacto@empresa.com
   Teléfono: +XX XXXXXXXXX
   Dirección: [Dirección completa]
   Website: https://empresa.com
   ```

3. **Branding**:
   - Logo principal (PNG/JPG, 500x500px)
   - Logo para chat (cuadrado)
   - Colores corporativos
   - Favicon

### Horarios de Atención

```
Horario General:
Lunes-Viernes: 09:00 - 18:00
Sábado: 09:00 - 13:00
Domingo: Cerrado

Feriados: [Configurar lista]
Vacaciones: [Período especial]
```

### Plan y Facturación

#### Ver Plan Actual
```
Plan: Professional
Usuarios: 15/20
Conexiones WhatsApp: 3/5
Colas: 8/10
Almacenamiento: 45GB/100GB
```

#### Actualizar Plan
1. Configuración → Plan
2. Ver opciones disponibles
3. Seleccionar nuevo plan
4. Confirmar cambios

### Configuraciones Avanzadas

#### Tickets
```
[ ] Cerrar automáticamente después de: 24 horas
[ ] Reabrir con nuevo mensaje
[ ] Asignación automática
[ ] Notificar inactividad: 10 minutos
```

#### Mensajes
```
[ ] Confirmar lectura (double check)
[ ] Mostrar "escribiendo..."
[ ] Guardar borradores
Rate limiting: 30-60 segundos
```

#### Seguridad
```
[ ] 2FA obligatorio
Sesión expira en: 8 horas
Intentos de login: 5
Complejidad de contraseña: Alta
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

## ❗ Problemas Comunes

### Problemas de Conexión

#### WhatsApp Desconectado
**Síntomas**: Estado rojo, no llegan mensajes
**Soluciones**:
1. Verificar conexión internet del teléfono
2. Verificar que WhatsApp Web esté activo
3. Reiniciar sesión desde Conexiones
4. Escanear QR nuevamente
5. Verificar que el teléfono tenga batería

#### Socket Desconectado
**Síntomas**: No actualizaciones en tiempo real
**Soluciones**:
1. Refrescar página (F5)
2. Limpiar caché del navegador
3. Verificar firewall/proxy
4. Probar en otro navegador
5. Contactar soporte técnico

### Problemas de Mensajes

#### Mensajes No Llegan
**Verificar**:
1. WhatsApp conectado (estado verde)
2. Cola asignada al WhatsApp
3. Horario de atención activo
4. Agentes disponibles en la cola
5. No hay filtros/bloqueos activos

#### Mensajes No Se Envían
**Verificar**:
1. Rate limiting (esperar 30-60 seg)
2. Formato del número (+código país)
3. Contacto no bloqueó la empresa
4. Archivo no excede 16MB
5. Conexión WhatsApp activa

#### Doble Check No Aparece
**Normal cuando**:
1. Cliente tiene lectura desactivada
2. Cliente bloqueó el número
3. Mensaje aún no entregado
4. Problema de conexión del cliente

### Problemas de Usuario

#### No Puedo Ver Tickets
**Verificar**:
1. Asignación a colas correctas
2. Permisos del usuario
3. Filtros aplicados
4. Estado de los tickets
5. Horario de trabajo configurado

#### No Recibo Notificaciones
**Verificar**:
1. Notificaciones del navegador permitidas
2. Sonido no está muteado
3. Usuario online/disponible
4. Configuración de notificaciones
5. No estar en "No Molestar"

### Problemas de Sistema

#### Sistema Lento
**Acciones**:
1. Limpiar caché del navegador
2. Cerrar pestañas innecesarias
3. Verificar velocidad de internet
4. Reducir cantidad de tickets visibles
5. Reportar a soporte si persiste

#### Error 500
**Acciones**:
1. Esperar 1 minuto y reintentar
2. Refrescar página
3. Limpiar cookies
4. Intentar en modo incógnito
5. Contactar soporte inmediatamente

---

## ❓ FAQ - Preguntas Frecuentes

### General

**P: ¿Cuántos WhatsApp puedo conectar?**
R: Depende de tu plan. El plan básico permite 2, profesional 5, y enterprise ilimitado.

**P: ¿Puedo usar el mismo WhatsApp en varios dispositivos?**
R: No, WhatsApp Web solo permite una sesión activa por número.

**P: ¿Se guardan los mensajes si se desconecta WhatsApp?**
R: Sí, al reconectar se sincronizan todos los mensajes pendientes.

**P: ¿Hay límite de mensajes por día?**
R: WhatsApp tiene límites para evitar spam. Recomendamos máximo 1000 mensajes/día por número.

### Tickets y Colas

**P: ¿Qué pasa con tickets sin respuesta?**
R: Se cierran automáticamente después del tiempo configurado (default: 24 horas).

**P: ¿Puedo tener un ticket en varias colas?**
R: No, pero puedes transferirlo entre colas según necesidad.

**P: ¿El cliente ve cuando transfiero el ticket?**
R: No, las acciones internas no son visibles para el cliente.

**P: ¿Puedo recuperar un ticket cerrado?**
R: Sí, desde la sección de tickets cerrados puedes reabrirlo.

### Campañas

**P: ¿Cuál es el límite de contactos por campaña?**
R: Recomendamos máximo 1000 por día para evitar bloqueos.

**P: ¿Puedo programar campañas recurrentes?**
R: No directamente, pero puedes duplicar y reprogramar campañas.

**P: ¿Qué pasa si un número es inválido?**
R: Se marca como error y continúa con el siguiente contacto.

### Flow Builder

**P: ¿Cuántos flows puedo tener activos?**
R: Ilimitados, pero solo uno puede estar activo por defecto por WhatsApp.

**P: ¿Puedo exportar/importar flows?**
R: Sí, puedes exportar como JSON y reimportar en otra instancia.

**P: ¿Los flows funcionan fuera de horario?**
R: Sí, son independientes del horario de atención humana.

### Integraciones

**P: ¿Necesito conocimientos técnicos para webhooks?**
R: Conocimientos básicos ayudan, pero hay plantillas predefinidas.

**P: ¿Puedo integrar con mi CRM personalizado?**
R: Sí, usando webhooks o la API REST documentada.

**P: ¿Las integraciones son en tiempo real?**
R: Los webhooks son instantáneos, las sincronizaciones pueden tener delay configurado.

### Seguridad y Privacidad

**P: ¿Los datos están encriptados?**
R: Sí, usamos encriptación en tránsito (HTTPS) y en reposo.

**P: ¿Hacen backup de los datos?**
R: Sí, backups diarios automáticos con retención de 30 días.

**P: ¿Cumplen con LGPD/GDPR?**
R: Sí, cumplimos con las normativas de protección de datos.

**P: ¿Puedo exportar todos mis datos?**
R: Sí, puedes solicitar exportación completa en formato estándar.

### Soporte

**P: ¿Cómo contacto soporte técnico?**
R: 
- Chat dentro de la plataforma
- Email: soporte@tucanlink.com
- WhatsApp: +XX XXXXXXXXX
- Horario: Lun-Vie 9:00-18:00

**P: ¿Hay documentación técnica disponible?**
R: Sí, documentación completa en https://docs.tucanlink.com

**P: ¿Ofrecen capacitación?**
R: Sí, sesiones de onboarding y webinars mensuales gratuitos.

**P: ¿Hay API para desarrolladores?**
R: Sí, API REST completa documentada con Swagger.

---

## 📞 CONTACTO Y RECURSOS

### Soporte Técnico
- **Email**: soporte@tucanlink.com
- **WhatsApp**: +XX XXXXXXXXX
- **Chat en vivo**: Dentro de la plataforma
- **Horario**: Lunes a Viernes 9:00-18:00

### Recursos Adicionales
- **Documentación**: https://docs.tucanlink.com
- **Videos tutoriales**: https://youtube.com/tucanlink
- **Blog**: https://blog.tucanlink.com
- **Status del servicio**: https://status.tucanlink.com

### Comunidad
- **Foro**: https://community.tucanlink.com
- **Facebook**: /tucanlink
- **LinkedIn**: /company/tucanlink
- **Telegram**: t.me/tucanlink

---

*Última actualización: Agosto 2025*
*Versión del sistema: TucanLink v6.0.0*
*Para más información visite: https://tucanlink.com*