// ───────────────────────── La cinemática del principio ─────────────────────────
// Alec cuenta su historia en seis escenas cortas. Cada escena es una sala de verdad del motor (su propio generador o la plaza),
// con personajes del atlas que andan, entran y caen, y bocadillos del sistema de conversación de la plaza.
// Disparar (A, Espacio, tocar) pasa de línea · Esquivar (B, Shift) salta la escena · Start (Esc, el botón de arriba) salta todo.
// Se ve la primera vez que se pulsa Empezar (M.seenIntro) y después desde la habitación de la posada.
const IC = n => n * CELL;
const ihash = (a, b) => { let h = (Math.floor(a) * 374761393 + Math.floor(b) * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ── Los escenarios: el pueblo de Alec, la forja del herrero y un camino entre reinos ──
ROOM_SIZES.intro_pueblo = [50, 22]; ROOM_SIZES.intro_camino = [50, 20];
// Una calle empedrada con cuatro casas en fila, el pozo y un huerto vallado. Las casas («ihouse») no las pinta el fondo:
// las dibuja la cinemática, enteras, ardiendo o quemadas, y ordenadas con los personajes.
ROOM_GEN.intro_pueblo = function (g, c, r) {
  OUT = { biome: 'grass', obs: [], spots: [], npcs: [], paths: [], bridges: [], paves: [] };
  outBorder(g, c, r);
  for (let y = 12; y < 15; y++) for (const x of [0, 1, c - 2, c - 1]) g[y][x] = 0;   // la calle sale del pueblo por los dos lados
  OUT.paves.push([0, 12, c, 3]);
  for (const [x, w, hs] of [[6, 6, 2], [14, 8, 0], [24, 6, 3], [32, 8, 1]]) ob(g, x, 8, w, 3, 'ihouse', { hs });
  for (const [x, y, v] of [[3, 9, 2], [12, 9, 1], [30, 9, 4], [41, 9, 0], [45, 9, 3], [22, 17, 5], [36, 17, 1], [42, 16, 2], [3, 17, 4]]) ob(g, x, y, 2, 2, 'tree', { v });
  ob(g, 22, 10, 1, 1, 'barrel', { v: 0 }); ob(g, 23, 10, 1, 1, 'barrel', { v: 2 }); ob(g, 28, 17, 2, 1, 'well');
  for (let x = 6; x < 16; x++) ob(g, x, 16, 1, 1, 'fence', { horiz: 1 });
  ob(g, 9, 17, 2, 2, 'prop', { k: 'scarecrow' }); ob(g, 13, 18, 2, 1, 'prop', { k: 'hay' }); ob(g, 18, 17, 2, 1, 'prop', { k: 'hay' }); ob(g, 32, 18, 2, 1, 'prop', { k: 'hay' });
  return [c >> 1, 13];
};
// La forja del herrero: como las de la plaza por dentro, con otro orden
ROOM_GEN.intro_forja = function (g, c, r) {
  OUT = { interior: 'forge', obs: [], spots: [], npcs: [], paths: [], bridges: [], props: [] };
  fillRect(g, 0, 0, c, 4); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r);
  const cx = c >> 1; for (let y = r - 2; y < r; y++) for (const x of [cx - 1, cx]) g[y][x] = 0;
  const put = (src, s, x, y, w, h) => { if (w) fillRect(g, Math.floor(x - w / 2), Math.floor(y - h), w, h); OUT.props.push({ src, s, x: x * CELL, y: y * CELL }); };
  put('town', 'workbench', 5.5, 6, 4, 1); put('town', 'furnace', c - 8.5, 6, 2, 1); put('town', 'furnace', c - 5, 6, 2, 1); put('town', 'anvil', cx - 1, 9, 4, 1);
  put('castle', [336, 1, 32, 26], 4, 12.6, 2, 1); put('bio', 'barrel0', c - 3.6, 12.8, 1, 1); put('bio', 'barrel2', c - 4.7, 13.1, 1, 1);
  return [cx, r - 4];
};
// Un camino de piedras sueltas entre árboles, rocas y ruinas viejas
ROOM_GEN.intro_camino = function (g, c, r) {
  OUT = { biome: 'grass', obs: [], spots: [], npcs: [], paths: [[[-3, 10.6], [c + 3, 10.6]]], bridges: [] };
  outBorder(g, c, r);
  for (let y = 9; y < 12; y++) for (const x of [0, 1, c - 2, c - 1]) g[y][x] = 0;
  for (const [x, y, k, v] of [[4, 5, 'tree', 0], [8, 14, 'tree', 3], [11, 4, 'ruin', 2], [14, 15, 'rock', 1], [17, 5, 'tree', 1], [21, 14, 'tree', 4], [24, 4, 'rock', 2], [27, 15, 'ruin', 5], [30, 5, 'tree', 5], [33, 14, 'tree', 2],
    [36, 4, 'ruin', 3], [39, 15, 'rock', 0], [42, 5, 'tree', 0], [45, 14, 'tree', 3], [7, 7, 'rock', 3], [20, 7, 'tree', 2], [34, 7, 'tree', 4], [12, 13, 'tree', 5], [29, 13, 'tree', 1], [44, 7, 'rock', 1]]) ob(g, x, y, 2, 2, k, { v });
  return [c >> 1, 10];
};

// Quién habla en los bocadillos (las líneas de Alec niño y muchacho son su voz de ahora, contando)
Object.assign(SPEAKER, { kid: ['Alec', '#9fd3ff'], teen: ['Alec', '#9fd3ff'], mother: ['Su madre', '#e6c07a'], oldsmith: ['El herrero', '#ff9a5c'], chosen: ['El elegido', '#e0524a'], guardia: ['Un guardia', '#cfd6de'] });

// ── El guion: cada escena monta su sala y sus actores; cada tiempo («beat») puede mover cosas (on), programar golpes (ev: [segundo, función])
// y, tras una espera, enseñar una línea. Al pasar de línea, lo que quedara a medias se da por hecho, para que la escena no se descoloque. ──
const INTRO_GONE = a => { a.hidden = true; };
const INTRO = [
  { cap: 'Hace muchos años', room: ['intro_pueblo', 'intro_pueblo'], amb: '#474b82',
    setup(R) {
      R.cam.x = IC(30); R.cam.y = IC(10.5); R.camTo = { x: IC(23), y: IC(10.5) }; R.camV = 0.45;
      Object.assign(R.houses[2], { fire: 0.85, fireTo: 1, char: 0.3 }); Object.assign(R.houses[3], { fire: 1, fireTo: 1, char: 0.45 });
      R.fires.push({ x: IC(33), y: IC(19) - 3, w: 20, h: 20, lvl: 1 }, { x: IC(44), y: IC(10.6), w: 14, h: 16, lvl: 1 });
      R.add('kid', 'alec_kid', 17.7, 13.6); R.add('mother', 'cit_peasant', 18.9, 12.8); R.add('sister', 'cit_tavern_b', 16.5, 13.1);
      R.go(R.add('v1', 'villager', 33, 13.7, { flip: true }), [[-3, 14]], 92, INTRO_GONE); R.go(R.add('v2', 'cit_tavern_a', 29.5, 12.9, { flip: true }), [[-3, 12.9]], 84, INTRO_GONE); R.go(R.add('v3', 'villager', 39, 14.4, { flip: true }), [[-3, 14.5]], 98, INTRO_GONE);
      R.add('g1', 'guard', 31, 13.5);
    },
    beats: [
      { wait: 1.5, who: 'kid', text: 'Yo era un niño cuando los ejércitos de los dioses llegaron a mi pueblo.' },
      { wait: 1.6, who: 'kid', text: 'No pidieron nada. Quemaron las casas y mataron a quien salía de ellas.',
        on(R) {
          [['s1', 'pc_skel_war', 52, 13.2, 32.2, 13.4], ['s2', 'pc_skel', 53.5, 14.3, 34, 14.3], ['s3', 'pc_skel_rogue', 55, 12.7, 35, 12.8], ['s4', 'brute', 56.5, 13.9, 37, 13.9], ['s5', 'pc_skel_war', 58, 14.6, 38.6, 14.6]]
            .forEach(([id, key, x, y, tx, ty]) => R.go(R.add(id, key, x, y, { flip: true }), [[tx, ty]], 90, id === 's1' ? () => { R.fall('g1', -1); R.shake(3); blip(160, 0.12, 'sawtooth', 0.04, -80); } : null));
          R.camTo.x = IC(24);
        } },
      { wait: 0.6, who: 'mother', text: '¡Corre, Alec! ¡Al bosque, y no mires atrás!', on(R) { R.houses[1].fireTo = 0.85; R.a('mother').flip = true; R.camTo.x = IC(21); } },
      { wait: 3.1, min: 0.6, who: 'kid', text: 'Corrí hasta los árboles. Y miré atrás.',
        on(R) {
          R.go('kid', [[4.6, 13.9]], 105, a => { a.flip = false; });
          R.a('mother').flip = false; R.go('mother', [[19.7, 12.9]], 40); R.go('sister', [[13.6, 13.3]], 30);
          R.go('s1', [[21, 13.1]], 72, () => { R.fall('mother', -1); R.shake(3); blip(150, 0.14, 'sawtooth', 0.04, -80); });
          R.go('s3', [[21.5, 14.3], [14.8, 13.5]], 86, () => { const s = R.a('sister'); s.path = []; R.fall(s, -1); blip(150, 0.14, 'sawtooth', 0.04, -80); });
          R.go('s2', [[23.5, 14.3]], 66); R.go('s4', [[26, 13.9]], 60); R.go('s5', [[28, 14.6]], 62);
          R.houses[0].fireTo = 0.7; R.camTo.x = IC(16); R.camV = 0.9;
        } },
    ] },
  { cap: 'A la mañana siguiente', room: ['intro_pueblo', 'intro_pueblo'], amb: '#a49fb2',
    setup(R) {
      R.burnt = true; R.cam.x = IC(16.5); R.cam.y = IC(10.5);
      for (const h of R.houses) h.smoke = 1;
      R.fires.push({ x: IC(19), y: IC(18) - 3, w: 8, h: 7, lvl: 0.6 }, { x: IC(21.2), y: IC(11) - 2, w: 10, h: 8, lvl: 0.6 }, { x: IC(33.5), y: IC(11) - 3, w: 12, h: 10, lvl: 0.6 }, { x: IC(26), y: IC(11) - 2, w: 8, h: 6, lvl: 0.6 }, { x: IC(8), y: IC(11) - 2, w: 8, h: 6, lvl: 0.6 });
      R.add('kid', 'alec_kid', 17.9, 13.3);
    },
    beats: [
      { wait: 1.3, who: 'kid', text: 'Por la mañana no quedaba nadie. Ni casas, ni vecinos, ni familia.',
        on(R) { R.go(R.add('oldsmith', 'oldsmith', -2.5, 14), [[15.7, 13.6]], 56, () => { R.a('kid').flip = true; }); } },
      { who: 'oldsmith', text: '¿Queda alguien más, chico?' },
      { who: 'kid', text: 'No.' },
      { who: 'oldsmith', text: 'Pues aquí ya no haces nada. Ven: en mi forja hace falta quien mueva el fuelle.' },
      { wait: 1.1, who: 'kid', text: 'Era herrero. Me dio techo, trabajo y pocas palabras.',
        on(R) { R.go('oldsmith', [[4, 14]], 38); }, ev: [[0.5, R => R.go('kid', [[5.8, 13.8]], 38)]] },
    ] },
  { cap: 'La forja', room: ['intro_forja', 'shop'], amb: '#b8a596',
    setup(R) { R.props.push({ x: IC(6.4), y: IC(10.4), draw: introAnvil }); R.add('oldsmith', 'oldsmith', 8.7, 11.6, { flip: true }); R.add('kid', 'alec_kid', 5.3, 10.5); },
    tick(R, dt) {
      R.acc += dt;
      if (R.stage === 0) {   // el niño, al yunque
        if (R.acc > 0.95) { R.acc = 0; R.a('kid').hop = 0.12; R.burst(IC(6.4), IC(10.4) - 15, 7, ['#ffe08a', '#ffb347', '#ff8a3c'], 40); blip(1250, 0.04, 'triangle', 0.02, -300); }
      } else {               // el muchacho, contra el muñeco
        const t = R.a('teen'), d = R.a('dummy');
        if (R.acc > 1.5) { R.acc = 0; t.once = { anim: 'atk', t0: R.t, dur: 10 / 14 }; R.hitT = 0.3; }
        if (R.hitT > 0) { R.hitT -= dt; if (R.hitT <= 0) { d.flash = 0.1; R.burst(d.x - 3, d.y - 11, 5, ['#efe6c8', '#c9b98a'], 34); blip(240, 0.05, 'square', 0.02, -80); } }
      }
    },
    beats: [
      { wait: 1.2, who: 'kid', text: 'Me crio entre el yunque y la fragua. Primero me enseñó a forjar.' },
      { who: 'oldsmith', text: 'El hierro no perdona las prisas. Otra vez.' },
      { wait: 1.4, min: 0.9, who: 'teen', text: 'Después, a pelear. Decía que quien forja un arma y no sabe usarla solo fabrica chatarra.',
        on(R) {
          R.dipTo(() => {
            R.a('kid').hidden = true; R.stage = 1; R.acc = 0.9; R.setCap('Años después');
            R.add('teen', 'alec_kid', 10.4, 12.2, { amb: true }); R.add('dummy', 'decoy', 13.2, 12.2, { amb: true });
            const s = R.a('oldsmith'); s.x = IC(15.8); s.y = IC(12); s.flip = true;
          });
        } },
      { who: 'teen', text: 'Fueron diez años. No he tenido otros mejores.' },
    ] },
  { cap: 'La última noche', room: ['intro_forja', 'shop'], amb: '#4c4166',
    setup(R) { R.props.push({ x: IC(6.4), y: IC(10.4), draw: introAnvil }); R.add('teen', 'alec_s', 6, 12.2); R.add('oldsmith', 'oldsmith', 8.6, 11.6); },
    beats: [
      { wait: 2.3, who: 'teen', text: 'Una noche entró en la forja un elegido: un hombre corrompido por el poder de un dios.',
        on(R) { R.go(R.add('chosen', 'champ', 10.5, 17.4, { glow: '255,70,60' }), [[10.5, 13.6], [12.2, 12.3]], 44); blip(90, 0.5, 'sawtooth', 0.03, -30); } },
      { who: 'chosen', text: 'Herrero. Tu fragua servirá a mi señor, o no servirá a nadie.' },
      { wait: 0.9, who: 'oldsmith', text: 'Aquí no se forja para ningún dios. Alec, atrás.', on(R) { R.go('oldsmith', [[9.9, 11.8]], 36); } },
      { wait: 1.6, min: 0.9, who: 'teen', text: 'Lo mató de un solo golpe. A mí ni me miró.',
        on(R) { const c = R.a('chosen'); c.once = { anim: 'atk', t0: R.t, dur: 8 / 16 }; R.go(c, [[11.2, 12]], 170); },
        ev: [[0.26, R => { const s = R.a('oldsmith'); s.path = []; s.flip = true; R.fall(s, -1); R.fx.push({ k: 'slash', x: s.x + 2, y: s.y - 14, a: Math.PI, t: 0, life: 0.3 }); R.flash = 0.7; R.shake(7); R.burst(s.x, s.y - 14, 10, ['#ffe08a', '#e0524a', '#ffffff'], 70); blip(110, 0.25, 'sawtooth', 0.06, -70); }],
          [1.25, R => R.go('chosen', [[10.5, 13.6], [10.5, 17.6]], 50, INTRO_GONE)]] },
      { wait: 1.2, who: 'teen', text: 'Enterré al herrero y me quedé con su martillo.', on(R) { R.go('teen', [[6.5, 12]], 30); } },
    ] },
  { cap: 'El camino', room: ['intro_camino', 'intro_camino'], amb: '#d6ad90',
    setup(R) {
      const a = R.add('alec', null, 2, 10.9, { hero: true, face: 0 }); R.follow = a; R.followOff = [IC(5), -IC(1)]; R.cam.x = a.x + IC(5); R.cam.y = a.y - IC(1);
      R.go(a, [[19, 10.9]], 54);
    },
    beats: [
      { wait: 1, who: 'alec', text: 'Con su martillo forjé esta ballesta. No he vuelto a soltarla.' },
      { wait: 0.6, who: 'alec', text: 'Desde entonces voy de reino en reino. Cobro por matar lo que los dioses envían.',
        on(R) { R.go(R.add('k1', 'pc_skel_war', 44, 10.8, { flip: true }), [[29, 10.8]], 72); R.go(R.add('k2', 'pc_skel', 46, 11.4, { flip: true }), [[31.5, 11.3]], 72); },
        ev: [[2.0, R => R.shoot('alec', 'k1')], [2.7, R => R.shoot('alec', 'k2')]] },
      { who: 'alec', text: 'No lo hago por el oro. Algún día mataré a los dioses.', on(R) { R.a('alec').aim = null; R.go('alec', [[23, 10.9]], 40); } },
      { who: 'alec', text: 'Y cuando caigan, echaré abajo su mundo. Piedra a piedra.' },
    ] },
  { cap: () => kingdomNow().title, room: ['plaza', 'plaza'], amb: null,
    setup(R) {
      const r = NAV.rows, cx = NAV.cols >> 1;
      for (const n of R.room.out.npcs) R.add(null, n.key, n.x, n.y, { flip: !!n.flip, amb: true });
      for (const w of R.room.out.wander || []) { const [ax, ay, aw, ah] = w.area; R.add(null, w.key, ax + Math.random() * aw, ay + Math.random() * ah, { amb: true, area: w.area, waitT: Math.random() * 2 }); }
      const a = R.add('alec', null, cx, r - 4.6, { hero: true, face: -Math.PI / 2 }); R.follow = a; R.followOff = [0, -IC(2.5)]; R.cam.x = a.x; R.cam.y = a.y - IC(2.5);
      R.go(a, [[cx, 19.3]], 60, q => { q.face = 0; });
      const gd = R.actors.find(q => q.key === 'guard' && q.x > a.x) || R.add(null, 'guard', cx + 3.2, 7.4); gd.id = 'guardia'; gd.amb = false;
    },
    tick(R, dt) {   // los vecinos pasean como en la plaza de verdad
      for (const n of R.actors) {
        if (!n.area || n.path.length) continue;
        n.waitT -= dt; if (n.waitT > 0) continue;
        const [ax, ay, aw, ah] = n.area; n.waitT = 1 + Math.random() * 3; R.go(n, [[ax + Math.random() * aw, ay + Math.random() * ah]], 22);
      }
    },
    beats: [
      { wait: 1.2, who: 'alec', text: () => `El siguiente contrato me trae a ${kingdomNow().name}. Su rey paga en hierro y no hace preguntas.`,
        ev: [[1.7, R => { const cx = NAV.cols >> 1; R.go('guardia', [[cx + 2.6, 9.2], [cx + 2.6, 18.4], [cx + 1.9, 19.2]], 66, q => { q.flip = true; }); }]] },
      { wait: 0.5, who: 'guardia', text: '¿Alec, el mercenario que no reza? El rey te espera en el castillo.' },
      { who: 'alec', text: 'Veamos cuánto paga por la cabeza de un dios.' },
    ] },
];

// ── Poner en marcha, pasar de escena y acabar ──
let introHudOn = false, introTap = false, INTRO_LM = null;
function playIntro() {
  newGame(); S.gun = Object.assign({}, M.gun);
  S.mode = 'intro'; modeT = 0; S.intro = { i: 0, b: 0, bt: 0, evi: 0, phase: 'wait', txt: '', R: null };
  introTap = false; renderOverlay(); introScene(0); blip(300, 0.3, 'triangle', 0.03, -120);
}
function introEnd() {
  S.dialog = null; S.intro = null;
  if (!M.seenIntro) { M.seenIntro = 1; save(); }
  openTown();
}
function introScene(i) {
  const N = S.intro, sc = INTRO[i], room = buildRoom(false, sc.room[0], sc.room[1]);
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.traps = []; S.world = 1; S.dialog = null;
  const R = N.R = {
    t: 0, room, actors: [], fx: [], fires: [], houses: [], props: [], cam: { x: room.w / 2, y: room.h / 2 }, camTo: null, camV: 1.6, follow: null, followOff: [0, 0],
    fade: 1, dip: null, shk: 0, flash: 0, cap: typeof sc.cap === 'function' ? sc.cap() : sc.cap, capT: 0, burnt: false, amb: sc.amb, stage: 0, acc: 0, hitT: 0,
    a: id => R.actors.find(q => q.id === id),
    add(id, key, x, y, o) { const a = Object.assign({ id, key, x: IC(x), y: IC(y), flip: false, path: [], speed: 60, walking: false, fall: null, fallDir: 1, hidden: false, ph: Math.random() * 3, once: null, flash: 0, hop: 0, kick: 0, then: null }, o); R.actors.push(a); return a; },
    go(a, pts, speed, then) { if (typeof a === 'string') a = R.a(a); if (!a || a.fall != null) return a; a.path = pts.map(p => [IC(p[0]), IC(p[1])]); a.speed = speed || 60; a.then = then || null; return a; },
    fall(a, dir) { if (typeof a === 'string') a = R.a(a); if (!a || a.fall != null) return; a.fall = 0; a.fallDir = dir || 1; a.path = []; a.walking = false; a.then = null; },
    burst(x, y, n, cols, v) { for (let k = 0; k < n; k++) { const an = Math.random() * Math.PI * 2, s = (0.4 + Math.random() * 0.6) * (v || 50); R.fx.push({ k: 'spark', x, y, vx: Math.cos(an) * s, vy: Math.sin(an) * s - 20, g: 120, t: 0, life: 0.25 + Math.random() * 0.35, col: cols[k % cols.length] }); } },
    shake(n) { R.shk = Math.max(R.shk, n); },
    dipTo(fn) { R.dip = { t: 0, fn, done: false }; },
    setCap(txt) { R.cap = txt; R.capT = 0; },
    shoot(from, to) {   // un virote de la ballesta: sale, llega y derriba
      const a = R.a(from), b = R.a(to); if (!a || !b || b.fall != null) return;
      a.aim = Math.atan2(b.y - a.y, b.x - a.x); a.kick = 3;
      R.fx.push({ k: 'bolt', x1: a.x + 12, y1: a.y - 11, x2: b.x, y2: b.y - 14, t: 0, life: 0.1, hit() { R.fall(b, 1); R.burst(b.x, b.y - 14, 6, ['#efe6c8', '#c9b98a'], 60); blip(200, 0.08, 'square', 0.04, -90); } });
      blip(520, 0.06, 'square', 0.04, -260);
    },
  };
  for (const o of room.out.obs) if (o.kind === 'ihouse') { const s = HOUSES[o.hs], cx = (o.x + o.w / 2) * CELL, by = (o.y + o.h) * CELL; R.houses.push({ hs: o.hs, s, cx, by, sx: Math.round(cx - s[2] / 2), sy: by + 2 - s[3], fire: 0, fireTo: 0, char: 0, smoke: 0 }); }
  N.i = i; sc.setup(R); introBeat(0, true);
}
// Cerrar el tiempo en curso: lo programado que no haya pasado, pasa; quien iba andando, llega
function introFinishBeat() {
  const N = S.intro, R = N.R, B = INTRO[N.i].beats[N.b];
  if (B && B.ev) while (N.evi < B.ev.length) B.ev[N.evi++][1](R);
  if (R.dip) { if (!R.dip.done) R.dip.fn(R); R.dip = null; R.fade = 0; }
  for (const f of R.fx) if (f.k === 'bolt' && f.hit) { f.hit(); f.hit = null; }
  for (const a of R.actors) if (!a.amb && a.path.length) { const p = a.path[a.path.length - 1]; a.x = p[0]; a.y = p[1]; a.path = []; a.walking = false; const f = a.then; a.then = null; if (f) f(a); }
  S.dialog = null;
}
function introBeat(k, fresh) {
  const N = S.intro, sc = INTRO[N.i];
  if (!fresh) introFinishBeat();
  if (k >= sc.beats.length) { N.phase = 'hold'; N.bt = 0; return; }
  N.b = k; N.bt = 0; N.evi = 0; N.phase = 'wait';
  const B = sc.beats[k]; if (B.on) B.on(N.R);
  if (!fresh) blip(620, 0.02, 'triangle', 0.02);
}
function introUpdate(dt) {
  const N = S.intro; if (!N) return;
  S.t += dt;
  const adv = I.atkP || introTap; introTap = false;
  if (I.startP && modeT > 0.2) { introEnd(); return; }
  const R = N.R, sc = INTRO[N.i]; R.t += dt;
  introSim(R, sc, dt);
  if (N.phase === 'out') { R.fade = Math.min(1, R.fade + dt / 0.45); if (R.fade >= 1) { if (N.i + 1 < INTRO.length) introScene(N.i + 1); else introEnd(); } return; }
  if (R.dip) {   // un fundido corto a negro para saltar en el tiempo dentro de la misma escena
    const d = R.dip; d.t += dt; R.fade = d.t < 0.35 ? d.t / 0.35 : Math.max(0, 1 - (d.t - 0.35) / 0.45);
    if (d.t >= 0.35 && !d.done) { d.done = true; d.fn(R); }
    if (d.t >= 0.8) R.dip = null;
  } else R.fade = Math.max(0, R.fade - dt / 0.6);
  if (I.dodgeP && R.t > 0.25) { introFinishBeat(); N.phase = 'out'; blip(420, 0.06, 'triangle', 0.03, -160); return; }
  if (N.phase === 'hold') { N.bt += dt; if (N.bt > 0.5) N.phase = 'out'; return; }
  const B = sc.beats[N.b]; N.bt += dt;
  if (B.ev) while (N.evi < B.ev.length && N.bt >= B.ev[N.evi][0]) B.ev[N.evi++][1](R);
  if (N.phase === 'wait') {
    if (N.bt >= (B.wait == null ? 0.35 : B.wait) || (adv && N.bt >= (B.min == null ? 0.25 : B.min))) {
      if (!B.text) { introBeat(N.b + 1); return; }
      N.txt = typeof B.text === 'function' ? B.text() : B.text; N.phase = 'say';
      S.dialog = { lines: [{ who: B.who, text: N.txt }], i: 0, ch: 0, choices: null, sel: 0, t: 0, onEnd: null };
    }
  } else {
    const d = S.dialog, len = N.txt.length; d.ch = Math.min(len, d.ch + dt * 48); d.t += dt;
    if (adv && d.t > 0.15) { if (d.ch < len) d.ch = len; else introBeat(N.b + 1); }
  }
}
// Lo que se mueve solo: actores, fuegos, chispas, humo y la cámara
function introSim(R, sc, dt) {
  for (const a of R.actors) {
    if (a.flash > 0) a.flash -= dt; if (a.hop > 0) a.hop -= dt; if (a.kick > 0) a.kick = Math.max(0, a.kick - dt * 22);
    if (a.fall != null) { a.fall += dt; continue; }
    if (!a.path.length) { a.walking = false; continue; }
    const [tx, ty] = a.path[0], dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), st = a.speed * dt;
    if (d <= st) { a.x = tx; a.y = ty; a.path.shift(); if (!a.path.length) { a.walking = false; const f = a.then; a.then = null; if (f) f(a); } }
    else { a.x += dx / d * st; a.y += dy / d * st; a.walking = true; if (Math.abs(dx) > 0.3) a.flip = dx < 0; if (a.hero) a.face = Math.atan2(dy, dx); }
  }
  if (sc.tick) sc.tick(R, dt);
  for (const h of R.houses) {
    h.fire += clamp(h.fireTo - h.fire, -dt * 0.3, dt * 0.3); h.char = Math.min(0.8, h.char + dt * 0.05 * h.fire);
    const s = h.s;
    if (h.fire > 0.3 && Math.random() < dt * 16 * h.fire) R.fx.push({ k: 'spark', x: h.sx + s[2] * (0.1 + 0.8 * Math.random()), y: h.sy + s[3] * (0.1 + 0.4 * Math.random()), vx: rnd(4, 26), vy: rnd(-70, -30), g: -6, t: 0, life: rnd(0.7, 1.6), col: ['#ffb347', '#ff8a3c', '#ffe08a'][Math.floor(Math.random() * 3)] });
    const sm = Math.max(h.fire, h.smoke * 0.5);
    if (sm > 0.05 && Math.random() < dt * 12 * sm) R.fx.push({ k: 'smoke', x: h.sx + s[2] * (0.2 + 0.6 * Math.random()), y: h.sy + s[3] * (R.burnt ? 0.5 : 0.15), vx: rnd(6, 16), vy: rnd(-30, -18), t: 0, life: rnd(2.4, 4), sz: rnd(4, 7) });
  }
  for (const f of R.fires) if (Math.random() < dt * 5 * f.lvl) R.fx.push({ k: 'spark', x: f.x + rnd(-f.w / 2, f.w / 2), y: f.y - f.h * 0.5, vx: rnd(2, 16), vy: rnd(-50, -24), g: -6, t: 0, life: rnd(0.5, 1.1), col: '#ffb347' });
  for (let i = R.fx.length - 1; i >= 0; i--) {
    const f = R.fx[i]; f.t += dt;
    if (f.vx != null) { f.x += f.vx * dt; f.y += f.vy * dt; if (f.g) f.vy += f.g * dt; }
    if (f.t >= f.life) { if (f.k === 'bolt' && f.hit) f.hit(); R.fx.splice(i, 1); }
  }
  if (R.follow) R.camTo = { x: R.follow.x + R.followOff[0], y: R.follow.y + R.followOff[1] };
  if (R.camTo) { const k = Math.min(1, dt * R.camV); R.cam.x += (R.camTo.x - R.cam.x) * k; R.cam.y += (R.camTo.y - R.cam.y) * k; }
  R.shk = Math.max(0, R.shk - dt * 18); R.flash = Math.max(0, R.flash - dt * 2.4); R.capT += dt;
}
function introSpeakerPos(who) {
  const R = S.intro && S.intro.R, a = R && R.actors.find(q => q.id === who && !q.hidden);
  if (!a) return { x: cam.x + view.w / 2, y: cam.y + view.h * 0.55 };
  const m = a.hero ? ATLAS.alec_s : ATLAS[a.key];
  return { x: a.x, y: a.y - (a.fall != null ? 10 : m ? Math.min(m.gy, m.bh) + 4 : 30) };
}
const introHint = () => (lastDev === 'pad' ? 'A: seguir · B: saltar la escena · Start: saltar toda la historia' : lastDev === 'touch' ? 'Toca: seguir · Esquivar: saltar la escena · «Saltar historia»: saltarla entera' : 'Espacio: seguir · Shift: saltar la escena · Esc: saltar toda la historia');
// Mientras dura, la barra de vida y la ayuda de combate sobran, y el botón de pausa sirve para saltarla
function introHud(on) {
  introHudOn = on;
  const st = document.querySelector('#hud .stack'), h = $('hint'), b = $('btnPause');
  if (st) st.style.visibility = on ? 'hidden' : ''; if (h) h.style.visibility = on ? 'hidden' : ''; if (b) b.textContent = on ? 'Saltar historia' : 'Pausa';
}
cv.addEventListener('pointerdown', () => { if (S && S.mode === 'intro') introTap = true; });
$('btnPause').addEventListener('click', () => { if (S && S.mode === 'intro' && S.intro) introEnd(); });

