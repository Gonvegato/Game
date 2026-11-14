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
      face: 0, drillN: 0, drillT: null, fly2: 0, lastShotT: -9, overT: 0, rotaT: null, grow: 0, leechN: 0, danced: false, idle: 0, alt: false, comboN: 0, comboT: null, venge: 0, temper: 0, redhot: 0, broke: false, pend: 0, clip: 0, orbA: 0, orbAway: 0, wardCd: 0, runUp: 0, drumT: null, pity: 0, streak: 0, quick: 0, quickBig: false, buttCd: 0, cd: 0, windup: 0, windupTotal: 0, windupTarget: null, buffer: 0, wasReady: true, readyT: 0, spoil: false, crit: false, spin: 0,
      dodgeT: 0, dodgeCd: T.dodge.cd, dodgeN: 1, dodgeFrom: null, dodgeHit: new Set(), isLunge: false, fly: false, dvx: 0, dvy: 0, inv: 0, lanceDmg: 0,
      charging: false, charge: 0, chargeCd: 0, chargeCdMax: T.charge.cd, chargeDir: 0, drawing: false, draw: 0, drawPow: 0,
      fury: 0, furyT: 0, reserve: 0, resT: 0, gold: 0, revive: 0, heat: 0, heatT: 0, over: 0, gat: 0, shells: 2, trig: 0, still: 0, feastShot: false,
    },
    enemies: [], shots: [], fx: [], queue: [], lock: null, target: null,
    build: { basic: null, charge: null, dodge: null, passive: null }, techs: new Set(), plans: new Set(), drop: null,
    mirrors: [], pets: [], wells: [], mines: [], traps: [], stat: { horn: 0, ends: 0, net: 0, over: 0, awl: 0, timed: 0, wind: 0, blink: 0, quake: 0, choir: 0, themed: 0, quickb: 0, grave: 0, boom: 0, nail: 0, arc: 0, far: 0, swarm: 0, spring: 0, kick: 0, rider: 0, traced: 0, splash: 0, split: 0, meteor: 0, cchain: 0, balm: 0, cbounce: 0, volley: 0, mirror: 0, mcharge: 0, bite: 0, pounce: 0, temper: 0, share: 0, sleep: 0, well: 0, frozen: 0, shatter: 0, doom: 0, bleed: 0, fork: 0, hook: 0, flame: 0, rear: 0, flail: 0, first: 0, freeze: 0, frag: 0, last: 0, hop: 0, spk: 0, block: 0, orb: 0, mine: 0, onetwo: 0, spike: 0, sprout: 0, crit: 0, heads: 0, tails: 0, dice: 0, finish: 0, quick: 0, tempo: 0, bounce: 0, bombs: 0, bombHits: 0, chain: 0, blessed: 0, slam: 0, butt: 0 }, zones: [], timers: [], walls: titleWalls, roomKind: '', turrets: [], crystals: [], shades: [], fields: [], hazards: [], lasers: [],
  };
}
function setMode(m) { S.mode = m; modeT = 0; renderOverlay(); }
function startRun(mission) {
  newGame(); M.run = null; S.mission = mission;
  const p = S.p;   // lo que traes de otras vidas: tu arma y tu árbol
  S.gun = Object.assign({}, M.gun);
  p.maxHp += 10 * tk('hp'); p.dmg *= 1 + 0.04 * tk('dmg'); p.speed *= 1 + 0.03 * tk('feet'); p.gold = 25 * tk('purse');
  p.hp = p.maxHp; p.revive = tk('revive') ? 1 : 0; p.dodgeN = dodgeMax();
  S.next = { type: 'god', god: GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)] };   // la primera sala siempre es de una deidad
  if (tk('recall')) {   // Recuerdo vivo: empiezas eligiendo una técnica
    const opts = PIECES.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(pieceCard).filter(Boolean);
    pickQueue = [() => ({ eyebrow: 'Lección del maestro', title: 'Recuerdas una técnica que te enseñó el herrero', opts })];
    advancePick(); return;
  }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}

