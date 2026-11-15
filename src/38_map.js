// ───────────────────────── El mapa del reino (tablón de encargos) ─────────────────────────
// En el tablón no hay una lista: hay un mapa dibujado del reino. Cada territorio se tiñe del color del guardián que lo tiene
// tomado y, cuando cae, pasa al color del reino. Los encargos son marcadores (.fi) puestos sobre el mapa: la navegación
// con mando de listInput/navPick ya es espacial, así que se mueven solos. Al lado, un panel cuenta el encargo señalado.
// Todo lo que cambia de un reino a otro (forma, biomas, caminos y dónde va cada cosa) sale de KMAPS; las medidas van en casillas de 16 px.
const KMAPS = {
  valdehierro: {
    cols: 28, rows: 16, free: '#f2c14e', capital: 'meadow', biomes: ['crypt', 'forest', 'peaks', 'ash'],
    // ~ mar · c capital · 0-3 territorio de esa zona
    land: [
      '~~~~~~0000000022222222222222',
      '~~~0000000000022222222222222',
      '~~00000000000022222222222222',
      '~000000000000022222222222222',
      '~00000000000cccc222222222222',
      '~0000000000ccccccc2222222222',
      '~~00000000ccccccccc222222222',
      '~~~000000cccccccccc222222222',
      '~~~111111cccccccccc333333333',
      '~~11111111ccccccccc333333333',
      '~1111111111ccccccc3333333333',
      '~11111111111ccccc33333333333',
      '~11111111111c~~c333333333333',
      '~~1111111111~~~~33333333333~',
      '~~~~11111111~~~~~333333333~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    castle: [13.4, 8.9], label: [13.4, 4.7], god: [17.4, 8.7],
    // Por zona: dónde va el rótulo, los tres encargos (incursión, defensa, asalto) y la guarida del guardián.
    // Los cuatro de cada zona van en dos filas y dos columnas (más o menos): así la cruceta se mueve entre ellos sin sorpresas.
    zones: [
      { label: [6.3, 0.8],   m: [[4.6, 7.6], [10.2, 4.4], [9.2, 6.8]],     boss: [3.8, 5.6] },
      { label: [7.6, 14.5],  m: [[8.2, 10.5], [3.8, 10.1], [8.8, 12.9]],   boss: [3.6, 13.5] },
      { label: [21.6, 0.8],  m: [[23.2, 7.5], [18.0, 4.4], [19.1, 6.8]],   boss: [23.8, 5.3] },
      { label: [21.6, 14.5], m: [[19.8, 10.5], [24.4, 10.1], [19.4, 12.9]], boss: [24.6, 13.3] },
    ],
    river: [[15.0, -0.5], [15.2, 1.6], [15.9, 3.4], [16.4, 5.0], [16.3, 6.6], [16.0, 8.2], [15.6, 9.8], [14.6, 11.2], [14.0, 12.6]],
    roads: [
      [[13.4, 9.1], [13.3, 10.6], [13.1, 11.8]],
      [[13.0, 9.2], [11.0, 9.6], [9.4, 10.4], [8.2, 10.6]], [[8.2, 10.6], [6.0, 10.6], [3.8, 10.2]], [[8.2, 10.6], [8.6, 11.8], [8.8, 13.0]], [[8.8, 13.0], [6.4, 13.7], [3.6, 13.6]],
      [[12.4, 8.5], [10.8, 7.4], [9.2, 6.9]], [[9.2, 6.9], [9.9, 5.6], [10.2, 4.5]], [[9.2, 6.9], [6.8, 7.4], [4.6, 7.7]], [[9.2, 6.9], [6.6, 6.0], [3.8, 5.7]],
      [[14.4, 8.6], [16.2, 7.6], [17.8, 7.0], [19.1, 6.9]], [[19.1, 6.9], [18.3, 5.6], [18.0, 4.5]], [[19.1, 6.9], [21.2, 7.3], [23.2, 7.6]], [[19.1, 6.9], [21.4, 5.8], [23.8, 5.4]],
      [[13.8, 9.2], [15.8, 9.3], [17.4, 8.8]], [[17.4, 8.8], [18.6, 9.8], [19.8, 10.6]], [[19.8, 10.6], [22.2, 10.6], [24.4, 10.2]], [[19.8, 10.6], [19.4, 11.8], [19.4, 13.0]], [[19.4, 13.0], [22.0, 13.4], [24.6, 13.4]],
    ],
    // Decorado suelto de la capital
    props: [['houses', 10.5, 8.6, 2], ['houses', 11.6, 6.9, 2], ['houses', 12.0, 10.6, 2], ['houses', 15.0, 10.8, 1], ['houses', 14.6, 6.4, 1],
      ['field', 11.2, 5.4, 2, 1], ['field', 16.6, 10.4, 1, 1], ['field', 10.0, 7.5, 1, 1], ['pier', 13.1, 12.0], ['boat', 13.9, 13.3], ['boat', 12.9, 14.4, 1]],
  },
};

// ── Lo que sabe pintar el mapa: suelos (una baldosa de biomes.png, a veces teñida), recortes de las hojas y dibujos propios ──
const KM_GROUND = {
  water:  { tile: [64, 32], mul: '#8ab0e2' },
  meadow: { tile: [16, 16] },
  forest: { tile: [16, 16], mul: '#86a878' },
  crypt:  { tile: [16, 592], mul: '#b9b2cc', hue: ['#6f6884', 0.62] },
  peaks:  { tile: [16, 384] },
  ash:    { tile: [16, 192], mul: '#7c5c60', hue: ['#5c4650', 0.5] },
};
// [hoja (b: biomes.png, r: ruins.png), x, y, ancho, alto]
const KM_SPR = {
  sap: ['b', 305, 112, 14, 16], tree: ['b', 272, 37, 16, 22], bush: ['b', 288, 34, 16, 12], oak: ['b', 243, 100, 24, 26], oak2: ['b', 276, 102, 22, 24], pine: ['b', 246, 65, 20, 31], fir: ['b', 292, 67, 24, 29],
  pineS: ['r', 209, 13, 14, 19], pineM: ['r', 177, 5, 14, 27], pineT: ['r', 193, 6, 14, 26], pineD: ['r', 160, 1, 16, 31], round: ['r', 227, 2, 26, 30], shroom: ['r', 224, 129, 16, 13], shroom2: ['r', 224, 114, 16, 12],
  stump: ['b', 164, 327, 23, 21], deadbush: ['b', 161, 242, 15, 13], deadbush2: ['b', 177, 242, 14, 13], skull: ['b', 161, 225, 15, 13], twigs: ['b', 145, 496, 16, 15], deadtree: ['b', 116, 304, 44, 48], pillar: ['b', 384, 595, 16, 29], statue: ['b', 294, 636, 20, 35],
  mount: ['b', 113, 370, 30, 28], mount2: ['b', 112, 408, 27, 23], mount3: ['b', 145, 409, 29, 21], snowrock: ['b', 148, 381, 26, 18], snowpine: ['b', 230, 417, 20, 31], snowpine2: ['b', 256, 417, 16, 31], snowfir: ['b', 112, 443, 16, 21], snowbush: ['b', 176, 385, 16, 13],
  darkrock: ['b', 160, 530, 31, 28], slab: ['b', 116, 522, 44, 21], spike: ['b', 193, 530, 13, 27], pebble: ['b', 113, 545, 29, 13], pebble2: ['b', 145, 545, 15, 14],
  cry1: ['r', 209, 145, 15, 15], cry2: ['r', 227, 145, 12, 15], cry3: ['r', 241, 145, 15, 15], cry4: ['r', 194, 144, 12, 16], spire: ['r', 306, 196, 29, 43],
  temple: ['r', 336, 192, 48, 48], portal: ['r', 273, 241, 30, 30], arch: ['r', 160, 239, 32, 33], tower: ['r', 161, 146, 29, 29], well: ['b', 339, 69, 26, 19], bigtree: ['b', 274, 513, 45, 46], boat: ['b', 372, 70, 24, 21], boat2: ['b', 404, 71, 23, 20],
};
// Qué crece en cada suelo: n es cuánto hay por casilla; los nombres repetidos salen más
const KM_SCATTER = {
  meadow: { n: 0.13, s: ['sap', 'tree', 'bush', 'bush', 'sap', 'oak2'] },
  forest: { n: 2.1, s: ['pineS', 'pineM', 'pineT', 'tree', 'sap', 'pineS', 'pineM', 'oak2', 'pine', 'round', 'pineD', 'shroom', 'bush'] },
  crypt:  { n: 0.95, s: ['tomb', 'tomb', 'cross', 'cross', 'tomb', 'deadbush', 'deadbush2', 'stump', 'pillar', 'skull', 'pineD', 'statue'] },
  peaks:  { n: 0.6,  s: ['mount', 'mount2', 'mount3', 'mount', 'snowrock', 'snowpine', 'snowpine2', 'snowfir', 'snowfir', 'snowbush', 'cry2'] },
  ash:    { n: 1.0,  s: ['darkrock', 'spike', 'pebble', 'pebble2', 'twigs', 'stump', 'deadbush', 'lava', 'lava', 'crack', 'crack', 'lava', 'spike', 'deadtree', 'slab', 'crack'] },
};
// Lo que hay en cada sitio con encargo: la entrada de la incursión y la guarida del guardián dependen del bioma.
// up: a qué altura sobre la base se clava el marcador, en píxeles del mapa
const KM_SITE = {
  village: { up: 13 }, camp: { up: 13 }, siege: { up: 19 },
  gate: { crypt: ['tower', 24], forest: ['cave', 19], peaks: ['well', 15], ash: ['arch', 26] },
  lair: { crypt: ['temple', 33], forest: ['bigtree', 34], peaks: ['mine', 27], ash: ['portal', 25] },
};
const KM_KIND = ['gate', 'village', 'camp'];   // en el mismo orden que MKINDS
const kmSiteOf = (kind, biome) => (KM_SITE[kind].up ? { draw: kind, up: KM_SITE[kind].up } : { draw: KM_SITE[kind][biome][0], up: KM_SITE[kind][biome][1] });
const kmBoss = (K, z) => TYPES[K.zones[z].boss || WORLDS[z].boss];
const kmFree = (K, z) => isDone(`${K.id}:${z}:b`);
const kmHash = (x, y, k = 0) => { let h = (Math.round(x) * 374761393 + Math.round(y) * 668265263 + k * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const kmNoise = (t, k) => { const i = Math.floor(t), f = t - i, a = kmHash(i, k, 91), b = kmHash(i + 1, k, 91); return a + (b - a) * f * f * (3 - 2 * f); };
// Una línea de puntos (en casillas) hecha curva: una muestra por píxel más o menos
function kmCurve(pts) {
  const out = [], P = i => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), n = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 16);
    for (let k = 0; k <= n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(a => 8 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3))); }
  }
  return out;
}

