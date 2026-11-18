#include <stdio.h>
#include "../source/gfxdraw.h"
#include "../source/plat_gfx.h"
#include "../source/sprites.h"
static int fails = 0, checks = 0;
#define CK(c) do { checks++; if (!(c)) { fails++; printf("NG line %d\n", __LINE__); } } while (0)
int main(void)
{
    int a, ch, i;
    CK(plat_gfx_init() == 0); CK(!plat_gfx_ready());
    gd_tile('#', 0, 0); gd_tile('Z', 0, 0); gd_hero(DIR_LEFT, 1, 5, 5); gd_hero(9, 9, 0, 0);
    gd_building(BD_SCHOOL, 0, 0); gd_building(99, 0, 0); gd_person(7, 'Y', 1, 1); gd_person(7, '#', 1, 1);
    CK(gd_is_person(7, 'Y') == 1); CK(gd_is_person(7, '#') == 0); CK(gd_is_person(4, 'M') == 1);
    for (a = -1; a < 8; a++) { CK(gd_bgm_for_area(a, 1) == BGM_EVENT); i = gd_bgm_for_area(a, 0); CK(i == BGM_TOWN || i == BGM_FIELD); }
    plat_bgm_play(BGM_TOWN); CK(plat_bgm_current() == BGM_TOWN);
    plat_bgm_play(77); CK(plat_bgm_current() == BGM_TOWN);
    plat_bgm_stop(); CK(plat_bgm_current() == BGM_NONE);
    for (ch = 0; ch < 10; ch++) for (i = 32; i < 127; i++) { gd_tile((char)i, 0, 0); gd_person(ch, (char)i, 0, 0); }
    printf("gfxdraw: %d checks, %d failed\n", checks, fails);
    return fails != 0;
}
