/* Sala de Kiteo — prototipo de combate.
   Objetivo: comprobar si kitear con frenazo + apuntado automático es divertido.
   Sin dependencias. Entrada: mando (prioritario), teclado y táctil. */
(() => {
'use strict';

// ───────────────────────── Ajustes de sensación (tocar aquí) ─────────────────────────
const T = {
  room: { w: 880, h: 580 },
  viewArea: 520 * 300,          // unidades de mundo visibles (área constante)
  player: {
    r: 7, speed: 82, hp: 100, dmg: 12,
    as: 0.95,                   // disparos por segundo
    range: 185,
    windupFrac: 0.22,           // parte del ciclo de ataque en la que te frenas
    windupSlow: 0.12,           // velocidad durante el gesto de disparo
    holdSlow: 0.5,              // velocidad si mantienes pulsado disparar
  },
  buffer: 0.14,                 // margen para pulsar un poco antes de tiempo
  dodge: { time: 0.16, mult: 3.4, cd: 1.0 },
  charge: { min: 0.3, full: 0.85, cd: 2.2, range: 380, dmgMult: 4.5, width: 7, slow: 0.08 },
};

const TYPES = {
  stalker: { name: 'Acechador', r: 7,  hp: 30,  speed: 58,  dmg: 10, wind: 0.38, reach: 9,  shape: 'circle',  color: '#e5506a' },
  runner:  { name: 'Corredor',  r: 5,  hp: 12,  speed: 100, dmg: 7,  wind: 0.22, reach: 8,  shape: 'tri',     color: '#ff7a59' },
  brute:   { name: 'Bruto',     r: 12, hp: 120, speed: 38,  dmg: 24, wind: 0.6,  reach: 14, shape: 'square',  color: '#b8394f' },
  mage:    { name: 'Mago',      r: 7,  hp: 24,  speed: 50,  dmg: 12, ranged: true,          shape: 'diamond', color: '#b68cff' },
  champ:   { name: 'Campeón',   r: 9,  hp: 95,  speed: 60,  dmg: 16, wind: 0.4,  reach: 10, shape: 'circle',  color: '#e9dcc3', champ: true },
};

const UPGRADES = [
  { name: 'Mecanismo ligero', desc: '+22% velocidad de ataque',            apply: p => { p.as *= 1.22; } },
  { name: 'Núcleo denso',     desc: '+30% daño',                           apply: p => { p.dmg *= 1.3; } },
  { name: 'Cañón largo',      desc: '+15% alcance',                        apply: p => { p.range *= 1.15; } },
  { name: 'Botas de forja',   desc: '+8% velocidad de movimiento',         apply: p => { p.speed *= 1.08; } },
  { name: 'Peto reforzado',   desc: '+25 vida máxima y recuperas 40',      apply: p => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 40); } },
];

TYPES.boss = { name: 'El Guardián', r: 22, hp: 700, speed: 40, dmg: 30, shape: 'circle', color: '#8a3a55', boss: true };

