# DEVLOG Update14 (2026-11-11)
追加(すべて game.c に依存しない部品。PCテスト合格: gfxdraw 26 / ch7 853276 / sprites 823、失敗0):
- source/plat_gfx.h : 絵(plat_sprite)とBGM(plat_bgm_play/stop)の窓口。platform.h は変更なし。
- source/platform_3ds_gfx.c : 3DS用。tiles/chars/buildings の .t3x を読み、WAVをndspでループ再生。(スタブヘッダで文法確認のみ。実機ビルドは未確認)
- source/platform_host_gfx.c : PCテスト用(何もしない)。
- source/gfxdraw.c/.h : マップ記号・人・主人公・建物を、絵があれば絵、なければ色の四角で描く。BGM選び gd_bgm_for_area。
- tests/test_gfxdraw.c
- gfx/*.t3s は assets に置く内容(下記)。tiles.t3s: 「--atlas -f rgba -z auto」の次の行に tiles.png。chars/buildings も同様。
未完了(次回):
- Makefile: platform_host_gfx.c を除外、ndsp(-lctru に含む)確認、romfs に gfx/*.t3x と bgm_*.wav を置く。
- game.c から gd_* と plat_bgm_play を呼ぶ(game.c の正確な取得が必要)。
- PNG/WAVはDriveに置けないため make_assets.py で再生成。
- 定期実行は6時間ごとが目安。_RUNNING.txt の古い判定は3時間に短縮を推奨。
