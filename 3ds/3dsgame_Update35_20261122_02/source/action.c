#include "action.h"
#include <string.h>

#define RUN_V 512
#define ACC_GROUND 96
#define ACC_AIR 56
#define GRAV 77
#define MAX_FALL (9 * 256)
#define JUMP_V (-1434)
#define CUT_V (-512)
#define SPRING_V (-2176)
#define DASH_V 1024
#define DASH_FRAMES 9
#define MAX_STARS 128

static short g_starIdx[ACT_STAGE_COUNT][ACT_ROWS][ACT_MAX_W];
static int g_starCnt[ACT_STAGE_COUNT];
static bool g_inited = false;

static int fdiv(int a, int b) { return a >= 0 ? a / b : -((-a + b - 1) / b); }

int act_stage_valid(int stage) { return stage >= 0 && stage < ACT_STAGE_COUNT; }

char act_tile(int stage, int tx, int ty) {
    if (!act_stage_valid(stage)) return '#';
    const ActStage *s = &ACT_STAGES[stage];
    if (tx < 0 || tx >= s->w) return '#';
    if (ty < 0 || ty >= ACT_ROWS) return '.';
    return s->rows[ty][tx];
}

static void init_tables(void) {
    if (g_inited) return;
    memset(g_starIdx, -1, sizeof(g_starIdx));
    for (int st = 0; st < ACT_STAGE_COUNT; st++) {
        int n = 0;
        for (int x = 0; x < ACT_STAGES[st].w; x++)
            for (int y = 0; y < ACT_ROWS; y++)
                if (act_tile(st, x, y) == '*') g_starIdx[st][y][x] = (short)n++;
        g_starCnt[st] = n;
    }
    g_inited = true;
}

int act_stars_total(int stage) { init_tables(); return act_stage_valid(stage) ? g_starCnt[stage] : 0; }

bool act_star_taken(const ActState *a, int tx, int ty) {
    init_tables();
    if (!act_stage_valid(a->stage) || tx < 0 || ty < 0 || tx >= ACT_STAGES[a->stage].w || ty >= ACT_ROWS) return false;
    int i = g_starIdx[a->stage][ty][tx];
    if (i < 0 || i >= MAX_STARS) return false;
    return (a->starMask[i / 64] >> (i % 64)) & 1ull;
}

int act_px(const ActState *a) { return a->x >> 8; }
int act_py(const ActState *a) { return a->y >> 8; }

static bool solid_tile(const ActState *a, int tx, int ty, bool light) {
    char c = act_tile(a->stage, tx, ty);
    return c == '#' || c == 'J' || (c == 'L' && light) || (c == 'D' && !light);
}

static bool box_solid(const ActState *a, int px, int py, bool light) {
    int tx0 = fdiv(px, ACT_TILE), tx1 = fdiv(px + ACT_PW - 1, ACT_TILE);
    int ty0 = fdiv(py, ACT_TILE), ty1 = fdiv(py + ACT_PH - 1, ACT_TILE);
    for (int ty = ty0; ty <= ty1; ty++)
        for (int tx = tx0; tx <= tx1; tx++)
            if (solid_tile(a, tx, ty, light)) return true;
    return false;
}

/* 1ピクセルずつ うごかす。ぶつかったら true(その位置で とまる)。ループは 最大 15回ほど */
static bool move_axis(ActState *a, int axis, int v) {
    int *pos = axis ? &a->y : &a->x;
    int target = *pos + v;
    int cur = *pos >> 8, tp = target >> 8, n = 0;
    while (cur != tp && n++ < 64) {
        int nx = cur + (tp > cur ? 1 : -1);
        bool hit = axis ? box_solid(a, a->x >> 8, nx, a->light) : box_solid(a, nx, a->y >> 8, a->light);
        if (hit) { *pos = cur << 8; return true; }
        cur = nx;
    }
    *pos = target;
    return false;
}