// ───────────────────────── Deidades ─────────────────────────
// El herrero no tiene dios. Cada sala la guarda el elegido de una deidad, con un arma bendecida:
// lo matas, la desmontas y te quedas con la técnica. Las deidades miran y opinan.
const GODS = {
  dragon: { title: 'La Que Duerme Sobre Oro', theme: 'Dragones', weapon: 'Colmillo de la Durmiente', color: '#ff6a3c', key: 'Ascuas: se clavan en el enemigo y queman todas a la vez.', lines: {
    enter:  ['entreabre un ojo. Su elegido guarda esta sala.', 'huele a intruso entre sus monedas.'],
    champ:  ['cuenta su oro para calmarse. Le falta una pieza.', 'resopla humo. Ha perdido un elegido.'],
    take:   ['te apunta en su lista de deudores.', 'no olvida quién le roba.'],
    master: ['ruge: nadie le había robado tanto.'] } },
  stone: { title: 'El Paciente Bajo la Montaña', theme: 'Minerales', weapon: 'Pico de Veta Madre', color: '#6fe3d0', key: 'Cristales: se quedan clavados en la sala y otras piezas los usan.', lines: {
    enter:  ['tarda un siglo en mirarte. Ya te está mirando.', 'cruje. Su elegido despierta.'],
    champ:  ['no dice nada. En algún lugar se agrieta una montaña.', 'guarda silencio. Es un mal silencio.'],
    take:   ['toma nota. Tiene tiempo.', 'observa cómo tallas lo que era suyo.'],
    master: ['pronuncia tu nombre, muy despacio.'] } },
  venom: { title: 'La Boticaria Sin Rostro', theme: 'Veneno', weapon: 'Aguijón de la Boticaria', color: '#9be04a', key: 'Veneno: no caduca y se acumula.', lines: {
    enter:  ['anota tu peso y tu altura.', 'prepara un frasco con tu nombre.'],
    champ:  ['pide que guarden una muestra del cadáver.', 'tacha un nombre de su cuaderno, sin pena.'],
    take:   ['siente curiosidad por lo que harás con eso.', 'apunta: el sujeto aprende rápido.'],
    master: ['te propone, encantada, un experimento.'] } },
  feast: { title: 'El Anfitrión del Banquete Eterno', theme: 'Manjares', weapon: 'Trinchante del Anfitrión', color: '#ffc94d', key: 'Bocados: los sueltan los enemigos y al comerlos disparas más rápido.', lines: {
    enter:  ['te guarda un sitio en la mesa. No dice en qué plato.', 'afila los cubiertos y sonríe.'],
    champ:  ['lamenta el desperdicio y pide otra ronda.', 'brinda por el difunto. Estaba tierno.'],
    take:   ['aplaude: ¡por fin alguien con apetito!', 'te ofrece repetir.'],
    master: ['brinda por ti, y ya van tres copas.'] } },
  orc: { title: 'El Primer Puño', theme: 'Orcos', weapon: 'Hacha del Primer Puño', color: '#c58bff', key: 'Furia: sube al golpear y al recibir, y lo potencia todo.', lines: {
    enter:  ['escupe al suelo. Su elegido quiere tu cabeza.', 'hace sonar los tambores.'],
    champ:  ['se ríe a carcajadas. Buen golpe.', 'golpea la mesa: ¡otro!'],
    take:   ['dice que robar a un muerto es de listos.', 'gruñe algo parecido a un elogio.'],
    master: ['te reta a duelo. Lo dice en serio.'] } },
};
const SLOTS = { basic: 'Disparo', charge: 'Cargado', dodge: 'Esquive', passive: 'Pasiva' };
const SLOT_KEYS = ['basic', 'charge', 'dodge', 'passive'];
const pl = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
// Las piezas no llevan su efecto encerrado: se enganchan a cosas que pasan (una bala, una explosión, un esquive,
// una baja) y por eso unas modifican a otras aunque vengan de deidades distintas.
const PIECES = [
  { id: 'dragon_basic',   god: 'dragon', slot: 'basic',   name: 'Colmillo al rojo', desc: l => `Cada bala clava ${pl(l, 'Ascua')}. Se apilan hasta 8 y queman todas a la vez.` },
  { id: 'dragon_charge',  god: 'dragon', slot: 'charge',  name: 'Aliento',          desc: l => `El cargado deja de ser un rayo: es un cono de fuego que clava ${1 + l} Ascuas y hace estallar todas las que tenga cada enemigo (${35 + 10 * (l - 1)}% por Ascua, en área).` },
  { id: 'dragon_dodge',   god: 'dragon', slot: 'dodge',   name: 'Vuelo',            desc: l => `El esquive es un salto largo que pasa por encima de las columnas, y al aterrizar hay una explosión de ${150 * l}% de daño.` },
  { id: 'dragon_passive', god: 'dragon', slot: 'passive', name: 'Pira',             desc: l => `Quien muere con Ascuas explota (${20 * l}% por Ascua) y reparte la mitad de las suyas.` },
  { id: 'stone_basic',    god: 'stone',  slot: 'basic',   name: 'Esquirla',         desc: l => `${Math.max(1, 4 - l) > 1 ? 'Cada ' + Math.max(1, 4 - l) + ' balas dejan' : 'Cada bala deja'} un Cristal clavado junto al enemigo. Los Cristales duran 9 s.` },
  { id: 'stone_charge',   god: 'stone',  slot: 'charge',  name: 'Prisma',           desc: l => `Al disparar el cargado, cada Cristal dispara también un rayo al enemigo más cercano: ${40 * l}% del daño y todos los efectos de tu cargado.` },
  { id: 'stone_dodge',    god: 'stone',  slot: 'dodge',   name: 'Geoda',            desc: l => `El esquive deja un Cristal donde estabas, y atravesar un Cristal lo revienta: ${120 * l}% de daño en área.` },
  { id: 'stone_passive',  god: 'stone',  slot: 'passive', name: 'Veta',             desc: l => `Cada bala que disparas la repite el Cristal más cercano al objetivo, al ${30 * l}% de daño y con tus efectos de disparo.` },
  { id: 'venom_basic',    god: 'venom',  slot: 'basic',   name: 'Dardo',            desc: l => `Cada bala aplica ${l} de Veneno. No caduca y se acumula hasta 30.` },
  { id: 'venom_charge',   god: 'venom',  slot: 'charge',  name: 'Purga',            desc: l => `El cargado convierte el Veneno en daño inmediato: ${15 * l}% por cada punto. El enemigo se queda con la mitad y deja un charco tóxico.` },
  { id: 'venom_dodge',    god: 'venom',  slot: 'dodge',   name: 'Rastro',           desc: l => `El esquive deja 5 s un rastro tóxico que aplica ${l} de Veneno por pulso.` },
  { id: 'venom_passive',  god: 'venom',  slot: 'passive', name: 'Plaga',            desc: l => `Cuando muere un envenenado, todo su Veneno salta a los ${1 + l} enemigos más cercanos.` },
  { id: 'feast_basic',    god: 'feast',  slot: 'basic',   name: 'Sazonar',          desc: l => `Las balas sazonan. Quien muere sazonado suelta un Bocado (${1 + l} si llevaba 5 impactos). Cada Bocado que comes: +10% de cadencia 6 s, hasta 5, y 2 de vida.` },
  { id: 'feast_charge',   god: 'feast',  slot: 'charge',  name: 'Trinchar',         desc: l => `El cargado ejecuta a los enemigos por debajo del ${15 + 10 * l}% de vida y les saca 2 Bocados.` },
  { id: 'feast_dodge',    god: 'feast',  slot: 'dodge',   name: 'Sobremesa',        desc: l => `Al esquivar te comes todos los Bocados de la sala, y cada uno estalla a tu alrededor: ${80 * l}% de daño.` },
  { id: 'feast_passive',  god: 'feast',  slot: 'passive', name: 'Glotón',           desc: l => `Con 3 o más de Saciedad, cada bala va seguida de otra al ${30 + 20 * l}% de daño.` },
  { id: 'orc_basic',      god: 'orc',    slot: 'basic',   name: 'Tambor de guerra', desc: l => `Golpear y recibir golpes te da Furia. Todo tu daño sube hasta +${40 * l}% con la Furia llena.` },
  { id: 'orc_charge',     god: 'orc',    slot: 'charge',  name: 'Grito de guerra',  desc: l => `El cargado gasta toda tu Furia en un grito a tu alrededor: empuja, aturde y hace hasta ${50 + 200 * l}% de daño. Cuanta más Furia, más grande.` },
  { id: 'orc_dodge',      god: 'orc',    slot: 'dodge',   name: 'Embestida',        desc: l => `Atravesar a un enemigo con el esquive le hace ${100 * l}% de daño, lo aturde y te da 15 de Furia.` },
  { id: 'orc_passive',    god: 'orc',    slot: 'passive', name: 'Sed de sangre',    desc: l => `Con la Furia llena disparas un ${30 * l}% más rápido y cada baja te devuelve el esquive.` },
];
// Técnicas: no ocupan ranura. Casi todas se enganchan a TODAS tus explosiones, balas o bajas, vengan de donde vengan.
// rar: 1 rara, 2 épica, 3 legendaria. req: hacen falta todas esas piezas.
const TECHS = [
  { id: 'd_blood',   god: 'dragon', rar: 1, name: 'Sangre de dragón',   desc: 'Todas tus explosiones clavan 2 Ascuas y son un 30% más grandes.' },
  { id: 'd_forge',   god: 'dragon', rar: 3, name: 'Corazón de horno',   desc: 'Las Ascuas no tienen tope, y cada 10 que acumula un enemigo estallan solas: 400% de daño en área.', req: ['dragon_basic'] },
  { id: 'm_reson',   god: 'stone',  rar: 1, name: 'Resonancia',         desc: 'Cada explosión tuya hace estallar también el Cristal más cercano, sin romperlo.' },
  { id: 'm_quartz',  god: 'stone',  rar: 2, name: 'Cuarzo vivo',        desc: 'Donde muere un enemigo nace un Cristal, y los Cristales duran el doble.' },
  { id: 'v_vapors',  god: 'venom',  rar: 1, name: 'Vapores',            desc: 'Todas tus explosiones aplican 3 de Veneno.' },
  { id: 'v_syn',     god: 'venom',  rar: 2, name: 'Organismo débil',    desc: 'Los envenenados reciben un 3% más de daño de todo por cada punto de Veneno, hasta +90%.' },
  { id: 'f_dessert', god: 'feast',  rar: 1, name: 'Postre',             desc: 'Cada Bocado te devuelve una carga de esquive y recarga el disparo cargado.' },
  { id: 'f_banquet', god: 'feast',  rar: 2, name: 'Banquete',           desc: 'Todos los enemigos sueltan un Bocado al morir, estén sazonados o no.' },
  { id: 'o_drums',   god: 'orc',    rar: 1, name: 'Tambores lejanos',   desc: 'Cada explosión tuya te da 8 de Furia y cada baja, 10.' },
  { id: 'o_berserk', god: 'orc',    rar: 3, name: 'Berserker',          desc: 'Con la Furia llena no te frenas al disparar.', req: ['orc_basic'] },
];
const RAR = [{ name: 'Común', color: '#a3a9bd' }, { name: 'Rara', color: '#6fb7ff' }, { name: 'Épica', color: '#c98bff' }, { name: 'Legendaria', color: '#ffd24a' }];
// Maestría: llevar piezas de la misma deidad en 3 acciones distintas.
const MASTERY = {
  dragon: { name: 'Heredera del fuego',     desc: 'Las Ascuas se apilan hasta 20 y queman un 50% más.' },
  stone:  { name: 'Corazón de la montaña',  desc: 'Caben el doble de Cristales y Veta los usa de dos en dos.' },
  venom:  { name: 'Paciente cero',          desc: 'El Veneno hace daño el doble de rápido.' },
  feast:  { name: 'Invitado de honor',      desc: 'La Saciedad llega hasta 10 y no se pierde.' },
  orc:    { name: 'Caudillo',               desc: 'La Furia nunca baja de 50.' },
};
// Fusiones: dos piezas concretas de deidades distintas, en la misma acción, se funden en una habilidad nueva
// con nombre y regla propios. Las dos piezas siguen actuando (con un nivel más) y queda libre una ranura.
const FUSIONS = [
  { id: 'obsidian',  slot: 'basic',   a: 'dragon_basic',   b: 'stone_basic',   name: 'Bala de obsidiana', desc: 'Los Cristales arden: queman a quien tengan cerca y, al apagarse, estallan en fuego.' },
  { id: 'toxgeode',  slot: 'basic',   a: 'stone_basic',    b: 'venom_basic',   name: 'Geoda tóxica',      desc: 'Los Cristales supuran veneno a su alrededor y no se apagan mientras envenenen a alguien.' },
  { id: 'boil',      slot: 'basic',   a: 'venom_basic',    b: 'orc_basic',     name: 'Sangre hirviente',  desc: 'Cada bala aplica más Veneno cuanta más Furia tengas, el Veneno que hace daño te da Furia, y con la Furia llena actúa el doble de rápido.' },
  { id: 'rot',       slot: 'charge',  a: 'dragon_charge',  b: 'venom_charge',  name: 'Aliento podrido',   desc: 'Antes de estallar, el cargado iguala las Ascuas y el Veneno de cada enemigo a la suma de los dos.' },
  { id: 'table',     slot: 'charge',  a: 'stone_charge',   b: 'feast_charge',  name: 'Mesa puesta',       desc: 'Los Cristales ejecutan solos a cualquier enemigo débil que tengan cerca, sin esperar a tu cargado, y le sacan un Bocado.' },
  { id: 'warfeast',  slot: 'charge',  a: 'feast_charge',   b: 'orc_charge',    name: 'Festín de guerra',  desc: 'El grito ejecuta a los enemigos débiles que alcanza. Cada ejecución te devuelve 25 de Furia, y con dos o más puedes volver a cargar al instante.' },
  { id: 'dive',      slot: 'dodge',   a: 'dragon_dodge',   b: 'orc_dodge',     name: 'Picado',            desc: 'El salto se lanza sobre el enemigo que tengas delante. El impacto crece con la Furia, aturde y deja Ascuas a todos.' },
  { id: 'avalanche', slot: 'dodge',   a: 'stone_dodge',    b: 'orc_dodge',     name: 'Avalancha',         desc: 'Embestir a un enemigo lo lanza por los aires. Si choca con una columna, un Cristal, la pared u otro enemigo, estalla: 300% de daño y aturde.' },
  { id: 'roast',     slot: 'passive', a: 'dragon_passive', b: 'feast_passive', name: 'Asado',             desc: 'Quien muere con Ascuas suelta un Bocado asado. Comerlo carga 5 balas de fuego que explotan y clavan Ascuas.' },
  { id: 'bait',      slot: 'passive', a: 'venom_passive',  b: 'feast_passive', name: 'Cebo',              desc: 'Los Bocados que no te comes se pudren a los 3 s. El enemigo que pise uno revienta una nube: 8 de Veneno y aturdido.' },
];
const FUSION = Object.fromEntries(FUSIONS.map(f => [f.id, f]));
// Planos de reforja: cambian cómo funciona el rifle, no solo lo que aplica.
const PLANS = [
  { id: 'burst',   form: true, name: 'Ráfaga',         desc: 'Cada disparo son 3 balas rápidas al 45% de daño, y cada una aplica tus efectos. El gesto dura un poco más.' },
  { id: 'shotgun', form: true, name: 'Recortado',      desc: 'Alcance a la mitad. Disparas un abanico de 5 perdigones al 60% de daño: de cerca pueden entrar todos en el mismo enemigo.' },
  { id: 'sniper',  form: true, name: 'Francotirador',  desc: 'Alcance +60% y disparo un 40% más lento. La bala atraviesa en línea y hace más daño cuanto más lejos esté el enemigo: hasta el triple. A quemarropa hace la mitad.' },
  { id: 'bayonet', form: true, name: 'Bayoneta',       desc: 'Dejas de disparar: cada ataque es una estocada que te lanza a través del objetivo. 180% de daño, eres invulnerable durante la estocada y cuenta como atravesarlo con el esquive.' },
  { id: 'gatling', form: true, name: 'Ametralladora',  desc: 'Mantén pulsado: cada bala acelera la siguiente hasta el triple de cadencia, al 60% de daño. Mientras disparas casi no te mueves, y al soltar se pierde el ritmo.' },
  { id: 'grenade', form: true, name: 'Lanzagranadas',  desc: 'Las balas son granadas: vuelan en arco, pasan por encima de las columnas y explotan en área. 70% de daño y tus efectos de disparo a todos los que alcance.' },
  { id: 'echo',    name: 'Rifle gemelo',  desc: 'Al esquivar dejas una copia del rifle donde estabas: dispara sola 3 s a tu cadencia, al 50% de daño y con tus efectos.' },
  { id: 'tempo',   name: 'Compás',        desc: 'Si pulsas justo cuando el anillo se llena, el disparo hace el doble de daño. Mantener pulsado o machacar el botón no cuenta.' },
  { id: 'mortar',  name: 'Mortero',       desc: 'El cargado deja de ser un rayo: lanza un proyectil que pasa por encima de las columnas y explota en área sobre tu objetivo.' },
  { id: 'recoil',  name: 'Retroceso',     desc: 'El cargado te lanza hacia atrás como un esquive (activa tus piezas de esquive) y se recupera un 35% antes.' },
  { id: 'double',  name: 'Doble esquive', desc: 'Llevas dos cargas de esquive.' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

const C = {
  wall: '#0e1017', floor: '#1a1e29', tile: '#1f2431', edge: '#3a4258',
  ink: '#ece8dd', dim: '#a3a9bd', ember: '#ff9a3c', energy: '#62e6ff', blood: '#e5506a', arcane: '#b68cff',
};

// ───────────────────────── Utilidades ─────────────────────────
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const rnd = (a, b) => a + Math.random() * (b - a);

const cv = $('game');
const ctx = cv.getContext('2d');
const view = { s: 1, w: 520, h: 300, cssW: 1, cssH: 1, dpr: 1 };
const cam = { x: 0, y: 0 };

// ───────────────────────── Sonido (pitidos simples) ─────────────────────────
let AC = null, muted = false;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
}
function blip(freq, dur, type = 'square', vol = 0.04, slide = 0) {
  if (!AC || muted || AC.state !== 'running') return;
  try {
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* sin sonido */ }
}

// ───────────────────────── Entrada ─────────────────────────
const keys = new Set(), tapped = new Set();   // tapped: pulsaciones más cortas que un fotograma
const down = c => keys.has(c) || tapped.has(c);
const touch = { joyId: null, ox: 0, oy: 0, x: 0, y: 0, atk: false, dodge: false, chg: false };
let lastDev = 'none', padName = '', padBlocked = false;
const I = { mx: 0, my: 0, ax: 0, ay: 0, atk: false, atkP: false, dodgeP: false, chg: false, startP: false, clearP: false, chgP: false, navL: false, navR: false };
const prev = { atk: false, dodge: false, start: false, clear: false, chg: false, nav: 0 };

addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys.add(e.code); tapped.add(e.code); lastDev = 'kb'; audioInit();
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

function readPad() {
  let pads;
  try { pads = navigator.getGamepads ? navigator.getGamepads() : []; }
  catch (e) { padBlocked = true; return null; }
  for (const p of pads) if (p && p.connected) return p;
  return null;
}
const dz = v => (Math.abs(v || 0) < 0.2 ? 0 : v);

function pollInput() {
  let mx = 0, my = 0, ax = 0, ay = 0, atk = false, dodge = false, chg = false, start = false, clear = false, nav = 0;

  // Teclado
  if (down('KeyA') || down('ArrowLeft')) mx -= 1;
  if (down('KeyD') || down('ArrowRight')) mx += 1;
  if (down('KeyW') || down('ArrowUp')) my -= 1;
  if (down('KeyS') || down('ArrowDown')) my += 1;
  atk = down('Space') || down('KeyJ') || down('Enter');
  dodge = down('ShiftLeft') || down('ShiftRight') || down('KeyK');
  chg = down('KeyE') || down('KeyL');
  start = down('Escape') || down('KeyP');

  // Mando
  const p = readPad();
  if (p) {
    padName = p.id || 'mando';
    const b = i => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
    const lx = dz(p.axes[0]), ly = dz(p.axes[1]), rx = dz(p.axes[2]), ry = dz(p.axes[3]);
    const any = lx || ly || rx || ry || p.buttons.some(x => x && x.pressed);
    if (any) { lastDev = 'pad'; audioInit(); }
    mx += lx; my += ly; ax += rx; ay += ry;
    if (b(14)) mx -= 1; if (b(15)) mx += 1; if (b(12)) my -= 1; if (b(13)) my += 1;
    atk = atk || b(0) || b(7);
    dodge = dodge || b(1) || b(5);
    chg = chg || b(2) || b(6);
    start = start || b(9);
    clear = clear || b(11);
  } else padName = '';

  // Táctil
  if (touch.joyId !== null) {
    const dx = touch.x - touch.ox, dy = touch.y - touch.oy, m = Math.hypot(dx, dy), max = 46;
    if (m > 6) { const v = Math.min(1, m / max); mx += dx / m * v; my += dy / m * v; }
  }
  atk = atk || touch.atk || touch.tAtk; dodge = dodge || touch.dodge || touch.tDodge; chg = chg || touch.chg;
  tapped.clear(); touch.tAtk = touch.tDodge = false;

  const mm = Math.hypot(mx, my);
  if (mm > 1) { mx /= mm; my /= mm; }
  if (mx < -0.6 || my < -0.6) nav = -1; else if (mx > 0.6 || my > 0.6) nav = 1;

  I.mx = mx; I.my = my; I.ax = ax; I.ay = ay; I.atk = atk; I.chg = chg;
  I.atkP = atk && !prev.atk;
  I.dodgeP = dodge && !prev.dodge;
  I.startP = start && !prev.start;
  I.clearP = clear && !prev.clear;
  I.chgP = chg && !prev.chg; prev.chg = chg;
  I.navL = nav === -1 && prev.nav !== -1;
  I.navR = nav === 1 && prev.nav !== 1;
  prev.atk = atk; prev.dodge = dodge; prev.start = start; prev.clear = clear; prev.nav = nav;
}

function screenToWorld(cx, cy) {
  const r = cv.getBoundingClientRect();
  return { x: cam.x + (cx - r.left) * view.dpr / view.s, y: cam.y + (cy - r.top) * view.dpr / view.s };
}
function tapLock(cx, cy) {
  if (!S || S.mode !== 'play') return;
  const w = screenToWorld(cx, cy);
  let best = null, bd = 1e9;
  for (const e of S.enemies) {
    if (e.spawn > 0) continue;
    const d = Math.hypot(e.x - w.x, e.y - w.y) - e.r;
    if (d < 26 && d < bd) { bd = d; best = e; }
  }
  if (best) { S.lock = best; blip(900, 0.04, 'triangle', 0.03); }
}
cv.addEventListener('pointerdown', e => {
  audioInit();
  if (e.pointerType === 'mouse') { tapLock(e.clientX, e.clientY); return; }
  lastDev = 'touch';
  const r = cv.getBoundingClientRect();
  if (e.clientX - r.left < r.width * 0.5 && touch.joyId === null) {
    touch.joyId = e.pointerId; touch.ox = touch.x = e.clientX; touch.oy = touch.y = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  } else tapLock(e.clientX, e.clientY);
});
cv.addEventListener('pointermove', e => { if (e.pointerId === touch.joyId) { touch.x = e.clientX; touch.y = e.clientY; } });
const joyEnd = e => { if (e.pointerId === touch.joyId) touch.joyId = null; };
cv.addEventListener('pointerup', joyEnd); cv.addEventListener('pointercancel', joyEnd);
cv.addEventListener('contextmenu', e => e.preventDefault());

function bindHold(el, key) {
  const on = e => { e.preventDefault(); audioInit(); lastDev = 'touch'; touch[key] = true; touch['t' + key[0].toUpperCase() + key.slice(1)] = true; el.classList.add('down'); try { el.setPointerCapture(e.pointerId); } catch (_) {} };
  const off = () => { touch[key] = false; el.classList.remove('down'); };
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindHold($('btnAtk'), 'atk'); bindHold($('btnDodge'), 'dodge'); bindHold($('btnChg'), 'chg');

// ───────────────────────── Estado ─────────────────────────
let S = null, best = 0, aimLatch = false, modeT = 0, pickSel = 1, pickOpts = [];
try { best = +localStorage.getItem('kiteo.best') || 0; } catch (e) {}

function newGame() {
  const P = T.player;
  S = {
    mode: 'title', wave: 0, bossRoom: false, gained: 0, kills: 0, t: 0, shake: 0, hitstop: 0, lastStop: -1, hurtFx: 0, noTarget: 0, waveT: 0, waveClear: 0,
    p: {
      x: T.room.w / 2, y: T.room.h / 2, r: P.r, hp: P.hp, maxHp: P.hp, dmg: P.dmg, as: P.as, range: P.range, speed: P.speed, shotN: 0, crysN: 0,
      face: 0, cd: 0, windup: 0, windupTotal: 0, windupTarget: null, buffer: 0, wasReady: true, readyT: 0, spoil: false, crit: false, spin: 0,
      dodgeT: 0, dodgeCd: T.dodge.cd, dodgeN: 1, dodgeFrom: null, dodgeHit: new Set(), isLunge: false, fly: false, dvx: 0, dvy: 0, inv: 0,
      charging: false, charge: 0, chargeCd: 0, chargeCdMax: T.charge.cd, chargeDir: 0,
      fury: 0, furyT: 0, sated: 0, satedT: 0, fireAmmo: 0,
    },
    enemies: [], shots: [], fx: [], queue: [], lock: null, target: null,
    build: Object.fromEntries(SLOT_KEYS.map(k => [k, { items: [], fused: null }])), techs: new Set(), plans: new Set(), nextGod: null, buildV: 0, drop: null,
    zones: [], timers: [], pillars: [], turrets: [], crystals: [], bites: [],
  };
}
function setMode(m) { S.mode = m; modeT = 0; renderOverlay(); }
function startRun() {
  newGame();
  const p = S.p;   // lo que recuerdas de otras vidas
  p.dmg *= 1 + 0.05 * M.up.dmg; p.as *= 1 + 0.04 * M.up.as; p.range *= 1 + 0.04 * M.up.rng; p.maxHp += 10 * M.up.hp; p.hp = p.maxHp;
  for (const id of M.loadout) { const pc = PIECE[id]; if (pc && S.build[pc.slot].items.length < 2) S.build[pc.slot].items.push({ id, lvl: 1 }); }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}

function nextWave() {
  S.wave += 1;
  const n = S.wave, list = [];
  const add = (type, k) => { for (let i = 0; i < k; i++) list.push(type); };
  if (n === 1) add('stalker', 4);
  else if (n === 2) { add('stalker', 5); add('runner', 2); }
  else if (n === 3) { add('stalker', 4); add('runner', 3); add('mage', 1); }
  else { add('stalker', 3 + Math.floor(n / 2)); add('runner', n - 1); add('mage', Math.floor(n / 2)); add('brute', Math.floor(n / 3)); }
  list.sort(() => Math.random() - 0.5);
  list.splice(Math.ceil(list.length / 2), 0, 'champ');   // el elegido de una deidad
  if (n > ROOMS) { list.length = 0; list.push('boss'); S.bossRoom = true; }   // tras la última sala, el Guardián
  S.drop = null; S.waveT = 0;
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.45 }));
  S.pillars = []; S.turrets = []; S.zones = []; S.crystals = []; S.bites = [];
  for (let i = 0, tries = 0; i < 7 && tries < 300; tries++) {
    const c = { x: rnd(70, T.room.w - 70), y: rnd(70, T.room.h - 70), r: rnd(14, 24) };
    if (dist(c, S.p) < 90 || S.pillars.some(o => dist(o, c) < o.r + c.r + 60)) continue;
    S.pillars.push(c); i++;
  }
}

