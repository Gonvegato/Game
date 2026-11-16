// ───────────────────────── La calma: lo que pasa cuando no hay pelea ─────────────────────────
// Monedas que sueltan los enemigos, cofres sueltos, puertas de verdad en la sala, el buhonero y los aldeanos de las defensas.
// S.calm existe mientras la sala está tranquila y hay algo con lo que hablar o por donde salir: { kind, npcs, spots, near }.
//   npcs:  personas que andan hasta su sitio y se quedan (key del atlas, id para los bocadillos, tx/ty a donde van)
//   spots: con qué se puede hacer algo acercándose y pulsando disparar: puertas (door), hablar (npc), la campana (bell), seguir (go)
// Mientras hay calma no cuenta como sala limpia otra vez (43_update.js) y los bocadillos funcionan como en la ciudad.

// ── Oro: monedas en el suelo ──
function coinGain(v) { const p = S.p; if (G('s_loot')) v *= 1.5; p.gold += v; }
function dropCoins(x, y, total) {
  const k = clamp(Math.round(total / 2), 1, 7);
  for (let i = 0; i < k; i++) { const a = Math.random() * Math.PI * 2, sp = rnd(40, 95); S.coins.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, v: total / k, t: 0 }); }
}
// lo que suelta cada enemigo al morir: más cuanto más adentro, el triple las élites, mucho más los elegidos y los jefes
const coinsOf = e => e.type.post ? 0 : Math.round((1 + S.lvl / 5) * (e.boss ? 12 : e.champ ? 5 : e.elite ? 3 : 1));
function coinsUpdate(dt) {
  const p = S.p, calm = !S.enemies.length && !S.queue.length;
  for (const c of S.coins) {
    c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; const f = Math.pow(0.02, dt); c.vx *= f; c.vy *= f;
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (c.t > 0.35 && (d < 40 || calm)) { const sp = calm ? 260 : 180; c.x += (p.x - c.x) / (d || 1) * sp * dt; c.y += (p.y - c.y) / (d || 1) * sp * dt; }   // al acercarte (o con la sala limpia) vuelan hacia ti
    if (c.t > 0.25 && d < 9) { c.got = true; coinGain(c.v); }
  }
  if (S.coins.some(c => c.got)) { sfx('tick', 0.18, 1.6, 0.03); S.coins = S.coins.filter(c => !c.got); }
}
function drawCoins() {
  for (const c of S.coins) {
    if (IMG.vfx) ctx.drawImage(IMG.vfx, (Math.floor(c.t * 12) % 8) * 32, VFX.coin * 32, 32, 32, Math.round(c.x - 8), Math.round(c.y - 10), 16, 16);
    else { ctx.fillStyle = RAR[3].color; ctx.fillRect(Math.round(c.x) - 2, Math.round(c.y) - 2, 4, 4); }
  }
}

// ── Cofres sueltos: se abren al tocarlos y sueltan un puñado de monedas ──
function placeChests() {
  if (Math.random() > 0.45) return;
  for (let t = 0; t < 60; t++) {
    const cx = ri(2, NAV.cols - 3), cy = ri(2, NAV.rows - 3);
    if ([[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => NAV.wall[(cy + dy) * NAV.cols + cx + dx])) continue;
    const x = (cx + 0.5) * CELL, y = (cy + 0.5) * CELL; if (Math.hypot(x - S.p.x, y - S.p.y) < 90) continue;
    S.chests.push({ x, y, open: false, t: 0 }); return;
  }
}
function chestsUpdate(dt) {
  const p = S.p;
  for (const ch of S.chests) {
    ch.t += dt;
    if (!ch.open && Math.hypot(p.x - ch.x, p.y - ch.y) < 16) {
      ch.open = true; ch.t = 0; dropCoins(ch.x, ch.y - 4, Math.round(10 + 3 * S.lvl)); sfx('relic', 0.4, 1.2);
      for (let i = 0; i < 8; i++) S.fx.push({ k: 'spark', x: ch.x, y: ch.y - 6, vx: rnd(-60, 60), vy: rnd(-90, -20), t: 0, life: rnd(0.3, 0.6), col: RAR[3].color });
      note(ch.x, ch.y - 18, 'Un cofre', RAR[3].color);
    }
  }
}
function drawChests() {   // cofre de madera con herrajes; abierto, con la tapa levantada y el fondo a oscuras
  for (const ch of S.chests) {
    const x = Math.round(ch.x) - 7, y = Math.round(ch.y) - 6, P = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + 10, 14, 2);
    P('#2a1a12', 0, 3, 14, 8); P('#8a5a32', 1, 4, 12, 6); P('#a8743f', 1, 4, 12, 1); P('#c9a24a', 0, 6, 14, 1); P('#c9a24a', 6, 5, 2, 3);
    if (ch.open) { P('#120c10', 1, 3, 12, 2); P('#2a1a12', 0, -2, 14, 5); P('#8a5a32', 1, -1, 12, 3); P('#c9a24a', 0, 1, 14, 1); }
    else { P('#2a1a12', 0, 0, 14, 4); P('#9a663a', 1, 1, 12, 2); P('#c9a24a', 0, 2, 14, 1); if (Math.floor(ch.t * 2) % 4 === 0) P('#fff3b0', 10, 1, 1, 1); }
  }
}

