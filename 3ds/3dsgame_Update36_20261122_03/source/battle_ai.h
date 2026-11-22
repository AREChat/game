/* battle_ai.h - ほしあかり英雄譚 戦闘強化ロジック(Update03)
 * 防御(ぼうぎょ)・かばう・敵の行動パターン。game.c 非依存の純粋ロジック。
 * game.c への組み込みは次回(DEVLOG参照)。 */
#ifndef BATTLE_AI_H
#define BATTLE_AI_H
#include <stdbool.h>

typedef enum { BA_ATTACK, BA_STRONG, BA_HEAL, BA_GUARD, BA_WAIT, BA_COUNT } BattleAct;
typedef enum { PAT_PLAIN, PAT_CYCLE, PAT_RAGE, PAT_CAUTIOUS, PAT_COUNT } EnemyPattern;

/* ダメージ: atk - def/2 (最低1) + roll(0..3) 。ぼうぎょ中は半分(切り上げ、最低1)。atk/def の負値は0扱い */
int bt_damage(int atk, int def, bool guarding, int roll);
/* かばった側が受けるダメージ(3/4、最低1) */
int bt_cover_damage(int dmg);
/* かばう役を選ぶ。かばえる人(cover[i]かつhp>0、target本人以外)の中で最小indexを返す。いなければ target */
int bt_cover_pick(const int hp[], const bool cover[], int n, int target);
/* 敵の行動(turn は0始まり)。不正な引数は BA_ATTACK */
BattleAct bt_enemy_choose(EnemyPattern p, int turn, int hp, int maxhp);
/* 行動の威力% (ATTACK100 / STRONG160 / 他0) と名前 */
int bt_act_power_pct(BattleAct a);
int bt_scale(int dmg, BattleAct a);
const char *bt_act_name(BattleAct a);
#endif
