#!/usr/bin/env python3
"""ほしあかり英雄譚: 画像(PNG)とBGMを作るスクリプト。すべてオリジナル(外部素材なし)。
使い方: python3 make_assets.py [出力先=assets]   必要: Pillow, numpy, ffmpeg(ogg/mp3変換。無ければwavのみ)
人=まるい顔の絵文字ふう(16x16)、建物=四角い屋根つき(48x48)+看板マーク。ひと目で区別できる。"""
import sys, os, math, subprocess, wave
from PIL import Image, ImageDraw
import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 else "assets"
os.makedirs(OUT + "/gfx", exist_ok=True)
os.makedirs(OUT + "/bgm", exist_ok=True)

DARK = (40, 30, 50, 255)
SKIN = (255, 214, 170, 255)
WHITE = (250, 250, 250, 255)
RED = (220, 60, 60, 255)
GOLD = (250, 205, 60, 255)

def C(h):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)

def outline(img, col=DARK):
    w, h = img.size; px = img.load(); src = img.copy(); sp = src.load()
    for y in range(h):
        for x in range(w):
            if sp[x, y][3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and sp[nx, ny][3] > 0 and sp[nx, ny] != col:
                        px[x, y] = col; break
    return img

# ---------------- 人(16x16) ----------------
def person(hair, shirt, accessory=None, face="down", skin=SKIN, pants=C("445577"), step=0, long_hair=False, glasses=False, beard=False):
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    # 体
    d.rectangle([4, 9, 11, 13], fill=shirt)
    d.rectangle([3, 9, 3, 12], fill=shirt); d.rectangle([12, 9, 12, 12], fill=shirt)
    # 足(歩き2コマ)
    lx = 5 + (1 if step else 0); rx = 9 - (1 if step else 0)
    d.rectangle([lx, 14, lx + 1, 15], fill=pants); d.rectangle([rx, 14, rx + 1, 15], fill=pants)
    # 頭(まるい顔)
    d.ellipse([3, 1, 12, 10], fill=skin)
    # 髪
    if face == "up":
        d.ellipse([3, 1, 12, 9], fill=hair)
    else:
        d.pieslice([3, 0, 12, 9], 180, 360, fill=hair)
        d.rectangle([3, 3, 4, 5 if not long_hair else 11], fill=hair)
        d.rectangle([11, 3, 12, 5 if not long_hair else 11], fill=hair)
    if long_hair and face != "up":
        d.rectangle([3, 3, 4, 11], fill=hair); d.rectangle([11, 3, 12, 11], fill=hair)
    # 顔
    if face == "down":
        d.point([(5, 6), (10, 6)], fill=DARK); d.point([(7, 8), (8, 8)], fill=RED)
        if glasses: d.rectangle([4, 5, 6, 7], outline=DARK); d.rectangle([9, 5, 11, 7], outline=DARK)
        if beard: d.rectangle([5, 9, 10, 10], fill=WHITE)
    elif face == "left":
        d.point([(5, 6)], fill=DARK); d.point([(4, 8)], fill=RED)
    elif face == "right":
        d.point([(10, 6)], fill=DARK); d.point([(11, 8)], fill=RED)
    if accessory: accessory(d, face)
    return outline(im)

def acc_bandana(d, face):   # 主人公: 星のバンダナ
    d.rectangle([3, 2, 12, 3], fill=RED)
    d.point([(7, 3), (8, 3)], fill=GOLD); d.point([(7, 2), (8, 2)], fill=GOLD)
def acc_nurse(d, face):      # 保健室の先生: 白い帽子+赤十字
    d.rectangle([4, 0, 11, 2], fill=WHITE); d.point([(7, 1), (8, 1)], fill=RED); d.point([(7, 0), (8, 2)], fill=RED)
def acc_cap(col):
    def f(d, face):
        d.rectangle([3, 1, 12, 3], fill=col); d.rectangle([2, 3, 13, 3], fill=col)
        d.point([(7, 2), (8, 2)], fill=GOLD)
    return f
def acc_bow(d, face):        # セラ: ピンクのリボン
    d.rectangle([9, 1, 12, 3], fill=C("ff7aa8")); d.point([(10, 2)], fill=WHITE)
def acc_bun(d, face):        # ミオ: おだんご
    d.ellipse([6, -1, 9, 2], fill=C("2c5aa0"))
def acc_scarf(d, face):      # ユノ: オレンジのマフラー
    d.rectangle([4, 9, 11, 10], fill=C("ff9a2e"))
def acc_apron(d, face):      # 屋台のおじさん・母: えぷろん
    d.rectangle([5, 10, 10, 13], fill=WHITE)
def acc_headband(d, face):
    d.rectangle([3, 2, 12, 2], fill=WHITE)
def acc_mortar(d, face):     # 先生: 角帽
    d.rectangle([2, 0, 13, 1], fill=DARK); d.rectangle([4, 2, 11, 2], fill=DARK); d.point([(13, 2), (13, 3)], fill=GOLD)
def acc_kid(col):
    def f(d, face):
        d.rectangle([5, 0, 10, 1], fill=col)
    return f

def hero(face, step): return person(C("5a3b24"), C("3d7be0"), acc_bandana, face, step=step)

PEOPLE = {   # 名前 -> 生成関数  (順番がchars.pngの並び)
    "mother":  lambda: person(C("7a4a2a"), C("e86a8a"), acc_apron, long_hair=False),
    "nurse":   lambda: person(C("2a2a2a"), C("e8f0f0"), acc_nurse),
    "classmate": lambda: person(C("c68a3e"), C("7cc06a")),
    "vendor":  lambda: person(C("6b6b6b"), C("e0a040"), acc_headband),
    "sera":    lambda: person(C("f0a0c0"), C("ffd0e0"), acc_bow, long_hair=True),
    "gai":     lambda: person(C("2f6b3a"), C("3a8a4a"), acc_cap(C("3a8a4a"))),
    "mio":     lambda: person(C("2c5aa0"), C("90b8f0"), acc_bun, glasses=True),
    "elder":   lambda: person(C("dddddd"), C("8a6aa8"), None, beard=True),
    "yuno":    lambda: person(C("8a3a1a"), C("f0e0b0"), acc_scarf),
    "station": lambda: person(C("202040"), C("2a3a6a"), acc_cap(C("2a3a6a"))),
    "teacher": lambda: person(C("3a3a3a"), C("b0b0c8"), acc_mortar),
    "kid_rai": lambda: person(C("e0c050"), C("e06050"), acc_kid(C("e0c050"))),
    "kid_roku": lambda: person(C("5080e0"), C("f0d050"), acc_kid(C("5080e0"))),
    "villager": lambda: person(C("a06a3a"), C("a0c0a0")),
    "boss":    lambda: person(C("301010"), C("703030"), acc_headband),   # 短剣の山賊(マイルドな表現)
    "shopkeeper": lambda: person(C("503020"), C("30a060"), acc_apron),
}
PEOPLE_ORDER = list(PEOPLE.keys())

def make_chars():
    sheet = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    i = 0
    for face in ("down", "up", "left", "right"):
        for step in (0, 1):
            sheet.paste(hero(face, step), ((i % 8) * 16, (i // 8) * 16)); i += 1
    # 2行目はそのまま空き(主人公の予備)
    i = 16
    for name in PEOPLE_ORDER:
        sheet.paste(PEOPLE[name](), ((i % 8) * 16, (i // 8) * 16)); i += 1
    sheet.save(OUT + "/gfx/chars.png")

# ---------------- タイル(16x16) ----------------
def tile(fn):
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 255)); fn(ImageDraw.Draw(im)); return im
def t_floor(d): d.rectangle([0, 0, 15, 15], fill=C("d8c8a0")); [d.point((x, y), fill=C("c8b890")) for x in range(0, 16, 4) for y in range(0, 16, 4)]
def t_grass(d):
    d.rectangle([0, 0, 15, 15], fill=C("5fbf5a"))
    for x, y in ((2, 3), (9, 5), (5, 11), (12, 12), (13, 2)): d.line([x, y, x, y - 2], fill=C("3f9f3f"))
def t_path(d): d.rectangle([0, 0, 15, 15], fill=C("c9a56a")); [d.point((x, y), fill=C("b8935a")) for x, y in ((3, 4), (10, 2), (6, 9), (13, 12), (2, 13))]
def t_wall(d):
    d.rectangle([0, 0, 15, 15], fill=C("7a7a90"))
    for y in (0, 5, 10): d.line([0, y, 15, y], fill=C("505068"))
    for y, o in ((0, 0), (5, 4), (10, 0)):
        for x in range(o, 16, 8): d.line([x, y, x, y + 4], fill=C("505068"))
def t_rubble(d): t_floor(d); d.polygon([(3, 12), (6, 6), (10, 8), (12, 13)], fill=C("8a7a6a")); d.polygon([(9, 13), (11, 9), (14, 12)], fill=C("6a5a4a"))
def t_exit(d): t_floor(d); d.rectangle([2, 2, 13, 13], outline=C("e08030")); d.polygon([(8, 4), (12, 9), (4, 9)], fill=C("e08030")); d.rectangle([7, 9, 8, 12], fill=C("e08030"))
def t_spot(d): t_floor(d); d.ellipse([3, 3, 12, 12], outline=GOLD); d.point([(7, 7), (8, 8), (7, 8), (8, 7)], fill=GOLD)
def t_water(d):
    d.rectangle([0, 0, 15, 15], fill=C("4a90d8")); [d.line([x, y, x + 3, y], fill=C("8ac0f0")) for x, y in ((1, 3), (8, 7), (3, 11), (10, 14))]
def t_flower(d):
    t_grass(d)
    for x, y, c in ((4, 5, "ff6a8a"), (11, 4, "ffe060"), (8, 11, "ffffff")): d.rectangle([x - 1, y - 1, x + 1, y + 1], fill=C(c)); d.point((x, y), fill=C("e8a020"))
def t_station(d):
    d.rectangle([0, 0, 15, 15], fill=C("b8b8c8"))
    for x in (0, 8): d.rectangle([x, 0, x + 7, 7], outline=C("a0a0b0")); d.rectangle([x, 8, x + 7, 15], outline=C("a0a0b0"))
def t_rail(d):
    d.rectangle([0, 0, 15, 15], fill=C("8a7a6a"))
    d.line([0, 4, 15, 4], fill=C("c0c0c8")); d.line([0, 11, 15, 11], fill=C("c0c0c8"))
    for x in range(1, 16, 4): d.rectangle([x, 2, x + 1, 13], fill=C("5a4a3a"))
TILES = [t_floor, t_grass, t_path, t_wall, t_rubble, t_exit, t_spot, t_water, t_flower, t_station, t_rail]
def make_tiles():
    sheet = Image.new("RGBA", (128, 128), (0, 0, 0, 255))
    for i, fn in enumerate(TILES): sheet.paste(tile(fn), ((i % 8) * 16, (i // 8) * 16))
    sheet.save(OUT + "/gfx/tiles.png")

# ---------------- 建物(48x48) ----------------
def building(wall, roof, emblem, extra=None):
    im = Image.new("RGBA", (48, 48), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([4, 20, 43, 46], fill=wall)                      # 壁
    d.polygon([(0, 22), (24, 4), (47, 22)], fill=roof)           # 屋根
    d.line([0, 22, 47, 22], fill=DARK)
    d.rectangle([20, 34, 28, 46], fill=C("6a4020")); d.point([(26, 40)], fill=GOLD)   # とびら
    d.rectangle([8, 28, 15, 34], fill=C("a8d8f0"), outline=DARK); d.rectangle([33, 28, 40, 34], fill=C("a8d8f0"), outline=DARK)
    d.rectangle([17, 22, 30, 31], fill=WHITE, outline=DARK)      # 看板
    emblem(d, 23, 26)
    if extra: extra(d)
    return outline(im)
def em_door(d, x, y): d.rectangle([x - 2, y - 2, x + 2, y + 3], fill=C("6a4020")); d.point((x + 1, y), fill=GOLD)
def em_book(d, x, y): d.rectangle([x - 4, y - 3, x - 1, y + 3], fill=C("3a6ad8")); d.rectangle([x, y - 3, x + 3, y + 3], fill=C("7aa0f0")); d.line([x, y - 3, x, y + 3], fill=DARK)
def em_coin(d, x, y): d.ellipse([x - 3, y - 3, x + 3, y + 3], fill=GOLD, outline=C("b08a10")); d.line([x, y - 2, x, y + 2], fill=C("b08a10"))
def em_bed(d, x, y): d.rectangle([x - 4, y, x + 4, y + 2], fill=C("8a5aa8")); d.rectangle([x - 4, y - 2, x - 2, y], fill=WHITE)
def em_train(d, x, y): d.rectangle([x - 4, y - 3, x + 3, y + 1], fill=C("3a8a6a")); d.rectangle([x - 3, y - 2, x - 1, y - 1], fill=C("a8d8f0")); d.point([(x - 3, y + 3), (x + 2, y + 3)], fill=DARK)
def em_cross(d, x, y): d.rectangle([x - 1, y - 3, x + 1, y + 3], fill=RED); d.rectangle([x - 3, y - 1, x + 3, y + 1], fill=RED)
def em_star(d, x, y): d.polygon([(x, y - 4), (x + 1, y - 1), (x + 4, y - 1), (x + 2, y + 1), (x + 3, y + 4), (x, y + 2), (x - 3, y + 4), (x - 2, y + 1), (x - 4, y - 1), (x - 1, y - 1)], fill=GOLD)
def ex_flag(d): d.line([24, 4, 24, -1], fill=DARK) if False else None
BUILDINGS = {   # 名前: (壁, 屋根, 看板マーク)
    "house":   (C("f0dcb0"), C("d84a3a"), em_door),
    "school":  (C("e8e0c8"), C("3a5ac8"), em_book),
    "shop":    (C("f0e8c0"), C("3aa860"), em_coin),
    "inn":     (C("e8d0c0"), C("8a4ab8"), em_bed),
    "station": (C("d0d0e0"), C("5a6a7a"), em_train),
    "clinic":  (C("f8f8f8"), C("e86a6a"), em_cross),
    "library": (C("d8c8a8"), C("5a4a3a"), em_book),
    "tower":   (C("c8c0e0"), C("2a2a6a"), em_star),
}
BUILDING_ORDER = list(BUILDINGS.keys())
def make_buildings():
    sheet = Image.new("RGBA", (192, 96), (0, 0, 0, 0))
    for i, n in enumerate(BUILDING_ORDER):
        w, r, e = BUILDINGS[n]; sheet.paste(building(w, r, e), ((i % 4) * 48, (i // 4) * 48))
    sheet.save(OUT + "/gfx/buildings.png")

# ---------------- UI(64x64) ----------------
def make_ui():
    im = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, 31, 31], 5, fill=(20, 24, 60, 230), outline=WHITE, width=2)   # メッセージ枠
    d.polygon([(36, 4), (44, 10), (36, 16)], fill=GOLD, outline=DARK)                         # カーソル
    em_star(d, 52, 10)
    # 役割マーク(人=顔、建物=家)で凡例にも使う
    pm = person(C("5a3b24"), C("3d7be0"), acc_bandana); im.paste(pm, (36, 24), pm)
    bm = building(C("f0dcb0"), C("d84a3a"), em_door).resize((16, 16), Image.NEAREST); im.paste(bm, (52, 24), bm)
    im.save(OUT + "/gfx/ui.png")

# ---------------- 見本(legend.png) ----------------
def make_legend():
    S = 3
    W, H = 48 * 2 * 8 + 40, 200 * S
    im = Image.new("RGBA", (W // 1, H), (40, 44, 70, 255)); d = ImageDraw.Draw(im)
    x = 4
    for i, fn in enumerate(TILES):
        im.paste(tile(fn).resize((16 * S, 16 * S), Image.NEAREST), (x, 4)); x += 16 * S + 2
    x = 4; y = 4 + 16 * S + 8
    imgs = [hero("down", 0), hero("up", 0), hero("left", 0), hero("right", 1)] + [PEOPLE[n]() for n in PEOPLE_ORDER]
    for p in imgs:
        im.paste(p.resize((16 * S, 16 * S), Image.NEAREST), (x, y), p.resize((16 * S, 16 * S), Image.NEAREST)); x += 16 * S + 2
        if x > W - 16 * S: x = 4; y += 16 * S + 2
    y += 16 * S + 8; x = 4
    for n in BUILDING_ORDER:
        b = building(*BUILDINGS[n]); b = b.resize((48 * 2, 48 * 2), Image.NEAREST)
        im.paste(b, (x, y), b); x += 48 * 2 + 4
    im = im.crop((0, 0, im.width, y + 48 * 2 + 4)); im.save(OUT + "/legend.png")

# ---------------- BGM ----------------
SR = 22050
def note_freq(n): return 440.0 * 2 ** ((n - 69) / 12.0)
def synth(melody, bass, bpm, wave_kind):
    beat = 60.0 / bpm; total = sum(l for _, l in melody) * beat
    t = np.zeros(int(total * SR) + SR // 2, dtype=np.float32)
    def add(seq, vol, kind):
        pos = 0.0
        for n, l in seq:
            if n is not None:
                f = note_freq(n); length = l * beat; ns = int(length * SR); s0 = int(pos * SR)
                tt = np.arange(ns) / SR
                if kind == "square": w = np.sign(np.sin(2 * math.pi * f * tt)) * 0.6 + np.sin(2 * math.pi * f * tt) * 0.4
                elif kind == "tri": w = 2 / math.pi * np.arcsin(np.sin(2 * math.pi * f * tt))
                else: w = np.sin(2 * math.pi * f * tt) + 0.3 * np.sin(4 * math.pi * f * tt)
                env = np.minimum(1, tt / 0.01) * np.exp(-tt * 3.0 / max(length, 0.1)) * np.minimum(1, (length - tt) / 0.02)
                t[s0:s0 + ns] += (w * env * vol).astype(np.float32)
            pos += l * beat
    add(melody, 0.28, wave_kind); add(bass, 0.22, "tri")
    t = t[: int(total * SR)]; t /= max(1e-6, np.max(np.abs(t))) / 0.85
    return (t * 32767).astype(np.int16)
def rep(seq, n): return seq * n
C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, G5 = 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 79
FIELD_M = rep([(C5, 1), (E5, 1), (G5, 1), (E5, 1), (D5, 1), (C5, 1), (G4, 2), (A4, 1), (C5, 1), (E5, 1), (C5, 1), (D5, 1), (B4, 1), (C5, 2)], 2)
FIELD_B = rep([(C4 - 12, 2), (G4 - 12, 2), (C4 - 12, 2), (G4 - 12, 2), (F4 - 12, 2), (C4 - 12, 2), (G4 - 12, 2), (C4 - 12, 2)], 2)
TOWN_M = rep([(E4, 2), (G4, 1), (A4, 1), (G4, 2), (E4, 2), (D4, 2), (E4, 1), (G4, 1), (C5, 2), (A4, 2), (G4, 4)], 2)
TOWN_B = rep([(C4 - 12, 4), (A4 - 24, 4), (F4 - 12, 4), (G4 - 12, 4)], 2)
EVENT_M = rep([(A4, 1), (None, 1), (A4, 1), (C5, 1), (B4, 2), (G4, 2), (A4, 1), (None, 1), (E4, 1), (G4, 1), (A4, 4)], 3)
EVENT_B = rep([(A4 - 24, 2), (E4 - 12, 2), (A4 - 24, 2), (E4 - 12, 2)], 6)
def make_bgm():
    for name, (m, b, bpm, kind) in {"field": (FIELD_M, FIELD_B, 132, "square"), "town": (TOWN_M, TOWN_B, 88, "sine"), "event": (EVENT_M, EVENT_B, 104, "square")}.items():
        data = synth(m, b, bpm, kind)
        wp = f"{OUT}/bgm/bgm_{name}.wav"
        with wave.open(wp, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
        for ext, codec in (("ogg", "libvorbis"), ("mp3", "libmp3lame")):
            try:
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wp, "-c:a", codec, "-q:a", "4", f"{OUT}/bgm/bgm_{name}.{ext}"], check=True)
            except Exception as e:
                print("skip", ext, e)

if __name__ == "__main__":
    make_tiles(); make_chars(); make_buildings(); make_ui(); make_legend(); make_bgm()
    print("assets ->", OUT)