// ── Puertas de verdad ──
// Sitios para las puertas: casillas de suelo con muro justo encima en tres casillas seguidas (la puerta va en ese muro),
// a las que se puede llegar desde donde estás; repartidas lo más lejos posible entre sí.
function doorSpots(n) {
  const c = NAV.cols, r = NAV.rows, W = (x, y) => x < 0 || y < 0 || x >= c || y >= r || NAV.wall[y * c + x] === 1;
  const seen = new Uint8Array(c * r), q = [[Math.floor(S.p.x / CELL), Math.floor(S.p.y / CELL)]];   // hasta dónde se llega andando
  if (!W(q[0][0], q[0][1])) seen[q[0][1] * c + q[0][0]] = 1;
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= c || ny >= r || seen[ny * c + nx] || W(nx, ny)) continue; seen[ny * c + nx] = 1; q.push([nx, ny]); } }
  const cand = [];   // la puerta va en un muro grueso (tres casillas de ancho y de fondo): no en un pilar suelto
  for (let y = 0; y < r - 1; y++) for (let x = 2; x < c - 2; x++)   // también la fila de arriba del todo: su muro es el borde de la sala
    if (seen[y * c + x] && seen[y * c + x - 1] && seen[y * c + x + 1] && W(x, y - 1) && W(x - 1, y - 1) && W(x + 1, y - 1) && W(x, y - 2) && W(x, y - 3) && !W(x, y + 1)) cand.push({ x: (x + 0.5) * CELL, y: y * CELL });
  // repartidas: cada una lo más lejos posible de las demás (al menos 64 px), mejor en los muros de arriba y no encima de ti
  const out = [], score = k => Math.min(150, ...out.map(o => Math.hypot(o.x - k.x, o.y - k.y))) - k.y / T.room.h * 60 - (Math.hypot(S.p.x - k.x, S.p.y - k.y) < 40 ? 80 : 0);
  while (out.length < n && cand.length) {
    let best = null, bd = -1e9;
    for (const k of cand) { if (out.some(o => Math.hypot(o.x - k.x, o.y - k.y) < 64)) continue; const d = score(k); if (d > bd) { bd = d; best = k; } }
    if (!best) break;
    out.push(best); cand.splice(cand.indexOf(best), 1);
  }
  while (out.length < n) out.push({ x: S.p.x + (out.length - n / 2) * 40, y: S.p.y - 40 });   // sala sin muros a mano: delante de ti
  return out;
}
// Pone las puertas de la pantalla de puertas (doorScreen) en la sala. extra: puertas que se añaden (el campamento del buhonero)
function openDoors(scr, extra) {
  const opts = (scr ? scr.opts : []).concat(extra || []), at = doorSpots(opts.length);
  S.calm = S.calm || { kind: 'doors', npcs: [], spots: [], near: null };
  opts.forEach((o, i) => S.calm.spots.push({ kind: 'door', x: at[i].x, y: at[i].y + 9, dy: at[i].y, opt: o, label: o.name }));
  S.calm.title = scr ? scr.eyebrow : '';
  tip('doors');
}
// Antes del jefe: una sola puerta, la suya
function bossDoor() {
  const ms = S.mission, boss = ms.type === 'god' ? TYPES[KINGDOMS.find(x => x.id === ms.k).god].name : TYPES[zoneBoss(KINGDOMS.find(x => x.id === ms.k), ms.z)].name;
  openDoors(null, [{ tag: ms.type === 'god' ? 'Dios' : 'Guardián', name: 'La puerta de ' + lc(boss), desc: 'Detrás espera ' + lc(boss) + '. No hay vuelta atrás.', color: C.blood, ico: ['helm', 1], apply: () => {} }]);
}
// La puerta del campamento del buhonero: una sala sin enemigos con su tienda; de allí se sigue por otra puerta
const campDoor = () => ({ tag: 'Zona segura', name: 'El campamento del buhonero', desc: 'Una sala tranquila con un tendero que vende de todo. Después sigues por otra puerta.', color: '#e6c07a', ico: ['mug', 0], camp: true, apply: () => {} });

