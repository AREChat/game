# 画像とBGMの使い方(Update11)

すべてオリジナル。作成スクリプト `make_assets.py`(Python3 + Pillow。チャットで配布。Driveには未保存)を実行すると、assets/ の中身をぜんぶ作り直せます。外部の素材・他社作品の音や絵は使っていません。

## 画像(PNG)
3DS(devkitPro)では、PNGを「tex3ds」でスプライトシート(.t3x)に変えて、citro2dで表示するのが一般的です。
- `assets/gfx/tiles.png` 128x128・16x16のタイル8列: ゆか/しばふ/みち/かべ/がれき/出口/調査スポット/水/花(ch4・ch5のタイル凡例に対応: `.`ゆか `,`しばふ `#`かべ `R`がれき `D`出口 `1`〜`4`スポット)
- `assets/gfx/chars.png` 128x128・16x16: 上2段=主人公(下/上/左/右、歩き2コマ)、3段目=母/保健室の先生/級友/屋台のおじさん/セラ/ガイ/ミオ/長老。主人公は星のバンダナ、先生は帽子など、見た目で区別できます。
- `assets/gfx/buildings.png` 128x64: 家(48x48)・学び舎(48x48)・木(16x24)・屋台(32x16)・保健室の看板(16x16)
- `assets/gfx/ui.png` 64x64: メッセージ枠・カーソル・星

手順の例:
1. `assets/gfx/` に tiles.png などを置き、`assets/gfx/sprites.t3s` に画像名を1行ずつ書く。
2. Makefile の GFXFILES に `.t3s` を足すと、ビルド時に `.t3x` ができる。
3. C言語: `C2D_SpriteSheetLoad("romfs:/gfx/tiles.t3x")` → `C2D_SpriteSheetGetImage(sheet, 番号)` → `C2D_DrawImageAt(...)`。拡大は2倍(32px)なら 25x15マス=800x480に近く、3DS上画面(400x240)なら 1.0倍の16pxで 25x15=400x240ぴったりです。補間はオフ(ドットがにじまない)に。
4. ブロック描画(いまの platform_3ds.c の四角塗り)を、タイル番号→画像に置き換える。game.c は変えず platform 層だけで差し替え可能。

## BGM
3DSの自作ソフトは **OGG Vorbis**(軽くて音も良い)が定番です。MP3も `libmpg123` で鳴らせますが、設定が少し面倒です。ここには3形式を入れてあります。
- `assets/bgm/bgm_field.ogg` 野外(明るい行進曲)/ `bgm_town.ogg` 学び舎・町(おだやか)/ `bgm_event.ogg` 事件・ひらめき(少し緊張)
- `.mp3` と `.wav` も同じ曲。ループ前提の長さ(約15〜21秒)。
- 再生: `ndspInit()` → ogg を `libvorbisidec`(portlibs の `3ds-libvorbisidec`)でデコードしながら ndsp のウェーブバッファに流す。短い曲なので、起動時に全部デコードしてメモリに置き、ループ再生しても構いません(1曲あたり約0.6〜0.9MB、22050Hz・16bit・モノラル)。
- 音がうるさい時のために、設定でBGMオン/オフを付けるのがおすすめです。
- ファイルは romfs に入れる(`romfs/bgm/`)。ビルドを簡単にするなら、まず WAV を直読みする方法(自前の小さな関数でOK)が確実です。

## 次にやること
- platform_3ds.c の描画を画像に差し替え(実機での確認はユーザー側)。
- 章ごとにBGMを切り替える(第1章=field、第2〜3章=town、ひらめきタイム=event)。
