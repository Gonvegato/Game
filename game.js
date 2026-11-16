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
    r: 7, speed: 82, hp: 85, dmg: 19,   // menos vida y más pegada que al principio (antes 100 y 12): el trasgo cae en dos disparos y los grandes no son esponjas
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
const POW_STEP = 0.05;   // daño extra por cada nivel de técnica, técnica suelta o plano que llevas
// ───────────────────────── Enemigos ─────────────────────────
const TYPES = {
  stalker: { name: 'Trasgo',      r: 7,  hp: 30,  speed: 58,  dmg: 10, wind: 0.38, reach: 9,  shape: 'circle',  color: '#8fa58c', cost: 1 },
  runner:  { name: 'Mímico',      r: 5,  hp: 12,  speed: 100, dmg: 7,  wind: 0.22, reach: 8,  shape: 'tri',     color: '#7d9a4a', cost: 1 },
  brute:   { name: 'Orco',        r: 12, hp: 120, speed: 38,  dmg: 24, wind: 0.6,  reach: 14, shape: 'square',  color: '#8a9a55', cost: 3 },
  mage:    { name: 'Hechicero',   r: 7,  hp: 24,  speed: 50,  dmg: 12, ranged: true,          shape: 'diamond', color: '#b68cff', cost: 2 },
  bomber:  { name: 'Barrilero',   r: 7,  hp: 28,  speed: 46,  dmg: 16, ai: 'bomb',            shape: 'square',  color: '#ffa64d', cost: 2 },
  leaper:  { name: 'Rana',        r: 6,  hp: 26,  speed: 64,  dmg: 15, ai: 'leap',            shape: 'tri',     color: '#9bd36b', cost: 2 },
  sniper:  { name: 'Arquero',     r: 6,  hp: 20,  speed: 44,  dmg: 22, ai: 'snipe',           shape: 'diamond', color: '#ff5d7a', cost: 2.5 },
  shaman:  { name: 'Seta bruja',  r: 7,  hp: 34,  speed: 48,  dmg: 0,  ai: 'heal',            shape: 'circle',  color: '#5fd4c4', cost: 2.5 },
  lancer:  { name: 'Embestidor',  r: 7,  hp: 40,  speed: 54,  dmg: 18, wind: 0.4,  reach: 10, shape: 'circle',  color: '#e6dfc6', cost: 2.5, lunge: true },
  bat:     { name: 'Diablillo',   r: 4,  hp: 9,   speed: 118, dmg: 6,  wind: 0.16, reach: 6,  shape: 'tri',     color: '#8a6aa8', cost: 0.7, fly: true },
  champ:   { name: 'Elegido',     r: 9,  hp: 220, speed: 60,  dmg: 16, wind: 0.4,  reach: 10, shape: 'circle',  color: '#e9dcc3', champ: true },
  post:    { name: 'Estandarte',  r: 10, hp: 230, speed: 0,   dmg: 0,  shape: 'square',  color: '#c0392b', cost: 99, post: true },
  // Jefes: un kit de ataques con aviso. phases: cuántas veces se enfurece.
  guardian:  { name: 'El Guardián',            r: 22, hp: 1100, speed: 44, dmg: 30, shape: 'circle',  color: '#8a3a55', boss: true, phases: 2, kit: ['slam', 'charge', 'ring'],                 sum: 'runner' },
  matriarch: { name: 'La Matriarca del Fango', r: 20, hp: 1500, speed: 62, dmg: 30, shape: 'circle',  color: '#6f9a3a', boss: true, phases: 2, kit: ['leap', 'fan', 'pools', 'summon'],          sum: 'runner' },
  colossus:  { name: 'El Cofre Voraz',         r: 26, hp: 2100, speed: 34, dmg: 34, shape: 'square',  color: '#4aa7b8', boss: true, phases: 2, kit: ['lasers', 'ring', 'charge', 'slam'],        sum: 'sniper' },
  nameless:  { name: 'El Sin Nombre',          r: 22, hp: 3000, speed: 54, dmg: 36, shape: 'diamond', color: '#d8d2e8', boss: true, phases: 3, kit: ['slam', 'charge', 'ring', 'fan', 'leap', 'lasers', 'pools', 'summon'], sum: 'brute' },
  // Dioses: el jefe final de un reino
  // Torrealba: guardianes y dios del segundo reino (más vida y más daño: el reino de un dios mucho más fuerte)
  k2_salt:    { name: 'La Bestia de Sal',        r: 24, hp: 2600, speed: 54, dmg: 40, shape: 'square',  color: '#cfe6f0', boss: true, scale: 2, phases: 2, kit: ['charge', 'slam', 'ring'],                        sum: 'lancer' },
  k2_hang:    { name: 'El Verdugo de la Ciénaga', r: 22, hp: 3200, speed: 58, dmg: 42, shape: 'circle',  color: '#4a7ab8', boss: true, scale: 2, phases: 2, kit: ['leap', 'slam', 'fan', 'summon'],                 sum: 'brute' },
  k2_bailiff: { name: 'El Alguacil',             r: 24, hp: 3900, speed: 50, dmg: 44, shape: 'square',  color: '#9aa4b8', boss: true, phases: 3, kit: ['charge', 'ring', 'lasers', 'slam'],             sum: 'sniper' },
  k2_exec:    { name: 'El Ejecutor',             r: 26, hp: 4800, speed: 60, dmg: 48, shape: 'diamond', color: '#c0392b', boss: true, scale: 2, phases: 3, kit: ['charge', 'leap', 'ring', 'fan', 'pools', 'summon'], sum: 'lancer' },
  k2_judge:   { name: 'El Juez Sin Rostro',      r: 30, hp: 7000, speed: 52, dmg: 52, shape: 'square',  color: '#e8e0c8', boss: true, scale: 2, phases: 3, kit: ['slam', 'charge', 'leap', 'ring', 'lasers', 'summon'], sum: 'lancer' },
  firstfist: { name: 'El Primer Puño',         r: 28, hp: 3400, speed: 50, dmg: 38, shape: 'square',  color: '#d9a066', boss: true, phases: 3, kit: ['slam', 'charge', 'leap', 'ring', 'summon'], sum: 'brute' },
};
const RPW = 5;   // salas por mundo, antes de la tienda y el jefe
const WORLDS = [
  { name: 'Las Criptas',           floor: '#1a1e29', tile: '#1f2431', pool: ['stalker', 'runner', 'mage', 'brute', 'bat'],                                         boss: 'guardian' },
  { name: 'El Nido',               floor: '#1b2420', tile: '#202b25', pool: ['stalker', 'runner', 'leaper', 'bomber', 'brute', 'bat', 'lancer'],                             boss: 'matriarch' },
  { name: 'Las Minas de Cristal',  floor: '#1a2030', tile: '#212a40', pool: ['runner', 'mage', 'sniper', 'shaman', 'brute', 'leaper', 'lancer'],                      boss: 'colossus' },
  { name: 'El Umbral',             floor: '#241a22', tile: '#2c2029', pool: ['stalker', 'runner', 'mage', 'brute', 'bomber', 'leaper', 'sniper', 'shaman', 'lancer', 'bat'], boss: 'nameless' },
];
const TOTAL = WORLDS.length * (RPW + 1);

// Ajustes del yunque (sala de yunque y tienda)
const UPGRADES = [
  { name: 'Nudillos sueltos', desc: '+28% de cadencia',                 apply: p => { p.as *= 1.28; } },
  { name: 'Brasa avivada',    desc: '+40% de daño',                     apply: p => { p.dmg *= 1.4; } },
  { name: 'Palma pulida',     desc: '+22% de alcance',                  apply: p => { p.range *= 1.22; } },
  { name: 'Botas de forja',   desc: '+14% de velocidad de movimiento',  apply: p => { p.speed *= 1.14; } },
];

// ───────────────────────── Deidades ─────────────────────────
// El herrero no tiene dios. En las salas de deidad espera su elegido con una reliquia de su dios (el campo `weapon`):
// lo matas, la quiebras y te quedas con una técnica. Cada deidad tiene algo suyo que se acumula.
const GODS = {
  dragon: { title: 'La Que Duerme Sobre Oro', theme: 'Dragones', weapon: 'Colmillo de la Durmiente', mat: 'Escama', color: '#ff6a3c',
    key: 'Ascuas: sus técnicas las clavan en los enemigos y queman todas a la vez, hasta 8 por enemigo. Su pasiva convierte tu oro en daño: cuanto más llevas, más pegas.', lines: {
    enter: ['entreabre un ojo. Su elegido guarda esta sala.', 'huele a intruso entre sus monedas.'],
    champ: ['cuenta su oro para calmarse. Le falta una pieza.', 'resopla humo. Ha perdido un elegido.'],
    take:  ['te apunta en su lista de deudores.', 'no olvida quién le roba.'], master: ['ruge: nadie le había robado tanto.'] } },
  stone: { title: 'El Paciente Bajo la Montaña', theme: 'Minerales', weapon: 'Corazón de Veta Madre', mat: 'Mena', color: '#6fe3d0',
    key: 'Cristales: los dejan Esquirla (al disparar) y Geoda (al esquivar). Solos no hacen nada; sus otras técnicas los usan para repetir tus disparos, lanzar rayos o reventarlos.', lines: {
    enter: ['tarda un siglo en mirarte. Ya te está mirando.', 'cruje. Su elegido despierta.'],
    champ: ['no dice nada. En algún lugar se agrieta una montaña.', 'guarda silencio. Es un mal silencio.'],
    take:  ['toma nota. Tiene tiempo.', 'observa cómo tallas lo que era suyo.'], master: ['pronuncia tu nombre, muy despacio.'] } },
  venom: { title: 'La Boticaria Sin Rostro', theme: 'Veneno', weapon: 'Aguijón de la Boticaria', mat: 'Glándula', color: '#9be04a',
    key: 'Veneno: lo ponen sus técnicas al disparar o con rastros y charcos. No caduca y se acumula hasta 30; el cargado lo convierte en daño de golpe y la pasiva lo contagia cuando muere el enemigo.', lines: {
    enter: ['anota tu peso y tu altura.', 'prepara un frasco con tu nombre.'],
    champ: ['pide que guarden una muestra del cadáver.', 'tacha un nombre de su cuaderno, sin pena.'],
    take:  ['siente curiosidad por lo que harás con eso.', 'apunta: el sujeto aprende rápido.'], master: ['te propone, encantada, un experimento.'] } },
  feast: { title: 'El Anfitrión del Banquete Eterno', theme: 'Manjares', weapon: 'Copa del Anfitrión', mat: 'Especia', color: '#ff8fb3',
    key: 'Reserva: con cualquier técnica suya, la curación que te sobra con la vida llena se guarda como escudo, hasta 30 puntos (cada punto vale el 1% de tu vida máxima). Sus técnicas te curan y después convierten esa Reserva en daño.', lines: {
    enter: ['te guarda un sitio en la mesa. No dice en qué plato.', 'afila los cubiertos y sonríe.'],
    champ: ['lamenta el desperdicio y pide otra ronda.', 'brinda por el difunto. Estaba tierno.'],
    take:  ['aplaude: ¡por fin alguien con apetito!', 'te ofrece repetir.'], master: ['brinda por ti, y ya van tres copas.'] } },
  orc: { title: 'El Primer Puño', theme: 'Orcos', weapon: 'Nudillo del Primer Puño', mat: 'Hueso', color: '#d9a066',
    key: 'Furia: con cualquier técnica suya ganas Furia al golpear y al recibir golpes, hasta 100, y baja si dejas de pelear. Sus técnicas la convierten en daño, cadencia y un grito.', lines: {
    enter: ['escupe al suelo. Su elegido quiere tu cabeza.', 'hace sonar los tambores.'],
    champ: ['se ríe a carcajadas. Buen golpe.', 'golpea la mesa: ¡otro!'],
    take:  ['dice que robar a un muerto es de listos.', 'gruñe algo parecido a un elogio.'], master: ['te reta a duelo. Lo dice en serio.'] } },
  time: { title: 'El Relojero de la Última Hora', theme: 'Tiempo', weapon: 'Manecilla del Relojero', mat: 'Arena', color: '#7fa8ff',
    key: 'Ecos: Segundero repite cada disparo y Rebobinar repite tu cargado poco después. Su esquive frena a los enemigos, y su pasiva hace más daño a los ralentizados o aturdidos.', lines: {
    enter: ['da cuerda a su elegido. Tic.', 'ya ha visto cómo acaba esta sala. No te lo dirá.'],
    champ: ['adelanta su reloj un minuto, molesto.', 'anota la hora de la muerte. Llega tarde.'],
    take:  ['murmura que eso ya lo habías robado antes.', 'te presta un segundo. Lo querrá de vuelta.'], master: ['detiene su reloj para mirarte bien.'] } },
  shade: { title: 'La Que Cuenta los Muertos', theme: 'Sombras', weapon: 'Ábaco de la Contadora', mat: 'Ceniza', color: '#9d8cff',
    key: 'Sombras: con Marca de tumba, los enemigos que matas mientras están marcados se levantan y pelean por ti unos segundos. Sus otras técnicas sacan partido de esas Sombras.', lines: {
    enter: ['empieza a contar. Tú eres el siguiente número.', 'envía a su elegido con un hueco reservado para ti.'],
    champ: ['pierde la cuenta por primera vez en mil años.', 'suma uno. No era el que esperaba.'],
    take:  ['ve cómo sus muertos te siguen a ti.', 'te observa: los muertos no deberían obedecerte.'], master: ['deja de contar y se pone en pie.'] } },
  storm: { title: 'La Voz Entre las Nubes', theme: 'Tormenta', weapon: 'Caracola de la Voz', mat: 'Chispa', color: '#ffe14d',
    key: 'Agujas: Aguja estática las clava al disparar. Solas no hacen nada: hay que descargarlas con el cargado (Sobretensión) o atravesando al enemigo con el esquive (Paso relámpago), y entonces saltan rayos.', lines: {
    enter: ['truena a lo lejos. Su elegido ya está aquí.', 'carga el aire. Se te eriza el pelo.'],
    champ: ['se queda sin voz un instante.', 'descarga su rabia contra una montaña.'],
    take:  ['te avisa: los rayos no tienen dueño.', 'ríe. Le gusta el ruido que haces.'], master: ['grita tu nombre, y se oye en los cuatro mundos.'] } },
  tide: { title: 'El Ahogado Bajo la Ola', theme: 'Mareas', weapon: 'Ancla del Ahogado', mat: 'Sal', color: '#4fb4d8',
    key: 'Empujones y Empapado: sus técnicas empujan y empapan. Si un enemigo choca contra un muro recibe daño y queda aturdido, y a los Empapados les basta un empujón flojo para chocar. Su pasiva hace más daño a los Empapados. Los jefes no se dejan empujar, pero si están Empapados reciben ese golpe igualmente, una vez cada 3 s.', lines: {
    enter: ['sube un palmo el agua de la sala.', 'arrastra algo pesado por el fondo. Viene hacia aquí.'],
    champ: ['suelta una burbuja. Tarda en llegar arriba.', 'se lleva a su elegido mar adentro, sin prisa.'],
    take:  ['te deja sal en los labios.', 'dice que todo lo que flota acaba volviendo.'], master: ['retira el mar entero para mirarte.'] } },
  luck: { title: 'La Dama de los Dados', theme: 'Fortuna', weapon: 'Dado de la Dama', mat: 'Taba', color: '#f2ead0',
    key: 'Críticos y azar: Dado cargado da a tu disparo probabilidad de crítico, el cargado tira dados, el esquive lanza una moneda y la pasiva acumula Rachas con cada crítico. Si sale bien, sale muy bien.', lines: {
    enter: ['apuesta por su elegido. Paga poco: lo ve claro.', 'baraja sin mirar las cartas.'],
    champ: ['pierde la apuesta y sonríe igual.', 'paga su deuda con una moneda de dos caras.'],
    take:  ['te guiña un ojo. O le ha entrado algo.', 'sube la apuesta.'], master: ['te ofrece los dados. Están calientes.'] } },
  wood: { title: 'La Madre de Espinas', theme: 'Bosque', weapon: 'Corona de la Madre de Espinas', mat: 'Semilla', color: '#3fbf73',
    key: 'Semillas y Raíces: cada impacto planta una Semilla y, al juntar 3 (2 desde el nivel II), brotan Raíces que clavan al enemigo en el sitio. Su cargado crea zarzales que frenan y dañan.', lines: {
    enter: ['hace crecer musgo en tus botas.', 'deja que su elegido eche raíces en esta sala.'],
    champ: ['lo cubre de hojas. Mañana será un árbol.', 'no llora: abona.'],
    take:  ['te llama mala hierba, con cariño.', 'siente cómo podas lo que era suyo.'], master: ['florece en pleno invierno, solo por verte.'] } },
  frost: { title: 'La Dama Quieta', theme: 'Hielo', weapon: 'Lágrima de la Dama Quieta', mat: 'Carámbano', color: '#bfe9ff',
    key: 'Escarcha: sus técnicas la ponen al disparar, con el cargado o con placas de hielo. Cada punto frena; con 5, el enemigo queda Congelado y el cargado puede romperlo.', lines: {
    enter: ['no se mueve. Nunca se ha movido.', 'baja la temperatura de la sala. Ves tu aliento.'],
    champ: ['no parpadea. Guarda al muerto bajo el hielo, intacto.', 'deja que nieve sobre su elegido.'],
    take:  ['te mira hacerlo. Solo te mira.', 'tiene todo el tiempo del mundo para cobrártelo.'], master: ['da un paso. El primero en mil inviernos.'] } },
  blood: { title: 'El Acreedor Rojo', theme: 'Sangre', weapon: 'Pagaré del Acreedor', mat: 'Coágulo', color: '#d6334a',
    key: 'Heridas: su disparo las abre y sangran más cuanta menos vida tengas. Sus otras técnicas te cobran vida para pegar más y te la devuelven al matar o al atravesar enemigos.', lines: {
    enter: ['abre su libro de cuentas por tu nombre.', 'te presta a su elegido. Con intereses.'],
    champ: ['apunta la pérdida. Te la cobrará.', 'lame la pluma y tacha una línea.'],
    take:  ['sonríe: ahora tú también le debes.', 'te fía. Eso es peor.'], master: ['cierra el libro: ya eres su mejor cliente.'] } },
  end: { title: 'La Última Página', theme: 'Final', weapon: 'Pluma de la Última Página', mat: 'Tinta', color: '#9fb0c8',
    key: 'Sentencia: la pone su técnica de disparo, que se llama igual. Al acabar el plazo, el enemigo recibe de golpe parte del daño que le hiciste; si muere antes, la Sentencia estalla sobre los de alrededor. Sus otras técnicas la cumplen antes, la adelantan o la pasan a otro enemigo.', lines: {
    enter: ['pasa una hoja. En la siguiente estás tú.', 'ya sabe cómo acaba esta sala. Lo ha leído.'],
    champ: ['corrige una errata: ese no tenía que morir hoy.', 'cierra un capítulo antes de tiempo.'],
    take:  ['te deja escribir una línea. Solo una.', 'anota al margen: imprevisto.'], master: ['te tiende la pluma. Pesa.'] } },
  light: { title: 'El Ojo Sin Párpado', theme: 'Luz', weapon: 'Lente del Ojo', mat: 'Lucero', color: '#ffb84d',
    key: 'Iluminado: lo ponen sus técnicas al disparar, con el cargado o al esquivar. Con Señalar, parte del daño que recibe un Iluminado lo reciben también los demás Iluminados.', lines: {
    enter: ['te ve. Te ha visto siempre.', 'enfoca a su elegido. La sala se queda sin sombras.'],
    champ: ['no cierra el ojo. No puede.', 'mira el cadáver hasta que deja de dar sombra.'],
    take:  ['te sigue con la mirada mientras lo robas.', 'ya sabe dónde vas a guardarlo.'], master: ['parpadea. El mundo se apaga un instante.'] } },
  dream: { title: 'El Que Bosteza', theme: 'Sueño', weapon: 'Rueca del Que Bosteza', mat: 'Legaña', color: '#c9a0dc',
    key: 'Dormido: Arrullo duerme al enemigo cada pocos disparos, y también lo hacen su cargado y la nube de su esquive. Un Dormido no se mueve ni ataca, y el golpe que lo despierta hace mucho más daño. Los jefes no se duermen: quedan Adormilados, frenados, y el siguiente golpe les hace el mismo daño extra.', lines: {
    enter: ['se estira. Su elegido hace la guardia por él.', 'bosteza, y se te cierran los ojos un momento.'],
    champ: ['se da la vuelta en la cama.', 'murmura algo dormido. Era un nombre.'],
    take:  ['te deja hacer. Mañana lo habrá olvidado.', 'sueña que le roban. No se despierta.'], master: ['abre un ojo. Solo uno.'] } },
  void: { title: 'La Boca Sin Fondo', theme: 'Vacío', weapon: 'Anzuelo de la Boca', mat: 'Hueco', color: '#c44fd8',
    key: 'Pozos: su cargado y su esquive abren pozos que atraen a los enemigos a un punto, y su disparo los junta y hace algo de daño a los que arrastra. Con su pasiva, cuanto más juntos están, más daño reciben.', lines: {
    enter: ['traga saliva. Se oye en toda la sala.', 'inclina el suelo hacia su elegido.'],
    champ: ['se lo traga sin masticar.', 'eructa. Huele a nada.'],
    take:  ['abre un poco más la boca.', 'no pide que se lo devuelvas. Espera a que caigas.'], master: ['por primera vez, se queda con hambre.'] } },
  mirror: { title: 'La Que Devuelve la Mirada', theme: 'Espejos', weapon: 'Esquirla de Azogue', mat: 'Azogue', color: '#cfd6de',
    key: 'Reflejo: con Reflejo (disparo) o Doble (cargado) tienes una copia tuya al otro lado de tu objetivo que repite lo que haces.', lines: {
    enter: ['te mira desde un charco. Llevas tu cara.', 'pone a su elegido frente a un espejo. Salen dos.'],
    champ: ['rompe un espejo. Siete años, dice.', 'busca su reflejo en el cadáver. No lo encuentra.'],
    take:  ['te imita mientras lo robas.', 'sonríe con tu boca.'], master: ['ya no sabe cuál de los dos eres tú.'] } },
  beast: { title: 'La Madre de Colmillos', theme: 'Bestias', weapon: 'Collar de la Madre de Colmillos', mat: 'Colmillo', color: '#c8743a',
    key: 'Manada: cualquiera de sus técnicas de disparo, cargado o esquive te da un perro que muerde a quien disparas; su cargado y su esquive le dan órdenes. Crece con la Caza, las bajas de la misión con él a tu lado: de cachorro a sabueso, luego a lobo alfa, y al final se le une otro cachorro.', lines: {
    enter: ['olfatea el aire. Hueles a hierro.', 'suelta a su elegido sin correa.'],
    champ: ['aúlla una vez, larga.', 'lame la herida de su cachorro. Ya no sangra.'],
    take:  ['te enseña los dientes. No es una sonrisa.', 'deja que el sabueso te huela la mano.'], master: ['te reconoce como de la camada.'] } },
  forge: { title: 'El Yunque que Canta', theme: 'Forja', weapon: 'Fuelle del Yunque', mat: 'Escoria', color: '#e07a5f',
    key: 'Temple: su técnica de disparo, Temple, lo gana al disparar, hasta 10 (y 2 más por cada nivel de la técnica a partir del segundo); cada punto da +3% de daño y pierdes la mitad si te golpean. Su cargado también da Temple.', lines: {
    enter: ['da un golpe de martillo. Tus guanteletes vibran.', 'reconoce el trabajo del herrero que te crio.'],
    champ: ['enfría una pieza mal hecha.', 'dice que el acero era bueno. La mano, no.'],
    take:  ['examina tus guanteletes y no dice nada. Es un elogio.', 'te deja usar su fragua, de mala gana.'], master: ['te llama colega. No lo había dicho nunca.'] } },
};
const GOD_KEYS = Object.keys(GODS);
// Las deidades se van fijando en Alec poco a poco. Al principio solo cuatro, las que se entienden a la primera
// (quemar, congelar, curarse, críticos) y cuya técnica de disparo ya hace algo por sí sola. Cada encargo cumplido
// por primera vez (los doce normales y los cuatro guardianes) abre la siguiente de GOD_ORDER, de la más directa a la
// más enrevesada: al final quedan las que piden combinar dos técnicas (Agujas, Cristales) o pensar con retraso (Sentencia).
// Orcos va la primera porque el dios del reino es el Primer Puño. Cuáles están abiertas se calcula con M.done (godsOpen, en 30_meta.js).
const GOD_START = ['dragon', 'frost', 'feast', 'luck'];
const GOD_ORDER = ['orc', 'venom', 'wood', 'tide', 'forge', 'blood', 'beast', 'void', 'time', 'dream', 'light', 'mirror', 'shade', 'storm', 'stone', 'end'];
const GOD_UNLOCK = GOD_START.concat(GOD_ORDER);
const SLOTS = { basic: 'Disparo', charge: 'Cargado', dodge: 'Esquive', passive: 'Pasiva' };
const SLOT_KEYS = ['basic', 'charge', 'dodge', 'passive'];
const pl = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');

// Técnicas: una por acción. No llevan su efecto encerrado: se enganchan a disparos, explosiones, esquives y bajas.
const PIECES = [
  // Dragones
  { id: 'dragon_basic',   god: 'dragon', slot: 'basic',   name: 'Colmillo al rojo', desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) clava ${pl(l, 'Ascua')} en el enemigo. Se acumulan hasta 8 por enemigo y cada una quema un 12% de tu daño cada medio segundo.` },
  { id: 'dragon_charge',  god: 'dragon', slot: 'charge',  name: 'Aliento',          desc: l => `Cada enemigo que alcanza tu disparo cargado recibe ${1 + l} Ascuas y, acto seguido, todas sus Ascuas estallan: ${35 + 10 * (l - 1)}% de tu daño por Ascua, en un área pequeña que deja 1 Ascua a quien toca. Las Ascuas estalladas se gastan. Con la Brasa de rayo, el rayo se convierte en un cono de fuego.` },
  { id: 'dragon_dodge',   god: 'dragon', slot: 'dodge',   name: 'Vuelo',            desc: l => `Tu esquive se convierte en un salto casi el doble de largo que pasa por encima de los muros. Al aterrizar, explota a tu alrededor: ${150 * l}% de tu daño en área.` },
  { id: 'dragon_passive', god: 'dragon', slot: 'passive', name: 'Tesoro',           desc: l => `Haces un ${l}% más de daño por cada 10 de oro que lleves, hasta +${30 + 10 * l}% (no afecta al daño continuo). Además, los enemigos que mueren con Ascuas sueltan ${pl(l, 'moneda')}; para eso necesitas algo que clave Ascuas.` },
  // Minerales
  { id: 'stone_basic',    god: 'stone',  slot: 'basic',   name: 'Esquirla',         desc: l => `${Math.max(1, 4 - l) > 1 ? 'Cada ' + Math.max(1, 4 - l) + ' disparos dejan' : 'Cada disparo deja'} un Cristal junto al enemigo, que dura 9 s. Solo cuentan los impactos de tus disparos directos. Puede haber 6 Cristales a la vez: si sale otro, desaparece el más antiguo. Por sí solos no hacen nada; los usan Prisma, Geoda y Veta.` },
  { id: 'stone_charge',   god: 'stone',  slot: 'charge',  name: 'Prisma',           desc: l => `Cuando disparas el cargado, cada Cristal lanza también un rayo al enemigo más cercano que vea: ${40 * l}% del daño del cargado, con todos los efectos de tu técnica de cargado. Necesitas tener Cristales en la sala.` },
  { id: 'stone_dodge',    god: 'stone',  slot: 'dodge',   name: 'Geoda',            desc: l => `Cada esquive deja un Cristal donde estabas. Si pasas a través de un Cristal mientras esquivas (cualquiera, no solo los de Geoda), revienta: ${120 * l}% de tu daño en área, y ese Cristal desaparece.` },
  { id: 'stone_passive',  god: 'stone',  slot: 'passive', name: 'Veta',             desc: l => `El Cristal más cercano a tu objetivo repite cada disparo tuyo, al ${30 * l}% de daño y con los efectos de tu técnica de disparo. Necesitas un Cristal cerca del enemigo; si no hay ninguno, no pasa nada.` },
  // Veneno
  { id: 'venom_basic',    god: 'venom',  slot: 'basic',   name: 'Ponzoña',            desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) pone ${l} de Veneno. Se acumula hasta 30 por enemigo y no caduca. Cada punto hace un 3,5% de tu daño cada medio segundo.` },
  { id: 'venom_charge',   god: 'venom',  slot: 'charge',  name: 'Purga',            desc: l => `Tu disparo cargado convierte en daño al instante el Veneno de cada enemigo que alcanza: ${15 * l}% de tu daño por punto. Después le queda la mitad del Veneno y deja un charco tóxico de 5 s que pone 1 de Veneno cada 0,4 s. Solo funciona si el enemigo ya tiene Veneno.` },
  { id: 'venom_dodge',    god: 'venom',  slot: 'dodge',   name: 'Rastro',           desc: l => `Tu esquive deja un rastro tóxico a lo largo del recorrido durante 5 s. Pone ${l} de Veneno cada 0,4 s a quien lo pise.` },
  { id: 'venom_passive',  god: 'venom',  slot: 'passive', name: 'Plaga',            desc: l => `Cuando muere un enemigo envenenado, todo su Veneno pasa, entero, a cada uno de los ${1 + l} enemigos más cercanos (sin pasar de 30). Solo funciona si muere con Veneno y hay otros enemigos cerca.` },
  // Manjares
  { id: 'feast_basic',    god: 'feast',  slot: 'basic',   name: 'Bocado',           desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) te cura un ${(0.5 * l).toFixed(1)}% de tu vida máxima. Lo que sobra con la vida llena se guarda como Reserva, hasta 30. La Reserva baja 2 por segundo si pasan 3 s sin llenarla.` },
  { id: 'feast_charge',   god: 'feast',  slot: 'charge',  name: 'Banquete',         desc: l => `Tu disparo cargado gasta toda tu Reserva y hace un ${4 * l}% más de daño por cada punto gastado. Durante 0,6 s, cada enemigo que muere te cura un 4% de tu vida máxima. Sin Reserva no hay extra de daño.` },
  { id: 'feast_dodge',    god: 'feast',  slot: 'dodge',   name: 'Brindis',          desc: l => `Al atravesar a un enemigo con el esquive le haces ${60 * l}% de tu daño y te curas un ${3 * l}% de tu vida máxima. Una vez por enemigo en cada esquive.` },
  { id: 'feast_passive',  god: 'feast',  slot: 'passive', name: 'Glotón',           desc: l => `Haces un ${l}% más de daño por cada punto de Reserva que tengas (no afecta al daño continuo). Necesitas llenar la Reserva curándote con la vida llena.` },
  // Orcos
  { id: 'orc_basic',      god: 'orc',    slot: 'basic',   name: 'Tambor de guerra', desc: l => `Ganas Furia: 2 por cada golpe que das y 15 por cada golpe que recibes, hasta 100. Si pasas 2 s sin ganarla, baja 8 por segundo. Cuanta más Furia, más daño: hasta +${40 * l}% con la Furia llena (no afecta al daño continuo).` },
  { id: 'orc_charge',     god: 'orc',    slot: 'charge',  name: 'Grito de guerra',  desc: l => `Tu disparo cargado gasta toda tu Furia en un grito a tu alrededor que empuja, aturde y hace desde el 50% hasta el ${50 + 200 * l}% de tu daño. Cuanta más Furia, más daño, más área y más aturdimiento (de 0,4 a 1,4 s). Con poca Furia, el grito es pequeño y flojo.` },
  { id: 'orc_dodge',      god: 'orc',    slot: 'dodge',   name: 'Embestida',        desc: l => `Al atravesar a un enemigo con el esquive le haces ${100 * l}% de tu daño, lo apartas, lo aturdes 0,35 s y ganas 15 de Furia. Una vez por enemigo en cada esquive.` },
  { id: 'orc_passive',    god: 'orc',    slot: 'passive', name: 'Sed de sangre',    desc: l => `Solo con la Furia llena (100): disparas un ${30 * l}% más rápido y cada baja te devuelve todas las cargas de esquive. Llevar esta técnica ya te hace ganar Furia al golpear y al recibir golpes.` },
  // Tiempo
  { id: 'time_basic',     god: 'time',   slot: 'basic',   name: 'Segundero',        desc: l => `Cada disparo tuyo deja un eco: 1,5 s después el mismo enemigo vuelve a recibir el golpe, al ${50 + 15 * (l - 1)}% de daño y con los efectos de tu técnica de disparo. Si el enemigo ya ha muerto, se pierde. Los ecos no hacen críticos ni dejan otro eco.` },
  { id: 'time_charge',    god: 'time',   slot: 'charge',  name: 'Rebobinar',        desc: l => `Tu disparo cargado se repite solo 2 s después, desde el mismo sitio y hacia el mismo lado, al ${60 + 15 * (l - 1)}% de daño. La repetición no gasta nada (ni Furia, ni Reserva, ni vida), pero tampoco recibe los extras del cargado original (dado, Reserva gastada…).` },
  { id: 'time_dodge',     god: 'time',   slot: 'dodge',   name: 'Hora muerta',      desc: l => `Tu esquive deja una burbuja donde estabas durante ${2 + l} s. Dentro, los enemigos van al 30% de velocidad y sus proyectiles se frenan. Los jefes solo bajan al 72%.` },
  { id: 'time_passive',   god: 'time',   slot: 'passive', name: 'Reloj de arena',   desc: l => `Los enemigos ralentizados o aturdidos reciben un ${30 * l}% más de todo tu daño, también el continuo. Necesitas algo que los frene o los aturda (Escarcha, burbuja, zarzal, Raíces…).` },
  // Sombras
  { id: 'shade_basic',    god: 'shade',  slot: 'basic',   name: 'Marca de tumba',   desc: l => `Cada impacto de tu disparo marca al enemigo 6 s. Si muere marcado, se levanta como Sombra y pelea por ti 9 s, golpeando con el 40% de tu daño. Puedes tener ${2 + l} Sombras a la vez: si se levanta otra, desaparece la más antigua. Los jefes no se levantan.` },
  { id: 'shade_charge',   god: 'shade',  slot: 'charge',  name: 'Orden',            desc: l => `Tu disparo cargado lanza a todas tus Sombras hacia donde apuntas y las hace estallar: ${150 * l}% de tu daño en área cada una. Las Sombras se gastan. Sin Sombras no hace nada.` },
  { id: 'shade_dodge',    god: 'shade',  slot: 'dodge',   name: 'Relevo',           desc: l => `Tu esquive deja una Sombra donde estabas durante ${3 + l} s. No cuenta para el máximo de Sombras y desaparece al cambiar de sala.` },
  { id: 'shade_passive',  god: 'shade',  slot: 'passive', name: 'Séquito',          desc: l => `Haces un ${8 * l}% más de daño por cada Sombra viva (no afecta al daño continuo). Además, los golpes de tus Sombras aplican los efectos de tu técnica de disparo. Necesitas tener Sombras.` },
  // Tormenta
  { id: 'storm_basic',    god: 'storm',  slot: 'basic',   name: 'Aguja estática',   desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) clava ${pl(l, 'Aguja')}, hasta 6 por enemigo. Se caen si pasan 6 s sin clavar más. Solas no hacen nada: necesitas algo que las descargue (Sobretensión, Paso relámpago, Sobrecarga o la Palma de cobre).` },
  { id: 'storm_charge',   god: 'storm',  slot: 'charge',  name: 'Sobretensión',     desc: l => `Tu disparo cargado descarga las Agujas de cada enemigo que alcanza: recibe ${70 + 20 * (l - 1)}% de tu daño por Aguja, y cada Aguja lanza un rayo a otro enemigo cercano con el 60% de ese daño. Solo funciona si el enemigo ya tiene Agujas.` },
  { id: 'storm_dodge',    god: 'storm',  slot: 'dodge',   name: 'Paso relámpago',   desc: l => `Al atravesar a un enemigo con el esquive descargas sus Agujas: ${80 + 20 * (l - 1)}% de tu daño por Aguja, y un rayo por Aguja a otros enemigos con el 60% de eso. Si no tiene Agujas, le clavas 2.` },
  { id: 'storm_passive',  god: 'storm',  slot: 'passive', name: 'Conductor',        desc: l => `Los rayos de una descarga clavan ${pl(l, 'Aguja')} a cada enemigo que alcanzan, listas para descargarlas después. Necesitas algo que descargue Agujas.` },
  // Mareas
  { id: 'tide_basic',     god: 'tide',   slot: 'basic',   name: 'Oleaje',           desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) empuja al enemigo y lo deja Empapado 4 s. Los golpes contra el muro (90% de tu daño y aturden 0,7 s) hacen un ${50 * l}% más. Los jefes no se dejan empujar: como quedan Empapados, cada empujón los golpea como un choque contra el muro, sin aturdirlos, una vez cada 3 s.` },
  { id: 'tide_charge',    god: 'tide',   slot: 'charge',  name: 'Maremoto',         desc: l => `Tu disparo cargado suelta además una ola a tu alrededor: ${50 * l}% de tu daño, los empapa 5 s y lanza lejos a todos los que alcanza. Los que chocan contra un muro reciben el golpe. Los jefes reciben el daño pero no se mueven; como quedan Empapados, reciben además el golpe contra el muro (si no lo han recibido en los últimos 3 s).` },
  { id: 'tide_dodge',     god: 'tide',   slot: 'dodge',   name: 'Corriente',        desc: l => `Tu esquive deja una corriente a lo largo del recorrido durante ${3 + l} s. Cada 0,4 s empapa 3 s a los enemigos que la tocan y los arrastra en la dirección en que esquivaste. Los jefes no se mueven.` },
  { id: 'tide_passive',   god: 'tide',   slot: 'passive', name: 'Marea alta',       desc: l => `Los Empapados reciben un ${15 * l}% más de daño (no del continuo), y cualquier empujón los lanza un 50% más lejos. Necesitas algo que los empape.` },
  // Fortuna
  { id: 'luck_basic',     god: 'luck',   slot: 'basic',   name: 'Dado cargado',     desc: l => `Cada disparo tiene un ${10 + 10 * l}% de ser crítico (250% de daño). Cada disparo que no es crítico sube un 5% la probabilidad hasta que sale uno; entonces vuelve a la base. Solo pueden ser críticos tus disparos directos, no los repetidos.` },
  { id: 'luck_charge',    god: 'luck',   slot: 'charge',  name: 'Todo al rojo',     desc: l => `Tu disparo cargado tira ${l > 1 ? l + ' dados y se queda el mejor' : 'un dado'}, que decide su daño: 1, el 60%; 2, el 80%; 3, el 100%; 4, el 130%; 5, el 170%; 6, el triple. Las repeticiones del cargado no tiran dado.` },
  { id: 'luck_dodge',     god: 'luck',   slot: 'dodge',   name: 'Cara o cruz',      desc: l => `Al esquivar lanzas una moneda. Cara (50%): recuperas la carga de esquive. Cruz: la moneda se queda donde estabas y a los 0,55 s revienta: ${120 * l}% de tu daño en área.` },
  { id: 'luck_passive',   god: 'luck',   slot: 'passive', name: 'Racha',            desc: l => `Cada crítico suma una Racha, hasta 5: +${6 * l}% de daño por Racha (no al daño continuo). Si un golpe te quita vida o Reserva, las pierdes todas; si eres invulnerable, lo para el Brazal con rodela o se lo lleva tu Reflejo, no. Necesitas algo que haga críticos, como Dado cargado.` },
  // Bosque
  { id: 'wood_basic',     god: 'wood',   slot: 'basic',   name: 'Semilla',          desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) planta una Semilla, que no caduca. A la ${l >= 2 ? 'segunda' : 'tercera'} brotan Raíces: clavan al enemigo en el sitio 1,5 s y le hacen ${80 * l}% de tu daño. Luego la cuenta vuelve a empezar. A los jefes las Raíces les duran solo un tercio.` },
  { id: 'wood_charge',    god: 'wood',   slot: 'charge',  name: 'Zarzal',           desc: l => `Tu disparo cargado crea un zarzal de 5 s donde apuntas. Quien esté dentro va a la mitad de velocidad y recibe ${20 * l}% de tu daño cada 0,4 s.` },
  { id: 'wood_dodge',     god: 'wood',   slot: 'dodge',   name: 'Enredadera',       desc: l => `Tu esquive deja una enredadera a lo largo del recorrido durante 4 s. La primera vez que cada enemigo la pisa, queda enraizado 1 s y recibe ${60 * l}% de tu daño.` },
  { id: 'wood_passive',   god: 'wood',   slot: 'passive', name: 'Savia',            desc: l => `Los enemigos enraizados o dentro de un zarzal reciben un ${20 * l}% más de daño (no del continuo), y cada uno que muere así te cura un ${l}% de tu vida máxima. Necesitas algo que los enraíce o un zarzal.` },
  // Hielo
  { id: 'frost_basic',    god: 'frost',  slot: 'basic',   name: 'Aliento helado',   desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) pone ${l} de Escarcha. Cada punto frena un 12% durante 2 s, y se pierde toda si pasan 4 s sin poner más. Con 5, el enemigo queda Congelado 1,5 s. Los jefes quedan Congelados la mitad y, en vez de pararse, solo se frenan.` },
  { id: 'frost_charge',   god: 'frost',  slot: 'charge',  name: 'Quebrar',          desc: l => `Tu disparo cargado rompe a los Congelados que alcanza: reciben ${150 * l}% de tu daño extra, sueltan esquirlas en área (algo más de la mitad de ese daño) y dejan de estar Congelados. A los demás les pone 3 de Escarcha.` },
  { id: 'frost_dodge',    god: 'frost',  slot: 'dodge',   name: 'Paso de hielo',    desc: l => `Tu esquive deja una placa de hielo donde estabas durante 4 s. Pone ${l} de Escarcha cada 0,4 s a quien la pise.` },
  { id: 'frost_passive',  god: 'frost',  slot: 'passive', name: 'Cero absoluto',    desc: l => `Los Congelados reciben un ${25 * l}% más de daño (no del continuo). Si mueren congelados, ponen 2 de Escarcha a hasta 4 enemigos cercanos. Necesitas algo que los congele.` },
  // Sangre
  { id: 'blood_basic',    god: 'blood',  slot: 'basic',   name: 'Herida abierta',   desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) abre ${pl(l, 'Herida')}, hasta 6 por enemigo. Duran 5 s desde la última que abres. Cada Herida quita un 5% de tu daño cada medio segundo, y hasta el triple cuanta menos vida tengas tú.` },
  { id: 'blood_charge',   god: 'blood',  slot: 'charge',  name: 'Sangría',          desc: l => `Tu disparo cargado te cuesta el 10% de tu vida actual (nunca baja de 1) y hace un ${60 * l}% más de daño. Durante 0,7 s, cada enemigo que muere te devuelve un 5% de tu vida máxima.` },
  { id: 'blood_dodge',    god: 'blood',  slot: 'dodge',   name: 'Transfusión',      desc: l => `Al atravesar a un enemigo con el esquive le haces ${60 * l}% de tu daño y te curas un ${4 * l}% de tu vida máxima. Una vez por enemigo en cada esquive.` },
  { id: 'blood_passive',  god: 'blood',  slot: 'passive', name: 'Deuda',            desc: l => `Con menos de la mitad de vida haces un ${20 * l}% más de daño (no del continuo). Además, el primer golpe que te mataría en cada sala te deja a 1 de vida y 1 s invulnerable.` },
  // Final
  { id: 'end_basic',      god: 'end',    slot: 'basic',   name: 'Sentencia',        desc: l => `Esta técnica pone el efecto Sentencia. Cada impacto de tu disparo (también los que repiten otras técnicas) la pone al enemigo si aún no tiene una; dura 5 s y no se renueva. Al acabar, el enemigo recibe de golpe el ${20 + 20 * l}% del daño de todos los golpes que recibió en ese tiempo (el daño continuo no cuenta). Si muere antes, la Sentencia no se pierde: estalla, y cada enemigo de alrededor recibe lo que le tocaba a él. Luego el siguiente impacto pone otra.` },
  { id: 'end_charge',     god: 'end',    slot: 'charge',  name: 'Punto final',      desc: l => `Tu disparo cargado cumple al instante la Sentencia de cada enemigo que alcanza, con un ${30 * l}% más; el daño del propio cargado ya cuenta. Solo funciona si el enemigo ya tiene una Sentencia: pónsela antes, por ejemplo con la técnica de disparo Sentencia.` },
  { id: 'end_dodge',      god: 'end',    slot: 'dodge',   name: 'Pasar página',     desc: l => `Al esquivar, las Sentencias de los enemigos cercanos se adelantan 2 s y te curas un ${l}% de tu vida máxima por cada una. Necesitas que los enemigos ya tengan Sentencia.` },
  { id: 'end_passive',    god: 'end',    slot: 'passive', name: 'Epitafio',         desc: l => `Si un enemigo muere antes de cumplirse su Sentencia, esta pasa al enemigo más cercano con todo lo acumulado${l > 1 ? ' y un ' + 15 * (l - 1) + '% más' : ''}, sumado a lo que ese ya tuviera. Le queda el tiempo que faltaba, 2 s como mínimo. Lo heredado no cuenta para el estallido si ese enemigo también muere antes de plazo. Necesitas algo que ponga Sentencias, y otro enemigo cerca.` },
  // Luz
  { id: 'light_basic',    god: 'light',  slot: 'basic',   name: 'Señalar',          desc: l => `Cada impacto de tu disparo (también los que repiten otras técnicas) Ilumina al enemigo 6 s. Cuando un Iluminado recibe un golpe, los demás Iluminados reciben el ${20 + 10 * l}% de ese daño (no se encadena y el daño continuo no cuenta). Hacen falta al menos dos Iluminados a la vez; los que alcanza tu disparo ya cuentan.` },
  { id: 'light_charge',   god: 'light',  slot: 'charge',  name: 'Destello',         desc: l => `Tu disparo cargado Ilumina 6 s a todos los que alcanza. A los que ya estaban Iluminados, antes los ciega: quedan aturdidos 1 s y reciben un golpe extra del ${40 * l}% de tu daño. Los jefes no se aturden.` },
  { id: 'light_dodge',    god: 'light',  slot: 'dodge',   name: 'Resplandor',       desc: l => `Al esquivar sueltas un destello donde estabas: Ilumina 6 s a los enemigos cercanos y les hace ${50 * l}% de tu daño.` },
  { id: 'light_passive',  god: 'light',  slot: 'passive', name: 'Sin sombra',       desc: l => `Haces un ${5 * l}% más de daño por cada enemigo Iluminado en la sala, contando hasta seis (no al daño continuo). Un jefe o un elegido Iluminado cuenta por tres. Necesitas algo que Ilumine.` },
  // Sueño
  { id: 'dream_basic',    god: 'dream',  slot: 'basic',   name: 'Arrullo',          desc: l => `Uno de cada ${Math.max(2, 5 - l)} disparos Duerme al enemigo 3 s. El golpe que lo despierta hace un ${100 * l}% más de daño. Solo cuentan tus disparos directos. Tras despertar, no se le puede dormir otra vez en 4 s. A los jefes no se les duerme: quedan Adormilados 1,5 s (frenados a la mitad), el siguiente golpe se lleva ese mismo extra, y no se les puede adormilar otra vez en 6 s.` },
  { id: 'dream_charge',   god: 'dream',  slot: 'charge',  name: 'Pesadilla',        desc: l => `Si tu disparo cargado da a un enemigo Dormido, recibe además un golpe extra del 60% de tu daño, aumentado un ${80 * l}%. Un jefe Adormilado cuenta como Dormido. Si da a uno despierto, lo Duerme 2 s (a los jefes los deja Adormilados 1 s).` },
  { id: 'dream_dodge',    god: 'dream',  slot: 'dodge',   name: 'Polvo de sueño',   desc: l => `Tu esquive deja una nube donde estabas durante ${2 + l} s. Duerme 2 s a cada enemigo que entre, una vez por enemigo.` },
  { id: 'dream_passive',  god: 'dream',  slot: 'passive', name: 'Sonámbulos',       desc: l => `El daño continuo (quemaduras, veneno, cortes y zonas del suelo) ya no despierta a los Dormidos y les hace un ${50 * l}% más; vale también para los jefes Adormilados. Sin esta técnica, ese daño los despierta. Necesitas algo que los duerma.` },
  // Vacío
  { id: 'void_basic',     god: 'void',   slot: 'basic',   name: 'Gravedad',         desc: l => `Cada disparo atrae hacia el enemigo alcanzado a los enemigos que tenga cerca${l > 1 ? ', con más fuerza a cada nivel' : ''}, y el tirón les hace el ${15 + 5 * l}% del daño de ese disparo (sin tus efectos de disparo). Así se amontonan. Solo cuentan tus disparos directos; los jefes no se mueven, pero el daño sí lo reciben.` },
  { id: 'void_charge',    god: 'void',   slot: 'charge',  name: 'Singularidad',     desc: l => `Tu disparo cargado abre un pozo de 2,5 s donde apuntas: atrae a todos al centro, les hace ${25 * l}% de tu daño cada 0,5 s y al cerrarse estalla (${100 * l}%). Los jefes reciben el daño pero no se mueven.` },
  { id: 'void_dodge',     god: 'void',   slot: 'dodge',   name: 'Hueco',            desc: l => `Tu esquive deja un pozo pequeño donde estabas durante ${1 + l} s, que atrae a los enemigos cercanos. No hace daño, y los jefes no se mueven.` },
  { id: 'void_passive',   god: 'void',   slot: 'passive', name: 'Apiñados',         desc: l => `Cada enemigo recibe un ${8 * l}% más de daño por cada enemigo pegado a él, contando hasta cuatro (no al daño continuo). Necesitas que estén amontonados.` },
  // Espejos
  { id: 'mirror_basic',   god: 'mirror', slot: 'basic',   name: 'Reflejo',          desc: l => `Un Reflejo tuyo se pone al otro lado de tu objetivo. Cada vez que disparas a un enemigo, él también le dispara, al ${30 * l}% de daño y con los efectos de tu técnica de disparo. Sus disparos no hacen críticos ni dejan ecos.` },
  { id: 'mirror_charge',  god: 'mirror', slot: 'charge',  name: 'Doble',            desc: l => `Tienes un Reflejo al otro lado de tu objetivo. Cuando disparas el cargado, él lo repite desde su lado, al ${40 + 15 * l}% de daño: el enemigo lo recibe por los dos lados. La repetición no gasta nada.` },
  { id: 'mirror_dodge',   god: 'mirror', slot: 'dodge',   name: 'Engaño',           desc: l => `Al esquivar dejas una imagen tuya donde estabas. Los enemigos cercanos se quedan mirándola, aturdidos ${(0.6 + 0.3 * l).toFixed(1)} s. Los jefes no se dejan engañar.` },
  { id: 'mirror_passive', god: 'mirror', slot: 'passive', name: 'Azogue',           desc: l => `Cuando te golpean, el golpe rebota: los enemigos cercanos reciben ${100 * l}% de tu daño. No pasa si eres invulnerable o si paras el golpe.` },
  // Bestias
  { id: 'beast_basic',    god: 'beast',  slot: 'basic',   name: 'Sabueso',          desc: l => `Te da un perro que pelea a tu lado y muerde cada 0,8 s al enemigo al que disparas (si no disparas, al más cercano): ${15 + 30 * l}% de tu daño, con los efectos de tu técnica de disparo. Tus disparos hacen un 15% más a su presa. Empieza de cachorro y crece con la Caza.${packStatus()}` },
  { id: 'beast_charge',   god: 'beast',  slot: 'charge',  name: '¡A por él!',       desc: l => `Te da un perro, si no lo tienes ya (sin la técnica Sabueso, sus mordiscos hacen el 30% de tu daño; empieza de cachorro y crece con la Caza). Tu disparo cargado hace saltar al primero de la manada adonde apuntas: ${250 * l}% de tu daño en área y aturde 1 s. Los jefes no se aturden.${packStatus()}` },
  { id: 'beast_dodge',    god: 'beast',  slot: 'dodge',   name: 'Manada',           desc: l => `Te da un perro, si no lo tienes ya (sin la técnica Sabueso, sus mordiscos hacen el 30% de tu daño; empieza de cachorro y crece con la Caza). Al esquivar, el primero de la manada salta adonde estabas y muerde a los enemigos de alrededor: ${80 * l}% de tu daño, sea cachorro o lobo alfa, con los efectos de tu técnica de disparo, y los aparta.${packStatus()}` },
  { id: 'beast_passive',  god: 'beast',  slot: 'passive', name: 'Olfato',           desc: l => `Los enemigos con menos del 30% de vida reciben un ${25 * l}% más de daño (no del continuo). No te da perro.` },
  // Forja
  { id: 'forge_basic',    god: 'forge',  slot: 'basic',   name: 'Temple',           desc: l => `Cada ${Math.max(2, 8 - l * 2)} disparos ganas 1 de Temple, hasta ${8 + 2 * l}. Cuentan las veces que disparas, no los impactos. Cada punto da +3% de daño. Si te golpean, pierdes la mitad. Se conserva de una sala a otra.` },
  { id: 'forge_charge',   god: 'forge',  slot: 'charge',  name: 'Martillazo',       desc: l => `Tu disparo cargado añade un martillazo a tu alrededor: ${120 * l}% de tu daño, aturde 0,6 s y te da 1 de Temple por cada enemigo golpeado. Las repeticiones del cargado no dan Temple.` },
  { id: 'forge_dodge',    god: 'forge',  slot: 'dodge',   name: 'Al rojo',          desc: l => `Después de esquivar, tus ${1 + l} siguientes disparos salen al rojo: +50% de daño, y cada impacto salpica al enemigo más cercano con la mitad de ese daño.` },
  { id: 'forge_passive',  god: 'forge',  slot: 'passive', name: 'Maestro armero',   desc: l => `Tus guanteletes mejoran: +${5 * l}% de daño, de cadencia y de alcance.` },
];
// Dúos: si llevas la técnica de una deidad y a otra le toca ofrecerte la suya para esa misma acción,
// te ofrece el dúo. Ocupa la ranura, hace lo de las dos y añade una regla nueva. Las once primeras deidades tienen dúo con todas entre sí; las nuevas, solo con sus afines.
const DUOS = [
  // Disparo
  { id: 'obsidian',  slot: 'basic',   a: 'dragon_basic',  b: 'stone_basic',  name: 'Filo de obsidiana',  desc: 'Además de lo que hacen Colmillo al rojo y Esquirla, tus Cristales arden: cada medio segundo clavan 1 Ascua a los enemigos pegados a ellos. Cuando a un Cristal se le acaba el tiempo, estalla: 100% de daño en área y 2 Ascuas a cada enemigo alcanzado.' },
  { id: 'eternal',   slot: 'basic',   a: 'dragon_basic',  b: 'time_basic',   name: 'Brasa eterna',       desc: 'Además de lo que hacen Colmillo al rojo y Segundero, las Ascuas ya no se apagan con el tiempo: siguen quemando hasta que el enemigo muere o las haces estallar. Además, cada eco clava el doble de Ascuas que un disparo normal.' },
  { id: 'tombstone', slot: 'basic',   a: 'stone_basic',   b: 'shade_basic',  name: 'Lápida',             desc: 'Además de lo que hacen Esquirla y Marca de tumba, cuando a un Cristal se le acaba el tiempo, se levanta una Sombra en su sitio. Cuenta para tu límite de Sombras: si ya estás al máximo, sustituye a la más antigua.' },
  { id: 'boil',      slot: 'basic',   a: 'venom_basic',   b: 'orc_basic',    name: 'Sangre hirviente',   desc: 'Además de lo que hacen Ponzoña y Tambor de guerra, cada impacto aplica 1 de Veneno más por cada 20 de Furia (+5 con la Furia llena). Cada vez que el Veneno hace daño, ganas 1 de Furia. Con la Furia llena, el Veneno hace daño el doble de rápido.' },
  { id: 'syringe',   slot: 'basic',   a: 'venom_basic',   b: 'storm_basic',  name: 'Aguja envenenada',   desc: 'Además de lo que hacen Ponzoña y Aguja estática, al descargar a un enemigo, cada rayo aplica a quien alcanza tanto Veneno como tenía ese enemigo (hasta 30). Las Agujas no caducan mientras el enemigo tenga Veneno.' },
  { id: 'warhunger', slot: 'basic',   a: 'feast_basic',   b: 'orc_basic',    name: 'Hambre de guerra',   desc: 'Además de lo que hacen Bocado y Tambor de guerra, cada 1% de tu vida máxima que te curas te da 2 de Furia, también lo que va a la Reserva. Con la Furia llena, Bocado te cura el triple por disparo.' },
  { id: 'clockmark', slot: 'basic',   a: 'time_basic',    b: 'shade_basic',  name: 'Marca del reloj',    desc: 'Además de lo que hacen Segundero y Marca de tumba, cuando un enemigo marcado muere y se levanta como Sombra, 1,5 s después se levanta otra en el mismo sitio. Solo con las Sombras de Marca de tumba, y los jefes no se levantan.' },
  // Cargado
  { id: 'rot',       slot: 'charge',  a: 'dragon_charge', b: 'venom_charge', name: 'Aliento podrido',    desc: 'Además de lo que hacen Aliento y Purga, antes de nada, tu disparo cargado suma las Ascuas y el Veneno de cada enemigo que alcanza y sube los dos a ese total (las Ascuas hasta su tope; el Veneno, hasta 30). Después Aliento hace estallar las Ascuas y Purga convierte el Veneno.' },
  { id: 'roar',      slot: 'charge',  a: 'dragon_charge', b: 'orc_charge',   name: 'Rugido',             desc: 'Además de lo que hacen Aliento y Grito de guerra, el cono de fuego de Aliento crece con la Furia que tienes al disparar: hasta el doble de largo y de ancho con la Furia llena. El grito solo gasta la mitad de tu Furia. El cono solo sale con la Brasa de rayo.' },
  { id: 'rod',       slot: 'charge',  a: 'stone_charge',  b: 'storm_charge', name: 'Pararrayos',         desc: 'Además de lo que hacen Prisma y Sobretensión, cada vez que descargas a un enemigo que tiene un Cristal cerca, los rayos salen desde el Cristal y son el doble (hasta 14). Vale para cualquier descarga, no solo la del cargado.' },
  { id: 'table',     slot: 'charge',  a: 'stone_charge',  b: 'feast_charge', name: 'Mesa puesta',        desc: 'Además de lo que hacen Prisma y Banquete, cada medio segundo, tus Cristales rematan a los enemigos cercanos con menos del 20% de vida (los elegidos, con menos del 10%). Cada remate te da 4 de Reserva. No funciona con jefes.' },
  { id: 'cortege',   slot: 'charge',  a: 'venom_charge',  b: 'shade_charge', name: 'Cortejo fúnebre',    desc: 'Además de lo que hacen Purga y Orden, cada Sombra que estalla con Orden aplica 6 de Veneno a los que alcanza y deja un charco tóxico de 5 s que aplica 1 de Veneno por pulso.' },
  { id: 'supper',    slot: 'charge',  a: 'feast_charge',  b: 'shade_charge', name: 'Última cena',        desc: 'Además de lo que hacen Banquete y Orden, cada Sombra que estalla con Orden te da 5 de Reserva. Y cuando una Sombra golpea a un enemigo y lo deja por debajo del 20% de vida, lo remata. No remata jefes.' },
  { id: 'echocry',   slot: 'charge',  a: 'orc_charge',    b: 'time_charge',  name: 'Grito con eco',      desc: 'Además de lo que hacen Grito de guerra y Rebobinar, cuando Rebobinar repite tu disparo cargado, el grito se repite con toda su fuerza (100%, no el porcentaje de Rebobinar) y del tamaño de la Furia que tenías al lanzarlo, sin gastar más.' },
  // Esquive
  { id: 'comet',     slot: 'dodge',   a: 'dragon_dodge',  b: 'storm_dodge',  name: 'Cometa',             desc: 'Además de lo que hacen Vuelo y Paso relámpago, la explosión al aterrizar descarga las Agujas de cada enemigo que alcanza (80% por Aguja) y luego le clava 2 nuevas.' },
  { id: 'avalanche', slot: 'dodge',   a: 'stone_dodge',   b: 'orc_dodge',    name: 'Avalancha',          desc: 'Además de lo que hacen Geoda y Embestida, el enemigo que embistes sale despedido en la dirección de tu esquive. Si choca con un muro, un Cristal (que se rompe) u otro enemigo, estalla: 300% de daño en área, aturde 0,6 s y te da 10 de Furia. Los elegidos vuelan menos y los jefes no salen despedidos.' },
  { id: 'stalagm',   slot: 'dodge',   a: 'stone_dodge',   b: 'venom_dodge',  name: 'Estela de cristal',  desc: 'Además de lo que hacen Geoda y Rastro, el rastro tóxico deja tres Cristales a lo largo. Y todos tus Cristales, salgan de donde salgan, aplican 2 de Veneno cada medio segundo a los enemigos pegados a ellos.' },
  { id: 'miasma',    slot: 'dodge',   a: 'venom_dodge',   b: 'time_dodge',   name: 'Miasma',             desc: 'Además de lo que hacen Rastro y Hora muerta, dentro de la burbuja de Hora muerta, el Veneno de los enemigos hace daño el triple de rápido.' },
  { id: 'toast',     slot: 'dodge',   a: 'feast_dodge',   b: 'storm_dodge',  name: 'Brindis eléctrico',  desc: 'Además de lo que hacen Brindis y Paso relámpago, cuando atraviesas a un enemigo y le descargas las Agujas, te curas un 2% de tu vida máxima por cada Aguja descargada.' },
  { id: 'horde',     slot: 'dodge',   a: 'orc_dodge',     b: 'shade_dodge',  name: 'Carga de la horda',  desc: 'Además de lo que hacen Embestida y Relevo, cuando embistes a un enemigo, todas tus Sombras saltan a su lado y lo golpean: 100% de daño cada una.' },
  { id: 'stasis',    slot: 'dodge',   a: 'time_dodge',    b: 'storm_dodge',  name: 'Relámpago en pausa', desc: 'Además de lo que hacen Hora muerta y Paso relámpago, los enemigos dentro de la burbuja reciben 1 Aguja por cada segundo que pasan en ella. Cuando la burbuja se cierra, descarga a todos los que siguen dentro (80% por Aguja).' },
  // Pasiva
  { id: 'hoardfeast', slot: 'passive', a: 'dragon_passive', b: 'feast_passive', name: 'Banquete del dragón', desc: 'Además de lo que hacen Tesoro y Glotón, para Glotón, cada 10 de oro que llevas cuenta como 1 punto de Reserva, sin gastarse. Y cada vez que ganas oro, te curas un 1% de tu vida máxima por cada moneda ganada.' },
  { id: 'ashlegion', slot: 'passive', a: 'dragon_passive', b: 'shade_passive', name: 'Ejército de ceniza', desc: 'Además de lo que hacen Tesoro y Séquito, cada golpe de tus Sombras clava 2 Ascuas. Cuando a una Sombra se le acaba el tiempo, estalla: 100% de daño en área. Las que lanzas con Orden o sustituye otra nueva no estallan así.' },
  { id: 'clockquartz', slot: 'passive', a: 'stone_passive', b: 'time_passive', name: 'Cuarzo de reloj',   desc: 'Además de lo que hacen Veta y Reloj de arena, tus Cristales ralentizan un 40% a los enemigos pegados a ellos (a los jefes, menos), y no se gastan mientras tengan a alguien al lado. Esos enemigos cuentan como ralentizados para Reloj de arena.' },
  { id: 'indigest',  slot: 'passive', a: 'venom_passive', b: 'feast_passive', name: 'Indigestión',        desc: 'Además de lo que hacen Plaga y Glotón, te curas un 10% de todo el daño que hace tu Veneno.' },
  { id: 'longlunch', slot: 'passive', a: 'feast_passive', b: 'time_passive',  name: 'Sobremesa larga',    desc: 'Además de lo que hacen Glotón y Reloj de arena, tu Reserva ya no baja con el tiempo, y ralentiza a los enemigos cercanos a ti un 2% por punto, hasta un 60%.' },
  { id: 'warthunder', slot: 'passive', a: 'orc_passive',  b: 'storm_passive', name: 'Trueno de guerra',   desc: 'Además de lo que hacen Sed de sangre y Conductor, con la Furia llena, cada disparo lanza además un rayo a otro enemigo cercano: 60% del daño del disparo. Ese rayo también clava las Agujas de Conductor, aunque no venga de una descarga.' },
  { id: 'chargedshade', slot: 'passive', a: 'shade_passive', b: 'storm_passive', name: 'Sombras cargadas', desc: 'Además de lo que hacen Séquito y Conductor, cada golpe de tus Sombras clava 1 Aguja. Cuando a una Sombra se le acaba el tiempo, descarga a hasta 4 enemigos de su alrededor (80% por Aguja).' },
  // Mareas
  { id: 'steam',     slot: 'basic',   a: 'dragon_basic',  b: 'tide_basic',   name: 'Vapor',              desc: 'Además de lo que hacen Colmillo al rojo y Oleaje, cuando un enemigo choca contra un muro, revientan todas sus Ascuas: 35% de daño por Ascua a los enemigos de alrededor. Él pierde las Ascuas, pero no recibe esa explosión.' },
  { id: 'ram',       slot: 'basic',   a: 'orc_basic',     b: 'tide_basic',   name: 'Ariete',             desc: 'Además de lo que hacen Tambor de guerra y Oleaje, cada vez que un enemigo choca contra un muro ganas 20 de Furia. Con la Furia llena, tus disparos empujan el doble.' },
  { id: 'reef',      slot: 'dodge',   a: 'stone_dodge',   b: 'tide_dodge',   name: 'Arrecife',           desc: 'Además de lo que hacen Geoda y Corriente, tus Cristales hacen de muro para los enemigos empujados: si uno choca con un Cristal, recibe el golpe contra el muro y el Cristal revienta (120% de daño a los de alrededor). Los jefes no se dejan empujar.' },
  { id: 'whirl',     slot: 'dodge',   a: 'time_dodge',    b: 'tide_dodge',   name: 'Remolino',           desc: 'Además de lo que hacen Hora muerta y Corriente, la corriente dura el doble y ralentiza un 40% a los enemigos que arrastra.' },
  { id: 'brine',     slot: 'passive', a: 'venom_passive', b: 'tide_passive', name: 'Salmuera',           desc: 'Además de lo que hacen Plaga y Marea alta, todo el Veneno que aplicas a un Empapado cuenta doble, también el que contagia Plaga. El tope sigue en 30.' },
  { id: 'drowned',   slot: 'passive', a: 'shade_passive', b: 'tide_passive', name: 'Ahogados',           desc: 'Además de lo que hacen Séquito y Marea alta, los enemigos que mueren Empapados se levantan como Sombras. Los jefes no.' },
  { id: 'winetide',  slot: 'charge',  a: 'feast_charge',  b: 'tide_charge',  name: 'Marea de vino',      desc: 'Además de lo que hacen Banquete y Maremoto, la ola del Maremoto te da 3 de Reserva por cada enemigo que alcanza y sigue en pie.' },
  { id: 'tsunami',   slot: 'charge',  a: 'storm_charge',  b: 'tide_charge',  name: 'Agua y rayo',        desc: 'Además de lo que hacen Sobretensión y Maremoto, la ola del Maremoto descarga las Agujas de todos los que alcanza y siguen en pie (80% por Aguja).' },
  // Fortuna
  { id: 'jackpot',   slot: 'passive', a: 'dragon_passive', b: 'luck_passive', name: 'Tesoro maldito',    desc: 'Además de lo que hacen Tesoro y Racha, cada crítico te da 1 de oro.' },
  { id: 'bones',     slot: 'passive', a: 'shade_passive', b: 'luck_passive', name: 'Tabas',              desc: 'Además de lo que hacen Séquito y Racha, tienes un 5% más de probabilidad de crítico por cada Sombra viva, también las de Relevo.' },
  { id: 'facet',     slot: 'basic',   a: 'stone_basic',   b: 'luck_basic',   name: 'Faceta',             desc: 'Además de lo que hacen Esquirla y Dado cargado, cada crítico deja un Cristal junto al enemigo.' },
  { id: 'snakeeyes', slot: 'basic',   a: 'venom_basic',   b: 'luck_basic',   name: 'Ojos de serpiente',  desc: 'Además de lo que hacen Ponzoña y Dado cargado, cada crítico duplica el Veneno del enemigo, hasta 30.' },
  { id: 'loaded',    slot: 'basic',   a: 'time_basic',    b: 'luck_basic',   name: 'Dado trucado',       desc: 'Además de lo que hacen Segundero y Dado cargado, cada eco tira su propio crítico, con tu misma probabilidad y aparte del disparo original. Si sale, hace daño de crítico y cuenta como crítico para todo lo demás.' },
  { id: 'toss',      slot: 'dodge',   a: 'feast_dodge',   b: 'luck_dodge',   name: 'Propina',            desc: 'Además de lo que hacen Brindis y Cara o cruz, cada vez que lanzas la moneda te curas un 5% de tu vida máxima, salga cara o cruz.' },
  { id: 'fork',      slot: 'dodge',   a: 'storm_dodge',   b: 'luck_dodge',   name: 'Rayo caprichoso',    desc: 'Además de lo que hacen Paso relámpago y Cara o cruz, si sale cruz, la moneda cae como un rayo: descarga las Agujas de todos los que alcanza su explosión (80% por Aguja) y luego les clava 2.' },
  { id: 'allin',     slot: 'charge',  a: 'orc_charge',    b: 'luck_charge',  name: 'Órdago',             desc: 'Además de lo que hacen Grito de guerra y Todo al rojo, el dado de Todo al rojo suma 1 por cada 34 de Furia que tengas al disparar (+2 con 68 o más), sin pasar de 6.' },
  { id: 'wager',     slot: 'charge',  a: 'tide_charge',   b: 'luck_charge',  name: 'Mar gruesa',         desc: 'Además de lo que hacen Maremoto y Todo al rojo, si el dado saca un 5 o un 6, la ola del Maremoto empuja el doble y aturde 1 s. A los jefes no les afecta.' },
  // Bosque
  { id: 'graveroot', slot: 'basic',   a: 'shade_basic',   b: 'wood_basic',   name: 'Raíz de tumba',      desc: 'Además de lo que hacen Marca de tumba y Semilla, cada vez que brotan las Semillas de un enemigo, sale una Sombra a su lado. Funciona también con jefes.' },
  { id: 'thornrod',  slot: 'basic',   a: 'storm_basic',   b: 'wood_basic',   name: 'Espina de cobre',    desc: 'Además de lo que hacen Aguja estática y Semilla, cada vez que brotan las Semillas de un enemigo, se descargan todas sus Agujas (80% por Aguja).' },
  { id: 'clover',    slot: 'basic',   a: 'luck_basic',    b: 'wood_basic',   name: 'Trébol',             desc: 'Además de lo que hacen Dado cargado y Semilla, cada crítico hace brotar al instante las Semillas del enemigo, aunque solo tenga una.' },
  { id: 'wildfire',  slot: 'charge',  a: 'dragon_charge', b: 'wood_charge',  name: 'Incendio',           desc: 'Además de lo que hacen Aliento y Zarzal, el zarzal arde: clava 1 Ascua por pulso a quien esté dentro.' },
  { id: 'perennial', slot: 'charge',  a: 'time_charge',   b: 'wood_charge',  name: 'Perenne',            desc: 'Además de lo que hacen Rebobinar y Zarzal, el zarzal dura el doble (10 s) y ralentiza un 80% en vez de un 50%.' },
  { id: 'nettle',    slot: 'dodge',   a: 'venom_dodge',   b: 'wood_dodge',   name: 'Ortiga',             desc: 'Además de lo que hacen Rastro y Enredadera, la enredadera aplica además 4 de Veneno al enemigo que enraíza.' },
  { id: 'uproot',    slot: 'dodge',   a: 'orc_dodge',     b: 'wood_dodge',   name: 'Descuaje',           desc: 'Además de lo que hacen Embestida y Enredadera, embestir a un enemigo enraizado le hace el triple de daño, le quita las Raíces y lo lanza lejos. A los jefes no los lanza.' },
  { id: 'mangrove',  slot: 'dodge',   a: 'tide_dodge',    b: 'wood_dodge',   name: 'Manglar',            desc: 'Además de lo que hacen Corriente y Enredadera, la enredadera deja Empapado 4 s al enemigo que enraíza. Y todas tus Raíces, vengan de donde vengan, duran el doble en los Empapados.' },
  { id: 'amber',     slot: 'passive', a: 'stone_passive', b: 'wood_passive', name: 'Ámbar',              desc: 'Además de lo que hacen Veta y Savia, los enemigos que mueren enraizados o entre zarzas dejan un Cristal.' },
  { id: 'orchard',   slot: 'passive', a: 'feast_passive', b: 'wood_passive', name: 'Huerto',             desc: 'Además de lo que hacen Glotón y Savia, te curas un 1% de tu vida máxima cada vez que golpeas a un enemigo enraizado. El daño continuo no cuenta, y estar entre zarzas tampoco.' },
  // Hielo (afines: Mareas, Tiempo, Minerales, Tormenta, Bosque)
  { id: 'glacier',   slot: 'basic',   a: 'stone_basic',   b: 'frost_basic',   name: 'Glaciar',           desc: 'Además de lo que hacen Esquirla y Aliento helado, cada enemigo que queda Congelado deja un Cristal a su lado.' },
  { id: 'hail',      slot: 'basic',   a: 'storm_basic',   b: 'frost_basic',   name: 'Granizo',           desc: 'Además de lo que hacen Aguja estática y Aliento helado, cuando un enemigo queda Congelado, se descargan todas sus Agujas (80% por Aguja).' },
  { id: 'iceberg',   slot: 'charge',  a: 'tide_charge',   b: 'frost_charge',  name: 'Témpano',           desc: 'Además de lo que hacen Maremoto y Quebrar, la ola del Maremoto deja Congelados al instante a los enemigos que ya estaban Empapados antes de que llegara. Los jefes quedan Congelados la mitad de tiempo.' },
  { id: 'stillness', slot: 'passive', a: 'time_passive',  b: 'frost_passive', name: 'Quietud',           desc: 'Además de lo que hacen Reloj de arena y Cero absoluto, los enemigos quedan Congelados 1,5 s más (3 s en vez de 1,5). Los jefes, la mitad.' },
  { id: 'frostthorn', slot: 'dodge',  a: 'wood_dodge',    b: 'frost_dodge',   name: 'Zarza de escarcha', desc: 'Además de lo que hacen Enredadera y Paso de hielo, la enredadera pone además 3 de Escarcha al enemigo que enraíza.' },
  // Sangre (afines: Manjares, Orcos, Veneno, Sombras)
  { id: 'warwound',  slot: 'basic',   a: 'orc_basic',     b: 'blood_basic',   name: 'Herida de guerra',  desc: 'Además de lo que hacen Tambor de guerra y Herida abierta, cada Herida que abres te da 3 de Furia. Con la Furia llena, las Heridas sangran el doble.' },
  { id: 'hemotoxin', slot: 'basic',   a: 'venom_basic',   b: 'blood_basic',   name: 'Hemotoxina',        desc: 'Además de lo que hacen Ponzoña y Herida abierta, las Heridas de los enemigos con Veneno sangran el doble.' },
  { id: 'bloodwine', slot: 'passive', a: 'feast_passive', b: 'blood_passive', name: 'Vino de sangre',    desc: 'Además de lo que hacen Glotón y Deuda, toda la vida que pagas vuelve como Reserva. Solo sirve si pagas vida: con Sangría en el disparo cargado o con la Gema de sangre.' },
  { id: 'bloodrite', slot: 'charge',  a: 'shade_charge',  b: 'blood_charge',  name: 'Rito rojo',         desc: 'Además de lo que hacen Orden y Sangría, los enemigos que mueren en los 0,7 s siguientes a tu disparo cargado (los mismos que te curan con Sangría) se levantan como Sombras. Los jefes no.' },
  // Final (afines: Tiempo, Dragones, Sombras, Fortuna)
  { id: 'deadline',  slot: 'basic',   a: 'time_basic',    b: 'end_basic',     name: 'Plazo vencido',     desc: 'Además de lo que hacen Segundero y Sentencia, el daño de tus ecos cuenta el doble para la Sentencia.' },
  { id: 'verdict',   slot: 'basic',   a: 'luck_basic',    b: 'end_basic',     name: 'Veredicto',         desc: 'Además de lo que hacen Dado cargado y Sentencia, un crítico cumple al instante la Sentencia que ya tuviera el enemigo, sumando el daño de ese crítico. Si es el propio crítico el que pone la Sentencia, no la gasta.' },
  { id: 'autodafe',  slot: 'charge',  a: 'dragon_charge', b: 'end_charge',    name: 'Auto de fe',        desc: 'Además de lo que hacen Aliento y Punto final, cuando tu disparo cargado cumple una Sentencia, le clava además 3 Ascuas al enemigo. Llegan después del estallido de Aliento, así que se quedan quemando.' },
  { id: 'obituary',  slot: 'passive', a: 'shade_passive', b: 'end_passive',   name: 'Obituario',         desc: 'Además de lo que hacen Séquito y Epitafio, si un enemigo muere al cumplirse su Sentencia, se levanta como Sombra. Los jefes no.' },
  // Luz (afines: Minerales, Tormenta, Dragones, Sombras)
  { id: 'lens',      slot: 'basic',   a: 'stone_basic',   b: 'light_basic',   name: 'Lente',             desc: 'Además de lo que hacen Esquirla y Señalar, tus Cristales Iluminan a los enemigos que tengan cerca, mientras sigan cerca.' },
  { id: 'beacon',    slot: 'basic',   a: 'storm_basic',   b: 'light_basic',   name: 'Faro',              desc: 'Además de lo que hacen Aguja estática y Señalar, todos tus rayos, los de las descargas y cualquier otro, Iluminan 6 s a quien alcanzan.' },
  { id: 'sunfire',   slot: 'passive', a: 'dragon_passive', b: 'light_passive', name: 'Sol de mediodía',  desc: 'Además de lo que hacen Tesoro y Sin sombra, las Ascuas queman el doble a los Iluminados.' },
  { id: 'eclipse',   slot: 'passive', a: 'shade_passive', b: 'light_passive', name: 'Eclipse',           desc: 'Además de lo que hacen Séquito y Sin sombra, para Sin sombra, cada Sombra viva cuenta como un Iluminado más (el tope sigue en seis). Y los golpes de tus Sombras Iluminan 6 s.' },
  // Sueño (afines: Veneno, Tiempo, Manjares, Hielo)
  { id: 'poppy',     slot: 'passive', a: 'venom_passive', b: 'dream_passive', name: 'Adormidera',        desc: 'Además de lo que hacen Plaga y Sonámbulos, cuando un enemigo llega a 10 de Veneno, se queda Dormido 3 s. A los jefes los deja Adormilados 1,5 s.' },
  { id: 'siesta',    slot: 'dodge',   a: 'time_dodge',    b: 'dream_dodge',   name: 'Siesta',            desc: 'Además de lo que hacen Hora muerta y Polvo de sueño, todo lo que Duerme a un enemigo lo Duerme el doble de tiempo, venga de donde venga.' },
  { id: 'digest',    slot: 'charge',  a: 'feast_charge',  b: 'dream_charge',  name: 'Digestión',         desc: 'Además de lo que hacen Banquete y Pesadilla, cada Dormido que alcanza tu disparo cargado te da 4 de Reserva.' },
  { id: 'hibernate', slot: 'basic',   a: 'frost_basic',   b: 'dream_basic',   name: 'Hibernar',          desc: 'Además de lo que hacen Aliento helado y Arrullo, cuando a un enemigo se le pasa el Congelado (o se lo rompes), se queda Dormido 2 s. A los jefes los deja Adormilados 1 s.' },
  // Vacío (afines: Mareas, Dragones, Orcos, Bosque)
  { id: 'maelstrom', slot: 'charge',  a: 'tide_charge',   b: 'void_charge',   name: 'Vorágine',          desc: 'Además de lo que hacen Maremoto y Singularidad, la ola del Maremoto lanza a los enemigos hacia el centro de la Singularidad (o del último pozo abierto) en vez de alejarlos de ti.' },
  { id: 'collapse',  slot: 'charge',  a: 'dragon_charge', b: 'void_charge',   name: 'Colapso',           desc: 'Además de lo que hacen Aliento y Singularidad, cuando la Singularidad se cierra, revienta las Ascuas de todos los enemigos que ha atrapado: 35% de daño por Ascua, en área.' },
  { id: 'funnel',    slot: 'dodge',   a: 'orc_dodge',     b: 'void_dodge',    name: 'Embudo',            desc: 'Además de lo que hacen Embestida y Hueco, el pozo de Hueco aturde 0,5 s a cada enemigo que llega a su centro, una vez por enemigo. Los jefes no.' },
  { id: 'thicket',   slot: 'passive', a: 'wood_passive',  b: 'void_passive',  name: 'Espesura',          desc: 'Además de lo que hacen Savia y Apiñados, Apiñados cuenta el doble contra enemigos enraizados o entre zarzas.' },
  // Espejos (afines: Sombras, Tiempo, Fortuna, Luz)
  { id: 'doubles',   slot: 'basic',   a: 'shade_basic',   b: 'mirror_basic',  name: 'Dobles',            desc: 'Además de lo que hacen Marca de tumba y Reflejo, cada vez que tu Reflejo dispara, cada una de tus Sombras dispara también al enemigo más cercano: 30% de daño, con tus efectos de disparo.' },
  { id: 'prismatic', slot: 'basic',   a: 'light_basic',   b: 'mirror_basic',  name: 'Prisma vivo',       desc: 'Además de lo que hacen Señalar y Reflejo, los disparos de tu Reflejo hacen el doble de daño a los Iluminados.' },
  { id: 'afterimage', slot: 'charge', a: 'time_charge',   b: 'mirror_charge', name: 'Imagen tardía',     desc: 'Además de lo que hacen Rebobinar y Doble, cuando Rebobinar repite tu disparo cargado, tu Reflejo también lo repite desde su lado, a la mitad de la fuerza de esa repetición.' },
  { id: 'luckglass', slot: 'passive', a: 'luck_passive',  b: 'mirror_passive', name: 'Espejo de la suerte', desc: 'Además de lo que hacen Racha y Azogue, cada golpe que recibes tiene un 33% de que se lo lleve el Reflejo: no pierdes vida ni la Racha. Azogue no rebota ese golpe.' },
  // Bestias (afines: Orcos, Veneno, Sangre, Bosque)
  { id: 'warhound',  slot: 'basic',   a: 'orc_basic',     b: 'beast_basic',   name: 'Perro de guerra',   desc: 'Además de lo que hacen Tambor de guerra y Sabueso, cada mordisco te da 4 de Furia. Con la Furia llena, tus perros muerden el doble de rápido.' },
  { id: 'rabid',     slot: 'basic',   a: 'venom_basic',   b: 'beast_basic',   name: 'Rabia',             desc: 'Además de lo que hacen Ponzoña y Sabueso, cada mordisco de tus perros aplica 2 de Veneno a su presa.' },
  { id: 'bloodhound', slot: 'dodge',  a: 'blood_dodge',   b: 'beast_dodge',   name: 'Rastro de sangre',  desc: 'Además de lo que hacen Transfusión y Manada, la embestida de Manada abre 2 Heridas a cada enemigo que alcanza y te cura un 2% de tu vida máxima por cada uno.' },
  { id: 'wolfthorn', slot: 'charge',  a: 'wood_charge',   b: 'beast_charge',  name: 'Lobo entre zarzas', desc: 'Además de lo que hacen Zarzal y ¡A por él!, el salto del sabueso deja enraizados 1,5 s a todos los que alcanza (a los jefes, mucho menos).' },
  // Forja (afines: Dragones, Minerales, Orcos, Tormenta)
  { id: 'forgefire', slot: 'basic',   a: 'dragon_basic',  b: 'forge_basic',   name: 'Fuego de fragua',   desc: 'Además de lo que hacen Colmillo al rojo y Temple, con 5 o más de Temple, cada disparo clava 1 Ascua más.' },
  { id: 'whetstone', slot: 'passive', a: 'stone_passive', b: 'forge_passive', name: 'Piedra de amolar',  desc: 'Además de lo que hacen Veta y Maestro armero, cada Cristal que haya en la sala cuenta como 1 punto más de Temple (+3% de daño cada uno), aunque no lleves la técnica Temple ni tengas Temple propio, y puede pasar de tu máximo. Cuentan también para Recalentar y para el dúo Fuego de fragua.' },
  { id: 'warhammer', slot: 'charge',  a: 'orc_charge',    b: 'forge_charge',  name: 'Martillo de guerra', desc: 'Además de lo que hacen Grito de guerra y Martillazo, el Martillazo crece con la Furia que tienes al disparar, hasta el doble de tamaño con la Furia llena, y te da 2 de Temple por enemigo golpeado en vez de 1.' },
  { id: 'quench',    slot: 'dodge',   a: 'storm_dodge',   b: 'forge_dodge',   name: 'Templar al rayo',   desc: 'Además de lo que hacen Paso relámpago y Al rojo, cada disparo al rojo clava 2 Agujas al enemigo.' },
];
// Técnicas extra: no ocupan ranura. rar: 1 rara, 2 épica, 3 legendaria. Lo que necesita cada una para servir está en 13_needs.js.
const TECHS = [
  { id: 'd_blood',   god: 'dragon', rar: 1, name: 'Sangre de dragón',  desc: 'Todas tus explosiones, vengan de donde vengan, son un 30% más grandes y clavan 2 Ascuas a cada enemigo que alcanzan. Solo sirve si tienes algo que explote.' },
  { id: 'd_pyre',    god: 'dragon', rar: 2, name: 'Pira',              desc: 'Los enemigos que mueren con Ascuas explotan: 30% de daño por cada Ascua que tenían, y la explosión clava la mitad de esas Ascuas a los que alcanza.' },
  { id: 'm_reson',   god: 'stone',  rar: 1, name: 'Resonancia',        desc: 'Cada vez que algo tuyo explota, el Cristal más cercano (si está a pocos pasos) estalla también: 60% de daño en un área pequeña. El Cristal no se rompe. Solo sirve si tienes Cristales y algo que explote.' },
  { id: 'm_quartz',  god: 'stone',  rar: 2, name: 'Cuarzo vivo',       desc: 'Donde muere un enemigo nace un Cristal, y todos tus Cristales duran el doble (18 s).' },
  { id: 'v_vapors',  god: 'venom',  rar: 1, name: 'Vapores',           desc: 'Todas tus explosiones, vengan de donde vengan, aplican 3 de Veneno a cada enemigo que alcanzan. Solo sirve si tienes algo que explote.' },
  { id: 'v_syn',     god: 'venom',  rar: 2, name: 'Organismo débil',   desc: 'Los enemigos con Veneno reciben un 3% más de todo el daño por cada punto de Veneno, hasta +90% con 30.' },
  { id: 'f_cellar',  god: 'feast',  rar: 1, name: 'Bodega',            desc: 'Tu Reserva máxima pasa de 30 a 60.' },
  { id: 'f_carve',   god: 'feast',  rar: 2, name: 'Trinchar',          desc: 'Cuando un golpe tuyo deja a un enemigo por debajo del 12% de vida, lo remata. El daño continuo (Ascuas, Veneno, Heridas) no remata. No funciona con jefes.' },
  { id: 'o_drums',   god: 'orc',    rar: 1, name: 'Tambores lejanos',  desc: 'Ganas 8 de Furia cada vez que algo tuyo explota y 10 con cada baja.' },
  { id: 'o_berserk', god: 'orc',    rar: 3, name: 'Berserker',         desc: 'Con la Furia llena, disparar no te frena: andas a toda velocidad mientras disparas, tensas o giras la manivela. Cargar el disparo cargado sí te sigue frenando.' },
  { id: 't_overtime', god: 'time',  rar: 1, name: 'Prórroga',          desc: 'Tus ecos y repeticiones llegan en la mitad de tiempo: el de Segundero a los 0,75 s y el de Rebobinar al segundo. Solo sirve si llevas algo que deje eco.' },
  { id: 't_paradox', god: 'time',   rar: 3, name: 'Paradoja',          desc: 'Cada eco de Segundero deja a su vez otro eco 1,5 s después, al 60% del daño del primero. Ese segundo eco ya no se repite.' },
  { id: 's_guard',   god: 'shade',  rar: 1, name: 'Guardia de honor',  desc: 'Tus Sombras destruyen los proyectiles enemigos que tocan.' },
  { id: 's_legion',  god: 'shade',  rar: 2, name: 'Legión',            desc: 'Puedes tener 3 Sombras más a la vez, y duran el doble (18 s). Las de Relevo duran lo mismo.' },
  { id: 'r_over',    god: 'storm',  rar: 2, name: 'Sobrecarga',        desc: 'Cuando un enemigo llega a 6 Agujas, se descargan solas: 100% de daño por Aguja y un rayo por Aguja a otros enemigos.' },
  // Ofrendas: técnicas sueltas que sirven aunque no lleves nada más de esa deidad
  { id: 'd_warm',    god: 'dragon', rar: 1, name: 'Aliento tibio',     desc: 'Uno de cada cuatro disparos clava 1 Ascua. Sirve aunque no lleves nada de Dragones.' },
  { id: 'm_skin',    god: 'stone',  rar: 1, name: 'Piel de piedra',    desc: 'Recibes un 10% menos de daño.' },
  { id: 'v_slow',    god: 'venom',  rar: 1, name: 'Toxina lenta',      desc: 'Uno de cada tres disparos aplica 1 de Veneno. Sirve aunque no lleves nada de Veneno.' },
  { id: 'f_appet',   god: 'feast',  rar: 1, name: 'Buen apetito',      desc: 'Cada baja te cura un 1% de tu vida máxima.' },
  { id: 'o_scars',   god: 'orc',    rar: 1, name: 'Cicatrices',        desc: 'Con menos de la mitad de vida haces un 15% más de daño.' },
  { id: 't_second',  god: 'time',   rar: 1, name: 'Un segundo más',    desc: 'Tu esquive se recarga un 20% antes.' },
  { id: 's_last',    god: 'shade',  rar: 1, name: 'Último servicio',   desc: 'El primer enemigo que matas en cada sala se levanta como Sombra y pelea por ti. Los jefes no.' },
  { id: 'r_spark',   god: 'storm',  rar: 1, name: 'Chispa',            desc: 'Uno de cada cinco disparos lanza un rayo a otro enemigo cercano: 60% del daño del disparo. No hacen falta Agujas.' },
  { id: 'w_brine',   god: 'tide',   rar: 1, name: 'Salitre',           desc: 'Uno de cada cuatro disparos empuja al enemigo con fuerza, y puede estamparlo contra un muro. A los jefes no los mueve.' },
  { id: 'w_deep',    god: 'tide',   rar: 2, name: 'Mar de fondo',      desc: 'Cuando un enemigo choca contra un muro, queda aturdido 1,4 s en vez de 0,7 y te da 1 de oro.' },
  { id: 'l_coin',    god: 'luck',   rar: 1, name: 'Moneda de la suerte', desc: 'Tus disparos tienen un 8% más de probabilidad de ser crítico (250% de daño). Sirve aunque no lleves nada de Fortuna.' },
  { id: 'l_jack',    god: 'luck',   rar: 3, name: 'Premio gordo',      desc: 'Si un crítico mata, el enemigo revienta: 150% de daño en área y 3 de oro.' },
  { id: 'b_thorn',   god: 'wood',   rar: 1, name: 'Espina',            desc: 'Uno de cada cinco disparos deja enraizado al enemigo 0,8 s (a los jefes, mucho menos).' },
  { id: 'b_bloom',   god: 'wood',   rar: 2, name: 'Floración',         desc: 'Los enemigos que mueren enraizados dejan un zarzal de 3 s: quien esté dentro va a la mitad de velocidad y recibe 20% de daño por pulso.' },
  { id: 'i_rime',    god: 'frost',  rar: 1, name: 'Rocío helado',      desc: 'Uno de cada cuatro disparos pone 1 de Escarcha. Sirve aunque no lleves nada de Hielo.' },
  { id: 'i_shatter', god: 'frost',  rar: 2, name: 'Astillas',          desc: 'Los enemigos que mueren Congelados lanzan esquirlas a hasta cuatro enemigos cercanos: 40% de daño a cada uno.' },
  { id: 'h_warm',    god: 'blood',  rar: 1, name: 'Sangre caliente',   desc: 'Con menos de la mitad de vida, cada baja te cura un 2% de tu vida máxima.' },
  { id: 'h_frenzy',  god: 'blood',  rar: 3, name: 'Marea roja',        desc: 'Con menos del 30% de vida disparas un 40% más rápido.' },
  { id: 'e_ink',     god: 'end',    rar: 1, name: 'Tinta fresca',      desc: 'Uno de cada cuatro disparos pone una Sentencia al enemigo, si no tiene ya una. Sin la técnica Sentencia, devuelve el 40% del daño acumulado.' },
  { id: 'e_seal',    god: 'end',    rar: 2, name: 'Sello',             desc: 'Cuando se cumple una Sentencia, el enemigo queda aturdido 0,5 s. Los jefes no. Solo sirve si pones Sentencias.' },
  { id: 'u_glint',   god: 'light',  rar: 1, name: 'Primer rayo',       desc: 'El primer golpe que le das a cada enemigo lo Ilumina 6 s. Solo sirve si llevas algo que aproveche a los Iluminados, como Señalar o Sin sombra.' },
  { id: 'u_halo',    god: 'light',  rar: 2, name: 'Halo',              desc: 'Los Iluminados que mueren estallan en luz: 100% de daño en área.' },
  { id: 'z_yawn',    god: 'dream',  rar: 1, name: 'Bostezo',           desc: 'Los tres primeros enemigos de cada sala aparecen Dormidos durante 4,6 s. Los jefes no.' },
  { id: 'z_night',   god: 'dream',  rar: 2, name: 'Mala noche',        desc: 'Cuando un enemigo se despierta, va a la mitad de velocidad durante 2 s. Solo sirve si Duermes enemigos.' },
  { id: 'o_tug',     god: 'void',   rar: 1, name: 'Tirón',             desc: 'Uno de cada cuatro disparos atrae hacia el objetivo a los enemigos que tenga cerca. A los jefes no los mueve.' },
  { id: 'o_crush',   god: 'void',   rar: 2, name: 'Aplastar',          desc: 'Los enemigos en el mismo centro de un pozo reciben el doble de su daño por pulso. Solo sirve con pozos que hacen daño, como Singularidad.' },
  { id: 'q_shard',   god: 'mirror', rar: 1, name: 'Esquirla de espejo', desc: 'Uno de cada cinco disparos se repite contra el mismo enemigo, al 50% de daño y sin tus efectos de disparo.' },
  { id: 'q_break',   god: 'mirror', rar: 2, name: 'Siete años',        desc: 'Cuando te golpean, tu siguiente disparo hace el triple de daño.' },
  { id: 'a_pup',     god: 'beast',  rar: 1, name: 'Cachorro',          desc: 'Un perro te acompaña y muerde cada 0,8 s al enemigo que disparas: 30% de tu daño, con tus efectos de disparo. Tus disparos hacen un 15% más a su presa. Empieza de cachorro y crece con la Caza, como cualquier otro. Si ya tienes perro, no se suma.' },
  { id: 'a_feral',   god: 'beast',  rar: 2, name: 'Sed de caza',       desc: 'Te curas 2 por cada presa que remata uno de tus perros de un mordisco. Los enemigos de alrededor que alcanza el lobo alfa no cuentan.' },
  { id: 'g_whet',    god: 'forge',  rar: 1, name: 'Bien afilada',      desc: 'Haces un 8% más de daño.' },
  { id: 'g_slag',    god: 'forge',  rar: 2, name: 'Recalentar',        desc: 'Con el Temple al máximo, cada disparo salpica a los enemigos de alrededor del objetivo: 30% del daño, en un área pequeña.' },
  { id: 'r_judge',   god: 'storm',  rar: 3, name: 'Juicio',            desc: 'Cada vez que descargas a un enemigo, cae un rayo del cielo sobre él: 300% de daño en área.' },
];
const RAR = [{ name: 'Común', color: '#a3a9bd' }, { name: 'Rara', color: '#6fb7ff' }, { name: 'Épica', color: '#c98bff' }, { name: 'Legendaria', color: '#ffd24a' }];
// Maestría: llevar a la misma deidad en 3 acciones (los dúos cuentan para las dos).
const MASTERY = {
  dragon: { name: 'Heredera del fuego',    desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): las Ascuas se acumulan hasta 20 por enemigo, en vez de 8, y queman un 50% más.' },
  stone:  { name: 'Corazón de la montaña', desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): puedes tener 12 Cristales a la vez, en vez de 6, y Veta repite cada disparo desde los dos Cristales más cercanos.' },
  venom:  { name: 'Paciente cero',         desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): el Veneno hace daño el doble de rápido: cada 0,25 s en vez de cada 0,5 s.' },
  feast:  { name: 'Invitado de honor',     desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): todas tus curaciones son un 50% mayores.' },
  orc:    { name: 'Caudillo',              desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): la Furia nunca baja de 50, ni siquiera al gastarla con el grito.' },
  time:   { name: 'Dueño de la hora',      desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): los ecos de Segundero y la repetición de Rebobinar hacen el 100% del daño original.' },
  shade:  { name: 'Reina de los muertos',  desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): tus Sombras hacen un 50% más de daño y duran un 50% más (13,5 s en vez de 9).' },
  tide:   { name: 'Señor del abismo',      desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): cada golpe contra el muro suelta además una ola: 150% de tu daño en área, y empapa 4 s a los enemigos de alrededor.' },
  luck:   { name: 'La casa siempre gana',  desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): tus críticos hacen el 400% del daño en vez del 250%.' },
  wood:   { name: 'Corazón del bosque',    desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): todas las Raíces duran el doble y, al brotar, dejan dos Semillas ya plantadas en el enemigo.' },
  frost:  { name: 'Invierno eterno',       desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): los enemigos quedan Congelados el doble de tiempo (3 s en vez de 1,5).' },
  blood:  { name: 'Cobro final',           desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): cada enemigo que muere con Heridas te cura un 2% de tu vida máxima.' },
  end:    { name: 'Letra pequeña',         desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): las Sentencias se cumplen a los 3 s en vez de a los 5.' },
  light:  { name: 'Mediodía',              desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): los Iluminados ya no dejan de estarlo.' },
  dream:  { name: 'Sueño profundo',        desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): los Dormidos aguantan un golpe sin despertarse, y ese golpe también se lleva el extra de daño.' },
  void:   { name: 'Horizonte',             desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): tus pozos son un 40% más grandes y duran un segundo más.' },
  mirror: { name: 'Sala de espejos',       desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): tienes un segundo Reflejo, a un lado del enemigo.' },
  beast:  { name: 'Jauría',                desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): tienes un segundo perro, y los dos llegan a lobo alfa con 25 de Caza (sin la maestría, solo el primero).' },
  forge:  { name: 'Obra maestra',          desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): tu máximo de Temple sube 5 puntos y ya no lo pierdes al recibir golpes.' },
  storm:  { name: 'Tormenta perfecta',     desc: 'Con técnicas suyas en 3 de tus 4 acciones (un dúo cuenta para sus dos deidades): si un rayo de descarga alcanza a un enemigo con Agujas, también se las descarga, en cadena (cada enemigo, una vez por cadena).' },
};
// Planos: mejoras de los guanteletes que salen durante la partida (jefes y tienda).
const PLANS = [
  { id: 'echo',    name: 'Guantelete gemelo', desc: 'Al esquivar dejas un guantelete gemelo donde estabas durante 3 s. Dispara solo al enemigo más cercano a tu cadencia, al 50% de tu daño base y con tus efectos de disparo, pero sin críticos, ecos ni Sentencias.' },
  { id: 'tempo',   name: 'Compás',        desc: 'El ¡Compás! funciona con cualesquiera dedos que disparen a pulsaciones (no con los Dedos de retén, los Dedos tensos ni los Dedos de molinete) y duplica el daño de ese disparo en vez de darle +50%. Tienes que pulsar justo cuando los guanteletes vuelven a estar listos: mantener pulsado o machacar el botón no cuenta.' },
  { id: 'mortar',  name: 'Mortero',       desc: 'Solo con la Brasa de rayo. Tu disparo cargado ya no es un rayo: lanza un proyectil que pasa por encima de los muros y explota donde apuntas, con el 80% de su daño en área y todos sus efectos. Con Aliento ya no se abre en cono.', only: 'c_beam' },
  { id: 'recoil',  name: 'Retroceso',     desc: 'Tu disparo cargado te lanza hacia atrás con un esquive gratis: no gasta carga, te hace intocable y activa tus técnicas de esquive (salvo Cara o cruz). Además, se recarga un 35% antes. No funciona con la Brasa de embestida ni con la de trueno.' },
  { id: 'double',  name: 'Doble esquive', desc: 'Tienes una carga más de esquive.' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

// ───────────────────────── Lo permanente: los guanteletes por piezas y el árbol ─────────────────────────
// Los guanteletes de Alec (así lanza sus conjuros) son un montaje de cinco piezas. Las claves internas (barrel, action, mag, stock, chamber) son las de antes.
// Cada una decide una cosa distinta, así que cualquier combinación funciona.
// Las piezas se descubren jugando (jefes, vetas de hierro, tienda). Al encontrarlas puedes montarlas en esa partida;
// para empezar las partidas con ellas hay que forjarlas una vez. base: las que tienes desde el principio.
const GSLOTS = { barrel: 'Palma', action: 'Dedos', mag: 'Gema', stock: 'Brazal', chamber: 'Brasa' };
const GSLOT_KEYS = Object.keys(GSLOTS), GSLOT_WHAT = { barrel: 'a quién alcanza el conjuro', action: 'cómo lanzas', mag: 'qué hace cada disparo', stock: 'cómo te mueves y aguantas', chamber: 'qué hace el disparo cargado' };
// tag: lo que esa pieza tiene de especial, en tres palabras. Se enseña en la forja y al encontrarla.
const PARTS = [
  { id: 'b_long',    slot: 'barrel',  name: 'Palma de cadena',      tag: 'Remata y salta',     desc: 'Lanza la cadena a tu objetivo. Si está a más de la mitad de tu alcance, hace un 40% más de daño. Si lo mata, el disparo salta al enemigo más cercano al caído con el daño normal (sin ese 40%), y si también lo mata vuelve a saltar, hasta tres saltos. Solo salta a enemigos que estén a poca distancia del que cae.', base: true },
  { id: 'b_short',   slot: 'barrel',  name: 'Palma presta',            tag: 'Golpea tras esquivar',        desc: 'Disparas un 25% más rápido, pero con un 30% menos de alcance. Al terminar un esquive, los guanteletes quedan listos: si disparas en los 1,2 s siguientes, ese disparo sale sin frenazo y hace el doble de daño.', cost: { iron: 1, orc: 2 } },
  { id: 'b_twin',    slot: 'barrel',  name: 'Palmas gemelas',   tag: 'Dos blancos a la vez', desc: 'Cada disparo da a tu objetivo y, casi a la vez, al enemigo más cercano a ti que tengas a tiro, con el 55% del daño a cada uno. Si solo hay un enemigo a tiro, recibe los dos (110% en total). Un 25% menos de alcance.', cost: { iron: 1, storm: 2 } },
  { id: 'b_scatter', slot: 'barrel',  name: 'Palma de abanico',              tag: 'Empuja contra el muro', desc: 'Dispara seis chispas en abanico; cada una da al primer enemigo que encuentre, con el 36% del daño. La mitad de alcance. Cada chispa empuja: si al menos dos dan al mismo enemigo y choca contra un muro, recibe el golpe (90% del daño) y queda aturdido. No empuja a los jefes.', cost: { iron: 2, feast: 2 } },
  { id: 'b_pierce',  slot: 'barrel',  name: 'Palma de venablo',            tag: 'Atraviesa y rebota', desc: 'El disparo sigue en línea recta y da a todos los enemigos que cruza hasta chocar con un muro. Si el muro está dentro de su alcance, rebota una vez y da a los que encuentre de vuelta, así que un enemigo puede recibir dos golpes. +30% de alcance, pero todos tus disparos hacen un 10% menos de daño.', cost: { iron: 2, stone: 2 } },
  { id: 'b_bomb',    slot: 'barrel',  name: 'Palma de volcán',             tag: 'Orbes por lo alto',  desc: 'Lanza por lo alto un orbe que cae donde estaba tu objetivo al disparar; tarda un momento en llegar, así que puede fallar si se mueve. Al caer, hace el 80% del daño a cada enemigo cercano, con todos tus efectos de disparo, también a los que estén detrás de un muro. No necesitas ver a tu objetivo: como el orbe pasa por encima de los muros, puedes apuntar a enemigos que estén detrás de uno, siempre que estén dentro de tu alcance. Un 10% más de alcance, pero disparas un 35% más despacio.', cost: { iron: 2, dragon: 2 } },
  { id: 'b_spike',   slot: 'barrel',  name: 'Palma de lanza',                 tag: 'Estocada que atraviesa', desc: 'No dispara: cada ataque es una estocada que hace el 180% del daño y te lanza a través de tu objetivo, sin recibir daño mientras dura. Cuenta como un esquive que lo atraviesa, pero no gasta esquive ni activa casi nada de lo que pasa al esquivar. La mitad de alcance: tienes que estar cerca. Frena menos que un disparo, y si la estocada mata, puedes atacar otra vez al instante.', cost: { iron: 2, shade: 2 } },
  { id: 'b_fork',    slot: 'barrel',  name: 'Palma de tridente',    tag: 'Tres en abanico',         desc: 'Dispara tres veces a la vez: uno a tu objetivo y dos en diagonal a los lados, que dan al primer enemigo que encuentren en su línea (si no hay ninguno, se pierden). Cada uno hace el 60% del daño. Un 10% menos de alcance.', cost: { iron: 2, luck: 2 } },
  { id: 'b_harpoon', slot: 'barrel',  name: 'Palma de arpón',                tag: 'Atrae al enemigo',    desc: 'El disparo engancha a tu objetivo y lo arrastra hacia ti; cuanto más lejos está, más fuerte tira. No arrastra a los jefes ni a los que ya tienes pegados, y mientras lo arrastras no puede chocar contra un muro. Todos tus disparos hacen un 15% más de daño.', cost: { iron: 1, tide: 2 } },
  { id: 'b_flame',   slot: 'barrel',  name: 'Palma de fuelle',       tag: 'Chorro que quema',     desc: 'Lanza un chorro en cono que da a todos los enemigos que tienes delante (la mitad del daño a cada uno) y les clava 1 Ascua. No pasa los muros. Disparas un 40% más rápido, pero con un 58% menos de alcance.', cost: { iron: 2, dragon: 3 } },
  { id: 'b_back',    slot: 'barrel',  name: 'Palma de dos caras',   tag: 'Cubre tu espalda',   desc: 'Cada disparo da a tu objetivo y, a la vez, al enemigo más cercano que tengas a tiro detrás de ti (en sentido contrario a donde apuntas). Los dos reciben todo el daño. Si no hay nadie detrás, solo das a tu objetivo.', cost: { iron: 2, shade: 2 } },
  { id: 'b_flail',   slot: 'barrel',  name: 'Palma de mangual',              tag: 'Bola que te rodea',  desc: 'Una bola de hierro gira siempre pegada a ti y golpea a cada enemigo que toca (70% del daño, como mucho una vez cada medio segundo al mismo). Esos golpes no reciben las bonificaciones de tus dedos. Al disparar, lanzas la bola contra tu objetivo (150%) y durante un segundo deja de girar a tu alrededor. Disparas un 20% más despacio.', cost: { iron: 2, orc: 3 } },
  { id: 'b_boom',    slot: 'barrel',  name: 'Palma de hoz',       tag: 'Va y vuelve',        desc: 'Lanzas una hoz en línea recta hasta un poco más allá de tu objetivo (o hasta un muro), y vuelve un instante después. Daña a todos los que cruza, a la ida y a la vuelta (70% cada pasada), así que un mismo enemigo puede recibir dos golpes. Disparas un 20% más despacio y con un 15% menos de alcance.', cost: { iron: 2, wood: 2 } },
  { id: 'b_nail',    slot: 'barrel',  name: 'Palma de espinas',              tag: 'Cuarta espina revienta', desc: 'Dispara espinas (75% del daño) que se quedan clavadas en el enemigo y no caducan. A la cuarta espina en el mismo enemigo, revientan: recibe un golpe extra del triple del daño del disparo, sin tus efectos de disparo. Disparas un 20% más rápido.', cost: { iron: 1, storm: 2 } },
  { id: 'b_arc',     slot: 'barrel',  name: 'Palma de eslabones',   tag: 'Salta entre cuatro', desc: 'El disparo da a tu objetivo y salta al enemigo más cercano que esté a poca distancia, y así hasta dar a cuatro distintos. Cada salto hace un 20% menos que el anterior (100%, 80%, 64% y 51%). Los saltos pasan por encima de los muros.', cost: { iron: 2, storm: 3 } },
  { id: 'b_far',     slot: 'barrel',  name: 'Palma de vigía',           tag: 'De lejos, el doble', desc: 'El doble de daño a los enemigos lejanos (a más de dos tercios de tu alcance) y la mitad a los cercanos (a menos del 30% de tu alcance). Entre medias, daño normal. +25% de alcance.', cost: { iron: 1, light: 2 } },
  { id: 'b_swarm',   slot: 'barrel',  name: 'Palma de avispero',             tag: 'Tres centellas al azar', desc: 'Cada disparo lanza tres centellas seguidas, cada una a un enemigo distinto elegido al azar entre los que tienes a tiro (45% del daño cada una). Si hay menos de tres enemigos, las centellas que sobran van a tu objetivo.', cost: { iron: 1, beast: 2 } },
  // Piezas temáticas: cada una hace por sí sola un poco de lo que hace una deidad, y con técnicas de esa deidad va a más
  { id: 'b_blow',    slot: 'barrel',  name: 'Palma de víbora',            tag: 'Disparos con Veneno',  desc: 'Cada disparo pone 1 de Veneno al enemigo si sobrevive, aunque no lleves técnicas de Veneno. Si llevas la técnica Ponzoña, el Veneno que pone en cada disparo se duplica. Todos tus disparos hacen un 15% menos de daño.', cost: { iron: 1, venom: 3 }, theme: 'venom' },
  { id: 'b_wyrm',    slot: 'barrel',  name: 'Palma de sierpe',       tag: 'Clava Ascuas',       desc: 'Cada disparo clava 1 Ascua al enemigo si sobrevive, aunque no lleves técnicas de Dragones. Si llevas alguna técnica de Dragones, los enemigos aguantan 4 Ascuas más antes de llegar al tope (12 en vez de 8).', cost: { iron: 1, dragon: 3 }, theme: 'dragon' },
  { id: 'b_rod',     slot: 'barrel',  name: 'Palma de cobre',        tag: 'Clava Agujas',       desc: 'Cada disparo clava 1 Aguja al enemigo si sobrevive (2 si llevas alguna técnica de Tormenta), aunque no lleves técnicas de Tormenta. Al juntar 6, el enemigo se descarga solo.', cost: { iron: 1, storm: 3 }, theme: 'storm' },
  { id: 'b_icicle',  slot: 'barrel',  name: 'Palma de carámbano',            tag: 'Pone Escarcha',      desc: 'Cada disparo pone 1 de Escarcha al enemigo si sobrevive (2 si llevas alguna técnica de Hielo), aunque no lleves técnicas de Hielo. Contra enemigos Congelados hace un 30% más de daño; mientras siguen Congelados, no acumulan más Escarcha.', cost: { iron: 1, frost: 3 }, theme: 'frost' },
  { id: 'b_horn',    slot: 'barrel',  name: 'Palma de bramido',     tag: 'Aturde en cono',     desc: 'Suelta un bramido en cono que da a todos los enemigos que tienes delante (40% del daño a cada uno) y los deja aturdidos un instante (0,35 s). No pasa los muros y no aturde a los jefes. Un 45% menos de alcance.', cost: { iron: 1, dream: 2 } },
  { id: 'b_drill',   slot: 'barrel',  name: 'Palma de berbiquí',             tag: 'Insistir pega más',  desc: 'Cada disparo seguido al mismo enemigo hace un 15% más de daño que el anterior, hasta +150% tras diez seguidos. Si disparas a otro enemigo, vuelve a empezar.', cost: { iron: 2, forge: 2 } },
  { id: 'b_ghost',   slot: 'barrel',  name: 'Palma fantasma',       tag: 'Atraviesa muros',    desc: 'Puedes apuntar y disparar a enemigos que están al otro lado de los muros, sin verlos, tanto si los guanteletes los eligen solos como si los fijas tú. Todos tus disparos hacen un 15% menos de daño.', cost: { iron: 2, shade: 3 } },
  { id: 'b_net',     slot: 'barrel',  name: 'Palma de red',          tag: 'Enraíza al enemigo',             desc: 'Cada disparo hace el 65% del daño y lanza una red que deja al enemigo enraizado 0,9 s. Cada enemigo solo puede quedar atrapado una vez cada 3 s; a los jefes los atrapa solo un tercio de ese tiempo.', cost: { iron: 1, beast: 2 } },
  { id: 'b_ends',    slot: 'barrel',  name: 'Palma de dos distancias', tag: 'Cerca y lejos',   desc: 'Cada disparo da a la vez al enemigo más cercano y al más lejano que tengas a tiro, con el 80% del daño a cada uno, apuntes a quien apuntes. Si solo hay un enemigo, recibe un único disparo (80%).', cost: { iron: 2, light: 2 } },
  { id: 'b_cluster', slot: 'barrel',  name: 'Palma de racimo',      tag: 'Tres a la vez',       desc: 'Cada disparo lanza tres cadenas a la vez: una a tu objetivo y otra a cada uno de los dos enemigos más cercanos que tengas a tiro. Cada cadena hace el 60% del daño.', cost: { iron: 2, luck: 2 } },
  { id: 'b_hydra',   slot: 'barrel',  name: 'Palma de hidra',       tag: 'A todos a la vez',    desc: 'Cada disparo lanza una cadena a cada enemigo que tengas a tiro, hasta seis a la vez. Cada cadena hace el 35% del daño.', cost: { iron: 2, storm: 3 } },
  { id: 'a_fuse',    slot: 'action',  name: 'Dedos de rescoldo',          tag: 'Sale con retraso',   desc: 'El disparo sale solo medio segundo después de pulsar, sin frenazo, contra el enemigo al que apuntabas (o el más cercano si ya ha muerto). Todos tus disparos hacen un 45% más de daño. Si estás esquivando justo cuando sale, se pierde. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, wood: 2 } },
  { id: 'a_auto',    slot: 'action',  name: 'Dedos inquietos',      tag: 'Disparan solos',       desc: 'Los guanteletes disparan solos, sin pulsar, siempre que tienes un enemigo a tiro. Cada disparo te frena igual que si pulsaras. Todos tus disparos hacen un 20% menos de daño. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, luck: 2 } },
  { id: 'a_pend',    slot: 'action',  name: 'Dedos de péndulo',     tag: 'Racha de Compás',   desc: 'Cada disparo a Compás suma un 15% de daño por cada Compás seguido que llevas, contando ese: +15%, +30%… hasta +90% al sexto. Sustituye al +50% normal del Compás, así que los primeros pegan menos que con los Dedos de compás. Un disparo fuera de Compás no tiene bonificación y reinicia la racha.', cost: { iron: 2, time: 3 } },
  { id: 'a_hold',    slot: 'action',  name: 'Dedos de retén',       tag: 'Guarda y suelta',    desc: 'Mantén pulsado para guardar disparos: 1 al empezar, 2 a media carga y 3 con la carga llena (unos 2,3 s con la cadencia base). Al soltar, salen todos seguidos, cada uno con todo el daño y sin frenazo. Mientras cargas andas al 40%. Nunca hace Compás.', cost: { iron: 2, feast: 2 } },
  { id: 'a_spring',  slot: 'action',  name: 'Dedos de resorte',     tag: 'Esperar pega más',   desc: 'Cuanto más tiempo tienes los guanteletes listos sin disparar, más daño hace el siguiente disparo: +50% por segundo, hasta el triple a los 4 s. Empieza a contar cuando los guanteletes han recargado y vuelve a cero con cada disparo. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, end: 2 } },
  { id: 'a_alt',     slot: 'action',  name: 'Dedos alternos',        tag: 'Uno flojo, uno fuerte', desc: 'Alterna dos disparos, empezando por el flojo: uno flojo (60% del daño) que casi no te frena y uno fuerte (180%) con el doble de frenazo. La cadencia no cambia. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, mirror: 2 } },
  { id: 'a_combo',   slot: 'action',  name: 'Dedos de insistencia', tag: 'Mismo blanco, más rápido', desc: 'Cada disparo seguido al mismo enemigo hace que el siguiente salga un 8% más rápido, hasta +64% tras ocho seguidos. Si disparas a otro enemigo, vuelve a empezar. Sin Compás, salvo con el plano Compás.', cost: { iron: 2, beast: 2 } },
  { id: 'a_rider',   slot: 'action',  name: 'Dedos de jinete',      tag: 'Dispara al esquivar', desc: 'Cada vez que esquivas, los guanteletes disparan solos al enemigo más cercano a tiro con un 30% más de daño. No gasta tu disparo ni espera a que recargue. Ese disparo no cuenta para el Compás ni para lo que cuenta disparos. Sin enemigo a tiro, no dispara.', cost: { iron: 1, void: 2 } },
  { id: 'a_kick',    slot: 'action',  name: 'Dedos de trueno',      tag: 'Cada tercero, trueno', desc: 'Cada tercer disparo es un trueno: hace el 220% del daño y empuja lejos al enemigo. Si choca contra un muro, recibe el golpe y queda aturdido. No empuja a los jefes. Sin Compás, salvo con el plano Compás.', cost: { iron: 2, forge: 2 } },
  { id: 'a_drum',    slot: 'action',  name: 'Dedos de tambor',      tag: 'Da Furia',           desc: 'Cada disparo te da 8 de Furia (12 si llevas alguna técnica de Orcos). Con estos dedos tienes Furia aunque no lleves técnicas de Orcos, y también la ganas al golpear. Con la Furia llena (100), disparas un 25% más rápido. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, orc: 3 }, theme: 'orc' },
  { id: 'a_glass',   slot: 'action',  name: 'Dedos de clepsidra',   tag: 'Deja ecos',          desc: 'Uno de cada tres disparos (uno de cada dos si llevas alguna técnica de Tiempo) deja un eco que vuelve a golpear al mismo enemigo un segundo después con el 60% del daño del disparo. Si el enemigo ha muerto, el eco se pierde. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, time: 3 }, theme: 'time' },
  { id: 'a_dice',    slot: 'action',  name: 'Dedos de tahúr',       tag: 'Da críticos',   desc: 'Cada golpe de tus disparos tiene un 15% más de probabilidad de ser crítico (25% si llevas alguna técnica de Fortuna), sumado a la que ya tengas. Cuenta para cada golpe por separado: cada chispa, centella o salto puede ser crítico. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, luck: 3 }, theme: 'luck' },
  { id: 'a_nana',    slot: 'action',  name: 'Dedos de nana',        tag: 'Duerme enemigos',             desc: 'Uno de cada seis disparos (uno de cada cuatro si llevas alguna técnica de Sueño) Duerme a tu objetivo 2 segundos. A los jefes no los duerme: los deja Adormilados 1 s. Un enemigo que acaba de despertar no puede volver a dormirse en 4 s. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, dream: 3 }, theme: 'dream' },
  { id: 'a_fly',     slot: 'action',  name: 'Dedos de volante',     tag: 'Cadencia que sube',       desc: 'Mientras sigas disparando, disparas cada vez más rápido: hasta un 60% más a los cinco segundos. Si pasas 1,5 s sin disparar, se pierde todo. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, void: 2 } },
  { id: 'a_fin',     slot: 'action',  name: 'Dedos de remate',      tag: 'Remata sin frenar',  desc: 'Si tu objetivo tiene menos de un cuarto de vida, el disparo sale sin frenazo y los guanteletes vuelven a estar listos en una décima de segundo, así que puedes rematarlo casi al instante. También funciona con jefes. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, end: 2 } },
  { id: 'a_firm',    slot: 'action',  name: 'Dedos de estatua',   tag: 'Quieto, más rápido', desc: 'Si llevas un tercio de segundo sin moverte, disparas un 50% más rápido. Mientras te mueves o esquivas, disparas un 20% más despacio. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, frost: 2 } },
  { id: 'a_rota',    slot: 'action',  name: 'Dedos de ronda',       tag: 'Cambia de blanco',  desc: 'Cada disparo va al enemigo más cercano que no sea el del disparo anterior, aunque apuntes a otro, y todos hacen un 30% más de daño. Si solo hay un enemigo a tiro, le disparas a él igualmente, con el mismo +30%. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, mirror: 2 } },
  { id: 'a_over',    slot: 'action',  name: 'Dedos de sobrecarga',  tag: 'Uno enorme cada 10 s', desc: 'Se cargan solos en 10 segundos, dispares o no (barra bajo tu personaje). Con la carga llena, tu siguiente disparo hace el cuádruple de daño y la carga vuelve a empezar desde cero. Sin Compás, salvo con el plano Compás.', cost: { iron: 2, blood: 2 } },
  { id: 'a_bolt',    slot: 'action',  name: 'Dedos de compás',       tag: 'Pulsa a Compás',             desc: 'Disparas al pulsar, o seguido si mantienes pulsado. Cada disparo te frena un instante. Si pulsas justo a Compás, ese disparo hace +50% de daño; mantener pulsado o pulsar demasiado pronto no cuenta.', base: true },
  { id: 'a_semi',    slot: 'action',  name: 'Dedos de chispa',      tag: 'Corre y dispara',         desc: 'Disparar no te frena y el disparo sale antes. Disparas un 20% más rápido, y mientras te mueves la cadencia sigue subiendo durante 3 s, hasta un 68% más rápido en total; si te paras un cuarto de segundo, vuelve al 20%. Cada disparo hace un 25% menos de daño. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, time: 2 } },
  { id: 'a_burst',   slot: 'action',  name: 'Dedos de salvas',      tag: 'Ráfaga de tres',      desc: 'Cada pulsación suelta tres disparos seguidos, cada uno con el 45% del daño y todos tus efectos de disparo (135% en total). El tercero deja aturdido un instante (0,4 s) al enemigo, salvo a los jefes. Disparas un 15% más despacio y el frenazo dura algo más. Sin Compás, salvo con el plano Compás.', cost: { iron: 1, venom: 2 } },
  { id: 'a_rotary',  slot: 'action',  name: 'Dedos de molinete', tag: 'Chorro continuo',  desc: 'Mantén pulsado: tras medio segundo girando, dispara sin parar a 6,6 veces tu cadencia (unos seis disparos por segundo al principio), cada uno con el 30% del daño. Solo dispara si tienes un enemigo a tiro. Mientras lo mantienes, andas a menos de un tercio de tu velocidad. Nunca hace Compás.', cost: { iron: 2, stone: 2 } },
  { id: 'a_draw',    slot: 'action',  name: 'Dedos tensos',    tag: 'Tensar y soltar',    desc: 'Mantén pulsado para tensar y suelta para disparar. Un toque rápido hace el 60% del daño; tensado a tope (unos 1,4 s con la cadencia base), el 220%. Con poca tensión, las palmas que disparan en línea o en abanico llegan menos lejos (desde el 60% de tu alcance). Mientras tensas andas al 40%, y disparas un 35% más despacio. Nunca hace Compás.', cost: { iron: 2, dragon: 2 } },
  { id: 'a_shackle', slot: 'action',  name: 'Dedos de grillete',    tag: 'Encadena al blanco',  desc: 'Uno de cada cuatro disparos deja la cadena enganchada a tu objetivo 2 segundos: mientras está encadenado va un 30% más despacio y tus disparos le hacen un 25% más de daño. A los jefes los frena menos.', cost: { iron: 1, orc: 2 } },
  { id: 'a_maul',    slot: 'action',  name: 'Dedos de mazo',        tag: 'Lento y demoledor',   desc: 'Disparas a menos de la mitad de velocidad (un 55% más despacio), pero cada disparo hace el 260% del daño.', cost: { iron: 1, forge: 2 } },
  { id: 'a_humm',    slot: 'action',  name: 'Dedos de colibrí',     tag: 'Rápido y flojo',      desc: 'Disparas el doble de rápido (un 110% más), pero cada disparo hace solo el 45% del daño. Todo lo que hacen tus disparos al dar, lo hacen el doble de veces.', cost: { iron: 1, time: 2 } },
  { id: 'm_std',     slot: 'mag',     name: 'Gema en bruto',       tag: 'Básica',             desc: 'La gema de serie. No añade nada a tus disparos ni tiene pegas.', base: true },
  { id: 'm_drum',    slot: 'mag',     name: 'Gema doble',          tag: 'Dos seguidos',            desc: 'Disparas dos veces casi seguidas y luego recargas: la pausa tras el segundo disparo es un 25% más larga de lo normal. Cada disparo hace un 35% más de daño. Si el segundo da al mismo enemigo que el primero, hace además un 60% más.', cost: { iron: 1, orc: 2 } },
  { id: 'm_belt',    slot: 'mag',     name: 'Gema candente',         tag: 'Rápida, se calienta',        desc: 'Disparas un 30% más rápido, pero cada disparo calienta los guanteletes (aro rojo a tu alrededor): unos 8 disparos seguidos lo llenan, o unos 23 con los Dedos de molinete. Si se llena, los guanteletes se bloquean 1,6 s. Se enfrían solos cuando dejas de disparar.', cost: { iron: 1, dragon: 2 } },
  { id: 'm_charged', slot: 'mag',     name: 'Gema bendita',         tag: 'El quinto revienta', desc: 'Cada quinto disparo hace el 250% del daño y revienta en el blanco: una explosión pequeña hace el 120% de tu daño base al blanco y a los que tenga alrededor.', cost: { iron: 1, storm: 2 } },
  { id: 'm_heavy',   slot: 'mag',     name: 'Gema de plomo',        tag: 'Empuja',             desc: 'Cada disparo hace un 30% más de daño y empuja al enemigo. Si lo estampas contra un muro, recibe un golpe extra y queda aturdido. Disparas un 20% más despacio. No empuja a los jefes.', cost: { iron: 1, stone: 2 } },
  { id: 'm_chain',   slot: 'mag',     name: 'Gema enramada',        tag: 'Salta a otro',       desc: 'Tras dar en el blanco, el disparo salta al enemigo más cercano a él, si hay uno a poca distancia, y le hace la mitad del daño, con los efectos de tus técnicas.', cost: { iron: 1, venom: 2 } },
  { id: 'm_silver',  slot: 'mag',     name: 'Gema de plata',        tag: 'Contra élites y jefes',       desc: 'Todo tu daño directo hace un 60% más a élites, elegidos y jefes, y un 10% menos al resto. Cada élite que matas suelta 3 de oro más (el doble).', cost: { iron: 1, shade: 2 } },
  { id: 'm_frag',    slot: 'mag',     name: 'Gema de esquirlas',     tag: 'Estalla al matar',   desc: 'Si un disparo mata a su blanco, estalla en esquirlas: una para cada uno de los cinco enemigos más cercanos, con el 30% del daño y los efectos de tus técnicas.', cost: { iron: 1, stone: 2 } },
  { id: 'm_blood',   slot: 'mag',     name: 'Gema de sangre',       tag: 'Pagas con vida',     desc: 'Cada disparo hace un 40% más de daño y te cuesta el 1% de tu vida máxima (nunca te deja por debajo de 1). Cada enemigo que muere, lo mate lo que lo mate, te cura un 3% de tu vida máxima.', cost: { iron: 1, feast: 2 } },
  { id: 'm_last',    slot: 'mag',     name: 'Última gema',          tag: 'El sexto, triple',   desc: 'Cada sexto disparo hace el triple de daño. Después, los guanteletes tardan al menos 1,2 s en volver a disparar.', cost: { iron: 1, luck: 2 } },
  { id: 'm_ice',     slot: 'mag',     name: 'Gema de escarcha',     tag: 'Frena y hiela',    desc: 'Cada disparo frena al enemigo un 30% durante 1,5 s. Si le das mientras ya va frenado, queda Congelado 0,8 s (y sirve para las técnicas que aprovechan a los Congelados); como mucho, una vez cada 3 s por enemigo. A los jefes los frena menos y no los aturde.', cost: { iron: 1, tide: 2 } },
  { id: 'm_fire',    slot: 'mag',     name: 'Gema incendiaria',     tag: 'Fuego en el suelo',         desc: 'Cada disparo deja una llama en el suelo, donde estaba el enemigo, que dura 2 s. Cada 0,4 s clava 1 Ascua a quien esté encima.', cost: { iron: 1, dragon: 2 } },
  { id: 'm_gold',    slot: 'mag',     name: 'Gema de oro',          tag: 'Gasta oro, pega más',   desc: 'Cada disparo gasta 1 de oro y hace un 35% más de daño. Si no te queda oro, hace un 20% menos. Cada enemigo que muere te da 1 de oro.', cost: { iron: 1, luck: 2 } },
  { id: 'm_split',   slot: 'mag',     name: 'Gema partida',         tag: 'Se parte en dos',     desc: 'Al dar en el blanco, el disparo se parte en dos trozos que siguen hacia delante en diagonal, uno a cada lado. Cada trozo da al primer enemigo que encuentra a poca distancia, con el 35% del daño y los efectos de tus técnicas.', cost: { iron: 1, mirror: 2 } },
  { id: 'm_mark',    slot: 'mag',     name: 'Gema de marca',       tag: 'Marca al tercero',    desc: 'Cada tercer disparo que das al mismo enemigo lo marca durante 5 s: mientras dure, recibe un 30% más de todo el daño directo.', cost: { iron: 1, light: 2 } },
  { id: 'm_big',     slot: 'mag',     name: 'Gema gruesa',      tag: 'Salpica',            desc: 'Cada disparo hace un 20% más de daño, y hasta cuatro enemigos pegados al blanco reciben la mitad (sin efectos).', cost: { iron: 2, forge: 2 } },
  { id: 's_roll',    slot: 'stock',   name: 'Brazal de volatinero', tag: 'Dos esquives cortos', desc: 'Tienes una carga de esquive más, pero cada esquive llega un 35% menos lejos.', cost: { iron: 1, dream: 2 } },
  { id: 's_anchor',  slot: 'stock',   name: 'Brazal de ancla',      tag: 'Aguanta cargando', desc: 'Mientras mantienes pulsado el disparo cargado, recibes la mitad de daño.', cost: { iron: 1, tide: 2 } },
  { id: 's_sprint',  slot: 'stock',   name: 'Brazal de corredor',   tag: 'Sin disparar, corres', desc: 'Si pasas 2 s con los guanteletes listos sin disparar, corres un 35% más rápido hasta tu siguiente disparo. Con los Dedos inquietos casi nunca se activa, porque los guanteletes disparan solos.', cost: { iron: 1, frost: 2 } },
  { id: 's_venge',   slot: 'stock',   name: 'Brazal de rencor',     tag: 'Venganza doble',    desc: 'Cuando te golpean, tus tres siguientes disparos hacen el doble de daño. Un golpe que para la rodela o que llega mientras eres invulnerable no cuenta.', cost: { iron: 1, blood: 2 } },
  { id: 's_gasp',    slot: 'stock',   name: 'Brazal del último aliento', tag: 'Casi muerto, corres', desc: 'Mientras tengas menos de un cuarto de tu vida, te mueves un 30% más rápido y tus esquives se recargan el doble de rápido.', cost: { iron: 1, end: 2 } },
  { id: 'm_seed',    slot: 'mag',     name: 'Gema de bellota',      tag: 'Planta Semillas',    desc: 'Cada disparo planta una Semilla en el enemigo; a la tercera, brotan Raíces. Si llevas en tus ranuras alguna técnica de Bosque, brotan a la segunda.', cost: { iron: 1, wood: 3 }, theme: 'wood' },
  { id: 'm_salt',    slot: 'mag',     name: 'Gema de sal',          tag: 'Empapa y empuja',    desc: 'Cada disparo deja Empapado al enemigo 3 s y lo empuja un poco. A los que ya estaban Empapados les hace un 15% más de daño. Si llevas en tus ranuras alguna técnica de Mareas, empuja el doble. No empuja a los jefes; con una técnica de Mareas, el empujón sí basta para darles el golpe de los jefes Empapados.', cost: { iron: 1, tide: 3 }, theme: 'tide' },
  { id: 'm_saw',     slot: 'mag',     name: 'Gema serrada',         tag: 'Abre Heridas',       desc: 'Cada disparo abre una Herida (hasta 6 por enemigo). Si llevas en tus ranuras alguna técnica de Sangre, abre dos.', cost: { iron: 1, blood: 3 }, theme: 'blood' },
  { id: 'm_quick',   slot: 'mag',     name: 'Gema de azogue',       tag: 'Repite desde detrás',  desc: 'Cada cuarto disparo vuelve desde el otro lado del enemigo y le da otra vez, con la mitad del daño y sin efectos. Si llevas en tus ranuras alguna técnica de Espejos, cada segundo disparo.', cost: { iron: 1, mirror: 3 }, theme: 'mirror' },
  { id: 'm_star',    slot: 'mag',     name: 'Gema de lucero',       tag: 'Ilumina enemigos',            desc: 'Cada disparo deja Iluminado al enemigo 4 s, y tus disparos hacen un 12% más a los Iluminados. Si llevas en tus ranuras alguna técnica de Luz, un 25%. El reparto de daño entre Iluminados solo ocurre si llevas la técnica Señalar.', cost: { iron: 1, light: 3 }, theme: 'light' },
  { id: 's_grave',   slot: 'stock',   name: 'Brazal de lápida',     tag: 'Levanta Sombras',    desc: 'Cada ocho enemigos que matas, el octavo se levanta como Sombra y pelea por ti. Si llevas en tus ranuras alguna técnica de Sombras, cada cinco. Los jefes no cuentan. Puedes tener 2 Sombras a la vez, más si tus técnicas suben el tope.', cost: { iron: 1, shade: 3 }, theme: 'shade' },
  { id: 's_wine',    slot: 'stock',   name: 'Brazal de bota de vino', tag: 'Cura al matar',   desc: 'Cada enemigo que muere te cura un 1% de tu vida máxima; si ya tienes la vida llena, ese punto va a tu Reserva. Si llevas en tus ranuras alguna técnica de Manjares, 2.', cost: { iron: 1, feast: 3 }, theme: 'feast' },
  { id: 's_kennel',  slot: 'stock',   name: 'Brazal de perrera',    tag: 'Cachorro que muerde',   desc: 'Un perro te acompaña y muerde cada 0,8 s al enemigo al que disparas, con el 30% de tu daño base (o lo que diga tu técnica Sabueso, si la llevas) y los efectos de tus técnicas. Tus disparos hacen un 15% más a su presa. Empieza de cachorro y crece con la Caza. Si llevas en tus ranuras alguna técnica de Bestias, tienes un perro más.', cost: { iron: 1, beast: 3 }, theme: 'beast' },
  { id: 's_geode',   slot: 'stock',   name: 'Brazal de geoda',      tag: 'Deja Cristales',     desc: 'Cada esquive deja un Cristal donde estabas. Cada vez que disparas, hasta cuatro de tus Cristales cercanos al blanco le lanzan una esquirla con el 20% del daño, sin efectos. Si llevas en tus ranuras alguna técnica de Minerales, el 40%.', cost: { iron: 1, stone: 3 }, theme: 'stone' },
  { id: 'm_blunt',   slot: 'mag',     name: 'Gema roma',            tag: 'El quinto aturde',   desc: 'Cada quinto disparo deja aturdido al enemigo 0,6 s. A los jefes no los aturde.', cost: { iron: 1, dream: 2 } },
  { id: 'm_grow',    slot: 'mag',     name: 'Gema voraz',           tag: 'Más daño al matar',      desc: 'Cada enemigo que matas de un disparo sube un 2% el daño de tus disparos hasta el final de la partida, hasta +60% (30 bajas). Los jefes no cuentan.', cost: { iron: 2, blood: 2 } },
  { id: 'm_awl',     slot: 'mag',     name: 'Gema de punzón',       tag: 'Da al de detrás',    desc: 'El disparo atraviesa al blanco y da también al primer enemigo que tenga justo detrás, a poca distancia, con el 60% del daño y los efectos de tus técnicas.', cost: { iron: 1, end: 2 } },
  { id: 'm_timed',   slot: 'mag',     name: 'Gema de mecha',        tag: 'Explota después',    desc: 'El disparo se queda clavado y explota 1 s después, con la mitad del daño, al blanco y a los que tenga muy cerca. Si el blanco muere antes, explota donde cayó.', cost: { iron: 1, void: 2 } },
  { id: 'm_leech',   slot: 'mag',     name: 'Gema sanguijuela',     tag: 'Cura cada 8 impactos',     desc: 'Cada 8 impactos de tus disparos te curas un 2% de tu vida máxima. Cada impacto cuenta por separado, también los de un disparo que da a varios enemigos.', cost: { iron: 1, frost: 2 } },
  { id: 'm_link',    slot: 'mag',     name: 'Gema eslabonada',      tag: 'Encadena a los de al lado', desc: 'El enemigo al que das queda encadenado a los que tiene cerca (hasta cuatro, a poca distancia): cada uno recibe el 40% del daño que le haces a él. Ese daño no lleva los efectos de tus técnicas.', cost: { iron: 2, stone: 2 } },
  { id: 's_sapper',  slot: 'stock',   name: 'Brazal de zapador',    tag: 'Pegado al muro',     desc: 'Mientras estés pegado a un muro, tus disparos hacen un 30% más de daño.', cost: { iron: 1, dream: 2 } },
  { id: 's_dance',   slot: 'stock',   name: 'Brazal de bailarín',   tag: 'Atravesar devuelve esquive',  desc: 'Atravesar a un enemigo con el esquive te devuelve una carga de esquive al momento (sin pasar de tu máximo). Solo una vez por esquive. Las estocadas de la Palma de lanza y las embestidas de las Brasas de embestida y de trueno cuentan como un esquive cada una: no gastan carga, así que te recargan una gastada.', cost: { iron: 1, mirror: 2 } },
  { id: 's_tower',   slot: 'stock',   name: 'Brazal de torre',      tag: 'Sin esquive, más duro',        desc: 'No puedes esquivar. A cambio, recibes un 30% menos de daño y tus disparos hacen un 25% más. Tus técnicas de Esquive y las piezas que dependen de esquivar dejan de servirte.', cost: { iron: 2, forge: 2 } },
  { id: 's_loot',    slot: 'stock',   name: 'Brazal de saqueador',  tag: 'Más oro',            desc: 'Todo el oro que ganas aumenta un 50%: el de las bajas, el de las salas y el de los premios.', cost: { iron: 1, light: 2 } },
  { id: 's_wind',    slot: 'stock',   name: 'Brazal de segundo aire', tag: 'Cura de emergencia', desc: 'Una vez por sala, si un golpe te deja por debajo del 30% de tu vida, recuperas de golpe el 20% de tu vida máxima.', cost: { iron: 1, void: 2 } },
  { id: 's_spring',  slot: 'stock',   name: 'Brazal de muelle',     tag: 'Salto tras disparar', desc: 'Tras cada disparo das un salto corto hacia donde mueves el stick. Así disparas y te apartas a la vez. Si no te mueves, no saltas.', cost: { iron: 1, wood: 2 } },
  { id: 's_shield',  slot: 'stock',   name: 'Brazal con rodela',    tag: 'Bloquea un golpe',      desc: 'Una rodela para por completo el siguiente golpe que te llegue. Después tarda 6 s en volver; cuando está lista, la ves girar a tu lado.', cost: { iron: 2, stone: 2 } },
  { id: 's_scope',   slot: 'stock',   name: 'Brazal de catalejo',   tag: 'Primer disparo fuerte',        desc: 'El primer impacto que das a cada enemigo hace un 80% más de daño. Además, tus disparos llegan un 15% más lejos.', cost: { iron: 1, storm: 2 } },
  { id: 's_spikes',  slot: 'stock',   name: 'Brazal de púas',       tag: 'Esquive que hiere',  desc: 'Atravesar a un enemigo con el esquive le hace el 150% de tu daño base y lo deja aturdido 0,5 s. A los jefes no los aturde.', cost: { iron: 1, venom: 2 } },
  { id: 's_bone',    slot: 'stock',   name: 'Brazal de hueso',  tag: 'Herido, dispara más', desc: 'Cuanta menos vida tienes, más rápido disparas: empieza por debajo del 75% de tu vida y llega a un 50% más con un cuarto de vida o menos.', cost: { iron: 1, orc: 2 } },
  { id: 's_std',     slot: 'stock',   name: 'Brazal de cuero',      tag: 'Básica',             desc: 'El brazal de serie. No cambia nada al moverte ni al aguantar golpes.', base: true },
  { id: 's_light',   slot: 'stock',   name: 'Brazal de pluma',     tag: 'Esquive mejor',   desc: 'Tu esquive llega un 30% más lejos y se recarga un 35% antes. Al salir del esquive, los guanteletes ya están listos para disparar. A cambio, tus disparos hacen un 10% menos de daño.', cost: { iron: 1, time: 2 } },
  { id: 's_heavy',   slot: 'stock',   name: 'Brazal herrado',       tag: 'Codazo automático',           desc: 'Tus disparos hacen un 25% más de daño, pero el frenazo de cada disparo dura un 30% más. Si un enemigo se te pega, le das un codazo: el 80% de tu daño base, lo aparta y lo deja aturdido 0,6 s. Como mucho uno cada 2,5 s. No funciona con jefes.', cost: { iron: 1, orc: 2 } },
  { id: 's_recoil',  slot: 'stock',   name: 'Brazal de coz',        tag: 'Te aleja al disparar',     desc: 'Cada disparo te empuja un paso hacia atrás, lejos del enemigo al que disparas. Te alejas sin mover el stick. No funciona con la Palma de lanza ni mientras esquivas.', cost: { iron: 1, feast: 2 } },
  { id: 's_brace',   slot: 'stock',   name: 'Brazal de pilar',            tag: 'Quieto pega más',    desc: 'Si llevas medio segundo sin moverte, tus disparos hacen un 40% más de daño y llegan un 20% más lejos. En cuanto te mueves o esquivas, se pierde.', cost: { iron: 1, shade: 2 } },
  { id: 'c_beam',    slot: 'chamber', name: 'Brasa de rayo',     tag: 'Rayo en línea',      desc: 'El disparo cargado es un rayo recto que atraviesa a todos los enemigos en línea, con todo el daño del cargado. Los muros lo cortan. Con la técnica Aliento (Dragones) se abre en cono; con el plano Mortero, se convierte en un proyectil que explota en área.', base: true },
  { id: 'c_fan',     slot: 'chamber', name: 'Brasa de pavesas', tag: 'Abanico de nueve',   desc: 'El disparo cargado suelta nueve disparos en abanico delante de ti, a corta distancia. Cada uno hace el 22% del daño del cargado y lleva tus efectos de disparo.', cost: { iron: 1, storm: 2 } },
  { id: 'c_rain',    slot: 'chamber', name: 'Brasa de aluvión',  tag: 'Lluvia sobre zona',  desc: 'El disparo cargado hace llover fuego tres veces sobre una zona redonda: sobre tu objetivo o, si apuntas con el stick, delante de ti. Cada oleada hace el 45% del daño del cargado a todos los de la zona.', cost: { iron: 1, venom: 2 } },
  { id: 'c_supp',    slot: 'chamber', name: 'Brasa de torbellino', tag: 'Dispara sola 3 s', desc: 'Tras el disparo cargado, la brasa sigue disparando sola casi 3 s desde donde lo lanzaste, mientras tú te mueves: 36 disparos a enemigos al azar que estén a tiro, cada uno con el 9% del daño del cargado y tus efectos de disparo. También enfría del todo los guanteletes.', cost: { iron: 2, stone: 2 } },
  { id: 'c_dash',    slot: 'chamber', name: 'Brasa de embestida', tag: 'Carga que atraviesa', desc: 'El disparo cargado te lanza en una carga larga hacia donde apuntas. No pueden golpearte durante la carga, y cada enemigo que atraviesas recibe el 60% del daño del cargado. Cuenta como atravesar a un enemigo con el esquive.', cost: { iron: 2, shade: 2 } },
  { id: 'c_blast',   slot: 'chamber', name: 'Brasa de trueno',   tag: 'Chispas y retroceso', desc: 'El disparo cargado suelta quince chispas a muy corta distancia, cada una con el 22% del daño del cargado y tus efectos de disparo. Los enemigos alcanzados salen empujados y quedan aturdidos 0,5 s; a los jefes ni los empuja ni los aturde. El retroceso te lanza hacia atrás.', cost: { iron: 2, feast: 2 } },
  { id: 'c_mine',    slot: 'chamber', name: 'Brasa de minas',    tag: 'Tres minas',         desc: 'El disparo cargado deja tres minas a tu espalda. Duran 12 s y revientan cuando un enemigo las pisa, con el 90% del daño del cargado en área. Los enemigos voladores no las activan.', cost: { iron: 1, wood: 2 } },
  { id: 'c_nova',    slot: 'chamber', name: 'Brasa de anillo',   tag: 'Onda que aparta',    desc: 'El disparo cargado suelta una onda a tu alrededor que hace el 70% del daño del cargado y lanza lejos a los enemigos cercanos. Si alguno choca contra un muro, recibe el golpe extra. A los jefes no los mueve.', cost: { iron: 2, tide: 2 } },
  { id: 'c_turret',  slot: 'chamber', name: 'Brasa de centinela', tag: 'Guantelete fijo que dispara', desc: 'El disparo cargado deja clavado un guantelete gemelo donde estás. Durante 6 s dispara solo al enemigo más cercano a tiro, a tu cadencia, con el 80% de tu daño base y los efectos de tus técnicas. No lleva los efectos de tus piezas ni pone Sentencia.', cost: { iron: 2, time: 2 } },
  { id: 'c_snipe',   slot: 'chamber', name: 'Brasa de verdugo',  tag: 'Un tiro al más fuerte', desc: 'El disparo cargado es un único tiro al enemigo con más vida que tengas a la vista, con el doble de daño de un cargado normal. Si lo mata, el cargado vuelve a estar listo al instante.', cost: { iron: 2, luck: 3 } },
  { id: 'c_meteor',  slot: 'chamber', name: 'Brasa de meteoro',  tag: 'Meteoro',      desc: 'El disparo cargado marca un punto (tu objetivo, o delante de ti si apuntas con el stick) y 1 s después cae allí un meteoro: el 160% del daño del cargado en un área grande, y aturde 0,5 s.', cost: { iron: 2, void: 2 } },
  { id: 'c_chain',   slot: 'chamber', name: 'Brasa de cadena',   tag: 'Salta entre seis',   desc: 'El disparo cargado es un rayo que da al enemigo más cercano a donde apuntas y salta de enemigo en enemigo, hasta seis. Cada uno recibe el 80% del daño del cargado, sin perder fuerza en los saltos.', cost: { iron: 2, storm: 2 } },
  { id: 'c_balm',    slot: 'chamber', name: 'Brasa de bálsamo',  tag: 'Te cura',            desc: 'El disparo cargado no dispara: te cura el 10% de tu vida máxima y aparta a los enemigos que tienes encima. Tus técnicas de Cargado sí se aplican a esos enemigos.', cost: { iron: 2, feast: 3 } },
  { id: 'c_bounce',  slot: 'chamber', name: 'Brasa de carambola', tag: 'Rebota cinco veces', desc: 'El disparo cargado es un rayo que rebota en los muros hasta cinco veces. Hace el 60% del daño del cargado a todo lo que cruza en cada tramo, así que puede dar varias veces al mismo enemigo.', cost: { iron: 2, mirror: 2 } },
  { id: 'c_volley',  slot: 'chamber', name: 'Brasa de salva',    tag: 'Ocho seguidos',      desc: 'El disparo cargado suelta ocho disparos seguidos contra tu objetivo, o contra el enemigo más cercano a donde apuntas. Cada uno hace el 20% del daño del cargado y lleva tus efectos de disparo.', cost: { iron: 2, beast: 2 } },
  { id: 'c_sima',    slot: 'chamber', name: 'Brasa de sima',     tag: 'Abre un pozo',       desc: 'El disparo cargado abre un pozo de 2 s donde apuntas: arrastra a los enemigos cercanos, les hace el 15% del daño del cargado cada medio segundo y al cerrarse estalla con el 80%. Si llevas en tus ranuras alguna técnica de Vacío, dura 4 s. A los jefes no los arrastra.', cost: { iron: 2, void: 3 }, theme: 'void' },
  { id: 'c_doom',    slot: 'chamber', name: 'Brasa de sentencia', tag: 'Pone Sentencias',   desc: 'El disparo cargado es un rayo en línea que pone una Sentencia de 5 s a todos los que atraviesa y les hace el 60% del daño del cargado. No necesita ninguna técnica de Final: al cumplirse, cada Sentencia devuelve el 40% del daño que le hiciste. Si llevas en tus ranuras alguna técnica de Final, todas tus Sentencias devuelven un 50% más. No renueva una Sentencia que ya esté en marcha.', cost: { iron: 2, end: 3 }, theme: 'end' },
  { id: 'c_anvil',   slot: 'chamber', name: 'Brasa de yunque',   tag: 'Da Temple',          desc: 'El disparo cargado es un martillazo a tu alrededor: el 90% del daño del cargado, y aturde 0,5 s. Cada enemigo golpeado te da 1 de Temple (hasta tu máximo, 10 sin más ayudas); si llevas en tus ranuras alguna técnica de Forja, 2. El Temple te suma daño aunque no lleves técnicas de Forja.', cost: { iron: 2, forge: 3 }, theme: 'forge' },
  { id: 'c_ward',    slot: 'chamber', name: 'Brasa de baluarte', tag: 'Invulnerable 2 s', desc: 'El disparo cargado no ataca: eres invulnerable 2 s y apartas a los enemigos que tienes encima. Tus técnicas de Cargado sí se aplican a esos enemigos.', cost: { iron: 2, frost: 2 } },
  { id: 'c_blink',   slot: 'chamber', name: 'Brasa de salto',    tag: 'Te lleva allí',      desc: 'El disparo cargado te lleva al instante junto a tu objetivo, o a donde apuntas, y revienta al llegar: el 80% del daño del cargado en área. Al aparecer eres invulnerable un instante.', cost: { iron: 2, mirror: 2 } },
  { id: 'c_drain',   slot: 'chamber', name: 'Brasa de sanguijuela', tag: 'Rayo que cura',   desc: 'El disparo cargado es un rayo en línea que hace el 90% del daño del cargado. Recuperas como vida el 30% de todo el daño que hace, hasta un 25% de tu vida máxima.', cost: { iron: 2, blood: 2 } },
  { id: 'c_brand',   slot: 'chamber', name: 'Brasa de condena',  tag: 'Marca a todos',      desc: 'El disparo cargado marca a todos los enemigos que tienes a la vista y les hace el 30% del daño del cargado. Durante 6 s, los marcados reciben un 30% más de todo el daño directo.', cost: { iron: 2, light: 2 } },
  { id: 'c_quake',   slot: 'chamber', name: 'Brasa de terremoto', tag: 'Aturde la sala',    desc: 'El disparo cargado sacude toda la sala: cada enemigo que pisa el suelo recibe un 30% del daño del cargado y queda aturdido 1 s. No afecta a los voladores, y a los jefes no los aturde.', cost: { iron: 2, beast: 2 } },
];
const PART = Object.fromEntries(PARTS.map(x => [x.id, x]));
const BASE_GUN = { barrel: 'b_long', action: 'a_bolt', mag: 'm_std', stock: 's_std', chamber: 'c_beam' };
// Guanteletes legendarios: tres piezas concretas montadas a la vez forman unos guanteletes con nombre propio y un poder que ninguna pieza tiene sola.
// Las cuatro primeras llevaban nombres de armas reales; ahora son de este mundo. Los id no cambian.
const LEGENDS = [
  { id: 'monsmeg',  name: 'Puño del Volcán',     parts: ['b_bomb', 'm_heavy', 's_brace'],   lore: 'Dicen que quien los forjó quiso meter una montaña entera en un puño.', desc: 'Necesitas montar a la vez Palma de volcán, Gema de plomo y Brazal de pilar. Tus orbes revientan en un área un 60% más grande y dejan aturdidos 0,6 s a todos los que alcanzan (a los jefes no).' },
  { id: 'zhuge',    name: 'Nido de Áspides',     parts: ['a_draw', 'm_drum', 's_light'],    lore: 'Poco golpe y muchas picaduras, todas envenenadas.', desc: 'Necesitas montar a la vez Dedos tensos, Gema doble y Brazal de pluma. Cada vez que sueltas los Dedos tensos salen dos disparos más tras el primero, con el 70% del daño. El primero y cada disparo extra ponen 2 de Veneno.' },
  { id: 'organ',    name: 'Órgano de Brasas',    parts: ['a_rotary', 'b_twin', 'm_belt'],   lore: 'Treinta y tres brasas en tres filas: una arde, otra prende, otra se enfría.', desc: 'Necesitas montar a la vez Dedos de molinete, Palmas gemelas y Gema candente. Los guanteletes ya no se bloquean al recalentarse: cuando el calor se llena, sueltan una salva de once disparos repartidos entre los enemigos cercanos (60% de tu daño base cada uno, con tus efectos de disparo) y se enfrían del todo.' },
  { id: 'dragon',   name: 'Dragón',              parts: ['b_scatter', 'a_semi', 's_light'], lore: 'Guanteletes de escama que escupen fuego en abanico. Quien los ha visto de cerca no pregunta por el nombre.', desc: 'Necesitas montar a la vez Palma de abanico, Dedos de chispa y Brazal de pluma. Cada andanada clava 2 Ascuas a cada enemigo que toca y deja delante de ti, durante 2 s, una franja de llamas que clava 1 Ascua cada 0,4 s a quien la pise.' },
  { id: 'widow',    name: 'La Viuda',            parts: ['b_blow', 'm_saw', 's_spikes'],    lore: 'Unos guanteletes de hueso que nadie ha visto usar dos veces contra el mismo hombre.', desc: 'Necesitas montar a la vez Palma de víbora, Gema serrada y Brazal de púas. Cada Herida que abres pone también 1 de Veneno. A los enemigos que tienen Heridas y Veneno a la vez, las dos cosas les hacen el doble de daño.' },
  { id: 'winter',   name: 'Invierno del Norte',  parts: ['b_icicle', 'm_ice', 'c_nova'],    lore: 'Forjados en una fragua que se apagó sola. El hierro nunca volvió a calentarse.', desc: 'Necesitas montar a la vez Palma de carámbano, Gema de escarcha y Brasa de anillo. La onda del disparo cargado deja Congelados al instante a todos los que alcanza. A los jefes solo los frena.' },
  { id: 'choir',    name: 'El Coro',             parts: ['a_glass', 'm_quick', 'c_volley'], lore: 'Disparan una vez y se oyen nueve. Los que los han oído dicen que cantan.', desc: 'Necesitas montar a la vez Dedos de clepsidra, Gema de azogue y Brasa de salva. Cada uno de los ocho disparos de la salva cargada deja un eco que vuelve a dar 0,8 s después, con el 15% del daño del cargado y los efectos de tus técnicas.' },
  { id: 'pack',     name: 'La Jauría',           parts: ['s_kennel', 'b_swarm', 'a_rider'], lore: 'El maestro de Alec decía que quien caza con perros no necesita puntería.', desc: 'Necesitas montar a la vez Brazal de perrera, Palma de avispero y Dedos de jinete. Tienes dos perros más luchando a tu lado, además del del Brazal de perrera. Crecen con la Caza como los demás, y la manada nunca pasa de seis.' },
  { id: 'blacksun', name: 'Sol Negro',           parts: ['c_sima', 'm_star', 'b_far'],      lore: 'Una luz que no alumbra: solo señala dónde va a caer todo.', desc: 'Necesitas montar a la vez Brasa de sima, Gema de lucero y Palma de vigía. Los enemigos que estén dentro de cualquiera de tus pozos quedan Iluminados y reciben un 50% más de todo el daño directo mientras sigan dentro.' },
  { id: 'master',   name: 'Martillo del Maestro', parts: ['c_anvil', 'a_kick', 'm_big'],    lore: 'Lo último que forjó el herrero que crio a Alec. No llegó a templarlo.', desc: 'Necesitas montar a la vez Brasa de yunque, Dedos de trueno y Gema gruesa. El Temple puede subir 10 puntos más, y cada trueno de los Dedos de trueno revienta alrededor del blanco con el 100% de tu daño base.' },
  { id: 'lastword', name: 'La Última Palabra',   parts: ['c_doom', 'a_spring', 'm_last'],   lore: 'Seis disparos. El sexto no falla porque ya está escrito.', desc: 'Necesitas montar a la vez Brasa de sentencia, Dedos de resorte y Última gema. El sexto disparo de la Última gema cumple al instante todas las Sentencias que haya en la sala.' },
  { id: 'tempest',  name: 'Tempestad',           parts: ['b_rod', 'a_rotary', 'm_chain'],   lore: 'Hay que calzárselos con cuidado. Aun así, muerden.', desc: 'Necesitas montar a la vez Palma de cobre, Dedos de molinete y Gema enramada. Los enemigos se descargan solos al juntar 3 Agujas de la Palma de cobre, en vez de 6. Funciona también con la técnica Sobrecarga (Tormenta): se descargan a las 3 y no llegan a las 6 de Sobrecarga.' },
  { id: 'breaker',  name: 'La Rompemuros',       parts: ['b_pierce', 'm_heavy', 's_heavy'], lore: 'Dicen que el herrero los forjó en una vida anterior y que aún recuerdan cada muro.', desc: 'Necesitas montar a la vez Palma de venablo, Gema de plomo y Brazal herrado. El disparo de la Palma de venablo rebota hasta cuatro veces en vez de una, y cada rebote hace un 25% más de daño que el anterior.' },
];
const legOf = g => LEGENDS.find(L => L.parts.every(id => g[PART[id].slot] === id)) || null;
// El nombre de los guanteletes sale de lo que llevan montado: «Guanteletes de <palma> y <dedos>»
function gunName(g) {
  { const L = legOf(g); if (L) return L.name; }
  const palm = { b_long: 'cadena', b_short: 'palma presta', b_twin: 'palmas gemelas', b_scatter: 'abanico', b_pierce: 'venablo', b_bomb: 'volcán', b_spike: 'lanza', b_fork: 'tridente', b_harpoon: 'arpón', b_flame: 'fuelle', b_back: 'dos caras', b_flail: 'mangual', b_boom: 'hoz', b_nail: 'espinas', b_arc: 'eslabones', b_far: 'vigía', b_swarm: 'avispero', b_blow: 'víbora', b_wyrm: 'sierpe', b_rod: 'cobre', b_icicle: 'carámbano', b_horn: 'bramido', b_drill: 'berbiquí', b_ghost: 'palma fantasma', b_net: 'red', b_ends: 'dos distancias', b_cluster: 'racimo', b_hydra: 'hidra' }[g.barrel] || 'cadena';
  const suf = { a_semi: ' y chispa', a_burst: ' y salvas', a_fuse: ' y rescoldo', a_auto: ' y dedos inquietos', a_pend: ' y péndulo', a_hold: ' y retén', a_spring: ' y resorte', a_alt: ' y dedos alternos', a_combo: ' e insistencia', a_drum: ' y tambor', a_fly: ' y volante', a_fin: ' y remate', a_firm: ' y estatua', a_rota: ' y ronda', a_over: ' y sobrecarga', a_glass: ' y clepsidra', a_dice: ' y tahúr', a_nana: ' y nana', a_rider: ' y jinete', a_kick: ' y trueno', a_rotary: ' y molinete', a_draw: ' y dedos tensos', a_shackle: ' y grillete', a_maul: ' y mazo', a_humm: ' y colibrí' }[g.action] || '';
  return 'Guanteletes de ' + palm + suf;
}
// Resonancias: cierta pieza de los guanteletes con cierta técnica de una deidad despiertan algo nuevo. Se activan solas.
const RESO = [
  { id: 'dragonbreath', name: 'Aliento de dragón',   parts: ['b_scatter'], techs: ['dragon_basic'], desc: 'Necesitas la Palma de abanico en los guanteletes y la técnica Colmillo al rojo (Disparo de Dragones, o un dúo con ella). Cada andanada deja también delante de ti una franja de fuego durante 2,2 s, que clava 1 Ascua cada 0,4 s a quien la pise.' },
  { id: 'leadstorm',    name: 'Tormenta de centellas', parts: ['a_rotary'],  techs: ['storm_basic'],  desc: 'Necesitas los Dedos de molinete en los guanteletes y la técnica Aguja estática (Disparo de Tormenta, o un dúo con ella). Cada diez disparos, las Agujas de tu objetivo se descargan solas.' },
  { id: 'quarry',       name: 'Barreno',             parts: ['b_pierce'],  techs: ['stone_basic'],  desc: 'Necesitas la Palma de venablo en los guanteletes y la técnica Esquirla (Disparo de Minerales, o un dúo con ella). Cada disparo deja un Cristal junto a cada enemigo que atraviesa, hasta tres por disparo. El tramo del rebote no deja Cristales.' },
  { id: 'firingline',   name: 'Línea de tiro',       parts: ['b_twin'],    techs: ['shade_basic'],  desc: 'Necesitas las Palmas gemelas en los guanteletes y la técnica Marca de tumba (Disparo de Sombras, o un dúo con ella). Cada vez que disparas, cada una de tus Sombras dispara también al enemigo más cercano a ella, con el 30% de tu daño base y los efectos de tus técnicas.' },
  { id: 'executor',     name: 'Verdugo',             parts: ['b_spike'],   techs: ['orc_dodge'],    desc: 'Necesitas la Palma de lanza en los guanteletes y la técnica Embestida (Esquive de Orcos, o un dúo con ella). Cada estocada de la Palma de lanza deja aturdido al enemigo 0,4 s y te da 15 de Furia.' },
  { id: 'clockwork',    name: 'Reloj de cuerda',     parts: ['a_draw'],    techs: ['time_basic'],   desc: 'Necesitas los Dedos tensos en los guanteletes y la técnica Segundero (Disparo de Tiempo, o un dúo con ella). Un disparo tensado a tope deja dos ecos en vez de uno; el segundo llega 0,35 s después del primero.' },
  { id: 'leadfeast',    name: 'Banquete de brasas',  parts: ['m_drum'],    techs: ['feast_basic'],  desc: 'Necesitas la Gema doble en los guanteletes y la técnica Bocado (Disparo de Manjares, o un dúo con ella). Cada recarga te cura un 4% de tu vida máxima, y el primer disparo tras recargar te cura el triple de lo que cura Bocado.' },
  { id: 'acidrain',     name: 'Lluvia ácida',        parts: ['c_rain'],    techs: ['venom_charge'], desc: 'Necesitas la Brasa de aluvión en los guanteletes y la técnica Purga (Cargado de Veneno, o un dúo con ella). El aluvión deja la zona convertida en un charco tóxico durante 5 s, que pone 2 de Veneno cada 0,4 s a quien esté dentro.' },
  { id: 'furnace',      name: 'Fragua viva',         parts: ['m_belt'],    techs: ['orc_basic'],    desc: 'Necesitas la Gema candente en los guanteletes y la técnica Tambor de guerra (Disparo de Orcos, o un dúo con ella). Cuanto más calientes están los guanteletes, más daño hacen tus disparos: hasta un 40% más con el calor al máximo. Al recalentarse, sueltan una explosión a tu alrededor (250% de tu daño base) que aparta a los enemigos.' },
  { id: 'vigil',        name: 'Vigilia',             parts: ['s_brace'],   techs: ['time_passive'], desc: 'Necesitas el Brazal de pilar en los guanteletes y la técnica Reloj de arena (Pasiva de Tiempo, o un dúo con ella). Mientras el Brazal de pilar está activo (medio segundo quieto), tus disparos frenan un 60% durante 1 s a quien alcanzan.' },
  { id: 'firerain',     name: 'Lluvia de brasas',    parts: ['b_bomb'],    techs: ['dragon_charge'], desc: 'Necesitas la Palma de volcán en los guanteletes y la técnica Aliento (Cargado de Dragones, o un dúo con ella). Cada orbe deja un charco de fuego de 2,5 s donde revienta, que clava 1 Ascua cada 0,4 s a quien lo pise.' },
  { id: 'pinball',      name: 'Carambola',           parts: ['b_pierce'],  techs: ['storm_basic'],  desc: 'Necesitas la Palma de venablo en los guanteletes y la técnica Aguja estática (Disparo de Tormenta, o un dúo con ella). En el tramo tras el rebote, el disparo descarga las Agujas de cada enemigo al que da.' },
  { id: 'cavalry',      name: 'Carga de caballería', parts: ['c_dash'],    techs: ['dragon_dodge'], desc: 'Necesitas la Brasa de embestida en los guanteletes y la técnica Vuelo (Esquive de Dragones, o un dúo con ella). La carga del disparo cargado deja un rastro de fuego de 3 s (2 Ascuas cada 0,4 s) y explota al terminar con el 200% de tu daño base.' },
  { id: 'coldiron',     name: 'Hierro frío',         parts: ['m_ice'],     techs: ['frost_basic'],  desc: 'Necesitas la Gema de escarcha en los guanteletes y la técnica Aliento helado (Disparo de Hielo, o un dúo con ella). Cada disparo pone 1 de Escarcha más.' },
  { id: 'packhunt',     name: 'Montería',            parts: ['b_swarm'],   techs: ['beast_basic'],  desc: 'Necesitas la Palma de avispero en los guanteletes y la técnica Sabueso (Disparo de Bestias, o un dúo con ella). Con cada andanada de la Palma de avispero, tu sabueso salta al primer enemigo alcanzado y lo muerde con el 60% de tu daño base.' },
  { id: 'deathclock',   name: 'Hora señalada',       parts: ['a_spring'],  techs: ['end_basic'],    desc: 'Necesitas los Dedos de resorte en los guanteletes y la técnica Sentencia (Disparo de Final, o un dúo con ella). Si disparas tras esperar 4 s o más con los guanteletes listos (resorte al máximo) a un enemigo con Sentencia, esta se cumple al instante, antes de que llegue el disparo.' },
  { id: 'mirrorhall',   name: 'Galería de espejos',  parts: ['m_split'],   techs: ['mirror_basic'], desc: 'Necesitas la Gema partida en los guanteletes y la técnica Reflejo (Disparo de Espejos, o un dúo con ella). Los dos trozos de la Gema partida hacen el doble de daño. Se suma al ensamble Astillas.' },
  { id: 'bloodprice',   name: 'Deuda saldada',       parts: ['m_blood'],   techs: ['blood_charge'], desc: 'Necesitas la Gema de sangre en los guanteletes y la técnica Sangría (Cargado de Sangre, o un dúo con ella). El disparo cargado de Sangría ya no te cuesta el 10% de tu vida y conserva su daño extra. La Gema de sangre te sigue costando el 1% de tu vida máxima por disparo.' },
  { id: 'eventide',     name: 'Horizonte de sucesos', parts: ['c_meteor'], techs: ['void_charge'],  desc: 'Necesitas la Brasa de meteoro en los guanteletes y la técnica Singularidad (Cargado de Vacío, o un dúo con ella). Al lanzar el meteoro se abre durante 1 s un pozo en el punto de impacto, que arrastra a todos hacia él antes de que caiga.' },
  { id: 'sunbeam',      name: 'Rayo de sol',         parts: ['b_far'],     techs: ['light_basic'],  desc: 'Necesitas la Palma de vigía en los guanteletes y la técnica Señalar (Disparo de Luz, o un dúo con ella). Cada disparo lejano de la Palma de vigía (el que hace el doble) deja también Iluminados a los enemigos de alrededor del blanco.' },
  { id: 'lullaby',      name: 'Nana',                parts: ['a_fuse'],    techs: ['dream_basic'],  desc: 'Necesitas los Dedos de rescoldo en los guanteletes y la técnica Arrullo (Disparo de Sueño, o un dúo con ella). Cada disparo de los Dedos de rescoldo Duerme 3 s al enemigo, salvo que se haya despertado hace menos de 4 s. A los jefes los deja Adormilados 1,5 s.' },
  { id: 'anvilsong',    name: 'Canto del yunque',    parts: ['a_kick'],    techs: ['forge_basic'],  desc: 'Necesitas los Dedos de trueno en los guanteletes y la técnica Temple (Disparo de Forja, o un dúo con ella). Cada trueno de los Dedos de trueno te da 2 de Temple.' },
  { id: 'tidalhook',    name: 'Resaca',              parts: ['b_harpoon'], techs: ['tide_basic'],   desc: 'Necesitas la Palma de arpón en los guanteletes y la técnica Oleaje (Disparo de Mareas, o un dúo con ella). El enemigo que engancha la Palma de arpón queda Empapado 5 s y aturdido 0,6 s. A los jefes no los aturde.' },
  { id: 'thornmine',    name: 'Semillero',           parts: ['c_mine'],    techs: ['wood_charge'],  desc: 'Necesitas la Brasa de minas en los guanteletes y la técnica Zarzal (Cargado de Bosque, o un dúo con ella). Cada mina deja al estallar un zarzal de 4 s que frena a la mitad y hace el 25% de tu daño base cada 0,4 s a quien esté dentro.' },
  { id: 'crossfire',    name: 'Fuego cruzado',       parts: ['a_semi'],    techs: ['stone_passive'], desc: 'Necesitas los Dedos de chispa en los guanteletes y la técnica Veta (Pasiva de Minerales, o un dúo con ella). Los Cristales que repiten tus disparos con Veta hacen el doble de daño.' },
];
const RES = Object.fromEntries(RESO.map(x => [x.id, x]));
// Afinidad: cada pieza se forja con el material de una deidad. Si llevas alguna técnica de esa deidad, la pieza la potencia.
// El efecto se suma por cada pieza afín que lleves montada.
const AFFIN = {
  dragon: 'las Ascuas queman un 12% más', stone: 'los Cristales duran un 20% más', venom: 'el Veneno hace un 10% más de daño', feast: 'todas tus curaciones curan un 10% más',
  orc: 'ganas un 15% más de Furia', time: 'los ecos de la técnica Segundero hacen un 8% más de daño', shade: 'tu daño directo sube un 2% por cada Sombra viva', storm: 'las descargas de Agujas hacen un 10% más de daño',
  tide: 'los golpes contra el muro hacen un 20% más de daño', luck: 'tienes un 3% más de probabilidad de crítico', wood: 'las Raíces duran un 15% más', frost: 'los Congelados lo están 0,3 s más',
  blood: 'las Heridas sangran un 12% más', end: 'las Sentencias devuelven 6 puntos más del daño acumulado (46% en vez de 40%)', light: 'el daño que se reparten los Iluminados sube 4 puntos (por ejemplo, del 30% al 34%)', dream: 'los enemigos duermen 0,4 s más',
  void: 'tus pozos son un 10% más grandes', mirror: 'el Reflejo hace un 10% más de daño', beast: 'el sabueso muerde un 12% más fuerte', forge: 'puedes acumular 1 de Temple más',
};
const affGod = id => { const c = PART[id] && PART[id].cost; return c ? Object.keys(c).find(k => k !== 'iron') : null; };
// Ensambles: dos piezas concretas que se potencian entre sí (unos guanteletes legendarios piden tres; esto es el escalón de antes)
const ENSEMBLES = [
  { id: 'ram',      name: 'Ariete',            parts: ['b_scatter', 'm_heavy'],  desc: 'Necesitas montar a la vez la Palma de abanico y la Gema de plomo. Los golpes contra el muro hacen un 60% más de daño.' },
  { id: 'splinter', name: 'Astillas',          parts: ['b_pierce', 'm_split'],   desc: 'Necesitas montar a la vez la Palma de venablo y la Gema partida. Los dos trozos de la Gema partida hacen el doble de daño. Se suma a la resonancia Galería de espejos.' },
  { id: 'trail',    name: 'Reguero',           parts: ['a_rotary', 'm_fire'],    desc: 'Necesitas montar a la vez los Dedos de molinete y la Gema incendiaria. Las llamas de la Gema incendiaria duran 6 s en vez de 2.' },
  { id: 'cluster',  name: 'Racimo',            parts: ['b_bomb', 'm_frag'],      desc: 'Necesitas montar a la vez la Palma de volcán y la Gema de esquirlas. La Gema de esquirlas suelta ocho esquirlas en vez de cinco, y alcanzan a enemigos más lejanos.' },
  { id: 'siege',    name: 'Tiro de asedio',    parts: ['a_draw', 's_brace'],     desc: 'Necesitas montar a la vez los Dedos tensos y el Brazal de pilar. Un disparo tensado a tope con el Brazal de pilar activo (medio segundo quieto) hace un 60% más de daño, además de lo que ya da el Brazal de pilar.' },
  { id: 'hare',     name: 'Liebre',            parts: ['s_spring', 'a_semi'],    desc: 'Necesitas montar a la vez el Brazal de muelle y los Dedos de chispa. El salto del Brazal de muelle llega el doble de lejos.' },
  { id: 'mill',     name: 'Molino',            parts: ['b_flail', 's_spikes'],   desc: 'Necesitas montar a la vez la Palma de mangual y el Brazal de púas. Durante 2 s después de cada esquive, la bola de la Palma de mangual gira el triple de rápido.' },
  { id: 'rivet',    name: 'Remaches',          parts: ['b_nail', 'm_big'],       desc: 'Necesitas montar a la vez la Palma de espinas y la Gema gruesa. Cuando las espinas revientan, hasta seis enemigos cercanos al blanco reciben el mismo golpe.' },
  { id: 'watch',    name: 'Guardia',           parts: ['c_turret', 'a_auto'],    desc: 'Necesitas montar a la vez la Brasa de centinela y los Dedos inquietos. El guantelete gemelo de la Brasa de centinela dura 12 s en vez de 6.' },
  { id: 'bastion',  name: 'Bastión',           parts: ['s_shield', 'c_balm'],    desc: 'Necesitas montar a la vez el Brazal con rodela y la Brasa de bálsamo. Usar la Brasa de bálsamo deja la rodela lista al instante.' },
  { id: 'marksman', name: 'Tirador',           parts: ['b_long', 's_scope'],     desc: 'Necesitas montar a la vez la Palma de cadena y el Brazal de catalejo. El primer impacto a cada enemigo hace el triple de daño, en vez de un 80% más.' },
  { id: 'gambler',  name: 'Tahúr',             parts: ['m_gold', 'a_kick'], desc: 'Necesitas montar a la vez la Gema de oro y los Dedos de trueno. Cada trueno de los Dedos de trueno te da 3 de oro.' },
];
const ensOf = g => ENSEMBLES.filter(E => E.parts.every(id => g[PART[id].slot] === id));

// Árbol de habilidades: cada mejora tiene varios rangos y se paga con almas. cost[r] es lo que cuesta el rango r+1.
// El árbol del primer reino cuesta en total alrededor de vez y media lo que pagan sus 17 encargos la primera vez (unas 2.900 almas
// contando las salas de almas): si te atascas puedes repetir encargos y seguir subiendo, y cerca del final vas sobrado.
// Tiene tope. El siguiente reino trae su propio árbol (TREE2), que sigue donde este se queda y cuesta mucho más.
const curve = (base, g, n) => Array.from({ length: n }, (_, r) => Math.round(base * Math.pow(g, r)));
const C8 = [10, 15, 25, 35, 50, 65, 85, 115], C5 = [10, 20, 35, 50, 75];
const TREE = [
  { name: 'Cuerpo', sub: 'Vida, defensa, movimiento y esquive', nodes: [
    { id: 'hp',      name: 'Aguante',         max: 8, cost: C8,  desc: r => `+${10 * r} de vida máxima` },
    { id: 'skin',    name: 'Piel curtida',    max: 5, cost: C5,  desc: r => `Recibes un ${5 * r}% menos de daño de todos los golpes` },
    { id: 'feet',    name: 'Pies ligeros',    max: 5, cost: C5,  desc: r => `Te mueves un ${3 * r}% más rápido` },
    { id: 'mend',    name: 'Remiendo',        max: 5, cost: C5,  desc: r => `Al limpiar cada sala recuperas un ${4 * r}% de tu vida máxima más, además del 5% de siempre` },
    { id: 'reflex',  name: 'Reflejos',        max: 2, cost: [50, 150],          desc: r => (r < 2 ? 'Tienes una carga de esquive más' : 'Tienes una carga de esquive más, y tus esquives se recargan un 20% antes') },
    { id: 'revive',  name: 'Segundo aliento', max: 3, cost: [40, 90, 180],     desc: r => `Una vez por partida, si mueres vuelves con el ${10 + 20 * r}% de tu vida máxima y 1,5 s de invulnerabilidad` } ] },
  { name: 'Oficio', sub: 'Daño, cadencia, alcance y disparo cargado', nodes: [
    { id: 'rate',    name: 'Pulso firme',     max: 8, cost: C8,  desc: r => `Disparas un ${3 * r}% más rápido` },
    { id: 'dmg',     name: 'Golpe certero',   max: 8, cost: C8,  desc: r => `Todo tu daño sube un ${4 * r}%, también el del disparo cargado` },
    { id: 'eye',     name: 'Ojo de herrero',  max: 5, cost: C5,  desc: r => `Tus disparos normales llegan un ${5 * r}% más lejos` },
    { id: 'brake',   name: 'Frenazo corto',   max: 5, cost: C5,  desc: r => `El frenazo de cada disparo dura un ${6 * r}% menos. No afecta a Dedos tensos, Dedos de molinete, Dedos de retén ni Dedos de rescoldo` },
    { id: 'armorer', name: 'Maestro armero',  max: 5, cost: C5,  desc: r => `El disparo cargado se carga un ${10 * r}% más rápido. No acorta la espera entre un cargado y el siguiente` },
    { id: 'coup',    name: 'Golpe de gracia', max: 5, cost: C5,  desc: r => `Tu daño directo hace un ${8 * r}% más a los enemigos con menos del 30% de vida` } ] },
  { name: 'Memoria', sub: 'Oro, almas y más opciones al elegir', nodes: [
    { id: 'purse',   name: 'Bolsa honda',     max: 5, cost: C5,  desc: r => `Empiezas cada partida con ${25 * r} de oro` },
    { id: 'nose',    name: 'Olfato',          max: 5, cost: C5,  desc: r => `Las salas de almas te dan un ${10 * r}% más de almas` },
    { id: 'luck',    name: 'Favor robado',    max: 5, cost: C5,  desc: r => `Las técnicas que te ofrecen salen Épicas un ${5 * r}% más a menudo y Comunes un ${5 * r}% menos. Una Rara llega con 1 nivel más; una Épica, con 2` },
    { id: 'reroll',  name: 'Regateo',         max: 3, cost: [30, 60, 130],      desc: r => `Al quebrar una reliquia, puedes volver a sortear las técnicas ${r === 1 ? 'una vez' : r + ' veces'}. Se recarga en cada sala` },
    { id: 'eye4',    name: 'Buen ojo',        max: 1, cost: [120],              desc: () => 'Al quebrar una reliquia, eliges entre cuatro técnicas en vez de tres' },
    { id: 'recall',  name: 'Recuerdo vivo',   max: 1, cost: [200],              desc: () => 'Al empezar cada partida eliges una técnica entre tres, de cualquier deidad que ya se haya fijado en ti' },
    { id: 'door',    name: 'Otra puerta',     max: 1, cost: [180],              desc: () => 'Al acabar cada sala tienes una puerta más para elegir. No sirve en Defensa ni en Asalto, ni en la sala anterior al jefe' } ] },
];
const TREE_NODES = TREE.flatMap(br => br.nodes), TREE_TOTAL = TREE_NODES.reduce((a, n) => a + n.cost.reduce((x, y) => x + y, 0), 0);
// El árbol del segundo reino: más rangos de las mismas mejoras, por encima del tope del primero. Se abre al matar al dios de Valdehierro.
const ext = (base, max, cost) => { const b = TREE_NODES.find(n => n.id === base); return { id: base + '2', ext: base, name: b.name + ' II', max, cost, desc: r => b.desc(b.max + r) }; };
const D8 = curve(150, 1.5, 8), D5 = curve(200, 1.7, 5), D3 = [300, 600, 1200];
const TREE2 = [
  { name: 'Cuerpo II', sub: 'Más vida, defensa y movimiento', nodes: [ext('hp', 8, D8), ext('skin', 3, D3), ext('feet', 3, D3), ext('mend', 5, D5)] },
  { name: 'Oficio II', sub: 'Más daño, cadencia, alcance y disparo cargado', nodes: [ext('rate', 8, D8), ext('dmg', 8, D8), ext('eye', 3, D3), ext('armorer', 3, D3), ext('coup', 5, D5)] },
  { name: 'Memoria II', sub: 'Más oro, almas y mejores técnicas', nodes: [ext('purse', 5, D5), ext('nose', 5, D5), ext('luck', 3, D3)] },
];
const TREE2_NODES = TREE2.flatMap(br => br.nodes), TREE2_TOTAL = TREE2_NODES.reduce((a, n) => a + n.cost.reduce((x, y) => x + y, 0), 0);
const TREE_EXT = Object.fromEntries(TREE2_NODES.map(n => [n.ext, n.id])), TREE_ALL = TREE_NODES.concat(TREE2_NODES);
// Salas que no son de deidad: lo que dan al limpiarlas.
const ROOMS = {
  souls: { name: 'Sala de almas',          tag: 'Almas',   color: '#b9c6ff', desc: 'Almas para el árbol de habilidades (también te las paga el reino al cumplir encargos). Si repites un encargo ya cumplido, estas salas dan el 30%.' },
  iron:  { name: 'Veta de Hierro Místico', tag: 'Hierro',  color: '#c9d2e0', desc: 'Hierro Místico: lo necesitas para forjar cualquier pieza de los guanteletes.' },
  heart: { name: 'Fuente de vida',         tag: 'Vida',    color: '#ff6f86', desc: '+20% de vida máxima, y recuperas esa misma cantidad.' },
  gold:  { name: 'Cámara del tesoro',      tag: 'Oro',     color: '#ffd24a', desc: 'Oro para gastar en la tienda que hay antes del jefe.' },
  anvil: { name: 'Yunque abandonado',      tag: 'Yunque',  color: '#f2c14e', desc: 'Elige una mejora de los guanteletes para esta partida: cadencia, daño, alcance o velocidad.' },
};

const C = {
  wall: '#120e14', floor: '#1a1e29', tile: '#1f2431', edge: '#4d3f3a',
  ink: '#efe6d0', dim: '#a89c8a', ember: '#ff8a3c', energy: '#f2c14e', blood: '#d8434f', arcane: '#b68cff',
};


// Glosario: cada palabra propia del juego, explicada en una línea. Se añade sola debajo de cualquier texto que la use.
const GLOSS = [
  [/Ascuas?/, 'Ascuas', 'fuego clavado en un enemigo (lo ponen las técnicas de Dragones). Cada Ascua le quita el 12% de tu daño cada medio segundo. Se acumulan hasta 8 por enemigo. Si pasan 4 s sin clavarle otra, se apagan todas.'],
  [/Venenos?\b|envenenad/, 'Veneno', 'puntos en un enemigo (técnicas de Veneno). Cada punto le quita el 3,5% de tu daño cada medio segundo. Hasta 30 puntos. No se va nunca: dura hasta que muere.'],
  [/Cristal(es)?/, 'Cristales', 'piedras que se quedan en el suelo 9 s (técnicas de Minerales). Como mucho hay 6 a la vez; si sale otro, se va el más viejo. Solos no hacen nada: otras técnicas y piezas los usan.'],
  [/Reserva/, 'Reserva', 'escudo extra (técnicas de Manjares). La curación que te sobra con la vida llena se guarda aquí, hasta 30 puntos; cada punto vale el 1% de tu vida máxima. Los golpes la gastan antes que tu vida.'],
  [/Furia/, 'Furia', 'barra de 0 a 100 (técnicas de Orcos o los Dedos de tambor). Sube al golpear y al recibir golpes. Si pasas 2 s sin pelear, baja 8 por segundo. Muchas técnicas de Orcos mejoran con más Furia o con la barra llena.'],
  [/\becos?\b/, 'Eco', 'repetición del disparo que llega sola 1,5 s después al mismo enemigo (técnicas del Tiempo). Aplica tus efectos de disparo y puede ser crítico.'],
  [/Sombras?/, 'Sombras', 'enemigos muertos que se levantan y luchan a tu lado 9 s (técnicas de Sombras). Como mucho tienes 2 más el nivel de tu técnica de disparo de Sombras; si sale otra, se va la más vieja.'],
  [/Agujas?|descarg/, 'Agujas', 'se clavan en un enemigo sin hacer daño, hasta 6 (técnicas de Tormenta). Se caen a los 6 s si no le clavas más. Al descargarlas, recibe tu daño por cada Aguja y salta un rayo por Aguja (60% de tu daño) a enemigos cercanos.'],
  [/Empapad|empapa/, 'Empapado', 'mojado unos segundos (técnicas de Mareas). A un Empapado le basta un empujón más flojo para chocar contra un muro. Un jefe Empapado, que no se deja empujar, recibe ese golpe con cada empujón fuerte, sin aturdirse y una vez cada 3 s. Además, algunas técnicas de Mareas y dúos hacen más contra Empapados.'],
  [/Semillas?/, 'Semillas', 'se plantan en un enemigo (técnicas de Bosque). Al juntar 3 (2 si tu técnica de disparo de Bosque está a nivel 2 o más), brotan: recibe el 80% de tu daño por nivel de esa técnica y queda Enraizado 1,5 s.'],
  [/Raíces|enraíza|enraizad|Enraizad/, 'Enraizado', 'el enemigo no puede moverse del sitio, pero sí atacar. En los jefes dura un tercio.'],
  [/Escarcha|Congelad|congela/, 'Escarcha', 'puntos de frío (técnicas de Hielo). Cada punto frena al enemigo un 12% más. Al quinto queda Congelado 1,5 s: ni se mueve ni ataca. Los jefes solo quedan muy frenados, la mitad de tiempo. Si pasan 4 s sin ponerle más, se va.'],
  [/Heridas?\b|sangra/, 'Heridas', 'cortes que sangran (técnicas de Sangre), hasta 6. Cada medio segundo el enemigo pierde el 5% de tu daño por Herida, y hasta el triple cuanta menos vida te quede a ti. Duran 5 s desde la última.'],
  [/Sentencias?/, 'Sentencia', 'cuenta atrás de 5 s sobre un enemigo (la ponen las técnicas del Final y la Brasa de sentencia). Mientras dura, apunta el daño de tus golpes (el continuo no cuenta). Al acabar, recibe de golpe un porcentaje de ese daño: del 40% al 120% según el nivel de la técnica Sentencia. Si muere antes, estalla: cada enemigo de alrededor recibe lo que le tocaba a él. Solo una por enemigo.'],
  [/Ilumina/, 'Iluminado', 'marcado con luz 6 s (técnicas de Luz). Solo no hace nada. Si llevas la técnica Señalar (disparo de Luz), cuando un Iluminado recibe daño, los demás Iluminados reciben también del 30% al 70% (según su nivel).'],
  [/Dormid|\bduerme|Adormilad/, 'Dormido', 'ni se mueve ni ataca (técnicas del Sueño). El primer golpe le hace el doble de daño (más con la técnica Arrullo) y lo despierta; el daño continuo también lo despierta. Los jefes no se duermen: quedan Adormilados la mitad de ese tiempo, frenados a la mitad, y cuentan como Dormidos para todo el daño extra. Tras despertar no puede volver a dormirse en 4 s (un jefe, en 6 s desde que lo adormilas).'],
  [/pozo|Singularidad/, 'Pozo', 'punto del suelo que arrastra hacia él a los enemigos cercanos unos segundos (técnicas del Vacío y algunas piezas). No arrastra a los jefes.'],
  [/\bReflejo\b/, 'Reflejo', 'copia tuya que aparece al otro lado de tu objetivo y repite tus disparos (técnicas de Espejos).'],
  [/sabueso|cachorro|\bperros?\b|[Mm]anada|lobo alfa/, 'Manada', 'los perros que te acompañan y muerden cada 0,8 s al enemigo al que disparas (técnicas de Bestias o el Brazal de perrera). Empiezan de cachorros, que muerden al 60% de su fuerza; crecen a sabuesos (100%) y el primero llega a lobo alfa: 130%, corre más y cada mordisco alcanza también, con el 30% de su daño, a hasta 3 enemigos pegados a su presa. Seis perros como mucho.'],
  [/\bCaza\b/, 'Caza', 'bajas de la misión con algún perro a tu lado; un elegido o un jefe cuentan por 5. No se pierde al cambiar de sala. Con 6 de Caza, los cachorros crecen a sabuesos; con 25, el primero se hace lobo alfa; con 60 se une un cachorro más, que crece a sabueso con 120. Bajo el primer perro, una barra marca lo que falta.'],
  [/Temple/, 'Temple', 'puntos que ganan los guanteletes al disparar (técnicas de Forja), hasta 10; la técnica Temple sube ese máximo 2 por nivel a partir del segundo. Cada punto da +3% de daño. Si te golpean, pierdes la mitad.'],
  [/crític/, 'Crítico', 'disparo que hace el 250% del daño. Solo hay probabilidad de crítico si llevas algo que la dé (técnicas de Fortuna, los Dedos de tahúr…).'],
  [/aturd/, 'Aturdido', 'ni se mueve ni ataca durante el tiempo indicado.'],
  [/Compás/, 'Compás', 'pulsar el disparo justo cuando se llena el anillo que te rodea (Dedos de compás).'],
  [/frenazo|te frena/, 'Frenazo', 'el instante en que te quedas quieto al disparar. Algunas piezas lo acortan o lo quitan.'],
  [/esquive que lo atraviesa|[Aa]travesar a un enemigo con el esquive|[Ee]mbestir a un enemigo|Atravesar/, 'Atravesar', 'esquivar pasando a través de un enemigo.'],
  [/zarzal|zarzas/, 'Zarzal', 'espinas en el suelo que frenan y dañan a quien las pisa.'],
  [/contra (un|el) muro/, 'Golpe contra el muro', 'si empujas fuerte a un enemigo contra un muro o el borde de la sala, recibe un golpe del 90% de tu daño y queda aturdido 0,7 s. A los jefes no se les empuja: solo lo reciben si están Empapados.'],
  [/Maestría/, 'Maestría', 'efecto extra de una deidad: se activa si llevas técnicas suyas en 3 de tus 4 acciones (disparo, cargado, esquive y pasiva).'],
  [/\b[Dd]úos?\b/, 'Dúo', 'técnica que mezcla dos. Te la ofrecen si llevas una técnica de una deidad en una acción y otra deidad te da la suya para esa misma acción. Sustituye a las dos.'],
  [/[Rr]esonancia/, 'Resonancia', 'efecto extra que se activa solo al llevar a la vez una pieza concreta de los guanteletes y una técnica concreta.'],
  [/[Ee]nsambl/, 'Ensamble', 'efecto extra que se activa al montar a la vez dos piezas concretas de los guanteletes.'],
  [/[Ll]egendari/, 'Guanteletes legendarios', 'tres piezas concretas montadas a la vez: los guanteletes cambian de nombre y ganan un efecto propio.'],
  [/[Aa]fín\b|[Aa]finidad/, 'Afinidad', 'piezas hechas con material de una deidad: si en la misión llevas alguna técnica de esa deidad, la pieza gana un extra.'],
];
function gloss(txt, max) {
  const out = [];
  for (const [re, name, what] of GLOSS) { if (re.test(txt)) out.push(`<q><b>${name}:</b> ${what}</q>`); if (out.length >= (max || 6)) break; }
  return out.length ? `<small class="gloss">${out.join('')}</small>` : '';
}
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
  a_shackle: { da: 'frenado' },                               // el encadenado va frenado
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
// ───────────────────────── Utilidades ─────────────────────────
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const rnd = (a, b) => a + Math.random() * (b - a);

const cv = $('game');
const scr = cv.getContext('2d');
// El mundo se pinta en un lienzo pequeño (1 unidad = 1 píxel) y se amplía por un número entero: una sola rejilla de píxeles
const lo = document.createElement('canvas'), loCtx = lo.getContext('2d');
// El jugador se pinta en su propia capa pequeña y se coloca en pantalla con precisión de píxel de pantalla (ver render):
// así ni él ni el mundo dan saltos de un píxel «gordo» al moverse. ctx apunta a la capa en la que se está pintando.
const PL = 192, plCv = document.createElement('canvas'), plCtx = plCv.getContext('2d'); plCv.width = plCv.height = PL;
let ctx = loCtx;
// Imágenes de un paquete comprado o gratuito (carpeta assets/). Si alguna no carga, el juego usa su dibujo propio.
// Créditos y licencia: assets/LICENSE-fantasy-rpg-pixel-pack.txt
const IMG = {};
function loadImg(k, src) { const im = new Image(); im.onload = () => { IMG[k] = im; }; im.src = src; }
loadImg('vfx', 'assets/pickups_vfx.png'); loadImg('items', 'assets/items.png');
// Personajes animados (CHARACTER MEGAPACK de overboy): un atlas con todos los fotogramas, y su copia en blanco para el destello al recibir un golpe
{ const im = new Image(); im.onload = () => { const f = document.createElement('canvas'); f.width = im.width; f.height = im.height; const g = f.getContext('2d'); g.drawImage(im, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, f.width, f.height); IMG.chars = im; IMG.charsF = f; }; im.src = 'assets/chars.png'; }
const VFX = { coin: 0, silver: 1, ruby: 2, sapphire: 3, emerald: 4, torch: 5, voidTorch: 6, slashIce: 7, slashFire: 8, slashVoid: 9 };
// Un fotograma de una tira de 8 (32×32), centrado en (x, y)
function strip(row, frame, x, y) { if (!IMG.vfx) return false; ctx.drawImage(IMG.vfx, (((frame | 0) % 8) + 8) % 8 * 32, row * 32, 32, 32, Math.round(x - 16), Math.round(y - 16), 32, 32); return true; }
const ICO = { potion: 0, mana: 1, vial: 2, sword: 3, shield: 4, chest: 5, gem: 6, book: 7, key: 8, axe: 9, bow: 10, staff: 11, helm: 12, ring: 13, scroll: 14, bomb: 15, lantern: 16, mug: 17 };
// Icono propio de una pieza o técnica (assets/icons.png); cadena vacía si no tiene
const pic = (id, cls) => (id in PIC ? `<span class="pic${cls ? ' ' + cls : ''}" style="background-position:-${PIC[id] % 16 * 32}px -${Math.floor(PIC[id] / 16) * 32}px"></span>` : '');
const ico = (name, tier) => `<span class="ico" style="background-position:-${ICO[name] * 32}px -${(tier || 0) * 32}px"></span>`;
const view = { s: 1, w: 520, h: 300, cssW: 1, cssH: 1, dpr: 1 };
const cam = { x: 0, y: 0, fx: 0, fy: 0, shx: 0, shy: 0, pl: false };   // x, y: píxel entero del juego; fx, fy: la fracción que sobra, que se aplica al ampliar

// ───────────────────────── Sonido (efectos grabados y música) ─────────────────────────
// Versión del juego (la pone build.sh: el número de commits) y dónde está corriendo
const GAME_V = +'__GAME_V__' || 0, IN_APP = location.hostname === 'kiteo.app';
// Ajustes del jugador: se guardan aparte de la partida, así que sobreviven a «Nueva partida»
const CFG = { sound: 1, music: 3, sfx: 3, blend: 1 };
try { Object.assign(CFG, JSON.parse(localStorage.getItem('kiteo.cfg') || '{}')); } catch (e) { /* sin ajustes guardados */ }
function saveCfg() { try { localStorage.setItem('kiteo.cfg', JSON.stringify(CFG)); } catch (e) { /* almacenamiento bloqueado */ } }
let AC = null, muted = !CFG.sound;
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
  sfxLoad();
}
// ── Efectos grabados y música (assets/audio, todo CC0; ver assets/library/CREDITOS.txt). Si un archivo no carga, esa acción se queda sin sonido ──
const SFX = {}, SFXT = {}, MUS = {}; let musNow = null, sfxAsked = false;
function sfxLoad() {
  if (sfxAsked || !AC) return; sfxAsked = true;
  for (const n of ['cast', 'hit', 'kill', 'hurt', 'charged', 'boom', 'relic', 'pick', 'bossdie', 'dodge', 'tick', 'ok', 'no', 'fanfare', 'crit', 'zap', 'eshot', 'roar', 'crack', 'ice', 'burn', 'heal', 'chime', 'block'])
    fetch('assets/audio/' + n + '.mp3').then(r => r.arrayBuffer()).then(b => AC.decodeAudioData(b)).then(buf => { SFX[n] = buf; }).catch(() => {});
}
function sfx(name, vol = 0.5, rate = 1, gap = 0.05) {
  if (!AC || muted || hushed || AC.state !== 'running') return;
  const buf = SFX[name], t = AC.currentTime; if (!buf || t - (SFXT[name] || -1) < gap) return;
  SFXT[name] = t;
  try { const src = AC.createBufferSource(), g = AC.createGain(); src.buffer = buf; src.playbackRate.value = rate; g.gain.value = vol * CFG.sfx / 3; src.connect(g); g.connect(AC.destination); src.start(t); } catch (e) { /* sin sonido */ }
}
// La música va por pantalla: título, aldea, mazmorra, campo abierto, jefe y victoria. En los menús de dentro de una misión sigue la que sonaba.
let hushed = false;   // la app está en segundo plano o la pestaña oculta: ni música ni efectos
function hush(on) { hushed = !!on; if (hushed && musNow && MUS[musNow]) { MUS[musNow].pause(); } else if (!hushed) musicTick(); }
document.addEventListener('visibilitychange', () => hush(document.hidden));
function musicWant() {
  if (muted || hushed || !S || !CFG.music) return null;
  const m = S.mode;
  if (m === 'intro') return S.intro && S.intro.L === ENDING ? 'm_end' : 'm_title';   // el final del reino tiene su propia música
  if (m === 'title') return 'm_title';
  if (m === 'dead') return null;
  if (m === 'win') return 'm_win';
  if (m === 'town' || S.town) return 'm_town';
  if (m === 'play') return S.enemies.some(e => e.boss) ? 'm_boss' : S.out ? 'm_battle' : 'm_crypt';
  return musNow || 'm_town';
}
function musicTick() {
  if (!AC) return;                      // hasta el primer toque no puede sonar nada
  const w = musicWant();
  if (w !== musNow) {
    if (musNow && MUS[musNow]) MUS[musNow].pause();
    musNow = w;
    if (w) { const a = MUS[w] || (MUS[w] = new Audio('assets/audio/' + w + '.mp3')); a.loop = w !== 'm_win'; try { a.currentTime = 0; } catch (e) { /* aún sin cargar */ } }
  }
  const a = musNow && MUS[musNow];
  if (a) a.volume = Math.min(1, 0.32 * CFG.music / 3);
  if (a && a.paused && !(musNow === 'm_win' && a.ended)) { const pr = a.play(); if (pr && pr.catch) pr.catch(() => {}); }
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
  let tabR = down('KeyR'), back = down('ShiftLeft') || down('ShiftRight') || down('KeyK');   // en menús: RB (o R) pestaña siguiente; B (o Shift) volver

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
    clear = clear || b(11); tab = tab || b(4); tabR = tabR || b(5); back = back || b(1);
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
  I.tabL = I.tabP; I.tabR = tabR && !prev.tabR; prev.tabR = tabR; I.backP = back && !prev.back; prev.back = back;
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
  if (best) { S.lock = best; sfx('tick', 0.2, 1.4); }
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
// Deidades abiertas: las cuatro del principio más una por cada encargo previo al dios ya cumplido. Sale de M.done, así que
// un guardado anterior a este sistema tiene las que le tocan sin migrar nada.
const jobsDone = () => Object.keys(M.done || {}).filter(id => M.done[id] && /^[a-z]+:\d+:(\d+|b)$/.test(id)).length;
const godsOpenN = () => Math.min(GOD_UNLOCK.length, GOD_START.length + jobsDone());
const godsOpen = () => GOD_UNLOCK.slice(0, godsOpenN());
const godIsOpen = g => GOD_UNLOCK.indexOf(g) < godsOpenN();
const randGod = () => { const L = godsOpen(); return L[Math.floor(Math.random() * L.length)]; };
const tr = id => +M.tree[id] || 0;   // rangos comprados de un nodo concreto
const tk = id => tr(id) + (TREE_EXT[id] ? tr(TREE_EXT[id]) : 0);   // rango efectivo de una habilidad: lo del primer árbol más lo del segundo
const tree2Open = () => KINGDOMS.length > 1 && !!(M.done || {})['valdehierro:g'];   // el segundo árbol llega con el segundo reino; mientras no exista, ni se enseña
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
    p: { hp: p.hp, maxHp: p.maxHp, dmg: p.dmg, as: p.as, range: p.range, speed: p.speed, revive: p.revive, gold: p.gold, reserve: p.reserve, powMul: p.powMul || 1 } }));
  save();
}
function resumeRun() {
  const r = M.run; newGame(); tipClear(); S.mission = r.mission; S.repeat = isDone(r.mission.id); S.keepHp = r.keepHp;
  S.gun = Object.assign({}, BASE_GUN, r.gun); S.build = JSON.parse(JSON.stringify(r.build)); S.techs = new Set(r.techs); S.plans = new Set(r.plans); S.next = r.next;
  if (S.next && S.next.type === 'god' && !godIsOpen(S.next.god)) S.next.god = randGod();   // una sala guardada con una deidad que aún no se ha fijado en ti
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
    gun: Object.assign({}, BASE_GUN), resSeen: new Set(), soulsRun: 0, ironRun: 0, matsRun: zeroMats(), rerolls: 0, kills: 0, xp: 0, xpLvl: 0, pendingXp: 0, shop: null, banquet: 0,
    t: 0, shake: 0, hitstop: 0, lastStop: -1, hurtFx: 0, noTarget: 0, waveT: 0, waveClear: 0,
    p: {
      x: T.room.w / 2, y: T.room.h / 2, r: P.r, hp: P.hp, maxHp: P.hp, dmg: P.dmg, as: P.as, range: P.range, speed: P.speed, shotN: 0, crysN: 0,
      face: 0, tier: 1, drillN: 0, drillT: null, fly2: 0, lastShotT: -9, overT: 0, rotaT: null, grow: 0, leechN: 0, danced: false, idle: 0, alt: false, comboN: 0, comboT: null, venge: 0, temper: 0, redhot: 0, broke: false, pend: 0, clip: 0, orbA: 0, orbAway: 0, wardCd: 0, runUp: 0, drumT: null, pity: 0, streak: 0, quick: 0, quickBig: false, buttCd: 0, cd: 0, windup: 0, windupTotal: 0, windupTarget: null, buffer: 0, wasReady: true, readyT: 0, spoil: false, crit: false, spin: 0,
      dodgeT: 0, dodgeCd: T.dodge.cd, dodgeN: 1, dodgeFrom: null, dodgeHit: new Set(), isLunge: false, fly: false, dvx: 0, dvy: 0, inv: 0, lanceDmg: 0,
      charging: false, charge: 0, chargeCd: 0, chargeCdMax: T.charge.cd, chargeDir: 0, drawing: false, draw: 0, drawPow: 0,
      fury: 0, furyT: 0, reserve: 0, resT: 0, gold: 0, revive: 0, heat: 0, heatT: 0, over: 0, gat: 0, shells: 2, trig: 0, still: 0, feastShot: false,
    },
    enemies: [], shots: [], fx: [], queue: [], lock: null, target: null, coins: [], chests: [], calm: null,
    build: { basic: null, charge: null, dodge: null, passive: null }, techs: new Set(), plans: new Set(), drop: null,
    mirrors: [], pets: [], wells: [], mines: [], traps: [], stat: { horn: 0, ends: 0, net: 0, over: 0, awl: 0, timed: 0, wind: 0, blink: 0, quake: 0, choir: 0, themed: 0, quickb: 0, grave: 0, boom: 0, nail: 0, arc: 0, far: 0, swarm: 0, spring: 0, kick: 0, rider: 0, traced: 0, splash: 0, split: 0, meteor: 0, cchain: 0, balm: 0, cbounce: 0, volley: 0, mirror: 0, mcharge: 0, bite: 0, pounce: 0, temper: 0, share: 0, sleep: 0, well: 0, frozen: 0, shatter: 0, doom: 0, bleed: 0, fork: 0, hook: 0, flame: 0, rear: 0, flail: 0, first: 0, freeze: 0, frag: 0, last: 0, hop: 0, spk: 0, block: 0, orb: 0, mine: 0, onetwo: 0, spike: 0, sprout: 0, crit: 0, heads: 0, tails: 0, dice: 0, finish: 0, quick: 0, tempo: 0, bounce: 0, bombs: 0, bombHits: 0, chain: 0, blessed: 0, slam: 0, butt: 0 }, zones: [], timers: [], walls: titleWalls, roomKind: '', turrets: [], crystals: [], shades: [], fields: [], hazards: [], lasers: [],
  };
}
function setMode(m) { S.mode = m; modeT = 0; renderOverlay(); }
function startRun(mission) {
  newGame(); tipClear(); M.run = null; S.mission = mission; S.repeat = isDone(mission.id);   // repetir un encargo ya cumplido paga menos
  const p = S.p;   // lo que traes de otras vidas: tus guanteletes y tu árbol
  S.gun = Object.assign({}, M.gun);
  p.maxHp += 10 * tk('hp'); p.dmg *= 1 + 0.04 * tk('dmg'); p.speed *= 1 + 0.03 * tk('feet'); p.gold = 25 * tk('purse');
  p.hp = p.maxHp; p.revive = tk('revive') ? 1 : 0; p.dodgeN = dodgeMax();
  S.next = { type: 'god', god: randGod() };   // la primera sala siempre es de una deidad
  if (tk('recall')) {   // Recuerdo vivo: empiezas eligiendo una técnica
    const opts = PIECES.filter(x => godIsOpen(x.god)).sort(() => Math.random() - 0.5).map(pieceCard).filter(Boolean).slice(0, 3);   // solo las que sirven solas (pieceCard filtra)
    pickQueue = [() => ({ eyebrow: 'Lección del maestro', title: 'Recuerdas una técnica que te enseñó el herrero', opts, tip: 'relic' })];
    advancePick(); return;
  }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}

// Entrar en la siguiente sala (o en el jefe del mundo)
function nextWave() {
  S.wave += 1;
  const ms = S.mission, n = S.wave, r = n, K = KINGDOMS.find(x => x.id === ms.k), W = zoneWorld(K, ms.z) + 1, world = WORLDS[W - 1];   // el paisaje y los enemigos de la zona
  S.world = W; S.room = r; S.bossRoom = hasBoss(ms) && r === roomsOf(ms);
  // Nivel de dificultad: sube con la zona y con lo adentro que estés de la misión
  S.lvl = (K.lvl0 || 0) + ms.z * 2.5 + (ms.type === 'doors' ? r : ms.type === 'defend' ? r * 1.15 : ms.type === 'assault' ? 1 + r * 2.6 : ms.type === 'boss' ? 2 + r * 1.3 : 9 + r * 1.2);
  const first = ms.z === 0 && ms.type === 'doors' && r === 1 && !isDone(ms.id), bossKey = ms.type === 'god' ? K.god : zoneBoss(K, ms.z);
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
  const room = ms.type === 'defend' ? buildRoom(false, 'aldea_ext', 'big') : ms.type === 'assault' ? buildRoom(false, 'pradera', 'vast') : buildRoom(S.bossRoom);   // la aldea y los campamentos están al aire libre   // forma, tamaño y muros nuevos en cada sala
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.town = null; S.solidProps = room.solids || []; S.roomKind = room.kind; S.roomT = S.t; S.lastHitT = S.t; S.traps = first || ms.type === 'defend' || S.lvl < 3 ? [] : room.traps;
  S.p.x = room.start.x; S.p.y = room.start.y;
  S.coins = []; S.chests = []; S.calm = null;
  if (!S.bossRoom && (ms.type === 'doors' || ms.type === 'boss' || ms.type === 'god')) placeChests();   // a veces, un cofre suelto (44_calm.js)
  for (const s of S.shades) { s.x = S.p.x + rnd(-20, 20); s.y = S.p.y + rnd(-20, 20); }
  if (r === 1) note(S.p.x, S.p.y - 30, ms.name, C.ink, true);
  if (S.bossRoom) note(S.p.x, S.p.y - 30, TYPES[bossKey].name, C.blood, true);
  if (ms.type === 'defend') { const mh = 700 + 150 * ms.z; S.keep = { x: T.room.w / 2, y: T.room.h / 2, r: 14, hp: Math.min(mh, S.keepHp == null ? mh : S.keepHp), maxHp: mh, flash: 0 }; fillDefWave(); }
  if (ms.type === 'assault') setupAssault();
  checkRes();   // lo que tus guanteletes y tus técnicas despiertan juntos se anuncia al entrar
  tip('shoot', ms.type === 'defend' ? 'defend' : ms.type === 'assault' ? 'assault' : S.bossRoom ? 'boss' : '', 'dodge', 'charge');   // avisos de ayuda: solo salen los que no se hayan visto
  saveRun();
}

// Aspecto de cada enemigo: mismo papel, otra criatura según la zona (verdes al principio, criaturas del bosque en el Nido,
// pieles azules y cíclopes en las Minas, pieles rojas en el Umbral), su rasgo de élite o la deidad de su elegido.
function skinOf(k, e) {
  const w = S.world || 1, alt = Math.random() < 0.5, pick = (a, b) => (alt ? a : b);
  if (e.champ) return e.god === 'wood' ? 'champ_wood' : 'champ';
  if (k === 'lancer') return e.elite ? { fast: 'lancer_gold', tough: 'lancer_silver', volatile: 'lancer_rad' }[e.elite]
    : w === 2 ? pick('lancer_orc', 'lancer_oniric') : w === 3 ? pick('lancer_frozen', 'lancer_bio') : w === 4 ? pick('lancer_devil', 'lancer_red') : 'lancer';
  // Monstruos de Pixel Crawler, mitad y mitad con los de siempre: muertos en las Criptas, hongos en el Nido, ratas en las Minas, piedra viva en el Umbral
  const PCM = {
    1: { stalker: ['pc_skel', 'pc_zombie'], runner: ['pc_skel_rogue'], mage: ['pc_skel_mage'], brute: ['pc_zombie_fat', 'pc_zombie_mus'], shaman: ['pc_banshee'], sniper: ['pc_skel_war'] },
    2: { stalker: ['pc_fungus_long'], runner: ['pc_fungus'], brute: ['pc_fungus_heavy'], shaman: ['pc_fungus_old'] },
    3: { stalker: ['pc_rat'], runner: ['pc_rat_rogue'], mage: ['pc_rat_mage'], brute: ['pc_rat_war'] },
    4: { stalker: ['pc_stone_broken'], brute: ['pc_stone_lava', 'pc_golem'], mage: ['pc_stone'] },
  }[w];
  if (PCM && PCM[k] && !e.elite && Math.random() < 0.5) { const l = PCM[k]; return l[Math.floor(Math.random() * l.length)]; }
  const suf = w === 3 ? '_b' : w === 4 ? '_r' : '';
  if (k === 'stalker') return w === 2 ? 'stalker_ent' : k + suf;
  if (k === 'brute') return w === 2 ? (e.elite ? 'brute_ent3' : 'brute_ent') : k + suf;
  if (k === 'bat') return w === 2 ? 'bat_fly' : k;
  if (k === 'runner') return w >= 3 ? 'runner_2' : k;
  if (k === 'sniper') return w === 3 ? pick('sniper_cyc', 'sniper_b') : k + suf;
  if (k === 'bomber') return e.elite && w >= 3 ? 'bomber_mimic' : k + suf;   // el barrilero de élite es un cañón con patas
  if (k === 'mage') return w === 3 ? 'mage_2' : w === 4 ? 'mage_3' : k;
  return k;
}
function spawn(typeKey, q) {
  const ty = TYPES[typeKey], p = S.p; q = q || {};
  let x = 0, y = 0;
  const god = ty.champ ? (S.god || randGod()) : null;
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
  e.skin = skinOf(typeKey, e);
  { const m = ATLAS[e.skin]; if (m) e.r = clamp(Math.round((m.bw + m.bh) / 4), 5, ty.boss ? 34 : 18); }   // la zona de golpe sigue al cuerpo del modelo
  if (q.raid) e.raid = true;
  if (q.camp) { e.camp = q.camp; const a = Math.random() * 6.283, r = 26 + Math.random() * 40; e.hx = Math.cos(a) * r; e.hy = Math.sin(a) * r; }   // su sitio en el campamento
  if (has('z_yawn') && S.yawn > 0 && !ty.boss && !ty.post) { S.yawn--; e.sleep = 4.6; e.sleepHits = 0; }   // Bostezo
  if (ty.post) { e.px = x; e.py = y; e.aiCd = 3; e.elite = null; }
  S.enemies.push(e); collide(e, e.r);
  if (god) say(god, 'enter');
}

// ───────────────────────── Mensajes del sistema ─────────────────────────
const sysEl = $('sys'); let sysQ = [], sysT = 0, sysLast = 0;
function sayRaw(text, color) { sysQ.push({ text, color }); if (sysQ.length > 3) sysQ.shift(); }
function say(god, kind) { const g = GODS[god], arr = g.lines[kind]; if (arr) sayRaw(`[La deidad «${g.title}» ${arr[Math.floor(Math.random() * arr.length)]}]`, g.color); }
function sysTick() {
  const now = performance.now(), dt = Math.min(0.1, (now - sysLast) / 1000); sysLast = now;
  if (tipNow && !tipEl.hidden) {   // mientras hay un aviso de ayuda en pantalla, los mensajes esperan su turno (el que estaba a medias vuelve a salir después)
    if (!sysEl.hidden) { if (sysT > 0.5) sysQ.unshift({ text: sysEl.textContent, color: sysEl.style.borderColor }); sysEl.hidden = true; sysT = 0; }
    return;
  }
  sysT -= dt;
  if (sysT > 0) return;
  if (sysQ.length) { const m = sysQ.shift(); sysEl.textContent = m.text; sysEl.style.borderColor = m.color; sysEl.hidden = false; sysT = 3.2; }
  else sysEl.hidden = true;
}

// ───────────────────────── Al limpiar una sala ─────────────────────────
let pickHead = { eyebrow: '', title: '' }, pickQueue = [], bookFrom = 'pause', afterPicks = null, pickReroll = null, pickTip = null;
const rollRar = () => { const r = Math.random() + 0.05 * tk('luck'); return r < 0.4 ? 0 : r < 0.78 ? 1 : 2; };   // 40% comunes, 38% raras, 22% épicas: las técnicas llegan con más nivel
const statScreen = () => ({ eyebrow: 'Yunque', title: 'Afina los guanteletes', opts: UPGRADES.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(u => ({ tag: 'Ajuste', name: u.name, desc: u.desc, note: '', color: C.energy, apply: () => u.apply(S.p) })) });
const planScreen = eyebrow => () => ({ eyebrow, title: 'Un plano para tus guanteletes', opts: PLANS.filter(x => !S.plans.has(x.id) && (!x.only || G(x.only))).sort(() => Math.random() - 0.5).slice(0, 3).map(x => ({ tag: 'Plano', name: x.name, desc: x.desc, note: '', color: C.ink, apply: () => { S.plans.add(x.id); S.p.dodgeN = dodgeMax(); } })) });
// Una pieza de guantelete: la montas ahora y, además, queda descubierta para siempre
function mountPart(id) { discover(id); S.gun[PART[id].slot] = id; S.p.shells = 2; S.p.heat = 0; S.p.drawing = false; S.p.spin = 0; checkRes(); }
const partScreen = eyebrow => () => {
  const pool = PARTS.filter(x => !x.base && !G(x.id)).map(x => [Math.pow(Math.random(), 1 / (M.parts[x.id] ? 0.5 : 1.6)), x]).sort((a, b) => b[0] - a[0]).slice(0, 3).map(x => x[1]);
  if (!pool.length) return null;
  const opts = pool.map(x => { const isNew = !M.parts[x.id], g2 = Object.assign({}, S.gun, { [x.slot]: x.id }), nm = gunName(g2);
    return { tag: GSLOTS[x.slot] + ' · ' + x.tag + (isNew ? ' · nueva' : ''), rar: 0, pic: x.id, name: x.name, color: C.energy, desc: x.desc, note: (affGod(x.id) ? `Afín a ${GODS[affGod(x.id)].theme}: ${AFFIN[affGod(x.id)]}. ` : '') + `Sustituye a ${PART[S.gun[x.slot]].name}` + (nm !== gunName(S.gun) ? ` · pasan a llamarse: ${nm}` : ''), apply: () => mountPart(x.id) }; });
  const fresh = pool.filter(x => !M.parts[x.id]);
  opts.push({ tag: 'Guardar', name: 'No montar nada', color: C.dim, desc: fresh.length ? `Dejas tus guanteletes como están. Te guardas ${fresh[0].name} para la forja.` : 'Dejas tus guanteletes como están.', note: '', apply: () => { if (fresh.length) discover(fresh[0].id); } });
  return { eyebrow, title: 'Una pieza para tus guanteletes', opts };
};
const pieceScreen = (god, eyebrow) => () => { const o = pieceOptions(god); return o.length ? { eyebrow, title: 'Quiebras la reliquia: ' + GODS[god].weapon, opts: o, reroll: () => pieceOptions(god), tip: 'relic' } : statScreen(); };

// Tras limpiar un tramo: recompensa según el tipo de misión, tienda si toca, y a por el siguiente (o a cobrar)
function roomCleared() {
  const p = S.p, n = S.lvl, W = S.world, ms = S.mission, N = roomsOf(ms), last = S.room >= N;
  if (S.bossRoom) { bossDown(); return; }
  p.hp = Math.min(p.maxHp, p.hp + pct(5 + 4 * tk('mend')));
  const gold = Math.round(3 + n); addGold(gold);   // lo demás del oro lo sueltan los enemigos y los cofres
  pickQueue = []; S.rerolls = tk('reroll');
  const unit = ms.type === 'defend' ? 'oleada' : ms.type === 'assault' ? 'campamento' : 'sala', here = ms.name + ' · ' + unit + ' ' + S.room + ' de ' + N;
  let got = '';
  if (ms.type === 'defend') {
    S.keepHp = Math.min(S.keep.maxHp, S.keep.hp + S.keep.maxHp * 0.18);   // entre oleadas los aldeanos apuntalan la campana
    if (!last) pickQueue.push(pieceScreen(S.drop ? S.drop.god : lootGod(), here + ' rechazada · entre los caídos hay una reliquia'));
    // cada oleada paga: almas, un material de una deidad y, cada cuatro, Hierro Místico
    const k = Math.round((10 + 4 * W) * (1 + 0.1 * tk('nose')) * (S.repeat ? REPEAT : 1)), g = lootGod(); S.soulsRun += k; S.matsRun[g] += W;
    got = '+' + k + ' almas, +' + W + ' ' + GODS[g].mat; if (S.room % 4 === 0) { S.ironRun += 1; got += ', +1 de Hierro Místico'; }
  } else if (ms.type === 'assault') {   // cada campamento arrasado: hierro, almas y dos materiales
    const k = W >= 3 ? 2 : 1, s2 = Math.round((28 + 10 * W) * (1 + 0.1 * tk('nose')) * (S.repeat ? REPEAT : 1)), g1 = lootGod(), g2 = lootGod();
    S.ironRun += k; S.soulsRun += s2; S.matsRun[g1] += W; S.matsRun[g2] += W;
    got = '+' + s2 + ' almas, +' + k + ' de Hierro Místico, +' + W + ' ' + GODS[g1].mat + (g2 === g1 ? ' (×2)' : ', +' + W + ' ' + GODS[g2].mat); if (g2 === g1) S.matsRun[g1] += 0;
  }
  else if (S.roomType === 'god' && S.drop) pickQueue.push(pieceScreen(S.drop.god, here + ' · ' + GODS[S.drop.god].title));
  else if (S.roomType === 'souls') { const k = Math.round((22 + 8 * W) * (1 + 0.1 * tk('nose')) * (S.repeat ? REPEAT : 1)); S.soulsRun += k; got = '+' + k + ' almas' + (S.repeat ? ' (encargo repetido: la mitad)' : ''); }
  else if (S.roomType === 'iron') { const k = W >= 3 ? 2 : 1; S.ironRun += k; got = '+' + k + ' de Hierro Místico'; pickQueue.push(partScreen(here + ' · entre el hierro hay algo')); }
  else if (S.roomType === 'heart') { const up = Math.round(p.maxHp * 0.2); p.maxHp += up; p.hp = Math.min(p.maxHp, p.hp + up); got = '+20% de vida máxima (+' + up + ')'; }
  else if (S.roomType === 'gold') { const k = 60 + 20 * W; addGold(k); got = '+' + k + ' de oro'; }
  else if (S.roomType === 'anvil') pickQueue.push(statScreen);
  S.cleared = here + (got ? ' · ' + got : '') + ' · +' + gold + ' de oro';
  if (got) { sayRaw('[' + got.replace('+', 'Consigues ') + ']', (ROOMS[S.roomType] || { color: C.ink }).color); sfx('ok', 0.4); }
  // Después de las recompensas, la calma (44_calm.js): en las incursiones salen las puertas en la sala (y, donde tocaba tienda,
  // también la del campamento del buhonero); antes del jefe, solo la suya; en las defensas, donde tocaba tienda, los aldeanos
  // salen a hablar contigo; en los asaltos, el buhonero.
  const shop = shopAfter(ms, S.room);
  if (last) afterPicks = missionWin;
  else if (ms.type === 'defend') { if (shop) afterPicks = villageCalm; }
  else if (ms.type === 'assault') { if (shop) afterPicks = assaultCalm; }
  else if (S.room + 1 >= N && hasBoss(ms)) afterPicks = () => { resumePlay(); bossDoor(); };
  else afterPicks = () => { resumePlay(); openDoors(doorScreen(), shop ? [campDoor()] : []); };
  advancePick();
}
function bossDown() { sayRaw('[Has vencido a ' + (S.enemies.find(e => e.boss) || { type: { name: S.mission.name } }).type.name + ']', C.ink); missionWin(); }
// Puertas: cada una enseña qué da la sala siguiente
function doorScreen() {
  const roll = Math.random(), n = (roll < 0.22 ? 1 : roll < 0.68 ? 2 : 3) + tk('door'), kinds = [];
  // Las deidades de las que ya llevas alguna técnica salen un poco más (peso 1,3 frente a 1): lo justo para que una build pueda cerrarse
  const gods = godsOpen().map(g => [Math.pow(Math.random(), 1 / (godCount(g) > 0 ? 1.3 : 1)), g]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const bag = ['souls', 'souls', 'souls', 'souls', 'gold', 'gold', 'gold', 'heart', 'heart', 'iron', 'iron', 'anvil', 'anvil'].sort(() => Math.random() - 0.5);
  const res = () => { const k = bag.find(x => !kinds.some(d => d.type === x)); return { type: k || 'gold' }; };
  kinds.push(Math.random() < (n === 1 ? 0.5 : 0.3) || !gods.length ? res() : { type: 'god', god: gods.pop() });
  while (kinds.length < n) kinds.push(kinds.length === n - 1 && !kinds.some(d => d.type !== 'god') ? res() : Math.random() < 0.22 && gods.length ? { type: 'god', god: gods.pop() } : res());
  kinds.sort(() => Math.random() - 0.5);
  return { tip: 'doors', eyebrow: S.cleared || 'Siguiente sala', title: kinds.length > 1 ? '¿Qué puerta cruzas?' : 'Solo hay una puerta', opts: kinds.map(d => {
    if (d.type === 'god') { const G = GODS[d.god], k = godCount(d.god);
      return { tag: 'Deidad · ' + G.theme, name: G.title, desc: `Te espera su elegido. Mátalo y elige una de sus técnicas. Suelta ${G.mat}.`, note: `Técnicas suyas: ${k} de 4 · Maestría «${MASTERY[d.god].name}»: ${Math.min(k, 3)}/3`, color: G.color, ico: ['sword', 1], apply: () => { S.next = d; } }; }
    const R = ROOMS[d.type];
    return { tag: R.tag, name: R.name, desc: R.desc, note: 'Sin elegido: más enemigos corrientes', color: R.color, ico: [{ souls: 'lantern', gold: 'chest', heart: 'potion', iron: 'shield', anvil: 'axe' }[d.type] || 'gem', 0], apply: () => { S.next = d; } };
  }) };
}
function advancePick() {
  while (pickQueue.length) {
    const scr = pickQueue.shift()();
    if (!scr || !scr.opts.length) continue;
    pickHead = { eyebrow: scr.eyebrow, title: scr.title }; pickOpts = scr.opts; pickSel = scr.opts.length > 2 ? 1 : 0; pickReroll = scr.reroll || null;
    pickTip = scr.tip ? tipTake(scr.tip) : null;   // la primera vez que sale esta clase de pantalla, lleva su aviso de ayuda
    setMode('pick'); ov.scrollTop = 0; return;
  }
  if (afterPicks) { const f = afterPicks; afterPicks = null; f(); return; }
  S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}
function rerollPick() {   // Regateo
  if (S.mode !== 'pick' || !pickReroll || S.rerolls <= 0) return;
  S.rerolls -= 1; pickOpts = pickReroll(); pickSel = pickOpts.length > 2 ? 1 : 0; modeT = 0;
  sfx('tick', 0.3,1.2); renderOverlay();
}
function choosePick(i) {
  if (S.mode !== 'pick' || modeT < 0.45 || !pickOpts[i]) return;
  const before = GOD_KEYS.filter(mastery), o = pickOpts[i];
  sfx('pick', 0.5);
  o.apply();
  sfx('pick', 0.5);
  if (o.god) say(o.god, 'take');
  checkRes();
  for (const g of GOD_KEYS) if (mastery(g) && !before.includes(g)) { say(g, 'master'); note(S.p.x, S.p.y - 20, '¡' + MASTERY[g].name + '!', GODS[g].color, true); sfx('fanfare', 0.6); }
  advancePick();
}

// ───────────────────────── Técnicas que te ofrecen ─────────────────────────
// Una por acción. Si ya llevas ahí la técnica de otra deidad y existe dúo entre las dos, te ofrecen el dúo en su lugar.
// Subir de nivel lo que ya llevas sale siempre; lo nuevo, solo si serviría de algo con lo que llevas (tabla de 13_needs.js).
function pieceCard(pc) {
  const cur = S.build[pc.slot], god = pc.god, rar = rollRar();
  const have = godCount(god), M2 = MASTERY[god], isNew = !godsIn(pc.slot).includes(god);
  const prog = !isNew || have >= 3 ? '' : have + 1 >= 3 ? 'Completa la maestría ' + M2.name : M2.name + ': ' + (have + 1) + '/3';
  const o = { tag: SLOTS[pc.slot], rar, pic: pc.id, name: pc.name, color: GODS[god].color, note: prog, god };
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
    return up(D.name, l => duoText(D, l));
  }
  const lvl = 1 + rar, duo0 = cur && !D ? duoFor(cur.id, pc.id) : null, duo = duo0 && duoIsOpen(duo0) ? duo0 : null;   // un dúo con una deidad sin abrir no se ofrece
  if (duo) {   // la técnica que llevas se funde con esta
    if (!duoOk(duo, pc)) return null;   // ni la técnica nueva ni la regla del dúo servirían con lo que llevas (13_needs.js)
    const nl = Math.max(cur.lvl, lvl), old = PIECE[cur.id];
    o.tag = 'Dúo · ' + SLOTS[pc.slot]; o.rar = 3; o.color = RAR[3].color; o.name = duo.name + (nl > 1 ? ' ' + ROMAN[nl] : '');
    o.desc = duoText(duo, nl);
    o.note = `Tu ${old.name} se convierte en esto` + (prog ? ' · ' + prog : '');
    o.apply = () => { S.build[pc.slot] = { id: duo.id, lvl: nl }; };
    return o;
  }
  if (!pieceOk(pc)) return null;   // no te la ofrecen si nada de lo que llevas (ni ella misma) pone lo que necesita (13_needs.js)
  o.name += lvl > 1 ? ' ' + ROMAN[lvl] : ''; o.desc = pc.desc(lvl);
  if (cur) { o.swap = true; o.note = 'Sustituye a ' + curName(cur) + (prog ? ' · ' + prog : ''); }
  o.apply = () => { S.build[pc.slot] = { id: pc.id, lvl }; };
  return o;
}
// Técnicas sueltas. Son complementos: no salen hasta que tengas técnica en las cuatro acciones (disparo, cargado, esquive y pasiva),
// que son las que marcan el camino de la build. Las ofrendas (SOLO) salen aunque no lleves nada de su deidad; las demás, solo si ya
// llevas alguna técnica suya en tus ranuras. Y todas, solo si lo que necesitan (tabla de 13_needs.js) lo pone algo de lo que llevas o ellas mismas.
const slotsFull = () => SLOT_KEYS.every(k => S.build[k]);
const SOLO = ['d_warm', 'm_skin', 'v_slow', 'f_appet', 'o_scars', 't_second', 's_last', 'r_spark', 'w_brine', 'l_coin', 'b_thorn', 'i_rime', 'h_warm', 'e_ink', 'u_glint', 'z_yawn', 'o_tug', 'q_shard', 'a_pup', 'g_whet', 'd_blood', 'v_vapors', 'f_carve'];
const techOk = t => slotsFull() && !S.techs.has(t.id) && (godCount(t.god) >= 1 || SOLO.includes(t.id)) && looseOk(t);
// El «Necesita: …» del Recetario sale de la misma tabla
const techNeeds = t => { const w = needsText(t.id), th0 = GODS[t.god].theme;
  const full = ' Como todas las técnicas sueltas, no sale hasta que tengas técnica en las cuatro acciones';
  if (SOLO.includes(t.id)) return (w || 'nada, sirve sola') + '.' + full;
  return (w ? w + '; y llevar ya alguna técnica de ' + th0 + ' en tus ranuras' : 'nada, sirve sola; pero solo sale si ya llevas alguna técnica de ' + th0 + ' en tus ranuras') + '.' + full; };
// Texto completo de un dúo: lo que hace cada una de sus dos técnicas y, después, lo que añade el dúo
const duoIsOpen = D => godIsOpen(PIECE[D.a].god) && godIsOpen(PIECE[D.b].god);
const duoText = (D, l) => `${PIECE[D.a].name}: ${PIECE[D.a].desc(l)} ${PIECE[D.b].name}: ${PIECE[D.b].desc(l)} Dúo: ${D.desc}`;
// Todo lo que esta deidad podría ofrecerte ahora, con su peso en el sorteo
function pieceCands(god) {
  const cands = [];
  for (const pc of PIECES.filter(x => x.god === god)) { const c = pieceCard(pc); if (c) cands.push([c.rar === 3 ? 1.6 : 1, c]); }
  for (const t of TECHS.filter(x => x.god === god && techOk(x)))
    cands.push([[0, 0.9, 0.6, 0.4][t.rar], { tag: 'Técnica', rar: t.rar, pic: t.id, name: t.name, color: GODS[god].color, desc: t.desc, note: 'No ocupa ranura', god, apply: () => { S.techs.add(t.id); } }]);
  return cands;
}
function pieceOptions(god) {
  const cands = pieceCands(god);
  // Si al filtrar queda poco, sale lo que haya (y siempre puedes vender la reliquia).
  // Sorteo ponderado: lo raro sale menos y un dúo disponible sale más.
  // Lo que sustituiría a una técnica que ya llevas va al final: solo aparece si no hay otra cosa que ofrecer, y como mucho una.
  const order = cands.map(([w, c]) => [Math.pow(Math.random(), 1 / w), c]).sort((x, y) => y[0] - x[0]).map(x => x[1]);
  const n = tk('eye4') ? 4 : 3, keep = order.filter(c => !c.swap).slice(0, n), swaps = order.filter(c => c.swap);
  if (keep.length < n && swaps.length) keep.push(swaps[0]);
  // Y siempre puedes no tocar nada: vendes la reliquia por oro y material
  const gold = 20 + 4 * S.lvl;
  keep.push({ tag: 'Vender', name: 'Vender la reliquia', color: C.dim, desc: `No tocas tu build. Te llevas ${gold} de oro y 1 de ${GODS[god].mat} más.`, note: '', apply: () => { addGold(gold); S.matsRun[god] += 1; } });
  return keep;
}

// ───────────────────────── Tienda (antes de cada jefe) ─────────────────────────
function openShop() {
  if (!S.shop || S.shop.wave !== S.wave) {
    const k = 1 + 0.25 * (S.world - 1), pr = n => Math.round(n * k / 5) * 5;
    const god = randGod();
    const plan = PLANS.filter(x => !S.plans.has(x.id) && (!x.only || G(x.only))).sort(() => Math.random() - 0.5)[0];
    S.shop = { wave: S.wave, tip: tipTake('shop'), items: [
      { id: 'heal',  name: 'Guiso caliente',         desc: 'Recuperas el 35% de tu vida', price: pr(40) },
      { id: 'tech',  name: 'Reliquia de contrabando', desc: `${GODS[god].weapon}, reliquia de ${GODS[god].title}: la quiebras y eliges una técnica`, price: pr(90), god },
      { id: 'up',    name: 'Afilar una técnica',     desc: 'Sube un nivel una de las técnicas que llevas, al azar', price: pr(70) },
      { id: 'anvil', name: 'Rato de yunque',         desc: 'Eliges un ajuste de los guanteletes: cadencia, daño, alcance o velocidad', price: pr(60) },
      { id: 'heart', name: 'Corazón en conserva',    desc: '+15% de vida máxima', price: pr(70) },
      { id: 'part',  name: 'Pieza de armero',        desc: 'Una pieza para tus guanteletes: eliges entre tres', price: pr(100) },
    ].concat(plan ? [{ id: 'plan', name: 'Plano: ' + plan.name, desc: plan.desc, price: pr(110), plan: plan.id }] : []) };
  }
  listSel = -1; setMode('shop'); ov.scrollTop = 0;
}
// El buhonero: va de campamento en campamento detrás de los que pelean. Habla al abrir la tienda y al venderte algo
const SHOP_LINES = { open: ['Mira sin prisa. Lo que no compres hoy, mañana lo llevará otro.', 'Todo de primera. Casi todo. Lo que no, a mitad de precio… si regateas bien.', 'El guiso es de hoy. Lo demás, mejor no preguntes de qué día es.'],
  buy: { heal: 'Cómetelo caliente. Frío no hay quien se lo coma.', tech: 'Esa reliquia la saqué de un altar. El dios no la echará de menos.', up: 'Listo. Ahora corta el doble. O eso dice el que me lo vendió.', anvil: 'Siéntate en el yunque. No, en ese no, en el otro.', heart: 'No preguntes de quién era. Funciona, que es lo que importa.', part: 'Pieza de armero de verdad. Bueno, de un armero muerto, pero de verdad.', plan: 'Ese plano vale más que todo lo demás junto. Tú sabrás.' },
  poor: 'Con ese oro, ni el guiso. Vuelve cuando hayas matado a unos cuantos más.' };
function keeperHtml() {
  const m = ATLAS.merchant || ATLAS.keeper; if (!m) return ''; const f = m.a.idle.f[0];
  const line = S.shop.say || SHOP_LINES.open[S.wave % SHOP_LINES.open.length];
  return `<div class="keeper"><i style="width:${m.w}px;height:${m.h}px;background-position:-${f[0]}px -${f[1]}px"></i><span><b style="color:#d9b26a">${S.keep ? 'La tendera de la aldea' : 'El buhonero'}:</b> «${line}»</span></div>`;
}
function shopHtml() {
  const p = S.p, ms = S.mission, toBoss = hasBoss(ms) && S.room + 1 >= roomsOf(ms), boss = toBoss ? (ms.type === 'god' ? TYPES[KINGDOMS.find(x => x.id === ms.k).god].name : TYPES[zoneBoss(KINGDOMS.find(x => x.id === ms.k), ms.z)].name) : '';
  const icoOf = it => ico({ heal: 'mug', tech: 'sword', up: 'scroll', anvil: 'axe', heart: 'potion', part: 'chest', plan: 'book' }[it.id] || 'gem', it.id === 'tech' ? 1 : 0);
  return `<p class="eyebrow">Tienda · ${S.mission.zone}</p><div class="fhead"><h1>${toBoss ? 'Antes de ' + boss : 'Un alto en el camino'}</h1><p class="purse"><b class="coin">${Math.floor(p.gold)}</b> de oro<span>·</span><b class="life">${Math.ceil(p.hp)}</b> / ${p.maxHp} de vida</p></div>${keeperHtml()}${tipBox(S.shop.tip)}
    <div class="shopwrap"><div><div class="stalls">` +
    S.shop.items.map((it, i) => `<button class="fi stall${it.sold ? ' on sold' : p.gold >= it.price ? '' : ' off'}" data-act="buy:${i}"><em class="tile">${icoOf(it)}</em><b>${it.name}</b><span>${it.desc}</span>${gloss(it.desc, 3)}<i>${it.sold ? 'Vendido' : `<u class="coin">${it.price}</u>`}</i></button>`).join('') +
    `</div><p class="fine">El oro solo sirve en este encargo: lo que no gastes aquí se pierde al terminar.</p><button class="fi primary" data-act="boss">${S.calm ? 'Volver' : toBoss ? 'Cruzar la puerta de ' + boss : 'Seguir adelante'}</button></div>
    <aside class="carry"><h2>Lo que llevas</h2><ul class="build full">${buildHtml(true)}</ul></aside></div>`;
}
function shopAct(act) {
  const [k, i] = act.split(':'), p = S.p;
  if (k === 'boss' && S.calm) { S.shop.say = null; resumePlay(); return; }   // la tienda de la calma (44_calm.js): se vuelve a la sala
  if (k === 'boss') {   // salir de la tienda: al jefe, a la siguiente oleada o campamento, o a elegir puerta
    const ms = S.mission, direct = ms.type === 'defend' || ms.type === 'assault' || (hasBoss(ms) && S.room + 1 >= roomsOf(ms));
    if (direct) { S.mode = 'play'; modeT = 0; nextWave(); renderOverlay(); } else { pickQueue = [doorScreen]; advancePick(); }
    return;
  }
  const it = S.shop.items[+i];
  if (it.sold || p.gold < it.price) { sfx('no', 0.4); if (!it.sold) { S.shop.say = SHOP_LINES.poor; renderOverlay(); } return; }
  S.shop.say = SHOP_LINES.buy[it.id] || null;
  if (it.id === 'up') { const own = SLOT_KEYS.map(s => S.build[s]).filter(c => c && c.lvl < 5); if (!own.length) { sfx('no', 0.4); return; } const c = own[Math.floor(Math.random() * own.length)]; c.lvl += 1; sayRaw('[' + curName(c) + ' sube a nivel ' + ROMAN[c.lvl] + ']', C.ink); }
  p.gold -= it.price; it.sold = true; sfx('ok', 0.45);
  if (it.id === 'heal') p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
  else if (it.id === 'heart') { const up = Math.round(p.maxHp * 0.15); p.maxHp += up; p.hp += up; }
  else if (it.id === 'plan') { S.plans.add(it.plan); p.dodgeN = dodgeMax(); }
  else if (it.id === 'tech') { S.rerolls = 0; pickQueue = [pieceScreen(it.god, 'Tienda · ' + GODS[it.god].title)]; afterPicks = openShop; advancePick(); return; }
  else if (it.id === 'anvil') { pickQueue = [statScreen]; afterPicks = openShop; advancePick(); return; }
  else if (it.id === 'part') { pickQueue = [partScreen('Tienda · pieza de armero')]; afterPicks = openShop; advancePick(); return; }
  renderOverlay();
}

// ───────────────────────── La forja (entre vidas) ─────────────────────────
const openForge = () => openTown();   // entre encargos se vuelve a la plaza; cada sitio de la plaza abre su menú (openPlace)
// La forja va por pestañas para no ser una lista sin fin: el mapa del contrato, los guanteletes (un apartado cada vez), las sinergias y el árbol.
let forgeTab = 'map', forgeSlot = 'barrel';
const FORGE_TABS = [['map', 'Contrato'], ['gun', 'Guanteletes'], ['syn', 'Sinergias'], ['tree', 'Árbol'], ['room', 'Habitación'], ['king', 'Audiencia']];
const placeTabs = () => FORGE_TABS.filter(t => PLACES[forgePlace].tabs.includes(t[0]));
function forgeHtml() {
  const matChips = GOD_KEYS.filter(g => M.mats[g] > 0).map(g => `<span style="color:${GODS[g].color}">${M.mats[g]} ${GODS[g].mat}</span>`).join(' · ');
  const head = `<p class="eyebrow">${PLACES[forgePlace].name} · ${M.runs} ${M.runs === 1 ? 'encargo' : 'encargos'} a la espalda</p>
    <div class="fhead"><h1>${gunName(M.gun)}</h1><p class="lead"><b>${M.souls}</b> almas · <b>${M.iron}</b> Hierro Místico${matChips ? ' · ' + matChips : ''}</p></div>
    <div class="tabs">${placeTabs().map(([id, nm]) => `<button class="fi tab${forgeTab === id ? ' on' : ''}" data-act="tab:${id}"><b>${nm}</b></button>`).join('')}<button class="fi tab" data-act="back"><b>Volver a la plaza</b></button></div>`;
  let body = '';
  if (forgeTab === 'map') {
    const go = M.run ? `<button class="fi primary" data-act="resume">Continuar: ${M.run.mission.name}, tramo ${M.run.wave + 1}</button>` : '';
    body = `${go}<div class="kingdom">${mapHtml()}</div><p class="fine">Las técnicas de los dioses solo duran un encargo. Lo que ganas se queda: almas para el patio de armas, y Hierro Místico y materiales para la forja. Si caes, conservas lo ganado y puedes repetir.</p>`;
  } else if (forgeTab === 'gun') {
    const k = forgeSlot, all = PARTS.filter(x => x.slot === k), known = all.filter(x => M.parts[x.id]);
    const rank = x => (M.gun[k] === x.id ? 0 : M.parts[x.id] === 2 ? 1 : canPay(x.cost) ? 2 : 3);
    known.sort((a, b) => rank(a) - rank(b));
    const on = ensOf(M.gun), L = legOf(M.gun);
    body = `<p class="fine">Tus guanteletes tienen cinco partes. Elige una y abajo verás sus piezas. Las que encuentres en los encargos aparecen aquí: fórjalas una vez y podrás montarlas siempre.${L ? ` <b class="gold">Guanteletes legendarios: ${L.name}.</b>` : ''}${on.length ? ` <b class="gold">Ensambles activos: ${on.map(E => E.name).join(', ')}.</b>` : ''}</p>
      <div class="gunwrap"><div class="slots">${GSLOT_KEYS.map(sk => { const n = PARTS.filter(x => x.slot === sk), kn = n.filter(x => M.parts[x.id]).length;
        return `<button class="fi slot row${sk === k ? ' on' : ''}" data-act="slot:${sk}">${pic(M.gun[sk], 't')}<b>${GSLOTS[sk]}</b><span>${PART[M.gun[sk]].name}</span><i>${kn}/${n.length}</i></button>`; }).join('')}</div>
      <div class="gcol"><h3>${GSLOTS[k]} · ${GSLOT_WHAT[k]}</h3><div class="plist">` +
      known.map(x => { const mounted = M.gun[k] === x.id, forged = M.parts[x.id] === 2;
        return `<button class="fi row${mounted ? ' on' : forged || canPay(x.cost) ? '' : ' off'}" data-act="p:${x.id}">${pic(x.id, 't')}<b>${x.name}${x.base ? '' : ` <u>${x.tag}</u>`}</b><span>${x.desc}</span>${gloss(x.desc, 4)}${affHint(x.id)}${legHint(x.id)}<i class="st ${mounted ? 'ok' : forged ? 'go' : 'buy'}">${mounted ? 'Montada' : forged ? 'Montar' : 'Forjar<br>' + costTxt(x.cost)}</i></button>`; }).join('') +
      `</div>` + (all.length > known.length ? `<p class="fine">${all.length - known.length === 1 ? 'Queda 1 pieza' : 'Quedan ' + (all.length - known.length) + ' piezas'} de este apartado por descubrir.</p>` : '') + '</div></div>';
  } else if (forgeTab === 'syn') {
    const affs = {}; for (const sk of GSLOT_KEYS) { const g = affGod(M.gun[sk]); if (g) affs[g] = (affs[g] || 0) + 1; }
    const affTxt = Object.keys(affs).length ? Object.keys(affs).map(g => `<li class="own"><em style="color:${GODS[g].color}">${GODS[g].theme} ×${affs[g]}</em><span>Si llevas una técnica suya: ${AFFIN[g]}${affs[g] > 1 ? ', por cada pieza' : ''}.</span></li>`).join('') : '<li><span>Tus guanteletes no llevan ninguna pieza afín a una deidad.</span></li>';
    const reso = RESO.map(R => { if (!resoIsOpen(R)) return `<li><em>Resonancia</em><b>???</b><span>${R.parts.map(id => (M.parts[id] ? PART[id].name : '???')).join(' + ')} con una técnica de una deidad que aún no se ha fijado en ti</span></li>`;
      const known = R.parts.every(id => M.parts[id]), mounted = R.parts.every(id => M.gun[PART[id].slot] === id);
      return `<li class="${mounted ? 'own' : ''}"><em>${mounted ? 'Montada' : 'Resonancia'}</em><b>${known ? R.name : '???'}</b><span>${R.parts.map(id => (M.parts[id] ? PART[id].name : '???')).join(' + ')} con ${R.techs.map(id => PIECE[id].name + ' (' + GODS[PIECE[id].god].theme + ')').join(' y ')}${known ? '. ' + R.desc : ''}</span></li>`; }).join('');
    body = `<p class="fine">Combinaciones que dan efectos extra. Lo que aún no has descubierto sale como «???».</p>
      <div class="forge"><section><h3>Afinidades de tus guanteletes · pieza con deidad</h3><ul class="build full legends">${affTxt}</ul>${ensHtml(M.gun)}</section>
      <section>${legendsHtml(M.gun)}<h3>Resonancias · una pieza con una técnica concreta</h3><ul class="build full legends">${reso}</ul></section></div>`;
  } else {
    const spentOf = ns => ns.reduce((a, n) => a + n.cost.slice(0, tr(n.id)).reduce((x, y) => x + y, 0), 0);
    const spent = spentOf(TREE_NODES), hrs = M.time / 3600, done1 = spent >= TREE_TOTAL;
    const hm = h => (h >= 1 ? Math.floor(h) + ' h ' : '') + Math.round((h % 1) * 60) + ' min';
    const pace = `Árbol de Valdehierro: ${spent} de ${TREE_TOTAL} almas invertidas (${Math.round(spent / TREE_TOTAL * 100)}%)${done1 ? ', completo' : ''}. Tiempo jugado: ${hm(hrs)}. Este árbol tiene tope.`;
    const sec = (T, lock) => T.map(br => `<section><h3>${br.name} · ${br.sub}</h3>` + br.nodes.map(n => { const r = tr(n.id), full = r >= n.max, cost = n.cost[r], base = n.ext ? TREE_NODES.find(x => x.id === n.ext).max : 0;
      return `<button class="fi${full ? ' on' : !lock && M.souls >= cost ? '' : ' off'}" data-act="t:${n.id}"><b>${n.name} ${r}/${n.max}</b><span>${r || base ? 'Ahora: ' + n.desc(r) + '. ' : ''}${full ? '' : 'Siguiente: ' + n.desc(r + 1)}</span><i>${full ? 'Al máximo' : cost + ' almas'}</i></button>`; }).join('') + '</section>').join('');
    const open2 = tree2Open();
    body = `<p class="fine">${pace}</p><div class="forge">` + sec(TREE, false) + '</div>' + (KINGDOMS.length < 2 ? '' :
      `<h2>El árbol del siguiente reino</h2><p class="fine">${open2 ? `Abierto: ${spentOf(TREE2_NODES)} de ${TREE2_TOTAL} almas invertidas. Sigue donde el primero se queda, y cada rango cuesta mucho más.` : 'Cerrado. Se abre cuando liberes Valdehierro matando a su dios. Sigue donde este árbol se queda, con más rangos de las mismas mejoras, y cada rango cuesta mucho más.'}</p><div class="forge${open2 ? '' : ' locked'}">` + sec(TREE2, !open2) + '</div>');
  }
  if (forgeTab === 'room') body = roomHtml(); else if (forgeTab === 'king') body = kingHtml();
  return head + body + `<p class="fine keyhint">Muévete con el stick izquierdo o la cruceta. El stick derecho desplaza la pantalla. LB y RB (o Q y R) pasan a la pestaña de la izquierda o de la derecha. B (o Shift) vuelve a la plaza.</p>`;
}
function forgeAct(act) {
  const [k, id, n] = act.split(':');
  let ok = true;
  if (k === 'back') { closePlace(); return; }
  if (k === 'tab') { forgeTab = id; listSel = placeTabs().findIndex(t => t[0] === id); sfx('tick', 0.25); renderOverlay(); ov.scrollTop = 0; return; }
  if (k === 'slot') { forgeSlot = id; sfx('tick', 0.25); renderOverlay(); return; }
  if (k === 'm') { startRun(missionOf(act.slice(2))); return; }
  if (k === 'x') { sfx('no', 0.35); return; }
  if (k === 'resume') { resumeRun(); return; }
  if (k === 'intro') { playIntro(); return; }   // desde la habitación de la posada: volver a ver la cinemática del principio
  if (k === 'p') { const x = PART[id]; if (M.parts[id] === 2) M.gun[x.slot] = id; else if (M.parts[id] === 1 && canPay(x.cost)) { pay(x.cost); M.parts[id] = 2; M.gun[x.slot] = id; } else ok = false; }
  else if (k === 't') { const nd = TREE_ALL.find(x => x.id === id), r = tr(id); if (r < nd.max && M.souls >= nd.cost[r] && (!nd.ext || tree2Open())) { M.souls -= nd.cost[r]; M.tree[id] = r + 1; } else ok = false; }
  sfx(ok ? 'ok' : 'no', 0.45);
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
  if (S.mode === 'forge' && I.backP && modeT > 0.3) { closePlace(); return; }
  if (S.mode === 'forge' && (I.tabL || I.tabR)) {   // LB va a la izquierda y RB a la derecha: por las pestañas y, en los guanteletes, por sus cinco partes
    const seq = []; for (const [id] of placeTabs()) { if (id === 'gun') for (const k of GSLOT_KEYS) seq.push(['gun', k]); else seq.push([id, null]); }
    if (seq.length < 2) return;
    const i = seq.findIndex(([t, k]) => t === forgeTab && (t !== 'gun' || k === forgeSlot)), n = seq[(i + (I.tabR ? 1 : seq.length - 1)) % seq.length];
    if (n[0] !== forgeTab) forgeAct('tab:' + n[0]); if (n[1] && n[1] !== forgeSlot) forgeAct('slot:' + n[1]);
    return;
  }
  const els = [...ovBody.querySelectorAll('.fi')];
  if (I.navX || I.navY) {
    const n = navPick(els, listSel, I.navX, I.navY);
    if (n !== listSel && n >= 0) { listSel = n; els.forEach((el, i) => el.classList.toggle('sel', i === listSel)); els[listSel].scrollIntoView({ block: 'nearest' }); sfx('tick', 0.25); }
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
  const row = (label, color, name, sub, icon) => rows.push(`<li>${full && icon ? icon : ''}<em style="color:${color}">${label}</em><b>${name}</b>${sub ? `<span>${sub}</span>${full ? gloss(sub, 4) : ''}` : ''}</li>`);
  for (const k of SLOT_KEYS) {
    const cur = S.build[k];
    if (!cur) { if (full) rows.push(`<li><em>${SLOTS[k]}</em><span>Ranura libre</span></li>`); continue; }
    const D = DUO[cur.id];
    if (D) row(SLOTS[k], RAR[3].color, D.name + ' ' + ROMAN[cur.lvl], full ? duoText(D, cur.lvl) : '', pic(D.a, 't'));
    else row(SLOTS[k], GODS[PIECE[cur.id].god].color, PIECE[cur.id].name + ' ' + ROMAN[cur.lvl], full ? PIECE[cur.id].desc(cur.lvl) : '', pic(cur.id, 't'));
  }
  for (const g of GOD_KEYS) if (mastery(g)) row('Maestría', GODS[g].color, MASTERY[g].name, full ? MASTERY[g].desc : '');
  for (const R of RESO) if (res(R.id)) row('Resonancia', RAR[3].color, R.name, full ? R.desc : '');
  for (const E of ensOf(S.gun)) row('Ensamble', C.energy, E.name, full ? E.desc : '');
  for (const g of GOD_KEYS) { const a = aff(g); if (a) row('Afinidad', GODS[g].color, GODS[g].theme + ' ×' + a, full ? AFFIN[g] + (a > 1 ? ', por cada una de tus ' + a + ' piezas afines' : '') + '.' : ''); }
  if (full) for (const k of GSLOT_KEYS) { const x = PART[S.gun[k]]; row(GSLOTS[k], C.energy, x.name, x.desc, pic(x.id, 't')); }
  const techs = TECHS.filter(t => S.techs.has(t.id)), plans = PLANS.filter(x => S.plans.has(x.id));
  if (full) { for (const t of techs) row('Técnica', RAR[t.rar].color, t.name, t.desc, pic(t.id, 't')); for (const x of plans) row('Plano', C.ink, x.name, x.desc); }
  else { if (techs.length) row('Técnicas', C.dim, techs.map(t => t.name).join(', ')); if (plans.length) row('Planos', C.dim, plans.map(x => x.name).join(', ')); }
  return rows.join('');
}
const resoIsOpen = R => R.techs.every(id => godIsOpen(PIECE[id].god));
// Palabras del glosario que son de una deidad: no salen mientras esté cerrada, salvo que las nombre una pieza que ya has descubierto
const GLOSS_GOD = { Ascuas: 'dragon', Veneno: 'venom', Cristales: 'stone', Reserva: 'feast', Furia: 'orc', Eco: 'time', Sombras: 'shade', Agujas: 'storm', Empapado: 'tide', Semillas: 'wood', Enraizado: 'wood', Zarzal: 'wood', Escarcha: 'frost', Heridas: 'blood', Sentencia: 'end', Iluminado: 'light', Dormido: 'dream', Pozo: 'void', Reflejo: 'mirror', Manada: 'beast', Caza: 'beast', Temple: 'forge', 'Golpe contra el muro': 'tide' };
const glossShut = ([re, name]) => !!GLOSS_GOD[name] && !godIsOpen(GLOSS_GOD[name]) && !PARTS.some(x => M.parts[x.id] && re.test(x.desc));
// El recetario va por páginas: una por deidad y unas pocas más. LB y RB (o Q y R) pasan de página; también se puede tocar la pestaña.
let bookPage = 0;
// Las deidades van en el orden en que se fijan en ti; las que aún no lo han hecho salen como «???», sin enseñar nada suyo.
const BOOK_SHUT = '#6b5a4e';
const bookPages = () => [['llevo', 'Lo que llevas', C.energy]].concat(GOD_UNLOCK.filter(godIsOpen).map(g => [g, GODS[g].theme, GODS[g].color]), GOD_UNLOCK.filter(g => !godIsOpen(g)).slice(0, 1).map(g => [g, '??? · quedan ' + GOD_UNLOCK.filter(x => !godIsOpen(x)).length, BOOK_SHUT]),   // las que aún no se han fijado en ti, en una sola pestaña
  [['duos', 'Dúos', RAR[3].color], ['reso', 'Resonancias', RAR[3].color], ['piezas', 'Piezas', C.energy], ['glos', 'Glosario', C.ink]]);
function bookHtml() {
  const P = bookPages(); bookPage = ((bookPage % P.length) + P.length) % P.length;
  const [id, , col] = P[bookPage];
  const card = (own, tag, tagCol, icon, name, desc) => `<li class="bk${own ? ' own' : ''}">${icon || '<span class="pic t none"></span>'}<em${tagCol ? ` style="color:${tagCol}"` : ''}>${tag}</em><b>${name}</b><span>${desc}</span></li>`;
  let body = '';
  if (id === 'llevo') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Lo que llevas en este encargo</h2><p>Solo cabe una técnica por acción: disparo, cargado, esquive y pasiva. Si dos deidades te dan técnicas para la misma acción, pueden ofrecerte un dúo que mezcla las dos.</p></div><ul class="build full carrylist">${buildHtml(true) || '<li><span>Todavía no llevas nada.</span></li>'}</ul>`;
  } else if (GODS[id] && !godIsOpen(id)) {
    const n = godsOpenN(), all = GOD_UNLOCK.length;
    body = `<div class="bkhead" style="--c:${col}"><h2>???</h2><p><b>Esta deidad aún no se ha fijado en ti: cumple otro encargo.</b> Cada encargo del tablón que cumples por primera vez, guardianes incluidos, atrae a una deidad nueva. Hasta entonces no verás a sus elegidos ni sus reliquias.</p><p>Te conocen ${n} de ${all} deidades${n < all ? '; ' + (all - n === 1 ? 'falta 1 encargo' : 'faltan ' + (all - n) + ' encargos') + ' para que te conozcan todas' : ''}.</p></div>`;
  } else if (GODS[id]) {
    const G = GODS[id], n = godCount(id);
    body = `<div class="bkhead" style="--c:${col}"><h2>${G.title}</h2><p><b>${G.theme}.</b> ${G.key}</p><p class="mast"><u>${'<i class="on"></i>'.repeat(Math.min(n, 3))}${'<i></i>'.repeat(Math.max(0, 3 - n))}</u> Maestría ${Math.min(n, 3)}/3 · <b>${MASTERY[id].name}:</b> ${MASTERY[id].desc}</p></div><ul class="bklist">` +
      PIECES.filter(x => x.god === id).map(pc => { const l = lv(pc.id); return card(l, SLOTS[pc.slot], col, pic(pc.id, 't'), pc.name + (l ? ' ' + ROMAN[l] : ''), pc.desc(Math.max(1, l))); }).join('') +
      TECHS.filter(t => t.god === id).map(t => card(S.techs.has(t.id), 'Técnica · ' + RAR[t.rar].name, RAR[t.rar].color, pic(t.id, 't'), t.name, `${t.desc} Necesita: ${techNeeds(t)}.`)).join('') + '</ul>';
  } else if (id === 'duos') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Dúos</h2><p>Dos técnicas de deidades distintas para la misma acción se funden en una. Te lo ofrecen al quebrar una reliquia si ya llevas una de las dos.${DUOS.some(d => !duoIsOpen(d)) ? ' Aquí salen solo los de las deidades que ya se han fijado en ti: quedan ' + DUOS.filter(d => !duoIsOpen(d)).length + ' por conocer.' : ''}</p></div>` +
      SLOT_KEYS.map(k => `<h3>Dúos de ${SLOTS[k].toLowerCase()}</h3><ul class="bklist">` + DUOS.filter(d => d.slot === k && duoIsOpen(d)).map(d => card(duoOn(d.id), GODS[PIECE[d.a].god].theme + ' + ' + GODS[PIECE[d.b].god].theme, null, pic(d.a, 't'), d.name, `Necesita: ${PIECE[d.a].name} + ${PIECE[d.b].name}. ${d.desc}`)).join('') + '</ul>').join('');
  } else if (id === 'reso') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Resonancias</h2><p>Una pieza de los guanteletes más una técnica concreta dan un efecto extra. Se activan solas.</p></div><ul class="bklist">` +
      RESO.map(R => (resoIsOpen(R) ? card(res(R.id), R.parts.map(pid => GSLOTS[PART[pid].slot]).join(' + '), null, pic(R.parts[0], 't'), R.name, `${R.parts.map(pid => (M.parts[pid] ? PART[pid].name : 'una pieza sin descubrir')).join(' + ')} y ${R.techs.map(tid => PIECE[tid].name + ' (' + GODS[PIECE[tid].god].theme + ')').join(' + ')}. ${R.desc}`)
        : card(false, R.parts.map(pid => GSLOTS[PART[pid].slot]).join(' + '), null, '', '???', 'Pide una técnica de una deidad que aún no se ha fijado en ti.'))).join('') + '</ul>' +
      `<h3>Planos</h3><ul class="bklist">` + PLANS.map(x => card(S.plans.has(x.id), 'Plano', null, '', x.name, x.desc)).join('') + '</ul>';
  } else if (id === 'piezas') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Piezas de los guanteletes</h2><p>Las que has descubierto. Quedan ${PARTS.filter(x => !M.parts[x.id]).length} por descubrir.</p></div>` +
      GSLOT_KEYS.map(sk => { const L = PARTS.filter(x => x.slot === sk && M.parts[x.id]); return L.length ? `<h3>${GSLOTS[sk]} · ${GSLOT_WHAT[sk]}</h3><ul class="bklist">` + L.map(x => card(G(x.id), x.tag, null, pic(x.id, 't'), x.name, x.desc)).join('') + '</ul>' : ''; }).join('');
  } else {
    body = `<div class="bkhead" style="--c:${col}"><h2>Glosario</h2><p>Las palabras en mayúscula de las técnicas y piezas (Ascuas, Sentencia, Eco…), explicadas.${GLOSS.some(glossShut) ? ' Faltan ' + GLOSS.filter(glossShut).length + ' palabras de deidades que aún no se han fijado en ti.' : ''}</p></div><ul class="bklist gl">` + GLOSS.filter(x => !glossShut(x)).map(([, n, w]) => `<li class="bk own"><b>${n}</b><span>${w.charAt(0).toUpperCase() + w.slice(1)}</span></li>`).join('') + '</ul>';
  }
  return `<p class="eyebrow">Recetario del herrero · página ${bookPage + 1} de ${P.length}</p><h1>Lo que se les puede robar</h1>
    <div class="bktabs">${P.map(([pid, nm, c], i) => `<button class="bkt${i === bookPage ? ' on' : ''}" data-bk="${i}" style="--c:${c}">${nm}</button>`).join('')}</div>
    <div class="bkpage">${body}</div><p class="fine keyhint">LB y RB (o Q y R) pasan de página. El stick mueve la página. Cualquier otro botón vuelve.</p><button id="ovBtn" class="primary">Volver</button>`;
}
function bookTurn(d) { bookPage += d; renderOverlay(); ov.scrollTop = 0; sfx('tick', 0.25); }
function openBook() { bookFrom = S.mode; if (S.god && S.mode === 'pick') bookPage = Math.max(0, bookPages().findIndex(x => x[0] === S.god)); S.mode = 'book'; modeT = 0; renderOverlay(); ov.scrollTop = 0; }
function closeBook() { S.mode = bookFrom; modeT = 0; renderOverlay(); }


// Guanteletes legendarios en la forja: qué piezas piden (las que no has descubierto salen como ???) y cuáles llevas montados
function legendsHtml(g) {
  const cur = legOf(g);
  return `<h3>Guanteletes legendarios · tres piezas concretas a la vez</h3><ul class="build full legends">` + LEGENDS.map(L => {
    const known = (M.legends || {})[L.id] || L.parts.every(id => M.parts[id]);
    return `<li class="${cur === L ? 'own' : ''}"><em>${cur === L ? 'Montados' : 'Legendarios'}</em><b>${known ? L.name : '???'}</b><span>${L.parts.map(id => (M.parts[id] ? (g[PART[id].slot] === id ? '✔ ' : '') + PART[id].name : '???')).join(' + ')}${known ? '. ' + L.desc + ' <i>' + L.lore + '</i>' : ''}</span></li>`; }).join('') + '</ul>';
}
// En cada pieza de la forja: si forma parte de unos guanteletes legendarios cuyas piezas ya conoces, lo dice
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
// ───────────────────────── Salas: muros, formas y caminos ─────────────────────────
// Cada sala es una rejilla de casillas de CELL unidades. Un generador decide qué casillas son muro;
// después se comprueba que todo el suelo sea alcanzable y se funden las casillas de muro en rectángulos.
// Los enemigos que no ven al jugador siguen un campo de distancias calculado desde su casilla.
const CELL = 16;
const CAMP_GAP = 24, CAMP_START = 20;
const ROOM_SIZES = { small: [40, 26], mid: [46, 30], big: [52, 34], boss: [50, 34], huge: [66, 44], vast: [92, 62], plaza: [104, 76], hall: [24, 22], shop: [22, 16] };
const NAV = { cols: 0, rows: 0, wall: new Uint8Array(0), dist: new Int16Array(0), t: 0, pc: -1 };

// Generadores: reciben una rejilla vacía (g[y][x] = 0) y devuelven la casilla donde empieza el jugador.
const fillRect = (g, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && i >= 0 && i < g[j].length) g[j][i] = 1; };
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
// Exteriores: en la rejilla, 1 es un obstáculo (roca, árbol, casa: para el paso y los disparos) y 2 es agua (para el paso, no los disparos).
// El generador deja en OUT qué es cada obstáculo, para dibujarlo con el paquete de biomas.
let OUT = null;
const ob = (g, x, y, w, h, kind, extra) => { fillRect(g, x, y, w, h); OUT.obs.push(Object.assign({ x, y, w, h, kind }, extra)); };
const outBorder = (g, c, r) => { fillRect(g, 0, 0, c, 2); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r); };
const pond = (g, cx, cy, rx, ry) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && g[y][x] === 0) g[y][x] = 2; };
const areaFree = (g, x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (!g[j] || g[j][i] !== 0) return false; return true; };
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
  // ── Formas de sala: círculo, L, cuadrada, octógono, rombo, U y anillo (las paredes son las casillas que quedan fuera de la forma) ──
  // Círculo (o elipse): a veces con un pilar en medio
  circulo(g, c, r) {
    const cx = (c - 1) / 2, cy = (r - 1) / 2, rx = c / 2 - 2, ry = r / 2 - 2;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) g[y][x] = 1;
    if (Math.random() < 0.5) fillRect(g, (c >> 1) - 1, (r >> 1) - 1, 3, 3);
    return [c >> 1, r - 5];
  },
  // En L: una esquina entera tapiada
  ele(g, c, r) {
    const w = Math.floor(c * ri(42, 55) / 100), h = Math.floor(r * ri(42, 55) / 100), corner = ri(0, 3);
    fillRect(g, corner % 2 ? c - w : 0, corner < 2 ? 0 : r - h, w, h);
    return corner < 2 ? [corner % 2 ? Math.floor(c * 0.25) : Math.floor(c * 0.75), r - 5] : [corner % 2 ? Math.floor(c * 0.25) : Math.floor(c * 0.75), 4];
  },
  // Cuadrada: un cuadrado en medio de la sala, con un pilar en cada esquina
  cuadrado(g, c, r) {
    const s = Math.min(c, r) - 4, x0 = (c - s) >> 1, y0 = (r - s) >> 1;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (x < x0 || x >= x0 + s || y < y0 || y >= y0 + s) g[y][x] = 1;
    for (const [px, py] of [[x0 + 4, y0 + 4], [x0 + s - 6, y0 + 4], [x0 + 4, y0 + s - 6], [x0 + s - 6, y0 + s - 6]]) fillRect(g, px, py, 2, 2);
    return [c >> 1, y0 + s - 4];
  },
  // Octógono: las cuatro esquinas cortadas en diagonal
  octogono(g, c, r) {
    const k = Math.floor(Math.min(c, r) * 0.32);
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { const dx = Math.min(x, c - 1 - x), dy = Math.min(y, r - 1 - y); if (dx + dy < k) g[y][x] = 1; }
    return [c >> 1, r - 5];
  },
  // Rombo: solo queda el rombo del centro, con un poco de margen en las puntas
  rombo(g, c, r) {
    const cx = (c - 1) / 2, cy = (r - 1) / 2, rx = c / 2 + 2, ry = r / 2 + 1;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (Math.abs(x - cx) / rx + Math.abs(y - cy) / ry > 0.98) g[y][x] = 1;
    return [c >> 1, r - 6];
  },
  // En U: un bloque que baja desde el muro de arriba y parte la sala en dos brazos
  ucodo(g, c, r) {
    const w = Math.floor(c * 0.3), h = Math.floor(r * 0.58);
    fillRect(g, (c - w) >> 1, 0, w, h);
    return [c >> 1, r - 4];
  },
  // Anillo: un patio redondo alrededor de un bloque redondo
  anillo(g, c, r) {
    const cx = (c - 1) / 2, cy = (r - 1) / 2, rx = c / 2 - 2, ry = r / 2 - 2;
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1 || d < 0.16) g[y][x] = 1; }
    return [c >> 1, r - 5];
  },
  // El campamento del buhonero: una sala pequeña y tranquila (la hoguera y el buhonero los pone 44_calm.js)
  campamento(g, c, r) {
    for (const [px, py] of [[4, 4], [c - 6, 4], [4, r - 6], [c - 6, r - 6]]) fillRect(g, px, py, 2, 2);
    return [c >> 1, r - 5];
  },
  // Aldea: cuatro casas de piedra alrededor de una plaza con la campana en medio
  aldea(g, c, r) {
    for (const [fx, fy] of [[0.2, 0.22], [0.8, 0.22], [0.2, 0.78], [0.8, 0.78]]) fillRect(g, Math.floor(c * fx) - 2, Math.floor(r * fy) - 1, 5, 3);
    fillRect(g, (c >> 1) - 9, (r >> 1) - 1, 2, 2); fillRect(g, (c >> 1) + 7, (r >> 1) - 1, 2, 2);
    return [c >> 1, (r >> 1) + 4];
  },
  // Exterior de Asalto: el paisaje de la zona (cementerio, bosque de setas, nieve o tierra quemada), con campamentos enemigos
  // ya montados (hoguera, sacos, toneles y bandera alrededor de cada estandarte), a veces una aldea abandonada, charcas y obstáculos
  pradera(g, c, r) {
    const tid = ZONE_THEME[clamp(((S && S.world) || 1) - 1, 0, 3)], T = THEMES[tid], R = a => a[ri(0, a.length - 1)];
    OUT = { biome: T.biome, theme: tid, obs: [], spots: [], npcs: [], paths: [], bridges: [], decor: [], fires: [], camps: [] };
    outBorder(g, c, r);
    const sx = c >> 1, sy = r - 6, keep = [[sx, sy, 5]], far = (x, y) => keep.every(([kx, ky, kr]) => Math.hypot(x - kx, y - ky) >= kr);
    // campamentos: separados de sobra para que, al atacar uno, no te vean desde el de al lado (CAMP_GAP casillas entre ellos)
    for (let i = 0, t = 0; i < 5 && t < 900; t++) {
      const x = ri(9, c - 10), y = ri(8, r - 9);
      if (Math.hypot(x - sx, y - sy) < CAMP_START || OUT.camps.some(k => Math.hypot(k.x - x, k.y - y) < CAMP_GAP) || !areaFree(g, x - 6, y - 5, 13, 11)) continue;
      OUT.camps.push({ x, y }); keep.push([x, y, 6.5]);
      ob(g, x + 3, y + 1, 2, 2, 'ref', { r: 'firering' }); OUT.fires.push({ x: x + 4, y: y + 2.5 });
      ob(g, x - 4, y - 3, 2, 1, 'ref', { r: 'skullflag' }); ob(g, x + 3, y - 3, 2, 1, 'ref', { r: i % 2 ? 'barrels' : 'shelf' }); ob(g, x - 4, y + 2, 1, 1, 'ref', { r: 'cask' });
      OUT.decor.push({ r: 'bedroll1', x: x - 2, y: y + 4.2, shadow: false }, { r: 'bedroll2', x: x - 0.4, y: y + 4.4, shadow: false }, { r: 'bags', x: x + 1.6, y: y - 2.4 }, { r: 'bedroll1', x: x + 1.4, y: y + 4.3, shadow: false });
      i++;
    }
    if (Math.random() < 0.8) for (let t = 0; t < 120; t++) {   // aldea abandonada: tres casas en ruinas, su pozo, vallas rotas y un espantapájaros
      const x = ri(5, c - 23), y = ri(9, r - 17);
      if (Math.hypot(x + 9 - sx, y + 6 - sy) < 13 || !areaFree(g, x - 2, y - 6, 22, 20) || OUT.camps.some(k => Math.abs(k.x - x - 9) < 17 && Math.abs(k.y - y - 5) < 14)) continue;
      ob(g, x, y, 8, 4, 'house', { v: ri(0, 2), big: true, ruin: true }); ob(g, x + 12, y + 1, 6, 4, 'house', { v: ri(0, 2), ruin: true }); ob(g, x + 4, y + 9, 6, 4, 'house', { v: ri(0, 2), ruin: true });
      ob(g, x + 13, y + 8, 2, 1, 'well'); ob(g, x + 16, y + 10, 2, 2, 'prop', { k: 'scarecrow' }); ob(g, x + 1, y + 11, 2, 1, 'prop', { k: 'hay' });
      for (const fx of [0, 1, 3]) ob(g, x + 9 + fx, y + 6, 1, 1, 'fence', { horiz: 1 });
      break;
    }
    if (tid !== 'ash') for (let i = 0, t = 0; i < (tid === 'mines' ? 3 : 2) && t < 80; t++) {   // charcas (hielo en la nieve)
      const rx = ri(3, 5), ry = ri(2, 3), cx = ri(7 + rx, c - 8 - rx), cy = ri(6 + ry, r - 7 - ry);
      if (!far(cx, cy) || !areaFree(g, cx - rx - 3, cy - ry - 3, 2 * rx + 7, 2 * ry + 7)) continue;
      pond(g, cx, cy, rx + 0.4, ry + 0.4); i++;
    }
    for (let i = 0, t = 0; i < Math.floor(c * r / 115) && t < 1200; t++) {   // obstáculos del tema: pocos y grandes
      const roll = Math.random(), big = roll > 0.5, small = roll < 0.08, w = big ? 3 : small ? 1 : 2, h = small ? 1 : 2, x = ri(5, c - 6 - w), y = ri(5, r - 6 - h);
      if (!far(x + w / 2, y + h / 2) || !areaFree(g, x - 3, y - 3, w + 6, h + 6)) continue;
      if (small) ob(g, x, y, 1, 1, 'ref', { r: R(T.small) }); else if (big) ob(g, x, y, 3, 2, 'ref', { r: R(T.big) }); else ob(g, x, y, 2, 2, Math.random() < 0.62 ? 'tree' : 'rock', { v: ri(0, 23) });
      i++;
    }
    return [sx, sy];
  },
  // Aldea al aire libre (Defensa): la campana en la plazuela, casas en las esquinas, calles empedradas en cruz y la vida de un pueblo:
  // puestos, pozo, bancos, heno, huerto vallado, toneles y los árboles y piedras de su zona. Las calles quedan libres para los asaltantes.
  aldea_ext(g, c, r) {
    const tid = ZONE_THEME[clamp(((S && S.world) || 1) - 1, 0, 3)], T = THEMES[tid], R = a => a[ri(0, a.length - 1)];
    OUT = { biome: T.biome, theme: tid, obs: [], spots: [], npcs: [], paths: [], bridges: [], paves: [], decor: [], fires: [] };
    outBorder(g, c, r);
    const cx = c >> 1, cy = r >> 1;
    [[0.2, 0.3], [0.8, 0.3], [0.2, 0.78], [0.8, 0.78]].forEach(([fx, fy], i) => ob(g, Math.floor(c * fx) - 3, Math.floor(r * fy) - 2, 6, 4, 'house', { v: i }));
    OUT.paves.push([cx - 1, 2, 2, r - 4], [2, cy - 1, c - 4, 2], [cx - 4, cy - 3, 8, 6]);
    const lane = (x, y, w, h) => x + w > cx - 3 && x < cx + 3 || y + h > cy - 3 && y < cy + 3 || (x + w > cx - 6 && x < cx + 6 && y + h > cy - 5 && y < cy + 5);   // calles y plazuela
    const put = (w, h, pad, fn) => { for (let t = 0; t < 80; t++) { const x = ri(4, c - 5 - w), y = ri(4, r - 5 - h); if (lane(x, y, w, h) || !areaFree(g, x - pad, y - pad, w + 2 * pad, h + 2 * pad)) continue; fn(x, y); return true; } return false; };
    put(3, 1, 2, (x, y) => ob(g, x, y, 3, 1, 'stall', { v: 0 })); put(3, 1, 2, (x, y) => ob(g, x, y, 3, 1, 'stall', { v: 2 }));
    put(2, 1, 2, (x, y) => ob(g, x, y, 2, 1, 'well')); put(3, 1, 2, (x, y) => ob(g, x, y, 3, 1, 'prop', { k: 'bench' }));
    put(6, 4, 2, (x, y) => {   // huerto vallado, con su espantapájaros y el heno
      for (let i = 0; i < 6; i++) { if (i !== 2 && i !== 3) ob(g, x + i, y, 1, 1, 'fence', { horiz: 1 }); ob(g, x + i, y + 3, 1, 1, 'fence', { horiz: 1 }); }
      ob(g, x + 2, y + 1, 2, 2, 'prop', { k: 'scarecrow' }); OUT.decor.push({ r: BIO.deco[9], x: x + 1, y: y + 2.6, shadow: false }, { r: BIO.deco[9], x: x + 5, y: y + 2.2, shadow: false });
    });
    for (let i = 0; i < 2; i++) put(2, 1, 2, (x, y) => ob(g, x, y, 2, 1, 'prop', { k: 'hay' }));
    for (let i = 0; i < 2; i++) put(1, 1, 2, (x, y) => ob(g, x, y, 1, 1, 'barrel', { v: i }));
    for (let i = 0; i < 4; i++) put(2, 2, 2, (x, y) => ob(g, x, y, 2, 2, 'tree', { v: ri(0, 23) }));
    for (let i = 0; i < 2; i++) put(3, 2, 2, (x, y) => ob(g, x, y, 3, 2, 'ref', { r: R(T.big) }));
    return [cx, cy + 4];
  },
  // La ciudad del reino: el castillo arriba y, debajo, la plaza mayor con el pozo, el tablón y el mercado. De la plaza salen la
  // avenida y las calles empedradas, y entre ellas, barrios de casas desperdigadas con sus huertos, árboles y vallas. Cada oficio
  // está en un barrio: la forja al oeste, la posada al nordeste y el patio de armas al suroeste (las flechas del borde de la
  // pantalla llevan hasta ellos). Abajo, el arroyo con sus puentes. El plano sale siempre igual en el mismo reino (semilla del
  // reino) y las casas siguen el estilo del reino (CITY_STYLE), para que cada ciudad se distinga por sus casas.
  plaza(g, c, r) {
    const kd = typeof kingdomNow === 'function' ? kingdomNow() : null, kid = kd ? kd.id : 'valdehierro';
    const rand0 = Math.random; Math.random = seeded(kid + ':ciudad');
    try { return cityGen(g, c, r, kid); } finally { Math.random = rand0; }
  },
  // El salón del trono: muros alrededor, alfombra hasta el trono, guardias a los lados y la puerta abajo
  hall(g, c, r) {
    OUT = { interior: 'throne', obs: [], spots: [], npcs: [], paths: [], bridges: [] };
    fillRect(g, 0, 0, c, 5); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r);
    const cx = c >> 1;
    for (let y = r - 2; y < r; y++) for (const x of [cx - 1, cx]) g[y][x] = 0;   // la puerta
    fillRect(g, cx - 1, 5, 2, 1);                                                 // el trono
    for (const x of [5, c - 7]) for (const y of [8, 13]) fillRect(g, x, y, 2, 2);  // columnas
    OUT.npcs.push({ key: 'king', x: cx, y: 6.15 }, { key: 'queen', x: cx + 1.6, y: 6.9, flip: true }, { key: 'guard_k', x: cx - 2.5, y: 7.6 }, { key: 'guard_k', x: cx + 2.5, y: 7.6, flip: true }, { key: 'guard', x: cx - 3, y: r - 3.2 }, { key: 'guard', x: cx + 3, y: r - 3.2, flip: true }, { key: 'priest', x: 3.6, y: 7 });
    OUT.spots.push({ x: cx * CELL, y: 7.4 * CELL, id: 'king', label: 'Hablar con el rey' }, { x: (cx + 2.4) * CELL, y: 7.9 * CELL, id: 'queen', label: 'Hablar con la reina' }, { x: cx * CELL, y: (r - 1.2) * CELL, id: 'exit', label: 'Salir a la plaza' });
    return [cx, r - 4];
  },
  // La forja y la posada por dentro: muros alrededor, la puerta abajo, muebles del paquete y quien atiende
  forgeroom(g, c, r) { return interiorRoom(g, c, r, 'forge'); },
  innroom(g, c, r) { return interiorRoom(g, c, r, 'inn'); },
  // Arena de jefe: abierta, con pilares cuadrados contra los que estrellarlo
  arena(g, c, r) {
    for (const [fx, fy] of [[0.22, 0.3], [0.78, 0.3], [0.22, 0.72], [0.78, 0.72], [0.5, 0.52]]) fillRect(g, Math.floor(c * fx) - 1, Math.floor(r * fy) - 1, 3, 3);
    return [c >> 1, r - 5];
  },
};
function interiorRoom(g, c, r, kind) {
  OUT = { interior: kind, obs: [], spots: [], npcs: [], paths: [], bridges: [], props: [] };
  fillRect(g, 0, 0, c, 4); fillRect(g, 0, r - 2, c, 2); fillRect(g, 0, 0, 2, r); fillRect(g, c - 2, 0, 2, r);
  const cx = c >> 1; for (let y = r - 2; y < r; y++) for (const x of [cx - 1, cx]) g[y][x] = 0;
  const put = (src, s, x, y, w, h) => { if (w) fillRect(g, Math.floor(x - w / 2), Math.floor(y - h), w, h); OUT.props.push({ src, s, x: x * CELL, y: y * CELL }); };
  if (kind === 'forge') {
    put('town', 'furnace', 5, 6, 2, 1); put('town', 'furnace', 8.5, 6, 2, 1); put('town', 'anvil', cx + 1, 9, 4, 1); put('town', 'workbench', c - 5.5, 6, 4, 1);
    put('castle', [336, 1, 32, 26], c - 4, 12, 2, 1); put('bio', 'barrel0', 3.6, 13, 1, 1); put('bio', 'barrel1', 4.6, 13.2, 1, 1);
    OUT.npcs.push({ key: 'smith', x: cx - 1.6, y: 9.4 });
    OUT.spots.push({ x: (cx + 1) * CELL, y: 10.4 * CELL, id: 'forge', label: 'Trabajar en el yunque' });
  } else {
    put('castle', [144, 203, 32, 57], cx, 4.6, 0, 0);
    for (const [x, y] of [[5.5, 8], [c - 5.5, 8], [5.5, 12], [c - 5.5, 12]]) { put('castle', [368, 10, 48, 36], x, y, 3, 1); put('castle', [304, 11, 32, 11], x, y + 1.1, 0, 0); }
    put('castle', [320, 44, 48, 20], cx, 7.4, 3, 1); put('bio', 'barrel0', c - 3.4, 6, 1, 1); put('bio', 'barrel2', c - 3.4, 7, 1, 1); put('castle', [336, 1, 32, 26], 3.6, 6, 2, 1);
    OUT.npcs.push({ key: 'keeper', x: cx, y: 6.6 }, { key: 'adv_dwarf', x: 4.4, y: 12.4 }, { key: 'adv_archer', x: c - 4.2, y: 9.4, flip: true }, { key: 'adv_knight', x: 8.5, y: 10 }, { key: 'cit_tavern_b', x: c - 8.5, y: 13.4, flip: true }, { key: 'cit_peasant', x: 4, y: 9.6 });
    OUT.spots.push({ x: cx * CELL, y: 8.6 * CELL, id: 'inn', label: 'Pedir la habitación' });
  }
  OUT.spots.push({ x: cx * CELL, y: (r - 1.2) * CELL, id: 'exit', label: 'Salir a la plaza' });
  return [cx, r - 4];
}
// Números al azar repetibles a partir de un texto (para que la ciudad de un reino sea siempre la misma)
function seeded(str) {
  let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  let a = h >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
// Estilo de las casas de cada reino: qué colores de tejado y qué paredes se ven en su ciudad (casas en src/49_cityhouses.js)
const CITY_STYLE = {
  valdehierro: { roofs: ['brown', 'red', 'ochre', 'slate'], walls: null },
  torrealba:   { roofs: ['slate', 'blue', 'teal', 'plum'], walls: ['plaster', 'brick', 'timber'] },   // un reino frío y viejo: tejados de pizarra y piedra
  default:     { roofs: null, walls: null },
};
function cityGen(g, c, r, kid) {
  OUT = { biome: 'grass', obs: [], spots: [], npcs: [], paths: [], bridges: [], paves: [], wander: [], decor: [] };
  outBorder(g, c, r);
  const cx = c >> 1, P = (x, y) => ({ x: x * CELL, y: y * CELL }), deco = (x, y, w, h, kind, extra) => ob(g, x, y, w, h, kind, extra);
  const occ = Array.from({ length: r }, () => new Uint8Array(c));   // lo ocupado o reservado: calles, edificios con su tejado, patios
  const res = (x, y, w, h) => { for (let j = Math.max(0, y); j < Math.min(r, y + h); j++) for (let i = Math.max(0, x); i < Math.min(c, x + w); i++) occ[j][i] = 1; };
  const free = (x, y, w, h) => { if (x < 2 || y < 2 || x + w > c - 2 || y + h > r - 2) return false; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (occ[j][i] || g[j][i]) return false; return true; };
  const pave = (x, y, w, h) => { OUT.paves.push([x, y, w, h]); res(x, y, w, h); };
  // el castillo y la plaza mayor
  deco(cx - 11, 0, 22, 5, 'castle'); res(cx - 13, 0, 26, 6);
  const PL = { x: cx - 14, y: 8, w: 28, h: 14 };
  pave(cx - 2, 5, 4, 3); pave(PL.x, PL.y, PL.w, PL.h);
  deco(cx - 1, 15, 2, 1, 'well'); deco(cx + 7, 11, 2, 1, 'board');
  for (const [x, v] of [[cx - 12, 0], [cx - 8, 1], [cx + 5, 2], [cx + 9, 0]]) deco(x, 19, 3, 1, 'stall', { v });
  // calles: la avenida hasta el arroyo, dos calles de este a oeste y dos de norte a sur, y las que unen la plaza con ellas
  const WX = 20, EX = c - 23, S1 = 27, S2 = 48, RV = r - 8;
  pave(cx - 2, PL.y + PL.h, 4, RV - PL.y - PL.h); pave(cx - 2, RV + 3, 4, r - 2 - RV - 3);
  pave(2, S1, c - 4, 3); pave(2, S2, c - 4, 3);
  pave(WX, 6, 3, RV - 6); pave(EX, 6, 3, RV - 6);
  pave(WX + 3, 13, PL.x - WX - 3, 3); pave(PL.x + PL.w, 13, EX - PL.x - PL.w, 3);
  // el arroyo, con un puente en cada calle que lo cruza
  for (let y = RV; y < RV + 3; y++) for (let x = 2; x < c - 2; x++) { const st = (x >= cx - 2 && x < cx + 2) || (x >= WX && x < WX + 3) || (x >= EX && x < EX + 3); if (!st) g[y][x] = 2; }
  for (const [x0, w] of [[cx - 2, 4], [WX, 3], [EX, 3]]) for (let x = x0; x < x0 + w; x++) OUT.bridges.push({ x, y: RV, h: 3 });
  res(2, RV - 1, c - 4, 5);
  // La forja (oeste): el edificio con su letrero, y delante el yunque, la fragua y el banco
  const HS = CITY_HOUSES.map((h, i) => Object.assign({ i }, h)), trade = t => HS.find(h => h.trade === t);
  const FG = { x: 6, y: S1 + 6 };
  deco(FG.x, FG.y, 8, 3, 'chouse', { i: trade('forge').i }); res(FG.x - 1, FG.y - 6, 10, 9);
  deco(FG.x - 2, FG.y + 5, 3, 2, 'prop', { k: 'anvil' }); deco(FG.x + 7, FG.y + 5, 2, 2, 'prop', { k: 'furnace' }); deco(FG.x + 10, FG.y + 5, 3, 1, 'prop', { k: 'workbench' }); res(FG.x - 3, FG.y + 3, 17, 6);   // la puerta queda libre
  // La posada (nordeste): el edificio, su terraza con bancos y toneles
  const IN = { x: EX + 7, y: 12 };
  deco(IN.x, IN.y, 8, 3, 'chouse', { i: trade('inn').i }); res(IN.x - 1, IN.y - 6, 10, 9);
  deco(IN.x - 1, IN.y + 5, 3, 1, 'prop', { k: 'bench' }); deco(IN.x + 6, IN.y + 5, 3, 1, 'prop', { k: 'bench' }); deco(IN.x + 9, IN.y + 2, 1, 1, 'barrel', { v: 0 }); deco(IN.x + 9, IN.y + 1, 1, 1, 'barrel', { v: 1 }); deco(IN.x - 2, IN.y + 2, 2, 1, 'prop', { k: 'table' });
  res(IN.x - 3, IN.y + 3, 14, 4);
  // El patio de armas (suroeste), vallado, con la entrada al norte
  const GY = { x: 4, y: S2 + 4, w: 14, h: 11 };
  for (let x = GY.x; x < GY.x + GY.w; x++) { if (x < GY.x + 5 || x > GY.x + 8) deco(x, GY.y, 1, 1, 'fence', { horiz: 1 }); deco(x, GY.y + GY.h - 1, 1, 1, 'fence', { horiz: 1 }); }
  for (let y = GY.y + 1; y < GY.y + GY.h - 1; y++) { deco(GY.x, y, 1, 1, 'fence', { horiz: 0 }); deco(GY.x + GY.w - 1, y, 1, 1, 'fence', { horiz: 0 }); }
  res(GY.x - 1, GY.y - 2, GY.w + 2, GY.h + 3);
  // Las casas: en filas dentro de cada manzana, con la puerta hacia la calle de abajo o hacia el patio, y huecos sueltos que
  // luego son huertos o árboles. Del estilo del reino.
  const st = CITY_STYLE[kid] || CITY_STYLE.default, pool = HS.filter(h => !h.trade && (!st.roofs || st.roofs.includes(h.roof)) && (!st.walls || st.walls.includes(h.wall)));
  const bigs = pool.filter(h => h.size === 'big'), smalls = pool.filter(h => h.size === 'small');
  const bld = Array.from({ length: r }, () => new Uint8Array(c));   // solo edificios y cosas que tapan una puerta (las calles no)
  for (const o of OUT.obs) for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) if (bld[j]) bld[j][i] = 1;
  const roofz = Array.from({ length: r }, () => new Uint8Array(c));   // lo que tapa el tejado de cada casa: ahí no puede quedar una puerta
  const doorOk = (x, y) => y < r - 2 && [x, x + 1].every(i => !g[y][i] && !bld[y][i] && !roofz[y][i]);
  // de abajo arriba y de izquierda a derecha, cada casa en el primer sitio donde cabe; de vez en cuando se deja un claro
  for (let fy = RV - 5; fy >= 7; fy--) for (let x = 2; x < c - 8;) {
    const big = Math.random() < 0.38, w = big ? 8 : 6, h = 3, L = big ? bigs : smalls;
    if (!L.length || !free(x, fy - 5, w, h + 5) || !doorOk(x + (w >> 1) - 1, fy + h)) { x++; continue; }
    if (Math.random() < 0.22) { x += ri(3, 6); continue; }   // claro: huerto, árbol o nada
    deco(x, fy, w, h, 'chouse', { i: L[ri(0, L.length - 1)].i }); res(x, fy - 5, w, h + 5); res(x + (w >> 1) - 1, fy + h, 2, 1);
    for (let j = fy; j < fy + h; j++) for (let k = x; k < x + w; k++) bld[j][k] = 1;
    for (let j = fy - 5; j < fy; j++) for (let k = x; k < x + w; k++) if (roofz[j]) roofz[j][k] = 1;
    x += w + (Math.random() < 0.4 ? 2 : 1);
  }
  // Huertos vallados, árboles, matorrales y la vida de las calles en lo que queda libre
  const put = (w, h, pad, fn) => { for (let t = 0; t < 120; t++) { const x = ri(3, c - 4 - w), y = ri(7, RV - 2 - h); if (!free(x - pad, y - pad, w + 2 * pad, h + 2 * pad)) continue; fn(x, y); res(x - 1, y - 1, w + 2, h + 2); return true; } return false; };
  for (let i = 0; i < 7; i++) put(6, 4, 1, (x, y) => {
    for (let k = 0; k < 6; k++) { if (k !== 2 && k !== 3) deco(x + k, y, 1, 1, 'fence', { horiz: 1 }); deco(x + k, y + 3, 1, 1, 'fence', { horiz: 1 }); }
    if (Math.random() < 0.5) deco(x + 2, y + 1, 2, 2, 'prop', { k: 'scarecrow' }); else for (let k = 0; k < 3; k++) OUT.decor.push({ r: BIO.deco[9], x: x + 1 + k * 1.6, y: y + 2.4, shadow: false });
  });
  for (let i = 0; i < 26; i++) put(2, 2, 1, (x, y) => deco(x, y, 2, 2, 'tree', { v: ri(0, 23) }));
  for (let i = 0; i < 18; i++) put(2, 2, 0, (x, y) => deco(x, y, 2, 2, 'prop', { k: ['bush1', 'bush2', 'bush3', 'bush4', 'shrub', 'shrub2'][ri(0, 5)] }));
  for (let i = 0; i < 6; i++) put(2, 1, 1, (x, y) => deco(x, y, 2, 1, 'prop', { k: 'hay' }));
  for (let i = 0; i < 10; i++) put(1, 1, 1, (x, y) => deco(x, y, 1, 1, 'barrel', { v: ri(0, 2) }));
  for (let i = 0; i < 3; i++) put(2, 1, 2, (x, y) => deco(x, y, 2, 1, 'well'));
  for (let i = 0; i < 5; i++) put(3, 1, 1, (x, y) => deco(x, y, 3, 1, 'prop', { k: 'bench' }));
  for (let x = 4; x < c - 4; x += ri(3, 6)) if (Math.random() < 0.6) { const y = r - 4; if (!g[y][x] && !occ[y][x]) deco(x, y, 2, 1, 'tree', { v: ri(0, 23) }); }   // la ribera sur
  // Gente: quien atiende cada sitio, los guardias del castillo y vecinos paseando por la plaza y las calles
  OUT.npcs.push({ key: 'smith', x: FG.x + 1.2, y: FG.y + 5.6 }, { key: 'keeper', x: IN.x + 2.5, y: IN.y + 4.4, flip: true },
    { key: 'decoy', x: GY.x + 3, y: GY.y + 4 }, { key: 'post', x: GY.x + 6.5, y: GY.y + 3.4 }, { key: 'turret', x: GY.x + 4.5, y: GY.y + 7.6 }, { key: 'trainer', x: GY.x + 9.5, y: GY.y + 6.2 }, { key: 'decoy', x: GY.x + 11, y: GY.y + 8 },
    { key: 'guard', id: 'g_puerta', x: cx - 3.2, y: 7.4 }, { key: 'guard', x: cx + 3.2, y: 7.4, flip: true }, { key: 'guard', id: 'g_puente', x: cx - 3.4, y: RV - 1.2 }, { key: 'guard', x: cx + 3.4, y: RV - 1.2, flip: true },
    { key: 'cit_peasant', id: 'v_terraza', x: IN.x + 8, y: IN.y + 5.2, flip: true }, { key: 'villager', id: 'v_mercado', x: cx - 10, y: 21 }, { key: 'villager', id: 'v_pozo', x: cx + 8, y: 21, flip: true },
    { key: 'adv_knight', id: 'v_patio', x: GY.x + GY.w + 1.5, y: GY.y + 2 });
  for (const n of OUT.npcs) if (n.id) OUT.spots.push({ x: n.x * CELL, y: (n.y + 0.9) * CELL, id: 'talk', who: n.id, label: 'Hablar' });   // vecinos con los que se puede hablar (CITY_TALK, 36_town.js)
  OUT.wander.push({ key: 'adv_knight', area: [PL.x + 1, PL.y + 1, PL.w - 2, PL.h - 4] }, { key: 'cit_peasant', area: [PL.x + 1, PL.y + 1, PL.w - 2, 8] }, { key: 'cit_tavern_b', area: [PL.x + 1, PL.y + 1, PL.w - 2, 8] },
    { key: 'villager', area: [PL.x + 2, PL.y + 3, PL.w - 4, 5] }, { key: 'cit_peasant', area: [cx - 2, PL.y + PL.h, 4, RV - PL.y - PL.h] }, { key: 'villager', area: [cx - 2, PL.y + PL.h, 4, RV - PL.y - PL.h] },
    { key: 'cit_peasant', area: [4, S1, c - 8, 3] }, { key: 'cit_tavern_b', area: [4, S1, c - 8, 3] }, { key: 'villager', area: [4, S2, c - 8, 3] }, { key: 'cit_peasant', area: [4, S2, c - 8, 3] },
    { key: 'adv_dwarf', area: [WX, 8, 3, RV - 10] }, { key: 'cit_peasant', area: [EX, 8, 3, RV - 10] }, { key: 'adv_archer', area: [IN.x - 2, IN.y + 4, 10, 2] });
  OUT.spots.push(Object.assign(P(cx, 5.6), { id: 'king', label: 'Subir al castillo' }), Object.assign(P(FG.x + 4, FG.y + 4.1), { id: 'forge', label: 'La forja' }),
    Object.assign(P(IN.x + 4, IN.y + 4.1), { id: 'inn', label: 'La posada' }), Object.assign(P(GY.x + 7, GY.y - 0.4), { id: 'gym', label: 'El patio de armas' }),
    Object.assign(P(cx + 8, 12.7), { id: 'board', label: 'El tablón de encargos' }));
  OUT.plaza = PL;
  return [cx, 14];
}
let ROOM_FORCE = null;   // solo para pruebas
const ROOM_KINDS = Object.keys(ROOM_GEN).filter(k => !['arena', 'aldea', 'pradera', 'aldea_ext', 'plaza', 'hall', 'forgeroom', 'innroom', 'campamento'].includes(k));

// Monta una sala. Devuelve { w, h, walls, start, kind }.
function buildRoom(boss, kindF, sizeF) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const kind = boss ? 'arena' : kindF && attempt < 8 ? kindF : ROOM_FORCE && attempt < 6 ? ROOM_FORCE : attempt > 8 ? 'columnas' : ROOM_KINDS[Math.floor(Math.random() * ROOM_KINDS.length)];
    const [c, r] = ROOM_SIZES[boss ? 'boss' : sizeF || ['small', 'mid', 'mid', 'big'][ri(0, 3)]];
    const g = Array.from({ length: r }, () => new Array(c).fill(0));
    OUT = null;
    const [sx, sy] = ROOM_GEN[kind](g, c, r), out = OUT;
    for (let j = sy - 1; j <= sy + 1; j++) for (let i = sx - 1; i <= sx + 1; i++) if (g[j] && i >= 0 && i < c) g[j][i] = 0;   // el punto de entrada, despejado
    const solids = [];   // mazmorras: obstáculos sueltos de una casilla (ataúdes, setas, pilares...) que tapan el paso y los disparos
    if (!out) for (let i = 0, t = 0; i < (boss ? 0 : Math.round(c * r / 420)) && t < 200; t++) {
      const x = ri(3, c - 4), y = ri(3, r - 4);
      if (Math.hypot(x - sx, y - sy) < 4 || !areaFree(g, x - 2, y - 2, 5, 5)) continue;
      g[y][x] = 1; solids.push({ x, y }); i++;
    }
    // Alcance desde la entrada: lo que no se pueda pisar pasa a ser muro, para que no queden bolsas inaccesibles
    const seen = Array.from({ length: r }, () => new Array(c).fill(0)), q = [[sx, sy]]; seen[sy][sx] = 1; let open = 1;
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= c || ny >= r || g[ny][nx] || seen[ny][nx]) continue; seen[ny][nx] = 1; open++; q.push([nx, ny]); } }
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) if (!seen[y][x] && !g[y][x]) g[y][x] = 1;
    if (open < c * r * (out ? 0.3 : 0.55)) continue;                 // demasiado cerrada: otra
    // Fundir casillas de muro en rectángulos: tiras horizontales que se alargan hacia abajo si coinciden
    const merge = v => {
      const list = [], used = Array.from({ length: r }, () => new Array(c).fill(0));
      for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
        if (g[y][x] !== v || used[y][x]) continue;
        let w = 1; while (x + w < c && g[y][x + w] === v && !used[y][x + w]) w++;
        let h = 1; outer: while (y + h < r) { for (let i = x; i < x + w; i++) if (g[y + h][i] !== v || used[y + h][i]) break outer; h++; }
        for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) used[j][i] = 1;
        list.push({ x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL });
      }
      return list;
    };
    const walls = merge(1), pools = merge(2);
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
    return { traps: out ? [] : traps.filter(t => !solids.some(q => q.x * CELL >= t.x - CELL && q.x * CELL < t.x + t.w + CELL && q.y * CELL >= t.y - CELL && q.y * CELL < t.y + t.h + CELL)), solids, pools, out, w: c * CELL, h: r * CELL, walls, start: { x: (sx + 0.5) * CELL, y: (sy + 0.5) * CELL }, kind };
  }
}
// ¿Se puede estar de pie aquí? (ni muro ni agua)
const isBlockedAt = (x, y) => { const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); return cx < 0 || cy < 0 || cx >= NAV.cols || cy >= NAV.rows || NAV.wall[cy * NAV.cols + cx] !== 0; };
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
  if (!isBlockedAt(x, y)) return { x, y };
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  for (let rad = 1; rad < 8; rad++) for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
    if (i < 0 || j < 0 || i >= NAV.cols || j >= NAV.rows || NAV.wall[j * NAV.cols + i]) continue;
    return { x: (i + 0.5) * CELL, y: (j + 0.5) * CELL };
  }
  return { x: T.room.w / 2, y: T.room.h / 2 };
}

// Hasta dónde llega un rayo antes de chocar con un muro
function rayClip(x, y, ux, uy, len, rects) {
  let best = len;
  for (const w of rects || S.walls) {
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
  const list = S.solids && !(o.type && o.type.fly) ? S.solids : S.walls;   // el agua corta el paso a quien va a pie
  for (let pass = 0; pass < 2; pass++) for (const w of list) {
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
  const wet = S.pools && S.pools.length && !e.type.fly;
  const clear = (ox, oy) => rayClip(e.x + ox, e.y + oy, ux, uy, d) >= d - 0.01 && (!wet || rayClip(e.x + ox, e.y + oy, ux, uy, d, S.pools) >= d - 0.01);
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
// ───────────────────────── La plaza del reino ─────────────────────────
// Entre encargos Alec pasea por la plaza: cada sitio abre su parte de lo que antes era un solo menú.
const PLACES = {
  board: { name: 'El tablón de encargos', tabs: ['map'] },
  forge: { name: 'La forja', tabs: ['gun', 'syn'] },
  gym: { name: 'El patio de armas', tabs: ['tree'] },
  inn: { name: 'La posada · tu habitación', tabs: ['room'] },
  king: { name: 'El salón del trono', tabs: ['king'] },
};
let forgePlace = 'board';
function openTown(from) {
  newGame();
  const IN = { hall: ['hall', 'hall'], forge: ['forgeroom', 'shop'], inn: ['innroom', 'shop'] }, kind = IN[from] || ['plaza', 'plaza'];
  const room = buildRoom(false, kind[0], kind[1]);
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.traps = []; S.solidProps = [];
  S.town = { spots: room.out.spots, npcs: room.out.npcs.slice(), near: null };
  for (const w of room.out.wander || []) { const [ax, ay, aw, ah] = w.area, n = { key: w.key, x: ax + Math.random() * aw, y: ay + Math.random() * ah, area: w.area, tx: 0, ty: 0, wait: Math.random() * 2, walking: false }; n.tx = n.x; n.ty = n.y; S.town.npcs.push(n); }
  S.p.x = room.start.x; S.p.y = room.start.y; S.p.face = Math.PI / 2; S.world = 1;
  const back = { castle: 'king', forgeOut: 'forge', innOut: 'inn' }[from];
  if (back) { const k = room.out.spots.find(s => s.id === back); S.p.x = k.x; S.p.y = k.y + 22; S.p.face = Math.PI / 2; }
  S.mode = 'town'; modeT = 0; renderOverlay(); tipClear();
  if (kind[0] === 'plaza') { if (M.souls > 0) tip('souls'); if (M.iron > 0) tip('iron'); }   // la primera vez que vuelves con algo, para qué sirve
  if (from === 'hall') sayRaw('[El salón del trono de ' + kingdomNow().name + '.]', C.energy);
  else if (from === 'forge') sayRaw('[La forja. Huele a hierro y a carbón.]', C.energy);
  else if (from === 'inn') sayRaw('[La posada. Hay sitio junto al fuego.]', C.energy);
  else if (!M[kflag('metKing')] && !back) sayRaw('[El rey de ' + kingdomNow().name + ' te espera en el castillo. Los encargos están en el tablón.]', C.energy);
}
function openPlace(id) { forgePlace = id; S.mode = 'forge'; modeT = 0; listSel = -1; forgeTab = PLACES[id].tabs[0]; if (id === 'king' && !M[kflag('metKing')]) { M[kflag('metKing')] = 1; save(); } renderOverlay(); ov.scrollTop = 0; sfx('ok', 0.35); }
function closePlace() { S.mode = 'town'; modeT = 0; renderOverlay(); }
function townUpdate(dt) {
  const p = S.p, mv = Math.hypot(I.mx, I.my);
  S.t += dt;
  if (S.dialog) { talkUpdate(dt); return; }   // mientras se habla, Alec no se mueve
  p.x += I.mx * 96 * dt; p.y += I.my * 96 * dt;
  if (mv > 0.2) p.face = Math.atan2(I.my, I.mx);
  p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
  collide(p, p.r);
  let near = null, bd = 30;
  for (const s of S.town.spots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; near = s; } }
  S.town.near = near;
  for (const n of S.town.npcs) {   // los paseantes van de un sitio a otro de su zona y se paran un rato
    if (!n.area) continue;
    if (n.wait > 0) { n.wait -= dt; n.walking = false; continue; }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d < 0.1) { const [ax, ay, aw, ah] = n.area; n.tx = ax + Math.random() * aw; n.ty = ay + Math.random() * ah; n.wait = 1 + Math.random() * 3; continue; }
    const st = Math.min(d, 1.4 * dt); n.x += dx / d * st; n.y += dy / d * st; n.walking = true; n.flip = dx < 0;
  }
  if (near && I.atkP && modeT > 0.3) { const inside = S.out && S.out.interior; if (near.id === 'exit') openTown({ throne: 'castle', forge: 'forgeOut', inn: 'innOut' }[inside]); else if (!inside && ['king', 'forge', 'inn'].includes(near.id)) { openTown({ king: 'hall', forge: 'forge', inn: 'inn' }[near.id]); sfx('ok', 0.35,0.8); } else if (near.id === 'king' && inside === 'throne') talkKing(); else if (near.id === 'queen' && inside === 'throne') talkQueen(); else if (near.id === 'talk') talkTown(near.who); else if (FIRST_TALK[near.id] && !(M.met || {})[near.id]) { M.met = M.met || {}; M.met[near.id] = 1; save(); const id = near.id; talk(FIRST_TALK[id], null, () => openPlace(id)); } else openPlace(near.id); }
}
// Vecinos, muñecos del patio y el aviso del sitio más cercano
function drawTown() {
  const tw = S.town, p = S.p;
  for (const n of tw.npcs.slice().sort((a, b) => a.y - b.y)) {
    const x = n.x * CELL, y = n.y * CELL;
    ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(x, y, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawChar(n.key, n.walking ? 'move' : 'idle', S.t + x * 0.01, x, y, !!n.flip, false);
  }
  if (!S.dialog) for (const s of tw.spots) {
    const on = s === tw.near, b = Math.round(Math.sin(S.t * 5 + s.x) * 1.5);
    ctx.fillStyle = on ? C.energy : '#efe6c8'; ctx.globalAlpha = on ? 1 : 0.7;
    ctx.fillRect(s.x - 2, s.y - 30 + b, 5, 3); ctx.fillRect(s.x - 1, s.y - 27 + b, 3, 1); ctx.fillRect(s.x, s.y - 26 + b, 1, 1); ctx.globalAlpha = 1;
    wtext(s.label, s.x, s.y - 34 + b, on ? 7 : 6, on ? C.energy : '#efe6c8', on ? 1 : 0.75);
  }
  if (tw.near && !S.dialog) wtext(lastDev === 'pad' ? 'A: entrar' : lastDev === 'touch' ? 'Disparar: entrar' : 'Espacio: entrar', p.x, p.y + 22, 6, C.ink, 0.95);
}
// Flechas con el icono de cada sitio de la ciudad, en el borde de la pantalla y apuntando hacia él. Cuando el sitio ya se ve
// en pantalla (te has acercado), su flecha desaparece y queda el letrero de encima.
function townPointers() {
  const tw = S.town, im = IMG.cityhouses; if (!tw || !im || (S.out && S.out.interior)) return;
  const R = 11, L = cam.x + 16, Rt = cam.x + view.w - 16, T = cam.y + Math.max(30, view.h * 0.22), B0 = cam.y + view.h - 16, B1 = cam.y + view.h * 0.74;   // ni bajo los botones de arriba ni sobre la barra de vida (abajo a la izquierda)
  const ox = cam.x + view.w / 2, oy = cam.y + view.h / 2, placed = [];
  for (const s of tw.spots) {
    const ic = PLACE_ICON[s.id]; if (!ic) continue;
    const x = s.x, y = s.y - 14;
    if (x > cam.x + 4 && x < cam.x + view.w - 4 && y > cam.y + 4 && y < cam.y + view.h - 4) continue;
    // desde el centro de la pantalla hacia el sitio, hasta el borde del recuadro: cada flecha sale por su lado
    const dx = x - ox, dy = y - oy, kx = dx > 0 ? (Rt - ox) / dx : dx < 0 ? (L - ox) / dx : 1e9, B = dy > 0 && ox + dx * Math.min(kx, (B0 - oy) / dy) < cam.x + view.w * 0.32 ? B1 : B0, k = Math.min(kx, dy > 0 ? (B - oy) / dy : dy < 0 ? (T - oy) / dy : 1e9);
    let px = ox + dx * k, py = oy + dy * k;
    for (let n = 0; n < 6 && placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < 2 * R + 4); n++) {   // si pisa a otra, se corre por el borde
      if (px <= L + 1 || px >= Rt - 1) py = clamp(py + (py > oy ? -1 : 1) * (2 * R + 5), T, B0); else px = clamp(px + (px > ox ? -1 : 1) * (2 * R + 5), L, Rt);
    }
    placed.push([px, py]); px = Math.round(px); py = Math.round(py);
    const a = Math.atan2(y - py, x - px), b = Math.floor(S.t * 3) % 2;
    ctx.save(); ctx.translate(px, py);
    ctx.save(); ctx.rotate(a);   // la punta, por fuera del círculo, hacia el sitio
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.moveTo(R + 7 + b, 0); ctx.lineTo(R - 2, -6); ctx.lineTo(R - 2, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efe6c8'; ctx.beginPath(); ctx.moveTo(R + 5 + b, 0); ctx.lineTo(R - 1, -4); ctx.lineTo(R - 1, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e2636'; ctx.beginPath(); ctx.arc(0, 0, R - 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#efe6c8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.drawImage(im, ic[0], ic[1], ic[2], ic[3], -8, -8, 16, 16);
    ctx.restore();
  }
}
// El rey: por qué te ha contratado y cuánto falta
function kingHtml() {
  const K = kingdomNow(), down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length, god = TYPES[K.god].name, dead = isDone(K.id + ':g');
  const say = dead ? `«${god} ha caído. No sé qué eres, Alec, pero mi reino te debe más de lo que puedo pagar. Otros reyes preguntarán por ti.»`
    : down === 4 ? `«Los cuatro guardianes han caído y ${god} ya no tiene tras quién esconderse. Sal a buscarlo antes de que venga él.»`
    : down ? `«${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Mis hombres vuelven a mirar a los ojos. Quedan ${4 - down}; mientras sigan en pie, ${god} no dará la cara.»`
    : K.id !== 'valdehierro' ? `«El de Valdehierro. Aquí un nombre no basta: ${K.lore.split('. ')[1] || ''} Cuatro guardianes le sostienen; mátalos y ${god} tendrá que bajar de su tribunal.»` : `«Un desconocido que se ofrece a matar a un dios. Bien. Mis soldados rezaban, y mira de qué les sirvió. ${K.lore.split('. ')[1] || ''} Cuatro guardianes le sostienen; mátalos y ${god} tendrá que salir. Pago en hierro y no hago preguntas.»`;
  return `<p class="lead">${K.title}. ${K.lore.split('. ')[0]}.</p><p class="lead" style="font-style:italic">${say}</p>
    <p class="fine">Encargos cumplidos: <b>${jobs}</b> de 12 · Guardianes caídos: <b>${down}</b> de 4 · ${god}: <b>${dead ? 'muerto' : 'vivo'}</b>. Los encargos se cogen en el tablón de la plaza.</p>`;
}
// Tu habitación en la posada: lo que llevas hecho
function roomHtml() {
  const K = kingdomNow(), hrs = (M.time || 0) / 3600, hm = h => (h < 1 ? Math.round(h * 60) + ' min' : h.toFixed(1) + ' h');
  const heads = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).map(z => TYPES[zoneBoss(K, z)].name); if (isDone(K.id + ':g')) heads.push(TYPES[K.god].name);
  const forged = PARTS.filter(x => M.parts[x.id] === 2).length, known = PARTS.filter(x => M.parts[x.id]).length;
  return `<p class="lead">Una cama, un baúl y una pared para los trofeos. Aquí se guarda todo lo que haces: no hace falta que hagas nada para guardar.</p>
    <div class="forge"><section><h3>Trofeos en la pared</h3>${heads.length ? heads.map(h => `<p class="fine">· ${h}</p>`).join('') : '<p class="fine">La pared está vacía. Todavía.</p>'}</section>
    <section><h3>El baúl</h3><p class="fine">${M.runs} encargos aceptados, ${M.wins} cumplidos · ${hm(hrs)} de camino · ${M.earned || 0} almas ganadas en total</p><p class="fine">${known} piezas de guantelete descubiertas de ${PARTS.length}, ${forged} forjadas</p><p class="fine">Ahora llevas: ${gunName(M.gun)}</p></section></div>
    <button class="fi" data-act="intro"><b>Recordar cómo empezó todo</b><span>El pueblo, el herrero, el elegido y el camino hasta aquí: la historia de Alec, otra vez.</span></button>${[0, 1, 2, 3].filter(z => M[kflag('seenZone' + z)]).map(z => `
    <button class="fi" data-act="zone${z}"><b>Recordar: ${K.zones[z].name}</b><span>Lo que dijeron el rey y la reina cuando cayó ${lc(TYPES[zoneBoss(K, z)].name)}.</span></button>`).join('')}${M[kflag('seenEnding')] ? `
    <button class="fi" data-act="ending"><b>Recordar el final de ${K.name}</b><span>La caída de ${TYPES[K.god].name}, el pago del rey y el camino que sigue.</span></button>` : ''}`;
}

// ───────────────────────── Conversaciones con bocadillos ─────────────────────────
// Cada línea: quién habla y qué dice. Se escribe letra a letra; A (o Espacio) acaba la línea o pasa a la siguiente,
// B (o Shift) se salta la conversación. Al final puede haber opciones para elegir con arriba y abajo.
function talk(lines, choices, onEnd) { S.dialog = { lines, i: 0, ch: 0, choices: choices || null, sel: 0, t: 0, onEnd: onEnd || null }; sfx('tick', 0.25,1.1); }
// En la ciudad, quien habla se mira: Alec se gira hacia el vecino que le habla (o hacia el último que le habló, si habla él)
// y el vecino se gira hacia Alec. En la cinemática lo deciden las escenas.
const townNpc = who => S.calm ? S.calm.npcs.find(q => q.id === who) : S.town && (S.town.npcs.find(q => q.id === who) || S.town.npcs.find(q => q.key === who));
function talkFace(d) {
  if (S.intro || !(S.town || S.calm)) return;
  const L = d.lines[d.i], w = L && L.who !== 'alec' ? L.who : d.other || (d.lines.find(q => q.who !== 'alec') || {}).who, n = w && townNpc(w);
  if (!n) return;
  d.other = w; const k = S.calm ? 1 : CELL, nx = n.x * k, ny = n.y * k;   // en la ciudad, en casillas; en la calma, en píxeles
  S.p.face = Math.atan2(ny - S.p.y, nx - S.p.x); n.flip = nx > S.p.x;
}
// Elegir una respuesta (con el mando aquí, o tocándola en la pantalla de abajo en las consolas de dos pantallas)
function talkPick(i) {
  const d = S.dialog; if (!d || !d.choices || d.i < d.lines.length || d.t <= 0.2 || !d.choices[i]) return;
  const c = d.choices[i]; S.dialog = null; modeT = 0; sfx('ok', 0.3); c.fn();
}
function talkUpdate(dt) {
  const d = S.dialog, L = d.lines[d.i];
  talkFace(d);
  if (L) d.ch = Math.min(L.text.length, d.ch + dt * 55);
  d.t += dt;
  if (I.backP && !(d.choices && d.i >= d.lines.length)) { d.i = d.lines.length; d.ch = 0; if (!d.choices) { S.dialog = null; modeT = 0; if (d.onEnd) d.onEnd(); } return; }
  if (d.i >= d.lines.length && d.choices) {
    if (I.navY) { d.sel = (d.sel + (I.navY > 0 ? 1 : d.choices.length - 1)) % d.choices.length; sfx('tick', 0.25); }
    if (I.atkP && d.t > 0.2) talkPick(d.sel);
    return;
  }
  if (I.atkP && d.t > 0.15) {
    if (d.ch < L.text.length) d.ch = L.text.length;
    else { d.i++; d.ch = 0; d.t = 0; if (d.i >= d.lines.length && !d.choices) { S.dialog = null; modeT = 0; if (d.onEnd) d.onEnd(); } else sfx('tick', 0.15,1.3); }
  }
}
function speakerPos(who) {
  if (S.intro) return introSpeakerPos(who);   // en la cinemática hablan sus actores
  if (who === 'alec') return { x: S.p.x, y: S.p.y - 26 };
  if (S.calm) { const c = S.calm.npcs.find(q => q.id === who); if (c) return { x: c.x, y: c.y - 30 }; }
  const n = S.town && (S.town.npcs.find(q => q.id === who) || S.town.npcs.find(q => q.key === who));
  return n ? { x: n.x * CELL, y: n.y * CELL - 30 } : { x: S.p.x, y: S.p.y - 26 };
}
const SPEAKER = { smith: ['La herrera', '#ff9a5c'], keeper: ['La posadera', '#e6c07a'], trainer: ['La instructora', '#9fe09a'], king: ['El rey', '#f2c14e'], queen: ['La reina', '#e6a0c4'], alec: ['Alec', '#9fd3ff'] };
function wrapText(ctx2, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx2.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function drawDialog(k) {
  const d = S.dialog, g = scr, dp = view.dpr, fs = Math.round(15 * dp), pad = 10 * dp, lh = fs * 1.35, maxW = Math.min(360 * dp, cv.width * 0.62);
  g.save(); g.textAlign = 'left'; g.textBaseline = 'top';
  const box = (x, y, w, h, tail) => {   // bocadillo redondeado con pico hacia quien habla
    g.fillStyle = 'rgba(16,12,20,0.94)'; g.strokeStyle = '#efe6c8'; g.lineWidth = 2 * dp; const r = 8 * dp;
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    if (tail) { g.lineTo(tail.x + 8 * dp, y + h); g.lineTo(tail.x, tail.y); g.lineTo(tail.x - 8 * dp, y + h); }
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); g.fill(); g.stroke();
  };
  if (d.i < d.lines.length && d.lines[d.i].think) {
    // Pensamiento o recuerdo: nadie lo dice en voz alta. Va abajo, en una franja sin borde ni pico, en cursiva y sin nombre,
    // para que no se confunda con el bocadillo de quien habla.
    const L = d.lines[d.i], sp = SPEAKER[L.who] || [L.who, '#efe6c8'], tw = Math.min(cv.width * 0.8, 640 * dp);
    g.font = `italic 500 ${fs}px ${FONT}`;
    const lines = wrapText(g, L.text, tw - pad * 4), shown = L.text.slice(0, Math.floor(d.ch)), h = lines.length * lh + pad * 2;
    const bx = (cv.width - tw) / 2, by = cv.height - h - 74 * dp;
    const gr = g.createLinearGradient(bx, 0, bx + tw, 0); gr.addColorStop(0, 'rgba(8,6,10,0)'); gr.addColorStop(0.12, 'rgba(8,6,10,0.8)'); gr.addColorStop(0.88, 'rgba(8,6,10,0.8)'); gr.addColorStop(1, 'rgba(8,6,10,0)');
    g.fillStyle = gr; g.fillRect(bx, by, tw, h);
    g.fillStyle = sp[1]; g.globalAlpha = 0.7; g.fillRect(bx + tw * 0.2, by, tw * 0.6, Math.max(1, dp)); g.fillRect(bx + tw * 0.2, by + h - Math.max(1, dp), tw * 0.6, Math.max(1, dp)); g.globalAlpha = 1;
    g.textAlign = 'center'; g.fillStyle = '#d9cfbe';
    let left = shown.length;
    lines.forEach((t, i) => { if (left <= 0) return; g.fillText(t.slice(0, left), cv.width / 2, by + pad + i * lh); left -= t.length + 1; });
    if (d.ch >= L.text.length && Math.floor(S.t * 3) % 2 === 0) { g.fillStyle = sp[1]; g.font = `500 ${fs}px ${FONT}`; g.fillText('▸', bx + tw - pad * 2.5, by + h - pad - fs * 0.9); }
    g.font = `500 ${Math.round(fs * 0.7)}px ${FONT}`; g.fillStyle = 'rgba(239,230,200,0.7)';
    if (!S.intro) g.fillText(lastDev === 'pad' ? 'A: seguir · B: saltar' : 'Espacio: seguir · Shift: saltar', cv.width / 2, cv.height - 58 * dp);
  } else if (d.i < d.lines.length) {
    const L = d.lines[d.i], sp = SPEAKER[L.who] || [L.who, '#efe6c8'], at = speakerPos(L.who), sx = (at.x - cam.x) * k, sy = (at.y - cam.y) * k;
    g.font = `500 ${fs}px ${FONT}`;
    const lines = wrapText(g, L.text, maxW), shown = L.text.slice(0, Math.floor(d.ch));
    const w = Math.max(...lines.map(t => g.measureText(t).width), 120 * dp) + pad * 2 + fs * 1.1, h = lines.length * lh + pad * 2 + fs * 1.1;
    let bx = clamp(sx - w / 2, 8 * dp, cv.width - w - 8 * dp), by = sy - h - 14 * dp; if (by < 8 * dp) by = 8 * dp;
    box(bx, by, w, h, { x: clamp(sx, bx + 14 * dp, bx + w - 14 * dp), y: Math.min(sy - 4 * dp, by + h + 12 * dp) });
    g.font = `700 ${Math.round(fs * 0.85)}px ${FONT}`; g.fillStyle = sp[1]; g.fillText(sp[0], bx + pad, by + pad * 0.7);
    g.font = `500 ${fs}px ${FONT}`; g.fillStyle = '#efe6c8';
    let left = shown.length;
    lines.forEach((t, i) => { if (left <= 0) return; const part = t.slice(0, left); g.fillText(part, bx + pad, by + pad + fs * 1.1 + i * lh); left -= t.length + 1; });
    if (d.ch >= L.text.length && Math.floor(S.t * 3) % 2 === 0) { g.fillStyle = sp[1]; g.fillText('▸', bx + w - pad - fs * 0.6, by + h - pad - fs * 0.9); }
    g.font = `500 ${Math.round(fs * 0.7)}px ${FONT}`; g.fillStyle = 'rgba(239,230,200,0.7)'; g.textAlign = 'center';
    if (!S.intro) g.fillText(lastDev === 'pad' ? 'A: seguir · B: saltar' : 'Espacio: seguir · Shift: saltar', cv.width / 2, cv.height - 58 * dp);   // la cinemática pone su propia ayuda
  } else if (d.choices && DUAL.on) {   // con dos pantallas, las respuestas se eligen abajo: aquí solo el aviso, bajo Alec
    g.font = `500 ${fs}px ${FONT}`; const t = '↓ Elige qué responder abajo';
    const at = speakerPos('alec'), sx = (at.x - cam.x) * k, sy = (at.y - cam.y) * k, w = g.measureText(t).width + pad * 2, h = lh + pad * 2;
    const bx = clamp(sx - w / 2, 8 * dp, cv.width - w - 8 * dp), by = Math.min(cv.height - h - 70 * dp, sy + 52 * k);
    box(bx, by, w, h, null); g.fillStyle = '#f2c14e'; g.fillText(t, bx + pad, by + pad);
  } else if (d.choices) {   // opciones de respuesta de Alec
    g.font = `500 ${fs}px ${FONT}`;
    const at = speakerPos('alec'), sx = (at.x - cam.x) * k, sy = (at.y - cam.y) * k;
    const w = Math.max(...d.choices.map(c => g.measureText('▸ ' + c.label).width)) + pad * 2, h = d.choices.length * lh + pad * 2;
    const bx = clamp(sx - w / 2, 8 * dp, cv.width - w - 8 * dp), by = Math.min(cv.height - h - 70 * dp, sy + 52 * k);   // debajo de Alec, para no tapar a quien le habla
    box(bx, by, w, h, null);
    d.choices.forEach((c, i) => { g.fillStyle = i === d.sel ? '#f2c14e' : '#efe6c8'; g.fillText((i === d.sel ? '▸ ' : '  ') + c.label, bx + pad, by + pad + i * lh); });
  }
  g.restore();
}
// El rey: la primera vez te explica el contrato entero; después te dice cómo vas y te deja preguntar
// Nombres con artículo («El Umbral», «La Matriarca del Fango») en mitad de frase: «el Umbral»; y con «de» delante, «del Umbral»
const lc = n => n.replace(/^(El|La|Los|Las) /, m => m.toLowerCase());
const deN = n => /^El /.test(n) ? 'del ' + n.slice(3) : 'de ' + lc(n);
// Lo que ha pasado en el reino, contado por el rey (en la cinemática del principio y cada vez que se lo preguntas)
function kingStory() {
  if (KSTORY[kingdomNow().id]) return KSTORY[kingdomNow().id]();
  const K = kingdomNow(), god = TYPES[K.god].name, Z = K.zones.map(z => z.name), B = [0, 1, 2, 3].map(i => TYPES[zoneBoss(K, i)].name);
  return [
    { who: 'king', text: `Hace un año, el cielo sobre ${lc(Z[3])} se abrió como una herida. De ahí bajó ${lc(god)}, el dios de la guerra.` },
    { who: 'king', text: 'No pidió oro ni oraciones. Pidió soldados. Las aldeas que se los dieron, perdieron a sus hijos. Las que no, ardieron.' },
    { who: 'king', text: `Después repartió el reino entre sus ejércitos. Los muertos se levantaron en ${lc(Z[0])}. Las bestias anidaron en ${lc(Z[1])}. En ${lc(Z[2])}, los picadores dejaron de picar y empezaron a obedecer.` },
    { who: 'king', text: `Y en cada sitio dejó un guardián: ${lc(B[0])}, ${lc(B[1])}, ${lc(B[2])} y ${lc(B[3])}. Mientras sigan en pie, ${lc(god)} no se mueve ${deN(Z[3])}. No le hace falta.` },
    { who: 'king', text: 'Mandé a mis caballeros. Volvieron tres de cada diez. Algunos, con los ojos rojos y rezándole a quien los había vencido: ahora los llaman elegidos.' },
    { who: 'king', text: 'Los sacerdotes dicen que hay que ofrecerle algo para que se vaya. Yo he enterrado a demasiada gente para creérmelo.' },
  ];
}
// Lo que cuenta el rey de los demás reinos
const KSTORY = {
  torrealba: () => { const K = KINGDOMS.find(k => k.id === 'torrealba'), Z = K.zones.map(z => z.name), B = [0, 1, 2, 3].map(i => TYPES[zoneBoss(K, i)].name); return [
    { who: 'king', text: 'El Juez Sin Rostro no llegó hace un año, como vuestro Primer Puño. Lleva aquí desde antes que mi abuelo. Nadie recuerda Torrealba sin él.' },
    { who: 'king', text: 'No pide soldados ni oraciones. Juzga. Cada luna llena, su tribunal condena a una aldea entera. Y sus alguaciles cumplen la sentencia.' },
    { who: 'king', text: `Tiene cuatro guardianes: ${lc(B[0])} en ${lc(Z[0])}, ${lc(B[1])} en ${lc(Z[1])}, ${lc(B[2])} en ${lc(Z[2])} y ${lc(B[3])} en ${lc(Z[3])}.` },
    { who: 'king', text: 'Mis abuelos le mandaron ejércitos. Mi padre le mandó ofrendas. Yo le mandé a mi hermano a negociar. El tribunal lo juzgó. Volvió con los ojos rojos.' },
    { who: 'king', text: 'Aquí nadie cree que se le pueda matar. Lo de Valdehierro nos llegó como llegan los cuentos: tarde y con el dios cada vez más pequeño.' },
  ]; },
};
function kingExplain() {
  const K = kingdomNow(), god = TYPES[K.god].name, zones = K.zones.map(z => z.name);
  return [
    { who: 'king', text: `${god} se ha quedado con medio reino. Sus ejércitos salen de cuatro sitios: ${zones.slice(0, 3).map(lc).join(', ')} y ${lc(zones[3])}.` },
    { who: 'king', text: 'En cada zona hay tres encargos, y los tienes en el tablón de la plaza: limpiar un lugar sala a sala, defender una aldea o asaltar un campamento.' },
    { who: 'king', text: 'Cuando cumplas los tres de una zona, saldrá su guardián. Mata a los cuatro guardianes y el dios no tendrá dónde esconderse.' },
    { who: 'king', text: 'Por el camino robarás técnicas a los dioses menores. Úsalas sin miedo: solo te duran ese encargo.' },
    { who: 'king', text: 'Al principio solo cuatro de ellos se fijarán en ti. Cada encargo que cumplas atraerá la mirada de otro, hasta veinte.' },
    { who: 'king', text: 'Lo que ganes, en cambio, es tuyo: almas para entrenar en el patio de armas, y hierro y materiales para mejorar tus guanteletes en la forja.' },
    { who: 'king', text: 'Y si caes, te retiras y vuelves a intentarlo. En la posada tienes cama y siempre habrá otro encargo.' },
  ];
}
function kingProgress() {
  const K = kingdomNow(), god = TYPES[K.god].name, down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  if (isDone(K.id + ':g')) return [   // el reino es libre: de momento no hay más encargos que los que ya conoce
    { who: 'king', text: `${god} ha caído y ${K.name} es libre. No sé qué eres, Alec, pero mi reino te debe más de lo que puedo pagar.` },
    { who: 'king', text: 'Por ahora no tengo encargos nuevos que darte. Los del tablón siguen ahí: repite los que quieras. Pagan menos, pero pagan.' },
    ...(KINGDOMS[KINGDOMS.indexOf(K) + 1] ? [{ who: 'queen', text: `Ha llegado una carta de ${KINGDOMS[KINGDOMS.indexOf(K) + 1].name}. Su rey ha oído hablar de ti. No mucho, y no todo bueno, pero ha oído.` }, { who: 'queen', text: 'Cuando quieras ir, díselo al rey. Aquí siempre tendrás una casa.' }]
      : [{ who: 'queen', text: 'Otros reyes ya preguntan por ti. Cuando llegue su carta, serás el primero en saberlo.' }])];
  if (down === 4) return [{ who: 'king', text: `Los cuatro guardianes han caído. ${god} ya no tiene tras quién esconderse: búscalo en el tablón antes de que venga él.` }];
  if (down) return [{ who: 'king', text: `${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Mis soldados vuelven a mirar a los ojos.` }, { who: 'king', text: `Quedan ${4 - down}. Mientras sigan en pie, ${god} no dará la cara.` }];
  if (jobs) return [{ who: 'king', text: `${jobs === 1 ? 'Un encargo cumplido' : jobs + ' encargos cumplidos'}. Bien. Cumple los tres de una zona y saldrá su guardián.` }];
  return [{ who: 'king', text: 'El tablón de la plaza sigue lleno de encargos, mercenario. ¿A qué esperas?' }];
}
function talkKing() {
  const first = !M[kflag('metKing')];
  if (first) { M[kflag('metKing')] = 1; save(); }
  const travel = KINGDOMS.map((K2, i) => K2 !== kingdomNow() && kingdomOpen(i) ? { label: 'Viajar a ' + K2.name, fn: () => travelTo(i) } : null).filter(Boolean);   // ir a otro reino (37_intro.js)
  const opts = [...travel, { label: '¿Qué pasó en el reino?', fn: () => talk(kingStory(), opts) }, { label: 'Explícame otra vez cómo va esto', fn: () => talk(kingExplain(), opts) }, { label: 'Ver cómo voy en el reino', fn: () => openPlace('king') }, { label: 'Nada más. Me voy', fn: () => {} }];
  if (first) talk([
    { who: 'king', text: 'Ya sabes lo que ha pasado en mi reino, Alec. Ahora te diré cómo vas a arreglarlo.' },
    { who: 'alec', text: 'Os escucho. Mientras paguéis, os escucho.' },
    ...kingExplain(),
    { who: 'queen', text: 'No le asustes. Es el primero en meses que se ofrece voluntario.' },
    { who: 'alec', text: '¿Y si mato a vuestro dios?' },
    { who: 'king', text: 'Entonces te deberé más de lo que puedo pagar. Ve. El tablón está en la plaza.' },
    { who: 'queen', text: 'Y vuelve de vez en cuando. Aquí arriba solo nos llegan malas noticias: alguna buena no nos vendría mal.' },
  ], opts);
  else talk(kingProgress(), opts);
}

// Vecinos de la ciudad con los que se puede hablar. Cada uno tiene varias cosas que decir y van saliendo por turnos;
// lo que cuentan cambia según cómo vaya el reino: al principio (0), con encargos hechos (1), con guardianes caídos (2) y con el dios muerto (3).
const CITY_TALK = {
  g_puerta: { name: 'Un guardia del castillo', col: '#cfd6de', lines: [
    ['El rey recibe a quien quiera. Pero no le hagas perder el tiempo: duerme poco y lo poco que duerme, mal.', 'Antes éramos cuarenta en la guardia. Ahora somos doce. Los demás se fueron al Umbral con el capitán.', 'La reina baja cada mañana a ver a los heridos. El rey dice que es peligroso. Ella dice que más peligroso es no hacerlo.'],
    ['Han vuelto a llegar carros de las aldeas que limpias. Poca cosa: grano, leña. Pero llegan.', 'El capitán de la guardia no se cree lo que cuentan de ti. Yo sí: te he visto volver.'],
    ['Dicen que has tumbado a un guardián. Hasta el sacerdote ha dejado de hablar de sacrificios.', 'Si caen los cuatro, el dios tendrá que salir de su agujero. Entonces sí que vamos a necesitar suerte.'],
    ['No me lo creo todavía. El Primer Puño, muerto. Esta puerta está abierta para ti a cualquier hora, Alec.'] ] },
  g_puente: { name: 'Un guardia del puente', col: '#cfd6de', lines: [
    ['Por este puente entra lo poco que llega de fuera. Desde que cayó Fuenteseca, casi nada.', 'Si ves a alguien cruzar con los ojos rojos, no le dejes hablar. Los elegidos convencen. Luego matan.', 'El arroyo baja del Nido. Hace un año traía truchas. Ahora trae seda.'],
    ['Ayer cruzó una familia de Robledal. Dijeron que un mercenario les había limpiado la aldea. ¿Fuiste tú?', 'Cada vez cruza más gente hacia dentro y menos hacia fuera. Buena señal, supongo.'],
    ['Los mercaderes vuelven a preguntar por los caminos. Les digo que esperen. Que tú todavía no has acabado.'],
    ['Han vuelto los mercaderes de verdad. Con mulas y todo. Ya ni me acordaba de cómo sonaban las mulas.'] ] },
  v_mercado: { name: 'Una vecina', col: '#e6c07a', lines: [
    ['El pan ha subido otra vez. Con el Nido infestado, el trigo del norte no llega.', 'Mi marido se fue a las Minas de Cristal a trabajar. No ha vuelto. Bueno: dicen que volvió, pero que ya no era él.', 'No te acerques mucho a la plaza por la noche. Los guardias ven bichos en cada sombra, y a veces aciertan.'],
    ['Dicen que eres un mercenario sin dios. Mi madre dice que eso trae mala suerte. Yo digo que peor suerte que esta, imposible.', 'Han vuelto a abrir la panadería del puente. Algo es algo.'],
    ['¿Sabes que los niños juegan a ser tú? Uno hace de dios, otro de Alec, y el dios siempre pierde. Les encanta.'],
    ['Esta noche hay fiesta en la plaza. Si vienes, te invito a algo. Bueno, te invita la posadera, que tiene más dinero que yo.'] ] },
  v_pozo: { name: 'Un vecino', col: '#e6c07a', lines: [
    ['El pozo es lo único de la ciudad que no ha cambiado en un año. Por eso vengo aquí.', 'Yo era carretero. Ahora no hay caminos que valgan. Así que cargo agua.', '¿Has visto el castillo? Antes tenía estandartes de colores. El rey los quitó todos: dice que no hay nada que celebrar.'],
    ['He oído que en las aldeas te dejan comida en la puerta para que pases por allí. Como a los santos. Qué cosas.', 'Si vas al Nido, no toques la seda. Mi cuñado la tocó.'],
    ['Esta mañana el rey ha mandado colgar un estandarte. Uno solo. Ya es algo.'],
    ['Ya puedo volver a ser carretero. A ver quién me enseña a conducir el carro otra vez.'] ] },
  v_terraza: { name: 'Una clienta de la posada', col: '#e6c07a', lines: [
    ['La posadera no te cobra a ti, ¿verdad? A mí me cobra hasta el aire.', 'Aquí se oye todo lo que pasa en el reino. Lo malo es que todo lo que pasa en el reino es malo.', 'Dicen que la herrera fue soldado antes que herrera. No sé si creérmelo. Bueno, sí: has visto cómo da martillazos.'],
    ['Esta noche se brindaba por ti en la barra. No te emociones: también se brindaba por la lluvia.'],
    ['Un cliente decía que los guardianes eran inmortales. Le he dicho que fuera a decírtelo a ti.'],
    ['Dicen que vas a seguir hacia otro reino. Llévate una botella. Allí no tendrán vino como este.'] ] },
  v_patio: { name: 'Un recluta', col: '#9fe09a', lines: [
    ['La instructora nos hace correr alrededor del patio hasta que vomitamos. Dice que en el campo de batalla el que corre vive.', 'Me alisté porque mi pueblo está en las Criptas. Quiero volver. Aunque sea para enterrar a los míos.', 'No te ofendas, pero la instructora dice que pelear como tú es de cobardes: golpear y salir corriendo. Luego dice que es lo más listo que ha visto.'],
    ['Ayer aguanté diez vueltas al patio. La instructora dijo «bien». Es la primera vez que le oigo decirlo.'],
    ['Cuando caigan todos los guardianes, nos mandarán a limpiar lo que quede. Más vale que tú hayas dejado poco.'],
    ['Ahora entrenamos por si vuelven. La instructora dice que siempre vuelven. Ojalá se equivoque.'] ] },
};
// Lo que dicen los vecinos de Torrealba (mismos sitios y mismas etapas que en Valdehierro)
const CITY_TALK_K = { torrealba: {
  g_puerta: { name: 'Un guardia del castillo', col: '#cfd6de', lines: [
    ['¿El de Valdehierro? Pasa. El rey te recibe… más por curiosidad que por fe, te aviso.', 'Aquí la guardia no defiende el castillo del Juez. Lo defiende de la gente que quiere entregarle el reino a cambio de piedad.'],
    ['Dicen que en Valdehierro mataste a un dios. Aquí dicen que era de los pequeños. Yo no digo nada: te he visto volver.'],
    ['Ha caído un guardián del Juez. Ningún guardia de esta puerta lo había visto nunca. Ni nuestros padres.'],
    ['El tribunal está vacío. Esta mañana la gente ha subido a mirarlo. Nadie se atrevía a entrar.'] ] },
  g_puente: { name: 'Un guardia del puente', col: '#cfd6de', lines: [
    ['Por este puente pasan los condenados cada luna llena. Los alguaciles no dan explicaciones. Ni hace falta.', 'Si oyes campanas de noche, no salgas. Es el tribunal leyendo una sentencia.'],
    ['Han dejado de pasar condenados. No sé si por ti o porque al Juez se le han acabado las aldeas.'],
    ['Los mercaderes de la costa preguntan si es verdad lo que se cuenta. Les digo que vengan a verlo.'],
    ['Han quitado la horca del puente. Llevaba ahí desde antes de que yo naciera.'] ] },
  v_mercado: { name: 'Una vecina', col: '#e6c07a', lines: [
    ['¿Tú eres el de los cuentos de Valdehierro? Te imaginaba más alto. Bueno, y con barba.', 'Aquí no se habla del Juez en voz alta. Dicen que oye su nombre.'],
    ['Mi hermana vive en Salobral. Dice que los salineros han vuelto a trabajar. Que fuiste tú.'],
    ['Los niños ya no juegan a juicios. Juegan a ser tú. Uno hace de Juez y siempre pierde.'],
    ['Esta noche nadie va a dormir. Nadie quiere perderse la primera noche sin el Juez.'] ] },
  v_pozo: { name: 'Un vecino', col: '#e6c07a', lines: [
    ['Mi abuelo decía que el Juez es justo. Mi abuelo murió condenado. Así de justo es.', 'El agua del pozo sabe a sal desde que los Salares se perdieron.'],
    ['¿Ves el estandarte del castillo? Lo han subido otra vez. Hacía años que estaba a media asta.'],
    ['El agua del pozo vuelve a saber a agua. Parece una tontería. No lo es.'],
    ['Ya no tengo miedo de la luna llena. No sabes lo que es eso.'] ] },
  v_terraza: { name: 'Una clienta de la posada', col: '#e6c07a', lines: [
    ['En esta posada se apostaba cuánto duraban los mercenarios. Contigo nadie se atreve a apostar.', 'Dicen que lo de Valdehierro lo exageran los bardos. Yo digo que los bardos siempre se quedan cortos.'],
    ['Ya no se apuesta contra ti. Se apuesta por cuánto tardas.'],
    ['El tabernero ha bautizado un vino con tu nombre. Es malísimo. Se vende muchísimo.'],
    ['¿Te vas ya? Siempre os vais. Bueno: a donde vayas, que tiemble su dios.'] ] },
  v_patio: { name: 'Un recluta', col: '#9fe09a', lines: [
    ['En Torrealba no hay instructores como la de Valdehierro. Aquí te enseñan a arrodillarte bien.', 'Me alisté para que no me juzgaran a mí. Aquí, o eres alguacil o eres condenado.'],
    ['Ahora entrenamos de verdad. Desde que tú llegaste, nadie quiere aprender a arrodillarse.'],
    ['Cuando caiga el Juez, ¿qué haremos los soldados? Nunca hemos peleado contra nadie más.'],
    ['Esto de no tener miedo se aprende. Me está costando, pero se aprende.'] ] },
} };
function townStage() {
  const K = kingdomNow(), down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  return isDone(K.id + ':g') ? 3 : down ? 2 : jobs ? 1 : 0;
}
function talkTown(who) {
  const C2 = ((CITY_TALK_K[kingdomNow().id] || CITY_TALK)[who]); if (!C2) return;
  SPEAKER[who] = [C2.name, C2.col];
  const st = townStage(), pool = C2.lines.slice(0, st + 1).flat().filter((_, i, a) => st === 0 || i >= a.length - C2.lines[st].length - 1);   // lo de ahora y algo de antes
  M.talkN = M.talkN || {}; const n = M.talkN[who] = ((M.talkN[who] || 0) + 1);
  talk([{ who, text: pool[(n - 1) % pool.length] }]);
}

// La reina: quién es, cómo ve el reino y qué piensa de Alec. Lo que cuenta cambia según lo que lleves hecho.
function queenNews() {
  const K = kingdomNow(), god = TYPES[K.god].name, down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  if (isDone(K.id + ':g')) return [{ who: 'queen', text: `Esta mañana he bajado al mercado sin escolta. Hacía un año que no podía. La gente ya no habla ${deN(god)}: habla de ti.` }, { who: 'queen', text: 'No te pido que te quedes. Solo que sepas que aquí tienes una casa.' }];
  if (down >= 3) return [{ who: 'queen', text: `Ya solo le queda un guardián. ${god} lo sabe: por las noches, desde las almenas, se ve arder el cielo sobre ${lc(K.zones[3].name)}.` }];
  if (down) return [{ who: 'queen', text: `${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Las madres han vuelto a dejar salir a los niños a la plaza. No sabes lo que eso vale.` }];
  if (jobs) return [{ who: 'queen', text: 'Me cuentan lo que haces ahí fuera. Los aldeanos que salvas vienen a la ciudad a contarlo, y cada vez lo cuentan más grande.' }];
  return [{ who: 'queen', text: 'El rey no duerme. Se pasa la noche mirando el mapa, como si mirándolo fuera a cambiar.' }, { who: 'queen', text: 'Tú no pareces de los que miran mapas.' }];
}
function talkQueen() {
  const K = kingdomNow(), opts = [];
  opts.push({ label: '¿Quién sois?', fn: () => talk([
    { who: 'queen', text: `Nací en ${K.zones[3].m[1].replace('La aldea de ', '')}, en ${lc(K.zones[3].name)}. Mi padre hacía tejas. Me casé con un rey porque bailaba fatal y me hizo reír.` },
    { who: 'queen', text: `Ahora ${K.zones[3].m[1].replace('La aldea de ', '')} está bajo el estandarte negro. Si pasas por allí, mira si sigue en pie la casa de las tejas rojas.` },
    { who: 'alec', text: 'Si sigue en pie, os lo diré.' },
  ], opts) });
  opts.push({ label: '¿Cómo está el reino?', fn: () => talk(queenNews(), opts) });
  opts.push({ label: '¿Qué pensáis de mí?', fn: () => talk([
    { who: 'queen', text: 'Que no haces esto por nosotros, y que no lo escondes. Lo prefiero a cien caballeros que juraban que sí.' },
    { who: 'queen', text: 'Y que algo te quitaron los dioses hace mucho. Tienes la misma mirada que el rey cuando mira el mapa.' },
    { who: 'alec', text: 'Me quitaron lo que tenía. No era mucho.' },
    { who: 'queen', text: 'Lo que uno tiene nunca es poco.' },
  ], opts) });
  opts.push({ label: 'Nada más', fn: () => {} });
  talk([{ who: 'queen', text: M.queenMet ? 'Alec. ¿Vienes a por noticias o a darlas?' : 'Así que el desconocido del tablón también habla con reinas. Siéntate, si quieres: el rey tardará.' }], opts);
  if (!M.queenMet) { M.queenMet = 1; save(); }
}

// La primera vez que usas la forja, la posada o el patio de armas, quien lo atiende te explica para qué sirve
const FIRST_TALK = {
  forge: [
    { who: 'smith', text: 'Así que tú eres el que se ha ofrecido. Déjame ver esos guanteletes.' },
    { who: 'smith', text: 'Hm. Buen metal, y mejor mano. Quien los hizo sabía lo que se hacía. ¿Cadenas? Nunca había visto unos que lanzaran cadenas.' },
    { who: 'alec', text: 'Los terminé yo. Los empezó otro.' },
    { who: 'smith', text: 'Tienen cinco partes: Palma, Dedos, Gema, Brazal y Brasa. Cada una cambia una cosa de cómo lanzas tus conjuros.' },
    { who: 'smith', text: 'En los encargos encontrarás piezas nuevas. Tráeme Hierro Místico y materiales y te las forjo. Una vez forjada, la pieza es tuya para siempre.' },
    { who: 'smith', text: 'Algunas piezas se llevan bien entre sí o con ciertas técnicas. Lo verás en la pestaña de Sinergias.' },
  ],
  inn: [
    { who: 'keeper', text: 'Bienvenido, forastero. Así que tú eres el que se ha ofrecido al rey. Tu habitación está arriba: la del fondo, que es la única sin goteras.' },
    { who: 'keeper', text: 'El rey paga la cama. La bebida, no. No me mires así: el rey es rey, no tonto.' },
    { who: 'keeper', text: 'Ahí cuelgo tus trofeos y apunto lo que llevas hecho. Lo tuyo se guarda solo: no tienes que hacer nada.' },
  ],
  gym: [
    { who: 'trainer', text: '¿Vienes a entrenar? Las almas que traes de los encargos se gastan aquí.' },
    { who: 'trainer', text: 'Te he visto pelear desde la muralla. Golpeas y te apartas. Mis reclutas lo llaman cobardía. Yo lo llamo seguir vivo.' },
    { who: 'trainer', text: 'Cada habilidad que aprendes te hace más fuerte para siempre: más vida, más daño, más esquives… Elige con cabeza.' },
  ],
};
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
  { cap: () => kingdomNow().zones[3].name, room: ['arena', 'boss', true], world: 4, amb: '#a08a96',
    setup(R) {
      R.cam.x = IC(23.5); R.cam.y = IC(12);
      R.add('god', kingdomNow().god, 27.5, 13.2, { flip: true, glow: '255,120,60' });
      R.add('alec', null, 12.5, 13.6, { hero: true, face: 0 });
    },
    beats: [
      { wait: 6.1, min: 5.5, who: 'alec', think: true, text: () => { const K = kingdomNow(), t = K.godTitle || 'un dios'; return `${TYPES[K.god].name}. ${t[0].toUpperCase() + t.slice(1)}. Medio reino rezaba para que no viniera.`; },
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
      { who: 'smith', text: () => { const n = KINGDOMS.filter(k => isDone(k.id + ':g')).length; return `Esos guanteletes han matado a ${['un dios', 'un dios', 'dos dioses', 'tres dioses', 'cuatro dioses', 'cinco dioses'][n] || n + ' dioses'}. Quien los forjó sabía lo que hacía.`; }, on(R) { R.a('alec').face = Math.PI; } },
      { who: 'alec', text: 'Lo sabía.' },
      { who: 'smith', text: '¿Era tu maestro?' },
      { who: 'alec', text: 'Era herrero. Me dio techo, trabajo y pocas palabras. Con eso le bastó.' },
      { who: 'keeper', text: 'Tu cama sigue donde estaba, mercenario. Y esta noche invita la casa.', on(R) { R.a('alec').face = 0; } },
      { who: 'keeper', text: 'Y no pongas esa cara. Por una vez en mucho tiempo, en esta ciudad se celebra algo.' },
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
const ZONE_SCENES = { valdehierro: [
  [throneScene(() => zoneFell(0), [
    { wait: 2.9, min: 0.8, who: 'king', text: '¿Ya de vuelta? ¿Qué ha pasado? Te di por muerto, o por huido, que aquí viene a ser lo mismo.' },
    { who: 'alec', text: () => `${kingdomNow().zones[0].name} están limpias. ${TYPES[zoneBoss(kingdomNow(), 0)].name} no volverá a levantarse.` },
    { who: 'king', text: '¿Cómo que…? ¿Tú solo? Mandé allí a una compañía entera y no volvió nadie.' },
    { who: 'queen', text: 'Es imposible. Nadie llega del camino, sin nombre ni escudo, y tumba al guardián de un dios en una semana.' },
    { who: 'alec', text: 'Pues alguien acaba de hacerlo.' },
    { who: 'king', text: () => `Que alguien suba a las almenas y mire hacia ${lc(kingdomNow().zones[0].name)}. ¡Ahora!` },
    { wait: 1.2, who: 'queen', text: 'Ya no sale humo de allí. Por primera vez en un año, ya no sale humo.' },
    { who: 'king', text: 'Muy bien, Alec. Uno. Quedan tres. No voy a mentirte: sigo pensando que la suerte se acaba.' },
    { who: 'alec', text: 'No ha sido suerte.' },
  ])],
  [throneScene(() => zoneFell(1), [
    { wait: 2.9, min: 0.8, who: 'king', text: () => `Me lo han contado los aldeanos de ${kingdomNow().zones[1].m[1].replace('La aldea de ', '')} antes que mis propios exploradores. ${TYPES[zoneBoss(kingdomNow(), 1)].name}, muerta.` },
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
    { who: 'alec', text: () => `Lo que llevaban dentro se fue cuando cayó ${lc(TYPES[zoneBoss(kingdomNow(), 2)].name)}.` },
    { who: 'king', text: () => `Tres de cuatro. ¿Sabes lo que significa? Si cae el último, ${lc(TYPES[kingdomNow().god].name)} tendrá que bajar de su trono de ceniza.` },
    { who: 'queen', text: 'Y entonces vendrá a por ti. A por todos nosotros.' },
    { who: 'alec', text: 'Que venga. Llevo esperándole desde que tenía nueve años.' },
    { who: 'king', text: 'He mandado forjar una corona de hierro para el día que caiga. Hasta ayer me parecía una locura.' },
    { who: 'queen', text: 'Hoy le he oído reírse. Hacía un año que no se reía.' },
  ])],
  [throneScene(() => zoneFell(3), [
    { wait: 2.9, min: 0.8, who: 'king', text: () => `${TYPES[zoneBoss(kingdomNow(), 3)].name} ha caído. Los cuatro, Alec. ¡Los cuatro!` },
    { who: 'queen', text: 'La gente canta tu nombre en la plaza. Un nombre que hace unas semanas no conocía nadie.' },
    { who: 'alec', text: 'Que no canten todavía. Queda él.' },
    { who: 'king', text: () => `${TYPES[kingdomNow().god].name} ya no tiene detrás de quién esconderse. Mis exploradores dicen que el cielo ${deN(kingdomNow().zones[3].name)} arde día y noche: te está esperando.` },
    { who: 'queen', text: 'No tienes por qué ir. Has hecho más de lo que nadie podía pedirte.' },
    { who: 'alec', text: 'Vine a matar a un dios. No me voy a ir con el trabajo a medias.' },
    { who: 'king', text: 'Entonces ve. Y vuelve. Este reino no tiene hierro suficiente para pagarte, pero encontraremos la forma.' },
  ])],
],
  // Torrealba: del «aquí dicen que tu dios era de los pequeños» a «nadie podrá decir eso de ti»
  torrealba: [
    [throneScene(() => zoneFell(0), [
      { wait: 2.9, min: 0.8, who: 'king', text: () => `${kingdomNow().zones[0].name}. Bien. Mis consejeros dicen que ${lc(TYPES[zoneBoss(kingdomNow(), 0)].name)} era la más débil de los cuatro.` },
      { who: 'alec', text: 'Vuestros consejeros no la han visto de cerca.' },
      { who: 'queen', text: 'Los salineros han vuelto a las eras. Mi padre trabajó en ellas hasta que… Da igual. Sigue.' },
      { who: 'king', text: 'Uno. Lo de Valdehierro también empezó con uno, supongo.' },
      { who: 'alec', text: 'Y acabó con un dios menos.' },
    ])],
    [throneScene(() => zoneFell(1), [
      { wait: 2.9, min: 0.8, who: 'king', text: () => `${TYPES[zoneBoss(kingdomNow(), 1)].name}. He visto a ese monstruo colgar a cien hombres en una tarde. Y tú vuelves andando.` },
      { who: 'alec', text: 'Con rasguños. Pero vuelvo.' },
      { who: 'queen', text: 'En el mercado ya no dicen que lo de Valdehierro fuera suerte. Ahora dicen que eres otro dios.' },
      { who: 'alec', text: 'Los dioses no sangran tan a menudo.' },
      { who: 'king', text: 'Empiezo a pensar que los cuentos se quedaban cortos.' },
    ])],
    [throneScene(() => zoneFell(2), [
      { wait: 2.9, min: 0.8, who: 'queen', text: () => `${TYPES[zoneBoss(kingdomNow(), 2)].name} ha caído. Era el que leía las sentencias. Nadie en este reino le había visto nunca la cara.` },
      { who: 'alec', text: 'No tenía. Debajo del yelmo solo había polvo.' },
      { who: 'king', text: 'Tres. El Juez ya sabe tu nombre, Alec. Esta noche el cielo del tribunal se ha puesto rojo.' },
      { who: 'alec', text: 'Bien. Que sepa a quién va a juzgar.' },
    ])],
    [throneScene(() => zoneFell(3), [
      { wait: 2.9, min: 0.8, who: 'king', text: () => `${TYPES[zoneBoss(kingdomNow(), 3)].name}. Los cuatro. Hace dos lunas me reía del que decía que esto se podía hacer.` },
      { who: 'queen', text: 'El reino entero está mirando al tribunal. Nadie duerme.' },
      { who: 'alec', text: 'Que miren. Voy a bajar a por él.' },
      { who: 'king', text: 'Cuando cayó el Primer Puño, dijeron que era un dios pequeño. Cuando caiga el Juez, nadie podrá volver a decir eso de ti.' },
    ])],
  ],
};
// La llegada a cada reino nuevo: el camino, la plaza y el rey. Alec ya no es un desconocido, pero aquí no le toman en serio
const ARRIVAL = {
  torrealba: [
    { cap: 'El camino', room: ['intro_camino', 'intro_camino'], amb: '#b8c4d6',
      setup(R) { const a = R.add('alec', null, 2, 10.9, { hero: true, face: 0 }); R.follow = a; R.followOff = [IC(5), -IC(1)]; R.cam.x = a.x + IC(5); R.cam.y = a.y - IC(1); R.go(a, [[22, 10.9]], 50); },
      beats: [
        { wait: 1.2, who: 'alec', think: true, text: 'Valdehierro quedó atrás. Allí ya saben mi nombre. Más allá de las montañas, no tanto.' },
        { who: 'alec', think: true, text: 'Las noticias viajan despacio por los pasos de montaña, y llegan torcidas. En una venta decían que maté a un dios con las manos desnudas. En otra, que el dios se cayó solo.' },
        { who: 'alec', think: true, text: 'Torrealba es otra cosa. Su dios no pide soldados: juzga. Y en este reino nadie ha ganado nunca un juicio.' },
      ] },
    { cap: () => kingdomNow().title, room: ['plaza', 'plaza'], amb: null,
      setup(R) {
        const cx = NAV.cols >> 1; introPlazaFolk(R);
        const a = R.add('alec', null, cx, 33, { hero: true, face: -Math.PI / 2 }); R.follow = a; R.followOff = [0, -IC(2.5)]; R.cam.x = a.x; R.cam.y = a.y - IC(2.5);
        R.go(a, [[cx, 19.3]], 60, q => { q.face = 0; });
        const gd = R.actors.find(q => q.key === 'guard' && q.x > a.x && q.y < IC(10)) || R.add(null, 'guard', cx + 3.2, 7.4); gd.id = 'guardia'; gd.amb = false;
      },
      tick(R, dt) { introPlazaStroll(R, dt); },
      beats: [
        { wait: 1.2, who: 'alec', think: true, text: 'Una ciudad de piedra gris. La gente camina mirando al suelo, como si el suelo pudiera denunciarles.',
          ev: [[1.7, R => { const cx = NAV.cols >> 1; R.go('guardia', [[cx + 2.6, 9.2], [cx + 2.6, 18.4], [cx + 1.9, 19.2]], 66, q => { q.flip = true; }); }]] },
        { wait: 0.5, who: 'guardia', text: 'Alto. Esos guanteletes… ¿Eres Alec? ¿El de Valdehierro?' },
        { who: 'alec', text: 'El mismo.' },
        { who: 'guardia', text: 'Aquí dicen que lo de Valdehierro fue suerte. Que su dios era de los pequeños.' },
        { who: 'alec', text: 'Que lo digan. Vengo a ver al rey.' },
        { who: 'guardia', text: 'Te está esperando. Más por curiosidad que por fe, te lo advierto.' },
      ] },
    { cap: 'El salón del trono', room: ['hall', 'hall'], amb: '#b9c0cc',
      setup(R) {
        const cx = NAV.cols >> 1;
        for (const n of R.room.out.npcs) R.add(n.key === 'king' || n.key === 'queen' ? n.key : null, n.key, n.x, n.y, { flip: !!n.flip, amb: true });
        R.go(R.add('alec', null, cx, NAV.rows - 2.6, { hero: true, face: -Math.PI / 2 }), [[cx, 9.8]], 62, a => { a.face = -Math.PI / 2; });
      },
      beats: [
        { wait: 2.9, min: 0.8, who: 'king', text: 'El mercenario de Valdehierro. He oído tu historia. Tres veces, y las tres distinta.' },
        { who: 'alec', text: 'La verdadera es la más corta: había un dios, y ya no lo hay.' },
        { who: 'king', text: 'El Primer Puño era un dios de la guerra en un reino de pastores. El nuestro es otra cosa. Escucha.' },
        ...KSTORY.torrealba(),
        { who: 'queen', text: 'Te pagaremos si vuelves. No antes. Aquí ya hemos pagado demasiado por adelantado.' },
        { who: 'alec', text: 'Me basta.' },
        { who: 'king', text: 'Demuéstrame que lo de Valdehierro no fue suerte. Los encargos están en el tablón de la plaza.' },
      ] },
  ],
};
// Viajar a otro reino: la primera vez, su llegada; después, directo a su ciudad
function travelTo(i) {
  M.kingdom = i; M.run = null; save();
  const K = KINGDOMS[i];
  if (ARRIVAL[K.id] && !M['seenArrival_' + K.id]) playScenes(ARRIVAL[K.id], 'seenArrival_' + K.id); else openTown();
}
function playZone(z) { const L = ZONE_SCENES[kingdomNow().id]; if (L && L[z]) playScenes(L[z], kflag('seenZone' + z), 'hall'); else openTown('hall'); }
// La escena de una zona se debe la primera vez que cae su guardián
const zoneDue = () => !!S && S.mode === 'win' && !!S.mission && S.mission.type === 'boss' && (ZONE_SCENES[kingdomNow().id] || [])[S.mission.z] && !M[kflag('seenZone' + S.mission.z)];

// ── Poner en marcha, pasar de escena y acabar ──
let introHudOn = false, introTap = false, INTRO_LM = null;
// El motor reproduce una lista de escenas: la del principio (INTRO) o el final de un reino (ENDING). «seen» es la marca que deja en el guardado.
function playScenes(L, seen, after) {
  newGame(); S.gun = Object.assign({}, M.gun);
  S.mode = 'intro'; modeT = 0; S.intro = { L, seen, after, i: 0, b: 0, bt: 0, evi: 0, phase: 'wait', txt: '', R: null };
  introTap = false; renderOverlay(); introScene(0); sfx('ok', 0.3,0.7);
}
function playIntro() { playScenes(INTRO, 'seenIntro'); }
function playEnding() { playScenes(ENDING, kflag('seenEnding')); }
// El final se debe la primera vez que cae el dios del reino (o, en guardados de antes de que existiera, la próxima vez que caiga)
const endingDue = () => !!S && S.mode === 'win' && !!S.mission && S.mission.type === 'god' && !M[kflag('seenEnding')];
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
// ───────────────────────── El mapa del reino (tablón de encargos) ─────────────────────────
// En el tablón no hay una lista: hay un mapa dibujado del reino. Cada territorio se tiñe del color del guardián que lo tiene
// tomado y, cuando cae, pasa al color del reino. Los encargos son marcadores (.fi) puestos sobre el mapa: la navegación
// con mando de listInput/navPick ya es espacial, así que se mueven solos. Al lado, un panel cuenta el encargo señalado.
// Todo lo que cambia de un reino a otro (forma, biomas, caminos y dónde va cada cosa) sale de KMAPS; las medidas van en casillas de 16 px.
const KMAPS = {
  valdehierro: {
    cols: 28, rows: 16, free: '#f2c14e', capital: 'meadow', biomes: ['crypt', 'forest', 'peaks', 'ash'],
    // ~ mar · c capital · 0-3 territorio de esa zona
    land: [
      '~~~~~~0000000022222222222222',
      '~~~0000000000022222222222222',
      '~~00000000000022222222222222',
      '~000000000000022222222222222',
      '~00000000000cccc222222222222',
      '~0000000000ccccccc2222222222',
      '~~00000000ccccccccc222222222',
      '~~~000000cccccccccc222222222',
      '~~~111111cccccccccc333333333',
      '~~11111111ccccccccc333333333',
      '~1111111111ccccccc3333333333',
      '~11111111111ccccc33333333333',
      '~11111111111c~~c333333333333',
      '~~1111111111~~~~33333333333~',
      '~~~~11111111~~~~~333333333~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    castle: [13.4, 8.9], label: [13.4, 4.7], god: [17.4, 8.7],
    // Por zona: dónde va el rótulo, los tres encargos (incursión, defensa, asalto) y la guarida del guardián.
    // Los cuatro de cada zona van en dos filas y dos columnas (más o menos): así la cruceta se mueve entre ellos sin sorpresas.
    zones: [
      { label: [6.3, 0.8],   m: [[4.6, 7.6], [10.2, 4.4], [9.2, 6.8]],     boss: [3.8, 5.6] },
      { label: [7.6, 14.5],  m: [[8.2, 10.5], [3.8, 10.1], [8.8, 12.9]],   boss: [3.6, 13.5] },
      { label: [21.6, 0.8],  m: [[23.2, 7.5], [18.0, 4.4], [19.1, 6.8]],   boss: [23.8, 5.3] },
      { label: [21.6, 14.5], m: [[19.8, 10.5], [24.4, 10.1], [19.4, 12.9]], boss: [24.6, 13.3] },
    ],
    river: [[15.0, -0.5], [15.2, 1.6], [15.9, 3.4], [16.4, 5.0], [16.3, 6.6], [16.0, 8.2], [15.6, 9.8], [14.6, 11.2], [14.0, 12.6]],
    roads: [
      [[13.4, 9.1], [13.3, 10.6], [13.1, 11.8]],
      [[13.0, 9.2], [11.0, 9.6], [9.4, 10.4], [8.2, 10.6]], [[8.2, 10.6], [6.0, 10.6], [3.8, 10.2]], [[8.2, 10.6], [8.6, 11.8], [8.8, 13.0]], [[8.8, 13.0], [6.4, 13.7], [3.6, 13.6]],
      [[12.4, 8.5], [10.8, 7.4], [9.2, 6.9]], [[9.2, 6.9], [9.9, 5.6], [10.2, 4.5]], [[9.2, 6.9], [6.8, 7.4], [4.6, 7.7]], [[9.2, 6.9], [6.6, 6.0], [3.8, 5.7]],
      [[14.4, 8.6], [16.2, 7.6], [17.8, 7.0], [19.1, 6.9]], [[19.1, 6.9], [18.3, 5.6], [18.0, 4.5]], [[19.1, 6.9], [21.2, 7.3], [23.2, 7.6]], [[19.1, 6.9], [21.4, 5.8], [23.8, 5.4]],
      [[13.8, 9.2], [15.8, 9.3], [17.4, 8.8]], [[17.4, 8.8], [18.6, 9.8], [19.8, 10.6]], [[19.8, 10.6], [22.2, 10.6], [24.4, 10.2]], [[19.8, 10.6], [19.4, 11.8], [19.4, 13.0]], [[19.4, 13.0], [22.0, 13.4], [24.6, 13.4]],
    ],
    // Decorado suelto de la capital
    props: [['houses', 10.5, 8.6, 2], ['houses', 11.6, 6.9, 2], ['houses', 12.0, 10.6, 2], ['houses', 15.0, 10.8, 1], ['houses', 14.6, 6.4, 1],
      ['field', 11.2, 5.4, 2, 1], ['field', 16.6, 10.4, 1, 1], ['field', 10.0, 7.5, 1, 1], ['pier', 13.1, 12.0], ['boat', 13.9, 13.3], ['boat', 12.9, 14.4, 1]],
  },
};

// Torrealba: el mismo trazado que Valdehierro visto en un espejo (la costa al otro lado), con sus propios suelos y colores
KMAPS.torrealba = (() => {
  const V = KMAPS.valdehierro, c = V.cols, fx = ([x, y, ...r]) => [c - x, y, ...r];
  return Object.assign({}, V, {
    free: '#9fd3ff', biomes: ['peaks', 'forest', 'crypt', 'ash'],
    land: V.land.map(row => row.split('').reverse().join('')),
    castle: fx(V.castle), label: fx(V.label), god: fx(V.god),
    zones: V.zones.map(z => ({ label: fx(z.label), m: z.m.map(fx), boss: fx(z.boss) })),
    river: V.river.map(fx), roads: V.roads.map(r => r.map(fx)),
    props: V.props.map(([k, x, y, ...r]) => [k, c - x, y, ...r]),
  });
})();
// ── Lo que sabe pintar el mapa: suelos (una baldosa de biomes.png, a veces teñida), recortes de las hojas y dibujos propios ──
const KM_GROUND = {
  water:  { tile: [64, 32], mul: '#8ab0e2' },
  meadow: { tile: [16, 16] },
  forest: { tile: [16, 16], mul: '#86a878' },
  crypt:  { tile: [16, 592], mul: '#b9b2cc', hue: ['#6f6884', 0.62] },
  peaks:  { tile: [16, 384] },
  ash:    { tile: [16, 192], mul: '#7c5c60', hue: ['#5c4650', 0.5] },
};
// [hoja (b: biomes.png, r: ruins.png), x, y, ancho, alto]
const KM_SPR = {
  sap: ['b', 305, 112, 14, 16], tree: ['b', 272, 37, 16, 22], bush: ['b', 288, 34, 16, 12], oak: ['b', 243, 100, 24, 26], oak2: ['b', 276, 102, 22, 24], pine: ['b', 246, 65, 20, 31], fir: ['b', 292, 67, 24, 29],
  pineS: ['r', 209, 13, 14, 19], pineM: ['r', 177, 5, 14, 27], pineT: ['r', 193, 6, 14, 26], pineD: ['r', 160, 1, 16, 31], round: ['r', 227, 2, 26, 30], shroom: ['r', 224, 129, 16, 13], shroom2: ['r', 224, 114, 16, 12],
  stump: ['b', 164, 327, 23, 21], deadbush: ['b', 161, 242, 15, 13], deadbush2: ['b', 177, 242, 14, 13], skull: ['b', 161, 225, 15, 13], twigs: ['b', 145, 496, 16, 15], deadtree: ['b', 116, 304, 44, 48], pillar: ['b', 384, 595, 16, 29], statue: ['b', 294, 636, 20, 35],
  mount: ['b', 113, 370, 30, 28], mount2: ['b', 112, 408, 27, 23], mount3: ['b', 145, 409, 29, 21], snowrock: ['b', 148, 381, 26, 18], snowpine: ['b', 230, 417, 20, 31], snowpine2: ['b', 256, 417, 16, 31], snowfir: ['b', 112, 443, 16, 21], snowbush: ['b', 176, 385, 16, 13],
  darkrock: ['b', 160, 530, 31, 28], slab: ['b', 116, 522, 44, 21], spike: ['b', 193, 530, 13, 27], pebble: ['b', 113, 545, 29, 13], pebble2: ['b', 145, 545, 15, 14],
  cry1: ['r', 209, 145, 15, 15], cry2: ['r', 227, 145, 12, 15], cry3: ['r', 241, 145, 15, 15], cry4: ['r', 194, 144, 12, 16], spire: ['r', 306, 196, 29, 43],
  temple: ['r', 336, 192, 48, 48], portal: ['r', 273, 241, 30, 30], arch: ['r', 160, 239, 32, 33], tower: ['r', 161, 146, 29, 29], well: ['b', 339, 69, 26, 19], bigtree: ['b', 274, 513, 45, 46], boat: ['b', 372, 70, 24, 21], boat2: ['b', 404, 71, 23, 20],
};
// Qué crece en cada suelo: n es cuánto hay por casilla; los nombres repetidos salen más
const KM_SCATTER = {
  meadow: { n: 0.13, s: ['sap', 'tree', 'bush', 'bush', 'sap', 'oak2'] },
  forest: { n: 2.1, s: ['pineS', 'pineM', 'pineT', 'tree', 'sap', 'pineS', 'pineM', 'oak2', 'pine', 'round', 'pineD', 'shroom', 'bush'] },
  crypt:  { n: 0.95, s: ['tomb', 'tomb', 'cross', 'cross', 'tomb', 'deadbush', 'deadbush2', 'stump', 'pillar', 'skull', 'pineD', 'statue'] },
  peaks:  { n: 0.6,  s: ['mount', 'mount2', 'mount3', 'mount', 'snowrock', 'snowpine', 'snowpine2', 'snowfir', 'snowfir', 'snowbush', 'cry2'] },
  ash:    { n: 1.0,  s: ['darkrock', 'spike', 'pebble', 'pebble2', 'twigs', 'stump', 'deadbush', 'lava', 'lava', 'crack', 'crack', 'lava', 'spike', 'deadtree', 'slab', 'crack'] },
};
// Lo que hay en cada sitio con encargo: la entrada de la incursión y la guarida del guardián dependen del bioma.
// up: a qué altura sobre la base se clava el marcador, en píxeles del mapa
const KM_SITE = {
  village: { up: 13 }, camp: { up: 13 }, siege: { up: 19 },
  gate: { crypt: ['tower', 24], forest: ['cave', 19], peaks: ['well', 15], ash: ['arch', 26] },
  lair: { crypt: ['temple', 33], forest: ['bigtree', 34], peaks: ['mine', 27], ash: ['portal', 25] },
};
const KM_KIND = ['gate', 'village', 'camp'];   // en el mismo orden que MKINDS
const kmSiteOf = (kind, biome) => (KM_SITE[kind].up ? { draw: kind, up: KM_SITE[kind].up } : { draw: KM_SITE[kind][biome][0], up: KM_SITE[kind][biome][1] });
const kmBoss = (K, z) => TYPES[zoneBoss(K, z)];
const kmFree = (K, z) => isDone(`${K.id}:${z}:b`);
const kmHash = (x, y, k = 0) => { let h = (Math.round(x) * 374761393 + Math.round(y) * 668265263 + k * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const kmNoise = (t, k) => { const i = Math.floor(t), f = t - i, a = kmHash(i, k, 91), b = kmHash(i + 1, k, 91); return a + (b - a) * f * f * (3 - 2 * f); };
// Una línea de puntos (en casillas) hecha curva: una muestra por píxel más o menos
function kmCurve(pts) {
  const out = [], P = i => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), n = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 16);
    for (let k = 0; k <= n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(a => 8 * (2 * p1[a] + (p2[a] - p0[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * t3))); }
  }
  return out;
}

// ── Dibujos propios, a píxel, con la paleta de los paquetes ──
const kmPx = (g, X, Y) => (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(X) + x, Math.round(Y) + y, w, h); };
const KM_DRAW = {
  house(g, X, Y, v = 0) {
    const px = kmPx(g, X, Y), R = [['#b5503c', '#8a3a2e'], ['#3f9e86', '#2c7564'], ['#9a6a3e', '#75502e']][v % 3];
    px(-5, 0, 11, 1, 'rgba(0,0,0,.28)'); px(-5, -6, 10, 6, '#2a1a18'); px(-4, -5, 8, 5, '#e6d9bc'); px(-4, -1, 8, 1, '#b9a98a'); px(-1, -3, 2, 3, '#5b3a2a'); px(2, -4, 1, 2, '#6fb0c8');
    for (let i = 0; i < 5; i++) { px(-6 + i, -7 - i, 12 - 2 * i, 1, '#2a1a18'); px(-5 + i, -7 - i, 10 - 2 * i, 1, i % 2 ? R[0] : R[1]); }
  },
  village(g, X, Y, v = 0) { KM_DRAW.house(g, X - 8, Y - 3, v + 1); KM_DRAW.house(g, X + 8, Y - 2, v + 2); KM_DRAW.house(g, X, Y + 3, v); },
  houses(g, X, Y, n = 2) { for (let i = 0; i < n; i++) KM_DRAW.house(g, X + (i - (n - 1) / 2) * 12, Y + (i % 2 ? -4 : 0), i + 1); },
  tent(g, X, Y, c1 = '#c9b189', c2 = '#8f7a55') {
    const px = kmPx(g, X, Y);
    px(-6, 0, 13, 1, 'rgba(0,0,0,.28)');
    for (let i = 0; i < 7; i++) { px(-6 + i, -1 - i, 13 - 2 * i, 1, '#2a1a18'); if (i < 6) { px(-5 + i, -1 - i, 11 - 2 * i, 1, c1); px(1, -1 - i, 5 - i, 1, c2); } }
    px(-1, -4, 2, 4, '#2a1a18');
  },
  banner(g, X, Y, col, tall = 12) { const px = kmPx(g, X, Y); px(0, -tall, 1, tall, '#2a1a18'); px(1, -tall, 6, 5, '#2a1a18'); px(1, -tall + 1, 5, 3, col); px(1, -tall + 4, 2, 1, col); px(5, -tall + 4, 1, 1, col); },
  camp(g, X, Y) { KM_DRAW.tent(g, X - 7, Y - 2); KM_DRAW.tent(g, X + 7, Y); kmPx(g, X, Y)(-1, 3, 3, 2, '#ff8a3c'); kmPx(g, X, Y)(0, 2, 1, 1, '#ffe08a'); KM_DRAW.banner(g, X, Y - 3, '#c0392b', 13); },
  siege(g, X, Y) { KM_DRAW.tent(g, X - 10, Y, '#7a3a34', '#532622'); KM_DRAW.tent(g, X + 10, Y, '#7a3a34', '#532622'); const px = kmPx(g, X, Y);
    for (let i = 0; i < 10; i++) { px(-9 + i, -2 - i, 19 - 2 * i, 1, '#1c1216'); if (i < 9) { px(-8 + i, -2 - i, 17 - 2 * i, 1, '#9c4a3a'); px(1, -2 - i, 8 - i, 1, '#6a2f2a'); } }
    px(-2, -6, 4, 5, '#1c1216'); px(-9, -1, 19, 1, '#1c1216'); KM_DRAW.banner(g, X, Y - 9, TYPES.firstfist.color, 12); },
  field(g, X, Y, w = 2, h = 1) { const px = kmPx(g, X, Y), W = w * 16, H = h * 16 - 4; px(-1, -1, W + 2, H + 2, '#5b4a2a'); for (let y = 0; y < H; y++) px(0, y, W, 1, y % 3 === 2 ? '#8a7a34' : y % 3 ? '#d9c14e' : '#c2a93e'); },
  pier(g, X, Y) { const px = kmPx(g, X, Y); px(-3, 0, 7, 22, '#3a241c'); for (let y = 0; y < 22; y++) px(-2, y, 5, 1, y % 3 ? '#a67c52' : '#7a5638'); px(-4, 6, 1, 3, '#3a241c'); px(4, 14, 1, 3, '#3a241c'); },
  tomb(g, X, Y, v = 0) { const px = kmPx(g, X, Y); px(-2, 0, 6, 1, 'rgba(0,0,0,.3)'); px(-2, -6, 5, 6, '#2c2a36'); px(-1, -5, 3, 5, '#8f8ea0'); px(-1, -5, 1, 4, '#b4b3c4'); px(-1, -6, 3, 1, v % 2 ? '#2c2a36' : '#8f8ea0'); },
  cross(g, X, Y) { const px = kmPx(g, X, Y); px(-1, 0, 4, 1, 'rgba(0,0,0,.3)'); px(-1, -8, 3, 8, '#2c2a36'); px(-3, -6, 7, 3, '#2c2a36'); px(0, -7, 1, 7, '#a9a8ba'); px(-2, -5, 5, 1, '#a9a8ba'); },
  lava(g, X, Y, v = 0) { const px = kmPx(g, X, Y), w = 7 + (v % 3) * 2; px(-w / 2 | 0, -3, w, 5, '#2a1418'); px((-w / 2 | 0) + 1, -4, w - 2, 7, '#2a1418'); px((-w / 2 | 0) + 1, -3, w - 2, 5, '#d8434f'); px((-w / 2 | 0) + 2, -2, w - 4, 3, '#ff8a3c'); px(0, -1, 2, 1, '#ffe08a'); },
  crack(g, X, Y, v = 0) { const px = kmPx(g, X, Y); let y = 0; for (let i = -6; i < 7; i++) { y += ((v + i * 7) % 3) - 1; y = clamp(y, -2, 2); px(i, y - 1, 1, 3, '#2a1418'); px(i, y, 1, 1, i % 4 === 0 ? '#ffe08a' : '#ff8a3c'); } },
  cave(g, X, Y, v, D) { D.spr('darkrock', X, Y + 2); const px = kmPx(g, X, Y); px(-5, -8, 10, 9, '#0d0a10'); px(-4, -10, 8, 2, '#0d0a10'); px(-2, -11, 4, 1, '#0d0a10'); for (let i = 0; i < 4; i++) { px(-5 + i, -8 + i, 1, 1, '#f4f0ff'); px(4 - i, -9 + i, 1, 1, '#f4f0ff'); } px(0, -11, 1, 6, '#cfc8e0'); px(-1, -5, 3, 2, '#f4f0ff'); },
  mine(g, X, Y, v, D) { D.spr('mount', X - 13, Y - 3); D.spr('mount', X + 13, Y - 4); D.spr('mount2', X, Y); const px = kmPx(g, X, Y);
    px(-6, -13, 12, 13, '#3a241c'); px(-5, -12, 10, 12, '#a67c52'); px(-4, -10, 8, 10, '#0d0a10'); px(-5, -12, 10, 1, '#c99a66'); px(-8, 0, 16, 1, '#3a241c'); px(-7, 1, 14, 1, '#7a5638');
    D.spr('cry1', X - 16, Y + 4); D.spr('cry3', X + 17, Y + 4); D.spr('cry4', X + 8, Y + 5); },
  bigtree(g, X, Y, v, D) { D.spr('bigtree', X, Y + 3); const px = kmPx(g, X, Y); for (const [x, y] of [[-12, -1], [-7, 2], [11, 0], [15, 3], [6, 3]]) { px(x - 1, y - 3, 4, 4, '#2a2a22'); px(x, y - 3, 2, 3, '#e8e4d4'); px(x, y - 3, 1, 1, '#ffffff'); } },
  temple(g, X, Y, v, D) { D.spr('temple', X, Y + 2); },
  portal(g, X, Y, v, D) { D.spr('spike', X - 18, Y + 1); D.spr('spike', X + 19, Y); const px = kmPx(g, X, Y); px(-7, -22, 14, 16, '#5a2a6a'); px(-5, -20, 10, 12, '#b68cff'); px(-2, -17, 4, 6, '#f0e4ff'); D.spr('portal', X, Y + 2); },
  castle(g, X, Y, col) {
    const px = kmPx(g, X, Y), O = '#2a2226', S1 = '#c4bead', S2 = '#9c9686', S3 = '#746f63', R1 = '#5a7fa8', R2 = '#3f5f86';
    const roof = (x, y, w) => { for (let i = 0; i * 2 < w; i++) { px(x - 1 + i, y - i, w + 2 - 2 * i, 1, O); if (w - 2 * i > 0) px(x + i, y - i, w - 2 * i, 1, i % 2 ? R1 : R2); } };
    const flag = (x, y) => { px(x, y - 9, 1, 9, O); px(x + 1, y - 9, 6, 5, O); px(x + 1, y - 8, 5, 3, col); };
    px(-25, 0, 50, 2, 'rgba(0,0,0,.28)');
    px(-21, -17, 42, 17, O); px(-20, -16, 40, 16, S2); px(-20, -16, 40, 2, S1); px(-20, -4, 40, 4, S3);                  // muralla
    for (let x = -19; x < 19; x += 6) { px(x - 1, -20, 5, 4, O); px(x, -19, 3, 3, S1); }
    for (let x = -16; x < 18; x += 8) px(x, -11, 1, 3, O);
    px(-10, -34, 20, 20, O); px(-9, -33, 18, 19, S2); px(-9, -33, 18, 2, S1); px(5, -31, 4, 17, S3);                       // torre del homenaje
    px(-5, -28, 2, 4, O); px(3, -28, 2, 4, O); px(-1, -28, 2, 4, '#f2c14e'); roof(-11, -35, 22); flag(0, -45);
    for (const x of [-27, 17]) { px(x, -28, 10, 28, O); px(x + 1, -27, 8, 27, S2); px(x + 1, -27, 2, 27, S1); px(x + 7, -27, 2, 27, S3); px(x + 4, -20, 2, 4, O); px(x + 4, -10, 2, 4, O); roof(x - 1, -29, 12); flag(x + 5, -34); }   // torres
    px(-5, -11, 10, 11, O); px(-4, -12, 8, 1, O); px(-4, -10, 8, 10, '#6e4530'); px(-4, -10, 8, 2, '#3a241c'); px(0, -10, 1, 10, '#3a241c'); px(-4, -5, 8, 1, '#3a241c');   // portón
  },
};

// ── El mapa base de un reino: se pinta una vez (cuando ya han cargado las hojas) y se guarda. Devuelve también la silueta y el borde de cada territorio. ──
const KM_CACHE = {}, KM_RING = [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]];
function kmBase(K) {
  if (KM_CACHE[K.id]) return KM_CACHE[K.id];
  const D = KMAPS[K.id], bi = IMG.biome, ru = IMG.ruins;
  if (!D || !bi || !ru) return null;
  const C = D.cols, R = D.rows, W = C * 16, H = R * 16;
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  const [base, g] = mk(), [land, L] = mk();
  const reg = (x, y) => D.land[clamp(y, 0, R - 1)][clamp(x, 0, C - 1)];
  const ground = r => (r === '~' ? 'water' : r === 'c' ? D.capital : D.biomes[+r]);
  // Suelos: una baldosa por tipo, repetida como patrón, para poder rellenar cualquier rectángulo sin que se note la rejilla al morder los bordes
  const pat = {};
  for (const k in KM_GROUND) { const G0 = KM_GROUND[k], [tc, tg] = mk(16, 16); tg.drawImage(bi, G0.tile[0], G0.tile[1], 16, 16, 0, 0, 16, 16); if (G0.mul) { tg.globalCompositeOperation = 'multiply'; tg.fillStyle = G0.mul; tg.fillRect(0, 0, 16, 16); } if (G0.hue) { tg.globalCompositeOperation = 'color'; tg.globalAlpha = G0.hue[1]; tg.fillStyle = G0.hue[0]; tg.fillRect(0, 0, 16, 16); } pat[k] = g.createPattern(tc, 'repeat'); }
  const masks = {}; for (const r of ['c', ...D.zones.map((_, z) => '' + z)]) masks[r] = mk();
  const paint = (r, x, y, w, h) => { if (w <= 0 || h <= 0) return; L.fillStyle = pat[ground(r)]; L.fillRect(x, y, w, h); for (const k in masks) { const m = masks[k][1]; if (k === r) { m.fillStyle = '#000'; m.fillRect(x, y, w, h); } else m.clearRect(x, y, w, h); } };
  const erase = (x, y, w, h) => { if (w <= 0 || h <= 0) return; L.clearRect(x, y, w, h); for (const k in masks) masks[k][1].clearRect(x, y, w, h); };
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) if (reg(x, y) !== '~') paint(reg(x, y), x * 16, y * 16, 16, 16);
  // Bordes irregulares: el mar muerde la costa y cada suelo se mete un poco en el del vecino
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const a = reg(x, y);
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (x + dx >= C || y + dy >= R) continue;
      const b = reg(x + dx, y + dy); if (a === b) continue;
      for (let i = 0; i < 16; i += 2) {
        const X = dx ? (x + 1) * 16 : x * 16 + i, Y = dx ? y * 16 + i : (y + 1) * 16, n = kmNoise((dx ? Y : X) / 5, dx ? X : Y + 7);
        if (a === '~' || b === '~') { const d = 1 + Math.floor(n * 3.4); if (a === '~') erase(X, Y, dx ? d : 2, dx ? 2 : d); else erase(dx ? X - d : X, dx ? Y : Y - d, dx ? d : 2, dx ? 2 : d); }
        else { const d = Math.round((n - 0.5) * 9); if (d > 0) paint(b, dx ? X - d : X, dx ? Y : Y - d, dx ? d : 2, dx ? 2 : d); else if (d < 0) paint(a, X, Y, dx ? -d : 2, dx ? 2 : -d); }
      }
    }
    if (a !== '~') for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) if (reg(x + sx, y) === '~' && reg(x, y + sy) === '~' && x + sx >= 0 && x + sx < C && y + sy >= 0 && y + sy < R)
      for (let i = 0; i < 4; i++) erase(sx < 0 ? x * 16 : x * 16 + 16 - (6 - i * 2 + (i === 3 ? 1 : 0)), sy < 0 ? y * 16 + i * 2 - 1 : y * 16 + 15 - i * 2, 6 - i * 2 + (i === 3 ? 1 : 0), 2);
  }
  // Mar, espuma alrededor de la tierra, un escalón oscuro al sur y, encima, la tierra
  g.fillStyle = pat.water; g.fillRect(0, 0, W, H);
  const [sil, sg] = mk(), shade = col => { sg.globalCompositeOperation = 'copy'; sg.drawImage(land, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = col; sg.fillRect(0, 0, W, H); };
  shade('#e9f8f6'); g.globalAlpha = 0.5; for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 5], [-2, 3], [2, 3]]) g.drawImage(sil, ox, oy);
  g.globalAlpha = 1; for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 4], [-1, 3], [1, 3]]) g.drawImage(sil, ox, oy);
  shade('#3a2c2a'); g.drawImage(sil, 0, 3); shade('#6b4f3f'); g.drawImage(sil, 0, 1);
  g.drawImage(land, 0, 0);
  // Río y caminos; donde un camino cruza el río, un puente de tablas
  const river = D.river ? kmCurve(D.river) : [], roads = (D.roads || []).map(kmCurve);
  const rw = i => 4 + Math.round(2.4 * i / Math.max(1, river.length));
  const onLand = (x, y) => reg(Math.floor(x / 16), Math.floor(y / 16)) !== '~';
  river.forEach(([x, y], i) => { const w = rw(i); if (onLand(x, y)) { g.fillStyle = 'rgba(28,40,58,.6)'; g.fillRect(Math.round(x - w / 2) - 1, Math.round(y - w / 2) - 1, w + 2, w + 2); } });
  river.forEach(([x, y], i) => { const w = rw(i); g.fillStyle = pat.water; g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); });
  river.forEach(([x, y], i) => { if (i % 11 === 5) { g.fillStyle = 'rgba(240,252,252,.75)'; g.fillRect(Math.round(x) - 1, Math.round(y), 2, 1); } });
  const nearRiver = (x, y, d) => river.some(p => Math.abs(p[0] - x) < d && Math.abs(p[1] - y) < d);
  for (const rd of roads) rd.forEach(([x, y]) => { g.fillStyle = 'rgba(58,38,26,.5)'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 4); });
  for (const rd of roads) rd.forEach(([x, y], i) => { g.fillStyle = kmHash(x, y, 5) < 0.3 ? '#c9a878' : '#dcc08e'; g.fillRect(Math.round(x) - 1, Math.round(y), 2, 2); });
  for (const rd of roads) rd.forEach(([x, y], i) => { if (!nearRiver(x, y, 4)) return; g.fillStyle = '#3a241c'; g.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 6); });
  for (const rd of roads) rd.forEach(([x, y], i) => { if (!nearRiver(x, y, 4)) return; g.fillStyle = i % 3 ? '#b58a5c' : '#8a6240'; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 4, 4); });
  // Decorado: todo lo que se levanta del suelo se apunta con su línea de base y se pinta de arriba abajo
  const items = [], T = { g, spr: null };
  T.spr = (k, cx, by) => { const s = KM_SPR[k]; g.drawImage(s[0] === 'b' ? bi : ru, s[1], s[2], s[3], s[4], Math.round(cx - s[3] / 2), Math.round(by - s[4]), s[3], s[4]); };
  const put = (k, cx, by, v) => items.push({ by, fn: () => (KM_DRAW[k] ? KM_DRAW[k](g, cx, by, v, T) : T.spr(k, cx, by)) });
  const sites = [];
  D.zones.forEach((Z, z) => { Z.m.forEach((p, i) => sites.push({ p, s: kmSiteOf(KM_KIND[i], D.biomes[z]), v: z + i })); sites.push({ p: Z.boss, s: kmSiteOf('lair', D.biomes[z]), v: z, big: 1 }); });
  sites.push({ p: D.god, s: kmSiteOf('siege'), v: 0, big: 1 });
  for (const s of sites) put(s.s.draw, s.p[0] * 16, s.p[1] * 16, s.v);
  items.push({ by: D.castle[1] * 16, fn: () => KM_DRAW.castle(g, D.castle[0] * 16, D.castle[1] * 16, D.free) });
  for (const [k, x, y, a, b] of D.props || []) { if (k === 'boat') put(a ? 'boat2' : 'boat', x * 16, y * 16); else if (k === 'field' || k === 'pier') KM_DRAW[k](g, x * 16, y * 16, a, b); else put(k, x * 16, y * 16, a); }
  const busy = (x, y, tall) => sites.some(s => Math.abs(x - s.p[0] * 16) < (s.big ? 27 : 16) && y > s.p[1] * 16 - (s.big ? 38 : 9) && y < s.p[1] * 16 + 9 + tall * 0.75)
    || (Math.abs(x - D.castle[0] * 16) < 36 && y > D.castle[1] * 16 - 44 && y < D.castle[1] * 16 + 28)
    || river.some(p => Math.abs(p[0] - x) < 9 && y - p[1] > -4 && y - p[1] < 6 + tall * 0.7)
    || roads.some(rd => rd.some(p => Math.abs(p[0] - x) < 7 && y - p[1] > -3 && y - p[1] < 4 + tall * 0.6))
    || (D.props || []).some(([k, px, py, a, b]) => (k === 'field' ? x > px * 16 - 8 && x < (px + a) * 16 + 8 && y > py * 16 - 2 && y < (py + b) * 16 + tall * 0.7 : Math.abs(x - px * 16) < 20 && Math.abs(y - py * 16) < 14));
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const r = reg(x, y), sc = r === '~' ? null : KM_SCATTER[ground(r)]; if (!sc) continue;
    for (let j = 0; j < 3; j++) {
      if (kmHash(x, y, 20 + j) > sc.n / 3) continue;
      const k = sc.s[Math.floor(kmHash(x, y, 30 + j) * sc.s.length)], s = KM_SPR[k], tall = s ? s[4] : 8, half = s ? s[3] / 2 : 4;
      const px = x * 16 + 2 + kmHash(x, y, 40 + j) * 12, py = y * 16 + 5 + kmHash(x, y, 50 + j) * 11;
      // ni encima de un sitio, del río o de un camino, ni asomando al mar o al territorio de al lado
      if (busy(px, py, tall) || [-half, half].some(o => reg(Math.floor((px + o) / 16), Math.floor((py - 2) / 16)) !== r) || reg(x, Math.floor((py + 3) / 16)) !== r) continue;
      put(k, px, py, Math.floor(kmHash(x, y, 60 + j) * 9));
    }
  }
  items.sort((a, b) => a.by - b.by); for (const it of items) it.fn();
  // Borde de cada territorio: la silueta menos ella misma encogida tres píxeles
  const out = { c: base, tmp: mk()[0], free: [mk()[0], mk()[0]], hatch: {}, mask: {}, edge: {} };
  for (const k in masks) {
    const [mc] = masks[k], [ec, eg] = mk(), [ic, ig] = mk();
    ig.drawImage(mc, 0, 0); ig.globalCompositeOperation = 'destination-in'; for (const [ox, oy] of KM_RING) ig.drawImage(mc, ox, oy);
    eg.drawImage(mc, 0, 0); eg.globalCompositeOperation = 'destination-out'; eg.drawImage(ic, 0, 0);
    out.mask[k] = mc; out.edge[k] = ec;
  }
  return (KM_CACHE[K.id] = out);
}

// Pinta el mapa en el lienzo del tablón: la base y, encima, el velo de cada territorio según quién lo tenga
function kmPaint(cv) {
  const K = kingdomNow(), D = KMAPS[K.id], B = kmBase(K), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  g.imageSmoothingEnabled = false;
  if (!B) {   // las hojas aún no han cargado: colores planos, y se reintenta enseguida
    const flat = { water: '#4f8fb0', meadow: '#819447', forest: '#5f7f45', crypt: '#6d6a7a', peaks: '#dfe9ee', ash: '#6a4a4e' };
    D.land.forEach((row, y) => [...row].forEach((r, x) => { g.fillStyle = flat[r === '~' ? 'water' : r === 'c' ? D.capital : D.biomes[+r]]; g.fillRect(x * 16, y * 16, 16, 16); }));
    setTimeout(() => { if (cv.isConnected && !cv.dataset.ok) kmPaint(cv); }, 250);
    return;
  }
  g.drawImage(B.c, 0, 0);
  const t = B.tmp.getContext('2d');
  const veil = (mask, fill, alpha) => { t.globalCompositeOperation = 'copy'; t.drawImage(mask, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = fill; t.fillRect(0, 0, W, H); g.globalAlpha = alpha; g.drawImage(B.tmp, 0, 0); g.globalAlpha = 1; };
  const hatch = col => { if (!B.hatch[col]) { const c = document.createElement('canvas'); c.width = c.height = 6; const h = c.getContext('2d'); h.fillStyle = col; for (let i = 0; i < 6; i++) h.fillRect(i, 5 - i, 1, 1); B.hatch[col] = g.createPattern(c, 'repeat'); } return B.hatch[col]; };
  const regs = ['c', ...D.zones.map((_, z) => '' + z)];
  for (const r of regs) {
    const free = r === 'c' || kmFree(K, +r), col = free ? D.free : kmBoss(K, +r).color;
    if (free) veil(B.mask[r], col, 0.1);
    else { veil(B.mask[r], '#120e14', 0.2); veil(B.mask[r], col, 0.3); veil(B.mask[r], hatch(col), 0.34); }
  }
  // Bordes: cada territorio tomado lleva el suyo; lo que es del reino se junta en una sola mancha con un solo borde, que crece con cada guardián que cae
  const [u, e] = B.free, ug = u.getContext('2d'), eg = e.getContext('2d');
  ug.globalCompositeOperation = 'source-over'; ug.clearRect(0, 0, W, H); for (const r of regs) if (r === 'c' || kmFree(K, +r)) ug.drawImage(B.mask[r], 0, 0);
  eg.globalCompositeOperation = 'copy'; eg.drawImage(u, 0, 0); eg.globalCompositeOperation = 'destination-in'; for (const [ox, oy] of KM_RING) eg.drawImage(u, ox, oy);
  ug.globalCompositeOperation = 'destination-out'; ug.drawImage(e, 0, 0);
  for (const r of regs) if (r !== 'c' && !kmFree(K, +r)) { veil(B.edge[r], '#120e14', 0.55); veil(B.edge[r], kmBoss(K, +r).color, 1); }
  veil(u, '#120e14', 0.5); veil(u, D.free, 0.92);
  // El estandarte de cada guarida: del guardián mientras viva, del reino cuando caiga
  D.zones.forEach((Z, z) => { const free = kmFree(K, z), s = kmSiteOf('lair', D.biomes[z]), x = Math.round(Z.boss[0] * 16) + 13, y = Math.round(Z.boss[1] * 16) + 1, col = free ? D.free : kmBoss(K, z).color;
    const px = kmPx(g, x, y); px(-1, 0, 4, 1, 'rgba(0,0,0,.35)'); px(0, -17, 2, 17, '#1c1216'); px(2, -17, 9, 8, '#1c1216'); px(2, -16, 8, 6, col); px(2, -10, 3, 1, col); px(7, -10, 3, 1, col); px(5, -14, 2, 2, free ? '#fff6d0' : '#1c1216'); if (!free) px(4, -12, 4, 1, '#1c1216'); });
  cv.dataset.ok = 1;
}

// ── Iconos de los marcadores: mapas de bits de 11×11 convertidos en un trazo SVG ──
const KM_ICON = {
  doors:   ['........###', '.......####', '......####.', '.....####..', '#...####...', '##.####....', '.#####.....', '..###......', '.#####.....', '##..##.....', '#....#.....'],
  defend:  ['.#########.', '.#########.', '.####.####.', '.####.####.', '.#.......#.', '.####.####.', '.####.####.', '..###.###..', '..#######..', '...#####...', '....###....'],
  assault: ['.##........', '.#########.', '.#########.', '.########..', '.#########.', '.#########.', '.##........', '.##........', '.##........', '.##........', '####.......'],
  boss:    ['..#######..', '.#########.', '###########', '#..##.##..#', '#..##.##..#', '###########', '.####.####.', '..#######..', '..#.#.#.#..', '..#.#.#.#..', '...........'],
  god:     ['...........', '#....#....#', '##..###..##', '###.###.###', '###########', '###########', '###########', '...........', '###########', '###########', '...........'],
  lock:    ['...#####...', '..##...##..', '..#.....#..', '..#.....#..', '.#########.', '.#########.', '.####.####.', '.####.####.', '.#########.', '.#########.', '...........'],
  check:   ['...........', '.........##', '........###', '.......###.', '......###..', '##...###...', '###.###....', '.#####.....', '..###......', '...#.......', '...........'],
  flag:    ['.#.........', '.########..', '.#########.', '.########..', '.#########.', '.########..', '.#.........', '.#.........', '.#.........', '.#.........', '###........'],
};
const KM_SVG = {};
function kmIcon(k) {
  if (!KM_SVG[k]) { let d = ''; KM_ICON[k].forEach((row, y) => { for (let x = 0; x < row.length; x++) { if (row[x] !== '#') continue; let w = 1; while (row[x + w] === '#') w++; d += `M${x} ${y}h${w}v1h-${w}z`; x += w; } }); KM_SVG[k] = `<svg viewBox="0 0 11 11" aria-hidden="true"><path d="${d}"/></svg>`; }
  return KM_SVG[k];
}

// ── El HTML del tablón: el lienzo, los rótulos de cada territorio, los marcadores y, al lado, el panel y la leyenda ──
function mapHtml() {
  const K = kingdomNow(), D = KMAPS[K.id], W = D.cols * 16, H = D.rows * 16, all = K.zones.length * 4 + 1;
  const nDone = Object.keys(M.done || {}).filter(id => id.startsWith(K.id + ':') && M.done[id]).length;
  const pct = n => +n.toFixed(2);
  const marker = (id, p, up, locked) => { const ms = missionOf(id), done = isDone(id), st = done ? 'Hecha' : locked ? 'Cerrada' : 'Disponible';
    return `<button class="fi mk k-${ms.type}${done ? ' on' : locked ? ' off' : ''}" data-act="${locked ? 'x' : 'm'}:${id}" style="left:${pct(p[0] * 16 / W * 100)}%;top:${pct((p[1] * 16 - up) / H * 100)}%" aria-label="${ms.name}. ${MTYPES[ms.type].name}. ${st}.">${kmIcon(ms.type)}${done ? `<i class="st ok">${kmIcon('check')}</i>` : locked ? `<i class="st">${kmIcon('lock')}</i>` : ''}</button>`; };
  const label = (p, name, sub, col, free) => `<div class="klab${free ? ' free' : ''}" style="left:${pct(p[0] / D.cols * 100)}%;top:${pct(p[1] / D.rows * 100)}%;--zc:${col}"><b>${name}</b><span>${free ? kmIcon('flag') : ''}${sub}</span></div>`;
  let labels = label(D.label, K.name, 'Capital del reino', D.free, true), marks = '';
  K.zones.forEach((Z, z) => {
    const free = kmFree(K, z), B = kmBoss(K, z), P = D.zones[z];
    labels += label(P.label, Z.name, free ? 'Liberado' : 'Tomado por ' + B.name, free ? D.free : B.color, free);
    Z.m.forEach((_, i) => { marks += marker(`${K.id}:${z}:${i}`, P.m[i], kmSiteOf(KM_KIND[i], D.biomes[z]).up, false); });
    marks += marker(`${K.id}:${z}:b`, P.boss, kmSiteOf('lair', D.biomes[z]).up, !zoneOpen(K, z));
  });
  marks += marker(`${K.id}:g`, D.god, kmSiteOf('siege').up, !godOpen(K));
  const held = K.zones.map((Z, z) => z).filter(z => !kmFree(K, z));
  const legend = held.map(z => `<li><u style="--zc:${kmBoss(K, z).color}" class="held"></u>Tomado por ${kmBoss(K, z).name}</li>`).join('') + `<li><u style="--zc:${D.free}"></u>Reino libre</li>` +
    ['doors', 'defend', 'assault', 'boss', 'god'].map(t => `<li class="ic k-${t}">${kmIcon(t)}${MTYPES[t].name}</li>`).join('') + `<li class="ic ok">${kmIcon('check')}Hecha</li><li class="ic">${kmIcon('lock')}Cerrada</li>`;
  return `<div class="kwrap"><div class="kscroll"><div class="kworld" style="aspect-ratio:${W}/${H}"><canvas width="${W}" height="${H}" aria-label="Mapa de ${K.title}"></canvas>${labels}${marks}</div></div>` +
    `<header class="khead"><h2>${K.title}</h2><p class="fine">Contrato · llevas ${nDone} de ${all} encargos · ${held.length ? (held.length === 1 ? 'queda 1 territorio tomado' : 'quedan ' + held.length + ' territorios tomados') : 'todo el reino es libre'}</p></header>` +
    `<aside class="kinfo" aria-live="polite"></aside><ul class="klegend">${legend}</ul></div><p class="fine">${K.lore}</p>`;
}
// El panel: qué es el encargo señalado, cuánto paga, cómo está y, si está cerrado, qué falta
function kmInfoHtml(id) {
  const K = kingdomNow();
  if (!id) return `<p class="eyebrow">Tablón de encargos</p><h3>Elige un encargo en el mapa</h3><p>Cada territorio lleva el color del guardián que lo tiene tomado. Cumple sus tres encargos para llegar hasta él: cuando caiga, el territorio vuelve al reino.</p>`;
  const ms = missionOf(id), T = MTYPES[ms.type], done = isDone(id), god = ms.type === 'god', boss = ms.type === 'boss', pay = payOf(ms);
  const locked = god ? !godOpen(K) : boss && !zoneOpen(K, ms.z);
  let need = '', extra = '';
  if (locked && boss) { const left = K.zones[ms.z].m.filter((_, i) => !isDone(`${K.id}:${ms.z}:${i}`)); need = `Falta completar ${left.length === 1 ? 'un encargo' : 'los ' + left.length + ' encargos'} de ${ms.zone}: ${left.join(' · ')}.`; }
  if (locked && god) { const left = K.zones.map((Z, z) => z).filter(z => !kmFree(K, z)); need = `Falta derrotar a ${left.length === 1 ? 'un guardián' : 'los ' + left.length + ' guardianes'}: ${left.map(z => kmBoss(K, z).name + ' (' + K.zones[z].name + ')').join(' · ')}.`; }
  if (boss) extra = done ? `${ms.zone} ha vuelto al reino.` : `Tiene tomado el territorio de ${ms.zone}. Si cae, vuelve al reino.`;
  if (god) extra = 'El dios que asedia el reino. Solo saldrá cuando no le quede ningún guardián.';
  return `<p class="eyebrow">${god ? K.name : ms.zone} · ${T.name}</p><h3>${ms.name}</h3><p>${T.desc}</p>${extra ? `<p class="dim">${extra}</p>` : ''}` +
    `<dl><div><dt>Paga</dt><dd>${done ? `${Math.round(pay * 0.3)} almas <small>(ya cobraste las ${pay}; repetir paga menos)</small>` : pay + ' almas'}</dd></div>` +
    `<div><dt>Estado</dt><dd class="${done ? 'ok' : locked ? 'no' : 'go'}">${done ? 'Hecha' : locked ? 'Cerrada' : 'Disponible'}</dd></div></dl>` +
    (locked ? `<p class="need">${need}</p>` : `<button class="primary kgo" data-go="${id}">${done ? 'Repetir encargo' : 'Aceptar encargo'}</button>`);
}
// Tras cada repintado del panel o cambio de selección: pinta el lienzo si hace falta y pone en el panel el marcador señalado
function kmSync() {
  const box = $('ovBody').querySelector('.kwrap'); if (!box) return;
  const cv = box.querySelector('canvas'); if (!cv.dataset.ok && !cv.dataset.try) { cv.dataset.try = 1; kmPaint(cv); }
  const sel = box.querySelector('.fi.mk.sel'), id = sel ? sel.dataset.act.slice(2) : '', info = box.querySelector('.kinfo');
  if (info.dataset.id === id && info.firstChild) return;
  const moved = info.dataset.id !== undefined; info.dataset.id = id; info.innerHTML = kmInfoHtml(id);
  // Al moverse con mando o teclado en una pantalla baja: si el mapa cabe entero, que se vea entero y no solo el marcador
  const sc = box.querySelector('.kscroll'), r = sc.getBoundingClientRect(), o = $('overlay').getBoundingClientRect();
  if (moved && sel && !kmByPtr && r.height <= o.height - 8 && (r.top < o.top + 4 || r.bottom > o.bottom - 4)) sc.scrollIntoView({ block: 'nearest' });
  kmByPtr = false;
}
let kmByPtr = false;
function kmSelect(mk) {
  const els = [...$('ovBody').querySelectorAll('.fi')], i = els.indexOf(mk);
  if (i < 0 || i === listSel) return;
  kmByPtr = true; listSel = i; els.forEach((el, j) => el.classList.toggle('sel', j === i));
}
{
  const body = $('ovBody'); let ptr = 'mouse';
  new MutationObserver(kmSync).observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  let at = '';
  body.addEventListener('pointerdown', e => { ptr = e.pointerType || 'mouse'; }, true);
  // Con ratón, pasar por encima de un marcador ya lo señala (solo si el ratón se ha movido de verdad: al repintarse el panel bajo un ratón quieto
  // el navegador avisa igual, y eso le quitaría la selección al mando). Con el dedo no hay «pasar por encima»: el primer toque señala y el segundo acepta.
  const hover = e => { const xy = e.clientX + ',' + e.clientY, still = xy === at; at = xy; const mk = !still && e.pointerType === 'mouse' && e.target.closest ? e.target.closest('.fi.mk') : null; if (mk) kmSelect(mk); };
  body.addEventListener('pointerover', hover); body.addEventListener('pointermove', hover);
  body.addEventListener('click', e => {
    const mk = e.target.closest ? e.target.closest('.fi.mk') : null;
    if (mk && (DUAL.tap || (e.isTrusted && ptr !== 'mouse')) && !mk.classList.contains('sel')) { e.stopPropagation(); e.preventDefault(); audioInit(); sfx('tick', 0.25); kmSelect(mk); return; }
    const go = e.target.closest ? e.target.closest('.kgo') : null;
    if (go) { audioInit(); forgeAct('m:' + go.dataset.go); }
  }, true);
}
// ───────────────────────── Avisos de ayuda ─────────────────────────
// No es un tutorial: son avisos cortos que salen una sola vez cada uno, justo cuando hacen falta, y que se pueden ignorar.
// Los que se han visto se guardan en M.tips; Ajustes → «Volver a ver los avisos de ayuda» lo vacía.
// Hay dos formas de enseñarlos: en partida y en la plaza, un cartel arriba (tip), en el sitio de los mensajes de deidad,
// que esperan a que el aviso se vaya para no salir uno encima del otro (sysTick); dentro de un menú
// (puertas, reliquia, tienda), un recuadro en la cabecera de ese menú (tipTake + tipBox).
const tipEl = $('tip'); let tipQ = [], tipNow = null, tipT = 0, tipGap = 0, tipAge = 0;
const devKey = (pad, kb, touch) => (lastDev === 'pad' ? pad : lastDev === 'touch' ? touch : kb);
const TIPS = {
  shoot:   () => `Dispara con ${devKey('<b>A</b> o <b>RT</b>', '<b>Espacio</b>', 'el botón <b>Disparar</b>')}: Alec apunta solo al enemigo más cercano. Cada disparo te frena un instante, así que dispara, da un paso y vuelve a disparar.`,
  dodge:   () => `Esquiva con ${devKey('<b>B</b> o <b>RB</b>', '<b>Shift</b>', 'el botón <b>Esquivar</b>')}, hacia donde te estés moviendo. Mientras dura no te pueden dañar; luego tarda un segundo en recargarse.`,
  charge:  () => `Mantén ${devKey('<b>X</b> o <b>LT</b>', '<b>E</b>', 'el botón <b>Cargar</b>')} y suelta: el <b>disparo cargado</b> pega mucho más fuerte. Después tarda un par de segundos en volver.`,
  doors:   () => `Cada puerta dice lo que hay detrás. Tras la de una <b>deidad</b> espera su elegido: lo matas, quiebras su reliquia y le robas una técnica para este encargo. Las demás salas no tienen elegido y dan otra cosa: almas, oro, vida, hierro o un ajuste.`,
  relic:   () => `Solo cabe <b>una técnica por acción</b>: disparo, cargado, esquive y pasiva. Si eliges una que ya llevas, sube de nivel. El <b>Recetario</b> (botón de abajo) explica todas.`,
  status:  () => `Los iconos sobre un enemigo indican qué estados lleva encima (Ascuas, Escarcha, Veneno…). Qué hace cada uno lo dice el Glosario: Pausa → Recetario → Glosario.`,
  shop:    () => `Aquí se gasta el oro que has ido recogiendo; hay dos tiendas por encargo. La <b>Reliquia de contrabando</b> te da a elegir una técnica sin tener que matar a un elegido.`,
  defend:  () => `Protege la <b>campana</b> del centro de la aldea: su vida es la barra de abajo y, si llega a cero, pierdes el encargo.`,
  assault: () => `Busca los <b>estandartes</b> del campamento y derríbalos a disparos. Cada estandarte guarda a los suyos: no salen a por ti hasta que te acercas o les das. Cada baja da <b>experiencia</b>: al subir de nivel eliges un ajuste. Cuando caigan todos y no quede nadie, pasas al siguiente campamento.`,
  boss:    () => `Este es el <b>guardián</b> de la zona; su vida es la barra de abajo. Fíjate en sus ataques y esquívalos. Si caes, conservas lo ganado y puedes volver a intentarlo.`,
  souls:   () => { const min = Math.min(...TREE_NODES.map(n => n.cost[tr(n.id)]).filter(c => c > 0)); return `Traes <b>${M.souls} almas</b>. Se gastan en el <b>patio de armas</b>, en mejoras que valen para todos los encargos${M.souls >= min ? ': ya te llega para alguna' : ''}.`; },
  iron:    () => `Traes <b>Hierro Místico</b>. En la <b>forja</b>, cada pieza de guantelete que has encontrado dice lo que cuesta forjarla; una vez forjada, puedes montarla siempre.`,
};
const tipSeen = id => !!(M.tips || {})[id];
function tipMark(id) { M.tips = M.tips || {}; M.tips[id] = 1; save(); }
// Pide un aviso (o varios, en orden): se pone a la cola si no se ha visto ya. Se da por visto cuando llega a salir en pantalla.
function tip(...ids) { for (const id of ids) if (TIPS[id] && !tipSeen(id) && tipNow !== id && !tipQ.includes(id)) tipQ.push(id); }
// Para los avisos que van dentro de un menú: devuelve el id si toca enseñarlo (y lo da por visto), o null
function tipTake(id) { if (!TIPS[id] || tipSeen(id)) return null; tipMark(id); return id; }
const tipBox = id => (id && TIPS[id] ? `<div class="tipbox"><em>Ayuda</em><span>${TIPS[id]()}</span></div>` : '');
function tipClear() { tipQ = []; tipNow = null; tipT = 0; tipGap = 0; tipEl.hidden = true; }
function tipsReset() { M.tips = {}; save(); tipClear(); }
const statusOn = e => e.spawn <= 0 && (e.ember > 0 || e.venom > 0 || e.needles > 0 || e.mark > 0 || e.frost > 0 || e.frozen > 0 || e.bleed > 0 || !!e.doom || e.lit > 0 || e.sleep > 0 || e.seed > 0 || e.root > 0 || e.wet > 0);
function tipTick(dt) {
  const m = S.mode, live = (m === 'play' || m === 'town') && !S.dialog;
  if (m === 'play' && !tipSeen('status') && S.enemies.some(statusOn)) tip('status');
  if (!live) { tipEl.hidden = true; if (tipNow && tipAge > 4) tipNow = null; return; }   // en los menús no se ve ni corre el tiempo; si se abrió uno cuando apenas había salido, al volver sigue donde estaba
  if (tipNow) { tipT -= dt; tipAge += dt; if (tipT <= 0) { tipNow = null; tipGap = 0.8; } }
  else if ((tipGap -= dt) <= 0) {
    while (tipQ.length && !tipNow) { const id = tipQ.shift(); if (!tipSeen(id)) tipNow = id; }
    if (tipNow) { const h = TIPS[tipNow](); tipMark(tipNow); tipAge = 0; tipEl.innerHTML = '<em>Ayuda</em>' + h; tipT = clamp(h.replace(/<[^>]+>/g, '').length / 15, 7, 11); sfx('tick', 0.3, 0.8); }
  }
  tipEl.hidden = !tipNow;
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
// ¿Llevan los guanteletes montada esa pieza? ¿Está activa esa resonancia?
const G = id => S.gun[PART[id].slot] === id;
const res = id => RES[id].parts.every(G) && RES[id].techs.every(t => lv(t) > 0);
const braced = () => G('s_brace') && S.p.still >= 0.5;
const gunRange = () => (1 + 0.05 * lv('forge_passive')) * ({ b_short: 0.7, b_twin: 0.75, b_scatter: 0.5, b_pierce: 1.3, b_spike: 0.5, b_bomb: 1.1, b_flame: 0.42, b_fork: 0.9, b_far: 1.25, b_boom: 0.85, b_horn: 0.55 }[S.gun.barrel] || 1) * (braced() ? 1.2 : 1) * (G('s_scope') ? 1.15 : 1);
const gunRate = () => (1 + 0.05 * lv('forge_passive')) * ({ a_drum: 1 }[S.gun.action] && furyFull() ? 1.25 : 1) * ({ b_short: 1.25, b_bomb: 0.65, b_flame: 1.4, b_flail: 0.8, b_nail: 1.2, b_boom: 0.8 }[S.gun.barrel] || 1) * (G('s_bone') ? 1 + 0.5 * clamp((1 - S.p.hp / S.p.maxHp - 0.25) / 0.5, 0, 1) : 1) * ({ a_semi: 1.2 * (1 + 0.4 * (S.p.runUp || 0)), a_burst: 0.85, a_draw: 0.65, a_combo: 1 + 0.08 * Math.min(8, S.p.comboN || 0), a_fly: 1 + 0.6 * (S.p.fly2 || 0), a_firm: S.p.still > 0.3 ? 1.5 : 0.8, a_maul: 0.45, a_humm: 2.1 }[S.gun.action] || 1) * ({ m_belt: 1.3, m_heavy: 0.8 }[S.gun.mag] || 1);
const gunDmg = () => (G('b_blow') || G('b_ghost') ? 0.85 : 1) * (G('s_tower') ? 1.25 : 1) * (G('s_sapper') && touchesWall(S.p, S.p.r + 10) ? 1.3 : 1) * (G('m_grow') ? 1 + 0.02 * (S.p.grow || 0) : 1) * (1 + 0.05 * lv('forge_passive')) * ({ a_semi: 0.75, a_rotary: 0.3, a_fuse: 1.45, a_auto: 0.8, a_maul: 2.6, a_humm: 0.45 }[S.gun.action] || 1) * ({ m_drum: 1.35, m_heavy: 1.3, m_blood: 1.4, m_big: 1.2 }[S.gun.mag] || 1) * (G('b_harpoon') ? 1.15 : 1) * ({ s_light: 0.9, s_heavy: 1.25 }[S.gun.stock] || 1) * (G('b_pierce') ? 0.9 : 1) * (braced() ? 1.4 : 1);
// Avisar cuando despierta una resonancia nueva en esta partida
// Cuántas piezas montadas son afines a una deidad de la que llevas alguna técnica
const th = god => godCount(god) >= 1;   // ¿llevas alguna técnica de esa deidad? Las piezas temáticas van a más
const aff = god => (godCount(god) >= 1 ? GSLOT_KEYS.reduce((n, k) => n + (affGod(S.gun[k]) === god ? 1 : 0), 0) : 0);
const ens = id => ENSEMBLES.some(E => E.id === id && E.parts.every(p => S.gun[PART[p].slot] === p));
const leg = id => { const L = legOf(S.gun); return !!L && L.id === id; };
function checkRes() {
  for (const E of ensOf(S.gun)) if (!S.resSeen.has('ens_' + E.id)) { S.resSeen.add('ens_' + E.id); sayRaw('[Ensamble: ' + E.name + '. ' + E.desc + ']', C.energy); sfx('fanfare', 0.55); }
  for (const g of GOD_KEYS) { const a = aff(g); if (a > 0 && (S.affSeen || (S.affSeen = {}))[g] !== a) { S.affSeen[g] = a; sayRaw('[Afinidad con ' + GODS[g].theme + ' ×' + a + ': ' + AFFIN[g] + (a > 1 ? ', por cada pieza' : '') + ']', GODS[g].color); } }
  { const L = legOf(S.gun); if (L && !S.resSeen.has('leg_' + L.id)) { S.resSeen.add('leg_' + L.id); M.legends = M.legends || {}; M.legends[L.id] = 1; save(); sayRaw('[Guanteletes legendarios: ' + L.name + '. ' + L.desc + ']', RAR[3].color); sfx('fanfare', 0.7,0.85); } }
 for (const R of RESO) if (!S.resSeen.has(R.id) && res(R.id)) { S.resSeen.add(R.id); sayRaw('[Resonancia: ' + R.name + '. ' + R.desc + ']', RAR[3].color); sfx('fanfare', 0.6,1.1); } }
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

const overWalls = () => G('b_ghost') || G('b_bomb');   // la Palma fantasma atraviesa los muros y la Palma de volcán tira por encima: no necesitan ver al objetivo
function nearestInRange() {
  const p = S.p, rng = rangeOf(); let bestE = null, bd = 1e9;
  for (const e of S.enemies) {
    if (!active(e)) continue;
    const d = dist(p, e) - e.r;
    if (d <= rng && d < bd && (overWalls() || !blocked(p, e))) { bd = d; bestE = e; }
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
// Vida en porcentaje: toda curación, coste de vida y Reserva se mide en «puntos», y un punto es el 1% de tu vida máxima.
// Así siguen valiendo lo mismo cuando la vida máxima crece con el árbol.
const pct = n => n * S.p.maxHp / 100, toPts = hp => hp * 100 / S.p.maxHp;
function addReserve(n) { const p = S.p; p.reserve = Math.min(resMax(), p.reserve + n); p.resT = 3; }
function heal(n) {
  const p = S.p;
  if (n <= 0) return;
  n *= (mastery('feast') ? 1.5 : 1) * (1 + 0.1 * aff('feast'));
  p.hp += n;
  if (p.hp > p.maxHp) { const over = p.hp - p.maxHp; p.hp = p.maxHp; if (godCount('feast')) addReserve(toPts(over)); }
  if (duoOn('warhunger')) gainFury(toPts(n) * 2);                                    // dúo Hambre de guerra
}
function addGold(n) { const p = S.p; if (G('s_loot')) n = Math.round(n * 1.5); p.gold += n; if (n >= 1 && S.mode === 'play') for (let i = 0; i < Math.min(4, Math.ceil(n / 15)); i++) S.fx.push({ k: 'coin', x: p.x + (i - 1) * 9, y: p.y - 12, t: -0.07 * i, life: 0.6 }); if (duoOn('hoardfeast')) heal(pct(n)); }   // dúo Banquete del dragón

// ───────────────────────── Golpes, bajas y explosiones ─────────────────────────
function kill(e) {
  const p = S.p;
  sfx(e.boss ? 'bossdie' : e.champ ? 'relic' : 'kill', e.boss ? 0.8 : e.champ ? 0.6 : 0.3, 0.9 + Math.random() * 0.25);
  S.kills += 1;
  if (S.mission && S.mission.type === 'assault' && !e.type.post) gainXp(e.boss ? 10 : e.champ ? 5 : e.elite ? 3 : 1);
  if (!S.calm) dropCoins(e.x, e.y, coinsOf(e));   // el oro se suelta en monedas y se recoge (44_calm.js)
  for (let i = 0; i < 10; i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: rnd(-110, 110), vy: rnd(-110, 110), t: 0, life: rnd(0.25, 0.5), col: e.color });
  if (S.lock === e) S.lock = null;
  if (S.pets.length) S.build.caza = caza() + (e.boss || e.champ ? 5 : 1);                         // Bestias: la Caza de la manada
  if (e.boss) {   // los jefes no se desploman: se deshacen
    S.fx.push({ k: 'godfall', key: charKey(e), x: e.x, y: e.y + e.r + 3, flip: Math.cos(e.dir) < 0, col: e.color, t: 0, life: GODFALL_T + 1.2 }); S.shake = Math.max(S.shake, 10);
    for (const d of [0.3, 0.7, 1.15, 1.7]) S.timers.push({ t: d, fn: () => { sfx(d > 1.5 ? 'bossdie' : 'boom', 0.6, 0.8 + Math.random() * 0.3, 0); S.shake = Math.max(S.shake, 6); } });
  }
  { const ck = charKey(e), m = ATLAS[ck]; if (m && m.a.die && !e.boss) S.fx.push({ k: 'corpse', key: ck, x: e.x, y: e.y + e.r + 2, flip: Math.cos(e.dir) < 0, t: 0, life: 1.4 }); }   // se desploma
  if (e.type.post) { S.postsDown = (S.postsDown || 0) + 1; addGold(20); sayRaw('[Estandarte derribado: ' + S.postsDown + ' de ' + (S.postsAll || 3) + ']', C.ink); if (S.postsDown < (S.postsAll || 3)) S.pendingLoot = true; }
  if (lv('frost_passive') && e.frozen > 0) for (const o of others(e, 90, 4)) addFrost(o, 2);    // Cero absoluto
  if (has('i_shatter') && e.frozen > 0) for (const o of others(e, 100, 4)) { S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.12, col: GODS.frost.color }); hit(o, p.dmg * 0.4, 0, 0, false, GODS.frost.color); }   // Astillas
  if (mastery('blood') && e.bleed > 0) heal(pct(2));                                                // maestría Cobro final
  if (has('h_warm') && p.hp < p.maxHp / 2) heal(pct(2));                                            // Sangre caliente
  if (S.t < (S.bloodT || 0)) { heal(pct(5)); if (duoOn('bloodrite') && !e.boss) raiseShade(e.x, e.y); }   // Sangría (y dúo Rito rojo)
  if (e.doom && e.doom.acc - (e.doom.inh || 0) > 0) { const was = S._doom; S._doom = true; explode(e.x, e.y, 46, (e.doom.acc - (e.doom.inh || 0)) * doomK(), { col: GODS.end.color, soft: true }); S._doom = was; }   // Sentencia sin cumplir: estalla sobre los de alrededor con lo que le tocaba (lo heredado por Epitafio no cuenta)
  { const ep = lv('end_passive'); if (ep && e.doom && e.doom.acc > 0) { const o = others(e, 140, 1)[0]; if (o) { const give = e.doom.acc * (1 + 0.15 * (ep - 1)); o.doom = { t: Math.max(2, e.doom.t), acc: give + (o.doom ? o.doom.acc : 0), inh: give + (o.doom ? o.doom.inh || 0 : 0) }; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.2, col: GODS.end.color }); } } }   // Epitafio
  if (has('u_halo') && e.lit > 0) explode(e.x, e.y, 46, p.dmg, { col: GODS.light.color });         // Halo
  if (G('s_grave') && !e.boss) { S.graveN = (S.graveN || 0) + 1; if (S.graveN >= (th('shade') ? 5 : 8)) { S.graveN = 0; S.stat.grave++; raiseShade(e.x, e.y); } }   // Brazal de lápida
  if (G('s_wine')) { const k = th('feast') ? 2 : 1; if (p.hp >= p.maxHp) addReserve(k); else heal(pct(k)); }   // Brazal de bota de vino
  if (G('m_gold')) addGold(1);
  if (G('m_blood')) heal(pct(3));                                                                  // Gema de sangre
  if (e.elite && G('m_silver')) addGold(3);
  if (e.elite) { addGold(3); note(e.x, e.y - e.r - 10, '+3 oro', RAR[3].color); }
  if (e.elite === 'volatile') S.hazards.push({ x: e.x, y: e.y, r: 40, t: 0.9, t0: 0.9, dmg: e.dmg, col: '#ff8a3c' });   // élite volátil: revienta al morir
  stain(e); for (let i = 0; i < (e.boss ? 14 : 4); i++) S.fx.push({ k: 'smoke', x: e.x + rnd(-e.r, e.r), y: e.y + rnd(-e.r, e.r * 0.5), vx: rnd(-10, 10), vy: -rnd(8, 26), t: 0, life: rnd(0.4, 0.8) });
  sfx('kill', 0.3);
  if (e.boss) { S.ironRun += 2; for (const g of GOD_KEYS) if (Math.random() < 0.5) S.matsRun[g] += 1; }
  if (e.champ) { S.matsRun[e.god] += S.world; S.drop = { god: e.god, x: e.x, y: e.y }; say(e.god, 'champ'); sfx('relic', 0.6); }
  if (S.t < S.banquet) heal(pct(4));
  { const bp = lv('wood_passive'), held = e.root > 0 || e.bram > 0;
    if (bp && held) heal(pct(bp));                                                                  // Savia
    if (duoOn('amber') && held) addCrystal(e.x, e.y);                                          // dúo Ámbar
    if (has('b_bloom') && e.root > 0) S.zones.push({ x: e.x, y: e.y, r: 34, life: 3, acc: 0.4, slow: 0.5, dmg: p.dmg * 0.2, bram: true, col: GODS.wood.color });   // Floración
    if (duoOn('drowned') && e.wet > 0 && !e.boss) raiseShade(e.x, e.y); }                      // dúo Ahogados
  if (has('f_appet')) heal(pct(1));                                                                 // Buen apetito
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
  if (e.type.post) e.alert = true; else if (e.camp) e.camp.alert = true;   // asaltos: si le das a uno, su campamento se entera
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
      { const tn = temperNow(); if (tn > 0) dmg *= 1 + 0.03 * tn; }                              // Temple (y los Cristales del dúo Piedra de amolar)
      if (bp3 && e.hp / e.maxHp < 0.3) dmg *= 1 + 0.25 * bp3;                                   // Olfato
      if (has('g_whet')) dmg *= 1.08; }
    { const lp2 = lv('light_passive'), vp2 = lv('void_passive'), db = lv('dream_basic');
      if (lp2) dmg *= 1 + 0.05 * lp2 * Math.min(6, litCount());                                 // Sin sombra
      if (vp2) dmg *= 1 + 0.08 * vp2 * packed(e) * (duoOn('thicket') && (e.root > 0 || e.bram > 0) ? 2 : 1);   // Apiñados (y dúo Espesura)
      if (e.sleep > 0 || e.doze > 0) { dmg *= 1 + Math.max(1, db) * (S._night ? 0 : 1) + (S._night ? 0.8 * lv('dream_charge') : 0); if (!S._night) { if (e.sleepHits > 0) e.sleepHits--; else wake(e); } } }   // Arrullo / Pesadilla
    { const fp = lv('frost_passive'), bp2 = lv('blood_passive');
      if (fp && e.frozen > 0) dmg *= 1 + 0.25 * fp;                                            // Cero absoluto
      if (bp2 && p.hp < p.maxHp / 2) dmg *= 1 + 0.2 * bp2; }                                   // Deuda
    if (duoOn('orchard') && e.root > 0) heal(pct(1)); }                                             // dúo Huerto
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);                                  // Organismo débil
  if (e.inWell > 0 && leg('blacksun')) dmg *= 1.5;                                             // legendaria Sol Negro
  if (e.traced > 0) dmg *= 1.3;                                                               // Gema de marca
  if (G('m_silver')) dmg *= e.boss || e.champ || e.elite ? 1.6 : 0.9;                              // Gema de plata
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
  if (e.hp <= 0) kill(e); else { sfx('hit', 0.3); sfx('hit', 0.3, 0.9 + Math.random() * 0.3); }
}
// Daño continuo: sin pausa ni empujón
function dot(e, dmg, col) {
  if (!active(e)) return;
  const ti = lv('time_passive');
  if (ti && isSlow(e)) dmg *= 1 + 0.3 * ti;
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);
  if (e.sleep > 0 || e.doze > 0) { const dp = lv('dream_passive'); if (dp) dmg *= 1 + 0.5 * dp; else wake(e); }   // Sonámbulos: el daño continuo no despierta
  e.hp -= dmg; S.dealt = (S.dealt || 0) + dmg; S.lastHitT = S.t;
  S.fx.push({ k: 'num', x: e.x + rnd(-6, 6), y: e.y - e.r - 2, t: 0, life: 0.4, txt: String(Math.max(1, Math.round(dmg))), col });
  if (e.hp <= 0) kill(e);
  return dmg;
}
// Toda explosión pasa por aquí, así que las técnicas que dicen "todas tus explosiones" afectan a cualquiera
function explode(x, y, r, dmg, o) {
  o = o || {};
  sfx('boom', 0.4, 0.85 + Math.random() * 0.3, 0.09);
  const blood = has('d_blood'), vap = has('v_vapors');
  if (blood) r *= 1.3;
  S.fx.push({ k: 'ring', x, y, r, t: 0, life: 0.42, col: o.col || C.ink, boom: true });   // boom: se pinta como explosión, no como un simple aro
  if (!o.soft) { S.shake = Math.max(S.shake, 4); sfx('boom', 0.45); }
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
// Espejos, Bestias y Forja: el Reflejo, la manada y el Temple
const mirrorN = () => (lv('mirror_basic') || lv('mirror_charge') ? (mastery('mirror') ? 2 : 1) : 0);
// Bestias: la manada crece con la Caza, las bajas de la misión con algún perro a tu lado (elegidos y jefes cuentan 5).
// Va guardada dentro de S.build (que nadie recorre entero) para que no se pierda de una sala a otra ni al continuar una partida.
const PACK = { grow: [6, 25], join: [60, 120], k: [0.6, 1, 1.3], name: ['cachorro', 'sabueso', 'lobo alfa'], names: ['cachorros', 'sabuesos', 'lobos alfa'], max: 6 };
const caza = () => (S.build && S.build.caza) || 0;
const petBase = () => (leg('pack') ? 2 : 0) + (lv('beast_basic') || lv('beast_charge') || lv('beast_dodge') ? (mastery('beast') ? 2 : 1) + (G('s_kennel') ? 1 : 0) : G('s_kennel') ? (th('beast') ? 2 : 1) : has('a_pup') ? 1 : 0);
const petN = () => { const n = petBase(); return n ? Math.min(PACK.max, n + (caza() >= PACK.join[0] ? 1 : 0)) : 0; };   // con 60 de Caza se une un cachorro (si caben: seis perros como mucho)
// Etapa de cada perro: 0 cachorro, 1 sabueso, 2 lobo alfa. Solo el primero llega a alfa (los dos primeros con la maestría Jauría).
// El de la camada es el último y va por detrás: cachorro desde 60 de Caza, sabueso desde 120.
function packStage(i) {
  const c = caza();
  if (c >= PACK.join[0] && i >= petBase()) return c >= PACK.join[1] ? 1 : 0;
  return c >= PACK.grow[1] && i < (mastery('beast') ? 2 : 1) ? 2 : c >= PACK.grow[0] ? 1 : 0;
}
const biteK = () => { const lb = lv('beast_basic'); return lb ? 0.15 + 0.3 * lb : 0.3; };   // mordisco de un sabueso adulto
// Avisa cuando la manada crece (y no al cargar una partida ni al conseguir el primer perro)
function packWatch() {
  const n = S.pets.length;
  if (!n) { S.packSeen = null; return; }
  const c = caza(), now = { st: packStage(0), lit: n > petBase() ? 1 + packStage(n - 1) : 0 }, was = S.packSeen; S.packSeen = now;
  if (!was) return;
  const pt = S.pets[0], col = GODS.beast.color, tell = (pet, short, long) => { note(pet.x, pet.y - 16, short, col, true); S.fx.push({ k: 'ring', x: pet.x, y: pet.y, r: 26, t: 0, life: 0.5, col }); sayRaw('[' + long + ' Caza: ' + c + '.]', col); sfx('pick', 0.5,1.15); };
  if (now.st > was.st) tell(pt, now.st === 2 ? '¡Lobo alfa!' : '¡Ya es un sabueso!', now.st === 2 ? 'Tu sabueso es ahora un lobo alfa: muerde un 30% más fuerte, corre más y su mordisco alcanza a los enemigos pegados a su presa.' : 'Tu cachorro ha crecido: ya es un sabueso y muerde con toda su fuerza.');
  if (now.lit > was.lit) tell(S.pets[n - 1], now.lit === 2 ? '¡Ya es un sabueso!' : '¡Un cachorro!', now.lit === 2 ? 'El cachorro de la camada ha crecido: ya es un sabueso.' : 'Un cachorro se une a tu manada.');
}
// «Ahora: …» al final de las descripciones de Bestias, para ver cómo va la manada desde la pausa
function packStatus() {
  if (!S || !M.run || !S.pets || !S.pets.length || ['title', 'town', 'forge', 'dead', 'win'].includes(S.mode)) return '';
  const c = caza(), cnt = [0, 0, 0], next = PACK.grow.concat(PACK.join).find(x => c < x); S.pets.forEach((_, i) => cnt[packStage(i)]++);
  const parts = [2, 1, 0].filter(k => cnt[k]).map(k => cnt[k] + ' ' + (cnt[k] > 1 ? PACK.names[k] : PACK.name[k]));
  return ` Tu manada ahora: ${parts.length > 1 ? parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1] : parts[0]}. Caza: ${c}${next ? ' (el siguiente cambio llega con ' + next + ')' : ''}.`;
}
const temperMax = () => (lv('forge_basic') ? 8 + 2 * lv('forge_basic') : 10) + (mastery('forge') ? 5 : 0) + aff('forge') + (leg('master') ? 10 : 0);
const temperNow = () => S.p.temper + (duoOn('whetstone') ? S.crystals.length : 0);
function addTemper(n) { const p = S.p; if (n > 0 && p.temper < temperMax()) { p.temper = Math.min(temperMax(), p.temper + n); S.stat.temper++; } }
// Un mordisco. order: lo manda una técnica (Manada, Montería) con su propio porcentaje, sin contar la etapa del perro.
function bite(pet, e, k, order) {
  if (!active(e)) return; const p = S.p, d = Math.hypot(e.x - pet.x, e.y - pet.y) || 1, st = order ? 1 : pet.st || 0, ux = (e.x - pet.x) / d, uy = (e.y - pet.y) / d; S.stat.bite++;
  const dmg = p.dmg * k * PACK.k[st] * (1 + 0.12 * aff('beast'));
  S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + (st === 2 ? 14 : 4), t: 0, life: st === 2 ? 0.16 : 0.1, col: GODS.beast.color });
  onHit(e, dmg, ux, uy, false, GODS.beast.color, 'pet');
  if (st === 2) { let n = 0; for (const o of S.enemies.slice()) { if (o === e || !active(o) || dist(e, o) > e.r + o.r + 12) continue; hit(o, dmg * 0.3, ux, uy, false, GODS.beast.color); if (++n >= 3) break; } }   // lobo alfa: alcanza a los pegados a la presa
  if (duoOn('rabid')) addVenom(e, 2); if (duoOn('warhound')) gainFury(4);
  if (!active(e) && has('a_feral')) heal(pct(2));
}
// Luz: Iluminar. Sueño: dormir. Vacío: pozos que arrastran.
const shareK = () => 0.2 + 0.1 * lv('light_basic') + 0.04 * aff('light');
function light(e, t) { if (active(e)) e.lit = Math.max(e.lit || 0, t || 6); }
const litCount = () => S.enemies.reduce((n, e) => n + (active(e) && e.lit > 0 ? (e.boss || e.champ ? 3 : 1) : 0), 0) + (duoOn('eclipse') ? S.shades.length : 0);
function sleep(e, t) {
  if (!active(e) || (e.sleepCd || 0) > S.t) return;
  t = (t + 0.4 * aff('dream')) * (duoOn('siesta') ? 2 : 1);
  if (e.boss) { slow(e, t * 0.5, 0.5); e.doze = t * 0.5; e.sleepHits = mastery('dream') ? 1 : 0; e.sleepCd = S.t + 6; S.stat.sleep++; note(e.x, e.y - e.r - 10, 'Adormilado', GODS.dream.color); return; }   // los jefes no se duermen: Adormilados (frenados), pero cuentan como Dormidos para el daño
  e.sleep = Math.max(e.sleep || 0, t); e.sleepHits = mastery('dream') ? 1 : 0; e.wind = 0; e.cast = 0; e.lungeWind = 0; S.stat.sleep++;
  note(e.x, e.y - e.r - 10, 'Zzz', GODS.dream.color);
}
function wake(e) { e.sleep = 0; e.doze = 0; e.wokeT = S.t; e.sleepCd = Math.max(e.sleepCd || 0, S.t + 4); if (has('z_night')) slow(e, 2, 0.5); }
function tug(e, r, f) { for (const o of others(e, r, 8)) { if (o.boss || o.type.post) continue; const d = dist(e, o) || 1; o.kx += (e.x - o.x) / d * f; o.ky += (e.y - o.y) / d * f; o.slamCd = Math.max(o.slamCd || 0, 0.4); } }
function addWell(x, y, r, life, pulse, end, o) { const k = (mastery('void') ? 1.4 : 1) * (1 + 0.1 * aff('void')); S.wells.push(Object.assign({ x, y, r: r * k, life: life + (mastery('void') ? 1 : 0), acc: 0, pulse, end, got: new Set() }, o || {})); S.stat.well++; }
const packed = e => { let n = 0; for (const o of S.enemies) if (o !== e && active(o) && dist(e, o) < e.r + o.r + 26) n++; return Math.min(4, n); };
// Hielo: la Escarcha se acumula; a la quinta, Congelado
function freeze(e) {
  if (!active(e)) return;
  const dur = (1.5 + 0.3 * aff('frost') + (duoOn('stillness') ? 1.5 : 0)) * (mastery('frost') ? 2 : 1);
  e.frost = 0; e.frozen = e.boss ? dur * 0.5 : dur; S.stat.frozen++;
  if (e.boss) slow(e, dur, 0.4); else stun(e, dur);
  note(e.x, e.y - e.r - 10, '¡Congelado!', GODS.frost.color); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 8, t: 0, life: 0.25, col: GODS.frost.color }); sfx('ice', 0.45);
  if (duoOn('hibernate')) e.napAfter = true;                                          // dúo Hibernar
  if (duoOn('glacier')) addCrystal(e.x + rnd(-12, 12), e.y + rnd(-12, 12));           // dúo Glaciar
  if (duoOn('hail') && e.needles > 0) discharge(e, 0.8, null);                        // dúo Granizo
}
function addFrost(e, n) { if (!active(e) || e.frozen > 0 || n <= 0) return; e.frost = (e.frost || 0) + n; e.frostT = 4; if (e.frost >= 5) freeze(e); else slow(e, 2, 1 - 0.12 * e.frost); }
// Sangre: Heridas que sangran según la vida que te falta
function addBleed(e, n) { if (!active(e) || n <= 0) return; if (leg('widow')) addVenom(e, n); e.bleed = Math.min(6, (e.bleed || 0) + n); e.bleedT = 5; if (duoOn('warwound')) gainFury(3 * n); }
function payLife(n) { const p = S.p; n = Math.min(n, p.hp - 1); if (n <= 0) return 0; p.hp -= n; if (duoOn('bloodwine')) addReserve(toPts(n)); return n; }   // (dúo Vino de sangre)
// Final: Sentencias que devuelven de golpe parte del daño acumulado
const doomK = () => (0.2 + 0.2 * Math.max(1, lv('end_basic')) + 0.06 * aff('end')) * (G('c_doom') && th('end') ? 1.5 : 1);
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
const slamV = e => (e.wet > 0 ? 90 : 170);   // a un Empapado le basta un empujón más flojo para estamparse
function push(e, ux, uy, f) {
  if (!active(e)) return;
  if (e.boss) { if (e.wet > 0 && f >= 100 && (e.slamCd || 0) <= 0) { e.slamCd = 3; wallSlam(e, ux, uy, null); } return; }   // un jefe Empapado no se mueve, pero el empujón lo golpea igual
  e.kx += ux * f; e.ky += uy * f;
}
// Golpe contra el muro (o, en un jefe Empapado, el empujón que no puede moverlo)
function wallSlam(e, ux, uy, reef) {
  const p = S.p; S.stat.slam++;
  S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 8, t: 0, life: 0.16, col: C.ink }); S.shake = Math.max(S.shake, 3); sfx('crack', 0.4,0.8);
  if (reef) { reef.life = 0; explode(reef.x, reef.y, 40, p.dmg * 1.2, { col: GODS.stone.color, skip: e }); }
  if (duoOn('steam') && e.ember > 0) { const st = e.ember; e.ember = 0; explode(e.x, e.y, 42, p.dmg * 0.35 * st, { col: GODS.dragon.color, skip: e }); }   // dúo Vapor
  if (duoOn('ram')) gainFury(20);                                        // dúo Ariete
  if (has('w_deep')) addGold(1);                                         // Mar de fondo
  if (mastery('tide')) { explode(e.x, e.y, 50, p.dmg * 1.5, { col: GODS.tide.color, skip: e }); for (const o of others(e, 50, 9)) soak(o, 4); }   // maestría Señor del abismo
  note(e.x, e.y - e.r - 6, e.boss ? '¡Golpe de mar!' : '¡Contra el muro!', C.ink); hit(e, p.dmg * 0.9 * (1 + 0.5 * lv('tide_basic')) * (1 + 0.2 * aff('tide')) * (ens('ram') ? 1.6 : 1), ux, uy, true, C.ink); stun(e, has('w_deep') ? 1.4 : 0.7);
}
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
  S.stat.crit++; p.pity = 0; note(e.x, e.y - e.r - 12, '¡Crítico!', GODS.luck.color, true); sfx('crit', 0.4,1.15);
  if (lv('luck_passive')) p.streak = Math.min(5, p.streak + 1);                       // Racha
  if (duoOn('jackpot')) addGold(1);                                                   // dúo Tesoro maldito
  if (duoOn('facet')) addCrystal(e.x + rnd(-14, 14), e.y + rnd(-14, 14));             // dúo Faceta
  if (duoOn('snakeeyes') && e.venom > 0) e.venom = Math.min(30, e.venom * 2);         // dúo Ojos de serpiente
  if (duoOn('clover') && active(e) && e.seed > 0) sprout(e);                          // dúo Trébol
  if (duoOn('verdict') && active(e) && e.doom && e.doom.acc > 0) fulfil(e);           // dúo Veredicto (si el crítico acaba de ponerla, aún está vacía y no se gasta)
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
  sfx('zap', 0.35, 1 + n * 0.06);
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

// ───────────────────────── Disparos ─────────────────────────
// Un impacto de disparo, venga de ti, de un eco, de un Cristal, de una Sombra o de un guantelete gemelo
function onHit(e, dmg, ux, uy, big, col, src) {
  hit(e, dmg, ux, uy, big, col);
  const p = S.p, db = lv('dragon_basic'), vb = lv('venom_basic'), fb = lv('feast_basic'), sb = lv('stone_basic'), rb = lv('storm_basic');
  if (db) addEmber(e, db * (src === 'echo' && duoOn('eternal') ? 2 : 1));                         // Colmillo al rojo (y dúo Brasa eterna)
  if (vb) addVenom(e, vb * (G('b_blow') ? 2 : 1));                                                                     // Ponzoña
  if (duoOn('boil')) addVenom(e, Math.floor(p.fury / 20));                                        // dúo Sangre hirviente
  if (fb) heal(pct(0.5 * fb) * (duoOn('warhunger') && furyFull() ? 3 : 1) * (p.feastShot ? 3 : 1));                            // Bocado
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
    if (vb2 && src === 'player' && active(e)) { tug(e, 70, 55 + 25 * vb2); for (const o of others(e, 70, 8)) hit(o, dmg * (0.15 + 0.05 * vb2), 0, 0, false, GODS.void.color); } }   // Gravedad: junta a los de alrededor y el tirón les hace daño
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
    if (has('g_slag') && temperNow() >= temperMax()) explode(e.x, e.y, 30, dmg * 0.3, { col: GODS.forge.color, soft: true, skip: e });
    if (duoOn('forgefire') && temperNow() >= 5) addEmber(e, 1);
    if (has('e_ink') && p.shotN % 4 === 0) addDoom(e);
  }
  if (lv('shade_basic') && active(e)) e.mark = 6;                                              // Marca de tumba
  if (sb && src === 'player') { p.crysN += 1; if (p.crysN % Math.max(1, 4 - sb) === 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }   // Esquirla
}
// Un disparo tuyo: además del impacto, deja eco (Segundero), la repiten los Cristales (Veta) y puede soltar un rayo
function shot(e, dmg, ux, uy, big, col) {
  const p = S.p, ox = p.x, oy = p.y, cc = critChance();
  let crit = false;
  if (cc > 0) { if (Math.random() < cc) { crit = true; dmg *= critMult(); big = true; } else if (lv('luck_basic')) p.pity += 0.05; }
  if (G('m_salt') && e.wet > 0) dmg *= 1.15;
  if (G('m_star') && e.lit > 0) dmg *= th('light') ? 1.25 : 1.12;
  if (e.shackleT > 0) dmg *= 1.25;                                                          // encadenado (Dedos de grillete)
  if (G('s_scope') && !e.scoped) { e.scoped = true; dmg *= ens('marksman') ? 3 : 1.8; big = true; S.stat.first++; }       // Brazal de catalejo: primer tiro
  if (G('m_ice') && active(e)) {                                                               // Gema de escarcha
    if (e.slowT > 0 && e.iceT > 0 && (e.frozeCd || 0) <= S.t) { e.frozeCd = S.t + 3; stun(e, 0.8); if (!e.boss) e.frozen = Math.max(e.frozen || 0, 0.8); S.stat.freeze++;   // cuenta como Congelado de verdad
      note(e.x, e.y - e.r - 10, '¡Congelado!', '#bfe9ff'); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 7, t: 0, life: 0.2, col: '#bfe9ff' }); }
    slow(e, 1.5, 0.7); e.iceT = 1.5; if (res('coldiron')) addFrost(e, 1);                       // resonancia Hierro frío
  }
  onHit(e, dmg, ux, uy, big, col, 'player');
  if (G('m_blunt') && p.shotN % 5 === 0 && active(e)) stun(e, 0.6);                             // Gema roma
  if (G('m_grow') && !active(e) && !e.boss) p.grow = Math.min(30, (p.grow || 0) + 1);          // Gema voraz
  if (G('m_leech')) { p.leechN = (p.leechN || 0) + 1; if (p.leechN >= 8) { p.leechN = 0; heal(pct(2)); } }   // Gema sanguijuela
  if (G('m_awl') && !S._awl) { S._awl = true; let bestE = null, ba = 70;                       // Gema de punzón: el de detrás
    for (const o of S.enemies) { if (!active(o) || o === e) continue; const ex = o.x - e.x, ey = o.y - e.y, al = ex * ux + ey * uy; if (al > 0 && al - o.r < ba && Math.abs(ex * uy - ey * ux) <= o.r + 7) { ba = al - o.r; bestE = o; } }
    if (bestE) { S.stat.awl++; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: bestE.x, y2: bestE.y, t: 0, life: 0.1, col }); onHit(bestE, dmg * 0.6, ux, uy, false, col, 'player'); } S._awl = false; }
  if (G('m_timed') && !S._timed) { const tx = e.x, ty = e.y, dm = dmg * 0.5; S.timers.push({ t: 1, fn: () => { const x = active(e) ? e.x : tx, y = active(e) ? e.y : ty; S._timed = true; S.stat.timed++; explode(x, y, 36, dm, { col: C.ember, soft: true }); S._timed = false; } }); }   // Gema de mecha
  if (G('m_seed') && active(e)) addSeed(e, 1);                                                 // Gema de bellota
  if (G('m_saw') && active(e)) addBleed(e, th('blood') ? 2 : 1);                               // Gema serrada
  if (G('m_salt') && active(e)) { soak(e, 3); push(e, ux, uy, th('tide') ? 110 : 55); }        // Gema de sal
  if (G('m_star') && active(e)) light(e, 4);                                                   // Gema de lucero
  if (G('m_quick') && p.shotN % (th('mirror') ? 2 : 4) === 0 && active(e) && !S._quick) { S._quick = true; S.stat.quickb++; S.fx.push({ k: 'tracer', x1: e.x + ux * 50, y1: e.y + uy * 50, x2: e.x, y2: e.y, t: 0, life: 0.12, col: GODS.mirror.color }); hit(e, dmg * 0.5, -ux, -uy, false, GODS.mirror.color); S._quick = false; }   // Gema de azogue
  if (G('m_fire')) S.zones.push({ x: e.x, y: e.y, r: 16, life: ens('trail') ? 6 : 2, acc: 0.4, ember: 1, col: GODS.dragon.color });   // Gema incendiaria
  if (G('m_mark') && active(e)) { e.traceN = (e.traceN || 0) + 1; if (e.traceN >= 3) { e.traceN = 0; e.traced = 5; S.stat.traced++; note(e.x, e.y - e.r - 10, '¡Marcado!', C.energy); } }   // Gema de marca
  if (G('m_big') && !S._big) { S._big = true; for (const o of others(e, e.r + 22, 4)) { S.stat.splash++; hit(o, dmg * 0.5, ux, uy, false, col); } S._big = false; }   // Gema gruesa
  if (G('m_split') && !S._split) {                                                             // Gema partida
    S._split = true;
    for (const sg of [-1, 1]) { const a = Math.atan2(uy, ux) + sg * 0.75, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(e.x, e.y, rx, ry, 110);
      for (const o of S.enemies) { if (!active(o) || o === e) continue; const ex = o.x - e.x, ey = o.y - e.y, al = ex * rx + ey * ry; if (al >= 0 && al - o.r < ba && Math.abs(ex * ry - ey * rx) <= o.r + 6) { ba = Math.max(0, al - o.r); bestE = o; } }
      S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: e.x + rx * ba, y2: e.y + ry * ba, t: 0, life: 0.1, col });
      if (bestE) { S.stat.split++; onHit(bestE, dmg * 0.35 * (ens('splinter') ? 2 : 1) * (res('mirrorhall') ? 2 : 1), rx, ry, false, col, 'player'); } }
    S._split = false;
  }
  if (G('m_frag') && !active(e) && !S._frag) {                                                 // Gema de esquirlas: estalla al matar
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
  if (duoOn('warthunder') && furyFull()) { const o = others(e, 120, 1)[0]; bolt(e, o, dmg * 0.6, null); if (o && active(o)) addNeedles(o, lv('storm_passive')); }   // dúo Trueno de guerra: su rayo clava las Agujas de Conductor, que es una de sus dos técnicas
  if (G('m_chain')) {                                                                          // Gema enramada: salta al más cercano
    const o = others(e, 95, 1)[0];
    if (o) { const d = dist(e, o) || 1, ch = S._chain, last = ch && ch.segs[ch.segs.length - 1];
      if (last && Math.hypot(last.x2 - e.x, last.y2 - e.y) < 2) { ch.segs.push({ x1: e.x, y1: e.y, x2: o.x, y2: o.y }); ch.life = chainLife(ch.segs.length); }   // la cadena sigue desde el primero
      else S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.14, col: C.ink, w: 1.6 }); S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 7, t: 0, life: 0.14, col: C.ink }); S.stat.chain++; onHit(o, dmg * 0.5, (o.x - e.x) / d, (o.y - e.y) / d, false, col, 'player'); }
  }
  if (G('m_heavy') && active(e) && !e.boss) { e.kx += ux * 150; e.ky += uy * 150; }               // Gema de plomo: empuja
  if (G('m_link') && !S._linking) {                                                            // Gema eslabonada: los de al lado reciben parte del golpe
    const near = others(e, 70, 4);
    if (near.length) { S._linking = true;
      for (const o of near) { const d = dist(e, o) || 1; S.fx.push({ k: 'chain', segs: [{ x1: e.x, y1: e.y, x2: o.x, y2: o.y }], t: 0, life: chainLife(1), col, flip: 1 }); hit(o, dmg * 0.4, (o.x - e.x) / d, (o.y - e.y) / d, false, col); }
      S._linking = false; }
  }
}

// Un disparo: dedos y gema deciden cuánto y cómo; la palma decide a quién le da.
function fireBasic(target) {
  const p = S.p, g = S.gun, draw = g.action === 'a_draw';
  if (!target || !active(target)) target = nearestInRange();
  if (g.action === 'a_rota' && target) {   // Dedos de ronda: cada disparo a un enemigo distinto del anterior
    const alt = S.enemies.filter(e => active(e) && e !== p.rotaT && dist(p, e) - e.r <= rangeOf() && (overWalls() || !blocked(p, e))).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (alt) target = alt; p.rotaT = target;
  }
  if (!target && !draw) { p.cd = 0.12; p.crit = false; return; }   // tensando se puede soltar sin objetivo
  p.shotN += 1; p.trig += 1;
  p.punch = { hand: p.shotN % 2 === 0 ? 'R' : 'L', t: 0 };   // puñetazos alternos: par con la derecha, impar con la izquierda
  let mult = gunDmg();
  if (S.gun.barrel === 'b_short' && p.quick > 0) { p.quick = 0; mult *= 2; p.quickBig = true; S.stat.quick++; note(p.x, p.y - 14, '¡Presta!', C.ember, true); }   // Palma presta
  if (g.action === 'a_pend') { if (p.crit) { p.pend = Math.min(6, p.pend + 1); mult *= (1 + 0.15 * p.pend) / 1.5; } else p.pend = 0; }   // Dedos de péndulo (sustituye el 1,5 del Compás por la racha)
  if (g.mag === 'm_blood') payLife(pct(1));
  if (g.mag === 'm_gold') { if (p.gold >= 1) { p.gold -= 1; mult *= 1.35; } else mult *= 0.8; }           // Gema de oro
  if (g.action === 'a_spring' && res('deathclock') && (p.idle || 0) >= 4 && target && target.doom) fulfil(target);   // resonancia Hora señalada
  if (g.action === 'a_spring') { const k = 1 + Math.min(2, 0.5 * (p.idle || 0)); if (k > 1.4) { S.stat.spring++; note(p.x, p.y - 14, 'x' + k.toFixed(1), C.ember); } mult *= k; }   // Dedos de resorte
  let heavyAlt = false;
  if (g.action === 'a_alt') { heavyAlt = p.alt; mult *= p.alt ? 1.8 : 0.6; p.alt = !p.alt; }               // Dedos alternos
  if (g.action === 'a_combo') { if (target && target === p.comboT) p.comboN = Math.min(8, (p.comboN || 0) + 1); else p.comboN = 0; p.comboT = target; }   // Dedos de insistencia
  let kick = false;
  if (g.action === 'a_kick' && p.trig % 3 === 0) { kick = true; mult *= 2.2; if (leg('master') && target) explode(target.x, target.y, 44, p.dmg, { col: GODS.forge.color, skip: target }); if (res('anvilsong')) addTemper(2); if (ens('gambler')) addGold(3); S.stat.kick++; note(p.x, p.y - 14, '¡Trueno!', C.ember, true); S.shake = Math.max(S.shake, 6); }   // Dedos de trueno
  if (p.venge > 0) { p.venge -= 1; mult *= 2; }
  if (g.action === 'a_rota') mult *= 1.3;
  let overB = false;
  if (g.action === 'a_over' && p.overT >= 10) { p.overT = 0; overB = true; mult *= 4; S.stat.over++; note(p.x, p.y - 14, '¡Sobrecarga!', C.ember, true); S.shake = Math.max(S.shake, 6); }   // Dedos de sobrecarga
  p.lastShotT = S.t;                                                             // Brazal de rencor
  if (g.action === 'a_drum') gainFury(th('orc') ? 12 : 8);                                                  // Dedos de tambor
  if (g.action === 'a_glass' && p.trig % (th('time') ? 2 : 3) === 0 && target) { const tg = target, d0 = p.dmg * mult * 0.6, fx0 = Math.cos(p.face), fy0 = Math.sin(p.face), ox = p.x, oy = p.y; S.stat.themed++;
    S.timers.push({ t: echoDelay(1), fn: () => { if (!active(tg)) return; S.fx.push({ k: 'tracer', x1: ox, y1: oy, x2: tg.x, y2: tg.y, t: 0, life: 0.14, col: GODS.time.color, w: 1.2 }); onHit(tg, d0, fx0, fy0, false, GODS.time.color, 'echo'); } }); }   // Dedos de clepsidra
  if (g.action === 'a_nana' && p.trig % (th('dream') ? 4 : 6) === 0 && target) { const tg = target; S.stat.themed++; S.timers.push({ t: 0.05, fn: () => sleep(tg, 2) }); }   // Dedos de nana
  if (g.action === 'a_shackle' && p.trig % 4 === 0 && target && active(target)) {   // Dedos de grillete: la cadena se queda enganchada
    target.shackleT = 2; slow(target, 2, 0.7); S.stat.themed++;
    S.fx = S.fx.filter(f => f.tether !== target); S.fx.push({ k: 'chain', tether: target, segs: [], t: 0, life: 2, col: slotColor('basic') });
  }
  p.idle = 0;                       // Gema de sangre
  let lastB = false;
  if (g.mag === 'm_last') { p.clip = (p.clip || 0) + 1; if (p.clip >= 6) { lastB = true; mult *= 3; p.clip = 0; if (leg('lastword')) for (const e of S.enemies.slice()) if (active(e) && e.doom) fulfil(e); note(p.x, p.y - 14, '¡La última!', C.ember, true); S.stat.last++; } }   // Última gema
  if (p.crit) { mult *= S.plans.has('tempo') ? 2 : 1.5; S.stat.tempo++; note(p.x, p.y - 14, '¡Compás!', C.ember, true); sfx('chime', 0.4,1.25); }
  if (p.redhot > 0) mult *= 1.5;                                               // Al rojo
  if (p.broke) { p.broke = false; mult *= 3; note(p.x, p.y - 14, '¡Siete años!', GODS.mirror.color, true); }   // Siete años
  let onetwo = false;
  if (g.mag === 'm_drum') { if (p.shells === 1 && p.drumT === target && target) { mult *= 1.6; onetwo = true; S.stat.onetwo++; } p.drumT = target; }   // Gema doble: la segunda al mismo blanco pega más
  const imb = g.mag === 'm_charged' && p.trig % 5 === 0;
  if (imb) { mult *= 2.5; sfx('chime', 0.45,1); }
  if (draw) mult *= (0.6 + 1.6 * p.drawPow) * (ens('siege') && p.drawPow >= 1 && braced() ? 1.6 : 1);
  if (res('furnace')) mult *= 1 + 0.4 * p.heat;                              // resonancia Fragua viva
  const big = p.crit || imb || p.quickBig || onetwo || lastB || heavyAlt || kick || overB || (draw && p.drawPow >= 1), col = imb ? '#ffffff' : slotColor('basic');
  const reach = rangeOf() * (draw ? 0.6 + 0.4 * p.drawPow : 1);
  p.crit = false; p.quickBig = false;
  if (g.barrel !== 'b_spike' && g.action !== 'a_draw') {   // el sonido del conjuro (sin destello: el color va en los guanteletes y la cadena)
    sfx('cast', big ? 0.5 : 0.32, (big ? 0.8 : 1) + Math.random() * 0.12, 0.04);
  }
  sfx('zap', 0.3,1.2);
  if (g.action === 'a_burst') {          // Ráfaga: tres seguidos
    barrelFire(target, mult * 0.45, big, col, reach);
    for (const d of [0.07, 0.14]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { sfx('zap', 0.25,1.2); barrelFire(t2, mult * 0.45, big, col, reach); if (d > 0.1 && active(t2)) stun(t2, 0.4); } } });
  } else barrelFire(target, mult, big, col, reach);
  if (leg('zhuge') && draw) for (const d of [0.08, 0.16]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { sfx('zap', 0.25,1.35); barrelFire(t2, mult * 0.7, false, col, reach); addVenom(t2, 2); } } });
  if (leg('zhuge') && draw && target && active(target)) addVenom(target, 2);
  if (imb && target && active(target)) { S.stat.blessed++; explode(target.x, target.y, 40, p.dmg * 1.2, { col: '#ffffff' }); }   // Gema bendita
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
    if (fb3 && p.shotN % Math.max(2, 8 - fb3 * 2) === 0) addTemper(1);         // Temple
    if (g.stock === 's_geode' && target && active(target)) for (const c of S.crystals.slice(0, 4)) { const d = Math.hypot(target.x - c.x, target.y - c.y) || 1; if (d > 220) continue; S.stat.themed++; S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: target.x, y2: target.y, t: 0, life: 0.09, col: GODS.stone.color }); hit(target, p.dmg * mult * (th('stone') ? 0.4 : 0.2), (target.x - c.x) / d, (target.y - c.y) / d, false, GODS.stone.color); }   // Brazal de geoda
    if (p.redhot > 0) p.redhot -= 1;
    for (const pt of S.pets) if (target && active(target)) pt.prey = target; }  // el sabueso va a por quien disparas
  if (lastB) p.cd = Math.max(p.cd, 1.2);
  if (g.action === 'a_fin' && target && active(target) && target.hp / target.maxHp < 0.25) p.cd = Math.min(p.cd, 0.1);   // Dedos de remate
  if (kick && target && active(target)) push(target, Math.cos(p.face), Math.sin(p.face), 300);
  if (g.stock === 's_spring' && p.dodgeT <= 0 && Math.hypot(I.mx, I.my) > 0.3) {   // Brazal de muelle: saltito tras disparar
    const hopL = ens('hare') ? 48 : 24, m = Math.hypot(I.mx, I.my) / (hopL / 24); p.x += I.mx / m * 24; p.y += I.my / m * 24; S.stat.hop++;
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4); collide(p, p.r);
    S.fx.push({ k: 'ghost', x: p.x - I.mx / m * 24, y: p.y - I.my / m * 24, t: 0, life: 0.18 });
  }
  // Gema
  if (g.mag === 'm_drum') {              // dos disparos y a recargar
    p.shells -= 1;
    if (p.shells <= 0) { p.shells = 2; p.cd = periodOf() * 1.25; if (res('leadfeast')) { heal(pct(4)); p.feastShot = true; } }   // resonancia Banquete de plomo
    else p.cd = periodOf() * 0.22;
  }
  if (g.mag === 'm_belt') {              // la gema candente calienta los guanteletes
    p.heat = Math.min(1, p.heat + (g.action === 'a_rotary' ? 0.045 : 0.13)); p.heatT = 0.7;
    if (p.heat >= 1 && leg('organ')) { p.heat = 0; S.shake = Math.max(S.shake, 5); note(p.x, p.y - 16, '¡Salva!', C.ember, true); const near = S.enemies.filter(e => active(e) && dist(p, e) < rangeOf() + 40 && !blocked(p, e)); for (let i = 0; i < 11 && near.length; i++) { const e = near[i % near.length], d = dist(p, e) || 1; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: e.x, y2: e.y, t: 0, life: 0.12, col: C.ember, w: 1.5 }); if (active(e)) shot(e, p.dmg * 0.6, (e.x - p.x) / d, (e.y - p.y) / d, false, col); } }
    else if (p.heat >= 1) { p.over = 1.6; p.spin = 0; p.drawing = false; note(p.x, p.y - 16, '¡Recalentada!', C.blood, true); sfx('burn', 0.55); if (res('furnace')) explode(p.x, p.y, 70, p.dmg * 2.5, { push: 200, col: GODS.orc.color }); }
  }
  // Brazal de coz: cada disparo te aparta del enemigo
  if (g.stock === 's_recoil' && target && g.barrel !== 'b_spike' && p.dodgeT <= 0) { const d = dist(p, target) || 1; p.x -= (target.x - p.x) / d * 9; p.y -= (target.y - p.y) / d * 9; p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4); collide(p, p.r); }
}
// La palma: a quién alcanza un disparo
function barrelFire(target, m, big, col, reach) {
  const p = S.p, B = S.gun.barrel;
  const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face, ux = Math.cos(ang), uy = Math.sin(ang);
  p.face = ang;
  const { x: hx, y: hy } = heroHand(ang, p.punch ? p.punch.hand : 'R');   // lo que se ve del disparo sale del guantelete que golpea (50_sprites.js); los golpes se miden desde Alec
  const tracer = (x2, y2, w) => S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2, y2, t: 0, life: big ? 0.16 : 0.09, col, w: w || (big ? 2 : 1) });
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
    S.timers.push({ t: 0.05, fn: () => { const t2 = active(second) ? second : active(target) ? target : null; if (!t2) return; const d = dist(p, t2) || 1; S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: t2.x, y2: t2.y, t: 0, life: 0.09, col }); shot(t2, p.dmg * m * 0.55, (t2.x - p.x) / d, (t2.y - p.y) / d, big, col); } });
  } else if (B === 'b_scatter') {        // seis perdigones en abanico, con empujón
    const burnt = new Set();
    for (const off of [-0.36, -0.22, -0.07, 0.07, 0.22, 0.36]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(p.x, p.y, rx, ry, reach + 20);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 3) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col });
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
    for (const e of [near, farE]) { if (!e || !active(e)) continue; const d = dist(p, e) || 1; if (e === farE) S.stat.ends++; S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: e.x, y2: e.y, t: 0, life: 0.1, col, w: big ? 2 : 1 }); shot(e, p.dmg * m * 0.8, (e.x - p.x) / d, (e.y - p.y) / d, big, col); }
  } else if (B === 'b_boom') {           // hoz que va y vuelve
    const d0 = dist(p, target), len = Math.min(rayClip(p.x, p.y, ux, uy, reach + 20), d0 + 40), ex = p.x + ux * len, ey = p.y + uy * len;
    const pass = () => { for (const e of S.enemies.slice()) { if (!active(e)) continue; const ax = e.x - p.x, ay = e.y - p.y, al = ax * ux + ay * uy; if (al >= 0 && al <= len + e.r && Math.abs(ax * uy - ay * ux) <= 8 + e.r) { S.stat.boom++; shot(e, p.dmg * m * 0.7, ux, uy, big, col); } } };
    S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: ex, y2: ey, t: 0, life: 0.18, col: PAL.i, w: 2.4 }); pass();
    S.timers.push({ t: 0.28, fn: () => { S.fx.push({ k: 'tracer', x1: ex, y1: ey, x2: S.p.x, y2: S.p.y, t: 0, life: 0.18, col: PAL.i, w: 2.4 }); pass(); } });
  } else if (B === 'b_nail') {           // espinas: a la cuarta en el mismo enemigo, revientan
    tracer(target.x, target.y); shot(target, p.dmg * m * 0.75, ux, uy, big, col);
    if (active(target)) { target.nails = (target.nails || 0) + 1; if (target.nails >= 4) { target.nails = 0; S.stat.nail++; if (ens('rivet')) for (const o of others(target, 60, 6)) hit(o, p.dmg * m * 3, ux, uy, true, col); note(target.x, target.y - target.r - 10, '¡Revienta!', C.ember); S.fx.push({ k: 'ring', x: target.x, y: target.y, r: target.r + 10, t: 0, life: 0.18, col: C.ember }); hit(target, p.dmg * m * 3, ux, uy, true, col); } }
  } else if (B === 'b_arc') {            // salta entre cuatro
    let from = { x: hx, y: hy }, cur = target, k = 1; const seen = new Set();
    for (let i = 0; i < 4 && cur; i++) { const d = dist(from, cur) || 1; seen.add(cur); if (i) S.stat.arc++;
      S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: cur.x, y2: cur.y, t: 0, life: 0.12, col, w: 1.5 }); shot(cur, p.dmg * m * k, (cur.x - from.x) / d, (cur.y - from.y) / d, big && !i, col);
      from = cur; k *= 0.8; cur = S.enemies.filter(e => active(e) && !seen.has(e) && dist(from, e) < 100).sort((a, b) => dist(from, a) - dist(from, b))[0]; }
  } else if (B === 'b_far') {            // de lejos el doble, de cerca la mitad
    const d = dist(p, target) - target.r, k = d > reach * 0.66 ? 2 : d < reach * 0.3 ? 0.5 : 1; if (k > 1 && res('sunbeam')) for (const o of others(target, 70, 6)) light(o);   // resonancia Rayo de sol
    if (k > 1) { S.stat.far++; S.fx.push({ k: 'ring', x: target.x, y: target.y, r: 10, t: 0, life: 0.15, col: C.ink }); }
    tracer(target.x, target.y, k > 1 ? 2 : 0); shot(target, p.dmg * m * k, ux, uy, big || k > 1, col);
  } else if (B === 'b_swarm') {          // tres centellas a tres enemigos al azar
    const pool = S.enemies.filter(e => active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort(() => Math.random() - 0.5).slice(0, 3); while (pool.length < 3) pool.push(target);
    if (res('packhunt') && S.pets.length && pool[0] && active(pool[0])) { const pt = S.pets[0]; pt.x = pool[0].x + 6; pt.y = pool[0].y + 4; bite(pt, pool[0], 0.6, true); }   // resonancia Montería
    pool.forEach((e, i) => S.timers.push({ t: 0.06 * i, fn: () => { if (!active(e)) return; const d = dist(S.p, e) || 1; S.stat.swarm++; S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: e.x, y2: e.y, t: 0, life: 0.1, col }); shot(e, p.dmg * m * 0.45, (e.x - S.p.x) / d, (e.y - S.p.y) / d, false, col); } }));
  } else if (B === 'b_cluster' || B === 'b_hydra') {   // Palma de racimo (tres) y de hidra (todos, hasta seis): varias cadenas a la vez
    const inR = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && (overWalls() || !blocked(p, e))).sort((a, b) => dist(p, a) - dist(p, b));
    const tgts = [target].concat(inR.slice(0, B === 'b_cluster' ? 2 : 5)), k = B === 'b_cluster' ? 0.6 : 0.35;
    tgts.forEach((e, i) => { const d = dist(p, e) || 1; S.fx.push(S._chain = { k: 'chain', segs: [{ x1: hx, y1: hy, x2: e.x, y2: e.y }], t: 0, life: chainLife(1), col, flip: i % 2 ? 1 : -1 }); if (i) S.stat.themed++; shot(e, p.dmg * m * k, (e.x - p.x) / d, (e.y - p.y) / d, big, col); S._chain = null; });
  } else if (B === 'b_fork') {           // tres bocas: centro al objetivo, dos a los lados a lo primero que pillen
    for (const off of [0, -0.34, 0.34]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = off === 0 ? target : null, ba = off === 0 ? dist(p, target) : rayClip(p.x, p.y, rx, ry, reach + 20);
      if (off !== 0) for (const e of S.enemies) { if (!active(e) || e === target) continue; const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry; if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 9) { ba = Math.max(0, al - e.r); bestE = e; } }
      S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col, w: big ? 2 : 1 });
      if (bestE && active(bestE)) { if (off !== 0) S.stat.fork++; shot(bestE, p.dmg * m * 0.6, rx, ry, big, col); }
    }
  } else if (B === 'b_harpoon') {        // arpón: engancha y arrastra hacia ti
    tracer(target.x, target.y, 1.6); shot(target, p.dmg * m, ux, uy, big, col);
    if (res('tidalhook') && active(target)) { soak(target, 5); stun(target, 0.6); }   // resonancia Resaca
    if (active(target) && !target.boss) { const d = dist(p, target); if (d > 46) { target.kx = -ux * Math.min(420, d * 3.2); target.ky = -uy * Math.min(420, d * 3.2); target.slamCd = 0.5; S.stat.hook++; S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: target.x, y2: target.y, t: 0, life: 0.3, col: PAL.b, w: 1 }); } }
  } else if (B === 'b_flame') {          // chorro en cono: todos los de delante
    S.fx.push({ k: 'cone', x: p.x, y: p.y, a: ang, r: reach + 8, half: 0.5, t: 0, life: 0.16, col: GODS.dragon.color });
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(p, e); if (d - e.r > reach + 8 || Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) > 0.55 || blocked(p, e)) continue; S.stat.flame++; shot(e, p.dmg * m * 0.5, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), big, GODS.dragon.color); addEmber(e, 1); }
  } else if (B === 'b_back') {           // dos bocas: delante y detrás
    tracer(target.x, target.y); shot(target, p.dmg * m, ux, uy, big, col);
    const rear = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && !blocked(p, e) && (e.x - p.x) * ux + (e.y - p.y) * uy < 0).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (rear) { const d = dist(p, rear) || 1; S.stat.rear++; S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: rear.x, y2: rear.y, t: 0, life: 0.1, col }); shot(rear, p.dmg * m, (rear.x - p.x) / d, (rear.y - p.y) / d, big, col); }
  } else if (B === 'b_flail') {          // mangual: lanzas la bola y tarda en volver
    S.fx.push({ k: 'tracer', x1: hx, y1: hy, x2: target.x, y2: target.y, t: 0, life: 0.25, col: PAL.I, w: 2 }); p.orbAway = 1; S.stat.flail++;
    shot(target, p.dmg * m * 1.5, ux, uy, true, col);
  } else if (B === 'b_bomb') {           // orbe por lo alto: pasa por encima de los muros y revienta en área
    const tx = target.x, ty = target.y, fl = 0.2 + dist(p, target) / 520, dm = p.dmg * m * 0.8;
    S.fx.push({ k: 'lob', x1: hx, y1: hy, x2: tx, y2: ty, t: 0, life: fl, col: '#3a3440' });
    S.fx.push({ k: 'ring', x: tx, y: ty, r: 16, t: 0, life: fl, col: C.ember });
    S.timers.push({ t: fl, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: leg('monsmeg') ? 68 : 44, t: 0, life: 0.28, col: C.ember }); S.shake = Math.max(S.shake, big ? 5 : 3); sfx('boom', 0.45,0.9);
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
  } else {                               // palma de fragua o palma presta: un disparo a un enemigo
    if (B === 'b_icicle' && target.frozen > 0) m *= 1.3;
    if (B === 'b_drill') { if (target === p.drillT) p.drillN = Math.min(10, p.drillN + 1); else p.drillN = 0; p.drillT = target; m *= 1 + 0.15 * p.drillN; }   // Palma de berbiquí
    if (B === 'b_net') { m *= 0.65; if ((target.netCd || 0) <= S.t) { target.netCd = S.t + 3; S.stat.net++; root(target, 0.9); } }   // Palma de red
    const far = B === 'b_long' && dist(p, target) - target.r > reach * 0.5;
    if (far) S.fx.push({ k: 'ring', x: target.x, y: target.y, r: 9, t: 0, life: 0.15, col: C.ink });
    S.fx.push(S._chain = { k: 'chain', segs: [{ x1: hx, y1: hy, x2: target.x, y2: target.y }], t: 0, life: chainLife(1), col, flip: p.shotN % 2 ? 1 : -1 });   // la cadena sale del puño (50a_chain.js)
    shot(target, p.dmg * m * (far ? 1.4 : 1), ux, uy, far || big, col); S._chain = null;
    if (active(target)) {                // palmas temáticas: lo suyo, aunque no lleves a esa deidad
      if (B === 'b_blow') { addVenom(target, 1); S.stat.themed++; }
      if (B === 'b_wyrm') { addEmber(target, 1); S.stat.themed++; }
      if (B === 'b_rod') { addNeedles(target, th('storm') ? 2 : 1); S.stat.themed++; if (target.needles >= (leg('tempest') ? 3 : 6)) discharge(target, 1, null); }   // con Sobrecarga, a las 6 ya se han descargado solas y aquí no queda nada
      if (B === 'b_icicle') { addFrost(target, th('frost') ? 2 : 1); S.stat.themed++; }
    }
    if (B === 'b_long') {                // Remate: si mata, el disparo sigue
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
  p.dodgeT = d / (p.speed * T.dodge.mult); p.inv = Math.max(p.inv, p.dodgeT + 0.06); sfx('dodge', 0.35);
  p.dodgeFrom = { x: p.x, y: p.y }; p.dodgeHit = new Set(); p.isLunge = true; p.fly = false; p.danced = false;
}

// ───────────────────────── Esquive ─────────────────────────
function startDodge(a, free) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.fly = lv('dragon_dodge') > 0;                                           // Vuelo: salto largo por encima de las columnas
  p.dodgeT = T.dodge.time * (p.fly ? 1.8 : 1) * (G('s_light') ? 1.3 : 1) * (G('s_roll') ? 0.65 : 1); p.inv = Math.max(p.inv, p.dodgeT + 0.06); sfx('dodge', 0.35);
  p.danced = false; p.lastDodgeT = S.t; p.dodgeFrom = { x: p.x, y: p.y }; p.isLunge = false; p.dodgeHit = new Set(); p.drawing = false; p.lanceDmg = 0;
  if (!free) { p.dodgeN -= 1; if (p.windup > 0) { p.windup = 0; p.cd = 0.1; } p.charging = false; p.charge = 0; }
  sfx('dodge', 0.35,1.2);
  if (G('a_rider') && !free) { const tg = nearestInRange(); if (tg) { S.stat.rider++; barrelFire(tg, gunDmg() * 1.3, true, slotColor('basic'), rangeOf()); } }   // Dedos de jinete
  if (lv('stone_dodge') || (G('s_geode') && !free)) addCrystal(p.x, p.y);                              // Geoda
  const td = lv('time_dodge'), sd = lv('shade_dodge');
  if (td) S.fields.push({ x: p.x, y: p.y, r: 80, life: 2 + td, life0: 2 + td });   // Hora muerta
  if (sd) raiseShade(p.x, p.y, 3 + sd, true);                               // Relevo
  { const ed = lv('end_dodge'); if (ed) for (const e of S.enemies) if (active(e) && e.doom && dist(p, e) < 130) { e.doom.t -= 2; heal(pct(ed)); } }   // Pasar página
  const ld = lv('luck_dodge');
  if (ld && !free) {                                                        // Cara o cruz
    if (duoOn('toss')) heal(pct(5));                                             // dúo Propina
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
      for (const e of S.enemies.slice()) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 50 + e.r) { const d = Math.hypot(e.x - from.x, e.y - from.y) || 1; bite(pt, e, 0.8 * bd3, true); if (active(e)) { push(e, (e.x - from.x) / d, (e.y - from.y) / d, 200); if (duoOn('bloodhound')) { addBleed(e, 2); heal(pct(2)); } } } }   // Manada (y dúo Rastro de sangre)
    if (fd3 && !p.isLunge) p.redhot = 1 + fd3; }                              // Al rojo
  { const ld2 = lv('light_dodge'), dd2 = lv('dream_dodge'), vd2 = lv('void_dodge');
    if (ld2 && !p.isLunge) { S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 90, t: 0, life: 0.3, col: GODS.light.color }); for (const e of S.enemies.slice()) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 90 + e.r) { light(e); hit(e, p.dmg * 0.5 * ld2, 0, 0, false, GODS.light.color); } }   // Resplandor
    if (dd2 && !p.isLunge) S.zones.push({ x: from.x, y: from.y, r: 44, life: 2 + dd2, acc: 0.4, sleepOnce: new Set(), col: GODS.dream.color });   // Polvo de sueño
    if (vd2 && !p.isLunge) addWell(from.x, from.y, 62, 1 + vd2, 0, 0, { stunC: duoOn('funnel') }); }   // Hueco (y dúo Embudo)
  { const fd = lv('frost_dodge'); if (fd && !p.isLunge) S.zones.push({ x: from.x, y: from.y, r: 40, life: 4, acc: 0.4, frost: fd, col: GODS.frost.color }); }   // Paso de hielo
  if (p.fly && dd) explode(p.x, p.y, 52, p.dmg * 1.5 * dd, { col: GODS.dragon.color, zap: duoOn('comet') });   // Vuelo (y dúo Cometa)
  if (S.plans.has('echo') && !p.isLunge) S.turrets.push({ x: from.x, y: from.y, life: 3, cd: 0.15 });        // Guantelete gemelo
  if (!p.isLunge) { if (G('s_light')) { p.cd = 0; p.windup = 0; } if (G('b_short')) { p.quick = 1.2; p.cd = 0; } }   // Brazal de pluma / Palma presta: sales del esquive con los guanteletes listos
  p.dodgeFrom = null; p.fly = false; p.lanceDmg = 0;
}
// Lo que pasa al atravesar a un enemigo con el esquive
function dashThrough(e) {
  const p = S.p, od = lv('orc_dodge'), fd = lv('feast_dodge'), rd = lv('storm_dodge');
  if (G('s_dance') && !p.danced) { p.danced = true; p.dodgeN = Math.min(dodgeMax(), p.dodgeN + 1); note(p.x, p.y - 18, '¡Otra!', C.energy); }   // Brazal de bailarín
  if (G('s_spikes') && active(e)) { S.stat.spk++; hit(e, p.dmg * 1.5, p.dvx, p.dvy, true, C.ink); stun(e, 0.5); }   // Brazal de púas
  if (p.lanceDmg) { hit(e, p.lanceDmg, p.dvx, p.dvy, true, C.energy); if (active(e)) chargePayoff(e); }      // carga de la lanza
  if (rd && active(e)) { if (e.needles > 0) { const n = discharge(e, 0.8 + 0.2 * (rd - 1), null); if (duoOn('toast')) heal(pct(2 * n)); } else addNeedles(e, 2); }   // Paso relámpago (y dúo Brindis eléctrico)
  if (fd && active(e)) { hit(e, p.dmg * 0.6 * fd, p.dvx, p.dvy, false, GODS.feast.color); heal(pct(3 * fd)); }   // Brindis
  { const bd2 = lv('blood_dodge'); if (bd2 && active(e)) { hit(e, p.dmg * 0.6 * bd2, p.dvx, p.dvy, false, GODS.blood.color); heal(pct(4 * bd2)); } }   // Transfusión
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
    if (dc2 && active(e)) { if (e.sleep > 0 || e.doze > 0) { if (duoOn('digest')) addReserve(4); S._night = true; hit(e, p.dmg * 0.6, 0, 0, true, GODS.dream.color); S._night = false; }
      else if (e.wokeT === S.t) { if (duoOn('digest')) addReserve(4); hit(e, p.dmg * 0.6 * (1 + 0.8 * dc2), 0, 0, true, GODS.dream.color); }   // el propio cargado lo acaba de despertar: el golpe extra entra igual
      else sleep(e, 2); } }   // Pesadilla (y dúo Digestión)
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
      sfx('tick', 0.25,1.3);
      for (const e of S.enemies.slice()) { if (!active(e) || Math.hypot(e.x - tx, e.y - ty) > R + e.r) continue; hit(e, dmg * 0.45, 0, 0, w === 0, col); if (w === 0) chargePayoff(e); }
    } });
  } else if (CH === 'c_supp') {          // supresión: tres segundos disparando sola a todo lo que haya cerca
    if (!echo) { p.heat = 0; p.over = 0; }
    for (let i = 0; i < 36; i++) S.timers.push({ t: 0.08 * i, fn: () => {
      const near = S.enemies.filter(e => active(e) && dist(o, e) - e.r <= rangeOf() && !blocked(o, e));
      if (!near.length) return;
      const e = near[Math.floor(Math.random() * near.length)], dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 1;
      S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: e.x, y2: e.y, t: 0, life: 0.07, col });
      if (i % 6 === 0) sfx('zap', 0.2,1.3);
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
    if (res('eventide')) addWell(tx, ty, 100, 1, 0, 0);                    // resonancia Horizonte de sucesos
    S.fx.push({ k: 'lob', x1: tx + 60, y1: ty - 160, x2: tx, y2: ty, t: 0, life: 1, col: '#3a3440' });   // la roca, cayendo
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
      S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: near.x, y2: near.y, t: 0, life: 0.08, col }); if (i % 2 === 0) sfx('zap', 0.22,1.25);
      if (echo) hit(near, dmg * 0.2, (near.x - o.x) / d, (near.y - o.y) / d, false, col); else shot(near, dmg * 0.2, (near.x - o.x) / d, (near.y - o.y) / d, false, col); if (i === 0) chargePayoff(near);
      if (leg('choir') && !echo) S.timers.push({ t: 0.8, fn: () => { if (!active(near)) return; S.stat.choir++; S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: near.x, y2: near.y, t: 0, life: 0.12, col: GODS.time.color }); onHit(near, dmg * 0.15, (near.x - o.x) / d, (near.y - o.y) / d, false, GODS.time.color, 'echo'); } }); } });
  } else if (CH === 'c_mine') {          // tres minas a tu alrededor
    for (let i = 0; i < 3; i++) { const a = snap.dir + Math.PI + (i - 1) * 1.1, at = unstick(clamp(o.x + Math.cos(a) * 34, 10, T.room.w - 10), clamp(o.y + Math.sin(a) * 34, 10, T.room.h - 10)); S.mines.push({ x: at.x, y: at.y, life: 12, dmg: dmg * 0.9, col }); }
  } else if (CH === 'c_nova') {          // onda que aparta
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 120, t: 0, life: 0.35, col }); S.shake = Math.max(S.shake, 7);
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(o, e) || 1; if (d > 120 + e.r) continue; strike(e, dmg * 0.7, (e.x - o.x) / d, (e.y - o.y) / d); if (active(e)) { if (leg('winter')) freeze(e); push(e, (e.x - o.x) / d, (e.y - o.y) / d, 380); } }
  } else if (CH === 'c_turret') {        // centinela: un guantelete gemelo clavado en el suelo
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
  sfx('charged', 0.6);
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
    note(p.x, p.y - 20, 'Dado: ' + die, die >= 5 ? RAR[3].color : GODS.luck.color, true); sfx('tick', 0.4, 0.8 + die * 0.12);
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
  if (p.snipeRefund) { p.snipeRefund = false; p.chargeCd = 0.15; }   // Brasa de verdugo
  S.shake = Math.max(S.shake, 4 + 4 * ratio);
  sfx('hurt', 0.7);
}

function hurtPlayer(dmg) {
  const p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  if (G('s_shield') && (p.wardCd || 0) <= 0) { p.wardCd = 6; p.inv = 0.4; S.stat.block++; note(p.x, p.y - 18, '¡Parado!', C.energy, true); sfx('block', 0.5); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 18, t: 0, life: 0.2, col: C.energy }); return; }   // Brazal con rodela
  if (duoOn('luckglass') && Math.random() < 1 / 3) { p.inv = 0.4; note(p.x, p.y - 18, 'Lo paga el Reflejo', GODS.mirror.color, true); return; }   // dúo Espejo de la suerte
  sfx('hurt', 0.7);
  p.streak = 0;                                                               // Racha: se pierde al recibir un golpe (no si lo para la rodela o se lo lleva el Reflejo)
  { const mp = lv('mirror_passive'); if (mp) explode(p.x, p.y, 64, p.dmg * mp, { col: GODS.mirror.color }); }   // Azogue
  if (G('s_tower')) dmg *= 0.7;                                               // Brazal de torre
  if (G('s_anchor') && p.charging) dmg *= 0.5;                                // Brazal de ancla
  if (G('s_venge')) p.venge = 3;                                              // Brazal de rencor
  if (has('q_break')) p.broke = true;
  if (!mastery('forge')) p.temper = Math.floor(p.temper / 2);
  dmg *= (1 - 0.05 * tk('skin')) * (has('m_skin') ? 0.9 : 1) * (1.2 + 0.3 * (S.world - 1));
  if (p.reserve > 0) { const a = Math.min(pct(p.reserve), dmg); p.reserve -= toPts(a); dmg -= a; }   // la Reserva hace de escudo
  p.hp -= dmg; p.inv = 0.5; S.hurtFx = 0.35;
  if (G('s_wind') && !S.windUsed && p.hp > 0 && p.hp < p.maxHp * 0.3) { S.windUsed = true; S.stat.wind++; heal(p.maxHp * 0.2); note(p.x, p.y - 20, '¡Segundo aire!', '#8fe08a', true); }   // Brazal de segundo aire
  if (p.hp <= 0 && lv('blood_passive') && !S.debtUsed) { S.debtUsed = true; p.hp = 1; p.inv = 1; note(p.x, p.y - 20, '¡Deuda!', GODS.blood.color, true); }   // Deuda: el primer golpe mortal de la sala no te mata
  S.shake = Math.max(S.shake, 6);
  gainFury(15);
  sfx('hurt', 0.75,0.8);
  if (p.hp <= 0 && p.revive > 0) {   // Segundo aliento
    p.revive -= 1; p.hp = Math.round(p.maxHp * (0.1 + 0.2 * tk('revive'))); p.inv = 1.5;
    note(p.x, p.y - 18, 'Segundo aliento', C.ember, true); sfx('heal', 0.6);
  } else if (p.hp <= 0) { p.hp = 0; endRun(false); setMode('dead'); }
}

// ───────────────────────── Jefes ─────────────────────────
// Cada jefe tiene un kit de ataques con aviso. Si embiste contra una columna se queda aturdido y recibe el doble.
function bossAI(e, dt, d, ux, uy) {
  const p = S.p, B = e.type, frac = e.hp / e.maxHp, ph = B.phases > 2 && frac < 0.33 ? 3 : frac < 0.55 ? 2 : 1;
  if (ph > e.ph) {
    e.ph = ph; S.shake = 9; note(e.x, e.y - e.r - 14, B.name + ' se enfurece', C.blood, true); sfx('roar', 0.7);
    for (let i = 0; i < 2 + ph; i++) spawn(B.sum === 'brute' && i > 0 ? 'runner' : B.sum);
  }
  const rest = t => { e.act = 'rest'; e.at = t / (ph > 1 ? 1.3 : 1); };
  const ring = (off, n, sp) => { for (let i = 0; i < n; i++) { const a = off + i * Math.PI * 2 / n; S.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 4, dmg: 12, life: 4.5 }); } sfx('eshot', 0.3,0.9); };
  e.at -= dt;
  if (e.act === 'slam') {
    if (e.at <= 0) { S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 78, t: 0, life: 0.3, col: C.blood }); S.shake = Math.max(S.shake, 7); sfx('boom', 0.6,0.75); if (d < 78 + p.r) hurtPlayer(B.dmg); rest(0.7); }
  } else if (e.act === 'chargeWind') {
    if (e.at <= 0) { e.act = 'charge'; e.at = 0.55; e.hitOnce = false; }
  } else if (e.act === 'charge') {
    e.x += e.lvx * dt; e.y += e.lvy * dt;
    if (!e.hitOnce && dist(e, p) < e.r + p.r + 3) { e.hitOnce = true; hurtPlayer(B.dmg + 5); }
    if (touchesWall(e, e.r + 1)) { e.act = 'dazed'; e.at = 1.8; S.shake = 9; note(e.x, e.y - e.r - 14, '¡Aturdido!', C.ink, true); sfx('crack', 0.5,0.7); }
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
    else if (a === 'fan') { e.act = 'cast'; e.at = 0.5; e.castFn = () => { const vol = () => { const b = Math.atan2(p.y - e.y, p.x - e.x); for (let i = -2; i <= 2; i++) S.shots.push({ x: e.x, y: e.y, vx: Math.cos(b + i * 0.17) * 150, vy: Math.sin(b + i * 0.17) * 150, r: 4, dmg: 12, life: 4 }); sfx('eshot', 0.3,1.05); }; vol(); for (let i = 1; i < ph + 1; i++) S.timers.push({ t: 0.28 * i, fn: () => { if (active(e)) vol(); } }); }; }
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
  if (S.dialog) { talkUpdate(dt); return; }   // hablando con alguien (el buhonero, los aldeanos): todo espera
  S.shake = Math.max(0, S.shake - dt * 22);
  S.hurtFx = Math.max(0, S.hurtFx - dt);
  S.noTarget = Math.max(0, S.noTarget - dt);
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  if (S.timers.length) { const due = []; for (const tm of S.timers) { tm.t -= dt; if (tm.t <= 0) due.push(tm); } S.timers = S.timers.filter(tm => tm.t > 0); for (const tm of due) tm.fn(); }

  navUpdate(dt);
  // Red de seguridad: si nadie recibe daño en 25 s y no queda nadie por llegar, los que quedan reaparecen a la vista
  if (S.enemies.length && !S.queue.length && S.t - (S.lastHitT || 0) > 25 && S.t - (S.roomT || 0) > 25) {
    S.lastHitT = S.t;
    for (const e of S.enemies) { if (e.boss || e.type.post || (e.camp && e.camp.hp > 0)) continue; let at = null; for (let i = 0; i < 12; i++) { const c = freeSpot(p, 70); if (dist(c, p) < 190 && !blocked(c, p)) { at = c; break; } } if (at) { e.x = at.x; e.y = at.y; e.spawn = 0.65; e.kx = e.ky = 0; e.leapT = 0; e.fling = 0; } }
  }

  // Oleadas
  S.waveT += dt;
  while (S.queue.length && S.queue[0].at <= S.waveT) { const q = S.queue.shift(); spawn(q.type, q); }
  if (S.keep) S.keep.flash = Math.max(0, S.keep.flash - dt);
  if (!S.pendingLoot && S.pendingXp > 0) { S.pendingXp--; pickQueue = [xpScreen]; S.rerolls = 0; afterPicks = resumePlay; advancePick(); return; }
  if (S.pendingLoot) { S.pendingLoot = false; pickQueue = [pieceScreen(lootGod(), 'Estandarte derribado · bajo él había una reliquia')]; S.rerolls = tk('reroll'); afterPicks = resumePlay; advancePick(); return; }
  coinsUpdate(dt); chestsUpdate(dt); if (S.calm) calmUpdate(dt);
  if (!S.queue.length && !S.enemies.length && !S.calm) {
    S.waveClear += dt;
    if (S.waveClear > (S.bossRoom ? GODFALL_T + 0.4 : 0.7)) { S.waveClear = 0; S.shots.length = 0; S.zones.length = 0; S.timers.length = 0; S.hazards.length = 0; S.lasers.length = 0; roomCleared(); return; }
  }

  // Temporizadores y recursos
  p.cd = Math.max(0, p.cd - dt);
  if (p.punch) p.punch.t += dt;
  p.chargeCd = Math.max(0, p.chargeCd - dt); p.inv = Math.max(0, p.inv - dt); p.buffer = Math.max(0, p.buffer - dt);
  const ready = p.cd <= 0 && p.windup <= 0;
  if (ready && !p.wasReady) { p.readyT = S.t; }
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
    if (bestE) { S.lock = bestE; sfx('tick', 0.2,1.4); }
  }
  if (am < 0.3) aimLatch = false;
  const target = (S.lock && dist(p, S.lock) - S.lock.r <= rangeOf() && (overWalls() || !blocked(p, S.lock))) ? S.lock : nearestInRange();
  S.target = target;

  // Disparo cargado
  if (I.chg && !p.charging && !p.drawing && p.chargeCd <= 0 && p.dodgeT <= 0 && p.windup <= 0) { p.charging = true; p.charge = 0; p.chargeDir = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face; }
  if (p.charging) {
    const before = p.charge; p.charge += dt * (1 + 0.1 * tk('armorer'));
    if (before < T.charge.full && p.charge >= T.charge.full) sfx('chime', 0.3,1.4);
    if (am > 0.35) p.chargeDir = Math.atan2(I.ay, I.ax);
    else if (target) p.chargeDir = Math.atan2(target.y - p.y, target.x - p.x);
    p.face = p.chargeDir;
    if (!I.chg) { if (p.charge >= T.charge.min) fireCharged(am); p.charging = false; p.charge = 0; }
  }

  // Disparo básico: cada disparo es un gesto corto que te frena
  if (I.atkP) { if (p.cd > T.buffer) p.spoil = true; p.buffer = T.buffer; if (!target) S.noTarget = 0.25; }
  const g = S.gun, A = g.action, want = p.buffer > 0 || I.atk || A === 'a_auto';
  if (p.over > 0) p.over -= dt;
  p.runUp = g.action === 'a_semi' && p.still < 0.25 ? Math.min(1, p.runUp + dt / 3) : 0;   // Dedos de chispa: carrerilla
  { // El aspecto de Alec crece con lo que lleva encima en esta misión
    const pow = SLOT_KEYS.reduce((n, k) => n + (S.build[k] ? S.build[k].lvl : 0), 0) + S.techs.size + S.plans.size, tier = pow >= 12 ? 4 : pow >= 7 ? 3 : pow >= 3 ? 2 : 1;
    // Poder: cada nivel de técnica que llevas y cada técnica suelta o plano suma un 5% a todo tu daño
    const pm = 1 + POW_STEP * pow, pm0 = p.powMul || 1;
    if (pm !== pm0) { p.dmg *= pm / pm0; p.powMul = pm; if (pm > pm0 && S.t > 0.5) note(p.x, p.y - 34, '+' + Math.round((pm - pm0) * 100) + '% de daño', C.ember, true); }
    if (tier !== p.tier) { if (tier > (p.tier || 1)) { note(p.x, p.y - 26, ['', '', 'Alec se enciende', 'Alec se alza', 'Alec, el sin dios'][tier], C.energy, true); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 40, t: 0, life: 0.5, col: C.energy }); sfx('fanfare', 0.5,1.1); } p.tier = tier; }
  }
  p.wardCd = Math.max(0, (p.wardCd || 0) - dt);
  p.fly2 = S.gun.action === 'a_fly' && S.t - p.lastShotT < 1.5 ? Math.min(1, p.fly2 + dt / 5) : 0;   // Dedos de volante
  if (S.gun.action === 'a_over') { const was = p.overT; p.overT = Math.min(10, p.overT + dt); if (was < 10 && p.overT >= 10) { note(p.x, p.y - 16, 'Sobrecarga lista', C.ember); sfx('chime', 0.35,1.1); } }
  if (p.cd <= 0 && p.windup <= 0) p.idle = (p.idle || 0) + dt;   // tiempo con los guanteletes listos (Dedos de resorte, Brazal de corredor)
  if (g.barrel === 'b_flail') {   // Palma de mangual: la bola gira y golpea lo que toca
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
  // La manada: cada perro va a por la presa (quien disparas) por su lado y muerde. Crece con la Caza.
  { const n = petN(), k = biteK(); while (S.pets.length < n) S.pets.push({ x: p.x + 12, y: p.y + 8, cd: 0.5 + 0.13 * S.pets.length, prey: null, dir: 0, st: 0 }); S.pets.length = n;
    packWatch();
    S.pets.forEach((pt, i) => {
      pt.st = packStage(i);
      if (!pt.prey || !active(pt.prey)) { pt.prey = null; let bd = 170; for (const e of S.enemies) { if (!active(e)) continue; const d = dist(p, e); if (d < bd) { bd = d; pt.prey = e; } } }
      const a = i * 2.4 + 0.6, pr = pt.prey, gx = pr ? pr.x + Math.cos(a) * (pr.r + 10) : p.x + Math.cos(a) * 17, gy = pr ? pr.y + Math.sin(a) * (pr.r + 10) * 0.8 : p.y + 8 + Math.sin(a) * 10;
      const dx = gx - pt.x, dy = gy - pt.y, d = Math.hypot(dx, dy) || 1;
      if (d > 1.5) { const sp = Math.min(d, (pt.st === 2 ? 210 : 150) * dt); pt.x += dx / d * sp; pt.y += dy / d * sp; }
      pt.dir = pr ? pr.x - pt.x : dx; pt.run = d > 3;
      if (dist(pt, p) > 300) { pt.x = p.x; pt.y = p.y; }
      pt.cd -= dt * (duoOn('warhound') && furyFull() ? 2 : 1);
      if (pr && dist(pt, pr) <= pr.r + 15 && pt.cd <= 0) { pt.cd = 0.8; bite(pt, pr, k); }
    }); }
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
  for (const mn of S.mines) {     // minas de la Brasa de minas
    mn.life -= dt;
    if (S.enemies.some(e => active(e) && !e.type.fly && Math.hypot(e.x - mn.x, e.y - mn.y) < e.r + 9)) { mn.life = 0; S.stat.mine++; if (res('thornmine')) S.zones.push({ x: mn.x, y: mn.y, r: 40, life: 4, acc: 0.4, slow: 0.5, dmg: p.dmg * 0.25, bram: true, col: GODS.wood.color }); explode(mn.x, mn.y, 50, mn.dmg, { col: mn.col, payoff: true }); }
  }
  S.mines = S.mines.filter(mn => mn.life > 0);
  p.quick = Math.max(0, p.quick - dt); p.buttCd = Math.max(0, p.buttCd - dt);
  if (g.stock === 's_heavy' && p.buttCd <= 0 && p.dodgeT <= 0) {   // Brazal herrado: codazo a quien se pegue
    const near = S.enemies.filter(e => active(e) && !e.boss && dist(p, e) < p.r + e.r + 9);
    if (near.length) {
      p.buttCd = 2.5; S.stat.butt++; S.shake = Math.max(S.shake, 4); sfx('crit', 0.45,0.8); note(p.x, p.y - 16, '¡Codazo!', C.ember, true);
      S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 26, t: 0, life: 0.18, col: C.ink });
      for (const e of near) { const d = dist(p, e) || 1; hit(e, p.dmg * 0.8, (e.x - p.x) / d, (e.y - p.y) / d, true, C.ink); if (active(e)) { e.kx += (e.x - p.x) / d * 300; e.ky += (e.y - p.y) / d * 300; stun(e, 0.6); } }
    }
  }
  p.heatT -= dt; if (p.heatT <= 0) p.heat = Math.max(0, p.heat - dt * 0.45);
  const canFire = p.over <= 0 && !p.charging && p.dodgeT <= 0;
  if (A === 'a_hold') {   // Dedos de retén: guardar hasta tres disparos y soltarlos
    if (I.atk && canFire && p.cd <= 0) { p.drawing = true; p.draw = Math.min(1, p.draw + dt / (periodOf() * 2.2)); if (target) p.face = Math.atan2(target.y - p.y, target.x - p.x); }
    else if (p.drawing) {
      p.drawing = false; const n = 1 + Math.floor(p.draw * 2 + 0.001); p.draw = 0; p.cd = periodOf() * 0.5; S.stat.hold = (S.stat.hold || 0) + n;
      for (let i = 0; i < n; i++) S.timers.push({ t: 0.09 * i, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) fireBasic(t2); } });
    }
  } else if (A === 'a_draw') {   // De tensado: mantener para tensar, soltar para disparar
    if (I.atk && !p.drawing && p.cd <= 0 && canFire) { p.drawing = true; p.draw = 0; }
    if (p.drawing) {
      const before = p.draw; p.draw = Math.min(1, p.draw + dt / (periodOf() * 0.85));
      if (before < 1 && p.draw >= 1) sfx('chime', 0.3,1.5);
      if (target) p.face = Math.atan2(target.y - p.y, target.x - p.x);
      if (!I.atk) { p.drawing = false; p.drawPow = p.draw; p.cd = periodOf() * 0.3; fireBasic(target); }
    }
  } else if (A === 'a_rotary') {   // Giratorio: girar y escupir
    if (I.atk && canFire) {
      const was = p.spin; p.spin = Math.min(1, p.spin + dt / 0.5);
      if (was < 1 && p.spin >= 1) sfx('chime', 0.3,0.9);
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
    if (A === 'a_fin' && target.hp / target.maxHp < 0.25) p.windupTotal = p.windup = 0.03;   // Dedos de remate: sin frenazo   // Palma presta: el golpe tras esquivar no tiene frenazo
    p.windupTarget = target; p.cd = period; p.buffer = 0;
    if (A === 'a_fuse') { p.windup = 0; const tg = target; S.fx.push({ k: 'clock', x: p.x, y: p.y, t: 0, life: 0.5 }); S.timers.push({ t: 0.5, fn: () => { if (S.p.dodgeT <= 0) { fireBasic(tg); if (res('lullaby') && tg && active(tg)) sleep(tg, 3); } } }); }   // Dedos de rescoldo: sale sola medio segundo después
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
  if (g.stock === 's_sprint' && (p.idle || 0) > 2) mult *= 1.35;                // Brazal de corredor
  if (g.stock === 's_gasp' && p.hp < p.maxHp * 0.25) mult *= 1.3;              // Brazal del último aliento
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

  // Guanteletes gemelos
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
      if (obs && d < 42) addEmber(e, 1);                                   // dúo Filo de obsidiana
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
    e.doze = Math.max(0, (e.doze || 0) - dt);
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
    if (duoOn('reef') && Math.hypot(e.kx, e.ky) > slamV(e)) for (const c of S.crystals) if (Math.hypot(e.x - c.x, e.y - c.y) < e.r + 8) reef = c;   // dúo Arrecife
    if (e.slamCd <= 0 && !e.boss && Math.hypot(e.kx, e.ky) > slamV(e) && (reef || touchesWall(e, e.r + 1.5) || e.x < e.r + 3 || e.y < e.r + 3 || e.x > T.room.w - e.r - 3 || e.y > T.room.h - e.r - 3)) {   // empujado contra un muro
      e.slamCd = 0.9; const kx = e.kx, ky = e.ky, kl = Math.hypot(kx, ky); e.kx = e.ky = 0;
      wallSlam(e, kx / kl, ky / kl, reef);
      if (e.hp <= 0) continue;
    }
    const damp = 1 - Math.min(1, dt * 12); e.kx *= damp; e.ky *= damp;
    e.autoCd = Math.max(0, e.autoCd - dt); e.mark = Math.max(0, e.mark - dt);
    if (e.slowT > 0) e.slowT -= dt; else e.slowF = 1;
    if (e.shackleT > 0) e.shackleT -= dt;
    if (e.iceT > 0) e.iceT -= dt;   // la marca de la Gema de escarcha caduca con su frenado
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
      { const dp = dist(p, e); if (dp < CAMP_AGGRO) e.alert = true; else if (dp > CAMP_LEASH) e.alert = false; }
      if (e.alert && e.aiCd <= 0) { e.aiCd = 6; if (S.enemies.length + S.queue.length < 19) { const pool = WORLDS[S.world - 1].pool.filter(k => TYPES[k].cost <= 2.5); for (let i = 0; i < 2; i++) S.queue.push({ type: pool[Math.floor(Math.random() * pool.length)], at: S.waveT + 0.2 * i, near: e, camp: e }); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 30, t: 0, life: 0.4, col: C.blood }); sfx('roar', 0.3,1.5); } }
      continue;
    }
    if (e.stun > 0) { e.stun -= dt; continue; }
    if (e.sleep > 0) { e.sleep -= dt; if (e.sleep <= 0) wake(e); continue; }   // dormido: ni se mueve ni ataca
    if (e.camp && e.camp.hp > 0 && !e.camp.alert) {   // guarda de un campamento tranquilo: vuelve a su sitio y espera
      const gx = e.camp.x + e.hx - e.x, gy = e.camp.y + e.hy - e.y, gd = Math.hypot(gx, gy);
      if (gd > 6) { const s2 = e.speed * 0.6; e.x += gx / gd * s2 * dt; e.y += gy / gd * s2 * dt; e.dir = Math.atan2(gy, gx); }
      continue;
    }
    const sp = e.speed * (e.slowT > 0 ? e.slowF : 1);
    if (e.raid && S.keep) {             // asaltante: va a por la campana de la aldea y la golpea
      const k = S.keep, kx = k.x - e.x, ky = k.y - e.y, kd = Math.hypot(kx, ky) || 1; e.dir = Math.atan2(ky, kx);
      if (kd > k.r + e.r + 3) { e.x += kx / kd * sp * dt; e.y += ky / kd * sp * dt; }
      else { e.raidCd = (e.raidCd || 0.6) - dt; if (e.raidCd <= 0) { e.raidCd = 1.3; k.hp -= Math.max(2, e.dmg * 0.28); k.flash = 0.15; S.shake = Math.max(S.shake, 2); sfx('crack', 0.4); if (k.hp <= 0) { missionFail('La campana ha caído y la aldea con ella.'); return; } } }
      continue;
    }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (e.lungeWind <= 0 && e.lungeT <= 0) e.dir = Math.atan2(dy, dx);
    if (e.boss) { bossAI(e, dt * (e.slowT > 0 ? e.slowF : 1), d, ux, uy); continue; }
    if (e.type.ai) { enemyAI(e, dt * (e.slowT > 0 ? e.slowF : 1), d, ux, uy, e.speed); continue; }
    if (e.type.ranged) {
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) { S.shots.push({ x: e.x, y: e.y, vx: ux * 125, vy: uy * 125, r: 4, dmg: e.dmg, life: 3.5 }); e.cool = 2.4; sfx('eshot', 0.25,1); }
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
      if (e.wind <= 0) { S.fx.push({ k: 'slash', x: e.x + ux * (e.r + 8), y: e.y + uy * (e.r + 8), a: Math.atan2(uy, ux), row: e.champ ? VFX.slashVoid : VFX.slashFire, t: 0, life: 0.28 }); if (d < e.r + p.r + e.type.reach) hurtPlayer(e.dmg); e.rec = 0.55; }
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
      if (h.t <= 0) { h.done = true; h.life = h.linger || 0; h.acc = 0; S.fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, t: 0, life: 0.25, col: h.col }); sfx('boom', 0.35,1.1); if (dist(p, h) < h.r + p.r) hurtPlayer(h.dmg); }
    } else { h.life -= dt; h.acc += dt; if (h.acc >= 0.5) { h.acc = 0; if (dist(p, h) < h.r + p.r) hurtPlayer(h.dmg * 0.35); } }
  }
  S.hazards = S.hazards.filter(h => !h.done || h.life > 0);
  for (const l of S.lasers) {
    l.t -= dt;
    if (l.t > 0) continue;
    const ux = Math.cos(l.a), uy = Math.sin(l.a), len = rayClip(l.x, l.y, ux, uy, 700);
    S.fx.push({ k: 'beam', x1: l.x, y1: l.y, x2: l.x + ux * len, y2: l.y + uy * len, t: 0, life: 0.18, w: l.w, col: C.blood });
    sfx('zap', 0.3,0.9);
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

// ───────────────────────── La calma: lo que pasa cuando no hay pelea ─────────────────────────
// Monedas que sueltan los enemigos, cofres sueltos, puertas de verdad en la sala, el buhonero y los aldeanos de las defensas.
// S.calm existe mientras la sala está tranquila y hay algo con lo que hablar o por donde salir: { kind, npcs, spots, near }.
//   npcs:  personas que andan hasta su sitio y se quedan (key del atlas, id para los bocadillos, tx/ty a donde van)
//   spots: con qué se puede hacer algo acercándose y pulsando disparar: puertas (door), hablar (npc), la campana (bell), seguir (go)
// Mientras hay calma no cuenta como sala limpia otra vez (43_update.js) y los bocadillos funcionan como en la ciudad.

// ── Oro: monedas en el suelo ──
function coinGain(v) { const p = S.p; if (G('s_loot')) v *= 1.5; p.gold += v; }
function dropCoins(x, y, total) {
  const k = clamp(Math.round(total / 2), 1, 7);
  for (let i = 0; i < k; i++) { const a = Math.random() * Math.PI * 2, sp = rnd(40, 95); S.coins.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, v: total / k, t: 0 }); }
}
// lo que suelta cada enemigo al morir: más cuanto más adentro, el triple las élites, mucho más los elegidos y los jefes
const coinsOf = e => e.type.post ? 0 : Math.round((1 + S.lvl / 5) * (e.boss ? 12 : e.champ ? 5 : e.elite ? 3 : 1));
function coinsUpdate(dt) {
  const p = S.p, calm = !S.enemies.length && !S.queue.length;
  for (const c of S.coins) {
    c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; const f = Math.pow(0.02, dt); c.vx *= f; c.vy *= f;
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (c.t > 0.35 && (d < 40 || calm)) { const sp = calm ? 260 : 180; c.x += (p.x - c.x) / (d || 1) * sp * dt; c.y += (p.y - c.y) / (d || 1) * sp * dt; }   // al acercarte (o con la sala limpia) vuelan hacia ti
    if (c.t > 0.25 && d < 9) { c.got = true; coinGain(c.v); }
  }
  if (S.coins.some(c => c.got)) { sfx('tick', 0.18, 1.6, 0.03); S.coins = S.coins.filter(c => !c.got); }
}
function drawCoins() {
  for (const c of S.coins) {
    if (IMG.vfx) ctx.drawImage(IMG.vfx, (Math.floor(c.t * 12) % 8) * 32, VFX.coin * 32, 32, 32, Math.round(c.x - 8), Math.round(c.y - 10), 16, 16);
    else { ctx.fillStyle = RAR[3].color; ctx.fillRect(Math.round(c.x) - 2, Math.round(c.y) - 2, 4, 4); }
  }
}

// ── Cofres sueltos: se abren al tocarlos y sueltan un puñado de monedas ──
function placeChests() {
  if (Math.random() > 0.45) return;
  for (let t = 0; t < 60; t++) {
    const cx = ri(2, NAV.cols - 3), cy = ri(2, NAV.rows - 3);
    if ([[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => NAV.wall[(cy + dy) * NAV.cols + cx + dx])) continue;
    const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL; if (Math.hypot(x - S.p.x, y - S.p.y) < 90) continue;
    S.chests.push({ x, y, open: false, t: 0 }); return;
  }
}
function chestsUpdate(dt) {
  const p = S.p;
  for (const ch of S.chests) {
    ch.t += dt;
    if (!ch.open && Math.hypot(p.x - ch.x, p.y - ch.y) < 16) {
      ch.open = true; ch.t = 0; dropCoins(ch.x, ch.y - 4, Math.round(10 + 3 * S.lvl)); sfx('relic', 0.4, 1.2);
      for (let i = 0; i < 8; i++) S.fx.push({ k: 'spark', x: ch.x, y: ch.y - 6, vx: rnd(-60, 60), vy: rnd(-90, -20), t: 0, life: rnd(0.3, 0.6), col: RAR[3].color });
      note(ch.x, ch.y - 18, 'Un cofre', RAR[3].color);
    }
  }
}
function drawChests() {   // cofre de madera con herrajes; abierto, con la tapa levantada y el fondo a oscuras
  for (const ch of S.chests) {
    const x = Math.round(ch.x) - 7, y = Math.round(ch.y) - 6, P = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + 10, 14, 2);
    P('#2a1a12', 0, 3, 14, 8); P('#8a5a32', 1, 4, 12, 6); P('#a8743f', 1, 4, 12, 1); P('#c9a24a', 0, 6, 14, 1); P('#c9a24a', 6, 5, 2, 3);
    if (ch.open) { P('#120c10', 1, 3, 12, 2); P('#2a1a12', 0, -2, 14, 5); P('#8a5a32', 1, -1, 12, 3); P('#c9a24a', 0, 1, 14, 1); }
    else { P('#2a1a12', 0, 0, 14, 4); P('#9a663a', 1, 1, 12, 2); P('#c9a24a', 0, 2, 14, 1); if (Math.floor(ch.t * 2) % 4 === 0) P('#fff3b0', 10, 1, 1, 1); }
  }
}

// ── Puertas de verdad ──
// Sitios para las puertas: casillas de suelo con muro justo encima en tres casillas seguidas (la puerta va en ese muro),
// a las que se puede llegar desde donde estás; repartidas lo más lejos posible entre sí.
function doorSpots(n) {
  const c = NAV.cols, r = NAV.rows, W = (x, y) => x < 0 || y < 0 || x >= c || y >= r || NAV.wall[y * c + x] === 1;
  const seen = new Uint8Array(c * r), q = [[Math.floor(S.p.x / CELL), Math.floor(S.p.y / CELL)]];   // hasta dónde se llega andando
  if (!W(q[0][0], q[0][1])) seen[q[0][1] * c + q[0][0]] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= c || ny >= r || seen[ny * c + nx] || W(nx, ny)) continue; seen[ny * c + nx] = 1; q.push([nx, ny]); } }
  const cand = [];   // la puerta va en un muro grueso (tres casillas de ancho y de fondo, como el arco): no en un pilar suelto
  for (let y = 0; y < r - 1; y++) for (let x = 2; x < c - 2; x++)   // también la fila de arriba del todo: su muro es el borde de la sala
    if (seen[y * c + x] && seen[y * c + x - 1] && seen[y * c + x + 1] && W(x, y - 1) && W(x - 1, y - 1) && W(x + 1, y - 1) && W(x, y - 2) && W(x, y - 3) && W(x, y - 4) && W(x - 1, y - 2) && W(x + 1, y - 2) && !W(x, y + 1) && !W(x - 1, y + 1) && !W(x + 1, y + 1)) cand.push({ x: (x + 0.5) * CELL, y: y * CELL });
  // repartidas: cada una lo más lejos posible de las demás (al menos 64 px), mejor en los muros de arriba y no encima de ti
  const out = [], score = k => (out.length ? Math.min(...out.map(o => Math.abs(o.x - k.x) + 0.5 * Math.abs(o.y - k.y))) : Math.abs(k.x - T.room.w / 2)) - k.y / T.room.h * 90 - (Math.hypot(S.p.x - k.x, S.p.y - k.y) < 40 ? 80 : 0);   // separadas a lo ancho: esquinas y centro del fondo
  while (out.length < n && cand.length) {
    let best = null, bd = -1e9;
    for (const k of cand) { if (out.some(o => Math.hypot(o.x - k.x, o.y - k.y) < (n > 2 ? 110 : 150))) continue; const d = score(k); if (d > bd) { bd = d; best = k; } }
    if (!best) break;
    out.push(best); cand.splice(cand.indexOf(best), 1);
  }
  while (out.length < n) out.push({ x: S.p.x + (out.length - n / 2) * 40, y: S.p.y - 40 });   // sala sin muros a mano: delante de ti
  return out;
}
// Pone las puertas de la pantalla de puertas (doorScreen) en la sala. extra: puertas que se añaden (el campamento del buhonero)
function openDoors(scr, extra) {
  const opts = (scr ? scr.opts : []).concat(extra || []), at = doorSpots(opts.length);
  S.calm = S.calm || { kind: 'doors', npcs: [], spots: [], near: null };
  opts.forEach((o, i) => S.calm.spots.push({ kind: 'door', x: at[i].x, y: at[i].y + 10, dy: at[i].y, opt: o, label: o.name }));
  S.calm.title = scr ? scr.eyebrow : '';
  // las antorchas del muro que caerían dentro de un arco, fuera (la puerta ya trae las suyas)
  if (ROOM_BG && ROOM_BG.torches) ROOM_BG.torches = ROOM_BG.torches.filter(t => !S.calm.spots.some(d => d.kind === 'door' && Math.abs(t.x - d.x) < 30 && t.y > d.dy - 70 && t.y < d.dy + 6));
  tip('doors');
}
// Antes del jefe: una sola puerta, la suya
function bossDoor() {
  const ms = S.mission, boss = ms.type === 'god' ? TYPES[KINGDOMS.find(x => x.id === ms.k).god].name : TYPES[zoneBoss(KINGDOMS.find(x => x.id === ms.k), ms.z)].name;
  openDoors(null, [{ tag: ms.type === 'god' ? 'Dios' : 'Guardián', name: 'La puerta de ' + lc(boss), desc: 'Detrás espera ' + lc(boss) + '. No hay vuelta atrás.', color: C.blood, ico: ['helm', 1], apply: () => {} }]);
}
// La puerta del campamento del buhonero: una sala sin enemigos con su tienda; de allí se sigue por otra puerta
const campDoor = () => ({ tag: 'Zona segura', name: 'El campamento del buhonero', desc: 'Una sala tranquila con un tendero que vende de todo. Después sigues por otra puerta.', color: '#e6c07a', ico: ['mug', 0], camp: true, apply: () => {} });

function useDoor(s) {
  const o = s.opt; sfx('pick', 0.5);
  if (o.camp) { enterCamp(); return; }
  o.apply(); S.calm = null; nextWave();
}

// ── El buhonero ──
Object.assign(SPEAKER, { merchant: ['El buhonero', '#d9b26a'] });
const MERCHANT_HI = [
  'Pasa, pasa. Aquí abajo no entra nada que no pague. Y los bichos no pagan.',
  '¿Otra vez tú? Bien. Los que vuelven son los que compran.',
  'Siéntate junto al fuego. Lo que no compres hoy, mañana lo llevará otro… si queda alguien.',
  'Te he visto pelear desde el recodo. Tienes buena mano. Y mala pinta. Te vendría bien un guiso.',
  'No preguntes de dónde saco la mercancía. Pregunta cuánto cuesta.',
];
function talkMerchant() {
  const p = S.p;
  talk([{ who: 'merchant', text: MERCHANT_HI[Math.floor(Math.random() * MERCHANT_HI.length)] }, ...(p.gold < 30 ? [{ who: 'merchant', text: 'Aunque con ese monedero… Mata unos cuantos más y vuelve.' }] : [])], null, () => openShop());
}
// El campamento: una sala pequeña sin enemigos, con una hoguera, el buhonero y las puertas para seguir
function enterCamp() {
  const room = buildRoom(false, 'campamento', 'small');
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.town = null; S.solidProps = room.solids || []; S.roomKind = room.kind; S.roomT = S.t; S.lastHitT = S.t; S.traps = [];
  S.p.x = room.start.x; S.p.y = room.start.y; S.coins = []; S.chests = []; S.enemies = []; S.queue = []; S.roomType = 'camp';
  const cx = T.room.w / 2, cy = T.room.h / 2;
  S.calm = { kind: 'camp', npcs: [{ key: 'merchant', id: 'merchant', x: cx + 30, y: cy - 6, tx: cx + 30, ty: cy - 6, flip: true }], spots: [], near: null, fire: { x: cx, y: cy } };
  S.calm.spots.push({ kind: 'npc', npc: 'merchant', x: cx + 30, y: cy + 4, label: 'Hablar con el buhonero', act: talkMerchant });
  openDoors(doorScreen());
  sayRaw('[El campamento del buhonero. Aquí no llega nada.]', C.energy);
  saveRun();
}

// ── Los aldeanos en las defensas: entre oleadas se acercan a hablar, a venderte y a darte lo que tienen ──
Object.assign(SPEAKER, { v_merc: ['La tendera de la aldea', '#d9b26a'], v_gift: ['Un aldeano', '#e6c07a'], v_talk: ['Una aldeana', '#e6c07a'], v_go: ['El alcalde', '#cfd6de'] });
const VILLAGE_TALK = [
  ['Mi hijo dice que tus cadenas cantan cuando las lanzas. Yo solo oigo a los bichos gritar. Me vale igual.', 'Llevamos tres noches sin dormir. Si aguantas esta, a lo mejor dormimos.'],
  ['¿De dónde has salido tú? Nadie viene a defender aldeas como esta. Ni el rey.', 'Si caemos, al menos que se acuerden de que alguien se quedó con nosotros.'],
  ['La campana es lo único que nos queda del pueblo viejo. Si suena, todos corremos al bosque. Que no tenga que sonar, ¿eh?', 'Mi abuela dice que los dioses no se mueren. Mi abuela no te ha visto pelear.'],
];
const VILLAGE_GIFT = [
  { text: 'Toma. Es hierro de la herrería, la que se quemó. A ti te servirá más que a nosotros.', give: () => { S.ironRun += 1; return '+1 de Hierro Místico'; } },
  { text: 'Hemos juntado lo que teníamos. No es mucho, pero es todo.', give: () => { const k = Math.round(25 + 6 * S.lvl); dropCoins(S.p.x, S.p.y - 10, k); return '+' + k + ' de oro'; } },
  { text: 'Bebe esto. Lo hace mi madre con hierbas del monte. Sabe a demonios, pero cura.', give: () => { heal(pct(30)); return 'Recuperas el 30% de tu vida'; } },
  { text: 'Hemos apuntalado la campana con las vigas del granero. Aguantará un poco más.', give: () => { if (S.keep) S.keep.hp = Math.min(S.keep.maxHp, S.keep.hp + S.keep.maxHp * 0.3); return 'La campana recupera el 30%'; } },
];
function villageCalm() {
  if (!S.keep) { nextWave(); return; }
  S.mode = 'play'; modeT = 0; renderOverlay();
  const k = S.keep, n = Math.floor(S.room / 4), gift = VILLAGE_GIFT[(S.room + Math.floor(Math.random() * 4)) % VILLAGE_GIFT.length], talkL = VILLAGE_TALK[n % VILLAGE_TALK.length];
  const from = (i) => { const a = -Math.PI / 2 + (i - 1) * 1.1; return { x: k.x + Math.cos(a) * 170, y: k.y + Math.sin(a) * 120 }; };
  const spot = (i) => { const a = -Math.PI / 2 + (i - 1) * 1.15; return { x: S.p.x + Math.cos(a) * 58, y: S.p.y + Math.sin(a) * 40 }; };   // en corro, separados
  const people = [{ key: 'merchant', id: 'v_merc' }, { key: 'cit_peasant', id: 'v_gift' }, { key: 'villager', id: 'v_talk' }];
  S.calm = { kind: 'village', npcs: [], spots: [], near: null };
  people.forEach((q, i) => { const a = from(i), b = spot(i); S.calm.npcs.push(Object.assign({ x: a.x, y: a.y, tx: b.x, ty: b.y, walking: true }, q)); });
  S.calm.spots.push({ kind: 'npc', npc: 'v_merc', label: 'Comprar', act: () => talk([{ who: 'v_merc', text: 'El buhonero dejó aquí su carro cuando empezó el asedio. Yo lo vendo por él. Él no va a volver a por ello.' }], null, () => openShop()) });
  S.calm.spots.push({ kind: 'npc', npc: 'v_gift', label: 'Hablar', act: (s) => { if (s.done) { talk([{ who: 'v_gift', text: 'Ya te he dado lo que tenía. Ahora, a por ellos.' }]); return; } s.done = true; const got = gift.give(); talk([{ who: 'v_gift', text: gift.text }], null, () => { sayRaw('[' + got + ']', C.energy); sfx('ok', 0.4); }); } });
  S.calm.spots.push({ kind: 'npc', npc: 'v_talk', label: 'Hablar', act: (s) => { s.n = (s.n || 0) + 1; talk([{ who: 'v_talk', text: talkL[(s.n - 1) % talkL.length] }]); } });
  S.calm.spots.push({ kind: 'bell', x: k.x, y: k.y + 22, label: 'Tocar la campana: que vengan', act: () => { S.calm = null; sfx('chime', 0.5, 0.8); nextWave(); } });
  sayRaw('[Los asaltantes se repliegan. Los aldeanos salen de sus casas.]', C.energy);
}
// En los asaltos, entre campamento y campamento, aparece el buhonero
function assaultCalm() {
  S.mode = 'play'; modeT = 0; renderOverlay();
  const p = S.p, x0 = p.x + 140, y0 = p.y - 20;
  S.calm = { kind: 'assault', npcs: [{ key: 'merchant', id: 'merchant', x: x0, y: y0, tx: p.x + 34, ty: p.y - 8, walking: true }], spots: [], near: null };
  S.calm.spots.push({ kind: 'npc', npc: 'merchant', label: 'Hablar con el buhonero', act: talkMerchant });
  S.calm.spots.push({ kind: 'go', x: p.x - 34, y: p.y + 6, label: 'Seguir hacia el siguiente campamento', act: () => { S.calm = null; sfx('pick', 0.5); nextWave(); } });
  sayRaw('[Un buhonero se acerca entre las tiendas quemadas.]', C.energy);
}

// ── Cada fotograma con calma ──
function calmUpdate(dt) {
  const C2 = S.calm, p = S.p;
  for (const n of C2.npcs) {
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d > 1) { const st = Math.min(d, 62 * dt); n.x += dx / d * st; n.y += dy / d * st; n.walking = true; n.flip = dx < 0; }
    else { n.walking = false; n.flip = n.x > p.x; }
  }
  for (const s of C2.spots) if (s.npc) { const n = C2.npcs.find(q => q.id === s.npc); if (n) { s.x = n.x; s.y = n.y + 10; } }
  let near = null, bd = 24;
  for (const s of C2.spots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; near = s; } }
  C2.near = near;
  if (near && I.atkP && !S.dialog) {
    if (near.kind === 'door') useDoor(near);
    else if (near.act) near.act(near);
  }
}
function drawCalm() {
  const C2 = S.calm, p = S.p;
  if (C2.fire) { const f = C2.fire; ctx.fillStyle = '#2a1a12'; ctx.fillRect(f.x - 9, f.y + 2, 18, 3); ctx.fillStyle = '#5a3a22'; ctx.fillRect(f.x - 7, f.y, 14, 3); drawFx('flame', (S.t * 1.4) % 1, f.x, f.y - 2, '#ff9a3c', 18); }
  for (const s of C2.spots) if (s.kind === 'door') drawDoor(s, s === C2.near);
  for (const n of C2.npcs.slice().sort((a, b) => a.y - b.y)) {
    ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(n.x, n.y, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawChar(n.key, n.walking ? 'move' : 'idle', S.t + n.x * 0.01, n.x, n.y, !!n.flip, false);
  }
  if (S.dialog) return;
  for (const s of C2.spots) {
    if (s.kind === 'door') continue;
    const on = s === C2.near, b = Math.round(Math.sin(S.t * 5 + s.x) * 1.5), y = s.kind === 'npc' ? s.y - 44 : s.y - 26;
    ctx.fillStyle = on ? C.energy : '#efe6c8'; ctx.globalAlpha = on ? 1 : 0.7; ctx.fillRect(s.x - 2, y + 4 + b, 5, 3); ctx.fillRect(s.x - 1, y + 7 + b, 3, 1); ctx.globalAlpha = 1;
    if (on) wtext(s.label, s.x, y + b, 7, C.energy, 1);   // solo lo que tienes más cerca dice qué es; lo demás, solo la flechita
  }
  if (C2.near && !S.dialog) wtext(lastDev === 'pad' ? 'A: ' + (C2.near.kind === 'door' ? 'cruzar' : 'hablar') : lastDev === 'touch' ? 'Disparar: ' + (C2.near.kind === 'door' ? 'cruzar' : 'hablar') : 'Espacio: ' + (C2.near.kind === 'door' ? 'cruzar' : 'hablar'), p.x, p.y + 22, 6, C.ink, 0.95);
}
// Una puerta en el muro: el arco de piedra del paquete (tools/pack_doors.py), más alto que Alec; dentro, oscuridad y la luz de lo que
// hay detrás subiendo desde el suelo; una antorcha a cada lado y el icono encima. Al acercarte dice qué es.
loadImg('doors', 'assets/doors.png');
function drawDoor(s, on) {
  const o = s.opt, col = o.color || C.ink, A = DOOR_ART.arch, Hh = DOOR_ART.hole, x0 = Math.round(s.x - A[2] / 2), y0 = Math.round(s.dy - A[3]), pulse = 0.5 + 0.5 * Math.sin(S.t * 3 + s.x);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x0 + 2, s.dy, A[2] - 4, 3);                                  // sombra en el suelo
  ctx.fillStyle = '#07060b'; ctx.fillRect(x0 + Hh[0], y0 + Hh[1], Hh[2], Hh[3]);                               // el hueco
  for (let k = 0; k < 10; k++) { ctx.globalAlpha = (0.05 + 0.06 * pulse + (on ? 0.05 : 0)) * (1 - k / 10) * 2.2; ctx.fillStyle = col; ctx.fillRect(x0 + Hh[0], y0 + Hh[1] + Hh[3] - (k + 1) * 4, Hh[2], 4); }   // la luz de la sala de detrás
  ctx.globalAlpha = 1;
  if (IMG.doors) ctx.drawImage(IMG.doors, A[0], A[1], A[2], A[3], x0, y0, A[2], A[3]);
  for (const sx of [-1, 1]) {   // antorchas en el muro, a los lados
    const tx = Math.round(s.x + sx * (A[2] / 2 + 6)), ty = y0 + 14;
    ctx.fillStyle = '#2a1a12'; ctx.fillRect(tx - 1, ty, 3, 8); ctx.fillStyle = '#6e4a2a'; ctx.fillRect(tx - 2, ty, 5, 2);
    drawFx('flame', ((S.t * 1.6 + sx * 0.3) % 1 + 1) % 1, tx, ty - 3, col, 12);
  }
  if (IMG.items && o.ico) {   // el icono, en una placa sobre el arco
    const iy = y0 - 20 + Math.round(Math.sin(S.t * 3 + s.x) * 1.2);
    ctx.fillStyle = '#16101a'; ctx.fillRect(Math.round(s.x) - 10, iy - 2, 20, 20); ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(Math.round(s.x) - 9, iy - 1, 18, 18); ctx.globalAlpha = 1;
    ctx.fillStyle = '#16101a'; ctx.fillRect(Math.round(s.x) - 8, iy, 16, 16);
    ctx.drawImage(IMG.items, ICO[o.ico[0]] * 32, (o.ico[1] || 0) * 32, 32, 32, Math.round(s.x) - 8, iy, 16, 16);
  }
  if (on && !S.dialog) {   // solo la puerta a la que te acercas dice qué es (si no, los nombres se pisan)
    wtext(o.tag, s.x, y0 - 34, 6, '#efe6c8', 0.85); wtext(o.name, s.x, y0 - 26, 7, col, 1);
    (o.desc.match(/.{1,46}(\s|$)/g) || []).slice(0, 3).forEach((l, i) => wtext(l.trim(), s.x, s.dy + 12 + i * 8, 6, '#efe6c8', 0.9));
  }
}
// Flechas en el borde de la pantalla hacia las puertas que no se ven (con el icono de lo que hay detrás); al verlas, desaparecen
function calmPointers() {
  const C2 = S.calm; if (!C2 || !IMG.items) return;
  const R = 10, L = cam.x + 16, Rt = cam.x + view.w - 16, T = cam.y + Math.max(30, view.h * 0.22), B = cam.y + view.h * 0.74, ox = cam.x + view.w / 2, oy = cam.y + view.h / 2, placed = [];
  for (const s of C2.spots) {
    if (s.kind !== 'door') continue;
    const x = s.x, y = s.dy - 30;
    if (x > cam.x + 4 && x < cam.x + view.w - 4 && y > cam.y + 4 && y < cam.y + view.h - 4) continue;
    const dx = x - ox, dy = y - oy, k = Math.min(dx > 0 ? (Rt - ox) / dx : dx < 0 ? (L - ox) / dx : 1e9, dy > 0 ? (B - oy) / dy : dy < 0 ? (T - oy) / dy : 1e9);
    let px = ox + dx * k, py = oy + dy * k;
    for (let n = 0; n < 6 && placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < 2 * R + 4); n++) { if (px <= L + 1 || px >= Rt - 1) py = clamp(py + (py > oy ? -1 : 1) * (2 * R + 5), T, B); else px = clamp(px + (px > ox ? -1 : 1) * (2 * R + 5), L, Rt); }
    placed.push([px, py]); px = Math.round(px); py = Math.round(py);
    const a = Math.atan2(y - py, x - px), col = s.opt.color || C.ink;
    ctx.save(); ctx.translate(px, py);
    ctx.save(); ctx.rotate(a); ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.moveTo(R + 7, 0); ctx.lineTo(R - 2, -6); ctx.lineTo(R - 2, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(R + 5, 0); ctx.lineTo(R - 1, -4); ctx.lineTo(R - 1, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, Math.PI * 2); ctx.stroke();
    if (s.opt.ico) ctx.drawImage(IMG.items, ICO[s.opt.ico[0]] * 32, (s.opt.ico[1] || 0) * 32, 32, 32, -8, -8, 16, 16);
    ctx.restore();
  }
}
// Generado por tools/pack_atlas.py a partir del CHARACTER MEGAPACK de overboy (itch.io). No editar a mano.
// w, h: tamaño del recorte · ax: centro del cuerpo · gy: línea del suelo · a: animaciones (fps y posición de cada fotograma)
const ATLAS = {"stalker":{"w":28,"h":21,"ax":12,"gy":21,"bw":22,"bh":15,"a":{"idle":{"fps":1,"f":[[0,0]]},"move":{"fps":12,"f":[[29,0],[58,0],[87,0],[116,0],[145,0],[174,0],[203,0],[232,0],[261,0],[290,0]]},"atk":{"fps":18,"f":[[319,0],[348,0],[377,0],[406,0],[435,0],[464,0],[493,0],[522,0],[551,0],[580,0]]}}},"runner":{"w":15,"h":24,"ax":7,"gy":24,"bw":12,"bh":12,"a":{"idle":{"fps":3,"f":[[609,0],[625,0]]},"move":{"fps":20,"f":[[641,0],[657,0],[673,0],[689,0],[705,0],[721,0],[737,0],[753,0],[769,0],[785,0],[801,0],[817,0],[833,0],[849,0]]},"atk":{"fps":24,"f":[[865,0],[881,0],[897,0],[913,0],[929,0],[945,0],[961,0],[977,0],[993,0],[1009,0],[1025,0],[1041,0],[1057,0],[1073,0]]}}},"brute":{"w":48,"h":53,"ax":23,"gy":53,"bw":26,"bh":28,"a":{"idle":{"fps":1,"f":[[1089,0]]},"move":{"fps":7,"f":[[1138,0],[1187,0],[1236,0],[1285,0],[1334,0]]},"atk":{"fps":14,"f":[[1383,0],[1432,0],[1481,0],[1530,0],[1579,0],[1628,0],[1677,0],[1726,0],[1775,0],[1824,0],[1873,0],[1922,0]]}}},"mage":{"w":31,"h":37,"ax":10,"gy":24,"bw":21,"bh":18,"a":{"idle":{"fps":3,"f":[[1971,0],[2003,0]]},"move":{"fps":12,"f":[[0,54],[32,54],[64,54],[96,54],[128,54],[160,54],[192,54],[224,54],[256,54],[288,54],[320,54],[352,54]]},"atk":{"fps":14,"f":[[384,54],[416,54],[448,54],[480,54],[512,54],[544,54],[576,54],[608,54],[640,54],[672,54]]}}},"bomber":{"w":28,"h":21,"ax":12,"gy":21,"bw":22,"bh":15,"a":{"idle":{"fps":1,"f":[[704,54]]},"move":{"fps":12,"f":[[733,54],[762,54],[791,54],[820,54],[849,54],[878,54],[907,54],[936,54],[965,54],[994,54]]},"atk":{"fps":14,"f":[[1023,54],[1052,54],[1081,54],[1110,54],[1139,54],[1168,54],[1197,54],[1226,54],[1255,54],[1284,54]]}}},"leaper":{"w":35,"h":43,"ax":18,"gy":43,"bw":35,"bh":17,"a":{"idle":{"fps":3,"f":[[1313,54],[1349,54]]},"move":{"fps":4,"f":[[1385,54],[1421,54]]},"atk":{"fps":20,"f":[[1457,54],[1493,54],[1529,54],[1565,54],[1601,54],[1637,54],[1673,54],[1709,54],[1745,54],[1781,54],[1817,54],[1853,54],[1889,54],[1925,54]]}}},"sniper":{"w":64,"h":36,"ax":26,"gy":35,"bw":38,"bh":32,"a":{"idle":{"fps":1,"f":[[1961,54]]},"move":{"fps":10,"f":[[0,98],[65,98],[130,98],[195,98],[260,98],[325,98]]},"atk":{"fps":12,"f":[[390,98],[455,98],[520,98],[585,98],[650,98],[715,98],[780,98],[845,98],[910,98],[975,98],[1040,98]]}}},"shaman":{"w":41,"h":34,"ax":18,"gy":34,"bw":29,"bh":25,"a":{"idle":{"fps":3,"f":[[1105,98],[1147,98]]},"move":{"fps":4,"f":[[1189,98],[1231,98]]},"atk":{"fps":14,"f":[[1273,98],[1315,98],[1357,98],[1399,98],[1441,98],[1483,98],[1525,98],[1567,98],[1609,98],[1651,98],[1693,98],[1735,98],[1777,98],[1819,98]]}}},"lancer":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[1861,98]]},"move":{"fps":12,"f":[[1901,98],[1941,98],[1981,98],[0,135],[40,135],[80,135],[120,135],[160,135]]},"atk":{"fps":16,"f":[[200,135],[240,135],[280,135],[320,135],[360,135],[400,135]]}}},"bat":{"w":27,"h":24,"ax":12,"gy":24,"bw":17,"bh":18,"a":{"idle":{"fps":3,"f":[[440,135],[468,135]]},"move":{"fps":16,"f":[[496,135],[524,135],[552,135],[580,135],[608,135],[636,135],[664,135],[692,135],[720,135],[748,135]]},"atk":{"fps":16,"f":[[776,135],[804,135],[832,135],[860,135],[888,135],[916,135],[944,135],[972,135]]}}},"champ":{"w":32,"h":42,"ax":16,"gy":39,"bw":31,"bh":32,"a":{"idle":{"fps":3,"f":[[1000,135],[1033,135]]},"move":{"fps":14,"f":[[1066,135],[1099,135],[1132,135],[1165,135],[1198,135],[1231,135],[1264,135],[1297,135],[1330,135],[1363,135]]},"atk":{"fps":16,"f":[[1396,135],[1429,135],[1462,135],[1495,135],[1528,135],[1561,135],[1594,135],[1627,135]]}}},"guardian":{"w":64,"h":72,"ax":32,"gy":72,"bw":64,"bh":68,"a":{"idle":{"fps":3,"f":[[1660,135],[1725,135]]},"move":{"fps":12,"f":[[1790,135],[1855,135],[1920,135],[0,208],[65,208],[130,208],[195,208],[260,208],[325,208],[390,208],[455,208],[520,208]]},"atk":{"fps":14,"f":[[585,208],[650,208],[715,208],[780,208],[845,208],[910,208],[975,208],[1040,208],[1105,208],[1170,208],[1235,208],[1300,208],[1365,208],[1430,208]]}}},"matriarch":{"w":86,"h":82,"ax":42,"gy":82,"bw":67,"bh":48,"a":{"idle":{"fps":3,"f":[[1495,208],[1582,208]]},"move":{"fps":12,"f":[[1669,208],[1756,208],[1843,208],[1930,208],[0,291],[87,291],[174,291],[261,291],[348,291],[435,291],[522,291]]},"atk":{"fps":8,"f":[[609,291],[696,291],[783,291],[870,291]]}}},"colossus":{"w":65,"h":64,"ax":32,"gy":64,"bw":65,"bh":63,"a":{"idle":{"fps":8,"f":[[957,291],[1023,291],[1089,291],[1155,291],[1221,291],[1287,291],[1353,291],[1419,291]]},"move":{"fps":10,"f":[[1485,291],[1551,291],[1617,291],[1683,291],[1749,291],[1815,291],[1881,291],[1947,291]]},"atk":{"fps":14,"f":[[0,374],[66,374],[132,374],[198,374],[264,374],[330,374],[396,374],[462,374],[528,374],[594,374],[660,374],[726,374],[792,374],[858,374]]}}},"nameless":{"w":57,"h":57,"ax":30,"gy":57,"bw":49,"bh":49,"a":{"idle":{"fps":3,"f":[[924,374],[982,374]]},"move":{"fps":12,"f":[[1040,374],[1098,374],[1156,374],[1214,374],[1272,374],[1330,374],[1388,374],[1446,374],[1504,374],[1562,374],[1620,374],[1678,374]]},"atk":{"fps":12,"f":[[1736,374],[1794,374],[1852,374],[1910,374],[1968,374],[0,439],[58,439],[116,439],[174,439],[232,439]]}}},"firstfist":{"w":153,"h":140,"ax":60,"gy":126,"bw":114,"bh":118,"a":{"idle":{"fps":10,"f":[[290,439],[444,439],[598,439],[752,439],[906,439],[1060,439],[1214,439],[1368,439],[1522,439],[1676,439],[1830,439],[0,580]]},"move":{"fps":10,"f":[[154,580],[308,580],[462,580],[616,580],[770,580],[924,580],[1078,580],[1232,580],[1386,580],[1540,580],[1694,580],[1848,580]]},"atk":{"fps":14,"f":[[0,721],[154,721],[308,721],[462,721],[616,721],[770,721],[924,721],[1078,721],[1232,721],[1386,721],[1540,721],[1694,721],[1848,721],[0,862],[154,862],[308,862]]}}},"k2_salt":{"w":41,"h":31,"ax":18,"gy":31,"bw":26,"bh":30,"a":{"idle":{"fps":1,"f":[[462,862]]},"move":{"fps":11,"f":[[504,862],[546,862],[588,862],[630,862],[672,862],[714,862],[756,862],[798,862]]},"atk":{"fps":16,"f":[[840,862],[882,862],[924,862],[966,862],[1008,862],[1050,862]]}}},"k2_hang":{"w":48,"h":53,"ax":23,"gy":53,"bw":26,"bh":28,"a":{"idle":{"fps":1,"f":[[1092,862]]},"move":{"fps":7,"f":[[1141,862],[1190,862],[1239,862],[1288,862],[1337,862]]},"atk":{"fps":14,"f":[[1386,862],[1435,862],[1484,862],[1533,862],[1582,862],[1631,862],[1680,862],[1729,862],[1778,862],[1827,862],[1876,862],[1925,862]]}}},"k2_bailiff":{"w":64,"h":54,"ax":32,"gy":54,"bw":51,"bh":44,"a":{"idle":{"fps":3,"f":[[1974,862],[0,1003]]},"move":{"fps":12,"f":[[65,1003],[130,1003],[195,1003],[260,1003],[325,1003],[390,1003],[455,1003],[520,1003],[585,1003],[650,1003],[715,1003],[780,1003]]},"atk":{"fps":14,"f":[[845,1003],[910,1003]]}}},"k2_exec":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[975,1003]]},"move":{"fps":12,"f":[[1015,1003],[1055,1003],[1095,1003],[1135,1003],[1175,1003],[1215,1003],[1255,1003],[1295,1003]]},"atk":{"fps":16,"f":[[1335,1003],[1375,1003],[1415,1003],[1455,1003],[1495,1003],[1535,1003]]}}},"k2_judge":{"w":63,"h":79,"ax":32,"gy":79,"bw":63,"bh":66,"a":{"idle":{"fps":3,"f":[[1575,1003],[1639,1003]]},"move":{"fps":10,"f":[[1703,1003],[1767,1003],[1831,1003],[1895,1003],[1959,1003],[0,1083],[64,1083],[128,1083],[192,1083],[256,1083],[320,1083],[384,1083]]},"atk":{"fps":12,"f":[[448,1083],[512,1083]]}}},"stalker_b":{"w":28,"h":21,"ax":12,"gy":21,"bw":22,"bh":15,"a":{"idle":{"fps":1,"f":[[576,1083]]},"move":{"fps":12,"f":[[605,1083],[634,1083],[663,1083],[692,1083],[721,1083],[750,1083],[779,1083],[808,1083],[837,1083],[866,1083]]},"atk":{"fps":18,"f":[[895,1083],[924,1083],[953,1083],[982,1083],[1011,1083],[1040,1083],[1069,1083],[1098,1083],[1127,1083],[1156,1083]]}}},"bomber_b":{"w":28,"h":21,"ax":12,"gy":21,"bw":22,"bh":15,"a":{"idle":{"fps":1,"f":[[1185,1083]]},"move":{"fps":12,"f":[[1214,1083],[1243,1083],[1272,1083],[1301,1083],[1330,1083],[1359,1083],[1388,1083],[1417,1083],[1446,1083],[1475,1083]]},"atk":{"fps":14,"f":[[1504,1083],[1533,1083],[1562,1083],[1591,1083],[1620,1083],[1649,1083],[1678,1083],[1707,1083],[1736,1083],[1765,1083]]}}},"brute_b":{"w":48,"h":53,"ax":23,"gy":53,"bw":26,"bh":28,"a":{"idle":{"fps":1,"f":[[1794,1083]]},"move":{"fps":7,"f":[[1843,1083],[1892,1083],[1941,1083],[1990,1083],[0,1163]]},"atk":{"fps":14,"f":[[49,1163],[98,1163],[147,1163],[196,1163],[245,1163],[294,1163],[343,1163],[392,1163],[441,1163],[490,1163],[539,1163],[588,1163]]}}},"sniper_b":{"w":64,"h":36,"ax":26,"gy":35,"bw":38,"bh":32,"a":{"idle":{"fps":1,"f":[[637,1163]]},"move":{"fps":10,"f":[[702,1163],[767,1163],[832,1163],[897,1163],[962,1163],[1027,1163]]},"atk":{"fps":12,"f":[[1092,1163],[1157,1163],[1222,1163],[1287,1163],[1352,1163],[1417,1163],[1482,1163],[1547,1163],[1612,1163],[1677,1163],[1742,1163]]}}},"stalker_r":{"w":28,"h":21,"ax":12,"gy":21,"bw":22,"bh":15,"a":{"idle":{"fps":1,"f":[[1807,1163]]},"move":{"fps":12,"f":[[1836,1163],[1865,1163],[1894,1163],[1923,1163],[1952,1163],[1981,1163],[2010,1163],[0,1217],[29,1217],[58,1217]]},"atk":{"fps":18,"f":[[87,1217],[116,1217],[145,1217],[174,1217],[203,1217],[232,1217],[261,1217],[290,1217],[319,1217],[348,1217]]}}},"bomber_r":{"w":28,"h":21,"ax":12,"gy":21,"bw":22,"bh":15,"a":{"idle":{"fps":1,"f":[[377,1217]]},"move":{"fps":12,"f":[[406,1217],[435,1217],[464,1217],[493,1217],[522,1217],[551,1217],[580,1217],[609,1217],[638,1217],[667,1217]]},"atk":{"fps":14,"f":[[696,1217],[725,1217],[754,1217],[783,1217],[812,1217],[841,1217],[870,1217],[899,1217],[928,1217],[957,1217]]}}},"brute_r":{"w":48,"h":53,"ax":23,"gy":53,"bw":26,"bh":28,"a":{"idle":{"fps":1,"f":[[986,1217]]},"move":{"fps":7,"f":[[1035,1217],[1084,1217],[1133,1217],[1182,1217],[1231,1217]]},"atk":{"fps":14,"f":[[1280,1217],[1329,1217],[1378,1217],[1427,1217],[1476,1217],[1525,1217],[1574,1217],[1623,1217],[1672,1217],[1721,1217],[1770,1217],[1819,1217]]}}},"sniper_r":{"w":64,"h":36,"ax":26,"gy":35,"bw":38,"bh":32,"a":{"idle":{"fps":1,"f":[[1868,1217]]},"move":{"fps":10,"f":[[1933,1217],[0,1271],[65,1271],[130,1271],[195,1271],[260,1271]]},"atk":{"fps":12,"f":[[325,1271],[390,1271],[455,1271],[520,1271],[585,1271],[650,1271],[715,1271],[780,1271],[845,1271],[910,1271],[975,1271]]}}},"lancer_silver":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[1040,1271]]},"move":{"fps":12,"f":[[1080,1271],[1120,1271],[1160,1271],[1200,1271],[1240,1271],[1280,1271],[1320,1271],[1360,1271]]},"atk":{"fps":16,"f":[[1400,1271],[1440,1271],[1480,1271],[1520,1271],[1560,1271],[1600,1271]]}}},"lancer_gold":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[1640,1271]]},"move":{"fps":12,"f":[[1680,1271],[1720,1271],[1760,1271],[1800,1271],[1840,1271],[1880,1271],[1920,1271],[1960,1271]]},"atk":{"fps":16,"f":[[2000,1271],[0,1308],[40,1308],[80,1308],[120,1308],[160,1308]]}}},"lancer_devil":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[200,1308]]},"move":{"fps":12,"f":[[240,1308],[280,1308],[320,1308],[360,1308],[400,1308],[440,1308],[480,1308],[520,1308]]},"atk":{"fps":16,"f":[[560,1308],[600,1308],[640,1308],[680,1308],[720,1308],[760,1308]]}}},"lancer_orc":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[800,1308]]},"move":{"fps":12,"f":[[840,1308],[880,1308],[920,1308],[960,1308],[1000,1308],[1040,1308],[1080,1308],[1120,1308]]},"atk":{"fps":16,"f":[[1160,1308],[1200,1308],[1240,1308],[1280,1308],[1320,1308],[1360,1308]]}}},"lancer_red":{"w":39,"h":30,"ax":17,"gy":30,"bw":24,"bh":29,"a":{"idle":{"fps":1,"f":[[1400,1308]]},"move":{"fps":12,"f":[[1440,1308],[1480,1308],[1520,1308],[1560,1308],[1600,1308],[1640,1308],[1680,1308],[1720,1308]]},"atk":{"fps":16,"f":[[1760,1308],[1800,1308],[1840,1308],[1880,1308],[1920,1308],[1960,1308]]}}},"lancer_frozen":{"w":41,"h":31,"ax":18,"gy":31,"bw":26,"bh":30,"a":{"idle":{"fps":1,"f":[[2000,1308]]},"move":{"fps":12,"f":[[0,1340],[42,1340],[84,1340],[126,1340],[168,1340],[210,1340],[252,1340],[294,1340]]},"atk":{"fps":16,"f":[[336,1340],[378,1340],[420,1340],[462,1340],[504,1340],[546,1340]]}}},"lancer_bio":{"w":41,"h":31,"ax":18,"gy":31,"bw":26,"bh":30,"a":{"idle":{"fps":1,"f":[[588,1340]]},"move":{"fps":12,"f":[[630,1340],[672,1340],[714,1340],[756,1340],[798,1340],[840,1340],[882,1340],[924,1340]]},"atk":{"fps":16,"f":[[966,1340],[1008,1340],[1050,1340],[1092,1340],[1134,1340],[1176,1340]]}}},"lancer_rad":{"w":43,"h":34,"ax":19,"gy":34,"bw":28,"bh":33,"a":{"idle":{"fps":1,"f":[[1218,1340]]},"move":{"fps":12,"f":[[1262,1340],[1306,1340],[1350,1340],[1394,1340],[1438,1340],[1482,1340],[1526,1340],[1570,1340]]},"atk":{"fps":16,"f":[[1614,1340],[1658,1340],[1702,1340],[1746,1340],[1790,1340],[1834,1340]]}}},"lancer_oniric":{"w":41,"h":31,"ax":18,"gy":31,"bw":26,"bh":30,"a":{"idle":{"fps":1,"f":[[1878,1340]]},"move":{"fps":12,"f":[[1920,1340],[1962,1340],[2004,1340],[0,1375],[42,1375],[84,1375],[126,1375],[168,1375]]},"atk":{"fps":16,"f":[[210,1375],[252,1375],[294,1375],[336,1375],[378,1375],[420,1375]]}}},"stalker_ent":{"w":35,"h":39,"ax":22,"gy":39,"bw":26,"bh":25,"a":{"idle":{"fps":4,"f":[[462,1375],[498,1375],[534,1375],[570,1375]]},"move":{"fps":12,"f":[[606,1375],[642,1375],[678,1375],[714,1375],[750,1375],[786,1375],[822,1375],[858,1375],[894,1375]]},"atk":{"fps":14,"f":[[930,1375],[966,1375],[1002,1375],[1038,1375],[1074,1375],[1110,1375]]}}},"brute_ent":{"w":59,"h":40,"ax":20,"gy":39,"bw":38,"bh":25,"a":{"idle":{"fps":3,"f":[[1146,1375],[1206,1375]]},"move":{"fps":10,"f":[[1266,1375],[1326,1375],[1386,1375],[1446,1375],[1506,1375],[1566,1375],[1626,1375],[1686,1375],[1746,1375],[1806,1375],[1866,1375],[1926,1375]]},"atk":{"fps":14,"f":[[1986,1375],[0,1416],[60,1416],[120,1416],[180,1416],[240,1416],[300,1416],[360,1416],[420,1416],[480,1416]]}}},"brute_ent3":{"w":71,"h":51,"ax":26,"gy":51,"bw":42,"bh":47,"a":{"idle":{"fps":3,"f":[[540,1416],[612,1416]]},"move":{"fps":10,"f":[[684,1416],[756,1416],[828,1416],[900,1416],[972,1416],[1044,1416],[1116,1416],[1188,1416],[1260,1416]]},"atk":{"fps":12,"f":[[1332,1416],[1404,1416],[1476,1416],[1548,1416],[1620,1416],[1692,1416],[1764,1416],[1836,1416]]}}},"champ_wood":{"w":53,"h":65,"ax":22,"gy":65,"bw":43,"bh":62,"a":{"idle":{"fps":3,"f":[[1908,1416],[1962,1416]]},"move":{"fps":12,"f":[[0,1482],[54,1482],[108,1482],[162,1482],[216,1482],[270,1482],[324,1482],[378,1482],[432,1482],[486,1482],[540,1482],[594,1482]]},"atk":{"fps":14,"f":[[648,1482],[702,1482],[756,1482],[810,1482],[864,1482],[918,1482],[972,1482],[1026,1482],[1080,1482],[1134,1482],[1188,1482]]}}},"bat_fly":{"w":54,"h":94,"ax":26,"gy":93,"bw":38,"bh":36,"a":{"idle":{"fps":6,"f":[[1242,1482],[1297,1482],[1352,1482],[1407,1482]]},"move":{"fps":14,"f":[[1462,1482],[1517,1482],[1572,1482],[1627,1482],[1682,1482],[1737,1482],[1792,1482],[1847,1482]]},"atk":{"fps":14,"f":[[1902,1482],[1957,1482],[0,1577],[55,1577],[110,1577],[165,1577]]}}},"runner_2":{"w":19,"h":33,"ax":10,"gy":33,"bw":18,"bh":28,"a":{"idle":{"fps":3,"f":[[220,1577],[240,1577]]},"move":{"fps":20,"f":[[260,1577],[280,1577],[300,1577],[320,1577],[340,1577],[360,1577],[380,1577],[400,1577],[420,1577],[440,1577],[460,1577],[480,1577]]},"atk":{"fps":20,"f":[[500,1577],[520,1577],[540,1577],[560,1577],[580,1577],[600,1577],[620,1577],[640,1577],[660,1577],[680,1577]]}}},"bomber_mimic":{"w":48,"h":42,"ax":24,"gy":42,"bw":42,"bh":42,"a":{"idle":{"fps":3,"f":[[700,1577],[749,1577]]},"move":{"fps":14,"f":[[798,1577],[847,1577],[896,1577],[945,1577],[994,1577],[1043,1577],[1092,1577],[1141,1577],[1190,1577],[1239,1577],[1288,1577],[1337,1577]]},"atk":{"fps":8,"f":[[1386,1577],[1435,1577]]}}},"sniper_cyc":{"w":26,"h":25,"ax":16,"gy":25,"bw":19,"bh":20,"a":{"idle":{"fps":3,"f":[[1484,1577],[1511,1577]]},"move":{"fps":10,"f":[[1538,1577],[1565,1577],[1592,1577],[1619,1577],[1646,1577],[1673,1577],[1700,1577],[1727,1577]]},"atk":{"fps":10,"f":[[1754,1577],[1781,1577],[1808,1577],[1835,1577],[1862,1577],[1889,1577],[1916,1577]]}}},"mage_2":{"w":32,"h":23,"ax":14,"gy":23,"bw":26,"bh":23,"a":{"idle":{"fps":5,"f":[[1943,1577],[1976,1577],[2009,1577],[0,1672]]},"move":{"fps":12,"f":[[33,1672],[66,1672],[99,1672],[132,1672],[165,1672],[198,1672],[231,1672],[264,1672],[297,1672],[330,1672],[363,1672],[396,1672]]},"atk":{"fps":14,"f":[[429,1672],[462,1672],[495,1672],[528,1672],[561,1672],[594,1672],[627,1672],[660,1672],[693,1672],[726,1672]]}}},"mage_3":{"w":42,"h":39,"ax":20,"gy":39,"bw":38,"bh":37,"a":{"idle":{"fps":5,"f":[[759,1672],[802,1672],[845,1672],[888,1672]]},"move":{"fps":12,"f":[[931,1672],[974,1672],[1017,1672],[1060,1672],[1103,1672],[1146,1672],[1189,1672],[1232,1672],[1275,1672],[1318,1672],[1361,1672],[1404,1672]]},"atk":{"fps":12,"f":[[1447,1672],[1490,1672],[1533,1672],[1576,1672],[1619,1672],[1662,1672],[1705,1672],[1748,1672]]}}},"decoy":{"w":14,"h":20,"ax":7,"gy":20,"bw":14,"bh":20,"a":{"idle":{"fps":3,"f":[[1791,1672],[1806,1672]]},"move":{"fps":3,"f":[[1821,1672],[1836,1672]]}}},"post":{"w":32,"h":31,"ax":16,"gy":31,"bw":32,"bh":29,"a":{"idle":{"fps":3,"f":[[1851,1672],[1884,1672]]},"move":{"fps":3,"f":[[1917,1672],[1950,1672]]},"atk":{"fps":12,"f":[[1983,1672],[0,1712],[33,1712],[66,1712],[99,1712],[132,1712],[165,1712],[198,1712]]}}},"turret":{"w":55,"h":38,"ax":31,"gy":38,"bw":46,"bh":36,"a":{"idle":{"fps":3,"f":[[231,1712],[287,1712]]},"move":{"fps":14,"f":[[343,1712],[399,1712],[455,1712],[511,1712],[567,1712],[623,1712],[679,1712],[735,1712],[791,1712],[847,1712],[903,1712],[959,1712]]}}},"villager":{"w":16,"h":31,"ax":8,"gy":31,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[1015,1712],[1032,1712],[1049,1712],[1066,1712]]},"move":{"fps":9,"f":[[1083,1712],[1100,1712],[1117,1712],[1134,1712],[1151,1712],[1168,1712]]}}},"smith":{"w":19,"h":33,"ax":10,"gy":33,"bw":19,"bh":33,"a":{"idle":{"fps":5,"f":[[1185,1712],[1205,1712],[1225,1712],[1245,1712]]},"move":{"fps":9,"f":[[1265,1712],[1285,1712],[1305,1712],[1325,1712],[1345,1712],[1365,1712]]}}},"trainer":{"w":24,"h":31,"ax":10,"gy":31,"bw":19,"bh":29,"a":{"idle":{"fps":5,"f":[[1385,1712],[1410,1712],[1435,1712],[1460,1712]]},"move":{"fps":10,"f":[[1485,1712],[1510,1712],[1535,1712],[1560,1712],[1585,1712],[1610,1712]]}}},"guard":{"w":18,"h":35,"ax":8,"gy":35,"bw":17,"bh":34,"a":{"idle":{"fps":5,"f":[[1635,1712],[1654,1712],[1673,1712],[1692,1712]]},"move":{"fps":10,"f":[[1711,1712],[1730,1712],[1749,1712],[1768,1712],[1787,1712],[1806,1712]]}}},"guard_k":{"w":19,"h":31,"ax":8,"gy":31,"bw":17,"bh":31,"a":{"idle":{"fps":5,"f":[[1825,1712],[1845,1712],[1865,1712],[1885,1712]]},"move":{"fps":10,"f":[[1905,1712],[1925,1712],[1945,1712],[1965,1712],[1985,1712],[2005,1712]]}}},"priest":{"w":17,"h":31,"ax":8,"gy":31,"bw":17,"bh":31,"a":{"idle":{"fps":5,"f":[[2025,1712],[0,1751],[18,1751],[36,1751]]},"move":{"fps":10,"f":[[54,1751],[72,1751],[90,1751],[108,1751],[126,1751],[144,1751]]}}},"king":{"w":23,"h":28,"ax":10,"gy":28,"bw":15,"bh":25,"a":{"idle":{"fps":4,"f":[[162,1751],[186,1751],[210,1751],[234,1751]]},"move":{"fps":10,"f":[[258,1751],[282,1751],[306,1751],[330,1751],[354,1751],[378,1751],[402,1751],[426,1751]]},"atk":{"fps":8,"f":[[450,1751],[474,1751],[498,1751],[522,1751],[546,1751],[570,1751],[594,1751]]}}},"queen":{"w":19,"h":25,"ax":10,"gy":25,"bw":15,"bh":23,"a":{"idle":{"fps":6,"f":[[618,1751],[638,1751],[658,1751],[678,1751]]},"move":{"fps":10,"f":[[698,1751],[718,1751],[738,1751],[758,1751],[778,1751],[798,1751],[818,1751],[838,1751]]}}},"cit_peasant":{"w":16,"h":31,"ax":8,"gy":31,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[858,1751],[875,1751],[892,1751],[909,1751]]},"move":{"fps":9,"f":[[926,1751],[943,1751],[960,1751],[977,1751],[994,1751],[1011,1751]]}}},"cit_tavern_a":{"w":23,"h":31,"ax":12,"gy":31,"bw":23,"bh":30,"a":{"idle":{"fps":5,"f":[[1028,1751],[1052,1751],[1076,1751],[1100,1751]]},"move":{"fps":9,"f":[[1124,1751],[1148,1751],[1172,1751],[1196,1751],[1220,1751],[1244,1751]]}}},"cit_tavern_b":{"w":16,"h":31,"ax":8,"gy":31,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[1268,1751],[1285,1751],[1302,1751],[1319,1751]]},"move":{"fps":9,"f":[[1336,1751],[1353,1751],[1370,1751],[1387,1751],[1404,1751],[1421,1751]]}}},"adv_archer":{"w":22,"h":17,"ax":8,"gy":15,"bw":17,"bh":15,"a":{"idle":{"fps":1,"f":[[1438,1751]]},"move":{"fps":12,"f":[[1461,1751],[1484,1751],[1507,1751],[1530,1751],[1553,1751],[1576,1751],[1599,1751],[1622,1751]]},"atk":{"fps":12,"f":[[1645,1751],[1668,1751],[1691,1751],[1714,1751],[1737,1751],[1760,1751]]}}},"adv_dwarf":{"w":29,"h":26,"ax":14,"gy":26,"bw":14,"bh":17,"a":{"idle":{"fps":1,"f":[[1783,1751]]},"move":{"fps":12,"f":[[1813,1751],[1843,1751],[1873,1751],[1903,1751],[1933,1751],[1963,1751],[1993,1751],[0,1783]]},"atk":{"fps":16,"f":[[30,1783],[60,1783],[90,1783],[120,1783],[150,1783],[180,1783],[210,1783],[240,1783],[270,1783],[300,1783],[330,1783]]}}},"adv_knight":{"w":20,"h":26,"ax":10,"gy":26,"bw":11,"bh":15,"a":{"idle":{"fps":1,"f":[[360,1783]]},"move":{"fps":12,"f":[[381,1783],[402,1783],[423,1783],[444,1783],[465,1783],[486,1783],[507,1783],[528,1783]]},"atk":{"fps":16,"f":[[549,1783],[570,1783],[591,1783],[612,1783],[633,1783],[654,1783],[675,1783],[696,1783],[717,1783],[738,1783],[759,1783]]}}},"alec_s":{"w":24,"h":36,"ax":10,"gy":36,"bw":18,"bh":35,"a":{"idle":{"fps":2,"f":[[780,1783],[805,1783],[830,1783],[855,1783]]},"move":{"fps":10,"f":[[880,1783],[905,1783],[930,1783],[955,1783],[980,1783],[1005,1783]]},"dash":{"fps":18,"f":[[1030,1783],[1055,1783],[1080,1783],[1105,1783],[1130,1783],[1155,1783]]},"atk":{"fps":18,"f":[[1180,1783],[1205,1783],[1230,1783],[1255,1783],[1280,1783],[1305,1783],[1330,1783],[1355,1783]]},"atkR":{"fps":18,"f":[[1380,1783],[1405,1783],[1430,1783],[1455,1783]]},"atkL":{"fps":18,"f":[[1480,1783],[1505,1783],[1530,1783],[1555,1783]]}},"hands":{"idle":[[[10,25]],[[10,25]],[[10,26]],[[10,26]]],"move":[[[7,25]],[[8,24]],[[14,21]],[[16,22]],[[15,21]],[[8,24]]],"dash":[[[7,25]],[[8,24]],[[14,21]],[[16,22]],[[15,21]],[[8,24]]],"atk":[[[13,20],[11,23]],[[12,22],[22,17]],[[12,22],[21,18]],[[14,19],[15,20]],[[10,21],[14,21]],[[21,16],[13,24]],[[20,17],[13,24]],[[14,19],[15,20]]],"atkR":[[[13,20],[11,23]],[[12,22],[22,17]],[[12,22],[21,18]],[[14,19],[15,20]]],"atkL":[[[10,21],[14,21]],[[21,16],[13,24]],[[20,17],[13,24]],[[14,19],[15,20]]]},"lanza":{"atk":{"1":1,"5":0},"atkR":{"1":1},"atkL":{"1":0}}},"alec_u":{"w":21,"h":37,"ax":11,"gy":37,"bw":18,"bh":35,"a":{"idle":{"fps":2,"f":[[1580,1783],[1602,1783],[1624,1783],[1646,1783]]},"move":{"fps":10,"f":[[1668,1783],[1690,1783],[1712,1783],[1734,1783],[1756,1783],[1778,1783]]},"dash":{"fps":18,"f":[[1800,1783],[1822,1783],[1844,1783],[1866,1783],[1888,1783],[1910,1783]]},"atk":{"fps":18,"f":[[1932,1783],[1954,1783],[1976,1783],[1998,1783],[2020,1783],[0,1821],[22,1821],[44,1821]]},"atkR":{"fps":18,"f":[[66,1821],[88,1821],[110,1821],[132,1821]]},"atkL":{"fps":18,"f":[[154,1821],[176,1821],[198,1821],[220,1821]]}},"hands":{"idle":[[[5,26],[16,26]],[[5,26],[16,26]],[[5,27],[16,27]],[[5,27],[16,27]]],"move":[[[17,20],[8,27]],[[16,21],[6,25]],[[5,21],[15,25]],[[4,20],[13,27]],[[5,21],[15,25]],[[16,21],[6,25]]],"dash":[[[17,20],[8,27]],[[16,21],[6,25]],[[5,21],[15,25]],[[4,20],[13,27]],[[5,21],[15,25]],[[16,21],[6,25]]],"atk":[[[6,20],[15,27]],[[7,27],[17,4]],[[7,27],[17,6]],[[7,19],[14,19]],[[6,27],[15,20]],[[4,4],[14,27]],[[4,6],[14,27]],[[7,19],[14,19]]],"atkR":[[[6,20],[15,27]],[[7,27],[17,4]],[[7,27],[17,6]],[[7,19],[14,19]]],"atkL":[[[6,27],[15,20]],[[4,4],[14,27]],[[4,6],[14,27]],[[7,19],[14,19]]]},"lanza":{"atk":{"1":1,"5":0},"atkR":{"1":1},"atkL":{"1":0}}},"alec_d":{"w":22,"h":37,"ax":11,"gy":37,"bw":18,"bh":35,"a":{"idle":{"fps":2,"f":[[242,1821],[265,1821],[288,1821],[311,1821]]},"move":{"fps":10,"f":[[334,1821],[357,1821],[380,1821],[403,1821],[426,1821],[449,1821]]},"dash":{"fps":18,"f":[[472,1821],[495,1821],[518,1821],[541,1821],[564,1821],[587,1821]]},"atk":{"fps":18,"f":[[610,1821],[633,1821],[656,1821],[679,1821],[702,1821],[725,1821],[748,1821],[771,1821]]},"atkR":{"fps":18,"f":[[794,1821],[817,1821],[840,1821],[863,1821]]},"atkL":{"fps":18,"f":[[886,1821],[909,1821],[932,1821],[955,1821]]}},"hands":{"idle":[[[5,26],[16,26]],[[5,26],[16,26]],[[5,27],[16,27]],[[5,27],[16,27]]],"move":[[[4,20],[13,27]],[[5,21],[15,25]],[[16,21],[6,25]],[[17,20],[8,27]],[[16,21],[6,25]],[[5,21],[15,25]]],"dash":[[[4,20],[13,27]],[[5,21],[15,25]],[[16,21],[6,25]],[[17,20],[8,27]],[[16,21],[6,25]],[[5,21],[15,25]]],"atk":[[[8,24],[18,23]],[[3,20],[11,22]],[[3,20],[12,21]],[[7,23],[14,23]],[[3,23],[13,24]],[[10,22],[18,20]],[[9,21],[18,20]],[[7,23],[14,23]]],"atkR":[[[8,24],[18,23]],[[3,20],[11,22]],[[3,20],[12,21]],[[7,23],[14,23]]],"atkL":[[[3,23],[13,24]],[[10,22],[18,20]],[[9,21],[18,20]],[[7,23],[14,23]]]},"lanza":{"atk":{"1":1,"5":0},"atkR":{"1":1},"atkL":{"1":0}}},"keeper":{"w":23,"h":31,"ax":12,"gy":31,"bw":23,"bh":30,"a":{"idle":{"fps":5,"f":[[978,1821],[1002,1821],[1026,1821],[1050,1821]]},"move":{"fps":9,"f":[[1074,1821],[1098,1821],[1122,1821],[1146,1821],[1170,1821],[1194,1821]]}}},"merchant":{"w":24,"h":32,"ax":12,"gy":32,"bw":19,"bh":30,"a":{"idle":{"fps":5,"f":[[1218,1821],[1243,1821],[1268,1821],[1293,1821]]},"move":{"fps":10,"f":[[1318,1821],[1343,1821],[1368,1821],[1393,1821],[1418,1821],[1443,1821]]}}},"pc_skel":{"w":32,"h":32,"ax":14,"gy":32,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[1468,1821],[1501,1821],[1534,1821],[1567,1821]]},"move":{"fps":10,"f":[[1600,1821],[1633,1821],[1666,1821],[1699,1821],[1732,1821],[1765,1821]]},"die":{"fps":12,"f":[[1798,1821],[1831,1821],[1864,1821],[1897,1821],[1930,1821],[1963,1821]]}}},"pc_skel_mage":{"w":26,"h":32,"ax":13,"gy":32,"bw":18,"bh":32,"a":{"idle":{"fps":5,"f":[[1996,1821],[0,1859],[27,1859],[54,1859]]},"move":{"fps":10,"f":[[81,1859],[108,1859],[135,1859],[162,1859],[189,1859],[216,1859]]},"die":{"fps":12,"f":[[243,1859],[270,1859],[297,1859],[324,1859],[351,1859],[378,1859]]}}},"pc_skel_rogue":{"w":28,"h":32,"ax":14,"gy":32,"bw":20,"bh":32,"a":{"idle":{"fps":5,"f":[[405,1859],[434,1859],[463,1859],[492,1859]]},"move":{"fps":10,"f":[[521,1859],[550,1859],[579,1859],[608,1859],[637,1859],[666,1859]]},"die":{"fps":12,"f":[[695,1859],[724,1859],[753,1859],[782,1859],[811,1859],[840,1859]]}}},"pc_skel_war":{"w":32,"h":32,"ax":14,"gy":32,"bw":20,"bh":30,"a":{"idle":{"fps":5,"f":[[869,1859],[902,1859],[935,1859],[968,1859]]},"move":{"fps":10,"f":[[1001,1859],[1034,1859],[1067,1859],[1100,1859],[1133,1859],[1166,1859]]},"die":{"fps":12,"f":[[1199,1859],[1232,1859],[1265,1859],[1298,1859],[1331,1859],[1364,1859],[1397,1859],[1430,1859]]}}},"pc_zombie":{"w":32,"h":33,"ax":10,"gy":33,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[1463,1859],[1496,1859],[1529,1859],[1562,1859]]},"move":{"fps":10,"f":[[1595,1859],[1628,1859],[1661,1859],[1694,1859],[1727,1859],[1760,1859]]},"die":{"fps":12,"f":[[1793,1859],[1826,1859],[1859,1859],[1892,1859],[1925,1859],[1958,1859]]}}},"pc_zombie_fat":{"w":32,"h":33,"ax":10,"gy":33,"bw":17,"bh":32,"a":{"idle":{"fps":5,"f":[[1991,1859],[0,1893],[33,1893],[66,1893]]},"move":{"fps":10,"f":[[99,1893],[132,1893],[165,1893],[198,1893],[231,1893],[264,1893]]},"die":{"fps":12,"f":[[297,1893],[330,1893],[363,1893],[396,1893],[429,1893],[462,1893]]}}},"pc_zombie_mus":{"w":31,"h":32,"ax":10,"gy":32,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[495,1893],[527,1893],[559,1893],[591,1893]]},"move":{"fps":10,"f":[[623,1893],[655,1893],[687,1893],[719,1893],[751,1893],[783,1893]]},"die":{"fps":12,"f":[[815,1893],[847,1893],[879,1893],[911,1893],[943,1893],[975,1893]]}}},"pc_banshee":{"w":41,"h":48,"ax":11,"gy":48,"bw":18,"bh":47,"a":{"idle":{"fps":5,"f":[[1007,1893],[1049,1893],[1091,1893],[1133,1893]]},"move":{"fps":10,"f":[[1175,1893],[1217,1893],[1259,1893],[1301,1893],[1343,1893],[1385,1893]]},"die":{"fps":12,"f":[[1427,1893],[1469,1893],[1511,1893],[1553,1893],[1595,1893],[1637,1893]]}}},"pc_fungus":{"w":38,"h":32,"ax":18,"gy":32,"bw":27,"bh":30,"a":{"idle":{"fps":5,"f":[[1679,1893],[1718,1893],[1757,1893],[1796,1893]]},"move":{"fps":10,"f":[[1835,1893],[1874,1893],[1913,1893],[1952,1893],[1991,1893],[0,1942]]},"die":{"fps":12,"f":[[39,1942],[78,1942],[117,1942],[156,1942],[195,1942],[234,1942]]}}},"pc_fungus_long":{"w":53,"h":52,"ax":26,"gy":52,"bw":36,"bh":50,"a":{"idle":{"fps":5,"f":[[273,1942],[327,1942],[381,1942],[435,1942]]},"move":{"fps":10,"f":[[489,1942],[543,1942],[597,1942],[651,1942],[705,1942],[759,1942]]},"die":{"fps":12,"f":[[813,1942],[867,1942],[921,1942],[975,1942],[1029,1942],[1083,1942]]}}},"pc_fungus_heavy":{"w":52,"h":37,"ax":23,"gy":37,"bw":40,"bh":35,"a":{"idle":{"fps":5,"f":[[1137,1942],[1190,1942],[1243,1942],[1296,1942]]},"move":{"fps":10,"f":[[1349,1942],[1402,1942],[1455,1942],[1508,1942],[1561,1942],[1614,1942]]},"die":{"fps":12,"f":[[1667,1942],[1720,1942],[1773,1942],[1826,1942],[1879,1942],[1932,1942]]}}},"pc_fungus_old":{"w":52,"h":41,"ax":22,"gy":41,"bw":30,"bh":39,"a":{"idle":{"fps":5,"f":[[1985,1942],[0,1995],[53,1995],[106,1995]]},"move":{"fps":10,"f":[[159,1995],[212,1995],[265,1995],[318,1995],[371,1995],[424,1995]]},"die":{"fps":12,"f":[[477,1995],[530,1995],[583,1995],[636,1995],[689,1995],[742,1995]]}}},"pc_rat":{"w":42,"h":34,"ax":16,"gy":34,"bw":27,"bh":30,"a":{"idle":{"fps":5,"f":[[795,1995],[838,1995],[881,1995],[924,1995]]},"move":{"fps":10,"f":[[967,1995],[1010,1995],[1053,1995],[1096,1995],[1139,1995],[1182,1995]]},"die":{"fps":12,"f":[[1225,1995],[1268,1995],[1311,1995],[1354,1995],[1397,1995],[1440,1995]]}}},"pc_rat_rogue":{"w":46,"h":35,"ax":16,"gy":35,"bw":27,"bh":30,"a":{"idle":{"fps":5,"f":[[1483,1995],[1530,1995],[1577,1995],[1624,1995]]},"move":{"fps":10,"f":[[1671,1995],[1718,1995],[1765,1995],[1812,1995],[1859,1995],[1906,1995]]},"die":{"fps":12,"f":[[1953,1995],[2000,1995],[0,2037],[47,2037],[94,2037],[141,2037]]}}},"pc_rat_mage":{"w":41,"h":35,"ax":16,"gy":35,"bw":27,"bh":30,"a":{"idle":{"fps":5,"f":[[188,2037],[230,2037],[272,2037],[314,2037]]},"move":{"fps":10,"f":[[356,2037],[398,2037],[440,2037],[482,2037],[524,2037],[566,2037]]},"die":{"fps":12,"f":[[608,2037],[650,2037],[692,2037],[734,2037],[776,2037],[818,2037]]}}},"pc_rat_war":{"w":47,"h":34,"ax":16,"gy":34,"bw":29,"bh":30,"a":{"idle":{"fps":5,"f":[[860,2037],[908,2037],[956,2037],[1004,2037]]},"move":{"fps":10,"f":[[1052,2037],[1100,2037],[1148,2037],[1196,2037],[1244,2037],[1292,2037]]},"die":{"fps":12,"f":[[1340,2037],[1388,2037],[1436,2037],[1484,2037],[1532,2037],[1580,2037]]}}},"pc_stone":{"w":28,"h":49,"ax":14,"gy":49,"bw":21,"bh":29,"a":{"idle":{"fps":5,"f":[[1628,2037],[1657,2037],[1686,2037],[1715,2037]]},"move":{"fps":10,"f":[[1744,2037],[1773,2037],[1802,2037],[1831,2037],[1860,2037],[1889,2037]]},"die":{"fps":12,"f":[[1918,2037],[1947,2037],[1976,2037],[2005,2037],[0,2087],[29,2087]]}}},"pc_stone_broken":{"w":26,"h":32,"ax":14,"gy":32,"bw":19,"bh":23,"a":{"idle":{"fps":5,"f":[[58,2087],[85,2087],[112,2087],[139,2087]]},"move":{"fps":10,"f":[[166,2087],[193,2087],[220,2087],[247,2087],[274,2087],[301,2087]]},"die":{"fps":12,"f":[[328,2087],[355,2087],[382,2087],[409,2087],[436,2087],[463,2087]]}}},"pc_stone_lava":{"w":34,"h":37,"ax":19,"gy":37,"bw":22,"bh":27,"a":{"idle":{"fps":5,"f":[[490,2087],[525,2087],[560,2087],[595,2087]]},"move":{"fps":10,"f":[[630,2087],[665,2087],[700,2087],[735,2087],[770,2087],[805,2087]]},"die":{"fps":12,"f":[[840,2087],[875,2087],[910,2087],[945,2087],[980,2087],[1015,2087]]}}},"pc_golem":{"w":28,"h":46,"ax":14,"gy":46,"bw":21,"bh":31,"a":{"idle":{"fps":5,"f":[[1050,2087],[1079,2087],[1108,2087],[1137,2087]]},"move":{"fps":10,"f":[[1166,2087],[1195,2087],[1224,2087],[1253,2087],[1282,2087],[1311,2087]]},"die":{"fps":12,"f":[[1340,2087],[1369,2087],[1398,2087],[1427,2087],[1456,2087],[1485,2087]]}}},"alec_kid":{"w":24,"h":27,"ax":12,"gy":27,"bw":19,"bh":18,"a":{"idle":{"fps":3,"f":[[1514,2087],[1539,2087]]},"move":{"fps":14,"f":[[1564,2087],[1589,2087],[1614,2087],[1639,2087],[1664,2087],[1689,2087],[1714,2087],[1739,2087],[1764,2087],[1789,2087]]}}},"alec_teen":{"w":47,"h":44,"ax":26,"gy":44,"bw":41,"bh":30,"a":{"idle":{"fps":3,"f":[[1814,2087],[1862,2087]]},"move":{"fps":14,"f":[[1910,2087],[1958,2087],[0,2137],[48,2137],[96,2137],[144,2137],[192,2137],[240,2137],[288,2137],[336,2137],[384,2137],[432,2137]]},"atk":{"fps":14,"f":[[480,2137],[528,2137],[576,2137],[624,2137],[672,2137],[720,2137],[768,2137],[816,2137],[864,2137],[912,2137]]}}},"oldsmith":{"w":18,"h":30,"ax":8,"gy":30,"bw":16,"bh":30,"a":{"idle":{"fps":5,"f":[[960,2137],[979,2137],[998,2137],[1017,2137]]},"move":{"fps":10,"f":[[1036,2137],[1055,2137],[1074,2137],[1093,2137],[1112,2137],[1131,2137]]}}}};
// Generado por tools/pack_city_houses.py con piezas del Pixel Crawler Free Pack (Anokolisa) e iconos de Raven Fantasy Icons. No editar a mano.
// Casas de las ciudades en assets/cityhouses.png: r = [x, y, ancho, alto]; size big (128 px) o small (96 px); roof: color del tejado; wall: pared; trade: forja o posada.
const CITY_HOUSES = [{"size":"big","roof":"brown","wall":"log","r":[0,0,128,138]},{"size":"big","roof":"brown","wall":"timber","r":[130,0,128,133]},{"size":"big","roof":"brown","wall":"log","r":[260,0,128,138]},{"size":"small","roof":"brown","wall":"timber","r":[390,0,96,139]},{"size":"small","roof":"brown","wall":"log","r":[488,0,96,144]},{"size":"small","roof":"brown","wall":"timber","r":[586,0,96,139]},{"size":"big","roof":"red","wall":"log","r":[684,0,128,138]},{"size":"big","roof":"red","wall":"timber","r":[814,0,128,133]},{"size":"big","roof":"red","wall":"log","r":[0,146,128,138]},{"size":"small","roof":"red","wall":"timber","r":[130,146,96,139]},{"size":"small","roof":"red","wall":"log","r":[228,146,96,144]},{"size":"small","roof":"red","wall":"timber","r":[326,146,96,139]},{"size":"big","roof":"ochre","wall":"log","r":[424,146,128,138]},{"size":"big","roof":"ochre","wall":"timber","r":[554,146,128,133]},{"size":"big","roof":"ochre","wall":"log","r":[684,146,128,138]},{"size":"small","roof":"ochre","wall":"timber","r":[814,146,96,139]},{"size":"small","roof":"ochre","wall":"log","r":[912,146,96,144]},{"size":"small","roof":"ochre","wall":"timber","r":[0,292,96,139]},{"size":"big","roof":"slate","wall":"log","r":[98,292,128,138]},{"size":"big","roof":"slate","wall":"timber","r":[228,292,128,133]},{"size":"big","roof":"slate","wall":"log","r":[358,292,128,138]},{"size":"small","roof":"slate","wall":"timber","r":[488,292,96,139]},{"size":"small","roof":"slate","wall":"log","r":[586,292,96,144]},{"size":"small","roof":"slate","wall":"timber","r":[684,292,96,139]},{"size":"big","roof":"plum","wall":"log","r":[782,292,128,138]},{"size":"big","roof":"plum","wall":"timber","r":[0,438,128,133]},{"size":"big","roof":"plum","wall":"log","r":[130,438,128,138]},{"size":"small","roof":"plum","wall":"timber","r":[260,438,96,139]},{"size":"small","roof":"plum","wall":"log","r":[358,438,96,144]},{"size":"small","roof":"plum","wall":"timber","r":[456,438,96,139]},{"size":"big","roof":"teal","wall":"log","r":[554,438,128,138]},{"size":"big","roof":"teal","wall":"timber","r":[684,438,128,133]},{"size":"big","roof":"teal","wall":"log","r":[814,438,128,138]},{"size":"small","roof":"teal","wall":"timber","r":[0,584,96,139]},{"size":"small","roof":"teal","wall":"log","r":[98,584,96,144]},{"size":"small","roof":"teal","wall":"timber","r":[196,584,96,139]},{"size":"big","roof":"blue","wall":"log","r":[294,584,128,138]},{"size":"big","roof":"blue","wall":"timber","r":[424,584,128,133]},{"size":"big","roof":"blue","wall":"log","r":[554,584,128,138]},{"size":"small","roof":"blue","wall":"timber","r":[684,584,96,139]},{"size":"small","roof":"blue","wall":"log","r":[782,584,96,144]},{"size":"small","roof":"blue","wall":"timber","r":[880,584,96,139]},{"size":"big","roof":"moss","wall":"log","r":[0,730,128,138]},{"size":"big","roof":"moss","wall":"timber","r":[130,730,128,133]},{"size":"big","roof":"moss","wall":"log","r":[260,730,128,138]},{"size":"small","roof":"moss","wall":"timber","r":[390,730,96,139]},{"size":"small","roof":"moss","wall":"log","r":[488,730,96,144]},{"size":"small","roof":"moss","wall":"timber","r":[586,730,96,139]},{"size":"big","roof":"red","wall":"brick","trade":"forge","r":[684,730,128,133]},{"size":"big","roof":"ochre","wall":"timber","trade":"inn","r":[814,730,128,133]}];
// Iconos de los sitios de la ciudad (flechas en el borde de la pantalla)
const PLACE_ICON = {"forge":[944,858,16,16],"inn":[960,858,16,16],"board":[976,858,16,16],"gym":[992,858,16,16],"king":[1008,858,16,16]};
// Generado por tools/pack_decor.py (Pixel Crawler de Anokolisa, Ancient Ruins de Androx). No editar a mano.
const DECOR = {"1":{"wall":[[229,0,14,22],[244,0,14,26],[259,0,16,21],[276,0,14,19],[291,0,20,35],[312,0,20,35],[333,0,16,21],[350,0,14,24],[365,0,10,21],[376,0,10,21],[387,0,31,47]],"floor":[[419,0,10,9],[430,0,9,6],[440,0,10,8],[451,0,11,9],[463,0,13,12],[477,0,26,22],[0,65,15,13],[16,65,25,22],[42,65,22,28],[65,65,24,24],[90,65,19,18]],"decal":[],"solid":[[0,0,20,35],[21,0,20,35],[42,0,20,53],[63,0,18,32],[82,0,16,33],[99,0,20,32],[120,0,16,34],[137,0,31,47],[169,0,28,43],[198,0,30,64]]},"2":{"wall":[[266,65,27,28],[294,65,27,28],[322,65,20,26],[343,65,19,25],[363,65,23,24],[387,65,13,32],[401,65,12,32],[414,65,53,45]],"floor":[[468,65,14,16],[483,65,10,11],[494,65,10,11],[0,111,13,12],[14,111,12,8],[27,111,11,9]],"decal":[],"solid":[[110,65,27,28],[138,65,27,28],[166,65,20,26],[187,65,13,32],[201,65,12,32],[214,65,28,30],[243,65,22,42]]},"3":{"wall":[[175,111,15,15],[191,111,15,15],[207,111,15,15],[223,111,15,48],[239,111,14,32],[254,111,13,32],[268,111,12,16],[281,111,32,25]],"floor":[[314,111,13,12],[328,111,12,8],[341,111,12,15],[354,111,9,7]],"decal":[],"solid":[[39,111,15,48],[55,111,14,32],[70,111,13,32],[84,111,28,31],[113,111,28,31],[142,111,32,25]]},"4":{"wall":[[64,165,16,22],[81,165,16,22],[98,165,16,23],[115,165,16,22],[132,165,16,19],[149,165,28,44],[178,165,10,21],[189,165,20,53]],"floor":[[210,165,10,9],[221,165,10,8],[232,165,8,13],[241,165,8,13],[250,165,15,13],[266,165,19,18],[286,165,25,22]],"decal":[],"solid":[[364,111,28,44],[393,111,28,28],[422,111,20,53],[443,111,16,22],[460,111,16,23],[477,111,18,32],[0,165,31,47],[32,165,31,53]]}};
// Generado por tools/pack_doors.py con el arco de piedra del Pixel Crawler Free Pack (Anokolisa). No editar a mano.
// arch: [x, y, ancho, alto] en assets/doors.png; hole: el hueco del arco, relativo al arco
const DOOR_ART = {"arch": [0, 0, 42, 62], "hole": [4, 4, 34, 58]};
// Generado por tools/pack_fx.py: efectos de «Super Pixel Effects Gigapack» (Will Tice / unTied Games) y «Effect and Bullet 16x16».
// Cada efecto ocupa ocho filas, una por color, en este orden.
const FXCOL = ["orange", "yellow", "green", "blue", "violet", "red", "white", "black"];
const FXA = {"flame": {"y": 0, "w": 20, "h": 30, "n": 12}, "hit": {"y": 240, "w": 48, "h": 48, "n": 7}, "cast": {"y": 624, "w": 32, "h": 32, "n": 7}, "boom": {"y": 880, "w": 32, "h": 32, "n": 8}, "bolt": {"y": 1136, "w": 16, "h": 16, "n": 5}, "poison": {"y": 1264, "w": 48, "h": 48, "n": 12}, "sleep": {"y": 1648, "w": 24, "h": 24, "n": 11}, "spark": {"y": 1840, "w": 48, "h": 48, "n": 12}, "skull": {"y": 2224, "w": 32, "h": 48, "n": 10}, "aura": {"y": 2608, "w": 48, "h": 48, "n": 8}, "thorns": {"y": 2992, "w": 80, "h": 48, "n": 6}, "ice": {"y": 3376, "w": 64, "h": 64, "n": 5}, "clock": {"y": 3888, "w": 64, "h": 64, "n": 12}, "blast": {"y": 4400, "w": 64, "h": 64, "n": 13}, "well": {"y": 4912, "w": 64, "h": 64, "n": 9}};
// Generado por tools/pack_houses.py con piezas del Pixel Crawler Free Pack (Anokolisa). No editar a mano.
// [x, y, ancho, alto] de cada casa en assets/houses.png; las 0, 1 y 4 son grandes (128 px), las demás pequeñas (96 px); de la 6 a la 11, las mismas en ruinas
const HOUSES = [[0, 0, 128, 133], [130, 0, 128, 133], [260, 0, 96, 144], [358, 0, 96, 139], [456, 0, 128, 133], [586, 0, 96, 139], [684, 0, 128, 133], [814, 0, 128, 133], [944, 0, 96, 144], [1042, 0, 96, 139], [1140, 0, 128, 133], [1270, 0, 96, 139]];
// Generado por tools/pack_icons.py («Raven Fantasy Icons», Clockwork Raven Studios). Posición de cada icono en assets/icons.png, 16 por fila.
const PIC = {"m_seed":0,"m_salt":1,"m_saw":2,"m_quick":3,"m_star":4,"m_std":5,"m_drum":6,"m_belt":7,"m_charged":8,"m_heavy":9,"m_chain":10,"m_silver":11,"m_frag":12,"m_blood":13,"m_last":14,"m_ice":15,"m_fire":16,"m_gold":17,"m_split":18,"m_mark":19,"m_big":20,"m_blunt":21,"m_grow":22,"m_awl":23,"m_timed":24,"m_leech":25,"m_link":26,"a_drum":27,"a_glass":28,"a_dice":29,"a_nana":30,"a_fuse":31,"a_auto":32,"a_pend":33,"a_hold":34,"a_spring":35,"a_alt":36,"a_combo":37,"a_rider":38,"a_kick":39,"a_fly":40,"a_fin":41,"a_firm":42,"a_rota":43,"a_over":44,"a_bolt":45,"a_semi":46,"a_burst":47,"a_rotary":48,"a_draw":49,"a_shackle":50,"a_maul":51,"a_humm":52,"s_grave":53,"s_wine":54,"s_kennel":55,"s_geode":56,"s_roll":57,"s_anchor":58,"s_sprint":59,"s_venge":60,"s_gasp":61,"s_sapper":62,"s_dance":63,"s_tower":64,"s_loot":65,"s_wind":66,"s_spring":67,"s_shield":68,"s_scope":69,"s_spikes":70,"s_bone":71,"s_std":72,"s_light":73,"s_heavy":74,"s_recoil":75,"s_brace":76,"b_blow":77,"b_wyrm":78,"b_rod":79,"b_icicle":80,"b_long":81,"b_short":82,"b_twin":83,"b_scatter":84,"b_pierce":85,"b_bomb":86,"b_spike":87,"b_fork":88,"b_harpoon":89,"b_flame":90,"b_back":91,"b_flail":92,"b_boom":93,"b_nail":94,"b_arc":95,"b_far":96,"b_swarm":97,"b_horn":98,"b_drill":99,"b_ghost":100,"b_net":101,"b_ends":102,"b_cluster":103,"b_hydra":104,"c_sima":105,"c_doom":106,"c_anvil":107,"c_beam":108,"c_fan":109,"c_rain":110,"c_supp":111,"c_dash":112,"c_blast":113,"c_mine":114,"c_nova":115,"c_turret":116,"c_snipe":117,"c_meteor":118,"c_chain":119,"c_balm":120,"c_bounce":121,"c_volley":122,"c_ward":123,"c_blink":124,"c_drain":125,"c_brand":126,"c_quake":127,"dragon_basic":128,"dragon_charge":129,"dragon_dodge":130,"dragon_passive":131,"stone_basic":132,"stone_charge":133,"stone_dodge":134,"stone_passive":135,"venom_basic":136,"venom_charge":137,"venom_dodge":138,"venom_passive":139,"feast_basic":140,"feast_charge":141,"feast_dodge":142,"feast_passive":143,"orc_basic":144,"orc_charge":145,"orc_dodge":146,"orc_passive":147,"time_basic":148,"time_charge":149,"time_dodge":150,"time_passive":151,"shade_basic":152,"shade_charge":153,"shade_dodge":154,"shade_passive":155,"storm_basic":156,"storm_charge":157,"storm_dodge":158,"storm_passive":159,"tide_basic":160,"tide_charge":161,"tide_dodge":162,"tide_passive":163,"luck_basic":164,"luck_charge":165,"luck_dodge":166,"luck_passive":167,"wood_basic":168,"wood_charge":169,"wood_dodge":170,"wood_passive":171,"frost_basic":172,"frost_charge":173,"frost_dodge":174,"frost_passive":175,"blood_basic":176,"blood_charge":177,"blood_dodge":178,"blood_passive":179,"end_basic":180,"end_charge":181,"end_dodge":182,"end_passive":183,"light_basic":184,"light_charge":185,"light_dodge":186,"light_passive":187,"dream_basic":188,"dream_charge":189,"dream_dodge":190,"dream_passive":191,"void_basic":192,"void_charge":193,"void_dodge":194,"void_passive":195,"mirror_basic":196,"mirror_charge":197,"mirror_dodge":198,"mirror_passive":199,"beast_basic":200,"beast_charge":201,"beast_dodge":202,"beast_passive":203,"forge_basic":204,"forge_charge":205,"forge_dodge":206,"forge_passive":207,"d_blood":208,"d_pyre":209,"m_reson":210,"m_quartz":211,"v_vapors":212,"v_syn":213,"f_cellar":214,"f_carve":215,"o_drums":216,"o_berserk":217,"t_overtime":218,"t_paradox":219,"s_guard":220,"s_legion":221,"r_over":222,"d_warm":223,"m_skin":224,"v_slow":225,"f_appet":226,"o_scars":227,"t_second":228,"s_last":229,"r_spark":230,"w_brine":231,"w_deep":232,"l_coin":233,"l_jack":234,"b_thorn":235,"b_bloom":236,"i_rime":237,"i_shatter":238,"h_warm":239,"h_frenzy":240,"e_ink":241,"e_seal":242,"u_glint":243,"u_halo":244,"z_yawn":245,"z_night":246,"o_tug":247,"o_crush":248,"q_shard":249,"q_break":250,"a_pup":251,"a_feral":252,"g_whet":253,"g_slag":254,"r_judge":255};
// Generado por tools/pack_outdoor.py (Pixel Crawler de Anokolisa). No editar a mano.
const OUTP = {"u_lich":[0,0,150,113],"pine_l":[151,0,46,103],"dead_l":[198,0,46,103],"mush_tall":[245,0,60,96],"u_ruin1":[306,0,80,95],"u_dtree1":[387,0,63,89],"mush_xl":[0,114,87,88],"tent":[88,114,48,87],"barrel_big":[137,114,52,82],"u_thorn1":[190,114,110,80],"olive":[301,114,78,76],"u_tree1":[380,114,59,74],"deadtree":[440,114,64,74],"tusk_l":[0,203,54,71],"u_dtree2":[55,203,59,69],"u_ribs":[115,203,30,64],"u_ribs2":[146,203,31,64],"pine_m":[178,203,32,64],"dead_m":[211,203,32,64],"u_tree2":[244,203,49,63],"u_arm1":[294,203,61,62],"u_ruin2":[356,203,79,62],"vine_l":[436,203,45,62],"cross_stat":[0,275,32,60],"skullflag":[33,275,48,59],"u_arm2":[82,275,45,57],"cross2":[128,275,30,56],"u_ruin3":[159,275,55,54],"u_arm3":[215,275,31,53],"u_thorn2":[247,275,94,53],"cross_big":[342,275,20,53],"u_pile":[363,275,71,51],"cask":[435,275,34,50],"u_bones2":[0,336,48,48],"tusk_m":[49,336,39,48],"flower_l2":[89,336,38,48],"u_skull":[128,336,31,47],"u_ruin4":[160,336,47,46],"tusk_s":[208,336,29,46],"flower_l":[238,336,38,46],"mossy2":[277,336,43,46],"u_dtree3":[321,336,46,45],"boulder2":[368,336,43,45],"mossy3":[412,336,59,45],"mush_l":[0,385,53,45],"boulder3":[54,385,59,44],"u_arm4":[114,385,28,43],"reaper":[143,385,30,43],"darkbush":[174,385,57,42],"vine_m":[232,385,22,42],"u_tree3":[255,385,32,41],"shelf":[288,385,44,41],"ctable":[333,385,40,40],"rune1":[374,385,42,40],"grey1":[417,385,42,40],"u_beast":[460,385,43,39],"u_log":[0,431,84,39],"tomb1":[85,431,22,39],"tomb2":[108,431,22,39],"tomb3":[131,431,24,39],"firering":[156,431,36,36],"coffin1":[193,431,20,35],"coffin2":[214,431,20,35],"angel1":[235,431,16,34],"bedroll1":[252,431,20,34],"bedroll2":[273,431,20,34],"u_bones1":[294,431,44,33],"angel2":[339,431,32,33],"pine_s":[372,431,16,32],"dead_s":[389,431,16,32],"boulder1":[406,431,37,32],"bush_g":[444,431,47,32],"bush_a":[0,471,47,32],"graves_row":[48,471,48,31],"vine_s":[97,471,24,31],"rune2":[122,471,28,31],"grey2":[151,471,28,31],"flower_m":[180,471,28,30],"deadbush":[209,471,25,29],"mush_m":[235,471,27,28],"grave2":[263,471,14,26],"barrels":[278,471,32,26],"flower_m2":[311,471,27,26],"grave1":[339,471,14,22],"grave3":[354,471,16,21],"grave4":[371,471,14,19],"bags":[386,471,22,15]};
// Generado por tools/pack_town.py con piezas del Pixel Crawler Free Pack (Anokolisa). No editar a mano.
const TOWN = {"anvil":[0,0,79,56],"furnace":[80,0,36,57],"workbench":[117,0,73,48],"scarecrow":[191,0,24,47],"hay":[216,0,22,20],"veg1":[239,0,16,16],"veg2":[256,0,16,16],"veg3":[273,0,16,16],"veg4":[290,0,16,16],"bush1":[307,0,29,27],"bush2":[337,0,35,33],"bush3":[373,0,43,43],"shrub":[417,0,42,64],"bush4":[460,0,29,27],"shrub2":[0,65,42,64],"table":[43,65,64,24],"bench":[108,65,58,32],"bench_s":[167,65,30,12],"fence":[198,65,68,80],"flower1":[267,65,16,16],"flower2":[284,65,16,21],"stone_floor":[301,65,64,80]};
// Generado por tools/pack_weapons.py (Pixel Crawler de Anokolisa). No editar a mano.
// [x, y, ancho, alto, agarre x, agarre y]
const WEAP = {"cb_light":[0,0,22,15,7,7],"cb_heavy":[23,0,26,20,8,10],"bow_fire_0":[50,0,8,21,4,10],"bow_fire_1":[59,0,9,20,5,10],"bow_fire_2":[69,0,10,17,6,8],"bow_poison_0":[80,0,7,21,4,10],"bow_poison_1":[88,0,9,20,5,10],"bow_poison_2":[98,0,10,18,6,9],"bow_cursed_0":[109,0,7,21,4,10],"bow_cursed_1":[117,0,9,20,5,10],"bow_cursed_2":[127,0,10,17,6,8],"bow_elf_0":[138,0,7,21,4,10],"bow_elf_1":[146,0,7,18,4,9],"bow_elf_2":[154,0,10,17,6,8],"bow_wood_0":[165,0,6,21,3,10],"bow_wood_1":[172,0,8,18,4,9],"bow_wood_2":[181,0,10,17,6,8]};
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

// ── El arma en la mano de Alec: la forma la decide el Cañón (ballesta ligera, pesada o arco) y el material del arco,
// la deidad de la que más técnicas lleva (fuego, veneno, maldito, élfico o madera) ──
loadImg('weapons', 'assets/weapons.png');
const HEAVY_B = ['b_pierce', 'b_bomb', 'b_harpoon', 'b_far', 'b_horn', 'b_drill', 'b_net', 'b_flame', 'b_wyrm', 'b_icicle'];
const BOW_B = { b_scatter: 2, b_fork: 2, b_swarm: 1, b_arc: 1, b_boom: 0, b_nail: 0, b_back: 1 };
const BOW_MAT = { dragon: 'fire', forge: 'fire', storm: 'fire', venom: 'poison', feast: 'poison', beast: 'poison', shade: 'cursed', end: 'cursed', void: 'cursed', blood: 'cursed', mirror: 'cursed',
  wood: 'elf', dream: 'elf', frost: 'elf', tide: 'elf', time: 'elf', luck: 'elf', light: 'elf' };
function heroGod() {
  const n = {};
  for (const k of SLOT_KEYS) { const cur = S.build[k]; if (!cur) continue; const D = DUO[cur.id], gs = D ? [PIECE[D.a] && PIECE[D.a].god, PIECE[D.b] && PIECE[D.b].god] : [PIECE[cur.id] && PIECE[cur.id].god]; for (const g of gs) if (g) n[g] = (n[g] || 0) + (cur.lvl || 1); }
  return Object.keys(n).sort((a, b) => n[b] - n[a])[0] || null;
}
function weaponKey() {
  const b = S.gun.barrel;
  if (b in BOW_B) return 'bow_' + (BOW_MAT[heroGod()] || 'wood') + '_' + BOW_B[b];
  return HEAVY_B.includes(b) ? 'cb_heavy' : 'cb_light';
}
function drawWeapon(x, y, ang, kick) {
  const im = IMG.weapons; if (!im) return false;
  const k = weaponKey(), w = WEAP[k]; if (!w) return false;
  x += Math.cos(ang) * 1.5; y += Math.sin(ang) * 1 + 5;   // en las manos, pegada al cuerpo
  const left = Math.cos(ang) < 0;
  const one = (ox, oy) => { ctx.save(); ctx.translate(Math.round(x + ox), Math.round(y + oy)); ctx.rotate(ang); if (left) ctx.scale(1, -1); ctx.drawImage(im, w[0], w[1], w[2], w[3], -w[4] - kick, -w[5], w[2], w[3]); ctx.restore(); };
  if (S.gun.barrel === 'b_twin') { const nx = -Math.sin(ang) * 3, ny = Math.cos(ang) * 3; one(nx, ny); one(-nx, -ny); } else one(0, 0);
  return true;
}
// ── Personajes del paquete: fotograma según la animación y el tiempo, con los pies en (x, yFeet) ──
const charKey = e => (e.skin && ATLAS[e.skin] ? e.skin : e.champ ? 'champ' : Object.keys(TYPES).find(k => TYPES[k] === e.type));
// Los paquetes traen pocos dibujos por animación (de 4 a 14 por ciclo, a 5-20 por segundo). El juego pinta a 60, así que entre un
// dibujo y el siguiente se funde uno con otro: cada fotograma en pantalla es una mezcla exacta de los dos, y el movimiento no da saltos.
let MIX = null;
function mixFrame(im, m, a, time) {
  const n = a.f.length, ft = time * a.fps, fl = Math.floor(ft), i = ((fl % n) + n) % n, fr = ft - fl;
  if (n < 2 || fr < 0.06 || !CFG.blend) return [im, a.f[i][0], a.f[i][1], i];
  if (!MIX) { MIX = document.createElement('canvas'); MIX.width = 192; MIX.height = 160; }
  if (MIX.width < m.w || MIX.height < m.h) { MIX.width = Math.max(MIX.width, m.w); MIX.height = Math.max(MIX.height, m.h); }
  const g = MIX.getContext('2d'), j = (i + 1) % n;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, m.w, m.h);
  g.globalAlpha = 1 - fr; g.drawImage(im, a.f[i][0], a.f[i][1], m.w, m.h, 0, 0, m.w, m.h);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = fr; g.drawImage(im, a.f[j][0], a.f[j][1], m.w, m.h, 0, 0, m.w, m.h);
  return [MIX, 0, 0, i];
}
function drawChar(key, anim, time, x, yFeet, flip, flash) {
  const m = ATLAS[key]; if (!m || !IMG.chars) return false;
  const a = m.a[anim] || m.a.move, [im, sx, sy] = mixFrame(flash ? IMG.charsF : IMG.chars, m, a, time);
  if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(im, sx, sy, m.w, m.h, -m.ax, Math.round(yFeet - m.gy), m.w, m.h); ctx.restore(); }
  else ctx.drawImage(im, sx, sy, m.w, m.h, Math.round(x - m.ax), Math.round(yFeet - m.gy), m.w, m.h);
  return true;
}
// El aspecto de Alec crece con su poder en la misión: cuatro niveles
const heroKey = () => 'alec_s';
// Alec es el mago de los guanteletes (tools/make_mage.py): mira hacia donde apunta (lado, arriba o abajo). Su poder en la misión no le cambia
// el cuerpo: le da un aura cada vez más fuerte y le tiñe la ropa del color de la deidad que más lleva.
let HERO_TMP = null, HERO_SIL = null;
// La vista que toca según hacia dónde mira (la misma regla que drawHero)
const heroView = face => { const fx = Math.cos(face), fy = Math.sin(face), key = Math.abs(fy) > Math.abs(fx) * 1.3 ? (fy < 0 ? 'alec_u' : 'alec_d') : 'alec_s'; return { key, flip: key === 'alec_s' && fx < 0 }; };
// Dónde está, en el mundo, el puño que lanza: hand 'R' (derecho, el cercano de lado) o 'L' (izquierdo). Sale del fotograma y del
// puño que marca «lanza» en manos.json (tools/make_mage.py); de ahí parten la cadena y el destello.
function heroHand(face, hand) {
  const p = S.p, { key, flip } = heroView(face), m = ATLAS[key], an = 'atk' + (hand || 'R'), L = m && m.lanza && m.lanza[an];
  const fr = L && Object.keys(L)[0], h = fr != null && m.hands && m.hands[an] && m.hands[an][fr] && m.hands[an][fr][L[fr]];
  if (!h) return { x: p.x + Math.cos(face) * 14, y: p.y + Math.sin(face) * 14 };
  const yFeet = (p.dodgeT > 0 && p.fly ? p.y - 5 : p.y) + p.r + 2;
  return { x: flip ? p.x + m.ax - h[0] : p.x - m.ax + h[0], y: yFeet - m.gy + h[1] - 2 };
}
// Los guanteletes de Alec, del color de su cadena (el del disparo): una copia del atlas con los cuatro tonos de metal de los guanteletes
// (los de tools/make_mage.py: brillo, base, sombra y sombra honda) cambiados por la rampa de ese color. Se rehace solo al cambiar de color.
const GAUNT_TONES = { '227,234,242': 'hi', '151,163,184': 'base', '95,106,132': 'sh', '55,62,82': 'deep' };
let GAUNT_IMG = null, GAUNT_COL = null, GAUNT_FAIL = false;
function gauntImg(col) {
  if (!IMG.chars || GAUNT_FAIL) return null;   // si el navegador no deja leer los píxeles (juego abierto como archivo local), guanteletes de metal
  if (GAUNT_IMG && GAUNT_COL === col) return GAUNT_IMG;
  const cv = GAUNT_IMG || document.createElement('canvas'); cv.width = IMG.chars.width; cv.height = IMG.chars.height;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(IMG.chars, 0, 0);
  const R = rampRGB(col);
  try { for (const key of ['alec_s', 'alec_u', 'alec_d']) { const m = ATLAS[key]; if (!m) continue;
    for (const a in m.a) for (const [fx, fy] of m.a[a].f) {
      const d = g.getImageData(fx, fy, m.w, m.h), px = d.data;
      for (let i = 0; i < px.length; i += 4) { const t = px[i + 3] && GAUNT_TONES[px[i] + ',' + px[i + 1] + ',' + px[i + 2]]; if (t) { const c = R[t]; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; } }
      g.putImageData(d, fx, fy);
    } } } catch (e) { GAUNT_FAIL = true; return null; }
  GAUNT_IMG = cv; GAUNT_COL = col; return cv;
}
function heroGodColor() { const g = heroGod(); return g ? GODS[g].color : C.ember; }
function drawHero(anim, time, x, yFeet, face, flash) {
  const { key, flip } = heroView(face);
  const m = ATLAS[key]; if (!m || !IMG.chars) return false;
  const tier = S.p.tier || 1, col = heroGodColor();
  if (tier >= 2) {   // aura en el suelo, que late
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col;
    ctx.globalAlpha = 0.16 + 0.07 * tier + 0.05 * Math.sin(S.t * 5); ctx.beginPath(); ctx.ellipse(x, yFeet - 2, 12 + 4 * tier, 4 + 1.5 * tier, 0, 0, Math.PI * 2); ctx.fill();
    if (tier >= 3) { ctx.globalAlpha = 0.11 + 0.04 * Math.sin(S.t * 7); ctx.beginPath(); ctx.ellipse(x, yFeet - 12, 10 + 2 * tier, 16, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (Math.random() < 0.08 * (tier - 1)) S.fx.push({ k: 'spark', x: x + rnd(-6, 6), y: yFeet - rnd(2, 20), vx: rnd(-8, 8), vy: rnd(-40, -20), t: 0, life: rnd(0.4, 0.8), col });
  }
  const a = m.a[anim] || m.a.move, [src, sx, sy, i] = mixFrame(flash ? IMG.charsF : gauntImg(slotColor('basic')) || IMG.chars, m, a, time);   // guanteletes del color de la cadena
  if (!HERO_TMP) { HERO_TMP = document.createElement('canvas'); HERO_TMP.width = 64; HERO_TMP.height = 64; }
  const t = HERO_TMP.getContext('2d'); t.clearRect(0, 0, 64, 64); t.globalCompositeOperation = 'source-over'; t.drawImage(src, sx, sy, m.w, m.h, 0, 0, m.w, m.h);
  if (tier >= 2 && !flash) { t.globalCompositeOperation = 'source-atop'; t.globalAlpha = 0.08 + 0.07 * (tier - 1); t.fillStyle = col; t.fillRect(0, 0, m.w, m.h); t.globalAlpha = 1; }
  // contorno de 1 píxel para que se lea sobre cualquier suelo: claro al principio, del color de su deidad cuando sube de nivel
  if (!HERO_SIL) { HERO_SIL = document.createElement('canvas'); HERO_SIL.width = 64; HERO_SIL.height = 64; }
  const sl = HERO_SIL.getContext('2d'); sl.clearRect(0, 0, 64, 64); sl.globalCompositeOperation = 'source-over'; sl.drawImage(HERO_TMP, 0, 0); sl.globalCompositeOperation = 'source-in'; sl.fillStyle = tier >= 2 ? col : '#f3e6c8'; sl.fillRect(0, 0, 64, 64);
  const ox = flip ? 0 : Math.round(x - m.ax), oy = Math.round(yFeet - m.gy);
  ctx.save(); ctx.globalAlpha = tier >= 2 ? 0.75 + 0.2 * Math.sin(S.t * 6) : 0.55;
  if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); }
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(HERO_SIL, 0, 0, m.w, m.h, (flip ? -m.ax : ox) + dx, oy + dy, m.w, m.h);
  ctx.restore();
  if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(HERO_TMP, 0, 0, m.w, m.h, -m.ax, Math.round(yFeet - m.gy), m.w, m.h); ctx.restore(); }
  else ctx.drawImage(HERO_TMP, 0, 0, m.w, m.h, Math.round(x - m.ax), Math.round(yFeet - m.gy), m.w, m.h);
  if (tier >= 4) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 + 0.08 * Math.sin(S.t * 9);   // a pleno poder, brilla
    if (flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(HERO_TMP, 0, 0, m.w, m.h, -m.ax, Math.round(yFeet - m.gy), m.w, m.h); } else ctx.drawImage(HERO_TMP, 0, 0, m.w, m.h, Math.round(x - m.ax), Math.round(yFeet - m.gy), m.w, m.h);
    ctx.restore(); }
  return true;
}
// ── La caída de un jefe o de un dios: se tambalea entre estallidos y rayos de luz, y luego se deshace de arriba abajo en ceniza.
//    No hay animación de muerte en el paquete para ellos; esto se hace con su propio dibujo, tira a tira. t = segundos desde que cae ──
const GODFALL_T = 2.9;
function drawGodFall(key, x, yFeet, flip, t, col) {
  const m = ATLAS[key]; if (!m || !IMG.chars) return false;
  const h01 = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
  const T1 = 1.15, k1 = clamp(t / T1, 0, 1), k2 = clamp((t - T1) / (GODFALL_T - T1), 0, 1), f = m.a.idle.f[0];
  x = Math.round(x); yFeet = Math.round(yFeet);
  ctx.save();
  ctx.fillStyle = '#0b080d'; ctx.globalAlpha = 0.4 * clamp(t / 1.6, 0, 1); ctx.beginPath(); ctx.ellipse(x, yFeet - 1, m.bw * (0.3 + 0.2 * k2), 4 + 2 * k2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;   // la mancha que deja
  if (t < GODFALL_T) {
    const shake = t < T1 ? 2.6 - 1.2 * k1 : 1.4 * (1 - k2), ox = Math.round(Math.sin(t * 73) * shake), sink = Math.round(k2 * 9);
    const white = t < T1 + 0.25 && Math.floor(t * 11) % 3 === 0, im = white ? IMG.charsF : IMG.chars;
    ctx.save(); ctx.translate(x, 0); if (flip) ctx.scale(-1, 1);
    for (let ry = 0; ry < m.h; ry += 2) {              // de arriba abajo, cada tira se desplaza, se aclara y desaparece
      const thr = ry / m.h * 0.72 + h01(ry + 3) * 0.28, near = clamp((thr - k2) / 0.14, 0, 1);
      if (k2 > 0 && near <= 0) continue;
      ctx.globalAlpha = k2 > 0 ? near : 1;
      ctx.drawImage(im, f[0], f[1] + ry, m.w, Math.min(2, m.h - ry), -m.ax + ox + Math.round((1 - near) * (h01(ry + 11) - 0.5) * 16), yFeet - m.gy + ry + sink - Math.round((1 - near) * 5), m.w, Math.min(2, m.h - ry));
    }
    ctx.restore();
    const left = x - m.ax, top = yFeet - m.gy;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {                       // rayos de luz que le salen del cuerpo
      const t0 = 0.12 + i * 0.2, u = (t - t0) / 0.9; if (u <= 0 || u >= 1) continue;
      const bx = Math.round(left + m.w * (0.2 + 0.6 * h01(i + 5))), w = 2 + Math.round(3 * h01(i + 8));
      ctx.fillStyle = col; ctx.globalAlpha = 0.5 * Math.sin(u * Math.PI); ctx.fillRect(bx - w, top - 40, w * 2, m.h * 0.75 + 40);
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6 * Math.sin(u * Math.PI); ctx.fillRect(bx - 1, top - 40, 2, m.h * 0.75 + 40);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    for (let i = 0; i < 9; i++) {                       // estallidos repartidos por el cuerpo
      const t0 = 0.08 + i * 0.17, u = (t - t0) / 0.5; if (u <= 0 || u >= 1) continue;
      drawFx('boom', u, left + m.w * (0.15 + 0.7 * h01(i + 21)), top + m.h * (0.2 + 0.6 * h01(i + 33)), i % 3 === 2 ? '#ffffff' : col, 26 + 18 * h01(i + 2));
    }
    if (k2 > 0) for (let i = 0; i < 34; i++) {          // ceniza y brasas que suben
      const p = ((t - T1) * (0.5 + 0.5 * h01(i + 60)) + h01(i + 41)) % 1, px = left + m.w * h01(i + 50) + Math.sin(t * 3 + i) * 3, py = top + m.h * (0.9 - 0.9 * p) - 14 * p;
      ctx.globalAlpha = (1 - p) * Math.min(1, k2 * 3) * (1 - k2 * 0.6); ctx.fillStyle = i % 3 ? '#2a2230' : col; ctx.fillRect(Math.round(px), Math.round(py), i % 4 ? 1 : 2, i % 4 ? 1 : 2);
    }
  }
  ctx.restore();
  return true;
}
// ── Efectos del paquete (assets/fx.png): ocho colores por efecto; se elige el más parecido al color pedido ──
loadImg('fx', 'assets/fx.png');
const FXROW = {};
function fxRow(hex) {
  if (hex in FXROW) return FXROW[hex];
  const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let row;
  if (!(n >= 0) || d < 0.18 * mx) row = mx > 140 ? 6 : 7;
  else { let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; row = h < 18 || h >= 335 ? 5 : h < 44 ? 0 : h < 70 ? 1 : h < 170 ? 2 : h < 258 ? 3 : 4; }
  return FXROW[hex] = row;
}
// Dibuja un fotograma de un efecto centrado en (x, y); k = avance de 0 a 1, size = lado en píxeles del juego, rot = giro
function drawFx(name, k, x, y, col, size, rot) {
  const a = FXA[name]; if (!a || !IMG.fx) return false;
  const fr = Math.min(a.n - 1, Math.max(0, Math.floor(k * a.n))), w = size, h = size * a.h / a.w;
  if (rot != null) { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(rot); ctx.drawImage(IMG.fx, fr * a.w, a.y + fxRow(col) * a.h, a.w, a.h, -w / 2, -h / 2, w, h); ctx.restore(); }
  else ctx.drawImage(IMG.fx, fr * a.w, a.y + fxRow(col) * a.h, a.w, a.h, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
  return true;
}
// ───────────────────────── La cadena: el disparo de los guanteletes ─────────────────────────
// Portado de tools/chain.py (la maqueta): eslabones que alternan anilla y barra sobre una sola onda suave que arranca recta en el
// puño, y una punta de arpón al final. Todo con una rampa de 5 tonos (contorno, sombra, base, luz, brillo) y un halo de 1 píxel,
// a píxeles enteros. Solo es el aspecto: el disparo pega en el mismo instante y al mismo blanco que antes.
// Un fx 'chain' tiene tramos (segs): el primero sale del puño; con la Gema de cadena se añade otro desde el primer enemigo. Se estira
// tramo a tramo (CH_EXT cada uno), se queda CH_HOLD y se recoge empezando por el último (CH_RET cada uno). La punta va solo en el
// último tramo que queda.
const CH_EXT = 0.06, CH_HOLD = 0.03, CH_RET = 0.07, CH_SP = 3.4, CH_AMP = 1.6;
const chainLife = n => n * (CH_EXT + CH_RET) + CH_HOLD;
const LINK_FACE = ['.kkk.', 'kl.mk', 'kd.dk', '.kkk.'], LINK_H = ['kkkk', 'llmd', 'kkkk'], LINK_V = ['kkk', 'klk', 'kmk', 'kdk', 'kkk'];
const LINK_D1 = ['..kk', '.klk', 'kmdk', 'kdk.', 'kk..'], LINK_D2 = ['kk..', 'klk.', 'kmdk', '.kdk', '..kk'];
const edgeLink = ang => { const a = ((ang * 180 / Math.PI) % 180 + 180) % 180; return a < 22.5 || a >= 157.5 ? LINK_H : a < 67.5 ? LINK_D2 : a < 112.5 ? LINK_V : LINK_D1; };
// Punta de arpón a cualquier ángulo (rombo alargado, cuello y dos lengüetas hacia atrás; luz desde arriba a la izquierda). En caché por dirección.
const HEAD_CACHE = new Map();
function headPixels(ang, L = 11, half = 3) {
  const key = Math.round(ang / (Math.PI / 32)); if (HEAD_CACHE.has(key)) return HEAD_CACHE.get(key);
  const a0 = key * Math.PI / 32, c = Math.cos(a0), s = Math.sin(a0), lit = s - c, out = [];
  for (let y = -15; y <= 15; y++) for (let x = -15; x <= 15; x++) {
    const u = x * c + y * s, v = -x * s + y * c, av = Math.abs(v); let inside = false;
    if (u >= 0 && u <= L) { const w = u < 4 ? 1 + (half - 1) * u / 4 : half * (L - u) / (L - 4); inside = av <= w + 0.25; }
    if (u >= 0.5 && u <= 4.5 && av >= half - 0.3 && av <= half + (4.5 - u) * 0.55) inside = true;   // lengüetas
    if (u >= -2.5 && u < 0 && av <= 1) inside = true;                                                  // cuello
    if (!inside) continue;
    out.push([x, y, u > L - 2.5 && av < 0.8 ? 's' : av < 0.6 ? 'm' : v * lit > 0 ? 'l' : 'd']);
  }
  HEAD_CACHE.set(key, out); return out;
}
// Los mismos tonos en RGB, para teñir píxeles (los guanteletes de Alec, en 50_sprites.js)
function rampRGB(col) {
  const n = parseInt(String(col).replace('#', '').slice(0, 6), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; let h = 0; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = ((h * 60) % 360 + 360) % 360;
  const S0 = s < 0.12 ? 0.14 : Math.max(0.35, s);
  const rgb = (ss, ll) => { ss = clamp(ss, 0, 1); const c2 = (1 - Math.abs(2 * ll - 1)) * ss, x = c2 * (1 - Math.abs((h / 60) % 2 - 1)), m = ll - c2 / 2;
    const [a, b2, c3] = h < 60 ? [c2, x, 0] : h < 120 ? [x, c2, 0] : h < 180 ? [0, c2, x] : h < 240 ? [0, x, c2] : h < 300 ? [x, 0, c2] : [c2, 0, x]; return [a, b2, c3].map(v => Math.round((v + m) * 255)); };
  return { hi: rgb(S0 * 0.75, 0.82), base: rgb(S0, 0.56), sh: rgb(S0 * 0.9, 0.36), deep: rgb(S0 * 0.8, 0.2) };
}
// Rampa de 5 tonos y halo a partir del color del disparo
const RAMP_CACHE = new Map();
function chainRamp(col) {
  if (RAMP_CACHE.has(col)) return RAMP_CACHE.get(col);
  const n = parseInt(String(col).replace('#', '').slice(0, 6), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const hsl = (hh, ss, ll) => `hsl(${Math.round(hh)},${Math.round(clamp(ss, 0, 1) * 100)}%,${Math.round(clamp(ll, 0, 1) * 100)}%)`;
  const S0 = s < 0.12 ? 0.14 : Math.max(0.35, s);   // un color casi gris da cadena de acero
  const out = { k: hsl(h, S0 * 0.7, 0.09), d: hsl(h, S0 * 0.85, 0.3), m: hsl(h, S0, 0.5), l: hsl(h, S0, 0.7), s: hsl(h, S0 * 0.6, 0.93), g: hsl(h, Math.min(1, S0 * 1.1), 0.62) };
  RAMP_CACHE.set(col, out); return out;
}
// Un tramo: de (x0, y0) hacia ang, ya estirado length de un total full; head: con punta. Apunta sus píxeles en px (clave "x,y" → tono).
function chainSeg(px, x0, y0, ang, length, full, head, flip) {
  if (length < 1) return;
  const c = Math.cos(ang), s = Math.sin(ang), lam = Math.max(40, full);
  const P = t => { const a = CH_AMP * Math.min(1, t / 10) * Math.min(1, Math.max(0, (length - t) / 6 + 0.35)), off = flip * a * Math.sin(2 * Math.PI * t / lam); return [x0 + c * t - s * off, y0 + s * t + c * off]; };
  const put = (x, y, t) => { px.set(x + ',' + y, t); };
  const stamp = (rows, cx, cy) => { const h = rows.length, w = rows[0].length, ox = Math.round(cx - w / 2), oy = Math.round(cy - h / 2); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = rows[y][x]; if (t !== '.') put(ox + x, oy + y, t); } };
  for (let t = 2, k = 0; t < (head ? length - 5 : length - 1); t += CH_SP, k++) {
    const [ax, ay] = P(t - 0.5), [bx, by] = P(t + 0.5), [cx, cy] = P(t);
    stamp(k % 2 === 0 ? LINK_FACE : edgeLink(Math.atan2(by - ay, bx - ax)), cx, cy);
  }
  if (!head) return;
  const [ax, ay] = P(length - 1), [bx, by] = P(length), [hx, hy] = P(length - 6), ox = Math.round(hx), oy = Math.round(hy);
  const hp = headPixels(Math.atan2(by - ay, bx - ax)), mine = new Set(hp.map(([x, y]) => (ox + x) + ',' + (oy + y)));
  for (const [x, y] of hp) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (ox + x + dx) + ',' + (oy + y + dy); if (!mine.has(q)) px.set(q, 'k'); }   // contorno de la punta
  for (const [x, y, t] of hp) put(ox + x, oy + y, t);
}
function drawChainFx(f) {
  if (f.tether) {   // Dedos de grillete: la cadena sigue al puño y al enemigo; se estira, se queda y se recoge al acabar o si cae
    const e = f.tether; if (!active(e) && f.life - f.t > CH_RET) f.life = f.t + CH_RET;
    const h = heroHand(S.p.face, S.p.punch ? S.p.punch.hand : 'R');
    const v = { segs: [{ x1: h.x, y1: h.y, x2: e.x, y2: e.y }], col: f.col, flip: 1, t: f.t < CH_EXT ? f.t : f.life - f.t < CH_RET ? CH_EXT + CH_HOLD + (CH_RET - (f.life - f.t)) : CH_EXT + 0.001 };
    return drawChainFx(v);
  }
  const segs = f.segs, n = segs.length, ramp = chainRamp(f.col || C.energy), t = f.t, ext = n * CH_EXT, px = new Map();
  for (let i = 0; i < n; i++) {
    const sg = segs[i], full = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1); if (full < 2) continue;
    // cuánto está estirado este tramo: se estira en su turno y se recoge en el suyo, del último al primero
    const out = clamp((t - i * CH_EXT) / CH_EXT, 0, 1), back = clamp((t - ext - CH_HOLD - (n - 1 - i) * CH_RET) / CH_RET, 0, 1);
    const len = full * Math.min(out, 1 - back); if (len < 1) continue;
    chainSeg(px, sg.x1, sg.y1, Math.atan2(sg.y2 - sg.y1, sg.x2 - sg.x1), len, full, i === n - 1, f.flip || 1);
  }
  if (!px.size) return;
  ctx.globalAlpha = 110 / 255; ctx.fillStyle = ramp.g;   // halo de 1 píxel alrededor de todo
  const halo = new Set();
  for (const key of px.keys()) { const [x, y] = key.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = (x + dx) + ',' + (y + dy); if (!px.has(q) && !halo.has(q)) { halo.add(q); ctx.fillRect(x + dx, y + dy, 1, 1); } } }
  ctx.globalAlpha = 1;
  for (const [key, tone] of px) { const i = key.indexOf(','); ctx.fillStyle = ramp[tone]; ctx.fillRect(+key.slice(0, i), +key.slice(i + 1), 1, 1); }
}
// ───────────────────────── Dibujo ─────────────────────────
// Una reliquia: un relicario pequeño con una gema del color de su deidad y un destello que late
function drawRelic(x, y, col) {
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col; ctx.globalAlpha = 0.16 + 0.08 * Math.sin(S.t * 6 + x); ctx.fillRect(x - 5, y - 6, 10, 12); ctx.fillRect(x - 7, y - 3, 14, 6); ctx.restore();
  ctx.fillStyle = '#16101a'; ctx.fillRect(x - 3, y - 5, 6, 10); ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillRect(x - 1, y - 7, 2, 2);
  ctx.fillStyle = PAL.g; ctx.fillRect(x - 2, y - 4, 4, 8); ctx.fillRect(x - 3, y - 2, 6, 4);
  ctx.fillStyle = col; ctx.fillRect(x - 1, y - 3, 2, 6); ctx.fillRect(x - 2, y - 1, 4, 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 2, 1, 1);
}
function resize() {
  const w = cv.clientWidth || 1, h = cv.clientHeight || 1, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === view.cssW && h === view.cssH && dpr === view.dpr) return;
  view.cssW = w; view.cssH = h; view.dpr = dpr;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  view.s = Math.max(1, Math.round(Math.sqrt(cv.width * cv.height / T.viewArea)));
  lo.width = Math.ceil(cv.width / view.s) + 1; lo.height = Math.ceil(cv.height / view.s) + 1;   // un píxel de margen para el desplazamiento fino
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
  const ox = Math.round(cam.fx * k), oy = Math.round(cam.fy * k);
  scr.drawImage(lo, -ox, -oy, lo.width * k, lo.height * k);
  if (cam.pl) { const p = S.p; scr.drawImage(plCv, Math.round((p.x - PL / 2 - cam.x - cam.shx) * k) - ox, Math.round((p.y - PL / 2 - cam.y - cam.shy) * k) - oy, PL * k, PL * k); }
  scr.textAlign = 'center';
  for (const [txt, x, y, size, col, alpha] of WTEXT) {
    scr.font = `600 ${Math.round(size * k)}px ${FONT}`; scr.globalAlpha = alpha;
    scr.lineWidth = Math.max(2, k); scr.strokeStyle = '#0b080d'; scr.strokeText(txt, (x - cam.x) * k - ox, (y - cam.y) * k - oy);
    scr.fillStyle = col; scr.fillText(txt, (x - cam.x) * k - ox, (y - cam.y) * k - oy);
  }
  scr.globalAlpha = 1;
  if (S.dialog) drawDialog(k);   // bocadillos de conversación, a resolución de pantalla para que el texto se lea nítido
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
    if (!strip(S.world === 4 ? VFX.voidTorch : VFX.torch, S.t * 10 + t.x, t.x, t.y - 2)) {
    ctx.fillStyle = '#e8642c'; ctx.fillRect(t.x - 2, t.y - 3, 4, 4); ctx.fillRect(t.x - 1 + (f === 1 ? 1 : f === 2 ? -1 : 0), t.y - 5, 2, 2);
    ctx.fillStyle = '#ffb347'; ctx.fillRect(t.x - 1, t.y - 2, 2, 3); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(t.x - 1 + (f === 2 ? 1 : 0), t.y - 1, 1, 2);
    }
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ff9a3c';
    ctx.globalAlpha = 0.05 + 0.012 * f; ctx.beginPath(); ctx.arc(t.x, t.y + 6, 44, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.07; ctx.beginPath(); ctx.arc(t.x, t.y + 4, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!S.out) ctx.drawImage(vignette(lo.width, lo.height), 0, 0);   // al aire libre no hay penumbra de mazmorra
}
function renderWorld() {
  const p = S.p, R = T.room;
  // La cámara sigue al jugador con decimales. El mundo se pinta en el píxel entero (cam.x, cam.y) y lo que sobra (fx, fy) se
  // aplica al ampliar la imagen a la pantalla: el desplazamiento avanza de píxel de pantalla en píxel de pantalla, sin tirones.
  const cfx = view.w >= R.w + 64 ? (R.w - view.w) / 2 : clamp(p.x - view.w / 2, -32, R.w - view.w + 32), top = S.calm && S.calm.spots.some(s => s.kind === 'door') ? 100 : 32, cfy = view.h >= R.h + 64 ? (R.h - view.h) / 2 : clamp(p.y - view.h / 2, -top, R.h - view.h + 32);   // con puertas en el muro del fondo, la cámara sube hasta verlas enteras
  cam.x = Math.floor(cfx); cam.y = Math.floor(cfy); cam.fx = cfx - cam.x; cam.fy = cfy - cam.y; cam.pl = false;
  const shx = Math.round((Math.random() - 0.5) * S.shake), shy = Math.round((Math.random() - 0.5) * S.shake); cam.shx = shx; cam.shy = shy;

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0b080d'; ctx.fillRect(0, 0, lo.width, lo.height);
  ctx.setTransform(1, 0, 0, 1, -(cam.x + shx), -(cam.y + shy));
  ctx.drawImage(roomBg().c, -BG_M * CELL, -BG_M * CELL);

  if (S.mode === 'title') { lights(); return; }

  // Trampas de pinchos
  for (const tr of S.traps) {
    if (IMG.pc_dungeon) {   // pinchos de Pixel Crawler: agujeros, puntas que asoman y pinchos fuera
      const im = IMG.pc_dungeon, warn = tr.state === 1 && Math.floor(S.t * 10) % 2 === 0;
      for (let y = tr.y; y < tr.y + tr.h; y += 16) for (let x = tr.x; x < tr.x + tr.w; x += 16) {
        ctx.drawImage(im, 64, 160, 16, 16, x, y, 16, 16);
        if (tr.state === 2) ctx.drawImage(im, 64, 112, 16, 32, x, y - 16, 16, 32);
        else if (warn) ctx.drawImage(im, 64, 144, 16, 16, x, y, 16, 16);
      }
      if (tr.state === 1) { ctx.strokeStyle = C.blood; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.strokeRect(tr.x + 0.5, tr.y + 0.5, tr.w - 1, tr.h - 1); ctx.globalAlpha = 1; }
      continue;
    }
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
  ctx.strokeStyle = C.energy; ctx.globalAlpha = S.noTarget > 0 ? 0.5 : 0; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;   // el alcance solo se enseña cuando disparas sin nadie a tiro

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

  // Zonas en el suelo: un charco tenue del color de la deidad y, dentro, lo que la zona es de verdad
  // (llamas, burbujas de veneno, zarzas, zetas de sueño, escarcha…), para distinguirlas de un vistazo
  {
    const kind = col => (col === GODS.dragon.color || col === GODS.forge.color ? ['flame', 10, 14] : col === GODS.venom.color ? ['poison', 20, 12] : col === GODS.wood.color ? ['thorns', 30, 9]
      : col === GODS.dream.color ? ['sleep', 13, 9] : ['spark', 18, 12]);
    const h01 = n => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
    for (const z of S.zones) {
      const a = Math.min(1, z.life), [name, size, fps] = kind(z.col), F = FXA[name], lp = i => ((S.t * fps + i * 3.7 + z.x * 0.13) / F.n) % 1, pts = [];
      if (z.r) {
        ctx.fillStyle = z.col; ctx.globalAlpha = 0.14 * a + 0.03 * Math.sin(S.t * 9); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = z.col; ctx.globalAlpha = 0.55 * a; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.lineDashOffset = -S.t * 6; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
        const n = name === 'thorns' ? Math.max(2, Math.round(z.r / 14)) : clamp(Math.round(z.r / 9), 2, 7);
        for (let i = 0; i < n; i++) { const ang = i * 2.399 + z.x, rr = z.r * 0.7 * Math.sqrt((i + 0.5) / n); pts.push([z.x + Math.cos(ang) * rr, z.y + Math.sin(ang) * rr * 0.8]); }
      } else {
        const dx = z.x2 - z.x1, dy = z.y2 - z.y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        ctx.strokeStyle = z.col; ctx.lineCap = 'round'; ctx.globalAlpha = 0.16 * a; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke(); ctx.lineCap = 'butt';
        const n = Math.max(2, Math.round(len / (name === 'thorns' ? 22 : 13)));
        for (let i = 0; i < n; i++) { const q = (i + 0.5) / n, off = (h01(i + z.x1) - 0.5) * 12; pts.push([z.x1 + dx * q + nx * off, z.y1 + dy * q + ny * off]); }
      }
      ctx.globalAlpha = a;
      pts.forEach(([x, y], i) => drawFx(name, lp(i), x, y - (name === 'flame' ? size * 0.5 : name === 'thorns' ? 6 : 0), z.col, size + (name === 'flame' ? 4 * h01(i + 7) : 0)));
      ctx.globalAlpha = 1;
    }
  }
  // Cristales, Bocados y arma caída
  for (const c of S.crystals) {      // cristal clavado en el suelo: una gema de píxeles con su brillo
    const a = Math.min(1, c.life), x = Math.round(c.x), y = Math.round(c.y), col = GODS.stone.color;
    if (IMG.vfx) { ctx.globalAlpha = 0.22 * a; ctx.fillStyle = col; ctx.fillRect(x - 7, y + 3, 14, 4); ctx.globalAlpha = a; strip(VFX.sapphire, S.t * 9 + x, x, y - 6); ctx.globalAlpha = 1; continue; }
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
  if (S.drop) {                      // la reliquia que suelta el elegido, flotando y brillando en el color de su deidad
    const d = S.drop, x = Math.round(d.x), y = Math.round(d.y + Math.sin(S.t * 4) * 1.5), col = GODS[d.god].color;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col; ctx.globalAlpha = 0.12 + 0.05 * Math.sin(S.t * 6); ctx.beginPath(); ctx.arc(x, y - 4, 16, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    drawRelic(x, y - 6, col);
  }

  // Columnas y rifles gemelos
  for (const w of S.wells) {        // pozos: un remolino oscuro que gira hacia dentro
    ctx.fillStyle = '#0b080d'; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(w.x, w.y, w.r * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GODS.void.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.45; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);   // hasta dónde tira
    ctx.globalAlpha = 1; drawFx('well', ((S.t * 12 + w.x) / FXA.well.n) % 1, w.x, w.y, GODS.void.color, Math.max(26, w.r * 1.5));   // partículas cayendo hacia dentro
  }
  for (const mn of S.mines) {       // minas: un bulto de hierro con una luz que parpadea
    const x = Math.round(mn.x), y = Math.round(mn.y);
    ctx.fillStyle = '#16101a'; ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillRect(x - 3, y - 4, 6, 8); ctx.fillStyle = PAL.I; ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillStyle = PAL.i; ctx.fillRect(x - 3, y - 3, 6, 1);
    ctx.fillStyle = Math.floor(S.t * 4 + x) % 2 ? C.blood : '#5a1f24'; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  for (const tu of S.turrets) {
    ctx.strokeStyle = slotColor('basic'); ctx.globalAlpha = Math.min(1, tu.life); ctx.lineWidth = 1.5;
    if (!drawChar('turret', 'move', S.t + tu.x * 0.01, tu.x, tu.y + 9, false, false)) ctx.strokeRect(tu.x - 4, tu.y - 4, 8, 8);
    ctx.beginPath(); ctx.arc(tu.x, tu.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tu.life / 3); ctx.stroke(); ctx.globalAlpha = 1;
  }

  if (S.keep) {                      // la campana de la aldea
    // los aldeanos se refugian junto a la campana; cuantos menos golpes le quedan, menos aguantan en pie
    { const kp = S.keep, n = Math.max(1, Math.ceil(4 * kp.hp / kp.maxHp)); for (let i = 0; i < n; i++) { const an = i * Math.PI / 2 + 0.7, vx = kp.x + Math.cos(an) * 26, vy = kp.y + Math.sin(an) * 15 + 12; ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(vx, vy, 6, 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; drawChar('villager', 'idle', S.t + i * 0.37, vx, vy, vx > kp.x, false); } }
    const k = S.keep; ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(k.x, k.y + 14, 15, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawSprite(SPR.keep, k.x, k.y + 16, false, k.flash > 0);
    ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.25; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(k.x, k.y, 26, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  for (const m of S.mirrors) { const fl = S.target ? S.target.x < m.x : false; ctx.globalAlpha = 0.55 + 0.1 * Math.sin(S.t * 7); if (!drawChar(heroKey(), 'idle', S.t, m.x, m.y + 9, fl, true)) drawSprite(SPR.player, m.x, m.y + 8, fl, true); ctx.globalAlpha = 0.6; if (!drawChar(heroKey(), 'idle', S.t, m.x, m.y + 9, fl, false)) drawSprite(SPR.player, m.x, m.y + 8, fl, false); ctx.globalAlpha = 1; }
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
      const ck = charKey(e), acting = e.wind > 0 || e.cast > 0 || e.lungeWind > 0 || e.lungeT > 0 || e.leapT > 0 || e.aimT > 0 || (e.boss && ['slam', 'chargeWind', 'charge', 'cast', 'leap'].includes(e.act));
      const still = e.stun > 0 || e.sleep > 0 || e.frozen > 0 || e.root > 0 || (e.boss && (e.act === 'rest' || e.act === 'dazed'));
      const sc = e.type.scale || 1, fy = e.y + e.r + (e.boss ? 4 : 2) - air - (e.type.fly ? 6 + Math.sin(S.t * 8 + e.x) * 2 : 0);   // scale: jefes dibujados al doble (escala entera, sin emborronar)
      if (sc !== 1 && ATLAS[ck]) { ctx.save(); ctx.translate(Math.round(e.x), Math.round(fy)); ctx.scale(sc, sc); drawChar(ck, acting ? 'atk' : still ? 'idle' : 'move', e.frozen > 0 ? 0 : S.t + e.x * 0.013, 0, 0, Math.cos(e.dir) < 0, e.flash > 0); ctx.restore(); }
      else if (ATLAS[ck] && drawChar(ck, acting ? 'atk' : still ? 'idle' : 'move', e.frozen > 0 ? 0 : S.t + e.x * 0.013, e.x, fy, Math.cos(e.dir) < 0, e.flash > 0)) { /* dibujado con el paquete */ }
      else if (sp) drawSprite(sp, e.x, e.y + e.r + (e.boss ? 3 : 1) - air - (step && !sp.b ? 1 : 0), Math.cos(e.dir) < 0, e.flash > 0, step);
      else { shapePath(e.type.shape, e.x, e.y, e.r, e.dir); ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color; ctx.fill(); }
    }
    if (e.champ) { // la reliquia de su dios flota sobre su cabeza, en el color de la deidad
      drawRelic(e.x, e.y - e.r - 14 + Math.sin(S.t * 3 + e.x) * 1.5, e.color);
    }
    // ── Estados: cada uno con su propio dibujo, para ver de un vistazo qué tiene cada enemigo ──
    //   a los pies (zarzas, charco) · sobre el cuerpo (llama, burbujas, chispazos, destellos, hielo, sangre) ·
    //   sobre la cabeza, en fila (calavera de la Sentencia, zetas, reloj, estrellas, diana, cruz) · y debajo, los contadores de lo que se acumula
    {
      const ex = Math.round(e.x), ey = Math.round(e.y), R = e.r, ph = e.x * 0.37 + e.y * 0.11, lp = (name, fps) => ((S.t * fps + ph) / FXA[name].n) % 1;
      if (e.root > 0) drawFx('thorns', lp('thorns', 9), ex, ey + R - 6, GODS.wood.color, R * 3 + 14);                       // Raíces
      if (e.wet > 0) {                                                                                                       // Empapado: charco y goterones
        ctx.strokeStyle = GODS.tide.color; ctx.globalAlpha = 0.7; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(ex, ey + R + 1, R + 3 + Math.sin(S.t * 4 + ph), 3, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = GODS.tide.color; for (let i = 0; i < 4; i++) { const u = (S.t * 1.6 + i * 0.27 + ph) % 1; ctx.fillRect(Math.round(ex - R + (i * 0.31 % 1) * R * 2 + i * 2 - 2), Math.round(ey - R + u * (R * 2)), 1, 3); }
        ctx.fillStyle = '#eaf8ff'; for (let i = 0; i < 4; i++) { const u = (S.t * 1.6 + i * 0.27 + ph) % 1; ctx.fillRect(Math.round(ex - R + (i * 0.31 % 1) * R * 2 + i * 2 - 2), Math.round(ey - R + u * (R * 2)), 1, 1); }
      }
      if (e.ember > 0) { const fw = 9 + Math.min(9, e.ember * 1.2); drawFx('flame', lp('flame', 14), ex, ey - R * 0.2 - fw * 0.35, GODS.dragon.color, fw); }                 // Ascuas: arde más cuantas más lleva
      if (e.venom > 0) drawFx('poison', lp('poison', 12), ex, ey - R * 0.5, GODS.venom.color, R * 2.4 + 12);                 // Veneno
      if (e.needles > 0) drawFx('aura', lp('aura', 14), ex, ey - R * 0.3, GODS.storm.color, R * 2.6 + 12);                   // Agujas
      if (e.lit > 0) drawFx('spark', lp('spark', 12), ex, ey - R * 0.7, GODS.light.color, R * 2.4 + 12);                     // Iluminado
      if (e.bleed > 0) { ctx.fillStyle = GODS.blood.color; const n = Math.min(5, e.bleed + 1); for (let i = 0; i < n; i++) { const u = (S.t * 1.3 + i * 0.21 + ph) % 1; ctx.fillRect(Math.round(ex - R * 0.7 + i * (R * 1.4 / n)), Math.round(ey - R * 0.2 + u * (R * 1.4)), 2, 3); } }   // Herida
      if (e.frozen > 0) drawFx('ice', lp('ice', 5), ex, ey - R * 0.35, GODS.frost.color, R * 3.6 + 10);                      // Helado
      // Sobre la cabeza
      const head = [];
      if (e.doom) head.push('doom');
      if (e.sleep > 0 || e.doze > 0) head.push('sleep');
      if (e.slowT > 0) head.push('clock');
      if (e.stun > 0) head.push('stun');
      if (e.traced > 0) head.push('traced');
      if (e.mark > 0) head.push('mark');
      const hy = Math.round(ey - R * 1.7 - (e.hp < e.maxHp ? 13 : 9));
      head.forEach((k, i) => {
        const hx = Math.round(ex + (i - (head.length - 1) / 2) * 14);
        if (k === 'doom') {                                                                                                  // Sentencia: la calavera y, debajo, lo que le queda
          drawFx('skull', lp('skull', 10), hx, hy - 4, GODS.end.color, 13);
          const q = clamp(e.doom.t / 5, 0, 1); ctx.fillStyle = '#16101a'; ctx.fillRect(hx - 6, hy + 6, 12, 3); ctx.fillStyle = GODS.end.color; ctx.fillRect(hx - 5, hy + 7, Math.round(10 * q), 1);
        } else if (k === 'sleep') drawFx('sleep', lp('sleep', 9), hx, hy - 2, GODS.dream.color, 14);                         // Dormido
        else if (k === 'clock') drawFx('clock', lp('clock', 10), hx, hy - 1, GODS.time.color, 15);                           // Ralentizado
        else if (k === 'stun') { for (let n = 0; n < 3; n++) { const a = S.t * 7 + n * 2.094, sx = Math.round(hx + Math.cos(a) * 6), sy = Math.round(hy + Math.sin(a) * 2.5); ctx.fillStyle = '#16101a'; ctx.fillRect(sx - 2, sy - 1, 5, 3); ctx.fillRect(sx - 1, sy - 2, 3, 5); ctx.fillStyle = '#ffe58a'; ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); } }   // Aturdido: estrellas dando vueltas
        else if (k === 'traced') { ctx.strokeStyle = '#16101a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = C.energy; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = C.energy; ctx.fillRect(hx - 1, hy - 1, 2, 2); ctx.fillRect(hx - 7, hy, 3, 1); ctx.fillRect(hx + 5, hy, 3, 1); ctx.fillRect(hx, hy - 7, 1, 3); ctx.fillRect(hx, hy + 5, 1, 3); }   // Marcado: una diana
        else { ctx.fillStyle = '#16101a'; ctx.fillRect(hx - 2, hy - 6, 5, 12); ctx.fillRect(hx - 5, hy - 3, 11, 5); ctx.fillStyle = GODS.shade.color; ctx.fillRect(hx - 1, hy - 5, 3, 10); ctx.fillRect(hx - 4, hy - 2, 9, 3); }   // Marca de tumba: una cruz
      });
      // Debajo: lo que se acumula, con su color y su número
      const cnt = [];
      if (e.ember > 0) cnt.push([GODS.dragon.color, e.ember]);
      if (e.venom > 0) cnt.push([GODS.venom.color, e.venom]);
      if (e.needles > 0) cnt.push([GODS.storm.color, e.needles]);
      if (e.frost > 0 && !(e.frozen > 0)) cnt.push([GODS.frost.color, e.frost]);
      if (e.bleed > 0) cnt.push([GODS.blood.color, e.bleed]);
      if (e.seed > 0) cnt.push([GODS.wood.color, e.seed]);
      if (e.nails > 0) cnt.push([PAL.i, e.nails]);
      cnt.forEach(([col, n], i) => {
        const cx = Math.round(ex + (i - (cnt.length - 1) / 2) * 13) - 4, cy = Math.round(ey + R + 6);
        ctx.fillStyle = '#16101a'; ctx.fillRect(cx - 1, cy - 1, 5, 5); ctx.fillStyle = col; ctx.fillRect(cx, cy, 3, 3);
        wtext(String(Math.round(n)), cx + 8, cy + 4.5, 7, col);
      });
    }
    if (e.hp < e.maxHp) {
      const w = e.r * 2 + 4; ctx.fillStyle = C.wall; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w, 2.5);
      ctx.fillStyle = C.ink; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w * clamp(e.hp / e.maxHp, 0, 1), 2.5);
    }
  }

  // La manada, por delante de los enemigos para que no la tapen: el cachorro es pequeño y claro; el sabueso, el de siempre; el lobo alfa, grande, gris y con un halo a los pies.
  if (S.pets.length) {
    if (!SPR.pup) { SPR.pup = mkArt(ART.hound, { c: '#d79a58', C: '#a56a30' }); SPR.wolf = mkArt(ART.hound, { c: '#9aa3b2', C: '#566072', e: '#ff7a3c' }); }
    S.pets.forEach((pt, i) => {
      const st = pt.st || 0, sc = [0.8, 1.1, 1.7][st], sp = [SPR.pup, SPR.hound, SPR.wolf][st], im = pt.run !== false && Math.floor(S.t * 10 + i * 0.5) % 2 === 1 ? sp.b.c : sp.c;
      ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 4, 7 * sc, 2.5 * sc, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      if (st === 2) { ctx.strokeStyle = GODS.beast.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.55 + 0.25 * Math.sin(S.t * 6); ctx.beginPath(); ctx.ellipse(pt.x, pt.y + 4, 14, 5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(Math.round(pt.x), Math.round(pt.y + 5)); ctx.scale(pt.dir < 0 ? -sc : sc, sc); ctx.drawImage(im, -sp.w / 2, -sp.h); ctx.restore();
    });
    // Bajo el primero de la manada, lo que lleva de Caza hacia el siguiente cambio (crecer o sumar un perro)
    { const c = caza(), marks = [0].concat(PACK.grow, PACK.join), k = marks.findIndex(x => c < x), pt = S.pets[0];
      if (k > 0) { const f = (c - marks[k - 1]) / (marks[k] - marks[k - 1]); ctx.globalAlpha = 0.55; ctx.fillStyle = '#000000'; ctx.fillRect(Math.round(pt.x) - 8, Math.round(pt.y) + 8, 16, 2); ctx.globalAlpha = 1; ctx.fillStyle = GODS.beast.color; ctx.fillRect(Math.round(pt.x) - 8, Math.round(pt.y) + 8, Math.round(16 * f), 2); } }
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
    if (sh.vx != null && drawFx('bolt', (S.t * 14 + x * 0.1) % 1, sh.x - sh.vx * 0.012, sh.y - sh.vy * 0.012, C.arcane, Math.max(11, r * 3.4), Math.atan2(sh.vy, sh.vx))) continue;
    ctx.fillStyle = C.arcane; ctx.globalAlpha = 0.28; ctx.fillRect(x - r - 2, y - r, r * 2 + 4, r * 2); ctx.fillRect(x - r, y - r - 2, r * 2, r * 2 + 4);
    ctx.globalAlpha = 1; ctx.fillStyle = '#16101a'; ctx.fillRect(x - r, y - r + 1, r * 2, r * 2 - 2); ctx.fillRect(x - r + 1, y - r, r * 2 - 2, r * 2);
    ctx.fillStyle = C.arcane; ctx.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
    ctx.fillStyle = '#f0e4ff'; ctx.fillRect(x - 1 + tw, y - 1, 2 - tw, 2 - tw);
  }

  // Efectos bajo el jugador
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'godfall') { drawGodFall(f.key, f.x, f.y, f.flip, f.t, f.col); continue; }
    if (f.k === 'corpse') {   // animación de muerte: corre una vez, se queda en el último fotograma y se desvanece
      const m = ATLAS[f.key], a = m.a.die, i = Math.min(a.f.length - 1, Math.floor(f.t * a.fps)), fr = a.f[i];
      ctx.globalAlpha = Math.min(1, (f.life - f.t) / 0.5);
      if (f.flip) { ctx.save(); ctx.translate(Math.round(f.x), 0); ctx.scale(-1, 1); ctx.drawImage(IMG.chars, fr[0], fr[1], m.w, m.h, -m.ax, Math.round(f.y - m.gy), m.w, m.h); ctx.restore(); }
      else ctx.drawImage(IMG.chars, fr[0], fr[1], m.w, m.h, Math.round(f.x - m.ax), Math.round(f.y - m.gy), m.w, m.h);
      ctx.globalAlpha = 1; continue;
    }
    if (f.k === 'ghost') { ctx.globalAlpha = 0.75 * k; if (!drawChar('decoy', 'idle', S.t, f.x, f.y + p.r + 2, false, false)) { ctx.fillStyle = C.ember; ctx.globalAlpha = 0.35 * k; ctx.beginPath(); ctx.arc(f.x, f.y, p.r, 0, Math.PI * 2); ctx.fill(); } }
    else if (f.k === 'clock') { ctx.strokeStyle = GODS.time.color; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); }
    else if (f.k === 'cone') {   // abanico: un velo tenue y, dentro, llamas (o destellos) que avanzan desde Alec hacia fuera
      const R = f.r * (1 - 0.3 * k), fire = f.col === GODS.dragon.color || f.col === GODS.forge.color;
      ctx.fillStyle = f.col; ctx.globalAlpha = 0.22 * k; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, R, f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = Math.min(1, k * 1.6);
      for (let i = 0; i < 7; i++) { const q = 0.3 + 0.7 * ((i * 0.37 + (1 - k) * 0.6) % 1), an = f.a + f.half * 0.85 * (((i * 0.618) % 1) * 2 - 1), x = f.x + Math.cos(an) * R * q, y = f.y + Math.sin(an) * R * q;
        if (fire) drawFx('flame', ((S.t * 16 + i * 3) / FXA.flame.n) % 1, x, y - 4, f.col, 8 + 8 * q); else drawFx('cast', (1 - k + i * 0.13) % 1, x, y, f.col, 12 + 8 * q); }
    }
    ctx.globalAlpha = 1;
  }

  if (S.town) drawTown();
  if (S.chests.length) drawChests(); if (S.coins.length) drawCoins(); if (S.calm) drawCalm();   // 44_calm.js
  // Jugador: en su propia capa, centrado en ella; render() la coloca luego en su sitio exacto de la pantalla
  ctx = plCtx; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, PL, PL);
  ctx.setTransform(1, 0, 0, 1, PL / 2 - Math.round(p.x), PL / 2 - Math.round(p.y)); cam.pl = true;
  const flying = p.dodgeT > 0 && p.fly, pr = flying ? p.r * 1.35 : p.r, py = flying ? p.y - 5 : p.y;
  if (flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x, p.y + 4, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  const blink = p.inv > 0 && p.dodgeT <= 0 && Math.floor(S.t * 30) % 2 === 0;
  if (!blink) {
    const fx = Math.cos(p.face), fy = Math.sin(p.face), glow = p.windup > 0 || p.charging || (p.drawing && p.draw >= 1);
    if (!flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r, p.r * 0.95, p.r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    const behind = Math.sin(p.face) < -0.7;
    // Puñetazos alternos (atkR / atkL, 4 fotogramas cada uno): el 0 mientras carga, el 1 justo al soltar (sale el disparo) y el 2 y 3 al
    // recoger. Medio puñetazo cabe siempre en el periodo de disparo: si se dispara más rápido, va más deprisa («pum, pum, pum»).
    const per = periodOf(), pfps = Math.max(14, 3 / Math.max(0.04, per * 0.7)), next = (p.shotN + 1) % 2 === 0 ? 'R' : 'L';
    let castAnim = null, castT = S.t;
    if (p.dodgeT <= 0 && glow) { castAnim = 'atk' + next; castT = 0.02 / 18; }
    else if (p.dodgeT <= 0 && p.punch && p.punch.t < 3 / pfps) { castAnim = 'atk' + p.punch.hand; castT = Math.min(3, 1 + p.punch.t * pfps) / 18; }
    const casting = !!castAnim;
    const packHero = drawHero(p.dodgeT > 0 ? 'dash' : casting ? castAnim : Math.hypot(I.mx, I.my) > 0.2 ? 'move' : 'idle', castT, p.x, py + p.r + 2, p.face, false);
    if (!packHero) drawSprite(SPR.player, p.x, py + p.r + 1, fx < 0, false, Math.hypot(I.mx, I.my) > 0.2 && Math.floor(S.t * 9) % 2 === 1);
    const kick = p.cd > 0 && p.windup <= 0 ? Math.round(3 * clamp((p.cd - periodOf() + 0.09) / 0.09, 0, 1)) : 0;   // culatazo del retroceso
    if (!packHero) drawGun(p.x, py + 1, p.face, kick);
  }
  // Anillo de ritmo: se llena mientras recarga; brilla cuando puedes disparar
  const period = periodOf(), a0 = -Math.PI / 2;
  // Barrita bajo los pies en vez de anillos: fila 0 el ritmo de disparo, fila 1 calor, reserva y espera del cargado
  const pbar = (f, row, col) => { const w = 14, x = Math.round(p.x - w / 2), y = Math.round(p.y + p.r + 5 + row * 3); ctx.save(); ctx.globalAlpha = Math.min(1, ctx.globalAlpha + 0.2); ctx.fillStyle = '#0b080d'; ctx.fillRect(x - 1, y - 1, w + 2, 4); ctx.fillStyle = col || ctx.strokeStyle; ctx.fillRect(x, y, Math.round(w * clamp(f, 0, 1)), 2); ctx.restore(); };
  if (p.fury > 0) pbar(p.fury / 100, 3, GODS.orc.color);
  if (p.heat > 0.02) { ctx.strokeStyle = p.over > 0 ? '#ffffff' : C.blood; ctx.lineWidth = 2.4; pbar(p.heat, 1); }
  else if (p.drawing && S.gun.action === 'a_hold') { const n = 1 + Math.floor(p.draw * 2 + 0.001); for (let i = 0; i < 3; i++) { ctx.fillStyle = i < n ? C.ember : C.edge; ctx.fillRect(Math.round(p.x) - 6 + i * 5, Math.round(p.y - p.r - 13), 3, 5); } }
  else if (p.drawing) { ctx.strokeStyle = p.draw >= 1 ? '#ffffff' : C.ember; ctx.lineWidth = p.draw >= 1 ? 2.6 : 2; pbar(p.draw, 0); }
  else if (p.windup > 0) { ctx.strokeStyle = C.ember; ctx.lineWidth = 2; pbar((1 - p.windup / p.windupTotal), 0); }
  else if (p.cd > 0) { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4; pbar(clamp(1 - p.cd / period, 0, 1), 0); ctx.globalAlpha = 1; }
  else pbar(1, 0, C.energy);
  if (S.gun.barrel === 'b_flail' && p.orbAway <= 0) {   // la bola del mangual y su cadena
    const bx = Math.round(p.x + Math.cos(p.orbA) * 34), by = Math.round(p.y + Math.sin(p.orbA) * 34);
    ctx.fillStyle = PAL.I; for (let i = 1; i < 5; i++) ctx.fillRect(Math.round(p.x + (bx - p.x) * i / 5), Math.round(p.y + (by - p.y) * i / 5), 1, 1);
    ctx.fillStyle = '#16101a'; ctx.fillRect(bx - 4, by - 3, 8, 6); ctx.fillRect(bx - 3, by - 4, 6, 8); ctx.fillStyle = PAL.I; ctx.fillRect(bx - 3, by - 3, 6, 6); ctx.fillStyle = PAL.w; ctx.fillRect(bx - 2, by - 3, 2, 2);
    ctx.fillStyle = PAL.i; ctx.fillRect(bx - 5, by, 1, 1); ctx.fillRect(bx + 4, by - 1, 1, 1); ctx.fillRect(bx, by - 5, 1, 1); ctx.fillRect(bx - 1, by + 4, 1, 1);
  }
  if (S.gun.stock === 's_shield' && p.wardCd <= 0) { const a = S.t * 2.4, sx = Math.round(p.x + Math.cos(a) * 13), sy = Math.round(p.y - 2 + Math.sin(a) * 7); ctx.fillStyle = '#16101a'; ctx.fillRect(sx - 3, sy - 4, 6, 8); ctx.fillStyle = PAL.i; ctx.fillRect(sx - 2, sy - 3, 4, 6); ctx.fillStyle = PAL.g; ctx.fillRect(sx - 1, sy - 1, 2, 2); }
  if (p.temper > 0) { const n = Math.min(33, p.temper); for (let i = 0; i < n; i++) { ctx.fillStyle = p.redhot > 0 ? '#ffe08a' : GODS.forge.color; ctx.fillRect(Math.round(p.x) - n + i * 2, Math.round(p.y + p.r + 18), 1, 2); } }
  if (S.gun.mag === 'm_last') for (let i = 0; i < 6; i++) { ctx.fillStyle = i < 6 - (p.clip || 0) ? (i === 0 ? C.ember : C.ink) : C.edge; ctx.fillRect(Math.round(p.x) - 9 + (5 - i) * 3, Math.round(p.y - p.r - 12), 2, 4); }
  if (S.gun.action === 'a_over') { ctx.fillStyle = p.overT >= 10 ? C.ember : C.edge; ctx.fillRect(Math.round(p.x) - 5, Math.round(p.y + p.r + 14), Math.round(10 * p.overT / 10), 2); }
  if (S.gun.action === 'a_pend' && p.pend > 0) for (let i = 0; i < p.pend; i++) { ctx.fillStyle = C.ember; ctx.fillRect(Math.round(p.x) - p.pend * 2 + i * 4, Math.round(p.y + p.r + 14), 2, 2); }
  if (S.gun.mag === 'm_drum') for (let i = 0; i < 2; i++) { ctx.fillStyle = i < p.shells && !(p.cd > 0.3 && p.shells === 2) ? C.ember : C.edge; ctx.fillRect(p.x - 5 + i * 6, p.y - p.r - 12, 4, 5); }
  const dm = dodgeMax();
  if (dm > 1) for (let i = 0; i < dm; i++) { ctx.fillStyle = i < p.dodgeN ? C.ink : C.edge; ctx.fillRect(p.x - dm * 2.5 + i * 5, p.y + p.r + 10, 3, 3); }
  if (p.reserve > 0.5) { ctx.strokeStyle = GODS.feast.color; ctx.lineWidth = 1.6; pbar(Math.min(1, p.reserve / resMax()), 2); }
  if (p.chargeCd > 0) { ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; pbar((1 - p.chargeCd / p.chargeCdMax), 1); ctx.globalAlpha = 1; }

  ctx = loCtx;   // fin de la capa del jugador

  // Efectos sobre todo
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'chain') drawChainFx(f);   // la cadena (50a_chain.js)
    else if (f.k === 'tracer') {   // un dardo de luz que viaja del origen al blanco con una cola corta, y un destello al llegar. No pinta la línea entera
      const u = 1 - k, col = f.col || C.energy, w = Math.min(1.7, f.w || 1), dx = f.x2 - f.x1, dy = f.y2 - f.y1, len = Math.hypot(dx, dy) || 1, T = 0.62, v = Math.min(1, u / T);
      if (v < 1) {
        const a = Math.max(0, v - Math.min(0.5, 30 / len)), at = q => [f.x1 + dx * q, f.y1 + dy * q], h = at(v);
        ctx.lineCap = 'round'; ctx.strokeStyle = col;
        for (let i = 0; i < 3; i++) { const q = at(a + (v - a) * i / 3); ctx.globalAlpha = 0.22 + 0.26 * i; ctx.lineWidth = (0.7 + 0.8 * i) * w; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(h[0], h[1]); ctx.stroke(); }
        { const q = at(a + (v - a) * 0.6); ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8 * w; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(h[0], h[1]); ctx.stroke(); }
        ctx.lineCap = 'butt'; ctx.globalAlpha = 1;
        const hx = Math.round(h[0]), hy = Math.round(h[1]), r = w > 1.3 ? 2 : 1;   // la cabeza: un punto de luz con su halo
        ctx.fillStyle = col; ctx.fillRect(hx - r - 1, hy - r, r * 2 + 2, r * 2); ctx.fillRect(hx - r, hy - r - 1, r * 2, r * 2 + 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
      } else drawFx('hit', (u - T) / (1 - T), f.x2, f.y2, col, 12 + 6 * w);
    }
    else if (f.k === 'ring' && f.boom) {   // explosión: el estallido del paquete a su tamaño real y un aro fino que marca hasta dónde llega
      drawFx(f.r >= 26 ? 'blast' : 'boom', 1 - k, f.x, f.y, f.col, f.r * 2.4);
      ctx.strokeStyle = f.col; ctx.globalAlpha = 0.6 * k; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - 0.35 * k), 0, Math.PI * 2); ctx.stroke();
    }
    else if (f.k === 'ring') { ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 3 * k + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - 0.6 * k), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = f.col; ctx.globalAlpha = 0.18 * k; ctx.fill(); }
    else if (f.k === 'beam') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k * 0.5; ctx.lineWidth = f.w * 3 * k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = k; ctx.lineWidth = f.w * k; ctx.stroke(); }
    else if (f.k === 'lob') { const u = f.t / f.life, x = f.x1 + (f.x2 - f.x1) * u, y = f.y1 + (f.y2 - f.y1) * u - Math.sin(u * Math.PI) * 26; const gx = Math.round(f.x1 + (f.x2 - f.x1) * u), gy = Math.round(f.y1 + (f.y2 - f.y1) * u); ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.fillRect(gx - 3, gy - 1, 6, 2); ctx.globalAlpha = 1; const X = Math.round(x), Y = Math.round(y); ctx.fillStyle = '#16101a'; ctx.fillRect(X - 3, Y - 4, 6, 8); ctx.fillRect(X - 4, Y - 3, 8, 6); ctx.fillStyle = f.col; ctx.fillRect(X - 2, Y - 3, 4, 6); ctx.fillRect(X - 3, Y - 2, 6, 4); ctx.fillStyle = tone(f.col, 1.5); ctx.fillRect(X - 2, Y - 2, 2, 2); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(X - 1, Y - 5 - (Math.floor(S.t * 16) % 2), 1, 2); }   // un orbe redondo con su mecha
    else if (f.k === 'smoke') { const sz = k > 0.6 ? 2 : 3; ctx.fillStyle = k > 0.5 ? '#b9b3ad' : '#7d7780'; ctx.globalAlpha = 0.55 * k; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, sz, sz); }
    else if (f.k === 'flash' && f.col && drawFx('cast', 1 - k, f.x, f.y, f.col, 18)) { }
    else if (f.k === 'flash') { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 1, 4, 2); ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 2, 2, 4); ctx.fillStyle = '#ff8a3c'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y), 1, 1); ctx.fillRect(Math.round(f.x) + 2, Math.round(f.y) - 1, 1, 1); }
    else if (f.k === 'coin') { ctx.globalAlpha = Math.min(1, k * 3); if (!strip(VFX.coin, f.t * 16, f.x, f.y - 22 * (1 - k))) { ctx.fillStyle = RAR[3].color; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y - 22 * (1 - k)) - 2, 4, 4); } }
    else if (f.k === 'slash') { if (IMG.vfx) { ctx.save(); ctx.translate(Math.round(f.x), Math.round(f.y)); ctx.rotate(f.a); ctx.drawImage(IMG.vfx, Math.min(7, Math.floor(f.t / f.life * 8)) * 32, f.row * 32, 32, 32, -16, -16, 32, 32); ctx.restore(); } }
    else if (f.k === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = k; ctx.fillRect(f.x - 1, f.y - 1, 2, 2); }
    else if (f.k === 'num') wtext(f.txt, f.x, f.y, f.big ? 12 : 8, f.col || (f.big ? C.ember : C.ink), Math.min(1, k * 2));
    ctx.globalAlpha = 1;
  }

  lights();
  // Flechas en el borde de la pantalla hacia lo que importa y no se ve: estandartes, la campana, el arma caída
  ctx.setTransform(1, 0, 0, 1, -cam.x, -cam.y);
  if (S.town && !S.dialog) townPointers();
  if (S.calm && !S.dialog) calmPointers();   // y hacia las puertas de la sala (44_calm.js)   // en la ciudad: la forja, la posada, el patio, el tablón y el castillo
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
const BG_M = 7;   // casillas de margen alrededor de la sala (cabe el muro del fondo con sus puertas)
let ROOM_BG = null;
function roomBg() {
  if (S.out && S.out.interior) { const h = S.out.interior === 'throne' ? roomBgHall() : roomBgInterior(); if (h) return h; }
  if (S.out) return roomBgOut();
  { const pc = roomBgDungeon(); if (pc) return pc; }
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
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, d = Math.random() * Math.random() * (e.r + 5), x = Math.round(e.x + Math.cos(a) * d), y = Math.round(e.y + e.r * 0.6 + Math.sin(a) * d * 0.6); if (!isBlockedAt(x, y)) g.fillRect(ox + x, oy + y, Math.random() < 0.3 ? 2 : 1, 1); }
  g.globalAlpha = 0.8;
  if (bone) for (let i = 0; i < 3; i++) { const x = Math.round(e.x + rnd(-6, 6)), y = Math.round(e.y + e.r * 0.6 + rnd(-3, 3)); if (!isBlockedAt(x, y)) { g.fillStyle = '#a39c84'; g.fillRect(ox + x, oy + y, 3, 1); g.fillStyle = '#cfc8ae'; g.fillRect(ox + x, oy + y, 1, 1); } }
  g.globalAlpha = 1;
}
// ───────────────────────── Exteriores: suelos y decorado del paquete de biomas (byandrox, itch.io) ─────────────────────────
// La sala se pinta una vez: hierba, agua con sus orillas, caminos, y encima rocas, árboles y casas ordenados de arriba abajo.
loadImg('biome', 'assets/biomes.png'); loadImg('outdoor', 'assets/outdoor.png'); loadImg('town', 'assets/town.png'); loadImg('ruins', 'assets/ruins.png'); loadImg('houses', 'assets/houses.png'); loadImg('cityhouses', 'assets/cityhouses.png');
const BIO = {
  grass: { tiles: [0, 0], inner: [64, 0], water: [64, 32], base: '#819447' },
  tree: [[243, 32, 26, 32], [246, 65, 20, 31], [272, 65, 16, 31], [292, 67, 24, 29], [243, 100, 24, 26], [276, 102, 22, 24], [245, 8, 21, 21], [272, 37, 16, 22]],
  rock: [[112, 3, 31, 27], [147, 3, 28, 27], [113, 39, 29, 24], [146, 39, 29, 23]],
  bush: [[288, 34, 16, 12], [305, 32, 14, 16], [289, 51, 14, 12], [305, 112, 14, 16]],
  barrel: [[369, 48, 14, 15], [385, 48, 14, 16], [401, 48, 14, 16]],
  sign: [[337, 2, 14, 13], [352, 2, 16, 13], [369, 1, 14, 13]],
  well: [339, 69, 26, 19], vbridge: [340, 18, 24, 44], stairs: [336, 96, 32, 32], wall: [368, 96, 32, 16],
  deco: [[160, 74, 15, 6], [161, 99, 14, 10], [162, 87, 13, 9], [178, 74, 5, 5], [179, 68, 5, 5], [185, 72, 5, 5], [186, 65, 5, 5], [178, 97, 7, 7], [182, 105, 7, 7], [178, 81, 12, 14], [145, 69, 13, 10], [130, 86, 11, 8]],
  lily: [[192, 68, 16, 11], [192, 81, 16, 13]],
  ruin: [[161, 146, 29, 29], [274, 145, 26, 31], [304, 144, 15, 48], [321, 160, 14, 32], [274, 177, 29, 25], [164, 209, 25, 31], [276, 209, 24, 30], [306, 196, 29, 43], [241, 226, 29, 30], [273, 241, 30, 30], [194, 263, 44, 39], [337, 1, 14, 46], [352, 1, 16, 46], [353, 55, 14, 24]], cobble: [7, 71, 34, 31], tall: [7, 118, 33, 40],   // ruin: de Ancient Ruins (Androx), torres caídas, pilares y piedras con runas
};
// Otros biomas del paquete: el suelo es su baldosa central y el agua (o el hielo) se pinta encima con su propia orilla
BIO.snow = { land: [16, 384], water: [0, 304], winner: [64, 304], base: '#e4f0f0' };
BIO.savanna = { land: [16, 512], water: [0, 240], winner: [64, 240], base: '#b3a633' };
// Temas de exterior, uno por zona. Cada dibujo es [x, y, ancho, alto] de biomes.png o una clave de OUTP (outdoor.png).
// trees y rocks: obstáculos de 2×2 · big: de 3×2 · small: de 1×1 · deco: adorno que se pisa · forest y fbush: el borde de la sala
const THEMES = {
  grass: { biome: 'grass', trees: BIO.tree.slice(0, 6), rocks: BIO.rock, big: BIO.ruin.slice(0, 11).map(r => ['r'].concat(r)), small: BIO.bush, deco: BIO.deco, forest: BIO.tree.slice(0, 6), fbush: BIO.bush, pc: true },
  crypt: { biome: 'grass', trees: ['pine_l', 'pine_m', 'u_dtree2', 'pine_m', 'pine_l', 'dead_m'], rocks: BIO.rock.concat(['tomb1', 'tomb2', 'tomb3']), big: ['cross_stat', 'graves_row', 'angel2', 'reaper', 'cross2', 'olive', 'u_ruin2', 'u_ruin3', 'u_pile', 'u_arm1', 'u_ribs2'],
    small: ['grave1', 'grave2', 'grave3', 'grave4', 'cross_big', 'angel1', 'coffin1', 'coffin2', 'u_arm3', 'u_arm4', 'u_skull', 'u_bones1', 'u_beast'], deco: BIO.deco.slice(0, 3).concat([BIO.deco[10], BIO.deco[11]]), forest: ['pine_m', 'pine_s', 'pine_m', BIO.tree[1], 'pine_l', 'dead_s'], fbush: ['darkbush', BIO.bush[0]], dim: 'rgba(30,40,60,0.16)' },
  nest: { biome: 'grass', trees: [BIO.tree[0], 'mush_tall', BIO.tree[4], 'mush_l', BIO.tree[5], 'vine_l'], rocks: ['mossy2', 'boulder2', 'mossy3', 'boulder1'], big: ['mush_xl', 'mush_l', 'bush_g', 'bush_a', 'mossy3'],
    small: ['flower_m', 'flower_m2', 'vine_m', 'mush_m', 'vine_s', 'flower_l'], deco: BIO.deco, forest: BIO.tree.slice(0, 6).concat(['mush_l']), fbush: ['bush_g', BIO.bush[1], BIO.bush[3]], pc: true, dim: 'rgba(20,60,30,0.10)' },
  mines: { biome: 'snow', trees: [[227, 384, 26, 32], [230, 417, 20, 31], [256, 417, 16, 31], [276, 419, 24, 29], [161, 433, 30, 31], [192, 432, 32, 31]], rocks: [[113, 370, 30, 28], [112, 408, 27, 23], [145, 409, 29, 21], 'grey1', 'rune1', [148, 381, 26, 18]],
    big: BIO.ruin.slice(0, 11).map(r => ['r'].concat(r)).concat(['rune1']), small: [[176, 385, 16, 13], [209, 386, 15, 13], [304, 386, 16, 12], [208, 464, 16, 16], 'rune2', 'grey2', [144, 436, 16, 28]], deco: [[307, 435, 10, 9], [177, 417, 14, 13], [210, 418, 14, 12], [305, 403, 14, 12]],
    forest: [[227, 384, 26, 32], [230, 417, 20, 31], [256, 417, 16, 31], [276, 419, 24, 29], [230, 454, 22, 24], [261, 452, 24, 26]], fbush: [[176, 385, 16, 13], [145, 467, 14, 12], [193, 466, 14, 12]] },
  ash: { biome: 'savanna', trees: ['dead_l', 'u_tree1', 'dead_m', [240, 518, 32, 40], 'u_tree2', [274, 513, 45, 46]], rocks: [[116, 522, 44, 21], [160, 511, 31, 17], 'boulder3', 'boulder2'], big: ['tusk_l', 'tusk_m', 'deadtree', [192, 512, 48, 47], 'cross_stat', 'u_thorn2', 'u_ruin4', 'u_pile', 'u_arm1', 'u_ribs'],
    small: ['tusk_s', 'deadbush', [193, 530, 13, 27], 'coffin1', 'u_arm2', 'u_bones2', 'u_skull'], deco: [[129, 499, 15, 12], [113, 500, 14, 11], [145, 545, 15, 14], [260, 496, 25, 14]], forest: ['dead_m', 'u_tree3', 'deadbush', 'dead_l', 'u_dtree3', 'dead_m'], fbush: ['deadbush', [178, 497, 12, 13]], sparse: true, dim: 'rgba(52,34,34,0.34)' },
};
const ZONE_THEME = ['crypt', 'nest', 'mines', 'ash'];
// Una casa de aldea pintada a mano con la paleta del paquete (el paquete no trae edificios)
function drawHouse(g, X, Y, W, H, v) {
  const roofs = [['#9c4a3a', '#7a352c', '#c0644a'], ['#4a6a8a', '#35506c', '#6a8cae'], ['#6b5a3a', '#4f4129', '#8f7a50'], ['#5a7a3c', '#43602c', '#7f9c4c']][v % 4];
  const rh = Math.round(H * 0.56), px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(X + x, Y + y, w, h); };
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + 2, Y + H - 2, W, 4);
  px(2, rh, W - 4, H - rh, '#a67c52');                                                    // pared de tablas
  for (let x = 6; x < W - 4; x += 5) px(x, rh, 1, H - rh, '#8a6240');
  px(2, rh, W - 4, 4, '#5b3a2a'); px(2, H - 3, W - 4, 3, '#4a5768'); px(2, H - 4, W - 4, 1, '#66778f');   // sombra del alero y zócalo de piedra
  for (const x of [2, W - 5]) px(x, rh, 3, H - rh, '#5b3a2a');
  const dx = Math.round(W / 2) - 6, dh = Math.min(18, H - rh - 4);
  px(dx - 1, H - dh - 1, 14, dh + 1, '#3a241c'); px(dx, H - dh, 12, dh, '#6e4530'); px(dx + 5, H - dh, 1, dh, '#4a2e22'); px(dx + 9, H - Math.round(dh / 2), 2, 2, '#f2c14e');   // puerta
  for (const wx of [Math.round(W * 0.2) - 4, Math.round(W * 0.8) - 5]) { px(wx - 1, rh + 6, 11, 10, '#3a241c'); px(wx, rh + 7, 9, 8, '#f2c14e'); px(wx, rh + 7, 9, 2, '#ffe9a8'); px(wx + 4, rh + 7, 1, 8, '#3a241c'); px(wx, rh + 10, 9, 1, '#3a241c'); }
  px(-2, 0, W + 4, rh + 2, '#2a1a18');                                                    // tejado: hileras de tejas
  for (let row = 0; row * 4 < rh; row++) {
    const y = 1 + row * 4, h = Math.min(4, rh - row * 4);
    px(-1, y, W + 2, h, row % 2 ? roofs[0] : roofs[1]);
    for (let x = (row % 2 ? 2 : -1); x < W + 1; x += 6) px(x, y, 1, h, roofs[1] === (row % 2 ? roofs[0] : roofs[1]) ? '#2a1a18' : roofs[1]);
    px(-1, y, W + 2, 1, row === 0 ? roofs[2] : (row % 2 ? roofs[2] : roofs[0]));
  }
  px(Math.round(W * 0.7), -6, 8, 8, '#66778f'); px(Math.round(W * 0.7), -7, 8, 2, '#96a9c1'); px(Math.round(W * 0.7) + 7, -6, 1, 8, '#4a5768');   // chimenea
}
function roomBgOut() {
  const im = IMG.biome;
  if (ROOM_BG && ROOM_BG.out && ROOM_BG.walls === S.walls && (ROOM_BG.ok || !im)) return ROOM_BG;
  if ((!IMG.houses && S.out.obs.some(o => o.kind === 'house') || !IMG.cityhouses && S.out.obs.some(o => o.kind === 'chouse')) && im) return ROOM_BG && ROOM_BG.out && ROOM_BG.walls === S.walls ? ROOM_BG : (ROOM_BG = { c: document.createElement('canvas'), walls: S.walls, world: S.world, torches: [], out: true, ok: false });
  const TH = THEMES[S.out.theme] || THEMES.grass;
  if (im && !IMG.outdoor) return ROOM_BG && ROOM_BG.out && ROOM_BG.walls === S.walls ? ROOM_BG : (ROOM_BG = { c: document.createElement('canvas'), walls: S.walls, world: S.world, torches: [], out: true, ok: false });
  const c = NAV.cols, r = NAV.rows, O = S.out, B = BIO[TH.biome] || BIO.grass, cvs = document.createElement('canvas'), g = cvs.getContext('2d'), Mg = BG_M;
  cvs.width = (c + Mg * 2) * CELL; cvs.height = (r + Mg * 2) * CELL; g.imageSmoothingEnabled = false;
  g.fillStyle = B.base; g.fillRect(0, 0, cvs.width, cvs.height);
  const res = { c: cvs, walls: S.walls, world: S.world, torches: [], out: true, ok: !!im };
  if (!im) return (ROOM_BG = res);
  g.translate(Mg * CELL, Mg * CELL);
  const bridge = new Set(); for (const b of O.bridges) for (let j = 0; j < b.h; j++) bridge.add((b.y + j) * c + b.x);
  const at = (x, y) => (x < 0 || y < 0 || x >= c || y >= r ? 1 : NAV.wall[y * c + x]);
  const water = (x, y) => at(x, y) === 2 || (x >= 0 && y >= 0 && x < c && y < r && bridge.has(y * c + x));
  const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647 + c * 31 + S.walls.length * 977) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const spr = (s, x, y) => g.drawImage(im, s[0], s[1], s[2], s[3], Math.round(x), Math.round(y), s[2], s[3]);
  const stand = (s, cx, by) => spr(s, cx - s[2] / 2, by - s[3]);
  const shadow = (cx, by, w) => { g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.ellipse(cx, by - 1, w, 3, 0, 0, Math.PI * 2); g.fill(); };
  const tile = (o, tx, ty, x, y) => g.drawImage(im, o[0] + tx, o[1] + ty, 16, 16, x * CELL, y * CELL, 16, 16);
  // Dibuja una referencia de tema con los pies en (cx, by); devuelve su ancho
  const refS = rf => (typeof rf === 'string' ? OUTP[rf] : rf[0] === 'r' ? rf.slice(1) : rf) || [0, 0, 16, 16];
  const ref = (rf, cx, by) => { const q = refS(rf), src = typeof rf === 'string' ? IMG.outdoor : rf[0] === 'r' ? IMG.ruins : im; if (src) g.drawImage(src, q[0], q[1], q[2], q[3], Math.round(cx - q[2] / 2), Math.round(by - q[3]), q[2], q[3]); return q[2]; };
  const pick = (list, v) => list[((v % list.length) + list.length) % list.length];
  // Suelo: hierba, y agua con la orilla que le toca a cada casilla
  if (B.land) for (let y = -Mg; y < r + Mg; y++) for (let x = -Mg; x < c + Mg; x++) {   // nieve, tierra seca...: baldosa central y el agua encima
    g.drawImage(im, B.land[0], B.land[1], 16, 16, x * CELL, y * CELL, 16, 16);
    if (!water(x, y)) continue;
    const N = !water(x, y - 1), So = !water(x, y + 1), W = !water(x - 1, y), E = !water(x + 1, y), w3 = B.water, wi = B.winner;
    if (N && W) tile(w3, 0, 0, x, y); else if (N && E) tile(w3, 32, 0, x, y); else if (So && W) tile(w3, 0, 32, x, y); else if (So && E) tile(w3, 32, 32, x, y);
    else if (N) tile(w3, 16, 0, x, y); else if (So) tile(w3, 16, 32, x, y); else if (W) tile(w3, 0, 16, x, y); else if (E) tile(w3, 32, 16, x, y);
    else if (!water(x - 1, y - 1)) tile(wi, 0, 0, x, y); else if (!water(x + 1, y - 1)) tile(wi, 16, 0, x, y); else if (!water(x - 1, y + 1)) tile(wi, 0, 16, x, y); else if (!water(x + 1, y + 1)) tile(wi, 16, 16, x, y);
    else tile(w3, 16, 16, x, y);
  }
  else for (let y = -Mg; y < r + Mg; y++) for (let x = -Mg; x < c + Mg; x++) {
    if (water(x, y)) { tile(B.water, 0, 0, x, y); continue; }
    const N = water(x, y - 1), So = water(x, y + 1), W = water(x - 1, y), E = water(x + 1, y);
    if (N && W) tile(B.tiles, 0, 0, x, y); else if (N && E) tile(B.tiles, 32, 0, x, y); else if (So && W) tile(B.tiles, 0, 32, x, y); else if (So && E) tile(B.tiles, 32, 32, x, y);
    else if (N) tile(B.tiles, 16, 0, x, y); else if (So) tile(B.tiles, 16, 32, x, y); else if (W) tile(B.tiles, 0, 16, x, y); else if (E) tile(B.tiles, 32, 16, x, y);
    else if (water(x - 1, y - 1)) tile(B.inner, 0, 0, x, y); else if (water(x + 1, y - 1)) tile(B.inner, 16, 0, x, y); else if (water(x - 1, y + 1)) tile(B.inner, 0, 16, x, y); else if (water(x + 1, y + 1)) tile(B.inner, 16, 16, x, y);
    else tile(B.tiles, 16, 16, x, y);
  }
  const onPave = (x, y) => (O.paves || []).some(([px, py, pw, ph]) => x >= px && y >= py && x < px + pw && y < py + ph);
  const dry = (x, y) => at(x, y) === 0 && !onPave(x, y) && !water(x, y) && !water(x - 1, y) && !water(x + 1, y) && !water(x, y - 1) && !water(x, y + 1);
  // Caminos empedrados, flores y nenúfares
  // Empedrado (Pixel Crawler): ladrillo gris repetido, con bordillo y alguna mata de hierba asomando por el borde
  const tw = IMG.town;
  if (tw && O.paves) {
    const T0 = TOWN.stone_floor, sx0 = T0[0], sy0 = T0[1] + 16, PW = 48, PH = 48;
    for (const [px, py, pw, ph] of O.paves) {
      const X0 = px * CELL, Y0 = py * CELL, X1 = (px + pw) * CELL, Y1 = (py + ph) * CELL;
      for (let y = Y0; y < Y1; y += 16) for (let x = X0; x < X1; x += 16) g.drawImage(tw, sx0 + (x % PW), sy0 + (y % PH), 16, 16, x, y, 16, 16);
    }
    const paved = (x, y) => O.paves.some(([px, py, pw, ph]) => x >= px && y >= py && x < px + pw && y < py + ph);
    for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
      if (!paved(x, y)) continue;
      const X = x * CELL, Y = y * CELL;
      if (!paved(x, y - 1)) { g.fillStyle = '#4a4a3e'; g.fillRect(X, Y, CELL, 2); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(X, Y + 2, CELL, 2); }
      if (!paved(x, y + 1)) { g.fillStyle = '#4a4a3e'; g.fillRect(X, Y + CELL - 2, CELL, 2); g.fillStyle = '#8c8a78'; g.fillRect(X, Y + CELL - 3, CELL, 1); }
      if (!paved(x - 1, y)) { g.fillStyle = '#4a4a3e'; g.fillRect(X, Y, 2, CELL); }
      if (!paved(x + 1, y)) { g.fillStyle = '#4a4a3e'; g.fillRect(X + CELL - 2, Y, 2, CELL); }
      const edge = !paved(x, y - 1) || !paved(x, y + 1) || !paved(x - 1, y) || !paved(x + 1, y);
      if (edge && !B.land && hash(x, y, 31) < 0.22) { const d = BIO.deco[Math.floor(hash(x, y, 32) * 3)]; spr(d, X + hash(x, y, 33) * 6, Y + (paved(x, y - 1) ? 10 : -2)); }
    }
  }
  for (const path of (tw && O.paves ? [] : O.paths)) for (let k = 0; k + 1 < path.length; k++) {
    const [ax, ay] = path[k], [bx, by] = path[k + 1], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 16 / 11);
    for (let i = 0; i <= n; i++) { const x = (ax + (bx - ax) * i / n) * 16, y = (ay + (by - ay) * i / n) * 16; spr(BIO.cobble, x - 17 + (hash(i, k, 3) - 0.5) * 6, y - 15 + (hash(i, k, 4) - 0.5) * 6); }
  }
  for (let y = 0; y < r; y++) for (let x = 0; x < c; x++) {
    if (dry(x, y) && hash(x, y, 7) < (TH.sparse ? 0.05 : 0.09)) { const d = pick(TH.deco, Math.floor(hash(x, y, 8) * 97)), q = refS(d); ref(d, x * CELL + q[2] / 2 + hash(x, y, 9) * (16 - Math.min(16, q[2])), y * CELL + Math.min(16, q[3]) + hash(x, y, 10) * (16 - Math.min(16, q[3]))); }
    if (!B.land && at(x, y) === 2 && at(x - 1, y) === 2 && at(x + 1, y) === 2 && at(x, y - 1) === 2 && at(x, y + 1) === 2 && hash(x, y, 11) < 0.07) spr(BIO.lily[hash(x, y, 12) < 0.5 ? 0 : 1], x * CELL, y * CELL + 2);
  }
  // Matorrales y flores de Pixel Crawler sueltos por la hierba (no estorban: son de adorno)
  if (tw && TH.pc) for (let y = 3; y < r - 3; y++) for (let x = 3; x < c - 3; x++) {
    if (!dry(x, y) || !dry(x + 1, y) || !dry(x, y + 1) || hash(x, y, 81) > 0.012) continue;
    const k = ['bush1', 'bush4', 'flower1', 'flower2', 'flower1', 'bush1'][Math.floor(hash(x, y, 82) * 6)], t = TOWN[k];
    if (t) g.drawImage(tw, t[0], t[1], t[2], t[3], Math.round(x * CELL + 8 - t[2] / 2), Math.round(y * CELL + 14 - t[3]), t[2], t[3]);
  }
  for (const b of O.bridges) spr(BIO.vbridge, b.x * CELL + 8 - 12, b.y * CELL + (b.h * CELL - 44) / 2);
  // Obstáculos: lo que el generador dejó apuntado, y bosque en todo lo demás que no se puede pisar
  const items = [], cover = new Uint8Array(c * r);
  for (const o of O.obs) {
    for (let j = o.y; j < o.y + o.h; j++) for (let i = o.x; i < o.x + o.w; i++) if (i >= 0 && j >= 0 && i < c && j < r) cover[j * c + i] = 1;
    const X = o.x * CELL, Y = o.y * CELL, W = o.w * CELL, H = o.h * CELL, cx = X + W / 2, by = Y + H;
    if (o.kind === 'rock') items.push({ by, fn: () => { shadow(cx, by, 15); ref(pick(TH.rocks, o.v), cx, by + 1); } });
    else if (o.kind === 'tree') items.push({ by, fn: () => { shadow(cx, by, 11); ref(pick(TH.trees, o.v), cx, by); } });
    else if (o.kind === 'ref') items.push({ by, fn: () => { shadow(cx, by, Math.min(20, refS(o.r)[2] / 2.3)); ref(o.r, cx, by + 1); } });
    else if (o.kind === 'ruin') items.push({ by, fn: () => { const sp = BIO.ruin[o.v % BIO.ruin.length]; shadow(cx, by, Math.min(15, sp[2] / 2)); if (IMG.ruins) g.drawImage(IMG.ruins, sp[0], sp[1], sp[2], sp[3], Math.round(cx - sp[2] / 2), by + 2 - sp[3], sp[2], sp[3]); } });
    else if (o.kind === 'prop') items.push({ by, fn: () => { const t = TOWN[o.k]; if (!tw || !t) return; shadow(cx, by, Math.min(16, t[2] / 2.4)); g.drawImage(tw, t[0], t[1], t[2], t[3], Math.round(cx - t[2] / 2), by + 2 - t[3], t[2], t[3]); } });
    else if (o.kind === 'fence') items.push({ by, fn: () => {   // valla de madera, en tramos horizontales o verticales
      g.fillStyle = '#3a241c'; if (o.horiz) { g.fillRect(X, by - 11, CELL, 2); g.fillRect(X, by - 6, CELL, 2); for (const dx of [1, 9]) { g.fillRect(X + dx, by - 14, 4, 13); } g.fillStyle = '#8a6240'; g.fillRect(X, by - 11, CELL, 1); g.fillRect(X, by - 6, CELL, 1); for (const dx of [2, 10]) g.fillRect(X + dx, by - 13, 2, 11); }
      else { g.fillRect(X + 5, Y - 8, 6, CELL + 8); g.fillStyle = '#8a6240'; g.fillRect(X + 6, Y - 7, 4, CELL + 6); g.fillStyle = '#a67c52'; g.fillRect(X + 6, Y - 7, 4, 2); g.fillStyle = '#5b3a2a'; g.fillRect(X + 6, Y + 4, 4, 1); }
    } });
    else if (o.kind === 'stall') items.push({ by, fn: () => {   // puesto del mercado: mostrador, toldo a rayas y género del Pixel Crawler
      const cols = [['#c0392b', '#efe6c8'], ['#3d6ea8', '#efe6c8'], ['#5a8a3c', '#efe6c8']][o.v % 3];
      shadow(cx, by, W / 2);
      g.fillStyle = '#3a241c'; g.fillRect(X + 2, by - 34, 3, 34); g.fillRect(X + W - 5, by - 34, 3, 34);
      g.fillStyle = '#3a241c'; g.fillRect(X, by - 14, W, 12); g.fillStyle = '#a67c52'; g.fillRect(X + 1, by - 13, W - 2, 10); g.fillStyle = '#8a6240'; for (let x = X + 6; x < X + W - 2; x += 7) g.fillRect(x, by - 13, 1, 10); g.fillStyle = '#c69a6a'; g.fillRect(X + 1, by - 13, W - 2, 2);
      for (let i = 0; i < 4; i++) { const v = TOWN['veg' + (1 + (i + o.v) % 4)]; if (tw && v) g.drawImage(tw, v[0], v[1], v[2], v[3], X + 3 + i * 11, by - 24, v[2], v[3]); }
      for (let i = 0; i * 6 < W + 4; i++) { g.fillStyle = cols[i % 2]; g.fillRect(X - 2 + i * 6, by - 44, 6, 10); g.beginPath(); g.moveTo(X - 2 + i * 6, by - 34); g.lineTo(X + 4 + i * 6, by - 34); g.lineTo(X + 1 + i * 6, by - 31); g.fill(); }
      g.fillStyle = '#2a1a18'; g.fillRect(X - 2, by - 45, W + 4, 1); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X, by - 33, W, 3);
    } });
    else if (o.kind === 'barrel') items.push({ by, fn: () => { shadow(cx, by, 7); stand(BIO.barrel[o.v % 3], cx, by); } });
    else if (o.kind === 'well') items.push({ by, fn: () => { shadow(cx, by + 2, 13); stand(BIO.well, cx, by + 3); } });
    else if (o.kind === 'chouse') items.push({ by, fn: () => {   // casas de las ciudades (tools/pack_city_houses.py)
      const hs = IMG.cityhouses, h = CITY_HOUSES[o.i] && CITY_HOUSES[o.i].r; if (!hs || !h) return;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + 4, by - 2, W - 4, 5); g.drawImage(hs, h[0], h[1], h[2], h[3], Math.round(cx - h[2] / 2), by + 2 - h[3], h[2], h[3]);
    } });
    else if (o.kind === 'house') items.push({ by, fn: () => {   // casas montadas con el Pixel Crawler Free Pack; si no han cargado, la dibujada a mano
      const hs = IMG.houses, list = o.big ? [0, 1, 4] : [2, 3, 5], h = HOUSES[list[o.v % list.length] + (o.ruin ? 6 : 0)];
      if (hs) { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(X + 4, by - 2, W - 4, 5); g.drawImage(hs, h[0], h[1], h[2], h[3], Math.round(cx - h[2] / 2), by + 2 - h[3], h[2], h[3]); }
      else drawHouse(g, X, Y - (o.big ? 18 : 12), W, H + (o.big ? 18 : 12), o.v);
    } });
    else if (o.kind === 'board') items.push({ by, fn: () => {   // el tablón de encargos: dos postes, un tablero y pergaminos clavados
      shadow(cx, by, 15); g.fillStyle = '#4a2e22'; g.fillRect(X + 2, Y - 10, 3, 26); g.fillRect(X + W - 5, Y - 10, 3, 26);
      g.fillStyle = '#2a1a18'; g.fillRect(X, Y - 13, W, 19); g.fillStyle = '#8a6240'; g.fillRect(X + 1, Y - 12, W - 2, 17); g.fillStyle = '#a67c52'; g.fillRect(X + 1, Y - 12, W - 2, 2);
      for (const [px, py, col] of [[4, -9, '#efe6c8'], [13, -10, '#e3d5a4'], [21, -8, '#efe6c8'], [8, -2, '#e3d5a4'], [18, -1, '#efe6c8']]) { g.fillStyle = col; g.fillRect(X + px, Y + py, 6, 6); g.fillStyle = '#c0392b'; g.fillRect(X + px + 2, Y + py, 2, 1); g.fillStyle = '#8a7a5a'; g.fillRect(X + px + 1, Y + py + 3, 4, 1); }
    } });
    else if (o.kind === 'castle') items.push({ by, fn: () => {   // la fachada del castillo: sillares del paquete, almenas, torres y el portón
      const top = -30, mid = cx;
      for (let y = top; y < by; y += 16) for (let x = X; x < X + W; x += 32) spr(BIO.wall, x, y);
      g.fillStyle = 'rgba(20,24,40,0.28)'; g.fillRect(X, top, W, by - top - 32);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X, by, W, 3);
      const cren = (x0, x1, y) => { for (let x = x0; x < x1; x += 12) { g.fillStyle = '#242a33'; g.fillRect(x, y - 8, 9, 9); g.fillStyle = '#96a9c1'; g.fillRect(x + 1, y - 7, 7, 8); g.fillStyle = '#66778f'; g.fillRect(x + 1, y - 2, 7, 3); } };
      cren(X + 2, X + W - 4, top);
      for (const tx of [X - 6, X + W - 42]) {   // torres
        for (let y = top - 26; y < by; y += 16) for (let x = tx; x < tx + 48; x += 32) g.drawImage(im, 368, 96, Math.min(32, tx + 48 - x), 16, x, y, Math.min(32, tx + 48 - x), 16);
        g.fillStyle = '#242a33'; g.fillRect(tx - 1, top - 26, 1, by - top + 26); g.fillRect(tx + 48, top - 26, 1, by - top + 26);
        cren(tx, tx + 46, top - 26);
        g.fillStyle = '#15121c'; g.fillRect(tx + 21, top + 4, 6, 14); g.fillStyle = '#f2c14e'; g.fillRect(tx + 22, top + 6, 4, 11);
        g.fillStyle = '#4a2e22'; g.fillRect(tx + 23, top - 52, 2, 20); g.fillStyle = '#c0392b'; g.fillRect(tx + 25, top - 52, 14, 9); g.fillStyle = '#f2c14e'; g.fillRect(tx + 30, top - 49, 4, 3);
      }
      for (let x = X + 70; x < X + W - 70; x += 44) if (Math.abs(x + 3 - mid) > 34) { g.fillStyle = '#15121c'; g.fillRect(x, top + 22, 6, 14); g.fillStyle = '#f2c14e'; g.fillRect(x + 1, top + 24, 4, 11); }
      g.fillStyle = '#242a33'; g.fillRect(mid - 20, by - 42, 40, 42); g.beginPath(); g.arc(mid, by - 42, 20, Math.PI, 0); g.fill();   // portón
      g.fillStyle = '#15121c'; g.fillRect(mid - 16, by - 40, 32, 40); g.beginPath(); g.arc(mid, by - 40, 16, Math.PI, 0); g.fill();
      g.fillStyle = '#4a5768'; for (let x = mid - 12; x <= mid + 12; x += 6) g.fillRect(x, by - 52, 1, 30); for (let y = by - 46; y < by - 22; y += 7) g.fillRect(mid - 15, y, 30, 1);
      g.fillStyle = '#c0392b'; g.fillRect(mid - 34, by - 50, 9, 30); g.fillRect(mid + 25, by - 50, 9, 30); g.fillStyle = '#f2c14e'; g.fillRect(mid - 32, by - 44, 5, 5); g.fillRect(mid + 27, by - 44, 5, 5);
      spr(BIO.stairs, mid - 16, by);
    } });
  }
  for (let y = -Mg; y < r + Mg; y++) for (let x = -Mg; x < c + Mg; x++) {
    const inb = x >= 0 && y >= 0 && x < c && y < r;
    if (at(x, y) !== 1 || (inb && cover[y * c + x])) continue;
    const X = x * CELL, by = (y + 1) * CELL, h = hash(x, y, 20);
    if (TH.sparse ? h < 0.34 : (((x + y) & 1) === 0 || h < 0.3)) items.push({ by: by + h, fn: () => { shadow(X + 8, by, 9); ref(pick(TH.forest, Math.floor(hash(x, y, 21) * 97)), X + 8 + (hash(x, y, 22) - 0.5) * 6, by); } });
    else if (h > 0.6) items.push({ by: by + h, fn: () => ref(pick(TH.fbush, Math.floor(hash(x, y, 23) * 97)), X + 8, by) });
  }
  for (const d of O.decor || []) items.push({ by: d.y * CELL, fn: () => { if (d.shadow !== false) shadow(d.x * CELL, d.y * CELL, Math.min(14, refS(d.r)[2] / 2.6)); ref(d.r, d.x * CELL, d.y * CELL + 1); } });   // adorno que se pisa: sacos, tumbas caídas...
  items.sort((a, b) => a.by - b.by);
  for (const it of items) it.fn();
  if (TH.dim) { g.fillStyle = TH.dim; g.fillRect(-Mg * CELL, -Mg * CELL, cvs.width, cvs.height); }   // tono de la zona
  for (const f of O.fires || []) res.torches.push({ x: f.x * CELL, y: f.y * CELL - 6 });               // hogueras: llama animada y luz
  return (ROOM_BG = res);
}
// ───────────────────────── Mazmorras con el arte de Pixel Crawler (Anokolisa, itch.io) ─────────────────────────
// Cada zona toma de un paquete su suelo, la cara de sus muros (tres franjas: remate, sillares y zócalo) y el borde de piedra
// que rodea la parte de arriba. Lo que no se ve desde abajo es la oscuridad de dentro del muro, como en el propio paquete.
loadImg('decor', 'assets/decor.png');
for (const k of ['castle', 'cave', 'forge', 'rock', 'floors', 'dungeon']) loadImg('pc_' + k, 'assets/pc_' + k + '.png');
const DPAL = [
  { img: 'pc_castle', top: '#1b1828', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_castle', 240, 272, 48, 48], topTex: ['pc_castle', 0, 176, 96, 96, 0.5] },   // Las Criptas
  { img: 'pc_rock', top: '#2a1f17', face: [[32, 96], [32, 112], [32, 112]], rimT: [32, 0, 16, 8], rimL: [0, 40, 8, 16], rimR: [88, 40, 8, 16], floor: ['pc_cave', 112, 224, 48, 32], topTex: ['pc_rock', 32, 24, 32, 32, 0.38] },            // El Nido
  { img: 'pc_rock', top: '#2a3036', face: [[128, 96], [128, 112], [128, 112]], rimT: [128, 0, 16, 8], rimL: [96, 40, 8, 16], rimR: [184, 40, 8, 16], floor: ['pc_floors', 96, 160, 32, 32], topTex: ['pc_rock', 128, 24, 32, 32, 0.32] },  // Las Minas
  { img: 'pc_forge', top: '#21111a', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_forge', 16, 128, 32, 32], topTex: ['pc_forge', 0, 128, 32, 32, 0.4] },          // El Umbral
];
const HALL = { img: 'pc_castle', top: '#1b1828', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_castle', 192, 272, 48, 48] };
function roomBgDungeon(Dover) {
  const D = Dover || DPAL[clamp((S.world || 1) - 1, 0, 3)], im = IMG[D.img], fim = IMG[D.floor[0]];
  if (!im || !fim || (!Dover && !IMG.decor)) return null;
  if (ROOM_BG && ROOM_BG.pc && ROOM_BG.walls === S.walls && ROOM_BG.world === S.world && !Dover) return ROOM_BG;
  const c = NAV.cols, r = NAV.rows, cvs = document.createElement('canvas'), g = cvs.getContext('2d');
  cvs.width = (c + BG_M * 2) * CELL; cvs.height = (r + BG_M * 2) * CELL; g.imageSmoothingEnabled = false;
  g.fillStyle = D.top; g.fillRect(0, 0, cvs.width, cvs.height);
  g.translate(BG_M * CELL, BG_M * CELL);
  const sp = new Set(Dover ? [] : (S.solidProps || []).map(q => q.y * c + q.x));   // obstáculos sueltos: son muro para el juego, pero se pintan como un objeto sobre el suelo
  const wallAt = (x, y) => x < 0 || y < 0 || x >= c || y >= r || (NAV.wall[y * c + x] === 1 && !sp.has(y * c + x));
  const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 2147483647 + (S.world || 1) * 9781) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const blit = (src, s, dx, dy, w, h) => g.drawImage(src, s[0], s[1], w || s[2], h || s[3], dx, dy, w || s[2], h || s[3]);
  // Suelo: el dibujo del paquete repetido según la posición, para que enlace de casilla en casilla
  const [, fx, fy, fw, fh] = D.floor;
  for (let y = -1; y <= r; y++) for (let x = -1; x <= c; x++) {
    if (wallAt(x, y) && wallAt(x, y - 1) && wallAt(x, y + 1)) continue;
    const X = x * CELL, Y = y * CELL, ox = ((X % fw) + fw) % fw, oy = ((Y % fh) + fh) % fh;
    for (let j = 0; j < CELL;) { const sy = (oy + j) % fh, hh = Math.min(CELL - j, fh - sy);
      for (let i = 0; i < CELL;) { const sx = (ox + i) % fw, ww = Math.min(CELL - i, fw - sx); g.drawImage(fim, fx + sx, fy + sy, ww, hh, X + i, Y + j, ww, hh); i += ww; }
      j += hh; }
  }
  // Manchas de humedad y desgaste, para que el suelo no sea un dibujo repetido sin más
  for (let i = 0; i < Math.floor(c * r / 18); i++) {
    const bx = Math.floor(hash(i, 1, 71) * c * CELL), by = Math.floor(hash(i, 2, 72) * r * CELL), bw = 10 + Math.floor(hash(i, 3, 73) * 40), bh = 6 + Math.floor(hash(i, 4, 74) * 22), dark = hash(i, 5, 75) < 0.7;
    g.fillStyle = dark ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.04)';
    g.beginPath(); g.ellipse(bx, by, bw / 2, bh / 2, 0, 0, Math.PI * 2); g.fill();
    if (dark && hash(i, 6, 76) < 0.5) { g.beginPath(); g.ellipse(bx + bw * 0.3, by + bh * 0.2, bw / 3, bh / 3, 0, 0, Math.PI * 2); g.fill(); }
  }
  // Grietas en el suelo
  for (let i = 0; i < Math.floor(c * r / 26); i++) {
    let gx = Math.floor(hash(i, 7, 77) * c * CELL), gy = Math.floor(hash(i, 8, 78) * r * CELL);
    if (wallAt(Math.floor(gx / CELL), Math.floor(gy / CELL))) continue;
    g.fillStyle = 'rgba(0,0,0,0.32)';
    for (let k = 0; k < 10 + Math.floor(hash(i, 9, 79) * 12); k++) { g.fillRect(gx, gy, 1, 1); gx += hash(i, k, 80) < 0.5 ? 1 : -1; gy += hash(i, k, 81) < 0.6 ? 1 : 0; if (hash(i, k, 82) < 0.12) { g.fillRect(gx + 1, gy - 1, 1, 1); } }
  }
  // Muros: la cara (hasta tres franjas por encima del suelo) y, encima, la oscuridad con su borde
  const torches = [];
  for (let y = -BG_M; y < r + BG_M; y++) for (let x = -BG_M; x < c + BG_M; x++) {
    if (!wallAt(x, y)) continue;
    const X = x * CELL, Y = y * CELL;
    let k = 0; while (k < 3 && wallAt(x, y + k + 1) === true && y + k + 1 < r) k++;   // cuántas casillas de muro hay debajo antes del suelo
    const floorBelow = y + k + 1 < r && y + k + 1 >= 0 && !wallAt(x, y + k + 1);
    if (floorBelow && k <= 2) {
      const row = k === 0 ? 2 : k === 1 ? 1 : 0;                   // de abajo arriba: zócalo, sillares, remate
      blit(im, [D.face[row][0] + (hash(x, y, 3) < 0.5 ? 0 : 16) * (D.img === 'pc_castle' || D.img === 'pc_forge' ? 1 : 0), D.face[row][1], 16, 16], X, Y);
      if (!wallAt(x - 1, y)) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(X, Y, 2, CELL); }
      if (!wallAt(x + 1, y)) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(X + CELL - 2, Y, 2, CELL); }
      if (k === 0) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X, Y + CELL, CELL, 3); }
      if (k === 1 && ((x % 5) + 5) % 5 === 2 && hash(x, y, 90) < 0.75 && y + 2 < r) torches.push({ x: X + 8, y: Y + 6 });
      continue;
    }
    // parte de arriba: oscuridad, y un borde allí donde termina el muro
    const edge = (dx, dy) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < c && ny < r && !wallAt(nx, ny); };
    const faceBelow = (dx, dy) => { const nx = x + dx, ny = y + dy; if (!wallAt(nx, ny)) return false; let j = 0; while (j < 3 && wallAt(nx, ny + j + 1) && ny + j + 1 < r) j++; return ny + j + 1 < r && !wallAt(nx, ny + j + 1) && j <= 2; };
    if (D.topTex && x >= -1 && y >= -1 && x <= c && y <= r) {   // la parte de arriba del muro: piedra o roca de la zona, en sombra
      const [tk, tx, ty, tw2, th, dk] = D.topTex, tim = IMG[tk];
      if (tim) { const ox = ((X % tw2) + tw2) % tw2, oy = ((Y % th) + th) % th;
        for (let j = 0; j < CELL;) { const sy = (oy + j) % th, hh = Math.min(CELL - j, th - sy); for (let i = 0; i < CELL;) { const sx = (ox + i) % tw2, ww = Math.min(CELL - i, tw2 - sx); g.drawImage(tim, tx + sx, ty + sy, ww, hh, X + i, Y + j, ww, hh); i += ww; } j += hh; }
        g.fillStyle = 'rgba(8,6,12,' + dk + ')'; g.fillRect(X, Y, CELL, CELL); }
    }
    if (edge(0, -1)) blit(im, D.rimT, X, Y, 16, D.rimT[3]);
    if (edge(-1, 0) || faceBelow(-1, 0)) blit(im, D.rimL, X, Y, D.rimL[2], 16);
    if (edge(1, 0) || faceBelow(1, 0)) blit(im, D.rimR, X + CELL - D.rimR[2], Y, D.rimR[2], 16);
  }
  // Decorado de la zona: contra la base de los muros (lápidas, setas, barriles...) y algo suelto por el suelo
  const DZ = !Dover && DECOR[String(clamp(S.world || 1, 1, 4))], dim = IMG.decor;
  if (DZ && dim) {
    const used = new Uint8Array(c * r), start = S.p ? { x: Math.floor(S.p.x / CELL), y: Math.floor(S.p.y / CELL) } : null;
    const onTrap = (x, y) => (S.traps || []).some(t => x * CELL >= t.x - 8 && x * CELL < t.x + t.w + 8 && y * CELL >= t.y - 8 && y * CELL < t.y + t.h + 8);
    const items = [];
    for (let y = 1; y < r - 1; y++) for (let x = 1; x < c - 1; x++) {
      if (wallAt(x, y) || sp.has(y * c + x) || used[y * c + x] || onTrap(x, y) || (start && Math.abs(x - start.x) < 3 && Math.abs(y - start.y) < 3)) continue;
      const byWall = wallAt(x, y - 1), h = hash(x, y, 61);
      const list = byWall ? DZ.wall : DZ.floor; if (!list.length || h > (byWall ? 0.34 : 0.035)) continue;
      const it = list[Math.floor(hash(x, y, 62) * list.length)];
      if (!byWall && hash(x, y, 64) < 0.5) for (let n = 0; n < 2; n++) { const it2 = list[Math.floor(hash(x, y, 65 + n) * list.length)]; items.push({ it: it2, x: x * CELL + 8 + (hash(x, y, 67 + n) - 0.5) * 22, y: y * CELL + 12 + (hash(x, y, 69 + n) - 0.5) * 14 }); }   // en grupo, no sueltos
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (y + j >= 0 && y + j < r && x + i >= 0 && x + i < c) used[(y + j) * c + x + i] = 1;
      items.push({ it, x: x * CELL + 8 + (hash(x, y, 63) - 0.5) * 4, y: byWall ? y * CELL + Math.min(14, it[3] - 2) : y * CELL + 12 });
    }
    for (const k of sp) { const x = k % c, y = (k / c) | 0, list = DZ.solid || []; if (list.length) items.push({ it: list[Math.floor(hash(x, y, 91) * list.length)], x: x * CELL + 8, y: y * CELL + 15 }); }
    items.sort((a, b) => a.y - b.y);
    for (const { it, x, y } of items) {
      g.fillStyle = 'rgba(0,0,0,0.28)'; g.beginPath(); g.ellipse(x, y, Math.min(10, it[2] / 2.2), 2.5, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(dim, it[0], it[1], it[2], it[3], Math.round(x - it[2] / 2), Math.round(y + 1 - it[3]), it[2], it[3]);
    }
  }
  return (ROOM_BG = { c: cvs, walls: S.walls, world: S.world, torches, pc: true });
}
// La forja y la posada: el fondo de mazmorra con su suelo y sus muros, y los muebles ordenados de arriba abajo
const INTERIOR = {
  forge: { img: 'pc_forge', top: '#21111a', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_castle', 144, 272, 48, 48] },
  inn: { img: 'pc_castle', top: '#1b1828', face: [[32, 64], [32, 80], [32, 96]], rimT: [32, 0, 16, 6], rimL: [0, 24, 6, 16], rimR: [74, 24, 6, 16], floor: ['pc_castle', 96, 288, 48, 32] },
};
function roomBgInterior() {
  const O = S.out; if (ROOM_BG && ROOM_BG.inner && ROOM_BG.walls === S.walls) return ROOM_BG;
  if (!IMG.town || !IMG.biome) return null;
  const base = roomBgDungeon(INTERIOR[O.interior]); if (!base) return null;
  const g = base.c.getContext('2d'); g.setTransform(1, 0, 0, 1, BG_M * CELL, BG_M * CELL); g.imageSmoothingEnabled = false;
  for (const p of O.props.slice().sort((a, b) => a.y - b.y)) {
    const im = p.src === 'town' ? IMG.town : p.src === 'bio' ? IMG.biome : IMG.pc_castle, s = p.src === 'town' ? TOWN[p.s] : p.src === 'bio' ? BIO.barrel[+p.s.slice(-1)] : p.s;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(p.x, p.y - 1, Math.min(18, s[2] / 2.2), 3, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(im, s[0], s[1], s[2], s[3], Math.round(p.x - s[2] / 2), Math.round(p.y + 2 - s[3]), s[2], s[3]);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (O.interior === 'inn') base.torches = base.torches.filter(t => Math.abs(t.x - (NAV.cols >> 1) * CELL) > 30);
  base.inner = true; return base;
}
// El salón del trono: el fondo de mazmorra con el castillo, y encima alfombra, vidriera, trono, estandartes y macetas del paquete
function roomBgHall() {
  if (ROOM_BG && ROOM_BG.hall && ROOM_BG.walls === S.walls) return ROOM_BG;
  const base = roomBgDungeon(HALL); if (!base) return null;
  const im = IMG.pc_castle, g = base.c.getContext('2d'), c = NAV.cols, r = NAV.rows, cx = (c >> 1) * CELL;
  g.setTransform(1, 0, 0, 1, BG_M * CELL, BG_M * CELL); g.imageSmoothingEnabled = false;
  const spr = (sx, sy, w, h, x, y) => g.drawImage(im, sx, sy, w, h, Math.round(x), Math.round(y), w, h);
  for (let y = 6 * CELL; y < (r - 2) * CELL; y += 32) spr(288, 288, 48, Math.min(32, (r - 2) * CELL - y), cx - 24, y);   // alfombra
  spr(288, 272, 48, 8, cx - 24, 6 * CELL - 8);
  spr(160, 104, 32, 56, cx - 16, 1 * CELL + 6);                       // vidriera
  for (const dx of [-60, 44]) spr(192, 112, 16, 40, cx + dx, 2 * CELL);   // ventanas
  for (const dx of [-110, 94]) spr(272, 176, 32, 48, cx + dx, 3 * CELL - 4);   // estandartes
  spr(278, 13, 20, 51, cx - 10, 4 * CELL - 2);                        // trono
  for (const dx of [-46, 30]) spr(278, 123, 16, 32, cx + dx, 4 * CELL - 4);  // bustos
  for (const [x, y] of [[2.2, 16], [c - 3.6, 16], [2.2, 9.6], [c - 3.6, 9.6]]) spr(336, 224, 24, 48, x * CELL, y * CELL - 30);   // macetas
  g.setTransform(1, 0, 0, 1, 0, 0);
  base.torches = base.torches.filter(t => Math.abs(t.x - cx) > 40);   // ninguna antorcha delante de la vidriera
  base.hall = true; return base;
}
// ───────────────────────── Interfaz (DOM) ─────────────────────────
const ov = $('overlay'), ovBody = $('ovBody');
const HINTS = {
  pad: 'Stick izq. mover · A o RT disparar · B o RB esquivar · X o LT cargar · Stick der. cambiar objetivo · Start pausa',
  kb: 'WASD mover · Espacio disparar · Shift esquivar · E cargar · Clic en un enemigo para fijarlo · Esc pausa',
  touch: 'Toca un enemigo para fijarlo como objetivo',
  none: 'Pulsa un botón del mando, una tecla o la pantalla',
};
// ── Menú principal: continuar, nueva partida y ajustes (con la versión del juego) ──
let titleView = 'menu', titleSel = 0;
const hasSave = () => !!(M.seenIntro || M.runs || Object.keys(M.done || {}).length || M.run);
function titleItems() {
  if (titleView === 'confirm') return [['no', 'No, volver'], ['wipe', 'Sí, borrar y empezar de cero']];
  if (titleView === 'settings') { const lv = n => ['Apagado', 'Bajo', 'Medio', 'Normal', 'Alto'][n]; return [
    ['sound', 'Sonido', CFG.sound ? 'Encendido' : 'Apagado'], ['music', 'Volumen de la música', lv(CFG.music)], ['sfx', 'Volumen de los efectos', lv(CFG.sfx)],
    ['blend', 'Suavizado de animaciones', CFG.blend ? 'Sí' : 'No'], ['tips', 'Volver a ver los avisos de ayuda', Object.keys(M.tips || {}).length ? '' : 'Activados'], ['ctl', 'Controles'], ['cred', 'Créditos'], ['back', 'Volver']]; }
  if (titleView === 'ctl' || titleView === 'cred') return [['settings', 'Volver']];
  return (hasSave() ? [['cont', M.run ? 'Continuar · ' + M.run.mission.name : 'Continuar']] : []).concat([['new', 'Nueva partida'], ['settings', 'Ajustes']]);
}
function titleHtml() {
  const it = titleItems(); titleSel = clamp(titleSel, 0, it.length - 1);
  const btns = `<div class="tmenu">${it.map(([id, nm, val], i) => `<button class="fi tm${i === titleSel ? ' sel' : ''}${id === 'wipe' ? ' danger' : ''}" data-tm="${id}"><b>${nm}</b>${val ? `<i>${val}</i>` : ''}</button>`).join('')}</div>`;
  const ver = `Versión ${GAME_V || 'de desarrollo'} · ${IN_APP ? 'app de Android' : 'web'}`;
  let mid = '';
  if (titleView === 'confirm') mid = `<h2>¿Empezar de cero?</h2><p class="lead">Se borrará todo tu progreso: encargos cumplidos, almas, hierro, piezas forjadas y el árbol. Los ajustes se conservan. No se puede deshacer.</p>`;
  else if (titleView === 'settings') mid = `<h2>Ajustes</h2><p class="ver"><b>${ver}</b>${IN_APP ? '<br>La app busca versiones nuevas cada vez que se abre. Si hay una, la descarga sola: en esta pantalla se aplica al momento; si estás jugando, la próxima vez que abras.' : ''}</p>`;
  else if (titleView === 'ctl') mid = `<h2>Controles</h2><dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo · Start pausa</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo · Esc pausa</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl><p class="fine">Con mando: pulsa cualquier botón para que se detecte. En el móvil, juega en horizontal.</p>`;
  else if (titleView === 'cred') mid = `<h2>Créditos</h2><p class="fine">Arte: personajes de overboy (Character Megapack) · biomas y ruinas de Androx, licencia CC BY 4.0 · mazmorras, casas, castillo y gente de Anokolisa (Pixel Crawler) · familia real de Elthen · efectos de «Super Pixel Effects Gigapack», de Will Tice / unTied Games, y del Fantasy RPG Pixel Pack · huesos y ruinas del Free Undead Tileset · iconos de Clockwork Raven Studios (Raven Fantasy Icons) · Alec: dibujado por código con IA (tools/make_mage.py). Música de RandomMind, ARoachIFoundOnMyPillow y Juhani Junkala; sonidos de «150 Combat Sound Effects» y «Magic Spell SFX» (OpenGameArt, CC0).</p>`;
  else mid = `<p class="lead">Dispara, da un paso, dispara. Roba las técnicas de los dioses y úsalas para matarlos.</p>`;
  return `<div class="titlebox"><p class="eyebrow">Un roguelite de guanteletes y dioses</p><h1 class="logo">Alec, el sin dios</h1>${mid}${btns}<p class="fine vertag">${ver}</p></div>`;
}
function titleAct(id) {
  const cyc = (k, n) => { CFG[k] = (CFG[k] + 1) % n; saveCfg(); };
  if (id === 'cont') { titleView = 'menu'; if (M.seenIntro) openForge(); else playIntro(); return; }
  if (id === 'new') { if (hasSave()) { titleView = 'confirm'; titleSel = 0; } else { playIntro(); return; } }
  else if (id === 'wipe') { try { localStorage.removeItem('kiteo.save3'); sessionStorage.setItem('kiteo.fresh', '1'); } catch (e) { /* sin almacenamiento */ } location.reload(); return; }
  else if (id === 'no' || id === 'back') { titleView = 'menu'; titleSel = 0; }
  else if (id === 'settings' || id === 'ctl' || id === 'cred') { titleSel = id === 'settings' && titleView !== 'menu' ? titleSel : 0; titleView = id; }
  else if (id === 'sound') { cyc('sound', 2); muted = !CFG.sound; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; }
  else if (id === 'music') cyc('music', 5);
  else if (id === 'sfx') cyc('sfx', 5);
  else if (id === 'blend') cyc('blend', 2);
  else if (id === 'tips') tipsReset();
  audioInit(); musicTick(); sfx('tick', 0.3); renderOverlay();
}
function titleInput() {
  const n = titleItems().length;
  if (I.navY) { titleSel = (titleSel + (I.navY > 0 ? 1 : n - 1)) % n; sfx('tick', 0.25); renderOverlay(); }
  else if (I.atkP) titleAct(titleItems()[titleSel][0]);
  else if (I.backP && titleView !== 'menu') titleAct(titleView === 'ctl' || titleView === 'cred' ? 'settings' : 'back');
}
function renderOverlay() {
  const m = S.mode;
  ov.hidden = m === 'play' || m === 'town' || m === 'intro';
  if (m === 'play' || m === 'town' || m === 'intro') { ovBody.innerHTML = ''; return; }
  let h = '';
  if (m === 'title') h = titleHtml();
  else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · ${whereNow()}</p><h1>${gunName(S.gun)}</h1><p class="fine">${(1 / periodOf()).toFixed(2)} disparos por segundo · ${Math.round(S.p.dmg * gunDmg())} de daño por disparo (poder +${Math.round(((S.p.powMul || 1) - 1) * 100)}%: cada nivel de técnica y cada técnica suelta suma un ${Math.round(POW_STEP * 100)}%) · ${Math.round(rangeOf())} de alcance · ${Math.ceil(S.p.hp)} de ${S.p.maxHp} de vida · ${Math.floor(S.p.gold)} de oro</p><div class="btns"><button id="ovBtn" class="primary">Seguir</button><button id="bookBtn" class="ghost">Recetario</button></div><ul class="build full">${buildHtml(true)}</ul><p class="fine">La partida se guarda al entrar en cada sala: puedes cerrar y continuar luego desde la forja.</p>`;
  } else if (m === 'book') h = bookHtml();
  else if (m === 'dead') {
    h = `<p class="eyebrow">Encargo fallido</p><h1>Alec se retira</h1>
      <p class="lead">${S.failTxt || 'Caíste'} · ${whereNow()}, con ${S.kills} bajas. Te llevas ${lootTxt()} a la forja. El encargo sigue en pie: puedes volver a intentarlo.</p>
      <button id="ovBtn" class="primary">A la plaza</button>`;
  } else if (m === 'win') {
    h = `<p class="eyebrow">${S.mission.zone} · ${MTYPES[S.mission.type].name}</p><h1>${S.mission.type === 'god' ? 'Un dios menos' : 'Encargo cumplido'}</h1>
      <p class="lead">${S.mission.name}: ${S.kills} bajas. El reino paga ${S.pay} almas${S.first ? '' : ' (ya lo habías cumplido: repetirlo paga la mitad)'}. Te llevas ${lootTxt()} a la forja${S.found ? ', y entre los restos encuentras una pieza: ' + S.found : ''}.</p>${newGodHtml(S.newGod)}
      <button id="ovBtn" class="primary">${endingDue() || zoneDue() ? 'Seguir' : 'A la plaza'}</button>`;
  } else if (m === 'forge') h = forgeHtml();
  else if (m === 'shop') h = shopHtml();
  else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1>${tipBox(pickTip)}<div class="cards rows">` +
      pickOpts.map((u, i) => `<button class="card${i === pickSel ? ' sel' : ''}" data-i="${i}" id="card${i}" style="--fam:${u.color}"><div class="ch"><em>${u.tag}${u.rar ? `<i style="color:${RAR[u.rar].color}"> · ${RAR[u.rar].name}</i>` : ''}</em><strong>${u.pic ? pic(u.pic) : u.ico ? ico(u.ico[0], u.ico[1]) : ''}${u.name}</strong></div><div class="cb"><span>${u.desc}</span>${u.note ? `<small>${u.note}</small>` : ''}</div>${u.tag === 'Vender' ? '' : gloss(u.desc + ' ' + (u.note || ''), 4)}</button>`).join('') +
      `</div><div class="btns"><button id="bookBtn" class="ghost">Recetario</button>${pickReroll && S.rerolls > 0 ? '<button id="rrBtn" class="ghost">Volver a sortear</button>' : ''}<p class="fine">Muévete con el stick izquierdo o la cruceta (también hacia abajo), disparar para confirmar. El stick derecho desplaza la pantalla. Cargar abre el recetario${pickReroll && S.rerolls > 0 ? ' y esquivar vuelve a sortear' : ''}.</p></div>`;
  }
  ovBody.innerHTML = h;
  ovBody.classList.toggle('wide', m === 'book' || m === 'forge' || m === 'shop' || m === 'pick' || m === 'pause');
  if (m === 'forge' || m === 'shop') bindList();
  ovBody.querySelectorAll('[data-bk]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); audioInit(); bookPage = +b.dataset.bk; bookTurn(0); }));
  const rr = $('rrBtn'); if (rr) rr.addEventListener('click', () => { audioInit(); rerollPick(); });
  const bk = $('bookBtn'); if (bk) bk.addEventListener('click', () => { audioInit(); openBook(); });
  const b = $('ovBtn'); if (b) b.addEventListener('click', () => { audioInit(); primaryAction(true); });
  ovBody.querySelectorAll('[data-tm]').forEach((b, i) => b.addEventListener('click', () => { titleSel = i; titleAct(b.dataset.tm); }));
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
// En la pantalla de victoria: la deidad que se acaba de fijar en ti, con su color, su tema y lo que hace
function newGodHtml(g) {
  const G = GODS[g]; if (!G) return '';
  const n = godsOpenN(), all = GOD_UNLOCK.length;
  return `<div class="bkhead newgod" style="--c:${G.color}"><em>Una deidad nueva se ha fijado en ti</em><h2>${G.title}</h2><p><b>${G.theme}.</b> ${G.key}</p>
    <p class="fine">Desde el próximo encargo puedes encontrarte a sus elegidos y robarle técnicas. Su página del Recetario ya está abierta. ${n >= all ? 'Ya te conocen las ' + all + ' deidades.' : 'Te conocen ' + n + ' de ' + all + ' deidades: cada encargo que cumplas por primera vez atrae a otra.'}</p></div>`;
}
function primaryAction(force) {
  if (S.mode === 'title') return;   // el menú principal tiene sus propios botones
  if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'book') closeBook();
  else if ((S.mode === 'dead' || S.mode === 'win') && (force || modeT > 0.8)) { if (endingDue()) playEnding(); else if (zoneDue()) playZone(S.mission.z); else openForge(); }   // tras matar al dios por primera vez, el final del reino
}
$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí';
$('btnMute').addEventListener('click', () => { muted = !muted; CFG.sound = muted ? 0 : 1; saveCfg(); $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); musicTick(); });

let hudKey = '';
// Las cuatro acciones en el HUD: una casilla por acción, con el color de su deidad y el nivel en puntos
function hudBuild() {
  const short = { basic: 'Disparo', charge: 'Cargado', dodge: 'Esquive', passive: 'Pasiva' };
  return SLOT_KEYS.map(k => { const cur = S.build[k]; if (!cur) return `<li class="slot empty"><em>${short[k]}</em><b>—</b></li>`;
    const D = DUO[cur.id], col = D ? RAR[3].color : GODS[PIECE[cur.id].god].color, nm = D ? D.name : PIECE[cur.id].name;
    return `<li class="slot" style="--c:${col}">${pic(D ? D.a : cur.id, 's')}<em>${short[k]}</em><b>${nm}</b><u>${'<i></i>'.repeat(cur.lvl)}</u></li>`; }).join('');
}
function renderHud() {
  const p = S.p;
  const dev = padBlocked ? 'Mando bloqueado en esta vista' : padName ? 'Mando conectado' : lastDev === 'touch' ? 'Táctil' : lastDev === 'kb' ? 'Teclado' : 'Mando no detectado';
  const left = S.enemies.length + S.queue.length, bo = S.enemies.find(e => e.boss && e.spawn <= 0), inRun = S.wave > 0;
  const key = [Math.ceil(p.hp), p.maxHp, Math.round(p.reserve), S.wave, left, dev, lastDev, periodOf().toFixed(3), Math.round(p.dmg), Math.round(rangeOf()), S.mode, JSON.stringify(S.build), JSON.stringify(S.gun), S.techs.size, S.plans.size,
    Math.round(p.fury / 4), Math.floor(p.gold), S.shades.length, S.soulsRun, S.ironRun, bo ? Math.ceil(bo.hp / 8) : -1, S.keep ? Math.ceil(S.keep.hp / 4) : -1, S.defWave, S.postsDown, S.xp, S.xpLvl].join('|');
  if (key === hudKey) return; hudKey = key;
  $('hpFill').style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  $('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp + (p.reserve >= 1 ? '  +' + Math.round(pct(p.reserve)) : '');
  const ms = S.mission;
  // Cabecera del encargo: nombre, en qué tramo vas y una fila de cuentas (hechas, la actual, tiendas y jefe)
  if (!inRun || !ms) { $('wave').innerHTML = ''; $('pips').innerHTML = ''; }
  else {
    const tot = roomsOf(ms), unit = ms.type === 'defend' ? 'Oleada' : ms.type === 'assault' ? 'Campamento' : 'Sala';
    const sub = S.bossRoom ? 'Jefe' : unit + ' ' + S.room + ' de ' + tot + (ms.type === 'assault' ? ' · estandartes ' + (S.postsDown || 0) + '/' + (S.postsAll || 3) + ' · nivel ' + (S.xpLvl + 1) + ' (' + S.xp + '/' + xpNeed(S.xpLvl) + ')' : ' · quedan ' + left);
    $('wave').innerHTML = `<b>${ms.name}</b><span>${MTYPES[ms.type].name} · ${sub}</span>`;
    let h = ''; for (let i = 1; i <= tot; i++) h += `<i class="${i < S.room ? 'done' : i === S.room ? 'now' : ''}${hasBoss(ms) && i === tot ? ' boss' : ''}"></i>` + (i < tot && shopAfter(ms, i) ? '<i class="shop"></i>' : '');
    $('pips').innerHTML = h;
  }
  $('stats').textContent = inRun ? gunName(S.gun) : '';
  const rc = (cls, n, t) => `<span class="rc ${cls}" title="${t}"><i></i>${n}</span>`;
  $('res').innerHTML = !inRun ? '' : rc('gold', Math.floor(p.gold), 'Oro') + (S.soulsRun ? rc('soul', S.soulsRun, 'Almas') : '') + (S.ironRun ? rc('iron', S.ironRun, 'Hierro Místico') : '') + (godCount('orc') || G('a_drum') ? rc('fury', Math.round(p.fury), 'Furia') : '') + (S.shades.length ? rc('shade', S.shades.length, 'Sombras') : '');
  $('build').innerHTML = inRun ? hudBuild() : '';
  $('boss').hidden = (!bo && !S.keep) || S.mode !== 'play';
  if (S.keep) { $('boss').firstElementChild.textContent = 'La campana de la aldea'; $('bossFill').style.width = clamp(S.keep.hp / S.keep.maxHp * 100, 0, 100) + '%'; }
  else if (bo) { $('boss').firstElementChild.textContent = bo.type.name; $('bossFill').style.width = clamp(bo.hp / bo.maxHp * 100, 0, 100) + '%'; }
  $('dev').textContent = dev;
  $('hint').textContent = '';   // los controles ya no van al pie de la pantalla: están en Ajustes → Controles
  $('touch').hidden = lastDev !== 'touch';
}

// ───────────────────────── Bucle ─────────────────────────
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  resize(); pollInput(); modeT += dt; musicTick();
  const m = S.mode;
  if (m !== 'play' && Math.abs(I.ay) > 0.2 && !dualScroll(I.ay * 900 * dt)) ov.scrollTop += I.ay * 900 * dt;   // en cualquier menú, el stick derecho desplaza la pantalla
  if ((m === 'pause' || m === 'dead' || m === 'win' || m === 'title') && !dualScroll(I.my * 700 * dt)) ov.scrollTop += I.my * 700 * dt;   // donde no hay nada que elegir, el izquierdo también
  if (m === 'book') { if (!dualScroll(I.my * 700 * dt)) ov.scrollTop += I.my * 700 * dt; if (I.tabL || I.tabR || I.navX) bookTurn(I.tabL || I.navX < 0 ? -1 : 1); else if (modeT > 0.25 && (I.atkP || I.dodgeP || I.chgP || I.startP)) closeBook(); }
  else if ((m === 'pick' || m === 'pause') && I.chgP) openBook();
  else if (m === 'town') townUpdate(dt);
  else if (m === 'intro') introUpdate(dt);
  else if (m === 'play') { M.time += dt; if (I.startP) setMode('pause'); else update(dt); }
  else if (m === 'pick') {
    let moved = false;
    if (I.navX || I.navY) { const n = navPick([...ovBody.querySelectorAll('.card')], pickSel, I.navX, I.navY); if (n >= 0 && n !== pickSel) { pickSel = n; moved = true; } }
    if (moved) { ovBody.querySelectorAll('.card').forEach((c, i) => { c.classList.toggle('sel', i === pickSel); if (i === pickSel) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); sfx('tick', 0.25); }
    if (I.atkP) choosePick(pickSel);
    if (I.backP) rerollPick();
  } else if (m === 'forge' || m === 'shop') listInput();
  else if (m === 'title') titleInput();
  else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  if (!introDraw()) render();
  renderHud(); tipTick(dt);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Tras «Nueva partida» la página se recarga con la partida borrada y entra directa a la historia
try { if (sessionStorage.getItem('kiteo.fresh')) { sessionStorage.removeItem('kiteo.fresh'); playIntro(); } } catch (e) { /* sin almacenamiento */ }
// Acceso para pruebas
window.__kiteo = { hush, cam: () => cam, view: () => view, audio: () => ({ sfx: Object.keys(SFX).length, mus: musNow, playing: !!(musNow && MUS[musNow] && !MUS[musNow].paused), t: musNow && MUS[musNow] ? MUS[musNow].currentTime : 0, plays: Object.keys(SFXT) }), place: openPlace, town: openTown, intro: playIntro, ending: playEnding, zone: z => playZone(z), travel: i => travelTo(i), get state() { return S; }, get meta() { return M; }, enter: nextWave, dbg: { talkQueen, talkKing, talkPick, get roomBg() { return ROOM_BG; }, get nav() { return NAV; }, villageCalm, assaultCalm, enterCamp, openDoors, bossDoor, campDoor, dropCoins, placeChests, spawn, godsOpen,godsOpenN, lootGod, pieceOptions, pieceCands, pieceCard, techOk, techNeeds, mechsOf, pideOf, NEEDS, NEEDS_MORE, MECH, SOLO, roomCleared, missionWin, tip, tipTick, startRun, missionOf, get tipNow() { return tipNow; }, get tipQ() { return tipQ.slice(); }, get lastDev() { return lastDev; }, set lastDev(v) { lastDev = v; }, GOD_UNLOCK, kill, shop: openShop, book: openBook, doorScreen, critChance, petN, doomK, temperMax, th, shot, barrelFire, chargePayoff, addDoom, freeze, hit, sleep, light }, gunName, SPR, ENSEMBLES, LEGENDS, ROOM_KINDS, NAV, set forceRoom(k) { ROOM_FORCE = k; }, T, PIECES, DUOS, PLANS, TECHS, GODS, PARTS, RESO, TYPES, WORLDS, RPW };
// ───────────────────────── Dos pantallas (AYN Thor y otras como una DS) ─────────────────────────
// Si la app de Android ha abierto una segunda pantalla (puente KiteoDual), el juego se queda arriba y abajo va todo lo demás:
// los menús, las cartas, la tienda, la forja, el tablón y el recetario (su HTML tal cual, que panel.html pinta con los mismos
// estilos) y, mientras juegas, tu build completa con la vida y el oro. Las conversaciones siguen arriba, con el juego.
// El menú de arriba no se borra: se queda invisible y del tamaño exacto de la pantalla de abajo, para que el mando lo recorra
// igual que se ve abajo y para que un toque abajo («el elemento número i») se pulse aquí en el mismo sitio.
const DUAL = { tap: false, top: '', on: false, sent: '', canv: '', hud: '', t: 0 };
const dualTop = (() => { const d = document.createElement('div'); d.id = 'dualTop'; d.hidden = true; document.getElementById('app').appendChild(d); return d; })();
function dualSend(o) { try { window.KiteoDual.toPanel(JSON.stringify(o)); } catch (e) { /* sin segunda pantalla */ } }
function dualOn() {
  let has = false; try { has = !!(window.KiteoDual && window.KiteoDual.has()); } catch (e) { }
  DUAL.on = has; document.body.classList.toggle('dual', has); DUAL.sent = ''; DUAL.hud = ''; DUAL.canv = '';
  if (has) dualSync();
}
function dualOff() { DUAL.on = false; document.body.classList.remove('dual'); dualTop.hidden = true; }
// Lo que pide la pantalla de abajo. Un toque abajo se pulsa aquí marcado como dedo (DUAL.tap): en el mapa, el primer toque señala y el segundo acepta
window.dualRecv = function (s) {
  const m = JSON.parse(s);
  if (m.type === 'size') { document.documentElement.style.setProperty('--pw', m.w + 'px'); document.documentElement.style.setProperty('--ph', m.h + 'px'); DUAL.sent = ''; dualSync(); }
  else if (m.type === 'ready') { if (!DUAL.on) dualOn(); DUAL.sent = ''; DUAL.hud = ''; DUAL.canv = ''; dualSync(); }
  else if (m.type === 'choice') talkPick(m.i);
  else if (m.type === 'click') { const el = ovBody.querySelectorAll('*')[m.i]; if (el) { audioInit(); if (dualMark(el)) return; DUAL.tap = true; try { el.click(); } finally { DUAL.tap = false; } } }
};
// Lo que tiene descripción (cartas, piezas, ramas del árbol, lo que vende la tienda): el primer toque lo señala y arriba se lee
// entero; el segundo lo elige. Las pestañas, «Volver» y los demás botones van al primer toque.
const dualTwoTap = it => it.classList.contains('card') || /^(p|t|buy):/.test(it.dataset.act || '');
function dualMark(el) {
  const it = el.closest('.card, .fi'); if (!it || !ovBody.contains(it) || it.classList.contains('sel') || !dualTwoTap(it)) return false;
  if (it.classList.contains('card')) { pickSel = +it.dataset.i; ovBody.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === pickSel)); }
  else { const els = [...ovBody.querySelectorAll('.fi')]; listSel = els.indexOf(it); els.forEach((x, i) => x.classList.toggle('sel', i === listSel)); }
  sfx('tick', 0.25); return true;
}
// Arriba, mientras hay un menú abajo: lo que se lee. El texto del menú (títulos, explicaciones, la build en la pausa) y, al lado,
// lo señalado en grande: la carta o la pieza con su glosario, o en el tablón el mapa grande con el encargo señalado.
function dualDetail(urls) {
  const noIds = h => h.replace(/\sid="[^"]*"/g, '');   // copias sin id: que $('...') siga encontrando los botones de verdad
  const c = ovBody.cloneNode(true);
  c.querySelectorAll('button, .fi, .tabs, .cards, .kwrap, canvas').forEach(e => e.remove());
  c.querySelectorAll('section, .gunwrap, .forge').forEach(e => { if (!e.querySelector('p, li, blockquote')) e.remove(); });
  let focus = '', side = '';
  const kw = ovBody.querySelector('.kwrap');
  if (kw) {
    const w = kw.querySelector('.kworld').cloneNode(true), cv = w.querySelector('canvas');
    if (cv) { const im = document.createElement('img'); im.src = urls[0] || ''; im.className = 'dmap'; cv.replaceWith(im); }
    const info = kw.querySelector('.kinfo').cloneNode(true); info.querySelectorAll('button').forEach(e => e.remove());
    const head = kw.querySelector('.khead'), leg = kw.querySelector('.klegend');
    focus = `<div class="dt-map">${w.outerHTML}</div>`;
    side = `${info.outerHTML}${head ? head.outerHTML : ''}${leg ? leg.outerHTML : ''}`;   // primero el encargo señalado
  } else {
    const sel = ovBody.querySelector('.card.sel, .fi.sel');
    if (sel && dualTwoTap(sel)) focus = `<div class="dt-focus">${sel.classList.contains('card') ? `<div class="cards">${sel.outerHTML}</div>` : sel.outerHTML}</div>`;
  }
  const two = ovBody.querySelector('.card, .fi[data-act^="p:"], .fi[data-act^="t:"], .fi[data-act^="buy:"], .fi.mk');
  const hint = two ? `<p class="dt-hint">Abajo: un toque señala y otro elige · o con la cruceta y A</p>` : '';
  if (kw) c.querySelectorAll('p.fine, .kingdom > p').forEach(e => e.remove());   // en el tablón, lo que importa es el encargo señalado
  return noIds(`<div class="dt${focus ? '' : ' solo'}${kw ? ' map' : ''}"><div class="dt-text">${kw ? c.innerHTML.replace(/<h1>.*?<\/h1>/, '') + side : c.innerHTML}</div>${focus}</div>${hint}`);
}
// Los sticks desplazan lo que se lee: con dos pantallas, el texto de arriba
function dualScroll(dy) { const t = DUAL.on && dualTop.querySelector('.dt-text'); if (t) { t.scrollTop += dy; return true; } return false; }
// Manda el menú (si hay) cuando cambia; los lienzos (el mapa del tablón) como imagen
function dualSync() {
  if (!DUAL.on) return;
  // Una conversación esperando respuesta: abajo, lo último que te han dicho y las respuestas como botones
  const d = S.dialog;
  if (d && d.choices && d.i >= d.lines.length) {
    const L = d.lines[d.lines.length - 1], who = L && L.who && typeof L.who === 'string' && L.who !== 'alec' ? L.who : '';
    const html = `<div class="dchoice">${L ? `<p class="said">${L.text}</p>` : ''}<p class="eyebrow">Alec responde</p>` +
      d.choices.map((c, i) => `<button class="opt${i === d.sel ? ' sel' : ''}" data-ch="${i}">${c.label}</button>`).join('') + '</div>';
    dualTop.hidden = true;
    const key = 'dlg|' + html; if (key !== DUAL.sent) { DUAL.sent = key; dualSend({ type: 'ov', show: true, html, cls: 'dlg', canv: [] }); }
    return;
  }
  const ovEl = $('overlay'), show = !ovEl.hidden && S.mode !== 'play' && S.mode !== 'town' && S.mode !== 'intro';
  dualTop.hidden = !show;
  const html = show ? ovBody.innerHTML : '', key = show + '|' + ovBody.className + '|' + html;
  let canv = '';
  const cs = show ? [...ovBody.querySelectorAll('canvas')] : [];
  const urls = cs.map(c => { try { return c.toDataURL(); } catch (e) { return ''; } });
  canv = urls.join('|');
  if (show) { const t = dualDetail(urls); if (t !== DUAL.top) {
    const o = dualTop.querySelector('.dt-text'), st = o ? o.scrollTop : 0, same = S.mode + '|' + (ovBody.querySelector('h1') || {}).textContent;
    DUAL.top = t; dualTop.innerHTML = t; const n = dualTop.querySelector('.dt-text'); if (n && same === DUAL.topKey) n.scrollTop = st; DUAL.topKey = same; } }
  if (key !== DUAL.sent) { DUAL.sent = key; DUAL.canv = canv; dualSend({ type: 'ov', show, html, cls: ovBody.className, canv: urls }); }
  else if (show && canv !== DUAL.canv) { DUAL.canv = canv; dualSend({ type: 'ov', show, canv: urls }); }
}
// La build de la partida, con las ranuras libres juntas en una línea en vez de una caja cada una
function dualBuild() {
  const free = SLOT_KEYS.filter(k => !S.build[k]).map(k => SLOTS[k]);
  const rows = buildHtml(true).split('</li>').filter(r => r && !r.includes('Ranura libre')).map(r => r + '</li>').join('');
  return `${free.length ? `<p class="free">Libre: ${free.join(' · ')}</p>` : ''}<ul class="build full">${rows}</ul>`;
}
// Sin menú: la build, la vida y el oro (en partida), o el reino y lo que llevas ganado (en la ciudad)
function dualHud() {
  if (!DUAL.on) return;
  let h = '';
  if (S.mode === 'play' && S.mission) {
    const p = S.p, ms = S.mission;
    h = `<p class="where">${ms.zone} · ${ms.name}</p><div class="dh"><b class="life">${Math.ceil(p.hp)} / ${p.maxHp} de vida</b><b class="coin">${Math.floor(p.gold)} de oro</b><span>${S.soulsRun || 0} almas · ${S.ironRun || 0} de Hierro</span>${ms.type === 'assault' ? `<span>Nivel ${S.xpLvl + 1} · ${S.xp}/${xpNeed(S.xpLvl)} de experiencia</span>` : ''}</div>
      <h2>${gunName(S.gun)}</h2>${dualBuild()}`;
  } else if (S.mode === 'town' || S.mode === 'play') {
    const K = kingdomNow();
    h = `<p class="where">${K.title}</p><div class="dh"><b>${M.souls} almas</b><b>${M.iron} de Hierro Místico</b></div><h2>${gunName(S.gun)}</h2>
      <ul class="build full">${GSLOT_KEYS.map(k => S.gun[k] && PART[S.gun[k]] ? `<li><em>${GSLOTS ? GSLOTS[k] : k}</em><b>${PART[S.gun[k]].name}</b><span>${PART[S.gun[k]].desc}</span></li>` : '').join('')}</ul>`;
  } else h = '<p class="logo">Alec, el sin dios</p>';
  if (h !== DUAL.hud) { DUAL.hud = h; dualSend({ type: 'hud', html: h }); }
}
new MutationObserver(() => { if (DUAL.on) requestAnimationFrame(dualSync); }).observe(ovBody, { subtree: true, childList: true, attributes: true, characterData: true });
new MutationObserver(() => { if (DUAL.on) requestAnimationFrame(dualSync); }).observe($('overlay'), { attributes: true, attributeFilter: ['hidden'] });
setInterval(() => { if (DUAL.on) { dualHud(); dualSync(); } }, 300);
setInterval(() => { if (DUAL.on && S.dialog && S.dialog.choices) dualSync(); }, 80);   // la respuesta señalada con el mando, al momento   // la vida y el oro cambian sin que cambie ningún menú
window.dualOn = dualOn; window.dualOff = dualOff;   // la app los llama al aparecer o desaparecer la segunda pantalla
dualOn();
// Fin del bloque que envuelve todo el juego (se abre en 00_tuning.js)
})();
