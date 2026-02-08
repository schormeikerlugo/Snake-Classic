/**
 * @file roomActions.js
 * @description Acciones de sala: crear, unirse, salir
 */

import { supabase } from '../../lib/supabaseClient.js';
import {
    getCurrentRoom,
    setCurrentRoom,
    PLAYER_COLORS
} from './roomStore.js';
import { subscribeToRoom, unsubscribeFromRoom, broadcastEvent } from './roomSync.js';

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
 * Crear una nueva sala
 */
export async function createRoom(mode = 'duel', maxPlayers = 2) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return { room: null, error: 'Debes iniciar sesión para crear una sala' };
        }

        // Crear la sala
        const { data: room, error: createError } = await supabase
            .from('salas')
            .insert({
                mode,
                host_id: user.id,
                max_players: maxPlayers,
                status: 'waiting'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creando sala:', createError);
            return { room: null, error: `Error al crear la sala: ${createError.message}` };
        }

        // Unirse automáticamente como jugador
        const { error: joinError } = await supabase
            .from('jugadores_sala')
            .insert({
                sala_id: room.id,
                user_id: user.id,
                color: PLAYER_COLORS[0],
                is_ready: false
            });

        if (joinError) {
            // Limpiar sala si falla
            await supabase.from('salas').delete().eq('id', room.id);
            console.error('Error uniéndose:', joinError);
            return { room: null, error: 'Error al unirse a la sala' };
        }

        // Guardar referencia y suscribirse
        setCurrentRoom(room);
        await subscribeToRoom(room.id);

        console.log('🎮 Sala creada:', room.code);
        return { room, error: null };

    } catch (error) {
        console.error('Error en createRoom:', error);
        return { room: null, error: error.message };
    }
}

/**
 * Unirse a una sala existente por código
 */
export async function joinRoom(code) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return { room: null, error: 'Debes iniciar sesión para unirte' };
        }

        // Buscar sala por código
        const { data: room, error: findError } = await supabase
            .from('salas')
            .select('*, jugadores_sala(*)')
            .eq('code', code.toUpperCase())
            .eq('status', 'waiting')
            .single();

        if (findError || !room) {
            return { room: null, error: 'Sala no encontrada o ya iniciada' };
        }

        // Verificar espacio disponible
        if (room.jugadores_sala.length >= room.max_players) {
            return { room: null, error: 'La sala está llena' };
        }

        // Verificar que no estemos ya en la sala
        if (room.jugadores_sala.some(p => p.user_id === user.id)) {
            return { room: null, error: 'Ya estás en esta sala' };
        }

        // Unirse a la sala
        const playerNumber = room.jugadores_sala.length + 1;
        const { error: joinError } = await supabase
            .from('jugadores_sala')
            .insert({
                sala_id: room.id,
                user_id: user.id,
                color: PLAYER_COLORS[playerNumber - 1],
                is_ready: false
            });

        if (joinError) {
            console.error('Error uniéndose:', joinError);
            return { room: null, error: 'Error al unirse a la sala' };
        }

        // Guardar referencia y suscribirse
        setCurrentRoom(room);
        await subscribeToRoom(room.id);

        // Notificar a otros jugadores
        broadcastEvent('player_joined', { user_id: user.id });

        console.log('🎮 Unido a sala:', room.code);
        return { room, error: null };

    } catch (error) {
        console.error('Error en joinRoom:', error);
        return { room: null, error: error.message };
    }
}

/**
 * Salir de la sala actual
 */
export async function leaveRoom() {
    const currentRoom = getCurrentRoom();
    if (!currentRoom) return;

    try {
        const user = await getAuthenticatedUser();
        if (!user) return;

        // Si soy el host, cerrar la sala
        if (currentRoom.host_id === user.id) {
            await supabase.from('salas').delete().eq('id', currentRoom.id);
            broadcastEvent('room_closed', {});
        } else {
            // Solo salir
            await supabase
                .from('jugadores_sala')
                .delete()
                .eq('sala_id', currentRoom.id)
                .eq('user_id', user.id);

            broadcastEvent('player_left', { user_id: user.id });
        }

        // Limpiar suscripciones
        await unsubscribeFromRoom();
        setCurrentRoom(null);

        console.log('👋 Saliste de la sala');

    } catch (error) {
        console.error('Error saliendo de sala:', error);
    }
}
