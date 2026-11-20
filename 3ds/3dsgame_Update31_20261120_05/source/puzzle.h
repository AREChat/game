/* puzzle.h - ひらめきタイム用の純粋ロジック(game.c非依存)
 * 数あてマジック: 2〜9の好きな数を思い浮かべる→9をかける→十の位と一の位を足す→答えはいつも9。
 * 種は「9の段は各位の和が9になる」。*/
#ifndef PUZZLE_H
#define PUZZLE_H

#define PZ_MAGIC_MIN 2
#define PZ_MAGIC_MAX 9
#define PZ_CHOICES   3
#define PZ_CORRECT   1   /* 選択肢のうち正解のindex */

/* 各位の数字の和(負数は0扱い) */
int pz_digit_sum(int v);
/* 各位の和をくり返して1桁にした値(0は0) */
int pz_digital_root(int v);
/* 数あてマジックの段階: out[0]=n, out[1]=n*9, out[2]=十の位, out[3]=一の位。範囲外は -1 */
int pz_magic9_steps(int n, int out[4]);
/* 最終的な答え(十の位+一の位)。範囲外は -1 */
int pz_magic9_answer(int n);
/* 2〜9すべてで答えが9になるなら1 */
int pz_magic9_always_nine(void);
/* ひらめきの選択肢: 文と、正解判定 */
const char *pz_choice_text(int idx);
int pz_choice_is_correct(int idx);
/* まちがえた回数に応じたヒント(0回→NULL、1回→やさしい、2回以上→強いヒント) */
const char *pz_hint(int wrong_count);
/* ひらめきの評価(星): 間違い0回=3, 1回=2, 2回以上=1。負数は0 */
int pz_stars(int wrong_count);

#endif