function spawn(typeKey) {
  const ty = TYPES[typeKey], p = S.p;
  let x = 0, y = 0;
  for (let i = 0; i < 30; i++) {
    x = rnd(30, T.room.w - 30); y = rnd(30, T.room.h - 30);
    if (Math.hypot(x - p.x, y - p.y) > 230) break;
  }
  const keys = Object.keys(GODS), god = ty.champ ? (S.nextGod || keys[Math.floor(Math.random() * keys.length)]) : null;
  const hp = Math.round(ty.hp * (1 + 0.12 * (S.wave - 1)));
  const e = { type: ty, champ: !!ty.champ, god, color: god ? GODS[god].color : ty.color, x, y, r: ty.r, hp, maxHp: hp, speed: ty.speed, dmg: ty.dmg,
    spawn: 0.65, flash: 0, kx: 0, ky: 0, wind: 0, rec: 0, cool: rnd(0.8, 1.8), cast: 0, dir: 0,
    ember: 0, emberT: 0, emberAcc: 0, venom: 0, venAcc: 0, season: 0, carved: 0, stun: 0, autoCd: 0, fling: 0, fvx: 0, fvy: 0,
    side: Math.random() < 0.5 ? 1 : -1, lungeCd: rnd(1.5, 3), lungeWind: 0, lungeT: 0, lvx: 0, lvy: 0, lungeHit: false };
  if (ty.boss) Object.assign(e, { boss: true, x: T.room.w / 2, y: 90, act: 'rest', at: 1.2, think: 1.2, sumCd: 2, ph2: false, hitOnce: false });
  S.enemies.push(e); collide(e, ty.r);
  if (god) say(god, 'enter');
}

// ───────────────────────── Progreso permanente ─────────────────────────
// Lo que el herrero recuerda entre vidas. Se guarda en el navegador.
const ROOMS = 6;
const CRAFT = [
  { id: 'dmg', name: 'Temple',         desc: '+5% de daño',     max: 5 },
  { id: 'as',  name: 'Pulso',          desc: '+4% de cadencia', max: 5 },
  { id: 'hp',  name: 'Coraza',         desc: '+10 de vida',     max: 5 },
  { id: 'rng', name: 'Ojo de herrero', desc: '+4% de alcance',  max: 5 },
];
const COST = [10, 20, 35, 55, 80], SLOT_COST = [60, 150];
let M = { shards: 0, runs: 0, best: 0, wins: 0, up: { dmg: 0, as: 0, hp: 0, rng: 0 }, slots: 1, known: [], loadout: [] };
try { const raw = localStorage.getItem('kiteo.save'); if (raw) { const o = JSON.parse(raw); M = Object.assign(M, o, { up: Object.assign(M.up, o.up || {}) }); } } catch (e) {}
function save() { try { localStorage.setItem('kiteo.save', JSON.stringify(M)); } catch (e) {} }
function endRun(win) {
  const rooms = win ? ROOMS : Math.max(0, S.wave - 1);
  S.gained = rooms * 5 + (win ? 50 : 0);
  M.shards += S.gained; M.runs += 1; M.best = Math.max(M.best, win ? ROOMS + 1 : S.wave); if (win) M.wins += 1;
  save();
}
// Vencer al Guardián: estudias una de las piezas que llevas y la recuerdas para siempre
function winRun() {
  endRun(true);
  const carried = SLOT_KEYS.flatMap(k => S.build[k].items.map(x => x.id)).filter(id => !M.known.includes(id));
  const opts = carried.map(id => { const pc = PIECE[id]; return { tag: SLOTS[pc.slot], name: pc.name, color: GODS[pc.god].color, desc: pc.desc(1), note: 'Podrás empezar las partidas con ella', apply: () => { M.known.push(id); save(); } }; });
  if (!opts.length) { M.shards += 30; S.gained += 30; save(); opts.push({ tag: 'Fragmentos', name: 'Nada nuevo que aprender', color: C.ink, desc: 'Ya conocías todo lo que llevabas. Te llevas 30 fragmentos más.', note: '', apply: () => {} }); }
  afterPicks = openForge;
  pickQueue = [() => ({ eyebrow: 'Has vencido al Guardián · +' + S.gained + ' fragmentos', title: 'Estudias una pieza y la recuerdas para siempre', opts })];
  advancePick();
}
let forgeSel = -1;
function openForge() { S.mode = 'forge'; modeT = 0; forgeSel = -1; renderOverlay(); ov.scrollTop = 0; }
function forgeHtml() {
  const up = CRAFT.map(c => { const l = M.up[c.id], cost = COST[l], can = l < c.max && M.shards >= cost;
    return `<button class="fi${can ? '' : ' off'}" data-act="up:${c.id}"><b>${c.name} ${l}/${c.max}</b><span>${c.desc} por nivel</span><i>${l >= c.max ? 'Al máximo' : cost + ' fragmentos'}</i></button>`; }).join('');
  const sc = SLOT_COST[M.slots - 1];
  const slot = `<button class="fi${sc && M.shards >= sc ? '' : ' off'}" data-act="slot"><b>Ranuras de partida ${M.slots}/3</b><span>Cuántas piezas recordadas llevas al empezar</span><i>${sc ? sc + ' fragmentos' : 'Al máximo'}</i></button>`;
  const known = M.known.filter(id => PIECE[id]).map(id => { const pc = PIECE[id], on = M.loadout.includes(id);
    return `<button class="fi${on ? ' on' : ''}" data-act="pc:${id}"><b style="color:${GODS[pc.god].color}">${pc.name}</b><span>${SLOTS[pc.slot]} · ${GODS[pc.god].theme}</span><i>${on ? 'En el rifle' : 'Guardada'}</i></button>`; }).join('');
  const past = M.runs ? `Llevas ${M.runs} ${M.runs === 1 ? 'vida' : 'vidas'}. Lo más lejos que has llegado: ${M.best > ROOMS ? 'el Guardián' : 'la sala ' + M.best}${M.wins ? ', y lo has vencido ' + M.wins + (M.wins === 1 ? ' vez' : ' veces') : ''}.` : 'Es tu primera vida.';
  return `<p class="eyebrow">La forja · vida ${M.runs + 1}</p><h1>${M.runs ? 'Vuelves atrás, recordándolo todo' : 'Antes de entrar'}</h1>
    <p class="lead">Tienes <b>${M.shards}</b> fragmentos. ${past} Cada sala superada da 5 fragmentos y vencer al Guardián, 50.</p>
    <div class="forge"><section><h2>Oficio</h2>${up}${slot}</section>
    <section><h2>Rifle de partida · ${M.loadout.length}/${M.slots}</h2>${known || '<p class="fine">Aún no recuerdas ninguna pieza. Vence al Guardián y podrás estudiar una de las que lleves encima.</p>'}</section></div>
    <button class="fi primary" data-act="go">Entrar en la mazmorra</button>`;
}
function forgeAct(act) {
  const [k, id] = act.split(':');
  let ok = true;
  if (k === 'go') { startRun(); return; }
  if (k === 'up') { const l = M.up[id]; if (l < 5 && M.shards >= COST[l]) { M.shards -= COST[l]; M.up[id] = l + 1; } else ok = false; }
  else if (k === 'slot') { const c = SLOT_COST[M.slots - 1]; if (c && M.shards >= c) { M.shards -= c; M.slots += 1; } else ok = false; }
  else if (k === 'pc') { const i = M.loadout.indexOf(id); if (i >= 0) M.loadout.splice(i, 1); else if (M.loadout.length < M.slots) M.loadout.push(id); else ok = false; }
  blip(ok ? 660 : 140, 0.1, ok ? 'triangle' : 'sawtooth', 0.05, ok ? 400 : -40);
  save(); renderOverlay();
}
function bindForge() {
  const els = [...ovBody.querySelectorAll('.fi')];
  els.forEach(el => el.addEventListener('click', () => { audioInit(); forgeSel = els.indexOf(el); forgeAct(el.dataset.act); }));
  if (forgeSel < 0 || forgeSel >= els.length) forgeSel = els.length - 1;
  els.forEach((el, i) => el.classList.toggle('sel', i === forgeSel));
}
function forgeInput() {
  const els = [...ovBody.querySelectorAll('.fi')];
  let moved = false;
  if (I.navL && forgeSel > 0) { forgeSel--; moved = true; }
  if (I.navR && forgeSel < els.length - 1) { forgeSel++; moved = true; }
  if (moved) { els.forEach((el, i) => el.classList.toggle('sel', i === forgeSel)); els[forgeSel].scrollIntoView({ block: 'nearest' }); blip(700, 0.03, 'triangle', 0.03); }
  if (I.atkP && modeT > 0.3 && els[forgeSel]) els[forgeSel].click();
}

// ───────────────────────── El Guardián ─────────────────────────
// Jefe del mundo. Tres ataques con aviso; si embiste contra una columna se queda aturdido y recibe el doble.
function bossAI(e, dt, d, ux, uy) {
  const p = S.p, ph2 = e.hp < e.maxHp * 0.5;
  if (ph2 && !e.ph2) { e.ph2 = true; S.shake = 9; S.fx.push({ k: 'num', x: e.x, y: e.y - e.r - 14, t: 0, life: 1.6, txt: 'El Guardián se enfurece', col: C.blood, big: true }); blip(70, 0.6, 'sawtooth', 0.08, -20); }
  e.at -= dt;
  if (e.act === 'slam') {
    if (e.at <= 0) { S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 78, t: 0, life: 0.3, col: C.blood }); S.shake = Math.max(S.shake, 7); blip(80, 0.25, 'sawtooth', 0.07, -30); if (d < 78 + p.r) hurtPlayer(30); e.act = 'rest'; e.at = 0.7; }
  } else if (e.act === 'chargeWind') {
    if (e.at <= 0) { e.act = 'charge'; e.at = 0.55; e.hitOnce = false; }
  } else if (e.act === 'charge') {
    e.x += e.lvx * dt; e.y += e.lvy * dt;
    if (!e.hitOnce && dist(e, p) < e.r + p.r + 3) { e.hitOnce = true; hurtPlayer(35); }
    for (const c of S.pillars) if (Math.hypot(e.x - c.x, e.y - c.y) < c.r + e.r) { e.act = 'dazed'; e.at = 1.8; S.shake = 9; S.fx.push({ k: 'num', x: e.x, y: e.y - e.r - 14, t: 0, life: 1.2, txt: '¡Aturdido!', col: C.ink, big: true }); blip(200, 0.3, 'square', 0.06, -150); break; }
    if (e.act === 'charge' && e.at <= 0) { e.act = 'rest'; e.at = 0.6; }
  } else if (e.act === 'dazed') {
    if (e.at <= 0) { e.act = 'rest'; e.at = 0.3; }
  } else if (e.act === 'cast') {
    if (e.at <= 0) {
      const ring = off => { const n = ph2 ? 14 : 10; for (let i = 0; i < n; i++) { const a = off + i * Math.PI * 2 / n; S.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, r: 4, dmg: 12, life: 4 }); } blip(600, 0.12, 'triangle', 0.04, -300); };
      const off = Math.random() * 6.28; ring(off);
      if (ph2) S.timers.push({ t: 0.4, fn: () => { if (active(e)) ring(off + 0.22); } });
      e.act = 'rest'; e.at = 0.5;
    }
  } else if (e.act === 'rest') {
    if (e.at <= 0) e.act = 'idle';
  } else {
    e.x += ux * e.speed * dt; e.y += uy * e.speed * dt;
    e.think -= dt;
    if (e.think > 0) return;
    e.think = ph2 ? 1.0 : 1.6;
    if (d < 95) { e.act = 'slam'; e.at = 0.75; }
    else if (Math.random() < 0.5) { e.act = 'chargeWind'; e.at = 0.7; e.lvx = ux * 430; e.lvy = uy * 430; }
    else { e.act = 'cast'; e.at = 0.6; }
    if (ph2 && --e.sumCd <= 0) { e.sumCd = 4; for (let i = 0; i < 3; i++) spawn('runner'); }
  }
}

// ───────────────────────── Mensajes de las deidades ─────────────────────────
const sysEl = $('sys'); let sysQ = [], sysT = 0, sysLast = 0;
function say(god, kind) {
  const g = GODS[god], arr = g.lines[kind];
  if (!arr) return;
  sysQ.push({ text: `[La deidad «${g.title}» ${arr[Math.floor(Math.random() * arr.length)]}]`, color: g.color });
  if (sysQ.length > 3) sysQ.shift();
}
function sysTick() {
  const now = performance.now(), dt = Math.min(0.1, (now - sysLast) / 1000); sysLast = now;
  sysT -= dt;
  if (sysT > 0) return;
  if (sysQ.length) { const m = sysQ.shift(); sysEl.textContent = m.text; sysEl.style.borderColor = m.color; sysEl.hidden = false; sysT = 3.4; }
  else sysEl.hidden = true;
}

// ───────────────────────── Combate ─────────────────────────
const active = e => e.spawn <= 0 && e.hp > 0;
const PIECE = Object.fromEntries(PIECES.map(p => [p.id, p]));
const godOf = id => PIECE[id].god;
// Nivel efectivo de una pieza (0 si no la llevas). Dentro de una aleación cuenta un nivel más.
const lv = id => { const a = S.build[PIECE[id].slot], it = a.items.find(x => x.id === id); return it ? it.lvl + (a.fused && a.fused.includes(id) ? 1 : 0) : 0; };
const has = id => S.techs.has(id);
// ¿Está forjada esa fusión?
const fz = id => { const F = FUSION[id], f = S.build[F.slot].fused; return !!f && f.includes(F.a) && f.includes(F.b); };
const fusionOf = slot => { const f = S.build[slot].fused; return f ? FUSIONS.find(x => x.slot === slot && f.includes(x.a) && f.includes(x.b)) : null; };
const godCount = god => SLOT_KEYS.filter(k => S.build[k].items.some(x => godOf(x.id) === god)).length;
const mastery = god => godCount(god) >= 3;
const slotColor = slot => { const a = S.build[slot]; return a.items.length ? GODS[godOf(a.items[0].id)].color : C.energy; };
const dodgeMax = () => (S.plans.has('double') ? 2 : 1);
const satedMax = () => (mastery('feast') ? 10 : 5);
const furyFull = () => S.p.fury >= 100;
const rangeOf = () => { const P = S.plans; return S.p.range * (P.has('shotgun') || P.has('bayonet') ? 0.5 : P.has('sniper') ? 1.6 : 1); };
const periodOf = () => {
  const p = S.p, bl = lv('orc_passive');
  return 1 / (p.as * (S.plans.has('sniper') ? 0.6 : 1) * (S.plans.has('gatling') ? 1 + 2 * p.spin : 1) * (1 + 0.1 * p.sated) * (bl && furyFull() ? 1 + 0.3 * bl : 1));
};

