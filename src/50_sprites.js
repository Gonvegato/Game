// ───────────────────────── Sprites (pixel art dibujado por código) ─────────────────────────
// Todo se dibuja a tamaño real: 1 píxel del sprite = 1 unidad de mundo. Las figuras miran a la derecha y se voltean.
// Las pequeñas son rejillas de texto (cada letra, un color). Las grandes se pintan con formas y sombreado automático.
function tone(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); }

// Paleta común: materiales de un mundo medieval oscuro
const PAL = {
  o: '#16101a', k: '#0b080d',
  s: '#dba274', S: '#a8683f',          // piel
  b: '#8f5d36', B: '#5a3822',          // cuero y madera
  i: '#a3adb8', I: '#5d6673', w: '#eef3f6',   // acero
  n: '#e6dfc6', N: '#a39c84',          // hueso
  r: '#b8382e', R: '#74201f',          // rojo
  g: '#e9c46a', G: '#a8762c',          // oro y latón
  v: '#7d9a4a', V: '#48622f',          // piel verde
  t: '#d9d2c0', T: '#8f8a7c',          // lino
  p: '#6b4a8a', P: '#3d2a55',          // túnica
  f: '#ff9a3c', F: '#ffe08a',          // fuego
};
const ART = {
  // El protagonista: pelo de ceniza, un ojo encendido, bufanda roja al viento y abrigo largo con ribete de brasa.
  // El martillo de forja asoma a la espalda.
  player: { pal: { g: '#ff8a3c', h: '#eef2f5', H: '#a9b4c0', c: '#3b4160', C: '#242840', x: '#565d85', e: '#ffb347', m: '#6b7380' }, legs: 4, rows: [
    '.......oooooo.......',
    '.....oohhhhhhoo.....',
    '....ohhhhhhhhhho....',
    '.om.ohHhhhhhhhhho...',
    'ommoohHHhhhHhhhho...',
    'ommoohHHHssHHhho....',
    '.obooHHsssssHso.....',
    '..oboHsskssesso.....',
    '..oboosssssssso.....',
    'orrrorrrrrrrroo.....',
    'oRrrrrRRrrrrro......',
    '.oooRoxccccccxoo....',
    '...ooxccgccccxsso...',
    '....occcgcccCooo....',
    '....occcgcccCo......',
    '....occcgccCCo......',
    '...oxcccgccCCCo.....',
    '...occcggcCCCCo.....',
    '...oCcCooCCCCCo.....',
    '....oooIIoIIooo.....',
    '.....oIIooIIo.......',
    '.....oIIooIIo.......',
    '....oBBBooBBBo......',
    '....oooo..oooo......' ],
    alt: [
    '.....oIIooIIo.......',
    '....oBBBooIIo.......',
    '....oooo.oBBBo......',
    '.........oooo.......' ] },
  // Necrófago: cadáver encorvado de piel cenicienta, harapos y garras
  stalker: { pal: { c: '#8fa58c', C: '#56705a', e: '#ffe08a', h: '#6e2f3a', H: '#431c26' }, legs: 3, rows: [
    '.....ooooo....',
    '....occcccco..',
    '...occcccccco.',
    '...occeccecco.',
    '...oCcckkcco..',
    '....oCcnnco...',
    '..ooohhhhoo...',
    '.occohhhHocco.',
    '.ocoohhhHooco.',
    '.oco.ohHHo.oco',
    '.oCo.ohhHo.oCo',
    '.ono.oHHHo.ono',
    '.o.o.ohoHo.o.o',
    '....oCooCo....',
    '....oCooCo....',
    '...oCCooCCo...',
    '...ooo..ooo...' ],
    alt: [
    '....oCooCo....',
    '...oCCo.oCo...',
    '...ooo.oCCo...' ] },
  // Trasgo: pequeño, orejas enormes, ojos rojos y un cuchillo
  runner: { pal: { e: '#ff5a4a' }, legs: 2, rows: [
    'oo..ooooo..oo.',
    'ovoovvvvvoovo.',
    '.ovvvvvvvvvo..',
    '..ovevvvevo...',
    '..ovvvkvvvo...',
    '...ovnvnvo....',
    '..oobbbbboo.o.',
    '.ovobbBbbovowo',
    '.ovobbBbbovoio',
    '..oobBBBboo.o.',
    '...oVooVo.....',
    '..oVVo.oVVo...',
    '..ooo..ooo....' ],
    alt: [
    '...oVo.oVVo...',
    '..ooo...ooo...' ] },
  // Cultista: túnica con capucha, dos ojos en la sombra y un báculo con una brasa arcana
  mage: { pal: { e: '#d7b8ff', E: '#b68cff' }, legs: 2, rows: [
    '.....oooo....oo.',
    '....oppppo..oEEo',
    '...oppppppo.oEeo',
    '...opPPPPpo..oo.',
    '...opkekeko..ob.',
    '...opPkkPpo..ob.',
    '..ooppPPppoo.ob.',
    '.oppppPppppsoob.',
    '.opppPPpppoo.ob.',
    '.opppPgpppo..ob.',
    '.oPppPPpppo..ob.',
    '..oppPPpppo..ob.',
    '..oppPPppPo..ob.',
    '..opppPpppo..ob.',
    '.oppppPppppo.o..',
    '.opPppPpppPo....',
    '.oPPPPPPPPPo....',
    '..ooooooooo.....' ],
    alt: [
    '.opPppPpppPo....',
    '..oPPPPPPPo.....' ] },
  // Alquimista: máscara de pico, sombrero de ala ancha y un frasco que brilla
  bomber: { pal: { c: '#4a4250', C: '#2c2630', m: '#d9d2c0', M: '#8f8a7c' }, legs: 3, rows: [
    '....oooooo.....',
    '...oCCCCCCo....',
    '...oCccccCo....',
    '.ooooooooooo...',
    '.occccccccco...',
    '..oooooooooo...',
    '...ommkmmmmoo..',
    '...ommmmmMMMMo.',
    '...oMmmmooooo..',
    '..oooccccoo.ooo',
    '.occocccCocoFfo',
    '.ocoocgcCoosfFo',
    '.oso.ocCCo.offo',
    '..o..occCo..oo.',
    '....occcCCo....',
    '....occoCCo....',
    '....oCooCo.....',
    '...oBBooBBo....',
    '...ooo..ooo....' ],
    alt: [
    '....oCooCo.....',
    '...oBBo.oBo....',
    '...ooo.ooo.....' ] },
  // Ballestero esqueleto: capucha raída, costillas y una ballesta
  sniper: { pal: { c: '#6a3140', C: '#431c26', e: '#ff5d7a' }, legs: 3, rows: [
    '....ooooo......',
    '...occccco.....',
    '..occnnnnco....',
    '..ocnennenoo...',
    '..oCnnkknnco...',
    '...onnnnnoCo...',
    '....onNno.o..o.',
    '..oooNNNoo..obo',
    '.onnonNnoooooIo',
    '.oNoonnnonnbbbo',
    '..o.oNnNooooIo.',
    '....onNno...obo',
    '....oNNNo....o.',
    '....onono......',
    '....onono......',
    '...onNoNno.....',
    '...ooo.ooo.....' ],
    alt: [
    '....onono......',
    '...onNo.ono....',
    '...ooo.oNno....' ] },
  // Chamán: máscara de calavera con cuernos, plumas y un bastón con cascabeles
  shaman: { pal: { c: '#3f8f86', C: '#255a57', e: '#8ff5e2' }, legs: 2, rows: [
    '.o......o.......',
    'ono....ono...o..',
    'onNo..oNno..oeo.',
    '.onNooNno...oeo.',
    '..onnnnno...obo.',
    '..onennenoo..b..',
    '..onnkknno...b..',
    '..oNnnnnNo..ob..',
    '.oorcccgroo.ob..',
    'ovocccccCovsob..',
    'ovocrccCCoo.ob..',
    '.oocccgCCo..ob..',
    '..occcCcCo..ob..',
    '..ocCccCCo..ob..',
    '.occcCccCCo.o...',
    '.oCCCCCCCCo.....',
    '..ooVooVoo......',
    '..oVVooVVo......',
    '..ooo..ooo......' ],
    alt: [
    '..ooVo.oVo......',
    '..oVVo.oVVo.....' ] },
  // El elegido: yelmo cerrado con penacho y tabardo del color de su deidad (m, l)
  champ: { pal: {}, legs: 4, rows: [
    '.......omm.......',
    '....oooomlmo.....',
    '...oiiiiomlmo....',
    '..oiiiwiiomm.....',
    '..oiIIIIIiooo....',
    '..oikkIkkio......',
    '..oiiiIiiio......',
    '..oIiiIiiIo......',
    '.ooooIIIoooo.....',
    'oiiiommmmoiiio...',
    'oiwiomllmoiIio...',
    'oIiIomlmmoIIio...',
    '.oioommmmooio....',
    '.oioGGGGGGoio....',
    '.oso.mmmmo.oso...',
    '..o.ommmmmo.o....',
    '....omMoMmo......',
    '....oiIoIio......',
    '....oiIoIio......',
    '...oIIooIIIo.....',
    '...ooo..oooo.....' ],
    alt: [
    '....oiIoIio......',
    '...oIIo.oiIo.....',
    '...ooo..oIIIo....',
    '........oooo.....' ] },
  // Lancero: esqueleto con capacete y una lanza larga por delante
  lancer: { pal: { e: '#ff5d7a' }, legs: 3, rows: [
    '....ooooo...........',
    '...oiiiiio..........',
    '..oiiwiiiio.........',
    '..oIIIIIIIo.........',
    '..onennenoo.........',
    '..onnkknno..........',
    '...onnnno...........',
    '..ooNNNNooo.......o.',
    '.onnnNnNnnnoooooooio',
    '.onoonnnobbbbbbbbiiw',
    '.oNoonNnooooooooooio',
    '..o.onnno.........o.',
    '....oNNNo...........',
    '....onono...........',
    '....onono...........',
    '...onNoNno..........',
    '...ooo.ooo..........' ],
    alt: [
    '....onono...........',
    '...onNo.ono.........',
    '...ooo.oNno.........' ] },
  // Murciélago: visto desde arriba, con las alas abiertas o recogidas
  bat: { pal: { c: '#6a4f86', C: '#3f2d55', e: '#ff5a4a' }, legs: 7, rows: [
    '.o....o..o....o.',
    'oco..oCooCo..oco',
    'occooCcccccooCco',
    'ocCCcceccecCCcco',
    '.ocCCccccccCCco.',
    '..oooCccccCooo..',
    '.....oCooCo.....' ],
    alt: [
    '................',
    '.....o.oo.o.....',
    '..oooCooooCooo..',
    '.occCceccecCcco.',
    'occCCccccccCCcco',
    'ocooooCccCooooco',
    '.o....oooo....o.' ] },
  // Sombra alzada: la silueta de quien cayó, con dos ojos encendidos
  shade: { pal: { c: '#8e7bd0', C: '#4f4288', e: '#ffffff' }, legs: 0, rows: [
    '....oooo....',
    '...occcco...',
    '..occcccco..',
    '..oceccco..',
    '..occccCo...',
    '.ooccccCoo..',
    'occcccccCCo.',
    'occcccccCCo.',
    'ocCccccCCco.',
    '.occcccCCo..',
    '.occcCcCCo..',
    '..occCcCo...',
    '..oCcoCCo...',
    '...oCo.oCo..',
    '....o...o...' ] },
};
ART.shade.rows[3] = '..oceccceo..';

