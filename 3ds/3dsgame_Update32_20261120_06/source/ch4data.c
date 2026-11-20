#include "ch4data.h"

static const char *const MAP[CH4_H] = {
    "#########################",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,1,,,,,,,,,,,,,,,,,,#",
    "#,,,,,RRRRR,,,,,,,,,,,,,#",
    "#,,,,,RRRRR,,,,,,,,,M,,,#",
    "#,,,,,RRRRR,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,3................,,,#",
    "#,,,,,,,,,,,.,,,,,,,,,,,#",
    "#,,,,,,,,,,,.,2,,,,,,,,,#",
    "#,,,,,,,,,,,.,,,,,,,4,,,#",
    "#,,,,,,,,,,,.,,,,,,,,,,,#",
    "#,,,,,,,,,,,.,,,,,,,,,,,#",
    "#,,,,,,,,,,,.,,,,,,,,,,,#",
    "############D############"
};

char ch4_tile(int x, int y) {
    if (x < 0 || y < 0 || x >= CH4_W || y >= CH4_H) return '#';
    return MAP[y][x];
}

int ch4_walkable(int x, int y) {
    char c = ch4_tile(x, y);
    return c != '#' && c != 'R' && c != 'M';
}

int ch4_spot_at(int x, int y) {
    char c = ch4_tile(x, y);
    if (c >= '1' && c <= '4') return c - '1';
    return -1;
}

int ch4_exit_at(int x, int y) { return ch4_tile(x, y) == 'D'; }

int ch4_spot_x(int id) {
    if (id < 0 || id >= CH4_SPOTS) return -1;
    for (int y = 0; y < CH4_H; y++)
        for (int x = 0; x < CH4_W; x++)
            if (ch4_spot_at(x, y) == id) return x;
    return -1;
}

int ch4_spot_y(int id) {
    if (id < 0 || id >= CH4_SPOTS) return -1;
    for (int y = 0; y < CH4_H; y++)
        for (int x = 0; x < CH4_W; x++)
            if (ch4_spot_at(x, y) == id) return y;
    return -1;
}

int ch4_mother_x(void) {
    for (int y = 0; y < CH4_H; y++)
        for (int x = 0; x < CH4_W; x++)
            if (ch4_tile(x, y) == 'M') return x;
    return -1;
}

int ch4_mother_y(void) {
    for (int y = 0; y < CH4_H; y++)
        for (int x = 0; x < CH4_W; x++)
            if (ch4_tile(x, y) == 'M') return y;
    return -1;
}

static const char *const INV[CH4_SPOTS] = {
    "くずれた 柱の 下に、母の ぼうしが ひっかかっている。",
    "庭の 土の 上に、小さな 足あとが 山道の 方へ のびている。",
    "机の 上に 書き置きが ある。「少し 頭を ひやしてきます」と 書いてある。",
    "山道の 入口で かごを 見つけた。中には 主人公の 好きな おにぎりが 入っていた。"
};

const char *ch4_investigate_text(int id) {
    return (id < 0 || id >= CH4_SPOTS) ? "" : INV[id];
}

static const char *const NPC[CH4_NPC_N] = {
    "村の人「ゆうべの 嵐は ひどかった。あの家は 土が くずれやすい 場所なんだよ。」",
    "村の人「お母さんなら、あさ はやく 山道の 方へ 歩いて いったよ。」",
    "村の人「家は 村の みんなで 直せる。ひとりで かかえこまなくて いいんだよ。」"
};

const char *ch4_npc_text(int i) {
    return (i < 0 || i >= CH4_NPC_N) ? "" : NPC[i];
}

int ch4_count(unsigned mask) {
    int n = 0;
    for (int i = 0; i < CH4_SPOTS; i++) n += (int)((mask >> i) & 1u);
    return n;
}

int ch4_has(unsigned mask, int id) {
    if (id < 0 || id >= CH4_SPOTS) return 0;
    return (int)((mask >> id) & 1u);
}

int ch4_add(unsigned *mask, int id) {
    if (!mask || id < 0 || id >= CH4_SPOTS) return CH4_BAD;
    if (ch4_has(*mask, id)) return CH4_DUP;
    *mask |= (1u << id);
    return CH4_ADDED;
}

int ch4_ready(unsigned mask) {
    return ch4_has(mask, 2) && ch4_count(mask) >= 3;
}

const char *ch4_hint(unsigned mask) {
    if (ch4_ready(mask)) return "母さんの いる 場所が わかった。説得に いこう！";
    if (!ch4_has(mask, 2)) return "まず 家の 机の 上を しらべてみよう。";
    if (!ch4_has(mask, 3)) return "山道の 入口に 行ってみよう。";
    if (!ch4_has(mask, 1)) return "庭の 足あとを おいかけてみよう。";
    return "くずれた 柱の まわりも 見てみよう。";
}

static const char *const CHOICES[CH4_CHOICES] = {
    "ぼくが わるいんだ。ぜんぶ ぼくの せいだ",
    "家は 直せるよ。みんなで いっしょに 住める 場所を つくろう",
    "もう 家の ことは しらない"
};

const char *ch4_choice(int i) {
    return (i < 0 || i >= CH4_CHOICES) ? "" : CHOICES[i];
}

int ch4_verdict(unsigned mask, int choice) {
    if (!ch4_ready(mask)) return CH4_NOT_READY;
    return choice == CH4_CORRECT ? CH4_RIGHT : CH4_WRONG;
}

int ch4_stars(unsigned mask, int wrong_count) {
    int s = (ch4_count(mask) >= 4) ? 3 : 2;
    if (!ch4_ready(mask)) return 1;
    if (wrong_count > 0) s -= wrong_count;
    if (s < 1) s = 1;
    if (s > 3) s = 3;
    return s;
}