// Columnas: hasta dónde llega un rayo antes de chocar, si hay línea de tiro, y empujar fuera a quien se mete
function rayClip(x, y, ux, uy, len) {
  let b = len;
  for (const c of S.pillars) {
    const cx = c.x - x, cy = c.y - y, al = cx * ux + cy * uy;
    if (al <= 0) continue;
    const perp2 = cx * cx + cy * cy - al * al, r2 = c.r * c.r;
    if (perp2 >= r2) continue;
    const t = al - Math.sqrt(r2 - perp2);
    if (t < b) b = Math.max(0, t);
  }
  return b;
}
function blocked(a, b) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return rayClip(a.x, a.y, dx / d, dy / d, d) < d - 0.01; }
function collide(o, r) {
  let c0 = null;
  for (const c of S.pillars) {
    const dx = o.x - c.x, dy = o.y - c.y, d = Math.hypot(dx, dy) || 0.01, min = c.r + r;
    if (d < min) { o.x = c.x + dx / d * min; o.y = c.y + dy / d * min; c0 = c; }
  }
  return c0;
}
function nearestInRange() {
  const p = S.p, rng = rangeOf(); let bestE = null, bd = 1e9;
  for (const e of S.enemies) {
    if (!active(e)) continue;
    const d = dist(p, e) - e.r;
    if (d <= rng && d < bd && (S.plans.has('grenade') || !blocked(p, e))) { bd = d; bestE = e; }
  }
  return bestE;
}
// Otros enemigos vivos cerca de un punto o enemigo, del más cercano al más lejano
function others(e, r, max) {
  const out = [];
  for (const o of S.enemies) { if (o === e || !active(o)) continue; const d = dist(e, o); if (d <= r) out.push([d, o]); }
  return out.sort((a, b) => a[0] - b[0]).slice(0, max).map(x => x[1]);
}

function gainFury(n) { const p = S.p; if (!godCount('orc')) return; p.fury = Math.min(100, p.fury + n); p.furyT = 2; }

function kill(e) {
  const p = S.p;
  S.kills += 1;
  for (let i = 0; i < 10; i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: rnd(-110, 110), vy: rnd(-110, 110), t: 0, life: rnd(0.25, 0.5), col: e.color });
  if (S.lock === e) S.lock = null;
  blip(160, 0.12, 'sawtooth', 0.04, -90);
  if (e.champ) { S.drop = { god: e.god, x: e.x, y: e.y }; say(e.god, 'champ'); blip(880, 0.25, 'triangle', 0.05, 400); }
  if (has('o_drums')) gainFury(10);
  if (lv('orc_passive') && furyFull()) p.dodgeN = dodgeMax();                                  // Sed de sangre
  const fb = lv('feast_basic');
  let bites = (has('f_banquet') ? 1 : 0) + e.carved;
  if (fb && e.season > 0) bites = Math.max(bites, (e.season >= 5 ? 1 + fb : 1) + e.carved);    // Sazonar
  for (let i = 0; i < bites; i++) dropBite(e.x + rnd(-10, 10), e.y + rnd(-10, 10));
  if (fz('roast') && e.ember > 0) dropBite(e.x, e.y, true);                                    // fusión Asado
  if (has('m_quartz')) addCrystal(e.x, e.y);                                                   // Cuarzo vivo
  const vp = lv('venom_passive');
  if (vp && e.venom > 0) for (const o of others(e, 130, 1 + vp)) {                             // Plaga
    S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.2, col: GODS.venom.color });
    addVenom(o, e.venom);
  }
  const dp = lv('dragon_passive'), st = e.ember;
  if (dp && st > 0) explode(e.x, e.y, 46, p.dmg * 0.2 * dp * st, { ember: Math.ceil(st / 2), col: GODS.dragon.color });   // Pira
}

function hit(e, dmg, ux, uy, big, col) {
  if (!active(e)) return;
  const p = S.p, ob = lv('orc_basic');
  if (ob) dmg *= 1 + 0.4 * ob * p.fury / 100;                              // Tambor de guerra
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);              // Organismo débil
  if (e.boss && e.act === 'dazed') dmg *= 2;
  e.hp -= dmg; e.flash = 0.1;
  const kb = (big ? 150 : 60) * (e.boss ? 0.06 : 1); e.kx += ux * kb; e.ky += uy * kb;
  S.fx.push({ k: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r - 2, t: 0, life: 0.55, txt: String(Math.round(dmg)), big });
  for (let i = 0; i < (big ? 7 : 3); i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: ux * rnd(40, 140) + rnd(-50, 50), vy: uy * rnd(40, 140) + rnd(-50, 50), t: 0, life: rnd(0.15, 0.3), col: col || C.energy });
  S.shake = Math.max(S.shake, big ? 5 : 1.6);
  if (S.t - S.lastStop > 0.16) { S.hitstop = big ? 0.05 : 0.02; S.lastStop = S.t; }   // micropausa de impacto, sin encadenarse
  gainFury(2);
  if (e.hp <= 0) kill(e); else blip(520, 0.035, 'square', 0.025);
}
// Daño continuo: sin pausa ni empujón
function dot(e, dmg, col) {
  if (!active(e)) return;
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);
  e.hp -= dmg;
  S.fx.push({ k: 'num', x: e.x + rnd(-6, 6), y: e.y - e.r - 2, t: 0, life: 0.4, txt: String(Math.max(1, Math.round(dmg))), col });
  if (e.hp <= 0) kill(e);
}
// Toda explosión pasa por aquí, así que las técnicas que dicen "todas tus explosiones" afectan a cualquiera
function explode(x, y, r, dmg, o) {
  o = o || {};
  const blood = has('d_blood'), vap = has('v_vapors');
  if (blood) r *= 1.3;
  S.fx.push({ k: 'ring', x, y, r, t: 0, life: 0.28, col: o.col || C.ink });
  if (!o.soft) { S.shake = Math.max(S.shake, 4); blip(90, 0.2, 'sawtooth', 0.05, -40); }
  for (const e of S.enemies.slice()) {
    if (!active(e)) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
    if (d > r + e.r) continue;
    if (dmg > 0 && e !== o.skip) hit(e, dmg, dx / d, dy / d, !o.soft, o.col);
    if (!active(e)) continue;
    if (o.push) { e.kx += dx / d * o.push; e.ky += dy / d * o.push; }
    if (o.stun) stun(e, o.stun);
    const em = (o.ember || 0) + (blood ? 2 : 0), ve = (o.venom || 0) + (vap ? 3 : 0);
    if (em) addEmber(e, em);
    if (ve) addVenom(e, ve);
    if (o.payoff) chargePayoff(e);
  }
  if (has('o_drums')) gainFury(8);
  if (has('m_reson') && !o.echo) {                                         // Resonancia
    let c = null, cd = 170;
    for (const k of S.crystals) { const d = Math.hypot(k.x - x, k.y - y); if (d < cd && d > 4) { cd = d; c = k; } }
    if (c) S.timers.push({ t: 0.09, fn: () => explode(c.x, c.y, 36, S.p.dmg * 0.6, { col: GODS.stone.color, echo: true, soft: true }) });
  }
}

// ── Lo que se acumula: Ascuas y Veneno en el enemigo, Cristales y Bocados en la sala
function addEmber(e, n) {
  if (!active(e) || n <= 0) return;
  const forge = has('d_forge');
  e.ember = forge ? e.ember + n : Math.min(mastery('dragon') ? 20 : 8, e.ember + n); e.emberT = 4;
  if (forge && e.ember >= 10 && e.autoCd <= 0) { e.autoCd = 0.3; e.ember -= 10; explode(e.x, e.y, 42, S.p.dmg * 4, { col: GODS.dragon.color }); }   // Corazón de horno
}
function addVenom(e, n) { if (active(e) && n > 0) e.venom = Math.min(30, e.venom + n); }
function stun(e, t) { if (!active(e) || e.boss) return; e.stun = Math.max(e.stun, t); e.wind = 0; e.cast = 0; e.lungeWind = 0; e.lungeT = 0; }
function addCrystal(x, y) {
  S.crystals.push({ x: clamp(x, 12, T.room.w - 12), y: clamp(y, 12, T.room.h - 12), life: has('m_quartz') ? 18 : 9 });
  const max = mastery('stone') ? 12 : 6;
  while (S.crystals.length > max) S.crystals.shift();
}
function dropBite(x, y, hot) { S.bites.push({ x: clamp(x, 10, T.room.w - 10), y: clamp(y, 10, T.room.h - 10), life: 14, age: 0, hot: !!hot, rot: false }); if (S.bites.length > 30) S.bites.shift(); }
function eat(hot) {
  const p = S.p;
  if (hot) p.fireAmmo = Math.min(15, p.fireAmmo + 5);
  p.sated = Math.min(satedMax(), p.sated + 1); p.satedT = 6; p.hp = Math.min(p.maxHp, p.hp + 2);
  blip(990, 0.06, 'triangle', 0.035, 300);
  if (has('f_dessert')) { p.dodgeN = Math.min(dodgeMax(), p.dodgeN + 1); p.chargeCd = 0; }   // Postre
}

// Un impacto de bala, venga de ti, de un Cristal o de un rifle gemelo: daño y lo que apilan tus piezas de disparo
function onHit(e, dmg, ux, uy, big, col, src) {
  hit(e, dmg, ux, uy, big, col);
  const db = lv('dragon_basic'), vb = lv('venom_basic'), fb = lv('feast_basic'), sb = lv('stone_basic'), p = S.p;
  if (db) addEmber(e, db);
  if (vb) addVenom(e, vb);
  if (fb && active(e)) e.season = Math.min(5, e.season + 1);
  if (fz('boil')) addVenom(e, Math.floor(p.fury / 20));                    // fusión Sangre hirviente
  if (sb && src === 'player') { p.crysN += 1; if (p.crysN % Math.max(1, 4 - sb) === 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }
}
// Una bala tuya: además del impacto, la repiten los Cristales (Veta) y el estómago lleno (Glotón)
function shot(e, dmg, ux, uy, big, col) {
  onHit(e, dmg, ux, uy, big, col, 'player');
  if (S.p.fireAmmo > 0) { S.p.fireAmmo -= 1; explode(e.x, e.y, 30, dmg * 0.5, { ember: 2, col: GODS.dragon.color, soft: true, skip: e }); }   // fusión Asado: balas de fuego
  const sp = lv('stone_passive'), fp = lv('feast_passive');
  if (sp && S.crystals.length) {
    const near = S.crystals.map(c => [Math.hypot(c.x - e.x, c.y - e.y), c]).filter(x => x[0] < 170).sort((a, b) => a[0] - b[0]).slice(0, mastery('stone') ? 2 : 1);
    for (const [d, c] of near) {
      S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: e.x, y2: e.y, t: 0, life: 0.1, col: GODS.stone.color });
      onHit(e, dmg * 0.3 * sp, (e.x - c.x) / (d || 1), (e.y - c.y) / (d || 1), false, GODS.stone.color, 'crystal');
    }
  }
  if (fp && S.p.sated >= 3) S.timers.push({ t: 0.06, fn: () => { if (active(e)) { S.fx.push({ k: 'tracer', x1: S.p.x, y1: S.p.y, x2: e.x, y2: e.y, t: 0, life: 0.08, col: GODS.feast.color }); onHit(e, dmg * (0.3 + 0.2 * fp), ux, uy, false, GODS.feast.color, 'echo'); } } });
}

function fireBasic(target) {
  const p = S.p, rng = rangeOf(), P = S.plans;
  if (!target || !active(target)) target = nearestInRange();
  if (!target) { p.cd = 0.12; p.crit = false; return; }
  p.shotN += 1;
  let mult = 1;
  if (p.crit) { mult = 2; S.fx.push({ k: 'num', x: p.x, y: p.y - 14, t: 0, life: 0.6, txt: '¡Compás!', col: C.ember, big: true }); blip(1800, 0.09, 'sine', 0.05); }
  if (P.has('gatling')) mult *= 0.6;
  const big = p.crit, col = slotColor('basic');
  p.crit = false;
  const aim = t => { const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy) || 1; p.face = Math.atan2(dy, dx); return [dx / d, dy / d]; };
  const tracer = (x2, y2, w) => S.fx.push({ k: 'tracer', x1: p.x + Math.cos(p.face) * 14, y1: p.y + Math.sin(p.face) * 14, x2, y2, t: 0, life: big ? 0.16 : 0.09, col, w: w || (big ? 2 : 1) });
  const bullet = (t, m) => { const [ux, uy] = aim(t); tracer(t.x, t.y); shot(t, p.dmg * m, ux, uy, big, col); };
  blip(1250, 0.07, 'square', 0.035, -700);

  if (P.has('sniper')) {                 // atraviesa en línea; más daño cuanto más lejos
    const [ux, uy] = aim(target), len = rayClip(p.x, p.y, ux, uy, rng + 40);
    tracer(p.x + ux * len, p.y + uy * len, 3);
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const ex = e.x - p.x, ey = e.y - p.y, al = ex * ux + ey * uy;
      if (al < 0 || al > len + e.r || Math.abs(ex * uy - ey * ux) > 5 + e.r) continue;
      const far = clamp(al / rng, 0, 1);
      shot(e, p.dmg * mult * (0.5 + 2.5 * far), ux, uy, far > 0.6, col);
    }
    S.shake = Math.max(S.shake, 3.5);
  } else if (P.has('shotgun')) {         // abanico de perdigones
    const [ux0, uy0] = aim(target), base = Math.atan2(uy0, ux0);
    for (const off of [-0.34, -0.17, 0, 0.17, 0.34]) {
      const a = base + off, ux = Math.cos(a), uy = Math.sin(a); let bestE = null, ba = rayClip(p.x, p.y, ux, uy, rng + 20);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - p.x, ey = e.y - p.y, al = ex * ux + ey * uy;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * uy - ey * ux) <= e.r + 3) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * ba, y2: p.y + uy * ba, t: 0, life: 0.1, col });
      if (bestE) shot(bestE, p.dmg * mult * 0.6, ux, uy, false, col);
    }
    S.shake = Math.max(S.shake, 3);
  } else if (P.has('bayonet')) {         // estocada: te lanzas a través del objetivo
    const [ux, uy] = aim(target), d = dist(p, target);
    shot(target, p.dmg * mult * 1.8, ux, uy, true, col);
    lunge(Math.atan2(uy, ux), d + target.r + 22);
  } else if (P.has('grenade')) {         // granada en arco con explosión en área
    const tx = target.x, ty = target.y; aim(target);
    S.fx.push({ k: 'lob', x1: p.x, y1: p.y, x2: tx, y2: ty, t: 0, life: 0.32, col });
    S.timers.push({ t: 0.32, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: 36, t: 0, life: 0.22, col });
      blip(140, 0.12, 'sawtooth', 0.04, -60);
      for (const e of S.enemies.slice()) {
        if (!active(e)) continue;
        const dx = e.x - tx, dy = e.y - ty, dd = Math.hypot(dx, dy) || 1;
        if (dd <= 36 + e.r) shot(e, p.dmg * mult * 0.7, dx / dd, dy / dd, big, col);
      }
    } });
  } else if (P.has('burst')) {           // tres balas seguidas
    bullet(target, mult * 0.45);
    for (const d of [0.07, 0.14]) S.timers.push({ t: d, fn: () => {
      const t2 = active(target) ? target : nearestInRange();
      if (t2) { blip(1250, 0.05, 'square', 0.03, -700); bullet(t2, mult * 0.45); }
    } });
  } else bullet(target, mult);
}
// Estocada de la Bayoneta: un esquive corto que atraviesa al objetivo
function lunge(a, d) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.dodgeT = d / (p.speed * T.dodge.mult); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.dodgeFrom = { x: p.x, y: p.y }; p.dodgeHit = new Set(); p.isLunge = true; p.fly = false;
}

