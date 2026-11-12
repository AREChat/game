#include "ch7data.h"
#include <stddef.h>

static const char *MAP[CH7_H] = {
 "#########################",
 "#.......................#",
 "#.1...##.......##....2..#",
 "#.....##.......##.......#",
 "#.......................#",
 "#.......#########.......#",
 "#.......................#",
 "#...3.......Y...........#",
 "#.......................#",
 "#.....##.......##.......#",
 "#.....##.......##...4...#",
 "#.......................#",
 "#.......................#",
 "#...........D...........#",
 "#########################"
};

static const int SPOT_X[CH7_SPOTS] = {2, 21, 4, 20};
static const int SPOT_Y[CH7_SPOTS] = {2, 2, 7, 10};

static const char *SPOT_TEXT[CH7_SPOTS] = {
 "改札の落とし物箱だ。星の形の封ろうで とじた 白い封筒が 入っている。",
 "駅の時刻表だ。「星影ゆき」の列車だけ、いつも 一番はしに 小さく 書かれている。",
 "郵便箱だ。差出人の名前が ない手紙が、主人公あてに 一通だけ 入っていた。",
 "ユノの手帳だ。「試験の日まで あと少し。ちえを しめす ときが きた」と 書いてある。"
};

static const char *NPC_TEXT[CH7_NPC_N] = {
 "ユノ「ひさしぶり! 駅の あちこちを しらべて、あやしい手紙の ことを おしえてね。」",
 "駅長「この駅では 毎日 たくさんの手紙が 行きかうよ。ていねいに 見てごらん。」"
};

static const char *HINTS[5] = {
 "まずは 駅の広場を ぐるっと しらべてみよう。",
 "ユノに 話しかける前に、もう少し 手がかりを あつめよう。",
 "あと少し。ユノの手帳を 見たかな?",
 "ユノの手帳を 読んでから、ユノに 話しかけよう。",
 "手がかりは そろった。ユノに 話しかけよう。"
};

static const char *CHOICES[CH7_CHOICES] = {
 "あやしい手紙なので すぐに やぶいて すてる",
 "ユノに ぜんぶ まかせて 自分は 何もしない",
 "試験を うけて、自分の ちえで 力を しめす"
};

char ch7_tile(int x, int y) {
 if (x < 0 || y < 0 || x >= CH7_W || y >= CH7_H) return '#';
 return MAP[y][x];
}
int ch7_walkable(int x, int y) {
 char t = ch7_tile(x, y);
 return t != '#' && t != 'Y';
}
int ch7_spot_at(int x, int y) {
 char t = ch7_tile(x, y);
 if (t >= '1' && t <= '4') return t - '1';
 return -1;
}
int ch7_exit_at(int x, int y) { return ch7_tile(x, y) == 'D' ? 1 : 0; }
int ch7_spot_x(int id) { return (id < 0 || id >= CH7_SPOTS) ? -1 : SPOT_X[id]; }
int ch7_spot_y(int id) { return (id < 0 || id >= CH7_SPOTS) ? -1 : SPOT_Y[id]; }
int ch7_yuno_x(void) { return 12; }
int ch7_yuno_y(void) { return 7; }
const char *ch7_investigate_text(int id) {
 return (id < 0 || id >= CH7_SPOTS) ? "" : SPOT_TEXT[id];
}
const char *ch7_npc_text(int i) {
 return (i < 0 || i >= CH7_NPC_N) ? "" : NPC_TEXT[i];
}

int ch7_count(unsigned mask) {
 int n = 0, i;
 for (i = 0; i < CH7_SPOTS; i++) if (mask & (1u << i)) n++;
 return n;
}
int ch7_has(unsigned mask, int id) {
 if (id < 0 || id >= CH7_SPOTS) return 0;
 return (mask >> id) & 1u ? 1 : 0;
}
int ch7_add(unsigned *mask, int id) {
 if (mask == NULL || id < 0 || id >= CH7_SPOTS) return CH7_BAD;
 if (*mask & (1u << id)) return CH7_DUP;
 *mask |= (1u << id);
 return CH7_ADDED;
}
int ch7_ready(unsigned mask) {
 return ch7_has(mask, 3) && ch7_count(mask) >= 3;
}
const char *ch7_hint(unsigned mask) {
 int c = ch7_count(mask);
 if (ch7_ready(mask)) return HINTS[4];
 if (c == 0) return HINTS[0];
 if (!ch7_has(mask, 3) && c >= 3) return HINTS[3];
 if (ch7_has(mask, 3)) return HINTS[2];
 return HINTS[1];
}
const char *ch7_choice(int i) {
 return (i < 0 || i >= CH7_CHOICES) ? "" : CHOICES[i];
}
int ch7_verdict(unsigned mask, int choice) {
 if (!ch7_ready(mask)) return CH7_NOT_READY;
 return choice == CH7_CORRECT ? CH7_RIGHT : CH7_WRONG;
}
int ch7_stars(unsigned mask, int wrong_count) {
 int s = 3;
 if (wrong_count < 0) wrong_count = 0;
 if (ch7_count(mask) < CH7_SPOTS) s--;
 if (wrong_count >= 1) s--;
 if (wrong_count >= 3) s--;
 return s < 1 ? 1 : s;
}
