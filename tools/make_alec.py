#!/usr/bin/env python3
"""Dibuja a Alec, el mago de los guanteletes, píxel a píxel.

Sale una tira por vista y animación en assets/library/alec/ y una hoja de muestra ampliada.
Todo el dibujo está aquí, a mano, en rejillas de letras: no usa ningún paquete comprado.
"""
import os, sys
from PIL import Image

PAL = {
    'k': '#17121c',                                   # contorno
    'h': '#2a2230', 'H': '#43384f', 'w': '#6d5c80',   # pelo
    's': '#e6b48c', 'S': '#bd8462', 'e': '#1b1522', 'E': '#f6efe2',   # piel y ojos
    'r': '#b9333c', 'R': '#7c1f2d', 't': '#e35b4c',   # bufanda
    'c': '#2c4a60', 'C': '#1d3244', 'd': '#49738e', 'g': '#d09a3c', 'G': '#8f6424',   # abrigo y ribete
    'm': '#8e93a1', 'M': '#565a69', 'n': '#cfd4de',   # guantelete
    'o': '#ffae3d', 'O': '#fff3bf',                   # brasa del guantelete
    'p': '#372c3a', 'b': '#6a4937', 'B': '#402c24',   # pantalón y botas
}
W, H = 28, 34          # lienzo de cada fotograma; los pies se apoyan en la última fila

def grid(rows, w=18):
    for i, r in enumerate(rows):
        if len(r) != w: sys.exit('fila %d mide %d, no %d: %r' % (i, len(r), w, r))
    return rows

# ---------- Cabezas y torsos (sin guanteletes ni piernas), 18 de ancho ----------
DOWN = grid([
    '.....k..kk...k....',
    '....khkkhhkkkhk...',
    '...khHhhHHhhHhk...',
    '..khHHHHwHHHHHhk..',
    '..khHHwwHHHHHHhk..',
    '..khHHHHHHHHHHhk..',
    '..khHhHHhHHhHHhk..',
    '..khhshhshhshshk..',
    '..khseEsssseEshk..',
    '..khsssssssssshk..',
    '...kSsssSSsssSk...',
    '...krrSssssSrrk...',
    '..krrtrrrrrrtrrk..',
    '..kRrrrtrrrrrrRk..',
    '.kccdRRrrrrRRdcck.',
    '.kcCdcCRRRRCcdCck.',
    '.kcCkccCggCcckCck.',
    '.kcCkcccggccckCck.',
    '.kkkkgGggggGgkkkk.',
    '....kdccCCccdk....',
    '...kdcccCCcccdk...',
    '...kdccCkkCccdk...',
    '...kdcCk..kCcdk...',
    '...kkkk....kkkk...',
])
UP = grid([
    '.....k..kk...k....',
    '....khkkhhkkkhk...',
    '...khHhhHHhhHhk...',
    '..khHHHHwHHHHHhk..',
    '..khHHHwwHHHHHhk..',
    '..khHHHHHHHHHHhk..',
    '..khHHHHhHHHHHhk..',
    '..khhHHHHHHhHhhk..',
    '..khhHhHHHHHHhhk..',
    '..khhhHHhHHhhhhk..',
    '...khhkhhhhkhhk...',
    '...krrhkhhkhrrk...',
    '..krrrrrrrrrrrrk..',
    '..kRrrrrrrrrrrRk..',
    '.kccdRRrrRRRRdcck.',
    '.kcCdccrrRccdcCck.',
    '.kcCkccrRrccckCck.',
    '.kcCkcccrRccckCck.',
    '.kkkkgGgrRgGgkkkk.',
    '....kdccRrccdk....',
    '...kdcccCRcccdk...',
    '...kdccCkkCccdk...',
    '...kdcCk..kCcdk...',
    '...kkkk....kkkk...',
])
SIDE = grid([
    '....k..kk..k......',
    '...khkkhhkkhkk....',
    '..khHhhHHhhHHhk...',
    '.khhHHHwwHHHHhk...',
    '.khHHHwHHHHHHHhk..',
    'kkhHHHHHHHhHHhhk..',
    'khhhHHHhHhhshshk..',
    '.khhHHhhhssssk....',
    '.khhhHhhsseEsk....',
    '..khhhhsSsssssk...',
    '..kkhhhSsssSsk....',
    '..kkhhrrSsssk.....',
    '...krrrrtrrrrk....',
    '...kRrrrrrrtrk....',
    '....kcRRrrrRdk....',
    '....kcdcCRRcdk....',
    '....kcdccCccdk....',
    '....kcdcccccdk....',
    '....kgGgggGggk....',
    '....kdccCCccdk....',
    '...kdcccCCccdk....',
    '...kdccCCcccdk....',
    '...kdcCkkkCcdk....',
    '...kkkk...kkkk....',
])

