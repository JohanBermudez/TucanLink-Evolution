# 🚀 GUÍA DE DESARROLLO - TUCANLINK CRM

## 📋 TABLA DE CONTENIDOS

1. [CONFIGURACIÓN DEL ENTORNO](#configuración-del-entorno)
2. [FLUJO DE TRABAJO](#flujo-de-trabajo)
3. [ESTRUCTURA Y CONVENCIONES](#estructura-y-convenciones)
4. [DESARROLLO BACKEND](#desarrollo-backend)
5. [DESARROLLO FRONTEND](#desarrollo-frontend)
6. [BASE DE DATOS](#base-de-datos)
7. [TESTING](#testing)
8. [DEPLOYMENT](#deployment)
9. [MIGRACIÓN A SUPABASE](#migración-a-supabase)
10. [TROUBLESHOOTING](#troubleshooting-desarrollo)
11. [MEJORES PRÁCTICAS](#mejores-prácticas)

---

## ⚙️ CONFIGURACIÓN DEL ENTORNO

### Requisitos Previos

```bash
# Software requerido
- Node.js v20.x (LTS)
- PostgreSQL 14+
- Redis 7+
- Docker y Docker Compose
- Git
- VS Code (recomendado)
```

### Instalación Inicial

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/JohanBermudez/tucanlink-crm-complete.git
cd tucanlink-crm-complete
```

#### 2. Configurar Servicios con Docker

```bash
# PostgreSQL
docker run --name tucanlink-postgres \
  -e POSTGRES_PASSWORD=tucanlink2024 \
  -e POSTGRES_USER=tucanlink \
  -e POSTGRES_DB=tucanlink \
  -p 5432:5432 \
  -d postgres:14

# Redis
docker run --name tucanlink-redis \
  -p 6379:6379 \
  -d redis redis-server --requirepass tucanlink2024
```

#### 3. Configurar Variables de Entorno

##### Backend (.env)
```bash
cd backend
cp .env.example .env
# Editar .env con los valores correctos

# Valores principales
NODE_ENV=development
BACKEND_URL=http://localhost:8080
FRONTEND_URL=http://localhost:3000
PORT=8080

# Base de datos
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=tucanlink
DB_PASS=tucanlink2024
DB_NAME=tucanlink

# Redis
REDIS_URI=redis://:tucanlink2024@127.0.0.1:6379
IO_REDIS_SERVER=localhost
IO_REDIS_PORT=6379
IO_REDIS_PASSWORD=tucanlink2024

# JWT
JWT_SECRET=desarrollo_jwt_secret_cambiar_en_produccion
JWT_REFRESH_SECRET=desarrollo_refresh_secret_cambiar
```

##### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env
# Editar .env

REACT_APP_BACKEND_URL=http://localhost:8080
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
```

#### 4. Instalar Dependencias

```bash
# Backend
cd backend
npm install --force  # Force por incompatibilidades menores

# Frontend
cd ../frontend
npm install --force  # Force por Node 17+ con legacy SSL
```

#### 5. Configurar Base de Datos

```bash
cd backend

# Compilar TypeScript (requerido para migraciones)
npm run build

# Ejecutar migraciones
npx sequelize db:migrate

# Cargar datos iniciales
npx sequelize db:seed:all
```

#### 6. Iniciar Servicios de Desarrollo

```bash
# Terminal 1 - Backend
cd backend
npm run dev:server

# Terminal 2 - Frontend
cd frontend
npm start  # Automáticamente usa NODE_OPTIONS=--openssl-legacy-provider

# Acceder a:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# Login: admin@admin.com / admin
```

---

## 🔄 FLUJO DE TRABAJO

### Metodología Git Flow

```
main (producción)
  ├── development (desarrollo activo)
  │   ├── feature/nueva-funcionalidad
  │   ├── bugfix/correccion-error
  │   └── hotfix/parche-urgente
  └── release/v1.2.0 (preparación para producción)
```

### Flujo de Desarrollo Estándar

#### 1. Sincronizar con Repositorio

```bash
# Siempre antes de empezar
git checkout main
git pull origin main
git checkout development
git merge main
```

#### 2. Crear Rama de Feature

```bash
git checkout development
git pull origin development
git checkout -b feature/nombre-descriptivo
```

#### 3. Desarrollo y Commits

```bash
# Hacer cambios
git add .
git commit -m "tipo: descripción breve

Descripción detallada del cambio y por qué se hizo"

# Tipos de commit:
# feat: Nueva funcionalidad
# fix: Corrección de bug
# docs: Cambios en documentación
# style: Formateo, sin cambios de lógica
# refactor: Refactorización de código
# test: Añadir tests
# chore: Cambios en build, auxiliares
```

#### 4. Push y Pull Request

```bash
git push origin feature/nombre-descriptivo
# Crear PR en GitHub hacia development
```

#### 5. Merge a Development

```bash
# Después de revisar PR
git checkout development
git merge feature/nombre-descriptivo
git push origin development
```

#### 6. Preparar para Producción

```bash
# Cuando development está listo
git checkout main
git merge development
git push origin main  # Activa deploy automático
```

### GitHub Actions - CI/CD

El archivo `.github/workflows/deploy-simple.yml` configura:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Deploy to VM
      - Build backend
      - Build frontend
      - Restart services
```

**Estado**: ✅ Funcionando
**Trigger**: Push a `main`
**Tiempo**: ~2-3 minutos
**URL Producción**: https://tucanlink.ianebula.com

---

## 📁 ESTRUCTURA Y CONVENCIONES

### Estructura Backend

```
backend/src/
├── @types/          # Definiciones TypeScript personalizadas
├── config/          # Configuraciones (auth, database, upload)
├── controllers/     # Controladores HTTP (req/res)
├── database/        # Migraciones y seeds
├── errors/          # Clases de error personalizadas
├── helpers/         # Funciones auxiliares
├── libs/            # Librerías internas (socket, wbot)
├── middleware/      # Middlewares Express
├── models/          # Modelos Sequelize
├── routes/          # Definición de rutas
├── services/        # Lógica de negocio
└── utils/           # Utilidades generales
```

### Convenciones de Código Backend

#### Naming Conventions

```typescript
// Archivos y carpetas: PascalCase para clases, camelCase para otros
CreateTicketService.ts
wbotMessageListener.ts

// Clases: PascalCase
class TicketService { }

// Interfaces: PascalCase con prefijo I
interface ITicketData { }

// Funciones: camelCase
function createTicket() { }

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Variables: camelCase
const ticketStatus = "open";
```

#### Patrón Service Layer

```typescript
// services/TicketServices/CreateTicketService.ts
interface Request {
  contactId: number;
  companyId: number;
  status?: string;
  queueId?: number;
}

interface Response {
  ticket: Ticket;
  created: boolean;
}

const CreateTicketService = async ({
  contactId,
  companyId,
  status = "pending",
  queueId
}: Request): Promise<Response> => {
  // Validación
  const contact = await Contact.findByPk(contactId);
  if (!contact) {
    throw new AppError("Contact not found", 404);
  }
  
  // Lógica de negocio
  const ticket = await Ticket.create({
    contactId,
    companyId,
    status,
    queueId
  });
  
  // Emit evento Socket.io
  const io = getIO();
  io.to(`company-${companyId}`).emit("ticket", {
    action: "create",
    ticket
  });
  
  return {
    ticket,
    created: true
  };
};

export default CreateTicketService;
```

#### Patrón Controller

```typescript
// controllers/TicketController.ts
export const store = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { contactId, queueId } = req.body;
  const { companyId } = req.user;
  
  const { ticket } = await CreateTicketService({
    contactId,
    companyId,
    queueId
  });
  
  return res.status(201).json(ticket);
};
```

### Estructura Frontend

```
frontend/src/
├── assets/          # Imágenes y recursos estáticos
├── components/      # Componentes reutilizables
├── context/         # Context providers
├── errors/          # Manejo de errores
├── helpers/         # Funciones auxiliares
├── hooks/           # Custom React hooks
├── layout/          # Layouts de página
├── pages/           # Páginas/vistas
├── routes/          # Configuración de rutas
├── services/        # Servicios API
├── stores/          # Estado global
└── translate/       # i18n
```

### Convenciones de Código Frontend

#### Componentes React

```javascript
// Componente funcional con hooks
import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import api from "../../services/api";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2)
  }
}));

const TicketList = ({ companyId }) => {
  const classes = useStyles();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadTickets();
  }, [companyId]);
  
  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tickets", {
        params: { companyId }
      });
      setTickets(data);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Loading />;
  
  return (
    <div className={classes.root}>
      {tickets.map(ticket => (
        <TicketItem key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
};

export default TicketList;
```

#### Custom Hooks

```javascript
// hooks/useTickets.js
import { useState, useEffect } from "react";
import api from "../services/api";
import socketConnection from "../services/socket";

const useTickets = ({ status, companyId }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await api.get("/tickets", {
          params: { status, companyId }
        });
        setTickets(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTickets();
    
    const socket = socketConnection();
    
    socket.on("ticket", (data) => {
      if (data.action === "create") {
        setTickets(prev => [...prev, data.ticket]);
      }
      if (data.action === "update") {
        setTickets(prev => prev.map(t => 
          t.id === data.ticket.id ? data.ticket : t
        ));
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [status, companyId]);
  
  return { tickets, loading };
};

export default useTickets;
```

---

## 🔧 DESARROLLO BACKEND

### Crear Nuevo Endpoint

#### 1. Crear Modelo (si necesario)

```typescript
// models/Feature.ts
import { Model, DataTypes, Sequelize } from "sequelize";

class Feature extends Model {
  public id!: number;
  public name!: string;
  public companyId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Feature.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    companyId: {
      type: DataTypes.INTEGER,
      references: { model: "Companies", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    }
  },
  {
    sequelize,
    tableName: "Features"
  }
);

export default Feature;
```

#### 2. Crear Servicios

```typescript
// services/FeatureServices/CreateFeatureService.ts
import * as Yup from "yup";
import Feature from "../../models/Feature";
import AppError from "../../errors/AppError";

interface Request {
  name: string;
  companyId: number;
}

const CreateFeatureService = async ({ 
  name, 
  companyId 
}: Request): Promise<Feature> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().min(3),
    companyId: Yup.number().required().positive()
  });
  
  try {
    await schema.validate({ name, companyId });
  } catch (err) {
    throw new AppError(err.message, 400);
  }
  
  const feature = await Feature.create({
    name,
    companyId
  });
  
  return feature;
};

export default CreateFeatureService;
```

#### 3. Crear Controller

```typescript
// controllers/FeatureController.ts
import { Request, Response } from "express";
import CreateFeatureService from "../services/FeatureServices/CreateFeatureService";
import ListFeaturesService from "../services/FeatureServices/ListFeaturesService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { page = 1, limit = 20 } = req.query;
  
  const features = await ListFeaturesService({
    companyId,
    page: Number(page),
    limit: Number(limit)
  });
  
  return res.json(features);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { name } = req.body;
  const { companyId } = req.user;
  
  const feature = await CreateFeatureService({
    name,
    companyId
  });
  
  return res.status(201).json(feature);
};
```

#### 4. Crear Rutas

```typescript
// routes/featureRoutes.ts
import { Router } from "express";
import * as FeatureController from "../controllers/FeatureController";
import isAuth from "../middleware/isAuth";

const router = Router();

router.get("/features", isAuth, FeatureController.index);
router.post("/features", isAuth, FeatureController.store);
router.get("/features/:id", isAuth, FeatureController.show);
router.put("/features/:id", isAuth, FeatureController.update);
router.delete("/features/:id", isAuth, FeatureController.remove);

export default router;
```

#### 5. Registrar Rutas

```typescript
// routes/index.ts
import featureRoutes from "./featureRoutes";

// Añadir a la lista de rutas
app.use(featureRoutes);
```

### Trabajar con WhatsApp/Baileys

#### Enviar Mensaje

```typescript
import { getWbot } from "../libs/wbot";

const sendMessage = async (ticketId: number, message: string) => {
  const ticket = await Ticket.findByPk(ticketId, {
    include: ["contact", "whatsapp"]
  });
  
  const wbot = getWbot(ticket.whatsapp.id);
  
  const number = `${ticket.contact.number}@${
    ticket.isGroup ? "g.us" : "s.whatsapp.net"
  }`;
  
  const sentMessage = await wbot.sendMessage(number, {
    text: message
  });
  
  return sentMessage;
};
```

#### Recibir Mensaje

```typescript
// libs/wbot.ts - Event handler
wbot.ev.on("messages.upsert", async (messageUpsert) => {
  const messages = messageUpsert.messages;
  
  messages.forEach(async (message) => {
    // Procesar mensaje
    await handleIncomingMessage(message);
  });
});
```

### Trabajar con Socket.io

#### Emitir Evento

```typescript
import { getIO } from "../libs/socket";

const emitEvent = (event: string, data: any) => {
  const io = getIO();
  
  // Emitir a todos los clientes de una empresa
  io.to(`company-${companyId}`).emit(event, data);
  
  // Emitir a un usuario específico
  io.to(`user-${userId}`).emit(event, data);
  
  // Emitir a un ticket específico
  io.to(`ticket-${ticketId}`).emit(event, data);
};
```

---

## 🎨 DESARROLLO FRONTEND

### Crear Nueva Página

#### 1. Crear Componente de Página

```javascript
// pages/Features/index.js
import React, { useState, useEffect, useContext } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField
} from "@material-ui/core";
import { Edit, Delete } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import { toast } from "react-toastify";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  },
  table: {
    minWidth: 650
  }
}));

