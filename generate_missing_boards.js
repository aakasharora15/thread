const fs = require('fs');
let bText = fs.readFileSync('boards.js', 'utf8');
// extract the JSON object
let jsonStr = bText.replace('window.THREAD_BOARDS = ', '').replace(/;\s*$/, '');
let boards = JSON.parse(jsonStr);

let allBoards = [...boards.easy, ...boards.medium, ...boards.hard];

// We need 200 easy (4x4 to 6x6)
// 200 medium (5x5 to 8x8)
// 200 hard (8x8 to 10x10)

let easy = [];
let medium = [];
let hard = [];

function makeSnakeBoard(R, C, minQ, maxQ) {
  let s = 0; // top-left
  let dStr = "";
  for(let r=0; r<R; r++) {
    for(let c=0; c<C-1; c++) {
      dStr += (r % 2 === 0) ? "R" : "L";
    }
    if (r < R-1) dStr += "D";
  }
  
  let pathLen = R * C;
  let numQ = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
  let q = [0, pathLen - 1]; 
  while (q.length < numQ) {
    let cand = Math.floor(Math.random() * (pathLen - 2)) + 1;
    if (!q.includes(cand)) q.push(cand);
  }
  q.sort((a,b) => a - b);
  
  return { r: R, c: C, k: 0, s: s, d: dStr, q: q, w: [], x: 0 };
}

// Easy: 4x4 to 6x6
let easyCands = allBoards.filter(b => b.r >= 4 && b.c >= 4 && b.r <= 6 && b.c <= 6);
while (easyCands.length < 200) {
   let size = 4 + Math.floor(Math.random() * 3);
   easyCands.push(makeSnakeBoard(size, size, 4, 8));
}
easy = easyCands.slice(0, 200);

// Medium: 5x5 to 8x8
let medCands = allBoards.filter(b => b.r >= 5 && b.c >= 5 && b.r <= 8 && b.c <= 8 && !easy.includes(b));
while (medCands.length < 200) {
   let size = 5 + Math.floor(Math.random() * 4);
   medCands.push(makeSnakeBoard(size, size, 6, 10));
}
medium = medCands.slice(0, 200);

// Hard: 8x8 to 10x10
let hardCands = allBoards.filter(b => b.r >= 8 && b.c >= 8 && b.r <= 10 && b.c <= 10 && !medium.includes(b) && !easy.includes(b));
while (hardCands.length < 200) {
   let size = 8 + Math.floor(Math.random() * 3);
   hardCands.push(makeSnakeBoard(size, size, 8, 12));
}
hard = hardCands.slice(0, 200);

// Sort each array by size to create progression
function sortBySize(arr) {
  arr.sort((a, b) => (a.r * a.c) - (b.r * b.c));
  // Update x property to index
  arr.forEach((b, i) => b.x = i);
}

sortBySize(easy);
sortBySize(medium);
sortBySize(hard);

const out = `window.THREAD_BOARDS = ${JSON.stringify({ easy, medium, hard })};\n`;
fs.writeFileSync('boards.js', out);
console.log('Successfully re-categorized and generated boards to meet constraints!');
