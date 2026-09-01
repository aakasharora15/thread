const fs = require('fs');
const errScript = `\n<script>
window.addEventListener('error', function(e) {
  const err = document.createElement('div');
  err.style.cssText = 'color:red;font-size:14px;z-index:9999;position:fixed;top:0;left:0;background:black;padding:10px;width:100%;';
  err.textContent = 'ERR: ' + e.message + ' at ' + e.filename + ':' + e.lineno;
  document.body.appendChild(err);
});
window.addEventListener('unhandledrejection', function(e) {
  const err = document.createElement('div');
  err.style.cssText = 'color:orange;font-size:14px;z-index:9999;position:fixed;top:40px;left:0;background:black;padding:10px;width:100%;';
  err.textContent = 'PROMISE ERR: ' + e.reason;
  document.body.appendChild(err);
});
</script>\n`;

['snip.html', 'loom.html'].forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  html = html.replace('</head>', errScript + '</head>');
  fs.writeFileSync(f, html);
});