function startDodge(a, free) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.fly = lv('dragon_dodge') > 0;                                           // Vuelo: salto largo por encima de las columnas
  p.dodgeT = T.dodge.time * (p.fly ? 1.8 : 1); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.dodgeFrom = { x: p.x, y: p.y }; p.isLunge = false; p.dodgeHit = new Set();
  if (!free) { p.dodgeN -= 1; if (p.windup > 0) { p.windup = 0; p.cd = 0.1; } p.charging = false; p.charge = 0; }
  blip(420, 0.1, 'triangle', 0.04, 500);
  if (p.fly && fz('dive')) {                                                // fusión Picado: el salto busca al enemigo de delante
    let tg = null, bd = 190;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(p, e); if (d < bd && Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), a)) < 0.9) { bd = d; tg = e; } }
    if (tg) { p.dvx = (tg.x - p.x) / (bd || 1); p.dvy = (tg.y - p.y) / (bd || 1); p.dodgeT = clamp(bd / (p.speed * T.dodge.mult), 0.12, 0.5); p.inv = Math.max(p.inv, p.dodgeT + 0.06); }
  }
  if (lv('stone_dodge')) addCrystal(p.x, p.y);                              // Geoda
  const fd = lv('feast_dodge');
  if (fd && S.bites.length) {                                               // Sobremesa
    const eaten = S.bites.filter(b => !b.rot).slice(0, 8), n = eaten.length; S.bites = S.bites.filter(b => !eaten.includes(b));
    for (let i = 0; i < n; i++) { eat(eaten[i].hot); S.timers.push({ t: 0.05 + i * 0.07, fn: () => explode(S.p.x, S.p.y, 45, S.p.dmg * 0.8 * fd, { col: GODS.feast.color }) }); }
  }
}
function endDodge() {
  const p = S.p, vd = lv('venom_dodge'), dd = lv('dragon_dodge');
  if (!p.dodgeFrom) return;
  if (vd) S.zones.push({ x1: p.dodgeFrom.x, y1: p.dodgeFrom.y, x2: p.x, y2: p.y, life: 5, acc: 0.4, venom: vd, col: GODS.venom.color });   // Rastro
  if (p.fly && dd) { const f = p.fury; if (fz('dive')) explode(p.x, p.y, 52 + f * 0.4, p.dmg * (1.5 * dd + 3 * f / 100), { col: GODS.dragon.color, stun: 0.8, ember: Math.round(f / 10) }); else explode(p.x, p.y, 52, p.dmg * 1.5 * dd, { col: GODS.dragon.color }); }                                               // Vuelo
  if (S.plans.has('echo') && !p.isLunge) S.turrets.push({ x: p.dodgeFrom.x, y: p.dodgeFrom.y, life: 3, cd: 0.15 });                      // Rifle gemelo
  p.dodgeFrom = null; p.fly = false;
}
// Lo que pasa al atravesar a un enemigo con el esquive
function dashThrough(e) {
  const od = lv('orc_dodge'), p = S.p;
  if (od) { hit(e, p.dmg * od, p.dvx, p.dvy, true, GODS.orc.color); if (active(e)) { e.kx += p.dvx * 200; e.ky += p.dvy * 200; stun(e, 0.35); if (fz('avalanche') && !e.boss) { e.fling = e.champ ? 0.22 : 0.4; e.fvx = p.dvx * 430; e.fvy = p.dvy * 430; } } gainFury(15); }   // Embestida, y fusión Avalancha
}

// Lo que hace el cargado a cada enemigo que alcanza, sea con el rayo, el cono, el mortero o un Cristal
function chargePayoff(e) {
  const dc = lv('dragon_charge'), vc = lv('venom_charge'), fc = lv('feast_charge'), p = S.p;
  if (fz('rot')) { const t = e.ember + e.venom; if (t > 0) { if (t > e.ember) addEmber(e, t - e.ember); e.venom = Math.min(30, t); } }   // fusión Aliento podrido
  if (dc) {                                                                 // Aliento
    addEmber(e, 1 + dc);
    const st = e.ember;
    if (st > 0 && active(e)) { e.ember = 0; explode(e.x, e.y, 40, p.dmg * (0.35 + 0.1 * (dc - 1)) * st, { col: GODS.dragon.color, ember: 1 }); }
  }
  if (vc && active(e) && e.venom > 0) {                                     // Purga
    const st = e.venom; e.venom = Math.ceil(st / 2);
    S.zones.push({ x: e.x, y: e.y, r: 30, life: 5, acc: 0.4, venom: 1, col: GODS.venom.color });
    hit(e, p.dmg * 0.15 * vc * st, 0, 0, true, GODS.venom.color);
  }
  if (fc && active(e) && e.hp / e.maxHp < (e.boss ? 0 : e.champ ? 0.5 : 1) * (0.15 + 0.1 * fc)) {   // Trinchar
    e.carved = 2;
    S.fx.push({ k: 'num', x: e.x, y: e.y - e.r - 12, t: 0, life: 0.8, txt: '¡Trinchado!', col: GODS.feast.color, big: true });
    hit(e, e.hp + 1, 0, 0, true, GODS.feast.color);
  }
}

function fireCharged(am) {
  const p = S.p, ch = T.charge;
  const ratio = clamp(p.charge / ch.full, 0, 1);
  const dmg = p.dmg * (1.5 + (ch.dmgMult - 1.5) * ratio);
  const ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir), col = slotColor('charge');
  const sc = lv('stone_charge'), oc = lv('orc_charge');
  let refund = false;
  if (S.plans.has('mortar')) {           // proyectil en arco con área
    const tg = S.target && active(S.target) && am <= 0.35 ? S.target : null;
    const tx = clamp(tg ? tg.x : p.x + ux * 170, 0, T.room.w), ty = clamp(tg ? tg.y : p.y + uy * 170, 0, T.room.h);
    S.fx.push({ k: 'lob', x1: p.x, y1: p.y, x2: tx, y2: ty, t: 0, life: 0.3, col });
    S.timers.push({ t: 0.3, fn: () => { explode(tx, ty, 58, dmg * 0.8, { col, payoff: true }); S.shake = Math.max(S.shake, 7); } });
  } else if (lv('dragon_charge')) {      // Aliento: cono
    const R = 175, half = 0.5;
    S.fx.push({ k: 'cone', x: p.x, y: p.y, a: p.chargeDir, r: R, half, t: 0, life: 0.3, col: GODS.dragon.color });
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const d = dist(p, e);
      if (d > R + e.r || Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), p.chargeDir)) > half || blocked(p, e)) continue;
      hit(e, dmg, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), true, col);
      chargePayoff(e);
    }
  } else {                               // rayo que atraviesa
    const len = rayClip(p.x, p.y, ux, uy, ch.range);
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const ex = e.x - p.x, ey = e.y - p.y, along = ex * ux + ey * uy;
      if (along < 0 || along > len) continue;
      if (Math.abs(ex * uy - ey * ux) > ch.width + e.r) continue;
      hit(e, dmg, ux, uy, true, col);
      chargePayoff(e);
    }
    S.fx.push({ k: 'beam', x1: p.x + ux * 14, y1: p.y + uy * 14, x2: p.x + ux * len, y2: p.y + uy * len, t: 0, life: 0.22, w: 3 + 5 * ratio, col });
  }
  if (sc) for (const c of S.crystals) {  // Prisma: cada Cristal dispara su propio rayo, con los efectos del cargado
    let tg = null, td = 210;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(c, e); if (d < td && !blocked(c, e)) { td = d; tg = e; } }
    if (!tg) continue;
    S.fx.push({ k: 'beam', x1: c.x, y1: c.y, x2: tg.x, y2: tg.y, t: 0, life: 0.2, w: 2.5, col: GODS.stone.color });
    hit(tg, dmg * 0.4 * sc, (tg.x - c.x) / (td || 1), (tg.y - c.y) / (td || 1), true, GODS.stone.color);
    chargePayoff(tg);
  }
  if (oc) {                              // Grito de guerra: gasta la Furia
    const f = p.fury; p.fury = mastery('orc') ? 50 : 0;
    const R = 45 + f * 0.7;
    explode(p.x, p.y, R, p.dmg * (0.5 + 2 * oc * f / 100), { push: 220, stun: 0.4 + f / 100, col: GODS.orc.color });
    if (fz('warfeast')) {                                                   // fusión Festín de guerra
      let n = 0; const thr = 0.15 + 0.1 * lv('feast_charge');
      for (const e of S.enemies.slice()) if (active(e) && dist(p, e) < R * 1.3 + e.r && e.hp / e.maxHp < (e.boss ? 0 : e.champ ? 0.5 : 1) * thr) { e.carved = 2; hit(e, e.hp + 1, 0, 0, true, GODS.feast.color); n++; }
      if (n) { gainFury(25 * n); S.fx.push({ k: 'num', x: p.x, y: p.y - 18, t: 0, life: 0.9, txt: '¡Festín! ×' + n, col: GODS.feast.color, big: true }); }
      refund = n >= 2;
    }
  }
  let cd = ch.cd;
  p.cd = Math.max(p.cd, 0.25);
  if (S.plans.has('recoil')) { cd *= 0.65; startDodge(Math.atan2(-uy, -ux), true); }
  else { p.x -= ux * 6; p.y -= uy * 6; }
  p.chargeCdMax = p.chargeCd = cd;
  if (refund) p.chargeCd = 0;
  S.shake = Math.max(S.shake, 4 + 4 * ratio);
  blip(300, 0.3, 'sawtooth', 0.06, -220);
}

function hurtPlayer(dmg) {
  const p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  p.hp -= dmg; p.inv = 0.5; S.hurtFx = 0.35; S.shake = Math.max(S.shake, 6);
  gainFury(15);
  blip(110, 0.18, 'sawtooth', 0.07, -50);
  if (p.hp <= 0) {
    p.hp = 0;
    endRun(false);
    setMode('dead');
  }
}

