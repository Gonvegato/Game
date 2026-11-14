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
  // Jefes: un kit de ataques con aviso. phases: cuántas veces se enfurece.
  guardian:  { name: 'El Guardián',            r: 22, hp: 1100, speed: 44, dmg: 30, shape: 'circle',  color: '#8a3a55', boss: true, phases: 2, kit: ['slam', 'charge', 'ring'],                 sum: 'runner' },
  matriarch: { name: 'La Matriarca del Nido',  r: 20, hp: 1500, speed: 62, dmg: 30, shape: 'circle',  color: '#6f9a3a', boss: true, phases: 2, kit: ['leap', 'fan', 'pools', 'summon'],          sum: 'runner' },
  colossus:  { name: 'El Coloso de Cristal',   r: 26, hp: 2100, speed: 34, dmg: 34, shape: 'square',  color: '#4aa7b8', boss: true, phases: 2, kit: ['lasers', 'ring', 'charge', 'slam'],        sum: 'sniper' },
  nameless:  { name: 'El Sin Nombre',          r: 22, hp: 3000, speed: 54, dmg: 36, shape: 'diamond', color: '#d8d2e8', boss: true, phases: 3, kit: ['slam', 'charge', 'ring', 'fan', 'leap', 'lasers', 'pools', 'summon'], sum: 'brute' },
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

