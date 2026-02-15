#!/bin/bash
# ============================================
# Snake Classic - Script de Inicio de Servicios
# ============================================

echo "🐍 Iniciando Snake Classic..."
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directorio del proyecto (Raíz)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Verificar Docker
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker no está corriendo. Por favor inicia Docker primero.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker está corriendo${NC}"

# Verificar si Supabase ya está corriendo
if npx supabase status > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Supabase ya está corriendo${NC}"
else
    echo -e "${CYAN}🚀 Iniciando Supabase...${NC}"
    npx supabase start
fi

# Iniciar Servidor Web
echo -e "${CYAN}🌐 Iniciando Servidor Web...${NC}"
if [ -f .server.pid ]; then
    kill $(cat .server.pid) 2>/dev/null
    rm .server.pid
fi

# Usar el binario local instalado en node_modules
./node_modules/.bin/http-server -p 5500 -c-1 -s &
SERVER_PID=$!
echo $SERVER_PID > .server.pid

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Snake Classic - Servicios Activos${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}🎮 Juego:${NC}      http://127.0.0.1:5500"
echo -e "  ${CYAN}🗄️ Studio:${NC}     http://127.0.0.1:3002"
echo -e "  ${CYAN}🔌 API:${NC}        http://127.0.0.1:54331"
echo -e "  ${CYAN}📧 Email:${NC}      http://127.0.0.1:54324"
echo ""
echo -e "${YELLOW}💡 Tip: Para acceso externo, usa: npm run tunnel${NC}"
echo ""
