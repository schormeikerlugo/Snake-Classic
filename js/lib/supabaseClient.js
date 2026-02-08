import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Detectar si estamos en desarrollo local
// Soporta: localhost, 127.0.0.1, cualquier puerto local (5500, 5181, etc.)
const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// URLs de Supabase (Puerto 54331 para Snake Classic local)
const SUPABASE_URL = isDev
    ? 'http://127.0.0.1:54331'  // Supabase local Snake Classic
    : 'https://wjkougtqduxjqwhwxbyv.supabase.co';  // Producción

const SUPABASE_ANON_KEY = isDev
    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' // Key local
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqa291Z3RxZHV4anF3aHd4Ynl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNDMwOTMsImV4cCI6MjA3MjYxOTA5M30.hudENbd93YwmsHeZJhDGoBuPI9WZAlkB1BZli5InpVo'; // Key producción

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Información del entorno (para debugging)
console.log(`🐍 Snake Classic - Supabase ${isDev ? 'LOCAL' : 'PRODUCCIÓN'}`);

