#!/usr/bin/env python3
# Empaqueta en una sola imagen los fotogramas que el juego usa del CHARACTER MEGAPACK (overboy, itch.io).
# Uso: python3 -I tools/pack_atlas.py   → assets/chars.png y src/48_atlas.js
# Lee de la biblioteca sin pérdida (assets/library/megapack.png + .json), que guarda el paquete entero; ya no hace falta el zip.
import sys, os, json
from PIL import Image
LIB = json.load(open('assets/library/megapack.json'))['chars']; LIBIMG = Image.open('assets/library/megapack.png').convert('RGBA')
# clave del juego → (carpeta, {animación del juego: (sufijo de carpeta, máx. fotogramas, fps)})
CAST = {
  'stalker': ('Goblin_Regular_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 10, 12), 'atk': ('ATK_Full', 10, 18)}),
  'runner': ('Mimic_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Move', 14, 20), 'atk': ('Dash_Full', 14, 24)}),
  'brute': ('Orc_Barbare_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 5, 7), 'atk': ('ATK_Full', 12, 14)}),
  'mage': ('Sorcerer_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Begin', 10, 14)}),
  'bomber': ('Goblin_Barrel_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 10, 12), 'atk': ('ATK_Full', 10, 14)}),
  'leaper': ('FrogMonster', {'idle': ('Idle', 2, 3), 'move': ('Idle', 2, 4), 'atk': ('Jump', 14, 20)}),
  'sniper': ('Orc_Archer_01 (Green Skinned)', {'idle': ('Idle', 1, 1), 'move': ('Move', 6, 10), 'atk': ('Prepare', 11, 12)}),
  'shaman': ('Mushroom', {'idle': ('Idle', 2, 3), 'move': ('Idle', 2, 4), 'atk': ('Spell_Loop', 14, 14)}),
  'lancer': ('RhinoMonster_01_Regular', {'idle': ('Idle', 1, 1), 'move': ('Move', 8, 12), 'atk': ('Charge_RunLoop', 6, 16)}),
  'bat': ('Vampire_Archer_01', {'idle': ('Idle', 2, 3), 'move': ('Move', 10, 16), 'atk': ('ATK', 8, 16)}),
  'champ': ('MonsterSlasher_01', {'idle': ('Idle', 2, 3), 'move': ('Move', 10, 14), 'atk': ('ATK2', 8, 16)}),
  'guardian': ('Dummy_LVL4', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 14, 14)}),
  'matriarch': ('FrogBoss', {'idle': ('Idle', 2, 3), 'move': ('Move_Full', 11, 12), 'atk': ('Burp', 4, 8)}),
  'colossus': ('Mimic_LVL4', {'idle': ('Idle', 8, 8), 'move': ('Move', 8, 10), 'atk': ('Dash_Full', 14, 14)}),
  'nameless': ('Sorcerer_LVL4', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 10, 12)}),
  'firstfist': ('GameMaster', {'idle': ('Idle', 12, 10), 'move': ('Idle', 12, 10), 'atk': ('ATK', 16, 14)}),
}
# ── Variantes: mismo papel, otro aspecto según la zona, el rasgo de élite o la deidad ──
def gob(n, c): return (n + ' (' + c + ' Skinned)')
for suf, n, c in (('_b', '02', 'Blue'), ('_r', '03', 'Red')):
    CAST['stalker' + suf] = (gob('Goblin_Regular_' + n, c), CAST['stalker'][1])
    CAST['bomber' + suf] = (gob('Goblin_Barrel_' + n, c), CAST['bomber'][1])
    CAST['brute' + suf] = (gob('Orc_Barbare_' + n, c), CAST['brute'][1])
    CAST['sniper' + suf] = (gob('Orc_Archer_' + n, c), CAST['sniper'][1])
for suf, f in (('silver', '02_Silver'), ('gold', '03_Gold'), ('devil', '04_Devil'), ('orc', '05_Orc'), ('red', '06_OrcRedSkinned'), ('frozen', '07_Frozen'), ('bio', '08_Bioluminescent'), ('rad', '09_Radioactive'), ('oniric', '10_Oniric')):
    CAST['lancer_' + suf] = ('RhinoMonster_' + f, CAST['lancer'][1])
