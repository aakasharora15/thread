const fs = require('fs');
let nav = fs.readFileSync('nav.js', 'utf8');

nav = nav.replace(/menu\.style\.background = 'var\(--paper\)';/, "menu.style.backgroundColor = '#FFFFFF';");
nav = nav.replace(/menu\.style\.border = '2px solid var\(--ink\)';/, "menu.style.border = '2px solid #000';");
nav = nav.replace(/menu\.style\.boxShadow = '0 8px 24px rgba\\(0,0,0,0\\.1\\)';/, "menu.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';");

fs.writeFileSync('nav.js', nav);
