#include "ch3data.h"
#include "clue.h"

static const char *const MAP[CH3_H] = {
    "#########################",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,1,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,..........,,,,,,#",
    "#,,,,,,..........2.,,,,,#",
    "#,,B,,,...SSSS....,,B,,,#",
    "#,,,,,,...SSSS....,,,,,,#",
    "#,,,,,,...SSSS....,,,,,,#",
    "#,,,,,,..3.....,,,,,,,,,#",
    "#,,,,,,,.........,,,,,,,#",
    "#,,B,,,,,,,,,,,,,,4,B,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,5,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,.,,,,,,,,,,#",
    "###########D#############"
};

char ch3_tile(int x, int y) {
    if (x < 0 || y < 0 || x >= CH3_W || y >= CH3_H) return '#';
    return MAP[y][x];
}

int ch3_walkable(int x, int y) {
    char c = ch3_tile(x, y);
    return c != '#' && c != 'S' && c != 'B';
}

int ch3_spot_at(int x, int y) {
    char c = ch3_tile(x, y);
    if (c >= '1' && c <= '5') return c - '1';
    return -1;
}

int ch3_exit_at(int x, int y) { return ch3_tile(x, y) == 'D'; }

int ch3_spot_x(int id) {
    if (id < 0 || id >= CH3_SPOTS) return -1;
    for (int y = 0; y < CH3_H; y++)
        for (int x = 0; x < CH3_W; x++)
            if (ch3_spot_at(x, y) == id) return x;
    return -1;
}

int ch3_spot_y(int id) {
    if (id < 0 || id >= CH3_SPOTS) return -1;
    for (int y = 0; y < CH3_H; y++)
        for (int x = 0; x < CH3_W; x++)
            if (ch3_spot_at(x, y) == id) return y;
    return -1;
}

static const char *const INV[CH3_SPOTS] = {
    "台座の うらに あたらしい けずりあとが ある。さいきん だれかが さわった ようだ。",
    "像の もつ 本を のぞくと…ページが まっしろだ。もとは 金色の もじが あったはずだ。",
    "会計帳を めくった。像の しゅうり代の ページが どこにも ない。",
    "夜の 庭の すみに 荷車の わだちが のこっている。こうもんの 方へ のびている。",
    "石工の ふるい 手紙を ひろった。「像の 金ぱくは はがせる。うる 人も いる」と ある。"
};

const char *ch3_investigate_text(int id) {
    return (id < 0 || id >= CH3_SPOTS) ? "" : INV[id];
}

static const char *const NPC[CH3_NPC_N] = {
    "生徒「勤勉の像が 取りこわされるって ほんと? みんな ふしぎがっているよ。」",
    "先生「像は ずっと 金色に かがやいていたのに、さいきん くすんで 見えるのよ。」",
    "ガイ「手がかりを 集めて、全校の みんなの 前で すいりを 話そう!」",
    "ミオ「あせらなくて いいよ。ひとつずつ 見ていけば きっと つながるから。」"
};

const char *ch3_npc_text(int i) {
    return (i < 0 || i >= CH3_NPC_N) ? "" : NPC[i];
}

const char *ch3_verdict_text(int v) {
    switch (v) {
    case CL_RIGHT:     return "会計係が 像の 金ぱくを はがして 売っていた。お金の ふそくを かくすために…。";
    case CL_WRONG:     return "うーん、それだと 手がかりと あわない。もういちど 考えてみよう。";
    case CL_NOT_READY: return "まだ 手がかりが たりない。庭と 会計室を 調べてみよう。";
    default:           return "";
    }
}