// ── Dibujos propios, a píxel, con la paleta de los paquetes ──
const kmPx = (g, X, Y) => (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(X) + x, Math.round(Y) + y, w, h); };
const KM_DRAW = {
  house(g, X, Y, v = 0) {
    const px = kmPx(g, X, Y), R = [['#b5503c', '#8a3a2e'], ['#3f9e86', '#2c7564'], ['#9a6a3e', '#75502e']][v % 3];
    px(-5, 0, 11, 1, 'rgba(0,0,0,.28)'); px(-5, -6, 10, 6, '#2a1a18'); px(-4, -5, 8, 5, '#e6d9bc'); px(-4, -1, 8, 1, '#b9a98a'); px(-1, -3, 2, 3, '#5b3a2a'); px(2, -4, 1, 2, '#6fb0c8');
    for (let i = 0; i < 5; i++) { px(-6 + i, -7 - i, 12 - 2 * i, 1, '#2a1a18'); px(-5 + i, -7 - i, 10 - 2 * i, 1, i % 2 ? R[0] : R[1]); }
  },
  village(g, X, Y, v = 0) { KM_DRAW.house(g, X - 8, Y - 3, v + 1); KM_DRAW.house(g, X + 8, Y - 2, v + 2); KM_DRAW.house(g, X, Y + 3, v); },
  houses(g, X, Y, n = 2) { for (let i = 0; i < n; i++) KM_DRAW.house(g, X + (i - (n - 1) / 2) * 12, Y + (i % 2 ? -4 : 0), i + 1); },
  tent(g, X, Y, c1 = '#c9b189', c2 = '#8f7a55') {
    const px = kmPx(g, X, Y);
    px(-6, 0, 13, 1, 'rgba(0,0,0,.28)');
    for (let i = 0; i < 7; i++) { px(-6 + i, -1 - i, 13 - 2 * i, 1, '#2a1a18'); if (i < 6) { px(-5 + i, -1 - i, 11 - 2 * i, 1, c1); px(1, -1 - i, 5 - i, 1, c2); } }
    px(-1, -4, 2, 4, '#2a1a18');
  },
  banner(g, X, Y, col, tall = 12) { const px = kmPx(g, X, Y); px(0, -tall, 1, tall, '#2a1a18'); px(1, -tall, 6, 5, '#2a1a18'); px(1, -tall + 1, 5, 3, col); px(1, -tall + 4, 2, 1, col); px(5, -tall + 4, 1, 1, col); },
  camp(g, X, Y) { KM_DRAW.tent(g, X - 7, Y - 2); KM_DRAW.tent(g, X + 7, Y); kmPx(g, X, Y)(-1, 3, 3, 2, '#ff8a3c'); kmPx(g, X, Y)(0, 2, 1, 1, '#ffe08a'); KM_DRAW.banner(g, X, Y - 3, '#c0392b', 13); },
  siege(g, X, Y) { KM_DRAW.tent(g, X - 10, Y, '#7a3a34', '#532622'); KM_DRAW.tent(g, X + 10, Y, '#7a3a34', '#532622'); const px = kmPx(g, X, Y);
    for (let i = 0; i < 10; i++) { px(-9 + i, -2 - i, 19 - 2 * i, 1, '#1c1216'); if (i < 9) { px(-8 + i, -2 - i, 17 - 2 * i, 1, '#9c4a3a'); px(1, -2 - i, 8 - i, 1, '#6a2f2a'); } }
    px(-2, -6, 4, 5, '#1c1216'); px(-9, -1, 19, 1, '#1c1216'); KM_DRAW.banner(g, X, Y - 9, TYPES.firstfist.color, 12); },
  field(g, X, Y, w = 2, h = 1) { const px = kmPx(g, X, Y), W = w * 16, H = h * 16 - 4; px(-1, -1, W + 2, H + 2, '#5b4a2a'); for (let y = 0; y < H; y++) px(0, y, W, 1, y % 3 === 2 ? '#8a7a34' : y % 3 ? '#d9c14e' : '#c2a93e'); },
  pier(g, X, Y) { const px = kmPx(g, X, Y); px(-3, 0, 7, 22, '#3a241c'); for (let y = 0; y < 22; y++) px(-2, y, 5, 1, y % 3 ? '#a67c52' : '#7a5638'); px(-4, 6, 1, 3, '#3a241c'); px(4, 14, 1, 3, '#3a241c'); },
  tomb(g, X, Y, v = 0) { const px = kmPx(g, X, Y); px(-2, 0, 6, 1, 'rgba(0,0,0,.3)'); px(-2, -6, 5, 6, '#2c2a36'); px(-1, -5, 3, 5, '#8f8ea0'); px(-1, -5, 1, 4, '#b4b3c4'); px(-1, -6, 3, 1, v % 2 ? '#2c2a36' : '#8f8ea0'); },
  cross(g, X, Y) { const px = kmPx(g, X, Y); px(-1, 0, 4, 1, 'rgba(0,0,0,.3)'); px(-1, -8, 3, 8, '#2c2a36'); px(-3, -6, 7, 3, '#2c2a36'); px(0, -7, 1, 7, '#a9a8ba'); px(-2, -5, 5, 1, '#a9a8ba'); },
  lava(g, X, Y, v = 0) { const px = kmPx(g, X, Y), w = 7 + (v % 3) * 2; px(-w / 2 | 0, -3, w, 5, '#2a1418'); px((-w / 2 | 0) + 1, -4, w - 2, 7, '#2a1418'); px((-w / 2 | 0) + 1, -3, w - 2, 5, '#d8434f'); px((-w / 2 | 0) + 2, -2, w - 4, 3, '#ff8a3c'); px(0, -1, 2, 1, '#ffe08a'); },
  crack(g, X, Y, v = 0) { const px = kmPx(g, X, Y); let y = 0; for (let i = -6; i < 7; i++) { y += ((v + i * 7) % 3) - 1; y = clamp(y, -2, 2); px(i, y - 1, 1, 3, '#2a1418'); px(i, y, 1, 1, i % 4 === 0 ? '#ffe08a' : '#ff8a3c'); } },
  cave(g, X, Y, v, D) { D.spr('darkrock', X, Y + 2); const px = kmPx(g, X, Y); px(-5, -8, 10, 9, '#0d0a10'); px(-4, -10, 8, 2, '#0d0a10'); px(-2, -11, 4, 1, '#0d0a10'); for (let i = 0; i < 4; i++) { px(-5 + i, -8 + i, 1, 1, '#f4f0ff'); px(4 - i, -9 + i, 1, 1, '#f4f0ff'); } px(0, -11, 1, 6, '#cfc8e0'); px(-1, -5, 3, 2, '#f4f0ff'); },
  mine(g, X, Y, v, D) { D.spr('mount', X - 13, Y - 3); D.spr('mount', X + 13, Y - 4); D.spr('mount2', X, Y); const px = kmPx(g, X, Y);
    px(-6, -13, 12, 13, '#3a241c'); px(-5, -12, 10, 12, '#a67c52'); px(-4, -10, 8, 10, '#0d0a10'); px(-5, -12, 10, 1, '#c99a66'); px(-8, 0, 16, 1, '#3a241c'); px(-7, 1, 14, 1, '#7a5638');
    D.spr('cry1', X - 16, Y + 4); D.spr('cry3', X + 17, Y + 4); D.spr('cry4', X + 8, Y + 5); },
  bigtree(g, X, Y, v, D) { D.spr('bigtree', X, Y + 3); const px = kmPx(g, X, Y); for (const [x, y] of [[-12, -1], [-7, 2], [11, 0], [15, 3], [6, 3]]) { px(x - 1, y - 3, 4, 4, '#2a2a22'); px(x, y - 3, 2, 3, '#e8e4d4'); px(x, y - 3, 1, 1, '#ffffff'); } },
  temple(g, X, Y, v, D) { D.spr('temple', X, Y + 2); },
  portal(g, X, Y, v, D) { D.spr('spike', X - 18, Y + 1); D.spr('spike', X + 19, Y); const px = kmPx(g, X, Y); px(-7, -22, 14, 16, '#5a2a6a'); px(-5, -20, 10, 12, '#b68cff'); px(-2, -17, 4, 6, '#f0e4ff'); D.spr('portal', X, Y + 2); },
  castle(g, X, Y, col) {
    const px = kmPx(g, X, Y), O = '#2a2226', S1 = '#c4bead', S2 = '#9c9686', S3 = '#746f63', R1 = '#5a7fa8', R2 = '#3f5f86';
    const roof = (x, y, w) => { for (let i = 0; i * 2 < w; i++) { px(x - 1 + i, y - i, w + 2 - 2 * i, 1, O); if (w - 2 * i > 0) px(x + i, y - i, w - 2 * i, 1, i % 2 ? R1 : R2); } };
    const flag = (x, y) => { px(x, y - 9, 1, 9, O); px(x + 1, y - 9, 6, 5, O); px(x + 1, y - 8, 5, 3, col); };
    px(-25, 0, 50, 2, 'rgba(0,0,0,.28)');
    px(-21, -17, 42, 17, O); px(-20, -16, 40, 16, S2); px(-20, -16, 40, 2, S1); px(-20, -4, 40, 4, S3);                  // muralla
    for (let x = -19; x < 19; x += 6) { px(x - 1, -20, 5, 4, O); px(x, -19, 3, 3, S1); }
    for (let x = -16; x < 18; x += 8) px(x, -11, 1, 3, O);
    px(-10, -34, 20, 20, O); px(-9, -33, 18, 19, S2); px(-9, -33, 18, 2, S1); px(5, -31, 4, 17, S3);                       // torre del homenaje
    px(-5, -28, 2, 4, O); px(3, -28, 2, 4, O); px(-1, -28, 2, 4, '#f2c14e'); roof(-11, -35, 22); flag(0, -45);
    for (const x of [-27, 17]) { px(x, -28, 10, 28, O); px(x + 1, -27, 8, 27, S2); px(x + 1, -27, 2, 27, S1); px(x + 7, -27, 2, 27, S3); px(x + 4, -20, 2, 4, O); px(x + 4, -10, 2, 4, O); roof(x - 1, -29, 12); flag(x + 5, -34); }   // torres
    px(-5, -11, 10, 11, O); px(-4, -12, 8, 1, O); px(-4, -10, 8, 10, '#6e4530'); px(-4, -10, 8, 2, '#3a241c'); px(0, -10, 1, 10, '#3a241c'); px(-4, -5, 8, 1, '#3a241c');   // portón
  },
};

