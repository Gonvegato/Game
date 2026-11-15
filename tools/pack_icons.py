#!/usr/bin/env python3
# Un icono para cada pieza de los guanteletes y cada técnica, sacado de «Raven Fantasy Icons» (Clockwork Raven Studios).
# El paquete no va en el repositorio; solo la hoja montada. Uso: python3 -I tools/pack_icons.py <ruta a Full Spritesheet/32x32.png>
#   → assets/icons.png y src/49_icons.js
# Reparto: Gema = gemas · Dedos = anillos y colgantes · Brazal = guanteletes · Palma = formas de conjuro · Brasa = fuego.
# Las técnicas toman iconos de habilidad del color más parecido al de su deidad. Dentro de cada grupo no se repite ninguno.
import sys, re, json, colorsys
from PIL import Image
SRC = Image.open(sys.argv[1]).convert('RGBA')
def cell(r, c): return SRC.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32))
def hue(im):
    px = [p for p in im.getdata() if p[3] > 200 and max(p[:3]) - min(p[:3]) > 40]
    if len(px) < 12: return None
    r, g, b = [sum(p[i] for p in px) / len(px) / 255 for i in range(3)]
    h, s, v = colorsys.rgb_to_hsv(r, g, b); return h * 360 if s > 0.12 else None
def hexhue(hx):
    n = int(hx.lstrip('#')[:6], 16); h, s, v = colorsys.rgb_to_hsv((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255); return h * 360 if s > 0.15 else None
def dist(a, b): return 180 if a is None or b is None else min(abs(a - b), 360 - abs(a - b))
def pool(spec): return [cell(r, c) for r, cs in spec for c in cs if cell(r, c).getbbox()]
R16 = range(16)
gods = dict(re.findall(r"^  (\w+): \{ title: .*?color: '(#[0-9a-fA-F]{6})'", open('src/11_gods.js').read(), re.M))
parts = re.findall(r"\{ id: '(\w+)',\s+slot: '(\w+)',.*?(?:theme: '(\w+)')?\s*\},?\s*$", open('src/12_weapon_tree.js').read(), re.M)
g = open('src/11_gods.js').read()
pieces = re.findall(r"\{ id: '(\w+)',\s+god: '(\w+)',\s+slot: '\w+'", g); techs = re.findall(r"\{ id: '(\w+)',\s+god: '(\w+)',\s+rar: \d", g)
POOLS = {
    'mag': pool([(132, R16), (133, R16), (10, R16)]),
    'action': pool([(115, range(2, 12)), (128, range(12, 16)), (136, R16)]),
    'stock': pool([(128, range(6, 12)), (135, range(7, 13)), (41, [6])]),
    'barrel': pool([(r, R16) for r in (46, 47, 48, 49, 50, 51)]),
    'chamber': pool([(61, R16), (62, R16)]),
}
def tint(im, deg):   # la misma forma en otro color, para que 12 guanteletes den para 24 brazales
    out = im.copy(); px = out.load()
    for y in range(32):
        for x in range(32):
            r, gg, b, a = px[x, y]
            if a:
                h, s, v = colorsys.rgb_to_hsv(r / 255, gg / 255, b / 255); h = (h + deg / 360) % 1; s = min(1, s + 0.35) if deg else s
                r2, g2, b2 = colorsys.hsv_to_rgb(h, s, v); px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return out
POOLS['stock'] = POOLS['stock'] + [tint(i, 30) for i in POOLS['stock']] + [tint(i, 200) for i in POOLS['stock']]
SKILL = pool([(r, R16) for r in list(range(52, 67)) + list(range(70, 90))])
icons, index = [], {}
def assign(items, pl):   # items: [(id, color o None)] → primero los que tienen color, al más parecido que quede libre
    free = list(range(len(pl))); hs = [hue(i) for i in pl]
    for iid, col in sorted(items, key=lambda t: t[1] is None):
        if col is not None: k = min(free, key=lambda j: dist(hs[j], hexhue(col)))
        else: k = free[0]
        free.remove(k); index[iid] = len(icons); icons.append(pl[k])
for slot, pl in POOLS.items():
    assign([(pid, gods.get(th)) for pid, s, th in parts if s == slot], pl)
assign([(i, gods[gd]) for i, gd in pieces + techs], SKILL)
W = 16; sheet = Image.new('RGBA', (W * 32, (len(icons) + W - 1) // W * 32), (0, 0, 0, 0))
for i, im in enumerate(icons): sheet.paste(im, (i % W * 32, i // W * 32))
sheet.save('assets/icons.png', optimize=True)
open('src/49_icons.js', 'w').write('// Generado por tools/pack_icons.py («Raven Fantasy Icons», Clockwork Raven Studios). Posición de cada icono en assets/icons.png, 16 por fila.\nconst PIC = ' + json.dumps(index, separators=(',', ':')) + ';\n')
print(len(parts), 'piezas', len(pieces), 'técnicas de ranura', len(techs), 'técnicas sueltas →', len(icons), 'iconos', sheet.size)
