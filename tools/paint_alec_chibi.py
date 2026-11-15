#!/usr/bin/env python3
"""Viste a Alec sobre el maniquí en blanco «Free Base 4-Direction Male Character» (CraftPix), que aportó el dueño del juego.

El maniquí trae las proporciones, los ojos y las animaciones hechas por su autor, en capas (sombra, cuerpo, cabeza) y sombreado
con cinco tonos de piel. Aquí se repinta cada zona con el material de Alec manteniendo esas mismas sombras:
  · cabeza: pelo blanco arriba y detrás, pañuelo granate de la nariz para abajo, ojos rojo oscuro con su blanco, y mechones largos;
  · cuerpo: túnica oscura larga (tapa las piernas), cinturón, botas, y guanteletes en las manos.
El paquete no va en el repositorio; solo el resultado. Uso:
  python3 -I tools/paint_alec.py <carpeta PNG del paquete> [muestra.png]
Escribe assets/library/alec/{down,side,up}_{idle,move,atk}.png y manos.json, igual que hacía tools/make_alec.py.
"""
import os, sys, json
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'library', 'alec')
hx = lambda s: tuple(int(s[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

# Rampa de piel del maniquí, de la más oscura a la más clara, y su contorno
SKIN = [hx(c) for c in ('#795048', '#a46f59', '#be865f', '#e1b26e', '#f6ca74')]
LINE = hx('#552d24')
EYE_BLUE, EYE_DARK, EYE_WHITE, EYE_BLACK = hx('#3f6ad4'), hx('#374a8f'), hx('#d2dde8'), hx('#110b00')
EYES = {EYE_BLUE, EYE_DARK, EYE_WHITE, EYE_BLACK}
# Materiales de Alec: cinco tonos (oscuro → claro) y contorno
MAT = {
    'robe': ([hx(c) for c in ('#1b1826', '#232033', '#2d2941', '#3a3552', '#4b4566')], hx('#0f0c15')),
    'hair': ([hx(c) for c in ('#77718f', '#938dae', '#b3aecb', '#d6d2e4', '#f5f2fb')], hx('#3a3550')),
    'mask': ([hx(c) for c in ('#2a0d15', '#3a131e', '#4d1926', '#5e1f2e', '#7d2b3b')], hx('#1a070d')),
    'boot': ([hx(c) for c in ('#271b17', '#352620', '#45322a', '#553d33', '#684b3e')], hx('#150e0b')),
    'metal': ([hx(c) for c in ('#3b3e4a', '#555a69', '#6f7484', '#8e93a1', '#cdd2dc')], hx('#16131b')),
}
BELT, EMBER = hx('#a8823a'), hx('#ffae3d')
CELL, CROP = 64, (13, 10, 51, 48)          # recorte de cada fotograma de 64×64 (el personaje ocupa el centro)

def shade(p):
    """Índice 0..4 del tono de piel, 'line' si es contorno, None si no es piel."""
    if p[3] == 0: return None
    if p[:3] == LINE[:3]: return 'line'
    for i, s in enumerate(SKIN):
        if p[:3] == s[:3]: return i
    return None

def paint(px, x, y, mat):
    sh = shade(px[x, y])
    if sh is None: return
    ramp, line = MAT[mat]
    px[x, y] = line if sh == 'line' else ramp[sh]

def pts(im):
    w, h = im.size; px = im.load()
    return [(x, y) for y in range(h) for x in range(w) if px[x, y][3] > 0]

def frame(body, head, shadow, d):
    """d: 0 abajo, 1 izquierda, 2 derecha, 3 arriba. Devuelve (imagen 64×64, [centros de las manos])."""
    B, Hd = body.copy(), head.copy(); bp, hp = B.load(), Hd.load()
    hpts, bpts = pts(Hd), pts(B)
    # ── Cabeza ──
    eyes = [(x, y) for x, y in hpts if hp[x, y] in EYES]
    hx0, hx1 = min(x for x, _ in hpts), max(x for x, _ in hpts); hy0, hy1 = min(y for _, y in hpts), max(y for _, y in hpts)
    if eyes:
        ey0, ey1 = min(y for _, y in eyes), max(y for _, y in eyes); ex0, ex1 = min(x for x, _ in eyes), max(x for x, _ in eyes)
    for x, y in hpts:
        p = hp[x, y]
        if p == EYE_BLUE: hp[x, y] = hx('#9a1628'); continue          # iris rojo oscuro
        if p == EYE_DARK: hp[x, y] = hx('#5a0d18'); continue
        if p in EYES: continue                                          # blanco y pestaña se quedan
        if d == 3 or not eyes: paint(hp, x, y, 'hair'); continue
        back = (d == 1 and x > ex1 + 1) or (d == 2 and x < ex0 - 1)     # de perfil, la nuca es pelo
        if y < ey0 or back: paint(hp, x, y, 'hair')
        elif y > ey1: paint(hp, x, y, 'mask')                           # de la nariz para abajo, el pañuelo
    # textura: rayas de mechones (un tono más oscuro cada tres columnas, en diagonal) y puntas que asoman por arriba
    hr, hl = MAT['hair']
    for x, y in hpts:
        c = hp[x, y]
        if c in hr and (x + y // 3) % 3 == 0: hp[x, y] = hr[max(0, hr.index(c) - 1)]
    cx0 = (hx0 + hx1) // 2
    for sx, tall in ((cx0 + 1, 2), (hx0 + 3, 1), (hx1 - 2, 1)) if d != 1 else ((cx0 - 1, 2), (hx1 - 3, 1), (hx0 + 2, 1)):   # una punta alta en el centro y dos pequeñas, sin simetría
        top = min((y for x, y in hpts if x == sx), default=None)
        if top is None: continue
        for k in range(1, tall + 1): hp[sx, top - k] = hr[3]
        hp[sx, top - tall - 1] = hl
        for xx in (sx - 1, sx + 1):
            t2 = min((y for x, y in hpts if x == xx), default=None)
            if t2 is not None and hp[xx, t2 - 1][3] == 0: hp[xx, t2 - 1] = hl
    # flequillo: una fila de pelo que cae sobre la frente, por encima de los ojos
    if eyes and d != 3:
        for x in range(ex0 - 1, ex1 + 2):
            if hp[x, ey0 - 1][3] and shade(hp[x, ey0 - 1]) is None and hp[x, ey0 - 1] not in EYES: pass
    # ── Cuerpo ──
    by0, by1 = min(y for _, y in bpts), max(y for _, y in bpts)
    bh = by1 - by0 + 1; waist = by0 + int(bh * 0.5); feet = by1 - 1
    band = [(x, y) for x, y in bpts if by0 + 1 <= y <= by0 + int(bh * 0.62)]
    hands = []
    if band:
        mn, mxx = min(x for x, _ in band), max(x for x, _ in band)
        groups = {'l': [(x, y) for x, y in band if x <= mn + 1], 'r': [(x, y) for x, y in band if x >= mxx - 1]}
        keep = ['l', 'r'] if d in (0, 3) else (['l'] if d == 1 else ['r'])
        for k in keep:
            g = groups[k]
            if not g: continue
            cx = round(sum(x for x, _ in g) / len(g)); cy = round(sum(y for _, y in g) / len(g)); hands.append((cx, cy))
    def near_hand(x, y): return any(abs(x - a) <= 1 and abs(y - b) <= 1 for a, b in hands)
    for x, y in bpts:
        if y >= feet: paint(bp, x, y, 'boot')
        elif near_hand(x, y): paint(bp, x, y, 'metal')
        else: paint(bp, x, y, 'robe')
    # faldón: entre las piernas, de la cintura a los tobillos, la túnica tapa el hueco
    ramp, line = MAT['robe']
    for y in range(waist, feet):
        row = [x for x in range(CELL) if bp[x, y][3] > 0]
        if not row: continue
        a, b = min(row), max(row)
        for x in range(a + 1, b):
            if bp[x, y][3] == 0 or bp[x, y] == line: bp[x, y] = ramp[1 if (x - a) < (b - a) / 2 else 2]
        if a - 1 >= 0 and bp[a - 1, y][3] == 0: bp[a - 1, y] = line
        if bp[b + 1, y][3] == 0: bp[b + 1, y] = line
    # cinturón
    row = [x for x in range(CELL) if bp[x, waist][3] > 0 and bp[x, waist] != line]
    for x in row:
        if not near_hand(x, waist): bp[x, waist] = BELT
    # brasa en los guanteletes
    for cx, cy in hands: bp[cx, cy] = EMBER
    # ── Mechones largos (pelo blanco que cae) ──
    hr, hl = MAT['hair']
    strands = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0)); sp = strands.load()
    def col(x, y0, y1, w, ramp_i):
        for y in range(y0, y1):
            for i in range(w):
                sp[x + i, y] = hr[ramp_i[i % len(ramp_i)]]
            sp[x - 1, y] = hl; sp[x + w, y] = hl
        for i in range(-1, w + 1): sp[x + i, y1] = hl
    if d == 0 and eyes:   # de frente, dos mechones finos junto a la cara que llegan a los hombros
        col(hx0 + 1, ey0, hy1 + 2, 1, [3]); col(hx1 - 1, ey0, hy1 + 2, 1, [2])
    elif d in (1, 2):     # de perfil, la melena cae por la espalda hasta media espalda
        bx = hx1 - 3 if d == 1 else hx0 + 1
        col(bx, hy1 - 3, hy1 + 4, 2, [3, 1] if d == 1 else [1, 3])
    elif d == 3:          # de espaldas, la melena tapa la nuca y media espalda, con raya de mechones
        col(hx0 + 2, hy1 - 2, hy1 + 2, hx1 - hx0 - 3, [3, 2, 3, 1])
    # ── Composición: sombra, cuerpo, mechones por detrás de la cabeza (de espaldas, por encima del cuerpo), cabeza ──
    out = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
    out.alpha_composite(shadow)
    if d == 0: out.alpha_composite(strands)   # de frente, los mechones caen por detrás de los brazos
    out.alpha_composite(B)
    if d in (1, 2): out.alpha_composite(strands)
    out.alpha_composite(Hd)
    if d == 3: out.alpha_composite(strands)
    return out, hands

ANIMS = {   # animación del juego → carpeta del paquete, capa del cuerpo, capa de la cabeza, sombra
    'idle': ('Unarmed_Idle', 'Unarmed_Idle2_body', 'Unarmed_Idle3_head', 'Unarmed_Idle1_shadow'),
    'move': ('Unarmed_Run', 'Unarmed_Run2_body', 'Unarmed_Run3_head', 'Unarmed_Run1_shadow'),
    'atk': ('Sword_attack', 'Sword_attack3_body', 'Sword_attack5_head', 'Sword_attack1_shadow'),   # el golpe de espada sin la espada: un puñetazo hacia delante
}
VIEWS = {'down': 0, 'side': 2, 'up': 3}   # el juego voltea el perfil derecho para mirar a la izquierda
W, H = CROP[2] - CROP[0], CROP[3] - CROP[1]

def main():
    os.makedirs(OUT, exist_ok=True); hands_all = {}; sheet_rows = []
    for view, d in VIEWS.items():
        row = []
        for anim, (folder, lb, lh, ls) in ANIMS.items():
            L = [Image.open(os.path.join(SRC, folder, n + '.png')).convert('RGBA') for n in (lb, lh, ls)]
            n = L[0].width // CELL
            while n and not L[1].crop((( n - 1) * CELL, d * CELL, n * CELL, (d + 1) * CELL)).getbbox(): n -= 1   # algunas tiras traen huecos vacíos al final
            strip = Image.new('RGBA', (W * n, H), (0, 0, 0, 0)); hs = []
            for i in range(n):
                box = (i * CELL, d * CELL, (i + 1) * CELL, (d + 1) * CELL)
                fr, hands = frame(L[0].crop(box), L[1].crop(box), L[2].crop(box), d)
                strip.paste(fr.crop(CROP), (i * W, 0)); hs.append([[x - CROP[0], y - CROP[1]] for x, y in hands]); row.append(fr.crop(CROP))
            strip.save(os.path.join(OUT, '%s_%s.png' % (view, anim))); hands_all['%s_%s' % (view, anim)] = hs
        sheet_rows.append(row)
    json.dump({'w': W, 'h': H, 'hands': hands_all}, open(os.path.join(OUT, 'manos.json'), 'w'))
    if len(sys.argv) > 2:   # hoja de muestra ampliada
        n = max(len(r) for r in sheet_rows); k = 6
        sheet = Image.new('RGBA', (n * W * k, len(sheet_rows) * H * k), (74, 86, 70, 255))
        for j, r in enumerate(sheet_rows):
            for i, f in enumerate(r): sheet.alpha_composite(f.resize((W * k, H * k), Image.NEAREST), (i * W * k, j * H * k))
        sheet.save(sys.argv[2])
    print('hecho', W, 'x', H, {k: len(v) for k, v in hands_all.items()})

if __name__ == '__main__': main()
