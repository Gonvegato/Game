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
  { const wb = lv('tide_basic');
    if (wb && active(e)) { soak(e, 4); push(e, ux, uy, 150 * (duoOn('ram') && furyFull() ? 2 : 1)); }   // Oleaje (y dúo Ariete)
    if (lv('wood_basic') && active(e)) addSeed(e, 1); }                                        // Semilla
  { const fb2 = lv('frost_basic'), bb = lv('blood_basic');
    if (fb2) addFrost(e, fb2);                                                                 // Aliento helado
    if (bb) addBleed(e, bb);                                                                   // Herida abierta
    if (lv('end_basic') && src !== 'turret') addDoom(e);                                       // Sentencia
    if (src === 'echo' && duoOn('deadline') && e.doom) e.doom.acc += dmg; }                    // dúo Plazo vencido
  { const lb2 = lv('light_basic'), db2 = lv('dream_basic'), vb2 = lv('void_basic');
    if (lb2 || (src === 'shade' && duoOn('eclipse'))) light(e);                                // Señalar (y dúo Eclipse)
    if (db2 && src === 'player' && p.shotN % Math.max(2, 5 - db2) === 0 && active(e)) sleep(e, 3);   // Arrullo
    if (vb2 && src === 'player' && active(e)) tug(e, 70, 55 + 25 * vb2); }                     // Gravedad
  if (src === 'player') {   // ofrendas y resonancia Vigilia
    if (res('vigil') && braced()) slow(e, 1, 0.4);
    if (has('d_warm') && p.shotN % 4 === 0) addEmber(e, 1);
    if (has('v_slow') && p.shotN % 3 === 0) addVenom(e, 1);
    if (has('r_spark') && p.shotN % 5 === 0) bolt(e, others(e, 120, 1)[0], dmg * 0.6, null);
    if (has('w_brine') && p.shotN % 4 === 0) push(e, ux, uy, 170);
    if (has('b_thorn') && p.shotN % 5 === 0) root(e, 0.8);
    if (has('i_rime') && p.shotN % 4 === 0) addFrost(e, 1);
    if (has('o_tug') && p.shotN % 4 === 0 && active(e)) tug(e, 80, 110);
    if (has('q_shard') && p.shotN % 5 === 0 && active(e) && !S._shard) { S._shard = true; S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 6, t: 0, life: 0.12, col: GODS.mirror.color }); hit(e, dmg * 0.5, ux, uy, false, GODS.mirror.color); S._shard = false; }
    if (S.pets.length && S.pets.some(pt => pt.prey === e)) hit(e, dmg * 0.15, 0, 0, false, GODS.beast.color);   // Sabueso: +15% a su presa
    if (p.redhot > 0) { const o = others(e, 60, 1)[0]; if (o) { S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.1, col: GODS.forge.color }); hit(o, dmg * 0.5, 0, 0, false, GODS.forge.color); } if (duoOn('quench')) addNeedles(e, 2); }   // Al rojo (y dúo Templar al rayo)
    if (has('g_slag') && p.temper >= temperMax()) explode(e.x, e.y, 30, dmg * 0.3, { col: GODS.forge.color, soft: true, skip: e });
    if (duoOn('forgefire') && temperNow() >= 5) addEmber(e, 1);
    if (has('e_ink') && p.shotN % 4 === 0) addDoom(e);
  }
  if (lv('shade_basic') && active(e)) e.mark = 6;                                              // Marca de tumba
  if (sb && src === 'player') { p.crysN += 1; if (p.crysN % Math.max(1, 4 - sb) === 0) addCrystal(e.x - ux * (e.r + 9), e.y - uy * (e.r + 9)); }   // Esquirla
}
// Una bala tuya: además del impacto, deja eco (Segundero), la repiten los Cristales (Veta) y puede soltar un rayo
function shot(e, dmg, ux, uy, big, col) {
  const p = S.p, ox = p.x, oy = p.y, cc = critChance();
  let crit = false;
  if (cc > 0) { if (Math.random() < cc) { crit = true; dmg *= critMult(); big = true; } else if (lv('luck_basic')) p.pity += 0.05; }
  if (G('s_scope') && !e.scoped) { e.scoped = true; dmg *= ens('marksman') ? 3 : 1.8; big = true; S.stat.first++; }       // Culata de catalejo: primer tiro
  if (G('m_ice') && active(e)) {                                                               // Bala de escarcha
    if (e.slowT > 0 && e.iceT > 0 && (e.frozeCd || 0) <= S.t) { e.frozeCd = S.t + 3; stun(e, 0.8); S.stat.freeze++; note(e.x, e.y - e.r - 10, '¡Congelado!', '#bfe9ff'); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 7, t: 0, life: 0.2, col: '#bfe9ff' }); }
    slow(e, 1.5, 0.7); e.iceT = 1.5; if (res('coldiron')) addFrost(e, 1);                       // resonancia Hierro frío
  }
  onHit(e, dmg, ux, uy, big, col, 'player');
  if (G('m_fire')) S.zones.push({ x: e.x, y: e.y, r: 16, life: ens('trail') ? 6 : 2, acc: 0.4, ember: 1, col: GODS.dragon.color });   // Bala incendiaria
  if (G('m_mark') && active(e)) { e.traceN = (e.traceN || 0) + 1; if (e.traceN >= 3) { e.traceN = 0; e.traced = 5; S.stat.traced++; note(e.x, e.y - e.r - 10, '¡Marcado!', C.energy); } }   // Bala trazadora
  if (G('m_big') && !S._big) { S._big = true; for (const o of others(e, e.r + 22, 4)) { S.stat.splash++; hit(o, dmg * 0.5, ux, uy, false, col); } S._big = false; }   // Bala de calibre
  if (G('m_split') && !S._split) {                                                             // Bala partida
    S._split = true;
    for (const sg of [-1, 1]) { const a = Math.atan2(uy, ux) + sg * 0.75, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(e.x, e.y, rx, ry, 110);
      for (const o of S.enemies) { if (!active(o) || o === e) continue; const ex = o.x - e.x, ey = o.y - e.y, al = ex * rx + ey * ry; if (al >= 0 && al - o.r < ba && Math.abs(ex * ry - ey * rx) <= o.r + 6) { ba = Math.max(0, al - o.r); bestE = o; } }
      S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: e.x + rx * ba, y2: e.y + ry * ba, t: 0, life: 0.1, col });
      if (bestE) { S.stat.split++; onHit(bestE, dmg * 0.35 * (ens('splinter') ? 2 : 1) * (res('mirrorhall') ? 2 : 1), rx, ry, false, col, 'player'); } }
    S._split = false;
  }
  if (G('m_frag') && !active(e) && !S._frag) {                                                 // Bala de metralla: estalla al matar
    S._frag = true; S.stat.frag++;
    for (const o of others(e, ens('cluster') ? 130 : 90, ens('cluster') ? 8 : 5)) { const d = dist(e, o) || 1; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.12, col: C.ink }); onHit(o, dmg * 0.3, (o.x - e.x) / d, (o.y - e.y) / d, false, col, 'frag'); }
    S._frag = false;
  }
  if (crit) onCrit(e);
  const tb = lv('time_basic'), sp = lv('stone_passive');
  if (tb) {
    const m = (mastery('time') ? 1 : 0.5 + 0.15 * (tb - 1)) * (1 + 0.08 * aff('time'));
    const echo = (d, gen, extra) => S.timers.push({ t: echoDelay(1.5) + (extra || 0), fn: () => {
      if (!active(e)) return;
      S.fx.push({ k: 'tracer', x1: ox, y1: oy, x2: e.x, y2: e.y, t: 0, life: 0.14, col: GODS.time.color, w: 1.2 });
      const lucky = duoOn('loaded') && Math.random() < critChance();                             // dúo Dado trucado
      onHit(e, d * (lucky ? critMult() : 1), ux, uy, lucky, GODS.time.color, 'echo'); if (lucky) onCrit(e);
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
  if (g.action === 'a_pend') { if (p.crit) { p.pend = Math.min(6, p.pend + 1); mult *= (1 + 0.15 * p.pend) / 1.5; } else p.pend = 0; }   // Llave de péndulo (sustituye el 1,5 del Compás por la racha)
  if (g.mag === 'm_blood') payLife(1);
  if (g.mag === 'm_gold') { if (p.gold >= 1) { p.gold -= 1; mult *= 1.35; } else mult *= 0.8; }           // Bala de oro
  if (g.action === 'a_spring' && res('deathclock') && (p.idle || 0) >= 4 && target && target.doom) fulfil(target);   // resonancia Hora señalada
  if (g.action === 'a_spring') { const k = 1 + Math.min(2, 0.5 * (p.idle || 0)); if (k > 1.4) { S.stat.spring++; note(p.x, p.y - 14, 'x' + k.toFixed(1), C.ember); } mult *= k; }   // Llave de resorte
  let heavyAlt = false;
  if (g.action === 'a_alt') { heavyAlt = p.alt; mult *= p.alt ? 1.8 : 0.6; p.alt = !p.alt; }               // Llave alterna
  if (g.action === 'a_combo') { if (target && target === p.comboT) p.comboN = Math.min(8, (p.comboN || 0) + 1); else p.comboN = 0; p.comboT = target; }   // Llave de insistencia
  let kick = false;
  if (g.action === 'a_kick' && p.trig % 3 === 0) { kick = true; mult *= 2.2; if (res('anvilsong')) addTemper(2); if (ens('gambler')) addGold(3); S.stat.kick++; note(p.x, p.y - 14, '¡Trueno!', C.ember, true); S.shake = Math.max(S.shake, 6); }   // Llave de trueno
  if (p.venge > 0) { p.venge -= 1; mult *= 2; }                                                             // Culata de rencor
  p.idle = 0;                       // Bala de sangre
  let lastB = false;
  if (g.mag === 'm_last') { p.clip = (p.clip || 0) + 1; if (p.clip >= 6) { lastB = true; mult *= 3; p.clip = 0; note(p.x, p.y - 14, '¡La última!', C.ember, true); S.stat.last++; } }   // Última bala
  if (p.crit) { mult *= S.plans.has('tempo') ? 2 : 1.5; S.stat.tempo++; note(p.x, p.y - 14, '¡Compás!', C.ember, true); blip(1800, 0.09, 'sine', 0.05); }
  if (p.redhot > 0) mult *= 1.5;                                               // Al rojo
  if (p.broke) { p.broke = false; mult *= 3; note(p.x, p.y - 14, '¡Siete años!', GODS.mirror.color, true); }   // Siete años
  let onetwo = false;
  if (g.mag === 'm_drum') { if (p.shells === 1 && p.drumT === target && target) { mult *= 1.6; onetwo = true; S.stat.onetwo++; } p.drumT = target; }   // Doble carga: la segunda al mismo blanco pega más
  const imb = g.mag === 'm_charged' && p.trig % 5 === 0;
  if (imb) { mult *= 2.5; blip(1600, 0.1, 'sine', 0.05); }
  if (draw) mult *= (0.6 + 1.6 * p.drawPow) * (ens('siege') && p.drawPow >= 1 && braced() ? 1.6 : 1);
  if (res('furnace')) mult *= 1 + 0.4 * p.heat;                              // resonancia Fragua viva
  const big = p.crit || imb || p.quickBig || onetwo || lastB || heavyAlt || kick || (draw && p.drawPow >= 1), col = imb ? '#ffffff' : slotColor('basic');
  const reach = rangeOf() * (draw ? 0.6 + 0.4 * p.drawPow : 1);
  p.crit = false; p.quickBig = false;
  if (g.barrel !== 'b_spike' && g.action !== 'a_draw') {   // pólvora negra: fogonazo y humo en la boca del arma
    const mx = p.x + Math.cos(p.face) * 17, my = p.y + 1 + Math.sin(p.face) * 17;
    S.fx.push({ k: 'flash', x: mx, y: my, t: 0, life: 0.06 });
    for (let i = 0; i < (g.action === 'a_rotary' ? 1 : 3); i++) S.fx.push({ k: 'smoke', x: mx, y: my, vx: Math.cos(p.face) * rnd(8, 30) + rnd(-8, 8), vy: Math.sin(p.face) * rnd(8, 30) - rnd(4, 14), t: 0, life: rnd(0.35, 0.7) });
  }
  blip(1250, 0.07, 'square', 0.035, -700);
  if (g.action === 'a_burst') {          // Ráfaga: tres seguidos
    barrelFire(target, mult * 0.45, big, col, reach);
    for (const d of [0.07, 0.14]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { blip(1250, 0.05, 'square', 0.03, -700); barrelFire(t2, mult * 0.45, big, col, reach); if (d > 0.1 && active(t2)) stun(t2, 0.4); } } });
  } else barrelFire(target, mult, big, col, reach);
  if (leg('zhuge') && draw) for (const d of [0.08, 0.16]) S.timers.push({ t: d, fn: () => { const t2 = target && active(target) ? target : nearestInRange(); if (t2) { blip(1400, 0.04, 'square', 0.03, -500); barrelFire(t2, mult * 0.7, false, col, reach); addVenom(t2, 2); } } });
  if (leg('zhuge') && draw && target && active(target)) addVenom(target, 2);
  if (imb && target && active(target)) { S.stat.blessed++; explode(target.x, target.y, 40, p.dmg * 1.2, { col: '#ffffff' }); }   // Bala bendita
  if (res('leadstorm') && p.trig % 10 === 0 && target && active(target)) discharge(target, 1, null);        // resonancia Tormenta de plomo
  if (res('firingline')) for (const sh of S.shades) {                        // resonancia Línea de tiro
    let tg = null, td = 220;
    for (const e of S.enemies) { if (!active(e)) continue; const d = dist(sh, e); if (d < td) { td = d; tg = e; } }
    if (tg) { S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: tg.x, y2: tg.y, t: 0, life: 0.09, col: GODS.shade.color }); onHit(tg, p.dmg * 0.3, (tg.x - sh.x) / (td || 1), (tg.y - sh.y) / (td || 1), false, GODS.shade.color, 'shade'); }
  }
  p.feastShot = false;
  { const mb = lv('mirror_basic'), fb3 = lv('forge_basic');
    if (mb && target && active(target)) for (const m of S.mirrors) {          // Reflejo: dispara contigo desde el otro lado
      const d = Math.hypot(target.x - m.x, target.y - m.y) || 1; S.stat.mirror++;
      S.fx.push({ k: 'tracer', x1: m.x, y1: m.y, x2: target.x, y2: target.y, t: 0, life: 0.09, col: GODS.mirror.color });
      onHit(target, p.dmg * mult * 0.3 * mb * (1 + 0.1 * aff('mirror')) * (duoOn('prismatic') && target.lit > 0 ? 2 : 1), (target.x - m.x) / d, (target.y - m.y) / d, false, GODS.mirror.color, 'mirror');
      if (duoOn('doubles')) for (const sh of S.shades) { let tg = null, td = 220; for (const e of S.enemies) { if (!active(e)) continue; const dd = dist(sh, e); if (dd < td) { td = dd; tg = e; } } if (tg) { S.fx.push({ k: 'tracer', x1: sh.x, y1: sh.y, x2: tg.x, y2: tg.y, t: 0, life: 0.09, col: GODS.shade.color }); onHit(tg, p.dmg * 0.3, (tg.x - sh.x) / (td || 1), (tg.y - sh.y) / (td || 1), false, GODS.shade.color, 'shade'); } }
    }
    if (fb3 && p.shotN % Math.max(3, 9 - fb3 * 2) === 0) addTemper(1);         // Temple
    if (p.redhot > 0) p.redhot -= 1;
    for (const pt of S.pets) if (target && active(target)) pt.prey = target; }  // el sabueso va a por quien disparas
  if (lastB) p.cd = Math.max(p.cd, 1.2);
  if (kick && target && active(target)) push(target, Math.cos(p.face), Math.sin(p.face), 300);
  if (g.stock === 's_spring' && p.dodgeT <= 0 && Math.hypot(I.mx, I.my) > 0.3) {   // Culata de muelle: saltito tras disparar
    const hopL = ens('hare') ? 48 : 24, m = Math.hypot(I.mx, I.my) / (hopL / 24); p.x += I.mx / m * 24; p.y += I.my / m * 24; S.stat.hop++;
    p.x = clamp(p.x, p.r + 4, T.room.w - p.r - 4); p.y = clamp(p.y, p.r + 4, T.room.h - p.r - 4); collide(p, p.r);
    S.fx.push({ k: 'ghost', x: p.x - I.mx / m * 24, y: p.y - I.my / m * 24, t: 0, life: 0.18 });
  }
  // Cargador
  if (g.mag === 'm_drum') {              // dos disparos y a recargar
    p.shells -= 1;
    if (p.shells <= 0) { p.shells = 2; p.cd = periodOf() * 1.25; if (res('leadfeast')) { heal(4); p.feastShot = true; } }   // resonancia Banquete de plomo
    else p.cd = periodOf() * 0.22;
  }
  if (g.mag === 'm_belt') {              // la cinta calienta el arma
    p.heat = Math.min(1, p.heat + (g.action === 'a_rotary' ? 0.045 : 0.13)); p.heatT = 0.7;
    if (p.heat >= 1 && leg('organ')) { p.heat = 0; S.shake = Math.max(S.shake, 5); note(p.x, p.y - 16, '¡Salva!', C.ember, true); const near = S.enemies.filter(e => active(e) && dist(p, e) < rangeOf() + 40 && !blocked(p, e)); for (let i = 0; i < 11 && near.length; i++) { const e = near[i % near.length], d = dist(p, e) || 1; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: e.x, y2: e.y, t: 0, life: 0.12, col: C.ember, w: 1.5 }); if (active(e)) shot(e, p.dmg * 0.6, (e.x - p.x) / d, (e.y - p.y) / d, false, col); } }
    else if (p.heat >= 1) { p.over = 1.6; p.spin = 0; p.drawing = false; note(p.x, p.y - 16, '¡Recalentada!', C.blood, true); blip(120, 0.4, 'sawtooth', 0.06, -60); if (res('furnace')) explode(p.x, p.y, 70, p.dmg * 2.5, { push: 200, col: GODS.orc.color }); }
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
    {                                    // rebotes: uno, o hasta cuatro con La Rompemuros (cada uno pega más)
      let hh = h, ox = p.x, oy = p.y, vx = ux, vy = uy, left2 = total - h.len + 70, mul = 1;
      for (let b = 0; b < (leg('breaker') ? 4 : 1) && hh.side; b++) {
        const bx = ox + vx * (hh.len - 1), by = oy + vy * (hh.len - 1); if (hh.side === 'x') vx = -vx; else vy = -vy;
        if (leg('breaker')) { mul *= 1.25; left2 = Math.max(left2, 150); }
        const nh = rayHit(bx, by, vx, vy, left2);
        S.fx.push({ k: 'ring', x: bx, y: by, r: 6, t: 0, life: 0.12, col }); S.fx.push({ k: 'tracer', x1: bx, y1: by, x2: bx + vx * nh.len, y2: by + vy * nh.len, t: 0, life: big ? 0.2 : 0.13, col, w: big ? 2.4 : 1.4 });
        for (const e of along(bx, by, vx, vy, nh.len)) { S.stat.bounce++; shot(e, p.dmg * m * mul, vx, vy, big, col); if (res('pinball') && active(e)) discharge(e, 1, null); }   // resonancia Carambola
        left2 -= nh.len; ox = bx; oy = by; hh = nh; if (left2 <= 8) break;
      }
    }
    if (big) S.shake = Math.max(S.shake, 3);
  } else if (!target) tracer(p.x + ux * reach, p.y + uy * reach);   // tensado soltado al aire
  else if (B === 'b_twin') {             // dos enemigos distintos a la vez
    const second = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort((a, b) => dist(p, a) - dist(p, b))[0] || target;
    tracer(target.x, target.y); shot(target, p.dmg * m * 0.55, ux, uy, big, col);
    S.timers.push({ t: 0.05, fn: () => { const t2 = active(second) ? second : active(target) ? target : null; if (!t2) return; const d = dist(p, t2) || 1; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: t2.x, y2: t2.y, t: 0, life: 0.09, col }); shot(t2, p.dmg * m * 0.55, (t2.x - p.x) / d, (t2.y - p.y) / d, big, col); } });
  } else if (B === 'b_scatter') {        // seis perdigones en abanico, con empujón
    const burnt = new Set();
    for (const off of [-0.36, -0.22, -0.07, 0.07, 0.22, 0.36]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = null, ba = rayClip(p.x, p.y, rx, ry, reach + 20);
      for (const e of S.enemies) {
        if (!active(e)) continue;
        const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry;
        if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 3) { ba = Math.max(0, al - e.r); bestE = e; }
      }
      S.fx.push({ k: 'tracer', x1: p.x + rx * 12, y1: p.y + ry * 12, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col });
      if (bestE) { shot(bestE, p.dmg * m * 0.36, rx, ry, false, col); if (leg('dragon') && !burnt.has(bestE)) { burnt.add(bestE); addEmber(bestE, 2); } if (active(bestE) && !bestE.boss) { bestE.kx += rx * 110; bestE.ky += ry * 110; } }
    }
    S.shake = Math.max(S.shake, 4);
    if (leg('dragon')) { S.zones.push({ x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * (reach + 10), y2: p.y + uy * (reach + 10), life: 2, acc: 0.4, ember: 1, col: GODS.dragon.color }); S.fx.push({ k: 'cone', x: p.x, y: p.y, a: ang, r: reach + 10, half: 0.4, t: 0, life: 0.2, col: GODS.dragon.color }); }
    if (res('dragonbreath')) S.zones.push({ x1: p.x + ux * 12, y1: p.y + uy * 12, x2: p.x + ux * (reach + 10), y2: p.y + uy * (reach + 10), life: 2.2, acc: 0.4, ember: 1, col: GODS.dragon.color });   // resonancia Aliento de dragón
  } else if (B === 'b_boom') {           // hoz que va y vuelve
    const d0 = dist(p, target), len = Math.min(rayClip(p.x, p.y, ux, uy, reach + 20), d0 + 40), ex = p.x + ux * len, ey = p.y + uy * len;
    const pass = () => { for (const e of S.enemies.slice()) { if (!active(e)) continue; const ax = e.x - p.x, ay = e.y - p.y, al = ax * ux + ay * uy; if (al >= 0 && al <= len + e.r && Math.abs(ax * uy - ay * ux) <= 8 + e.r) { S.stat.boom++; shot(e, p.dmg * m * 0.7, ux, uy, big, col); } } };
    S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: ex, y2: ey, t: 0, life: 0.18, col: PAL.i, w: 2.4 }); pass();
    S.timers.push({ t: 0.28, fn: () => { S.fx.push({ k: 'tracer', x1: ex, y1: ey, x2: S.p.x, y2: S.p.y, t: 0, life: 0.18, col: PAL.i, w: 2.4 }); pass(); } });
  } else if (B === 'b_nail') {           // clavos: al cuarto en el mismo enemigo, revientan
    tracer(target.x, target.y); shot(target, p.dmg * m * 0.75, ux, uy, big, col);
    if (active(target)) { target.nails = (target.nails || 0) + 1; if (target.nails >= 4) { target.nails = 0; S.stat.nail++; if (ens('rivet')) for (const o of others(target, 60, 6)) hit(o, p.dmg * m * 3, ux, uy, true, col); note(target.x, target.y - target.r - 10, '¡Revienta!', C.ember); S.fx.push({ k: 'ring', x: target.x, y: target.y, r: target.r + 10, t: 0, life: 0.18, col: C.ember }); hit(target, p.dmg * m * 3, ux, uy, true, col); } }
  } else if (B === 'b_arc') {            // salta entre cuatro
    let from = p, cur = target, k = 1; const seen = new Set();
    for (let i = 0; i < 4 && cur; i++) { const d = dist(from, cur) || 1; seen.add(cur); if (i) S.stat.arc++;
      S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: cur.x, y2: cur.y, t: 0, life: 0.12, col, w: 1.5 }); shot(cur, p.dmg * m * k, (cur.x - from.x) / d, (cur.y - from.y) / d, big && !i, col);
      from = cur; k *= 0.8; cur = S.enemies.filter(e => active(e) && !seen.has(e) && dist(from, e) < 100).sort((a, b) => dist(from, a) - dist(from, b))[0]; }
  } else if (B === 'b_far') {            // de lejos el doble, de cerca la mitad
    const d = dist(p, target) - target.r, k = d > reach * 0.66 ? 2 : d < reach * 0.3 ? 0.5 : 1; if (k > 1 && res('sunbeam')) for (const o of others(target, 70, 6)) light(o);   // resonancia Rayo de sol
    if (k > 1) { S.stat.far++; S.fx.push({ k: 'ring', x: target.x, y: target.y, r: 10, t: 0, life: 0.15, col: C.ink }); }
    tracer(target.x, target.y, k > 1 ? 2 : 0); shot(target, p.dmg * m * k, ux, uy, big || k > 1, col);
  } else if (B === 'b_swarm') {          // tres dardos a tres enemigos al azar
    const pool = S.enemies.filter(e => active(e) && dist(p, e) - e.r <= reach && !blocked(p, e)).sort(() => Math.random() - 0.5).slice(0, 3); while (pool.length < 3) pool.push(target);
    if (res('packhunt') && S.pets.length && pool[0] && active(pool[0])) { const pt = S.pets[0]; pt.x = pool[0].x + 6; pt.y = pool[0].y + 4; bite(pt, pool[0], 0.6); }   // resonancia Montería
    pool.forEach((e, i) => S.timers.push({ t: 0.06 * i, fn: () => { if (!active(e)) return; const d = dist(S.p, e) || 1; S.stat.swarm++; S.fx.push({ k: 'tracer', x1: S.p.x, y1: S.p.y, x2: e.x, y2: e.y, t: 0, life: 0.1, col }); shot(e, p.dmg * m * 0.45, (e.x - S.p.x) / d, (e.y - S.p.y) / d, false, col); } }));
  } else if (B === 'b_fork') {           // tres bocas: centro al objetivo, dos a los lados a lo primero que pillen
    for (const off of [0, -0.34, 0.34]) {
      const a = ang + off, rx = Math.cos(a), ry = Math.sin(a); let bestE = off === 0 ? target : null, ba = off === 0 ? dist(p, target) : rayClip(p.x, p.y, rx, ry, reach + 20);
      if (off !== 0) for (const e of S.enemies) { if (!active(e) || e === target) continue; const ex = e.x - p.x, ey = e.y - p.y, al = ex * rx + ey * ry; if (al >= 0 && al - e.r < ba && Math.abs(ex * ry - ey * rx) <= e.r + 9) { ba = Math.max(0, al - e.r); bestE = e; } }
      S.fx.push({ k: 'tracer', x1: p.x + rx * 12, y1: p.y + ry * 12, x2: p.x + rx * ba, y2: p.y + ry * ba, t: 0, life: 0.1, col, w: big ? 2 : 1 });
      if (bestE && active(bestE)) { if (off !== 0) S.stat.fork++; shot(bestE, p.dmg * m * 0.6, rx, ry, big, col); }
    }
  } else if (B === 'b_harpoon') {        // arpón: engancha y arrastra hacia ti
    tracer(target.x, target.y, 1.6); shot(target, p.dmg * m, ux, uy, big, col);
    if (res('tidalhook') && active(target)) { soak(target, 5); stun(target, 0.6); }   // resonancia Resaca
    if (active(target) && !target.boss) { const d = dist(p, target); if (d > 46) { target.kx = -ux * Math.min(420, d * 3.2); target.ky = -uy * Math.min(420, d * 3.2); target.slamCd = 0.5; S.stat.hook++; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: target.x, y2: target.y, t: 0, life: 0.3, col: PAL.b, w: 1 }); } }
  } else if (B === 'b_flame') {          // chorro en cono: todos los de delante
    S.fx.push({ k: 'cone', x: p.x, y: p.y, a: ang, r: reach + 8, half: 0.5, t: 0, life: 0.16, col: GODS.dragon.color });
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(p, e); if (d - e.r > reach + 8 || Math.abs(angDiff(Math.atan2(e.y - p.y, e.x - p.x), ang)) > 0.55 || blocked(p, e)) continue; S.stat.flame++; shot(e, p.dmg * m * 0.5, (e.x - p.x) / (d || 1), (e.y - p.y) / (d || 1), big, GODS.dragon.color); addEmber(e, 1); }
  } else if (B === 'b_back') {           // dos bocas: delante y detrás
    tracer(target.x, target.y); shot(target, p.dmg * m, ux, uy, big, col);
    const rear = S.enemies.filter(e => e !== target && active(e) && dist(p, e) - e.r <= reach && !blocked(p, e) && (e.x - p.x) * ux + (e.y - p.y) * uy < 0).sort((a, b) => dist(p, a) - dist(p, b))[0];
    if (rear) { const d = dist(p, rear) || 1; S.stat.rear++; S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: rear.x, y2: rear.y, t: 0, life: 0.1, col }); shot(rear, p.dmg * m, (rear.x - p.x) / d, (rear.y - p.y) / d, big, col); }
  } else if (B === 'b_flail') {          // mangual: lanzas la bola y tarda en volver
    S.fx.push({ k: 'tracer', x1: p.x, y1: p.y, x2: target.x, y2: target.y, t: 0, life: 0.25, col: PAL.I, w: 2 }); p.orbAway = 1; S.stat.flail++;
    shot(target, p.dmg * m * 1.5, ux, uy, true, col);
  } else if (B === 'b_bomb') {           // bomba en arco: pasa por encima de los muros y revienta en área
    const tx = target.x, ty = target.y, fl = 0.2 + dist(p, target) / 520, dm = p.dmg * m * 0.8;
    S.fx.push({ k: 'lob', x1: p.x + ux * 10, y1: p.y + uy * 10, x2: tx, y2: ty, t: 0, life: fl, col: '#3a3440' });
    S.fx.push({ k: 'ring', x: tx, y: ty, r: 16, t: 0, life: fl, col: C.ember });
    S.timers.push({ t: fl, fn: () => {
      S.fx.push({ k: 'ring', x: tx, y: ty, r: leg('monsmeg') ? 68 : 44, t: 0, life: 0.28, col: C.ember }); S.shake = Math.max(S.shake, big ? 5 : 3); blip(140, 0.18, 'sawtooth', 0.05, -80);
      let n = 0;
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = Math.hypot(e.x - tx, e.y - ty); if (d > (leg('monsmeg') ? 64 : 40) + e.r) continue; n++; if (leg('monsmeg')) stun(e, 0.6); shot(e, dm, (e.x - tx) / (d || 1), (e.y - ty) / (d || 1), big, col); }
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
  p.dodgeT = T.dodge.time * (p.fly ? 1.8 : 1) * (G('s_light') ? 1.3 : 1) * (G('s_roll') ? 0.65 : 1); p.inv = Math.max(p.inv, p.dodgeT + 0.06);
  p.lastDodgeT = S.t; p.dodgeFrom = { x: p.x, y: p.y }; p.isLunge = false; p.dodgeHit = new Set(); p.drawing = false; p.lanceDmg = 0;
  if (!free) { p.dodgeN -= 1; if (p.windup > 0) { p.windup = 0; p.cd = 0.1; } p.charging = false; p.charge = 0; }
  blip(420, 0.1, 'triangle', 0.04, 500);
  if (G('a_rider') && !free) { const tg = nearestInRange(); if (tg) { S.stat.rider++; barrelFire(tg, gunDmg() * 1.3, true, slotColor('basic'), rangeOf()); } }   // Llave de jinete
  if (lv('stone_dodge')) addCrystal(p.x, p.y);                              // Geoda
  const td = lv('time_dodge'), sd = lv('shade_dodge');
  if (td) S.fields.push({ x: p.x, y: p.y, r: 80, life: 2 + td, life0: 2 + td });   // Hora muerta
  if (sd) raiseShade(p.x, p.y, 3 + sd, true);                               // Relevo
  { const ed = lv('end_dodge'); if (ed) for (const e of S.enemies) if (active(e) && e.doom && dist(p, e) < 130) { e.doom.t -= 2; heal(ed); } }   // Pasar página
  const ld = lv('luck_dodge');
  if (ld && !free) {                                                        // Cara o cruz
    if (duoOn('toss')) heal(5);                                             // dúo Propina
    if (Math.random() < 0.5) { p.dodgeN = Math.min(dodgeMax(), p.dodgeN + 1); S.stat.heads++; note(p.x, p.y - 18, 'Cara', GODS.luck.color, true); }
    else {
      const x = p.x, y = p.y; S.stat.tails++; note(x, y - 18, 'Cruz', GODS.luck.color);
      S.fx.push({ k: 'ring', x, y, r: 10, t: 0, life: 0.55, col: GODS.luck.color });
      S.timers.push({ t: 0.55, fn: () => explode(x, y, 52, p.dmg * 1.2 * ld, { col: GODS.luck.color, zap: duoOn('fork') }) });   // (dúo Rayo caprichoso)
    }
  }
}
function endDodge() {
  const p = S.p, vd = lv('venom_dodge'), dd = lv('dragon_dodge'), from = p.dodgeFrom;
  if (!from) return;
  if (p.lanceDmg && res('cavalry')) { S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 3, acc: 0.4, ember: 2, col: GODS.dragon.color }); explode(p.x, p.y, 55, p.dmg * 2, { col: GODS.dragon.color }); }   // resonancia Carga de caballería
  if (vd) {                                                                 // Rastro
    S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 5, acc: 0.4, venom: vd, col: GODS.venom.color });
    if (duoOn('stalagm')) for (const k of [0.2, 0.5, 0.8]) addCrystal(from.x + (p.x - from.x) * k, from.y + (p.y - from.y) * k);   // dúo Estela de cristal
  }
  { const wd = lv('tide_dodge'), bd = lv('wood_dodge'), dx = p.x - from.x, dy = p.y - from.y, L = Math.hypot(dx, dy) || 1;
    if (wd && !p.isLunge) S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: (3 + wd) * (duoOn('whirl') ? 2 : 1), acc: 0.4, flow: { ux: dx / L, uy: dy / L, f: 210 }, slow: duoOn('whirl') ? 0.6 : 0, col: GODS.tide.color });   // Corriente (y dúo Remolino)
    if (bd && !p.isLunge) S.zones.push({ x1: from.x, y1: from.y, x2: p.x, y2: p.y, life: 4, acc: 0.4, rootOnce: new Set(), dmg1: p.dmg * 0.6 * bd, wet: duoOn('mangrove'), venom1: duoOn('nettle') ? 4 : 0, frost1: duoOn('frostthorn') ? 3 : 0, col: GODS.wood.color }); }   // Enredadera (y dúos Manglar, Ortiga)
  { const md = lv('mirror_dodge'), bd3 = lv('beast_dodge'), fd3 = lv('forge_dodge');
    if (md && !p.isLunge) { S.fx.push({ k: 'ghost', x: from.x, y: from.y, t: 0, life: 0.6 + 0.3 * md }); S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 70, t: 0, life: 0.25, col: GODS.mirror.color }); for (const e of S.enemies) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 70 + e.r) stun(e, 0.6 + 0.3 * md); }   // Engaño
    if (bd3 && !p.isLunge && S.pets.length) { const pt = S.pets[0]; pt.x = from.x; pt.y = from.y; S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 50, t: 0, life: 0.2, col: GODS.beast.color });
      for (const e of S.enemies.slice()) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 50 + e.r) { const d = Math.hypot(e.x - from.x, e.y - from.y) || 1; bite(pt, e, 0.8 * bd3); if (active(e)) { push(e, (e.x - from.x) / d, (e.y - from.y) / d, 200); if (duoOn('bloodhound')) { addBleed(e, 2); heal(2); } } } }   // Manada (y dúo Rastro de sangre)
    if (fd3 && !p.isLunge) p.redhot = 1 + fd3; }                              // Al rojo
  { const ld2 = lv('light_dodge'), dd2 = lv('dream_dodge'), vd2 = lv('void_dodge');
    if (ld2 && !p.isLunge) { S.fx.push({ k: 'ring', x: from.x, y: from.y, r: 90, t: 0, life: 0.3, col: GODS.light.color }); for (const e of S.enemies.slice()) if (active(e) && Math.hypot(e.x - from.x, e.y - from.y) < 90 + e.r) { light(e); hit(e, p.dmg * 0.5 * ld2, 0, 0, false, GODS.light.color); } }   // Resplandor
    if (dd2 && !p.isLunge) S.zones.push({ x: from.x, y: from.y, r: 44, life: 2 + dd2, acc: 0.4, sleepOnce: new Set(), col: GODS.dream.color });   // Polvo de sueño
    if (vd2 && !p.isLunge) addWell(from.x, from.y, 62, 1 + vd2, 0, 0, { stunC: duoOn('funnel') }); }   // Hueco (y dúo Embudo)
  { const fd = lv('frost_dodge'); if (fd && !p.isLunge) S.zones.push({ x: from.x, y: from.y, r: 40, life: 4, acc: 0.4, frost: fd, col: GODS.frost.color }); }   // Paso de hielo
  if (p.fly && dd) explode(p.x, p.y, 52, p.dmg * 1.5 * dd, { col: GODS.dragon.color, zap: duoOn('comet') });   // Vuelo (y dúo Cometa)
  if (S.plans.has('echo') && !p.isLunge) S.turrets.push({ x: from.x, y: from.y, life: 3, cd: 0.15 });        // Arma gemela
  if (!p.isLunge) { if (G('s_light')) { p.cd = 0; p.windup = 0; } if (G('b_short')) { p.quick = 1.2; p.cd = 0; } }   // Culata de fresno / Pistolete: sales del esquive con el arma lista
  p.dodgeFrom = null; p.fly = false; p.lanceDmg = 0;
}
// Lo que pasa al atravesar a un enemigo con el esquive
function dashThrough(e) {
  const p = S.p, od = lv('orc_dodge'), fd = lv('feast_dodge'), rd = lv('storm_dodge');
  if (G('s_spikes') && active(e)) { S.stat.spk++; hit(e, p.dmg * 1.5, p.dvx, p.dvy, true, C.ink); stun(e, 0.5); }   // Culata de púas
  if (p.lanceDmg) { hit(e, p.lanceDmg, p.dvx, p.dvy, true, C.energy); if (active(e)) chargePayoff(e); }      // carga de la lanza
  if (rd && active(e)) { if (e.needles > 0) { const n = discharge(e, 0.8 + 0.2 * (rd - 1), null); if (duoOn('toast')) heal(2 * n); } else addNeedles(e, 2); }   // Paso relámpago (y dúo Brindis eléctrico)
  if (fd && active(e)) { hit(e, p.dmg * 0.6 * fd, p.dvx, p.dvy, false, GODS.feast.color); heal(3 * fd); }   // Brindis
  { const bd2 = lv('blood_dodge'); if (bd2 && active(e)) { hit(e, p.dmg * 0.6 * bd2, p.dvx, p.dvy, false, GODS.blood.color); heal(4 * bd2); } }   // Transfusión
  if (od && active(e)) {                                                    // Embestida
    const up = duoOn('uproot') && e.root > 0;                               // dúo Descuaje
    hit(e, p.dmg * od * (up ? 3 : 1), p.dvx, p.dvy, true, GODS.orc.color); gainFury(15);
    if (up && active(e)) { e.root = 0; e.slowT = 0; push(e, p.dvx, p.dvy, 320); }
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
  { const lc2 = lv('light_charge'), dc2 = lv('dream_charge');
    if (lc2 && active(e)) { if (e.lit > 0) { stun(e, 1); hit(e, p.dmg * 0.4 * lc2, 0, 0, false, GODS.light.color); } light(e); }   // Destello
    if (dc2 && active(e)) { if (e.sleep > 0) { if (duoOn('digest')) addReserve(4); S._night = true; hit(e, p.dmg * 0.6, 0, 0, true, GODS.dream.color); S._night = false; } else sleep(e, 2); } }   // Pesadilla (y dúo Digestión)
  const fc = lv('frost_charge'), ec = lv('end_charge');
  if (fc && active(e)) {                                                    // Quebrar
    if (e.frozen > 0) { e.frozen = 0; e.stun = Math.min(e.stun, 0.2); S.stat.shatter++; note(e.x, e.y - e.r - 12, '¡Roto!', GODS.frost.color, true); explode(e.x, e.y, 46, p.dmg * 0.8 * fc, { col: GODS.frost.color, skip: e }); hit(e, p.dmg * 1.5 * fc, 0, 0, true, GODS.frost.color); }
    else addFrost(e, 3);
  }
  if (ec && active(e) && e.doom) { if (duoOn('autodafe')) addEmber(e, 3); fulfil(e, 1 + 0.3 * ec); }   // Punto final (y dúo Auto de fe)
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
  } else if (CH === 'c_meteor') {        // meteoro: cae un segundo después
    const tx = snap.tx, ty = snap.ty; S.fx.push({ k: 'ring', x: tx, y: ty, r: 70, t: 0, life: 1, col });
    if (res('eventide')) addWell(tx, ty, 100, 1, 0, 0);                    // resonancia Horizonte de sucesos S.fx.push({ k: 'lob', x1: tx + 60, y1: ty - 160, x2: tx, y2: ty, t: 0, life: 1, col: '#3a3440' });
    S.timers.push({ t: 1, fn: () => { S.shake = Math.max(S.shake, 10); S.stat.meteor++; explode(tx, ty, 70, dmg * 1.6, { col, payoff: true, stun: 0.5 }); } });
  } else if (CH === 'c_chain') {         // rayo que salta entre seis
    let from = o, cur = S.enemies.filter(e => active(e) && !blocked(o, e) && dist(o, e) < 260).sort((a, b) => Math.abs(angDiff(Math.atan2(a.y - o.y, a.x - o.x), snap.dir)) - Math.abs(angDiff(Math.atan2(b.y - o.y, b.x - o.x), snap.dir)))[0]; const seen = new Set();
    for (let i = 0; i < 6 && cur; i++) { const d = dist(from, cur) || 1; seen.add(cur); S.stat.cchain++;
      S.fx.push({ k: 'beam', x1: from.x, y1: from.y, x2: cur.x, y2: cur.y, t: 0, life: 0.2, w: 3, col }); strike(cur, dmg * 0.8, (cur.x - from.x) / d, (cur.y - from.y) / d);
      from = cur; cur = S.enemies.filter(e => active(e) && !seen.has(e) && dist(from, e) < 130).sort((a, b) => dist(from, a) - dist(from, b))[0]; }
  } else if (CH === 'c_balm') {          // bálsamo: cura y aparta
    if (!echo) { heal(p.maxHp * 0.1); S.stat.balm++; if (ens('bastion')) p.wardCd = 0; note(o.x, o.y - 18, '+' + Math.round(p.maxHp * 0.1), '#8fe08a', true); }
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 60, t: 0, life: 0.3, col: '#8fe08a' });
    for (const e of S.enemies) if (active(e) && dist(o, e) < 60 + e.r) { const d = dist(o, e) || 1; push(e, (e.x - o.x) / d, (e.y - o.y) / d, 240); chargePayoff(e); }
  } else if (CH === 'c_bounce') {        // carambola: cinco rebotes
    let ox = o.x, oy = o.y, vx = ux, vy = uy, left = 700;
    for (let b = 0; b < 6 && left > 10; b++) {
      const h = rayHit(ox, oy, vx, vy, Math.min(left, 320));
      S.fx.push({ k: 'beam', x1: ox, y1: oy, x2: ox + vx * h.len, y2: oy + vy * h.len, t: 0, life: 0.22, w: 3, col });
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const ex = e.x - ox, ey = e.y - oy, al = ex * vx + ey * vy; if (al >= 0 && al <= h.len + e.r && Math.abs(ex * vy - ey * vx) <= 6 + e.r) { S.stat.cbounce++; strike(e, dmg * 0.6, vx, vy); } }
      if (!h.side) break; ox += vx * (h.len - 1); oy += vy * (h.len - 1); if (h.side === 'x') vx = -vx; else vy = -vy; left -= h.len;
    }
  } else if (CH === 'c_volley') {        // salva de ocho disparos
    for (let i = 0; i < 8; i++) S.timers.push({ t: 0.07 * i, fn: () => { const near = S.enemies.filter(e => active(e) && !blocked(o, e) && dist(o, e) < rangeOf() + 60).sort((a, b) => dist({ x: snap.tx, y: snap.ty }, a) - dist({ x: snap.tx, y: snap.ty }, b))[0]; if (!near) return; const d = dist(o, near) || 1; S.stat.volley++;
      S.fx.push({ k: 'tracer', x1: o.x, y1: o.y, x2: near.x, y2: near.y, t: 0, life: 0.08, col }); if (i % 2 === 0) blip(1200, 0.04, 'square', 0.03, -500);
      if (echo) hit(near, dmg * 0.2, (near.x - o.x) / d, (near.y - o.y) / d, false, col); else shot(near, dmg * 0.2, (near.x - o.x) / d, (near.y - o.y) / d, false, col); if (i === 0) chargePayoff(near); } });
  } else if (CH === 'c_mine') {          // tres minas a tu alrededor
    for (let i = 0; i < 3; i++) { const a = snap.dir + Math.PI + (i - 1) * 1.1, at = unstick(clamp(o.x + Math.cos(a) * 34, 10, T.room.w - 10), clamp(o.y + Math.sin(a) * 34, 10, T.room.h - 10)); S.mines.push({ x: at.x, y: at.y, life: 12, dmg: dmg * 0.9, col }); }
  } else if (CH === 'c_nova') {          // onda que aparta
    S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 120, t: 0, life: 0.35, col }); S.shake = Math.max(S.shake, 7);
    for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(o, e) || 1; if (d > 120 + e.r) continue; strike(e, dmg * 0.7, (e.x - o.x) / d, (e.y - o.y) / d); if (active(e)) push(e, (e.x - o.x) / d, (e.y - o.y) / d, 380); }
  } else if (CH === 'c_turret') {        // centinela: una copia del arma clavada en el suelo
    S.turrets.push({ x: o.x, y: o.y, life: ens('watch') ? 12 : 6, cd: 0.2, k: 0.8, sentry: true });
  } else if (CH === 'c_snipe') {         // verdugo: un tiro al más fuerte a la vista
    const tg = S.enemies.filter(e => active(e) && !blocked(o, e) && dist(o, e) < 420).sort((a, b) => b.hp - a.hp)[0];
    if (tg) { const d = dist(o, tg) || 1; S.fx.push({ k: 'beam', x1: o.x, y1: o.y, x2: tg.x, y2: tg.y, t: 0, life: 0.25, w: 4, col }); S.shake = Math.max(S.shake, 8); strike(tg, dmg * 2, (tg.x - o.x) / d, (tg.y - o.y) / d); if (!active(tg) && !echo) { p.snipeRefund = true; note(o.x, o.y - 18, '¡Otra vez!', C.ember, true); } }
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
  { const fc3 = lv('forge_charge'), bc3 = lv('beast_charge');
    if (fc3) { const big2 = duoOn('warhammer') ? 1 + snap.fury / 100 : 1, R = 70 * big2; S.fx.push({ k: 'ring', x: o.x, y: o.y, r: R, t: 0, life: 0.3, col: GODS.forge.color }); S.shake = Math.max(S.shake, 7);
      for (const e of S.enemies.slice()) { if (!active(e)) continue; const d = dist(o, e) || 1; if (d > R + e.r) continue; hit(e, p.dmg * 1.2 * fc3 * mult, (e.x - o.x) / d, (e.y - o.y) / d, true, GODS.forge.color); if (active(e)) stun(e, 0.6); if (!echo) addTemper(duoOn('warhammer') ? 2 : 1); } }   // Martillazo (y dúo Martillo de guerra)
    if (bc3 && S.pets.length) { const pt = S.pets[0], tx = snap.tx, ty = snap.ty; S.fx.push({ k: 'tracer', x1: pt.x, y1: pt.y, x2: tx, y2: ty, t: 0, life: 0.2, col: GODS.beast.color, w: 2 }); pt.x = tx; pt.y = ty; S.stat.pounce++;
      explode(tx, ty, 52, p.dmg * 2.5 * bc3 * mult, { col: GODS.beast.color, stun: 1 }); if (duoOn('wolfthorn')) for (const e of S.enemies) if (active(e) && Math.hypot(e.x - tx, e.y - ty) < 52 + e.r) root(e, 1.5); } }   // ¡A por él! (y dúo Lobo entre zarzas)
  { const vc2 = lv('void_charge'); if (vc2) addWell(snap.tx, snap.ty, 90, 2.5, p.dmg * 0.25 * vc2 * mult, p.dmg * vc2 * mult, { embers: duoOn('collapse') }); }   // Singularidad (y dúo Colapso)
  { const wc = lv('tide_charge'), bc = lv('wood_charge');
    if (wc) {                                                               // Maremoto
      const strong = duoOn('wager') && snap.die >= 5;                       // dúo Mar gruesa
      S.fx.push({ k: 'ring', x: o.x, y: o.y, r: 150, t: 0, life: 0.4, col: GODS.tide.color });
      for (const e of S.enemies.slice()) {
        if (!active(e)) continue; const d = dist(o, e) || 1; if (d > 150 + e.r) continue;
        if (duoOn('iceberg') && e.wet > 0) freeze(e);                         // dúo Témpano
        soak(e, 5); hit(e, p.dmg * 0.5 * wc * mult, (e.x - o.x) / d, (e.y - o.y) / d, false, GODS.tide.color);
        if (!active(e)) continue;
        if (duoOn('maelstrom') && S.wells.length) { const w = S.wells[S.wells.length - 1], wd = Math.hypot(w.x - e.x, w.y - e.y) || 1; push(e, (w.x - e.x) / wd, (w.y - e.y) / wd, Math.min(520, wd * 4)); e.slamCd = 0.6; }   // dúo Vorágine
        else push(e, (e.x - o.x) / d, (e.y - o.y) / d, strong ? 640 : 320);
        if (strong) stun(e, 1);
        if (duoOn('winetide')) addReserve(3);                                // dúo Marea de vino
        if (duoOn('tsunami') && e.needles > 0) discharge(e, 0.8, null);      // dúo Agua y rayo
      }
    }
    if (bc) S.zones.push({ x: snap.tx, y: snap.ty, r: 46, life: 5 * (duoOn('perennial') ? 2 : 1), acc: 0.4, slow: duoOn('perennial') ? 0.2 : 0.5, dmg: p.dmg * 0.2 * bc, ember: duoOn('wildfire') ? 1 : 0, bram: true, col: GODS.wood.color }); }   // Zarzal (y dúos Perenne, Incendio)
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
  { const bc2 = lv('blood_charge'); if (bc2) { if (!res('bloodprice')) payLife(Math.floor(p.hp * 0.1)); snap.bonus *= 1 + 0.6 * bc2; S.bloodT = S.t + 0.7; } }   // Sangría
  const lc = lv('luck_charge');
  if (lc) {                                                                 // Todo al rojo: el mejor de lc dados
    let die = 1; for (let i = 0; i < lc; i++) die = Math.max(die, 1 + Math.floor(Math.random() * 6));
    if (duoOn('allin')) die = Math.min(6, die + Math.floor(p.fury / 34));     // dúo Órdago
    snap.die = die; snap.bonus *= [0, 0.6, 0.8, 1, 1.3, 1.7, 3][die]; S.stat.dice++;
    note(p.x, p.y - 20, 'Dado: ' + die, die >= 5 ? RAR[3].color : GODS.luck.color, true); blip(600 + die * 200, 0.12, 'square', 0.05);
  }
  castCharged(snap, 1, false);
  if (tc) {                              // Rebobinar: se repite desde el mismo sitio
    const m = mastery('time') ? 1 : 0.6 + 0.15 * (tc - 1), d = echoDelay(2);
    S.fx.push({ k: 'clock', x: snap.x, y: snap.y, t: 0, life: d });
    S.timers.push({ t: d, fn: () => { castCharged(Object.assign({}, snap, { bonus: 1 }), m, true); if (duoOn('afterimage')) for (const mr of S.mirrors) castCharged(Object.assign({}, snap, { x: mr.x, y: mr.y, dir: Math.atan2(snap.ty - mr.y, snap.tx - mr.x), bonus: 1 }), m * 0.5, true); } });   // (dúo Imagen tardía)
  }
  { const mc = lv('mirror_charge'); if (mc) for (const mr of S.mirrors) { S.stat.mcharge++; castCharged(Object.assign({}, snap, { x: mr.x, y: mr.y, dir: Math.atan2(snap.ty - mr.y, snap.tx - mr.x), bonus: 1 }), 0.4 + 0.15 * mc, true); } }   // Doble: el Reflejo repite el cargado
  let cd = ch.cd;
  p.cd = Math.max(p.cd, 0.25);
  if (S.plans.has('recoil') && !moves) { cd *= 0.65; startDodge(Math.atan2(-uy, -ux), true); }
  else if (!moves) { p.x -= ux * 6; p.y -= uy * 6; }
  p.chargeCdMax = p.chargeCd = cd;
  if (p.snipeRefund) { p.snipeRefund = false; p.chargeCd = 0.15; }   // Recámara de verdugo
  S.shake = Math.max(S.shake, 4 + 4 * ratio);
  blip(300, 0.3, 'sawtooth', 0.06, -220);
}

