/**
 * @file input.js
 * @description Manejador de input para juego multiplayer
 */

export class MultiplayerInput {
    constructor(onMove) {
        this.onMove = onMove;
        this.setupKeyboardListeners();
        this.setupTouchListeners();
    }

    /**
     * Configurar listeners de teclado
     */
    setupKeyboardListeners() {
        this.keyHandler = (e) => {
            let direction = null;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    direction = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    direction = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    direction = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    direction = 'right';
                    break;
            }

            if (direction) {
                e.preventDefault();
                this.onMove(direction);
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    /**
     * Configurar listeners táctiles
     */
    setupTouchListeners() {
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.touchStartHandler = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        };

        this.touchEndHandler = (e) => {
            const deltaX = e.changedTouches[0].clientX - this.touchStartX;
            const deltaY = e.changedTouches[0].clientY - this.touchStartY;

            const minSwipe = 30;

            if (Math.abs(deltaX) < minSwipe && Math.abs(deltaY) < minSwipe) {
                return;
            }

            let direction;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                direction = deltaX > 0 ? 'right' : 'left';
            } else {
                direction = deltaY > 0 ? 'down' : 'up';
            }

            this.onMove(direction);
        };

        document.addEventListener('touchstart', this.touchStartHandler, { passive: true });
        document.addEventListener('touchend', this.touchEndHandler, { passive: true });
    }

    /**
     * Destruir listeners
     */
    destroy() {
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('touchstart', this.touchStartHandler);
        document.removeEventListener('touchend', this.touchEndHandler);
    }
}
