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

test('the newer copy decides which look is worn', () => {
  const older = save({ updatedAt: 100, cosmetics: { color: 'pink', audio: 'default' } });
  const newer = save({ updatedAt: 900, cosmetics: { color: 'gold', audio: '8bit' } });
  assert.deepStrictEqual(mergeSaves(older, newer).cosmetics, { color: 'gold', audio: '8bit' });
  assert.deepStrictEqual(mergeSaves(newer, older).cosmetics, { color: 'gold', audio: '8bit' });
});

test('a save from before looks existed still merges', () => {
  const out = mergeSaves(save({ updatedAt: 100 }), save({ updatedAt: 900 }));
  assert.deepStrictEqual(out.cosmetics, { color: 'default', audio: 'default' });
});

test('the other two games merge by the same rule as the lanes', () => {
  const a = save({ updatedAt: 100, snip: { unlocked: 3, stars: { 1: 1, 2: 1 } }, loom: { unlocked: 1, stars: {} } });
  const b = save({ updatedAt: 900, snip: { unlocked: 2, stars: { 1: 1 } }, loom: { unlocked: 4, stars: { 1: 1, 3: 1 } } });
  const out = mergeSaves(a, b);
  assert.deepStrictEqual(out.snip, { unlocked: 3, stars: { 1: 1, 2: 1 } });
  assert.deepStrictEqual(out.loom, { unlocked: 4, stars: { 1: 1, 3: 1 } });
  // and it cannot matter which way round the two copies arrive
  assert.deepStrictEqual(mergeSaves(b, a), out);
});

test('a save from before the other two games existed still merges', () => {
  const out = mergeSaves(save({ updatedAt: 100 }), save({ updatedAt: 900 }));
  assert.deepStrictEqual(out.snip, { unlocked: 1, stars: {} });
  assert.deepStrictEqual(out.loom, { unlocked: 1, stars: {} });
});

test('a device that has been offline cannot roll the other games back', () => {
  const behind = save({ updatedAt: 5000, snip: { unlocked: 1, stars: {} } });
  const ahead = save({ updatedAt: 10, snip: { unlocked: 5, stars: { 1: 1, 2: 1, 3: 1, 4: 1 } } });
  assert.strictEqual(mergeSaves(behind, ahead).snip.unlocked, 5);
});
