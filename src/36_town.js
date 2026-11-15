// ───────────────────────── La plaza del reino ─────────────────────────
// Entre encargos Alec pasea por la plaza: cada sitio abre su parte de lo que antes era un solo menú.
const PLACES = {
  board: { name: 'El tablón de encargos', tabs: ['map'] },
  forge: { name: 'La forja', tabs: ['gun', 'syn'] },
  gym: { name: 'El patio de armas', tabs: ['tree'] },
  inn: { name: 'La posada · tu habitación', tabs: ['room'] },
  king: { name: 'El salón del trono', tabs: ['king'] },
};
let forgePlace = 'board';
function openTown(from) {
  newGame();
  const IN = { hall: ['hall', 'hall'], forge: ['forgeroom', 'shop'], inn: ['innroom', 'shop'] }, kind = IN[from] || ['plaza', 'plaza'];
  const room = buildRoom(false, kind[0], kind[1]);
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.traps = [];
  S.town = { spots: room.out.spots, npcs: room.out.npcs.slice(), near: null };
  for (const w of room.out.wander || []) { const [ax, ay, aw, ah] = w.area, n = { key: w.key, x: ax + Math.random() * aw, y: ay + Math.random() * ah, area: w.area, tx: 0, ty: 0, wait: Math.random() * 2, walking: false }; n.tx = n.x; n.ty = n.y; S.town.npcs.push(n); }
  S.p.x = room.start.x; S.p.y = room.start.y; S.p.face = Math.PI / 2; S.world = 1;
  const back = { castle: 'king', forgeOut: 'forge', innOut: 'inn' }[from];
  if (back) { const k = room.out.spots.find(s => s.id === back); S.p.x = k.x; S.p.y = k.y + 22; S.p.face = Math.PI / 2; }
  S.mode = 'town'; modeT = 0; renderOverlay();
  if (from === 'hall') sayRaw('[El salón del trono de ' + kingdomNow().name + '.]', C.energy);
  else if (from === 'forge') sayRaw('[La forja. Huele a hierro y a carbón.]', C.energy);
  else if (from === 'inn') sayRaw('[La posada. Hay sitio junto al fuego.]', C.energy);
  else if (!M.metKing && !back) sayRaw('[El rey de ' + kingdomNow().name + ' te espera en el castillo. Los encargos están en el tablón.]', C.energy);
}
function openPlace(id) { forgePlace = id; S.mode = 'forge'; modeT = 0; listSel = -1; forgeTab = PLACES[id].tabs[0]; if (id === 'king' && !M.metKing) { M.metKing = 1; save(); } renderOverlay(); ov.scrollTop = 0; blip(520, 0.06, 'triangle', 0.04, 200); }
function closePlace() { S.mode = 'town'; modeT = 0; renderOverlay(); }
function townUpdate(dt) {
  const p = S.p, mv = Math.hypot(I.mx, I.my);
  S.t += dt;
  if (S.dialog) { talkUpdate(dt); return; }   // mientras se habla, Alec no se mueve
  p.x += I.mx * 96 * dt; p.y += I.my * 96 * dt;
  if (mv > 0.2) p.face = Math.atan2(I.my, I.mx);
  p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
  collide(p, p.r);
  let near = null, bd = 30;
  for (const s of S.town.spots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; near = s; } }
  S.town.near = near;
  for (const n of S.town.npcs) {   // los paseantes van de un sitio a otro de su zona y se paran un rato
    if (!n.area) continue;
    if (n.wait > 0) { n.wait -= dt; n.walking = false; continue; }
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d < 0.1) { const [ax, ay, aw, ah] = n.area; n.tx = ax + Math.random() * aw; n.ty = ay + Math.random() * ah; n.wait = 1 + Math.random() * 3; continue; }
    const st = Math.min(d, 1.4 * dt); n.x += dx / d * st; n.y += dy / d * st; n.walking = true; n.flip = dx < 0;
  }
  if (near && I.atkP && modeT > 0.3) { const inside = S.out && S.out.interior; if (near.id === 'exit') openTown({ throne: 'castle', forge: 'forgeOut', inn: 'innOut' }[inside]); else if (!inside && ['king', 'forge', 'inn'].includes(near.id)) { openTown({ king: 'hall', forge: 'forge', inn: 'inn' }[near.id]); blip(420, 0.08, 'triangle', 0.04, 160); } else if (near.id === 'king' && inside === 'throne') talkKing(); else if (FIRST_TALK[near.id] && !(M.met || {})[near.id]) { M.met = M.met || {}; M.met[near.id] = 1; save(); const id = near.id; talk(FIRST_TALK[id], null, () => openPlace(id)); } else openPlace(near.id); }
}
// Vecinos, muñecos del patio y el aviso del sitio más cercano
function drawTown() {
  const tw = S.town, p = S.p;
  for (const n of tw.npcs.slice().sort((a, b) => a.y - b.y)) {
    const x = n.x * CELL, y = n.y * CELL;
    ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(x, y, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawChar(n.key, n.walking ? 'move' : 'idle', S.t + x * 0.01, x, y, !!n.flip, false);
  }
  if (!S.dialog) for (const s of tw.spots) {
    const on = s === tw.near, b = Math.round(Math.sin(S.t * 5 + s.x) * 1.5);
    ctx.fillStyle = on ? C.energy : '#efe6c8'; ctx.globalAlpha = on ? 1 : 0.7;
    ctx.fillRect(s.x - 2, s.y - 30 + b, 5, 3); ctx.fillRect(s.x - 1, s.y - 27 + b, 3, 1); ctx.fillRect(s.x, s.y - 26 + b, 1, 1); ctx.globalAlpha = 1;
    wtext(s.label, s.x, s.y - 34 + b, on ? 7 : 6, on ? C.energy : '#efe6c8', on ? 1 : 0.75);
  }
  if (tw.near && !S.dialog) wtext(lastDev === 'pad' ? 'A: entrar' : lastDev === 'touch' ? 'Disparar: entrar' : 'Espacio: entrar', p.x, p.y + 22, 6, C.ink, 0.95);
}
// El rey: por qué te ha contratado y cuánto falta
function kingHtml() {
  const K = kingdomNow(), down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length, god = TYPES[K.god].name, dead = isDone(K.id + ':g');
  const say = dead ? `«${god} ha caído. No sé qué eres, Alec, pero mi reino te debe más de lo que puedo pagar. Otros reyes preguntarán por ti.»`
    : down === 4 ? `«Los cuatro guardianes han caído y ${god} ya no tiene tras quién esconderse. Sal a buscarlo antes de que venga él.»`
    : down ? `«${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Mis hombres vuelven a mirar a los ojos. Quedan ${4 - down}; mientras sigan en pie, ${god} no dará la cara.»`
    : `«Así que tú eres el mercenario que no reza. Bien. Mis soldados sí rezaban, y mira de qué les sirvió. ${K.lore.split('. ')[1] || ''} Cuatro guardianes le sostienen; mátalos y ${god} tendrá que salir. Pago en hierro y no hago preguntas.»`;
  return `<p class="lead">${K.title}. ${K.lore.split('. ')[0]}.</p><p class="lead" style="font-style:italic">${say}</p>
    <p class="fine">Encargos cumplidos: <b>${jobs}</b> de 12 · Guardianes caídos: <b>${down}</b> de 4 · ${god}: <b>${dead ? 'muerto' : 'vivo'}</b>. Los encargos se cogen en el tablón de la plaza.</p>`;
}
// Tu habitación en la posada: lo que llevas hecho
function roomHtml() {
  const K = kingdomNow(), hrs = (M.time || 0) / 3600, hm = h => (h < 1 ? Math.round(h * 60) + ' min' : h.toFixed(1) + ' h');
  const heads = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).map(z => TYPES[WORLDS[z].boss].name); if (isDone(K.id + ':g')) heads.push(TYPES[K.god].name);
  const forged = PARTS.filter(x => M.parts[x.id] === 2).length, known = PARTS.filter(x => M.parts[x.id]).length;
  return `<p class="lead">Una cama, un baúl y una pared para los trofeos. Aquí se guarda todo lo que haces: no hace falta que hagas nada para guardar.</p>
    <div class="forge"><section><h3>Trofeos en la pared</h3>${heads.length ? heads.map(h => `<p class="fine">· ${h}</p>`).join('') : '<p class="fine">La pared está vacía. Todavía.</p>'}</section>
    <section><h3>El baúl</h3><p class="fine">${M.runs} encargos aceptados, ${M.wins} cumplidos · ${hm(hrs)} de camino · ${M.earned || 0} almas ganadas en total</p><p class="fine">${known} piezas de arma descubiertas de ${PARTS.length}, ${forged} forjadas</p><p class="fine">Arma actual: ${gunName(M.gun)}</p></section></div>`;
}

