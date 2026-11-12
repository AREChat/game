# Makefile 調整メモ(Update14) — game.c を変えずに絵とBGMを出す方法
game.c が描く「色の四角」を、3DS側の platform 層で絵に差し替える(gfxhook.c が判定、platform_3ds_wrap.c がリンカの --wrap で割り込む)。
## Makefile に足すこと
1. LDFLAGS に追加:  -Wl,--wrap=plat_init -Wl,--wrap=plat_exit -Wl,--wrap=plat_rect -Wl,--wrap=plat_screen
2. 3DSビルドでは platform_host.c と platform_host_gfx.c を除外(platform_3ds_gfx.c / platform_3ds_wrap.c / gfxhook.c / sprites.c は含める)。
3. GFXFILES に gfx/tiles.t3s gfx/chars.t3s gfx/buildings.t3s (各 t3s は「--atlas -f rgba -z auto」+ png名)。出力 .t3x は romfs/gfx/ へ。
4. romfs/ に bgm_field.wav / bgm_town.wav / bgm_event.wav(make_assets.py が作る)。
5. 画像は 16x16。tiles.png/chars.png は 8列、置き場は assets/gfx から gfx/ へコピー。
## 見分けルール(gfxhook.c)
- 上画面で 16x16(16の倍数の位置)の四角 = 地面タイル。色で種類を決める。
- 12x14 の四角: 色(250,60,60)=主人公、それ以外=ほかの人(色から人の絵を選ぶ)。6x5 の肌色=主人公の顔(描かない)。
- 上画面の塗りつぶし色でBGM: 黒=まち、(40,30,70)/(30,20,60)=イベント、(10,14,50)=タイトル。
## 注意
実機ビルドは未確認(スタブヘッダでの文法確認とPCテストのみ)。game.c のNPC名と人の絵は未連動(色から選ぶ)。次回、game.c を直接直して gd_* を呼ぶ形にすると正確になる。
