// ───────────────────────── Dos pantallas (AYN Thor y otras como una DS) ─────────────────────────
// Si la app de Android ha abierto una segunda pantalla (puente KiteoDual), el juego se queda arriba y abajo va todo lo demás:
// los menús, las cartas, la tienda, la forja, el tablón y el recetario (su HTML tal cual, que panel.html pinta con los mismos
// estilos) y, mientras juegas, tu build completa con la vida y el oro. Las conversaciones siguen arriba, con el juego.
// El menú de arriba no se borra: se queda invisible y del tamaño exacto de la pantalla de abajo, para que el mando lo recorra
// igual que se ve abajo y para que un toque abajo («el elemento número i») se pulse aquí en el mismo sitio.
const DUAL = { on: false, sent: '', canv: '', hud: '', t: 0 };
const dualTop = (() => { const d = document.createElement('div'); d.id = 'dualTop'; d.hidden = true; document.getElementById('app').appendChild(d); return d; })();
function dualSend(o) { try { window.KiteoDual.toPanel(JSON.stringify(o)); } catch (e) { /* sin segunda pantalla */ } }
function dualOn() {
  let has = false; try { has = !!(window.KiteoDual && window.KiteoDual.has()); } catch (e) { }
  DUAL.on = has; document.body.classList.toggle('dual', has); DUAL.sent = ''; DUAL.hud = ''; DUAL.canv = '';
  if (has) dualSync();
}
function dualOff() { DUAL.on = false; document.body.classList.remove('dual'); dualTop.hidden = true; }
// Lo que pide la pantalla de abajo
window.dualRecv = function (s) {
  const m = JSON.parse(s);
  if (m.type === 'size') { document.documentElement.style.setProperty('--pw', m.w + 'px'); document.documentElement.style.setProperty('--ph', m.h + 'px'); DUAL.sent = ''; dualSync(); }
  else if (m.type === 'ready') { if (!DUAL.on) dualOn(); DUAL.sent = ''; DUAL.hud = ''; DUAL.canv = ''; dualSync(); }
  else if (m.type === 'click') { const el = ovBody.querySelectorAll('*')[m.i]; if (el) { audioInit(); el.click(); } }
};
// Manda el menú (si hay) cuando cambia; los lienzos (el mapa del tablón) como imagen
function dualSync() {
  if (!DUAL.on) return;
  const ovEl = $('overlay'), show = !ovEl.hidden && S.mode !== 'play' && S.mode !== 'town' && S.mode !== 'intro';
  dualTop.hidden = !show;
  if (show) dualTop.innerHTML = S.mode === 'title' ? '<p class="logo">Alec, el sin dios</p><p class="fine">Elige en la pantalla de abajo</p>' : '<p class="fine">↓ En la pantalla de abajo</p>';
  const html = show ? ovBody.innerHTML : '', key = show + '|' + ovBody.className + '|' + html;
  let canv = '';
  const cs = show ? [...ovBody.querySelectorAll('canvas')] : [];
  const urls = cs.map(c => { try { return c.toDataURL(); } catch (e) { return ''; } });
  canv = urls.join('|');
  if (key !== DUAL.sent) { DUAL.sent = key; DUAL.canv = canv; dualSend({ type: 'ov', show, html, cls: ovBody.className, canv: urls }); }
  else if (show && canv !== DUAL.canv) { DUAL.canv = canv; dualSend({ type: 'ov', show, canv: urls }); }
}
// Sin menú: la build, la vida y el oro (en partida), o el reino y lo que llevas ganado (en la ciudad)
function dualHud() {
  if (!DUAL.on) return;
  let h = '';
  if (S.mode === 'play' && S.mission) {
    const p = S.p, ms = S.mission;
    h = `<p class="where">${ms.zone} · ${ms.name}</p><div class="dh"><b class="life">${Math.ceil(p.hp)} / ${p.maxHp} de vida</b><b class="coin">${Math.floor(p.gold)} de oro</b><span>${S.soulsRun || 0} almas · ${S.ironRun || 0} de Hierro</span></div>
      <h2>${gunName(S.gun)}</h2><ul class="build full">${buildHtml(true)}</ul>`;
  } else if (S.mode === 'town' || S.mode === 'play') {
    const K = kingdomNow();
    h = `<p class="where">${K.title}</p><div class="dh"><b>${M.souls} almas</b><b>${M.iron} de Hierro Místico</b></div><h2>${gunName(S.gun)}</h2>
      <ul class="build full">${GSLOT_KEYS.map(k => S.gun[k] && PART[S.gun[k]] ? `<li><em>${GSLOTS ? GSLOTS[k] : k}</em><b>${PART[S.gun[k]].name}</b><span>${PART[S.gun[k]].desc}</span></li>` : '').join('')}</ul>`;
  } else h = '<p class="logo">Alec, el sin dios</p>';
  if (h !== DUAL.hud) { DUAL.hud = h; dualSend({ type: 'hud', html: h }); }
}
new MutationObserver(() => { if (DUAL.on) requestAnimationFrame(dualSync); }).observe(ovBody, { subtree: true, childList: true, attributes: true, characterData: true });
new MutationObserver(() => { if (DUAL.on) requestAnimationFrame(dualSync); }).observe($('overlay'), { attributes: true, attributeFilter: ['hidden'] });
setInterval(() => { if (DUAL.on) { dualHud(); dualSync(); } }, 300);   // la vida y el oro cambian sin que cambie ningún menú
window.dualOn = dualOn; window.dualOff = dualOff;   // la app los llama al aparecer o desaparecer la segunda pantalla
dualOn();
