# Update23 (2026-11-18)
初心者でも迷わない・止まらない・あきない、を目的にした改修。詳細は _INFO.txt。
- help.c/help.h(新規・game.c非依存・test_help.cでテスト): ヘルプの文章と「いまの目的」。
- game.c: SELECTヘルプ、にげ道(X→A)、毎フレームの安全確認(game_sanity)、オートセーブ(場所を変えたとき・戦闘のあと・スクリプト中は保存しない)、はじめから上書き確認、十字キー おしっぱなし/Bはやあるき、Rはやおくり、エンカウント調整(安全8歩)、HP少ないお知らせ、右上ヒント。
- platform.h: plat_draw_enemy / plat_draw_battle_bg(絵があれば描いて true。PCテストは false)。platform_3ds_wrap.c で実装。
- gfx: enemies.png(96x96 4x2)、battlebg.png(400x240 2x4)。t3s は --atlas なし(回転させない)。
- platform_3ds_gfx.c: BGMを起動時に先読み(場面の切りかえで止まらない)。ログ gfx_log.txt に BGM先読みの結果も書く。戦闘の絵(ENEMY/BG)は無くても動く。
- tests: test_help.c 新規、test_main.c に test_help_flow、test_sprites.c に戦闘の絵の配置確認。
