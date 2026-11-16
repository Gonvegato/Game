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
#panelApp #ovBody{width:100%!important;max-width:none!important;margin:0 auto}
#pHud{position:absolute;inset:0;overflow:auto;padding:10px 12px;box-sizing:border-box;color:var(--ink,#efe6c8);font-family:'Pixelify Sans',sans-serif}
#pHud .dh{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:baseline;margin:0 0 8px}
#pHud .dh b{font-size:15px}#pHud .dh .life{color:#e0524a}#pHud .dh .coin{color:#f2c14e}
#pHud h2{font-size:14px;margin:8px 0 6px;color:var(--ember,#ff8a3c)}
#pHud .where{opacity:.75;font-size:12px;margin:0 0 6px}
#panelApp .kworld{min-width:0}
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
