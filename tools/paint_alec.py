#!/usr/bin/env python3
"""Viste a Alec sobre el cuerpo base de Pixel Crawler («Body_A», de Anokolisa), que ya está en el repositorio.

El cuerpo trae proporciones de adulto (unos 30 píxeles de alto, como el resto de personajes del juego), ojos y animaciones
de quieto, correr y estocada en tres vistas. Aquí se repinta encima, manteniendo sus sombras:
  · cara: iris rojo oscuro, pañuelo granate de la nariz para abajo;
  · pelo: blanco y largo, en mechones afilados que salen hacia atrás como empujados por el viento, con puntas arriba y
    mechones entre los ojos; ondea un poco en cada fotograma;
  · cuerpo: túnica oscura larga, cinturón, botas y guanteletes de hierro con brasa;
  · la estocada se usa sin la espada (se borra): queda el gesto de lanzar con el puño.
Uso: python3 -I tools/paint_alec.py [muestra.png]   → assets/library/alec/{down,side,up}_{idle,move,atk}.png y manos.json
(tools/paint_alec_chibi.py y tools/make_alec.py son versiones anteriores de Alec que ya no se usan.)
"""
import os, sys, json, math
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets/library/packs/Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Characters/Body_A/Animations')
OUT = os.path.join(ROOT, 'assets/library/alec')
hx = lambda s: tuple(int(s[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
rgb = lambda p: '#%02x%02x%02x' % p[:3]

SKIN = {'#763d2b': 0, '#a26543': 1, '#d9a066': 2, '#fac895': 3}        # tonos de piel del cuerpo base, de oscuro a claro
LINE = '#000000'
EYE_W, EYE_I, EYE_S = '#fffcfc', '#4cb528', '#a7acae'                   # blanco, iris verde, sombra del ojo
SWORD = {'#ccc9c2', '#928f88', '#fffffe', '#404545'}                    # la espada de la estocada: se borra
MAT = {   # cuatro tonos (oscuro → claro) y contorno
    'robe': ([hx(c) for c in ('#1b1826', '#262236', '#332e48', '#454062')], hx('#0d0b13')),
    'mask': ([hx(c) for c in ('#2e0e17', '#46172a', '#5e1f2e', '#7d2b3b')], hx('#16060b')),
    'boot': ([hx(c) for c in ('#271b17', '#3a2a22', '#4f3a2f', '#664b3d')], hx('#110b09')),
    'metal': ([hx(c) for c in ('#3b3e4a', '#5d6271', '#8e93a1', '#cdd2dc')], hx('#100e14')),
}
HAIR = [hx(c) for c in ('#6f6a8a', '#9993b4', '#c4bfd8', '#e6e3f0', '#ffffff')]; HAIR_LINE = hx('#2e2a42')
BELT, EMBER, IRIS, IRIS_D = hx('#b08a3e'), hx('#ffae3d'), hx('#a3182b'), hx('#5c0c18')
CELL, CROP = 64, (6, 4, 58, 52)

def strip_sword(im):
    px = im.load()
    for y in range(CELL):
        for x in range(CELL):
            if px[x, y][3] and rgb(px[x, y]) in SWORD: px[x, y] = (0, 0, 0, 0)
    body = lambda p: p[3] and rgb(p) != LINE
    for _ in range(2):   # contorno que se ha quedado suelto al borrar la espada
        kill = [(x, y) for y in range(CELL) for x in range(CELL) if px[x, y][3] and rgb(px[x, y]) == LINE and
                not any(0 <= x + dx < CELL and 0 <= y + dy < CELL and body(px[x + dx, y + dy]) for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
        for x, y in kill: px[x, y] = (0, 0, 0, 0)
    return im

def tone(px, x, y, mat):
    c = rgb(px[x, y]); ramp, line = MAT[mat]
    if c == LINE: px[x, y] = line
    elif c in SKIN: px[x, y] = ramp[SKIN[c]]

def strand(mask, x0, y0, dx, dy, length, width, bend=0.0):
    """Mechón afilado: de (x0, y0) en dirección (dx, dy), estrechándose hasta la punta; bend lo curva hacia abajo."""
    n = math.hypot(dx, dy) or 1; dx, dy = dx / n, dy / n
    t = 0.0
    while t <= length:
        k = t / length; cx = x0 + dx * t; cy = y0 + dy * t + bend * k * k * length
        r = max(0.45, width * (1 - k) / 2)
        for yy in range(int(cy - r - 1), int(cy + r + 2)):
            for xx in range(int(cx - r - 1), int(cx + r + 2)):
                if (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= r * r + 0.15 and 0 <= xx < CELL and 0 <= yy < CELL: mask.add((xx, yy))
        t += 0.4

def frame(im, d, i, n, anim):
    """d: 'down', 'side' (mira a la derecha), 'up'. i: fotograma, n: total. Devuelve (64×64, [manos])."""
    if anim == 'atk': im = strip_sword(im)
    px = im.load(); P = [(x, y) for y in range(CELL) for x in range(CELL) if px[x, y][3]]
    top, bot = min(y for _, y in P), max(y for _, y in P)
    eyes = [(x, y) for x, y in P if rgb(px[x, y]) in (EYE_W, EYE_I, EYE_S)]
    if eyes: top = min(top, min(y for _, y in eyes) - 5)          # en la estocada de arriba el brazo asoma por encima de la cabeza
    if d == 'up' and anim == 'atk': top = max(top, bot - 30)
    head = [(x, y) for x, y in P if top <= y <= top + 10]
    hx0, hx1 = min(x for x, _ in head), max(x for x, _ in head); hb = top + 10
    if eyes: ey0, ey1, ex0, ex1 = min(y for _, y in eyes), max(y for _, y in eyes), min(x for x, _ in eyes), max(x for x, _ in eyes)
    face = set()
    # ── Cara ──
    for x, y in head:
        c = rgb(px[x, y])
        if c == EYE_I: px[x, y] = IRIS; face.add((x, y)); continue
        if c == EYE_S: px[x, y] = IRIS_D; face.add((x, y)); continue
        if c == EYE_W: face.add((x, y)); continue
        if not eyes: continue
        front = d == 'down' or (d == 'side' and x >= ex0 - 2)
        if front and ey0 <= y <= ey1: face.add((x, y))                       # la franja de los ojos, con su piel
        elif front and y > ey1: tone(px, x, y, 'mask'); face.add((x, y))     # de la nariz para abajo, el pañuelo
    # ── Cuerpo ──
    body = [(x, y) for x, y in P if y > hb]
    waist = top + 19; feet = bot - 1
    band = [(x, y) for x, y in body if y <= waist + 2]
    hands = []
    if band:
        mn, mxx = min(x for x, _ in band), max(x for x, _ in band)
        for s in (['l', 'r'] if d != 'side' else ['r']):
            g = [(x, y) for x, y in band if (x <= mn + 1 if s == 'l' else x >= mxx - 1)]
            if not g: continue
            gy = max(y for _, y in g); g = [(x, y) for x, y in g if y >= gy - 2]
            hands.append((round(sum(x for x, _ in g) / len(g)), round(sum(y for _, y in g) / len(g))))
    near = lambda x, y: any(abs(x - a) <= 1 and abs(y - b) <= 1 for a, b in hands)
    for x, y in body:
        if y >= feet: tone(px, x, y, 'boot')
        elif near(x, y): tone(px, x, y, 'metal')
        else: tone(px, x, y, 'robe')
    ramp, line = MAT['robe']
    for y in range(waist, feet):                                              # faldón: tapa el hueco entre las piernas
        row = [x for x in range(CELL) if px[x, y][3] and not near(x, y)]
        if len(row) < 2: continue
        a, b = min(row), max(row)
        if b - a > 14: continue                                               # zancada muy abierta: no se rellena
        for x in range(a + 1, b):
            if not px[x, y][3] or px[x, y] == line: px[x, y] = ramp[1 if x - a < (b - a) / 2 else 2]
        for x in (a - 1, b + 1):
            if not px[x, y][3]: px[x, y] = line
    for x in range(CELL):                                                     # cinturón
        if px[x, waist][3] and px[x, waist] != line and not near(x, waist): px[x, waist] = BELT
    for cx, cy in hands: px[cx, cy] = EMBER
    # ── Pelo: el casco de la cabeza más mechones al viento ──
    mask = set()
    for x, y in head:
        if (x, y) in face: continue
        if not eyes or y < ey0 or (d == 'side' and x < ex0 - 2) or d == 'up': mask.add((x, y))
    cx = (hx0 + hx1) / 2; w = math.sin(i / max(1, n) * math.pi * 2) * (1.0 if anim != 'move' else 1.6)   # vaivén del viento
    run = 1.0 if anim == 'move' else 0.0
    if d == 'side':      # mira a la derecha: la melena cae hacia atrás, gruesa, y el viento la levanta un poco
        for k, (dy0, ang, L, wd) in enumerate([(1, -0.2, 8, 4.4), (3, 0.08, 10, 5.0), (5, 0.35, 9, 4.6), (7, 0.62, 7, 3.8)]):
            a = ang + 0.07 * w * (1 if k % 2 else -1) - 0.15 * run
            strand(mask, hx0 + 5, top + dy0, -1, a, L + 2 * run, wd, bend=0.10)
        strand(mask, cx + 1, top + 1, -1, -0.45, 4, 3.2)                                                 # una punta barrida arriba
        if eyes: strand(mask, ex1 + 1, top + 2, 0.4, 1, 4, 2.6)                                        # mechón sobre el ojo
    elif d == 'down':    # de frente: dos puntas cortas arriba, un mechón entre los ojos y la melena asomando a los lados
        strand(mask, cx + 1.5, top + 1, 0.35, -1, 3, 3.2); strand(mask, cx - 3, top + 2, -0.7, -1, 2, 2.4)   # puntas sin simetría
        for sg in (-1, 1):
            ex = hx0 + 2 if sg < 0 else hx1 - 2
            strand(mask, ex, top + 4, sg * 0.42, 1, 8 + run, 4.6)
            strand(mask, ex, top + 3, sg, 0.45 + 0.12 * w * sg, 5, 3.6, bend=0.06)
        if eyes: strand(mask, cx + 0.5, top + 3, 0.15, 1, max(2, ey0 - top - 1), 2.4)                   # entre los ojos
    else:                # de espaldas: la melena cae por la espalda en cuatro mechones gruesos que se abren un poco
        for sx, dxs, L in ((cx - 3.5, -0.45, 9), (cx - 1, -0.12, 11), (cx + 1.5, 0.15, 11), (cx + 4, 0.48, 9)):
            strand(mask, sx, top + 5, dxs + 0.08 * w, 1, L + run, 5.0)
        strand(mask, cx - 1.5, top + 1, -0.35, -1, 3, 3.2); strand(mask, cx + 3, top + 2, 0.7, -1, 2, 2.4)
    mask -= face
    # sombreado: claro arriba de cada mechón, oscuro abajo, con rayas de mechón; contorno alrededor
    hair = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); hp = hair.load()
    for x, y in mask:
        up, dn = (x, y - 1) in mask, (x, y + 1) in mask
        streak = (y % 3 == 0) if d == 'side' else (x % 3 == 0)                # vetas en la dirección en que cae el pelo
        hp[x, y] = HAIR[4 if not up else 1 if not dn else 2 if streak else 3]
    for x, y in list(mask):
        for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + ddx, y + ddy)
            if q not in mask and q not in face and 0 <= q[0] < CELL and 0 <= q[1] < CELL: hp[q] = HAIR_LINE
    out = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    if d == 'up': out.alpha_composite(im); out.alpha_composite(hair)        # de espaldas, la melena va por encima del cuerpo
    else:   # lo que cae por debajo de la cabeza va por detrás del cuerpo; la cabeza, por delante
        back = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); front = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); bp, fp = back.load(), front.load()
        for y in range(CELL):
            for x in range(CELL):
                if hp[x, y][3]: (fp if y <= hb else bp)[x, y] = hp[x, y]
        out.alpha_composite(back); out.alpha_composite(im); out.alpha_composite(front)
    return out, hands

ANIMS = {'idle': ('Idle_Base', 'Idle_%s'), 'move': ('Run_Base', 'Run_%s'), 'atk': ('Pierce_Base', 'Pierce_%s')}
VIEWS = {'down': 'Down', 'side': 'Side', 'up': 'Up'}
W, H = CROP[2] - CROP[0], CROP[3] - CROP[1]

def main():
    os.makedirs(OUT, exist_ok=True); hands_all = {}; rows = []
    for view, V in VIEWS.items():
        row = []
        for anim, (folder, pat) in ANIMS.items():
            name = pat % ('Top' if anim == 'atk' and V == 'Up' else V)
            sheet = Image.open(os.path.join(SRC, folder, name + '-Sheet.png')).convert('RGBA'); n = sheet.width // CELL
            strip = Image.new('RGBA', (W * n, H), (0, 0, 0, 0)); hs = []
            for i in range(n):
                fr, hands = frame(sheet.crop((i * CELL, 0, (i + 1) * CELL, CELL)), view, i, n, anim)
                strip.alpha_composite(fr.crop(CROP), (i * W, 0)); hs.append([[x - CROP[0], y - CROP[1]] for x, y in hands]); row.append(fr.crop(CROP))
            strip.save(os.path.join(OUT, '%s_%s.png' % (view, anim))); hands_all['%s_%s' % (view, anim)] = hs
        rows.append(row)
    json.dump({'w': W, 'h': H, 'hands': hands_all}, open(os.path.join(OUT, 'manos.json'), 'w'))
    if len(sys.argv) > 1:
        n = max(len(r) for r in rows); k = 5
        sh = Image.new('RGBA', (n * W * k, len(rows) * H * k), (74, 86, 70, 255))
        for j, r in enumerate(rows):
            for i, f in enumerate(r): sh.alpha_composite(f.resize((W * k, H * k), Image.NEAREST), (i * W * k, j * H * k))
        sh.save(sys.argv[1])
    print('hecho', W, 'x', H, {k: len(v) for k, v in hands_all.items()})

if __name__ == '__main__': main()
