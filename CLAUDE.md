# CLAUDE.md

This file provides essential guidance to Claude Code (claude.ai/code) when working with the TucanLink CRM codebase.

## 🎯 Project Overview

TucanLink is a **multi-tenant WhatsApp CRM** system (white-label: "Atendechat") featuring:
- WhatsApp Business integration via Baileys/WhiskeySockets
- Real-time messaging with Socket.io
- Campaign management with rate limiting
- Visual flow builder for automation
- Webhook system for external integrations
- Multi-company data isolation

**Production**: https://tucanlink.ianebula.com
**Documentation**: See `/docs` folder for detailed guides

## 🚀 Essential Commands

### Quick Start
```bash
# Setup services
docker run --name tucanlink-postgres -e POSTGRES_PASSWORD=tucanlink2024 -e POSTGRES_USER=tucanlink -e POSTGRES_DB=tucanlink -p 5432:5432 -d postgres:14
docker run --name tucanlink-redis -p 6379:6379 -d redis redis-server --requirepass tucanlink2024

# Install dependencies (use --force due to version constraints)
cd backend && npm install --force
cd ../frontend && npm install --force

# Database setup (backend must be built first)
cd backend
npm run build
npx sequelize db:migrate
npx sequelize db:seed:all

# Run development
npm run dev:server    # Backend (port 8080)
cd ../frontend && npm start  # Frontend (port 3000)

# Default login: admin@admin.com / admin
```

## 🏗️ Architecture Highlights

### Key Technologies
- **Backend**: Express + TypeScript + Sequelize v5.22.5 + PostgreSQL + Redis
- **Frontend**: React 17 + Material-UI + Socket.io-client + Context API
- **WhatsApp**: @whiskeysockets/baileys for Business API integration
- **Queue System**: Bull + Redis for async processing
- **Real-time**: Socket.io for bidirectional communication

### Critical Patterns

#### Multi-Tenant Isolation
Every query MUST filter by `companyId` from `req.user.companyId`. Data is completely isolated between companies.

#### Service Layer Pattern
All database operations go through services in `/backend/src/services/[Feature]Services/`:
- `CreateService.ts`, `UpdateService.ts`, `DeleteService.ts`
- `ListService.ts`, `ShowService.ts`, `FindService.ts`

#### Message Flow
```
Incoming: WhatsApp → Baileys → wbotMessageListener → Ticket → Socket.io → Frontend
Outgoing: Frontend → API → Bull Queue → Rate Limit → Baileys → WhatsApp
```

#### Key Files to Know
- `backend/src/libs/wbot.ts` - WhatsApp session management
- `backend/src/libs/socket.ts` - Socket.io configuration
- `backend/src/queues.ts` - Queue processing
- `backend/src/services/WbotServices/wbotMessageListener.ts` - Message handler

## ⚠️ Important Constraints

### Version Specifics
- **Sequelize**: v5.22.5 (NOT v6+) - Uses different import syntax and decorators
- **Node.js**: v20.x with `NODE_OPTIONS=--openssl-legacy-provider` for Node 17+
- **PostgreSQL**: Tables use PascalCase with quotes (`"Users"`, `"Tickets"`)
- **React Scripts**: v3.4.3 requires legacy OpenSSL for webpack

### Critical Dependencies
- **Redis REQUIRED**: Queue system won't function without Redis
- **Rate Limiting**: 20-60 seconds between WhatsApp messages
- **File Size Limits**: 16MB for WhatsApp media

## 🔧 Common Tasks

### Add New Feature
1. Create service in `backend/src/services/[Feature]Services/`
2. Add controller in `backend/src/controllers/[Feature]Controller.ts`
3. Register routes in `backend/src/routes/[feature]Routes.ts`
4. Add to `backend/src/routes/index.ts`

### Database Changes
```bash
npx sequelize migration:generate --name description
# Edit migration in backend/src/database/migrations/
npm run build  # MUST build before migrate
npx sequelize db:migrate
```

### Troubleshooting
- **ERR_WAPP_NOT_INITIALIZED**: Reconnect WhatsApp session
- **Migration fails**: Run `npm run build` first
- **Frontend won't start**: Add `NODE_OPTIONS=--openssl-legacy-provider`
- **Socket not updating**: Check CORS and WebSocket proxy settings

## 📁 Project Structure
```
/backend/src/
  ├── controllers/     # HTTP endpoints
  ├── services/        # Business logic (CRUD pattern)
  ├── models/          # Sequelize models (46 tables)
  ├── libs/            # Core libraries (wbot, socket)
  └── database/        # Migrations & seeds

/frontend/src/
  ├── pages/           # Route components
  ├── components/      # Reusable UI
  ├── context/         # Global state
  └── services/api.js  # API client

/docs/               # Complete documentation
  ├── CONTEXTO_TECNICO.md   # Technical details
  ├── GUIAS_USUARIO.md      # User guides
  └── DESARROLLO.md         # Development guide
```

## 🚨 Development Workflow

**NEVER edit directly in production VM!**

```
Local development → Push to GitHub → Auto-deploy to production
```

1. Work in `development` branch
2. Test locally
3. Merge to `main`
4. GitHub Actions deploys automatically (~2-3 min)
5. Production: https://tucanlink.ianebula.com

## 💡 Quick Tips

- Full documentation in `/docs` folder
- Default login: `admin@admin.com / admin`
- WebSocket events follow pattern: `company-${id}-${event}`
- All features are multi-tenant isolated by `companyId`
- Webhooks system recently added - see `WebhookConfig` model
- Flow Builder uses React Flow for visual automation
- Campaign system includes rate limiting to prevent WhatsApp bans