// ───────────────────────── Actualización ─────────────────────────
function update(dt) {
  const p = S.p, P = T.player;
  S.t += dt;
  S.shake = Math.max(0, S.shake - dt * 22);
  S.hurtFx = Math.max(0, S.hurtFx - dt);
  S.noTarget = Math.max(0, S.noTarget - dt);
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  if (S.timers.length) { const due = []; for (const tm of S.timers) { tm.t -= dt; if (tm.t <= 0) due.push(tm); } S.timers = S.timers.filter(tm => tm.t > 0); for (const tm of due) tm.fn(); }

  // Oleadas
  S.waveT += dt;
  while (S.queue.length && S.queue[0].at <= S.waveT) spawn(S.queue.shift().type);
  if (!S.queue.length && !S.enemies.length) {
    S.waveClear += dt;
    if (S.waveClear > 0.7) { S.waveClear = 0; S.shots.length = 0; S.zones.length = 0; S.timers.length = 0; if (S.bossRoom) winRun(); else openPick(); return; }
  }

  // Temporizadores y recursos
  p.cd = Math.max(0, p.cd - dt);
  p.chargeCd = Math.max(0, p.chargeCd - dt); p.inv = Math.max(0, p.inv - dt); p.buffer = Math.max(0, p.buffer - dt);
  const ready = p.cd <= 0 && p.windup <= 0;
  if (ready && !p.wasReady) { p.readyT = S.t; blip(1900, 0.02, 'sine', 0.012); }
  p.wasReady = ready;
  p.furyT -= dt;
  const floor = mastery('orc') ? 50 : 0;
  if (p.furyT <= 0 && p.fury > floor) p.fury = Math.max(floor, p.fury - 8 * dt); else if (p.fury < floor) p.fury = floor;
  if (p.sated > 0 && !mastery('feast')) { p.satedT -= dt; if (p.satedT <= 0) { p.sated -= 1; p.satedT = 1.5; } }

  // Esquive (por cargas)
  const dMax = dodgeMax();
  if (p.dodgeN < dMax) { p.dodgeCd -= dt; if (p.dodgeCd <= 0) { p.dodgeN += 1; p.dodgeCd = T.dodge.cd; } } else p.dodgeCd = T.dodge.cd;
  if (I.dodgeP && p.dodgeN > 0 && p.dodgeT <= 0) startDodge(Math.hypot(I.mx, I.my) > 0.2 ? Math.atan2(I.my, I.mx) : p.face, false);

  // Objetivo
  if (I.clearP) S.lock = null;
  if (S.lock && (!active(S.lock) || dist(p, S.lock) - S.lock.r > rangeOf() * 1.2)) S.lock = null;
  const am = Math.hypot(I.ax, I.ay);
  if (am > 0.6 && !aimLatch && !p.charging) {
    aimLatch = true;
    const ang = Math.atan2(I.ay, I.ax); let bestE = null, bs = 1e9;
    for (const e of S.enemies) {
      if (!active(e)) continue;
      const d = dist(p, e);
      if (d - e.r > rangeOf() * 1.1) continue;
      const da = Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang));
      if (da > 0.75) continue;
      const score = da * 130 + d * 0.3;
      if (score < bs) { bs = score; bestE = e; }
    }
    if (bestE) { S.lock = bestE; blip(900, 0.04, 'triangle', 0.03); }
  }
  if (am < 0.3) aimLatch = false;
  const target = (S.lock && dist(p, S.lock) - S.lock.r <= rangeOf() && (S.plans.has('grenade') || !blocked(p, S.lock))) ? S.lock : nearestInRange();
  S.target = target;

  // Disparo cargado
  if (I.chg && !p.charging && p.chargeCd <= 0 && p.dodgeT <= 0 && p.windup <= 0) { p.charging = true; p.charge = 0; p.chargeDir = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face; }
  if (p.charging) {
    const before = p.charge; p.charge += dt;
    if (before < T.charge.full && p.charge >= T.charge.full) blip(1500, 0.06, 'sine', 0.04);
    if (am > 0.35) p.chargeDir = Math.atan2(I.ay, I.ax);
    else if (target) p.chargeDir = Math.atan2(target.y - p.y, target.x - p.x);
    p.face = p.chargeDir;
    if (!I.chg) { if (p.charge >= T.charge.min) fireCharged(am); p.charging = false; p.charge = 0; }
  }

  // Disparo básico: cada disparo es un gesto corto que te frena
  if (I.atkP) { if (p.cd > T.buffer) p.spoil = true; p.buffer = T.buffer; if (!target) S.noTarget = 0.25; }
  const want = p.buffer > 0 || I.atk;
  if (want && target && !p.charging && p.dodgeT <= 0 && p.windup <= 0 && p.cd <= 0) {
    const period = periodOf();
    p.crit = S.plans.has('tempo') && p.buffer > 0 && !p.spoil && S.t - p.readyT <= 0.13;   // Compás: pulsación justa
    p.spoil = false;
    p.windupTotal = p.windup = period * P.windupFrac * (S.plans.has('burst') ? 1.25 : 1);
    p.windupTarget = target; p.cd = period; p.buffer = 0;
    if (S.plans.has('gatling') && I.atk) p.spin = Math.min(1, p.spin + 0.1);
  }
  if (p.windup > 0) {
    const wt = p.windupTarget && active(p.windupTarget) ? p.windupTarget : target;
    if (wt) p.face = Math.atan2(wt.y - p.y, wt.x - p.x);
    p.windup -= dt;
    if (p.windup <= 0) { p.windup = 0; fireBasic(p.windupTarget); }
  }

  // Movimiento
  const free = has('o_berserk') && furyFull();                             // Berserker: sin frenazo
  let mult = 1;
  if (p.charging) mult = T.charge.slow;
  else if (p.windup > 0) mult = free ? 1 : P.windupSlow;
  else if (I.atk && target) mult = free ? 1 : S.plans.has('gatling') ? 0.15 : P.holdSlow;
  if (!I.atk) p.spin = Math.max(0, p.spin - dt * 1.6);
  if (p.dodgeT > 0) {
    p.dodgeT -= dt;
    p.x += p.dvx * p.speed * T.dodge.mult * dt; p.y += p.dvy * p.speed * T.dodge.mult * dt;
    if (Math.random() < 0.7) S.fx.push({ k: 'ghost', x: p.x, y: p.y, t: 0, life: 0.18 });
    for (const e of S.enemies.slice()) if (active(e) && !p.dodgeHit.has(e) && dist(p, e) < p.r + e.r + 9) { p.dodgeHit.add(e); dashThrough(e); }
    const sd = lv('stone_dodge');                                          // Geoda: reventar Cristales al atravesarlos
    if (sd) for (const c of S.crystals.slice()) if (dist(p, c) < 13 && !(p.dodgeFrom && dist(p.dodgeFrom, c) < 4)) { S.crystals.splice(S.crystals.indexOf(c), 1); explode(c.x, c.y, 42, p.dmg * 1.2 * sd, { col: GODS.stone.color }); }
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
    if (!p.fly) collide(p, p.r);
    if (p.dodgeT <= 0) { collide(p, p.r); endDodge(); }
  } else {
    p.x += I.mx * p.speed * mult * dt; p.y += I.my * p.speed * mult * dt;
    if (Math.hypot(I.mx, I.my) > 0.2 && p.windup <= 0 && !p.charging) p.face = Math.atan2(I.my, I.mx);
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
    collide(p, p.r);
  }

  // Rifles gemelos
  for (const tu of S.turrets) {
    tu.life -= dt; tu.cd -= dt;
    if (tu.cd > 0) continue;
    let bestE = null, bd = rangeOf();
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(tu, e) - e.r; if (d < bd && !blocked(tu, e)) { bd = d; bestE = e; } }
    if (!bestE) { tu.cd = 0.1; continue; }
    const dx = bestE.x - tu.x, dy = bestE.y - tu.y, d = Math.hypot(dx, dy) || 1, col = slotColor('basic');
    S.fx.push({ k: 'tracer', x1: tu.x, y1: tu.y, x2: bestE.x, y2: bestE.y, t: 0, life: 0.09, col });
    onHit(bestE, p.dmg * 0.5, dx / d, dy / d, false, col, 'turret');
    tu.cd = periodOf();
  }
  S.turrets = S.turrets.filter(tu => tu.life > 0);

  // Cristales y Bocados
  const obs = fz('obsidian'), tox = fz('toxgeode'), tab = fz('table'), thr = 0.15 + 0.1 * lv('feast_charge');
  for (const c of S.crystals) {
    c.life -= dt; c.acc = (c.acc || 0) + dt;
    if (c.acc < 0.5 || !(obs || tox || tab)) continue;
    c.acc = 0;
    let fed = false;
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const d = dist(c, e) - e.r;
      if (obs && d < 42) addEmber(e, 1);                                   // fusión Bala de obsidiana
      if (tox && d < 42) { addVenom(e, 2); fed = true; }                   // fusión Geoda tóxica
      if (tab && d < 60 && active(e) && e.hp / e.maxHp < (e.boss ? 0 : e.champ ? 0.5 : 1) * thr) {   // fusión Mesa puesta
        S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: e.x, y2: e.y, t: 0, life: 0.15, col: GODS.feast.color, w: 1.5 });
        e.carved = 1; hit(e, e.hp + 1, 0, 0, true, GODS.feast.color);
      }
    }
    if (tox && fed) c.life += 0.5;
  }
  if (obs) for (const c of S.crystals) if (c.life <= 0) explode(c.x, c.y, 38, p.dmg, { col: GODS.dragon.color, ember: 2 });
  S.crystals = S.crystals.filter(c => c.life > 0);
  const bait = fz('bait');
  for (const b of S.bites) {
    b.age += dt;
    if (bait && b.age > 3) b.rot = true;                                   // fusión Cebo
    if (b.rot) {
      for (const e of S.enemies) if (active(e) && dist(b, e) < e.r + 8) { b.life = 0; explode(b.x, b.y, 42, 0, { venom: 8, stun: 0.6, col: GODS.venom.color, soft: true }); break; }
      continue;
    }
    b.life -= dt;
    const d = dist(p, b);
    if (d < 70 && d > 0.1) { b.x += (p.x - b.x) / d * 170 * dt; b.y += (p.y - b.y) / d * 170 * dt; }
    if (d < 12) { b.life = 0; eat(b.hot); }
  }
  S.bites = S.bites.filter(b => b.life > 0);

  // Enemigos
  const boil = fz('boil'), venStep = (mastery('venom') ? 0.25 : 0.5) * (boil && furyFull() ? 0.5 : 1), embMul = mastery('dragon') ? 1.5 : 1;
  for (const e of S.enemies) {
    if (e.hp <= 0) continue;
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    e.flash = Math.max(0, e.flash - dt);
    e.x += e.kx * dt; e.y += e.ky * dt;
    const damp = 1 - Math.min(1, dt * 12); e.kx *= damp; e.ky *= damp;
    e.autoCd = Math.max(0, e.autoCd - dt);
    if (e.fling > 0) {                   // fusión Avalancha: enemigo lanzado
      e.fling -= dt; e.x += e.fvx * dt; e.y += e.fvy * dt;
      let bump = e.x < e.r + 3 || e.y < e.r + 3 || e.x > T.room.w - e.r - 3 || e.y > T.room.h - e.r - 3;
      for (const c of S.pillars) if (Math.hypot(e.x - c.x, e.y - c.y) < c.r + e.r + 1) bump = true;
      for (const c of S.crystals) if (Math.hypot(e.x - c.x, e.y - c.y) < e.r + 7) { bump = true; c.life = 0; }
      for (const o of S.enemies) if (o !== e && active(o) && dist(e, o) < e.r + o.r) bump = true;
      if (bump) { e.fling = 0; explode(e.x, e.y, 50, p.dmg * 3, { stun: 0.6, col: GODS.stone.color }); gainFury(10); }
      continue;
    }
    if (e.ember > 0) {
      e.emberT -= dt; e.emberAcc += dt;
      if (e.emberAcc >= 0.5) { e.emberAcc -= 0.5; dot(e, e.ember * p.dmg * 0.12 * embMul, GODS.dragon.color); }
      if (e.emberT <= 0) e.ember = 0;
      if (e.hp <= 0) continue;
    }
    if (e.venom > 0) {
      e.venAcc += dt;
      if (e.venAcc >= venStep) { e.venAcc -= venStep; dot(e, e.venom * p.dmg * 0.035, GODS.venom.color); if (boil) gainFury(1); }
      if (e.hp <= 0) continue;
    }
    if (e.stun > 0) { e.stun -= dt; continue; }
    const sp = e.speed;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (e.lungeWind <= 0 && e.lungeT <= 0) e.dir = Math.atan2(dy, dx);
    if (e.boss) { bossAI(e, dt, d, ux, uy); continue; }
    if (e.type.ranged) {
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) { S.shots.push({ x: e.x, y: e.y, vx: ux * 125, vy: uy * 125, r: 4, dmg: e.dmg, life: 3.5 }); e.cool = 2.4; blip(700, 0.08, 'triangle', 0.025, -300); }
      } else {
        e.cool -= dt;
        const mv = d > 195 ? 1 : d < 120 ? -1 : 0;
        e.x += ux * mv * sp * dt; e.y += uy * mv * sp * dt;
        if (e.cool <= 0 && d < 270) e.cast = 0.55;
      }
    } else if (e.lungeT > 0) {          // embestida del elegido
      e.lungeT -= dt; e.x += e.lvx * dt; e.y += e.lvy * dt;
      if (!e.lungeHit && d < e.r + p.r + 4) { e.lungeHit = true; hurtPlayer(e.dmg); }
      if (e.lungeT <= 0) e.rec = 0.7;
    } else if (e.lungeWind > 0) {
      e.lungeWind -= dt;
      if (e.lungeWind <= 0) { e.lungeT = 0.3; e.lungeHit = false; }
    } else if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) { if (d < e.r + p.r + e.type.reach) hurtPlayer(e.dmg); e.rec = 0.55; }
    } else if (e.rec > 0) e.rec -= dt;
    else if (d < e.r + p.r + 3) e.wind = e.type.wind;
    else {
      if (e.champ) {
        e.lungeCd -= dt;
        if (e.lungeCd <= 0 && d < 150 && d > 45) { e.lungeCd = 3.5; e.lungeWind = 0.5; e.lvx = ux * 300; e.lvy = uy * 300; continue; }
      }
      e.x += ux * sp * dt; e.y += uy * sp * dt;
    }
  }
  // Zonas en el suelo: fuego o veneno
  for (const z of S.zones) {
    z.life -= dt; z.acc += dt;
    if (z.acc < 0.4) continue;
    z.acc = 0;
    const touch = e => { if (z.ember) addEmber(e, z.ember); if (z.venom) addVenom(e, z.venom); };
    if (z.r) { for (const e of S.enemies) if (active(e) && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.r) touch(e); continue; }
    const zx = z.x2 - z.x1, zy = z.y2 - z.y1, L = Math.hypot(zx, zy) || 1, ux = zx / L, uy = zy / L;
    for (const e of S.enemies) {
      if (!active(e)) continue;
      const ex = e.x - z.x1, ey = e.y - z.y1, al = ex * ux + ey * uy;
      if (al >= 0 && al <= L && Math.abs(ex * uy - ey * ux) <= 10 + e.r) touch(e);
    }
  }
  S.zones = S.zones.filter(z => z.life > 0);
  // Separación entre enemigos y columnas
  for (let i = 0; i < S.enemies.length; i++) for (let j = i + 1; j < S.enemies.length; j++) {
    const a = S.enemies[i], b = S.enemies[j];
    if (a.spawn > 0 || b.spawn > 0) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 1;
    if (d < min) { const push = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
  }
  for (const e of S.enemies) {
    e.x = clamp(e.x, e.r + 2, T.room.w - e.r - 2); e.y = clamp(e.y, e.r + 2, T.room.h - e.r - 2);
    const c = collide(e, e.r);
    if (c && active(e) && e.stun <= 0) {   // rodear la columna en vez de quedarse pegado
      const nx = e.x - c.x, ny = e.y - c.y, nl = Math.hypot(nx, ny) || 1, tx = -ny / nl, ty = nx / nl;
      const dotp = tx * (p.x - e.x) + ty * (p.y - e.y), sg = Math.abs(dotp) > 8 ? Math.sign(dotp) : e.side;
      e.x += tx * sg * e.speed * dt * 0.8; e.y += ty * sg * e.speed * dt * 0.8;
    }
  }
  S.enemies = S.enemies.filter(e => e.hp > 0);

  // Proyectiles enemigos
  for (const s of S.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.x < 0 || s.y < 0 || s.x > T.room.w || s.y > T.room.h) s.life = 0;
    for (const c of S.pillars) if (Math.hypot(s.x - c.x, s.y - c.y) < c.r + s.r) s.life = 0;
    if (s.life > 0 && Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r) { if (p.inv <= 0) { hurtPlayer(s.dmg); s.life = 0; } }
  }
  S.shots = S.shots.filter(s => s.life > 0);

  // Efectos
  for (const f of S.fx) { f.t += dt; if (f.k === 'spark') { f.x += f.vx * dt; f.y += f.vy * dt; } if (f.k === 'num') f.y -= 22 * dt; }
  S.fx = S.fx.filter(f => f.t < f.life);
  if (S.fx.length > 500) S.fx.splice(0, S.fx.length - 500);
}

// ───────────────────────── Elección entre salas ─────────────────────────
let pickHead = { eyebrow: '', title: '' }, pickQueue = [], bookFrom = 'pause', afterPicks = null;
const rollRar = () => { const r = Math.random(); return r < 0.6 ? 0 : r < 0.88 ? 1 : 2; };
// Carta de una pieza de ranura. La rareza con la que sale decide a qué nivel entra (o cuánto sube).
function pieceCard(pc) {
  const a = S.build[pc.slot], it = a.items.find(x => x.id === pc.id), god = pc.god, rar = rollRar();
  const o = { tag: SLOTS[pc.slot], rar, name: pc.name, color: GODS[god].color, note: '', god };
  const have = godCount(god), M = MASTERY[god], newAction = !a.items.some(x => godOf(x.id) === god);
  const prog = !newAction || have >= 3 ? '' : have + 1 >= 3 ? 'Completa la maestría ' + M.name : M.name + ': ' + (have + 1) + '/3';
  if (it) {                                       // ya la llevas: sube de nivel
    if (it.lvl >= 5) return null;
    const nl = Math.min(5, it.lvl + 1 + rar), eff = nl + (a.fused && a.fused.includes(pc.id) ? 1 : 0);
    o.name += ' ' + ROMAN[eff]; o.desc = pc.desc(eff);
    o.note = nl - it.lvl > 1 ? 'Sube ' + (nl - it.lvl) + ' niveles' : 'Sube un nivel';
    o.apply = () => { it.lvl = nl; };
    return o;
  }
  const lvl = 1 + rar, add = () => a.items.push({ id: pc.id, lvl });
  const free = a.items.filter(x => !(a.fused && a.fused.includes(x.id)));          // piezas sueltas en esa acción
  const rec = !a.fused && FUSIONS.find(f => f.slot === pc.slot && ((f.a === pc.id && free.some(x => x.id === f.b)) || (f.b === pc.id && free.some(x => x.id === f.a))));
  o.name += lvl > 1 ? ' ' + ROMAN[lvl] : ''; o.desc = pc.desc(lvl);
  if (a.items.length - (a.fused ? 1 : 0) >= 2) {   // las dos ranuras ocupadas: sustituye a la suelta más reciente
    const out = free[free.length - 1];
    o.note = 'Sustituye a ' + PIECE[out.id].name;
    o.apply = () => { a.items.splice(a.items.indexOf(out), 1); add(); };
  } else {
    o.note = [rec ? 'Receta: con tu ' + PIECE[rec.a === pc.id ? rec.b : rec.a].name + ' podrás forjar «' + rec.name + '»' : free.length ? 'Va a la segunda ranura' : '', prog].filter(Boolean).join(' · ');
    o.apply = add;
  }
  return o;
}
// Fusiones que ya puedes forjar: llevas las dos piezas sueltas en la misma acción
function fusionOptions() {
  const out = [];
  for (const f of FUSIONS) {
    const a = S.build[f.slot];
    if (a.fused || !a.items.some(x => x.id === f.a) || !a.items.some(x => x.id === f.b)) continue;
    out.push({ tag: 'Fusión · ' + SLOTS[f.slot], rar: 3, name: f.name, color: C.ink, desc: `Fundes ${PIECE[f.a].name} y ${PIECE[f.b].name} en una habilidad nueva. ${f.desc}`, note: 'Las dos piezas siguen actuando, suben un nivel y dejan libre una ranura', apply: () => { a.fused = [f.a, f.b]; S.fx.push({ k: 'num', x: S.p.x, y: S.p.y - 20, t: 0, life: 2.2, txt: '«' + f.name + '»', col: C.ink, big: true }); } });
  }
  if (out.length) out.push({ tag: 'Yunque', name: 'Dejarlas como están', color: C.dim, desc: 'No fundes nada ahora. Podrás hacerlo al acabar otra sala.', note: '', apply: () => {} });
  return out;
}
const techOk = t => !S.techs.has(t.id) && godCount(t.god) >= 1 && (t.req || []).every(id => lv(id) > 0);
const techNeeds = t => ((t.req || []).length ? t.req.map(id => PIECE[id].name).join(' y ') : 'cualquier pieza de esta deidad');
function pieceOptions(god) {
  const cands = [];
  for (const pc of PIECES.filter(x => x.god === god)) { const c = pieceCard(pc); if (c) cands.push([1, c]); }
  for (const t of TECHS.filter(x => x.god === god && techOk(x)))
    cands.push([[0, 0.9, 0.6, 0.4][t.rar], { tag: 'Técnica', rar: t.rar, name: t.name, color: GODS[god].color, desc: t.desc, note: 'No ocupa ranura', god, apply: () => { S.techs.add(t.id); } }]);
  // sorteo ponderado: lo raro sale menos
  return cands.map(([w, c]) => [Math.pow(Math.random(), 1 / w), c]).sort((x, y) => y[0] - x[0]).slice(0, 3).map(x => x[1]);
}
function planOptions() {
  const hasForm = PLANS.some(x => x.form && S.plans.has(x.id));
  return PLANS.filter(x => !S.plans.has(x.id) && !(x.form && hasForm)).sort(() => Math.random() - 0.5).slice(0, 3)
    .map(x => ({ tag: 'Plano', name: x.name, desc: x.desc, note: x.form ? 'Cambia el disparo básico' : '', color: C.ink, apply: () => { S.plans.add(x.id); } }));
}
function statOptions() {
  return UPGRADES.slice().sort(() => Math.random() - 0.5).slice(0, 3)
    .map(u => ({ tag: 'Ajuste', name: u.name, desc: u.desc, note: '', color: C.energy, apply: () => u.apply(S.p) }));
}
const statScreen = () => ({ eyebrow: 'Yunque', title: 'Afina el rifle', opts: statOptions() });
// Puertas: eliges a qué deidad le robas en la siguiente sala
function doorScreen() {
  const gods = Object.keys(GODS).sort(() => Math.random() - 0.5).slice(0, 3);
  return { eyebrow: 'Siguiente sala', title: '¿A quién le robas ahora?', opts: gods.map(g => {
    const n = godCount(g);
    return { tag: GODS[g].theme, name: GODS[g].title, desc: `Su elegido guarda la siguiente sala con el ${GODS[g].weapon}. ${GODS[g].key}`, note: `Llevas piezas suyas en ${n} de 4 acciones · ${MASTERY[g].name}: ${Math.min(n, 3)}/3`, color: GODS[g].color, apply: () => { S.nextGod = g; } };
  }) };
}
function advancePick() {
  while (pickQueue.length) {
    const scr = pickQueue.shift()();
    if (!scr || !scr.opts.length) continue;
    pickHead = { eyebrow: scr.eyebrow, title: scr.title }; pickOpts = scr.opts; pickSel = scr.opts.length > 2 ? 1 : 0;
    setMode('pick'); return;
  }
  if (afterPicks) { const f = afterPicks; afterPicks = null; f(); return; }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}
