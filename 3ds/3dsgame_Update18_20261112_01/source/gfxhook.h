#ifndef GFXHOOK_H
#define GFXHOOK_H
/* Update14: game.c を変えずに絵へ差し替えるための判定(純粋ロジック)。
 * game.c が描く「色の四角」を見て、地面/主人公/ほかの人/主人公の顔 を見分ける。 */
enum { GH_PASS = 0, GH_TILE = 1, GH_PERSON = 2, GH_HERO = 3, GH_SKIP = 4 };
#define GH_BGM_KEEP (-2)
/* 画面(0=上,1=下)の四角(x,y,w,h,色)を分類する。*id は GH_TILE なら TL_*、GH_PERSON なら PS_* */
int gh_classify(int screen, int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b, int *id);
/* 上画面を塗りつぶす色から、鳴らすBGMを選ぶ。変えないときは GH_BGM_KEEP */
int gh_bgm_for_clear(int screen, unsigned char r, unsigned char g, unsigned char b);
#endif
