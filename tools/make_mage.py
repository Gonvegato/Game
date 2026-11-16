#!/usr/bin/env python3
"""Mago de los guanteletes: pelo rojo en wolf cut, túnica negra y dos guanteletes de metal.

Estética Pixel Crawler: contorno casi negro de 1 px, luz desde arriba a la izquierda, 3-4 tonos por
material, ojos con párpado negro, blanco en dos tonos e iris en dos tonos.
Salida en el formato de assets/library/alec/: tiras {down,up,side}_{idle,move,atk}.png con
fotogramas de 40x40, más manos.json (dónde cae cada puño, para la llama del juego).
Uso: python3 make_mage.py <carpeta_salida>
"""
import json, math, os, sys
from PIL import Image


def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


PAL = {k: hx(v) for k, v in {
    # pelo rojo: sombra, sombra media, base, luz, brillo
    'a': '#4a1219', 'Z': '#6e1c22', 'A': '#9a2727', 'B': '#c9402c', 'C': '#ef7a4a', 'z': '#7a3530',
    # piel
    'S': '#f3c9a5', 'q': '#c67f66', 'Q': '#8e4630',
    # ojos (los mismos tonos que la aldeana del juego)
    'k': '#141412', 'w': '#a7acae', 'W': '#fffcfc', 'I': '#23610e', 'i': '#4cb528',
    # túnica negra: luz, base, sombra, sombra honda; ribete rojo; cinturón y hebilla
    # gabardina negra
    'U': '#4a4864', 'T': '#26242f', 't': '#1a1920', 'u': '#111015',
    # camiseta blanca
    'H': '#eeece8', 'h': '#b8b5c4',
    'Y': '#a8353a', 'y': '#6e2027',
    'b': '#7a4a2c', 'V': '#4e2c1c', 'g': '#f0c04a',
    # guanteletes: brillo, base, sombra, sombra honda
    'N': '#e3eaf2', 'M': '#97a3b8', 'm': '#5f6a84', 'n': '#373e52',
    # pantalón y botas
    'P': '#3c3b48', 'p': '#2a2932', 'O': '#4a3f3c', 'o': '#2c2524',
}.items()}
OUTLINE = hx('#141412')

# Variantes de pelo y ojos (python3 make_mage.py <salida> <variante>)
VARIANTS = {
    'rojo':   {},
    'negro':  {'a': '#1a1924', 'Z': '#25243a', 'A': '#33324c', 'B': '#4c4a6e', 'C': '#7b78a8', 'z': '#3a3442',
               'I': '#4a2a86', 'i': '#a070e8'},
    'blanco': {'a': '#6f7088', 'Z': '#9a9cb2', 'A': '#c4c6d6', 'B': '#e4e6ef', 'C': '#ffffff', 'z': '#9a8e94',
               'I': '#4a2a86', 'i': '#a070e8'},
}
FW = FH = 40

HEAD = {
 'S': [
  "....a.aaaa.a....",
  "...aAaABAAaAa...",
  "..aABCBBAABAAZa.",
  ".aABCBABAAAAAZZa",
  "aABBAAAAAAAAAZZa",
  "aAAAAAAAAAAAAAZa",
  "aAazAqAAAqAAzaAa",
  ".aazSaaSSaaqzaa.",
  "..azkkkSSkkkza..",
  "..aSSwISSIwSSa..",
  "..aqSWiSSiWqqa..",
  "...aqSSSqSqqa...",
  "....aqSSSSqa....",
  "..aZ..qSSq..Za..",
 ],
 'N': [
  "....a.aaaa.a....",
  "...aAaABAAaAa...",
  "..aABCBBAABAAZa.",
  ".aABCBABAAAAAZZa",
  "aABBAAAAAAAAAZZa",
  "aAAAAAAAAAAAAAZa",
  "aAazAABAAAAZzaAa",
  ".aazAAAaAAAZzaa.",
  "..SzAAAaAAAZzS..",
  "..qzAAAaAAZZzq..",
  "..azAAAaAAZZza..",
  "...aAAAaAAZZa...",
  "...aAAAaAZZa....",
  "...aAAaAAZaZa...",
  "....aAa..aZa....",
  "....a.a..a.a....",
 ],
 'E': [
  "...a.aaaaa.a....",

  "..aAaABAAAaAa...",

  ".aABCBBAAAAABAa.",

  "aABCBABAAAABAAAa",

  "aAAAzzzzzAAAAAa.",

  "aAAAAzzzAAAAAaa.",

  "aAAAzzzzaAqAAa..",

  "aAAAzzzzSSaaAa..",

  "aAAAzSqzSSkkkS..",

  "aAAAzSSzSSwISSS.",

  "aAAAazqzqSWiSS..",

  "aAAAAAazqqSSSq..",

  "aAZAAAa...qSq...",

  "..aZAZa.........",

  "..a.aa..........",
 ],
}
HW = 16   # ancho de la cabeza

