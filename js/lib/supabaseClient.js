import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ============================================
// Detección de entorno
// ============================================
const hostname = window.location.hostname;

const ENV = (() => {
    // Tunnel: acceso desde internet vía Cloudflare/ngrok
    if (hostname.includes('trycloudflare.com') || hostname.includes('ngrok-free.app')) {
        return 'tunnel';
    }
    // Local: localhost, 127.0.0.1, IPs de red local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
        return 'local';
    }
    // Producción: cualquier otro dominio
    return 'production';
})();

// ============================================
// Configuración por entorno
// ============================================

// Producción (Supabase Cloud)
const PROD_SUPABASE_URL = 'https://wjkougtqduxjqwhwxbyv.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa291Z3RxZHV4anF3aHd4Ynl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDMwOTMsImV4cCI6MjA3MjYxOTA5M30.hudENbd93YwmsHeZJhDGoBuPI9WZAlkB1BZli5InpVo';

// Local (Supabase self-hosted via Docker, puerto 54331)
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Tunnel: la URL de Supabase se lee de localStorage (inyectada por tunnel.sh o manualmente).
// Esto evita hardcodear URLs que cambian en cada sesión de cloudflared.
const TUNNEL_SUPABASE_URL_KEY = 'SNAKE_TUNNEL_SUPABASE_URL';

function getConfig() {
    switch (ENV) {
        case 'production':
            return { url: PROD_SUPABASE_URL, key: PROD_ANON_KEY };

        case 'tunnel': {
            const tunnelUrl = localStorage.getItem(TUNNEL_SUPABASE_URL_KEY);
            if (!tunnelUrl) {
                console.warn(
                    '⚠️ TUNNEL: No se encontró URL de Supabase en localStorage.\n' +
                    `   Ejecuta en la consola del navegador:\n` +
                    `   localStorage.setItem('${TUNNEL_SUPABASE_URL_KEY}', 'https://TU-TUNNEL-SUPABASE.trycloudflare.com')\n` +
                    '   y recarga la página.'
                );
            }
            return {
                url: tunnelUrl || `http://${hostname}:54331`,
                key: LOCAL_ANON_KEY
            };
        }

        case 'local':
        default:
            // Usa el hostname actual (funciona con 127.0.0.1 y 192.168.x.x)
            return { url: `http://${hostname}:54331`, key: LOCAL_ANON_KEY };
    }
}

const config = getConfig();
export const supabase = createClient(config.url, config.key);

// URL base de Supabase para resolución de storage URLs
const SUPABASE_BASE_URL = config.url;

// ============================================
// Resolución de URLs de Storage
// ============================================

/**
 * Normalizar una URL de Supabase Storage para el entorno actual.
 *
 * Problema: Las URLs de storage se guardan en la DB con el hostname del
 * dispositivo que las creó (ej: http://127.0.0.1:54331/storage/...).
 * Otro dispositivo en la red no puede acceder a esa URL.
 *
 * Solución: Extraer el path relativo de storage y reconstruir la URL
 * con la base URL del entorno actual.
 *
 * @param {string|null} url - URL de Supabase Storage guardada en DB
 * @param {string} fallback - Imagen por defecto si url es null
 * @returns {string} URL accesible desde el dispositivo actual
 */
export function resolveStorageUrl(url, fallback = 'assets/image/anonimo/anonimo.png') {
    if (!url) return fallback;

    // En producción con Supabase Cloud, las URLs son estables
    if (ENV === 'production' && url.includes('supabase.co')) return url;

    try {
        const parsed = new URL(url);

        // Extraer el path de storage (ej: /storage/v1/object/public/avatars/xxx/avatar.jpeg)
        const storagePath = parsed.pathname;
        if (storagePath.includes('/storage/')) {
            return `${SUPABASE_BASE_URL}${storagePath}`;
        }
    } catch (e) {
        // URL malformada, devolver fallback
    }

    return url || fallback;
}

// ============================================
// Debug info
// ============================================
console.log(`🐍 Snake Classic [${ENV.toUpperCase()}] → ${config.url}`);
