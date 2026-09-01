// One save, one account, three games.
//
// Everything a player does lives in a single object under CLASSIC_KEY, which
// sync.js pushes to their row on the server. Snip & Stitch and Loom Logic keep
// their progress in there beside the classic game's three lanes rather than in
// keys of their own, so signing in once carries the whole app between devices.
//
// The merge rule for all of it is in mergeSaves (logic.js): highest wins, level
// by level, so two devices converge instead of one overwriting the other.

export const CLASSIC_KEY = 'thread:save:v1';
export const GAMES = ['snip', 'loom'];

function read() {
  try {
    const raw = localStorage.getItem(CLASSIC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    return null;                             // private mode, or a corrupt value
  }
}

function write(save) {
  // Same bookkeeping app.js does, so the newer copy wins on the next merge.
  save.seq = (save.seq || 0) + 1;
  save.updatedAt = Date.now();
  try { localStorage.setItem(CLASSIC_KEY, JSON.stringify(save)); } catch (e) {}
  return save;
}

export function loadClassic() { return read(); }

// ---------- the smaller games ----------

export function loadGame(name) {
  const g = (read() || {})[name];
  return { unlocked: Math.max(1, (g && g.unlocked) || 1), stars: (g && g.stars) || {} };
}

// Progress only ever moves forward, so replaying an early level can never lock
// a later one again.
export function recordWin(name, level, total) {
  const save = read() || {};
  const g = save[name] || { unlocked: 1, stars: {} };
  g.stars = g.stars || {};
  g.stars[level] = Math.max(g.stars[level] || 0, 1);
  g.unlocked = Math.min(total, Math.max(g.unlocked || 1, level + 1));
  save[name] = g;
  write(save);
  return g;
}

export function countCleared(name) {
  const stars = loadGame(name).stars;
  return Object.keys(stars).filter(k => stars[k] > 0).length;
}

// ---------- settings ----------

// The sound toggle is app-wide, so any page may set it. The merge rule for it
// is 'the newer copy decides', which the bumped updatedAt in write() satisfies.
export function setSound(on) {
  const save = read() || {};
  save.sound = !!on;
  write(save);
}
