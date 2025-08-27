#!/bin/bash

# Script para iniciar TucanLink en modo desarrollo
echo "🚀 INICIANDO TUCANLINK EN MODO DESARROLLO"
echo "=========================================="

# Verificar Docker
echo ""
echo "1. Verificando servicios Docker..."
if docker ps | grep -q tucanlink-postgres && docker ps | grep -q tucanlink-redis; then
    echo "✅ PostgreSQL y Redis están corriendo"
else
    echo "⚠️  Iniciando contenedores Docker..."
    docker start tucanlink-postgres tucanlink-redis 2>/dev/null || {
        echo "❌ Error: Los contenedores no existen. Ejecuta primero:"
        echo "docker run --name tucanlink-postgres -e POSTGRES_PASSWORD=tucanlink2024 -e POSTGRES_USER=tucanlink -e POSTGRES_DB=tucanlink -p 5432:5432 -d postgres:14"
        echo "docker run --name tucanlink-redis -p 6379:6379 -d redis redis-server --requirepass tucanlink2024"
        exit 1
    }
    sleep 3
    echo "✅ Contenedores iniciados"
fi

# Verificar entorno
echo ""
echo "2. Verificando configuración..."
if grep -q "DB_HOST=localhost" backend/.env; then
    echo "✅ Usando base de datos LOCAL"
else
    echo "⚠️  Configurando para desarrollo local..."
    ./switch_environment.sh local
fi

# Función para matar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    pkill -f "npm run dev:server"
    pkill -f "react-scripts start"
    exit 0
}

trap cleanup INT TERM

# Iniciar Backend
echo ""
echo "3. Iniciando Backend..."
cd backend
npm run dev:server &
BACKEND_PID=$!

# Esperar a que el backend esté listo
echo "   Esperando que el backend esté listo..."
sleep 5

# Iniciar Frontend
echo ""
echo "4. Iniciando Frontend..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "✅ TUCANLINK ESTÁ CORRIENDO"
echo "=========================================="
echo ""
echo "📌 URLs de acceso:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8080"
echo ""
echo "🔐 Credenciales:"
echo "   Email: admin@admin.com"
echo "   Contraseña: admin"
echo ""
echo "📝 Para detener: Presiona Ctrl+C"
echo "=========================================="

# Mantener el script corriendo
wait $BACKEND_PID $FRONTEND_PID