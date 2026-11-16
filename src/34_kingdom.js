// ───────────────────────── Reinos, zonas y misiones ─────────────────────────
// Alec llega a su primer reino como un desconocido que se ofrece al rey; después irá de reino en reino. Cada reino es un mapa con cuatro zonas; cada zona tiene tres misiones
// de tipos distintos y un guardián. Al caer los cuatro guardianes aparece el dios que asedia el reino.
// Cada misión empieza de cero: lo que robas a los dioses no sale de ella. Lo que queda son los guanteletes forjados y el árbol.
// Las misiones son largas (unos 20-30 minutos) para que dé tiempo a montar una build. rooms: cuántos tramos tiene; shops: tras cuáles hay tienda.
const MTYPES = {
  doors:   { name: 'Incursión', rooms: 15, shops: [5, 10], desc: 'Quince salas seguidas. Al acabar cada una eliges puerta. Hay dos tiendas.' },
  defend:  { name: 'Defensa',   rooms: 12, shops: [4, 8],  desc: 'Protege la campana de la aldea durante doce oleadas. Si cae, pierdes.' },
  assault: { name: 'Asalto',    rooms: 5,  shops: [2, 4],  desc: 'Cinco campamentos. Derriba sus estandartes: mientras sigan en pie, llegan refuerzos. Cada campamento guarda lo suyo y cada baja da experiencia.' },
  boss:    { name: 'Guardián',  rooms: 9,  shops: [4, 8],  desc: 'Ocho salas y, al final, el guardián de la zona. Hay dos tiendas.' },
  god:     { name: 'Dios',      rooms: 11, shops: [5, 10], desc: 'Diez salas y, al final, el dios. Hay dos tiendas.' },
};
const KINGDOMS = [
  { id: 'valdehierro', name: 'Valdehierro', title: 'El reino de Valdehierro', godTitle: 'el dios de la guerra',
    lore: 'El rey de Valdehierro paga en hierro y no hace preguntas. Los ejércitos del Primer Puño ya han tomado medio reino.',
    god: 'firstfist', zones: [
      { name: 'Las Criptas',          m: ['El osario viejo', 'La aldea de Fuenteseca', 'El campamento de los profanadores'] },
      { name: 'El Nido',              m: ['Las galerías de seda', 'La aldea de Robledal', 'El campamento de la colmena'] },
      { name: 'Las Minas de Cristal', m: ['El pozo hondo', 'La aldea de Peñablanca', 'El campamento de los picadores'] },
      { name: 'El Umbral',            m: ['El paso de ceniza', 'La aldea de Últimaluz', 'El campamento del estandarte negro'] },
    ] },
  // El segundo reino: un dios mucho más fuerte (lvl0: cuánto más duro empieza) y zonas con su propio guardián sobre los paisajes de siempre (world)
  { id: 'torrealba', name: 'Torrealba', title: 'El reino de Torrealba', godTitle: 'el dios del juicio', lvl0: 12,
    lore: 'En Torrealba se juzga a los vivos. El Juez Sin Rostro ha condenado al reino entero, y sus alguaciles cumplen la sentencia aldea a aldea.',
    god: 'k2_judge', zones: [
      { name: 'Los Salares',               world: 2, boss: 'k2_salt',    m: ['Las galerías de sal', 'La aldea de Salobral', 'El campamento de los salineros'] },
      { name: 'La Ciénaga Negra',          world: 1, boss: 'k2_hang',    m: ['El cañaveral de los ahorcados', 'La aldea de Juncal', 'El campamento de los verdugos'] },
      { name: 'Las Catacumbas del Juicio', world: 0, boss: 'k2_bailiff', m: ['La sala de las sentencias', 'La aldea de Campodolor', 'El campamento de los alguaciles'] },
      { name: 'El Tribunal de Ceniza',     world: 3, boss: 'k2_exec',    m: ['La escalinata quemada', 'La aldea de Cenizal', 'El campamento del cadalso'] },
    ] },
];
// Cada zona usa el paisaje y los enemigos de uno de los cuatro mundos (WORLDS) y tiene su guardián; en Valdehierro, los de siempre
const zoneWorld = (K, z) => (K.zones[z].world != null ? K.zones[z].world : z);
const zoneBoss = (K, z) => K.zones[z].boss || WORLDS[zoneWorld(K, z)].boss;
// Marcas del guardado que van por reino (haber hablado con el rey, haber visto una escena): en Valdehierro, con su nombre de siempre
const kflag = base => kingdomNow().id === 'valdehierro' ? base : base + '_' + kingdomNow().id;
// El reino en el que estás (M.kingdom); se cambia de reino desde el salón del trono cuando el anterior es libre
const kingdomOpen = i => i === 0 || !!(M.done || {})[KINGDOMS[i - 1].id + ':g'];
const MKINDS = ['doors', 'defend', 'assault'];
const kingdomNow = () => KINGDOMS[(typeof M !== 'undefined' && M && M.kingdom) || 0] || KINGDOMS[0];
function missionOf(id) {
  const [k, z, i] = id.split(':'), K = KINGDOMS.find(x => x.id === k);
  if (z === 'g') return { id, k, z: 3, type: 'god', name: TYPES[K.god].name, zone: K.title };
  const Z = K.zones[+z];
  if (i === 'b') return { id, k, z: +z, type: 'boss', name: TYPES[zoneBoss(K, +z)].name, zone: Z.name };
  return { id, k, z: +z, type: MKINDS[+i], name: Z.m[+i], zone: Z.name };
}
const isDone = id => !!(M.done || {})[id];
const zoneOpen = (K, z) => [0, 1, 2].every(i => isDone(`${K.id}:${z}:${i}`));
const godOpen = K => K.zones.every((_, z) => isDone(`${K.id}:${z}:b`));
const REPEAT = 0.5;   // repetir un encargo ya cumplido paga la mitad: se puede farmear, pero cumplir uno nuevo sigue valiendo más
const payOf = ms => (ms.type === 'god' ? 400 : ms.type === 'boss' ? 150 + 40 * ms.z : 60 + 25 * ms.z);
const roomsOf = ms => MTYPES[ms.type].rooms;
const shopAfter = (ms, r) => MTYPES[ms.type].shops.includes(r);
const hasBoss = ms => ms.type === 'boss' || ms.type === 'god';
const whereNow = () => { const ms = S.mission; return !ms ? '' : ms.zone + ' · ' + ms.name; };