// ── Pintor de figuras grandes: formas con rampa de tres tonos, luz desde arriba a la izquierda y contorno automático ──
function Painter(w, h) {
  const g = Array.from({ length: h }, () => new Array(w).fill(null));
  const ramp = c => Array.isArray(c) ? c : [tone(c, -0.42), c, tone(c, 0.38)];
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  const P = {
    g, w, h, put,
    // elipse sombreada
    e(cx, cy, rx, ry, col) {
      const [d, m, l] = ramp(col);
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry, q = nx * nx + ny * ny;
        if (q > 1) continue;
        const sh = nx * 0.55 + ny * 0.85;
        put(x, y, q > 0.72 && sh > 0.15 ? d : sh > 0.5 ? d : sh < -0.45 ? l : m);
      }
      return P;
    },
    // rectángulo sombreado: luz arriba y a la izquierda, sombra abajo y a la derecha
    r(x0, y0, rw, rh, col) {
      const [d, m, l] = ramp(col);
      for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) put(x, y, y === y0 || (x === x0 && rw > 2) ? l : y === y0 + rh - 1 || (x === x0 + rw - 1 && rw > 2) ? d : m);
      return P;
    },
    // línea gruesa de un tono
    l(x0, y0, x1, y1, col, th = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) put(x + a, y + b, col); }
      return P;
    },
    // triángulo relleno (puntas, cuernos, cristales): luz en la mitad izquierda
    t(x0, y0, x1, y1, x2, y2, col) {
      const [d, m, l] = ramp(col), minX = Math.floor(Math.min(x0, x1, x2)), maxX = Math.ceil(Math.max(x0, x1, x2)), minY = Math.floor(Math.min(y0, y1, y2)), maxY = Math.ceil(Math.max(y0, y1, y2));
      const s = (ax, ay, bx, by, px, py) => (px - ax) * (by - ay) - (py - ay) * (bx - ax), cxm = (x0 + x1 + x2) / 3;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const a = s(x0, y0, x1, y1, x, y), b = s(x1, y1, x2, y2, x, y), c = s(x2, y2, x0, y0, x, y);
        if ((a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0)) put(x, y, x < cxm - 0.5 ? l : x > cxm + 0.8 ? d : m);
      }
      return P;
    },
    // refleja la mitad izquierda sobre la derecha
    mirror() { for (let y = 0; y < h; y++) for (let x = 0; x < w >> 1; x++) g[y][w - 1 - x] = g[y][x]; return P; },
    // contorno oscuro alrededor de todo lo pintado
    outline(col = PAL.o) {
      const add = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== col)) add.push([x, y]);
      for (const [x, y] of add) g[y][x] = col;
      return P;
    },
  };
  return P;
}
const gridOf = (rows, pal) => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => [...r.padEnd(w, '.')].map(ch => pal[ch] || null)); };
function mkSprite(grid) {
  const h = grid.length, w = grid[0].length, c = document.createElement('canvas'), f = document.createElement('canvas');
  c.width = f.width = w; c.height = f.height = h;
  const g = c.getContext('2d');
  grid.forEach((r, y) => r.forEach((col, x) => { if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }));
  const fg = f.getContext('2d'); fg.drawImage(c, 0, 0); fg.globalCompositeOperation = 'source-in'; fg.fillStyle = '#ffffff'; fg.fillRect(0, 0, w, h);   // en blanco, para el destello al recibir un golpe
  return { c, f, w, h };
}
// De una ficha de ART salen dos fotogramas: de pie y con el paso cambiado
function mkArt(a, extra) {
  const pal = Object.assign({}, PAL, a.pal, extra || {}), A = mkSprite(gridOf(a.rows, pal));
  if (a.alt) { const rows = a.rows.slice(0, a.rows.length - a.alt.length).concat(a.alt); A.b = mkSprite(gridOf(rows.map(r => r.padEnd(a.rows[0].length, '.')), pal)); }
  return A;
}

