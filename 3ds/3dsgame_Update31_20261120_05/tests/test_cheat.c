/* test_cheat.c - チートコード100パターンの テスト(どの順番で なんど つかっても、セーブが こわれない) */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "../source/game.h"
#include "../source/cheat.h"
#include "../source/monster.h"
#include "../source/skills.h"
#include "../source/platform.h"
#include "../source/host_api.h"

static int checks = 0, fails = 0;
#define CHECK(c, ...) do { checks++; if (!(c)) { fails++; if (fails < 30) { printf("FAIL line %d: ", __LINE__); printf(__VA_ARGS__); printf("\n"); } } } while (0)

/* game_load と 同じ きびしさで 中身を たしかめる */
static int valid(const SaveData *g, const char *why, int code) {
    int ok = 1;
#define V(c) do { if (!(c)) { ok = 0; if (fails < 30) printf("  invalid(%s code %d): %s\n", why, code, #c); } } while (0)
    V(g->gold >= 0 && g->gold <= 999999);
    V(g->ext.coins >= 0 && g->ext.coins <= 9999999);
    for (int i = 0; i < ITEM_COUNT; i++) V(g->items[i] >= 0 && g->items[i] <= 99);
    V(g->partyN >= 1 && g->partyN <= MAX_PARTY);
    for (int i = 0; i < g->partyN; i++) {
        const Member *m = &g->party[i];
        V(m->level >= 1 && m->level <= 99); V(m->maxhp >= 1 && m->hp >= 0 && m->hp <= m->maxhp); V(m->mp >= 0 && m->mp <= m->maxmp);
        V(m->name[0] != 0); V(m->skill >= 0 && m->skill < 4);
    }
    V(g->area >= 0 && g->area < AREA_COUNT);
    if (g->area >= 0 && g->area < AREA_COUNT) V(g->px >= 0 && g->py >= 0 && g->px < AREAS[g->area].w && g->py < AREAS[g->area].h && game_is_walkable(&AREAS[g->area], g->px, g->py));
    V(g->ext.monN >= 0 && g->ext.monN <= MON_BOX);
    for (int i = 0; i < g->ext.monN && i < MON_BOX; i++) V(g->ext.mon[i].enemy < ENEMY_COUNT && g->ext.mon[i].level >= 1 && g->ext.mon[i].level <= 99);
    for (int i = 0; i < MAX_PARTY; i++) {
        V(g->ext.job[i] < JOB_COUNT);
        for (int j = 0; j < JOB_COUNT; j++) V(g->ext.jobLv[i][j] <= JOB_MAX_LV && g->ext.jobExp[i][j] >= 0 && g->ext.jobExp[i][j] <= 9999999);
    }
    V(g->ext.arenaRank >= 0 && g->ext.arenaRank < ARENA_RANKS);
    for (int i = 0; i < ENEMY_MAX; i++) V(g->ext.seen[i] <= 2);
    for (int i = 11; i <= 14; i++) V(g->ext.reserved[i] >= 0 && g->ext.reserved[i] <= 3);
    for (int i = 0; i < WEAPON_COUNT; i++) V(g->ext.eq.ownedWeapon[i] >= 0 && g->ext.eq.ownedWeapon[i] <= 99);
    for (int i = 0; i < ARMOR_COUNT; i++) V(g->ext.eq.ownedArmor[i] >= 0 && g->ext.eq.ownedArmor[i] <= 99);
#undef V
    return ok;
}

static void make_state(SaveData *g, int kind, unsigned *rng) {
    game_init(); game_seed(5);
    *g = *game_data();
    g->partyN = (kind == 0) ? 1 : 4;
    for (int i = 0; i < g->partyN; i++) game_member_init(&g->party[i], i, kind == 2 ? 99 : 1 + (int)(mon_rn(rng, 30)));
    if (kind == 1 || kind == 3) {   /* いっぱい */
        g->gold = 999999; g->ext.coins = 999999; for (int i = 0; i < ITEM_COUNT; i++) g->items[i] = 99;
        for (int i = 0; i < MON_BOX; i++) mon_add(&g->ext, (int)mon_rn(rng, ENEMY_COUNT), 99);
        for (int i = 0; i < MAX_PARTY; i++) { g->ext.job[i] = (unsigned char)(1 + mon_rn(rng, JOB_COUNT - 1)); }
        g->ext.arenaRank = ARENA_RANKS - 1;
        for (int i = 11; i <= 14; i++) g->ext.reserved[i] = (int)mon_rn(rng, 4);
    }
    if (kind == 3) { for (int i = 0; i < g->partyN; i++) g->party[i].hp = 0; }
    if (kind == 4) { g->gold = 0; for (int i = 0; i < ITEM_COUNT; i++) g->items[i] = 0; g->party[0].hp = 1; g->ext.job[0] = 5; }
}

