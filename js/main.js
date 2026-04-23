const MOBILE = window.innerWidth < 768;

/* ── CLOCK ── */
function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('clock').textContent =
    h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}
updateClock();
setInterval(updateClock, 10000);

/* ── Z-INDEX MANAGEMENT ── */
let topZ = 100;
function bringToFront(win) {
  topZ++;
  win.style.zIndex = topZ;
  document.querySelectorAll('.mac-window').forEach(w => w.classList.add('inactive'));
  win.classList.remove('inactive');
}

/* ── OPEN / CLOSE WINDOWS ── */
function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.style.display = 'flex';
  bringToFront(win);
  deselectAllIcons();
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) win.style.display = 'none';
}

document.querySelectorAll('.close-box').forEach(box => {
  box.addEventListener('click', e => { e.stopPropagation(); closeWindow(box.dataset.win); });
});

/* ── DRAGGABLE WINDOWS (mouse + touch) ── */
document.querySelectorAll('.mac-window').forEach(win => {
  const titleBar = win.querySelector('.title-bar');
  let startX, startY, startL, startT, dragging = false;

  function dragStart(clientX, clientY) {
    dragging = true;
    startX = clientX; startY = clientY;
    startL = win.offsetLeft; startT = win.offsetTop;
    bringToFront(win);
  }
  function dragMove(clientX, clientY) {
    if (!dragging) return;
    win.style.left = Math.max(0, startL + clientX - startX) + 'px';
    win.style.top  = Math.max(20, startT + clientY - startY) + 'px';
  }
  function dragEnd() { dragging = false; }

  titleBar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('close-box') || e.target.classList.contains('zoom-box')) return;
    e.preventDefault();
    dragStart(e.clientX, e.clientY);
  });
  titleBar.addEventListener('touchstart', e => {
    if (e.target.classList.contains('close-box') || e.target.classList.contains('zoom-box')) return;
    const t = e.touches[0];
    dragStart(t.clientX, t.clientY);
  }, { passive: true });

  window.addEventListener('mousemove', e => dragMove(e.clientX, e.clientY));
  window.addEventListener('touchmove', e => {
    if (!dragging) return;
    dragMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  win.addEventListener('mousedown', () => bringToFront(win));
  win.addEventListener('touchstart', () => bringToFront(win), { passive: true });
});

/* ── DESKTOP ICONS (mouse + touch) ── */
let lastClick = { id: null, time: 0 };
let lastTap   = { id: null, time: 0 };

function deselectAllIcons() {
  document.querySelectorAll('.desk-icon').forEach(i => i.classList.remove('selected'));
}

let iconTopZ = 80;

document.querySelectorAll('.desk-icon').forEach(icon => {
  let startX, startY, startL, startT, iconDragging = false, moved = false;

  /* ── mouse drag ── */
  icon.addEventListener('mousedown', e => {
    e.preventDefault(); e.stopPropagation();
    iconDragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    startL = icon.offsetLeft; startT = icon.offsetTop;
    iconTopZ++; icon.style.zIndex = iconTopZ;
  });
  window.addEventListener('mousemove', e => {
    if (!iconDragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    icon.style.left = Math.max(0, startL + dx) + 'px';
    icon.style.top  = Math.max(0, startT + dy) + 'px';
  });
  window.addEventListener('mouseup', () => { iconDragging = false; });

  icon.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    e.stopPropagation();
    const winId = icon.dataset.win, now = Date.now();
    deselectAllIcons(); icon.classList.add('selected');
    if (winId && now - lastClick.time < 400 && lastClick.id === icon.id) openWindow(winId);
    lastClick = { id: icon.id, time: now };
  });

  /* ── touch drag + double-tap ── */
  icon.addEventListener('touchstart', e => {
    e.stopPropagation();
    const t = e.touches[0];
    iconDragging = true; moved = false;
    startX = t.clientX; startY = t.clientY;
    startL = icon.offsetLeft; startT = icon.offsetTop;
    iconTopZ++; icon.style.zIndex = iconTopZ;
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!iconDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - startX, dy = t.clientY - startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
    icon.style.left = Math.max(0, startL + dx) + 'px';
    icon.style.top  = Math.max(0, startT + dy) + 'px';
  }, { passive: true });

  window.addEventListener('touchend', () => { iconDragging = false; });

  icon.addEventListener('touchend', e => {
    if (moved) { moved = false; return; }
    e.stopPropagation();
    const winId = icon.dataset.win, now = Date.now();
    deselectAllIcons(); icon.classList.add('selected');
    // double-tap opens window
    if (winId && now - lastTap.time < 400 && lastTap.id === icon.id) openWindow(winId);
    lastTap = { id: icon.id, time: now };
  });
});

