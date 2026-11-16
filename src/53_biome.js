// ───────────────────────── Exteriores: suelos y decorado del paquete de biomas (byandrox, itch.io) ─────────────────────────
// La sala se pinta una vez: hierba, agua con sus orillas, caminos, y encima rocas, árboles y casas ordenados de arriba abajo.
loadImg('biome', 'assets/biomes.png'); loadImg('outdoor', 'assets/outdoor.png'); loadImg('town', 'assets/town.png'); loadImg('ruins', 'assets/ruins.png'); loadImg('houses', 'assets/houses.png'); loadImg('cityhouses', 'assets/cityhouses.png');
const BIO = {
  grass: { tiles: [0, 0], inner: [64, 0], water: [64, 32], base: '#819447' },
  tree: [[243, 32, 26, 32], [246, 65, 20, 31], [272, 65, 16, 31], [292, 67, 24, 29], [243, 100, 24, 26], [276, 102, 22, 24], [245, 8, 21, 21], [272, 37, 16, 22]],
  rock: [[112, 3, 31, 27], [147, 3, 28, 27], [113, 39, 29, 24], [146, 39, 29, 23]],
  bush: [[288, 34, 16, 12], [305, 32, 14, 16], [289, 51, 14, 12], [305, 112, 14, 16]],
  barrel: [[369, 48, 14, 15], [385, 48, 14, 16], [401, 48, 14, 16]],
  sign: [[337, 2, 14, 13], [352, 2, 16, 13], [369, 1, 14, 13]],
  well: [339, 69, 26, 19], vbridge: [340, 18, 24, 44], stairs: [336, 96, 32, 32], wall: [368, 96, 32, 16],
  deco: [[160, 74, 15, 6], [161, 99, 14, 10], [162, 87, 13, 9], [178, 74, 5, 5], [179, 68, 5, 5], [185, 72, 5, 5], [186, 65, 5, 5], [178, 97, 7, 7], [182, 105, 7, 7], [178, 81, 12, 14], [145, 69, 13, 10], [130, 86, 11, 8]],
  lily: [[192, 68, 16, 11], [192, 81, 16, 13]],
  ruin: [[161, 146, 29, 29], [274, 145, 26, 31], [304, 144, 15, 48], [321, 160, 14, 32], [274, 177, 29, 25], [164, 209, 25, 31], [276, 209, 24, 30], [306, 196, 29, 43], [241, 226, 29, 30], [273, 241, 30, 30], [194, 263, 44, 39], [337, 1, 14, 46], [352, 1, 16, 46], [353, 55, 14, 24]], cobble: [7, 71, 34, 31], tall: [7, 118, 33, 40],   // ruin: de Ancient Ruins (Androx), torres caídas, pilares y piedras con runas
};
// Otros biomas del paquete: el suelo es su baldosa central y el agua (o el hielo) se pinta encima con su propia orilla
BIO.snow = { land: [16, 384], water: [0, 304], winner: [64, 304], base: '#e4f0f0' };
BIO.savanna = { land: [16, 512], water: [0, 240], winner: [64, 240], base: '#b3a633' };
// Temas de exterior, uno por zona. Cada dibujo es [x, y, ancho, alto] de biomes.png o una clave de OUTP (outdoor.png).
// trees y rocks: obstáculos de 2×2 · big: de 3×2 · small: de 1×1 · deco: adorno que se pisa · forest y fbush: el borde de la sala
const THEMES = {
  grass: { biome: 'grass', trees: BIO.tree.slice(0, 6), rocks: BIO.rock, big: BIO.ruin.slice(0, 11).map(r => ['r'].concat(r)), small: BIO.bush, deco: BIO.deco, forest: BIO.tree.slice(0, 6), fbush: BIO.bush, pc: true },
  crypt: { biome: 'grass', trees: ['pine_l', 'pine_m', 'u_dtree2', 'pine_m', 'pine_l', 'dead_m'], rocks: BIO.rock.concat(['tomb1', 'tomb2', 'tomb3']), big: ['cross_stat', 'graves_row', 'angel2', 'reaper', 'cross2', 'olive', 'u_ruin2', 'u_ruin3', 'u_pile', 'u_arm1', 'u_ribs2'],
    small: ['grave1', 'grave2', 'grave3', 'grave4', 'cross_big', 'angel1', 'coffin1', 'coffin2', 'u_arm3', 'u_arm4', 'u_skull', 'u_bones1', 'u_beast'], deco: BIO.deco.slice(0, 3).concat([BIO.deco[10], BIO.deco[11]]), forest: ['pine_m', 'pine_s', 'pine_m', BIO.tree[1], 'pine_l', 'dead_s'], fbush: ['darkbush', BIO.bush[0]], dim: 'rgba(30,40,60,0.16)' },
  nest: { biome: 'grass', trees: [BIO.tree[0], 'mush_tall', BIO.tree[4], 'mush_l', BIO.tree[5], 'vine_l'], rocks: ['mossy2', 'boulder2', 'mossy3', 'boulder1'], big: ['mush_xl', 'mush_l', 'bush_g', 'bush_a', 'mossy3'],
    small: ['flower_m', 'flower_m2', 'vine_m', 'mush_m', 'vine_s', 'flower_l'], deco: BIO.deco, forest: BIO.tree.slice(0, 6).concat(['mush_l']), fbush: ['bush_g', BIO.bush[1], BIO.bush[3]], pc: true, dim: 'rgba(20,60,30,0.10)' },
  mines: { biome: 'snow', trees: [[227, 384, 26, 32], [230, 417, 20, 31], [256, 417, 16, 31], [276, 419, 24, 29], [161, 433, 30, 31], [192, 432, 32, 31]], rocks: [[113, 370, 30, 28], [112, 408, 27, 23], [145, 409, 29, 21], 'grey1', 'rune1', [148, 381, 26, 18]],
    big: BIO.ruin.slice(0, 11).map(r => ['r'].concat(r)).concat(['rune1']), small: [[176, 385, 16, 13], [209, 386, 15, 13], [304, 386, 16, 12], [208, 464, 16, 16], 'rune2', 'grey2', [144, 436, 16, 28]], deco: [[307, 435, 10, 9], [177, 417, 14, 13], [210, 418, 14, 12], [305, 403, 14, 12]],
    forest: [[227, 384, 26, 32], [230, 417, 20, 31], [256, 417, 16, 31], [276, 419, 24, 29], [230, 454, 22, 24], [261, 452, 24, 26]], fbush: [[176, 385, 16, 13], [145, 467, 14, 12], [193, 466, 14, 12]] },
  ash: { biome: 'savanna', trees: ['dead_l', 'u_tree1', 'dead_m', [240, 518, 32, 40], 'u_tree2', [274, 513, 45, 46]], rocks: [[116, 522, 44, 21], [160, 511, 31, 17], 'boulder3', 'boulder2'], big: ['tusk_l', 'tusk_m', 'deadtree', [192, 512, 48, 47], 'cross_stat', 'u_thorn2', 'u_ruin4', 'u_pile', 'u_arm1', 'u_ribs'],
    small: ['tusk_s', 'deadbush', [193, 530, 13, 27], 'coffin1', 'u_arm2', 'u_bones2', 'u_skull'], deco: [[129, 499, 15, 12], [113, 500, 14, 11], [145, 545, 15, 14], [260, 496, 25, 14]], forest: ['dead_m', 'u_tree3', 'deadbush', 'dead_l', 'u_dtree3', 'dead_m'], fbush: ['deadbush', [178, 497, 12, 13]], sparse: true, dim: 'rgba(52,34,34,0.34)' },
};
const ZONE_THEME = ['crypt', 'nest', 'mines', 'ash'];
// Una casa de aldea pintada a mano con la paleta del paquete (el paquete no trae edificios)
function drawHouse(g, X, Y, W, H, v) {
  const roofs = [['#9c4a3a', '#7a352c', '#c0644a'], ['#4a6a8a', '#35506c', '#6a8cae'], ['#6b5a3a', '#4f4129', '#8f7a50'], ['#5a7a3c', '#43602c', '#7f9c4c']][v % 4];
  const rh = Math.round(H * 0.56), px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(X + x, Y + y, w, h); };
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + 2, Y + H - 2, W, 4);
  px(2, rh, W - 4, H - rh, '#a67c52');                                                    // pared de tablas
  for (let x = 6; x < W - 4; x += 5) px(x, rh, 1, H - rh, '#8a6240');
  px(2, rh, W - 4, 4, '#5b3a2a'); px(2, H - 3, W - 4, 3, '#4a5768'); px(2, H - 4, W - 4, 1, '#66778f');   // sombra del alero y zócalo de piedra
  for (const x of [2, W - 5]) px(x, rh, 3, H - rh, '#5b3a2a');
  const dx = Math.round(W / 2) - 6, dh = Math.min(18, H - rh - 4);
  px(dx - 1, H - dh - 1, 14, dh + 1, '#3a241c'); px(dx, H - dh, 12, dh, '#6e4530'); px(dx + 5, H - dh, 1, dh, '#4a2e22'); px(dx + 9, H - Math.round(dh / 2), 2, 2, '#f2c14e');   // puerta
  for (const wx of [Math.round(W * 0.2) - 4, Math.round(W * 0.8) - 5]) { px(wx - 1, rh + 6, 11, 10, '#3a241c'); px(wx, rh + 7, 9, 8, '#f2c14e'); px(wx, rh + 7, 9, 2, '#ffe9a8'); px(wx + 4, rh + 7, 1, 8, '#3a241c'); px(wx, rh + 10, 9, 1, '#3a241c'); }
  px(-2, 0, W + 4, rh + 2, '#2a1a18');                                                    // tejado: hileras de tejas
  for (let row = 0; row * 4 < rh; row++) {
    const y = 1 + row * 4, h = Math.min(4, rh - row * 4);
    px(-1, y, W + 2, h, row % 2 ? roofs[0] : roofs[1]);
    for (let x = (row % 2 ? 2 : -1); x < W + 1; x += 6) px(x, y, 1, h, roofs[1] === (row % 2 ? roofs[0] : roofs[1]) ? '#2a1a18' : roofs[1]);
    px(-1, y, W + 2, 1, row === 0 ? roofs[2] : (row % 2 ? roofs[2] : roofs[0]));
  }
  px(Math.round(W * 0.7), -6, 8, 8, '#66778f'); px(Math.round(W * 0.7), -7, 8, 2, '#96a9c1'); px(Math.round(W * 0.7) + 7, -6, 1, 8, '#4a5768');   // chimenea
}
function roomBgOut() {
  const im = IMG.biome;
  if (ROOM_BG && ROOM_BG.out && ROOM_BG.walls === S.walls && (ROOM_BG.ok || !im)) return ROOM_BG;
  if ((!IMG.houses && S.out.obs.some(o => o.kind === 'house') || !IMG.cityhouses && S.out.obs.some(o => o.kind === 'chouse')) && im) return ROOM_BG && ROOM_BG.out && ROOM_BG.walls === S.walls ? ROOM_BG : (ROOM_BG = { c: document.createElement('canvas'), walls: S.walls, world: S.world, torches: [], out: true, ok: false });
  const TH = THEMES[S.out.theme] || THEMES.grass;
  if (im && !IMG.outdoor) return ROOM_BG && ROOM_BG.out && ROOM_BG.walls === S.walls ? ROOM_BG : (ROOM_BG = { c: document.createElement('canvas'), walls: S.walls, world: S.world, torches: [], out: true, ok: false });
  const c = NAV.cols, r = NAV.rows, O = S.out, B = BIO[TH.biome] || BIO.grass, cvs = document.createElement('canvas'), g = cvs.getContext('2d'), Mg = BG_M;
  cvs.width = (c + Mg * 2) * CELL; cvs.height = (r + Mg * 2) * CELL; g.imageSmoothingEnabled = false;
  g.fillStyle = B.base; g.fillRect(0, 0, cvs.width, cvs.height);
  const res = { c: cvs, walls: S.walls, world: S.world, torches: [], out: true, ok: !!im };
  if (!im) return (ROOM_BG = res);
  g.translate(Mg * CELL, Mg * CELL);
  const bridge = new Set(); for (const b of O.bridges) for (let j = 0; j < b.h; j++) bridge.add((b.y + j) * c + b.x);
  const at = (x, y) => (x < 0 || y < 0 || x >= c || y >= r ? 1 : NAV.wall[y * c + x]);
  const water = (x, y) => at(x, y) === 2 || (x >= 0 && y >= 0 && x < c && y < r && bridge.has(y * c + x));
  const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647 + c * 31 + S.walls.length * 977) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const spr = (s, x, y) => g.drawImage(im, s[0], s[1], s[2], s[3], Math.round(x), Math.round(y), s[2], s[3]);
  const stand = (s, cx, by) => spr(s, cx - s[2] / 2, by - s[3]);
  const shadow = (cx, by, w) => { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(cx, by - 1, w, 3, 0, 0, Math.PI * 2); g.fill(); };
  const tile = (o, tx, ty, x, y) => g.drawImage(im, o[0] + tx, o[1] + ty, 16, 16, x * CELL, y * CELL, 16, 16);
  // Dibuja una referencia de tema con los pies en (cx, by); devuelve su ancho
  const refS = rf => (typeof rf === 'string' ? OUTP[rf] : rf[0] === 'r' ? rf.slice(1) : rf) || [0, 0, 16, 16];
  const ref = (rf, cx, by) => { const q = refS(rf), src = typeof rf === 'string' ? IMG.outdoor : rf[0] === 'r' ? IMG.ruins : im; if (src) g.drawImage(src, q[0], q[1], q[2], q[3], Math.round(cx - q[2] / 2), Math.round(by - q[3]), q[2], q[3]); return q[2]; };
  const pick = (list, v) => list[((v % list.length) + list.length) % list.length];
  // Suelo: hierba, y agua con la orilla que le toca a cada casilla
  if (B.land) for (let y = -Mg; y < r + Mg; y++) for (let x = -Mg; x < c + Mg; x++) {   // nieve, tierra seca...: baldosa central y el agua encima
    g.drawImage(im, B.land[0], B.land[1], 16, 16, x * CELL, y * CELL, 16, 16);
    if (!water(x, y)) continue;
    const N = !water(x, y - 1), So = !water(x, y + 1), W = !water(x - 1, y), E = !water(x + 1, y), w3 = B.water, wi = B.winner;
    if (N && W) tile(w3, 0, 0, x, y); else if (N && E) tile(w3, 32, 0, x, y); else if (So && W) tile(w3, 0, 32, x, y); else if (So && E) tile(w3, 32, 32, x, y);
    else if (N) tile(w3, 16, 0, x, y); else if (So) tile(w3, 16, 32, x, y); else if (W) tile(w3, 0, 16, x, y); else if (E) tile(w3, 32, 16, x, y);
    else if (!water(x - 1, y - 1)) tile(wi, 0, 0, x, y); else if (!water(x + 1, y - 1)) tile(wi, 16, 0, x, y); else if (!water(x - 1, y + 1)) tile(wi, 0, 16, x, y); else if (!water(x + 1, y + 1)) tile(wi, 16, 16, x, y);
    else tile(w3, 16, 16, x, y);
  }
  else for (let y = -Mg; y < r + Mg; y++) for (let x = -Mg; x < c + Mg; x++) {
    if (water(x, y)) { tile(B.water, 0, 0, x, y); continue; }
    const N = water(x, y - 1), So = water(x, y + 1), W = water(x - 1, y), E = water(x + 1, y);
    if (N && W) tile(B.tiles, 0, 0, x, y); else if (N && E) tile(B.tiles, 32, 0, x, y); else if (So && W) tile(B.tiles, 0, 32, x, y); else if (So && E) tile(B.tiles, 32, 32, x, y);
    else if (N) tile(B.tiles, 16, 0, x, y); else if (So) tile(B.tiles, 16, 32, x, y); else if (W) tile(B.tiles, 0, 16, x, y); else if (E) tile(B.tiles, 32, 16, x, y);
    else if (water(x - 1, y - 1)) tile(B.inner, 0, 0, x, y); else if (water(x + 1, y - 1)) tile(B.inner, 16, 0, x, y); else if (water(x - 1, y + 1)) tile(B.inner, 0, 16, x, y); else if (water(x + 1, y + 1)) tile(B.inner, 16, 16, x, y);
    else tile(B.tiles, 16, 16, x, y);
  }
  const onPave = (x, y) => (O.paves || []).some(([px, py, pw, ph]) => x >= px && y >= py && x < px + pw && y < py + ph);
  const dry = (x, y) => at(x, y) === 0 && !onPave(x, y) && !water(x, y) && !water(x - 1, y) && !water(x + 1, y) && !water(x, y - 1) && !water(x, y + 1);
  // Caminos empedrados, flores y nenúfares
  // Empedrado (Pixel Crawler): ladrillo gris repetido, con bordillo y alguna mata de hierba asomando por el borde
  const tw = IMG.town;
  if (tw && O.paves) {
    const T0 = TOWN.stone_floor, sx0 = T0[0], sy0 = T0[1] + 16, PW = 48, PH = 48;
    for (const [px, py, pw, ph] of O.paves) {
      const X0 = px * CELL, Y0 = py * CELL, X1 = (px + pw) * CELL, Y1 = (py + ph) * CELL;
      for (let y = Y0; y < Y1; y += 16) for (let x = X0; x < X1; x += 16) g.drawImage(tw, sx0 + (x % PW), sy0 + (y % PH), 16, 16, x, y, 16, 16);
    }
    const paved = (x, y) => O.paves.some(([px, py, pw, ph]) => x >= px && y >= py && x < px + pw && y < py + ph);
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
      if (!paved(x, y)) continue;
      const X = x * CELL, Y = y * CELL;
      if (!paved(x, y - 1)) { g.fillStyle = '#4a4a3e'; g.fillRect(X, Y, CELL, 2); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(X, Y + 2, CELL, 2); }
      if (!paved(x, y + 1)) { g.fillStyle = '#4a4a3e'; g.fillRect(X, Y + CELL - 2, CELL, 2); g.fillStyle = '#8c8a78'; g.fillRect(X, Y + CELL - 3, CELL, 1); }
      if (!paved(x - 1, y)) { g.fillStyle = '#4a4a3e'; g.fillRect(X, Y, 2, CELL); }
      if (!paved(x + 1, y)) { g.fillStyle = '#4a4a3e'; g.fillRect(X + CELL - 2, Y, 2, CELL); }
      const edge = !paved(x, y - 1) || !paved(x, y + 1) || !paved(x - 1, y) || !paved(x + 1, y);
      if (edge && !B.land && hash(x, y, 31) < 0.22) { const d = BIO.deco[Math.floor(hash(x, y, 32) * 3)]; spr(d, X + hash(x, y, 33) * 6, Y + (paved(x, y - 1) ? 10 : -2)); }
    }
  }
  for (const path of (tw && O.paves ? [] : O.paths)) for (let k = 0; k + 1 < path.length; k++) {
    const [ax, ay] = path[k], [bx, by] = path[k + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 16 / 11);
    for (let i = 0; i <= n; i++) { const x = (ax + (bx - ax) * i / n) * 16, y = (ay + (by - ay) * i / n) * 16; spr(BIO.cobble, x - 17 + (hash(i, k, 3) - 0.5) * 6, y - 15 + (hash(i, k, 4) - 0.5) * 6); }
  }
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
    if (dry(x, y) && hash(x, y, 7) < (TH.sparse ? 0.05 : 0.09)) { const d = pick(TH.deco, Math.floor(hash(x, y, 8) * 97)), q = refS(d); ref(d, x * CELL + q[2] / 2 + hash(x, y, 9) * (16 - Math.min(16, q[2])), y * CELL + Math.min(16, q[3]) + hash(x, y, 10) * (16 - Math.min(16, q[3]))); }
    if (!B.land && at(x, y) === 2 && at(x - 1, y) === 2 && at(x + 1, y) === 2 && at(x, y - 1) === 2 && at(x, y + 1) === 2 && hash(x, y, 11) < 0.07) spr(BIO.lily[hash(x, y, 12) < 0.5 ? 0 : 1], x * CELL, y * CELL + 2);
  }
  // Matorrales y flores de Pixel Crawler sueltos por la hierba (no estorban: son de adorno)
  if (tw && TH.pc) for (let y = 3; y < r - 3; y++) for (let x = 3; x < c - 3; x++) {
    if (!dry(x, y) || !dry(x + 1, y) || !dry(x, y + 1) || hash(x, y, 81) > 0.012) continue;
    const k = ['bush1', 'bush4', 'flower1', 'flower2', 'flower1', 'bush1'][Math.floor(hash(x, y, 82) * 6)], t = TOWN[k];
    if (t) g.drawImage(tw, t[0], t[1], t[2], t[3], Math.round(x * CELL + 8 - t[2] / 2), Math.round(y * CELL + 14 - t[3]), t[2], t[3]);
  }
  for (const b of O.bridges) spr(BIO.vbridge, b.x * CELL + 8 - 12, b.y * CELL + (b.h * CELL - 44) / 2);
  // Obstáculos: lo que el generador dejó apuntado, y bosque en todo lo demás que no se puede pisar
  const items = [], cover = new Uint8Array(c * r);
  for (const o of O.obs) {
    for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) if (i >= 0 && j >= 0 && i < c && j < r) cover[j * c + i] = 1;
    const X = o.x * CELL, Y = o.y * CELL, W = o.w * CELL, H = o.h * CELL, cx = X + W / 2, by = Y + H;
    if (o.kind === 'rock') items.push({ by, fn: () => { shadow(cx, by, 15); ref(pick(TH.rocks, o.v), cx, by + 1); } });
    else if (o.kind === 'tree') items.push({ by, fn: () => { shadow(cx, by, 11); ref(pick(TH.trees, o.v), cx, by); } });
    else if (o.kind === 'ref') items.push({ by, fn: () => { shadow(cx, by, Math.min(20, refS(o.r)[2] / 2.3)); ref(o.r, cx, by + 1); } });
    else if (o.kind === 'ruin') items.push({ by, fn: () => { const sp = BIO.ruin[o.v % BIO.ruin.length]; shadow(cx, by, Math.min(15, sp[2] / 2)); if (IMG.ruins) g.drawImage(IMG.ruins, sp[0], sp[1], sp[2], sp[3], Math.round(cx - sp[2] / 2), by + 2 - sp[3], sp[2], sp[3]); } });
    else if (o.kind === 'prop') items.push({ by, fn: () => { const t = TOWN[o.k]; if (!tw || !t) return; shadow(cx, by, Math.min(16, t[2] / 2.4)); g.drawImage(tw, t[0], t[1], t[2], t[3], Math.round(cx - t[2] / 2), by + 2 - t[3], t[2], t[3]); } });
    else if (o.kind === 'fence') items.push({ by, fn: () => {   // valla de madera, en tramos horizontales o verticales
      g.fillStyle = '#3a241c'; if (o.horiz) { g.fillRect(X, by - 11, CELL, 2); g.fillRect(X, by - 6, CELL, 2); for (const dx of [1, 9]) { g.fillRect(X + dx, by - 14, 4, 13); } g.fillStyle = '#8a6240'; g.fillRect(X, by - 11, CELL, 1); g.fillRect(X, by - 6, CELL, 1); for (const dx of [2, 10]) g.fillRect(X + dx, by - 13, 2, 11); }
      else { g.fillRect(X + 5, Y - 8, 6, CELL + 8); g.fillStyle = '#8a6240'; g.fillRect(X + 6, Y - 7, 4, CELL + 6); g.fillStyle = '#a67c52'; g.fillRect(X + 6, Y - 7, 4, 2); g.fillStyle = '#5b3a2a'; g.fillRect(X + 6, Y + 4, 4, 1); }
    } });
    else if (o.kind === 'stall') items.push({ by, fn: () => {   // puesto del mercado: mostrador, toldo a rayas y género del Pixel Crawler
      const cols = [['#c0392b', '#efe6c8'], ['#3d6ea8', '#efe6c8'], ['#5a8a3c', '#efe6c8']][o.v % 3];
      shadow(cx, by, W / 2);
      g.fillStyle = '#3a241c'; g.fillRect(X + 2, by - 34, 3, 34); g.fillRect(X + W - 5, by - 34, 3, 34);
      g.fillStyle = '#3a241c'; g.fillRect(X, by - 14, W, 12); g.fillStyle = '#a67c52'; g.fillRect(X + 1, by - 13, W - 2, 10); g.fillStyle = '#8a6240'; for (let x = X + 6; x < X + W - 2; x += 7) g.fillRect(x, by - 13, 1, 10); g.fillStyle = '#c69a6a'; g.fillRect(X + 1, by - 13, W - 2, 2);
      for (let i = 0; i < 4; i++) { const v = TOWN['veg' + (1 + (i + o.v) % 4)]; if (tw && v) g.drawImage(tw, v[0], v[1], v[2], v[3], X + 3 + i * 11, by - 24, v[2], v[3]); }
      for (let i = 0; i * 6 < W + 4; i++) { g.fillStyle = cols[i % 2]; g.fillRect(X - 2 + i * 6, by - 44, 6, 10); g.beginPath(); g.moveTo(X - 2 + i * 6, by - 34); g.lineTo(X + 4 + i * 6, by - 34); g.lineTo(X + 1 + i * 6, by - 31); g.fill(); }
      g.fillStyle = '#2a1a18'; g.fillRect(X - 2, by - 45, W + 4, 1); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X, by - 33, W, 3);
    } });
    else if (o.kind === 'barrel') items.push({ by, fn: () => { shadow(cx, by, 7); stand(BIO.barrel[o.v % 3], cx, by); } });
    else if (o.kind === 'well') items.push({ by, fn: () => { shadow(cx, by + 2, 13); stand(BIO.well, cx, by + 3); } });
    else if (o.kind === 'chouse') items.push({ by, fn: () => {   // casas de las ciudades (tools/pack_city_houses.py)
      const hs = IMG.cityhouses, h = CITY_HOUSES[o.i] && CITY_HOUSES[o.i].r; if (!hs || !h) return;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + 4, by - 2, W - 4, 5); g.drawImage(hs, h[0], h[1], h[2], h[3], Math.round(cx - h[2] / 2), by + 2 - h[3], h[2], h[3]);
    } });
    else if (o.kind === 'house') items.push({ by, fn: () => {   // casas montadas con el Pixel Crawler Free Pack; si no han cargado, la dibujada a mano
      const hs = IMG.houses, list = o.big ? [0, 1, 4] : [2, 3, 5], h = HOUSES[list[o.v % list.length] + (o.ruin ? 6 : 0)];
      if (hs) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + 4, by - 2, W - 4, 5); g.drawImage(hs, h[0], h[1], h[2], h[3], Math.round(cx - h[2] / 2), by + 2 - h[3], h[2], h[3]); }
      else { const rp = (o.roof || 0) * CELL; drawHouse(g, X, Y + rp - (o.big ? 18 : 12), W, H - rp + (o.big ? 18 : 12), o.v); }
    } });
    else if (o.kind === 'board') items.push({ by, fn: () => {   // el tablón de encargos: dos postes, un tablero y pergaminos clavados
      shadow(cx, by, 15); g.fillStyle = '#4a2e22'; g.fillRect(X + 2, Y - 10, 3, 26); g.fillRect(X + W - 5, Y - 10, 3, 26);
      g.fillStyle = '#2a1a18'; g.fillRect(X, Y - 13, W, 19); g.fillStyle = '#8a6240'; g.fillRect(X + 1, Y - 12, W - 2, 17); g.fillStyle = '#a67c52'; g.fillRect(X + 1, Y - 12, W - 2, 2);
      for (const [px, py, col] of [[4, -9, '#efe6c8'], [13, -10, '#e3d5a4'], [21, -8, '#efe6c8'], [8, -2, '#e3d5a4'], [18, -1, '#efe6c8']]) { g.fillStyle = col; g.fillRect(X + px, Y + py, 6, 6); g.fillStyle = '#c0392b'; g.fillRect(X + px + 2, Y + py, 2, 1); g.fillStyle = '#8a7a5a'; g.fillRect(X + px + 1, Y + py + 3, 4, 1); }
    } });
    else if (o.kind === 'castle') items.push({ by, fn: () => {   // la fachada del castillo: sillares del paquete, almenas, torres y el portón
      const top = -30, mid = cx;
      for (let y = top; y < by; y += 16) for (let x = X; x < X + W; x += 32) spr(BIO.wall, x, y);
      g.fillStyle = 'rgba(20,24,40,0.28)'; g.fillRect(X, top, W, by - top - 32);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, by, W, 3);
      const cren = (x0, x1, y) => { for (let x = x0; x < x1; x += 12) { g.fillStyle = '#242a33'; g.fillRect(x, y - 8, 9, 9); g.fillStyle = '#96a9c1'; g.fillRect(x + 1, y - 7, 7, 8); g.fillStyle = '#66778f'; g.fillRect(x + 1, y - 2, 7, 3); } };
      cren(X + 2, X + W - 4, top);
      for (const tx of [X - 6, X + W - 42]) {   // torres
        for (let y = top - 26; y < by; y += 16) for (let x = tx; x < tx + 48; x += 32) g.drawImage(im, 368, 96, Math.min(32, tx + 48 - x), 16, x, y, Math.min(32, tx + 48 - x), 16);
        g.fillStyle = '#242a33'; g.fillRect(tx - 1, top - 26, 1, by - top + 26); g.fillRect(tx + 48, top - 26, 1, by - top + 26);
        cren(tx, tx + 46, top - 26);
        g.fillStyle = '#15121c'; g.fillRect(tx + 21, top + 4, 6, 14); g.fillStyle = '#f2c14e'; g.fillRect(tx + 22, top + 6, 4, 11);
        g.fillStyle = '#4a2e22'; g.fillRect(tx + 23, top - 52, 2, 20); g.fillStyle = '#c0392b'; g.fillRect(tx + 25, top - 52, 14, 9); g.fillStyle = '#f2c14e'; g.fillRect(tx + 30, top - 49, 4, 3);
      }
      for (let x = X + 70; x < X + W - 70; x += 44) if (Math.abs(x + 3 - mid) > 34) { g.fillStyle = '#15121c'; g.fillRect(x, top + 22, 6, 14); g.fillStyle = '#f2c14e'; g.fillRect(x + 1, top + 24, 4, 11); }
      g.fillStyle = '#242a33'; g.fillRect(mid - 20, by - 42, 40, 42); g.beginPath(); g.arc(mid, by - 42, 20, Math.PI, 0); g.fill();   // portón
      g.fillStyle = '#15121c'; g.fillRect(mid - 16, by - 40, 32, 40); g.beginPath(); g.arc(mid, by - 40, 16, Math.PI, 0); g.fill();
      g.fillStyle = '#4a5768'; for (let x = mid - 12; x <= mid + 12; x += 6) g.fillRect(x, by - 52, 1, 30); for (let y = by - 46; y < by - 22; y += 7) g.fillRect(mid - 15, y, 30, 1);
      g.fillStyle = '#c0392b'; g.fillRect(mid - 34, by - 50, 9, 30); g.fillRect(mid + 25, by - 50, 9, 30); g.fillStyle = '#f2c14e'; g.fillRect(mid - 32, by - 44, 5, 5); g.fillRect(mid + 27, by - 44, 5, 5);
      spr(BIO.stairs, mid - 16, by);
    } });
  }
  for (let y = -Mg; y < r + Mg; y++) for (let x = -Mg; x < c + Mg; x++) {
    const inb = x >= 0 && y >= 0 && x < c && y < r;
    if (at(x, y) !== 1 || (inb && cover[y * c + x])) continue;
    const X = x * CELL, by = (y + 1) * CELL, h = hash(x, y, 20);
    if (TH.sparse ? h < 0.34 : (((x + y) & 1) === 0 || h < 0.3)) items.push({ by: by + h, fn: () => { shadow(X + 8, by, 9); ref(pick(TH.forest, Math.floor(hash(x, y, 21) * 97)), X + 8 + (hash(x, y, 22) - 0.5) * 6, by); } });
    else if (h > 0.6) items.push({ by: by + h, fn: () => ref(pick(TH.fbush, Math.floor(hash(x, y, 23) * 97)), X + 8, by) });
  }
  for (const d of O.decor || []) items.push({ by: d.y * CELL, fn: () => { if (d.shadow !== false) shadow(d.x * CELL, d.y * CELL, Math.min(14, refS(d.r)[2] / 2.6)); ref(d.r, d.x * CELL, d.y * CELL + 1); } });   // adorno que se pisa: sacos, tumbas caídas...
  items.sort((a, b) => a.by - b.by);
  for (const it of items) it.fn();
  if (TH.dim) { g.fillStyle = TH.dim; g.fillRect(-Mg * CELL, -Mg * CELL, cvs.width, cvs.height); }   // tono de la zona
  for (const f of O.fires || []) res.torches.push({ x: f.x * CELL, y: f.y * CELL - 6 });               // hogueras: llama animada y luz
  return (ROOM_BG = res);
}
