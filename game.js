/* Sala de Kiteo — prototipo de combate.
   Objetivo: comprobar si kitear con frenazo + apuntado automático es divertido.
   Sin dependencias. Entrada: mando (prioritario), teclado y táctil. */
(() => {
'use strict';

// ───────────────────────── Ajustes de sensación (tocar aquí) ─────────────────────────
const T = {
  room: { w: 880, h: 580 },
  viewArea: 520 * 300,          // unidades de mundo visibles (área constante)
  player: {
    r: 7, speed: 82, hp: 100, dmg: 12,
    as: 0.95,                   // disparos por segundo
    range: 185,
    windupFrac: 0.22,           // parte del ciclo de ataque en la que te frenas
    windupSlow: 0.12,           // velocidad durante el gesto de disparo
    holdSlow: 0.5,              // velocidad si mantienes pulsado disparar
  },
  buffer: 0.14,                 // margen para pulsar un poco antes de tiempo
  dodge: { time: 0.16, mult: 3.4, cd: 1.0 },
  charge: { min: 0.3, full: 0.85, cd: 2.2, range: 380, dmgMult: 4.5, width: 7, slow: 0.08 },
};

const TYPES = {
  stalker: { name: 'Acechador', r: 7,  hp: 30,  speed: 58,  dmg: 10, wind: 0.38, reach: 9,  shape: 'circle',  color: '#e5506a' },
  runner:  { name: 'Corredor',  r: 5,  hp: 12,  speed: 100, dmg: 7,  wind: 0.22, reach: 8,  shape: 'tri',     color: '#ff7a59' },
  brute:   { name: 'Bruto',     r: 12, hp: 120, speed: 38,  dmg: 24, wind: 0.6,  reach: 14, shape: 'square',  color: '#b8394f' },
  mage:    { name: 'Mago',      r: 7,  hp: 24,  speed: 50,  dmg: 12, ranged: true,          shape: 'diamond', color: '#b68cff' },
  champ:   { name: 'Campeón',   r: 9,  hp: 95,  speed: 60,  dmg: 16, wind: 0.4,  reach: 10, shape: 'circle',  color: '#e9dcc3', champ: true },
};

const UPGRADES = [
  { name: 'Mecanismo ligero', desc: '+22% velocidad de ataque',            apply: p => { p.as *= 1.22; } },
  { name: 'Núcleo denso',     desc: '+30% daño',                           apply: p => { p.dmg *= 1.3; } },
  { name: 'Cañón largo',      desc: '+15% alcance',                        apply: p => { p.range *= 1.15; } },
  { name: 'Botas de forja',   desc: '+8% velocidad de movimiento',         apply: p => { p.speed *= 1.08; } },
  { name: 'Peto reforzado',   desc: '+25 vida máxima y recuperas 40',      apply: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 40); } },
];

// Armas que llevan los campeones. Cada una es una familia de piezas para injertar en el rifle.
const FAM = {
  fire:  { name: 'Espada de brasas',     short: 'Fuego',    color: '#ff7a3c' },
  bolt:  { name: 'Lanza de tormenta',    short: 'Rayo',     color: '#ffe14d' },
  frost: { name: 'Martillo de escarcha', short: 'Escarcha', color: '#9fd8ff' },
};
const SLOTS = { basic: 'Disparo', charge: 'Cargado', dodge: 'Esquive', passive: 'Pasiva' };
const SLOT_KEYS = ['basic', 'charge', 'dodge', 'passive'];
const PIECES = [
  { id: 'f_basic',  fam: 'fire',  slot: 'basic',   name: 'Bala de brasa',    desc: l => `Cada disparo aplica ${l} de Quemadura: daño continuo que se acumula hasta 6.` },
  { id: 'f_charge', fam: 'fire',  slot: 'charge',  name: 'Lanza de fuego',   desc: l => `El disparo cargado deja 3 s una línea de fuego que quema (${l} por pulso) a quien la pisa.` },
  { id: 'f_dodge',  fam: 'fire',  slot: 'dodge',   name: 'Salto de fragua',  desc: l => `Al esquivar, explosión donde estabas: ${150 * l}% de daño y Quemadura.` },
  { id: 'f_pass',   fam: 'fire',  slot: 'passive', name: 'Combustión',       desc: l => `Los enemigos que mueren quemándose explotan (${100 * l}% de daño) y queman a los de al lado.` },
  { id: 'r_basic',  fam: 'bolt',  slot: 'basic',   name: 'Arco voltaico',    desc: l => `Cada disparo salta a ${1 + l} enemigos cercanos con el 70% del daño.` },
  { id: 'r_charge', fam: 'bolt',  slot: 'charge',  name: 'Condensador',      desc: l => `El cargado carga un 40% más rápido y se recupera en menos de la mitad${l > 1 ? `, con +${30 * (l - 1)}% de daño` : ''}.` },
  { id: 'r_dodge',  fam: 'bolt',  slot: 'dodge',   name: 'Paso relámpago',   desc: l => `Esquivar daña (${120 * l}%) a quien atravieses y te deja disparar al instante.` },
  { id: 'r_pass',   fam: 'bolt',  slot: 'passive', name: 'Sobrecarga',       desc: l => `Cada ${Math.max(2, 5 - l)} disparos, uno hace 250% de daño y salta a 3 enemigos más.` },
  { id: 'e_basic',  fam: 'frost', slot: 'basic',   name: 'Bala de escarcha', desc: l => `Cada disparo aplica ${l} de Frío: ralentiza, y a 5 acumulaciones congela.` },
  { id: 'e_charge', fam: 'frost', slot: 'charge',  name: 'Glaciar',          desc: l => `El disparo cargado congela ${(1.2 + 0.5 * l).toFixed(1)} s a todos los que atraviesa.` },
  { id: 'e_dodge',  fam: 'frost', slot: 'dodge',   name: 'Nova helada',      desc: l => `Al esquivar, empujas a los cercanos y les aplicas ${2 + l} de Frío.` },
  { id: 'e_pass',   fam: 'frost', slot: 'passive', name: 'Quebrar',          desc: l => `+${100 * l}% de daño a congelados y +${30 * l}% a enemigos con Frío.` },
];
// Fusiones: nacen al juntar dos piezas de armas distintas en la misma acción.
// La pieza fundida hace los dos efectos (con un nivel más cada uno), ocupa una ranura y activa la sinergia de la pareja.
const PAIRS = {
  'fire+frost': { id: 'thermal', name: 'Choque térmico', adjF: 'térmica',         adjM: 'térmico',        color: '#f3b6ff', desc: 'Un enemigo congelado y quemado a la vez revienta: 300% de daño en área.' },
  'bolt+fire':  { id: 'plasma',  name: 'Plasma',         adjF: 'de plasma',       adjM: 'de plasma',      color: '#ffb347', desc: 'Los saltos de rayo queman, y cada pulso de Quemadura salta a un enemigo cercano y lo prende.' },
  'bolt+frost': { id: 'super',   name: 'Superconductor', adjF: 'superconductora', adjM: 'superconductor', color: '#b8ffd9', desc: 'Los saltos de rayo enfrían y hacen el doble a enemigos con Frío. Congelar a un enemigo suelta un rayo que salta a 2 más.' },
};
const FUSE_NOUN = { basic: ['Bala', 'F'], charge: ['Lanza', 'F'], dodge: ['Salto', 'M'], passive: ['Núcleo', 'M'] };
// Planos de reforja: cambian cómo funciona el rifle, no solo lo que aplica.
const PLANS = [
  { id: 'burst',   form: true, name: 'Ráfaga',        desc: 'Cada disparo son 3 balas rápidas al 45% de daño, y cada una aplica tus efectos. El gesto dura un poco más.' },
  { id: 'shotgun', form: true, name: 'Recortado',     desc: 'Alcance a la mitad. Disparas un abanico de 5 perdigones al 60% de daño: de cerca pueden entrar todos en el mismo enemigo.' },
  { id: 'heavy',   form: true, name: 'Cañón pesado',  desc: 'Disparas un 40% más lento, pero cada disparo hace +130% de daño y atraviesa a todos los enemigos en línea.' },
  { id: 'tempo',   name: 'Compás',        desc: 'Si pulsas justo cuando el anillo se llena, el disparo hace el doble de daño. Mantener pulsado o machacar el botón no cuenta.' },
  { id: 'mortar',  name: 'Mortero',       desc: 'El cargado deja de ser un rayo: lanza un proyectil que explota en área sobre tu objetivo.' },
  { id: 'recoil',  name: 'Retroceso',     desc: 'El cargado te lanza hacia atrás como un esquive (activa tus piezas de esquive) y se recupera un 35% antes.' },
  { id: 'double',  name: 'Doble esquive', desc: 'Llevas dos cargas de esquive.' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

const C = {
  wall: '#0e1017', floor: '#1a1e29', tile: '#1f2431', edge: '#3a4258',
  ink: '#ece8dd', ember: '#ff9a3c', energy: '#62e6ff', blood: '#e5506a', arcane: '#b68cff',
};

// ───────────────────────── Utilidades ─────────────────────────
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const rnd = (a, b) => a + Math.random() * (b - a);

const cv = $('game');
const ctx = cv.getContext('2d');
const view = { s: 1, w: 520, h: 300, cssW: 1, cssH: 1, dpr: 1 };
const cam = { x: 0, y: 0 };

// ───────────────────────── Sonido (pitidos simples) ─────────────────────────
let AC = null, muted = false;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
}
function blip(freq, dur, type = 'square', vol = 0.04, slide = 0) {
  if (!AC || muted || AC.state !== 'running') return;
  try {
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* sin sonido */ }
}

// ───────────────────────── Entrada ─────────────────────────
const keys = new Set(), tapped = new Set();   // tapped: pulsaciones más cortas que un fotograma
const down = c => keys.has(c) || tapped.has(c);
const touch = { joyId: null, ox: 0, oy: 0, x: 0, y: 0, atk: false, dodge: false, chg: false };
let lastDev = 'none', padName = '', padBlocked = false;
const I = { mx: 0, my: 0, ax: 0, ay: 0, atk: false, atkP: false, dodgeP: false, chg: false, startP: false, clearP: false, navL: false, navR: false };
const prev = { atk: false, dodge: false, start: false, clear: false, nav: 0 };

addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code); tapped.add(e.code); lastDev = 'kb'; audioInit();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

