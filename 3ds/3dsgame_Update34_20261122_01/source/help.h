#ifndef HELP_H
#define HELP_H
/* Update23: こまったときのヘルプ(SELECTボタン)。game.c非依存の純粋ロジック。
 * 画面に出す文章(そうさ・いまやること・たたかい・こまったとき)と「いまの目的」を返す。 */
#define HELP_PAGES 6
#define HELP_MAX_LINES 9
#define HELP_LINE_CHARS 24   /* 1行の最大文字数(全角)。上画面に収まる長さ */

const char *help_title(int page);                     /* 0..HELP_PAGES-1。範囲外は "" */
/* ページの本文(1行ごとの文字列)を out に入れて、行数を返す。flags は SaveData.flags */
int help_lines(int page, int chapter, int area, const unsigned char *flags, const char *out[HELP_MAX_LINES]);
/* いまの目的(1行・短く)。章とフラグから決める。必ず空でない文字列を返す */
const char *help_goal(int chapter, int area, const unsigned char *flags);
/* いまの目的の場所(area,x,y)。画面に「！」を出すのに使う。目的が決まっていれば 1 */
int help_goal_info(int chapter, const unsigned char *flags, int *area, int *x, int *y);
/* いまの目的が「ここまで(つづきはアップデート)」の状態なら 1 */
int help_is_end(int chapter, const unsigned char *flags);
#endif
