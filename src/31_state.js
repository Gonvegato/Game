// ───────────────────────── Estado de la partida ─────────────────────────
let S = null, aimLatch = false, modeT = 0, pickSel = 1, pickOpts = [];
function newGame() {
  const P = T.player;
  { const room = buildRoom(false); T.room.w = room.w; T.room.h = room.h; var titleWalls = room.walls; }   // una sala de fondo para el título
  S = {
    mode: 'title', wave: 0, world: 1, room: 0, roomType: 'god', god: null, bossRoom: false, next: { type: 'god', god: null },
    gun: Object.assign({}, BASE_GUN), resSeen: new Set(), soulsRun: 0, ironRun: 0, matsRun: zeroMats(), rerolls: 0, kills: 0, shop: null, banquet: 0,
    t: 0, shake: 0, hitstop: 0, lastStop: -1, hurtFx: 0, noTarget: 0, waveT: 0, waveClear: 0,
    p: {
      x: T.room.w / 2, y: T.room.h / 2, r: P.r, hp: P.hp, maxHp: P.hp, dmg: P.dmg, as: P.as, range: P.range, speed: P.speed, shotN: 0, crysN: 0,
      face: 0, pity: 0, streak: 0, quick: 0, quickBig: false, buttCd: 0, cd: 0, windup: 0, windupTotal: 0, windupTarget: null, buffer: 0, wasReady: true, readyT: 0, spoil: false, crit: false, spin: 0,
      dodgeT: 0, dodgeCd: T.dodge.cd, dodgeN: 1, dodgeFrom: null, dodgeHit: new Set(), isLunge: false, fly: false, dvx: 0, dvy: 0, inv: 0, lanceDmg: 0,
      charging: false, charge: 0, chargeCd: 0, chargeCdMax: T.charge.cd, chargeDir: 0, drawing: false, draw: 0, drawPow: 0,
      fury: 0, furyT: 0, reserve: 0, resT: 0, gold: 0, revive: 0, heat: 0, heatT: 0, over: 0, gat: 0, shells: 2, trig: 0, still: 0, feastShot: false,
    },
    enemies: [], shots: [], fx: [], queue: [], lock: null, target: null,
    build: { basic: null, charge: null, dodge: null, passive: null }, techs: new Set(), plans: new Set(), drop: null,
    traps: [], stat: { spike: 0, sprout: 0, crit: 0, heads: 0, tails: 0, dice: 0, finish: 0, quick: 0, tempo: 0, bounce: 0, bombs: 0, bombHits: 0, chain: 0, blessed: 0, slam: 0, butt: 0 }, zones: [], timers: [], walls: titleWalls, roomKind: '', turrets: [], crystals: [], shades: [], fields: [], hazards: [], lasers: [],
  };
}
function setMode(m) { S.mode = m; modeT = 0; renderOverlay(); }
function startRun() {
  newGame(); M.run = null;
  const p = S.p;   // lo que traes de otras vidas: tu arma y tu árbol
  S.gun = Object.assign({}, M.gun);
  p.maxHp += 10 * tk('hp'); p.dmg *= 1 + 0.04 * tk('dmg'); p.speed *= 1 + 0.03 * tk('feet'); p.gold = 25 * tk('purse');
  p.hp = p.maxHp; p.revive = tk('revive') ? 1 : 0; p.dodgeN = dodgeMax();
  S.next = { type: 'god', god: GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)] };   // la primera sala siempre es de una deidad
  if (tk('recall')) {   // Recuerdo vivo: empiezas eligiendo una técnica
    const opts = PIECES.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(pieceCard).filter(Boolean);
    pickQueue = [() => ({ eyebrow: 'Recuerdo vivo', title: 'Recuerdas una técnica de otra vida', opts })];
    advancePick(); return;
  }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}