function readPad() {
  let pads;
  try { pads = navigator.getGamepads ? navigator.getGamepads() : []; }
  catch (e) { padBlocked = true; return null; }
  for (const p of pads) if (p && p.connected) return p;
  return null;
}
const dz = v => (Math.abs(v || 0) < 0.2 ? 0 : v);

function pollInput() {
  let mx = 0, my = 0, ax = 0, ay = 0, atk = false, dodge = false, chg = false, start = false, clear = false, nav = 0;

  // Teclado
  if (down('KeyA') || down('ArrowLeft')) mx -= 1;
  if (down('KeyD') || down('ArrowRight')) mx += 1;
  if (down('KeyW') || down('ArrowUp')) my -= 1;
  if (down('KeyS') || down('ArrowDown')) my += 1;
  atk = down('Space') || down('KeyJ') || down('Enter');
  dodge = down('ShiftLeft') || down('ShiftRight') || down('KeyK');
  chg = down('KeyE') || down('KeyL');
  start = down('Escape') || down('KeyP');

  // Mando
  const p = readPad();
  if (p) {
    padName = p.id || 'mando';
    const b = i => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
    const lx = dz(p.axes[0]), ly = dz(p.axes[1]), rx = dz(p.axes[2]), ry = dz(p.axes[3]);
    const any = lx || ly || rx || ry || p.buttons.some(x => x && x.pressed);
    if (any) { lastDev = 'pad'; audioInit(); }
    mx += lx; my += ly; ax += rx; ay += ry;
    if (b(14)) mx -= 1; if (b(15)) mx += 1; if (b(12)) my -= 1; if (b(13)) my += 1;
    atk = atk || b(0) || b(7);
    dodge = dodge || b(1) || b(5);
    chg = chg || b(2) || b(6);
    start = start || b(9);
    clear = clear || b(11);
  } else padName = '';

  // Táctil
  if (touch.joyId !== null) {
    const dx = touch.x - touch.ox, dy = touch.y - touch.oy, m = Math.hypot(dx, dy), max = 46;
    if (m > 6) { const v = Math.min(1, m / max); mx += dx / m * v; my += dy / m * v; }
  }
  atk = atk || touch.atk || touch.tAtk; dodge = dodge || touch.dodge || touch.tDodge; chg = chg || touch.chg;
  tapped.clear(); touch.tAtk = touch.tDodge = false;

  const mm = Math.hypot(mx, my);
  if (mm > 1) { mx /= mm; my /= mm; }
  if (mx < -0.6) nav = -1; else if (mx > 0.6) nav = 1;

  I.mx = mx; I.my = my; I.ax = ax; I.ay = ay; I.atk = atk; I.chg = chg;
  I.atkP = atk && !prev.atk;
  I.dodgeP = dodge && !prev.dodge;
  I.startP = start && !prev.start;
  I.clearP = clear && !prev.clear;
  I.navL = nav === -1 && prev.nav !== -1;
  I.navR = nav === 1 && prev.nav !== 1;
  prev.atk = atk; prev.dodge = dodge; prev.start = start; prev.clear = clear; prev.nav = nav;
}

function screenToWorld(cx, cy) {
  const r = cv.getBoundingClientRect();
  return { x: cam.x + (cx - r.left) * view.dpr / view.s, y: cam.y + (cy - r.top) * view.dpr / view.s };
}
function tapLock(cx, cy) {
  if (!S || S.mode !== 'play') return;
  const w = screenToWorld(cx, cy);
  let best = null, bd = 1e9;
  for (const e of S.enemies) {
    if (e.spawn > 0) continue;
    const d = Math.hypot(e.x - w.x, e.y - w.y) - e.r;
    if (d < 26 && d < bd) { bd = d; best = e; }
  }
  if (best) { S.lock = best; blip(900, 0.04, 'triangle', 0.03); }
}
cv.addEventListener('pointerdown', e => {
  audioInit();
  if (e.pointerType === 'mouse') { tapLock(e.clientX, e.clientY); return; }
  lastDev = 'touch';
  const r = cv.getBoundingClientRect();
  if (e.clientX - r.left < r.width * 0.5 && touch.joyId === null) {
    touch.joyId = e.pointerId; touch.ox = touch.x = e.clientX; touch.oy = touch.y = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  } else tapLock(e.clientX, e.clientY);
});
cv.addEventListener('pointermove', e => { if (e.pointerId === touch.joyId) { touch.x = e.clientX; touch.y = e.clientY; } });
const joyEnd = e => { if (e.pointerId === touch.joyId) touch.joyId = null; };
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);
cv.addEventListener('contextmenu', e => e.preventDefault());

function bindHold(el, key) {
  const on = e => { e.preventDefault(); audioInit(); lastDev = 'touch'; touch[key] = true; touch['t' + key[0].toUpperCase() + key.slice(1)] = true; el.classList.add('down'); try { el.setPointerCapture(e.pointerId); } catch (_) {} };
  const off = () => { touch[key] = false; el.classList.remove('down'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindHold($('btnAtk'), 'atk'); bindHold($('btnDodge'), 'dodge'); bindHold($('btnChg'), 'chg');

// ───────────────────────── Estado ─────────────────────────
let S = null, best = 0, aimLatch = false, modeT = 0, pickSel = 1, pickOpts = [];
try { best = +localStorage.getItem('kiteo.best') || 0; } catch (e) {}

function newGame() {
  const P = T.player;
  S = {
    mode: 'title', wave: 0, kills: 0, t: 0, shake: 0, hitstop: 0, hurtFx: 0, noTarget: 0,
    p: {
      x: T.room.w / 2, y: T.room.h / 2, r: P.r, hp: P.hp, maxHp: P.hp, dmg: P.dmg, as: P.as, range: P.range, speed: P.speed, shotN: 0, dodgeHit: new Set(), chargeCdMax: T.charge.cd,
      face: 0, cd: 0, windup: 0, windupTotal: 0, windupTarget: null, buffer: 0, wasReady: true,
      dodgeT: 0, dodgeCd: T.dodge.cd, dodgeN: 1, dvx: 0, dvy: 0, inv: 0, readyT: 0, spoil: false, crit: false,
      charging: false, charge: 0, chargeCd: 0, chargeDir: 0,
    },
    enemies: [], shots: [], fx: [], queue: [], lock: null, waveClear: 0,
    build: Object.fromEntries(SLOT_KEYS.map(k => [k, { parts: {}, fused: null }])), plans: new Set(), buildV: 0, drop: null, zones: [], timers: [],
  };
}

function setMode(m) { S.mode = m; modeT = 0; renderOverlay(); }

function startRun() { newGame(); S.mode = 'play'; modeT = 0; nextWave(); renderOverlay(); }

function nextWave() {
  S.wave += 1;
  const n = S.wave, list = [];
  const add = (type, k) => { for (let i = 0; i < k; i++) list.push(type); };
  if (n === 1) add('stalker', 4);
  else if (n === 2) { add('stalker', 5); add('runner', 2); }
  else if (n === 3) { add('stalker', 4); add('runner', 3); add('mage', 1); }
  else { add('stalker', 3 + Math.floor(n / 2)); add('runner', n - 1); add('mage', Math.floor(n / 2)); add('brute', Math.floor(n / 3)); }
  list.sort(() => Math.random() - 0.5);
  list.splice(Math.ceil(list.length / 2), 0, 'champ');   // un campeón por sala: lleva el arma
  S.drop = null;
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.45 }));
  S.waveT = 0;
}

