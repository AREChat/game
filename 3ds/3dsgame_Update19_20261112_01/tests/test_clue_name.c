#include <stdio.h>
#include <string.h>
#include "../source/clue.h"
#include "../source/namemem.h"

static long checks = 0, fails = 0;
#define CHECK(c) do { checks++; if (!(c)) { fails++; if (fails < 20) printf("FAIL %s:%d %s\n", __FILE__, __LINE__, #c); } } while (0)

static int popcnt5(unsigned m) { int n = 0; for (int i = 0; i < 5; i++) n += (m >> i) & 1u; return n; }

static void test_clue(void) {
    /* 0..65535 の全マスクを総当たり */
    for (unsigned m = 0; m < 65536u; m++) {
        CHECK(cl_count(m) == popcnt5(m));
        int ready = ((m & 7u) == 7u) && popcnt5(m) >= 4;
        CHECK(cl_ready(m) == ready);
        for (int c = -1; c <= 3; c++) {
            int v = cl_verdict(m, c);
            if (!ready) CHECK(v == CL_NOT_READY);
            else CHECK(v == (c == 1 ? CL_RIGHT : CL_WRONG));
        }
        for (int w = -1; w <= 4; w++) {
            int s = cl_stars(m, w);
            CHECK(s >= 1 && s <= 3);
            if (popcnt5(m) == 5 && w <= 0) CHECK(s == 3);
            if (!ready) CHECK(s == 1);
        }
        CHECK(cl_hint(m)[0] != 0);
    }
    unsigned m = 0;
    CHECK(cl_add(&m, -1) == CL_BAD);
    CHECK(cl_add(&m, 5) == CL_BAD);
    CHECK(m == 0);
    for (int i = 0; i < 5; i++) { CHECK(cl_add(&m, i) == CL_ADDED); CHECK(cl_add(&m, i) == CL_DUP); }
    CHECK(m == 0x1Fu && cl_ready(m));
    for (int i = 0; i < 5; i++) CHECK(cl_text(i)[0] != 0);
    CHECK(cl_text(-1)[0] == 0 && cl_text(5)[0] == 0);
    for (int i = 0; i < 3; i++) CHECK(cl_choice(i)[0] != 0);
    CHECK(cl_choice(3)[0] == 0 && cl_choice(-1)[0] == 0);
    CHECK(cl_has(0x1Fu, 5) == 0 && cl_has(0x1Fu, -1) == 0);
    /* 進行順のヒント */
    CHECK(strcmp(cl_hint(0), "まず 像の台座を しらべてみよう。") == 0);
    CHECK(strcmp(cl_hint(0x1F), "手がかりは そろった。いまこそ ひらめきタイム！") == 0);
}

static void test_name(void) {
    for (int i = 0; i < NM_POOL; i++) CHECK(nm_name(i)[0] != 0);
    CHECK(nm_name(-1)[0] == 0 && nm_name(NM_POOL)[0] == 0);
    for (int i = 0; i < NM_POOL; i++) for (int j = i + 1; j < NM_POOL; j++) CHECK(strcmp(nm_name(i), nm_name(j)) != 0);
    CHECK(nm_show_count(-5) == 3 && nm_show_count(0) == 3 && nm_show_count(2) == 5);
    CHECK(nm_show_count(5) == 8 && nm_show_count(100) == 8);
    int out[NM_POOL], again[NM_POOL];
    CHECK(nm_order(1, 3, NULL) == -1 && nm_order(1, -1, out) == -1 && nm_order(1, 9, out) == -1);
    CHECK(nm_order(1, 0, out) == 0);
    for (unsigned seed = 0; seed < 20000u; seed++) {
        for (int n = 0; n <= NM_POOL; n += (n < 3 ? 1 : 5)) {
            CHECK(nm_order(seed, n, out) == n);
            CHECK(nm_order(seed, n, again) == n && memcmp(out, again, sizeof(int) * (size_t)n) == 0);
            int seen[NM_POOL] = {0};
            for (int i = 0; i < n; i++) { CHECK(out[i] >= 0 && out[i] < NM_POOL); if (out[i] >= 0 && out[i] < NM_POOL) { CHECK(!seen[out[i]]); seen[out[i]] = 1; } }
        }
        /* 全員並べ替えは順列になる */
        CHECK(nm_order(seed, NM_POOL, out) == NM_POOL);
        int sum = 0; for (int i = 0; i < NM_POOL; i++) sum += out[i];
        CHECK(sum == 28);
    }
    /* seed が違えば並びも変わる(少なくとも複数種類) */
    int differ = 0; int a[NM_POOL], b[NM_POOL];
    nm_order(1, NM_POOL, a);
    for (unsigned s = 2; s < 50; s++) { nm_order(s, NM_POOL, b); if (memcmp(a, b, sizeof(a))) differ++; }
    CHECK(differ > 40);
    int sh[8] = {1,2,3,4,5,6,7,0}, an[8] = {1,2,3,4,5,6,7,0};
    CHECK(nm_correct(sh, an, 8) == 8);
    an[0] = 9; CHECK(nm_correct(sh, an, 8) == 7);
    CHECK(nm_correct(NULL, an, 3) == -1 && nm_correct(sh, NULL, 3) == -1 && nm_correct(sh, an, 9) == -1 && nm_correct(sh, an, -1) == -1);
    CHECK(nm_correct(sh, an, 0) == 0);
    for (int n = -1; n <= 9; n++) for (int c = -2; c <= 10; c++) {
        int p = nm_percent(c, n);
        CHECK(p >= 0 && p <= 100);
        if (n > 0 && c >= n) CHECK(p == 100);
        if (n <= 0 || c <= 0) CHECK(p == 0);
    }
    CHECK(nm_rank(100) == 3 && nm_rank(99) == 2 && nm_rank(80) == 2 && nm_rank(79) == 1 && nm_rank(50) == 1 && nm_rank(49) == 0 && nm_rank(0) == 0);
}

int main(void) {
    test_clue();
    test_name();
    printf("clue/namemem: %ld checks, %ld failures\n", checks, fails);
    return fails ? 1 : 0;
}