// ── Figuras grandes ──
const BIG = {
  // Ogro: mole de piel parda con colmillos, taparrabos y un garrote con clavos
  brute() {
    const P = Painter(34, 34), skin = ['#5d6b3a', '#8a9a55', '#b3c078'], hide = ['#4a2f1e', '#75492c', '#9a6a42'], wood = ['#3d2718', '#6b4428', '#8f6238'];
    P.e(8, 30, 4, 2.5, skin).e(19, 30, 4, 2.5, skin);                       // pies
    P.r(6, 23, 5, 6, skin).r(17, 23, 5, 6, skin);                           // piernas
    P.e(13.5, 17, 9.5, 8, skin);                                            // tronco
    P.r(6, 20, 16, 5, hide); P.l(8, 25, 10, 27, hide[1], 2); P.l(17, 25, 19, 27, hide[1], 2);   // taparrabos
    P.e(4, 14, 3.6, 4.2, skin).e(23, 14, 3.6, 4.2, skin);                   // hombros
    P.r(1, 16, 5, 8, skin).e(3.5, 25, 3, 3, skin);                          // brazo izquierdo y puño
    P.r(22, 15, 5, 6, skin).e(26, 21, 3, 3, skin);                          // brazo derecho, adelantado
    P.e(13.5, 8, 6, 5.5, skin);                                             // cabeza
    P.r(9, 6, 9, 2, [skin[0], skin[0], skin[0]]);                           // ceño
    P.put(10, 7, '#ffe08a'); P.put(16, 7, '#ffe08a');                       // ojos
    P.r(10, 10, 7, 2, ['#2a1a14', '#2a1a14', '#2a1a14']); P.put(10, 9, PAL.n); P.put(16, 9, PAL.n); P.put(10, 10, PAL.n); P.put(16, 10, PAL.n);   // boca y colmillos
    P.l(25, 22, 31, 6, wood[1], 3); P.e(31, 6, 2.6, 4, wood);               // garrote
    P.put(29, 4, PAL.w); P.put(33, 7, PAL.w); P.put(31, 2, PAL.w); P.put(29, 9, PAL.i);
    return P.outline().g;
  },
  // Araña: vista desde arriba, patas largas y una marca en el lomo
  leaper() {
    const P = Painter(20, 16), body = ['#2a2330', '#463a52', '#6a5a7a'], mark = '#9bd36b';
    for (const [x0, y0, x1, y1, x2, y2] of [[7, 6, 3, 2, 1, 5], [7, 7, 2, 6, 0, 9], [7, 9, 3, 11, 1, 14], [8, 10, 5, 13, 5, 15]]) { P.l(x0, y0, x1, y1, body[1]); P.l(x1, y1, x2, y2, body[1]); }
    P.mirror();
    P.e(9.5, 10, 4, 4.4, body); P.e(9.5, 5, 2.8, 2.6, body);
    P.put(9, 9, mark); P.put(10, 9, mark); P.put(9, 11, mark); P.put(10, 11, mark); P.put(8, 10, mark); P.put(11, 10, mark);
    P.put(8, 4, '#ff5a4a'); P.put(11, 4, '#ff5a4a'); P.put(9, 3, '#ff5a4a'); P.put(10, 3, '#ff5a4a');
    P.put(8, 2, PAL.n); P.put(11, 2, PAL.n);
    return P.outline().g;
  },
  // El Guardián: armadura animada con cuernos, una rendija encendida y un mandoble a cada lado
  guardian() {
    const P = Painter(56, 60), st = ['#4a4a5c', '#77788c', '#b4b6c6'], dk = ['#2b2a38', '#45455a', '#6a6b82'], cl = ['#5c1f2c', '#8a3a55', '#b85a78'], gold = ['#8a5a1e', '#d49a3a', '#ffd98a'];
    P.r(17, 46, 8, 10, dk).r(14, 54, 12, 4, st);                            // pierna y escarpe
    P.t(12, 30, 28, 30, 20, 52, cl);                                        // faldón
    P.e(27.5, 31, 13, 13, st);                                              // peto (se completa al reflejar)
    P.r(22, 38, 6, 3, gold);                                                // cinturón
    P.e(10, 24, 9, 7.5, st).r(4, 22, 12, 2, gold);                          // hombrera
    P.r(5, 30, 8, 12, dk).e(9, 44, 4.5, 4.5, st);                           // brazo y guantelete
    P.r(8, 36, 2, 22, ['#8e96a3', '#cfd6de', '#ffffff']); P.r(5, 46, 8, 2, gold);   // mandoble apoyado en el suelo
    P.e(27.5, 13, 9, 9.5, st);                                              // yelmo
    P.t(19, 9, 21, 3, 11, 0, PAL.n);                                        // cuerno
    P.mirror();
    P.r(22, 12, 12, 2, ['#1a0c08', '#1a0c08', '#1a0c08']); for (let x = 23; x < 33; x += 2) P.put(x, 12, '#ff9a3c'); P.put(27, 13, '#ffe08a'); P.put(28, 13, '#ffe08a');
    P.r(27, 15, 2, 7, dk); P.r(24, 27, 8, 8, cl); P.put(27, 29, gold[2]); P.put(28, 29, gold[2]); P.put(27, 30, gold[1]); P.put(28, 30, gold[1]); P.put(26, 31, gold[1]); P.put(29, 31, gold[1]);
    return P.outline().g;
  },
  // La Matriarca del Nido: araña enorme vista desde arriba, vientre hinchado con calavera pintada
  matriarch() {
    const P = Painter(60, 52), body = ['#2e3a22', '#4f6b34', '#7f9c4c'], leg = ['#1f2618', '#38482a', '#5a7040'], belly = ['#5a2a3a', '#8a3f52', '#c0607a'];
    for (const [x0, y0, x1, y1, x2, y2] of [[22, 20, 10, 8, 4, 16], [21, 23, 7, 18, 1, 28], [21, 27, 6, 30, 2, 42], [23, 30, 12, 40, 10, 50]]) { P.l(x0, y0, x1, y1, leg[1], 2); P.l(x1, y1, x2, y2, leg[1], 2); P.l(x1, y1, x1, y1, leg[2], 2); }
    P.e(29.5, 34, 13, 14, body);                                            // vientre
    P.e(29.5, 17, 9, 8, body);                                              // tórax
    P.t(24, 9, 27, 9, 24, 3, PAL.n);                                        // colmillo
    P.mirror();
    P.t(25, 28, 34, 28, 29.5, 35, belly); P.t(25, 42, 34, 42, 29.5, 35, belly);   // reloj de arena en el lomo
    for (const [x, y] of [[26, 13], [33, 13], [28, 11], [31, 11], [24, 16], [35, 16]]) { P.put(x, y, '#ff5a4a'); }
    P.put(29, 14, '#ffe08a'); P.put(30, 14, '#ffe08a');
    return P.outline().g;
  },
  // El Coloso de Cristal: gólem de roca con cristales en los hombros y un núcleo encendido
  colossus() {
    const P = Painter(66, 66), rk = ['#3a4252', '#5d6a80', '#8e9db5'], rk2 = ['#2a303d', '#465063', '#6a7890'], cr = ['#2e8fa3', '#62d8ec', '#d6faff'];
    P.r(20, 50, 11, 12, rk2).r(17, 60, 15, 4, rk);                          // pierna y pie
    P.e(32.5, 36, 16, 15, rk);                                              // torso
    P.e(12, 27, 10, 9, rk);                                                 // hombro
    P.t(4, 22, 10, 21, 5, 6, cr).t(10, 21, 16, 19, 14, 9, cr).t(15, 20, 20, 20, 20, 13, cr);   // cristales
    P.r(4, 33, 11, 14, rk2).e(9, 51, 7, 6.5, rk);                           // brazo y puño
    P.e(32.5, 16, 8, 7.5, rk);                                              // cabeza
    P.mirror();
    P.r(27, 15, 12, 2, ['#0e1420', '#0e1420', '#0e1420']); P.put(29, 15, cr[2]); P.put(30, 15, cr[1]); P.put(35, 15, cr[2]); P.put(36, 15, cr[1]);
    P.t(32.5, 28, 26, 36, 32.5, 46, cr); P.t(32.5, 28, 39, 36, 32.5, 46, [cr[0], cr[0], cr[1]]);   // núcleo
    P.l(22, 30, 26, 33, rk[0]); P.l(43, 30, 39, 33, rk[0]); P.l(24, 44, 28, 47, rk[0]); P.l(41, 44, 37, 47, rk[0]);   // grietas
    return P.outline().g;
  },
  // El Sin Nombre: rey sin rostro, corona de hierro, manto raído y manos de hueso
  nameless() {
    const P = Painter(54, 62), robe = ['#221a30', '#3b2f52', '#5c4c7c'], trim = ['#7a6a9c', '#b8a8d8', '#e8e0f8'], iron = ['#3a3a48', '#6a6a7c', '#a8a8ba'];
    P.t(8, 60, 27, 20, 27, 60, robe); P.t(12, 30, 27, 20, 20, 58, robe);    // manto
    for (let x = 9; x < 27; x += 4) P.t(x, 57, x + 3, 57, x + 1.5, 61, robe);   // jirones
    P.e(27, 30, 11, 12, robe);                                              // pecho
    P.e(14, 26, 7, 5, robe).r(8, 28, 7, 13, robe);                          // hombro y manga
    P.r(9, 41, 5, 3, trim); for (const x of [8, 10, 12, 14]) P.l(x, 44, x - 1, 48, PAL.n);   // mano de hueso
    P.e(27, 13, 8.5, 9, robe);                                              // capucha
    P.r(19, 5, 8, 3, iron); P.t(19, 5, 21, 5, 20, 0, iron); P.t(23, 5, 25, 5, 24, 1, iron);   // corona
    P.mirror();
    P.t(26, 5, 28, 5, 27, -1, iron);
    P.e(27, 15, 5, 6, ['#07050a', '#07050a', '#07050a']); P.put(25, 14, '#ffffff'); P.put(29, 14, '#ffffff'); P.put(25, 15, trim[1]); P.put(29, 15, trim[1]);
    P.r(26, 22, 2, 30, trim); P.r(24, 26, 6, 2, trim);                      // estola
    return P.outline().g;
  },
};

