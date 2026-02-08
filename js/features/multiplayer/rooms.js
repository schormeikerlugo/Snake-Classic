/**
 * @file rooms.js
 * @description Sistema de salas para modo multijugador
 * Módulo principal que exporta la API pública
 */

// Re-exportar funciones de los módulos internos
export {
    createRoom,
    joinRoom,
    leaveRoom
} from './roomActions.js';

export {
    setReady,
    startGame,
    getRoomInfo,
    isHost
} from './roomState.js';

export {
    onRoomEvents,
    broadcastEvent,
    sendMove,
    sendGameState
} from './roomSync.js';

export { getCurrentRoom } from './roomStore.js';
