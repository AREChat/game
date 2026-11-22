#include <stdio.h>
#include <string.h>
#include "../source/ch6data.h"
#include "../source/ch6script.h"
static long N = 0, F = 0;
#define CHECK(c) do { N++; if (!(c)) { F++; if (F < 20) printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
static int utf8_ok(const char *s) {
    const unsigned char *p = (const unsigned char *)s;
    while (*p) {
        int n = *p < 0x80 ? 0 : (*p >> 5) == 6 ? 1 : (*p >> 4) == 14 ? 2 : (*p >> 3) == 30 ? 3 : -1;
        if (n < 0) return 0;
        p++;
        while (n--) { if ((*p & 0xC0) != 0x80) return 0; p++; }
    }
    return 1;
}
/* 到達可能な歩けるマス(幅優先) */
static int reach[CH6_H][CH6_W];
static void flood(void) {
    int qx[CH6_W * CH6_H], qy[CH6_W * CH6_H], h = 0, t = 0, d;
    static const int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
    memset(reach, 0, sizeof reach);
    qx[t] = CH6_START_X; qy[t++] = CH6_START_Y; reach[CH6_START_Y][CH6_START_X] = 1;
    while (h < t) {
        int x = qx[h], y = qy[h++];
        for (d = 0; d < 4; d++) {
            int nx = x + dx[d], ny = y + dy[d];
            if (ch6_walkable(nx, ny) && !reach[ny][nx]) { reach[ny][nx] = 1; qx[t] = nx; qy[t++] = ny; }
        }
    }
}
int main(void) {
    int x, y, i, s, l, c;
    unsigned m;
    flood();
    for (y = 0; y < CH6_H; y++) for (x = 0; x < CH6_W; x++) {
        if (x == 0 || y == 0 || x == CH6_W - 1 || y == CH6_H - 1) CHECK(ch6_tile(x, y) == '#');
        CHECK(ch6_walkable(x, y) == (ch6_tile(x, y) != '#' && ch6_tile(x, y) != 'M'));
    }
    CHECK(ch6_tile(-1, 0) == '#'); CHECK(ch6_tile(0, CH6_H) == '#');
    CHECK(ch6_walkable(CH6_START_X, CH6_START_Y));
    for (i = 0; i < CH6_SPOTS; i++) {
        CHECK(ch6_spot_at(ch6_spot_x(i), ch6_spot_y(i)) == i);
        CHECK(reach[ch6_spot_y(i)][ch6_spot_x(i)]);
        CHECK(strlen(ch6_investigate_text(i)) > 0 && utf8_ok(ch6_investigate_text(i)));
    }
    CHECK(ch6_spot_x(-1) == -1 && ch6_spot_y(CH6_SPOTS) == -1);
    CHECK(strcmp(ch6_investigate_text(9), "") == 0);
    CHECK(ch6_tile(ch6_mio_x(), ch6_mio_y()) == 'M');
    CHECK(!ch6_walkable(ch6_mio_x(), ch6_mio_y()));
    CHECK(reach[ch6_mio_y()][ch6_mio_x() - 1] || reach[ch6_mio_y()][ch6_mio_x() + 1]
          || reach[ch6_mio_y() - 1][ch6_mio_x()] || reach[ch6_mio_y() + 1][ch6_mio_x()]);
    CHECK(ch6_exit_at(12, 13) == 1 && reach[13][12]);
    for (i = 0; i < CH6_NPC_N; i++) CHECK(strlen(ch6_npc_text(i)) > 0 && utf8_ok(ch6_npc_text(i)));
    CHECK(strlen(ch6_npc_text(CH6_NPC_N)) == 0);
    for (i = 0; i < CH6_CHOICES; i++) CHECK(strlen(ch6_choice(i)) > 0 && utf8_ok(ch6_choice(i)));
    CHECK(strlen(ch6_choice(-1)) == 0 && strlen(ch6_choice(3)) == 0);
    /* 手がかり: 65536通りの総当たり */
    for (m = 0; m < 65536u; m++) {
        unsigned mm = m;
        int cnt = ch6_count(m), manual = 0;
        for (i = 0; i < CH6_SPOTS; i++) manual += ch6_has(m, i);
        CHECK(cnt == manual);
        CHECK(ch6_ready(m) == (ch6_has(m, 3) && cnt >= 3));
        CHECK(strlen(ch6_hint(m)) > 0 && utf8_ok(ch6_hint(m)));
        for (c = 0; c < 4; c++) {
            int v = ch6_verdict(m, c);
            if (!ch6_ready(m)) CHECK(v == CH6_NOT_READY);
            else CHECK(v == (c == CH6_CORRECT ? CH6_RIGHT : CH6_WRONG));
        }
        for (i = 0; i < 5; i++) { int st = ch6_stars(m, i); CHECK(st >= 1 && st <= 3); }
        CHECK(ch6_add(&mm, 0) == ((m & 1u) ? CH6_DUP : CH6_ADDED));
    }
    { unsigned z = 0; CHECK(ch6_add(&z, -1) == CH6_BAD); CHECK(ch6_add(&z, 4) == CH6_BAD); CHECK(ch6_add(0, 1) == CH6_BAD); CHECK(z == 0); }
    CHECK(ch6_stars(15u, 0) == 3); CHECK(ch6_stars(15u, 1) == 2); CHECK(ch6_stars(15u, 3) == 1); CHECK(ch6_stars(0u, 99) == 1);
    /* 台本 */
    for (s = 0; s < CH6S_SCENES; s++) {
        CHECK(ch6s_len(s) > 0);
        for (l = 0; l < ch6s_len(s); l++) {
            int sp = ch6s_speaker(s, l);
            CHECK(sp >= 0 && sp < CH6S_SPEAKERS);
            CHECK(strlen(ch6s_text(s, l)) > 0 && utf8_ok(ch6s_text(s, l)));
        }
        CHECK(ch6s_speaker(s, -1) == -1 && ch6s_speaker(s, ch6s_len(s)) == -1);
        CHECK(strlen(ch6s_text(s, ch6s_len(s))) == 0);
    }
    CHECK(ch6s_len(-1) == 0 && ch6s_len(CH6S_SCENES) == 0);
    CHECK(strlen(ch6s_speaker_name(CH6S_NARR)) == 0);
    for (i = 1; i < CH6S_SPEAKERS; i++) CHECK(strlen(ch6s_speaker_name(i)) > 0);
    CHECK(strlen(ch6s_speaker_name(-1)) == 0 && strlen(ch6s_speaker_name(99)) == 0);
    CHECK(ch6s_scene_for_verdict(CH6_RIGHT) == CH6S_RIGHT && ch6s_scene_for_verdict(CH6_WRONG) == CH6S_WRONG);
    CHECK(ch6s_scene_for_verdict(CH6_NOT_READY) == -1 && ch6s_scene_for_verdict(7) == -1);
    CHECK(ch6s_next_scene(CH6S_TRAIN) == CH6S_COUNSEL && ch6s_next_scene(CH6S_COUNSEL) == CH6S_CIPHER);
    CHECK(ch6s_next_scene(CH6S_RIGHT) == CH6S_GROW);
    CHECK(ch6s_next_scene(CH6S_CIPHER) == -1 && ch6s_next_scene(CH6S_WRONG) == -1 && ch6s_next_scene(CH6S_GROW) == -1);
    printf("test_ch6: %ld checks, %ld failed\n", N, F);
    return F ? 1 : 0;
}
