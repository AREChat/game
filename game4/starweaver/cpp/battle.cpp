// ===== 星紡ぎの旅人（starweaver） 戦闘ダメージ計算（C++ → WebAssembly）=====
// 物語の進行・会話・画面表示は game.js（JS）のまま。
// 「攻撃でどれだけダメージが出るか」「敵の反撃でどれだけ受けるか」「レベルアップ」の
// 数値判定だけを ここで計算する。乱数は呼び出し側（JS）の Math.random() の値を渡してもらい、
// 同じ式で計算することで、見た目や演出には まったく影響を与えない。
#include <cmath>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }
static inline int maxi(int a, int b){ return a > b ? a : b; }
static inline int mini(int a, int b){ return a < b ? a : b; }

// ---- プレイヤーの攻撃（通常／星斬り）。rnd01 は 0以上1未満の乱数（JS側から渡す） ----
// skill=0: 通常攻撃  skill=1: 星斬り（MPを別途4消費する想定。ダメージは ここで1.9倍+3される）
EM_KEEP int battle_player_attack(int atk, int def, int skill, float rnd01){
    int damage = atk - def + (int)(rnd01 * 4.0f);
    if(damage < 1) damage = 1;
    if(skill){ damage = (int)(damage * 1.9f) + 3; }
    return damage;
}

// ---- 敵の攻撃。reduction は「防御」や「木の実薬」使用時に かかる軽減値 ----
EM_KEEP int battle_enemy_attack(int enemyAtk, int playerDef, int reduction, float rnd01){
    int damage = enemyAtk - playerDef + (int)(rnd01 * 3.0f) - reduction;
    if(damage < 1) damage = 1;
    return damage;
}

// ---- レベルアップ判定：経験値がたまっている分だけ 繰り上げる。
// 戻り値は 上がった レベル数（0なら 上がらなかった）。あがった後の level / 残りxp は
// battle_lvup_level() / battle_lvup_xp() で続けて取得する（ポインタを使わず、簡単に呼べるようにするため）。
static int g_lvupLevel = 0, g_lvupXp = 0;
EM_KEEP int battle_level_up(int level, int xp){
    int ups = 0;
    while(xp >= level * 20){
        xp -= level * 20;
        level++;
        ups++;
        if(ups > 999) break; // 暴走防止
    }
    g_lvupLevel = level; g_lvupXp = xp;
    return ups;
}
EM_KEEP int battle_lvup_level(){ return g_lvupLevel; }
EM_KEEP int battle_lvup_xp(){ return g_lvupXp; }

// ---- 戦闘の勝率ざっくり評価（挑戦の目安表示などに使える参考値。0〜100） ----
EM_KEEP int battle_win_chance(int playerHp, int playerAtk, int playerDef, int enemyHp, int enemyAtk, int enemyDef){
    float myDmg = (float)maxi(1, playerAtk - enemyDef + 1);
    float foeDmg = (float)maxi(1, enemyAtk - playerDef + 1);
    float turnsToKill = ceilf((float)enemyHp / myDmg);
    float turnsToDie = ceilf((float)playerHp / foeDmg);
    if(turnsToDie <= 0) return 0;
    float ratio = turnsToDie / (turnsToKill + 0.001f);
    float pct = clampf(50.0f + (ratio - 1.0f) * 35.0f, 3.0f, 97.0f);
    return (int)(pct + 0.5f);
}

EM_KEEP int battle_ping(){ return 46; }