// ── El mapa base de un reino: se pinta una vez (cuando ya han cargado las hojas) y se guarda. Devuelve también la silueta y el borde de cada territorio. ──
const KM_CACHE = {}, KM_RING = [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]];
function kmBase(K) {
  if (KM_CACHE[K.id]) return KM_CACHE[K.id];
  const D = KMAPS[K.id], bi = IMG.biome, ru = IMG.ruins;
  if (!D || !bi || !ru) return null;
  const C = D.cols, R = D.rows, W = C * 16, H = R * 16;
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const [base, g] = mk(), [land, L] = mk();
  const reg = (x, y) => D.land[clamp(y, 0, R - 1)][clamp(x, 0, C - 1)];
  const ground = r => (r === '~' ? 'water' : r === 'c' ? D.capital : D.biomes[+r]);
  // Suelos: una baldosa por tipo, repetida como patrón, para poder rellenar cualquier rectángulo sin que se note la rejilla al morder los bordes
  const pat = {};
  for (const k in KM_GROUND) { const G0 = KM_GROUND[k], [tc, tg] = mk(16, 16); tg.drawImage(bi, G0.tile[0], G0.tile[1], 16, 16, 0, 0, 16, 16); if (G0.mul) { tg.globalCompositeOperation = 'multiply'; tg.fillStyle = G0.mul; tg.fillRect(0, 0, 16, 16); } if (G0.hue) { tg.globalCompositeOperation = 'color'; tg.globalAlpha = G0.hue[1]; tg.fillStyle = G0.hue[0]; tg.fillRect(0, 0, 16, 16); } pat[k] = g.createPattern(tc, 'repeat'); }
  const masks = {}; for (const r of ['c', ...D.zones.map((_, z) => '' + z)]) masks[r] = mk();
  const paint = (r, x, y, w, h) => { if (w <= 0 || h <= 0) return; L.fillStyle = pat[ground(r)]; L.fillRect(x, y, w, h); for (const k in masks) { const m = masks[k][1]; if (k === r) { m.fillStyle = '#000'; m.fillRect(x, y, w, h); } else m.clearRect(x, y, w, h); } };
  const erase = (x, y, w, h) => { if (w <= 0 || h <= 0) return; L.clearRect(x, y, w, h); for (const k in masks) masks[k][1].clearRect(x, y, w, h); };
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (reg(x, y) !== '~') paint(reg(x, y), x * 16, y * 16, 16, 16);
  // Bordes irregulares: el mar muerde la costa y cada suelo se mete un poco en el del vecino
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const a = reg(x, y);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (x + dx >= C || y + dy >= R) continue;
      const b = reg(x + dx, y + dy); if (a === b) continue;
      for (let i = 0; i < 16; i += 2) {
        const X = dx ? (x + 1) * 16 : x * 16 + i, Y = dx ? y * 16 + i : (y + 1) * 16, n = kmNoise((dx ? Y : X) / 5, dx ? X : Y + 7);
        if (a === '~' || b === '~') { const d = 1 + Math.floor(n * 3.4); if (a === '~') erase(X, Y, dx ? d : 2, dx ? 2 : d); else erase(dx ? X - d : X, dx ? Y : Y - d, dx ? d : 2, dx ? 2 : d); }
        else { const d = Math.round((n - 0.5) * 9); if (d > 0) paint(b, dx ? X - d : X, dx ? Y : Y - d, dx ? d : 2, dx ? 2 : d); else if (d < 0) paint(a, X, Y, dx ? -d : 2, dx ? 2 : -d); }
      }
    }
    if (a !== '~') for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (reg(x + sx, y) === '~' && reg(x, y + sy) === '~' && x + sx >= 0 && x + sx < C && y + sy >= 0 && y + sy < R)
      for (let i = 0; i < 4; i++) erase(sx < 0 ? x * 16 : x * 16 + 16 - (6 - i * 2 + (i === 3 ? 1 : 0)), sy < 0 ? y * 16 + i * 2 - 1 : y * 16 + 15 - i * 2, 6 - i * 2 + (i === 3 ? 1 : 0), 2);
  }
  // Mar, espuma alrededor de la tierra, un escalón oscuro al sur y, encima, la tierra
  g.fillStyle = pat.water; g.fillRect(0, 0, W, H);
  const [sil, sg] = mk(), shade = col => { sg.globalCompositeOperation = 'copy'; sg.drawImage(land, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, W, H); };
  shade('#e9f8f6'); g.globalAlpha = 0.5; for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 5], [-2, 3], [2, 3]]) g.drawImage(sil, ox, oy);
  g.globalAlpha = 1; for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 4], [-1, 3], [1, 3]]) g.drawImage(sil, ox, oy);
  shade('#3a2c2a'); g.drawImage(sil, 0, 3); shade('#6b4f3f'); g.drawImage(sil, 0, 1);
  g.drawImage(land, 0, 0);
  // Río y caminos; donde un camino cruza el río, un puente de tablas
  const river = D.river ? kmCurve(D.river) : [], roads = (D.roads || []).map(kmCurve);
  const rw = i => 4 + Math.round(2.4 * i / Math.max(1, river.length));
  const onLand = (x, y) => reg(Math.floor(x / 16), Math.floor(y / 16)) !== '~';
  river.forEach(([x, y], i) => { const w = rw(i); if (onLand(x, y)) { g.fillStyle = 'rgba(28,40,58,.6)'; g.fillRect(Math.round(x - w / 2) - 1, Math.round(y - w / 2) - 1, w + 2, w + 2); } });
  river.forEach(([x, y], i) => { const w = rw(i); g.fillStyle = pat.water; g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); });
  river.forEach(([x, y], i) => { if (i % 11 === 5) { g.fillStyle = 'rgba(240,252,252,.75)'; g.fillRect(Math.round(x) - 1, Math.round(y), 2, 1); } });
  const nearRiver = (x, y, d) => river.some(p => Math.abs(p[0] - x) < d && Math.abs(p[1] - y) < d);
  for (const rd of roads) rd.forEach(([x, y]) => { g.fillStyle = 'rgba(58,38,26,.5)'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 4); });
  for (const rd of roads) rd.forEach(([x, y], i) => { g.fillStyle = kmHash(x, y, 5) < 0.3 ? '#c9a878' : '#dcc08e'; g.fillRect(Math.round(x) - 1, Math.round(y), 2, 2); });
  for (const rd of roads) rd.forEach(([x, y], i) => { if (!nearRiver(x, y, 4)) return; g.fillStyle = '#3a241c'; g.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 6); });
  for (const rd of roads) rd.forEach(([x, y], i) => { if (!nearRiver(x, y, 4)) return; g.fillStyle = i % 3 ? '#b58a5c' : '#8a6240'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 4); });
  // Decorado: todo lo que se levanta del suelo se apunta con su línea de base y se pinta de arriba abajo
  const items = [], T = { g, spr: null };
  T.spr = (k, cx, by) => { const s = KM_SPR[k]; g.drawImage(s[0] === 'b' ? bi : ru, s[1], s[2], s[3], s[4], Math.round(cx - s[3] / 2), Math.round(by - s[4]), s[3], s[4]); };
  const put = (k, cx, by, v) => items.push({ by, fn: () => (KM_DRAW[k] ? KM_DRAW[k](g, cx, by, v, T) : T.spr(k, cx, by)) });
  const sites = [];
  D.zones.forEach((Z, z) => { Z.m.forEach((p, i) => sites.push({ p, s: kmSiteOf(KM_KIND[i], D.biomes[z]), v: z + i })); sites.push({ p: Z.boss, s: kmSiteOf('lair', D.biomes[z]), v: z, big: 1 }); });
  sites.push({ p: D.god, s: kmSiteOf('siege'), v: 0, big: 1 });
  for (const s of sites) put(s.s.draw, s.p[0] * 16, s.p[1] * 16, s.v);
  items.push({ by: D.castle[1] * 16, fn: () => KM_DRAW.castle(g, D.castle[0] * 16, D.castle[1] * 16, D.free) });
  for (const [k, x, y, a, b] of D.props || []) { if (k === 'boat') put(a ? 'boat2' : 'boat', x * 16, y * 16); else if (k === 'field' || k === 'pier') KM_DRAW[k](g, x * 16, y * 16, a, b); else put(k, x * 16, y * 16, a); }
  const busy = (x, y, tall) => sites.some(s => Math.abs(x - s.p[0] * 16) < (s.big ? 27 : 16) && y > s.p[1] * 16 - (s.big ? 38 : 9) && y < s.p[1] * 16 + 9 + tall * 0.75)
    || (Math.abs(x - D.castle[0] * 16) < 36 && y > D.castle[1] * 16 - 44 && y < D.castle[1] * 16 + 28)
    || river.some(p => Math.abs(p[0] - x) < 9 && y - p[1] > -4 && y - p[1] < 6 + tall * 0.7)
    || roads.some(rd => rd.some(p => Math.abs(p[0] - x) < 7 && y - p[1] > -3 && y - p[1] < 4 + tall * 0.6))
    || (D.props || []).some(([k, px, py, a, b]) => (k === 'field' ? x > px * 16 - 8 && x < (px + a) * 16 + 8 && y > py * 16 - 2 && y < (py + b) * 16 + tall * 0.7 : Math.abs(x - px * 16) < 20 && Math.abs(y - py * 16) < 14));
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const r = reg(x, y), sc = r === '~' ? null : KM_SCATTER[ground(r)]; if (!sc) continue;
    for (let j = 0; j < 3; j++) {
      if (kmHash(x, y, 20 + j) > sc.n / 3) continue;
      const k = sc.s[Math.floor(kmHash(x, y, 30 + j) * sc.s.length)], s = KM_SPR[k], tall = s ? s[4] : 8, half = s ? s[3] / 2 : 4;
      const px = x * 16 + 2 + kmHash(x, y, 40 + j) * 12, py = y * 16 + 5 + kmHash(x, y, 50 + j) * 11;
      // ni encima de un sitio, del río o de un camino, ni asomando al mar o al territorio de al lado
      if (busy(px, py, tall) || [-half, half].some(o => reg(Math.floor((px + o) / 16), Math.floor((py - 2) / 16)) !== r) || reg(x, Math.floor((py + 3) / 16)) !== r) continue;
      put(k, px, py, Math.floor(kmHash(x, y, 60 + j) * 9));
    }
  }
  items.sort((a, b) => a.by - b.by); for (const it of items) it.fn();
  // Borde de cada territorio: la silueta menos ella misma encogida tres píxeles
  const out = { c: base, tmp: mk()[0], free: [mk()[0], mk()[0]], hatch: {}, mask: {}, edge: {} };
  for (const k in masks) {
    const [mc] = masks[k], [ec, eg] = mk(), [ic, ig] = mk();
    ig.drawImage(mc, 0, 0); ig.globalCompositeOperation = 'destination-in'; for (const [ox, oy] of KM_RING) ig.drawImage(mc, ox, oy);
    eg.drawImage(mc, 0, 0); eg.globalCompositeOperation = 'destination-out'; eg.drawImage(ic, 0, 0);
    out.mask[k] = mc; out.edge[k] = ec;
  }
  return (KM_CACHE[K.id] = out);
}

