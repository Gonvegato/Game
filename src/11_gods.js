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
];
// Dúos: si llevas la técnica de una deidad y a otra le toca ofrecerte la suya para esa misma acción,
// te ofrece el dúo. Ocupa la ranura, hace lo de las dos y añade una regla nueva. Uno por cada pareja de deidades.
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

