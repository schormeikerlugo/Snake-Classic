/**
 * @file roomSync.js
 * @description Sincronización en tiempo real para salas
 */

import { supabase } from '../../lib/supabaseClient.js';
import {
    getCurrentRoom,
    getCurrentChannel,
    setCurrentChannel,
    getRoomSubscription,
    setRoomSubscription,
    setCurrentRoom
} from './roomStore.js';
import { getRoomInfo } from './roomState.js';

// Callbacks para eventos de sala
const roomCallbacks = {
    onPlayerJoined: null,
    onPlayerLeft: null,
    onPlayerReady: null,
    onGameStart: null,
    onGameState: null,
    onRoomClosed: null
};

/**
 * Registrar callbacks para eventos de sala
 */
export function onRoomEvents(callbacks) {
    Object.assign(roomCallbacks, callbacks);
}

/**
 * Suscribirse a eventos de la sala
 */
export async function subscribeToRoom(roomId) {
    // Limpiar suscripción anterior
    await unsubscribeFromRoom();

    // Canal de broadcast para comunicación en tiempo real
    // self: true para que el host también reciba los eventos que envía
    const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: true } }
    });

    // Escuchar eventos de broadcast
    channel
        .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
            console.log('👤 Jugador unido:', payload);
            roomCallbacks.onPlayerJoined?.(payload);
        })
        .on('broadcast', { event: 'player_left' }, ({ payload }) => {
            console.log('👤 Jugador salió:', payload);
            roomCallbacks.onPlayerLeft?.(payload);
        })
        .on('broadcast', { event: 'player_ready' }, ({ payload }) => {
            console.log('✅ Jugador listo:', payload);
            roomCallbacks.onPlayerReady?.(payload);
        })
        .on('broadcast', { event: 'game_start' }, ({ payload }) => {
            console.log('🎮 Juego iniciando:', payload);
            roomCallbacks.onGameStart?.(payload);
        })
        .on('broadcast', { event: 'game_state' }, ({ payload }) => {
            roomCallbacks.onGameState?.(payload);
        })
        .on('broadcast', { event: 'room_closed' }, () => {
            console.log('🚪 Sala cerrada');
            roomCallbacks.onRoomClosed?.();
            unsubscribeFromRoom();
            setCurrentRoom(null);
        });

    setCurrentChannel(channel);

    // Suscribirse a cambios en la tabla de la sala
    const subscription = supabase
        .channel(`room_db:${roomId}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'jugadores_sala', filter: `sala_id=eq.${roomId}` },
            (payload) => {
                console.log('DB cambio en jugadores:', payload);
                getRoomInfo(); // Refrescar info
            }
        )
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'salas', filter: `id=eq.${roomId}` },
            (payload) => {
                console.log('DB cambio en sala:', payload);
                const currentRoom = getCurrentRoom();
                if (payload.new && currentRoom) {
                    setCurrentRoom({ ...currentRoom, ...payload.new });
                }
            }
        );

    setRoomSubscription(subscription);

    await channel.subscribe();
    await subscription.subscribe();

    console.log('📡 Suscrito a sala:', roomId);
}

/**
 * Desuscribirse de la sala actual
 */
export async function unsubscribeFromRoom() {
    const channel = getCurrentChannel();
    const subscription = getRoomSubscription();

    if (channel) {
        await supabase.removeChannel(channel);
        setCurrentChannel(null);
    }
    if (subscription) {
        await supabase.removeChannel(subscription);
        setRoomSubscription(null);
    }
}

/**
 * Enviar evento broadcast a todos los jugadores
 */
export function broadcastEvent(event, data) {
    const channel = getCurrentChannel();
    if (!channel) return;

    channel.send({
        type: 'broadcast',
        event,
        payload: data
    });
}

/**
 * Enviar movimiento del jugador
 */
export function sendMove(moveData) {
    broadcastEvent('player_move', {
        ...moveData,
        timestamp: Date.now()
    });
}

/**
 * Enviar estado del juego (solo host)
 */
export function sendGameState(gameState) {
    broadcastEvent('game_state', gameState);
}
