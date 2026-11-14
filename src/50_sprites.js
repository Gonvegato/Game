// ───────────────────────── Sprites (pixel art dibujado por código) ─────────────────────────
// Cada sprite es media figura en texto; se refleja para que quede simétrica. Las letras son colores de su paleta:
// o contorno, m color principal, d sombra, l luz, w blanco de ojo, k negro. Lo demás, propio de cada uno.
const HALF = {
  player:  ['....ooo', '...ohhh', '..ohhhh', '..ohsss', '..ohsks', '..ohsss', '..oobbb', '.oaabbb', 'oaaaabb', 'osaaaaa', 'osaalla', '.oaaaaa', '..oaaaa', '..okkok', '..okk.o', '..ooo..'],
  stalker: ['....oo', '..oomm', '.ommmm', '.omwkm', 'ommmmm', 'ommddm', 'ommmmd', '.ommmd', '.ommmm', '..omdo', '..omo.', '..oo..'],
  runner:  ['..o..', '.olo.', '.ommo', 'ommmm', 'omwkm', 'ommmd', '.ommm', '..omo', '..oo.'],
  brute:   ['....oooo', '...odddd', '..oddmmm', '.odmwkmm', '.odmmmmm', 'oodmmddd', 'ommodmmm', 'ommmoddd', 'ommmomll', 'olmmomll', '.oomomll', '..oodmmm', '...odmmm', '...odmod', '...ommo.', '...oooo.'],
  mage:    ['....oo', '...odd', '..oddd', '.odddm', '.oddkw', '.odddm', '..oddd', '.ommmm', 'ommlmm', 'ommmmm', 'ommmmm', '.ommmm', '.odmmd', '..oooo'],
  bomber:  ['....ol', '...ool', '..oomm', '.ommmm', 'ommlmm', 'omlmmm', 'ommmwk', 'ommmmm', '.ommmd', '..omdd', '...ooo'],
  leaper:  ['..oo...', '.owko..', '.ommmoo', 'ommmmmm', 'ommmmmd', 'ommlmmm', '.ommmmm', 'oomdmmo', 'omo.oo.', 'oo.....'],
  sniper:  ['....oo', '...omm', '..ommm', '..omkw', '..ommm', '...omm', '..odmm', '.odmmm', '.odmlm', '.odmmm', '..odmm', '..omdm', '..omo.', '..oo..'],
  shaman:  ['.l..o.', '.lo.ol', '..oomm', '.ommmm', '.omwwm', '.omkwm', '.ommmm', '..omdd', '.ommmm', 'ommlmm', 'ommmmm', '.ommmm', '.omdmo', '..oo..'],
  champ:   ['....omm', '...ommm', '..ooaaa', '.oaaaaa', '.oakkka', '.oaaaaa', '..oaaaa', '.oommmm', 'oammmmm', 'oamalma', 'oammmmm', '.oaaaaa', '..oammm', '..oaaoa', '..oao.o', '..ooo..'],
  shade:   ['...oo', '..omm', '.ommm', '.omwm', '.ommm', 'ommmm', 'ommmm', 'ommmd', 'ommmm', 'omdmm', 'omoom', 'oo..o'],
  guardian:  ['......ooooo', '.....oddddd', '....oddmmmm', '...oddmmmmm', '...odmmwkmm', '...odmmmmmm', '..oodmmdddd', '.ommodmmmmm', 'ommmmoddddd', 'ommmmomllll', 'ommdmomlrrl', 'ommdmomlrrl', 'ommmmomllll', '.ommmodmmmm', '.oommodmmmm', '..oo.odmmmd', '.....odmmdo', '.....odmmo.', '.....ommmo.', '....ommmmo.', '....ooooo..'],
  matriarch: ['...o.......', '..omo...ooo', '..omo..ommm', '...omoommmm', '....ommmwkm', '..ooommmmmm', '.ommmmmmddd', 'ommoommmmmm', 'oo..omllmmm', '...oomllmmm', '..ommmmmmmm', '.ommoommmmd', '.oo..ommddd', '....oommmmm', '...ommoommm', '..omo..oomm', '..oo.....oo'],
  colossus:  ['.....o.....', '....olo...o', '....olo..ol', '...olmo.olm', '...olmooolm', '..olmmmmmmm', '..olmmwkmmm', '.olmmmmmmmm', '.olmmddddmm', 'olmmmmmmmmm', 'olmmlllmmmm', 'olmmlllmmmd', '.olmmmmmmdd', '.oldmmmmddd', '..odmmoddmm', '..odmo.odmm', '..omo...omm', '..oo....ooo'],
  nameless:  ['......ooooo', '.....ommmmm', '....ommmmmm', '....omddddd', '....omdkwkd', '....omddddd', '...oommmmmm', '..ommmmmmmm', '.ommmlmmmmm', '.ommmlmmmmm', 'ommmmmmmmmm', 'ommmmmmmmmd', 'ommdmmmmmdd', '.omdmmmmmmm', '.ommmmdmmmm', '..ommmdmmdm', '..omomdmodm', '..oo.oo.ooo'],
};
// Aclarar u oscurecer un color #rrggbb
function tone(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); }
function mkSprite(half, pal) {
  const hw = Math.max(...half.map(r => r.length)), rows = half.map(r => { const a = r.padEnd(hw, '.'); return a + [...a].reverse().join(''); });
  const w = hw * 2, h = rows.length, c = document.createElement('canvas'), f = document.createElement('canvas');
  c.width = f.width = w; c.height = f.height = h;
  const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
  const fg = f.getContext('2d'); fg.drawImage(c, 0, 0); fg.globalCompositeOperation = 'source-in'; fg.fillStyle = '#ffffff'; fg.fillRect(0, 0, w, h);   // versión en blanco, para el destello al recibir un golpe
  return { c, f, w, h };
}
const palOf = (col, extra) => Object.assign({ o: '#0e1017', m: col, d: tone(col, -0.38), l: tone(col, 0.45), w: '#ffffff', k: '#0e1017' }, extra || {});
const SPR = { player: mkSprite(HALF.player, { o: '#0e1017', h: '#6b4a2e', s: '#e8b98a', k: '#1b1410', b: '#b9b1a2', a: '#ff9a3c', l: '#ffd08a' }), shade: mkSprite(HALF.shade, palOf(GODS.shade.color, { w: '#ffffff' })), champ: {} };
for (const k of Object.keys(TYPES)) if (HALF[k] && k !== 'champ') SPR[k] = mkSprite(HALF[k], palOf(TYPES[k].color, k === 'guardian' ? { r: '#ff9a3c' } : {}));
for (const g of GOD_KEYS) SPR.champ[g] = mkSprite(HALF.champ, { o: '#0e1017', a: '#c9c2b2', k: '#0e1017', m: GODS[g].color, l: tone(GODS[g].color, 0.5) });
// Dibuja un sprite centrado en (x, y) con la altura dada en unidades de mundo. flip: mirando a la izquierda.
function drawSprite(sp, x, y, hgt, flip, flash) {
  const k = hgt / sp.h, w = sp.w * k;
  ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); ctx.drawImage(flash ? sp.f : sp.c, -w / 2, y - hgt / 2, w, hgt); ctx.restore(); }
  else ctx.drawImage(flash ? sp.f : sp.c, x - w / 2, y - hgt / 2, w, hgt);
}
// Suelo de cada mundo: losas con juntas y desgaste, generado una vez
const FLOORS = {};
function floorOf(wi) {
  if (FLOORS[wi]) return FLOORS[wi];
  const W = WORLDS[wi], c = document.createElement('canvas'), g = c.getContext('2d'), N = 80; c.width = c.height = N;
  let seed = 7 + wi * 131; const rndS = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = W.floor; g.fillRect(0, 0, N, N); g.fillStyle = W.tile; g.fillRect(0, 0, 40, 40); g.fillRect(40, 40, 40, 40);
  g.fillStyle = tone(W.floor, -0.3); for (const v of [0, 40]) { g.fillRect(v, 0, 1, N); g.fillRect(0, v, N, 1); }                       // juntas
  g.fillStyle = tone(W.tile, 0.12); for (const v of [1, 41]) { g.fillRect(v, 1, 1, 38); g.fillRect(v, 41, 1, 38); }                      // luz en el canto
  for (let i = 0; i < 70; i++) { g.fillStyle = tone(W.floor, rndS() < 0.5 ? -0.22 : 0.14); g.fillRect(Math.floor(rndS() * N), Math.floor(rndS() * N), rndS() < 0.25 ? 2 : 1, 1); }   // desgaste
  for (let i = 0; i < 5; i++) { let x = Math.floor(rndS() * N), y = Math.floor(rndS() * N); g.fillStyle = tone(W.floor, -0.35); for (let j = 0; j < 6; j++) { g.fillRect(x, y, 1, 1); x += rndS() < 0.5 ? 1 : 0; y += rndS() < 0.6 ? 1 : 0; } }   // grietas
  return (FLOORS[wi] = c);
}