BODY = {
 'S': ["....UTHHHHtt....",
       "...UTUHHHHUtt...",
       "...UTUHHHHUtt...",
       "...UTUHHHhUtt...",
       "....UUHHHhUt....",
       "....UUHHhhUt....",
       "....UUhhhhUt....",
       "....UUPPPpUt....",
       "...UTUPPPpUtt...",
       "...UTUPPPpUtt...",
       "..UTTUPPPpUttt..",
       "..UTtUPPPpUtut..",
       "..uuTUPPPpUuuu.."],
 'N': ["....UTTTTTtt....",
       "...UTTTTTTTtt...",
       "...UTTTTTTTtt...",
       "...UTTTTTTttt...",
       "....UTTTTTtt....",
       "....UTTTTTtt....",
       "....UTTTTttt....",
       "....UTTTTttt....",
       "...UTTTtTTttt...",
       "...UTTTtTTtut...",
       "..UTTTTtTTtutt..",
       "..UTtTTtTTtutu..",
       "..uuTtTtTTtuuu.."],
 'E': [".....UTTTH......",
       "....UTTTTHH.....",
       "....UTTTTHH.....",
       "....UTTTtHh.....",
       ".....UTTtHh.....",
       ".....UTTtHh.....",
       ".....UTTthh.....",
       ".....UTTtPp.....",
       "....UTTtTPpt....",
       "....UTTtTPpt....",
       "...UTTtTtPpt....",
       "...UTtTTtPpt....",
       "...uuuTttPpu...."],
}
LEG = ["PPp", "PPp", "PPp", "PPp", "OOo", "OOo", "ooo"]
LEG_SIDE = ["PPp", "PPp", "PPp", "PPp", "OOOo", "OOOo", "oooo"]

for d in HEAD:
    assert all(len(r) == HW for r in HEAD[d]), (d, [i for i, r in enumerate(HEAD[d]) if len(r) != HW])
    assert len(BODY[d]) == 13 and all(len(r) == 16 for r in BODY[d]), d

X0 = 12               # columna de las plantillas de 16 dentro del lienzo de 40
LEG_Y = 31            # las botas acaban en la fila 37
TORSO_Y = LEG_Y - 13  # 18
HEAD_Y = TORSO_Y - 13 # 5
HX = 0                # desplazamiento de la cabeza sobre el cuerpo

DARKER = {'N': 'M', 'M': 'm', 'm': 'n', 'n': 'n', 'U': 'T', 'T': 't', 't': 'u',
          'P': 'p', 'O': 'o', 'o': 'o'}


class Layer:
    def __init__(self): self.px = {}
    def put(self, x, y, c):
        if 0 <= x < FW and 0 <= y < FH: self.px[(x, y)] = c
    def stamp(self, rows, x0, y0):
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c != '.': self.put(x0 + x, y0 + y, c)
    def recolor(self, m):
        self.px = {k: m.get(v, v) for k, v in self.px.items()}
        return self
    def merged(self, *others):
        L = Layer(); L.px = dict(self.px)
        for o in others: L.px.update(o.px)
        return L


def draw(img, L):
    """Pinta la capa con su contorno de 1 px por fuera."""
    p = img.load()
    for (x, y) in L.px:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in L.px and 0 <= q[0] < FW and 0 <= q[1] < FH:
                p[q] = OUTLINE + (255,)
    for (x, y), c in L.px.items():
        p[x, y] = PAL[c] + (255,)


