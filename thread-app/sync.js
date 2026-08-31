// Sign in, and keep each player's progress on the server.
//
// The local save is a write-ahead buffer: the game writes there first so it
// stays playable with no signal, and this file pushes upstream when it can.
// Merging is monotonic (see mergeSaves in app.js), so two devices converge
// instead of one overwriting the other.

// Loaded on demand, further down, so that a copy running with SKIP_LOGIN on
// needs no network at all and cannot be held up by a blocked CDN.
const cfg = window.THREAD_CONFIG || {};
const gate = document.getElementById('gate');
const msg = document.getElementById('gMsg');
const emailEl = document.getElementById('gEmail');
const passEl = document.getElementById('gPass');
const goBtn = document.getElementById('gGo');
const swapBtn = document.getElementById('gSwap');
const swapText = document.getElementById('gSwapText');
const whoEl = document.getElementById('who');
const signOutBtn = document.getElementById('signOut');

let mode = 'in';                 // 'in' = sign in, 'up' = create account
let supabase = null;
let user = null;
let accessToken = null;
let pushTimer = null;
let pending = false;

function say(text, ok) {
  msg.textContent = text || '';
  msg.classList.toggle('ok', !!ok);
}

function configured() {
  return cfg.SUPABASE_URL &&
    cfg.SUPABASE_URL.indexOf('YOUR-PROJECT') === -1 &&
    cfg.SUPABASE_ANON_KEY &&
    cfg.SUPABASE_ANON_KEY.indexOf('YOUR-ANON') === -1;
}

// ---------- the object app.js talks to ----------
const cloud = {
  push(save) {
    pending = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, 1500);   // batch the busy moments
  },
  pushResume(snap) {
    pending = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(flush, 1500);
  }
};

async function flush() {
  if (!user || !pending) return;
  pending = false;
  const local = window.Thread.getSave();
  const localResume = window.Thread.getResume();
  try {
    // read, merge, write. Cheap at this scale and it cannot lose a run.
    const { data: row } = await supabase
      .from('saves').select('data, resume, seq').eq('user_id', user.id).maybeSingle();

    const merged = row && row.data ? window.Thread.merge(local, row.data) : local;
    let resume = localResume;
    if (row && row.resume && (!resume || (row.resume.at || 0) > (resume.at || 0))) resume = row.resume;

    const seq = Math.max(row ? row.seq || 0 : 0, merged.seq || 0) + 1;
    merged.seq = seq;

    const { error } = await supabase.from('saves').upsert({
      user_id: user.id,
      data: merged,
      resume: resume || null,
      seq,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (error) throw error;
    if (row && row.data) window.Thread.applyRemote(row.data, row.resume);
  } catch (e) {
    pending = true;                        // try again on the next change
    console.warn('save push failed, will retry', e.message || e);
  }
}

async function pull() {
  const { data: row, error } = await supabase
    .from('saves').select('data, resume').eq('user_id', user.id).maybeSingle();
  if (error) { console.warn('save pull failed', error.message); return; }
  if (row) window.Thread.applyRemote(row.data, row.resume);
}

// ---------- session ----------
async function signedIn(session) {
  user = session.user;
  accessToken = session.access_token;
  whoEl.textContent = user.email;
  gate.classList.add('done');
  window.Thread.setCloud(cloud);
  await window.Thread.boot();
  await pull();
  pending = true;
  flush();                                  // seed the row for a brand new account
}

async function submit() {
  const email = emailEl.value.trim();
  const pass = passEl.value;
  if (!email || pass.length < 8) { say('Enter your email and a password of at least 8 characters.'); return; }
  goBtn.disabled = true;
  say(mode === 'up' ? 'Creating your account…' : 'Signing in…', true);
  try {
    const fn = mode === 'up' ? 'signUp' : 'signInWithPassword';
    const { data, error } = await supabase.auth[fn]({ email, password: pass });
    if (error) throw error;
    if (!data.session) {
      say('Account created. Check your email to confirm it, then sign in.', true);
      mode = 'in'; paint();
      return;
    }
    await signedIn(data.session);
  } catch (e) {
    say(e.message || 'That did not work. Try again.');
  } finally {
    goBtn.disabled = false;
  }
}

function paint() {
  goBtn.textContent = mode === 'up' ? 'Create account' : 'Sign in';
  swapText.textContent = mode === 'up' ? 'Already have an account?' : 'New here?';
  swapBtn.textContent = mode === 'up' ? 'Sign in' : 'Create an account';
  passEl.setAttribute('autocomplete', mode === 'up' ? 'new-password' : 'current-password');
}

goBtn.addEventListener('click', submit);
passEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl.focus(); });
swapBtn.addEventListener('click', () => { mode = mode === 'up' ? 'in' : 'up'; say(''); paint(); });

signOutBtn.addEventListener('click', async () => {
  if (!supabase) return;                    // nothing to sign out of in test mode
  clearTimeout(pushTimer);
  await flush();
  await supabase.auth.signOut();
  user = null;
  window.Thread.signedOut();
  whoEl.textContent = '';
  passEl.value = '';
  gate.classList.remove('done');
  say('Signed out.', true);
});

// last chance to get the final state up before the tab dies. sendBeacon cannot
// set the auth headers Supabase needs, so this is a keepalive fetch instead.
window.addEventListener('pagehide', () => {
  if (!user || !pending || !accessToken) return;
  const local = window.Thread.getSave();
  fetch(cfg.SUPABASE_URL + '/rest/v1/saves?on_conflict=user_id', {
    method: 'POST',
    keepalive: true,
    headers: {
      apikey: cfg.SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      user_id: user.id,
      data: local,
      resume: window.Thread.getResume() || null,
      seq: (local.seq || 0) + 1,
      updated_at: new Date().toISOString()
    })
  }).catch(() => {});
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});

// ---------- test mode ----------
// No account, no server: open the game and let app.js save to this browser.
// The gate stays in the markup, it is simply never shown.
async function startWithoutSignIn() {
  gate.classList.add('done');
  signOutBtn.hidden = true;
  whoEl.textContent = 'Test mode, saved on this device only';
  await window.Thread.boot();
}

// ---------- start ----------
paint();
if (cfg.SKIP_LOGIN) {
  await startWithoutSignIn();
} else if (!configured()) {
  say('This copy has not been connected to a Supabase project yet. Fill in config.js.');
  goBtn.disabled = true;
} else {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session) accessToken = session.access_token;
  });
  const { data } = await supabase.auth.getSession();
  if (data.session) await signedIn(data.session);
}
