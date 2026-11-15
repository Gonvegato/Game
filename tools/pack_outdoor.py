#!/usr/bin/env python3
# Decorado grande de exteriores, por zona (Pixel Crawler de Anokolisa) → assets/outdoor.png + src/49_outdoor.js
# Uso: python3 -I tools/pack_outdoor.py
import json
from PIL import Image
L = 'assets/library/packs/'
CT = L + 'Pixel_Crawler_-_Cemetery_0.4/Environment/Props/Tree.png'; CG = L + 'Pixel_Crawler_-_Cemetery_0.4/Environment/Props/Graves.png'; CP = L + 'Pixel_Crawler_-_Cemetery_0.4/Environment/Props/Props.png'
DS = L + 'Pixel_Crawler_-_Desert/Assets/Props.png'; HD = L + 'Pixel_Crawler_-_Hideout_1.0/Assets/Tiles.png'; FF = L + 'Pixel_Crawler_-_Fairy_Forest_1.7/Assets/Props.png'; CV = L + 'Pixel_Crawler_-_Cave/Assets/Props.png'
P = {
  'pine_l': (CT, 160, 104, 46, 103), 'pine_m': (CT, 208, 144, 32, 64), 'pine_s': (CT, 240, 176, 16, 32),
  'dead_l': (CT, 160, 312, 46, 103), 'dead_m': (CT, 208, 352, 32, 64), 'dead_s': (CT, 240, 384, 16, 32),
  'grave1': (CG, 1, 10, 14, 22), 'grave2': (CG, 17, 6, 14, 26), 'grave3': (CG, 32, 11, 16, 21), 'grave4': (CG, 49, 13, 14, 19),
  'cross_big': (CG, 70, 11, 20, 53), 'cross_stat': (CG, 96, 4, 32, 60), 'cross2': (CG, 129, 8, 30, 56), 'graves_row': (CG, 0, 33, 48, 31),
  'angel1': (CG, 8, 200, 16, 34), 'angel2': (CG, 32, 201, 32, 33), 'reaper': (CG, 65, 192, 30, 43), 'tomb1': (CG, 37, 105, 22, 39), 'tomb2': (CG, 69, 105, 22, 39), 'tomb3': (CG, 4, 146, 24, 39),
  'coffin1': (CP, 118, 7, 20, 35), 'coffin2': (CP, 150, 7, 20, 35), 'olive': (CP, 64, 114, 78, 76),
  'tusk_l': (DS, 4, 178, 54, 71), 'tusk_m': (DS, 68, 176, 39, 48), 'tusk_s': (DS, 113, 178, 29, 46), 'deadtree': (DS, 0, 262, 64, 74), 'deadbush': (DS, 66, 256, 25, 29),
  'bedroll1': (HD, 278, 57, 20, 34), 'bedroll2': (HD, 310, 57, 20, 34), 'firering': (HD, 278, 166, 36, 36), 'tent': (HD, 352, 184, 48, 87), 'darkbush': (HD, 291, 245, 57, 42),
  'barrel_big': (HD, 182, 318, 52, 82), 'barrels': (HD, 240, 310, 32, 26), 'skullflag': (HD, 288, 336, 48, 59), 'cask': (HD, 247, 350, 34, 50), 'bags': (HD, 293, 97, 22, 15), 'shelf': (HD, 290, 119, 44, 41), 'ctable': (HD, 356, 133, 40, 40),
  'flower_l': (FF, 293, 0, 38, 46), 'flower_l2': (FF, 293, 48, 38, 48), 'flower_m': (FF, 338, 16, 28, 30), 'flower_m2': (FF, 369, 20, 27, 26), 'vine_l': (FF, 289, 97, 45, 62), 'vine_m': (FF, 341, 117, 22, 42), 'vine_s': (FF, 369, 129, 24, 31),
  'boulder1': (FF, 5, 224, 37, 32), 'boulder2': (FF, 50, 226, 43, 45), 'boulder3': (FF, 99, 226, 59, 44), 'mossy2': (FF, 50, 273, 43, 46), 'mossy3': (FF, 99, 273, 59, 45),
  'rune1': (FF, 212, 280, 42, 40), 'rune2': (FF, 179, 289, 28, 31), 'grey1': (FF, 212, 232, 42, 40), 'grey2': (FF, 179, 241, 28, 31), 'bush_g': (FF, 65, 16, 47, 32), 'bush_a': (FF, 65, 64, 47, 32),
  'mush_xl': (CV, 3, 3, 87, 88), 'mush_l': (CV, 196, 1, 53, 45), 'mush_tall': (CV, 162, 96, 60, 96), 'mush_m': (CV, 291, 3, 27, 28),
}
# ── Tierra de no-muertos (Free Undead Tileset de CraftPix): objetos sueltos. El paquete entero no va en el repositorio;
#    con la carpeta delante (python3 -I tools/pack_outdoor.py <carpeta Objects_separately>) se guardan los recortes usados en assets/library/extra/ ──
import sys, os
U = {'u_ribs': 'Bones_shadow1_10', 'u_bones1': 'Bones_shadow1_11', 'u_beast': 'Bones_shadow1_12', 'u_bones2': 'Bones_shadow1_6', 'u_ribs2': 'Bones_shadow1_9', 'u_log': 'Broken_tree_shadow1_1',
     'u_arm1': 'Dead_arm_shadow1_1', 'u_arm2': 'Dead_arm_shadow1_2', 'u_arm3': 'Dead_arm_shadow1_3', 'u_arm4': 'Dead_arm_shadow1_4', 'u_dtree1': 'Dead_tree_shadow1_1', 'u_dtree2': 'Dead_tree_shadow1_2', 'u_dtree3': 'Dead_tree_shadow1_3',
     'u_lich': 'Lich_shadow1', 'u_pile': 'Pile_sculls_shadow1', 'u_ruin1': 'Ruin_shadow1_1', 'u_ruin2': 'Ruin_shadow1_2', 'u_ruin3': 'Ruin_shadow1_3', 'u_ruin4': 'Ruin_shadow1_4', 'u_skull': 'Scull_door_shadow1',
     'u_thorn1': 'Thorn_plant_shadow1_1', 'u_thorn2': 'Thorn_plant_shadow1_2', 'u_tree1': 'Tree_shadow1_1', 'u_tree2': 'Tree_shadow1_2', 'u_tree3': 'Tree_shadow1_3'}
