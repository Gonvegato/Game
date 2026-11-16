// ───────────────────────── Salas: muros, formas y caminos ─────────────────────────
// Cada sala es una rejilla de casillas de CELL unidades. Un generador decide qué casillas son muro;
// después se comprueba que todo el suelo sea alcanzable y se funden las casillas de muro en rectángulos.
// Los enemigos que no ven al jugador siguen un campo de distancias calculado desde su casilla.
const CELL = 16;
const CAMP_GAP = 24, CAMP_START = 20;
const ROOM_SIZES = { small: [40, 26], mid: [46, 30], big: [52, 34], boss: [50, 34], huge: [66, 44], vast: [92, 62], plaza: [104, 76], hall: [24, 22], shop: [22, 16] };
const NAV = { cols: 0, rows: 0, wall: new Uint8Array(0), dist: new Int16Array(0), t: 0, pc: -1 };

// Generadores: reciben una rejilla vacía (g[y][x] = 0) y devuelven la casilla donde empieza el jugador.
const fillRect = (g, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = 1; };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// Exteriores: en la rejilla, 1 es un obstáculo (roca, árbol, casa: para el paso y los disparos) y 2 es agua (para el paso, no los disparos).
// El generador deja en OUT qué es cada obstáculo, para dibujarlo con el paquete de biomas.
let OUT = null;
const ob = (g, x, y, w, h, kind, extra) => { fillRect(g, x, y, w, h); OUT.obs.push(Object.assign({ x, y, w, h, kind }, extra)); };
const outBorder = (g, c, r) => { fillRect(g, 0, 0, c, 2); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r); };
const pond = (g, cx, cy, rx, ry) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && g[y][x] === 0) g[y][x] = 2; };
const areaFree = (g, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!g[j] || g[j][i] !== 0) return false; return true; };
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
  // ── Formas de sala: círculo, L, cuadrada, octógono, rombo, U y anillo (las paredes son las casillas que quedan fuera de la forma) ──
  // Círculo (o elipse): a veces con un pilar en medio
  circulo(g, c, r) {
    const cx = (c - 1) / 2, cy = (r - 1) / 2, rx = c / 2 - 2, ry = r / 2 - 2;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) g[y][x] = 1;
    if (Math.random() < 0.5) fillRect(g, (c >> 1) - 1, (r >> 1) - 1, 3, 3);
    return [c >> 1, r - 5];
  },
  // En L: una esquina entera tapiada
  ele(g, c, r) {
    const w = Math.floor(c * ri(42, 55) / 100), h = Math.floor(r * ri(42, 55) / 100), corner = ri(0, 3);
    fillRect(g, corner % 2 ? c - w : 0, corner < 2 ? 0 : r - h, w, h);
    return corner < 2 ? [corner % 2 ? Math.floor(c * 0.25) : Math.floor(c * 0.75), r - 5] : [corner % 2 ? Math.floor(c * 0.25) : Math.floor(c * 0.75), 4];
  },
  // Cuadrada: un cuadrado en medio de la sala, con un pilar en cada esquina
  cuadrado(g, c, r) {
    const s = Math.min(c, r) - 4, x0 = (c - s) >> 1, y0 = (r - s) >> 1;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (x < x0 || x >= x0 + s || y < y0 || y >= y0 + s) g[y][x] = 1;
    for (const [px, py] of [[x0 + 4, y0 + 4], [x0 + s - 6, y0 + 4], [x0 + 4, y0 + s - 6], [x0 + s - 6, y0 + s - 6]]) fillRect(g, px, py, 2, 2);
    return [c >> 1, y0 + s - 4];
  },
  // Octógono: las cuatro esquinas cortadas en diagonal
  octogono(g, c, r) {
    const k = Math.floor(Math.min(c, r) * 0.32);
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { const dx = Math.min(x, c - 1 - x), dy = Math.min(y, r - 1 - y); if (dx + dy < k) g[y][x] = 1; }
    return [c >> 1, r - 5];
  },
  // Rombo: solo queda el rombo del centro, con un poco de margen en las puntas
  rombo(g, c, r) {
    const cx = (c - 1) / 2, cy = (r - 1) / 2, rx = c / 2 + 2, ry = r / 2 + 1;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (Math.abs(x - cx) / rx + Math.abs(y - cy) / ry > 0.98) g[y][x] = 1;
    return [c >> 1, r - 6];
  },
  // En U: un bloque que baja desde el muro de arriba y parte la sala en dos brazos
  ucodo(g, c, r) {
    const w = Math.floor(c * 0.3), h = Math.floor(r * 0.58);
    fillRect(g, (c - w) >> 1, 0, w, h);
    return [c >> 1, r - 4];
  },
  // Anillo: un patio redondo alrededor de un bloque redondo
  anillo(g, c, r) {
    const cx = (c - 1) / 2, cy = (r - 1) / 2, rx = c / 2 - 2, ry = r / 2 - 2;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1 || d < 0.16) g[y][x] = 1; }
    return [c >> 1, r - 5];
  },
  // El campamento del buhonero: una sala pequeña y tranquila (la hoguera y el buhonero los pone 44_calm.js)
  campamento(g, c, r) {
    for (const [px, py] of [[4, 4], [c - 6, 4], [4, r - 6], [c - 6, r - 6]]) fillRect(g, px, py, 2, 2);
    return [c >> 1, r - 5];
  },
  // Aldea: cuatro casas de piedra alrededor de una plaza con la campana en medio
  aldea(g, c, r) {
    for (const [fx, fy] of [[0.2, 0.22], [0.8, 0.22], [0.2, 0.78], [0.8, 0.78]]) fillRect(g, Math.floor(c * fx) - 2, Math.floor(r * fy) - 1, 5, 3);
    fillRect(g, (c >> 1) - 9, (r >> 1) - 1, 2, 2); fillRect(g, (c >> 1) + 7, (r >> 1) - 1, 2, 2);
    return [c >> 1, (r >> 1) + 4];
  },
  // Exterior de Asalto: el paisaje de la zona (cementerio, bosque de setas, nieve o tierra quemada), con campamentos enemigos
  // ya montados (hoguera, sacos, toneles y bandera alrededor de cada estandarte), a veces una aldea abandonada, charcas y obstáculos
  pradera(g, c, r) {
    const tid = ZONE_THEME[clamp(((S && S.world) || 1) - 1, 0, 3)], T = THEMES[tid], R = a => a[ri(0, a.length - 1)];
    OUT = { biome: T.biome, theme: tid, obs: [], spots: [], npcs: [], paths: [], bridges: [], decor: [], fires: [], camps: [] };
    outBorder(g, c, r);
    const sx = c >> 1, sy = r - 6, keep = [[sx, sy, 5]], far = (x, y) => keep.every(([kx, ky, kr]) => Math.hypot(x - kx, y - ky) >= kr);
    // campamentos: separados de sobra para que, al atacar uno, no te vean desde el de al lado (CAMP_GAP casillas entre ellos)
    for (let i = 0, t = 0; i < 5 && t < 900; t++) {
      const x = ri(9, c - 10), y = ri(8, r - 9);
      if (Math.hypot(x - sx, y - sy) < CAMP_START || OUT.camps.some(k => Math.hypot(k.x - x, k.y - y) < CAMP_GAP) || !areaFree(g, x - 6, y - 5, 13, 11)) continue;
      OUT.camps.push({ x, y }); keep.push([x, y, 6.5]);
      ob(g, x + 3, y + 1, 2, 2, 'ref', { r: 'firering' }); OUT.fires.push({ x: x + 4, y: y + 2.5 });
      ob(g, x - 4, y - 3, 2, 1, 'ref', { r: 'skullflag' }); ob(g, x + 3, y - 3, 2, 1, 'ref', { r: i % 2 ? 'barrels' : 'shelf' }); ob(g, x - 4, y + 2, 1, 1, 'ref', { r: 'cask' });
      OUT.decor.push({ r: 'bedroll1', x: x - 2, y: y + 4.2, shadow: false }, { r: 'bedroll2', x: x - 0.4, y: y + 4.4, shadow: false }, { r: 'bags', x: x + 1.6, y: y - 2.4 }, { r: 'bedroll1', x: x + 1.4, y: y + 4.3, shadow: false });
      i++;
    }
    if (Math.random() < 0.8) for (let t = 0; t < 120; t++) {   // aldea abandonada: tres casas en ruinas, su pozo, vallas rotas y un espantapájaros
      const x = ri(5, c - 23), y = ri(9, r - 17);
      if (Math.hypot(x + 9 - sx, y + 6 - sy) < 13 || !areaFree(g, x - 2, y - 6, 22, 20) || OUT.camps.some(k => Math.abs(k.x - x - 9) < 17 && Math.abs(k.y - y - 5) < 14)) continue;
      ob(g, x, y, 8, 4, 'house', { v: ri(0, 2), big: true, ruin: true }); ob(g, x + 12, y + 1, 6, 4, 'house', { v: ri(0, 2), ruin: true }); ob(g, x + 4, y + 9, 6, 4, 'house', { v: ri(0, 2), ruin: true });
      ob(g, x + 13, y + 8, 2, 1, 'well'); ob(g, x + 16, y + 10, 2, 2, 'prop', { k: 'scarecrow' }); ob(g, x + 1, y + 11, 2, 1, 'prop', { k: 'hay' });
      for (const fx of [0, 1, 3]) ob(g, x + 9 + fx, y + 6, 1, 1, 'fence', { horiz: 1 });
      break;
    }
    if (tid !== 'ash') for (let i = 0, t = 0; i < (tid === 'mines' ? 3 : 2) && t < 80; t++) {   // charcas (hielo en la nieve)
      const rx = ri(3, 5), ry = ri(2, 3), cx = ri(7 + rx, c - 8 - rx), cy = ri(6 + ry, r - 7 - ry);
      if (!far(cx, cy) || !areaFree(g, cx - rx - 3, cy - ry - 3, 2 * rx + 7, 2 * ry + 7)) continue;
      pond(g, cx, cy, rx + 0.4, ry + 0.4); i++;
    }
    for (let i = 0, t = 0; i < Math.floor(c * r / 115) && t < 1200; t++) {   // obstáculos del tema: pocos y grandes
      const roll = Math.random(), big = roll > 0.5, small = roll < 0.08, w = big ? 3 : small ? 1 : 2, h = small ? 1 : 2, x = ri(5, c - 6 - w), y = ri(5, r - 6 - h);
      if (!far(x + w / 2, y + h / 2) || !areaFree(g, x - 3, y - 3, w + 6, h + 6)) continue;
      if (small) ob(g, x, y, 1, 1, 'ref', { r: R(T.small) }); else if (big) ob(g, x, y, 3, 2, 'ref', { r: R(T.big) }); else ob(g, x, y, 2, 2, Math.random() < 0.62 ? 'tree' : 'rock', { v: ri(0, 23) });
      i++;
    }
    return [sx, sy];
  },
  // Aldea al aire libre (Defensa): la campana en la plazuela, casas en las esquinas, calles empedradas en cruz y la vida de un pueblo:
  // puestos, pozo, bancos, heno, huerto vallado, toneles y los árboles y piedras de su zona. Las calles quedan libres para los asaltantes.
  aldea_ext(g, c, r) {
    const tid = ZONE_THEME[clamp(((S && S.world) || 1) - 1, 0, 3)], T = THEMES[tid], R = a => a[ri(0, a.length - 1)];
    OUT = { biome: T.biome, theme: tid, obs: [], spots: [], npcs: [], paths: [], bridges: [], paves: [], decor: [], fires: [] };
    outBorder(g, c, r);
    const cx = c >> 1, cy = r >> 1;
    [[0.2, 0.3], [0.8, 0.3], [0.2, 0.78], [0.8, 0.78]].forEach(([fx, fy], i) => ob(g, Math.floor(c * fx) - 3, Math.floor(r * fy) - 2, 6, 4, 'house', { v: i }));
    OUT.paves.push([cx - 1, 2, 2, r - 4], [2, cy - 1, c - 4, 2], [cx - 4, cy - 3, 8, 6]);
    const lane = (x, y, w, h) => x + w > cx - 3 && x < cx + 3 || y + h > cy - 3 && y < cy + 3 || (x + w > cx - 6 && x < cx + 6 && y + h > cy - 5 && y < cy + 5);   // calles y plazuela
    const put = (w, h, pad, fn) => { for (let t = 0; t < 80; t++) { const x = ri(4, c - 5 - w), y = ri(4, r - 5 - h); if (lane(x, y, w, h) || !areaFree(g, x - pad, y - pad, w + 2 * pad, h + 2 * pad)) continue; fn(x, y); return true; } return false; };
    put(3, 1, 2, (x, y) => ob(g, x, y, 3, 1, 'stall', { v: 0 })); put(3, 1, 2, (x, y) => ob(g, x, y, 3, 1, 'stall', { v: 2 }));
    put(2, 1, 2, (x, y) => ob(g, x, y, 2, 1, 'well')); put(3, 1, 2, (x, y) => ob(g, x, y, 3, 1, 'prop', { k: 'bench' }));
    put(6, 4, 2, (x, y) => {   // huerto vallado, con su espantapájaros y el heno
      for (let i = 0; i < 6; i++) { if (i !== 2 && i !== 3) ob(g, x + i, y, 1, 1, 'fence', { horiz: 1 }); ob(g, x + i, y + 3, 1, 1, 'fence', { horiz: 1 }); }
      ob(g, x + 2, y + 1, 2, 2, 'prop', { k: 'scarecrow' }); OUT.decor.push({ r: BIO.deco[9], x: x + 1, y: y + 2.6, shadow: false }, { r: BIO.deco[9], x: x + 5, y: y + 2.2, shadow: false });
    });
    for (let i = 0; i < 2; i++) put(2, 1, 2, (x, y) => ob(g, x, y, 2, 1, 'prop', { k: 'hay' }));
    for (let i = 0; i < 2; i++) put(1, 1, 2, (x, y) => ob(g, x, y, 1, 1, 'barrel', { v: i }));
    for (let i = 0; i < 4; i++) put(2, 2, 2, (x, y) => ob(g, x, y, 2, 2, 'tree', { v: ri(0, 23) }));
    for (let i = 0; i < 2; i++) put(3, 2, 2, (x, y) => ob(g, x, y, 3, 2, 'ref', { r: R(T.big) }));
    return [cx, cy + 4];
  },
  // La ciudad del reino: el castillo arriba y, debajo, la plaza mayor con el pozo, el tablón y el mercado. De la plaza salen la
  // avenida y las calles empedradas, y entre ellas, barrios de casas desperdigadas con sus huertos, árboles y vallas. Cada oficio
  // está en un barrio: la forja al oeste, la posada al nordeste y el patio de armas al suroeste (las flechas del borde de la
  // pantalla llevan hasta ellos). Abajo, el arroyo con sus puentes. El plano sale siempre igual en el mismo reino (semilla del
  // reino) y las casas siguen el estilo del reino (CITY_STYLE), para que cada ciudad se distinga por sus casas.
  plaza(g, c, r) {
    const kd = typeof kingdomNow === 'function' ? kingdomNow() : null, kid = kd ? kd.id : 'valdehierro';
    const rand0 = Math.random; Math.random = seeded(kid + ':ciudad');
    try { return cityGen(g, c, r, kid); } finally { Math.random = rand0; }
  },
  // El salón del trono: muros alrededor, alfombra hasta el trono, guardias a los lados y la puerta abajo
  hall(g, c, r) {
    OUT = { interior: 'throne', obs: [], spots: [], npcs: [], paths: [], bridges: [] };
    fillRect(g, 0, 0, c, 5); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r);
    const cx = c >> 1;
    for (let y = r - 2; y < r; y++) for (const x of [cx - 1, cx]) g[y][x] = 0;   // la puerta
    fillRect(g, cx - 1, 5, 2, 1);                                                 // el trono
    for (const x of [5, c - 7]) for (const y of [8, 13]) fillRect(g, x, y, 2, 2);  // columnas
    OUT.npcs.push({ key: 'king', x: cx, y: 6.15 }, { key: 'queen', x: cx + 1.6, y: 6.9, flip: true }, { key: 'guard_k', x: cx - 2.5, y: 7.6 }, { key: 'guard_k', x: cx + 2.5, y: 7.6, flip: true }, { key: 'guard', x: cx - 3, y: r - 3.2 }, { key: 'guard', x: cx + 3, y: r - 3.2, flip: true }, { key: 'priest', x: 3.6, y: 7 });
    OUT.spots.push({ x: cx * CELL, y: 7.4 * CELL, id: 'king', label: 'Hablar con el rey' }, { x: (cx + 2.4) * CELL, y: 7.9 * CELL, id: 'queen', label: 'Hablar con la reina' }, { x: cx * CELL, y: (r - 1.2) * CELL, id: 'exit', label: 'Salir a la plaza' });
    return [cx, r - 4];
  },
  // La forja y la posada por dentro: muros alrededor, la puerta abajo, muebles del paquete y quien atiende
  forgeroom(g, c, r) { return interiorRoom(g, c, r, 'forge'); },
  innroom(g, c, r) { return interiorRoom(g, c, r, 'inn'); },
  // Arena de jefe: abierta, con pilares cuadrados contra los que estrellarlo
  arena(g, c, r) {
    for (const [fx, fy] of [[0.22, 0.3], [0.78, 0.3], [0.22, 0.72], [0.78, 0.72], [0.5, 0.52]]) fillRect(g, Math.floor(c * fx) - 1, Math.floor(r * fy) - 1, 3, 3);
    return [c >> 1, r - 5];
  },
};
function interiorRoom(g, c, r, kind) {
  OUT = { interior: kind, obs: [], spots: [], npcs: [], paths: [], bridges: [], props: [] };
  fillRect(g, 0, 0, c, 4); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r);
  const cx = c >> 1; for (let y = r - 2; y < r; y++) for (const x of [cx - 1, cx]) g[y][x] = 0;
  const put = (src, s, x, y, w, h) => { if (w) fillRect(g, Math.floor(x - w / 2), Math.floor(y - h), w, h); OUT.props.push({ src, s, x: x * CELL, y: y * CELL }); };
  if (kind === 'forge') {
    put('town', 'furnace', 5, 6, 2, 1); put('town', 'furnace', 8.5, 6, 2, 1); put('town', 'anvil', cx + 1, 9, 4, 1); put('town', 'workbench', c - 5.5, 6, 4, 1);
    put('castle', [336, 1, 32, 26], c - 4, 12, 2, 1); put('bio', 'barrel0', 3.6, 13, 1, 1); put('bio', 'barrel1', 4.6, 13.2, 1, 1);
    OUT.npcs.push({ key: 'smith', x: cx - 1.6, y: 9.4 });
    OUT.spots.push({ x: (cx + 1) * CELL, y: 10.4 * CELL, id: 'forge', label: 'Trabajar en el yunque' });
  } else {
    put('castle', [144, 203, 32, 57], cx, 4.6, 0, 0);
    for (const [x, y] of [[5.5, 8], [c - 5.5, 8], [5.5, 12], [c - 5.5, 12]]) { put('castle', [368, 10, 48, 36], x, y, 3, 1); put('castle', [304, 11, 32, 11], x, y + 1.1, 0, 0); }
    put('castle', [320, 44, 48, 20], cx, 7.4, 3, 1); put('bio', 'barrel0', c - 3.4, 6, 1, 1); put('bio', 'barrel2', c - 3.4, 7, 1, 1); put('castle', [336, 1, 32, 26], 3.6, 6, 2, 1);
    OUT.npcs.push({ key: 'keeper', x: cx, y: 6.6 }, { key: 'adv_dwarf', x: 4.4, y: 12.4 }, { key: 'adv_archer', x: c - 4.2, y: 9.4, flip: true }, { key: 'adv_knight', x: 8.5, y: 10 }, { key: 'cit_tavern_b', x: c - 8.5, y: 13.4, flip: true }, { key: 'cit_peasant', x: 4, y: 9.6 });
    OUT.spots.push({ x: cx * CELL, y: 8.6 * CELL, id: 'inn', label: 'Pedir la habitación' });
  }
  OUT.spots.push({ x: cx * CELL, y: (r - 1.2) * CELL, id: 'exit', label: 'Salir a la plaza' });
  return [cx, r - 4];
}
// Números al azar repetibles a partir de un texto (para que la ciudad de un reino sea siempre la misma)
function seeded(str) {
  let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Estilo de las casas de cada reino: qué colores de tejado y qué paredes se ven en su ciudad (casas en src/49_cityhouses.js)
const CITY_STYLE = {
  valdehierro: { roofs: ['brown', 'red', 'ochre', 'slate'], walls: null },
  torrealba:   { roofs: ['slate', 'blue', 'teal', 'plum'], walls: ['plaster', 'brick', 'timber'] },   // un reino frío y viejo: tejados de pizarra y piedra
  default:     { roofs: null, walls: null },
};
function cityGen(g, c, r, kid) {
  OUT = { biome: 'grass', obs: [], spots: [], npcs: [], paths: [], bridges: [], paves: [], wander: [], decor: [] };
  outBorder(g, c, r);
  const cx = c >> 1, P = (x, y) => ({ x: x * CELL, y: y * CELL }), deco = (x, y, w, h, kind, extra) => ob(g, x, y, w, h, kind, extra);
  const occ = Array.from({ length: r }, () => new Uint8Array(c));   // lo ocupado o reservado: calles, edificios con su tejado, patios
  const res = (x, y, w, h) => { for (let j = Math.max(0, y); j < Math.min(r, y + h); j++) for (let i = Math.max(0, x); i < Math.min(c, x + w); i++) occ[j][i] = 1; };
  const free = (x, y, w, h) => { if (x < 2 || y < 2 || x + w > c - 2 || y + h > r - 2) return false; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (occ[j][i] || g[j][i]) return false; return true; };
  const pave = (x, y, w, h) => { OUT.paves.push([x, y, w, h]); res(x, y, w, h); };
  // el castillo y la plaza mayor
  deco(cx - 11, 0, 22, 5, 'castle'); res(cx - 13, 0, 26, 6);
  const PL = { x: cx - 14, y: 8, w: 28, h: 14 };
  pave(cx - 2, 5, 4, 3); pave(PL.x, PL.y, PL.w, PL.h);
  deco(cx - 1, 15, 2, 1, 'well'); deco(cx + 7, 11, 2, 1, 'board');
  for (const [x, v] of [[cx - 12, 0], [cx - 8, 1], [cx + 5, 2], [cx + 9, 0]]) deco(x, 19, 3, 1, 'stall', { v });
  // calles: la avenida hasta el arroyo, dos calles de este a oeste y dos de norte a sur, y las que unen la plaza con ellas
  const WX = 20, EX = c - 23, S1 = 27, S2 = 48, RV = r - 8;
  pave(cx - 2, PL.y + PL.h, 4, RV - PL.y - PL.h); pave(cx - 2, RV + 3, 4, r - 2 - RV - 3);
  pave(2, S1, c - 4, 3); pave(2, S2, c - 4, 3);
  pave(WX, 6, 3, RV - 6); pave(EX, 6, 3, RV - 6);
  pave(WX + 3, 13, PL.x - WX - 3, 3); pave(PL.x + PL.w, 13, EX - PL.x - PL.w, 3);
  // el arroyo, con un puente en cada calle que lo cruza
  for (let y = RV; y < RV + 3; y++) for (let x = 2; x < c - 2; x++) { const st = (x >= cx - 2 && x < cx + 2) || (x >= WX && x < WX + 3) || (x >= EX && x < EX + 3); if (!st) g[y][x] = 2; }
  for (const [x0, w] of [[cx - 2, 4], [WX, 3], [EX, 3]]) for (let x = x0; x < x0 + w; x++) OUT.bridges.push({ x, y: RV, h: 3 });
  res(2, RV - 1, c - 4, 5);
  // La forja (oeste): el edificio con su letrero, y delante el yunque, la fragua y el banco
  const HS = CITY_HOUSES.map((h, i) => Object.assign({ i }, h)), trade = t => HS.find(h => h.trade === t);
  const FG = { x: 6, y: S1 + 6 };
  deco(FG.x, FG.y, 8, 3, 'chouse', { i: trade('forge').i }); res(FG.x - 1, FG.y - 6, 10, 9);
  deco(FG.x - 2, FG.y + 5, 3, 2, 'prop', { k: 'anvil' }); deco(FG.x + 7, FG.y + 5, 2, 2, 'prop', { k: 'furnace' }); deco(FG.x + 10, FG.y + 5, 3, 1, 'prop', { k: 'workbench' }); res(FG.x - 3, FG.y + 3, 17, 6);   // la puerta queda libre
  // La posada (nordeste): el edificio, su terraza con bancos y toneles
  const IN = { x: EX + 7, y: 12 };
  deco(IN.x, IN.y, 8, 3, 'chouse', { i: trade('inn').i }); res(IN.x - 1, IN.y - 6, 10, 9);
  deco(IN.x - 1, IN.y + 5, 3, 1, 'prop', { k: 'bench' }); deco(IN.x + 6, IN.y + 5, 3, 1, 'prop', { k: 'bench' }); deco(IN.x + 9, IN.y + 2, 1, 1, 'barrel', { v: 0 }); deco(IN.x + 9, IN.y + 1, 1, 1, 'barrel', { v: 1 }); deco(IN.x - 2, IN.y + 2, 2, 1, 'prop', { k: 'table' });
  res(IN.x - 3, IN.y + 3, 14, 4);
  // El patio de armas (suroeste), vallado, con la entrada al norte
  const GY = { x: 4, y: S2 + 4, w: 14, h: 11 };
  for (let x = GY.x; x < GY.x + GY.w; x++) { if (x < GY.x + 5 || x > GY.x + 8) deco(x, GY.y, 1, 1, 'fence', { horiz: 1 }); deco(x, GY.y + GY.h - 1, 1, 1, 'fence', { horiz: 1 }); }
  for (let y = GY.y + 1; y < GY.y + GY.h - 1; y++) { deco(GY.x, y, 1, 1, 'fence', { horiz: 0 }); deco(GY.x + GY.w - 1, y, 1, 1, 'fence', { horiz: 0 }); }
  res(GY.x - 1, GY.y - 2, GY.w + 2, GY.h + 3);
  // Las casas: en filas dentro de cada manzana, con la puerta hacia la calle de abajo o hacia el patio, y huecos sueltos que
  // luego son huertos o árboles. Del estilo del reino.
  const st = CITY_STYLE[kid] || CITY_STYLE.default, pool = HS.filter(h => !h.trade && (!st.roofs || st.roofs.includes(h.roof)) && (!st.walls || st.walls.includes(h.wall)));
  const bigs = pool.filter(h => h.size === 'big'), smalls = pool.filter(h => h.size === 'small');
  const bld = Array.from({ length: r }, () => new Uint8Array(c));   // solo edificios y cosas que tapan una puerta (las calles no)
  for (const o of OUT.obs) for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) if (bld[j]) bld[j][i] = 1;
  const roofz = Array.from({ length: r }, () => new Uint8Array(c));   // lo que tapa el tejado de cada casa: ahí no puede quedar una puerta
  const doorOk = (x, y) => y < r - 2 && [x, x + 1].every(i => !g[y][i] && !bld[y][i] && !roofz[y][i]);
  // de abajo arriba y de izquierda a derecha, cada casa en el primer sitio donde cabe; de vez en cuando se deja un claro
  for (let fy = RV - 5; fy >= 7; fy--) for (let x = 2; x < c - 8;) {
    const big = Math.random() < 0.38, w = big ? 8 : 6, h = 3, L = big ? bigs : smalls;
    if (!L.length || !free(x, fy - 5, w, h + 5) || !doorOk(x + (w >> 1) - 1, fy + h)) { x++; continue; }
    if (Math.random() < 0.22) { x += ri(3, 6); continue; }   // claro: huerto, árbol o nada
    deco(x, fy, w, h, 'chouse', { i: L[ri(0, L.length - 1)].i }); res(x, fy - 5, w, h + 5); res(x + (w >> 1) - 1, fy + h, 2, 1);
    for (let j = fy; j < fy + h; j++) for (let k = x; k < x + w; k++) bld[j][k] = 1;
    for (let j = fy - 5; j < fy; j++) for (let k = x; k < x + w; k++) if (roofz[j]) roofz[j][k] = 1;
    x += w + (Math.random() < 0.4 ? 2 : 1);
  }
  // Huertos vallados, árboles, matorrales y la vida de las calles en lo que queda libre
  const put = (w, h, pad, fn) => { for (let t = 0; t < 120; t++) { const x = ri(3, c - 4 - w), y = ri(7, RV - 2 - h); if (!free(x - pad, y - pad, w + 2 * pad, h + 2 * pad)) continue; fn(x, y); res(x - 1, y - 1, w + 2, h + 2); return true; } return false; };
  for (let i = 0; i < 7; i++) put(6, 4, 1, (x, y) => {
    for (let k = 0; k < 6; k++) { if (k !== 2 && k !== 3) deco(x + k, y, 1, 1, 'fence', { horiz: 1 }); deco(x + k, y + 3, 1, 1, 'fence', { horiz: 1 }); }
    if (Math.random() < 0.5) deco(x + 2, y + 1, 2, 2, 'prop', { k: 'scarecrow' }); else for (let k = 0; k < 3; k++) OUT.decor.push({ r: BIO.deco[9], x: x + 1 + k * 1.6, y: y + 2.4, shadow: false });
  });
  for (let i = 0; i < 26; i++) put(2, 2, 1, (x, y) => deco(x, y, 2, 2, 'tree', { v: ri(0, 23) }));
  for (let i = 0; i < 18; i++) put(2, 2, 0, (x, y) => deco(x, y, 2, 2, 'prop', { k: ['bush1', 'bush2', 'bush3', 'bush4', 'shrub', 'shrub2'][ri(0, 5)] }));
  for (let i = 0; i < 6; i++) put(2, 1, 1, (x, y) => deco(x, y, 2, 1, 'prop', { k: 'hay' }));
  for (let i = 0; i < 10; i++) put(1, 1, 1, (x, y) => deco(x, y, 1, 1, 'barrel', { v: ri(0, 2) }));
  for (let i = 0; i < 3; i++) put(2, 1, 2, (x, y) => deco(x, y, 2, 1, 'well'));
  for (let i = 0; i < 5; i++) put(3, 1, 1, (x, y) => deco(x, y, 3, 1, 'prop', { k: 'bench' }));
  for (let x = 4; x < c - 4; x += ri(3, 6)) if (Math.random() < 0.6) { const y = r - 4; if (!g[y][x] && !occ[y][x]) deco(x, y, 2, 1, 'tree', { v: ri(0, 23) }); }   // la ribera sur
  // Gente: quien atiende cada sitio, los guardias del castillo y vecinos paseando por la plaza y las calles
  OUT.npcs.push({ key: 'smith', x: FG.x + 1.2, y: FG.y + 5.6 }, { key: 'keeper', x: IN.x + 2.5, y: IN.y + 4.4, flip: true },
    { key: 'decoy', x: GY.x + 3, y: GY.y + 4 }, { key: 'post', x: GY.x + 6.5, y: GY.y + 3.4 }, { key: 'turret', x: GY.x + 4.5, y: GY.y + 7.6 }, { key: 'trainer', x: GY.x + 9.5, y: GY.y + 6.2 }, { key: 'decoy', x: GY.x + 11, y: GY.y + 8 },
    { key: 'guard', id: 'g_puerta', x: cx - 3.2, y: 7.4 }, { key: 'guard', x: cx + 3.2, y: 7.4, flip: true }, { key: 'guard', id: 'g_puente', x: cx - 3.4, y: RV - 1.2 }, { key: 'guard', x: cx + 3.4, y: RV - 1.2, flip: true },
    { key: 'cit_peasant', id: 'v_terraza', x: IN.x + 8, y: IN.y + 5.2, flip: true }, { key: 'villager', id: 'v_mercado', x: cx - 10, y: 21 }, { key: 'villager', id: 'v_pozo', x: cx + 8, y: 21, flip: true },
    { key: 'adv_knight', id: 'v_patio', x: GY.x + GY.w + 1.5, y: GY.y + 2 });
  for (const n of OUT.npcs) if (n.id) OUT.spots.push({ x: n.x * CELL, y: (n.y + 0.9) * CELL, id: 'talk', who: n.id, label: 'Hablar' });   // vecinos con los que se puede hablar (CITY_TALK, 36_town.js)
  OUT.wander.push({ key: 'adv_knight', area: [PL.x + 1, PL.y + 1, PL.w - 2, PL.h - 4] }, { key: 'cit_peasant', area: [PL.x + 1, PL.y + 1, PL.w - 2, 8] }, { key: 'cit_tavern_b', area: [PL.x + 1, PL.y + 1, PL.w - 2, 8] },
    { key: 'villager', area: [PL.x + 2, PL.y + 3, PL.w - 4, 5] }, { key: 'cit_peasant', area: [cx - 2, PL.y + PL.h, 4, RV - PL.y - PL.h] }, { key: 'villager', area: [cx - 2, PL.y + PL.h, 4, RV - PL.y - PL.h] },
    { key: 'cit_peasant', area: [4, S1, c - 8, 3] }, { key: 'cit_tavern_b', area: [4, S1, c - 8, 3] }, { key: 'villager', area: [4, S2, c - 8, 3] }, { key: 'cit_peasant', area: [4, S2, c - 8, 3] },
    { key: 'adv_dwarf', area: [WX, 8, 3, RV - 10] }, { key: 'cit_peasant', area: [EX, 8, 3, RV - 10] }, { key: 'adv_archer', area: [IN.x - 2, IN.y + 4, 10, 2] });
  OUT.spots.push(Object.assign(P(cx, 5.6), { id: 'king', label: 'Subir al castillo' }), Object.assign(P(FG.x + 4, FG.y + 4.1), { id: 'forge', label: 'La forja' }),
    Object.assign(P(IN.x + 4, IN.y + 4.1), { id: 'inn', label: 'La posada' }), Object.assign(P(GY.x + 7, GY.y - 0.4), { id: 'gym', label: 'El patio de armas' }),
    Object.assign(P(cx + 8, 12.7), { id: 'board', label: 'El tablón de encargos' }));
  OUT.plaza = PL;
  return [cx, 14];
}
let ROOM_FORCE = null;   // solo para pruebas
const ROOM_KINDS = Object.keys(ROOM_GEN).filter(k => !['arena', 'aldea', 'pradera', 'aldea_ext', 'plaza', 'hall', 'forgeroom', 'innroom', 'campamento'].includes(k));

