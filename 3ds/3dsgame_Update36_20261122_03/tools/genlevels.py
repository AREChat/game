"""2Dアクションの面を つくって source/data_action.c に書く。面は ここで 組み立てる(手で ならべる)。"""
import os
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
R = 15

class Lv:
    def __init__(self, w):
        self.w = w
        self.g = [["."] * w for _ in range(R)]
    def put(self, c, r, ch):
        if 0 <= c < self.w and 0 <= r < R:
            self.g[r][c] = ch
    def floor(self, c0, c1, top=13):
        for c in range(c0, c1 + 1):
            for r in range(top, R):
                self.put(c, r, "#")
    def plat(self, c0, c1, r, ch="#"):
        for c in range(c0, c1 + 1):
            self.put(c, r, ch)
    def wall(self, c, r0, r1, ch="#"):
        for r in range(r0, r1 + 1):
            self.put(c, r, ch)
    def spikes(self, c0, c1, r):
        for c in range(c0, c1 + 1):
            self.put(c, r, "^")
    def rows(self):
        return ["".join(r) for r in self.g]

def border(lv):
    # 左右のかべ(ゴール前の行き止まり用)は act_tile が 作る。天井は 作らない。
    pass

# ---------------------------------------------------------------- 星のぼり(はしる・ジャンプ・バネ)
def climb():
    L = Lv(88)
    L.floor(0, 13); L.put(2, 12, "S")
    L.spikes(9, 9, 12)
    L.floor(16, 24); L.put(20, 11, "*")
    L.plat(26, 28, 11); L.plat(30, 32, 9); L.plat(34, 37, 7); L.put(35, 5, "*")
    L.floor(40, 60)
    L.spikes(44, 46, 12); L.put(50, 12, "C"); L.put(48, 10, "*")
    L.put(54, 13, "J")
    L.plat(56, 60, 9); L.put(58, 7, "*")
    L.plat(62, 64, 7); L.plat(66, 68, 5); L.put(67, 3, "*")
    L.plat(72, 86, 6); L.put(85, 5, "G")
    L.put(78, 5, "*"); L.spikes(80, 81, 5)
    return L

# ---------------------------------------------------------------- くずれる洞くつ(自動スクロール・ダッシュ)
def collapse():
    L = Lv(112)
    L.floor(0, 16); L.put(3, 12, "S")
    L.floor(20, 28); L.spikes(24, 24, 12); L.put(22, 11, "*")
    L.floor(32, 36); L.put(34, 12, "C")
    L.floor(42, 52); L.spikes(46, 47, 12); L.put(50, 11, "*")
    L.plat(56, 58, 10); L.floor(62, 70); L.put(60, 8, "*")
    L.floor(74, 76); L.put(75, 12, "C")
    L.floor(82, 92); L.spikes(86, 86, 12); L.spikes(89, 89, 12)
    L.put(88, 10, "*")
    L.floor(96, 111); L.put(108, 12, "G"); L.put(100, 11, "*")
    return L

# ---------------------------------------------------------------- かげと光(Xで きりかえ)
def shadow():
    L = Lv(100)
    L.floor(0, 15); L.put(2, 12, "S")
    # 光の かべ: 光の世界では とおれない → X で かげにして すり抜ける
    L.wall(10, 8, 12, "L"); L.put(8, 12, "*")
    L.floor(16, 22); L.put(18, 12, "C")
    # 谷: 光の足場 → かげの足場 → 光の足場
    L.plat(25, 27, 12, "L"); L.plat(30, 32, 12, "D"); L.plat(35, 37, 11, "L"); L.plat(40, 42, 11, "D")
    L.put(31, 10, "*")
    L.floor(46, 56); L.put(48, 12, "C")
    # かげの かべ: かげの世界では とおれない(光の世界で すすむ)
    L.wall(52, 6, 12, "D"); L.put(50, 11, "*")
    L.spikes(54, 55, 12)
    L.floor(60, 62); L.plat(65, 67, 11, "D"); L.plat(70, 72, 10, "L"); L.plat(75, 77, 9, "D")
    L.put(71, 8, "*")
    L.floor(80, 99, 10); L.put(83, 9, "C"); L.wall(88, 4, 9, "L"); L.put(96, 9, "G")
    return L

stages = [
    ("星のぼり", "A:ジャンプ(おすほど たかく) B:ダッシュ ↑のバネで とびあがれ！ ▲はトゲ", climb(), False, False, True),
    ("くずれる洞くつ", "画面が すすむ！ おいつかれないよう はしれ。B:ダッシュで 広い 穴も こえる", collapse(), True, False, True),
    ("かげと光", "X: 光の世界と かげの世界を きりかえ。黄の足場は 光、むらさきは かげの せかいだけ", shadow(), False, True, True),
]

def cstr(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

out = ['/* data_action.c - 2Dアクションの面(genlevels.py で つくった もの。手で なおさない) */', '#include "action.h"', '',
       'const ActStage ACT_STAGES[ACT_STAGE_COUNT] = {']
for title, hint, lv, auto, sw, dash in stages:
    out.append("    { %s, %s, %d, %s, %s, %s, {" % (cstr(title), cstr(hint), lv.w, "true" if auto else "false", "true" if sw else "false", "true" if dash else "false"))
    rows = lv.rows()
    for i, r in enumerate(rows):
        assert len(r) == lv.w
        out.append("        %s%s" % (cstr(r), "," if i < R - 1 else ""))
    out.append("    } },")
out.append("};")
open("source/data_action.c", "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")
print("written")
