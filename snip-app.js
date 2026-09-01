import { startSnip, stopSnip } from './snip.js';
import { Toast } from './toast.js';
import { Audio } from './audio.js';
import { Settings } from './settings.js';
import { initNav } from './nav.js';

Audio.init(() => {
  const s = Settings.get();
  return { soundEnabled: s.sound, audioTheme: s.cosmetics.audio === '8bit' ? 'square' : 'sine' };
});


window.Thread = {
  show: function(id) {
    document.getElementById('home').classList.toggle('on', id === 'home');
    document.getElementById('play-snip').classList.toggle('on', id === 'play-snip');
  },
  winSnip: function(levelIndex) {
    let save = JSON.parse(localStorage.getItem('THREAD_SNIP') || '{"unlocked":1, "stars":{}}');
    if (!save.stars[levelIndex - 1]) save.stars[levelIndex - 1] = 1;
    if (save.unlocked <= levelIndex) save.unlocked = levelIndex + 1;
    localStorage.setItem('THREAD_SNIP', JSON.stringify(save));
    renderSnipHub();
  }
};

function renderSnipHub() {
  initNav();
  const container = document.getElementById('snip-levels');
  if (!container) return;
  container.innerHTML = '';
  let save = JSON.parse(localStorage.getItem('THREAD_SNIP') || '{"unlocked":1, "stars":{}}');
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement('button');
    btn.className = 'lane';
    btn.style.padding = '15px 0';
    const isUnlocked = i <= save.unlocked;
    btn.innerHTML = '<b>' + i + '</b>' + (save.stars[i-1] ? ' ★' : '');
    btn.disabled = !isUnlocked;
    if (!isUnlocked) btn.style.opacity = '0.3';
    btn.onclick = () => {
      window.Thread.show('play-snip');
      startSnip(i);
    };
    container.appendChild(btn);
  }
}

document.getElementById('back-snip').onclick = () => {
  stopSnip();
  window.Thread.show('home');
};

renderSnipHub();
