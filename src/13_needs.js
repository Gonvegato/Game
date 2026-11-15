// ───────────────────────── Qué hace funcionar a cada técnica ─────────────────────────
// Muchas técnicas solo sirven si otra cosa pone antes su mecánica (Racha sin críticos, Prisma sin Cristales…).
// Esta tabla dice, para cada técnica de ranura, técnica suelta, dúo, pieza de los guanteletes, plano, resonancia
// y guanteletes legendarios:
//   da:   las mecánicas que pone en juego solo por llevarlo, funcione o no lo demás que hace.
//   pide: lo que necesita para servir de algo. Si falta, no te la ofrecen al quebrar una reliquia.
//         Solo se apunta lo que, sin esa mecánica, deja la técnica inútil o casi; un extra condicionado
//         («y si además arde, …») no cuenta.
//   daSi: mecánicas que solo pone si ya tiene lo que se indica (Orden solo hace explosiones si hay Sombras).
// Cada palabra es una mecánica; «a|b» quiere decir «a o b». Sale de leer las descripciones y el código de
// 40_combat.js, 41_weapon.js y 43_update.js. En el código, el filtro está en 32_rewards.js (pieceCard y techOk).

// Las mecánicas. txt: cómo se dice en «Necesita: …». from: qué mecánicas cuentan como fuente al listar ejemplos.
// base: la tiene todo el mundo (esquivar), salvo lo que diga el código de abajo.
const MECH = {
  ascuas:       { txt: 'algo que clave Ascuas' },
  veneno:       { txt: 'algo que ponga Veneno' },
  cristales:    { txt: 'algo que deje Cristales' },
  usaCristales: { txt: 'algo que use los Cristales' },
  cura:         { txt: 'algo que te cure con la vida llena' },
  reservaOn:    { txt: 'una técnica de Manjares en tus ranuras' },   // con ella, la curación que sobra va a la Reserva (heal, 40_combat.js)
  reserva:      { txt: 'llenar la Reserva, o sea, llevar algo de Manjares y algo que te cure con la vida llena', from: ['cura', 'reserva'] },
  furia:        { txt: 'tener Furia: una técnica de Orcos en tus ranuras o los Dedos de tambor' },   // gainFury no hace nada sin eso
  eco:          { txt: 'algo que deje ecos o repita el cargado' },
  ecoSegundero: { txt: 'la técnica Segundero (o un dúo con ella)' },
  sombras:      { txt: 'algo que levante Sombras' },
  agujas:       { txt: 'algo que clave Agujas' },
  descarga:     { txt: 'algo que descargue las Agujas' },
  rayo:         { txt: 'algo que lance rayos' },
  empapado:     { txt: 'algo que empape' },
  choque:       { txt: 'algo que estampe enemigos contra el muro' },
  criticos:     { txt: 'algo que dé probabilidad de crítico (sin eso no hay ninguna)' },   // critChance (40_combat.js) es 0 para todo el mundo
  enraizado:    { txt: 'algo que enraíce' },
  zarzal:       { txt: 'un zarzal' },
  congelado:    { txt: 'algo que congele (que ponga Escarcha)' },
  frenado:      { txt: 'algo que frene o aturda' },
  herida:       { txt: 'algo que abra Heridas' },
  pagarVida:    { txt: 'algo que te cobre vida' },
  sentencia:    { txt: 'algo que ponga Sentencias' },
  iluminado:    { txt: 'algo que Ilumine' },
  usaIlum:      { txt: 'algo que aproveche a los Iluminados' },
  dormido:      { txt: 'algo que Duerma' },
  amontonado:   { txt: 'algo que amontone a los enemigos' },
  pozoDano:     { txt: 'un pozo que haga daño' },
  explosion:    { txt: 'algo que explote' },
  temple:       { txt: 'algo que dé Temple' },
  perro:        { txt: 'un perro' },
  reflejo:      { txt: 'un Reflejo' },
  esquive:      { txt: 'poder esquivar (con el Brazal de torre no se puede)', base: true },
  atravesar:    { txt: 'atravesar enemigos (Palma de lanza, Brasa de embestida)' },
  brasaRayo:    { txt: 'la Brasa de rayo' },
};
// Mecánicas que salen de juntar otras dos
const NEED_RULES = [
  ['reserva', 'cura reservaOn'],   // la Reserva se llena con la curación que sobra, solo si llevas algo de Manjares
];

