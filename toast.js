export const Toast = {
  show(msg, isError = false) {
    let el = document.getElementById('syncToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'syncToast';
      el.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); color:var(--cell); padding:8px 16px; border-radius:20px; font-size:12px; font-family:var(--body); opacity:0; pointer-events:none; transition:opacity 0.3s; z-index:999;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.backgroundColor = isError ? '#C0392B' : 'var(--ink)';
    el.style.opacity = '1';
    
    if (this.timeout) clearTimeout(this.timeout);
    
    // Auto-hide unless it's a persistent loading state
    if (msg !== 'Syncing...') {
      this.timeout = setTimeout(() => {
        el.style.opacity = '0';
      }, 3000);
    }
  },
  hide() {
    const el = document.getElementById('syncToast');
    if (el) el.style.opacity = '0';
  }
};
