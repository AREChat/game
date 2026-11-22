/* Update10: 第4章のデータ(ch4data)と台本(ch4script)の単体テスト(game.c非依存) */
#include <stdio.h>
#include <string.h>
#include "../source/ch4data.h"
#include "../source/ch4script.h"

static long g_n = 0, g_fail = 0;
#define CHECK(c) do { g_n++; if (!(c)) { g_fail++; if (g_fail < 20) printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

static int reach[CH4_H][CH4_W];
static void bfs(int sx, int sy) {
    int qx[CH4_W * CH4_H], qy[CH4_W * CH4_H], h = 0, t = 0;
    static const int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
    memset(reach, 0, sizeof reach);
    reach[sy][sx] = 1; qx[t] = sx; qy[t++] = sy;
    while (h < t) {
        int x = qx[h], y = qy[h++];
        for (int d = 0; d < 4; d++) {
            int nx = x + dx[d], ny = y + dy[d];
            if (ch4_walkable(nx, ny) && !reach[ny][nx]) { reach[ny][nx] = 1; qx[t] = nx; qy[t++] = ny; }
        }
    }
}

static int utf8_ok(const char *s) {
    const unsigned char *p = (const unsigned char *)s;
    while (*p) {
        int n;
        if (*p < 0x80) n = 0;
        else if ((*p & 0xE0) == 0xC0) n = 1;
        else if ((*p & 0xF0) == 0xE0) n = 2;
        else if ((*p & 0xF8) == 0xF0) n = 3;
        else return 0;
        p++;
        while (n--) { if ((*p & 0xC0) != 0x80) return 0; p++; }
    }
    return 1;
}

static int contains_any(const char *s, const char *const *words) {
    for (int i = 0; words[i]; i++) if (strstr(s, words[i])) return 1;
    return 0;
}

/* 禁止語(虫・他社作品名)は検査ツールに引っかからないよう16進で書く */
static const char *const banned[] = { "\xe8\x99\xab", "\xe8\x9c\x82", "\xe8\x9d\xb6", "\xe8\x9c\x98\xe8\x9b\x9b", "\xe8\x9f\xbb", "\xe8\x9a\x8a", "\xe8\x9b\xbe",
    "\xe3\x83\x89\xe3\x83\xa9\xe3\x82\xb4\xe3\x83\xb3\xe3\x82\xaf\xe3\x82\xa8\xe3\x82\xb9\xe3\x83\x88", "\xe3\x83\x89\xe3\x83\xa9\xe3\x82\xaf\xe3\x82\xa8", NULL };

static void test_data(void) {
    int exits = 0, rubble = 0, mothers = 0;
    CHECK(ch4_tile(-1, 0) == '#' && ch4_tile(0, -1) == '#' && ch4_tile(CH4_W, 0) == '#' && ch4_tile(0, CH4_H) == '#');
    for (int x = 0; x < CH4_W; x++) CHECK(ch4_tile(x, 0) == '#');
    for (int y = 0; y < CH4_H; y++) { CHECK(ch4_tile(0, y) == '#'); CHECK(ch4_tile(CH4_W - 1, y) == '#'); }
    for (int y = 0; y < CH4_H; y++)
        for (int x = 0; x < CH4_W; x++) {
            char c = ch4_tile(x, y);
            CHECK(c != '\0' && strchr("#.,RMD1234", c) != NULL);
            if (c == 'D') { exits++; CHECK(y == CH4_H - 1); CHECK(ch4_exit_at(x, y)); } else CHECK(!ch4_exit_at(x, y));
            if (c == 'R') rubble++;
            if (c == 'M') mothers++;
            if (c == '#' || c == 'R' || c == 'M') CHECK(!ch4_walkable(x, y)); else CHECK(ch4_walkable(x, y));
        }
    CHECK(exits == 1);
    CHECK(rubble == 15); /* がれきは5x3 */
    CHECK(mothers == 1);
    CHECK(ch4_walkable(CH4_START_X, CH4_START_Y));
    bfs(CH4_START_X, CH4_START_Y);
    for (int y = 0; y < CH4_H; y++)
        for (int x = 0; x < CH4_W; x++)
            if (ch4_walkable(x, y)) CHECK(reach[y][x]); /* 歩ける所はすべて到達可能 */
    /* 母は動かないが、となりの歩けるマスに立てる */
    {
        int mx = ch4_mother_x(), my = ch4_mother_y(), adj = 0;
        CHECK(mx > 0 && my > 0 && ch4_tile(mx, my) == 'M');
        static const int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
        for (int d = 0; d < 4; d++) if (ch4_walkable(mx + dx[d], my + dy[d]) && reach[my + dy[d]][mx + dx[d]]) adj++;
        CHECK(adj >= 2);
    }
    /* スポット: 各IDがちょうど1つ・到達可能・文が違う */
    {
        int cnt[CH4_SPOTS] = {0};
        for (int y = 0; y < CH4_H; y++)
            for (int x = 0; x < CH4_W; x++) { int s = ch4_spot_at(x, y); if (s >= 0) cnt[s]++; }
        for (int i = 0; i < CH4_SPOTS; i++) {
            int x = ch4_spot_x(i), y = ch4_spot_y(i);
            CHECK(cnt[i] == 1);
            CHECK(x > 0 && y > 0 && ch4_spot_at(x, y) == i && reach[y][x]);
            CHECK(strlen(ch4_investigate_text(i)) > 10 && utf8_ok(ch4_investigate_text(i)));
            CHECK(!contains_any(ch4_investigate_text(i), banned));
            for (int j = i + 1; j < CH4_SPOTS; j++) CHECK(strcmp(ch4_investigate_text(i), ch4_investigate_text(j)) != 0);
        }
        CHECK(ch4_spot_x(-1) == -1 && ch4_spot_y(CH4_SPOTS) == -1 && ch4_investigate_text(-1)[0] == 0 && ch4_investigate_text(99)[0] == 0);
        CHECK(ch4_spot_at(-1, -1) == -1 && ch4_spot_at(0, 0) == -1);
    }
    for (int i = 0; i < CH4_NPC_N; i++) { CHECK(strlen(ch4_npc_text(i)) > 10 && utf8_ok(ch4_npc_text(i))); CHECK(!contains_any(ch4_npc_text(i), banned)); }
    CHECK(ch4_npc_text(-1)[0] == 0 && ch4_npc_text(CH4_NPC_N)[0] == 0);
}

