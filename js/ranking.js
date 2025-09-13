import { supabase } from './supabaseClient.js';

let rankingChannel;

/**
 * Renderiza la lista de puntajes en el contenedor especificado.
 * @param {HTMLElement} container - El elemento del DOM donde se renderizará el ranking.
 * @param {Array} scores - Un array de objetos de puntaje, cada uno con `best_score` y un objeto `perfiles` anidado.
 */
function renderRanking(container, scores) {
    if (!scores || scores.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 10px;">Aún no hay puntajes. ¡Sé el primero!</p>';
        return;
    }

    const rankingHTML = scores.map((score, index) => `
        <div class="ranking-item">
            <span class="ranking-position">${index + 1}</span>
            <img src="${score.perfiles?.avatar_url || 'assets/image/anonimo/anonimo.png'}" alt="Avatar" class="ranking-avatar">
            <span class="ranking-name">${score.perfiles?.username || 'Anónimo'}</span>
            <span class="ranking-score">${score.best_score} 🎖️</span>
        </div>
    `).join('');

    container.innerHTML = `<div class="ranking-list">${rankingHTML}</div>`;
}

/**
 * Busca y muestra los 10 mejores puntajes desde Supabase, uniendo los datos manualmente.
 * @param {HTMLElement} container - El elemento del DOM para el ranking.
 */
async function fetchRanking(container) {
    // Paso 1: Obtener los puntajes
    const { data: scores, error: scoresError } = await supabase
        .from('puntuaciones')
        .select('best_score, user_id')
        .order('best_score', { ascending: false })
        .limit(10);

    if (scoresError) {
        console.error('Error fetching scores:', scoresError);
        container.innerHTML = '<p>No se pudo cargar el ranking.</p>';
        return;
    }

    if (scores.length === 0) {
        renderRanking(container, []);
        return;
    }

    // Paso 2: Obtener los perfiles de los usuarios de esos puntajes
    const userIds = scores.map(score => score.user_id);
    const { data: profiles, error: profilesError } = await supabase
        .from('perfiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles for ranking:', profilesError);
        // Aún podemos mostrar los puntajes sin nombres
        const combinedData = scores.map(score => ({ ...score, perfiles: null }));
        renderRanking(container, combinedData);
        return;
    }

    // Paso 3: Unir los datos en el cliente
    const profilesById = Object.fromEntries(profiles.map(p => [p.id, p]));
    const combinedData = scores.map(score => ({
        ...score,
        perfiles: profilesById[score.user_id]
    }));

    renderRanking(container, combinedData);
}

/**
 * Callback para la suscripción en tiempo real. Vuelve a cargar el ranking cuando hay cambios.
 * @param {object} payload - El payload del evento de Supabase.
 * @param {HTMLElement} container - El contenedor del ranking a actualizar.
 */
function handleRealtimeUpdate(payload, container) {
    console.log('Realtime ranking update received:', payload);
    fetchRanking(container);
}

/**
 * Inicializa el ranking: hace la carga inicial y se suscribe a los cambios en tiempo real.
 * @param {HTMLElement} container - El elemento del DOM donde se mostrará el ranking.
 */
export function initRanking(container) {
    fetchRanking(container);

    if (rankingChannel) {
        supabase.removeChannel(rankingChannel);
    }

    rankingChannel = supabase
        .channel('public:puntuaciones')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'puntuaciones' }, 
            (payload) => handleRealtimeUpdate(payload, container)
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Conectado al canal de ranking en tiempo real.');
            } else if (err) {
                console.error('Error en la suscripción al ranking:', err);
            }
        });
}