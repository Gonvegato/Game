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
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.traps = []; S.solidProps = [];
  S.town = { spots: room.out.spots, npcs: room.out.npcs.slice(), near: null };
  for (const w of room.out.wander || []) { const [ax, ay, aw, ah] = w.area, n = { key: w.key, x: ax + Math.random() * aw, y: ay + Math.random() * ah, area: w.area, tx: 0, ty: 0, wait: Math.random() * 2, walking: false }; n.tx = n.x; n.ty = n.y; S.town.npcs.push(n); }
  S.p.x = room.start.x; S.p.y = room.start.y; S.p.face = Math.PI / 2; S.world = 1;
  const back = { castle: 'king', forgeOut: 'forge', innOut: 'inn' }[from];
  if (back) { const k = room.out.spots.find(s => s.id === back); S.p.x = k.x; S.p.y = k.y + 22; S.p.face = Math.PI / 2; }
  S.mode = 'town'; modeT = 0; renderOverlay(); tipClear();
  if (kind[0] === 'plaza') { if (M.souls > 0) tip('souls'); if (M.iron > 0) tip('iron'); }   // la primera vez que vuelves con algo, para qué sirve
  if (from === 'hall') sayRaw('[El salón del trono de ' + kingdomNow().name + '.]', C.energy);
  else if (from === 'forge') sayRaw('[La forja. Huele a hierro y a carbón.]', C.energy);
  else if (from === 'inn') sayRaw('[La posada. Hay sitio junto al fuego.]', C.energy);
  else if (!M.metKing && !back) sayRaw('[El rey de ' + kingdomNow().name + ' te espera en el castillo. Los encargos están en el tablón.]', C.energy);
}
function openPlace(id) { forgePlace = id; S.mode = 'forge'; modeT = 0; listSel = -1; forgeTab = PLACES[id].tabs[0]; if (id === 'king' && !M.metKing) { M.metKing = 1; save(); } renderOverlay(); ov.scrollTop = 0; sfx('ok', 0.35); }
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
  if (near && I.atkP && modeT > 0.3) { const inside = S.out && S.out.interior; if (near.id === 'exit') openTown({ throne: 'castle', forge: 'forgeOut', inn: 'innOut' }[inside]); else if (!inside && ['king', 'forge', 'inn'].includes(near.id)) { openTown({ king: 'hall', forge: 'forge', inn: 'inn' }[near.id]); sfx('ok', 0.35,0.8); } else if (near.id === 'king' && inside === 'throne') talkKing(); else if (near.id === 'queen' && inside === 'throne') talkQueen(); else if (near.id === 'talk') talkTown(near.who); else if (FIRST_TALK[near.id] && !(M.met || {})[near.id]) { M.met = M.met || {}; M.met[near.id] = 1; save(); const id = near.id; talk(FIRST_TALK[id], null, () => openPlace(id)); } else openPlace(near.id); }
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
// Flechas con el icono de cada sitio de la ciudad, en el borde de la pantalla y apuntando hacia él. Cuando el sitio ya se ve
// en pantalla (te has acercado), su flecha desaparece y queda el letrero de encima.
function townPointers() {
  const tw = S.town, im = IMG.cityhouses; if (!tw || !im || (S.out && S.out.interior)) return;
  const R = 11, L = cam.x + 16, Rt = cam.x + view.w - 16, T = cam.y + Math.max(30, view.h * 0.22), B0 = cam.y + view.h - 16, B1 = cam.y + view.h * 0.74;   // ni bajo los botones de arriba ni sobre la barra de vida (abajo a la izquierda)
  const ox = cam.x + view.w / 2, oy = cam.y + view.h / 2, placed = [];
  for (const s of tw.spots) {
    const ic = PLACE_ICON[s.id]; if (!ic) continue;
    const x = s.x, y = s.y - 14;
    if (x > cam.x + 4 && x < cam.x + view.w - 4 && y > cam.y + 4 && y < cam.y + view.h - 4) continue;
    // desde el centro de la pantalla hacia el sitio, hasta el borde del recuadro: cada flecha sale por su lado
    const dx = x - ox, dy = y - oy, kx = dx > 0 ? (Rt - ox) / dx : dx < 0 ? (L - ox) / dx : 1e9, B = dy > 0 && ox + dx * Math.min(kx, (B0 - oy) / dy) < cam.x + view.w * 0.32 ? B1 : B0, k = Math.min(kx, dy > 0 ? (B - oy) / dy : dy < 0 ? (T - oy) / dy : 1e9);
    let px = ox + dx * k, py = oy + dy * k;
    for (let n = 0; n < 6 && placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < 2 * R + 4); n++) {   // si pisa a otra, se corre por el borde
      if (px <= L + 1 || px >= Rt - 1) py = clamp(py + (py > oy ? -1 : 1) * (2 * R + 5), T, B0); else px = clamp(px + (px > ox ? -1 : 1) * (2 * R + 5), L, Rt);
    }
    placed.push([px, py]); px = Math.round(px); py = Math.round(py);
    const a = Math.atan2(y - py, x - px), b = Math.floor(S.t * 3) % 2;
    ctx.save(); ctx.translate(px, py);
    ctx.save(); ctx.rotate(a);   // la punta, por fuera del círculo, hacia el sitio
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.moveTo(R + 7 + b, 0); ctx.lineTo(R - 2, -6); ctx.lineTo(R - 2, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#efe6c8'; ctx.beginPath(); ctx.moveTo(R + 5 + b, 0); ctx.lineTo(R - 1, -4); ctx.lineTo(R - 1, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2e2636'; ctx.beginPath(); ctx.arc(0, 0, R - 1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#efe6c8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.drawImage(im, ic[0], ic[1], ic[2], ic[3], -8, -8, 16, 16);
    ctx.restore();
  }
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
    <section><h3>El baúl</h3><p class="fine">${M.runs} encargos aceptados, ${M.wins} cumplidos · ${hm(hrs)} de camino · ${M.earned || 0} almas ganadas en total</p><p class="fine">${known} piezas de guantelete descubiertas de ${PARTS.length}, ${forged} forjadas</p><p class="fine">Ahora llevas: ${gunName(M.gun)}</p></section></div>
    <button class="fi" data-act="intro"><b>Recordar cómo empezó todo</b><span>El pueblo, el herrero, el elegido y el camino hasta aquí: la historia de Alec, otra vez.</span></button>${M.seenEnding ? `
    <button class="fi" data-act="ending"><b>Recordar el final de ${K.name}</b><span>La caída de ${TYPES[K.god].name}, el pago del rey y el camino que sigue.</span></button>` : ''}`;
}

// ───────────────────────── Conversaciones con bocadillos ─────────────────────────
// Cada línea: quién habla y qué dice. Se escribe letra a letra; A (o Espacio) acaba la línea o pasa a la siguiente,
// B (o Shift) se salta la conversación. Al final puede haber opciones para elegir con arriba y abajo.
function talk(lines, choices, onEnd) { S.dialog = { lines, i: 0, ch: 0, choices: choices || null, sel: 0, t: 0, onEnd: onEnd || null }; sfx('tick', 0.25,1.1); }
function talkUpdate(dt) {
  const d = S.dialog, L = d.lines[d.i];
  if (L) d.ch = Math.min(L.text.length, d.ch + dt * 55);
  d.t += dt;
  if (I.backP && !(d.choices && d.i >= d.lines.length)) { d.i = d.lines.length; d.ch = 0; if (!d.choices) { S.dialog = null; modeT = 0; if (d.onEnd) d.onEnd(); } return; }
  if (d.i >= d.lines.length && d.choices) {
    if (I.navY) { d.sel = (d.sel + (I.navY > 0 ? 1 : d.choices.length - 1)) % d.choices.length; sfx('tick', 0.25); }
    if (I.atkP && d.t > 0.2) { const c = d.choices[d.sel]; S.dialog = null; modeT = 0; c.fn(); }
    return;
  }
  if (I.atkP && d.t > 0.15) {
    if (d.ch < L.text.length) d.ch = L.text.length;
    else { d.i++; d.ch = 0; d.t = 0; if (d.i >= d.lines.length && !d.choices) { S.dialog = null; modeT = 0; if (d.onEnd) d.onEnd(); } else sfx('tick', 0.15,1.3); }
  }
}
function speakerPos(who) {
  if (S.intro) return introSpeakerPos(who);   // en la cinemática hablan sus actores
  if (who === 'alec') return { x: S.p.x, y: S.p.y - 26 };
  const n = S.town && (S.town.npcs.find(q => q.id === who) || S.town.npcs.find(q => q.key === who));
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
  if (d.i < d.lines.length && d.lines[d.i].think) {
    // Pensamiento o recuerdo: nadie lo dice en voz alta. Va abajo, en una franja sin borde ni pico, en cursiva y sin nombre,
    // para que no se confunda con el bocadillo de quien habla.
    const L = d.lines[d.i], sp = SPEAKER[L.who] || [L.who, '#efe6c8'], tw = Math.min(cv.width * 0.8, 640 * dp);
    g.font = `italic 500 ${fs}px ${FONT}`;
    const lines = wrapText(g, L.text, tw - pad * 4), shown = L.text.slice(0, Math.floor(d.ch)), h = lines.length * lh + pad * 2;
    const bx = (cv.width - tw) / 2, by = cv.height - h - 74 * dp;
    const gr = g.createLinearGradient(bx, 0, bx + tw, 0); gr.addColorStop(0, 'rgba(8,6,10,0)'); gr.addColorStop(0.12, 'rgba(8,6,10,0.8)'); gr.addColorStop(0.88, 'rgba(8,6,10,0.8)'); gr.addColorStop(1, 'rgba(8,6,10,0)');
    g.fillStyle = gr; g.fillRect(bx, by, tw, h);
    g.fillStyle = sp[1]; g.globalAlpha = 0.7; g.fillRect(bx + tw * 0.2, by, tw * 0.6, Math.max(1, dp)); g.fillRect(bx + tw * 0.2, by + h - Math.max(1, dp), tw * 0.6, Math.max(1, dp)); g.globalAlpha = 1;
    g.textAlign = 'center'; g.fillStyle = '#d9cfbe';
    let left = shown.length;
    lines.forEach((t, i) => { if (left <= 0) return; g.fillText(t.slice(0, left), cv.width / 2, by + pad + i * lh); left -= t.length + 1; });
    if (d.ch >= L.text.length && Math.floor(S.t * 3) % 2 === 0) { g.fillStyle = sp[1]; g.font = `500 ${fs}px ${FONT}`; g.fillText('▸', bx + tw - pad * 2.5, by + h - pad - fs * 0.9); }
    g.font = `500 ${Math.round(fs * 0.7)}px ${FONT}`; g.fillStyle = 'rgba(239,230,200,0.7)';
    if (!S.intro) g.fillText(lastDev === 'pad' ? 'A: seguir · B: saltar' : 'Espacio: seguir · Shift: saltar', cv.width / 2, cv.height - 58 * dp);
  } else if (d.i < d.lines.length) {
    const L = d.lines[d.i], sp = SPEAKER[L.who] || [L.who, '#efe6c8'], at = speakerPos(L.who), sx = (at.x - cam.x) * k, sy = (at.y - cam.y) * k;
    g.font = `500 ${fs}px ${FONT}`;
    const lines = wrapText(g, L.text, maxW), shown = L.text.slice(0, Math.floor(d.ch));
    const w = Math.max(...lines.map(t => g.measureText(t).width), 120 * dp) + pad * 2 + fs * 1.1, h = lines.length * lh + pad * 2 + fs * 1.1;
    let bx = clamp(sx - w / 2, 8 * dp, cv.width - w - 8 * dp), by = sy - h - 14 * dp; if (by < 8 * dp) by = 8 * dp;
    box(bx, by, w, h, { x: clamp(sx, bx + 14 * dp, bx + w - 14 * dp), y: Math.min(sy - 4 * dp, by + h + 12 * dp) });
    g.font = `700 ${Math.round(fs * 0.85)}px ${FONT}`; g.fillStyle = sp[1]; g.fillText(sp[0], bx + pad, by + pad * 0.7);
    g.font = `500 ${fs}px ${FONT}`; g.fillStyle = '#efe6c8';
    let left = shown.length;
    lines.forEach((t, i) => { if (left <= 0) return; const part = t.slice(0, left); g.fillText(part, bx + pad, by + pad + fs * 1.1 + i * lh); left -= t.length + 1; });
    if (d.ch >= L.text.length && Math.floor(S.t * 3) % 2 === 0) { g.fillStyle = sp[1]; g.fillText('▸', bx + w - pad - fs * 0.6, by + h - pad - fs * 0.9); }
    g.font = `500 ${Math.round(fs * 0.7)}px ${FONT}`; g.fillStyle = 'rgba(239,230,200,0.7)'; g.textAlign = 'center';
    if (!S.intro) g.fillText(lastDev === 'pad' ? 'A: seguir · B: saltar' : 'Espacio: seguir · Shift: saltar', cv.width / 2, cv.height - 58 * dp);   // la cinemática pone su propia ayuda
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
// Nombres con artículo («El Umbral», «La Matriarca del Fango») en mitad de frase: «el Umbral»; y con «de» delante, «del Umbral»
const lc = n => n.replace(/^(El|La|Los|Las) /, m => m.toLowerCase());
const deN = n => /^El /.test(n) ? 'del ' + n.slice(3) : 'de ' + lc(n);
// Lo que ha pasado en el reino, contado por el rey (en la cinemática del principio y cada vez que se lo preguntas)
function kingStory() {
  const K = kingdomNow(), god = TYPES[K.god].name, Z = K.zones.map(z => z.name), B = [0, 1, 2, 3].map(i => TYPES[WORLDS[i].boss].name);
  return [
    { who: 'king', text: `Hace un año, el cielo sobre ${lc(Z[3])} se abrió como una herida. De ahí bajó ${lc(god)}, el dios de la guerra.` },
    { who: 'king', text: 'No pidió oro ni oraciones. Pidió soldados. Las aldeas que se los dieron, perdieron a sus hijos. Las que no, ardieron.' },
    { who: 'king', text: `Después repartió el reino entre sus ejércitos. Los muertos se levantaron en ${lc(Z[0])}. Las bestias anidaron en ${lc(Z[1])}. En ${lc(Z[2])}, los picadores dejaron de picar y empezaron a obedecer.` },
    { who: 'king', text: `Y en cada sitio dejó un guardián: ${lc(B[0])}, ${lc(B[1])}, ${lc(B[2])} y ${lc(B[3])}. Mientras sigan en pie, ${lc(god)} no se mueve ${deN(Z[3])}. No le hace falta.` },
    { who: 'king', text: 'Mandé a mis caballeros. Volvieron tres de cada diez. Algunos, con los ojos rojos y rezándole a quien los había vencido: ahora los llaman elegidos.' },
    { who: 'king', text: 'Los sacerdotes dicen que hay que ofrecerle algo para que se vaya. Yo he enterrado a demasiada gente para creérmelo.' },
  ];
}
function kingExplain() {
  const K = kingdomNow(), god = TYPES[K.god].name, zones = K.zones.map(z => z.name);
  return [
    { who: 'king', text: `${god} se ha quedado con medio reino. Sus ejércitos salen de cuatro sitios: ${zones.slice(0, 3).map(lc).join(', ')} y ${lc(zones[3])}.` },
    { who: 'king', text: 'En cada zona hay tres encargos, y los tienes en el tablón de la plaza: limpiar un lugar sala a sala, defender una aldea o asaltar un campamento.' },
    { who: 'king', text: 'Cuando cumplas los tres de una zona, saldrá su guardián. Mata a los cuatro guardianes y el dios no tendrá dónde esconderse.' },
    { who: 'king', text: 'Por el camino robarás técnicas a los dioses menores. Úsalas sin miedo: solo te duran ese encargo.' },
    { who: 'king', text: 'Al principio solo cuatro de ellos se fijarán en ti. Cada encargo que cumplas atraerá la mirada de otro, hasta veinte.' },
    { who: 'king', text: 'Lo que ganes, en cambio, es tuyo: almas para entrenar en el patio de armas, y hierro y materiales para mejorar tus guanteletes en la forja.' },
    { who: 'king', text: 'Y si caes, te retiras y vuelves a intentarlo. En la posada tienes cama y siempre habrá otro encargo.' },
  ];
}
function kingProgress() {
  const K = kingdomNow(), god = TYPES[K.god].name, down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  if (isDone(K.id + ':g')) return [   // el reino es libre: de momento no hay más encargos que los que ya conoce
    { who: 'king', text: `${god} ha caído y ${K.name} es libre. No sé qué eres, Alec, pero mi reino te debe más de lo que puedo pagar.` },
    { who: 'king', text: 'Por ahora no tengo encargos nuevos que darte. Los del tablón siguen ahí: repite los que quieras. Pagan menos, pero pagan.' },
    { who: 'queen', text: 'Otros reyes ya preguntan por ti. Cuando llegue su carta, serás el primero en saberlo.' }];
  if (down === 4) return [{ who: 'king', text: `Los cuatro guardianes han caído. ${god} ya no tiene tras quién esconderse: búscalo en el tablón antes de que venga él.` }];
  if (down) return [{ who: 'king', text: `${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Mis soldados vuelven a mirar a los ojos.` }, { who: 'king', text: `Quedan ${4 - down}. Mientras sigan en pie, ${god} no dará la cara.` }];
  if (jobs) return [{ who: 'king', text: `${jobs === 1 ? 'Un encargo cumplido' : jobs + ' encargos cumplidos'}. Bien. Cumple los tres de una zona y saldrá su guardián.` }];
  return [{ who: 'king', text: 'El tablón de la plaza sigue lleno de encargos, mercenario. ¿A qué esperas?' }];
}
function talkKing() {
  const first = !M.metKing;
  if (first) { M.metKing = 1; save(); }
  const opts = [{ label: '¿Qué pasó en el reino?', fn: () => talk(kingStory(), opts) }, { label: 'Explícame otra vez cómo va esto', fn: () => talk(kingExplain(), opts) }, { label: 'Ver cómo voy en el reino', fn: () => openPlace('king') }, { label: 'Nada más. Me voy', fn: () => {} }];
  if (first) talk([
    { who: 'king', text: 'Ya sabes lo que ha pasado en mi reino, Alec. Ahora te diré cómo vas a arreglarlo.' },
    { who: 'alec', text: 'Os escucho. Mientras paguéis, os escucho.' },
    ...kingExplain(),
    { who: 'queen', text: 'No le asustes. Es el primero en meses que se ofrece voluntario.' },
    { who: 'alec', text: '¿Y si mato a vuestro dios?' },
    { who: 'king', text: 'Entonces te deberé más de lo que puedo pagar. Ve. El tablón está en la plaza.' },
    { who: 'queen', text: 'Y vuelve de vez en cuando. Aquí arriba solo nos llegan malas noticias: alguna buena no nos vendría mal.' },
  ], opts);
  else talk(kingProgress(), opts);
}

// Vecinos de la ciudad con los que se puede hablar. Cada uno tiene varias cosas que decir y van saliendo por turnos;
// lo que cuentan cambia según cómo vaya el reino: al principio (0), con encargos hechos (1), con guardianes caídos (2) y con el dios muerto (3).
const CITY_TALK = {
  g_puerta: { name: 'Un guardia del castillo', col: '#cfd6de', lines: [
    ['El rey recibe a quien quiera. Pero no le hagas perder el tiempo: duerme poco y lo poco que duerme, mal.', 'Antes éramos cuarenta en la guardia. Ahora somos doce. Los demás se fueron al Umbral con el capitán.', 'La reina baja cada mañana a ver a los heridos. El rey dice que es peligroso. Ella dice que más peligroso es no hacerlo.'],
    ['Han vuelto a llegar carros de las aldeas que limpias. Poca cosa: grano, leña. Pero llegan.', 'El capitán de la guardia no se cree lo que cuentan de ti. Yo sí: te he visto volver.'],
    ['Dicen que has tumbado a un guardián. Hasta el sacerdote ha dejado de hablar de sacrificios.', 'Si caen los cuatro, el dios tendrá que salir de su agujero. Entonces sí que vamos a necesitar suerte.'],
    ['No me lo creo todavía. El Primer Puño, muerto. Esta puerta está abierta para ti a cualquier hora, Alec.'] ] },
  g_puente: { name: 'Un guardia del puente', col: '#cfd6de', lines: [
    ['Por este puente entra lo poco que llega de fuera. Desde que cayó Fuenteseca, casi nada.', 'Si ves a alguien cruzar con los ojos rojos, no le dejes hablar. Los elegidos convencen. Luego matan.', 'El arroyo baja del Nido. Hace un año traía truchas. Ahora trae seda.'],
    ['Ayer cruzó una familia de Robledal. Dijeron que un mercenario les había limpiado la aldea. ¿Fuiste tú?', 'Cada vez cruza más gente hacia dentro y menos hacia fuera. Buena señal, supongo.'],
    ['Los mercaderes vuelven a preguntar por los caminos. Les digo que esperen. Que tú todavía no has acabado.'],
    ['Han vuelto los mercaderes de verdad. Con mulas y todo. Ya ni me acordaba de cómo sonaban las mulas.'] ] },
  v_mercado: { name: 'Una vecina', col: '#e6c07a', lines: [
    ['El pan ha subido otra vez. Con el Nido infestado, el trigo del norte no llega.', 'Mi marido se fue a las Minas de Cristal a trabajar. No ha vuelto. Bueno: dicen que volvió, pero que ya no era él.', 'No te acerques mucho a la plaza por la noche. Los guardias ven bichos en cada sombra, y a veces aciertan.'],
    ['Dicen que eres un mercenario sin dios. Mi madre dice que eso trae mala suerte. Yo digo que peor suerte que esta, imposible.', 'Han vuelto a abrir la panadería del puente. Algo es algo.'],
    ['¿Sabes que los niños juegan a ser tú? Uno hace de dios, otro de Alec, y el dios siempre pierde. Les encanta.'],
    ['Esta noche hay fiesta en la plaza. Si vienes, te invito a algo. Bueno, te invita la posadera, que tiene más dinero que yo.'] ] },
  v_pozo: { name: 'Un vecino', col: '#e6c07a', lines: [
    ['El pozo es lo único de la ciudad que no ha cambiado en un año. Por eso vengo aquí.', 'Yo era carretero. Ahora no hay caminos que valgan. Así que cargo agua.', '¿Has visto el castillo? Antes tenía estandartes de colores. El rey los quitó todos: dice que no hay nada que celebrar.'],
    ['He oído que en las aldeas te dejan comida en la puerta para que pases por allí. Como a los santos. Qué cosas.', 'Si vas al Nido, no toques la seda. Mi cuñado la tocó.'],
    ['Esta mañana el rey ha mandado colgar un estandarte. Uno solo. Ya es algo.'],
    ['Ya puedo volver a ser carretero. A ver quién me enseña a conducir el carro otra vez.'] ] },
  v_terraza: { name: 'Una clienta de la posada', col: '#e6c07a', lines: [
    ['La posadera no te cobra a ti, ¿verdad? A mí me cobra hasta el aire.', 'Aquí se oye todo lo que pasa en el reino. Lo malo es que todo lo que pasa en el reino es malo.', 'Dicen que la herrera fue soldado antes que herrera. No sé si creérmelo. Bueno, sí: has visto cómo da martillazos.'],
    ['Esta noche se brindaba por ti en la barra. No te emociones: también se brindaba por la lluvia.'],
    ['Un cliente decía que los guardianes eran inmortales. Le he dicho que fuera a decírtelo a ti.'],
    ['Dicen que vas a seguir hacia otro reino. Llévate una botella. Allí no tendrán vino como este.'] ] },
  v_patio: { name: 'Un recluta', col: '#9fe09a', lines: [
    ['La instructora nos hace correr alrededor del patio hasta que vomitamos. Dice que en el campo de batalla el que corre vive.', 'Me alisté porque mi pueblo está en las Criptas. Quiero volver. Aunque sea para enterrar a los míos.', 'No te ofendas, pero la instructora dice que pelear como tú es de cobardes: golpear y salir corriendo. Luego dice que es lo más listo que ha visto.'],
    ['Ayer aguanté diez vueltas al patio. La instructora dijo «bien». Es la primera vez que le oigo decirlo.'],
    ['Cuando caigan todos los guardianes, nos mandarán a limpiar lo que quede. Más vale que tú hayas dejado poco.'],
    ['Ahora entrenamos por si vuelven. La instructora dice que siempre vuelven. Ojalá se equivoque.'] ] },
};
function townStage() {
  const K = kingdomNow(), down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  return isDone(K.id + ':g') ? 3 : down ? 2 : jobs ? 1 : 0;
}
function talkTown(who) {
  const C2 = CITY_TALK[who]; if (!C2) return;
  SPEAKER[who] = [C2.name, C2.col];
  const st = townStage(), pool = C2.lines.slice(0, st + 1).flat().filter((_, i, a) => st === 0 || i >= a.length - C2.lines[st].length - 1);   // lo de ahora y algo de antes
  M.talkN = M.talkN || {}; const n = M.talkN[who] = ((M.talkN[who] || 0) + 1);
  talk([{ who, text: pool[(n - 1) % pool.length] }]);
}

// La reina: quién es, cómo ve el reino y qué piensa de Alec. Lo que cuenta cambia según lo que lleves hecho.
function queenNews() {
  const K = kingdomNow(), god = TYPES[K.god].name, down = [0, 1, 2, 3].filter(z => isDone(`${K.id}:${z}:b`)).length, jobs = Object.keys(M.done || {}).filter(id => id.startsWith(K.id) && /:\d$/.test(id)).length;
  if (isDone(K.id + ':g')) return [{ who: 'queen', text: `Esta mañana he bajado al mercado sin escolta. Hacía un año que no podía. La gente ya no habla ${deN(god)}: habla de ti.` }, { who: 'queen', text: 'No te pido que te quedes. Solo que sepas que aquí tienes una casa.' }];
  if (down >= 3) return [{ who: 'queen', text: `Ya solo le queda un guardián. ${god} lo sabe: por las noches, desde las almenas, se ve arder el cielo sobre ${lc(K.zones[3].name)}.` }];
  if (down) return [{ who: 'queen', text: `${down === 1 ? 'Un guardián menos' : down + ' guardianes menos'}. Las madres han vuelto a dejar salir a los niños a la plaza. No sabes lo que eso vale.` }];
  if (jobs) return [{ who: 'queen', text: 'Me cuentan lo que haces ahí fuera. Los aldeanos que salvas vienen a la ciudad a contarlo, y cada vez lo cuentan más grande.' }];
  return [{ who: 'queen', text: 'El rey no duerme. Se pasa la noche mirando el mapa, como si mirándolo fuera a cambiar.' }, { who: 'queen', text: 'Tú no pareces de los que miran mapas.' }];
}
function talkQueen() {
  const K = kingdomNow(), opts = [];
  opts.push({ label: '¿Quién sois?', fn: () => talk([
    { who: 'queen', text: `Nací en ${K.zones[3].m[1].replace('La aldea de ', '')}, en ${lc(K.zones[3].name)}. Mi padre hacía tejas. Me casé con un rey porque bailaba fatal y me hizo reír.` },
    { who: 'queen', text: `Ahora ${K.zones[3].m[1].replace('La aldea de ', '')} está bajo el estandarte negro. Si pasas por allí, mira si sigue en pie la casa de las tejas rojas.` },
    { who: 'alec', text: 'Si sigue en pie, os lo diré.' },
  ], opts) });
  opts.push({ label: '¿Cómo está el reino?', fn: () => talk(queenNews(), opts) });
  opts.push({ label: '¿Qué pensáis de mí?', fn: () => talk([
    { who: 'queen', text: 'Que no haces esto por nosotros, y que no lo escondes. Lo prefiero a cien caballeros que juraban que sí.' },
    { who: 'queen', text: 'Y que algo te quitaron los dioses hace mucho. Tienes la misma mirada que el rey cuando mira el mapa.' },
    { who: 'alec', text: 'Me quitaron lo que tenía. No era mucho.' },
    { who: 'queen', text: 'Lo que uno tiene nunca es poco.' },
  ], opts) });
  opts.push({ label: 'Nada más', fn: () => {} });
  talk([{ who: 'queen', text: M.queenMet ? 'Alec. ¿Vienes a por noticias o a darlas?' : 'Así que el mercenario también habla con reinas. Siéntate, si quieres: el rey tardará.' }], opts);
  if (!M.queenMet) { M.queenMet = 1; save(); }
}

// La primera vez que usas la forja, la posada o el patio de armas, quien lo atiende te explica para qué sirve
const FIRST_TALK = {
  forge: [
    { who: 'smith', text: 'Así que tú eres el que se ha ofrecido. Déjame ver esos guanteletes.' },
    { who: 'smith', text: 'Hm. Buen metal, y mejor mano. Quien los hizo sabía lo que se hacía. ¿Cadenas? Nunca había visto unos que lanzaran cadenas.' },
    { who: 'alec', text: 'Los terminé yo. Los empezó otro.' },
    { who: 'smith', text: 'Tienen cinco partes: Palma, Dedos, Gema, Brazal y Brasa. Cada una cambia una cosa de cómo lanzas tus conjuros.' },
    { who: 'smith', text: 'En los encargos encontrarás piezas nuevas. Tráeme Hierro Místico y materiales y te las forjo. Una vez forjada, la pieza es tuya para siempre.' },
    { who: 'smith', text: 'Algunas piezas se llevan bien entre sí o con ciertas técnicas. Lo verás en la pestaña de Sinergias.' },
  ],
  inn: [
    { who: 'keeper', text: 'Bienvenido, mercenario. Tu habitación está arriba. La del fondo: es la única que no tiene goteras.' },
    { who: 'keeper', text: 'El rey paga la cama. La bebida, no. No me mires así: el rey es rey, no tonto.' },
    { who: 'keeper', text: 'Ahí cuelgo tus trofeos y apunto lo que llevas hecho. Lo tuyo se guarda solo: no tienes que hacer nada.' },
  ],
  gym: [
    { who: 'trainer', text: '¿Vienes a entrenar? Las almas que traes de los encargos se gastan aquí.' },
    { who: 'trainer', text: 'Te he visto pelear desde la muralla. Golpeas y te apartas. Mis reclutas lo llaman cobardía. Yo lo llamo seguir vivo.' },
    { who: 'trainer', text: 'Cada habilidad que aprendes te hace más fuerte para siempre: más vida, más daño, más esquives… Elige con cabeza.' },
  ],
};
