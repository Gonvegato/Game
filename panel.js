// ───────────────────────── La pantalla de abajo (AYN Thor y otras de dos pantallas) ─────────────────────────
// La app abre esta página en la segunda pantalla. El juego (arriba) le manda lo que hay que enseñar: el menú abierto tal cual
// (mismo HTML y mismos estilos) o, mientras juegas, tu build. Al tocar algo aquí, se le dice al juego qué se ha tocado (su
// posición dentro del menú) y el juego lo pulsa en su copia. El mando sigue yendo al juego; aquí solo llegan los dedos.
(function () {
  const ov = document.getElementById('overlay'), body = document.getElementById('ovBody'), hud = document.getElementById('pHud');
  const send = o => { try { window.KiteoPanel.toGame(JSON.stringify(o)); } catch (e) { if (window.parent !== window) window.parent.postMessage({ toGame: JSON.stringify(o) }, '*'); } };
  let screenKey = '';
  const size = () => send({ type: 'size', w: innerWidth, h: innerHeight });
  // Los lienzos del menú (el mapa del tablón) llegan como imagen: se pintan en el mismo sitio para no mover nada de sitio
  function paintCanvases(urls) {
    [...body.querySelectorAll('canvas')].forEach((c, i) => {
      if (!urls || !urls[i]) return;
      const im = new Image(); im.onload = () => { c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0); }; im.src = urls[i];
    });
  }
  window.panelRecv = function (s) {
    const m = JSON.parse(s);
    if (m.type === 'ov') {
      if (!m.show) { ov.hidden = true; hud.hidden = false; return; }
      const was = ov.hidden; hud.hidden = true; ov.hidden = false;
      if (m.html != null) {
        // Si es otra pantalla (otro título), arriba del todo; si es la misma que cambia (otra carta señalada), donde estabas
        body.className = m.cls || ''; body.innerHTML = m.html; paintCanvases(m.canv);
        const t = body.querySelector('h1,h2,h3'), key = (m.cls || '') + '|' + (t ? t.textContent : '');
        if (was || key !== screenKey) { ov.scrollTop = 0; body.scrollTop = 0; }
        screenKey = key;
      } else if (m.canv) paintCanvases(m.canv);
      const sel = body.querySelector('.sel'); if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });   // lo que señala el mando, a la vista
    } else if (m.type === 'hud') hud.innerHTML = m.html;
  };
  // Un toque: lo más concreto que se ha tocado dentro del menú, por su posición entre todos sus elementos
  body.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    const all = body.querySelectorAll('*'); let el = e.target;
    while (el && el !== body) { const i = Array.prototype.indexOf.call(all, el); if (i >= 0) { send({ type: 'click', i }); return; } el = el.parentElement; }
  }, true);
  addEventListener('resize', size);
  addEventListener('message', e => { if (e.data && e.data.toPanel) window.panelRecv(e.data.toPanel); });   // para probarlo en un navegador, dentro de un marco
  size(); send({ type: 'ready' });
})();
