#!/usr/bin/env python3
"""画像生成の「1枚シート」を、1つずつの透明な画像に切り出す道具（Python / Pillow / NumPy / SciPy）。

game11〜14 の prompts/image-prompts.md の手順 3〜4（マスごとに切り出す → 緑 #00FF66 を透明に）を自動でやります。

使いかた
  格子で切る:   python3 tools/py/sheet_slicer.py sheet.png --grid 4x3 --names a,b,c,d,e,f,g,h,i,j,k,l --out game11/img
  自動で見つける: python3 tools/py/sheet_slicer.py sheet.png --auto --out game11/img
  確かめ:       python3 tools/py/sheet_slicer.py --selftest

  --key 00FF66   背景の色（既定 #00FF66）。--key none で 色抜きをしない（もとから透明な PNG のとき）
  --tol 70       色の近さのゆるし（大きいほど、緑に近い色まで 透明にする）
  --fit 256      出力を 256x256 の 正方形に ならべる（中央ぞろえ。0 なら 切り抜いた大きさのまま）
  --format webp|png   --quality 85
  --merge 6      --auto のとき、すきまが この px 以下の 絵は 1つにまとめる
  できるファイル: <out>/<name>.webp ・ <out>/manifest.json（もとのシートでの位置つき）
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw

EXIT_OK, EXIT_USAGE, EXIT_NOSPRITE = 0, 1, 2


def _rgba(path):
    with Image.open(path) as im:
        return im.convert("RGBA")


class SliceError(Exception):
    pass


def parse_key(s: str):
    if s is None or s.lower() == "none":
        return None
    m = re.fullmatch(r"#?([0-9a-fA-F]{6})", s.strip())
    if not m:
        raise SliceError(f"--key は 6桁の色（例 00FF66）か none にしてください: {s!r}")
    h = m.group(1)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def parse_grid(s: str):
    m = re.fullmatch(r"(\d{1,3})x(\d{1,3})", (s or "").strip().lower())
    if not m or int(m.group(1)) < 1 or int(m.group(2)) < 1:
        raise SliceError(f"--grid は 列x行（例 4x3）で 書いてください: {s!r}")
    return int(m.group(1)), int(m.group(2))


def load_rgba(path: str) -> Image.Image:
    if not os.path.isfile(path):
        raise SliceError(f"ファイルが ありません: {path}")
    try:
        im = Image.open(path)
        im.load()
    except Exception as e:  # 画像でない・こわれている
        raise SliceError(f"画像として 読めません: {path}（{e.__class__.__name__}）")
    if im.width < 8 or im.height < 8:
        raise SliceError("画像が 小さすぎます（8px 未満）")
    if im.width * im.height > 120_000_000:
        raise SliceError("画像が 大きすぎます（1.2億ピクセルまで）")
    return im.convert("RGBA")


def key_out(im: Image.Image, key, tol: float) -> Image.Image:
    """key の色に近いところを 透明にする。ふちは なめらかに（羽根つき）、緑のにじみも 取る。"""
    if key is None:
        return im
    a = np.asarray(im).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    d = np.sqrt(((rgb - np.array(key, dtype=np.float32)) ** 2).sum(axis=-1))
    lo, hi = tol * 0.55, tol * 1.15
    k = np.clip((d - lo) / max(hi - lo, 1e-6), 0.0, 1.0)  # 0=背景 1=絵
    alpha2 = alpha * k
    out = a.copy()
    # 緑かぶり（にじみ）を 取る：緑の背景のとき、G が R・B より 高い分を けずる
    if key[1] >= key[0] and key[1] >= key[2]:
        g_cap = np.maximum(out[..., 0], out[..., 2])
        spill = np.clip(out[..., 1] - g_cap, 0, None)
        out[..., 1] -= spill * (1.0 - k * 0.0)
    out[..., 3] = alpha2
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")


def alpha_bbox(im: Image.Image, thr: int = 8):
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > thr)
    if xs.size == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def fit_canvas(im: Image.Image, size: int) -> Image.Image:
    if size <= 0:
        return im
    scale = min(size / im.width, size / im.height, 1.0 if False else 10.0)
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    r = im.resize((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(r, ((size - w) // 2, (size - h) // 2), r)
    return canvas


def grid_cells(W: int, H: int, cols: int, rows: int):
    out = []
    for r in range(rows):
        y0, y1 = round(r * H / rows), round((r + 1) * H / rows)
        for c in range(cols):
            x0, x1 = round(c * W / cols), round((c + 1) * W / cols)
            out.append((x0, y0, x1, y1))
    return out


def auto_cells(keyed: Image.Image, merge: int, min_area: int):
    from scipy import ndimage

    mask = np.asarray(keyed)[..., 3] > 24
    if merge > 0:
        mask_d = ndimage.binary_dilation(mask, structure=np.ones((3, 3), bool), iterations=merge)
    else:
        mask_d = mask
    lab, n = ndimage.label(mask_d)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        if sl is None:
            continue
        area = int((mask[sl] & (lab[sl] == i)).sum())
        if area < min_area:
            continue
        ys, xs = sl
        boxes.append([xs.start, ys.start, xs.stop, ys.stop])
    if not boxes:
        return []
    # 行ごとに ならべる：高さの半分より 近い中心の高さは 同じ行
    hs = sorted(b[3] - b[1] for b in boxes)
    tol = max(4, hs[len(hs) // 2] * 0.5)
    boxes.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows, cur, cy = [], [], None
    for b in boxes:
        c = (b[1] + b[3]) / 2
        if cy is None or abs(c - cy) <= tol:
            cur.append(b)
            cy = c if cy is None else (cy * (len(cur) - 1) + c) / len(cur)
        else:
            rows.append(cur)
            cur, cy = [b], c
    rows.append(cur)
    out = []
    for row in rows:
        out.extend(sorted(row, key=lambda b: b[0]))
    return [tuple(b) for b in out]


def safe_name(s: str) -> str:
    s = re.sub(r"[^A-Za-z0-9_.-]", "_", s.strip())
    if not s or s in (".", "..") or s.startswith("."):
        raise SliceError(f"ファイル名に できない 名前です: {s!r}")
    return s[:80]


def slice_sheet(path, out_dir, *, grid=None, auto=False, names=None, key=(0, 255, 102), tol=70.0,
                fit=0, fmt="webp", quality=85, merge=6, min_area=64, margin=2):
    if bool(grid) == bool(auto):
        raise SliceError("--grid か --auto の どちらか 1つを 指定してください")
    if fmt not in ("webp", "png"):
        raise SliceError("--format は webp か png")
    if not (1 <= quality <= 100):
        raise SliceError("--quality は 1〜100")
    im = load_rgba(path)
    keyed = key_out(im, key, tol)
    if grid:
        cols, rows = grid
        cells = grid_cells(im.width, im.height, cols, rows)
    else:
        cells = auto_cells(keyed, merge, min_area)
    if names is not None and len(names) != len(cells):
        raise SliceError(f"名前の数（{len(names)}）と 絵の数（{len(cells)}）が ちがいます")
    if names is not None:
        names = [safe_name(n) for n in names]
        if len(set(n.lower() for n in names)) != len(names):
            raise SliceError("同じ名前が 2回 あります")
    os.makedirs(out_dir, exist_ok=True)
    items, skipped = [], 0
    for i, (x0, y0, x1, y1) in enumerate(cells):
        crop = keyed.crop((x0, y0, x1, y1))
        bb = alpha_bbox(crop)
        if bb is None:  # 空のマス
            skipped += 1
            continue
        bx0, by0, bx1, by1 = max(0, bb[0] - margin), max(0, bb[1] - margin), min(crop.width, bb[2] + margin), min(crop.height, bb[3] + margin)
        spr = crop.crop((bx0, by0, bx1, by1))
        spr = fit_canvas(spr, fit)
        name = names[i] if names else f"sprite_{i + 1:03d}"
        fn = f"{name}.{fmt}"
        if fmt == "webp":
            spr.save(os.path.join(out_dir, fn), "WEBP", quality=quality, method=4)
        else:
            spr.save(os.path.join(out_dir, fn), "PNG", optimize=True)
        items.append({"name": name, "file": fn, "index": i, "x": x0 + bx0, "y": y0 + by0, "w": bx1 - bx0, "h": by1 - by0,
                      "w_out": spr.width, "h_out": spr.height})
    if not items:
        raise SliceError("絵が 1つも 見つかりませんでした（背景の色（--key）や --tol を 見直してください）")
    manifest = {"source": os.path.basename(path), "sheet": [im.width, im.height], "mode": "auto" if auto else "grid",
                "count": len(items), "skippedEmpty": skipped, "sprites": items}
    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    return manifest


# ---------------------------------------------------------------- 自己テスト
def _make_test_sheet(path, cols=4, rows=2, cell=160, key=(0, 255, 102)):
    """形のちがう 8つの絵（円・四角・三角・輪・ななめの帯・小さな点つき・半透明ふち など）を 緑のシートに 描く。"""
    W, H = cols * cell, rows * cell
    big = Image.new("RGB", (W * 3, H * 3), key)  # 3倍で描いて 縮める（ふちを なめらかに）
    d = ImageDraw.Draw(big)
    S = 3

    def box(c, r, pad):
        return ((c * cell + pad) * S, (r * cell + pad) * S, ((c + 1) * cell - pad) * S, ((r + 1) * cell - pad) * S)

    shapes = [
        lambda b: d.ellipse(b, fill=(230, 60, 60)),
        lambda b: d.rectangle(b, fill=(60, 90, 230)),
        lambda b: d.polygon([((b[0] + b[2]) // 2, b[1]), (b[2], b[3]), (b[0], b[3])], fill=(250, 200, 40)),
        lambda b: (d.ellipse(b, fill=(150, 60, 200)), d.ellipse((b[0] + 45 * S, b[1] + 45 * S, b[2] - 45 * S, b[3] - 45 * S), fill=key)),
        lambda b: d.polygon([(b[0], b[3]), (b[0] + 30 * S, b[3]), (b[2], b[1]), (b[2] - 30 * S, b[1])], fill=(40, 170, 170)),
        lambda b: (d.rectangle((b[0], b[1], b[0] + 20 * S, b[1] + 20 * S), fill=(255, 120, 0)), d.rectangle((b[2] - 20 * S, b[3] - 20 * S, b[2], b[3]), fill=(255, 120, 0))),
        lambda b: d.ellipse(b, fill=(40, 40, 40)),  # 黒い円（暗い色も 残るか）
        lambda b: d.rectangle(b, fill=(240, 240, 240)),  # 白い四角
    ]
    for i, fn in enumerate(shapes[: cols * rows]):
        c, r = i % cols, i // cols
        fn(box(c, r, 24 if i != 5 else 40))
    sheet = big.resize((W, H), Image.LANCZOS)
    sheet.save(path, "PNG")
    return W, H


def selftest() -> int:
    ok = 0
    ng = 0

    def check(cond, msg):
        nonlocal ok, ng
        if cond:
            ok += 1
        else:
            ng += 1
            print("NG:", msg)

    def raises(fn, text):
        try:
            fn()
        except SliceError as e:
            return text in str(e)
        except Exception:
            return False
        return False

    with tempfile.TemporaryDirectory() as tmp:
        sheet = os.path.join(tmp, "sheet.png")
        _make_test_sheet(sheet)
        names = ["circle", "square", "tri", "ring", "band", "dots", "black", "white"]
        # 1) 格子
        m = slice_sheet(sheet, os.path.join(tmp, "g"), grid=(4, 2), names=names, fmt="png")
        check(m["count"] == 8 and m["skippedEmpty"] == 0, f"格子の数 {m['count']}")
        for it in m["sprites"]:
            im = _rgba(os.path.join(tmp, "g", it["file"]))
            a = np.asarray(im)
            # 不透明な ところに 緑かぶりが 残っていない
            op = a[..., 3] > 200
            green_spill = (a[..., 1].astype(int) - np.maximum(a[..., 0], a[..., 2]).astype(int))[op]
            check(green_spill.size == 0 or green_spill.max() <= 12, f"{it['name']}: 緑かぶり {green_spill.max() if green_spill.size else 0}")
            check(op.sum() > 50, f"{it['name']}: 絵が 消えた")
        c = np.asarray(_rgba(os.path.join(tmp, "g", "circle.png")))
        check(c[0, 0, 3] < 30, "円の 角が 透明でない")
        check(c[c.shape[0] // 2, c.shape[1] // 2, 3] > 240, "円の 中心が 不透明でない")
        r = np.asarray(_rgba(os.path.join(tmp, "g", "ring.png")))
        check(r[r.shape[0] // 2, r.shape[1] // 2, 3] < 30, "輪の あなが 透明でない（あなまで 塗りつぶされた）")
        b = np.asarray(_rgba(os.path.join(tmp, "g", "black.png")))
        check(b[b.shape[0] // 2, b.shape[1] // 2, 3] > 240 and b[b.shape[0] // 2, b.shape[1] // 2, :3].max() < 80, "黒が 残らない")
        w = np.asarray(_rgba(os.path.join(tmp, "g", "white.png")))
        check(w[w.shape[0] // 2, w.shape[1] // 2, 3] > 240 and w[w.shape[0] // 2, w.shape[1] // 2, :3].min() > 200, "白が 残らない")
        with open(os.path.join(tmp, "g", "manifest.json"), encoding="utf-8") as fh:
            mf = json.load(fh)
        check(mf["count"] == 8 and [s["name"] for s in mf["sprites"]] == names, "manifest の 順番")
        # 2) 自動
        # 「dots」は 2つの四角が はなれているので、自動では 2つに 分かれる（9個）。AIの絵の 浮いた かざりも 同じ。→ 格子が おすすめ
        names9 = names[:5] + ["dotsA", "dotsB"] + names[6:]
        ma = slice_sheet(sheet, os.path.join(tmp, "a"), auto=True, names=names9)
        check(ma["count"] == 9, f"自動で 見つけた数 {ma['count']}")
        by_g = {s["name"]: s for s in m["sprites"]}
        by_a = {s["name"]: s for s in ma["sprites"]}
        for n in names:
            if n in by_g and n in by_a:
                gg, aa = by_g[n], by_a[n]
                check(abs(gg["x"] - aa["x"]) <= 3 and abs(gg["y"] - aa["y"]) <= 3 and abs(gg["w"] - aa["w"]) <= 6 and abs(gg["h"] - aa["h"]) <= 6, f"{n}: 自動と格子の 位置が ずれ {gg} {aa}")
        # 3) 正方形に ならべる
        mfit = slice_sheet(sheet, os.path.join(tmp, "f"), grid=(4, 2), names=names, fit=128, fmt="png")
        with Image.open(os.path.join(tmp, "f", "tri.png")) as im:
            check(im.size == (128, 128) and im.mode == "RGBA", "fit の 大きさ")
        # 4) 色抜きなし（もとから透明）
        tr = Image.new("RGBA", (200, 100), (0, 0, 0, 0))
        ImageDraw.Draw(tr).ellipse((20, 20, 80, 80), fill=(255, 0, 0, 255))
        ImageDraw.Draw(tr).ellipse((120, 20, 180, 80), fill=(0, 255, 102, 255))  # 緑の絵も 残る
        p_tr = os.path.join(tmp, "tr.png")
        tr.save(p_tr)
        mt = slice_sheet(p_tr, os.path.join(tmp, "t"), auto=True, key=None, min_area=10)
        check(mt["count"] == 2, f"透明シートの 数 {mt['count']}")
        # 5) 失敗のしかた
        check(raises(lambda: slice_sheet(os.path.join(tmp, "none.png"), tmp, grid=(2, 2)), "ファイルが ありません"), "ファイルなし")
        bad = os.path.join(tmp, "bad.png")
        with open(bad, "wb") as fh:
            fh.write(b"not an image at all")
        check(raises(lambda: slice_sheet(bad, tmp, grid=(2, 2)), "画像として 読めません"), "画像でない")
        check(raises(lambda: slice_sheet(sheet, tmp, grid=(4, 2), names=["a"]), "名前の数"), "名前の数ちがい")
        check(raises(lambda: slice_sheet(sheet, tmp, grid=(4, 2), names=["a"] * 8), "同じ名前"), "名前の重なり")
        check(raises(lambda: slice_sheet(sheet, tmp, grid=(4, 2), names=["..", "b", "c", "d", "e", "f", "g", "h"]), "ファイル名"), "名前が ..")
        check(raises(lambda: safe_name(".."), "ファイル名"), "危ない名前 ..")
        check(raises(lambda: safe_name("../etc/passwd"), "ファイル名"), "パスの 区切りで 外に出る名前は 断る")
        check(safe_name("a/b") == "a_b" and safe_name("go ld") == "go_ld", "区切りと 空白を つぶす")
        check(raises(lambda: slice_sheet(sheet, tmp), "どちらか"), "grid も auto も なし")
        check(raises(lambda: slice_sheet(sheet, tmp, grid=(2, 2), auto=True), "どちらか"), "両方")
        check(raises(lambda: parse_grid("4*3"), "列x行"), "grid の 書式")
        check(raises(lambda: parse_grid("0x3"), "列x行"), "grid 0")
        check(raises(lambda: parse_key("zzz"), "6桁"), "key の 書式")
        check(parse_key("#00ff66") == (0, 255, 102) and parse_key("none") is None, "key")
        allg = os.path.join(tmp, "allgreen.png")
        Image.new("RGB", (100, 100), (0, 255, 102)).save(allg)
        check(raises(lambda: slice_sheet(allg, os.path.join(tmp, "x"), auto=True), "1つも"), "全部 緑")
        check(raises(lambda: slice_sheet(sheet, tmp, grid=(2, 2), fmt="gif"), "--format"), "format")
        tiny = os.path.join(tmp, "tiny.png")
        Image.new("RGB", (3, 3), (1, 2, 3)).save(tiny)
        check(raises(lambda: slice_sheet(tiny, tmp, grid=(1, 1)), "小さすぎ"), "小さい画像")
        # 空のマスは とばす
        half = Image.new("RGB", (200, 100), (0, 255, 102))
        ImageDraw.Draw(half).ellipse((10, 10, 90, 90), fill=(200, 30, 30))
        ph = os.path.join(tmp, "half.png")
        half.save(ph)
        mh = slice_sheet(ph, os.path.join(tmp, "h"), grid=(2, 1))
        check(mh["count"] == 1 and mh["skippedEmpty"] == 1, f"空のマス {mh}")
        # 同じ入力は 同じ出力（再現できる）
        import hashlib

        def h(dirp):
            blob = b""
            for n in sorted(os.listdir(dirp)):
                if n != "manifest.json":
                    with open(os.path.join(dirp, n), "rb") as fh:
                        blob += fh.read()
            return hashlib.sha256(blob).hexdigest()

        slice_sheet(sheet, os.path.join(tmp, "g2"), grid=(4, 2), names=names)
        slice_sheet(sheet, os.path.join(tmp, "g3"), grid=(4, 2), names=names, fmt="png")
        check(h(os.path.join(tmp, "g")) == h(os.path.join(tmp, "g3")), "同じ入力で 結果が ちがう")
    print(f"selftest: {ok} 件 OK / {ng} 件 NG")
    return EXIT_OK if ng == 0 else EXIT_NOSPRITE


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="1枚シートを 1つずつの透明画像に 切り出す", formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument("sheet", nargs="?")
    ap.add_argument("--grid")
    ap.add_argument("--auto", action="store_true")
    ap.add_argument("--names")
    ap.add_argument("--out", default="sliced")
    ap.add_argument("--key", default="00FF66")
    ap.add_argument("--tol", type=float, default=70.0)
    ap.add_argument("--fit", type=int, default=0)
    ap.add_argument("--format", default="webp")
    ap.add_argument("--quality", type=int, default=85)
    ap.add_argument("--merge", type=int, default=6)
    ap.add_argument("--min-area", type=int, default=64)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return selftest()
    if not a.sheet:
        ap.print_usage(sys.stderr)
        return EXIT_USAGE
    try:
        names = [n for n in a.names.split(",")] if a.names else None
        m = slice_sheet(a.sheet, a.out, grid=parse_grid(a.grid) if a.grid else None, auto=a.auto, names=names, key=parse_key(a.key),
                        tol=a.tol, fit=a.fit, fmt=a.format, quality=a.quality, merge=a.merge, min_area=a.min_area)
    except SliceError as e:
        print("エラー:", e, file=sys.stderr)
        return EXIT_NOSPRITE if "1つも" in str(e) else EXIT_USAGE
    print(f"{m['count']} 枚 を {a.out}/ に 書きました（空のマス {m['skippedEmpty']}）")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
