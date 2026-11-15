// ───────────────────────── Interfaz (DOM) ─────────────────────────
const ov = $('overlay'), ovBody = $('ovBody');
const HINTS = {
  pad: 'Stick izq. mover · A o RT disparar · B o RB esquivar · X o LT cargar · Stick der. cambiar objetivo · Start pausa',
  kb: 'WASD mover · Espacio disparar · Shift esquivar · E cargar · Clic en un enemigo para fijarlo · Esc pausa',
  touch: 'Toca un enemigo para fijarlo como objetivo',
  none: 'Pulsa un botón del mando, una tecla o la pantalla',
};
function renderOverlay() {
  const m = S.mode;
  ov.hidden = m === 'play' || m === 'town' || m === 'intro';
  if (m === 'play' || m === 'town' || m === 'intro') { ovBody.innerHTML = ''; return; }
  let h = '';
  if (m === 'title') {
    h = `<div class="titlebox"><p class="eyebrow">Un roguelite de guanteletes y dioses</p><h1 class="logo">Alec, el sin dios</h1>
      <p class="lead">Dispara, da un paso, dispara. Roba las técnicas de los dioses y úsalas para matarlos.</p>
      <button id="ovBtn" class="primary big">${M.seenIntro ? 'Continuar' : 'Empezar'}</button>
      <details class="ctl"><summary>Controles</summary><dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo · Start pausa</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo · Esc pausa</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl></details>
      <p class="fine">Con mando: pulsa cualquier botón para que el navegador lo detecte, y después A. En el móvil, juega en horizontal.</p>
      <p class="fine">Arte: personajes de overboy (Character Megapack) · biomas y ruinas de Androx, licencia CC BY 4.0 · mazmorras, casas, castillo y gente de Anokolisa (Pixel Crawler) · familia real de Elthen · efectos de «Super Pixel Effects Gigapack», de Will Tice / unTied Games, y del Fantasy RPG Pixel Pack · huesos y ruinas del Free Undead Tileset · iconos de Clockwork Raven Studios (Raven Fantasy Icons) · Alec, dibujado para este juego. Música de RandomMind, ARoachIFoundOnMyPillow y Juhani Junkala; sonidos de «150 Combat Sound Effects» y «Magic Spell SFX» (OpenGameArt, CC0).</p></div>`;
  } else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · ${whereNow()}</p><h1>${gunName(S.gun)}</h1><p class="fine">${(1 / periodOf()).toFixed(2)} disparos por segundo · ${Math.round(S.p.dmg * gunDmg())} de daño por disparo · ${Math.round(rangeOf())} de alcance · ${Math.ceil(S.p.hp)} de ${S.p.maxHp} de vida · ${Math.floor(S.p.gold)} de oro</p><div class="btns"><button id="ovBtn" class="primary">Seguir</button><button id="bookBtn" class="ghost">Recetario</button></div><ul class="build full">${buildHtml(true)}</ul><p class="fine">La partida se guarda al entrar en cada sala: puedes cerrar y continuar luego desde la forja.</p>`;
  } else if (m === 'book') h = bookHtml();
  else if (m === 'dead') {
    h = `<p class="eyebrow">Encargo fallido</p><h1>Alec se retira</h1>
      <p class="lead">${S.failTxt || 'Caíste'} · ${whereNow()}, con ${S.kills} bajas. Te llevas ${lootTxt()} a la forja. El encargo sigue en pie: puedes volver a intentarlo.</p>
      <button id="ovBtn" class="primary">A la plaza</button>`;
  } else if (m === 'win') {
    h = `<p class="eyebrow">${S.mission.zone} · ${MTYPES[S.mission.type].name}</p><h1>${S.mission.type === 'god' ? 'Un dios menos' : 'Encargo cumplido'}</h1>
      <p class="lead">${S.mission.name}: ${S.kills} bajas. El reino paga ${S.pay} almas${S.first ? '' : ' (ya lo habías cobrado entero: repetirlo paga menos)'}. Te llevas ${lootTxt()} a la forja${S.found ? ', y entre los restos encuentras una pieza: ' + S.found : ''}.</p>
      <button id="ovBtn" class="primary">${endingDue() ? 'Seguir' : 'A la plaza'}</button>`;
  } else if (m === 'forge') h = forgeHtml();
  else if (m === 'shop') h = shopHtml();
  else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1><div class="cards rows">` +
      pickOpts.map((u, i) => `<button class="card${i === pickSel ? ' sel' : ''}" data-i="${i}" id="card${i}" style="--fam:${u.color}"><div class="ch"><em>${u.tag}${u.rar ? `<i style="color:${RAR[u.rar].color}"> · ${RAR[u.rar].name}</i>` : ''}</em><strong>${u.pic ? pic(u.pic) : u.ico ? ico(u.ico[0], u.ico[1]) : ''}${u.name}</strong></div><div class="cb"><span>${u.desc}</span>${u.note ? `<small>${u.note}</small>` : ''}</div>${u.tag === 'Vender' ? '' : gloss(u.desc + ' ' + (u.note || ''), 4)}</button>`).join('') +
      `</div><div class="btns"><button id="bookBtn" class="ghost">Recetario</button>${pickReroll && S.rerolls > 0 ? '<button id="rrBtn" class="ghost">Volver a sortear</button>' : ''}<p class="fine">Muévete con el stick izquierdo o la cruceta (también hacia abajo), disparar para confirmar. El stick derecho desplaza la pantalla. Cargar abre el recetario${pickReroll && S.rerolls > 0 ? ' y esquivar vuelve a sortear' : ''}.</p></div>`;
  }
  ovBody.innerHTML = h;
  ovBody.classList.toggle('wide', m === 'book' || m === 'forge' || m === 'shop' || m === 'pick' || m === 'pause');
  if (m === 'forge' || m === 'shop') bindList();
  ovBody.querySelectorAll('[data-bk]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); audioInit(); bookPage = +b.dataset.bk; bookTurn(0); }));
  const rr = $('rrBtn'); if (rr) rr.addEventListener('click', () => { audioInit(); rerollPick(); });
  const bk = $('bookBtn'); if (bk) bk.addEventListener('click', () => { audioInit(); openBook(); });
  const b = $('ovBtn'); if (b) b.addEventListener('click', () => { audioInit(); primaryAction(true); });
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
function primaryAction(force) {
  if (S.mode === 'title') { if (M.seenIntro) openForge(); else playIntro(); }   // la primera vez, Alec cuenta su historia antes de llegar a la plaza
  else if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'book') closeBook();
  else if ((S.mode === 'dead' || S.mode === 'win') && (force || modeT > 0.8)) { if (endingDue()) playEnding(); else openForge(); }   // tras matar al dios por primera vez, el final del reino
}
$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').addEventListener('click', () => { muted = !muted; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); musicTick(); });