CAST.update({
  'stalker_ent': ('Ent_LVL1', {'idle': ('Idle', 4, 4), 'move': ('Move', 9, 12), 'atk': ('Dash_Full', 6, 14)}),
  'brute_ent': ('Ent_LVL2', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 10), 'atk': ('Dash_Full', 10, 14)}),
  'brute_ent3': ('Ent_LVL3', {'idle': ('Idle', 2, 3), 'move': ('Move', 9, 10), 'atk': ('Dash_Full', 8, 12)}),
  'champ_wood': ('Ent_LVL4', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 11, 14)}),
  'bat_fly': ('Monsterfly_01', {'idle': ('Idle', 4, 6), 'move': ('Move', 8, 14), 'atk': ('ATK', 6, 14)}),
  'runner_2': ('Mimic_LVL2', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 20), 'atk': ('Dash_Full', 10, 20)}),
  'bomber_mimic': ('Mimic_LVL3', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 14), 'atk': ('Dash_Begin', 2, 8)}),
  'sniper_cyc': ('Cyclop_Archer_01', {'idle': ('Idle', 2, 3), 'move': ('Move', 8, 10), 'atk': ('Prepare', 7, 10)}),
  'mage_2': ('Sorcerer_LVL2', {'idle': ('Idle', 4, 5), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 10, 14)}),
  'mage_3': ('Sorcerer_LVL3', {'idle': ('Idle', 4, 5), 'move': ('Move', 12, 12), 'atk': ('Dash_Full', 8, 12)}),
  # objetos y gente
  'decoy': ('Dummy_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Idle', 2, 3)}),
  'post': ('Dummy_LVL2', {'idle': ('Idle', 2, 3), 'move': ('Idle', 2, 3), 'atk': ('Spinning', 8, 12)}),
  'turret': ('Dummy_LVL3', {'idle': ('Idle', 2, 3), 'move': ('Spinning', 12, 14)}),
  'villager': ("@Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Npc's/Citizen_F/Tavern_B", {'idle': ('Idle/Idle_Side-Sheet.png', 4, 5), 'move': ('Walk/Walk_Side-Sheet.png', 6, 9)}),   # antes la enana Dwarfette
  'smith': ('@Pixel_Crawler_-_Cemetery_0.4/Entities/Characters/A_Hunter', {'idle': ('Idle_Base/Idle_Side-Sheet.png', 4, 5), 'move': ('Walk_Base/Walk_Side-Sheet.png', 6, 9)}),   # la herrera: cuero y sombrero
  'trainer': ("@Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Npc's/Knight", {'idle': ('Idle/Idle-Sheet.png', 4, 5), 'move': ('Run/Run-Sheet.png', 6, 10)}),   # la instructora, con armadura
  'guard': ('@Pixel_Crawler_-_Castle_Environment_0.3/Enemies/Royal Crew/Soldier', {'idle': ('Idle-Sheet.png', 4, 5), 'move': ('Run-Sheet.png', 6, 10)}),
  'guard_k': ('@Pixel_Crawler_-_Castle_Environment_0.3/Enemies/Royal Crew/Knight', {'idle': ('Idle-Sheet.png', 4, 5), 'move': ('Run-Sheet.png', 6, 10)}),
  'priest': ('@Pixel_Crawler_-_Castle_Environment_0.3/Enemies/Royal Crew/Priest', {'idle': ('Idle-Sheet.png', 4, 5), 'move': ('Run-Sheet.png', 6, 10)}),
  'king': ('#Royal_Family_Elthen/King Sprite Sheet.png|64|32', {'idle': ('0', 4, 4), 'move': ('1', 8, 10), 'atk': ('6', 7, 8)}),
  'queen': ('#Royal_Family_Elthen/Queen Sprite Sheet.png|32|32', {'idle': ('0', 8, 6), 'move': ('1', 8, 10)}),
  'cit_peasant': ("@Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Npc's/Citizen_F/Peasant_A", {'idle': ('Idle/Idle-Sheet.png', 4, 5), 'move': ('Walk/Walk-Sheet.png', 6, 9)}),
  'cit_tavern_a': ("@Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Npc's/Citizen_F/Tavern_A", {'idle': ('Idle_Hold/Idle_Side-Sheet.png', 4, 5), 'move': ('Walk_Hold/Walk_Side-Sheet.png', 6, 9)}),
  'cit_tavern_b': ("@Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Npc's/Citizen_F/Tavern_B", {'idle': ('Idle/Idle_Side-Sheet.png', 4, 5), 'move': ('Walk/Walk_Side-Sheet.png', 6, 9)}),
  'adv_archer': ('%RPG_HEROES_and_ENEMIES/00_Humans/00_Humans_Tiny_Archer', {'idle': ('Idle', 1, 1), 'move': ('Move', 8, 12), 'atk': ('ATK_Full', 6, 12)}),
  'adv_dwarf': ('%RPG_HEROES_and_ENEMIES/00_Humans/00_Humans_Tiny_Dwarf', {'idle': ('Idle', 1, 1), 'move': ('Move', 8, 12), 'atk': ('Attack', 11, 16)}),
  'adv_knight': ('%RPG_HEROES_and_ENEMIES/00_Humans/00_Humans_Tiny_Knight', {'idle': ('Idle', 1, 1), 'move': ('Run', 8, 12), 'atk': ('Attack', 11, 16)}),
  # Alec, el mago de los guanteletes: el cuerpo base «Body_A» de Pixel Crawler vestido por tools/paint_alec.py (tiras en assets/library/alec/)
  'alec_s': ('!side', {'idle': ('idle', 4, 2), 'move': ('move', 6, 10), 'dash': ('move', 6, 18), 'atk': ('atk', 8, 18), 'atkR': ('atk:0:4', 4, 18), 'atkL': ('atk:4:8', 4, 18)}),   # atkR: puño derecho (fotogramas 0-3), atkL: izquierdo (4-7)
  'alec_u': ('!up', {'idle': ('idle', 4, 2), 'move': ('move', 6, 10), 'dash': ('move', 6, 18), 'atk': ('atk', 8, 18), 'atkR': ('atk:0:4', 4, 18), 'atkL': ('atk:4:8', 4, 18)}),   # atkR: puño derecho (fotogramas 0-3), atkL: izquierdo (4-7)
  'alec_d': ('!down', {'idle': ('idle', 4, 2), 'move': ('move', 6, 10), 'dash': ('move', 6, 18), 'atk': ('atk', 8, 18), 'atkR': ('atk:0:4', 4, 18), 'atkL': ('atk:4:8', 4, 18)}),   # atkR: puño derecho (fotogramas 0-3), atkL: izquierdo (4-7)
  'keeper': ("@Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Npc's/Citizen_F/Tavern_A", {'idle': ('Idle_Hold/Idle_Side-Sheet.png', 4, 5), 'move': ('Walk_Hold/Walk_Side-Sheet.png', 6, 9)}),   # la posadera, con su bandeja
})
# ── Monstruos de Pixel Crawler: mezclados con los de overboy en cada zona ──
def pcmob(key, d, sub):
    i, r = ('Idle/Idle-Sheet.png', 'Run/Run-Sheet.png') if sub else ('Idle-Sheet.png', 'Run-Sheet.png')
    dd = 'Death/Death-Sheet.png' if sub else 'Death-Sheet.png'
    CAST[key] = ('@' + d, {'idle': (i, 4, 5), 'move': (r, 6, 10), 'die': (dd, 8, 12)})