function hurtPlayer(dmg) {
  if (S.p.inv <= 0) S.p.streak = 0;   // Racha: se pierde al recibir un golpe
  const p = S.p;
  if (p.inv > 0 || S.mode !== 'play') return;
  if (G('s_shield') && (p.wardCd || 0) <= 0) { p.wardCd = 6; p.inv = 0.4; S.stat.block++; note(p.x, p.y - 18, '¡Parado!', C.energy, true); blip(900, 0.12, 'square', 0.06, -300); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 18, t: 0, life: 0.2, col: C.energy }); return; }   // Culata con rodela
  if (duoOn('luckglass') && Math.random() < 1 / 3) { p.inv = 0.4; note(p.x, p.y - 18, 'Lo paga el Reflejo', GODS.mirror.color, true); return; }   // dúo Espejo de la suerte
  { const mp = lv('mirror_passive'); if (mp) explode(p.x, p.y, 64, p.dmg * mp, { col: GODS.mirror.color }); }   // Azogue
  if (G('s_anchor') && p.charging) dmg *= 0.5;                                // Culata de ancla
  if (G('s_venge')) p.venge = 3;                                              // Culata de rencor
  if (has('q_break')) p.broke = true;
  if (!mastery('forge')) p.temper = Math.floor(p.temper / 2);
  dmg *= (1 - 0.05 * tk('skin')) * (has('m_skin') ? 0.9 : 1) * (1.2 + 0.3 * (S.world - 1));
  if (p.reserve > 0) { const a = Math.min(p.reserve, dmg); p.reserve -= a; dmg -= a; }   // la Reserva hace de escudo
  p.hp -= dmg; p.inv = 0.5; S.hurtFx = 0.35;
  if (p.hp <= 0 && lv('blood_passive') && !S.debtUsed) { S.debtUsed = true; p.hp = 1; p.inv = 1; note(p.x, p.y - 20, '¡Deuda!', GODS.blood.color, true); }   // Deuda: el primer golpe mortal de la sala no te mata S.shake = Math.max(S.shake, 6);
  gainFury(15);
  blip(110, 0.18, 'sawtooth', 0.07, -50);
  if (p.hp <= 0 && p.revive > 0) {   // Segundo aliento
    p.revive -= 1; p.hp = Math.round(p.maxHp * (0.1 + 0.2 * tk('revive'))); p.inv = 1.5;
    note(p.x, p.y - 18, 'Segundo aliento', C.ember, true); blip(440, 0.5, 'triangle', 0.07, 600);
  } else if (p.hp <= 0) { p.hp = 0; endRun(false); setMode('dead'); }
}

