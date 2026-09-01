// The hub only reports; every game owns its own progress.
import { loadClassic, countCleared } from './progress.js';

const TOTAL = { snip: 5, loom: 5 };

function classicLine() {
  const save = loadClassic();
  if (!save) return '200 levels · three lanes';
  const lanes = ['easy', 'medium', 'hard'];
  let stars = 0, best = 0;
  lanes.forEach(lane => {
    const st = save[lane];
    if (!st) return;
    best = Math.max(best, (st.unlocked || 1) - 1);
    Object.keys(st.stars || {}).forEach(l => { stars += st.stars[l]; });
  });
  if (!best && !stars) return '200 levels · three lanes';
  return best + ' cleared · ' + stars + (stars === 1 ? ' star' : ' stars');
}

function smallLine(name) {
  const cleared = countCleared(name);
  const total = TOTAL[name];
  if (!cleared) return total + ' levels';
  if (cleared >= total) return 'All ' + total + ' cleared';
  return cleared + ' of ' + total + ' cleared';
}

const lines = { classic: classicLine, snip: () => smallLine('snip'), loom: () => smallLine('loom') };

document.querySelectorAll('[data-prog]').forEach(el => {
  const fn = lines[el.dataset.prog];
  if (fn) el.textContent = fn();
});
