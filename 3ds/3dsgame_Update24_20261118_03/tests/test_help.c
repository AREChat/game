#include <stdio.h>
#include <string.h>
#include "../source/help.h"
#include "../source/ids.h"
static int N = 0, F = 0;
#define CHECK(c) do { N++; if (!(c)) { F++; if (F < 20) printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
/* 全角1文字=3バイト(UTF-8)として文字数をかぞえる(ASCIIは1文字) */
static int nchars(const char *s) { int n = 0; for (; *s; s++) if (((unsigned char)*s & 0xC0) != 0x80) n++; return n; }
int main(void) {
    unsigned char fl[128]; int p, ch, i, n; const char *ln[HELP_MAX_LINES];
    memset(fl, 0, sizeof(fl));
    /* すべてのページ・章で、題と本文が空でなく、1行が長すぎない */
    for (p = 0; p < HELP_PAGES; p++) {
        CHECK(strlen(help_title(p)) > 0);
        for (ch = 0; ch <= 6; ch++) {
            n = help_lines(p, ch, 0, fl, ln);
            CHECK(n > 0 && n <= HELP_MAX_LINES);
            for (i = 0; i < n; i++) CHECK(ln[i] != NULL && nchars(ln[i]) <= 40);
        }
    }
    CHECK(strlen(help_title(-1)) == 0 && strlen(help_title(HELP_PAGES)) == 0);
    /* いまの目的は、どの章・どのフラグでも空にならない。フラグを立てるたびに(順番に)変わる */
    for (ch = 0; ch <= 8; ch++) CHECK(strlen(help_goal(ch, 0, fl)) > 0 && nchars(help_goal(ch, 0, fl)) <= 40);
    CHECK(strlen(help_goal(1, 0, NULL)) > 0);
    {
        const char *g0 = help_goal(1, 0, fl); fl[F_MET_SERA] = 1;
        const char *g1 = help_goal(1, 0, fl); fl[F_RIDE_DONE] = 1;
        const char *g2 = help_goal(1, 0, fl); fl[F_BELL_DONE] = 1;
        const char *g3 = help_goal(1, 0, fl); fl[F_KINDER_ARRIVED] = 1;
        const char *g4 = help_goal(1, 0, fl); fl[F_DISPUTE_DONE] = 1;
        const char *g5 = help_goal(1, 0, fl);
        CHECK(strcmp(g0, g1) && strcmp(g1, g2) && strcmp(g2, g3) && strcmp(g3, g4) && strcmp(g4, g5));
    }
    /* 「ここまで」は第4章をおえたときだけ */
    memset(fl, 0, sizeof(fl));
    CHECK(!help_is_end(4, fl) && !help_is_end(1, fl));
    fl[F_CH4_DONE] = 1;
    CHECK(help_is_end(4, fl) && !help_is_end(3, fl));
    /* 本文の2ページ目に、いまの目的が入る */
    memset(fl, 0, sizeof(fl)); n = help_lines(1, 1, 0, fl, ln);
    { int found = 0; for (i = 0; i < n; i++) if (ln[i] == help_goal(1, 0, fl)) found = 1; CHECK(found); }
    printf("help: %d checks, %d failed\n", N, F);
    return F != 0;
}
