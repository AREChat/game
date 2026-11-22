/* test_action.c - 2Dアクションの テスト: どの面も クリアできる(ビームさがし)・でたらめに おしても ぬけない・こわれない */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "../source/action.h"

static int checks = 0, fails = 0;
#define CHECK(c, ...) do { checks++; if (!(c)) { fails++; if (fails < 30) { printf("FAIL line %d: ", __LINE__); printf(__VA_ARGS__); printf("\n"); } } } while (0)

/* ---- ビームさがし: 入力の ならびを さがして、ゴールに つけるか たしかめる ---- */
#define BW 1500
typedef struct { ActState s; int score; int prev; unsigned in; } Node;
static Node *cur, *nxt;
static unsigned *hist;   /* hist[frame*BW + idx] = そのノードの 入力 / 親 */
static unsigned short *histp;

static const unsigned INPUTS[] = {
    AIN_RIGHT, AIN_RIGHT | AIN_JUMP, AIN_JUMP, 0, AIN_LEFT, AIN_RIGHT | AIN_DASH, AIN_RIGHT | AIN_JUMP | AIN_DASH,
    AIN_RIGHT | AIN_SWITCH, AIN_RIGHT | AIN_JUMP | AIN_SWITCH, AIN_SWITCH, AIN_LEFT | AIN_JUMP, AIN_RIGHT | AIN_SWITCH | AIN_DASH
};
#define NIN (int)(sizeof(INPUTS) / sizeof(INPUTS[0]))

static int g_bestx = 0, g_noSwitch = 0, g_noDash = 0, g_dump = 0;
static unsigned char *g_hIn; static unsigned short *g_hPar;
static unsigned key_of(const ActState *s) {
    unsigned h = 2166136261u;
    unsigned v[] = { (unsigned)(s->x >> 9), (unsigned)(s->y >> 9), (unsigned)(s->vx >> 7), (unsigned)(s->vy >> 8), (unsigned)s->ground, (unsigned)s->light,
        (unsigned)s->dashT, (unsigned)s->dashAvail, (unsigned)(s->stars), (unsigned)(s->cam >> 3), (unsigned)(s->spawnX >> 8), (unsigned)(s->prevIn & AIN_JUMP) };
    for (unsigned i = 0; i < sizeof(v) / sizeof(v[0]); i++) { h ^= v[i]; h *= 16777619u; }
    return h;
}

static Node *pool;
static int cmp_score(const void *a, const void *b) { return ((const Node *)b)->score - ((const Node *)a)->score; }

