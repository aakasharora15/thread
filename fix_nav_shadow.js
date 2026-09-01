const fs = require('fs');
let nav = fs.readFileSync('nav.js', 'utf8');
nav = nav.replace(/menu\.style\.boxShadow = '0 8px 24px rgba\(0,0,0,0\.1\)';/, "menu.style.boxShadow = '0 10px 40px rgba(0,0,0,0.4)';");
fs.writeFileSync('nav.js', nav);
