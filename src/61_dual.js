// ───────────────────────── Dos pantallas (AYN Thor y otras como una DS) ─────────────────────────
// Si la app de Android ha abierto una segunda pantalla (puente KiteoDual), el juego se queda arriba y abajo va todo lo demás:
// los menús, las cartas, la tienda, la forja, el tablón y el recetario (su HTML tal cual, que panel.html pinta con los mismos
// estilos) y, mientras juegas, tu build completa con la vida y el oro. Las conversaciones siguen arriba, con el juego.
// El menú de arriba no se borra: se queda invisible y del tamaño exacto de la pantalla de abajo, para que el mando lo recorra
// igual que se ve abajo y para que un toque abajo («el elemento número i») se pulse aquí en el mismo sitio.
const DUAL = { tap: false, top: '', on: false, sent: '', canv: '', hud: '', t: 0 };
const dualTop = (() => { const d = document.createElement('div'); d.id = 'dualTop'; d.hidden = true; document.getElementById('app').appendChild(d); return d; })();
function dualSend(o) { try { window.KiteoDual.toPanel(JSON.stringify(o)); } catch (e) { /* sin segunda pantalla */ } }
function dualOn() {
  let has = false; try { has = !!(window.KiteoDual && window.KiteoDual.has()); } catch (e) { }
  DUAL.on = has; document.body.classList.toggle('dual', has); DUAL.sent = ''; DUAL.hud = ''; DUAL.canv = '';
  if (has) dualSync();
}
function dualOff() { DUAL.on = false; document.body.classList.remove('dual'); dualTop.hidden = true; }
// Lo que pide la pantalla de abajo. Un toque abajo se pulsa aquí marcado como dedo (DUAL.tap): en el mapa, el primer toque señala y el segundo acepta
window.dualRecv = function (s) {
  const m = JSON.parse(s);
  if (m.type === 'size') { document.documentElement.style.setProperty('--pw', m.w + 'px'); document.documentElement.style.setProperty('--ph', m.h + 'px'); DUAL.sent = ''; dualSync(); }
  else if (m.type === 'ready') { if (!DUAL.on) dualOn(); DUAL.sent = ''; DUAL.hud = ''; DUAL.canv = ''; dualSync(); }
  else if (m.type === 'choice') talkPick(m.i);
  else if (m.type === 'click') { const el = ovBody.querySelectorAll('*')[m.i]; if (el) { audioInit(); if (dualMark(el)) return; DUAL.tap = true; try { el.click(); } finally { DUAL.tap = false; } } }
};
// Lo que tiene descripción (cartas, piezas, ramas del árbol, lo que vende la tienda): el primer toque lo señala y arriba se lee
// entero; el segundo lo elige. Las pestañas, «Volver» y los demás botones van al primer toque.
const dualTwoTap = it => it.classList.contains('card') || /^(p|t|buy):/.test(it.dataset.act || '');
function dualMark(el) {
  const it = el.closest('.card, .fi'); if (!it || !ovBody.contains(it) || it.classList.contains('sel') || !dualTwoTap(it)) return false;
  if (it.classList.contains('card')) { pickSel = +it.dataset.i; ovBody.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('sel', i === pickSel)); }
  else { const els = [...ovBody.querySelectorAll('.fi')]; listSel = els.indexOf(it); els.forEach((x, i) => x.classList.toggle('sel', i === listSel)); }
  sfx('tick', 0.25); return true;
}
// Arriba, mientras hay un menú abajo: lo que se lee. El texto del menú (títulos, explicaciones, la build en la pausa) y, al lado,
// lo señalado en grande: la carta o la pieza con su glosario, o en el tablón el mapa grande con el encargo señalado.
function dualDetail(urls) {
  const noIds = h => h.replace(/\sid="[^"]*"/g, '');   // copias sin id: que $('...') siga encontrando los botones de verdad
  const c = ovBody.cloneNode(true);
  c.querySelectorAll('button, .fi, .tabs, .cards, .kwrap, canvas').forEach(e => e.remove());
  c.querySelectorAll('section, .gunwrap, .forge').forEach(e => { if (!e.querySelector('p, li, blockquote')) e.remove(); });
  let focus = '', side = '';
  const kw = ovBody.querySelector('.kwrap');
  if (kw) {
    const w = kw.querySelector('.kworld').cloneNode(true), cv = w.querySelector('canvas');
    if (cv) { const im = document.createElement('img'); im.src = urls[0] || ''; im.className = 'dmap'; cv.replaceWith(im); }
    const info = kw.querySelector('.kinfo').cloneNode(true); info.querySelectorAll('button').forEach(e => e.remove());
    const head = kw.querySelector('.khead'), leg = kw.querySelector('.klegend');
    focus = `<div class="dt-map">${w.outerHTML}</div>`;
    side = `${info.outerHTML}${head ? head.outerHTML : ''}${leg ? leg.outerHTML : ''}`;   // primero el encargo señalado
  } else {
    const sel = ovBody.querySelector('.card.sel, .fi.sel');
    if (sel && dualTwoTap(sel)) focus = `<div class="dt-focus">${sel.classList.contains('card') ? `<div class="cards">${sel.outerHTML}</div>` : sel.outerHTML}</div>`;
  }
  const two = ovBody.querySelector('.card, .fi[data-act^="p:"], .fi[data-act^="t:"], .fi[data-act^="buy:"], .fi.mk');
  const hint = two ? `<p class="dt-hint">Abajo: un toque señala y otro elige · o con la cruceta y A</p>` : '';
  if (kw) c.querySelectorAll('p.fine, .kingdom > p').forEach(e => e.remove());   // en el tablón, lo que importa es el encargo señalado
  return noIds(`<div class="dt${focus ? '' : ' solo'}${kw ? ' map' : ''}"><div class="dt-text">${kw ? c.innerHTML.replace(/<h1>.*?<\/h1>/, '') + side : c.innerHTML}</div>${focus}</div>${hint}`);
}
// Los sticks desplazan lo que se lee: con dos pantallas, el texto de arriba
function dualScroll(dy) { const t = DUAL.on && dualTop.querySelector('.dt-text'); if (t) { t.scrollTop += dy; return true; } return false; }
// Manda el menú (si hay) cuando cambia; los lienzos (el mapa del tablón) como imagen
function dualSync() {
  if (!DUAL.on) return;
  // Una conversación esperando respuesta: abajo, lo último que te han dicho y las respuestas como botones
  const d = S.dialog;
  if (d && d.choices && d.i >= d.lines.length) {
    const L = d.lines[d.lines.length - 1], who = L && L.who && typeof L.who === 'string' && L.who !== 'alec' ? L.who : '';
    const html = `<div class="dchoice">${L ? `<p class="said">${L.text}</p>` : ''}<p class="eyebrow">Alec responde</p>` +
      d.choices.map((c, i) => `<button class="opt${i === d.sel ? ' sel' : ''}" data-ch="${i}">${c.label}</button>`).join('') + '</div>';
    dualTop.hidden = true;
    const key = 'dlg|' + html; if (key !== DUAL.sent) { DUAL.sent = key; dualSend({ type: 'ov', show: true, html, cls: 'dlg', canv: [] }); }
    return;
  }
  const ovEl = $('overlay'), show = !ovEl.hidden && S.mode !== 'play' && S.mode !== 'town' && S.mode !== 'intro';
  dualTop.hidden = !show;
  const html = show ? ovBody.innerHTML : '', key = show + '|' + ovBody.className + '|' + html;
  let canv = '';
  const cs = show ? [...ovBody.querySelectorAll('canvas')] : [];
  const urls = cs.map(c => { try { return c.toDataURL(); } catch (e) { return ''; } });
  canv = urls.join('|');
  if (show) { const t = dualDetail(urls); if (t !== DUAL.top) {
    const o = dualTop.querySelector('.dt-text'), st = o ? o.scrollTop : 0, same = S.mode + '|' + (ovBody.querySelector('h1') || {}).textContent;
    DUAL.top = t; dualTop.innerHTML = t; const n = dualTop.querySelector('.dt-text'); if (n && same === DUAL.topKey) n.scrollTop = st; DUAL.topKey = same; } }
  if (key !== DUAL.sent) { DUAL.sent = key; DUAL.canv = canv; dualSend({ type: 'ov', show, html, cls: ovBody.className, canv: urls }); }
  else if (show && canv !== DUAL.canv) { DUAL.canv = canv; dualSend({ type: 'ov', show, canv: urls }); }
}
// La build de la partida, con las ranuras libres juntas en una línea en vez de una caja cada una
function dualBuild() {
  const free = SLOT_KEYS.filter(k => !S.build[k]).map(k => SLOTS[k]);
  const rows = buildHtml(true).split('</li>').filter(r => r && !r.includes('Ranura libre')).map(r => r + '</li>').join('');
  return `${free.length ? `<p class="free">Libre: ${free.join(' · ')}</p>` : ''}<ul class="build full">${rows}</ul>`;
}
// Sin menú: la build, la vida y el oro (en partida), o el reino y lo que llevas ganado (en la ciudad)
function dualHud() {
  if (!DUAL.on) return;
  let h = '';
  if (S.mode === 'play' && S.mission) {
    const p = S.p, ms = S.mission;
    h = `<p class="where">${ms.zone} · ${ms.name}</p><div class="dh"><b class="life">${Math.ceil(p.hp)} / ${p.maxHp} de vida</b><b class="coin">${Math.floor(p.gold)} de oro</b><span>${S.soulsRun || 0} almas · ${S.ironRun || 0} de Hierro</span>${ms.type === 'assault' ? `<span>Nivel ${S.xpLvl + 1} · ${S.xp}/${xpNeed(S.xpLvl)} de experiencia</span>` : ''}</div>
      <h2>${gunName(S.gun)}</h2>${dualBuild()}`;
  } else if (S.mode === 'town' || S.mode === 'play') {
    const K = kingdomNow();
    h = `<p class="where">${K.title}</p><div class="dh"><b>${M.souls} almas</b><b>${M.iron} de Hierro Místico</b></div><h2>${gunName(S.gun)}</h2>
      <ul class="build full">${GSLOT_KEYS.map(k => S.gun[k] && PART[S.gun[k]] ? `<li><em>${GSLOTS ? GSLOTS[k] : k}</em><b>${PART[S.gun[k]].name}</b><span>${PART[S.gun[k]].desc}</span></li>` : '').join('')}</ul>`;
  } else h = '<p class="logo">Alec, el sin dios</p>';
  if (h !== DUAL.hud) { DUAL.hud = h; dualSend({ type: 'hud', html: h }); }
}
new MutationObserver(() => { if (DUAL.on) requestAnimationFrame(dualSync); }).observe(ovBody, { subtree: true, childList: true, attributes: true, characterData: true });
new MutationObserver(() => { if (DUAL.on) requestAnimationFrame(dualSync); }).observe($('overlay'), { attributes: true, attributeFilter: ['hidden'] });
setInterval(() => { if (DUAL.on) { dualHud(); dualSync(); } }, 300);
setInterval(() => { if (DUAL.on && S.dialog && S.dialog.choices) dualSync(); }, 80);   // la respuesta señalada con el mando, al momento   // la vida y el oro cambian sin que cambie ningún menú
window.dualOn = dualOn; window.dualOff = dualOff;   // la app los llama al aparecer o desaparecer la segunda pantalla
dualOn();
