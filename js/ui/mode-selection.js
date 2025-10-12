import { hideModal } from './modal.js';
import { initRanking } from '../features/ranking.js';
import { initChat } from '../features/chat.js';
import { audioManager } from '../sound/audio.js';
import { settings } from '../features/settings.js';

let selectedMode = null;

function initModeSelection(game) {
  const modeNormal = document.getElementById('mode-normal');
  const modeObstacles = document.getElementById('mode-obstacles');
  const btnStartGame = document.getElementById('btn-start-game');

  modeNormal.addEventListener('click', () => selectMode('normal'));
  modeObstacles.addEventListener('click', () => selectMode('obstacles'));

  btnStartGame.addEventListener('click', () => {
    if (selectedMode) {
      hideModal();
      const menuView = document.getElementById('menu-view');
      const gameView = document.getElementById('game-view');
      menuView.classList.add('hidden');
      gameView.classList.remove('hidden');

      audioManager.playGameMusic();
      initRanking(document.getElementById('ranking-container'));
      initChat();

      game.startGame();
    }
  });
}

function selectMode(mode) {
  selectedMode = mode;
  const modeNormal = document.getElementById('mode-normal');
  const modeObstacles = document.getElementById('mode-obstacles');
  const btnStartGame = document.getElementById('btn-start-game');

  if (mode === 'normal') {
    modeNormal.classList.add('selected');
    modeObstacles.classList.remove('selected');
    settings.obstacles = false;
  } else {
    modeObstacles.classList.add('selected');
    modeNormal.classList.remove('selected');
    settings.obstacles = true;
  }

  btnStartGame.disabled = false;
}

export { initModeSelection };
