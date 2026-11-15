// ───────────────────────── Interfaz (DOM) ─────────────────────────
const ov = $('overlay'), ovBody = $('ovBody');
const HINTS = {
  pad: 'Stick izq. mover · A o RT disparar · B o RB esquivar · X o LT cargar · Stick der. cambiar objetivo · Start pausa',
  kb: 'WASD mover · Espacio disparar · Shift esquivar · E cargar · Clic en un enemigo para fijarlo · Esc pausa',
  touch: 'Toca un enemigo para fijarlo como objetivo',
  none: 'Pulsa un botón del mando, una tecla o la pantalla',
};
// ── Menú principal: continuar, nueva partida y ajustes (con la versión del juego) ──
let titleView = 'menu', titleSel = 0;
const hasSave = () => !!(M.seenIntro || M.runs || Object.keys(M.done || {}).length || M.run);
function titleItems() {
  if (titleView === 'confirm') return [['no', 'No, volver'], ['wipe', 'Sí, borrar y empezar de cero']];
  if (titleView === 'settings') { const lv = n => ['Apagado', 'Bajo', 'Medio', 'Normal', 'Alto'][n]; return [
    ['sound', 'Sonido', CFG.sound ? 'Encendido' : 'Apagado'], ['music', 'Volumen de la música', lv(CFG.music)], ['sfx', 'Volumen de los efectos', lv(CFG.sfx)],
    ['blend', 'Suavizado de animaciones', CFG.blend ? 'Sí' : 'No'], ['tips', 'Volver a ver los avisos de ayuda', Object.keys(M.tips || {}).length ? '' : 'Activados'], ['ctl', 'Controles'], ['cred', 'Créditos'], ['back', 'Volver']]; }
  if (titleView === 'ctl' || titleView === 'cred') return [['settings', 'Volver']];
  return (hasSave() ? [['cont', M.run ? 'Continuar · ' + M.run.mission.name : 'Continuar']] : []).concat([['new', 'Nueva partida'], ['settings', 'Ajustes']]);
}
function titleHtml() {
  const it = titleItems(); titleSel = clamp(titleSel, 0, it.length - 1);
  const btns = `<div class="tmenu">${it.map(([id, nm, val], i) => `<button class="fi tm${i === titleSel ? ' sel' : ''}${id === 'wipe' ? ' danger' : ''}" data-tm="${id}"><b>${nm}</b>${val ? `<i>${val}</i>` : ''}</button>`).join('')}</div>`;
  const ver = `Versión ${GAME_V || 'de desarrollo'} · ${IN_APP ? 'app de Android' : 'web'}`;
  let mid = '';
  if (titleView === 'confirm') mid = `<h2>¿Empezar de cero?</h2><p class="lead">Se borrará todo tu progreso: encargos cumplidos, almas, hierro, piezas forjadas y el árbol. Los ajustes se conservan. No se puede deshacer.</p>`;
  else if (titleView === 'settings') mid = `<h2>Ajustes</h2><p class="ver"><b>${ver}</b>${IN_APP ? '<br>La app busca versiones nuevas cada vez que se abre. Si hay una, la descarga sola: en esta pantalla se aplica al momento; si estás jugando, la próxima vez que abras.' : ''}</p>`;
  else if (titleView === 'ctl') mid = `<h2>Controles</h2><dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo · Start pausa</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo · Esc pausa</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl><p class="fine">Con mando: pulsa cualquier botón para que se detecte. En el móvil, juega en horizontal.</p>`;
  else if (titleView === 'cred') mid = `<h2>Créditos</h2><p class="fine">Arte: personajes de overboy (Character Megapack) · biomas y ruinas de Androx, licencia CC BY 4.0 · mazmorras, casas, castillo y gente de Anokolisa (Pixel Crawler) · familia real de Elthen · efectos de «Super Pixel Effects Gigapack», de Will Tice / unTied Games, y del Fantasy RPG Pixel Pack · huesos y ruinas del Free Undead Tileset · iconos de Clockwork Raven Studios (Raven Fantasy Icons) · Alec, dibujado para este juego. Música de RandomMind, ARoachIFoundOnMyPillow y Juhani Junkala; sonidos de «150 Combat Sound Effects» y «Magic Spell SFX» (OpenGameArt, CC0).</p>`;
  else mid = `<p class="lead">Dispara, da un paso, dispara. Roba las técnicas de los dioses y úsalas para matarlos.</p>`;
  return `<div class="titlebox"><p class="eyebrow">Un roguelite de guanteletes y dioses</p><h1 class="logo">Alec, el sin dios</h1>${mid}${btns}<p class="fine vertag">${ver}</p></div>`;
}
function titleAct(id) {
  const cyc = (k, n) => { CFG[k] = (CFG[k] + 1) % n; saveCfg(); };
  if (id === 'cont') { titleView = 'menu'; if (M.seenIntro) openForge(); else playIntro(); return; }
  if (id === 'new') { if (hasSave()) { titleView = 'confirm'; titleSel = 0; } else { playIntro(); return; } }
  else if (id === 'wipe') { try { localStorage.removeItem('kiteo.save3'); sessionStorage.setItem('kiteo.fresh', '1'); } catch (e) { /* sin almacenamiento */ } location.reload(); return; }
  else if (id === 'no' || id === 'back') { titleView = 'menu'; titleSel = 0; }
  else if (id === 'settings' || id === 'ctl' || id === 'cred') { titleSel = id === 'settings' && titleView !== 'menu' ? titleSel : 0; titleView = id; }
  else if (id === 'sound') { cyc('sound', 2); muted = !CFG.sound; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; }
  else if (id === 'music') cyc('music', 5);
  else if (id === 'sfx') cyc('sfx', 5);
  else if (id === 'blend') cyc('blend', 2);
  else if (id === 'tips') tipsReset();
  audioInit(); musicTick(); sfx('tick', 0.3); renderOverlay();
}
function titleInput() {
  const n = titleItems().length;
  if (I.navY) { titleSel = (titleSel + (I.navY > 0 ? 1 : n - 1)) % n; sfx('tick', 0.25); renderOverlay(); }
  else if (I.atkP) titleAct(titleItems()[titleSel][0]);
  else if (I.backP && titleView !== 'menu') titleAct(titleView === 'ctl' || titleView === 'cred' ? 'settings' : 'back');
}
function renderOverlay() {
  const m = S.mode;
  ov.hidden = m === 'play' || m === 'town' || m === 'intro';
  if (m === 'play' || m === 'town' || m === 'intro') { ovBody.innerHTML = ''; return; }
  let h = '';
  if (m === 'title') h = titleHtml();
  else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · ${whereNow()}</p><h1>${gunName(S.gun)}</h1><p class="fine">${(1 / periodOf()).toFixed(2)} disparos por segundo · ${Math.round(S.p.dmg * gunDmg())} de daño por disparo · ${Math.round(rangeOf())} de alcance · ${Math.ceil(S.p.hp)} de ${S.p.maxHp} de vida · ${Math.floor(S.p.gold)} de oro</p><div class="btns"><button id="ovBtn" class="primary">Seguir</button><button id="bookBtn" class="ghost">Recetario</button></div><ul class="build full">${buildHtml(true)}</ul><p class="fine">La partida se guarda al entrar en cada sala: puedes cerrar y continuar luego desde la forja.</p>`;
  } else if (m === 'book') h = bookHtml();
  else if (m === 'dead') {
    h = `<p class="eyebrow">Encargo fallido</p><h1>Alec se retira</h1>
      <p class="lead">${S.failTxt || 'Caíste'} · ${whereNow()}, con ${S.kills} bajas. Te llevas ${lootTxt()} a la forja. El encargo sigue en pie: puedes volver a intentarlo.</p>
      <button id="ovBtn" class="primary">A la plaza</button>`;
  } else if (m === 'win') {
    h = `<p class="eyebrow">${S.mission.zone} · ${MTYPES[S.mission.type].name}</p><h1>${S.mission.type === 'god' ? 'Un dios menos' : 'Encargo cumplido'}</h1>
      <p class="lead">${S.mission.name}: ${S.kills} bajas. El reino paga ${S.pay} almas${S.first ? '' : ' (ya lo habías cobrado entero: repetirlo paga menos)'}. Te llevas ${lootTxt()} a la forja${S.found ? ', y entre los restos encuentras una pieza: ' + S.found : ''}.</p>${newGodHtml(S.newGod)}
      <button id="ovBtn" class="primary">${endingDue() ? 'Seguir' : 'A la plaza'}</button>`;
  } else if (m === 'forge') h = forgeHtml();
  else if (m === 'shop') h = shopHtml();
  else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1>${tipBox(pickTip)}<div class="cards rows">` +
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
  ovBody.querySelectorAll('[data-tm]').forEach((b, i) => b.addEventListener('click', () => { titleSel = i; titleAct(b.dataset.tm); }));
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
// En la pantalla de victoria: la deidad que se acaba de fijar en ti, con su color, su tema y lo que hace
function newGodHtml(g) {
  const G = GODS[g]; if (!G) return '';
  const n = godsOpenN(), all = GOD_UNLOCK.length;
  return `<div class="bkhead newgod" style="--c:${G.color}"><em>Una deidad nueva se ha fijado en ti</em><h2>${G.title}</h2><p><b>${G.theme}.</b> ${G.key}</p>
    <p class="fine">Desde el próximo encargo puedes encontrarte a sus elegidos y robarle técnicas. Su página del Recetario ya está abierta. ${n >= all ? 'Ya te conocen las ' + all + ' deidades.' : 'Te conocen ' + n + ' de ' + all + ' deidades: cada encargo que cumplas por primera vez atrae a otra.'}</p></div>`;
}
function primaryAction(force) {
  if (S.mode === 'title') return;   // el menú principal tiene sus propios botones
  if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'book') closeBook();
  else if ((S.mode === 'dead' || S.mode === 'win') && (force || modeT > 0.8)) { if (endingDue()) playEnding(); else openForge(); }   // tras matar al dios por primera vez, el final del reino
}
$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí';
$('btnMute').addEventListener('click', () => { muted = !muted; CFG.sound = muted ? 0 : 1; saveCfg(); $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); musicTick(); });

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
  $('hpTxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxHp + (p.reserve >= 1 ? '  +' + Math.round(pct(p.reserve)) : '');
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
  $('hint').textContent = '';   // los controles ya no van al pie de la pantalla: están en Ajustes → Controles
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
  else if (m === 'title') titleInput();
  else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  if (!introDraw()) render();
  renderHud(); tipTick(dt);
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Tras «Nueva partida» la página se recarga con la partida borrada y entra directa a la historia
try { if (sessionStorage.getItem('kiteo.fresh')) { sessionStorage.removeItem('kiteo.fresh'); playIntro(); } } catch (e) { /* sin almacenamiento */ }
// Acceso para pruebas
window.__kiteo = { hush, cam: () => cam, view: () => view, audio: () => ({ sfx: Object.keys(SFX).length, mus: musNow, playing: !!(musNow && MUS[musNow] && !MUS[musNow].paused), t: musNow && MUS[musNow] ? MUS[musNow].currentTime : 0, plays: Object.keys(SFXT) }), place: openPlace, town: openTown, intro: playIntro, ending: playEnding, get state() { return S; }, get meta() { return M; }, enter: nextWave, dbg: { spawn, godsOpen,godsOpenN, lootGod, pieceOptions, roomCleared, missionWin, tip, tipTick, startRun, missionOf, get tipNow() { return tipNow; }, get tipQ() { return tipQ.slice(); }, get lastDev() { return lastDev; }, set lastDev(v) { lastDev = v; }, GOD_UNLOCK, kill, shop: openShop, book: openBook, doorScreen, critChance, petN, doomK, temperMax, th, shot, barrelFire, chargePayoff, addDoom, freeze, hit, sleep, light }, gunName, SPR, ENSEMBLES, LEGENDS, ROOM_KINDS, NAV, set forceRoom(k) { ROOM_FORCE = k; }, T, PIECES, DUOS, PLANS, TECHS, GODS, PARTS, RESO, TYPES, WORLDS, RPW };
})();
