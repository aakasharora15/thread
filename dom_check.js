const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const ids = new Set();
while ((match = regex.exec(code)) !== null) {
  ids.add(match[1]);
}

const html = fs.readFileSync('index.html', 'utf8');
const missing = [];
for (let id of ids) {
  if (!html.includes('id="' + id + '"')) {
    missing.push(id);
  }
}

if (missing.length > 0) {
  console.log("Missing IDs in index.html:", missing);
} else {
  console.log("All IDs found.");
}