// El arma en la mano: mira a la derecha, con la empuñadura a la izquierda. Se dibuja girada hacia donde apuntas.
const GUNART = {
  b_long:    ['......ooooooooooooo', 'oooooooiiiiiiiiiiwo', 'obbbbbgIIIIIIIIIIIo', 'oBbbBooooooooooooo.', '.oBBo..............', '..oo...............'],
  b_short:   ['....oooooooo', 'ooooiiiiiiwo', 'obbgIIIIIIIo', 'oBbBoooooooo', 'oBBo........', '.oo.........'],
  b_scatter: ['.............ooo', '......oooooooiwo', 'oooooooiiiiiiiIo', 'obbbbbgIIIIIIIIo', 'oBbbBooooooooIIo', '.oBBo........ooo', '..oo............'],
  b_pierce:  ['.......ooooooooooooooo', 'ooooooogiiigiiiigiiiwo', 'obbbbbBgIIIgIIIIgIIIIo', 'oBbbBooooooooooooooooo', '.oBBo.................', '..oo..................'],
  b_bomb:    ['.....ooooooooo.', 'oooooIiiiiiiiwo', 'obbbbIgiiiigiko', 'oBbbBIgIIIIgIko', '.oBBoIIIIIIIIIo', '..oo.ooooooooo.'],
  b_spike:   ['......................oo..', 'ooooooooooooooooooooooiwo.', 'obBbbbbbbbBbbbbbbbbrriiiwo', 'ooooooooooooooooooooooiIo.', '......................oo..'],
  a_draw:    ['........oo.....', '.......onno....', '......ob.ono...', 'oooooooboooIo..', 'obbbbbbbbbbbbwo', 'oBBooooboooIo..', '.oo...ob.ono...', '.......onno....', '........oo.....'],
  a_rotary:  ['......oooooooooooo', 'ooooooiiiiiiiiiiwo', 'obbbbgIIIIIIIIIIIo', 'oBbbBgiiiiiiiiiiwo', '.oBBogIIIIIIIIIIIo', '..oo.ooooooooooooo'],
};
const SPR = { champ: {}, gun: {} };
for (const k of Object.keys(GUNART)) SPR.gun[k] = mkSprite(gridOf(GUNART[k], PAL));
for (const k of Object.keys(ART)) if (k !== 'champ') SPR[k] = mkArt(ART[k]);
for (const k of Object.keys(BIG)) SPR[k] = mkSprite(BIG[k]());
for (const g of GOD_KEYS) SPR.champ[g] = mkArt(ART.champ, { m: GODS[g].color, M: tone(GODS[g].color, -0.4), l: tone(GODS[g].color, 0.5) });

