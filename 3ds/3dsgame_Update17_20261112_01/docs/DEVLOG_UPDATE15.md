# DEVLOG Update15 (2026-11-11)
土台: 3dsgame_Update13_20261111_02 (Update14の追加分を含む)
今回やったこと:
- 新規 source/ch8data.h/.c: 第8章「試験の都」の舞台(学びの都ルミナリアの試験会場前広場 25x15)・試験官メルガ・手がかり4つ・3択の判断。
- 新規 source/ch8script.h/.c: 場面6つ(到着/試験の説明/考える/正解/不正解/合格発表)・話者5種。
- 新規 tests/test_ch8.c: 853273 チェック、失敗0 (-std=c99 -Wall -Wextra -Werror)。
- tools/run_tests.sh に ch8 を追加。
- 禁止語: blocklist・虫・他社名を新規ファイルで確認(該当なし)。
今回できなかったこと:
- game.c への組み込み(35KB。Driveから正確に取得して書き戻す手段がこの環境にない)。
- ch3〜ch7・本体・check_banned.py の再実行(元ファイルを手元に持てないため。コピーのみ)。
次回の予定:
- [ ] game.c へ ch3〜ch8 を組み込み(最優先・持ち越し)
- [ ] platform_3ds.c を画像描画とBGM再生へ
- [ ] 第9章の下準備(ch9data / ch9script)
