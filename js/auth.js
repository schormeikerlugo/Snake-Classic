import { supabase } from './supabaseClient.js';
import { toggleAuthMode } from './ui.js';
import { hideModal } from './modal.js';

let isLogin = true;

async function updateUserProfile(user) {
    const { data, error } = await supabase
        .from('perfiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

    const profileTitle = document.getElementById('profile-title');
    const profileAvatar = document.getElementById('profile-avatar');

    if (data) {
        profileTitle.textContent = `Bienvenido, ${data.username}`;
        if (data.avatar_url) {
            profileAvatar.src = data.avatar_url;
        } else {
            profileAvatar.src = 'assets/image/anonimo/anonimo.png'; // Default avatar
        }
    } else {
        profileTitle.textContent = `Bienvenido`;
        profileAvatar.src = 'assets/image/anonimo/anonimo.png';
    }

    document.getElementById('auth-form-container').style.display = 'none';
    document.getElementById('user-profile-container').style.display = 'block';
}

async function handleAuthFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const password = form.password.value;
    const username = form.username.value;
    const errorElement = document.getElementById('auth-error');
    errorElement.textContent = '';

    try {
        let response;
        if (isLogin) {
            response = await supabase.auth.signInWithPassword({ email, password });
        } else {
            // 1. Crear el usuario en el sistema de autenticación de Supabase.
            // El trigger en la DB se encargará de crear el perfil.
            response = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { username: username } } // Guardar username en metadatos para el trigger
            });
        }

        if (response.error) throw response.error;

        // Si el registro es exitoso y no requiere confirmación de email, el usuario estará logueado.
        // Si requiere confirmación, se le mostrará un mensaje.
        if (!isLogin && response.data.user) {
            if (response.data.user.identities.length === 0) {
                 errorElement.textContent = 'Este usuario ya existe. Por favor, inicia sesión.';
            } else {
                alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
            }
        }
        
        hideModal();

    } catch (error) {
        errorElement.textContent = error.message;
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    document.getElementById('auth-form-container').style.display = 'block';
    document.getElementById('user-profile-container').style.display = 'none';
    toggleAuthMode(true);
    isLogin = true;
}

async function handleAvatarUpload(event) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const file = event.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error subiendo avatar:', uploadError);
        return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

    const { error: updateError } = await supabase
        .from('perfiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error actualizando URL de avatar:', updateError);
    } else {
        document.getElementById('profile-avatar').src = publicUrl;
    }
}

export function initAuth() {
    const authForm = document.getElementById('auth-form');
    const toggleLink = document.getElementById('toggle-auth-mode');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const avatarUploadInput = document.getElementById('avatar-upload');

    authForm.addEventListener('submit', handleAuthFormSubmit);
    logoutBtn.addEventListener('click', handleLogout);
    uploadAvatarBtn.addEventListener('click', () => avatarUploadInput.click());
    avatarUploadInput.addEventListener('change', handleAvatarUpload);

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLogin = !isLogin;
        toggleAuthMode(isLogin);
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && session.user) {
            await updateUserProfile(session.user);
        } else {
            document.getElementById('auth-form-container').style.display = 'block';
            document.getElementById('user-profile-container').style.display = 'none';
        }
    });
}