FP = "Pixel_Crawler_-_Free_Pack_Exterior_0.1/Entities/Mobs/"
for k, d, sub in [('pc_skel', FP + 'Skeleton Crew/Skeleton - Base', 1), ('pc_skel_mage', FP + 'Skeleton Crew/Skeleton - Mage', 1), ('pc_skel_rogue', FP + 'Skeleton Crew/Skeleton - Rogue', 1), ('pc_skel_war', FP + 'Skeleton Crew/Skeleton - Warrior', 1),
                  ('pc_zombie', 'Pixel_Crawler_-_Cemetery_0.4/Entities/Mobs/Zombie - Base', 0), ('pc_zombie_fat', 'Pixel_Crawler_-_Cemetery_0.4/Entities/Mobs/Zombie - Overweight', 0), ('pc_zombie_mus', 'Pixel_Crawler_-_Cemetery_0.4/Entities/Mobs/Zombie - Muscle', 0), ('pc_banshee', 'Pixel_Crawler_-_Cemetery_0.4/Entities/Mobs/Zombie - Banshee', 0),
                  ('pc_fungus', 'Pixel_Crawler_-_Cave/Enemies/Immature Fungus', 0), ('pc_fungus_long', 'Pixel_Crawler_-_Cave/Enemies/Long Fungus', 0), ('pc_fungus_heavy', 'Pixel_Crawler_-_Cave/Enemies/Heavy Fungus', 0), ('pc_fungus_old', 'Pixel_Crawler_-_Cave/Enemies/Old Fungus', 0),
                  ('pc_rat', 'Pixel_Crawler_-_Sewer/Enemy/Rat - Base', 1), ('pc_rat_rogue', 'Pixel_Crawler_-_Sewer/Enemy/Rat - Rogue', 1), ('pc_rat_mage', 'Pixel_Crawler_-_Sewer/Enemy/Rat - Mage', 1), ('pc_rat_war', 'Pixel_Crawler_-_Sewer/Enemy/Rat - Warrior', 1),
                  ('pc_stone', 'Pixel_Crawler_-_Forge_1.2/Enemy/Stone - Base', 1), ('pc_stone_broken', 'Pixel_Crawler_-_Forge_1.2/Enemy/Stone - Broken', 1), ('pc_stone_lava', 'Pixel_Crawler_-_Forge_1.2/Enemy/Stone - Lava', 1), ('pc_golem', 'Pixel_Crawler_-_Forge_1.2/Enemy/Stone - Golem', 1)]:
    pcmob(k, d, sub)
