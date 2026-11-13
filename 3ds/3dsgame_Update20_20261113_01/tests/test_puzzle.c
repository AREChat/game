/* 数あてマジック(ひらめきタイム)ロジックの単体テスト */
#include <stdio.h>
#include <string.h>
#include "../source/puzzle.h"

static int g_n, g_fail;
#define CHECK(c) do { g_n++; if (!(c)) { g_fail++; printf("FAIL %s:%d %s\n", __FILE__, __LINE__, #c); } } while (0)

int main(void)
{
    int n, v, st[4], i;
    /* digit_sum / digital_root */
    CHECK(pz_digit_sum(0) == 0);
    CHECK(pz_digit_sum(9) == 9);
    CHECK(pz_digit_sum(18) == 9);
    CHECK(pz_digit_sum(999) == 27);
    CHECK(pz_digit_sum(-5) == 0);
    CHECK(pz_digital_root(0) == 0);
    CHECK(pz_digital_root(-3) == 0);
    CHECK(pz_digital_root(999) == 9);
    CHECK(pz_digital_root(38) == 2);
    /* 9の倍数は、各位の和をくり返すと必ず9(0を除く) */
    for (v = 9; v <= 999999; v += 9) CHECK(pz_digital_root(v) == 9);
    /* 数あてマジック: 2〜9 */
    for (n = PZ_MAGIC_MIN; n <= PZ_MAGIC_MAX; n++) {
        CHECK(pz_magic9_steps(n, st) == 0);
        CHECK(st[0] == n);
        CHECK(st[1] == n * 9);
        CHECK(st[2] * 10 + st[3] == st[1]);
        CHECK(st[2] >= 0 && st[2] <= 9 && st[3] >= 0 && st[3] <= 9);
        CHECK(pz_magic9_answer(n) == 9);
    }
    CHECK(pz_magic9_always_nine() == 1);
    /* 範囲外 */
    CHECK(pz_magic9_steps(1, st) == -1);
    CHECK(pz_magic9_steps(10, st) == -1);
    CHECK(pz_magic9_steps(-1, st) == -1);
    CHECK(pz_magic9_steps(5, NULL) == -1);
    CHECK(pz_magic9_answer(0) == -1);
    CHECK(pz_magic9_answer(100) == -1);
    /* 1桁の答え(n=1)は範囲外なので十の位が0になるケースは扱わない */
    /* 選択肢 */
    for (i = 0; i < PZ_CHOICES; i++) {
        CHECK(pz_choice_text(i) != NULL);
        CHECK(strlen(pz_choice_text(i)) > 0);
        CHECK(pz_choice_is_correct(i) == (i == PZ_CORRECT));
    }
    CHECK(pz_choice_text(-1) == NULL);
    CHECK(pz_choice_text(PZ_CHOICES) == NULL);
    CHECK(pz_choice_is_correct(-1) == 0);
    CHECK(pz_choice_is_correct(PZ_CHOICES) == 0);
    /* 正解の文に「9の段」が入っている */
    CHECK(strstr(pz_choice_text(PZ_CORRECT), "9の段") != NULL);
    /* ヒント */
    CHECK(pz_hint(0) == NULL);
    CHECK(pz_hint(-1) == NULL);
    CHECK(pz_hint(1) != NULL);
    CHECK(pz_hint(2) != NULL);
    CHECK(pz_hint(1) != pz_hint(2));
    CHECK(pz_hint(100) == pz_hint(2));
    /* 星 */
    CHECK(pz_stars(0) == 3);
    CHECK(pz_stars(1) == 2);
    CHECK(pz_stars(2) == 1);
    CHECK(pz_stars(50) == 1);
    CHECK(pz_stars(-1) == 0);
    for (i = 0; i < 100; i++) CHECK(pz_stars(i) >= 1 && pz_stars(i) <= 3);

    printf("puzzle: %d checks, %d failed\n", g_n, g_fail);
    return g_fail ? 1 : 0;
}
