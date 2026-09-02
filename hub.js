// The hub only reports; every game owns its own progress.
import { loadClassic, countCleared } from './progress.js';
import { sync, account } from './cloud.js';


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

const lines = { classic: classicLine };

function paint() {
  document.querySelectorAll('[data-prog]').forEach(el => {
    const fn = lines[el.dataset.prog];
    if (fn) el.textContent = fn();
  });
}
paint();

// ---------- account ----------
// One sign-in covers the whole app, so say plainly which state we are in.
// Signing in is on the classic game, where the gate already lives.
const accountEl = document.getElementById('hubAccount');
const ACCOUNT_LINE = {
  in: 'Signed in. Your progress across all three games follows you to any phone.',
  out: 'Playing as a guest, saved on this device. Sign in and everything you have already played comes with you.',
  unknown: 'One account covers all three games.'
};
account().then(({ state, name }) => {
  if (accountEl) accountEl.textContent = ACCOUNT_LINE[state] || ACCOUNT_LINE.unknown;
  // Signing in has to be reachable from the front door. Burying it in a
  // footer sentence is how you end up unable to tell a signed-out picker from
  // a broken one.
  const btn = document.getElementById('hubSignIn');
  const who = document.getElementById('hubWho');
  if (btn) btn.hidden = state !== 'out';
  if (who) {
    who.hidden = state !== 'in';
    who.textContent = name ? 'Hello ' + name : 'Signed in';
  }
});

// The server may be ahead of this device, so redraw once it has answered.
sync().then(saved => { if (saved) paint(); });