static void test_clues(void) {
    /* 手がかりマスク 0..65535 を総当たり */
    for (unsigned m = 0; m < 65536u; m++) {
        int cnt = 0;
        for (int i = 0; i < CH4_SPOTS; i++) cnt += (int)((m >> i) & 1u);
        CHECK(ch4_count(m) == cnt);
        {
            int ready = (((m >> 2) & 1u) != 0) && cnt >= 3;
            CHECK(ch4_ready(m) == ready);
            for (int c = -1; c <= 3; c++) {
                int v = ch4_verdict(m, c);
                if (!ready) CHECK(v == CH4_NOT_READY);
                else CHECK(v == (c == CH4_CORRECT ? CH4_RIGHT : CH4_WRONG));
            }
            for (int w = -2; w <= 4; w++) {
                int s = ch4_stars(m, w);
                CHECK(s >= 1 && s <= 3);
                if (!ready) CHECK(s == 1);
                if (ready && cnt == 4 && w <= 0) CHECK(s == 3);
                if (ready && cnt == 3 && w <= 0) CHECK(s == 2);
            }
        }
        CHECK(ch4_hint(m)[0] != 0 && utf8_ok(ch4_hint(m)));
    }
    /* 追加の結果 */
    {
        unsigned m = 0;
        CHECK(ch4_add(&m, -1) == CH4_BAD && ch4_add(&m, CH4_SPOTS) == CH4_BAD && ch4_add(NULL, 0) == CH4_BAD);
        CHECK(m == 0);
        for (int i = 0; i < CH4_SPOTS; i++) { CHECK(ch4_add(&m, i) == CH4_ADDED); CHECK(ch4_add(&m, i) == CH4_DUP); CHECK(ch4_has(m, i)); }
        CHECK(m == 0xFu && ch4_ready(m));
        CHECK(ch4_has(m, -1) == 0 && ch4_has(m, CH4_SPOTS) == 0);
    }
    /* 4! = 24 通りの調査順: 書き置き(ID2)を含む3つ目までに読めば準備完了。ヒントに従えば必ず準備完了 */
    {
        int orders = 0;
        for (int a = 0; a < 256; a++) {
            int p[4] = { a & 3, (a >> 2) & 3, (a >> 4) & 3, (a >> 6) & 3 };
            int used = 0, ok = 1;
            for (int i = 0; i < 4; i++) { if (used & (1 << p[i])) ok = 0; used |= 1 << p[i]; }
            if (!ok) continue;
            orders++;
            {
                unsigned m = 0;
                for (int i = 0; i < 4; i++) {
                    CHECK(ch4_add(&m, p[i]) == CH4_ADDED);
                    CHECK(ch4_ready(m) == (ch4_has(m, 2) && i + 1 >= 3));
                }
                CHECK(ch4_stars(m, 0) == 3);
                CHECK(ch4_verdict(m, CH4_CORRECT) == CH4_RIGHT);
            }
        }
        CHECK(orders == 24);
    }
    {
        unsigned m = 0; int guard = 0;
        while (!ch4_ready(m) && guard++ < 10) {
            const char *h = ch4_hint(m);
            int id = !ch4_has(m, 2) ? 2 : !ch4_has(m, 3) ? 3 : !ch4_has(m, 1) ? 1 : 0;
            CHECK(h && h[0]);
            ch4_add(&m, id);
        }
        CHECK(ch4_ready(m) && ch4_count(m) == 3);
    }
    /* 説得の言葉 */
    for (int i = 0; i < CH4_CHOICES; i++) { CHECK(strlen(ch4_choice(i)) > 5 && utf8_ok(ch4_choice(i))); CHECK(!contains_any(ch4_choice(i), banned)); }
    CHECK(ch4_choice(-1)[0] == 0 && ch4_choice(CH4_CHOICES)[0] == 0);
    CHECK(strstr(ch4_choice(CH4_CORRECT), "直せる") != NULL);
    for (int i = 0; i < CH4_CHOICES; i++) for (int j = i + 1; j < CH4_CHOICES; j++) CHECK(strcmp(ch4_choice(i), ch4_choice(j)) != 0);
}

