// ───────────────────────── Combate: consultas ─────────────────────────
const active = e => e.spawn <= 0 && e.hp > 0;
const PIECE = Object.fromEntries(PIECES.map(p => [p.id, p]));
const DUO = Object.fromEntries(DUOS.map(d => [d.id, d]));
const duoFor = (a, b) => DUOS.find(d => (d.a === a && d.b === b) || (d.a === b && d.b === a));
// Nivel de una técnica (0 si no la llevas). Si llevas un dúo que la contiene, cuenta con el nivel del dúo.
const lv = id => { const cur = S.build[PIECE[id].slot]; if (!cur) return 0; if (cur.id === id) return cur.lvl; const D = DUO[cur.id]; return D && (D.a === id || D.b === id) ? cur.lvl : 0; };
const duoOn = id => { const cur = S.build[DUO[id].slot]; return !!cur && cur.id === id; };
const has = id => S.techs.has(id);
const godsIn = slot => { const cur = S.build[slot]; if (!cur) return []; const D = DUO[cur.id]; return D ? [PIECE[D.a].god, PIECE[D.b].god] : [PIECE[cur.id].god]; };
const godCount = g => SLOT_KEYS.filter(k => godsIn(k).includes(g)).length;
const mastery = g => godCount(g) >= 3;
const slotColor = slot => { const cur = S.build[slot]; return !cur ? C.energy : DUO[cur.id] ? RAR[3].color : GODS[PIECE[cur.id].god].color; };
const curName = cur => (DUO[cur.id] || PIECE[cur.id]).name;
// ¿Lleva el arma montada esa pieza? ¿Está activa esa resonancia?
const G = id => S.gun[PART[id].slot] === id;
const res = id => RES[id].parts.every(G) && RES[id].techs.every(t => lv(t) > 0);
const braced = () => G('s_brace') && S.p.still >= 0.5;
const gunRange = () => (1 + 0.05 * lv('forge_passive')) * ({ b_short: 0.7, b_twin: 0.75, b_scatter: 0.5, b_pierce: 1.3, b_spike: 0.5, b_bomb: 1.1, b_flame: 0.42, b_fork: 0.9 }[S.gun.barrel] || 1) * (braced() ? 1.2 : 1) * (G('s_scope') ? 1.15 : 1);
const gunRate = () => (1 + 0.05 * lv('forge_passive')) * ({ b_short: 1.25, b_bomb: 0.65, b_flame: 1.4, b_flail: 0.8 }[S.gun.barrel] || 1) * (G('s_bone') ? 1 + 0.5 * clamp((1 - S.p.hp / S.p.maxHp - 0.25) / 0.5, 0, 1) : 1) * ({ a_semi: 1.2 * (1 + 0.4 * (S.p.runUp || 0)), a_burst: 0.85, a_draw: 0.65 }[S.gun.action] || 1) * ({ m_belt: 1.3, m_heavy: 0.8 }[S.gun.mag] || 1);
const gunDmg = () => (1 + 0.05 * lv('forge_passive')) * ({ a_semi: 0.75, a_rotary: 0.3, a_fuse: 1.45, a_auto: 0.8 }[S.gun.action] || 1) * ({ m_drum: 1.35, m_heavy: 1.3, m_blood: 1.4 }[S.gun.mag] || 1) * (G('b_harpoon') ? 1.15 : 1) * ({ s_light: 0.9, s_heavy: 1.25 }[S.gun.stock] || 1) * (G('b_pierce') ? 0.9 : 1) * (braced() ? 1.4 : 1);
// Avisar cuando despierta una resonancia nueva en esta partida
const leg = id => { const L = legOf(S.gun); return !!L && L.id === id; };
function checkRes() {
  { const L = legOf(S.gun); if (L && !S.resSeen.has('leg_' + L.id)) { S.resSeen.add('leg_' + L.id); M.legends = M.legends || {}; M.legends[L.id] = 1; save(); sayRaw('[Arma legendaria: ' + L.name + '. ' + L.desc + ']', RAR[3].color); blip(660, 0.6, 'triangle', 0.07, 900); } }
 for (const R of RESO) if (!S.resSeen.has(R.id) && res(R.id)) { S.resSeen.add(R.id); sayRaw('[Resonancia: ' + R.name + '. ' + R.desc + ']', RAR[3].color); blip(880, 0.4, 'triangle', 0.06, 700); } }
