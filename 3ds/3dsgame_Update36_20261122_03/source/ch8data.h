#ifndef CH8DATA_H
#define CH8DATA_H
/* Update15: 第8章「試験の都」の舞台(学びの都ルミナリアの試験会場前広場)・試験官メルガ・試験の手がかり・判断。game.c非依存の純粋データ/ロジック。
 * タイル凡例: '#'かべ '.'みち 'E'試験官(通れない・となりから話しかける) 'D'出口 '1'〜'4'調査スポット */
#define CH8_W 25
#define CH8_H 15
#define CH8_START_X 12
#define CH8_START_Y 11
#define CH8_SPOTS 4
#define CH8_NPC_N 2
#define CH8_CHOICES 3
#define CH8_CORRECT 2
#define CH8_NOT_READY (-1)
#define CH8_WRONG 0
#define CH8_RIGHT 1
#define CH8_BAD (-1)
#define CH8_DUP 0
#define CH8_ADDED 1

char ch8_tile(int x, int y);   /* 範囲外は '#' */
int ch8_walkable(int x, int y); /* '#' 'E' 以外は歩ける */
int ch8_spot_at(int x, int y);  /* スポットID(0..3)。なければ -1 */
int ch8_exit_at(int x, int y);  /* 出口なら 1 */
int ch8_spot_x(int id);         /* 範囲外は -1 */
int ch8_spot_y(int id);
int ch8_examiner_x(void);
int ch8_examiner_y(void);
const char *ch8_investigate_text(int id); /* 範囲外は "" */
const char *ch8_npc_text(int i);          /* 範囲外は "" */

/* 手がかり(ビットマスク)。ID: 0=受付の掲示板 1=石板の心得 2=受験者のメモ 3=試験の問題用紙 */
int ch8_count(unsigned mask);
int ch8_has(unsigned mask, int id);
int ch8_add(unsigned *mask, int id); /* CH8_ADDED / CH8_DUP / CH8_BAD */
int ch8_ready(unsigned mask);        /* 問題用紙(ID3)を読み、かつ3つ以上 */
const char *ch8_hint(unsigned mask); /* 常に空でない */
const char *ch8_choice(int i);       /* 範囲外は "" */
int ch8_verdict(unsigned mask, int choice); /* 準備不足 -1 / 不正解 0 / 正解 1 */
int ch8_stars(unsigned mask, int wrong_count); /* 1..3 */
#endif
