const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Fix countStars
code = code.replace(/const countStars = \(st\) => Object\.values\(st\.stars \|\| \{\}\)\.reduce\(\(a, b\) => a \+ b, 0\);/g, 
  "const countStars = (st) => st ? Object.values(st.stars || {}).reduce((a, b) => a + b, 0) : 0;");

code = code.replace(/const countSolved = \(st\) => Object\.keys\(st\.stars \|\| \{\}\)\.length;/g,
  "const countSolved = (st) => st ? Object.keys(st.stars || {}).length : 0;");

// Initialize snip and loom on old saves
code = code.replace(/var save = store\.get\(SAVE_KEY\) \|\| \{[^}]+\};/g, 
  "var save = store.get(SAVE_KEY) || { lane: 'medium', seq: 0, updatedAt: 0, cosmetics: { color: 'default', audio: 'default' }, easy: mkLane(), medium: mkLane(), hard: mkLane(), snip: mkLane(), loom: mkLane() };\n  if (!save.snip) save.snip = mkLane();\n  if (!save.loom) save.loom = mkLane();");

fs.writeFileSync('app.js', code);
