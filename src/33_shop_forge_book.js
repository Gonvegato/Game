// ───────────────────────── Tienda (antes de cada jefe) ─────────────────────────
function openShop() {
  if (!S.shop || S.shop.wave !== S.wave) {
    const k = 1 + 0.25 * (S.world - 1), pr = n => Math.round(n * k / 5) * 5;
    const god = GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)];
    const plan = PLANS.filter(x => !S.plans.has(x.id) && (!x.only || G(x.only))).sort(() => Math.random() - 0.5)[0];
    S.shop = { wave: S.wave, items: [
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
// La tendera: una buhonera enana que sigue a los mercenarios de campamento en campamento
function keeperHtml() { const m = ATLAS.keeper; if (!m) return ''; const f = m.a.idle.f[0]; return `<div class="keeper"><i style="width:${m.w}px;height:${m.h}px;background-position:-${f[0]}px -${f[1]}px"></i><span>«Mira sin prisa, mercenario. Lo que no compres hoy, mañana lo llevará otro.»</span></div>`; }
function shopHtml() {
  const p = S.p, ms = S.mission, toBoss = hasBoss(ms) && S.room + 1 >= roomsOf(ms), boss = toBoss ? (ms.type === 'god' ? TYPES[KINGDOMS.find(x => x.id === ms.k).god].name : TYPES[WORLDS[S.world - 1].boss].name) : '';
  const icoOf = it => ico({ heal: 'mug', tech: 'sword', up: 'scroll', anvil: 'axe', heart: 'potion', part: 'chest', plan: 'book' }[it.id] || 'gem', it.id === 'tech' ? 1 : 0);
  return `<p class="eyebrow">Tienda · ${S.mission.zone}</p><div class="fhead"><h1>${toBoss ? 'Antes de ' + boss : 'Un alto en el camino'}</h1><p class="purse"><b class="coin">${Math.floor(p.gold)}</b> de oro<span>·</span><b class="life">${Math.ceil(p.hp)}</b> / ${p.maxHp} de vida</p></div>${keeperHtml()}
    <div class="shopwrap"><div><div class="stalls">` +
    S.shop.items.map((it, i) => `<button class="fi stall${it.sold ? ' on sold' : p.gold >= it.price ? '' : ' off'}" data-act="buy:${i}"><em class="tile">${icoOf(it)}</em><b>${it.name}</b><span>${it.desc}</span>${gloss(it.desc, 3)}<i>${it.sold ? 'Vendido' : `<u class="coin">${it.price}</u>`}</i></button>`).join('') +
    `</div><p class="fine">El oro solo sirve en este encargo: lo que no gastes aquí se pierde al terminar.</p><button class="fi primary" data-act="boss">${toBoss ? 'Cruzar la puerta de ' + boss : 'Seguir adelante'}</button></div>
    <aside class="carry"><h2>Lo que llevas</h2><ul class="build full">${buildHtml(true)}</ul></aside></div>`;
}
function shopAct(act) {
  const [k, i] = act.split(':'), p = S.p;
  if (k === 'boss') {   // salir de la tienda: al jefe, a la siguiente oleada o campamento, o a elegir puerta
    const ms = S.mission, direct = ms.type === 'defend' || ms.type === 'assault' || (hasBoss(ms) && S.room + 1 >= roomsOf(ms));
    if (direct) { S.mode = 'play'; modeT = 0; nextWave(); renderOverlay(); } else { pickQueue = [doorScreen]; advancePick(); }
    return;
  }
  const it = S.shop.items[+i];
  if (it.sold || p.gold < it.price) { sfx('no', 0.4); return; }
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
    const reso = RESO.map(R => { const known = R.parts.every(id => M.parts[id]), mounted = R.parts.every(id => M.gun[PART[id].slot] === id);
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
// El recetario va por páginas: una por deidad y unas pocas más. LB y RB (o Q y R) pasan de página; también se puede tocar la pestaña.
let bookPage = 0;
const bookPages = () => [['llevo', 'Lo que llevas', C.energy]].concat(GOD_KEYS.map(g => [g, GODS[g].theme, GODS[g].color]), [['duos', 'Dúos', RAR[3].color], ['reso', 'Resonancias', RAR[3].color], ['piezas', 'Piezas', C.energy], ['glos', 'Glosario', C.ink]]);
function bookHtml() {
  const P = bookPages(); bookPage = ((bookPage % P.length) + P.length) % P.length;
  const [id, , col] = P[bookPage];
  const card = (own, tag, tagCol, icon, name, desc) => `<li class="bk${own ? ' own' : ''}">${icon || '<span class="pic t none"></span>'}<em${tagCol ? ` style="color:${tagCol}"` : ''}>${tag}</em><b>${name}</b><span>${desc}</span></li>`;
  let body = '';
  if (id === 'llevo') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Lo que llevas en este encargo</h2><p>Solo cabe una técnica por acción: disparo, cargado, esquive y pasiva. Si dos deidades te dan técnicas para la misma acción, pueden ofrecerte un dúo que mezcla las dos.</p></div><ul class="build full carrylist">${buildHtml(true) || '<li><span>Todavía no llevas nada.</span></li>'}</ul>`;
  } else if (GODS[id]) {
    const G = GODS[id], n = godCount(id);
    body = `<div class="bkhead" style="--c:${col}"><h2>${G.title}</h2><p><b>${G.theme}.</b> ${G.key}</p><p class="mast"><u>${'<i class="on"></i>'.repeat(Math.min(n, 3))}${'<i></i>'.repeat(Math.max(0, 3 - n))}</u> Maestría ${Math.min(n, 3)}/3 · <b>${MASTERY[id].name}:</b> ${MASTERY[id].desc}</p></div><ul class="bklist">` +
      PIECES.filter(x => x.god === id).map(pc => { const l = lv(pc.id); return card(l, SLOTS[pc.slot], col, pic(pc.id, 't'), pc.name + (l ? ' ' + ROMAN[l] : ''), pc.desc(Math.max(1, l))); }).join('') +
      TECHS.filter(t => t.god === id).map(t => card(S.techs.has(t.id), 'Técnica · ' + RAR[t.rar].name, RAR[t.rar].color, pic(t.id, 't'), t.name, `${t.desc} Necesita: ${techNeeds(t)}.`)).join('') + '</ul>';
  } else if (id === 'duos') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Dúos</h2><p>Dos técnicas de deidades distintas para la misma acción se funden en una. Te lo ofrecen al quebrar una reliquia si ya llevas una de las dos.</p></div>` +
      SLOT_KEYS.map(k => `<h3>Dúos de ${SLOTS[k].toLowerCase()}</h3><ul class="bklist">` + DUOS.filter(d => d.slot === k).map(d => card(duoOn(d.id), GODS[PIECE[d.a].god].theme + ' + ' + GODS[PIECE[d.b].god].theme, null, pic(d.a, 't'), d.name, `Necesita: ${PIECE[d.a].name} + ${PIECE[d.b].name}. ${d.desc}`)).join('') + '</ul>').join('');
  } else if (id === 'reso') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Resonancias</h2><p>Una pieza de los guanteletes más una técnica concreta dan un efecto extra. Se activan solas.</p></div><ul class="bklist">` +
      RESO.map(R => card(res(R.id), R.parts.map(pid => GSLOTS[PART[pid].slot]).join(' + '), null, pic(R.parts[0], 't'), R.name, `${R.parts.map(pid => (M.parts[pid] ? PART[pid].name : 'una pieza sin descubrir')).join(' + ')} y ${R.techs.map(tid => PIECE[tid].name + ' (' + GODS[PIECE[tid].god].theme + ')').join(' + ')}. ${R.desc}`)).join('') + '</ul>' +
      `<h3>Planos</h3><ul class="bklist">` + PLANS.map(x => card(S.plans.has(x.id), 'Plano', null, '', x.name, x.desc)).join('') + '</ul>';
  } else if (id === 'piezas') {
    body = `<div class="bkhead" style="--c:${col}"><h2>Piezas de los guanteletes</h2><p>Las que has descubierto. Quedan ${PARTS.filter(x => !M.parts[x.id]).length} por descubrir.</p></div>` +
      GSLOT_KEYS.map(sk => { const L = PARTS.filter(x => x.slot === sk && M.parts[x.id]); return L.length ? `<h3>${GSLOTS[sk]} · ${GSLOT_WHAT[sk]}</h3><ul class="bklist">` + L.map(x => card(G(x.id), x.tag, null, pic(x.id, 't'), x.name, x.desc)).join('') + '</ul>' : ''; }).join('');
  } else {
    body = `<div class="bkhead" style="--c:${col}"><h2>Glosario</h2><p>Las palabras en mayúscula de las técnicas y piezas (Ascuas, Sentencia, Eco…), explicadas.</p></div><ul class="bklist gl">` + GLOSS.map(([, n, w]) => `<li class="bk own"><b>${n}</b><span>${w.charAt(0).toUpperCase() + w.slice(1)}</span></li>`).join('') + '</ul>';
  }
  return `<p class="eyebrow">Recetario del herrero · página ${bookPage + 1} de ${P.length}</p><h1>Lo que se les puede robar</h1>
    <div class="bktabs">${P.map(([pid, nm, c], i) => `<button class="bkt${i === bookPage ? ' on' : ''}" data-bk="${i}" style="--c:${c}">${nm}</button>`).join('')}</div>
    <div class="bkpage">${body}</div><p class="fine keyhint">LB y RB (o Q y R) pasan de página. El stick mueve la página. Cualquier otro botón vuelve.</p><button id="ovBtn" class="primary">Volver</button>`;
}
function bookTurn(d) { bookPage += d; renderOverlay(); ov.scrollTop = 0; sfx('tick', 0.25); }
function openBook() { bookFrom = S.mode; if (S.god && S.mode === 'pick') bookPage = 1 + GOD_KEYS.indexOf(S.god); S.mode = 'book'; modeT = 0; renderOverlay(); ov.scrollTop = 0; }
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
