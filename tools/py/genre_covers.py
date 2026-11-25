#!/usr/bin/env python3
"""ジャンル表紙（thumbs/genre-<id>.webp）を、ゲーム一覧（shared/games-registry.json）から 自動で作る道具。
そのジャンルの ゲームの 画像（img）を ななめに かさねたコラージュ。画像がないゲームは、そのゲームの 2色の パネル。
同じ入力 → 同じ出力（乱数は ゲームの id から決める）。

  python3 tools/py/genre_covers.py            … thumbs/ に 書く
  python3 tools/py/genre_covers.py --out DIR  … 別の場所に 書く
  python3 tools/py/genre_covers.py --check    … いまある画像が 最新か 確かめる（ちがえば 失敗）
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
W, H = 480, 270
FONTS = ["/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]


def hexrgb(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def gradient(c1, c2, w=W, h=H):
    base = Image.new("RGB", (w, h))
    px = base.load()
    for y in range(h):
        for x in range(w):
            t = (x / (w - 1) * 0.6 + y / (h - 1) * 0.4)
            px[x, y] = tuple(round(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))
    return base


def panel_for(game, size):
    pw, ph = size
    if game.get("img") and os.path.isfile(os.path.join(ROOT, game["img"])):
        im = Image.open(os.path.join(ROOT, game["img"])).convert("RGB")
        # 16:9 に 中央で 切って 縮める
        r = pw / ph
        if im.width / im.height > r:
            nw = round(im.height * r)
            im = im.crop(((im.width - nw) // 2, 0, (im.width - nw) // 2 + nw, im.height))
        else:
            nh = round(im.width / r)
            im = im.crop((0, (im.height - nh) // 2, im.width, (im.height - nh) // 2 + nh))
        return im.resize((pw, ph), Image.LANCZOS)
    p = gradient(hexrgb(game["c1"]), hexrgb(game["c2"]), pw, ph)
    d = ImageDraw.Draw(p)
    # ゲームごとに ちがう もよう（円）。id から 決める
    seed = int(hashlib.sha256(game["id"].encode()).hexdigest()[:8], 16)
    for k in range(3):
        cx = (seed >> (k * 5)) % pw
        cy = (seed >> (k * 7 + 3)) % ph
        rr = 14 + (seed >> (k * 3)) % 30
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=(255, 255, 255, 90) if False else (255, 255, 255), width=1)
    # ゲームの名前（英語）を まん中に。フォントが なければ 名前なし
    fp = next((f for f in FONTS if os.path.isfile(f)), None)
    if fp:
        from PIL import ImageFont
        name = game["name"]["en"]
        size = 26
        while size > 10:
            f = ImageFont.truetype(fp, size, index=0)
            bb = d.textbbox((0, 0), name, font=f)
            if bb[2] - bb[0] <= pw - 16:
                break
            size -= 2
        bb = d.textbbox((0, 0), name, font=f)
        tx, ty = (pw - (bb[2] - bb[0])) // 2 - bb[0], (ph - (bb[3] - bb[1])) // 2 - bb[1]
        d.text((tx + 1, ty + 2), name, font=f, fill=(0, 0, 0))
        d.text((tx, ty), name, font=f, fill=(255, 255, 255))
    return p


def cover(genre, games):
    img = gradient(hexrgb(genre["c1"]), hexrgb(genre["c2"])).convert("RGBA")
    n = len(games)
    pw, ph = 200, 112
    # 横に ならべて 少し かさねる。ななめ（-6°〜+6°）。左から右へ。
    step = (W - pw - 40) / max(n - 1, 1) if n > 1 else 0
    for i, g in enumerate(games[:6]):
        pan = panel_for(g, (pw, ph)).convert("RGBA")
        # ふち
        edge = Image.new("RGBA", (pw + 6, ph + 6), (255, 255, 255, 235))
        edge.paste(pan, (3, 3))
        seed = int(hashlib.sha256(g["id"].encode()).hexdigest()[:4], 16)
        ang = ((seed % 13) - 6)
        rot = edge.rotate(ang, resample=Image.BICUBIC, expand=True)
        sh = Image.new("RGBA", rot.size, (0, 0, 0, 0))
        sh.paste((0, 0, 0, 120), mask=rot.split()[3])
        sh = sh.filter(ImageFilter.GaussianBlur(5))
        x = round(20 + i * step) if n > 1 else (W - rot.width) // 2
        y = round(30 + (i % 2) * 70 + (seed % 15)) if n > 2 else (H - rot.height) // 2 + (i * 20)
        y = max(6, min(H - rot.height - 6, y))
        img.alpha_composite(sh, (x + 3, y + 5))
        img.alpha_composite(rot, (x, y))
    # 下を 暗く（文字をのせるため）
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for y in range(H):
        a = max(0, int((y / H - 0.45) * 2 * 150))
        sd.line([(0, y), (W, y)], fill=(8, 13, 36, a))
    img.alpha_composite(shade)
    return img.convert("RGB")


def encode(im):
    b = io.BytesIO()
    im.save(b, "WEBP", quality=72, method=6)
    return b.getvalue()


def build(out_dir):
    data = json.load(open(os.path.join(ROOT, "shared", "games-registry.json"), encoding="utf-8"))
    res = {}
    for gn in data["genres"]:
        gs = sorted([g for g in data["games"] if g["genre"] == gn["id"]], key=lambda g: g["order"])
        res["genre-%s.webp" % gn["id"]] = encode(cover(gn, gs))
    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default=os.path.join(ROOT, "thumbs"))
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args(argv)
    files = build(a.out)
    if a.check:
        bad = []
        for n, b in files.items():
            p = os.path.join(a.out, n)
            if not os.path.isfile(p) or hashlib.sha256(open(p, "rb").read()).digest() != hashlib.sha256(b).digest():
                bad.append(n)
        if bad:
            print("NG: 古い・ない:", ", ".join(bad), file=sys.stderr)
            return 1
        print("OK: ジャンル表紙 %d 枚は 最新" % len(files))
        return 0
    os.makedirs(a.out, exist_ok=True)
    for n, b in files.items():
        open(os.path.join(a.out, n), "wb").write(b)
    print("書きました: %d 枚（合計 %d KB）" % (len(files), sum(len(b) for b in files.values()) // 1024))
    return 0


if __name__ == "__main__":
    sys.exit(main())