// ───────────────────────── Conversaciones con bocadillos ─────────────────────────
// Cada línea: quién habla y qué dice. Se escribe letra a letra; A (o Espacio) acaba la línea o pasa a la siguiente,
// B (o Shift) se salta la conversación. Al final puede haber opciones para elegir con arriba y abajo.
function talk(lines, choices, onEnd) { S.dialog = { lines, i: 0, ch: 0, choices: choices || null, sel: 0, t: 0, onEnd: onEnd || null }; blip(500, 0.05, 'triangle', 0.03, 120); }
function talkUpdate(dt) {
  const d = S.dialog, L = d.lines[d.i];
  if (L) d.ch = Math.min(L.text.length, d.ch + dt * 55);
  d.t += dt;
  if (I.dodgeP && !(d.choices && d.i >= d.lines.length)) { d.i = d.lines.length; d.ch = 0; if (!d.choices) { S.dialog = null; modeT = 0; if (d.onEnd) d.onEnd(); } return; }
  if (d.i >= d.lines.length && d.choices) {
    if (I.navY) { d.sel = (d.sel + (I.navY > 0 ? 1 : d.choices.length - 1)) % d.choices.length; blip(700, 0.03, 'triangle', 0.03); }
    if (I.atkP && d.t > 0.2) { const c = d.choices[d.sel]; S.dialog = null; modeT = 0; c.fn(); }
    return;
  }
  if (I.atkP && d.t > 0.15) {
    if (d.ch < L.text.length) d.ch = L.text.length;
    else { d.i++; d.ch = 0; d.t = 0; if (d.i >= d.lines.length && !d.choices) { S.dialog = null; modeT = 0; if (d.onEnd) d.onEnd(); } else blip(620, 0.02, 'triangle', 0.02); }
  }
}
function speakerPos(who) {
  if (who === 'alec') return { x: S.p.x, y: S.p.y - 26 };
  const n = S.town && S.town.npcs.find(q => q.key === who);
  return n ? { x: n.x * CELL, y: n.y * CELL - 30 } : { x: S.p.x, y: S.p.y - 26 };
}
const SPEAKER = { smith: ['La herrera', '#ff9a5c'], keeper: ['La posadera', '#e6c07a'], trainer: ['La instructora', '#9fe09a'], king: ['El rey', '#f2c14e'], queen: ['La reina', '#e6a0c4'], alec: ['Alec', '#9fd3ff'] };
function wrapText(ctx2, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx2.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function drawDialog(k) {
  const d = S.dialog, g = scr, dp = view.dpr, fs = Math.round(15 * dp), pad = 10 * dp, lh = fs * 1.35, maxW = Math.min(360 * dp, cv.width * 0.62);
  g.save(); g.textAlign = 'left'; g.textBaseline = 'top';
  const box = (x, y, w, h, tail) => {   // bocadillo redondeado con pico hacia quien habla
    g.fillStyle = 'rgba(16,12,20,0.94)'; g.strokeStyle = '#efe6c8'; g.lineWidth = 2 * dp; const r = 8 * dp;
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    if (tail) { g.lineTo(tail.x + 8 * dp, y + h); g.lineTo(tail.x, tail.y); g.lineTo(tail.x - 8 * dp, y + h); }
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); g.fill(); g.stroke();
  };
  if (d.i < d.lines.length) {
    const L = d.lines[d.i], sp = SPEAKER[L.who] || [L.who, '#efe6c8'], at = speakerPos(L.who), sx = (at.x - cam.x) * k, sy = (at.y - cam.y) * k;
    g.font = `500 ${fs}px ${FONT}`;
    const lines = wrapText(g, L.text, maxW), shown = L.text.slice(0, Math.floor(d.ch));
    const w = Math.max(...lines.map(t => g.measureText(t).width), 120 * dp) + pad * 2, h = lines.length * lh + pad * 2 + fs * 1.1;
    let bx = clamp(sx - w / 2, 8 * dp, cv.width - w - 8 * dp), by = sy - h - 14 * dp; if (by < 8 * dp) by = 8 * dp;
    box(bx, by, w, h, { x: clamp(sx, bx + 14 * dp, bx + w - 14 * dp), y: Math.min(sy - 4 * dp, by + h + 12 * dp) });
    g.font = `700 ${Math.round(fs * 0.85)}px ${FONT}`; g.fillStyle = sp[1]; g.fillText(sp[0], bx + pad, by + pad * 0.7);
    g.font = `500 ${fs}px ${FONT}`; g.fillStyle = '#efe6c8';
    let left = shown.length;
    lines.forEach((t, i) => { if (left <= 0) return; const part = t.slice(0, left); g.fillText(part, bx + pad, by + pad + fs * 1.1 + i * lh); left -= t.length + 1; });
    if (d.ch >= L.text.length && Math.floor(S.t * 3) % 2 === 0) { g.fillStyle = sp[1]; g.fillText('▸', bx + w - pad - fs * 0.6, by + h - pad - fs * 0.9); }
    g.font = `500 ${Math.round(fs * 0.7)}px ${FONT}`; g.fillStyle = 'rgba(239,230,200,0.7)'; g.textAlign = 'center';
    g.fillText(lastDev === 'pad' ? 'A: seguir · B: saltar' : 'Espacio: seguir · Shift: saltar', cv.width / 2, cv.height - 58 * dp);
  } else if (d.choices) {   // opciones de respuesta de Alec
    g.font = `500 ${fs}px ${FONT}`;
    const at = speakerPos('alec'), sx = (at.x - cam.x) * k, sy = (at.y - cam.y) * k;
    const w = Math.max(...d.choices.map(c => g.measureText('▸ ' + c.label).width)) + pad * 2, h = d.choices.length * lh + pad * 2;
    const bx = clamp(sx - w / 2, 8 * dp, cv.width - w - 8 * dp), by = Math.min(cv.height - h - 70 * dp, sy + 52 * k);   // debajo de Alec, para no tapar a quien le habla
    box(bx, by, w, h, null);
    d.choices.forEach((c, i) => { g.fillStyle = i === d.sel ? '#f2c14e' : '#efe6c8'; g.fillText((i === d.sel ? '▸ ' : '  ') + c.label, bx + pad, by + pad + i * lh); });
  }
  g.restore();
}
// El rey: la primera vez te explica el contrato entero; después te dice cómo vas y te deja preguntar
function kingExplain() {
  const K = kingdomNow(), god = TYPES[K.god].name, zones = K.zones.map(z => z.name);
  return [
    { who: 'king', text: `El ${god} se ha quedado con medio reino. Sus ejércitos salen de cuatro sitios: ${zones.slice(0, 3).join(', ')} y ${zones[3]}.` },
    { who: 'king', text: 'En cada zona hay tres encargos, y los tienes en el tablón de la plaza: limpiar un lugar sala a sala, defender una aldea o asaltar un campamento.' },
    { who: 'king', text: 'Cuando cumplas los tres de una zona, saldrá su guardián. Mata a los cuatro guardianes y el dios no tendrá dónde esconderse.' },
    { who: 'king', text: 'Por el camino, los dioses menores te ofrecerán sus técnicas. Úsalas sin miedo: solo te duran ese encargo.' },
    { who: 'king', text: 'Lo que ganes, en cambio, es tuyo: almas para entrenar en el patio de armas, y hierro y materiales para mejorar tu ballesta en la forja.' },
    { who: 'king', text: 'Y si caes, te retiras y vuelves a intentarlo. En la posada tienes cama y siempre habrá otro encargo.' },
  ];
}
function kingProgress() {
  const K = kingdomNow(), god = TYPES[K.god].name, down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  if (isDone(K.id + ':g')) return [{ who: 'king', text: `${god} ha caído. No sé qué eres, Alec, pero mi reino te debe más de lo que puedo pagar.` }, { who: 'queen', text: 'Otros reyes ya preguntan por ti.' }];
  if (down === 4) return [{ who: 'king', text: `Los cuatro guardianes han caído. ${god} ya no tiene tras quién esconderse: búscalo en el tablón antes de que venga él.` }];
  if (down) return [{ who: 'king', text: `${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Mis soldados vuelven a mirar a los ojos.` }, { who: 'king', text: `Quedan ${4 - down}. Mientras sigan en pie, ${god} no dará la cara.` }];
  if (jobs) return [{ who: 'king', text: `${jobs === 1 ? 'Un encargo cumplido' : jobs + ' encargos cumplidos'}. Bien. Cumple los tres de una zona y saldrá su guardián.` }];
  return [{ who: 'king', text: 'El tablón de la plaza sigue lleno de encargos, mercenario. ¿A qué esperas?' }];
}
function talkKing() {
  const first = !M.metKing;
  if (first) { M.metKing = 1; save(); }
  const opts = [{ label: 'Explícame otra vez cómo va esto', fn: () => talk(kingExplain(), opts) }, { label: 'Ver cómo voy en el reino', fn: () => openPlace('king') }, { label: 'Nada más. Me voy', fn: () => {} }];
  if (first) talk([
    { who: 'king', text: 'Así que tú eres Alec, el mercenario que no reza. Acércate.' },
    { who: 'alec', text: 'Me dijeron que pagáis en hierro.' },
    { who: 'king', text: 'Y pago bien. Escucha, porque solo lo diré una vez.' },
    ...kingExplain(),
    { who: 'queen', text: 'No le asustes. Es el primero en meses que se ofrece voluntario.' },
    { who: 'alec', text: '¿Y si mato a vuestro dios?' },
    { who: 'king', text: 'Entonces te deberé más de lo que puedo pagar. Ve. El tablón está en la plaza.' },
  ], opts);
  else talk(kingProgress(), opts);
}

