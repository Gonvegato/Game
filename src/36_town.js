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
  const room = buildRoom(false, from === 'hall' ? 'hall' : 'plaza', from === 'hall' ? 'hall' : 'plaza');
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.traps = [];
  S.town = { spots: room.out.spots, npcs: room.out.npcs, near: null };
  S.p.x = room.start.x; S.p.y = room.start.y; S.p.face = Math.PI / 2; S.world = 1;
  if (from === 'castle') { const k = room.out.spots.find(s => s.id === 'king'); S.p.x = k.x; S.p.y = k.y + 20; S.p.face = Math.PI / 2; }
  S.mode = 'town'; modeT = 0; renderOverlay();
  if (from === 'hall') sayRaw('[El salón del trono de ' + kingdomNow().name + '.]', C.energy);
  else if (!M.metKing && from !== 'castle') sayRaw('[El rey de ' + kingdomNow().name + ' te espera en el castillo. Los encargos están en el tablón.]', C.energy);
}
function openPlace(id) { forgePlace = id; S.mode = 'forge'; modeT = 0; listSel = -1; forgeTab = PLACES[id].tabs[0]; if (id === 'king' && !M.metKing) { M.metKing = 1; save(); } renderOverlay(); ov.scrollTop = 0; blip(520, 0.06, 'triangle', 0.04, 200); }
function closePlace() { S.mode = 'town'; modeT = 0; renderOverlay(); }
function townUpdate(dt) {
  const p = S.p, mv = Math.hypot(I.mx, I.my);
  S.t += dt;
  p.x += I.mx * 96 * dt; p.y += I.my * 96 * dt;
  if (mv > 0.2) p.face = Math.atan2(I.my, I.mx);
  p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
  collide(p, p.r);
  let near = null, bd = 30;
  for (const s of S.town.spots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; near = s; } }
  S.town.near = near;
  if (near && I.atkP && modeT > 0.3) { if (near.id === 'exit') openTown('castle'); else if (near.id === 'king' && S.out && !S.out.interior) { openTown('hall'); blip(420, 0.08, 'triangle', 0.04, 160); } else openPlace(near.id); }
}
// Vecinos, muñecos del patio y el aviso del sitio más cercano
function drawTown() {
  const tw = S.town, p = S.p;
  for (const n of tw.npcs) {
    const x = n.x * CELL, y = n.y * CELL;
    ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(x, y, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawChar(n.key, 'idle', S.t + x * 0.01, x, y, !!n.flip, false);
  }
  for (const s of tw.spots) {
    const on = s === tw.near, b = Math.round(Math.sin(S.t * 5 + s.x) * 1.5);
    ctx.fillStyle = on ? C.energy : '#efe6c8'; ctx.globalAlpha = on ? 1 : 0.7;
    ctx.fillRect(s.x - 2, s.y - 30 + b, 5, 3); ctx.fillRect(s.x - 1, s.y - 27 + b, 3, 1); ctx.fillRect(s.x, s.y - 26 + b, 1, 1); ctx.globalAlpha = 1;
    wtext(s.label, s.x, s.y - 34 + b, on ? 7 : 6, on ? C.energy : '#efe6c8', on ? 1 : 0.75);
  }
  if (tw.near) wtext(lastDev === 'pad' ? 'A: entrar' : lastDev === 'touch' ? 'Disparar: entrar' : 'Espacio: entrar', p.x, p.y + 22, 6, C.ink, 0.95);
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
