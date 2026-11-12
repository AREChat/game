#include "ch6data.h"
#include <stddef.h>

static const char *MAP[CH6_H] = {
    "#########################",
    "#.......................#",
    "#.1...##.......##....2..#",
    "#.....##.......##.......#",
    "#.......................#",
    "#.......#########.......#",
    "#.......................#",
    "#...3.......M...........#",
    "#.......................#",
    "#.....##.......##.......#",
    "#.....##.......##...4...#",
    "#.......................#",
    "#.......................#",
    "#...........D...........#",
    "#########################"
};

static const int SPOT_X[CH6_SPOTS] = {2, 21, 4, 20};
static const int SPOT_Y[CH6_SPOTS] = {2, 2, 7, 10};

static const char *SPOT_TEXT[CH6_SPOTS] = {
    "暗記カードの棚だ。ミオの字で「くりかえし 見るより 思い出す」と書いてある。",
    "ミオの時間割だ。毎日、寝る前の10分が「ふくしゅう」と決めてある。",
    "進路相談のはり紙だ。「得意なことを ひとつ 言えるようにしておこう」とある。",
    "暗号の掲示板だ。言葉の1文字目だけをならべると、別の文になっている。"
};

static const char *NPC_TEXT[CH6_NPC_N] = {
    "ミオ「ここに あるものを しらべて、わたしに おぼえかたを おしえてね。」",
    "ミオ「いっしょに がんばろう。一日ひとつずつ、ふえていくよ。」"
};

static const char *HINTS[5] = {
    "まずは 図書室を ぐるっと しらべてみよう。",
    "ミオに 話しかける前に、もう少し 手がかりを あつめよう。",
    "あと少し。暗号の掲示板を 見たかな?",
    "暗号の掲示板を 読んでから、ミオに 話しかけよう。",
    "手がかりは そろった。ミオに 話しかけよう。"
};

static const char *CHOICES[CH6_CHOICES] = {
    "なんども 書き写して、ひたすら 見つめる",
    "朝まで ねないで 読みつづける",
    "言葉の はじめの 一文字を ならべて、おはなしに する"
};

char ch6_tile(int x, int y) {
    if (x < 0 || y < 0 || x >= CH6_W || y >= CH6_H) return '#';
    return MAP[y][x];
}
int ch6_walkable(int x, int y) {
    char t = ch6_tile(x, y);
    return t != '#' && t != 'M';
}
int ch6_spot_at(int x, int y) {
    char t = ch6_tile(x, y);
    if (t >= '1' && t <= '4') return t - '1';
    return -1;
}
int ch6_exit_at(int x, int y) { return ch6_tile(x, y) == 'D' ? 1 : 0; }
int ch6_spot_x(int id) { return (id < 0 || id >= CH6_SPOTS) ? -1 : SPOT_X[id]; }
int ch6_spot_y(int id) { return (id < 0 || id >= CH6_SPOTS) ? -1 : SPOT_Y[id]; }
int ch6_mio_x(void) { return 12; }
int ch6_mio_y(void) { return 7; }
const char *ch6_investigate_text(int id) {
    return (id < 0 || id >= CH6_SPOTS) ? "" : SPOT_TEXT[id];
}
const char *ch6_npc_text(int i) {
    return (i < 0 || i >= CH6_NPC_N) ? "" : NPC_TEXT[i];
}

int ch6_count(unsigned mask) {
    int n = 0, i;
    for (i = 0; i < CH6_SPOTS; i++) if (mask & (1u << i)) n++;
    return n;
}
int ch6_has(unsigned mask, int id) {
    if (id < 0 || id >= CH6_SPOTS) return 0;
    return (mask >> id) & 1u ? 1 : 0;
}
int ch6_add(unsigned *mask, int id) {
    if (mask == NULL || id < 0 || id >= CH6_SPOTS) return CH6_BAD;
    if (*mask & (1u << id)) return CH6_DUP;
    *mask |= (1u << id);
    return CH6_ADDED;
}
int ch6_ready(unsigned mask) {
    return ch6_has(mask, 3) && ch6_count(mask) >= 3;
}
const char *ch6_hint(unsigned mask) {
    int c = ch6_count(mask);
    if (ch6_ready(mask)) return HINTS[4];
    if (c == 0) return HINTS[0];
    if (!ch6_has(mask, 3) && c >= 3) return HINTS[3];
    if (ch6_has(mask, 3)) return HINTS[2];
    return HINTS[1];
}
const char *ch6_choice(int i) {
    return (i < 0 || i >= CH6_CHOICES) ? "" : CHOICES[i];
}
int ch6_verdict(unsigned mask, int choice) {
    if (!ch6_ready(mask)) return CH6_NOT_READY;
    return choice == CH6_CORRECT ? CH6_RIGHT : CH6_WRONG;
}
int ch6_stars(unsigned mask, int wrong_count) {
    int s = 3;
    if (wrong_count < 0) wrong_count = 0;
    if (ch6_count(mask) < CH6_SPOTS) s--;
    if (wrong_count >= 1) s--;
    if (wrong_count >= 3) s--;
    return s < 1 ? 1 : s;
}
