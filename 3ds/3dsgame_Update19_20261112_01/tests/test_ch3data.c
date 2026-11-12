#include <stdio.h>
#include <string.h>
#include "../source/ch3data.h"
#include "../source/clue.h"

static int total = 0, fails = 0;
#define CHECK(c) do { total++; if (!(c)) { fails++; printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static int reach[CH3_H][CH3_W];
static void bfs(int sx, int sy) {
    int qx[CH3_W * CH3_H], qy[CH3_W * CH3_H], h = 0, t = 0;
    memset(reach, 0, sizeof reach);
    reach[sy][sx] = 1; qx[t] = sx; qy[t++] = sy;
    while (h < t) {
        int x = qx[h], y = qy[h++];
        static const int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) {
            int nx = x + dx[d], ny = y + dy[d];
            if (ch3_walkable(nx, ny) && !reach[ny][nx]) { reach[ny][nx] = 1; qx[t] = nx; qy[t++] = ny; }
        }
    }
}

static int utf8_ok(const char *s) {
    for (; *s; s++) {
        unsigned char c = (unsigned char)*s;
        if (c < 0x80) continue;
        int n = (c >= 0xF0) ? 3 : (c >= 0xE0) ? 2 : (c >= 0xC0) ? 1 : -1;
        if (n < 0) return 0;
        while (n--) { s++; if (((unsigned char)*s & 0xC0) != 0x80) return 0; }
    }
    return 1;
}

int main(void) {
    /* 範囲外・外周 */
    CHECK(ch3_tile(-1, 0) == '#' && ch3_tile(0, -1) == '#' && ch3_tile(CH3_W, 0) == '#' && ch3_tile(0, CH3_H) == '#');
    for (int x = 0; x < CH3_W; x++) CHECK(ch3_tile(x, 0) == '#');
    for (int y = 0; y < CH3_H; y++) { CHECK(ch3_tile(0, y) == '#'); CHECK(ch3_tile(CH3_W - 1, y) == '#'); }
    int exits = 0, statue = 0;
    for (int y = 0; y < CH3_H; y++)
        for (int x = 0; x < CH3_W; x++) {
            char c = ch3_tile(x, y);
            CHECK(c != '\0' && strchr("#.,SBD12345", c) != NULL);
            if (c == 'D') { exits++; CHECK(y == CH3_H - 1); CHECK(ch3_exit_at(x, y)); } else CHECK(!ch3_exit_at(x, y));
            if (c == 'S') statue++;
            if (c == '#' || c == 'S' || c == 'B') CHECK(!ch3_walkable(x, y)); else CHECK(ch3_walkable(x, y));
        }
    CHECK(exits == 1);
    CHECK(statue == 12);                      /* 像は4x3 */
    /* スタート・到達性 */
    CHECK(ch3_walkable(CH3_START_X, CH3_START_Y));
    bfs(CH3_START_X, CH3_START_Y);
    for (int y = 0; y < CH3_H; y++)
        for (int x = 0; x < CH3_W; x++)
            if (ch3_walkable(x, y)) CHECK(reach[y][x]);   /* 歩ける所はすべて到達可能 */
    /* スポット: 各IDがちょうど1つ */
    int cnt[CH3_SPOTS] = {0};
    for (int y = 0; y < CH3_H; y++)
        for (int x = 0; x < CH3_W; x++) { int s = ch3_spot_at(x, y); if (s >= 0) cnt[s]++; }
    for (int i = 0; i < CH3_SPOTS; i++) {
        CHECK(cnt[i] == 1);
        int x = ch3_spot_x(i), y = ch3_spot_y(i);
        CHECK(x > 0 && y > 0 && ch3_spot_at(x, y) == i && reach[y][x]);
        CHECK(strlen(ch3_investigate_text(i)) > 10 && utf8_ok(ch3_investigate_text(i)));
        CHECK(strcmp(ch3_investigate_text(i), cl_text(i)) != 0);
    }
    CHECK(CH3_SPOTS == CL_COUNT);
    CHECK(ch3_spot_x(-1) == -1 && ch3_spot_y(CH3_SPOTS) == -1 && ch3_investigate_text(-1)[0] == 0 && ch3_investigate_text(99)[0] == 0);
    CHECK(ch3_spot_at(-1, -1) == -1 && ch3_spot_at(0, 0) == -1);
    /* 5!通りの調査順: 必須3つ+合計4つで準備完了、5つで星3 */
    int perm[CH3_SPOTS], used[CH3_SPOTS];
    long orders = 0;
    for (int a = 0; a < 3125; a++) {
        int v = a; memset(used, 0, sizeof used); int ok = 1;
        for (int i = 0; i < CH3_SPOTS; i++) { perm[i] = v % 5; v /= 5; if (used[perm[i]]) ok = 0; used[perm[i]] = 1; }
        if (!ok) continue;
        orders++;
        unsigned mask = 0;
        for (int i = 0; i < CH3_SPOTS; i++) {
            int r = cl_add(&mask, perm[i]);
            CHECK(r == CL_ADDED);
            int n = i + 1;
            int req = ((mask & CL_REQUIRED) == CL_REQUIRED);
            CHECK(cl_ready(mask) == (req && n >= CL_NEED_TOTAL));
        }
        CHECK(cl_stars(mask, 0) == 3);
        CHECK(cl_verdict(mask, CL_CORRECT) == CL_RIGHT);
    }
    CHECK(orders == 120);
    /* ヒント案内に従うと準備完了になる */
    { unsigned m = 0; int guard = 0;
      while (!cl_ready(m) && guard++ < 10) {
          const char *h = cl_hint(m); CHECK(h && h[0]);
          int id = !cl_has(m, 0) ? 0 : !cl_has(m, 1) ? 1 : !cl_has(m, 2) ? 2 : 3;
          cl_add(&m, id);
      }
      CHECK(cl_ready(m)); }
    /* 会話・判定文 */
    for (int i = 0; i < CH3_NPC_N; i++) CHECK(strlen(ch3_npc_text(i)) > 10 && utf8_ok(ch3_npc_text(i)));
    CHECK(ch3_npc_text(-1)[0] == 0 && ch3_npc_text(CH3_NPC_N)[0] == 0);
    CHECK(ch3_verdict_text(CL_RIGHT)[0] && ch3_verdict_text(CL_WRONG)[0] && ch3_verdict_text(CL_NOT_READY)[0]);
    CHECK(strcmp(ch3_verdict_text(CL_RIGHT), ch3_verdict_text(CL_WRONG)) != 0);
    CHECK(ch3_verdict_text(77)[0] == 0);
    printf("ch3data: %d checks, %d failures\n", total, fails);
    return fails ? 1 : 0;
}
