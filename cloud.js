// The two smaller games' half of the sync.
//
// sync.js owns signing in and the whole gate; it only runs on the classic
// game's page. This is the rest of the app's share: it picks up the session
// that sign-in already stored (same origin, so the same localStorage), and
// keeps the one save row in step. There is no sign-in UI here because there is
// only one sign-in, and it lives on the game that asks for it.
//
// Signed out, every call here is a no-op and the game stays fully playable on
// local storage alone. Whatever is played that way is merged upwards the next
// time the player signs in, because mergeSaves only ever moves progress
// forward.

import { Toast } from './toast.js';
import { CLASSIC_KEY, loadClassic } from './progress.js';

const cfg = window.THREAD_CONFIG || {};
const configured = () =>
  cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
  !/YOUR_/.test(cfg.SUPABASE_URL) && !/YOUR_/.test(cfg.SUPABASE_ANON_KEY);

let supabase = null;
let user = null;
let ready = null;
let reachable = true;                        // false once a connect attempt fails

function merge(a, b) {
  return window.ThreadLogic.mergeSaves(a, b);
}

function writeLocal(save) {
  try { localStorage.setItem(CLASSIC_KEY, JSON.stringify(save)); } catch (e) {}
}

// Resolve the session once, and let every caller wait on the same promise.
function connect() {
  if (ready) return ready;
  ready = (async () => {
    if (!configured()) return null;
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true }
      });
      const { data } = await supabase.auth.getSession();
      user = data.session ? data.session.user : null;
      return user;
    } catch (e) {
      supabase = null;                       // offline, or the CDN is unreachable
      reachable = false;
      return null;
    }
  })();
  return ready;
}

// Pull the server's copy and merge it in, so a level cleared on another device
// is already unlocked when this page draws its level list.
export async function sync() {
  if (!(await connect())) return null;
  try {
    const { data: row, error } = await supabase
      .from('saves').select('data').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (!row || !row.data) return null;
    const merged = merge(loadClassic() || {}, row.data);
    writeLocal(merged);
    return merged;
  } catch (e) {
    return null;                             // stay on the local copy
  }
}

// Push after a win. Merges against the row first so a device that has been
// offline cannot roll anyone back.
export async function push() {
  if (!(await connect())) return;
  try {
    const local = loadClassic();
    if (!local) return;
    const { data: row, error: fetchErr } = await supabase
      .from('saves').select('data, seq').eq('user_id', user.id).maybeSingle();
    if (fetchErr) throw fetchErr;

    const merged = (row && row.data) ? merge(local, row.data) : local;
    const seq = Math.max(row ? row.seq || 0 : 0, merged.seq || 0) + 1;
    merged.seq = seq;

    const { error } = await supabase.from('saves').upsert({
      user_id: user.id,
      data: merged,
      seq,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    if (error) throw error;
    writeLocal(merged);
  } catch (e) {
    Toast.show('Could not save to your account: ' + (e.message || e), true);
  }
}

// Three answers, not two: 'unknown' matters because claiming somebody is a
// guest when we simply could not ask is worse than saying nothing.
export async function account() {
  const who = await connect();
  if (who) return 'in';
  return reachable ? 'out' : 'unknown';
}
