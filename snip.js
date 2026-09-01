import { Audio } from './audio.js';
import { Toast } from './toast.js';

let engine, render, runner;
let currentLevelIndex = 0;
let spool, targetEye;

// 5 Starter Levels for Snip & Stitch
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
  currentLevelIndex = level;
  const container = document.getElementById('snip-container');
  container.innerHTML = '';
  document.getElementById('play-snip').classList.add('on');
  document.getElementById('home').classList.remove('on');

  const Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        Bodies = Matter.Bodies,
        Composite = Matter.Composite,
        Constraint = Matter.Constraint,
        Events = Matter.Events,
        Vector = Matter.Vector;

  engine = Engine.create();
  
  // Create renderer scaling to screen
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = width / 400; // design width is 400

  render = Render.create({
    element: container,
    engine: engine,
    options: {
      width: width,
      height: height,
      wireframes: false,
      background: 'transparent'
    }
  });

  const lvl = LEVELS[level - 1];
  
  // Transform design coordinates to screen coordinates
  const tx = (x) => x * scale;
  const ty = (y) => y * scale;

  const bodies = [];
  const anchors = [];

  // Add Target (Sensor)
  targetEye = Bodies.circle(tx(lvl.target.x), ty(lvl.target.y), tx(lvl.target.r), {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: 'transparent', strokeStyle: '#E6B800', lineWidth: 4 }
  });
  bodies.push(targetEye);

  // Add Anchors
  lvl.anchors.forEach(a => {
    const anchor = Bodies.circle(tx(a.x), ty(a.y), tx(8), { 
      isStatic: true, 
      render: { fillStyle: '#888' } 
    });
    anchors.push(anchor);
    bodies.push(anchor);
  });

  // Add Spool
  spool = Bodies.circle(tx(lvl.spool.x), ty(lvl.spool.y), tx(15), {
    restitution: 0.8,
    frictionAir: 0.01,
    render: { fillStyle: '#FF107A' }
  });
  bodies.push(spool);

  // Add Obstacles
  lvl.obstacles.forEach(o => {
    const obs = Bodies.rectangle(tx(o.x), ty(o.y), tx(o.w), tx(o.h), {
      isStatic: true,
      label: o.isBlade ? 'blade' : 'wall',
      render: { fillStyle: o.isBlade ? '#C0392B' : '#555' }
    });
    bodies.push(obs);
  });

  // Add Strings
  const constraints = [];
  lvl.strings.forEach(s => {
    const bodyA = s.a === 'spool' ? spool : anchors[s.a];
    const bodyB = s.b === 'spool' ? spool : anchors[s.b];
    const c = Constraint.create({
      bodyA: bodyA,
      bodyB: bodyB,
      stiffness: 0.1,
      render: { strokeStyle: '#ccc', lineWidth: 2 }
    });
    constraints.push(c);
    bodies.push(c);
  });

  Composite.add(engine.world, bodies);
  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine);

  // Interaction: Swipe to cut
  let isDown = false;
  let lastPos = null;

  const handlePointerDown = (e) => {
    isDown = true;
    lastPos = { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY };
  };

  const handlePointerMove = (e) => {
    if (!isDown || !lastPos) return;
    const currentPos = { x: e.touches ? e.touches[0].clientX : e.clientX, y: e.touches ? e.touches[0].clientY : e.clientY };
    
    // Check intersection with constraints
    constraints.forEach(c => {
      if (!c.bodyA || !c.bodyB) return;
      // Simple line-line intersection check
      if (intersects(lastPos, currentPos, c.bodyA.position, c.bodyB.position)) {
        Composite.remove(engine.world, c);
        Audio.step(0);
        
        // Remove from our tracker so we don't check again
        const idx = constraints.indexOf(c);
        if (idx > -1) constraints.splice(idx, 1);
      }
    });
    lastPos = currentPos;
  };

  const handlePointerUp = () => { isDown = false; lastPos = null; };

  container.addEventListener('mousedown', handlePointerDown);
  container.addEventListener('mousemove', handlePointerMove);
  container.addEventListener('mouseup', handlePointerUp);
  container.addEventListener('touchstart', handlePointerDown);
  container.addEventListener('touchmove', handlePointerMove);
  container.addEventListener('touchend', handlePointerUp);

  // Win / Lose detection
  let over = false;
  Events.on(engine, 'beforeUpdate', () => {
    if (over) return;

    // Check bounds (fell off screen)
    if (spool.position.y > height + 100 || spool.position.x < -100 || spool.position.x > width + 100) {
      over = true;
      Audio.fail();
      Toast.show('Fell off screen! Tap to retry.');
      setTimeout(() => startSnip(currentLevelIndex), 1500);
      return;
    }

    // Check collision with needle eye
    const dist = Vector.magnitude(Vector.sub(spool.position, targetEye.position));
    if (dist < tx(targetEye.circleRadius)) {
      over = true;
      Audio.win();
      Toast.show('Stitched!');
      window.Thread.winSnip(currentLevelIndex);
      setTimeout(() => { stopSnip(); window.Thread.show('home'); }, 1500);
      return;
    }
  });

  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
      if ((pair.bodyA === spool && pair.bodyB.label === 'blade') || 
          (pair.bodyB === spool && pair.bodyA.label === 'blade')) {
        if (!over) {
          over = true;
          Audio.fail();
          Toast.show('Cut by blade!');
          setTimeout(() => startSnip(currentLevelIndex), 1500);
        }
      }
    });
  });
}

export function stopSnip() {
  if (render) Matter.Render.stop(render);
  if (runner) Matter.Runner.stop(runner);
  if (engine) Matter.Engine.clear(engine);
  const container = document.getElementById('snip-container');
  if (container) container.innerHTML = '';
}

window.startSnip = startSnip;
window.stopSnip = stopSnip;

// Line intersection math
function intersects(a, b, c, d) {
  var det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (det === 0) return false;
  var lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
  var gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;
  return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}