// El mapa del reino que se ve en el tablón (mapHtml: el dibujo, los territorios por color y los marcadores de cada encargo) está en 38_map.js

// Fin de una misión con éxito: se cobra el encargo y se vuelve a la forja con lo ganado
function missionWin() {
  const ms = S.mission, first = !isDone(ms.id), n0 = godsOpenN();
  M.done = M.done || {}; M.done[ms.id] = 1;
  S.newGod = godsOpenN() > n0 ? GOD_UNLOCK[godsOpenN() - 1] : null;   // cada encargo cumplido por primera vez hace que otra deidad se fije en ti
  S.pay = first ? payOf(ms) : Math.round(payOf(ms) * REPEAT); S.soulsRun += S.pay; S.first = first;
  { // Cada encargo cumplido deja al menos una pieza nueva para la forja; los guardianes y el dios, dos
    const found = [];
    for (let i = 0; i < (ms.type === 'boss' || ms.type === 'god' ? 2 : 1); i++) { const left = PARTS.filter(x => !M.parts[x.id]); if (!left.length) break; const x = left[Math.floor(Math.random() * left.length)]; discover(x.id); found.push(x.name); }
    S.found = found.join(' y ');
  }
  endRun(true); setMode('win');
}
function missionFail(why) { S.failTxt = why; S.p.hp = 0; endRun(false); setMode('dead'); }
const resumePlay = () => { S.mode = 'play'; modeT = 0; renderOverlay(); };
const lootGod = () => randGod();

