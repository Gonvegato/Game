// ───────────────────────── La cinemática del principio ─────────────────────────
// Alec cuenta su historia en seis escenas cortas. Cada escena es una sala de verdad del motor (su propio generador o la plaza),
// con personajes del atlas que andan, entran y caen, y bocadillos del sistema de conversación de la plaza.
// Disparar (A, Espacio, tocar) pasa de línea · Esquivar (B, Shift) salta la escena · Start (Esc, el botón de arriba) salta todo.
// Se ve la primera vez que se pulsa Empezar (M.seenIntro) y después desde la habitación de la posada.
// El mismo motor cuenta el final de cada reino (ENDING, M.seenEnding) al matar a su dios.
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
Object.assign(SPEAKER, { sister: ['Su hermana', '#f0b8c8'], kid: ['Alec', '#9fd3ff'], teen: ['Alec', '#9fd3ff'], mother: ['Su madre', '#e6c07a'], oldsmith: ['El herrero', '#ff9a5c'], chosen: ['El elegido', '#e0524a'], guardia: ['Un guardia', '#cfd6de'] });

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
      { wait: 1.5, who: 'kid', think: true, text: 'Yo era un niño cuando los ejércitos de los dioses llegaron a mi pueblo.' },
      { who: 'kid', think: true, text: 'Se llamaba Hontanar. Cuarenta vecinos, un pozo y un camino que no llevaba a ninguna parte. Nadie sabía rezar a nada más grande que la lluvia.' },
      { who: 'sister', text: '¡Alec! ¡Las casas del final están ardiendo! ¡Y viene gente por el camino!' },
      { who: 'mother', text: 'No es gente. Quedaos detrás de mí y no hagáis ruido.' },
      { who: 'kid', think: true, text: 'Mi madre decía que a los ejércitos de los dioses no se les mira a la cara. Que pasan, como las tormentas, y que lo único que se puede hacer es esperar.' },
      { wait: 1.6, who: 'kid', think: true, text: 'Esa noche no pasaron de largo. No pidieron nada. Quemaron las casas y mataron a quien salía de ellas.',
        on(R) {
          [['s1', 'pc_skel_war', 52, 13.2, 32.2, 13.4], ['s2', 'pc_skel', 53.5, 14.3, 34, 14.3], ['s3', 'pc_skel_rogue', 55, 12.7, 35, 12.8], ['s4', 'brute', 56.5, 13.9, 37, 13.9], ['s5', 'pc_skel_war', 58, 14.6, 38.6, 14.6]]
            .forEach(([id, key, x, y, tx, ty]) => R.go(R.add(id, key, x, y, { flip: true }), [[tx, ty]], 90, id === 's1' ? () => { R.fall('g1', -1); R.shake(3); sfx('kill', 0.4,0.8); } : null));
          R.camTo.x = IC(24);
        } },
      { who: 'kid', text: '¡Madre! ¡Han matado al guardia! ¡Vienen hacia aquí!' },
      { wait: 0.6, who: 'mother', text: '¡Corre, Alec! ¡Al bosque, y no mires atrás! ¡Corre!', on(R) { R.houses[1].fireTo = 0.85; R.a('mother').flip = true; R.camTo.x = IC(21); } },
      { wait: 3.1, min: 0.6, who: 'kid', think: true, text: 'Corrí hasta los árboles. Y miré atrás.',
        on(R) {
          R.go('kid', [[4.6, 13.9]], 105, a => { a.flip = false; });
          R.a('mother').flip = false; R.go('mother', [[19.7, 12.9]], 40); R.go('sister', [[13.6, 13.3]], 30);
          R.go('s1', [[21, 13.1]], 72, () => { R.fall('mother', -1); R.shake(3); sfx('kill', 0.4,0.8); });
          R.go('s3', [[21.5, 14.3], [14.8, 13.5]], 86, () => { const s = R.a('sister'); s.path = []; R.fall(s, -1); sfx('kill', 0.4,0.8); });
          R.go('s2', [[23.5, 14.3]], 66); R.go('s4', [[26, 13.9]], 60); R.go('s5', [[28, 14.6]], 62);
          R.houses[0].fireTo = 0.7; R.camTo.x = IC(16); R.camV = 0.9;
        } },
      { who: 'kid', think: true, text: 'Mi madre se puso delante para que yo llegara. Mi hermana tropezó en la calle. Yo tenía nueve años y estaba escondido detrás de un árbol.' },
      { who: 'kid', think: true, text: 'Ninguno de aquellos esqueletos sabía nuestros nombres. Obedecían a algo que ni siquiera estaba allí.' },
    ] },
  { cap: 'A la mañana siguiente', room: ['intro_pueblo', 'intro_pueblo'], amb: '#a49fb2',
    setup(R) {
      R.burnt = true; R.cam.x = IC(16.5); R.cam.y = IC(10.5);
      for (const h of R.houses) h.smoke = 1;
      R.fires.push({ x: IC(19), y: IC(18) - 3, w: 8, h: 7, lvl: 0.6 }, { x: IC(21.2), y: IC(11) - 2, w: 10, h: 8, lvl: 0.6 }, { x: IC(33.5), y: IC(11) - 3, w: 12, h: 10, lvl: 0.6 }, { x: IC(26), y: IC(11) - 2, w: 8, h: 6, lvl: 0.6 }, { x: IC(8), y: IC(11) - 2, w: 8, h: 6, lvl: 0.6 });
      R.add('kid', 'alec_kid', 17.9, 13.3);
    },
    beats: [
      { wait: 1.3, who: 'kid', think: true, text: 'Volví cuando dejó de oler a humo. No quedaba nadie. Ni casas, ni vecinos, ni familia.',
        on(R) { R.go(R.add('oldsmith', 'oldsmith', -2.5, 14), [[15.7, 13.6]], 56, () => { R.a('kid').flip = true; }); } },
      { who: 'kid', think: true, text: 'Por el camino llegó un hombre con un carro y un martillo al cinto. Venía de la ciudad, a vender clavos.' },
      { who: 'oldsmith', text: '¿Queda alguien más, chico?' },
      { who: 'kid', text: 'No.' },
      { who: 'oldsmith', text: '¿Viste quién fue?' },
      { who: 'kid', text: 'Esqueletos. Venían por el camino, con una bandera negra. Mi madre dijo que pasarían de largo.' },
      { who: 'oldsmith', text: 'A veces pasan. Los ejércitos de los dioses no buscan nada, chico: van de un lado a otro y lo que dejan detrás les da igual.' },
      { who: 'kid', text: '¿Y por qué nadie los para?' },
      { who: 'oldsmith', text: 'Porque todos rezan para que pasen por el pueblo de al lado. Y casi siempre funciona.' },
      { who: 'oldsmith', text: 'Aquí ya no haces nada. Ven: en mi forja hace falta quien mueva el fuelle.' },
      { wait: 1.1, who: 'kid', think: true, text: 'Era herrero. Me dio techo, trabajo y pocas palabras. Nunca le pregunté su nombre, y él nunca me lo dijo.',
        on(R) { R.go('oldsmith', [[4, 14]], 38); }, ev: [[0.5, R => R.go('kid', [[5.8, 13.8]], 38)]] },
    ] },
  { cap: 'La forja', room: ['intro_forja', 'shop'], amb: '#b8a596',
    setup(R) { R.props.push({ x: IC(6.4), y: IC(10.4), draw: introAnvil }); R.add('oldsmith', 'oldsmith', 8.7, 11.6, { flip: true }); R.add('kid', 'alec_kid', 5.3, 10.5); },
    tick(R, dt) {
      R.acc += dt;
      if (R.stage === 0) {   // el niño, al yunque
        if (R.acc > 0.95) { R.acc = 0; R.a('kid').hop = 0.12; R.burst(IC(6.4), IC(10.4) - 15, 7, ['#ffe08a', '#ffb347', '#ff8a3c'], 40); sfx('crit', 0.25,1.5); }
      } else {               // el muchacho, contra el muñeco
        const t = R.a('teen'), d = R.a('dummy');
        if (R.acc > 1.5) { R.acc = 0; t.once = { anim: 'atk', t0: R.t, dur: 10 / 14 }; R.hitT = 0.3; }
        if (R.hitT > 0) { R.hitT -= dt; if (R.hitT <= 0) { d.flash = 0.1; R.burst(d.x - 3, d.y - 11, 5, ['#efe6c8', '#c9b98a'], 34); sfx('hit', 0.3); } }
      }
    },
    beats: [
      { wait: 1.2, who: 'kid', think: true, text: 'Me crio entre el yunque y la fragua. Primero me enseñó a forjar.' },
      { who: 'oldsmith', text: 'El hierro no perdona las prisas. Otra vez.' },
      { who: 'kid', text: '¿Y si lo golpeo más fuerte?' },
      { who: 'oldsmith', text: 'Entonces lo romperás más fuerte. Mira dónde cae el martillo, no cuánto pesa.' },
      { wait: 1.4, min: 0.9, who: 'teen', think: true, text: 'Después, a pelear. Decía que quien forja algo y no sabe usarlo solo fabrica chatarra.',
        on(R) {
          R.dipTo(() => {
            R.a('kid').hidden = true; R.stage = 1; R.acc = 0.9; R.setCap('Años después');
            R.add('teen', 'alec_kid', 10.4, 12.2, { amb: true }); R.add('dummy', 'decoy', 13.2, 12.2, { amb: true });
            const s = R.a('oldsmith'); s.x = IC(15.8); s.y = IC(12); s.flip = true;
          });
        } },
      { who: 'oldsmith', text: 'Golpea y apártate. Quien se queda quieto delante de algo más grande que él, se muere.' },
      { who: 'teen', text: '¿Así se mata a un dios?' },
      { who: 'oldsmith', text: 'A un dios no se le mata, chico. Se le sobrevive. Y con suerte, se le cobra.' },
      { who: 'teen', think: true, text: 'Por las noches trabajaba en unos guanteletes de metal. No me dejaba tocarlos. Decía que aún no estaban acabados, y que yo tampoco.' },
      { who: 'teen', think: true, text: 'Fueron pocos años. No he tenido otros mejores.' },
    ] },
  // El niño sigue siendo un niño cuando matan al herrero: no sale a defenderle, se esconde
  { cap: 'La última noche', room: ['intro_forja', 'shop'], amb: '#4c4166',
    setup(R) { R.props.push({ x: IC(6.4), y: IC(10.4), draw: introAnvil }); R.add('kid', 'alec_kid', 6, 12.2); R.add('oldsmith', 'oldsmith', 8.6, 11.6); },
    beats: [
      { wait: 2.3, who: 'kid', think: true, text: 'Una noche entró en la forja un elegido: un hombre al que un dios había prestado su poder, y que ya no sabía devolverlo.',
        on(R) { R.go(R.add('chosen', 'champ', 10.5, 17.4, { glow: '255,70,60' }), [[10.5, 13.6], [12.2, 12.3]], 44); sfx('roar', 0.5); } },
      { who: 'chosen', text: 'Herrero. Me han dicho que forjas un acero que no se dobla.' },
      { who: 'oldsmith', text: 'Te han dicho bien. Y no está en venta.' },
      { who: 'chosen', text: 'No he venido a comprar. Tu fragua servirá a mi señor, o no servirá a nadie.' },
      { wait: 0.9, who: 'oldsmith', text: 'Aquí no se forja para ningún dios. Alec, escóndete detrás del banco. Ahora.', on(R) { R.go('oldsmith', [[9.9, 11.8]], 36); R.go('kid', [[4.3, 7.6]], 70, a => { a.flip = false; }); } },
      { who: 'kid', think: true, text: 'Me escondí detrás del banco de trabajo. Era un crío. No habría podido hacer nada, y los dos lo sabíamos.' },
      { wait: 1.6, min: 0.9, who: 'kid', think: true, text: 'Lo mató de un solo golpe. A mí ni me buscó: para él yo no existía.',
        on(R) { const c = R.a('chosen'); c.once = { anim: 'atk', t0: R.t, dur: 8 / 16 }; R.go(c, [[11.2, 12]], 170); },
        ev: [[0.26, R => { const s = R.a('oldsmith'); s.path = []; s.flip = true; R.fall(s, -1); R.fx.push({ k: 'slash', x: s.x + 2, y: s.y - 14, a: Math.PI, t: 0, life: 0.3 }); R.flash = 0.7; R.shake(7); R.burst(s.x, s.y - 14, 10, ['#ffe08a', '#e0524a', '#ffffff'], 70); sfx('boom', 0.6); }],
          [1.25, R => R.go('chosen', [[10.5, 13.6], [10.5, 17.6]], 50, INTRO_GONE)]] },
      { who: 'kid', think: true, text: 'Antes de cerrar los ojos, el herrero me miró. Movió los labios. No le oí, pero lo entendí: «No le reces a nadie».' },
      { wait: 1.2, who: 'kid', think: true, text: 'Lo enterré al amanecer, detrás de la forja. Me quedé con su martillo y con los guanteletes que nunca me dejó tocar.', on(R) { R.go('kid', [[6.5, 12]], 30); } },
    ] },
  { cap: 'El camino', room: ['intro_camino', 'intro_camino'], amb: '#d6ad90',
    setup(R) {
      const a = R.add('alec', null, 2, 10.9, { hero: true, face: 0 }); R.follow = a; R.followOff = [IC(5), -IC(1)]; R.cam.x = a.x + IC(5); R.cam.y = a.y - IC(1);
      R.go(a, [[19, 10.9]], 54);
    },
    beats: [
      { wait: 1, who: 'alec', think: true, text: 'Tardé años en terminarlos. Cada noche, con su martillo, como le había visto hacer a él.' },
      { who: 'alec', think: true, text: 'No lanzan fuego ni rayos. Lanzan cadenas. A lo que muerden, no lo sueltan. No me los he vuelto a quitar.' },
      { wait: 0.6, who: 'alec', think: true, text: 'Después vinieron años de caminos. Entrené solo, contra lo que los dioses dejan suelto por ahí: esqueletos, bestias, cosas sin nombre.',
        on(R) { R.go(R.add('k1', 'pc_skel_war', 44, 10.8, { flip: true }), [[29, 10.8]], 72); R.go(R.add('k2', 'pc_skel', 46, 11.4, { flip: true }), [[31.5, 11.3]], 72); },
        ev: [[2.0, R => R.shoot('alec', 'k1')], [2.7, R => R.shoot('alec', 'k2')]] },
      { who: 'alec', think: true, text: 'Nadie sabe quién soy. Ningún rey me ha contratado nunca, ningún bardo ha cantado nada mío. Mejor: a un desconocido nadie le espera.', on(R) { R.a('alec').aim = null; R.go('alec', [[23, 10.9]], 40); } },
      { who: 'alec', think: true, text: 'Pero ya estoy listo. No busco oro ni gloria. Algún día mataré a los dioses.' },
      { who: 'alec', think: true, text: 'Y cuando caigan, echaré abajo su mundo. Piedra a piedra.' },
    ] },
  { cap: () => kingdomNow().title, room: ['plaza', 'plaza'], amb: null,
    setup(R) {
      const cx = NAV.cols >> 1;
      introPlazaFolk(R);
      const a = R.add('alec', null, cx, 33, { hero: true, face: -Math.PI / 2 }); R.follow = a; R.followOff = [0, -IC(2.5)]; R.cam.x = a.x; R.cam.y = a.y - IC(2.5);   // entra por la avenida
      R.go(a, [[cx, 19.3]], 60, q => { q.face = 0; });
      const gd = R.actors.find(q => q.key === 'guard' && q.x > a.x && q.y < IC(10)) || R.add(null, 'guard', cx + 3.2, 7.4); gd.id = 'guardia'; gd.amb = false;
    },
    tick(R, dt) { introPlazaStroll(R, dt); },   // los vecinos pasean como en la plaza de verdad
    beats: [
      { wait: 1.2, who: 'alec', think: true, text: () => `${kingdomNow().name}. El primer reino al que llego con algo que ofrecer. Dicen que su rey paga en hierro y no hace preguntas.`,
        ev: [[1.7, R => { const cx = NAV.cols >> 1; R.go('guardia', [[cx + 2.6, 9.2], [cx + 2.6, 18.4], [cx + 1.9, 19.2]], 66, q => { q.flip = true; }); }]] },
      { who: 'alec', think: true, text: () => `Desde el camino se ve el humo del Umbral. ${TYPES[kingdomNow().god].name} ya tiene medio reino, y la gente de aquí lo sabe: nadie levanta la voz en el mercado.` },
      { wait: 0.5, who: 'guardia', text: () => `¡Eh, tú! A ti no te había visto nunca. ¿Quién eres y qué buscas en ${kingdomNow().name}?` },
      { who: 'alec', text: 'Me llamo Alec. Vengo a ver al rey.' },
      { who: 'guardia', text: 'Medio reino quiere ver al rey. ¿Y qué le traes tú, que no llevas ni escudo?' },
      { who: 'alec', text: 'La cabeza de su dios. Si me deja ir a buscarla.' },
      { who: 'guardia', text: 'Ya. Sube al castillo. Hoy recibe a cualquiera: hace semanas que nadie se ofrece a nada.' },
    ] },
  // El rey cuenta qué ha pasado en el reino (kingStory, en 36_town.js: es lo mismo que te cuenta si se lo vuelves a preguntar)
  { cap: 'El salón del trono', room: ['hall', 'hall'], amb: '#cdbcae',
    setup(R) {
      const cx = NAV.cols >> 1;
      for (const n of R.room.out.npcs) R.add(n.key === 'king' || n.key === 'queen' ? n.key : null, n.key, n.x, n.y, { flip: !!n.flip, amb: true });
      R.go(R.add('alec', null, cx, NAV.rows - 2.6, { hero: true, face: -Math.PI / 2 }), [[cx, 9.8]], 62, a => { a.face = -Math.PI / 2; });
    },
    beats: [
      { wait: 2.9, min: 0.8, who: 'king', text: '¿Y tú quién eres? No llevas estandarte ni escudo. Mi guardia dice que vienes a ofrecerte.' },
      { who: 'alec', text: 'Me llamo Alec. No vengo de ningún ejército ni sirvo a ningún señor.' },
      { who: 'alec', text: 'He oído lo que le pasa a vuestro reino. He venido a acabar con ello.' },
      { who: 'king', text: 'Muchos vinieron a decirme lo mismo, con mejores armaduras que la tuya. Escucha primero lo que ha pasado aquí, y luego dime si sigues queriendo.' },
      ...kingStory(),
      { who: 'king', text: '¿Y bien? ¿Sigues queriendo?' },
      { who: 'alec', text: 'Cuatro guardianes y un dios. Dadme vuestros encargos y vuestro hierro, y os devolveré vuestro reino.' },
      { who: 'queen', text: '¿Por qué tú, si nadie te conoce?' },
      { who: 'alec', text: 'Porque nadie más ha venido. Y porque a mí los dioses ya no pueden quitarme nada: me lo quitaron todo hace mucho.' },
      { who: 'king', text: 'Un desconocido sin dios y sin escudo. O estás loco, o eres justo lo que este reino necesita.' },
      { who: 'king', text: 'Los encargos están en el tablón de la plaza. Cumple uno y hablaremos de hierro. Vuelve a verme cuando quieras: te explicaré cómo funciona esto.' },
    ] },
];

