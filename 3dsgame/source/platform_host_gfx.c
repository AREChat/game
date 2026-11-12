#include "plat_gfx.h"
static int g_cur = BGM_NONE;
bool plat_gfx_init(void) { return false; }
void plat_gfx_exit(void) {}
bool plat_gfx_ready(void) { return false; }
void plat_sprite(int sheet, int sx, int sy, int w, int h, int x, int y, float scale)
{ (void)sheet; (void)sx; (void)sy; (void)w; (void)h; (void)x; (void)y; (void)scale; }
void plat_bgm_play(int bgm) { if (bgm >= BGM_NONE && bgm < BGM_COUNT) g_cur = bgm; }
void plat_bgm_stop(void) { g_cur = BGM_NONE; }
int plat_bgm_current(void) { return g_cur; }
