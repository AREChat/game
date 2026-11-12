/* battle_ai.c - 戦闘強化ロジック(Update03)。game.c 非依存。 */
#include <stddef.h>
#include "battle_ai.h"

int bt_damage(int atk, int def, bool guarding, int roll) {
    if (atk < 0) atk = 0;
    if (def < 0) def = 0;
    if (roll < 0) roll = 0;
    if (roll > 3) roll = 3;
    int d = atk - def / 2;
    if (d < 1) d = 1;
    d += roll;
    if (guarding) { d = (d + 1) / 2; if (d < 1) d = 1; }
    return d;
}

int bt_cover_damage(int dmg) {
    if (dmg < 1) return 1;
    int d = dmg * 3 / 4;
    return d < 1 ? 1 : d;
}

int bt_cover_pick(const int hp[], const bool cover[], int n, int target) {
    if (!hp || !cover || n <= 0) return target;
    for (int i = 0; i < n; i++)
        if (i != target && cover[i] && hp[i] > 0) return i;
    return target;
}

BattleAct bt_enemy_choose(EnemyPattern p, int turn, int hp, int maxhp) {
    if (p < 0 || p >= PAT_COUNT || maxhp <= 0 || hp < 0) return BA_ATTACK;
    if (turn < 0) turn = 0;
    switch (p) {
    case PAT_CYCLE:    return (turn % 3 == 2) ? BA_STRONG : BA_ATTACK;
    case PAT_RAGE:
        if (hp * 2 > maxhp) return BA_ATTACK;
        return (turn % 4 == 3) ? BA_WAIT : BA_STRONG;
    case PAT_CAUTIOUS:
        if (hp * 4 < maxhp && turn % 2 == 0) return BA_HEAL;
        if (hp * 2 < maxhp && turn % 3 == 1) return BA_GUARD;
        return BA_ATTACK;
    default:           return BA_ATTACK;
    }
}

int bt_act_power_pct(BattleAct a) {
    switch (a) { case BA_ATTACK: return 100; case BA_STRONG: return 160; default: return 0; }
}

int bt_scale(int dmg, BattleAct a) {
    int pct = bt_act_power_pct(a);
    if (pct == 0) return 0;
    int d = dmg * pct / 100;
    return d < 1 ? 1 : d;
}

const char *bt_act_name(BattleAct a) {
    switch (a) {
    case BA_ATTACK: return "こうげき";
    case BA_STRONG: return "つよいいちげき";
    case BA_HEAL:   return "いやしのひかり";
    case BA_GUARD:  return "みをまもる";
    case BA_WAIT:   return "ようすをみている";
    default:        return NULL;
    }
}