# ---------------- guanteletes ----------------
def arm_front(x, y, flip=False, sleeve=5, length=4, slant=0):
    """Brazo visto de frente o de espaldas (3 de ancho). x = columna izquierda.
    Guantelete por placas: borde algo más ancho, junta, placa del antebrazo y nudillos.
    slant: cuántos píxeles se va el puño hacia el centro del cuerpo (brazo que se adelanta al correr)."""
    L = Layer()
    sg = 1 if not flip else -1
    row = (lambda cs: cs) if not flip else (lambda cs: cs[::-1])
    def d(i): return sg * round(slant * i / max(1, length))
    y += 1                               # el hombro cae: la manga empieza por debajo de la línea del cuello
    for i in range(sleeve):
        for k, c in enumerate(row(['U', 'T', 't'])):
            if i == 0 and k == (0 if not flip else 2): continue     # hombro redondeado por fuera
            L.put(x + k, y + i, c)
    cy = y + sleeve
    ox = -1 if not flip else 0          # el borde sobresale un píxel hacia fuera
    for k, c in enumerate(row(['N', 'N', 'M', 'm'])): L.put(x + ox + k + d(0), cy, c)
    for i in range(1, length):
        cs = ['m', 'm', 'n'] if i == 1 else (['N', 'M', 'm'] if i in (2, 3) else ['M', 'M', 'm'])
        for k, c in enumerate(row(cs)): L.put(x + k + d(i), cy + i, c)
        if d(i) != d(i - 1):            # rellena el escalón de la diagonal
            L.put(x + 1 + d(i - 1), cy + i, row(cs)[1])
    for k, c in enumerate(row(['N', 'm', 'n'])): L.put(x + k + d(length), cy + length, c)   # nudillos
    return L, (x + 1 + d(length), cy + length)


RUN_ARM_R = [2, 1, -1, -2, -1, 1]       # brazo derecho: + adelante, - atrás (el izquierdo, al revés)


def run_front(view, i, img, hands):
    """Carrera de frente (S) o de espaldas (N) con los brazos balanceándose de verdad."""
    bob = RUN_BOB[i]; ty = TORSO_Y + bob
    ly, ry = RUN_LY[i], RUN_RY[i]
    lx = 1 if ly < -1 else 0; rx = -1 if ry < -1 else 0
    back_l = (ly < -1) if view == 'S' else (ly > 0)
    back_r = (ry < -1) if view == 'S' else (ry > 0)
    lL = leg_layer(LEG, X0 + 4 + lx, LEG_Y + ly, back=back_l)
    lR = leg_layer(LEG, X0 + 9 + rx, LEG_Y + ry, back=back_r)
    body = body_layer(view, X0, ty, RUN_SWAY[i])
    head = head_layer(view, X0, HEAD_Y + bob, 'move', bob)
    arms_back, arms_front = [], []
    for side, ph in (('L', -RUN_ARM_R[i]), ('R', RUN_ARM_R[i])):
        vis = ph if view == 'S' else -ph      # de espaldas, el brazo que se adelanta se aleja de la cámara
        flip = side == 'R'
        bx = X0 + 1 if side == 'L' else X0 + 12
        out = -1 if side == 'L' else 1
        if vis > 0:
            L, h = arm_front(bx, ty + 1 + (1 if vis == 2 else 0), flip=flip, slant=3 if vis == 2 else 1)
            arms_front.append((L, h))
        elif vis < 0:
            L, h = arm_front(bx + (out if vis == -2 else 0), ty, flip=flip, sleeve=3 if vis == -1 else 2, length=3 if vis == -1 else 2)
            if vis == -2: L.recolor(DARKER)
            arms_back.append((L, h))
        else:
            arms_front.append(arm_front(bx, ty + 1, flip=flip))
    for L, h in arms_back: draw(img, L); hands.append(h)
    draw(img, lL.merged(lR, body))
    draw(img, head)
    for L, h in arms_front: draw(img, L); hands.append(h)


