#!/bin/bash
# ============================================
# Snake Classic - Tunnel para Acceso Externo
# ============================================

echo "🌐 Configurando acceso externo para Snake Classic..."
echo ""

# Verificar si npx/cloudflared/ngrok están disponibles
if command -v cloudflared &> /dev/null; then
    echo "📡 Usando Cloudflare Tunnel (cloudflared)..."
    echo ""
    echo "🎮 Tunnel para el juego (puerto 5500):"
    cloudflared tunnel --url http://localhost:5500 &
    
    echo ""
    echo "🗄️ Tunnel para Supabase API (puerto 54331):"
    cloudflared tunnel --url http://localhost:54331 &
    
    echo ""
    echo "⏳ Espera a que aparezcan las URLs públicas arriba..."
    echo ""
    echo "⚠️ IMPORTANTE: Para que funcione Supabase desde afuera,"
    echo "   debes actualizar SUPABASE_URL en supabaseClient.js"
    echo "   con la URL pública del tunnel de API."
    
    wait
    
elif command -v ngrok &> /dev/null; then
    echo "📡 Usando ngrok..."
    echo ""
    echo "Iniciando tunnel para el juego en puerto 5500..."
    ngrok http 5500 --log=stdout &
    
    echo ""
    echo "⚠️ Para exponer Supabase también, abre otra terminal y ejecuta:"
    echo "   ngrok http 54331"
    
    wait
    
else
    echo "❌ No se encontró cloudflared ni ngrok."
    echo ""
    echo "📥 Opciones de instalación:"
    echo ""
    echo "1. Cloudflare Tunnel (recomendado, gratis):"
    echo "   sudo pacman -S cloudflared"
    echo "   # o"
    echo "   yay -S cloudflared"
    echo ""
    echo "2. ngrok (fácil pero con límites):"
    echo "   sudo pacman -S ngrok"
    echo "   # o"
    echo "   yay -S ngrok"
    echo ""
    echo "💡 Después de instalar, ejecuta este script de nuevo."
fi
