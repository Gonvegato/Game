// ───────────────────────── Salas: muros, formas y caminos ─────────────────────────
// Cada sala es una rejilla de casillas de CELL unidades. Un generador decide qué casillas son muro;
// después se comprueba que todo el suelo sea alcanzable y se funden las casillas de muro en rectángulos.
// Los enemigos que no ven al jugador siguen un campo de distancias calculado desde su casilla.
const CELL = 16;
const ROOM_SIZES = { small: [40, 26], mid: [46, 30], big: [52, 34], boss: [50, 34], huge: [66, 44] };
const NAV = { cols: 0, rows: 0, wall: new Uint8Array(0), dist: new Int16Array(0), t: 0, pc: -1 };

// Generadores: reciben una rejilla vacía (g[y][x] = 0) y devuelven la casilla donde empieza el jugador.
const fillRect = (g, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = 1; };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const ROOM_GEN = {
  // Sala de columnas: pilares cuadrados en retícula
  columnas(g, c, r) {
    const sx = ri(6, 8), sy = ri(5, 6), ox = Math.floor((c % sx) / 2) + 3, oy = Math.floor((r % sy) / 2) + 3;
    for (let y = oy; y < r - 3; y += sy) for (let x = ox; x < c - 3; x += sx) if (Math.abs(x - c / 2) > 3 || Math.abs(y - r / 2) > 3) fillRect(g, x, y, 2, 2);
    return [c >> 1, r >> 1];
  },
  // Cruz: cuatro bloques en las esquinas dejan una sala en forma de más
  cruz(g, c, r) {
    const w = Math.floor(c * 0.27), h = Math.floor(r * 0.3);
    fillRect(g, 0, 0, w, h); fillRect(g, c - w, 0, w, h); fillRect(g, 0, r - h, w, h); fillRect(g, c - w, r - h, w, h);
    fillRect(g, (c >> 1) - 1, (r >> 1) - 5, 2, 2); fillRect(g, (c >> 1) - 1, (r >> 1) + 3, 2, 2);
    return [c >> 1, r >> 1];
  },
  // Torreón: un gran bloque central con un pasillo alrededor y cuatro pilares de esquina
  torreon(g, c, r) {
    const w = Math.floor(c * 0.3), h = Math.floor(r * 0.3), x = (c - w) >> 1, y = (r - h) >> 1;
    fillRect(g, x, y, w, h);
    for (const [px, py] of [[5, 4], [c - 7, 4], [5, r - 6], [c - 7, r - 6]]) fillRect(g, px, py, 2, 2);
    return [c >> 1, r - 4];
  },
  // Galerías: muros largos horizontales con huecos, formando pasillos
  galerias(g, c, r) {
    for (const y of [Math.floor(r / 3) - 1, Math.floor(2 * r / 3)]) {
      fillRect(g, 0, y, c, 2);
      const gaps = [ri(4, Math.floor(c / 3) - 5), ri(Math.floor(c / 3) + 2, Math.floor(2 * c / 3) - 6), ri(Math.floor(2 * c / 3) + 1, c - 9)];
      for (const gx of gaps) for (let j = y; j < y + 2; j++) for (let i = gx; i < gx + 5; i++) g[j][i] = 0;
    }
    return [c >> 1, r >> 1];
  },
  // Recovecos: contrafuertes que salen de los muros de arriba y abajo y dejan nichos entre ellos
  recovecos(g, c, r) {
    const step = ri(6, 8), len = Math.floor(r * 0.3);
    for (let x = 4, k = 0; x < c - 4; x += step, k++) { if (k % 2) fillRect(g, x, 0, 2, len); else fillRect(g, x, r - len, 2, len); }
    for (const y of [Math.floor(r / 2) - 1]) { fillRect(g, 0, y, 4, 2); fillRect(g, c - 4, y, 4, 2); }
    return [c >> 1, r >> 1];
  },
  // Sala en L doble: dos esquinas opuestas tapiadas y pilares en el paso
  codo(g, c, r) {
    const w = Math.floor(c * 0.36), h = Math.floor(r * 0.42), flip = Math.random() < 0.5;
    fillRect(g, flip ? c - w : 0, 0, w, h); fillRect(g, flip ? 0 : c - w, r - h, w, h);
    fillRect(g, (c >> 1) - 5, (r >> 1) - 1, 2, 2); fillRect(g, (c >> 1) + 3, (r >> 1) - 1, 2, 2);
    return [flip ? 6 : c - 7, 5];
  },
  // Escombros: trozos de muro sueltos en L, en T y rectos, con simetría
  escombros(g, c, r) {
    const half = c >> 1;
    for (let n = 0, tries = 0; n < 6 && tries < 80; tries++) {
      const x = ri(3, half - 6), y = ri(3, r - 8), horiz = Math.random() < 0.5, len = ri(3, 6);
      const w = horiz ? len : 2, h = horiz ? 2 : len;
      let ok = Math.abs(x + w / 2 - half) > 4 || Math.abs(y + h / 2 - r / 2) > 4;
      for (let j = y - 3; j < y + h + 3 && ok; j++) for (let i = x - 3; i < x + w + 3; i++) if (g[j] && g[j][i]) { ok = false; break; }
      if (!ok) continue;
      fillRect(g, x, y, w, h); fillRect(g, c - x - w, y, w, h);
      if (Math.random() < 0.5) { const ex = horiz ? x : x + 2, ey = horiz ? y + 2 : y; fillRect(g, ex, ey, horiz ? 2 : 2, horiz ? 2 : 2); fillRect(g, c - ex - 2, ey, 2, 2); }
      n++;
    }
    return [half, r >> 1];
  },
  // Partida en dos por un muro central con dos pasos
  tabique(g, c, r) {
    const x = (c >> 1) - 1, g1 = ri(3, Math.floor(r / 3) - 3), g2 = ri(Math.floor(2 * r / 3) - 2, r - 8);
    fillRect(g, x, 0, 2, r);
    for (const gy of [g1, g2]) for (let j = gy; j < gy + 5; j++) for (let i = x; i < x + 2; i++) g[j][i] = 0;
    for (const px of [Math.floor(c * 0.22), Math.floor(c * 0.75)]) { fillRect(g, px, Math.floor(r * 0.3), 2, 2); fillRect(g, px, Math.floor(r * 0.65), 2, 2); }
    return [Math.floor(c * 0.25), r >> 1];
  },
  // Octógono: esquinas en escalera y un bloque en el centro
  octogono(g, c, r) {
    for (let k = 0; k < 6; k++) { const w = (6 - k) * 2; fillRect(g, 0, k, w, 1); fillRect(g, c - w, k, w, 1); fillRect(g, 0, r - 1 - k, w, 1); fillRect(g, c - w, r - 1 - k, w, 1); }
    fillRect(g, (c >> 1) - 2, (r >> 1) - 2, 4, 4);
    return [c >> 1, r - 5];
  },
  // Claustro: un patio interior rodeado por un muro con cuatro puertas
  claustro(g, c, r) {
    const x0 = Math.floor(c * 0.25), y0 = Math.floor(r * 0.25), w = c - 2 * x0, h = r - 2 * y0;
    fillRect(g, x0, y0, w, 2); fillRect(g, x0, y0 + h - 2, w, 2); fillRect(g, x0, y0, 2, h); fillRect(g, x0 + w - 2, y0, 2, h);
    const mx = (c >> 1) - 2, my = (r >> 1) - 2;
    for (let i = mx; i < mx + 5; i++) { g[y0][i] = g[y0 + 1][i] = g[y0 + h - 2][i] = g[y0 + h - 1][i] = 0; }
    for (let j = my; j < my + 5; j++) { g[j][x0] = g[j][x0 + 1] = g[j][x0 + w - 2] = g[j][x0 + w - 1] = 0; }
    return [c >> 1, r >> 1];
  },
  // Aldea: cuatro casas de piedra alrededor de una plaza con la campana en medio
  aldea(g, c, r) {
    for (const [fx, fy] of [[0.2, 0.22], [0.8, 0.22], [0.2, 0.78], [0.8, 0.78]]) fillRect(g, Math.floor(c * fx) - 2, Math.floor(r * fy) - 1, 5, 3);
    fillRect(g, (c >> 1) - 9, (r >> 1) - 1, 2, 2); fillRect(g, (c >> 1) + 7, (r >> 1) - 1, 2, 2);
    return [c >> 1, (r >> 1) + 4];
  },
  // Arena de jefe: abierta, con pilares cuadrados contra los que estrellarlo
  arena(g, c, r) {
    for (const [fx, fy] of [[0.22, 0.3], [0.78, 0.3], [0.22, 0.72], [0.78, 0.72], [0.5, 0.52]]) fillRect(g, Math.floor(c * fx) - 1, Math.floor(r * fy) - 1, 3, 3);
    return [c >> 1, r - 5];
  },
};
let ROOM_FORCE = null;   // solo para pruebas
const ROOM_KINDS = Object.keys(ROOM_GEN).filter(k => k !== 'arena' && k !== 'aldea');

