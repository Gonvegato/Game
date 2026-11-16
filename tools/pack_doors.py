#!/usr/bin/env python3
"""Las puertas de las salas: el arco de piedra del Pixel Crawler Free Pack (Anokolisa), con el hueco vaciado para que se vea
detrás la luz de lo que hay en la sala siguiente (la pinta el juego, 44_calm.js). Salida: assets/doors.png y src/49_doors.js.
Uso: python3 -I tools/pack_doors.py"""
import json
from PIL import Image
P = Image.open('assets/library/packs/Pixel_Crawler_-_Free_Pack_Exterior_0.1/Environment/Structures/Buildings/Props.png').convert('RGBA')
def cut(box): c = P.crop(box); return c.crop(c.getbbox())
arch = cut((64, 18, 96, 64))
# más grande sin emborronar: se repiten columnas del centro (más ancho) y filas del pilar (más alto), como quien añade sillares
def widen(im, at, n):
    w, h = im.size; out = Image.new('RGBA', (w + n, h)); out.paste(im.crop((0, 0, at, h)), (0, 0))
    for i in range(n): out.paste(im.crop((at, 0, at + 1, h)), (at + i, 0))
    out.paste(im.crop((at, 0, w, h)), (at + n, 0)); return out
def taller(im, at, n, period):
    w, h = im.size; out = Image.new('RGBA', (w, h + n)); out.paste(im.crop((0, 0, w, at)), (0, 0))
    for i in range(n): out.paste(im.crop((0, at + i % period, w, at + i % period + 1)), (0, at + i))
    out.paste(im.crop((0, at, w, h)), (0, at + n)); return out
arch = widen(arch, arch.width // 2, 12)
arch = taller(arch, 18, 18, 9)
# el hueco: los píxeles casi negros del interior pasan a transparentes (el juego pone ahí la oscuridad y la luz)
px = arch.load(); w, h = arch.size; hole = []
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        if a and r < 28 and g < 28 and b < 34 and 3 < x < w - 4 and y > 3: px[x, y] = (0, 0, 0, 0); hole.append((x, y))
sheet = Image.new('RGBA', (w, h)); sheet.alpha_composite(arch)
sheet.save('assets/doors.png')
xs = [p[0] for p in hole]; ys = [p[1] for p in hole]
meta = {'arch': [0, 0, w, h], 'hole': [min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1]}
open('src/49_doors.js', 'w').write('// Generado por tools/pack_doors.py con el arco de piedra del Pixel Crawler Free Pack (Anokolisa). No editar a mano.\n// arch: [x, y, ancho, alto] en assets/doors.png; hole: el hueco del arco, relativo al arco\nconst DOOR_ART = ' + json.dumps(meta) + ';\n')
print(meta)
