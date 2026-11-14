// ───────────────────────── Dibujo ─────────────────────────
function resize() {
  const w = cv.clientWidth || 1, h = cv.clientHeight || 1, dpr = Math.min(2, window.devicePixelRatio || 1);
  if (w === view.cssW && h === view.cssH && dpr === view.dpr) return;
  view.cssW = w; view.cssH = h; view.dpr = dpr;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  view.s = Math.max(1, Math.round(Math.sqrt(cv.width * cv.height / T.viewArea)));
  lo.width = Math.ceil(cv.width / view.s); lo.height = Math.ceil(cv.height / view.s);
  view.w = cv.width / view.s; view.h = cv.height / view.s;
}

function shapePath(shape, x, y, r, dir) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(x, y, r, 0, Math.PI * 2);
  else if (shape === 'square') ctx.rect(x - r, y - r, r * 2, r * 2);
  else if (shape === 'diamond') { ctx.moveTo(x, y - r * 1.25); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r * 1.25); ctx.lineTo(x - r, y); ctx.closePath(); }
  else { for (let i = 0; i < 3; i++) { const a = dir + i * Math.PI * 2 / 3; const rr = i === 0 ? r * 1.6 : r * 1.1; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); }
}
const FONT = '"Pixelify Sans", ui-monospace, monospace';

