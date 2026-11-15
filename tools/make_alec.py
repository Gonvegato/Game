#!/usr/bin/env python3
"""Dibuja a Alec, el mago de los guanteletes, píxel a píxel.

Sale una tira por vista y animación en assets/library/alec/ y una hoja de muestra ampliada.
Todo el dibujo está aquí, a mano, en rejillas de letras: no usa ningún paquete comprado.
"""
import os, sys
from PIL import Image

PAL = {
    'k': '#120e17',                                   # contorno
    'h': '#8a84a4', 'H': '#c4bfd6', 'w': '#f3f0fa',   # pelo blanco largo
    's': '#e3b08a', 'S': '#b77f60', 'e': '#e0203a', 'E': '#ff8a7a',   # piel y ojos rojos
    'r': '#5a1f2c', 'R': '#3a141e', 't': '#7c2c3a',   # pañuelo que le tapa hasta la nariz
    'c': '#37324c', 'C': '#221f31', 'd': '#575072', 'g': '#a8823a', 'G': '#6e5424',   # túnica oscura y ribete
    'm': '#8e93a1', 'M': '#565a69', 'n': '#cfd4de',   # guantelete
    'o': '#ffae3d', 'O': '#fff3bf',                   # brasa del guantelete
    'b': '#5a4034', 'B': '#3a2a22',                   # botas
}
W, H = 28, 34          # lienzo de cada fotograma; los pies se apoyan en la última fila

def grid(rows, w=18):
    for i, r in enumerate(rows):
        if len(r) != w: sys.exit('fila %d mide %d, no %d: %r' % (i, len(r), w, r))
    return rows

# ---------- Cuerpos completos menos el bajo de la túnica y los guanteletes, 18 de ancho ----------
DOWN = grid([
    '.....k..kk...k....',
    '....kHkkHHkkkHk...',
    '...kHwHHwwHHwHk...',
    '..kHwwHwwwwHwwHk..',
    '..kHwHHwwwHHwHhk..',
    '..khwHhwwHwhHwhk..',
    '..khHhHwHHwHhHhk..',
    '..khHhhhsshhhHhk..',
    '..khsSeEssEeSshk..',
    '..khrrrrrrrrrrhk..',
    '..khHrtrrrrtrHhk..',
    '.khHhRrrrrrrRhHhk.',
    '.khHkcRRrrRRckHhk.',
    '.khhkcdcCCcdckhhk.',
    '.khkcCdcCCcdCckhk.',
    '.kkcCkccCCcckCckk.',
    '..kcCkgGggGgkCck..',
    '..kkkkdcCCcdkkkk..',
    '....kdccCCccdk....',
    '...kdcccCCcccdk...',
    '...kdcccCCcccdk...',
    '..kdccccCCccccdk..',
    '..kdcccCCCCcccdk..',
    '..kdccCCccCCccdk..',
])
UP = grid([
    '.....k..kk...k....',
    '....kHkkHHkkkHk...',
    '...kHwHHwwHHwHk...',
    '..kHwwHwwwwHwwHk..',
    '..kHwHHwwwHHwwhk..',
    '..khwHwwHwwHwHhk..',
    '..khwHwHHwwHwHhk..',
    '..khwHwHwwHHwHhk..',
    '..khwHwHwHwHwHhk..',
    '..khHhwHwHwHhHhk..',
    '..khHhwHwHwHhHhk..',
    '.kchHhwHwHwHhHhck.',
    '.kchHhHhwHhHhHhck.',
    '.kcChHhHwHhHhhCck.',
    '.kcCkhHhHHhHhkCck.',
    '.kkcCkhHhhHhkCckk.',
    '..kcCkghHhhgkCck..',
    '..kkkkdchhcdkkkk..',
    '....kdccCCccdk....',
    '...kdcccCCcccdk...',
    '...kdcccCCcccdk...',
    '..kdccccCCccccdk..',
    '..kdcccCCCCcccdk..',
    '..kdccCCccCCccdk..',
])
SIDE = grid([
    '....k..kk..k......',
    '...kHkkHHkkHkk....',
    '..kHwHHwwHHwwHk...',
    '.kHwwHwwwHwwwHk...',
    '.kHwHHwwHHwwwHhk..',
    '.khwHwwHwwHwwHhk..',
    '.khwHwHHwHhsHsk...',
    '.khwHwHhHsseEsk...',
    '.khHwHhhrrrrrrk...',
    '.khHwHhhrtrrrrk...',
    '.khHwHhhRrrrrk....',
    '.khwHhhkcRRrk.....',
    '.khHwhkcdccCcdk...',
    '..khHhkcdccCcdk...',
    '..khhkkcdccCcdk...',
    '...kk.kcdccCcdk...',
    '......kgGgggGgk...',
    '......kdcCCccdk...',
    '......kdccCCcdk...',
    '......kdccCCccdk..',
    '.....kdcccCCccdk..',
    '.....kdccCCcccdk..',
    '....kdcccCCcccdk..',
    '....kdccCCccccdk..',
])