// ── El final de Valdehierro: el dios cae, el rey paga, la plaza respira y Alec sigue su camino ──
// Vecinos de la plaza como en la última escena del principio: los fijos en su sitio y los paseantes dando vueltas
function introPlazaFolk(R) {
  for (const n of R.room.out.npcs) R.add(null, n.key, n.x, n.y, { flip: !!n.flip, amb: true });
  for (const w of R.room.out.wander || []) { const [ax, ay, aw, ah] = w.area; R.add(null, w.key, ax + Math.random() * aw, ay + Math.random() * ah, { amb: true, area: w.area, waitT: Math.random() * 2 }); }
}
function introPlazaStroll(R, dt) {
  for (const n of R.actors) {
    if (!n.area || n.path.length) continue;
    n.waitT -= dt; if (n.waitT > 0) continue;
    const [ax, ay, aw, ah] = n.area; n.waitT = 1 + Math.random() * 3; R.go(n, [[ax + Math.random() * aw, ay + Math.random() * ah]], 22);
  }
}
const ENDING = [
  { cap: 'El Umbral', room: ['arena', 'boss', true], world: 4, amb: '#a08a96',
    setup(R) {
      R.cam.x = IC(23.5); R.cam.y = IC(12);
      R.add('god', 'firstfist', 27.5, 13.2, { flip: true, glow: '255,120,60' });
      R.add('alec', null, 12.5, 13.6, { hero: true, face: 0 });
    },
    beats: [
      { wait: 6.1, min: 5.5, who: 'alec', think: true, text: () => `${TYPES[kingdomNow().god].name}. El dios de la guerra. Medio reino rezaba para que no viniera.`,
        on(R) { R.go('alec', [[18.5, 13.6]], 44, a => { a.face = 0; }); },
        ev: [[2.5, R => R.shoot('alec', 'god')],
          [2.72, R => { const g = R.a('god'); g.glow = null; R.flash = 0.7; R.shake(9); R.burst(g.x, g.y - 50, 16, ['#ffe08a', '#e0524a', '#ffffff'], 110); sfx('boom', 0.6); }],
          [3.1, R => { R.shake(6); sfx('boom', 0.55, 0.9, 0); }], [3.55, R => { R.shake(6); sfx('boom', 0.55, 1.1, 0); }], [4.0, R => { R.shake(7); R.flash = 0.4; sfx('boom', 0.6, 0.8, 0); }], [4.5, R => { R.shake(8); sfx('bossdie', 0.8, 1, 0); }]] },
      { who: 'alec', think: true, text: 'Un dios sangra como cualquiera. Solo tarda más en caer.', on(R) { R.a('alec').aim = null; } },
      { who: 'alec', think: true, text: 'Esperaba sentir algo. Alivio, rabia, lo que fuera. Solo sentí cansancio, y ganas de que el herrero lo hubiera visto.' },
    ] },
  { cap: 'El salón del trono', room: ['hall', 'hall'], amb: '#cdbcae',
    setup(R) {
      const cx = NAV.cols >> 1;
      for (const n of R.room.out.npcs) R.add(n.key === 'king' || n.key === 'queen' ? n.key : null, n.key, n.x, n.y, { flip: !!n.flip, amb: true });
      R.go(R.add('alec', null, cx, NAV.rows - 2.6, { hero: true, face: -Math.PI / 2 }), [[cx, 9.8]], 62, a => { a.face = -Math.PI / 2; });
    },
    beats: [
      { wait: 2.9, min: 0.8, who: 'king', text: () => `${TYPES[kingdomNow().god].name} ha muerto. Aquí tienes tu hierro, mercenario: lo prometido y algo más.` },
      { who: 'king', text: () => `${kingdomNow().name} es libre. Y te lo debe a ti.` },
      { who: 'alec', text: () => `No lo he hecho por ${kingdomNow().name}.` },
      { who: 'queen', text: 'Lo sabemos. Por eso te pagamos.' },
      { who: 'king', text: 'Los sacerdotes ya dicen que fue voluntad de otro dios. Que tú solo fuiste su mano.' },
      { who: 'alec', text: 'Decidles que esa mano cobra aparte.' },
      { who: 'queen', text: 'Se lo diremos. Y diremos tu nombre en la plaza, aunque no te guste. La gente necesita saber que se puede.' },
    ] },
  { cap: 'La plaza', room: ['plaza', 'plaza'], amb: null,
    setup(R) {
      const cx = NAV.cols >> 1, c = NAV.cols;
      introPlazaFolk(R);
      const a = R.add('alec', null, cx, 7.4, { hero: true, face: Math.PI / 2 }); R.follow = a; R.followOff = [0, IC(1)]; R.cam.x = a.x; R.cam.y = a.y + IC(1);
      R.go(a, [[cx, 12.8]], 46, q => { q.face = Math.PI / 2; });
      // la herrera y la posadera dejan lo suyo y salen a su encuentro
      // (la forja y la posada quedan lejos, en sus barrios: llegan por las calles que entran a la plaza)
      for (const [key, from, pts] of [['smith', [cx - 15, 14.4], [[cx - 12, 14.4], [cx - 2.7, 13.3]]], ['keeper', [cx + 15, 14.4], [[cx + 12, 14.4], [cx + 2.7, 13.4]]]]) { const n = R.actors.find(q => q.key === key); if (n) { n.id = key; n.amb = false; n.x = from[0] * IC(1); n.y = from[1] * IC(1); R.go(n, pts, 84); } }
    },
    tick(R, dt) {   // los vecinos pasean; de vez en cuando alguno da un brinco
      introPlazaStroll(R, dt);
      R.acc += dt; if (R.acc > 0.45) { R.acc = 0; const f = R.actors.filter(q => q.area); if (f.length) f[Math.floor(Math.random() * f.length)].hop = 0.14; }
    },
    beats: [
      { wait: 3.4, min: 0.8, who: 'alec', think: true, text: 'En la plaza ya nadie miraba al camino con miedo.' },
      { who: 'smith', text: 'Esos guanteletes han matado a un dios. Quien los forjó sabía lo que hacía.', on(R) { R.a('alec').face = Math.PI; } },
      { who: 'alec', text: 'Lo sabía.' },
      { who: 'smith', text: '¿Era tu maestro?' },
      { who: 'alec', text: 'Era herrero. Me dio techo, trabajo y pocas palabras. Con eso le bastó.' },
      { who: 'keeper', text: 'Tu cama sigue donde estaba, mercenario. Y esta noche invita la casa.', on(R) { R.a('alec').face = 0; } },
      { who: 'keeper', text: 'Y no pongas esa cara. Por una vez en un año, en esta ciudad se celebra algo.' },
    ] },
  { cap: 'El camino', room: ['intro_camino', 'intro_camino'], amb: '#d6ad90',
    setup(R) {
      const a = R.add('alec', null, 5, 10.9, { hero: true, face: 0 }); R.follow = a; R.followOff = [IC(5), -IC(1)]; R.cam.x = a.x + IC(5); R.cam.y = a.y - IC(1);
      R.go(a, [[17, 10.9]], 50);
    },
    beats: [
      { wait: 1.6, who: 'alec', think: true, text: 'No me quedé a la fiesta. No era mía.' },
      { wait: 0.9, who: 'alec', think: true, text: 'Queda uno menos. Faltan los demás.', on(R) { R.go('alec', [[25, 10.9]], 44); } },
      { wait: 5.2, min: 2.6, on(R) { R.follow = null; R.camTo = null; R.go('alec', [[46, 10.9]], 50); R.endCard(`${kingdomNow().name} es libre`, 'Continuará'); } },
    ] },
];

