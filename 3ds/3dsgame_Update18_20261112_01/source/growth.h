#ifndef GROWTH_H
#define GROWTH_H
/* Update05: 経験値・レベル成長の純粋ロジック(game.c非依存) */
#define GR_MAX_LEVEL 30
#define GR_MAX_EXP   999999

/* レベル lv から lv+1 に必要な経験値(lv=1..GR_MAX_LEVEL-1)。上限レベルでは 0 */
int gr_need(int lv);
/* レベル lv に到達するのに必要な累計経験値(lv=1 は 0) */
int gr_total_for(int lv);
/* 累計経験値からレベルを求める(1..GR_MAX_LEVEL) */
int gr_level_of(int total_exp);
/* 経験値加算(上限 GR_MAX_EXP でクランプ)。上がったレベル数を返し、*total を更新 */
int gr_add_exp(int *total, int gain);
/* 能力値: base + per10*(lv-1)/10。per10 は10倍の成長値 */
int gr_stat(int base, int per10, int lv);
/* 戦闘で得る経験値: 敵経験値 exp を生存人数 alive で割る(切り上げ、最低1)。alive<=0 は 0 */
int gr_share(int exp, int alive);
/* 敵レベル差補正%: 主人公側が高いほど減る(50..150) */
int gr_level_gap_pct(int party_lv, int enemy_lv);
#endif