# ---------- Bajo de la túnica con las puntas de las botas: cambia con el paso ----------
LEGS_FRONT = {
    'stand': ['..kkkbbkkkkbbkkk..', '....kkkk..kkkk....'],
    'l':     ['..kkkbBkkkkkkkkk..', '....kbbk..........'],
    'r':     ['..kkkkkkkkkBbkkk..', '..........kbbk....'],
}
LEGS_SIDE = {
    'stand': ['....kkkkbbkkbbBk..', '........kkkkkkkk..'],
    'a':     ['....kkkbbkkkkbbBk.', '......kkkk..kkkkk.'],
    'b':     ['....kkkkkbbBkkkk..', '........kkkkk.....'],
    'c':     ['....kkkbbkkkkbbBk.', '......kkkk..kkkkk.'],
}

# ---------- Guanteletes: piezas sueltas que se colocan encima ----------
G_FRONT = ['.kkkk.', 'kmnnmk', 'knoomk', 'kmooMk', 'kMmMMk', '.kkkk.']
G_HOT   = ['.kkkk.', 'knOOnk', 'kOOOOk', 'koOOok', 'kMooMk', '.kkkk.']
G_SIDE  = ['.kkkkk.', 'kmnnnmk', 'kmooomk', 'kmooMMk', 'kMmMMMk', '.kkkkk.']
G_SIDEH = ['.kkkkk.', 'knnOOnk', 'koOOOOk', 'kmoOOok', 'kMmooMk', '.kkkkk.']
G_BACK  = ['.kkkk.', 'kmnmmk', 'kmmMMk', 'kmMMMk', 'kMMMMk', '.kkkk.']
G_BACKH = ['.kkkk.', 'kmoomk', 'koOOok', 'koOOok', 'kMooMk', '.kkkk.']
HANDS = {}             # dónde queda el centro de cada guantelete en cada fotograma, para pintar la llama desde el juego

def rgba(c):
    c = PAL[c].lstrip('#'); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)

def stamp(im, rows, x, y):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch != '.' and 0 <= x + i < im.width and 0 <= y + j < im.height: im.putpixel((x + i, y + j), rgba(ch))

