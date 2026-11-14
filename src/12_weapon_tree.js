// ───────────────────────── Lo permanente: el arma por piezas y el árbol ─────────────────────────
// El arma es un montaje de cinco piezas. Cada una decide una cosa distinta, así que cualquier combinación funciona.
// Las piezas se descubren jugando (jefes, vetas de hierro, tienda). Al encontrarlas puedes montarlas en esa partida;
// para empezar las partidas con ellas hay que forjarlas una vez. base: las que tienes desde el principio.
const GSLOTS = { barrel: 'Cañón', action: 'Llave', mag: 'Munición', stock: 'Culata', chamber: 'Recámara' };
const GSLOT_KEYS = Object.keys(GSLOTS), GSLOT_WHAT = { barrel: 'a quién le das', action: 'cómo se dispara', mag: 'qué sale por la boca', stock: 'cómo te mueves', chamber: 'qué hace el disparo cargado' };
// tag: lo que esa pieza tiene de especial, en tres palabras. Se enseña en la forja y al encontrarla.
const PARTS = [
  { id: 'b_long',    slot: 'barrel',  name: 'Cañón de arcabuz',     tag: 'Remata y sigue',     desc: 'Una bala a un enemigo. +40% de daño a los que están lejos. Si la bala mata, sigue hasta el enemigo más cercano con todo su daño, hasta tres veces.', base: true },
  { id: 'b_short',   slot: 'barrel',  name: 'Pistolete',            tag: 'Desenfundar',        desc: '+25% de cadencia y un 30% menos de alcance. Al salir de un esquive, el siguiente disparo sale al instante y hace el doble.', cost: { iron: 1, orc: 2 } },
  { id: 'b_twin',    slot: 'barrel',  name: 'Pistoletes gemelos',   tag: 'Dos blancos a la vez', desc: 'Cada disparo va a dos enemigos distintos a la vez, al 55% de daño cada uno. Un 25% menos de alcance.', cost: { iron: 1, storm: 2 } },
  { id: 'b_scatter', slot: 'barrel',  name: 'Trabuco',              tag: 'Empuja contra el muro', desc: 'Seis postas en abanico: de cerca entran todas en el mismo enemigo y lo mandan hacia atrás. Si choca contra un muro, se lleva el golpe y queda aturdido. La mitad de alcance.', cost: { iron: 2, feast: 2 } },
  { id: 'b_pierce',  slot: 'barrel',  name: 'Culebrina',            tag: 'Atraviesa y rebota', desc: 'La bala atraviesa a todos los enemigos en línea y rebota una vez en los muros: bien colocado, das dos veces. +30% de alcance y un 10% menos de daño.', cost: { iron: 2, stone: 2 } },
  { id: 'b_bomb',    slot: 'barrel',  name: 'Bombarda',             tag: 'Bombas por encima',  desc: 'Lanza una bomba en arco que pasa por encima de los muros y revienta en área: todo lo que pille recibe la bala con tus efectos. Un 35% menos de cadencia.', cost: { iron: 2, dragon: 2 } },
  { id: 'b_spike',   slot: 'barrel',  name: 'Asta',                 tag: 'Estocada que atraviesa', desc: 'No dispara: cada ataque es una estocada que te lanza a través del enemigo, invulnerable, y cuenta como atravesarlo con el esquive. +80% de daño, alcance corto. Si mata, atacas otra vez al instante.', cost: { iron: 2, shade: 2 } },
  { id: 'a_bolt',    slot: 'action',  name: 'Llave de mecha',       tag: 'Compás',             desc: 'Un disparo por pulsación, con su frenazo. Si pulsas justo cuando el anillo se llena es un ¡Compás!: +50% de daño.', base: true },
  { id: 'a_semi',    slot: 'action',  name: 'Llave de chispa',      tag: 'Sin frenazo',        desc: 'No te frena al disparar: te mueves a toda velocidad. +20% de cadencia y un 25% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 'a_burst',   slot: 'action',  name: 'Llave de salvas',      tag: 'Tres seguidos',      desc: 'Cada disparo son tres seguidos al 45% de daño, y cada uno aplica tus efectos. Algo más lento.', cost: { iron: 1, venom: 2 } },
  { id: 'a_rotary',  slot: 'action',  name: 'Manivela de ribadoquín', tag: 'Chorro continuo',  desc: 'Mantén pulsado: tarda medio segundo en girar y después dispara siete veces por segundo, al 30% de daño. Te mueves despacio mientras dispara.', cost: { iron: 2, stone: 2 } },
  { id: 'a_draw',    slot: 'action',  name: 'Torno de ballesta',    tag: 'Tensar y soltar',    desc: 'Mantén pulsado para tensar y suelta: del 60% de daño en un toque al 220% a tope, con más alcance cuanto más tenses. Más lento.', cost: { iron: 2, dragon: 2 } },
  { id: 'm_std',     slot: 'mag',     name: 'Balas de plomo',       tag: 'Sin sorpresas',      desc: 'Sin sorpresas.', base: true },
  { id: 'm_drum',    slot: 'mag',     name: 'Doble carga',          tag: 'Dos y recarga',      desc: 'Dos disparos casi seguidos y a recargar. +35% de daño.', cost: { iron: 1, orc: 2 } },
  { id: 'm_belt',    slot: 'mag',     name: 'Pólvora viva',         tag: 'Se calienta',        desc: '+30% de cadencia, pero el arma se calienta al disparar y, si se llena, se bloquea un momento.', cost: { iron: 1, dragon: 2 } },
  { id: 'm_charged', slot: 'mag',     name: 'Bala bendita',         tag: 'La quinta revienta', desc: 'Uno de cada cinco disparos sale bendito: 250% de daño y revienta en área alrededor del blanco.', cost: { iron: 1, storm: 2 } },
  { id: 'm_heavy',   slot: 'mag',     name: 'Bala de cañón',        tag: 'Empuja',             desc: '+30% de daño y un 20% menos de cadencia. Cada impacto empuja al enemigo: contra un muro, se lleva el golpe y queda aturdido.', cost: { iron: 1, stone: 2 } },
  { id: 'm_chain',   slot: 'mag',     name: 'Bala enramada',        tag: 'Salta a otro',       desc: 'Dos balas unidas por una cadena: tras dar en el blanco salta al enemigo más cercano con el 50% del daño y tus efectos.', cost: { iron: 1, venom: 2 } },
  { id: 's_std',     slot: 'stock',   name: 'Culata de nogal',      tag: 'Sin sorpresas',      desc: 'Sin sorpresas.', base: true },
  { id: 's_light',   slot: 'stock',   name: 'Culata de fresno',     tag: 'Esquivar recarga',   desc: 'El esquive llega más lejos, se recarga un 35% antes y deja el arma lista: puedes disparar nada más salir. Un 10% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 's_heavy',   slot: 'stock',   name: 'Culata herrada',       tag: 'Culatazo',           desc: '+25% de daño y un frenazo un 30% más largo. Si un enemigo se te pega, le das un culatazo: sale despedido y queda aturdido (cada 2,5 s).', cost: { iron: 1, orc: 2 } },
  { id: 's_recoil',  slot: 'stock',   name: 'Culata de coz',        tag: 'Te aparta sola',     desc: 'Cada disparo te empuja un paso hacia atrás, lejos del enemigo.', cost: { iron: 1, feast: 2 } },
  { id: 's_brace',   slot: 'stock',   name: 'Horquilla',            tag: 'Quieto pega más',    desc: 'Si llevas medio segundo quieto: +40% de daño y +20% de alcance.', cost: { iron: 1, shade: 2 } },
  { id: 'c_beam',    slot: 'chamber', name: 'Recámara de rayo',     tag: 'Rayo en línea',      desc: 'El cargado es un rayo que atraviesa a todos en línea.', base: true },
  { id: 'c_fan',     slot: 'chamber', name: 'Recámara de metralla', tag: 'Abanico de nueve',   desc: 'El cargado vacía el arma en un abanico de nueve balas.', cost: { iron: 1, storm: 2 } },
  { id: 'c_rain',    slot: 'chamber', name: 'Recámara de aluvión',  tag: 'Lluvia sobre zona',  desc: 'El cargado es una lluvia de proyectiles sobre una zona, en tres oleadas.', cost: { iron: 1, venom: 2 } },
  { id: 'c_supp',    slot: 'chamber', name: 'Recámara de torbellino', tag: 'Dispara sola 3 s', desc: 'El cargado dispara solo en todas direcciones durante tres segundos.', cost: { iron: 2, stone: 2 } },
  { id: 'c_dash',    slot: 'chamber', name: 'Recámara de embestida', tag: 'Carga que atraviesa', desc: 'El cargado es una carga larga que atraviesa a todos los que pilla.', cost: { iron: 2, shade: 2 } },
  { id: 'c_blast',   slot: 'chamber', name: 'Recámara de trueno',   tag: 'Andanada y salto atrás', desc: 'El cargado es una andanada de quince postas que empuja y aturde, y el retroceso te lanza hacia atrás.', cost: { iron: 2, feast: 2 } },
];
const PART = Object.fromEntries(PARTS.map(x => [x.id, x]));
const BASE_GUN = { barrel: 'b_long', action: 'a_bolt', mag: 'm_std', stock: 's_std', chamber: 'c_beam' };
// El nombre del arma sale de lo que lleva montado
function gunName(g) {
  const B = g.barrel, A = g.action, suf = A === 'a_semi' ? ' de chispa' : A === 'a_burst' ? ' de salvas' : '';
  if (B === 'b_spike') return A === 'a_rotary' ? 'Berbiquí de guerra' : A === 'a_draw' ? 'Pica de carga' : A === 'a_burst' ? 'Tridente' : A === 'a_semi' ? 'Estoque' : 'Lanza';
  if (A === 'a_draw') return B === 'b_pierce' ? 'Ballesta de asedio' : B === 'b_twin' ? 'Ballesta doble' : B === 'b_scatter' ? 'Ballesta de virotes' : B === 'b_short' ? 'Ballesta de mano' : B === 'b_bomb' ? 'Onagro' : 'Ballesta';
  if (A === 'a_rotary') return B === 'b_scatter' ? 'Órgano de metralla' : B === 'b_twin' ? 'Ribadoquines gemelos' : B === 'b_short' ? 'Ribadoquín ligero' : B === 'b_pierce' ? 'Órgano de culebrinas' : B === 'b_bomb' ? 'Batería de bombardas' : 'Ribadoquín';
  if (B === 'b_scatter') return 'Trabuco' + suf;
  if (B === 'b_twin') return 'Pistoletes gemelos' + suf;
  if (B === 'b_short') return 'Pistolete' + suf;
  if (B === 'b_pierce') return 'Culebrina' + suf;
  if (B === 'b_bomb') return A === 'a_semi' ? 'Mortero de mano' : 'Bombarda' + suf;
  return 'Arcabuz' + suf;
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
  { id: 'firerain',     name: 'Lluvia de brasas',    parts: ['b_bomb'],    techs: ['dragon_charge'], desc: 'Cada bomba deja un charco de fuego donde revienta.' },
  { id: 'pinball',      name: 'Carambola',           parts: ['b_pierce'],  techs: ['storm_basic'],  desc: 'El rebote de la culebrina descarga las Agujas de todo lo que toca.' },
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
  anvil: { name: 'Yunque abandonado',      tag: 'Yunque',  color: '#f2c14e', desc: 'Un ajuste del arma para esta partida: cadencia, daño, alcance o velocidad.' },
};

const C = {
  wall: '#120e14', floor: '#1a1e29', tile: '#1f2431', edge: '#4d3f3a',
  ink: '#efe6d0', dim: '#a89c8a', ember: '#ff8a3c', energy: '#f2c14e', blood: '#d8434f', arcane: '#b68cff',
};

