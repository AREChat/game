/* test_battle.c - Update03: 戦闘強化ロジックの単体テスト(game.c 非依存) */
#include <stdio.h>
#include <string.h>
#include "../source/battle_ai.h"

static int total = 0, failed = 0;
#define CHECK(c) do { total++; if (!(c)) { failed++; printf("FAIL %s:%d  %s\n", __FILE__, __LINE__, #c); } } while (0)

int main(void) {
    /* ダメージ計算 */
    CHECK(bt_damage(10, 4, false, 0) == 8);
    CHECK(bt_damage(10, 4, false, 3) == 11);
    CHECK(bt_damage(10, 4, true, 0) == 4);
    CHECK(bt_damage(1, 99, false, 0) == 1);
    CHECK(bt_damage(1, 99, true, 0) == 1);
    CHECK(bt_damage(-5, -5, false, 0) == 1);
    CHECK(bt_damage(10, 0, false, 99) == bt_damage(10, 0, false, 3));
    CHECK(bt_damage(10, 0, false, -4) == bt_damage(10, 0, false, 0));
    for (int atk = 0; atk <= 40; atk++)
        for (int def = 0; def <= 40; def += 3)
            for (int r = 0; r <= 3; r++) {
                int n = bt_damage(atk, def, false, r), g = bt_damage(atk, def, true, r);
                CHECK(n >= 1); CHECK(g >= 1); CHECK(g <= n);
                CHECK(g >= n / 2);
                if (r > 0) CHECK(n > bt_damage(atk, def, false, r - 1) - 1);
            }
    /* かばう */
    CHECK(bt_cover_damage(8) == 6);
    CHECK(bt_cover_damage(1) == 1);
    CHECK(bt_cover_damage(0) == 1);
    CHECK(bt_cover_damage(-3) == 1);
    for (int d = 1; d <= 100; d++) { CHECK(bt_cover_damage(d) <= d); CHECK(bt_cover_damage(d) >= 1); }
    {
        int hp[4] = { 10, 0, 5, 7 };
        bool cv[4] = { false, true, true, true };
        CHECK(bt_cover_pick(hp, cv, 4, 0) == 2);   /* idx1はHP0でかばえない */
        CHECK(bt_cover_pick(hp, cv, 4, 2) == 3);   /* 本人以外 */
        cv[2] = cv[3] = false;
        CHECK(bt_cover_pick(hp, cv, 4, 0) == 0);   /* かばえる人なし */
        CHECK(bt_cover_pick(NULL, cv, 4, 1) == 1);
        CHECK(bt_cover_pick(hp, NULL, 4, 1) == 1);
        CHECK(bt_cover_pick(hp, cv, 0, 1) == 1);
    }
    /* 敵パターン */
    for (int t = 0; t < 12; t++) {
        CHECK(bt_enemy_choose(PAT_PLAIN, t, 50, 50) == BA_ATTACK);
        CHECK(bt_enemy_choose(PAT_PLAIN, t, 1, 50) == BA_ATTACK);
    }
    CHECK(bt_enemy_choose(PAT_CYCLE, 0, 30, 30) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CYCLE, 1, 30, 30) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CYCLE, 2, 30, 30) == BA_STRONG);
    CHECK(bt_enemy_choose(PAT_CYCLE, 5, 1, 30) == BA_STRONG);
    CHECK(bt_enemy_choose(PAT_RAGE, 3, 100, 100) == BA_ATTACK);    /* 元気なうちは通常 */
    CHECK(bt_enemy_choose(PAT_RAGE, 0, 50, 100) == BA_STRONG);     /* ちょうど半分から本気 */
    CHECK(bt_enemy_choose(PAT_RAGE, 3, 40, 100) == BA_WAIT);
    CHECK(bt_enemy_choose(PAT_RAGE, 7, 40, 100) == BA_WAIT);
    CHECK(bt_enemy_choose(PAT_RAGE, 4, 40, 100) == BA_STRONG);
    CHECK(bt_enemy_choose(PAT_CAUTIOUS, 0, 100, 100) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CAUTIOUS, 0, 20, 100) == BA_HEAL);
    CHECK(bt_enemy_choose(PAT_CAUTIOUS, 1, 20, 100) == BA_GUARD);
    CHECK(bt_enemy_choose(PAT_CAUTIOUS, 5, 20, 100) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CAUTIOUS, 0, 40, 100) == BA_ATTACK); /* 半分未満でもturn0はGUARDでもHEALでもない */
    CHECK(bt_enemy_choose(PAT_CAUTIOUS, 1, 40, 100) == BA_GUARD);
    /* 不正引数 */
    CHECK(bt_enemy_choose((EnemyPattern)-1, 0, 10, 10) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_COUNT, 0, 10, 10) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CYCLE, 2, 10, 0) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CYCLE, 2, -1, 10) == BA_ATTACK);
    CHECK(bt_enemy_choose(PAT_CYCLE, -7, 10, 10) == BA_ATTACK);
    /* 全パターン×全ターン×HP段階の不変条件 */
    for (int p = 0; p < PAT_COUNT; p++)
        for (int t = 0; t < 30; t++)
            for (int hp = 0; hp <= 100; hp += 5) {
                BattleAct a = bt_enemy_choose((EnemyPattern)p, t, hp, 100);
                CHECK(a >= 0 && a < BA_COUNT);
                if (a == BA_HEAL) CHECK(p == PAT_CAUTIOUS && hp * 4 < 100);
                if (a == BA_WAIT) CHECK(p == PAT_RAGE && hp * 2 <= 100);
                if (a == BA_GUARD) CHECK(p == PAT_CAUTIOUS);
                if (a == BA_STRONG) CHECK(p == PAT_CYCLE || p == PAT_RAGE);
            }
    /* 威力と名前 */
    CHECK(bt_act_power_pct(BA_ATTACK) == 100 && bt_act_power_pct(BA_STRONG) == 160);
    CHECK(bt_act_power_pct(BA_HEAL) == 0 && bt_act_power_pct(BA_GUARD) == 0 && bt_act_power_pct(BA_WAIT) == 0);
    CHECK(bt_scale(10, BA_ATTACK) == 10 && bt_scale(10, BA_STRONG) == 16 && bt_scale(10, BA_HEAL) == 0);
    CHECK(bt_scale(0, BA_STRONG) == 1);
    for (int a = 0; a < BA_COUNT; a++) { CHECK(bt_act_name((BattleAct)a) != NULL); CHECK(strlen(bt_act_name((BattleAct)a)) > 0); }
    CHECK(bt_act_name(BA_COUNT) == NULL);
    printf("battle tests: %d checks, %d failed\n", total, failed);
    return failed ? 1 : 0;
}