function spawn(typeKey) {
  const ty = TYPES[typeKey], p = S.p;
  let x = 0, y = 0;
  for (let i = 0; i < 30; i++) {
    x = rnd(30, T.room.w - 30); y = rnd(30, T.room.h - 30);
    if (Math.hypot(x - p.x, y - p.y) > 230) break;
  }
  const hp = Math.round(ty.hp * (1 + 0.12 * (S.wave - 1)));
  const famKeys = Object.keys(FAM), fam = ty.champ ? famKeys[Math.floor(Math.random() * famKeys.length)] : null;
  S.enemies.push({ type: ty, champ: !!ty.champ, fam, color: fam ? FAM[fam].color : ty.color, x, y, r: ty.r, hp, maxHp: hp, speed: ty.speed, dmg: ty.dmg,
    spawn: 0.65, flash: 0, kx: 0, ky: 0, wind: 0, rec: 0, cool: rnd(0.8, 1.8), cast: 0, dir: 0,
    burn: 0, burnT: 0, burnAcc: 0, chill: 0, chillT: 0, frozen: 0, freezeImm: 0, thermCd: 0,
    lungeCd: rnd(1.5, 3), lungeWind: 0, lungeT: 0, lvx: 0, lvy: 0, lungeHit: false });
}

// ───────────────────────── Combate ─────────────────────────
const active = e => e.spawn <= 0 && e.hp > 0;
const PIECE = Object.fromEntries(PIECES.map(p => [p.id, p]));
const pieceOf = (slot, fam) => PIECES.find(x => x.slot === slot && x.fam === fam);
const pairOf = a => (a.fused ? PAIRS[a.fused.slice().sort().join('+')] : null);
// Nivel efectivo de una pieza (0 si no la llevas). Dentro de una fusión cuenta un nivel más.
const lv = id => { const pc = PIECE[id], a = S.build[pc.slot], l = a.parts[pc.fam] || 0; return l && a.fused && a.fused.includes(pc.fam) ? l + 1 : l; };
// ¿Está activa la sinergia de una pareja? (basta una pieza fundida de esa pareja)
const syn = id => SLOT_KEYS.some(k => { const pr = pairOf(S.build[k]); return !!pr && pr.id === id; });
const slotColor = slot => { const a = S.build[slot], pr = pairOf(a); if (pr) return pr.color; const f = Object.keys(a.parts)[0]; return f ? FAM[f].color : C.energy; };
const rangeOf = () => S.p.range * (S.plans.has('shotgun') ? 0.5 : 1);
const periodOf = () => 1 / (S.p.as * (S.plans.has('heavy') ? 0.6 : 1));

function nearestInRange() {
  const p = S.p, rng = rangeOf(); let bestE = null, bd = 1e9;
  for (const e of S.enemies) {
    if (!active(e)) continue;
    const d = dist(p, e) - e.r;
    if (d <= rng && d < bd) { bd = d; bestE = e; }
  }
  return bestE;
}

function kill(e) {
  S.kills += 1;
  for (let i = 0; i < 10; i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: rnd(-110, 110), vy: rnd(-110, 110), t: 0, life: rnd(0.25, 0.5), col: e.color });
  if (S.lock === e) S.lock = null;
  blip(160, 0.12, 'sawtooth', 0.04, -90);
  if (e.champ) { S.drop = { fam: e.fam, x: e.x, y: e.y }; blip(880, 0.25, 'triangle', 0.05, 400); }
  const l = lv('f_pass');
  if (l && e.burn > 0) explode(e.x, e.y, 44, S.p.dmg * l, { burn: 1, col: FAM.fire.color });
}

function hit(e, dmg, ux, uy, big, col) {
  if (!active(e)) return;
  const q = lv('e_pass');
  if (q) { if (e.frozen > 0) dmg *= 1 + q; else if (e.chill > 0) dmg *= 1 + 0.3 * q; }
  e.hp -= dmg; e.flash = 0.1;
  const kb = big ? 150 : 60; e.kx += ux * kb; e.ky += uy * kb;
  S.fx.push({ k: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r - 2, t: 0, life: 0.55, txt: String(Math.round(dmg)), big });
  for (let i = 0; i < (big ? 7 : 3); i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: ux * rnd(40, 140) + rnd(-50, 50), vy: uy * rnd(40, 140) + rnd(-50, 50), t: 0, life: rnd(0.15, 0.3), col: col || C.energy });
  S.shake = Math.max(S.shake, big ? 5 : 1.6);
  S.hitstop = Math.max(S.hitstop, big ? 0.06 : 0.022);
  if (e.hp <= 0) kill(e); else blip(520, 0.035, 'square', 0.025);
}
// Daño continuo: sin pausa ni empujón
function dot(e, dmg) {
  if (!active(e)) return;
  e.hp -= dmg;
  S.fx.push({ k: 'num', x: e.x + rnd(-5, 5), y: e.y - e.r - 2, t: 0, life: 0.4, txt: String(Math.max(1, Math.round(dmg))), col: FAM.fire.color });
  if (e.hp <= 0) kill(e);
}
function explode(x, y, r, dmg, o) {
  S.fx.push({ k: 'ring', x, y, r, t: 0, life: 0.28, col: o.col || C.ink });
  S.shake = Math.max(S.shake, 4);
  blip(90, 0.2, 'sawtooth', 0.05, -40);
  for (const e of S.enemies.slice()) {
    if (!active(e)) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
    if (d > r + e.r) continue;
    if (dmg > 0) hit(e, dmg, dx / d, dy / d, true, o.col);
    if (!active(e)) continue;
    if (o.push) { e.kx += dx / d * o.push; e.ky += dy / d * o.push; }
    if (o.freeze) freeze(e, o.freeze);
    if (o.burn) applyBurn(e, o.burn);
    if (o.chill) applyChill(e, o.chill);
  }
}
function applyBurn(e, n) { if (!active(e)) return; e.burn = Math.min(6, e.burn + n); e.burnT = 3; if (e.frozen > 0) thermal(e); }
function applyChill(e, n) { if (!active(e) || e.frozen > 0 || e.freezeImm > 0) return; e.chill += n; e.chillT = 4; if (e.chill >= 5) freeze(e, 1.3); }
function freeze(e, t) {
  if (!active(e)) return;
  const was = e.frozen > 0;
  e.frozen = Math.max(e.frozen, t); e.chill = 0; e.freezeImm = t + 2;
  e.wind = 0; e.cast = 0; e.lungeWind = 0; e.lungeT = 0;
  blip(1400, 0.08, 'sine', 0.03, -600);
  if (!was && syn('super')) chain(e, 2, S.p.dmg, new Set([e]));
  if (e.burn > 0) thermal(e);
}
function thermal(e) {
  if (!syn('thermal') || e.thermCd > 0 || !active(e)) return;
  e.thermCd = 1.5; e.frozen = 0;
  explode(e.x, e.y, 50, S.p.dmg * 3, { col: PAIRS['fire+frost'].color });
}
function chain(from, jumps, dmg, done) {
  const sup = syn('super'), pla = syn('plasma');
  for (let i = 0; i < jumps; i++) {
    let nx = null, nd = 95;
    for (const e of S.enemies) { if (!active(e) || done.has(e)) continue; const dd = dist(from, e); if (dd < nd) { nd = dd; nx = e; } }
    if (!nx) break;
    const cx = nx.x - from.x, cy = nx.y - from.y, cd = Math.hypot(cx, cy) || 1;
    S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: nx.x, y2: nx.y, t: 0, life: 0.14, col: FAM.bolt.color });
    hit(nx, dmg * (sup && (nx.chill > 0 || nx.frozen > 0) ? 2 : 1), cx / cd, cy / cd, false, FAM.bolt.color);
    done.add(nx);
    if (sup) applyChill(nx, 1);
    if (pla) applyBurn(nx, 1);
    from = nx;
  }
}
// Un impacto de bala: daño, efectos de las piezas de disparo y saltos
function onHit(e, dmg, ux, uy, big, col, extraJumps) {
  hit(e, dmg, ux, uy, big, col);
  const fb = lv('f_basic'), eb = lv('e_basic'), rb = lv('r_basic');
  if (fb) applyBurn(e, fb);
  if (eb) applyChill(e, eb);
  const jumps = (rb ? 1 + rb : 0) + (extraJumps || 0);
  if (jumps) chain(e, jumps, dmg * 0.7, new Set([e]));
}

