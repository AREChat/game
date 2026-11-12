#include <stdio.h>
#include <string.h>
#include "../source/ch5data.h"
#include "../source/ch5script.h"
static long checks = 0, fails = 0;
#define CHECK(c) do { checks++; if (!(c)) { fails++; printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
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
static int reach[CH5_H][CH5_W];
static void flood(int x, int y) {
    if (x < 0 || y < 0 || x >= CH5_W || y >= CH5_H) return;
    if (reach[y][x] || !ch5_walkable(x, y)) return;
    reach[y][x] = 1;
    flood(x+1,y); flood(x-1,y); flood(x,y+1); flood(x,y-1);
}
int main(void) {
    int x, y, i, spots = 0, exits = 0;
    unsigned m;
    for (y = 0; y < CH5_H; y++) {
        CHECK(strlen("0123456789012345678901234") == CH5_W);
        for (x = 0; x < CH5_W; x++) {
            char t = ch5_tile(x, y);
            if (x == 0 || y == 0 || x == CH5_W-1 || y == CH5_H-1) CHECK(t == '#' || t == 'D');
            if (ch5_spot_at(x, y) >= 0) spots++;
            if (ch5_exit_at(x, y)) exits++;
            CHECK(t != 0);
        }
    }
    CHECK(ch5_tile(-1,0) == '#' && ch5_tile(0,99) == '#');
    CHECK(spots == CH5_SPOTS && exits == 1);
    CHECK(ch5_walkable(CH5_START_X, CH5_START_Y));
    flood(CH5_START_X, CH5_START_Y);
    for (y = 0; y < CH5_H; y++) for (x = 0; x < CH5_W; x++) if (ch5_walkable(x, y)) CHECK(reach[y][x]);
    CHECK(!ch5_walkable(ch5_nurse_x(), ch5_nurse_y()));
    CHECK(ch5_tile(ch5_nurse_x(), ch5_nurse_y()) == 'N');
    for (i = 0; i < CH5_SPOTS; i++) {
        CHECK(ch5_spot_at(ch5_spot_x(i), ch5_spot_y(i)) == i);
        CHECK(ch5_investigate_text(i)[0] != 0 && utf8_ok(ch5_investigate_text(i)));
    }
    CHECK(ch5_spot_x(-1) == -1 && ch5_spot_y(9) == -1 && ch5_investigate_text(9)[0] == 0);
    for (i = 0; i < CH5_NPC_N; i++) CHECK(ch5_npc_text(i)[0] && utf8_ok(ch5_npc_text(i)));
    CHECK(ch5_npc_text(7)[0] == 0);
    for (m = 0; m < 65536u; m++) {
        int c = ch5_count(m), r = ch5_ready(m), v, k;
        CHECK(ch5_hint(m)[0] != 0 && utf8_ok(ch5_hint(m)));
        CHECK(r == (ch5_has(m, 1) && c >= 3));
        for (k = 0; k < CH5_CHOICES; k++) {
            v = ch5_verdict(m, k);
            if (!r) CHECK(v == CH5_NOT_READY);
            else CHECK(v == (k == CH5_CORRECT ? CH5_RIGHT : CH5_WRONG));
        }
        CHECK(ch5_verdict(m, -1) == CH5_NOT_READY && ch5_verdict(m, 3) == CH5_NOT_READY);
    }
    for (i = 0; i < CH5_CHOICES; i++) CHECK(ch5_choice(i)[0] && utf8_ok(ch5_choice(i)));
    CHECK(ch5_choice(5)[0] == 0);
    { unsigned a = 0; CHECK(ch5_add(&a, 2) == CH5_ADDED && ch5_add(&a, 2) == CH5_DUP && ch5_add(&a, 9) == CH5_BAD && ch5_add(0, 1) == CH5_BAD); }
    /* ヒントに従えば準備完了 */
    { unsigned a = 0; int n = 0;
      while (!ch5_ready(a) && n < 10) { for (i = 0; i < CH5_SPOTS; i++) if (!ch5_has(a, i)) break; 
        /* ヒントの指す先: まずID1、あとは番号順 */
        if (!ch5_has(a, 1)) ch5_add(&a, 1); else ch5_add(&a, i); n++; }
      CHECK(ch5_ready(a) && n <= 3); }
    for (i = 0; i < 6; i++) { CHECK(ch5_stars(15u, i) >= 1 && ch5_stars(15u, i) <= 3); }
    CHECK(ch5_stars(15u, 0) == 3 && ch5_stars(15u, 9) == 1);
    /* スクリプト */
    for (i = 0; i < CH5S_SCENES; i++) {
        int l;
        CHECK(ch5s_len(i) > 0);
        for (l = 0; l < ch5s_len(i); l++) {
            int sp = ch5s_speaker(i, l);
            CHECK(sp >= 0 && sp < CH5S_SPEAKERS && ch5s_text(i, l)[0] && utf8_ok(ch5s_text(i, l)));
            if (sp != CH5S_NARR) CHECK(ch5s_speaker_name(sp)[0]);
        }
        CHECK(ch5s_text(i, ch5s_len(i))[0] == 0 && ch5s_speaker(i, -1) == -1);
    }
    CHECK(ch5s_len(-1) == 0 && ch5s_len(99) == 0 && ch5s_speaker_name(0)[0] == 0 && ch5s_speaker_name(99)[0] == 0);
    CHECK(ch5s_scene_for_verdict(1) == CH5S_RIGHT && ch5s_scene_for_verdict(0) == CH5S_WRONG && ch5s_scene_for_verdict(-1) == -1);
    CHECK(ch5s_next_scene(CH5S_NECK) == CH5S_LAST && ch5s_next_scene(CH5S_LAST) == CH5S_FESTIVAL && ch5s_next_scene(CH5S_FESTIVAL) == -1);
    CHECK(ch5s_next_scene(CH5S_RIGHT) == CH5S_RECOVER && ch5s_next_scene(CH5S_WRONG) == -1 && ch5s_next_scene(CH5S_RECOVER) == -1);
    printf("ch5: %ld checks, %ld fails\n", checks, fails);
    return fails ? 1 : 0;
}