const dodgeMax = () => 1 + (S.plans.has('double') ? 1 : 0) + (tk('reflex') ? 1 : 0);
const dodgeCdOf = () => T.dodge.cd * (G('s_light') ? 0.65 : 1) * (tk('reflex') >= 2 ? 0.8 : 1) * (has('t_second') ? 0.8 : 1);
const furyFull = () => S.p.fury >= 100;
const resMax = () => 30 * (has('f_cellar') ? 2 : 1);
const shadeCap = () => 2 + lv('shade_basic') + (has('s_legion') ? 3 : 0);
const echoDelay = t => t * (has('t_overtime') ? 0.5 : 1);
const isSlow = e => e.slowT > 0 || e.stun > 0;
const rangeOf = () => S.p.range * gunRange() * (1 + 0.05 * tk('eye'));
const periodOf = () => {
  const p = S.p, bl = lv('orc_passive');
  return 1 / (p.as * (has('h_frenzy') && p.hp < p.maxHp * 0.3 ? 1.4 : 1) * gunRate() * (1 + 0.03 * tk('rate')) * (bl && furyFull() ? 1 + 0.3 * bl : 1));
};

function nearestInRange() {
  const p = S.p, rng = rangeOf(); let bestE = null, bd = 1e9;
  for (const e of S.enemies) {
    if (!active(e)) continue;
    const d = dist(p, e) - e.r;
    if (d <= rng && d < bd && !blocked(p, e)) { bd = d; bestE = e; }
  }
  return bestE;
}
// Otros enemigos vivos cerca de un punto o enemigo, del más cercano al más lejano
function others(e, r, max) {
  const out = [];
  for (const o of S.enemies) { if (o === e || !active(o)) continue; const d = dist(e, o); if (d <= r) out.push([d, o]); }
  return out.sort((a, b) => a[0] - b[0]).slice(0, max).map(x => x[1]);
}
const note = (x, y, txt, col, big) => S.fx.push({ k: 'num', x, y, t: 0, life: big ? 1.2 : 0.7, txt, col, big });

// ───────────────────────── Recursos del jugador ─────────────────────────
function gainFury(n) { const p = S.p; if (!godCount('orc')) return; p.fury = Math.min(100, p.fury + n); p.furyT = 2; }
function addReserve(n) { const p = S.p; p.reserve = Math.min(resMax(), p.reserve + n); p.resT = 3; }
function heal(n) {
  const p = S.p;
  if (n <= 0) return;
  n *= mastery('feast') ? 1.5 : 1;
  p.hp += n;
  if (p.hp > p.maxHp) { const over = p.hp - p.maxHp; p.hp = p.maxHp; if (godCount('feast')) addReserve(over); }
  if (duoOn('warhunger')) gainFury(n * 2);                                    // dúo Hambre de guerra
}
function addGold(n) { const p = S.p; p.gold += n; if (duoOn('hoardfeast')) heal(n); }   // dúo Banquete del dragón