// ── Defensa de una aldea: cada oleada es un tramo; parte de los enemigos va a por la campana en vez de a por ti ──
function fillDefWave() {
  const w = S.room; let budget = 5 + S.lvl * 2.2; const list = [], pool = WORLDS[S.world - 1].pool;
  while (budget > 0.5 && list.length < 32) { const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5); if (!cand.length) break; const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost; }
  list.sort(() => Math.random() - 0.5);
  if (w % 3 === 0) list.splice(Math.ceil(list.length / 2), 0, 'champ');   // cada tres oleadas llega un elegido con los asaltantes
  S.queue = list.map((type, i) => ({ type, at: 1 + i * 0.4, raid: i % 4 === 0 && !TYPES[type].fly && type !== 'champ' }));
  note(S.p.x, S.p.y - 30, 'Oleada ' + w + ' de ' + roomsOf(S.mission), C.blood, true);
  if (w === 1) sayRaw('[Uno de cada cuatro va a por la campana: no la dejes sola.]', C.blood);
}
// ── Asalto a un campamento: tres estandartes que llaman refuerzos hasta que caen ──
// Cada estandarte guarda a los suyos: se quedan en su campamento hasta que te acercas (CAMP_AGGRO) o les das; si te alejas
// (CAMP_LEASH) vuelven a su sitio. Solo llama refuerzos el campamento que está en alerta. Si cae el estandarte, los suyos van a por ti.
const CAMP_AGGRO = 210, CAMP_LEASH = 330;
// La experiencia del asalto: cada baja suma; al subir de nivel eliges un ajuste de los guanteletes. Niveles a las 8, 22, 42, 68... bajas
const xpNeed = l => 8 + 6 * l;
function gainXp(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.xpLvl)) { S.xp -= xpNeed(S.xpLvl); S.xpLvl++; S.pendingXp = (S.pendingXp || 0) + 1; note(S.p.x, S.p.y - 34, '¡Nivel ' + (S.xpLvl + 1) + '!', C.energy, true); sfx('fanfare', 0.35); }
}
const xpScreen = () => Object.assign(statScreen(), { eyebrow: 'Experiencia · nivel ' + (S.xpLvl + 1 - (S.pendingXp || 0)), title: 'Subes de nivel: afina los guanteletes' });
function setupAssault() {
  const p = S.p, spots = [];
  S.postsAll = S.room >= 4 ? 4 : 3;
  const camps = ((S.out && S.out.camps) || []).slice().sort(() => Math.random() - 0.5);   // los campamentos que dibujó el generador
  for (const k of camps) if (spots.length < S.postsAll) spots.push({ x: (k.x + 0.5) * CELL, y: (k.y + 0.5) * CELL });
  for (let i = spots.length, tries = 0; i < S.postsAll && tries < 300; tries++) { const c = freeSpot(p, 230); if (spots.every(s => dist(s, c) > CAMP_GAP * CELL) && dist(c, p) > CAMP_START * CELL && !isBlockedAt(c.x, c.y)) { spots.push(c); i++; } }
  for (const c of spots) spawn('post', { pos: c });
  const posts = S.enemies.filter(e => e.type.post);
  let budget = 5 + S.lvl * 2.1; const pool = WORLDS[S.world - 1].pool, list = [];
  while (budget > 0.5 && list.length < 18) { const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5); if (!cand.length) break; const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost; }
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.3, near: posts[i % Math.max(1, posts.length)], camp: posts[i % Math.max(1, posts.length)] }));
  S.postsDown = 0;
  S.postsAll = spots.length;
  if (S.room === 1) sayRaw('[Los estandartes llaman refuerzos sin parar. Hasta que no caigan, seguirán llegando.]', C.blood);
  note(S.p.x, S.p.y - 30, 'Campamento ' + S.room + ' de ' + roomsOf(S.mission), C.blood, true);
}
