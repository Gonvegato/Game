// ───────────────────────── Reinos, zonas y misiones ─────────────────────────
// Alec va de reino en reino como mercenario. Cada reino es un mapa con cuatro zonas; cada zona tiene tres misiones
// de tipos distintos y un guardián. Al caer los cuatro guardianes aparece el dios que asedia el reino.
// Cada misión empieza de cero: lo que robas a los dioses no sale de ella. Lo que queda es el arma forjada y el árbol.
const MTYPES = {
  doors:   { name: 'Incursión', desc: 'Cinco salas seguidas. Tras cada una eliges puerta.' },
  defend:  { name: 'Defensa',   desc: 'Cuatro oleadas contra una aldea. Si derriban la campana, fracasas.' },
  assault: { name: 'Asalto',    desc: 'Un campamento con tres estandartes que no dejan de llamar refuerzos. Derríbalos todos.' },
  boss:    { name: 'Guardián',  desc: 'Dos salas, una tienda y el guardián de la zona.' },
  god:     { name: 'Dios',      desc: 'Una sala, una tienda y el dios.' },
};
const KINGDOMS = [
  { id: 'valdehierro', name: 'Valdehierro', title: 'El reino de Valdehierro',
    lore: 'El rey de Valdehierro paga en hierro y no hace preguntas. Los ejércitos del Primer Puño ya han tomado medio reino.',
    god: 'firstfist', zones: [
      { name: 'Las Criptas',          m: ['El osario viejo', 'La aldea de Fuenteseca', 'El campamento de los profanadores'] },
      { name: 'El Nido',              m: ['Las galerías de seda', 'La aldea de Robledal', 'El campamento de la colmena'] },
      { name: 'Las Minas de Cristal', m: ['El pozo hondo', 'La aldea de Peñablanca', 'El campamento de los picadores'] },
      { name: 'El Umbral',            m: ['El paso de ceniza', 'La aldea de Últimaluz', 'El campamento del estandarte negro'] },
    ] },
];
const MKINDS = ['doors', 'defend', 'assault'];
const kingdomNow = () => KINGDOMS[0];
function missionOf(id) {
  const [k, z, i] = id.split(':'), K = KINGDOMS.find(x => x.id === k);
  if (z === 'g') return { id, k, z: 3, type: 'god', name: TYPES[K.god].name, zone: K.title };
  const Z = K.zones[+z];
  if (i === 'b') return { id, k, z: +z, type: 'boss', name: TYPES[WORLDS[+z].boss].name, zone: Z.name };
  return { id, k, z: +z, type: MKINDS[+i], name: Z.m[+i], zone: Z.name };
}
const isDone = id => !!(M.done || {})[id];
const zoneOpen = (K, z) => [0, 1, 2].every(i => isDone(`${K.id}:${z}:${i}`));
const godOpen = K => K.zones.every((_, z) => isDone(`${K.id}:${z}:b`));
const payOf = ms => (ms.type === 'god' ? 160 : ms.type === 'boss' ? 55 + 15 * ms.z : 18 + 8 * ms.z);
const roomsOf = ms => (ms.type === 'doors' ? RPW : ms.type === 'boss' ? 3 : ms.type === 'god' ? 2 : 1);
const whereNow = () => { const ms = S.mission; return !ms ? '' : ms.zone + ' · ' + ms.name; };

