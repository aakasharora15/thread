const fs = require('fs');

let threadHtml = fs.readFileSync('thread.html', 'utf8');
let snipHtml = fs.readFileSync('snip.html', 'utf8');
let loomHtml = fs.readFileSync('loom.html', 'utf8');

// Replace the generic "Hub" back button with a specific menu in the header
const backBtn = '<a href="index.html" class="icon" style="position:absolute; top:20px; left:20px; text-decoration:none; font-size:24px; color:var(--ink);">&larr; Hub</a>';
threadHtml = threadHtml.replace(backBtn, '');
snipHtml = snipHtml.replace(backBtn, '');
loomHtml = loomHtml.replace(backBtn, '');

// Add a "Games" dropdown or links to the .hdr
const hdrTarget = '<button class="who" id="who" type="button" hidden>Your profile</button>';
const hdrLinks = `
      <div style="display:flex; gap:10px; margin-right:auto; padding-left:16px;">
        <a href="index.html" style="color:var(--ink); text-decoration:none; font-weight:bold; font-size:14px;">Thread</a>
        <a href="snip.html" style="color:var(--ink-soft); text-decoration:none; font-weight:bold; font-size:14px;">Snip</a>
        <a href="loom.html" style="color:var(--ink-soft); text-decoration:none; font-weight:bold; font-size:14px;">Loom</a>
      </div>
      <button class="who" id="who" type="button" hidden>Your profile</button>
`;

threadHtml = threadHtml.replace(hdrTarget, hdrLinks.replace('href="index.html" style="color:var(--ink-soft)', 'href="index.html" style="color:var(--ink)').replace('Thread</a>', 'Thread</a>'));
snipHtml = snipHtml.replace(hdrTarget, hdrLinks.replace('href="snip.html" style="color:var(--ink-soft)', 'href="snip.html" style="color:var(--ink)'));
loomHtml = loomHtml.replace(hdrTarget, hdrLinks.replace('href="loom.html" style="color:var(--ink-soft)', 'href="loom.html" style="color:var(--ink)'));

fs.writeFileSync('index.html', threadHtml); // index is Thread
fs.writeFileSync('snip.html', snipHtml);
fs.writeFileSync('loom.html', loomHtml);
fs.unlinkSync('thread.html'); // remove temp file

// Also update app.js routing to check for snip.html and loom.html correctly
let appJs = fs.readFileSync('app.js', 'utf8');
appJs = appJs.replace(/const path = window.location.pathname;/, 'const path = window.location.pathname || "";');
fs.writeFileSync('app.js', appJs);

// Update sw.js cache to include new HTML files
let swJs = fs.readFileSync('sw.js', 'utf8');
swJs = swJs.replace(/'index\.html',/, "'index.html', 'snip.html', 'loom.html',");
swJs = swJs.replace(/thread-v6/, "thread-v7");
fs.writeFileSync('sw.js', swJs);

