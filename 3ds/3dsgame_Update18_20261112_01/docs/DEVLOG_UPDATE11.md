## Update11 — 2026-11-08(第5章の下準備・ドット絵とBGM・ストーリー整理)
今回やったこと:
- 新規モジュール `source/ch5data.h/.c`(game.c 非依存): 第5章「首の病と最下位」の舞台(学び舎の中庭+保健室。25x15。先生N・出口D・調査スポット1〜4)、手がかり4つ(0=先生の見立て 1=ミオの勉強ノート 2=順位表 3=屋台の食材メモ。ビットマスク管理)、立ち直りの3択(正解は選択肢1「ねる時間を まもって、ミオと 一日ひとつずつ」)。準備完了=ノート(ID1)を読み、かつ3つ以上。
- 新規モジュール `source/ch5script.h/.c`(game.c 非依存): 場面6つ(NECK 首が回らない / LAST 最下位 / FESTIVAL 料理でおなかが しくしく / RIGHT / WRONG / RECOVER)。症状は軽い表現。話者7種。
- 単体テスト `tests/test_ch5.c`(394051チェック)を追加し tools/run_tests.sh の先頭に組み込み: 外周・出口・到達可能・スポット4つ・先生の位置・手がかり65536通りの総当たり・UTF-8・場面のつながり。
- 新規 `tools/make_assets.py` と `assets/`(Driveには未保存。ユーザーへチャットで配布済み): オリジナルのドット絵(tiles / chars / buildings / ui のPNG)とBGM3曲(野外・町・事件。OGG/MP3/WAV)。主人公・NPC・家・学び舎・屋台を見た目で区別できる。使い方は `docs/ASSETS.md`。
- 新規 `docs/STORY_GUIDE.md`: 「ストーリーがわかりにくい」という声への対応案(いまの目的を1行表示・あらすじメニュー・登場人物リスト・場面の最初に場所と時間の説明)と、第1〜5章のやさしいあらすじ、章ごとの目的文。
テスト結果: ch5 単体 394051チェック 全通過(-std=c99 -Wall -Wextra -Werror)。禁止語(虫・他社名)の簡易チェックで新規 .c/.h/テストに該当なし。
今回できなかったこと(理由):
- game.c への組み込み(Update10 から持ち越し)と既存テストの再実行。game.c(35KB)の転記が大きいため。既存ファイルは Drive 上でコピーのみ(未変更)。
- ch5 用の run_tests.sh 以外の既存ファイルの再テスト。実機・PCでの全体テストはユーザー側で `sh tools/run_tests.sh`。
- ドット絵の game への差し替え(platform_3ds.c の描画)と BGM再生。素材と手順(docs/ASSETS.md)まで。実機確認はユーザー側。
- 画像・音声のバイナリ(PNG/OGG/MP3/WAV)と make_assets.py はDriveへ保存していません(転送コストのため)。ユーザーへチャットで配布済み。次回、必要なら make_assets.py をユーザーから受け取るか作り直す。
- 古い `_RUNNING.txt`(11/3、別アカウント所有)は無視しました。

## 次回(Update12)の予定
- [ ] 組み込み(最優先・持ち越し): game.c へ ch3/ch4/ch5 のマップ・調査・場面表示、ids.h、shop/宿、SaveData 等(Update10 の予定を参照)。
- [ ] 「いまの目的」表示とあらすじメニュー(docs/STORY_GUIDE.md)。
- [ ] platform_3ds.c を PNG(tex3ds/citro2d)描画へ、BGM再生(ndsp+OGG)。
- [ ] 第6章「ミオの特訓」の下準備(ch6data / ch6script)。