const NEEDS = {
  // ── Técnicas de ranura ──
  // Dragones
  dragon_basic:   { da: 'ascuas' },
  dragon_charge:  { da: 'ascuas explosion' },                 // clava Ascuas y las hace estallar: sirve sola
  dragon_dodge:   { da: 'explosion', pide: 'esquive' },
  dragon_passive: {},                                          // el oro lo tiene todo el mundo; las monedas por Ascuas son un extra
  // Minerales: los Cristales solos no hacen nada
  stone_basic:    { da: 'cristales', pide: 'usaCristales' },
  stone_charge:   { da: 'usaCristales', pide: 'cristales' },
  stone_dodge:    { da: 'cristales usaCristales explosion', pide: 'esquive' },   // deja Cristales y los revienta: la fuente
  stone_passive:  { da: 'usaCristales', pide: 'cristales' },
  // Veneno
  venom_basic:    { da: 'veneno' },
  venom_charge:   { pide: 'veneno' },
  venom_dodge:    { da: 'veneno', pide: 'esquive' },
  venom_passive:  { pide: 'veneno' },
  // Manjares: cualquier técnica suya abre la Reserva, pero hay que curarse con la vida llena para llenarla
  feast_basic:    { da: 'cura reservaOn' },
  feast_charge:   { da: 'reservaOn', pide: 'reserva' },       // su curación al matar dura 0,6 s: no se cuenta como fuente
  feast_dodge:    { da: 'cura reservaOn', pide: 'esquive|atravesar' },
  feast_passive:  { da: 'reservaOn', pide: 'reserva' },
  // Orcos: cualquier técnica suya da Furia (al golpear y al recibir golpes)
  orc_basic:      { da: 'furia' },
  orc_charge:     { da: 'furia explosion choque frenado' },
  orc_dodge:      { da: 'furia choque frenado', pide: 'esquive|atravesar' },
  orc_passive:    { da: 'furia' },
  // Tiempo
  time_basic:     { da: 'eco ecoSegundero' },
  time_charge:    { da: 'eco' },
  time_dodge:     { da: 'frenado', pide: 'esquive' },
  time_passive:   { pide: 'frenado' },
  // Sombras
  shade_basic:    { da: 'sombras' },
  shade_charge:   { pide: 'sombras', daSi: { explosion: 'sombras' } },
  shade_dodge:    { da: 'sombras', pide: 'esquive' },          // la Sombra de Relevo también pelea
  shade_passive:  { pide: 'sombras' },
  // Tormenta: clavar y descargar son dos técnicas distintas, salvo Paso relámpago que hace las dos
  storm_basic:    { da: 'agujas', pide: 'descarga' },
  storm_charge:   { da: 'descarga rayo', pide: 'agujas' },
  storm_dodge:    { da: 'agujas descarga rayo', pide: 'esquive|atravesar' },
  storm_passive:  { pide: 'descarga', daSi: { agujas: 'descarga' } },
  // Mareas: los empujones de Mareas estampan contra el muro y el golpe aturde
  tide_basic:     { da: 'empapado choque frenado' },
  tide_charge:    { da: 'empapado choque frenado' },
  tide_dodge:     { da: 'empapado choque frenado', pide: 'esquive' },
  tide_passive:   { pide: 'empapado' },
  // Fortuna
  luck_basic:     { da: 'criticos' },
  luck_charge:    {},
  luck_dodge:     { da: 'explosion', pide: 'esquive' },
  luck_passive:   { pide: 'criticos' },
  // Bosque
  wood_basic:     { da: 'enraizado frenado' },
  wood_charge:    { da: 'zarzal frenado' },
  wood_dodge:     { da: 'enraizado frenado', pide: 'esquive' },
  wood_passive:   { pide: 'enraizado|zarzal', daSi: { cura: 'enraizado|zarzal' } },
  // Hielo: Quebrar pone 3 de Escarcha a los que no rompe; dos cargados seguidos ya congelan
  frost_basic:    { da: 'congelado frenado' },
  frost_charge:   { da: 'congelado frenado explosion' },
  frost_dodge:    { da: 'congelado frenado', pide: 'esquive' },
  frost_passive:  { pide: 'congelado', daSi: { congelado: 'congelado' } },
  // Sangre
  blood_basic:    { da: 'herida' },
  blood_charge:   { da: 'pagarVida' },
  blood_dodge:    { da: 'cura', pide: 'esquive|atravesar' },
  blood_passive:  {},
  // Final: la Sentencia que no se cumple estalla al morir el enemigo
  end_basic:      { da: 'sentencia explosion' },
  end_charge:     { pide: 'sentencia' },
  end_dodge:      { pide: 'sentencia esquive', daSi: { cura: 'sentencia' } },
  end_passive:    { pide: 'sentencia' },
  // Luz: Señalar y Destello Iluminan ellos mismos lo que aprovechan
  light_basic:    { da: 'iluminado usaIlum' },
  light_charge:   { da: 'iluminado usaIlum frenado' },
  light_dodge:    { da: 'iluminado', pide: 'esquive' },
  light_passive:  { da: 'usaIlum', pide: 'iluminado' },
  // Sueño: Pesadilla duerme a los despiertos, así que sirve sola
  dream_basic:    { da: 'dormido' },
  dream_charge:   { da: 'dormido' },
  dream_dodge:    { da: 'dormido', pide: 'esquive' },
  dream_passive:  { pide: 'dormido' },
  // Vacío
  void_basic:     { da: 'amontonado' },
  void_charge:    { da: 'amontonado pozoDano explosion' },
  void_dodge:     { da: 'amontonado', pide: 'esquive' },
  void_passive:   { pide: 'amontonado' },                    // dudoso: en una melé ya se pegan algo, pero poco
  // Espejos
  mirror_basic:   { da: 'reflejo' },
  mirror_charge:  { da: 'reflejo' },
  mirror_dodge:   { da: 'frenado', pide: 'esquive' },
  mirror_passive: { da: 'explosion' },
  // Bestias
  beast_basic:    { da: 'perro' },
  beast_charge:   { da: 'perro explosion frenado' },
  beast_dodge:    { da: 'perro choque', pide: 'esquive' },
  beast_passive:  {},
  // Forja
  forge_basic:    { da: 'temple' },
  forge_charge:   { da: 'temple frenado' },
  forge_dodge:    { pide: 'esquive' },
  forge_passive:  {},

  // ── Dúos ── Solo lo que añade la regla del dúo: lo de sus dos técnicas ya sale de sus entradas.
  // Un dúo se ofrece si sirve la técnica nueva que trae o si sirve su regla (ver dúoOk). Los de esquive piden además poder esquivar.
  obsidian:   { da: 'ascuas explosion usaCristales' },
  eternal:    {},
  tombstone:  { da: 'sombras usaCristales' },
  boil:       { da: 'veneno' },
  syringe:    { pide: 'descarga', daSi: { veneno: 'descarga' } },
  warhunger:  {},
  clockmark:  { da: 'sombras' },
  steam:      { da: 'explosion' },
  ram:        {},
  facet:      { da: 'cristales', pide: 'usaCristales' },     // más Cristales: siguen sin servir si nada los usa
  snakeeyes:  {},
  loaded:     {},
  graveroot:  { da: 'sombras' },
  thornrod:   { da: 'descarga rayo' },                         // al brotar descarga: Aguja estática ya sirve dentro del dúo
  clover:     {},
  glacier:    { da: 'cristales', pide: 'usaCristales' },
  hail:       { da: 'descarga rayo' },
  hibernate:  { da: 'dormido' },                               // al descongelarse se duermen (Arrullo ya duerme)
  warwound:   {},
  hemotoxin:  {},
  deadline:   {},
  verdict:    {},
  lens:       { da: 'iluminado usaCristales' },
  beacon:     { pide: 'descarga|rayo' },
  doubles:    {},
  prismatic:  { da: 'usaIlum' },
  warhound:   {},
  rabid:      { da: 'veneno' },
  forgefire:  { da: 'ascuas' },
  rot:        { da: 'veneno' },                                // las Ascuas de Aliento pasan a Veneno para Purga
  roar:       { pide: 'brasaRayo' },
  rod:        { pide: 'agujas cristales' },
  table:      { pide: 'cristales', daSi: { reserva: 'cristales' } },
  cortege:    { pide: 'sombras', daSi: { veneno: 'sombras' } },
  supper:     { pide: 'sombras', daSi: { reserva: 'sombras' } },
  echocry:    {},
  winetide:   { da: 'reserva' },
  tsunami:    { pide: 'agujas' },
  allin:      {},
  wager:      {},
  wildfire:   { da: 'ascuas' },
  perennial:  {},
  iceberg:    { da: 'congelado' },                             // Maremoto empapa y la ola siguiente congela
  bloodrite:  { da: 'sombras' },
  autodafe:   { pide: 'sentencia' },
  digest:     { daSi: { reserva: 'dormido' } },
  maelstrom:  {},
  collapse:   { da: 'explosion' },
  afterimage: {},
  wolfthorn:  { da: 'enraizado' },
  warhammer:  {},
  comet:      {},
  avalanche:  { da: 'explosion usaCristales' },
  stalagm:    { da: 'cristales veneno usaCristales' },
  miasma:     {},
  toast:      {},
  horde:      {},
  stasis:     { da: 'agujas descarga' },
  reef:       { da: 'usaCristales explosion' },
  whirl:      {},
  toss:       {},
  fork:       { da: 'descarga' },
  nettle:     {},
  uproot:     {},
  mangrove:   {},
  siesta:     {},
  funnel:     { da: 'frenado' },
  frostthorn: {},
  bloodhound: { da: 'herida' },
  quench:     { da: 'agujas' },
  hoardfeast: { da: 'cura' },                                  // el oro cura, y para Glotón cuenta como Reserva
  ashlegion:  { pide: 'sombras', daSi: { ascuas: 'sombras', explosion: 'sombras' } },
  clockquartz:{ pide: 'cristales', daSi: { frenado: 'cristales' } },
  indigest:   { pide: 'veneno', daSi: { cura: 'veneno' } },
  longlunch:  { pide: 'reserva', daSi: { frenado: 'reserva' } },
  warthunder: { da: 'rayo agujas' },
  chargedshade: { pide: 'sombras', daSi: { agujas: 'sombras', descarga: 'sombras' } },
  brine:      { pide: 'veneno empapado' },
  drowned:    { pide: 'empapado', daSi: { sombras: 'empapado' } },
  jackpot:    { pide: 'criticos' },
  bones:      { pide: 'sombras', daSi: { criticos: 'sombras' } },
  amber:      { pide: 'enraizado|zarzal', daSi: { cristales: 'enraizado|zarzal' } },
  orchard:    { pide: 'enraizado', daSi: { cura: 'enraizado' } },
  stillness:  { pide: 'congelado' },
  thicket:    { pide: 'enraizado|zarzal' },
  sunfire:    { da: 'usaIlum', pide: 'ascuas iluminado' },
  eclipse:    { da: 'usaIlum', pide: 'sombras', daSi: { iluminado: 'sombras' } },
  luckglass:  {},
  bloodwine:  { pide: 'pagarVida', daSi: { reserva: 'pagarVida' } },
  obituary:   { pide: 'sentencia', daSi: { sombras: 'sentencia' } },
  poppy:      { pide: 'veneno', daSi: { dormido: 'veneno' } },
  whetstone:  { pide: 'cristales', daSi: { temple: 'cristales' } },

  // ── Técnicas sueltas ──
  d_blood:    { pide: 'explosion', daSi: { ascuas: 'explosion' } },
  d_pyre:     { pide: 'ascuas', daSi: { explosion: 'ascuas' } },   // vale con cualquier Ascua, no solo con Colmillo al rojo
  m_reson:    { da: 'usaCristales', pide: 'cristales explosion' },
  m_quartz:   { da: 'cristales', pide: 'usaCristales' },
  v_vapors:   { pide: 'explosion', daSi: { veneno: 'explosion' } },
  v_syn:      { pide: 'veneno' },
  f_cellar:   { pide: 'reserva' },
  f_carve:    {},
  o_drums:    { pide: 'furia' },
  o_berserk:  { pide: 'furia' },
  t_overtime: { pide: 'eco' },
  t_paradox:  { da: 'eco', pide: 'ecoSegundero' },              // solo repite los ecos de Segundero
  s_guard:    { pide: 'sombras' },
  s_legion:   { pide: 'sombras' },
  r_over:     { da: 'descarga rayo', pide: 'agujas' },
  d_warm:     { da: 'ascuas' },
  m_skin:     {},
  v_slow:     { da: 'veneno' },
  f_appet:    { da: 'cura' },
  o_scars:    {},
  t_second:   { pide: 'esquive' },
  s_last:     { da: 'sombras' },
  r_spark:    { da: 'rayo' },
  w_brine:    { da: 'choque frenado' },
  w_deep:     { pide: 'choque' },
  l_coin:     { da: 'criticos' },
  l_jack:     { pide: 'criticos', daSi: { explosion: 'criticos' } },   // vale cualquier crítico, no solo los de Dado cargado
  b_thorn:    { da: 'enraizado frenado' },
  b_bloom:    { pide: 'enraizado', daSi: { zarzal: 'enraizado' } },
  i_rime:     { da: 'frenado' },                                // 1 de Escarcha cada 4 disparos se pierde antes de llegar a 5: no congela
  i_shatter:  { pide: 'congelado' },
  h_warm:     {},                                               // cura solo con poca vida: no llena la Reserva
  h_frenzy:   {},
  e_ink:      { da: 'sentencia explosion' },
  e_seal:     { pide: 'sentencia', daSi: { frenado: 'sentencia' } },
  u_glint:    { da: 'iluminado', pide: 'usaIlum' },
  u_halo:     { da: 'usaIlum', pide: 'iluminado', daSi: { explosion: 'iluminado' } },
  z_yawn:     { da: 'dormido' },
  z_night:    { pide: 'dormido', daSi: { frenado: 'dormido' } },
  o_tug:      { da: 'amontonado' },
  o_crush:    { pide: 'pozoDano' },
  q_shard:    {},
  q_break:    {},
  a_pup:      { da: 'perro' },
  a_feral:    { pide: 'perro', daSi: { cura: 'perro' } },
  g_whet:     {},
  g_slag:     { pide: 'temple', daSi: { explosion: 'temple' } },
  r_judge:    { pide: 'descarga', daSi: { explosion: 'descarga' } },

  // ── Piezas de los guanteletes ── (las que no aparecen ni dan ni piden nada de esto)
  b_scatter: { da: 'choque frenado' },
  b_spike:   { da: 'atravesar' },
  b_flame:   { da: 'ascuas' },
  b_blow:    { da: 'veneno' },
  b_wyrm:    { da: 'ascuas' },
  b_rod:     { da: 'agujas descarga rayo' },                   // se descarga solo al juntar 6
  b_icicle:  { da: 'congelado frenado' },
  b_horn:    { da: 'frenado' },
  b_net:     { da: 'enraizado frenado' },
  a_rider:   { pide: 'esquive' },
  a_kick:    { da: 'choque frenado' },
  a_drum:    { da: 'furia' },
  a_glass:   { da: 'eco' },
  a_dice:    { da: 'criticos' },
  a_nana:    { da: 'dormido' },
  a_burst:   { da: 'frenado' },
  m_charged: { da: 'explosion' },
  m_heavy:   { da: 'choque frenado' },
  m_blood:   { da: 'pagarVida cura' },
  m_ice:     { da: 'frenado congelado' },                      // al segundo impacto deja Congelado 0,8 s (no a los jefes)
  m_fire:    { da: 'ascuas' },
  m_seed:    { da: 'enraizado frenado' },
  m_salt:    { da: 'empapado choque' },
  m_saw:     { da: 'herida' },
  m_star:    { da: 'iluminado usaIlum' },
  m_blunt:   { da: 'frenado' },
  m_timed:   { da: 'explosion' },
  m_leech:   { da: 'cura' },
  s_grave:   { da: 'sombras' },
  s_wine:    { da: 'cura reserva' },                           // con la vida llena, cada baja va a la Reserva aunque no lleves Manjares
  s_kennel:  { da: 'perro' },
  s_geode:   { da: 'cristales usaCristales' },
  s_heavy:   { da: 'choque frenado' },
  s_spikes:  { da: 'frenado', pide: 'esquive|atravesar' },
  s_dance:   { pide: 'esquive|atravesar' },
  s_tower:   {},                                               // quita el esquive a todo el mundo (ver mechsOf)
  c_beam:    { da: 'brasaRayo' },
  c_dash:    { da: 'atravesar' },
  c_blast:   { da: 'choque frenado' },
  c_mine:    { da: 'explosion' },
  c_nova:    { da: 'choque' },
  c_meteor:  { da: 'explosion frenado' },
  c_balm:    { da: 'cura choque' },
  c_sima:    { da: 'amontonado pozoDano explosion' },
  c_doom:    { da: 'sentencia explosion' },
  c_anvil:   { da: 'temple frenado' },
  c_ward:    { da: 'choque' },
  c_blink:   { da: 'explosion' },
  c_drain:   { da: 'cura' },
  c_quake:   { da: 'frenado' },
};
// Planos, resonancias y guanteletes legendarios: también ponen mecánicas mientras están activos
const NEEDS_MORE = {
  'plan.mortar':     { daSi: { explosion: 'brasaRayo' } },
  'plan.recoil':     { da: 'esquive' },                         // el esquive gratis del cargado funciona incluso con el Brazal de torre
  'res.dragonbreath':{ da: 'ascuas' },
  'res.leadstorm':   { da: 'descarga' },
  'res.quarry':      { da: 'cristales' },
  'res.executor':    { da: 'frenado' },
  'res.clockwork':   { da: 'eco' },
  'res.acidrain':    { da: 'veneno' },
  'res.furnace':     { da: 'explosion' },
  'res.vigil':       { da: 'frenado' },
  'res.firerain':    { da: 'ascuas' },
  'res.pinball':     { da: 'descarga' },
  'res.cavalry':     { da: 'ascuas explosion' },
  'res.eventide':    { da: 'amontonado' },
  'res.sunbeam':     { da: 'iluminado' },
  'res.lullaby':     { da: 'dormido' },
  'res.anvilsong':   { da: 'temple' },
  'res.tidalhook':   { da: 'empapado frenado' },
  'res.thornmine':   { da: 'zarzal' },
  'leg.monsmeg':     { da: 'frenado' },
  'leg.zhuge':       { da: 'veneno' },
  'leg.dragon':      { da: 'ascuas' },
  'leg.widow':       { daSi: { veneno: 'herida' } },
  'leg.winter':      { da: 'congelado' },
  'leg.pack':        { da: 'perro' },
  'leg.blacksun':    { da: 'iluminado usaIlum' },
  'leg.master':      { da: 'temple explosion' },
  'leg.tempest':     { da: 'descarga' },
};

