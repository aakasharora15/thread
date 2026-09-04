// Every shipped board must be solvable exactly as claimed. This is the check
// that would catch a bad regeneration of boards.js before players hit it.
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { decodeBoard, validateBoard } = require('../logic.js');

global.window = {};
require(path.join(__dirname, '..', 'boards.js'));
const BOARDS = global.window.THREAD_BOARDS;

test('boards.js loads and carries all three lanes', () => {
  assert.ok(BOARDS, 'THREAD_BOARDS is missing');
  for (const lane of ['easy', 'medium', 'hard']) {
    assert.strictEqual(BOARDS[lane].length, 200, lane + ' should hold 200 boards');
  }
});

for (const lane of ['easy', 'medium', 'hard']) {
  test(lane + ': all 200 solutions are valid', () => {
    const broken = [];
    BOARDS[lane].forEach((raw, i) => {
      const problems = validateBoard(decodeBoard(raw));
      if (problems.length) broken.push('level ' + (i + 1) + ': ' + problems.join('; '));
    });
    assert.deepStrictEqual(broken, [], broken.slice(0, 5).join('\n'));
  });
}

test('every board starts on 1 and ends on the highest number', () => {
  const wrong = [];
  for (const lane of ['easy', 'medium', 'hard']) {
    BOARDS[lane].forEach((raw, i) => {
      const b = decodeBoard(raw);
      if (b.cp[b.start] !== 1) wrong.push(lane + ' ' + (i + 1) + ' does not start on 1');
      if (b.cp[b.end] !== b.cpCount) wrong.push(lane + ' ' + (i + 1) + ' does not end on ' + b.cpCount);
    });
  }
  assert.deepStrictEqual(wrong, [], wrong.slice(0, 5).join('\n'));
});

test('every board reports how often its solution turns', () => {
  for (const lane of ['easy', 'medium', 'hard']) {
    for (const raw of BOARDS[lane]) {
      const bd = decodeBoard(raw);
      assert.ok(Number.isInteger(bd.turns), lane + ': turns must be a whole number');
      assert.ok(bd.turns > 0 && bd.turns < bd.cells,
        lane + ': ' + bd.turns + ' turns is not possible in ' + bd.cells + ' cells');
    }
  }
});

test('the time target tracks the board, not the level number', () => {
  // The regression this guards: board.index became the level index, so par
  // climbed to ten minutes by level 200 and gave the first levels no slack.
  const parBase = { easy: 1.6, medium: 2.0, hard: 2.4 };
  for (const lane of ['easy', 'medium', 'hard']) {
    const pars = BOARDS[lane].map(raw => {
      const bd = decodeBoard(raw);
      return Math.round(bd.cells * parBase[lane] + bd.turns * 1.5);
    });
    assert.ok(Math.min(...pars) > 25, lane + ': a target of ' + Math.min(...pars) + 's is unreachable');
    assert.ok(Math.max(...pars) < 330, lane + ': a target of ' + Math.max(...pars) + 's is free');
  }
});

// The Pro lane once shipped as a single boustrophedon - down, right one, up,
// right one - with no walls at all: 200 levels cut from 15 distinct puzzles,
// and a lane that took less thought than Easy. Nothing caught it because every
// board was individually valid. These check the shape of the difficulty, not
// just the legality of each board.

function turnRate(raw) {
  const d = raw.d;
  let t = 0;
  for (let i = 1; i < d.length; i++) if (d[i] !== d[i - 1]) t++;
  return t / (d.length + 1);
}
const median = xs => xs.slice().sort((a, b) => a - b)[xs.length >> 1];

test('no lane is built from a handful of repeated solutions', () => {
  for (const lane of ['easy', 'medium', 'hard', 'pro']) {
    const shapes = new Set(BOARDS[lane].map(b => b.d)).size;
    assert.ok(shapes > BOARDS[lane].length / 2,
      lane + ' has only ' + shapes + ' distinct solutions across ' + BOARDS[lane].length + ' levels');
  }
});

test('the harder the lane, the more the line has to turn', () => {
  const rates = ['easy', 'medium', 'hard', 'pro'].map(l => median(BOARDS[l].map(turnRate)));
  const pro = rates[3];
  assert.ok(pro > 0.5, 'Pro turns on only ' + pro.toFixed(3) + ' of its cells; a serpentine scores about 0.16');
  assert.ok(pro >= Math.max(...rates.slice(0, 3)),
    'Pro is straighter than an easier lane: ' + rates.map(r => r.toFixed(3)).join(', '));
});

test('Pro is walled at least as tightly as Hard', () => {
  const density = lane => median(BOARDS[lane].map(b => b.w.length / (b.r * b.c)));
  const pro = density('pro'), hard = density('hard');
  assert.ok(pro > 0, 'Pro has no walls at all, so nothing constrains the line');
  assert.ok(pro >= hard, 'Pro walls ' + pro.toFixed(2) + '/cell vs Hard ' + hard.toFixed(2) + '/cell');
});

test('Pro leaves the longest stretches between numbers', () => {
  const gap = lane => median(BOARDS[lane].map(b => (b.d.length + 1) / b.q.length));
  assert.ok(gap('pro') > gap('hard'),
    'Pro is guided more closely than Hard: ' + gap('pro').toFixed(1) + ' vs ' + gap('hard').toFixed(1) + ' cells per number');
});
