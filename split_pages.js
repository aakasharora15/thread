const fs = require('fs');

// 1. Read the current index.html
let html = fs.readFileSync('index.html', 'utf8');

// Restore thread.html to just the Classic mode (remove tabs and other views)
let threadHtml = html;
// Remove the tabs div
threadHtml = threadHtml.replace(/<div class="tabs".*?<\/div>/s, '<a href="index.html" class="icon" style="position:absolute; top:20px; left:20px; text-decoration:none; font-size:24px; color:var(--ink);">&larr; Hub</a>');
// Remove view-snip and view-loom
threadHtml = threadHtml.replace(/<div id="view-snip".*?<\/div>\s*<\/div>/s, '');
threadHtml = threadHtml.replace(/<div id="view-loom".*?<\/div>\s*<\/div>/s, '');
// Remove play-snip and play-loom
threadHtml = threadHtml.replace(/<section class="screen" id="play-snip">.*?<\/section>/s, '');
threadHtml = threadHtml.replace(/<section class="screen" id="play-loom">.*?<\/section>/s, '');
// Remove view-classic wrapper
threadHtml = threadHtml.replace(/<div id="view-classic">/s, '');
threadHtml = threadHtml.replace(/<\/div>\s*<div class="foot">/, '<div class="foot">');

// snip.html
let snipHtml = html;
snipHtml = snipHtml.replace(/<div class="tabs".*?<\/div>/s, '<a href="index.html" class="icon" style="position:absolute; top:20px; left:20px; text-decoration:none; font-size:24px; color:var(--ink);">&larr; Hub</a>');
snipHtml = snipHtml.replace(/<div id="view-classic">.*?<div id="view-snip"/s, '<div id="view-snip"');
snipHtml = snipHtml.replace(/<div id="view-loom".*?<\/div>\s*<\/div>/s, '');
snipHtml = snipHtml.replace(/<div id="view-snip" style="display:none;/s, '<div id="view-snip" style="display:block; margin-top:80px;');
snipHtml = snipHtml.replace(/<section class="screen" id="play-loom">.*?<\/section>/s, '');
snipHtml = snipHtml.replace(/<section class="screen" id="play">.*?<\/section>/s, '');

// loom.html
let loomHtml = html;
loomHtml = loomHtml.replace(/<div class="tabs".*?<\/div>/s, '<a href="index.html" class="icon" style="position:absolute; top:20px; left:20px; text-decoration:none; font-size:24px; color:var(--ink);">&larr; Hub</a>');
loomHtml = loomHtml.replace(/<div id="view-classic">.*?<div id="view-loom"/s, '<div id="view-loom"');
loomHtml = loomHtml.replace(/<div id="view-loom" style="display:none;/s, '<div id="view-loom" style="display:block; margin-top:80px;');
loomHtml = loomHtml.replace(/<section class="screen" id="play-snip">.*?<\/section>/s, '');
loomHtml = loomHtml.replace(/<section class="screen" id="play">.*?<\/section>/s, '');

fs.writeFileSync('thread.html', threadHtml);
fs.writeFileSync('snip.html', snipHtml);
fs.writeFileSync('loom.html', loomHtml);

// Create the new index.html (Launcher)
let indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover">
  <title>Thread Games Hub</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: var(--paper); color: var(--ink); font-family: var(--sans); }
    h1 { font-family: var(--display); font-size: 36px; margin-bottom: 40px; }
    .hub-grid { display: flex; flex-direction: column; gap: 20px; width: 100%; max-width: 400px; padding: 0 20px; box-sizing: border-box; }
    .hub-card { display: flex; align-items: center; gap: 20px; padding: 20px; background: var(--paper); border: 2px solid var(--ink); border-radius: 12px; text-decoration: none; color: var(--ink); transition: transform 0.2s; }
    .hub-card:hover { transform: scale(1.02); }
    .hub-card svg { width: 48px; height: 48px; flex-shrink: 0; }
    .hub-card div { display: flex; flex-direction: column; }
    .hub-card h2 { margin: 0; font-family: var(--display); font-size: 24px; }
    .hub-card p { margin: 5px 0 0; font-size: 14px; color: var(--ink-soft); }
  </style>
</head>
<body>
  <h1>Thread Games</h1>
  <div class="hub-grid">
    <a href="thread.html" class="hub-card">
      <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="12" r="2"></circle><circle cx="6" cy="18" r="2"></circle><path d="M6 8 L18 10"></path><path d="M18 14 L6 16"></path></svg>
      <div><h2>Join the Numbers</h2><p>The classic continuous line puzzle.</p></div>
    </a>
    <a href="snip.html" class="hub-card">
      <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="4" fill="currentColor"></circle><path d="M12 2 L12 14" stroke-dasharray="2 2"></path><path d="M6 8 L18 12"></path></svg>
      <div><h2>Snip & Stitch</h2><p>Physics-based thread cutting.</p></div>
    </a>
    <a href="loom.html" class="hub-card">
      <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle><path d="M6 8 L18 16"></path><path d="M18 8 L6 16"></path></svg>
      <div><h2>Loom Logic</h2><p>Spatial geometry weaving.</p></div>
    </a>
  </div>
</body>
</html>`;
fs.writeFileSync('index.html', indexHtml);
