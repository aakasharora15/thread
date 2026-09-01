import { Audio } from './audio.js';
import { Toast } from './toast.js';

// Levels are authored in a fixed 400 x 700 design space and scaled to whatever
// the device gives us, so a level plays the same on every screen.
const DESIGN_W = 400, DESIGN_H = 700;

let engine, render, runner, teardown = null, retryTimer = null;
let currentLevel = 0;

const LEVELS = [
  { // Level 1: Simple single cut to drop
    anchors: [{ x: 200, y: 100 }],
    spool: { x: 200, y: 300 },
    strings: [{ a: 0, b: 'spool' }],
    target: { x: 200, y: 550, r: 30 },
    obstacles: []
  },
  { // Level 2: Pendulum swing
    anchors: [{ x: 100, y: 100 }, { x: 300, y: 100 }],
    spool: { x: 150, y: 300 },
    strings: [{ a: 0, b: 'spool' }, { a: 1, b: 'spool' }],
    target: { x: 300, y: 550, r: 30 },
    obstacles: []
  },
  { // Level 3: Dual swing
    anchors: [{ x: 100, y: 100 }, { x: 300, y: 200 }],
    spool: { x: 200, y: 300 },
    strings: [{ a: 0, b: 'spool' }, { a: 1, b: 'spool' }],
    target: { x: 100, y: 600, r: 30 },
    obstacles: []
  },
  { // Level 4: Avoid the blades
    anchors: [{ x: 200, y: 100 }, { x: 350, y: 150 }],
    spool: { x: 250, y: 250 },
    strings: [{ a: 0, b: 'spool' }, { a: 1, b: 'spool' }],
    target: { x: 200, y: 600, r: 30 },
    obstacles: [{ x: 200, y: 450, w: 100, h: 20, isStatic: true, isBlade: true }]
  },
  { // Level 5: Double drop
    anchors: [{ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 200, y: 350 }],
    spool: { x: 200, y: 200 },
    strings: [{ a: 0, b: 'spool' }, { a: 1, b: 'spool' }, { a: 2, b: 'spool' }],
    target: { x: 200, y: 650, r: 30 },
    obstacles: []
  }
];

