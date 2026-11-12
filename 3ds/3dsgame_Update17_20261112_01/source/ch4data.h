#ifndef CH4DATA_H
#define CH4DATA_H
/* Update10: 第4章「家族の危機」の舞台(山里クロモリの崩れた家のまわり)・母を探す手がかり・説得の判定。game.c非依存の純粋データ/ロジック。
 * タイル凡例: '#'かべ '.'みち ','しばふ 'R'がれき(通れない) 'M'母(通れない・となりから話しかける) 'D'出口 '1'〜'4'調査スポット */
#define CH4_W 25
#define CH4_H 15
#define CH4_START_X 12
#define CH4_START_Y 13
#define CH4_SPOTS 4
#define CH4_NPC_N 3
#define CH4_CHOICES 3
#define CH4_CORRECT 1
#define CH4_NOT_READY (-1)
#define CH4_WRONG 0
#define CH4_RIGHT 1
#define CH4_BAD (-1)
#define CH4_DUP 0
#define CH4_ADDED 1

char ch4_tile(int x, int y);          /* 範囲外は '#' */
int ch4_walkable(int x, int y);       /* '#' 'R' 'M' 以外は歩ける */
int ch4_spot_at(int x, int y);        /* スポットID(0..3)。なければ -1 */
int ch4_exit_at(int x, int y);        /* 出口なら 1 */
int ch4_spot_x(int id);               /* スポットの座標。範囲外は -1 */
int ch4_spot_y(int id);
int ch4_mother_x(void);               /* 母の立つ座標 */
int ch4_mother_y(void);
const char *ch4_investigate_text(int id);  /* 調べた時の文。範囲外は "" */
const char *ch4_npc_text(int i);           /* 村の人の話。範囲外は "" */

/* 手がかり(ビットマスク)。ID: 0=柱の下の母のぼうし 1=山道へのびる足あと 2=机の書き置き 3=山道の入口のかご */
int ch4_count(unsigned mask);
int ch4_has(unsigned mask, int id);
int ch4_add(unsigned *mask, int id);       /* CH4_ADDED / CH4_DUP / CH4_BAD */
int ch4_ready(unsigned mask);              /* 書き置き(ID2)を読み、かつ3つ以上 */
const char *ch4_hint(unsigned mask);       /* 次に調べる場所の案内。常に空でない文 */
const char *ch4_choice(int i);             /* 説得の言葉(3択)。範囲外は "" */
int ch4_verdict(unsigned mask, int choice);/* 準備不足 -1 / 不正解 0 / 正解 1 */
int ch4_stars(unsigned mask, int wrong_count); /* 1..3 */
#endif
