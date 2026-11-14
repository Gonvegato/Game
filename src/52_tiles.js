// ───────────────────────── La sala dibujada: losas, muros de sillería y antorchas ─────────────────────────
// Se pinta una sola vez por sala en un lienzo aparte (con un margen de muro alrededor) y luego se copia cada fotograma.
const WPAL = [
  { f: ['#2c2b38', '#32313f', '#282733'], j: '#1c1b25', cap: '#42405a', capHi: '#5f5c7c', capLo: '#2a2939', br: ['#4b485d', '#5a5770'], brHi: '#6f6c88', mo: '#201e2a', deco: 'bones' },      // Las Criptas: piedra fría
  { f: ['#2b3026', '#31372b', '#262b22'], j: '#1a1e17', cap: '#3d4a33', capHi: '#5a6c48', capLo: '#273021', br: ['#4a4a3a', '#575846'], brHi: '#6e7058', mo: '#1c1f18', deco: 'moss' },       // El Nido: piedra con musgo
  { f: ['#252b3a', '#2a3142', '#212634'], j: '#171b27', cap: '#37435c', capHi: '#52628a', capLo: '#232b3d', br: ['#3f4a63', '#4a5772'], brHi: '#62719a', mo: '#191e2b', deco: 'shards' },     // Las Minas: pizarra azul
  { f: ['#33232b', '#3a2831', '#2c1f26'], j: '#1f151a', cap: '#4a2f3e', capHi: '#6e4558', capLo: '#2f1e28', br: ['#523645', '#5f3f50'], brHi: '#7a5468', mo: '#1d1218', deco: 'runes' },      // El Umbral: piedra sangrienta
];
const BG_M = 3;   // casillas de margen alrededor de la sala
let ROOM_BG = null;
function roomBg() {
  if (ROOM_BG && ROOM_BG.walls === S.walls && ROOM_BG.world === S.world) return ROOM_BG;
  const c = NAV.cols, r = NAV.rows, W = WPAL[clamp((S.world || 1) - 1, 0, 3)], cvs = document.createElement('canvas'), g = cvs.getContext('2d');
  cvs.width = (c + BG_M * 2) * CELL; cvs.height = (r + BG_M * 2) * CELL;
  const wallAt = (x, y) => x < 0 || y < 0 || x >= c || y >= r || NAV.wall[y * c + x] === 1;
  const inside = (x, y) => x >= -BG_M && y >= -BG_M && x < c + BG_M && y < r + BG_M;
  const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647 + (S.world || 1) * 9781) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const px = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  g.fillStyle = '#0b080d'; g.fillRect(0, 0, cvs.width, cvs.height);
  g.translate(BG_M * CELL, BG_M * CELL);
  // Suelo: losas a tresbolillo, cada una con su tono, juntas oscuras y desgaste
  for (let ty = 0; ty < r; ty++) for (let sx = -1; sx <= c; sx++) {
    const x0 = sx * CELL + (ty % 2 ? 8 : 0), y0 = ty * CELL, h = hash(sx, ty);
    px(x0, y0, W.f[Math.floor(h * 3)], CELL, CELL);
    px(x0, y0, W.j, CELL, 1); px(x0, y0, W.j, 1, CELL);
    px(x0 + 1, y0 + 1, tone(W.f[1], 0.07), CELL - 2, 1);
    for (let i = 0; i < 3; i++) px(x0 + 2 + Math.floor(hash(sx, ty, i + 1) * 12), y0 + 2 + Math.floor(hash(sx, ty, i + 5) * 12), tone(W.f[1], hash(sx, ty, i + 9) < 0.5 ? -0.2 : 0.1));
    if (h > 0.9) { let cx = x0 + 3 + Math.floor(hash(sx, ty, 20) * 6), cy = y0 + 3; for (let i = 0; i < 8; i++) { px(cx, cy, W.j); cy++; if (hash(sx, ty, 30 + i) < 0.5) cx += hash(sx, ty, 40 + i) < 0.5 ? 1 : -1; } }   // grieta
  }
  // Manchas grandes de humedad y desgaste, para que el suelo no sea uniforme
  for (let i = 0; i < Math.floor(c * r / 28); i++) { g.fillStyle = hash(i, 3, 5) < 0.6 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.025)'; const bw = 24 + Math.floor(hash(i, 1, 1) * 72), bh = 16 + Math.floor(hash(i, 2, 2) * 56); g.fillRect(Math.floor(hash(i, 7, 3) * c * CELL), Math.floor(hash(i, 9, 4) * r * CELL), bw, bh); g.fillRect(Math.floor(hash(i, 7, 3) * c * CELL) + 6, Math.floor(hash(i, 9, 4) * r * CELL) - 5, bw - 14, bh + 10); }
  // Adornos del suelo, según el mundo
  for (let y = 1; y < r - 1; y++) for (let x = 1; x < c - 1; x++) {
    if (wallAt(x, y) || hash(x, y, 77) > 0.014) continue;
    const X = x * CELL + 4, Y = y * CELL + 5;
    if (W.deco === 'bones') { px(X, Y + 2, '#7d7868', 7, 1); px(X, Y + 1, '#9a9482', 1, 3); px(X + 6, Y + 1, '#9a9482', 1, 3); if (hash(x, y, 78) < 0.4) { px(X + 1, Y - 3, '#9a9482', 4, 3); px(X + 2, Y - 2, '#1c1b25'); px(X + 4, Y - 2, '#1c1b25'); px(X + 2, Y, '#7d7868', 2, 1); } }
    else if (W.deco === 'moss') { for (let i = 0; i < 9; i++) px(X + Math.floor(hash(x, y, i) * 8), Y + Math.floor(hash(x, y, i + 10) * 6), i % 3 ? '#4f6b34' : '#7f9c4c'); }
    else if (W.deco === 'shards') { px(X + 2, Y, '#62d8ec', 1, 4); px(X + 3, Y + 1, '#2e8fa3', 1, 3); px(X + 5, Y + 2, '#62d8ec', 1, 2); px(X + 1, Y + 3, '#d6faff'); }
    else { g.fillStyle = '#6e2f3a'; g.fillRect(X, Y, 7, 1); g.fillRect(X + 3, Y - 2, 1, 6); g.fillRect(X + 1, Y + 3, 5, 1); }
  }
  // Muros. Si debajo hay suelo se ve la cara de sillares; si no, solo la coronación.
  const torches = [];
  for (let y = -BG_M; y < r + BG_M; y++) for (let x = -BG_M; x < c + BG_M; x++) {
    if (!wallAt(x, y)) continue;
    const X = x * CELL, Y = y * CELL, face = inside(x, y + 1) && !wallAt(x, y + 1) && y + 1 < r;
    const deep = wallAt(x - 1, y) && wallAt(x + 1, y) && wallAt(x, y - 1) && wallAt(x, y + 1) && wallAt(x - 1, y - 1) && wallAt(x + 1, y - 1) && wallAt(x - 1, y + 1) && wallAt(x + 1, y + 1);
    if (deep) { px(X, Y, x < 0 || y < 0 || x >= c || y >= r ? '#0b080d' : W.capLo, CELL, CELL); continue; }   // interior macizo
    px(X, Y, W.cap, CELL, CELL);
    for (let i = 0; i < 4; i++) px(X + 1 + Math.floor(hash(x, y, i) * 14), Y + 1 + Math.floor(hash(x, y, i + 4) * (face ? 3 : 14)), i % 2 ? W.capLo : W.capHi);
    if (hash(x, y, 9) < 0.5) px(X + (hash(x, y, 10) < 0.5 ? 0 : 8), Y, W.capLo, 1, face ? 5 : CELL);   // junta entre losas de la coronación
    if (!wallAt(x, y - 1) || y - 1 < 0 && false) px(X, Y, W.capHi, CELL, 1);
    if (!wallAt(x - 1, y)) px(X, Y, W.capHi, 1, CELL);
    if (!wallAt(x + 1, y)) px(X + CELL - 1, Y, W.capLo, 1, CELL);
    if (face) {
      px(X, Y + 4, W.capLo, CELL, 1);
      for (let row = 0; row < 2; row++) {
        const by = Y + 5 + row * 5, off = (row + y) % 2 ? 4 : 0;
        px(X, by, W.mo, CELL, 5);
        for (let bx = -8 + off; bx < CELL; bx += 8) {
          const x0 = Math.max(0, bx), x1 = Math.min(CELL, bx + 7); if (x1 <= x0) continue;
          const col = W.br[hash(x * 2 + Math.floor((bx + 8) / 8), y * 2 + row, 3) < 0.5 ? 0 : 1];
          px(X + x0, by + 1, col, x1 - x0, 4); px(X + x0, by + 1, W.brHi, x1 - x0, 1);
        }
      }
      px(X, Y + 15, W.mo, CELL, 1);
      if (W.deco === 'moss' && hash(x, y, 50) < 0.35) for (let i = 0; i < 6; i++) px(X + Math.floor(hash(x, y, 51 + i) * 15), Y + 5 + Math.floor(hash(x, y, 60 + i) * 5), '#4f6b34', 1, 2);
      if (W.deco === 'shards' && hash(x, y, 50) < 0.12) { px(X + 6, Y + 9, '#62d8ec', 2, 4); px(X + 7, Y + 8, '#d6faff', 1, 2); }
      // sombra que el muro echa sobre el suelo
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(X, Y + CELL, CELL, 2); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(X, Y + CELL + 2, CELL, 3);
      if (((x % 5) + 5) % 5 === 2 && hash(x, y, 90) < 0.75 && !wallAt(x, y + 2)) { torches.push({ x: X + 8, y: Y + 6 }); px(X + 7, Y + 8, PAL.B, 2, 5); px(X + 6, Y + 8, PAL.G, 4, 1); }
    }
  }
  return (ROOM_BG = { c: cvs, walls: S.walls, world: S.world, torches });
}
// Viñeta: oscurece los bordes de la pantalla, como una mazmorra iluminada desde el centro
let VIG = null;
function vignette(w, h) {
  if (VIG && VIG.width === w && VIG.height === h) return VIG;
  VIG = document.createElement('canvas'); VIG.width = w; VIG.height = h;
  const g = VIG.getContext('2d'), gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  gr.addColorStop(0, 'rgba(8,5,12,0)'); gr.addColorStop(1, 'rgba(8,5,12,0.62)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  return VIG;
}
