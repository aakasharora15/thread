const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;
global.document = document;
global.window = dom.window;

// stub
window.ThreadLogic = {
  mkLane: () => ({ unlocked: 1, stars: {}, hints: 0 }),
  GAMES: [],
  decodeBoard: (b) => ({ cells: 10, turns: 1, start: 0, open: [] })
};
window.THREAD_BOARDS = { easy: [], medium: [], hard: [], pro: [{r:8,c:8,d:"R",q:[0],w:[],x:0}] };
window.AudioContext = function() {};

let code = fs.readFileSync('app.js', 'utf8');
// remove imports
code = code.replace(/import .*/g, '');

try {
  eval(code);
  console.log("App parsed.");
} catch(e) {
  console.log("Error parsing App:", e);
}

const who = document.getElementById('who');
if (who) {
  console.log("who element found. class:", who.className, "text:", who.textContent.trim(), "HTML:", who.innerHTML.trim());
  who.click();
  console.log("Clicked who.");
} else {
  console.log("who element missing!");
}

const proBtn = document.querySelector('[data-lane="pro"]');
if (proBtn) {
  console.log("Pro btn found.");
  proBtn.click();
  console.log("Clicked Pro btn. save.lane =", window.save ? window.save.lane : "unknown");
} else {
  console.log("Pro btn missing!");
}