export function startSnip(level) {
  stopSnip();                                  // never leave an old world running

  const container = document.getElementById('snip-container');
  if (!container) return;

  // Matter is a CDN script. If it did not arrive, say so rather than leaving
  // the player tapping a blank stage.
  if (typeof Matter === 'undefined') {
    container.innerHTML = '<p class="stagefail">This game needs a connection the first time it loads. ' +
      'Check your signal and open it again.</p>';
    return;
  }

  currentLevel = level;
  const lvl = LEVELS[level - 1];
  if (!lvl) return;

  const { Engine, Render, Runner, Bodies, Composite, Constraint, Events, Vector } = Matter;

  // Fit the design box inside the stage and centre it, so nothing is cropped
  // on a short screen or stranded in a corner on a wide one.
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;
  const scale = Math.min(width / DESIGN_W, height / DESIGN_H);
  const offX = (width - DESIGN_W * scale) / 2;
  const offY = (height - DESIGN_H * scale) / 2;
  const tx = x => offX + x * scale;
  const ty = y => offY + y * scale;
  const ts = v => v * scale;                   // lengths, not positions

  engine = Engine.create();
  render = Render.create({
    element: container,
    engine: engine,
    options: { width, height, wireframes: false, background: 'transparent', pixelRatio: window.devicePixelRatio || 1 }
  });

  const bodies = [];
  const anchors = [];

  const targetEye = Bodies.circle(tx(lvl.target.x), ty(lvl.target.y), ts(lvl.target.r), {
    isStatic: true, isSensor: true,
    render: { fillStyle: 'transparent', strokeStyle: '#E6B800', lineWidth: 4 }
  });
  bodies.push(targetEye);

  lvl.anchors.forEach(a => {
    const anchor = Bodies.circle(tx(a.x), ty(a.y), ts(8), { isStatic: true, render: { fillStyle: '#888' } });
    anchors.push(anchor);
    bodies.push(anchor);
  });

  const spool = Bodies.circle(tx(lvl.spool.x), ty(lvl.spool.y), ts(15), {
    restitution: 0.8, frictionAir: 0.01, render: { fillStyle: '#FF107A' }
  });
  bodies.push(spool);

  lvl.obstacles.forEach(o => {
    bodies.push(Bodies.rectangle(tx(o.x), ty(o.y), ts(o.w), ts(o.h), {
      isStatic: true,
      label: o.isBlade ? 'blade' : 'wall',
      render: { fillStyle: o.isBlade ? '#C0392B' : '#555' }
    }));
  });

  const constraints = [];
  lvl.strings.forEach(s => {
    const c = Constraint.create({
      bodyA: s.a === 'spool' ? spool : anchors[s.a],
      bodyB: s.b === 'spool' ? spool : anchors[s.b],
      stiffness: 0.1,
      // Matter draws a slack constraint as a coiled spring. These are strings,
      // and the game asks you to cut them, so draw them as lines.
      render: { strokeStyle: '#ccc', lineWidth: 2, type: 'line' }
    });
    constraints.push(c);
    bodies.push(c);
  });

  Composite.add(engine.world, bodies);
  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine);

  // ---------- cutting ----------
  let isDown = false, lastPos = null;

  function point(e) {
    const r = container.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }
  const onDown = e => { isDown = true; lastPos = point(e); };
  const onMove = e => {
    if (!isDown || !lastPos) return;
    e.preventDefault();                        // a cut is a cut, not a page scroll
    const now = point(e);
    for (let i = constraints.length - 1; i >= 0; i--) {
      const c = constraints[i];
      if (!c.bodyA || !c.bodyB) continue;
      if (intersects(lastPos, now, c.bodyA.position, c.bodyB.position)) {
        Composite.remove(engine.world, c);
        constraints.splice(i, 1);
        Audio.step(0);
      }
    }
    lastPos = now;
  };
  const onUp = () => { isDown = false; lastPos = null; };

  container.addEventListener('mousedown', onDown);
  container.addEventListener('mousemove', onMove);
  container.addEventListener('mouseup', onUp);
  container.addEventListener('touchstart', onDown, { passive: true });
  container.addEventListener('touchmove', onMove, { passive: false });
  container.addEventListener('touchend', onUp);

  // ---------- win and loss ----------
  let over = false;
  const winR = ts(lvl.target.r);

  const tick = () => {
    if (over) return;
    if (spool.position.y > height + 100 || spool.position.x < -100 || spool.position.x > width + 100) {
      over = true;
      Audio.fail();
      Toast.show('The spool got away. Trying again.');
      retryTimer = setTimeout(() => startSnip(currentLevel), 1400);
      return;
    }
    if (Vector.magnitude(Vector.sub(spool.position, targetEye.position)) < winR) {
      over = true;
      Audio.win();
      Toast.show('Stitched.');
      window.Thread.winSnip(currentLevel);
      retryTimer = setTimeout(() => { stopSnip(); window.Thread.show('home'); }, 1400);
    }
  };

  const onHit = event => {
    if (over) return;
    for (const pair of event.pairs) {
      const other = pair.bodyA === spool ? pair.bodyB : pair.bodyB === spool ? pair.bodyA : null;
      if (other && other.label === 'blade') {
        over = true;
        Audio.fail();
        Toast.show('Cut by the blade. Trying again.');
        retryTimer = setTimeout(() => startSnip(currentLevel), 1400);
        return;
      }
    }
  };

  Events.on(engine, 'beforeUpdate', tick);
  Events.on(engine, 'collisionStart', onHit);

  teardown = () => {
    container.removeEventListener('mousedown', onDown);
    container.removeEventListener('mousemove', onMove);
    container.removeEventListener('mouseup', onUp);
    container.removeEventListener('touchstart', onDown);
    container.removeEventListener('touchmove', onMove);
    container.removeEventListener('touchend', onUp);
    Events.off(engine, 'beforeUpdate', tick);
    Events.off(engine, 'collisionStart', onHit);
  };
}

export function stopSnip() {
  clearTimeout(retryTimer);
  retryTimer = null;
  if (teardown) { teardown(); teardown = null; }
  if (render) { Matter.Render.stop(render); render = null; }
  if (runner) { Matter.Runner.stop(runner); runner = null; }
  if (engine) { Matter.Engine.clear(engine); engine = null; }
  const container = document.getElementById('snip-container');
  if (container) container.innerHTML = '';
}

// Do two segments cross?
//
// The bounds are inclusive on purpose. A drag arrives as a run of separate
// samples with integer coordinates, and a string sits on an exact coordinate
// too, so a swipe straight through one lands on the shared endpoint of two
// consecutive samples far more often than chance suggests. With strict bounds
// that crossing belongs to neither segment and the cut is silently dropped.
function intersects(a, b, c, d) {
  const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (det === 0) return false;                 // parallel
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
  return lambda >= 0 && lambda <= 1 && gamma >= 0 && gamma <= 1;
}
