#ifndef CLUE_H
#define CLUE_H
/* Update07: 第3章「勤勉の像の謎」手がかりボードの純粋ロジック(game.c非依存) */
#define CL_COUNT 5          /* 手がかりの数(ID 0..4) */
#define CL_REQUIRED 0x07    /* 必須の手がかり: ID 0,1,2 */
#define CL_NEED_TOTAL 4     /* 推理に必要な手がかりの最小数 */
#define CL_CHOICES 3
#define CL_CORRECT 1        /* 正解の選択肢 */

#define CL_ADDED 1
#define CL_DUP 0
#define CL_BAD (-1)

#define CL_NOT_READY (-1)
#define CL_WRONG 0
#define CL_RIGHT 1

/* 手がかり id を mask に追加。新規=CL_ADDED / 既出=CL_DUP / 不正id=CL_BAD */
int cl_add(unsigned *mask, int id);
int cl_has(unsigned mask, int id);
/* 有効な手がかり(ID 0..CL_COUNT-1)の個数。範囲外のビットは数えない */
int cl_count(unsigned mask);
/* 必須を全て持ち、かつ個数が CL_NEED_TOTAL 以上なら 1 */
int cl_ready(unsigned mask);
/* 推理の判定。未準備=CL_NOT_READY / 不正解=CL_WRONG / 正解=CL_RIGHT */
int cl_verdict(unsigned mask, int choice);
/* 星評価 1..3: 全部の手がかり+間違い0回=3、準備済み+間違い2回以下=2、他=1 */
int cl_stars(unsigned mask, int wrong);
/* 手がかり名 / 選択肢文 / ヒント(不足している必須手がかりを教える)。範囲外は "" */
const char *cl_text(int id);
const char *cl_choice(int i);
const char *cl_hint(unsigned mask);
#endif
