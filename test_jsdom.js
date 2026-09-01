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

setTimeout(() => {
  console.log("Body length:", dom.window.document.body.innerHTML.length);
  const levels = dom.window.document.getElementById('snip-levels');
  console.log("Levels HTML:", levels ? levels.innerHTML : 'NOT FOUND');
  process.exit(0);
}, 2000);
