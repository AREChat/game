## Update13 — 2026-11-11(第7章「挑戦状」の下準備+画像・BGM・人と建物の見分け)
今回やったこと:
- 新規 `source/ch7data.h/.c`(第7章の舞台=汽車の都レイルハイムの駅広場 25x15・ユノ・手がかり4つ・3択の判断)、`source/ch7script.h/.c`(場面6つ・話者5種)。単体テスト `tests/test_ch7.c`(853276チェック、全通過)。
- 新規 `source/sprites.h/.c`: マップ記号・登場人物・建物と画像番号の対応表。人(まるい顔のイラスト)・建物(屋根つき)・地面を種類(SPK_*)で区別。単体テスト `tests/test_sprites.c`(823チェック、全通過)。
- 新規 `tools/make_assets.py`: 画像(tiles/chars/buildings/ui/legend)とBGM(field/town/event の ogg/mp3/wav)を作る。人は持ち物で見分けがつく16x16、建物は看板マークつき48x48。docs/ASSETS_UPDATE14.md に使い方。画像・BGMの実体はチャットへzipで渡した(Driveへバイナリを直接上げられないため)。
- tools/run_tests.sh に sprites と ch7 を追加。
- 禁止語の確認: blocklist の全語・虫(漢字・カタカナ)・他社名を新規ファイルに grep で確認(該当なし)。check_banned.py 本体の実行はしていない。
テスト結果: ch7 853276 / sprites 823 チェック 全通過(-std=c99 -Wall -Wextra -Werror -Wno-unused-parameter)。
今回できなかったこと(理由):
- game.c への組み込み(Update10 から持ち越し。35KBの転記が大きい)。platform_3ds.c の画像描画・BGM再生への差し替え(実機ビルドは未検証。game.c を触らず platform 層だけで可能)。
- 既存テスト(ch3〜ch6、shop、battle など)の再実行。古い ASSETS.md は削除が許可されず残っている(新しい版は ASSETS_UPDATE14.md)。
- 古い `_RUNNING.txt`(11/3、別アカウント所有)は8時間超なので無視した。
次回(Update14)の予定:
- [ ] 組み込み(最優先・持ち越し): game.c へ ch3〜ch7 のマップ・調査・場面表示、ids.h、shop/宿、SaveData 等。
- [ ] platform_3ds.c を画像描画(sprites.h の対応表を使う)とBGM再生へ。章ごとにBGM切替(第1章=field、第2〜3章=town、ひらめきタイム=event)。
- [ ] 第8章「試験の都」の下準備(ch8data / ch8script)。
