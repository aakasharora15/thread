
// Sign in, and keep each player's progress on the server.
//
// The local save is a write-ahead buffer: the game writes there first so it
// stays playable with no signal, and this file pushes upstream when it can.
// Merging is monotonic (see mergeSaves in app.js), so two devices converge
// instead of one overwriting the other.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.THREAD_CONFIG || {};
const gate = document.getElementById('gate');
const msg = document.getElementById('gMsg');
const emailEl = document.getElementById('gEmail');
const passEl = document.getElementById('gPass');
const goBtn = document.getElementById('gGo');
const swapBtn = document.getElementById('gSwap');
const swapText = document.getElementById('gSwapText');
const whoEl = document.getElementById('who');
const newBox = document.getElementById('gNew');
const nameEl = document.getElementById('gName');
const dobEl = document.getElementById('gDob');
const mailLink = document.getElementById('profMailLink');
const mailNote = document.getElementById('profMailNote');

let mode = 'in';                 // 'in' = sign in, 'up' = create account
let supabase = null;
let user = null;
let accessToken = null;
let pushTimer = null;
let pending = false;
let forceOverwrite = false;   // set by a wipe: the local copy wins outright
let wipePromise = null;

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
  },
  async wipe() {
    pending = false;
    clearTimeout(pushTimer);
    // Merging is monotonic, so until this is cleared by a write that lands,
    // every push must overwrite rather than merge. Otherwise the next sync
    // pulls the cleared progress straight back out of the server row.
    forceOverwrite = true;
    if (user) {
      const emptySave = {
        lane: 'medium', seq: 999999999, updatedAt: Date.now(),
        easy: { unlocked: 1, stars: {}, streak: 0, bank: 0 },
        medium: { unlocked: 1, stars: {}, streak: 0, bank: 0 },
        hard: { unlocked: 1, stars: {}, streak: 0, bank: 0 }
      };
      wipePromise = supabase.from('saves').upsert({
        user_id: user.id,
        data: emptySave,
        resume: null,
        seq: 999999999,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      try {
        const { error } = await wipePromise;
        if (error) throw error;
        forceOverwrite = false;
      } catch (e) {
        // leave forceOverwrite set so the next push still overwrites
        console.error('[Wipe Error]', e);
        console.log('Could not clear the server copy: ' + (e.message || e), true);
      }
      wipePromise = null;
    }
  }
};

async function flush() {
  if (wipePromise) await wipePromise;
  if (!user || !pending) return;
  pending = false;
  console.log('Syncing...');
  
  const local = window.Thread.getSave();
  const localResume = window.Thread.getResume();
  try {
    const { data: row, error: fetchErr } = await supabase
      .from('saves').select('data, resume, seq').eq('user_id', user.id).maybeSingle();
    if (fetchErr) throw fetchErr;

    const merged = (!forceOverwrite && row && row.data) ? window.Thread.merge(local, row.data) : local;
    let resume = localResume;
    if (!forceOverwrite && row && row.resume && (!resume || (row.resume.at || 0) > (resume.at || 0))) resume = row.resume;

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
    forceOverwrite = false;                  // the cleared state is now on the server
    window.Thread.applyRemote(merged, resume);
  } catch (e) {
    pending = true;                        // try again on the next change
    console.error('[Sync Error]', e);
    console.log('Sync failed: ' + e.message, true);
  } finally {
    
  }
}

async function pull() {
  const { data: row, error } = await supabase
    .from('saves').select('data, resume').eq('user_id', user.id).maybeSingle();
  if (error) { console.warn('save pull failed', error.message); return; }
  if (row) window.Thread.applyRemote(row.data, row.resume);
}

// ---------- greeting ----------
// The name lives on the account itself (user_metadata), so it follows the
// player to any device without a second table to keep in step.
function firstName(u) {
  const full = ((u.user_metadata || {}).full_name || '').trim();
  return full ? full.split(/\s+/)[0] : '';
}

function hideSplash(immediate) {}


// ---------- email the developer ----------
// The draft carries the player's progress, so a report arrives with the
// state that produced it rather than just "it broke".
function updateMailLink() {
  const to = (cfg.SUPPORT_EMAIL || '').trim();
  if (!to || !user) {
    mailLink.hidden = true;
    mailNote.hidden = !!to;
    return;
  }
  const save = window.Thread.getSave();
  const lines = [['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([key, label]) => {
    const st = save[key] || {};
    const stars = st.stars || {};
    const keys = Object.keys(stars);
    const dots = keys.reduce((a, k) => a + (stars[k] || 0), 0);
    return label + ': ' + keys.length + ' solved, ' + dots + ' stars, furthest ' + (st.unlocked || 1);
  });
  const body = ['', '', '---', 'From ' + (firstName(user) || user.email), ...lines].join('\n');
  mailLink.href = 'mailto:' + to +
    '?subject=' + encodeURIComponent('Thread \u2014 a request') +
    '&body=' + encodeURIComponent(body);
  mailLink.hidden = false;
  mailNote.hidden = true;
}

// app.js opens the profile from the header, so refresh the draft as it opens
// and the progress inside it is current rather than whatever it was at sign in.
whoEl.addEventListener('click', updateMailLink);

// ---------- session ----------
async function signedIn(session) {
  user = session.user;
  accessToken = session.access_token;
  const first = firstName(user);
  const name = first || user.email.split('@')[0];
  const capitalized = name.charAt(0).toUpperCase() + name.slice(1);

  whoEl.title = user.email;
  whoEl.hidden = false;
  
  gate.classList.add('done');
  window.Thread.setCloud(cloud);
  try {
    await window.Thread.boot();
    await pull();
    pending = true;
    flush();                                // seed the row for a brand new account
  } finally {
    hideSplash();
  }
  
  // After login, show the home page
  updateMailLink();
  window.Thread.renderProfile();
  window.Thread.show('home');
}

async function submit() {
  const email = emailEl.value.trim();
  const pass = passEl.value;
  if (!email || pass.length < 8) { say('Enter your email and a password of at least 8 characters.'); return; }

  const fullName = nameEl.value.trim().replace(/\s+/g, ' ');
  const dob = dobEl.value;
  if (mode === 'up') {
    if (fullName.length < 2) { say('Tell us your name so the game can say hello.'); return; }
    if (!dob) { say('Please enter your Date of Birth.'); return; }
  }

  goBtn.disabled = true;
  say(mode === 'up' ? 'Creating your account…' : 'Signing in…', true);
  try {
    const creds = { email, password: pass };
    if (mode === 'up') creds.options = { data: { full_name: fullName, dob: dob } };
    const fn = mode === 'up' ? 'signUp' : 'signInWithPassword';
    const { data, error } = await supabase.auth[fn](creds);
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
  newBox.hidden = mode !== 'up';
  goBtn.textContent = mode === 'up' ? 'Create account' : 'Sign in';
  swapText.textContent = mode === 'up' ? 'Already have an account?' : 'New here?';
  swapBtn.textContent = mode === 'up' ? 'Sign in' : 'Create an account';
  passEl.setAttribute('autocomplete', mode === 'up' ? 'new-password' : 'current-password');
}

goBtn.addEventListener('click', submit);
passEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl.focus(); });
swapBtn.addEventListener('click', () => { mode = mode === 'up' ? 'in' : 'up'; say(''); paint(); });

document.getElementById('profSignOut').addEventListener('click', async () => {
  clearTimeout(pushTimer);
  await flush();
  await supabase.auth.signOut();
  user = null;
  window.Thread.signedOut();
  
  whoEl.removeAttribute('title');
  whoEl.hidden = true;
  passEl.value = '';
  nameEl.value = '';
  dobEl.value = '';
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

// ---------- start ----------
paint();
if (!configured()) {
  say('This copy has not been connected to a Supabase project yet. Fill in config.js.');
  goBtn.disabled = true;
  hideSplash(true);                      // or the artwork sits on top of the message
  gate.classList.remove('done');
} else {
  supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session) accessToken = session.access_token;
  });
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    await signedIn(data.session);
  } else {
    hideSplash(true);
    gate.classList.remove('done');       // nobody signed in: show the gate
  }
}
