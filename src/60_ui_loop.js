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
  ov.hidden = m === 'play';
  if (m === 'play') { ovBody.innerHTML = ''; return; }
  let h = '';
  if (m === 'title') {
    h = `<p class="eyebrow">Sala de Kiteo · prototipo</p><h1>Alec, el sin dios</h1>
      <p class="lead">Los ejércitos de los dioses arrasaron tu pueblo cuando eras un niño. Te crio un herrero: te enseñó a forjar y a pelear, y un elegido lo mató. Ahora vas de reino en reino como mercenario, con un arma hecha por ti y una sola idea: matar a los dioses.</p>
      <p class="lead">Cada disparo te frena un instante: dispara, da un paso, dispara. Cada reino es un mapa con cuatro zonas; en cada zona hay tres encargos y un guardián. Cuando caigan los cuatro, el dios saldrá a buscarte.</p>
      <dl class="keys">
        <div><dt>Mando</dt><dd>Stick izquierdo mover · A o RT disparar · B o RB esquivar · X o LT disparo cargado · stick derecho cambiar de objetivo o apuntar el cargado</dd></div>
        <div><dt>Teclado</dt><dd>WASD mover · Espacio disparar · Shift esquivar · E disparo cargado · clic en un enemigo para fijarlo</dd></div>
        <div><dt>Táctil</dt><dd>Mitad izquierda mover · botones a la derecha · toca un enemigo para fijarlo</dd></div>
      </dl>
      <button id="ovBtn" class="primary">Empezar</button>
      <p class="fine">Con mando: pulsa cualquier botón para que el navegador lo detecte, y después A. En el móvil, juega en horizontal.</p>`;
  } else if (m === 'pause') {
    h = `<p class="eyebrow">Pausa · ${whereNow()}</p><h1>${gunName(S.gun)}</h1><ul class="build full">${buildHtml(true)}</ul><div class="btns"><button id="ovBtn" class="primary">Seguir</button><button id="bookBtn" class="ghost">Recetario</button></div><p class="fine">La partida se guarda al entrar en cada sala: puedes cerrar y continuar luego desde la forja.</p>`;
  } else if (m === 'book') h = bookHtml();
  else if (m === 'dead') {
    h = `<p class="eyebrow">Encargo fallido</p><h1>Alec se retira</h1>
      <p class="lead">${S.failTxt || 'Caíste'} · ${whereNow()}, con ${S.kills} bajas. Te llevas ${lootTxt()} a la forja. El encargo sigue en pie: puedes volver a intentarlo.</p>
      <button id="ovBtn" class="primary">A la forja</button>`;
  } else if (m === 'win') {
    h = `<p class="eyebrow">${S.mission.zone} · ${MTYPES[S.mission.type].name}</p><h1>${S.mission.type === 'god' ? 'Un dios menos' : 'Encargo cumplido'}</h1>
      <p class="lead">${S.mission.name}: ${S.kills} bajas. El reino paga ${S.pay} almas${S.first ? '' : ' (ya lo habías cobrado entero: repetirlo paga menos)'}. Te llevas ${lootTxt()} a la forja${S.found ? ', y entre los restos encuentras una pieza: ' + S.found : ''}.</p>
      <button id="ovBtn" class="primary">A la forja</button>`;
  } else if (m === 'forge') h = forgeHtml();
  else if (m === 'shop') h = shopHtml();
  else if (m === 'pick') {
    h = `<p class="eyebrow">${pickHead.eyebrow}</p><h1>${pickHead.title}</h1><div class="cards">` +
      pickOpts.map((u, i) => `<button class="card${i === pickSel ? ' sel' : ''}" data-i="${i}" id="card${i}" style="--fam:${u.color}"><em>${u.tag}${u.rar ? `<i style="color:${RAR[u.rar].color}"> · ${RAR[u.rar].name}</i>` : ''}</em><strong>${u.name}</strong><span>${u.desc}</span>${u.tag === 'Fundir' ? '' : gloss(u.desc)}${u.note ? `<small>${u.note}</small>` : ''}</button>`).join('') +
      `</div><div class="btns"><button id="bookBtn" class="ghost">Recetario</button>${pickReroll && S.rerolls > 0 ? '<button id="rrBtn" class="ghost">Volver a sortear</button>' : ''}<p class="fine">Izquierda y derecha para elegir, disparar para confirmar. Cargar abre el recetario${pickReroll && S.rerolls > 0 ? ' y esquivar vuelve a sortear' : ''}.</p></div>`;
  }
  ovBody.innerHTML = h;
  ovBody.classList.toggle('wide', m === 'book' || m === 'forge' || m === 'shop');
  if (m === 'forge' || m === 'shop') bindList();
  const rr = $('rrBtn'); if (rr) rr.addEventListener('click', () => { audioInit(); rerollPick(); });
  const bk = $('bookBtn'); if (bk) bk.addEventListener('click', () => { audioInit(); openBook(); });
  const b = $('ovBtn'); if (b) b.addEventListener('click', () => { audioInit(); primaryAction(true); });
  ovBody.querySelectorAll('.card').forEach(c => c.addEventListener('click', () => { audioInit(); modeT = Math.max(modeT, 1); choosePick(+c.dataset.i); }));
}
function primaryAction(force) {
  if (S.mode === 'title') openForge();
  else if (S.mode === 'pause') setMode('play');
  else if (S.mode === 'book') closeBook();
  else if ((S.mode === 'dead' || S.mode === 'win') && (force || modeT > 0.8)) openForge();
}
$('btnPause').addEventListener('click', () => { if (S.mode === 'play') setMode('pause'); else if (S.mode === 'pause') setMode('play'); });
$('btnMute').addEventListener('click', () => { muted = !muted; $('btnMute').textContent = muted ? 'Sonido: no' : 'Sonido: sí'; audioInit(); });

