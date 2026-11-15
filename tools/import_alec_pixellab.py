#!/usr/bin/env python3
"""Mete en el juego el Alec generado por el dueño en PixelLab (assets/library/alec_pixellab/, exportación de PixelLab).

La exportación trae tres animaciones (Breathing_Idle, Running, Cross_Punch) en sur (abajo), este (perfil; el juego lo voltea para
mirar al oeste) y norte (arriba), en lienzos de 80×80. Se recorta a todas el mismo cuadro de 56×56 para que conserven su propio
movimiento. Del puñetazo, que trae una preparación larga, se arma una tira de 8 fotogramas en la que el juego usa el 2.º (carga)
y el 6.º (golpe): los fotogramas de PixelLab que mejor sirven para cada cosa cambian según la vista.
Escribe assets/library/alec/{down,side,up}_{idle,move,atk}.png y manos.json (sin manos: el dibujo ya trae la brasa).
Uso: python3 -I tools/import_alec_pixellab.py
"""
import os, json
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets/library/alec_pixellab')
OUT = os.path.join(ROOT, 'assets/library/alec')
VIEWS = {'down': 'south', 'side': 'east', 'up': 'north'}
BOX = (14, 12, 70, 68)   # cuadro común dentro del lienzo de 80×80 (cabe todo lo que dibujan las tres animaciones)
W, H = BOX[2] - BOX[0], BOX[3] - BOX[1]
PUNCH = {'south': [0, 3, 3, 3, 4, 4, 4, 5], 'east': [0, 3, 3, 4, 5, 5, 5, 5], 'north': [0, 2, 2, 3, 4, 4, 4, 5]}

def main():
    meta = json.load(open(os.path.join(SRC, 'metadata.json'))); an = meta['states'][0]['frames']['animations']
    load = lambda p: Image.open(os.path.join(SRC, p)).convert('RGBA').crop(BOX)
    hands = {}
    for view, d in VIEWS.items():
        punch = [load(p) for p in an['Cross_Punch'][d]]
        anims = {'idle': [load(p) for p in an['Breathing_Idle'][d]], 'move': [load(p) for p in an['Running'][d]], 'atk': [punch[i] for i in PUNCH[d]]}
        for a, fr in anims.items():
            s = Image.new('RGBA', (W * len(fr), H), (0, 0, 0, 0))
            for i, f in enumerate(fr): s.alpha_composite(f, (i * W, 0))
            s.save(os.path.join(OUT, '%s_%s.png' % (view, a))); hands['%s_%s' % (view, a)] = [[] for _ in fr]
    json.dump({'w': W, 'h': H, 'hands': hands}, open(os.path.join(OUT, 'manos.json'), 'w'))
    print('hecho', W, 'x', H)

if __name__ == '__main__': main()
