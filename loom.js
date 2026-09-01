import { Audio } from './audio.js';
import { Toast } from './toast.js';

// Pegs are authored in a fixed 400 x 500 design space; the viewBox maps that
// onto whatever the device gives us, so the shape never lands off screen.
const DESIGN_W = 400, DESIGN_H = 500;
const NS = 'http://www.w3.org/2000/svg';

let currentLevel = 0;
let state = { path: [], pegs: [], target: [] };

const LEVELS = [
  { // Level 1: Triangle
    pegs: [{ x: 200, y: 150, id: 0 }, { x: 100, y: 350, id: 1 }, { x: 300, y: 350, id: 2 }],
    target: [1, 2, 0, 1]
  },
  { // Level 2: Hourglass
    pegs: [{ x: 100, y: 150, id: 0 }, { x: 300, y: 150, id: 1 }, { x: 100, y: 400, id: 2 }, { x: 300, y: 400, id: 3 }],
    target: [0, 1, 2, 3, 0]
  },
  { // Level 3: Star
    pegs: [
      { x: 200, y: 100, id: 0 }, { x: 300, y: 400, id: 1 }, { x: 50, y: 200, id: 2 },
      { x: 350, y: 200, id: 3 }, { x: 100, y: 400, id: 4 }
    ],
    target: [0, 1, 2, 3, 4, 0]
  },
  { // Level 4: Envelope
    pegs: [
      { x: 100, y: 200, id: 0 }, { x: 300, y: 200, id: 1 },
      { x: 100, y: 400, id: 2 }, { x: 300, y: 400, id: 3 }, { x: 200, y: 100, id: 4 }
    ],
    target: [2, 0, 4, 1, 3, 2, 1, 0, 3]
  },
  { // Level 5: Hexagon Web
    pegs: [
      { x: 200, y: 100, id: 0 }, { x: 300, y: 150, id: 1 }, { x: 300, y: 350, id: 2 },
      { x: 200, y: 400, id: 3 }, { x: 100, y: 350, id: 4 }, { x: 100, y: 150, id: 5 }
    ],
    target: [0, 2, 4, 0, 3, 1, 5, 3]
  }
];

let threadGroup = null, pegGroup = null, capGroup = null;

export function startLoom(level) {
  const container = document.getElementById('loom-container');
  if (!container) return;
  container.innerHTML = '';

  const lvl = LEVELS[level - 1];
  if (!lvl) return;
  currentLevel = level;

  state.pegs = lvl.pegs;
  state.target = lvl.target;
  state.path = [lvl.target[0]];                 // the first peg is given

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + DESIGN_W + ' ' + DESIGN_H);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // The blueprint, then the thread, then the pegs, then the marker for the peg
  // the thread is on. Painting order is the stacking order in SVG, so the
  // marker has to come last or the peg hides it.
  const blueprint = document.createElementNS(NS, 'g');
  for (let i = 0; i < lvl.target.length - 1; i++) {
    const p1 = peg(lvl.target[i]), p2 = peg(lvl.target[i + 1]);
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
    line.setAttribute('stroke', 'var(--rule)');
    line.setAttribute('stroke-width', '5');
    line.setAttribute('stroke-dasharray', '9 9');
    line.setAttribute('stroke-linecap', 'round');
    blueprint.appendChild(line);
  }
  svg.appendChild(blueprint);

  threadGroup = document.createElementNS(NS, 'g');
  svg.appendChild(threadGroup);

  pegGroup = document.createElementNS(NS, 'g');
  lvl.pegs.forEach(p => {
    // A generous transparent disc takes the tap, so a fingertip does not have
    // to land inside a 15px circle.
    const hit = document.createElementNS(NS, 'circle');
    hit.setAttribute('cx', p.x); hit.setAttribute('cy', p.y); hit.setAttribute('r', '30');
    hit.setAttribute('fill', 'transparent');
    hit.style.cursor = 'pointer';
    hit.addEventListener('pointerdown', () => onPegTap(p.id));

    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', '13');
    dot.setAttribute('fill', 'var(--ink-soft)');
    dot.setAttribute('pointer-events', 'none');

    pegGroup.appendChild(dot);
    pegGroup.appendChild(hit);
  });
  svg.appendChild(pegGroup);

  capGroup = document.createElementNS(NS, 'g');
  capGroup.setAttribute('pointer-events', 'none');
  svg.appendChild(capGroup);

  container.appendChild(svg);
  render();
}

function peg(id) { return state.pegs.find(p => p.id === id); }

function render() {
  threadGroup.innerHTML = '';
  capGroup.innerHTML = '';

  for (let i = 0; i < state.path.length - 1; i++) {
    const p1 = peg(state.path[i]), p2 = peg(state.path[i + 1]);
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
    line.setAttribute('stroke', 'var(--thread)');
    line.setAttribute('stroke-width', '9');
    line.setAttribute('stroke-linecap', 'round');
    threadGroup.appendChild(line);
  }

  // The ring sits on top of the peg the thread is waiting on.
  const here = peg(state.path[state.path.length - 1]);
  const ring = document.createElementNS(NS, 'circle');
  ring.setAttribute('cx', here.x); ring.setAttribute('cy', here.y); ring.setAttribute('r', '19');
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', 'var(--thread-core)');
  ring.setAttribute('stroke-width', '4');
  capGroup.appendChild(ring);

  const hint = document.getElementById('loomHint');
  if (hint) {
    const left = state.target.length - state.path.length;
    hint.textContent = left > 0
      ? left + (left === 1 ? ' strand left' : ' strands left')
      : 'Tap the peg you are on to unwind.';
  }
}

function onPegTap(id) {
  const here = state.path[state.path.length - 1];

  // Tapping the peg the thread is on unwinds the last strand.
  if (id === here) {
    if (state.path.length > 1) {
      state.path.pop();
      Audio.erase();
      render();
    }
    return;
  }

  // The blueprint fixes how many strands there are, so refuse to run past it
  // rather than leaving the player in a state no undo can reach.
  if (state.path.length >= state.target.length) {
    Toast.show('Every strand is used. Tap the peg you are on to unwind.');
    return;
  }

  state.path.push(id);
  Audio.mark(state.path.length);
  render();

  if (state.path.length === state.target.length) checkWin();
}

function checkWin() {
  const t = state.target;
  const forward = state.path.every((id, i) => id === t[i]);
  const reverse = state.path.every((id, i) => id === t[t.length - 1 - i]);

  if (forward || reverse) {
    Audio.win();
    Toast.show('Blueprint matched.');
    window.Thread.winLoom(currentLevel);
    setTimeout(() => { stopLoom(); window.Thread.show('home'); }, 1400);
  } else {
    Audio.fail();
    Toast.show('Not the blueprint. Tap the peg you are on to unwind.');
  }
}

export function stopLoom() {
  const container = document.getElementById('loom-container');
  if (container) container.innerHTML = '';
  threadGroup = pegGroup = capGroup = null;
}