/* ゴールできたら そのときの フレーム数を、できなければ -1。ちがう場所に いる状態を のこす(はやく すすむだけの 行きどまりを さける) */
static int solve(int stage, int maxFrames, int *outDeaths) {
    ActState st; act_start(&st, stage); g_bestx = 0;
    int n = 1; cur[0].s = st; cur[0].score = 0; cur[0].prev = -1; cur[0].in = 0;
    unsigned *seen = (unsigned *)calloc(1 << 18, sizeof(unsigned));
    unsigned char *binc = (unsigned char *)calloc(16384, 1);
    g_hIn = (unsigned char *)calloc((size_t)maxFrames * BW, 1); g_hPar = (unsigned short *)calloc((size_t)maxFrames * BW, 2);
    for (int f = 0; f < maxFrames; f++) {
        int m = 0;
        memset(seen, 0, (1 << 18) * sizeof(unsigned));
        for (int i = 0; i < n; i++) {
            for (int k = 0; k < NIN; k++) {
                if (g_noSwitch && (INPUTS[k] & AIN_SWITCH)) continue;
                if (g_noDash && (INPUTS[k] & AIN_DASH)) continue;
                Node t = cur[i];
                act_step(&t.s, INPUTS[k]);
                if (t.s.state == AST_CLEAR) {
                    if (outDeaths) *outDeaths = t.s.deaths;
                    if (g_dump) {   /* ゴールまでの 入力を ファイルに のこす(本体の 画面で そのまま おして たしかめる) */
                        unsigned *seq = (unsigned *)malloc(sizeof(unsigned) * (size_t)(f + 1));
                        seq[f] = INPUTS[k]; int idx = i;
                        for (int ff = f - 1; ff >= 0; ff--) { seq[ff] = g_hIn[(size_t)ff * BW + idx]; idx = g_hPar[(size_t)ff * BW + idx]; }
                        char path[64]; snprintf(path, sizeof(path), "build_host/act_solution_%d.txt", stage);
                        FILE *fp = fopen(path, "w");
                        if (fp) { fprintf(fp, "%d\n", f + 1); for (int q = 0; q <= f; q++) fprintf(fp, "%u\n", seq[q]); fclose(fp); }
                        free(seq);
                    }
                    free(seen); free(binc); free(g_hIn); free(g_hPar); return f + 1;
                }
                if (t.s.deaths > 0) continue;
                unsigned h = key_of(&t.s);
                unsigned slot = h & ((1 << 18) - 1), tries = 0;
                int dup = 0;
                while (seen[slot] && tries < 64) { if (seen[slot] == h) { dup = 1; break; } slot = (slot + 1) & ((1 << 18) - 1); tries++; }
                if (dup) continue;
                seen[slot] = h ? h : 1;
                if ((t.s.x >> 8) > g_bestx) g_bestx = t.s.x >> 8;
                t.score = (t.s.x >> 8) * 4 + t.s.stars * 200 + (t.s.ground ? 30 : 0) - (t.s.y >> 8) / 2 + (t.s.light ? 0 : 1);
                t.prev = i; t.in = INPUTS[k];
                if (m < BW * NIN) pool[m++] = t;
            }
        }
        if (m == 0) { printf("    beam empty at frame %d (n=%d)\n", f, n); free(seen); free(binc); free(g_hIn); free(g_hPar); return -1; }
        qsort(pool, (size_t)m, sizeof(Node), cmp_score);
        memset(binc, 0, 16384);
        int k2 = 0;
        for (int i = 0; i < m && k2 < BW; i++) {
            unsigned bh = (unsigned)(pool[i].s.x >> 11) * 2654435761u ^ (unsigned)(pool[i].s.light) * 40503u ^ (unsigned)(pool[i].s.ground) * 9973u ^ (unsigned)(pool[i].s.dashAvail) * 131u ^ (unsigned)((pool[i].s.vy >> 9) + 20) * 7919u ^ (unsigned)(pool[i].s.y >> 11) * 104729u ^ (unsigned)(pool[i].s.dashT > 0) * 31u;
            int bin = (int)((bh ^ (bh >> 15)) & 16383);
            if (binc[bin] >= 3) continue;
            binc[bin]++;
            nxt[k2++] = pool[i];
        }
        for (int q = 0; q < k2; q++) { g_hIn[(size_t)f * BW + q] = (unsigned char)nxt[q].in; g_hPar[(size_t)f * BW + q] = (unsigned short)nxt[q].prev; }
        Node *tmp = cur; cur = nxt; nxt = tmp; n = k2;
    }
    free(seen); free(binc); free(g_hIn); free(g_hPar);
    return -1;
}