// Entrar en la siguiente sala (o en el jefe del mundo)
function nextWave() {
  S.wave += 1;
  const n = S.wave, W = Math.ceil(n / (RPW + 1)), r = n - (W - 1) * (RPW + 1), world = WORLDS[W - 1];
  S.world = W; S.room = r; S.bossRoom = r > RPW;
  S.roomType = S.bossRoom ? 'boss' : S.next.type; S.god = S.bossRoom ? null : S.next.god;
  C.floor = world.floor; C.tile = world.tile;
  const list = [];
  if (S.bossRoom) list.push(world.boss);
  else {
    let budget = n === 1 ? 5 : 6 + n * 1.45 + (S.roomType === 'god' ? 0 : 2.5);
    const pool = n === 1 ? ['stalker'] : world.pool;
    while (budget > 0.5 && list.length < 20) {
      const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5);
      if (!cand.length) break;
      const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost;
    }
    list.sort(() => Math.random() - 0.5);
    if (S.roomType === 'god') list.splice(Math.ceil(list.length / 2), 0, 'champ');   // el elegido de la deidad
  }
  S.drop = null; S.waveT = 0; S.waveClear = 0; S.firstKill = false;
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.36 }));
  S.turrets = []; S.zones = []; S.crystals = []; S.shades = S.shades.filter(s => !s.temp); S.fields = []; S.hazards = []; S.lasers = []; S.shots = [];
  const room = buildRoom(S.bossRoom);   // forma, tamaño y muros nuevos en cada sala
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.roomKind = room.kind; S.roomT = S.t; S.lastHitT = S.t; S.traps = n === 1 ? [] : room.traps;
  S.p.x = room.start.x; S.p.y = room.start.y;
  for (const s of S.shades) { s.x = S.p.x + rnd(-20, 20); s.y = S.p.y + rnd(-20, 20); }
  if (r === 1) note(S.p.x, S.p.y - 30, world.name, C.ink, true);
  if (S.bossRoom) note(S.p.x, S.p.y - 30, TYPES[world.boss].name, C.blood, true);
  saveRun();
}

function spawn(typeKey) {
  const ty = TYPES[typeKey], p = S.p;
  let x = 0, y = 0;
  const god = ty.champ ? (S.god || GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)]) : null;
  const hp = Math.round(ty.hp * (1 + 0.16 * (S.wave - 1)));
  { const at = freeSpot(p, Math.min(230, Math.hypot(T.room.w, T.room.h) * 0.3)); x = at.x; y = at.y; }
  const e = { type: ty, champ: !!ty.champ, boss: !!ty.boss, god, color: god ? GODS[god].color : ty.color, x, y, r: ty.r, hp, maxHp: hp, speed: ty.speed, dmg: ty.dmg,
    spawn: 0.65, flash: 0, kx: 0, ky: 0, wind: 0, rec: 0, cool: rnd(0.8, 1.8), cast: 0, dir: 0,
    ember: 0, emberT: 0, emberAcc: 0, venom: 0, venAcc: 0, needles: 0, needleT: 0, mark: 0, stun: 0, slowT: 0, slowF: 1, autoCd: 0, fieldAcc: 0, fling: 0, fvx: 0, fvy: 0,
    aiCd: rnd(1.2, 2.6), aimT: 0, leapT: 0, sx: 0, sy: 0, lx: 0, ly: 0,
    side: Math.random() < 0.5 ? 1 : -1, lungeCd: rnd(1.5, 3), lungeWind: 0, lungeT: 0, lvx: 0, lvy: 0, lungeHit: false };
  if (ty.boss) Object.assign(e, { x: T.room.w / 2, y: 5.5 * CELL, act: 'rest', at: 1.2, think: 1.2, ph: 1, last: '', hitOnce: false, castFn: null });
  // Élites: a partir del segundo mundo, algunos enemigos corrientes llegan con un rasgo y un aura que lo avisa
  if (!ty.boss && !ty.champ && !ty.fly && S.world >= 2 && Math.random() < 0.05 + 0.035 * S.world) {
    e.elite = ['fast', 'tough', 'volatile'][Math.floor(Math.random() * 3)];
    if (e.elite === 'fast') e.speed *= 1.45;
    if (e.elite === 'tough') { e.hp = e.maxHp = Math.round(hp * 2.4); e.dmg *= 1.25; }
  }
  S.enemies.push(e); collide(e, ty.r);
  if (god) say(god, 'enter');
}

// ───────────────────────── Mensajes del sistema ─────────────────────────
const sysEl = $('sys'); let sysQ = [], sysT = 0, sysLast = 0;
function sayRaw(text, color) { sysQ.push({ text, color }); if (sysQ.length > 3) sysQ.shift(); }
function say(god, kind) { const g = GODS[god], arr = g.lines[kind]; if (arr) sayRaw(`[La deidad «${g.title}» ${arr[Math.floor(Math.random() * arr.length)]}]`, g.color); }
function sysTick() {
  const now = performance.now(), dt = Math.min(0.1, (now - sysLast) / 1000); sysLast = now;
  sysT -= dt;
  if (sysT > 0) return;
  if (sysQ.length) { const m = sysQ.shift(); sysEl.textContent = m.text; sysEl.style.borderColor = m.color; sysEl.hidden = false; sysT = 3.2; }
  else sysEl.hidden = true;
}

