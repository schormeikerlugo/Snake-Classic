import { sfx } from '../sound/sfx.js';
import { getTranslation } from '../utils/language.js';

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('modal-close');

// Guarda una referencia a los listeners para poder limpiarlos después.
let activeModalListeners = [];

/**
 * Limpia todos los listeners activos del modal.
 */
function clearModalListeners() {
    activeModalListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
    });
    activeModalListeners = [];
}

/**
 * Oculta el modal.
 */
export function hideModal() {
    sfx.play('closeModal');
    modal.classList.add('hidden');
    clearModalListeners(); // Limpia listeners al cerrar
}

/**
 * Muestra el modal con un título y contenido específicos.
 * @param {string} title - El título a mostrar en el modal.
 * @param {string|HTMLElement|Function} content - El contenido a mostrar. Puede ser HTML, un nodo del DOM o una función que recibe `modalBody` como argumento.
 */
export function showModal(title, content) {
    clearModalListeners(); // Limpia listeners antiguos antes de mostrar uno nuevo
    modalTitle.textContent = title;
    modalBody.innerHTML = ''; // Limpia el contenido anterior

    if (typeof content === 'function') {
        content(modalBody); // La función se encarga de poblar el modal
    } else if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.appendChild(content);
    }

    modal.classList.remove('hidden');
    sfx.play('openModal');

    // Añade listeners por defecto para un modal simple
    const closeHandler = () => hideModal();
    const overlayHandler = (e) => {
        if (e.target === modal) {
            hideModal();
        }
    };

    closeModalBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', overlayHandler);
    activeModalListeners.push({ element: closeModalBtn, event: 'click', handler: closeHandler });
    activeModalListeners.push({ element: modal, event: 'click', handler: overlayHandler });
}

/**
 * Muestra un modal de confirmación con opciones Sí/No.
 * @param {string} title - El título del modal.
 * @param {string} message - El mensaje de pregunta.
 * @param {function} onConfirm - Callback si el usuario confirma.
 * @param {function} onCancel - Callback si el usuario cancela.
 */
export function showConfirmationModal(title, message, onConfirm, onCancel) {
    const contentHTML = `
        <p>${message}</p>
        <div class="modal-buttons" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
            <button id="confirm-no">${getTranslation('no')}</button>
            <button id="confirm-yes">${getTranslation('yesRestart')}</button>
        </div>
    `;
    // Usamos showModal para la estructura base, pero gestionaremos los listeners aquí
    showModal(title, contentHTML);

    const confirmBtn = document.getElementById('confirm-yes');
    const cancelBtn = document.getElementById('confirm-no');

    const confirmHandler = () => {
        if (onConfirm) onConfirm();
        hideModal(); // hideModal ahora limpia los listeners
    };

    const cancelHandler = () => {
        if (onCancel) onCancel();
        hideModal();
    };

    const overlayHandler = (e) => {
        if (e.target === modal) {
            cancelHandler();
        }
    };

    // Limpiamos los listeners por defecto de showModal y añadimos los nuestros
    clearModalListeners();

    confirmBtn.addEventListener('click', confirmHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    closeModalBtn.addEventListener('click', cancelHandler);
    modal.addEventListener('click', overlayHandler);

    // Guardamos referencias para poder limpiar
    activeModalListeners.push({ element: confirmBtn, event: 'click', handler: confirmHandler });
    activeModalListeners.push({ element: cancelBtn, event: 'click', handler: cancelHandler });
    activeModalListeners.push({ element: closeModalBtn, event: 'click', handler: cancelHandler });
    activeModalListeners.push({ element: modal, event: 'click', handler: overlayHandler });
}
