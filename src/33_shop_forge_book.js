// ───────────────────────── Tienda (antes de cada jefe) ─────────────────────────
function openShop() {
  if (!S.shop || S.shop.wave !== S.wave) {
    const k = 1 + 0.25 * (S.world - 1), pr = n => Math.round(n * k / 5) * 5;
    const god = GOD_KEYS[Math.floor(Math.random() * GOD_KEYS.length)];
    const plan = PLANS.filter(x => !S.plans.has(x.id) && (!x.only || G(x.only))).sort(() => Math.random() - 0.5)[0];
    S.shop = { wave: S.wave, items: [
      { id: 'heal',  name: 'Guiso caliente',         desc: 'Recuperas el 35% de tu vida', price: pr(40) },
      { id: 'tech',  name: 'Arma de contrabando',    desc: `El ${GODS[god].weapon}, de ${GODS[god].title}: lo desmontas y eliges una técnica`, price: pr(90), god },
      { id: 'up',    name: 'Afilar una técnica',     desc: 'Sube un nivel una de las técnicas que llevas, al azar', price: pr(70) },
      { id: 'anvil', name: 'Rato de yunque',         desc: 'Eliges un ajuste del arma: cadencia, daño, alcance o velocidad', price: pr(60) },
      { id: 'heart', name: 'Corazón en conserva',    desc: '+15 de vida máxima', price: pr(70) },
      { id: 'part',  name: 'Pieza de armero',        desc: 'Una pieza para tu arma: eliges entre tres', price: pr(100) },
    ].concat(plan ? [{ id: 'plan', name: 'Plano: ' + plan.name, desc: plan.desc, price: pr(110), plan: plan.id }] : []) };
  }
  listSel = -1; setMode('shop'); ov.scrollTop = 0;
}
function shopHtml() {
  const p = S.p, ms = S.mission, toBoss = hasBoss(ms) && S.room + 1 >= roomsOf(ms), boss = toBoss ? (ms.type === 'god' ? TYPES[KINGDOMS.find(x => x.id === ms.k).god].name : TYPES[WORLDS[S.world - 1].boss].name) : '';
  return `<p class="eyebrow">Tienda · ${S.mission.zone}</p><h1>${toBoss ? 'Antes de ' + boss : 'Un alto en el camino'}</h1><p class="lead">Llevas <b>${Math.floor(p.gold)}</b> de oro y ${Math.ceil(p.hp)} de ${p.maxHp} de vida. El oro no sale de la misión: gástalo.</p><div class="forge"><section>` +
    S.shop.items.map((it, i) => `<button class="fi${it.sold ? ' on' : p.gold >= it.price ? '' : ' off'}" data-act="buy:${i}"><b>${ico({ heal: 'mug', tech: 'sword', up: 'scroll', anvil: 'axe', heart: 'potion', part: 'chest', plan: 'book' }[it.id] || 'gem', it.id === 'tech' ? 1 : 0)}${it.name}</b><span>${it.desc}</span><i>${it.sold ? 'Comprado' : it.price + ' de oro'}</i></button>`).join('') +
    `</section><section><h2>Lo que llevas</h2><ul class="build full">${buildHtml(true)}</ul></section></div><button class="fi primary" data-act="boss">${toBoss ? 'Cruzar la puerta de ' + boss : 'Seguir adelante'}</button>`;
}
function shopAct(act) {
  const [k, i] = act.split(':'), p = S.p;
  if (k === 'boss') {   // salir de la tienda: al jefe, a la siguiente oleada o campamento, o a elegir puerta
    const ms = S.mission, direct = ms.type === 'defend' || ms.type === 'assault' || (hasBoss(ms) && S.room + 1 >= roomsOf(ms));
    if (direct) { S.mode = 'play'; modeT = 0; nextWave(); renderOverlay(); } else { pickQueue = [doorScreen]; advancePick(); }
    return;
  }
  const it = S.shop.items[+i];
  if (it.sold || p.gold < it.price) { blip(140, 0.1, 'sawtooth', 0.05, -40); return; }
  if (it.id === 'up') { const own = SLOT_KEYS.map(s => S.build[s]).filter(c => c && c.lvl < 5); if (!own.length) { blip(140, 0.1, 'sawtooth', 0.05, -40); return; } const c = own[Math.floor(Math.random() * own.length)]; c.lvl += 1; sayRaw('[' + curName(c) + ' sube a nivel ' + ROMAN[c.lvl] + ']', C.ink); }
  p.gold -= it.price; it.sold = true; blip(660, 0.1, 'triangle', 0.05, 400);
  if (it.id === 'heal') p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35));
  else if (it.id === 'heart') { p.maxHp += 15; p.hp += 15; }
  else if (it.id === 'plan') { S.plans.add(it.plan); p.dodgeN = dodgeMax(); }
  else if (it.id === 'tech') { S.rerolls = 0; pickQueue = [pieceScreen(it.god, 'Tienda · ' + GODS[it.god].title)]; afterPicks = openShop; advancePick(); return; }
  else if (it.id === 'anvil') { pickQueue = [statScreen]; afterPicks = openShop; advancePick(); return; }
  else if (it.id === 'part') { pickQueue = [partScreen('Tienda · pieza de armero')]; afterPicks = openShop; advancePick(); return; }
  renderOverlay();
}

