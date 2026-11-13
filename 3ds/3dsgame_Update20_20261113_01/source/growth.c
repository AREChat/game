#include "growth.h"

int gr_need(int lv)
{
    if (lv < 1 || lv >= GR_MAX_LEVEL) return 0;
    return 8 + lv * lv * 3 + lv * 4;
}

int gr_total_for(int lv)
{
    int i, sum = 0;
    if (lv > GR_MAX_LEVEL) lv = GR_MAX_LEVEL;
    for (i = 1; i < lv; i++) sum += gr_need(i);
    return sum;
}

int gr_level_of(int total_exp)
{
    int lv = 1;
    if (total_exp < 0) total_exp = 0;
    while (lv < GR_MAX_LEVEL && total_exp >= gr_total_for(lv + 1)) lv++;
    return lv;
}

int gr_add_exp(int *total, int gain)
{
    int before, t;
    if (!total) return 0;
    before = gr_level_of(*total);
    if (gain < 0) gain = 0;
    t = *total;
    if (t < 0) t = 0;
    if (gain > GR_MAX_EXP - t) gain = GR_MAX_EXP - t;
    if (gain < 0) gain = 0;
    t += gain;
    *total = t;
    return gr_level_of(t) - before;
}

int gr_stat(int base, int per10, int lv)
{
    if (lv < 1) lv = 1;
    if (lv > GR_MAX_LEVEL) lv = GR_MAX_LEVEL;
    if (per10 < 0) per10 = 0;
    return base + per10 * (lv - 1) / 10;
}

int gr_share(int exp, int alive)
{
    if (alive <= 0 || exp <= 0) return 0;
    return (exp + alive - 1) / alive;
}

int gr_level_gap_pct(int party_lv, int enemy_lv)
{
    int p = 100 - (party_lv - enemy_lv) * 10;
    if (p < 50) p = 50;
    if (p > 150) p = 150;
    return p;
}
