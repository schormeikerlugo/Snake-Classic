/**
 * @file multiplayerUI.js
 * @description UI para el modo multijugador (menú y lobby)
 */

import { supabase } from '../../lib/supabaseClient.js';
import * as roomsAPI from './rooms.js';
import { sfx } from '../../sound/sfx.js';

// Estado de la UI
let currentView = 'menu'; // 'menu', 'lobby', 'game'
let lobbyRefreshInterval = null;

// Referencias a elementos del DOM
const elements = {
  container: null,
  menuView: null,
  lobbyView: null
};

/**
 * Inicializar el módulo de UI multijugador
 */
export function initMultiplayerUI() {
  createUIElements();
  setupEventListeners();

  // Registrar callbacks de sala
  roomsAPI.onRoomEvents({
    onPlayerJoined: handlePlayerJoined,
    onPlayerLeft: handlePlayerLeft,
    onPlayerReady: handlePlayerReady,
    onGameStart: handleGameStart,
    onRoomClosed: handleRoomClosed
  });
}

/**
 * Crear elementos del DOM para la UI
 */
function createUIElements() {
  // Contenedor principal
  elements.container = document.createElement('div');
  elements.container.id = 'multiplayer-container';
  elements.container.className = 'multiplayer-container hidden';
  elements.container.innerHTML = `
    <!-- Menú Principal Multijugador -->
    <div id="mp-menu-view" class="mp-view">
      <div class="mp-modal">
        <h2 class="mp-title">🎮 MULTIJUGADOR</h2>
        
        <div class="mp-mode-selection">
          <button class="mp-btn mp-btn-primary" id="btn-create-duel">
            ⚔️ Crear Duelo 1v1
          </button>
          <button class="mp-btn mp-btn-primary" id="btn-create-points">
            🍎 Crear Competencia
          </button>
        </div>
        
        <div class="mp-divider">
          <span>o unirse con código</span>
        </div>
        
        <div class="mp-join-section">
          <input type="text" id="input-room-code" class="mp-input" 
                 placeholder="CÓDIGO" maxlength="6" 
                 style="text-transform: uppercase;">
          <button class="mp-btn mp-btn-secondary" id="btn-join-room">
            🔗 Unirse
          </button>
        </div>
        
        <div id="mp-error-message" class="mp-error hidden"></div>
        
        <button class="mp-btn mp-btn-close" id="btn-close-mp">
          ✕ Cerrar
        </button>
      </div>
    </div>
    
    <!-- Lobby -->
    <div id="mp-lobby-view" class="mp-view hidden">
      <div class="mp-modal mp-modal-lobby">
        <div class="mp-lobby-header">
          <h2 class="mp-title">SALA: <span id="lobby-room-code">------</span></h2>
          <span id="lobby-mode-badge" class="mp-mode-badge">DUELO</span>
        </div>
        
        <div class="mp-players-list" id="lobby-players">
          <!-- Players dinámicos -->
        </div>
        
        <div class="mp-lobby-actions">
          <div class="mp-share-section">
            <span>Compartir código:</span>
            <button class="mp-btn mp-btn-small" id="btn-copy-code">📋 Copiar</button>
          </div>
          
          <div class="mp-ready-section">
            <button class="mp-btn mp-btn-ready" id="btn-toggle-ready">
              ✅ Estoy Listo
            </button>
          </div>
          
          <button class="mp-btn mp-btn-start hidden" id="btn-start-game">
            🚀 INICIAR PARTIDA
          </button>
        </div>
        
        <div id="lobby-status" class="mp-lobby-status">
          Esperando jugadores...
        </div>
        
        <button class="mp-btn mp-btn-leave" id="btn-leave-room">
          🚪 Salir de la Sala
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(elements.container);

  // Guardar referencias
  elements.menuView = document.getElementById('mp-menu-view');
  elements.lobbyView = document.getElementById('mp-lobby-view');
}

/**
 * Configurar event listeners
 */
function setupEventListeners() {
  // Botones del menú
  document.getElementById('btn-create-duel')?.addEventListener('click', () => createRoom('duel'));
  document.getElementById('btn-create-points')?.addEventListener('click', () => createRoom('points'));
  document.getElementById('btn-join-room')?.addEventListener('click', handleJoinRoom);
  document.getElementById('btn-close-mp')?.addEventListener('click', hideMultiplayer);

  // Input del código - submit con Enter
  document.getElementById('input-room-code')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleJoinRoom();
  });

  // Botones del lobby
  document.getElementById('btn-copy-code')?.addEventListener('click', copyRoomCode);
  document.getElementById('btn-toggle-ready')?.addEventListener('click', toggleReady);
  document.getElementById('btn-start-game')?.addEventListener('click', startGame);
  document.getElementById('btn-leave-room')?.addEventListener('click', leaveRoom);
}

/**
 * Mostrar el menú multijugador
 */
export async function showMultiplayer() {
  // Verificar autenticación antes de mostrar
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert('Debes iniciar sesión para jugar en modo multijugador');
    return;
  }

  elements.container.classList.remove('hidden');
  showView('menu');
  sfx.play?.('modalOpen');
}

/**
 * Ocultar el menú multijugador
 */
export function hideMultiplayer() {
  elements.container.classList.add('hidden');
  sfx.play?.('modalClose');
  clearLobbyRefresh();
}

/**
 * Cambiar entre vistas
 */
function showView(view) {
  currentView = view;
  elements.menuView.classList.toggle('hidden', view !== 'menu');
  elements.lobbyView.classList.toggle('hidden', view !== 'lobby');

  if (view === 'lobby') {
    startLobbyRefresh();
  } else {
    clearLobbyRefresh();
  }
}

/**
 * Crear sala
 */
async function createRoom(mode) {
  showError('');
  const maxPlayers = mode === 'duel' ? 2 : 4;

  const { room, error } = await roomsAPI.createRoom(mode, maxPlayers);

  if (error) {
    showError(error);
    return;
  }

  showView('lobby');
  updateLobbyUI(room);
}

/**
 * Unirse a sala
 */
async function handleJoinRoom() {
  const codeInput = document.getElementById('input-room-code');
  const code = codeInput.value.trim().toUpperCase();

  if (code.length !== 6) {
    showError('El código debe tener 6 caracteres');
    return;
  }

  showError('');
  const { room, error } = await roomsAPI.joinRoom(code);

  if (error) {
    showError(error);
    return;
  }

  showView('lobby');
  updateLobbyUI(room);
}

/**
 * Salir de la sala
 */
async function leaveRoom() {
  await roomsAPI.leaveRoom();
  showView('menu');
}

/**
 * Toggle estado listo
 */
let isReady = false;
async function toggleReady() {
  isReady = !isReady;
  await roomsAPI.setReady(isReady);

  const btn = document.getElementById('btn-toggle-ready');
  btn.textContent = isReady ? '⏳ Cancelar' : '✅ Estoy Listo';
  btn.classList.toggle('ready', isReady);
}

/**
 * Iniciar partida (solo host)
 */
async function startGame() {
  const { error } = await roomsAPI.startGame();
  if (error) {
    showError(error);
  }
}

/**
 * Copiar código de sala
 */
async function copyRoomCode() {
  const room = roomsAPI.getCurrentRoom();
  if (!room) return;

  try {
    await navigator.clipboard.writeText(room.code);
    const btn = document.getElementById('btn-copy-code');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => btn.textContent = '📋 Copiar', 2000);
  } catch (err) {
    console.error('Error copiando:', err);
  }
}

/**
 * Actualizar UI del lobby
 */
async function updateLobbyUI(room = null) {
  if (!room) {
    room = await roomsAPI.getRoomInfo();
  }
  if (!room) return;

  // Código y modo
  document.getElementById('lobby-room-code').textContent = room.code;
  const modeBadge = document.getElementById('lobby-mode-badge');
  modeBadge.textContent = room.mode === 'duel' ? '⚔️ DUELO' : '🍎 PUNTOS';

  // Lista de jugadores
  const playersList = document.getElementById('lobby-players');
  const players = room.jugadores_sala || [];

  playersList.innerHTML = players.map((player, idx) => {
    const profile = player.perfiles || {};
    const isCurrentUser = player.user_id === supabase.auth.user?.id;

    return `
      <div class="mp-player-card ${player.is_ready ? 'ready' : ''}">
        <div class="mp-player-avatar" style="border-color: ${player.color}">
          <img src="${profile.avatar_url || 'assets/image/avatarDefault.webp'}" alt="Avatar">
        </div>
        <div class="mp-player-info">
          <span class="mp-player-name">${profile.username || 'Jugador ' + (idx + 1)}</span>
          <span class="mp-player-status">${player.is_ready ? '✅ Listo' : '⏳ Esperando'}</span>
        </div>
        ${player.user_id === room.host_id ? '<span class="mp-host-badge">👑 Host</span>' : ''}
      </div>
    `;
  }).join('');

  // Slots vacíos
  for (let i = players.length; i < room.max_players; i++) {
    playersList.innerHTML += `
      <div class="mp-player-card empty">
        <div class="mp-player-avatar empty">?</div>
        <div class="mp-player-info">
          <span class="mp-player-name">Esperando jugador...</span>
        </div>
      </div>
    `;
  }

  // Mostrar botón de inicio solo para el host
  const isHost = await roomsAPI.isHost();
  const startBtn = document.getElementById('btn-start-game');
  startBtn.classList.toggle('hidden', !isHost);

  // Estado del lobby
  const allReady = players.length >= 2 && players.every(p => p.is_ready || p.user_id === room.host_id);
  const statusEl = document.getElementById('lobby-status');

  if (players.length < 2) {
    statusEl.textContent = `Esperando jugadores... (${players.length}/${room.max_players})`;
  } else if (!allReady) {
    statusEl.textContent = 'Esperando que todos estén listos...';
  } else {
    statusEl.textContent = '¡Todos listos! El host puede iniciar.';
  }

  // Habilitar botón de inicio
  startBtn.disabled = !allReady;
}

/**
 * Iniciar refresh automático del lobby
 */
function startLobbyRefresh() {
  clearLobbyRefresh();
  lobbyRefreshInterval = setInterval(() => updateLobbyUI(), 3000);
}

/**
 * Detener refresh automático
 */
function clearLobbyRefresh() {
  if (lobbyRefreshInterval) {
    clearInterval(lobbyRefreshInterval);
    lobbyRefreshInterval = null;
  }
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
  const errorEl = document.getElementById('mp-error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.toggle('hidden', !message);
  }
}

// === Event Handlers ===

function handlePlayerJoined(payload) {
  updateLobbyUI();
  sfx.play?.('bonus');
}

function handlePlayerLeft(payload) {
  updateLobbyUI();
}

function handlePlayerReady(payload) {
  updateLobbyUI();
}

function handleGameStart(payload) {
  console.log('🎮 Iniciando partida...', payload);

  // Importar dinámicamente para evitar dependencia circular
  import('./game/gameView.js').then(({ startGameFromLobby }) => {
    startGameFromLobby();
  });
}

function handleRoomClosed() {
  showView('menu');
  showError('La sala fue cerrada por el host');
}
