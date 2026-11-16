#!/usr/bin/env python3
"""Maqueta del proyectil de cadena: eslabones que serpentean y una punta de arpón al final.
Todo se pinta con una rampa de 5 tonos (contorno, sombra, base, luz, brillo) + un halo, así que
cambiar de proyectil es cambiar de paleta."""
import json, math, os, sys
from PIL import Image, ImageDraw

def hx(s): s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

PALETAS = {
    'acero':  ['#1b1d2a', '#4a5168', '#8792a8', '#c7d0de', '#ffffff', None],
    'fuego':  ['#3a0f0a', '#a3301a', '#e8661f', '#ffb347', '#fff3b0', '#ff7a2a'],
    'hielo':  ['#0e2338', '#2d6a9a', '#5fb4e0', '#a9e6ff', '#ffffff', '#7fd8ff'],
    'veneno': ['#13240e', '#2f6e1d', '#5fb52f', '#b0f06a', '#f2ffd0', '#8be04a'],
    'sombra': ['#120a1f', '#3b2063', '#6c3fb0', '#a77ae8', '#f0e4ff', '#9a5cff'],
    'rayo':   ['#2a2008', '#9a7a12', '#e8c52a', '#fff07a', '#ffffff', '#ffe45a'],
}

# eslabones: 'k' contorno, 'd' sombra, 'm' base, 'l' luz, 's' brillo
LINK_FACE = [".kkk.",
             "kl.mk",
             "kd.dk",
             ".kkk."]
LINK_H = ["kkkk",
          "llmd",
          "kkkk"]
LINK_V = ["kkk",
          "klk",
          "kmk",
          "kdk",
          "kkk"]
LINK_D1 = ["..kk",       # diagonal que sube
           ".klk",
           "kmdk",
           "kdk.",
           "kk.."]
LINK_D2 = ["kk..",       # diagonal que baja
           "klk.",
           "kmdk",
           ".kdk",
           "..kk"]


def stamp(px, W, H, rows, cx, cy, pal):
    h, w = len(rows), len(rows[0])
    x0, y0 = int(round(cx - w / 2)), int(round(cy - h / 2))
    for y, r in enumerate(rows):
        for x, c in enumerate(r):
            if c in pal and 0 <= x0 + x < W and 0 <= y0 + y < H:
                px[x0 + x, y0 + y] = pal[c]


def edge_link(ang):
    a = (math.degrees(ang) + 360) % 180
    if a < 22.5 or a >= 157.5: return LINK_H
    if a < 67.5: return LINK_D2          # en pantalla, y crece hacia abajo
    if a < 112.5: return LINK_V
    return LINK_D1


def head_pixels(ang, L=11, half=3.0):
    """Punta de arpón rasterizada a cualquier ángulo: hoja en forma de rombo alargado, cuello y dos
    lengüetas hacia atrás. La luz viene siempre de arriba a la izquierda de la pantalla.
    Devuelve {(x, y): tono} relativo al cuello de la punta."""
    out = {}
    c, s = math.cos(ang), math.sin(ang)
    lit = s - c                          # signo de v que mira hacia la luz
    for y in range(-15, 16):
        for x in range(-15, 16):
            u = x * c + y * s
            v = -x * s + y * c
            av = abs(v); inside = False
            if 0 <= u <= L:
                w = 1 + (half - 1) * u / 4 if u < 4 else half * (L - u) / (L - 4)
                inside = av <= w + 0.25
            if 0.5 <= u <= 4.5 and half - 0.3 <= av <= half + (4.5 - u) * 0.55:   # lengüetas
                inside = True
            if -2.5 <= u < 0 and av <= 1.0:                                          # cuello
                inside = True
            if not inside: continue
            if u > L - 2.5 and av < 0.8: t = 's'
            elif av < 0.6: t = 'm'
            elif v * lit > 0: t = 'l'
            else: t = 'd'
            out[(x, y)] = t
    return out


def draw_chain(img, x0, y0, ang, length, phase, pal_name, amp=1.6, lam=None, spacing=3.4, full=None, head=True):
    pal_hex = PALETAS[pal_name]
    pal = {k: hx(v) + (255,) for k, v in zip('kdmls', pal_hex[:5])}
    glow = hx(pal_hex[5]) if pal_hex[5] else None
    W, H = img.size
    layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); px = layer.load()
    c, s = math.cos(ang), math.sin(ang)
    lam = lam or max(40.0, (full or length) * 1.0)     # una sola onda larga a lo largo de la cadena
    def P(t):
        a = amp * min(1.0, t / 10.0) * min(1.0, max(0.0, (length - t) / 6.0 + 0.35))
        off = a * math.sin(2 * math.pi * t / lam - phase)
        return x0 + c * t - s * off, y0 + s * t + c * off
    # eslabones a lo largo de la curva
    t, k = 2.0, 0
    while t < (length - 5 if head else length - 1):
        (ax, ay), (bx, by) = P(t - 0.5), P(t + 0.5)
        tang = math.atan2(by - ay, bx - ax)
        cx, cy = P(t)
        stamp(px, W, H, LINK_FACE if k % 2 == 0 else edge_link(tang), cx, cy, pal)
        t += spacing; k += 1
    if not head: length = -1
    # punta
    (ax, ay), (bx, by) = P(length - 1), P(length)
    tang = math.atan2(by - ay, bx - ax)
    hx_, hy_ = P(length - 6)
    hp = head_pixels(tang) if head else {}
    pts = {(int(round(hx_)) + x, int(round(hy_)) + y): tone for (x, y), tone in hp.items()}
    for (x, y) in list(pts):           # contorno de la punta
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in pts and 0 <= q[0] < W and 0 <= q[1] < H: px[q] = pal['k']
    for (x, y), tone in pts.items():
        if 0 <= x < W and 0 <= y < H: px[x, y] = pal[tone]
    if glow:   # halo de 1 px alrededor de todo
        g = Image.new('RGBA', img.size, (0, 0, 0, 0)); gp = g.load()
        for y in range(H):
            for x in range(W):
                if px[x, y][3]: continue
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                    if 0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3]:
                        gp[x, y] = glow + (110,); break
        img.alpha_composite(g)
    img.alpha_composite(layer)
