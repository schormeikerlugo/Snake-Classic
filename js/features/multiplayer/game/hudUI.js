/**
 * @file hudUI.js
 * @description HUD HTML para el multiplayer. Reemplaza el HUD pintado en canvas.
 */

import gameState from './gameState.js';

let hudEl = null;
let refs = {};        // Referencias a elementos DOM del HUD
let lastValues = {};  // Dirty-checking para evitar DOM updates innecesarios

/**
 * Crear e inyectar el HUD en el DOM
 */
export function createHUD() {
    destroyHUD();

    const players = Object.values(gameState.players);
    const left = players[0];
    const right = players[1];

    hudEl = document.createElement('div');
    hudEl.id = 'mp-hud';
    hudEl.className = 'mp-hud';

    hudEl.innerHTML = `
        <div class="mp-hud__player mp-hud__left">
            <span class="mp-hud__dot" style="background:${left?.color || '#00FFFF'}"></span>
            <span class="mp-hud__name">${left?.name?.slice(0, 10) || '???'}</span>
            <span class="mp-hud__score" data-side="left">0</span>
            <span class="mp-hud__stars" data-side="left"></span>
        </div>
        <div class="mp-hud__center">
            <span class="mp-hud__mode">${gameState.gameMode === 'puntos' ? '🍎 PUNTOS' : '⚔️ DUELO'}</span>
            <span class="mp-hud__round">R1</span>
            <span class="mp-hud__timer ${gameState.gameMode !== 'puntos' ? 'hidden' : ''}">2:00</span>
        </div>
        <div class="mp-hud__player mp-hud__right">
            <span class="mp-hud__stars" data-side="right"></span>
            <span class="mp-hud__score" data-side="right">0</span>
            <span class="mp-hud__name">${right?.name?.slice(0, 10) || '???'}</span>
            <span class="mp-hud__dot" style="background:${right?.color || '#FF00FF'}"></span>
        </div>
    `;

    // Ocultar HUD de single-player
    const spHud = document.querySelector('.hud');
    if (spHud) spHud.classList.add('hidden');

    // Inyectar antes del game-main-content
    const gameView = document.getElementById('game-view');
    const mainContent = gameView?.querySelector('.game-main-content');
    if (mainContent) {
        gameView.insertBefore(hudEl, mainContent);
    } else {
        gameView?.prepend(hudEl);
    }

    // Cachear referencias
    refs = {
        scoreLeft: hudEl.querySelector('[data-side="left"].mp-hud__score'),
        scoreRight: hudEl.querySelector('[data-side="right"].mp-hud__score'),
        starsLeft: hudEl.querySelector('[data-side="left"].mp-hud__stars'),
        starsRight: hudEl.querySelector('[data-side="right"].mp-hud__stars'),
        round: hudEl.querySelector('.mp-hud__round'),
        timer: hudEl.querySelector('.mp-hud__timer'),
    };

    lastValues = {};
}

/**
 * Actualizar HUD con dirty-checking (llamado cada frame)
 */
export function updateHUD() {
    if (!hudEl) return;

    const players = Object.values(gameState.players);
    const left = players[0];
    const right = players[1];

    // Scores
    updateIfChanged('scoreL', refs.scoreLeft, left?.score ?? 0);
    updateIfChanged('scoreR', refs.scoreRight, right?.score ?? 0);

    // Estrellas de victorias
    const starsL = getStars(left?.id);
    const starsR = getStars(right?.id);
    updateIfChanged('starsL', refs.starsLeft, starsL);
    updateIfChanged('starsR', refs.starsRight, starsR);

    // Ronda
    updateIfChanged('round', refs.round, `R${gameState.currentRound}`);

    // Timer (modo puntos)
    if (gameState.gameMode === 'puntos' && refs.timer) {
        const mins = Math.floor(gameState.timer / 60);
        const secs = gameState.timer % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        updateIfChanged('timer', refs.timer, timeStr);

        // Color rojo si quedan menos de 30 segundos
        const isUrgent = gameState.timer <= 30;
        if (lastValues.timerUrgent !== isUrgent) {
            refs.timer.classList.toggle('mp-hud__timer--urgent', isUrgent);
            lastValues.timerUrgent = isUrgent;
        }
    }

    // Estado vivo/muerto
    if (left) updateAliveState('left', left);
    if (right) updateAliveState('right', right);
}

function updateIfChanged(key, el, value) {
    if (!el || lastValues[key] === value) return;
    el.textContent = value;
    lastValues[key] = value;
}

function updateAliveState(side, player) {
    const key = `alive_${side}`;
    if (lastValues[key] === player.isAlive) return;
    const container = hudEl.querySelector(`.mp-hud__${side}`);
    container?.classList.toggle('mp-hud__player--dead', !player.isAlive);
    lastValues[key] = player.isAlive;
}

function getStars(playerId) {
    if (!playerId) return '';
    const wins = gameState.victoryCount[playerId] || 0;
    if (wins === 0) return '';
    if (wins <= 5) return '⭐'.repeat(wins);
    return `⭐×${wins}`;
}

/**
 * Destruir HUD y restaurar el de single-player
 */
export function destroyHUD() {
    if (hudEl) {
        hudEl.remove();
        hudEl = null;
    }
    refs = {};
    lastValues = {};

    // Restaurar HUD de single-player
    const spHud = document.querySelector('.hud');
    if (spHud) spHud.classList.remove('hidden');
}
