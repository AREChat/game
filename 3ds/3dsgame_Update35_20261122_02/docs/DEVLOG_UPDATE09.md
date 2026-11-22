## Update09 — 2026-11-06(第3章のスクリプト)
今回やったこと:
- 新規モジュール `source/ch3script.h/.c`(game.c 非依存): 第3章「勤勉の像の謎」の台本データ。
  - 場面4つ: INTRO(全校生徒の前で推理を始める)/ RIGHT(推理が正解: 像の台座の手紙が見つかり、像は残る)/ WRONG(不正解: 調査にもどる)/ MOVE(母からの知らせ → 山里クロモリへ引っ越し)。
  - 話者は7種(ナレーション/主人公/セラ/ガイ/生徒たち/先生/母)。`ch3s_len` `ch3s_speaker` `ch3s_text` `ch3s_speaker_name`。
  - 推理の結果(clue.h の CL_RIGHT / CL_WRONG / CL_NOT_READY)から場面を選ぶ `ch3s_scene_for_verdict`、正解のあとに MOVE を続ける `ch3s_next_scene`。
- 単体テスト `tests/test_ch3script.c`(177チェック)を追加し tools/run_tests.sh の先頭に組み込み: 範囲外の安全性、UTF-8の妥当性、1行の長さ、禁止語(虫・他社作品名)なし、clue.h の定数との対応、場面のつながり。
テスト結果: ch3script 単体 177チェック 全通過(-std=c99 -Wall -Wextra -Werror)。実名の禁止語リスト(tools/private_blocklist.txt)との照合も該当なし。
今回できなかったこと(理由):
- game.c(35KB)等の転記コストが大きく、game.c への組み込みと既存テスト(646/shop131/battle14393/clue_name/ch3data 等)の再実行は引き続き見送り(これらは未変更でDrive上でそのままコピー)。tools/check_banned.py もこの環境では実行していない(ファイルは未変更のままコピー)。
- Makefile は未変更(ch3script.c は未リンク。組み込み時に SOURCES へ追加すること)。

## 次回(Update10)の予定
- [ ] 組み込み(最優先・持ち越し): ids.h に S_SHOP_*/S_INN_*、F_*、第3章マップ(ch3data)と調査イベント、ch3script の場面表示。ミルフィに店/宿NPC。SC_SHOP。SaveData に EquipState で SAVE_VERSION=3。ぼうぎょ/かばう、EnemyPattern、growth、encounter、puzzle、clue、namemem を game.c / data_story.c へ。test_main.c に通しテスト。
- [ ] 第4章「家族の危機」の下準備(ch4data / ch4script を game.c 非依存で先に作る)。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
- 取得コスト対策: 変更するファイルだけを download_file_content で取得し、残りは copy_file で引き継ぐ。
