#!/usr/bin/env python3
# Guarda TODO el CHARACTER MEGAPACK (overboy, itch.io) en una sola imagen sin pérdida, para no depender del zip:
#   python3 -I tools/pack_library.py "<carpeta del paquete descomprimido>"  → assets/library/megapack.png y megapack.json
# Cada fotograma se recorta a la caja común de su personaje; el json guarda tamaño original y desplazamiento para reconstruirlo píxel a píxel.
# El juego NO carga esta imagen: de aquí sale el atlas pequeño que sí usa (tools/pack_atlas.py).
import sys, os, glob, json
from PIL import Image
SRC = sys.argv[1]
lib, items = {}, []
for ch in sorted(os.listdir(SRC)):
    base = os.path.join(SRC, ch)
    if not os.path.isdir(base): continue
    anims = {}
    for d in sorted(os.listdir(base)):
        p = os.path.join(base, d)
        if not os.path.isdir(p): continue
        fs = sorted(glob.glob(os.path.join(p, '*.png')))
        if fs: anims[d] = [Image.open(f).convert('RGBA') for f in fs]
    prefix = os.path.commonprefix(list(anims.keys())) if len(anims) > 1 else ''
    prefix = prefix[:prefix.rfind('_') + 1] if '_' in prefix else ''
    entry = {'a': {}}
    for d, frames in anims.items():
        size = frames[0].size
        assert all(f.size == size for f in frames), (ch, d)
        bb = None
        for f in frames:
            b = f.getbbox()
            if b: bb = b if not bb else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
        bb = bb or (0, 0, 1, 1)
        name = d[len(prefix):] if prefix and d.startswith(prefix) else d
        entry['a'][name] = {'size': list(size), 'off': [bb[0], bb[1]], 'w': bb[2] - bb[0], 'h': bb[3] - bb[1], 'f': []}
        for f in frames: items.append((ch, name, f.crop(bb)))
    lib[ch] = entry
W = 4096; x = y = rowh = 0; pos = []
order = sorted(range(len(items)), key=lambda i: -items[i][2].height)     # los altos primero: estantes más apretados
place = {}
for i in order:
    im = items[i][2]
    if x + im.width + 1 > W: x = 0; y += rowh + 1; rowh = 0
    place[i] = (x, y); x += im.width + 1; rowh = max(rowh, im.height)
H = y + rowh
atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for i, (ch, name, im) in enumerate(items):
    atlas.alpha_composite(im, place[i]); lib[ch]['a'][name]['f'].append(list(place[i]))
os.makedirs('assets/library', exist_ok=True)
atlas.save('assets/library/megapack.png', optimize=True)
json.dump({'source': 'CHARACTER MEGAPACK, overboy (itch.io). Uso personal y comercial; no revender ni redistribuir los archivos.', 'chars': lib}, open('assets/library/megapack.json', 'w'), separators=(',', ':'))
print(len(lib), 'personajes', len(items), 'fotogramas', atlas.size, os.path.getsize('assets/library/megapack.png') // 1024, 'KB')
