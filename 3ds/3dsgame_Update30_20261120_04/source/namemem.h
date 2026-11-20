#ifndef NAMEMEM_H
#define NAMEMEM_H
/* Update07: 第4章「全員の名前を覚える作戦」ミニゲームの純粋ロジック(game.c非依存) */
#define NM_POOL 8
#define NM_MAX_SHOW 8

/* 名前プール(NM_POOL個)。範囲外は "" */
const char *nm_name(int i);
/* 第 round(0始まり)ラウンドで覚える人数: 3 + round、最大 NM_MAX_SHOW */
int nm_show_count(int round);
/* seed から 0..n-1 の決定的な並べ替えを out に作る(n は 0..NM_POOL)。成功=n / 不正=-1 */
int nm_order(unsigned seed, int n, int *out);
/* 出題順 shown[0..n-1] に対して answer[0..n-1] の位置が合っている数。不正入力は -1 */
int nm_correct(const int *shown, const int *answer, int n);
/* 正答率% 0..100(n<=0 は 0) */
int nm_percent(int correct, int n);
/* ランク 0..3(100=3, 80以上=2, 50以上=1, それ未満=0) */
int nm_rank(int percent);
#endif
