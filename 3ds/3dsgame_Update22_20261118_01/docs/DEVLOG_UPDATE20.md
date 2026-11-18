# Update20 (2026-11-13)
- ChatGPTで作った新しいドット絵を切り抜いて、gfx/ に入れた(tiles.png / chars.png / buildings.png と .t3s)。元の絵(chars_32など)は ../新素材/ にある。
- 大きさ: 地面32、人32、建物96。画面には SPR_DRAW_SCALE(0.5)倍で描くので、画面の配置は変わらない。
- 主人公: dir*3+step の12コマ(dir 0=下 1=上 2=左 3=右、step 0=立ち 1,2=歩き)。chars.png の0〜11番。人は16番〜(PS_*)のまま。
- game.c: 主人公の向き(g_face)を持つ(セーブには入れない)。game_hero_dir()/game_hero_step() で絵を選ぶ。platform_3ds_wrap.c が主人公を描くときに使う。
- tests/test_sprites.c: 新しい大きさ、12コマ、0.5倍の確認に更新。
- spr_person_name を主人公12コマ(0〜11)に対応(テストで見つけて直した)。
- 切り抜きの直し: 地面は枠線を外へ除いて(つなぎ目が目立たない)、建物は屋根(煙突・塔の先)が切れないようにした。
- テスト: gcc(WinLibs 16.2)で sh tools/run_tests.sh 全通過(test_sprites 845、禁止語OK、データ監査OK、通しプレイ20通りOK)。
- 未確認: 3DS実機・エミュレータでの見え方(PCでの合成プレビューは ../新素材/preview_3ds_sim.png)。