int main(void) {
    host_set_save_path("test_cheat_save.dat");
    /* 1. ひょうの せいごう */
    CHECK(cheat_count() == 100 && CHEAT_COUNT == 100, "count %d", cheat_count());
    for (int i = 0; i < CHEAT_COUNT; i++) {
        const char *c = cheat_code(i);
        CHECK(c[0] != 0 && strlen(c) <= CHEAT_CODE_MAX, "code %d empty/long", i);
        for (const char *p = c; *p; p++) CHECK((*p >= 'a' && *p <= 'z') || (*p >= '0' && *p <= '9'), "code %d char", i);
        CHECK(strlen(cheat_name(i)) > 0, "name %d", i);
        CHECK(cheat_find(c) == i, "find %d %s -> %d", i, c, cheat_find(c));
        for (int j = i + 1; j < CHEAT_COUNT; j++) CHECK(strcmp(c, cheat_code(j)) != 0, "dup code %s", c);
        char up[64], pad[80]; size_t n = strlen(c);
        for (size_t k = 0; k <= n; k++) up[k] = (c[k] >= 'a' && c[k] <= 'z') ? (char)(c[k] - 32) : c[k];
        snprintf(pad, sizeof(pad), "  %s \n", up);
        CHECK(cheat_find(up) == i && cheat_find(pad) == i, "case/space %s", c);
    }
    CHECK(strlen(cheat_code(-1)) == 0 && strlen(cheat_code(100)) == 0 && strlen(cheat_name(100)) == 0, "range");
    /* 2. ふせいな にゅうりょく */
    {
        const char *bad[] = { "", " ", "   \t", "gold", "g1kk", "g1 k", "ゴールド", "lv100", "0", "'; drop", "\n", "ＬＶ９９", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
        SaveData g, h; unsigned rng = 3; make_state(&g, 1, &rng); h = g;
        for (unsigned i = 0; i < sizeof(bad) / sizeof(bad[0]); i++) {
            CheatResult r = cheat_apply(&g, bad[i]);
            CHECK(!r.ok && r.msg[0] != 0 && !r.warped, "bad input %u accepted", i);
            CHECK(memcmp(&g, &h, sizeof(g)) == 0, "bad input %u changed save", i);
        }
        CheatResult r = cheat_apply(NULL, "g1k"); CHECK(!r.ok, "NULL save");
        r = cheat_apply(&g, NULL); CHECK(!r.ok, "NULL input");
        r = cheat_apply_index(&g, -1); CHECK(!r.ok, "index -1");
        r = cheat_apply_index(&g, 100); CHECK(!r.ok, "index 100");
    }
    /* 3. 1つずつ・5しゅるいの 状態で つかう */
    for (int kind = 0; kind < 5; kind++) {
        for (int i = 0; i < CHEAT_COUNT; i++) {
            SaveData g; unsigned rng = (unsigned)(kind * 1000 + i + 1);
            make_state(&g, kind, &rng);
            CHECK(valid(&g, "before", i), "state kind %d invalid before", kind);
            CheatResult r = cheat_apply_index(&g, i);
            CHECK(r.msg[0] != 0, "no message code %d", i);
            CHECK(valid(&g, "after", i), "kind %d code %d (%s) broke save", kind, i, cheat_code(i));
            /* もういちど つかっても だいじょうぶ */
            (void)cheat_apply_index(&g, i);
            CHECK(valid(&g, "twice", i), "kind %d code %d twice", kind, i);
        }
    }
    /* 4. こうかの かくにん */
    {
        SaveData g; unsigned rng = 9; make_state(&g, 0, &rng);
        int g0 = g.gold; cheat_apply(&g, "g1k"); CHECK(g.gold == g0 + 1000, "g1k");
        cheat_apply(&g, "gmax"); CHECK(g.gold == 999999, "gmax");
        cheat_apply(&g, "g100k"); CHECK(g.gold == 999999, "gold cap");
        cheat_apply(&g, "c500"); CHECK(g.ext.coins == 500, "c500");
        cheat_apply(&g, "cmax"); CHECK(g.ext.coins == 99999, "cmax");
        g.items[0] = 5; cheat_apply(&g, "herb10"); CHECK(g.items[0] == 15, "herb10");
        cheat_apply(&g, "herb99"); CHECK(g.items[0] == 99, "herb99");
        cheat_apply(&g, "allitem99"); CHECK(g.items[1] == 99 && g.items[2] == 99, "allitem99");
        strcpy(g.party[0].name, "なまえ");
        cheat_apply(&g, "lv99"); CHECK(g.party[0].level == 99 && strcmp(g.party[0].name, "なまえ") == 0 && g.party[0].hp == g.party[0].maxhp, "lv99 keeps name");
        cheat_apply(&g, "lv10"); CHECK(g.party[0].level == 10, "lv10");
        CheatResult r = cheat_apply(&g, "job30"); CHECK(!r.ok, "job30 needs a job");
        g.ext.job[0] = 3; r = cheat_apply(&g, "job30"); CHECK(r.ok && g.ext.jobLv[0][3] == 30 && job_level_of(g.ext.jobExp[0][3]) == 30, "job30");
        cheat_apply(&g, "alljob30"); CHECK(g.ext.jobLv[0][10] == 30, "alljob30");
        g.party[0].hp = 0; cheat_apply(&g, "revive"); CHECK(g.party[0].hp == g.party[0].maxhp, "revive");
        cheat_apply(&g, "mon11"); CHECK(g.ext.monN == 1 && g.ext.mon[0].enemy == 10 && g.ext.seen[10] == 2, "mon11");
        cheat_apply(&g, "monall"); CHECK(g.ext.monN >= 1 && g.ext.monN <= MON_BOX, "monall");
        cheat_apply(&g, "mon50"); CHECK(g.ext.mon[0].level == 50, "mon50");
        for (int i = 0; i < 30; i++) cheat_apply(&g, "mon01");
        CHECK(g.ext.monN == MON_BOX, "box full stays at %d", g.ext.monN);
        r = cheat_apply(&g, "mon01"); CHECK(!r.ok && r.msg[0], "box full message");
        cheat_apply(&g, "arena3"); CHECK(g.ext.arenaRank == 3, "arena3");
        cheat_apply(&g, "arena1"); CHECK(g.ext.arenaRank == 3, "arena doesn't go down");
        cheat_apply(&g, "allequip"); CHECK(g.ext.eq.ownedWeapon[3] >= 1 && g.ext.eq.ownedArmor[3] >= 1, "allequip");
        cheat_apply(&g, "zukan"); CHECK(g.ext.seen[3] >= 1, "zukan");
        cheat_apply(&g, "zukanall"); CHECK(g.ext.seen[3] == 2, "zukanall");
        r = cheat_apply(&g, "warp9"); CHECK(r.ok && r.warped && g.area == AREA_CAVE, "warp9");
        cheat_apply(&g, "noenc"); CHECK(g.ext.reserved[11] == 1, "noenc");
        cheat_apply(&g, "god"); CHECK(g.ext.reserved[12] == 1, "god");
        cheat_apply(&g, "exp3"); CHECK(g.ext.reserved[13] == 3, "exp3");
        cheat_apply(&g, "gold2"); CHECK(g.ext.reserved[14] == 2, "gold2");
        cheat_apply(&g, "resetmod"); CHECK(g.ext.reserved[11] == 0 && g.ext.reserved[12] == 0 && g.ext.reserved[13] == 0 && g.ext.reserved[14] == 0, "resetmod");
        int hp0 = g.party[0].maxhp; cheat_apply(&g, "maxhp50"); CHECK(g.party[0].maxhp == hp0 + 50, "maxhp50");
        for (int i = 0; i < 400; i++) cheat_apply(&g, "maxhp50");
        CHECK(g.party[0].maxhp <= 9999, "maxhp cap %d", g.party[0].maxhp);
        CHECK(valid(&g, "effects", -1), "effects state valid");
    }
    /* 5. でたらめな じゅんばんで 4まん回 */
    {
        SaveData g; unsigned rng = 77; make_state(&g, 2, &rng);
        for (int n = 0; n < 40000; n++) {
            int i = (int)mon_rn(&rng, CHEAT_COUNT);
            if (mon_rn(&rng, 50) == 0) make_state(&g, (int)mon_rn(&rng, 5), &rng);
            (void)cheat_apply_index(&g, i);
            if (!valid(&g, "fuzz", i)) { CHECK(0, "fuzz broke at step %d code %d", n, i); break; }
        }
    }
    /* 6. ぜんぶ つかってから セーブ → よみこみ できる */
    {
        remove("test_cheat_save.dat");
        for (int kind = 0; kind < 5; kind++) {
            SaveData g; unsigned rng = (unsigned)(kind + 40); make_state(&g, kind, &rng);
            for (int i = 0; i < CHEAT_COUNT; i++) (void)cheat_apply_index(&g, i);
            CHECK(valid(&g, "all", kind), "all 100 codes kind %d", kind);
            g.magic = SAVE_MAGIC; g.version = SAVE_VERSION; g.chapter = 1;
            *game_data() = g;
            CHECK(game_save(), "save kind %d", kind);
            game_init();
            CHECK(game_load(), "load after all cheats kind %d", kind);
        }
        remove("test_cheat_save.dat"); remove("test_cheat_save.dat.bak");
    }
    printf("cheat: %d checks, %d failed\n", checks, fails);
    return fails != 0;
}