document.getElementById('desktop').addEventListener('click', deselectAllIcons);

/* ── INITIAL POSITIONS ── */
window.addEventListener('DOMContentLoaded', () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight - 20;

  if (MOBILE) {
    /* ── MOBILE layout ── */
    const winW = Math.floor(vw * 0.82);

    // Hide services on entry (only landing + process open)
    const services = document.getElementById('win-services');
    if (services) services.style.display = 'none';

    const landing = document.getElementById('win-landing');
    const process = document.getElementById('win-process');

    if (landing) {
      landing.style.left  = '8px';
      landing.style.top   = '8px';
      landing.style.width = winW + 'px';
      bringToFront(landing);
    }

    // Position process below landing after it renders
    requestAnimationFrame(() => {
      if (process) {
        const landingBottom = landing ? landing.offsetTop + landing.offsetHeight : 300;
        process.style.left  = '8px';
        process.style.top   = (landingBottom + 12) + 'px';
        process.style.width = winW + 'px';
      }
    });

    // Single icon column on right
    const iconPositions = {
      'icon-hd':       { left: vw - 66, top: 20  },
      'icon-about':    { left: vw - 66, top: 96  },
      'icon-services': { left: vw - 66, top: 172 },
      'icon-build':    { left: vw - 66, top: 248 },
      'icon-process':  { left: vw - 66, top: 324 },
      'icon-contact':  { left: vw - 66, top: 400 },
      'icon-trash':    { left: vw - 66, top: vh - 80 }
    };
    Object.entries(iconPositions).forEach(([id, pos]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = pos.left + 'px'; el.style.top = pos.top + 'px'; }
    });

  } else {
    /* ── DESKTOP layout ── */
    const iconPositions = {
      'icon-hd':       { left: vw - 90,  top: 20  },
      'icon-about':    { left: vw - 90,  top: 110 },
      'icon-services': { left: vw - 90,  top: 200 },
      'icon-build':    { left: vw - 90,  top: 290 },
      'icon-process':  { left: vw - 170, top: 65  },
      'icon-contact':  { left: vw - 170, top: 155 },
      'icon-trash':    { left: vw - 90,  top: vh - 110 }
    };
    Object.entries(iconPositions).forEach(([id, pos]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = pos.left + 'px'; el.style.top = pos.top + 'px'; }
    });

    const landing = document.getElementById('win-landing');
    if (landing) {
      landing.style.left = Math.max(20, (vw - 560) / 2) + 'px';
      landing.style.top  = Math.max(20, (vh - 480) / 3) + 'px';
      bringToFront(landing);
    }
  }
});

/* ── MENU BAR DROPDOWNS ── */
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

document.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', e => {
    e.stopPropagation();
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
    const action = item.dataset.action;
    if (action === 'restart') { location.reload(); }
    else if (action === 'shutdown') { document.body.innerHTML = '<div style="position:fixed;inset:0;background:#fff;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:16px;font-weight:bold;">It is now safe to turn off your computer.</div>'; }
    else if (action === 'trash') { alert('The Trash is already empty.'); }
    else if (action) { openWindow(action); }
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
});
