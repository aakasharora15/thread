const fs = require('fs');

// Backtracking Hamiltonian path solver
function findPath(R, C, walls) {
  const N = R * C;
  // create adjacency list
  const adj = Array.from({length: N}, () => []);
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const u = r * C + c;
      if (r < R - 1) { // down
        const v = (r + 1) * C + c;
        if (!walls.has(`${u},${v}`) && !walls.has(`${v},${u}`)) { adj[u].push(v); adj[v].push(u); }
      }
      if (c < C - 1) { // right
        const v = r * C + (c + 1);
        if (!walls.has(`${u},${v}`) && !walls.has(`${v},${u}`)) { adj[u].push(v); adj[v].push(u); }
      }
    }
  }

  // Warnsdorff's heuristic for faster pathfinding
  // Sort neighbors by degree
  for (let i = 0; i < N; i++) {
    adj[i].sort((a, b) => adj[a].length - adj[b].length);
  }

  let path = [];
  let vis = new Array(N).fill(false);

  function dfs(u) {
    path.push(u);
    vis[u] = true;
    if (path.length === N) return true;

    for (let v of adj[u]) {
      if (!vis[v]) {
        if (dfs(v)) return true;
      }
    }

    vis[u] = false;
    path.pop();
    return false;
  }

  // Try from a random start point
  let start = Math.floor(Math.random() * N);
  if (dfs(start)) return path;

  // If Warnsdorff fails, it might be impossible or slow. Just return null.
  return null;
}

function generateLanes() {
  const easy = [];
  const medium = [];
  const hard = [];

  function makeBoard(minSize, maxSize, minQ, maxQ) {
    let R, C, path, wallsArr;
    let attempts = 0;
    while (!path && attempts < 1000) {
      attempts++;
      R = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      C = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
      
      const walls = new Set();
      wallsArr = [];
      // Add random walls
      const numWalls = Math.floor(R * C * 0.1); // 10% walls
      for (let i = 0; i < numWalls; i++) {
        let r = Math.floor(Math.random() * R);
        let c = Math.floor(Math.random() * C);
        let u = r * C + c;
        let v;
        if (Math.random() < 0.5 && r < R - 1) v = (r + 1) * C + c;
        else if (c < C - 1) v = r * C + (c + 1);
        
        if (v !== undefined) {
          walls.add(`${u},${v}`);
          
          let code;
          if (v === u + 1) code = (u << 1) | 0; // right
          else code = (u << 1) | 1; // down
          wallsArr.push(code);
        }
      }

      path = findPath(R, C, walls);
    }

    if (!path) {
      console.log("Failed to generate path after 1000 attempts", minSize, maxSize);
      // Fallback: empty grid
      R = minSize; C = minSize;
      path = findPath(R, C, new Set());
      wallsArr = [];
    }

    // Convert path to directions
    let s = path[0];
    let dStr = "";
    for (let i = 1; i < path.length; i++) {
      let diff = path[i] - path[i-1];
      if (diff === 1) dStr += "R";
      else if (diff === -1) dStr += "L";
      else if (diff === C) dStr += "D";
      else if (diff === -C) dStr += "U";
    }

    // Pick q checkpoints
    let numQ = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
    let q = [0, path.length - 1]; // always start and end
    while (q.length < numQ) {
      let cand = Math.floor(Math.random() * (path.length - 2)) + 1;
      if (!q.includes(cand)) q.push(cand);
    }
    q.sort((a,b) => a - b);

    return {
      r: R, c: C, k: 0, s: s, d: dStr, q: q, w: wallsArr, x: 0
    };
  }

  // Easy: 4x4 to 6x6
  for (let i = 0; i < 200; i++) {
    let size = 4 + Math.floor(i / 100); // progressive
    let b = makeBoard(size, size, 4, 8);
    b.x = i;
    easy.push(b);
  }

  // Medium: 5x5 to 8x8
  for (let i = 0; i < 200; i++) {
    let size = 5 + Math.floor(i / 60); // 5, 6, 7, 8
    if (size > 8) size = 8;
    let b = makeBoard(size, size, 4, 10);
    b.x = i;
    medium.push(b);
  }

  // Hard: 8x8 to 10x10
  for (let i = 0; i < 200; i++) {
    let size = 8 + Math.floor(i / 70); // 8, 9, 10
    if (size > 10) size = 10;
    let b = makeBoard(size, Math.min(size + 1, 10), 4, 12); // Allow slight rects to aid generation
    b.x = i;
    hard.push(b);
  }

  const out = `window.THREAD_BOARDS = ${JSON.stringify({ easy, medium, hard })};\n`;
  fs.writeFileSync('boards.js', out);
  console.log('Generated new boards.js');
}

generateLanes();
