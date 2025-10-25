import * as C from '../../config/constants.js';

// Minimal FX loop: draw ring effects only (matches original/lightweight behavior)
export function drawFx(game, ts) {
    C.fxCtx.clearRect(0, 0, C.fxCanvas.width, C.fxCanvas.height);
    const dt = (ts - game.lastFxTs) / 1000;
    game.lastFxTs = ts;
    for (let i = game.effects.length - 1; i >= 0; i--) {
        const fx = game.effects[i];
        fx.r += 60 * dt;
        fx.alpha -= 1.5 * dt;
        if (fx.alpha <= 0) {
            game.effects.splice(i, 1);
            continue;
        }
        C.fxCtx.beginPath();
        C.fxCtx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2);
        C.fxCtx.strokeStyle = `rgba(255,255,255,${fx.alpha})`;
        C.fxCtx.stroke();
    }
    requestAnimationFrame(ts => drawFx(game, ts));
}