function fireBasic(target) {
  const p = S.p, rng = rangeOf();
  if (!target || !active(target)) target = nearestInRange();
  if (!target) { p.cd = 0.12; p.crit = false; return; }
  p.shotN += 1;
  const ov = lv('r_pass'), over = ov > 0 && p.shotN % Math.max(2, 5 - ov) === 0;
  let mult = over ? 2.5 : 1;
  if (p.crit) { mult *= 2; S.fx.push({ k: 'num', x: p.x, y: p.y - 14, t: 0, life: 0.6, txt: '¡Compás!', col: C.ember, big: true }); blip(1800, 0.09, 'sine', 0.05); }
  const big = over || p.crit, extra = over ? 3 : 0, col = over ? FAM.bolt.color : slotColor('basic');
  p.crit = false;
  const aim = t => { const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; p.face = Math.atan2(dy, dx); return [dx / d, dy / d]; };
  const tracer = (x2, y2, w) => S.fx.push({ k: 'tracer', x1: p.x + Math.cos(p.face) * 14, y1: p.y + Math.sin(p.face) * 14, x2, y2, t: 0, life: big ? 0.16 : 0.09, col, w: w || (big ? 2 : 1) });
  const bullet = (t, m, ex) => { const [ux, uy] = aim(t); tracer(t.x, t.y); onHit(t, p.dmg * m, ux, uy, big, col, ex); };
  blip(over ? 800 : 1250, over ? 0.12 : 0.07, 'square', 0.035, -700);

  if (S.plans.has('heavy')) {            // atraviesa en línea
    const [ux, uy] = aim(target), len = rng + 40;
    tracer(p.x + ux * len, p.y + uy * len, 3);
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const ex = e.x - p.x, ey = e.y - p.y, al = ex * ux + ey * uy;
      if (al < 0 || al > len + e.r || Math.abs(ex * uy - ey * ux) > 5 + e.r) continue;
      onHit(e, p.dmg * mult * 2.3, ux, uy, true, col, e === target ? extra : 0);
    }
    S.shake = Math.max(S.shake, 3.5);
  } else if (S.plans.has('shotgun')) {   // abanico de perdigones
    const [ux0, uy0] = aim(target), base = Math.atan2(uy0, ux0), len = rng + 20;
    for (const off of [-0.34, -0.17, 0, 0.17, 0.34]) {
      const a = base + off, ux = Math.cos(a), uy = Math.sin(a); let bestE = null, ba = len;
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - p.x, ey = e.y - p.y, al = ex * ux + ey * uy;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * uy - ey * ux) <= e.r + 3) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * ba, y2: p.y + uy * ba, t: 0, life: 0.1, col });
      if (bestE) onHit(bestE, p.dmg * mult * 0.6, ux, uy, false, col, off === 0 ? extra : 0);
    }
    S.shake = Math.max(S.shake, 3);
  } else if (S.plans.has('burst')) {     // tres balas seguidas
    bullet(target, mult * 0.45, extra);
    for (const d of [0.07, 0.14]) S.timers.push({ t: d, fn: () => {
      const t2 = active(target) ? target : nearestInRange();
      if (t2) { blip(1250, 0.05, 'square', 0.03, -700); bullet(t2, mult * 0.45, 0); }
    } });
  } else bullet(target, mult, extra);
}

function startDodge(a, free) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.dodgeT = T.dodge.time; p.inv = Math.max(p.inv, T.dodge.time + 0.06);
  if (!free) { p.dodgeN -= 1; if (p.windup > 0) { p.windup = 0; p.cd = 0.1; } p.charging = false; p.charge = 0; }
  blip(420, 0.1, 'triangle', 0.04, 500);
  p.dodgeHit = new Set();
  const fd = lv('f_dodge'), ed = lv('e_dodge');
  if (fd) explode(p.x, p.y, 45 + 8 * (fd - 1), p.dmg * 1.5 * fd, { burn: 1, col: FAM.fire.color });
  if (ed) explode(p.x, p.y, 60 + 10 * (ed - 1), 0, { chill: 2 + ed, push: 140, col: FAM.frost.color });
  if (lv('r_dodge')) p.cd = 0;
}

function fireCharged(am) {
  const p = S.p, ch = T.charge;
  const rc = lv('r_charge'), fc = lv('f_charge'), ec = lv('e_charge');
  const ratio = clamp(p.charge / ch.full, 0, 1);
  const dmg = p.dmg * (1.5 + (ch.dmgMult - 1.5) * ratio) * (rc ? 1 + 0.3 * (rc - 1) : 1);
  const ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir), len = ch.range, col = slotColor('charge');
  if (S.plans.has('mortar')) {
    const tg = S.target && active(S.target) && am <= 0.35 ? S.target : null;
    const tx = clamp(tg ? tg.x : p.x + ux * 170, 0, T.room.w), ty = clamp(tg ? tg.y : p.y + uy * 170, 0, T.room.h);
    S.fx.push({ k: 'lob', x1: p.x, y1: p.y, x2: tx, y2: ty, t: 0, life: 0.3, col });
    S.timers.push({ t: 0.3, fn: () => {
      explode(tx, ty, 58, dmg * 0.8, { col, freeze: ec ? 1.2 + 0.5 * ec : 0 });
      if (fc) S.zones.push({ x: tx, y: ty, r: 58, life: 3, acc: 0.4, stacks: fc });
      S.shake = Math.max(S.shake, 7);
    } });
  } else {
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const ex = e.x - p.x, ey = e.y - p.y, along = ex * ux + ey * uy;
      if (along < 0 || along > len) continue;
      if (Math.abs(ex * uy - ey * ux) > ch.width + e.r) continue;
      hit(e, dmg, ux, uy, true, col);
      if (ec) freeze(e, 1.2 + 0.5 * ec);
    }
    if (fc) S.zones.push({ x1: p.x, y1: p.y, x2: p.x + ux * len, y2: p.y + uy * len, life: 3, acc: 0.4, stacks: fc });
    S.fx.push({ k: 'beam', x1: p.x + ux * 14, y1: p.y + uy * 14, x2: p.x + ux * len, y2: p.y + uy * len, t: 0, life: 0.22, w: 3 + 5 * ratio, col });
  }
  let cd = ch.cd * (rc ? 0.4 : 1);
  p.cd = Math.max(p.cd, 0.25);
  if (S.plans.has('recoil')) { cd *= 0.65; startDodge(Math.atan2(-uy, -ux), true); }
  else { p.x -= ux * 6; p.y -= uy * 6; }
  p.chargeCdMax = p.chargeCd = cd;
  S.shake = Math.max(S.shake, 4 + 4 * ratio);
  blip(300, 0.3, 'sawtooth', 0.06, -220);
}

function hurtPlayer(dmg) {
  const p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  p.hp -= dmg; p.inv = 0.5; S.hurtFx = 0.35; S.shake = Math.max(S.shake, 6);
  blip(110, 0.18, 'sawtooth', 0.07, -50);
  if (p.hp <= 0) {
    p.hp = 0;
    if (S.wave > best) { best = S.wave; try { localStorage.setItem('kiteo.best', String(best)); } catch (e) {} }
    setMode('dead');
  }
}

