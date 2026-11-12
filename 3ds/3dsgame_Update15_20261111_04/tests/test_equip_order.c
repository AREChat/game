/* Update04: equip_save / turn_order の単体テスト(game.c非依存) */
#include <stdio.h>
#include <string.h>
#include "../source/equip_save.h"
#include "../source/turn_order.h"

static int checks = 0, fails = 0;
#define CHECK(c) do { checks++; if (!(c)) { fails++; printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static EquipState base(void) {
    EquipState e; memset(&e, 0, sizeof e);
    e.ownedWeapon[0] = 1; e.ownedArmor[0] = 1;
    e.ownedWeapon[2] = 2; e.weapon[0] = 2; e.weapon[1] = 2;
    e.ownedArmor[1] = 1; e.armor[2] = 1;
    return e;
}

int main(void) {
    EquipState e = base(), r; int buf[EQUIP_PACK_LEN + 4];
    CHECK(equip_validate(&e));
    CHECK(equip_pack(&e, buf, EQUIP_PACK_LEN) == EQUIP_PACK_LEN);
    memset(&r, 0x55, sizeof r);
    CHECK(equip_unpack(&r, buf, EQUIP_PACK_LEN));
    CHECK(memcmp(&e, &r, sizeof e) == 0);
    /* 容量不足・NULL */
    CHECK(equip_pack(&e, buf, EQUIP_PACK_LEN - 1) == -1);
    CHECK(equip_pack(&e, NULL, 99) == -1);
    CHECK(equip_pack(NULL, buf, 99) == -1);
    CHECK(!equip_validate(NULL));
    CHECK(!equip_unpack(&r, NULL, EQUIP_PACK_LEN));
    CHECK(!equip_unpack(NULL, buf, EQUIP_PACK_LEN));
    CHECK(!equip_unpack(&r, buf, EQUIP_PACK_LEN - 1));
    /* 装備数が所持数を超える */
    EquipState b = base(); b.weapon[2] = 2; b.weapon[3] = 2;
    CHECK(!equip_validate(&b)); CHECK(equip_pack(&b, buf, 99) == -1);
    /* ID範囲外 */
    b = base(); b.weapon[0] = WEAPON_COUNT; CHECK(!equip_validate(&b));
    b = base(); b.armor[1] = -1; CHECK(!equip_validate(&b));
    b = base(); b.ownedArmor[3] = 100; CHECK(!equip_validate(&b));
    b = base(); b.ownedWeapon[1] = -1; CHECK(!equip_validate(&b));
    /* 「なし」(0) は所持数に関わらず何人でも */
    b = base(); b.ownedWeapon[0] = 0; for (int i = 0; i < MAX_PARTY; i++) b.weapon[i] = 0;
    CHECK(equip_validate(&b));
    /* 1ワードでも壊れたら全位置で拒否し、出力は不変 */
    equip_pack(&e, buf, EQUIP_PACK_LEN);
    for (int i = 0; i < EQUIP_PACK_LEN; i++) {
        int save = buf[i];
        buf[i] = save + 1;
        EquipState keep = base(); keep.ownedArmor[2] = 9; keep.ownedArmor[1] = 1;
        EquipState before = keep;
        CHECK(!equip_unpack(&keep, buf, EQUIP_PACK_LEN));
        CHECK(memcmp(&keep, &before, sizeof keep) == 0);
        buf[i] = save;
    }
    /* チェックサムが合っていても中身が不正なら拒否 */
    {
        int v[EQUIP_PACK_LEN]; equip_pack(&e, v, EQUIP_PACK_LEN);
        v[0] = 3; /* 武器3は所持0 */
        unsigned s = 0x5Au; for (int i = 0; i < EQUIP_PACK_LEN - 1; i++) s = (s * 31u + (unsigned)(v[i] + 7)) & 0x7FFFFFFFu;
        v[EQUIP_PACK_LEN - 1] = (int)s;
        CHECK(!equip_unpack(&r, v, EQUIP_PACK_LEN));
    }
    /* 全組み合わせ往復(武器・防具・所持数を総当たり) */
    int rt = 0;
    for (int w = 0; w < WEAPON_COUNT; w++) for (int a = 0; a < ARMOR_COUNT; a++)
    for (int ow = 0; ow <= 3; ow++) for (int oa = 0; oa <= 3; oa++) {
        EquipState x; memset(&x, 0, sizeof x);
        x.weapon[1] = w; x.armor[2] = a;
        if (w) x.ownedWeapon[w] = ow;
        if (a) x.ownedArmor[a] = oa;
        bool ok = equip_validate(&x);
        CHECK(ok == ((!w || ow >= 1) && (!a || oa >= 1)));
        if (ok) { int v[EQUIP_PACK_LEN]; EquipState y;
            CHECK(equip_pack(&x, v, EQUIP_PACK_LEN) == EQUIP_PACK_LEN);
            CHECK(equip_unpack(&y, v, EQUIP_PACK_LEN) && memcmp(&x, &y, sizeof x) == 0); rt++; }
    }
    CHECK(rt > 0);

    /* ---- turn_order ---- */
    int out[16], n;
    { int s[4] = {10, 30, 20, 30}; bool al[4] = {1, 1, 1, 1};
      n = to_order(s, al, 4, out);
      CHECK(n == 4 && out[0] == 1 && out[1] == 3 && out[2] == 2 && out[3] == 0); }
    { int s[4] = {10, 30, 20, 30}; bool al[4] = {1, 0, 1, 0};
      n = to_order(s, al, 4, out); CHECK(n == 2 && out[0] == 2 && out[1] == 0); }
    { int s[3] = {5, 5, 5}; bool al[3] = {1, 1, 1};
      n = to_order(s, al, 3, out); CHECK(n == 3 && out[0] == 0 && out[1] == 1 && out[2] == 2); }
    { int s[2] = {1, 2}; bool al[2] = {0, 0}; CHECK(to_order(s, al, 2, out) == 0); }
    { int s[1] = {1}; bool al[1] = {1}; CHECK(to_order(NULL, al, 1, out) == 0);
      CHECK(to_order(s, NULL, 1, out) == 0); CHECK(to_order(s, al, 1, NULL) == 0);
      CHECK(to_order(s, al, 0, out) == 0); CHECK(to_order(s, al, 17, out) == 0);
      CHECK(to_order(s, al, 1, out) == 1 && out[0] == 0); }
    /* 総当たり: 全速度(0..3)^5 × 生死 で降順・安定・重複なし・生存のみ */
    for (int code = 0; code < 1024; code++) {
        int s[5]; bool al[5]; int c = code;
        for (int i = 0; i < 5; i++) { s[i] = c % 4; c /= 4; }
        for (int m = 0; m < 32; m++) {
            for (int i = 0; i < 5; i++) al[i] = (m >> i) & 1;
            int alive = __builtin_popcount(m);
            n = to_order(s, al, 5, out);
            CHECK(n == alive);
            bool seen[5] = {0};
            for (int i = 0; i < n; i++) {
                CHECK(out[i] >= 0 && out[i] < 5 && al[out[i]] && !seen[out[i]]);
                seen[out[i]] = 1;
                if (i > 0) CHECK(s[out[i-1]] > s[out[i]] || (s[out[i-1]] == s[out[i]] && out[i-1] < out[i]));
            }
        }
    }
    printf("equip_order: %d checks, %d fails\n", checks, fails);
    return fails ? 1 : 0;
}
