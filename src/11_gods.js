// ───────────────────────── Deidades ─────────────────────────
// El herrero no tiene dios. En las salas de deidad espera su elegido con un arma bendecida:
// lo matas, la desmontas y te quedas con una técnica. Cada deidad tiene algo suyo que se acumula.
const GODS = {
  dragon: { title: 'La Que Duerme Sobre Oro', theme: 'Dragones', weapon: 'Colmillo de la Durmiente', mat: 'Escama', color: '#ff6a3c',
    key: 'Ascuas: se clavan en el enemigo y queman todas a la vez. Oro: cuanto más llevas, más daño haces.', lines: {
    enter: ['entreabre un ojo. Su elegido guarda esta sala.', 'huele a intruso entre sus monedas.'],
    champ: ['cuenta su oro para calmarse. Le falta una pieza.', 'resopla humo. Ha perdido un elegido.'],
    take:  ['te apunta en su lista de deudores.', 'no olvida quién le roba.'], master: ['ruge: nadie le había robado tanto.'] } },
  stone: { title: 'El Paciente Bajo la Montaña', theme: 'Minerales', weapon: 'Pico de Veta Madre', mat: 'Mena', color: '#6fe3d0',
    key: 'Cristales: se quedan en la sala y repiten lo que haces.', lines: {
    enter: ['tarda un siglo en mirarte. Ya te está mirando.', 'cruje. Su elegido despierta.'],
    champ: ['no dice nada. En algún lugar se agrieta una montaña.', 'guarda silencio. Es un mal silencio.'],
    take:  ['toma nota. Tiene tiempo.', 'observa cómo tallas lo que era suyo.'], master: ['pronuncia tu nombre, muy despacio.'] } },
  venom: { title: 'La Boticaria Sin Rostro', theme: 'Veneno', weapon: 'Aguijón de la Boticaria', mat: 'Glándula', color: '#9be04a',
    key: 'Veneno: no caduca, se acumula y se contagia.', lines: {
    enter: ['anota tu peso y tu altura.', 'prepara un frasco con tu nombre.'],
    champ: ['pide que guarden una muestra del cadáver.', 'tacha un nombre de su cuaderno, sin pena.'],
    take:  ['siente curiosidad por lo que harás con eso.', 'apunta: el sujeto aprende rápido.'], master: ['te propone, encantada, un experimento.'] } },
  feast: { title: 'El Anfitrión del Banquete Eterno', theme: 'Manjares', weapon: 'Trinchante del Anfitrión', mat: 'Especia', color: '#ff8fb3',
    key: 'Reserva: la vida que te sobra al curarte se guarda como escudo, y luego la gastas.', lines: {
    enter: ['te guarda un sitio en la mesa. No dice en qué plato.', 'afila los cubiertos y sonríe.'],
    champ: ['lamenta el desperdicio y pide otra ronda.', 'brinda por el difunto. Estaba tierno.'],
    take:  ['aplaude: ¡por fin alguien con apetito!', 'te ofrece repetir.'], master: ['brinda por ti, y ya van tres copas.'] } },
  orc: { title: 'El Primer Puño', theme: 'Orcos', weapon: 'Hacha del Primer Puño', mat: 'Hueso', color: '#d9a066',
    key: 'Furia: sube al golpear y al recibir golpes, y lo potencia todo.', lines: {
    enter: ['escupe al suelo. Su elegido quiere tu cabeza.', 'hace sonar los tambores.'],
    champ: ['se ríe a carcajadas. Buen golpe.', 'golpea la mesa: ¡otro!'],
    take:  ['dice que robar a un muerto es de listos.', 'gruñe algo parecido a un elogio.'], master: ['te reta a duelo. Lo dice en serio.'] } },
  time: { title: 'El Relojero de la Última Hora', theme: 'Tiempo', weapon: 'Manecilla del Relojero', mat: 'Arena', color: '#7fa8ff',
    key: 'Ecos: lo que haces se repite poco después. Y los enemigos lentos reciben más daño.', lines: {
    enter: ['da cuerda a su elegido. Tic.', 'ya ha visto cómo acaba esta sala. No te lo dirá.'],
    champ: ['adelanta su reloj un minuto, molesto.', 'anota la hora de la muerte. Llega tarde.'],
    take:  ['murmura que eso ya lo habías robado antes.', 'te presta un segundo. Lo querrá de vuelta.'], master: ['detiene su reloj para mirarte bien.'] } },
  shade: { title: 'La Que Cuenta los Muertos', theme: 'Sombras', weapon: 'Guadaña de la Contadora', mat: 'Ceniza', color: '#9d8cff',
    key: 'Sombras: los enemigos que matas se levantan y pelean por ti.', lines: {
    enter: ['empieza a contar. Tú eres el siguiente número.', 'envía a su elegido con un hueco reservado para ti.'],
    champ: ['pierde la cuenta por primera vez en mil años.', 'suma uno. No era el que esperaba.'],
    take:  ['ve cómo sus muertos te siguen a ti.', 'te observa: los muertos no deberían obedecerte.'], master: ['deja de contar y se pone en pie.'] } },
  storm: { title: 'La Voz Entre las Nubes', theme: 'Tormenta', weapon: 'Lanza de la Voz', mat: 'Chispa', color: '#ffe14d',
    key: 'Agujas: se clavan sin hacer nada hasta que las descargas; entonces saltan rayos.', lines: {
    enter: ['truena a lo lejos. Su elegido ya está aquí.', 'carga el aire. Se te eriza el pelo.'],
    champ: ['se queda sin voz un instante.', 'descarga su rabia contra una montaña.'],
    take:  ['te avisa: los rayos no tienen dueño.', 'ríe. Le gusta el ruido que haces.'], master: ['grita tu nombre, y se oye en los cuatro mundos.'] } },
  tide: { title: 'El Ahogado Bajo la Ola', theme: 'Mareas', weapon: 'Ancla del Ahogado', mat: 'Sal', color: '#4fb4d8',
    key: 'Empujones: lanzas a los enemigos contra los muros, y el choque les hace daño. Los Empapados lo sufren más.', lines: {
    enter: ['sube un palmo el agua de la sala.', 'arrastra algo pesado por el fondo. Viene hacia aquí.'],
    champ: ['suelta una burbuja. Tarda en llegar arriba.', 'se lleva a su elegido mar adentro, sin prisa.'],
    take:  ['te deja sal en los labios.', 'dice que todo lo que flota acaba volviendo.'], master: ['retira el mar entero para mirarte.'] } },
  luck: { title: 'La Dama de los Dados', theme: 'Fortuna', weapon: 'Estoque de la Dama', mat: 'Taba', color: '#f2ead0',
    key: 'Críticos y azar: dados, monedas y rachas. Si sale bien, sale muy bien.', lines: {
    enter: ['apuesta por su elegido. Paga poco: lo ve claro.', 'baraja sin mirar las cartas.'],
    champ: ['pierde la apuesta y sonríe igual.', 'paga su deuda con una moneda de dos caras.'],
    take:  ['te guiña un ojo. O le ha entrado algo.', 'sube la apuesta.'], master: ['te ofrece los dados. Están calientes.'] } },
  wood: { title: 'La Madre de Espinas', theme: 'Bosque', weapon: 'Hoz de la Madre', mat: 'Semilla', color: '#3fbf73',
    key: 'Semillas: brotan en el enemigo y lo dejan clavado en el sitio. Zarzas: cierran el paso.', lines: {
    enter: ['hace crecer musgo en tus botas.', 'deja que su elegido eche raíces en esta sala.'],
    champ: ['lo cubre de hojas. Mañana será un árbol.', 'no llora: abona.'],
    take:  ['te llama mala hierba, con cariño.', 'siente cómo podas lo que era suyo.'], master: ['florece en pleno invierno, solo por verte.'] } },
  frost: { title: 'La Dama Quieta', theme: 'Hielo', weapon: 'Punzón de la Dama', mat: 'Carámbano', color: '#bfe9ff',
    key: 'Escarcha: se acumula y frena. Con 5, el enemigo queda Congelado y puedes romperlo.', lines: {
    enter: ['no se mueve. Nunca se ha movido.', 'baja la temperatura de la sala. Ves tu aliento.'],
    champ: ['no parpadea. Guarda al muerto bajo el hielo, intacto.', 'deja que nieve sobre su elegido.'],
    take:  ['te mira hacerlo. Solo te mira.', 'tiene todo el tiempo del mundo para cobrártelo.'], master: ['da un paso. El primero en mil inviernos.'] } },
  blood: { title: 'El Acreedor Rojo', theme: 'Sangre', weapon: 'Lanceta del Acreedor', mat: 'Coágulo', color: '#d6334a',
    key: 'Heridas: sangran más cuanta menos vida tengas. Pagos: das vida para pegar más y la recuperas matando.', lines: {
    enter: ['abre su libro de cuentas por tu nombre.', 'te presta a su elegido. Con intereses.'],
    champ: ['apunta la pérdida. Te la cobrará.', 'lame la pluma y tacha una línea.'],
    take:  ['sonríe: ahora tú también le debes.', 'te fía. Eso es peor.'], master: ['cierra el libro: ya eres su mejor cliente.'] } },
  end: { title: 'La Última Página', theme: 'Final', weapon: 'Pluma de la Última Página', mat: 'Tinta', color: '#9fb0c8',
    key: 'Sentencias: marcas a un enemigo y, al acabar el plazo, recibe de golpe parte del daño que le hiciste.', lines: {
    enter: ['pasa una hoja. En la siguiente estás tú.', 'ya sabe cómo acaba esta sala. Lo ha leído.'],
    champ: ['corrige una errata: ese no tenía que morir hoy.', 'cierra un capítulo antes de tiempo.'],
    take:  ['te deja escribir una línea. Solo una.', 'anota al margen: imprevisto.'], master: ['te tiende la pluma. Pesa.'] } },
  light: { title: 'El Ojo Sin Párpado', theme: 'Luz', weapon: 'Lanza del Ojo', mat: 'Lucero', color: '#ffb84d',
    key: 'Iluminados: parte del daño que recibe uno lo reciben también los demás Iluminados.', lines: {
    enter: ['te ve. Te ha visto siempre.', 'enfoca a su elegido. La sala se queda sin sombras.'],
    champ: ['no cierra el ojo. No puede.', 'mira el cadáver hasta que deja de dar sombra.'],
    take:  ['te sigue con la mirada mientras lo robas.', 'ya sabe dónde vas a guardarlo.'], master: ['parpadea. El mundo se apaga un instante.'] } },
  dream: { title: 'El Que Bosteza', theme: 'Sueño', weapon: 'Rueca del Que Bosteza', mat: 'Legaña', color: '#c9a0dc',
    key: 'Dormidos: no se mueven ni atacan hasta que algo los despierta, y ese golpe hace mucho más daño.', lines: {
    enter: ['se estira. Su elegido hace la guardia por él.', 'bosteza, y se te cierran los ojos un momento.'],
    champ: ['se da la vuelta en la cama.', 'murmura algo dormido. Era un nombre.'],
    take:  ['te deja hacer. Mañana lo habrá olvidado.', 'sueña que le roban. No se despierta.'], master: ['abre un ojo. Solo uno.'] } },
  void: { title: 'La Boca Sin Fondo', theme: 'Vacío', weapon: 'Anzuelo de la Boca', mat: 'Hueco', color: '#c44fd8',
    key: 'Pozos: atraen a los enemigos a un punto. Cuanto más juntos están, más daño reciben.', lines: {
    enter: ['traga saliva. Se oye en toda la sala.', 'inclina el suelo hacia su elegido.'],
    champ: ['se lo traga sin masticar.', 'eructa. Huele a nada.'],
    take:  ['abre un poco más la boca.', 'no pide que se lo devuelvas. Espera a que caigas.'], master: ['por primera vez, se queda con hambre.'] } },
  mirror: { title: 'La Que Devuelve la Mirada', theme: 'Espejos', weapon: 'Daga de Azogue', mat: 'Azogue', color: '#cfd6de',
    key: 'Reflejo: una copia tuya se pone al otro lado del enemigo y repite lo que haces.', lines: {
    enter: ['te mira desde un charco. Llevas tu cara.', 'pone a su elegido frente a un espejo. Salen dos.'],
    champ: ['rompe un espejo. Siete años, dice.', 'busca su reflejo en el cadáver. No lo encuentra.'],
    take:  ['te imita mientras lo robas.', 'sonríe con tu boca.'], master: ['ya no sabe cuál de los dos eres tú.'] } },
  beast: { title: 'La Madre de Colmillos', theme: 'Bestias', weapon: 'Colmillo de la Madre', mat: 'Colmillo', color: '#c8743a',
    key: 'Sabueso: pelea a tu lado, muerde a quien disparas y obedece a tu disparo cargado y a tu esquive.', lines: {
    enter: ['olfatea el aire. Hueles a hierro.', 'suelta a su elegido sin correa.'],
    champ: ['aúlla una vez, larga.', 'lame la herida de su cachorro. Ya no sangra.'],
    take:  ['te enseña los dientes. No es una sonrisa.', 'deja que el sabueso te huela la mano.'], master: ['te reconoce como de la camada.'] } },
  forge: { title: 'El Yunque que Canta', theme: 'Forja', weapon: 'Martillo del Yunque', mat: 'Escoria', color: '#e07a5f',
    key: 'Temple: tu arma se endurece mientras disparas y cada punto da más daño. Si te golpean, pierdes parte.', lines: {
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
  { id: 'dragon_basic',   god: 'dragon', slot: 'basic',   name: 'Colmillo al rojo', desc: l => `Cada disparo clava ${pl(l, 'Ascua')}. Se acumulan hasta 8 y queman todas a la vez.` },
  { id: 'dragon_charge',  god: 'dragon', slot: 'charge',  name: 'Aliento',          desc: l => `Tu disparo cargado clava ${1 + l} Ascuas y hace estallar todas las que ya tenga el enemigo: ${35 + 10 * (l - 1)}% de daño por Ascua, en área. Con la Recámara de rayo, se abre en cono.` },
  { id: 'dragon_dodge',   god: 'dragon', slot: 'dodge',   name: 'Vuelo',            desc: l => `Tu esquive es un salto largo que pasa por encima de los muros. Al aterrizar, explota: ${150 * l}% de daño.` },
  { id: 'dragon_passive', god: 'dragon', slot: 'passive', name: 'Tesoro',           desc: l => `Los enemigos que mueren con Ascuas sueltan ${pl(l, 'moneda')}. Haces un ${l}% más de daño por cada 10 de oro que lleves, hasta +${30 + 10 * l}%.` },
  // Minerales
  { id: 'stone_basic',    god: 'stone',  slot: 'basic',   name: 'Esquirla',         desc: l => `${Math.max(1, 4 - l) > 1 ? 'Cada ' + Math.max(1, 4 - l) + ' disparos dejan' : 'Cada disparo deja'} un Cristal junto al enemigo, que dura 9 s.` },
  { id: 'stone_charge',   god: 'stone',  slot: 'charge',  name: 'Prisma',           desc: l => `Cuando disparas el cargado, cada Cristal lanza también un rayo al enemigo más cercano: ${40 * l}% del daño, con todos los efectos de tu cargado.` },
  { id: 'stone_dodge',    god: 'stone',  slot: 'dodge',   name: 'Geoda',            desc: l => `Tu esquive deja un Cristal donde estabas. Si atraviesas un Cristal, revienta: ${120 * l}% de daño en área.` },
  { id: 'stone_passive',  god: 'stone',  slot: 'passive', name: 'Veta',             desc: l => `El Cristal más cercano al objetivo repite cada disparo tuyo, al ${30 * l}% de daño y con tus efectos de disparo.` },
  // Veneno
  { id: 'venom_basic',    god: 'venom',  slot: 'basic',   name: 'Dardo',            desc: l => `Cada disparo aplica ${l} de Veneno. Se acumula hasta 30 y no caduca.` },
  { id: 'venom_charge',   god: 'venom',  slot: 'charge',  name: 'Purga',            desc: l => `Tu disparo cargado convierte el Veneno en daño al instante: ${15 * l}% por punto. El enemigo conserva la mitad y deja un charco tóxico.` },
  { id: 'venom_dodge',    god: 'venom',  slot: 'dodge',   name: 'Rastro',           desc: l => `Tu esquive deja un rastro tóxico durante 5 s que aplica ${l} de Veneno por pulso.` },
  { id: 'venom_passive',  god: 'venom',  slot: 'passive', name: 'Plaga',            desc: l => `Cuando muere un enemigo envenenado, todo su Veneno pasa a los ${1 + l} enemigos más cercanos.` },
  // Manjares
  { id: 'feast_basic',    god: 'feast',  slot: 'basic',   name: 'Bocado',           desc: l => `Cada disparo te cura ${(0.5 * l).toFixed(1)}. Lo que sobra con la vida llena se guarda como Reserva, hasta 30.` },
  { id: 'feast_charge',   god: 'feast',  slot: 'charge',  name: 'Banquete',         desc: l => `Tu disparo cargado gasta toda tu Reserva y hace un ${4 * l}% más de daño por cada punto. Cada enemigo que mata te cura 4.` },
  { id: 'feast_dodge',    god: 'feast',  slot: 'dodge',   name: 'Brindis',          desc: l => `Si atraviesas a un enemigo con el esquive, le haces ${60 * l}% de daño y te curas ${3 * l}.` },
  { id: 'feast_passive',  god: 'feast',  slot: 'passive', name: 'Glotón',           desc: l => `Haces un ${l}% más de daño por cada punto de Reserva.` },
  // Orcos
  { id: 'orc_basic',      god: 'orc',    slot: 'basic',   name: 'Tambor de guerra', desc: l => `Ganas Furia al golpear y al recibir golpes. Cuanta más Furia, más daño: hasta +${40 * l}% con la Furia llena.` },
  { id: 'orc_charge',     god: 'orc',    slot: 'charge',  name: 'Grito de guerra',  desc: l => `Tu disparo cargado gasta toda tu Furia en un grito a tu alrededor que empuja, aturde y hace hasta ${50 + 200 * l}% de daño. Cuanta más Furia, más grande.` },
  { id: 'orc_dodge',      god: 'orc',    slot: 'dodge',   name: 'Embestida',        desc: l => `Si atraviesas a un enemigo con el esquive, le haces ${100 * l}% de daño, lo aturdes y ganas 15 de Furia.` },
  { id: 'orc_passive',    god: 'orc',    slot: 'passive', name: 'Sed de sangre',    desc: l => `Con la Furia llena disparas un ${30 * l}% más rápido y cada baja te recarga el esquive.` },
  // Tiempo
  { id: 'time_basic',     god: 'time',   slot: 'basic',   name: 'Segundero',        desc: l => `Cada disparo deja un eco: 1,5 s después vuelve a golpear solo, al ${50 + 15 * (l - 1)}% de daño y con todos sus efectos.` },
  { id: 'time_charge',    god: 'time',   slot: 'charge',  name: 'Rebobinar',        desc: l => `Tu disparo cargado se repite solo 2 s después, desde donde lo lanzaste, al ${60 + 15 * (l - 1)}% de daño.` },
  { id: 'time_dodge',     god: 'time',   slot: 'dodge',   name: 'Hora muerta',      desc: l => `Tu esquive deja una burbuja durante ${2 + l} s. Dentro, los enemigos y sus proyectiles van al 30% de velocidad.` },
  { id: 'time_passive',   god: 'time',   slot: 'passive', name: 'Reloj de arena',   desc: l => `Los enemigos ralentizados o aturdidos reciben un ${30 * l}% más de todo el daño.` },
  // Sombras
  { id: 'shade_basic',    god: 'shade',  slot: 'basic',   name: 'Marca de tumba',   desc: l => `Tus disparos marcan al enemigo. Si muere marcado, se levanta como Sombra y pelea por ti 9 s. Hasta ${2 + l} Sombras a la vez.` },
  { id: 'shade_charge',   god: 'shade',  slot: 'charge',  name: 'Orden',            desc: l => `Tu disparo cargado lanza a todas tus Sombras contra el objetivo y las hace estallar: ${150 * l}% de daño en área cada una.` },
  { id: 'shade_dodge',    god: 'shade',  slot: 'dodge',   name: 'Relevo',           desc: l => `Tu esquive deja una Sombra donde estabas durante ${3 + l} s.` },
  { id: 'shade_passive',  god: 'shade',  slot: 'passive', name: 'Séquito',          desc: l => `Haces un ${8 * l}% más de daño por cada Sombra viva. Tus Sombras aplican tus efectos de disparo al golpear.` },
  // Tormenta
  { id: 'storm_basic',    god: 'storm',  slot: 'basic',   name: 'Aguja estática',   desc: l => `Cada disparo clava ${pl(l, 'Aguja')}, hasta 6 por enemigo. Solas no hacen nada: hay que descargarlas.` },
  { id: 'storm_charge',   god: 'storm',  slot: 'charge',  name: 'Sobretensión',     desc: l => `Tu disparo cargado descarga las Agujas de los enemigos que alcanza: cada una hace ${70 + 20 * (l - 1)}% de daño y lanza un rayo a otro enemigo.` },
  { id: 'storm_dodge',    god: 'storm',  slot: 'dodge',   name: 'Paso relámpago',   desc: l => `Si atraviesas a un enemigo con el esquive, descargas sus Agujas (${80 + 20 * (l - 1)}% cada una). Si no tiene, le clavas 2.` },
  { id: 'storm_passive',  god: 'storm',  slot: 'passive', name: 'Conductor',        desc: l => `Los rayos de una descarga clavan ${pl(l, 'Aguja')} a los enemigos que alcanzan.` },
  // Mareas
  { id: 'tide_basic',     god: 'tide',   slot: 'basic',   name: 'Oleaje',           desc: l => `Cada disparo empuja al enemigo y lo deja Empapado 4 s. Los golpes contra el muro hacen un ${50 * l}% más de daño.` },
  { id: 'tide_charge',    god: 'tide',   slot: 'charge',  name: 'Maremoto',         desc: l => `Tu disparo cargado suelta además una ola a tu alrededor: ${50 * l}% de daño, empapa y lanza lejos a todos. Los que chocan contra un muro reciben el golpe.` },
  { id: 'tide_dodge',     god: 'tide',   slot: 'dodge',   name: 'Corriente',        desc: l => `Tu esquive deja una corriente durante ${3 + l} s que empapa a los enemigos y los arrastra en la dirección en que esquivaste.` },
  { id: 'tide_passive',   god: 'tide',   slot: 'passive', name: 'Marea alta',       desc: l => `Los Empapados reciben un ${15 * l}% más de todo el daño, y tus empujones los lanzan un 50% más lejos.` },
  // Fortuna
  { id: 'luck_basic',     god: 'luck',   slot: 'basic',   name: 'Dado cargado',     desc: l => `Cada disparo tiene un ${10 + 10 * l}% de ser crítico (250% de daño). Cada disparo que no es crítico sube un 5% la probabilidad, hasta que sale uno.` },
  { id: 'luck_charge',    god: 'luck',   slot: 'charge',  name: 'Todo al rojo',     desc: l => `Tu disparo cargado tira ${l > 1 ? l + ' dados y se queda el mejor' : 'un dado'}: con un 1 hace el 60% del daño; con un 6, el triple.` },
  { id: 'luck_dodge',     god: 'luck',   slot: 'dodge',   name: 'Cara o cruz',      desc: l => `Al esquivar lanzas una moneda. Cara: no gastas el esquive. Cruz: la moneda se queda donde estabas y revienta (${120 * l}% en área).` },
  { id: 'luck_passive',   god: 'luck',   slot: 'passive', name: 'Racha',            desc: l => `Cada crítico suma una Racha, hasta 5: +${6 * l}% de daño por Racha. Si te golpean, la pierdes.` },
  // Bosque
  { id: 'wood_basic',     god: 'wood',   slot: 'basic',   name: 'Semilla',          desc: l => `Cada disparo planta una Semilla. A la ${l >= 2 ? 'segunda' : 'tercera'} brotan Raíces: clavan al enemigo en el sitio 1,5 s y hacen ${80 * l}% de daño.` },
  { id: 'wood_charge',    god: 'wood',   slot: 'charge',  name: 'Zarzal',           desc: l => `Tu disparo cargado crea un zarzal de 5 s donde apuntas. Quien esté dentro va a la mitad de velocidad y recibe ${20 * l}% de daño por pulso.` },
  { id: 'wood_dodge',     god: 'wood',   slot: 'dodge',   name: 'Enredadera',       desc: l => `Tu esquive deja una enredadera durante 4 s. La primera vez que un enemigo la pisa, queda enraizado 1 s y recibe ${60 * l}% de daño.` },
  { id: 'wood_passive',   god: 'wood',   slot: 'passive', name: 'Savia',            desc: l => `Los enemigos enraizados o entre zarzas reciben un ${20 * l}% más de daño, y te curan ${l} al morir.` },
  // Hielo
  { id: 'frost_basic',    god: 'frost',  slot: 'basic',   name: 'Aliento helado',   desc: l => `Cada disparo pone ${l} de Escarcha. Cada punto frena un 12%; con 5, el enemigo queda Congelado 1,5 s.` },
  { id: 'frost_charge',   god: 'frost',  slot: 'charge',  name: 'Quebrar',          desc: l => `Tu disparo cargado rompe a los Congelados: ${150 * l}% de daño extra y esquirlas en área. A los demás les pone 3 de Escarcha.` },
  { id: 'frost_dodge',    god: 'frost',  slot: 'dodge',   name: 'Paso de hielo',    desc: l => `Tu esquive deja una placa de hielo durante 4 s. Pone ${l} de Escarcha por pulso a quien la pise.` },
  { id: 'frost_passive',  god: 'frost',  slot: 'passive', name: 'Cero absoluto',    desc: l => `Los Congelados reciben un ${25 * l}% más de daño. Si mueren congelados, ponen 2 de Escarcha a los enemigos cercanos.` },
  // Sangre
  { id: 'blood_basic',    god: 'blood',  slot: 'basic',   name: 'Herida abierta',   desc: l => `Cada disparo abre ${pl(l, 'Herida')}, hasta 6. Sangran cada medio segundo, y hasta el triple cuanta menos vida tengas tú.` },
  { id: 'blood_charge',   god: 'blood',  slot: 'charge',  name: 'Sangría',          desc: l => `Tu disparo cargado te cuesta el 10% de tu vida actual y hace un ${60 * l}% más de daño. Cada enemigo que mata te devuelve 5.` },
  { id: 'blood_dodge',    god: 'blood',  slot: 'dodge',   name: 'Transfusión',      desc: l => `Si atraviesas a un enemigo con el esquive, le haces ${60 * l}% de daño y te curas ${4 * l}.` },
  { id: 'blood_passive',  god: 'blood',  slot: 'passive', name: 'Deuda',            desc: l => `Con menos de la mitad de vida haces un ${20 * l}% más de daño. Además, el primer golpe mortal de cada sala te deja a 1 de vida.` },
  // Final
  { id: 'end_basic',      god: 'end',    slot: 'basic',   name: 'Sentencia',        desc: l => `Tu disparo pone una Sentencia de 5 s. Al acabar, el enemigo recibe de golpe el ${30 + 10 * l}% de todo el daño que le hiciste en ese tiempo.` },
  { id: 'end_charge',     god: 'end',    slot: 'charge',  name: 'Punto final',      desc: l => `Tu disparo cargado cumple al instante las Sentencias de los enemigos que alcanza, con un ${30 * l}% más.` },
  { id: 'end_dodge',      god: 'end',    slot: 'dodge',   name: 'Pasar página',     desc: l => `Al esquivar, las Sentencias de los enemigos cercanos se adelantan 2 s y te curas ${l} por cada una.` },
  { id: 'end_passive',    god: 'end',    slot: 'passive', name: 'Epitafio',         desc: l => `Si un enemigo muere antes de cumplirse su Sentencia, esta pasa al enemigo más cercano con todo lo acumulado${l > 1 ? ' y un ' + 15 * (l - 1) + '% más' : ''}.` },
  // Luz
  { id: 'light_basic',    god: 'light',  slot: 'basic',   name: 'Señalar',          desc: l => `Cada disparo Ilumina al enemigo 6 s. Cuando un Iluminado recibe daño, los demás Iluminados reciben el ${20 + 10 * l}%.` },
  { id: 'light_charge',   god: 'light',  slot: 'charge',  name: 'Destello',         desc: l => `Tu disparo cargado Ilumina a todos los que alcanza. Si ya estaban Iluminados, los ciega: quedan aturdidos 1 s y reciben un ${40 * l}% más.` },
  { id: 'light_dodge',    god: 'light',  slot: 'dodge',   name: 'Resplandor',       desc: l => `Al esquivar sueltas un destello donde estabas: Ilumina a los enemigos cercanos y les hace ${50 * l}% de daño.` },
  { id: 'light_passive',  god: 'light',  slot: 'passive', name: 'Sin sombra',       desc: l => `Haces un ${5 * l}% más de daño por cada enemigo Iluminado, hasta seis.` },
  // Sueño
  { id: 'dream_basic',    god: 'dream',  slot: 'basic',   name: 'Arrullo',          desc: l => `Uno de cada ${Math.max(2, 5 - l)} disparos Duerme al enemigo 3 s. El golpe que lo despierta hace un ${100 * l}% más de daño.` },
  { id: 'dream_charge',   god: 'dream',  slot: 'charge',  name: 'Pesadilla',        desc: l => `Tu disparo cargado no despierta a los Dormidos y les hace un ${80 * l}% más. A los despiertos los Duerme 2 s.` },
  { id: 'dream_dodge',    god: 'dream',  slot: 'dodge',   name: 'Polvo de sueño',   desc: l => `Tu esquive deja una nube durante ${2 + l} s. Duerme 2 s a cada enemigo que entre, una vez por enemigo.` },
  { id: 'dream_passive',  god: 'dream',  slot: 'passive', name: 'Sonámbulos',       desc: l => `El daño continuo (Ascuas, Veneno, Heridas) no despierta a los Dormidos y les hace un ${50 * l}% más.` },
  // Vacío
  { id: 'void_basic',     god: 'void',   slot: 'basic',   name: 'Gravedad',         desc: l => `Cada disparo atrae a los enemigos cercanos hacia el que recibe el impacto${l > 1 ? ', con más fuerza a cada nivel' : ''}. Así se amontonan.` },
  { id: 'void_charge',    god: 'void',   slot: 'charge',  name: 'Singularidad',     desc: l => `Tu disparo cargado abre un pozo de 2,5 s donde apuntas: atrae a todos al centro, hace ${25 * l}% de daño por pulso y al cerrarse estalla (${100 * l}%).` },
  { id: 'void_dodge',     god: 'void',   slot: 'dodge',   name: 'Hueco',            desc: l => `Tu esquive deja un pozo pequeño durante ${1 + l} s que atrae a los enemigos cercanos.` },
  { id: 'void_passive',   god: 'void',   slot: 'passive', name: 'Apiñados',         desc: l => `Cada enemigo recibe un ${8 * l}% más de daño por cada enemigo pegado a él, hasta cuatro.` },
  // Espejos
  { id: 'mirror_basic',   god: 'mirror', slot: 'basic',   name: 'Reflejo',          desc: l => `Un Reflejo tuyo se pone al otro lado de tu objetivo. Cuando disparas, él también dispara, al ${30 * l}% de daño y con tus efectos.` },
  { id: 'mirror_charge',  god: 'mirror', slot: 'charge',  name: 'Doble',            desc: l => `Tu Reflejo repite tu disparo cargado desde su lado, al ${40 + 15 * l}% de daño: el enemigo lo recibe por los dos lados.` },
  { id: 'mirror_dodge',   god: 'mirror', slot: 'dodge',   name: 'Engaño',           desc: l => `Al esquivar dejas una imagen tuya donde estabas. Los enemigos cercanos se quedan mirándola, aturdidos ${(0.6 + 0.3 * l).toFixed(1)} s.` },
  { id: 'mirror_passive', god: 'mirror', slot: 'passive', name: 'Azogue',           desc: l => `Cuando te golpean, el golpe rebota: los enemigos cercanos reciben ${100 * l}% de tu daño.` },
  // Bestias
  { id: 'beast_basic',    god: 'beast',  slot: 'basic',   name: 'Sabueso',          desc: l => `Un sabueso pelea a tu lado y muerde al enemigo que disparas (${60 * l}% de daño, con tus efectos). Tus disparos hacen un 15% más a su presa.` },
  { id: 'beast_charge',   god: 'beast',  slot: 'charge',  name: '¡A por él!',       desc: l => `Tu disparo cargado hace que el sabueso salte sobre el objetivo: ${250 * l}% de daño en área y aturde 1 s.` },
  { id: 'beast_dodge',    god: 'beast',  slot: 'dodge',   name: 'Manada',           desc: l => `Al esquivar, el sabueso embiste a los enemigos que tenías encima: ${80 * l}% de daño y los aparta.` },
  { id: 'beast_passive',  god: 'beast',  slot: 'passive', name: 'Olfato',           desc: l => `Los enemigos con menos del 30% de vida reciben un ${25 * l}% más de todo el daño.` },
  // Forja
  { id: 'forge_basic',    god: 'forge',  slot: 'basic',   name: 'Temple',           desc: l => `Cada ${Math.max(3, 9 - l * 2)} disparos ganas 1 de Temple, hasta 10. Cada punto da +3% de daño. Si te golpean, pierdes la mitad.` },
  { id: 'forge_charge',   god: 'forge',  slot: 'charge',  name: 'Martillazo',       desc: l => `Tu disparo cargado añade un martillazo a tu alrededor: ${120 * l}% de daño y aturde. Ganas 1 de Temple por cada enemigo golpeado.` },
  { id: 'forge_dodge',    god: 'forge',  slot: 'dodge',   name: 'Al rojo',          desc: l => `Después de esquivar, tus ${1 + l} siguientes disparos salen al rojo: +50% de daño y salpican al enemigo de al lado.` },
  { id: 'forge_passive',  god: 'forge',  slot: 'passive', name: 'Maestro armero',   desc: l => `Tu arma mejora: +${5 * l}% de daño, de cadencia y de alcance.` },
];
// Dúos: si llevas la técnica de una deidad y a otra le toca ofrecerte la suya para esa misma acción,
// te ofrece el dúo. Ocupa la ranura, hace lo de las dos y añade una regla nueva. Las once primeras deidades tienen dúo con todas entre sí; las nuevas, solo con sus afines.
const DUOS = [
  // Disparo
  { id: 'obsidian',  slot: 'basic',   a: 'dragon_basic',  b: 'stone_basic',  name: 'Bala de obsidiana',  desc: 'Además de lo que hacen Colmillo al rojo y Esquirla, tus Cristales arden: cada medio segundo clavan 1 Ascua a los enemigos pegados a ellos. Cuando a un Cristal se le acaba el tiempo, estalla: 100% de daño en área y 2 Ascuas a cada enemigo alcanzado.' },
  { id: 'eternal',   slot: 'basic',   a: 'dragon_basic',  b: 'time_basic',   name: 'Brasa eterna',       desc: 'Además de lo que hacen Colmillo al rojo y Segundero, las Ascuas ya no se apagan con el tiempo: siguen quemando hasta que el enemigo muere o las haces estallar. Además, cada eco clava el doble de Ascuas que un disparo normal.' },
  { id: 'tombstone', slot: 'basic',   a: 'stone_basic',   b: 'shade_basic',  name: 'Lápida',             desc: 'Además de lo que hacen Esquirla y Marca de tumba, cuando a un Cristal se le acaba el tiempo, se levanta una Sombra en su sitio. Cuenta para tu límite de Sombras: si ya estás al máximo, sustituye a la más antigua.' },
  { id: 'boil',      slot: 'basic',   a: 'venom_basic',   b: 'orc_basic',    name: 'Sangre hirviente',   desc: 'Además de lo que hacen Dardo y Tambor de guerra, cada impacto aplica 1 de Veneno más por cada 20 de Furia (+5 con la Furia llena). Cada vez que el Veneno hace daño, ganas 1 de Furia. Con la Furia llena, el Veneno hace daño el doble de rápido.' },
  { id: 'syringe',   slot: 'basic',   a: 'venom_basic',   b: 'storm_basic',  name: 'Aguja envenenada',   desc: 'Además de lo que hacen Dardo y Aguja estática, al descargar a un enemigo, cada rayo aplica a quien alcanza tanto Veneno como tenía ese enemigo (hasta 30). Las Agujas no caducan mientras el enemigo tenga Veneno.' },
  { id: 'warhunger', slot: 'basic',   a: 'feast_basic',   b: 'orc_basic',    name: 'Hambre de guerra',   desc: 'Además de lo que hacen Bocado y Tambor de guerra, cada punto de vida que te curas te da 2 de Furia, también lo que va a la Reserva. Con la Furia llena, Bocado te cura el triple por disparo.' },
  { id: 'clockmark', slot: 'basic',   a: 'time_basic',    b: 'shade_basic',  name: 'Marca del reloj',    desc: 'Además de lo que hacen Segundero y Marca de tumba, cuando un enemigo marcado muere y se levanta como Sombra, 1,5 s después se levanta otra en el mismo sitio. Solo con las Sombras de Marca de tumba, y los jefes no se levantan.' },
  // Cargado
  { id: 'rot',       slot: 'charge',  a: 'dragon_charge', b: 'venom_charge', name: 'Aliento podrido',    desc: 'Además de lo que hacen Aliento y Purga, antes de nada, tu disparo cargado suma las Ascuas y el Veneno de cada enemigo que alcanza y sube los dos a ese total (las Ascuas hasta su tope; el Veneno, hasta 30). Después Aliento hace estallar las Ascuas y Purga convierte el Veneno.' },
  { id: 'roar',      slot: 'charge',  a: 'dragon_charge', b: 'orc_charge',   name: 'Rugido',             desc: 'Además de lo que hacen Aliento y Grito de guerra, el cono de fuego de Aliento crece con la Furia que tienes al disparar: hasta el doble de largo y de ancho con la Furia llena. El grito solo gasta la mitad de tu Furia. El cono solo sale con la Recámara de rayo.' },
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
  { id: 'toast',     slot: 'dodge',   a: 'feast_dodge',   b: 'storm_dodge',  name: 'Brindis eléctrico',  desc: 'Además de lo que hacen Brindis y Paso relámpago, cuando atraviesas a un enemigo y le descargas las Agujas, te curas 2 por cada Aguja descargada.' },
  { id: 'horde',     slot: 'dodge',   a: 'orc_dodge',     b: 'shade_dodge',  name: 'Carga de la horda',  desc: 'Además de lo que hacen Embestida y Relevo, cuando embistes a un enemigo, todas tus Sombras saltan a su lado y lo golpean: 100% de daño cada una.' },
  { id: 'stasis',    slot: 'dodge',   a: 'time_dodge',    b: 'storm_dodge',  name: 'Relámpago en pausa', desc: 'Además de lo que hacen Hora muerta y Paso relámpago, los enemigos dentro de la burbuja reciben 1 Aguja por cada segundo que pasan en ella. Cuando la burbuja se cierra, descarga a todos los que siguen dentro (80% por Aguja).' },
  // Pasiva
  { id: 'hoardfeast', slot: 'passive', a: 'dragon_passive', b: 'feast_passive', name: 'Banquete del dragón', desc: 'Además de lo que hacen Tesoro y Glotón, para Glotón, cada 10 de oro que llevas cuenta como 1 punto de Reserva, sin gastarse. Y cada vez que ganas oro, te curas tanto como el oro ganado.' },
  { id: 'ashlegion', slot: 'passive', a: 'dragon_passive', b: 'shade_passive', name: 'Ejército de ceniza', desc: 'Además de lo que hacen Tesoro y Séquito, cada golpe de tus Sombras clava 2 Ascuas. Cuando a una Sombra se le acaba el tiempo, estalla: 100% de daño en área. Las que lanzas con Orden o sustituye otra nueva no estallan así.' },
  { id: 'clockquartz', slot: 'passive', a: 'stone_passive', b: 'time_passive', name: 'Cuarzo de reloj',   desc: 'Además de lo que hacen Veta y Reloj de arena, tus Cristales ralentizan un 40% a los enemigos pegados a ellos (a los jefes, menos), y no se gastan mientras tengan a alguien al lado. Esos enemigos cuentan como ralentizados para Reloj de arena.' },
  { id: 'indigest',  slot: 'passive', a: 'venom_passive', b: 'feast_passive', name: 'Indigestión',        desc: 'Además de lo que hacen Plaga y Glotón, te curas un 10% de todo el daño que hace tu Veneno.' },
  { id: 'longlunch', slot: 'passive', a: 'feast_passive', b: 'time_passive',  name: 'Sobremesa larga',    desc: 'Además de lo que hacen Glotón y Reloj de arena, tu Reserva ya no baja con el tiempo, y ralentiza a los enemigos cercanos a ti un 2% por punto, hasta un 60%.' },
  { id: 'warthunder', slot: 'passive', a: 'orc_passive',  b: 'storm_passive', name: 'Trueno de guerra',   desc: 'Además de lo que hacen Sed de sangre y Conductor, con la Furia llena, cada disparo lanza además un rayo a otro enemigo cercano: 60% del daño del disparo. Ese rayo no clava Agujas.' },
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
  { id: 'snakeeyes', slot: 'basic',   a: 'venom_basic',   b: 'luck_basic',   name: 'Ojos de serpiente',  desc: 'Además de lo que hacen Dardo y Dado cargado, cada crítico duplica el Veneno del enemigo, hasta 30.' },
  { id: 'loaded',    slot: 'basic',   a: 'time_basic',    b: 'luck_basic',   name: 'Dado trucado',       desc: 'Además de lo que hacen Segundero y Dado cargado, cada eco tira su propio crítico, con tu misma probabilidad y aparte del disparo original. Si sale, hace daño de crítico y cuenta como crítico para todo lo demás.' },
  { id: 'toss',      slot: 'dodge',   a: 'feast_dodge',   b: 'luck_dodge',   name: 'Propina',            desc: 'Además de lo que hacen Brindis y Cara o cruz, cada vez que lanzas la moneda te curas 5, salga cara o cruz.' },
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
  { id: 'orchard',   slot: 'passive', a: 'feast_passive', b: 'wood_passive', name: 'Huerto',             desc: 'Además de lo que hacen Glotón y Savia, te curas 1 cada vez que golpeas a un enemigo enraizado. El daño continuo no cuenta, y estar entre zarzas tampoco.' },
  // Hielo (afines: Mareas, Tiempo, Minerales, Tormenta, Bosque)
  { id: 'glacier',   slot: 'basic',   a: 'stone_basic',   b: 'frost_basic',   name: 'Glaciar',           desc: 'Además de lo que hacen Esquirla y Aliento helado, cada enemigo que queda Congelado deja un Cristal a su lado.' },
  { id: 'hail',      slot: 'basic',   a: 'storm_basic',   b: 'frost_basic',   name: 'Granizo',           desc: 'Además de lo que hacen Aguja estática y Aliento helado, cuando un enemigo queda Congelado, se descargan todas sus Agujas (80% por Aguja).' },
  { id: 'iceberg',   slot: 'charge',  a: 'tide_charge',   b: 'frost_charge',  name: 'Témpano',           desc: 'Además de lo que hacen Maremoto y Quebrar, la ola del Maremoto deja Congelados al instante a los enemigos que ya estaban Empapados antes de que llegara. Los jefes quedan Congelados la mitad de tiempo.' },
  { id: 'stillness', slot: 'passive', a: 'time_passive',  b: 'frost_passive', name: 'Quietud',           desc: 'Además de lo que hacen Reloj de arena y Cero absoluto, los enemigos quedan Congelados 1,5 s más (3 s en vez de 1,5). Los jefes, la mitad.' },
  { id: 'frostthorn', slot: 'dodge',  a: 'wood_dodge',    b: 'frost_dodge',   name: 'Zarza de escarcha', desc: 'Además de lo que hacen Enredadera y Paso de hielo, la enredadera pone además 3 de Escarcha al enemigo que enraíza.' },
  // Sangre (afines: Manjares, Orcos, Veneno, Sombras)
  { id: 'warwound',  slot: 'basic',   a: 'orc_basic',     b: 'blood_basic',   name: 'Herida de guerra',  desc: 'Además de lo que hacen Tambor de guerra y Herida abierta, cada Herida que abres te da 3 de Furia. Con la Furia llena, las Heridas sangran el doble.' },
  { id: 'hemotoxin', slot: 'basic',   a: 'venom_basic',   b: 'blood_basic',   name: 'Hemotoxina',        desc: 'Además de lo que hacen Dardo y Herida abierta, las Heridas de los enemigos con Veneno sangran el doble.' },
  { id: 'bloodwine', slot: 'passive', a: 'feast_passive', b: 'blood_passive', name: 'Vino de sangre',    desc: 'Además de lo que hacen Glotón y Deuda, toda la vida que pagas vuelve como Reserva. Solo sirve si pagas vida: con Sangría en el disparo cargado o con el cargador Bala de sangre.' },
  { id: 'bloodrite', slot: 'charge',  a: 'shade_charge',  b: 'blood_charge',  name: 'Rito rojo',         desc: 'Además de lo que hacen Orden y Sangría, los enemigos que mueren en los 0,7 s siguientes a tu disparo cargado (los mismos que te curan con Sangría) se levantan como Sombras. Los jefes no.' },
  // Final (afines: Tiempo, Dragones, Sombras, Fortuna)
  { id: 'deadline',  slot: 'basic',   a: 'time_basic',    b: 'end_basic',     name: 'Plazo vencido',     desc: 'Además de lo que hacen Segundero y Sentencia, el daño de tus ecos cuenta el doble para la Sentencia.' },
  { id: 'verdict',   slot: 'basic',   a: 'luck_basic',    b: 'end_basic',     name: 'Veredicto',         desc: 'Además de lo que hacen Dado cargado y Sentencia, un crítico cumple al instante la Sentencia que ya tuviera el enemigo, sumando el daño de ese crítico.' },
  { id: 'autodafe',  slot: 'charge',  a: 'dragon_charge', b: 'end_charge',    name: 'Auto de fe',        desc: 'Además de lo que hacen Aliento y Punto final, cuando tu disparo cargado cumple una Sentencia, le clava además 3 Ascuas al enemigo. Llegan después del estallido de Aliento, así que se quedan quemando.' },
  { id: 'obituary',  slot: 'passive', a: 'shade_passive', b: 'end_passive',   name: 'Obituario',         desc: 'Además de lo que hacen Séquito y Epitafio, si un enemigo muere al cumplirse su Sentencia, se levanta como Sombra. Los jefes no.' },
  // Luz (afines: Minerales, Tormenta, Dragones, Sombras)
  { id: 'lens',      slot: 'basic',   a: 'stone_basic',   b: 'light_basic',   name: 'Lente',             desc: 'Además de lo que hacen Esquirla y Señalar, tus Cristales Iluminan a los enemigos que tengan cerca, mientras sigan cerca.' },
  { id: 'beacon',    slot: 'basic',   a: 'storm_basic',   b: 'light_basic',   name: 'Faro',              desc: 'Además de lo que hacen Aguja estática y Señalar, todos tus rayos, los de las descargas y cualquier otro, Iluminan 6 s a quien alcanzan.' },
  { id: 'sunfire',   slot: 'passive', a: 'dragon_passive', b: 'light_passive', name: 'Sol de mediodía',  desc: 'Además de lo que hacen Tesoro y Sin sombra, las Ascuas queman el doble a los Iluminados.' },
  { id: 'eclipse',   slot: 'passive', a: 'shade_passive', b: 'light_passive', name: 'Eclipse',           desc: 'Además de lo que hacen Séquito y Sin sombra, para Sin sombra, cada Sombra viva cuenta como un Iluminado más (el tope sigue en seis). Y los golpes de tus Sombras Iluminan 6 s.' },
  // Sueño (afines: Veneno, Tiempo, Manjares, Hielo)
  { id: 'poppy',     slot: 'passive', a: 'venom_passive', b: 'dream_passive', name: 'Adormidera',        desc: 'Además de lo que hacen Plaga y Sonámbulos, cuando un enemigo llega a 10 de Veneno, se queda Dormido 3 s. A los jefes solo los ralentiza.' },
  { id: 'siesta',    slot: 'dodge',   a: 'time_dodge',    b: 'dream_dodge',   name: 'Siesta',            desc: 'Además de lo que hacen Hora muerta y Polvo de sueño, todo lo que Duerme a un enemigo lo Duerme el doble de tiempo, venga de donde venga.' },
  { id: 'digest',    slot: 'charge',  a: 'feast_charge',  b: 'dream_charge',  name: 'Digestión',         desc: 'Además de lo que hacen Banquete y Pesadilla, cada Dormido que alcanza tu disparo cargado te da 4 de Reserva.' },
  { id: 'hibernate', slot: 'basic',   a: 'frost_basic',   b: 'dream_basic',   name: 'Hibernar',          desc: 'Además de lo que hacen Aliento helado y Arrullo, cuando a un enemigo se le pasa el Congelado (o se lo rompes), se queda Dormido 2 s. A los jefes solo los ralentiza.' },
  // Vacío (afines: Mareas, Dragones, Orcos, Bosque)
  { id: 'maelstrom', slot: 'charge',  a: 'tide_charge',   b: 'void_charge',   name: 'Vorágine',          desc: 'Además de lo que hacen Maremoto y Singularidad, la ola del Maremoto lanza a los enemigos hacia el centro de la Singularidad (o del último pozo abierto) en vez de alejarlos de ti.' },
  { id: 'collapse',  slot: 'charge',  a: 'dragon_charge', b: 'void_charge',   name: 'Colapso',           desc: 'Además de lo que hacen Aliento y Singularidad, cuando la Singularidad se cierra, revienta las Ascuas de todos los enemigos que ha atrapado: 35% de daño por Ascua, en área.' },
  { id: 'funnel',    slot: 'dodge',   a: 'orc_dodge',     b: 'void_dodge',    name: 'Embudo',            desc: 'Además de lo que hacen Embestida y Hueco, el pozo de Hueco aturde 0,5 s a cada enemigo que llega a su centro, una vez por enemigo. Los jefes no.' },
  { id: 'thicket',   slot: 'passive', a: 'wood_passive',  b: 'void_passive',  name: 'Espesura',          desc: 'Además de lo que hacen Savia y Apiñados, Apiñados cuenta el doble contra enemigos enraizados o entre zarzas.' },
  // Espejos (afines: Sombras, Tiempo, Fortuna, Luz)
  { id: 'doubles',   slot: 'basic',   a: 'shade_basic',   b: 'mirror_basic',  name: 'Dobles',            desc: 'Además de lo que hacen Marca de tumba y Reflejo, cada vez que tu Reflejo dispara, cada una de tus Sombras dispara también al enemigo más cercano: 30% de daño, con tus efectos de disparo.' },
  { id: 'prismatic', slot: 'basic',   a: 'light_basic',   b: 'mirror_basic',  name: 'Prisma vivo',       desc: 'Además de lo que hacen Señalar y Reflejo, los disparos de tu Reflejo hacen el doble de daño a los Iluminados.' },
  { id: 'afterimage', slot: 'charge', a: 'time_charge',   b: 'mirror_charge', name: 'Imagen tardía',     desc: 'Además de lo que hacen Rebobinar y Doble, cuando Rebobinar repite tu disparo cargado, tu Reflejo también lo repite desde su lado, a la mitad de la fuerza de esa repetición.' },
  { id: 'luckglass', slot: 'passive', a: 'luck_passive',  b: 'mirror_passive', name: 'Espejo de la suerte', desc: 'Además de lo que hacen Racha y Azogue, cada golpe que recibes tiene un 33% de que se lo lleve el Reflejo: no pierdes vida. Aun así pierdes la Racha, y Azogue no rebota ese golpe.' },
  // Bestias (afines: Orcos, Veneno, Sangre, Bosque)
  { id: 'warhound',  slot: 'basic',   a: 'orc_basic',     b: 'beast_basic',   name: 'Perro de guerra',   desc: 'Además de lo que hacen Tambor de guerra y Sabueso, cada mordisco te da 4 de Furia. Con la Furia llena, el sabueso muerde el doble de rápido.' },
  { id: 'rabid',     slot: 'basic',   a: 'venom_basic',   b: 'beast_basic',   name: 'Rabia',             desc: 'Además de lo que hacen Dardo y Sabueso, cada mordisco del sabueso aplica 2 de Veneno.' },
  { id: 'bloodhound', slot: 'dodge',  a: 'blood_dodge',   b: 'beast_dodge',   name: 'Rastro de sangre',  desc: 'Además de lo que hacen Transfusión y Manada, la embestida de Manada abre 2 Heridas a cada enemigo que alcanza y te cura 2 por cada uno.' },
  { id: 'wolfthorn', slot: 'charge',  a: 'wood_charge',   b: 'beast_charge',  name: 'Lobo entre zarzas', desc: 'Además de lo que hacen Zarzal y ¡A por él!, el salto del sabueso deja enraizados 1,5 s a todos los que alcanza (a los jefes, mucho menos).' },
  // Forja (afines: Dragones, Minerales, Orcos, Tormenta)
  { id: 'forgefire', slot: 'basic',   a: 'dragon_basic',  b: 'forge_basic',   name: 'Fuego de fragua',   desc: 'Además de lo que hacen Colmillo al rojo y Temple, con 5 o más de Temple, cada disparo clava 1 Ascua más.' },
  { id: 'whetstone', slot: 'passive', a: 'stone_passive', b: 'forge_passive', name: 'Piedra de amolar',  desc: 'Además de lo que hacen Veta y Maestro armero, cada Cristal que haya en la sala cuenta como 1 punto más de Temple para el daño (+3% cada uno). Solo sirve si llevas la técnica Temple o ya tienes algo de Temple.' },
  { id: 'warhammer', slot: 'charge',  a: 'orc_charge',    b: 'forge_charge',  name: 'Martillo de guerra', desc: 'Además de lo que hacen Grito de guerra y Martillazo, el Martillazo crece con la Furia que tienes al disparar, hasta el doble de tamaño con la Furia llena, y te da 2 de Temple por enemigo golpeado en vez de 1.' },
  { id: 'quench',    slot: 'dodge',   a: 'storm_dodge',   b: 'forge_dodge',   name: 'Templar al rayo',   desc: 'Además de lo que hacen Paso relámpago y Al rojo, cada disparo al rojo clava 2 Agujas al enemigo.' },
];
// Técnicas extra: no ocupan ranura. rar: 1 rara, 2 épica, 3 legendaria. req: piezas que hay que llevar.
const TECHS = [
  { id: 'd_blood',   god: 'dragon', rar: 1, name: 'Sangre de dragón',  desc: 'Todas tus explosiones, vengan de donde vengan, son un 30% más grandes y clavan 2 Ascuas a cada enemigo que alcanzan. Solo sirve si tienes algo que explote.' },
  { id: 'd_pyre',    god: 'dragon', rar: 2, name: 'Pira',              desc: 'Los enemigos que mueren con Ascuas explotan: 30% de daño por cada Ascua que tenían, y la explosión clava la mitad de esas Ascuas a los que alcanza.', req: ['dragon_basic'] },
  { id: 'm_reson',   god: 'stone',  rar: 1, name: 'Resonancia',        desc: 'Cada vez que algo tuyo explota, el Cristal más cercano (si está a pocos pasos) estalla también: 60% de daño en un área pequeña. El Cristal no se rompe. Solo sirve si tienes Cristales.' },
  { id: 'm_quartz',  god: 'stone',  rar: 2, name: 'Cuarzo vivo',       desc: 'Donde muere un enemigo nace un Cristal, y todos tus Cristales duran el doble (18 s).' },
  { id: 'v_vapors',  god: 'venom',  rar: 1, name: 'Vapores',           desc: 'Todas tus explosiones, vengan de donde vengan, aplican 3 de Veneno a cada enemigo que alcanzan. Solo sirve si tienes algo que explote.' },
  { id: 'v_syn',     god: 'venom',  rar: 2, name: 'Organismo débil',   desc: 'Los enemigos con Veneno reciben un 3% más de todo el daño por cada punto de Veneno, hasta +90% con 30.' },
  { id: 'f_cellar',  god: 'feast',  rar: 1, name: 'Bodega',            desc: 'Tu Reserva máxima pasa de 30 a 60.' },
  { id: 'f_carve',   god: 'feast',  rar: 2, name: 'Trinchar',          desc: 'Cuando un golpe tuyo deja a un enemigo por debajo del 12% de vida, lo remata. El daño continuo (Ascuas, Veneno, Heridas) no remata. No funciona con jefes.' },
  { id: 'o_drums',   god: 'orc',    rar: 1, name: 'Tambores lejanos',  desc: 'Ganas 8 de Furia cada vez que algo tuyo explota y 10 con cada baja.' },
  { id: 'o_berserk', god: 'orc',    rar: 3, name: 'Berserker',         desc: 'Con la Furia llena, disparar no te frena: andas a toda velocidad mientras disparas, tensas o giras la manivela. Cargar el disparo cargado sí te sigue frenando.', req: ['orc_basic'] },
  { id: 't_overtime', god: 'time',  rar: 1, name: 'Prórroga',          desc: 'Tus ecos y repeticiones llegan en la mitad de tiempo: el de Segundero a los 0,75 s y el de Rebobinar al segundo. Solo sirve si llevas algo que deje eco.' },
  { id: 't_paradox', god: 'time',   rar: 3, name: 'Paradoja',          desc: 'Cada eco de Segundero deja a su vez otro eco 1,5 s después, al 60% del daño del primero. Ese segundo eco ya no se repite.', req: ['time_basic'] },
  { id: 's_guard',   god: 'shade',  rar: 1, name: 'Guardia de honor',  desc: 'Tus Sombras destruyen los proyectiles enemigos que tocan.' },
  { id: 's_legion',  god: 'shade',  rar: 2, name: 'Legión',            desc: 'Puedes tener 3 Sombras más a la vez, y duran el doble (18 s). Las de Relevo duran lo mismo.' },
  { id: 'r_over',    god: 'storm',  rar: 2, name: 'Sobrecarga',        desc: 'Cuando un enemigo llega a 6 Agujas, se descargan solas: 100% de daño por Aguja y un rayo por Aguja a otros enemigos.', req: ['storm_basic'] },
  // Ofrendas: técnicas sueltas que sirven aunque no lleves nada más de esa deidad
  { id: 'd_warm',    god: 'dragon', rar: 1, name: 'Aliento tibio',     desc: 'Uno de cada cuatro disparos clava 1 Ascua. Sirve aunque no lleves nada de Dragones.' },
  { id: 'm_skin',    god: 'stone',  rar: 1, name: 'Piel de piedra',    desc: 'Recibes un 10% menos de daño.' },
  { id: 'v_slow',    god: 'venom',  rar: 1, name: 'Toxina lenta',      desc: 'Uno de cada tres disparos aplica 1 de Veneno. Sirve aunque no lleves nada de Veneno.' },
  { id: 'f_appet',   god: 'feast',  rar: 1, name: 'Buen apetito',      desc: 'Cada baja te cura 1.' },
  { id: 'o_scars',   god: 'orc',    rar: 1, name: 'Cicatrices',        desc: 'Con menos de la mitad de vida haces un 15% más de daño.' },
  { id: 't_second',  god: 'time',   rar: 1, name: 'Un segundo más',    desc: 'Tu esquive se recarga un 20% antes.' },
  { id: 's_last',    god: 'shade',  rar: 1, name: 'Último servicio',   desc: 'El primer enemigo que matas en cada sala se levanta como Sombra y pelea por ti. Los jefes no.' },
  { id: 'r_spark',   god: 'storm',  rar: 1, name: 'Chispa',            desc: 'Uno de cada cinco disparos lanza un rayo a otro enemigo cercano: 60% del daño del disparo. No hacen falta Agujas.' },
  { id: 'w_brine',   god: 'tide',   rar: 1, name: 'Salitre',           desc: 'Uno de cada cuatro disparos empuja al enemigo con fuerza, y puede estamparlo contra un muro. A los jefes no los mueve.' },
  { id: 'w_deep',    god: 'tide',   rar: 2, name: 'Mar de fondo',      desc: 'Cuando un enemigo choca contra un muro, queda aturdido 1,4 s en vez de 0,7 y te da 1 de oro.' },
  { id: 'l_coin',    god: 'luck',   rar: 1, name: 'Moneda de la suerte', desc: 'Tus disparos tienen un 8% más de probabilidad de ser crítico (250% de daño). Sirve aunque no lleves nada de Fortuna.' },
  { id: 'l_jack',    god: 'luck',   rar: 3, name: 'Premio gordo',      desc: 'Si un crítico mata, el enemigo revienta: 150% de daño en área y 3 de oro.', req: ['luck_basic'] },
  { id: 'b_thorn',   god: 'wood',   rar: 1, name: 'Espina',            desc: 'Uno de cada cinco disparos deja enraizado al enemigo 0,8 s (a los jefes, mucho menos).' },
  { id: 'b_bloom',   god: 'wood',   rar: 2, name: 'Floración',         desc: 'Los enemigos que mueren enraizados dejan un zarzal de 3 s: quien esté dentro va a la mitad de velocidad y recibe 20% de daño por pulso.' },
  { id: 'i_rime',    god: 'frost',  rar: 1, name: 'Rocío helado',      desc: 'Uno de cada cuatro disparos pone 1 de Escarcha. Sirve aunque no lleves nada de Hielo.' },
  { id: 'i_shatter', god: 'frost',  rar: 2, name: 'Astillas',          desc: 'Los enemigos que mueren Congelados lanzan esquirlas a hasta cuatro enemigos cercanos: 40% de daño a cada uno.' },
  { id: 'h_warm',    god: 'blood',  rar: 1, name: 'Sangre caliente',   desc: 'Con menos de la mitad de vida, cada baja te cura 2.' },
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
  { id: 'a_pup',     god: 'beast',  rar: 1, name: 'Cachorro',          desc: 'Un cachorro te acompaña y muerde al enemigo que disparas: 30% de daño, con tus efectos de disparo. Tus disparos hacen un 15% más a su presa. Si ya tienes sabueso, no se suma.' },
  { id: 'a_feral',   god: 'beast',  rar: 2, name: 'Sed de caza',       desc: 'Te curas 2 por cada enemigo que remata el sabueso de un mordisco.' },
  { id: 'g_whet',    god: 'forge',  rar: 1, name: 'Bien afilada',      desc: 'Haces un 8% más de daño.' },
  { id: 'g_slag',    god: 'forge',  rar: 2, name: 'Recalentar',        desc: 'Con el Temple al máximo, cada disparo salpica a los enemigos de alrededor del objetivo: 30% del daño, en un área pequeña.' },
  { id: 'r_judge',   god: 'storm',  rar: 3, name: 'Juicio',            desc: 'Cada vez que descargas a un enemigo, cae un rayo del cielo sobre él: 300% de daño en área.' },
];
const RAR = [{ name: 'Común', color: '#a3a9bd' }, { name: 'Rara', color: '#6fb7ff' }, { name: 'Épica', color: '#c98bff' }, { name: 'Legendaria', color: '#ffd24a' }];
// Maestría: llevar a la misma deidad en 3 acciones (los dúos cuentan para las dos).
const MASTERY = {
  dragon: { name: 'Heredera del fuego',    desc: 'Las Ascuas se acumulan hasta 20 y queman un 50% más.' },
  stone:  { name: 'Corazón de la montaña', desc: 'Puedes tener el doble de Cristales, y Veta usa dos a la vez.' },
  venom:  { name: 'Paciente cero',         desc: 'El Veneno hace daño el doble de rápido.' },
  feast:  { name: 'Invitado de honor',     desc: 'Todas tus curaciones son un 50% mayores.' },
  orc:    { name: 'Caudillo',              desc: 'La Furia nunca baja de 50.' },
  time:   { name: 'Dueño de la hora',      desc: 'Tus ecos hacen el 100% del daño original.' },
  shade:  { name: 'Reina de los muertos',  desc: 'Tus Sombras hacen un 50% más de daño y duran un 50% más.' },
  tide:   { name: 'Señor del abismo',      desc: 'Cada golpe contra el muro suelta una ola que empapa y hace 150% de daño en área.' },
  luck:   { name: 'La casa siempre gana',  desc: 'Tus críticos hacen el 400% del daño en vez del 250%.' },
  wood:   { name: 'Corazón del bosque',    desc: 'Las Raíces duran el doble y, al brotar, dejan dos Semillas ya plantadas en el enemigo.' },
  frost:  { name: 'Invierno eterno',       desc: 'Los enemigos quedan Congelados el doble de tiempo.' },
  blood:  { name: 'Cobro final',           desc: 'Cada enemigo que muere sangrando te cura 2.' },
  end:    { name: 'Letra pequeña',         desc: 'Las Sentencias se cumplen en 3 s en vez de 5.' },
  light:  { name: 'Mediodía',              desc: 'Los Iluminados ya no dejan de estarlo.' },
  dream:  { name: 'Sueño profundo',        desc: 'Los Dormidos aguantan un golpe sin despertarse, y ese golpe también hace más daño.' },
  void:   { name: 'Horizonte',             desc: 'Tus pozos son un 40% más grandes y duran un segundo más.' },
  mirror: { name: 'Sala de espejos',       desc: 'Tienes un segundo Reflejo, a un lado del enemigo.' },
  beast:  { name: 'Jauría',                desc: 'Tienes un segundo sabueso.' },
  forge:  { name: 'Obra maestra',          desc: 'El Temple llega hasta 15 y ya no lo pierdes al recibir golpes.' },
  storm:  { name: 'Tormenta perfecta',     desc: 'Si un rayo de descarga alcanza a un enemigo con Agujas, también se las descarga, en cadena.' },
};
// Planos: mejoras del arma que salen durante la partida (jefes y tienda).
const PLANS = [
  { id: 'echo',    name: 'Arma gemela',   desc: 'Al esquivar dejas una copia del arma donde estabas durante 3 s. Dispara sola al enemigo más cercano a tu cadencia, al 50% de tu daño base y con tus efectos de disparo, pero sin críticos, ecos ni Sentencias.' },
  { id: 'tempo',   name: 'Compás',        desc: 'El ¡Compás! funciona con cualquier llave que dispare a pulsaciones (no con la Llave de retén, el Torno de ballesta ni la Manivela de ribadoquín) y duplica el daño de ese disparo en vez de darle +50%. Tienes que pulsar justo cuando el arma vuelve a estar lista: mantener pulsado o machacar el botón no cuenta.' },
  { id: 'mortar',  name: 'Mortero',       desc: 'Solo con la Recámara de rayo. Tu disparo cargado ya no es un rayo: lanza un proyectil que pasa por encima de los muros y explota donde apuntas, con el 80% de su daño en área y todos sus efectos. Con Aliento ya no se abre en cono.', only: 'c_beam' },
  { id: 'recoil',  name: 'Retroceso',     desc: 'Tu disparo cargado te lanza hacia atrás con un esquive gratis: no gasta carga, te hace intocable y activa tus técnicas de esquive (salvo Cara o cruz). Además, se recarga un 35% antes. No funciona con la Recámara de embestida ni con la de trueno.' },
  { id: 'double',  name: 'Doble esquive', desc: 'Tienes una carga más de esquive.' },
];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