EX = 'assets/library/extra/'; os.makedirs(EX, exist_ok=True)
if len(sys.argv) > 1:
    for k, f in U.items():
        im = Image.open(os.path.join(sys.argv[1], f + '.png')).convert('RGBA'); im.crop(im.getbbox()).save(EX + k + '.png')
cache = {}; items = []
for k in U:
    if os.path.exists(EX + k + '.png'): items.append((k, Image.open(EX + k + '.png').convert('RGBA')))
for k, (f, x, y, w, h) in P.items():
    im = cache.setdefault(f, Image.open(f).convert('RGBA')).crop((x, y, x + w, y + h)); b = im.getbbox(); items.append((k, im.crop(b)))
items.sort(key=lambda t: -t[1].height)
W = 512; x = y = rowh = 0; meta = {}; place = []
for k, im in items:
    if x + im.width > W: x = 0; y += rowh + 1; rowh = 0
    place.append((im, x, y)); meta[k] = [x, y, im.width, im.height]; x += im.width + 1; rowh = max(rowh, im.height)
sheet = Image.new('RGBA', (W, y + rowh))
for im, px, py in place: sheet.alpha_composite(im, (px, py))
sheet.save('assets/outdoor.png', optimize=True)
open('src/49_outdoor.js', 'w').write('// Generado por tools/pack_outdoor.py (Pixel Crawler de Anokolisa). No editar a mano.\nconst OUTP = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print(sheet.size, len(meta))