let hudKey = '';
// Las cuatro acciones en el HUD: una casilla por acción, con el color de su deidad y el nivel en puntos
function hudBuild() {
  const short = { basic: 'Disparo', charge: 'Cargado', dodge: 'Esquive', passive: 'Pasiva' };
  return SLOT_KEYS.map(k => { const cur = S.build[k]; if (!cur) return `<li class="slot empty"><em>${short[k]}</em><b>—</b></li>`;
    const D = DUO[cur.id], col = D ? RAR[3].color : GODS[PIECE[cur.id].god].color, nm = D ? D.name : PIECE[cur.id].name;
    return `<li class="slot" style="--c:${col}">${pic(D ? D.a : cur.id, 's')}<em>${short[k]}</em><b>${nm}</b><u>${'<i></i>'.repeat(cur.lvl)}</u></li>`; }).join('');
}
function renderHud() {
  const p = S.p;
  const dev = padBlocked ? 'Mando bloqueado en esta vista' : padName ? 'Mando conectado' : lastDev === 'touch' ? 'Táctil' : lastDev === 'kb' ? 'Teclado' : 'Mando no detectado';
  const left = S.enemies.length + S.queue.length, bo = S.enemies.find(e => e.boss && e.spawn <= 0), inRun = S.wave > 0;
  const key = [Math.ceil(p.hp), p.maxHp, Math.round(p.reserve), S.wave, left, dev, lastDev, periodOf().toFixed(3), Math.round(p.dmg), Math.round(rangeOf()), S.mode, JSON.stringify(S.build), JSON.stringify(S.gun), S.techs.size, S.plans.size,
    Math.round(p.fury / 4), Math.floor(p.gold), S.shades.length, S.soulsRun, S.ironRun, bo ? Math.ceil(bo.hp / 8) : -1, S.keep ? Math.ceil(S.keep.hp / 4) : -1, S.defWave, S.postsDown].join('|');
  if (key === hudKey) return; hudKey = key;
  $('hpFill').style.width = clamp(p.hp / p.maxHp * 100, 0, 100) + '%';
  $('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp + (p.reserve >= 1 ? '  +' + Math.round(p.reserve) : '');
  const ms = S.mission;
  // Cabecera del encargo: nombre, en qué tramo vas y una fila de cuentas (hechas, la actual, tiendas y jefe)
  if (!inRun || !ms) { $('wave').innerHTML = ''; $('pips').innerHTML = ''; }
  else {
    const tot = roomsOf(ms), unit = ms.type === 'defend' ? 'Oleada' : ms.type === 'assault' ? 'Campamento' : 'Sala';
    const sub = S.bossRoom ? 'Jefe' : unit + ' ' + S.room + ' de ' + tot + (ms.type === 'assault' ? ' · estandartes ' + (S.postsDown || 0) + '/' + (S.postsAll || 3) : ' · quedan ' + left);
    $('wave').innerHTML = `<b>${ms.name}</b><span>${MTYPES[ms.type].name} · ${sub}</span>`;
    let h = ''; for (let i = 1; i <= tot; i++) h += `<i class="${i < S.room ? 'done' : i === S.room ? 'now' : ''}${hasBoss(ms) && i === tot ? ' boss' : ''}"></i>` + (i < tot && shopAfter(ms, i) ? '<i class="shop"></i>' : '');
    $('pips').innerHTML = h;
  }
  $('stats').textContent = inRun ? gunName(S.gun) : '';
  const rc = (cls, n, t) => `<span class="rc ${cls}" title="${t}"><i></i>${n}</span>`;
  $('res').innerHTML = !inRun ? '' : rc('gold', Math.floor(p.gold), 'Oro') + (S.soulsRun ? rc('soul', S.soulsRun, 'Almas') : '') + (S.ironRun ? rc('iron', S.ironRun, 'Hierro Místico') : '') + (godCount('orc') || G('a_drum') ? rc('fury', Math.round(p.fury), 'Furia') : '') + (S.shades.length ? rc('shade', S.shades.length, 'Sombras') : '');
  $('build').innerHTML = inRun ? hudBuild() : '';
  $('boss').hidden = (!bo && !S.keep) || S.mode !== 'play';
  if (S.keep) { $('boss').firstElementChild.textContent = 'La campana de la aldea'; $('bossFill').style.width = clamp(S.keep.hp / S.keep.maxHp * 100, 0, 100) + '%'; }
  else if (bo) { $('boss').firstElementChild.textContent = bo.type.name; $('bossFill').style.width = clamp(bo.hp / bo.maxHp * 100, 0, 100) + '%'; }
  $('dev').textContent = dev;
  $('hint').textContent = HINTS[lastDev] || HINTS.none;
  $('touch').hidden = lastDev !== 'touch';
}

// ───────────────────────── Bucle ─────────────────────────
let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
  resize(); pollInput(); modeT += dt; musicTick();
  const m = S.mode;
  if (m !== 'play' && Math.abs(I.ay) > 0.2) ov.scrollTop += I.ay * 900 * dt;   // en cualquier menú, el stick derecho desplaza la pantalla
  if (m === 'pause' || m === 'dead' || m === 'win' || m === 'title') ov.scrollTop += I.my * 700 * dt;   // donde no hay nada que elegir, el izquierdo también
  if (m === 'book') { ov.scrollTop += I.my * 700 * dt; if (I.tabL || I.tabR || I.navX) bookTurn(I.tabL || I.navX < 0 ? -1 : 1); else if (modeT > 0.25 && (I.atkP || I.dodgeP || I.chgP || I.startP)) closeBook(); }
  else if ((m === 'pick' || m === 'pause') && I.chgP) openBook();
  else if (m === 'town') townUpdate(dt);
  else if (m === 'intro') introUpdate(dt);
  else if (m === 'play') { M.time += dt; if (I.startP) setMode('pause'); else update(dt); }
  else if (m === 'pick') {
    let moved = false;
    if (I.navX || I.navY) { const n = navPick([...ovBody.querySelectorAll('.card')], pickSel, I.navX, I.navY); if (n >= 0 && n !== pickSel) { pickSel = n; moved = true; } }
    if (moved) { ovBody.querySelectorAll('.card').forEach((c, i) => { c.classList.toggle('sel', i === pickSel); if (i === pickSel) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }); sfx('tick', 0.25); }
    if (I.atkP) choosePick(pickSel);
    if (I.backP) rerollPick();
  } else if (m === 'forge' || m === 'shop') listInput();
  else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  if (!introDraw()) render();
  renderHud();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Acceso para pruebas
window.__kiteo = { audio: () => ({ sfx: Object.keys(SFX).length, mus: musNow, playing: !!(musNow && MUS[musNow] && !MUS[musNow].paused), t: musNow && MUS[musNow] ? MUS[musNow].currentTime : 0, plays: Object.keys(SFXT) }), place: openPlace, town: openTown, intro: playIntro, ending: playEnding, get state() { return S; }, get meta() { return M; }, enter: nextWave, dbg: { kill, shop: openShop, book: openBook, doorScreen, critChance, petN, doomK, temperMax, th, shot, barrelFire, chargePayoff, addDoom, freeze, hit, sleep, light }, gunName, SPR, ENSEMBLES, LEGENDS, ROOM_KINDS, NAV, set forceRoom(k) { ROOM_FORCE = k; }, T, PIECES, DUOS, PLANS, TECHS, GODS, PARTS, RESO, TYPES, WORLDS, RPW };
})();
