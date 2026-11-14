// ───────────────────────── Actualización ─────────────────────────
function update(dt) {
  const p = S.p, P = T.player;
  S.t += dt;
  S.shake = Math.max(0, S.shake - dt * 22);
  S.hurtFx = Math.max(0, S.hurtFx - dt);
  S.noTarget = Math.max(0, S.noTarget - dt);
  if (S.hitstop > 0) { S.hitstop -= dt; return; }
  if (S.timers.length) { const due = []; for (const tm of S.timers) { tm.t -= dt; if (tm.t <= 0) due.push(tm); } S.timers = S.timers.filter(tm => tm.t > 0); for (const tm of due) tm.fn(); }

  navUpdate(dt);
  // Red de seguridad: si nadie recibe daño en 25 s y no queda nadie por llegar, los que quedan reaparecen a la vista
  if (S.enemies.length && !S.queue.length && S.t - (S.lastHitT || 0) > 25 && S.t - (S.roomT || 0) > 25) {
    S.lastHitT = S.t;
    for (const e of S.enemies) { if (e.boss || e.type.post) continue; let at = null; for (let i = 0; i < 12; i++) { const c = freeSpot(p, 70); if (dist(c, p) < 190 && !blocked(c, p)) { at = c; break; } } if (at) { e.x = at.x; e.y = at.y; e.spawn = 0.65; e.kx = e.ky = 0; e.leapT = 0; e.fling = 0; } }
  }

  // Oleadas
  S.waveT += dt;
  while (S.queue.length && S.queue[0].at <= S.waveT) { const q = S.queue.shift(); spawn(q.type, q); }
  if (S.keep) S.keep.flash = Math.max(0, S.keep.flash - dt);
  if (S.pendingLoot) { S.pendingLoot = false; pickQueue = [pieceScreen(lootGod(), 'Estandarte derribado · bajo él había un arma bendecida')]; S.rerolls = tk('reroll'); afterPicks = resumePlay; advancePick(); return; }
  if (!S.queue.length && !S.enemies.length) {
    S.waveClear += dt;
    if (S.waveClear > 0.7) { S.waveClear = 0; S.shots.length = 0; S.zones.length = 0; S.timers.length = 0; S.hazards.length = 0; S.lasers.length = 0; roomCleared(); return; }
  }

  // Temporizadores y recursos
  p.cd = Math.max(0, p.cd - dt);
  p.chargeCd = Math.max(0, p.chargeCd - dt); p.inv = Math.max(0, p.inv - dt); p.buffer = Math.max(0, p.buffer - dt);
  const ready = p.cd <= 0 && p.windup <= 0;
  if (ready && !p.wasReady) { p.readyT = S.t; blip(1900, 0.02, 'sine', 0.012); }
  p.wasReady = ready;
  p.furyT -= dt;
  const floor = mastery('orc') ? 50 : 0;
  if (p.furyT <= 0 && p.fury > floor) p.fury = Math.max(floor, p.fury - 8 * dt); else if (p.fury < floor) p.fury = floor;
  p.resT -= dt;
  if (p.reserve > resMax()) p.reserve = resMax();
  if (p.reserve > 0 && p.resT <= 0 && !duoOn('longlunch')) p.reserve = Math.max(0, p.reserve - 2 * dt);

  // Esquive (por cargas)
  const dMax = dodgeMax();
  if (p.dodgeN < dMax) { p.dodgeCd -= dt; if (p.dodgeCd <= 0) { p.dodgeN += 1; p.dodgeCd = dodgeCdOf(); } } else p.dodgeCd = dodgeCdOf();
  if (I.dodgeP && p.dodgeN > 0 && p.dodgeT <= 0) startDodge(Math.hypot(I.mx, I.my) > 0.2 ? Math.atan2(I.my, I.mx) : p.face, false);

  // Objetivo
  if (I.clearP) S.lock = null;
  if (S.lock && (!active(S.lock) || dist(p, S.lock) - S.lock.r > rangeOf() * 1.2)) S.lock = null;
  const am = Math.hypot(I.ax, I.ay);
  if (am > 0.6 && !aimLatch && !p.charging) {
    aimLatch = true;
    const ang = Math.atan2(I.ay, I.ax); let bestE = null, bs = 1e9;
    for (const e of S.enemies) {
      if (!active(e)) continue;
      const d = dist(p, e);
      if (d - e.r > rangeOf() * 1.1) continue;
      const da = Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang));
      if (da > 0.75) continue;
      const score = da * 130 + d * 0.3;
      if (score < bs) { bs = score; bestE = e; }
    }
    if (bestE) { S.lock = bestE; blip(900, 0.04, 'triangle', 0.03); }
  }
  if (am < 0.3) aimLatch = false;
  const target = (S.lock && dist(p, S.lock) - S.lock.r <= rangeOf() && !blocked(p, S.lock)) ? S.lock : nearestInRange();
  S.target = target;

  // Disparo cargado
  if (I.chg && !p.charging && !p.drawing && p.chargeCd <= 0 && p.dodgeT <= 0 && p.windup <= 0) { p.charging = true; p.charge = 0; p.chargeDir = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.face; }
  if (p.charging) {
    const before = p.charge; p.charge += dt * (1 + 0.1 * tk('armorer'));
    if (before < T.charge.full && p.charge >= T.charge.full) blip(1500, 0.06, 'sine', 0.04);
    if (am > 0.35) p.chargeDir = Math.atan2(I.ay, I.ax);
    else if (target) p.chargeDir = Math.atan2(target.y - p.y, target.x - p.x);
    p.face = p.chargeDir;
    if (!I.chg) { if (p.charge >= T.charge.min) fireCharged(am); p.charging = false; p.charge = 0; }
  }

  // Disparo básico: cada disparo es un gesto corto que te frena
  if (I.atkP) { if (p.cd > T.buffer) p.spoil = true; p.buffer = T.buffer; if (!target) S.noTarget = 0.25; }
  const g = S.gun, A = g.action, want = p.buffer > 0 || I.atk || A === 'a_auto';
  if (p.over > 0) p.over -= dt;
  p.runUp = g.action === 'a_semi' && p.still < 0.25 ? Math.min(1, p.runUp + dt / 3) : 0;   // Llave de chispa: carrerilla
  p.wardCd = Math.max(0, (p.wardCd || 0) - dt);
  if (g.barrel === 'b_flail') {   // Mangual: la bola gira y golpea lo que toca
    p.orbAway = Math.max(0, p.orbAway - dt); p.orbA += dt * 5.2;
    if (p.orbAway <= 0) { const bx = p.x + Math.cos(p.orbA) * 34, by = p.y + Math.sin(p.orbA) * 34;
      for (const e of S.enemies.slice()) if (active(e) && (e.orbT || 0) <= S.t && Math.hypot(e.x - bx, e.y - by) < e.r + 7) { e.orbT = S.t + 0.45; S.stat.orb++; const d = dist(p, e) || 1; shot(e, p.dmg * gunDmg() * 0.7, (e.x - p.x) / d, (e.y - p.y) / d, false, slotColor('basic')); } }
  }
  for (const mn of S.mines) {     // minas de la Recámara de minas
    mn.life -= dt;
    if (S.enemies.some(e => active(e) && !e.type.fly && Math.hypot(e.x - mn.x, e.y - mn.y) < e.r + 9)) { mn.life = 0; S.stat.mine++; explode(mn.x, mn.y, 50, mn.dmg, { col: mn.col, payoff: true }); }
  }
  S.mines = S.mines.filter(mn => mn.life > 0);
  p.quick = Math.max(0, p.quick - dt); p.buttCd = Math.max(0, p.buttCd - dt);
  if (g.stock === 's_heavy' && p.buttCd <= 0 && p.dodgeT <= 0) {   // Culata herrada: culatazo a quien se pegue
    const near = S.enemies.filter(e => active(e) && !e.boss && dist(p, e) < p.r + e.r + 9);
    if (near.length) {
      p.buttCd = 2.5; S.stat.butt++; S.shake = Math.max(S.shake, 4); blip(180, 0.12, 'square', 0.06, -60); note(p.x, p.y - 16, '¡Culatazo!', C.ember, true);
      S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 26, t: 0, life: 0.18, col: C.ink });
      for (const e of near) { const d = dist(p, e) || 1; hit(e, p.dmg * 0.8, (e.x - p.x) / d, (e.y - p.y) / d, true, C.ink); if (active(e)) { e.kx += (e.x - p.x) / d * 300; e.ky += (e.y - p.y) / d * 300; stun(e, 0.6); } }
    }
  }
  p.heatT -= dt; if (p.heatT <= 0) p.heat = Math.max(0, p.heat - dt * 0.45);
  const canFire = p.over <= 0 && !p.charging && p.dodgeT <= 0;
  if (A === 'a_hold') {   // Llave de retén: guardar hasta tres balas y soltarlas
    if (I.atk && canFire && p.cd <= 0) { p.drawing = true; p.draw = Math.min(1, p.draw + dt / (periodOf() * 2.2)); if (target) p.face = Math.atan2(target.y - p.y, target.x - p.x); }
    else if (p.drawing) {
      p.drawing = false; const n = 1 + Math.floor(p.draw * 2 + 0.001); p.draw = 0; p.cd = periodOf() * 0.5; S.stat.hold = (S.stat.hold || 0) + n;
      for (let i = 0; i < n; i++) S.timers.push({ t: 0.09 * i, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) fireBasic(t2); } });
    }
  } else if (A === 'a_draw') {   // De tensado: mantener para tensar, soltar para disparar
    if (I.atk && !p.drawing && p.cd <= 0 && canFire) { p.drawing = true; p.draw = 0; }
    if (p.drawing) {
      const before = p.draw; p.draw = Math.min(1, p.draw + dt / (periodOf() * 0.85));
      if (before < 1 && p.draw >= 1) blip(1700, 0.05, 'sine', 0.04);
      if (target) p.face = Math.atan2(target.y - p.y, target.x - p.x);
      if (!I.atk) { p.drawing = false; p.drawPow = p.draw; p.cd = periodOf() * 0.3; fireBasic(target); }
    }
  } else if (A === 'a_rotary') {   // Giratorio: girar y escupir
    if (I.atk && canFire) {
      const was = p.spin; p.spin = Math.min(1, p.spin + dt / 0.5);
      if (was < 1 && p.spin >= 1) blip(900, 0.08, 'sawtooth', 0.03, 600);
      if (p.spin >= 1 && target && p.cd <= 0) {
        p.gat -= dt;
        const step = periodOf() / 6.6;                       // unas siete veces por segundo con la cadencia base
        while (p.gat <= 0 && p.cd <= 0 && p.over <= 0) { p.gat += step; fireBasic(target); }
      }
    } else { p.spin = Math.max(0, p.spin - dt * 2.5); p.gat = 0; }
  } else if (want && target && canFire && p.windup <= 0 && p.cd <= 0) {   // Cerrojo, semiautomático y ráfaga: a pulsaciones
    const period = periodOf();
    p.crit = (A === 'a_bolt' || A === 'a_pend' || S.plans.has('tempo')) && p.buffer > 0 && !p.spoil && S.t - p.readyT <= 0.13;   // Compás: pulsación justa
    p.spoil = false;
    p.windupTotal = p.windup = period * P.windupFrac * (A === 'a_semi' ? 0.5 : A === 'a_burst' ? 1.25 : 1) * (g.stock === 's_heavy' ? 1.3 : 1) * (g.barrel === 'b_spike' ? 0.6 : 1) * (1 - 0.06 * tk('brake'));
    if (g.barrel === 'b_short' && p.quick > 0) p.windupTotal = p.windup = 0.03;   // Pistolete: desenfundar no tiene frenazo
    p.windupTarget = target; p.cd = period; p.buffer = 0;
    if (A === 'a_fuse') { p.windup = 0; const tg = target; S.fx.push({ k: 'clock', x: p.x, y: p.y, t: 0, life: 0.5 }); S.timers.push({ t: 0.5, fn: () => { if (S.p.dodgeT <= 0) fireBasic(tg); } }); }   // Mecha lenta: sale sola medio segundo después
  }
  if (p.windup > 0) {
    const wt = p.windupTarget && active(p.windupTarget) ? p.windupTarget : target;
    if (wt) p.face = Math.atan2(wt.y - p.y, wt.x - p.x);
    p.windup -= dt;
    if (p.windup <= 0) { p.windup = 0; fireBasic(p.windupTarget); }
  }

  // Movimiento
  const free = has('o_berserk') && furyFull();                             // Berserker: sin frenazo
  let mult = 1;
  if (p.charging) mult = T.charge.slow;
  else if (p.drawing) mult = free ? 1 : 0.4;
  else if (p.windup > 0) mult = free || A === 'a_semi' ? 1 : P.windupSlow;
  else if (I.atk && A === 'a_rotary') mult = free ? 1 : p.over > 0 ? 0.8 : 0.3 + 0.35 * (1 - p.spin);
  else if (I.atk && target) mult = free || A === 'a_semi' ? 1 : P.holdSlow;
  p.still = Math.hypot(I.mx, I.my) < 0.2 && p.dodgeT <= 0 ? p.still + dt : 0;   // para el Bípode
  if (p.dodgeT > 0) {
    p.dodgeT -= dt;
    p.x += p.dvx * p.speed * T.dodge.mult * dt; p.y += p.dvy * p.speed * T.dodge.mult * dt;
    if (Math.random() < 0.7) S.fx.push({ k: 'ghost', x: p.x, y: p.y, t: 0, life: 0.18 });
    for (const e of S.enemies.slice()) if (active(e) && !p.dodgeHit.has(e) && dist(p, e) < p.r + e.r + 9) { p.dodgeHit.add(e); dashThrough(e); }
    const sd = lv('stone_dodge');                                          // Geoda: reventar Cristales al atravesarlos
    if (sd) for (const c of S.crystals.slice()) if (dist(p, c) < 13 && !(p.dodgeFrom && dist(p.dodgeFrom, c) < 4)) { S.crystals.splice(S.crystals.indexOf(c), 1); explode(c.x, c.y, 42, p.dmg * 1.2 * sd, { col: GODS.stone.color }); }
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
    if (!p.fly) collide(p, p.r);
    if (p.dodgeT <= 0) { collide(p, p.r); endDodge(); }
  } else {
    p.x += I.mx * p.speed * mult * dt; p.y += I.my * p.speed * mult * dt;
    if (Math.hypot(I.mx, I.my) > 0.2 && p.windup <= 0 && !p.charging && !(p.drawing && target)) p.face = Math.atan2(I.my, I.mx);
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4);
    collide(p, p.r);
  }

  // Armas gemelas
  for (const tu of S.turrets) {
    tu.life -= dt; tu.cd -= dt;
    if (tu.cd > 0) continue;
    let bestE = null, bd = rangeOf();
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(tu, e) - e.r; if (d < bd && !blocked(tu, e)) { bd = d; bestE = e; } }
    if (!bestE) { tu.cd = 0.1; continue; }
    const dx = bestE.x - tu.x, dy = bestE.y - tu.y, d = Math.hypot(dx, dy) || 1, col = slotColor('basic');
    S.fx.push({ k: 'tracer', x1: tu.x, y1: tu.y, x2: bestE.x, y2: bestE.y, t: 0, life: 0.09, col });
    onHit(bestE, p.dmg * (tu.k || 0.5), dx / d, dy / d, false, col, 'turret');
    tu.cd = periodOf();
  }
  S.turrets = S.turrets.filter(tu => tu.life > 0);

  // Sombras: buscan al enemigo más cercano y lo golpean
  for (const s of S.shades) {
    s.life -= dt; s.cd -= dt;
    let tg = null, td = 320;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(s, e); if (d < td) { td = d; tg = e; } }
    if (tg) {
      if (td > tg.r + 8) { s.x += (tg.x - s.x) / td * 100 * dt; s.y += (tg.y - s.y) / td * 100 * dt; }
      else if (s.cd <= 0) { s.cd = 0.7; shadeStrike(s, tg); }
    }
    if (has('s_guard')) for (const sh of S.shots) if (Math.hypot(sh.x - s.x, sh.y - s.y) < 11) sh.life = 0;   // Guardia de honor
  }
  for (const s of S.shades) if (s.life <= 0) shadeEnd(s);
  S.shades = S.shades.filter(s => s.life > 0);

  // Burbujas de tiempo
  const miasma = duoOn('miasma'), stasis = duoOn('stasis');
  for (const f of S.fields) {
    f.life -= dt;
    for (const e of S.enemies) {
      if (!active(e) || dist(f, e) > f.r + e.r) continue;
      slow(e, 0.15, 0.3);
      if (miasma && e.venom > 0) e.venAcc += dt * 2;                       // dúo Miasma
      if (stasis) { e.fieldAcc += dt; if (e.fieldAcc >= 1) { e.fieldAcc = 0; addNeedles(e, 1); } }   // dúo Relámpago en pausa
    }
    for (const sh of S.shots) if (Math.hypot(sh.x - f.x, sh.y - f.y) < f.r) { sh.x -= sh.vx * dt * 0.7; sh.y -= sh.vy * dt * 0.7; }
    if (f.life <= 0 && stasis) for (const e of S.enemies.slice()) if (active(e) && dist(f, e) <= f.r + e.r) discharge(e, 0.8, null);
  }
  S.fields = S.fields.filter(f => f.life > 0);

  // Cristales
  const obs = duoOn('obsidian'), tox = duoOn('stalagm'), tab = duoOn('table'), cq = duoOn('clockquartz');
  for (const c of S.crystals) {
    c.life -= dt; c.acc += dt;
    if (c.acc < 0.5 || !(obs || tox || tab || cq)) continue;
    c.acc = 0;
    let fed = false;
    for (const e of S.enemies.slice()) {
      if (!active(e)) continue;
      const d = dist(c, e) - e.r;
      if (obs && d < 42) addEmber(e, 1);                                   // dúo Bala de obsidiana
      if (tox && d < 42) addVenom(e, 2);                                   // dúo Estela de cristal
      if (cq && d < 50) { slow(e, 0.6, 0.6); fed = true; }                 // dúo Cuarzo de reloj
      if (tab && d < 60 && !e.boss && e.hp / e.maxHp < (e.champ ? 0.1 : 0.2)) {   // dúo Mesa puesta
        S.fx.push({ k: 'tracer', x1: c.x, y1: c.y, x2: e.x, y2: e.y, t: 0, life: 0.15, col: GODS.feast.color, w: 1.5 });
        hit(e, e.hp + 1, 0, 0, true, GODS.feast.color); addReserve(4);
      }
    }
    if (fed) c.life += 0.5;
  }
  for (const c of S.crystals) if (c.life <= 0) {
    if (obs) explode(c.x, c.y, 38, p.dmg, { col: GODS.dragon.color, ember: 2 });
    if (duoOn('tombstone')) raiseShade(c.x, c.y);                             // dúo Lápida
  }
  S.crystals = S.crystals.filter(c => c.life > 0);

  // Enemigos
  const boil = duoOn('boil'), venStep = (mastery('venom') ? 0.25 : 0.5) * (boil && furyFull() ? 0.5 : 1), embMul = mastery('dragon') ? 1.5 : 1;
  const lunch = duoOn('longlunch') ? 1 - Math.min(0.6, 0.02 * p.reserve) : 1;
  for (const e of S.enemies) {
    if (e.hp <= 0) continue;
    if (e.spawn > 0) { e.spawn -= dt; continue; }
    e.flash = Math.max(0, e.flash - dt);
    { const far = e.wet > 0 && lv('tide_passive') ? 1.5 : 1; e.x += e.kx * dt * far; e.y += e.ky * dt * far; }   // Marea alta: los Empapados salen más lejos
    e.wet = Math.max(0, (e.wet || 0) - dt); e.root = Math.max(0, (e.root || 0) - dt); e.bram = Math.max(0, (e.bram || 0) - dt);
    e.slamCd = Math.max(0, (e.slamCd || 0) - dt);
    let reef = null;
    if (duoOn('reef') && Math.hypot(e.kx, e.ky) > 170) for (const c of S.crystals) if (Math.hypot(e.x - c.x, e.y - c.y) < e.r + 8) reef = c;   // dúo Arrecife
    if (e.slamCd <= 0 && !e.boss && Math.hypot(e.kx, e.ky) > 170 && (reef || touchesWall(e, e.r + 1.5) || e.x < e.r + 3 || e.y < e.r + 3 || e.x > T.room.w - e.r - 3 || e.y > T.room.h - e.r - 3)) {   // empujado contra un muro
      e.slamCd = 0.9; S.stat.slam++; const kx = e.kx, ky = e.ky, kl = Math.hypot(kx, ky); e.kx = e.ky = 0;
      S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 8, t: 0, life: 0.16, col: C.ink }); S.shake = Math.max(S.shake, 3); blip(160, 0.1, 'square', 0.05, -50);
      if (reef) { reef.life = 0; explode(reef.x, reef.y, 40, p.dmg * 1.2, { col: GODS.stone.color, skip: e }); }
      if (duoOn('steam') && e.ember > 0) { const st = e.ember; e.ember = 0; explode(e.x, e.y, 42, p.dmg * 0.35 * st, { col: GODS.dragon.color, skip: e }); }   // dúo Vapor
      if (duoOn('ram')) gainFury(20);                                        // dúo Ariete
      if (has('w_deep')) addGold(1);                                         // Mar de fondo
      if (mastery('tide')) { explode(e.x, e.y, 50, p.dmg * 1.5, { col: GODS.tide.color, skip: e }); for (const o of others(e, 50, 9)) soak(o, 4); }   // maestría Señor del abismo
      note(e.x, e.y - e.r - 6, '¡Contra el muro!', C.ink); hit(e, p.dmg * 0.9 * (1 + 0.5 * lv('tide_basic')), kx / kl, ky / kl, true, C.ink); stun(e, has('w_deep') ? 1.4 : 0.7);
      if (e.hp <= 0) continue;
    }
    const damp = 1 - Math.min(1, dt * 12); e.kx *= damp; e.ky *= damp;
    e.autoCd = Math.max(0, e.autoCd - dt); e.mark = Math.max(0, e.mark - dt);
    if (e.slowT > 0) e.slowT -= dt; else e.slowF = 1;
    if (lunch < 1 && dist(p, e) < 90) slow(e, 0.15, lunch);                // dúo Sobremesa larga
    if (e.needles > 0 && !(duoOn('syringe') && e.venom > 0)) { e.needleT -= dt; if (e.needleT <= 0) e.needles = 0; }
    if (e.fling > 0) {                   // dúo Avalancha: enemigo lanzado
      e.fling -= dt; e.x += e.fvx * dt; e.y += e.fvy * dt;
      let bump = e.x < e.r + 3 || e.y < e.r + 3 || e.x > T.room.w - e.r - 3 || e.y > T.room.h - e.r - 3;
      if (touchesWall(e, e.r + 1)) bump = true;
      for (const c of S.crystals) if (Math.hypot(e.x - c.x, e.y - c.y) < e.r + 7) { bump = true; c.life = 0; }
      for (const o of S.enemies) if (o !== e && active(o) && dist(e, o) < e.r + o.r) bump = true;
      if (bump) { e.fling = 0; explode(e.x, e.y, 50, p.dmg * 3, { stun: 0.6, col: GODS.stone.color }); gainFury(10); }
      continue;
    }
    if (e.ember > 0) {
      if (!duoOn('eternal')) e.emberT -= dt;                                  // dúo Brasa eterna: no se apagan
      e.emberAcc += dt;
      if (e.emberAcc >= 0.5) { e.emberAcc -= 0.5; dot(e, e.ember * p.dmg * 0.12 * embMul, GODS.dragon.color); }
      if (e.emberT <= 0) e.ember = 0;
      if (e.hp <= 0) continue;
    }
    if (e.venom > 0) {
      e.venAcc += dt;
      if (e.venAcc >= venStep) { e.venAcc -= venStep; const d = dot(e, e.venom * p.dmg * 0.035, GODS.venom.color); if (boil) gainFury(1); if (duoOn('indigest') && d) heal(d * 0.1); }
      if (e.hp <= 0) continue;
    }
    if (e.type.post) {                  // estandarte: no se mueve y llama refuerzos
      e.x = e.px; e.y = e.py; e.kx = e.ky = 0; e.stun = 0; e.aiCd -= dt;
      if (e.aiCd <= 0) { e.aiCd = 6; if (S.enemies.length + S.queue.length < 15) { const pool = WORLDS[S.world - 1].pool.filter(k => TYPES[k].cost <= 2.5); for (let i = 0; i < 2; i++) S.queue.push({ type: pool[Math.floor(Math.random() * pool.length)], at: S.waveT + 0.2 * i, near: e }); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 30, t: 0, life: 0.4, col: C.blood }); blip(300, 0.2, 'sawtooth', 0.04, 200); } }
      continue;
    }
    if (e.stun > 0) { e.stun -= dt; continue; }
    const sp = e.speed * (e.slowT > 0 ? e.slowF : 1);
    if (e.raid && S.keep) {             // asaltante: va a por la campana de la aldea y la golpea
      const k = S.keep, kx = k.x - e.x, ky = k.y - e.y, kd = Math.hypot(kx, ky) || 1; e.dir = Math.atan2(ky, kx);
      if (kd > k.r + e.r + 3) { e.x += kx / kd * sp * dt; e.y += ky / kd * sp * dt; }
      else { e.raidCd = (e.raidCd || 0.6) - dt; if (e.raidCd <= 0) { e.raidCd = 1; k.hp -= Math.max(4, e.dmg * 0.6); k.flash = 0.15; S.shake = Math.max(S.shake, 2); blip(240, 0.08, 'square', 0.04, -80); if (k.hp <= 0) { missionFail('La campana ha caído y la aldea con ella.'); return; } } }
      continue;
    }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (e.lungeWind <= 0 && e.lungeT <= 0) e.dir = Math.atan2(dy, dx);
    if (e.boss) { bossAI(e, dt * (e.slowT > 0 ? e.slowF : 1), d, ux, uy); continue; }
    if (e.type.ai) { enemyAI(e, dt * (e.slowT > 0 ? e.slowF : 1), d, ux, uy, e.speed); continue; }
    if (e.type.ranged) {
      if (e.cast > 0) {
        e.cast -= dt;
        if (e.cast <= 0) { S.shots.push({ x: e.x, y: e.y, vx: ux * 125, vy: uy * 125, r: 4, dmg: e.dmg, life: 3.5 }); e.cool = 2.4; blip(700, 0.08, 'triangle', 0.025, -300); }
      } else {
        e.cool -= dt;
        const few = S.enemies.length + S.queue.length <= 2, mv = d > (few ? 140 : 195) || blocked(e, p) ? 1 : d < 120 && !few ? -1 : 0;
        if (mv > 0) { const [gx, gy] = navDir(e, ux, uy); e.x += gx * sp * dt; e.y += gy * sp * dt; } else { e.x += ux * mv * sp * dt; e.y += uy * mv * sp * dt; }
        if (e.cool <= 0 && d < 270) e.cast = 0.55;
      }
    } else if (e.lungeT > 0) {          // embestida del elegido
      e.lungeT -= dt; e.x += e.lvx * dt; e.y += e.lvy * dt;
      if (!e.lungeHit && d < e.r + p.r + 4) { e.lungeHit = true; hurtPlayer(e.dmg); }
      if (e.lungeT <= 0) e.rec = 0.7;
    } else if (e.lungeWind > 0) {
      e.lungeWind -= dt;
      if (e.lungeWind <= 0) { e.lungeT = 0.3; e.lungeHit = false; }
    } else if (e.wind > 0) {
      e.wind -= dt;
      if (e.wind <= 0) { if (d < e.r + p.r + e.type.reach) hurtPlayer(e.dmg); e.rec = 0.55; }
    } else if (e.rec > 0) e.rec -= dt;
    else if (d < e.r + p.r + 3) e.wind = e.type.wind;
    else {
      if (e.champ || e.type.lunge) {
        e.lungeCd -= dt;
        if (e.lungeCd <= 0 && d < 150 && d > 45 && !blocked(e, p)) { e.lungeCd = 3.5; e.lungeWind = 0.5; e.lvx = ux * 300; e.lvy = uy * 300; continue; }
      }
      if (e.type.fly) { const w = Math.sin(S.t * 7 + e.x * 0.05) * 0.7; e.x += (ux - uy * w) * sp * dt; e.y += (uy + ux * w) * sp * dt; }   // vuela en zigzag por encima de los muros
      else { const [gx, gy] = navDir(e, ux, uy); e.x += gx * sp * dt; e.y += gy * sp * dt; }   // recto si te ve; por el camino si hay un muro en medio
    }
  }
  // Zonas en el suelo: fuego o veneno
  for (const z of S.zones) {
    z.life -= dt; z.acc += dt;
    if (z.acc < 0.4) continue;
    z.acc = 0;
    const touch = e => {
      if (z.ember) addEmber(e, z.ember); if (z.venom) addVenom(e, z.venom);
      if (z.slow) slow(e, 0.6, z.slow); if (z.bram) e.bram = 0.6; if (z.dmg) dot(e, z.dmg, z.col);
      if (z.flow && active(e)) { soak(e, 3); push(e, z.flow.ux, z.flow.uy, z.flow.f); }
      if (z.rootOnce && active(e) && !z.rootOnce.has(e)) { z.rootOnce.add(e); if (z.wet) soak(e, 4); if (z.venom1) addVenom(e, z.venom1); root(e, 1); hit(e, z.dmg1, 0, 0, false, z.col); }
    };
    if (z.r) { for (const e of S.enemies) if (active(e) && Math.hypot(e.x - z.x, e.y - z.y) <= z.r + e.r) touch(e); continue; }
    const zx = z.x2 - z.x1, zy = z.y2 - z.y1, L = Math.hypot(zx, zy) || 1, ux = zx / L, uy = zy / L;
    for (const e of S.enemies) {
      if (!active(e)) continue;
      const ex = e.x - z.x1, ey = e.y - z.y1, al = ex * ux + ey * uy;
      if (al >= 0 && al <= L && Math.abs(ex * uy - ey * ux) <= 10 + e.r) touch(e);
    }
  }
  S.zones = S.zones.filter(z => z.life > 0);
  // Separación entre enemigos y columnas
  for (let i = 0; i < S.enemies.length; i++) for (let j = i + 1; j < S.enemies.length; j++) {
    const a = S.enemies[i], b = S.enemies[j];
    if (a.spawn > 0 || b.spawn > 0) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = a.r + b.r + 1;
    if (d < min) { const push = (min - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
  }
  for (const e of S.enemies) {
    e.x = clamp(e.x, e.r + 2, T.room.w - e.r - 2); e.y = clamp(e.y, e.r + 2, T.room.h - e.r - 2);
    if ((e.boss && e.act === 'leap') || e.leapT > 0 || e.type.fly) continue;   // en el aire no chocan
    collide(e, e.r);
  }
  S.enemies = S.enemies.filter(e => e.hp > 0);

  // Proyectiles, avisos en el suelo y líneas de tiro enemigas
  for (const s of S.shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.x < 0 || s.y < 0 || s.x > T.room.w || s.y > T.room.h) s.life = 0;
    if (isWallAt(s.x, s.y)) s.life = 0;
    if (s.life > 0 && Math.hypot(s.x - p.x, s.y - p.y) < s.r + p.r) { if (p.inv <= 0) { hurtPlayer(s.dmg); s.life = 0; } }
  }
  S.shots = S.shots.filter(s => s.life > 0);
  for (const h of S.hazards) {
    if (!h.done) {
      h.t -= dt;
      if (h.t <= 0) { h.done = true; h.life = h.linger || 0; h.acc = 0; S.fx.push({ k: 'ring', x: h.x, y: h.y, r: h.r, t: 0, life: 0.25, col: h.col }); blip(100, 0.15, 'sawtooth', 0.05, -40); if (dist(p, h) < h.r + p.r) hurtPlayer(h.dmg); }
    } else { h.life -= dt; h.acc += dt; if (h.acc >= 0.5) { h.acc = 0; if (dist(p, h) < h.r + p.r) hurtPlayer(h.dmg * 0.35); } }
  }
  S.hazards = S.hazards.filter(h => !h.done || h.life > 0);
  for (const l of S.lasers) {
    l.t -= dt;
    if (l.t > 0) continue;
    const ux = Math.cos(l.a), uy = Math.sin(l.a), len = rayClip(l.x, l.y, ux, uy, 700);
    S.fx.push({ k: 'beam', x1: l.x, y1: l.y, x2: l.x + ux * len, y2: l.y + uy * len, t: 0, life: 0.18, w: l.w, col: C.blood });
    blip(1300, 0.1, 'sawtooth', 0.04, -900);
    const ex = p.x - l.x, ey = p.y - l.y, al = ex * ux + ey * uy;
    if (al > 0 && al < len && Math.abs(ex * uy - ey * ux) < l.w + p.r) hurtPlayer(l.dmg);
  }
  S.lasers = S.lasers.filter(l => l.t > 0 && (!l.src || active(l.src)));

  // Efectos
  // Trampas de pinchos: reposo, aviso y arriba. Pinchan a quien esté encima, enemigos incluidos.
  for (const tr of S.traps) {
    const ph = (S.t + tr.off) % 3.4; tr.state = ph < 2 ? 0 : ph < 2.7 ? 1 : 2;
    if (tr.state !== 2) { tr.hitP = false; tr.acc = 0.5; continue; }
    const on = o => o.x > tr.x - o.r * 0.4 && o.x < tr.x + tr.w + o.r * 0.4 && o.y > tr.y - o.r * 0.4 && o.y < tr.y + tr.h + o.r * 0.4;
    if (!tr.hitP && p.dodgeT <= 0 && on(p)) { tr.hitP = true; hurtPlayer(7 + 2 * S.world); }
    tr.acc += dt;
    if (tr.acc >= 0.5) { tr.acc = 0; for (const e of S.enemies.slice()) if (active(e) && !e.type.fly && e.leapT <= 0 && !(e.boss && e.act === 'leap') && on(e)) { S.stat.spike++; hit(e, Math.max(p.dmg * 1.5, e.boss ? 0 : e.maxHp * 0.2), 0, 0, false, C.ink); } }
  }
  for (const f of S.fx) { f.t += dt; if (f.k === 'spark' || f.k === 'smoke') { f.x += f.vx * dt; f.y += f.vy * dt; } if (f.k === 'num') f.y -= 22 * dt; }
  S.fx = S.fx.filter(f => f.t < f.life);
  if (S.fx.length > 500) S.fx.splice(0, S.fx.length - 500);
}