// Monta una sala. Devuelve { w, h, walls, start, kind }.
function buildRoom(boss, kindF, sizeF) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const kind = boss ? 'arena' : kindF && attempt < 8 ? kindF : ROOM_FORCE && attempt < 6 ? ROOM_FORCE : attempt > 8 ? 'columnas' : ROOM_KINDS[Math.floor(Math.random() * ROOM_KINDS.length)];
    const [c, r] = ROOM_SIZES[boss ? 'boss' : sizeF || ['small', 'mid', 'mid', 'big'][ri(0, 3)]];
    const g = Array.from({ length: r }, () => new Array(c).fill(0));
    const [sx, sy] = ROOM_GEN[kind](g, c, r);
    for (let j = sy - 1; j <= sy + 1; j++) for (let i = sx - 1; i <= sx + 1; i++) if (g[j] && i >= 0 && i < c) g[j][i] = 0;   // el punto de entrada, despejado
    // Alcance desde la entrada: lo que no se pueda pisar pasa a ser muro, para que no queden bolsas inaccesibles
    const seen = Array.from({ length: r }, () => new Array(c).fill(0)), q = [[sx, sy]]; seen[sy][sx] = 1; let open = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= c || ny >= r || g[ny][nx] || seen[ny][nx]) continue; seen[ny][nx] = 1; open++; q.push([nx, ny]); } }
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (!seen[y][x]) g[y][x] = 1;
    if (open < c * r * 0.55) continue;                 // demasiado cerrada: otra
    // Fundir casillas de muro en rectángulos: tiras horizontales que se alargan hacia abajo si coinciden
    const walls = [], used = Array.from({ length: r }, () => new Array(c).fill(0));
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
      if (!g[y][x] || used[y][x]) continue;
      let w = 1; while (x + w < c && g[y][x + w] && !used[y][x + w]) w++;
      let h = 1; outer: while (y + h < r) { for (let i = x; i < x + w; i++) if (!g[y + h][i] || used[y + h][i]) break outer; h++; }
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) used[j][i] = 1;
      walls.push({ x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL });
    }
    NAV.cols = c; NAV.rows = r; NAV.wall = new Uint8Array(c * r); NAV.dist = new Int16Array(c * r).fill(-1); NAV.t = 0; NAV.pc = -1;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) NAV.wall[y * c + x] = g[y][x];
    // Trampas de pinchos: placas de 2×2 en suelo libre, lejos de la entrada
    const traps = [];
    for (let i = 0, tries = 0; i < (boss ? 3 : ri(2, 5)) && tries < 80; tries++) {
      const x = ri(2, c - 4), y = ri(2, r - 4);
      if (g[y][x] || g[y][x + 1] || g[y + 1][x] || g[y + 1][x + 1] || Math.hypot(x - sx, y - sy) < 5) continue;
      if (traps.some(t => Math.abs(t.x / CELL - x) < 4 && Math.abs(t.y / CELL - y) < 4)) continue;
      traps.push({ x: x * CELL, y: y * CELL, w: CELL * 2, h: CELL * 2, off: Math.random() * 3.4, state: 0, acc: 0, hitP: false }); i++;
    }
    return { traps, w: c * CELL, h: r * CELL, walls, start: { x: (sx + 0.5) * CELL, y: (sy + 0.5) * CELL }, kind };
  }
}
const isWallAt = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx < 0 || cy < 0 || cx >= NAV.cols || cy >= NAV.rows || NAV.wall[cy * NAV.cols + cx] === 1; };
// Un punto libre al azar, alcanzable, a cierta distancia de otro. Para colocar enemigos.
function freeSpot(from, minD) {
  let best = null, bd = -1;
  for (let i = 0; i < 40; i++) {
    const cx = ri(1, NAV.cols - 2), cy = ri(1, NAV.rows - 2);
    if (NAV.wall[cy * NAV.cols + cx]) continue;
    const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL, d = from ? Math.hypot(x - from.x, y - from.y) : 1e9;
    if (d >= minD) return { x, y };
    if (d > bd) { bd = d; best = { x, y }; }
  }
  return best || { x: T.room.w / 2, y: T.room.h / 2 };
}
// Si un punto cae dentro de un muro, la casilla libre más cercana
function unstick(x, y) {
  if (!isWallAt(x, y)) return { x, y };
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let rad = 1; rad < 8; rad++) for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
    if (i < 0 || j < 0 || i >= NAV.cols || j >= NAV.rows || NAV.wall[j * NAV.cols + i]) continue;
    return { x: (i + 0.5) * CELL, y: (j + 0.5) * CELL };
  }
  return { x: T.room.w / 2, y: T.room.h / 2 };
}

