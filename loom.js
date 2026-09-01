import { Audio } from './audio.js';
import { Toast } from './toast.js';

let svg;
let currentLevelIndex = 0;
let state = { path: [], pegs: [], target: [] };

// 5 Starter Levels for Loom Logic
const LEVELS = [
  { // Level 1: Triangle
    pegs: [{x:200, y:150, id:0}, {x:100, y:350, id:1}, {x:300, y:350, id:2}],
    target: [1, 2, 0, 1] // Start at 1, go to 2, 0, 1
  },
  { // Level 2: Hourglass
    pegs: [{x:100, y:150, id:0}, {x:300, y:150, id:1}, {x:100, y:400, id:2}, {x:300, y:400, id:3}],
    target: [0, 1, 2, 3, 0] 
  },
  { // Level 3: Star
    pegs: [
      {x:200, y:100, id:0}, 
      {x:300, y:400, id:1}, 
      {x:50, y:200, id:2}, 
      {x:350, y:200, id:3}, 
      {x:100, y:400, id:4}
    ],
    target: [0, 1, 2, 3, 4, 0]
  },
  { // Level 4: Envelope
    pegs: [
      {x:100, y:200, id:0}, {x:300, y:200, id:1},
      {x:100, y:400, id:2}, {x:300, y:400, id:3},
      {x:200, y:100, id:4}
    ],
    target: [2, 0, 4, 1, 3, 2, 1, 0, 3] 
  },
  { // Level 5: Hexagon Web
    pegs: [
      {x:200, y:100, id:0}, {x:300, y:150, id:1}, {x:300, y:350, id:2},
      {x:200, y:400, id:3}, {x:100, y:350, id:4}, {x:100, y:150, id:5}
    ],
    target: [0, 2, 4, 0, 3, 1, 5, 3]
  }
];

export function startLoom(level) {
  currentLevelIndex = level;
  const container = document.getElementById('loom-container');
  container.innerHTML = '';
  document.getElementById('play-loom').classList.add('on');
  document.getElementById('home').classList.remove('on');

  const lvl = LEVELS[level - 1];
  state.pegs = lvl.pegs;
  state.target = lvl.target;
  state.path = [state.target[0]]; // Always start at the correct first peg for simplicity

  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  
  // Background blueprint lines
  const blueprintGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  for (let i = 0; i < state.target.length - 1; i++) {
    const p1 = state.pegs.find(p => p.id === state.target[i]);
    const p2 = state.pegs.find(p => p.id === state.target[i + 1]);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
    line.setAttribute('stroke', '#ccc');
    line.setAttribute('stroke-width', '4');
    line.setAttribute('stroke-dasharray', '8 8');
    blueprintGroup.appendChild(line);
  }
  svg.appendChild(blueprintGroup);

  // Active threads
  const threadGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  threadGroup.id = 'loom-threads';
  svg.appendChild(threadGroup);

  // Interactive Pegs
  state.pegs.forEach(p => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', '15');
    circle.setAttribute('fill', '#555');
    circle.dataset.id = p.id;
    
    // Make peg interactable
    circle.style.cursor = 'pointer';
    circle.addEventListener('pointerdown', (e) => onPegClick(p.id));
    svg.appendChild(circle);
  });

  container.appendChild(svg);
  renderLoomState();
}

function renderLoomState() {
  const g = document.getElementById('loom-threads');
  g.innerHTML = '';
  
  // Draw threads in order
  for (let i = 0; i < state.path.length - 1; i++) {
    const p1 = state.pegs.find(p => p.id === state.path[i]);
    const p2 = state.pegs.find(p => p.id === state.path[i+1]);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', p1.x); line.setAttribute('y1', p1.y);
    line.setAttribute('x2', p2.x); line.setAttribute('y2', p2.y);
    line.setAttribute('stroke', 'var(--thread)');
    line.setAttribute('stroke-width', '8');
    line.setAttribute('stroke-linecap', 'round');
    
    // Add shadow to simulate overlapping
    line.style.filter = 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))';
    g.appendChild(line);
  }
  
  // Highlight active peg
  const activePegId = state.path[state.path.length - 1];
  const activePeg = state.pegs.find(p => p.id === activePegId);
  const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  indicator.setAttribute('cx', activePeg.x); indicator.setAttribute('cy', activePeg.y);
  indicator.setAttribute('r', '8'); indicator.setAttribute('fill', 'var(--thread-core)');
  g.appendChild(indicator);
}

function onPegClick(pegId) {
  const lastPeg = state.path[state.path.length - 1];
  if (pegId === lastPeg) {
    // Clicked the same peg, maybe undo?
    if (state.path.length > 1) {
      state.path.pop();
      Audio.erase();
      renderLoomState();
    }
    return;
  }
  
  // Add peg to path
  state.path.push(pegId);
  Audio.mark(state.path.length);
  renderLoomState();
  
  checkLoomWin();
}

function checkLoomWin() {
  // Check if lengths match
  if (state.path.length !== state.target.length) return;
  
  // Check if sequence matches exactly
  let match = true;
  for (let i = 0; i < state.target.length; i++) {
    if (state.path[i] !== state.target[i]) {
      // Also check reverse path since weaving can be done backwards!
      match = false;
      break;
    }
  }
  
  let reverseMatch = true;
  for (let i = 0; i < state.target.length; i++) {
    if (state.path[i] !== state.target[state.target.length - 1 - i]) {
      reverseMatch = false;
      break;
    }
  }

  if (match || reverseMatch) {
    Audio.win();
    Toast.show('Blueprint matched!');
    window.Thread.winLoom(currentLevelIndex);
    setTimeout(() => { stopLoom(); window.Thread.show('home'); }, 1500);
  } else {
    Audio.fail();
    Toast.show('Sequence mismatch! Tap previous pegs to undo.');
  }
}

export function stopLoom() {
  const container = document.getElementById('loom-container');
  if (container) container.innerHTML = '';
  svg = null;
}

window.startLoom = startLoom;
window.stopLoom = stopLoom;
