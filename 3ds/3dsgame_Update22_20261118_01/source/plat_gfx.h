/* plat_gfx.h - Update14: 絵(スプライト)と音(BGM)の薄い層。platform.h は変えない。
 * 3DS: platform_3ds_gfx.c / PCテスト: platform_host_gfx.c(何もしない) */
#ifndef PLAT_GFX_H
#define PLAT_GFX_H
#include <stdbool.h>
enum { SHEET_TILES = 0, SHEET_CHARS = 1, SHEET_BUILDINGS = 2, SHEET_COUNT = 3 };
enum { BGM_NONE = -1, BGM_FIELD = 0, BGM_TOWN = 1, BGM_EVENT = 2, BGM_COUNT = 3 };

bool plat_gfx_init(void);   /* 絵と音を読む。失敗してもfalseを返すだけ(ゲームは四角の絵で続く) */
void plat_gfx_exit(void);
bool plat_gfx_ready(void);  /* 絵が使えるか */
/* シート内の(sx,sy)から(w,h)を、画面の(x,y)へ。scaleは拡大(1.0=等倍) */
void plat_sprite(int sheet, int sx, int sy, int w, int h, int x, int y, float scale);
void plat_bgm_play(int bgm);  /* 同じ曲なら何もしない。BGM_NONEで停止 */
void plat_bgm_stop(void);
int plat_bgm_current(void);
#endif
