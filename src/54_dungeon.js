// ───────────────────────── Mazmorras con el arte de Pixel Crawler (Anokolisa, itch.io) ─────────────────────────
// Cada zona toma de un paquete su suelo, la cara de sus muros (tres franjas: remate, sillares y zócalo) y el borde de piedra
// que rodea la parte de arriba. Lo que no se ve desde abajo es la oscuridad de dentro del muro, como en el propio paquete.
for (const k of ['castle', 'cave', 'forge', 'rock', 'floors']) loadImg('pc_' + k, 'assets/pc_' + k + '.png');
const DPAL = [
  { img: 'pc_castle', top: '#1b1828', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_castle', 240, 272, 48, 48] },   // Las Criptas
  { img: 'pc_rock', top: '#2a1f17', face: [[32, 96], [32, 112], [32, 112]], rimT: [32, 0, 16, 8], rimL: [0, 40, 8, 16], rimR: [88, 40, 8, 16], floor: ['pc_cave', 112, 224, 48, 32] },            // El Nido
  { img: 'pc_rock', top: '#2a3036', face: [[128, 96], [128, 112], [128, 112]], rimT: [128, 0, 16, 8], rimL: [96, 40, 8, 16], rimR: [184, 40, 8, 16], floor: ['pc_floors', 96, 160, 32, 32] },  // Las Minas
  { img: 'pc_forge', top: '#21111a', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_forge', 16, 128, 32, 32] },          // El Umbral
];
const HALL = { img: 'pc_castle', top: '#1b1828', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_castle', 192, 272, 48, 48] };
function roomBgDungeon(Dover) {
  const D = Dover || DPAL[clamp((S.world || 1) - 1, 0, 3)], im = IMG[D.img], fim = IMG[D.floor[0]];
  if (!im || !fim) return null;
  if (ROOM_BG && ROOM_BG.pc && ROOM_BG.walls === S.walls && ROOM_BG.world === S.world && !Dover) return ROOM_BG;
  const c = NAV.cols, r = NAV.rows, cvs = document.createElement('canvas'), g = cvs.getContext('2d');
  cvs.width = (c + BG_M * 2) * CELL; cvs.height = (r + BG_M * 2) * CELL; g.imageSmoothingEnabled = false;
  g.fillStyle = D.top; g.fillRect(0, 0, cvs.width, cvs.height);
  g.translate(BG_M * CELL, BG_M * CELL);
  const wallAt = (x, y) => x < 0 || y < 0 || x >= c || y >= r || NAV.wall[y * c + x] === 1;
  const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647 + (S.world || 1) * 9781) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const blit = (src, s, dx, dy, w, h) => g.drawImage(src, s[0], s[1], w || s[2], h || s[3], dx, dy, w || s[2], h || s[3]);
  // Suelo: el dibujo del paquete repetido según la posición, para que enlace de casilla en casilla
  const [, fx, fy, fw, fh] = D.floor;
  for (let y = -1; y <= r; y++) for (let x = -1; x <= c; x++) {
    if (wallAt(x, y) && wallAt(x, y - 1) && wallAt(x, y + 1)) continue;
    const X = x * CELL, Y = y * CELL, ox = ((X % fw) + fw) % fw, oy = ((Y % fh) + fh) % fh;
    for (let j = 0; j < CELL;) { const sy = (oy + j) % fh, hh = Math.min(CELL - j, fh - sy);
      for (let i = 0; i < CELL;) { const sx = (ox + i) % fw, ww = Math.min(CELL - i, fw - sx); g.drawImage(fim, fx + sx, fy + sy, ww, hh, X + i, Y + j, ww, hh); i += ww; }
      j += hh; }
  }
  // Muros: la cara (hasta tres franjas por encima del suelo) y, encima, la oscuridad con su borde
  const torches = [];
  for (let y = -BG_M; y < r + BG_M; y++) for (let x = -BG_M; x < c + BG_M; x++) {
    if (!wallAt(x, y)) continue;
    const X = x * CELL, Y = y * CELL;
    let k = 0; while (k < 3 && wallAt(x, y + k + 1) === true && y + k + 1 < r) k++;   // cuántas casillas de muro hay debajo antes del suelo
    const floorBelow = y + k + 1 < r && y + k + 1 >= 0 && !wallAt(x, y + k + 1);
    if (floorBelow && k <= 2) {
      const row = k === 0 ? 2 : k === 1 ? 1 : 0;                   // de abajo arriba: zócalo, sillares, remate
      blit(im, [D.face[row][0] + (hash(x, y, 3) < 0.5 ? 0 : 16) * (D.img === 'pc_castle' || D.img === 'pc_forge' ? 1 : 0), D.face[row][1], 16, 16], X, Y);
      if (!wallAt(x - 1, y)) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(X, Y, 2, CELL); }
      if (!wallAt(x + 1, y)) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(X + CELL - 2, Y, 2, CELL); }
      if (k === 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X, Y + CELL, CELL, 3); }
      if (k === 1 && ((x % 5) + 5) % 5 === 2 && hash(x, y, 90) < 0.75 && y + 2 < r) torches.push({ x: X + 8, y: Y + 6 });
      continue;
    }
    // parte de arriba: oscuridad, y un borde allí donde termina el muro
    const edge = (dx, dy) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < c && ny < r && !wallAt(nx, ny); };
    const faceBelow = (dx, dy) => { const nx = x + dx, ny = y + dy; if (!wallAt(nx, ny)) return false; let j = 0; while (j < 3 && wallAt(nx, ny + j + 1) && ny + j + 1 < r) j++; return ny + j + 1 < r && !wallAt(nx, ny + j + 1) && j <= 2; };
    if (edge(0, -1)) blit(im, D.rimT, X, Y, 16, D.rimT[3]);
    if (edge(-1, 0) || faceBelow(-1, 0)) blit(im, D.rimL, X, Y, D.rimL[2], 16);
    if (edge(1, 0) || faceBelow(1, 0)) blit(im, D.rimR, X + CELL - D.rimR[2], Y, D.rimR[2], 16);
  }
  return (ROOM_BG = { c: cvs, walls: S.walls, world: S.world, torches, pc: true });
}
// El salón del trono: el fondo de mazmorra con el castillo, y encima alfombra, vidriera, trono, estandartes y macetas del paquete
function roomBgHall() {
  if (ROOM_BG && ROOM_BG.hall && ROOM_BG.walls === S.walls) return ROOM_BG;
  const base = roomBgDungeon(HALL); if (!base) return null;
  const im = IMG.pc_castle, g = base.c.getContext('2d'), c = NAV.cols, r = NAV.rows, cx = (c >> 1) * CELL;
  g.setTransform(1, 0, 0, 1, BG_M * CELL, BG_M * CELL); g.imageSmoothingEnabled = false;
  const spr = (sx, sy, w, h, x, y) => g.drawImage(im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
  for (let y = 6 * CELL; y < (r - 2) * CELL; y += 32) spr(288, 288, 48, Math.min(32, (r - 2) * CELL - y), cx - 24, y);   // alfombra
  spr(288, 272, 48, 8, cx - 24, 6 * CELL - 8);
  spr(160, 104, 32, 56, cx - 16, 1 * CELL + 6);                       // vidriera
  for (const dx of [-60, 44]) spr(192, 112, 16, 40, cx + dx, 2 * CELL);   // ventanas
  for (const dx of [-110, 94]) spr(272, 176, 32, 48, cx + dx, 3 * CELL - 4);   // estandartes
  spr(278, 13, 20, 51, cx - 10, 4 * CELL - 2);                        // trono
  for (const dx of [-46, 30]) spr(278, 123, 16, 32, cx + dx, 4 * CELL - 4);  // bustos
  for (const [x, y] of [[2.2, 16], [c - 3.6, 16], [2.2, 9.6], [c - 3.6, 9.6]]) spr(336, 224, 24, 48, x * CELL, y * CELL - 30);   // macetas
  g.setTransform(1, 0, 0, 1, 0, 0);
  base.torches = base.torches.filter(t => Math.abs(t.x - cx) > 40);   // ninguna antorcha delante de la vidriera
  base.hall = true; return base;
}
