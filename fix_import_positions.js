const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  // Match the snip import
  let match = code.match(/import \{ startSnip, stopSnip \} from '\.\/snip\.js';\n/);
  if (match) {
    code = code.replace(match[0], '');
    code = match[0] + code;
  }
  // Match the loom import
  let matchL = code.match(/import \{ startLoom, stopLoom \} from '\.\/loom\.js';\n/);
  if (matchL) {
    code = code.replace(matchL[0], '');
    code = matchL[0] + code;
  }
  fs.writeFileSync(file, code);
}

fix('snip-app.js');
fix('loom-app.js');
