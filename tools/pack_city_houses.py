#!/usr/bin/env python3
"""Casas de las ciudades: muchas combinaciones montadas con las piezas de edificio del Pixel Crawler Free Pack (Anokolisa).

Cada casa junta un tejado (grande de 128 px o pequeño de 96 px, en siete colores: los dos del paquete y cinco teñidos),
una pared (troncos, tablas, tablas en vertical, entramado, enlucido o ladrillo), una puerta, ventanas y a veces chimenea.
Así cada reino puede tener su propio estilo de ciudad eligiendo colores de tejado y paredes (CITY_STYLE en src/35_rooms.js).
Además monta los edificios con oficio: la forja (ladrillo, puerta de piedra, chimenea y letrero con el yunque) y la posada
(entramado, puerta abierta y letrero con la jarra). Los iconos de los letreros y de las flechas de la ciudad salen de
assets/library/raven_places.png (Raven Fantasy Icons, Clockwork Raven Studios).
Salida: assets/cityhouses.png y src/49_cityhouses.js.  Uso: python3 -I tools/pack_city_houses.py
"""
import json, colorsys, random
from PIL import Image

B = 'assets/library/packs/Pixel_Crawler_-_Free_Pack_Exterior_0.1/Environment/Structures/Buildings/'
W = Image.open(B + 'Walls.png').convert('RGBA'); R = Image.open(B + 'Roofs.png').convert('RGBA'); P = Image.open(B + 'Props.png').convert('RGBA')
ICONS = Image.open('assets/library/raven_places.png').convert('RGBA')
ICON = {k: ICONS.crop((i * 16, 0, i * 16 + 16, 16)) for i, k in enumerate(['forge', 'inn', 'board', 'gym', 'king'])}

def cut(im, box): c = im.crop(box); b = c.getbbox(); return c.crop(b)
def keep_connected(im, seed):   # solo los píxeles unidos a la cumbrera: fuera restos de piezas vecinas
    a = im.load(); w, h = im.size; seen = {seed}; st = [seed]
    while st:
        x, y = st.pop()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                n = (x + dx, y + dy)
                if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and a[n][3] > 0: seen.add(n); st.append(n)
    out = Image.new('RGBA', im.size)
    for q in seen: out.putpixel(q, a[q])
    return out.crop(out.getbbox())