// Pinta el mapa en el lienzo del tablón: la base y, encima, el velo de cada territorio según quién lo tenga
function kmPaint(cv) {
  const K = kingdomNow(), D = KMAPS[K.id], B = kmBase(K), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.imageSmoothingEnabled = false;
  if (!B) {   // las hojas aún no han cargado: colores planos, y se reintenta enseguida
    const flat = { water: '#4f8fb0', meadow: '#819447', forest: '#5f7f45', crypt: '#6d6a7a', peaks: '#dfe9ee', ash: '#6a4a4e' };
    D.land.forEach((row, y) => [...row].forEach((r, x) => { g.fillStyle = flat[r === '~' ? 'water' : r === 'c' ? D.capital : D.biomes[+r]]; g.fillRect(x * 16, y * 16, 16, 16); }));
    setTimeout(() => { if (cv.isConnected && !cv.dataset.ok) kmPaint(cv); }, 250);
    return;
  }
  g.drawImage(B.c, 0, 0);
  const t = B.tmp.getContext('2d');
  const veil = (mask, fill, alpha) => { t.globalCompositeOperation = 'copy'; t.drawImage(mask, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = fill; t.fillRect(0, 0, W, H); g.globalAlpha = alpha; g.drawImage(B.tmp, 0, 0); g.globalAlpha = 1; };
  const hatch = col => { if (!B.hatch[col]) { const c = document.createElement('canvas'); c.width = c.height = 6; const h = c.getContext('2d'); h.fillStyle = col; for (let i = 0; i < 6; i++) h.fillRect(i, 5 - i, 1, 1); B.hatch[col] = g.createPattern(c, 'repeat'); } return B.hatch[col]; };
  const regs = ['c', ...D.zones.map((_, z) => '' + z)];
  for (const r of regs) {
    const free = r === 'c' || kmFree(K, +r), col = free ? D.free : kmBoss(K, +r).color;
    if (free) veil(B.mask[r], col, 0.1);
    else { veil(B.mask[r], '#120e14', 0.2); veil(B.mask[r], col, 0.3); veil(B.mask[r], hatch(col), 0.34); }
  }
  // Bordes: cada territorio tomado lleva el suyo; lo que es del reino se junta en una sola mancha con un solo borde, que crece con cada guardián que cae
  const [u, e] = B.free, ug = u.getContext('2d'), eg = e.getContext('2d');
  ug.globalCompositeOperation = 'source-over'; ug.clearRect(0, 0, W, H); for (const r of regs) if (r === 'c' || kmFree(K, +r)) ug.drawImage(B.mask[r], 0, 0);
  eg.globalCompositeOperation = 'copy'; eg.drawImage(u, 0, 0); eg.globalCompositeOperation = 'destination-in'; for (const [ox, oy] of KM_RING) eg.drawImage(u, ox, oy);
  ug.globalCompositeOperation = 'destination-out'; ug.drawImage(e, 0, 0);
  for (const r of regs) if (r !== 'c' && !kmFree(K, +r)) { veil(B.edge[r], '#120e14', 0.55); veil(B.edge[r], kmBoss(K, +r).color, 1); }
  veil(u, '#120e14', 0.5); veil(u, D.free, 0.92);
  // El estandarte de cada guarida: del guardián mientras viva, del reino cuando caiga
  D.zones.forEach((Z, z) => { const free = kmFree(K, z), s = kmSiteOf('lair', D.biomes[z]), x = Math.round(Z.boss[0] * 16) + 13, y = Math.round(Z.boss[1] * 16) + 1, col = free ? D.free : kmBoss(K, z).color;
    const px = kmPx(g, x, y); px(-1, 0, 4, 1, 'rgba(0,0,0,.35)'); px(0, -17, 2, 17, '#1c1216'); px(2, -17, 9, 8, '#1c1216'); px(2, -16, 8, 6, col); px(2, -10, 3, 1, col); px(7, -10, 3, 1, col); px(5, -14, 2, 2, free ? '#fff6d0' : '#1c1216'); if (!free) px(4, -12, 4, 1, '#1c1216'); });
  cv.dataset.ok = 1;
}

// ── Iconos de los marcadores: mapas de bits de 11×11 convertidos en un trazo SVG ──
const KM_ICON = {
  doors:   ['........###', '.......####', '......####.', '.....####..', '#...####...', '##.####....', '.#####.....', '..###......', '.#####.....', '##..##.....', '#....#.....'],
  defend:  ['.#########.', '.#########.', '.####.####.', '.####.####.', '.#.......#.', '.####.####.', '.####.####.', '..###.###..', '..#######..', '...#####...', '....###....'],
  assault: ['.##........', '.#########.', '.#########.', '.########..', '.#########.', '.#########.', '.##........', '.##........', '.##........', '.##........', '####.......'],
  boss:    ['..#######..', '.#########.', '###########', '#..##.##..#', '#..##.##..#', '###########', '.####.####.', '..#######..', '..#.#.#.#..', '..#.#.#.#..', '...........'],
  god:     ['...........', '#....#....#', '##..###..##', '###.###.###', '###########', '###########', '###########', '...........', '###########', '###########', '...........'],
  lock:    ['...#####...', '..##...##..', '..#.....#..', '..#.....#..', '.#########.', '.#########.', '.####.####.', '.####.####.', '.#########.', '.#########.', '...........'],
  check:   ['...........', '.........##', '........###', '.......###.', '......###..', '##...###...', '###.###....', '.#####.....', '..###......', '...#.......', '...........'],
  flag:    ['.#.........', '.########..', '.#########.', '.########..', '.#########.', '.########..', '.#.........', '.#.........', '.#.........', '.#.........', '###........'],
};
const KM_SVG = {};
function kmIcon(k) {
  if (!KM_SVG[k]) { let d = ''; KM_ICON[k].forEach((row, y) => { for (let x = 0; x < row.length; x++) { if (row[x] !== '#') continue; let w = 1; while (row[x + w] === '#') w++; d += `M${x} ${y}h${w}v1h-${w}z`; x += w; } }); KM_SVG[k] = `<svg viewBox="0 0 11 11" aria-hidden="true"><path d="${d}"/></svg>`; }
  return KM_SVG[k];
}

// ── El HTML del tablón: el lienzo, los rótulos de cada territorio, los marcadores y, al lado, el panel y la leyenda ──
function mapHtml() {
  const K = kingdomNow(), D = KMAPS[K.id], W = D.cols * 16, H = D.rows * 16, all = K.zones.length * 4 + 1;
  const nDone = Object.keys(M.done || {}).filter(id => id.startsWith(K.id + ':') && M.done[id]).length;
  const pct = n => +n.toFixed(2);
  const marker = (id, p, up, locked) => { const ms = missionOf(id), done = isDone(id), st = done ? 'Hecha' : locked ? 'Cerrada' : 'Disponible';
    return `<button class="fi mk k-${ms.type}${done ? ' on' : locked ? ' off' : ''}" data-act="${locked ? 'x' : 'm'}:${id}" style="left:${pct(p[0] * 16 / W * 100)}%;top:${pct((p[1] * 16 - up) / H * 100)}%" aria-label="${ms.name}. ${MTYPES[ms.type].name}. ${st}.">${kmIcon(ms.type)}${done ? `<i class="st ok">${kmIcon('check')}</i>` : locked ? `<i class="st">${kmIcon('lock')}</i>` : ''}</button>`; };
  const label = (p, name, sub, col, free) => `<div class="klab${free ? ' free' : ''}" style="left:${pct(p[0] / D.cols * 100)}%;top:${pct(p[1] / D.rows * 100)}%;--zc:${col}"><b>${name}</b><span>${free ? kmIcon('flag') : ''}${sub}</span></div>`;
  let labels = label(D.label, K.name, 'Capital del reino', D.free, true), marks = '';
  K.zones.forEach((Z, z) => {
    const free = kmFree(K, z), B = kmBoss(K, z), P = D.zones[z];
    labels += label(P.label, Z.name, free ? 'Liberado' : 'Tomado por ' + B.name, free ? D.free : B.color, free);
    Z.m.forEach((_, i) => { marks += marker(`${K.id}:${z}:${i}`, P.m[i], kmSiteOf(KM_KIND[i], D.biomes[z]).up, false); });
    marks += marker(`${K.id}:${z}:b`, P.boss, kmSiteOf('lair', D.biomes[z]).up, !zoneOpen(K, z));
  });
  marks += marker(`${K.id}:g`, D.god, kmSiteOf('siege').up, !godOpen(K));
  const held = K.zones.map((Z, z) => z).filter(z => !kmFree(K, z));
  const legend = held.map(z => `<li><u style="--zc:${kmBoss(K, z).color}" class="held"></u>Tomado por ${kmBoss(K, z).name}</li>`).join('') + `<li><u style="--zc:${D.free}"></u>Reino libre</li>` +
    ['doors', 'defend', 'assault', 'boss', 'god'].map(t => `<li class="ic k-${t}">${kmIcon(t)}${MTYPES[t].name}</li>`).join('') + `<li class="ic ok">${kmIcon('check')}Hecha</li><li class="ic">${kmIcon('lock')}Cerrada</li>`;
  return `<div class="kwrap"><div class="kscroll"><div class="kworld" style="aspect-ratio:${W}/${H}"><canvas width="${W}" height="${H}" aria-label="Mapa de ${K.title}"></canvas>${labels}${marks}</div></div>` +
    `<header class="khead"><h2>${K.title}</h2><p class="fine">Contrato · llevas ${nDone} de ${all} encargos · ${held.length ? (held.length === 1 ? 'queda 1 territorio tomado' : 'quedan ' + held.length + ' territorios tomados') : 'todo el reino es libre'}</p></header>` +
    `<aside class="kinfo" aria-live="polite"></aside><ul class="klegend">${legend}</ul></div><p class="fine">${K.lore}</p>`;
}
// El panel: qué es el encargo señalado, cuánto paga, cómo está y, si está cerrado, qué falta
function kmInfoHtml(id) {
  const K = kingdomNow();
  if (!id) return `<p class="eyebrow">Tablón de encargos</p><h3>Elige un encargo en el mapa</h3><p>Cada territorio lleva el color del guardián que lo tiene tomado. Cumple sus tres encargos para llegar hasta él: cuando caiga, el territorio vuelve al reino.</p>`;
  const ms = missionOf(id), T = MTYPES[ms.type], done = isDone(id), god = ms.type === 'god', boss = ms.type === 'boss', pay = payOf(ms);
  const locked = god ? !godOpen(K) : boss && !zoneOpen(K, ms.z);
  let need = '', extra = '';
  if (locked && boss) { const left = K.zones[ms.z].m.filter((_, i) => !isDone(`${K.id}:${ms.z}:${i}`)); need = `Falta completar ${left.length === 1 ? 'un encargo' : 'los ' + left.length + ' encargos'} de ${ms.zone}: ${left.join(' · ')}.`; }
  if (locked && god) { const left = K.zones.map((Z, z) => z).filter(z => !kmFree(K, z)); need = `Falta derrotar a ${left.length === 1 ? 'un guardián' : 'los ' + left.length + ' guardianes'}: ${left.map(z => kmBoss(K, z).name + ' (' + K.zones[z].name + ')').join(' · ')}.`; }
  if (boss) extra = done ? `${ms.zone} ha vuelto al reino.` : `Tiene tomado el territorio de ${ms.zone}. Si cae, vuelve al reino.`;
  if (god) extra = 'El dios que asedia el reino. Solo saldrá cuando no le quede ningún guardián.';
  return `<p class="eyebrow">${god ? K.name : ms.zone} · ${T.name}</p><h3>${ms.name}</h3><p>${T.desc}</p>${extra ? `<p class="dim">${extra}</p>` : ''}` +
    `<dl><div><dt>Paga</dt><dd>${done ? `${Math.round(pay * 0.3)} almas <small>(ya cobraste las ${pay}; repetir paga menos)</small>` : pay + ' almas'}</dd></div>` +
    `<div><dt>Estado</dt><dd class="${done ? 'ok' : locked ? 'no' : 'go'}">${done ? 'Hecha' : locked ? 'Cerrada' : 'Disponible'}</dd></div></dl>` +
    (locked ? `<p class="need">${need}</p>` : `<button class="primary kgo" data-go="${id}">${done ? 'Repetir encargo' : 'Aceptar encargo'}</button>`);
}
// Tras cada repintado del panel o cambio de selección: pinta el lienzo si hace falta y pone en el panel el marcador señalado
function kmSync() {
  const box = $('ovBody').querySelector('.kwrap'); if (!box) return;
  const cv = box.querySelector('canvas'); if (!cv.dataset.ok && !cv.dataset.try) { cv.dataset.try = 1; kmPaint(cv); }
  const sel = box.querySelector('.fi.mk.sel'), id = sel ? sel.dataset.act.slice(2) : '', info = box.querySelector('.kinfo');
  if (info.dataset.id === id && info.firstChild) return;
  const moved = info.dataset.id !== undefined; info.dataset.id = id; info.innerHTML = kmInfoHtml(id);
  // Al moverse con mando o teclado en una pantalla baja: si el mapa cabe entero, que se vea entero y no solo el marcador
  const sc = box.querySelector('.kscroll'), r = sc.getBoundingClientRect(), o = $('overlay').getBoundingClientRect();
  if (moved && sel && !kmByPtr && r.height <= o.height - 8 && (r.top < o.top + 4 || r.bottom > o.bottom - 4)) sc.scrollIntoView({ block: 'nearest' });
  kmByPtr = false;
}
let kmByPtr = false;
function kmSelect(mk) {
  const els = [...$('ovBody').querySelectorAll('.fi')], i = els.indexOf(mk);
  if (i < 0 || i === listSel) return;
  kmByPtr = true; listSel = i; els.forEach((el, j) => el.classList.toggle('sel', j === i));
}
{
  const body = $('ovBody'); let ptr = 'mouse';
  new MutationObserver(kmSync).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  let at = '';
  body.addEventListener('pointerdown', e => { ptr = e.pointerType || 'mouse'; }, true);
  // Con ratón, pasar por encima de un marcador ya lo señala (solo si el ratón se ha movido de verdad: al repintarse el panel bajo un ratón quieto
  // el navegador avisa igual, y eso le quitaría la selección al mando). Con el dedo no hay «pasar por encima»: el primer toque señala y el segundo acepta.
  const hover = e => { const xy = e.clientX + ',' + e.clientY, still = xy === at; at = xy; const mk = !still && e.pointerType === 'mouse' && e.target.closest ? e.target.closest('.fi.mk') : null; if (mk) kmSelect(mk); };
  body.addEventListener('pointerover', hover); body.addEventListener('pointermove', hover);
  body.addEventListener('click', e => {
    const mk = e.target.closest ? e.target.closest('.fi.mk') : null;
    if (mk && e.isTrusted && ptr !== 'mouse' && !mk.classList.contains('sel')) { e.stopPropagation(); e.preventDefault(); audioInit(); blip(700, 0.03, 'triangle', 0.03); kmSelect(mk); return; }
    const go = e.target.closest ? e.target.closest('.kgo') : null;
    if (go) { audioInit(); forgeAct('m:' + go.dataset.go); }
  }, true);
}
