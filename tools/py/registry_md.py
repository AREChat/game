#!/usr/bin/env python3
"""ゲーム一覧（shared/games-registry.json）から、ジャンル別の一覧表 GAMES.md を作る道具。
  python3 tools/py/registry_md.py          … GAMES.md を書く
  python3 tools/py/registry_md.py --check  … いまの GAMES.md が 最新か 確かめる
README の「どのゲームが どのフォルダか」を 手で書きなおさなくて すむように、表は ここから 作ります。"""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LANG_NAMES = {"ja": "日本語", "en": "English", "zh": "中文", "ko": "한국어"}


def render(reg: dict) -> str:
    out = ["# ゲーム一覧（ジャンル別）", "",
           "自動で作られるファイルです（直接は直しません）。元は `shared/games-registry.json` → `python3 tools/py/registry_md.py`。", ""]
    for gn in reg["genres"]:
        games = sorted((g for g in reg["games"] if g["genre"] == gn["id"]), key=lambda g: g["order"])
        out += [f"## {gn['emoji']} {gn['name']['ja']}（{gn['name']['en']}）", "", gn["blurb"]["ja"], "",
                "| 順 | ゲーム | フォルダ | 英語名 | 中国語名 | 韓国語名 | ゲーム内の言語 | パッド |", "|---|---|---|---|---|---|---|---|"]
        for g in games:
            langs = "・".join(LANG_NAMES[x] for x in g["inGameLangs"])
            flags = ("🆕 " if g.get("isNew") else "") + ("🔞20+ " if g.get("adult") else "")
            folder = "（チャットのサイト内）" if g.get("ext") else f"`{g['folder']}/`"
            out.append(f"| {g['order']} | {flags}{g['emoji']} {g['name']['ja']} | {folder} | {g['name']['en']} | {g['name']['zh']} | {g['name']['ko']} | {langs} | {'○' if g.get('gamepad') else '－'} |")
        out.append("")
    n4 = sum(1 for g in reg["games"] if len(g["inGameLangs"]) == 4)
    out += [f"- ゲームは {len(reg['games'])} 本・ジャンルは {len(reg['genres'])} つ。ゲームの中の文章が 4か国語なのは {n4} 本（ほかは 入口・ジャンルページ・「ほかのゲームへ」だけ 4か国語で、ゲームの中は 日本語）。", ""]
    return "\n".join(out)


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    reg = json.load(open(os.path.join(ROOT, "shared", "games-registry.json"), encoding="utf-8"))
    text = render(reg)
    path = os.path.join(ROOT, "GAMES.md")
    if "--check" in argv:
        cur = open(path, encoding="utf-8").read() if os.path.isfile(path) else None
        if cur != text:
            print("NG: GAMES.md が古い（python3 tools/py/registry_md.py）", file=sys.stderr)
            return 1
        print("OK: GAMES.md は最新")
        return 0
    open(path, "w", encoding="utf-8").write(text)
    print("書きました: GAMES.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
