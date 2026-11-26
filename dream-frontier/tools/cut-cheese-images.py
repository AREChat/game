#!/usr/bin/env python3
# チーズいせきの 絵（緑の せなか つき）を ぬきとって、ゲームで つかう 形（webp・すきとおり）に する道具。
#   使いかた：python3 tools/cut-cheese-images.py <緑せなかの webp が はいった フォルダ>
#   キャラ4人（gaku/mimi/mofuzo/chuppi）は 前・右・左・後ろの 4方向に きりわけ、img/chara/ に、
#   ほかは img/prop/ に ならべる。すべて 背景を すきとおらせ、よけいな 余白を きりとる。
import sys, os, numpy as np
from PIL import Image
SRC = sys.argv[1]; HERE = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(HERE, "..", "img")

def key(path):
    im = Image.open(path).convert("RGB"); a = np.asarray(im).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)                         # みどりの つよさ（せなかは 約255、ふつうの 色は ほぼ 0 いか）
    al = np.clip(1.0 - (d - 25.0) / 150.0, 0, 1)    # 25 いかは そのまま、175 いじょうは すきとおる
    spill = (d > 0) & (al < 1.0)                     # ふちの 緑かぶりを けす
    g2 = np.where(spill, np.maximum(r, b), g)
    out = np.dstack([r, g2, b, al * 255.0]).clip(0, 255).astype(np.uint8)
    # ふちを 1pxだけ けずって 緑の にじみを なくす
    m = out[..., 3] > 8
    er = m.copy(); er[1:] &= m[:-1]; er[:-1] &= m[1:]; er[:, 1:] &= m[:, :-1]; er[:, :-1] &= m[:, 1:]
    out[..., 3] = np.where(er, out[..., 3], np.minimum(out[..., 3], 60))
    return Image.fromarray(out, "RGBA")

def bbox(im, th=10):
    al = np.asarray(im)[..., 3]; ys, xs = np.where(al > th)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)

def trim(im, pad=2):
    x0, y0, x1, y1 = bbox(im); return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))

def split4(im):
    al = (np.asarray(im)[..., 3] > 10).sum(axis=0); cols = al > 0; segs = []; i = 0
    while i < len(cols):
        if cols[i]:
            j = i
            while j < len(cols) and cols[j]: j += 1
            segs.append([i, j]); i = j
        else: i += 1
    segs = [s for s in segs if s[1] - s[0] > im.width * 0.04]
    while len(segs) > 4:   # いちばん ちいさい かたまりを となりに くっつける
        k = min(range(len(segs)), key=lambda q: segs[q][1] - segs[q][0]); n = k - 1 if k > 0 else 1
        segs[n] = [min(segs[n][0], segs[k][0]), max(segs[n][1], segs[k][1])]; del segs[k]
    if len(segs) != 4:
        w = im.width // 4; segs = [[q * w, (q + 1) * w] for q in range(4)]
    return [trim(im.crop((s[0], 0, s[1], im.height))) for s in segs]

def save(im, path, h=None, q=82):
    if h and im.height != h: im = im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, "WEBP", quality=q, method=6); return im.size

CH = {"cheese_gaku": "ch_boy", "cheese_mimi": "ch_girl", "cheese_mofuzo": "ch_cat", "cheese_chuppi": "ch_mouse"}
for src, name in CH.items():
    views = split4(key(os.path.join(SRC, src + ".webp"))); tall = max(v.height for v in views); sc = 256.0 / tall   # 4方向とも おなじ 縮尺（せいぞろい）
    for v, k in zip(views, "frlb"):
        v2 = v.resize((max(1, round(v.width * sc)), max(1, round(v.height * sc))), Image.LANCZOS)
        print(name, k, save(v2, os.path.join(IMG, "chara", name + "_" + k + ".webp")))
        if name == "ch_boy" or name == "ch_girl":   # のりものに すわった すがた（かおから こしまで。したは ふくらみで かくれる）
            h = int(v2.height * .62); seat = v2.crop((0, 0, v2.width, h)); arr = np.asarray(seat).copy()
            fade = np.clip((h - np.arange(h)) / 14.0, 0, 1)[:, None]; arr[..., 3] = (arr[..., 3] * fade).astype(np.uint8)
            print(name + "S", k, save(Image.fromarray(arr), os.path.join(IMG, "chara", name + "S_" + k + ".webp")))
        if name == "ch_cat":   # すすだらけ（ばくはつの あとの ねこ）
            arr = np.asarray(v2).astype(np.float32); arr[..., :3] *= np.array([.42, .38, .36]); print("ch_cat_soot", k, save(Image.fromarray(arr.clip(0, 255).astype(np.uint8)), os.path.join(IMG, "chara", "ch_cat_soot_" + k + ".webp")))

def one(src, name, h, d="chara"):
    im = trim(key(os.path.join(SRC, src + ".webp"))); print(name, save(im, os.path.join(IMG, d, name + ".webp"), h))
# 1まいだけの もの（どの 向きから 見ても おなじ 絵）
one("cheese_duck", "ch_duck_f", 256); one("cheese_dynamite", "ch_bomb_f", 256); one("cheese_wheel", "ch_wheel_f", 384); one("cheese_paw", "ch_paw_f", 256)
bal = trim(key(os.path.join(SRC, "cheese_balloon.webp"))); parts = split4.__wrapped__ if False else None
al = (np.asarray(bal)[..., 3] > 10).sum(axis=0) > 0; segs = []; i = 0
while i < len(al):
    if al[i]:
        j = i
        while j < len(al) and al[j]: j += 1
        segs.append((i, j)); i = j
    else: i += 1
segs = [s for s in segs if s[1] - s[0] > 20][:3]
for n, s in enumerate(segs): print("ch_bal" + str(n), save(trim(bal.crop((s[0], 0, s[1], bal.height))), os.path.join(IMG, "chara", "ch_bal" + str(n) + "_f.webp"), 256))
# たてもの・かんばん・ジープ（img/prop）
for src, name, h in (("cheese_gate", "cheese_gate", 640), ("cheese_sign", "cheese_sign", 640), ("cheese_jeep", "cheese_jeep", 320)):
    im = trim(key(os.path.join(SRC, src + ".webp")))
    if src == "cheese_sign":   # 「00」の ひょうじを くろく ぬる（のこりの ふんは ゲームの 中で すうじを かさねる）
        im = im.resize((498, 640), Image.LANCZOS); a = np.asarray(im).copy(); y0, y1, x0, x1 = 146, 325, 105, 393; yy = np.linspace(0, 1, y1 - y0)[:, None]
        base = np.array([34, 28, 24]) * (1 - .35 * yy) + np.array([18, 15, 13]) * (.35 * yy); a[y0:y1, x0:x1, :3] = np.repeat(base[:, None, :], x1 - x0, axis=1).astype(np.uint8); im = Image.fromarray(a)
    print(name, save(im, os.path.join(IMG, "prop", name + ".webp"), h))
# かーど・スタンプ（もとの 絵 そのまま。せなかは なし）
for src, name, w in (("cheese_card", "cheese_card", 640), ("cheese_stamp", "cheese_stamp", 192)):
    im = Image.open(os.path.join(SRC, src + ".webp")).convert("RGBA") if src == "cheese_card" else trim(key(os.path.join(SRC, src + ".webp")))
    if src == "cheese_card": im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS); os.makedirs(os.path.join(IMG, "bld"), exist_ok=True); im.convert("RGB").save(os.path.join(IMG, "bld", name + ".webp"), "WEBP", quality=80, method=6); print(name, im.size)
    else: print(name, save(im, os.path.join(IMG, "prop", name + ".webp"), w))
