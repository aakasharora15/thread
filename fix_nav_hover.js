const fs = require('fs');
let nav = fs.readFileSync('nav.js', 'utf8');
nav = nav.replace(/var\(--paper\)/g, "var(--panel)");
fs.writeFileSync('nav.js', nav);