ROOF = {'big_brown': cut(R, (0, 0, 128, 100)), 'big_teal': cut(R, (128, 0, 256, 100)), 'small_brown': R.crop((16, 76, 112, 180)), 'small_teal': R.crop((144, 76, 240, 180))}
for k in ('small_brown', 'small_teal'):
    im = ROOF[k]; a = im.load(); w, h = im.size
    seed = next((x, y) for y in range(12, h) for x in range(w // 2 - 3, w // 2 + 3) if a[x, y][3] > 0)
    ROOF[k] = keep_connected(im, seed)

def tint(im, hue=None, sat=1.0, val=1.0):   # tiñe un tejado: cambia el tono y ajusta saturación y brillo, sin tocar los contornos oscuros
    out = im.copy(); px = out.load(); w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not a: continue
            hh, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if v < 0.16: continue
            if hue is not None: hh = hue / 360
            s = min(1, s * sat); v = min(1, v * val)
            r2, g2, b2 = colorsys.hsv_to_rgb(hh, s, v); px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return out
# color de tejado → (tejado de partida, tinte)
COLORS = {'brown': ('brown', None), 'red': ('brown', (6, 1.25, 1.0)), 'ochre': ('brown', (40, 1.0, 1.12)), 'slate': ('brown', (215, 0.28, 0.95)),
          'plum': ('brown', (330, 0.75, 0.9)), 'teal': ('teal', None), 'blue': ('teal', (212, 0.9, 0.95)), 'moss': ('teal', (95, 0.75, 0.9))}
def roof(size, color):
    base, t = COLORS[color]; im = ROOF[size + '_' + base]
    return tint(im, *t) if t else im

STRIP = {'log': (0, 184), 'plank': (96, 184), 'vplank': (192, 184), 'timber': (288, 184), 'plaster': (384, 184), 'brick': (480, 184)}
def strip(name, w):
    x0, y0 = STRIP[name]; s = cut(W, (x0, y0, x0 + 96, 244)); out = Image.new('RGBA', (w, s.height))
    for x in range(0, w, s.width): out.paste(s, (x, 0))
    return out
DOOR = {'plank': cut(P, (100, 28, 124, 64)), 'banded': cut(P, (132, 24, 158, 64)), 'iron': cut(P, (164, 22, 190, 64)),
        'open': cut(P, (32, 18, 64, 64)), 'frame': cut(P, (0, 20, 32, 64)), 'stone': cut(P, (64, 18, 96, 64))}
WIN = {'arch': cut(P, (96, 62, 128, 98)), 'archs': cut(P, (66, 62, 94, 98)), 'shut': cut(P, (128, 62, 160, 98)), 'shut2': cut(P, (160, 62, 192, 98)),
       'closed': cut(P, (194, 62, 222, 98)), 'tall': cut(P, (34, 94, 62, 130)), 'tallc': cut(P, (66, 94, 94, 130)), 'four': cut(P, (130, 96, 158, 126)),
       'small': cut(P, (30, 78, 48, 98))}
CHIMNEY = cut(P, (2, 70, 30, 108))

def sign(icon):   # letrero colgado: tablero de madera con el icono del oficio
    s = Image.new('RGBA', (22, 26)); px = s.load()
    for y in range(0, 5):
        px[3, y] = px[18, y] = (40, 26, 22, 255)
    for y in range(5, 26):
        for x in range(0, 22):
            edge = x in (0, 21) or y in (5, 25)
            px[x, y] = (34, 22, 18, 255) if edge else ((122, 86, 56, 255) if y > 7 else (150, 110, 72, 255))
    s.alpha_composite(icon, (3, 8))
    return s

def house(size, color, wall, door, gable, wins, chimney=False, signicon=None):
    rf = roof(size, color); w = rf.width; ws = strip(wall, w); gs = strip(gable, w)
    H = rf.height + ws.height - 12; out = Image.new('RGBA', (w, H))
    wy = rf.height - 12
    out.alpha_composite(ws, (0, wy))
    a = rf.load(); g = Image.new('RGBA', (w, rf.height)); gp = g.load(); gsp = gs.load()
    for y in range(rf.height):   # hastial: lo que queda entre los dos faldones, relleno con tablas
        xs = [x for x in range(w) if a[x, y][3] > 0]
        if len(xs) < 2: continue
        l, r = xs[0], xs[-1]
        for x in range(l, r + 1):
            if a[x, y][3] == 0: gp[x, y] = gsp[x % gs.width, (y + 7) % gs.height]
    out.alpha_composite(g, (0, 0))
    if chimney: out.alpha_composite(CHIMNEY, (int(w * 0.68), max(0, int(rf.height * 0.18))))
    out.alpha_composite(rf, (0, 0))
    if chimney:   # la boca de la chimenea asoma por encima del tejado
        top = CHIMNEY.crop((0, 0, CHIMNEY.width, 12)); out.alpha_composite(top, (int(w * 0.68), max(0, int(rf.height * 0.18))))
    for wn, wx in wins:
        wi = WIN[wn]; out.alpha_composite(wi, (wx, wy + 6 + (36 - wi.height) // 2))
    d = DOOR[door]; out.alpha_composite(d, ((w - d.width) // 2, H - d.height))
    for x in range(w):   # sombra del alero sobre la pared
        for y in range(wy, wy + 3):
            r_, g_, b_, al = out.getpixel((x, y))
            if al: out.putpixel((x, y), (int(r_ * .7), int(g_ * .7), int(b_ * .7), al))
    if signicon: s = sign(ICON[signicon]); out.alpha_composite(s, ((w + d.width) // 2 + 4, wy + 8))
    return out

rnd = random.Random(1337)
WALLS = list(STRIP); WINS = ['arch', 'archs', 'shut', 'shut2', 'closed', 'tall', 'tallc', 'four', 'small']; DOORS = ['plank', 'banded', 'iron', 'plank', 'banded']
meta = []; ims = []
for color in COLORS:
    for size in ('big', 'small'):
        for k in range(3):   # tres casas distintas por color y tamaño
            wall = WALLS[(k * 2 + len(meta)) % len(WALLS)]; gable = rnd.choice(['plank', 'vplank']); wn = rnd.choice(WINS); door = rnd.choice(DOORS)
            if size == 'big': wins = [(wn, 10), (wn, 128 - 10 - WIN[wn].width)]
            else: wins = [(wn, 4 if rnd.random() < 0.5 else 96 - 4 - WIN[wn].width)]
            ims.append(house(size, color, wall, door, gable, wins, chimney=rnd.random() < 0.4))
            meta.append({'size': size, 'roof': color, 'wall': wall})
# edificios con oficio
ims.append(house('big', 'red', 'brick', 'stone', 'vplank', [('small', 14), ('small', 128 - 14 - WIN['small'].width)], chimney=True, signicon='forge')); meta.append({'size': 'big', 'roof': 'red', 'wall': 'brick', 'trade': 'forge'})
ims.append(house('big', 'ochre', 'timber', 'open', 'plank', [('shut', 8), ('shut', 128 - 8 - WIN['shut'].width)], chimney=True, signicon='inn')); meta.append({'size': 'big', 'roof': 'ochre', 'wall': 'timber', 'trade': 'inn'})

# hoja: filas de hasta 1024 px
x = y = rowh = 0; WMAX = 1024; pos = []
for im in ims:
    if x + im.width > WMAX: x = 0; y += rowh + 2; rowh = 0
    pos.append((x, y)); x += im.width + 2; rowh = max(rowh, im.height)
sheet = Image.new('RGBA', (WMAX, y + rowh))
for im, (px, py) in zip(ims, pos): sheet.alpha_composite(im, (px, py))
sheet.alpha_composite(ICONS, (WMAX - ICONS.width, sheet.height - 16))   # los iconos de las flechas, en la esquina de abajo
sheet.save('assets/cityhouses.png', optimize=True)
for m, im, (px, py) in zip(meta, ims, pos): m['r'] = [px, py, im.width, im.height]
icons = {k: [WMAX - ICONS.width + i * 16, sheet.height - 16, 16, 16] for i, k in enumerate(['forge', 'inn', 'board', 'gym', 'king'])}
open('src/49_cityhouses.js', 'w').write('// Generado por tools/pack_city_houses.py con piezas del Pixel Crawler Free Pack (Anokolisa) e iconos de Raven Fantasy Icons. No editar a mano.\n'
    '// Casas de las ciudades en assets/cityhouses.png: r = [x, y, ancho, alto]; size big (128 px) o small (96 px); roof: color del tejado; wall: pared; trade: forja o posada.\n'
    'const CITY_HOUSES = ' + json.dumps(meta, separators=(',', ':')) + ';\n'
    '// Iconos de los sitios de la ciudad (flechas en el borde de la pantalla)\n'
    'const PLACE_ICON = ' + json.dumps(icons, separators=(',', ':')) + ';\n')
print(len(ims), 'casas', sheet.size)