// ───────────────────────── La forja (entre vidas) ─────────────────────────
function openForge() { S.mode = 'forge'; modeT = 0; listSel = -1; forgeTab = 'map'; renderOverlay(); ov.scrollTop = 0; }
// La forja va por pestañas para no ser una lista sin fin: el mapa del contrato, el arma (un apartado cada vez), las sinergias y el árbol.
let forgeTab = 'map', forgeSlot = 'barrel';
const FORGE_TABS = [['map', 'Contrato'], ['gun', 'Arma'], ['syn', 'Sinergias'], ['tree', 'Árbol']];
function forgeHtml() {
  const matChips = GOD_KEYS.filter(g => M.mats[g] > 0).map(g => `<span style="color:${GODS[g].color}">${M.mats[g]} ${GODS[g].mat}</span>`).join(' · ');
  const head = `<p class="eyebrow">La forja de Alec · ${M.runs} ${M.runs === 1 ? 'encargo' : 'encargos'} a la espalda</p>
    <div class="fhead"><h1>${gunName(M.gun)}</h1><p class="lead"><b>${M.souls}</b> almas · <b>${M.iron}</b> Hierro Místico${matChips ? ' · ' + matChips : ''}</p></div>
    <div class="tabs">${FORGE_TABS.map(([id, nm]) => `<button class="fi tab${forgeTab === id ? ' on' : ''}" data-act="tab:${id}"><b>${nm}</b></button>`).join('')}</div>`;
  let body = '';
  if (forgeTab === 'map') {
    const go = M.run ? `<button class="fi primary" data-act="resume">Continuar: ${M.run.mission.name}, tramo ${M.run.wave + 1}</button>` : '';
    body = `${go}<div class="kingdom">${mapHtml()}</div><p class="fine">Cada misión empieza de cero: lo que robes a los dioses no sale de ella. Las almas pagan tu árbol; el Hierro Místico y los materiales, las piezas de tu arma. Si caes, te retiras con lo que llevabas y lo vuelves a intentar.</p>`;
  } else if (forgeTab === 'gun') {
    const k = forgeSlot, all = PARTS.filter(x => x.slot === k), known = all.filter(x => M.parts[x.id]);
    const rank = x => (M.gun[k] === x.id ? 0 : M.parts[x.id] === 2 ? 1 : canPay(x.cost) ? 2 : 3);
    known.sort((a, b) => rank(a) - rank(b));
    const on = ensOf(M.gun), L = legOf(M.gun);
    body = `<p class="fine">Cada apartado decide una cosa. Elige un apartado y debajo salen sus piezas: las que descubras en las misiones aparecen aquí, y forjarlas una vez te deja empezar con ellas.${L ? ` <b class="gold">Arma legendaria: ${L.name}.</b>` : ''}${on.length ? ` <b class="gold">Ensambles activos: ${on.map(E => E.name).join(', ')}.</b>` : ''}</p>
      <div class="slots">${GSLOT_KEYS.map(sk => { const n = PARTS.filter(x => x.slot === sk), kn = n.filter(x => M.parts[x.id]).length;
        return `<button class="fi slot${sk === k ? ' on' : ''}" data-act="slot:${sk}"><b>${GSLOTS[sk]}</b><span>${PART[M.gun[sk]].name}</span><i>${kn}/${n.length}</i></button>`; }).join('')}</div>
      <h3>${GSLOTS[k]} · ${GSLOT_WHAT[k]}</h3><div class="plist">` +
      known.map(x => { const mounted = M.gun[k] === x.id, forged = M.parts[x.id] === 2;
        return `<button class="fi${mounted ? ' on' : forged || canPay(x.cost) ? '' : ' off'}" data-act="p:${x.id}"><b>${x.name}${x.base ? '' : ` <u>${x.tag}</u>`}</b><span>${x.desc}</span>${affHint(x.id)}${legHint(x.id)}<i>${mounted ? 'Montada' : forged ? 'Montar' : 'Forjar: ' + costTxt(x.cost)}</i></button>`; }).join('') +
      `</div>` + (all.length > known.length ? `<p class="fine">${all.length - known.length === 1 ? 'Queda 1 pieza' : 'Quedan ' + (all.length - known.length) + ' piezas'} de este apartado por descubrir.</p>` : '');
  } else if (forgeTab === 'syn') {
    const affs = {}; for (const sk of GSLOT_KEYS) { const g = affGod(M.gun[sk]); if (g) affs[g] = (affs[g] || 0) + 1; }
    const affTxt = Object.keys(affs).length ? Object.keys(affs).map(g => `<li class="own"><em style="color:${GODS[g].color}">${GODS[g].theme} ×${affs[g]}</em><span>Si llevas una técnica suya: ${AFFIN[g]}${affs[g] > 1 ? ', por cada pieza' : ''}.</span></li>`).join('') : '<li><span>Tu arma no lleva ninguna pieza afín a una deidad.</span></li>';
    const reso = RESO.map(R => { const known = R.parts.every(id => M.parts[id]), mounted = R.parts.every(id => M.gun[PART[id].slot] === id);
      return `<li class="${mounted ? 'own' : ''}"><em>${mounted ? 'Montada' : 'Resonancia'}</em><b>${known ? R.name : '???'}</b><span>${R.parts.map(id => (M.parts[id] ? PART[id].name : '???')).join(' + ')} con ${R.techs.map(id => PIECE[id].name + ' (' + GODS[PIECE[id].god].theme + ')').join(' y ')}${known ? '. ' + R.desc : ''}</span></li>`; }).join('');
    body = `<p class="fine">Cuatro formas de que tu arma haga más que la suma de sus piezas. Lo que aún no has descubierto sale como «???».</p>
      <div class="forge"><section><h3>Afinidades de tu arma · pieza con deidad</h3><ul class="build full legends">${affTxt}</ul>${ensHtml(M.gun)}</section>
      <section>${legendsHtml(M.gun)}<h3>Resonancias · una pieza con una técnica concreta</h3><ul class="build full legends">${reso}</ul></section></div>`;
  } else {
    const spent = TREE_NODES.reduce((a, n) => a + n.cost.slice(0, tk(n.id)).reduce((x, y) => x + y, 0), 0), hrs = M.time / 3600;
    const hm = h => (h >= 1 ? Math.floor(h) + ' h ' : '') + Math.round((h % 1) * 60) + ' min';
    const rate = hrs > 0.25 && M.earned > 0 ? M.earned / hrs : 0;
    const pace = `${spent} de ${TREE_TOTAL} almas invertidas (${Math.round(spent / TREE_TOTAL * 100)}%). Tiempo jugado: ${hm(hrs)}.` + (rate ? ` Ganas unas ${Math.round(rate)} almas por hora; a ese ritmo te faltan unas ${Math.max(0, Math.round((TREE_TOTAL - spent - M.souls) / rate))} h para completarlo.` : '');
    body = `<p class="fine">${pace}</p><div class="forge">` + TREE.map(br => `<section><h3>${br.name} · ${br.sub}</h3>` + br.nodes.map(n => { const r = tk(n.id), full = r >= n.max, cost = n.cost[r];
      return `<button class="fi${full ? ' on' : M.souls >= cost ? '' : ' off'}" data-act="t:${n.id}"><b>${n.name} ${r}/${n.max}</b><span>${r ? 'Ahora: ' + n.desc(r) + '. ' : ''}${full ? '' : 'Siguiente: ' + n.desc(r + 1)}</span><i>${full ? 'Al máximo' : cost + ' almas'}</i></button>`; }).join('') + '</section>').join('') + '</div>';
  }
  return head + body + `<p class="fine keyhint">Muévete con el stick izquierdo o la cruceta. El stick derecho desplaza la pantalla. LB (o Q) cambia de pestaña.</p>`;
}
function forgeAct(act) {
  const [k, id, n] = act.split(':');
  let ok = true;
  if (k === 'tab') { forgeTab = id; listSel = FORGE_TABS.findIndex(t => t[0] === id); blip(700, 0.04, 'triangle', 0.03); renderOverlay(); ov.scrollTop = 0; return; }
  if (k === 'slot') { forgeSlot = id; blip(700, 0.04, 'triangle', 0.03); renderOverlay(); return; }
  if (k === 'm') { startRun(missionOf(act.slice(2))); return; }
  if (k === 'x') { blip(140, 0.1, 'sawtooth', 0.05, -40); return; }
  if (k === 'resume') { resumeRun(); return; }
  if (k === 'p') { const x = PART[id]; if (M.parts[id] === 2) M.gun[x.slot] = id; else if (M.parts[id] === 1 && canPay(x.cost)) { pay(x.cost); M.parts[id] = 2; M.gun[x.slot] = id; } else ok = false; }
  else if (k === 't') { const nd = TREE_NODES.find(x => x.id === id), r = tk(id); if (r < nd.max && M.souls >= nd.cost[r]) { M.souls -= nd.cost[r]; M.tree[id] = r + 1; } else ok = false; }
  blip(ok ? 660 : 140, 0.1, ok ? 'triangle' : 'sawtooth', 0.05, ok ? 400 : -40);
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
  if (S.mode === 'forge' && I.tabP) { const i = FORGE_TABS.findIndex(t => t[0] === forgeTab); forgeAct('tab:' + FORGE_TABS[(i + 1) % FORGE_TABS.length][0]); return; }
  const els = [...ovBody.querySelectorAll('.fi')];
  if (I.navX || I.navY) {
    const n = navPick(els, listSel, I.navX, I.navY);
    if (n !== listSel && n >= 0) { listSel = n; els.forEach((el, i) => el.classList.toggle('sel', i === listSel)); els[listSel].scrollIntoView({ block: 'nearest' }); blip(700, 0.03, 'triangle', 0.03); }
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
  const row = (label, color, name, sub) => rows.push(`<li><em style="color:${color}">${label}</em><b>${name}</b>${sub ? `<span>${sub}</span>` : ''}</li>`);
  for (const k of SLOT_KEYS) {
    const cur = S.build[k];
    if (!cur) { if (full) rows.push(`<li><em>${SLOTS[k]}</em><span>Ranura libre</span></li>`); continue; }
    const D = DUO[cur.id];
    if (D) row(SLOTS[k], RAR[3].color, D.name + ' ' + ROMAN[cur.lvl], full ? D.desc + ' ' + PIECE[D.a].desc(cur.lvl) + ' ' + PIECE[D.b].desc(cur.lvl) : '');
    else row(SLOTS[k], GODS[PIECE[cur.id].god].color, PIECE[cur.id].name + ' ' + ROMAN[cur.lvl], full ? PIECE[cur.id].desc(cur.lvl) : '');
  }
  for (const g of GOD_KEYS) if (mastery(g)) row('Maestría', GODS[g].color, MASTERY[g].name, full ? MASTERY[g].desc : '');
  for (const R of RESO) if (res(R.id)) row('Resonancia', RAR[3].color, R.name, full ? R.desc : '');
  for (const E of ensOf(S.gun)) row('Ensamble', C.energy, E.name, full ? E.desc : '');
  for (const g of GOD_KEYS) { const a = aff(g); if (a) row('Afinidad', GODS[g].color, GODS[g].theme + ' ×' + a, full ? AFFIN[g] + (a > 1 ? ', por cada una de tus ' + a + ' piezas afines' : '') + '.' : ''); }
  if (full) for (const k of GSLOT_KEYS) { const x = PART[S.gun[k]]; row(GSLOTS[k], C.energy, x.name, x.desc); }
  const techs = TECHS.filter(t => S.techs.has(t.id)), plans = PLANS.filter(x => S.plans.has(x.id));
  if (full) { for (const t of techs) row('Técnica', RAR[t.rar].color, t.name, t.desc); for (const x of plans) row('Plano', C.ink, x.name, x.desc); }
  else { if (techs.length) row('Técnicas', C.dim, techs.map(t => t.name).join(', ')); if (plans.length) row('Planos', C.dim, plans.map(x => x.name).join(', ')); }
  return rows.join('');
}
function bookHtml() {
  let h = `<p class="eyebrow">Recetario del herrero</p><h1>Lo que se les puede robar</h1><p class="fine">En blanco, lo que ya llevas. Cabe una técnica por acción. Si llevas la de una deidad y otra te ofrece la suya para esa misma acción, te ofrece el dúo de las dos.</p><div class="book">`;
  for (const g of GOD_KEYS) {
    const n = godCount(g), G = GODS[g];
    h += `<section><h2 style="color:${G.color}">${G.title}</h2><p class="fine">${G.theme}. ${G.key}</p><ul class="build full">` +
      PIECES.filter(x => x.god === g).map(pc => { const l = lv(pc.id); return `<li class="${l ? 'own' : ''}"><em>${SLOTS[pc.slot]}</em><b>${pc.name}${l ? ' ' + ROMAN[l] : ''}</b><span>${pc.desc(Math.max(1, l))}</span></li>`; }).join('') +
      TECHS.filter(t => t.god === g).map(t => `<li class="${S.techs.has(t.id) ? 'own' : ''}"><em style="color:${RAR[t.rar].color}">${RAR[t.rar].name}</em><b>${t.name}</b><span>${t.desc} Pide: ${techNeeds(t)}.</span></li>`).join('') +
      `<li class="${n >= 3 ? 'own' : ''}"><em style="color:${G.color}">Maestría</em><b>${MASTERY[g].name} · ${Math.min(n, 3)}/3</b><span>Lleva técnicas suyas en 3 acciones. ${MASTERY[g].desc}</span></li></ul></section>`;
  }
  for (const k of SLOT_KEYS) h += `<section><h2 style="color:${RAR[3].color}">Dúos de ${SLOTS[k].toLowerCase()}</h2><ul class="build full">` +
    DUOS.filter(d => d.slot === k).map(d => `<li class="${duoOn(d.id) ? 'own' : ''}"><em>${GODS[PIECE[d.a].god].theme} + ${GODS[PIECE[d.b].god].theme}</em><b>${d.name}</b><span>${PIECE[d.a].name} + ${PIECE[d.b].name}. ${d.desc}</span></li>`).join('') + `</ul></section>`;
  h += `<section><h2 style="color:${RAR[3].color}">Resonancias</h2><p class="fine">Una pieza del arma y una técnica de una deidad que, juntas, despiertan algo. Se activan solas.</p><ul class="build full">` +
    RESO.map(R => `<li class="${res(R.id) ? 'own' : ''}"><em>${R.parts.map(id => GSLOTS[PART[id].slot]).join(' + ')}</em><b>${R.name}</b><span>${R.parts.map(id => (M.parts[id] ? PART[id].name : 'una pieza sin descubrir')).join(' + ')} y ${R.techs.map(id => PIECE[id].name + ' (' + GODS[PIECE[id].god].theme + ')').join(' + ')}. ${R.desc}</span></li>`).join('') + `</ul></section>`;
  h += `<section><h2>Piezas del arma</h2><ul class="build full">` + PARTS.filter(x => M.parts[x.id]).map(x => `<li class="${G(x.id) ? 'own' : ''}"><em>${GSLOTS[x.slot]}</em><b>${x.name} · ${x.tag}</b><span>${x.desc}</span></li>`).join('') +
    `<li><em>Faltan</em><span>${PARTS.filter(x => !M.parts[x.id]).length} piezas por descubrir.</span></li></ul></section>`;
  h += `<section><h2>Planos</h2><ul class="build full">` + PLANS.map(x => `<li class="${S.plans.has(x.id) ? 'own' : ''}"><em>Plano</em><b>${x.name}</b><span>${x.desc}</span></li>`).join('') + `</ul></section>`;
  return h + `</div><button id="ovBtn" class="primary">Volver</button>`;
}
function openBook() { bookFrom = S.mode; S.mode = 'book'; modeT = 0; renderOverlay(); ov.scrollTop = 0; }
function closeBook() { S.mode = bookFrom; modeT = 0; renderOverlay(); }


// Armas legendarias en la forja: qué piezas piden (las que no has descubierto salen como ???) y cuál llevas montada
function legendsHtml(g) {
  const cur = legOf(g);
  return `<h3>Armas legendarias · tres piezas concretas a la vez</h3><ul class="build full legends">` + LEGENDS.map(L => {
    const known = (M.legends || {})[L.id] || L.parts.every(id => M.parts[id]);
    return `<li class="${cur === L ? 'own' : ''}"><em>${cur === L ? 'Montada' : 'Legendaria'}</em><b>${known ? L.name : '???'}</b><span>${L.parts.map(id => (M.parts[id] ? (g[PART[id].slot] === id ? '✔ ' : '') + PART[id].name : '???')).join(' + ')}${known ? '. ' + L.desc + ' <i>' + L.lore + '</i>' : ''}</span></li>`; }).join('') + '</ul>';
}
// En cada pieza de la forja: si forma parte de un arma legendaria cuyas piezas ya conoces, lo dice
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
