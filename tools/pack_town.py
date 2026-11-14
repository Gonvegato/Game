#!/usr/bin/env python3
# Accesorios de la plaza tomados del Pixel Crawler Free Pack (Anokolisa) → assets/town.png + src/49_town.js
# Uso: python3 -I tools/pack_town.py
import json
from PIL import Image
E = 'assets/library/packs/Pixel_Crawler_-_Free_Pack_Exterior_0.1/Environment/'
PIECES = {
  'anvil': ('Structures/Stations/Anvil/Anvil.png', (80, 36, 79, 56)),
  'furnace': ('Structures/Stations/Furnace/Furnace.png', (54, 71, 36, 57)),
  'workbench': ('Structures/Stations/Workbench/Workbench.png', (103, 64, 73, 48)),
  'scarecrow': ('Props/Static/Farm.png', (244, 33, 24, 47)),
  'hay': ('Props/Static/Farm.png', (366, 79, 22, 20)),
  'veg1': ('Props/Static/Farm.png', (128, 16, 16, 16)), 'veg2': ('Props/Static/Farm.png', (128, 48, 16, 16)),
  'veg3': ('Props/Static/Farm.png', (128, 112, 16, 16)), 'veg4': ('Props/Static/Farm.png', (128, 208, 16, 16)),
  'bush1': ('Props/Static/Vegetation.png', (2, 5, 29, 27)), 'bush2': ('Props/Static/Vegetation.png', (198, 6, 35, 33)),
  'bush3': ('Props/Static/Vegetation.png', (2, 99, 43, 43)), 'shrub': ('Props/Static/Vegetation.png', (3, 32, 42, 64)),
  'bush4': ('Props/Static/Vegetation.png', (50, 5, 29, 27)), 'shrub2': ('Props/Static/Vegetation.png', (51, 32, 42, 64)),
  'table': ('Structures/Buildings/Props.png', (80, 132, 64, 24)), 'bench': ('Structures/Buildings/Props.png', (83, 160, 58, 32)),
  'bench_s': ('Structures/Buildings/Props.png', (17, 132, 30, 12)), 'fence': ('Structures/Buildings/Props.png', (6, 176, 68, 80)),
  'flower1': ('Props/Static/Vegetation.png', (64, 144, 16, 16)), 'flower2': ('Props/Static/Vegetation.png', (64, 187, 16, 21)),
  'stone_floor': ('Tilesets/Floors_Tiles.png', (256, 0, 64, 80)),
}
ims = {}
for k, (f, (x, y, w, h)) in PIECES.items(): ims[k] = Image.open(E + f).convert('RGBA').crop((x, y, x + w, y + h))
Wt = 512; x = y = rowh = 0; meta = {}; place = []
for k, im in ims.items():
    if x + im.width > Wt: x = 0; y += rowh + 1; rowh = 0
    place.append((k, x, y)); meta[k] = [x, y, im.width, im.height]; x += im.width + 1; rowh = max(rowh, im.height)
sheet = Image.new('RGBA', (Wt, y + rowh))
for k, px, py in place: sheet.alpha_composite(ims[k], (px, py))
sheet.save('assets/town.png', optimize=True)
open('src/49_town.js', 'w').write('// Generado por tools/pack_town.py con piezas del Pixel Crawler Free Pack (Anokolisa). No editar a mano.\nconst TOWN = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(sheet.size, len(meta))
