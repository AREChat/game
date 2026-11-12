#include "encounter.h"

void enc_init(EncState *s, unsigned seed)
{
    s->seed = seed ? seed : 1u;
    s->since_battle = 0;
}

static unsigned next(EncState *s)
{
    s->seed = s->seed * 1103515245u + 12345u;
    return (s->seed >> 8) & 0xFFFFFFu;
}

int enc_rand(EncState *s, int n)
{
    if (n <= 0) return 0;
    return (int)(next(s) % (unsigned)n);
}

int enc_step(EncState *s, int rate)
{
    int hit;
    if (rate <= 0) { if (s->since_battle < 1000000) s->since_battle++; return 0; }
    if (s->since_battle < 1000000) s->since_battle++;
    if (s->since_battle <= ENC_SAFE_STEPS) return 0;
    hit = (s->since_battle >= ENC_FORCE_STEPS) || (enc_rand(s, 100) < rate);
    if (hit) { s->since_battle = 0; return 1; }
    return 0;
}

int enc_pick(EncState *s, const int *weights, int cnt)
{
    int i, sum = 0, r;
    if (!weights || cnt <= 0) return -1;
    for (i = 0; i < cnt; i++) {
        if (weights[i] < 0) return -1;
        sum += weights[i];
    }
    if (sum <= 0) return -1;
    r = enc_rand(s, sum);
    for (i = 0; i < cnt; i++) {
        if (r < weights[i]) return i;
        r -= weights[i];
    }
    return -1;
}
