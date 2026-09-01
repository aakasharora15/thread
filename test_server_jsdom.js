const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('snip.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("jsdomError", function (error) {
  console.error("JSDOM ERROR:", error);
});
virtualConsole.on("error", function (error) {
  console.error("CONSOLE ERROR:", error);
});

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
});

setTimeout(() => {
  const levels = dom.window.document.getElementById('snip-levels');
  console.log("Levels HTML:", levels ? levels.innerHTML : 'NOT FOUND');
  process.exit(0);
}, 2000);
