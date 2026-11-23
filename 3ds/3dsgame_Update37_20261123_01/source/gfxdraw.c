#include "gfxdraw.h"
#include "sprites.h"
#include "plat_gfx.h"
#include "platform.h"

static void fallback(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b)
{ plat_rect(x, y, w, h, r, g, b); }

void gd_tile(char c, int x, int y)
{
    int t = spr_tile_for_char(c);
    static const unsigned char col[TL_COUNT][3] = {
        {200,190,160},{90,170,90},{210,190,130},{90,90,100},{130,110,90},{240,220,80},
        {240,160,60},{70,120,200},{240,150,190},{190,190,200},{110,110,120} };
    if (t < 0) t = TL_FLOOR;
    if (plat_gfx_ready()) plat_sprite(SHEET_TILES, spr_tile_x(t), spr_tile_y(t), SPR_TILE_PX, SPR_TILE_PX, x, y, SPR_DRAW_SCALE);
    else fallback(x, y, SPR_TILE_PX, SPR_TILE_PX, col[t][0], col[t][1], col[t][2]);
}

int gd_is_person(int chapter, char c) { return spr_person_for_marker(chapter, c) >= 0; }

void gd_person(int chapter, char c, int x, int y)
{
    int p = spr_person_for_marker(chapter, c);
    if (p < 0) return;
    if (plat_gfx_ready()) plat_sprite(SHEET_CHARS, spr_person_x(p), spr_person_y(p), SPR_PERSON_PX, SPR_PERSON_PX, x, y, SPR_DRAW_SCALE);
    else fallback(x + 3, y + 1, 10, 14, 250, 120, 120);
}

void gd_hero(int dir, int step, int x, int y)
{
    int f = spr_hero_frame(dir, step);
    if (plat_gfx_ready()) plat_sprite(SHEET_CHARS, spr_person_x(f), spr_person_y(f), SPR_PERSON_PX, SPR_PERSON_PX, x, y, SPR_DRAW_SCALE);
    else fallback(x + 3, y + 1, 10, 14, 80, 140, 250);
}

void gd_building(int id, int x, int y)
{
    if (spr_kind_building(id) != SPK_BUILDING) return;
    if (plat_gfx_ready()) plat_sprite(SHEET_BUILDINGS, spr_building_x(id), spr_building_y(id), SPR_BUILDING_PX, SPR_BUILDING_PX, x, y, SPR_DRAW_SCALE);
    else { fallback(x, y + 12, SPR_BUILDING_PX, SPR_BUILDING_PX - 12, 200, 170, 130); fallback(x, y, SPR_BUILDING_PX, 14, 180, 70, 60); }
}

int gd_bgm_for_area(int area, int in_event)
{
    if (in_event) return BGM_EVENT;
    switch (area) { case 0: case 2: case 3: case 4: return BGM_TOWN; default: return BGM_FIELD; }
}
