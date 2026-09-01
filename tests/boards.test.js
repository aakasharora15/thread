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
