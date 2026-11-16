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

