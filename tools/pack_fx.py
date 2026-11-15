#!/usr/bin/env python3
# Empaqueta en assets/fx.png los efectos que el juego usa de dos paquetes del usuario:
#   · Super Pixel Effects Gigapack (Will Tice / unTied Games): llama, destello al lanzar e impacto.
#   · Effect and Bullet 16x16: el proyectil.
# Los paquetes originales NO van en el repositorio (su licencia prohíbe redistribuirlos sueltos); solo esta hoja ya montada.
# Uso: python3 -I tools/pack_fx.py <carpeta con los zip descomprimidos>   → assets/fx.png y src/49_fx.js
import sys, os, glob, json
from PIL import Image
SRC = sys.argv[1]
GIGA = glob.glob(os.path.join(SRC, '*', 'Super Pixel Effects Gigapack', 'PNG'))[0]
BUL = glob.glob(os.path.join(SRC, '*', 'Effect and Bullet 16x16'))[0]
COLORS = ['orange', 'yellow', 'green', 'blue', 'violet', 'red', 'white', 'black']
FALL = {'white': 'yellow', 'black': 'violet'}
BULSET = {'orange': 'Fire', 'yellow': 'Fire', 'red': 'Fire', 'white': 'Water', 'blue': 'Water', 'green': 'Green', 'violet': 'Purple', 'black': 'Purple'}
def giga(cat, name, col, crop=None, every=1, a=0, b=None):
    d = os.path.join(GIGA, cat, name, '%s_small_%s' % (name, col))
    if not os.path.isdir(d): d = os.path.join(GIGA, cat, name, '%s_small_%s' % (name, FALL[col]))
    fs = [Image.open(f).convert('RGBA') for f in sorted(glob.glob(d + '/*.png'))][a:b:every]
    return [f.crop(crop) if crop else f for f in fs]
def bolt(col):
    im = Image.open(os.path.join(BUL, '%s Effect and Bullet 16x16.png' % BULSET[col])).convert('RGBA')
    return [im.crop((x * 16, 0, x * 16 + 16, 16)) for x in range(24, 29)]
SETS = {
    'flame': lambda c: giga('Fire', 'fire_looping_001', c, (6, 0, 26, 30)),
    'hit': lambda c: giga('Impacts', 'symmetrical_impact_001', c),
    'cast': lambda c: giga('Magic Bursts', 'round_sparkle_burst_001', c, None, 2),
    'boom': lambda c: giga('Explosions', 'symmetrical_explosion_001', c),
    'bolt': bolt,
    # Estados sobre los enemigos: cada uno con su dibujo, para ver de un vistazo quién tiene qué
    'poison': lambda c: giga('Fantasy Spells', 'status_poison_001', c, None, 2),             # Veneno: burbujas
    'sleep': lambda c: giga('Fantasy Spells', 'status_sleep_001', c, None, 2),               # Dormido: zetas
    'spark': lambda c: giga('Fantasy Spells', 'status_sparkling_001', c, None, 2),           # Iluminado: destellos
    'skull': lambda c: giga('Fantasy Spells', 'spell_death_003', c, None, 2, 6, 26),         # Sentencia: la calavera que espera
    'aura': lambda c: giga('Lightning', 'lightning_aura_002', c, None, 2),                   # Agujas: chispazos
    'thorns': lambda c: giga('Fantasy Spells', 'spell_thorns_001', c, None, 2, 8, 20),       # Raíces: zarzas a los pies
    'ice': lambda c: giga('Fantasy Spells', 'spell_ice_001', c, None, 2, 18, 28),            # Helado: el bloque de hielo
    'clock': lambda c: giga('Fantasy Spells', 'spell_haste_001', c, None, 2, 4, 28),         # Ralentizado: el reloj
}
meta, blocks, y = {}, [], 0
for name, fn in SETS.items():
    rows = [fn(c) for c in COLORS]; w, h = rows[0][0].size; n = min(len(r) for r in rows)
    meta[name] = {'y': y, 'w': w, 'h': h, 'n': n}; blocks.append((y, rows, w, h, n)); y += h * len(COLORS)
W = max(w * n for _, _, w, _, n in blocks)
out = Image.new('RGBA', (W, y), (0, 0, 0, 0))
for y0, rows, w, h, n in blocks:
    for j, r in enumerate(rows):
        for i in range(n): out.paste(r[i], (i * w, y0 + j * h))
out.save('assets/fx.png', optimize=True)
open('src/49_fx.js', 'w').write('// Generado por tools/pack_fx.py: efectos de «Super Pixel Effects Gigapack» (Will Tice / unTied Games) y «Effect and Bullet 16x16».\n'
    '// Cada efecto ocupa ocho filas, una por color, en este orden.\nconst FXCOL = %s;\nconst FXA = %s;\n' % (json.dumps(COLORS), json.dumps(meta)))
print(out.size, meta)
