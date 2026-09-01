import { startLoom, stopLoom } from './loom.js';
import { Audio } from './audio.js';
import { Settings } from './settings.js';
import { loadGame, recordWin, setSound } from './progress.js';

const TOTAL = 5;

// ---------- sound ----------
// The setting lives in the classic game's save so one toggle governs the
// whole app; this page reads it, and writes back only when it is toggled.
let soundOn = Settings.get().sound;
Audio.init(() => ({ soundEnabled: soundOn }));
Audio.setTheme(Settings.get().cosmetics.audio);

const sndBtn = document.getElementById('sndHome');
function soundUI() {
  if (!sndBtn) return;
  sndBtn.classList.toggle('off', !soundOn);
  sndBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  sndBtn.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off');
}
if (sndBtn) sndBtn.onclick = () => {
  soundOn = !soundOn;
  setSound(soundOn);
  soundUI();
  if (!soundOn) Audio.stop();
};
soundUI();

// ---------- screens ----------
function show(id) {
  document.getElementById('home').classList.toggle('on', id === 'home');
  document.getElementById('play-loom').classList.toggle('on', id === 'play-loom');
}

window.Thread = {
  show,
  winLoom(level) {
    recordWin('loom', level, TOTAL);
    renderLevels();
  }
};

// ---------- level select ----------
function renderLevels() {
  const grid = document.getElementById('loom-levels');
  if (!grid) return;
  grid.innerHTML = '';
  const save = loadGame('loom');
  for (let i = 1; i <= TOTAL; i++) {
    const btn = document.createElement('button');
    const unlocked = i <= save.unlocked;
    btn.innerHTML = i + (save.stars[i] ? '<span class="st">&#9733;</span>' : '<span class="st">&nbsp;</span>');
    btn.disabled = !unlocked;
    btn.setAttribute('aria-label', unlocked
      ? 'Level ' + i + (save.stars[i] ? ', cleared' : '')
      : 'Level ' + i + ', locked');
    if (unlocked) btn.onclick = () => play(i);
    grid.appendChild(btn);
  }
}

let current = 0;
function play(level) {
  current = level;
  const lv = document.getElementById('loomLv');
  if (lv) lv.textContent = 'Level ' + level;
  show('play-loom');
  startLoom(level);
}

document.getElementById('back-loom').onclick = () => { stopLoom(); show('home'); };
document.getElementById('retry-loom').onclick = () => { if (current) startLoom(current); };

renderLevels();
