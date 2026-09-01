// One way back to the game picker, dropped into the header of whichever game
// is running. Kept to a single link: the picker itself is the page that lists
// the games, so there is nothing to duplicate in a menu here.
export function initNav() {
  const hdr = document.querySelector('.hdr');
  if (!hdr || hdr.dataset.navInitialized) return;
  hdr.dataset.navInitialized = 'true';

  const a = document.createElement('a');
  a.className = 'icon';
  a.href = 'hub.html';
  a.title = 'All games';
  a.setAttribute('aria-label', 'All games');
  a.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' +
    '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/>' +
    '<rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></svg>';

  // Ahead of the sound button when there is one, so the row keeps its order.
  const snd = hdr.querySelector('.snd');
  if (snd) hdr.insertBefore(a, snd); else hdr.appendChild(a);
}
