
## 自動テストの追加 (Update16 続き)
- tools/playtest.c: 通しプレイの自動テスト。シナリオ(tools/scenario_ch1_2.txt)を読み、はじめ→第2章クリアまで操作して ASSERT で結果を確認。戦闘は自動、れべる上げ(GRIND)・回復(HEAL)つき。
- tools/audit_data.c: 台本の文字はみ出し・NPCの到達・ワープ先などのデータ監査。
- tools/run_tests.sh の最後で、データ監査 + 通しプレイを乱数の種20通りで実行。1つでも失敗すると止まる。
- 新しい章をゲーム本体につなげたら、その章の手順を scenario に足すこと(足さないと通しテストの対象外)。
