#ifndef ENCOUNTER_H
#define ENCOUNTER_H
/* Update05: 歩数ベースのエンカウント判定(game.c非依存・決定的) */
typedef struct {
    unsigned seed;      /* 疑似乱数状態 */
    int since_battle;   /* 直前の戦闘/開始からの歩数 */
} EncState;

#define ENC_SAFE_STEPS 6    /* 戦闘後この歩数までは出ない */
#define ENC_FORCE_STEPS 40  /* この歩数に達したら必ず出る(rate>0 のとき) */

void enc_init(EncState *s, unsigned seed);
/* 1歩進める。rate は 1歩あたり出現確率(%)。0なら絶対に出ない。出たら1を返し歩数を0に戻す */
int enc_step(EncState *s, int rate);
/* 乱数 0..n-1 (n<=0 は 0) */
int enc_rand(EncState *s, int n);
/* 重み付き選択: weights[0..cnt-1] の合計から選ぶ。合計0や不正は -1 */
int enc_pick(EncState *s, const int *weights, int cnt);
#endif
