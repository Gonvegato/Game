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

// ───────────────────────── Enemigos ─────────────────────────
const TYPES = {
  stalker: { name: 'Necrófago',   r: 7,  hp: 30,  speed: 58,  dmg: 10, wind: 0.38, reach: 9,  shape: 'circle',  color: '#8fa58c', cost: 1 },
  runner:  { name: 'Trasgo',      r: 5,  hp: 12,  speed: 100, dmg: 7,  wind: 0.22, reach: 8,  shape: 'tri',     color: '#7d9a4a', cost: 1 },
  brute:   { name: 'Ogro',        r: 12, hp: 120, speed: 38,  dmg: 24, wind: 0.6,  reach: 14, shape: 'square',  color: '#8a9a55', cost: 3 },
  mage:    { name: 'Cultista',    r: 7,  hp: 24,  speed: 50,  dmg: 12, ranged: true,          shape: 'diamond', color: '#b68cff', cost: 2 },
  bomber:  { name: 'Alquimista',  r: 7,  hp: 28,  speed: 46,  dmg: 16, ai: 'bomb',            shape: 'square',  color: '#ffa64d', cost: 2 },
  leaper:  { name: 'Araña',       r: 6,  hp: 26,  speed: 64,  dmg: 15, ai: 'leap',            shape: 'tri',     color: '#9bd36b', cost: 2 },
  sniper:  { name: 'Ballestero',  r: 6,  hp: 20,  speed: 44,  dmg: 22, ai: 'snipe',           shape: 'diamond', color: '#ff5d7a', cost: 2.5 },
  shaman:  { name: 'Chamán',      r: 7,  hp: 34,  speed: 48,  dmg: 0,  ai: 'heal',            shape: 'circle',  color: '#5fd4c4', cost: 2.5 },
  lancer:  { name: 'Lancero',     r: 7,  hp: 40,  speed: 54,  dmg: 18, wind: 0.4,  reach: 10, shape: 'circle',  color: '#e6dfc6', cost: 2.5, lunge: true },
  bat:     { name: 'Murciélago',  r: 4,  hp: 9,   speed: 118, dmg: 6,  wind: 0.16, reach: 6,  shape: 'tri',     color: '#8a6aa8', cost: 0.7, fly: true },
  champ:   { name: 'Elegido',     r: 9,  hp: 95,  speed: 60,  dmg: 16, wind: 0.4,  reach: 10, shape: 'circle',  color: '#e9dcc3', champ: true },
  post:    { name: 'Estandarte',  r: 10, hp: 230, speed: 0,   dmg: 0,  shape: 'square',  color: '#c0392b', cost: 99, post: true },
  // Jefes: un kit de ataques con aviso. phases: cuántas veces se enfurece.
  guardian:  { name: 'El Guardián',            r: 22, hp: 1100, speed: 44, dmg: 30, shape: 'circle',  color: '#8a3a55', boss: true, phases: 2, kit: ['slam', 'charge', 'ring'],                 sum: 'runner' },
  matriarch: { name: 'La Matriarca del Nido',  r: 20, hp: 1500, speed: 62, dmg: 30, shape: 'circle',  color: '#6f9a3a', boss: true, phases: 2, kit: ['leap', 'fan', 'pools', 'summon'],          sum: 'runner' },
  colossus:  { name: 'El Coloso de Cristal',   r: 26, hp: 2100, speed: 34, dmg: 34, shape: 'square',  color: '#4aa7b8', boss: true, phases: 2, kit: ['lasers', 'ring', 'charge', 'slam'],        sum: 'sniper' },
  nameless:  { name: 'El Sin Nombre',          r: 22, hp: 3000, speed: 54, dmg: 36, shape: 'diamond', color: '#d8d2e8', boss: true, phases: 3, kit: ['slam', 'charge', 'ring', 'fan', 'leap', 'lasers', 'pools', 'summon'], sum: 'brute' },
  // Dioses: el jefe final de un reino
  firstfist: { name: 'El Primer Puño',         r: 28, hp: 3400, speed: 50, dmg: 38, shape: 'square',  color: '#d9a066', boss: true, phases: 3, kit: ['slam', 'charge', 'leap', 'ring', 'summon'], sum: 'brute' },
};
const RPW = 5;   // salas por mundo, antes de la tienda y el jefe
const WORLDS = [
  { name: 'Las Criptas',           floor: '#1a1e29', tile: '#1f2431', pool: ['stalker', 'runner', 'mage', 'brute', 'bat'],                                         boss: 'guardian' },
  { name: 'El Nido',               floor: '#1b2420', tile: '#202b25', pool: ['stalker', 'runner', 'leaper', 'bomber', 'brute', 'bat'],                             boss: 'matriarch' },
  { name: 'Las Minas de Cristal',  floor: '#1a2030', tile: '#212a40', pool: ['runner', 'mage', 'sniper', 'shaman', 'brute', 'leaper', 'lancer'],                      boss: 'colossus' },
  { name: 'El Umbral',             floor: '#241a22', tile: '#2c2029', pool: ['stalker', 'runner', 'mage', 'brute', 'bomber', 'leaper', 'sniper', 'shaman', 'lancer', 'bat'], boss: 'nameless' },
];
const TOTAL = WORLDS.length * (RPW + 1);

// Ajustes del yunque (sala de yunque y tienda)
const UPGRADES = [
  { name: 'Llave engrasada', desc: '+18% de cadencia',                 apply: p => { p.as *= 1.18; } },
  { name: 'Pólvora fina',     desc: '+25% de daño',                     apply: p => { p.dmg *= 1.25; } },
  { name: 'Ánima pulida',     desc: '+15% de alcance',                  apply: p => { p.range *= 1.15; } },
  { name: 'Botas de forja',   desc: '+8% de velocidad de movimiento',   apply: p => { p.speed *= 1.08; } },
];

// ───────────────────────── Deidades ─────────────────────────
// El herrero no tiene dios. En las salas de deidad espera su elegido con un arma bendecida:
// lo matas, la desmontas y te quedas con una técnica. Cada deidad tiene algo suyo que se acumula.
const GODS = {
  dragon: { title: 'La Que Duerme Sobre Oro', theme: 'Dragones', weapon: 'Colmillo de la Durmiente', mat: 'Escama', color: '#ff6a3c',
    key: 'Ascuas: se clavan en el enemigo y queman todas a la vez. Y oro: cuanto más llevas, más fuerte eres.', lines: {
    enter: ['entreabre un ojo. Su elegido guarda esta sala.', 'huele a intruso entre sus monedas.'],
    champ: ['cuenta su oro para calmarse. Le falta una pieza.', 'resopla humo. Ha perdido un elegido.'],
    take:  ['te apunta en su lista de deudores.', 'no olvida quién le roba.'], master: ['ruge: nadie le había robado tanto.'] } },
  stone: { title: 'El Paciente Bajo la Montaña', theme: 'Minerales', weapon: 'Pico de Veta Madre', mat: 'Mena', color: '#6fe3d0',
    key: 'Cristales: se quedan clavados en la sala y repiten lo que tú haces.', lines: {
    enter: ['tarda un siglo en mirarte. Ya te está mirando.', 'cruje. Su elegido despierta.'],
    champ: ['no dice nada. En algún lugar se agrieta una montaña.', 'guarda silencio. Es un mal silencio.'],
    take:  ['toma nota. Tiene tiempo.', 'observa cómo tallas lo que era suyo.'], master: ['pronuncia tu nombre, muy despacio.'] } },
  venom: { title: 'La Boticaria Sin Rostro', theme: 'Veneno', weapon: 'Aguijón de la Boticaria', mat: 'Glándula', color: '#9be04a',
    key: 'Veneno: no caduca, se acumula y se contagia.', lines: {
    enter: ['anota tu peso y tu altura.', 'prepara un frasco con tu nombre.'],
    champ: ['pide que guarden una muestra del cadáver.', 'tacha un nombre de su cuaderno, sin pena.'],
    take:  ['siente curiosidad por lo que harás con eso.', 'apunta: el sujeto aprende rápido.'], master: ['te propone, encantada, un experimento.'] } },
  feast: { title: 'El Anfitrión del Banquete Eterno', theme: 'Manjares', weapon: 'Trinchante del Anfitrión', mat: 'Especia', color: '#ff8fb3',
    key: 'Reserva: la vida que robas por encima de tu máximo se guarda como escudo, y luego se gasta.', lines: {
    enter: ['te guarda un sitio en la mesa. No dice en qué plato.', 'afila los cubiertos y sonríe.'],
    champ: ['lamenta el desperdicio y pide otra ronda.', 'brinda por el difunto. Estaba tierno.'],
    take:  ['aplaude: ¡por fin alguien con apetito!', 'te ofrece repetir.'], master: ['brinda por ti, y ya van tres copas.'] } },
  orc: { title: 'El Primer Puño', theme: 'Orcos', weapon: 'Hacha del Primer Puño', mat: 'Hueso', color: '#d9a066',
    key: 'Furia: sube al golpear y al recibir, y lo potencia todo.', lines: {
    enter: ['escupe al suelo. Su elegido quiere tu cabeza.', 'hace sonar los tambores.'],
    champ: ['se ríe a carcajadas. Buen golpe.', 'golpea la mesa: ¡otro!'],
    take:  ['dice que robar a un muerto es de listos.', 'gruñe algo parecido a un elogio.'], master: ['te reta a duelo. Lo dice en serio.'] } },
  time: { title: 'El Relojero de la Última Hora', theme: 'Tiempo', weapon: 'Manecilla del Relojero', mat: 'Arena', color: '#7fa8ff',
    key: 'Ecos: lo que haces vuelve a ocurrir un poco después. Y pausas: los enemigos lentos sufren más.', lines: {
    enter: ['da cuerda a su elegido. Tic.', 'ya ha visto cómo acaba esta sala. No te lo dirá.'],
    champ: ['adelanta su reloj un minuto, molesto.', 'anota la hora de la muerte. Llega tarde.'],
    take:  ['murmura que eso ya lo habías robado antes.', 'te presta un segundo. Lo querrá de vuelta.'], master: ['detiene su reloj para mirarte bien.'] } },
  shade: { title: 'La Que Cuenta los Muertos', theme: 'Sombras', weapon: 'Guadaña de la Contadora', mat: 'Ceniza', color: '#9d8cff',
    key: 'Sombras: los enemigos que matas se levantan y pelean por ti.', lines: {
    enter: ['empieza a contar. Tú eres el siguiente número.', 'envía a su elegido con un hueco reservado para ti.'],
    champ: ['pierde la cuenta por primera vez en mil años.', 'suma uno. No era el que esperaba.'],
    take:  ['ve cómo sus muertos te siguen a ti.', 'te observa: los muertos no deberían obedecerte.'], master: ['deja de contar y se pone en pie.'] } },
  storm: { title: 'La Voz Entre las Nubes', theme: 'Tormenta', weapon: 'Lanza de la Voz', mat: 'Chispa', color: '#ffe14d',
    key: 'Agujas: se clavan sin hacer nada, y cuando las descargas saltan rayos.', lines: {
    enter: ['truena a lo lejos. Su elegido ya está aquí.', 'carga el aire. Se te eriza el pelo.'],
    champ: ['se queda sin voz un instante.', 'descarga su rabia contra una montaña.'],
    take:  ['te avisa: los rayos no tienen dueño.', 'ríe. Le gusta el ruido que haces.'], master: ['grita tu nombre, y se oye en los cuatro mundos.'] } },
  tide: { title: 'El Ahogado Bajo la Ola', theme: 'Mareas', weapon: 'Ancla del Ahogado', mat: 'Sal', color: '#4fb4d8',
    key: 'Empujones: mandas a los enemigos contra los muros, y lo que choca se rompe. Los Empapados lo sufren más.', lines: {
    enter: ['sube un palmo el agua de la sala.', 'arrastra algo pesado por el fondo. Viene hacia aquí.'],
    champ: ['suelta una burbuja. Tarda en llegar arriba.', 'se lleva a su elegido mar adentro, sin prisa.'],
    take:  ['te deja sal en los labios.', 'dice que todo lo que flota acaba volviendo.'], master: ['retira el mar entero para mirarte.'] } },
  luck: { title: 'La Dama de los Dados', theme: 'Fortuna', weapon: 'Estoque de la Dama', mat: 'Taba', color: '#f2ead0',
    key: 'Críticos y azar: dados, monedas y rachas. Cuando sale bien, sale muy bien.', lines: {
    enter: ['apuesta por su elegido. Paga poco: lo ve claro.', 'baraja sin mirar las cartas.'],
    champ: ['pierde la apuesta y sonríe igual.', 'paga su deuda con una moneda de dos caras.'],
    take:  ['te guiña un ojo. O le ha entrado algo.', 'sube la apuesta.'], master: ['te ofrece los dados. Están calientes.'] } },
  wood: { title: 'La Madre de Espinas', theme: 'Bosque', weapon: 'Hoz de la Madre', mat: 'Semilla', color: '#3fbf73',
    key: 'Semillas y Raíces: lo que plantas en un enemigo brota y lo deja clavado en el sitio. Y zarzas que cierran el paso.', lines: {
    enter: ['hace crecer musgo en tus botas.', 'deja que su elegido eche raíces en esta sala.'],
    champ: ['lo cubre de hojas. Mañana será un árbol.', 'no llora: abona.'],
    take:  ['te llama mala hierba, con cariño.', 'siente cómo podas lo que era suyo.'], master: ['florece en pleno invierno, solo por verte.'] } },
  frost: { title: 'La Dama Quieta', theme: 'Hielo', weapon: 'Punzón de la Dama', mat: 'Carámbano', color: '#bfe9ff',
    key: 'Escarcha: se acumula y frena. A la quinta, el enemigo queda Congelado, y lo que está congelado se puede romper.', lines: {
    enter: ['no se mueve. Nunca se ha movido.', 'baja la temperatura de la sala. Ves tu aliento.'],
    champ: ['no parpadea. Guarda al muerto bajo el hielo, intacto.', 'deja que nieve sobre su elegido.'],
    take:  ['te mira hacerlo. Solo te mira.', 'tiene todo el tiempo del mundo para cobrártelo.'], master: ['da un paso. El primero en mil inviernos.'] } },
  blood: { title: 'El Acreedor Rojo', theme: 'Sangre', weapon: 'Lanceta del Acreedor', mat: 'Coágulo', color: '#d6334a',
    key: 'Heridas: el enemigo sangra más cuanto más herido estés tú. Y pagos: das vida para pegar más, y la cobras matando.', lines: {
    enter: ['abre su libro de cuentas por tu nombre.', 'te presta a su elegido. Con intereses.'],
    champ: ['apunta la pérdida. Te la cobrará.', 'lame la pluma y tacha una línea.'],
    take:  ['sonríe: ahora tú también le debes.', 'te fía. Eso es peor.'], master: ['cierra el libro: ya eres su mejor cliente.'] } },
  end: { title: 'La Última Página', theme: 'Final', weapon: 'Pluma de la Última Página', mat: 'Tinta', color: '#9fb0c8',
    key: 'Sentencias: marcas a un enemigo y, al cumplirse el plazo, recibe de golpe parte de todo el daño que le hiciste mientras tanto.', lines: {
    enter: ['pasa una hoja. En la siguiente estás tú.', 'ya sabe cómo acaba esta sala. Lo ha leído.'],
    champ: ['corrige una errata: ese no tenía que morir hoy.', 'cierra un capítulo antes de tiempo.'],
    take:  ['te deja escribir una línea. Solo una.', 'anota al margen: imprevisto.'], master: ['te tiende la pluma. Pesa.'] } },
  light: { title: 'El Ojo Sin Párpado', theme: 'Luz', weapon: 'Lanza del Ojo', mat: 'Lucero', color: '#ffb84d',
    key: 'Iluminados: el daño que recibe uno lo reciben también, en parte, todos los demás Iluminados.', lines: {
    enter: ['te ve. Te ha visto siempre.', 'enfoca a su elegido. La sala se queda sin sombras.'],
    champ: ['no cierra el ojo. No puede.', 'mira el cadáver hasta que deja de dar sombra.'],
    take:  ['te sigue con la mirada mientras lo robas.', 'ya sabe dónde vas a guardarlo.'], master: ['parpadea. El mundo se apaga un instante.'] } },
  dream: { title: 'El Que Bosteza', theme: 'Sueño', weapon: 'Rueca del Que Bosteza', mat: 'Legaña', color: '#c9a0dc',
    key: 'Dormidos: no se mueven ni atacan hasta que algo los despierta, y el golpe que los despierta pega mucho más.', lines: {
    enter: ['se estira. Su elegido hace la guardia por él.', 'bosteza, y se te cierran los ojos un momento.'],
    champ: ['se da la vuelta en la cama.', 'murmura algo dormido. Era un nombre.'],
    take:  ['te deja hacer. Mañana lo habrá olvidado.', 'sueña que le roban. No se despierta.'], master: ['abre un ojo. Solo uno.'] } },
  void: { title: 'La Boca Sin Fondo', theme: 'Vacío', weapon: 'Anzuelo de la Boca', mat: 'Hueco', color: '#c44fd8',
    key: 'Pozos: arrastran a los enemigos a un punto. Y cuanto más juntos están, más daño reciben.', lines: {
    enter: ['traga saliva. Se oye en toda la sala.', 'inclina el suelo hacia su elegido.'],
    champ: ['se lo traga sin masticar.', 'eructa. Huele a nada.'],
    take:  ['abre un poco más la boca.', 'no pide que se lo devuelvas. Espera a que caigas.'], master: ['por primera vez, se queda con hambre.'] } },
  mirror: { title: 'La Que Devuelve la Mirada', theme: 'Espejos', weapon: 'Daga de Azogue', mat: 'Azogue', color: '#cfd6de',
    key: 'Un Reflejo tuyo se coloca al otro lado del enemigo y repite lo que haces desde allí.', lines: {
    enter: ['te mira desde un charco. Llevas tu cara.', 'pone a su elegido frente a un espejo. Salen dos.'],
    champ: ['rompe un espejo. Siete años, dice.', 'busca su reflejo en el cadáver. No lo encuentra.'],
    take:  ['te imita mientras lo robas.', 'sonríe con tu boca.'], master: ['ya no sabe cuál de los dos eres tú.'] } },
  beast: { title: 'La Madre de Colmillos', theme: 'Bestias', weapon: 'Colmillo de la Madre', mat: 'Colmillo', color: '#c8743a',
    key: 'Un sabueso pelea a tu lado: muerde a quien tú disparas y obedece a tu cargado y a tu esquive.', lines: {
    enter: ['olfatea el aire. Hueles a hierro.', 'suelta a su elegido sin correa.'],
    champ: ['aúlla una vez, larga.', 'lame la herida de su cachorro. Ya no sangra.'],
    take:  ['te enseña los dientes. No es una sonrisa.', 'deja que el sabueso te huela la mano.'], master: ['te reconoce como de la camada.'] } },
  forge: { title: 'El Yunque que Canta', theme: 'Forja', weapon: 'Martillo del Yunque', mat: 'Escoria', color: '#e07a5f',
    key: 'Temple: el arma se va endureciendo mientras disparas, y cada punto la hace pegar más. Los golpes que recibes lo enfrían.', lines: {
    enter: ['da un golpe de martillo. Tu arma vibra.', 'reconoce el trabajo del herrero que te crio.'],
    champ: ['enfría una pieza mal hecha.', 'dice que el acero era bueno. La mano, no.'],
    take:  ['examina tu arma y no dice nada. Es un elogio.', 'te deja usar su fragua, de mala gana.'], master: ['te llama colega. No lo había dicho nunca.'] } },
};
const GOD_KEYS = Object.keys(GODS);
const SLOTS = { basic: 'Disparo', charge: 'Cargado', dodge: 'Esquive', passive: 'Pasiva' };
const SLOT_KEYS = ['basic', 'charge', 'dodge', 'passive'];
const pl = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');

// Técnicas: una por acción. No llevan su efecto encerrado: se enganchan a balas, explosiones, esquives y bajas.
const PIECES = [
  // Dragones
  { id: 'dragon_basic',   god: 'dragon', slot: 'basic',   name: 'Colmillo al rojo', desc: l => `Cada bala clava ${pl(l, 'Ascua')}. Se apilan hasta 8 y queman todas a la vez.` },
  { id: 'dragon_charge',  god: 'dragon', slot: 'charge',  name: 'Aliento',          desc: l => `El cargado clava ${1 + l} Ascuas y hace estallar todas las que tenga cada enemigo (${35 + 10 * (l - 1)}% por Ascua, en área). Con el rifle se abre en cono.` },
  { id: 'dragon_dodge',   god: 'dragon', slot: 'dodge',   name: 'Vuelo',            desc: l => `El esquive es un salto largo que pasa por encima de los muros, y al aterrizar hay una explosión de ${150 * l}% de daño.` },
  { id: 'dragon_passive', god: 'dragon', slot: 'passive', name: 'Tesoro',           desc: l => `Quien muere con Ascuas suelta ${pl(l, 'moneda')}. Todo tu daño sube un ${l}% por cada 10 de oro que lleves, hasta +${30 + 10 * l}%.` },
  // Minerales
  { id: 'stone_basic',    god: 'stone',  slot: 'basic',   name: 'Esquirla',         desc: l => `${Math.max(1, 4 - l) > 1 ? 'Cada ' + Math.max(1, 4 - l) + ' balas dejan' : 'Cada bala deja'} un Cristal clavado junto al enemigo. Los Cristales duran 9 s.` },
  { id: 'stone_charge',   god: 'stone',  slot: 'charge',  name: 'Prisma',           desc: l => `Al disparar el cargado, cada Cristal dispara también un rayo al enemigo más cercano: ${40 * l}% del daño y todos los efectos de tu cargado.` },
  { id: 'stone_dodge',    god: 'stone',  slot: 'dodge',   name: 'Geoda',            desc: l => `El esquive deja un Cristal donde estabas, y atravesar un Cristal lo revienta: ${120 * l}% de daño en área.` },
  { id: 'stone_passive',  god: 'stone',  slot: 'passive', name: 'Veta',             desc: l => `Cada bala que disparas la repite el Cristal más cercano al objetivo, al ${30 * l}% de daño y con tus efectos de disparo.` },
  // Veneno
  { id: 'venom_basic',    god: 'venom',  slot: 'basic',   name: 'Dardo',            desc: l => `Cada bala aplica ${l} de Veneno. No caduca y se acumula hasta 30.` },
  { id: 'venom_charge',   god: 'venom',  slot: 'charge',  name: 'Purga',            desc: l => `El cargado convierte el Veneno en daño inmediato: ${15 * l}% por cada punto. El enemigo se queda con la mitad y deja un charco tóxico.` },
  { id: 'venom_dodge',    god: 'venom',  slot: 'dodge',   name: 'Rastro',           desc: l => `El esquive deja 5 s un rastro tóxico que aplica ${l} de Veneno por pulso.` },
  { id: 'venom_passive',  god: 'venom',  slot: 'passive', name: 'Plaga',            desc: l => `Cuando muere un envenenado, todo su Veneno salta a los ${1 + l} enemigos más cercanos.` },
  // Manjares
  { id: 'feast_basic',    god: 'feast',  slot: 'basic',   name: 'Bocado',           desc: l => `Cada bala te cura ${(0.5 * l).toFixed(1)}. La vida que sobra se guarda como Reserva, un escudo de hasta 30.` },
  { id: 'feast_charge',   god: 'feast',  slot: 'charge',  name: 'Banquete',         desc: l => `El cargado gasta toda tu Reserva: hace un ${4 * l}% más de daño por cada punto, y cada enemigo que mata te cura 4.` },
  { id: 'feast_dodge',    god: 'feast',  slot: 'dodge',   name: 'Brindis',          desc: l => `Atravesar a un enemigo con el esquive le hace ${60 * l}% de daño y te cura ${3 * l}.` },
  { id: 'feast_passive',  god: 'feast',  slot: 'passive', name: 'Glotón',           desc: l => `Todo tu daño sube un ${l}% por cada punto de Reserva.` },
  // Orcos
  { id: 'orc_basic',      god: 'orc',    slot: 'basic',   name: 'Tambor de guerra', desc: l => `Golpear y recibir golpes te da Furia. Todo tu daño sube hasta +${40 * l}% con la Furia llena.` },
  { id: 'orc_charge',     god: 'orc',    slot: 'charge',  name: 'Grito de guerra',  desc: l => `El cargado gasta toda tu Furia en un grito a tu alrededor: empuja, aturde y hace hasta ${50 + 200 * l}% de daño. Cuanta más Furia, más grande.` },
  { id: 'orc_dodge',      god: 'orc',    slot: 'dodge',   name: 'Embestida',        desc: l => `Atravesar a un enemigo con el esquive le hace ${100 * l}% de daño, lo aturde y te da 15 de Furia.` },
  { id: 'orc_passive',    god: 'orc',    slot: 'passive', name: 'Sed de sangre',    desc: l => `Con la Furia llena disparas un ${30 * l}% más rápido y cada baja te devuelve el esquive.` },
  // Tiempo
  { id: 'time_basic',     god: 'time',   slot: 'basic',   name: 'Segundero',        desc: l => `Cada bala deja un eco: 1,5 s después vuelve a impactar sola, al ${50 + 15 * (l - 1)}% de daño y con todos sus efectos.` },
  { id: 'time_charge',    god: 'time',   slot: 'charge',  name: 'Rebobinar',        desc: l => `2 s después de disparar el cargado, se repite solo desde donde lo lanzaste, al ${60 + 15 * (l - 1)}% de daño.` },
  { id: 'time_dodge',     god: 'time',   slot: 'dodge',   name: 'Hora muerta',      desc: l => `El esquive deja ${2 + l} s una burbuja donde los enemigos y sus proyectiles van al 30% de velocidad.` },
  { id: 'time_passive',   god: 'time',   slot: 'passive', name: 'Reloj de arena',   desc: l => `Los enemigos ralentizados o aturdidos reciben un ${30 * l}% más de daño de todo.` },
  // Sombras
  { id: 'shade_basic',    god: 'shade',  slot: 'basic',   name: 'Marca de tumba',   desc: l => `Las balas marcan. Un enemigo marcado que muere se levanta como Sombra y pelea por ti 9 s. Hasta ${2 + l} Sombras a la vez.` },
  { id: 'shade_charge',   god: 'shade',  slot: 'charge',  name: 'Orden',            desc: l => `El cargado ordena a todas tus Sombras lanzarse contra el objetivo y estallar: ${150 * l}% de daño en área cada una.` },
  { id: 'shade_dodge',    god: 'shade',  slot: 'dodge',   name: 'Relevo',           desc: l => `Al esquivar dejas una Sombra donde estabas durante ${3 + l} s.` },
  { id: 'shade_passive',  god: 'shade',  slot: 'passive', name: 'Séquito',          desc: l => `Todo tu daño sube un ${8 * l}% por cada Sombra viva, y las Sombras aplican tus efectos de disparo al golpear.` },
  // Tormenta
  { id: 'storm_basic',    god: 'storm',  slot: 'basic',   name: 'Aguja estática',   desc: l => `Cada bala clava ${pl(l, 'Aguja')} (hasta 6 por enemigo). Solas no hacen nada: esperan una descarga.` },
  { id: 'storm_charge',   god: 'storm',  slot: 'charge',  name: 'Sobretensión',     desc: l => `El cargado descarga las Agujas de quien alcanza: cada una hace ${70 + 20 * (l - 1)}% de daño y suelta un rayo a otro enemigo.` },
  { id: 'storm_dodge',    god: 'storm',  slot: 'dodge',   name: 'Paso relámpago',   desc: l => `Atravesar a un enemigo con el esquive descarga sus Agujas (${80 + 20 * (l - 1)}% cada una). Si no tiene, le clavas 2.` },
  { id: 'storm_passive',  god: 'storm',  slot: 'passive', name: 'Conductor',        desc: l => `Los rayos de una descarga clavan ${pl(l, 'Aguja')} a quien alcanzan.` },
  // Mareas
  { id: 'tide_basic',     god: 'tide',   slot: 'basic',   name: 'Oleaje',           desc: l => `Cada bala empuja al enemigo y lo deja Empapado 4 s. Los golpes contra el muro hacen un ${50 * l}% más de daño.` },
  { id: 'tide_charge',    god: 'tide',   slot: 'charge',  name: 'Maremoto',         desc: l => `El cargado suelta además una ola a tu alrededor: ${50 * l}% de daño, empapa y lanza a todos lejos de ti. Contra un muro, se rompen.` },
  { id: 'tide_dodge',     god: 'tide',   slot: 'dodge',   name: 'Corriente',        desc: l => `El esquive deja ${3 + l} s una corriente que arrastra a los enemigos en la dirección en que esquivaste y los empapa.` },
  { id: 'tide_passive',   god: 'tide',   slot: 'passive', name: 'Marea alta',       desc: l => `Los Empapados reciben un ${15 * l}% más de daño de todo, y tus empujones los mandan un 50% más lejos.` },
  // Fortuna
  { id: 'luck_basic',     god: 'luck',   slot: 'basic',   name: 'Dado cargado',     desc: l => `Cada bala tiene un ${10 + 10 * l}% de ser crítica: 250% de daño. Cada bala que no lo es sube la probabilidad un 5% hasta que sale.` },
  { id: 'luck_charge',    god: 'luck',   slot: 'charge',  name: 'Todo al rojo',     desc: l => `El cargado tira ${l > 1 ? l + ' dados y se queda el mejor' : 'un dado'}: con un 1 hace el 60% del daño; con un 6, el triple.` },
  { id: 'luck_dodge',     god: 'luck',   slot: 'dodge',   name: 'Cara o cruz',      desc: l => `Al esquivar lanzas una moneda. Cara: el esquive no se gasta. Cruz: la moneda se queda donde estabas y revienta (${120 * l}% en área).` },
  { id: 'luck_passive',   god: 'luck',   slot: 'passive', name: 'Racha',            desc: l => `Cada crítico suma una Racha, hasta 5: +${6 * l}% de daño cada una. Si te golpean, la pierdes.` },
  // Bosque
  { id: 'wood_basic',     god: 'wood',   slot: 'basic',   name: 'Semilla',          desc: l => `Cada bala planta una Semilla. A la ${l >= 2 ? 'segunda' : 'tercera'} brotan: Raíces que lo clavan en el sitio 1,5 s y ${80 * l}% de daño.` },
  { id: 'wood_charge',    god: 'wood',   slot: 'charge',  name: 'Zarzal',           desc: l => `El cargado deja 5 s un zarzal donde apuntas: ralentiza a la mitad y hace ${20 * l}% de daño por pulso a quien esté dentro.` },
  { id: 'wood_dodge',     god: 'wood',   slot: 'dodge',   name: 'Enredadera',       desc: l => `El esquive deja 4 s una enredadera: el primer paso de cada enemigo por ella lo enraíza 1 s y le hace ${60 * l}% de daño.` },
  { id: 'wood_passive',   god: 'wood',   slot: 'passive', name: 'Savia',            desc: l => `Los enemigos enraizados o entre zarzas reciben un ${20 * l}% más de daño, y te curan ${l} al morir.` },
  // Hielo
  { id: 'frost_basic',    god: 'frost',  slot: 'basic',   name: 'Aliento helado',   desc: l => `Cada bala pone ${l} de Escarcha. Cada punto frena un 12%; al llegar a 5, el enemigo queda Congelado 1,5 s.` },
  { id: 'frost_charge',   god: 'frost',  slot: 'charge',  name: 'Quebrar',          desc: l => `El cargado rompe a los Congelados: ${150 * l}% de daño extra y esquirlas en área. A los que no lo están les pone 3 de Escarcha.` },
  { id: 'frost_dodge',    god: 'frost',  slot: 'dodge',   name: 'Paso de hielo',    desc: l => `El esquive deja 4 s una placa de hielo donde estabas: pone ${l} de Escarcha por pulso a quien la pise.` },
  { id: 'frost_passive',  god: 'frost',  slot: 'passive', name: 'Cero absoluto',    desc: l => `Los Congelados reciben un ${25 * l}% más de daño. Si mueren congelados, ponen 2 de Escarcha a los enemigos cercanos.` },
  // Sangre
  { id: 'blood_basic',    god: 'blood',  slot: 'basic',   name: 'Herida abierta',   desc: l => `Cada bala abre ${pl(l, 'Herida')} (hasta 6). Las Heridas sangran cada medio segundo, y sangran hasta el triple cuanta menos vida tengas tú.` },
  { id: 'blood_charge',   god: 'blood',  slot: 'charge',  name: 'Sangría',          desc: l => `El cargado te cuesta el 10% de la vida que tengas y hace un ${60 * l}% más de daño. Cada enemigo que mata te devuelve 5.` },
  { id: 'blood_dodge',    god: 'blood',  slot: 'dodge',   name: 'Transfusión',      desc: l => `Atravesar a un enemigo con el esquive le hace ${60 * l}% de daño y te cura ${4 * l}.` },
  { id: 'blood_passive',  god: 'blood',  slot: 'passive', name: 'Deuda',            desc: l => `Por debajo de la mitad de vida haces un ${20 * l}% más de daño. Y el primer golpe mortal de cada sala te deja con 1 de vida en vez de matarte.` },
  // Final
  { id: 'end_basic',      god: 'end',    slot: 'basic',   name: 'Sentencia',        desc: l => `Tu bala pone una Sentencia de 5 s. Al cumplirse, el enemigo recibe de golpe el ${30 + 10 * l}% de todo el daño que le hayas hecho en ese tiempo.` },
  { id: 'end_charge',     god: 'end',    slot: 'charge',  name: 'Punto final',      desc: l => `El cargado cumple al instante las Sentencias de los enemigos que alcanza, con un ${30 * l}% más.` },
  { id: 'end_dodge',      god: 'end',    slot: 'dodge',   name: 'Pasar página',     desc: l => `Al esquivar, las Sentencias de los enemigos cercanos se adelantan 2 s, y te curas ${l} por cada una.` },
  { id: 'end_passive',    god: 'end',    slot: 'passive', name: 'Epitafio',         desc: l => `Si un enemigo muere con la Sentencia sin cumplir, pasa al enemigo más cercano con todo lo acumulado${l > 1 ? ' y un ' + 15 * (l - 1) + '% más' : ''}.` },
  // Luz
  { id: 'light_basic',    god: 'light',  slot: 'basic',   name: 'Señalar',          desc: l => `Cada bala Ilumina al enemigo 6 s. El ${20 + 10 * l}% del daño que recibe un Iluminado lo reciben también todos los demás Iluminados.` },
  { id: 'light_charge',   god: 'light',  slot: 'charge',  name: 'Destello',         desc: l => `El cargado Ilumina a todos los que alcanza. A los que ya lo estaban los ciega: quedan aturdidos 1 s y reciben un ${40 * l}% más.` },
  { id: 'light_dodge',    god: 'light',  slot: 'dodge',   name: 'Resplandor',       desc: l => `Al esquivar sueltas un fogonazo donde estabas: Ilumina a los enemigos cercanos y les hace ${50 * l}% de daño.` },
  { id: 'light_passive',  god: 'light',  slot: 'passive', name: 'Sin sombra',       desc: l => `Todo tu daño sube un ${5 * l}% por cada enemigo Iluminado, hasta seis.` },
  // Sueño
  { id: 'dream_basic',    god: 'dream',  slot: 'basic',   name: 'Arrullo',          desc: l => `Una de cada ${Math.max(2, 5 - l)} balas Duerme al enemigo 3 s. El golpe que lo despierta hace un ${100 * l}% más de daño.` },
  { id: 'dream_charge',   god: 'dream',  slot: 'charge',  name: 'Pesadilla',        desc: l => `El cargado no despierta a los Dormidos y les hace un ${80 * l}% más. A los que están despiertos los Duerme 2 s.` },
  { id: 'dream_dodge',    god: 'dream',  slot: 'dodge',   name: 'Polvo de sueño',   desc: l => `El esquive deja ${2 + l} s una nube donde estabas: Duerme 2 s a cada enemigo que entre en ella, una vez.` },
  { id: 'dream_passive',  god: 'dream',  slot: 'passive', name: 'Sonámbulos',       desc: l => `El daño continuo (Ascuas, Veneno, Heridas) no despierta a los Dormidos y les hace un ${50 * l}% más.` },
  // Vacío
  { id: 'void_basic',     god: 'void',   slot: 'basic',   name: 'Gravedad',         desc: l => `Cada bala tira de los enemigos cercanos hacia el que recibe el disparo${l > 1 ? ', con más fuerza a cada nivel' : ''}. Así se apiñan.` },
  { id: 'void_charge',    god: 'void',   slot: 'charge',  name: 'Singularidad',     desc: l => `El cargado abre 2,5 s un pozo donde apuntas: arrastra a todos al centro, hace ${25 * l}% de daño por pulso y al cerrarse estalla (${100 * l}%).` },
  { id: 'void_dodge',     god: 'void',   slot: 'dodge',   name: 'Hueco',            desc: l => `El esquive deja ${1 + l} s un pozo pequeño donde estabas, que arrastra hacia él a los enemigos cercanos.` },
  { id: 'void_passive',   god: 'void',   slot: 'passive', name: 'Apiñados',         desc: l => `Cada enemigo recibe un ${8 * l}% más de daño por cada otro enemigo que tenga pegado, hasta cuatro.` },
  // Espejos
  { id: 'mirror_basic',   god: 'mirror', slot: 'basic',   name: 'Reflejo',          desc: l => `Tienes un Reflejo al otro lado de tu objetivo. Cada vez que disparas, él dispara también, al ${30 * l}% de daño y con tus efectos.` },
  { id: 'mirror_charge',  god: 'mirror', slot: 'charge',  name: 'Doble',            desc: l => `Tu Reflejo repite el cargado desde donde está, al ${40 + 15 * l}% de daño: el enemigo lo recibe por los dos lados.` },
  { id: 'mirror_dodge',   god: 'mirror', slot: 'dodge',   name: 'Engaño',           desc: l => `Al esquivar dejas tu imagen donde estabas: los enemigos cercanos se quedan mirándola, aturdidos ${(0.6 + 0.3 * l).toFixed(1)} s.` },
  { id: 'mirror_passive', god: 'mirror', slot: 'passive', name: 'Azogue',           desc: l => `Cuando te golpean, el golpe rebota: todos los enemigos cercanos reciben ${100 * l}% de tu daño.` },
  // Bestias
  { id: 'beast_basic',    god: 'beast',  slot: 'basic',   name: 'Sabueso',          desc: l => `Un sabueso pelea a tu lado: muerde al enemigo que tú disparas (${60 * l}% de daño, con tus efectos), y tus balas hacen un 15% más a su presa.` },
  { id: 'beast_charge',   god: 'beast',  slot: 'charge',  name: '¡A por él!',       desc: l => `El cargado manda al sabueso saltar sobre el objetivo: ${250 * l}% de daño en área y aturde 1 s.` },
  { id: 'beast_dodge',    god: 'beast',  slot: 'dodge',   name: 'Manada',           desc: l => `Al esquivar, el sabueso embiste a los enemigos que tenías encima: ${80 * l}% de daño y los aparta.` },
  { id: 'beast_passive',  god: 'beast',  slot: 'passive', name: 'Olfato',           desc: l => `Los enemigos por debajo del 30% de vida reciben un ${25 * l}% más de daño de todo.` },
  // Forja
  { id: 'forge_basic',    god: 'forge',  slot: 'basic',   name: 'Temple',           desc: l => `Cada ${Math.max(3, 9 - l * 2)} balas el arma gana 1 de Temple (hasta 10): +3% de daño cada uno. Cuando te golpean pierdes la mitad.` },
  { id: 'forge_charge',   god: 'forge',  slot: 'charge',  name: 'Martillazo',       desc: l => `El cargado añade un golpe de martillo a tu alrededor: ${120 * l}% de daño, aturde, y cada enemigo golpeado te da 1 de Temple.` },
  { id: 'forge_dodge',    god: 'forge',  slot: 'dodge',   name: 'Al rojo',          desc: l => `Al salir del esquive, tus ${1 + l} siguientes balas salen al rojo: +50% de daño y salpican al enemigo de al lado.` },
  { id: 'forge_passive',  god: 'forge',  slot: 'passive', name: 'Maestro armero',   desc: l => `Tu arma rinde más: +${5 * l}% de daño, de cadencia y de alcance.` },
];
// Dúos: si llevas la técnica de una deidad y a otra le toca ofrecerte la suya para esa misma acción,
// te ofrece el dúo. Ocupa la ranura, hace lo de las dos y añade una regla nueva. Las once primeras deidades tienen dúo con todas entre sí; las nuevas, solo con sus afines.
const DUOS = [
  // Disparo
  { id: 'obsidian',  slot: 'basic',   a: 'dragon_basic',  b: 'stone_basic',  name: 'Bala de obsidiana',  desc: 'Los Cristales arden: queman a quien tengan cerca y, al apagarse, estallan en fuego.' },
  { id: 'eternal',   slot: 'basic',   a: 'dragon_basic',  b: 'time_basic',   name: 'Brasa eterna',       desc: 'Las Ascuas no se apagan nunca, y el eco de cada bala clava el doble.' },
  { id: 'tombstone', slot: 'basic',   a: 'stone_basic',   b: 'shade_basic',  name: 'Lápida',             desc: 'Cada Cristal es una lápida: cuando se apaga, de él se levanta una Sombra.' },
  { id: 'boil',      slot: 'basic',   a: 'venom_basic',   b: 'orc_basic',    name: 'Sangre hirviente',   desc: 'Cada bala aplica más Veneno cuanta más Furia tengas, el Veneno que hace daño te da Furia, y con la Furia llena actúa el doble de rápido.' },
  { id: 'syringe',   slot: 'basic',   a: 'venom_basic',   b: 'storm_basic',  name: 'Aguja envenenada',   desc: 'Al descargar a un enemigo, cada rayo inyecta a quien alcanza todo el Veneno que tuviera el primero. Las Agujas no caducan en envenenados.' },
  { id: 'warhunger', slot: 'basic',   a: 'feast_basic',   b: 'orc_basic',    name: 'Hambre de guerra',   desc: 'Curarte te da Furia, y con la Furia llena cada bala te cura el triple.' },
  { id: 'clockmark', slot: 'basic',   a: 'time_basic',    b: 'shade_basic',  name: 'Marca del reloj',    desc: 'Cada Sombra que se levanta deja un eco: 1,5 s después se levanta otra en el mismo sitio.' },
  // Cargado
  { id: 'rot',       slot: 'charge',  a: 'dragon_charge', b: 'venom_charge', name: 'Aliento podrido',    desc: 'Antes de estallar, el cargado iguala las Ascuas y el Veneno de cada enemigo a la suma de los dos.' },
  { id: 'roar',      slot: 'charge',  a: 'dragon_charge', b: 'orc_charge',   name: 'Rugido',             desc: 'El cono de fuego crece con la Furia hasta el doble de tamaño, y el grito solo gasta la mitad.' },
  { id: 'rod',       slot: 'charge',  a: 'stone_charge',  b: 'storm_charge', name: 'Pararrayos',         desc: 'Si hay un Cristal cerca de quien descargas, los rayos pasan por él y salen el doble.' },
  { id: 'table',     slot: 'charge',  a: 'stone_charge',  b: 'feast_charge', name: 'Mesa puesta',        desc: 'Los Cristales devoran: ejecutan solos a los enemigos débiles que tengan cerca, y cada uno te da 4 de Reserva.' },
  { id: 'cortege',   slot: 'charge',  a: 'venom_charge',  b: 'shade_charge', name: 'Cortejo fúnebre',    desc: 'Cada Sombra que estalla deja un charco tóxico y aplica 6 de Veneno.' },
  { id: 'supper',    slot: 'charge',  a: 'feast_charge',  b: 'shade_charge', name: 'Última cena',        desc: 'Cada Sombra que estalla te da 5 de Reserva, y tus Sombras ejecutan a los enemigos débiles que golpean.' },
  { id: 'echocry',   slot: 'charge',  a: 'orc_charge',    b: 'time_charge',  name: 'Grito con eco',      desc: 'El grito se repite solo 2 s después con la misma fuerza y sin gastar Furia.' },
  // Esquive
  { id: 'comet',     slot: 'dodge',   a: 'dragon_dodge',  b: 'storm_dodge',  name: 'Cometa',             desc: 'El impacto del aterrizaje descarga las Agujas de todos los que alcanza y les clava 2.' },
  { id: 'avalanche', slot: 'dodge',   a: 'stone_dodge',   b: 'orc_dodge',    name: 'Avalancha',          desc: 'Embestir a un enemigo lo lanza por los aires. Si choca con un muro, un Cristal, la pared u otro enemigo, estalla: 300% de daño y aturde.' },
  { id: 'stalagm',   slot: 'dodge',   a: 'stone_dodge',   b: 'venom_dodge',  name: 'Estela de cristal',  desc: 'El rastro tóxico cristaliza: deja tres Cristales a lo largo, y todos tus Cristales envenenan a quien tengan cerca.' },
  { id: 'miasma',    slot: 'dodge',   a: 'venom_dodge',   b: 'time_dodge',   name: 'Miasma',             desc: 'Dentro de la burbuja, el Veneno hace daño el triple de rápido.' },
  { id: 'toast',     slot: 'dodge',   a: 'feast_dodge',   b: 'storm_dodge',  name: 'Brindis eléctrico',  desc: 'Al atravesar a un enemigo te curas 2 por cada Aguja que le descargues.' },
  { id: 'horde',     slot: 'dodge',   a: 'orc_dodge',     b: 'shade_dodge',  name: 'Carga de la horda',  desc: 'Cuando embistes a un enemigo, todas tus Sombras embisten contigo: cada una le hace 100% de daño.' },
  { id: 'stasis',    slot: 'dodge',   a: 'time_dodge',    b: 'storm_dodge',  name: 'Relámpago en pausa', desc: 'Los enemigos dentro de la burbuja reciben una Aguja por segundo, y cuando la burbuja se cierra se descargan todos a la vez.' },
  // Pasiva
  { id: 'hoardfeast', slot: 'passive', a: 'dragon_passive', b: 'feast_passive', name: 'Banquete del dragón', desc: 'Para Glotón, cada 10 de oro cuenta como un punto de Reserva. Y cada moneda que recoges te cura 1.' },
  { id: 'ashlegion', slot: 'passive', a: 'dragon_passive', b: 'shade_passive', name: 'Ejército de ceniza', desc: 'Tus Sombras arden: clavan 2 Ascuas al golpear y estallan al desvanecerse.' },
  { id: 'clockquartz', slot: 'passive', a: 'stone_passive', b: 'time_passive', name: 'Cuarzo de reloj',   desc: 'Los Cristales ralentizan un 40% a los enemigos cercanos, y no se apagan mientras ralenticen a alguien.' },
  { id: 'indigest',  slot: 'passive', a: 'venom_passive', b: 'feast_passive', name: 'Indigestión',        desc: 'El daño que hace tu Veneno te cura un 10%.' },
  { id: 'longlunch', slot: 'passive', a: 'feast_passive', b: 'time_passive',  name: 'Sobremesa larga',    desc: 'La Reserva no se pierde con el tiempo, y ralentiza a los enemigos cercanos un 2% por punto, hasta un 60%.' },
  { id: 'warthunder', slot: 'passive', a: 'orc_passive',  b: 'storm_passive', name: 'Trueno de guerra',   desc: 'Con la Furia llena, cada bala tuya suelta además un rayo a otro enemigo.' },
  { id: 'chargedshade', slot: 'passive', a: 'shade_passive', b: 'storm_passive', name: 'Sombras cargadas', desc: 'Tus Sombras clavan una Aguja al golpear y, al desvanecerse, descargan a los enemigos de alrededor.' },
  // Mareas
  { id: 'steam',     slot: 'basic',   a: 'dragon_basic',  b: 'tide_basic',   name: 'Vapor',              desc: 'Un enemigo que choca contra un muro revienta todas sus Ascuas en área: 35% por Ascua.' },
  { id: 'ram',       slot: 'basic',   a: 'orc_basic',     b: 'tide_basic',   name: 'Ariete',             desc: 'Cada golpe contra el muro te da 20 de Furia, y con la Furia llena tus balas empujan el doble.' },
  { id: 'reef',      slot: 'dodge',   a: 'stone_dodge',   b: 'tide_dodge',   name: 'Arrecife',           desc: 'Los Cristales cuentan como muro para los enemigos empujados: chocan, se llevan el golpe y el Cristal estalla.' },
  { id: 'whirl',     slot: 'dodge',   a: 'time_dodge',    b: 'tide_dodge',   name: 'Remolino',           desc: 'La corriente dura el doble y ralentiza un 40% a quien arrastra.' },
  { id: 'brine',     slot: 'passive', a: 'venom_passive', b: 'tide_passive', name: 'Salmuera',           desc: 'Los Empapados reciben el doble de cada Veneno que se les aplique.' },
  { id: 'drowned',   slot: 'passive', a: 'shade_passive', b: 'tide_passive', name: 'Ahogados',           desc: 'Quien muere Empapado se levanta como Sombra.' },
  { id: 'winetide',  slot: 'charge',  a: 'feast_charge',  b: 'tide_charge',  name: 'Marea de vino',      desc: 'El Maremoto te da 3 de Reserva por cada enemigo que alcanza.' },
  { id: 'tsunami',   slot: 'charge',  a: 'storm_charge',  b: 'tide_charge',  name: 'Agua y rayo',        desc: 'El Maremoto descarga las Agujas de todos los que alcanza.' },
  // Fortuna
  { id: 'jackpot',   slot: 'passive', a: 'dragon_passive', b: 'luck_passive', name: 'Tesoro maldito',    desc: 'Cada crítico suelta una moneda.' },
  { id: 'bones',     slot: 'passive', a: 'shade_passive', b: 'luck_passive', name: 'Tabas',              desc: 'Cada Sombra viva te da un 5% más de crítico.' },
  { id: 'facet',     slot: 'basic',   a: 'stone_basic',   b: 'luck_basic',   name: 'Faceta',             desc: 'Cada crítico deja un Cristal junto al enemigo.' },
  { id: 'snakeeyes', slot: 'basic',   a: 'venom_basic',   b: 'luck_basic',   name: 'Ojos de serpiente',  desc: 'Un crítico duplica el Veneno del enemigo.' },
  { id: 'loaded',    slot: 'basic',   a: 'time_basic',    b: 'luck_basic',   name: 'Dado trucado',       desc: 'Cada eco tira su propio dado: puede ser crítico por su cuenta.' },
  { id: 'toss',      slot: 'dodge',   a: 'feast_dodge',   b: 'luck_dodge',   name: 'Propina',            desc: 'Salga cara o cruz, lanzar la moneda te cura 5.' },
  { id: 'fork',      slot: 'dodge',   a: 'storm_dodge',   b: 'luck_dodge',   name: 'Rayo caprichoso',    desc: 'Si sale cruz, la moneda cae como un rayo: descarga a todos los que alcanza y les clava 2 Agujas.' },
  { id: 'allin',     slot: 'charge',  a: 'orc_charge',    b: 'luck_charge',  name: 'Órdago',             desc: 'El dado del cargado suma 1 por cada 34 de Furia.' },
  { id: 'wager',     slot: 'charge',  a: 'tide_charge',   b: 'luck_charge',  name: 'Mar gruesa',         desc: 'Con un 5 o un 6 en el dado, el Maremoto empuja el doble y aturde 1 s.' },
  // Bosque
  { id: 'graveroot', slot: 'basic',   a: 'shade_basic',   b: 'wood_basic',   name: 'Raíz de tumba',      desc: 'Cuando las Semillas brotan en un enemigo, de la tierra sale una Sombra a su lado.' },
  { id: 'thornrod',  slot: 'basic',   a: 'storm_basic',   b: 'wood_basic',   name: 'Espina de cobre',    desc: 'Cuando las Semillas brotan, se descargan todas las Agujas del enemigo.' },
  { id: 'clover',    slot: 'basic',   a: 'luck_basic',    b: 'wood_basic',   name: 'Trébol',             desc: 'Un crítico hace brotar al instante las Semillas del enemigo, tenga las que tenga.' },
  { id: 'wildfire',  slot: 'charge',  a: 'dragon_charge', b: 'wood_charge',  name: 'Incendio',           desc: 'El zarzal arde: clava una Ascua por pulso a quien esté dentro.' },
  { id: 'perennial', slot: 'charge',  a: 'time_charge',   b: 'wood_charge',  name: 'Perenne',            desc: 'El zarzal dura el doble y ralentiza un 80%.' },
  { id: 'nettle',    slot: 'dodge',   a: 'venom_dodge',   b: 'wood_dodge',   name: 'Ortiga',             desc: 'La enredadera aplica además 4 de Veneno a quien enraíza.' },
  { id: 'uproot',    slot: 'dodge',   a: 'orc_dodge',     b: 'wood_dodge',   name: 'Descuaje',           desc: 'Embestir a un enemigo enraizado le hace el triple de daño y lo arranca del suelo, lanzándolo lejos.' },
  { id: 'mangrove',  slot: 'dodge',   a: 'tide_dodge',    b: 'wood_dodge',   name: 'Manglar',            desc: 'La enredadera empapa, y las Raíces duran el doble en los Empapados.' },
  { id: 'amber',     slot: 'passive', a: 'stone_passive', b: 'wood_passive', name: 'Ámbar',              desc: 'Un enemigo que muere enraizado o entre zarzas deja un Cristal.' },
  { id: 'orchard',   slot: 'passive', a: 'feast_passive', b: 'wood_passive', name: 'Huerto',             desc: 'Cada golpe a un enemigo enraizado te cura 1.' },
  // Hielo (afines: Mareas, Tiempo, Minerales, Tormenta, Bosque)
  { id: 'glacier',   slot: 'basic',   a: 'stone_basic',   b: 'frost_basic',   name: 'Glaciar',           desc: 'Cada enemigo que se congela deja un Cristal a su lado.' },
  { id: 'hail',      slot: 'basic',   a: 'storm_basic',   b: 'frost_basic',   name: 'Granizo',           desc: 'Cuando un enemigo se congela, se descargan todas sus Agujas.' },
  { id: 'iceberg',   slot: 'charge',  a: 'tide_charge',   b: 'frost_charge',  name: 'Témpano',           desc: 'El Maremoto congela al instante a los enemigos que ya estaban Empapados.' },
  { id: 'stillness', slot: 'passive', a: 'time_passive',  b: 'frost_passive', name: 'Quietud',           desc: 'Los enemigos quedan Congelados un segundo y medio más.' },
  { id: 'frostthorn', slot: 'dodge',  a: 'wood_dodge',    b: 'frost_dodge',   name: 'Zarza de escarcha', desc: 'La enredadera pone además 3 de Escarcha a quien enraíza.' },
  // Sangre (afines: Manjares, Orcos, Veneno, Sombras)
  { id: 'warwound',  slot: 'basic',   a: 'orc_basic',     b: 'blood_basic',   name: 'Herida de guerra',  desc: 'Cada Herida que abres te da 3 de Furia, y con la Furia llena las Heridas sangran el doble.' },
  { id: 'hemotoxin', slot: 'basic',   a: 'venom_basic',   b: 'blood_basic',   name: 'Hemotoxina',        desc: 'Los enemigos envenenados sangran el doble por sus Heridas.' },
  { id: 'bloodwine', slot: 'passive', a: 'feast_passive', b: 'blood_passive', name: 'Vino de sangre',    desc: 'Toda la vida que pagas (Sangría, Bala de sangre) vuelve como Reserva.' },
  { id: 'bloodrite', slot: 'charge',  a: 'shade_charge',  b: 'blood_charge',  name: 'Rito rojo',         desc: 'Cada enemigo que mata la Sangría se levanta como Sombra.' },
  // Final (afines: Tiempo, Dragones, Sombras, Fortuna)
  { id: 'deadline',  slot: 'basic',   a: 'time_basic',    b: 'end_basic',     name: 'Plazo vencido',     desc: 'El daño de los ecos cuenta doble para la Sentencia.' },
  { id: 'verdict',   slot: 'basic',   a: 'luck_basic',    b: 'end_basic',     name: 'Veredicto',         desc: 'Un crítico cumple la Sentencia del enemigo al instante.' },
  { id: 'autodafe',  slot: 'charge',  a: 'dragon_charge', b: 'end_charge',    name: 'Auto de fe',        desc: 'Al cumplir una Sentencia con el cargado, el enemigo recibe además 3 Ascuas.' },
  { id: 'obituary',  slot: 'passive', a: 'shade_passive', b: 'end_passive',   name: 'Obituario',         desc: 'Quien muere al cumplirse su Sentencia se levanta como Sombra.' },
  // Luz (afines: Minerales, Tormenta, Dragones, Sombras)
  { id: 'lens',      slot: 'basic',   a: 'stone_basic',   b: 'light_basic',   name: 'Lente',             desc: 'Los Cristales Iluminan a los enemigos que tengan cerca.' },
  { id: 'beacon',    slot: 'basic',   a: 'storm_basic',   b: 'light_basic',   name: 'Faro',              desc: 'Los rayos de una descarga Iluminan a quien alcanzan.' },
  { id: 'sunfire',   slot: 'passive', a: 'dragon_passive', b: 'light_passive', name: 'Sol de mediodía',  desc: 'Las Ascuas queman el doble a los Iluminados.' },
  { id: 'eclipse',   slot: 'passive', a: 'shade_passive', b: 'light_passive', name: 'Eclipse',           desc: 'Cada Sombra viva cuenta como un Iluminado más para Sin sombra, y sus golpes Iluminan.' },
  // Sueño (afines: Veneno, Tiempo, Manjares, Hielo)
  { id: 'poppy',     slot: 'passive', a: 'venom_passive', b: 'dream_passive', name: 'Adormidera',        desc: 'Un enemigo que llega a 10 de Veneno se queda Dormido 3 s.' },
  { id: 'siesta',    slot: 'dodge',   a: 'time_dodge',    b: 'dream_dodge',   name: 'Siesta',            desc: 'Los enemigos se duermen el doble de tiempo.' },
  { id: 'digest',    slot: 'charge',  a: 'feast_charge',  b: 'dream_charge',  name: 'Digestión',         desc: 'Cada Dormido que alcanza el cargado te da 4 de Reserva.' },
  { id: 'hibernate', slot: 'basic',   a: 'frost_basic',   b: 'dream_basic',   name: 'Hibernar',          desc: 'Al descongelarse, el enemigo se queda Dormido 2 s.' },
  // Vacío (afines: Mareas, Dragones, Orcos, Bosque)
  { id: 'maelstrom', slot: 'charge',  a: 'tide_charge',   b: 'void_charge',   name: 'Vorágine',          desc: 'El Maremoto lanza a los enemigos hacia la Singularidad en vez de lejos de ti.' },
  { id: 'collapse',  slot: 'charge',  a: 'dragon_charge', b: 'void_charge',   name: 'Colapso',           desc: 'Al cerrarse, la Singularidad revienta las Ascuas de todos los que ha atrapado.' },
  { id: 'funnel',    slot: 'dodge',   a: 'orc_dodge',     b: 'void_dodge',    name: 'Embudo',            desc: 'El Hueco aturde medio segundo a los enemigos que llegan a su centro.' },
  { id: 'thicket',   slot: 'passive', a: 'wood_passive',  b: 'void_passive',  name: 'Espesura',          desc: 'Apiñados cuenta el doble en enemigos enraizados o entre zarzas.' },
  // Espejos (afines: Sombras, Tiempo, Fortuna, Luz)
  { id: 'doubles',   slot: 'basic',   a: 'shade_basic',   b: 'mirror_basic',  name: 'Dobles',            desc: 'Cuando tu Reflejo dispara, tus Sombras disparan con él.' },
  { id: 'prismatic', slot: 'basic',   a: 'light_basic',   b: 'mirror_basic',  name: 'Prisma vivo',       desc: 'Los disparos del Reflejo hacen el doble de daño a los Iluminados.' },
  { id: 'afterimage', slot: 'charge', a: 'time_charge',   b: 'mirror_charge', name: 'Imagen tardía',     desc: 'La repetición de Rebobinar sale también desde el Reflejo.' },
  { id: 'luckglass', slot: 'passive', a: 'luck_passive',  b: 'mirror_passive', name: 'Espejo de la suerte', desc: 'Uno de cada tres golpes que recibes se lo lleva el Reflejo: no pierdes vida.' },
  // Bestias (afines: Orcos, Veneno, Sangre, Bosque)
  { id: 'warhound',  slot: 'basic',   a: 'orc_basic',     b: 'beast_basic',   name: 'Perro de guerra',   desc: 'Cada mordisco te da 4 de Furia, y con la Furia llena el sabueso muerde el doble de rápido.' },
  { id: 'rabid',     slot: 'basic',   a: 'venom_basic',   b: 'beast_basic',   name: 'Rabia',             desc: 'Cada mordisco aplica 2 de Veneno.' },
  { id: 'bloodhound', slot: 'dodge',  a: 'blood_dodge',   b: 'beast_dodge',   name: 'Rastro de sangre',  desc: 'La embestida de la Manada abre 2 Heridas a cada enemigo y te cura 2 por cada uno.' },
  { id: 'wolfthorn', slot: 'charge',  a: 'wood_charge',   b: 'beast_charge',  name: 'Lobo entre zarzas', desc: 'El salto del sabueso enraíza 1,5 s a todo lo que alcanza.' },
  // Forja (afines: Dragones, Minerales, Orcos, Tormenta)
  { id: 'forgefire', slot: 'basic',   a: 'dragon_basic',  b: 'forge_basic',   name: 'Fuego de fragua',   desc: 'Con 5 o más de Temple, cada bala clava una Ascua de más.' },
  { id: 'whetstone', slot: 'passive', a: 'stone_passive', b: 'forge_passive', name: 'Piedra de amolar',  desc: 'Cada Cristal que haya en la sala cuenta como un punto más de Temple.' },
  { id: 'warhammer', slot: 'charge',  a: 'orc_charge',    b: 'forge_charge',  name: 'Martillo de guerra', desc: 'El Martillazo crece con la Furia y da el doble de Temple.' },
  { id: 'quench',    slot: 'dodge',   a: 'storm_dodge',   b: 'forge_dodge',   name: 'Templar al rayo',   desc: 'Cada bala al rojo clava 2 Agujas.' },
];
// Técnicas extra: no ocupan ranura. rar: 1 rara, 2 épica, 3 legendaria. req: piezas que hay que llevar.
const TECHS = [
  { id: 'd_blood',   god: 'dragon', rar: 1, name: 'Sangre de dragón',  desc: 'Todas tus explosiones clavan 2 Ascuas y son un 30% más grandes.' },
  { id: 'd_pyre',    god: 'dragon', rar: 2, name: 'Pira',              desc: 'Quien muere con Ascuas explota: 30% de daño por Ascua, y reparte la mitad de las suyas.', req: ['dragon_basic'] },
  { id: 'm_reson',   god: 'stone',  rar: 1, name: 'Resonancia',        desc: 'Cada explosión tuya hace estallar también el Cristal más cercano, sin romperlo.' },
  { id: 'm_quartz',  god: 'stone',  rar: 2, name: 'Cuarzo vivo',       desc: 'Donde muere un enemigo nace un Cristal, y los Cristales duran el doble.' },
  { id: 'v_vapors',  god: 'venom',  rar: 1, name: 'Vapores',           desc: 'Todas tus explosiones aplican 3 de Veneno.' },
  { id: 'v_syn',     god: 'venom',  rar: 2, name: 'Organismo débil',   desc: 'Los envenenados reciben un 3% más de daño de todo por cada punto de Veneno, hasta +90%.' },
  { id: 'f_cellar',  god: 'feast',  rar: 1, name: 'Bodega',            desc: 'Tu Reserva máxima se duplica.' },
  { id: 'f_carve',   god: 'feast',  rar: 2, name: 'Trinchar',          desc: 'Cualquier golpe tuyo ejecuta a los enemigos por debajo del 12% de vida. No funciona con jefes.' },
  { id: 'o_drums',   god: 'orc',    rar: 1, name: 'Tambores lejanos',  desc: 'Cada explosión tuya te da 8 de Furia y cada baja, 10.' },
  { id: 'o_berserk', god: 'orc',    rar: 3, name: 'Berserker',         desc: 'Con la Furia llena no te frenas al disparar.', req: ['orc_basic'] },
  { id: 't_overtime', god: 'time',  rar: 1, name: 'Prórroga',          desc: 'Todos tus ecos llegan en la mitad de tiempo.' },
  { id: 't_paradox', god: 'time',   rar: 3, name: 'Paradoja',          desc: 'El eco de cada bala deja a su vez otro eco.', req: ['time_basic'] },
  { id: 's_guard',   god: 'shade',  rar: 1, name: 'Guardia de honor',  desc: 'Tus Sombras destruyen los proyectiles enemigos que tocan.' },
  { id: 's_legion',  god: 'shade',  rar: 2, name: 'Legión',            desc: 'Caben 3 Sombras más y duran el doble.' },
  { id: 'r_over',    god: 'storm',  rar: 2, name: 'Sobrecarga',        desc: 'Cuando un enemigo llega al tope de Agujas, se descarga solo: 100% de daño por cada una y un rayo por aguja.', req: ['storm_basic'] },
  // Ofrendas: técnicas sueltas que sirven aunque no lleves nada más de esa deidad
  { id: 'd_warm',    god: 'dragon', rar: 1, name: 'Aliento tibio',     desc: 'Una de cada cuatro balas clava una Ascua.' },
  { id: 'm_skin',    god: 'stone',  rar: 1, name: 'Piel de piedra',    desc: 'Recibes un 10% menos de daño.' },
  { id: 'v_slow',    god: 'venom',  rar: 1, name: 'Toxina lenta',      desc: 'Una de cada tres balas aplica 1 de Veneno.' },
  { id: 'f_appet',   god: 'feast',  rar: 1, name: 'Buen apetito',      desc: 'Cada baja te cura 1.' },
  { id: 'o_scars',   god: 'orc',    rar: 1, name: 'Cicatrices',        desc: '+15% de daño mientras estés por debajo de la mitad de vida.' },
  { id: 't_second',  god: 'time',   rar: 1, name: 'Un segundo más',    desc: 'El esquive se recarga un 20% antes.' },
  { id: 's_last',    god: 'shade',  rar: 1, name: 'Último servicio',   desc: 'El primer enemigo que mates en cada sala se levanta como Sombra.' },
  { id: 'r_spark',   god: 'storm',  rar: 1, name: 'Chispa',            desc: 'Una de cada cinco balas suelta un rayo a otro enemigo.' },
  { id: 'w_brine',   god: 'tide',   rar: 1, name: 'Salitre',           desc: 'Una de cada cuatro balas empuja al enemigo con fuerza.' },
  { id: 'w_deep',    god: 'tide',   rar: 2, name: 'Mar de fondo',      desc: 'Los golpes contra el muro aturden el doble de tiempo y sueltan una moneda.' },
  { id: 'l_coin',    god: 'luck',   rar: 1, name: 'Moneda de la suerte', desc: 'Todas tus balas tienen un 8% más de crítico (250% de daño).' },
  { id: 'l_jack',    god: 'luck',   rar: 3, name: 'Premio gordo',      desc: 'Un crítico que mata revienta al enemigo: 150% de daño en área y 3 monedas.', req: ['luck_basic'] },
  { id: 'b_thorn',   god: 'wood',   rar: 1, name: 'Espina',            desc: 'Una de cada cinco balas enraíza al enemigo 0,8 s.' },
  { id: 'b_bloom',   god: 'wood',   rar: 2, name: 'Floración',         desc: 'Un enemigo que muere enraizado deja un zarzal 3 s.' },
  { id: 'i_rime',    god: 'frost',  rar: 1, name: 'Rocío helado',      desc: 'Una de cada cuatro balas pone 1 de Escarcha.' },
  { id: 'i_shatter', god: 'frost',  rar: 2, name: 'Astillas',          desc: 'Un enemigo que muere Congelado lanza cuatro esquirlas a los cercanos (40% de daño cada una).' },
  { id: 'h_warm',    god: 'blood',  rar: 1, name: 'Sangre caliente',   desc: 'Por debajo de la mitad de vida, cada baja te cura 2.' },
  { id: 'h_frenzy',  god: 'blood',  rar: 3, name: 'Marea roja',        desc: 'Por debajo del 30% de vida disparas un 40% más rápido.' },
  { id: 'e_ink',     god: 'end',    rar: 1, name: 'Tinta fresca',      desc: 'Una de cada cuatro balas pone una Sentencia al enemigo (40% del daño acumulado en 5 s).' },
  { id: 'e_seal',    god: 'end',    rar: 2, name: 'Sello',             desc: 'Cuando se cumple una Sentencia, el enemigo queda aturdido medio segundo.' },
  { id: 'u_glint',   god: 'light',  rar: 1, name: 'Primer rayo',       desc: 'El primer golpe que le das a cada enemigo lo Ilumina 6 s.' },
  { id: 'u_halo',    god: 'light',  rar: 2, name: 'Halo',              desc: 'Un Iluminado que muere estalla en luz: 100% de daño en área.' },
  { id: 'z_yawn',    god: 'dream',  rar: 1, name: 'Bostezo',           desc: 'Los tres primeros enemigos de cada sala aparecen Dormidos 4 s.' },
  { id: 'z_night',   god: 'dream',  rar: 2, name: 'Mala noche',        desc: 'Al despertar, el enemigo queda frenado a la mitad durante 2 s.' },
  { id: 'o_tug',     god: 'void',   rar: 1, name: 'Tirón',             desc: 'Una de cada cuatro balas tira de los enemigos cercanos hacia el blanco.' },
  { id: 'o_crush',   god: 'void',   rar: 2, name: 'Aplastar',          desc: 'Los enemigos en el centro de un pozo reciben el doble de su daño.' },
  { id: 'q_shard',   god: 'mirror', rar: 1, name: 'Esquirla de espejo', desc: 'Una de cada cinco balas se repite contra el mismo enemigo, a la mitad de daño.' },
  { id: 'q_break',   god: 'mirror', rar: 2, name: 'Siete años',        desc: 'Después de recibir un golpe, tu siguiente disparo hace el triple.' },
  { id: 'a_pup',     god: 'beast',  rar: 1, name: 'Cachorro',          desc: 'Un cachorro te acompaña y muerde a quien disparas (30% de daño).' },
  { id: 'a_feral',   god: 'beast',  rar: 2, name: 'Sed de caza',       desc: 'Cada enemigo que remata el sabueso te cura 2.' },
  { id: 'g_whet',    god: 'forge',  rar: 1, name: 'Bien afilada',      desc: '+8% de daño.' },
  { id: 'g_slag',    god: 'forge',  rar: 2, name: 'Recalentar',        desc: 'Con el Temple al máximo, cada bala salpica en área pequeña (30% del daño).' },
  { id: 'r_judge',   god: 'storm',  rar: 3, name: 'Juicio',            desc: 'Cada descarga llama un rayo del cielo sobre el enemigo: 300% de daño en área.' },
];
const RAR = [{ name: 'Común', color: '#a3a9bd' }, { name: 'Rara', color: '#6fb7ff' }, { name: 'Épica', color: '#c98bff' }, { name: 'Legendaria', color: '#ffd24a' }];
// Maestría: llevar a la misma deidad en 3 acciones (los dúos cuentan para las dos).
const MASTERY = {
  dragon: { name: 'Heredera del fuego',    desc: 'Las Ascuas se apilan hasta 20 y queman un 50% más.' },
  stone:  { name: 'Corazón de la montaña', desc: 'Caben el doble de Cristales y Veta los usa de dos en dos.' },
  venom:  { name: 'Paciente cero',         desc: 'El Veneno hace daño el doble de rápido.' },
  feast:  { name: 'Invitado de honor',     desc: 'Toda la vida que recuperas aumenta un 50%.' },
  orc:    { name: 'Caudillo',              desc: 'La Furia nunca baja de 50.' },
  time:   { name: 'Dueño de la hora',      desc: 'Tus ecos hacen el 100% del daño original.' },
  shade:  { name: 'Reina de los muertos',  desc: 'Tus Sombras hacen un 50% más de daño y duran un 50% más.' },
  tide:   { name: 'Señor del abismo',      desc: 'Cada golpe contra el muro suelta una ola: 150% de daño en área, y empapa.' },
  luck:   { name: 'La casa siempre gana',  desc: 'Tus críticos hacen el 400% del daño en vez del 250%.' },
  wood:   { name: 'Corazón del bosque',    desc: 'Las Raíces duran el doble y, al brotar, el enemigo se queda con dos Semillas ya plantadas.' },
  frost:  { name: 'Invierno eterno',       desc: 'Los enemigos quedan Congelados el doble de tiempo.' },
  blood:  { name: 'Cobro final',           desc: 'Cada enemigo que muere sangrando te cura 2.' },
  end:    { name: 'Letra pequeña',         desc: 'Las Sentencias se cumplen en 3 s en vez de 5.' },
  light:  { name: 'Mediodía',              desc: 'Los enemigos Iluminados no dejan de estarlo.' },
  dream:  { name: 'Sueño profundo',        desc: 'Los Dormidos aguantan un golpe sin despertarse (y ese golpe también pega más).' },
  void:   { name: 'Horizonte',             desc: 'Tus pozos son un 40% más grandes y duran un segundo más.' },
  mirror: { name: 'Sala de espejos',       desc: 'Tienes un segundo Reflejo, a un lado del enemigo.' },
  beast:  { name: 'Jauría',                desc: 'Tienes un segundo sabueso.' },
  forge:  { name: 'Obra maestra',          desc: 'El Temple llega a 15 y ya no se pierde al recibir golpes.' },
  storm:  { name: 'Tormenta perfecta',     desc: 'Un rayo de descarga que alcanza a un enemigo con Agujas también las descarga, en cadena.' },
};
// Planos: mejoras del arma que salen durante la partida (jefes y tienda).
const PLANS = [
  { id: 'echo',    name: 'Arma gemela',   desc: 'Al esquivar dejas una copia del arma donde estabas: dispara sola 3 s a tu cadencia, al 50% de daño y con tus efectos.' },
  { id: 'tempo',   name: 'Compás',        desc: 'El ¡Compás! vale con cualquier llave y hace el doble de daño en vez de +50%. Mantener pulsado o machacar el botón no cuenta.' },
  { id: 'mortar',  name: 'Mortero',       desc: 'La Recámara de rayo deja de lanzar un rayo: lanza un proyectil que pasa por encima de los muros y explota en área.', only: 'c_beam' },
  { id: 'recoil',  name: 'Retroceso',     desc: 'El cargado te lanza hacia atrás como un esquive (activa tus técnicas de esquive) y se recupera un 35% antes.' },
  { id: 'double',  name: 'Doble esquive', desc: 'Llevas una carga más de esquive.' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

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
  { id: 'b_fork',    slot: 'barrel',  name: 'Espingarda triple',    tag: 'Tres bocas',         desc: 'Tres cañones en abanico: una bala va a tu objetivo y otras dos salen a los lados, cada una hacia lo primero que encuentre. Cada bala hace el 60% del daño.', cost: { iron: 2, luck: 2 } },
  { id: 'b_harpoon', slot: 'barrel',  name: 'Arpón',                tag: 'Trae al enemigo',    desc: 'La bala va atada a una cuerda: engancha al enemigo y lo arrastra hacia ti. Sirve para sacar de su sitio a los que disparan desde lejos. +15% de daño.', cost: { iron: 1, tide: 2 } },
  { id: 'b_flame',   slot: 'barrel',  name: 'Sifón de fuego',       tag: 'Chorro en cono',     desc: 'No dispara balas: escupe un chorro corto que quema a todos los enemigos que tengas delante a la vez (la mitad del daño a cada uno) y les clava una Ascua. Dispara un 40% más rápido, pero llega muy cerca.', cost: { iron: 2, dragon: 3 } },
  { id: 'b_back',    slot: 'barrel',  name: 'Cañón de dos bocas',   tag: 'Cubre tu espalda',   desc: 'Una boca mira adelante y otra atrás: cada disparo da a tu objetivo y, a la vez, al enemigo más cercano que tengas a la espalda, los dos con todo el daño.', cost: { iron: 2, shade: 2 } },
  { id: 'b_flail',   slot: 'barrel',  name: 'Mangual',              tag: 'Bola que te rodea',  desc: 'Una bola de hierro gira a tu alrededor y golpea a todo lo que toca (70% del daño). Al disparar la lanzas contra tu objetivo (150%) y tarda un segundo en volver.', cost: { iron: 2, orc: 3 } },
  { id: 'b_boom',    slot: 'barrel',  name: 'Hoz arrojadiza',       tag: 'Va y vuelve',        desc: 'Lanzas una hoz que vuela hasta tu objetivo y vuelve a tu mano: daña a todo lo que cruza a la ida y otra vez a la vuelta (70% cada pasada).', cost: { iron: 2, wood: 2 } },
  { id: 'b_nail',    slot: 'barrel',  name: 'Clavera',              tag: 'Al cuarto, revienta', desc: 'Dispara clavos que se quedan clavados. El cuarto clavo en un mismo enemigo los revienta todos: el triple de daño de golpe. +20% de cadencia.', cost: { iron: 1, storm: 2 } },
  { id: 'b_arc',     slot: 'barrel',  name: 'Cañón de eslabones',   tag: 'Salta entre cuatro', desc: 'La bala no para en el primero: salta de enemigo en enemigo hasta dar a cuatro, perdiendo un 20% de daño en cada salto.', cost: { iron: 2, storm: 3 } },
  { id: 'b_far',     slot: 'barrel',  name: 'Largavista',           tag: 'De lejos, el doble', desc: 'Hace el doble de daño a los enemigos que están lejos (más de dos tercios de tu alcance) y solo la mitad a los que tienes encima. +25% de alcance.', cost: { iron: 1, light: 2 } },
  { id: 'b_swarm',   slot: 'barrel',  name: 'Avispero',             tag: 'Tres dardos sueltos', desc: 'Cada disparo suelta tres dardos que buscan cada uno a un enemigo distinto al azar dentro de tu alcance (45% del daño cada uno).', cost: { iron: 1, beast: 2 } },
  // Piezas temáticas: cada una hace por sí sola un poco de lo que hace una deidad, y con técnicas de esa deidad va a más
  { id: 'b_blow',    slot: 'barrel',  name: 'Cerbatana',            tag: 'Dardos con veneno',  desc: 'Dispara dardos: cada uno aplica 1 de Veneno por sí solo, aunque no lleves nada de Veneno. Si llevas alguna técnica de Veneno, todo el Veneno de tus balas se duplica. Un 15% menos de daño.', cost: { iron: 1, venom: 3 }, theme: 'venom' },
  { id: 'b_wyrm',    slot: 'barrel',  name: 'Boca de sierpe',       tag: 'Clava Ascuas',       desc: 'Un cañón con forma de cabeza de dragón: cada disparo clava 1 Ascua por sí solo. Si llevas alguna técnica de Dragones, los enemigos aguantan 4 Ascuas más antes de llegar al tope.', cost: { iron: 1, dragon: 3 }, theme: 'dragon' },
  { id: 'b_rod',     slot: 'barrel',  name: 'Vara de cobre',        tag: 'Clava Agujas',       desc: 'Cada disparo clava 1 Aguja por sí solo, y cuando un enemigo junta 6 se descargan solas. Si llevas alguna técnica de Tormenta, clava 2.', cost: { iron: 1, storm: 3 }, theme: 'storm' },
  { id: 'b_icicle',  slot: 'barrel',  name: 'Carámbano',            tag: 'Pone Escarcha',      desc: 'Dispara esquirlas de hielo: cada una pone 1 de Escarcha por sí sola, y hacen un 30% más de daño a los Congelados. Si llevas alguna técnica de Hielo, pone 2.', cost: { iron: 1, frost: 3 }, theme: 'frost' },
  { id: 'b_horn',    slot: 'barrel',  name: 'Bocina de trueno',     tag: 'Aturde en cono',     desc: 'No dispara balas: suelta un bramido que golpea a todos los enemigos que tengas delante (40% del daño) y los deja aturdidos un instante. Llega poco.', cost: { iron: 1, dream: 2 } },
  { id: 'b_drill',   slot: 'barrel',  name: 'Berbiquí',             tag: 'Insistir pega más',  desc: 'Cada disparo seguido al mismo enemigo hace un 15% más de daño que el anterior, hasta +150%. Al cambiar de objetivo vuelves a empezar.', cost: { iron: 2, forge: 2 } },
  { id: 'b_ghost',   slot: 'barrel',  name: 'Cañón fantasma',       tag: 'Atraviesa muros',    desc: 'Las balas atraviesan los muros: puedes apuntar y dar a enemigos que no ves. Un 15% menos de daño.', cost: { iron: 2, shade: 3 } },
  { id: 'b_net',     slot: 'barrel',  name: 'Lanzarredes',          tag: 'Atrapa',             desc: 'Cada disparo lanza una red que deja al enemigo clavado en el sitio casi un segundo (una vez cada 3 s por enemigo). Hace el 65% del daño.', cost: { iron: 1, beast: 2 } },
  { id: 'b_ends',    slot: 'barrel',  name: 'Cañón de dos distancias', tag: 'Cerca y lejos',   desc: 'Cada disparo da a la vez al enemigo más cercano y al más lejano que tengas a tiro, con el 80% del daño a cada uno.', cost: { iron: 2, light: 2 } },
  { id: 'a_fuse',    slot: 'action',  name: 'Mecha lenta',          tag: 'Sale con retraso',   desc: 'Pulsas y sigues corriendo: el disparo sale solo medio segundo después, sin frenarte, y hace un 45% más de daño.', cost: { iron: 1, wood: 2 } },
  { id: 'a_auto',    slot: 'action',  name: 'Gatillo de pelo',      tag: 'Dispara sola',       desc: 'El arma dispara sola en cuanto tienes un enemigo a tiro: no hace falta pulsar. Cada bala hace un 20% menos de daño y te frena igual.', cost: { iron: 1, luck: 2 } },
  { id: 'a_pend',    slot: 'action',  name: 'Llave de péndulo',     tag: 'Compás que crece',   desc: 'Cada ¡Compás! seguido suma un 15% de daño al siguiente, hasta +90%. Si un disparo no sale a compás, vuelves a empezar.', cost: { iron: 2, time: 3 } },
  { id: 'a_hold',    slot: 'action',  name: 'Llave de retén',       tag: 'Guarda y suelta',    desc: 'Mantén pulsado para guardar balas, hasta tres. Al soltar salen todas seguidas, cada una con todo el daño.', cost: { iron: 2, feast: 2 } },
  { id: 'a_spring',  slot: 'action',  name: 'Llave de resorte',     tag: 'Esperar pega más',   desc: 'Cuanto más esperas con el arma lista sin disparar, más pega el siguiente disparo: +50% por cada segundo, hasta el triple.', cost: { iron: 1, end: 2 } },
  { id: 'a_alt',     slot: 'action',  name: 'Llave alterna',        tag: 'Uno flojo, uno fuerte', desc: 'Alterna dos disparos: uno rápido que casi no te frena (60% de daño) y uno fuerte con el doble de frenazo (180%).', cost: { iron: 1, mirror: 2 } },
  { id: 'a_combo',   slot: 'action',  name: 'Llave de insistencia', tag: 'Mismo blanco, más rápido', desc: 'Cada disparo seguido al mismo enemigo sale un 8% más rápido, hasta +64%. Al cambiar de objetivo vuelves a empezar.', cost: { iron: 2, beast: 2 } },
  { id: 'a_rider',   slot: 'action',  name: 'Llave de jinete',      tag: 'Dispara al esquivar', desc: 'Cada vez que esquivas, el arma dispara sola al enemigo más cercano con un 30% más de daño, sin gastar tu disparo.', cost: { iron: 1, void: 2 } },
  { id: 'a_kick',    slot: 'action',  name: 'Llave de trueno',      tag: 'El tercero, cañonazo', desc: 'Cada tercer disparo es un cañonazo: más del doble de daño y lanza al enemigo hacia atrás.', cost: { iron: 2, forge: 2 } },
  { id: 'a_drum',    slot: 'action',  name: 'Llave de tambor',      tag: 'Da Furia',           desc: 'Cada disparo te da 8 de Furia por sí solo, y con la Furia llena disparas un 25% más rápido. Si llevas alguna técnica de Orcos, da 12.', cost: { iron: 1, orc: 3 }, theme: 'orc' },
  { id: 'a_glass',   slot: 'action',  name: 'Llave de clepsidra',   tag: 'Deja ecos',          desc: 'Uno de cada tres disparos deja un eco por sí solo: se repite un segundo después al 60%. Si llevas alguna técnica de Tiempo, lo deja uno de cada dos.', cost: { iron: 1, time: 3 }, theme: 'time' },
  { id: 'a_dice',    slot: 'action',  name: 'Llave de tahúr',       tag: 'Críticos propios',   desc: 'Cada disparo tiene un 15% de ser crítico por sí solo (250% de daño). Si llevas alguna técnica de Fortuna, un 25%.', cost: { iron: 1, luck: 3 }, theme: 'luck' },
  { id: 'a_nana',    slot: 'action',  name: 'Llave de nana',        tag: 'Duerme',             desc: 'Uno de cada seis disparos Duerme al enemigo 2 segundos por sí solo. Si llevas alguna técnica de Sueño, uno de cada cuatro.', cost: { iron: 1, dream: 3 }, theme: 'dream' },
  { id: 'a_fly',     slot: 'action',  name: 'Llave de volante',     tag: 'Coge inercia',       desc: 'Mientras no dejes de disparar, el arma va cogiendo inercia: hasta un 60% más de cadencia a los cinco segundos. Un segundo sin disparar y se pierde.', cost: { iron: 1, void: 2 } },
  { id: 'a_fin',     slot: 'action',  name: 'Llave de remate',      tag: 'Remata sin frenar',  desc: 'Disparar a un enemigo que tiene menos de un cuarto de vida no te frena ni gasta recarga: puedes rematar al instante.', cost: { iron: 1, end: 2 } },
  { id: 'a_firm',    slot: 'action',  name: 'Llave de pie firme',   tag: 'Quieto, más rápido', desc: 'Parado disparas un 50% más rápido; en movimiento, un 20% más despacio.', cost: { iron: 1, frost: 2 } },
  { id: 'a_rota',    slot: 'action',  name: 'Llave de ronda',       tag: 'Reparte los tiros',  desc: 'Cada disparo va a un enemigo distinto del anterior, y hace un 30% más de daño.', cost: { iron: 1, mirror: 2 } },
  { id: 'a_over',    slot: 'action',  name: 'Llave de sobrecarga',  tag: 'Uno enorme cada 10 s', desc: 'Cada diez segundos el arma se sobrecarga: tu siguiente disparo hace el cuádruple de daño.', cost: { iron: 2, blood: 2 } },
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
  { id: 'm_silver',  slot: 'mag',     name: 'Bala de plata',        tag: 'Caza mayores',       desc: '+60% de daño contra élites, elegidos y jefes, y un 10% menos contra el resto. Los élites sueltan el doble de oro.', cost: { iron: 1, shade: 2 } },
  { id: 'm_frag',    slot: 'mag',     name: 'Bala de metralla',     tag: 'Estalla al matar',   desc: 'Cuando una bala mata, estalla en cinco esquirlas que vuelan hacia los enemigos cercanos (30% del daño cada una).', cost: { iron: 1, stone: 2 } },
  { id: 'm_blood',   slot: 'mag',     name: 'Bala de sangre',       tag: 'Pagas con vida',     desc: 'Cada disparo te cuesta 1 de vida y hace un 40% más de daño. Cada enemigo que matas te devuelve 3.', cost: { iron: 1, feast: 2 } },
  { id: 'm_last',    slot: 'mag',     name: 'Última bala',          tag: 'La sexta, triple',   desc: 'Un cargador de seis: las cinco primeras son normales y la sexta hace el triple de daño. Después recargas durante algo más de un segundo.', cost: { iron: 1, luck: 2 } },
  { id: 'm_ice',     slot: 'mag',     name: 'Bala de escarcha',     tag: 'Frena y congela',    desc: 'Cada bala frena al enemigo un 30% durante un segundo y medio. Si le das mientras ya está frenado, se congela: queda aturdido casi un segundo (una vez cada 3 s por enemigo).', cost: { iron: 1, tide: 2 } },
  { id: 'm_fire',    slot: 'mag',     name: 'Bala incendiaria',     tag: 'Deja fuego',         desc: 'Cada bala deja una llama en el suelo bajo el enemigo durante dos segundos, que clava Ascuas a quien la pise.', cost: { iron: 1, dragon: 2 } },
  { id: 'm_gold',    slot: 'mag',     name: 'Bala de oro',          tag: 'Disparas monedas',   desc: 'Cada disparo gasta 1 de oro y hace un 35% más de daño. Sin oro, hace un 20% menos. Cada baja te da 1 de oro.', cost: { iron: 1, luck: 2 } },
  { id: 'm_split',   slot: 'mag',     name: 'Bala partida',         tag: 'Se abre en dos',     desc: 'Al dar en el blanco, la bala se parte en dos trozos que salen en diagonal y dan a lo primero que encuentren (35% cada uno).', cost: { iron: 1, mirror: 2 } },
  { id: 'm_mark',    slot: 'mag',     name: 'Bala trazadora',       tag: 'Tres, y marcado',    desc: 'La tercera bala en un mismo enemigo lo deja marcado 5 segundos: recibe un 30% más de daño de todo.', cost: { iron: 1, light: 2 } },
  { id: 'm_big',     slot: 'mag',     name: 'Bala de calibre',      tag: 'Salpica',            desc: 'Balas enormes: +20% de daño, y los enemigos pegados al blanco reciben la mitad.', cost: { iron: 2, forge: 2 } },
  { id: 's_roll',    slot: 'stock',   name: 'Culata de volatinero', tag: 'Dos esquives cortos', desc: 'Llevas un esquive más, pero cada uno llega un 35% menos lejos.', cost: { iron: 1, dream: 2 } },
  { id: 's_anchor',  slot: 'stock',   name: 'Culata de ancla',      tag: 'Cargando, aguantas', desc: 'Mientras mantienes el disparo cargado recibes la mitad de daño.', cost: { iron: 1, tide: 2 } },
  { id: 's_sprint',  slot: 'stock',   name: 'Culata de corredor',   tag: 'Sin disparar, corres', desc: 'Si llevas dos segundos sin disparar, corres un 35% más rápido hasta que vuelvas a hacerlo.', cost: { iron: 1, frost: 2 } },
  { id: 's_venge',   slot: 'stock',   name: 'Culata de rencor',     tag: 'Te pegan, pegas',    desc: 'Cuando te golpean, tus tres siguientes disparos hacen el doble de daño.', cost: { iron: 1, blood: 2 } },
  { id: 's_gasp',    slot: 'stock',   name: 'Culata del último aliento', tag: 'Casi muerto, vuelas', desc: 'Por debajo de un cuarto de vida te mueves un 30% más rápido y el esquive se recarga el doble de deprisa.', cost: { iron: 1, end: 2 } },
  { id: 'm_seed',    slot: 'mag',     name: 'Bala de bellota',      tag: 'Planta Semillas',    desc: 'Cada bala planta una Semilla por sí sola; a la tercera brotan en Raíces. Si llevas alguna técnica de Bosque, brotan a la segunda.', cost: { iron: 1, wood: 3 }, theme: 'wood' },
  { id: 'm_salt',    slot: 'mag',     name: 'Bala de sal',          tag: 'Empapa y empuja',    desc: 'Cada bala Empapa al enemigo y lo empuja un poco por sí sola, y hace un 15% más a los que ya estaban Empapados. Si llevas alguna técnica de Mareas, empuja el doble.', cost: { iron: 1, tide: 3 }, theme: 'tide' },
  { id: 'm_saw',     slot: 'mag',     name: 'Bala serrada',         tag: 'Abre Heridas',       desc: 'Cada bala abre una Herida por sí sola. Si llevas alguna técnica de Sangre, abre dos.', cost: { iron: 1, blood: 3 }, theme: 'blood' },
  { id: 'm_quick',   slot: 'mag',     name: 'Bala de azogue',       tag: 'Vuelve del espejo',  desc: 'Una de cada cuatro balas vuelve desde el otro lado del enemigo y le da otra vez, a la mitad de daño. Si llevas alguna técnica de Espejos, una de cada dos.', cost: { iron: 1, mirror: 3 }, theme: 'mirror' },
  { id: 'm_star',    slot: 'mag',     name: 'Bala de lucero',       tag: 'Ilumina',            desc: 'Cada bala Ilumina al enemigo 4 segundos por sí sola, y tus balas hacen un 12% más a los Iluminados. Si llevas alguna técnica de Luz, un 25%.', cost: { iron: 1, light: 3 }, theme: 'light' },
  { id: 's_grave',   slot: 'stock',   name: 'Culata de lápida',     tag: 'Levanta Sombras',    desc: 'Cada ocho enemigos que matas, el último se levanta como Sombra por sí solo. Si llevas alguna técnica de Sombras, cada cinco.', cost: { iron: 1, shade: 3 }, theme: 'shade' },
  { id: 's_wine',    slot: 'stock',   name: 'Culata de bota de vino', tag: 'Cura y Reserva',   desc: 'Cada baja te cura 1 por sí sola, y con la vida llena se guarda como Reserva. Si llevas alguna técnica de Manjares, cura 2.', cost: { iron: 1, feast: 3 }, theme: 'feast' },
  { id: 's_kennel',  slot: 'stock',   name: 'Culata de perrera',    tag: 'Trae un cachorro',   desc: 'Un cachorro te acompaña y muerde a quien disparas (30% de daño). Si llevas alguna técnica de Bestias, tienes un sabueso más.', cost: { iron: 1, beast: 3 }, theme: 'beast' },
  { id: 's_geode',   slot: 'stock',   name: 'Culata de geoda',      tag: 'Deja Cristales',     desc: 'Al esquivar dejas un Cristal por sí sola, y cada vez que disparas tus Cristales lanzan una esquirla a tu objetivo (20% de daño). Si llevas alguna técnica de Minerales, un 40%.', cost: { iron: 1, stone: 3 }, theme: 'stone' },
  { id: 'm_blunt',   slot: 'mag',     name: 'Bala roma',            tag: 'La quinta aturde',   desc: 'Una de cada cinco balas deja al enemigo aturdido algo más de medio segundo.', cost: { iron: 1, dream: 2 } },
  { id: 'm_grow',    slot: 'mag',     name: 'Bala voraz',           tag: 'Crece matando',      desc: 'Cada enemigo que matas con una bala sube un 2% el daño de tus balas durante toda la misión, hasta +60%.', cost: { iron: 2, blood: 2 } },
  { id: 'm_awl',     slot: 'mag',     name: 'Bala de punzón',       tag: 'Da al de detrás',    desc: 'La bala atraviesa al blanco y da también al enemigo que tenga justo detrás, con el 60% del daño.', cost: { iron: 1, end: 2 } },
  { id: 'm_timed',   slot: 'mag',     name: 'Bala de mecha',        tag: 'Explota después',    desc: 'La bala se queda clavada y explota un segundo después, dañando en área pequeña (la mitad del daño).', cost: { iron: 1, void: 2 } },
  { id: 'm_leech',   slot: 'mag',     name: 'Bala sanguijuela',     tag: 'Cura cada ocho',     desc: 'Cada ocho impactos te curas 2 de vida.', cost: { iron: 1, frost: 2 } },
  { id: 's_sapper',  slot: 'stock',   name: 'Culata de zapador',    tag: 'Pegado al muro',     desc: 'Mientras estás pegado a un muro haces un 30% más de daño.', cost: { iron: 1, dream: 2 } },
  { id: 's_dance',   slot: 'stock',   name: 'Culata de bailarín',   tag: 'Atravesar recarga',  desc: 'Si tu esquive atraviesa a un enemigo, recuperas el esquive al momento (una vez por esquive).', cost: { iron: 1, mirror: 2 } },
  { id: 's_tower',   slot: 'stock',   name: 'Culata de torre',      tag: 'Sin esquive',        desc: 'No puedes esquivar. A cambio recibes un 30% menos de daño y haces un 25% más.', cost: { iron: 2, forge: 2 } },
  { id: 's_loot',    slot: 'stock',   name: 'Culata de saqueador',  tag: 'Más oro',            desc: 'Todo el oro que consigues aumenta un 50%.', cost: { iron: 1, light: 2 } },
  { id: 's_wind',    slot: 'stock',   name: 'Culata de segundo aire', tag: 'Te levanta una vez', desc: 'Una vez por sala, si bajas del 30% de vida recuperas un 20% de golpe.', cost: { iron: 1, void: 2 } },
  { id: 's_spring',  slot: 'stock',   name: 'Culata de muelle',     tag: 'Salto tras disparar', desc: 'Después de cada disparo das un salto corto en la dirección en que te estés moviendo. Kitear es casi automático.', cost: { iron: 1, wood: 2 } },
  { id: 's_shield',  slot: 'stock',   name: 'Culata con rodela',    tag: 'Para un golpe',      desc: 'Un pequeño escudo para el primer golpe que recibas, entero. Se recupera a los 6 segundos; lo ves girar a tu lado cuando está listo.', cost: { iron: 2, stone: 2 } },
  { id: 's_scope',   slot: 'stock',   name: 'Culata de catalejo',   tag: 'Primer tiro',        desc: 'El primer disparo que le das a cada enemigo hace un 80% más de daño. +15% de alcance.', cost: { iron: 1, storm: 2 } },
  { id: 's_spikes',  slot: 'stock',   name: 'Culata de púas',       tag: 'Esquive que hiere',  desc: 'Esquivar pasando por encima de un enemigo le hace el 150% de tu daño y lo aturde un momento.', cost: { iron: 1, venom: 2 } },
  { id: 's_bone',    slot: 'stock',   name: 'Empuñadura de hueso',  tag: 'Herido, más rápido', desc: 'Cuanta menos vida te queda, más rápido disparas: hasta un 50% más cuando estás por debajo de un cuarto de vida.', cost: { iron: 1, orc: 2 } },
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
  { id: 'c_mine',    slot: 'chamber', name: 'Recámara de minas',    tag: 'Tres minas',         desc: 'El disparo cargado deja tres minas en el suelo a tu alrededor. Aguantan 12 segundos y revientan cuando un enemigo las pisa.', cost: { iron: 1, wood: 2 } },
  { id: 'c_nova',    slot: 'chamber', name: 'Recámara de anillo',   tag: 'Onda que aparta',    desc: 'El disparo cargado suelta una onda a tu alrededor que daña y lanza lejos a todos los enemigos cercanos. Los que chocan contra un muro reciben el golpe extra.', cost: { iron: 2, tide: 2 } },
  { id: 'c_turret',  slot: 'chamber', name: 'Recámara de centinela', tag: 'Deja un arma fija', desc: 'El disparo cargado clava en el suelo una copia de tu arma que dispara sola durante 6 segundos, a tu ritmo y con tus efectos, al 80% del daño.', cost: { iron: 2, time: 2 } },
  { id: 'c_snipe',   slot: 'chamber', name: 'Recámara de verdugo',  tag: 'Un tiro al más fuerte', desc: 'El disparo cargado es un único tiro al enemigo con más vida que tengas a la vista: el doble de daño que un cargado normal. Si lo mata, el cargado vuelve al instante.', cost: { iron: 2, luck: 3 } },
  { id: 'c_meteor',  slot: 'chamber', name: 'Recámara de meteoro',  tag: 'Cae del cielo',      desc: 'El disparo cargado llama un proyectil enorme que cae un segundo después donde apuntas: muchísimo daño en un área grande.', cost: { iron: 2, void: 2 } },
  { id: 'c_chain',   slot: 'chamber', name: 'Recámara de cadena',   tag: 'Salta entre seis',   desc: 'El disparo cargado es un rayo que salta de enemigo en enemigo, hasta seis, sin perder fuerza.', cost: { iron: 2, storm: 2 } },
  { id: 'c_balm',    slot: 'chamber', name: 'Recámara de bálsamo',  tag: 'Te cura',            desc: 'El disparo cargado no hace daño: te cura el 10% de tu vida y aparta a los enemigos que tengas encima.', cost: { iron: 2, feast: 3 } },
  { id: 'c_bounce',  slot: 'chamber', name: 'Recámara de carambola', tag: 'Rebota cinco veces', desc: 'El disparo cargado es una bala que rebota en los muros hasta cinco veces, dañando a todo lo que cruza en cada tramo.', cost: { iron: 2, mirror: 2 } },
  { id: 'c_volley',  slot: 'chamber', name: 'Recámara de salva',    tag: 'Ocho disparos',      desc: 'El disparo cargado suelta ocho disparos seguidos contra tu objetivo, cada uno con tus efectos de disparo.', cost: { iron: 2, beast: 2 } },
  { id: 'c_sima',    slot: 'chamber', name: 'Recámara de sima',     tag: 'Abre un pozo',       desc: 'El disparo cargado abre un pozo por sí solo donde apuntas: arrastra a los enemigos dos segundos, los daña y al cerrarse estalla. Si llevas alguna técnica de Vacío, dura el doble.', cost: { iron: 2, void: 3 }, theme: 'void' },
  { id: 'c_doom',    slot: 'chamber', name: 'Recámara de sentencia', tag: 'Pone Sentencias',   desc: 'El disparo cargado es un rayo que pone una Sentencia a todos los que atraviesa: a los 5 segundos reciben de golpe parte del daño que les hayas hecho. Si llevas alguna técnica de Final, devuelven un 50% más.', cost: { iron: 2, end: 3 }, theme: 'end' },
  { id: 'c_anvil',   slot: 'chamber', name: 'Recámara de yunque',   tag: 'Da Temple',          desc: 'El disparo cargado es un martillazo a tu alrededor que aturde, y cada enemigo golpeado te da 1 de Temple por sí solo (+3% de daño cada punto). Si llevas alguna técnica de Forja, da 2.', cost: { iron: 2, forge: 3 }, theme: 'forge' },
  { id: 'c_ward',    slot: 'chamber', name: 'Recámara de baluarte', tag: 'Dos segundos intocable', desc: 'El disparo cargado no ataca: te hace invulnerable dos segundos y aparta a los enemigos que tengas encima.', cost: { iron: 2, frost: 2 } },
  { id: 'c_blink',   slot: 'chamber', name: 'Recámara de salto',    tag: 'Te lleva allí',      desc: 'El disparo cargado te traslada de golpe a donde apuntas (o junto a tu objetivo) y revienta al llegar.', cost: { iron: 2, mirror: 2 } },
  { id: 'c_drain',   slot: 'chamber', name: 'Recámara de sanguijuela', tag: 'Rayo que cura',   desc: 'El disparo cargado es un rayo en línea que te devuelve como vida el 30% del daño que hace.', cost: { iron: 2, blood: 2 } },
  { id: 'c_brand',   slot: 'chamber', name: 'Recámara de condena',  tag: 'Marca a todos',      desc: 'El disparo cargado marca a todos los enemigos que tengas a la vista: durante 6 segundos reciben un 30% más de daño de todo.', cost: { iron: 2, light: 2 } },
  { id: 'c_quake',   slot: 'chamber', name: 'Recámara de terremoto', tag: 'Aturde la sala',    desc: 'El disparo cargado sacude la sala entera: todos los enemigos reciben un tercio del daño de un cargado y quedan aturdidos un segundo.', cost: { iron: 2, beast: 2 } },
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
  { id: 'widow',    name: 'La Viuda',            parts: ['b_blow', 'm_saw', 's_spikes'],    lore: 'Una cerbatana de hueso que nadie ha visto usar dos veces contra el mismo hombre.', desc: 'Cada Herida que abres aplica también 1 de Veneno, y a los enemigos que están envenenados y heridos a la vez las dos cosas les hacen el doble.' },
  { id: 'winter',   name: 'Invierno del Norte',  parts: ['b_icicle', 'm_ice', 'c_nova'],    lore: 'Forjada en una fragua que se apagó sola. El hierro nunca volvió a calentarse.', desc: 'La onda del disparo cargado congela al instante a todo lo que alcanza.' },
  { id: 'choir',    name: 'El Coro',             parts: ['a_glass', 'm_quick', 'c_volley'], lore: 'Dispara una vez y se oyen nueve. Los que la han oído dicen que canta.', desc: 'Cada uno de los ocho disparos de la salva cargada deja un eco que vuelve a impactar poco después.' },
  { id: 'pack',     name: 'La Jauría',           parts: ['s_kennel', 'b_swarm', 'a_rider'], lore: 'El maestro de Alec decía que un arma con perros no necesita puntería.', desc: 'Dos sabuesos más pelean a tu lado.' },
  { id: 'blacksun', name: 'Sol Negro',           parts: ['c_sima', 'm_star', 'b_far'],      lore: 'Una luz que no alumbra: solo señala dónde va a caer todo.', desc: 'Los enemigos atrapados en uno de tus pozos quedan Iluminados y reciben un 50% más de daño de todo.' },
  { id: 'master',   name: 'Martillo del Maestro', parts: ['c_anvil', 'a_kick', 'm_big'],    lore: 'Lo último que forjó el herrero que crio a Alec. No llegó a templarlo.', desc: 'El Temple puede llegar 10 puntos más alto, y cada cañonazo de la Llave de trueno revienta en área.' },
  { id: 'lastword', name: 'La Última Palabra',   parts: ['c_doom', 'a_spring', 'm_last'],   lore: 'Seis balas. La sexta no falla porque ya está escrito.', desc: 'La sexta bala del cargador cumple al instante todas las Sentencias que haya en la sala.' },
  { id: 'tempest',  name: 'Tempestad',           parts: ['b_rod', 'a_rotary', 'm_chain'],   lore: 'Hay que sujetarla con guantes. Aun así, muerde.', desc: 'Los enemigos se descargan solos al juntar 3 Agujas en vez de 6.' },
  { id: 'breaker',  name: 'La Rompemuros',       parts: ['b_pierce', 'm_heavy', 's_heavy'], lore: 'Dicen que el herrero la forjó en una vida anterior y que aún recuerda cada muro.', desc: 'La bala de la culebrina rebota hasta cuatro veces en vez de una, y cada rebote hace un 25% más de daño.' },
];
const legOf = g => LEGENDS.find(L => L.parts.every(id => g[PART[id].slot] === id)) || null;
// El nombre del arma sale de lo que lleva montado
function gunName(g) {
  { const L = legOf(g); if (L) return L.name; }
  const B = g.barrel, A = g.action, suf = { a_semi: ' de chispa', a_burst: ' de salvas', a_fuse: ' de mecha lenta', a_auto: ' de gatillo fino', a_pend: ' de péndulo', a_hold: ' de retén', a_spring: ' de resorte', a_alt: ' alterno', a_combo: ' de insistencia', a_drum: ' de tambor', a_fly: ' de volante', a_fin: ' de remate', a_firm: ' de pie firme', a_rota: ' de ronda', a_over: ' de sobrecarga', a_glass: ' de clepsidra', a_dice: ' de tahúr', a_nana: ' de nana', a_rider: ' de jinete', a_kick: ' de trueno' }[A] || '';
  if (B === 'b_spike') return A === 'a_rotary' ? 'Berbiquí de guerra' : A === 'a_draw' ? 'Pica de carga' : A === 'a_burst' ? 'Tridente' : A === 'a_semi' ? 'Estoque' : 'Lanza';
  if (A === 'a_draw') return B === 'b_pierce' ? 'Ballesta de asedio' : B === 'b_twin' ? 'Ballesta doble' : B === 'b_scatter' ? 'Ballesta de virotes' : B === 'b_short' ? 'Ballesta de mano' : B === 'b_bomb' ? 'Onagro' : 'Ballesta';
  if (A === 'a_rotary') return B === 'b_scatter' ? 'Órgano de metralla' : B === 'b_twin' ? 'Ribadoquines gemelos' : B === 'b_short' ? 'Ribadoquín ligero' : B === 'b_pierce' ? 'Órgano de culebrinas' : B === 'b_bomb' ? 'Batería de bombardas' : 'Ribadoquín';
  if (B === 'b_scatter') return 'Trabuco' + suf;
  if (B === 'b_twin') return 'Pistoletes gemelos' + suf;
  if (B === 'b_short') return 'Pistolete' + suf;
  if (B === 'b_pierce') return 'Culebrina' + suf;
  if (B === 'b_bomb') return A === 'a_semi' ? 'Mortero de mano' : 'Bombarda' + suf;
  if (B === 'b_horn') return 'Bocina de trueno';
  if (B === 'b_drill') return 'Berbiquí' + suf;
  if (B === 'b_ghost') return 'Arcabuz fantasma' + suf;
  if (B === 'b_net') return 'Lanzarredes' + suf;
  if (B === 'b_ends') return 'Arcabuz de dos distancias' + suf;
  if (B === 'b_blow') return 'Cerbatana' + suf;
  if (B === 'b_wyrm') return 'Boca de sierpe' + suf;
  if (B === 'b_rod') return 'Vara de cobre' + suf;
  if (B === 'b_icicle') return 'Carámbano' + suf;
  if (B === 'b_boom') return 'Hoz arrojadiza';
  if (B === 'b_nail') return 'Clavera' + suf;
  if (B === 'b_arc') return 'Cañón de eslabones' + suf;
  if (B === 'b_far') return 'Largavista' + suf;
  if (B === 'b_swarm') return 'Avispero' + suf;
  if (B === 'b_fork') return 'Espingarda triple' + suf;
  if (B === 'b_harpoon') return 'Arpón' + suf;
  if (B === 'b_flame') return 'Sifón de fuego';
  if (B === 'b_back') return 'Arcabuz de dos bocas' + suf;
  if (B === 'b_flail') return 'Mangual';
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
  { id: 'coldiron',     name: 'Hierro frío',         parts: ['m_ice'],     techs: ['frost_basic'],  desc: 'La Bala de escarcha pone además 1 de Escarcha.' },
  { id: 'packhunt',     name: 'Montería',            parts: ['b_swarm'],   techs: ['beast_basic'],  desc: 'El sabueso salta y muerde al primer enemigo que alcanza cada andanada del Avispero.' },
  { id: 'deathclock',   name: 'Hora señalada',       parts: ['a_spring'],  techs: ['end_basic'],    desc: 'Un disparo de resorte cargado al máximo cumple la Sentencia al instante.' },
  { id: 'mirrorhall',   name: 'Galería de espejos',  parts: ['m_split'],   techs: ['mirror_basic'], desc: 'Los trozos de la Bala partida hacen el doble.' },
  { id: 'bloodprice',   name: 'Deuda saldada',       parts: ['m_blood'],   techs: ['blood_charge'], desc: 'La Sangría ya no te cuesta vida.' },
  { id: 'eventide',     name: 'Horizonte de sucesos', parts: ['c_meteor'], techs: ['void_charge'],  desc: 'El meteoro cae sobre la Singularidad y arrastra a todos hacia el impacto antes de caer.' },
  { id: 'sunbeam',      name: 'Rayo de sol',         parts: ['b_far'],     techs: ['light_basic'],  desc: 'Un disparo lejano de la Largavista Ilumina también a los enemigos de alrededor del blanco.' },
  { id: 'lullaby',      name: 'Nana',                parts: ['a_fuse'],    techs: ['dream_basic'],  desc: 'La bala de la Mecha lenta siempre Duerme al enemigo.' },
  { id: 'anvilsong',    name: 'Canto del yunque',    parts: ['a_kick'],    techs: ['forge_basic'],  desc: 'Cada cañonazo de la Llave de trueno te da 2 de Temple.' },
  { id: 'tidalhook',    name: 'Resaca',              parts: ['b_harpoon'], techs: ['tide_basic'],   desc: 'El enemigo que arrastra el Arpón llega Empapado y aturdido.' },
  { id: 'thornmine',    name: 'Semillero',           parts: ['c_mine'],    techs: ['wood_charge'],  desc: 'Cada mina deja un zarzal al estallar.' },
  { id: 'crossfire',    name: 'Fuego cruzado',       parts: ['a_semi'],    techs: ['stone_passive'], desc: 'Los Cristales repiten tus balas al doble de daño.' },
];
const RES = Object.fromEntries(RESO.map(x => [x.id, x]));
// Afinidad: cada pieza se forja con el material de una deidad. Si llevas alguna técnica de esa deidad, la pieza la potencia.
// El efecto se suma por cada pieza afín que lleves montada.
const AFFIN = {
  dragon: 'las Ascuas queman un 12% más', stone: 'los Cristales duran un 20% más', venom: 'el Veneno hace un 10% más de daño', feast: 'te curas un 10% más',
  orc: 'ganas un 15% más de Furia', time: 'tus ecos hacen un 8% más de daño', shade: '+2% de daño por cada Sombra viva', storm: 'las descargas hacen un 10% más',
  tide: 'los golpes contra el muro hacen un 20% más', luck: '+3% de crítico', wood: 'las Raíces duran un 15% más', frost: 'los Congelados lo están 0,3 s más',
  blood: 'las Heridas sangran un 12% más', end: 'las Sentencias devuelven 6 puntos más', light: 'los Iluminados se reparten 4 puntos más de daño', dream: 'los enemigos duermen 0,4 s más',
  void: 'tus pozos son un 10% más grandes', mirror: 'el Reflejo hace un 10% más de daño', beast: 'el sabueso muerde un 12% más fuerte', forge: 'el Temple máximo sube en 1',
};
const affGod = id => { const c = PART[id] && PART[id].cost; return c ? Object.keys(c).find(k => k !== 'iron') : null; };
// Ensambles: dos piezas concretas que se potencian entre sí (un arma legendaria pide tres; esto es el escalón de antes)
const ENSEMBLES = [
  { id: 'ram',      name: 'Ariete',            parts: ['b_scatter', 'm_heavy'],  desc: 'Los golpes contra el muro hacen un 60% más de daño.' },
  { id: 'splinter', name: 'Astillas',          parts: ['b_pierce', 'm_split'],   desc: 'Los trozos de la Bala partida hacen el doble.' },
  { id: 'trail',    name: 'Reguero',           parts: ['a_rotary', 'm_fire'],    desc: 'Las llamas de la Bala incendiaria duran el triple.' },
  { id: 'cluster',  name: 'Racimo',            parts: ['b_bomb', 'm_frag'],      desc: 'La metralla suelta ocho esquirlas en vez de cinco y llegan más lejos.' },
  { id: 'siege',    name: 'Tiro de asedio',    parts: ['a_draw', 's_brace'],     desc: 'Un disparo tensado a tope estando quieto hace un 60% más.' },
  { id: 'hare',     name: 'Liebre',            parts: ['s_spring', 'a_semi'],    desc: 'El salto de la Culata de muelle llega el doble de lejos.' },
  { id: 'mill',     name: 'Molino',            parts: ['b_flail', 's_spikes'],   desc: 'Durante dos segundos tras esquivar, la bola del Mangual gira el triple de rápido.' },
  { id: 'rivet',    name: 'Remaches',          parts: ['b_nail', 'm_big'],       desc: 'Cuando los clavos revientan, los enemigos de alrededor reciben el mismo golpe.' },
  { id: 'watch',    name: 'Guardia',           parts: ['c_turret', 'a_auto'],    desc: 'La centinela dura el doble.' },
  { id: 'bastion',  name: 'Bastión',           parts: ['s_shield', 'c_balm'],    desc: 'Usar el bálsamo recarga la rodela al instante.' },
  { id: 'marksman', name: 'Tirador',           parts: ['b_long', 's_scope'],     desc: 'El primer tiro a cada enemigo hace el triple en vez de +80%.' },
  { id: 'gambler',  name: 'Tahúr',             parts: ['m_gold', 'a_kick'], desc: 'El cañonazo de la Llave de trueno te devuelve 3 de oro.' },
];
const ensOf = g => ENSEMBLES.filter(E => E.parts.every(id => g[PART[id].slot] === id));

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
  [/Escarcha|Congelad|congela/, 'Escarcha', 'cada punto frena al enemigo; al quinto queda Congelado: no se mueve ni ataca, y puede romperse.'],
  [/Heridas?\b|sangra/, 'Heridas', 'el enemigo pierde vida cada medio segundo; más cuanto más herido estés tú.'],
  [/Sentencias?/, 'Sentencia', 'una cuenta atrás sobre el enemigo: al acabar recibe de golpe parte del daño que le hiciste mientras tanto.'],
  [/Ilumina/, 'Iluminado', 'marcado con luz unos segundos: parte del daño que recibe uno lo reciben todos los Iluminados.'],
  [/Dormid|Duerme/, 'Dormido', 'no se mueve ni ataca hasta que un golpe lo despierta; ese golpe hace más daño.'],
  [/pozo|Singularidad/, 'Pozo', 'un punto que arrastra hacia él a los enemigos cercanos.'],
  [/Reflejo/, 'Reflejo', 'una copia tuya que se coloca al otro lado de tu objetivo.'],
  [/sabueso/, 'Sabueso', 'un perro que te sigue y muerde por su cuenta al enemigo que disparas.'],
  [/Temple/, 'Temple', 'puntos que el arma acumula al disparar: cada uno, +3% de daño. Recibir un golpe quita la mitad.'],
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
// ───────────────────────── Utilidades ─────────────────────────
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const rnd = (a, b) => a + Math.random() * (b - a);

const cv = $('game');
const scr = cv.getContext('2d');
// El mundo se pinta en un lienzo pequeño (1 unidad = 1 píxel) y se amplía por un número entero: una sola rejilla de píxeles
const lo = document.createElement('canvas'), ctx = lo.getContext('2d');
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
const I = { mx: 0, my: 0, ax: 0, ay: 0, atk: false, atkP: false, dodgeP: false, chg: false, startP: false, clearP: false, chgP: false, navL: false, navR: false, navX: 0, navY: 0, tabP: false };
const navRep = { x: 0, y: 0, at: 0 };
const prev = { tab: false, atk: false, dodge: false, start: false, clear: false, chg: false, nav: 0 };

addEventListener('keydown', e => {
  if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
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
  let mx = 0, my = 0, ax = 0, ay = 0, atk = false, dodge = false, chg = false, start = false, clear = false, nav = 0, tab = down('KeyQ') || down('Tab');

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
    clear = clear || b(11); tab = tab || b(4);
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
  // Navegación por menús en dos ejes: gana el eje dominante; al mantener, repite
  { const nx = Math.abs(mx) > 0.6 && Math.abs(mx) >= Math.abs(my) ? Math.sign(mx) : 0, ny = !nx && Math.abs(my) > 0.6 ? Math.sign(my) : 0, t = performance.now();
    I.navX = I.navY = 0;
    if (nx !== navRep.x || ny !== navRep.y) { navRep.x = nx; navRep.y = ny; navRep.at = t + 380; I.navX = nx; I.navY = ny; }
    else if ((nx || ny) && t >= navRep.at) { navRep.at = t + 150; I.navX = nx; I.navY = ny; } }

  I.mx = mx; I.my = my; I.ax = ax; I.ay = ay; I.atk = atk; I.chg = chg;
  I.atkP = atk && !prev.atk;
  I.dodgeP = dodge && !prev.dodge;
  I.startP = start && !prev.start;
  I.clearP = clear && !prev.clear;
  I.chgP = chg && !prev.chg; prev.chg = chg;
  I.tabP = tab && !prev.tab; prev.tab = tab;
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

// ───────────────────────── Lo que queda entre vidas ─────────────────────────
// Almas (solo en salas de almas) para tu árbol. Hierro Místico y materiales de cada deidad para forjar.
// Se guarda en el navegador, igual que la partida en curso.
const zeroMats = () => Object.fromEntries(GOD_KEYS.map(g => [g, 0]));
let M = { done: {}, souls: 0, iron: 0, mats: zeroMats(), runs: 0, best: 0, wins: 0, parts: {}, gun: Object.assign({}, BASE_GUN), tree: {}, run: null, time: 0, earned: 0 };
try { const raw = localStorage.getItem('kiteo.save3'); if (raw) { const o = JSON.parse(raw); M = Object.assign(M, o, { mats: Object.assign(M.mats, o.mats || {}) }); } } catch (e) {}
// Piezas: 1 descubierta, 2 forjada (puedes empezar con ella). Las básicas vienen forjadas.
for (const x of PARTS) if (x.base) M.parts[x.id] = 2;
{ // Las armas enteras de antes se convierten en sus piezas, ya forjadas
  const OLDW = { pistols: ['b_twin', 'a_semi', 's_light', 'c_fan'], bow: ['b_pierce', 'a_draw', 'c_rain'], shotgun: ['b_scatter', 'm_drum', 'c_blast'], gatling: ['a_rotary', 'm_belt', 'c_supp'], lance: ['b_spike', 'c_dash'] };
  for (const w of M.owned || []) for (const id of OLDW[w] || []) M.parts[id] = 2;
  if (M.weapon && OLDW[M.weapon]) { M.gun = Object.assign({}, BASE_GUN); for (const id of OLDW[M.weapon]) M.gun[PART[id].slot] = id; }
  delete M.owned; delete M.weapon; delete M.wup;
  M.gun = Object.assign({}, BASE_GUN, M.gun); for (const k of GSLOT_KEYS) if (!PART[M.gun[k]] || M.parts[M.gun[k]] !== 2) M.gun[k] = BASE_GUN[k];
  if (M.run && (!M.run.gun || !M.run.mission)) M.run = null;
  M.done = M.done || {};
}
save();
function save() { try { localStorage.setItem('kiteo.save3', JSON.stringify(M)); } catch (e) {} }
const tk = id => +M.tree[id] || 0;   // rango de una habilidad del árbol
// El árbol antiguo era de sí o no: lo que tuvieras comprado pasa a rango 1 de su equivalente
{ const OLD = { c1: 'hp', c2: 'revive', c3: 'skin', c4: 'reflex', o1: 'rate', o2: 'eye', o3: 'dmg', o4: 'armorer', m1: 'eye4', m2: 'reroll', m3: 'recall', m4: 'door' };
  for (const [a, b] of Object.entries(OLD)) if (M.tree[a]) { M.tree[b] = Math.max(tk(b), 1); delete M.tree[a]; } }
function discover(id) { if (!M.parts[id]) { M.parts[id] = 1; save(); return true; } return false; }
const matName = g => (g === 'iron' ? 'Hierro Místico' : GODS[g].mat);
const matHave = g => (g === 'iron' ? M.iron : M.mats[g]);
const costTxt = c => Object.entries(c).map(([g, n]) => n + ' ' + matName(g)).join(' + ');
const canPay = c => Object.entries(c).every(([g, n]) => matHave(g) >= n);
const pay = c => { for (const [g, n] of Object.entries(c)) { if (g === 'iron') M.iron -= n; else M.mats[g] -= n; } };
// "mundo 2, sala 3" a partir del número de encuentro
const lootTxt = () => { const m = GOD_KEYS.filter(g => S.matsRun[g]).map(g => S.matsRun[g] + ' ' + GODS[g].mat); if (S.ironRun) m.unshift(S.ironRun + ' de Hierro Místico'); return `<b>${S.soulsRun}</b> almas` + (m.length ? ', ' + m.join(', ') : ''); };
function endRun(win) {
  M.souls += S.soulsRun; M.earned += S.soulsRun; M.iron += S.ironRun; for (const g of GOD_KEYS) M.mats[g] += S.matsRun[g];
  M.runs += 1; if (win) M.wins += 1;
  M.run = null; save();
}
// Guardado de la partida en curso: al entrar en cada sala
function saveRun() {
  const p = S.p;
  // Copia completa: lo que ganes después en esta sala no se cuela en el guardado; al continuar, la sala se repite sin cobrar nada dos veces
  M.run = JSON.parse(JSON.stringify({ keepHp: S.keepHp == null ? null : S.keepHp, mission: S.mission, wave: S.wave - 1, next: S.next, gun: S.gun, build: S.build, techs: [...S.techs], plans: [...S.plans], kills: S.kills, soulsRun: S.soulsRun, ironRun: S.ironRun, matsRun: S.matsRun,
    p: { hp: p.hp, maxHp: p.maxHp, dmg: p.dmg, as: p.as, range: p.range, speed: p.speed, revive: p.revive, gold: p.gold, reserve: p.reserve } }));
  save();
}
function resumeRun() {
  const r = M.run; newGame(); S.mission = r.mission; S.keepHp = r.keepHp;
  S.gun = Object.assign({}, BASE_GUN, r.gun); S.build = JSON.parse(JSON.stringify(r.build)); S.techs = new Set(r.techs); S.plans = new Set(r.plans); S.next = r.next;
  S.kills = r.kills; S.soulsRun = r.soulsRun; S.ironRun = r.ironRun; Object.assign(S.matsRun, r.matsRun); Object.assign(S.p, r.p); S.wave = r.wave;
  S.p.dodgeN = dodgeMax(); S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}

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

// ───────────────────────── Al limpiar una sala ─────────────────────────
let pickHead = { eyebrow: '', title: '' }, pickQueue = [], bookFrom = 'pause', afterPicks = null, pickReroll = null;
const rollRar = () => { const r = Math.random() + 0.05 * tk('luck'); return r < 0.6 ? 0 : r < 0.88 ? 1 : 2; };
const statScreen = () => ({ eyebrow: 'Yunque', title: 'Afina el arma', opts: UPGRADES.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(u => ({ tag: 'Ajuste', name: u.name, desc: u.desc, note: '', color: C.energy, apply: () => u.apply(S.p) })) });
const planScreen = eyebrow => () => ({ eyebrow, title: 'Un plano para tu arma', opts: PLANS.filter(x => !S.plans.has(x.id) && (!x.only || G(x.only))).sort(() => Math.random() - 0.5).slice(0, 3).map(x => ({ tag: 'Plano', name: x.name, desc: x.desc, note: '', color: C.ink, apply: () => { S.plans.add(x.id); S.p.dodgeN = dodgeMax(); } })) });
// Una pieza de arma: la montas ahora y, además, queda descubierta para siempre
function mountPart(id) { discover(id); S.gun[PART[id].slot] = id; S.p.shells = 2; S.p.heat = 0; S.p.drawing = false; S.p.spin = 0; checkRes(); }
const partScreen = eyebrow => () => {
  const pool = PARTS.filter(x => !x.base && !G(x.id)).map(x => [Math.pow(Math.random(), 1 / (M.parts[x.id] ? 0.5 : 1.6)), x]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(x => x[1]);
  if (!pool.length) return null;
  const opts = pool.map(x => { const isNew = !M.parts[x.id], g2 = Object.assign({}, S.gun, { [x.slot]: x.id }), nm = gunName(g2);
    return { tag: GSLOTS[x.slot] + ' · ' + x.tag + (isNew ? ' · nueva' : ''), rar: 0, name: x.name, color: C.energy, desc: x.desc, note: (affGod(x.id) ? `Afín a ${GODS[affGod(x.id)].theme}: ${AFFIN[affGod(x.id)]}. ` : '') + `Sustituye a ${PART[S.gun[x.slot]].name}` + (nm !== gunName(S.gun) ? ` · tu arma pasa a ser: ${nm}` : ''), apply: () => mountPart(x.id) }; });
  const fresh = pool.filter(x => !M.parts[x.id]);
  opts.push({ tag: 'Guardar', name: 'No montar nada', color: C.dim, desc: fresh.length ? `Dejas tu arma como está. Te guardas ${fresh[0].name} para la forja.` : 'Dejas tu arma como está.', note: '', apply: () => { if (fresh.length) discover(fresh[0].id); } });
  return { eyebrow, title: 'Una pieza para tu ' + gunName(S.gun).toLowerCase(), opts };
};
const pieceScreen = (god, eyebrow) => () => { const o = pieceOptions(god); return o.length ? { eyebrow, title: 'Desmontas: ' + GODS[god].weapon, opts: o, reroll: () => pieceOptions(god) } : statScreen(); };

// Tras limpiar un tramo: recompensa según el tipo de misión, tienda si toca, y a por el siguiente (o a cobrar)
function roomCleared() {
  const p = S.p, n = S.lvl, W = S.world, ms = S.mission, N = roomsOf(ms), last = S.room >= N;
  if (S.bossRoom) { bossDown(); return; }
  p.hp = Math.min(p.maxHp, p.hp + 5 + 4 * tk('mend'));
  const gold = Math.round(8 + 2 * n); addGold(gold);
  pickQueue = []; S.rerolls = tk('reroll');
  const unit = ms.type === 'defend' ? 'oleada' : ms.type === 'assault' ? 'campamento' : 'sala', here = ms.name + ' · ' + unit + ' ' + S.room + ' de ' + N;
  let got = '';
  if (ms.type === 'defend') {
    S.keepHp = Math.min(S.keep.maxHp, S.keep.hp + S.keep.maxHp * 0.12);   // entre oleadas los aldeanos apuntalan la campana
    if (!last) pickQueue.push(pieceScreen(S.drop ? S.drop.god : lootGod(), here + ' rechazada · entre los caídos hay un arma bendecida'));
  } else if (ms.type === 'assault') { const k = W >= 3 ? 2 : 1; S.ironRun += k; got = '+' + k + ' de Hierro Místico'; }
  else if (S.roomType === 'god' && S.drop) pickQueue.push(pieceScreen(S.drop.god, here + ' · ' + GODS[S.drop.god].title));
  else if (S.roomType === 'souls') { const k = Math.round((22 + 8 * W) * (1 + 0.1 * tk('nose'))); S.soulsRun += k; got = '+' + k + ' almas'; }
  else if (S.roomType === 'iron') { const k = W >= 3 ? 2 : 1; S.ironRun += k; got = '+' + k + ' de Hierro Místico'; pickQueue.push(partScreen(here + ' · entre el hierro hay algo')); }
  else if (S.roomType === 'heart') { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 20); got = '+20 de vida máxima'; }
  else if (S.roomType === 'gold') { const k = 60 + 20 * W; addGold(k); got = '+' + k + ' de oro'; }
  else if (S.roomType === 'anvil') pickQueue.push(statScreen);
  S.cleared = here + (got ? ' · ' + got : '') + ' · +' + gold + ' de oro';
  if (got) { sayRaw('[' + got.replace('+', 'Consigues ') + ']', (ROOMS[S.roomType] || { color: C.ink }).color); blip(700, 0.2, 'triangle', 0.05, 500); }
  const onward = ms.type === 'defend' || ms.type === 'assault' || S.room + 1 >= N && hasBoss(ms) ? null : doorScreen;   // en defensa y asalto no hay puertas; antes del jefe tampoco
  if (last) afterPicks = missionWin;
  else if (shopAfter(ms, S.room)) afterPicks = openShop;     // la tienda decide después por dónde sigues
  else if (onward) pickQueue.push(onward);
  advancePick();
}
function bossDown() { sayRaw('[Has vencido a ' + (S.enemies.find(e => e.boss) || { type: { name: S.mission.name } }).type.name + ']', C.ink); missionWin(); }
// Puertas: cada una enseña qué da la sala siguiente
function doorScreen() {
  const roll = Math.random(), n = (roll < 0.22 ? 1 : roll < 0.68 ? 2 : 3) + tk('door'), kinds = [];
  // Las deidades de las que ya llevas alguna técnica salen un poco más (peso 1,3 frente a 1): lo justo para que una build pueda cerrarse
  const gods = GOD_KEYS.map(g => [Math.pow(Math.random(), 1 / (godCount(g) > 0 ? 1.3 : 1)), g]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const bag = ['souls', 'souls', 'souls', 'souls', 'gold', 'gold', 'gold', 'heart', 'heart', 'iron', 'iron', 'anvil', 'anvil'].sort(() => Math.random() - 0.5);
  const res = () => { const k = bag.find(x => !kinds.some(d => d.type === x)); return { type: k || 'gold' }; };
  kinds.push(Math.random() < (n === 1 ? 0.5 : 0.3) ? res() : { type: 'god', god: gods.pop() });
  while (kinds.length < n) kinds.push(kinds.length === n - 1 && !kinds.some(d => d.type !== 'god') ? res() : Math.random() < 0.22 ? { type: 'god', god: gods.pop() } : res());
  kinds.sort(() => Math.random() - 0.5);
  return { eyebrow: S.cleared || 'Siguiente sala', title: kinds.length > 1 ? '¿Qué puerta cruzas?' : 'Solo hay una puerta', opts: kinds.map(d => {
    if (d.type === 'god') { const G = GODS[d.god], k = godCount(d.god);
      return { tag: 'Deidad · ' + G.theme, name: G.title, desc: `Su elegido guarda la sala. Si lo matas, desmontas el ${G.weapon} y te llevas una técnica. Suelta ${G.mat}.`, note: `Llevas técnicas suyas en ${k} de 4 acciones · ${MASTERY[d.god].name}: ${Math.min(k, 3)}/3`, color: G.color, apply: () => { S.next = d; } }; }
    const R = ROOMS[d.type];
    return { tag: R.tag, name: R.name, desc: R.desc, note: 'Sin elegido: más enemigos corrientes', color: R.color, apply: () => { S.next = d; } };
  }) };
}
function advancePick() {
  while (pickQueue.length) {
    const scr = pickQueue.shift()();
    if (!scr || !scr.opts.length) continue;
    pickHead = { eyebrow: scr.eyebrow, title: scr.title }; pickOpts = scr.opts; pickSel = scr.opts.length > 2 ? 1 : 0; pickReroll = scr.reroll || null;
    setMode('pick'); ov.scrollTop = 0; return;
  }
  if (afterPicks) { const f = afterPicks; afterPicks = null; f(); return; }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}
function rerollPick() {   // Regateo
  if (S.mode !== 'pick' || !pickReroll || S.rerolls <= 0) return;
  S.rerolls -= 1; pickOpts = pickReroll(); pickSel = pickOpts.length > 2 ? 1 : 0; modeT = 0;
  blip(500, 0.1, 'triangle', 0.05, 300); renderOverlay();
}
function choosePick(i) {
  if (S.mode !== 'pick' || modeT < 0.45 || !pickOpts[i]) return;
  const before = GOD_KEYS.filter(mastery), o = pickOpts[i];
  o.apply();
  blip(660, 0.12, 'triangle', 0.05, 500);
  if (o.god) say(o.god, 'take');
  checkRes();
  for (const g of GOD_KEYS) if (mastery(g) && !before.includes(g)) { say(g, 'master'); note(S.p.x, S.p.y - 20, '¡' + MASTERY[g].name + '!', GODS[g].color, true); blip(520, 0.5, 'triangle', 0.06, 900); }
  advancePick();
}

// ───────────────────────── Técnicas que te ofrecen ─────────────────────────
// Una por acción. Si ya llevas ahí la técnica de otra deidad y existe dúo entre las dos, te ofrecen el dúo en su lugar.
function pieceCard(pc) {
  const cur = S.build[pc.slot], god = pc.god, rar = rollRar();
  const have = godCount(god), M2 = MASTERY[god], isNew = !godsIn(pc.slot).includes(god);
  const prog = !isNew || have >= 3 ? '' : have + 1 >= 3 ? 'Completa la maestría ' + M2.name : M2.name + ': ' + (have + 1) + '/3';
  const o = { tag: SLOTS[pc.slot], rar, name: pc.name, color: GODS[god].color, note: prog, god };
  const up = (name, descFn) => {   // subir de nivel lo que ya llevas en esa acción
    if (cur.lvl >= 5) return null;
    const nl = Math.min(5, cur.lvl + 1 + rar);
    o.name = name + ' ' + ROMAN[nl]; o.desc = descFn(nl); o.note = nl - cur.lvl > 1 ? 'Sube ' + (nl - cur.lvl) + ' niveles' : 'Sube un nivel';
    o.apply = () => { cur.lvl = nl; };
    return o;
  };
  if (cur && cur.id === pc.id) return up(pc.name, pc.desc);
  const D = cur && DUO[cur.id];
  if (D && (D.a === pc.id || D.b === pc.id)) {
    o.tag = 'Dúo · ' + SLOTS[pc.slot]; o.rar = 3; o.color = RAR[3].color;
    return up(D.name, l => PIECE[D.a].desc(l) + ' ' + PIECE[D.b].desc(l) + ' ' + D.desc);
  }
  const lvl = 1 + rar, duo = cur && !D ? duoFor(cur.id, pc.id) : null;
  if (duo) {   // la técnica que llevas se funde con esta
    const nl = Math.max(cur.lvl, lvl), old = PIECE[cur.id];
    o.tag = 'Dúo · ' + SLOTS[pc.slot]; o.rar = 3; o.color = RAR[3].color; o.name = duo.name + (nl > 1 ? ' ' + ROMAN[nl] : '');
    o.desc = `${duo.desc} Además hace lo de ${old.name} y lo de ${pc.name}: ${pc.desc(nl)}`;
    o.note = `Tu ${old.name} se convierte en esto` + (prog ? ' · ' + prog : '');
    o.apply = () => { S.build[pc.slot] = { id: duo.id, lvl: nl }; };
    return o;
  }
  o.name += lvl > 1 ? ' ' + ROMAN[lvl] : ''; o.desc = pc.desc(lvl);
  if (cur) { o.swap = true; o.note = 'Sustituye a ' + curName(cur) + (prog ? ' · ' + prog : ''); }
  o.apply = () => { S.build[pc.slot] = { id: pc.id, lvl }; };
  return o;
}
// Las que piden una técnica concreta solo salen si la llevas; las demás, si ya tienes algo de esa deidad o son ofrendas (sirven solas)
const SOLO = ['d_warm', 'm_skin', 'v_slow', 'f_appet', 'o_scars', 't_second', 's_last', 'r_spark', 'w_brine', 'l_coin', 'b_thorn', 'i_rime', 'h_warm', 'e_ink', 'u_glint', 'z_yawn', 'o_tug', 'q_shard', 'a_pup', 'g_whet', 'd_blood', 'v_vapors', 'f_carve'];
const techOk = t => !S.techs.has(t.id) && (t.req || []).every(id => lv(id) > 0) && (godCount(t.god) >= 1 || SOLO.includes(t.id));
const techNeeds = t => ((t.req || []).length ? t.req.map(id => PIECE[id].name).join(' y ') : 'cualquier técnica suya');
function pieceOptions(god) {
  const cands = [];
  for (const pc of PIECES.filter(x => x.god === god)) { const c = pieceCard(pc); if (c) cands.push([c.rar === 3 ? 1.6 : 1, c]); }
  for (const t of TECHS.filter(x => x.god === god && techOk(x)))
    cands.push([[0, 0.9, 0.6, 0.4][t.rar], { tag: 'Técnica', rar: t.rar, name: t.name, color: GODS[god].color, desc: t.desc, note: 'No ocupa ranura', god, apply: () => { S.techs.add(t.id); } }]);
  // Sorteo ponderado: lo raro sale menos y un dúo disponible sale más.
  // Lo que sustituiría a una técnica que ya llevas va al final: solo aparece si no hay otra cosa que ofrecer, y como mucho una.
  const order = cands.map(([w, c]) => [Math.pow(Math.random(), 1 / w), c]).sort((x, y) => y[0] - x[0]).map(x => x[1]);
  const n = tk('eye4') ? 4 : 3, keep = order.filter(c => !c.swap).slice(0, n), swaps = order.filter(c => c.swap);
  if (keep.length < n && swaps.length) keep.push(swaps[0]);
  // Y siempre puedes no tocar nada: fundes el arma por oro y material
  const gold = 20 + 4 * S.lvl;
  keep.push({ tag: 'Fundir', name: 'Fundir el arma', color: C.dim, desc: `No tocas tu build. Te llevas ${gold} de oro y 1 de ${GODS[god].mat} más.`, note: '', apply: () => { addGold(gold); S.matsRun[god] += 1; } });
  return keep;
}

// ───────────────────────── Tienda (antes de cada jefe) ─────────────────────────
function openShop() {
  if (!S.shop || S.shop.wave !== S.wave) {
    const k = 1 + 0.25 * (S.world - 1), pr = n => Math.round(n * k / 5) * 5;
    const god = GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)];
    const plan = PLANS.filter(x => !S.plans.has(x.id) && (!x.only || G(x.only))).sort(() => Math.random() - 0.5)[0];
    S.shop = { wave: S.wave, items: [
      { id: 'heal',  name: 'Guiso caliente',         desc: 'Recuperas el 35% de tu vida', price: pr(40) },
      { id: 'tech',  name: 'Arma de contrabando',    desc: `El ${GODS[god].weapon}, de ${GODS[god].title}: lo desmontas y eliges una técnica`, price: pr(90), god },
      { id: 'up',    name: 'Afilar una técnica',     desc: 'Sube un nivel una de las técnicas que llevas, al azar', price: pr(70) },
      { id: 'anvil', name: 'Rato de yunque',         desc: 'Eliges un ajuste del arma: cadencia, daño, alcance o velocidad', price: pr(60) },
      { id: 'heart', name: 'Corazón en conserva',    desc: '+15 de vida máxima', price: pr(70) },
      { id: 'part',  name: 'Pieza de armero',        desc: 'Una pieza para tu arma: eliges entre tres', price: pr(100) },
    ].concat(plan ? [{ id: 'plan', name: 'Plano: ' + plan.name, desc: plan.desc, price: pr(110), plan: plan.id }] : []) };
  }
  listSel = -1; setMode('shop'); ov.scrollTop = 0;
}
function shopHtml() {
  const p = S.p, ms = S.mission, toBoss = hasBoss(ms) && S.room + 1 >= roomsOf(ms), boss = toBoss ? (ms.type === 'god' ? TYPES[KINGDOMS.find(x => x.id === ms.k).god].name : TYPES[WORLDS[S.world - 1].boss].name) : '';
  return `<p class="eyebrow">Tienda · ${S.mission.zone}</p><h1>${toBoss ? 'Antes de ' + boss : 'Un alto en el camino'}</h1><p class="lead">Llevas <b>${Math.floor(p.gold)}</b> de oro y ${Math.ceil(p.hp)} de ${p.maxHp} de vida. El oro no sale de la misión: gástalo.</p><div class="forge"><section>` +
    S.shop.items.map((it, i) => `<button class="fi${it.sold ? ' on' : p.gold >= it.price ? '' : ' off'}" data-act="buy:${i}"><b>${it.name}</b><span>${it.desc}</span><i>${it.sold ? 'Comprado' : it.price + ' de oro'}</i></button>`).join('') +
    `</section><section><h2>Lo que llevas</h2><ul class="build full">${buildHtml(true)}</ul></section></div><button class="fi primary" data-act="boss">${toBoss ? 'Cruzar la puerta de ' + boss : 'Seguir adelante'}</button>`;
}
function shopAct(act) {
  const [k, i] = act.split(':'), p = S.p;
  if (k === 'boss') {   // salir de la tienda: al jefe, a la siguiente oleada o campamento, o a elegir puerta
    const ms = S.mission, direct = ms.type === 'defend' || ms.type === 'assault' || (hasBoss(ms) && S.room + 1 >= roomsOf(ms));
    if (direct) { S.mode = 'play'; modeT = 0; nextWave(); renderOverlay(); } else { pickQueue = [doorScreen]; advancePick(); }
    return;
  }
  const it = S.shop.items[+i];
  if (it.sold || p.gold < it.price) { blip(140, 0.1, 'sawtooth', 0.05, -40); return; }
  if (it.id === 'up') { const own = SLOT_KEYS.map(s => S.build[s]).filter(c => c && c.lvl < 5); if (!own.length) { blip(140, 0.1, 'sawtooth', 0.05, -40); return; } const c = own[Math.floor(Math.random() * own.length)]; c.lvl += 1; sayRaw('[' + curName(c) + ' sube a nivel ' + ROMAN[c.lvl] + ']', C.ink); }
  p.gold -= it.price; it.sold = true; blip(660, 0.1, 'triangle', 0.05, 400);
  if (it.id === 'heal') p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
  else if (it.id === 'heart') { p.maxHp += 15; p.hp += 15; }
  else if (it.id === 'plan') { S.plans.add(it.plan); p.dodgeN = dodgeMax(); }
  else if (it.id === 'tech') { S.rerolls = 0; pickQueue = [pieceScreen(it.god, 'Tienda · ' + GODS[it.god].title)]; afterPicks = openShop; advancePick(); return; }
  else if (it.id === 'anvil') { pickQueue = [statScreen]; afterPicks = openShop; advancePick(); return; }
  else if (it.id === 'part') { pickQueue = [partScreen('Tienda · pieza de armero')]; afterPicks = openShop; advancePick(); return; }
  renderOverlay();
}

// ───────────────────────── La forja (entre vidas) ─────────────────────────
function openForge() { S.mode = 'forge'; modeT = 0; listSel = -1; forgeTab = 'map'; renderOverlay(); ov.scrollTop = 0; }
// La forja va por pestañas para no ser una lista sin fin: el mapa del contrato, el arma (un apartado cada vez), las sinergias y el árbol.
let forgeTab = 'map', forgeSlot = 'barrel';
const FORGE_TABS = [['map', 'Contrato'], ['gun', 'Arma'], ['syn', 'Sinergias'], ['tree', 'Árbol']];
function forgeHtml() {
  const matChips = GOD_KEYS.filter(g => M.mats[g] > 0).map(g => `<span style="color:${GODS[g].color}">${M.mats[g]} ${GODS[g].mat}</span>`).join(' · ');
  const head = `<p class="eyebrow">La forja de Alec · ${M.runs} ${M.runs === 1 ? 'encargo' : 'encargos'} a la espalda</p>
    <div class="fhead"><h1>${gunName(M.gun)}</h1><p class="lead"><b>${M.souls}</b> almas · <b>${M.iron}</b> Hierro Místico${matChips ? ' · ' + matChips : ''}</p></div>
    <div class="tabs">${FORGE_TABS.map(([id, nm]) => `<button class="fi tab${forgeTab === id ? ' on' : ''}" data-act="tab:${id}"><b>${nm}</b></button>`).join('')}</div>`;
  let body = '';
  if (forgeTab === 'map') {
    const go = M.run ? `<button class="fi primary" data-act="resume">Continuar: ${M.run.mission.name}, tramo ${M.run.wave + 1}</button>` : '';
    body = `${go}<div class="kingdom">${mapHtml()}</div><p class="fine">Cada misión empieza de cero: lo que robes a los dioses no sale de ella. Las almas pagan tu árbol; el Hierro Místico y los materiales, las piezas de tu arma. Si caes, te retiras con lo que llevabas y lo vuelves a intentar.</p>`;
  } else if (forgeTab === 'gun') {
    const k = forgeSlot, all = PARTS.filter(x => x.slot === k), known = all.filter(x => M.parts[x.id]);
    const rank = x => (M.gun[k] === x.id ? 0 : M.parts[x.id] === 2 ? 1 : canPay(x.cost) ? 2 : 3);
    known.sort((a, b) => rank(a) - rank(b));
    const on = ensOf(M.gun), L = legOf(M.gun);
    body = `<p class="fine">Cada apartado decide una cosa. Elige un apartado y debajo salen sus piezas: las que descubras en las misiones aparecen aquí, y forjarlas una vez te deja empezar con ellas.${L ? ` <b class="gold">Arma legendaria: ${L.name}.</b>` : ''}${on.length ? ` <b class="gold">Ensambles activos: ${on.map(E => E.name).join(', ')}.</b>` : ''}</p>
      <div class="slots">${GSLOT_KEYS.map(sk => { const n = PARTS.filter(x => x.slot === sk), kn = n.filter(x => M.parts[x.id]).length;
        return `<button class="fi slot${sk === k ? ' on' : ''}" data-act="slot:${sk}"><b>${GSLOTS[sk]}</b><span>${PART[M.gun[sk]].name}</span><i>${kn}/${n.length}</i></button>`; }).join('')}</div>
      <h3>${GSLOTS[k]} · ${GSLOT_WHAT[k]}</h3><div class="plist">` +
      known.map(x => { const mounted = M.gun[k] === x.id, forged = M.parts[x.id] === 2;
        return `<button class="fi${mounted ? ' on' : forged || canPay(x.cost) ? '' : ' off'}" data-act="p:${x.id}"><b>${x.name}${x.base ? '' : ` <u>${x.tag}</u>`}</b><span>${x.desc}</span>${affHint(x.id)}${legHint(x.id)}<i>${mounted ? 'Montada' : forged ? 'Montar' : 'Forjar: ' + costTxt(x.cost)}</i></button>`; }).join('') +
      `</div>` + (all.length > known.length ? `<p class="fine">${all.length - known.length === 1 ? 'Queda 1 pieza' : 'Quedan ' + (all.length - known.length) + ' piezas'} de este apartado por descubrir.</p>` : '');
  } else if (forgeTab === 'syn') {
    const affs = {}; for (const sk of GSLOT_KEYS) { const g = affGod(M.gun[sk]); if (g) affs[g] = (affs[g] || 0) + 1; }
    const affTxt = Object.keys(affs).length ? Object.keys(affs).map(g => `<li class="own"><em style="color:${GODS[g].color}">${GODS[g].theme} ×${affs[g]}</em><span>Si llevas una técnica suya: ${AFFIN[g]}${affs[g] > 1 ? ', por cada pieza' : ''}.</span></li>`).join('') : '<li><span>Tu arma no lleva ninguna pieza afín a una deidad.</span></li>';
    const reso = RESO.map(R => { const known = R.parts.every(id => M.parts[id]), mounted = R.parts.every(id => M.gun[PART[id].slot] === id);
      return `<li class="${mounted ? 'own' : ''}"><em>${mounted ? 'Montada' : 'Resonancia'}</em><b>${known ? R.name : '???'}</b><span>${R.parts.map(id => (M.parts[id] ? PART[id].name : '???')).join(' + ')} con ${R.techs.map(id => PIECE[id].name + ' (' + GODS[PIECE[id].god].theme + ')').join(' y ')}${known ? '. ' + R.desc : ''}</span></li>`; }).join('');
    body = `<p class="fine">Cuatro formas de que tu arma haga más que la suma de sus piezas. Lo que aún no has descubierto sale como «???».</p>
      <div class="forge"><section><h3>Afinidades de tu arma · pieza con deidad</h3><ul class="build full legends">${affTxt}</ul>${ensHtml(M.gun)}</section>
      <section>${legendsHtml(M.gun)}<h3>Resonancias · una pieza con una técnica concreta</h3><ul class="build full legends">${reso}</ul></section></div>`;
  } else {
    const spent = TREE_NODES.reduce((a, n) => a + n.cost.slice(0, tk(n.id)).reduce((x, y) => x + y, 0), 0), hrs = M.time / 3600;
    const hm = h => (h >= 1 ? Math.floor(h) + ' h ' : '') + Math.round((h % 1) * 60) + ' min';
    const rate = hrs > 0.25 && M.earned > 0 ? M.earned / hrs : 0;
    const pace = `${spent} de ${TREE_TOTAL} almas invertidas (${Math.round(spent / TREE_TOTAL * 100)}%). Tiempo jugado: ${hm(hrs)}.` + (rate ? ` Ganas unas ${Math.round(rate)} almas por hora; a ese ritmo te faltan unas ${Math.max(0, Math.round((TREE_TOTAL - spent - M.souls) / rate))} h para completarlo.` : '');
    body = `<p class="fine">${pace}</p><div class="forge">` + TREE.map(br => `<section><h3>${br.name} · ${br.sub}</h3>` + br.nodes.map(n => { const r = tk(n.id), full = r >= n.max, cost = n.cost[r];
      return `<button class="fi${full ? ' on' : M.souls >= cost ? '' : ' off'}" data-act="t:${n.id}"><b>${n.name} ${r}/${n.max}</b><span>${r ? 'Ahora: ' + n.desc(r) + '. ' : ''}${full ? '' : 'Siguiente: ' + n.desc(r + 1)}</span><i>${full ? 'Al máximo' : cost + ' almas'}</i></button>`; }).join('') + '</section>').join('') + '</div>';
  }
  return head + body + `<p class="fine keyhint">Muévete con el stick izquierdo o la cruceta. El stick derecho desplaza la pantalla. LB (o Q) cambia de pestaña.</p>`;
}
function forgeAct(act) {
  const [k, id, n] = act.split(':');
  let ok = true;
  if (k === 'tab') { forgeTab = id; listSel = FORGE_TABS.findIndex(t => t[0] === id); blip(700, 0.04, 'triangle', 0.03); renderOverlay(); ov.scrollTop = 0; return; }
  if (k === 'slot') { forgeSlot = id; blip(700, 0.04, 'triangle', 0.03); renderOverlay(); return; }
  if (k === 'm') { startRun(missionOf(act.slice(2))); return; }
  if (k === 'x') { blip(140, 0.1, 'sawtooth', 0.05, -40); return; }
  if (k === 'resume') { resumeRun(); return; }
  if (k === 'p') { const x = PART[id]; if (M.parts[id] === 2) M.gun[x.slot] = id; else if (M.parts[id] === 1 && canPay(x.cost)) { pay(x.cost); M.parts[id] = 2; M.gun[x.slot] = id; } else ok = false; }
  else if (k === 't') { const nd = TREE_NODES.find(x => x.id === id), r = tk(id); if (r < nd.max && M.souls >= nd.cost[r]) { M.souls -= nd.cost[r]; M.tree[id] = r + 1; } else ok = false; }
  blip(ok ? 660 : 140, 0.1, ok ? 'triangle' : 'sawtooth', 0.05, ok ? 400 : -40);
  save(); renderOverlay();
}
// Listas navegables con mando (forja y tienda)
let listSel = -1;
function bindList() {
  const els = [...ovBody.querySelectorAll('.fi')], fn = S.mode === 'shop' ? shopAct : forgeAct;
  els.forEach(el => el.addEventListener('click', () => { audioInit(); listSel = els.indexOf(el); fn(el.dataset.act); }));
  if (listSel < 0 || listSel >= els.length) listSel = S.mode === 'shop' ? 0 : Math.max(els.findIndex(el => el.classList.contains('primary')), els.findIndex(el => el.dataset.act && el.dataset.act.startsWith('m:') && !el.classList.contains('on')));
  if (listSel < 0) listSel = 0;
  els.forEach((el, i) => el.classList.toggle('sel', i === listSel));
}
// Moverse por un menú según dónde está cada botón en pantalla: derecha va al de la derecha, abajo al de abajo
function navPick(els, cur, dx, dy) {
  if (!els[cur]) return els.length ? 0 : -1;
  const a = els[cur].getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
  let best = -1, bs = 1e9;
  els.forEach((el, i) => {
    if (i === cur) return;
    const b = el.getBoundingClientRect();
    // distancia en el eje pulsado, de borde a borde; y cuánto se desvía en el otro eje (0 si se solapan)
    const along = dx ? (dx > 0 ? b.left - a.right : a.left - b.right) : (dy > 0 ? b.top - a.bottom : a.top - b.bottom);
    if (along < -4) return;
    if ((dx ? (b.left + b.width / 2 - ax) * dx : (b.top + b.height / 2 - ay) * dy) <= 2) return;
    const off = dx ? Math.max(0, Math.max(a.top, b.top) - Math.min(a.bottom, b.bottom)) : Math.max(0, Math.max(a.left, b.left) - Math.min(a.right, b.right));
    const ctr = dx ? Math.abs(b.top + b.height / 2 - ay) : Math.abs(b.left + b.width / 2 - ax);
    const score = Math.max(0, along) + off * 4 + ctr * 0.3;
    if (score < bs) { bs = score; best = i; }
  });
  return best < 0 ? cur : best;
}
function listInput() {
  if (S.mode === 'forge' && I.tabP) { const i = FORGE_TABS.findIndex(t => t[0] === forgeTab); forgeAct('tab:' + FORGE_TABS[(i + 1) % FORGE_TABS.length][0]); return; }
  const els = [...ovBody.querySelectorAll('.fi')];
  if (I.navX || I.navY) {
    const n = navPick(els, listSel, I.navX, I.navY);
    if (n !== listSel && n >= 0) { listSel = n; els.forEach((el, i) => el.classList.toggle('sel', i === listSel)); els[listSel].scrollIntoView({ block: 'nearest' }); blip(700, 0.03, 'triangle', 0.03); }
  }
  if (I.atkP && modeT > 0.3 && els[listSel]) els[listSel].click();
}

// ───────────────────────── Lo que llevas y el recetario ─────────────────────────
function buildHtml(full) {
  if (!full) {   // en partida: una sola línea con las cuatro acciones, y un recuento de lo demás. El detalle está en la pausa.
    const short = { basic: 'Disp', charge: 'Carg', dodge: 'Esq', passive: 'Pas' }, bits = [];
    for (const k of SLOT_KEYS) { const cur = S.build[k]; if (!cur) continue; const D = DUO[cur.id]; bits.push(`<span><em>${short[k]}</em> <b style="color:${D ? RAR[3].color : GODS[PIECE[cur.id].god].color}">${(D ? D.name : PIECE[cur.id].name)} ${ROMAN[cur.lvl]}</b></span>`); }
    const extra = [S.techs.size ? S.techs.size + (S.techs.size === 1 ? ' técnica' : ' técnicas') : '', S.plans.size ? S.plans.size + (S.plans.size === 1 ? ' plano' : ' planos') : '', GOD_KEYS.filter(mastery).length ? 'maestría' : ''].filter(Boolean).join(' · ');
    return bits.length || extra ? `<li class="line">${bits.join('')}${extra ? `<span class="more">+ ${extra}</span>` : ''}</li>` : '';
  }
  const rows = [];
  const row = (label, color, name, sub) => rows.push(`<li><em style="color:${color}">${label}</em><b>${name}</b>${sub ? `<span>${sub}</span>` : ''}</li>`);
  for (const k of SLOT_KEYS) {
    const cur = S.build[k];
    if (!cur) { if (full) rows.push(`<li><em>${SLOTS[k]}</em><span>Ranura libre</span></li>`); continue; }
    const D = DUO[cur.id];
    if (D) row(SLOTS[k], RAR[3].color, D.name + ' ' + ROMAN[cur.lvl], full ? D.desc + ' ' + PIECE[D.a].desc(cur.lvl) + ' ' + PIECE[D.b].desc(cur.lvl) : '');
    else row(SLOTS[k], GODS[PIECE[cur.id].god].color, PIECE[cur.id].name + ' ' + ROMAN[cur.lvl], full ? PIECE[cur.id].desc(cur.lvl) : '');
  }
  for (const g of GOD_KEYS) if (mastery(g)) row('Maestría', GODS[g].color, MASTERY[g].name, full ? MASTERY[g].desc : '');
  for (const R of RESO) if (res(R.id)) row('Resonancia', RAR[3].color, R.name, full ? R.desc : '');
  for (const E of ensOf(S.gun)) row('Ensamble', C.energy, E.name, full ? E.desc : '');
  for (const g of GOD_KEYS) { const a = aff(g); if (a) row('Afinidad', GODS[g].color, GODS[g].theme + ' ×' + a, full ? AFFIN[g] + (a > 1 ? ', por cada una de tus ' + a + ' piezas afines' : '') + '.' : ''); }
  if (full) for (const k of GSLOT_KEYS) { const x = PART[S.gun[k]]; row(GSLOTS[k], C.energy, x.name, x.desc); }
  const techs = TECHS.filter(t => S.techs.has(t.id)), plans = PLANS.filter(x => S.plans.has(x.id));
  if (full) { for (const t of techs) row('Técnica', RAR[t.rar].color, t.name, t.desc); for (const x of plans) row('Plano', C.ink, x.name, x.desc); }
  else { if (techs.length) row('Técnicas', C.dim, techs.map(t => t.name).join(', ')); if (plans.length) row('Planos', C.dim, plans.map(x => x.name).join(', ')); }
  return rows.join('');
}
function bookHtml() {
  let h = `<p class="eyebrow">Recetario del herrero</p><h1>Lo que se les puede robar</h1><p class="fine">En blanco, lo que ya llevas. Cabe una técnica por acción. Si llevas la de una deidad y otra te ofrece la suya para esa misma acción, te ofrece el dúo de las dos.</p><div class="book">`;
  for (const g of GOD_KEYS) {
    const n = godCount(g), G = GODS[g];
    h += `<section><h2 style="color:${G.color}">${G.title}</h2><p class="fine">${G.theme}. ${G.key}</p><ul class="build full">` +
      PIECES.filter(x => x.god === g).map(pc => { const l = lv(pc.id); return `<li class="${l ? 'own' : ''}"><em>${SLOTS[pc.slot]}</em><b>${pc.name}${l ? ' ' + ROMAN[l] : ''}</b><span>${pc.desc(Math.max(1, l))}</span></li>`; }).join('') +
      TECHS.filter(t => t.god === g).map(t => `<li class="${S.techs.has(t.id) ? 'own' : ''}"><em style="color:${RAR[t.rar].color}">${RAR[t.rar].name}</em><b>${t.name}</b><span>${t.desc} Pide: ${techNeeds(t)}.</span></li>`).join('') +
      `<li class="${n >= 3 ? 'own' : ''}"><em style="color:${G.color}">Maestría</em><b>${MASTERY[g].name} · ${Math.min(n, 3)}/3</b><span>Lleva técnicas suyas en 3 acciones. ${MASTERY[g].desc}</span></li></ul></section>`;
  }
  for (const k of SLOT_KEYS) h += `<section><h2 style="color:${RAR[3].color}">Dúos de ${SLOTS[k].toLowerCase()}</h2><ul class="build full">` +
    DUOS.filter(d => d.slot === k).map(d => `<li class="${duoOn(d.id) ? 'own' : ''}"><em>${GODS[PIECE[d.a].god].theme} + ${GODS[PIECE[d.b].god].theme}</em><b>${d.name}</b><span>${PIECE[d.a].name} + ${PIECE[d.b].name}. ${d.desc}</span></li>`).join('') + `</ul></section>`;
  h += `<section><h2 style="color:${RAR[3].color}">Resonancias</h2><p class="fine">Una pieza del arma y una técnica de una deidad que, juntas, despiertan algo. Se activan solas.</p><ul class="build full">` +
    RESO.map(R => `<li class="${res(R.id) ? 'own' : ''}"><em>${R.parts.map(id => GSLOTS[PART[id].slot]).join(' + ')}</em><b>${R.name}</b><span>${R.parts.map(id => (M.parts[id] ? PART[id].name : 'una pieza sin descubrir')).join(' + ')} y ${R.techs.map(id => PIECE[id].name + ' (' + GODS[PIECE[id].god].theme + ')').join(' + ')}. ${R.desc}</span></li>`).join('') + `</ul></section>`;
  h += `<section><h2>Piezas del arma</h2><ul class="build full">` + PARTS.filter(x => M.parts[x.id]).map(x => `<li class="${G(x.id) ? 'own' : ''}"><em>${GSLOTS[x.slot]}</em><b>${x.name} · ${x.tag}</b><span>${x.desc}</span></li>`).join('') +
    `<li><em>Faltan</em><span>${PARTS.filter(x => !M.parts[x.id]).length} piezas por descubrir.</span></li></ul></section>`;
  h += `<section><h2>Planos</h2><ul class="build full">` + PLANS.map(x => `<li class="${S.plans.has(x.id) ? 'own' : ''}"><em>Plano</em><b>${x.name}</b><span>${x.desc}</span></li>`).join('') + `</ul></section>`;
  return h + `</div><button id="ovBtn" class="primary">Volver</button>`;
}
function openBook() { bookFrom = S.mode; S.mode = 'book'; modeT = 0; renderOverlay(); ov.scrollTop = 0; }
function closeBook() { S.mode = bookFrom; modeT = 0; renderOverlay(); }


// Armas legendarias en la forja: qué piezas piden (las que no has descubierto salen como ???) y cuál llevas montada
function legendsHtml(g) {
  const cur = legOf(g);
  return `<h3>Armas legendarias · tres piezas concretas a la vez</h3><ul class="build full legends">` + LEGENDS.map(L => {
    const known = (M.legends || {})[L.id] || L.parts.every(id => M.parts[id]);
    return `<li class="${cur === L ? 'own' : ''}"><em>${cur === L ? 'Montada' : 'Legendaria'}</em><b>${known ? L.name : '???'}</b><span>${L.parts.map(id => (M.parts[id] ? (g[PART[id].slot] === id ? '✔ ' : '') + PART[id].name : '???')).join(' + ')}${known ? '. ' + L.desc + ' <i>' + L.lore + '</i>' : ''}</span></li>`; }).join('') + '</ul>';
}
// En cada pieza de la forja: si forma parte de un arma legendaria cuyas piezas ya conoces, lo dice
function legHint(id) {
  const L = LEGENDS.filter(L => L.parts.includes(id) && L.parts.every(p => M.parts[p])), E = ENSEMBLES.filter(E => E.parts.includes(id) && E.parts.every(p => M.parts[p]));
  return (L.length ? `<span class="leg">Parte de: ${L.map(x => x.name).join(', ')}</span>` : '') + (E.length ? `<span class="leg">Ensambla con: ${E.map(x => PART[x.parts.find(p => p !== id)].name + ' (' + x.name + ')').join(', ')}</span>` : '');
}

// Afinidad de una pieza: con qué deidad casa y qué gana si llevas una técnica suya
function affHint(id) { const g = affGod(id); if (PART[id].theme) return `<span class="aff" style="color:${GODS[g].color}">Pieza de ${GODS[g].theme}. Además, con una técnica suya, ${AFFIN[g]}.</span>`; return g ? `<span class="aff" style="color:${GODS[g].color}">Afín a ${GODS[g].theme}: con una técnica suya, ${AFFIN[g]}.</span>` : ''; }
// Ensambles en la forja: parejas de piezas que se potencian
function ensHtml(g) {
  const on = ensOf(g);
  return `<h3>Ensambles · dos piezas que se potencian</h3><ul class="build full legends">` + ENSEMBLES.map(E => {
    const known = E.parts.every(id => M.parts[id]);
    return `<li class="${on.includes(E) ? 'own' : ''}"><em>${on.includes(E) ? 'Activo' : 'Ensamble'}</em><b>${known ? E.name : '???'}</b><span>${E.parts.map(id => (M.parts[id] ? (g[PART[id].slot] === id ? '✔ ' : '') + PART[id].name : '???')).join(' + ')}${known ? '. ' + E.desc : ''}</span></li>`; }).join('') + '</ul>';
}
// ───────────────────────── Reinos, zonas y misiones ─────────────────────────
// Alec va de reino en reino como mercenario. Cada reino es un mapa con cuatro zonas; cada zona tiene tres misiones
// de tipos distintos y un guardián. Al caer los cuatro guardianes aparece el dios que asedia el reino.
// Cada misión empieza de cero: lo que robas a los dioses no sale de ella. Lo que queda es el arma forjada y el árbol.
// Las misiones son largas (unos 20-30 minutos) para que dé tiempo a montar una build. rooms: cuántos tramos tiene; shops: tras cuáles hay tienda.
const MTYPES = {
  doors:   { name: 'Incursión', rooms: 15, shops: [5, 10], desc: 'Quince salas seguidas, con puerta a elegir tras cada una y dos tiendas por el camino.' },
  defend:  { name: 'Defensa',   rooms: 12, shops: [4, 8],  desc: 'Doce oleadas contra una aldea. Tras cada una te llevas una técnica. Si derriban la campana, fracasas.' },
  assault: { name: 'Asalto',    rooms: 5,  shops: [2, 4],  desc: 'Cinco campamentos, cada uno con estandartes que llaman refuerzos sin parar. Derríbalos todos.' },
  boss:    { name: 'Guardián',  rooms: 9,  shops: [4, 8],  desc: 'Ocho salas, dos tiendas y el guardián de la zona.' },
  god:     { name: 'Dios',      rooms: 11, shops: [5, 10], desc: 'Diez salas, dos tiendas y el dios.' },
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
const payOf = ms => (ms.type === 'god' ? 400 : ms.type === 'boss' ? 150 + 40 * ms.z : 60 + 25 * ms.z);
const roomsOf = ms => MTYPES[ms.type].rooms;
const shopAfter = (ms, r) => MTYPES[ms.type].shops.includes(r);
const hasBoss = ms => ms.type === 'boss' || ms.type === 'god';
const whereNow = () => { const ms = S.mission; return !ms ? '' : ms.zone + ' · ' + ms.name; };

// El mapa del reino, en la forja: cuatro zonas con sus misiones y, en medio, el dios
function mapHtml() {
  const K = kingdomNow(), nDone = Object.keys(M.done || {}).filter(id => id.startsWith(K.id)).length;
  const btn = (id, label, sub, locked) => `<button class="fi${isDone(id) ? ' on' : locked ? ' off' : ''}" data-act="${locked ? 'x' : 'm'}:${id}"><b>${label}</b><span>${sub}</span><i>${isDone(id) ? 'Hecha' : locked ? 'Cerrada' : payOf(missionOf(id)) + ' almas'}</i></button>`;
  const zones = K.zones.map((Z, z) => {
    const W = WPAL[z], open = zoneOpen(K, z), boss = TYPES[WORLDS[z].boss].name;
    return `<section class="zone" style="--zf:${W.f[1]};--zc:${W.capHi}"><h3>${Z.name}</h3>` +
      Z.m.map((nm, i) => btn(`${K.id}:${z}:${i}`, nm, MTYPES[MKINDS[i]].name, false)).join('') +
      btn(`${K.id}:${z}:b`, boss, open ? 'Guardián de la zona' : 'Guardián · completa antes las tres misiones', !open) + '</section>';
  }).join('');
  const g = godOpen(K), G = TYPES[K.god];
  return `<h2>Contrato: ${K.title}</h2><p class="fine">${K.lore} Llevas ${nDone} de 17 encargos.</p><ul class="legend">${['doors', 'defend', 'assault', 'boss', 'god'].map(t => `<li><b>${MTYPES[t].name}:</b> ${MTYPES[t].desc}</li>`).join('')}</ul><div class="kmap">${zones}</div>` +
    `<section class="zone god">${btn(`${K.id}:g`, G.name, g ? 'El dios que asedia el reino' : 'El dios · derrota antes a los cuatro guardianes', !g)}</section>`;
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

// ── Defensa de una aldea: cada oleada es un tramo; parte de los enemigos va a por la campana en vez de a por ti ──
function fillDefWave() {
  const w = S.room; let budget = 5 + S.lvl * 2.2; const list = [], pool = WORLDS[S.world - 1].pool;
  while (budget > 0.5 && list.length < 32) { const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5); if (!cand.length) break; const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost; }
  list.sort(() => Math.random() - 0.5);
  if (w % 3 === 0) list.splice(Math.ceil(list.length / 2), 0, 'champ');   // cada tres oleadas llega un elegido con los asaltantes
  S.queue = list.map((type, i) => ({ type, at: 1 + i * 0.4, raid: i % 3 === 0 && !TYPES[type].fly && type !== 'champ' }));
  note(S.p.x, S.p.y - 30, 'Oleada ' + w + ' de ' + roomsOf(S.mission), C.blood, true);
  if (w === 1) sayRaw('[Uno de cada tres va a por la campana: no la dejes sola.]', C.blood);
}
// ── Asalto a un campamento: tres estandartes que llaman refuerzos hasta que caen ──
function setupAssault() {
  const p = S.p, spots = [];
  S.postsAll = S.room >= 4 ? 4 : 3;
  for (let i = 0, tries = 0; i < S.postsAll && tries < 300; tries++) { const c = freeSpot(p, 230); if (spots.every(s => dist(s, c) > 170) && !isWallAt(c.x, c.y)) { spots.push(c); i++; } }
  for (const c of spots) spawn('post', { pos: c });
  let budget = 5 + S.lvl * 2.1; const pool = WORLDS[S.world - 1].pool, list = [];
  while (budget > 0.5 && list.length < 18) { const cand = pool.filter(k => TYPES[k].cost <= budget + 0.5); if (!cand.length) break; const k = cand[Math.floor(Math.random() * cand.length)]; list.push(k); budget -= TYPES[k].cost; }
  S.queue = list.map((type, i) => ({ type, at: 0.6 + i * 0.3, near: spots[i % Math.max(1, spots.length)] }));
  S.postsDown = 0;
  S.postsAll = spots.length;
  if (S.room === 1) sayRaw('[Los estandartes llaman refuerzos sin parar. Hasta que no caigan, seguirán llegando.]', C.blood);
  note(S.p.x, S.p.y - 30, 'Campamento ' + S.room + ' de ' + roomsOf(S.mission), C.blood, true);
}
// ───────────────────────── Salas: muros, formas y caminos ─────────────────────────
// Cada sala es una rejilla de casillas de CELL unidades. Un generador decide qué casillas son muro;
// después se comprueba que todo el suelo sea alcanzable y se funden las casillas de muro en rectángulos.
// Los enemigos que no ven al jugador siguen un campo de distancias calculado desde su casilla.
const CELL = 16;
const ROOM_SIZES = { small: [40, 26], mid: [46, 30], big: [52, 34], boss: [50, 34], huge: [66, 44] };
const NAV = { cols: 0, rows: 0, wall: new Uint8Array(0), dist: new Int16Array(0), t: 0, pc: -1 };

// Generadores: reciben una rejilla vacía (g[y][x] = 0) y devuelven la casilla donde empieza el jugador.
const fillRect = (g, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = 1; };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const ROOM_GEN = {
  // Sala de columnas: pilares cuadrados en retícula
  columnas(g, c, r) {
    const sx = ri(6, 8), sy = ri(5, 6), ox = Math.floor((c % sx) / 2) + 3, oy = Math.floor((r % sy) / 2) + 3;
    for (let y = oy; y < r - 3; y += sy) for (let x = ox; x < c - 3; x += sx) if (Math.abs(x - c / 2) > 3 || Math.abs(y - r / 2) > 3) fillRect(g, x, y, 2, 2);
    return [c >> 1, r >> 1];
  },
  // Cruz: cuatro bloques en las esquinas dejan una sala en forma de más
  cruz(g, c, r) {
    const w = Math.floor(c * 0.27), h = Math.floor(r * 0.3);
    fillRect(g, 0, 0, w, h); fillRect(g, c - w, 0, w, h); fillRect(g, 0, r - h, w, h); fillRect(g, c - w, r - h, w, h);
    fillRect(g, (c >> 1) - 1, (r >> 1) - 5, 2, 2); fillRect(g, (c >> 1) - 1, (r >> 1) + 3, 2, 2);
    return [c >> 1, r >> 1];
  },
  // Torreón: un gran bloque central con un pasillo alrededor y cuatro pilares de esquina
  torreon(g, c, r) {
    const w = Math.floor(c * 0.3), h = Math.floor(r * 0.3), x = (c - w) >> 1, y = (r - h) >> 1;
    fillRect(g, x, y, w, h);
    for (const [px, py] of [[5, 4], [c - 7, 4], [5, r - 6], [c - 7, r - 6]]) fillRect(g, px, py, 2, 2);
    return [c >> 1, r - 4];
  },
  // Galerías: muros largos horizontales con huecos, formando pasillos
  galerias(g, c, r) {
    for (const y of [Math.floor(r / 3) - 1, Math.floor(2 * r / 3)]) {
      fillRect(g, 0, y, c, 2);
      const gaps = [ri(4, Math.floor(c / 3) - 5), ri(Math.floor(c / 3) + 2, Math.floor(2 * c / 3) - 6), ri(Math.floor(2 * c / 3) + 1, c - 9)];
      for (const gx of gaps) for (let j = y; j < y + 2; j++) for (let i = gx; i < gx + 5; i++) g[j][i] = 0;
    }
    return [c >> 1, r >> 1];
  },
  // Recovecos: contrafuertes que salen de los muros de arriba y abajo y dejan nichos entre ellos
  recovecos(g, c, r) {
    const step = ri(6, 8), len = Math.floor(r * 0.3);
    for (let x = 4, k = 0; x < c - 4; x += step, k++) { if (k % 2) fillRect(g, x, 0, 2, len); else fillRect(g, x, r - len, 2, len); }
    for (const y of [Math.floor(r / 2) - 1]) { fillRect(g, 0, y, 4, 2); fillRect(g, c - 4, y, 4, 2); }
    return [c >> 1, r >> 1];
  },
  // Sala en L doble: dos esquinas opuestas tapiadas y pilares en el paso
  codo(g, c, r) {
    const w = Math.floor(c * 0.36), h = Math.floor(r * 0.42), flip = Math.random() < 0.5;
    fillRect(g, flip ? c - w : 0, 0, w, h); fillRect(g, flip ? 0 : c - w, r - h, w, h);
    fillRect(g, (c >> 1) - 5, (r >> 1) - 1, 2, 2); fillRect(g, (c >> 1) + 3, (r >> 1) - 1, 2, 2);
    return [flip ? 6 : c - 7, 5];
  },
  // Escombros: trozos de muro sueltos en L, en T y rectos, con simetría
  escombros(g, c, r) {
    const half = c >> 1;
    for (let n = 0, tries = 0; n < 6 && tries < 80; tries++) {
      const x = ri(3, half - 6), y = ri(3, r - 8), horiz = Math.random() < 0.5, len = ri(3, 6);
      const w = horiz ? len : 2, h = horiz ? 2 : len;
      let ok = Math.abs(x + w / 2 - half) > 4 || Math.abs(y + h / 2 - r / 2) > 4;
      for (let j = y - 3; j < y + h + 3 && ok; j++) for (let i = x - 3; i < x + w + 3; i++) if (g[j] && g[j][i]) { ok = false; break; }
      if (!ok) continue;
      fillRect(g, x, y, w, h); fillRect(g, c - x - w, y, w, h);
      if (Math.random() < 0.5) { const ex = horiz ? x : x + 2, ey = horiz ? y + 2 : y; fillRect(g, ex, ey, horiz ? 2 : 2, horiz ? 2 : 2); fillRect(g, c - ex - 2, ey, 2, 2); }
      n++;
    }
    return [half, r >> 1];
  },
  // Partida en dos por un muro central con dos pasos
  tabique(g, c, r) {
    const x = (c >> 1) - 1, g1 = ri(3, Math.floor(r / 3) - 3), g2 = ri(Math.floor(2 * r / 3) - 2, r - 8);
    fillRect(g, x, 0, 2, r);
    for (const gy of [g1, g2]) for (let j = gy; j < gy + 5; j++) for (let i = x; i < x + 2; i++) g[j][i] = 0;
    for (const px of [Math.floor(c * 0.22), Math.floor(c * 0.75)]) { fillRect(g, px, Math.floor(r * 0.3), 2, 2); fillRect(g, px, Math.floor(r * 0.65), 2, 2); }
    return [Math.floor(c * 0.25), r >> 1];
  },
  // Octógono: esquinas en escalera y un bloque en el centro
  octogono(g, c, r) {
    for (let k = 0; k < 6; k++) { const w = (6 - k) * 2; fillRect(g, 0, k, w, 1); fillRect(g, c - w, k, w, 1); fillRect(g, 0, r - 1 - k, w, 1); fillRect(g, c - w, r - 1 - k, w, 1); }
    fillRect(g, (c >> 1) - 2, (r >> 1) - 2, 4, 4);
    return [c >> 1, r - 5];
  },
  // Claustro: un patio interior rodeado por un muro con cuatro puertas
  claustro(g, c, r) {
    const x0 = Math.floor(c * 0.25), y0 = Math.floor(r * 0.25), w = c - 2 * x0, h = r - 2 * y0;
    fillRect(g, x0, y0, w, 2); fillRect(g, x0, y0 + h - 2, w, 2); fillRect(g, x0, y0, 2, h); fillRect(g, x0 + w - 2, y0, 2, h);
    const mx = (c >> 1) - 2, my = (r >> 1) - 2;
    for (let i = mx; i < mx + 5; i++) { g[y0][i] = g[y0 + 1][i] = g[y0 + h - 2][i] = g[y0 + h - 1][i] = 0; }
    for (let j = my; j < my + 5; j++) { g[j][x0] = g[j][x0 + 1] = g[j][x0 + w - 2] = g[j][x0 + w - 1] = 0; }
    return [c >> 1, r >> 1];
  },
  // Aldea: cuatro casas de piedra alrededor de una plaza con la campana en medio
  aldea(g, c, r) {
    for (const [fx, fy] of [[0.2, 0.22], [0.8, 0.22], [0.2, 0.78], [0.8, 0.78]]) fillRect(g, Math.floor(c * fx) - 2, Math.floor(r * fy) - 1, 5, 3);
    fillRect(g, (c >> 1) - 9, (r >> 1) - 1, 2, 2); fillRect(g, (c >> 1) + 7, (r >> 1) - 1, 2, 2);
    return [c >> 1, (r >> 1) + 4];
  },
  // Arena de jefe: abierta, con pilares cuadrados contra los que estrellarlo
  arena(g, c, r) {
    for (const [fx, fy] of [[0.22, 0.3], [0.78, 0.3], [0.22, 0.72], [0.78, 0.72], [0.5, 0.52]]) fillRect(g, Math.floor(c * fx) - 1, Math.floor(r * fy) - 1, 3, 3);
    return [c >> 1, r - 5];
  },
};
let ROOM_FORCE = null;   // solo para pruebas
const ROOM_KINDS = Object.keys(ROOM_GEN).filter(k => k !== 'arena' && k !== 'aldea');

// Monta una sala. Devuelve { w, h, walls, start, kind }.
function buildRoom(boss, kindF, sizeF) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const kind = boss ? 'arena' : kindF && attempt < 8 ? kindF : ROOM_FORCE && attempt < 6 ? ROOM_FORCE : attempt > 8 ? 'columnas' : ROOM_KINDS[Math.floor(Math.random() * ROOM_KINDS.length)];
    const [c, r] = ROOM_SIZES[boss ? 'boss' : sizeF || ['small', 'mid', 'mid', 'big'][ri(0, 3)]];
    const g = Array.from({ length: r }, () => new Array(c).fill(0));
    const [sx, sy] = ROOM_GEN[kind](g, c, r);
    for (let j = sy - 1; j <= sy + 1; j++) for (let i = sx - 1; i <= sx + 1; i++) if (g[j] && i >= 0 && i < c) g[j][i] = 0;   // el punto de entrada, despejado
    // Alcance desde la entrada: lo que no se pueda pisar pasa a ser muro, para que no queden bolsas inaccesibles
    const seen = Array.from({ length: r }, () => new Array(c).fill(0)), q = [[sx, sy]]; seen[sy][sx] = 1; let open = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= c || ny >= r || g[ny][nx] || seen[ny][nx]) continue; seen[ny][nx] = 1; open++; q.push([nx, ny]); } }
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (!seen[y][x]) g[y][x] = 1;
    if (open < c * r * 0.55) continue;                 // demasiado cerrada: otra
    // Fundir casillas de muro en rectángulos: tiras horizontales que se alargan hacia abajo si coinciden
    const walls = [], used = Array.from({ length: r }, () => new Array(c).fill(0));
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
      if (!g[y][x] || used[y][x]) continue;
      let w = 1; while (x + w < c && g[y][x + w] && !used[y][x + w]) w++;
      let h = 1; outer: while (y + h < r) { for (let i = x; i < x + w; i++) if (!g[y + h][i] || used[y + h][i]) break outer; h++; }
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) used[j][i] = 1;
      walls.push({ x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL });
    }
    NAV.cols = c; NAV.rows = r; NAV.wall = new Uint8Array(c * r); NAV.dist = new Int16Array(c * r).fill(-1); NAV.t = 0; NAV.pc = -1;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) NAV.wall[y * c + x] = g[y][x];
    // Trampas de pinchos: placas de 2×2 en suelo libre, lejos de la entrada
    const traps = [];
    for (let i = 0, tries = 0; i < (boss ? 3 : ri(2, 5)) && tries < 80; tries++) {
      const x = ri(2, c - 4), y = ri(2, r - 4);
      if (g[y][x] || g[y][x + 1] || g[y + 1][x] || g[y + 1][x + 1] || Math.hypot(x - sx, y - sy) < 5) continue;
      if (traps.some(t => Math.abs(t.x / CELL - x) < 4 && Math.abs(t.y / CELL - y) < 4)) continue;
      traps.push({ x: x * CELL, y: y * CELL, w: CELL * 2, h: CELL * 2, off: Math.random() * 3.4, state: 0, acc: 0, hitP: false }); i++;
    }
    return { traps, w: c * CELL, h: r * CELL, walls, start: { x: (sx + 0.5) * CELL, y: (sy + 0.5) * CELL }, kind };
  }
}
const isWallAt = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx < 0 || cy < 0 || cx >= NAV.cols || cy >= NAV.rows || NAV.wall[cy * NAV.cols + cx] === 1; };
// Un punto libre al azar, alcanzable, a cierta distancia de otro. Para colocar enemigos.
function freeSpot(from, minD) {
  let best = null, bd = -1;
  for (let i = 0; i < 40; i++) {
    const cx = ri(1, NAV.cols - 2), cy = ri(1, NAV.rows - 2);
    if (NAV.wall[cy * NAV.cols + cx]) continue;
    const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL, d = from ? Math.hypot(x - from.x, y - from.y) : 1e9;
    if (d >= minD) return { x, y };
    if (d > bd) { bd = d; best = { x, y }; }
  }
  return best || { x: T.room.w / 2, y: T.room.h / 2 };
}
// Si un punto cae dentro de un muro, la casilla libre más cercana
function unstick(x, y) {
  if (!isWallAt(x, y)) return { x, y };
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let rad = 1; rad < 8; rad++) for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
    if (i < 0 || j < 0 || i >= NAV.cols || j >= NAV.rows || NAV.wall[j * NAV.cols + i]) continue;
    return { x: (i + 0.5) * CELL, y: (j + 0.5) * CELL };
  }
  return { x: T.room.w / 2, y: T.room.h / 2 };
}

// Hasta dónde llega un rayo antes de chocar con un muro
function rayClip(x, y, ux, uy, len) {
  let best = len;
  for (const w of S.walls) {
    let t0 = 0, t1 = best;
    if (Math.abs(ux) < 1e-9) { if (x < w.x || x > w.x + w.w) continue; }
    else { let a = (w.x - x) / ux, b = (w.x + w.w - x) / ux; if (a > b) { const t = a; a = b; b = t; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) continue; }
    if (Math.abs(uy) < 1e-9) { if (y < w.y || y > w.y + w.h) continue; }
    else { let a = (w.y - y) / uy, b = (w.y + w.h - y) / uy; if (a > b) { const t = a; a = b; b = t; } t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) continue; }
    if (t0 < best) best = Math.max(0, t0);
  }
  return best;
}
// Igual, pero cuenta el borde de la sala y dice qué cara tocó ('x' o 'y') para poder rebotar
function rayHit(x, y, ux, uy, len) {
  let best = rayClip(x, y, ux, uy, len), side = null;
  const R = T.room, tx = ux > 0 ? (R.w - x) / ux : ux < 0 ? -x / ux : 1e9, ty = uy > 0 ? (R.h - y) / uy : uy < 0 ? -y / uy : 1e9;
  if (Math.min(tx, ty) < best) { best = Math.max(0, Math.min(tx, ty)); side = tx < ty ? 'x' : 'y'; }
  else if (best < len - 0.01) { const hx = x + ux * best, hy = y + uy * best, bx = isWallAt(hx + Math.sign(ux) * 1.5, hy - uy * 1.5), by = isWallAt(hx - ux * 1.5, hy + Math.sign(uy) * 1.5); side = bx && !by ? 'x' : by && !bx ? 'y' : Math.abs(ux) > Math.abs(uy) ? 'x' : 'y'; }
  return { len: best, side };
}
function blocked(a, b) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return rayClip(a.x, a.y, dx / d, dy / d, d) < d - 0.01; }
// Empujar fuera de los muros a un círculo. Devuelve el muro tocado, si lo hay.
function collide(o, r) {
  let hitW = null;
  for (let pass = 0; pass < 2; pass++) for (const w of S.walls) {
    const cx = clamp(o.x, w.x, w.x + w.w), cy = clamp(o.y, w.y, w.y + w.h), dx = o.x - cx, dy = o.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= r * r) continue;
    hitW = w;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); o.x = cx + dx / d * r; o.y = cy + dy / d * r; }
    else {   // el centro está dentro: salir por el lado más cercano
      const l = o.x - w.x, rr = w.x + w.w - o.x, t = o.y - w.y, b = w.y + w.h - o.y, m = Math.min(l, rr, t, b);
      if (m === l) o.x = w.x - r; else if (m === rr) o.x = w.x + w.w + r; else if (m === t) o.y = w.y - r; else o.y = w.y + w.h + r;
    }
  }
  return hitW;
}
const touchesWall = (o, r) => S.walls.some(w => { const cx = clamp(o.x, w.x, w.x + w.w), cy = clamp(o.y, w.y, w.y + w.h); return (o.x - cx) ** 2 + (o.y - cy) ** 2 < r * r; });

// Campo de distancias desde la casilla del jugador (se recalcula cuando cambia de casilla, como mucho 5 veces por segundo)
function navUpdate(dt) {
  const p = S.p, c = NAV.cols, r = NAV.rows, pc = Math.floor(p.y / CELL) * c + Math.floor(p.x / CELL);
  NAV.t -= dt;
  if (!c || (pc === NAV.pc && NAV.t > -1) || NAV.t > 0) return;
  NAV.t = 0.2; NAV.pc = pc;
  const d = NAV.dist; d.fill(-1);
  if (pc < 0 || pc >= c * r || NAV.wall[pc]) return;
  const q = new Int32Array(c * r); let qh = 0, qt = 0; q[qt++] = pc; d[pc] = 0;
  while (qh < qt) {
    const i = q[qh++], x = i % c, y = (i / c) | 0, nd = d[i] + 1;
    if (x > 0 && !NAV.wall[i - 1] && d[i - 1] < 0) { d[i - 1] = nd; q[qt++] = i - 1; }
    if (x < c - 1 && !NAV.wall[i + 1] && d[i + 1] < 0) { d[i + 1] = nd; q[qt++] = i + 1; }
    if (y > 0 && !NAV.wall[i - c] && d[i - c] < 0) { d[i - c] = nd; q[qt++] = i - c; }
    if (y < r - 1 && !NAV.wall[i + c] && d[i + c] < 0) { d[i + c] = nd; q[qt++] = i + c; }
  }
}
// Hacia dónde debe andar un enemigo para llegar al jugador: recto si lo ve, por el camino si no
function navDir(e, ux, uy) {
  const p = S.p, d = Math.hypot(p.x - e.x, p.y - e.y) || 1, nx = -uy * e.r * 0.8, ny = ux * e.r * 0.8;
  const clear = (ox, oy) => rayClip(e.x + ox, e.y + oy, ux, uy, d) >= d - 0.01;
  if (clear(0, 0) && clear(nx, ny) && clear(-nx, -ny)) return [ux, uy];
  const c = NAV.cols, r = NAV.rows, cx = clamp(Math.floor(e.x / CELL), 0, c - 1), cy = clamp(Math.floor(e.y / CELL), 0, r - 1);
  let best = -1, bx = 0, by = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const x = cx + dx, y = cy + dy;
    if (x < 0 || y < 0 || x >= c || y >= r) continue;
    const v = NAV.dist[y * c + x];
    if (v < 0) continue;
    if (dx && dy && (NAV.wall[cy * c + x] || NAV.wall[y * c + cx])) continue;   // sin recortar esquinas
    if (best < 0 || v < best) { best = v; bx = x; by = y; }
  }
  if (best < 0) return [ux, uy];
  const tx = (bx + 0.5) * CELL - e.x, ty = (by + 0.5) * CELL - e.y, tl = Math.hypot(tx, ty) || 1;
  return [tx / tl, ty / tl];
}
// ───────────────────────── Combate: consultas ─────────────────────────
const active = e => e.spawn <= 0 && e.hp > 0;
const PIECE = Object.fromEntries(PIECES.map(p => [p.id, p]));
const DUO = Object.fromEntries(DUOS.map(d => [d.id, d]));
const duoFor = (a, b) => DUOS.find(d => (d.a === a && d.b === b) || (d.a === b && d.b === a));
// Nivel de una técnica (0 si no la llevas). Si llevas un dúo que la contiene, cuenta con el nivel del dúo.
const lv = id => { const cur = S.build[PIECE[id].slot]; if (!cur) return 0; if (cur.id === id) return cur.lvl; const D = DUO[cur.id]; return D && (D.a === id || D.b === id) ? cur.lvl : 0; };
const duoOn = id => { const cur = S.build[DUO[id].slot]; return !!cur && cur.id === id; };
const has = id => S.techs.has(id);
const godsIn = slot => { const cur = S.build[slot]; if (!cur) return []; const D = DUO[cur.id]; return D ? [PIECE[D.a].god, PIECE[D.b].god] : [PIECE[cur.id].god]; };
const godCount = g => SLOT_KEYS.filter(k => godsIn(k).includes(g)).length;
const mastery = g => godCount(g) >= 3;
const slotColor = slot => { const cur = S.build[slot]; return !cur ? C.energy : DUO[cur.id] ? RAR[3].color : GODS[PIECE[cur.id].god].color; };
const curName = cur => (DUO[cur.id] || PIECE[cur.id]).name;
// ¿Lleva el arma montada esa pieza? ¿Está activa esa resonancia?
const G = id => S.gun[PART[id].slot] === id;
const res = id => RES[id].parts.every(G) && RES[id].techs.every(t => lv(t) > 0);
const braced = () => G('s_brace') && S.p.still >= 0.5;
const gunRange = () => (1 + 0.05 * lv('forge_passive')) * ({ b_short: 0.7, b_twin: 0.75, b_scatter: 0.5, b_pierce: 1.3, b_spike: 0.5, b_bomb: 1.1, b_flame: 0.42, b_fork: 0.9, b_far: 1.25, b_boom: 0.85, b_horn: 0.55 }[S.gun.barrel] || 1) * (braced() ? 1.2 : 1) * (G('s_scope') ? 1.15 : 1);
const gunRate = () => (1 + 0.05 * lv('forge_passive')) * ({ a_drum: 1 }[S.gun.action] && furyFull() ? 1.25 : 1) * ({ b_short: 1.25, b_bomb: 0.65, b_flame: 1.4, b_flail: 0.8, b_nail: 1.2, b_boom: 0.8 }[S.gun.barrel] || 1) * (G('s_bone') ? 1 + 0.5 * clamp((1 - S.p.hp / S.p.maxHp - 0.25) / 0.5, 0, 1) : 1) * ({ a_semi: 1.2 * (1 + 0.4 * (S.p.runUp || 0)), a_burst: 0.85, a_draw: 0.65, a_combo: 1 + 0.08 * Math.min(8, S.p.comboN || 0), a_fly: 1 + 0.6 * (S.p.fly2 || 0), a_firm: S.p.still > 0.3 ? 1.5 : 0.8 }[S.gun.action] || 1) * ({ m_belt: 1.3, m_heavy: 0.8 }[S.gun.mag] || 1);
const gunDmg = () => (G('b_blow') || G('b_ghost') ? 0.85 : 1) * (G('s_tower') ? 1.25 : 1) * (G('s_sapper') && touchesWall(S.p, S.p.r + 10) ? 1.3 : 1) * (G('m_grow') ? 1 + 0.02 * (S.p.grow || 0) : 1) * (1 + 0.05 * lv('forge_passive')) * ({ a_semi: 0.75, a_rotary: 0.3, a_fuse: 1.45, a_auto: 0.8 }[S.gun.action] || 1) * ({ m_drum: 1.35, m_heavy: 1.3, m_blood: 1.4, m_big: 1.2 }[S.gun.mag] || 1) * (G('b_harpoon') ? 1.15 : 1) * ({ s_light: 0.9, s_heavy: 1.25 }[S.gun.stock] || 1) * (G('b_pierce') ? 0.9 : 1) * (braced() ? 1.4 : 1);
// Avisar cuando despierta una resonancia nueva en esta partida
// Cuántas piezas montadas son afines a una deidad de la que llevas alguna técnica
const th = god => godCount(god) >= 1;   // ¿llevas alguna técnica de esa deidad? Las piezas temáticas van a más
const aff = god => (godCount(god) >= 1 ? GSLOT_KEYS.reduce((n, k) => n + (affGod(S.gun[k]) === god ? 1 : 0), 0) : 0);
const ens = id => ENSEMBLES.some(E => E.id === id && E.parts.every(p => S.gun[PART[p].slot] === p));
const leg = id => { const L = legOf(S.gun); return !!L && L.id === id; };
function checkRes() {
  for (const E of ensOf(S.gun)) if (!S.resSeen.has('ens_' + E.id)) { S.resSeen.add('ens_' + E.id); sayRaw('[Ensamble: ' + E.name + '. ' + E.desc + ']', C.energy); blip(760, 0.3, 'triangle', 0.05, 500); }
  for (const g of GOD_KEYS) { const a = aff(g); if (a > 0 && (S.affSeen || (S.affSeen = {}))[g] !== a) { S.affSeen[g] = a; sayRaw('[Afinidad con ' + GODS[g].theme + ' ×' + a + ': ' + AFFIN[g] + (a > 1 ? ', por cada pieza' : '') + ']', GODS[g].color); } }
  { const L = legOf(S.gun); if (L && !S.resSeen.has('leg_' + L.id)) { S.resSeen.add('leg_' + L.id); M.legends = M.legends || {}; M.legends[L.id] = 1; save(); sayRaw('[Arma legendaria: ' + L.name + '. ' + L.desc + ']', RAR[3].color); blip(660, 0.6, 'triangle', 0.07, 900); } }
 for (const R of RESO) if (!S.resSeen.has(R.id) && res(R.id)) { S.resSeen.add(R.id); sayRaw('[Resonancia: ' + R.name + '. ' + R.desc + ']', RAR[3].color); blip(880, 0.4, 'triangle', 0.06, 700); } }
const dodgeMax = () => (G('s_roll') ? 1 : 0) + 1 + (S.plans.has('double') ? 1 : 0) + (tk('reflex') ? 1 : 0);
const dodgeCdOf = () => (G('s_gasp') && S.p.hp < S.p.maxHp * 0.25 ? 0.5 : 1) * T.dodge.cd * (G('s_light') ? 0.65 : 1) * (tk('reflex') >= 2 ? 0.8 : 1) * (has('t_second') ? 0.8 : 1);
const furyFull = () => S.p.fury >= 100;
const resMax = () => 30 * (has('f_cellar') ? 2 : 1);
const shadeCap = () => 2 + lv('shade_basic') + (has('s_legion') ? 3 : 0);
const echoDelay = t => t * (has('t_overtime') ? 0.5 : 1);
const isSlow = e => e.slowT > 0 || e.stun > 0;
const rangeOf = () => S.p.range * gunRange() * (1 + 0.05 * tk('eye'));
const periodOf = () => {
  const p = S.p, bl = lv('orc_passive');
  return 1 / (p.as * (has('h_frenzy') && p.hp < p.maxHp * 0.3 ? 1.4 : 1) * gunRate() * (1 + 0.03 * tk('rate')) * (bl && furyFull() ? 1 + 0.3 * bl : 1));
};

function nearestInRange() {
  const p = S.p, rng = rangeOf(); let bestE = null, bd = 1e9;
  for (const e of S.enemies) {
    if (!active(e)) continue;
    const d = dist(p, e) - e.r;
    if (d <= rng && d < bd && (G('b_ghost') || !blocked(p, e))) { bd = d; bestE = e; }
  }
  return bestE;
}
// Otros enemigos vivos cerca de un punto o enemigo, del más cercano al más lejano
function others(e, r, max) {
  const out = [];
  for (const o of S.enemies) { if (o === e || !active(o)) continue; const d = dist(e, o); if (d <= r) out.push([d, o]); }
  return out.sort((a, b) => a[0] - b[0]).slice(0, max).map(x => x[1]);
}
const note = (x, y, txt, col, big) => S.fx.push({ k: 'num', x, y, t: 0, life: big ? 1.2 : 0.7, txt, col, big });

// ───────────────────────── Recursos del jugador ─────────────────────────
function gainFury(n) { const p = S.p; if (!godCount('orc') && !G('a_drum')) return; n *= 1 + 0.15 * aff('orc'); p.fury = Math.min(100, p.fury + n); p.furyT = 2; }
function addReserve(n) { const p = S.p; p.reserve = Math.min(resMax(), p.reserve + n); p.resT = 3; }
function heal(n) {
  const p = S.p;
  if (n <= 0) return;
  n *= (mastery('feast') ? 1.5 : 1) * (1 + 0.1 * aff('feast'));
  p.hp += n;
  if (p.hp > p.maxHp) { const over = p.hp - p.maxHp; p.hp = p.maxHp; if (godCount('feast')) addReserve(over); }
  if (duoOn('warhunger')) gainFury(n * 2);                                    // dúo Hambre de guerra
}
function addGold(n) { const p = S.p; if (G('s_loot')) n = Math.round(n * 1.5); p.gold += n; if (duoOn('hoardfeast')) heal(n); }   // dúo Banquete del dragón

// ───────────────────────── Golpes, bajas y explosiones ─────────────────────────
function kill(e) {
  const p = S.p;
  S.kills += 1;
  for (let i = 0; i < 10; i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: rnd(-110, 110), vy: rnd(-110, 110), t: 0, life: rnd(0.25, 0.5), col: e.color });
  if (S.lock === e) S.lock = null;
  if (e.type.post) { S.postsDown = (S.postsDown || 0) + 1; addGold(20); sayRaw('[Estandarte derribado: ' + S.postsDown + ' de ' + (S.postsAll || 3) + ']', C.ink); if (S.postsDown < (S.postsAll || 3)) S.pendingLoot = true; }
  if (lv('frost_passive') && e.frozen > 0) for (const o of others(e, 90, 4)) addFrost(o, 2);    // Cero absoluto
  if (has('i_shatter') && e.frozen > 0) for (const o of others(e, 100, 4)) { S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.12, col: GODS.frost.color }); hit(o, p.dmg * 0.4, 0, 0, false, GODS.frost.color); }   // Astillas
  if (mastery('blood') && e.bleed > 0) heal(2);                                                // maestría Cobro final
  if (has('h_warm') && p.hp < p.maxHp / 2) heal(2);                                            // Sangre caliente
  if (S.t < (S.bloodT || 0)) { heal(5); if (duoOn('bloodrite') && !e.boss) raiseShade(e.x, e.y); }   // Sangría (y dúo Rito rojo)
  { const ep = lv('end_passive'); if (ep && e.doom && e.doom.acc > 0) { const o = others(e, 140, 1)[0]; if (o) { o.doom = { t: Math.max(2, e.doom.t), acc: e.doom.acc * (1 + 0.15 * (ep - 1)) + (o.doom ? o.doom.acc : 0) }; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.2, col: GODS.end.color }); } } }   // Epitafio
  if (has('u_halo') && e.lit > 0) explode(e.x, e.y, 46, p.dmg, { col: GODS.light.color });         // Halo
  if (G('s_grave') && !e.boss) { S.graveN = (S.graveN || 0) + 1; if (S.graveN >= (th('shade') ? 5 : 8)) { S.graveN = 0; S.stat.grave++; raiseShade(e.x, e.y); } }   // Culata de lápida
  if (G('s_wine')) { const k = th('feast') ? 2 : 1; if (p.hp >= p.maxHp) addReserve(k); else heal(k); }   // Culata de bota de vino
  if (G('m_gold')) addGold(1);
  if (G('m_blood')) heal(3);                                                                  // Bala de sangre
  if (e.elite && G('m_silver')) addGold(3);
  if (e.elite) { addGold(3); note(e.x, e.y - e.r - 10, '+3 oro', RAR[3].color); }
  if (e.elite === 'volatile') S.hazards.push({ x: e.x, y: e.y, r: 40, t: 0.9, t0: 0.9, dmg: e.dmg, col: '#ff8a3c' });   // élite volátil: revienta al morir
  stain(e); for (let i = 0; i < (e.boss ? 14 : 4); i++) S.fx.push({ k: 'smoke', x: e.x + rnd(-e.r, e.r), y: e.y + rnd(-e.r, e.r * 0.5), vx: rnd(-10, 10), vy: -rnd(8, 26), t: 0, life: rnd(0.4, 0.8) });
  blip(160, 0.12, 'sawtooth', 0.04, -90);
  if (e.boss) { S.ironRun += 2; for (const g of GOD_KEYS) if (Math.random() < 0.5) S.matsRun[g] += 1; }
  if (e.champ) { S.matsRun[e.god] += S.world; S.drop = { god: e.god, x: e.x, y: e.y }; say(e.god, 'champ'); blip(880, 0.25, 'triangle', 0.05, 400); }
  if (S.t < S.banquet) heal(4);
  { const bp = lv('wood_passive'), held = e.root > 0 || e.bram > 0;
    if (bp && held) heal(bp);                                                                  // Savia
    if (duoOn('amber') && held) addCrystal(e.x, e.y);                                          // dúo Ámbar
    if (has('b_bloom') && e.root > 0) S.zones.push({ x: e.x, y: e.y, r: 34, life: 3, acc: 0.4, slow: 0.5, dmg: p.dmg * 0.2, bram: true, col: GODS.wood.color });   // Floración
    if (duoOn('drowned') && e.wet > 0 && !e.boss) raiseShade(e.x, e.y); }                      // dúo Ahogados
  if (has('f_appet')) heal(1);                                                                 // Buen apetito
  if (has('s_last') && !S.firstKill && !e.boss) { S.firstKill = true; raiseShade(e.x, e.y); }  // Último servicio                                                                 // Banquete
  const tl = lv('dragon_passive');
  if (tl && e.ember > 0) { addGold(tl); note(e.x, e.y - e.r - 10, '+' + tl + ' oro', RAR[3].color); }   // Tesoro
  if (has('o_drums')) gainFury(10);
  if (lv('orc_passive') && furyFull()) p.dodgeN = dodgeMax();                                  // Sed de sangre
  if (has('m_quartz')) addCrystal(e.x, e.y);                                                   // Cuarzo vivo
  const vp = lv('venom_passive');
  if (vp && e.venom > 0) for (const o of others(e, 130, 1 + vp)) {                             // Plaga
    S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.2, col: GODS.venom.color });
    addVenom(o, e.venom);
  }
  if (lv('shade_basic') && e.mark > 0 && !e.boss) {                                            // Marca de tumba
    const x = e.x, y = e.y; raiseShade(x, y);
    if (duoOn('clockmark')) S.timers.push({ t: echoDelay(1.5), fn: () => raiseShade(x, y) });      // dúo Marca del reloj
  }
  const st = e.ember;
  if (has('d_pyre') && st > 0) explode(e.x, e.y, 46, p.dmg * 0.3 * st, { ember: Math.ceil(st / 2), col: GODS.dragon.color });   // Pira
}

function hit(e, dmg, ux, uy, big, col) {
  if (!active(e)) return;
  const p = S.p, ob = lv('orc_basic'), tl = lv('dragon_passive'), gl = lv('feast_passive'), sl = lv('shade_passive'), ti = lv('time_passive');
  if (ob) dmg *= 1 + 0.4 * ob * p.fury / 100;                                                  // Tambor de guerra
  if (tl) dmg *= 1 + Math.min((30 + 10 * tl) / 100, 0.01 * tl * Math.floor(p.gold / 10));     // Tesoro
  if (gl) dmg *= 1 + 0.01 * gl * (p.reserve + (duoOn('hoardfeast') ? p.gold / 10 : 0));          // Glotón
  if (sl) dmg *= 1 + 0.08 * sl * S.shades.length;
  { const as = aff('shade'); if (as) dmg *= 1 + 0.02 * as * S.shades.length; }                                              // Séquito
  if (ti && isSlow(e)) dmg *= 1 + 0.3 * ti;                                                    // Reloj de arena
  { const wp = lv('tide_passive'), bp = lv('wood_passive'), lp = lv('luck_passive');
    if (wp && e.wet > 0) dmg *= 1 + 0.15 * wp;                                                 // Marea alta
    if (bp && (e.root > 0 || e.bram > 0)) dmg *= 1 + 0.2 * bp;                                 // Savia
    if (lp) dmg *= 1 + 0.06 * lp * p.streak;                                                   // Racha
    { const fb3 = lv('forge_basic'), bp3 = lv('beast_passive');
      if (fb3 || p.temper > 0) dmg *= 1 + 0.03 * temperNow();                                   // Temple
      if (bp3 && e.hp / e.maxHp < 0.3) dmg *= 1 + 0.25 * bp3;                                   // Olfato
      if (has('g_whet')) dmg *= 1.08; }
    { const lp2 = lv('light_passive'), vp2 = lv('void_passive'), db = lv('dream_basic');
      if (lp2) dmg *= 1 + 0.05 * lp2 * Math.min(6, litCount());                                 // Sin sombra
      if (vp2) dmg *= 1 + 0.08 * vp2 * packed(e) * (duoOn('thicket') && (e.root > 0 || e.bram > 0) ? 2 : 1);   // Apiñados (y dúo Espesura)
      if (e.sleep > 0) { dmg *= 1 + Math.max(1, db) * (S._night ? 0 : 1) + (S._night ? 0.8 * lv('dream_charge') : 0); if (!S._night) { if (e.sleepHits > 0) e.sleepHits--; else wake(e); } } }   // Arrullo / Pesadilla
    { const fp = lv('frost_passive'), bp2 = lv('blood_passive');
      if (fp && e.frozen > 0) dmg *= 1 + 0.25 * fp;                                            // Cero absoluto
      if (bp2 && p.hp < p.maxHp / 2) dmg *= 1 + 0.2 * bp2; }                                   // Deuda
    if (duoOn('orchard') && e.root > 0) heal(1); }                                             // dúo Huerto
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);                                  // Organismo débil
  if (e.inWell > 0 && leg('blacksun')) dmg *= 1.5;                                             // legendaria Sol Negro
  if (e.traced > 0) dmg *= 1.3;                                                               // Bala trazadora
  if (G('m_silver')) dmg *= e.boss || e.champ || e.elite ? 1.6 : 0.9;                              // Bala de plata
  if (e.boss && e.act === 'dazed') dmg *= 2;
  if (e.hp / e.maxHp < 0.3) dmg *= 1 + 0.08 * tk('coup');                                       // árbol: Golpe de gracia
  if (has('o_scars') && p.hp < p.maxHp / 2) dmg *= 1.15;                                       // Cicatrices
  e.hp -= dmg; e.flash = 0.1; S.dealt = (S.dealt || 0) + dmg; S.lastHitT = S.t;
  if (e.doom && !S._doom) e.doom.acc += dmg;                                                   // Sentencia: va sumando
  if (e.lit > 0 && !S._share) { const lb = lv('light_basic'); if (lb) { S._share = true; for (const o of S.enemies.slice()) if (o !== e && active(o) && o.lit > 0) { S.stat.share++; hit(o, dmg * shareK(), 0, 0, false, GODS.light.color); } S._share = false; } }   // Señalar: reparto entre Iluminados
  if (has('u_glint') && !e.glinted) { e.glinted = true; light(e); }                            // Primer rayo
  const kb = (big ? 150 : 60) * (e.boss ? 0.06 : 1); e.kx += ux * kb; e.ky += uy * kb;
  S.fx.push({ k: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r - 2, t: 0, life: 0.55, txt: String(Math.round(dmg)), big });
  for (let i = 0; i < (big ? 7 : 3); i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: ux * rnd(40, 140) + rnd(-50, 50), vy: uy * rnd(40, 140) + rnd(-50, 50), t: 0, life: rnd(0.15, 0.3), col: col || C.energy });
  S.shake = Math.max(S.shake, big ? 5 : 1.6);
  if (S.t - S.lastStop > 0.16) { S.hitstop = big ? 0.05 : 0.02; S.lastStop = S.t; }   // micropausa de impacto, sin encadenarse
  gainFury(2);
  if (e.hp > 0 && has('f_carve') && !e.boss && e.hp / e.maxHp < 0.12) { e.hp = 0; note(e.x, e.y - e.r - 12, '¡Trinchado!', GODS.feast.color); }   // Trinchar
  if (e.hp <= 0) kill(e); else blip(520, 0.035, 'square', 0.025);
}
// Daño continuo: sin pausa ni empujón
function dot(e, dmg, col) {
  if (!active(e)) return;
  const ti = lv('time_passive');
  if (ti && isSlow(e)) dmg *= 1 + 0.3 * ti;
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);
  if (e.sleep > 0) { const dp = lv('dream_passive'); if (dp) dmg *= 1 + 0.5 * dp; else wake(e); }   // Sonámbulos: el daño continuo no despierta
  e.hp -= dmg; S.dealt = (S.dealt || 0) + dmg; S.lastHitT = S.t;
  S.fx.push({ k: 'num', x: e.x + rnd(-6, 6), y: e.y - e.r - 2, t: 0, life: 0.4, txt: String(Math.max(1, Math.round(dmg))), col });
  if (e.hp <= 0) kill(e);
  return dmg;
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
    if (o.push && !e.boss) { e.kx += dx / d * o.push; e.ky += dy / d * o.push; }
    if (o.stun) stun(e, o.stun);
    const em = (o.ember || 0) + (blood ? 2 : 0), ve = (o.venom || 0) + (vap ? 3 : 0);
    if (em) addEmber(e, em);
    if (ve) addVenom(e, ve);
    if (o.zap) { discharge(e, 0.8, null); addNeedles(e, 2); }
    if (o.payoff) chargePayoff(e);
  }
  if (has('o_drums')) gainFury(8);
  if (has('m_reson') && !o.echo) {                                         // Resonancia
    let c = null, cd = 170;
    for (const k of S.crystals) { const d = Math.hypot(k.x - x, k.y - y); if (d < cd && d > 4) { cd = d; c = k; } }
    if (c) S.timers.push({ t: 0.09, fn: () => explode(c.x, c.y, 36, S.p.dmg * 0.6, { col: GODS.stone.color, echo: true, soft: true }) });
  }
}

// ───────────────────────── Lo que se acumula ─────────────────────────
function addEmber(e, n) { if (!active(e) || n <= 0) return; e.ember = Math.min((mastery('dragon') ? 20 : 8) + (G('b_wyrm') && th('dragon') ? 4 : 0), e.ember + n); e.emberT = 4; }
function addVenom(e, n) { if (active(e) && n > 0) { const was = e.venom; e.venom = Math.min(30, e.venom + n * (duoOn('brine') && e.wet > 0 ? 2 : 1)); if (duoOn('poppy') && was < 10 && e.venom >= 10) sleep(e, 3); } }   // (dúos Salmuera y Adormidera)   // (dúo Salmuera)
// Espejos, Bestias y Forja: el Reflejo, el sabueso y el Temple
const mirrorN = () => (lv('mirror_basic') || lv('mirror_charge') ? (mastery('mirror') ? 2 : 1) : 0);
const petN = () => (leg('pack') ? 2 : 0) + (lv('beast_basic') || lv('beast_charge') || lv('beast_dodge') ? (mastery('beast') ? 2 : 1) + (G('s_kennel') ? 1 : 0) : G('s_kennel') ? (th('beast') ? 2 : 1) : has('a_pup') ? 1 : 0);
const temperMax = () => (mastery('forge') ? 15 : 10) + aff('forge') + (leg('master') ? 10 : 0);
const temperNow = () => S.p.temper + (duoOn('whetstone') ? S.crystals.length : 0);
function addTemper(n) { const p = S.p; if (n > 0 && p.temper < temperMax()) { p.temper = Math.min(temperMax(), p.temper + n); S.stat.temper++; } }
function bite(pet, e, k) {
  if (!active(e)) return; const p = S.p, d = Math.hypot(e.x - pet.x, e.y - pet.y) || 1; S.stat.bite++;
  S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 4, t: 0, life: 0.1, col: GODS.beast.color });
  onHit(e, p.dmg * k * (1 + 0.12 * aff('beast')), (e.x - pet.x) / d, (e.y - pet.y) / d, false, GODS.beast.color, 'pet');
  if (duoOn('rabid')) addVenom(e, 2); if (duoOn('warhound')) gainFury(4);
  if (!active(e) && has('a_feral')) heal(2);
}
// Luz: Iluminar. Sueño: dormir. Vacío: pozos que arrastran.
const shareK = () => 0.2 + 0.1 * lv('light_basic') + 0.04 * aff('light');
function light(e, t) { if (active(e)) e.lit = Math.max(e.lit || 0, t || 6); }
const litCount = () => S.enemies.reduce((n, e) => n + (active(e) && e.lit > 0 ? 1 : 0), 0) + (duoOn('eclipse') ? S.shades.length : 0);
function sleep(e, t) {
  if (!active(e) || (e.sleepCd || 0) > S.t) return;
  t = (t + 0.4 * aff('dream')) * (duoOn('siesta') ? 2 : 1);
  if (e.boss) { slow(e, t * 0.5, 0.5); e.sleepCd = S.t + 6; return; }
  e.sleep = Math.max(e.sleep || 0, t); e.sleepHits = mastery('dream') ? 1 : 0; e.wind = 0; e.cast = 0; e.lungeWind = 0; S.stat.sleep++;
  note(e.x, e.y - e.r - 10, 'Zzz', GODS.dream.color);
}
function wake(e) { e.sleep = 0; e.sleepCd = S.t + 4; if (has('z_night')) slow(e, 2, 0.5); }
function tug(e, r, f) { for (const o of others(e, r, 8)) { if (o.boss || o.type.post) continue; const d = dist(e, o) || 1; o.kx += (e.x - o.x) / d * f; o.ky += (e.y - o.y) / d * f; o.slamCd = Math.max(o.slamCd || 0, 0.4); } }
function addWell(x, y, r, life, pulse, end, o) { const k = (mastery('void') ? 1.4 : 1) * (1 + 0.1 * aff('void')); S.wells.push(Object.assign({ x, y, r: r * k, life: life + (mastery('void') ? 1 : 0), acc: 0, pulse, end, got: new Set() }, o || {})); S.stat.well++; }
const packed = e => { let n = 0; for (const o of S.enemies) if (o !== e && active(o) && dist(e, o) < e.r + o.r + 26) n++; return Math.min(4, n); };
// Hielo: la Escarcha se acumula; a la quinta, Congelado
function freeze(e) {
  if (!active(e)) return;
  const dur = (1.5 + 0.3 * aff('frost') + (duoOn('stillness') ? 1.5 : 0)) * (mastery('frost') ? 2 : 1);
  e.frost = 0; e.frozen = e.boss ? dur * 0.5 : dur; S.stat.frozen++;
  if (e.boss) slow(e, dur, 0.4); else stun(e, dur);
  note(e.x, e.y - e.r - 10, '¡Congelado!', GODS.frost.color); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 8, t: 0, life: 0.25, col: GODS.frost.color }); blip(1500, 0.12, 'sine', 0.04, -600);
  if (duoOn('hibernate')) e.napAfter = true;                                          // dúo Hibernar
  if (duoOn('glacier')) addCrystal(e.x + rnd(-12, 12), e.y + rnd(-12, 12));           // dúo Glaciar
  if (duoOn('hail') && e.needles > 0) discharge(e, 0.8, null);                        // dúo Granizo
}
function addFrost(e, n) { if (!active(e) || e.frozen > 0 || n <= 0) return; e.frost = (e.frost || 0) + n; e.frostT = 4; if (e.frost >= 5) freeze(e); else slow(e, 2, 1 - 0.12 * e.frost); }
// Sangre: Heridas que sangran según la vida que te falta
function addBleed(e, n) { if (!active(e) || n <= 0) return; if (leg('widow')) addVenom(e, n); e.bleed = Math.min(6, (e.bleed || 0) + n); e.bleedT = 5; if (duoOn('warwound')) gainFury(3 * n); }
function payLife(n) { const p = S.p; n = Math.min(n, p.hp - 1); if (n <= 0) return 0; p.hp -= n; if (duoOn('bloodwine')) addReserve(n); return n; }   // (dúo Vino de sangre)
// Final: Sentencias que devuelven de golpe parte del daño acumulado
const doomK = () => (0.3 + 0.1 * Math.max(1, lv('end_basic')) + 0.06 * aff('end')) * (G('c_doom') && th('end') ? 1.5 : 1);
function addDoom(e) { if (active(e) && !e.doom) e.doom = { t: mastery('end') ? 3 : 5, acc: 0 }; }
function fulfil(e, bonus) {
  const d = e.doom; if (!d || !active(e)) return;
  e.doom = null; S.stat.doom++;
  if (d.acc > 0) { S._doom = true; note(e.x, e.y - e.r - 12, '¡Sentencia!', GODS.end.color, true); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 10, t: 0, life: 0.2, col: GODS.end.color }); hit(e, d.acc * doomK() * (bonus || 1), 0, 0, true, GODS.end.color); S._doom = false; }
  if (has('e_seal') && active(e)) stun(e, 0.5);
  if (duoOn('obituary') && !active(e) && !e.boss) raiseShade(e.x, e.y);               // dúo Obituario
}
// Mareas: empapar y empujar. Bosque: semillas que brotan en raíces. Fortuna: críticos.
function soak(e, t) { if (active(e)) e.wet = Math.max(e.wet || 0, t); }
function push(e, ux, uy, f) { if (!active(e) || e.boss) return; e.kx += ux * f; e.ky += uy * f; }
function root(e, t) {
  if (!active(e)) return;
  t *= (1 + 0.15 * aff('wood')) * (mastery('wood') ? 2 : 1) * (duoOn('mangrove') && e.wet > 0 ? 2 : 1) * (e.boss ? 0.35 : 1);
  e.root = Math.max(e.root || 0, t); slow(e, t, 0.02);
  S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 6, t: 0, life: 0.2, col: GODS.wood.color });
}
function sprout(e) {
  const p = S.p, wb = Math.max(1, lv('wood_basic'));
  e.seed = mastery('wood') ? 2 : 0; S.stat.sprout++;
  note(e.x, e.y - e.r - 10, '¡Brota!', GODS.wood.color);
  root(e, 1.5); hit(e, p.dmg * 0.8 * wb, 0, 0, true, GODS.wood.color);
  if (duoOn('graveroot')) raiseShade(e.x + rnd(-12, 12), e.y + rnd(-12, 12));           // dúo Raíz de tumba
  if (duoOn('thornrod') && active(e) && e.needles > 0) discharge(e, 0.8, null);       // dúo Espina de cobre
}
function addSeed(e, n) { if (!active(e)) return; e.seed = (e.seed || 0) + n; if (e.seed >= (lv('wood_basic') >= 2 || (G('m_seed') && th('wood')) ? 2 : 3)) sprout(e); }
const critChance = () => { const lb = lv('luck_basic'); return (lb ? 0.1 + 0.1 * lb + S.p.pity : 0) + (has('l_coin') ? 0.08 : 0) + (G('a_dice') ? (th('luck') ? 0.25 : 0.15) : 0) + 0.03 * aff('luck') + (duoOn('bones') ? 0.05 * S.shades.length : 0); };
const critMult = () => (mastery('luck') ? 4 : 2.5);
function onCrit(e) {
  const p = S.p;
  S.stat.crit++; p.pity = 0; note(e.x, e.y - e.r - 12, '¡Crítico!', GODS.luck.color, true); blip(2100, 0.06, 'square', 0.04, 300);
  if (lv('luck_passive')) p.streak = Math.min(5, p.streak + 1);                       // Racha
  if (duoOn('jackpot')) addGold(1);                                                   // dúo Tesoro maldito
  if (duoOn('facet')) addCrystal(e.x + rnd(-14, 14), e.y + rnd(-14, 14));             // dúo Faceta
  if (duoOn('snakeeyes') && e.venom > 0) e.venom = Math.min(30, e.venom * 2);         // dúo Ojos de serpiente
  if (duoOn('clover') && active(e) && e.seed > 0) sprout(e);                          // dúo Trébol
  if (duoOn('verdict') && active(e) && e.doom) fulfil(e);                             // dúo Veredicto
  if (has('l_jack') && !active(e)) { explode(e.x, e.y, 48, p.dmg * 1.5, { col: GODS.luck.color }); addGold(3); }   // Premio gordo
}
function stun(e, t) { if (!active(e) || e.boss) return; e.stun = Math.max(e.stun, t); e.wind = 0; e.cast = 0; e.lungeWind = 0; e.lungeT = 0; }
function slow(e, t, f) { if (e.boss) f = 1 - (1 - f) * 0.4; e.slowT = Math.max(e.slowT, t); e.slowF = Math.min(e.slowF, f); }
function addCrystal(x, y) {
  const at = unstick(clamp(x, 12, T.room.w - 12), clamp(y, 12, T.room.h - 12));
  S.crystals.push({ x: at.x, y: at.y, life: (has('m_quartz') ? 18 : 9) * (1 + 0.2 * aff('stone')), acc: 0 });
  const max = mastery('stone') ? 12 : 6;
  while (S.crystals.length > max) S.crystals.shift();
}
// Agujas y rayos (Tormenta)
function addNeedles(e, n) {
  if (!active(e) || n <= 0) return;
  e.needles = Math.min(6, e.needles + n); e.needleT = 6;
  if (e.needles >= 6 && has('r_over') && e.autoCd <= 0) { e.autoCd = 0.4; discharge(e, 1, null); }   // Sobrecarga
}
function bolt(from, to, dmg, cas) {
  if (!to || !active(to)) return;
  if (duoOn('beacon')) light(to);                                                     // dúo Faro
  const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy) || 1;
  S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: to.x, y2: to.y, t: 0, life: 0.16, col: GODS.storm.color, w: 1.4 });
  hit(to, dmg, dx / d, dy / d, false, GODS.storm.color);
  if (!cas || !active(to)) return;
  if (cas.venom) addVenom(to, cas.venom);                                                      // dúo Aguja envenenada
  if (to.needles > 0 && !cas.seen.has(to) && mastery('storm')) discharge(to, cas.mult, cas);   // Tormenta perfecta
  const c = lv('storm_passive');
  if (c) addNeedles(to, c);                                                                    // Conductor
}
// Descargar las Agujas de un enemigo: daño por aguja y un rayo por aguja hacia otros. Devuelve cuántas tenía.
function discharge(e, mult, cas) {
  const n = e.needles;
  if (!n || !active(e)) return 0;
  mult *= 1 + 0.1 * aff('storm');
  cas = cas || { seen: new Set(), mult, venom: 0 };
  cas.seen.add(e); e.needles = 0;
  if (duoOn('syringe')) cas.venom = Math.max(cas.venom, e.venom);
  const x = e.x, y = e.y, src = { x, y }, tg = others(e, 125, 6);
  let nb = n;
  if (duoOn('rod')) { const c = S.crystals.find(k => Math.hypot(k.x - x, k.y - y) < 150); if (c) { nb *= 2; S.fx.push({ k: 'beam', x1: x, y1: y, x2: c.x, y2: c.y, t: 0, life: 0.18, w: 2, col: GODS.storm.color }); src.x = c.x; src.y = c.y; } }   // dúo Pararrayos
  S.fx.push({ k: 'ring', x, y, r: 16 + n * 3, t: 0, life: 0.22, col: GODS.storm.color });
  blip(1000 + n * 120, 0.1, 'square', 0.04, -500);
  hit(e, S.p.dmg * mult * n, 0, 0, true, GODS.storm.color);
  for (let i = 0; i < Math.min(14, nb) && tg.length; i++) bolt(src, tg[i % tg.length], S.p.dmg * mult * 0.6, cas);
  if (has('r_judge')) explode(x, y, 60, S.p.dmg * 3, { col: '#ffffff' });   // Juicio
  return n;
}
// Sombras
function raiseShade(x, y, life, temp) {
  const base = (has('s_legion') ? 18 : 9) * (mastery('shade') ? 1.5 : 1);
  if (!temp) { const own = S.shades.filter(s => !s.temp); if (own.length >= shadeCap()) { const old = own[0]; S.shades.splice(S.shades.indexOf(old), 1); } }
  S.shades.push({ x: clamp(x, 8, T.room.w - 8), y: clamp(y, 8, T.room.h - 8), life: life || base, cd: 0.3, temp: !!temp });
  S.fx.push({ k: 'ring', x, y, r: 16, t: 0, life: 0.3, col: GODS.shade.color });
}
function shadeEnd(s) {
  if (duoOn('ashlegion')) explode(s.x, s.y, 40, S.p.dmg, { col: GODS.dragon.color, soft: true });                 // dúo Ejército de ceniza
  if (duoOn('chargedshade')) for (const o of others(s, 70, 4)) discharge(o, 0.8, null);                           // dúo Sombras cargadas
}
function shadeStrike(s, e) {
  const p = S.p, dmg = p.dmg * 0.4 * (mastery('shade') ? 1.5 : 1), dx = e.x - s.x, dy = e.y - s.y, d = Math.hypot(dx, dy) || 1;
  if (lv('shade_passive')) onHit(e, dmg, dx / d, dy / d, false, GODS.shade.color, 'shade'); else hit(e, dmg, dx / d, dy / d, false, GODS.shade.color);
  if (duoOn('ashlegion')) addEmber(e, 2);
  if (duoOn('chargedshade')) addNeedles(e, 1);
  if (duoOn('supper') && active(e) && !e.boss && e.hp / e.maxHp < 0.2) hit(e, e.hp + 1, 0, 0, true, GODS.feast.color);   // dúo Última cena
}

// ───────────────────────── Balas ─────────────────────────
// Un impacto de bala, venga de ti, de un eco, de un Cristal, de una Sombra o de un arma gemela
function onHit(e, dmg, ux, uy, big, col, src) {
  hit(e, dmg, ux, uy, big, col);
  const p = S.p, db = lv('dragon_basic'), vb = lv('venom_basic'), fb = lv('feast_basic'), sb = lv('stone_basic'), rb = lv('storm_basic');
  if (db) addEmber(e, db * (src === 'echo' && duoOn('eternal') ? 2 : 1));                         // Colmillo al rojo (y dúo Brasa eterna)
  if (vb) addVenom(e, vb * (G('b_blow') ? 2 : 1));                                                                     // Dardo
  if (duoOn('boil')) addVenom(e, Math.floor(p.fury / 20));                                        // dúo Sangre hirviente
  if (fb) heal(0.5 * fb * (duoOn('warhunger') && furyFull() ? 3 : 1) * (p.feastShot ? 3 : 1));                            // Bocado
  if (rb) addNeedles(e, rb);                                                                   // Aguja estática
  { const wb = lv('tide_basic');
    if (wb && active(e)) { soak(e, 4); push(e, ux, uy, 150 * (duoOn('ram') && furyFull() ? 2 : 1)); }   // Oleaje (y dúo Ariete)
    if (lv('wood_basic') && active(e)) addSeed(e, 1); }                                        // Semilla
  { const fb2 = lv('frost_basic'), bb = lv('blood_basic');
    if (fb2) addFrost(e, fb2);                                                                 // Aliento helado
    if (bb) addBleed(e, bb);                                                                   // Herida abierta
    if (lv('end_basic') && src !== 'turret') addDoom(e);                                       // Sentencia
    if (src === 'echo' && duoOn('deadline') && e.doom) e.doom.acc += dmg; }                    // dúo Plazo vencido
  { const lb2 = lv('light_basic'), db2 = lv('dream_basic'), vb2 = lv('void_basic');
    if (lb2 || (src === 'shade' && duoOn('eclipse'))) light(e);                                // Señalar (y dúo Eclipse)
    if (db2 && src === 'player' && p.shotN % Math.max(2, 5 - db2) === 0 && active(e)) sleep(e, 3);   // Arrullo
    if (vb2 && src === 'player' && active(e)) tug(e, 70, 55 + 25 * vb2); }                     // Gravedad
  if (src === 'player') {   // ofrendas y resonancia Vigilia
    if (res('vigil') && braced()) slow(e, 1, 0.4);
    if (has('d_warm') && p.shotN % 4 === 0) addEmber(e, 1);
    if (has('v_slow') && p.shotN % 3 === 0) addVenom(e, 1);
    if (has('r_spark') && p.shotN % 5 === 0) bolt(e, others(e, 120, 1)[0], dmg * 0.6, null);
    if (has('w_brine') && p.shotN % 4 === 0) push(e, ux, uy, 170);
    if (has('b_thorn') && p.shotN % 5 === 0) root(e, 0.8);
    if (has('i_rime') && p.shotN % 4 === 0) addFrost(e, 1);
    if (has('o_tug') && p.shotN % 4 === 0 && active(e)) tug(e, 80, 110);
    if (has('q_shard') && p.shotN % 5 === 0 && active(e) && !S._shard) { S._shard = true; S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 6, t: 0, life: 0.12, col: GODS.mirror.color }); hit(e, dmg * 0.5, ux, uy, false, GODS.mirror.color); S._shard = false; }
    if (S.pets.length && S.pets.some(pt => pt.prey === e)) hit(e, dmg * 0.15, 0, 0, false, GODS.beast.color);   // Sabueso: +15% a su presa
    if (p.redhot > 0) { const o = others(e, 60, 1)[0]; if (o) { S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.1, col: GODS.forge.color }); hit(o, dmg * 0.5, 0, 0, false, GODS.forge.color); } if (duoOn('quench')) addNeedles(e, 2); }   // Al rojo (y dúo Templar al rayo)
    if (has('g_slag') && p.temper >= temperMax()) explode(e.x, e.y, 30, dmg * 0.3, { col: GODS.forge.color, soft: true, skip: e });
    if (duoOn('forgefire') && temperNow() >= 5) addEmber(e, 1);
    if (has('e_ink') && p.shotN % 4 === 0) addDoom(e);
  }
  if (lv('shade_basic') && active(e)) e.mark = 6;                                              // Marca de tumba
  if (sb && src === 'player') { p.crysN += 1; if (p.crysN % Math.max(1, 4 - sb) === 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }   // Esquirla
}
// Una bala tuya: además del impacto, deja eco (Segundero), la repiten los Cristales (Veta) y puede soltar un rayo
function shot(e, dmg, ux, uy, big, col) {
  const p = S.p, ox = p.x, oy = p.y, cc = critChance();
  let crit = false;
  if (cc > 0) { if (Math.random() < cc) { crit = true; dmg *= critMult(); big = true; } else if (lv('luck_basic')) p.pity += 0.05; }
  if (G('m_salt') && e.wet > 0) dmg *= 1.15;
  if (G('m_star') && e.lit > 0) dmg *= th('light') ? 1.25 : 1.12;
  if (G('s_scope') && !e.scoped) { e.scoped = true; dmg *= ens('marksman') ? 3 : 1.8; big = true; S.stat.first++; }       // Culata de catalejo: primer tiro
  if (G('m_ice') && active(e)) {                                                               // Bala de escarcha
    if (e.slowT > 0 && e.iceT > 0 && (e.frozeCd || 0) <= S.t) { e.frozeCd = S.t + 3; stun(e, 0.8); S.stat.freeze++; note(e.x, e.y - e.r - 10, '¡Congelado!', '#bfe9ff'); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 7, t: 0, life: 0.2, col: '#bfe9ff' }); }
    slow(e, 1.5, 0.7); e.iceT = 1.5; if (res('coldiron')) addFrost(e, 1);                       // resonancia Hierro frío
  }
  onHit(e, dmg, ux, uy, big, col, 'player');
  if (G('m_blunt') && p.shotN % 5 === 0 && active(e)) stun(e, 0.6);                             // Bala roma
  if (G('m_grow') && !active(e) && !e.boss) p.grow = Math.min(30, (p.grow || 0) + 1);          // Bala voraz
  if (G('m_leech')) { p.leechN = (p.leechN || 0) + 1; if (p.leechN >= 8) { p.leechN = 0; heal(2); } }   // Bala sanguijuela
  if (G('m_awl') && !S._awl) { S._awl = true; let bestE = null, ba = 70;                       // Bala de punzón: el de detrás
    for (const o of S.enemies) { if (!active(o) || o === e) continue; const ex = o.x - e.x, ey = o.y - e.y, al = ex * ux + ey * uy; if (al > 0 && al - o.r < ba && Math.abs(ex * uy - ey * ux) <= o.r + 7) { ba = al - o.r; bestE = o; } }
    if (bestE) { S.stat.awl++; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: bestE.x, y2: bestE.y, t: 0, life: 0.1, col }); onHit(bestE, dmg * 0.6, ux, uy, false, col, 'player'); } S._awl = false; }
  if (G('m_timed') && !S._timed) { const tx = e.x, ty = e.y, dm = dmg * 0.5; S.timers.push({ t: 1, fn: () => { const x = active(e) ? e.x : tx, y = active(e) ? e.y : ty; S._timed = true; S.stat.timed++; explode(x, y, 36, dm, { col: C.ember, soft: true }); S._timed = false; } }); }   // Bala de mecha
  if (G('m_seed') && active(e)) addSeed(e, 1);                                                 // Bala de bellota
  if (G('m_saw') && active(e)) addBleed(e, th('blood') ? 2 : 1);                               // Bala serrada
  if (G('m_salt') && active(e)) { soak(e, 3); push(e, ux, uy, th('tide') ? 110 : 55); }        // Bala de sal
  if (G('m_star') && active(e)) light(e, 4);                                                   // Bala de lucero
  if (G('m_quick') && p.shotN % (th('mirror') ? 2 : 4) === 0 && active(e) && !S._quick) { S._quick = true; S.stat.quickb++; S.fx.push({ k: 'tracer', x1: e.x + ux * 50, y1: e.y + uy * 50, x2: e.x, y2: e.y, t: 0, life: 0.12, col: GODS.mirror.color }); hit(e, dmg * 0.5, -ux, -uy, false, GODS.mirror.color); S._quick = false; }   // Bala de azogue
  if (G('m_fire')) S.zones.push({ x: e.x, y: e.y, r: 16, life: ens('trail') ? 6 : 2, acc: 0.4, ember: 1, col: GODS.dragon.color });   // Bala incendiaria
  if (G('m_mark') && active(e)) { e.traceN = (e.traceN || 0) + 1; if (e.traceN >= 3) { e.traceN = 0; e.traced = 5; S.stat.traced++; note(e.x, e.y - e.r - 10, '¡Marcado!', C.energy); } }   // Bala trazadora
  if (G('m_big') && !S._big) { S._big = true; for (const o of others(e, e.r + 22, 4)) { S.stat.splash++; hit(o, dmg * 0.5, ux, uy, false, col); } S._big = false; }   // Bala de calibre
  if (G('m_split') && !S._split) {                                                             // Bala partida
    S._split = true;
    for (const sg of [-1, 1]) { const a = Math.atan2(uy, ux) + sg * 0.75, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(e.x, e.y, rx, ry, 110);
      for (const o of S.enemies) { if (!active(o) || o === e) continue; const ex = o.x - e.x, ey = o.y - e.y, al = ex * rx + ey * ry; if (al >= 0 && al - o.r < ba && Math.abs(ex * ry - ey * rx) <= o.r + 6) { ba = Math.max(0, al - o.r); bestE = o; } }
      S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: e.x + rx * ba, y2: e.y + ry * ba, t: 0, life: 0.1, col });
      if (bestE) { S.stat.split++; onHit(bestE, dmg * 0.35 * (ens('splinter') ? 2 : 1) * (res('mirrorhall') ? 2 : 1), rx, ry, false, col, 'player'); } }
    S._split = false;
  }
  if (G('m_frag') && !active(e) && !S._frag) {                                                 // Bala de metralla: estalla al matar
    S._frag = true; S.stat.frag++;
    for (const o of others(e, ens('cluster') ? 130 : 90, ens('cluster') ? 8 : 5)) { const d = dist(e, o) || 1; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.12, col: C.ink }); onHit(o, dmg * 0.3, (o.x - e.x) / d, (o.y - e.y) / d, false, col, 'frag'); }
    S._frag = false;
  }
  if (crit) onCrit(e);
  const tb = lv('time_basic'), sp = lv('stone_passive');
  if (tb) {
    const m = (mastery('time') ? 1 : 0.5 + 0.15 * (tb - 1)) * (1 + 0.08 * aff('time'));
    const echo = (d, gen, extra) => S.timers.push({ t: echoDelay(1.5) + (extra || 0), fn: () => {
      if (!active(e)) return;
      S.fx.push({ k: 'tracer', x1: ox, y1: oy, x2: e.x, y2: e.y, t: 0, life: 0.14, col: GODS.time.color, w: 1.2 });
      const lucky = duoOn('loaded') && Math.random() < critChance();                             // dúo Dado trucado
      onHit(e, d * (lucky ? critMult() : 1), ux, uy, lucky, GODS.time.color, 'echo'); if (lucky) onCrit(e);
      if (has('t_paradox') && gen < 2) echo(d * 0.6, gen + 1);                                 // Paradoja
    } });
    echo(dmg * m, 1);
    if (res('clockwork') && p.drawPow >= 1) echo(dmg * m, 1, 0.35);                             // resonancia Reloj de cuerda
  }
  if (sp && S.crystals.length) {                                                               // Veta
    const near = S.crystals.map(c => [Math.hypot(c.x - e.x, c.y - e.y), c]).filter(x => x[0] < 170).sort((a, b) => a[0] - b[0]).slice(0, mastery('stone') ? 2 : 1);
    for (const [d, c] of near) {
      S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: e.x, y2: e.y, t: 0, life: 0.1, col: GODS.stone.color });
      onHit(e, dmg * 0.3 * sp * (res('crossfire') ? 2 : 1), (e.x - c.x) / (d || 1), (e.y - c.y) / (d || 1), false, GODS.stone.color, 'crystal');   // Veta (y resonancia Fuego cruzado)
    }
  }
  if (duoOn('warthunder') && furyFull()) bolt(e, others(e, 120, 1)[0], dmg * 0.6, null);          // dúo Trueno de guerra
  if (G('m_chain')) {                                                                          // Bala enramada: salta al más cercano
    const o = others(e, 95, 1)[0];
    if (o) { const d = dist(e, o) || 1; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.14, col: C.ink, w: 1.6 }); S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 7, t: 0, life: 0.14, col: C.ink }); S.stat.chain++; onHit(o, dmg * 0.5, (o.x - e.x) / d, (o.y - e.y) / d, false, col, 'player'); }
  }
  if (G('m_heavy') && active(e) && !e.boss) { e.kx += ux * 150; e.ky += uy * 150; }               // Bala de cañón: empuja
}

// Un tirón del gatillo: mecanismo y cargador deciden cuánto y cómo; el cañón decide a quién le da.
function fireBasic(target) {
  const p = S.p, g = S.gun, draw = g.action === 'a_draw';
  if (!target || !active(target)) target = nearestInRange();
  if (g.action === 'a_rota' && target) {   // Llave de ronda: cada disparo a un enemigo distinto del anterior
    const alt = S.enemies.filter(e => active(e) && e !== p.rotaT && dist(p, e) - e.r <= rangeOf() && (G('b_ghost') || !blocked(p, e))).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (alt) target = alt; p.rotaT = target;
  }
  if (!target && !draw) { p.cd = 0.12; p.crit = false; return; }   // tensando se puede soltar sin objetivo
  p.shotN += 1; p.trig += 1;
  let mult = gunDmg();
  if (S.gun.barrel === 'b_short' && p.quick > 0) { p.quick = 0; mult *= 2; p.quickBig = true; S.stat.quick++; note(p.x, p.y - 14, '¡Desenfundado!', C.ember, true); }   // Pistolete
  if (g.action === 'a_pend') { if (p.crit) { p.pend = Math.min(6, p.pend + 1); mult *= (1 + 0.15 * p.pend) / 1.5; } else p.pend = 0; }   // Llave de péndulo (sustituye el 1,5 del Compás por la racha)
  if (g.mag === 'm_blood') payLife(1);
  if (g.mag === 'm_gold') { if (p.gold >= 1) { p.gold -= 1; mult *= 1.35; } else mult *= 0.8; }           // Bala de oro
  if (g.action === 'a_spring' && res('deathclock') && (p.idle || 0) >= 4 && target && target.doom) fulfil(target);   // resonancia Hora señalada
  if (g.action === 'a_spring') { const k = 1 + Math.min(2, 0.5 * (p.idle || 0)); if (k > 1.4) { S.stat.spring++; note(p.x, p.y - 14, 'x' + k.toFixed(1), C.ember); } mult *= k; }   // Llave de resorte
  let heavyAlt = false;
  if (g.action === 'a_alt') { heavyAlt = p.alt; mult *= p.alt ? 1.8 : 0.6; p.alt = !p.alt; }               // Llave alterna
  if (g.action === 'a_combo') { if (target && target === p.comboT) p.comboN = Math.min(8, (p.comboN || 0) + 1); else p.comboN = 0; p.comboT = target; }   // Llave de insistencia
  let kick = false;
  if (g.action === 'a_kick' && p.trig % 3 === 0) { kick = true; mult *= 2.2; if (leg('master') && target) explode(target.x, target.y, 44, p.dmg, { col: GODS.forge.color, skip: target }); if (res('anvilsong')) addTemper(2); if (ens('gambler')) addGold(3); S.stat.kick++; note(p.x, p.y - 14, '¡Trueno!', C.ember, true); S.shake = Math.max(S.shake, 6); }   // Llave de trueno
  if (p.venge > 0) { p.venge -= 1; mult *= 2; }
  if (g.action === 'a_rota') mult *= 1.3;
  let overB = false;
  if (g.action === 'a_over' && p.overT >= 10) { p.overT = 0; overB = true; mult *= 4; S.stat.over++; note(p.x, p.y - 14, '¡Sobrecarga!', C.ember, true); S.shake = Math.max(S.shake, 6); }   // Llave de sobrecarga
  p.lastShotT = S.t;                                                             // Culata de rencor
  if (g.action === 'a_drum') gainFury(th('orc') ? 12 : 8);                                                  // Llave de tambor
  if (g.action === 'a_glass' && p.trig % (th('time') ? 2 : 3) === 0 && target) { const tg = target, d0 = p.dmg * mult * 0.6, fx0 = Math.cos(p.face), fy0 = Math.sin(p.face), ox = p.x, oy = p.y; S.stat.themed++;
    S.timers.push({ t: echoDelay(1), fn: () => { if (!active(tg)) return; S.fx.push({ k: 'tracer', x1: ox, y1: oy, x2: tg.x, y2: tg.y, t: 0, life: 0.14, col: GODS.time.color, w: 1.2 }); onHit(tg, d0, fx0, fy0, false, GODS.time.color, 'echo'); } }); }   // Llave de clepsidra
  if (g.action === 'a_nana' && p.trig % (th('dream') ? 4 : 6) === 0 && target) { const tg = target; S.stat.themed++; S.timers.push({ t: 0.05, fn: () => sleep(tg, 2) }); }   // Llave de nana
  p.idle = 0;                       // Bala de sangre
  let lastB = false;
  if (g.mag === 'm_last') { p.clip = (p.clip || 0) + 1; if (p.clip >= 6) { lastB = true; mult *= 3; p.clip = 0; if (leg('lastword')) for (const e of S.enemies.slice()) if (active(e) && e.doom) fulfil(e); note(p.x, p.y - 14, '¡La última!', C.ember, true); S.stat.last++; } }   // Última bala
  if (p.crit) { mult *= S.plans.has('tempo') ? 2 : 1.5; S.stat.tempo++; note(p.x, p.y - 14, '¡Compás!', C.ember, true); blip(1800, 0.09, 'sine', 0.05); }
  if (p.redhot > 0) mult *= 1.5;                                               // Al rojo
  if (p.broke) { p.broke = false; mult *= 3; note(p.x, p.y - 14, '¡Siete años!', GODS.mirror.color, true); }   // Siete años
  let onetwo = false;
  if (g.mag === 'm_drum') { if (p.shells === 1 && p.drumT === target && target) { mult *= 1.6; onetwo = true; S.stat.onetwo++; } p.drumT = target; }   // Doble carga: la segunda al mismo blanco pega más
  const imb = g.mag === 'm_charged' && p.trig % 5 === 0;
  if (imb) { mult *= 2.5; blip(1600, 0.1, 'sine', 0.05); }
  if (draw) mult *= (0.6 + 1.6 * p.drawPow) * (ens('siege') && p.drawPow >= 1 && braced() ? 1.6 : 1);
  if (res('furnace')) mult *= 1 + 0.4 * p.heat;                              // resonancia Fragua viva
  const big = p.crit || imb || p.quickBig || onetwo || lastB || heavyAlt || kick || overB || (draw && p.drawPow >= 1), col = imb ? '#ffffff' : slotColor('basic');
  const reach = rangeOf() * (draw ? 0.6 + 0.4 * p.drawPow : 1);
  p.crit = false; p.quickBig = false;
  if (g.barrel !== 'b_spike' && g.action !== 'a_draw') {   // pólvora negra: fogonazo y humo en la boca del arma
    const mx = p.x + Math.cos(p.face) * 17, my = p.y + 1 + Math.sin(p.face) * 17;
    S.fx.push({ k: 'flash', x: mx, y: my, t: 0, life: 0.06 });
    for (let i = 0; i < (g.action === 'a_rotary' ? 1 : 3); i++) S.fx.push({ k: 'smoke', x: mx, y: my, vx: Math.cos(p.face) * rnd(8, 30) + rnd(-8, 8), vy: Math.sin(p.face) * rnd(8, 30) - rnd(4, 14), t: 0, life: rnd(0.35, 0.7) });
  }
  blip(1250, 0.07, 'square', 0.035, -700);
  if (g.action === 'a_burst') {          // Ráfaga: tres seguidos
    barrelFire(target, mult * 0.45, big, col, reach);
    for (const d of [0.07, 0.14]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { blip(1250, 0.05, 'square', 0.03, -700); barrelFire(t2, mult * 0.45, big, col, reach); if (d > 0.1 && active(t2)) stun(t2, 0.4); } } });
  } else barrelFire(target, mult, big, col, reach);
  if (leg('zhuge') && draw) for (const d of [0.08, 0.16]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { blip(1400, 0.04, 'square', 0.03, -500); barrelFire(t2, mult * 0.7, false, col, reach); addVenom(t2, 2); } } });
  if (leg('zhuge') && draw && target && active(target)) addVenom(target, 2);
  if (imb && target && active(target)) { S.stat.blessed++; explode(target.x, target.y, 40, p.dmg * 1.2, { col: '#ffffff' }); }   // Bala bendita
  if (res('leadstorm') && p.trig % 10 === 0 && target && active(target)) discharge(target, 1, null);        // resonancia Tormenta de plomo
  if (res('firingline')) for (const sh of S.shades) {                        // resonancia Línea de tiro
    let tg = null, td = 220;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(sh, e); if (d < td) { td = d; tg = e; } }
    if (tg) { S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: tg.x, y2: tg.y, t: 0, life: 0.09, col: GODS.shade.color }); onHit(tg, p.dmg * 0.3, (tg.x - sh.x) / (td || 1), (tg.y - sh.y) / (td || 1), false, GODS.shade.color, 'shade'); }
  }
  p.feastShot = false;
  { const mb = lv('mirror_basic'), fb3 = lv('forge_basic');
    if (mb && target && active(target)) for (const m of S.mirrors) {          // Reflejo: dispara contigo desde el otro lado
      const d = Math.hypot(target.x - m.x, target.y - m.y) || 1; S.stat.mirror++;
      S.fx.push({ k: 'tracer', x1: m.x, y1: m.y, x2: target.x, y2: target.y, t: 0, life: 0.09, col: GODS.mirror.color });
      onHit(target, p.dmg * mult * 0.3 * mb * (1 + 0.1 * aff('mirror')) * (duoOn('prismatic') && target.lit > 0 ? 2 : 1), (target.x - m.x) / d, (target.y - m.y) / d, false, GODS.mirror.color, 'mirror');
      if (duoOn('doubles')) for (const sh of S.shades) { let tg = null, td = 220; for (const e of S.enemies) { if (!active(e)) continue; const dd = dist(sh, e); if (dd < td) { td = dd; tg = e; } } if (tg) { S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: tg.x, y2: tg.y, t: 0, life: 0.09, col: GODS.shade.color }); onHit(tg, p.dmg * 0.3, (tg.x - sh.x) / (td || 1), (tg.y - sh.y) / (td || 1), false, GODS.shade.color, 'shade'); } }
    }
    if (fb3 && p.shotN % Math.max(3, 9 - fb3 * 2) === 0) addTemper(1);         // Temple
    if (g.stock === 's_geode' && target && active(target)) for (const c of S.crystals.slice(0, 4)) { const d = Math.hypot(target.x - c.x, target.y - c.y) || 1; if (d > 220) continue; S.stat.themed++; S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: target.x, y2: target.y, t: 0, life: 0.09, col: GODS.stone.color }); hit(target, p.dmg * mult * (th('stone') ? 0.4 : 0.2), (target.x - c.x) / d, (target.y - c.y) / d, false, GODS.stone.color); }   // Culata de geoda
    if (p.redhot > 0) p.redhot -= 1;
    for (const pt of S.pets) if (target && active(target)) pt.prey = target; }  // el sabueso va a por quien disparas
  if (lastB) p.cd = Math.max(p.cd, 1.2);
  if (g.action === 'a_fin' && target && active(target) && target.hp / target.maxHp < 0.25) p.cd = Math.min(p.cd, 0.1);   // Llave de remate
  if (kick && target && active(target)) push(target, Math.cos(p.face), Math.sin(p.face), 300);
  if (g.stock === 's_spring' && p.dodgeT <= 0 && Math.hypot(I.mx, I.my) > 0.3) {   // Culata de muelle: saltito tras disparar
    const hopL = ens('hare') ? 48 : 24, m = Math.hypot(I.mx, I.my) / (hopL / 24); p.x += I.mx / m * 24; p.y += I.my / m * 24; S.stat.hop++;
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4); collide(p, p.r);
    S.fx.push({ k: 'ghost', x: p.x - I.mx / m * 24, y: p.y - I.my / m * 24, t: 0, life: 0.18 });
  }
  // Cargador
  if (g.mag === 'm_drum') {              // dos disparos y a recargar
    p.shells -= 1;
    if (p.shells <= 0) { p.shells = 2; p.cd = periodOf() * 1.25; if (res('leadfeast')) { heal(4); p.feastShot = true; } }   // resonancia Banquete de plomo
    else p.cd = periodOf() * 0.22;
  }
  if (g.mag === 'm_belt') {              // la cinta calienta el arma
    p.heat = Math.min(1, p.heat + (g.action === 'a_rotary' ? 0.045 : 0.13)); p.heatT = 0.7;
    if (p.heat >= 1 && leg('organ')) { p.heat = 0; S.shake = Math.max(S.shake, 5); note(p.x, p.y - 16, '¡Salva!', C.ember, true); const near = S.enemies.filter(e => active(e) && dist(p, e) < rangeOf() + 40 && !blocked(p, e)); for (let i = 0; i < 11 && near.length; i++) { const e = near[i % near.length], d = dist(p, e) || 1; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: e.x, y2: e.y, t: 0, life: 0.12, col: C.ember, w: 1.5 }); if (active(e)) shot(e, p.dmg * 0.6, (e.x - p.x) / d, (e.y - p.y) / d, false, col); } }
    else if (p.heat >= 1) { p.over = 1.6; p.spin = 0; p.drawing = false; note(p.x, p.y - 16, '¡Recalentada!', C.blood, true); blip(120, 0.4, 'sawtooth', 0.06, -60); if (res('furnace')) explode(p.x, p.y, 70, p.dmg * 2.5, { push: 200, col: GODS.orc.color }); }
  }
  // Culata de retroceso: cada disparo te aparta del enemigo
  if (g.stock === 's_recoil' && target && g.barrel !== 'b_spike' && p.dodgeT <= 0) { const d = dist(p, target) || 1; p.x -= (target.x - p.x) / d * 9; p.y -= (target.y - p.y) / d * 9; p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4); collide(p, p.r); }
}
// El cañón: a quién alcanza un disparo
function barrelFire(target, m, big, col, reach) {
  const p = S.p, B = S.gun.barrel;
  const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face, ux = Math.cos(ang), uy = Math.sin(ang);
  p.face = ang;
  const tracer = (x2, y2, w) => S.fx.push({ k: 'tracer', x1: p.x + ux * 14, y1: p.y + uy * 14, x2, y2, t: 0, life: big ? 0.16 : 0.09, col, w: w || (big ? 2 : 1) });
  if (B === 'b_pierce') {                // atraviesa en línea y rebota una vez en los muros
    const total = reach + 30, h = rayHit(p.x, p.y, ux, uy, total); let left = 3;
    tracer(p.x + ux * h.len, p.y + uy * h.len, big ? 3 : 1.6);
    const along = (ox, oy, vx, vy, len) => S.enemies.filter(e => { if (!active(e)) return false; const ex = e.x - ox, ey = e.y - oy, al = ex * vx + ey * vy; return al >= 0 && al <= len + e.r && Math.abs(ex * vy - ey * vx) <= 5 + e.r; }).sort((a, b) => Math.hypot(a.x - ox, a.y - oy) - Math.hypot(b.x - ox, b.y - oy));
    for (const e of along(p.x, p.y, ux, uy, h.len)) { shot(e, p.dmg * m, ux, uy, big, col); if (res('quarry') && left-- > 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }   // resonancia Barreno
    {                                    // rebotes: uno, o hasta cuatro con La Rompemuros (cada uno pega más)
      let hh = h, ox = p.x, oy = p.y, vx = ux, vy = uy, left2 = total - h.len + 70, mul = 1;
      for (let b = 0; b < (leg('breaker') ? 4 : 1) && hh.side; b++) {
        const bx = ox + vx * (hh.len - 1), by = oy + vy * (hh.len - 1); if (hh.side === 'x') vx = -vx; else vy = -vy;
        if (leg('breaker')) { mul *= 1.25; left2 = Math.max(left2, 150); }
        const nh = rayHit(bx, by, vx, vy, left2);
        S.fx.push({ k: 'ring', x: bx, y: by, r: 6, t: 0, life: 0.12, col }); S.fx.push({ k: 'tracer', x1: bx, y1: by, x2: bx + vx * nh.len, y2: by + vy * nh.len, t: 0, life: big ? 0.2 : 0.13, col, w: big ? 2.4 : 1.4 });
        for (const e of along(bx, by, vx, vy, nh.len)) { S.stat.bounce++; shot(e, p.dmg * m * mul, vx, vy, big, col); if (res('pinball') && active(e)) discharge(e, 1, null); }   // resonancia Carambola
        left2 -= nh.len; ox = bx; oy = by; hh = nh; if (left2 <= 8) break;
      }
    }
    if (big) S.shake = Math.max(S.shake, 3);
  } else if (!target) tracer(p.x + ux * reach, p.y + uy * reach);   // tensado soltado al aire
  else if (B === 'b_twin') {             // dos enemigos distintos a la vez
    const second = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort((a, b) => dist(p, a) - dist(p, b))[0] || target;
    tracer(target.x, target.y); shot(target, p.dmg * m * 0.55, ux, uy, big, col);
    S.timers.push({ t: 0.05, fn: () => { const t2 = active(second) ? second : active(target) ? target : null; if (!t2) return; const d = dist(p, t2) || 1; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: t2.x, y2: t2.y, t: 0, life: 0.09, col }); shot(t2, p.dmg * m * 0.55, (t2.x - p.x) / d, (t2.y - p.y) / d, big, col); } });
  } else if (B === 'b_scatter') {        // seis perdigones en abanico, con empujón
    const burnt = new Set();
    for (const off of [-0.36, -0.22, -0.07, 0.07, 0.22, 0.36]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(p.x, p.y, rx, ry, reach + 20);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 3) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: p.x + rx * 12, y1: p.y + ry * 12, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col });
      if (bestE) { shot(bestE, p.dmg * m * 0.36, rx, ry, false, col); if (leg('dragon') && !burnt.has(bestE)) { burnt.add(bestE); addEmber(bestE, 2); } if (active(bestE) && !bestE.boss) { bestE.kx += rx * 110; bestE.ky += ry * 110; } }
    }
    S.shake = Math.max(S.shake, 4);
    if (leg('dragon')) { S.zones.push({ x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * (reach + 10), y2: p.y + uy * (reach + 10), life: 2, acc: 0.4, ember: 1, col: GODS.dragon.color }); S.fx.push({ k: 'cone', x: p.x, y: p.y, a: ang, r: reach + 10, half: 0.4, t: 0, life: 0.2, col: GODS.dragon.color }); }
    if (res('dragonbreath')) S.zones.push({ x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * (reach + 10), y2: p.y + uy * (reach + 10), life: 2.2, acc: 0.4, ember: 1, col: GODS.dragon.color });   // resonancia Aliento de dragón
  } else if (B === 'b_horn') {           // bramido en cono que aturde
    S.fx.push({ k: 'cone', x: p.x, y: p.y, a: ang, r: reach + 10, half: 0.6, t: 0, life: 0.18, col: C.ink }); S.shake = Math.max(S.shake, 3);
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(p, e); if (d - e.r > reach + 10 || Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) > 0.65 || blocked(p, e)) continue; S.stat.horn++; shot(e, p.dmg * m * 0.4, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), big, col); if (active(e)) stun(e, 0.35); }
  } else if (B === 'b_ends') {           // el más cercano y el más lejano a la vez
    const inR = S.enemies.filter(e => active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort((a, b) => dist(p, a) - dist(p, b)), near = inR[0] || target, farE = inR.length > 1 ? inR[inR.length - 1] : null;
    for (const e of [near, farE]) { if (!e || !active(e)) continue; const d = dist(p, e) || 1; if (e === farE) S.stat.ends++; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: e.x, y2: e.y, t: 0, life: 0.1, col, w: big ? 2 : 1 }); shot(e, p.dmg * m * 0.8, (e.x - p.x) / d, (e.y - p.y) / d, big, col); }
  } else if (B === 'b_boom') {           // hoz que va y vuelve
    const d0 = dist(p, target), len = Math.min(rayClip(p.x, p.y, ux, uy, reach + 20), d0 + 40), ex = p.x + ux * len, ey = p.y + uy * len;
    const pass = () => { for (const e of S.enemies.slice()) { if (!active(e)) continue; const ax = e.x - p.x, ay = e.y - p.y, al = ax * ux + ay * uy; if (al >= 0 && al <= len + e.r && Math.abs(ax * uy - ay * ux) <= 8 + e.r) { S.stat.boom++; shot(e, p.dmg * m * 0.7, ux, uy, big, col); } } };
    S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: ex, y2: ey, t: 0, life: 0.18, col: PAL.i, w: 2.4 }); pass();
    S.timers.push({ t: 0.28, fn: () => { S.fx.push({ k: 'tracer', x1: ex, y1: ey, x2: S.p.x, y2: S.p.y, t: 0, life: 0.18, col: PAL.i, w: 2.4 }); pass(); } });
  } else if (B === 'b_nail') {           // clavos: al cuarto en el mismo enemigo, revientan
    tracer(target.x, target.y); shot(target, p.dmg * m * 0.75, ux, uy, big, col);
    if (active(target)) { target.nails = (target.nails || 0) + 1; if (target.nails >= 4) { target.nails = 0; S.stat.nail++; if (ens('rivet')) for (const o of others(target, 60, 6)) hit(o, p.dmg * m * 3, ux, uy, true, col); note(target.x, target.y - target.r - 10, '¡Revienta!', C.ember); S.fx.push({ k: 'ring', x: target.x, y: target.y, r: target.r + 10, t: 0, life: 0.18, col: C.ember }); hit(target, p.dmg * m * 3, ux, uy, true, col); } }
  } else if (B === 'b_arc') {            // salta entre cuatro
    let from = p, cur = target, k = 1; const seen = new Set();
    for (let i = 0; i < 4 && cur; i++) { const d = dist(from, cur) || 1; seen.add(cur); if (i) S.stat.arc++;
      S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: cur.x, y2: cur.y, t: 0, life: 0.12, col, w: 1.5 }); shot(cur, p.dmg * m * k, (cur.x - from.x) / d, (cur.y - from.y) / d, big && !i, col);
      from = cur; k *= 0.8; cur = S.enemies.filter(e => active(e) && !seen.has(e) && dist(from, e) < 100).sort((a, b) => dist(from, a) - dist(from, b))[0]; }
  } else if (B === 'b_far') {            // de lejos el doble, de cerca la mitad
    const d = dist(p, target) - target.r, k = d > reach * 0.66 ? 2 : d < reach * 0.3 ? 0.5 : 1; if (k > 1 && res('sunbeam')) for (const o of others(target, 70, 6)) light(o);   // resonancia Rayo de sol
    if (k > 1) { S.stat.far++; S.fx.push({ k: 'ring', x: target.x, y: target.y, r: 10, t: 0, life: 0.15, col: C.ink }); }
    tracer(target.x, target.y, k > 1 ? 2 : 0); shot(target, p.dmg * m * k, ux, uy, big || k > 1, col);
  } else if (B === 'b_swarm') {          // tres dardos a tres enemigos al azar
    const pool = S.enemies.filter(e => active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort(() => Math.random() - 0.5).slice(0, 3); while (pool.length < 3) pool.push(target);
    if (res('packhunt') && S.pets.length && pool[0] && active(pool[0])) { const pt = S.pets[0]; pt.x = pool[0].x + 6; pt.y = pool[0].y + 4; bite(pt, pool[0], 0.6); }   // resonancia Montería
    pool.forEach((e, i) => S.timers.push({ t: 0.06 * i, fn: () => { if (!active(e)) return; const d = dist(S.p, e) || 1; S.stat.swarm++; S.fx.push({ k: 'tracer', x1: S.p.x, y1: S.p.y, x2: e.x, y2: e.y, t: 0, life: 0.1, col }); shot(e, p.dmg * m * 0.45, (e.x - S.p.x) / d, (e.y - S.p.y) / d, false, col); } }));
  } else if (B === 'b_fork') {           // tres bocas: centro al objetivo, dos a los lados a lo primero que pillen
    for (const off of [0, -0.34, 0.34]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = off === 0 ? target : null, ba = off === 0 ? dist(p, target) : rayClip(p.x, p.y, rx, ry, reach + 20);
      if (off !== 0) for (const e of S.enemies) { if (!active(e) || e === target) continue; const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry; if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 9) { ba = Math.max(0, al - e.r); bestE = e; } }
      S.fx.push({ k: 'tracer', x1: p.x + rx * 12, y1: p.y + ry * 12, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col, w: big ? 2 : 1 });
      if (bestE && active(bestE)) { if (off !== 0) S.stat.fork++; shot(bestE, p.dmg * m * 0.6, rx, ry, big, col); }
    }
  } else if (B === 'b_harpoon') {        // arpón: engancha y arrastra hacia ti
    tracer(target.x, target.y, 1.6); shot(target, p.dmg * m, ux, uy, big, col);
    if (res('tidalhook') && active(target)) { soak(target, 5); stun(target, 0.6); }   // resonancia Resaca
    if (active(target) && !target.boss) { const d = dist(p, target); if (d > 46) { target.kx = -ux * Math.min(420, d * 3.2); target.ky = -uy * Math.min(420, d * 3.2); target.slamCd = 0.5; S.stat.hook++; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: target.x, y2: target.y, t: 0, life: 0.3, col: PAL.b, w: 1 }); } }
  } else if (B === 'b_flame') {          // chorro en cono: todos los de delante
    S.fx.push({ k: 'cone', x: p.x, y: p.y, a: ang, r: reach + 8, half: 0.5, t: 0, life: 0.16, col: GODS.dragon.color });
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(p, e); if (d - e.r > reach + 8 || Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) > 0.55 || blocked(p, e)) continue; S.stat.flame++; shot(e, p.dmg * m * 0.5, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), big, GODS.dragon.color); addEmber(e, 1); }
  } else if (B === 'b_back') {           // dos bocas: delante y detrás
    tracer(target.x, target.y); shot(target, p.dmg * m, ux, uy, big, col);
    const rear = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && !blocked(p, e) && (e.x - p.x) * ux + (e.y - p.y) * uy < 0).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (rear) { const d = dist(p, rear) || 1; S.stat.rear++; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: rear.x, y2: rear.y, t: 0, life: 0.1, col }); shot(rear, p.dmg * m, (rear.x - p.x) / d, (rear.y - p.y) / d, big, col); }
  } else if (B === 'b_flail') {          // mangual: lanzas la bola y tarda en volver
    S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: target.x, y2: target.y, t: 0, life: 0.25, col: PAL.I, w: 2 }); p.orbAway = 1; S.stat.flail++;
    shot(target, p.dmg * m * 1.5, ux, uy, true, col);
  } else if (B === 'b_bomb') {           // bomba en arco: pasa por encima de los muros y revienta en área
    const tx = target.x, ty = target.y, fl = 0.2 + dist(p, target) / 520, dm = p.dmg * m * 0.8;
    S.fx.push({ k: 'lob', x1: p.x + ux * 10, y1: p.y + uy * 10, x2: tx, y2: ty, t: 0, life: fl, col: '#3a3440' });
    S.fx.push({ k: 'ring', x: tx, y: ty, r: 16, t: 0, life: fl, col: C.ember });
    S.timers.push({ t: fl, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: leg('monsmeg') ? 68 : 44, t: 0, life: 0.28, col: C.ember }); S.shake = Math.max(S.shake, big ? 5 : 3); blip(140, 0.18, 'sawtooth', 0.05, -80);
      let n = 0;
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = Math.hypot(e.x - tx, e.y - ty); if (d > (leg('monsmeg') ? 64 : 40) + e.r) continue; n++; if (leg('monsmeg')) stun(e, 0.6); shot(e, dm, (e.x - tx) / (d || 1), (e.y - ty) / (d || 1), big, col); }
      S.stat.bombHits += n; S.stat.bombs++;
      if (res('firerain')) S.zones.push({ x: tx, y: ty, r: 36, life: 2.5, acc: 0.4, ember: 1, col: GODS.dragon.color });   // resonancia Lluvia de brasas
    } });
  } else if (B === 'b_spike') {          // estocada que atraviesa
    shot(target, p.dmg * m * 1.8, ux, uy, true, col);
    if (res('executor')) { stun(target, 0.4); gainFury(15); }                // resonancia Verdugo
    if (!active(target)) { p.cd = 0; note(p.x, p.y - 14, '¡Otra!', C.ember); }
    if (p.dodgeT <= 0) lunge(ang, dist(p, target) + target.r + 22);
  } else {                               // arcabuz o pistolete: una bala a un enemigo
    if (B === 'b_icicle' && target.frozen > 0) m *= 1.3;
    if (B === 'b_drill') { if (target === p.drillT) p.drillN = Math.min(10, p.drillN + 1); else p.drillN = 0; p.drillT = target; m *= 1 + 0.15 * p.drillN; }   // Berbiquí
    if (B === 'b_net') { m *= 0.65; if ((target.netCd || 0) <= S.t) { target.netCd = S.t + 3; S.stat.net++; root(target, 0.9); } }   // Lanzarredes
    const far = B === 'b_long' && dist(p, target) - target.r > reach * 0.5;
    if (far) S.fx.push({ k: 'ring', x: target.x, y: target.y, r: 9, t: 0, life: 0.15, col: C.ink });
    tracer(target.x, target.y, far ? 1.8 : 0); shot(target, p.dmg * m * (far ? 1.4 : 1), ux, uy, far || big, col);
    if (active(target)) {                // cañones temáticos: lo suyo, aunque no lleves a esa deidad
      if (B === 'b_blow') { addVenom(target, 1); S.stat.themed++; }
      if (B === 'b_wyrm') { addEmber(target, 1); S.stat.themed++; }
      if (B === 'b_rod') { addNeedles(target, th('storm') ? 2 : 1); S.stat.themed++; if (target.needles >= (leg('tempest') ? 3 : 6) && !has('r_over')) discharge(target, 1, null); }
      if (B === 'b_icicle') { addFrost(target, th('frost') ? 2 : 1); S.stat.themed++; }
    }
    if (B === 'b_long') {                // Remate: si mata, la bala sigue
      let from = target, hops = 0;
      while (!active(from) && hops < 3) {
        const next = others(from, 115, 1)[0]; if (!next) break;
        const d = dist(from, next) || 1; hops++; S.stat.finish++;
        S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: next.x, y2: next.y, t: 0, life: 0.14, col, w: 1.6 });
        shot(next, p.dmg * m, (next.x - from.x) / d, (next.y - from.y) / d, big, col); from = next;
      }
      if (hops) note(target.x, target.y - 12, hops > 1 ? `¡Remate x${hops}!` : '¡Remate!', C.ember);
    }
  }
}
// Estocada: un esquive corto que atraviesa
function lunge(a, d) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.dodgeT = d / (p.speed * T.dodge.mult); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.dodgeFrom = { x: p.x, y: p.y }; p.dodgeHit = new Set(); p.isLunge = true; p.fly = false;
}

// ───────────────────────── Esquive ─────────────────────────
function startDodge(a, free) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.fly = lv('dragon_dodge') > 0;                                           // Vuelo: salto largo por encima de las columnas
  p.dodgeT = T.dodge.time * (p.fly ? 1.8 : 1) * (G('s_light') ? 1.3 : 1) * (G('s_roll') ? 0.65 : 1); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.danced = false; p.lastDodgeT = S.t; p.dodgeFrom = { x: p.x, y: p.y }; p.isLunge = false; p.dodgeHit = new Set(); p.drawing = false; p.lanceDmg = 0;
  if (!free) { p.dodgeN -= 1; if (p.windup > 0) { p.windup = 0; p.cd = 0.1; } p.charging = false; p.charge = 0; }
  blip(420, 0.1, 'triangle', 0.04, 500);
  if (G('a_rider') && !free) { const tg = nearestInRange(); if (tg) { S.stat.rider++; barrelFire(tg, gunDmg() * 1.3, true, slotColor('basic'), rangeOf()); } }   // Llave de jinete
  if (lv('stone_dodge') || (G('s_geode') && !free)) addCrystal(p.x, p.y);                              // Geoda
  const td = lv('time_dodge'), sd = lv('shade_dodge');
  if (td) S.fields.push({ x: p.x, y: p.y, r: 80, life: 2 + td, life0: 2 + td });   // Hora muerta
  if (sd) raiseShade(p.x, p.y, 3 + sd, true);                               // Relevo
  { const ed = lv('end_dodge'); if (ed) for (const e of S.enemies) if (active(e) && e.doom && dist(p, e) < 130) { e.doom.t -= 2; heal(ed); } }   // Pasar página
  const ld = lv('luck_dodge');
  if (ld && !free) {                                                        // Cara o cruz
    if (duoOn('toss')) heal(5);                                             // dúo Propina
    if (Math.random() < 0.5) { p.dodgeN = Math.min(dodgeMax(), p.dodgeN + 1); S.stat.heads++; note(p.x, p.y - 18, 'Cara', GODS.luck.color, true); }
    else {
      const x = p.x, y = p.y; S.stat.tails++; note(x, y - 18, 'Cruz', GODS.luck.color);
      S.fx.push({ k: 'ring', x, y, r: 10, t: 0, life: 0.55, col: GODS.luck.color });
      S.timers.push({ t: 0.55, fn: () => explode(x, y, 52, p.dmg * 1.2 * ld, { col: GODS.luck.color, zap: duoOn('fork') }) });   // (dúo Rayo caprichoso)
    }
  }
}
function endDodge() {
  const p = S.p, vd = lv('venom_dodge'), dd = lv('dragon_dodge'), from = p.dodgeFrom;
  if (!from) return;
  if (p.lanceDmg && res('cavalry')) { S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 3, acc: 0.4, ember: 2, col: GODS.dragon.color }); explode(p.x, p.y, 55, p.dmg * 2, { col: GODS.dragon.color }); }   // resonancia Carga de caballería
  if (vd) {                                                                 // Rastro
    S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 5, acc: 0.4, venom: vd, col: GODS.venom.color });
    if (duoOn('stalagm')) for (const k of [0.2, 0.5, 0.8]) addCrystal(from.x + (p.x - from.x) * k, from.y + (p.y - from.y) * k);   // dúo Estela de cristal
  }
  { const wd = lv('tide_dodge'), bd = lv('wood_dodge'), dx = p.x - from.x, dy = p.y - from.y, L = Math.hypot(dx, dy) || 1;
    if (wd && !p.isLunge) S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: (3 + wd) * (duoOn('whirl') ? 2 : 1), acc: 0.4, flow: { ux: dx / L, uy: dy / L, f: 210 }, slow: duoOn('whirl') ? 0.6 : 0, col: GODS.tide.color });   // Corriente (y dúo Remolino)
    if (bd && !p.isLunge) S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 4, acc: 0.4, rootOnce: new Set(), dmg1: p.dmg * 0.6 * bd, wet: duoOn('mangrove'), venom1: duoOn('nettle') ? 4 : 0, frost1: duoOn('frostthorn') ? 3 : 0, col: GODS.wood.color }); }   // Enredadera (y dúos Manglar, Ortiga)
  { const md = lv('mirror_dodge'), bd3 = lv('beast_dodge'), fd3 = lv('forge_dodge');
    if (md && !p.isLunge) { S.fx.push({ k: 'ghost', x: from.x, y: from.y, t: 0, life: 0.6 + 0.3 * md }); S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 70, t: 0, life: 0.25, col: GODS.mirror.color }); for (const e of S.enemies) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 70 + e.r) stun(e, 0.6 + 0.3 * md); }   // Engaño
    if (bd3 && !p.isLunge && S.pets.length) { const pt = S.pets[0]; pt.x = from.x; pt.y = from.y; S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 50, t: 0, life: 0.2, col: GODS.beast.color });
      for (const e of S.enemies.slice()) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 50 + e.r) { const d = Math.hypot(e.x - from.x, e.y - from.y) || 1; bite(pt, e, 0.8 * bd3); if (active(e)) { push(e, (e.x - from.x) / d, (e.y - from.y) / d, 200); if (duoOn('bloodhound')) { addBleed(e, 2); heal(2); } } } }   // Manada (y dúo Rastro de sangre)
    if (fd3 && !p.isLunge) p.redhot = 1 + fd3; }                              // Al rojo
  { const ld2 = lv('light_dodge'), dd2 = lv('dream_dodge'), vd2 = lv('void_dodge');
    if (ld2 && !p.isLunge) { S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 90, t: 0, life: 0.3, col: GODS.light.color }); for (const e of S.enemies.slice()) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 90 + e.r) { light(e); hit(e, p.dmg * 0.5 * ld2, 0, 0, false, GODS.light.color); } }   // Resplandor
    if (dd2 && !p.isLunge) S.zones.push({ x: from.x, y: from.y, r: 44, life: 2 + dd2, acc: 0.4, sleepOnce: new Set(), col: GODS.dream.color });   // Polvo de sueño
    if (vd2 && !p.isLunge) addWell(from.x, from.y, 62, 1 + vd2, 0, 0, { stunC: duoOn('funnel') }); }   // Hueco (y dúo Embudo)
  { const fd = lv('frost_dodge'); if (fd && !p.isLunge) S.zones.push({ x: from.x, y: from.y, r: 40, life: 4, acc: 0.4, frost: fd, col: GODS.frost.color }); }   // Paso de hielo
  if (p.fly && dd) explode(p.x, p.y, 52, p.dmg * 1.5 * dd, { col: GODS.dragon.color, zap: duoOn('comet') });   // Vuelo (y dúo Cometa)
  if (S.plans.has('echo') && !p.isLunge) S.turrets.push({ x: from.x, y: from.y, life: 3, cd: 0.15 });        // Arma gemela
  if (!p.isLunge) { if (G('s_light')) { p.cd = 0; p.windup = 0; } if (G('b_short')) { p.quick = 1.2; p.cd = 0; } }   // Culata de fresno / Pistolete: sales del esquive con el arma lista
  p.dodgeFrom = null; p.fly = false; p.lanceDmg = 0;
}
// Lo que pasa al atravesar a un enemigo con el esquive
function dashThrough(e) {
  const p = S.p, od = lv('orc_dodge'), fd = lv('feast_dodge'), rd = lv('storm_dodge');
  if (G('s_dance') && !p.danced) { p.danced = true; p.dodgeN = Math.min(dodgeMax(), p.dodgeN + 1); note(p.x, p.y - 18, '¡Otra!', C.energy); }   // Culata de bailarín
  if (G('s_spikes') && active(e)) { S.stat.spk++; hit(e, p.dmg * 1.5, p.dvx, p.dvy, true, C.ink); stun(e, 0.5); }   // Culata de púas
  if (p.lanceDmg) { hit(e, p.lanceDmg, p.dvx, p.dvy, true, C.energy); if (active(e)) chargePayoff(e); }      // carga de la lanza
  if (rd && active(e)) { if (e.needles > 0) { const n = discharge(e, 0.8 + 0.2 * (rd - 1), null); if (duoOn('toast')) heal(2 * n); } else addNeedles(e, 2); }   // Paso relámpago (y dúo Brindis eléctrico)
  if (fd && active(e)) { hit(e, p.dmg * 0.6 * fd, p.dvx, p.dvy, false, GODS.feast.color); heal(3 * fd); }   // Brindis
  { const bd2 = lv('blood_dodge'); if (bd2 && active(e)) { hit(e, p.dmg * 0.6 * bd2, p.dvx, p.dvy, false, GODS.blood.color); heal(4 * bd2); } }   // Transfusión
  if (od && active(e)) {                                                    // Embestida
    const up = duoOn('uproot') && e.root > 0;                               // dúo Descuaje
    hit(e, p.dmg * od * (up ? 3 : 1), p.dvx, p.dvy, true, GODS.orc.color); gainFury(15);
    if (up && active(e)) { e.root = 0; e.slowT = 0; push(e, p.dvx, p.dvy, 320); }
    if (duoOn('horde')) for (const s of S.shades) { S.fx.push({ k: 'tracer', x1: s.x, y1: s.y, x2: e.x, y2: e.y, t: 0, life: 0.15, col: GODS.shade.color, w: 1.5 }); s.x = e.x + rnd(-10, 10); s.y = e.y + rnd(-10, 10); hit(e, p.dmg, p.dvx, p.dvy, false, GODS.shade.color); }   // dúo Carga de la horda
    if (active(e)) { e.kx += p.dvx * 200; e.ky += p.dvy * 200; stun(e, 0.35); if (duoOn('avalanche') && !e.boss) { e.fling = e.champ ? 0.22 : 0.4; e.fvx = p.dvx * 430; e.fvy = p.dvy * 430; } }   // dúo Avalancha
  }
}

// ───────────────────────── Disparo cargado ─────────────────────────
// Lo que hace el cargado a cada enemigo que alcanza, sea con el rayo, el cono, el abanico, el aluvión o un Cristal
function chargePayoff(e) {
  const dc = lv('dragon_charge'), vc = lv('venom_charge'), rc = lv('storm_charge'), p = S.p;
  if (duoOn('rot')) { const t = e.ember + e.venom; if (t > 0) { if (t > e.ember) addEmber(e, t - e.ember); e.venom = Math.min(30, t); } }   // dúo Aliento podrido
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
  if (rc && active(e)) discharge(e, 0.7 + 0.2 * (rc - 1), null);            // Sobretensión
  { const lc2 = lv('light_charge'), dc2 = lv('dream_charge');
    if (lc2 && active(e)) { if (e.lit > 0) { stun(e, 1); hit(e, p.dmg * 0.4 * lc2, 0, 0, false, GODS.light.color); } light(e); }   // Destello
    if (dc2 && active(e)) { if (e.sleep > 0) { if (duoOn('digest')) addReserve(4); S._night = true; hit(e, p.dmg * 0.6, 0, 0, true, GODS.dream.color); S._night = false; } else sleep(e, 2); } }   // Pesadilla (y dúo Digestión)
  const fc = lv('frost_charge'), ec = lv('end_charge');
  if (fc && active(e)) {                                                    // Quebrar
    if (e.frozen > 0) { e.frozen = 0; e.stun = Math.min(e.stun, 0.2); S.stat.shatter++; note(e.x, e.y - e.r - 12, '¡Roto!', GODS.frost.color, true); explode(e.x, e.y, 46, p.dmg * 0.8 * fc, { col: GODS.frost.color, skip: e }); hit(e, p.dmg * 1.5 * fc, 0, 0, true, GODS.frost.color); }
    else addFrost(e, 3);
  }
  if (ec && active(e) && e.doom) { if (duoOn('autodafe')) addEmber(e, 3); fulfil(e, 1 + 0.3 * ec); }   // Punto final (y dúo Auto de fe)
}
// snap: desde dónde y con qué fuerza se lanzó. echo: repetición de Rebobinar (no gasta nada ni tiene recarga).
function castCharged(snap, mult, echo) {
  const p = S.p, ch = T.charge, o = { x: snap.x, y: snap.y }, CH = S.gun.chamber;
  const dmg = p.dmg * (1.5 + (ch.dmgMult - 1.5) * snap.ratio) * mult * snap.bonus;
  const ux = Math.cos(snap.dir), uy = Math.sin(snap.dir), col = slotColor('charge');
  const strike = (e, d, dx, dy) => { hit(e, d, dx, dy, true, col); chargePayoff(e); };
  if (S.plans.has('mortar') && CH === 'c_beam') {   // Mortero: proyectil en arco con área
    S.fx.push({ k: 'lob', x1: o.x, y1: o.y, x2: snap.tx, y2: snap.ty, t: 0, life: 0.3, col });
    S.timers.push({ t: 0.3, fn: () => { explode(snap.tx, snap.ty, 58, dmg * 0.8, { col, payoff: true }); S.shake = Math.max(S.shake, 7); } });
  } else if (CH === 'c_fan' || CH === 'c_blast') {   // abanico (nueve) o andanada con retroceso (quince)
    const blast = CH === 'c_blast', n = blast ? 15 : 9, half = blast ? 0.6 : 0.85, reach = blast ? 130 : 165, seen = new Set();
    for (let i = 0; i < n; i++) {
      const a = snap.dir - half + 2 * half * i / (n - 1), rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(o.x, o.y, rx, ry, reach);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - o.x, ey = e.y - o.y, al = ex * rx + ey * ry;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 4) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: o.x + rx * 10, y1: o.y + ry * 10, x2: o.x + rx * ba, y2: o.y + ry * ba, t: 0, life: 0.12, col });
      if (bestE) { if (echo) hit(bestE, dmg * 0.22, rx, ry, false, col); else shot(bestE, dmg * 0.22, rx, ry, false, col); seen.add(bestE); }
    }
    for (const e of seen) if (active(e)) chargePayoff(e);
    if (blast) {
      for (const e of seen) if (active(e) && !e.boss) { const d = dist(o, e) || 1; e.kx += (e.x - o.x) / d * 320; e.ky += (e.y - o.y) / d * 320; stun(e, 0.5); }
      if (!echo) { lunge(snap.dir + Math.PI, 105); S.shake = Math.max(S.shake, 8); }
    }
  } else if (CH === 'c_rain') {          // aluvión sobre una zona
    const tx = snap.tx, ty = snap.ty, R = 62;
    if (res('acidrain')) S.zones.push({ x: tx, y: ty, r: R, life: 5, acc: 0.4, venom: 2, col: GODS.venom.color });   // resonancia Lluvia ácida
    for (let w = 0; w < 3; w++) S.timers.push({ t: 0.15 + w * 0.22, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: R, t: 0, life: 0.2, col });
      for (let i = 0; i < 7; i++) { const a = Math.random() * 6.28, r = Math.random() * R, x = tx + Math.cos(a) * r, y = ty + Math.sin(a) * r; S.fx.push({ k: 'tracer', x1: x + 12, y1: y - 38, x2: x, y2: y, t: 0, life: 0.14, col }); }
      blip(900, 0.06, 'triangle', 0.03, -400);
      for (const e of S.enemies.slice()) { if (!active(e) || Math.hypot(e.x - tx, e.y - ty) > R + e.r) continue; hit(e, dmg * 0.45, 0, 0, w === 0, col); if (w === 0) chargePayoff(e); }
    } });
  } else if (CH === 'c_supp') {          // supresión: tres segundos disparando sola a todo lo que haya cerca
    if (!echo) { p.heat = 0; p.over = 0; }
    for (let i = 0; i < 36; i++) S.timers.push({ t: 0.08 * i, fn: () => {
      const near = S.enemies.filter(e => active(e) && dist(o, e) - e.r <= rangeOf() && !blocked(o, e));
      if (!near.length) return;
      const e = near[Math.floor(Math.random() * near.length)], dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 1;
      S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: e.x, y2: e.y, t: 0, life: 0.07, col });
      if (i % 6 === 0) blip(1100, 0.04, 'square', 0.025, -500);
      if (echo) hit(e, dmg * 0.09, dx / d, dy / d, false, col); else shot(e, dmg * 0.09, dx / d, dy / d, false, col);
      if (i % 9 === 0) chargePayoff(e);
    } });
  } else if (CH === 'c_ward') {          // baluarte: dos segundos intocable
    if (!echo) p.inv = Math.max(p.inv, 2.1); S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 56, t: 0, life: 0.4, col: C.energy });
    for (const e of S.enemies) if (active(e) && dist(o, e) < 56 + e.r) { const d = dist(o, e) || 1; push(e, (e.x - o.x) / d, (e.y - o.y) / d, 260); chargePayoff(e); }
  } else if (CH === 'c_blink') {         // salto: te lleva allí y revienta
    const at = unstick(clamp(snap.tx, 12, T.room.w - 12), clamp(snap.ty, 12, T.room.h - 12));
    if (!echo) { S.fx.push({ k: 'ghost', x: p.x, y: p.y, t: 0, life: 0.3 }); S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: at.x, y2: at.y, t: 0, life: 0.2, col, w: 2 }); p.x = at.x; p.y = at.y; collide(p, p.r); p.inv = Math.max(p.inv, 0.4); S.stat.blink++; }
    explode(at.x, at.y, 62, dmg * 0.8, { col, payoff: true });
  } else if (CH === 'c_drain') {         // sanguijuela: rayo que cura
    const len = rayClip(o.x, o.y, ux, uy, ch.range), d0 = S.dealt || 0;
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const ex = e.x - o.x, ey = e.y - o.y, along = ex * ux + ey * uy; if (along < 0 || along > len || Math.abs(ex * uy - ey * ux) > ch.width + e.r) continue; strike(e, dmg * 0.9, ux, uy); }
    S.fx.push({ k: 'beam', x1: o.x + ux * 14, y1: o.y + uy * 14, x2: o.x + ux * len, y2: o.y + uy * len, t: 0, life: 0.22, w: 4, col: GODS.blood.color });
    if (!echo) heal(Math.min(p.maxHp * 0.25, ((S.dealt || 0) - d0) * 0.3));
  } else if (CH === 'c_brand') {         // condena: marca a todos los que ves
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 300, t: 0, life: 0.4, col: C.energy });
    for (const e of S.enemies.slice()) if (active(e) && dist(o, e) < 320 && !blocked(o, e)) { e.traced = 6; strike(e, dmg * 0.3, 0, 0); }
  } else if (CH === 'c_quake') {         // terremoto: toda la sala
    S.shake = Math.max(S.shake, 12); S.stat.quake++;
    for (const e of S.enemies.slice()) if (active(e) && !e.type.fly) { strike(e, dmg * 0.3, 0, 0); if (active(e)) stun(e, 1); }
  } else if (CH === 'c_sima') {          // sima: un pozo por sí sola
    S.stat.themed++; addWell(snap.tx, snap.ty, 80, th('void') ? 4 : 2, dmg * 0.15, dmg * 0.8);
    for (const e of S.enemies) if (active(e) && Math.hypot(e.x - snap.tx, e.y - snap.ty) < 80 + e.r) chargePayoff(e);
  } else if (CH === 'c_doom') {          // sentencia: rayo que marca a todos los que atraviesa
    const len = rayClip(o.x, o.y, ux, uy, ch.range);
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const ex = e.x - o.x, ey = e.y - o.y, along = ex * ux + ey * uy; if (along < 0 || along > len || Math.abs(ex * uy - ey * ux) > ch.width + e.r) continue; S.stat.themed++; addDoom(e); strike(e, dmg * 0.6, ux, uy); }
    S.fx.push({ k: 'beam', x1: o.x + ux * 14, y1: o.y + uy * 14, x2: o.x + ux * len, y2: o.y + uy * len, t: 0, life: 0.22, w: 4, col: GODS.end.color });
  } else if (CH === 'c_anvil') {         // yunque: martillazo que da Temple
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 76, t: 0, life: 0.3, col: GODS.forge.color }); S.shake = Math.max(S.shake, 7);
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(o, e) || 1; if (d > 76 + e.r) continue; strike(e, dmg * 0.9, (e.x - o.x) / d, (e.y - o.y) / d); if (active(e)) stun(e, 0.5); if (!echo) { S.stat.themed++; addTemper(th('forge') ? 2 : 1); } }
  } else if (CH === 'c_meteor') {        // meteoro: cae un segundo después
    const tx = snap.tx, ty = snap.ty; S.fx.push({ k: 'ring', x: tx, y: ty, r: 70, t: 0, life: 1, col });
    if (res('eventide')) addWell(tx, ty, 100, 1, 0, 0);                    // resonancia Horizonte de sucesos S.fx.push({ k: 'lob', x1: tx + 60, y1: ty - 160, x2: tx, y2: ty, t: 0, life: 1, col: '#3a3440' });
    S.timers.push({ t: 1, fn: () => { S.shake = Math.max(S.shake, 10); S.stat.meteor++; explode(tx, ty, 70, dmg * 1.6, { col, payoff: true, stun: 0.5 }); } });
  } else if (CH === 'c_chain') {         // rayo que salta entre seis
    let from = o, cur = S.enemies.filter(e => active(e) && !blocked(o, e) && dist(o, e) < 260).sort((a, b) => Math.abs(angDiff(Math.atan2(a.y - o.y, a.x - o.x), snap.dir)) - Math.abs(angDiff(Math.atan2(b.y - o.y, b.x - o.x), snap.dir)))[0]; const seen = new Set();
    for (let i = 0; i < 6 && cur; i++) { const d = dist(from, cur) || 1; seen.add(cur); S.stat.cchain++;
      S.fx.push({ k: 'beam', x1: from.x, y1: from.y, x2: cur.x, y2: cur.y, t: 0, life: 0.2, w: 3, col }); strike(cur, dmg * 0.8, (cur.x - from.x) / d, (cur.y - from.y) / d);
      from = cur; cur = S.enemies.filter(e => active(e) && !seen.has(e) && dist(from, e) < 130).sort((a, b) => dist(from, a) - dist(from, b))[0]; }
  } else if (CH === 'c_balm') {          // bálsamo: cura y aparta
    if (!echo) { heal(p.maxHp * 0.1); S.stat.balm++; if (ens('bastion')) p.wardCd = 0; note(o.x, o.y - 18, '+' + Math.round(p.maxHp * 0.1), '#8fe08a', true); }
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 60, t: 0, life: 0.3, col: '#8fe08a' });
    for (const e of S.enemies) if (active(e) && dist(o, e) < 60 + e.r) { const d = dist(o, e) || 1; push(e, (e.x - o.x) / d, (e.y - o.y) / d, 240); chargePayoff(e); }
  } else if (CH === 'c_bounce') {        // carambola: cinco rebotes
    let ox = o.x, oy = o.y, vx = ux, vy = uy, left = 700;
    for (let b = 0; b < 6 && left > 10; b++) {
      const h = rayHit(ox, oy, vx, vy, Math.min(left, 320));
      S.fx.push({ k: 'beam', x1: ox, y1: oy, x2: ox + vx * h.len, y2: oy + vy * h.len, t: 0, life: 0.22, w: 3, col });
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const ex = e.x - ox, ey = e.y - oy, al = ex * vx + ey * vy; if (al >= 0 && al <= h.len + e.r && Math.abs(ex * vy - ey * vx) <= 6 + e.r) { S.stat.cbounce++; strike(e, dmg * 0.6, vx, vy); } }
      if (!h.side) break; ox += vx * (h.len - 1); oy += vy * (h.len - 1); if (h.side === 'x') vx = -vx; else vy = -vy; left -= h.len;
    }
  } else if (CH === 'c_volley') {        // salva de ocho disparos
    for (let i = 0; i < 8; i++) S.timers.push({ t: 0.07 * i, fn: () => { const near = S.enemies.filter(e => active(e) && !blocked(o, e) && dist(o, e) < rangeOf() + 60).sort((a, b) => dist({ x: snap.tx, y: snap.ty }, a) - dist({ x: snap.tx, y: snap.ty }, b))[0]; if (!near) return; const d = dist(o, near) || 1; S.stat.volley++;
      S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: near.x, y2: near.y, t: 0, life: 0.08, col }); if (i % 2 === 0) blip(1200, 0.04, 'square', 0.03, -500);
      if (echo) hit(near, dmg * 0.2, (near.x - o.x) / d, (near.y - o.y) / d, false, col); else shot(near, dmg * 0.2, (near.x - o.x) / d, (near.y - o.y) / d, false, col); if (i === 0) chargePayoff(near);
      if (leg('choir') && !echo) S.timers.push({ t: 0.8, fn: () => { if (!active(near)) return; S.stat.choir++; S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: near.x, y2: near.y, t: 0, life: 0.12, col: GODS.time.color }); onHit(near, dmg * 0.15, (near.x - o.x) / d, (near.y - o.y) / d, false, GODS.time.color, 'echo'); } }); } });
  } else if (CH === 'c_mine') {          // tres minas a tu alrededor
    for (let i = 0; i < 3; i++) { const a = snap.dir + Math.PI + (i - 1) * 1.1, at = unstick(clamp(o.x + Math.cos(a) * 34, 10, T.room.w - 10), clamp(o.y + Math.sin(a) * 34, 10, T.room.h - 10)); S.mines.push({ x: at.x, y: at.y, life: 12, dmg: dmg * 0.9, col }); }
  } else if (CH === 'c_nova') {          // onda que aparta
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 120, t: 0, life: 0.35, col }); S.shake = Math.max(S.shake, 7);
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(o, e) || 1; if (d > 120 + e.r) continue; strike(e, dmg * 0.7, (e.x - o.x) / d, (e.y - o.y) / d); if (active(e)) { if (leg('winter')) freeze(e); push(e, (e.x - o.x) / d, (e.y - o.y) / d, 380); } }
  } else if (CH === 'c_turret') {        // centinela: una copia del arma clavada en el suelo
    S.turrets.push({ x: o.x, y: o.y, life: ens('watch') ? 12 : 6, cd: 0.2, k: 0.8, sentry: true });
  } else if (CH === 'c_snipe') {         // verdugo: un tiro al más fuerte a la vista
    const tg = S.enemies.filter(e => active(e) && !blocked(o, e) && dist(o, e) < 420).sort((a, b) => b.hp - a.hp)[0];
    if (tg) { const d = dist(o, tg) || 1; S.fx.push({ k: 'beam', x1: o.x, y1: o.y, x2: tg.x, y2: tg.y, t: 0, life: 0.25, w: 4, col }); S.shake = Math.max(S.shake, 8); strike(tg, dmg * 2, (tg.x - o.x) / d, (tg.y - o.y) / d); if (!active(tg) && !echo) { p.snipeRefund = true; note(o.x, o.y - 18, '¡Otra vez!', C.ember, true); } }
  } else if (CH === 'c_dash') {          // embestida larga que atraviesa (el eco no se mueve)
    if (!echo) { lunge(snap.dir, 240); p.lanceDmg = dmg * 0.6; }
  } else if (lv('dragon_charge')) {      // Aliento: el rayo se abre en cono (crece con la Furia en el dúo Rugido)
    const k = duoOn('roar') ? 1 + snap.fury / 100 : 1, R = 175 * k, half = Math.min(1.2, 0.5 * k);
    S.fx.push({ k: 'cone', x: o.x, y: o.y, a: snap.dir, r: R, half, t: 0, life: 0.3, col: GODS.dragon.color });
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const d = dist(o, e);
      if (d > R + e.r || Math.abs(angDiff(Math.atan2(e.y - o.y, e.x - o.x), snap.dir)) > half || blocked(o, e)) continue;
      strike(e, dmg, (e.x - o.x) / (d || 1), (e.y - o.y) / (d || 1));
    }
  } else {                               // rayo que atraviesa
    const len = rayClip(o.x, o.y, ux, uy, ch.range);
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const ex = e.x - o.x, ey = e.y - o.y, along = ex * ux + ey * uy;
      if (along < 0 || along > len || Math.abs(ex * uy - ey * ux) > ch.width + e.r) continue;
      strike(e, dmg, ux, uy);
    }
    S.fx.push({ k: 'beam', x1: o.x + ux * 14, y1: o.y + uy * 14, x2: o.x + ux * len, y2: o.y + uy * len, t: 0, life: 0.22, w: 3 + 5 * snap.ratio, col });
  }
  { const fc3 = lv('forge_charge'), bc3 = lv('beast_charge');
    if (fc3) { const big2 = duoOn('warhammer') ? 1 + snap.fury / 100 : 1, R = 70 * big2; S.fx.push({ k: 'ring', x: o.x, y: o.y, r: R, t: 0, life: 0.3, col: GODS.forge.color }); S.shake = Math.max(S.shake, 7);
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(o, e) || 1; if (d > R + e.r) continue; hit(e, p.dmg * 1.2 * fc3 * mult, (e.x - o.x) / d, (e.y - o.y) / d, true, GODS.forge.color); if (active(e)) stun(e, 0.6); if (!echo) addTemper(duoOn('warhammer') ? 2 : 1); } }   // Martillazo (y dúo Martillo de guerra)
    if (bc3 && S.pets.length) { const pt = S.pets[0], tx = snap.tx, ty = snap.ty; S.fx.push({ k: 'tracer', x1: pt.x, y1: pt.y, x2: tx, y2: ty, t: 0, life: 0.2, col: GODS.beast.color, w: 2 }); pt.x = tx; pt.y = ty; S.stat.pounce++;
      explode(tx, ty, 52, p.dmg * 2.5 * bc3 * mult, { col: GODS.beast.color, stun: 1 }); if (duoOn('wolfthorn')) for (const e of S.enemies) if (active(e) && Math.hypot(e.x - tx, e.y - ty) < 52 + e.r) root(e, 1.5); } }   // ¡A por él! (y dúo Lobo entre zarzas)
  { const vc2 = lv('void_charge'); if (vc2) addWell(snap.tx, snap.ty, 90, 2.5, p.dmg * 0.25 * vc2 * mult, p.dmg * vc2 * mult, { embers: duoOn('collapse') }); }   // Singularidad (y dúo Colapso)
  { const wc = lv('tide_charge'), bc = lv('wood_charge');
    if (wc) {                                                               // Maremoto
      const strong = duoOn('wager') && snap.die >= 5;                       // dúo Mar gruesa
      S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 150, t: 0, life: 0.4, col: GODS.tide.color });
      for (const e of S.enemies.slice()) {
        if (!active(e)) continue; const d = dist(o, e) || 1; if (d > 150 + e.r) continue;
        if (duoOn('iceberg') && e.wet > 0) freeze(e);                         // dúo Témpano
        soak(e, 5); hit(e, p.dmg * 0.5 * wc * mult, (e.x - o.x) / d, (e.y - o.y) / d, false, GODS.tide.color);
        if (!active(e)) continue;
        if (duoOn('maelstrom') && S.wells.length) { const w = S.wells[S.wells.length - 1], wd = Math.hypot(w.x - e.x, w.y - e.y) || 1; push(e, (w.x - e.x) / wd, (w.y - e.y) / wd, Math.min(520, wd * 4)); e.slamCd = 0.6; }   // dúo Vorágine
        else push(e, (e.x - o.x) / d, (e.y - o.y) / d, strong ? 640 : 320);
        if (strong) stun(e, 1);
        if (duoOn('winetide')) addReserve(3);                                // dúo Marea de vino
        if (duoOn('tsunami') && e.needles > 0) discharge(e, 0.8, null);      // dúo Agua y rayo
      }
    }
    if (bc) S.zones.push({ x: snap.tx, y: snap.ty, r: 46, life: 5 * (duoOn('perennial') ? 2 : 1), acc: 0.4, slow: duoOn('perennial') ? 0.2 : 0.5, dmg: p.dmg * 0.2 * bc, ember: duoOn('wildfire') ? 1 : 0, bram: true, col: GODS.wood.color }); }   // Zarzal (y dúos Perenne, Incendio)
  const sc = lv('stone_charge'), oc = lv('orc_charge'), hc = lv('shade_charge');
  if (sc) for (const c of S.crystals) {  // Prisma: cada Cristal dispara su propio rayo, con los efectos del cargado
    let tg = null, td = 210;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(c, e); if (d < td && !blocked(c, e)) { td = d; tg = e; } }
    if (!tg) continue;
    S.fx.push({ k: 'beam', x1: c.x, y1: c.y, x2: tg.x, y2: tg.y, t: 0, life: 0.2, w: 2.5, col: GODS.stone.color });
    hit(tg, dmg * 0.4 * sc, (tg.x - c.x) / (td || 1), (tg.y - c.y) / (td || 1), true, GODS.stone.color);
    chargePayoff(tg);
  }
  if (oc) {                              // Grito de guerra: gasta la Furia (el eco no gasta; el dúo Rugido gasta la mitad)
    const f = snap.fury;
    if (!echo) p.fury = Math.max(mastery('orc') ? 50 : 0, duoOn('roar') ? p.fury / 2 : 0);
    explode(o.x, o.y, 45 + f * 0.7, p.dmg * (0.5 + 2 * oc * f / 100) * (echo && duoOn('echocry') ? 1 : mult), { push: 220, stun: 0.4 + f / 100, col: GODS.orc.color });
  }
  if (hc && S.shades.length) {           // Orden: las Sombras se lanzan y estallan
    for (const sh of S.shades) {
      const x = snap.tx + rnd(-14, 14), y = snap.ty + rnd(-14, 14);
      S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: x, y2: y, t: 0, life: 0.2, col: GODS.shade.color, w: 2 });
      explode(x, y, 45, p.dmg * 1.5 * hc * mult, { col: GODS.shade.color, venom: duoOn('cortege') ? 6 : 0 });
      if (duoOn('cortege')) S.zones.push({ x, y, r: 34, life: 5, acc: 0.4, venom: 1, col: GODS.venom.color });   // dúo Cortejo fúnebre
      if (duoOn('supper')) addReserve(5);                                                                       // dúo Última cena
    }
    S.shades = [];
  }
}
function fireCharged(am) {
  const p = S.p, ch = T.charge, CH = S.gun.chamber, moves = CH === 'c_dash' || CH === 'c_blast';
  const ratio = clamp(p.charge / ch.full, 0, 1), ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir);
  const tg = S.target && active(S.target) && am <= 0.35 ? S.target : null, reach = CH === 'c_rain' ? 190 : 170;
  const fl = lv('feast_charge'), tc = lv('time_charge');
  const snap = { x: p.x, y: p.y, dir: p.chargeDir, ratio, fury: p.fury, bonus: 1,
    tx: clamp(tg ? tg.x : p.x + ux * reach, 0, T.room.w), ty: clamp(tg ? tg.y : p.y + uy * reach, 0, T.room.h) };
  if (fl) { snap.bonus = 1 + 0.04 * fl * p.reserve; p.reserve = 0; S.banquet = S.t + 0.6; }   // Banquete
  { const bc2 = lv('blood_charge'); if (bc2) { if (!res('bloodprice')) payLife(Math.floor(p.hp * 0.1)); snap.bonus *= 1 + 0.6 * bc2; S.bloodT = S.t + 0.7; } }   // Sangría
  const lc = lv('luck_charge');
  if (lc) {                                                                 // Todo al rojo: el mejor de lc dados
    let die = 1; for (let i = 0; i < lc; i++) die = Math.max(die, 1 + Math.floor(Math.random() * 6));
    if (duoOn('allin')) die = Math.min(6, die + Math.floor(p.fury / 34));     // dúo Órdago
    snap.die = die; snap.bonus *= [0, 0.6, 0.8, 1, 1.3, 1.7, 3][die]; S.stat.dice++;
    note(p.x, p.y - 20, 'Dado: ' + die, die >= 5 ? RAR[3].color : GODS.luck.color, true); blip(600 + die * 200, 0.12, 'square', 0.05);
  }
  castCharged(snap, 1, false);
  if (tc) {                              // Rebobinar: se repite desde el mismo sitio
    const m = mastery('time') ? 1 : 0.6 + 0.15 * (tc - 1), d = echoDelay(2);
    S.fx.push({ k: 'clock', x: snap.x, y: snap.y, t: 0, life: d });
    S.timers.push({ t: d, fn: () => { castCharged(Object.assign({}, snap, { bonus: 1 }), m, true); if (duoOn('afterimage')) for (const mr of S.mirrors) castCharged(Object.assign({}, snap, { x: mr.x, y: mr.y, dir: Math.atan2(snap.ty - mr.y, snap.tx - mr.x), bonus: 1 }), m * 0.5, true); } });   // (dúo Imagen tardía)
  }
  { const mc = lv('mirror_charge'); if (mc) for (const mr of S.mirrors) { S.stat.mcharge++; castCharged(Object.assign({}, snap, { x: mr.x, y: mr.y, dir: Math.atan2(snap.ty - mr.y, snap.tx - mr.x), bonus: 1 }), 0.4 + 0.15 * mc, true); } }   // Doble: el Reflejo repite el cargado
  let cd = ch.cd;
  p.cd = Math.max(p.cd, 0.25);
  if (S.plans.has('recoil') && !moves) { cd *= 0.65; startDodge(Math.atan2(-uy, -ux), true); }
  else if (!moves) { p.x -= ux * 6; p.y -= uy * 6; }
  p.chargeCdMax = p.chargeCd = cd;
  if (p.snipeRefund) { p.snipeRefund = false; p.chargeCd = 0.15; }   // Recámara de verdugo
  S.shake = Math.max(S.shake, 4 + 4 * ratio);
  blip(300, 0.3, 'sawtooth', 0.06, -220);
}

function hurtPlayer(dmg) {
  if (S.p.inv <= 0) S.p.streak = 0;   // Racha: se pierde al recibir un golpe
  const p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  if (G('s_shield') && (p.wardCd || 0) <= 0) { p.wardCd = 6; p.inv = 0.4; S.stat.block++; note(p.x, p.y - 18, '¡Parado!', C.energy, true); blip(900, 0.12, 'square', 0.06, -300); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 18, t: 0, life: 0.2, col: C.energy }); return; }   // Culata con rodela
  if (duoOn('luckglass') && Math.random() < 1 / 3) { p.inv = 0.4; note(p.x, p.y - 18, 'Lo paga el Reflejo', GODS.mirror.color, true); return; }   // dúo Espejo de la suerte
  { const mp = lv('mirror_passive'); if (mp) explode(p.x, p.y, 64, p.dmg * mp, { col: GODS.mirror.color }); }   // Azogue
  if (G('s_tower')) dmg *= 0.7;                                               // Culata de torre
  if (G('s_anchor') && p.charging) dmg *= 0.5;                                // Culata de ancla
  if (G('s_venge')) p.venge = 3;                                              // Culata de rencor
  if (has('q_break')) p.broke = true;
  if (!mastery('forge')) p.temper = Math.floor(p.temper / 2);
  dmg *= (1 - 0.05 * tk('skin')) * (has('m_skin') ? 0.9 : 1) * (1.2 + 0.3 * (S.world - 1));
  if (p.reserve > 0) { const a = Math.min(p.reserve, dmg); p.reserve -= a; dmg -= a; }   // la Reserva hace de escudo
  p.hp -= dmg; p.inv = 0.5; S.hurtFx = 0.35;
  if (G('s_wind') && !S.windUsed && p.hp > 0 && p.hp < p.maxHp * 0.3) { S.windUsed = true; S.stat.wind++; heal(p.maxHp * 0.2); note(p.x, p.y - 20, '¡Segundo aire!', '#8fe08a', true); }   // Culata de segundo aire
  if (p.hp <= 0 && lv('blood_passive') && !S.debtUsed) { S.debtUsed = true; p.hp = 1; p.inv = 1; note(p.x, p.y - 20, '¡Deuda!', GODS.blood.color, true); }   // Deuda: el primer golpe mortal de la sala no te mata S.shake = Math.max(S.shake, 6);
  gainFury(15);
  blip(110, 0.18, 'sawtooth', 0.07, -50);
  if (p.hp <= 0 && p.revive > 0) {   // Segundo aliento
    p.revive -= 1; p.hp = Math.round(p.maxHp * (0.1 + 0.2 * tk('revive'))); p.inv = 1.5;
    note(p.x, p.y - 18, 'Segundo aliento', C.ember, true); blip(440, 0.5, 'triangle', 0.07, 600);
  } else if (p.hp <= 0) { p.hp = 0; endRun(false); setMode('dead'); }
}

// ───────────────────────── Jefes ─────────────────────────
// Cada jefe tiene un kit de ataques con aviso. Si embiste contra una columna se queda aturdido y recibe el doble.
function bossAI(e, dt, d, ux, uy) {
  const p = S.p, B = e.type, frac = e.hp / e.maxHp, ph = B.phases > 2 && frac < 0.33 ? 3 : frac < 0.55 ? 2 : 1;
  if (ph > e.ph) {
    e.ph = ph; S.shake = 9; note(e.x, e.y - e.r - 14, B.name + ' se enfurece', C.blood, true); blip(70, 0.6, 'sawtooth', 0.08, -20);
    for (let i = 0; i < 2 + ph; i++) spawn(B.sum === 'brute' && i > 0 ? 'runner' : B.sum);
  }
  const rest = t => { e.act = 'rest'; e.at = t / (ph > 1 ? 1.3 : 1); };
  const ring = (off, n, sp) => { for (let i = 0; i < n; i++) { const a = off + i * Math.PI * 2 / n; S.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 4, dmg: 12, life: 4.5 }); } blip(600, 0.12, 'triangle', 0.04, -300); };
  e.at -= dt;
  if (e.act === 'slam') {
    if (e.at <= 0) { S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 78, t: 0, life: 0.3, col: C.blood }); S.shake = Math.max(S.shake, 7); blip(80, 0.25, 'sawtooth', 0.07, -30); if (d < 78 + p.r) hurtPlayer(B.dmg); rest(0.7); }
  } else if (e.act === 'chargeWind') {
    if (e.at <= 0) { e.act = 'charge'; e.at = 0.55; e.hitOnce = false; }
  } else if (e.act === 'charge') {
    e.x += e.lvx * dt; e.y += e.lvy * dt;
    if (!e.hitOnce && dist(e, p) < e.r + p.r + 3) { e.hitOnce = true; hurtPlayer(B.dmg + 5); }
    if (touchesWall(e, e.r + 1)) { e.act = 'dazed'; e.at = 1.8; S.shake = 9; note(e.x, e.y - e.r - 14, '¡Aturdido!', C.ink, true); blip(200, 0.3, 'square', 0.06, -150); }
    if (e.act === 'charge' && e.at <= 0) rest(0.6);
  } else if (e.act === 'dazed') {
    if (e.at <= 0) rest(0.3);
  } else if (e.act === 'cast') {
    if (e.at <= 0) { if (e.castFn) e.castFn(); e.castFn = null; rest(0.5); }
  } else if (e.act === 'leap') {
    const k = 1 - Math.max(0, e.at) / 0.9; e.x = e.sx + (e.lx - e.sx) * k; e.y = e.sy + (e.ly - e.sy) * k;
    if (e.at <= 0) { S.shake = Math.max(S.shake, 7); rest(0.6); }
  } else if (e.act === 'rest') {
    if (e.at <= 0) e.act = 'idle';
  } else {
    const sp = e.speed * (e.slowT > 0 ? e.slowF : 1), [gx, gy] = navDir(e, ux, uy);
    e.x += gx * sp * dt; e.y += gy * sp * dt;
    e.think -= dt;
    if (e.think > 0) return;
    e.think = ph > 2 ? 0.6 : ph > 1 ? 0.85 : 1.25;
    const kit = B.kit.filter(a => a !== e.last && (a !== 'slam' || d < 95) && (a !== 'charge' || d > 80) && (a !== 'summon' || S.enemies.length < 8));
    const a = d < 80 && B.kit.includes('slam') && e.last !== 'slam' ? 'slam' : kit[Math.floor(Math.random() * kit.length)] || 'ring';
    e.last = a;
    const aim = Math.atan2(p.y - e.y, p.x - e.x);
    if (a === 'slam') { e.act = 'slam'; e.at = 0.75; }
    else if (a === 'charge') { e.act = 'chargeWind'; e.at = 0.7; e.lvx = ux * 430; e.lvy = uy * 430; }
    else if (a === 'ring') { e.act = 'cast'; e.at = 0.6; e.castFn = () => { const off = Math.random() * 6.28, n = 8 + ph * 3; ring(off, n, 110); if (ph > 1) S.timers.push({ t: 0.4, fn: () => { if (active(e)) ring(off + Math.PI / n, n, 110); } }); }; }
    else if (a === 'fan') { e.act = 'cast'; e.at = 0.5; e.castFn = () => { const vol = () => { const b = Math.atan2(p.y - e.y, p.x - e.x); for (let i = -2; i <= 2; i++) S.shots.push({ x: e.x, y: e.y, vx: Math.cos(b + i * 0.17) * 150, vy: Math.sin(b + i * 0.17) * 150, r: 4, dmg: 12, life: 4 }); blip(700, 0.08, 'triangle', 0.035, -300); }; vol(); for (let i = 1; i < ph + 1; i++) S.timers.push({ t: 0.28 * i, fn: () => { if (active(e)) vol(); } }); }; }
    else if (a === 'leap') { e.act = 'leap'; e.at = 0.9; e.sx = e.x; e.sy = e.y; e.lx = p.x; e.ly = p.y; S.hazards.push({ x: p.x, y: p.y, r: 62, t: 0.9, t0: 0.9, dmg: B.dmg, col: e.color }); }
    else if (a === 'lasers') { const n = ph > 1 ? 5 : 3; for (let i = 0; i < n; i++) S.lasers.push({ x: e.x, y: e.y, a: aim + (i - (n - 1) / 2) * 0.3, t: 0.9, t0: 0.9, dmg: 24, w: 5, src: e }); e.act = 'cast'; e.at = 0.95; }
    else if (a === 'pools') { for (let i = 0; i < 3 + ph; i++) { const ang = Math.random() * 6.28, r = i ? rnd(30, 110) : 0; S.hazards.push({ x: clamp(p.x + Math.cos(ang) * r, 20, T.room.w - 20), y: clamp(p.y + Math.sin(ang) * r, 20, T.room.h - 20), r: 36, t: 0.9 + i * 0.12, t0: 0.9 + i * 0.12, dmg: 18, linger: 4, col: GODS.venom.color }); } e.act = 'cast'; e.at = 0.6; }
    else if (a === 'summon') { for (let i = 0; i < 2 + ph; i++) spawn(B.sum === 'brute' ? 'stalker' : B.sum); rest(0.6); }
  }
}
// Enemigos con comportamiento propio. Los últimos que quedan en la sala no huyen y se acercan.
function enemyAI(e, dt, d, ux, uy, sp) {
  const p = S.p, ai = e.type.ai, few = S.enemies.length + S.queue.length <= 2, keep = (near, far) => { const mv = d > (few ? Math.min(far, 140) : far) || blocked(e, p) ? 1 : d < near && !few ? -0.6 : 0; if (mv > 0) { const [gx, gy] = navDir(e, ux, uy); e.x += gx * sp * dt; e.y += gy * sp * dt; } else { e.x += ux * mv * sp * dt; e.y += uy * mv * sp * dt; } };
  e.aiCd -= dt;
  if (ai === 'bomb') {                   // Bombardero: lanza un proyectil en arco a donde estás
    keep(110, 190);
    if (e.aiCd <= 0 && d < 300) { e.aiCd = 3.2; S.hazards.push({ x: p.x, y: p.y, r: 38, t: 1, t0: 1, dmg: e.dmg, col: e.color }); S.fx.push({ k: 'lob', x1: e.x, y1: e.y, x2: p.x, y2: p.y, t: 0, life: 1, col: e.color }); }
  } else if (ai === 'leap') {            // Saltador: cae sobre ti
    if (e.leapT > 0) { e.leapT -= dt; const k = 1 - Math.max(0, e.leapT) / 0.7; e.x = e.sx + (e.lx - e.sx) * k; e.y = e.sy + (e.ly - e.sy) * k; if (e.leapT <= 0) e.rec = 0.5; return; }
    if (e.rec > 0) { e.rec -= dt; return; }
    if (e.aiCd <= 0 && d > 60 && d < 210) { e.aiCd = 3; e.leapT = 0.7; e.sx = e.x; e.sy = e.y; e.lx = p.x; e.ly = p.y; S.hazards.push({ x: p.x, y: p.y, r: 32, t: 0.7, t0: 0.7, dmg: e.dmg, col: e.color }); return; }
    { const [gx, gy] = navDir(e, ux, uy); e.x += gx * sp * dt; e.y += gy * sp * dt; }
  } else if (ai === 'snipe') {           // Tirador: apunta con una línea y dispara
    if (e.aimT > 0) { e.aimT -= dt; const L = S.lasers.find(l => l.src === e); if (L && e.aimT > 0.35) { L.a = Math.atan2(p.y - e.y, p.x - e.x); L.x = e.x; L.y = e.y; } return; }
    keep(140, 250);
    if (e.aiCd <= 0 && d < 380 && !blocked(e, p)) { e.aiCd = 3.6; e.aimT = 1.1; S.lasers.push({ x: e.x, y: e.y, a: Math.atan2(p.y - e.y, p.x - e.x), t: 1.1, t0: 1.1, dmg: e.dmg, w: 4, src: e }); }
  } else if (ai === 'heal') {            // Chamán: cura a los suyos
    keep(120, 200);
    if (e.aiCd <= 0) { e.aiCd = 2.6; S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 110, t: 0, life: 0.4, col: e.color }); for (const o of others(e, 110, 20)) if (!o.boss) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.12); }
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

  navUpdate(dt);
  // Red de seguridad: si nadie recibe daño en 25 s y no queda nadie por llegar, los que quedan reaparecen a la vista
  if (S.enemies.length && !S.queue.length && S.t - (S.lastHitT || 0) > 25 && S.t - (S.roomT || 0) > 25) {
    S.lastHitT = S.t;
    for (const e of S.enemies) { if (e.boss || e.type.post) continue; let at = null; for (let i = 0; i < 12; i++) { const c = freeSpot(p, 70); if (dist(c, p) < 190 && !blocked(c, p)) { at = c; break; } } if (at) { e.x = at.x; e.y = at.y; e.spawn = 0.65; e.kx = e.ky = 0; e.leapT = 0; e.fling = 0; } }
  }

  // Oleadas
  S.waveT += dt;
  while (S.queue.length && S.queue[0].at <= S.waveT) { const q = S.queue.shift(); spawn(q.type, q); }
  if (S.keep) S.keep.flash = Math.max(0, S.keep.flash - dt);
  if (S.pendingLoot) { S.pendingLoot = false; pickQueue = [pieceScreen(lootGod(), 'Estandarte derribado · bajo él había un arma bendecida')]; S.rerolls = tk('reroll'); afterPicks = resumePlay; advancePick(); return; }
  if (!S.queue.length && !S.enemies.length) {
    S.waveClear += dt;
    if (S.waveClear > 0.7) { S.waveClear = 0; S.shots.length = 0; S.zones.length = 0; S.timers.length = 0; S.hazards.length = 0; S.lasers.length = 0; roomCleared(); return; }
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
  p.resT -= dt;
  if (p.reserve > resMax()) p.reserve = resMax();
  if (p.reserve > 0 && p.resT <= 0 && !duoOn('longlunch')) p.reserve = Math.max(0, p.reserve - 2 * dt);

  // Esquive (por cargas)
  const dMax = dodgeMax();
  if (p.dodgeN < dMax) { p.dodgeCd -= dt; if (p.dodgeCd <= 0) { p.dodgeN += 1; p.dodgeCd = dodgeCdOf(); } } else p.dodgeCd = dodgeCdOf();
  if (I.dodgeP && G('s_tower')) note(p.x, p.y - 16, 'Sin esquive', C.dim);
  if (I.dodgeP && p.dodgeN > 0 && p.dodgeT <= 0 && !G('s_tower')) startDodge(Math.hypot(I.mx, I.my) > 0.2 ? Math.atan2(I.my, I.mx) : p.face, false);

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
  const target = (S.lock && dist(p, S.lock) - S.lock.r <= rangeOf() && !blocked(p, S.lock)) ? S.lock : nearestInRange();
  S.target = target;

  // Disparo cargado
  if (I.chg && !p.charging && !p.drawing && p.chargeCd <= 0 && p.dodgeT <= 0 && p.windup <= 0) { p.charging = true; p.charge = 0; p.chargeDir = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face; }
  if (p.charging) {
    const before = p.charge; p.charge += dt * (1 + 0.1 * tk('armorer'));
    if (before < T.charge.full && p.charge >= T.charge.full) blip(1500, 0.06, 'sine', 0.04);
    if (am > 0.35) p.chargeDir = Math.atan2(I.ay, I.ax);
    else if (target) p.chargeDir = Math.atan2(target.y - p.y, target.x - p.x);
    p.face = p.chargeDir;
    if (!I.chg) { if (p.charge >= T.charge.min) fireCharged(am); p.charging = false; p.charge = 0; }
  }

  // Disparo básico: cada disparo es un gesto corto que te frena
  if (I.atkP) { if (p.cd > T.buffer) p.spoil = true; p.buffer = T.buffer; if (!target) S.noTarget = 0.25; }
  const g = S.gun, A = g.action, want = p.buffer > 0 || I.atk || A === 'a_auto';
  if (p.over > 0) p.over -= dt;
  p.runUp = g.action === 'a_semi' && p.still < 0.25 ? Math.min(1, p.runUp + dt / 3) : 0;   // Llave de chispa: carrerilla
  p.wardCd = Math.max(0, (p.wardCd || 0) - dt);
  p.fly2 = S.gun.action === 'a_fly' && S.t - p.lastShotT < 1 ? Math.min(1, p.fly2 + dt / 5) : 0;   // Llave de volante
  if (S.gun.action === 'a_over') { const was = p.overT; p.overT = Math.min(10, p.overT + dt); if (was < 10 && p.overT >= 10) { note(p.x, p.y - 16, 'Sobrecarga lista', C.ember); blip(1400, 0.1, 'sine', 0.04, 300); } }
  if (p.cd <= 0 && p.windup <= 0) p.idle = (p.idle || 0) + dt;   // tiempo con el arma lista (Llave de resorte, Culata de corredor)
  if (g.barrel === 'b_flail') {   // Mangual: la bola gira y golpea lo que toca
    p.orbAway = Math.max(0, p.orbAway - dt); p.orbA += dt * 5.2 * (ens('mill') && S.t - (p.lastDodgeT || -9) < 2 ? 3 : 1);
    if (p.orbAway <= 0) { const bx = p.x + Math.cos(p.orbA) * 34, by = p.y + Math.sin(p.orbA) * 34;
      for (const e of S.enemies.slice()) if (active(e) && (e.orbT || 0) <= S.t && Math.hypot(e.x - bx, e.y - by) < e.r + 7) { e.orbT = S.t + 0.45; S.stat.orb++; const d = dist(p, e) || 1; shot(e, p.dmg * gunDmg() * 0.7, (e.x - p.x) / d, (e.y - p.y) / d, false, slotColor('basic')); } }
  }
  // Reflejos: se colocan al otro lado del objetivo (el segundo, a un lado)
  { const n = mirrorN(); while (S.mirrors.length < n) S.mirrors.push({ x: p.x, y: p.y }); S.mirrors.length = n;
    S.mirrors.forEach((m, i) => { const tg = target; let wx, wy;
      if (tg) { const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy) || 1, a = Math.atan2(dy, dx) + (i ? Math.PI / 2 : 0), r = Math.min(70, d); wx = tg.x + Math.cos(a) * r; wy = tg.y + Math.sin(a) * r; }
      else { wx = p.x - Math.cos(p.face) * 30 * (i ? -1 : 1); wy = p.y - Math.sin(p.face) * 30; }
      const at = unstick(clamp(wx, 12, T.room.w - 12), clamp(wy, 12, T.room.h - 12)); m.x += (at.x - m.x) * Math.min(1, dt * 9); m.y += (at.y - m.y) * Math.min(1, dt * 9); }); }
  // Sabuesos: van a por la presa (quien disparas) y muerden
  { const n = petN(); while (S.pets.length < n) S.pets.push({ x: p.x + 12, y: p.y + 8, cd: 0.5, prey: null, dir: 0 }); S.pets.length = n;
    const lb = lv('beast_basic'), k = lb ? 0.6 * lb : 0.3;
    for (const pt of S.pets) {
      if (!pt.prey || !active(pt.prey)) { pt.prey = null; let bd = 170; for (const e of S.enemies) { if (!active(e)) continue; const d = dist(p, e); if (d < bd) { bd = d; pt.prey = e; } } }
      const goal = pt.prey || { x: p.x + 14, y: p.y + 10, r: 0 }, dx = goal.x - pt.x, dy = goal.y - pt.y, d = Math.hypot(dx, dy) || 1, reach = (goal.r || 0) + 8;
      if (d > reach) { const sp = Math.min(d - reach + 1, 150 * dt); pt.x += dx / d * sp; pt.y += dy / d * sp; pt.dir = dx; }
      if (dist(pt, p) > 300) { pt.x = p.x; pt.y = p.y; }
      pt.cd -= dt * (duoOn('warhound') && furyFull() ? 2 : 1);
      if (pt.prey && d <= reach + 4 && pt.cd <= 0) { pt.cd = 0.8; bite(pt, pt.prey, k); }
    } }
  for (const w of S.wells) {      // pozos del Vacío: arrastran, pulsan y al cerrarse estallan
    w.life -= dt; w.acc += dt; const pulse = w.acc >= 0.5; if (pulse) w.acc = 0;
    for (const e of S.enemies.slice()) {
      if (!active(e) || e.type.post) continue; const dx = w.x - e.x, dy = w.y - e.y, d = Math.hypot(dx, dy) || 1; if (d > w.r + e.r) continue;
      w.got.add(e); e.inWell = 0.3; if (leg('blacksun')) light(e, 1);
      if (!e.boss && d > 6) { const f = Math.min(d, 130 * dt); e.x += dx / d * f; e.y += dy / d * f; }
      if (w.stunC && d < 16 && !w.got.has('s' + S.enemies.indexOf(e))) { w.got.add('s' + S.enemies.indexOf(e)); stun(e, 0.5); }
      if (pulse && w.pulse) dot(e, w.pulse * (has('o_crush') && d < 18 ? 2 : 1), GODS.void.color);
    }
    if (duoOn('lens')) { /* nada: los Cristales iluminan en su propio bucle */ }
    if (w.life <= 0) { if (w.end) explode(w.x, w.y, w.r * 0.8, w.end, { col: GODS.void.color }); if (w.embers) for (const e of w.got) if (e && e.ember > 0 && active(e)) { const st = e.ember; e.ember = 0; explode(e.x, e.y, 40, p.dmg * 0.35 * st, { col: GODS.dragon.color, soft: true }); } }
  }
  S.wells = S.wells.filter(w => w.life > 0);
  if (duoOn('lens')) for (const c of S.crystals) for (const e of S.enemies) if (active(e) && Math.hypot(e.x - c.x, e.y - c.y) < 60) light(e, 1.5);   // dúo Lente
  for (const mn of S.mines) {     // minas de la Recámara de minas
    mn.life -= dt;
    if (S.enemies.some(e => active(e) && !e.type.fly && Math.hypot(e.x - mn.x, e.y - mn.y) < e.r + 9)) { mn.life = 0; S.stat.mine++; if (res('thornmine')) S.zones.push({ x: mn.x, y: mn.y, r: 40, life: 4, acc: 0.4, slow: 0.5, dmg: p.dmg * 0.25, bram: true, col: GODS.wood.color }); explode(mn.x, mn.y, 50, mn.dmg, { col: mn.col, payoff: true }); }
  }
  S.mines = S.mines.filter(mn => mn.life > 0);
  p.quick = Math.max(0, p.quick - dt); p.buttCd = Math.max(0, p.buttCd - dt);
  if (g.stock === 's_heavy' && p.buttCd <= 0 && p.dodgeT <= 0) {   // Culata herrada: culatazo a quien se pegue
    const near = S.enemies.filter(e => active(e) && !e.boss && dist(p, e) < p.r + e.r + 9);
    if (near.length) {
      p.buttCd = 2.5; S.stat.butt++; S.shake = Math.max(S.shake, 4); blip(180, 0.12, 'square', 0.06, -60); note(p.x, p.y - 16, '¡Culatazo!', C.ember, true);
      S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 26, t: 0, life: 0.18, col: C.ink });
      for (const e of near) { const d = dist(p, e) || 1; hit(e, p.dmg * 0.8, (e.x - p.x) / d, (e.y - p.y) / d, true, C.ink); if (active(e)) { e.kx += (e.x - p.x) / d * 300; e.ky += (e.y - p.y) / d * 300; stun(e, 0.6); } }
    }
  }
  p.heatT -= dt; if (p.heatT <= 0) p.heat = Math.max(0, p.heat - dt * 0.45);
  const canFire = p.over <= 0 && !p.charging && p.dodgeT <= 0;
  if (A === 'a_hold') {   // Llave de retén: guardar hasta tres balas y soltarlas
    if (I.atk && canFire && p.cd <= 0) { p.drawing = true; p.draw = Math.min(1, p.draw + dt / (periodOf() * 2.2)); if (target) p.face = Math.atan2(target.y - p.y, target.x - p.x); }
    else if (p.drawing) {
      p.drawing = false; const n = 1 + Math.floor(p.draw * 2 + 0.001); p.draw = 0; p.cd = periodOf() * 0.5; S.stat.hold = (S.stat.hold || 0) + n;
      for (let i = 0; i < n; i++) S.timers.push({ t: 0.09 * i, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) fireBasic(t2); } });
    }
  } else if (A === 'a_draw') {   // De tensado: mantener para tensar, soltar para disparar
    if (I.atk && !p.drawing && p.cd <= 0 && canFire) { p.drawing = true; p.draw = 0; }
    if (p.drawing) {
      const before = p.draw; p.draw = Math.min(1, p.draw + dt / (periodOf() * 0.85));
      if (before < 1 && p.draw >= 1) blip(1700, 0.05, 'sine', 0.04);
      if (target) p.face = Math.atan2(target.y - p.y, target.x - p.x);
      if (!I.atk) { p.drawing = false; p.drawPow = p.draw; p.cd = periodOf() * 0.3; fireBasic(target); }
    }
  } else if (A === 'a_rotary') {   // Giratorio: girar y escupir
    if (I.atk && canFire) {
      const was = p.spin; p.spin = Math.min(1, p.spin + dt / 0.5);
      if (was < 1 && p.spin >= 1) blip(900, 0.08, 'sawtooth', 0.03, 600);
      if (p.spin >= 1 && target && p.cd <= 0) {
        p.gat -= dt;
        const step = periodOf() / 6.6;                       // unas siete veces por segundo con la cadencia base
        while (p.gat <= 0 && p.cd <= 0 && p.over <= 0) { p.gat += step; fireBasic(target); }
      }
    } else { p.spin = Math.max(0, p.spin - dt * 2.5); p.gat = 0; }
  } else if (want && target && canFire && p.windup <= 0 && p.cd <= 0) {   // Cerrojo, semiautomático y ráfaga: a pulsaciones
    const period = periodOf();
    p.crit = (A === 'a_bolt' || A === 'a_pend' || S.plans.has('tempo')) && p.buffer > 0 && !p.spoil && S.t - p.readyT <= 0.13;   // Compás: pulsación justa
    p.spoil = false;
    p.windupTotal = p.windup = period * P.windupFrac * (A === 'a_alt' ? (p.alt ? 2 : 0.2) : 1) * (A === 'a_semi' ? 0.5 : A === 'a_burst' ? 1.25 : 1) * (g.stock === 's_heavy' ? 1.3 : 1) * (g.barrel === 'b_spike' ? 0.6 : 1) * (1 - 0.06 * tk('brake'));
    if (g.barrel === 'b_short' && p.quick > 0) p.windupTotal = p.windup = 0.03;
    if (A === 'a_fin' && target.hp / target.maxHp < 0.25) p.windupTotal = p.windup = 0.03;   // Llave de remate: sin frenazo   // Pistolete: desenfundar no tiene frenazo
    p.windupTarget = target; p.cd = period; p.buffer = 0;
    if (A === 'a_fuse') { p.windup = 0; const tg = target; S.fx.push({ k: 'clock', x: p.x, y: p.y, t: 0, life: 0.5 }); S.timers.push({ t: 0.5, fn: () => { if (S.p.dodgeT <= 0) { fireBasic(tg); if (res('lullaby') && tg && active(tg)) sleep(tg, 3); } } }); }   // Mecha lenta: sale sola medio segundo después
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
  else if (p.drawing) mult = free ? 1 : 0.4;
  else if (p.windup > 0) mult = free || A === 'a_semi' ? 1 : P.windupSlow;
  else if (I.atk && A === 'a_rotary') mult = free ? 1 : p.over > 0 ? 0.8 : 0.3 + 0.35 * (1 - p.spin);
  else if (I.atk && target) mult = free || A === 'a_semi' ? 1 : P.holdSlow;
  if (g.stock === 's_sprint' && (p.idle || 0) > 2) mult *= 1.35;                // Culata de corredor
  if (g.stock === 's_gasp' && p.hp < p.maxHp * 0.25) mult *= 1.3;              // Culata del último aliento
  p.still = Math.hypot(I.mx, I.my) < 0.2 && p.dodgeT <= 0 ? p.still + dt : 0;   // para el Bípode
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
    if (Math.hypot(I.mx, I.my) > 0.2 && p.windup <= 0 && !p.charging && !(p.drawing && target)) p.face = Math.atan2(I.my, I.mx);
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
    collide(p, p.r);
  }

  // Armas gemelas
  for (const tu of S.turrets) {
    tu.life -= dt; tu.cd -= dt;
    if (tu.cd > 0) continue;
    let bestE = null, bd = rangeOf();
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(tu, e) - e.r; if (d < bd && !blocked(tu, e)) { bd = d; bestE = e; } }
    if (!bestE) { tu.cd = 0.1; continue; }
    const dx = bestE.x - tu.x, dy = bestE.y - tu.y, d = Math.hypot(dx, dy) || 1, col = slotColor('basic');
    S.fx.push({ k: 'tracer', x1: tu.x, y1: tu.y, x2: bestE.x, y2: bestE.y, t: 0, life: 0.09, col });
    onHit(bestE, p.dmg * (tu.k || 0.5), dx / d, dy / d, false, col, 'turret');
    tu.cd = periodOf();
  }
  S.turrets = S.turrets.filter(tu => tu.life > 0);

  // Sombras: buscan al enemigo más cercano y lo golpean
  for (const s of S.shades) {
    s.life -= dt; s.cd -= dt;
    let tg = null, td = 320;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(s, e); if (d < td) { td = d; tg = e; } }
    if (tg) {
      if (td > tg.r + 8) { s.x += (tg.x - s.x) / td * 100 * dt; s.y += (tg.y - s.y) / td * 100 * dt; }
      else if (s.cd <= 0) { s.cd = 0.7; shadeStrike(s, tg); }
    }
    if (has('s_guard')) for (const sh of S.shots) if (Math.hypot(sh.x - s.x, sh.y - s.y) < 11) sh.life = 0;   // Guardia de honor
  }
  for (const s of S.shades) if (s.life <= 0) shadeEnd(s);
  S.shades = S.shades.filter(s => s.life > 0);

  // Burbujas de tiempo
  const miasma = duoOn('miasma'), stasis = duoOn('stasis');
  for (const f of S.fields) {
    f.life -= dt;
    for (const e of S.enemies) {
      if (!active(e) || dist(f, e) > f.r + e.r) continue;
      slow(e, 0.15, 0.3);
      if (miasma && e.venom > 0) e.venAcc += dt * 2;                       // dúo Miasma
      if (stasis) { e.fieldAcc += dt; if (e.fieldAcc >= 1) { e.fieldAcc = 0; addNeedles(e, 1); } }   // dúo Relámpago en pausa
    }
    for (const sh of S.shots) if (Math.hypot(sh.x - f.x, sh.y - f.y) < f.r) { sh.x -= sh.vx * dt * 0.7; sh.y -= sh.vy * dt * 0.7; }
    if (f.life <= 0 && stasis) for (const e of S.enemies.slice()) if (active(e) && dist(f, e) <= f.r + e.r) discharge(e, 0.8, null);
  }
  S.fields = S.fields.filter(f => f.life > 0);

  // Cristales
  const obs = duoOn('obsidian'), tox = duoOn('stalagm'), tab = duoOn('table'), cq = duoOn('clockquartz');
  for (const c of S.crystals) {
    c.life -= dt; c.acc += dt;
    if (c.acc < 0.5 || !(obs || tox || tab || cq)) continue;
    c.acc = 0;
    let fed = false;
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const d = dist(c, e) - e.r;
      if (obs && d < 42) addEmber(e, 1);                                   // dúo Bala de obsidiana
      if (tox && d < 42) addVenom(e, 2);                                   // dúo Estela de cristal
      if (cq && d < 50) { slow(e, 0.6, 0.6); fed = true; }                 // dúo Cuarzo de reloj
      if (tab && d < 60 && !e.boss && e.hp / e.maxHp < (e.champ ? 0.1 : 0.2)) {   // dúo Mesa puesta
        S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: e.x, y2: e.y, t: 0, life: 0.15, col: GODS.feast.color, w: 1.5 });
        hit(e, e.hp + 1, 0, 0, true, GODS.feast.color); addReserve(4);
      }
    }
    if (fed) c.life += 0.5;
  }
  for (const c of S.crystals) if (c.life <= 0) {
    if (obs) explode(c.x, c.y, 38, p.dmg, { col: GODS.dragon.color, ember: 2 });
    if (duoOn('tombstone')) raiseShade(c.x, c.y);                             // dúo Lápida
  }
  S.crystals = S.crystals.filter(c => c.life > 0);

  // Enemigos
  const boil = duoOn('boil'), venStep = (mastery('venom') ? 0.25 : 0.5) * (boil && furyFull() ? 0.5 : 1), embMul = (mastery('dragon') ? 1.5 : 1) * (1 + 0.12 * aff('dragon')), venMul = 1 + 0.1 * aff('venom'), bleedMul = 1 + 0.12 * aff('blood');
  const lunch = duoOn('longlunch') ? 1 - Math.min(0.6, 0.02 * p.reserve) : 1;
  for (const e of S.enemies) {
    if (e.hp <= 0) continue;
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    e.flash = Math.max(0, e.flash - dt);
    { const far = e.wet > 0 && lv('tide_passive') ? 1.5 : 1; e.x += e.kx * dt * far; e.y += e.ky * dt * far; }   // Marea alta: los Empapados salen más lejos
    e.wet = Math.max(0, (e.wet || 0) - dt); e.root = Math.max(0, (e.root || 0) - dt); e.bram = Math.max(0, (e.bram || 0) - dt);
    if (!mastery('light')) e.lit = Math.max(0, (e.lit || 0) - dt);
    if (e.napAfter && !(e.frozen > 0)) { e.napAfter = false; sleep(e, 2); }                     // dúo Hibernar
    e.traced = Math.max(0, (e.traced || 0) - dt); e.inWell = Math.max(0, (e.inWell || 0) - dt);
    e.frozen = Math.max(0, (e.frozen || 0) - dt); if (e.frost > 0 && !(e.frozen > 0)) { e.frostT -= dt; if (e.frostT <= 0) e.frost = 0; }
    if (e.bleed > 0) {                 // Heridas: sangran más cuanta menos vida tengas
      e.bleedT -= dt; e.bleedAcc = (e.bleedAcc || 0) + dt;
      if (e.bleedAcc >= 0.5) { e.bleedAcc -= 0.5; S.stat.bleed++; dot(e, e.bleed * p.dmg * 0.05 * bleedMul * (e.venom > 0 && leg('widow') ? 2 : 1) * (1 + 2 * (1 - p.hp / p.maxHp)) * (duoOn('warwound') && furyFull() ? 2 : 1) * (duoOn('hemotoxin') && e.venom > 0 ? 2 : 1), GODS.blood.color); }
      if (e.bleedT <= 0) e.bleed = 0;
      if (e.hp <= 0) continue;
    }
    if (e.doom) { e.doom.t -= dt; if (e.doom.t <= 0) { fulfil(e); if (e.hp <= 0) continue; } }
    e.slamCd = Math.max(0, (e.slamCd || 0) - dt);
    let reef = null;
    if (duoOn('reef') && Math.hypot(e.kx, e.ky) > 170) for (const c of S.crystals) if (Math.hypot(e.x - c.x, e.y - c.y) < e.r + 8) reef = c;   // dúo Arrecife
    if (e.slamCd <= 0 && !e.boss && Math.hypot(e.kx, e.ky) > 170 && (reef || touchesWall(e, e.r + 1.5) || e.x < e.r + 3 || e.y < e.r + 3 || e.x > T.room.w - e.r - 3 || e.y > T.room.h - e.r - 3)) {   // empujado contra un muro
      e.slamCd = 0.9; S.stat.slam++; const kx = e.kx, ky = e.ky, kl = Math.hypot(kx, ky); e.kx = e.ky = 0;
      S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 8, t: 0, life: 0.16, col: C.ink }); S.shake = Math.max(S.shake, 3); blip(160, 0.1, 'square', 0.05, -50);
      if (reef) { reef.life = 0; explode(reef.x, reef.y, 40, p.dmg * 1.2, { col: GODS.stone.color, skip: e }); }
      if (duoOn('steam') && e.ember > 0) { const st = e.ember; e.ember = 0; explode(e.x, e.y, 42, p.dmg * 0.35 * st, { col: GODS.dragon.color, skip: e }); }   // dúo Vapor
      if (duoOn('ram')) gainFury(20);                                        // dúo Ariete
      if (has('w_deep')) addGold(1);                                         // Mar de fondo
      if (mastery('tide')) { explode(e.x, e.y, 50, p.dmg * 1.5, { col: GODS.tide.color, skip: e }); for (const o of others(e, 50, 9)) soak(o, 4); }   // maestría Señor del abismo
      note(e.x, e.y - e.r - 6, '¡Contra el muro!', C.ink); hit(e, p.dmg * 0.9 * (1 + 0.5 * lv('tide_basic')) * (1 + 0.2 * aff('tide')) * (ens('ram') ? 1.6 : 1), kx / kl, ky / kl, true, C.ink); stun(e, has('w_deep') ? 1.4 : 0.7);
      if (e.hp <= 0) continue;
    }
    const damp = 1 - Math.min(1, dt * 12); e.kx *= damp; e.ky *= damp;
    e.autoCd = Math.max(0, e.autoCd - dt); e.mark = Math.max(0, e.mark - dt);
    if (e.slowT > 0) e.slowT -= dt; else e.slowF = 1;
    if (lunch < 1 && dist(p, e) < 90) slow(e, 0.15, lunch);                // dúo Sobremesa larga
    if (e.needles > 0 && !(duoOn('syringe') && e.venom > 0)) { e.needleT -= dt; if (e.needleT <= 0) e.needles = 0; }
    if (e.fling > 0) {                   // dúo Avalancha: enemigo lanzado
      e.fling -= dt; e.x += e.fvx * dt; e.y += e.fvy * dt;
      let bump = e.x < e.r + 3 || e.y < e.r + 3 || e.x > T.room.w - e.r - 3 || e.y > T.room.h - e.r - 3;
      if (touchesWall(e, e.r + 1)) bump = true;
      for (const c of S.crystals) if (Math.hypot(e.x - c.x, e.y - c.y) < e.r + 7) { bump = true; c.life = 0; }
      for (const o of S.enemies) if (o !== e && active(o) && dist(e, o) < e.r + o.r) bump = true;
      if (bump) { e.fling = 0; explode(e.x, e.y, 50, p.dmg * 3, { stun: 0.6, col: GODS.stone.color }); gainFury(10); }
      continue;
    }
    if (e.ember > 0) {
      if (!duoOn('eternal')) e.emberT -= dt;                                  // dúo Brasa eterna: no se apagan
      e.emberAcc += dt;
      if (e.emberAcc >= 0.5) { e.emberAcc -= 0.5; dot(e, e.ember * p.dmg * 0.12 * embMul * (duoOn('sunfire') && e.lit > 0 ? 2 : 1), GODS.dragon.color); }
      if (e.emberT <= 0) e.ember = 0;
      if (e.hp <= 0) continue;
    }
    if (e.venom > 0) {
      e.venAcc += dt;
      if (e.venAcc >= venStep) { e.venAcc -= venStep; const d = dot(e, e.venom * p.dmg * 0.035 * venMul * (e.bleed > 0 && leg('widow') ? 2 : 1), GODS.venom.color); if (boil) gainFury(1); if (duoOn('indigest') && d) heal(d * 0.1); }
      if (e.hp <= 0) continue;
    }
    if (e.type.post) {                  // estandarte: no se mueve y llama refuerzos
      e.x = e.px; e.y = e.py; e.kx = e.ky = 0; e.stun = 0; e.aiCd -= dt;
      if (e.aiCd <= 0) { e.aiCd = 6; if (S.enemies.length + S.queue.length < 19) { const pool = WORLDS[S.world - 1].pool.filter(k => TYPES[k].cost <= 2.5); for (let i = 0; i < 2; i++) S.queue.push({ type: pool[Math.floor(Math.random() * pool.length)], at: S.waveT + 0.2 * i, near: e }); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 30, t: 0, life: 0.4, col: C.blood }); blip(300, 0.2, 'sawtooth', 0.04, 200); } }
      continue;
    }
    if (e.stun > 0) { e.stun -= dt; continue; }
    if (e.sleep > 0) { e.sleep -= dt; if (e.sleep <= 0) wake(e); continue; }   // dormido: ni se mueve ni ataca
    const sp = e.speed * (e.slowT > 0 ? e.slowF : 1);
    if (e.raid && S.keep) {             // asaltante: va a por la campana de la aldea y la golpea
      const k = S.keep, kx = k.x - e.x, ky = k.y - e.y, kd = Math.hypot(kx, ky) || 1; e.dir = Math.atan2(ky, kx);
      if (kd > k.r + e.r + 3) { e.x += kx / kd * sp * dt; e.y += ky / kd * sp * dt; }
      else { e.raidCd = (e.raidCd || 0.6) - dt; if (e.raidCd <= 0) { e.raidCd = 1.3; k.hp -= Math.max(3, e.dmg * 0.4); k.flash = 0.15; S.shake = Math.max(S.shake, 2); blip(240, 0.08, 'square', 0.04, -80); if (k.hp <= 0) { missionFail('La campana ha caído y la aldea con ella.'); return; } } }
      continue;
    }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (e.lungeWind <= 0 && e.lungeT <= 0) e.dir = Math.atan2(dy, dx);
    if (e.boss) { bossAI(e, dt * (e.slowT > 0 ? e.slowF : 1), d, ux, uy); continue; }
    if (e.type.ai) { enemyAI(e, dt * (e.slowT > 0 ? e.slowF : 1), d, ux, uy, e.speed); continue; }
    if (e.type.ranged) {
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) { S.shots.push({ x: e.x, y: e.y, vx: ux * 125, vy: uy * 125, r: 4, dmg: e.dmg, life: 3.5 }); e.cool = 2.4; blip(700, 0.08, 'triangle', 0.025, -300); }
      } else {
        e.cool -= dt;
        const few = S.enemies.length + S.queue.length <= 2, mv = d > (few ? 140 : 195) || blocked(e, p) ? 1 : d < 120 && !few ? -1 : 0;
        if (mv > 0) { const [gx, gy] = navDir(e, ux, uy); e.x += gx * sp * dt; e.y += gy * sp * dt; } else { e.x += ux * mv * sp * dt; e.y += uy * mv * sp * dt; }
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
      if (e.champ || e.type.lunge) {
        e.lungeCd -= dt;
        if (e.lungeCd <= 0 && d < 150 && d > 45 && !blocked(e, p)) { e.lungeCd = 3.5; e.lungeWind = 0.5; e.lvx = ux * 300; e.lvy = uy * 300; continue; }
      }
      if (e.type.fly) { const w = Math.sin(S.t * 7 + e.x * 0.05) * 0.7; e.x += (ux - uy * w) * sp * dt; e.y += (uy + ux * w) * sp * dt; }   // vuela en zigzag por encima de los muros
      else { const [gx, gy] = navDir(e, ux, uy); e.x += gx * sp * dt; e.y += gy * sp * dt; }   // recto si te ve; por el camino si hay un muro en medio
    }
  }
  // Zonas en el suelo: fuego o veneno
  for (const z of S.zones) {
    z.life -= dt; z.acc += dt;
    if (z.acc < 0.4) continue;
    z.acc = 0;
    const touch = e => {
      if (z.ember) addEmber(e, z.ember); if (z.venom) addVenom(e, z.venom);
      if (z.frost) addFrost(e, z.frost);
      if (z.sleepOnce && active(e) && !z.sleepOnce.has(e)) { z.sleepOnce.add(e); sleep(e, 2); }
      if (z.slow) slow(e, 0.6, z.slow); if (z.bram) e.bram = 0.6; if (z.dmg) dot(e, z.dmg, z.col);
      if (z.flow && active(e)) { soak(e, 3); push(e, z.flow.ux, z.flow.uy, z.flow.f); }
      if (z.rootOnce && active(e) && !z.rootOnce.has(e)) { z.rootOnce.add(e); if (z.wet) soak(e, 4); if (z.venom1) addVenom(e, z.venom1); if (z.frost1) addFrost(e, z.frost1); root(e, 1); hit(e, z.dmg1, 0, 0, false, z.col); }
    };
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
    if ((e.boss && e.act === 'leap') || e.leapT > 0 || e.type.fly) continue;   // en el aire no chocan
    collide(e, e.r);
  }
  S.enemies = S.enemies.filter(e => e.hp > 0);

  // Proyectiles, avisos en el suelo y líneas de tiro enemigas
  for (const s of S.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.x < 0 || s.y < 0 || s.x > T.room.w || s.y > T.room.h) s.life = 0;
    if (isWallAt(s.x, s.y)) s.life = 0;
    if (s.life > 0 && Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r) { if (p.inv <= 0) { hurtPlayer(s.dmg); s.life = 0; } }
  }
  S.shots = S.shots.filter(s => s.life > 0);
  for (const h of S.hazards) {
    if (!h.done) {
      h.t -= dt;
      if (h.t <= 0) { h.done = true; h.life = h.linger || 0; h.acc = 0; S.fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, t: 0, life: 0.25, col: h.col }); blip(100, 0.15, 'sawtooth', 0.05, -40); if (dist(p, h) < h.r + p.r) hurtPlayer(h.dmg); }
    } else { h.life -= dt; h.acc += dt; if (h.acc >= 0.5) { h.acc = 0; if (dist(p, h) < h.r + p.r) hurtPlayer(h.dmg * 0.35); } }
  }
  S.hazards = S.hazards.filter(h => !h.done || h.life > 0);
  for (const l of S.lasers) {
    l.t -= dt;
    if (l.t > 0) continue;
    const ux = Math.cos(l.a), uy = Math.sin(l.a), len = rayClip(l.x, l.y, ux, uy, 700);
    S.fx.push({ k: 'beam', x1: l.x, y1: l.y, x2: l.x + ux * len, y2: l.y + uy * len, t: 0, life: 0.18, w: l.w, col: C.blood });
    blip(1300, 0.1, 'sawtooth', 0.04, -900);
    const ex = p.x - l.x, ey = p.y - l.y, al = ex * ux + ey * uy;
    if (al > 0 && al < len && Math.abs(ex * uy - ey * ux) < l.w + p.r) hurtPlayer(l.dmg);
  }
  S.lasers = S.lasers.filter(l => l.t > 0 && (!l.src || active(l.src)));

  // Efectos
  // Trampas de pinchos: reposo, aviso y arriba. Pinchan a quien esté encima, enemigos incluidos.
  for (const tr of S.traps) {
    const ph = (S.t + tr.off) % 3.4; tr.state = ph < 2 ? 0 : ph < 2.7 ? 1 : 2;
    if (tr.state !== 2) { tr.hitP = false; tr.acc = 0.5; continue; }
    const on = o => o.x > tr.x - o.r * 0.4 && o.x < tr.x + tr.w + o.r * 0.4 && o.y > tr.y - o.r * 0.4 && o.y < tr.y + tr.h + o.r * 0.4;
    if (!tr.hitP && p.dodgeT <= 0 && on(p)) { tr.hitP = true; hurtPlayer(7 + 2 * S.world); }
    tr.acc += dt;
    if (tr.acc >= 0.5) { tr.acc = 0; for (const e of S.enemies.slice()) if (active(e) && !e.type.fly && e.leapT <= 0 && !(e.boss && e.act === 'leap') && on(e)) { S.stat.spike++; hit(e, Math.max(p.dmg * 1.5, e.boss ? 0 : e.maxHp * 0.2), 0, 0, false, C.ink); } }
  }
  for (const f of S.fx) { f.t += dt; if (f.k === 'spark' || f.k === 'smoke') { f.x += f.vx * dt; f.y += f.vy * dt; } if (f.k === 'num') f.y -= 22 * dt; }
  S.fx = S.fx.filter(f => f.t < f.life);
  if (S.fx.length > 500) S.fx.splice(0, S.fx.length - 500);
}

// ───────────────────────── Sprites (pixel art dibujado por código) ─────────────────────────
// Todo se dibuja a tamaño real: 1 píxel del sprite = 1 unidad de mundo. Las figuras miran a la derecha y se voltean.
// Las pequeñas son rejillas de texto (cada letra, un color). Las grandes se pintan con formas y sombreado automático.
function tone(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); }

// Paleta común: materiales de un mundo medieval oscuro
const PAL = {
  o: '#16101a', k: '#0b080d',
  s: '#dba274', S: '#a8683f',          // piel
  b: '#8f5d36', B: '#5a3822',          // cuero y madera
  i: '#a3adb8', I: '#5d6673', w: '#eef3f6',   // acero
  n: '#e6dfc6', N: '#a39c84',          // hueso
  r: '#b8382e', R: '#74201f',          // rojo
  g: '#e9c46a', G: '#a8762c',          // oro y latón
  v: '#7d9a4a', V: '#48622f',          // piel verde
  t: '#d9d2c0', T: '#8f8a7c',          // lino
  p: '#6b4a8a', P: '#3d2a55',          // túnica
  f: '#ff9a3c', F: '#ffe08a',          // fuego
};
const ART = {
  // El protagonista: pelo de ceniza, un ojo encendido, bufanda roja al viento y abrigo largo con ribete de brasa.
  // El martillo de forja asoma a la espalda.
  player: { pal: { g: '#ff8a3c', h: '#eef2f5', H: '#a9b4c0', c: '#3b4160', C: '#242840', x: '#565d85', e: '#ffb347', m: '#6b7380' }, legs: 4, rows: [
    '.......oooooo.......',
    '.....oohhhhhhoo.....',
    '....ohhhhhhhhhho....',
    '.om.ohHhhhhhhhhho...',
    'ommoohHHhhhHhhhho...',
    'ommoohHHHssHHhho....',
    '.obooHHsssssHso.....',
    '..oboHsskssesso.....',
    '..oboosssssssso.....',
    'orrrorrrrrrrroo.....',
    'oRrrrrRRrrrrro......',
    '.oooRoxccccccxoo....',
    '...ooxccgccccxsso...',
    '....occcgcccCooo....',
    '....occcgcccCo......',
    '....occcgccCCo......',
    '...oxcccgccCCCo.....',
    '...occcggcCCCCo.....',
    '...oCcCooCCCCCo.....',
    '....oooIIoIIooo.....',
    '.....oIIooIIo.......',
    '.....oIIooIIo.......',
    '....oBBBooBBBo......',
    '....oooo..oooo......' ],
    alt: [
    '.....oIIooIIo.......',
    '....oBBBooIIo.......',
    '....oooo.oBBBo......',
    '.........oooo.......' ] },
  // Necrófago: cadáver encorvado de piel cenicienta, harapos y garras
  stalker: { pal: { c: '#8fa58c', C: '#56705a', e: '#ffe08a', h: '#6e2f3a', H: '#431c26' }, legs: 3, rows: [
    '.....ooooo....',
    '....occcccco..',
    '...occcccccco.',
    '...occeccecco.',
    '...oCcckkcco..',
    '....oCcnnco...',
    '..ooohhhhoo...',
    '.occohhhHocco.',
    '.ocoohhhHooco.',
    '.oco.ohHHo.oco',
    '.oCo.ohhHo.oCo',
    '.ono.oHHHo.ono',
    '.o.o.ohoHo.o.o',
    '....oCooCo....',
    '....oCooCo....',
    '...oCCooCCo...',
    '...ooo..ooo...' ],
    alt: [
    '....oCooCo....',
    '...oCCo.oCo...',
    '...ooo.oCCo...' ] },
  // Trasgo: pequeño, orejas enormes, ojos rojos y un cuchillo
  runner: { pal: { e: '#ff5a4a' }, legs: 2, rows: [
    'oo..ooooo..oo.',
    'ovoovvvvvoovo.',
    '.ovvvvvvvvvo..',
    '..ovevvvevo...',
    '..ovvvkvvvo...',
    '...ovnvnvo....',
    '..oobbbbboo.o.',
    '.ovobbBbbovowo',
    '.ovobbBbbovoio',
    '..oobBBBboo.o.',
    '...oVooVo.....',
    '..oVVo.oVVo...',
    '..ooo..ooo....' ],
    alt: [
    '...oVo.oVVo...',
    '..ooo...ooo...' ] },
  // Cultista: túnica con capucha, dos ojos en la sombra y un báculo con una brasa arcana
  mage: { pal: { e: '#d7b8ff', E: '#b68cff' }, legs: 2, rows: [
    '.....oooo....oo.',
    '....oppppo..oEEo',
    '...oppppppo.oEeo',
    '...opPPPPpo..oo.',
    '...opkekeko..ob.',
    '...opPkkPpo..ob.',
    '..ooppPPppoo.ob.',
    '.oppppPppppsoob.',
    '.opppPPpppoo.ob.',
    '.opppPgpppo..ob.',
    '.oPppPPpppo..ob.',
    '..oppPPpppo..ob.',
    '..oppPPppPo..ob.',
    '..opppPpppo..ob.',
    '.oppppPppppo.o..',
    '.opPppPpppPo....',
    '.oPPPPPPPPPo....',
    '..ooooooooo.....' ],
    alt: [
    '.opPppPpppPo....',
    '..oPPPPPPPo.....' ] },
  // Alquimista: máscara de pico, sombrero de ala ancha y un frasco que brilla
  bomber: { pal: { c: '#4a4250', C: '#2c2630', m: '#d9d2c0', M: '#8f8a7c' }, legs: 3, rows: [
    '....oooooo.....',
    '...oCCCCCCo....',
    '...oCccccCo....',
    '.ooooooooooo...',
    '.occccccccco...',
    '..oooooooooo...',
    '...ommkmmmmoo..',
    '...ommmmmMMMMo.',
    '...oMmmmooooo..',
    '..oooccccoo.ooo',
    '.occocccCocoFfo',
    '.ocoocgcCoosfFo',
    '.oso.ocCCo.offo',
    '..o..occCo..oo.',
    '....occcCCo....',
    '....occoCCo....',
    '....oCooCo.....',
    '...oBBooBBo....',
    '...ooo..ooo....' ],
    alt: [
    '....oCooCo.....',
    '...oBBo.oBo....',
    '...ooo.ooo.....' ] },
  // Ballestero esqueleto: capucha raída, costillas y una ballesta
  sniper: { pal: { c: '#6a3140', C: '#431c26', e: '#ff5d7a' }, legs: 3, rows: [
    '....ooooo......',
    '...occccco.....',
    '..occnnnnco....',
    '..ocnennenoo...',
    '..oCnnkknnco...',
    '...onnnnnoCo...',
    '....onNno.o..o.',
    '..oooNNNoo..obo',
    '.onnonNnoooooIo',
    '.oNoonnnonnbbbo',
    '..o.oNnNooooIo.',
    '....onNno...obo',
    '....oNNNo....o.',
    '....onono......',
    '....onono......',
    '...onNoNno.....',
    '...ooo.ooo.....' ],
    alt: [
    '....onono......',
    '...onNo.ono....',
    '...ooo.oNno....' ] },
  // Chamán: máscara de calavera con cuernos, plumas y un bastón con cascabeles
  shaman: { pal: { c: '#3f8f86', C: '#255a57', e: '#8ff5e2' }, legs: 2, rows: [
    '.o......o.......',
    'ono....ono...o..',
    'onNo..oNno..oeo.',
    '.onNooNno...oeo.',
    '..onnnnno...obo.',
    '..onennenoo..b..',
    '..onnkknno...b..',
    '..oNnnnnNo..ob..',
    '.oorcccgroo.ob..',
    'ovocccccCovsob..',
    'ovocrccCCoo.ob..',
    '.oocccgCCo..ob..',
    '..occcCcCo..ob..',
    '..ocCccCCo..ob..',
    '.occcCccCCo.o...',
    '.oCCCCCCCCo.....',
    '..ooVooVoo......',
    '..oVVooVVo......',
    '..ooo..ooo......' ],
    alt: [
    '..ooVo.oVo......',
    '..oVVo.oVVo.....' ] },
  // El elegido: yelmo cerrado con penacho y tabardo del color de su deidad (m, l)
  champ: { pal: {}, legs: 4, rows: [
    '.......omm.......',
    '....oooomlmo.....',
    '...oiiiiomlmo....',
    '..oiiiwiiomm.....',
    '..oiIIIIIiooo....',
    '..oikkIkkio......',
    '..oiiiIiiio......',
    '..oIiiIiiIo......',
    '.ooooIIIoooo.....',
    'oiiiommmmoiiio...',
    'oiwiomllmoiIio...',
    'oIiIomlmmoIIio...',
    '.oioommmmooio....',
    '.oioGGGGGGoio....',
    '.oso.mmmmo.oso...',
    '..o.ommmmmo.o....',
    '....omMoMmo......',
    '....oiIoIio......',
    '....oiIoIio......',
    '...oIIooIIIo.....',
    '...ooo..oooo.....' ],
    alt: [
    '....oiIoIio......',
    '...oIIo.oiIo.....',
    '...ooo..oIIIo....',
    '........oooo.....' ] },
  // Lancero: esqueleto con capacete y una lanza larga por delante
  lancer: { pal: { e: '#ff5d7a' }, legs: 3, rows: [
    '....ooooo...........',
    '...oiiiiio..........',
    '..oiiwiiiio.........',
    '..oIIIIIIIo.........',
    '..onennenoo.........',
    '..onnkknno..........',
    '...onnnno...........',
    '..ooNNNNooo.......o.',
    '.onnnNnNnnnoooooooio',
    '.onoonnnobbbbbbbbiiw',
    '.oNoonNnooooooooooio',
    '..o.onnno.........o.',
    '....oNNNo...........',
    '....onono...........',
    '....onono...........',
    '...onNoNno..........',
    '...ooo.ooo..........' ],
    alt: [
    '....onono...........',
    '...onNo.ono.........',
    '...ooo.oNno.........' ] },
  // Murciélago: visto desde arriba, con las alas abiertas o recogidas
  bat: { pal: { c: '#6a4f86', C: '#3f2d55', e: '#ff5a4a' }, legs: 7, rows: [
    '.o....o..o....o.',
    'oco..oCooCo..oco',
    'occooCcccccooCco',
    'ocCCcceccecCCcco',
    '.ocCCccccccCCco.',
    '..oooCccccCooo..',
    '.....oCooCo.....' ],
    alt: [
    '................',
    '.....o.oo.o.....',
    '..oooCooooCooo..',
    '.occCceccecCcco.',
    'occCCccccccCCcco',
    'ocooooCccCooooco',
    '.o....oooo....o.' ] },
  // Sabueso: perro de presa de pelo rojizo
  hound: { pal: { c: '#b5652a', C: '#7a3f18', e: '#ffe08a' }, legs: 2, rows: [
    '.........oo.o.',
    'o.......occoco',
    'oo..ooooocceco',
    'ocooccccccccnk',
    '.occccccccCoo.',
    '.occCCcccCo...',
    '.oCooCooCoCo..',
    '.oo.oo.oo.oo..' ],
    alt: [
    '..oCooCooCo...',
    '..oo.oo.oo....' ] },
  // Sombra alzada: la silueta de quien cayó, con dos ojos encendidos
  shade: { pal: { c: '#8e7bd0', C: '#4f4288', e: '#ffffff' }, legs: 0, rows: [
    '....oooo....',
    '...occcco...',
    '..occcccco..',
    '..oceccco..',
    '..occccCo...',
    '.ooccccCoo..',
    'occcccccCCo.',
    'occcccccCCo.',
    'ocCccccCCco.',
    '.occcccCCo..',
    '.occcCcCCo..',
    '..occCcCo...',
    '..oCcoCCo...',
    '...oCo.oCo..',
    '....o...o...' ] },
};
ART.shade.rows[3] = '..oceccceo..';

// ── Pintor de figuras grandes: formas con rampa de tres tonos, luz desde arriba a la izquierda y contorno automático ──
function Painter(w, h) {
  const g = Array.from({ length: h }, () => new Array(w).fill(null));
  const ramp = c => Array.isArray(c) ? c : [tone(c, -0.42), c, tone(c, 0.38)];
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
  const P = {
    g, w, h, put,
    // elipse sombreada
    e(cx, cy, rx, ry, col) {
      const [d, m, l] = ramp(col);
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry, q = nx * nx + ny * ny;
        if (q > 1) continue;
        const sh = nx * 0.55 + ny * 0.85;
        put(x, y, q > 0.72 && sh > 0.15 ? d : sh > 0.5 ? d : sh < -0.45 ? l : m);
      }
      return P;
    },
    // rectángulo sombreado: luz arriba y a la izquierda, sombra abajo y a la derecha
    r(x0, y0, rw, rh, col) {
      const [d, m, l] = ramp(col);
      for (let y = y0; y < y0 + rh; y++) for (let x = x0; x < x0 + rw; x++) put(x, y, y === y0 || (x === x0 && rw > 2) ? l : y === y0 + rh - 1 || (x === x0 + rw - 1 && rw > 2) ? d : m);
      return P;
    },
    // línea gruesa de un tono
    l(x0, y0, x1, y1, col, th = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) put(x + a, y + b, col); }
      return P;
    },
    // triángulo relleno (puntas, cuernos, cristales): luz en la mitad izquierda
    t(x0, y0, x1, y1, x2, y2, col) {
      const [d, m, l] = ramp(col), minX = Math.floor(Math.min(x0, x1, x2)), maxX = Math.ceil(Math.max(x0, x1, x2)), minY = Math.floor(Math.min(y0, y1, y2)), maxY = Math.ceil(Math.max(y0, y1, y2));
      const s = (ax, ay, bx, by, px, py) => (px - ax) * (by - ay) - (py - ay) * (bx - ax), cxm = (x0 + x1 + x2) / 3;
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const a = s(x0, y0, x1, y1, x, y), b = s(x1, y1, x2, y2, x, y), c = s(x2, y2, x0, y0, x, y);
        if ((a >= 0 && b >= 0 && c >= 0) || (a <= 0 && b <= 0 && c <= 0)) put(x, y, x < cxm - 0.5 ? l : x > cxm + 0.8 ? d : m);
      }
      return P;
    },
    // refleja la mitad izquierda sobre la derecha
    mirror() { for (let y = 0; y < h; y++) for (let x = 0; x < w >> 1; x++) g[y][w - 1 - x] = g[y][x]; return P; },
    // contorno oscuro alrededor de todo lo pintado
    outline(col = PAL.o) {
      const add = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== col)) add.push([x, y]);
      for (const [x, y] of add) g[y][x] = col;
      return P;
    },
  };
  return P;
}
const gridOf = (rows, pal) => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => [...r.padEnd(w, '.')].map(ch => pal[ch] || null)); };
function mkSprite(grid) {
  const h = grid.length, w = grid[0].length, c = document.createElement('canvas'), f = document.createElement('canvas');
  c.width = f.width = w; c.height = f.height = h;
  const g = c.getContext('2d');
  grid.forEach((r, y) => r.forEach((col, x) => { if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }));
  const fg = f.getContext('2d'); fg.drawImage(c, 0, 0); fg.globalCompositeOperation = 'source-in'; fg.fillStyle = '#ffffff'; fg.fillRect(0, 0, w, h);   // en blanco, para el destello al recibir un golpe
  return { c, f, w, h };
}
// De una ficha de ART salen dos fotogramas: de pie y con el paso cambiado
function mkArt(a, extra) {
  const pal = Object.assign({}, PAL, a.pal, extra || {}), A = mkSprite(gridOf(a.rows, pal));
  if (a.alt) { const rows = a.rows.slice(0, a.rows.length - a.alt.length).concat(a.alt); A.b = mkSprite(gridOf(rows.map(r => r.padEnd(a.rows[0].length, '.')), pal)); }
  return A;
}

// ── Figuras grandes ──
const BIG = {
  // Ogro: mole de piel parda con colmillos, taparrabos y un garrote con clavos
  brute() {
    const P = Painter(34, 34), skin = ['#5d6b3a', '#8a9a55', '#b3c078'], hide = ['#4a2f1e', '#75492c', '#9a6a42'], wood = ['#3d2718', '#6b4428', '#8f6238'];
    P.e(8, 30, 4, 2.5, skin).e(19, 30, 4, 2.5, skin);                       // pies
    P.r(6, 23, 5, 6, skin).r(17, 23, 5, 6, skin);                           // piernas
    P.e(13.5, 17, 9.5, 8, skin);                                            // tronco
    P.r(6, 20, 16, 5, hide); P.l(8, 25, 10, 27, hide[1], 2); P.l(17, 25, 19, 27, hide[1], 2);   // taparrabos
    P.e(4, 14, 3.6, 4.2, skin).e(23, 14, 3.6, 4.2, skin);                   // hombros
    P.r(1, 16, 5, 8, skin).e(3.5, 25, 3, 3, skin);                          // brazo izquierdo y puño
    P.r(22, 15, 5, 6, skin).e(26, 21, 3, 3, skin);                          // brazo derecho, adelantado
    P.e(13.5, 8, 6, 5.5, skin);                                             // cabeza
    P.r(9, 6, 9, 2, [skin[0], skin[0], skin[0]]);                           // ceño
    P.put(10, 7, '#ffe08a'); P.put(16, 7, '#ffe08a');                       // ojos
    P.r(10, 10, 7, 2, ['#2a1a14', '#2a1a14', '#2a1a14']); P.put(10, 9, PAL.n); P.put(16, 9, PAL.n); P.put(10, 10, PAL.n); P.put(16, 10, PAL.n);   // boca y colmillos
    P.l(25, 22, 31, 6, wood[1], 3); P.e(31, 6, 2.6, 4, wood);               // garrote
    P.put(29, 4, PAL.w); P.put(33, 7, PAL.w); P.put(31, 2, PAL.w); P.put(29, 9, PAL.i);
    return P.outline().g;
  },
  // Araña: vista desde arriba, patas largas y una marca en el lomo
  leaper() {
    const P = Painter(20, 16), body = ['#2a2330', '#463a52', '#6a5a7a'], mark = '#9bd36b';
    for (const [x0, y0, x1, y1, x2, y2] of [[7, 6, 3, 2, 1, 5], [7, 7, 2, 6, 0, 9], [7, 9, 3, 11, 1, 14], [8, 10, 5, 13, 5, 15]]) { P.l(x0, y0, x1, y1, body[1]); P.l(x1, y1, x2, y2, body[1]); }
    P.mirror();
    P.e(9.5, 10, 4, 4.4, body); P.e(9.5, 5, 2.8, 2.6, body);
    P.put(9, 9, mark); P.put(10, 9, mark); P.put(9, 11, mark); P.put(10, 11, mark); P.put(8, 10, mark); P.put(11, 10, mark);
    P.put(8, 4, '#ff5a4a'); P.put(11, 4, '#ff5a4a'); P.put(9, 3, '#ff5a4a'); P.put(10, 3, '#ff5a4a');
    P.put(8, 2, PAL.n); P.put(11, 2, PAL.n);
    return P.outline().g;
  },
  // El Guardián: armadura animada con cuernos, una rendija encendida y un mandoble a cada lado
  guardian() {
    const P = Painter(56, 60), st = ['#4a4a5c', '#77788c', '#b4b6c6'], dk = ['#2b2a38', '#45455a', '#6a6b82'], cl = ['#5c1f2c', '#8a3a55', '#b85a78'], gold = ['#8a5a1e', '#d49a3a', '#ffd98a'];
    P.r(17, 46, 8, 10, dk).r(14, 54, 12, 4, st);                            // pierna y escarpe
    P.t(12, 30, 28, 30, 20, 52, cl);                                        // faldón
    P.e(27.5, 31, 13, 13, st);                                              // peto (se completa al reflejar)
    P.r(22, 38, 6, 3, gold);                                                // cinturón
    P.e(10, 24, 9, 7.5, st).r(4, 22, 12, 2, gold);                          // hombrera
    P.r(5, 30, 8, 12, dk).e(9, 44, 4.5, 4.5, st);                           // brazo y guantelete
    P.r(8, 36, 2, 22, ['#8e96a3', '#cfd6de', '#ffffff']); P.r(5, 46, 8, 2, gold);   // mandoble apoyado en el suelo
    P.e(27.5, 13, 9, 9.5, st);                                              // yelmo
    P.t(19, 9, 21, 3, 11, 0, PAL.n);                                        // cuerno
    P.mirror();
    P.r(22, 12, 12, 2, ['#1a0c08', '#1a0c08', '#1a0c08']); for (let x = 23; x < 33; x += 2) P.put(x, 12, '#ff9a3c'); P.put(27, 13, '#ffe08a'); P.put(28, 13, '#ffe08a');
    P.r(27, 15, 2, 7, dk); P.r(24, 27, 8, 8, cl); P.put(27, 29, gold[2]); P.put(28, 29, gold[2]); P.put(27, 30, gold[1]); P.put(28, 30, gold[1]); P.put(26, 31, gold[1]); P.put(29, 31, gold[1]);
    return P.outline().g;
  },
  // La Matriarca del Nido: araña enorme vista desde arriba, vientre hinchado con calavera pintada
  matriarch() {
    const P = Painter(60, 52), body = ['#2e3a22', '#4f6b34', '#7f9c4c'], leg = ['#1f2618', '#38482a', '#5a7040'], belly = ['#5a2a3a', '#8a3f52', '#c0607a'];
    for (const [x0, y0, x1, y1, x2, y2] of [[22, 20, 10, 8, 4, 16], [21, 23, 7, 18, 1, 28], [21, 27, 6, 30, 2, 42], [23, 30, 12, 40, 10, 50]]) { P.l(x0, y0, x1, y1, leg[1], 2); P.l(x1, y1, x2, y2, leg[1], 2); P.l(x1, y1, x1, y1, leg[2], 2); }
    P.e(29.5, 34, 13, 14, body);                                            // vientre
    P.e(29.5, 17, 9, 8, body);                                              // tórax
    P.t(24, 9, 27, 9, 24, 3, PAL.n);                                        // colmillo
    P.mirror();
    P.t(25, 28, 34, 28, 29.5, 35, belly); P.t(25, 42, 34, 42, 29.5, 35, belly);   // reloj de arena en el lomo
    for (const [x, y] of [[26, 13], [33, 13], [28, 11], [31, 11], [24, 16], [35, 16]]) { P.put(x, y, '#ff5a4a'); }
    P.put(29, 14, '#ffe08a'); P.put(30, 14, '#ffe08a');
    return P.outline().g;
  },
  // El Coloso de Cristal: gólem de roca con cristales en los hombros y un núcleo encendido
  colossus() {
    const P = Painter(66, 66), rk = ['#3a4252', '#5d6a80', '#8e9db5'], rk2 = ['#2a303d', '#465063', '#6a7890'], cr = ['#2e8fa3', '#62d8ec', '#d6faff'];
    P.r(20, 50, 11, 12, rk2).r(17, 60, 15, 4, rk);                          // pierna y pie
    P.e(32.5, 36, 16, 15, rk);                                              // torso
    P.e(12, 27, 10, 9, rk);                                                 // hombro
    P.t(4, 22, 10, 21, 5, 6, cr).t(10, 21, 16, 19, 14, 9, cr).t(15, 20, 20, 20, 20, 13, cr);   // cristales
    P.r(4, 33, 11, 14, rk2).e(9, 51, 7, 6.5, rk);                           // brazo y puño
    P.e(32.5, 16, 8, 7.5, rk);                                              // cabeza
    P.mirror();
    P.r(27, 15, 12, 2, ['#0e1420', '#0e1420', '#0e1420']); P.put(29, 15, cr[2]); P.put(30, 15, cr[1]); P.put(35, 15, cr[2]); P.put(36, 15, cr[1]);
    P.t(32.5, 28, 26, 36, 32.5, 46, cr); P.t(32.5, 28, 39, 36, 32.5, 46, [cr[0], cr[0], cr[1]]);   // núcleo
    P.l(22, 30, 26, 33, rk[0]); P.l(43, 30, 39, 33, rk[0]); P.l(24, 44, 28, 47, rk[0]); P.l(41, 44, 37, 47, rk[0]);   // grietas
    return P.outline().g;
  },
  // El Primer Puño: el dios de la guerra, un coloso de piel curtida con cuernos, coraza de hueso y dos hachas
  firstfist() {
    const P = Painter(72, 70), sk = ['#7a4a2a', '#b07a48', '#d9a066'], bone = ['#8f8a7c', '#d9d2c0', '#f4f0e0'], iron = ['#3a3a48', '#6a6a7c', '#a8a8ba'], hide = ['#3d2718', '#6b4428', '#8f6238'], red = ['#6a1a1a', '#b8382e', '#e8642c'];
    P.e(27, 64, 7, 4, sk); P.r(22, 50, 10, 13, sk);                         // pie y pierna
    P.e(36, 38, 17, 16, sk);                                                // torso (se completa al reflejar)
    P.r(22, 44, 14, 8, hide); P.t(22, 52, 34, 52, 27, 60, red);             // faldón
    P.e(14, 27, 11, 9, bone); P.t(6, 22, 12, 20, 4, 10, bone);              // hombrera de hueso con púa
    P.r(6, 33, 10, 16, sk); P.e(10, 52, 6.5, 6, sk);                        // brazo y puño
    P.r(9, 20, 3, 44, hide); P.t(0, 18, 12, 14, 12, 30, iron); P.t(0, 18, 4, 30, 12, 30, iron);   // hacha
    P.e(36, 14, 9.5, 10, sk);                                               // cabeza
    P.t(27, 10, 30, 6, 18, 0, bone);                                        // cuerno
    P.mirror();
    P.r(29, 11, 14, 3, ['#2a140c', '#2a140c', '#2a140c']); P.put(31, 12, '#ffe08a'); P.put(32, 12, '#ff8a3c'); P.put(39, 12, '#ffe08a'); P.put(40, 12, '#ff8a3c');
    P.r(31, 18, 10, 3, ['#2a140c', '#2a140c', '#2a140c']); P.put(31, 17, bone[2]); P.put(40, 17, bone[2]); P.put(31, 18, bone[1]); P.put(40, 18, bone[1]);
    for (let y = 30; y < 44; y += 4) P.r(30, y, 12, 2, bone);                // costillar de la coraza
    P.r(34, 26, 4, 20, bone);
    return P.outline().g;
  },
  // Estandarte de guerra: un mástil con un pendón rojo y un cráneo
  post() {
    const P = Painter(18, 30), wood = ['#3d2718', '#6b4428', '#8f6238'], red = ['#6a1a1a', '#b8382e', '#e8642c'];
    P.r(8, 4, 2, 24, wood); P.e(9, 28, 5, 2, ['#2a2630', '#4a4552', '#6a6472']);
    P.r(10, 6, 7, 10, red); P.t(10, 16, 17, 16, 13, 21, red);
    P.e(9, 3, 3, 3, [PAL.N, PAL.n, '#ffffff']); P.put(8, 3, PAL.k); P.put(10, 3, PAL.k);
    P.put(12, 9, PAL.k); P.put(14, 9, PAL.k); P.put(13, 11, PAL.k); P.put(12, 12, PAL.k); P.put(14, 12, PAL.k);
    return P.outline().g;
  },
  // La campana de la aldea, en su espadaña de piedra
  keep() {
    const P = Painter(26, 34), st = ['#4a4759', '#77748c', '#a8a5bd'], wood = ['#3d2718', '#6b4428', '#8f6238'], br = ['#8a5a1e', '#d49a3a', '#ffd98a'];
    P.r(3, 26, 20, 7, st); P.r(4, 8, 4, 19, st); P.r(18, 8, 4, 19, st); P.t(2, 9, 24, 9, 13, 0, wood);
    P.r(8, 10, 10, 2, wood); P.e(13, 18, 4.5, 5.5, br); P.r(8, 22, 10, 2, br); P.put(13, 25, br[0]); P.put(12, 25, br[0]);
    return P.outline().g;
  },
  // El Sin Nombre: rey sin rostro, corona de hierro, manto raído y manos de hueso
  nameless() {
    const P = Painter(54, 62), robe = ['#221a30', '#3b2f52', '#5c4c7c'], trim = ['#7a6a9c', '#b8a8d8', '#e8e0f8'], iron = ['#3a3a48', '#6a6a7c', '#a8a8ba'];
    P.t(8, 60, 27, 20, 27, 60, robe); P.t(12, 30, 27, 20, 20, 58, robe);    // manto
    for (let x = 9; x < 27; x += 4) P.t(x, 57, x + 3, 57, x + 1.5, 61, robe);   // jirones
    P.e(27, 30, 11, 12, robe);                                              // pecho
    P.e(14, 26, 7, 5, robe).r(8, 28, 7, 13, robe);                          // hombro y manga
    P.r(9, 41, 5, 3, trim); for (const x of [8, 10, 12, 14]) P.l(x, 44, x - 1, 48, PAL.n);   // mano de hueso
    P.e(27, 13, 8.5, 9, robe);                                              // capucha
    P.r(19, 5, 8, 3, iron); P.t(19, 5, 21, 5, 20, 0, iron); P.t(23, 5, 25, 5, 24, 1, iron);   // corona
    P.mirror();
    P.t(26, 5, 28, 5, 27, -1, iron);
    P.e(27, 15, 5, 6, ['#07050a', '#07050a', '#07050a']); P.put(25, 14, '#ffffff'); P.put(29, 14, '#ffffff'); P.put(25, 15, trim[1]); P.put(29, 15, trim[1]);
    P.r(26, 22, 2, 30, trim); P.r(24, 26, 6, 2, trim);                      // estola
    return P.outline().g;
  },
};

// El arma en la mano: mira a la derecha, con la empuñadura a la izquierda. Se dibuja girada hacia donde apuntas.
const GUNART = {
  b_long:    ['......ooooooooooooo', 'oooooooiiiiiiiiiiwo', 'obbbbbgIIIIIIIIIIIo', 'oBbbBooooooooooooo.', '.oBBo..............', '..oo...............'],
  b_short:   ['....oooooooo', 'ooooiiiiiiwo', 'obbgIIIIIIIo', 'oBbBoooooooo', 'oBBo........', '.oo.........'],
  b_scatter: ['.............ooo', '......oooooooiwo', 'oooooooiiiiiiiIo', 'obbbbbgIIIIIIIIo', 'oBbbBooooooooIIo', '.oBBo........ooo', '..oo............'],
  b_pierce:  ['.......ooooooooooooooo', 'ooooooogiiigiiiigiiiwo', 'obbbbbBgIIIgIIIIgIIIIo', 'oBbbBooooooooooooooooo', '.oBBo.................', '..oo..................'],
  b_bomb:    ['.....ooooooooo.', 'oooooIiiiiiiiwo', 'obbbbIgiiiigiko', 'oBbbBIgIIIIgIko', '.oBBoIIIIIIIIIo', '..oo.ooooooooo.'],
  b_spike:   ['......................oo..', 'ooooooooooooooooooooooiwo.', 'obBbbbbbbbBbbbbbbbbrriiiwo', 'ooooooooooooooooooooooiIo.', '......................oo..'],
  a_draw:    ['........oo.....', '.......onno....', '......ob.ono...', 'oooooooboooIo..', 'obbbbbbbbbbbbwo', 'oBBooooboooIo..', '.oo...ob.ono...', '.......onno....', '........oo.....'],
  a_rotary:  ['......oooooooooooo', 'ooooooiiiiiiiiiiwo', 'obbbbgIIIIIIIIIIIo', 'oBbbBgiiiiiiiiiiwo', '.oBBogIIIIIIIIIIIo', '..oo.ooooooooooooo'],
};
const SPR = { champ: {}, gun: {} };
for (const k of Object.keys(GUNART)) SPR.gun[k] = mkSprite(gridOf(GUNART[k], PAL));
for (const k of Object.keys(ART)) if (k !== 'champ') SPR[k] = mkArt(ART[k]);
for (const k of Object.keys(BIG)) SPR[k] = mkSprite(BIG[k]());
for (const g of GOD_KEYS) SPR.champ[g] = mkArt(ART.champ, { m: GODS[g].color, M: tone(GODS[g].color, -0.4), l: tone(GODS[g].color, 0.5) });

// Dibuja un sprite con los pies en (x, yFeet). flip: mirando a la izquierda. step: fotograma del paso.
function drawSprite(sp, x, yFeet, flip, flash, step) {
  const im = flash ? sp.f : step && sp.b ? sp.b.c : sp.c, dx = Math.round(x - sp.w / 2), dy = Math.round(yFeet - sp.h);
  if (flip) { ctx.save(); ctx.translate(dx + sp.w, dy); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0); ctx.restore(); }
  else ctx.drawImage(im, dx, dy);
}
// El arma: girada hacia donde apuntas, con la culata en la mano. Hacia la izquierda se voltea para no quedar boca abajo.
function drawGun(x, y, ang, kick) {
  const g = S.gun, alias = { b_fork: 'b_scatter', b_harpoon: 'b_pierce', b_flame: 'b_bomb', b_back: 'b_long', b_flail: 'b_short', b_boom: 'b_short', b_nail: 'b_short', b_arc: 'b_pierce', b_far: 'b_pierce', b_swarm: 'b_scatter', b_horn: 'b_scatter', b_drill: 'b_short', b_ghost: 'b_long', b_net: 'b_scatter', b_ends: 'b_pierce', b_blow: 'b_pierce', b_wyrm: 'b_scatter', b_rod: 'b_pierce', b_icicle: 'b_long' }, sp = SPR.gun[g.barrel === 'b_spike' ? 'b_spike' : g.action === 'a_draw' ? 'a_draw' : g.action === 'a_rotary' ? 'a_rotary' : alias[g.barrel] || g.barrel] || SPR.gun.b_long, left = Math.cos(ang) < 0;
  const one = (ox, oy) => { ctx.save(); ctx.translate(Math.round(x + ox), Math.round(y + oy)); ctx.rotate(ang); if (left) ctx.scale(1, -1); ctx.drawImage(sp.c, -3 - kick, -Math.floor(sp.h / 2)); ctx.restore(); };
  if (g.barrel === 'b_twin') { const nx = -Math.sin(ang) * 4, ny = Math.cos(ang) * 4; one(nx, ny); one(-nx, -ny); } else one(0, 0);
}
// ───────────────────────── Dibujo ─────────────────────────
function resize() {
  const w = cv.clientWidth || 1, h = cv.clientHeight || 1, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === view.cssW && h === view.cssH && dpr === view.dpr) return;
  view.cssW = w; view.cssH = h; view.dpr = dpr;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  view.s = Math.max(1, Math.round(Math.sqrt(cv.width * cv.height / T.viewArea)));
  lo.width = Math.ceil(cv.width / view.s); lo.height = Math.ceil(cv.height / view.s);
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

// Textos del mundo: se apuntan aquí y se pintan después de ampliar, a resolución completa
const WTEXT = [];
const wtext = (txt, x, y, size, col, alpha = 1) => WTEXT.push([txt, x, y, size, col, alpha]);
function render() {
  sysTick();
  WTEXT.length = 0;
  renderWorld();
  const k = view.s;
  scr.setTransform(1, 0, 0, 1, 0, 0); scr.imageSmoothingEnabled = false;
  scr.drawImage(lo, 0, 0, lo.width * k, lo.height * k);
  scr.textAlign = 'center';
  for (const [txt, x, y, size, col, alpha] of WTEXT) {
    scr.font = `600 ${Math.round(size * k)}px ${FONT}`; scr.globalAlpha = alpha;
    scr.lineWidth = Math.max(2, k); scr.strokeStyle = '#0b080d'; scr.strokeText(txt, (x - cam.x) * k, (y - cam.y) * k);
    scr.fillStyle = col; scr.fillText(txt, (x - cam.x) * k, (y - cam.y) * k);
  }
  scr.globalAlpha = 1;
  if (S.hurtFx > 0) { scr.fillStyle = C.blood; scr.globalAlpha = S.hurtFx * 0.7; scr.fillRect(0, 0, cv.width, cv.height); scr.globalAlpha = 1; }
  if (touch.joyId !== null) {
    const r = cv.getBoundingClientRect(), d = view.dpr, ox = (touch.ox - r.left) * d, oy = (touch.oy - r.top) * d;
    let dx = (touch.x - touch.ox) * d, dy = (touch.y - touch.oy) * d; const m = Math.hypot(dx, dy), max = 46 * d;
    if (m > max) { dx *= max / m; dy *= max / m; }
    scr.strokeStyle = C.ink; scr.globalAlpha = 0.3; scr.lineWidth = 2 * d; scr.beginPath(); scr.arc(ox, oy, max, 0, Math.PI * 2); scr.stroke();
    scr.fillStyle = C.ink; scr.globalAlpha = 0.45; scr.beginPath(); scr.arc(ox + dx, oy + dy, 20 * d, 0, Math.PI * 2); scr.fill(); scr.globalAlpha = 1;
  }
}
// Luz de antorchas y viñeta: lo último que se pinta del mundo
function lights() {
  const bg = roomBg(), fr = Math.floor(S.t * 9);
  for (const t of bg.torches) {
    if (t.x < cam.x - 60 || t.x > cam.x + view.w + 60 || t.y < cam.y - 60 || t.y > cam.y + view.h + 60) continue;
    const f = (fr + t.x) % 3;
    ctx.fillStyle = '#e8642c'; ctx.fillRect(t.x - 2, t.y - 3, 4, 4); ctx.fillRect(t.x - 1 + (f === 1 ? 1 : f === 2 ? -1 : 0), t.y - 5, 2, 2);
    ctx.fillStyle = '#ffb347'; ctx.fillRect(t.x - 1, t.y - 2, 2, 3); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(t.x - 1 + (f === 2 ? 1 : 0), t.y - 1, 1, 2);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ff9a3c';
    ctx.globalAlpha = 0.05 + 0.012 * f; ctx.beginPath(); ctx.arc(t.x, t.y + 6, 44, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.07; ctx.beginPath(); ctx.arc(t.x, t.y + 4, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(vignette(lo.width, lo.height), 0, 0);
}
function renderWorld() {
  const p = S.p, R = T.room;
  cam.x = Math.round(view.w >= R.w + 64 ? (R.w - view.w) / 2 : clamp(p.x - view.w / 2, -32, R.w - view.w + 32));
  cam.y = Math.round(view.h >= R.h + 64 ? (R.h - view.h) / 2 : clamp(p.y - view.h / 2, -32, R.h - view.h + 32));
  const shx = Math.round((Math.random() - 0.5) * S.shake), shy = Math.round((Math.random() - 0.5) * S.shake);

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0b080d'; ctx.fillRect(0, 0, lo.width, lo.height);
  ctx.setTransform(1, 0, 0, 1, -(cam.x + shx), -(cam.y + shy));
  ctx.drawImage(roomBg().c, -BG_M * CELL, -BG_M * CELL);

  if (S.mode === 'title') { lights(); return; }

  // Trampas de pinchos
  for (const tr of S.traps) {
    ctx.fillStyle = '#16101a'; ctx.fillRect(tr.x + 1, tr.y + 1, tr.w - 2, tr.h - 2);
    ctx.fillStyle = '#3a3540'; ctx.fillRect(tr.x + 2, tr.y + 2, tr.w - 4, tr.h - 4); ctx.fillStyle = '#4a4552'; ctx.fillRect(tr.x + 2, tr.y + 2, tr.w - 4, 1); ctx.fillRect(tr.x + 2, tr.y + 2, 1, tr.h - 4);
    ctx.fillStyle = '#2c2832'; ctx.fillRect(tr.x + 2, tr.y + tr.h / 2, tr.w - 4, 1); ctx.fillRect(tr.x + tr.w / 2, tr.y + 2, 1, tr.h - 4);
    ctx.strokeStyle = tr.state === 1 ? C.blood : '#16101a'; ctx.lineWidth = 1; ctx.strokeRect(tr.x + 1.5, tr.y + 1.5, tr.w - 3, tr.h - 3);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const x = tr.x + 4 + i * 8, y = tr.y + 5 + j * 8;
      if (tr.state === 2) { ctx.fillStyle = '#16101a'; ctx.fillRect(x - 2, y - 5, 4, 7); ctx.fillStyle = PAL.i; ctx.fillRect(x - 1, y - 3, 2, 4); ctx.fillStyle = PAL.w; ctx.fillRect(x - 1, y - 5, 1, 3); ctx.fillStyle = PAL.I; ctx.fillRect(x, y - 1, 1, 2); }
      else if (tr.state === 1) { ctx.fillStyle = PAL.i; ctx.fillRect(x - 1, y - 1 - (Math.floor(S.t * 12) % 2), 2, 2); }
      else { ctx.fillStyle = '#16101a'; ctx.fillRect(x - 1, y - 1, 2, 2); }
    }
  }

  // Alcance
  ctx.beginPath(); ctx.arc(p.x, p.y, rangeOf(), 0, Math.PI * 2);
  ctx.strokeStyle = C.energy; ctx.globalAlpha = S.noTarget > 0 ? 0.55 : 0.13; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

  // Previsualización del disparo cargado: cono, o rayo cortado por las columnas
  if (p.charging) {
    const ratio = clamp(p.charge / T.charge.full, 0, 1), ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir), ok = p.charge >= T.charge.min;
    const CH = S.gun.chamber, mortar = S.plans.has('mortar') && CH === 'c_beam';
    if (CH === 'c_fan' || CH === 'c_blast') {
      const half = CH === 'c_blast' ? 0.6 : 0.85, reach = CH === 'c_blast' ? 130 : 165;
      ctx.fillStyle = C.energy; ctx.globalAlpha = ok ? 0.08 + 0.14 * ratio : 0.04;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, reach, p.chargeDir - half, p.chargeDir + half); ctx.closePath(); ctx.fill();
    } else if (CH === 'c_rain') {
      const tg = S.target && active(S.target) && Math.hypot(I.ax, I.ay) <= 0.35 ? S.target : null;
      const tx = clamp(tg ? tg.x : p.x + ux * 190, 0, T.room.w), ty = clamp(tg ? tg.y : p.y + uy * 190, 0, T.room.h);
      ctx.fillStyle = C.energy; ctx.globalAlpha = ok ? 0.1 + 0.16 * ratio : 0.05; ctx.beginPath(); ctx.arc(tx, ty, 62, 0, Math.PI * 2); ctx.fill();
    } else if (CH === 'c_supp') {
      ctx.strokeStyle = C.energy; ctx.globalAlpha = ok ? 0.25 + 0.4 * ratio : 0.1; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, rangeOf(), 0, Math.PI * 2); ctx.stroke();
    } else if (CH === 'c_dash') {
      ctx.strokeStyle = C.energy; ctx.globalAlpha = ok ? 0.2 + 0.3 * ratio : 0.08; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + ux * 240, p.y + uy * 240); ctx.stroke();
    } else if (lv('dragon_charge') && !mortar) {
      const kk = duoOn('roar') ? 1 + p.fury / 100 : 1;
      ctx.fillStyle = GODS.dragon.color; ctx.globalAlpha = ok ? 0.1 + 0.18 * ratio : 0.05;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, 175 * kk, p.chargeDir - Math.min(1.2, 0.5 * kk), p.chargeDir + Math.min(1.2, 0.5 * kk)); ctx.closePath(); ctx.fill();
    } else {
      const cl = mortar ? 170 : rayClip(p.x, p.y, ux, uy, T.charge.range);
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
  for (const c of S.crystals) {      // cristal clavado en el suelo: una gema de píxeles con su brillo
    const a = Math.min(1, c.life), x = Math.round(c.x), y = Math.round(c.y), col = GODS.stone.color;
    ctx.globalAlpha = 0.22 * a; ctx.fillStyle = col; ctx.fillRect(x - 7, y - 2, 14, 6); ctx.fillRect(x - 5, y - 4, 10, 10);
    ctx.globalAlpha = a; ctx.fillStyle = '#16101a'; ctx.fillRect(x - 3, y - 8, 6, 12); ctx.fillRect(x - 4, y - 5, 8, 7);
    ctx.fillStyle = tone(col, -0.35); ctx.fillRect(x - 2, y - 7, 4, 10); ctx.fillRect(x - 3, y - 4, 6, 5);
    ctx.fillStyle = col; ctx.fillRect(x - 2, y - 7, 2, 9); ctx.fillRect(x - 3, y - 4, 2, 4);
    ctx.fillStyle = '#eafffb'; ctx.fillRect(x - 2, y - 6, 1, 3 + (Math.floor(S.t * 5 + x) % 2));
    ctx.globalAlpha = 1;
  }
  for (const f of S.fields) {   // burbujas de tiempo
    ctx.fillStyle = GODS.time.color; ctx.globalAlpha = 0.1 + 0.05 * Math.sin(S.t * 3); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GODS.time.color; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f.life / f.life0); ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const h of S.hazards) {   // avisos de golpes que caen
    ctx.fillStyle = h.col; ctx.strokeStyle = h.col; ctx.lineWidth = 1.5;
    if (h.done) { ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill(); }
    else { const k = 1 - h.t / h.t0; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.15 + 0.3 * k; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  for (const l of S.lasers) {   // líneas de tiro enemigas
    const ux = Math.cos(l.a), uy = Math.sin(l.a), len = rayClip(l.x, l.y, ux, uy, 700), k = 1 - l.t / l.t0;
    ctx.strokeStyle = C.blood; ctx.globalAlpha = 0.25 + 0.6 * k; ctx.lineWidth = 1 + l.w * k;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + ux * len, l.y + uy * len); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (S.drop) {                      // el arma bendecida, clavada en el suelo y brillando en el color de su deidad
    const d = S.drop, x = Math.round(d.x), y = Math.round(d.y + Math.sin(S.t * 4) * 1.5), col = GODS[d.god].color;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col; ctx.globalAlpha = 0.12 + 0.05 * Math.sin(S.t * 6); ctx.beginPath(); ctx.arc(x, y - 4, 16, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#16101a'; ctx.fillRect(x - 2, y - 15, 4, 16); ctx.fillRect(x - 5, y - 5, 10, 3); ctx.fillRect(x - 2, y - 2, 4, 6);
    ctx.fillStyle = col; ctx.fillRect(x - 1, y - 14, 2, 10); ctx.fillStyle = tone(col, 0.6); ctx.fillRect(x - 1, y - 14, 1, 9);
    ctx.fillStyle = PAL.g; ctx.fillRect(x - 4, y - 4, 8, 1); ctx.fillStyle = PAL.B; ctx.fillRect(x - 1, y - 3, 2, 4); ctx.fillStyle = PAL.g; ctx.fillRect(x - 1, y + 1, 2, 1);
  }

  // Columnas y rifles gemelos
  for (const w of S.wells) {        // pozos: un remolino oscuro que gira hacia dentro
    ctx.fillStyle = '#0b080d'; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GODS.void.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.7;
    for (let i = 0; i < 3; i++) { const rr = w.r * (1 - ((S.t * 0.9 + i / 3) % 1)); ctx.beginPath(); ctx.arc(w.x, w.y, Math.max(2, rr), S.t * 3 + i * 2, S.t * 3 + i * 2 + 4.4); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }
  for (const mn of S.mines) {       // minas: un bulto de hierro con una luz que parpadea
    const x = Math.round(mn.x), y = Math.round(mn.y);
    ctx.fillStyle = '#16101a'; ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillRect(x - 3, y - 4, 6, 8); ctx.fillStyle = PAL.I; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = PAL.i; ctx.fillRect(x - 3, y - 3, 6, 1);
    ctx.fillStyle = Math.floor(S.t * 4 + x) % 2 ? C.blood : '#5a1f24'; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  for (const tu of S.turrets) {
    ctx.strokeStyle = slotColor('basic'); ctx.globalAlpha = Math.min(1, tu.life); ctx.lineWidth = 1.5;
    ctx.strokeRect(tu.x - 4, tu.y - 4, 8, 8); ctx.beginPath(); ctx.arc(tu.x, tu.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tu.life / 3); ctx.stroke(); ctx.globalAlpha = 1;
  }

  if (S.keep) {                      // la campana de la aldea
    const k = S.keep; ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(k.x, k.y + 14, 15, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawSprite(SPR.keep, k.x, k.y + 16, false, k.flash > 0);
    ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.25; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(k.x, k.y, 26, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  for (const m of S.mirrors) { ctx.globalAlpha = 0.5 + 0.1 * Math.sin(S.t * 7); drawSprite(SPR.player, m.x, m.y + 8, S.target ? S.target.x < m.x : false, true); ctx.globalAlpha = 0.6; drawSprite(SPR.player, m.x, m.y + 8, S.target ? S.target.x < m.x : false, false); ctx.globalAlpha = 1; }
  for (const pt of S.pets) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 4, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; drawSprite(SPR.hound, pt.x, pt.y + 5, pt.dir < 0, false, Math.floor(S.t * 10) % 2 === 1); }
  // Sombras
  for (const s of S.shades) {
    ctx.fillStyle = GODS.shade.color; ctx.globalAlpha = Math.min(0.85, 0.3 + s.life * 0.4);
    drawSprite(SPR.shade, s.x, s.y + 7 + Math.sin(S.t * 5 + s.x) * 0.8, false, false); ctx.globalAlpha = 1;
  }

  // Enemigos
  for (const e of S.enemies) {
    if (e.spawn > 0) {
      // aparición: un círculo de invocación que se cierra y columnas de humo
      const k = clamp(e.spawn / 0.65, 0, 1), x = Math.round(e.x), y = Math.round(e.y + e.r);
      ctx.fillStyle = e.color; ctx.globalAlpha = 0.25 + 0.4 * (1 - k); ctx.beginPath(); ctx.ellipse(x, y, e.r + 3 + 8 * k, (e.r + 3 + 8 * k) * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; for (let i = 0; i < 4; i++) { const px = x - e.r + ((i * 7 + Math.floor(S.t * 10)) % (e.r * 2 + 1)); ctx.fillRect(px, y - Math.round((1 - k) * (e.r * 2 + 4)) - (i % 2) * 3, 1, 3 + (i % 3)); }
      ctx.globalAlpha = 1; continue;
    }
    if (e.elite) {   // aura de élite: veloz (dorada), recio (acero) o volátil (naranja que late)
      const col = e.elite === 'fast' ? '#f2c14e' : e.elite === 'tough' ? '#cfd6de' : '#ff8a3c', y = Math.round(e.y + e.r), x = Math.round(e.x), rr = e.r + 3 + (e.elite === 'volatile' ? Math.floor(S.t * 6) % 2 : 0);
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = col; ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1;
      for (let i = 0; i < 2; i++) ctx.fillRect(x - rr + ((Math.floor(S.t * 14) + i * 9) % (rr * 2)), y - 3 - ((Math.floor(S.t * 10) + i * 5) % 9), 1, 2);
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
    { // cuerpo: sprite de su tipo (el del elegido lleva el color de su deidad), con sombra en el suelo y un leve balanceo al andar
      const key = Object.keys(TYPES).find(k => TYPES[k] === e.type), sp = e.champ ? SPR.champ[e.god] : SPR[key];
      const air = e.leapT > 0 || (e.boss && e.act === 'leap') ? 10 * Math.sin(Math.PI * (1 - Math.max(0, e.boss ? e.at / 0.9 : e.leapT / 0.7))) : 0;
      ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.95, e.r * 0.95, e.r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      const step = e.stun <= 0 && active(e) && Math.floor(S.t * (e.type.speed > 80 ? 11 : 6) + e.x * 0.13) % 2 === 1;
      if (sp) drawSprite(sp, e.x, e.y + e.r + (e.boss ? 3 : 1) - air - (step && !sp.b ? 1 : 0), Math.cos(e.dir) < 0, e.flash > 0, step);
      else { shapePath(e.type.shape, e.x, e.y, e.r, e.dir); ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color; ctx.fill(); }
    }
    if (e.champ) { // la espada bendecida que lleva, en el color de su deidad
      ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.rotate(e.dir);
      ctx.fillStyle = '#16101a'; ctx.fillRect(3, -2, e.r + 9, 4); ctx.fillRect(5, -4, 3, 8);
      ctx.fillStyle = e.color; ctx.fillRect(8, -1, e.r + 3, 2); ctx.fillStyle = tone(e.color, 0.6); ctx.fillRect(8, -1, e.r + 3, 1);
      ctx.fillStyle = PAL.g; ctx.fillRect(6, -3, 1, 6); ctx.fillStyle = PAL.B; ctx.fillRect(4, -1, 2, 2);
      ctx.restore();
    }
    // Lo acumulado: Ascuas a la izquierda, Veneno a la derecha, sazón arriba, aturdido en blanco
    if (e.ember > 0) { ctx.strokeStyle = GODS.dragon.color; ctx.lineWidth = 0.8 + Math.min(3, 0.3 * e.ember); ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); wtext(String(e.ember), e.x - e.r - 6, e.y + 3, 7, GODS.dragon.color); }
    if (e.venom > 0) { wtext(String(e.venom), e.x + e.r + 6, e.y + 3, 7, GODS.venom.color); }
    if (e.needles > 0) { ctx.fillStyle = GODS.storm.color; for (let i = 0; i < e.needles; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; ctx.fillRect(e.x + Math.cos(a) * (e.r + 4) - 1, e.y + Math.sin(a) * (e.r + 4) - 1, 2.2, 2.2); } }
    if (e.wet > 0) { ctx.fillStyle = GODS.tide.color; for (let i = 0; i < 3; i++) { const a = S.t * 3 + i * 2.1; ctx.fillRect(Math.round(e.x + Math.cos(a) * (e.r + 2)), Math.round(e.y + e.r - 2 + ((S.t * 9 + i * 3) % 5)), 1, 2); } }
    if (e.root > 0) { ctx.fillStyle = GODS.wood.color; for (let i = -1; i <= 1; i++) { ctx.fillRect(Math.round(e.x + i * (e.r * 0.7)) - 1, Math.round(e.y + e.r - 3), 2, 4); ctx.fillRect(Math.round(e.x + i * (e.r * 0.7)) + (i || 1), Math.round(e.y + e.r - 5), 1, 3); } }
    if (e.seed > 0) { ctx.fillStyle = GODS.wood.color; for (let i = 0; i < e.seed; i++) ctx.fillRect(Math.round(e.x - e.seed * 1.5 + i * 3), Math.round(e.y - e.r - 11), 2, 2); }
    if (e.lit > 0) { ctx.fillStyle = GODS.light.color; const y0 = Math.round(e.y - e.r * 1.7 - 5), x0 = Math.round(e.x); ctx.fillRect(x0 - 1, y0 - 2, 2, 5); ctx.fillRect(x0 - 2, y0 - 1, 5, 2); ctx.globalAlpha = 0.5; ctx.fillRect(x0 - 3, y0, 7, 1); ctx.fillRect(x0, y0 - 3, 1, 7); ctx.globalAlpha = 1; }
    if (e.sleep > 0) wtext('z', e.x + e.r + 3 + Math.sin(S.t * 3) * 2, e.y - e.r - 2 - ((S.t * 6) % 6), 8, GODS.dream.color);
    if (e.frozen > 0) { ctx.fillStyle = GODS.frost.color; ctx.globalAlpha = 0.45; ctx.fillRect(Math.round(e.x - e.r - 1), Math.round(e.y - e.r * 1.6), e.r * 2 + 2, Math.round(e.r * 2.7)); ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(e.x - e.r), Math.round(e.y - e.r * 1.5), 2, 1); ctx.fillRect(Math.round(e.x + e.r - 2), Math.round(e.y), 1, 2); }
    else if (e.frost > 0) { ctx.fillStyle = GODS.frost.color; for (let i = 0; i < e.frost; i++) ctx.fillRect(Math.round(e.x - e.frost * 1.5 + i * 3), Math.round(e.y + e.r + 5), 2, 2); }
    if (e.bleed > 0) { ctx.fillStyle = GODS.blood.color; for (let i = 0; i < Math.min(3, e.bleed); i++) ctx.fillRect(Math.round(e.x - 3 + i * 3), Math.round(e.y + e.r - 1 + ((S.t * 8 + i * 2) % 4)), 1, 2); }
    if (e.doom) { const k = clamp(e.doom.t / 5, 0, 1); ctx.fillStyle = '#16101a'; ctx.fillRect(Math.round(e.x) - 5, Math.round(e.y - e.r - 15), 10, 3); ctx.fillStyle = GODS.end.color; ctx.fillRect(Math.round(e.x) - 4, Math.round(e.y - e.r - 14), Math.round(8 * k), 1); }
    if (e.traced > 0) { ctx.strokeStyle = C.energy; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(e.x), Math.round(e.y - 1), e.r + 3, 0, Math.PI * 2); ctx.stroke(); }
    if (e.nails > 0) { ctx.fillStyle = PAL.i; for (let i = 0; i < e.nails; i++) ctx.fillRect(Math.round(e.x - 4 + i * 3), Math.round(e.y - e.r - 5), 1, 3); }
    if (e.mark > 0) { ctx.strokeStyle = GODS.shade.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e.x - 3, e.y + e.r + 4); ctx.lineTo(e.x + 3, e.y + e.r + 4); ctx.moveTo(e.x, e.y + e.r + 2); ctx.lineTo(e.x, e.y + e.r + 8); ctx.stroke(); }
    if (e.slowT > 0) { ctx.strokeStyle = GODS.time.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7, 0, Math.PI * 2 * (1 - e.slowF)); ctx.stroke(); }
    if (e.stun > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.setLineDash([1.5, 2.5]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5, S.t * 6, S.t * 6 + Math.PI * 1.6); ctx.stroke(); ctx.setLineDash([]); }
    if (e.hp < e.maxHp) {
      const w = e.r * 2 + 4; ctx.fillStyle = C.wall; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w, 2.5);
      ctx.fillStyle = C.ink; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w * clamp(e.hp / e.maxHp, 0, 1), 2.5);
    }
  }

  // Marca de objetivo
  const tg = S.target && active(S.target) ? S.target : null;
  if (tg) {
    // cuatro esquinas de píxel alrededor del objetivo; doradas, y rojizas si está fijado
    const locked = S.lock === tg, r = Math.round(tg.r + 5 + (Math.floor(S.t * 4) % 2)), x = Math.round(tg.x), y = Math.round(tg.y - 2);
    ctx.fillStyle = locked ? C.ember : C.energy;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = x + sx * r, cy = y + sy * r; ctx.fillRect(Math.min(cx, cx - sx * 3), cy, 4, 1); ctx.fillRect(cx, Math.min(cy, cy - sy * 3), 1, 4); }
  }

  // Proyectiles enemigos
  for (const sh of S.shots) {
    const x = Math.round(sh.x), y = Math.round(sh.y), r = Math.max(2, Math.round(sh.r)), tw = Math.floor(S.t * 12 + x) % 2;
    ctx.fillStyle = C.arcane; ctx.globalAlpha = 0.28; ctx.fillRect(x - r - 2, y - r, r * 2 + 4, r * 2); ctx.fillRect(x - r, y - r - 2, r * 2, r * 2 + 4);
    ctx.globalAlpha = 1; ctx.fillStyle = '#16101a'; ctx.fillRect(x - r, y - r + 1, r * 2, r * 2 - 2); ctx.fillRect(x - r + 1, y - r, r * 2 - 2, r * 2);
    ctx.fillStyle = C.arcane; ctx.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
    ctx.fillStyle = '#f0e4ff'; ctx.fillRect(x - 1 + tw, y - 1, 2 - tw, 2 - tw);
  }

  // Efectos bajo el jugador
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'ghost') { ctx.fillStyle = C.ember; ctx.globalAlpha = 0.35 * k; ctx.beginPath(); ctx.arc(f.x, f.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    else if (f.k === 'clock') { ctx.strokeStyle = GODS.time.color; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); }
    else if (f.k === 'cone') { ctx.fillStyle = f.col; ctx.globalAlpha = 0.45 * k; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r * (1 - 0.3 * k), f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // Jugador
  const flying = p.dodgeT > 0 && p.fly, pr = flying ? p.r * 1.35 : p.r, py = flying ? p.y - 5 : p.y;
  if (flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x, p.y + 4, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (p.fury > 0) { ctx.strokeStyle = GODS.orc.color; ctx.globalAlpha = 0.25 + 0.5 * p.fury / 100; ctx.lineWidth = 1 + 2.5 * p.fury / 100; ctx.beginPath(); ctx.arc(p.x, py, pr + 2, 0, Math.PI * 2 * p.fury / 100); ctx.stroke(); ctx.globalAlpha = 1; }
  const blink = p.inv > 0 && p.dodgeT <= 0 && Math.floor(S.t * 30) % 2 === 0;
  if (!blink) {
    const fx = Math.cos(p.face), fy = Math.sin(p.face), glow = p.windup > 0 || p.charging || (p.drawing && p.draw >= 1);
    if (!flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r, p.r * 0.95, p.r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    drawSprite(SPR.player, p.x, py + p.r + 1, fx < 0, false, Math.hypot(I.mx, I.my) > 0.2 && Math.floor(S.t * 9) % 2 === 1);
    const kick = p.cd > 0 && p.windup <= 0 ? Math.round(3 * clamp((p.cd - periodOf() + 0.09) / 0.09, 0, 1)) : 0;   // culatazo del retroceso
    drawGun(p.x, py + 1, p.face, kick);
    if (glow) { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(p.x + fx * 17) - 1, Math.round(py + 1 + fy * 17) - 1, 2, 2); }
  }
  // Anillo de ritmo: se llena mientras recarga; brilla cuando puedes disparar
  const period = periodOf(), a0 = -Math.PI / 2;
  if (p.heat > 0.02) { ctx.strokeStyle = p.over > 0 ? '#ffffff' : C.blood; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8.5, a0, a0 + Math.PI * 2 * p.heat); ctx.stroke(); }
  if (S.gun.action === 'a_rotary') { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.35 + 0.5 * p.spin; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, S.t * 14 * p.spin, S.t * 14 * p.spin + Math.PI * 1.4); ctx.stroke(); ctx.globalAlpha = 1; }
  else if (p.drawing && S.gun.action === 'a_hold') { const n = 1 + Math.floor(p.draw * 2 + 0.001); for (let i = 0; i < 3; i++) { ctx.fillStyle = i < n ? C.ember : C.edge; ctx.fillRect(Math.round(p.x) - 6 + i * 5, Math.round(p.y - p.r - 13), 3, 5); } }
  else if (p.drawing) { ctx.strokeStyle = p.draw >= 1 ? '#ffffff' : C.ember; ctx.lineWidth = p.draw >= 1 ? 2.6 : 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * p.draw); ctx.stroke(); }
  else if (p.windup > 0) { ctx.strokeStyle = C.ember; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * (1 - p.windup / p.windupTotal)); ctx.stroke(); }
  else if (p.cd > 0) { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * clamp(1 - p.cd / period, 0, 1)); ctx.stroke(); ctx.globalAlpha = 1; }
  else { ctx.strokeStyle = C.energy; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2); ctx.stroke(); }
  if (S.gun.barrel === 'b_flail' && p.orbAway <= 0) {   // la bola del mangual y su cadena
    const bx = Math.round(p.x + Math.cos(p.orbA) * 34), by = Math.round(p.y + Math.sin(p.orbA) * 34);
    ctx.fillStyle = PAL.I; for (let i = 1; i < 5; i++) ctx.fillRect(Math.round(p.x + (bx - p.x) * i / 5), Math.round(p.y + (by - p.y) * i / 5), 1, 1);
    ctx.fillStyle = '#16101a'; ctx.fillRect(bx - 4, by - 3, 8, 6); ctx.fillRect(bx - 3, by - 4, 6, 8); ctx.fillStyle = PAL.I; ctx.fillRect(bx - 3, by - 3, 6, 6); ctx.fillStyle = PAL.w; ctx.fillRect(bx - 2, by - 3, 2, 2);
    ctx.fillStyle = PAL.i; ctx.fillRect(bx - 5, by, 1, 1); ctx.fillRect(bx + 4, by - 1, 1, 1); ctx.fillRect(bx, by - 5, 1, 1); ctx.fillRect(bx - 1, by + 4, 1, 1);
  }
  if (S.gun.stock === 's_shield' && p.wardCd <= 0) { const a = S.t * 2.4, sx = Math.round(p.x + Math.cos(a) * 13), sy = Math.round(p.y - 2 + Math.sin(a) * 7); ctx.fillStyle = '#16101a'; ctx.fillRect(sx - 3, sy - 4, 6, 8); ctx.fillStyle = PAL.i; ctx.fillRect(sx - 2, sy - 3, 4, 6); ctx.fillStyle = PAL.g; ctx.fillRect(sx - 1, sy - 1, 2, 2); }
  if (p.temper > 0) { const n = Math.min(15, p.temper); for (let i = 0; i < n; i++) { ctx.fillStyle = p.redhot > 0 ? '#ffe08a' : GODS.forge.color; ctx.fillRect(Math.round(p.x) - n + i * 2, Math.round(p.y + p.r + 18), 1, 2); } }
  if (S.gun.mag === 'm_last') for (let i = 0; i < 6; i++) { ctx.fillStyle = i < 6 - (p.clip || 0) ? (i === 0 ? C.ember : C.ink) : C.edge; ctx.fillRect(Math.round(p.x) - 9 + (5 - i) * 3, Math.round(p.y - p.r - 12), 2, 4); }
  if (S.gun.action === 'a_over') { ctx.fillStyle = p.overT >= 10 ? C.ember : C.edge; ctx.fillRect(Math.round(p.x) - 5, Math.round(p.y + p.r + 14), Math.round(10 * p.overT / 10), 2); }
  if (S.gun.action === 'a_pend' && p.pend > 0) for (let i = 0; i < p.pend; i++) { ctx.fillStyle = C.ember; ctx.fillRect(Math.round(p.x) - p.pend * 2 + i * 4, Math.round(p.y + p.r + 14), 2, 2); }
  if (S.gun.mag === 'm_drum') for (let i = 0; i < 2; i++) { ctx.fillStyle = i < p.shells && !(p.cd > 0.3 && p.shells === 2) ? C.ember : C.edge; ctx.fillRect(p.x - 5 + i * 6, p.y - p.r - 12, 4, 5); }
  const dm = dodgeMax();
  if (dm > 1) for (let i = 0; i < dm; i++) { ctx.fillStyle = i < p.dodgeN ? C.ink : C.edge; ctx.fillRect(p.x - dm * 2.5 + i * 5, p.y + p.r + 10, 3, 3); }
  if (p.reserve > 0.5) { ctx.strokeStyle = GODS.feast.color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 11, a0, a0 + Math.PI * 2 * Math.min(1, p.reserve / resMax())); ctx.stroke(); }
  if (p.chargeCd > 0) { ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8.5, a0, a0 + Math.PI * 2 * (1 - p.chargeCd / p.chargeCdMax)); ctx.stroke(); ctx.globalAlpha = 1; }

  // Efectos sobre todo
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'tracer') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k; ctx.lineWidth = (2.2 * k + 0.6) * (f.w || 1); ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
    else if (f.k === 'ring') { ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 3 * k + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - 0.6 * k), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = f.col; ctx.globalAlpha = 0.18 * k; ctx.fill(); }
    else if (f.k === 'beam') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k * 0.5; ctx.lineWidth = f.w * 3 * k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = k; ctx.lineWidth = f.w * k; ctx.stroke(); }
    else if (f.k === 'lob') { const u = f.t / f.life, x = f.x1 + (f.x2 - f.x1) * u, y = f.y1 + (f.y2 - f.y1) * u - Math.sin(u * Math.PI) * 26; const gx = Math.round(f.x1 + (f.x2 - f.x1) * u), gy = Math.round(f.y1 + (f.y2 - f.y1) * u); ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.fillRect(gx - 3, gy - 1, 6, 2); ctx.globalAlpha = 1; ctx.fillStyle = '#16101a'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 4); ctx.fillRect(Math.round(x) - 2, Math.round(y) - 3, 4, 6); ctx.fillStyle = f.col; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 1, 1); }
    else if (f.k === 'smoke') { const sz = k > 0.6 ? 2 : 3; ctx.fillStyle = k > 0.5 ? '#b9b3ad' : '#7d7780'; ctx.globalAlpha = 0.55 * k; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, sz, sz); }
    else if (f.k === 'flash') { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 1, 4, 2); ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 2, 2, 4); ctx.fillStyle = '#ff8a3c'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y), 1, 1); ctx.fillRect(Math.round(f.x) + 2, Math.round(f.y) - 1, 1, 1); }
    else if (f.k === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = k; ctx.fillRect(f.x - 1, f.y - 1, 2, 2); }
    else if (f.k === 'num') wtext(f.txt, f.x, f.y, f.big ? 12 : 8, f.col || (f.big ? C.ember : C.ink), Math.min(1, k * 2));
    ctx.globalAlpha = 1;
  }

  lights();
  // Flechas en el borde de la pantalla hacia lo que importa y no se ve: estandartes, la campana, el arma caída
  ctx.setTransform(1, 0, 0, 1, -cam.x, -cam.y);
  const pointer = (x, y, col) => {
    if (x > cam.x + 6 && x < cam.x + view.w - 6 && y > cam.y + 6 && y < cam.y + view.h - 6) return;
    const px = Math.round(clamp(x, cam.x + 12, cam.x + view.w - 12)), py = Math.round(clamp(y, cam.y + 34, cam.y + view.h - 16)), a = Math.atan2(y - py, x - px), b = Math.floor(S.t * 4) % 2;
    ctx.save(); ctx.translate(px, py); ctx.rotate(a);
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.moveTo(8 + b, 0); ctx.lineTo(-4, -6); ctx.lineTo(-4, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(6 + b, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  for (const e of S.enemies) if (e.type.post) pointer(e.x, e.y, C.blood);
  if (S.keep) pointer(S.keep.x, S.keep.y, C.energy);
  if (S.drop) pointer(S.drop.x, S.drop.y, GODS[S.drop.god].color);
  if (S.mission && S.mission.type !== 'assault' && !S.keep) { const all = S.enemies.filter(e => active(e)); if (all.length && all.length <= 2 && !S.queue.length) for (const e of all) pointer(e.x, e.y, C.ink); }   // los dos últimos enemigos, para no buscarlos
}
// ───────────────────────── La sala dibujada: losas, muros de sillería y antorchas ─────────────────────────
// Se pinta una sola vez por sala en un lienzo aparte (con un margen de muro alrededor) y luego se copia cada fotograma.
const WPAL = [
  { f: ['#2c2b38', '#32313f', '#282733'], j: '#1c1b25', cap: '#42405a', capHi: '#5f5c7c', capLo: '#2a2939', br: ['#4b485d', '#5a5770'], brHi: '#6f6c88', mo: '#201e2a', deco: 'bones' },      // Las Criptas: piedra fría
  { f: ['#2b3026', '#31372b', '#262b22'], j: '#1a1e17', cap: '#3d4a33', capHi: '#5a6c48', capLo: '#273021', br: ['#4a4a3a', '#575846'], brHi: '#6e7058', mo: '#1c1f18', deco: 'moss' },       // El Nido: piedra con musgo
  { f: ['#252b3a', '#2a3142', '#212634'], j: '#171b27', cap: '#37435c', capHi: '#52628a', capLo: '#232b3d', br: ['#3f4a63', '#4a5772'], brHi: '#62719a', mo: '#191e2b', deco: 'shards' },     // Las Minas: pizarra azul
  { f: ['#33232b', '#3a2831', '#2c1f26'], j: '#1f151a', cap: '#4a2f3e', capHi: '#6e4558', capLo: '#2f1e28', br: ['#523645', '#5f3f50'], brHi: '#7a5468', mo: '#1d1218', deco: 'runes' },      // El Umbral: piedra sangrienta
];
const BG_M = 3;   // casillas de margen alrededor de la sala
let ROOM_BG = null;
function roomBg() {
  if (ROOM_BG && ROOM_BG.walls === S.walls && ROOM_BG.world === S.world) return ROOM_BG;
  const c = NAV.cols, r = NAV.rows, W = WPAL[clamp((S.world || 1) - 1, 0, 3)], cvs = document.createElement('canvas'), g = cvs.getContext('2d');
  cvs.width = (c + BG_M * 2) * CELL; cvs.height = (r + BG_M * 2) * CELL;
  const wallAt = (x, y) => x < 0 || y < 0 || x >= c || y >= r || NAV.wall[y * c + x] === 1;
  const inside = (x, y) => x >= -BG_M && y >= -BG_M && x < c + BG_M && y < r + BG_M;
  const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647 + (S.world || 1) * 9781) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const px = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  g.fillStyle = '#0b080d'; g.fillRect(0, 0, cvs.width, cvs.height);
  g.translate(BG_M * CELL, BG_M * CELL);
  // Suelo: losas a tresbolillo, cada una con su tono, juntas oscuras y desgaste
  for (let ty = 0; ty < r; ty++) for (let sx = -1; sx <= c; sx++) {
    const x0 = sx * CELL + (ty % 2 ? 8 : 0), y0 = ty * CELL, h = hash(sx, ty);
    px(x0, y0, W.f[Math.floor(h * 3)], CELL, CELL);
    px(x0, y0, W.j, CELL, 1); px(x0, y0, W.j, 1, CELL);
    px(x0 + 1, y0 + 1, tone(W.f[1], 0.07), CELL - 2, 1);
    for (let i = 0; i < 3; i++) px(x0 + 2 + Math.floor(hash(sx, ty, i + 1) * 12), y0 + 2 + Math.floor(hash(sx, ty, i + 5) * 12), tone(W.f[1], hash(sx, ty, i + 9) < 0.5 ? -0.2 : 0.1));
    if (h > 0.9) { let cx = x0 + 3 + Math.floor(hash(sx, ty, 20) * 6), cy = y0 + 3; for (let i = 0; i < 8; i++) { px(cx, cy, W.j); cy++; if (hash(sx, ty, 30 + i) < 0.5) cx += hash(sx, ty, 40 + i) < 0.5 ? 1 : -1; } }   // grieta
  }
  // Manchas grandes de humedad y desgaste, para que el suelo no sea uniforme
  for (let i = 0; i < Math.floor(c * r / 28); i++) { g.fillStyle = hash(i, 3, 5) < 0.6 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.025)'; const bw = 24 + Math.floor(hash(i, 1, 1) * 72), bh = 16 + Math.floor(hash(i, 2, 2) * 56); g.fillRect(Math.floor(hash(i, 7, 3) * c * CELL), Math.floor(hash(i, 9, 4) * r * CELL), bw, bh); g.fillRect(Math.floor(hash(i, 7, 3) * c * CELL) + 6, Math.floor(hash(i, 9, 4) * r * CELL) - 5, bw - 14, bh + 10); }
  // Adornos del suelo, según el mundo
  for (let y = 1; y < r - 1; y++) for (let x = 1; x < c - 1; x++) {
    if (wallAt(x, y) || hash(x, y, 77) > 0.014) continue;
    const X = x * CELL + 4, Y = y * CELL + 5;
    if (W.deco === 'bones') { px(X, Y + 2, '#7d7868', 7, 1); px(X, Y + 1, '#9a9482', 1, 3); px(X + 6, Y + 1, '#9a9482', 1, 3); if (hash(x, y, 78) < 0.4) { px(X + 1, Y - 3, '#9a9482', 4, 3); px(X + 2, Y - 2, '#1c1b25'); px(X + 4, Y - 2, '#1c1b25'); px(X + 2, Y, '#7d7868', 2, 1); } }
    else if (W.deco === 'moss') { for (let i = 0; i < 9; i++) px(X + Math.floor(hash(x, y, i) * 8), Y + Math.floor(hash(x, y, i + 10) * 6), i % 3 ? '#4f6b34' : '#7f9c4c'); }
    else if (W.deco === 'shards') { px(X + 2, Y, '#62d8ec', 1, 4); px(X + 3, Y + 1, '#2e8fa3', 1, 3); px(X + 5, Y + 2, '#62d8ec', 1, 2); px(X + 1, Y + 3, '#d6faff'); }
    else { g.fillStyle = '#6e2f3a'; g.fillRect(X, Y, 7, 1); g.fillRect(X + 3, Y - 2, 1, 6); g.fillRect(X + 1, Y + 3, 5, 1); }
  }
  // Muros. Si debajo hay suelo se ve la cara de sillares; si no, solo la coronación.
  const torches = [];
  for (let y = -BG_M; y < r + BG_M; y++) for (let x = -BG_M; x < c + BG_M; x++) {
    if (!wallAt(x, y)) continue;
    const X = x * CELL, Y = y * CELL, face = inside(x, y + 1) && !wallAt(x, y + 1) && y + 1 < r;
    const deep = wallAt(x - 1, y) && wallAt(x + 1, y) && wallAt(x, y - 1) && wallAt(x, y + 1) && wallAt(x - 1, y - 1) && wallAt(x + 1, y - 1) && wallAt(x - 1, y + 1) && wallAt(x + 1, y + 1);
    if (deep && (x < -1 || y < -1 || x > c || y > r)) { px(X, Y, '#0b080d', CELL, CELL); continue; }   // muy fuera de la sala: negro
    px(X, Y, W.cap, CELL, CELL);
    for (let i = 0; i < 4; i++) px(X + 1 + Math.floor(hash(x, y, i) * 14), Y + 1 + Math.floor(hash(x, y, i + 4) * (face ? 3 : 14)), i % 2 ? W.capLo : W.capHi);
    if (hash(x, y, 9) < 0.5) px(X + (hash(x, y, 10) < 0.5 ? 0 : 8), Y, W.capLo, 1, face ? 5 : CELL);   // junta entre losas de la coronación
    if (!wallAt(x, y - 1) || y - 1 < 0 && false) px(X, Y, W.capHi, CELL, 1);
    if (!wallAt(x - 1, y)) px(X, Y, W.capHi, 1, CELL);
    if (!wallAt(x + 1, y)) px(X + CELL - 1, Y, W.capLo, 1, CELL);
    if (face) {
      px(X, Y + 4, W.capLo, CELL, 1);
      for (let row = 0; row < 2; row++) {
        const by = Y + 5 + row * 5, off = (row + y) % 2 ? 4 : 0;
        px(X, by, W.mo, CELL, 5);
        for (let bx = -8 + off; bx < CELL; bx += 8) {
          const x0 = Math.max(0, bx), x1 = Math.min(CELL, bx + 7); if (x1 <= x0) continue;
          const col = W.br[hash(x * 2 + Math.floor((bx + 8) / 8), y * 2 + row, 3) < 0.5 ? 0 : 1];
          px(X + x0, by + 1, col, x1 - x0, 4); px(X + x0, by + 1, W.brHi, x1 - x0, 1);
        }
      }
      px(X, Y + 15, W.mo, CELL, 1);
      if (W.deco === 'moss' && hash(x, y, 50) < 0.35) for (let i = 0; i < 6; i++) px(X + Math.floor(hash(x, y, 51 + i) * 15), Y + 5 + Math.floor(hash(x, y, 60 + i) * 5), '#4f6b34', 1, 2);
      if (W.deco === 'shards' && hash(x, y, 50) < 0.12) { px(X + 6, Y + 9, '#62d8ec', 2, 4); px(X + 7, Y + 8, '#d6faff', 1, 2); }
      // sombra que el muro echa sobre el suelo
      g.fillStyle = 'rgba(0,0,0,0.38)'; g.fillRect(X, Y + CELL, CELL, 2); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(X, Y + CELL + 2, CELL, 3);
      if (((x % 5) + 5) % 5 === 2 && hash(x, y, 90) < 0.75 && !wallAt(x, y + 2)) { torches.push({ x: X + 8, y: Y + 6 }); px(X + 7, Y + 8, PAL.B, 2, 5); px(X + 6, Y + 8, PAL.G, 4, 1); }
    }
  }
  return (ROOM_BG = { c: cvs, walls: S.walls, world: S.world, torches });
}
// Viñeta: oscurece los bordes de la pantalla, como una mazmorra iluminada desde el centro
let VIG = null;
function vignette(w, h) {
  if (VIG && VIG.width === w && VIG.height === h) return VIG;
  VIG = document.createElement('canvas'); VIG.width = w; VIG.height = h;
  const g = VIG.getContext('2d'), gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  gr.addColorStop(0, 'rgba(8,5,12,0)'); gr.addColorStop(1, 'rgba(8,5,12,0.62)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  return VIG;
}
// Lo que queda de un enemigo: una mancha en el suelo y algún hueso, pintados sobre el fondo de la sala para que se queden ahí
function stain(e) {
  const bg = ROOM_BG; if (!bg || bg.walls !== S.walls) return;
  const g = bg.c.getContext('2d'), ox = BG_M * CELL, oy = BG_M * CELL, bone = ['lancer', 'sniper'].some(k => TYPES[k] === e.type), n = e.boss ? 60 : 8 + e.r * 2;
  g.globalAlpha = 0.5; g.fillStyle = bone ? '#3a3640' : tone(e.color, -0.62);
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = Math.random() * Math.random() * (e.r + 5), x = Math.round(e.x + Math.cos(a) * d), y = Math.round(e.y + e.r * 0.6 + Math.sin(a) * d * 0.6); if (!isWallAt(x, y)) g.fillRect(ox + x, oy + y, Math.random() < 0.3 ? 2 : 1, 1); }
  g.globalAlpha = 0.8;
  if (bone) for (let i = 0; i < 3; i++) { const x = Math.round(e.x + rnd(-6, 6)), y = Math.round(e.y + e.r * 0.6 + rnd(-3, 3)); if (!isWallAt(x, y)) { g.fillStyle = '#a39c84'; g.fillRect(ox + x, oy + y, 3, 1); g.fillStyle = '#cfc8ae'; g.fillRect(ox + x, oy + y, 1, 1); } }
  g.globalAlpha = 1;
}
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
    h = `<p class="eyebrow">Sala de Kiteo · prototipo</p><h1>Alec, el sin dios</h1>
      <p class="lead">Los ejércitos de los dioses arrasaron tu pueblo cuando eras un niño. Te crio un herrero: te enseñó a forjar y a pelear, y un elegido lo mató. Ahora vas de reino en reino como mercenario, con un arma hecha por ti y una sola idea: matar a los dioses.</p>
      <p class="lead">Cada disparo te frena un instante: dispara, da un paso, dispara. Cada reino es un mapa con cuatro zonas; en cada zona hay tres encargos y un guardián. Cuando caigan los cuatro, el dios saldrá a buscarte.</p>
      <dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo o apuntar el cargado</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl>
      <button id="ovBtn" class="primary">Empezar</button>
      <p class="fine">Con mando: pulsa cualquier botón para que el navegador lo detecte, y después A. En el móvil, juega en horizontal.</p>`;
  } else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · ${whereNow()}</p><h1>${gunName(S.gun)}</h1><p class="fine">${(1 / periodOf()).toFixed(2)} disparos por segundo · ${Math.round(S.p.dmg * gunDmg())} de daño por bala · ${Math.round(rangeOf())} de alcance · ${Math.ceil(S.p.hp)} de ${S.p.maxHp} de vida · ${Math.floor(S.p.gold)} de oro</p><div class="btns"><button id="ovBtn" class="primary">Seguir</button><button id="bookBtn" class="ghost">Recetario</button></div><ul class="build full">${buildHtml(true)}</ul><p class="fine">La partida se guarda al entrar en cada sala: puedes cerrar y continuar luego desde la forja.</p>`;
  } else if (m === 'book') h = bookHtml();
  else if (m === 'dead') {
    h = `<p class="eyebrow">Encargo fallido</p><h1>Alec se retira</h1>
      <p class="lead">${S.failTxt || 'Caíste'} · ${whereNow()}, con ${S.kills} bajas. Te llevas ${lootTxt()} a la forja. El encargo sigue en pie: puedes volver a intentarlo.</p>
      <button id="ovBtn" class="primary">A la forja</button>`;
  } else if (m === 'win') {
    h = `<p class="eyebrow">${S.mission.zone} · ${MTYPES[S.mission.type].name}</p><h1>${S.mission.type === 'god' ? 'Un dios menos' : 'Encargo cumplido'}</h1>
      <p class="lead">${S.mission.name}: ${S.kills} bajas. El reino paga ${S.pay} almas${S.first ? '' : ' (ya lo habías cobrado entero: repetirlo paga menos)'}. Te llevas ${lootTxt()} a la forja${S.found ? ', y entre los restos encuentras una pieza: ' + S.found : ''}.</p>
      <button id="ovBtn" class="primary">A la forja</button>`;
  } else if (m === 'forge') h = forgeHtml();
  else if (m === 'shop') h = shopHtml();
  else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1><div class="cards">` +
      pickOpts.map((u, i) => `<button class="card${i === pickSel ? ' sel' : ''}" data-i="${i}" id="card${i}" style="--fam:${u.color}"><em>${u.tag}${u.rar ? `<i style="color:${RAR[u.rar].color}"> · ${RAR[u.rar].name}</i>` : ''}</em><strong>${u.name}</strong><span>${u.desc}</span>${u.tag === 'Fundir' ? '' : gloss(u.desc)}${u.note ? `<small>${u.note}</small>` : ''}</button>`).join('') +
      `</div><div class="btns"><button id="bookBtn" class="ghost">Recetario</button>${pickReroll && S.rerolls > 0 ? '<button id="rrBtn" class="ghost">Volver a sortear</button>' : ''}<p class="fine">Muévete con el stick izquierdo o la cruceta (también hacia abajo), disparar para confirmar. El stick derecho desplaza la pantalla. Cargar abre el recetario${pickReroll && S.rerolls > 0 ? ' y esquivar vuelve a sortear' : ''}.</p></div>`;
  }
  ovBody.innerHTML = h;
  ovBody.classList.toggle('wide', m === 'book' || m === 'forge' || m === 'shop');
  if (m === 'forge' || m === 'shop') bindList();
  const rr = $('rrBtn'); if (rr) rr.addEventListener('click', () => { audioInit(); rerollPick(); });
  const bk = $('bookBtn'); if (bk) bk.addEventListener('click', () => { audioInit(); openBook(); });
  const b = $('ovBtn'); if (b) b.addEventListener('click', () => { audioInit(); primaryAction(true); });
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
function primaryAction(force) {
  if (S.mode === 'title') openForge();
  else if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'book') closeBook();
  else if ((S.mode === 'dead' || S.mode === 'win') && (force || modeT > 0.8)) openForge();
}
$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').addEventListener('click', () => { muted = !muted; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); });

let hudKey = '';
function renderHud() {
  const p = S.p;
  const dev = padBlocked ? 'Mando bloqueado en esta vista' : padName ? 'Mando conectado' : lastDev === 'touch' ? 'Táctil' : lastDev === 'kb' ? 'Teclado' : 'Mando no detectado';
  const left = S.enemies.length + S.queue.length, bo = S.enemies.find(e => e.boss && e.spawn <= 0), inRun = S.wave > 0;
  const key = [Math.ceil(p.hp), p.maxHp, Math.round(p.reserve), S.wave, left, dev, lastDev, periodOf().toFixed(3), Math.round(p.dmg), Math.round(rangeOf()), S.mode, JSON.stringify(S.build), JSON.stringify(S.gun), S.techs.size, S.plans.size,
    Math.round(p.fury / 4), Math.floor(p.gold), S.shades.length, S.soulsRun, S.ironRun, bo ? Math.ceil(bo.hp / 8) : -1, S.keep ? Math.ceil(S.keep.hp / 4) : -1, S.defWave, S.postsDown].join('|');
  if (key === hudKey) return; hudKey = key;
  $('hpFill').style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  $('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp + (p.reserve >= 1 ? '  +' + Math.round(p.reserve) : '');
  const ms = S.mission;
  $('wave').textContent = !inRun || !ms ? '' : ms.type === 'defend' ? 'Defensa · oleada ' + S.room + ' de ' + roomsOf(ms) + ' · quedan ' + left : ms.type === 'assault' ? 'Asalto · campamento ' + S.room + ' de ' + roomsOf(ms) + ' · estandartes ' + (S.postsDown || 0) + ' de ' + (S.postsAll || 3) : S.bossRoom ? ms.zone + ' · ' + ms.name : ms.name + ' · sala ' + S.room + ' de ' + roomsOf(ms) + ' · quedan ' + left;
  $('stats').textContent = inRun ? gunName(S.gun) : '';
  $('res').textContent = !inRun ? '' : ['Oro ' + Math.floor(p.gold), godCount('orc') || G('a_drum') ? 'Furia ' + Math.round(p.fury) : '', S.shades.length ? 'Sombras ' + S.shades.length : '', S.soulsRun ? 'Almas ' + S.soulsRun : '', S.ironRun ? 'Hierro ' + S.ironRun : ''].filter(Boolean).join(' · ');
  $('build').innerHTML = inRun ? buildHtml(false) : '';
  $('boss').hidden = (!bo && !S.keep) || S.mode !== 'play';
  if (S.keep) { $('boss').firstElementChild.textContent = 'La campana de la aldea'; $('bossFill').style.width = clamp(S.keep.hp / S.keep.maxHp * 100, 0, 100) + '%'; }
  else if (bo) { $('boss').firstElementChild.textContent = bo.type.name; $('bossFill').style.width = clamp(bo.hp / bo.maxHp * 100, 0, 100) + '%'; }
  $('dev').textContent = dev;
  $('hint').textContent = HINTS[lastDev] || HINTS.none;
  $('touch').hidden = lastDev !== 'touch';
}

// ───────────────────────── Bucle ─────────────────────────
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  resize(); pollInput(); modeT += dt;
  const m = S.mode;
  if (m !== 'play' && Math.abs(I.ay) > 0.2) ov.scrollTop += I.ay * 900 * dt;   // en cualquier menú, el stick derecho desplaza la pantalla
  if (m === 'pause' || m === 'dead' || m === 'win' || m === 'title') ov.scrollTop += I.my * 700 * dt;   // donde no hay nada que elegir, el izquierdo también
  if (m === 'book') { ov.scrollTop += I.my * 700 * dt; if (modeT > 0.25 && (I.atkP || I.dodgeP || I.chgP || I.startP)) closeBook(); }
  else if ((m === 'pick' || m === 'pause') && I.chgP) openBook();
  else if (m === 'play') { M.time += dt; if (I.startP) setMode('pause'); else update(dt); }
  else if (m === 'pick') {
    let moved = false;
    if (I.navX || I.navY) { const n = navPick([...ovBody.querySelectorAll('.card')], pickSel, I.navX, I.navY); if (n >= 0 && n !== pickSel) { pickSel = n; moved = true; } }
    if (moved) { ovBody.querySelectorAll('.card').forEach((c, i) => { c.classList.toggle('sel', i === pickSel); if (i === pickSel) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); blip(700, 0.03, 'triangle', 0.03); }
    if (I.atkP) choosePick(pickSel);
    if (I.dodgeP) rerollPick();
  } else if (m === 'forge' || m === 'shop') listInput();
  else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  render(); renderHud();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Acceso para pruebas
window.__kiteo = { get state() { return S; }, get meta() { return M; }, enter: nextWave, dbg: { doorScreen, critChance, petN, doomK, temperMax, th, shot, barrelFire, chargePayoff, addDoom, freeze, hit, sleep, light }, gunName, SPR, ENSEMBLES, LEGENDS, ROOM_KINDS, NAV, set forceRoom(k) { ROOM_FORCE = k; }, T, PIECES, DUOS, PLANS, TECHS, GODS, PARTS, RESO, TYPES, WORLDS, RPW };
})();
