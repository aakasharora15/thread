const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Update boot to detect page
code = code.replace(/renderMap\(\);/g, `
        const path = window.location.pathname;
        if (path.includes('snip.html')) {
          renderSnipHub();
        } else if (path.includes('loom.html')) {
          renderLoomHub();
        } else {
          renderMap();
        }
`);

// switchTab is dead code now, but we can leave it safely.

fs.writeFileSync('app.js', code);
