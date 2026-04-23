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

// Close boxes
document.querySelectorAll('.close-box').forEach(box => {
  box.addEventListener('click', e => {
    e.stopPropagation();
    closeWindow(box.dataset.win);
  });
});

/* ── DRAGGABLE WINDOWS ── */
document.querySelectorAll('.mac-window').forEach(win => {
  const titleBar = win.querySelector('.title-bar');
  let startX, startY, startL, startT, dragging = false;

  titleBar.addEventListener('mousedown', e => {
    if (e.target.classList.contains('close-box') || e.target.classList.contains('zoom-box')) return;
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startL = win.offsetLeft;
    startT = win.offsetTop;
    bringToFront(win);
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    win.style.left = Math.max(0, startL + e.clientX - startX) + 'px';
    win.style.top  = Math.max(0, startT + e.clientY - startY) + 'px';
  });

  window.addEventListener('mouseup', () => { dragging = false; });

  // Click to bring to front
  win.addEventListener('mousedown', () => bringToFront(win));
});

/* ── DESKTOP ICONS ── */
let lastClick = { id: null, time: 0 };

function deselectAllIcons() {
  document.querySelectorAll('.desk-icon').forEach(i => i.classList.remove('selected'));
}

let iconTopZ = 80;

document.querySelectorAll('.desk-icon').forEach(icon => {
  let startX, startY, startL, startT, iconDragging = false, moved = false;

  icon.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    iconDragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    startL = icon.offsetLeft;
    startT = icon.offsetTop;
    iconTopZ++;
    icon.style.zIndex = iconTopZ;
  });

  window.addEventListener('mousemove', e => {
    if (!iconDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    icon.style.left = Math.max(0, startL + dx) + 'px';
    icon.style.top  = Math.max(0, startT + dy) + 'px';
  });

  window.addEventListener('mouseup', () => { iconDragging = false; });

  icon.addEventListener('click', e => {
    if (moved) { moved = false; return; }
    e.stopPropagation();
    const winId = icon.dataset.win;
    const now   = Date.now();

    deselectAllIcons();
    icon.classList.add('selected');

    if (winId && now - lastClick.time < 400 && lastClick.id === icon.id) {
      openWindow(winId);
    }

    lastClick = { id: icon.id, time: now };
  });
});

// Click desktop = deselect icons
document.getElementById('desktop').addEventListener('click', deselectAllIcons);

/* ── INITIAL ICON + WINDOW POSITIONS ── */
window.addEventListener('DOMContentLoaded', () => {
  const vw = window.innerWidth;
  const vh = window.innerHeight - 20; // subtract menu bar

  /* Icon positions — two columns on the right */
  const positions = {
    'icon-hd':       { left: vw - 90,  top: 20  },
    'icon-about':    { left: vw - 90,  top: 110 },
    'icon-services': { left: vw - 90,  top: 200 },
    'icon-build':    { left: vw - 90,  top: 290 },
    'icon-process':  { left: vw - 170, top: 65  },
    'icon-contact':  { left: vw - 170, top: 155 },
    'icon-trash':    { left: vw - 90,  top: vh - 110 }
  };

  Object.entries(positions).forEach(([id, pos]) => {
    const el = document.getElementById(id);
    if (el) { el.style.left = pos.left + 'px'; el.style.top = pos.top + 'px'; }
  });

  /* Center the landing window and bring to front */
  const landing = document.getElementById('win-landing');
  if (landing) {
    landing.style.left = Math.max(20, (vw - 560) / 2) + 'px';
    landing.style.top  = Math.max(20, (vh - 480) / 3) + 'px';
    bringToFront(landing);
  }
});

/* ── MENU BAR — close dropdowns on outside click ── */
document.addEventListener('click', e => {
  if (!e.target.closest('.menu-item')) {
    document.querySelectorAll('.menu-item').forEach(m => m.blur());
  }
});
