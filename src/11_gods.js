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

