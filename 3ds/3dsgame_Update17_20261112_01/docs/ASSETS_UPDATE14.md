# 画像・BGM・人と建物の見分け(Update14。ASSETS.md の新しい版)

すべてオリジナル。`tools/make_assets.py`(Python3 + Pillow + numpy。ogg/mp3 変換に ffmpeg)を実行すると assets/ を丸ごと作り直せます。`python3 -I tools/make_assets.py assets`。画像・BGMのファイルそのもの(PNG/ogg)は、Drive へ直接アップロードできないため、チャットへ zip で渡しました。Drive にはスクリプトだけを置いています。

## 人と建物の見分け方(ユーザー要望)
- 人: 16x16 の「まるい顔」の絵文字ふう(chars.png)。主人公=星のバンダナ、母=エプロン、保健室の先生=赤十字の白い帽子、セラ=ピンクのリボン、ガイ=緑のぼうし、ミオ=おだんご+めがね、長老=白いひげ、ユノ=オレンジのマフラー、駅長=紺の制帽、先生=角帽 など、持ち物で誰か分かる。黒い縁どり。
- 建物: 48x48 の「四角い壁+三角の屋根+とびら」(buildings.png)。看板マークで種類が分かる(家=とびら、学び舎=本、お店=コイン、宿屋=ベッド、駅=列車、保健室=赤十字、図書室=本・茶色、星影の塔=星)。
- 地面: 16x16 のタイル(tiles.png)。ゆか/しばふ/みち/かべ/がれき/出口/調査スポット/水/花/駅のゆか/線路。
- 人と建物と地面の対応は `source/sprites.h/.c`(game.c非依存)。`tests/test_sprites.c`(823チェック)が、マップ記号が「地面か人のどちらか一方」になること、番号が画像の範囲内であること、名前が重ならないことを確かめる。
- 見本は `legend.png`(チャットで配布)。

## ファイル
- `assets/gfx/tiles.png` 128x128(8列) / `chars.png` 128x128(8列。0〜7=主人公 下・上・左・右 × 歩き2コマ、16〜=ほかの人) / `buildings.png` 192x96(4列) / `ui.png` 64x64(枠・カーソル・星・人マーク・建物マーク)
- `assets/bgm/bgm_field|town|event` の `.ogg` `.mp3` `.wav`(22050Hz・16bit・モノラル。ループ前提)

## 3DS への組み込み(これから)
1. PNG を tex3ds でスプライトシート(.t3x)にし、citro2d で表示。補間はオフ。
2. platform_3ds.c の四角塗りを、`spr_tile_for_char` / `spr_person_for_marker` / `spr_hero_frame` / `spr_*_x,y` で選んだ画像の描画に置き換える。game.c は変えず platform 層だけで差し替え可能。
3. BGM: ogg を libvorbisidec でデコードして ndsp に流す(章ごとに field/town/event を切り替え)。まず WAV の直読みが確実。
4. 実機確認はユーザー側(未検証)。
