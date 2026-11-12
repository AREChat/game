#include "clue.h"

static const char *const TEXTS[CL_COUNT] = {
    "台座の裏の あたらしい けずりあと",
    "像が もつ本の ページが まっしろ",
    "会計ちょうに 像の修理代が ない",
    "夜の庭に のこる 荷車のわだち",
    "石工からの 古い手紙"
};
static const char *const CHOICES[CL_CHOICES] = {
    "像は こわれて いたから かたづける",
    "会計係が 像の金ぱくを はがして うった",
    "像は 自分で どこかへ 歩いていった"
};

int cl_has(unsigned mask, int id) {
    if (id < 0 || id >= CL_COUNT) return 0;
    return (int)((mask >> id) & 1u);
}

int cl_add(unsigned *mask, int id) {
    if (id < 0 || id >= CL_COUNT) return CL_BAD;
    if (cl_has(*mask, id)) return CL_DUP;
    *mask |= 1u << id;
    return CL_ADDED;
}

int cl_count(unsigned mask) {
    int n = 0;
    for (int i = 0; i < CL_COUNT; i++) n += cl_has(mask, i);
    return n;
}

int cl_ready(unsigned mask) {
    return (mask & CL_REQUIRED) == CL_REQUIRED && cl_count(mask) >= CL_NEED_TOTAL;
}

int cl_verdict(unsigned mask, int choice) {
    if (!cl_ready(mask)) return CL_NOT_READY;
    return choice == CL_CORRECT ? CL_RIGHT : CL_WRONG;
}

int cl_stars(unsigned mask, int wrong) {
    if (wrong < 0) wrong = 0;
    if (cl_count(mask) == CL_COUNT && wrong == 0) return 3;
    if (cl_ready(mask) && wrong <= 2) return 2;
    return 1;
}

const char *cl_text(int id) { return (id < 0 || id >= CL_COUNT) ? "" : TEXTS[id]; }
const char *cl_choice(int i) { return (i < 0 || i >= CL_CHOICES) ? "" : CHOICES[i]; }

const char *cl_hint(unsigned mask) {
    if (!cl_has(mask, 0)) return "まず 像の台座を しらべてみよう。";
    if (!cl_has(mask, 1)) return "像が もっている ものを よく見てみよう。";
    if (!cl_has(mask, 2)) return "お金の きろくを 見せてもらおう。";
    if (cl_count(mask) < CL_NEED_TOTAL) return "夜の庭か 石工の手紙も たしかめよう。";
    return "手がかりは そろった。いまこそ ひらめきタイム！";
}
