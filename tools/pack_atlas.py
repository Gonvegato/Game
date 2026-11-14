#!/usr/bin/env python3
# Empaqueta en una sola imagen los fotogramas que el juego usa del CHARACTER MEGAPACK (overboy, itch.io).
# Uso: python3 -I tools/pack_atlas.py   → assets/chars.png y src/48_atlas.js
# Lee de la biblioteca sin pérdida (assets/library/megapack.png + .json), que guarda el paquete entero; ya no hace falta el zip.
import sys, os, json
from PIL import Image
LIB = json.load(open('assets/library/megapack.json'))['chars']; LIBIMG = Image.open('assets/library/megapack.png').convert('RGBA')
# clave del juego → (carpeta, {animación del juego: (sufijo de carpeta, máx. fotogramas, fps)})
CAST = {
  'hero1': ('Knight_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Move', 10, 14), 'dash': ('Dash', 8, 20)}),
  'hero2': ('Knight_LVL2', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 14), 'dash': ('Dash', 10, 20)}),
  'hero3': ('Knight_LVL3', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 14), 'dash': ('Dash', 2, 10)}),
  'hero4': ('Knight_LVL4', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 14), 'dash': ('Dash', 2, 10)}),
  'stalker': ('Goblin_Regular_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 10, 12), 'atk': ('ATK_Full', 10, 18)}),
  'runner': ('Mimic_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Move', 14, 20), 'atk': ('Dash_Full', 14, 24)}),
  'brute': ('Orc_Barbare_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 5, 7), 'atk': ('ATK_Full', 12, 14)}),
  'mage': ('Sorcerer_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Begin', 10, 14)}),
  'bomber': ('Goblin_Barrel_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 10, 12), 'atk': ('ATK_Full', 10, 14)}),
  'leaper': ('FrogMonster', {'idle': ('Idle', 2, 3), 'move': ('Idle', 2, 4), 'atk': ('Jump', 14, 20)}),
  'sniper': ('Orc_Archer_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 6, 10), 'atk': ('Prepare', 11, 12)}),
  'shaman': ('Mushroom', {'idle': ('Idle', 2, 3), 'move': ('Idle', 2, 4), 'atk': ('Spell_Loop', 14, 14)}),
  'lancer': ('RhinoMonster_01_Regular', {'idle': ('Idle', 1, 1), 'move': ('Move', 8, 12), 'atk': ('Charge_RunLoop', 6, 16)}),
  'bat': ('Vampire_Archer_01', {'idle': ('Idle', 2, 3), 'move': ('Move', 10, 16), 'atk': ('ATK', 8, 16)}),
  'champ': ('MonsterSlasher_01', {'idle': ('Idle', 2, 3), 'move': ('Move', 10, 14), 'atk': ('ATK2', 8, 16)}),
  'guardian': ('Dummy_LVL4', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 14, 14)}),
  'matriarch': ('FrogBoss', {'idle': ('Idle', 2, 3), 'move': ('Move_Full', 11, 12), 'atk': ('Burp', 4, 8)}),
  'colossus': ('Mimic_LVL4', {'idle': ('Idle', 8, 8), 'move': ('Move', 8, 10), 'atk': ('Dash_Full', 14, 14)}),
  'nameless': ('Sorcerer_LVL4', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 10, 12)}),
  'firstfist': ('GameMaster', {'idle': ('Idle', 12, 10), 'move': ('Idle', 12, 10), 'atk': ('ATK', 16, 14)}),
}
def frames_of(folder, suffix):
    A = LIB[folder]['a']; a = A[suffix] if suffix in A else A[[n for n in A if n.endswith('_' + suffix)][0]]
    out = []
    for x, y in a['f']:
        im = Image.new('RGBA', tuple(a['size']), (0, 0, 0, 0)); im.paste(LIBIMG.crop((x, y, x + a['w'], y + a['h'])), tuple(a['off'])); out.append(im)
    return out
items, meta = [], {}
for key, (folder, anims) in CAST.items():
    loaded = {}
    for a, (suffix, maxn, fps) in anims.items():
        fs = frames_of(folder, suffix)
        step = max(1, -(-len(fs) // maxn))          # remuestrea las animaciones largas
        loaded[a] = (fs[::step], fps)
    size = loaded['idle'][0][0].size
    # recorte común a todos los fotogramas del personaje (los que tengan otro tamaño de lienzo se alinean por abajo-centro)
    def norm(im):
        if im.size == size: return im
        out = Image.new('RGBA', size, (0, 0, 0, 0)); out.alpha_composite(im.crop((max(0, (im.width - size[0]) // 2), max(0, im.height - size[1]), max(0, (im.width - size[0]) // 2) + min(size[0], im.width), im.height)), ((size[0] - min(size[0], im.width)) // 2, size[1] - min(size[1], im.height))); return out
    for a in loaded: loaded[a] = ([norm(im) for im in loaded[a][0]], loaded[a][1])
    bb = None
    for a in loaded:
        for im in loaded[a][0]:
            b = im.getbbox()
            if b: bb = b if not bb else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    ib = None
    for im in loaded['idle'][0] + loaded['move'][0]:
        b = im.getbbox()
        if b: ib = b if not ib else (min(ib[0], b[0]), min(ib[1], b[1]), max(ib[2], b[2]), max(ib[3], b[3]))
    idle_b = loaded['idle'][0][0].getbbox()
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    meta[key] = {'w': w, 'h': h, 'ax': round((idle_b[0] + idle_b[2]) / 2 - bb[0]), 'gy': ib[3] - bb[1], 'bw': idle_b[2] - idle_b[0], 'bh': idle_b[3] - idle_b[1], 'a': {}}
    for a in loaded:
        meta[key]['a'][a] = {'fps': loaded[a][1], 'f': []}
        for im in loaded[a][0]: items.append((key, a, im.crop(bb)))
# empaquetado por estantes
W = 2048; x = y = rowh = 0; pos = []
for key, a, im in items:
    if x + im.width + 1 > W: x = 0; y += rowh + 1; rowh = 0
    pos.append((x, y)); meta[key]['a'][a]['f'].append([x, y]); x += im.width + 1; rowh = max(rowh, im.height)
H = y + rowh
atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for (key, a, im), (px, py) in zip(items, pos): atlas.alpha_composite(im, (px, py))
os.makedirs('assets', exist_ok=True); atlas.save('assets/chars.png', optimize=True)
open('src/48_atlas.js', 'w').write('// Generado por tools/pack_atlas.py a partir del CHARACTER MEGAPACK de overboy (itch.io). No editar a mano.\n// w, h: tamaño del recorte · ax: centro del cuerpo · gy: línea del suelo · a: animaciones (fps y posición de cada fotograma)\nconst ATLAS = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print('atlas', atlas.size, len(items), 'fotogramas', os.path.getsize('assets/chars.png') // 1024, 'KB')
for k, m in meta.items(): print(k.ljust(10), 'recorte %dx%d cuerpo %dx%d' % (m['w'], m['h'], m['bw'], m['bh']), {a: len(v['f']) for a, v in m['a'].items()})
