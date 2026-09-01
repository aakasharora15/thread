// One place that knows where every game keeps its progress. The hub, the two
// smaller games and the shared settings all read through here so a key name
// can never drift between them again.
//
// The classic game owns 'thread:save:v1' and syncs it to the server; the two
// smaller games are local to the device for now, so they get their own keys
// rather than riding along inside a save that the merge rules would fight.

export const CLASSIC_KEY = 'thread:save:v1';
export const KEYS = { snip: 'thread:snip:v1', loom: 'thread:loom:v1' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (e) {
    return fallback;                       // private mode, or a corrupt value
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

// ---------- the smaller games ----------

export function loadGame(name) {
  const save = read(KEYS[name], null);
  return {
    unlocked: Math.max(1, save && save.unlocked || 1),
    stars: (save && save.stars) || {}
  };
}

// Progress only ever moves forward here, the same rule the classic game plays
// by, so replaying an early level can never lock a later one again.
export function recordWin(name, level, total) {
  const save = loadGame(name);
  save.stars[level] = Math.max(save.stars[level] || 0, 1);
  save.unlocked = Math.min(total, Math.max(save.unlocked, level + 1));
  write(KEYS[name], save);
  return save;
}

export function countCleared(name) {
  const save = loadGame(name);
  return Object.keys(save.stars).filter(k => save.stars[k] > 0).length;
}

// ---------- the classic game ----------

// Read-only: the classic save belongs to app.js and sync.js, and the hub only
// ever looks at it.
export function loadClassic() {
  return read(CLASSIC_KEY, null);
}

// The sound toggle is app-wide, so the smaller games write it back into the
// classic save the same way app.js does: bump seq and updatedAt, and let the
// merge rules ('the newer copy decides') carry it to the other devices.
export function setSound(on) {
  const save = loadClassic() || {};
  save.sound = !!on;
  save.seq = (save.seq || 0) + 1;
  save.updatedAt = Date.now();
  write(CLASSIC_KEY, save);
}