// ── Dibujo ──
// Una casa quemada: el dibujo del paquete ennegrecido; en ruinas, además, con el tejado hundido y alguna viga en pie
const INTRO_BURNT = {};
function introBurnt(i, ruin) {
  const key = i + (ruin ? 'r' : 't'); if (INTRO_BURNT[key]) return INTRO_BURNT[key];
  const s = HOUSES[i], c2 = document.createElement('canvas'), g = c2.getContext('2d'); c2.width = s[2]; c2.height = s[3];
  g.drawImage(IMG.houses, s[0], s[1], s[2], s[3], 0, 0, s[2], s[3]);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = ruin ? 'rgba(22,16,18,0.8)' : 'rgba(22,14,14,0.85)'; g.fillRect(0, 0, s[2], s[3]);
  if (ruin) {
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000000'; g.beginPath(); g.moveTo(-2, -2);
    for (let k = 0; k <= 10; k++) g.lineTo(Math.round(k / 10 * s[2]), Math.round(s[3] * (0.36 + 0.24 * ihash(k, i * 7 + 3) + (k % 2 ? 0.07 : 0))));
    g.lineTo(s[2] + 2, -2); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#17110f';
    for (const u of [0.07, 0.48, 0.92]) { const hh = Math.round(s[3] * (0.22 + 0.2 * ihash(u * 20, i))); g.fillRect(Math.round(u * s[2]) - 2, Math.round(s[3] * 0.66) - hh, 4, hh); }
  }
  return (INTRO_BURNT[key] = c2);
}
// Una llama de píxeles: columnas de dos píxeles en tres capas, más altas en el centro y bailando con el tiempo
function introFlame(x, y, w, h, t, seed) {
  const n = Math.max(2, Math.round(w / 2)), x0 = Math.round(x - n), y0 = Math.round(y);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, env = 1 - Math.pow(Math.abs(u - 0.5) * 2, 1.7), wob = 0.62 + 0.22 * Math.sin(t * 9 + i * 1.3 + seed) + 0.16 * Math.sin(t * 17 - i * 2.1 + seed * 3), hh = h * env * wob;
    for (const [k, col] of [[1, '#b8321e'], [0.74, '#f0702a'], [0.48, '#ffb347'], [0.22, '#ffe9a8']]) { const q = Math.round(hh * k); if (q > 0) { ctx.fillStyle = col; ctx.fillRect(x0 + i * 2, y0 - q, 2, q); } }
  }
}
// Un yunque pequeño sobre su tocón
function introAnvil(x, y) {
  const r = (dx, dy, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + dx, y + dy, w, h); };
  ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.ellipse(x, y, 10, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  r(-6, -7, 12, 7, '#2a1a18'); r(-5, -6, 10, 6, '#6e4530'); r(-5, -6, 10, 1, '#8a6240'); r(-2, -5, 1, 5, '#4a2e22'); r(2, -5, 1, 5, '#4a2e22');
  r(-9, -14, 17, 5, '#16101a'); r(-12, -13, 4, 3, '#16101a'); r(-5, -10, 9, 4, '#16101a');
  r(-8, -13, 15, 3, '#66778f'); r(-8, -13, 15, 1, '#c3d0e0'); r(-11, -12, 3, 1, '#96a9c1'); r(-4, -10, 7, 3, '#4a5768');
}
const INTRO_FLAMES = [[0.5, 0.2, 28, 34], [0.27, 0.42, 22, 26], [0.73, 0.42, 22, 26], [0.5, 0.52, 30, 26], [0.13, 0.6, 16, 20], [0.87, 0.6, 16, 20], [0.21, 0.82, 12, 14], [0.79, 0.82, 12, 14]];
function introFrame(key, anim, i, x, y, flip, flash) {
  const m = ATLAS[key]; if (!m || !IMG.chars) return;
  const fr = (m.a[anim] || m.a.idle).f, f = fr[clamp(i, 0, fr.length - 1)], im = flash ? IMG.charsF : IMG.chars;
  if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(im, f[0], f[1], m.w, m.h, -m.ax, Math.round(y - m.gy), m.w, m.h); ctx.restore(); }
  else ctx.drawImage(im, f[0], f[1], m.w, m.h, Math.round(x - m.ax), Math.round(y - m.gy), m.w, m.h);
}
function introActor(a, R) {
  const x = Math.round(a.x), y = Math.round(a.y), m = a.hero ? ATLAS.alec_s : ATLAS[a.key], sw = m ? clamp(m.bw / 2.4, 5, 16) : 7;
  const shadow = w => { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.ellipse(x, y, w, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; };
  if (a.fall != null) {   // caído: con su animación de muerte si la tiene; si no, vuelca y se queda en el suelo
    if (m && m.a.die) { shadow(sw + 2); introFrame(a.key, 'die', Math.floor(a.fall * m.a.die.fps), x, y, a.flip, false); return; }
    const k = Math.min(1, a.fall / 0.28), ang = a.fallDir * k * k * Math.PI / 2;
    ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.ellipse(x + a.fallDir * 9 * k, y, sw + 6 * k, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(x, y - Math.round(3 * k)); ctx.rotate(ang); drawChar(a.key, 'idle', 0, 0, 0, a.flip, false); ctx.restore(); return;
  }
  shadow(sw);
  const tt = S.t + a.ph;
  if (a.hero) {
    const ang = a.aim != null ? a.aim : a.face, behind = Math.sin(ang) < -0.7, k = Math.round(a.kick);
    if (!drawHero(a.walking ? 'move' : 'idle', tt, x, y, a.aim != null ? a.aim : a.face, false)) drawSprite(SPR.player, x, y, Math.cos(ang) < 0, false);
    return;
  }
  const on = a.once && R.t - a.once.t0 < a.once.dur;
  drawChar(a.key, on ? a.once.anim : a.walking ? 'move' : 'idle', on ? R.t - a.once.t0 : tt, x, y - (a.hop > 0 ? 2 : 0), a.flip, a.flash > 0);
}
// Pinta la cinemática si está en marcha. Devuelve si lo ha hecho (si no, el bucle pinta el juego como siempre).
function introDraw() {
  const on = !!S && S.mode === 'intro' && !!S.intro;
  if (on !== introHudOn) introHud(on);
  if (!on) return false;
  sysTick(); WTEXT.length = 0;
  const N = S.intro, R = N.R, RM = T.room, t = S.t;
  cam.x = Math.round(view.w >= RM.w ? (RM.w - view.w) / 2 : clamp(R.cam.x - view.w / 2, 0, RM.w - view.w));
  cam.y = Math.round(view.h >= RM.h ? (RM.h - view.h) / 2 : clamp(R.cam.y - view.h / 2, 0, RM.h - view.h));
  const shx = Math.round((Math.random() - 0.5) * R.shk), shy = Math.round((Math.random() - 0.5) * R.shk), bg = roomBg();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#0b080d'; ctx.fillRect(0, 0, lo.width, lo.height);
  ctx.setTransform(1, 0, 0, 1, -(cam.x + shx), -(cam.y + shy));
  ctx.drawImage(bg.c, -BG_M * CELL, -BG_M * CELL);
  // casas y personajes, de arriba abajo
  const list = [];
  if (IMG.houses) for (const h of R.houses) list.push({ y: h.by, fn() {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(h.sx + 4, h.by - 2, h.s[2] - 4, 5);
    if (R.burnt) ctx.drawImage(introBurnt(h.hs, true), h.sx, h.sy);
    else { ctx.drawImage(IMG.houses, h.s[0], h.s[1], h.s[2], h.s[3], h.sx, h.sy, h.s[2], h.s[3]); if (h.char > 0.02) { ctx.globalAlpha = h.char; ctx.drawImage(introBurnt(h.hs, false), h.sx, h.sy); ctx.globalAlpha = 1; } }
  } });
  for (const p of R.props) list.push({ y: p.y, fn() { p.draw(p.x, p.y); } });
  for (const a of R.actors) if (!a.hidden) list.push({ y: a.y - (a.fall != null ? 4 : 0), fn() { introActor(a, R); } });
  list.sort((p, q) => p.y - q.y); for (const it of list) it.fn();
  // la luz de la escena: un tono general (noche, amanecer, penumbra de forja) y, encima, lo que alumbra
  const lights = [], fl = 0.92 + 0.08 * Math.sin(t * 11) * Math.sin(t * 7.3);
  for (const h of R.houses) if (h.fire > 0.03) lights.push({ x: h.cx, y: h.sy + h.s[3] * 0.5, r: 56 + 84 * h.fire, c: '255,160,80', a: Math.min(1, 0.3 + 0.65 * h.fire) * fl });
  for (const f of R.fires) lights.push({ x: f.x, y: f.y - 4, r: 26 + f.w * 2.2, c: '255,160,80', a: 0.8 * fl });
  for (const tc of bg.torches || []) lights.push({ x: tc.x, y: tc.y + 4, r: 62, c: '255,170,90', a: 0.75 * fl });
  for (const p of (S.out && S.out.props) || []) if (p.s === 'furnace') lights.push({ x: p.x, y: p.y - 18, r: 84, c: '255,130,60', a: 0.95 * fl });
  for (const a of R.actors) if (a.glow && !a.hidden) lights.push({ x: a.x, y: a.y - 16, r: 58, c: a.glow, a: 0.8 });
  if (R.amb) {
    if (!INTRO_LM) INTRO_LM = document.createElement('canvas');
    const L = INTRO_LM; if (L.width !== lo.width || L.height !== lo.height) { L.width = lo.width; L.height = lo.height; }
    const g = L.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.fillStyle = R.amb; g.fillRect(0, 0, L.width, L.height);
    g.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const x = l.x - cam.x - shx, y = l.y - cam.y - shy; if (x < -l.r || y < -l.r || x > L.width + l.r || y > L.height + l.r) continue;
      const gr = g.createRadialGradient(x, y, 0, x, y, l.r); gr.addColorStop(0, `rgba(${l.c},${l.a})`); gr.addColorStop(1, `rgba(${l.c},0)`); g.fillStyle = gr; g.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(L, 0, 0); ctx.restore();
  }
  // lo que brilla por sí mismo: antorchas, llamas, chispas; y el humo
  for (const tc of bg.torches || []) strip(VFX.torch, t * 10 + tc.x, tc.x, tc.y - 2);
  for (const h of R.houses) if (h.fire > 0.02) INTRO_FLAMES.forEach(([fx, fy, w, hh], i) => { const lv = clamp(h.fire * 1.6 - i * 0.09, 0, 1); if (lv > 0.05) introFlame(h.sx + h.s[2] * fx, h.sy + h.s[3] * fy, w * (0.5 + 0.5 * lv), hh * lv, t, h.hs * 5 + i * 2.7); });
  R.fires.forEach((f, i) => introFlame(f.x, f.y, f.w, f.h, t, 40 + i * 3.1));
  for (const f of R.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'smoke') { const sz = Math.round(f.sz + (1 - k) * 7); ctx.fillStyle = R.burnt ? '#4b4652' : '#241f2a'; ctx.globalAlpha = 0.42 * Math.min(1, k * 1.6, f.t * 3); ctx.fillRect(Math.round(f.x - sz / 2), Math.round(f.y - sz / 2), sz, sz); }
    else if (f.k === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = Math.min(1, k * 2); ctx.fillRect(Math.round(f.x), Math.round(f.y), k > 0.5 ? 2 : 1, k > 0.5 ? 2 : 1); }
    else if (f.k === 'bolt') { const u = f.t / f.life, u0 = Math.max(0, u - 0.35); ctx.strokeStyle = '#efe6c8'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(f.x1 + (f.x2 - f.x1) * u0, f.y1 + (f.y2 - f.y1) * u0); ctx.lineTo(f.x1 + (f.x2 - f.x1) * u, f.y1 + (f.y2 - f.y1) * u); ctx.stroke(); }
    else if (f.k === 'slash' && IMG.vfx) { ctx.save(); ctx.translate(Math.round(f.x), Math.round(f.y)); ctx.rotate(f.a); ctx.drawImage(IMG.vfx, Math.min(7, Math.floor(f.t / f.life * 8)) * 32, VFX.slashFire * 32, 32, 32, -32, -32, 64, 64); ctx.restore(); }
    ctx.globalAlpha = 1;
  }
  // a pantalla: el mundo ampliado, el fundido, las franjas de cine con el rótulo y la ayuda, y el bocadillo
  const k = view.s, dp = view.dpr, bar = Math.round(cv.height * 0.085);
  scr.setTransform(1, 0, 0, 1, 0, 0); scr.imageSmoothingEnabled = false; scr.globalAlpha = 1;
  scr.drawImage(lo, 0, 0, lo.width * k, lo.height * k);
  if (R.flash > 0) { scr.fillStyle = '#ffffff'; scr.globalAlpha = Math.min(1, R.flash); scr.fillRect(0, 0, cv.width, cv.height); scr.globalAlpha = 1; }
  if (R.fade > 0) { scr.fillStyle = '#07050a'; scr.globalAlpha = R.fade; scr.fillRect(0, 0, cv.width, cv.height); scr.globalAlpha = 1; }
  scr.fillStyle = '#07050a'; scr.fillRect(0, 0, cv.width, bar); scr.fillRect(0, cv.height - bar, cv.width, bar);
  scr.save(); scr.textAlign = 'center'; scr.textBaseline = 'middle';
  const ca = clamp(Math.min(R.capT / 0.5, (4.6 - R.capT) / 0.7), 0, 1);
  if (ca > 0 && R.cap) { scr.globalAlpha = ca; scr.font = `600 ${Math.round(17 * dp)}px ${FONT}`; scr.fillStyle = '#efe6c8'; scr.fillText(R.cap, cv.width / 2, bar / 2 + dp); }
  scr.globalAlpha = 1; scr.font = `500 ${Math.round(11.5 * dp)}px ${FONT}`; scr.fillStyle = 'rgba(239,230,200,0.62)'; scr.fillText(introHint(), cv.width / 2, cv.height - bar / 2);
  scr.restore();
  if (S.dialog) drawDialog(k);
  return true;
}
