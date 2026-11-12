/* data_world.c - 敵・アイテム・マップ(第1〜2章分)。マップは25x15タイル(1タイル16px)。
 * 凡例: # 木 / H 家 / R 乗り物 / W 水 / T 宝箱 / . 道 / , 草 / F 花 / = 扉・出入口(歩ける) / ^ やぶ(エンカウント) */
#include "game.h"

const char *const ITEM_NAMES[ITEM_COUNT] = { "やくそう", "ふしぎな水", "ほしのしずく" };

const EnemyDef ENEMIES[] = {
    /* name, hp, atk, def, spd, exp, gold, boss */
    { "しずくの精", 12, 5, 1, 4, 4, 3, false },
    { "こもれびウサギ", 16, 6, 1, 7, 5, 4, false },
    { "ちびコウモリ", 14, 7, 0, 9, 6, 5, false },
    { "短剣の山賊", 32, 8, 2, 5, 20, 30, true },
    /* ---- 第2章 ---- */
    { "ほうきのおばけ", 22, 8, 2, 6, 9, 7, false },
    { "すずりの精", 26, 9, 3, 5, 11, 9, false },
    { "校長の用心棒", 70, 12, 4, 6, 45, 60, true }
};
const int ENEMY_COUNT = sizeof(ENEMIES) / sizeof(ENEMIES[0]);

const EnemyGroup GROUPS[] = {
    { 1, { 0, 0, 0 } }, /* G_SHIZUKU */
    { 1, { 1, 0, 0 } }, /* G_USAGI */
    { 1, { 2, 0, 0 } }, /* G_BAT */
    { 2, { 0, 1, 0 } }, /* G_MIX */
    { 1, { 3, 0, 0 } }, /* G_BANDIT */
    { 1, { 4, 0, 0 } }, /* G_BROOM */
    { 1, { 5, 0, 0 } }, /* G_SUZURI */
    { 2, { 4, 5, 0 } }, /* G_SCHOOL_MIX */
    { 2, { 6, 4, 0 } }  /* G_BOUNCER */
};
const int GROUP_COUNT = sizeof(GROUPS) / sizeof(GROUPS[0]);

/* ---- ひなた村 ---- */
static const Npc npc_hinata[] = {
    { 5, 6, S_NPC_MOTHER, -1, -1, 230, 120, 140 },
    { 19, 6, S_NPC_FATHER, -1, -1, 90, 120, 220 },
    { 12, 8, S_NPC_OLDMAN, -1, -1, 200, 200, 200 },
    { 3, 5, S_NPC_SERA_HOME, -1, -1, 240, 160, 200 },
    { 10, 7, S_NPC_SIGN, -1, -1, 160, 110, 60 }
};
static const Trigger trig_hinata[] = {
    { 15, 7, S_FIRE_BELL, F_RIDE_DONE, F_BELL_DONE }
};
static const Warp warp_hinata[] = {
    { 24, 7, AREA_PLAZA, 1, 7, -1, 0 }
};

/* ---- ひだまり公園＆星あかり祭り広場 ---- */
static const Npc npc_plaza[] = {
    { 13, 5, S_FESTIVAL_RIDE, F_MET_SERA, F_RIDE_DONE, 240, 200, 80 },
    { 13, 5, S_NPC_RIDE_MAN, F_RIDE_DONE, -1, 240, 200, 80 },
    { 8, 9, S_NPC_SISTER, -1, -1, 120, 200, 160 }
};
static const Trigger trig_plaza[] = {
    { 6, 5, S_MEET_SERA, -1, F_MET_SERA }
};
static const Warp warp_plaza[] = {
    { 0, 7, AREA_HINATA, 23, 7, -1, 0 },
    { 24, 7, AREA_FIELD, 1, 7, -1, 0 },
    { 12, 13, AREA_KINDER, 12, 12, F_BANDIT_DEAD, S_BLOCKED_KINDER }
};

/* ---- ひなた原っぱ(魔物が出る) ---- */
static const Npc npc_field[] = {
    { 5, 3, S_NPC_FIELD_KID, -1, -1, 120, 200, 160 }
};
static const Warp warp_field[] = {
    { 0, 7, AREA_PLAZA, 23, 7, -1, 0 }
};

/* ---- みつば園 ---- */
static const Npc npc_kinder[] = {
    { 12, 4, S_NPC_TEACHER, -1, F_DISPUTE_DONE, 250, 250, 250 },
    { 12, 4, S_KINDER_DONE, F_DISPUTE_DONE, -1, 250, 250, 250 },
    { 7, 7, S_KINDER_DISPUTE, F_KINDER_ARRIVED, F_DISPUTE_DONE, 200, 80, 80 },
    { 17, 7, S_NPC_SERA_KINDER, -1, -1, 240, 160, 200 }
};
static const Trigger trig_kinder[] = {
    { 12, 12, S_KINDER_ARRIVE, -1, F_KINDER_ARRIVED }
};
static const Warp warp_kinder[] = {
    { 12, 14, AREA_PLAZA, 12, 12, -1, 0 }
};

/* ---- 学び舎の町ミルフィ(第2章) ---- */
static const Npc npc_milfi[] = {
    { 6, 5, S_NPC_MILFI_A, -1, -1, 220, 170, 120 },
    { 17, 6, S_NPC_MILFI_B, -1, -1, 120, 200, 160 },
    { 10, 4, S_NPC_MILFI_C, -1, -1, 200, 200, 200 }
};
static const Warp warp_milfi[] = {
    { 11, 3, AREA_SCHOOL, 12, 12, -1, 0 }
};