# ── La cinemática del principio (src/37_intro.js): Alec de niño y de muchacho, y el herrero que lo crio. Van al final para no mover a nadie de sitio en el atlas ──
CAST.update({
  'alec_kid': ('Knight_LVL1', {'idle': ('Idle', 2, 3), 'move': ('Move', 10, 14)}),
  'alec_teen': ('Knight_LVL2', {'idle': ('Idle', 2, 3), 'move': ('Move', 12, 14), 'atk': ('Dash', 10, 14)}),
  'oldsmith': ('@Pixel_Crawler_-_Hideout_1.0/Enemies/Baldits/Sorcerer', {'idle': ('Idle/Idle-Sheet.png', 4, 5), 'move': ('Run/Run-Sheet.png', 6, 10)}),
})
PC = 'assets/library/packs/'
ALEC = json.load(open('assets/library/alec/manos.json'))   # tamaño del fotograma y dónde cae cada guantelete
def frames_of(folder, suffix):
    if folder.startswith('!'):   # tiras propias de Alec: «vista_animación.png», fotogramas de ancho fijo; «atk:0:4» = solo esos fotogramas
        name, lo, hi = (suffix.split(':') + [None, None])[:3]
        im = Image.open('assets/library/alec/%s_%s.png' % (folder[1:], name)).convert('RGBA'); fw = ALEC['w']
        fs = [im.crop((i * fw, 0, (i + 1) * fw, im.height)) for i in range(im.width // fw)]
        return fs[int(lo):int(hi)] if lo is not None else fs
    if folder.startswith('%'):   # tiras «Nombre_Nx1.png» del RPG HEROES & ENEMIES de overboy
        import glob as _g
        f = _g.glob(PC + folder[1:] + '_' + suffix + '_*x1.png')[0]; n = int(f.rsplit('_', 1)[1].split('x')[0]); im = Image.open(f).convert('RGBA'); w = im.width // n
        return [im.crop((i * w, 0, (i + 1) * w, im.height)) for i in range(n)]
    if folder.startswith('#'):   # hoja en rejilla: «ruta|ancho|alto», sufijo = fila; cuenta los fotogramas no vacíos
        path, fw, fh = folder[1:].split('|'); fw, fh = int(fw), int(fh); im = Image.open(PC + path).convert('RGBA'); row = int(suffix)
        out = [im.crop((i * fw, row * fh, (i + 1) * fw, (row + 1) * fh)) for i in range(im.width // fw)]
        return [f for f in out if f.getbbox()]
    if folder.startswith('@'):   # tira horizontal de fotogramas cuadrados (Pixel Crawler y similares)
        im = Image.open(PC + folder[1:].rstrip('/') + '/' + suffix).convert('RGBA'); n = im.width // im.height
        return [im.crop((i * im.height, 0, (i + 1) * im.height, im.height)) for i in range(n)]
    A = LIB[folder]['a']; a = A[suffix] if suffix in A else A[[n for n in A if n.endswith('_' + suffix)][0]]
    out = []
    for x, y in a['f']:
        im = Image.new('RGBA', tuple(a['size']), (0, 0, 0, 0)); im.paste(LIBIMG.crop((x, y, x + a['w'], y + a['h'])), tuple(a['off'])); out.append(im)
    return out
items, meta = [], {}
for key, (folder, anims) in CAST.items():
    loaded = {}
    for a, (suffix, maxn, fps) in anims.items():
        fs = frames_of(folder, suffix)
        step = max(1, -(-len(fs) // maxn))          # remuestrea las animaciones largas
        loaded[a] = (fs[::step], fps)
    size = loaded['idle'][0][0].size
    # recorte común a todos los fotogramas del personaje (los que tengan otro tamaño de lienzo se alinean por abajo-centro)
    def norm(im):
        if im.size == size: return im
        out = Image.new('RGBA', size, (0, 0, 0, 0)); out.alpha_composite(im.crop((max(0, (im.width - size[0]) // 2), max(0, im.height - size[1]), max(0, (im.width - size[0]) // 2) + min(size[0], im.width), im.height)), ((size[0] - min(size[0], im.width)) // 2, size[1] - min(size[1], im.height))); return out
    for a in loaded: loaded[a] = ([norm(im) for im in loaded[a][0]], loaded[a][1])
    bb = None
    for a in loaded:
        for im in loaded[a][0]:
            b = im.getbbox()
            if b: bb = b if not bb else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    ib = None
    for im in loaded['idle'][0] + loaded['move'][0]:
        b = im.getbbox()
        if b: ib = b if not ib else (min(ib[0], b[0]), min(ib[1], b[1]), max(ib[2], b[2]), max(ib[3], b[3]))
    idle_b = loaded['idle'][0][0].getbbox()
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    meta[key] = {'w': w, 'h': h, 'ax': round((idle_b[0] + idle_b[2]) / 2 - bb[0]), 'gy': ib[3] - bb[1], 'bw': idle_b[2] - idle_b[0], 'bh': idle_b[3] - idle_b[1], 'a': {}}
    if folder.startswith('!'):   # centro de cada guantelete por fotograma, ya en coordenadas del recorte: ahí pinta el juego la llama
        def sl(a):   # fotogramas de la tira que usa cada animación (atk:0:4 → del 0 al 3)
            name, lo, hi = (anims[a][0].split(':') + [None, None])[:3]
            n = len(ALEC['hands'][folder[1:] + '_' + name]); return name, int(lo or 0), int(hi or n)
        meta[key]['hands'] = {}; meta[key]['lanza'] = {}
        for a in anims:
            name, lo, hi = sl(a); fr_all = ALEC['hands'][folder[1:] + '_' + name]
            meta[key]['hands'][a] = [[[hx - bb[0], hy - bb[1]] for hx, hy in fr] for fr in fr_all[lo:hi]]
            # «lanza» de manos.json: fotograma en que sale el disparo → qué puño (0 izquierda/lejana, 1 derecha/cercana); aquí en índices de la animación
            L = {int(f) - lo: h for f, h in ALEC.get('lanza', {}).get(folder[1:] + '_' + name, {}).items() if lo <= int(f) < hi}
            if L: meta[key]['lanza'][a] = L
    for a in loaded:
        meta[key]['a'][a] = {'fps': loaded[a][1], 'f': []}
        for im in loaded[a][0]: items.append((key, a, im.crop(bb)))
# empaquetado por estantes
W = 2048; x = y = rowh = 0; pos = []
for key, a, im in items:
    if x + im.width + 1 > W: x = 0; y += rowh + 1; rowh = 0
    pos.append((x, y)); meta[key]['a'][a]['f'].append([x, y]); x += im.width + 1; rowh = max(rowh, im.height)
H = y + rowh
atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for (key, a, im), (px, py) in zip(items, pos): atlas.alpha_composite(im, (px, py))
os.makedirs('assets', exist_ok=True); atlas.save('assets/chars.png', optimize=True)
open('src/48_atlas.js', 'w').write('// Generado por tools/pack_atlas.py a partir del CHARACTER MEGAPACK de overboy (itch.io). No editar a mano.\n// w, h: tamaño del recorte · ax: centro del cuerpo · gy: línea del suelo · a: animaciones (fps y posición de cada fotograma)\nconst ATLAS = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
print('atlas', atlas.size, len(items), 'fotogramas', os.path.getsize('assets/chars.png') // 1024, 'KB')
for k, m in meta.items(): print(k.ljust(10), 'recorte %dx%d cuerpo %dx%d' % (m['w'], m['h'], m['bw'], m['bh']), {a: len(v['f']) for a, v in m['a'].items()})