// ── Tras cada zona liberada (al caer su guardián por primera vez): el rey recibe a Alec en el salón del trono ──
// De la incredulidad del principio a creerse que de verdad puede matar al dios. Después del cuarto, la caída del dios (ENDING).
function throneScene(cap, beats) {
  return { cap, room: ['hall', 'hall'], amb: '#cdbcae',
    setup(R) {
      const cx = NAV.cols >> 1;
      for (const n of R.room.out.npcs) R.add(n.key === 'king' || n.key === 'queen' ? n.key : null, n.key, n.x, n.y, { flip: !!n.flip, amb: true });
      R.go(R.add('alec', null, cx, NAV.rows - 2.6, { hero: true, face: -Math.PI / 2 }), [[cx, 9.8]], 62, a => { a.face = -Math.PI / 2; });
    }, beats };
}
const zoneFell = z => { const n = kingdomNow().zones[z].name; return n + (/^(Las|Los) /.test(n) ? ' han caído' : ' ha caído'); };   // «Las Criptas han caído», «El Nido ha caído»
const ZONE_SCENES = [
  [throneScene(() => zoneFell(0), [
    { wait: 2.9, min: 0.8, who: 'king', text: '¿Ya de vuelta? ¿Qué ha pasado? Te di por muerto, o por huido, que aquí viene a ser lo mismo.' },
    { who: 'alec', text: () => `${kingdomNow().zones[0].name} están limpias. ${TYPES[WORLDS[0].boss].name} no volverá a levantarse.` },
    { who: 'king', text: '¿Cómo que…? ¿Tú solo? Mandé allí a una compañía entera y no volvió nadie.' },
    { who: 'queen', text: 'Es imposible. Nadie llega del camino, sin nombre ni escudo, y tumba al guardián de un dios en una semana.' },
    { who: 'alec', text: 'Pues alguien acaba de hacerlo.' },
    { who: 'king', text: () => `Que alguien suba a las almenas y mire hacia ${lc(kingdomNow().zones[0].name)}. ¡Ahora!` },
    { wait: 1.2, who: 'queen', text: 'Ya no sale humo de allí. Por primera vez en un año, ya no sale humo.' },
    { who: 'king', text: 'Muy bien, Alec. Uno. Quedan tres. No voy a mentirte: sigo pensando que la suerte se acaba.' },
    { who: 'alec', text: 'No ha sido suerte.' },
  ])],
  [throneScene(() => zoneFell(1), [
    { wait: 2.9, min: 0.8, who: 'king', text: () => `Me lo han contado los aldeanos de ${kingdomNow().zones[1].m[1].replace('La aldea de ', '')} antes que mis propios exploradores. ${TYPES[WORLDS[1].boss].name}, muerta.` },
    { who: 'alec', text: () => `${kingdomNow().zones[1].name} está limpio. La seda arde bien.` },
    { who: 'queen', text: 'Dos guardianes. Hace un mes nadie en este castillo se atrevía ni a nombrarlos.' },
    { who: 'king', text: 'Mis consejeros dicen que eres el enviado de algún dios rival. Que esto es una guerra entre ellos, y tú solo su arma.' },
    { who: 'alec', text: 'No sirvo a ningún dios. Precisamente por eso funciona.' },
    { who: 'queen', text: 'Entonces, ¿qué eres?' },
    { who: 'alec', text: 'Alguien a quien un ejército como estos se lo quitó todo. Hace mucho, en un pueblo que ya no sale en los mapas.' },
    { who: 'king', text: 'Empiezo a creerte. Y empiezo a creerme otra cosa, que me asusta más: que de verdad puedes conseguirlo.' },
  ])],
  [throneScene(() => zoneFell(2), [
    { wait: 2.9, min: 0.8, who: 'queen', text: () => `Los picadores de ${lc(kingdomNow().zones[2].name)} han vuelto a casa. Con los ojos de su color, Alec. Eso no puede ser.` },
    { who: 'alec', text: () => `Lo que llevaban dentro se fue cuando cayó ${lc(TYPES[WORLDS[2].boss].name)}.` },
    { who: 'king', text: () => `Tres de cuatro. ¿Sabes lo que significa? Si cae el último, ${lc(TYPES[kingdomNow().god].name)} tendrá que bajar de su trono de ceniza.` },
    { who: 'queen', text: 'Y entonces vendrá a por ti. A por todos nosotros.' },
    { who: 'alec', text: 'Que venga. Llevo esperándole desde que tenía nueve años.' },
    { who: 'king', text: 'He mandado forjar una corona de hierro para el día que caiga. Hasta ayer me parecía una locura.' },
    { who: 'queen', text: 'Hoy le he oído reírse. Hacía un año que no se reía.' },
  ])],
  [throneScene(() => zoneFell(3), [
    { wait: 2.9, min: 0.8, who: 'king', text: () => `${TYPES[WORLDS[3].boss].name} ha caído. Los cuatro, Alec. ¡Los cuatro!` },
    { who: 'queen', text: 'La gente canta tu nombre en la plaza. Un nombre que hace unas semanas no conocía nadie.' },
    { who: 'alec', text: 'Que no canten todavía. Queda él.' },
    { who: 'king', text: () => `${TYPES[kingdomNow().god].name} ya no tiene detrás de quién esconderse. Mis exploradores dicen que el cielo ${deN(kingdomNow().zones[3].name)} arde día y noche: te está esperando.` },
    { who: 'queen', text: 'No tienes por qué ir. Has hecho más de lo que nadie podía pedirte.' },
    { who: 'alec', text: 'Vine a matar a un dios. No me voy a ir con el trabajo a medias.' },
    { who: 'king', text: 'Entonces ve. Y vuelve. Este reino no tiene hierro suficiente para pagarte, pero encontraremos la forma.' },
  ])],
];
function playZone(z) { playScenes(ZONE_SCENES[z], 'seenZone' + z, 'hall'); }
// La escena de una zona se debe la primera vez que cae su guardián
const zoneDue = () => !!S && S.mode === 'win' && !!S.mission && S.mission.type === 'boss' && ZONE_SCENES[S.mission.z] && !M['seenZone' + S.mission.z];