// ───────────────────────── Cómo se usa la tabla ─────────────────────────
const mwords = s => (s || '').split(' ').filter(Boolean);
const needOf = id => NEEDS[id] || NEEDS_MORE[id] || {};
const needMet = (tok, have) => tok.split('|').some(m => have.has(m));
// Lo que pide: lo de la tabla y, en los dúos de esquive, poder esquivar (o atravesar)
const pideOf = id => { const w = mwords(needOf(id).pide); if (DUO[id] && DUO[id].slot === 'dodge' && !w.some(t => t.includes('esquive'))) w.push('esquive|atravesar'); return w; };
// Una partida, de verdad o imaginada: técnicas en las ranuras, técnicas sueltas, piezas montadas y planos
const buildNow = () => ({ build: S.build, techs: S.techs, gun: S.gun, plans: S.plans });
const withSlot = (slot, id) => Object.assign(buildNow(), { build: Object.assign({}, S.build, { [slot]: { id, lvl: 1 } }) });
const withTech = id => Object.assign(buildNow(), { techs: new Set([...S.techs, id]) });
// Todo lo que lleva: cada dúo cuenta como sus dos técnicas más su regla; y las resonancias y guanteletes legendarios que estarían activos
function carried(st) {
  const ids = [];
  for (const k of SLOT_KEYS) { const c = st.build[k]; if (!c) continue; const D = DUO[c.id]; if (D) ids.push(D.a, D.b, c.id); else ids.push(c.id); }
  for (const t of st.techs || []) ids.push(t);
  for (const k of GSLOT_KEYS) if (st.gun[k]) ids.push(st.gun[k]);
  for (const x of st.plans || []) ids.push('plan.' + x);
  const pieces = ids.slice();
  for (const R of RESO) if (R.parts.every(pid => st.gun[PART[pid].slot] === pid) && R.techs.every(t => pieces.includes(t))) ids.push('res.' + R.id);
  const L = legOf(st.gun); if (L) ids.push('leg.' + L.id);
  return ids;
}
// Las mecánicas que hay en juego con eso
function mechsOf(st) {
  const ids = carried(st), have = new Set();
  if (st.gun.stock !== 's_tower') have.add('esquive');   // todo el mundo esquiva, salvo con el Brazal de torre
  for (const id of ids) for (const m of mwords(needOf(id).da)) have.add(m);
  for (let again = true; again;) {   // lo que sale de juntar mecánicas, hasta que no salga nada nuevo
    again = false;
    const add = (m, need) => { if (!have.has(m) && mwords(need).every(t => needMet(t, have))) { have.add(m); again = true; } };
    for (const [m, need] of NEED_RULES) add(m, need);
    for (const id of ids) { const ds = needOf(id).daSi; if (ds) for (const m in ds) add(m, ds[m]); }
  }
  return have;
}
const worksWith = (id, have) => pideOf(id).every(t => needMet(t, have));
// ¿Serviría esta técnica de ranura si la pones en su acción? La que sustituye deja de contar como fuente.
const pieceOk = pc => worksWith(pc.id, mechsOf(withSlot(pc.slot, pc.id)));
// Un dúo trae una técnica nueva (pc) y una regla: se ofrece si sirve cualquiera de las dos, porque lo que ya llevabas sigue ahí
const duoOk = (D, pc) => { const have = mechsOf(withSlot(D.slot, D.id)); return worksWith(pc.id, have) || worksWith(D.id, have); };
const looseOk = t => worksWith(t.id, mechsOf(withTech(t.id)));

// «Necesita: …» en palabras: qué mecánica y ejemplos de lo que la pone (solo de deidades abiertas y piezas descubiertas)
function mechFrom(m, max) {
  const from = MECH[m].from || [m], gives = id => mwords(needOf(id).da).some(x => from.includes(x));
  const names = PIECES.filter(x => godIsOpen(x.god) && gives(x.id)).map(x => x.name)
    .concat(TECHS.filter(x => godIsOpen(x.god) && gives(x.id)).map(x => x.name), PARTS.filter(x => M.parts[x.id] && gives(x.id)).map(x => x.name));
  return names.length ? ' (' + names.slice(0, max || 4).join(', ') + (names.length > (max || 4) ? '…' : '') + ')' : '';
}
const needText = tok => tok.split('|').map(m => MECH[m].txt + (MECH[m].base ? '' : mechFrom(m))).join(', o ');
const needsText = id => { const w = pideOf(id); return w.length ? w.map(needText).join('; y ') : ''; };