function useDoor(s) {
  const o = s.opt; sfx('pick', 0.5);
  if (o.camp) { enterCamp(); return; }
  o.apply(); S.calm = null; nextWave();
}

// ── El buhonero ──
Object.assign(SPEAKER, { merchant: ['El buhonero', '#d9b26a'] });
const MERCHANT_HI = [
  'Pasa, pasa. Aquí abajo no entra nada que no pague. Y los bichos no pagan.',
  '¿Otra vez tú? Bien. Los que vuelven son los que compran.',
  'Siéntate junto al fuego. Lo que no compres hoy, mañana lo llevará otro… si queda alguien.',
  'Te he visto pelear desde el recodo. Tienes buena mano. Y mala pinta. Te vendría bien un guiso.',
  'No preguntes de dónde saco la mercancía. Pregunta cuánto cuesta.',
];
function talkMerchant() {
  const p = S.p;
  talk([{ who: 'merchant', text: MERCHANT_HI[Math.floor(Math.random() * MERCHANT_HI.length)] }, ...(p.gold < 30 ? [{ who: 'merchant', text: 'Aunque con ese monedero… Mata unos cuantos más y vuelve.' }] : [])], null, () => openShop());
}
// El campamento: una sala pequeña sin enemigos, con una hoguera, el buhonero y las puertas para seguir
function enterCamp() {
  const room = buildRoom(false, 'campamento', 'small');
  T.room.w = room.w; T.room.h = room.h; S.walls = room.walls; S.pools = room.pools; S.solids = room.walls.concat(room.pools); S.out = room.out; S.town = null; S.solidProps = room.solids || []; S.roomKind = room.kind; S.roomT = S.t; S.lastHitT = S.t; S.traps = [];
  S.p.x = room.start.x; S.p.y = room.start.y; S.coins = []; S.chests = []; S.enemies = []; S.queue = []; S.roomType = 'camp';
  const cx = T.room.w / 2, cy = T.room.h / 2;
  S.calm = { kind: 'camp', npcs: [{ key: 'merchant', id: 'merchant', x: cx + 30, y: cy - 6, tx: cx + 30, ty: cy - 6, flip: true }], spots: [], near: null, fire: { x: cx, y: cy } };
  S.calm.spots.push({ kind: 'npc', npc: 'merchant', x: cx + 30, y: cy + 4, label: 'Hablar con el buhonero', act: talkMerchant });
  openDoors(doorScreen());
  sayRaw('[El campamento del buhonero. Aquí no llega nada.]', C.energy);
  saveRun();
}

