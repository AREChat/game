#!/usr/bin/env python3
"""禁止語チェック: 虫(昆虫・クモ等)関連の語と、実在の人物名・他社作品固有名詞が混入していないかを確認する。"""
import sys, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
# 虫は一切禁止
BUG = ["虫", "蜂", "蝶", "蛾", "蟻", "蚊", "蝿", "蜘蛛", "蜻蛉", "蝉", "蛍", "甲虫", "毛虫", "芋虫", "蛆", "蠍",
       "ハチ", "チョウ", "ムシ", "アリ", "カブトムシ", "クワガタ", "バッタ", "コオロギ", "ゴキブリ", "テントウ",
       "トンボ", "セミ", "ホタル", "ガ(", "クモ", "ダニ", "ノミ", "ハエ", "カ(蚊)", "昆虫", "インセクト", "bug", "insect", "spider", "beetle", "ant "]
# 他社作品・実在の固有名詞(権利配慮)
IP = ["ドラゴンクエスト", "ドラクエ", "スライム", "ビアンカ", "フローラ", "天空", "ゼルダ", "ポケモン", "ポケットモンスター",
      "マリオ", "ファイナルファンタジー", "ロト", "ダイの大冒険", "名探偵コナン", "金田一", "ワンピース"]
# 元資料に出てくる実名・地名の取り込み防止(元PDFの語は tools/private_blocklist.txt に置く。配布物には含めない)
files = [p for p in list((root / "source").glob("*")) + list((root / "docs").glob("*")) + [root / "README.txt"] if p.is_file()]
extra = []
bl = root / "tools" / "private_blocklist.txt"
if bl.exists():
    extra = [l.strip() for l in bl.read_text(encoding="utf-8").splitlines() if l.strip()]
bad = 0
for p in files:
    if p.suffix not in (".c", ".h", ".md", ".txt", ""):
        continue
    t = p.read_text(encoding="utf-8", errors="ignore")
    # ドキュメント中の禁止事項の説明文(禁止リストそのものの引用)は除外する
    if p.name in ("story_bible.md", "README.txt", "ROADMAP.md", "BUILD_JA.md", "AUTOMATION.md") or p.name.startswith("DEVLOG"):
        t = "\n".join(l for l in t.splitlines() if "【禁止】" not in l and "禁止語" not in l)
    for w in BUG + IP + extra:
        if w.lower().endswith("(") or w.endswith(" "):
            continue
        # 「アリ」「ガ」等の短語は単語として誤検出しやすいので、2文字以上の語のみ照合し、
        # 日本語の語尾(あります等ひらがな)との混同を避けるため全角カタカナ/漢字語のみ対象にする
        if w in ("アリ", "セミ", "ノミ", "ダニ", "クモ", "ハチ", "チョウ", "ムシ", "ハエ"):
            if re.search(w + r"(?![ァ-ヴー])", t) and not re.search(r"[ァ-ヴー]" + w, t):
                print(f"BANNED '{w}' in {p.relative_to(root)}"); bad += 1
            continue
        if w in t:
            print(f"BANNED '{w}' in {p.relative_to(root)}"); bad += 1
print("banned-word check:", "OK" if bad == 0 else f"{bad} problem(s)")
sys.exit(1 if bad else 0)
