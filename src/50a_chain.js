// ───────────────────────── La cadena: el disparo de los guanteletes ─────────────────────────
// Portado de tools/chain.py (la maqueta): eslabones que alternan anilla y barra sobre una sola onda suave que arranca recta en el
// puño, y una punta de arpón al final. Todo con una rampa de 5 tonos (contorno, sombra, base, luz, brillo) y un halo de 1 píxel,
// a píxeles enteros. Solo es el aspecto: el disparo pega en el mismo instante y al mismo blanco que antes.
// Un fx 'chain' tiene tramos (segs): el primero sale del puño; con la Gema de cadena se añade otro desde el primer enemigo. Se estira
// tramo a tramo (CH_EXT cada uno), se queda CH_HOLD y se recoge empezando por el último (CH_RET cada uno). La punta va solo en el
// último tramo que queda.
const CH_EXT = 0.06, CH_HOLD = 0.03, CH_RET = 0.07, CH_SP = 3.4, CH_AMP = 1.6;
const chainLife = n => n * (CH_EXT + CH_RET) + CH_HOLD;
const LINK_FACE = ['.kkk.', 'kl.mk', 'kd.dk', '.kkk.'], LINK_H = ['kkkk', 'llmd', 'kkkk'], LINK_V = ['kkk', 'klk', 'kmk', 'kdk', 'kkk'];
const LINK_D1 = ['..kk', '.klk', 'kmdk', 'kdk.', 'kk..'], LINK_D2 = ['kk..', 'klk.', 'kmdk', '.kdk', '..kk'];
const edgeLink = ang => { const a = ((ang * 180 / Math.PI) % 180 + 180) % 180; return a < 22.5 || a >= 157.5 ? LINK_H : a < 67.5 ? LINK_D2 : a < 112.5 ? LINK_V : LINK_D1; };
// Punta de arpón a cualquier ángulo (rombo alargado, cuello y dos lengüetas hacia atrás; luz desde arriba a la izquierda). En caché por dirección.
const HEAD_CACHE = new Map();
function headPixels(ang, L = 11, half = 3) {
  const key = Math.round(ang / (Math.PI / 32)); if (HEAD_CACHE.has(key)) return HEAD_CACHE.get(key);
  const a0 = key * Math.PI / 32, c = Math.cos(a0), s = Math.sin(a0), lit = s - c, out = [];
  for (let y = -15; y <= 15; y++) for (let x = -15; x <= 15; x++) {
    const u = x * c + y * s, v = -x * s + y * c, av = Math.abs(v); let inside = false;
    if (u >= 0 && u <= L) { const w = u < 4 ? 1 + (half - 1) * u / 4 : half * (L - u) / (L - 4); inside = av <= w + 0.25; }
    if (u >= 0.5 && u <= 4.5 && av >= half - 0.3 && av <= half + (4.5 - u) * 0.55) inside = true;   // lengüetas
    if (u >= -2.5 && u < 0 && av <= 1) inside = true;                                                  // cuello
    if (!inside) continue;
    out.push([x, y, u > L - 2.5 && av < 0.8 ? 's' : av < 0.6 ? 'm' : v * lit > 0 ? 'l' : 'd']);
  }
  HEAD_CACHE.set(key, out); return out;
}
// Rampa de 5 tonos y halo a partir del color del disparo
const RAMP_CACHE = new Map();
function chainRamp(col) {
  if (RAMP_CACHE.has(col)) return RAMP_CACHE.get(col);
  const n = parseInt(String(col).replace('#', '').slice(0, 6), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const hsl = (hh, ss, ll) => `hsl(${Math.round(hh)},${Math.round(clamp(ss, 0, 1) * 100)}%,${Math.round(clamp(ll, 0, 1) * 100)}%)`;
  const S0 = s < 0.12 ? 0.14 : Math.max(0.35, s);   // un color casi gris da cadena de acero
  const out = { k: hsl(h, S0 * 0.7, 0.09), d: hsl(h, S0 * 0.85, 0.3), m: hsl(h, S0, 0.5), l: hsl(h, S0, 0.7), s: hsl(h, S0 * 0.6, 0.93), g: hsl(h, Math.min(1, S0 * 1.1), 0.62) };
  RAMP_CACHE.set(col, out); return out;
}
// Un tramo: de (x0, y0) hacia ang, ya estirado length de un total full; head: con punta. Apunta sus píxeles en px (clave "x,y" → tono).
function chainSeg(px, x0, y0, ang, length, full, head, flip) {
  if (length < 1) return;
  const c = Math.cos(ang), s = Math.sin(ang), lam = Math.max(40, full);
  const P = t => { const a = CH_AMP * Math.min(1, t / 10) * Math.min(1, Math.max(0, (length - t) / 6 + 0.35)), off = flip * a * Math.sin(2 * Math.PI * t / lam); return [x0 + c * t - s * off, y0 + s * t + c * off]; };
  const put = (x, y, t) => { px.set(x + ',' + y, t); };
  const stamp = (rows, cx, cy) => { const h = rows.length, w = rows[0].length, ox = Math.round(cx - w / 2), oy = Math.round(cy - h / 2); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = rows[y][x]; if (t !== '.') put(ox + x, oy + y, t); } };
  for (let t = 2, k = 0; t < (head ? length - 5 : length - 1); t += CH_SP, k++) {
    const [ax, ay] = P(t - 0.5), [bx, by] = P(t + 0.5), [cx, cy] = P(t);
    stamp(k % 2 === 0 ? LINK_FACE : edgeLink(Math.atan2(by - ay, bx - ax)), cx, cy);
  }
  if (!head) return;
  const [ax, ay] = P(length - 1), [bx, by] = P(length), [hx, hy] = P(length - 6), ox = Math.round(hx), oy = Math.round(hy);
  const hp = headPixels(Math.atan2(by - ay, bx - ax)), mine = new Set(hp.map(([x, y]) => (ox + x) + ',' + (oy + y)));
  for (const [x, y] of hp) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (ox + x + dx) + ',' + (oy + y + dy); if (!mine.has(q)) px.set(q, 'k'); }   // contorno de la punta
  for (const [x, y, t] of hp) put(ox + x, oy + y, t);
}
function drawChainFx(f) {
  if (f.tether) {   // Dedos de grillete: la cadena sigue al puño y al enemigo; se estira, se queda y se recoge al acabar o si cae
    const e = f.tether; if (!active(e) && f.life - f.t > CH_RET) f.life = f.t + CH_RET;
    const h = heroHand(S.p.face, S.p.punch ? S.p.punch.hand : 'R');
    const v = { segs: [{ x1: h.x, y1: h.y, x2: e.x, y2: e.y }], col: f.col, flip: 1, t: f.t < CH_EXT ? f.t : f.life - f.t < CH_RET ? CH_EXT + CH_HOLD + (CH_RET - (f.life - f.t)) : CH_EXT + 0.001 };
    return drawChainFx(v);
  }
  const segs = f.segs, n = segs.length, ramp = chainRamp(f.col || C.energy), t = f.t, ext = n * CH_EXT, px = new Map();
  for (let i = 0; i < n; i++) {
    const sg = segs[i], full = Math.hypot(sg.x2 - sg.x1, sg.y2 - sg.y1); if (full < 2) continue;
    // cuánto está estirado este tramo: se estira en su turno y se recoge en el suyo, del último al primero
    const out = clamp((t - i * CH_EXT) / CH_EXT, 0, 1), back = clamp((t - ext - CH_HOLD - (n - 1 - i) * CH_RET) / CH_RET, 0, 1);
    const len = full * Math.min(out, 1 - back); if (len < 1) continue;
    chainSeg(px, sg.x1, sg.y1, Math.atan2(sg.y2 - sg.y1, sg.x2 - sg.x1), len, full, i === n - 1, f.flip || 1);
  }
  if (!px.size) return;
  ctx.globalAlpha = 110 / 255; ctx.fillStyle = ramp.g;   // halo de 1 píxel alrededor de todo
  const halo = new Set();
  for (const key of px.keys()) { const [x, y] = key.split(',').map(Number); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = (x + dx) + ',' + (y + dy); if (!px.has(q) && !halo.has(q)) { halo.add(q); ctx.fillRect(x + dx, y + dy, 1, 1); } } }
  ctx.globalAlpha = 1;
  for (const [key, tone] of px) { const i = key.indexOf(','); ctx.fillStyle = ramp[tone]; ctx.fillRect(+key.slice(0, i), +key.slice(i + 1), 1, 1); }
}
