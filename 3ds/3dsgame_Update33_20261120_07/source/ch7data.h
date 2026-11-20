#ifndef CH7DATA_H
#define CH7DATA_H
/* Update13: 第7章「挑戦状」の舞台(汽車の都レイルハイムの駅広場)・ユノと再会・差出人不明の手紙を調べる手がかり・判断。game.c非依存の純粋データ/ロジック。
 * タイル凡例: '#'かべ '.'みち 'Y'ユノ(通れない・となりから話しかける) 'D'出口 '1'〜'4'調査スポット */
#define CH7_W 25
#define CH7_H 15
#define CH7_START_X 12
#define CH7_START_Y 11
#define CH7_SPOTS 4
#define CH7_NPC_N 2
#define CH7_CHOICES 3
#define CH7_CORRECT 2
#define CH7_NOT_READY (-1)
#define CH7_WRONG 0
#define CH7_RIGHT 1
#define CH7_BAD (-1)
#define CH7_DUP 0
#define CH7_ADDED 1

char ch7_tile(int x, int y);          /* 範囲外は '#' */
int ch7_walkable(int x, int y);       /* '#' 'Y' 以外は歩ける */
int ch7_spot_at(int x, int y);        /* スポットID(0..3)。なければ -1 */
int ch7_exit_at(int x, int y);        /* 出口なら 1 */
int ch7_spot_x(int id);               /* 範囲外は -1 */
int ch7_spot_y(int id);
int ch7_yuno_x(void);
int ch7_yuno_y(void);
const char *ch7_investigate_text(int id); /* 範囲外は "" */
const char *ch7_npc_text(int i);          /* 範囲外は "" */

/* 手がかり(ビットマスク)。ID: 0=改札の落とし物箱 1=駅の時刻表 2=郵便箱 3=ユノの手帳 */
int ch7_count(unsigned mask);
int ch7_has(unsigned mask, int id);
int ch7_add(unsigned *mask, int id);   /* CH7_ADDED / CH7_DUP / CH7_BAD */
int ch7_ready(unsigned mask);          /* 手帳(ID3)を読み、かつ3つ以上 */
const char *ch7_hint(unsigned mask);   /* 常に空でない */
const char *ch7_choice(int i);         /* 範囲外は "" */
int ch7_verdict(unsigned mask, int choice); /* 準備不足 -1 / 不正解 0 / 正解 1 */
int ch7_stars(unsigned mask, int wrong_count); /* 1..3 */
#endif