// Textos del mundo: se apuntan aquí y se pintan después de ampliar, a resolución completa
const WTEXT = [];
const wtext = (txt, x, y, size, col, alpha = 1) => WTEXT.push([txt, x, y, size, col, alpha]);
function render() {
  sysTick();
  WTEXT.length = 0;
  renderWorld();
  const k = view.s;
  scr.setTransform(1, 0, 0, 1, 0, 0); scr.imageSmoothingEnabled = false;
  scr.drawImage(lo, 0, 0, lo.width * k, lo.height * k);
  scr.textAlign = 'center';
  for (const [txt, x, y, size, col, alpha] of WTEXT) {
    scr.font = `600 ${Math.round(size * k)}px ${FONT}`; scr.globalAlpha = alpha;
    scr.lineWidth = Math.max(2, k); scr.strokeStyle = '#0b080d'; scr.strokeText(txt, (x - cam.x) * k, (y - cam.y) * k);
    scr.fillStyle = col; scr.fillText(txt, (x - cam.x) * k, (y - cam.y) * k);
  }
  scr.globalAlpha = 1;
  if (S.hurtFx > 0) { scr.fillStyle = C.blood; scr.globalAlpha = S.hurtFx * 0.7; scr.fillRect(0, 0, cv.width, cv.height); scr.globalAlpha = 1; }
  if (touch.joyId !== null) {
    const r = cv.getBoundingClientRect(), d = view.dpr, ox = (touch.ox - r.left) * d, oy = (touch.oy - r.top) * d;
    let dx = (touch.x - touch.ox) * d, dy = (touch.y - touch.oy) * d; const m = Math.hypot(dx, dy), max = 46 * d;
    if (m > max) { dx *= max / m; dy *= max / m; }
    scr.strokeStyle = C.ink; scr.globalAlpha = 0.3; scr.lineWidth = 2 * d; scr.beginPath(); scr.arc(ox, oy, max, 0, Math.PI * 2); scr.stroke();
    scr.fillStyle = C.ink; scr.globalAlpha = 0.45; scr.beginPath(); scr.arc(ox + dx, oy + dy, 20 * d, 0, Math.PI * 2); scr.fill(); scr.globalAlpha = 1;
  }
}
// Luz de antorchas y viñeta: lo último que se pinta del mundo
function lights() {
  const bg = roomBg(), fr = Math.floor(S.t * 9);
  for (const t of bg.torches) {
    if (t.x < cam.x - 60 || t.x > cam.x + view.w + 60 || t.y < cam.y - 60 || t.y > cam.y + view.h + 60) continue;
    const f = (fr + t.x) % 3;
    ctx.fillStyle = '#e8642c'; ctx.fillRect(t.x - 2, t.y - 3, 4, 4); ctx.fillRect(t.x - 1 + (f === 1 ? 1 : f === 2 ? -1 : 0), t.y - 5, 2, 2);
    ctx.fillStyle = '#ffb347'; ctx.fillRect(t.x - 1, t.y - 2, 2, 3); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(t.x - 1 + (f === 2 ? 1 : 0), t.y - 1, 1, 2);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ff9a3c';
    ctx.globalAlpha = 0.05 + 0.012 * f; ctx.beginPath(); ctx.arc(t.x, t.y + 6, 44, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.07; ctx.beginPath(); ctx.arc(t.x, t.y + 4, 22, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(vignette(lo.width, lo.height), 0, 0);
}
function renderWorld() {
  const p = S.p, R = T.room;
  cam.x = Math.round(view.w >= R.w + 64 ? (R.w - view.w) / 2 : clamp(p.x - view.w / 2, -32, R.w - view.w + 32));
  cam.y = Math.round(view.h >= R.h + 64 ? (R.h - view.h) / 2 : clamp(p.y - view.h / 2, -32, R.h - view.h + 32));
  const shx = Math.round((Math.random() - 0.5) * S.shake), shy = Math.round((Math.random() - 0.5) * S.shake);

  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#0b080d'; ctx.fillRect(0, 0, lo.width, lo.height);
  ctx.setTransform(1, 0, 0, 1, -(cam.x + shx), -(cam.y + shy));
  ctx.drawImage(roomBg().c, -BG_M * CELL, -BG_M * CELL);

  if (S.mode === 'title') { lights(); return; }

  // Trampas de pinchos
  for (const tr of S.traps) {
    ctx.fillStyle = '#16101a'; ctx.fillRect(tr.x + 1, tr.y + 1, tr.w - 2, tr.h - 2);
    ctx.fillStyle = '#3a3540'; ctx.fillRect(tr.x + 2, tr.y + 2, tr.w - 4, tr.h - 4); ctx.fillStyle = '#4a4552'; ctx.fillRect(tr.x + 2, tr.y + 2, tr.w - 4, 1); ctx.fillRect(tr.x + 2, tr.y + 2, 1, tr.h - 4);
    ctx.fillStyle = '#2c2832'; ctx.fillRect(tr.x + 2, tr.y + tr.h / 2, tr.w - 4, 1); ctx.fillRect(tr.x + tr.w / 2, tr.y + 2, 1, tr.h - 4);
    ctx.strokeStyle = tr.state === 1 ? C.blood : '#16101a'; ctx.lineWidth = 1; ctx.strokeRect(tr.x + 1.5, tr.y + 1.5, tr.w - 3, tr.h - 3);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const x = tr.x + 4 + i * 8, y = tr.y + 5 + j * 8;
      if (tr.state === 2) { ctx.fillStyle = '#16101a'; ctx.fillRect(x - 2, y - 5, 4, 7); ctx.fillStyle = PAL.i; ctx.fillRect(x - 1, y - 3, 2, 4); ctx.fillStyle = PAL.w; ctx.fillRect(x - 1, y - 5, 1, 3); ctx.fillStyle = PAL.I; ctx.fillRect(x, y - 1, 1, 2); }
      else if (tr.state === 1) { ctx.fillStyle = PAL.i; ctx.fillRect(x - 1, y - 1 - (Math.floor(S.t * 12) % 2), 2, 2); }
      else { ctx.fillStyle = '#16101a'; ctx.fillRect(x - 1, y - 1, 2, 2); }
    }
  }

  // Alcance
  ctx.beginPath(); ctx.arc(p.x, p.y, rangeOf(), 0, Math.PI * 2);
  ctx.strokeStyle = C.energy; ctx.globalAlpha = S.noTarget > 0 ? 0.55 : 0.13; ctx.lineWidth = 1; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

  // Previsualización del disparo cargado: cono, o rayo cortado por las columnas
  if (p.charging) {
    const ratio = clamp(p.charge / T.charge.full, 0, 1), ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir), ok = p.charge >= T.charge.min;
    const CH = S.gun.chamber, mortar = S.plans.has('mortar') && CH === 'c_beam';
    if (CH === 'c_fan' || CH === 'c_blast') {
      const half = CH === 'c_blast' ? 0.6 : 0.85, reach = CH === 'c_blast' ? 130 : 165;
      ctx.fillStyle = C.energy; ctx.globalAlpha = ok ? 0.08 + 0.14 * ratio : 0.04;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, reach, p.chargeDir - half, p.chargeDir + half); ctx.closePath(); ctx.fill();
    } else if (CH === 'c_rain') {
      const tg = S.target && active(S.target) && Math.hypot(I.ax, I.ay) <= 0.35 ? S.target : null;
      const tx = clamp(tg ? tg.x : p.x + ux * 190, 0, T.room.w), ty = clamp(tg ? tg.y : p.y + uy * 190, 0, T.room.h);
      ctx.fillStyle = C.energy; ctx.globalAlpha = ok ? 0.1 + 0.16 * ratio : 0.05; ctx.beginPath(); ctx.arc(tx, ty, 62, 0, Math.PI * 2); ctx.fill();
    } else if (CH === 'c_supp') {
      ctx.strokeStyle = C.energy; ctx.globalAlpha = ok ? 0.25 + 0.4 * ratio : 0.1; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, rangeOf(), 0, Math.PI * 2); ctx.stroke();
    } else if (CH === 'c_dash') {
      ctx.strokeStyle = C.energy; ctx.globalAlpha = ok ? 0.2 + 0.3 * ratio : 0.08; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + ux * 240, p.y + uy * 240); ctx.stroke();
    } else if (lv('dragon_charge') && !mortar) {
      const kk = duoOn('roar') ? 1 + p.fury / 100 : 1;
      ctx.fillStyle = GODS.dragon.color; ctx.globalAlpha = ok ? 0.1 + 0.18 * ratio : 0.05;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.arc(p.x, p.y, 175 * kk, p.chargeDir - Math.min(1.2, 0.5 * kk), p.chargeDir + Math.min(1.2, 0.5 * kk)); ctx.closePath(); ctx.fill();
    } else {
      const cl = mortar ? 170 : rayClip(p.x, p.y, ux, uy, T.charge.range);
      ctx.strokeStyle = C.energy; ctx.globalAlpha = ok ? 0.18 + 0.3 * ratio : 0.08; ctx.lineWidth = 2 + ratio * T.charge.width * 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + ux * cl, p.y + uy * cl); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Zonas en el suelo
  for (const z of S.zones) {
    const a = Math.min(1, z.life);
    if (z.r) { ctx.fillStyle = z.col; ctx.globalAlpha = 0.2 * a + 0.04 * Math.sin(S.t * 14); ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; continue; }
    ctx.strokeStyle = z.col; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.22 * a; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
    ctx.globalAlpha = 0.5 * a; ctx.lineWidth = 5 + Math.sin(S.t * 14) * 1.5; ctx.stroke();
    ctx.globalAlpha = 1; ctx.lineCap = 'butt';
  }
  // Cristales, Bocados y arma caída
  for (const c of S.crystals) {      // cristal clavado en el suelo: una gema de píxeles con su brillo
    const a = Math.min(1, c.life), x = Math.round(c.x), y = Math.round(c.y), col = GODS.stone.color;
    ctx.globalAlpha = 0.22 * a; ctx.fillStyle = col; ctx.fillRect(x - 7, y - 2, 14, 6); ctx.fillRect(x - 5, y - 4, 10, 10);
    ctx.globalAlpha = a; ctx.fillStyle = '#16101a'; ctx.fillRect(x - 3, y - 8, 6, 12); ctx.fillRect(x - 4, y - 5, 8, 7);
    ctx.fillStyle = tone(col, -0.35); ctx.fillRect(x - 2, y - 7, 4, 10); ctx.fillRect(x - 3, y - 4, 6, 5);
    ctx.fillStyle = col; ctx.fillRect(x - 2, y - 7, 2, 9); ctx.fillRect(x - 3, y - 4, 2, 4);
    ctx.fillStyle = '#eafffb'; ctx.fillRect(x - 2, y - 6, 1, 3 + (Math.floor(S.t * 5 + x) % 2));
    ctx.globalAlpha = 1;
  }
  for (const f of S.fields) {   // burbujas de tiempo
    ctx.fillStyle = GODS.time.color; ctx.globalAlpha = 0.1 + 0.05 * Math.sin(S.t * 3); ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = GODS.time.color; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f.life / f.life0); ctx.stroke(); ctx.globalAlpha = 1;
  }
  for (const h of S.hazards) {   // avisos de golpes que caen
    ctx.fillStyle = h.col; ctx.strokeStyle = h.col; ctx.lineWidth = 1.5;
    if (h.done) { ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill(); }
    else { const k = 1 - h.t / h.t0; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.15 + 0.3 * k; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * k, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  for (const l of S.lasers) {   // líneas de tiro enemigas
    const ux = Math.cos(l.a), uy = Math.sin(l.a), len = rayClip(l.x, l.y, ux, uy, 700), k = 1 - l.t / l.t0;
    ctx.strokeStyle = C.blood; ctx.globalAlpha = 0.25 + 0.6 * k; ctx.lineWidth = 1 + l.w * k;
    ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x + ux * len, l.y + uy * len); ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (S.drop) {                      // el arma bendecida, clavada en el suelo y brillando en el color de su deidad
    const d = S.drop, x = Math.round(d.x), y = Math.round(d.y + Math.sin(S.t * 4) * 1.5), col = GODS[d.god].color;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col; ctx.globalAlpha = 0.12 + 0.05 * Math.sin(S.t * 6); ctx.beginPath(); ctx.arc(x, y - 4, 16, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#16101a'; ctx.fillRect(x - 2, y - 15, 4, 16); ctx.fillRect(x - 5, y - 5, 10, 3); ctx.fillRect(x - 2, y - 2, 4, 6);
    ctx.fillStyle = col; ctx.fillRect(x - 1, y - 14, 2, 10); ctx.fillStyle = tone(col, 0.6); ctx.fillRect(x - 1, y - 14, 1, 9);
    ctx.fillStyle = PAL.g; ctx.fillRect(x - 4, y - 4, 8, 1); ctx.fillStyle = PAL.B; ctx.fillRect(x - 1, y - 3, 2, 4); ctx.fillStyle = PAL.g; ctx.fillRect(x - 1, y + 1, 2, 1);
  }

  // Columnas y rifles gemelos
  for (const tu of S.turrets) {
    ctx.strokeStyle = slotColor('basic'); ctx.globalAlpha = Math.min(1, tu.life); ctx.lineWidth = 1.5;
    ctx.strokeRect(tu.x - 4, tu.y - 4, 8, 8); ctx.beginPath(); ctx.arc(tu.x, tu.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * tu.life / 3); ctx.stroke(); ctx.globalAlpha = 1;
  }

  // Sombras
  for (const s of S.shades) {
    ctx.fillStyle = GODS.shade.color; ctx.globalAlpha = Math.min(0.85, 0.3 + s.life * 0.4);
    drawSprite(SPR.shade, s.x, s.y + 7 + Math.sin(S.t * 5 + s.x) * 0.8, false, false); ctx.globalAlpha = 1;
  }

  // Enemigos
  for (const e of S.enemies) {
    if (e.spawn > 0) {
      // aparición: un círculo de invocación que se cierra y columnas de humo
      const k = clamp(e.spawn / 0.65, 0, 1), x = Math.round(e.x), y = Math.round(e.y + e.r);
      ctx.fillStyle = e.color; ctx.globalAlpha = 0.25 + 0.4 * (1 - k); ctx.beginPath(); ctx.ellipse(x, y, e.r + 3 + 8 * k, (e.r + 3 + 8 * k) * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; for (let i = 0; i < 4; i++) { const px = x - e.r + ((i * 7 + Math.floor(S.t * 10)) % (e.r * 2 + 1)); ctx.fillRect(px, y - Math.round((1 - k) * (e.r * 2 + 4)) - (i % 2) * 3, 1, 3 + (i % 3)); }
      ctx.globalAlpha = 1; continue;
    }
    if (e.wind > 0) { // aviso de golpe
      const k = 1 - e.wind / e.type.wind;
      ctx.fillStyle = C.ink; ctx.globalAlpha = 0.14 + 0.2 * k; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + e.type.reach * k + 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (e.cast > 0) { ctx.strokeStyle = C.arcane; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 4 + 6 * (e.cast / 0.55), 0, Math.PI * 2); ctx.stroke(); }
    if (e.lungeWind > 0) { // aviso de embestida
      const a = Math.atan2(e.lvy, e.lvx);
      ctx.strokeStyle = e.color; ctx.globalAlpha = 0.25 + 0.4 * (1 - e.lungeWind / 0.5); ctx.lineWidth = e.r * 2;
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 95, e.y + Math.sin(a) * 95); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (e.boss) { // avisos del Guardián
      if (e.act === 'slam') { ctx.fillStyle = C.blood; ctx.globalAlpha = 0.15 + 0.35 * (1 - e.at / 0.75); ctx.beginPath(); ctx.arc(e.x, e.y, 78, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      if (e.act === 'chargeWind') { const a = Math.atan2(e.lvy, e.lvx); ctx.strokeStyle = C.blood; ctx.globalAlpha = 0.2 + 0.4 * (1 - e.at / 0.7); ctx.lineWidth = e.r * 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 240, e.y + Math.sin(a) * 240); ctx.stroke(); ctx.globalAlpha = 1; }
      if (e.act === 'cast') { ctx.strokeStyle = C.arcane; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6 + 12 * Math.max(0, e.at / 0.6), 0, Math.PI * 2); ctx.stroke(); }
      if (e.act === 'dazed') { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 6, S.t * 5, S.t * 5 + Math.PI * 1.7); ctx.stroke(); ctx.setLineDash([]); }
    }
    { // cuerpo: sprite de su tipo (el del elegido lleva el color de su deidad), con sombra en el suelo y un leve balanceo al andar
      const key = Object.keys(TYPES).find(k => TYPES[k] === e.type), sp = e.champ ? SPR.champ[e.god] : SPR[key];
      const air = e.leapT > 0 || (e.boss && e.act === 'leap') ? 10 * Math.sin(Math.PI * (1 - Math.max(0, e.boss ? e.at / 0.9 : e.leapT / 0.7))) : 0;
      ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.95, e.r * 0.95, e.r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      const step = e.stun <= 0 && active(e) && Math.floor(S.t * (e.type.speed > 80 ? 11 : 6) + e.x * 0.13) % 2 === 1;
      if (sp) drawSprite(sp, e.x, e.y + e.r + (e.boss ? 3 : 1) - air - (step && !sp.b ? 1 : 0), Math.cos(e.dir) < 0, e.flash > 0, step);
      else { shapePath(e.type.shape, e.x, e.y, e.r, e.dir); ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color; ctx.fill(); }
    }
    if (e.champ) { // la espada bendecida que lleva, en el color de su deidad
      ctx.save(); ctx.translate(Math.round(e.x), Math.round(e.y)); ctx.rotate(e.dir);
      ctx.fillStyle = '#16101a'; ctx.fillRect(3, -2, e.r + 9, 4); ctx.fillRect(5, -4, 3, 8);
      ctx.fillStyle = e.color; ctx.fillRect(8, -1, e.r + 3, 2); ctx.fillStyle = tone(e.color, 0.6); ctx.fillRect(8, -1, e.r + 3, 1);
      ctx.fillStyle = PAL.g; ctx.fillRect(6, -3, 1, 6); ctx.fillStyle = PAL.B; ctx.fillRect(4, -1, 2, 2);
      ctx.restore();
    }
    // Lo acumulado: Ascuas a la izquierda, Veneno a la derecha, sazón arriba, aturdido en blanco
    if (e.ember > 0) { ctx.strokeStyle = GODS.dragon.color; ctx.lineWidth = 0.8 + Math.min(3, 0.3 * e.ember); ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 2, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); wtext(String(e.ember), e.x - e.r - 6, e.y + 3, 7, GODS.dragon.color); }
    if (e.venom > 0) { wtext(String(e.venom), e.x + e.r + 6, e.y + 3, 7, GODS.venom.color); }
    if (e.needles > 0) { ctx.fillStyle = GODS.storm.color; for (let i = 0; i < e.needles; i++) { const a = -Math.PI / 2 + i * Math.PI / 3; ctx.fillRect(e.x + Math.cos(a) * (e.r + 4) - 1, e.y + Math.sin(a) * (e.r + 4) - 1, 2.2, 2.2); } }
    if (e.wet > 0) { ctx.fillStyle = GODS.tide.color; for (let i = 0; i < 3; i++) { const a = S.t * 3 + i * 2.1; ctx.fillRect(Math.round(e.x + Math.cos(a) * (e.r + 2)), Math.round(e.y + e.r - 2 + ((S.t * 9 + i * 3) % 5)), 1, 2); } }
    if (e.root > 0) { ctx.fillStyle = GODS.wood.color; for (let i = -1; i <= 1; i++) { ctx.fillRect(Math.round(e.x + i * (e.r * 0.7)) - 1, Math.round(e.y + e.r - 3), 2, 4); ctx.fillRect(Math.round(e.x + i * (e.r * 0.7)) + (i || 1), Math.round(e.y + e.r - 5), 1, 3); } }
    if (e.seed > 0) { ctx.fillStyle = GODS.wood.color; for (let i = 0; i < e.seed; i++) ctx.fillRect(Math.round(e.x - e.seed * 1.5 + i * 3), Math.round(e.y - e.r - 11), 2, 2); }
    if (e.mark > 0) { ctx.strokeStyle = GODS.shade.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e.x - 3, e.y + e.r + 4); ctx.lineTo(e.x + 3, e.y + e.r + 4); ctx.moveTo(e.x, e.y + e.r + 2); ctx.lineTo(e.x, e.y + e.r + 8); ctx.stroke(); }
    if (e.slowT > 0) { ctx.strokeStyle = GODS.time.color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 7, 0, Math.PI * 2 * (1 - e.slowF)); ctx.stroke(); }
    if (e.stun > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.setLineDash([1.5, 2.5]); ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 5, S.t * 6, S.t * 6 + Math.PI * 1.6); ctx.stroke(); ctx.setLineDash([]); }
    if (e.hp < e.maxHp) {
      const w = e.r * 2 + 4; ctx.fillStyle = C.wall; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w, 2.5);
      ctx.fillStyle = C.ink; ctx.fillRect(e.x - w / 2, e.y - e.r - 7, w * clamp(e.hp / e.maxHp, 0, 1), 2.5);
    }
  }

  // Marca de objetivo
  const tg = S.target && active(S.target) ? S.target : null;
  if (tg) {
    // cuatro esquinas de píxel alrededor del objetivo; doradas, y rojizas si está fijado
    const locked = S.lock === tg, r = Math.round(tg.r + 5 + (Math.floor(S.t * 4) % 2)), x = Math.round(tg.x), y = Math.round(tg.y - 2);
    ctx.fillStyle = locked ? C.ember : C.energy;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = x + sx * r, cy = y + sy * r; ctx.fillRect(Math.min(cx, cx - sx * 3), cy, 4, 1); ctx.fillRect(cx, Math.min(cy, cy - sy * 3), 1, 4); }
  }

  // Proyectiles enemigos
  for (const sh of S.shots) {
    const x = Math.round(sh.x), y = Math.round(sh.y), r = Math.max(2, Math.round(sh.r)), tw = Math.floor(S.t * 12 + x) % 2;
    ctx.fillStyle = C.arcane; ctx.globalAlpha = 0.28; ctx.fillRect(x - r - 2, y - r, r * 2 + 4, r * 2); ctx.fillRect(x - r, y - r - 2, r * 2, r * 2 + 4);
    ctx.globalAlpha = 1; ctx.fillStyle = '#16101a'; ctx.fillRect(x - r, y - r + 1, r * 2, r * 2 - 2); ctx.fillRect(x - r + 1, y - r, r * 2 - 2, r * 2);
    ctx.fillStyle = C.arcane; ctx.fillRect(x - r + 1, y - r + 1, r * 2 - 2, r * 2 - 2);
    ctx.fillStyle = '#f0e4ff'; ctx.fillRect(x - 1 + tw, y - 1, 2 - tw, 2 - tw);
  }

  // Efectos bajo el jugador
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'ghost') { ctx.fillStyle = C.ember; ctx.globalAlpha = 0.35 * k; ctx.beginPath(); ctx.arc(f.x, f.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    else if (f.k === 'clock') { ctx.strokeStyle = GODS.time.color; ctx.globalAlpha = 0.7; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke(); }
    else if (f.k === 'cone') { ctx.fillStyle = f.col; ctx.globalAlpha = 0.45 * k; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.arc(f.x, f.y, f.r * (1 - 0.3 * k), f.a - f.half, f.a + f.half); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // Jugador
  const flying = p.dodgeT > 0 && p.fly, pr = flying ? p.r * 1.35 : p.r, py = flying ? p.y - 5 : p.y;
  if (flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x, p.y + 4, p.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (p.fury > 0) { ctx.strokeStyle = GODS.orc.color; ctx.globalAlpha = 0.25 + 0.5 * p.fury / 100; ctx.lineWidth = 1 + 2.5 * p.fury / 100; ctx.beginPath(); ctx.arc(p.x, py, pr + 2, 0, Math.PI * 2 * p.fury / 100); ctx.stroke(); ctx.globalAlpha = 1; }
  const blink = p.inv > 0 && p.dodgeT <= 0 && Math.floor(S.t * 30) % 2 === 0;
  if (!blink) {
    const fx = Math.cos(p.face), fy = Math.sin(p.face), glow = p.windup > 0 || p.charging || (p.drawing && p.draw >= 1);
    if (!flying) { ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.ellipse(p.x, p.y + p.r, p.r * 0.95, p.r * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    drawSprite(SPR.player, p.x, py + p.r + 1, fx < 0, false, Math.hypot(I.mx, I.my) > 0.2 && Math.floor(S.t * 9) % 2 === 1);
    const kick = p.cd > 0 && p.windup <= 0 ? Math.round(3 * clamp((p.cd - periodOf() + 0.09) / 0.09, 0, 1)) : 0;   // culatazo del retroceso
    drawGun(p.x, py + 1, p.face, kick);
    if (glow) { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(p.x + fx * 17) - 1, Math.round(py + 1 + fy * 17) - 1, 2, 2); }
  }
  // Anillo de ritmo: se llena mientras recarga; brilla cuando puedes disparar
  const period = periodOf(), a0 = -Math.PI / 2;
  if (p.heat > 0.02) { ctx.strokeStyle = p.over > 0 ? '#ffffff' : C.blood; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8.5, a0, a0 + Math.PI * 2 * p.heat); ctx.stroke(); }
  if (S.gun.action === 'a_rotary') { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.35 + 0.5 * p.spin; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, S.t * 14 * p.spin, S.t * 14 * p.spin + Math.PI * 1.4); ctx.stroke(); ctx.globalAlpha = 1; }
  else if (p.drawing) { ctx.strokeStyle = p.draw >= 1 ? '#ffffff' : C.ember; ctx.lineWidth = p.draw >= 1 ? 2.6 : 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * p.draw); ctx.stroke(); }
  else if (p.windup > 0) { ctx.strokeStyle = C.ember; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * (1 - p.windup / p.windupTotal)); ctx.stroke(); }
  else if (p.cd > 0) { ctx.strokeStyle = C.energy; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, a0, a0 + Math.PI * 2 * clamp(1 - p.cd / period, 0, 1)); ctx.stroke(); ctx.globalAlpha = 1; }
  else { ctx.strokeStyle = C.energy; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 5, 0, Math.PI * 2); ctx.stroke(); }
  if (S.gun.mag === 'm_drum') for (let i = 0; i < 2; i++) { ctx.fillStyle = i < p.shells && !(p.cd > 0.3 && p.shells === 2) ? C.ember : C.edge; ctx.fillRect(p.x - 5 + i * 6, p.y - p.r - 12, 4, 5); }
  const dm = dodgeMax();
  if (dm > 1) for (let i = 0; i < dm; i++) { ctx.fillStyle = i < p.dodgeN ? C.ink : C.edge; ctx.fillRect(p.x - dm * 2.5 + i * 5, p.y + p.r + 10, 3, 3); }
  if (p.reserve > 0.5) { ctx.strokeStyle = GODS.feast.color; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 11, a0, a0 + Math.PI * 2 * Math.min(1, p.reserve / resMax())); ctx.stroke(); }
  if (p.chargeCd > 0) { ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 8.5, a0, a0 + Math.PI * 2 * (1 - p.chargeCd / p.chargeCdMax)); ctx.stroke(); ctx.globalAlpha = 1; }

  // Efectos sobre todo
  for (const f of S.fx) {
    const k = 1 - f.t / f.life;
    if (f.k === 'tracer') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k; ctx.lineWidth = (2.2 * k + 0.6) * (f.w || 1); ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); }
    else if (f.k === 'ring') { ctx.strokeStyle = f.col; ctx.globalAlpha = k; ctx.lineWidth = 3 * k + 0.5; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - 0.6 * k), 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = f.col; ctx.globalAlpha = 0.18 * k; ctx.fill(); }
    else if (f.k === 'beam') { ctx.strokeStyle = f.col || C.energy; ctx.globalAlpha = k * 0.5; ctx.lineWidth = f.w * 3 * k; ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = k; ctx.lineWidth = f.w * k; ctx.stroke(); }
    else if (f.k === 'lob') { const u = f.t / f.life, x = f.x1 + (f.x2 - f.x1) * u, y = f.y1 + (f.y2 - f.y1) * u - Math.sin(u * Math.PI) * 26; const gx = Math.round(f.x1 + (f.x2 - f.x1) * u), gy = Math.round(f.y1 + (f.y2 - f.y1) * u); ctx.fillStyle = '#000000'; ctx.globalAlpha = 0.3; ctx.fillRect(gx - 3, gy - 1, 6, 2); ctx.globalAlpha = 1; ctx.fillStyle = '#16101a'; ctx.fillRect(Math.round(x) - 3, Math.round(y) - 2, 6, 4); ctx.fillRect(Math.round(x) - 2, Math.round(y) - 3, 4, 6); ctx.fillStyle = f.col; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 1, 1); }
    else if (f.k === 'smoke') { const sz = k > 0.6 ? 2 : 3; ctx.fillStyle = k > 0.5 ? '#b9b3ad' : '#7d7780'; ctx.globalAlpha = 0.55 * k; ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 1, sz, sz); }
    else if (f.k === 'flash') { ctx.fillStyle = '#ffe9a8'; ctx.fillRect(Math.round(f.x) - 2, Math.round(f.y) - 1, 4, 2); ctx.fillRect(Math.round(f.x) - 1, Math.round(f.y) - 2, 2, 4); ctx.fillStyle = '#ff8a3c'; ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y), 1, 1); ctx.fillRect(Math.round(f.x) + 2, Math.round(f.y) - 1, 1, 1); }
    else if (f.k === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = k; ctx.fillRect(f.x - 1, f.y - 1, 2, 2); }
    else if (f.k === 'num') wtext(f.txt, f.x, f.y, f.big ? 12 : 8, f.col || (f.big ? C.ember : C.ink), Math.min(1, k * 2));
    ctx.globalAlpha = 1;
  }

  lights();
}