// La primera vez que usas la forja, la posada o el patio de armas, quien lo atiende te explica para qué sirve
const FIRST_TALK = {
  forge: [
    { who: 'smith', text: 'Así que tú eres el que se ha ofrecido. Déjame ver esa ballesta.' },
    { who: 'smith', text: 'Tu arma tiene cinco partes: Cañón, Llave, Munición, Culata y Recámara. Cada una cambia una cosa de cómo disparas.' },
    { who: 'smith', text: 'En los encargos encontrarás piezas nuevas. Tráeme Hierro Místico y materiales y te las forjo. Una vez forjada, la pieza es tuya para siempre.' },
    { who: 'smith', text: 'Algunas piezas se llevan bien entre sí o con ciertas técnicas. Lo verás en la pestaña de Sinergias.' },
  ],
  inn: [
    { who: 'keeper', text: 'Bienvenido, mercenario. Tu habitación está arriba.' },
    { who: 'keeper', text: 'Ahí cuelgo tus trofeos y apunto lo que llevas hecho. Lo tuyo se guarda solo: no tienes que hacer nada.' },
  ],
  gym: [
    { who: 'trainer', text: '¿Vienes a entrenar? Las almas que traes de los encargos se gastan aquí.' },
    { who: 'trainer', text: 'Cada habilidad que aprendes te hace más fuerte para siempre: más vida, más daño, más esquives… Elige con cabeza.' },
  ],
};
