/* shop.c - ショップ・宿屋・装備ロジック(Update02)。game.c非依存。 */
#include <string.h>
#include "shop.h"

static const int BUY_PRICE[ITEM_COUNT] = { 8, 24, 30 };  /* やくそう, 星の水, ほしのしずく系 */

static const EquipDef WEAPONS[WEAPON_COUNT] = {
    { "なし",         0, 0, 0,   0 },
    { "木のつるぎ",   3, 0, 0,  40 },
    { "ひなたの短剣", 5, 0, 2,  90 },
    { "星鉄のけん",   9, 0, 0, 260 }
};
static const EquipDef ARMORS[ARMOR_COUNT] = {
    { "なし",           0, 0, 0,   0 },
    { "ぬのの服",       0, 2, 0,  35 },
    { "旅のマント",     0, 3, 1,  80 },
    { "星守りの胴着",   0, 7, 0, 240 }
};

int shop_buy_price(int item) { return (item >= 0 && item < ITEM_COUNT) ? BUY_PRICE[item] : -1; }
int shop_sell_price(int item) { return (item >= 0 && item < ITEM_COUNT) ? BUY_PRICE[item] / 2 : -1; }

ShopResult shop_buy(SaveData *g, int item, int count) {
    if (!g || item < 0 || item >= ITEM_COUNT || count < 1) return SHOP_BAD_ARG;
    if (g->items[item] + count > ITEM_MAX_STACK) return SHOP_FULL;
    long cost = (long)BUY_PRICE[item] * count;
    if (g->gold < cost) return SHOP_NO_GOLD;
    g->gold -= (int)cost;
    g->items[item] += count;
    return SHOP_OK;
}

ShopResult shop_sell(SaveData *g, int item, int count) {
    if (!g || item < 0 || item >= ITEM_COUNT || count < 1) return SHOP_BAD_ARG;
    if (g->items[item] < count) return SHOP_NO_ITEM;
    g->items[item] -= count;
    g->gold += (BUY_PRICE[item] / 2) * count;
    if (g->gold > GOLD_MAX) g->gold = GOLD_MAX;
    return SHOP_OK;
}

int inn_price(const SaveData *g) {
    int lv = 1;
    for (int i = 0; i < g->partyN; i++) if (g->party[i].level > lv) lv = g->party[i].level;
    return 10 + 3 * lv;
}

bool inn_rest(SaveData *g) {
    int p = inn_price(g);
    if (g->gold < p) return false;
    g->gold -= p;
    for (int i = 0; i < g->partyN; i++) { g->party[i].hp = g->party[i].maxhp; g->party[i].mp = g->party[i].maxmp; }
    return true;
}

const EquipDef *equip_def(EquipSlot slot, int id) {
    if (slot == SLOT_WEAPON) return (id >= 0 && id < WEAPON_COUNT) ? &WEAPONS[id] : NULL;
    if (slot == SLOT_ARMOR) return (id >= 0 && id < ARMOR_COUNT) ? &ARMORS[id] : NULL;
    return NULL;
}

void equip_init(EquipState *e) {
    memset(e, 0, sizeof(*e));
    e->ownedWeapon[0] = MAX_PARTY;  /* 「なし」は常に足りている扱い */
    e->ownedArmor[0] = MAX_PARTY;
}

static int *owned_ptr(EquipState *e, EquipSlot slot, int id) {
    return slot == SLOT_WEAPON ? &e->ownedWeapon[id] : &e->ownedArmor[id];
}

ShopResult equip_buy(SaveData *g, EquipState *e, EquipSlot slot, int id) {
    const EquipDef *d = equip_def(slot, id);
    if (!g || !e || !d || id == 0) return SHOP_BAD_ARG;
    int *own = owned_ptr(e, slot, id);
    if (*own >= ITEM_MAX_STACK) return SHOP_FULL;
    if (g->gold < d->price) return SHOP_NO_GOLD;
    g->gold -= d->price;
    (*own)++;
    return SHOP_OK;
}

ShopResult equip_set(const SaveData *g, EquipState *e, int member, EquipSlot slot, int id) {
    if (!g || !e || member < 0 || member >= g->partyN || !equip_def(slot, id)) return SHOP_BAD_ARG;
    int *cur = slot == SLOT_WEAPON ? &e->weapon[member] : &e->armor[member];
    if (*cur == id) return SHOP_OK;
    if (id != 0) {
        /* 他のメンバーが装備している数を差し引いて、空きがあるか確認 */
        int used = 0;
        for (int i = 0; i < g->partyN; i++) {
            int v = slot == SLOT_WEAPON ? e->weapon[i] : e->armor[i];
            if (i != member && v == id) used++;
        }
        if (*owned_ptr(e, slot, id) - used < 1) return SHOP_NO_ITEM;
    }
    *cur = id;
    return SHOP_OK;
}

int equip_total_atk(const SaveData *g, const EquipState *e, int m) {
    return g->party[m].atk + WEAPONS[e->weapon[m]].atk + ARMORS[e->armor[m]].atk;
}
int equip_total_def(const SaveData *g, const EquipState *e, int m) {
    return g->party[m].def + WEAPONS[e->weapon[m]].def + ARMORS[e->armor[m]].def;
}
int equip_total_spd(const SaveData *g, const EquipState *e, int m) {
    return g->party[m].spd + WEAPONS[e->weapon[m]].spd + ARMORS[e->armor[m]].spd;
}
