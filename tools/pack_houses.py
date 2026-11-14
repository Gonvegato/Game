#!/usr/bin/env python3
# Monta casas completas con las piezas de edificio del Pixel Crawler Free Pack (Anokolisa) → assets/houses.png + src/49_houses.js
# Uso: python3 -I tools/pack_houses.py
import json
from PIL import Image
B = 'assets/library/packs/Pixel_Crawler_-_Free_Pack_Exterior_0.1/Environment/Structures/Buildings/'
W = Image.open(B + 'Walls.png').convert('RGBA'); R = Image.open(B + 'Roofs.png').convert('RGBA'); P = Image.open(B + 'Props.png').convert('RGBA')
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
def ridge(im):
    a = im.load(); w, h = im.size
    for y in range(h):
        for x in range(w // 2 - 6, w // 2 + 6):
            if a[x, y][3] > 0: return (x, y)
ROOF = {'big_brown': cut(R, (0, 0, 128, 100)), 'big_teal': cut(R, (128, 0, 256, 100)), 'small_brown': R.crop((16, 76, 112, 180)), 'small_teal': R.crop((144, 76, 240, 180))}
for k in ('small_brown', 'small_teal'):
    im = ROOF[k]; a = im.load(); w, h = im.size
    seed = next((x, y) for y in range(12, h) for x in range(w // 2 - 3, w // 2 + 3) if a[x, y][3] > 0)
    ROOF[k] = keep_connected(im, seed)
STRIP = {'log': (0, 184), 'plank': (96, 184), 'vplank': (192, 184), 'timber': (288, 184), 'plaster': (384, 184), 'brick': (480, 184)}
def strip(name, w):
    x0, y0 = STRIP[name]; s = cut(W, (x0, y0, x0 + 96, 244)); out = Image.new('RGBA', (w, s.height))
    for x in range(0, w, s.width): out.paste(s, (x, 0))
    return out
DOOR = {'arch': cut(P, (128, 20, 160, 66)), 'plain': cut(P, (96, 20, 128, 66))}
WIN = cut(P, (96, 62, 128, 98))
def house(roof, wall, door, gable, wins):
    rf = ROOF[roof]; w = rf.width; ws = strip(wall, w); gs = strip(gable, w)
    H = rf.height + ws.height - 12; out = Image.new('RGBA', (w, H))
    wy = rf.height - 12
    out.alpha_composite(ws, (0, wy))
    # hastial: lo que queda entre los dos faldones, relleno con tablas y una sombra bajo el alero
    a = rf.load(); g = Image.new('RGBA', (w, rf.height)); gp = g.load(); gsp = gs.load()
    for y in range(rf.height):
        xs = [x for x in range(w) if a[x, y][3] > 0]
        if len(xs) < 2: continue
        l, r = xs[0], xs[-1]
        for x in range(l, r + 1):
            if a[x, y][3] == 0: gp[x, y] = gsp[x % gs.width, (y + 7) % gs.height]
    out.alpha_composite(g, (0, 0)); out.alpha_composite(rf, (0, 0))
    for wx in wins: out.alpha_composite(WIN, (wx, wy + 6))
    d = DOOR[door]; out.alpha_composite(d, ((w - d.width) // 2, H - d.height))
    for x in range(w):   # sombra del alero sobre la pared
        for y in range(wy, wy + 3):
            r_, g_, b_, al = out.getpixel((x, y))
            if al: out.putpixel((x, y), (int(r_ * .7), int(g_ * .7), int(b_ * .7), al))
    return out
SPEC = [('big_brown', 'timber', 'arch', 'vplank', [10, 96]), ('big_teal', 'plaster', 'plain', 'plank', [10, 96]), ('small_brown', 'log', 'plain', 'vplank', [4]), ('small_teal', 'brick', 'arch', 'plank', [70]), ('big_brown', 'brick', 'plain', 'plank', [14, 92]), ('small_brown', 'timber', 'arch', 'vplank', [4])]
ims = [house(*s) for s in SPEC]
x = 0; meta = []; Wt = sum(i.width + 2 for i in ims); Ht = max(i.height for i in ims); sheet = Image.new('RGBA', (Wt, Ht))
for im in ims: sheet.alpha_composite(im, (x, 0)); meta.append([x, 0, im.width, im.height]); x += im.width + 2
sheet.save('assets/houses.png', optimize=True)
open('src/49_houses.js', 'w').write('// Generado por tools/pack_houses.py con piezas del Pixel Crawler Free Pack (Anokolisa). No editar a mano.\n// [x, y, ancho, alto] de cada casa en assets/houses.png; las 0, 1 y 4 son grandes (128 px), las demás pequeñas (96 px)\nconst HOUSES = ' + json.dumps(meta) + ';\n')
print(meta)
