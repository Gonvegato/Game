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
    return { tag: GSLOTS[x.slot] + ' · ' + x.tag + (isNew ? ' · nueva' : ''), rar: 0, name: x.name, color: C.energy, desc: x.desc, note: `Sustituye a ${PART[S.gun[x.slot]].name}` + (nm !== gunName(S.gun) ? ` · tu arma pasa a ser: ${nm}` : ''), apply: () => mountPart(x.id) }; });
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
  const roll = Math.random(), n = (roll < 0.22 ? 1 : roll < 0.68 ? 2 : 3) + tk('door'), gods = GOD_KEYS.slice().sort(() => Math.random() - 0.5), kinds = [];
  const bag = ['souls', 'souls', 'souls', 'souls', 'gold', 'gold', 'gold', 'heart', 'heart', 'iron', 'iron', 'anvil', 'anvil'].sort(() => Math.random() - 0.5);
  const res = () => { const k = bag.find(x => !kinds.some(d => d.type === x)); return { type: k || 'gold' }; };
  kinds.push(n === 1 && Math.random() < 0.4 ? res() : { type: 'god', god: gods.pop() });
  while (kinds.length < n) kinds.push(kinds.length === n - 1 && !kinds.some(d => d.type !== 'god') ? res() : Math.random() < 0.45 ? { type: 'god', god: gods.pop() } : res());
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
    setMode('pick'); return;
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

