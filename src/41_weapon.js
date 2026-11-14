// ───────────────────────── Balas ─────────────────────────
// Un impacto de bala, venga de ti, de un eco, de un Cristal, de una Sombra o de un arma gemela
function onHit(e, dmg, ux, uy, big, col, src) {
  hit(e, dmg, ux, uy, big, col);
  const p = S.p, db = lv('dragon_basic'), vb = lv('venom_basic'), fb = lv('feast_basic'), sb = lv('stone_basic'), rb = lv('storm_basic');
  if (db) addEmber(e, db * (src === 'echo' && duoOn('eternal') ? 2 : 1));                         // Colmillo al rojo (y dúo Brasa eterna)
  if (vb) addVenom(e, vb);                                                                     // Dardo
  if (duoOn('boil')) addVenom(e, Math.floor(p.fury / 20));                                        // dúo Sangre hirviente
  if (fb) heal(0.5 * fb * (duoOn('warhunger') && furyFull() ? 3 : 1) * (p.feastShot ? 3 : 1));                            // Bocado
  if (rb) addNeedles(e, rb);                                                                   // Aguja estática
  if (src === 'player') {   // ofrendas y resonancia Vigilia
    if (res('vigil') && braced()) slow(e, 1, 0.4);
    if (has('d_warm') && p.shotN % 4 === 0) addEmber(e, 1);
    if (has('v_slow') && p.shotN % 3 === 0) addVenom(e, 1);
    if (has('r_spark') && p.shotN % 5 === 0) bolt(e, others(e, 120, 1)[0], dmg * 0.6, null);
  }
  if (lv('shade_basic') && active(e)) e.mark = 6;                                              // Marca de tumba
  if (sb && src === 'player') { p.crysN += 1; if (p.crysN % Math.max(1, 4 - sb) === 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }   // Esquirla
}
// Una bala tuya: además del impacto, deja eco (Segundero), la repiten los Cristales (Veta) y puede soltar un rayo
function shot(e, dmg, ux, uy, big, col) {
  const p = S.p, ox = p.x, oy = p.y;
  onHit(e, dmg, ux, uy, big, col, 'player');
  const tb = lv('time_basic'), sp = lv('stone_passive');
  if (tb) {
    const m = mastery('time') ? 1 : 0.5 + 0.15 * (tb - 1);
    const echo = (d, gen, extra) => S.timers.push({ t: echoDelay(1.5) + (extra || 0), fn: () => {
      if (!active(e)) return;
      S.fx.push({ k: 'tracer', x1: ox, y1: oy, x2: e.x, y2: e.y, t: 0, life: 0.14, col: GODS.time.color, w: 1.2 });
      onHit(e, d, ux, uy, false, GODS.time.color, 'echo');
      if (has('t_paradox') && gen < 2) echo(d * 0.6, gen + 1);                                 // Paradoja
    } });
    echo(dmg * m, 1);
    if (res('clockwork') && p.drawPow >= 1) echo(dmg * m, 1, 0.35);                             // resonancia Reloj de cuerda
  }
  if (sp && S.crystals.length) {                                                               // Veta
    const near = S.crystals.map(c => [Math.hypot(c.x - e.x, c.y - e.y), c]).filter(x => x[0] < 170).sort((a, b) => a[0] - b[0]).slice(0, mastery('stone') ? 2 : 1);
    for (const [d, c] of near) {
      S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: e.x, y2: e.y, t: 0, life: 0.1, col: GODS.stone.color });
      onHit(e, dmg * 0.3 * sp * (res('crossfire') ? 2 : 1), (e.x - c.x) / (d || 1), (e.y - c.y) / (d || 1), false, GODS.stone.color, 'crystal');   // Veta (y resonancia Fuego cruzado)
    }
  }
  if (duoOn('warthunder') && furyFull()) bolt(e, others(e, 120, 1)[0], dmg * 0.6, null);          // dúo Trueno de guerra
  if (G('m_chain')) {                                                                          // Bala enramada: salta al más cercano
    const o = others(e, 95, 1)[0];
    if (o) { const d = dist(e, o) || 1; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.14, col: C.ink, w: 1.6 }); S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 7, t: 0, life: 0.14, col: C.ink }); S.stat.chain++; onHit(o, dmg * 0.5, (o.x - e.x) / d, (o.y - e.y) / d, false, col, 'player'); }
  }
  if (G('m_heavy') && active(e) && !e.boss) { e.kx += ux * 150; e.ky += uy * 150; }               // Bala de cañón: empuja
}

