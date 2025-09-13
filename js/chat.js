import { supabase } from './supabaseClient.js';

let chatChannel;
const messagesContainer = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

/**
 * Renderiza un solo mensaje en el contenedor de chat.
 * @param {object} message - El objeto del mensaje con `content`, `created_at` y `perfiles`.
 * @param {string|null} currentUserId - El ID del usuario actual para diferenciar sus mensajes.
 */
function renderMessage(message, currentUserId) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');

    const isOwnMessage = message.user_id === currentUserId;
    if (isOwnMessage) {
        messageElement.classList.add('own-message');
    }

    const avatar = message.perfiles?.avatar_url || 'assets/image/anonimo/anonimo.png';
    const userName = message.perfiles?.username || 'Anónimo';

    messageElement.innerHTML = `
        <img src="${avatar}" alt="Avatar" class="chat-avatar">
        <div class="message-content">
            <span class="message-author">${userName}</span>
            <p class="message-text">${message.content}</p>
        </div>
    `;
    
    messagesContainer.prepend(messageElement);
}

/**
 * Obtiene los últimos 50 mensajes del chat, uniendo los datos manualmente.
 * @param {string|null} currentUserId - El ID del usuario actual.
 */
async function fetchMessages(currentUserId) {
    // Paso 1: Obtener los mensajes
    const { data: messages, error: messagesError } = await supabase
        .from('mensajes')
        .select('id, content, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(50);

    if (messagesError) {
        console.error('Error fetching chat messages:', messagesError);
        return;
    }

    // Paso 2: Obtener los perfiles de esos mensajes
    const userIds = [...new Set(messages.map(m => m.user_id))]; // IDs únicos
    const { data: profiles, error: profilesError } = await supabase
        .from('perfiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

    if (profilesError) {
        console.error('Error fetching profiles for chat:', profilesError);
    }

    // Paso 3: Unir los datos en el cliente
    const profilesById = profiles ? Object.fromEntries(profiles.map(p => [p.id, p])) : {};
    const combinedData = messages.map(message => ({
        ...message,
        perfiles: profilesById[message.user_id]
    }));

    messagesContainer.innerHTML = '';
    combinedData.forEach(message => renderMessage(message, currentUserId));
}

/**
 * Maneja el envío de un nuevo mensaje.
 * @param {Event} event - El evento de submit del formulario.
 */
async function handleMessageSubmit(event) {
    event.preventDefault();
    const messageText = chatInput.value.trim();
    if (!messageText) return;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert('Debes iniciar sesión para enviar mensajes.');
        return;
    }

    const { error } = await supabase.from('mensajes').insert([
        { content: messageText, user_id: user.id }
    ]);

    if (error) {
        console.error('Error sending message:', error);
    } else {
        chatInput.value = '';
    }
}

/**
 * Inicializa el chat, obtiene mensajes y se suscribe a eventos en tiempo real.
 */
export async function initChat() {
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user ? user.id : null;

    fetchMessages(currentUserId);

    chatForm.addEventListener('submit', handleMessageSubmit);

    if (chatChannel) {
        supabase.removeChannel(chatChannel);
    }

    chatChannel = supabase
        .channel('public:mensajes')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'mensajes' }, 
            async (payload) => {
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('username, avatar_url')
                    .eq('id', payload.new.user_id)
                    .single();

                const fullMessage = {
                    ...payload.new,
                    perfiles: data
                };
                renderMessage(fullMessage, currentUserId);
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Conectado al canal de chat en tiempo real.');
            } else if (err) {
                console.error('Error en la suscripción al chat:', err);
            }
        });
}