let hudKey = '';
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
  $('wave').textContent = !inRun || !ms ? '' : ms.type === 'defend' ? 'Defensa · oleada ' + S.defWave + ' de 4 · quedan ' + left : ms.type === 'assault' ? 'Asalto · estandartes ' + (S.postsDown || 0) + ' de 3' : S.bossRoom ? ms.zone + ' · ' + ms.name : ms.name + ' · sala ' + S.room + ' de ' + roomsOf(ms) + ' · quedan ' + left;
  $('stats').textContent = inRun ? gunName(S.gun) + ' · ' + (1 / periodOf()).toFixed(2) + ' disparos/s · ' + Math.round(p.dmg) + ' daño · ' + Math.round(rangeOf()) + ' alcance' : '';
  $('res').textContent = !inRun ? '' : ['Oro ' + Math.floor(p.gold), godCount('orc') ? 'Furia ' + Math.round(p.fury) : '', S.shades.length ? 'Sombras ' + S.shades.length : '', S.soulsRun ? 'Almas ' + S.soulsRun : '', S.ironRun ? 'Hierro ' + S.ironRun : ''].filter(Boolean).join(' · ');
  $('build').innerHTML = inRun ? buildHtml(false) : '';
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
  resize(); pollInput(); modeT += dt;
  const m = S.mode;
  if (m === 'book') { ov.scrollTop += I.my * 700 * dt; if (modeT > 0.25 && (I.atkP || I.dodgeP || I.chgP || I.startP)) closeBook(); }
  else if ((m === 'pick' || m === 'pause') && I.chgP) openBook();
  else if (m === 'play') { M.time += dt; if (I.startP) setMode('pause'); else update(dt); }
  else if (m === 'pick') {
    let moved = false;
    if (I.navX || I.navY) { const n = navPick([...ovBody.querySelectorAll('.card')], pickSel, I.navX, I.navY); if (n >= 0 && n !== pickSel) { pickSel = n; moved = true; } }
    if (moved) { ovBody.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === pickSel)); blip(700, 0.03, 'triangle', 0.03); }
    if (I.atkP) choosePick(pickSel);
    if (I.dodgeP) rerollPick();
  } else if (m === 'forge' || m === 'shop') listInput();
  else if (I.atkP || (m === 'pause' && I.startP)) primaryAction(false);
  render(); renderHud();
}
document.addEventListener('visibilitychange', () => { if (document.hidden && S && S.mode === 'play') setMode('pause'); });

newGame(); renderOverlay(); requestAnimationFrame(frame);
// Acceso para pruebas
window.__kiteo = { get state() { return S; }, get meta() { return M; }, enter: nextWave, gunName, SPR, ROOM_KINDS, NAV, set forceRoom(k) { ROOM_FORCE = k; }, T, PIECES, DUOS, PLANS, TECHS, GODS, PARTS, RESO, TYPES, WORLDS, RPW };
})();
