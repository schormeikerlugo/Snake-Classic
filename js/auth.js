import { supabase } from './supabaseClient.js';
import { toggleAuthMode, showAuthLoader, showAuthForm, showUserProfile } from './ui.js';
import { hideModal, showModal } from './modal.js';

let isLogin = true;

async function updateUserProfile(user) {
    showAuthLoader(); // Muestra el loader mientras se carga el perfil
    const { data, error } = await supabase
        .from('perfiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

    const profileTitle = document.getElementById('profile-title');
    const profileAvatar = document.getElementById('profile-avatar');

    if (data) {
        profileTitle.textContent = `Bienvenido, ${data.username}`;
        profileAvatar.src = data.avatar_url || 'assets/image/anonimo/anonimo.png';
    } else {
        profileTitle.textContent = `Bienvenido`;
        profileAvatar.src = 'assets/image/anonimo/anonimo.png';
    }
    
    showUserProfile(); // Muestra la vista de perfil cuando los datos están listos
}

async function handleAuthFormSubmit(event) {
    event.preventDefault();
    showAuthLoader();
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
            response = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { username: username } } 
            });
        }

        if (response.error) throw response.error;

        if (!isLogin && response.data.user) {
            if (response.data.user.identities && response.data.user.identities.length === 0) {
                 errorElement.textContent = 'Este usuario ya existe. Por favor, inicia sesión.';
                 showAuthForm(); // Vuelve a mostrar el formulario con el error
            } else {
                hideModal();
                setTimeout(() => {
                    showModal('¡Registro Exitoso!', '<p>Hemos enviado un enlace de confirmación a tu correo electrónico. ¡Revísalo para activar tu cuenta!</p>');
                }, 300);
            }
            return;
        }
        
        // Para el login, onAuthStateChange se encargará de llamar a updateUserProfile,
        // que ya gestiona las vistas. No es necesario hacer nada más aquí.

    } catch (error) {
        errorElement.textContent = error.message;
        showAuthForm(); // Si hay un error, vuelve a mostrar el formulario
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    // onAuthStateChange se disparará y mostrará el formulario de login.
    // No es necesario hacer nada más aquí si el modal sigue abierto.
    hideModal(); // Opcional: cerrar el modal al hacer logout.
}

async function handleAvatarUpload(event) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const file = event.target.files[0];
    if (!file) return;

    showAuthLoader(); // Muestra el loader durante la subida

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) {
        console.error('Error subiendo avatar:', uploadError);
        showUserProfile(); // Vuelve al perfil aunque falle
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

    showUserProfile(); // Vuelve al perfil después de la subida
}

export function initAuth() {
    const authForm = document.getElementById('auth-form');
    const toggleLink = document.getElementById('toggle-auth-mode');
    const logoutBtn = document.getElementById('logout-btn');
    const uploadAvatarBtn = document.getElementById('upload-avatar-btn');
    const avatarUploadInput = document.getElementById('avatar-upload');

    if(authForm) authForm.addEventListener('submit', handleAuthFormSubmit);
    if(logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if(uploadAvatarBtn) uploadAvatarBtn.addEventListener('click', () => avatarUploadInput.click());
    if(avatarUploadInput) avatarUploadInput.addEventListener('change', handleAvatarUpload);

    if(toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            isLogin = !isLogin;
            toggleAuthMode(isLogin);
        });
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
        // Solo actuar si el modal de cuenta está abierto
        const modal = document.getElementById('modal');
        if (modal && !modal.classList.contains('hidden')) {
            if (session && session.user) {
                await updateUserProfile(session.user);
            } else {
                showAuthForm();
            }
        }
    });
}