// Hasta dónde llega un rayo antes de chocar con un muro
function rayClip(x, y, ux, uy, len) {
  let best = len;
  for (const w of S.walls) {
    let t0 = 0, t1 = best;
    if (Math.abs(ux) < 1e-9) { if (x < w.x || x > w.x + w.w) continue; }
    else { let a = (w.x - x) / ux, b = (w.x + w.w - x) / ux; if (a > b) { const t = a; a = b; b = t; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) continue; }
    if (Math.abs(uy) < 1e-9) { if (y < w.y || y > w.y + w.h) continue; }
    else { let a = (w.y - y) / uy, b = (w.y + w.h - y) / uy; if (a > b) { const t = a; a = b; b = t; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) continue; }
    if (t0 < best) best = Math.max(0, t0);
  }
  return best;
}
// Igual, pero cuenta el borde de la sala y dice qué cara tocó ('x' o 'y') para poder rebotar
function rayHit(x, y, ux, uy, len) {
  let best = rayClip(x, y, ux, uy, len), side = null;
  const R = T.room, tx = ux > 0 ? (R.w - x) / ux : ux < 0 ? -x / ux : 1e9, ty = uy > 0 ? (R.h - y) / uy : uy < 0 ? -y / uy : 1e9;
  if (Math.min(tx, ty) < best) { best = Math.max(0, Math.min(tx, ty)); side = tx < ty ? 'x' : 'y'; }
  else if (best < len - 0.01) { const hx = x + ux * best, hy = y + uy * best, bx = isWallAt(hx + Math.sign(ux) * 1.5, hy - uy * 1.5), by = isWallAt(hx - ux * 1.5, hy + Math.sign(uy) * 1.5); side = bx && !by ? 'x' : by && !bx ? 'y' : Math.abs(ux) > Math.abs(uy) ? 'x' : 'y'; }
  return { len: best, side };
}
function blocked(a, b) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return rayClip(a.x, a.y, dx / d, dy / d, d) < d - 0.01; }
// Empujar fuera de los muros a un círculo. Devuelve el muro tocado, si lo hay.
function collide(o, r) {
  let hitW = null;
  for (let pass = 0; pass < 2; pass++) for (const w of S.walls) {
    const cx = clamp(o.x, w.x, w.x + w.w), cy = clamp(o.y, w.y, w.y + w.h), dx = o.x - cx, dy = o.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= r * r) continue;
    hitW = w;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); o.x = cx + dx / d * r; o.y = cy + dy / d * r; }
    else {   // el centro está dentro: salir por el lado más cercano
      const l = o.x - w.x, rr = w.x + w.w - o.x, t = o.y - w.y, b = w.y + w.h - o.y, m = Math.min(l, rr, t, b);
      if (m === l) o.x = w.x - r; else if (m === rr) o.x = w.x + w.w + r; else if (m === t) o.y = w.y - r; else o.y = w.y + w.h + r;
    }
  }
  return hitW;
}
const touchesWall = (o, r) => S.walls.some(w => { const cx = clamp(o.x, w.x, w.x + w.w), cy = clamp(o.y, w.y, w.y + w.h); return (o.x - cx) ** 2 + (o.y - cy) ** 2 < r * r; });

