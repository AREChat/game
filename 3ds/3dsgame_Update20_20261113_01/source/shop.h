/* shop.h - ほしあかり英雄譚 ショップ・宿屋・装備ロジック(Update02)
 * game.c には依存しない純粋ロジック。SaveData と EquipState だけを操作する。
 * 町ミルフィの店/宿NPCとメニュー画面への組み込みは次回(DEVLOG参照)。 */
#ifndef SHOP_H
#define SHOP_H
#include "game.h"

#define ITEM_MAX_STACK 99
#define GOLD_MAX 999999

typedef enum { SHOP_OK, SHOP_NO_GOLD, SHOP_FULL, SHOP_NO_ITEM, SHOP_BAD_ARG } ShopResult;

/* ---- 道具の売買 ---- */
int shop_buy_price(int item);   /* 不正IDは -1 */
int shop_sell_price(int item);  /* 買値の半分。不正IDは -1 */
ShopResult shop_buy(SaveData *g, int item, int count);
ShopResult shop_sell(SaveData *g, int item, int count);

/* ---- 宿屋 ---- */
int inn_price(const SaveData *g);   /* 10 + 3 * パーティ最高レベル */
bool inn_rest(SaveData *g);         /* 全員のHP/MPを全快(戦闘不能も復帰)。ゴールド不足ならfalse */

/* ---- 装備 ---- */
#define WEAPON_COUNT 4   /* 0 = なし */
#define ARMOR_COUNT 4    /* 0 = なし */
typedef struct { const char *name; int atk, def, spd, price; } EquipDef;
typedef enum { SLOT_WEAPON, SLOT_ARMOR } EquipSlot;
typedef struct {
    int weapon[MAX_PARTY];      /* 装備中の武器ID */
    int armor[MAX_PARTY];       /* 装備中の防具ID */
    int ownedWeapon[WEAPON_COUNT];   /* 所持数(装備中のぶんを含む) */
    int ownedArmor[ARMOR_COUNT];
} EquipState;

const EquipDef *equip_def(EquipSlot slot, int id);   /* 不正IDはNULL */
void equip_init(EquipState *e);
ShopResult equip_buy(SaveData *g, EquipState *e, EquipSlot slot, int id);
ShopResult equip_set(const SaveData *g, EquipState *e, int member, EquipSlot slot, int id);
int equip_total_atk(const SaveData *g, const EquipState *e, int member);
int equip_total_def(const SaveData *g, const EquipState *e, int member);
int equip_total_spd(const SaveData *g, const EquipState *e, int member);
#endif