// ── Los aldeanos en las defensas: entre oleadas se acercan a hablar, a venderte y a darte lo que tienen ──
Object.assign(SPEAKER, { v_merc: ['La tendera de la aldea', '#d9b26a'], v_gift: ['Un aldeano', '#e6c07a'], v_talk: ['Una aldeana', '#e6c07a'], v_go: ['El alcalde', '#cfd6de'] });
const VILLAGE_TALK = [
  ['Mi hijo dice que tus cadenas cantan cuando las lanzas. Yo solo oigo a los bichos gritar. Me vale igual.', 'Llevamos tres noches sin dormir. Si aguantas esta, a lo mejor dormimos.'],
  ['¿De dónde has salido tú? Nadie viene a defender aldeas como esta. Ni el rey.', 'Si caemos, al menos que se acuerden de que alguien se quedó con nosotros.'],
  ['La campana es lo único que nos queda del pueblo viejo. Si suena, todos corremos al bosque. Que no tenga que sonar, ¿eh?', 'Mi abuela dice que los dioses no se mueren. Mi abuela no te ha visto pelear.'],
];
const VILLAGE_GIFT = [
  { text: 'Toma. Es hierro de la herrería, la que se quemó. A ti te servirá más que a nosotros.', give: () => { S.ironRun += 1; return '+1 de Hierro Místico'; } },
  { text: 'Hemos juntado lo que teníamos. No es mucho, pero es todo.', give: () => { const k = Math.round(25 + 6 * S.lvl); dropCoins(S.p.x, S.p.y - 10, k); return '+' + k + ' de oro'; } },
  { text: 'Bebe esto. Lo hace mi madre con hierbas del monte. Sabe a demonios, pero cura.', give: () => { heal(pct(30)); return 'Recuperas el 30% de tu vida'; } },
  { text: 'Hemos apuntalado la campana con las vigas del granero. Aguantará un poco más.', give: () => { if (S.keep) S.keep.hp = Math.min(S.keep.maxHp, S.keep.hp + S.keep.maxHp * 0.3); return 'La campana recupera el 30%'; } },
];
function villageCalm() {
  if (!S.keep) { nextWave(); return; }
  S.mode = 'play'; modeT = 0; renderOverlay();
  const k = S.keep, n = Math.floor(S.room / 4), gift = VILLAGE_GIFT[(S.room + Math.floor(Math.random() * 4)) % VILLAGE_GIFT.length], talkL = VILLAGE_TALK[n % VILLAGE_TALK.length];
  const from = (i) => { const a = -Math.PI / 2 + (i - 1) * 1.1; return { x: k.x + Math.cos(a) * 170, y: k.y + Math.sin(a) * 120 }; };
  const spot = (i) => { const a = -Math.PI / 2 + (i - 1) * 1.15; return { x: S.p.x + Math.cos(a) * 58, y: S.p.y + Math.sin(a) * 40 }; };   // en corro, separados
  const people = [{ key: 'merchant', id: 'v_merc' }, { key: 'cit_peasant', id: 'v_gift' }, { key: 'villager', id: 'v_talk' }];
  S.calm = { kind: 'village', npcs: [], spots: [], near: null };
  people.forEach((q, i) => { const a = from(i), b = spot(i); S.calm.npcs.push(Object.assign({ x: a.x, y: a.y, tx: b.x, ty: b.y, walking: true }, q)); });
  S.calm.spots.push({ kind: 'npc', npc: 'v_merc', label: 'Comprar', act: () => talk([{ who: 'v_merc', text: 'El buhonero dejó aquí su carro cuando empezó el asedio. Yo lo vendo por él. Él no va a volver a por ello.' }], null, () => openShop()) });
  S.calm.spots.push({ kind: 'npc', npc: 'v_gift', label: 'Hablar', act: (s) => { if (s.done) { talk([{ who: 'v_gift', text: 'Ya te he dado lo que tenía. Ahora, a por ellos.' }]); return; } s.done = true; const got = gift.give(); talk([{ who: 'v_gift', text: gift.text }], null, () => { sayRaw('[' + got + ']', C.energy); sfx('ok', 0.4); }); } });
  S.calm.spots.push({ kind: 'npc', npc: 'v_talk', label: 'Hablar', act: (s) => { s.n = (s.n || 0) + 1; talk([{ who: 'v_talk', text: talkL[(s.n - 1) % talkL.length] }]); } });
  S.calm.spots.push({ kind: 'bell', x: k.x, y: k.y + 22, label: 'Tocar la campana: que vengan', act: () => { S.calm = null; sfx('chime', 0.5, 0.8); nextWave(); } });
  sayRaw('[Los asaltantes se repliegan. Los aldeanos salen de sus casas.]', C.energy);
}
// En los asaltos, entre campamento y campamento, aparece el buhonero
function assaultCalm() {
  S.mode = 'play'; modeT = 0; renderOverlay();
  const p = S.p, x0 = p.x + 140, y0 = p.y - 20;
  S.calm = { kind: 'assault', npcs: [{ key: 'merchant', id: 'merchant', x: x0, y: y0, tx: p.x + 34, ty: p.y - 8, walking: true }], spots: [], near: null };
  S.calm.spots.push({ kind: 'npc', npc: 'merchant', label: 'Hablar con el buhonero', act: talkMerchant });
  S.calm.spots.push({ kind: 'go', x: p.x - 34, y: p.y + 6, label: 'Seguir hacia el siguiente campamento', act: () => { S.calm = null; sfx('pick', 0.5); nextWave(); } });
  sayRaw('[Un buhonero se acerca entre las tiendas quemadas.]', C.energy);
}