// Un tirón del gatillo: mecanismo y cargador deciden cuánto y cómo; el cañón decide a quién le da.
function fireBasic(target) {
  const p = S.p, g = S.gun, draw = g.action === 'a_draw';
  if (!target || !active(target)) target = nearestInRange();
  if (!target && !draw) { p.cd = 0.12; p.crit = false; return; }   // tensando se puede soltar sin objetivo
  p.shotN += 1; p.trig += 1;
  let mult = gunDmg();
  if (S.gun.barrel === 'b_short' && p.quick > 0) { p.quick = 0; mult *= 2; p.quickBig = true; S.stat.quick++; note(p.x, p.y - 14, '¡Desenfundado!', C.ember, true); }   // Pistolete
  if (p.crit) { mult *= S.plans.has('tempo') ? 2 : 1.5; S.stat.tempo++; note(p.x, p.y - 14, '¡Compás!', C.ember, true); blip(1800, 0.09, 'sine', 0.05); }
  const imb = g.mag === 'm_charged' && p.trig % 5 === 0;
  if (imb) { mult *= 2.5; blip(1600, 0.1, 'sine', 0.05); }
  if (draw) mult *= 0.6 + 1.6 * p.drawPow;
  if (res('furnace')) mult *= 1 + 0.4 * p.heat;                              // resonancia Fragua viva
  const big = p.crit || imb || p.quickBig || (draw && p.drawPow >= 1), col = imb ? '#ffffff' : slotColor('basic');
  const reach = rangeOf() * (draw ? 0.6 + 0.4 * p.drawPow : 1);
  p.crit = false; p.quickBig = false;
  blip(1250, 0.07, 'square', 0.035, -700);
  if (g.action === 'a_burst') {          // Ráfaga: tres seguidos
    barrelFire(target, mult * 0.45, big, col, reach);
    for (const d of [0.07, 0.14]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { blip(1250, 0.05, 'square', 0.03, -700); barrelFire(t2, mult * 0.45, big, col, reach); } } });
  } else barrelFire(target, mult, big, col, reach);
  if (imb && target && active(target)) { S.stat.blessed++; explode(target.x, target.y, 40, p.dmg * 1.2, { col: '#ffffff' }); }   // Bala bendita
  if (res('leadstorm') && p.trig % 10 === 0 && target && active(target)) discharge(target, 1, null);        // resonancia Tormenta de plomo
  if (res('firingline')) for (const sh of S.shades) {                        // resonancia Línea de tiro
    let tg = null, td = 220;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(sh, e); if (d < td) { td = d; tg = e; } }
    if (tg) { S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: tg.x, y2: tg.y, t: 0, life: 0.09, col: GODS.shade.color }); onHit(tg, p.dmg * 0.3, (tg.x - sh.x) / (td || 1), (tg.y - sh.y) / (td || 1), false, GODS.shade.color, 'shade'); }
  }
  p.feastShot = false;
  // Cargador
  if (g.mag === 'm_drum') {              // dos disparos y a recargar
    p.shells -= 1;
    if (p.shells <= 0) { p.shells = 2; p.cd = periodOf() * 1.25; if (res('leadfeast')) { heal(4); p.feastShot = true; } }   // resonancia Banquete de plomo
    else p.cd = periodOf() * 0.22;
  }
  if (g.mag === 'm_belt') {              // la cinta calienta el arma
    p.heat = Math.min(1, p.heat + (g.action === 'a_rotary' ? 0.045 : 0.13)); p.heatT = 0.7;
    if (p.heat >= 1) { p.over = 1.6; p.spin = 0; p.drawing = false; note(p.x, p.y - 16, '¡Recalentada!', C.blood, true); blip(120, 0.4, 'sawtooth', 0.06, -60); if (res('furnace')) explode(p.x, p.y, 70, p.dmg * 2.5, { push: 200, col: GODS.orc.color }); }
  }
  // Culata de retroceso: cada disparo te aparta del enemigo
  if (g.stock === 's_recoil' && target && g.barrel !== 'b_spike' && p.dodgeT <= 0) { const d = dist(p, target) || 1; p.x -= (target.x - p.x) / d * 9; p.y -= (target.y - p.y) / d * 9; p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4); collide(p, p.r); }
}
// El cañón: a quién alcanza un disparo
function barrelFire(target, m, big, col, reach) {
  const p = S.p, B = S.gun.barrel;
  const ang = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face, ux = Math.cos(ang), uy = Math.sin(ang);
  p.face = ang;
  const tracer = (x2, y2, w) => S.fx.push({ k: 'tracer', x1: p.x + ux * 14, y1: p.y + uy * 14, x2, y2, t: 0, life: big ? 0.16 : 0.09, col, w: w || (big ? 2 : 1) });
  if (B === 'b_pierce') {                // atraviesa en línea y rebota una vez en los muros
    const total = reach + 30, h = rayHit(p.x, p.y, ux, uy, total); let left = 3;
    tracer(p.x + ux * h.len, p.y + uy * h.len, big ? 3 : 1.6);
    const along = (ox, oy, vx, vy, len) => S.enemies.filter(e => { if (!active(e)) return false; const ex = e.x - ox, ey = e.y - oy, al = ex * vx + ey * vy; return al >= 0 && al <= len + e.r && Math.abs(ex * vy - ey * vx) <= 5 + e.r; }).sort((a, b) => Math.hypot(a.x - ox, a.y - oy) - Math.hypot(b.x - ox, b.y - oy));
    for (const e of along(p.x, p.y, ux, uy, h.len)) { shot(e, p.dmg * m, ux, uy, big, col); if (res('quarry') && left-- > 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }   // resonancia Barreno
    if (h.side) {                        // rebote: el resto del recorrido, y un tramo de regalo
      const bx = p.x + ux * (h.len - 1), by = p.y + uy * (h.len - 1), vx = h.side === 'x' ? -ux : ux, vy = h.side === 'y' ? -uy : uy, l2 = rayHit(bx, by, vx, vy, total - h.len + 70).len;
      S.fx.push({ k: 'ring', x: bx, y: by, r: 6, t: 0, life: 0.12, col }); S.fx.push({ k: 'tracer', x1: bx, y1: by, x2: bx + vx * l2, y2: by + vy * l2, t: 0, life: big ? 0.2 : 0.13, col, w: big ? 2.4 : 1.4 });
      for (const e of along(bx, by, vx, vy, l2)) { S.stat.bounce++; shot(e, p.dmg * m, vx, vy, big, col); if (res('pinball') && active(e)) discharge(e, 1, null); }   // resonancia Carambola
    }
    if (big) S.shake = Math.max(S.shake, 3);
  } else if (!target) tracer(p.x + ux * reach, p.y + uy * reach);   // tensado soltado al aire
  else if (B === 'b_twin') {             // dos enemigos distintos a la vez
    const second = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort((a, b) => dist(p, a) - dist(p, b))[0] || target;
    tracer(target.x, target.y); shot(target, p.dmg * m * 0.55, ux, uy, big, col);
    S.timers.push({ t: 0.05, fn: () => { const t2 = active(second) ? second : active(target) ? target : null; if (!t2) return; const d = dist(p, t2) || 1; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: t2.x, y2: t2.y, t: 0, life: 0.09, col }); shot(t2, p.dmg * m * 0.55, (t2.x - p.x) / d, (t2.y - p.y) / d, big, col); } });
  } else if (B === 'b_scatter') {        // seis perdigones en abanico, con empujón
    for (const off of [-0.36, -0.22, -0.07, 0.07, 0.22, 0.36]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(p.x, p.y, rx, ry, reach + 20);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 3) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: p.x + rx * 12, y1: p.y + ry * 12, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col });
      if (bestE) { shot(bestE, p.dmg * m * 0.36, rx, ry, false, col); if (active(bestE) && !bestE.boss) { bestE.kx += rx * 110; bestE.ky += ry * 110; } }
    }
    S.shake = Math.max(S.shake, 4);
    if (res('dragonbreath')) S.zones.push({ x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * (reach + 10), y2: p.y + uy * (reach + 10), life: 2.2, acc: 0.4, ember: 1, col: GODS.dragon.color });   // resonancia Aliento de dragón
  } else if (B === 'b_bomb') {           // bomba en arco: pasa por encima de los muros y revienta en área
    const tx = target.x, ty = target.y, fl = 0.2 + dist(p, target) / 520, dm = p.dmg * m * 0.8;
    S.fx.push({ k: 'lob', x1: p.x + ux * 10, y1: p.y + uy * 10, x2: tx, y2: ty, t: 0, life: fl, col: '#3a3440' });
    S.fx.push({ k: 'ring', x: tx, y: ty, r: 16, t: 0, life: fl, col: C.ember });
    S.timers.push({ t: fl, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: 44, t: 0, life: 0.28, col: C.ember }); S.shake = Math.max(S.shake, big ? 5 : 3); blip(140, 0.18, 'sawtooth', 0.05, -80);
      let n = 0;
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = Math.hypot(e.x - tx, e.y - ty); if (d > 40 + e.r) continue; n++; shot(e, dm, (e.x - tx) / (d || 1), (e.y - ty) / (d || 1), big, col); }
      S.stat.bombHits += n; S.stat.bombs++;
      if (res('firerain')) S.zones.push({ x: tx, y: ty, r: 36, life: 2.5, acc: 0.4, ember: 1, col: GODS.dragon.color });   // resonancia Lluvia de brasas
    } });
  } else if (B === 'b_spike') {          // estocada que atraviesa
    shot(target, p.dmg * m * 1.8, ux, uy, true, col);
    if (res('executor')) { stun(target, 0.4); gainFury(15); }                // resonancia Verdugo
    if (!active(target)) { p.cd = 0; note(p.x, p.y - 14, '¡Otra!', C.ember); }
    if (p.dodgeT <= 0) lunge(ang, dist(p, target) + target.r + 22);
  } else {                               // arcabuz o pistolete: una bala a un enemigo
    const far = B === 'b_long' && dist(p, target) - target.r > reach * 0.5;
    if (far) S.fx.push({ k: 'ring', x: target.x, y: target.y, r: 9, t: 0, life: 0.15, col: C.ink });
    tracer(target.x, target.y, far ? 1.8 : 0); shot(target, p.dmg * m * (far ? 1.4 : 1), ux, uy, far || big, col);
    if (B === 'b_long') {                // Remate: si mata, la bala sigue
      let from = target, hops = 0;
      while (!active(from) && hops < 3) {
        const next = others(from, 115, 1)[0]; if (!next) break;
        const d = dist(from, next) || 1; hops++; S.stat.finish++;
        S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: next.x, y2: next.y, t: 0, life: 0.14, col, w: 1.6 });
        shot(next, p.dmg * m, (next.x - from.x) / d, (next.y - from.y) / d, big, col); from = next;
      }
      if (hops) note(target.x, target.y - 12, hops > 1 ? `¡Remate x${hops}!` : '¡Remate!', C.ember);
    }
  }
}
// Estocada: un esquive corto que atraviesa
function lunge(a, d) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.dodgeT = d / (p.speed * T.dodge.mult); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.dodgeFrom = { x: p.x, y: p.y }; p.dodgeHit = new Set(); p.isLunge = true; p.fly = false;
}

