"""check_glyphs.py - 3DSの 本体フォントで 出ない かもしれない 文字が ゲームの 文字列に 入っていないか しらべる。
 JIS X 0208(Shift_JIS)に ない 文字を ならべる。実機で 四角(□)や 文字化けに なる おそれが ある。"""
import glob, re, collections, os, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# 実機で 表示できると 確かめた 文字(これまでの 版で 動いている)
OK = set("▶▼▲↑↓←→★●○◎◆◇♪…「」『』・※")
BAN = "〜～"   # 実機で「〇」などに 化けた(波ダッシュ・全角チルダ)。のばす ときは「ー」を つかう
bad = collections.defaultdict(list)
pat = re.compile(r'"((?:[^"\\]|\\.)*)"')
for p in glob.glob("source/*.c") + glob.glob("source/*.inc") + glob.glob("source/*.h"):
    if re.match(r"ch\d(data|script)\.[ch]$", os.path.basename(p)): continue   # 古い試作モジュール(ゲームでは 使わない)
    for ln, line in enumerate(open(p, encoding="utf-8").read().splitlines(), 1):
        for m in pat.finditer(line):
            for ch in m.group(1):
                if ch in BAN: bad[ch].append((os.path.basename(p), ln)); continue
                if ord(ch) < 0x80 or ch in OK: continue
                try: ch.encode("shift_jis")
                except Exception: bad[ch].append((os.path.basename(p), ln))
for ch, locs in sorted(bad.items()):
    print("U+%04X x%d  %s" % (ord(ch), len(locs), locs[:3]))
print("bad chars:", len(bad))
sys.exit(1 if bad else 0)
