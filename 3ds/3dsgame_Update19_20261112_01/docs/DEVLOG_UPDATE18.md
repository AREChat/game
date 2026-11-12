# DEVLOG Update18 (2026-11-12)
土台: Update17
今回やったこと:
- 第3章「勤勉の像の謎」を game.c につないだ。第2章クリア後に「勤勉の像の庭」へ移動し、手がかり5つ(順番に調べる)→みんなの前で推理(ひらめき)→第4章カードまで遊べる。新エリア・NPC・スクリプト・推理を追加(data_story.c / data_world.c / ids.h)。
- 像(S)とベンチ(B)は通れない。出口から学び舎へ戻れる。
- 戦闘コマンドのカーソルを2x2に整理(上下=たて、左右=よこ)。通しプレイ(tools/playtest.c)のキー操作も合わせて直した。
- STARTで「ゲームを おわる？」の確認(Aで終了、BかSTARTでもどる)。
- 章タイトルに第4章を追加(CHAPTER_TITLE_COUNT=5)。tools/audit_data.c は像の庭の到達判定に対応。
- テスト: sh tools/run_tests.sh 全通過(本体852チェック・禁止語・データ監査・通しプレイ20通り)。
今回できなかったこと:
- 第4〜8章の game.c への組み込み(部品 ch4〜ch8 は単体テスト済みのまま)。
- 第9章の下準備、scenario への第3章手順の追加、実機ビルド確認。
次回の予定:
- [ ] 第4章を game.c へ(ch4data/ch4script を data_story.c / data_world.c へ。第3章と同じ作り方)
- [ ] 第5〜8章を順につなぐ
- [ ] scenario に第3章の手順を追加
- [ ] 第9章の下準備(ch9data / ch9script)