// ───────────────────────── Actualización ─────────────────────────
function update(dt) {
  const p = S.p, P = T.player;
  S.t += dt;
  S.shake = Math.max(0, S.shake - dt * 22);
  S.hurtFx = Math.max(0, S.hurtFx - dt);
  S.noTarget = Math.max(0, S.noTarget - dt);
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  if (S.timers.length) { const due = []; for (const tm of S.timers) { tm.t -= dt; if (tm.t <= 0) due.push(tm); } S.timers = S.timers.filter(tm => tm.t > 0); for (const tm of due) tm.fn(); }

  // Oleadas
  S.waveT += dt;
  while (S.queue.length && S.queue[0].at <= S.waveT) spawn(S.queue.shift().type);
  if (!S.queue.length && !S.enemies.length) {
    S.waveClear += dt;
    if (S.waveClear > 0.7) { S.waveClear = 0; S.shots.length = 0; S.zones.length = 0; openPick(); return; }
  }

  // Temporizadores
  p.cd = Math.max(0, p.cd - dt);
  p.chargeCd = Math.max(0, p.chargeCd - dt); p.inv = Math.max(0, p.inv - dt); p.buffer = Math.max(0, p.buffer - dt);
  const ready = p.cd <= 0 && p.windup <= 0;
  if (ready && !p.wasReady) { p.readyT = S.t; blip(1900, 0.02, 'sine', 0.012); }
  p.wasReady = ready;

  // Esquive (por cargas)
  const dMax = S.plans.has('double') ? 2 : 1;
  if (p.dodgeN < dMax) { p.dodgeCd -= dt; if (p.dodgeCd <= 0) { p.dodgeN += 1; p.dodgeCd = T.dodge.cd; } } else p.dodgeCd = T.dodge.cd;
  if (I.dodgeP && p.dodgeN > 0 && p.dodgeT <= 0) startDodge(Math.hypot(I.mx, I.my) > 0.2 ? Math.atan2(I.my, I.mx) : p.face, false);

  // Objetivo
  if (I.clearP) S.lock = null;
  if (S.lock && (!active(S.lock) || dist(p, S.lock) - S.lock.r > rangeOf() * 1.2)) S.lock = null;
  const am = Math.hypot(I.ax, I.ay);
  if (am > 0.6 && !aimLatch && !p.charging) {
    aimLatch = true;
    const ang = Math.atan2(I.ay, I.ax); let bestE = null, bs = 1e9;
    for (const e of S.enemies) {
      if (!active(e)) continue;
      const d = dist(p, e);
      if (d - e.r > rangeOf() * 1.1) continue;
      const da = Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang));
      if (da > 0.75) continue;
      const score = da * 130 + d * 0.3;
      if (score < bs) { bs = score; bestE = e; }
    }
    if (bestE) { S.lock = bestE; blip(900, 0.04, 'triangle', 0.03); }
  }
  if (am < 0.3) aimLatch = false;
  const target = (S.lock && dist(p, S.lock) - S.lock.r <= rangeOf()) ? S.lock : nearestInRange();
  S.target = target;

  // Disparo cargado
  if (I.chg && !p.charging && p.chargeCd <= 0 && p.dodgeT <= 0 && p.windup <= 0) { p.charging = true; p.charge = 0; p.chargeDir = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face; }
  if (p.charging) {
    const before = p.charge; p.charge += dt * (lv('r_charge') ? 1 / 0.6 : 1);
    if (before < T.charge.full && p.charge >= T.charge.full) blip(1500, 0.06, 'sine', 0.04);
    if (am > 0.35) p.chargeDir = Math.atan2(I.ay, I.ax);
    else if (target) p.chargeDir = Math.atan2(target.y - p.y, target.x - p.x);
    p.face = p.chargeDir;
    if (!I.chg) { if (p.charge >= T.charge.min) fireCharged(am); p.charging = false; p.charge = 0; }
  }

  // Disparo básico: cada disparo es un gesto corto que te frena
  if (I.atkP) { if (p.cd > T.buffer) p.spoil = true; p.buffer = T.buffer; if (!target) S.noTarget = 0.25; }
  const want = p.buffer > 0 || I.atk;
  if (want && target && !p.charging && p.dodgeT <= 0 && p.windup <= 0 && p.cd <= 0) {
    const period = periodOf();
    p.crit = S.plans.has('tempo') && p.buffer > 0 && !p.spoil && S.t - p.readyT <= 0.13;   // Compás: pulsación justa
    p.spoil = false;
    p.windupTotal = p.windup = period * P.windupFrac * (S.plans.has('burst') ? 1.25 : 1);
    p.windupTarget = target; p.cd = period; p.buffer = 0;
  }
  if (p.windup > 0) {
    const wt = p.windupTarget && active(p.windupTarget) ? p.windupTarget : target;
    if (wt) p.face = Math.atan2(wt.y - p.y, wt.x - p.x);
    p.windup -= dt;
    if (p.windup <= 0) { p.windup = 0; fireBasic(p.windupTarget); }
  }

  // Movimiento
  let mult = 1;
  if (p.charging) mult = T.charge.slow;
  else if (p.windup > 0) mult = P.windupSlow;
  else if (I.atk && target) mult = P.holdSlow;
  if (p.dodgeT > 0) {
    p.dodgeT -= dt;
    p.x += p.dvx * p.speed * T.dodge.mult * dt; p.y += p.dvy * p.speed * T.dodge.mult * dt;
    if (Math.random() < 0.7) S.fx.push({ k: 'ghost', x: p.x, y: p.y, t: 0, life: 0.18 });
    const rd = lv('r_dodge');
    if (rd) for (const e of S.enemies) if (active(e) && !p.dodgeHit.has(e) && dist(p, e) < p.r + e.r + 8) { p.dodgeHit.add(e); hit(e, p.dmg * 1.2 * rd, p.dvx, p.dvy, true, FAM.bolt.color); }
  } else {
    p.x += I.mx * p.speed * mult * dt; p.y += I.my * p.speed * mult * dt;
    if (Math.hypot(I.mx, I.my) > 0.2 && p.windup <= 0 && !p.charging) p.face = Math.atan2(I.my, I.mx);
  }
  p.slow = mult;
  p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);

  // Enemigos
  for (const e of S.enemies) {
    if (e.hp <= 0) continue;
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    e.flash = Math.max(0, e.flash - dt);
    e.x += e.kx * dt; e.y += e.ky * dt;
    const damp = 1 - Math.min(1, dt * 12); e.kx *= damp; e.ky *= damp;
    e.freezeImm = Math.max(0, e.freezeImm - dt); e.thermCd = Math.max(0, e.thermCd - dt);
    if (e.burn > 0) {
      e.burnT -= dt; e.burnAcc += dt;
      if (e.burnAcc >= 0.5) {
        e.burnAcc -= 0.5;
        const td = e.burn * p.dmg * 0.18; dot(e, td);
        if (syn('plasma')) {   // el fuego salta
          let nx = null, nd = 75;
          for (const o of S.enemies) { if (o === e || !active(o)) continue; const dd = dist(e, o); if (dd < nd) { nd = dd; nx = o; } }
          if (nx) { S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: nx.x, y2: nx.y, t: 0, life: 0.1, col: PAIRS['bolt+fire'].color }); dot(nx, td); if (nx.burn <= 0) applyBurn(nx, 1); }
        }
      }
      if (e.burnT <= 0) e.burn = 0;
      if (e.hp <= 0) continue;
    }
    if (e.chill > 0) { e.chillT -= dt; if (e.chillT <= 0) e.chill = 0; }
    if (e.frozen > 0) { e.frozen -= dt; continue; }
    const sp = e.speed * (1 - 0.14 * Math.min(4, e.chill));
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (e.lungeWind <= 0 && e.lungeT <= 0) e.dir = Math.atan2(dy, dx);
    if (e.type.ranged) {
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) { S.shots.push({ x: e.x, y: e.y, vx: ux * 125, vy: uy * 125, r: 4, dmg: e.dmg, life: 3.5 }); e.cool = 2.4; blip(700, 0.08, 'triangle', 0.025, -300); }
      } else {
        e.cool -= dt;
        const mv = d > 195 ? 1 : d < 120 ? -1 : 0;
        e.x += ux * mv * sp * dt; e.y += uy * mv * sp * dt;
        if (e.cool <= 0 && d < 270) e.cast = 0.55;
      }
    } else if (e.lungeT > 0) {          // embestida del campeón
      e.lungeT -= dt; e.x += e.lvx * dt; e.y += e.lvy * dt;
      if (!e.lungeHit && d < e.r + p.r + 4) { e.lungeHit = true; hurtPlayer(e.dmg); }
      if (e.lungeT <= 0) e.rec = 0.7;
    } else if (e.lungeWind > 0) {
      e.lungeWind -= dt;
      if (e.lungeWind <= 0) { e.lungeT = 0.3; e.lungeHit = false; }
    } else if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) { if (d < e.r + p.r + e.type.reach) hurtPlayer(e.dmg); e.rec = 0.55; }
    } else if (e.rec > 0) e.rec -= dt;
    else if (d < e.r + p.r + 3) e.wind = e.type.wind;
    else {
      if (e.champ) {
        e.lungeCd -= dt;
        if (e.lungeCd <= 0 && d < 150 && d > 45) { e.lungeCd = 3.5; e.lungeWind = 0.5; e.lvx = ux * 300; e.lvy = uy * 300; continue; }
      }
      e.x += ux * sp * dt; e.y += uy * sp * dt;
    }
  }
  // Líneas de fuego en el suelo
  for (const z of S.zones) {
    z.life -= dt; z.acc += dt;
    if (z.acc < 0.4) continue;
    z.acc = 0;
    if (z.r) { for (const e of S.enemies) if (active(e) && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.r) applyBurn(e, z.stacks); continue; }
    const zx = z.x2 - z.x1, zy = z.y2 - z.y1, L = Math.hypot(zx, zy) || 1, ux = zx / L, uy = zy / L;
    for (const e of S.enemies) {
      if (!active(e)) continue;
      const ex = e.x - z.x1, ey = e.y - z.y1, al = ex * ux + ey * uy;
      if (al >= 0 && al <= L && Math.abs(ex * uy - ey * ux) <= 10 + e.r) applyBurn(e, z.stacks);
    }
  }
  S.zones = S.zones.filter(z => z.life > 0);
  // Separación entre enemigos
  for (let i = 0; i < S.enemies.length; i++) for (let j = i + 1; j < S.enemies.length; j++) {
    const a = S.enemies[i], b = S.enemies[j];
    if (a.spawn > 0 || b.spawn > 0) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 1;
    if (d < min) { const push = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
  }
  for (const e of S.enemies) { e.x = clamp(e.x, e.r + 2, T.room.w - e.r - 2); e.y = clamp(e.y, e.r + 2, T.room.h - e.r - 2); }
  S.enemies = S.enemies.filter(e => e.hp > 0);

  // Proyectiles enemigos
  for (const s of S.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.x < 0 || s.y < 0 || s.x > T.room.w || s.y > T.room.h) s.life = 0;
    if (s.life > 0 && Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r) { if (p.inv <= 0) { hurtPlayer(s.dmg); s.life = 0; } }
  }
  S.shots = S.shots.filter(s => s.life > 0);

  // Efectos
  for (const f of S.fx) { f.t += dt; if (f.k === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; } if (f.k === 'num') f.y -= 22 * dt; }
  S.fx = S.fx.filter(f => f.t < f.life);
}

