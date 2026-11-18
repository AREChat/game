## Update04 — 2026-11-02(装備セーブ変換・行動順ロジック)
今回やったこと:
- 新規モジュール `source/equip_save.h/.c`(game.c 非依存): EquipState を int 配列(末尾チェックサム付き)へ詰める/戻す。SAVE_VERSION=3 組み込み用。equip_validate(ID範囲・所持数0..99・装備数<=所持数、「なし」は無制限)、equip_pack、equip_unpack(壊れたデータは拒否し出力は不変)。
- 新規モジュール `source/turn_order.h/.c`: すばやさ降順・同値は添字順・戦闘不能除外の行動順 to_order。
- 単体テスト `tests/test_equip_order.c`(165522チェック: 全ワード破損・チェックサム整合の不正値・全組み合わせ往復・行動順の総当たり)を追加、tools/run_tests.sh に組み込み。
テスト結果: equip_order 単体 165522チェック 全通過(-Wall -Wextra -Werror)。
今回できなかったこと(理由):
- base64の手作業転記コストのため、game.c・data_*.c・test_main.c は未取得。組み込み(ショップ/宿/ぼうぎょ/かばう/SAVE_VERSION=3)と既存646+shop131+battle14393項目の再実行は未実施(これらは未変更)。ローカルで実行できたのは新規単体テストのみ。ローカルでは check_banned.py も未取得のため、新規ファイルをブロックリスト語でgrep確認した。
- Makefile 未変更(battle_ai.c/equip_save.c/turn_order.c は未リンク。組み込み時に SOURCES へ追加)。
- 原資料PDFの追加抽出は今回見送り。

## 次回(Update05)の予定
- [ ] 組み込み(最優先): ids.h に S_SHOP_*/S_INN_*、F_*。data_world.c のミルフィに店/宿NPC。game.c に SC_SHOP。SaveData に EquipState(equip_pack/unpack 経由)を足して SAVE_VERSION=3。戦闘に ぼうぎょ/かばう、行動順に to_order、敵データに EnemyPattern。test_main.c に通しテスト。
- [ ] 第3章「勤勉の像の謎」着手(story_bible 参照)。
- [ ] 実機ビルド確認(ユーザー側で BUILD_JA.md)。
- 取得コスト対策: 組み込み回は game.c 等を一度に取得してまとめて実装する。
