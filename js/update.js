function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Usando console.log para debugging, se pueden quitar en producción
        console.log('[Update] Iniciando registro de Service Worker...');
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('[Update] ServiceWorker registrado con éxito:', registration.scope);

            registration.addEventListener('updatefound', () => {
                console.log('[Update] Evento "updatefound" detectado.');
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        console.log(`[Update] El estado del nuevo worker ha cambiado a: ${newWorker.state}`);
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('[Update] Nuevo worker instalado. Mostrando botón de actualización.');
                            showUpdateButton(registration);
                        }
                    });
                }
            });
        }).catch(err => {
            console.log('[Update] Fallo en el registro del ServiceWorker:', err);
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[Update] El controlador ha cambiado. Recargando página.');
            window.location.reload();
        });
    }
}

function showUpdateButton(registration) {
    console.log('[Update] Ejecutando showUpdateButton...');
    
    const enterBtn = document.getElementById('enter-btn');
    // Solo mostrar el botón si el botón de "Iniciar" es visible
    if (!enterBtn) {
        return;
    }

    // Evitar crear botones duplicados
    if (document.getElementById('update-btn')) {
        return;
    }

    const updateButton = document.createElement('button');
    updateButton.id = 'update-btn';
    updateButton.textContent = 'Actualizar Juego';

    updateButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevenir otros eventos de click
        console.log('[Update] Botón de actualizar presionado.');
        updateButton.textContent = 'Actualizando...';
        updateButton.disabled = true;
        if (registration.waiting) {
            registration.waiting.postMessage({ action: 'SKIP_WAITING' });
        }
    });

    // Insertar el botón después del de "Iniciar"
    enterBtn.insertAdjacentElement('afterend', updateButton);

    // Mostrar el botón
    console.log('[Update] Mostrando el botón de actualización.');
    updateButton.style.display = 'block';
}

export { registerServiceWorker };