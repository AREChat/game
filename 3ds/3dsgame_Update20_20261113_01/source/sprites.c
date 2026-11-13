#include "sprites.h"

static int person_ok(int id) { return (id >= 0 && id < 12) || (id >= PS_MOTHER && id < PS_END); }

int spr_tile_for_char(char c) {
 switch (c) {
  case '.': return TL_FLOOR;
  case ',': return TL_GRASS;
  case '-': return TL_PATH;
  case '#': return TL_WALL;
  case 'R': return TL_RUBBLE;
  case 'D': return TL_EXIT;
  case '1': case '2': case '3': case '4': return TL_SPOT;
  case '~': return TL_WATER;
  case '*': return TL_FLOWER;
  case 'S': return TL_STATION;
  case '=': return TL_RAIL;
  default: return -1;
 }
}
int spr_person_for_marker(int chapter, char c) {
 switch (chapter) {
  case 4: return c == 'M' ? PS_MOTHER : -1;
  case 6: return c == 'M' ? PS_MIO : -1;
  case 7: return c == 'Y' ? PS_YUNO : -1;
  default: return -1;
 }
}
int spr_hero_frame(int dir, int step) {
 if (dir < 0 || dir > 3 || step < 0 || step > 2) return 0;
 return dir * 3 + step;
}
int spr_kind_person(int id) { return person_ok(id) ? SPK_PERSON : SPK_NONE; }
int spr_kind_building(int id) { return (id >= 0 && id < BD_COUNT) ? SPK_BUILDING : SPK_NONE; }
int spr_kind_tile(int id) { return (id >= 0 && id < TL_COUNT) ? SPK_TILE : SPK_NONE; }
int spr_person_x(int id) { return person_ok(id) ? (id % 8) * SPR_PERSON_PX : -1; }
int spr_person_y(int id) { return person_ok(id) ? (id / 8) * SPR_PERSON_PX : -1; }
int spr_building_x(int id) { return (id >= 0 && id < BD_COUNT) ? (id % 4) * SPR_BUILDING_PX : -1; }
int spr_building_y(int id) { return (id >= 0 && id < BD_COUNT) ? (id / 4) * SPR_BUILDING_PX : -1; }
int spr_tile_x(int id) { return (id >= 0 && id < TL_COUNT) ? (id % 8) * SPR_TILE_PX : -1; }
int spr_tile_y(int id) { return (id >= 0 && id < TL_COUNT) ? (id / 8) * SPR_TILE_PX : -1; }

static const char *PNAME[PS_END - PS_MOTHER] = {
 "母", "保健室の先生", "級友", "屋台のおじさん", "セラ", "ガイ", "ミオ", "長老",
 "ユノ", "駅長", "先生", "ライ", "ロク", "村の人", "山賊", "店の人"
};
static const char *BNAME[BD_COUNT] = { "家", "学び舎", "お店", "宿屋", "駅", "保健室", "図書室", "星影の塔" };

const char *spr_person_name(int id) {
 if (id >= 0 && id < 8) return "主人公";
 if (id >= PS_MOTHER && id < PS_END) return PNAME[id - PS_MOTHER];
 return "";
}
const char *spr_building_name(int id) { return (id >= 0 && id < BD_COUNT) ? BNAME[id] : ""; }
int spr_building_for_area(int area) {
 switch (area) {
  case 0: return BD_HOUSE;   /* ひなた村 */
  case 4: return BD_SCHOOL;  /* ミルフィ */
  case 5: return BD_SCHOOL;  /* 学び舎 */
  default: return -1;
 }
}
