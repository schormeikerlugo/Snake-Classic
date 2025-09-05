export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');
export const fxCanvas = document.getElementById('fx');
export const fxCtx = fxCanvas.getContext('2d');

export const SCORE_EL = document.getElementById('score');
export const BEST_EL = document.getElementById('best');
export const START_BTN = document.getElementById('start');
export const PAUSED_OVERLAY = document.getElementById('paused');

export const MIN_TICK = 60;
export const SPEED_STEP = 3;
export const INITIAL_TICK_MS = 110;