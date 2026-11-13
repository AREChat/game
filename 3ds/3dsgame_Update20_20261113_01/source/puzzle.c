#include "puzzle.h"
#include <stddef.h>

int pz_digit_sum(int v)
{
    int s = 0;
    if (v < 0) return 0;
    while (v > 0) { s += v % 10; v /= 10; }
    return s;
}

int pz_digital_root(int v)
{
    if (v <= 0) return 0;
    while (v >= 10) v = pz_digit_sum(v);
    return v;
}

int pz_magic9_steps(int n, int out[4])
{
    int m;
    if (n < PZ_MAGIC_MIN || n > PZ_MAGIC_MAX || out == NULL) return -1;
    m = n * 9;
    out[0] = n;
    out[1] = m;
    out[2] = m / 10;
    out[3] = m % 10;
    return 0;
}

int pz_magic9_answer(int n)
{
    int st[4];
    if (pz_magic9_steps(n, st) != 0) return -1;
    return st[2] + st[3];
}

int pz_magic9_always_nine(void)
{
    int n;
    for (n = PZ_MAGIC_MIN; n <= PZ_MAGIC_MAX; n++)
        if (pz_magic9_answer(n) != 9) return 0;
    return 1;
}

static const char *const CHOICES[PZ_CHOICES] = {
    "占い師がこっそり答えを見ている",
    "9の段は、十の位と一の位を足すといつも9になるから",
    "思い浮かべた数が、たまたま同じだったから"
};

const char *pz_choice_text(int idx)
{
    if (idx < 0 || idx >= PZ_CHOICES) return NULL;
    return CHOICES[idx];
}

int pz_choice_is_correct(int idx)
{
    return idx == PZ_CORRECT;
}

const char *pz_hint(int wrong_count)
{
    if (wrong_count <= 0) return NULL;
    if (wrong_count == 1) return "9をかけた答えを、いくつか書き出してみよう。";
    return "9、18、27、36...の十の位と一の位を足してみよう。";
}

int pz_stars(int wrong_count)
{
    if (wrong_count < 0) return 0;
    if (wrong_count == 0) return 3;
    if (wrong_count == 1) return 2;
    return 1;
}
