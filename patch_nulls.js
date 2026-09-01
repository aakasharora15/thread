const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(/document\.getElementById\('play'\)\.classList/g, "(document.getElementById('play') || document.body).classList");

fs.writeFileSync('app.js', code);