// Monta una sala. Devuelve { w, h, walls, start, kind }.
function buildRoom(boss, kindF, sizeF) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const kind = boss ? 'arena' : kindF && attempt < 8 ? kindF : ROOM_FORCE && attempt < 6 ? ROOM_FORCE : attempt > 8 ? 'columnas' : ROOM_KINDS[Math.floor(Math.random() * ROOM_KINDS.length)];
    const [c, r] = ROOM_SIZES[boss ? 'boss' : sizeF || ['small', 'mid', 'mid', 'big'][ri(0, 3)]];
    const g = Array.from({ length: r }, () => new Array(c).fill(0));
    OUT = null;
    const [sx, sy] = ROOM_GEN[kind](g, c, r), out = OUT;
    for (let j = sy - 1; j <= sy + 1; j++) for (let i = sx - 1; i <= sx + 1; i++) if (g[j] && i >= 0 && i < c) g[j][i] = 0;   // el punto de entrada, despejado
    const solids = [];   // mazmorras: obstáculos sueltos de una casilla (ataúdes, setas, pilares...) que tapan el paso y los disparos
    if (!out) for (let i = 0, t = 0; i < (boss ? 0 : Math.round(c * r / 420)) && t < 200; t++) {
      const x = ri(3, c - 4), y = ri(3, r - 4);
      if (Math.hypot(x - sx, y - sy) < 4 || !areaFree(g, x - 2, y - 2, 5, 5)) continue;
      g[y][x] = 1; solids.push({ x, y }); i++;
    }
    // Alcance desde la entrada: lo que no se pueda pisar pasa a ser muro, para que no queden bolsas inaccesibles
    const seen = Array.from({ length: r }, () => new Array(c).fill(0)), q = [[sx, sy]]; seen[sy][sx] = 1; let open = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= c || ny >= r || g[ny][nx] || seen[ny][nx]) continue; seen[ny][nx] = 1; open++; q.push([nx, ny]); } }
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (!seen[y][x] && !g[y][x]) g[y][x] = 1;
    if (open < c * r * (out ? 0.3 : 0.55)) continue;                 // demasiado cerrada: otra
    // Fundir casillas de muro en rectángulos: tiras horizontales que se alargan hacia abajo si coinciden
    const merge = v => {
      const list = [], used = Array.from({ length: r }, () => new Array(c).fill(0));
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
        if (g[y][x] !== v || used[y][x]) continue;
        let w = 1; while (x + w < c && g[y][x + w] === v && !used[y][x + w]) w++;
        let h = 1; outer: while (y + h < r) { for (let i = x; i < x + w; i++) if (g[y + h][i] !== v || used[y + h][i]) break outer; h++; }
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) used[j][i] = 1;
        list.push({ x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL });
      }
      return list;
    };
    const walls = merge(1), pools = merge(2);
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
    return { traps: out ? [] : traps.filter(t => !solids.some(q => q.x * CELL >= t.x - CELL && q.x * CELL < t.x + t.w + CELL && q.y * CELL >= t.y - CELL && q.y * CELL < t.y + t.h + CELL)), solids, pools, out, w: c * CELL, h: r * CELL, walls, start: { x: (sx + 0.5) * CELL, y: (sy + 0.5) * CELL }, kind };
  }
}
// ¿Se puede estar de pie aquí? (ni muro ni agua)
const isBlockedAt = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx < 0 || cy < 0 || cx >= NAV.cols || cy >= NAV.rows || NAV.wall[cy * NAV.cols + cx] !== 0; };
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
  if (!isBlockedAt(x, y)) return { x, y };
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let rad = 1; rad < 8; rad++) for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
    if (i < 0 || j < 0 || i >= NAV.cols || j >= NAV.rows || NAV.wall[j * NAV.cols + i]) continue;
    return { x: (i + 0.5) * CELL, y: (j + 0.5) * CELL };
  }
  return { x: T.room.w / 2, y: T.room.h / 2 };
}

// Hasta dónde llega un rayo antes de chocar con un muro
function rayClip(x, y, ux, uy, len, rects) {
  let best = len;
  for (const w of rects || S.walls) {
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
  const list = S.solids && !(o.type && o.type.fly) ? S.solids : S.walls;   // el agua corta el paso a quien va a pie
  for (let pass = 0; pass < 2; pass++) for (const w of list) {
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
  const wet = S.pools && S.pools.length && !e.type.fly;
  const clear = (ox, oy) => rayClip(e.x + ox, e.y + oy, ux, uy, d) >= d - 0.01 && (!wet || rayClip(e.x + ox, e.y + oy, ux, uy, d, S.pools) >= d - 0.01);
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
