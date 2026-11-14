// ───────────────────────── Lo permanente: el arma por piezas y el árbol ─────────────────────────
// El arma es un montaje de cinco piezas. Cada una decide una cosa distinta, así que cualquier combinación funciona.
// Las piezas se descubren jugando (jefes, vetas de hierro, tienda). Al encontrarlas puedes montarlas en esa partida;
// para empezar las partidas con ellas hay que forjarlas una vez. base: las que tienes desde el principio.
const GSLOTS = { barrel: 'Cañón', action: 'Llave', mag: 'Munición', stock: 'Culata', chamber: 'Recámara' };
const GSLOT_KEYS = Object.keys(GSLOTS), GSLOT_WHAT = { barrel: 'a quién le das', action: 'cómo se dispara', mag: 'qué sale por la boca', stock: 'cómo te mueves', chamber: 'qué hace el disparo cargado' };
// tag: lo que esa pieza tiene de especial, en tres palabras. Se enseña en la forja y al encontrarla.
const PARTS = [
  { id: 'b_long',    slot: 'barrel',  name: 'Cañón de arcabuz',     tag: 'Remata y sigue',     desc: 'Dispara una bala al enemigo más cercano. Si está lejos (más de la mitad de tu alcance) hace +40% de daño. Si lo mata, la misma bala sigue hasta otro enemigo cercano, hasta tres veces seguidas.', base: true },
  { id: 'b_short',   slot: 'barrel',  name: 'Pistolete',            tag: 'Desenfundar',        desc: 'Dispara un 25% más rápido, pero alcanza un 30% menos. Justo después de esquivar, tu siguiente disparo sale al instante y hace el doble de daño.', cost: { iron: 1, orc: 2 } },
  { id: 'b_twin',    slot: 'barrel',  name: 'Pistoletes gemelos',   tag: 'Dos blancos a la vez', desc: 'Un arma en cada mano: cada disparo da a dos enemigos distintos a la vez, con el 55% del daño a cada uno. Alcanza un 25% menos.', cost: { iron: 1, storm: 2 } },
  { id: 'b_scatter', slot: 'barrel',  name: 'Trabuco',              tag: 'Empuja contra el muro', desc: 'Suelta seis postas en abanico. De cerca entran todas en el mismo enemigo y lo empujan hacia atrás; si choca contra un muro recibe un golpe extra y queda aturdido. Solo llega a la mitad de distancia.', cost: { iron: 2, feast: 2 } },
  { id: 'b_pierce',  slot: 'barrel',  name: 'Culebrina',            tag: 'Atraviesa y rebota', desc: 'La bala atraviesa a todos los enemigos que estén en línea y, al llegar a un muro, rebota una vez y sigue. Si te colocas bien, da dos veces. Alcanza un 30% más y hace un 10% menos de daño.', cost: { iron: 2, stone: 2 } },
  { id: 'b_bomb',    slot: 'barrel',  name: 'Bombarda',             tag: 'Bombas por encima',  desc: 'En vez de balas lanza bombas en arco, que pasan por encima de los muros. Donde caen revientan y dañan a todos los que estén cerca, con tus efectos de disparo. Dispara un 35% más despacio.', cost: { iron: 2, dragon: 2 } },
  { id: 'b_spike',   slot: 'barrel',  name: 'Asta',                 tag: 'Estocada que atraviesa', desc: 'No dispara: cada ataque es una estocada que te lanza a través del enemigo sin que puedan hacerte daño (cuenta como un esquive que lo atraviesa). +80% de daño, pero hay que estar cerca. Si la estocada mata, puedes atacar otra vez al instante.', cost: { iron: 2, shade: 2 } },
  { id: 'a_bolt',    slot: 'action',  name: 'Llave de mecha',       tag: 'Compás',             desc: 'Cada pulsación es un disparo, y cada disparo te frena un instante. Si pulsas justo cuando el anillo que te rodea se llena, sale un ¡Compás!: +50% de daño.', base: true },
  { id: 'a_semi',    slot: 'action',  name: 'Llave de chispa',      tag: 'Carrerilla',         desc: 'Disparar no te frena: te mueves a toda velocidad. Mientras no te pares, disparas cada vez más rápido (hasta +40% tras 3 segundos corriendo). Cada bala hace un 25% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 'a_burst',   slot: 'action',  name: 'Llave de salvas',      tag: 'Tres seguidos',      desc: 'Cada pulsación suelta tres balas seguidas, cada una con el 45% del daño y con tus efectos. La tercera aturde un instante. Entre salvas tarda algo más.', cost: { iron: 1, venom: 2 } },
  { id: 'a_rotary',  slot: 'action',  name: 'Manivela de ribadoquín', tag: 'Chorro continuo',  desc: 'Mantén pulsado el disparo: tarda medio segundo en arrancar y después escupe siete balas por segundo, cada una con el 30% del daño. Mientras dispara, andas despacio.', cost: { iron: 2, stone: 2 } },
  { id: 'a_draw',    slot: 'action',  name: 'Torno de ballesta',    tag: 'Tensar y soltar',    desc: 'Mantén pulsado para tensar y suelta para disparar. Un toque rápido hace el 60% del daño; tensado a tope, el 220% y llega más lejos.', cost: { iron: 2, dragon: 2 } },
  { id: 'm_std',     slot: 'mag',     name: 'Balas de plomo',       tag: 'Básica',             desc: 'La munición básica. Ni ventajas ni pegas.', base: true },
  { id: 'm_drum',    slot: 'mag',     name: 'Doble carga',          tag: 'Uno-dos',            desc: 'Disparas dos veces casi seguidas y luego recargas un poco más de tiempo. +35% de daño. Si las dos balas dan al mismo enemigo, la segunda hace un 60% más.', cost: { iron: 1, orc: 2 } },
  { id: 'm_belt',    slot: 'mag',     name: 'Pólvora viva',         tag: 'Se calienta',        desc: 'Disparas un 30% más rápido, pero el arma se calienta con cada disparo (el arco rojo a tu alrededor). Si se llena, se bloquea un segundo y medio. Deja de disparar un momento para que se enfríe.', cost: { iron: 1, dragon: 2 } },
  { id: 'm_charged', slot: 'mag',     name: 'Bala bendita',         tag: 'La quinta revienta', desc: 'Uno de cada cinco disparos sale bendito: hace el 250% del daño y revienta, dañando también a los que estén alrededor del blanco.', cost: { iron: 1, storm: 2 } },
  { id: 'm_heavy',   slot: 'mag',     name: 'Bala de cañón',        tag: 'Empuja',             desc: '+30% de daño y un 20% menos de cadencia. Cada bala empuja al enemigo hacia atrás; si choca contra un muro recibe un golpe extra y queda aturdido.', cost: { iron: 1, stone: 2 } },
  { id: 'm_chain',   slot: 'mag',     name: 'Bala enramada',        tag: 'Salta a otro',       desc: 'Dos balas unidas por una cadena: después de dar en el blanco, salta al enemigo más cercano y le hace la mitad del daño, también con tus efectos.', cost: { iron: 1, venom: 2 } },
  { id: 's_std',     slot: 'stock',   name: 'Culata de nogal',      tag: 'Básica',             desc: 'La culata básica. Ni ventajas ni pegas.', base: true },
  { id: 's_light',   slot: 'stock',   name: 'Culata de fresno',     tag: 'Esquivar recarga',   desc: 'El esquive llega más lejos y vuelve un 35% antes. Además, al salir del esquive el arma ya está lista para disparar. A cambio, un 10% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 's_heavy',   slot: 'stock',   name: 'Culata herrada',       tag: 'Culatazo',           desc: '+25% de daño, pero cada disparo te frena un 30% más de tiempo. Si un enemigo se te pega, le das un culatazo automático: sale despedido y queda aturdido. Se repite cada 2,5 segundos.', cost: { iron: 1, orc: 2 } },
  { id: 's_recoil',  slot: 'stock',   name: 'Culata de coz',        tag: 'Te aparta sola',     desc: 'Cada disparo te empuja un paso hacia atrás, alejándote del enemigo al que disparas. Kiteas sin mover el stick.', cost: { iron: 1, feast: 2 } },
  { id: 's_brace',   slot: 'stock',   name: 'Horquilla',            tag: 'Quieto pega más',    desc: 'Si llevas medio segundo sin moverte: +40% de daño y +20% de alcance. En cuanto te mueves, se pierde.', cost: { iron: 1, shade: 2 } },
  { id: 'c_beam',    slot: 'chamber', name: 'Recámara de rayo',     tag: 'Rayo en línea',      desc: 'El disparo cargado es un rayo recto que atraviesa a todos los enemigos en línea. Los muros lo paran.', base: true },
  { id: 'c_fan',     slot: 'chamber', name: 'Recámara de metralla', tag: 'Abanico de nueve',   desc: 'El disparo cargado suelta nueve balas en abanico delante de ti. Cada bala aplica tus efectos de disparo.', cost: { iron: 1, storm: 2 } },
  { id: 'c_rain',    slot: 'chamber', name: 'Recámara de aluvión',  tag: 'Lluvia sobre zona',  desc: 'El disparo cargado hace llover proyectiles sobre una zona redonda, tres veces seguidas. Cae sobre tu objetivo, o donde apuntes.', cost: { iron: 1, venom: 2 } },
  { id: 'c_supp',    slot: 'chamber', name: 'Recámara de torbellino', tag: 'Dispara sola 3 s', desc: 'El disparo cargado hace que el arma dispare sola durante tres segundos a todos los enemigos que tengas a tiro, mientras tú te mueves.', cost: { iron: 2, stone: 2 } },
  { id: 'c_dash',    slot: 'chamber', name: 'Recámara de embestida', tag: 'Carga que atraviesa', desc: 'El disparo cargado te lanza en una carga larga en la dirección que apuntes: atraviesas y dañas a todos los que pilles, sin que puedan golpearte.', cost: { iron: 2, shade: 2 } },
  { id: 'c_blast',   slot: 'chamber', name: 'Recámara de trueno',   tag: 'Andanada y salto atrás', desc: 'El disparo cargado es una andanada de quince postas a corta distancia que empuja y aturde. El retroceso te lanza a ti hacia atrás.', cost: { iron: 2, feast: 2 } },
];
const PART = Object.fromEntries(PARTS.map(x => [x.id, x]));
const BASE_GUN = { barrel: 'b_long', action: 'a_bolt', mag: 'm_std', stock: 's_std', chamber: 'c_beam' };
// Armas legendarias: tres piezas concretas montadas a la vez forman un arma con nombre propio y un poder que ninguna pieza tiene sola.
// Las cuatro primeras llevan el nombre de armas reales; la última es de este mundo. El plan es que haya muchas más.
const LEGENDS = [
  { id: 'monsmeg',  name: 'Mons Meg',            parts: ['b_bomb', 'm_heavy', 's_brace'],   lore: 'Una bombarda de asedio del siglo XV, de las mayores que se forjaron.', desc: 'Tus bombas son enormes: revientan en un área un 60% más grande y aturden a todo lo que alcanzan.' },
  { id: 'zhuge',    name: 'Zhuge Nu',            parts: ['a_draw', 'm_drum', 's_light'],    lore: 'La ballesta de repetición china: poco golpe, muchos virotes, a veces envenenados.', desc: 'Cada vez que sueltas la ballesta salen tres virotes seguidos en vez de uno, y cada uno aplica 2 de Veneno.' },
  { id: 'organ',    name: 'Órgano de Leonardo',  parts: ['a_rotary', 'b_twin', 'm_belt'],   lore: 'Treinta y tres cañones en tres filas: una dispara, otra recarga, otra se enfría.', desc: 'El arma ya no se bloquea al recalentarse: cuando el calor se llena suelta una salva de once balas a los enemigos cercanos y se enfría sola.' },
  { id: 'dragon',   name: 'Dragón',              parts: ['b_scatter', 'a_semi', 's_light'], lore: 'El trabuco corto llamado dragón; según la explicación más repetida, de él tomaron su nombre los dragones de caballería.', desc: 'Cada andanada escupe fuego: clava 2 Ascuas a todo lo que toca y deja llamas en el suelo delante de ti.' },
  { id: 'breaker',  name: 'La Rompemuros',       parts: ['b_pierce', 'm_heavy', 's_heavy'], lore: 'Dicen que el herrero la forjó en una vida anterior y que aún recuerda cada muro.', desc: 'La bala de la culebrina rebota hasta cuatro veces en vez de una, y cada rebote hace un 25% más de daño.' },
];
const legOf = g => LEGENDS.find(L => L.parts.every(id => g[PART[id].slot] === id)) || null;
// El nombre del arma sale de lo que lleva montado
function gunName(g) {
  { const L = legOf(g); if (L) return L.name; }
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


// Glosario: cada palabra propia del juego, explicada en una línea. Se añade sola debajo de cualquier texto que la use.
const GLOSS = [
  [/Ascuas?/, 'Ascuas', 'brasas clavadas en el enemigo. Cada una le quema un poco cada segundo; se apagan a los 4 s si no clavas más.'],
  [/Venenos?\b|envenenad/, 'Veneno', 'puntos que hacen daño poco a poco y no se van nunca. Cuantos más puntos, más daño.'],
  [/Cristal(es)?/, 'Cristales', 'se quedan clavados en el suelo unos segundos. Solos no hacen nada: otras técnicas los usan.'],
  [/Reserva/, 'Reserva', 'un escudo que se llena con la vida que te sobra al curarte. Se gasta antes que tu vida.'],
  [/Furia/, 'Furia', 'una barra que sube al golpear y al recibir golpes, y baja sola si dejas de pelear.'],
  [/\becos?\b/, 'Eco', 'una repetición del golpe que llega sola un momento después.'],
  [/Sombras?/, 'Sombras', 'enemigos muertos que se levantan y pelean a tu lado unos segundos.'],
  [/Agujas?|descarg/, 'Agujas', 'se clavan sin hacer daño. Al descargarlas, cada una hace daño y suelta un rayo a otro enemigo.'],
  [/Empapad|empapa/, 'Empapado', 'mojado durante unos segundos. Solo no hace nada: otras técnicas de Mareas lo aprovechan.'],
  [/Semillas?/, 'Semillas', 'se plantan en el enemigo; al juntar varias brotan en Raíces.'],
  [/Raíces|enraíza|enraizad/, 'Raíces', 'el enemigo no puede moverse del sitio, aunque sí atacar.'],
  [/crític/, 'Crítico', 'un golpe de suerte que hace el 250% del daño.'],
  [/aturd/, 'Aturdido', 'no se mueve ni ataca durante un momento.'],
  [/Compás/, 'Compás', 'pulsar el disparo justo cuando el anillo que te rodea se llena.'],
  [/frenazo|te frena/, 'Frenazo', 'el instante que te quedas clavado al disparar.'],
  [/esquive que lo atraviesa|[Aa]travesar a un enemigo con el esquive|[Ee]mbestir a un enemigo/, 'Atravesar', 'esquivar pasando por encima de un enemigo.'],
  [/zarzal|zarzas/, 'Zarzal', 'una mancha de espinas en el suelo que frena y daña a quien la pisa.'],
  [/contra (un|el) muro/, 'Golpe contra el muro', 'un enemigo empujado con fuerza que choca con un muro recibe daño y queda aturdido.'],
];
function gloss(txt, max) {
  const out = [];
  for (const [re, name, what] of GLOSS) { if (re.test(txt)) out.push(`<q><b>${name}:</b> ${what}</q>`); if (out.length >= (max || 3)) break; }
  return out.length ? `<small class="gloss">${out.join('')}</small>` : '';
}