// Entrar en la siguiente sala (o en el jefe del mundo)
function nextWave() {
  S.wave += 1;
  const ms = S.mission, n = S.wave, r = n, W = ms.z + 1, world = WORLDS[W - 1], K = KINGDOMS.find(x => x.id === ms.k);
  S.world = W; S.room = r; S.bossRoom = hasBoss(ms) && r === roomsOf(ms);
  // Nivel de dificultad: sube con la zona y con lo adentro que estés de la misión
  S.lvl = ms.z * 2.5 + (ms.type === 'doors' ? r : ms.type === 'defend' ? r * 1.15 : ms.type === 'assault' ? 1 + r * 2.6 : ms.type === 'boss' ? 2 + r * 1.3 : 9 + r * 1.2);
  const first = ms.z === 0 && ms.type === 'doors' && r === 1 && !isDone(ms.id), bossKey = ms.type === 'god' ? K.god : world.boss;
  S.roomType = S.bossRoom ? 'boss' : ms.type === 'defend' || ms.type === 'assault' ? ms.type : S.next.type; S.god = S.roomType === 'god' ? S.next.god : null;
  C.floor = world.floor; C.tile = world.tile; S.keep = null; S.defWave = ms.type === 'defend' ? r : 0;
  const list = [];
  if (S.bossRoom) list.push(bossKey);
  else if (ms.type === 'doors' || ms.type === 'boss' || ms.type === 'god') {
    let budget = first ? 5 : 4 + S.lvl * 2.5 + (S.roomType === 'god' || S.lvl < 4 ? 0 : 3);   // las primeras salas son suaves; a partir del nivel 10 es igual de duro que antes
    const pool = first ? ['stalker'] : world.pool;
    while (budget > 0.5 && list.length < 32) {
      const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5);
      if (!cand.length) break;
      const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost;
    }
    list.sort(() => Math.random() - 0.5);
    if (S.roomType === 'god') list.splice(Math.ceil(list.length / 2), 0, 'champ');   // el elegido de la deidad
    if (S.roomType === 'god' && S.lvl >= 12) list.push('champ');                    // muy adentro, los elegidos van de dos en dos
  }
  S.windUsed = false; S.debtUsed = false; S.drop = null; S.waveT = 0; S.waveClear = 0; S.firstKill = false;
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.3 }));
  S.wells = []; S.yawn = 3; S.mines = []; S.turrets = []; S.zones = []; S.crystals = []; S.shades = S.shades.filter(s => !s.temp); S.fields = []; S.hazards = []; S.lasers = []; S.shots = [];
  const room = ms.type === 'defend' ? buildRoom(false, 'aldea', 'big') : ms.type === 'assault' ? buildRoom(false, 'escombros', 'huge') : buildRoom(S.bossRoom);   // forma, tamaño y muros nuevos en cada sala
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.roomKind = room.kind; S.roomT = S.t; S.lastHitT = S.t; S.traps = first || ms.type === 'defend' || S.lvl < 3 ? [] : room.traps;
  S.p.x = room.start.x; S.p.y = room.start.y;
  for (const s of S.shades) { s.x = S.p.x + rnd(-20, 20); s.y = S.p.y + rnd(-20, 20); }
  if (r === 1) note(S.p.x, S.p.y - 30, ms.name, C.ink, true);
  if (S.bossRoom) note(S.p.x, S.p.y - 30, TYPES[bossKey].name, C.blood, true);
  if (ms.type === 'defend') { const mh = 700 + 150 * ms.z; S.keep = { x: T.room.w / 2, y: T.room.h / 2, r: 14, hp: Math.min(mh, S.keepHp == null ? mh : S.keepHp), maxHp: mh, flash: 0 }; fillDefWave(); }
  if (ms.type === 'assault') setupAssault();
  checkRes();   // lo que tu arma y tus técnicas despiertan juntas se anuncia al entrar
  saveRun();
}

function spawn(typeKey, q) {
  const ty = TYPES[typeKey], p = S.p; q = q || {};
  let x = 0, y = 0;
  const god = ty.champ ? (S.god || GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)]) : null;
  const hp = Math.round(ty.hp * (ty.boss ? (S.mission.type === 'god' ? 3.2 : 2 + 0.4 * S.mission.z) : 1 + 0.18 * (S.lvl - 1)));
  { const at = q.pos ? q.pos : q.near ? unstick(clamp(q.near.x + rnd(-46, 46), 20, T.room.w - 20), clamp(q.near.y + rnd(-46, 46), 20, T.room.h - 20)) : S.keep ? freeSpot(S.keep, Math.min(T.room.w, T.room.h) * 0.42) : freeSpot(p, Math.min(230, Math.hypot(T.room.w, T.room.h) * 0.3)); x = at.x; y = at.y; }
  const e = { type: ty, champ: !!ty.champ, boss: !!ty.boss, god, color: god ? GODS[god].color : ty.color, x, y, r: ty.r, hp, maxHp: hp, speed: ty.speed, dmg: ty.dmg,
    spawn: 0.65, flash: 0, kx: 0, ky: 0, wind: 0, rec: 0, cool: rnd(0.8, 1.8), cast: 0, dir: 0,
    ember: 0, emberT: 0, emberAcc: 0, venom: 0, venAcc: 0, needles: 0, needleT: 0, mark: 0, stun: 0, slowT: 0, slowF: 1, autoCd: 0, fieldAcc: 0, fling: 0, fvx: 0, fvy: 0,
    aiCd: rnd(1.2, 2.6), aimT: 0, leapT: 0, sx: 0, sy: 0, lx: 0, ly: 0,
    side: Math.random() < 0.5 ? 1 : -1, lungeCd: rnd(1.5, 3), lungeWind: 0, lungeT: 0, lvx: 0, lvy: 0, lungeHit: false };
  if (ty.boss) Object.assign(e, { x: T.room.w / 2, y: 5.5 * CELL, act: 'rest', at: 1.2, think: 1.2, ph: 1, last: '', hitOnce: false, castFn: null });
  // Élites: a partir del segundo mundo, algunos enemigos corrientes llegan con un rasgo y un aura que lo avisa
  if (!ty.boss && !ty.champ && !ty.fly && !ty.post && (S.world >= 2 || S.lvl >= 6) && Math.random() < 0.05 + 0.035 * S.world + 0.006 * S.lvl) {
    e.elite = ['fast', 'tough', 'volatile'][Math.floor(Math.random() * 3)];
    if (e.elite === 'fast') e.speed *= 1.45;
    if (e.elite === 'tough') { e.hp = e.maxHp = Math.round(hp * 2.4); e.dmg *= 1.25; }
  }
  if (q.raid) e.raid = true;
  if (has('z_yawn') && S.yawn > 0 && !ty.boss && !ty.post) { S.yawn--; e.sleep = 4.6; e.sleepHits = 0; }   // Bostezo
  if (ty.post) { e.px = x; e.py = y; e.aiCd = 3; e.elite = null; }
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

