const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('snip.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.sendTo(console);

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "file://" + __dirname + "/snip.html"
});

dom.window.onerror = function(msg, source, line, col, error) {
  console.log("DOM ERROR:", msg);
};

setTimeout(() => {
  const levels = dom.window.document.getElementById('snip-levels');
  console.log("Levels HTML length:", levels ? levels.innerHTML.length : 'NOT FOUND');
  process.exit(0);
}, 2000);