static void respawn(ActState *a) {
    ActStage const *s = &ACT_STAGES[a->stage];
    a->x = a->spawnX; a->y = a->spawnY; a->vx = a->vy = 0;
    a->dashT = 0; a->dashAvail = true; a->invuln = 60; a->coyote = 0; a->jbuf = 0; a->ground = false;
    if (s->autoscroll) {
        int max = s->w * ACT_TILE - ACT_VIEW_W; if (max < 0) max = 0;
        int c = (a->x >> 8) - 120; if (c < 0) c = 0; if (c > max) c = max;
        a->cam = c; a->startDelay = 60;
    }
}

static void die(ActState *a) { a->ev |= AEV_DIE; a->deaths++; respawn(a); }

void act_start(ActState *a, int stage) {
    init_tables();
    memset(a, 0, sizeof(*a));
    if (!act_stage_valid(stage)) stage = 0;
    a->stage = stage; a->face = 1; a->light = true; a->dashAvail = true;
    const ActStage *s = &ACT_STAGES[stage];
    int sx = 2, sy = 12;
    for (int y = 0; y < ACT_ROWS; y++) for (int x = 0; x < s->w; x++) if (act_tile(stage, x, y) == 'S') { sx = x; sy = y; }
    a->spawnX = (sx * ACT_TILE + (ACT_TILE - ACT_PW) / 2) << 8;
    a->spawnY = (sy * ACT_TILE + (ACT_TILE - ACT_PH)) << 8;
    a->state = AST_PLAY;
    respawn(a);
    a->invuln = 0; a->startDelay = s->autoscroll ? 90 : 0;
    if (!s->autoscroll) a->cam = 0;
}

static void touch_tiles(ActState *a) {
    int px = a->x >> 8, py = a->y >> 8;
    int tx0 = fdiv(px, ACT_TILE), tx1 = fdiv(px + ACT_PW - 1, ACT_TILE);
    int ty0 = fdiv(py, ACT_TILE), ty1 = fdiv(py + ACT_PH - 1, ACT_TILE);
    for (int ty = ty0; ty <= ty1; ty++) for (int tx = tx0; tx <= tx1; tx++) {
        char c = act_tile(a->stage, tx, ty);
        if (c == '*') {
            int i = (tx >= 0 && tx < ACT_MAX_W && ty >= 0 && ty < ACT_ROWS) ? g_starIdx[a->stage][ty][tx] : -1;
            if (i >= 0 && i < MAX_STARS) {
                if (!((a->starMask[i / 64] >> (i % 64)) & 1ull)) { a->starMask[i / 64] |= 1ull << (i % 64); a->stars++; a->ev |= AEV_STAR; }
            }
        } else if (c == 'C') {
            int sx = (tx * ACT_TILE + (ACT_TILE - ACT_PW) / 2) << 8, sy = (ty * ACT_TILE + (ACT_TILE - ACT_PH)) << 8;
            if (sx != a->spawnX || sy != a->spawnY) { a->spawnX = sx; a->spawnY = sy; a->ev |= AEV_CHECK; }
        } else if (c == 'G') {
            a->state = AST_CLEAR; a->ev |= AEV_CLEAR;
        }
    }
}

static bool touching_spike(const ActState *a) {
    int px = (a->x >> 8) + 2, py = (a->y >> 8) + 3, w = ACT_PW - 4, h = ACT_PH - 5;
    int tx0 = fdiv(px, ACT_TILE), tx1 = fdiv(px + w - 1, ACT_TILE);
    int ty0 = fdiv(py, ACT_TILE), ty1 = fdiv(py + h - 1, ACT_TILE);
    for (int ty = ty0; ty <= ty1; ty++) for (int tx = tx0; tx <= tx1; tx++) if (act_tile(a->stage, tx, ty) == '^') return true;
    return false;
}

