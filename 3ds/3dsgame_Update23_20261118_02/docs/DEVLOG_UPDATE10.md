## Update10 — 2026-11-08(第4章「家族の危機」のデータと台本)
今回やったこと:
- 新規モジュール `source/ch4data.h/.c`(game.c 非依存): 第4章の舞台(山里クロモリの崩れた家のまわり。25x15、がれき・母・出口・調査スポット1〜4)、母を探す手がかり4つ(ビットマスク管理: ch4_add / ch4_count / ch4_ready / ch4_hint)、説得の3択(ch4_choice / ch4_verdict / ch4_stars)、村の人の話3つ。
  - タイル凡例: `#`かべ `.`みち `,`しばふ `R`がれき(通れない) `M`母(通れない) `D`出口 `1`〜`4`調査スポット。
  - 準備完了の条件: 机の書き置き(ID2)を読み、かつ手がかり3つ以上。説得の正解は選択肢1(「家は直せるよ。みんなで いっしょに 住める 場所を つくろう」)。
- 新規モジュール `source/ch4script.h/.c`(game.c 非依存): 場面5つ(ACCIDENT 嵐で家がこわれる / LEAVE 母の家出 / RIGHT 説得が正解 / WRONG 説得が不正解 / NEWSCHOOL クロモリの学び舎で名前を覚える作戦)。話者は7種。`ch4s_scene_for_verdict` `ch4s_next_scene` で場面をつなぐ。
- 単体テスト `tests/test_ch4.c`(1378268チェック)を追加し tools/run_tests.sh の先頭に組み込み: 外周・出口・がれき・母のとなりに立てること・歩ける所すべて到達可能・スポットがちょうど1つ・手がかりマスク65536通りの総当たり・24通りの調査順・ヒントに従えば準備完了・UTF-8妥当性・禁止語なし・場面のつながり。
- docs/AUTOMATION.md を現在の運用(8時間に1回=日本時間 0:47・8:47・16:47、実行中印が8時間以内にあれば待たずに終了、予約の確認は報告のみ)に更新。
テスト結果: ch4 単体 1378268チェック 全通過(-std=c99 -Wall -Wextra -Werror)。禁止語チェック(tools/check_banned.py。private_blocklist.txt 込み)も新規ファイルと docs について該当なし。
今回できなかったこと(理由):
- game.c(35KB)等の転記コストが大きく、game.c への組み込みと既存テスト(646/shop131/battle14393/equip_order165522/growth_enc156809/puzzle111300/clue_name/ch3data/ch3script)の再実行は見送り(これらは未変更でDrive上でそのままコピー)。
- Makefile は wildcard 方式のため source/ の新規 .c は3DSビルドに自動で含まれる(game.c からは未使用)。Makefile は未変更。
- 実行中印 `_RUNNING.txt` に、3日前(11/4 0:15 JST)の古い印が別アカウント所有で残っていた(8時間超なので無視して続行。こちらからは消せなかった)。

## 次回(Update11)の予定
- [ ] 組み込み(最優先・持ち越し): ids.h に S_SHOP_*/S_INN_*、F_*、第3章・第4章マップ(ch3data/ch4data)と調査イベント、ch3script/ch4script の場面表示。ミルフィに店/宿NPC。SC_SHOP。SaveData に EquipState で SAVE_VERSION=3。ぼうぎょ/かばう、EnemyPattern、growth、encounter、puzzle、clue、namemem を game.c / data_story.c へ。test_main.c に通しテスト。
- [ ] 第5章「首の病と最下位」の下準備(ch5data / ch5script を game.c 非依存で先に作る)。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
- 取得コスト対策: 変更するファイルだけを download_file_content で取得し、残りは copy_file で引き継ぐ。
