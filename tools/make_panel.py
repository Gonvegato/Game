#!/usr/bin/env python3
"""Monta panel.html, la página de la pantalla de abajo (consolas de dos pantallas como la AYN Thor), con la misma cabecera y los
mismos estilos que index.html: así el menú que manda el juego se ve igual aquí abajo. El cuerpo es solo el menú, la build y panel.js.
Uso: python3 -I tools/make_panel.py  (lo llama tools/make_bundle.sh)"""
import os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
head = src[:src.index('</head>')]
page = head + '''<style>
/* La pantalla de abajo: el menú ocupa todo y se desplaza con el dedo; sin menú, la build */
html,body{height:100%;background:#0b080d;overflow:hidden}
#panelApp{position:fixed;inset:0;display:flex;flex-direction:column}
#panelApp #overlay{position:absolute;inset:0;overflow:auto;-webkit-overflow-scrolling:touch;display:flex;padding:6px;box-sizing:border-box}
#panelApp #ovBody{width:100%!important;max-width:none!important;margin:0 auto;align-self:flex-start;min-height:100%;height:auto}   /* el recuadro crece con el menú (si no, se queda del alto de la pantalla y lo de abajo se sale) */
#pHud{position:absolute;inset:0;overflow:auto;padding:10px 12px;box-sizing:border-box;color:var(--ink,#efe6c8);font-family:'Pixelify Sans',sans-serif}
#pHud .dh{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;margin:0 0 8px}
#pHud .dh b{font-size:15px}#pHud .dh .life{color:#e0524a}#pHud .dh .coin{color:#f2c14e}
#pHud h2{font-size:14px;margin:8px 0 6px;color:var(--ember,#ff8a3c)}
#pHud .free{font-size:12px;opacity:.7;margin:0 0 6px}
#pHud .where{opacity:.75;font-size:12px;margin:0 0 6px}
#panelApp .kworld{min-width:0}
/* Abajo se toca y arriba se lee: aquí fuera los títulos y las explicaciones (están en la pantalla de arriba) y las cartas y piezas en corto */
#ovBody:not(.dlg) p,#ovBody .tipbox,#ovBody .keeper,#ovBody ul.build,#ovBody .bkhead,#ovBody h3:not(:has(+ .fi)):not(.kinfo h3),#ovBody .eyebrow,#ovBody .fhead,#ovBody>h1,#ovBody .titlebox h1,#ovBody .khead,#ovBody .klegend,#ovBody .gloss,#ovBody .card small,#ovBody .kinfo dl,#ovBody blockquote{display:none!important}
#ovBody .slots{display:flex!important;flex-direction:column;gap:6px}
#ovBody .card span,#ovBody .fi.row>span,#ovBody .fi:not(.slot)>span{display:-webkit-box!important;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#ovBody .card.sel::after,#ovBody .fi.sel[data-act^="p:"]::after,#ovBody .fi.sel[data-act^="t:"]::after,#ovBody .fi.sel[data-act^="buy:"]::after{content:'Otro toque (o A) para elegir';display:block;margin-top:6px;font:500 11px 'Pixelify Sans',sans-serif;color:#f2c14e}
#ovBody .fi.mk.sel::after{content:none}
.dchoice{display:flex;flex-direction:column;gap:8px;padding:6px 4px}
.dchoice .said{font-size:15px;line-height:1.4;color:var(--ink,#efe6c8);opacity:.85;margin:0 0 6px;padding:8px 10px;border-left:3px solid var(--ember,#ff8a3c);background:rgba(255,255,255,.04)}
.dchoice .opt{display:block;width:100%;text-align:left;font:500 16px 'Pixelify Sans',sans-serif;padding:12px 14px;color:var(--ink,#efe6c8);background:#17121b;border:2px solid #4a3a30;border-radius:4px}
.dchoice .opt.sel{border-color:#f2c14e;color:#f2c14e}
#pHud .logo{font-family:'Jacquard 12',serif;font-size:40px;color:#ff8a3c;text-align:center;margin-top:30%}
</style>
</head>
<body>
<div id="panelApp"><div id="pHud"><p class="logo">Alec, el sin dios</p></div><div id="overlay" class="layer" hidden><div id="ovBody"></div></div></div>
<script src="panel.js"></script>
</body>
</html>
'''
open(os.path.join(ROOT, 'panel.html'), 'w', encoding='utf-8').write(page)
print('panel.html montado')