def frame(view, legs, bob=0, gl=(0, 0), gr=(0, 0), hot=0, lean=0, sway=0):
    """Compone un fotograma. gl/gr: desplazamiento de cada guantelete; hot: brasa encendida."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox, top = 5, H - 2 - 24
    side = view == 'side'
    stamp(im, (LEGS_SIDE if side else LEGS_FRONT)[legs], ox, H - 2)
    if side and sway:      # la punta de la melena se queda atrás al andar
        if sway > 0: stamp(im, ['kh', 'kh', 'kk'], ox + 1 + lean, top + 13 + bob)
    stamp(im, {'down': DOWN, 'up': UP, 'side': SIDE}[view], ox + lean, top + bob)
    if sway:               # el bajo de la túnica ondea hacia un lado
        if side: stamp(im, ['kd', 'kk'], ox + 3 + lean, top + 22 + bob)
        elif sway < 0: stamp(im, ['kd', 'kc', 'kk'], ox + 0, top + 21 + bob)
        else: stamp(im, ['dk', 'ck', 'kk'], ox + 16, top + 21 + bob)
    hands = []
    if side:
        x, y = ox + 9 + gr[0], top + 13 + bob + gr[1]
        stamp(im, G_SIDEH if hot else G_SIDE, x, y); hands.append((x + 3, y + 3))
    else:
        g = (G_BACKH if hot else G_BACK) if view == 'up' else (G_HOT if hot else G_FRONT)
        for x, y in ((ox - 2 + gl[0], top + 15 + bob + gl[1]), (ox + 14 + gr[0], top + 15 + bob + gr[1])):
            stamp(im, g, x, y); hands.append((x + 3, y + 3))
    im.hands = hands
    return im

def anims(view):
    if view == 'side':
        idle = [frame(view, 'stand'), frame(view, 'stand'), frame(view, 'stand', 1), frame(view, 'stand', 1)]
        move = [frame(view, 'a', 0, gr=(1, -1), lean=1, sway=1), frame(view, 'b', 1, lean=1, sway=-1), frame(view, 'c', 0, gr=(-1, 0), lean=1, sway=1),
                frame(view, 'a', 0, gr=(-1, 0), lean=1, sway=-1), frame(view, 'b', 1, lean=1, sway=1), frame(view, 'c', 0, gr=(1, -1), lean=1, sway=-1)]
        atk = [frame(view, 'stand', 0, gr=(-2, -1), hot=1), frame(view, 'stand', 0, gr=(3, -3), hot=1, lean=1, sway=1), frame(view, 'stand', 0, gr=(4, -3), hot=1, lean=1, sway=1),
               frame(view, 'stand', 0, gr=(3, -3), hot=1, lean=1), frame(view, 'stand', 0, gr=(1, -1)), frame(view, 'stand')]
    else:
        d = -1 if view == 'up' else 1      # de frente los puños bajan hacia la cámara; de espaldas suben
        idle = [frame(view, 'stand'), frame(view, 'stand'), frame(view, 'stand', 1, gl=(0, -1), gr=(0, -1)), frame(view, 'stand', 1, gl=(0, -1), gr=(0, -1))]
        move = [frame(view, 'l', 0, gl=(0, -1), gr=(0, 1), sway=-1), frame(view, 'stand', 1, sway=-1), frame(view, 'r', 0, gl=(0, 1), gr=(0, -1)),
                frame(view, 'r', 0, gl=(0, 1), gr=(0, -1), sway=1), frame(view, 'stand', 1, sway=1), frame(view, 'l', 0, gl=(0, -1), gr=(0, 1))]
        # al lanzar abre los brazos hacia fuera para que la llama no le tape la cara
        atk = [frame(view, 'stand', 0, gl=(0, -2), gr=(0, -2), hot=1), frame(view, 'stand', 1, gl=(-2, 1 * d), gr=(2, 1 * d), hot=1), frame(view, 'stand', 1, gl=(-3, 2 * d), gr=(3, 2 * d), hot=1),
               frame(view, 'stand', 1, gl=(-2, 1 * d), gr=(2, 1 * d), hot=1), frame(view, 'stand', 0, gl=(-1, 0), gr=(1, 0)), frame(view, 'stand')]
    return {'idle': idle, 'move': move, 'atk': atk}

def main():
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'library', 'alec')
    os.makedirs(root, exist_ok=True)
    scale = 6; rows = []
    for view in ('down', 'side', 'up'):
        a = anims(view)
        for name, fr in a.items():
            strip = Image.new('RGBA', (W * len(fr), H), (0, 0, 0, 0))
            for i, f in enumerate(fr): strip.paste(f, (i * W, 0))
            strip.save(os.path.join(root, '%s_%s.png' % (view, name)))
            HANDS['%s_%s' % (view, name)] = [f.hands for f in fr]
        rows.append(a['idle'] + a['move'] + a['atk'])
    n = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (n * W * scale, len(rows) * H * scale), (74, 86, 70, 255))
    for j, r in enumerate(rows):
        for i, f in enumerate(r):
            big = f.resize((W * scale, H * scale), Image.NEAREST); sheet.paste(big, (i * W * scale, j * H * scale), big)
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'muestra.png')
    import json
    json.dump({'w': W, 'h': H, 'hands': HANDS}, open(os.path.join(root, 'manos.json'), 'w'))
    sheet.save(out); print('hecho:', out, sheet.size)

if __name__ == '__main__': main()
