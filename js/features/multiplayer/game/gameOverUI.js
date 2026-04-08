/**
 * @file gameOverUI.js
 * @description Overlay HTML para Game Over y Revancha.
 * Reemplaza los overlays pintados en canvas.
 */

import gameState from './gameState.js';

let overlayEl = null;
let callbacks = {};

/**
 * Mostrar pantalla de Game Over con botones reales
 */
export function showGameOver(winner, { onRematch, onExit }) {
    hideGameOver();
    callbacks = { onRematch, onExit };

    // Registrar victoria
    if (winner) {
        gameState.victoryCount[winner.id] = (gameState.victoryCount[winner.id] || 0) + 1;
        gameState.matchHistory.push({
            round: gameState.currentRound,
            winnerId: winner.id,
            winnerName: winner.name,
            score: winner.score,
            mode: gameState.gameMode,
            timestamp: Date.now()
        });
    }

    overlayEl = document.createElement('div');
    overlayEl.id = 'mp-game-over';
    overlayEl.className = 'mp-game-over';

    const rankingHTML = buildRankingHTML();

    overlayEl.innerHTML = `
        <div class="mp-go__content">
            <h2 class="mp-go__title">GAME OVER</h2>
            <p class="mp-go__winner" style="color:${winner?.color || '#fff'}">
                ${winner ? `¡${winner.name} GANA!` : '¡EMPATE!'}
            </p>
            ${winner ? `<p class="mp-go__score">Puntuación: ${winner.score}</p>` : ''}
            ${rankingHTML}
            <div class="mp-go__actions">
                <button class="mp-go__btn mp-go__btn--rematch">🔄 Revancha</button>
                <button class="mp-go__btn mp-go__btn--exit">🚪 Salir</button>
            </div>
        </div>
    `;

    // Wiring botones
    overlayEl.querySelector('.mp-go__btn--rematch').addEventListener('click', () => {
        callbacks.onRematch?.();
    });
    overlayEl.querySelector('.mp-go__btn--exit').addEventListener('click', () => {
        callbacks.onExit?.();
    });

    // Insertar en .board (sobre el canvas)
    const board = document.querySelector('.board');
    if (board) {
        board.appendChild(overlayEl);
    }
}

/**
 * Transformar el overlay a estado de espera de revancha
 */
export function showRematchWaiting() {
    if (!overlayEl) return;

    const content = overlayEl.querySelector('.mp-go__content');
    if (!content) return;

    const acceptedCount = Object.keys(gameState.rematchAccepted).length;
    const totalPlayers = Object.keys(gameState.players).length;

    const playersHTML = Object.entries(gameState.players).map(([id, player]) => {
        const accepted = gameState.rematchAccepted[id];
        return `<div class="mp-go__rematch-player" style="color:${player.color}">
            ${accepted ? '✅' : '⏳'} ${player.name}
        </div>`;
    }).join('');

    content.innerHTML = `
        <h2 class="mp-go__title" style="color:#00FFFF">¡REVANCHA!</h2>
        <p class="mp-go__waiting">Jugadores listos: ${acceptedCount}/${totalPlayers}</p>
        <div class="mp-go__rematch-list">${playersHTML}</div>
        <div class="mp-go__actions">
            <button class="mp-go__btn mp-go__btn--rematch">✅ Aceptar</button>
            <button class="mp-go__btn mp-go__btn--exit">🚪 Salir</button>
        </div>
    `;

    content.querySelector('.mp-go__btn--rematch').addEventListener('click', () => {
        callbacks.onRematch?.();
    });
    content.querySelector('.mp-go__btn--exit').addEventListener('click', () => {
        callbacks.onExit?.();
    });
}

/**
 * Actualizar estado de rematch (quién aceptó)
 */
export function updateRematchStatus() {
    if (!overlayEl) return;

    const waitingEl = overlayEl.querySelector('.mp-go__waiting');
    if (waitingEl) {
        const acceptedCount = Object.keys(gameState.rematchAccepted).length;
        const totalPlayers = Object.keys(gameState.players).length;
        waitingEl.textContent = `Jugadores listos: ${acceptedCount}/${totalPlayers}`;
    }

    const listEl = overlayEl.querySelector('.mp-go__rematch-list');
    if (listEl) {
        listEl.innerHTML = Object.entries(gameState.players).map(([id, player]) => {
            const accepted = gameState.rematchAccepted[id];
            return `<div class="mp-go__rematch-player" style="color:${player.color}">
                ${accepted ? '✅' : '⏳'} ${player.name}
            </div>`;
        }).join('');
    }
}

/**
 * Ocultar y destruir overlay
 */
export function hideGameOver() {
    if (overlayEl) {
        overlayEl.remove();
        overlayEl = null;
    }
    callbacks = {};
}

/**
 * Construir HTML del ranking de victorias
 */
function buildRankingHTML() {
    if (gameState.matchHistory.length === 0) return '';

    const sorted = Object.entries(gameState.victoryCount)
        .sort(([, a], [, b]) => b - a);

    const items = sorted.map(([playerId, wins], index) => {
        const player = gameState.players[playerId];
        if (!player) return '';
        const medal = index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉';
        return `<span style="color:${player.color}">${medal} ${player.name}: ${'⭐'.repeat(Math.min(wins, 5))}${wins > 5 ? `×${wins}` : ''}</span>`;
    }).join('');

    return `
        <div class="mp-go__ranking">
            <div class="mp-go__ranking-title">Ronda ${gameState.currentRound}</div>
            ${items}
        </div>
    `;
}
