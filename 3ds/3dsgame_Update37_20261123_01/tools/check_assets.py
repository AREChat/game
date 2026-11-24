"""check_assets.py - gfx/ の 絵の 大きさ・中身を しらべる(切りぬきミス・空の コマが ないか)。 """
import os, sys
import numpy as np
from PIL import Image
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
bad = 0
def fail(m):
    global bad; bad += 1; print("NG:", m)
def img(n): return Image.open("gfx/%s.png" % n).convert("RGBA")
def cell_opaque(im, x, y, w, h):
    a = np.array(im.crop((x, y, x + w, y + h)))[..., 3]
    return int((a > 128).sum())

SIZES = {"chars": (256, 160), "enemies": (384, 384), "tiles": (256, 64), "buildings": (384, 192), "battlebg": (800, 960),
         "act_tiles": (256, 64), "act_hero": (192, 32), "act_bg": (400, 720), "end_a": (400, 720), "end_b": (400, 720), "end_c": (400, 720)}
for n, sz in SIZES.items():
    if not os.path.exists("gfx/%s.png" % n): fail("missing gfx/%s.png" % n); continue
    if img(n).size != sz: fail("%s size %s (want %s)" % (n, img(n).size, sz))
    if n.startswith(("act_", "end_", "chars", "enemies", "tiles")) and not os.path.exists("gfx/%s.t3s" % n): fail("missing gfx/%s.t3s" % n)
if not bad:
    ch = img("chars")
    for i in list(range(0, 12)) + list(range(16, 40)):
        if cell_opaque(ch, (i % 8) * 32, (i // 8) * 32, 32, 32) < 120: fail("chars cell %d is (almost) empty" % i)
    en = img("enemies")
    for i in range(14):
        if cell_opaque(en, (i % 4) * 96, (i // 4) * 96, 96, 96) < 1500: fail("enemies cell %d is (almost) empty" % i)
    at = img("act_tiles")
    for i in range(16):
        if cell_opaque(at, (i % 8) * 32, (i // 8) * 32, 32, 32) < 40: fail("act_tiles cell %d is (almost) empty" % i)
    for i in (0, 1, 11, 12, 13, 14):   # ブロックは ほぼ ぜんぶ うまっている
        if cell_opaque(at, (i % 8) * 32, (i // 8) * 32, 32, 32) < 700: fail("act_tiles block %d is not filled" % i)
    ah = img("act_hero")
    for i in range(6):
        if cell_opaque(ah, i * 32, 0, 32, 32) < 120: fail("act_hero frame %d is (almost) empty" % i)
    for n in ("act_bg", "end_a", "end_b", "end_c"):
        a = np.array(Image.open("gfx/%s.png" % n).convert("RGB")).astype(int)
        for k in range(3):
            if a[k * 240:(k + 1) * 240].std() < 12: fail("%s panel %d looks blank" % (n, k))
print("assets: %s" % ("OK" if not bad else "%d problems" % bad))
sys.exit(1 if bad else 0)
