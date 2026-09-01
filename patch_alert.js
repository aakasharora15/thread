const fs = require('fs');

function wrapWithAlert(file, funcName) {
  let code = fs.readFileSync(file, 'utf8');
  let regex = new RegExp(`(function ${funcName}[^{]*{)([\\s\\S]*?)^}`, 'm');
  if (!regex.test(code)) {
    // try export function
    regex = new RegExp(`(export function ${funcName}[^{]*{)([\\s\\S]*?)^}`, 'm');
  }
  code = code.replace(regex, `$1\n  try {\n$2\n  } catch (e) { alert("ERROR in ${funcName}: " + e.stack); }\n}`);
  fs.writeFileSync(file, code);
}

wrapWithAlert('snip-app.js', 'renderSnipHub');
wrapWithAlert('loom-app.js', 'renderLoomHub');
wrapWithAlert('snip.js', 'startSnip');
wrapWithAlert('loom.js', 'startLoom');

