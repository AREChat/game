#include <stdio.h>
#include "../source/gfxhook.h"
#include "../source/sprites.h"
#include "../source/plat_gfx.h"
static int fails = 0, checks = 0;
#define CK(c) do { checks++; if (!(c)) { fails++; printf("NG line %d\n", __LINE__); } } while (0)
int main(void)
{
    int id = -1, k, x, y;
    CK(gh_classify(0, 32, 48, 16, 16, 20, 90, 40, &id) == GH_TILE && id == TL_WALL);
    CK(gh_classify(0, 0, 0, 16, 16, 40, 90, 200, &id) == GH_TILE && id == TL_WATER);
    CK(gh_classify(0, 0, 0, 16, 16, 1, 2, 3, &id) == GH_TILE && id == TL_GRASS);
    CK(gh_classify(1, 0, 0, 16, 16, 20, 90, 40, &id) == GH_PASS);
    CK(gh_classify(0, 5, 0, 16, 16, 20, 90, 40, &id) == GH_PASS);
    CK(gh_classify(0, 34, 17, 12, 14, 250, 60, 60, &id) == GH_HERO && id == PS_HERO);
    k = gh_classify(0, 34, 17, 12, 14, 10, 200, 30, &id); CK(k == GH_PERSON && id >= PS_MOTHER && id < PS_END);
    CK(gh_classify(0, 37, 19, 6, 5, 255, 220, 190, &id) == GH_SKIP);
    CK(gh_classify(0, 80, 100, 44, 44, 90, 180, 220, &id) == GH_PASS);
    CK(gh_classify(0, 0, 0, 2, 2, 255, 255, 200, &id) == GH_PASS);
    CK(gh_bgm_for_clear(0, 0, 0, 0) == BGM_TOWN);
    CK(gh_bgm_for_clear(0, 40, 30, 70) == BGM_EVENT);
    CK(gh_bgm_for_clear(0, 10, 14, 50) == BGM_FIELD);
    CK(gh_bgm_for_clear(1, 0, 0, 0) == GH_BGM_KEEP);
    CK(gh_bgm_for_clear(0, 7, 7, 7) == GH_BGM_KEEP);
    for (x = 0; x < 256; x += 5) for (y = 0; y < 256; y += 7) {
        k = gh_classify(0, 12, 14, 12, 14, (unsigned char)x, (unsigned char)y, 9, &id);
        CK(k == GH_HERO || (k == GH_PERSON && id >= PS_MOTHER && id < PS_END));
    }
    printf("gfxhook: %d checks, %d failed\n", checks, fails);
    return fails != 0;
}
