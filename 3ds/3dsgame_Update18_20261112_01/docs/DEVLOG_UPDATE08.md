## Update08 — 2026-11-03(第3章のマップ・調査スポット・会話データ)
今回やったこと:
- 新規モジュール `source/ch3data.h/.c`(game.c 非依存): 第3章「勤勉の像の謎」の学び舎の庭マップ(25x15、像・ベンチ・出口・調査スポット1〜5)、調査スポット→手がかりID(0..4)の対応、調べた時の文、周囲の人の話(4)、推理の判定文(正解/不正解/準備不足)。
  - タイル凡例: `#`かべ `.`ゆか `,`しばふ `S`像(通れない) `B`ベンチ(通れない) `D`出口 `1`〜`5`調査スポット。
- 単体テスト `tests/test_ch3data.c`(2946チェック)を追加し tools/run_tests.sh に組み込み: 外周が壁/範囲外、出口1つ、像12マス、歩ける所すべて到達可能、各手がかりのスポットがちょうど1つで到達可能、5!=120通りの調査順で clue.c の ready/stars/verdict が期待どおり、ヒント案内に従えば準備完了、文のUTF-8妥当性。
テスト結果: ch3data 単体 2946チェック 全通過(-Wall -Wextra -Werror)。禁止語チェックOK。
今回できなかったこと(理由):
- game.c(35KB)/test_main.c の転記コストが大きく、組み込みと既存テスト(646/shop131/battle14393/clue_name 等)の再実行は引き続き見送り(これらは未変更)。ローカルで実行したのは ch3data 単体と禁止語チェックのみ。
- tools/check_banned.py は(ローカル再構成版が1バイト違いのため)Drive上のコピーをそのまま引き継いだ。

## 次回(Update09)の予定
- [ ] 組み込み(最優先・持ち越し): ids.h に S_SHOP_*/S_INN_*、F_*、第3章マップ(ch3data)と調査イベント。ミルフィに店/宿NPC。SC_SHOP。SaveData に EquipState で SAVE_VERSION=3。ぼうぎょ/かばう、EnemyPattern、growth、encounter、puzzle、clue、namemem を game.c / data_story.c へ。test_main.c に通しテスト。
- [ ] 第3章のスクリプト(全校生徒の前での推理シーン、クロモリへの引っ越し導入)。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
- 取得コスト対策: 変更するファイルだけを download_file_content で取得し、残りは copy_file で引き継ぐ。game.c に触れない純粋ロジックを先に増やすと検証しやすい。
