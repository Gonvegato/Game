// ───────────────────────── Lo permanente: el arma por piezas y el árbol ─────────────────────────
// El arma es un montaje de cinco piezas. Cada una decide una cosa distinta, así que cualquier combinación funciona.
// Las piezas se descubren jugando (jefes, vetas de hierro, tienda). Al encontrarlas puedes montarlas en esa partida;
// para empezar las partidas con ellas hay que forjarlas una vez. base: las que tienes desde el principio.
const GSLOTS = { barrel: 'Cañón', action: 'Mecanismo', mag: 'Cargador', stock: 'Culata', chamber: 'Cámara' };
const GSLOT_KEYS = Object.keys(GSLOTS), GSLOT_WHAT = { barrel: 'a quién le das', action: 'cómo se dispara', mag: 'cuánto aguantas disparando', stock: 'cómo te mueves', chamber: 'qué hace el disparo cargado' };
const PARTS = [
  { id: 'b_long',    slot: 'barrel',  name: 'Cañón largo',          desc: 'Una bala a un enemigo. +40% de daño a los que están lejos, en la mitad exterior de tu alcance.', base: true },
  { id: 'b_short',   slot: 'barrel',  name: 'Cañón corto',          desc: 'Una bala a un enemigo. +25% de cadencia y un 30% menos de alcance.', cost: { iron: 1, orc: 2 } },
  { id: 'b_twin',    slot: 'barrel',  name: 'Cañones gemelos',      desc: 'Cada disparo va a dos enemigos distintos a la vez, al 55% de daño cada uno. Un 25% menos de alcance.', cost: { iron: 1, storm: 2 } },
  { id: 'b_scatter', slot: 'barrel',  name: 'Cañón de dispersión',  desc: 'Seis perdigones en abanico: de cerca entran todos en el mismo enemigo y lo mandan hacia atrás. La mitad de alcance.', cost: { iron: 2, feast: 2 } },
  { id: 'b_pierce',  slot: 'barrel',  name: 'Cañón perforante',     desc: 'La bala atraviesa a todos los enemigos en línea. +30% de alcance y un 10% menos de daño.', cost: { iron: 2, stone: 2 } },
  { id: 'b_spike',   slot: 'barrel',  name: 'Asta',                 desc: 'No dispara: cada ataque es una estocada que te lanza a través del enemigo, invulnerable, y cuenta como atravesarlo con el esquive. +80% de daño, alcance corto. Si mata, atacas otra vez al instante.', cost: { iron: 2, shade: 2 } },
  { id: 'a_bolt',    slot: 'action',  name: 'Cerrojo',              desc: 'Un disparo por pulsación, con su frenazo. Hay que kitear a ritmo.', base: true },
  { id: 'a_semi',    slot: 'action',  name: 'Semiautomático',       desc: 'No te frena al disparar: te mueves a toda velocidad. +20% de cadencia y un 25% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 'a_burst',   slot: 'action',  name: 'Ráfaga',               desc: 'Cada disparo son tres seguidos al 45% de daño, y cada uno aplica tus efectos. Algo más lento.', cost: { iron: 1, venom: 2 } },
  { id: 'a_rotary',  slot: 'action',  name: 'Giratorio',            desc: 'Mantén pulsado: tarda medio segundo en girar y después dispara siete veces por segundo, al 30% de daño. Te mueves despacio mientras dispara.', cost: { iron: 2, stone: 2 } },
  { id: 'a_draw',    slot: 'action',  name: 'De tensado',           desc: 'Mantén pulsado para tensar y suelta: del 60% de daño en un toque al 220% a tope, con más alcance cuanto más tenses. Más lento.', cost: { iron: 2, dragon: 2 } },
  { id: 'm_std',     slot: 'mag',     name: 'Cargador sencillo',    desc: 'Sin sorpresas.', base: true },
  { id: 'm_drum',    slot: 'mag',     name: 'Tambor de dos',        desc: 'Dos disparos casi seguidos y a recargar. +35% de daño.', cost: { iron: 1, orc: 2 } },
  { id: 'm_belt',    slot: 'mag',     name: 'Cinta',                desc: '+30% de cadencia, pero el arma se calienta al disparar y, si se llena, se bloquea un momento.', cost: { iron: 1, dragon: 2 } },
  { id: 'm_charged', slot: 'mag',     name: 'Cargador imbuido',     desc: 'Uno de cada cinco disparos sale imbuido: 250% de daño.', cost: { iron: 1, storm: 2 } },
  { id: 'm_heavy',   slot: 'mag',     name: 'Cargador de plomo',    desc: '+30% de daño y un 20% menos de cadencia.', cost: { iron: 1, stone: 2 } },
  { id: 's_std',     slot: 'stock',   name: 'Culata de madera',     desc: 'Sin sorpresas.', base: true },
  { id: 's_light',   slot: 'stock',   name: 'Culata ligera',        desc: 'El esquive llega más lejos y se recarga un 35% antes. Un 10% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 's_heavy',   slot: 'stock',   name: 'Culata pesada',        desc: '+25% de daño, pero el frenazo de cada disparo dura un 30% más.', cost: { iron: 1, orc: 2 } },
  { id: 's_recoil',  slot: 'stock',   name: 'Culata de retroceso',  desc: 'Cada disparo te empuja un paso hacia atrás, lejos del enemigo.', cost: { iron: 1, feast: 2 } },
  { id: 's_brace',   slot: 'stock',   name: 'Bípode',               desc: 'Si llevas medio segundo quieto: +40% de daño y +20% de alcance.', cost: { iron: 1, shade: 2 } },
  { id: 'c_beam',    slot: 'chamber', name: 'Cámara de rayo',       desc: 'El cargado es un rayo que atraviesa a todos en línea.', base: true },
  { id: 'c_fan',     slot: 'chamber', name: 'Cámara de abanico',    desc: 'El cargado vacía el arma en un abanico de nueve balas.', cost: { iron: 1, storm: 2 } },
  { id: 'c_rain',    slot: 'chamber', name: 'Cámara de aluvión',    desc: 'El cargado es una lluvia de proyectiles sobre una zona, en tres oleadas.', cost: { iron: 1, venom: 2 } },
  { id: 'c_supp',    slot: 'chamber', name: 'Cámara de supresión',  desc: 'El cargado dispara solo en todas direcciones durante tres segundos.', cost: { iron: 2, stone: 2 } },
  { id: 'c_dash',    slot: 'chamber', name: 'Cámara de embestida',  desc: 'El cargado es una carga larga que atraviesa a todos los que pilla.', cost: { iron: 2, shade: 2 } },
  { id: 'c_blast',   slot: 'chamber', name: 'Cámara de retroceso',  desc: 'El cargado es una andanada de quince perdigones que empuja y aturde, y el retroceso te lanza hacia atrás.', cost: { iron: 2, feast: 2 } },
];
const PART = Object.fromEntries(PARTS.map(x => [x.id, x]));
const BASE_GUN = { barrel: 'b_long', action: 'a_bolt', mag: 'm_std', stock: 's_std', chamber: 'c_beam' };
// El nombre del arma sale de lo que lleva montado
function gunName(g) {
  const B = g.barrel, A = g.action;
  if (B === 'b_spike') return A === 'a_rotary' ? 'Taladro' : A === 'a_draw' ? 'Pica de carga' : A === 'a_burst' ? 'Tridente' : A === 'a_semi' ? 'Estoque' : 'Lanza';
  if (A === 'a_draw') return B === 'b_pierce' ? 'Arco largo' : B === 'b_twin' ? 'Arco doble' : B === 'b_scatter' ? 'Arco de metralla' : B === 'b_short' ? 'Arco corto' : 'Arco';
  if (A === 'a_rotary') return B === 'b_scatter' ? 'Cañón de metralla' : B === 'b_twin' ? 'Ametralladoras gemelas' : B === 'b_short' ? 'Ametralladora ligera' : 'Ametralladora';
  if (B === 'b_scatter') return A === 'a_semi' ? 'Escopeta automática' : A === 'a_burst' ? 'Trabuco de ráfagas' : 'Escopeta';
  if (B === 'b_twin') return A === 'a_semi' ? 'Subfusiles gemelos' : A === 'a_burst' ? 'Pistolas de ráfaga' : 'Pistolas dobles';
  if (B === 'b_short') return A === 'a_semi' ? 'Subfusil' : A === 'a_burst' ? 'Pistola de ráfagas' : 'Carabina';
  if (B === 'b_pierce') return A === 'a_semi' ? 'Fusil de agujas' : A === 'a_burst' ? 'Fusil perforante de ráfagas' : 'Fusil perforante';
  return A === 'a_semi' ? 'Fusil de asalto' : A === 'a_burst' ? 'Fusil de ráfagas' : 'Fusil';
}
// Resonancias: cierta pieza del arma con cierta técnica de una deidad despiertan algo nuevo. Se activan solas.
const RESO = [
  { id: 'dragonbreath', name: 'Aliento de dragón',   parts: ['b_scatter'], techs: ['dragon_basic'], desc: 'Cada andanada deja además una lengua de fuego en el suelo delante de ti.' },
  { id: 'leadstorm',    name: 'Tormenta de plomo',   parts: ['a_rotary'],  techs: ['storm_basic'],  desc: 'Cada diez disparos, tu objetivo se descarga solo.' },
  { id: 'quarry',       name: 'Barreno',             parts: ['b_pierce'],  techs: ['stone_basic'],  desc: 'La bala deja un Cristal junto a cada enemigo que atraviesa.' },
  { id: 'firingline',   name: 'Línea de tiro',       parts: ['b_twin'],    techs: ['shade_basic'],  desc: 'Cada vez que disparas, tus Sombras disparan contigo.' },
  { id: 'executor',     name: 'Verdugo',             parts: ['b_spike'],   techs: ['orc_dodge'],    desc: 'La estocada aturde y te da 15 de Furia.' },
  { id: 'clockwork',    name: 'Reloj de cuerda',     parts: ['a_draw'],    techs: ['time_basic'],   desc: 'Un disparo tensado a tope deja dos ecos en vez de uno.' },
  { id: 'leadfeast',    name: 'Banquete de plomo',   parts: ['m_drum'],    techs: ['feast_basic'],  desc: 'Recargar te cura 4, y el primer disparo tras recargar te cura el triple.' },
  { id: 'acidrain',     name: 'Lluvia ácida',        parts: ['c_rain'],    techs: ['venom_charge'], desc: 'El aluvión deja toda la zona convertida en un charco tóxico.' },
  { id: 'furnace',      name: 'Fragua viva',         parts: ['m_belt'],    techs: ['orc_basic'],    desc: 'El calor del arma te da hasta un 40% más de daño, y cuando se recalienta suelta una explosión a tu alrededor.' },
  { id: 'vigil',        name: 'Vigilia',             parts: ['s_brace'],   techs: ['time_passive'], desc: 'Mientras estás quieto, tus balas ralentizan a quien alcanzan.' },
  { id: 'cavalry',      name: 'Carga de caballería', parts: ['c_dash'],    techs: ['dragon_dodge'], desc: 'La carga deja un rastro de fuego y explota al terminar.' },
  { id: 'crossfire',    name: 'Fuego cruzado',       parts: ['a_semi'],    techs: ['stone_passive'], desc: 'Los Cristales repiten tus balas al doble de daño.' },
];
const RES = Object.fromEntries(RESO.map(x => [x.id, x]));
// Árbol de habilidades: cada mejora tiene varios rangos y se paga con almas. cost[r] es lo que cuesta el rango r+1.
// Está pensado para unas 30 horas de juego hasta completarlo: los primeros rangos son baratos y los últimos, caros.
const curve = (base, g, n) => Array.from({ length: n }, (_, r) => Math.round(base * Math.pow(g, r)));
const TREE = [
  { name: 'Cuerpo', sub: 'Aguantar más y moverte mejor', nodes: [
    { id: 'hp',      name: 'Aguante',         max: 8, cost: curve(8, 1.55, 8),  desc: r => `+${10 * r} de vida máxima` },
    { id: 'skin',    name: 'Piel curtida',    max: 5, cost: curve(15, 1.7, 5),  desc: r => `Recibes un ${5 * r}% menos de daño` },
    { id: 'feet',    name: 'Pies ligeros',    max: 5, cost: curve(15, 1.7, 5),  desc: r => `+${3 * r}% de velocidad de movimiento` },
    { id: 'mend',    name: 'Remiendo',        max: 5, cost: curve(15, 1.7, 5),  desc: r => `Recuperas ${4 * r} de vida más al limpiar cada sala` },
    { id: 'reflex',  name: 'Reflejos',        max: 2, cost: [90, 220],          desc: r => (r < 2 ? 'Una carga más de esquive' : 'Una carga más de esquive, y todas se recargan un 20% antes') },
    { id: 'revive',  name: 'Segundo aliento', max: 3, cost: [60, 130, 260],     desc: r => `Una vez por partida, al morir te levantas con un ${10 + 20 * r}% de vida` } ] },
  { name: 'Oficio', sub: 'Sacarle más al arma', nodes: [
    { id: 'rate',    name: 'Pulso firme',     max: 8, cost: curve(8, 1.55, 8),  desc: r => `+${3 * r}% de cadencia` },
    { id: 'dmg',     name: 'Golpe certero',   max: 8, cost: curve(8, 1.55, 8),  desc: r => `+${4 * r}% de daño` },
    { id: 'eye',     name: 'Ojo de herrero',  max: 5, cost: curve(15, 1.7, 5),  desc: r => `+${5 * r}% de alcance` },
    { id: 'brake',   name: 'Frenazo corto',   max: 5, cost: curve(15, 1.7, 5),  desc: r => `El frenazo de cada disparo dura un ${6 * r}% menos` },
    { id: 'armorer', name: 'Maestro armero',  max: 5, cost: curve(15, 1.7, 5),  desc: r => `El disparo cargado carga un ${10 * r}% más rápido` },
    { id: 'coup',    name: 'Golpe de gracia', max: 5, cost: curve(15, 1.7, 5),  desc: r => `+${8 * r}% de daño a enemigos por debajo del 30% de vida` } ] },
  { name: 'Memoria', sub: 'Lo que recuerdas de otras vidas', nodes: [
    { id: 'purse',   name: 'Bolsa honda',     max: 5, cost: curve(15, 1.7, 5),  desc: r => `Empiezas cada partida con ${25 * r} de oro` },
    { id: 'nose',    name: 'Olfato',          max: 5, cost: curve(15, 1.7, 5),  desc: r => `Las salas de almas dan un ${10 * r}% más` },
    { id: 'luck',    name: 'Favor robado',    max: 5, cost: curve(15, 1.7, 5),  desc: r => `Las técnicas salen raras o épicas más a menudo (+${5 * r}%)` },
    { id: 'reroll',  name: 'Regateo',         max: 3, cost: [40, 90, 180],      desc: r => `Puedes volver a sortear las técnicas ${r === 1 ? 'una vez' : r + ' veces'} por sala` },
    { id: 'eye4',    name: 'Buen ojo',        max: 1, cost: [120],              desc: () => 'Al desmontar un arma eliges entre cuatro técnicas en vez de tres' },
    { id: 'recall',  name: 'Recuerdo vivo',   max: 1, cost: [200],              desc: () => 'Empiezas cada partida eligiendo una técnica entre tres' },
    { id: 'door',    name: 'Otra puerta',     max: 1, cost: [160],              desc: () => 'Al acabar una sala siempre hay una puerta más donde elegir' } ] },
];
const TREE_NODES = TREE.flatMap(br => br.nodes), TREE_TOTAL = TREE_NODES.reduce((a, n) => a + n.cost.reduce((x, y) => x + y, 0), 0);
// Salas que no son de deidad: lo que dan al limpiarlas.
const ROOMS = {
  souls: { name: 'Sala de almas',          tag: 'Almas',   color: '#b9c6ff', desc: 'Almas para tu árbol de habilidades. Solo se consiguen aquí.' },
  iron:  { name: 'Veta de Hierro Místico', tag: 'Hierro',  color: '#c9d2e0', desc: 'Hierro Místico: hace falta para forjar cualquier arma y sus mejoras.' },
  heart: { name: 'Fuente de vida',         tag: 'Vida',    color: '#ff6f86', desc: '+20 de vida máxima y te cura 20.' },
  gold:  { name: 'Cámara del tesoro',      tag: 'Oro',     color: '#ffd24a', desc: 'Oro para gastar en la tienda que hay antes del jefe.' },
  anvil: { name: 'Yunque abandonado',      tag: 'Yunque',  color: '#62e6ff', desc: 'Un ajuste del arma para esta partida: cadencia, daño, alcance o velocidad.' },
};

const C = {
  wall: '#0e1017', floor: '#1a1e29', tile: '#1f2431', edge: '#3a4258',
  ink: '#ece8dd', dim: '#a3a9bd', ember: '#ff9a3c', energy: '#62e6ff', blood: '#e5506a', arcane: '#b68cff',
};