// ───────────────────────── Esquive ─────────────────────────
function startDodge(a, free) {
  const p = S.p;
  p.dvx = Math.cos(a); p.dvy = Math.sin(a);
  p.fly = lv('dragon_dodge') > 0;                                           // Vuelo: salto largo por encima de las columnas
  p.dodgeT = T.dodge.time * (p.fly ? 1.8 : 1) * (G('s_light') ? 1.3 : 1); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.dodgeFrom = { x: p.x, y: p.y }; p.isLunge = false; p.dodgeHit = new Set(); p.drawing = false; p.lanceDmg = 0;
  if (!free) { p.dodgeN -= 1; if (p.windup > 0) { p.windup = 0; p.cd = 0.1; } p.charging = false; p.charge = 0; }
  blip(420, 0.1, 'triangle', 0.04, 500);
  if (lv('stone_dodge')) addCrystal(p.x, p.y);                              // Geoda
  const td = lv('time_dodge'), sd = lv('shade_dodge');
  if (td) S.fields.push({ x: p.x, y: p.y, r: 80, life: 2 + td, life0: 2 + td });   // Hora muerta
  if (sd) raiseShade(p.x, p.y, 3 + sd, true);                               // Relevo
}
function endDodge() {
  const p = S.p, vd = lv('venom_dodge'), dd = lv('dragon_dodge'), from = p.dodgeFrom;
  if (!from) return;
  if (p.lanceDmg && res('cavalry')) { S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 3, acc: 0.4, ember: 2, col: GODS.dragon.color }); explode(p.x, p.y, 55, p.dmg * 2, { col: GODS.dragon.color }); }   // resonancia Carga de caballería
  if (vd) {                                                                 // Rastro
    S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 5, acc: 0.4, venom: vd, col: GODS.venom.color });
    if (duoOn('stalagm')) for (const k of [0.2, 0.5, 0.8]) addCrystal(from.x + (p.x - from.x) * k, from.y + (p.y - from.y) * k);   // dúo Estela de cristal
  }
  if (p.fly && dd) explode(p.x, p.y, 52, p.dmg * 1.5 * dd, { col: GODS.dragon.color, zap: duoOn('comet') });   // Vuelo (y dúo Cometa)
  if (S.plans.has('echo') && !p.isLunge) S.turrets.push({ x: from.x, y: from.y, life: 3, cd: 0.15 });        // Arma gemela
  if (!p.isLunge) { if (G('s_light')) { p.cd = 0; p.windup = 0; } if (G('b_short')) { p.quick = 1.2; p.cd = 0; } }   // Culata de fresno / Pistolete: sales del esquive con el arma lista
  p.dodgeFrom = null; p.fly = false; p.lanceDmg = 0;
}
// Lo que pasa al atravesar a un enemigo con el esquive
function dashThrough(e) {
  const p = S.p, od = lv('orc_dodge'), fd = lv('feast_dodge'), rd = lv('storm_dodge');
  if (p.lanceDmg) { hit(e, p.lanceDmg, p.dvx, p.dvy, true, C.energy); if (active(e)) chargePayoff(e); }      // carga de la lanza
  if (rd && active(e)) { if (e.needles > 0) { const n = discharge(e, 0.8 + 0.2 * (rd - 1), null); if (duoOn('toast')) heal(2 * n); } else addNeedles(e, 2); }   // Paso relámpago (y dúo Brindis eléctrico)
  if (fd && active(e)) { hit(e, p.dmg * 0.6 * fd, p.dvx, p.dvy, false, GODS.feast.color); heal(3 * fd); }   // Brindis
  if (od && active(e)) {                                                    // Embestida
    hit(e, p.dmg * od, p.dvx, p.dvy, true, GODS.orc.color); gainFury(15);
    if (duoOn('horde')) for (const s of S.shades) { S.fx.push({ k: 'tracer', x1: s.x, y1: s.y, x2: e.x, y2: e.y, t: 0, life: 0.15, col: GODS.shade.color, w: 1.5 }); s.x = e.x + rnd(-10, 10); s.y = e.y + rnd(-10, 10); hit(e, p.dmg, p.dvx, p.dvy, false, GODS.shade.color); }   // dúo Carga de la horda
    if (active(e)) { e.kx += p.dvx * 200; e.ky += p.dvy * 200; stun(e, 0.35); if (duoOn('avalanche') && !e.boss) { e.fling = e.champ ? 0.22 : 0.4; e.fvx = p.dvx * 430; e.fvy = p.dvy * 430; } }   // dúo Avalancha
  }
}

