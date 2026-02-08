#!/bin/bash
# ============================================
# Snake Classic - Detener Servicios
# ============================================

echo "🛑 Deteniendo servicios de Snake Classic..."

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

npx supabase stop

echo "✅ Servicios detenidos"
