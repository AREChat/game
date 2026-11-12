#ifndef CH3DATA_H
#define CH3DATA_H
/* Update08: 第3章「勤勉の像の謎」のマップ(25x15)・調査スポット・会話データ(game.c非依存)
 * タイル凡例: '#'=かべ '.'=ゆか ','=しばふ 'S'=勤勉の像(通れない) 'B'=ベンチ(通れない)
 *            'D'=学び舎への出口 '1'..'5'=調査スポット(手がかりID 0..4に対応。通れる) */
#define CH3_W 25
#define CH3_H 15
#define CH3_SPOTS 5
#define CH3_START_X 12
#define CH3_START_Y 13

char ch3_tile(int x, int y);               /* 範囲外は '#' */
int  ch3_walkable(int x, int y);           /* 通れれば1 */
int  ch3_spot_at(int x, int y);            /* 調査スポットなら手がかりID(0..4)、なければ -1 */
int  ch3_exit_at(int x, int y);            /* 出口なら1 */
int  ch3_spot_x(int clue_id);              /* 手がかりIDのスポット座標。範囲外は -1 */
int  ch3_spot_y(int clue_id);
const char *ch3_investigate_text(int clue_id); /* 調べた時の文。範囲外は "" */
const char *ch3_npc_text(int i);           /* 周囲の人の話(0..CH3_NPC_N-1) */
#define CH3_NPC_N 4
const char *ch3_verdict_text(int verdict); /* CL_RIGHT / CL_WRONG / CL_NOT_READY に対応する文 */
#endif
