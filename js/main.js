const vw = document.documentElement.clientWidth;
const vh = window.innerHeight - 20;
const MOBILE = vw < 768;

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
  if (MOBILE) {
    win.style.width = (vw - 20) + 'px';
    win.style.left  = '10px';
    win.style.top   = '30px';
  }
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

  function dragStart(cx, cy) {
    dragging = true;
    startX = cx; startY = cy;
    startL = win.offsetLeft; startT = win.offsetTop;
    bringToFront(win);
  }
  function dragMove(cx, cy) {
    if (!dragging) return;
    win.style.left = Math.max(0, startL + cx - startX) + 'px';
    win.style.top  = Math.max(20, startT + cy - startY) + 'px';
  }
  function dragEnd() { dragging = false; }

  titleBar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('close-box') || e.target.classList.contains('zoom-box')) return;
    e.preventDefault();
    dragStart(e.clientX, e.clientY);
  });
  titleBar.addEventListener('touchstart', e => {
    if (e.target.classList.contains('close-box') || e.target.classList.contains('zoom-box')) return;
    dragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('mousemove',  e => dragMove(e.clientX, e.clientY));
  window.addEventListener('touchmove',  e => { if (dragging) dragMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('mouseup',  dragEnd);
  window.addEventListener('touchend', dragEnd);

  win.addEventListener('mousedown',  () => bringToFront(win));
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

  function iconDragStart(cx, cy) {
    iconDragging = true; moved = false;
    startX = cx; startY = cy;
    startL = icon.offsetLeft; startT = icon.offsetTop;
    iconTopZ++; icon.style.zIndex = iconTopZ;
  }
  function iconDragMove(cx, cy) {
    if (!iconDragging) return;
    const dx = cx - startX, dy = cy - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    icon.style.left = Math.max(0, startL + dx) + 'px';
    icon.style.top  = Math.max(0, startT + dy) + 'px';
  }

  icon.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); iconDragStart(e.clientX, e.clientY); });
  window.addEventListener('mousemove', e => iconDragMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', () => { iconDragging = false; });

  icon.addEventListener('touchstart', e => { e.stopPropagation(); iconDragStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchmove', e => { if (iconDragging) iconDragMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  window.addEventListener('touchend', () => { iconDragging = false; });

  icon.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    e.stopPropagation();
    const winId = icon.dataset.win, now = Date.now();
    deselectAllIcons(); icon.classList.add('selected');
    if (winId && now - lastClick.time < 400 && lastClick.id === icon.id) openWindow(winId);
    lastClick = { id: icon.id, time: now };
  });

  icon.addEventListener('touchend', e => {
    if (moved) { moved = false; return; }
    e.stopPropagation();
    const winId = icon.dataset.win, now = Date.now();
    deselectAllIcons(); icon.classList.add('selected');
    if (winId && now - lastTap.time < 500 && lastTap.id === icon.id) openWindow(winId);
    lastTap = { id: icon.id, time: now };
  });
});

document.getElementById('desktop').addEventListener('click', deselectAllIcons);

/* ── INITIAL POSITIONS ── */
window.addEventListener('DOMContentLoaded', () => {
  if (MOBILE) {
    /* Close every window — user opens them via icons */
    document.querySelectorAll('.mac-window').forEach(w => w.style.display = 'none');

    /* 2-column icon grid, horizontally centered, safely inside viewport */
    const iconW  = 56;
    const colGap = 20;
    const gridW  = iconW * 2 + colGap;
    const gx     = Math.floor((vw - gridW) / 2);  // left edge of grid
    const col2   = gx + iconW + colGap;

    const pos = {
      'icon-hd':       { left: gx,    top: 28  },
      'icon-about':    { left: gx,    top: 118 },
      'icon-services': { left: gx,    top: 208 },
      'icon-build':    { left: col2,  top: 28  },
      'icon-process':  { left: col2,  top: 118 },
      'icon-contact':  { left: col2,  top: 208 },
      'icon-trash':    { left: gx + Math.floor((gridW - iconW) / 2), top: vh - 84 }
    };
    Object.entries(pos).forEach(([id, p]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = p.left + 'px'; el.style.top = p.top + 'px'; }
    });

  } else {
    /* Desktop: scattered across the full screen */
    const pos = {
      'icon-about':    { left: 20,                        top: 40  },  // top-left
      'icon-services': { left: 20,                        top: 130 },  // left, below about
      'icon-process':  { left: Math.floor(vw * 0.25),    top: 30  },  // center-left
      'icon-contact':  { left: Math.floor(vw * 0.5) - 36, top: 30  }, // center
      'icon-hd':       { left: vw - 170,                 top: 20  },  // top-right second col
      'icon-build':    { left: vw - 90,                  top: 20  },  // top-right
      'icon-trash':    { left: vw - 90,                  top: vh - 110 }
    };
    Object.entries(pos).forEach(([id, p]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = p.left + 'px'; el.style.top = p.top + 'px'; }
    });

    const winPos = {
      'win-landing':  { left: 30,                          top: 28 },
      'win-services': { left: Math.floor(vw * 0.42),       top: 28 },
      'win-build':    { left: 50,                          top: Math.floor(vh * 0.44) },
      'win-process':  { left: Math.max(20, vw - 460),      top: Math.floor(vh * 0.28) },
      'win-contact':  { left: Math.floor(vw * 0.32),       top: Math.floor(vh * 0.52) },
    };
    Object.entries(winPos).forEach(([id, p]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = p.left + 'px'; el.style.top = p.top + 'px'; }
    });

    const landing = document.getElementById('win-landing');
    if (landing) bringToFront(landing);
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
    if (action === 'restart')  { location.reload(); }
    else if (action === 'shutdown') { document.body.innerHTML = '<div style="position:fixed;inset:0;background:#fff;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:16px;font-weight:bold;">It is now safe to turn off your computer.</div>'; }
    else if (action === 'trash')    { alert('The Trash is already empty.'); }
    else if (action) { openWindow(action); }
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
});
