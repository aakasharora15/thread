// Merging must never lose a run: progress only moves forward.
const { test } = require('node:test');
const assert = require('node:assert');
const { mergeSaves, mkLane } = require('../logic.js');

function save(over) {
  return Object.assign({ lane: 'medium', seq: 0, updatedAt: 0, easy: mkLane(), medium: mkLane(), hard: mkLane() }, over);
}

test('a missing side leaves the other untouched', () => {
  const a = save({ seq: 4 });
  assert.deepStrictEqual(mergeSaves(a, null), a);
  assert.deepStrictEqual(mergeSaves(null, a), a);
});

test('the furthest level unlocked wins, whichever copy holds it', () => {
  const a = save({ easy: Object.assign(mkLane(), { unlocked: 40 }) });
  const b = save({ easy: Object.assign(mkLane(), { unlocked: 12 }) });
  assert.strictEqual(mergeSaves(a, b).easy.unlocked, 40);
  assert.strictEqual(mergeSaves(b, a).easy.unlocked, 40);
});

test('the better score on each level survives', () => {
  const a = save({ hard: Object.assign(mkLane(), { stars: { 1: 3, 2: 1 } }) });
  const b = save({ hard: Object.assign(mkLane(), { stars: { 2: 3, 5: 2 } }) });
  assert.deepStrictEqual(mergeSaves(a, b).hard.stars, { 1: 3, 2: 3, 5: 2 });
});

test('a stale copy cannot pull progress backwards', () => {
  const fresh = save({ updatedAt: 900, medium: Object.assign(mkLane(), { unlocked: 60, stars: { 7: 3 } }) });
  const stale = save({ updatedAt: 100, medium: Object.assign(mkLane(), { unlocked: 3, stars: { 7: 1 } }) });
  const out = mergeSaves(fresh, stale);
  assert.strictEqual(out.medium.unlocked, 60);
  assert.strictEqual(out.medium.stars[7], 3);
});

test('merging is order independent for progress', () => {
  const a = save({ updatedAt: 5, easy: Object.assign(mkLane(), { unlocked: 9, stars: { 1: 2 }, streak: 4 }) });
  const b = save({ updatedAt: 7, easy: Object.assign(mkLane(), { unlocked: 4, stars: { 1: 3, 2: 1 }, bank: 2 }) });
  assert.deepStrictEqual(mergeSaves(a, b).easy, mergeSaves(b, a).easy);
});

test('seq climbs to the higher of the two', () => {
  assert.strictEqual(mergeSaves(save({ seq: 2 }), save({ seq: 11 })).seq, 11);
});
