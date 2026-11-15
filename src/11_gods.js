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