// Dibuja un sprite con los pies en (x, yFeet). flip: mirando a la izquierda. step: fotograma del paso.
function drawSprite(sp, x, yFeet, flip, flash, step) {
  const im = flash ? sp.f : step && sp.b ? sp.b.c : sp.c, dx = Math.round(x - sp.w / 2), dy = Math.round(yFeet - sp.h);
  if (flip) { ctx.save(); ctx.translate(dx + sp.w, dy); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); }
  else ctx.drawImage(im, dx, dy);
}
// El arma: girada hacia donde apuntas, con la culata en la mano. Hacia la izquierda se voltea para no quedar boca abajo.
function drawGun(x, y, ang, kick) {
  const g = S.gun, sp = SPR.gun[g.barrel === 'b_spike' ? 'b_spike' : g.action === 'a_draw' ? 'a_draw' : g.action === 'a_rotary' ? 'a_rotary' : g.barrel] || SPR.gun.b_long, left = Math.cos(ang) < 0;
  const one = (ox, oy) => { ctx.save(); ctx.translate(Math.round(x + ox), Math.round(y + oy)); ctx.rotate(ang); if (left) ctx.scale(1, -1); ctx.drawImage(sp.c, -3 - kick, -Math.floor(sp.h / 2)); ctx.restore(); };
  if (g.barrel === 'b_twin') { const nx = -Math.sin(ang) * 4, ny = Math.cos(ang) * 4; one(nx, ny); one(-nx, -ny); } else one(0, 0);
}
