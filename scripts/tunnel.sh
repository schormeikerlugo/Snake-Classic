#!/bin/bash
# ============================================
# Snake Classic - Tunnel para Acceso Externo
# ============================================
# Crea 2 tunnels:
#   1. Juego (puerto 5500) → URL pública para jugar
#   2. Supabase API (puerto 54331) → URL pública para la DB
#
# La URL del tunnel de Supabase debe configurarse en el navegador:
#   localStorage.setItem('SNAKE_TUNNEL_SUPABASE_URL', 'https://...')

echo "🌐 Configurando acceso externo para Snake Classic..."
echo ""

# Verificar si cloudflared o ngrok están disponibles
if command -v cloudflared &> /dev/null; then
    echo "📡 Usando Cloudflare Tunnel (cloudflared)..."
    echo ""

    # Crear archivos temporales para capturar las URLs
    GAME_LOG=$(mktemp)
    API_LOG=$(mktemp)

    # Tunnel para el juego
    echo "🎮 Iniciando tunnel para el juego (puerto 5500)..."
    cloudflared tunnel --url http://localhost:5500 2>"$GAME_LOG" &
    GAME_PID=$!

    # Tunnel para Supabase API
    echo "🗄️  Iniciando tunnel para Supabase API (puerto 54331)..."
    cloudflared tunnel --url http://localhost:54331 2>"$API_LOG" &
    API_PID=$!

    # Esperar a que los tunnels generen sus URLs
    echo "⏳ Esperando URLs públicas..."
    sleep 8

    # Extraer URLs
    GAME_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$GAME_LOG" | head -1)
    API_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$API_LOG" | head -1)

    echo ""
    echo "════════════════════════════════════════════"
    echo "  ✅ Tunnels Activos"
    echo "════════════════════════════════════════════"
    echo ""
    echo "  🎮 Juego:    ${GAME_URL:-'(esperando...)'}"
    echo "  🗄️  API:     ${API_URL:-'(esperando...)'}"
    echo ""
    echo "════════════════════════════════════════════"

    if [ -n "$API_URL" ]; then
        echo ""
        echo "📋 Ejecuta esto en la consola del navegador del juego:"
        echo ""
        echo "   localStorage.setItem('SNAKE_TUNNEL_SUPABASE_URL', '${API_URL}')"
        echo ""
        echo "   Luego recarga la página."
    fi

    echo ""
    echo "💡 Comparte la URL del juego con otros jugadores."
    echo "   Ctrl+C para detener los tunnels."
    echo ""

    # Cleanup al salir
    trap "kill $GAME_PID $API_PID 2>/dev/null; rm -f $GAME_LOG $API_LOG" EXIT

    wait

elif command -v ngrok &> /dev/null; then
    echo "📡 Usando ngrok..."
    echo ""
    echo "🎮 Iniciando tunnel para el juego en puerto 5500..."
    ngrok http 5500 --log=stdout &

    echo ""
    echo "⚠️  Para Supabase, abre otra terminal y ejecuta:"
    echo "   ngrok http 54331"
    echo ""
    echo "📋 Luego en la consola del navegador:"
    echo "   localStorage.setItem('SNAKE_TUNNEL_SUPABASE_URL', 'https://TU-URL-NGROK.ngrok-free.app')"

    wait

else
    echo "❌ No se encontró cloudflared ni ngrok."
    echo ""
    echo "📥 Opciones de instalación:"
    echo ""
    echo "1. Cloudflare Tunnel (recomendado, gratis):"
    echo "   sudo pacman -S cloudflared"
    echo ""
    echo "2. ngrok (fácil pero con límites):"
    echo "   sudo pacman -S ngrok"
    echo ""
    echo "💡 Después de instalar, ejecuta este script de nuevo."
fi