// ───────────────────────── Elección entre salas ─────────────────────────
let pickHead = { eyebrow: '', title: '' }, pickQueue = [];
const fusedName = (slot, f, g) => { const pr = PAIRS[[f, g].sort().join('+')], n = FUSE_NOUN[slot]; return n[0] + ' ' + (n[1] === 'F' ? pr.adjF : pr.adjM); };

function pieceOptions(fam) {
  const out = [];
  for (const pc of PIECES.filter(x => x.fam === fam).sort(() => Math.random() - 0.5)) {
    const a = S.build[pc.slot], cur = a.parts[fam] || 0, held = Object.keys(a.parts);
    const inFuse = !!a.fused && a.fused.includes(fam);
    const o = { tag: SLOTS[pc.slot], name: pc.name, color: FAM[fam].color, note: '' };
    if (cur) {                                   // ya la llevas: sube de nivel
      if (cur >= 3) continue;
      const nl = cur + 1 + (inFuse ? 1 : 0);
      o.name += ' ' + ROMAN[nl]; o.desc = pc.desc(nl);
      o.note = 'Sube de nivel' + (inFuse ? ' dentro de tu ' + fusedName(pc.slot, a.fused[0], a.fused[1]) : '');
      o.apply = () => { a.parts[fam] = cur + 1; };
    } else if (held.length === 1 && !a.fused) {  // hay otra pieza suelta en esa acción: se funden
      const g = held[0], pr = PAIRS[[fam, g].sort().join('+')], other = pieceOf(pc.slot, g);
      o.tag = 'Fusión · ' + SLOTS[pc.slot]; o.name = fusedName(pc.slot, fam, g); o.color = pr.color;
      o.desc = `Fundes ${pc.name} con tu ${other.name}. Hacen efecto las dos con un nivel más y ocupan una sola ranura. ${pc.name}: ${pc.desc(2)}`;
      o.note = syn(pr.id) ? pr.name + ' ya está activo' : 'Activa ' + pr.name + ': ' + pr.desc;
      o.apply = () => { a.parts[fam] = 1; a.fused = [g, fam]; };
    } else {
      o.desc = pc.desc(1); o.note = held.length ? 'Va a la segunda ranura' : 'Ranura libre';
      o.apply = () => { a.parts[fam] = 1; };
    }
    out.push(o);
  }
  return out.slice(0, 3);
}
function planOptions() {
  const hasForm = PLANS.some(pl => pl.form && S.plans.has(pl.id));
  return PLANS.filter(pl => !S.plans.has(pl.id) && !(pl.form && hasForm)).sort(() => Math.random() - 0.5).slice(0, 3)
    .map(pl => ({ tag: 'Plano', name: pl.name, desc: pl.desc, note: pl.form ? 'Cambia el disparo básico' : '', color: C.ink, apply: () => { S.plans.add(pl.id); } }));
}
function statOptions() {
  return UPGRADES.slice().sort(() => Math.random() - 0.5).slice(0, 3)
    .map(u => ({ tag: 'Ajuste', name: u.name, desc: u.desc, note: '', color: C.energy, apply: () => u.apply(S.p) }));
}
const statScreen = () => ({ eyebrow: 'Yunque', title: 'Afina el rifle', opts: statOptions() });
function advancePick() {
  while (pickQueue.length) {
    const scr = pickQueue.shift()();
    if (!scr || !scr.opts.length) continue;
    pickHead = { eyebrow: scr.eyebrow, title: scr.title }; pickOpts = scr.opts; pickSel = Math.min(1, scr.opts.length - 1);
    setMode('pick'); return;
  }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}
function openPick() {
  S.p.hp = Math.min(S.p.maxHp, S.p.hp + 15);
  pickQueue = [];
  const n = S.wave, fam = S.drop ? S.drop.fam : null;
  if (fam) pickQueue.push(() => { const o = pieceOptions(fam); return o.length ? { eyebrow: 'Sala ' + n + ' superada', title: 'Desmontas: ' + FAM[fam].name, opts: o } : statScreen(); });
  if (n % 3 === 2) pickQueue.push(() => ({ eyebrow: 'Plano de reforja', title: 'Cambia cómo funciona el rifle', opts: planOptions() }));
  else if (n % 2 === 0) pickQueue.push(statScreen);
  advancePick();
}
function choosePick(i) {
  if (S.mode !== 'pick' || modeT < 0.45 || !pickOpts[i]) return;
  pickOpts[i].apply(); S.buildV += 1;
  blip(660, 0.12, 'triangle', 0.05, 500);
  advancePick();
}
function buildHtml(full) {
  const rows = [];
  const row = (label, color, name, sub) => rows.push(`<li><em style="color:${color}">${label}</em><b>${name}</b>${sub ? `<span>${sub}</span>` : ''}</li>`);
  for (const k of SLOT_KEYS) {
    const a = S.build[k], fams = Object.keys(a.parts), pr = pairOf(a);
    if (!fams.length) { if (full) rows.push(`<li><em>${SLOTS[k]}</em><span>Dos ranuras libres</span></li>`); continue; }
    const pcOf = f => pieceOf(k, f), nm = f => pcOf(f).name + ' ' + ROMAN[lv(pcOf(f).id)];
    if (pr) row(SLOTS[k], pr.color, fusedName(k, a.fused[0], a.fused[1]),
      full ? a.fused.map(f => pcOf(f).desc(lv(pcOf(f).id))).join(' ') + ' ' + pr.name + ': ' + pr.desc : a.fused.map(nm).join(' + '));
    for (const f of fams) if (!pr || !a.fused.includes(f)) row(SLOTS[k], FAM[f].color, nm(f), full ? pcOf(f).desc(lv(pcOf(f).id)) : '');
  }
  for (const id of S.plans) { const pl = PLANS.find(x => x.id === id); row('Plano', C.ink, pl.name, full ? pl.desc : ''); }
  return rows.join('');
}

