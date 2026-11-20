#include "namemem.h"

static const char *const NAMES[NM_POOL] = {
    "アオバ", "ベル", "チコ", "ドーン", "エマ", "フロル", "グレン", "ハナ"
};

const char *nm_name(int i) { return (i < 0 || i >= NM_POOL) ? "" : NAMES[i]; }

int nm_show_count(int round) {
    if (round < 0) round = 0;
    int n = 3 + round;
    return n > NM_MAX_SHOW ? NM_MAX_SHOW : n;
}

static unsigned next(unsigned *s) { *s = *s * 1664525u + 1013904223u; return *s >> 8; }

int nm_order(unsigned seed, int n, int *out) {
    if (!out || n < 0 || n > NM_POOL) return -1;
    int pool[NM_POOL];
    for (int i = 0; i < NM_POOL; i++) pool[i] = i;
    unsigned s = seed ? seed : 1u;
    for (int i = NM_POOL - 1; i > 0; i--) {
        int j = (int)(next(&s) % (unsigned)(i + 1));
        int t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    for (int i = 0; i < n; i++) out[i] = pool[i];
    return n;
}

int nm_correct(const int *shown, const int *answer, int n) {
    if (!shown || !answer || n < 0 || n > NM_MAX_SHOW) return -1;
    int c = 0;
    for (int i = 0; i < n; i++) if (shown[i] == answer[i]) c++;
    return c;
}

int nm_percent(int correct, int n) {
    if (n <= 0 || correct <= 0) return 0;
    if (correct >= n) return 100;
    return correct * 100 / n;
}

int nm_rank(int percent) {
    if (percent >= 100) return 3;
    if (percent >= 80) return 2;
    if (percent >= 50) return 1;
    return 0;
}
