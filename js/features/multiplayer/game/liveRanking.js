/**
 * @file liveRanking.js
 * @description Ranking en vivo durante partida multiplayer
 * Muestra los jugadores ordenados por puntuación en tiempo real
 */

// Referencias DOM
let rankingContainer = null;

/**
 * Inicializar ranking en vivo
 */
export function initLiveRanking() {
    rankingContainer = document.getElementById('live-ranking-container');
    console.log('🏆 Ranking en vivo inicializado');
}

/**
 * Actualizar ranking con estado actual de jugadores
 * @param {Object} players - Objeto con datos de jugadores
 */
export function updateLiveRanking(players) {
    if (!rankingContainer) return;

    const sortedPlayers = Object.values(players)
        .sort((a, b) => b.score - a.score);

    renderLiveRanking(sortedPlayers);
}

/**
 * Renderizar ranking en vivo
 * @param {Array} players - Array de jugadores ordenados por score
 */
export function renderLiveRanking(players) {
    if (!rankingContainer) return;

    const rankingHTML = players.map((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        const statusIcon = player.isAlive ? '' : ' ☠️';

        return `
            <div class="live-ranking-item ${player.isAlive ? '' : 'eliminated'}">
                <span class="ranking-position">${medal}</span>
                <span class="ranking-name" style="color: ${player.color}">${player.name.slice(0, 10)}</span>
                <span class="ranking-score">${player.score}${statusIcon}</span>
            </div>
        `;
    }).join('');

    rankingContainer.innerHTML = `
        <div class="live-ranking-header">🏆 Ranking</div>
        <div class="live-ranking-list">${rankingHTML}</div>
    `;
}

/**
 * Destruir ranking en vivo
 */
export function destroyLiveRanking() {
    if (rankingContainer) {
        rankingContainer.innerHTML = '';
    }
    rankingContainer = null;
    console.log('🏆 Ranking en vivo destruido');
}
