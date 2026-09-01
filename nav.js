export function initNav() {
  const hdrs = document.querySelectorAll('.hdr');
  if (!hdrs || hdrs.length === 0) return;
  
  // We only inject into the first header we find (usually #home header)
  const hdr = hdrs[0];
  if (hdr.dataset.navInitialized) return;
  hdr.dataset.navInitialized = 'true';

  const navContainer = document.createElement('div');
  navContainer.style.position = 'relative';
  // push right so it sits before the sound button cleanly
  navContainer.style.marginLeft = 'auto'; 
  navContainer.style.display = 'flex';
  navContainer.style.alignItems = 'center';

  const btn = document.createElement('button');
  btn.className = 'icon';
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="12" cy="19" r="2"></circle></svg>';
  btn.title = "More Games";
  btn.style.padding = '12px';

  const menu = document.createElement('div');
  menu.style.display = 'none';
  menu.style.position = 'absolute';
  menu.style.top = '100%';
  menu.style.right = '0';
  menu.style.background = 'var(--paper)';
  menu.style.border = '2px solid var(--ink)';
  menu.style.borderRadius = '12px';
  menu.style.padding = '10px 0';
  menu.style.minWidth = '220px';
  menu.style.zIndex = '9999';
  menu.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';

  const links = [
    { name: 'Join the Numbers', url: 'index.html', desc: 'Classic' },
    { name: 'Snip & Stitch', url: 'snip.html', desc: 'Physics' },
    { name: 'Loom Logic', url: 'loom.html', desc: 'Geometry' }
  ];

  links.forEach(l => {
    const a = document.createElement('a');
    a.href = l.url;
    a.style.display = 'block';
    a.style.padding = '12px 20px';
    a.style.color = 'var(--ink)';
    a.style.textDecoration = 'none';
    
    // Bold the active one
    const path = window.location.pathname;
    const isActive = path.includes(l.url) || (l.url === 'index.html' && path.endsWith('/'));
    
    a.innerHTML = `<div style="font-family:var(--display); font-size:18px; font-weight:${isActive?'bold':'normal'};">${l.name}</div><div style="font-size:12px; color:var(--ink-soft);">${l.desc}</div>`;
    
    a.onmouseenter = () => { a.style.background = 'var(--ink)'; a.style.color = 'var(--paper)'; a.lastChild.style.color = 'var(--paper)'; };
    a.onmouseleave = () => { a.style.background = 'transparent'; a.style.color = 'var(--ink)'; a.lastChild.style.color = 'var(--ink-soft)'; };
    
    menu.appendChild(a);
  });

  btn.onclick = (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  };

  document.addEventListener('click', () => {
    menu.style.display = 'none';
  });

  navContainer.appendChild(btn);
  navContainer.appendChild(menu);
  
  // Insert before the sound button if it exists, otherwise at the end
  const sndHome = document.getElementById('sndHome');
  if (sndHome) {
    hdr.insertBefore(navContainer, sndHome);
  } else {
    hdr.appendChild(navContainer);
  }
}
