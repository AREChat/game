#ifndef SPRITES_H
#define SPRITES_H
/* Update14: 画像(assets/gfxのPNG)と、マップ記号・登場人物・建物の対応表。game.c非依存の純粋ロジック。
 * 「人」はまるい顔の絵(chars.png 16x16)、「建物」は屋根つきの四角い絵(buildings.png 48x48)、地面は tiles.png(16x16)。
 * 見た目の種類(SPK_*)で、人・建物・地面をはっきり区別する。 */
#define SPK_NONE 0
#define SPK_TILE 1
#define SPK_PERSON 2
#define SPK_BUILDING 3

/* tiles.png の番号(8列) */
enum { TL_FLOOR, TL_GRASS, TL_PATH, TL_WALL, TL_RUBBLE, TL_EXIT, TL_SPOT, TL_WATER, TL_FLOWER, TL_STATION, TL_RAIL, TL_COUNT };
/* chars.png の番号(8列)。0..7=主人公(下/上/左/右 x 歩き2コマ)、16〜=ほかの人 */
enum { PS_HERO = 0, PS_MOTHER = 16, PS_NURSE, PS_CLASSMATE, PS_VENDOR, PS_SERA, PS_GAI, PS_MIO, PS_ELDER,
       PS_YUNO, PS_STATION, PS_TEACHER, PS_KID_RAI, PS_KID_ROKU, PS_VILLAGER, PS_BOSS, PS_SHOPKEEPER, PS_END };
/* buildings.png の番号(4列) */
enum { BD_HOUSE, BD_SCHOOL, BD_SHOP, BD_INN, BD_STATION, BD_CLINIC, BD_LIBRARY, BD_TOWER, BD_COUNT };
/* 主人公の向き */
enum { DIR_DOWN, DIR_UP, DIR_LEFT, DIR_RIGHT };

#define SPR_TILE_PX 16
#define SPR_PERSON_PX 16
#define SPR_BUILDING_PX 48

int spr_tile_for_char(char c);                 /* マップ記号 -> タイル番号。人の記号・不明は -1 */
int spr_person_for_marker(int chapter, char c);/* 章ごとの人の記号('M''Y'など) -> PS_*。人でなければ -1 */
int spr_hero_frame(int dir, int step);         /* 主人公の絵の番号。範囲外は 0 */
int spr_kind_person(int id);                   /* PS_* が正しければ SPK_PERSON、違えば SPK_NONE */
int spr_kind_building(int id);                 /* BD_* が正しければ SPK_BUILDING */
int spr_kind_tile(int id);
int spr_person_x(int id);                      /* chars.png 内のxピクセル。不正は -1 */
int spr_person_y(int id);
int spr_building_x(int id);                    /* buildings.png 内 */
int spr_building_y(int id);
int spr_tile_x(int id);                        /* tiles.png 内 */
int spr_tile_y(int id);
const char *spr_person_name(int id);           /* 人の呼び名(日本語)。不正は "" */
const char *spr_building_name(int id);         /* 建物の呼び名。不正は "" */
int spr_building_for_area(int area);           /* ids.h の AREA_* (0..5) -> 外から見える建物。なければ -1 */
#endif
