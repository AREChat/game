/* test_shop.c - Update02: ショップ・宿屋・装備ロジックの単体テスト(game.c非依存) */
#include <stdio.h>
#include <string.h>
#include "../source/shop.h"

static int total = 0, failed = 0;
#define CHECK(c) do { total++; if (!(c)) { failed++; printf("FAIL %s:%d  %s\n", __FILE__, __LINE__, #c); } } while (0)

static void mk(SaveData *g, int n, int level) {
    memset(g, 0, sizeof(*g));
    g->partyN = n;
    for (int i = 0; i < n; i++) {
        Member *m = &g->party[i];
        strcpy(m->name, "テスト"); m->level = level;
        m->maxhp = 40; m->hp = 5; m->maxmp = 10; m->mp = 0; m->atk = 8; m->def = 4; m->spd = 6;
    }
}

int main(void) {
    SaveData g; EquipState e;

    /* 価格表 */
    CHECK(shop_buy_price(ITEM_HERB) == 8);
    CHECK(shop_sell_price(ITEM_HERB) == 4);
    for (int i = 0; i < ITEM_COUNT; i++) { CHECK(shop_buy_price(i) > 0); CHECK(shop_sell_price(i) == shop_buy_price(i) / 2); CHECK(shop_sell_price(i) < shop_buy_price(i)); }
    CHECK(shop_buy_price(-1) == -1); CHECK(shop_buy_price(ITEM_COUNT) == -1);
    CHECK(shop_sell_price(-1) == -1); CHECK(shop_sell_price(ITEM_COUNT) == -1);

    /* 購入 */
    mk(&g, 1, 1); g.gold = 20;
    CHECK(shop_buy(&g, ITEM_HERB, 2) == SHOP_OK);
    CHECK(g.gold == 4 && g.items[ITEM_HERB] == 2);
    CHECK(shop_buy(&g, ITEM_HERB, 1) == SHOP_NO_GOLD);
    CHECK(g.gold == 4 && g.items[ITEM_HERB] == 2);   /* 失敗時は変化なし */
    CHECK(shop_buy(&g, ITEM_HERB, 0) == SHOP_BAD_ARG);
    CHECK(shop_buy(&g, ITEM_HERB, -3) == SHOP_BAD_ARG);
    CHECK(shop_buy(&g, 99, 1) == SHOP_BAD_ARG);
    CHECK(shop_buy(NULL, 0, 1) == SHOP_BAD_ARG);
    g.gold = 100000; g.items[ITEM_HERB] = 98;
    CHECK(shop_buy(&g, ITEM_HERB, 2) == SHOP_FULL);
    CHECK(shop_buy(&g, ITEM_HERB, 1) == SHOP_OK && g.items[ITEM_HERB] == 99);
    CHECK(shop_buy(&g, ITEM_HERB, 1) == SHOP_FULL);

    /* 売却 */
    mk(&g, 1, 1); g.items[ITEM_ETHER] = 3; g.gold = 0;
    CHECK(shop_sell(&g, ITEM_ETHER, 2) == SHOP_OK);
    CHECK(g.items[ITEM_ETHER] == 1 && g.gold == 2 * shop_sell_price(ITEM_ETHER));
    CHECK(shop_sell(&g, ITEM_ETHER, 2) == SHOP_NO_ITEM);
    CHECK(g.items[ITEM_ETHER] == 1);
    CHECK(shop_sell(&g, 5, 1) == SHOP_BAD_ARG);
    CHECK(shop_sell(&g, ITEM_ETHER, 0) == SHOP_BAD_ARG);
    g.gold = GOLD_MAX - 1; g.items[ITEM_TONIC] = 5;
    CHECK(shop_sell(&g, ITEM_TONIC, 5) == SHOP_OK && g.gold == GOLD_MAX);   /* 上限で頭打ち */

    /* 売って買い戻すと必ず損をする(転売で稼げない) */
    mk(&g, 1, 1); g.gold = 1000; g.items[ITEM_HERB] = 0;
    for (int i = 0; i < 20; i++) { shop_buy(&g, ITEM_HERB, 1); shop_sell(&g, ITEM_HERB, 1); }
    CHECK(g.gold < 1000);

    /* 宿屋 */
    mk(&g, 3, 1); g.party[1].level = 7; g.party[2].hp = 0;
    CHECK(inn_price(&g) == 10 + 3 * 7);
    g.gold = inn_price(&g) - 1;
    CHECK(!inn_rest(&g));
    CHECK(g.party[0].hp == 5 && g.party[2].hp == 0 && g.gold == inn_price(&g) - 1);   /* 不足時は何も起きない */
    g.gold = inn_price(&g) + 5;
    CHECK(inn_rest(&g));
    CHECK(g.gold == 5);
    for (int i = 0; i < 3; i++) CHECK(g.party[i].hp == g.party[i].maxhp && g.party[i].mp == g.party[i].maxmp);
    mk(&g, 1, 1); CHECK(inn_price(&g) == 13);
    mk(&g, 0, 1); CHECK(inn_price(&g) == 13);   /* 空パーティでも落ちない */

    /* 装備データ */
    CHECK(equip_def(SLOT_WEAPON, 0) && equip_def(SLOT_WEAPON, 0)->atk == 0);
    CHECK(equip_def(SLOT_WEAPON, WEAPON_COUNT) == NULL && equip_def(SLOT_ARMOR, -1) == NULL);
    for (int i = 1; i < WEAPON_COUNT; i++) CHECK(equip_def(SLOT_WEAPON, i)->atk > equip_def(SLOT_WEAPON, i - 1)->atk || equip_def(SLOT_WEAPON, i)->spd > 0);
    for (int i = 1; i < ARMOR_COUNT; i++) CHECK(equip_def(SLOT_ARMOR, i)->price > equip_def(SLOT_ARMOR, i - 1)->price);
    for (int i = 1; i < WEAPON_COUNT; i++) CHECK(equip_def(SLOT_WEAPON, i)->price > equip_def(SLOT_WEAPON, i - 1)->price);

    /* 装備購入・装着 */
    mk(&g, 2, 3); equip_init(&e); g.gold = 100;
    CHECK(equip_buy(&g, &e, SLOT_WEAPON, 0) == SHOP_BAD_ARG);        /* 「なし」は買えない */
    CHECK(equip_buy(&g, &e, SLOT_WEAPON, 9) == SHOP_BAD_ARG);
    CHECK(equip_buy(&g, &e, SLOT_WEAPON, 3) == SHOP_NO_GOLD && g.gold == 100);
    CHECK(equip_buy(&g, &e, SLOT_WEAPON, 1) == SHOP_OK && g.gold == 60 && e.ownedWeapon[1] == 1);
    CHECK(equip_set(&g, &e, 0, SLOT_WEAPON, 2) == SHOP_NO_ITEM);      /* 持っていない物は装備できない */
    CHECK(equip_set(&g, &e, 0, SLOT_WEAPON, 1) == SHOP_OK);
    CHECK(equip_set(&g, &e, 1, SLOT_WEAPON, 1) == SHOP_NO_ITEM);      /* 1本しかないので二人は持てない */
    CHECK(equip_buy(&g, &e, SLOT_WEAPON, 1) == SHOP_OK);
    CHECK(equip_set(&g, &e, 1, SLOT_WEAPON, 1) == SHOP_OK);
    CHECK(equip_set(&g, &e, 1, SLOT_WEAPON, 0) == SHOP_OK && e.weapon[1] == 0);   /* はずせる */
    CHECK(equip_set(&g, &e, 2, SLOT_WEAPON, 0) == SHOP_BAD_ARG);      /* パーティ外 */
    CHECK(equip_set(&g, &e, -1, SLOT_ARMOR, 0) == SHOP_BAD_ARG);

    /* 能力値への反映 */
    CHECK(equip_total_atk(&g, &e, 0) == 8 + 3);
    CHECK(equip_total_atk(&g, &e, 1) == 8);
    g.gold = 500;
    CHECK(equip_buy(&g, &e, SLOT_ARMOR, 2) == SHOP_OK);
    CHECK(equip_set(&g, &e, 0, SLOT_ARMOR, 2) == SHOP_OK);
    CHECK(equip_total_def(&g, &e, 0) == 4 + 3);
    CHECK(equip_total_spd(&g, &e, 0) == 6 + 1);
    CHECK(equip_set(&g, &e, 0, SLOT_ARMOR, 2) == SHOP_OK);   /* 同じ物を再装備しても壊れない */
    CHECK(equip_total_def(&g, &e, 0) == 7);

    /* 全装備の整合性: 全員に全種を持たせても落ちない */
    mk(&g, MAX_PARTY, 5); equip_init(&e); g.gold = GOLD_MAX;
    for (int s = 0; s < 2; s++)
        for (int id = 1; id < 4; id++)
            for (int m = 0; m < MAX_PARTY; m++) {
                CHECK(equip_buy(&g, &e, (EquipSlot)s, id) == SHOP_OK);
                CHECK(equip_set(&g, &e, m, (EquipSlot)s, id) == SHOP_OK);
            }
    for (int m = 0; m < MAX_PARTY; m++) { CHECK(equip_total_atk(&g, &e, m) > 8); CHECK(equip_total_def(&g, &e, m) > 4); }

    printf("shop tests: %d checks, %d failed\n", total, failed);
    return failed ? 1 : 0;
}
