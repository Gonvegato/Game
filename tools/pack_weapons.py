#!/usr/bin/env python3
# Armas en la mano de Alec, del Pixel Crawler (Anokolisa), ya reducidas → assets/weapons.png + src/49_weapons.js
# Cada arma apunta a la derecha; g = punto por donde la sujeta.
import json
from PIL import Image
L = 'assets/library/packs/'
def crop(f, b):
    c = Image.open(L + f).convert('RGBA').crop((b[0], b[1], b[0] + b[2], b[1] + b[3])); return c.crop(c.getbbox())
def scale(im, s): return im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.NEAREST)
CASTLE = 'Pixel_Crawler_-_Castle_Environment_0.3/Weapons/Weapons.png'
BOWS = {'fire': 'Pixel_Crawler_-_Forge_1.2/Weapons/Fire Weapons/Fire Weapons.png', 'poison': 'Pixel_Crawler_-_Sewer/Weapons/Poison Weapons/Poison Weapons.png',
        'cursed': 'Pixel_Crawler_-_Cemetery_0.4/Weapons/Cursed Weapons.png', 'elf': 'Pixel_Crawler_-_Fairy_Forest_1.7/Weapon/Elf_Weapon.png', 'wood': 'Pixel_Crawler_-_Free_Pack_Exterior_0.1/Weapons/Wood/Wood.png'}
items = {'cb_light': (scale(crop(CASTLE, (165, 5, 37, 25)), 0.6), 0.3), 'cb_heavy': (scale(crop(CASTLE, (165, 35, 37, 28)), 0.7), 0.3)}
for mat, f in BOWS.items():
    for k in range(3): items['bow_%s_%d' % (mat, k)] = (scale(crop(f, (48 + 16 * k, 48, 16, 32)), 0.65), 0.55)
W = 256; x = y = rowh = 0; meta = {}; place = []
for k, (im, gx) in items.items():
    if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
    place.append((im, x, y)); meta[k] = [x, y, im.width, im.height, round(im.width * gx), im.height // 2]; x += im.width + 1; rowh = max(rowh, im.height)
sheet = Image.new('RGBA', (W, y + rowh))
for im, px, py in place: sheet.alpha_composite(im, (px, py))
sheet.save('assets/weapons.png', optimize=True)
open('src/49_weapons.js', 'w').write('// Generado por tools/pack_weapons.py (Pixel Crawler de Anokolisa). No editar a mano.\n// [x, y, ancho, alto, agarre x, agarre y]\nconst WEAP = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(sheet.size, len(meta))
