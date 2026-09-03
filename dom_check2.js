const fs = require('fs');

const jsFiles = ['app.js', 'sync.js', 'logic.js', 'audio.js', 'cloud.js', 'progress.js', 'settings.js', 'toast.js'];
const ids = new Set();

jsFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, 'utf8');
  const regex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    ids.add(match[1]);
  }
});

const html = fs.readFileSync('index.html', 'utf8');
const missing = [];
for (let id of ids) {
  if (!html.includes('id="' + id + '"') && !html.includes("id='" + id + "'")) {
    missing.push(id);
  }
}

console.log("Missing IDs globally:", missing);
