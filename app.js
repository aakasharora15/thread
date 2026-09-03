
import { Audio } from './audio.js';
import { Toast } from './toast.js';

// This file used to be wrapped in an IIFE. That wrapper is gone, so the whole
// file is a module now and strict mode is automatic; the leftover directive
// sat here doing nothing. The two-space indent below is the same leftover and
// is kept for now because de-indenting 1,400 lines would bury every real
// change in the diff.
var L = window.ThreadLogic;
  var mkLane = L.mkLane, mkGame = L.mkGame, mergeSaves = L.mergeSaves, GAMES = L.GAMES;
  // boards.js is 89 KB of level data that the home screen never needs, so it
  // is fetched on demand and then warmed in the background after boot.
  var BOARDS = window.THREAD_BOARDS || null;
  var boardsPromise = null;
  function ensureBoards() {
    if (BOARDS) return Promise.resolve();
    if (!boardsPromise) {
      boardsPromise = new Promise(function (res, rej) {
        var sc = document.createElement('script');
        sc.src = 'boards.js';
        sc.onload = function () { BOARDS = window.THREAD_BOARDS; res(); };
        sc.onerror = function () { boardsPromise = null; rej(new Error('boards.js failed to load')); };
        document.head.appendChild(sc);
      });
    }
    return boardsPromise;
  }
  function haptic(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  var LANE = {
    easy:   { name: 'Easy',   hints: 3, undoCap: Infinity, guard: true,  highlight: true,  clock: 'none',      parBase: 1.6 },
    medium: { name: 'Medium', hints: 1, undoCap: Infinity, guard: false, highlight: false, clock: 'up',        parBase: 2.0 },
    hard:   { name: 'Hard',   hints: 0, undoCap: 5,        guard: false, highlight: false, clock: 'countdown', parBase: 2.4 },
    pro:    { name: 'Pro',    hints: 0, undoCap: 0,        guard: false, highlight: false, clock: 'countdown', parBase: 3.0 }
  };
  // Twenty worlds of ten levels. Each one repaints the whole game.
  var THEMES = [
    { n: 'Candy',    s: 'dot',     g: '#FBE4EC', c: '#FFF1F5', m: '#E0568C', t: '#D62F63', k: '#FF8FB2', o: '#E4A93A', gr: 'linear-gradient(105deg,#F9A8C6 0%,#F7C6A0 55%,#FBD98B 100%)' },
    { n: 'Bubbles',  s: 'ring',    g: '#DCEEF7', c: '#F0F8FC', m: '#2E93C4', t: '#1E7FB8', k: '#63C2E8', o: '#D9B144', gr: 'linear-gradient(105deg,#8FD3EF 0%,#B7E3E0 55%,#DCEFC7 100%)' },
    { n: 'Meadow',   s: 'drop',    g: '#DFEED8', c: '#F3F8EE', m: '#5FAE55', t: '#D4562F', k: '#F0865C', o: '#D0A238', gr: 'linear-gradient(105deg,#9BD08B 0%,#CBD980 55%,#EDE08A 100%)' },
    { n: 'Citrus',   s: 'star',    g: '#FBEFD2', c: '#FFF8E6', m: '#D8961D', t: '#E0532A', k: '#FF8A5C', o: '#C08214', gr: 'linear-gradient(105deg,#FFD166 0%,#FFB55C 55%,#F79A5B 100%)' },
    { n: 'Ocean',    s: 'diamond', g: '#D6E9EA', c: '#EEF7F7', m: '#2E8C93', t: '#DB4E3A', k: '#FF8468', o: '#D2A63F', gr: 'linear-gradient(105deg,#7FC6C2 0%,#9AD2B4 55%,#C8E0A0 100%)' },
    { n: 'Sparkles', s: 'star',    g: '#EAE3F7', c: '#F6F2FE', m: '#7B5BD6', t: '#D63384', k: '#FF74B0', o: '#DDB945', gr: 'linear-gradient(105deg,#C3B0F0 0%,#E3B7EA 55%,#F7D6A8 100%)' },
    { n: 'Sherbet',  s: 'dot',     g: '#FDE7DC', c: '#FFF4EC', m: '#E2703F', t: '#C2306A', k: '#F2708F', o: '#DDA236', gr: 'linear-gradient(105deg,#FFC59B 0%,#FFAFA6 55%,#FFD6A0 100%)' },
    { n: 'Jungle',   s: 'drop',    g: '#D8E9DC', c: '#EFF7F0', m: '#2F8F6B', t: '#D2582E', k: '#F5885B', o: '#C79A36', gr: 'linear-gradient(105deg,#86C9A0 0%,#B6D690 55%,#E1DE8C 100%)' },
    { n: 'Space',    s: 'star',    g: '#DCE0F2', c: '#F1F2FB', m: '#4B5BC4', t: '#DE4033', k: '#FF8069', o: '#DFBA4C', gr: 'linear-gradient(105deg,#A6AEF0 0%,#C4B4EE 55%,#EFC9C9 100%)' },
    { n: 'Berry',    s: 'dot',     g: '#ECDCEC', c: '#F9EFF8', m: '#8E3F87', t: '#BB2C4A', k: '#EB6E7F', o: '#D5A63C', gr: 'linear-gradient(105deg,#D3A0D6 0%,#E7A9C0 55%,#F6CBA8 100%)' },
    { n: 'Sunset',   s: 'ring',    g: '#FBE2D8', c: '#FFF2EA', m: '#DC5E33', t: '#B23A6B', k: '#EE6F92', o: '#D89E33', gr: 'linear-gradient(105deg,#FFB08A 0%,#FF9AA5 55%,#FFCF9A 100%)' },
    { n: 'Frost',    s: 'diamond', g: '#E2EDF4', c: '#F4F9FC', m: '#4C86AE', t: '#D03B50', k: '#F4808E', o: '#C0A951', gr: 'linear-gradient(105deg,#B7D7EA 0%,#CFE4EC 55%,#E7EFDC 100%)' },
    { n: 'Magic',    s: 'star',    g: '#E4E1F5', c: '#F4F2FD', m: '#6B4FC9', t: '#CC3873', k: '#F1789F', o: '#E0BB47', gr: 'linear-gradient(105deg,#B9AEEE 0%,#D6B3E8 55%,#F0CBB0 100%)' },
    { n: 'Peach',    s: 'drop',    g: '#FBE6D9', c: '#FFF5EE', m: '#DB8049', t: '#BC3A53', k: '#F07C86', o: '#D59F39', gr: 'linear-gradient(105deg,#FFCBA4 0%,#FFD9A8 55%,#FBE7B2 100%)' },
    { n: 'Neon',     s: 'diamond', g: '#E3F2DC', c: '#F4FBEE', m: '#2FA84F', t: '#DC2681', k: '#FF6FB5', o: '#CBB336', gr: 'linear-gradient(105deg,#A8E38B 0%,#D6EE7A 55%,#F5E86B 100%)' },
    { n: 'Moss',     s: 'dot',     g: '#E2E9D8', c: '#F4F8EC', m: '#6C8F3C', t: '#AF3E2B', k: '#E27A5E', o: '#C09831', gr: 'linear-gradient(105deg,#A9C87F 0%,#C9D68A 55%,#E6E2A0 100%)' },
    { n: 'Cocoa',    s: 'ring',    g: '#EDE3DA', c: '#FAF3EC', m: '#8A6244', t: '#B33636', k: '#E17868', o: '#CB9A42', gr: 'linear-gradient(105deg,#D6B48F 0%,#E3C9A0 55%,#EFDCB0 100%)' },
    { n: 'Lagoon',   s: 'ring',    g: '#D8EDE8', c: '#EEF9F5', m: '#1F8F80', t: '#DB4B37', k: '#FF8467', o: '#D1A83D', gr: 'linear-gradient(105deg,#8DD6C4 0%,#B4E2B6 55%,#DDECA6 100%)' },
    { n: 'Aurora',   s: 'star',    g: '#DDEEEA', c: '#F1F9F6', m: '#3E8FA8', t: '#BD3780', k: '#EE76AE', o: '#D6B343', gr: 'linear-gradient(105deg,#9BDCC8 0%,#AFCDEE 55%,#D5BCEE 100%)' },
    { n: 'Midnight', s: 'diamond', g: '#DCDEEC', c: '#EFF0F8', m: '#3E4A8C', t: '#D33B37', k: '#F57C6D', o: '#D8B34D', gr: 'linear-gradient(105deg,#A9AFD8 0%,#C0BCE2 55%,#E0CFD8 100%)' }
  ];
  function worldOf(level) { return Math.floor((level - 1) / 10); }
  function applyTheme(i) {
    var th = THEMES[i], r = document.documentElement.style;
    r.setProperty('--ground', th.g);
    r.setProperty('--cream', th.c);
    r.setProperty('--mint', th.m);
    r.setProperty('--thread', th.t);
    r.setProperty('--thread-core', th.k);
    r.setProperty('--gold', th.o);
    r.setProperty('--grad', th.gr);
    tintLogo(th.t);
  }
  function tintLogo(colour) {
    var marks = document.querySelectorAll('.wordmark, .logo svg');
    for (var i = 0; i < marks.length; i++) {
      marks[i].style.color = colour;
      marks[i].style.fill = colour;
      var kids = marks[i].querySelectorAll('path, use');
      for (var j = 0; j < kids.length; j++) kids[j].style.fill = colour;
    }
  }

  function glyph(shape) {
    var p = {
      dot: '<circle cx="9" cy="9" r="4"/><circle cx="19.5" cy="11" r="3"/><circle cx="13" cy="19.5" r="3.4"/>',
      ring: '<circle cx="14" cy="14" r="8" fill="none" stroke="currentColor" stroke-width="3.2"/>',
      star: '<path d="M14 3 L16.4 11.6 L25 14 L16.4 16.4 L14 25 L11.6 16.4 L3 14 L11.6 11.6 Z"/>',
      drop: '<path d="M14 3 C19 10 22 13.5 22 17 A8 8 0 0 1 6 17 C6 13.5 9 10 14 3 Z"/>',
      diamond: '<path d="M14 3 L23 14 L14 25 L5 14 Z"/>'
    }[shape];
    return '<svg viewBox="0 0 28 28" width="26" height="26" fill="currentColor" style="color:var(--thread)">' + p + '</svg>';
  }

  var SAVE_KEY = 'thread:save:v1';
  var RESUME_KEY = 'thread:resume:v1';

  var save = { lane: 'medium', seq: 0, updatedAt: 0, easy: mkLane(), medium: mkLane(), hard: mkLane(), pro: mkLane(),
                };
  var resume = null;
  var cloud = null;                 // set by sync.js once someone is signed in
  Audio.init(function () { return { soundEnabled: save.sound !== false }; });


  // ---------- storage ----------
  // Inside Claude the host provides window.storage. Opened as a plain file, or
  // sent to someone else, it falls back to localStorage. Memory only as a last resort.
  var store = (function () {
    if (window.storage && typeof window.storage.get === 'function') {
      return {
        kind: 'host',
        get: function (k) { return window.storage.get(k).then(function (r) { return r && r.value ? r.value : null; }).catch(function () { return null; }); },
        set: function (k, v) { try { return window.storage.set(k, v).catch(function () {}); } catch (e) { return Promise.resolve(); } }
      };
    }
    try {
      var probe = 'thread:probe';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return {
        kind: 'local',
        get: function (k) { return Promise.resolve(window.localStorage.getItem(k)); },
        set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} return Promise.resolve(); }
      };
    } catch (e) {}
    var mem = {};
    return {
      kind: 'memory',
      get: function (k) { return Promise.resolve(mem[k] || null); },
      set: function (k, v) { mem[k] = v; return Promise.resolve(); }
    };
  })();

  // Nothing may write the save until it has been read. persist() runs from
  // pagehide and from backgrounding the app, and load() only runs once signing
  // in has resolved, so without this a player who opens the app and switches
  // away before that finishes has their progress overwritten with a blank one.
  var loaded = false;

  function load() {
    return store.get(SAVE_KEY).then(function (raw) {
      if (raw) {
        try {
          var v = JSON.parse(raw);
          if (v) {
            save.lane = v.lane || 'medium';
            save.sound = v.sound;
            save.cosmetics = v.cosmetics || { color: 'default', audio: 'default' };
            save.last = v.last;
            save.seq = v.seq || 0;
            save.updatedAt = v.updatedAt || 0;
            ['easy', 'medium', 'hard', 'pro'].forEach(function (k) { if (v[k]) save[k] = Object.assign(mkLane(), v[k]); });
            // The other two games live in this save as well. Copy them across
            // even though nothing on this page reads them: persist() writes the
            // whole object back, so anything dropped here is destroyed.
            GAMES.forEach(function (k) { save[k] = Object.assign(mkGame(), v[k] || {}); });
          }
        } catch(e){}
      }
      return store.get(RESUME_KEY);
    }).then(function (raw) {
      if (raw) { try { resume = JSON.parse(raw); } catch (e) { resume = null; } }
      loaded = true;
      applyCosmetics();
    }).catch(function () { loaded = true; });
  }
  function persist(quiet) {
    if (!loaded) return;                     // see the note on `loaded` above
    save.seq = (save.seq || 0) + 1;
    save.updatedAt = Date.now();
    store.set(SAVE_KEY, JSON.stringify(save));
    if (cloud && !quiet) cloud.push(save);
  }

  // ---------- resume ----------
  var lastWrite = 0;
  function snapshot() {
    if (!S || S.over) return null;
    return {
      lane: S.lane, level: S.level, line: S.line.slice(), added: S.added,
      hints: S.hints, undosLeft: S.undosLeft === Infinity ? -1 : S.undosLeft,
      elapsed: Math.round(S.elapsed), at: Date.now()
    };
  }
  function saveResume(force) {
    var now = Date.now();
    if (!force && now - lastWrite < 1200) return;
    lastWrite = now;
    var snap = snapshot();
    resume = snap;
    store.set(RESUME_KEY, snap ? JSON.stringify(snap) : '');
    if (cloud && force) cloud.pushResume(snap);
  }
  function clearResume() {
    resume = null;
    store.set(RESUME_KEY, '');
    if (cloud) cloud.pushResume(null);
  }

  // ---------- board decoding ----------
  function decode(lane, level) { return L.decodeBoard(BOARDS[lane][level - 1]); }
  function wallKey(a, b) { return a < b ? a + ',' + b : b + ',' + a; }

  // Board size sets the floor; the number of turns adds the rest. This used to
  // read board.index, which was a difficulty score until the boards were
  // regenerated and it became the level number, which pushed the late targets
  // past ten minutes and squeezed the early ones to nothing.
  function parTime(board, lane) {
    return Math.round(board.cells * LANE[lane].parBase + board.turns * 1.5);
  }
  var LEVELS = 200;
  function countdownFor(level) {
    if (level < 121) return 0;
    return Math.round(240 - (level - 121) * (90 / 79));
  }

  // ---------- game state ----------
  var S = null;

  function startLevel(lane, level, snap) {
    return ensureBoards().then(function () { return startLevelNow(lane, level, snap); },
      function () { say('Could not load the levels. Check your connection and try again.'); });
  }
  function startLevelNow(lane, level, snap) {
    var board = decode(lane, level);
    var cd = lane === 'hard' ? countdownFor(level) : 0;
    var valid = snap && snap.lane === lane && snap.level === level && snap.line && snap.line.length &&
      snap.line[0] === board.start && snap.line.every(function (c) { return board.open[c]; });
    S = {
      lane: lane, level: level, board: board,
      hintAt: null, hintFrom: null,
      line: valid ? snap.line.slice() : [board.start],
      added: valid ? snap.added : 0,
      hints: valid ? snap.hints : LANE[lane].hints + (lane === 'hard' ? save.hard.bank : 0),
      undosLeft: valid ? (snap.undosLeft < 0 ? Infinity : snap.undosLeft) : LANE[lane].undoCap,
      base: valid ? snap.elapsed : 0,
      elapsed: valid ? snap.elapsed : 0, countdown: cd, over: false, won: false,
      dragging: false, t0: null
    };
    save.last = { lane: lane, level: level };
    world = worldOf(level); worldPinned = true;
    applyTheme(world);
    persist();
    document.getElementById('lvNum').textContent = level;
    document.getElementById('lvLane').textContent = THEMES[worldOf(level)].n;
    document.getElementById('stripFill').style.width = (level / LEVELS * 100) + '%';
    document.getElementById('sLane').textContent = LANE[lane].name;
    document.getElementById('sNums').textContent = '1\u2013' + board.cpCount;
    document.getElementById('sCells').textContent = board.cells;
    document.getElementById('sPar').textContent = fmt(parTime(board, lane)) + ' (provisional)';
    var clock = document.getElementById('clock');
    clock.hidden = LANE[lane].clock === 'none';
    document.getElementById('clockNote').textContent =
      LANE[lane].clock === 'countdown' && cd ? 'runs out' : LANE[lane].clock === 'up' ? 'third dot at ' + fmt(parTime(board, lane)) : '';
    if (LANE[lane].clock === 'countdown' && !cd) clock.hidden = true;
    var got = save[lane].stars[level] || 0;
    document.getElementById('lvDots').textContent = got ? '\u25CF'.repeat(got) : '';
    document.getElementById('sFilled').textContent = S.line.length;
    document.getElementById('sNext').textContent = nextNumber() > board.cpCount ? 'done' : nextNumber();
    badges();
    show('play');
    say(valid && S.line.length > 1 ? 'Picked up where you left off.' : '');
    draw();
    tickStart();
    saveResume(true);
  }

  function fmt(s) {
    s = Math.max(0, Math.round(s));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  var timer = null;
  function pauseClock() {
    if (!S || S.over || !timer) return;
    S.base = S.elapsed;
    clearInterval(timer);
    timer = null;
  }
  function resumeClock() {
    if (!S || S.over || timer) return;
    tickStart();
  }
  function tickStart() {
    clearInterval(timer);
    S.t0 = Date.now();
    timer = setInterval(tick, 250);
    tick();
  }
  function tick() {
    if (!S || S.over) return;
    S.elapsed = S.base + (Date.now() - S.t0) / 1000;
    var lane = LANE[S.lane], el = document.getElementById('clockFill'), lab = document.getElementById('clockLab');
    if (lane.clock === 'up') {
      var par = parTime(S.board, S.lane);
      lab.textContent = fmt(S.elapsed);
      el.style.width = Math.min(100, (S.elapsed / par) * 100) + '%';
      document.getElementById('clock').classList.toggle('low', S.elapsed > par);
    } else if (lane.clock === 'countdown' && S.countdown) {
      var left = S.countdown - S.elapsed;
      lab.textContent = fmt(left);
      el.style.width = Math.max(0, (left / S.countdown) * 100) + '%';
      document.getElementById('clock').classList.toggle('low', left < 30);
      if (left <= 0) return timeUp();
    }
  }
  function timeUp() {
    S.over = true; clearInterval(timer);
    clearResume();
    save.hard.streak = 0; persist();
    Audio.fail();
    overlay('Out of time', 'The board is still here. Retries are free and unlimited.', -1);
  }

  // ---------- rules ----------
  function legal(from, to) {
    var b = S.board;
    if (to < 0 || to >= b.R * b.C) return false;
    if (!b.open[to]) return false;
    var rf = Math.floor(from / b.C), cf = from % b.C, rt = Math.floor(to / b.C), ct = to % b.C;
    if (Math.abs(rf - rt) + Math.abs(cf - ct) !== 1) return false;
    if (b.walls.has(wallKey(from, to))) return false;
    if (S.line.indexOf(to) !== -1) return false;
    return true;                       // wrong order is a mistake, not a blocked move
  }
  // The next number still owed, counting only the ones taken in sequence.
  function orderOK() {
    var b = S.board, want = 1;
    for (var i = 0; i < S.line.length; i++) {
      var cp = b.cp[S.line[i]];
      if (cp !== 0) { if (cp !== want) return false; want++; }
    }
    return true;
  }
  function movesLeft() {
    var head = S.line[S.line.length - 1], b = S.board;
    var r = Math.floor(head / b.C), c = head % b.C, out = 0;
    if (r > 0 && legal(head, head - b.C)) out++;
    if (r < b.R - 1 && legal(head, head + b.C)) out++;
    if (c > 0 && legal(head, head - 1)) out++;
    if (c < b.C - 1 && legal(head, head + 1)) out++;
    return out;
  }
  function nextNumber() {
    var b = S.board, want = 1;
    for (var i = 0; i < S.line.length; i++) {
      var cp = b.cp[S.line[i]];
      if (cp !== 0 && cp === want) want++;
    }
    return want;
  }
  // Easy lane guard: refuse a move that strands squares.
  function feasible(line) {
    var b = S.board, N = b.R * b.C, head = line[line.length - 1];
    var vis = new Uint8Array(N);
    for (var i = 0; i < N; i++) if (!b.open[i]) vis[i] = 1;
    line.forEach(function (c) { vis[c] = 1; });
    var remaining = b.cells - line.length;
    if (remaining === 0) return head === b.end;
    var nbs = function (c) {
      var out = [], r = Math.floor(c / b.C), cc = c % b.C;
      if (r > 0) out.push(c - b.C); if (r < b.R - 1) out.push(c + b.C);
      if (cc > 0) out.push(c - 1); if (cc < b.C - 1) out.push(c + 1);
      return out.filter(function (j) { return b.open[j] && !b.walls.has(wallKey(c, j)); });
    };
    for (var i2 = 0; i2 < N; i2++) {
      if (vis[i2]) continue;
      var d = 0, list = nbs(i2);
      for (var k = 0; k < list.length; k++) if (!vis[list[k]] || list[k] === head) d++;
      if (d === 0) return false;
      if (d === 1 && i2 !== b.end) return false;
    }
    var seen = new Uint8Array(N), stack = [], h = nbs(head).filter(function (j) { return !vis[j]; });
    if (!h.length) return false;
    stack.push(h[0]); seen[h[0]] = 1;
    var cnt = 0;
    while (stack.length) {
      var c2 = stack.pop(); cnt++;
      var l2 = nbs(c2);
      for (var k2 = 0; k2 < l2.length; k2++) { var j2 = l2[k2]; if (!vis[j2] && !seen[j2]) { seen[j2] = 1; stack.push(j2); } }
    }
    return cnt === remaining && seen[b.end] === 1;
  }

  function extend(to) {
    S.hintAt = null;
    var head = S.line[S.line.length - 1];
    if (!legal(head, to)) return false;
    if (LANE[S.lane].guard) {
      var cpTo = S.board.cp[to];
      if (cpTo !== 0 && cpTo !== nextNumber()) {
        say('Number ' + nextNumber() + ' comes first.'); Audio.blocked(); return false;
      }
      var trial = S.line.concat([to]);
      if (!feasible(trial)) { say('That would strand a square. Try another way.'); Audio.blocked(); return false; }
    }
    var prev = S.line[S.line.length - 1];
    S.line.push(to); S.added++;
    flowTo(prev, false);
    if (S.board.cp[to]) Audio.mark(S.board.cp[to]); else Audio.step(S.line.length);
    afterMove();
    return true;
  }
  function rubOut(byDrag) {
    S.hintAt = null;
    if (S.line.length <= 1) return;
    if (!byDrag && S.undosLeft <= 0) { say('No taps left. Drag back along the line instead.'); return; }
    if (!byDrag && S.undosLeft !== Infinity) S.undosLeft--;
    var gone = S.line.pop();
    flowTo(gone, true);
    Audio.erase();
    afterMove();
  }
  function badges() {
    document.getElementById('undoBadge').textContent = S.undosLeft === Infinity ? '' : S.undosLeft;
    document.getElementById('hintBadge').textContent = S.hints ? S.hints : '';
    document.getElementById('hint').disabled = S.hints <= 0;
    document.getElementById('undo').disabled = S.line.length <= 1 || S.undosLeft <= 0;
  }
  function afterMove() {
    haptic(5);
    draw();
    document.getElementById('sFilled').textContent = S.line.length;
    document.getElementById('sNext').textContent = nextNumber() > S.board.cpCount ? 'done' : nextNumber();
    badges();
    saveResume(false);
    if (S.line.length === S.board.cells) {
      if (S.line[S.line.length - 1] === S.board.end && orderOK()) return win();
      return lose(orderOK()
        ? 'Every square is filled, but the line has to finish on ' + S.board.cpCount + '.'
        : 'Every square is filled, but the numbers were not taken in order.');
    }
    if (movesLeft() === 0) {
      lose(orderOK()
        ? 'The line has nowhere left to go, with ' + (S.board.cells - S.line.length) + ' ' +
          (S.board.cells - S.line.length === 1 ? 'square' : 'squares') + ' still empty.'
        : 'The line has nowhere left to go. Number ' + nextNumber() + ' was skipped.');
    }
  }

  function lose(why) {
    S.over = true;
    clearInterval(timer);
    if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; }
    S.flow = null;
    clearResume();
    if (S.lane === 'hard') { save.hard.streak = 0; persist(); }
    Audio.fail();
    draw();
    overlay('Stuck', why + ' Rub out and try again, as often as you like.', -1);
  }

  function win() {
    S.over = true; S.won = true; clearInterval(timer);
    clearResume();
    
    var boardSlot = document.querySelector('.boardslot');
    if (boardSlot) {
      boardSlot.classList.remove('solved-pulse');
      void boardSlot.offsetWidth;
      boardSlot.classList.add('solved-pulse');
    }
    var clean = S.added === S.board.cells - 1;
    var par = parTime(S.board, S.lane);
    var stars = 1 + (clean ? 1 : 0) + (clean && S.elapsed <= par ? 1 : 0);
    
    if (stars === 3) {
      if (!window.confetti) {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        script.onload = function() { fireConfetti(); };
        document.body.appendChild(script);
      } else {
        fireConfetti();
      }
    }
    function fireConfetti() {
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#4CC0A0', '#E8C04A', '#FF7A5C'], disableForReducedMotion: true });
    }
    var st = save[S.lane];
    st.stars[S.level] = Math.max(st.stars[S.level] || 0, stars);
    st.unlocked = Math.max(st.unlocked, Math.min(LEVELS, S.level + 1));
    if (S.lane === 'hard') {
      if (clean) { st.streak++; if (st.streak % 5 === 0) st.bank = Math.min(3, st.bank + 1); }
      else st.streak = 0;
    }
    persist();
    var body = clean
      ? 'Clean solve in ' + fmt(S.elapsed) + '. Target was ' + fmt(par) + '.'
      : 'Solved in ' + fmt(S.elapsed) + ', with ' + (S.added - (S.board.cells - 1)) + ' extra squares drawn. A solve with nothing rubbed out earns the second dot.';
    haptic([15, 50, 15]);
    Audio.win();
    draw(true);
    setTimeout(function () { overlay('Solved', body, stars); }, 520);
  }

  function overlay(title, body, stars) {
    document.getElementById('ovTitle').textContent = title;
    document.getElementById('ovBody').textContent = body;
    var wrap = document.getElementById('ovStars');
    wrap.style.display = stars < 0 ? 'none' : 'flex';
    [].forEach.call(wrap.children, function (el, i) {
      el.classList.remove('on', 'star-pop');
      if (i < stars) {
        setTimeout(function () {
          el.classList.add('on', 'star-pop');
        }, 300 + i * 250);
      }
    });
    document.getElementById('ovNext').textContent = stars < 0 ? 'Back to levels' : 'Next level';
    document.getElementById('over').classList.add('on');
  }

  // ---------- hints ----------
  function useHint() {
    if (S.hints <= 0) { say(S.lane === 'hard' ? 'No hints banked. Five clean solves in a row earns one.' : 'No hints left on this board.'); return; }
    var sol = S.board.solution, i = 0;
    while (i < S.line.length && i < sol.length && S.line[i] === sol[i]) i++;
    if (i < S.line.length) {
      S.hints--;
      if (S.lane === 'hard') { save.hard.bank = Math.max(0, save.hard.bank - 1); persist(); }
      var cut = S.line.length - i;
      S.line = S.line.slice(0, i);
      S.hintAt = S.line[S.line.length - 1];
      S.hintFrom = null;
      say('The line went wrong ' + cut + ' ' + (cut === 1 ? 'square' : 'squares') + ' back. Rubbed out to the last correct square.');
      afterMove();
      return;
    }
    if (i >= sol.length) return;
    S.hints--;
    S.hintFrom = S.line[S.line.length - 1];
    S.line.push(sol[i]); S.added++;
    S.hintAt = sol[i];
    if (S.lane === 'hard') { save.hard.bank = Math.max(0, save.hard.bank - 1); persist(); }
    say('One square added.');
    afterMove();
  }

  // ---------- drawing ----------
  var NS = 'http://www.w3.org/2000/svg';

  // Digits are not centred inside the em box, and how far off they sit depends
  // on the font, so dominant-baseline alone leaves them riding high or low and
  // it lands differently once the webfont replaces the fallback. Measure the
  // rendered ink once and correct with dy, in em so it scales with font-size.
  var digitDy = null;
  function digitOffsetEm(svg) {
    if (digitDy !== null) return digitDy;
    var probe = el('text', {
      x: 0, y: 0, 'font-size': 1, 'font-weight': 700,
      'text-anchor': 'middle', opacity: 0
    });
    probe.textContent = '8';
    svg.appendChild(probe);
    var bb = probe.getBBox();
    svg.removeChild(probe);
    digitDy = bb.height ? -(bb.y + bb.height / 2) : 0.35;
    return digitDy;
  }
  // the webfont usually lands after the first board is drawn, and its digits
  // sit differently, so throw the cached correction away and redraw
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      digitDy = null;
      if (S) draw();
    });
  }
  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  // A Catmull-Rom spline through the cell centres, written out as cubics.
  // Collinear points give a dead straight cubic, so long runs stay straight
  // while every turn becomes one continuous curve. The tension is held below
  // the point where the curve would bulge out of its own cell.
  var TENSION = 0.155;
  function roundedPath(pts) {
    var n = pts.length;
    if (n === 1) return 'M' + pts[0].x + ' ' + pts[0].y;
    if (n === 2) return 'M' + pts[0].x + ' ' + pts[0].y + ' L' + pts[1].x + ' ' + pts[1].y;
    var d = 'M' + pts[0].x + ' ' + pts[0].y;
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : 0];
      var p1 = pts[i], p2 = pts[i + 1];
      var p3 = pts[i + 2 < n ? i + 2 : n - 1];
      var c1x = p1.x + (p2.x - p0.x) * TENSION, c1y = p1.y + (p2.y - p0.y) * TENSION;
      var c2x = p2.x - (p3.x - p1.x) * TENSION, c2y = p2.y - (p3.y - p1.y) * TENSION;
      d += ' C' + c1x.toFixed(3) + ' ' + c1y.toFixed(3) + ',' +
                  c2x.toFixed(3) + ' ' + c2y.toFixed(3) + ',' +
                  p2.x.toFixed(3) + ' ' + p2.y.toFixed(3);
    }
    return d;
  }
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The head slides into the new square rather than jumping to it.
  function centre(cell) { return { x: (cell % S.board.C) + 0.5, y: Math.floor(cell / S.board.C) + 0.5 }; }
  function flowTo(fromCell, back) {
    if (reduceMotion) return;
    S.flow = { from: centre(fromCell), back: !!back, t0: (window.performance || Date).now(), dur: 130 };
    if (!S.raf) S.raf = requestAnimationFrame(flowFrame);
  }
  function flowFrame() {
    S.raf = 0;
    if (!S || !S.flow) return;
    var now = (window.performance || Date).now();
    var e = Math.min(1, (now - S.flow.t0) / S.flow.dur);
    var k = 1 - Math.pow(1 - e, 3);
    paintThread(k);
    if (e < 1) S.raf = requestAnimationFrame(flowFrame);
    else { S.flow = null; paintThread(1); }
  }
  function linePoints(k) {
    var pts = S.line.map(centre);
    if (S.flow && k < 1) {
      var f = S.flow.from;
      if (S.flow.back) {
        var h = pts[pts.length - 1];
        pts.push({ x: f.x + (h.x - f.x) * k, y: f.y + (h.y - f.y) * k });
      } else if (pts.length > 1) {
        var t = pts[pts.length - 1];
        pts[pts.length - 1] = { x: f.x + (t.x - f.x) * k, y: f.y + (t.y - f.y) * k };
      }
    }
    return pts;
  }
  // Only the line and its head move between frames, so nothing else is redrawn.
  function paintThread(k) {
    if (!S || !S.els) return;
    var pts = linePoints(k);
    var d = roundedPath(pts);
    if (pts.length > 1) {
      S.els.outer.setAttribute('d', d);
      S.els.core.setAttribute('d', d);
    }
    var h = pts[pts.length - 1];
    S.els.head.setAttribute('cx', h.x);
    S.els.head.setAttribute('cy', h.y);
  }

  function draw(winning) {
    var b = S.board, svg = document.getElementById('board');
    var pad = 0.45;
    svg.setAttribute('viewBox', (-pad) + ' ' + (-pad) + ' ' + (b.C + pad * 2) + ' ' + (b.R + pad * 2));
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var cellR = 0.09;

    for (var i = 0; i < b.R * b.C; i++) {
      if (!b.open[i]) continue;
      var r = Math.floor(i / b.C), c = i % b.C;
      svg.appendChild(el('rect', {
        x: c + 0.04, y: r + 0.04, width: 0.92, height: 0.92, rx: 0.28,
        fill: 'var(--cell)', stroke: 'var(--rule)', 'stroke-width': 0.03
      }));
    }

    // thread, with every turn rounded off so the line reads as a soft noodle
    if (S.line.length > 1) {
      var d = roundedPath(linePoints(S.flow ? 0 : 1));
      var outer = el('path', { d: d, fill: 'none', stroke: 'var(--thread)', 'stroke-width': 0.46, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.96 });
      svg.appendChild(outer);
      var core = el('path', { d: d, fill: 'none', stroke: 'var(--thread-core)', 'stroke-width': 0.15, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.6 });
      if (winning) core.setAttribute('class', 'win-thread');
      svg.appendChild(core);
      S.els = { outer: outer, core: core, head: null };
    }
    // head
    var head = S.line[S.line.length - 1];
    var headEl = el('circle', {
      cx: (head % b.C) + 0.5, cy: Math.floor(head / b.C) + 0.5, r: 0.19,
      fill: 'var(--thread-core)', stroke: 'var(--cell)', 'stroke-width': 0.055
    });
    svg.appendChild(headEl);
    if (!S.els) S.els = { outer: null, core: null, head: null };
    S.els.head = headEl;
    if (S.flow) paintThread(0);

    // walls
    b.walls.forEach(function (key) {
      var parts = key.split(',').map(Number), a = parts[0], z = parts[1];
      var ra = Math.floor(a / b.C), ca = a % b.C;
      if (z - a === 1) svg.appendChild(el('line', { x1: ca + 1, y1: ra + 0.06, x2: ca + 1, y2: ra + 0.94, stroke: 'var(--ink)', 'stroke-width': 0.14, 'stroke-linecap': 'round' }));
      else svg.appendChild(el('line', { x1: ca + 0.06, y1: ra + 1, x2: ca + 0.94, y2: ra + 1, stroke: 'var(--ink)', 'stroke-width': 0.14, 'stroke-linecap': 'round' }));
    });

    // checkpoints
    var nxt = nextNumber();
    for (var j = 0; j < b.R * b.C; j++) {
      if (!b.cp[j]) continue;
      var rr = Math.floor(j / b.C), cc2 = j % b.C, on = S.line.indexOf(j) !== -1;
      if (LANE[S.lane].highlight && b.cp[j] === nxt) {
        var ring = el('circle', { cx: cc2 + 0.5, cy: rr + 0.5, r: 0.44, fill: 'none', stroke: 'var(--mint)', 'stroke-width': 0.06 });
        ring.setAttribute('class', 'pulse');
        svg.appendChild(ring);
      }
      // a ring of board colour keeps the marker clear of the line running under it
      svg.appendChild(el('circle', {
        cx: cc2 + 0.5, cy: rr + 0.5, r: 0.395, fill: 'none',
        stroke: 'var(--cell)', 'stroke-width': 0.1
      }));
      svg.appendChild(el('circle', {
        cx: cc2 + 0.5, cy: rr + 0.5, r: 0.345,
        fill: on ? 'var(--ink)' : 'var(--cell)', stroke: 'var(--ink)', 'stroke-width': 0.05
      }));
      var label = String(b.cp[j]);
      // no letter-spacing: text-anchor centres the advance width including the
      // space after the last glyph, so it shifts two digit labels off centre
      var t = el('text', {
        x: cc2 + 0.5, y: rr + 0.5, 'text-anchor': 'middle',
        dy: digitOffsetEm(svg) + 'em', fill: on ? 'var(--cell)' : 'var(--ink)',
        'font-size': label.length > 1 ? 0.37 : 0.46, 'font-weight': 600,
        'font-family': 'var(--display)'
      });
      t.textContent = label;
      svg.appendChild(t);
    }
    // the hint changes the board silently otherwise, so say where it acted
    if (S.hintAt !== null && S.hintAt !== undefined) {
      var hx = (S.hintAt % b.C) + 0.5, hy = Math.floor(S.hintAt / b.C) + 0.5;
      var mark = el('circle', {
        cx: hx, cy: hy, r: 0.42, fill: 'none',
        stroke: 'var(--mint)', 'stroke-width': 0.08
      });
      mark.setAttribute('class', 'pulse');
      svg.appendChild(mark);
      if (S.hintFrom !== null && S.hintFrom !== undefined) {
        var fx = (S.hintFrom % b.C) + 0.5, fy = Math.floor(S.hintFrom / b.C) + 0.5;
        var ux = hx - fx, uy = hy - fy;
        // an arrowhead just inside the hinted square, pointing the way in
        var tipX = hx - ux * 0.30, tipY = hy - uy * 0.30;
        var backX = tipX - ux * 0.20, backY = tipY - uy * 0.20;
        var perpX = -uy * 0.13, perpY = ux * 0.13;
        var head = el('path', {
          d: 'M' + tipX + ' ' + tipY +
             ' L' + (backX + perpX) + ' ' + (backY + perpY) +
             ' L' + (backX - perpX) + ' ' + (backY - perpY) + ' Z',
          fill: 'var(--mint)'
        });
        head.setAttribute('class', 'pulse');
        svg.appendChild(head);
      }
    }
    svg.setAttribute('aria-label', 'Board ' + b.R + ' by ' + b.C + '. ' + S.line.length + ' of ' + b.cells + ' squares filled. Next number ' + (nxt > b.cpCount ? 'none' : nxt) + '.');
  }

  function say(msg) { document.getElementById('say').textContent = msg; }

  // ---------- pointer input ----------
  function cellAt(evt) {
    var svg = document.getElementById('board'), b = S.board;
    var rect = svg.getBoundingClientRect(), pad = 0.45;
    var vw = b.C + pad * 2, vh = b.R + pad * 2;
    // the SVG box may be larger than the drawing, so undo the meet-scaling first
    if (!rect.width || !rect.height) return -1;
    var scale = Math.min(rect.width / vw, rect.height / vh);
    var offX = (rect.width - vw * scale) / 2, offY = (rect.height - vh * scale) / 2;
    var x = (evt.clientX - rect.left - offX) / scale - pad;
    var y = (evt.clientY - rect.top - offY) / scale - pad;
    var c = Math.floor(x), r = Math.floor(y);
    if (r < 0 || c < 0 || r >= b.R || c >= b.C) return -1;
    var i = r * b.C + c;
    return b.open[i] ? i : -1;
  }
  function onDown(e) {
    if (!S || S.over) return;
    var i = cellAt(e);
    if (i < 0) return;
    e.preventDefault();
    document.getElementById('board').setPointerCapture(e.pointerId);
    var pos = S.line.indexOf(i);
    if (pos !== -1) { S.dragging = true; if (pos < S.line.length - 1) { while (S.line.length - 1 > pos) S.line.pop(); afterMove(); } return; }
    if (extend(i)) S.dragging = true;
  }
  function onMove(e) {
    if (!S || !S.dragging || S.over) return;
    if (window.addSparks) window.addSparks(e.clientX, e.clientY);
    var i = cellAt(e);
    if (i < 0) return;
    if (i === S.line[S.line.length - 1]) return;
    if (S.line.length > 1 && i === S.line[S.line.length - 2]) { rubOut(true); return; }
    extend(i);
  }
  function onUp() { if (S) S.dragging = false; }

  // ---------- screens ----------
  function show(id) { applyCosmetics();
    const update = () => {
      ['home', 'play', 'profile'].forEach(function (k) { 
        const el = document.getElementById(k);
        if (el) el.classList.toggle('on', k === id); 
      });
      document.body.classList.toggle('playing', id === 'play');
      window.scrollTo(0, 0);
    };

    if (document.startViewTransition) {
      document.startViewTransition(update);
    } else {
      update();
    }
  }

  var world = 0, worldPinned = false;
  function setWorld(i) {
    world = Math.max(0, Math.min(THEMES.length - 1, i));
    worldPinned = true;
    renderMap();
  }

  function renderMap() {

    var lane = save.lane, st = save[lane], map = document.getElementById('map');
    if (!worldPinned) world = worldOf(st.unlocked);
    applyTheme(world);
    document.getElementById('mapTitle').textContent = LANE[lane].name;
    var solved = Object.keys(st.stars).length;
    var dots = Object.keys(st.stars).reduce(function (a, k) { return a + st.stars[k]; }, 0);
    document.getElementById('mapStat').textContent = solved + ' of ' + LEVELS + ' solved, ' + dots + ' dots';
    var pick = ctaTarget();
    document.getElementById('ctaLabel').textContent = pick.label;

    var th = THEMES[world], first = world * 10 + 1, last = first + 9;
    document.getElementById('wName').textContent = th.n;
    document.getElementById('wRange').textContent = 'Levels ' + first + ' to ' + last;
    document.getElementById('wGlyph').innerHTML = glyph(th.s);
    document.getElementById('prevW').disabled = world === 0;
    document.getElementById('nextW').disabled = world === THEMES.length - 1;

    var pips = document.getElementById('pips');
    pips.innerHTML = '';
    THEMES.forEach(function (t, i) {
      var p = document.createElement('button');
      p.className = (i === world ? 'on' : '') + (i * 10 + 1 > st.unlocked ? ' locked' : '');
      p.setAttribute('aria-label', t.n + ', levels ' + (i * 10 + 1) + ' to ' + (i * 10 + 10));
      p.addEventListener('click', function () { setWorld(i); });
      pips.appendChild(p);
    });

    map.innerHTML = '';
    for (var l = first; l <= last; l++) {
      var b = document.createElement('button');
      b.className = 'node';
      b.style.animationDelay = ((l - first) * 0.04) + 's';
      b.textContent = l;
      var s = st.stars[l] || 0;
      if (l > st.unlocked) { b.classList.add('locked'); b.disabled = true; }
      else if (s) b.classList.add('done');
      else if (l === st.unlocked) b.classList.add('next');
      if (s) {
        var w = document.createElement('span'); w.className = 'st';
        for (var k = 0; k < s; k++) w.appendChild(document.createElement('i'));
        b.appendChild(w);
      }
      b.setAttribute('aria-label', 'Level ' + l + (s ? ', ' + s + ' of 3 dots' : l > st.unlocked ? ', locked' : ', not solved'));
      (function (lv) {
        b.addEventListener('click', function () {
          var snap = resume && resume.lane === save.lane && resume.level === lv ? resume : null;
          startLevel(save.lane, lv, snap);
        });
      })(l);
      map.appendChild(b);
    }
    [].forEach.call(document.querySelectorAll('.lane[data-lane]'), function (el2) {
      var lk = el2.dataset.lane;
      el2.setAttribute('aria-pressed', lk === lane ? 'true' : 'false');
      var solved = Object.keys(save[lk].stars).length;
      var pct = Math.round((solved / LEVELS) * 100);
      var bar = el2.querySelector('.lane-progress');
      if (!bar) {
        bar = document.createElement('div'); bar.className = 'lane-progress';
        var fill = document.createElement('div'); fill.className = 'lane-fill';
        bar.appendChild(fill);
        el2.appendChild(bar);
      }
      bar.querySelector('.lane-fill').style.width = pct + '%';
    });
  }

  function ctaTarget() {
    if (resume && resume.lane === save.lane && resume.line && resume.line.length > 1)
      return { level: resume.level, snap: resume, label: 'Continue level ' + resume.level };
    var st = save[save.lane];
    var lvl = save.last && save.last.lane === save.lane ? Math.max(st.unlocked, 1) : st.unlocked;
    return { level: lvl, snap: null, label: (st.stars[lvl] ? 'Replay level ' : 'Play level ') + lvl };
  }

  // ---------- sound ----------
  // Everything is synthesised in the browser, so the file stays self-contained
  // and works offline once it has been sent on.
  

  // ---------- cosmetics ----------
  // Unlocked with stars and stored in the save, so they follow the player
  // between devices. Anything unrecognised falls back to the stock look.
  var LOOK_CLASS = { pink: 'theme-pink', gold: 'theme-gold' };
  function cosmetics() {
    if (!save.cosmetics) save.cosmetics = { color: 'default', audio: 'default' };
    return save.cosmetics;
  }
  function applyCosmetics() {
    var c = cosmetics();
    Object.keys(LOOK_CLASS).forEach(function (k) {
      document.body.classList.toggle(LOOK_CLASS[k], c.color === k);
    });
    Audio.setTheme(c.audio);
  }

  function soundUI() {
    var on = save.sound !== false;
    ['sndHome', 'sndPlay'].forEach(function (id) {
      var b = document.getElementById(id);
      if (!b) return;
      b.classList.toggle('off', !on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
    });
  }
  function toggleSound() {
    save.sound = save.sound === false;
    persist(); soundUI();
    if (save.sound) Audio.play(); else Audio.stop();
  }

  // ---------- wiring ----------
  document.querySelectorAll('.lane').forEach(function (btn) {
    btn.addEventListener('click', function () { save.lane = btn.dataset.lane; worldPinned = false; persist(); renderMap(); });
  });
  document.getElementById('prevW').addEventListener('click', function () { setWorld(world - 1); });
  document.getElementById('nextW').addEventListener('click', function () { setWorld(world + 1); });
  (function () {
    var x0 = null, m = document.getElementById('map');
    m.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    m.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) setWorld(world + (dx < 0 ? 1 : -1));
    });
  })();
  document.getElementById('sndHome').addEventListener('click', toggleSound);
  document.getElementById('sndPlay').addEventListener('click', toggleSound);
  document.addEventListener('pointerdown', function first() {
    document.removeEventListener('pointerdown', first);
    if (save.sound !== false) Audio.play();
  }, { passive: true });

  document.getElementById('cta').addEventListener('click', function () {
    var pick = ctaTarget();
    startLevel(save.lane, pick.level, pick.snap);
  });
  document.getElementById('back').addEventListener('click', function () {
    saveResume(true); clearInterval(timer); S = null; renderMap(); show('home');
  });

  var profBack = document.getElementById('profBack');
  if (profBack) profBack.addEventListener('click', function () { show('home'); });
  
  var whoEl = document.getElementById('who');
  if (whoEl) whoEl.addEventListener('click', function () { 
    if (this.textContent) {
      window.Thread.renderProfile();
      show('profile'); 
    }
  });



  document.getElementById('reset').addEventListener('click', function () { if (S) startLevel(S.lane, S.level); });
  document.getElementById('undo').addEventListener('click', function () { if (S && !S.over) rubOut(false); });
  document.getElementById('hint').addEventListener('click', function () { if (S && !S.over) useHint(); });
  function clearAllProgress() {
    if (!confirm('Are you sure you want to clear all your saved progress? This cannot be undone.')) return;
    if (cloud && cloud.wipe) cloud.wipe();
    // keep the sound preference: it is a setting, not progress
    save = { lane: save.lane, sound: save.sound, cosmetics: { color: 'default', audio: 'default' },
             easy: mkLane(), medium: mkLane(), hard: mkLane(), pro: mkLane() };
    applyCosmetics();
    clearResume(); persist(); renderMap();
    if (window.Thread && window.Thread.renderProfile) window.Thread.renderProfile();
    say('Saved progress cleared.');
  }
  document.getElementById('resetAll').addEventListener('click', clearAllProgress);
  var profReset = document.getElementById('profReset');
  if (profReset) profReset.addEventListener('click', clearAllProgress);

  var board = document.getElementById('board');
  board.addEventListener('pointerdown', onDown);
  board.addEventListener('pointermove', onMove);
  board.addEventListener('pointerup', onUp);
  board.addEventListener('pointercancel', onUp);


  document.getElementById('ovAgain').addEventListener('click', function () {
    document.getElementById('over').classList.remove('on');
    startLevel(S.lane, S.level);
  });
  document.getElementById('ovNext').addEventListener('click', function () {
    document.getElementById('over').classList.remove('on');
    if (S.won && S.level < LEVELS) startLevel(S.lane, S.level + 1);
    else if (S.won) { renderMap(); show('home'); }
    else { renderMap(); show('home'); }
  });

  document.addEventListener('keydown', function (e) {
    if (!S || S.over || document.getElementById('play').classList.contains('on') === false) return;
    var b = S.board, head = S.line[S.line.length - 1], to = null;
    if (e.key === 'ArrowUp') to = head - b.C;
    else if (e.key === 'ArrowDown') to = head + b.C;
    else if (e.key === 'ArrowLeft') to = head - 1;
    else if (e.key === 'ArrowRight') to = head + 1;
    else if (e.key === 'Backspace') { e.preventDefault(); rubOut(false); return; }
    else if (e.key === 'r' || e.key === 'R') { startLevel(S.lane, S.level); return; }
    else if (e.key === 'h' || e.key === 'H') { useHint(); return; }
    else return;
    e.preventDefault();
    if (to === null) return;
    if (S.line.length > 1 && to === S.line[S.line.length - 2]) rubOut(true);
    else extend(to);
  });

  window.__thread = { storeKind: function () { return store.kind; }, start: startLevel, state: function () { return S; }, extend: extend, rub: rubOut, hint: useHint, decode: decode, save: save, merge: mergeSaves };
  window.addEventListener('pagehide', function () { saveResume(true); persist(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      pauseClock(); saveResume(true); persist(); Audio.stop();
    } else {
      resumeClock();
      if (save.sound !== false) Audio.play();
    }
  });

  // ---------- the handle sync.js drives ----------
  window.Thread = {
    boot: function () {
      return load().then(function () {
        soundUI();
        worldPinned = false;
        renderMap();
        if (store.kind === 'memory') {
          document.querySelector('.foot').insertAdjacentHTML('afterbegin',
            '<p style="margin:0 0 8px">This browser is blocking saved data, so progress will not survive a refresh.</p>');
        }
        show('home');
        var warm = function () { ensureBoards().catch(function () {}); };
        if (window.requestIdleCallback) window.requestIdleCallback(warm, { timeout: 2500 });
        else setTimeout(warm, 400);
      });
    },
    setCloud: function (c) { cloud = c; },
    merge: mergeSaves,
    getSave: function () { return save; },
    getResume: function () { return resume; },
    applyRemote: function (remoteSave, remoteResume) {
      if (remoteSave) {
        save = mergeSaves(save, remoteSave);
        store.set(SAVE_KEY, JSON.stringify(save));
      }
      if (remoteResume && (!resume || (remoteResume.at || 0) > (resume.at || 0))) {
        resume = remoteResume;
        store.set(RESUME_KEY, JSON.stringify(resume));
      }
      applyCosmetics();
      if (!S) { soundUI(); worldPinned = false; renderMap(); }
    },
    signedOut: function () {
      cloud = null;
      clearInterval(timer);
      S = null;
      Audio.stop();
      save = { lane: 'medium', seq: 0, updatedAt: 0, cosmetics: { color: 'default', audio: 'default' },
               easy: mkLane(), medium: mkLane(), hard: mkLane(), pro: mkLane() };
      loaded = true;                         // signing out means to write this
      applyCosmetics();
      resume = null;
      store.set(SAVE_KEY, '');
      store.set(RESUME_KEY, '');
      worldPinned = false;
      renderMap();
      show('home');
    },
    show: show,
    renderProfile: function() {
      const stats = document.getElementById('profStats');
      if (!stats) return;
      
      const countStars = (st) => Object.values(st.stars || {}).reduce((a, b) => a + b, 0);
      const countSolved = (st) => Object.keys(st.stars || {}).length;
      
      
      // Unlocked looks. The buttons are hidden, not greyed, until they are
      // earned, so the profile never advertises a locked reward.
      var c = cosmetics();
      var totalStars = ['easy', 'medium', 'hard', 'pro'].reduce(function (acc, lane) {
        return acc + countStars(save[lane]);
      }, 0);
      var LOCKS = { themePink: 20, themeGold: 50, audio8Bit: 100 };
      var nextAt = 0;
      Object.keys(LOCKS).forEach(function (id) {
        var b = document.getElementById(id);
        var earned = totalStars >= LOCKS[id];
        if (b) b.hidden = !earned;
        if (!earned && (!nextAt || LOCKS[id] < nextAt)) nextAt = LOCKS[id];
      });
      var note = document.getElementById('profRewardsNote');
      if (note) note.textContent = nextAt
        ? (nextAt - totalStars) + ' more ' + (nextAt - totalStars === 1 ? 'star' : 'stars') + ' unlocks the next look.'
        : 'Every look is unlocked. Nicely done.';

      document.querySelectorAll('#profRewards .swatch').forEach(function (b) {
        var kind = b.dataset.color ? 'color' : 'audio';
        b.classList.toggle('on', c[kind] === b.dataset[kind]);
        b.onclick = function () {
          c[kind] = b.dataset[kind];
          persist();
          applyCosmetics();
          window.Thread.renderProfile();
        };
      });

      stats.innerHTML = ['easy', 'medium', 'hard', 'pro'].map(lane => {
        const data = save[lane];
        const stars = countStars(data);
        const solved = countSolved(data);
        const laneName = lane.charAt(0).toUpperCase() + lane.slice(1);
        
        return `
          <div class="lane" style="display: block; flex: 1;">
            <b>${laneName}</b>
            <div style="font-size: 14px; margin-top: 8px;">
              <div>Levels Unlocked: <strong data-count="${data.unlocked}">0</strong></div>
              <div>Levels Solved: <strong data-count="${solved}">0</strong></div>
              <div>Stars Earned: <strong data-count="${stars}">0</strong></div>
            </div>
          </div>
        `;
      }).join('');

      // The other two games live in the same save, so the profile shows them
      // beside the lanes rather than pretending the app is only one game.
      const games = document.getElementById('profGames');
      if (games) {
        const NAMES = {};
        games.innerHTML = GAMES.map(function (k) {
          const data = save[k] || mkGame();
          return `
          <div class="lane" style="display: block; flex: 1;">
            <b>${NAMES[k]}</b>
            <div style="font-size: 14px; margin-top: 8px;">
              <div>Levels Solved: <strong data-count="${countSolved(data)}">0</strong></div>
            </div>
          </div>
        `;
        }).join('');
      }

      const counters = [...stats.querySelectorAll('[data-count]'),
                        ...(games ? games.querySelectorAll('[data-count]') : [])];
      counters.forEach(function(el, idx) {
        var target = parseInt(el.dataset.count, 10);
        if (target === 0) return;
        var dur = 600, start = performance.now();
        function tick(now) {
          var t = Math.min((now - start) / dur, 1);
          t = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(t * target);
          if (t < 1) requestAnimationFrame(tick);
        }
        setTimeout(function() { requestAnimationFrame(tick); }, idx * 80);
      });
    }
  };

  // Sparkles
  var sparkCanvas = document.getElementById('sparks');
  var sparkCtx = sparkCanvas ? sparkCanvas.getContext('2d') : null;
  var sparks = [];
  function resizeSparks() {
    if (sparkCanvas) {
      sparkCanvas.width = window.innerWidth;
      sparkCanvas.height = window.innerHeight;
    }
  }
  window.addEventListener('resize', resizeSparks);
  resizeSparks();
  window.addSparks = function(x, y) {
    if (!sparkCtx) return;
    for(var i=0; i<3; i++) {
      sparks.push({x: x, y: y, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3, life: 1, color: Math.random() > 0.5 ? '#00FFC8' : '#FFFFFF'});
    }
  };
  function drawSparks() {
    if (!sparkCtx) return;
    sparkCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    for(var i=sparks.length-1; i>=0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.life -= 0.04;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      sparkCtx.fillStyle = s.color;
      sparkCtx.globalAlpha = s.life;
      sparkCtx.beginPath();
      sparkCtx.arc(s.x, s.y, 1.5, 0, Math.PI*2);
      sparkCtx.fill();
    }
    sparkCtx.globalAlpha = 1;
    requestAnimationFrame(drawSparks);
  }
  if (sparkCtx) requestAnimationFrame(drawSparks);

