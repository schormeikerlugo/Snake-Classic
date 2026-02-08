/**
 * @file roomStore.js
 * @description Estado global de la sala actual
 */

// Estado actual de la sala
let currentRoom = null;
let currentChannel = null;
let roomSubscription = null;

// Colores disponibles para jugadores
export const PLAYER_COLORS = ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00'];

/**
 * Obtener la sala actual
 */
export function getCurrentRoom() {
    return currentRoom;
}

/**
 * Establecer la sala actual
 */
export function setCurrentRoom(room) {
    currentRoom = room;
}

/**
 * Obtener el canal actual
 */
export function getCurrentChannel() {
    return currentChannel;
}

/**
 * Establecer el canal actual
 */
export function setCurrentChannel(channel) {
    currentChannel = channel;
}

/**
 * Obtener la suscripción actual
 */
export function getRoomSubscription() {
    return roomSubscription;
}

/**
 * Establecer la suscripción actual
 */
export function setRoomSubscription(subscription) {
    roomSubscription = subscription;
}

/**
 * Limpiar todo el estado
 */
export function clearRoomState() {
    currentRoom = null;
    currentChannel = null;
    roomSubscription = null;
}
