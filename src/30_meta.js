// ───────────────────────── Lo que queda entre vidas ─────────────────────────
// Almas (solo en salas de almas) para tu árbol. Hierro Místico y materiales de cada deidad para forjar.
// Se guarda en el navegador, igual que la partida en curso.
const zeroMats = () => Object.fromEntries(GOD_KEYS.map(g => [g, 0]));
let M = { souls: 0, iron: 0, mats: zeroMats(), runs: 0, best: 0, wins: 0, parts: {}, gun: Object.assign({}, BASE_GUN), tree: {}, run: null, time: 0, earned: 0 };
try { const raw = localStorage.getItem('kiteo.save3'); if (raw) { const o = JSON.parse(raw); M = Object.assign(M, o, { mats: Object.assign(M.mats, o.mats || {}) }); } } catch (e) {}
// Piezas: 1 descubierta, 2 forjada (puedes empezar con ella). Las básicas vienen forjadas.
for (const x of PARTS) if (x.base) M.parts[x.id] = 2;
{ // Las armas enteras de antes se convierten en sus piezas, ya forjadas
  const OLDW = { pistols: ['b_twin', 'a_semi', 's_light', 'c_fan'], bow: ['b_pierce', 'a_draw', 'c_rain'], shotgun: ['b_scatter', 'm_drum', 'c_blast'], gatling: ['a_rotary', 'm_belt', 'c_supp'], lance: ['b_spike', 'c_dash'] };
  for (const w of M.owned || []) for (const id of OLDW[w] || []) M.parts[id] = 2;
  if (M.weapon && OLDW[M.weapon]) { M.gun = Object.assign({}, BASE_GUN); for (const id of OLDW[M.weapon]) M.gun[PART[id].slot] = id; }
  delete M.owned; delete M.weapon; delete M.wup;
  M.gun = Object.assign({}, BASE_GUN, M.gun); for (const k of GSLOT_KEYS) if (!PART[M.gun[k]] || M.parts[M.gun[k]] !== 2) M.gun[k] = BASE_GUN[k];
  if (M.run && !M.run.gun) M.run = null;
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
const where = n => { if (n > TOTAL) return 'el final'; const W = Math.ceil(n / (RPW + 1)), r = n - (W - 1) * (RPW + 1); return WORLDS[W - 1].name + (r > RPW ? ', ante ' + TYPES[WORLDS[W - 1].boss].name : ', sala ' + r); };
const lootTxt = () => { const m = GOD_KEYS.filter(g => S.matsRun[g]).map(g => S.matsRun[g] + ' ' + GODS[g].mat); if (S.ironRun) m.unshift(S.ironRun + ' de Hierro Místico'); return `<b>${S.soulsRun}</b> almas` + (m.length ? ', ' + m.join(', ') : ''); };
function endRun(win) {
  M.souls += S.soulsRun; M.earned += S.soulsRun; M.iron += S.ironRun; for (const g of GOD_KEYS) M.mats[g] += S.matsRun[g];
  M.runs += 1; M.best = Math.max(M.best, win ? TOTAL + 1 : S.wave); if (win) M.wins += 1;
  M.run = null; save();
}
function winRun() { const left = PARTS.filter(x => !M.parts[x.id]); if (left.length) { const x = left[Math.floor(Math.random() * left.length)]; discover(x.id); S.found = x.name; } endRun(true); setMode('win'); }
// Guardado de la partida en curso: al entrar en cada sala
function saveRun() {
  const p = S.p;
  M.run = { wave: S.wave - 1, next: S.next, gun: S.gun, build: S.build, techs: [...S.techs], plans: [...S.plans], kills: S.kills, soulsRun: S.soulsRun, ironRun: S.ironRun, matsRun: S.matsRun,
    p: { hp: p.hp, maxHp: p.maxHp, dmg: p.dmg, as: p.as, range: p.range, speed: p.speed, revive: p.revive, gold: p.gold, reserve: p.reserve } };
  save();
}
function resumeRun() {
  const r = M.run; newGame();
  S.gun = Object.assign({}, BASE_GUN, r.gun); S.build = JSON.parse(JSON.stringify(r.build)); S.techs = new Set(r.techs); S.plans = new Set(r.plans); S.next = r.next;
  S.kills = r.kills; S.soulsRun = r.soulsRun; S.ironRun = r.ironRun; Object.assign(S.matsRun, r.matsRun); Object.assign(S.p, r.p); S.wave = r.wave;
  S.p.dodgeN = dodgeMax(); S.mode = 'play'; modeT = 0; nextWave(); renderOverlay();
}

