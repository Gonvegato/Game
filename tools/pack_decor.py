#!/usr/bin/env python3
# Decorado de las mazmorras por zona (Pixel Crawler de Anokolisa y Ancient Ruins de Androx) → assets/decor.png + src/49_decor.js
# wall: junto a la base de un muro · floor: suelto por la sala · decal: manchas en el suelo
import json
from PIL import Image
L = 'assets/library/packs/'
SH = {'castle': L + 'Pixel_Crawler_-_Castle_Environment_0.3/Assets/Tiles.png', 'cave': L + 'Pixel_Crawler_-_Cave/Assets/Tiles.png', 'cprops': L + 'Pixel_Crawler_-_Cave/Assets/Props.png',
      'forge': L + 'Pixel_Crawler_-_Forge_1.2/Assets/Tiles.png', 'dung': L + 'Pixel_Crawler_-_Free_Pack_Exterior_0.1/Environment/Tilesets/Dungeon_Tiles.png',
      'dprops': L + 'Pixel_Crawler_-_Free_Pack_Exterior_0.1/Environment/Props/Static/Dungeon_Props.png', 'gprops': L + 'Pixel_Crawler_-_Cemetery_0.4/Environment/Props/Props.png',
      'graves': L + 'Pixel_Crawler_-_Cemetery_0.4/Environment/Props/Graves.png', 'ruins': L + 'AncientRuinsByAndrox/ruins.png', 'sprops': L + 'Pixel_Crawler_-_Sewer/Assets/Props.png', 'ff': L + 'Pixel_Crawler_-_Fairy_Forest_1.7/Assets/Props.png'}
Z = {
  1: {'solid': [('gprops', 118, 7, 20, 35), ('gprops', 150, 7, 20, 35), ('graves', 70, 11, 20, 53), ('castle', 279, 75, 18, 32), ('castle', 312, 74, 16, 33), ('castle', 342, 75, 20, 32), ('graves', 8, 200, 16, 34)],
      'wall': [('graves', 1, 10, 14, 22), ('graves', 17, 6, 14, 26), ('graves', 32, 11, 16, 21), ('graves', 49, 13, 14, 19), ('gprops', 118, 7, 20, 35), ('gprops', 150, 7, 20, 35), ('castle', 304, 219, 16, 21), ('castle', 321, 216, 14, 24), ('dprops', 67, 70, 10, 21), ('dprops', 99, 70, 10, 21)],
      'floor': [('gprops', 85, 85, 10, 9), ('gprops', 100, 86, 9, 6), ('gprops', 148, 84, 10, 8), ('gprops', 115, 99, 11, 9), ('cave', 209, 66, 13, 12)]},
  2: {'solid': [('cprops', 291, 3, 27, 28), ('cprops', 322, 2, 27, 28), ('cprops', 358, 4, 20, 26), ('cave', 240, 0, 13, 32), ('cave', 210, 16, 12, 32), ('ff', 338, 16, 28, 30), ('ff', 341, 117, 22, 42)],
      'wall': [('cprops', 291, 3, 27, 28), ('cprops', 322, 2, 27, 28), ('cprops', 358, 4, 20, 26), ('cave', 180, 164, 19, 25), ('cave', 214, 163, 23, 24), ('cave', 240, 0, 13, 32), ('cave', 210, 16, 12, 32), ('cprops', 196, 1, 53, 45)],
      'floor': [('cprops', 257, 64, 14, 16), ('cprops', 291, 68, 10, 11), ('cprops', 307, 68, 10, 11), ('cave', 209, 66, 13, 12), ('cave', 194, 67, 12, 8), ('cave', 194, 83, 11, 9)]},
  3: {'solid': [('ruins', 304, 144, 15, 48), ('ruins', 321, 160, 14, 32), ('cave', 240, 0, 13, 32), ('ff', 179, 289, 28, 31), ('ff', 179, 241, 28, 31), ('sprops', 32, 7, 32, 25)],
      'wall': [('ruins', 241, 145, 15, 15), ('ruins', 257, 145, 15, 15), ('ruins', 209, 145, 15, 15), ('ruins', 304, 144, 15, 48), ('ruins', 321, 160, 14, 32), ('cave', 240, 0, 13, 32), ('cave', 226, 32, 12, 16), ('sprops', 32, 7, 32, 25)],
      'floor': [('cave', 209, 66, 13, 12), ('cave', 194, 67, 12, 8), ('ruins', 227, 145, 12, 15), ('cave', 212, 85, 9, 7)]},
  4: {'solid': [('forge', 226, 164, 28, 44), ('forge', 226, 212, 28, 28), ('graves', 70, 11, 20, 53), ('forge', 112, 249, 16, 23), ('forge', 144, 249, 16, 23), ('castle', 279, 123, 18, 32)],
      'wall': [('forge', 112, 249, 16, 23), ('forge', 128, 249, 16, 23), ('forge', 144, 249, 16, 23), ('forge', 112, 282, 16, 22), ('forge', 128, 282, 16, 22), ('forge', 226, 164, 28, 44), ('dprops', 83, 70, 10, 21), ('graves', 70, 11, 20, 53)],
      'floor': [('gprops', 85, 85, 10, 9), ('gprops', 148, 84, 10, 8), ('forge', 212, 243, 8, 13), ('forge', 228, 247, 8, 13)]},
}
img = {k: Image.open(v).convert('RGBA') for k, v in SH.items()}
items = []
for z, cats in Z.items():
    for cat, lst in cats.items():
        for (s, x, y, w, h) in lst:
            c = img[s].crop((x, y, x + w, y + h)); b = c.getbbox(); items.append((z, cat, c.crop(b) if b else c))
W = 512; x = y = rowh = 0; meta = {str(z): {'wall': [], 'floor': [], 'decal': [], 'solid': []} for z in Z}; place = []
for z, cat, im in items:
    if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
    place.append((im, x, y)); meta[str(z)][cat].append([x, y, im.width, im.height]); x += im.width + 1; rowh = max(rowh, im.height)
sheet = Image.new('RGBA', (W, y + rowh))
for im, px, py in place: sheet.alpha_composite(im, (px, py))
sheet.save('assets/decor.png', optimize=True)
open('src/49_decor.js', 'w').write('// Generado por tools/pack_decor.py (Pixel Crawler de Anokolisa, Ancient Ruins de Androx). No editar a mano.\nconst DECOR = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(sheet.size, sum(len(v) for z in meta.values() for v in z.values()))
