#ifndef CH6DATA_H
#define CH6DATA_H
/* Update12: 第6章「ミオの特訓」の舞台(学び舎の図書室)・手がかり・暗記法の判定。game.c非依存の純粋データ/ロジック。
 * タイル凡例: '#'かべ '.'ゆか 'M'ミオ(通れない・となりから話しかける) 'D'出口 '1'〜'4'調査スポット */
#define CH6_W 25
#define CH6_H 15
#define CH6_START_X 12
#define CH6_START_Y 13
#define CH6_SPOTS 4
#define CH6_NPC_N 2
#define CH6_CHOICES 3
#define CH6_CORRECT 2
#define CH6_NOT_READY (-1)
#define CH6_WRONG 0
#define CH6_RIGHT 1
#define CH6_BAD (-1)
#define CH6_DUP 0
#define CH6_ADDED 1

char ch6_tile(int x, int y);   /* 範囲外は '#' */
int ch6_walkable(int x, int y); /* '#' 'M' 以外は歩ける */
int ch6_spot_at(int x, int y);  /* スポットID(0..3)。なければ -1 */
int ch6_exit_at(int x, int y);  /* 出口なら 1 */
int ch6_spot_x(int id);         /* 範囲外は -1 */
int ch6_spot_y(int id);
int ch6_mio_x(void);
int ch6_mio_y(void);
const char *ch6_investigate_text(int id); /* 範囲外は "" */
const char *ch6_npc_text(int i);          /* 範囲外は "" */

/* 手がかり(ビットマスク)。ID: 0=暗記カードの棚 1=ミオの時間割 2=進路相談のはり紙 3=暗号の掲示板 */
int ch6_count(unsigned mask);
int ch6_has(unsigned mask, int id);
int ch6_add(unsigned *mask, int id); /* CH6_ADDED / CH6_DUP / CH6_BAD */
int ch6_ready(unsigned mask);        /* 暗号の掲示板(ID3)を読み、かつ3つ以上 */
const char *ch6_hint(unsigned mask); /* 常に空でない文 */
const char *ch6_choice(int i);       /* 暗記法の言葉(3択)。範囲外は "" */
int ch6_verdict(unsigned mask, int choice); /* 準備不足 -1 / 不正解 0 / 正解 1 */
int ch6_stars(unsigned mask, int wrong_count); /* 1..3 */
#endif
