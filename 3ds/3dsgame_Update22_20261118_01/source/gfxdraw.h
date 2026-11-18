#ifndef GFXDRAW_H
#define GFXDRAW_H
/* Update14: マップ記号・人・建物を、絵があれば絵で、なければ色の四角で描く。game.cから呼ぶだけ。 */
void gd_tile(char c, int x, int y);                 /* 16x16の地面。人の記号は地面(床)を描く */
void gd_person(int chapter, char c, int x, int y);  /* 人の記号なら人の絵。人でなければ何もしない(0を返す版はgd_is_person) */
int gd_is_person(int chapter, char c);
void gd_hero(int dir, int step, int x, int y);
void gd_building(int id, int x, int y);             /* 48x48 */
int gd_bgm_for_area(int area, int in_event);        /* AREA_*(0..5)と場面 -> BGM_* */
#endif