// ───────────────────────── Golpes, bajas y explosiones ─────────────────────────
function kill(e) {
  const p = S.p;
  S.kills += 1;
  for (let i = 0; i < 10; i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: rnd(-110, 110), vy: rnd(-110, 110), t: 0, life: rnd(0.25, 0.5), col: e.color });
  if (S.lock === e) S.lock = null;
  if (e.type.post) { S.postsDown = (S.postsDown || 0) + 1; addGold(20); sayRaw('[Estandarte derribado: ' + S.postsDown + ' de ' + (S.postsAll || 3) + ']', C.ink); if (S.postsDown < (S.postsAll || 3)) S.pendingLoot = true; }
  if (lv('frost_passive') && e.frozen > 0) for (const o of others(e, 90, 4)) addFrost(o, 2);    // Cero absoluto
  if (has('i_shatter') && e.frozen > 0) for (const o of others(e, 100, 4)) { S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.12, col: GODS.frost.color }); hit(o, p.dmg * 0.4, 0, 0, false, GODS.frost.color); }   // Astillas
  if (mastery('blood') && e.bleed > 0) heal(2);                                                // maestría Cobro final
  if (has('h_warm') && p.hp < p.maxHp / 2) heal(2);                                            // Sangre caliente
  if (S.t < (S.bloodT || 0)) { heal(5); if (duoOn('bloodrite') && !e.boss) raiseShade(e.x, e.y); }   // Sangría (y dúo Rito rojo)
  { const ep = lv('end_passive'); if (ep && e.doom && e.doom.acc > 0) { const o = others(e, 140, 1)[0]; if (o) { o.doom = { t: Math.max(2, e.doom.t), acc: e.doom.acc * (1 + 0.15 * (ep - 1)) + (o.doom ? o.doom.acc : 0) }; S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.2, col: GODS.end.color }); } } }   // Epitafio
  if (has('u_halo') && e.lit > 0) explode(e.x, e.y, 46, p.dmg, { col: GODS.light.color });         // Halo
  if (G('m_blood')) heal(3);                                                                  // Bala de sangre
  if (e.elite && G('m_silver')) addGold(3);
  if (e.elite) { addGold(3); note(e.x, e.y - e.r - 10, '+3 oro', RAR[3].color); }
  if (e.elite === 'volatile') S.hazards.push({ x: e.x, y: e.y, r: 40, t: 0.9, t0: 0.9, dmg: e.dmg, col: '#ff8a3c' });   // élite volátil: revienta al morir
  stain(e); for (let i = 0; i < (e.boss ? 14 : 4); i++) S.fx.push({ k: 'smoke', x: e.x + rnd(-e.r, e.r), y: e.y + rnd(-e.r, e.r * 0.5), vx: rnd(-10, 10), vy: -rnd(8, 26), t: 0, life: rnd(0.4, 0.8) });
  blip(160, 0.12, 'sawtooth', 0.04, -90);
  if (e.boss) { S.ironRun += 2; for (const g of GOD_KEYS) if (Math.random() < 0.5) S.matsRun[g] += 1; }
  if (e.champ) { S.matsRun[e.god] += S.world; S.drop = { god: e.god, x: e.x, y: e.y }; say(e.god, 'champ'); blip(880, 0.25, 'triangle', 0.05, 400); }
  if (S.t < S.banquet) heal(4);
  { const bp = lv('wood_passive'), held = e.root > 0 || e.bram > 0;
    if (bp && held) heal(bp);                                                                  // Savia
    if (duoOn('amber') && held) addCrystal(e.x, e.y);                                          // dúo Ámbar
    if (has('b_bloom') && e.root > 0) S.zones.push({ x: e.x, y: e.y, r: 34, life: 3, acc: 0.4, slow: 0.5, dmg: p.dmg * 0.2, bram: true, col: GODS.wood.color });   // Floración
    if (duoOn('drowned') && e.wet > 0 && !e.boss) raiseShade(e.x, e.y); }                      // dúo Ahogados
  if (has('f_appet')) heal(1);                                                                 // Buen apetito
  if (has('s_last') && !S.firstKill && !e.boss) { S.firstKill = true; raiseShade(e.x, e.y); }  // Último servicio                                                                 // Banquete
  const tl = lv('dragon_passive');
  if (tl && e.ember > 0) { addGold(tl); note(e.x, e.y - e.r - 10, '+' + tl + ' oro', RAR[3].color); }   // Tesoro
  if (has('o_drums')) gainFury(10);
  if (lv('orc_passive') && furyFull()) p.dodgeN = dodgeMax();                                  // Sed de sangre
  if (has('m_quartz')) addCrystal(e.x, e.y);                                                   // Cuarzo vivo
  const vp = lv('venom_passive');
  if (vp && e.venom > 0) for (const o of others(e, 130, 1 + vp)) {                             // Plaga
    S.fx.push({ k: 'tracer', x1: e.x, y1: e.y, x2: o.x, y2: o.y, t: 0, life: 0.2, col: GODS.venom.color });
    addVenom(o, e.venom);
  }
  if (lv('shade_basic') && e.mark > 0 && !e.boss) {                                            // Marca de tumba
    const x = e.x, y = e.y; raiseShade(x, y);
    if (duoOn('clockmark')) S.timers.push({ t: echoDelay(1.5), fn: () => raiseShade(x, y) });      // dúo Marca del reloj
  }
  const st = e.ember;
  if (has('d_pyre') && st > 0) explode(e.x, e.y, 46, p.dmg * 0.3 * st, { ember: Math.ceil(st / 2), col: GODS.dragon.color });   // Pira
}

