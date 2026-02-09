/**
 * @file roomState.js
 * @description Estado y operaciones de sala
 */

import { supabase } from '../../lib/supabaseClient.js';
import { getCurrentRoom, setCurrentRoom } from './roomStore.js';
import { broadcastEvent } from './roomSync.js';

/**
 * Verificar si el usuario está autenticado
 */
async function getAuthenticatedUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        return null;
    }
    return user;
}

/**
 * Marcar jugador como listo/no listo
 */
export async function setReady(isReady) {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;

    try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        await supabase
            .from('jugadores_sala')
            .update({ is_ready: isReady })
            .eq('sala_id', currentRoom.id)
            .eq('user_id', user.id);

        // Notificar a otros
        broadcastEvent('player_ready', { user_id: user.id, is_ready: isReady });

        console.log(`✅ Ready: ${isReady}`);

    } catch (error) {
        console.error('Error actualizando estado:', error);
    }
}

/**
 * Iniciar la partida (solo host)
 */
export async function startGame() {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return { error: 'No hay sala activa' };

    try {
        const user = await getAuthenticatedUser();
        if (!user || currentRoom.host_id !== user.id) {
            return { error: 'Solo el host puede iniciar' };
        }

        // Verificar que todos estén listos
        const { data: players } = await supabase
            .from('jugadores_sala')
            .select('*')
            .eq('sala_id', currentRoom.id);

        const allReady = players?.every(p => p.is_ready || p.user_id === user.id);
        if (!allReady) {
            return { error: 'No todos los jugadores están listos' };
        }

        // Actualizar estado de sala
        await supabase
            .from('salas')
            .update({
                status: 'countdown',
                started_at: new Date().toISOString()
            })
            .eq('id', currentRoom.id);

        // Notificar inicio
        broadcastEvent('game_start', { countdown: 3 });

        return { error: null };

    } catch (error) {
        console.error('Error iniciando partida:', error);
        return { error: error.message };
    }
}

/**
 * Obtener información actual de la sala
 */
export async function getRoomInfo() {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return null;

    // Primera query: obtener sala con jugadores
    const { data: room, error: roomError } = await supabase
        .from('salas')
        .select(`*, jugadores_sala (*)`)
        .eq('id', currentRoom.id)
        .single();

    if (roomError) {
        console.error('Error obteniendo sala:', roomError);
        return null;
    }

    // Segunda query: obtener perfiles de los jugadores
    const userIds = room.jugadores_sala.map(j => j.user_id);

    if (userIds.length > 0) {
        const { data: perfiles } = await supabase
            .from('perfiles')
            .select('user_id, username, avatar_url')
            .in('user_id', userIds);

        // Agregar perfiles a los jugadores
        room.jugadores_sala = room.jugadores_sala.map(jugador => {
            const perfil = perfiles?.find(p => p.user_id === jugador.user_id);
            return {
                ...jugador,
                perfiles: perfil || { username: 'Jugador', avatar_url: null }
            };
        });
    }

    setCurrentRoom(room);
    return room;
}

/**
 * Verificar si el usuario actual es el host
 */
export async function isHost() {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return false;

    const user = await getAuthenticatedUser();
    return user?.id === currentRoom.host_id;
}

/**
 * Eliminar sala completamente (cuando todos salen)
 * @param {string} roomId - ID de la sala a eliminar
 */
export async function deleteRoomOnExit(roomId) {
    if (!roomId) return;

    try {
        // Primero eliminar jugadores de la sala
        const { error: playersError } = await supabase
            .from('jugadores_sala')
            .delete()
            .eq('sala_id', roomId);

        if (playersError) {
            console.error('Error eliminando jugadores:', playersError);
        }

        // Luego eliminar la sala
        const { error: roomError } = await supabase
            .from('salas')
            .delete()
            .eq('id', roomId);

        if (roomError) {
            console.error('Error eliminando sala:', roomError);
        } else {
            console.log('🗑️ Sala eliminada:', roomId);
        }

        // Notificar a otros que la sala fue cerrada
        broadcastEvent('room_closed', { room_id: roomId });

    } catch (error) {
        console.error('Error en deleteRoomOnExit:', error);
    }
}

/**
 * Verificar si quedan jugadores en la sala
 * @param {string} roomId - ID de la sala
 */
export async function getRemainingPlayers(roomId) {
    if (!roomId) return 0;

    const { data, error } = await supabase
        .from('jugadores_sala')
        .select('id')
        .eq('sala_id', roomId);

    if (error) {
        console.error('Error contando jugadores:', error);
        return 0;
    }

    return data?.length || 0;
}