// ── Poner en marcha, pasar de escena y acabar ──
let introHudOn = false, introTap = false, INTRO_LM = null;
// El motor reproduce una lista de escenas: la del principio (INTRO) o el final de un reino (ENDING). «seen» es la marca que deja en el guardado.
function playScenes(L, seen, after) {
  newGame(); S.gun = Object.assign({}, M.gun);
  S.mode = 'intro'; modeT = 0; S.intro = { L, seen, after, i: 0, b: 0, bt: 0, evi: 0, phase: 'wait', txt: '', R: null };
  introTap = false; renderOverlay(); introScene(0); sfx('ok', 0.3,0.7);
}
function playIntro() { playScenes(INTRO, 'seenIntro'); }
function playEnding() { playScenes(ENDING, 'seenEnding'); }
// El final se debe la primera vez que cae el dios del reino (o, en guardados de antes de que existiera, la próxima vez que caiga)
const endingDue = () => !!S && S.mode === 'win' && !!S.mission && S.mission.type === 'god' && !M.seenEnding;
function introEnd() {
  const seen = S.intro && S.intro.seen, after = S.intro && S.intro.after;
  S.dialog = null; S.intro = null;
  if (seen && !M[seen]) { M[seen] = 1; save(); }
  openTown(after);   // tras una escena del salón del trono, sigues allí
}
function introScene(i) {
  const N = S.intro, sc = N.L[i], room = buildRoom(!!sc.room[2], sc.room[0], sc.room[1]);   // room: [generador, tamaño, ¿arena de jefe?]
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.traps = []; S.world = sc.world || 1; S.dialog = null;
  const R = N.R = {
    t: 0, room, actors: [], fx: [], fires: [], houses: [], props: [], cam: { x: room.w / 2, y: room.h / 2 }, camTo: null, camV: 1.6, follow: null, followOff: [0, 0],
    fade: 1, dip: null, shk: 0, flash: 0, cap: typeof sc.cap === 'function' ? sc.cap() : sc.cap, capT: 0, burnt: false, amb: sc.amb, stage: 0, acc: 0, hitT: 0, card: null,
    a: id => R.actors.find(q => q.id === id),
    add(id, key, x, y, o) { const a = Object.assign({ id, key, x: IC(x), y: IC(y), flip: false, path: [], speed: 60, walking: false, fall: null, fallDir: 1, hidden: false, ph: Math.random() * 3, once: null, flash: 0, hop: 0, kick: 0, then: null }, o); R.actors.push(a); return a; },
    go(a, pts, speed, then) { if (typeof a === 'string') a = R.a(a); if (!a || a.fall != null) return a; a.path = pts.map(p => [IC(p[0]), IC(p[1])]); a.speed = speed || 60; a.then = then || null; return a; },
    fall(a, dir) { if (typeof a === 'string') a = R.a(a); if (!a || a.fall != null) return; a.fall = 0; a.fallDir = dir || 1; a.path = []; a.walking = false; a.then = null; },
    burst(x, y, n, cols, v) { for (let k = 0; k < n; k++) { const an = Math.random() * Math.PI * 2, s = (0.4 + Math.random() * 0.6) * (v || 50); R.fx.push({ k: 'spark', x, y, vx: Math.cos(an) * s, vy: Math.sin(an) * s - 20, g: 120, t: 0, life: 0.25 + Math.random() * 0.35, col: cols[k % cols.length] }); } },
    shake(n) { R.shk = Math.max(R.shk, n); },
    dipTo(fn) { R.dip = { t: 0, fn, done: false }; },
    setCap(txt) { R.cap = txt; R.capT = 0; },
    endCard(big, small) { R.card = { t: 0, big, small }; },   // rótulo final a pantalla completa, sobre negro
    shoot(from, to) {   // un conjuro de los guanteletes: sale, llega y derriba
      const a = R.a(from), b = R.a(to); if (!a || !b || b.fall != null) return;
      a.aim = Math.atan2(b.y - a.y, b.x - a.x); a.kick = 3;
      R.fx.push({ k: 'bolt', x1: a.x + 12, y1: a.y - 11, x2: b.x, y2: b.y - 14, t: 0, life: 0.1, hit() { R.fall(b, 1); R.burst(b.x, b.y - 14, 6, ['#efe6c8', '#c9b98a'], 60); sfx('kill', 0.4,0.9); } });
      sfx('cast', 0.4);
    },
  };
  for (const o of (room.out && room.out.obs) || []) if (o.kind === 'ihouse') { const s = HOUSES[o.hs], cx = (o.x + o.w / 2) * CELL, by = (o.y + o.h) * CELL; R.houses.push({ hs: o.hs, s, cx, by, sx: Math.round(cx - s[2] / 2), sy: by + 2 - s[3], fire: 0, fireTo: 0, char: 0, smoke: 0 }); }
  N.i = i; sc.setup(R); introBeat(0, true);
}
// Cerrar el tiempo en curso: lo programado que no haya pasado, pasa; quien iba andando, llega
function introFinishBeat() {
  const N = S.intro, R = N.R, B = N.L[N.i].beats[N.b];
  if (B && B.ev) while (N.evi < B.ev.length) B.ev[N.evi++][1](R);
  if (R.dip) { if (!R.dip.done) R.dip.fn(R); R.dip = null; R.fade = 0; }
  for (const f of R.fx) if (f.k === 'bolt' && f.hit) { f.hit(); f.hit = null; }
  for (const a of R.actors) if (!a.amb && a.path.length) { const p = a.path[a.path.length - 1]; a.x = p[0]; a.y = p[1]; a.path = []; a.walking = false; const f = a.then; a.then = null; if (f) f(a); }
  S.dialog = null;
}
function introBeat(k, fresh) {
  const N = S.intro, sc = N.L[N.i];
  if (!fresh) introFinishBeat();
  if (k >= sc.beats.length) { N.phase = 'hold'; N.bt = 0; return; }
  N.b = k; N.bt = 0; N.evi = 0; N.phase = 'wait';
  const B = sc.beats[k]; if (B.on) B.on(N.R);
  if (!fresh) sfx('tick', 0.15,1.3);
}
function introUpdate(dt) {
  const N = S.intro; if (!N) return;
  S.t += dt;
  const adv = I.atkP || introTap; introTap = false;
  if (I.startP && modeT > 0.2) { introEnd(); return; }
  const R = N.R, sc = N.L[N.i]; R.t += dt;
  introSim(R, sc, dt);
  if (N.phase === 'out') { R.fade = Math.min(1, R.fade + dt / 0.45); if (R.fade >= 1) { if (N.i + 1 < N.L.length) introScene(N.i + 1); else introEnd(); } return; }
  if (R.dip) {   // un fundido corto a negro para saltar en el tiempo dentro de la misma escena
    const d = R.dip; d.t += dt; R.fade = d.t < 0.35 ? d.t / 0.35 : Math.max(0, 1 - (d.t - 0.35) / 0.45);
    if (d.t >= 0.35 && !d.done) { d.done = true; d.fn(R); }
    if (d.t >= 0.8) R.dip = null;
  } else R.fade = Math.max(0, R.fade - dt / 0.6);
  if (I.dodgeP && R.t > 0.25) { introFinishBeat(); N.phase = 'out'; sfx('tick', 0.25,0.9); return; }
  if (N.phase === 'hold') { N.bt += dt; if (N.bt > 0.5) N.phase = 'out'; return; }
  const B = sc.beats[N.b]; N.bt += dt;
  if (B.ev) while (N.evi < B.ev.length && N.bt >= B.ev[N.evi][0]) B.ev[N.evi++][1](R);
  if (N.phase === 'wait') {
    if (N.bt >= (B.wait == null ? 0.35 : B.wait) || (adv && N.bt >= (B.min == null ? 0.25 : B.min))) {
      if (!B.text) { introBeat(N.b + 1); return; }
      N.txt = typeof B.text === 'function' ? B.text() : B.text; N.phase = 'say';
      S.dialog = { lines: [{ who: B.who, text: N.txt, think: !!B.think }], i: 0, ch: 0, choices: null, sel: 0, t: 0, onEnd: null };
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
  R.shk = Math.max(0, R.shk - dt * 18); R.flash = Math.max(0, R.flash - dt * 2.4); R.capT += dt; if (R.card) R.card.t += dt;
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
    if (TYPES[a.key] && TYPES[a.key].boss) { drawGodFall(a.key, x, y, a.flip, a.fall, TYPES[a.key].color); return; }   // un dios no vuelca: se deshace
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
  if (R.card) {   // el rótulo final: negro, el título y, un poco después, la línea pequeña
    const c = R.card, a = clamp(c.t / 0.9, 0, 1);
    scr.globalAlpha = a; scr.fillStyle = '#07050a'; scr.fillRect(0, 0, cv.width, cv.height);
    scr.globalAlpha = clamp((c.t - 0.5) / 0.8, 0, 1); scr.font = `600 ${Math.round(30 * dp)}px ${FONT}`; scr.fillStyle = '#efe6c8'; scr.fillText(c.big, cv.width / 2, cv.height * 0.46);
    if (c.small) { scr.globalAlpha = clamp((c.t - 1.7) / 0.8, 0, 1) * 0.8; scr.font = `500 ${Math.round(15 * dp)}px ${FONT}`; scr.fillText(c.small, cv.width / 2, cv.height * 0.46 + 34 * dp); }
    scr.globalAlpha = 1;
  }
  scr.restore();
  if (S.dialog) drawDialog(k);
  return true;
}

// El botón «Recordar el final» de la habitación de la posada (data-act="ending"): se atiende aquí, delante de forgeAct
{ const act0 = forgeAct; forgeAct = function (act) { if (act === 'ending') { playEnding(); return; } const z = /^zone(\d)$/.exec(act); if (z) { playZone(+z[1]); return; } act0(act); }; }