void act_step(ActState *a, unsigned in) {
    a->ev = 0;
    if (!act_stage_valid(a->stage)) return;
    const ActStage *s = &ACT_STAGES[a->stage];
    if (a->state == AST_CLEAR) { a->prevIn = in; return; }
    a->frame++;
    bool jumpPress = (in & AIN_JUMP) && !(a->prevIn & AIN_JUMP);
    bool dashPress = (in & AIN_DASH) && !(a->prevIn & AIN_DASH);
    bool switchPress = (in & AIN_SWITCH) && !(a->prevIn & AIN_SWITCH);
    a->prevIn = in;
    if (a->invuln > 0) a->invuln--;

    if (switchPress && s->useSwitch) {
        bool nl = !a->light;
        if (box_solid(a, a->x >> 8, a->y >> 8, nl)) a->ev |= AEV_SWITCH_FAIL;
        else { a->light = nl; a->ev |= AEV_SWITCH; }
    }
    int dir = ((in & AIN_RIGHT) ? 1 : 0) - ((in & AIN_LEFT) ? 1 : 0);
    if (dir) a->face = dir;

    if (dashPress && s->useDash && a->dashAvail && a->dashT == 0) { a->dashT = DASH_FRAMES; a->dashAvail = false; a->ev |= AEV_DASH; }
    if (a->dashT > 0) { a->dashT--; a->vx = a->face * DASH_V; a->vy = 0; }
    else {
        int target = dir * RUN_V, acc = a->ground ? ACC_GROUND : ACC_AIR;
        if (a->vx < target) { a->vx += acc; if (a->vx > target) a->vx = target; }
        else if (a->vx > target) { a->vx -= acc; if (a->vx < target) a->vx = target; }
    }

    if (a->ground) a->coyote = 6; else if (a->coyote > 0) a->coyote--;
    if (jumpPress) a->jbuf = 6; else if (a->jbuf > 0) a->jbuf--;
    if (a->jbuf > 0 && a->coyote > 0 && a->dashT == 0) { a->vy = JUMP_V; a->ground = false; a->coyote = 0; a->jbuf = 0; a->ev |= AEV_JUMP; }
    if (!(in & AIN_JUMP) && a->vy < CUT_V && a->dashT == 0) a->vy = CUT_V;
    if (a->dashT == 0) { a->vy += GRAV; if (a->vy > MAX_FALL) a->vy = MAX_FALL; }

    if (move_axis(a, 0, a->vx)) a->vx = 0;
    bool wasGround = a->ground;
    a->ground = false;
    bool hitY = move_axis(a, 1, a->vy);
    if (hitY) {
        if (a->vy > 0) {
            a->ground = true;
            int py = a->y >> 8, px = a->x >> 8;
            int ty = fdiv(py + ACT_PH, ACT_TILE);
            int tx0 = fdiv(px, ACT_TILE), tx1 = fdiv(px + ACT_PW - 1, ACT_TILE);
            bool spring = false;
            for (int tx = tx0; tx <= tx1; tx++) if (act_tile(a->stage, tx, ty) == 'J') spring = true;
            if (spring) { a->vy = SPRING_V; a->ground = false; a->ev |= AEV_SPRING; }
            else { a->vy = 0; a->dashAvail = true; if (!wasGround) a->ev |= AEV_LAND; }
        } else a->vy = 0;
    }

    /* 自動スクロール / カメラ */
    int maxcam = s->w * ACT_TILE - ACT_VIEW_W; if (maxcam < 0) maxcam = 0;
    if (s->autoscroll) {
        if (a->startDelay > 0) a->startDelay--;
        else if (a->cam < maxcam) a->cam++;
        if ((a->x >> 8) < a->cam) {
            a->x = a->cam << 8;
            if (box_solid(a, a->x >> 8, a->y >> 8, a->light)) { die(a); return; }
        }
    } else {
        int target = (a->x >> 8) + ACT_PW / 2 - ACT_VIEW_W / 2;
        if (target < 0) target = 0;
        if (target > maxcam) target = maxcam;
        a->cam += (target - a->cam) / 5; if (a->cam < 0) a->cam = 0; if (a->cam > maxcam) a->cam = maxcam;
        if (target != a->cam && (target - a->cam) / 5 == 0) a->cam += (target > a->cam) ? 1 : -1;
    }

    if ((a->y >> 8) > ACT_ROWS * ACT_TILE + 20) { die(a); return; }
    if (a->invuln == 0 && touching_spike(a)) { die(a); return; }
    touch_tiles(a);
}
