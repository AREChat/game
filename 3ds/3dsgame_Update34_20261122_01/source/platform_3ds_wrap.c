#include "plat_gfx.h"
/* ---- game.c を変えずに絵へ差し替える(リンカの --wrap を使う。Makefile参照) ---- */
#include "gfxhook.h"
#include "sprites.h"
#include "platform.h"
#include "game.h"
extern void __real_plat_init(void);
extern void __real_plat_exit(void);
extern void __real_plat_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b);
extern void __real_plat_screen(int screen, unsigned char r, unsigned char g, unsigned char b);
static int g_screen = 0;

void __wrap_plat_init(void) { __real_plat_init(); plat_gfx_init(); }
void __wrap_plat_exit(void) { plat_gfx_exit(); __real_plat_exit(); }

void __wrap_plat_screen(int screen, unsigned char r, unsigned char g, unsigned char b)
{
    int bgm = gh_bgm_for_clear(screen, r, g, b);
    g_screen = screen;
    if (bgm != GH_BGM_KEEP) plat_bgm_play(bgm);
    __real_plat_screen(screen, r, g, b);
}

void __wrap_plat_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b)
{
    int id = 0, k;
    if (!plat_gfx_ready()) { __real_plat_rect(x, y, w, h, r, g, b); return; }
    k = gh_classify(g_screen, x, y, w, h, r, g, b, &id);
    if (k == GH_HERO) id = spr_hero_frame(game_hero_dir(), game_hero_step());
    if (k == GH_TILE) { plat_sprite(SHEET_TILES, spr_tile_x(id), spr_tile_y(id), SPR_TILE_PX, SPR_TILE_PX, x, y, SPR_DRAW_SCALE); return; }
    if (k == GH_PERSON || k == GH_HERO) { plat_sprite(SHEET_CHARS, spr_person_x(id), spr_person_y(id), SPR_PERSON_PX, SPR_PERSON_PX, x - 2, y - 1, SPR_DRAW_SCALE); return; }
    if (k == GH_SKIP) return;
    __real_plat_rect(x, y, w, h, r, g, b);
}

/* Update23: 戦闘の絵(game.c から呼ばれる)。絵が読めていなければ false を返し、game.c が四角でえがく */
bool plat_draw_enemy(int enemy, int x, int y, int size)
{
    int sx = spr_enemy_x(enemy), sy = spr_enemy_y(enemy);
    if (sx < 0 || !plat_sheet_ok(SHEET_ENEMY)) return false;
    plat_sprite(SHEET_ENEMY, sx, sy, SPR_ENEMY_PX, SPR_ENEMY_PX, x, y, (float)size / (float)SPR_ENEMY_PX);
    return true;
}
bool plat_draw_battle_bg(int area)
{
    int sx = spr_bg_x(area), sy = spr_bg_y(area);
    if (sx < 0 || !plat_sheet_ok(SHEET_BG)) return false;
    plat_sprite(SHEET_BG, sx, sy, SPR_BG_W, SPR_BG_H, 0, 0, 1.0f);
    return true;
}