/* ---- ミルフィの学び舎(第2章の舞台。魔物が出る) ---- */
static const Npc npc_school[] = {
    { 14, 8, S_GAI_JOIN, F_SCHOOL_ENTERED, F_GAI_JOINED, 80, 80, 210 },
    { 5, 5, S_TEACHER_BOUND, F_SCHOOL_ENTERED, F_PRINCIPAL_DONE, 250, 250, 250 },
    { 5, 5, S_TEACHER_FREE, F_PRINCIPAL_DONE, -1, 250, 250, 250 },
    { 3, 9, S_CLUE_A, F_GAI_JOINED, F_CLUE_A, 255, 120, 40 },
    { 20, 9, S_CLUE_B, F_CLUE_A, F_CLUE_B, 255, 120, 40 },
    { 12, 4, S_PRINCIPAL_IDLE, F_SCHOOL_ENTERED, F_CLUE_B, 120, 60, 160 },
    { 12, 4, S_PRINCIPAL_CONFRONT, F_CLUE_B, F_PRINCIPAL_DONE, 120, 60, 160 }
};
static const Trigger trig_school[] = {
    { 12, 12, S_SCHOOL_ENTER, -1, F_SCHOOL_ENTERED }
};
static const Warp warp_school[] = {
    { 12, 14, AREA_MILFI, 11, 4, -1, 0 }
};

#define NA(a) (int)(sizeof(a) / sizeof((a)[0]))
const Area AREAS[] = {
    { "ひなた村", 25, 15, {
        "#########################",
        "#,,F,,,,,,,,,,,,,,,F,,,,#",
        "#,HHHH,,,,,,,,,,,HHHH,,,#",
        "#,HHHH,,,FF,,,,,,HHHH,,,#",
        "#,H==H,,,,,,,,,,,H==H,,,#",
        "#,,.,,,,,,,,,,,,,,,.,,,,#",
        "#,,.,,,,,,,,,,,,,,,.,,,,#",
        "#.......................=",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,WWW,,,,,,,,,,,,#",
        "#,,F,,,,WWWWW,,,,,,F,,,,#",
        "#,,,,,,,,WWW,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#########################" },
      false, 0, 0, NA(npc_hinata), npc_hinata, NA(trig_hinata), trig_hinata, NA(warp_hinata), warp_hinata },
    { "ひだまり公園・祭り広場", 25, 15, {
        "#########################",
        "#FF,,,,,,,,,,,,,,,,,,,FF#",
        "#,,,,,,,,,,,,RRR,,,,,,,,#",
        "#,,,,,,,,,,,,RRR,,,,,,,,#",
        "#,,,,,,,,,,,,RRR,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "=.......................=",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,FF,,,,,,,,,,,,,,FF,,,#",
        "###########.=.###########",
        "#########################" },
      false, 0, 0, NA(npc_plaza), npc_plaza, NA(trig_plaza), trig_plaza, NA(warp_plaza), warp_plaza },
    { "ひなた原っぱ", 25, 15, {
        "#########################",
        "#,,,,^^^,,,,,,,,,,,,,,,,#",
        "#,,,,^^^,,,,,,^^^,,,,,,,#",
        "#,,,,,,,,,,,,,^^^,,,,,T,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,^^,,,,,,,,,,,^^,,,,,#",
        "#,,,^^,,,,,,,,,,,^^,,,,,#",
        "=,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,^^^,,,,,,,,,,#",
        "#,,,,,,,,,,^^^,,,,,,,,,,#",
        "#,,,,^^,,,,,,,,,,,,,,,,,#",
        "#,,,,^^,,,,,,,,,,^^^,,,,#",
        "#,,,,,,,,,,,,,,,,,^^^,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#########################" },
      true, G_SHIZUKU, G_MIX, NA(npc_field), npc_field, 0, 0, NA(warp_field), warp_field },
    { "みつば園", 25, 15, {
        "#########################",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,FFF,,,,,,,,,,,,,,,FFF,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "###########.=.###########" },
      false, 0, 0, NA(npc_kinder), npc_kinder, NA(trig_kinder), trig_kinder, NA(warp_kinder), warp_kinder },
    { "学び舎の町ミルフィ", 25, 15, {
        "#########################",
        "#,F,,,,,HHHHHHH,,,,,,F,,#",
        "#,,,,,,,HHHHHHH,,,,,,,,,#",
        "#,,,,,,,HHH=HHH,,,,,,,,,#",
        "#,,,,,,,,,,,.,,,,,,,,,,,#",
        "#,,,,,,,,,,,.,,,,,,,,,,,#",
        "#,,,,,,,,,,,.,,,,,,,,,,,#",
        "#.......................#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,HHHH,,,,,,,,,,,,HHHH,,#",
        "#,HHHH,,,,,,,,,,,,HHHH,,#",
        "#,H==H,,,,,,,,,,,,H==H,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#########################" },
      false, 0, 0, NA(npc_milfi), npc_milfi, 0, 0, NA(warp_milfi), warp_milfi },
    { "ミルフィの学び舎", 25, 15, {
        "#########################",
        "#,HHH,,HHH,,,,,,HHH,,HHH#",
        "#,HHH,,HHH,,,,,,HHH,,HHH#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,F,,,,,,,,,,,,,,,F,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "#,,,,,,,,,,,,,,,,,,,,,,,#",
        "###########.=.###########" },
      true, G_BROOM, G_SCHOOL_MIX, NA(npc_school), npc_school, NA(trig_school), trig_school, NA(warp_school), warp_school }
};
const int AREA_COUNT = sizeof(AREAS) / sizeof(AREAS[0]);