// ───────────────────────── Disparo cargado ─────────────────────────
// Lo que hace el cargado a cada enemigo que alcanza, sea con el rayo, el cono, el abanico, el aluvión o un Cristal
function chargePayoff(e) {
  const dc = lv('dragon_charge'), vc = lv('venom_charge'), rc = lv('storm_charge'), p = S.p;
  if (duoOn('rot')) { const t = e.ember + e.venom; if (t > 0) { if (t > e.ember) addEmber(e, t - e.ember); e.venom = Math.min(30, t); } }   // dúo Aliento podrido
  if (dc) {                                                                 // Aliento
    addEmber(e, 1 + dc);
    const st = e.ember;
    if (st > 0 && active(e)) { e.ember = 0; explode(e.x, e.y, 40, p.dmg * (0.35 + 0.1 * (dc - 1)) * st, { col: GODS.dragon.color, ember: 1 }); }
  }
  if (vc && active(e) && e.venom > 0) {                                     // Purga
    const st = e.venom; e.venom = Math.ceil(st / 2);
    S.zones.push({ x: e.x, y: e.y, r: 30, life: 5, acc: 0.4, venom: 1, col: GODS.venom.color });
    hit(e, p.dmg * 0.15 * vc * st, 0, 0, true, GODS.venom.color);
  }
  if (rc && active(e)) discharge(e, 0.7 + 0.2 * (rc - 1), null);            // Sobretensión
}
// snap: desde dónde y con qué fuerza se lanzó. echo: repetición de Rebobinar (no gasta nada ni tiene recarga).
function castCharged(snap, mult, echo) {
  const p = S.p, ch = T.charge, o = { x: snap.x, y: snap.y }, CH = S.gun.chamber;
  const dmg = p.dmg * (1.5 + (ch.dmgMult - 1.5) * snap.ratio) * mult * snap.bonus;
  const ux = Math.cos(snap.dir), uy = Math.sin(snap.dir), col = slotColor('charge');
  const strike = (e, d, dx, dy) => { hit(e, d, dx, dy, true, col); chargePayoff(e); };
  if (S.plans.has('mortar') && CH === 'c_beam') {   // Mortero: proyectil en arco con área
    S.fx.push({ k: 'lob', x1: o.x, y1: o.y, x2: snap.tx, y2: snap.ty, t: 0, life: 0.3, col });
    S.timers.push({ t: 0.3, fn: () => { explode(snap.tx, snap.ty, 58, dmg * 0.8, { col, payoff: true }); S.shake = Math.max(S.shake, 7); } });
  } else if (CH === 'c_fan' || CH === 'c_blast') {   // abanico (nueve) o andanada con retroceso (quince)
    const blast = CH === 'c_blast', n = blast ? 15 : 9, half = blast ? 0.6 : 0.85, reach = blast ? 130 : 165, seen = new Set();
    for (let i = 0; i < n; i++) {
      const a = snap.dir - half + 2 * half * i / (n - 1), rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(o.x, o.y, rx, ry, reach);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - o.x, ey = e.y - o.y, al = ex * rx + ey * ry;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 4) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: o.x + rx * 10, y1: o.y + ry * 10, x2: o.x + rx * ba, y2: o.y + ry * ba, t: 0, life: 0.12, col });
      if (bestE) { if (echo) hit(bestE, dmg * 0.22, rx, ry, false, col); else shot(bestE, dmg * 0.22, rx, ry, false, col); seen.add(bestE); }
    }
    for (const e of seen) if (active(e)) chargePayoff(e);
    if (blast) {
      for (const e of seen) if (active(e) && !e.boss) { const d = dist(o, e) || 1; e.kx += (e.x - o.x) / d * 320; e.ky += (e.y - o.y) / d * 320; stun(e, 0.5); }
      if (!echo) { lunge(snap.dir + Math.PI, 105); S.shake = Math.max(S.shake, 8); }
    }
  } else if (CH === 'c_rain') {          // aluvión sobre una zona
    const tx = snap.tx, ty = snap.ty, R = 62;
    if (res('acidrain')) S.zones.push({ x: tx, y: ty, r: R, life: 5, acc: 0.4, venom: 2, col: GODS.venom.color });   // resonancia Lluvia ácida
    for (let w = 0; w < 3; w++) S.timers.push({ t: 0.15 + w * 0.22, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: R, t: 0, life: 0.2, col });
      for (let i = 0; i < 7; i++) { const a = Math.random() * 6.28, r = Math.random() * R, x = tx + Math.cos(a) * r, y = ty + Math.sin(a) * r; S.fx.push({ k: 'tracer', x1: x + 12, y1: y - 38, x2: x, y2: y, t: 0, life: 0.14, col }); }
      blip(900, 0.06, 'triangle', 0.03, -400);
      for (const e of S.enemies.slice()) { if (!active(e) || Math.hypot(e.x - tx, e.y - ty) > R + e.r) continue; hit(e, dmg * 0.45, 0, 0, w === 0, col); if (w === 0) chargePayoff(e); }
    } });
  } else if (CH === 'c_supp') {          // supresión: tres segundos disparando sola a todo lo que haya cerca
    if (!echo) { p.heat = 0; p.over = 0; }
    for (let i = 0; i < 36; i++) S.timers.push({ t: 0.08 * i, fn: () => {
      const near = S.enemies.filter(e => active(e) && dist(o, e) - e.r <= rangeOf() && !blocked(o, e));
      if (!near.length) return;
      const e = near[Math.floor(Math.random() * near.length)], dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy) || 1;
      S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: e.x, y2: e.y, t: 0, life: 0.07, col });
      if (i % 6 === 0) blip(1100, 0.04, 'square', 0.025, -500);
      if (echo) hit(e, dmg * 0.09, dx / d, dy / d, false, col); else shot(e, dmg * 0.09, dx / d, dy / d, false, col);
      if (i % 9 === 0) chargePayoff(e);
    } });
  } else if (CH === 'c_dash') {          // embestida larga que atraviesa (el eco no se mueve)
    if (!echo) { lunge(snap.dir, 240); p.lanceDmg = dmg * 0.6; }
  } else if (lv('dragon_charge')) {      // Aliento: el rayo se abre en cono (crece con la Furia en el dúo Rugido)
    const k = duoOn('roar') ? 1 + snap.fury / 100 : 1, R = 175 * k, half = Math.min(1.2, 0.5 * k);
    S.fx.push({ k: 'cone', x: o.x, y: o.y, a: snap.dir, r: R, half, t: 0, life: 0.3, col: GODS.dragon.color });
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const d = dist(o, e);
      if (d > R + e.r || Math.abs(angDiff(Math.atan2(e.y - o.y, e.x - o.x), snap.dir)) > half || blocked(o, e)) continue;
      strike(e, dmg, (e.x - o.x) / (d || 1), (e.y - o.y) / (d || 1));
    }
  } else {                               // rayo que atraviesa
    const len = rayClip(o.x, o.y, ux, uy, ch.range);
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const ex = e.x - o.x, ey = e.y - o.y, along = ex * ux + ey * uy;
      if (along < 0 || along > len || Math.abs(ex * uy - ey * ux) > ch.width + e.r) continue;
      strike(e, dmg, ux, uy);
    }
    S.fx.push({ k: 'beam', x1: o.x + ux * 14, y1: o.y + uy * 14, x2: o.x + ux * len, y2: o.y + uy * len, t: 0, life: 0.22, w: 3 + 5 * snap.ratio, col });
  }
  const sc = lv('stone_charge'), oc = lv('orc_charge'), hc = lv('shade_charge');
  if (sc) for (const c of S.crystals) {  // Prisma: cada Cristal dispara su propio rayo, con los efectos del cargado
    let tg = null, td = 210;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(c, e); if (d < td && !blocked(c, e)) { td = d; tg = e; } }
    if (!tg) continue;
    S.fx.push({ k: 'beam', x1: c.x, y1: c.y, x2: tg.x, y2: tg.y, t: 0, life: 0.2, w: 2.5, col: GODS.stone.color });
    hit(tg, dmg * 0.4 * sc, (tg.x - c.x) / (td || 1), (tg.y - c.y) / (td || 1), true, GODS.stone.color);
    chargePayoff(tg);
  }
  if (oc) {                              // Grito de guerra: gasta la Furia (el eco no gasta; el dúo Rugido gasta la mitad)
    const f = snap.fury;
    if (!echo) p.fury = Math.max(mastery('orc') ? 50 : 0, duoOn('roar') ? p.fury / 2 : 0);
    explode(o.x, o.y, 45 + f * 0.7, p.dmg * (0.5 + 2 * oc * f / 100) * (echo && duoOn('echocry') ? 1 : mult), { push: 220, stun: 0.4 + f / 100, col: GODS.orc.color });
  }
  if (hc && S.shades.length) {           // Orden: las Sombras se lanzan y estallan
    for (const sh of S.shades) {
      const x = snap.tx + rnd(-14, 14), y = snap.ty + rnd(-14, 14);
      S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: x, y2: y, t: 0, life: 0.2, col: GODS.shade.color, w: 2 });
      explode(x, y, 45, p.dmg * 1.5 * hc * mult, { col: GODS.shade.color, venom: duoOn('cortege') ? 6 : 0 });
      if (duoOn('cortege')) S.zones.push({ x, y, r: 34, life: 5, acc: 0.4, venom: 1, col: GODS.venom.color });   // dúo Cortejo fúnebre
      if (duoOn('supper')) addReserve(5);                                                                       // dúo Última cena
    }
    S.shades = [];
  }
}
function fireCharged(am) {
  const p = S.p, ch = T.charge, CH = S.gun.chamber, moves = CH === 'c_dash' || CH === 'c_blast';
  const ratio = clamp(p.charge / ch.full, 0, 1), ux = Math.cos(p.chargeDir), uy = Math.sin(p.chargeDir);
  const tg = S.target && active(S.target) && am <= 0.35 ? S.target : null, reach = CH === 'c_rain' ? 190 : 170;
  const fl = lv('feast_charge'), tc = lv('time_charge');
  const snap = { x: p.x, y: p.y, dir: p.chargeDir, ratio, fury: p.fury, bonus: 1,
    tx: clamp(tg ? tg.x : p.x + ux * reach, 0, T.room.w), ty: clamp(tg ? tg.y : p.y + uy * reach, 0, T.room.h) };
  if (fl) { snap.bonus = 1 + 0.04 * fl * p.reserve; p.reserve = 0; S.banquet = S.t + 0.6; }   // Banquete
  castCharged(snap, 1, false);
  if (tc) {                              // Rebobinar: se repite desde el mismo sitio
    const m = mastery('time') ? 1 : 0.6 + 0.15 * (tc - 1), d = echoDelay(2);
    S.fx.push({ k: 'clock', x: snap.x, y: snap.y, t: 0, life: d });
    S.timers.push({ t: d, fn: () => castCharged(Object.assign({}, snap, { bonus: 1 }), m, true) });
  }
  let cd = ch.cd;
  p.cd = Math.max(p.cd, 0.25);
  if (S.plans.has('recoil') && !moves) { cd *= 0.65; startDodge(Math.atan2(-uy, -ux), true); }
  else if (!moves) { p.x -= ux * 6; p.y -= uy * 6; }
  p.chargeCdMax = p.chargeCd = cd;
  S.shake = Math.max(S.shake, 4 + 4 * ratio);
  blip(300, 0.3, 'sawtooth', 0.06, -220);
}

function hurtPlayer(dmg) {
  const p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  dmg *= (1 - 0.05 * tk('skin')) * (has('m_skin') ? 0.9 : 1) * (1.2 + 0.3 * (S.world - 1));
  if (p.reserve > 0) { const a = Math.min(p.reserve, dmg); p.reserve -= a; dmg -= a; }   // la Reserva hace de escudo
  p.hp -= dmg; p.inv = 0.5; S.hurtFx = 0.35; S.shake = Math.max(S.shake, 6);
  gainFury(15);
  blip(110, 0.18, 'sawtooth', 0.07, -50);
  if (p.hp <= 0 && p.revive > 0) {   // Segundo aliento
    p.revive -= 1; p.hp = Math.round(p.maxHp * (0.1 + 0.2 * tk('revive'))); p.inv = 1.5;
    note(p.x, p.y - 18, 'Segundo aliento', C.ember, true); blip(440, 0.5, 'triangle', 0.07, 600);
  } else if (p.hp <= 0) { p.hp = 0; endRun(false); setMode('dead'); }
}

