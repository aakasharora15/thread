const fs = require('fs');
let code = fs.readFileSync('nav.js', 'utf8');
let regex = new RegExp(`(export function initNav[^{]*{)([\\s\\S]*?)^}`, 'm');
code = code.replace(regex, `$1\n  try {\n$2\n  } catch (e) { alert("ERROR in initNav: " + e.stack); }\n}`);
fs.writeFileSync('nav.js', code);
