## Update05 — 2026-11-03(経験値成長・エンカウント判定ロジック)
今回やったこと:
- 新規モジュール `source/growth.h/.c`(game.c 非依存): 必要経験値 gr_need、累計 gr_total_for、レベル算出 gr_level_of、経験値加算(上限999999・上限レベル30)gr_add_exp、能力値成長 gr_stat(10倍成長値)、経験値の人数割り gr_share(切り上げ・最低1)、レベル差補正 gr_level_gap_pct(50〜150%)。
- 新規モジュール `source/encounter.h/.c`(game.c 非依存・決定的な疑似乱数): 歩数エンカウント enc_step(戦闘後6歩は安全、40歩で必ず出現、rate=0なら出ない)、enc_rand、重み付き選択 enc_pick(不正入力は -1)。
- 単体テスト `tests/test_growth_enc.c`(156809チェック)を追加、tools/run_tests.sh に組み込み。
テスト結果: growth/encounter 単体 156809チェック 全通過(-Wall -Wextra -Werror)。
今回できなかったこと(理由):
- game.c/data_*.c/test_main.c の base64 転記は誤りやすく、read_file_content は整形済みで復元に使えないため、組み込みは今回も見送り。既存の646/shop131/battle14393/equip_order165522 は未変更で、ローカルでは再実行していない。
- 禁止語チェックは新規ファイルと docs のみ対象でローカル実行(check_banned.py + ブロックリスト取得済み)。
- 運用メモ: 予約は定期予約(毎日14時、0/8/16時)に移行ずみのため、一回限りの予約は作らず AUTOMATION.md をそれに合わせて修正。
- Makefile 未変更(battle_ai.c/equip_save.c/turn_order.c/growth.c/encounter.c は未リンク)。

## 次回(Update06)の予定
- [ ] 組み込み(最優先): ids.h に S_SHOP_*/S_INN_*、F_*。ミルフィに店/宿NPC。SC_SHOP。SaveData に EquipState(equip_pack/unpack)で SAVE_VERSION=3。ぼうぎょ/かばう、to_order、EnemyPattern、growth(経験値・レベル)、encounter(フィールド歩数)を game.c へ。test_main.c に通しテスト。game.c 等はDriveの download_file_content を一括で取得し、変更ファイルのみ create_file する。
- [ ] 第3章「勤勉の像の謎」着手(story_bible 参照)。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