const Features = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadFeatures();
  }, []);
  
  const loadFeatures = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/features");
      setFeatures(data);
    } catch (error) {
      toast.error("Error loading features");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id) => {
    try {
      await api.delete(`/features/${id}`);
      setFeatures(features.filter(f => f.id !== id));
      toast.success("Feature deleted");
    } catch (error) {
      toast.error("Error deleting feature");
    }
  };
  
  return (
    <Paper className={classes.root}>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {features.map(feature => (
            <TableRow key={feature.id}>
              <TableCell>{feature.id}</TableCell>
              <TableCell>{feature.name}</TableCell>
              <TableCell>
                <IconButton onClick={() => handleEdit(feature.id)}>
                  <Edit />
                </IconButton>
                <IconButton onClick={() => handleDelete(feature.id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default Features;
```

#### 2. Añadir Ruta

```javascript
// routes/index.js
import Features from "../pages/Features";

const Routes = () => {
  return (
    <Switch>
      {/* Otras rutas */}
      <Route 
        exact 
        path="/features" 
        component={Features} 
        isPrivate 
      />
    </Switch>
  );
};
```

#### 3. Añadir al Menú

```javascript
// layout/MainListItems.js
import { ListItem, ListItemIcon, ListItemText } from "@material-ui/core";
import { Features as FeaturesIcon } from "@material-ui/icons";

const MainListItems = () => {
  return (
    <div>
      {/* Otros items */}
      <ListItem button onClick={() => history.push("/features")}>
        <ListItemIcon>
          <FeaturesIcon />
        </ListItemIcon>
        <ListItemText primary="Features" />
      </ListItem>
    </div>
  );
};
```

### Trabajar con Socket.io en Frontend

```javascript
// components/RealtimeFeatures.js
import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "../../context/Socket/SocketContext";

const RealtimeFeatures = () => {
  const socket = useContext(SocketContext);
  const [features, setFeatures] = useState([]);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleFeatureUpdate = (data) => {
      if (data.action === "create") {
        setFeatures(prev => [...prev, data.feature]);
      }
      if (data.action === "update") {
        setFeatures(prev => prev.map(f => 
          f.id === data.feature.id ? data.feature : f
        ));
      }
      if (data.action === "delete") {
        setFeatures(prev => prev.filter(f => f.id !== data.featureId));
      }
    };
    
    socket.on("feature", handleFeatureUpdate);
    
    return () => {
      socket.off("feature", handleFeatureUpdate);
    };
  }, [socket]);
  
  return (
    <div>
      {features.map(feature => (
        <FeatureCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
};
```

---

## 🗄️ BASE DE DATOS

### Crear Nueva Migración

```bash
# Generar archivo de migración
npx sequelize migration:generate --name add-features-table

# Esto crea: backend/src/database/migrations/TIMESTAMP-add-features-table.ts
```

#### Editar Migración

```typescript
// migrations/20240826000000-add-features-table.ts
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("Features", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      companyId: {
        type: Sequelize.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },
  
  down: (queryInterface) => {
    return queryInterface.dropTable("Features");
  }
};
```

#### Ejecutar Migración

```bash
# Compilar TypeScript primero
npm run build

# Ejecutar migración
npx sequelize db:migrate

# Revertir si hay error
npx sequelize db:migrate:undo
```

### Crear Seed

```typescript
// seeds/20240826000000-demo-features.ts
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "Features",
      [
        {
          name: "Feature 1",
          description: "Description 1",
          companyId: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "Feature 2",
          description: "Description 2",
          companyId: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },
  
  down: (queryInterface) => {
    return queryInterface.bulkDelete("Features", null, {});
  }
};
```

### Trabajar con Transacciones

```typescript
import { Sequelize } from "sequelize";
import sequelize from "../database";

const createFeatureWithItems = async (featureData, itemsData) => {
  const transaction = await sequelize.transaction();
  
  try {
    const feature = await Feature.create(featureData, { transaction });
    
    const items = await Promise.all(
      itemsData.map(item => 
        FeatureItem.create({
          ...item,
          featureId: feature.id
        }, { transaction })
      )
    );
    
    await transaction.commit();
    
    return { feature, items };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

---

## 🧪 TESTING

### Testing Backend (Jest)

#### Configuración

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/database/migrations/**",
    "!src/database/seeds/**"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"]
};
```

#### Test de Servicio

```typescript
// __tests__/services/CreateFeatureService.test.ts
import CreateFeatureService from "../../src/services/FeatureServices/CreateFeatureService";
import Feature from "../../src/models/Feature";

jest.mock("../../src/models/Feature");

describe("CreateFeatureService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it("should create a new feature", async () => {
    const mockFeature = {
      id: 1,
      name: "Test Feature",
      companyId: 1
    };
    
    Feature.create = jest.fn().mockResolvedValue(mockFeature);
    
    const result = await CreateFeatureService({
      name: "Test Feature",
      companyId: 1
    });
    
    expect(Feature.create).toHaveBeenCalledWith({
      name: "Test Feature",
      companyId: 1
    });
    expect(result).toEqual(mockFeature);
  });
  
  it("should throw error with invalid data", async () => {
    await expect(
      CreateFeatureService({
        name: "",
        companyId: 1
      })
    ).rejects.toThrow("Validation error");
  });
});
```

#### Test de API

```typescript
// __tests__/integration/features.test.ts
import request from "supertest";
import app from "../../src/app";
import { createTestUser, getAuthToken } from "../utils/testHelpers";

describe("Features API", () => {
  let authToken: string;
  
  beforeAll(async () => {
    const user = await createTestUser();
    authToken = await getAuthToken(user);
  });
  
  describe("GET /features", () => {
    it("should return list of features", async () => {
      const response = await request(app)
        .get("/features")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
    });
    
    it("should return 401 without auth", async () => {
      await request(app)
        .get("/features")
        .expect(401);
    });
  });
  
  describe("POST /features", () => {
    it("should create new feature", async () => {
      const response = await request(app)
        .post("/features")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "New Feature"
        })
        .expect(201);
      
      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("New Feature");
    });
  });
});
```

### Testing Frontend (React Testing Library)

#### Test de Componente

```javascript
// __tests__/components/FeatureList.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeatureList from "../../src/components/FeatureList";
import api from "../../src/services/api";

jest.mock("../../src/services/api");

describe("FeatureList", () => {
  const mockFeatures = [
    { id: 1, name: "Feature 1" },
    { id: 2, name: "Feature 2" }
  ];
  
  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockFeatures });
  });
  
  it("should render features list", async () => {
    render(<FeatureList />);
    
    await waitFor(() => {
      expect(screen.getByText("Feature 1")).toBeInTheDocument();
      expect(screen.getByText("Feature 2")).toBeInTheDocument();
    });
  });
  
  it("should delete feature on button click", async () => {
    api.delete.mockResolvedValue({});
    
    render(<FeatureList />);
    
    await waitFor(() => {
      const deleteButton = screen.getAllByRole("button", { name: /delete/i })[0];
      userEvent.click(deleteButton);
    });
    
    expect(api.delete).toHaveBeenCalledWith("/features/1");
  });
});
```

### Ejecutar Tests

```bash
# Backend
cd backend
npm test                 # Ejecutar todos los tests
npm run test:watch       # Modo watch
npm run test:coverage    # Con cobertura

# Frontend
cd frontend
npm test                 # Ejecutar en modo interactivo
npm run test:coverage    # Con cobertura
npm run test:ci          # Para CI/CD
```

---

## 🚀 DEPLOYMENT

### Desarrollo Local

```bash
# Backend
npm run dev:server       # Hot reload con nodemon

# Frontend
npm start                # Hot reload con webpack dev server
```

### Build para Producción

```bash
# Backend
cd backend
npm run build            # Compila TypeScript a JavaScript
# Resultado en /dist

# Frontend
cd frontend
npm run build            # Build optimizado
# Resultado en /build
```

### Deployment Manual

#### 1. Preparar Código

```bash
# En tu máquina local
git checkout main
git merge development
git push origin main
```

#### 2. En el Servidor

```bash
# Conectar al servidor
ssh usuario@servidor

# Actualizar código
cd /path/to/tucanlink
git pull origin main

# Backend
cd backend
npm install --production
npm run build
pm2 restart tucanlink-backend

# Frontend
cd ../frontend
npm install --production
npm run build
pm2 restart tucanlink-frontend
```

### Deployment Automático (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /home/tucanlink
            git pull origin main
            cd backend
            npm ci --production
            npm run build
            pm2 restart tucanlink-backend
            cd ../frontend
            npm ci --production
            npm run build
            pm2 restart tucanlink-frontend
```

### PM2 Configuración

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "tucanlink-backend",
      script: "./dist/server.js",
      cwd: "/home/tucanlink/backend",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8080
      },
      error_file: "./logs/pm2-backend-error.log",
      out_file: "./logs/pm2-backend-out.log",
      log_file: "./logs/pm2-backend-combined.log",
      time: true
    },
    {
      name: "tucanlink-frontend",
      script: "serve",
      args: "-s build -l 3000",
      cwd: "/home/tucanlink/frontend",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
```

### Nginx Configuración

```nginx
# /etc/nginx/sites-available/tucanlink
server {
    server_name tucanlink.ianebula.com;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SSL Configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/tucanlink.ianebula.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tucanlink.ianebula.com/privkey.pem;
}

server {
    listen 80;
    server_name tucanlink.ianebula.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 🔄 MIGRACIÓN A SUPABASE

### Plan de Migración

#### 1. Configuración Supabase

```bash
# Datos de conexión Supabase
Host: aws-0-us-west-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.qwonjgkuriljnmuaoccp
Password: [Tu contraseña]
```

#### 2. Exportar Datos Locales

```bash
# Exportar schema
pg_dump -h localhost -U tucanlink -d tucanlink --schema-only > schema.sql

# Exportar datos
pg_dump -h localhost -U tucanlink -d tucanlink --data-only > data.sql

# Backup completo
pg_dump -h localhost -U tucanlink -d tucanlink > backup_complete.sql
```

#### 3. Importar en Supabase

```bash
# Conectar a Supabase
psql -h aws-0-us-west-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.qwonjgkuriljnmuaoccp \
     -d postgres

# Importar schema
\i schema.sql

# Importar datos
\i data.sql
```

#### 4. Actualizar Configuración Backend

```bash
# .env
DB_HOST=aws-0-us-west-1.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.qwonjgkuriljnmuaoccp
DB_PASS=[Tu contraseña]
DB_NAME=postgres
DB_SSL=true
```

#### 5. Configurar SSL para Sequelize

```typescript
// database/index.ts
const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
});
```

### Consideraciones Post-Migración

1. **Redis**: Mantener local (Bull Queue dependency)
2. **Archivos**: Considerar Supabase Storage
3. **Backups**: Configurar backups automáticos en Supabase
4. **Monitoreo**: Usar Supabase Dashboard
5. **Performance**: Ajustar pool de conexiones

---

## 🐛 TROUBLESHOOTING DESARROLLO

### Problemas Comunes y Soluciones

#### Error: Cannot find module

```bash
# Solución
npm run build  # Compilar TypeScript
npm install    # Reinstalar dependencias
```

#### Error: Sequelize migration fails

```bash
# Causa: TypeScript no compilado
npm run build
npx sequelize db:migrate
```

#### Error: EADDRINUSE - Puerto en uso

```bash
# Encontrar proceso usando el puerto
lsof -i :8080
kill -9 [PID]

# O cambiar puerto en .env
PORT=8081
```

#### Error: Redis connection refused

```bash
# Verificar Redis corriendo
docker ps | grep redis

# Reiniciar Redis
docker restart tucanlink-redis

# O iniciar nuevo
docker run --name tucanlink-redis -p 6379:6379 -d redis redis-server --requirepass tucanlink2024
```

#### Error: PostgreSQL connection failed

```bash
# Verificar PostgreSQL corriendo
docker ps | grep postgres

# Reiniciar
docker restart tucanlink-postgres

# Verificar credenciales en .env
```

#### Frontend: NODE_OPTIONS error

```bash
# Para Node 17+
NODE_OPTIONS=--openssl-legacy-provider npm start

# O añadir a package.json
"scripts": {
  "start": "NODE_OPTIONS=--openssl-legacy-provider react-scripts start"
}
```

#### Socket.io no conecta

```javascript
// Verificar CORS en backend
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Verificar URL en frontend
const socket = io(process.env.REACT_APP_BACKEND_URL);
```

### Debug Tips

#### Backend Debug

```bash
# Activar logs de Sequelize
DB_DEBUG=true npm run dev:server

# Debug con VS Code
# Añadir a launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/server.ts",
  "preLaunchTask": "tsc: build",
  "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
}
```

#### Frontend Debug

```javascript
// React Developer Tools
// Instalar extensión de Chrome/Firefox

// Redux DevTools (si usas Redux)
const store = createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);
```

#### Network Debug

```bash
# Monitor de red
chrome://net-internals/#events

# WebSocket frames
Chrome DevTools → Network → WS → Messages
```

---

## ✅ MEJORES PRÁCTICAS

### Código Limpio

1. **Single Responsibility**: Cada función/clase hace una cosa
2. **DRY (Don't Repeat Yourself)**: Reutilizar código común
3. **KISS (Keep It Simple)**: Soluciones simples sobre complejas
4. **YAGNI (You Aren't Gonna Need It)**: No añadir funcionalidad innecesaria

### Seguridad

1. **Nunca commitear secrets**
   ```bash
   # .gitignore
   .env
   *.key
   *.pem
   ```

2. **Validar entrada de usuario**
   ```typescript
   const schema = Yup.object().shape({
     email: Yup.string().email().required(),
     password: Yup.string().min(8).required()
   });
   ```

3. **Sanitizar output**
   ```javascript
   import DOMPurify from "isomorphic-dompurify";
   const clean = DOMPurify.sanitize(dirty);
   ```

4. **Usar HTTPS siempre**
5. **Rate limiting en APIs**
6. **SQL injection prevention** - Usar ORM o prepared statements

### Performance

1. **Lazy loading** en frontend
2. **Paginación** en listas grandes
3. **Índices** en base de datos
4. **Caché** con Redis
5. **Compresión** de respuestas
6. **CDN** para assets estáticos

### Git Workflow

1. **Commits atómicos** - Un commit = un cambio lógico
2. **Mensajes descriptivos**
   ```
   feat(tickets): add bulk delete functionality
   
   - Added checkbox selection
   - Added bulk delete endpoint
   - Added confirmation dialog
   
   Closes #123
   ```

3. **Branch naming**
   ```
   feature/add-payment-gateway
   bugfix/fix-message-duplication
   hotfix/critical-security-patch
   release/v2.0.0
   ```

4. **Pull Request template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Manual testing done
   
   ## Screenshots (if applicable)
   ```

### Code Review Checklist

- [ ] Código sigue convenciones del proyecto
- [ ] Tests están presentes y pasan
- [ ] No hay console.logs olvidados
- [ ] No hay código comentado
- [ ] Documentación actualizada si necesario
- [ ] No hay secrets expuestos
- [ ] Performance considerada
- [ ] Manejo de errores apropiado

### Monitoreo en Producción

1. **Logs estructurados**
   ```typescript
   logger.info("User action", {
     userId: user.id,
     action: "create_ticket",
     ticketId: ticket.id,
     timestamp: new Date()
   });
   ```

2. **Métricas clave**
   - Response time
   - Error rate
   - Throughput
   - CPU/Memory usage

3. **Alertas configuradas**
   - Error rate > 1%
   - Response time > 3s
   - Disk space < 10%
   - Service down

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial

- **Sequelize v5**: https://sequelize.org/v5/
- **Socket.io**: https://socket.io/docs/v4/
- **Baileys**: https://github.com/WhiskeySockets/Baileys
- **Bull Queue**: https://github.com/OptimalBits/bull
- **Material-UI v4**: https://v4.mui.com/
- **React Router v5**: https://v5.reactrouter.com/

### Herramientas Útiles

- **Postman**: Testing de APIs
- **TablePlus**: GUI para PostgreSQL
- **Redis Commander**: GUI para Redis
- **ngrok**: Túnel local para webhooks
- **Swagger**: Documentación de API

### Scripts Útiles

```bash
# Backup completo del sistema
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p backups/$DATE

# Backup database
pg_dump -h localhost -U tucanlink -d tucanlink > backups/$DATE/database.sql

# Backup files
tar -czf backups/$DATE/files.tar.gz public/

# Backup environment
cp .env backups/$DATE/

echo "Backup completed: backups/$DATE"
```

```bash
# Health check
#!/bin/bash
# Check backend
curl -f http://localhost:8080/health || echo "Backend is down"

# Check frontend
curl -f http://localhost:3000 || echo "Frontend is down"

# Check Redis
redis-cli ping || echo "Redis is down"

# Check PostgreSQL
pg_isready -h localhost -p 5432 || echo "PostgreSQL is down"
```

---

## 🤝 CONTRIBUIR AL PROYECTO

### Proceso de Contribución

1. Fork el repositorio
2. Crear feature branch
3. Hacer commits con mensajes descriptivos
4. Escribir/actualizar tests
5. Actualizar documentación
6. Crear Pull Request

### Estándares de Calidad

- Cobertura de tests > 80%
- Sin warnings de linter
- Documentación actualizada
- Código revisado por pares

### Contacto

- **Desarrollador**: Johan Bermudez
- **Email**: soporte@tucanlink.com
- **GitHub**: https://github.com/JohanBermudez/tucanlink-crm-complete

---

*Última actualización: Agosto 2025*
*Versión: 6.0.0*
*Para desarrollo de TucanLink CRM*