#!/usr/bin/env python3
"""Mete en el juego el Alec generado por el dueño en PixelLab (assets/library/alec_pixellab/, exportación de PixelLab).

De momento la exportación solo trae la postura quieta en 8 direcciones, sin animaciones. Se usan sur (abajo), este (perfil; el
juego lo voltea para mirar al oeste) y norte (arriba), y se simula el movimiento: un balanceo de un píxel al estar quieto, un paso
con rebote al correr y un pequeño empujón hacia delante al lanzar. Cuando haya animaciones de verdad, se leen de la misma carpeta.
Escribe assets/library/alec/{down,side,up}_{idle,move,atk}.png y manos.json (sin manos: el dibujo ya trae la brasa).
Uso: python3 -I tools/import_alec_pixellab.py
"""
import os, json
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets/library/alec_pixellab')
OUT = os.path.join(ROOT, 'assets/library/alec')
VIEWS = {'down': 'south', 'side': 'east', 'up': 'north'}
W, H = 52, 52   # se deja margen alrededor de los 48×48 para los desplazamientos

def place(im, dx=0, dy=0):
    c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.alpha_composite(im, ((W - im.width) // 2 + dx, H - im.height - 2 + dy)); return c

def main():
    meta = json.load(open(os.path.join(SRC, 'metadata.json'))); st = meta['states'][0]
    hands = {}
    for view, d in VIEWS.items():
        base = Image.open(os.path.join(SRC, st['frames']['rotations'][d])).convert('RGBA')
        fx = 1 if view == 'side' else 0; fy = -1 if view == 'up' else 1 if view == 'down' else 0
        anims = {
            'idle': [place(base), place(base), place(base, 0, -1), place(base, 0, -1)],
            'move': [place(base, 0, 0), place(base, 0, -1), place(base, 0, -2), place(base, 0, -1), place(base, 0, 0), place(base, 0, -1)],
            'atk': [place(base, -fx, -fy)] * 2 + [place(base, fx, fy)] * 4 + [place(base)] * 2,
        }
        for a, fr in anims.items():
            s = Image.new('RGBA', (W * len(fr), H), (0, 0, 0, 0))
            for i, f in enumerate(fr): s.alpha_composite(f, (i * W, 0))
            s.save(os.path.join(OUT, '%s_%s.png' % (view, a))); hands['%s_%s' % (view, a)] = [[] for _ in fr]
    json.dump({'w': W, 'h': H, 'hands': hands}, open(os.path.join(OUT, 'manos.json'), 'w'))
    print('hecho', W, 'x', H)

if __name__ == '__main__': main()