function hit(e, dmg, ux, uy, big, col) {
  if (!active(e)) return;
  const p = S.p, ob = lv('orc_basic'), tl = lv('dragon_passive'), gl = lv('feast_passive'), sl = lv('shade_passive'), ti = lv('time_passive');
  if (ob) dmg *= 1 + 0.4 * ob * p.fury / 100;                                                  // Tambor de guerra
  if (tl) dmg *= 1 + Math.min((30 + 10 * tl) / 100, 0.01 * tl * Math.floor(p.gold / 10));     // Tesoro
  if (gl) dmg *= 1 + 0.01 * gl * (p.reserve + (duoOn('hoardfeast') ? p.gold / 10 : 0));          // Glotón
  if (sl) dmg *= 1 + 0.08 * sl * S.shades.length;                                              // Séquito
  if (ti && isSlow(e)) dmg *= 1 + 0.3 * ti;                                                    // Reloj de arena
  { const wp = lv('tide_passive'), bp = lv('wood_passive'), lp = lv('luck_passive');
    if (wp && e.wet > 0) dmg *= 1 + 0.15 * wp;                                                 // Marea alta
    if (bp && (e.root > 0 || e.bram > 0)) dmg *= 1 + 0.2 * bp;                                 // Savia
    if (lp) dmg *= 1 + 0.06 * lp * p.streak;                                                   // Racha
    { const fb3 = lv('forge_basic'), bp3 = lv('beast_passive');
      if (fb3 || p.temper > 0) dmg *= 1 + 0.03 * temperNow();                                   // Temple
      if (bp3 && e.hp / e.maxHp < 0.3) dmg *= 1 + 0.25 * bp3;                                   // Olfato
      if (has('g_whet')) dmg *= 1.08; }
    { const lp2 = lv('light_passive'), vp2 = lv('void_passive'), db = lv('dream_basic');
      if (lp2) dmg *= 1 + 0.05 * lp2 * Math.min(6, litCount());                                 // Sin sombra
      if (vp2) dmg *= 1 + 0.08 * vp2 * packed(e) * (duoOn('thicket') && (e.root > 0 || e.bram > 0) ? 2 : 1);   // Apiñados (y dúo Espesura)
      if (e.sleep > 0) { dmg *= 1 + Math.max(1, db) * (S._night ? 0 : 1) + (S._night ? 0.8 * lv('dream_charge') : 0); if (!S._night) { if (e.sleepHits > 0) e.sleepHits--; else wake(e); } } }   // Arrullo / Pesadilla
    { const fp = lv('frost_passive'), bp2 = lv('blood_passive');
      if (fp && e.frozen > 0) dmg *= 1 + 0.25 * fp;                                            // Cero absoluto
      if (bp2 && p.hp < p.maxHp / 2) dmg *= 1 + 0.2 * bp2; }                                   // Deuda
    if (duoOn('orchard') && e.root > 0) heal(1); }                                             // dúo Huerto
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);                                  // Organismo débil
  if (G('m_silver')) dmg *= e.boss || e.champ || e.elite ? 1.6 : 0.9;                              // Bala de plata
  if (e.boss && e.act === 'dazed') dmg *= 2;
  if (e.hp / e.maxHp < 0.3) dmg *= 1 + 0.08 * tk('coup');                                       // árbol: Golpe de gracia
  if (has('o_scars') && p.hp < p.maxHp / 2) dmg *= 1.15;                                       // Cicatrices
  e.hp -= dmg; e.flash = 0.1; S.dealt = (S.dealt || 0) + dmg; S.lastHitT = S.t;
  if (e.doom && !S._doom) e.doom.acc += dmg;                                                   // Sentencia: va sumando
  if (e.lit > 0 && !S._share) { const lb = lv('light_basic'); if (lb) { S._share = true; for (const o of S.enemies.slice()) if (o !== e && active(o) && o.lit > 0) { S.stat.share++; hit(o, dmg * (0.2 + 0.1 * lb), 0, 0, false, GODS.light.color); } S._share = false; } }   // Señalar: reparto entre Iluminados
  if (has('u_glint') && !e.glinted) { e.glinted = true; light(e); }                            // Primer rayo
  const kb = (big ? 150 : 60) * (e.boss ? 0.06 : 1); e.kx += ux * kb; e.ky += uy * kb;
  S.fx.push({ k: 'num', x: e.x + rnd(-4, 4), y: e.y - e.r - 2, t: 0, life: 0.55, txt: String(Math.round(dmg)), big });
  for (let i = 0; i < (big ? 7 : 3); i++) S.fx.push({ k: 'spark', x: e.x, y: e.y, vx: ux * rnd(40, 140) + rnd(-50, 50), vy: uy * rnd(40, 140) + rnd(-50, 50), t: 0, life: rnd(0.15, 0.3), col: col || C.energy });
  S.shake = Math.max(S.shake, big ? 5 : 1.6);
  if (S.t - S.lastStop > 0.16) { S.hitstop = big ? 0.05 : 0.02; S.lastStop = S.t; }   // micropausa de impacto, sin encadenarse
  gainFury(2);
  if (e.hp > 0 && has('f_carve') && !e.boss && e.hp / e.maxHp < 0.12) { e.hp = 0; note(e.x, e.y - e.r - 12, '¡Trinchado!', GODS.feast.color); }   // Trinchar
  if (e.hp <= 0) kill(e); else blip(520, 0.035, 'square', 0.025);
}
// Daño continuo: sin pausa ni empujón
function dot(e, dmg, col) {
  if (!active(e)) return;
  const ti = lv('time_passive');
  if (ti && isSlow(e)) dmg *= 1 + 0.3 * ti;
  if (has('v_syn')) dmg *= 1 + Math.min(0.9, 0.03 * e.venom);
  if (e.sleep > 0) { const dp = lv('dream_passive'); if (dp) dmg *= 1 + 0.5 * dp; else wake(e); }   // Sonámbulos: el daño continuo no despierta
  e.hp -= dmg; S.dealt = (S.dealt || 0) + dmg; S.lastHitT = S.t;
  S.fx.push({ k: 'num', x: e.x + rnd(-6, 6), y: e.y - e.r - 2, t: 0, life: 0.4, txt: String(Math.max(1, Math.round(dmg))), col });
  if (e.hp <= 0) kill(e);
  return dmg;
}
// Toda explosión pasa por aquí, así que las técnicas que dicen "todas tus explosiones" afectan a cualquiera
function explode(x, y, r, dmg, o) {
  o = o || {};
  const blood = has('d_blood'), vap = has('v_vapors');
  if (blood) r *= 1.3;
  S.fx.push({ k: 'ring', x, y, r, t: 0, life: 0.28, col: o.col || C.ink });
  if (!o.soft) { S.shake = Math.max(S.shake, 4); blip(90, 0.2, 'sawtooth', 0.05, -40); }
  for (const e of S.enemies.slice()) {
    if (!active(e)) continue;
    const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1;
    if (d > r + e.r) continue;
    if (dmg > 0 && e !== o.skip) hit(e, dmg, dx / d, dy / d, !o.soft, o.col);
    if (!active(e)) continue;
    if (o.push && !e.boss) { e.kx += dx / d * o.push; e.ky += dy / d * o.push; }
    if (o.stun) stun(e, o.stun);
    const em = (o.ember || 0) + (blood ? 2 : 0), ve = (o.venom || 0) + (vap ? 3 : 0);
    if (em) addEmber(e, em);
    if (ve) addVenom(e, ve);
    if (o.zap) { discharge(e, 0.8, null); addNeedles(e, 2); }
    if (o.payoff) chargePayoff(e);
  }
  if (has('o_drums')) gainFury(8);
  if (has('m_reson') && !o.echo) {                                         // Resonancia
    let c = null, cd = 170;
    for (const k of S.crystals) { const d = Math.hypot(k.x - x, k.y - y); if (d < cd && d > 4) { cd = d; c = k; } }
    if (c) S.timers.push({ t: 0.09, fn: () => explode(c.x, c.y, 36, S.p.dmg * 0.6, { col: GODS.stone.color, echo: true, soft: true }) });
  }
}

