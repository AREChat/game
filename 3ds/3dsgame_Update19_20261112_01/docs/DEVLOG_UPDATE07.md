## Update07 — 2026-11-03(第3章の手がかりボード・第4章の名前記憶ロジック)
今回やったこと:
- 新規モジュール `source/clue.h/.c`(game.c 非依存): 第3章「勤勉の像の謎」用の手がかりボード。手がかり5つ(ID0..4)をビットマスクで管理。cl_add(新規/重複/不正ID)、cl_count、cl_ready(必須=ID0,1,2 かつ4つ以上)、cl_verdict(未準備/不正解/正解。正解は選択肢1「会計係が像の金ぱくをはがして売った」)、cl_stars(1..3)、cl_hint(足りない手がかりを順に案内)、cl_text/cl_choice。
- 新規モジュール `source/namemem.h/.c`(game.c 非依存): 第4章「全員の名前を覚える作戦」ミニゲーム。名前プール8(すべて架空)、nm_show_count(3+ラウンド、最大8)、nm_order(seedから決定的な順列)、nm_correct、nm_percent、nm_rank(0..3)。
- 単体テスト `tests/test_clue_name.c`(2078276チェック: 手がかりマスク65536通り総当たり、seed 20000通りの順列検証)を追加、tools/run_tests.sh の先頭に組み込み。
- docs/AUTOMATION.md を更新(0時・8時・14時・16時の実行時刻、_RUNNING.txt による待ち合わせ、取得コスト対策)。
設計メモ(第3章):
- 手がかり: 0 台座の裏の新しい削り跡 / 1 像の持つ本が白紙 / 2 会計帳に修理代がない / 3 夜の庭の荷車のわだち / 4 石工の古い手紙。真相は会計係の金ぱく売却(暴力・流血なし)。
テスト結果: clue/namemem 単体 2078276チェック 全通過(-Wall -Wextra -Werror)。新規ファイルの禁止語(private_blocklist.txt 全語・虫関連語)grep はOK。
今回できなかったこと(理由):
- game.c(35KB)/data_*.c/test_main.c の転記は、base64をこの環境で再出力する必要がありコストと転記ミスのリスクが大きく、今回も見送り。既存テスト(646/shop131/battle14393/equip_order165522/growth_enc156809/puzzle111300)は未変更で再実行していない。
- check_banned.py はDriveのコピーをそのまま引き継いだ(ローカルでは未実行、代わりにgrepで確認)。
- Makefile は wildcard 方式のため source/ の新規 .c(clue/namemem 等)は3DSビルドに自動で含まれる(game.c からは未使用)。Makefile 自体は未変更。

## 次回(Update08)の予定
- [ ] 組み込み(最優先・持ち越し): ids.h に S_SHOP_*/S_INN_*、F_*。ミルフィに店/宿NPC。SC_SHOP。SaveData に EquipState(equip_pack/unpack)で SAVE_VERSION=3。ぼうぎょ/かばう、to_order、EnemyPattern、growth、encounter、puzzle、clue、namemem を game.c / data_story.c へ。test_main.c に通しテスト。
- [ ] 第3章のデータ(マップ25x15・スクリプト・手がかり調査イベント)を data_world.c / data_story.c に追加。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
