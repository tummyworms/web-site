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
    const gx     = Math.floor((vw - gridW) / 2);
    const col2   = gx + iconW + colGap;

    const pos = {
      'icon-hd':       { left: gx,    top: 28  },
      'icon-about':    { left: gx,    top: 118 },
      'icon-services': { left: gx,    top: 208 },
      'icon-build':    { left: col2,  top: 28  },
      'icon-process':  { left: col2,  top: 118 },
      'icon-contact':  { left: col2,  top: 208 },
      'icon-snake':    { left: gx,    top: 298 },
      'icon-trash':    { left: gx + Math.floor((gridW - iconW) / 2), top: vh - 84 }
    };
    Object.entries(pos).forEach(([id, p]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = p.left + 'px'; el.style.top = p.top + 'px'; }
    });

  } else {
    /* Desktop: single right column icons */
    const pos = {
      'icon-hd':       { left: vw - 90, top: 40  },
      'icon-build':    { left: vw - 90, top: 115 },
      'icon-services': { left: vw - 90, top: 190 },
      'icon-process':  { left: vw - 90, top: 265 },
      'icon-contact':  { left: vw - 90, top: 340 },
      'icon-about':    { left: vw - 90, top: 415 },
      'icon-snake':    { left: vw - 90, top: 490 },
      'icon-trash':    { left: vw - 90, top: vh - 90 }
    };
    Object.entries(pos).forEach(([id, p]) => {
      const el = document.getElementById(id);
      if (el) { el.style.left = p.left + 'px'; el.style.top = p.top + 'px'; }
    });

    /* Desktop: 4-window layout matching screenshot */
    const winPos = {
      'win-process': { left: 85,                         top: 108 },
      'win-landing': { left: Math.floor(vw * 0.355),     top: Math.floor(vh * 0.28) },
      'win-build':   { left: Math.floor(vw * 0.676),     top: 108 },
      'win-contact': { left: Math.floor(vw * 0.676),     top: Math.floor(vh * 0.575) },
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

/* ══════════════════════════════════════
   SNAKE GAME
══════════════════════════════════════ */
(function () {
  let cleanup = null;

  function startSnake() {
    if (cleanup) { cleanup(); cleanup = null; }

    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const CELL = 10;
    const COLS = canvas.width  / CELL;  // 20
    const ROWS = canvas.height / CELL;  // 20
    const W = canvas.width;
    const H = canvas.height;

    let snake, dir, nextDir, food, score, alive, started;

    function reset() {
      snake    = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
      dir      = {x:1, y:0};
      nextDir  = {x:1, y:0};
      score    = 0;
      alive    = true;
      started  = false;
      placeFood();
    }

    function placeFood() {
      do {
        food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (snake.some(s => s.x === food.x && s.y === food.y));
    }

    function draw() {
      // Background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);

      // Dot grid
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let x = 0; x < COLS; x++)
        for (let y = 0; y < ROWS; y++)
          ctx.fillRect(x * CELL + 4, y * CELL + 4, 2, 2);

      // Food
      ctx.fillStyle = '#000';
      ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

      // Snake
      snake.forEach((seg, i) => {
        ctx.fillStyle = '#000';
        ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL - 1, CELL - 1);
        if (i === 0) {
          // Eyes based on direction
          ctx.fillStyle = '#fff';
          if (dir.x === 1)  { ctx.fillRect(seg.x*CELL+6,seg.y*CELL+2,2,2); ctx.fillRect(seg.x*CELL+6,seg.y*CELL+6,2,2); }
          if (dir.x === -1) { ctx.fillRect(seg.x*CELL+1,seg.y*CELL+2,2,2); ctx.fillRect(seg.x*CELL+1,seg.y*CELL+6,2,2); }
          if (dir.y === -1) { ctx.fillRect(seg.x*CELL+2,seg.y*CELL+1,2,2); ctx.fillRect(seg.x*CELL+6,seg.y*CELL+1,2,2); }
          if (dir.y === 1)  { ctx.fillRect(seg.x*CELL+2,seg.y*CELL+6,2,2); ctx.fillRect(seg.x*CELL+6,seg.y*CELL+6,2,2); }
        }
      });

      // Score
      ctx.fillStyle = '#000';
      ctx.font = 'bold 9px Silkscreen, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE ' + String(score).padStart(4, '0'), 3, H - 3);

      // Overlay messages
      function overlay(lines) {
        const lh = 14, pad = 10;
        const bh = lines.length * lh + pad * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(0, H/2 - bh/2, W, bh);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, H/2 - bh/2, W, bh);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        lines.forEach((line, i) => ctx.fillText(line, W/2, H/2 - bh/2 + pad + lh * i + 10));
        ctx.textAlign = 'left';
        ctx.lineWidth = 1;
      }

      if (!started && alive) overlay(['CLICK TO START', 'ARROWS / WASD TO MOVE']);
      if (!alive)            overlay(['GAME OVER', 'SCORE: ' + score, 'CLICK TO PLAY AGAIN']);
    }

    function step() {
      if (!alive || !started) return;
      dir = { ...nextDir };
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
          snake.some(s => s.x === head.x && s.y === head.y)) {
        alive = false;
        draw();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) { score++; placeFood(); }
      else snake.pop();
      draw();
    }

    const onKey = e => {
      if (document.getElementById('win-snake').style.display === 'none') return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      if (!started && (e.key === 'Enter' || e.key === ' ')) { started = true; draw(); return; }
      if (!alive) return;
      if ((e.key==='ArrowUp'   ||e.key==='w') && dir.y!== 1) nextDir={x:0,y:-1};
      if ((e.key==='ArrowDown' ||e.key==='s') && dir.y!==-1) nextDir={x:0,y: 1};
      if ((e.key==='ArrowLeft' ||e.key==='a') && dir.x!== 1) nextDir={x:-1,y:0};
      if ((e.key==='ArrowRight'||e.key==='d') && dir.x!==-1) nextDir={x: 1,y:0};
    };

    canvas.addEventListener('click', () => {
      if (!started) { started = true; draw(); }
      else if (!alive) { reset(); draw(); }
    });

    // Touch swipe
    let tx = 0, ty = 0;
    canvas.addEventListener('touchstart', e => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
      if (!started) { started = true; draw(); }
      else if (!alive) { reset(); draw(); }
    }, { passive: true });
    canvas.addEventListener('touchend', e => {
      if (!alive) return;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 15 && dir.x !== -1) nextDir = {x: 1, y: 0};
        if (dx < -15 && dir.x !==  1) nextDir = {x:-1, y: 0};
      } else {
        if (dy > 15 && dir.y !== -1) nextDir = {x: 0, y: 1};
        if (dy < -15 && dir.y !==  1) nextDir = {x: 0, y:-1};
      }
    }, { passive: true });

    document.addEventListener('keydown', onKey);
    reset();
    draw();
    const interval = setInterval(step, 120);

    return () => { clearInterval(interval); document.removeEventListener('keydown', onKey); };
  }

  // Hook into openWindow for snake
  const _openWindow = openWindow;
  window.openWindow = function(id) {
    _openWindow(id);
    if (id === 'win-snake') cleanup = startSnake();
  };

  // Clean up on close
  document.querySelector('#win-snake .close-box').addEventListener('click', () => {
    if (cleanup) { cleanup(); cleanup = null; }
  });
})();
