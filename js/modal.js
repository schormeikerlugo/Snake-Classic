const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('modal-close');

/**
 * Oculta el modal.
 */
function hideModal() {
    modal.classList.add('hidden');
}

/**
 * Muestra el modal con un título y contenido específicos.
 * @param {string} title - El título a mostrar en el modal.
 * @param {string|HTMLElement} content - El contenido (HTML o un nodo del DOM) a mostrar en el cuerpo del modal.
 */
export function showModal(title, content) {
    modalTitle.textContent = title;
    modalBody.innerHTML = ''; // Limpia el contenido anterior
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.appendChild(content);
    }
    modal.classList.remove('hidden');
}

// --- Event Listeners ---
// Cierra el modal al hacer clic en el botón de cerrar
closeModalBtn.addEventListener('click', hideModal);

// Cierra el modal al hacer clic fuera del contenido
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});
