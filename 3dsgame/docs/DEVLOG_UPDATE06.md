## Update06 — 2026-11-03(数あてマジック=ひらめきタイム用ロジック)
今回やったこと:
- 新規モジュール `source/puzzle.h/.c`(game.c 非依存): 各位の和 pz_digit_sum、1桁になるまでの和 pz_digital_root、数あてマジックの段階 pz_magic9_steps(n,out[4])、答え pz_magic9_answer、全数で9になる検証 pz_magic9_always_nine、選択肢 pz_choice_text/pz_choice_is_correct(正解は「9の段は各位の和がいつも9になる」)、段階ヒント pz_hint、星評価 pz_stars。(story_bible E「数あてマジック」の実装準備)
- 単体テスト `tests/test_puzzle.c`(111300チェック)を追加、tools/run_tests.sh に組み込み。
テスト結果: puzzle 単体 111300チェック 全通過(-Wall -Wextra -Werror)。禁止語の簡易検査もローカルで新規ファイルのみ実施しOK。
今回できなかったこと(理由):
- 前回までと同様、game.c(35KB)/data_*.c/test_main.c の base64 転記は誤りやすく(今回も run_tests.sh/check_banned.py の手書き転記で1バイト欠落が起きた)、組み込みは見送り。既存の646/shop131/battle14393/equip_order165522/growth_enc156809 は未変更で再実行していない。
- check_banned.py は転記が壊れたためローカルでは実行せず、Driveのコピーをそのまま引き継いだ(copy_file)。
- Makefile 未変更(battle_ai/equip_save/turn_order/growth/encounter/puzzle は未リンク)。
- 一回限りの予約は作っていない(定期予約 毎日14時・0/8/16時 が有効で1件ずつあることを確認)。

## 次回(Update07)の予定
- [ ] 組み込み(最優先・Update06から持ち越し): ids.h に S_SHOP_*/S_INN_*、F_*。ミルフィに店/宿NPC。SC_SHOP。SaveData に EquipState(equip_pack/unpack)で SAVE_VERSION=3。ぼうぎょ/かばう、to_order、EnemyPattern、growth、encounter、puzzle(数あてマジックを data_story.c の推理に追加)を game.c へ。test_main.c に通しテスト。ファイル転記はBash側でbase64をパイプ復元せず、短いファイルから順にサイズ照合する。
- [ ] 第3章「勤勉の像の謎」着手(story_bible 参照)。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