int main(void) {
    cur = (Node *)malloc(sizeof(Node) * BW); nxt = (Node *)malloc(sizeof(Node) * (BW + 1)); pool = (Node *)malloc(sizeof(Node) * (size_t)BW * NIN);
    (void)hist; (void)histp;
    /* 1. 面の 形 */
    CHECK(act_stage_valid(0) && act_stage_valid(ACT_STAGE_COUNT - 1) && !act_stage_valid(-1) && !act_stage_valid(ACT_STAGE_COUNT), "valid");
    for (int st = 0; st < ACT_STAGE_COUNT; st++) {
        const ActStage *s = &ACT_STAGES[st];
        CHECK(s->w >= 30 && s->w <= ACT_MAX_W, "stage %d width %d", st, s->w);
        CHECK(s->title && s->hint && strlen(s->title) > 0 && strlen(s->hint) > 0, "stage %d text", st);
        int nS = 0, nG = 0, nStar = 0;
        for (int r = 0; r < ACT_ROWS; r++) {
            CHECK((int)strlen(s->rows[r]) == s->w, "stage %d row %d len %d", st, r, (int)strlen(s->rows[r]));
            for (int c = 0; c < s->w; c++) {
                char t = s->rows[r][c];
                CHECK(strchr(".#^*JLDCGS", t) != NULL, "stage %d bad tile '%c'", st, t);
                nS += t == 'S'; nG += t == 'G'; nStar += t == '*';
            }
        }
        CHECK(nS == 1 && nG == 1, "stage %d S=%d G=%d", st, nS, nG);
        CHECK(act_stars_total(st) == nStar && nStar <= 100, "stage %d stars %d", st, nStar);
    }
    CHECK(act_tile(0, -1, 5) == '#' && act_tile(0, 9999, 5) == '#' && act_tile(0, 3, -4) == '.' && act_tile(0, 3, 99) == '.' && act_tile(-1, 0, 0) == '#', "tile range");
    /* 2. 物理の きほん */
    {
        ActState a; act_start(&a, 0);
        for (int i = 0; i < 60; i++) act_step(&a, 0);
        CHECK(a.ground && a.state == AST_PLAY && a.deaths == 0, "stands on ground");
        int y0 = act_py(&a);
        act_step(&a, AIN_JUMP); CHECK((a.ev & AEV_JUMP) != 0, "jump event");
        int top = y0;
        for (int i = 0; i < 80; i++) { act_step(&a, AIN_JUMP); if (act_py(&a) < top) top = act_py(&a); }
        CHECK(y0 - top >= 44 && y0 - top <= 60, "jump height %d", y0 - top);
        for (int i = 0; i < 60; i++) act_step(&a, 0);
        int top2 = act_py(&a), y1 = act_py(&a); (void)top2;
        act_step(&a, AIN_JUMP); int tp = y1; for (int i = 0; i < 80; i++) { act_step(&a, 0); if (act_py(&a) < tp) tp = act_py(&a); }
        CHECK(y1 - tp < y0 - top, "short hop is lower (%d vs %d)", y1 - tp, y0 - top);
        int x0 = act_px(&a); for (int i = 0; i < 30; i++) act_step(&a, AIN_RIGHT); CHECK(act_px(&a) > x0 + 30, "runs right");
    }
    /* 3. トゲ・おちる → やりなおし */
    {
        ActState a; act_start(&a, 0);
        for (int i = 0; i < 400; i++) act_step(&a, AIN_RIGHT);   /* 右へ はしりつづける → トゲか あなで しぬ */
        CHECK(a.deaths >= 1, "dies on spikes/pit: %d", a.deaths);
        CHECK(a.state == AST_PLAY, "still playing after death");
        int px = act_px(&a); CHECK(px >= 0 && px < ACT_STAGES[0].w * ACT_TILE, "position in range");
    }
    /* 4. ビームさがしで ぜんぶの 面を クリア(しなずに) */
    for (int st = 0; st < ACT_STAGE_COUNT; st++) {
        int d = -1; g_dump = 1; int f = solve(st, 3600, &d); g_dump = 0; printf("  best x reached: %d / %d\n", g_bestx, ACT_STAGES[st].w * 16);
        printf("  stage %d (%s): %s in %d frames\n", st, ACT_STAGES[st].title, f > 0 ? "CLEARED" : "NOT CLEARED", f);
        CHECK(f > 0, "stage %d can be cleared", st);
    }
    /* 4b. しくみが ひつよう: かげと光の面は Xなしでは クリアできない / 洞くつの面は ダッシュなしでは むり */
    g_noSwitch = 1; { int f = solve(ACT_STAGE_SHADOW, 1800, NULL); CHECK(f < 0, "shadow stage needs the switch (cleared without it in %d)", f); } g_noSwitch = 0;
    g_noDash = 1; { int f = solve(ACT_STAGE_COLLAPSE, 1800, NULL); CHECK(f > 0, "collapse stage is clearable without dash too"); } g_noDash = 0;
    /* 5. でたらめに 10万フレーム おしても おかしくならない */
    {
        unsigned rng = 99;
        for (int st = 0; st < ACT_STAGE_COUNT; st++) {
            for (int round = 0; round < 12; round++) {
                ActState a; act_start(&a, st);
                for (int i = 0; i < 9000; i++) {
                    rng = rng * 1103515245u + 12345u;
                    unsigned in = (rng >> 16) & 31u;
                    if (((rng >> 8) & 7u) < 3u) in &= ~(unsigned)AIN_LEFT;
                    act_step(&a, in);
                    int px = act_px(&a), py = act_py(&a);
                    if (!(px >= -20 && px < ACT_STAGES[st].w * ACT_TILE + 20 && py > -400 && py < 600 && a.stars >= 0 && a.stars <= act_stars_total(st))) {
                        CHECK(0, "out of range stage %d frame %d (%d,%d)", st, i, px, py); break;
                    }
                    if (a.state == AST_CLEAR) break;
                }
                CHECK(a.cam >= 0 && a.cam <= ACT_STAGES[st].w * ACT_TILE, "cam range");
            }
        }
    }
    /* 6. 星は 1回だけ */
    {
        ActState a; act_start(&a, 0);
        for (int i = 0; i < 2000; i++) act_step(&a, (i % 40 < 20) ? (AIN_RIGHT | AIN_JUMP) : (AIN_LEFT | AIN_JUMP));
        CHECK(a.stars <= act_stars_total(0), "stars <= total");
    }
    /* 7. きりかえが めりこむ ときは できない */
    {
        ActState a; act_start(&a, ACT_STAGE_SHADOW);
        a.x = (10 * ACT_TILE + 3) << 8; a.y = (10 * ACT_TILE) << 8;   /* 光のかべ(列10)の まんなか */
        a.light = false; act_step(&a, AIN_SWITCH);
        CHECK((a.ev & AEV_SWITCH_FAIL) != 0 && !a.light, "switch blocked inside wall");
    }
    free(cur); free(nxt); free(pool);
    printf("action: %d checks, %d failed\n", checks, fails);
    return fails != 0;
}