# ---------- Piernas: (filas, de 18 de ancho) por paso ----------
LEGS_FRONT = {
    'stand': ['....kppk..kppk....', '....kppk..kppk....', '....kbbk..kbbk....', '...kbbBk..kBbbk...', '...kkkkk..kkkkk...'],
    'l':     ['....kppk..kppk....', '....kbbk..kppk....', '...kbbBk..kbbk....', '...kkkkk..kBbbk...', '..........kkkkk...'],
    'r':     ['....kppk..kppk....', '....kppk..kbbk....', '....kbbk..kBbbk...', '...kbbBk..kkkkk...', '...kkkkk..........'],
}
LEGS_SIDE = {
    'stand': ['.....kppkppk......', '.....kppkppk......', '.....kbbkbbk......', '.....kbbBkbbBk....', '.....kkkkkkkkk....'],
    'a':     ['....kppk.kppk.....', '...kppk...kppk....', '..kbbk.....kbbk...', '..kbBk.....kbbBk..', '..kkkk.....kkkkk..'],
    'b':     ['.....kppkppk......', '.....kpppppk......', '......kbbbk.......', '......kbbBBk......', '......kkkkkk......'],
    'c':     ['....kppk.kppk.....', '...kppk...kppk....', '..kbbk.....kbbk...', '..kbBk.....kbbBk..', '..kkkk.....kkkkk..'],
}

# ---------- Guanteletes: piezas sueltas que se colocan encima ----------
G_FRONT = ['.kkkk.', 'kmnnmk', 'knoomk', 'kmooMk', 'kMmMMk', '.kkkk.']
G_HOT   = ['.kkkk.', 'knOOnk', 'kOOOOk', 'koOOok', 'kMooMk', '.kkkk.']
G_SIDE  = ['.kkkkk.', 'kmnnnmk', 'kmooomk', 'kmooMMk', 'kMmMMMk', '.kkkkk.']
G_SIDEH = ['.kkkkk.', 'knnOOnk', 'koOOOOk', 'kmoOOok', 'kMmooMk', '.kkkkk.']
G_BACK  = ['.kkkk.', 'kmnmmk', 'kmmMMk', 'kmMMMk', 'kMMMMk', '.kkkk.']
G_BACKH = ['.kkkk.', 'kmoomk', 'koOOok', 'koOOok', 'kMooMk', '.kkkk.']
FLASH1 = ['..o..', '.oOo.', 'oOOOo', '.oOo.', '..o..']
FLASH2 = ['o.o.o', '.oOo.', 'oO.Oo', '.oOo.', 'o.o.o']
SCARF_TAIL = {0: ['kk.', 'krk', 'kRk', '.k.'], 1: ['.kk', 'krk', 'kRk', 'k..'], 2: ['kk.', 'krk', '.kR', '..k']}

def rgba(c):
    c = PAL[c].lstrip('#'); return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), 255)

def stamp(im, rows, x, y):
    for j, r in enumerate(rows):
        for i, ch in enumerate(r):
            if ch != '.' and 0 <= x + i < im.width and 0 <= y + j < im.height: im.putpixel((x + i, y + j), rgba(ch))

