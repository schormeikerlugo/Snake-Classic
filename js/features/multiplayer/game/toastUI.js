/**
 * @file toastUI.js
 * @description Notificaciones temporales (toasts) para el multiplayer.
 */

let containerEl = null;

function ensureContainer() {
    if (containerEl && document.body.contains(containerEl)) return;

    containerEl = document.createElement('div');
    containerEl.id = 'mp-toast-container';
    containerEl.className = 'mp-toast-container';
    document.body.appendChild(containerEl);
}

/**
 * Mostrar una notificación temporal
 * @param {string} message - Texto del toast
 * @param {number} duration - Duración en ms (default 3000)
 */
export function showToast(message, duration = 3000) {
    ensureContainer();

    const toast = document.createElement('div');
    toast.className = 'mp-toast';
    toast.textContent = message;
    containerEl.appendChild(toast);

    // Trigger reflow para que la animación funcione
    toast.offsetHeight;
    toast.classList.add('mp-toast--visible');

    setTimeout(() => {
        toast.classList.remove('mp-toast--visible');
        toast.classList.add('mp-toast--out');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
        // Fallback por si animationend no se dispara
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

/**
 * Destruir el contenedor de toasts
 */
export function destroyToasts() {
    if (containerEl) {
        containerEl.remove();
        containerEl = null;
    }
}
