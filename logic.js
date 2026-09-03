// Pure game logic, kept apart from the DOM so it can be exercised by
// tests/ under plain node as well as loaded by the browser.
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ThreadLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function mkLane() { return { unlocked: 1, stars: {}, streak: 0, bank: 0 }; }

  // Snip & Stitch and Loom Logic keep the same shape as a lane, minus the
  // streak and bank the classic game tracks. One save holds all three games,
  // so one account carries the whole app.
  var GAMES = [];
  function mkGame() { return { unlocked: 1, stars: {} }; }

  // Highest wins, level by level: the same rule the lanes play by.
  function mergeProgress(x, y, blank) {
    var out = blank();
    out.unlocked = Math.max(x.unlocked || 1, y.unlocked || 1);
    out.stars = {};
    Object.keys(x.stars || {}).forEach(function (l) { out.stars[l] = x.stars[l]; });
    Object.keys(y.stars || {}).forEach(function (l) {
      out.stars[l] = Math.max(out.stars[l] || 0, y.stars[l]);
    });
    return out;
  }

  // Progress only ever moves forward, so merging two copies means taking the
  // higher of each value. Nobody's run can be eaten by another device.
  function mergeSaves(a, b) {
    if (!a) return b;
    if (!b) return a;
    var out = { seq: Math.max(a.seq || 0, b.seq || 0), updatedAt: Math.max(a.updatedAt || 0, b.updatedAt || 0) };
    var newer = (b.updatedAt || 0) >= (a.updatedAt || 0) ? b : a;
    out.lane = newer.lane || a.lane || 'medium';
    out.sound = newer.sound;
    out.last = newer.last || a.last || b.last;
    out.cosmetics = newer.cosmetics || a.cosmetics || b.cosmetics || { color: 'default', audio: 'default' };
    ['easy', 'medium', 'hard', 'pro'].forEach(function (k) {
      var x = a[k] || mkLane(), y = b[k] || mkLane();
      var lane = mergeProgress(x, y, mkLane);
      lane.streak = Math.max(x.streak || 0, y.streak || 0);
      lane.bank = Math.max(x.bank || 0, y.bank || 0);
      out[k] = lane;
    });
    GAMES.forEach(function (k) {
      out[k] = mergeProgress(a[k] || mkGame(), b[k] || mkGame(), mkGame);
    });
    return out;
  }

  // How many times the solution changes direction. It stands in for how fiddly
  // a board is to draw, which is what the third star's time target is really
  // measuring, and unlike the level number it is a property of the board.
  function countTurns(d) {
    var n = 0;
    for (var i = 1; i < d.length; i++) if (d[i] !== d[i - 1]) n++;
    return n;
  }

  // One packed board record becomes the shape the game plays against.
  function decodeBoard(b) {
    var R = b.r, C = b.c;
    var open = [];
    for (var i = 0; i < R * C; i++) open.push(true);
    if (b.k) {
      for (var r = R - b.k[0]; r < R; r++) for (var c = C - b.k[1]; c < C; c++) open[r * C + c] = false;
    }
    var path = [b.s];
    for (var d = 0; d < b.d.length; d++) {
      var ch = b.d[d], last = path[path.length - 1];
      path.push(last + (ch === 'R' ? 1 : ch === 'L' ? -1 : ch === 'D' ? C : -C));
    }
    var cp = new Array(R * C).fill(0);
    b.q.forEach(function (pos, k) { cp[path[pos]] = k + 1; });
    var walls = new Set();
    b.w.forEach(function (code) {
      var lo = code >> 1, hi = (code & 1) ? lo + C : lo + 1;
      walls.add(lo + ',' + hi);
    });
    return {
      R: R, C: C, open: open, cp: cp, cpCount: b.q.length, walls: walls,
      cells: path.length, solution: path, start: path[0], end: path[path.length - 1],
      index: b.x, turns: countTurns(b.d)
    };
  }

  // Everything the shipped solution has to satisfy for the board to be
  // playable. Returns a list of complaints, empty when the board is sound.
  function validateBoard(bd) {
    var bad = [], i, openCount = 0;
    for (i = 0; i < bd.open.length; i++) if (bd.open[i]) openCount++;

    var seen = Object.create(null);
    for (i = 0; i < bd.solution.length; i++) {
      var cell = bd.solution[i];
      if (cell < 0 || cell >= bd.open.length) bad.push('cell ' + cell + ' is off the board');
      else if (!bd.open[cell]) bad.push('cell ' + cell + ' is closed but the path uses it');
      if (seen[cell]) bad.push('cell ' + cell + ' is visited twice');
      seen[cell] = true;
    }
    if (bd.solution.length !== openCount) {
      bad.push('path covers ' + bd.solution.length + ' of ' + openCount + ' open squares');
    }

    for (i = 1; i < bd.solution.length; i++) {
      var p = bd.solution[i - 1], q = bd.solution[i];
      var dr = Math.floor(q / bd.C) - Math.floor(p / bd.C);
      var dc = (q % bd.C) - (p % bd.C);
      if (Math.abs(dr) + Math.abs(dc) !== 1) bad.push('step ' + i + ' is not to an edge neighbour');
      if (bd.walls.has(p < q ? p + ',' + q : q + ',' + p)) bad.push('step ' + i + ' crosses a wall');
    }

    var order = [];
    for (i = 0; i < bd.solution.length; i++) {
      var n = bd.cp[bd.solution[i]];
      if (n) order.push(n);
    }
    if (order.length !== bd.cpCount) bad.push('path meets ' + order.length + ' of ' + bd.cpCount + ' numbers');
    for (i = 0; i < order.length; i++) {
      if (order[i] !== i + 1) { bad.push('numbers are met out of order'); break; }
    }
    return bad;
  }

  return { mkLane: mkLane, mkGame: mkGame, GAMES: GAMES, mergeSaves: mergeSaves,
           decodeBoard: decodeBoard, validateBoard: validateBoard };
});
