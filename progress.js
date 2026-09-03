// One save, one account.
//
// Everything a player does lives in a single object under CLASSIC_KEY, which
// sync.js pushes to their row on the server.
//
// The merge rule for all of it is in mergeSaves (logic.js): highest wins, level
// by level, so two devices converge instead of one overwriting the other.

export const CLASSIC_KEY = 'thread:save:v1';

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

