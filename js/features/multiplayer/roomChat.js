/**
 * @file roomChat.js
 * @description Chat efímero por sala usando Supabase Broadcast
 * Los mensajes NO se persisten en BD, solo se transmiten en tiempo real
 */

import { broadcastEvent, onRoomEvents } from '../rooms.js';
import { supabase } from '../../../lib/supabaseClient.js';

// Estado del chat
let chatState = {
    messages: [],
    localPlayerName: '',
    localPlayerId: '',
    isInitialized: false
};

// Referencias DOM
let chatContainer = null;
let chatInput = null;
let chatForm = null;

/**
 * Inicializar chat de sala
 * @param {string} playerName - Nombre del jugador local
 */
export async function initRoomChat(playerName) {
    const { data: { user } } = await supabase.auth.getUser();

    chatState.localPlayerId = user?.id || '';
    chatState.localPlayerName = playerName || 'Anónimo';
    chatState.messages = [];
    chatState.isInitialized = true;

    // Buscar elementos DOM
    chatContainer = document.getElementById('room-chat-messages');
    chatInput = document.getElementById('room-chat-input');
    chatForm = document.getElementById('room-chat-form');

    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }

    // Registrar callback para recibir mensajes
    onRoomEvents({
        onRoomChat: handleIncomingMessage
    });

    console.log('💬 Chat de sala inicializado');
}

/**
 * Manejar envío de mensaje
 */
async function handleChatSubmit(e) {
    e.preventDefault();

    if (!chatInput || !chatState.isInitialized) return;

    const content = chatInput.value.trim();
    if (!content) return;

    // Enviar mensaje via broadcast
    await sendRoomMessage(content);

    // Limpiar input
    chatInput.value = '';
}

/**
 * Enviar mensaje al chat de sala
 * @param {string} content - Contenido del mensaje
 */
export async function sendRoomMessage(content) {
    if (!content || !chatState.isInitialized) return;

    const message = {
        id: Date.now(),
        content,
        author: chatState.localPlayerName,
        authorId: chatState.localPlayerId,
        timestamp: new Date().toISOString()
    };

    // Broadcast a todos los jugadores
    await broadcastEvent('room_chat', message);
}

/**
 * Manejar mensaje entrante
 */
function handleIncomingMessage(payload) {
    if (!payload || !chatState.isInitialized) return;

    const message = {
        id: payload.id || Date.now(),
        content: payload.content,
        author: payload.author,
        authorId: payload.authorId,
        timestamp: payload.timestamp,
        isOwn: payload.authorId === chatState.localPlayerId
    };

    chatState.messages.push(message);

    // Limitar a últimos 50 mensajes
    if (chatState.messages.length > 50) {
        chatState.messages.shift();
    }

    renderMessage(message);
}

/**
 * Renderizar un mensaje en el chat
 */
function renderMessage(message) {
    if (!chatContainer) return;

    const msgEl = document.createElement('div');
    msgEl.className = `room-chat-message ${message.isOwn ? 'own-message' : ''}`;

    msgEl.innerHTML = `
        <span class="chat-author">${message.author}:</span>
        <span class="chat-content">${escapeHtml(message.content)}</span>
    `;

    chatContainer.appendChild(msgEl);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/**
 * Escapar HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Destruir chat de sala
 */
export function destroyRoomChat() {
    chatState.messages = [];
    chatState.isInitialized = false;

    if (chatForm) {
        chatForm.removeEventListener('submit', handleChatSubmit);
    }

    if (chatContainer) {
        chatContainer.innerHTML = '';
    }

    chatContainer = null;
    chatInput = null;
    chatForm = null;

    console.log('💬 Chat de sala destruido');
}

/**
 * Obtener mensajes actuales (para debugging)
 */
export function getChatMessages() {
    return [...chatState.messages];
}