// Campo de distancias desde la casilla del jugador (se recalcula cuando cambia de casilla, como mucho 5 veces por segundo)
function navUpdate(dt) {
  const p = S.p, c = NAV.cols, r = NAV.rows, pc = Math.floor(p.y / CELL) * c + Math.floor(p.x / CELL);
  NAV.t -= dt;
  if (!c || (pc === NAV.pc && NAV.t > -1) || NAV.t > 0) return;
  NAV.t = 0.2; NAV.pc = pc;
  const d = NAV.dist; d.fill(-1);
  if (pc < 0 || pc >= c * r || NAV.wall[pc]) return;
  const q = new Int32Array(c * r); let qh = 0, qt = 0; q[qt++] = pc; d[pc] = 0;
  while (qh < qt) {
    const i = q[qh++], x = i % c, y = (i / c) | 0, nd = d[i] + 1;
    if (x > 0 && !NAV.wall[i - 1] && d[i - 1] < 0) { d[i - 1] = nd; q[qt++] = i - 1; }
    if (x < c - 1 && !NAV.wall[i + 1] && d[i + 1] < 0) { d[i + 1] = nd; q[qt++] = i + 1; }
    if (y > 0 && !NAV.wall[i - c] && d[i - c] < 0) { d[i - c] = nd; q[qt++] = i - c; }
    if (y < r - 1 && !NAV.wall[i + c] && d[i + c] < 0) { d[i + c] = nd; q[qt++] = i + c; }
  }
}
// Hacia dónde debe andar un enemigo para llegar al jugador: recto si lo ve, por el camino si no
function navDir(e, ux, uy) {
  const p = S.p, d = Math.hypot(p.x - e.x, p.y - e.y) || 1, nx = -uy * e.r * 0.8, ny = ux * e.r * 0.8;
  const clear = (ox, oy) => rayClip(e.x + ox, e.y + oy, ux, uy, d) >= d - 0.01;
  if (clear(0, 0) && clear(nx, ny) && clear(-nx, -ny)) return [ux, uy];
  const c = NAV.cols, r = NAV.rows, cx = clamp(Math.floor(e.x / CELL), 0, c - 1), cy = clamp(Math.floor(e.y / CELL), 0, r - 1);
  let best = -1, bx = 0, by = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const x = cx + dx, y = cy + dy;
    if (x < 0 || y < 0 || x >= c || y >= r) continue;
    const v = NAV.dist[y * c + x];
    if (v < 0) continue;
    if (dx && dy && (NAV.wall[cy * c + x] || NAV.wall[y * c + cx])) continue;   // sin recortar esquinas
    if (best < 0 || v < best) { best = v; bx = x; by = y; }
  }
  if (best < 0) return [ux, uy];
  const tx = (bx + 0.5) * CELL - e.x, ty = (by + 0.5) * CELL - e.y, tl = Math.hypot(tx, ty) || 1;
  return [tx / tl, ty / tl];
}
