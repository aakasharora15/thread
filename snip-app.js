import { startSnip, stopSnip } from './snip.js';
import { Audio } from './audio.js';
import { Settings } from './settings.js';
import { loadGame, recordWin, setSound } from './progress.js';
import { sync, push } from './cloud.js';

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
  document.getElementById('play-snip').classList.toggle('on', id === 'play-snip');
}

window.Thread = {
  show,
  winSnip(level) {
    recordWin('snip', level, TOTAL);
    renderLevels();
    push();                                  // no-op when nobody is signed in
  }
};

// ---------- level select ----------
function renderLevels() {
  const grid = document.getElementById('snip-levels');
  if (!grid) return;
  grid.innerHTML = '';
  const save = loadGame('snip');
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
  const lv = document.getElementById('snipLv');
  if (lv) lv.textContent = 'Level ' + level;
  show('play-snip');
  startSnip(level);
}

document.getElementById('back-snip').onclick = () => { stopSnip(); show('home'); };
document.getElementById('retry-snip').onclick = () => { if (current) startSnip(current); };

renderLevels();
sync().then(saved => { if (saved) renderLevels(); });
