// ───────────────────────── Jefes ─────────────────────────
// Cada jefe tiene un kit de ataques con aviso. Si embiste contra una columna se queda aturdido y recibe el doble.
function bossAI(e, dt, d, ux, uy) {
  const p = S.p, B = e.type, frac = e.hp / e.maxHp, ph = B.phases > 2 && frac < 0.33 ? 3 : frac < 0.55 ? 2 : 1;
  if (ph > e.ph) {
    e.ph = ph; S.shake = 9; note(e.x, e.y - e.r - 14, B.name + ' se enfurece', C.blood, true); blip(70, 0.6, 'sawtooth', 0.08, -20);
    for (let i = 0; i < 2 + ph; i++) spawn(B.sum === 'brute' && i > 0 ? 'runner' : B.sum);
  }
  const rest = t => { e.act = 'rest'; e.at = t / (ph > 1 ? 1.3 : 1); };
  const ring = (off, n, sp) => { for (let i = 0; i < n; i++) { const a = off + i * Math.PI * 2 / n; S.shots.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 4, dmg: 12, life: 4.5 }); } blip(600, 0.12, 'triangle', 0.04, -300); };
  e.at -= dt;
  if (e.act === 'slam') {
    if (e.at <= 0) { S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 78, t: 0, life: 0.3, col: C.blood }); S.shake = Math.max(S.shake, 7); blip(80, 0.25, 'sawtooth', 0.07, -30); if (d < 78 + p.r) hurtPlayer(B.dmg); rest(0.7); }
  } else if (e.act === 'chargeWind') {
    if (e.at <= 0) { e.act = 'charge'; e.at = 0.55; e.hitOnce = false; }
  } else if (e.act === 'charge') {
    e.x += e.lvx * dt; e.y += e.lvy * dt;
    if (!e.hitOnce && dist(e, p) < e.r + p.r + 3) { e.hitOnce = true; hurtPlayer(B.dmg + 5); }
    for (const c of S.pillars) if (Math.hypot(e.x - c.x, e.y - c.y) < c.r + e.r) { e.act = 'dazed'; e.at = 1.8; S.shake = 9; note(e.x, e.y - e.r - 14, '¡Aturdido!', C.ink, true); blip(200, 0.3, 'square', 0.06, -150); break; }
    if (e.act === 'charge' && e.at <= 0) rest(0.6);
  } else if (e.act === 'dazed') {
    if (e.at <= 0) rest(0.3);
  } else if (e.act === 'cast') {
    if (e.at <= 0) { if (e.castFn) e.castFn(); e.castFn = null; rest(0.5); }
  } else if (e.act === 'leap') {
    const k = 1 - Math.max(0, e.at) / 0.9; e.x = e.sx + (e.lx - e.sx) * k; e.y = e.sy + (e.ly - e.sy) * k;
    if (e.at <= 0) { S.shake = Math.max(S.shake, 7); rest(0.6); }
  } else if (e.act === 'rest') {
    if (e.at <= 0) e.act = 'idle';
  } else {
    const sp = e.speed * (e.slowT > 0 ? e.slowF : 1);
    e.x += ux * sp * dt; e.y += uy * sp * dt;
    e.think -= dt;
    if (e.think > 0) return;
    e.think = ph > 2 ? 0.6 : ph > 1 ? 0.85 : 1.25;
    const kit = B.kit.filter(a => a !== e.last && (a !== 'slam' || d < 95) && (a !== 'charge' || d > 80) && (a !== 'summon' || S.enemies.length < 8));
    const a = d < 80 && B.kit.includes('slam') && e.last !== 'slam' ? 'slam' : kit[Math.floor(Math.random() * kit.length)] || 'ring';
    e.last = a;
    const aim = Math.atan2(p.y - e.y, p.x - e.x);
    if (a === 'slam') { e.act = 'slam'; e.at = 0.75; }
    else if (a === 'charge') { e.act = 'chargeWind'; e.at = 0.7; e.lvx = ux * 430; e.lvy = uy * 430; }
    else if (a === 'ring') { e.act = 'cast'; e.at = 0.6; e.castFn = () => { const off = Math.random() * 6.28, n = 8 + ph * 3; ring(off, n, 110); if (ph > 1) S.timers.push({ t: 0.4, fn: () => { if (active(e)) ring(off + Math.PI / n, n, 110); } }); }; }
    else if (a === 'fan') { e.act = 'cast'; e.at = 0.5; e.castFn = () => { const vol = () => { const b = Math.atan2(p.y - e.y, p.x - e.x); for (let i = -2; i <= 2; i++) S.shots.push({ x: e.x, y: e.y, vx: Math.cos(b + i * 0.17) * 150, vy: Math.sin(b + i * 0.17) * 150, r: 4, dmg: 12, life: 4 }); blip(700, 0.08, 'triangle', 0.035, -300); }; vol(); for (let i = 1; i < ph + 1; i++) S.timers.push({ t: 0.28 * i, fn: () => { if (active(e)) vol(); } }); }; }
    else if (a === 'leap') { e.act = 'leap'; e.at = 0.9; e.sx = e.x; e.sy = e.y; e.lx = p.x; e.ly = p.y; S.hazards.push({ x: p.x, y: p.y, r: 62, t: 0.9, t0: 0.9, dmg: B.dmg, col: e.color }); }
    else if (a === 'lasers') { const n = ph > 1 ? 5 : 3; for (let i = 0; i < n; i++) S.lasers.push({ x: e.x, y: e.y, a: aim + (i - (n - 1) / 2) * 0.3, t: 0.9, t0: 0.9, dmg: 24, w: 5, src: e }); e.act = 'cast'; e.at = 0.95; }
    else if (a === 'pools') { for (let i = 0; i < 3 + ph; i++) { const ang = Math.random() * 6.28, r = i ? rnd(30, 110) : 0; S.hazards.push({ x: clamp(p.x + Math.cos(ang) * r, 20, T.room.w - 20), y: clamp(p.y + Math.sin(ang) * r, 20, T.room.h - 20), r: 36, t: 0.9 + i * 0.12, t0: 0.9 + i * 0.12, dmg: 18, linger: 4, col: GODS.venom.color }); } e.act = 'cast'; e.at = 0.6; }
    else if (a === 'summon') { for (let i = 0; i < 2 + ph; i++) spawn(B.sum === 'brute' ? 'stalker' : B.sum); rest(0.6); }
  }
}
// Enemigos con comportamiento propio. Los últimos que quedan en la sala no huyen y se acercan.
function enemyAI(e, dt, d, ux, uy, sp) {
  const p = S.p, ai = e.type.ai, few = S.enemies.length + S.queue.length <= 2, keep = (near, far) => { const mv = d > (few ? Math.min(far, 140) : far) ? 1 : d < near && !few ? -0.6 : 0; e.x += ux * mv * sp * dt; e.y += uy * mv * sp * dt; };
  e.aiCd -= dt;
  if (ai === 'bomb') {                   // Bombardero: lanza un proyectil en arco a donde estás
    keep(110, 190);
    if (e.aiCd <= 0 && d < 300) { e.aiCd = 3.2; S.hazards.push({ x: p.x, y: p.y, r: 38, t: 1, t0: 1, dmg: e.dmg, col: e.color }); S.fx.push({ k: 'lob', x1: e.x, y1: e.y, x2: p.x, y2: p.y, t: 0, life: 1, col: e.color }); }
  } else if (ai === 'leap') {            // Saltador: cae sobre ti
    if (e.leapT > 0) { e.leapT -= dt; const k = 1 - Math.max(0, e.leapT) / 0.7; e.x = e.sx + (e.lx - e.sx) * k; e.y = e.sy + (e.ly - e.sy) * k; if (e.leapT <= 0) e.rec = 0.5; return; }
    if (e.rec > 0) { e.rec -= dt; return; }
    if (e.aiCd <= 0 && d > 60 && d < 210) { e.aiCd = 3; e.leapT = 0.7; e.sx = e.x; e.sy = e.y; e.lx = p.x; e.ly = p.y; S.hazards.push({ x: p.x, y: p.y, r: 32, t: 0.7, t0: 0.7, dmg: e.dmg, col: e.color }); return; }
    e.x += ux * sp * dt; e.y += uy * sp * dt;
  } else if (ai === 'snipe') {           // Tirador: apunta con una línea y dispara
    if (e.aimT > 0) { e.aimT -= dt; const L = S.lasers.find(l => l.src === e); if (L && e.aimT > 0.35) { L.a = Math.atan2(p.y - e.y, p.x - e.x); L.x = e.x; L.y = e.y; } return; }
    keep(140, 250);
    if (e.aiCd <= 0 && d < 380 && !blocked(e, p)) { e.aiCd = 3.6; e.aimT = 1.1; S.lasers.push({ x: e.x, y: e.y, a: Math.atan2(p.y - e.y, p.x - e.x), t: 1.1, t0: 1.1, dmg: e.dmg, w: 4, src: e }); }
  } else if (ai === 'heal') {            // Chamán: cura a los suyos
    keep(120, 200);
    if (e.aiCd <= 0) { e.aiCd = 2.6; S.fx.push({ k: 'ring', x: e.x, y: e.y, r: 110, t: 0, life: 0.4, col: e.color }); for (const o of others(e, 110, 20)) if (!o.boss) o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.12); }
  }
}