function openPick() {
  S.p.hp = Math.min(S.p.maxHp, S.p.hp + 15);
  pickQueue = [];
  const n = S.wave, god = S.drop ? S.drop.god : null;
  if (god) pickQueue.push(() => { const o = pieceOptions(god); return o.length ? { eyebrow: 'Sala ' + n + ' de ' + ROOMS + ' · ' + GODS[god].title, title: 'Desmontas: ' + GODS[god].weapon, opts: o } : statScreen(); });
  if (n % 3 === 1) pickQueue.push(() => ({ eyebrow: 'Plano de reforja', title: 'Cambia cómo funciona el rifle', opts: planOptions() }));
  else if (n % 2 === 0) pickQueue.push(statScreen);
  pickQueue.push(() => { const o = fusionOptions(); return o.length ? { eyebrow: 'Yunque', title: 'Puedes forjar una fusión', opts: o } : null; });
  if (n < ROOMS) pickQueue.push(doorScreen);
  advancePick();
}
function choosePick(i) {
  if (S.mode !== 'pick' || modeT < 0.45 || !pickOpts[i]) return;
  const before = Object.keys(GODS).filter(mastery), o = pickOpts[i];
  o.apply(); S.buildV += 1;
  blip(660, 0.12, 'triangle', 0.05, 500);
  if (o.god) say(o.god, 'take');
  for (const g of Object.keys(GODS)) if (mastery(g) && !before.includes(g)) { say(g, 'master'); S.fx.push({ k: 'num', x: S.p.x, y: S.p.y - 20, t: 0, life: 2.2, txt: '¡' + MASTERY[g].name + '!', col: GODS[g].color, big: true }); blip(520, 0.5, 'triangle', 0.06, 900); }
  advancePick();
}
function buildHtml(full) {
  const rows = [];
  const row = (label, color, name, sub) => rows.push(`<li><em style="color:${color}">${label}</em><b>${name}</b>${sub ? `<span>${sub}</span>` : ''}</li>`);
  const nm = it => PIECE[it.id].name + ' ' + ROMAN[lv(it.id)];
  for (const k of SLOT_KEYS) {
    const a = S.build[k];
    if (!a.items.length) { if (full) rows.push(`<li><em>${SLOTS[k]}</em><span>Dos ranuras libres</span></li>`); continue; }
    if (a.fused) {
      const fi = a.fused.map(id => a.items.find(x => x.id === id));
      const F = fusionOf(k);
      row(SLOTS[k], C.ink, '«' + (F ? F.name : 'Fusión') + '»', full ? (F ? F.desc + ' ' : '') + fi.map(it => PIECE[it.id].name + ': ' + PIECE[it.id].desc(lv(it.id))).join(' ') : fi.map(nm).join(' + '));
    }
    for (const it of a.items) if (!a.fused || !a.fused.includes(it.id)) row(SLOTS[k], GODS[godOf(it.id)].color, nm(it), full ? PIECE[it.id].desc(lv(it.id)) : '');
  }
  for (const g of Object.keys(GODS)) if (mastery(g)) row('Maestría', GODS[g].color, MASTERY[g].name, full ? MASTERY[g].desc : '');
  const techs = TECHS.filter(t => S.techs.has(t.id)), plans = PLANS.filter(x => S.plans.has(x.id));
  if (full) { for (const t of techs) row('Técnica', RAR[t.rar].color, t.name, t.desc); for (const x of plans) row('Plano', C.ink, x.name, x.desc); }
  else { if (techs.length) row('Técnicas', C.dim, techs.map(t => t.name).join(', ')); if (plans.length) row('Planos', C.dim, plans.map(x => x.name).join(', ')); }
  return rows.join('');
}
// Recetario: todo lo que se le puede robar a cada deidad
function bookHtml() {
  let h = `<p class="eyebrow">Recetario del herrero</p><h1>Lo que se les puede robar</h1><p class="fine">En blanco, lo que ya llevas. Cada acción tiene dos ranuras. Ciertas parejas de piezas se funden en una habilidad nueva. Las piezas se enganchan a balas, explosiones, esquives y bajas, así que unas cambian a otras.</p><div class="book">`;
  for (const g of Object.keys(GODS)) {
    const n = godCount(g), G = GODS[g];
    h += `<section><h2 style="color:${G.color}">${G.title}</h2><p class="fine">${G.theme}. ${G.key}</p><ul class="build full">` +
      PIECES.filter(x => x.god === g).map(pc => { const l = lv(pc.id); return `<li class="${l ? 'own' : ''}"><em>${SLOTS[pc.slot]}</em><b>${pc.name}${l ? ' ' + ROMAN[l] : ''}</b><span>${pc.desc(Math.max(1, l))}</span></li>`; }).join('') +
      TECHS.filter(t => t.god === g).map(t => `<li class="${S.techs.has(t.id) ? 'own' : ''}"><em style="color:${RAR[t.rar].color}">${RAR[t.rar].name}</em><b>${t.name}</b><span>${t.desc} Pide: ${techNeeds(t)}.</span></li>`).join('') +
      `<li class="${n >= 3 ? 'own' : ''}"><em style="color:${G.color}">Maestría</em><b>${MASTERY[g].name} · ${Math.min(n, 3)}/3</b><span>Lleva piezas suyas en 3 acciones distintas. ${MASTERY[g].desc}</span></li></ul></section>`;
  }
  h += `<section><h2>Fusiones</h2><p class="fine">Lleva las dos piezas en la misma acción y fúndelas en el yunque al acabar una sala.</p><ul class="build full">` +
    FUSIONS.map(f => `<li class="${fz(f.id) ? 'own' : ''}"><em>${SLOTS[f.slot]}</em><b>${f.name}</b><span>${PIECE[f.a].name} + ${PIECE[f.b].name}. ${f.desc}</span></li>`).join('') + `</ul></section>`;
  h += `<section><h2>Planos</h2><ul class="build full">` + PLANS.map(x => `<li class="${S.plans.has(x.id) ? 'own' : ''}"><em>Plano</em><b>${x.name}</b><span>${x.desc}</span></li>`).join('') + `</ul></section>`;
  return h + `</div><button id="ovBtn" class="primary">Volver</button>`;
}
function openBook() { bookFrom = S.mode; S.mode = 'book'; modeT = 0; renderOverlay(); ov.scrollTop = 0; }
function closeBook() { S.mode = bookFrom; modeT = 0; renderOverlay(); }

// ───────────────────────── Interfaz (DOM) ─────────────────────────
const ov = $('overlay'), ovBody = $('ovBody');
const HINTS = {
  pad: 'Stick izq. mover · A o RT disparar · B o RB esquivar · X o LT cargar · Stick der. cambiar objetivo · Start pausa',
  kb: 'WASD mover · Espacio disparar · Shift esquivar · E cargar · Clic en un enemigo para fijarlo · Esc pausa',
  touch: 'Toca un enemigo para fijarlo como objetivo',
  none: 'Pulsa un botón del mando, una tecla o la pantalla',
};

function renderOverlay() {
  const m = S.mode;
  ov.hidden = m === 'play';
  if (m === 'play') { ovBody.innerHTML = ''; return; }
  let h = '';
  if (m === 'title') {
    h = `<p class="eyebrow">Prototipo de combate</p><h1>Sala de Kiteo</h1>
      <p class="lead">Eres un herrero con un rifle de energía. Cada disparo te frena un instante: dispara, da un paso, dispara. Si pulsas a ritmo te mueves a toda velocidad entre disparos. Si mantienes pulsado, disparas igual pero andando despacio.</p>
      <p class="lead">No tienes dios. Cada sala la guarda el elegido de una deidad, con un arma bendecida: lo matas, la desmontas y te quedas con su técnica. Las deidades miran y opinan. Al acabar la sala eliges a quién le robas después, y el recetario enseña todo lo que se les puede quitar. Son seis salas y, al final, el Guardián. Cuando mueres vuelves a la forja con fragmentos para mejorar para siempre.</p>
      <dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo o apuntar el cargado</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl>
      <button id="ovBtn" class="primary">Empezar</button>
      <p class="fine">Con mando: pulsa cualquier botón para que el navegador lo detecte, y después A. En el móvil, juega en horizontal.</p>`;
  } else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · sala ${S.wave}</p><h1>Tu rifle</h1><ul class="build full">${buildHtml(true)}</ul><div class="btns"><button id="ovBtn" class="primary">Seguir</button><button id="bookBtn" class="ghost">Recetario</button></div>`;
  } else if (m === 'book') {
    h = bookHtml();
  } else if (m === 'dead') {
    h = `<p class="eyebrow">Has muerto</p><h1>Vuelves atrás, recordándolo todo</h1>
      <p class="lead">${S.bossRoom ? 'Caíste ante el Guardián' : 'Llegaste a la sala ' + S.wave + ' de ' + ROOMS} con ${S.kills} bajas. Te llevas <b>${S.gained}</b> fragmentos a la forja.</p>
      <button id="ovBtn" class="primary">A la forja</button>`;
  } else if (m === 'forge') {
    h = forgeHtml();
  } else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1><div class="cards">` +
      pickOpts.map((u, i) => `<button class="card${i === pickSel ? ' sel' : ''}" data-i="${i}" id="card${i}" style="--fam:${u.color}"><em>${u.tag}${u.rar ? `<i style="color:${RAR[u.rar].color}"> · ${RAR[u.rar].name}</i>` : ''}</em><strong>${u.name}</strong><span>${u.desc}</span>${u.note ? `<small>${u.note}</small>` : ''}</button>`).join('') +
      `</div><div class="btns"><button id="bookBtn" class="ghost">Recetario</button><p class="fine">Izquierda y derecha para elegir, disparar para confirmar. El botón de cargar abre el recetario.</p></div>`;
  }
  ovBody.innerHTML = h;
  ovBody.classList.toggle('wide', m === 'book' || m === 'forge');
  if (m === 'forge') bindForge();
  const bk = $('bookBtn');
  if (bk) bk.addEventListener('click', () => { audioInit(); openBook(); });
  const b = $('ovBtn');
  if (b) b.addEventListener('click', () => { audioInit(); primaryAction(true); });
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
function primaryAction(force) {
  if (S.mode === 'title') openForge();
  else if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'book') closeBook();
  else if (S.mode === 'dead' && (force || modeT > 0.8)) openForge();
}

$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').addEventListener('click', () => { muted = !muted; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); });

let hudKey = '';
function renderHud() {
  const p = S.p;
  const dev = padBlocked ? 'Mando bloqueado en esta vista' : padName ? 'Mando conectado' : lastDev === 'touch' ? 'Táctil' : lastDev === 'kb' ? 'Teclado' : 'Mando no detectado';
  const left = S.enemies.length + S.queue.length;
  const bo = S.enemies.find(e => e.boss && e.spawn <= 0);
  const key = [Math.ceil(p.hp), p.maxHp, S.wave, left, dev, lastDev, periodOf().toFixed(3), Math.round(p.dmg), Math.round(rangeOf()), S.mode, S.buildV, Math.round(p.fury / 4), p.sated, p.fireAmmo, bo ? Math.ceil(bo.hp / 8) : -1].join('|');
  if (key === hudKey) return; hudKey = key;
  $('hpFill').style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  $('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp;
  $('wave').textContent = !S.wave ? '' : S.bossRoom ? 'El Guardián' : 'Sala ' + S.wave + ' de ' + ROOMS + ' · quedan ' + left;
  $('boss').hidden = !bo || S.mode !== 'play';
  if (bo) $('bossFill').style.width = clamp(bo.hp / bo.maxHp * 100, 0, 100) + '%';
  $('build').innerHTML = buildHtml(false);
  $('res').textContent = [godCount('orc') ? 'Furia ' + Math.round(p.fury) : '', p.sated ? 'Saciedad ' + p.sated : '', p.fireAmmo ? 'Balas de fuego ' + p.fireAmmo : ''].filter(Boolean).join(' · ');
  $('stats').textContent = S.wave ? (1 / periodOf()).toFixed(2) + ' disparos/s · ' + Math.round(p.dmg) + ' daño · ' + Math.round(rangeOf()) + ' alcance' : '';
  $('dev').textContent = dev;
  $('hint').textContent = HINTS[lastDev] || HINTS.none;
  $('touch').hidden = lastDev !== 'touch';
}

// ───────────────────────── Dibujo ─────────────────────────
function resize() {
  const w = cv.clientWidth || 1, h = cv.clientHeight || 1, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === view.cssW && h === view.cssH && dpr === view.dpr) return;
  view.cssW = w; view.cssH = h; view.dpr = dpr;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  view.s = Math.sqrt(cv.width * cv.height / T.viewArea);
  view.w = cv.width / view.s; view.h = cv.height / view.s;
}