// ───────────────────────── Lo que se acumula ─────────────────────────
function addEmber(e, n) { if (!active(e) || n <= 0) return; e.ember = Math.min(mastery('dragon') ? 20 : 8, e.ember + n); e.emberT = 4; }
function addVenom(e, n) { if (active(e) && n > 0) { const was = e.venom; e.venom = Math.min(30, e.venom + n * (duoOn('brine') && e.wet > 0 ? 2 : 1)); if (duoOn('poppy') && was < 10 && e.venom >= 10) sleep(e, 3); } }   // (dúos Salmuera y Adormidera)   // (dúo Salmuera)
// Espejos, Bestias y Forja: el Reflejo, el sabueso y el Temple
const mirrorN = () => (lv('mirror_basic') || lv('mirror_charge') ? (mastery('mirror') ? 2 : 1) : 0);
const petN = () => (lv('beast_basic') || lv('beast_charge') || lv('beast_dodge') ? (mastery('beast') ? 2 : 1) : has('a_pup') ? 1 : 0);
const temperMax = () => (mastery('forge') ? 15 : 10);
const temperNow = () => S.p.temper + (duoOn('whetstone') ? S.crystals.length : 0);
function addTemper(n) { const p = S.p; if (n > 0 && p.temper < temperMax()) { p.temper = Math.min(temperMax(), p.temper + n); S.stat.temper++; } }
function bite(pet, e, k) {
  if (!active(e)) return; const p = S.p, d = Math.hypot(e.x - pet.x, e.y - pet.y) || 1; S.stat.bite++;
  S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 4, t: 0, life: 0.1, col: GODS.beast.color });
  onHit(e, p.dmg * k, (e.x - pet.x) / d, (e.y - pet.y) / d, false, GODS.beast.color, 'pet');
  if (duoOn('rabid')) addVenom(e, 2); if (duoOn('warhound')) gainFury(4);
  if (!active(e) && has('a_feral')) heal(2);
}
// Luz: Iluminar. Sueño: dormir. Vacío: pozos que arrastran.
function light(e, t) { if (active(e)) e.lit = Math.max(e.lit || 0, t || 6); }
const litCount = () => S.enemies.reduce((n, e) => n + (active(e) && e.lit > 0 ? 1 : 0), 0) + (duoOn('eclipse') ? S.shades.length : 0);
function sleep(e, t) {
  if (!active(e) || (e.sleepCd || 0) > S.t) return;
  t *= duoOn('siesta') ? 2 : 1;
  if (e.boss) { slow(e, t * 0.5, 0.5); e.sleepCd = S.t + 6; return; }
  e.sleep = Math.max(e.sleep || 0, t); e.sleepHits = mastery('dream') ? 1 : 0; e.wind = 0; e.cast = 0; e.lungeWind = 0; S.stat.sleep++;
  note(e.x, e.y - e.r - 10, 'Zzz', GODS.dream.color);
}
function wake(e) { e.sleep = 0; e.sleepCd = S.t + 4; if (has('z_night')) slow(e, 2, 0.5); }
function tug(e, r, f) { for (const o of others(e, r, 8)) { if (o.boss || o.type.post) continue; const d = dist(e, o) || 1; o.kx += (e.x - o.x) / d * f; o.ky += (e.y - o.y) / d * f; o.slamCd = Math.max(o.slamCd || 0, 0.4); } }
function addWell(x, y, r, life, pulse, end, o) { const k = mastery('void') ? 1.4 : 1; S.wells.push(Object.assign({ x, y, r: r * k, life: life + (mastery('void') ? 1 : 0), acc: 0, pulse, end, got: new Set() }, o || {})); S.stat.well++; }
const packed = e => { let n = 0; for (const o of S.enemies) if (o !== e && active(o) && dist(e, o) < e.r + o.r + 26) n++; return Math.min(4, n); };
// Hielo: la Escarcha se acumula; a la quinta, Congelado
function freeze(e) {
  if (!active(e)) return;
  const dur = (1.5 + (duoOn('stillness') ? 1.5 : 0)) * (mastery('frost') ? 2 : 1);
  e.frost = 0; e.frozen = e.boss ? dur * 0.5 : dur; S.stat.frozen++;
  if (e.boss) slow(e, dur, 0.4); else stun(e, dur);
  note(e.x, e.y - e.r - 10, '¡Congelado!', GODS.frost.color); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 8, t: 0, life: 0.25, col: GODS.frost.color }); blip(1500, 0.12, 'sine', 0.04, -600);
  if (duoOn('hibernate')) e.napAfter = true;                                          // dúo Hibernar
  if (duoOn('glacier')) addCrystal(e.x + rnd(-12, 12), e.y + rnd(-12, 12));           // dúo Glaciar
  if (duoOn('hail') && e.needles > 0) discharge(e, 0.8, null);                        // dúo Granizo
}
function addFrost(e, n) { if (!active(e) || e.frozen > 0 || n <= 0) return; e.frost = (e.frost || 0) + n; e.frostT = 4; if (e.frost >= 5) freeze(e); else slow(e, 2, 1 - 0.12 * e.frost); }
// Sangre: Heridas que sangran según la vida que te falta
function addBleed(e, n) { if (!active(e) || n <= 0) return; e.bleed = Math.min(6, (e.bleed || 0) + n); e.bleedT = 5; if (duoOn('warwound')) gainFury(3 * n); }
function payLife(n) { const p = S.p; n = Math.min(n, p.hp - 1); if (n <= 0) return 0; p.hp -= n; if (duoOn('bloodwine')) addReserve(n); return n; }   // (dúo Vino de sangre)
// Final: Sentencias que devuelven de golpe parte del daño acumulado
const doomK = () => 0.3 + 0.1 * Math.max(1, lv('end_basic'));
function addDoom(e) { if (active(e) && !e.doom) e.doom = { t: mastery('end') ? 3 : 5, acc: 0 }; }
function fulfil(e, bonus) {
  const d = e.doom; if (!d || !active(e)) return;
  e.doom = null; S.stat.doom++;
  if (d.acc > 0) { S._doom = true; note(e.x, e.y - e.r - 12, '¡Sentencia!', GODS.end.color, true); S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 10, t: 0, life: 0.2, col: GODS.end.color }); hit(e, d.acc * doomK() * (bonus || 1), 0, 0, true, GODS.end.color); S._doom = false; }
  if (has('e_seal') && active(e)) stun(e, 0.5);
  if (duoOn('obituary') && !active(e) && !e.boss) raiseShade(e.x, e.y);               // dúo Obituario
}
// Mareas: empapar y empujar. Bosque: semillas que brotan en raíces. Fortuna: críticos.
function soak(e, t) { if (active(e)) e.wet = Math.max(e.wet || 0, t); }
function push(e, ux, uy, f) { if (!active(e) || e.boss) return; e.kx += ux * f; e.ky += uy * f; }
function root(e, t) {
  if (!active(e)) return;
  t *= (mastery('wood') ? 2 : 1) * (duoOn('mangrove') && e.wet > 0 ? 2 : 1) * (e.boss ? 0.35 : 1);
  e.root = Math.max(e.root || 0, t); slow(e, t, 0.02);
  S.fx.push({ k: 'ring', x: e.x, y: e.y, r: e.r + 6, t: 0, life: 0.2, col: GODS.wood.color });
}
function sprout(e) {
  const p = S.p, wb = Math.max(1, lv('wood_basic'));
  e.seed = mastery('wood') ? 2 : 0; S.stat.sprout++;
  note(e.x, e.y - e.r - 10, '¡Brota!', GODS.wood.color);
  root(e, 1.5); hit(e, p.dmg * 0.8 * wb, 0, 0, true, GODS.wood.color);
  if (duoOn('graveroot')) raiseShade(e.x + rnd(-12, 12), e.y + rnd(-12, 12));           // dúo Raíz de tumba
  if (duoOn('thornrod') && active(e) && e.needles > 0) discharge(e, 0.8, null);       // dúo Espina de cobre
}
function addSeed(e, n) { if (!active(e)) return; e.seed = (e.seed || 0) + n; if (e.seed >= (lv('wood_basic') >= 2 ? 2 : 3)) sprout(e); }
const critChance = () => { const lb = lv('luck_basic'); return (lb ? 0.1 + 0.1 * lb + S.p.pity : 0) + (has('l_coin') ? 0.08 : 0) + (duoOn('bones') ? 0.05 * S.shades.length : 0); };
const critMult = () => (mastery('luck') ? 4 : 2.5);
function onCrit(e) {
  const p = S.p;
  S.stat.crit++; p.pity = 0; note(e.x, e.y - e.r - 12, '¡Crítico!', GODS.luck.color, true); blip(2100, 0.06, 'square', 0.04, 300);
  if (lv('luck_passive')) p.streak = Math.min(5, p.streak + 1);                       // Racha
  if (duoOn('jackpot')) addGold(1);                                                   // dúo Tesoro maldito
  if (duoOn('facet')) addCrystal(e.x + rnd(-14, 14), e.y + rnd(-14, 14));             // dúo Faceta
  if (duoOn('snakeeyes') && e.venom > 0) e.venom = Math.min(30, e.venom * 2);         // dúo Ojos de serpiente
  if (duoOn('clover') && active(e) && e.seed > 0) sprout(e);                          // dúo Trébol
  if (duoOn('verdict') && active(e) && e.doom) fulfil(e);                             // dúo Veredicto
  if (has('l_jack') && !active(e)) { explode(e.x, e.y, 48, p.dmg * 1.5, { col: GODS.luck.color }); addGold(3); }   // Premio gordo
}
function stun(e, t) { if (!active(e) || e.boss) return; e.stun = Math.max(e.stun, t); e.wind = 0; e.cast = 0; e.lungeWind = 0; e.lungeT = 0; }
function slow(e, t, f) { if (e.boss) f = 1 - (1 - f) * 0.4; e.slowT = Math.max(e.slowT, t); e.slowF = Math.min(e.slowF, f); }
function addCrystal(x, y) {
  const at = unstick(clamp(x, 12, T.room.w - 12), clamp(y, 12, T.room.h - 12));
  S.crystals.push({ x: at.x, y: at.y, life: has('m_quartz') ? 18 : 9, acc: 0 });
  const max = mastery('stone') ? 12 : 6;
  while (S.crystals.length > max) S.crystals.shift();
}
// Agujas y rayos (Tormenta)
function addNeedles(e, n) {
  if (!active(e) || n <= 0) return;
  e.needles = Math.min(6, e.needles + n); e.needleT = 6;
  if (e.needles >= 6 && has('r_over') && e.autoCd <= 0) { e.autoCd = 0.4; discharge(e, 1, null); }   // Sobrecarga
}
function bolt(from, to, dmg, cas) {
  if (!to || !active(to)) return;
  if (duoOn('beacon')) light(to);                                                     // dúo Faro
  const dx = to.x - from.x, dy = to.y - from.y, d = Math.hypot(dx, dy) || 1;
  S.fx.push({ k: 'tracer', x1: from.x, y1: from.y, x2: to.x, y2: to.y, t: 0, life: 0.16, col: GODS.storm.color, w: 1.4 });
  hit(to, dmg, dx / d, dy / d, false, GODS.storm.color);
  if (!cas || !active(to)) return;
  if (cas.venom) addVenom(to, cas.venom);                                                      // dúo Aguja envenenada
  if (to.needles > 0 && !cas.seen.has(to) && mastery('storm')) discharge(to, cas.mult, cas);   // Tormenta perfecta
  const c = lv('storm_passive');
  if (c) addNeedles(to, c);                                                                    // Conductor
}
// Descargar las Agujas de un enemigo: daño por aguja y un rayo por aguja hacia otros. Devuelve cuántas tenía.
function discharge(e, mult, cas) {
  const n = e.needles;
  if (!n || !active(e)) return 0;
  cas = cas || { seen: new Set(), mult, venom: 0 };
  cas.seen.add(e); e.needles = 0;
  if (duoOn('syringe')) cas.venom = Math.max(cas.venom, e.venom);
  const x = e.x, y = e.y, src = { x, y }, tg = others(e, 125, 6);
  let nb = n;
  if (duoOn('rod')) { const c = S.crystals.find(k => Math.hypot(k.x - x, k.y - y) < 150); if (c) { nb *= 2; S.fx.push({ k: 'beam', x1: x, y1: y, x2: c.x, y2: c.y, t: 0, life: 0.18, w: 2, col: GODS.storm.color }); src.x = c.x; src.y = c.y; } }   // dúo Pararrayos
  S.fx.push({ k: 'ring', x, y, r: 16 + n * 3, t: 0, life: 0.22, col: GODS.storm.color });
  blip(1000 + n * 120, 0.1, 'square', 0.04, -500);
  hit(e, S.p.dmg * mult * n, 0, 0, true, GODS.storm.color);
  for (let i = 0; i < Math.min(14, nb) && tg.length; i++) bolt(src, tg[i % tg.length], S.p.dmg * mult * 0.6, cas);
  if (has('r_judge')) explode(x, y, 60, S.p.dmg * 3, { col: '#ffffff' });   // Juicio
  return n;
}
// Sombras
function raiseShade(x, y, life, temp) {
  const base = (has('s_legion') ? 18 : 9) * (mastery('shade') ? 1.5 : 1);
  if (!temp) { const own = S.shades.filter(s => !s.temp); if (own.length >= shadeCap()) { const old = own[0]; S.shades.splice(S.shades.indexOf(old), 1); } }
  S.shades.push({ x: clamp(x, 8, T.room.w - 8), y: clamp(y, 8, T.room.h - 8), life: life || base, cd: 0.3, temp: !!temp });
  S.fx.push({ k: 'ring', x, y, r: 16, t: 0, life: 0.3, col: GODS.shade.color });
}
function shadeEnd(s) {
  if (duoOn('ashlegion')) explode(s.x, s.y, 40, S.p.dmg, { col: GODS.dragon.color, soft: true });                 // dúo Ejército de ceniza
  if (duoOn('chargedshade')) for (const o of others(s, 70, 4)) discharge(o, 0.8, null);                           // dúo Sombras cargadas
}
function shadeStrike(s, e) {
  const p = S.p, dmg = p.dmg * 0.4 * (mastery('shade') ? 1.5 : 1), dx = e.x - s.x, dy = e.y - s.y, d = Math.hypot(dx, dy) || 1;
  if (lv('shade_passive')) onHit(e, dmg, dx / d, dy / d, false, GODS.shade.color, 'shade'); else hit(e, dmg, dx / d, dy / d, false, GODS.shade.color);
  if (duoOn('ashlegion')) addEmber(e, 2);
  if (duoOn('chargedshade')) addNeedles(e, 1);
  if (duoOn('supper') && active(e) && !e.boss && e.hp / e.maxHp < 0.2) hit(e, e.hp + 1, 0, 0, true, GODS.feast.color);   // dúo Última cena
}