// ───────────────────────── Interfaz (DOM) ─────────────────────────
const ov = $('overlay'), ovBody = $('ovBody');
const HINTS = {
  pad: 'Stick izq. mover · A o RT disparar · B o RB esquivar · X o LT cargar · Stick der. cambiar objetivo · Start pausa',
  kb: 'WASD mover · Espacio disparar · Shift esquivar · E cargar · Clic en un enemigo para fijarlo · Esc pausa',
  touch: 'Toca un enemigo para fijarlo como objetivo',
  none: 'Pulsa un botón del mando, una tecla o la pantalla',
};

function renderOverlay() {
  const m = S.mode;
  ov.hidden = m === 'play';
  if (m === 'play') { ovBody.innerHTML = ''; return; }
  let h = '';
  if (m === 'title') {
    h = `<p class="eyebrow">Prototipo de combate</p><h1>Sala de Kiteo</h1>
      <p class="lead">Eres un herrero con un rifle de energía. Cada disparo te frena un instante: dispara, da un paso, dispara. Si pulsas a ritmo te mueves a toda velocidad entre disparos. Si mantienes pulsado, disparas igual pero andando despacio.</p>
      <p class="lead">En cada sala hay un campeón que lleva un arma. Mátalo y, al limpiar la sala, la desmontas e injertas una de sus piezas en una acción del rifle: disparo, cargado, esquive o pasiva. Cada acción tiene dos ranuras, y si juntas dos piezas de armas distintas en la misma acción se funden en una más fuerte. En las salas 2, 5 y 8 encuentras un plano que cambia cómo dispara el rifle.</p>
      <dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo o apuntar el cargado</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl>
      <button id="ovBtn" class="primary">Empezar</button>
      <p class="fine">Con mando: pulsa cualquier botón para que el navegador lo detecte, y después A. En el móvil, juega en horizontal.</p>`;
  } else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · sala ${S.wave}</p><h1>Tu rifle</h1><ul class="build full">${buildHtml(true)}</ul><button id="ovBtn" class="primary">Seguir</button>`;
  } else if (m === 'dead') {
    h = `<p class="eyebrow">Has muerto</p><h1>Vuelves atrás, recordándolo todo</h1>
      <p class="lead">Llegaste a la sala ${S.wave} con ${S.kills} bajas. Tu mejor marca es la sala ${best}.</p>
      <button id="ovBtn" class="primary">Otra vez</button>`;
  } else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1><div class="cards">` +
      pickOpts.map((u, i) => `<button class="card${i === pickSel ? ' sel' : ''}" data-i="${i}" id="card${i}" style="--fam:${u.color}"><em>${u.tag}</em><strong>${u.name}</strong><span>${u.desc}</span>${u.note ? `<small>${u.note}</small>` : ''}</button>`).join('') +
      `</div><p class="fine">Izquierda y derecha para elegir, disparar para confirmar. O toca una.</p>`;
  }
  ovBody.innerHTML = h;
  const b = $('ovBtn');
  if (b) b.addEventListener('click', () => { audioInit(); primaryAction(true); });
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
function primaryAction(force) {
  if (S.mode === 'title') startRun();
  else if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'dead' && (force || modeT > 0.8)) startRun();
}

$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').addEventListener('click', () => { muted = !muted; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); });

let hudKey = '';
function renderHud() {
  const p = S.p;
  const dev = padBlocked ? 'Mando bloqueado en esta vista' : padName ? 'Mando conectado' : lastDev === 'touch' ? 'Táctil' : lastDev === 'kb' ? 'Teclado' : 'Mando no detectado';
  const left = S.enemies.length + S.queue.length;
  const key = [Math.ceil(p.hp), p.maxHp, S.wave, left, dev, lastDev, periodOf().toFixed(3), Math.round(p.dmg), Math.round(rangeOf()), S.mode, S.buildV].join('|');
  if (key === hudKey) return; hudKey = key;
  $('hpFill').style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  $('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
  $('wave').textContent = S.wave ? 'Sala ' + S.wave + ' · quedan ' + left : '';
  $('build').innerHTML = buildHtml(false);
  $('stats').textContent = S.wave ? (1 / periodOf()).toFixed(2) + ' disparos/s · ' + Math.round(p.dmg) + ' daño · ' + Math.round(rangeOf()) + ' alcance' : '';
  $('dev').textContent = dev;
  $('hint').textContent = HINTS[lastDev] || HINTS.none;
  $('touch').hidden = lastDev !== 'touch';
}

// ───────────────────────── Dibujo ─────────────────────────
function resize() {
  const w = cv.clientWidth || 1, h = cv.clientHeight || 1, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === view.cssW && h === view.cssH && dpr === view.dpr) return;
  view.cssW = w; view.cssH = h; view.dpr = dpr;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  view.s = Math.sqrt(cv.width * cv.height / T.viewArea);
  view.w = cv.width / view.s; view.h = cv.height / view.s;
}