function shapePath(shape, x, y, r, dir) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
  else if (shape === 'diamond') { ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.25); ctx.lineTo(x - r, y); ctx.closePath(); }
  else { for (let i = 0; i < 3; i++) { const a = dir + i * Math.PI * 2 / 3; const rr = i === 0 ? r * 1.6 : r * 1.1; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
}
const FONT = '"Pixelify Sans", ui-monospace, monospace';

function render() {
  sysTick();
  const p = S.p, s = view.s, R = T.room;
  cam.x = view.w >= R.w + 40 ? (R.w - view.w) / 2 : clamp(p.x - view.w / 2, -20, R.w - view.w + 20);
  cam.y = view.h >= R.h + 40 ? (R.h - view.h) / 2 : clamp(p.y - view.h / 2, -20, R.h - view.h + 20);
  const shx = (Math.random() - 0.5) * S.shake, shy = (Math.random() - 0.5) * S.shake;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = C.wall; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(s, 0, 0, s, -(cam.x + shx) * s, -(cam.y + shy) * s);

  // Suelo en damero (da referencia de movimiento)
  ctx.fillStyle = C.floor; ctx.fillRect(0, 0, R.w, R.h);
  const ts = 40; ctx.fillStyle = C.tile;
  const x0 = Math.max(0, Math.floor(cam.x / ts)), x1 = Math.min(Math.ceil(R.w / ts), Math.ceil((cam.x + view.w) / ts) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / ts)), y1 = Math.min(Math.ceil(R.h / ts), Math.ceil((cam.y + view.h) / ts) + 1);
  for (let ty = y0; ty < y1; ty++) for (let tx = x0; tx < x1; tx++) if ((tx + ty) & 1) ctx.fillRect(tx * ts, ty * ts, Math.min(ts, R.w - tx * ts), Math.min(ts, R.h - ty * ts));
  ctx.strokeStyle = C.edge; ctx.lineWidth = 3; ctx.strokeRect(0, 0, R.w, R.h);

  if (S.mode === 'title') return;

  // Alcance
  ctx.beginPath(); ctx.arc(p.x, p.y, rangeOf(), 0, Math.PI * 2);
  ctx.strokeStyle = C.energy; ctx.globalAlpha = S.noTarget > 0 ? 0.55 : 0.13; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

  // Previsualización del disparo cargado: cono, o rayo cortado por las columnas
  if (p.charging) {
    const ratio = clamp(p.charge / T.charge.full, 0, 1), ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir), ok = p.charge >= T.charge.min;
    if (lv('dragon_charge') && !S.plans.has('mortar')) {
      ctx.fillStyle = GODS.dragon.color; ctx.globalAlpha = ok ? 0.1 + 0.18 * ratio : 0.05;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, 175, p.chargeDir - 0.5, p.chargeDir + 0.5); ctx.closePath(); ctx.fill();
    } else {
      const cl = S.plans.has('mortar') ? 170 : rayClip(p.x, p.y, ux, uy, T.charge.range);
      ctx.strokeStyle = C.energy; ctx.globalAlpha = ok ? 0.18 + 0.3 * ratio : 0.08; ctx.lineWidth = 2 + ratio * T.charge.width * 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + ux * cl, p.y + uy * cl); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Zonas en el suelo
  for (const z of S.zones) {
    const a = Math.min(1, z.life);
    if (z.r) { ctx.fillStyle = z.col; ctx.globalAlpha = 0.2 * a + 0.04 * Math.sin(S.t * 14); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.strokeStyle = z.col; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.22 * a; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
    ctx.globalAlpha = 0.5 * a; ctx.lineWidth = 5 + Math.sin(S.t * 14) * 1.5; ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
  }
  // Cristales, Bocados y arma caída
  for (const c of S.crystals) {
    const r = 5, a = Math.min(1, c.life);
    ctx.fillStyle = GODS.stone.color; ctx.globalAlpha = 0.25 * a; ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(c.x, c.y - r * 1.6); ctx.lineTo(c.x + r, c.y); ctx.lineTo(c.x, c.y + r * 1.1); ctx.lineTo(c.x - r, c.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8; ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const b of S.bites) {
    const bob = Math.sin(S.t * 6 + b.x) * 1.2;
    ctx.fillStyle = b.rot ? GODS.venom.color : b.hot ? GODS.dragon.color : GODS.feast.color; ctx.globalAlpha = Math.min(1, b.life); ctx.beginPath(); ctx.arc(b.x, b.y + (b.rot ? 0 : bob), b.rot ? 4.4 : 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.wall; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (S.drop) {
    const d = S.drop, r = 6 + Math.sin(S.t * 6);
    ctx.fillStyle = GODS[d.god].color; ctx.beginPath(); ctx.moveTo(d.x, d.y - r * 1.4); ctx.lineTo(d.x + r, d.y); ctx.lineTo(d.x, d.y + r * 1.4); ctx.lineTo(d.x - r, d.y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke();
  }

  // Columnas y rifles gemelos
  for (const c of S.pillars) {
    ctx.fillStyle = '#0b0d13'; ctx.beginPath(); ctx.arc(c.x + 2, c.y + 4, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b3245'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.edge; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#394259'; ctx.beginPath(); ctx.arc(c.x - c.r * 0.12, c.y - c.r * 0.18, c.r * 0.62, 0, Math.PI * 2); ctx.fill();
  }
  for (const tu of S.turrets) {
    ctx.strokeStyle = slotColor('basic'); ctx.globalAlpha = Math.min(1, tu.life); ctx.lineWidth = 1.5;
    ctx.strokeRect(tu.x - 4, tu.y - 4, 8, 8); ctx.beginPath(); ctx.arc(tu.x, tu.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tu.life / 3); ctx.stroke(); ctx.globalAlpha = 1;
  }

  // Enemigos
  for (const e of S.enemies) {
    if (e.spawn > 0) {
      ctx.strokeStyle = e.color; ctx.globalAlpha = 0.6; ctx.lineWidth = e.champ ? 2.2 : 1.2;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 10 * (e.spawn / 0.65), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; continue;
    }
    if (e.wind > 0) { // aviso de golpe
      const k = 1 - e.wind / e.type.wind;
      ctx.fillStyle = C.ink; ctx.globalAlpha = 0.14 + 0.2 * k; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + e.type.reach * k + 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (e.cast > 0) { ctx.strokeStyle = C.arcane; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4 + 6 * (e.cast / 0.55), 0, Math.PI * 2); ctx.stroke(); }
    if (e.lungeWind > 0) { // aviso de embestida
      const a = Math.atan2(e.lvy, e.lvx);
      ctx.strokeStyle = e.color; ctx.globalAlpha = 0.25 + 0.4 * (1 - e.lungeWind / 0.5); ctx.lineWidth = e.r * 2;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 95, e.y + Math.sin(a) * 95); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (e.boss) { // avisos del Guardián
      if (e.act === 'slam') { ctx.fillStyle = C.blood; ctx.globalAlpha = 0.15 + 0.35 * (1 - e.at / 0.75); ctx.beginPath(); ctx.arc(e.x, e.y, 78, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (e.act === 'chargeWind') { const a = Math.atan2(e.lvy, e.lvx); ctx.strokeStyle = C.blood; ctx.globalAlpha = 0.2 + 0.4 * (1 - e.at / 0.7); ctx.lineWidth = e.r * 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 240, e.y + Math.sin(a) * 240); ctx.stroke(); ctx.globalAlpha = 1; }
      if (e.act === 'cast') { ctx.strokeStyle = C.arcane; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6 + 12 * Math.max(0, e.at / 0.6), 0, Math.PI * 2); ctx.stroke(); }
      if (e.act === 'dazed') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, S.t * 5, S.t * 5 + Math.PI * 1.7); ctx.stroke(); ctx.setLineDash([]); }
    }
    shapePath(e.type.shape, e.x, e.y, e.r, e.dir);
    ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.champ ? e.type.color : e.color; ctx.fill();
    ctx.strokeStyle = C.wall; ctx.lineWidth = 1.2; ctx.stroke();
    if (e.champ) { // el arma bendecida que lleva, en el color de su deidad
      const wx = Math.cos(e.dir), wy = Math.sin(e.dir);
      ctx.strokeStyle = e.color; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(e.x + wx * 3, e.y + wy * 3); ctx.lineTo(e.x + wx * (e.r + 9), e.y + wy * (e.r + 9)); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 3.5, 0, Math.PI * 2); ctx.stroke();
    }
    // Lo acumulado: Ascuas a la izquierda, Veneno a la derecha, sazón arriba, aturdido en blanco
    ctx.font = `600 7px ${FONT}`; ctx.textAlign = 'center';
    if (e.ember > 0) { ctx.strokeStyle = GODS.dragon.color; ctx.lineWidth = 0.8 + Math.min(3, 0.3 * e.ember); ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = GODS.dragon.color; ctx.fillText(String(e.ember), e.x - e.r - 6, e.y + 3); }
    if (e.venom > 0) { ctx.fillStyle = GODS.venom.color; ctx.fillText(String(e.venom), e.x + e.r + 6, e.y + 3); ctx.globalAlpha = 0.25; shapePath(e.type.shape, e.x, e.y, e.r, e.dir); ctx.fill(); ctx.globalAlpha = 1; }
    if (e.season > 0) { ctx.fillStyle = GODS.feast.color; for (let i = 0; i < e.season; i++) ctx.fillRect(e.x - 6 + i * 2.6, e.y + e.r + 3, 1.8, 1.8); }
    if (e.stun > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.setLineDash([1.5, 2.5]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5, S.t * 6, S.t * 6 + Math.PI * 1.6); ctx.stroke(); ctx.setLineDash([]); }
    if (e.hp < e.maxHp) {
      const w = e.r * 2 + 4; ctx.fillStyle = C.wall; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w, 2.5);
      ctx.fillStyle = C.ink; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w * clamp(e.hp / e.maxHp, 0, 1), 2.5);
    }
  }

  // Marca de objetivo
  const tg = S.target && active(S.target) ? S.target : null;
  if (tg) {
    const locked = S.lock === tg, r = tg.r + 7 + Math.sin(S.t * 8) * 0.8;
    ctx.strokeStyle = locked ? C.ember : C.energy; ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + (locked ? Math.PI / 4 : 0); ctx.beginPath(); ctx.arc(tg.x, tg.y, r, a - 0.35, a + 0.35); ctx.stroke(); }
  }

  // Proyectiles enemigos
  for (const sh of S.shots) {
    ctx.fillStyle = C.arcane; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r + 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2); ctx.fill();
  }

  // Efectos bajo el jugador
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'ghost') { ctx.fillStyle = C.ember; ctx.globalAlpha = 0.35 * k; ctx.beginPath(); ctx.arc(f.x, f.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    else if (f.k === 'cone') { ctx.fillStyle = f.col; ctx.globalAlpha = 0.45 * k; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r * (1 - 0.3 * k), f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // Jugador
  const flying = p.dodgeT > 0 && p.fly, pr = flying ? p.r * 1.35 : p.r, py = flying ? p.y - 5 : p.y;
  if (flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x, p.y + 4, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (p.fury > 0) { ctx.strokeStyle = GODS.orc.color; ctx.globalAlpha = 0.25 + 0.5 * p.fury / 100; ctx.lineWidth = 1 + 2.5 * p.fury / 100; ctx.beginPath(); ctx.arc(p.x, py, pr + 2, 0, Math.PI * 2 * p.fury / 100); ctx.stroke(); ctx.globalAlpha = 1; }
  const blink = p.inv > 0 && p.dodgeT <= 0 && Math.floor(S.t * 30) % 2 === 0;
  if (!blink) {
    const fx = Math.cos(p.face), fy = Math.sin(p.face), glow = p.windup > 0 || p.charging;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3d4458'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(p.x - fx * 3, py - fy * 3); ctx.lineTo(p.x + fx * 17, py + fy * 17); ctx.stroke();
    ctx.strokeStyle = glow ? '#ffffff' : slotColor('basic'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(p.x + fx * 5, py + fy * 5); ctx.lineTo(p.x + fx * 17, py + fy * 17); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = C.ember; ctx.beginPath(); ctx.arc(p.x, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.wall; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // Anillo de ritmo: se llena mientras recarga; brilla cuando puedes disparar
  const period = periodOf(), a0 = -Math.PI / 2;
  if (p.windup > 0) { ctx.strokeStyle = C.ember; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * (1 - p.windup / p.windupTotal)); ctx.stroke(); }
  else if (p.cd > 0) { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * clamp(1 - p.cd / period, 0, 1)); ctx.stroke(); ctx.globalAlpha = 1; }
  else { ctx.strokeStyle = C.energy; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2); ctx.stroke(); }
  if (S.plans.has('double')) for (let i = 0; i < 2; i++) { ctx.fillStyle = i < p.dodgeN ? C.ink : C.edge; ctx.fillRect(p.x - 4 + i * 5, p.y + p.r + 10, 3, 3); }
  for (let i = 0; i < p.sated; i++) { ctx.fillStyle = GODS.feast.color; ctx.fillRect(p.x - p.sated * 1.5 + i * 3, p.y - p.r - 11, 2, 2); }
  if (p.chargeCd > 0) { ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8.5, a0, a0 + Math.PI * 2 * (1 - p.chargeCd / p.chargeCdMax)); ctx.stroke(); ctx.globalAlpha = 1; }

  // Efectos sobre todo
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'tracer') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k; ctx.lineWidth = (2.2 * k + 0.6) * (f.w || 1); ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
    else if (f.k === 'ring') { ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 3 * k + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - 0.6 * k), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = f.col; ctx.globalAlpha = 0.18 * k; ctx.fill(); }
    else if (f.k === 'beam') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k * 0.5; ctx.lineWidth = f.w * 3 * k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = k; ctx.lineWidth = f.w * k; ctx.stroke(); }
    else if (f.k === 'lob') { const u = f.t / f.life, x = f.x1 + (f.x2 - f.x1) * u, y = f.y1 + (f.y2 - f.y1) * u - Math.sin(u * Math.PI) * 26; ctx.fillStyle = f.col; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }
    else if (f.k === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = k; ctx.fillRect(f.x - 1, f.y - 1, 2, 2); }
    else if (f.k === 'num') { ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = f.col || (f.big ? C.ember : C.ink); ctx.font = `600 ${f.big ? 12 : 8}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(f.txt, f.x, f.y); }
    ctx.globalAlpha = 1;
  }

  // Capa de pantalla
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (S.hurtFx > 0) { ctx.fillStyle = C.blood; ctx.globalAlpha = S.hurtFx * 0.7; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
  if (touch.joyId !== null) {
    const r = cv.getBoundingClientRect(), d = view.dpr, ox = (touch.ox - r.left) * d, oy = (touch.oy - r.top) * d;
    let dx = (touch.x - touch.ox) * d, dy = (touch.y - touch.oy) * d; const m = Math.hypot(dx, dy), max = 46 * d;
    if (m > max) { dx *= max / m; dy *= max / m; }
    ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.3; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(ox, oy, max, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(ox + dx, oy + dy, 20 * d, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
}

// ───────────────────────── Bucle ─────────────────────────
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  resize(); pollInput(); modeT += dt;
  const m = S.mode;
  if (m === 'book') { ov.scrollTop += I.my * 700 * dt; if (modeT > 0.25 && (I.atkP || I.dodgeP || I.chgP || I.startP)) closeBook(); }
  else if ((m === 'pick' || m === 'pause') && I.chgP) openBook();
  else if (m === 'play') { if (I.startP) setMode('pause'); else update(dt); }
  else if (m === 'pick') {
    let moved = false;
    if (I.navL && pickSel > 0) { pickSel--; moved = true; }
    if (I.navR && pickSel < pickOpts.length - 1) { pickSel++; moved = true; }
    if (moved) { ovBody.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === pickSel)); blip(700, 0.03, 'triangle', 0.03); }
    if (I.atkP) choosePick(pickSel);
  } else if (m === 'forge') forgeInput();
  else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  render(); renderHud();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Acceso para pruebas
window.__kiteo = { get state() { return S; }, T, PIECES, PLANS, TECHS, GODS, FUSIONS };
})();