// El mapa del reino, en la forja: cuatro zonas con sus misiones y, en medio, el dios
function mapHtml() {
  const K = kingdomNow(), nDone = Object.keys(M.done || {}).filter(id => id.startsWith(K.id)).length;
  const btn = (id, label, sub, locked) => `<button class="fi${isDone(id) ? ' on' : locked ? ' off' : ''}" data-act="${locked ? 'x' : 'm'}:${id}"><b>${label}</b><span>${sub}</span><i>${isDone(id) ? 'Hecha' : locked ? 'Cerrada' : payOf(missionOf(id)) + ' almas'}</i></button>`;
  const zones = K.zones.map((Z, z) => {
    const W = WPAL[z], open = zoneOpen(K, z), boss = TYPES[WORLDS[z].boss].name;
    return `<section class="zone" style="--zf:${W.f[1]};--zc:${W.capHi}"><h3>${Z.name}</h3>` +
      Z.m.map((nm, i) => btn(`${K.id}:${z}:${i}`, nm, MTYPES[MKINDS[i]].name + ' · ' + MTYPES[MKINDS[i]].desc, false)).join('') +
      btn(`${K.id}:${z}:b`, boss, open ? 'Guardián de la zona · ' + MTYPES.boss.desc : 'Completa las tres misiones de la zona para llegar hasta él.', !open) + '</section>';
  }).join('');
  const g = godOpen(K), G = TYPES[K.god];
  return `<h2>Contrato: ${K.title}</h2><p class="fine">${K.lore} Llevas ${nDone} de 17 encargos.</p><div class="kmap">${zones}</div>` +
    `<section class="zone god">${btn(`${K.id}:g`, G.name, g ? 'El dios que asedia el reino · ' + MTYPES.god.desc : 'Derrota a los cuatro guardianes y saldrá a buscarte.', !g)}</section>`;
}

// Fin de una misión con éxito: se cobra el encargo y se vuelve a la forja con lo ganado
function missionWin() {
  const ms = S.mission, first = !isDone(ms.id);
  M.done = M.done || {}; M.done[ms.id] = 1;
  S.pay = first ? payOf(ms) : Math.round(payOf(ms) * 0.3); S.soulsRun += S.pay; S.first = first;
  if (ms.type === 'boss' || ms.type === 'god') { const left = PARTS.filter(x => !M.parts[x.id]); if (left.length) { const x = left[Math.floor(Math.random() * left.length)]; discover(x.id); S.found = x.name; } }
  endRun(true); setMode('win');
}
function missionFail(why) { S.failTxt = why; S.p.hp = 0; endRun(false); setMode('dead'); }
const resumePlay = () => { S.mode = 'play'; modeT = 0; renderOverlay(); };
const lootGod = () => GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)];

// ── Defensa de una aldea: oleadas; parte de los enemigos va a por la campana en vez de a por ti ──
function fillDefWave() {
  const w = S.defWave; let budget = 7 + S.lvl * 1.3 + w * 3; const list = [], pool = WORLDS[S.world - 1].pool;
  while (budget > 0.5 && list.length < 22) { const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5); if (!cand.length) break; const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost; }
  S.queue = list.map((type, i) => ({ type, at: S.waveT + 1 + i * 0.4, raid: i % 2 === 0 && !TYPES[type].fly }));
  note(S.p.x, S.p.y - 30, 'Oleada ' + w + ' de 4', C.blood, true); sayRaw('[Oleada ' + w + ' de 4. La mitad va a por la campana: no la dejes sola.]', C.blood);
}
function defendCleared() {
  const p = S.p;
  if (S.defWave >= 4) { missionWin(); return; }
  S.defWave += 1; p.hp = Math.min(p.maxHp, p.hp + 8 + 4 * tk('mend')); addGold(12 + 2 * S.lvl);
  pickQueue = [pieceScreen(lootGod(), 'Oleada rechazada · entre los caídos hay un arma bendecida')]; S.rerolls = tk('reroll');
  afterPicks = () => { resumePlay(); fillDefWave(); };
  advancePick();
}
// ── Asalto a un campamento: tres estandartes que llaman refuerzos hasta que caen ──
function setupAssault() {
  const p = S.p, spots = [];
  for (let i = 0, tries = 0; i < 3 && tries < 200; tries++) { const c = freeSpot(p, 230); if (spots.every(s => dist(s, c) > 170) && !isWallAt(c.x, c.y)) { spots.push(c); i++; } }
  for (const c of spots) spawn('post', { pos: c });
  let budget = 6 + S.lvl * 1.2; const pool = WORLDS[S.world - 1].pool, list = [];
  while (budget > 0.5 && list.length < 14) { const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5); if (!cand.length) break; const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost; }
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.3, near: spots[i % Math.max(1, spots.length)] }));
  S.postsDown = 0;
  sayRaw('[Tres estandartes llaman refuerzos sin parar. Hasta que no caigan, seguirán llegando.]', C.blood);
}
