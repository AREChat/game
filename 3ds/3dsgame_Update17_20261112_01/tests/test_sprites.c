#include <stdio.h>
#include <string.h>
#include "../source/sprites.h"
#include "../source/ch7data.h"
static long N = 0, F = 0;
#define CHECK(c) do { N++; if (!(c)) { F++; if (F < 20) printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
int main(void) {
 int i, j, c, seen[64] = {0};
 /* 地面・人・建物の種類が混ざらない */
 for (i = 0; i < TL_COUNT; i++) { CHECK(spr_kind_tile(i) == SPK_TILE); CHECK(spr_tile_x(i) >= 0 && spr_tile_x(i) + SPR_TILE_PX <= 128); CHECK(spr_tile_y(i) >= 0 && spr_tile_y(i) + SPR_TILE_PX <= 128); }
 CHECK(spr_kind_tile(-1) == SPK_NONE && spr_kind_tile(TL_COUNT) == SPK_NONE);
 for (i = 0; i < 64; i++) {
  int ok = (i < 8) || (i >= PS_MOTHER && i < PS_END);
  CHECK(spr_kind_person(i) == (ok ? SPK_PERSON : SPK_NONE));
  if (ok) {
   CHECK(spr_person_x(i) >= 0 && spr_person_x(i) + SPR_PERSON_PX <= 128 && spr_person_y(i) >= 0 && spr_person_y(i) + SPR_PERSON_PX <= 128);
   CHECK(strlen(spr_person_name(i)) > 0);
   seen[i]++;
  } else { CHECK(spr_person_x(i) == -1 && strlen(spr_person_name(i)) == 0); }
 }
 for (i = 0; i < 64; i++) CHECK(seen[i] <= 1);
 for (i = 0; i < BD_COUNT; i++) {
  CHECK(spr_kind_building(i) == SPK_BUILDING);
  CHECK(spr_building_x(i) >= 0 && spr_building_x(i) + SPR_BUILDING_PX <= 192 && spr_building_y(i) >= 0 && spr_building_y(i) + SPR_BUILDING_PX <= 96);
  CHECK(strlen(spr_building_name(i)) > 0);
  for (j = i + 1; j < BD_COUNT; j++) CHECK(strcmp(spr_building_name(i), spr_building_name(j)) != 0);
 }
 CHECK(spr_kind_building(-1) == SPK_NONE && spr_kind_building(BD_COUNT) == SPK_NONE);
 /* 人の名前は重ならない */
 for (i = PS_MOTHER; i < PS_END; i++) for (j = i + 1; j < PS_END; j++) CHECK(strcmp(spr_person_name(i), spr_person_name(j)) != 0);
 /* 主人公は向き4 x 歩き2 = 8コマ、すべて別 */
 { int f[8], k = 0; for (i = 0; i < 4; i++) for (j = 0; j < 2; j++) { f[k] = spr_hero_frame(i, j); CHECK(f[k] == k); k++; } }
 CHECK(spr_hero_frame(9, 0) == 0 && spr_hero_frame(0, 5) == 0);
 /* マップ記号: 地面か人のどちらか一方だけ */
 for (c = 0; c < 128; c++) {
  int t = spr_tile_for_char((char)c);
  int p4 = spr_person_for_marker(4, (char)c), p6 = spr_person_for_marker(6, (char)c), p7 = spr_person_for_marker(7, (char)c);
  if (p4 >= 0 || p6 >= 0 || p7 >= 0) CHECK(t == -1);
  if (p4 >= 0) CHECK(spr_kind_person(p4) == SPK_PERSON);
  if (p6 >= 0) CHECK(spr_kind_person(p6) == SPK_PERSON);
  if (p7 >= 0) CHECK(spr_kind_person(p7) == SPK_PERSON);
 }
 CHECK(spr_person_for_marker(4, 'M') == PS_MOTHER && spr_person_for_marker(6, 'M') == PS_MIO && spr_person_for_marker(7, 'Y') == PS_YUNO);
 CHECK(spr_person_for_marker(1, 'M') == -1);
 /* 第7章のマップの全マスに絵がある(地面または人) */
 for (i = 0; i < CH7_H; i++) for (j = 0; j < CH7_W; j++) {
  char t = ch7_tile(j, i);
  CHECK(spr_tile_for_char(t) >= 0 || spr_person_for_marker(7, t) >= 0);
 }
 for (i = -1; i <= 7; i++) { int b = spr_building_for_area(i); CHECK(b == -1 || spr_kind_building(b) == SPK_BUILDING); }
 printf("test_sprites: %ld checks, %ld failed\n", N, F);
 return F ? 1 : 0;
}