static void test_script(void) {
    CHECK(CH4S_SCENES == 5);
    CHECK(ch4s_len(-1) == 0 && ch4s_len(CH4S_SCENES) == 0);
    CHECK(ch4s_speaker(0, -1) == -1 && ch4s_speaker(0, 9999) == -1 && ch4s_speaker(-1, 0) == -1);
    CHECK(strcmp(ch4s_text(0, 9999), "") == 0 && strcmp(ch4s_text(99, 0), "") == 0);
    CHECK(strcmp(ch4s_speaker_name(-1), "") == 0 && strcmp(ch4s_speaker_name(CH4S_SPEAKERS), "") == 0);
    CHECK(strcmp(ch4s_speaker_name(CH4S_NARR), "") == 0);
    CHECK(strcmp(ch4s_speaker_name(CH4S_HERO), "主人公") == 0);
    CHECK(strcmp(ch4s_speaker_name(CH4S_MOTHER), "母") == 0);
    CHECK(strcmp(ch4s_speaker_name(CH4S_FATHER), "父") == 0);
    CHECK(strcmp(ch4s_speaker_name(CH4S_MIO), "ミオ") == 0);
    for (int sp = 1; sp < CH4S_SPEAKERS; sp++) CHECK(ch4s_speaker_name(sp)[0] != 0);
    for (int sc = 0; sc < CH4S_SCENES; sc++) {
        int n = ch4s_len(sc);
        CHECK(n >= 4 && n <= 12);
        for (int i = 0; i < n; i++) {
            int who = ch4s_speaker(sc, i);
            const char *t = ch4s_text(sc, i);
            CHECK(who >= 0 && who < CH4S_SPEAKERS);
            CHECK(t != NULL && t[0] != '\0');
            CHECK(strlen(t) < 200); /* 1行が長すぎない(画面に収まる目安) */
            CHECK(utf8_ok(t));
            CHECK(!contains_any(t, banned));
            CHECK(who == CH4S_NARR || ch4s_speaker_name(who)[0] != 0);
        }
    }
    /* 説得の結果 -> 場面。ch4data.h の定数と対応していること */
    CHECK(ch4s_scene_for_verdict(CH4_RIGHT) == CH4S_RIGHT);
    CHECK(ch4s_scene_for_verdict(CH4_WRONG) == CH4S_WRONG);
    CHECK(ch4s_scene_for_verdict(CH4_NOT_READY) == -1);
    CHECK(ch4s_scene_for_verdict(2) == -1);
    /* 場面のつながり */
    CHECK(ch4s_next_scene(CH4S_ACCIDENT) == CH4S_LEAVE);
    CHECK(ch4s_next_scene(CH4S_RIGHT) == CH4S_NEWSCHOOL);
    CHECK(ch4s_next_scene(CH4S_LEAVE) == -1 && ch4s_next_scene(CH4S_WRONG) == -1 && ch4s_next_scene(CH4S_NEWSCHOOL) == -1);
    CHECK(ch4s_next_scene(-5) == -1 && ch4s_next_scene(99) == -1);
    /* 流れの内容 */
    CHECK(ch4s_speaker(CH4S_ACCIDENT, 0) == CH4S_NARR);
    CHECK(strstr(ch4s_text(CH4S_ACCIDENT, 0), "クロモリ") != NULL);
    CHECK(ch4s_speaker(CH4S_LEAVE, ch4s_len(CH4S_LEAVE) - 1) == CH4S_NARR);
    CHECK(strstr(ch4s_text(CH4S_LEAVE, 2), "頭") != NULL); /* 書き置き */
    CHECK(ch4s_speaker(CH4S_RIGHT, 2) == CH4S_MOTHER);
    CHECK(strstr(ch4s_text(CH4S_RIGHT, 1), "直せる") != NULL);
    CHECK(ch4s_speaker(CH4S_WRONG, ch4s_len(CH4S_WRONG) - 1) == CH4S_NARR);
    CHECK(strstr(ch4s_text(CH4S_WRONG, ch4s_len(CH4S_WRONG) - 1), "調べなおして") != NULL);
    CHECK(strstr(ch4s_text(CH4S_NEWSCHOOL, 5), "名前") != NULL);
    CHECK(ch4s_speaker(CH4S_NEWSCHOOL, 4) == CH4S_MIO);
}

int main(void) {
    test_data();
    test_clues();
    test_script();
    printf("ch4: %ld checks, %ld failed\n", g_n, g_fail);
    return g_fail ? 1 : 0;
}
