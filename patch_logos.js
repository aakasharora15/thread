const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const targetClassic = 'id="tab-classic" class="lane" aria-pressed="true" style="padding:10px; font-size:14px;">Classic</button>';
const replacementClassic = 'id="tab-classic" class="lane" aria-pressed="true" style="padding:8px; font-size:12px; display:flex; flex-direction:column; align-items:center; gap:4px;">' + 
  '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="12" r="2"></circle><circle cx="6" cy="18" r="2"></circle><path d="M6 8 L18 10"></path><path d="M18 14 L6 16"></path></svg>' +
  'Classic</button>';

const targetSnip = 'id="tab-snip" class="lane" aria-pressed="false" style="padding:10px; font-size:14px;">Snip & Stitch</button>';
const replacementSnip = 'id="tab-snip" class="lane" aria-pressed="false" style="padding:8px; font-size:12px; display:flex; flex-direction:column; align-items:center; gap:4px;">' +
  '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="4" fill="currentColor"></circle><path d="M12 2 L12 14" stroke-dasharray="2 2"></path><path d="M6 8 L18 12"></path></svg>' +
  'Snip</button>';

const targetLoom = 'id="tab-loom" class="lane" aria-pressed="false" style="padding:10px; font-size:14px;">Loom Logic</button>';
const replacementLoom = 'id="tab-loom" class="lane" aria-pressed="false" style="padding:8px; font-size:12px; display:flex; flex-direction:column; align-items:center; gap:4px;">' +
  '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2"></circle><circle cx="18" cy="6" r="2"></circle><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle><path d="M6 8 L18 16"></path><path d="M18 8 L6 16"></path></svg>' +
  'Loom</button>';

html = html.replace(targetClassic, replacementClassic);
html = html.replace(targetSnip, replacementSnip);
html = html.replace(targetLoom, replacementLoom);

fs.writeFileSync('index.html', html);
