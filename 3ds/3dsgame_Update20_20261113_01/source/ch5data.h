#ifndef CH5DATA_H
#define CH5DATA_H
/* Update11: 第5章「首の病と最下位」の舞台(学び舎の中庭と保健室)・手がかり・立ち直りの判定。game.c非依存の純粋データ/ロジック。
 * タイル凡例: '#'かべ '.'ゆか ','しばふ 'N'保健室の先生(通れない・となりから話しかける) 'D'出口 '1'〜'4'調査スポット */
#define CH5_W 25
#define CH5_H 15
#define CH5_START_X 12
#define CH5_START_Y 13
#define CH5_SPOTS 4
#define CH5_NPC_N 3
#define CH5_CHOICES 3
#define CH5_CORRECT 1
#define CH5_NOT_READY (-1)
#define CH5_WRONG 0
#define CH5_RIGHT 1
#define CH5_BAD (-1)
#define CH5_DUP 0
#define CH5_ADDED 1

char ch5_tile(int x, int y);            /* 範囲外は '#' */
int ch5_walkable(int x, int y);         /* '#' 'N' 以外は歩ける */
int ch5_spot_at(int x, int y);          /* スポットID(0..3)。なければ -1 */
int ch5_exit_at(int x, int y);          /* 出口なら 1 */
int ch5_spot_x(int id);                 /* 範囲外は -1 */
int ch5_spot_y(int id);
int ch5_nurse_x(void);
int ch5_nurse_y(void);
const char *ch5_investigate_text(int id);  /* 範囲外は "" */
const char *ch5_npc_text(int i);           /* 範囲外は "" */

/* 手がかり(ビットマスク)。ID: 0=先生の見立て 1=ミオの勉強ノート 2=順位表 3=屋台の食材メモ */
int ch5_count(unsigned mask);
int ch5_has(unsigned mask, int id);
int ch5_add(unsigned *mask, int id);       /* CH5_ADDED / CH5_DUP / CH5_BAD */
int ch5_ready(unsigned mask);              /* ノート(ID1)を読み、かつ3つ以上 */
const char *ch5_hint(unsigned mask);       /* 常に空でない文 */
const char *ch5_choice(int i);             /* 立ち直りの言葉(3択)。範囲外は "" */
int ch5_verdict(unsigned mask, int choice);/* 準備不足 -1 / 不正解 0 / 正解 1 */
int ch5_stars(unsigned mask, int wrong_count); /* 1..3 */
#endif
