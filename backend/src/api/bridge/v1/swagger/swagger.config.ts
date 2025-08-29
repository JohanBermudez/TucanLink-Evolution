import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'TucanLink API Bridge',
      version,
      description: `
        ## 🚀 API Bridge para TucanLink CRM
        
        Sistema de API RESTful que proporciona acceso completo a las funcionalidades del CRM TucanLink.
        
        ### 🔐 Autenticación
        
        La API soporta dos métodos de autenticación:
        
        1. **JWT Token** - Para aplicaciones frontend y usuarios
        2. **API Key** - Para integraciones server-to-server
        
        #### Modo Desarrollo
        En desarrollo, puedes bypassear la autenticación agregando \`?companyId=1\` a cualquier endpoint.
        
        ### 📊 Estado de las APIs
        
        | API | Estado | Descripción |
        |-----|--------|-------------|
        | Tickets | ✅ Operativa | Gestión completa de tickets |
        | Messages | ✅ Operativa | Envío/recepción WhatsApp |
        | Contacts | ✅ Operativa | Gestión de contactos |
        | Queues | ✅ Operativa | Gestión de colas |
        | WhatsApp | ✅ Operativa | Sesiones y QR codes |
        | Users | ✅ Operativa | Gestión de usuarios |
        | Tags | ✅ Operativa | Sistema de etiquetas |
        | Companies | ✅ Operativa | Multi-tenancy |
        | Settings | ✅ Operativa | Configuraciones |
        | Schedules | ✅ Operativa | Mensajes programados |
        
        ### 🎯 Endpoints Principales
        
        - Base URL: \`http://localhost:8090/api/bridge/v1\`
        - Health Check: \`/health\`
        - API Docs: \`/docs\`
        
        ### 📝 Notas Importantes
        
        - Todos los endpoints requieren autenticación (excepto health y docs)
        - Las respuestas incluyen paginación donde aplique
        - Los errores siguen el formato estándar RFC 7807
        - Rate limiting: 1000 req/min por API Key
      `,
      contact: {
        name: 'TucanLink Support',
        email: 'support@tucanlink.com',
        url: 'https://tucanlink.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://tucanlink.com/license'
      }
    },
    servers: [
      {
        url: 'http://localhost:8090/api/bridge/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.tucanlink.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key for server-to-server communication'
        },
        devMode: {
          type: 'apiKey',
          in: 'query',
          name: 'companyId',
          description: 'Development only - bypass auth with companyId parameter'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 5 },
            hasMore: { type: 'boolean', example: true }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            protocol: { type: 'string' },
            status: { type: 'string', enum: ['open', 'pending', 'closed'] },
            unreadMessages: { type: 'number' },
            lastMessage: { type: 'string' },
            contactId: { type: 'number' },
            userId: { type: 'number' },
            queueId: { type: 'number' },
            whatsappId: { type: 'number' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            number: { type: 'string' },
            email: { type: 'string' },
            profilePicUrl: { type: 'string' },
            isGroup: { type: 'boolean' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            body: { type: 'string' },
            ack: { type: 'number' },
            read: { type: 'boolean' },
            mediaType: { type: 'string' },
            mediaUrl: { type: 'string' },
            ticketId: { type: 'number' },
            fromMe: { type: 'boolean' },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            profile: { type: 'string', enum: ['admin', 'user', 'supervisor'] },
            online: { type: 'boolean' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
            kanban: { type: 'number' },
            companyId: { type: 'number' },
            ticketCount: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Queue: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            color: { type: 'string' },
            greeting: { type: 'string' },
            orderQueue: { type: 'number' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        WhatsApp: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['CONNECTED', 'DISCONNECTED', 'OPENING', 'QRCODE', 'TIMEOUT'] 
            },
            battery: { type: 'string' },
            plugged: { type: 'boolean' },
            isDefault: { type: 'boolean' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Company: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            status: { type: 'boolean' },
            planId: { type: 'number' },
            campaignsEnabled: { type: 'boolean' },
            dueDate: { type: 'string', format: 'date' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Setting: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            key: { type: 'string' },
            value: { type: 'string' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Schedule: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            body: { type: 'string' },
            sendAt: { type: 'string', format: 'date-time' },
            sentAt: { type: 'string', format: 'date-time' },
            contactId: { type: 'number' },
            ticketId: { type: 'number' },
            userId: { type: 'number' },
            companyId: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Page number for pagination'
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          description: 'Number of items per page'
        },
        searchParam: {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Search term'
        },
        companyIdParam: {
          in: 'query',
          name: 'companyId',
          schema: { type: 'integer' },
          description: 'Company ID (dev mode bypass)'
        },
        idParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'Resource ID'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        },
        ValidationError: {
          description: 'Invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Tickets', description: 'Ticket management' },
      { name: 'Messages', description: 'WhatsApp messaging' },
      { name: 'Contacts', description: 'Contact management' },
      { name: 'Queues', description: 'Queue management' },
      { name: 'WhatsApp', description: 'WhatsApp session management' },
      { name: 'Users', description: 'User management' },
      { name: 'Tags', description: 'Tag management' },
      { name: 'Companies', description: 'Company management' },
      { name: 'Settings', description: 'System settings' },
      { name: 'Schedules', description: 'Message scheduling' }
    ]
  },
  apis: [
    './src/api/bridge/v1/routes/*.ts',
    './src/api/bridge/v1/controllers/*.ts',
    './src/api/bridge/server.ts'
  ]
};

export default swaggerJsdoc(options);