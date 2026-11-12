#include <stdio.h>
#include "../source/growth.h"
#include "../source/encounter.h"

static int checks = 0, fails = 0;
#define CHECK(c) do { checks++; if (!(c)) { fails++; if (fails < 20) printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

int main(void)
{
    int lv, t, i, k;
    /* growth */
    CHECK(gr_total_for(1) == 0);
    CHECK(gr_need(0) == 0 && gr_need(GR_MAX_LEVEL) == 0 && gr_need(-5) == 0);
    for (lv = 1; lv < GR_MAX_LEVEL; lv++) {
        CHECK(gr_need(lv) > 0);
        if (lv > 1) CHECK(gr_need(lv) > gr_need(lv - 1));
        CHECK(gr_total_for(lv + 1) == gr_total_for(lv) + gr_need(lv));
        CHECK(gr_level_of(gr_total_for(lv)) == lv);
        CHECK(gr_level_of(gr_total_for(lv + 1) - 1) == lv);
    }
    CHECK(gr_total_for(GR_MAX_LEVEL) < GR_MAX_EXP);
    CHECK(gr_level_of(-100) == 1 && gr_level_of(GR_MAX_EXP) == GR_MAX_LEVEL);
    for (t = 0; t <= 20000; t++) {
        int a = gr_level_of(t), b = gr_level_of(t + 1);
        CHECK(a >= 1 && a <= GR_MAX_LEVEL && b >= a && b <= a + 1);
    }
    { int total = 0, up;
      up = gr_add_exp(&total, gr_need(1)); CHECK(up == 1 && gr_level_of(total) == 2);
      up = gr_add_exp(&total, -5); CHECK(up == 0);
      up = gr_add_exp(&total, 100000000); CHECK(total == GR_MAX_EXP && gr_level_of(total) == GR_MAX_LEVEL);
      up = gr_add_exp(&total, 10); CHECK(up == 0 && total == GR_MAX_EXP);
      CHECK(gr_add_exp(0, 5) == 0); }
    for (lv = -2; lv < 40; lv++) {
        int s = gr_stat(20, 15, lv);
        CHECK(s >= 20 && s <= gr_stat(20, 15, GR_MAX_LEVEL));
        CHECK(gr_stat(20, -9, lv) == 20);
    }
    CHECK(gr_stat(20, 15, 11) == 35);
    for (k = 1; k <= 4; k++) {
        for (i = 1; i <= 100; i++) {
            int sh = gr_share(i, k);
            CHECK(sh >= 1 && sh * k >= i && (sh - 1) * k < i);
        }
    }
    CHECK(gr_share(10, 0) == 0 && gr_share(0, 3) == 0 && gr_share(-3, 3) == 0);
    CHECK(gr_level_gap_pct(5, 5) == 100);
    for (i = 1; i <= 30; i++) for (k = 1; k <= 30; k++) {
        int p = gr_level_gap_pct(i, k);
        CHECK(p >= 50 && p <= 150);
        if (i > k) { CHECK(p <= 100); }
        if (i < k) { CHECK(p >= 100); }
    }
    /* encounter */
    { EncState s; int enc = 0, n, steps_since, maxgap = 0;
      enc_init(&s, 0); CHECK(s.seed == 1u && s.since_battle == 0);
      for (n = 0; n < 100000; n++) CHECK(enc_step(&s, 0) == 0);
      enc_init(&s, 12345);
      steps_since = 0;
      for (n = 0; n < 200000; n++) {
          steps_since++;
          if (enc_step(&s, 5)) {
              enc++;
              CHECK(steps_since > ENC_SAFE_STEPS);
              CHECK(steps_since <= ENC_FORCE_STEPS);
              if (steps_since > maxgap) maxgap = steps_since;
              steps_since = 0;
          }
      }
      CHECK(enc > 1000 && maxgap <= ENC_FORCE_STEPS);
      enc_init(&s, 99); n = 0;
      for (i = 0; i < 1000; i++) if (enc_step(&s, 100)) { n++; CHECK(1); }
      CHECK(n == 1000 / (ENC_SAFE_STEPS + 1));
      { EncState a, b; enc_init(&a, 777); enc_init(&b, 777);
        for (i = 0; i < 5000; i++) CHECK(enc_step(&a, 8) == enc_step(&b, 8)); }
      enc_init(&s, 5);
      for (i = 0; i < 1000; i++) { int r = enc_rand(&s, 7); CHECK(r >= 0 && r < 7); }
      CHECK(enc_rand(&s, 0) == 0 && enc_rand(&s, -3) == 0);
      { int w[3] = {0, 5, 0}; int cnt[4] = {0, 0, 0, 0}; int w2[3] = {1, 1, 8};
        for (i = 0; i < 500; i++) CHECK(enc_pick(&s, w, 3) == 1);
        for (i = 0; i < 10000; i++) { int p = enc_pick(&s, w2, 3); CHECK(p >= 0 && p < 3); cnt[p]++; }
        CHECK(cnt[2] > 7000 && cnt[2] < 9000 && cnt[0] > 500 && cnt[1] > 500);
        w[1] = 0; CHECK(enc_pick(&s, w, 3) == -1);
        w[0] = -1; w[1] = 5; CHECK(enc_pick(&s, w, 3) == -1);
        CHECK(enc_pick(&s, 0, 3) == -1 && enc_pick(&s, w2, 0) == -1); }
    }
    printf("growth/encounter: %d checks, %d failures\n", checks, fails);
    return fails ? 1 : 0;
}
