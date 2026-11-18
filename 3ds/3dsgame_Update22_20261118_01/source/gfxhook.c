#include "gfxhook.h"
#include "sprites.h"
#include "plat_gfx.h"

static int tile_by_color(unsigned char r, unsigned char g, unsigned char b)
{
    if (r == 20 && g == 90 && b == 40) return TL_WALL;      /* '#' */
    if (r == 150 && g == 90 && b == 60) return TL_WALL;     /* 'H' 家のかべ */
    if (r == 200 && g == 80 && b == 120) return TL_RUBBLE;  /* 'R' */
    if (r == 40 && g == 90 && b == 200) return TL_WATER;    /* 'W' */
    if (r == 230 && g == 190 && b == 40) return TL_SPOT;    /* 'T' たからばこ */
    if (r == 205 && g == 185 && b == 140) return TL_PATH;   /* '.' */
    if (r == 120 && g == 90 && b == 60) return TL_PATH;     /* '=' */
    if (r == 240 && g == 140 && b == 190) return TL_FLOWER; /* 'F' */
    if (r == 40 && g == 130 && b == 50) return TL_GRASS;    /* '^' */
    return TL_GRASS;
}

int gh_classify(int screen, int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b, int *id)
{
    if (screen != 0) return GH_PASS;
    if (w == 16 && h == 16 && x >= 0 && y >= 0 && x % 16 == 0 && y % 16 == 0) {
        if (id) *id = tile_by_color(r, g, b);
        return GH_TILE;
    }
    if (w == 12 && h == 14) {
        if (r == 250 && g == 60 && b == 60) { if (id) *id = PS_HERO; return GH_HERO; }
        if (id) *id = PS_MOTHER + ((r + g * 3 + b * 5) % (PS_END - PS_MOTHER));
        return GH_PERSON;
    }
    if (w == 6 && h == 5 && r == 255 && g == 220 && b == 190) return GH_SKIP; /* 主人公の顔 */
    return GH_PASS;
}

int gh_bgm_for_clear(int screen, unsigned char r, unsigned char g, unsigned char b)
{
    if (screen != 0) return GH_BGM_KEEP;
    if (r == 0 && g == 0 && b == 0) return BGM_TOWN;           /* マップ */
    if (r == 40 && g == 30 && b == 70) return BGM_EVENT;       /* 戦闘 */
    if (r == 30 && g == 20 && b == 60) return BGM_EVENT;       /* ひらめき */
    if (r == 10 && g == 14 && b == 50) return BGM_FIELD;       /* タイトル */
    return GH_BGM_KEEP;
}