// ── Cada fotograma con calma ──
function calmUpdate(dt) {
  const C2 = S.calm, p = S.p;
  for (const n of C2.npcs) {
    const dx = n.tx - n.x, dy = n.ty - n.y, d = Math.hypot(dx, dy);
    if (d > 1) { const st = Math.min(d, 62 * dt); n.x += dx / d * st; n.y += dy / d * st; n.walking = true; n.flip = dx < 0; }
    else { n.walking = false; n.flip = n.x > p.x; }
  }
  for (const s of C2.spots) if (s.npc) { const n = C2.npcs.find(q => q.id === s.npc); if (n) { s.x = n.x; s.y = n.y + 10; } }
  let near = null, bd = 24;
  for (const s of C2.spots) { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; near = s; } }
  C2.near = near;
  if (near && I.atkP && !S.dialog) {
    if (near.kind === 'door') useDoor(near);
    else if (near.act) near.act(near);
  }
}
function drawCalm() {
  const C2 = S.calm, p = S.p;
  if (C2.fire) { const f = C2.fire; ctx.fillStyle = '#2a1a12'; ctx.fillRect(f.x - 9, f.y + 2, 18, 3); ctx.fillStyle = '#5a3a22'; ctx.fillRect(f.x - 7, f.y, 14, 3); drawFx('flame', (S.t * 1.4) % 1, f.x, f.y - 2, '#ff9a3c', 18); }
  for (const s of C2.spots) if (s.kind === 'door') drawDoor(s, s === C2.near);
  for (const n of C2.npcs.slice().sort((a, b) => a.y - b.y)) {
    ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(n.x, n.y, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    drawChar(n.key, n.walking ? 'move' : 'idle', S.t + n.x * 0.01, n.x, n.y, !!n.flip, false);
  }
  if (S.dialog) return;
  for (const s of C2.spots) {
    if (s.kind === 'door') continue;
    const on = s === C2.near, b = Math.round(Math.sin(S.t * 5 + s.x) * 1.5), y = s.kind === 'npc' ? s.y - 44 : s.y - 26;
    ctx.fillStyle = on ? C.energy : '#efe6c8'; ctx.globalAlpha = on ? 1 : 0.7; ctx.fillRect(s.x - 2, y + 4 + b, 5, 3); ctx.fillRect(s.x - 1, y + 7 + b, 3, 1); ctx.globalAlpha = 1;
    if (on) wtext(s.label, s.x, y + b, 7, C.energy, 1);   // solo lo que tienes más cerca dice qué es; lo demás, solo la flechita
  }
  if (C2.near && !S.dialog) wtext(lastDev === 'pad' ? 'A: ' + (C2.near.kind === 'door' ? 'cruzar' : 'hablar') : lastDev === 'touch' ? 'Disparar: ' + (C2.near.kind === 'door' ? 'cruzar' : 'hablar') : 'Espacio: ' + (C2.near.kind === 'door' ? 'cruzar' : 'hablar'), p.x, p.y + 22, 6, C.ink, 0.95);
}
// Una puerta en el muro: arco de piedra, el hueco a oscuras con la luz de lo que hay detrás, y el icono encima. Cerca, qué es.
function drawDoor(s, on) {
  const x = Math.round(s.x), y = Math.round(s.dy), o = s.opt, col = o.color || C.ink, pulse = 0.5 + 0.5 * Math.sin(S.t * 3 + x);
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  R('#1a1820', -9, -24, 18, 24); R('#6e6a80', -8, -23, 16, 23); R('#8c88a0', -8, -23, 16, 2);   // marco de piedra
  R('#0b0a10', -6, -20, 12, 20); R('#0b0a10', -5, -21, 10, 1); R('#0b0a10', -4, -22, 8, 1);       // el hueco
  ctx.globalAlpha = 0.25 + 0.35 * pulse + (on ? 0.25 : 0); R(col, -5, -19, 10, 19); ctx.globalAlpha = 1;   // la luz de lo que hay detrás
  R('#3a3646', -9, 0, 18, 2);
  if (IMG.items && o.ico) ctx.drawImage(IMG.items, ICO[o.ico[0]] * 32, (o.ico[1] || 0) * 32, 32, 32, x - 8, y - 44 + Math.round(Math.sin(S.t * 4 + x) * 1.5), 16, 16);
  if (on && !S.dialog) {   // solo la puerta a la que te acercas dice qué es (si no, los nombres se pisan)
    wtext(o.tag, x, y - 58, 6, '#efe6c8', 0.85); wtext(o.name, x, y - 50, 7, col, 1);
    (o.desc.match(/.{1,46}(\s|$)/g) || []).slice(0, 3).forEach((l, i) => wtext(l.trim(), x, y + 10 + i * 8, 6, '#efe6c8', 0.9));
  }
}
// Flechas en el borde de la pantalla hacia las puertas que no se ven (con el icono de lo que hay detrás); al verlas, desaparecen
function calmPointers() {
  const C2 = S.calm; if (!C2 || !IMG.items) return;
  const R = 10, L = cam.x + 16, Rt = cam.x + view.w - 16, T = cam.y + Math.max(30, view.h * 0.22), B = cam.y + view.h * 0.74, ox = cam.x + view.w / 2, oy = cam.y + view.h / 2, placed = [];
  for (const s of C2.spots) {
    if (s.kind !== 'door') continue;
    const x = s.x, y = s.dy - 12;
    if (x > cam.x + 4 && x < cam.x + view.w - 4 && y > cam.y + 4 && y < cam.y + view.h - 4) continue;
    const dx = x - ox, dy = y - oy, k = Math.min(dx > 0 ? (Rt - ox) / dx : dx < 0 ? (L - ox) / dx : 1e9, dy > 0 ? (B - oy) / dy : dy < 0 ? (T - oy) / dy : 1e9);
    let px = ox + dx * k, py = oy + dy * k;
    for (let n = 0; n < 6 && placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < 2 * R + 4); n++) { if (px <= L + 1 || px >= Rt - 1) py = clamp(py + (py > oy ? -1 : 1) * (2 * R + 5), T, B); else px = clamp(px + (px > ox ? -1 : 1) * (2 * R + 5), L, Rt); }
    placed.push([px, py]); px = Math.round(px); py = Math.round(py);
    const a = Math.atan2(y - py, x - px), col = s.opt.color || C.ink;
    ctx.save(); ctx.translate(px, py);
    ctx.save(); ctx.rotate(a); ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.moveTo(R + 7, 0); ctx.lineTo(R - 2, -6); ctx.lineTo(R - 2, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(R + 5, 0); ctx.lineTo(R - 1, -4); ctx.lineTo(R - 1, 4); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#16101a'; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, R - 1.5, 0, Math.PI * 2); ctx.stroke();
    if (s.opt.ico) ctx.drawImage(IMG.items, ICO[s.opt.ico[0]] * 32, (s.opt.ico[1] || 0) * 32, 32, 32, -8, -8, 16, 16);
    ctx.restore();
  }
}