def frame(view, legs, bob=0, gl=(0, 0), gr=(0, 0), hot=0, flash=0, tail=0, lean=0):
    """Compone un fotograma. gl/gr: desplazamiento de cada guantelete; hot: brasa encendida; flash: destello del conjuro."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ox, body_h = 5, 24
    top = H - 5 - body_h + 3          # el faldón del abrigo tapa el arranque de las piernas          # la última fila del torso pisa la primera de las piernas
    side = view == 'side'
    L = (LEGS_SIDE if side else LEGS_FRONT)[legs]
    stamp(im, L, ox, H - 5)
    body = {'down': DOWN, 'up': UP, 'side': SIDE}[view]
    if view == 'up':      # guanteletes por detrás del cuerpo no: de espaldas se ven a los lados igual
        pass
    if side:              # el guantelete de atrás asoma un poco por detrás del abrigo
        stamp(im, G_BACK, ox + 1 + gl[0], top + 15 + bob + gl[1])
        stamp(im, SCARF_TAIL[tail], ox + 0, top + 12 + bob)
    stamp(im, body, ox + lean, top + bob)
    g = G_HOT if hot else G_FRONT
    if view == 'down':
        stamp(im, g, ox - 2 + gl[0], top + 18 + bob + gl[1]); stamp(im, g, ox + 14 + gr[0], top + 18 + bob + gr[1])
        if flash:
            f = FLASH1 if flash == 1 else FLASH2
            stamp(im, f, ox - 2 + gl[0], top + 18 + bob + gl[1] + 2); stamp(im, f, ox + 14 + gr[0], top + 18 + bob + gr[1] + 2)
    elif view == 'up':
        gb = G_BACKH if hot else G_BACK
        stamp(im, gb, ox - 2 + gl[0], top + 18 + bob + gl[1]); stamp(im, gb, ox + 14 + gr[0], top + 18 + bob + gr[1])
        if flash:
            f = FLASH1 if flash == 1 else FLASH2
            stamp(im, f, ox - 2 + gl[0], top + 18 + bob + gl[1] - 3); stamp(im, f, ox + 14 + gr[0], top + 18 + bob + gr[1] - 3)
    else:
        gs = G_SIDEH if hot else G_SIDE
        stamp(im, gs, ox + 9 + gr[0], top + 15 + bob + gr[1])
        if flash: stamp(im, FLASH1 if flash == 1 else FLASH2, ox + 15 + gr[0], top + 15 + bob + gr[1])
    return im

def anims(view):
    side = view == 'side'
    if side:
        idle = [frame(view, 'stand', 0, tail=0), frame(view, 'stand', 0, tail=1), frame(view, 'stand', 1, gr=(0, 0), tail=1), frame(view, 'stand', 1, tail=2)]
        move = [frame(view, 'a', 0, gl=(-1, 0), gr=(1, -1), tail=2, lean=1), frame(view, 'b', 1, tail=1, lean=1), frame(view, 'c', 0, gl=(1, 0), gr=(-1, 0), tail=2, lean=1),
                frame(view, 'a', 0, gl=(1, 0), gr=(-1, 0), tail=0, lean=1), frame(view, 'b', 1, tail=1, lean=1), frame(view, 'c', 0, gl=(-1, 0), gr=(1, -1), tail=2, lean=1)]
        atk = [frame(view, 'stand', 0, gr=(-2, -1), hot=1, tail=1), frame(view, 'stand', 0, gr=(3, -3), hot=1, flash=1, tail=2, lean=1), frame(view, 'stand', 0, gr=(4, -3), hot=1, flash=2, tail=2, lean=1),
               frame(view, 'stand', 0, gr=(3, -3), hot=1, tail=0, lean=1), frame(view, 'stand', 0, gr=(1, -1), hot=0, tail=1), frame(view, 'stand', 0, tail=0)]
    else:
        up = view == 'up'; d = -1 if up else 1      # de frente los puños bajan hacia la cámara; de espaldas suben
        idle = [frame(view, 'stand', 0), frame(view, 'stand', 0), frame(view, 'stand', 1, gl=(0, -1), gr=(0, -1)), frame(view, 'stand', 1, gl=(0, -1), gr=(0, -1))]
        move = [frame(view, 'l', 0, gl=(0, -1), gr=(0, 1)), frame(view, 'stand', 1), frame(view, 'r', 0, gl=(0, 1), gr=(0, -1)),
                frame(view, 'r', 0, gl=(0, 1), gr=(0, -1)), frame(view, 'stand', 1), frame(view, 'l', 0, gl=(0, -1), gr=(0, 1))]
        atk = [frame(view, 'stand', 0, gl=(1, -2), gr=(-1, -2), hot=1), frame(view, 'stand', 1, gl=(2, 2 * d), gr=(-2, 2 * d), hot=1, flash=1), frame(view, 'stand', 1, gl=(2, 3 * d), gr=(-2, 3 * d), hot=1, flash=2),
               frame(view, 'stand', 1, gl=(2, 2 * d), gr=(-2, 2 * d), hot=1), frame(view, 'stand', 0, gl=(1, 0), gr=(-1, 0)), frame(view, 'stand', 0)]
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
        rows.append(a['idle'] + a['move'] + a['atk'])
    n = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (n * W * scale, len(rows) * H * scale), (74, 86, 70, 255))
    for j, r in enumerate(rows):
        for i, f in enumerate(r):
            big = f.resize((W * scale, H * scale), Image.NEAREST); sheet.paste(big, (i * W * scale, j * H * scale), big)
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'muestra.png')
    sheet.save(out); print('hecho:', out, sheet.size)

if __name__ == '__main__': main()
