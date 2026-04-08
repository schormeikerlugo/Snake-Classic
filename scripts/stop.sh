#!/bin/bash
# ============================================
# Snake Classic - Detener Servicios
# ============================================

echo "🛑 Deteniendo servicios de Snake Classic..."

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Detener Servidor Web
if [ -f .server.pid ]; then
    SERVER_PID=$(cat .server.pid)
    echo "🛑 Deteniendo servidor web (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null
    rm .server.pid
    echo "✅ Servidor web detenido"
else
    echo "ℹ El servidor web no parece estar corriendo (no pid file)"
fi

echo "🔻 Deteniendo Supabase..."
npx supabase stop

echo "✅ Todos los servicios detenidos exitosamente"