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
    CHECK(help_is_end(4, fl));
    /* 本文の2ページ目に、いまの目的が入る */
    memset(fl, 0, sizeof(fl)); n = help_lines(1, 1, 0, fl, ln);
    { int found = 0; for (i = 0; i < n; i++) if (ln[i] == help_goal(1, 0, fl)) found = 1; CHECK(found); }
    /* Update25: 目的の場所(area,x,y)。すすみぐあいの順にフラグをたてて、場所が正しくかわっていくか */
    {
        static const int order[] = { -1, F_MET_SERA, F_RIDE_DONE, F_BELL_DONE, F_KINDER_ARRIVED, F_DISPUTE_DONE, F_CH1_DONE,
            F_CH2_START, F_SCHOOL_ENTERED, F_GAI_JOINED, F_CLUE_A, F_CLUE_B, F_PRINCIPAL_DONE, F_CH2_DONE,
            F_CH3_START, F_CH3_C0, F_CH3_C1, F_CH3_C2, F_CH3_C3, F_CH3_C4, F_CH3_DONE,
            F_CH4_START, F_CH4_S2, F_CH4_S3, F_CH4_S1, F_CH4_S0, F_CH4_READY, F_CH4_DONE };
        int k, a, x, y, pa = -1, px = -1, py = -1, changes = 0;
        memset(fl, 0, sizeof(fl));
        for (k = 0; k < (int)(sizeof(order) / sizeof(order[0])); k++) {
            if (order[k] >= 0) fl[order[k]] = 1;
            CHECK(help_goal_info(1, fl, &a, &x, &y) == 1);
            CHECK(a >= 0 && a < AREA_COUNT_ENUM && x >= 0 && x < 25 && y >= 0 && y < 15);
            CHECK(strlen(help_goal(1, 0, fl)) > 0);
            if (a != pa || x != px || y != py) changes++;
            pa = a; px = x; py = y;
        }
        CHECK(changes >= 24);
    }
    printf("help: %d checks, %d failed\n", N, F);
    return F != 0;
}