function shapePath(shape, x, y, r, dir) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
  else if (shape === 'diamond') { ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.25); ctx.lineTo(x - r, y); ctx.closePath(); }
  else { for (let i = 0; i < 3; i++) { const a = dir + i * Math.PI * 2 / 3; const rr = i === 0 ? r * 1.6 : r * 1.1; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
}

function render() {
  const p = S.p, s = view.s, R = T.room;
  cam.x = view.w >= R.w + 40 ? (R.w - view.w) / 2 : clamp(p.x - view.w / 2, -20, R.w - view.w + 20);
  cam.y = view.h >= R.h + 40 ? (R.h - view.h) / 2 : clamp(p.y - view.h / 2, -20, R.h - view.h + 20);
  const shx = (Math.random() - 0.5) * S.shake, shy = (Math.random() - 0.5) * S.shake;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = C.wall; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(s, 0, 0, s, -(cam.x + shx) * s, -(cam.y + shy) * s);

  // Suelo en damero (da referencia de movimiento)
  ctx.fillStyle = C.floor; ctx.fillRect(0, 0, R.w, R.h);
  const ts = 40; ctx.fillStyle = C.tile;
  const x0 = Math.max(0, Math.floor(cam.x / ts)), x1 = Math.min(Math.ceil(R.w / ts), Math.ceil((cam.x + view.w) / ts) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / ts)), y1 = Math.min(Math.ceil(R.h / ts), Math.ceil((cam.y + view.h) / ts) + 1);
  for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) if ((tx + ty) & 1) ctx.fillRect(tx * ts, ty * ts, Math.min(ts, R.w - tx * ts), Math.min(ts, R.h - ty * ts));
  ctx.strokeStyle = C.edge; ctx.lineWidth = 3; ctx.strokeRect(0, 0, R.w, R.h);

  if (S.mode === 'title') return;

  // Alcance
  ctx.beginPath(); ctx.arc(p.x, p.y, rangeOf(), 0, Math.PI * 2);
  ctx.strokeStyle = C.energy; ctx.globalAlpha = S.noTarget > 0 ? 0.55 : 0.13; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

  // Previsualización del disparo cargado
  if (p.charging) {
    const ratio = clamp(p.charge / T.charge.full, 0, 1), ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir);
    ctx.strokeStyle = C.energy; ctx.globalAlpha = p.charge >= T.charge.min ? 0.18 + 0.3 * ratio : 0.08; ctx.lineWidth = 2 + ratio * T.charge.width * 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + ux * T.charge.range, p.y + uy * T.charge.range); ctx.stroke(); ctx.globalAlpha = 1;
  }

  // Fuego en el suelo y arma caída
  for (const z of S.zones) {
    if (z.r) { ctx.fillStyle = FAM.fire.color; ctx.globalAlpha = 0.2 * Math.min(1, z.life) + 0.04 * Math.sin(S.t * 14); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.strokeStyle = FAM.fire.color; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.22 * Math.min(1, z.life); ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
    ctx.globalAlpha = 0.5 * Math.min(1, z.life); ctx.lineWidth = 5 + Math.sin(S.t * 14) * 1.5; ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
  }
  if (S.drop) {
    const d = S.drop, r = 6 + Math.sin(S.t * 6);
    ctx.fillStyle = FAM[d.fam].color; ctx.beginPath(); ctx.moveTo(d.x, d.y - r * 1.4); ctx.lineTo(d.x + r, d.y); ctx.lineTo(d.x, d.y + r * 1.4); ctx.lineTo(d.x - r, d.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  }

  // Enemigos
  for (const e of S.enemies) {
    if (e.spawn > 0) {
      ctx.strokeStyle = e.color; ctx.globalAlpha = 0.6; ctx.lineWidth = e.champ ? 2.2 : 1.2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 10 * (e.spawn / 0.65), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; continue;
    }
    if (e.wind > 0) { // aviso de golpe
      const k = 1 - e.wind / e.type.wind;
      ctx.fillStyle = C.ink; ctx.globalAlpha = 0.14 + 0.2 * k; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + e.type.reach * k + 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (e.cast > 0) { ctx.strokeStyle = C.arcane; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4 + 6 * (e.cast / 0.55), 0, Math.PI * 2); ctx.stroke(); }
    if (e.lungeWind > 0) { // aviso de embestida
      const a = Math.atan2(e.lvy, e.lvx);
      ctx.strokeStyle = e.color; ctx.globalAlpha = 0.25 + 0.4 * (1 - e.lungeWind / 0.5); ctx.lineWidth = e.r * 2;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 95, e.y + Math.sin(a) * 95); ctx.stroke(); ctx.globalAlpha = 1;
    }
    shapePath(e.type.shape, e.x, e.y, e.r, e.dir);
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.frozen > 0 ? '#d6f1ff' : e.champ ? e.type.color : e.color; ctx.fill();
    ctx.strokeStyle = C.wall; ctx.lineWidth = 1.2; ctx.stroke();
    if (e.champ) { // el arma que lleva, en el color de su familia
      const wx = Math.cos(e.dir), wy = Math.sin(e.dir);
      ctx.strokeStyle = e.color; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x + wx * 3, e.y + wy * 3); ctx.lineTo(e.x + wx * (e.r + 9), e.y + wy * (e.r + 9)); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3.5, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.burn > 0) { ctx.strokeStyle = FAM.fire.color; ctx.lineWidth = 0.8 + 0.35 * e.burn; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (e.chill > 0) { ctx.strokeStyle = FAM.frost.color; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e.chill / 5); ctx.stroke(); }
    if (e.hp < e.maxHp) {
      const w = e.r * 2 + 4; ctx.fillStyle = C.wall; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w, 2.5);
      ctx.fillStyle = C.ink; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w * clamp(e.hp / e.maxHp, 0, 1), 2.5);
    }
  }

  // Marca de objetivo
  const tg = S.target && active(S.target) ? S.target : null;
  if (tg) {
    const locked = S.lock === tg, r = tg.r + 5 + Math.sin(S.t * 8) * 0.8;
    ctx.strokeStyle = locked ? C.ember : C.energy; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + (locked ? Math.PI / 4 : 0); ctx.beginPath(); ctx.arc(tg.x, tg.y, r, a - 0.35, a + 0.35); ctx.stroke(); }
  }

  // Proyectiles enemigos
  for (const sh of S.shots) {
    ctx.fillStyle = C.arcane; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2); ctx.fill();
  }

  // Efectos bajo el jugador
  for (const f of S.fx) if (f.k === 'ghost') { ctx.fillStyle = C.ember; ctx.globalAlpha = 0.35 * (1 - f.t / f.life); ctx.beginPath(); ctx.arc(f.x, f.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

  // Jugador
  const blink = p.inv > 0 && p.dodgeT <= 0 && Math.floor(S.t * 30) % 2 === 0;
  if (!blink) {
    const fx = Math.cos(p.face), fy = Math.sin(p.face);
    const winding = p.windup > 0, glow = winding || p.charging;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3d4458'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(p.x - fx * 3, p.y - fy * 3); ctx.lineTo(p.x + fx * 17, p.y + fy * 17); ctx.stroke();
    ctx.strokeStyle = glow ? '#ffffff' : slotColor('basic'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x + fx * 5, p.y + fy * 5); ctx.lineTo(p.x + fx * 17, p.y + fy * 17); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = C.ember; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.wall; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // Anillo de ritmo: se llena mientras recarga; brilla cuando puedes disparar
  const period = periodOf(), a0 = -Math.PI / 2;
  if (p.windup > 0) { ctx.strokeStyle = C.ember; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * (1 - p.windup / p.windupTotal)); ctx.stroke(); }
  else if (p.cd > 0) { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * (1 - p.cd / period)); ctx.stroke(); ctx.globalAlpha = 1; }
  else { ctx.strokeStyle = C.energy; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2); ctx.stroke(); }
  if (S.plans.has('double')) for (let i = 0; i < 2; i++) { ctx.fillStyle = i < p.dodgeN ? C.ink : C.edge; ctx.fillRect(p.x - 4 + i * 5, p.y + p.r + 10, 3, 3); }
  if (p.chargeCd > 0) { ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8.5, a0, a0 + Math.PI * 2 * (1 - p.chargeCd / p.chargeCdMax)); ctx.stroke(); ctx.globalAlpha = 1; }

  // Efectos sobre todo
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'tracer') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k; ctx.lineWidth = (2.2 * k + 0.6) * (f.w || 1); ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
    else if (f.k === 'ring') { ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 3 * k + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - 0.6 * k), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = f.col; ctx.globalAlpha = 0.18 * k; ctx.fill(); }
    else if (f.k === 'beam') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k * 0.5; ctx.lineWidth = f.w * 3 * k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = k; ctx.lineWidth = f.w * k; ctx.stroke(); }
    else if (f.k === 'lob') { const u = f.t / f.life, x = f.x1 + (f.x2 - f.x1) * u, y = f.y1 + (f.y2 - f.y1) * u - Math.sin(u * Math.PI) * 26; ctx.fillStyle = f.col; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    else if (f.k === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = k; ctx.fillRect(f.x - 1, f.y - 1, 2, 2); }
    else if (f.k === 'num') { ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = f.col || (f.big ? C.ember : C.ink); ctx.font = `600 ${f.big ? 12 : 8}px "Pixelify Sans", ui-monospace, monospace`; ctx.textAlign = 'center'; ctx.fillText(f.txt, f.x, f.y); }
    ctx.globalAlpha = 1;
  }

  // Capa de pantalla
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (S.hurtFx > 0) { ctx.fillStyle = C.blood; ctx.globalAlpha = S.hurtFx * 0.7; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
  if (touch.joyId !== null) {
    const r = cv.getBoundingClientRect(), d = view.dpr, ox = (touch.ox - r.left) * d, oy = (touch.oy - r.top) * d;
    let dx = (touch.x - touch.ox) * d, dy = (touch.y - touch.oy) * d; const m = Math.hypot(dx, dy), max = 46 * d;
    if (m > max) { dx *= max / m; dy *= max / m; }
    ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.3; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(ox, oy, max, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(ox + dx, oy + dy, 20 * d, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
}

// ───────────────────────── Bucle ─────────────────────────
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  resize(); pollInput(); modeT += dt;
  const m = S.mode;
  if (m === 'play') { if (I.startP) setMode('pause'); else update(dt); }
  else if (m === 'pick') {
    let moved = false;
    if (I.navL && pickSel > 0) { pickSel--; moved = true; }
    if (I.navR && pickSel < pickOpts.length - 1) { pickSel++; moved = true; }
    if (moved) { ovBody.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === pickSel)); blip(700, 0.03, 'triangle', 0.03); }
    if (I.atkP) choosePick(pickSel);
  } else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  render(); renderHud();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Acceso para pruebas
window.__kiteo = { get state() { return S; }, T, PIECES, PLANS };
})();