def arm_side(x, y, swing=0):
    """Brazo de perfil (3 de ancho). swing >= 2: codo doblado con el antebrazo hacia delante;
    swing < 0: el brazo se va hacia atrás."""
    L = Layer()
    for i in range(3):
        for k, c in enumerate(['U', 'T', 't']):
            if i == 0 and k == 0: continue                         # hombro redondeado
            L.put(x + k, y + i, c)
    if swing >= 2:                                   # antebrazo horizontal, puño delante
        for k, c in enumerate(['U', 'T', 't']): L.put(x + k, y + 3, c)
        n = swing + 1
        for j in range(n):
            for r, c in enumerate(['N' if 0 < j < n - 1 else 'M', 'M', 'm']): L.put(x + 1 + j, y + 4 + r, c)
        fx = x + 1 + n
        for r, c in enumerate(['M', 'm', 'n']): L.put(fx, y + 4 + r, c)
        for k, c in enumerate(['m', 'm']): L.put(x + k, y + 4 + k, 'm')
        return L, (fx, y + 6)
    s = max(-4, min(1, swing))
    for i in range(3, 5):                                          # manga más larga
        for k, c in enumerate(['U', 'T', 't']): L.put(x + k + (s * (i - 2)) // 6, y + i, c)
    for k, c in enumerate(['N', 'N', 'M', 'm']): L.put(x - 1 + k + s // 2, y + 5, c)
    for i in range(6, 9):
        o = s if i >= 7 else s // 2
        for k, c in enumerate(['N' if i == 7 else 'M', 'M', 'm']): L.put(x + k + o, y + i, c)
    for k, c in enumerate(['N', 'm', 'n']): L.put(x + k + s, y + 9, c)
    return L, (x + 1 + s, y + 9)


def arm_punch_side(x, y, length=8):
    """Brazo de perfil estirado hacia la derecha. y = fila del hombro."""
    L = Layer()
    for i in range(length):
        xx = x + i
        if i < 5:    cs = ['U', 'T', 't']; y0 = y
        elif i == 5: cs = ['N', 'N', 'M', 'm']; y0 = y - 1
        elif i == 6: cs = ['m', 'm', 'n']; y0 = y          # junta
        else:        cs = ['N', 'M', 'm']; y0 = y
        for r, c in enumerate(cs): L.put(xx, y0 + r, c)
    fx = x + length
    for j, cs in enumerate([['N', 'M', 'M', 'm'], ['M', 'm', 'N', 'n']]):
        for r, c in enumerate(cs): L.put(fx + j, y - 1 + r, c)
    return L, (fx + 1, y)


def arm_punch_up(x, y_shoulder, reach):
    """Brazo estirado hacia el fondo (puñetazo de espaldas): sube junto a la cabeza."""
    L = Layer(); top = y_shoulder - reach
    for yy in range(y_shoulder - 4, y_shoulder + 2):
        for k, c in enumerate(['t', 'T', 'U']): L.put(x + k, yy, c)
    for k, c in enumerate(['m', 'M', 'N', 'N']): L.put(x - 1 + k, y_shoulder - 5, c)
    for yy in range(top + 2, y_shoulder - 5):
        cs = ['n', 'm', 'm'] if yy == top + 3 else ['m', 'M', 'N']
        for k, c in enumerate(cs): L.put(x + k, yy, c)
    for yy in range(top, top + 2):
        for k, c in enumerate(['m', 'M', 'N']): L.put(x + k, yy, c)
    for k, c in enumerate(['n', 'N', 'm']): L.put(x + k, top, c)
    return L, (x + 1, top)


FIST_BIG = [".NNMm.",
            "NMNMMm",
            "MmMmMm",
            "NNNMmm",
            ".mmmn."]
FIST_SMALL = [".NMm.",
              "NmMmm",
              "MMMmm",
              ".mmn."]
CUFF_BIG = ["NNNMMmmm",
            ".mmmmmn."]
CUFF_SMALL = ["NNMMmm",
              ".mmmn."]


def fist_front(cx, cy, big=True):
    """Puño visto de frente, viniendo hacia la cámara: se ven los nudillos, los dedos y el pulgar,
    con el borde del guantelete asomando alrededor de la muñeca."""
    t = FIST_BIG if big else FIST_SMALL; cu = CUFF_BIG if big else CUFF_SMALL
    x0, y0 = cx - len(t[0]) // 2, cy - len(t) // 2
    cuff = Layer(); cuff.stamp(cu, cx - len(cu[0]) // 2, y0 - 1)
    fist = Layer(); fist.stamp(t, x0, y0)
    return cuff, fist, (cx, y0)


# ---------------- fotogramas ----------------
ATK_POSE = ['ready', 'wind', 'wind', 'hit', 'hit', 'hit2', 'back', 'ready']
RUN_LY = [1, 0, -1, -2, -1, 0]           # altura de cada pie al correr (de frente): + adelante, - levantado
RUN_RY = [-2, -1, 0, 1, 0, -1]
RUN_BOB = [0, -1, -1, 0, -1, -1]
RUN_SWAY = [1, 1, 0, -1, -1, 0]


def clamp1(v): return max(-1, min(1, v))


HAIR = set('aZABCz')


def head_layer(view, x, y, anim, bob, lag_x=0, idle_i=None):
    """Cabeza; las puntas del pelo (filas 12 en adelante) llegan tarde a los movimientos."""
    L = Layer(); rows = HEAD[view]
    x += HX
    L.stamp(rows, x, y)
    lag_y = 1 if (anim == 'move' and bob < 0) else 0
    if idle_i is not None:
        lag_y = [0, 0, -1, 0][idle_i]
        if view == 'E': lag_x = [0, 0, 0, -1][idle_i]
    if not (lag_x or lag_y): return L
    tips = [(x + xx, y + k, c) for k in range(11, len(rows)) for xx, c in enumerate(rows[k]) if c in HAIR]
    if lag_y <= 0:                        # se mueven: quitar las originales
        for px, py, _ in tips: L.px.pop((px, py), None)
    face = {p for p, c in L.px.items() if c not in HAIR}
    for px, py, c in tips:
        q = (px + lag_x, py + lag_y)
        if q not in face: L.put(q[0], q[1], c)
    return L


def body_layer(view, x, y, sway=0):
    L = Layer()
    for r, row in enumerate(BODY[view]):
        L.stamp([row], x + (sway if r >= 10 else 0), y + r)
    return L


def leg_layer(rows, x, y, back=False):
    L = Layer(); L.stamp(rows, x, y)
    if back: L.recolor(DARKER)
    return L


def frame(view, anim, i):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    hands = []
    pose = ATK_POSE[i] if anim == 'atk' else None
    bob = 0; lean = 0; sway = 0
    if anim == 'idle': bob = [0, 0, 1, 1][i]
    elif anim == 'move': bob = RUN_BOB[i]; sway = RUN_SWAY[i]
    else: bob = 1 if pose == 'wind' else 0
    ty = TORSO_Y + bob

    if view in 'SN' and anim == 'move':
        run_front(view, i, img, hands)
    elif view in 'SN':
        # piernas
        if anim == 'move':
            ly, ry = RUN_LY[i], RUN_RY[i]
        elif pose in ('hit', 'hit2'):
            ly, ry = 1, -1
        else:
            ly = ry = 0
        lx = 1 if ly < -1 else 0; rx = -1 if ry < -1 else 0
        lL = leg_layer(LEG, X0 + 4 + lx, LEG_Y + ly, back=ly < -1)
        lR = leg_layer(LEG, X0 + 9 + rx, LEG_Y + ry, back=ry < -1)
        body = body_layer(view, X0, ty, sway)
        if view == 'N':   # de espaldas, la pierna «adelantada» es la que se aleja
            lL = leg_layer(LEG, X0 + 4 + lx, LEG_Y + ly, back=ly > 0)
            lR = leg_layer(LEG, X0 + 9 + rx, LEG_Y + ry, back=ry > 0)
        draw(img, lL.merged(lR, body))

        # brazos
        if anim == 'move':
            dl, dr = clamp1(ry), clamp1(ly)            # brazo contrario a la pierna
        else:
            dl = dr = 0
        def arm_l(d): return arm_front(X0 + 1 + (1 if d > 0 else 0), ty + 1 + d, sleeve=5 if d >= 0 else 4)
        def arm_r(d): return arm_front(X0 + 12 - (1 if d > 0 else 0), ty + 1 + d, flip=True, sleeve=5 if d >= 0 else 4)
        head = head_layer(view, X0, HEAD_Y + bob, anim, bob, idle_i=i if anim == 'idle' else None)
        if view == 'S':
            draw(img, head)
            if anim != 'atk':
                (al, hl), (ar, hr) = arm_l(dl), arm_r(dr)
                draw(img, al); draw(img, ar); hands += [hl, hr]
            else:
                al, hl = arm_front(X0 + 1, ty, length=3)             # el izquierdo, en guardia
                draw(img, al); hands.append(hl)
                if pose in ('ready', 'back'):
                    ar, hr = arm_r(0)
                elif pose == 'wind':
                    ar, hr = arm_front(X0 + 13, ty - 1, flip=True, sleeve=4, length=3)
                else:
                    sl = Layer()
                    for yy in range(ty + 2, ty + 5):
                        for k, c in enumerate(['T', 'T', 't']): sl.put(X0 + 11 + k, yy, c)
                    for yy in range(ty + 5, ty + 7):
                        for k, c in enumerate(['U', 'T', 't']): sl.put(X0 + 10 + k, yy, c)
                    cuff, fl, hr = fist_front(X0 + 9, ty + 10 + (0 if pose == 'hit' else -1), big=pose == 'hit')
                    draw(img, sl.merged(cuff)); ar = fl
                draw(img, ar); hands.append(hr)
        else:  # N
            if anim != 'atk':
                (al, hl), (ar, hr) = arm_l(-dl), arm_r(-dr)
                draw(img, head); draw(img, al); draw(img, ar); hands += [hl, hr]
            else:
                al, hl = arm_front(X0 + 1, ty + 1); hands.append(hl)
                if pose in ('hit', 'hit2'):
                    draw(img, head); draw(img, al)
                    ar, hr = arm_punch_up(X0 + 12, ty + 2, 11 if pose == 'hit' else 9)
                else:
                    w = pose == 'wind'
                    draw(img, head); draw(img, al)
                    ar, hr = arm_front(X0 + 12 + w, ty + 1 - w, flip=True, sleeve=5 - w)
                draw(img, ar); hands.append(hr)
    else:  # perfil, mirando a la derecha
        a = i / 6 * 2 * math.pi
        if anim == 'move':
            lean = 1
            ns = round(4 * math.cos(a)); fs = -ns
            nl = max(0, round(2 * math.sin(a))); fl = max(0, round(2 * math.sin(a + math.pi)))
            near, far = (ns, -nl), (fs, -fl)
            arm_sw = max(-4, min(4, -round(5 * math.cos(a))))
        elif pose in ('hit', 'hit2'):
            lean = 1; near, far = (2, 0), (-3, 0); arm_sw = 0
        elif pose == 'wind':
            lean = -1; near, far = (0, 0), (-1, 0); arm_sw = -3
        else:
            near, far = (1, 0), (-1, 0); arm_sw = 1 if anim == 'atk' else 0
        bx = X0 + lean
        # brazo lejano (detrás del cuerpo, más oscuro): solo se ve al balancearse
        if anim == 'move':
            fa, _ = arm_side(bx + 6, ty + 1, swing=-arm_sw)
            draw(img, fa.recolor(DARKER))
        draw(img, leg_layer(LEG_SIDE, bx + 5 + far[0], LEG_Y + far[1], back=True))
        body = body_layer(view, bx, ty, -1 if anim == 'move' and i % 3 else 0)
        draw(img, leg_layer(LEG_SIDE, bx + 7 + near[0], LEG_Y + near[1]).merged(body))
        draw(img, head_layer(view, bx, HEAD_Y + bob, anim, bob, lag_x=-1 if (anim == 'move' or pose in ('hit', 'hit2')) else 0, idle_i=i if anim == 'idle' else None))
        if pose in ('hit', 'hit2'):
            g, h = arm_punch_side(bx + 7, ty + 2, length=9 if pose == 'hit' else 8)
        else:
            g, h = arm_side(bx + 7 - (1 if pose == 'wind' else 0), ty + 1, swing=arm_sw)
        draw(img, g); hands.append(h)
    return img, hands



# ================= Combo de puñetazos alternos (atk): derecha 0-3, izquierda 4-7 =================
# Brazos articulados: hombro -> codo (manga) -> muñeca (guantelete) -> puño.
def limb(L, a, b, w, ramp):
    """Segmento grueso de a a b con luz desde arriba a la izquierda. ramp = (luz, base, sombra)."""
    (ax, ay), (bx, by) = a, b
    dx, dy = bx - ax, by - ay; ln = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / ln, dx / ln
    lit = 1 if (nx * -1 + ny * -1) > 0 else -1
    r = w / 2
    for y in range(int(min(ay, by) - r - 1), int(max(ay, by) + r + 2)):
        for x in range(int(min(ax, bx) - r - 1), int(max(ax, bx) + r + 2)):
            px, py = x + 0.5 - ax, y + 0.5 - ay
            t = max(0.0, min(1.0, (px * dx + py * dy) / (ln * ln)))
            qx, qy = px - dx * t, py - dy * t
            if qx * qx + qy * qy > r * r: continue
            v = qx * nx + qy * ny
            c = ramp[1] if abs(v) < 0.5 else (ramp[0] if v * lit > 0 else ramp[2])
            L.put(x, y, c)


def arm(sh, el, wr, fist='side', big=False):
    """Brazo entero. fist: 'side' (puño de perfil), 'front' (viene hacia la cámara), 'up' (se aleja)."""
    L = Layer()
    limb(L, sh, el, 3.2, ('U', 'T', 't'))
    dx, dy = wr[0] - el[0], wr[1] - el[1]; ln = math.hypot(dx, dy) or 1.0; ux, uy = dx / ln, dy / ln
    limb(L, el, wr, 2.6 if fist == 'front' else 3.0, ('N', 'M', 'm'))               # antebrazo de metal
    limb(L, (el[0] + ux * 0.5, el[1] + uy * 0.5), (el[0] + ux * 1.6, el[1] + uy * 1.6), 4.4, ('N', 'N', 'm'))   # borde del guantelete
    if fist == 'front':
        t = FIST_BIG if big else FIST_SMALL
        L.stamp(t, int(round(wr[0] - len(t[0]) / 2)), int(round(wr[1] - len(t) / 2)))
        return L, (int(round(wr[0])), int(round(wr[1] - len(t) / 2)))
    f = (wr[0] + ux * 1.6, wr[1] + uy * 1.6)
    limb(L, wr, f, 3.8, ('N', 'M', 'm'))
    L.put(int(round(f[0] + ux * 0.6)), int(round(f[1] + uy * 0.6)), 'n')            # nudillos
    return L, (int(round(f[0])), int(round(f[1])))


def P(base, pt, mirror=False):
    x, y = pt
    return (base[0] + (15 - x if mirror else x), base[1] + y)


# poses del brazo derecho de la pantalla (vista de frente); el izquierdo es el espejo
FRONT = {
    'guard':  ((12, 2), (14, 8), (12, 4), 'front', False),
    'wind':   ((12, 1), (15, 5), (15, 2), 'front', False),
    'strike': ((11, 2), (10, 5), (9, 8), 'front', True),
    'hold':   ((11, 2), (11, 5), (10, 8), 'front', False),
    'chamber': ((12, 2), (14, 7), (13, 9), 'side', False),
}
BACK = {
    'guard':  ((12, 2), (14, 7), (12, 5), 'side', False),
    'wind':   ((12, 2), (15, 6), (14, 9), 'side', False),
    'strike': ((12, 1), (13, -4), (13, -9), 'up', False),
    'hold':   ((12, 1), (13, -3), (13, -7), 'up', False),
    'chamber': ((12, 2), (14, 7), (13, 10), 'side', False),
}
SIDE_NEAR = {
    'guard':  ((8, 2), (8, 8), (12, 6)),
    'wind':   ((7, 2), (5, 7), (8, 7)),
    'strike': ((9, 2), (13, 2), (17, 2)),
    'hold':   ((9, 2), (12, 3), (16, 3)),
    'chamber': ((7, 2), (5, 7), (8, 8)),
}
SIDE_FAR = {
    'guard':  ((6, 2), (7, 8), (11, 5)),
    'wind':   ((5, 2), (4, 7), (7, 6)),
    'strike': ((7, 1), (11, 1), (16, 1)),
    'hold':   ((7, 1), (10, 2), (15, 2)),
    'chamber': ((5, 2), (4, 7), (7, 7)),
}
# fotograma -> (pose brazo derecho/cercano, pose brazo izquierdo/lejano, giro del cuerpo)
COMBO = [('wind', 'guard', 1), ('strike', 'chamber', -1), ('hold', 'chamber', -1), ('guard', 'guard', 0),
         ('guard', 'wind', -1), ('chamber', 'strike', 1), ('chamber', 'hold', 1), ('guard', 'guard', 0)]
LANZA = {1: 1, 5: 0}     # fotograma en que sale la cadena -> índice del puño en «hands» (0 izquierdo/lejano, 1 derecho/cercano)


def frame_combo(view, i):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    pr, pl, tw = COMBO[i]
    striking = pr in ('strike', 'hold') or pl in ('strike', 'hold')
    bob = 0 if striking else (1 if 'wind' in (pr, pl) else 0)
    ty = TORSO_Y + bob
    hands = [None, None]
    if view in 'SN':
        x = X0 + (tw if view == 'S' else -tw)
        # paso: adelanta la pierna contraria al brazo que golpea
        ly, ry = (1, -1) if pr in ('strike', 'hold') else ((-1, 1) if pl in ('strike', 'hold') else (0, 0))
        if view == 'N': ly, ry = -ly, -ry
        lL = leg_layer(LEG, X0 + 4, LEG_Y + max(0, ly) - max(0, -ly) // 2, back=ly < 0)
        lR = leg_layer(LEG, X0 + 9, LEG_Y + max(0, ry) - max(0, -ry) // 2, back=ry < 0)
        body = body_layer(view, x, ty)
        head = head_layer(view, x, HEAD_Y + bob, 'atk', bob, lag_x=(-tw if striking else 0) if view == 'S' else 0)
        T = FRONT if view == 'S' else BACK
        def mk(pose, mirror):
            sh, el, wr, ft, big = T[pose]
            base = (x, ty)
            L, h = arm(P(base, sh, mirror), P(base, el, mirror), P(base, wr, mirror), ft, big)
            if pose == 'chamber' and view == 'S': L.recolor(DARKER)
            return L, h
        def mk_front(pose, side):
            # vista de frente: los brazos que no golpean se leen mejor rectos (como al correr); el que golpea
            # cruza el pecho desde el hombro y el puño viene hacia la cámara
            flip = side == 'R'
            ax = x + 12 if flip else x + 1
            sg = -1 if flip else 1
            if pose == 'guard':   return arm_front(ax, ty, flip=flip, sleeve=4, length=3, slant=2)
            if pose == 'wind':    return arm_front(ax - sg, ty - 1, flip=flip, sleeve=4, length=3)
            if pose == 'chamber':
                L, h = arm_front(ax - sg, ty - 1, flip=flip, sleeve=3, length=2); L.recolor(DARKER); return L, h
            big = pose == 'strike'
            L = Layer()
            sh = (x + (12.5 if flip else 2.5), ty + 2.5)
            fx_ = x + (9 if flip else 6) + (0 if big else (1 if flip else -1))
            fy_ = ty + (9 if big else 8)
            limb(L, sh, (fx_ + (1.5 if flip else -1.5) * 0, fy_ - 3), 3.2, ('U', 'T', 't'))
            cuff, fist, h = fist_front(fx_, fy_, big=big)
            return cuff.merged(L, fist), h
        if view == 'S':
            aR, hR = mk_front(pr, 'R'); aL, hL = mk_front(pl, 'L')
        else:
            aR, hR = mk(pr, False); aL, hL = mk(pl, True)
        hands = [hL, hR]
        if view == 'S':
            draw(img, lL.merged(lR, body)); draw(img, head)
            order = sorted([(aR, pr), (aL, pl)], key=lambda a: {'chamber': 0, 'guard': 1, 'wind': 1, 'hold': 2, 'strike': 3}[a[1]])
            for L, _ in order: draw(img, L)
        else:
            behind = [L for L, p in ((aR, pr), (aL, pl)) if p == 'guard']
            front = [L for L, p in ((aR, pr), (aL, pl)) if p in ('wind', 'chamber')]
            up = [L for L, p in ((aR, pr), (aL, pl)) if p in ('strike', 'hold')]
            for L in behind: draw(img, L)
            draw(img, lL.merged(lR, body))
            for L in up: draw(img, L)    # de espaldas, el puño que golpea se aleja de la cámara: pasa por detrás de la cabeza
            draw(img, head)
            for L in front: draw(img, L)
    else:
        lean = 1 if striking else (-1 if 'wind' in (pr, pl) else 0)
        bx = X0 + lean
        near, far = ((2, 0), (-3, 0)) if striking else (((0, 0), (-1, 0)) if lean < 0 else ((1, 0), (-1, 0)))
        def mk(T, pose, dark=False):
            sh, el, wr = T[pose]
            L, h = arm(P((bx, ty), sh), P((bx, ty), el), P((bx, ty), wr), 'side')
            if dark: L.recolor(DARKER)
            return L, h
        aF, hF = mk(SIDE_FAR, pl, True); aN, hN = mk(SIDE_NEAR, pr)
        hands = [hF, hN]
        draw(img, aF)                                                     # brazo lejano, detrás del cuerpo
        draw(img, leg_layer(LEG_SIDE, bx + 5 + far[0], LEG_Y + far[1], back=True))
        body = body_layer(view, bx, ty)
        draw(img, leg_layer(LEG_SIDE, bx + 7 + near[0], LEG_Y + near[1]).merged(body))
        draw(img, head_layer(view, bx, HEAD_Y + bob, 'atk', bob, lag_x=-1 if striking else 0))
        draw(img, aN)
    return img, hands


VIEWS = {'down': 'S', 'up': 'N', 'side': 'E'}
NFR = {'idle': 4, 'move': 6, 'atk': 8}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    var = sys.argv[2] if len(sys.argv) > 2 else 'negro'
    PAL.update({k: hx(v) for k, v in VARIANTS[var].items()})
    os.makedirs(out, exist_ok=True)
    manos = {'w': FW, 'h': FH, 'hands': {}}
    for vname, v in VIEWS.items():
        for anim, n in NFR.items():
            strip = Image.new('RGBA', (FW * n, FH), (0, 0, 0, 0))
            hs = []
            for i in range(n):
                f, h = frame_combo(v, i) if anim == 'atk' else frame(v, anim, i)
                strip.alpha_composite(f, (FW * i, 0))
                hs.append([list(p) for p in h])
            strip.save(os.path.join(out, f'{vname}_{anim}.png'))
            manos['hands'][f'{vname}_{anim}'] = hs
    manos['lanza'] = {f'{vn}_atk': {str(k): v for k, v in LANZA.items()} for vn in VIEWS}
    json.dump(manos, open(os.path.join(out, 'manos.json'), 'w'))
    print('ok')
