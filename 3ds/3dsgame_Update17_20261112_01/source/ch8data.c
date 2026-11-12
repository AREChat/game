#include "ch8data.h"
#include <stddef.h>

static const char *MAP[CH8_H] = {
 "#########################",
 "#.......................#",
 "#.1...##.......##....2..#",
 "#.....##.......##.......#",
 "#.......................#",
 "#.......#########.......#",
 "#.......................#",
 "#...3.......E...........#",
 "#.......................#",
 "#.....##.......##.......#",
 "#.....##.......##...4...#",
 "#.......................#",
 "#.......................#",
 "#...........D...........#",
 "#########################"
};

static const int SPOT_X[CH8_SPOTS] = {2, 21, 4, 20};
static const int SPOT_Y[CH8_SPOTS] = {2, 2, 7, 10};

static const char *SPOT_TEXT[CH8_SPOTS] = {
 "受付の掲示板だ。「今日の試験は 正午から。かならず 考えてから 答えること」と 書いてある。",
 "石板だ。「答えは 一つの ひらめきでは 生まれない。集めた 手がかりを つなぐべし」と きざまれている。",
 "ほかの受験者の メモだ。「勘で 答えた人は みんな 落ちたらしい」と 走り書きが ある。",
 "試験の問題用紙だ。「星影の主は だれか。集めた 手がかりから 筋道を 立てて 答えよ」と ある。"
};

static const char *NPC_TEXT[CH8_NPC_N] = {
 "試験官メルガ「よく 来たな。会場の あちこちを しらべてから、わたしに 声を かけなさい。」",
 "案内人「ここ ルミナリアは 学びの都。ここでは 考える人が いちばん えらいんだよ。」"
};

static const char *HINTS[5] = {
 "まずは 会場前の広場を ぐるっと しらべてみよう。",
 "メルガに 話しかける前に、もう少し 手がかりを あつめよう。",
 "あと少し。試験の問題用紙を 見たかな?",
 "問題用紙を 読んでから、メルガに 話しかけよう。",
 "手がかりは そろった。メルガに 話しかけよう。"
};

static const char *CHOICES[CH8_CHOICES] = {
 "ほかの人に こっそり 答えを 見せてもらう",
 "何も 考えずに 勘で 一つ えらぶ",
 "集めた 手がかりを つないで 筋道を 立てて 答える"
};

char ch8_tile(int x, int y) {
  if (x < 0 || y < 0 || x >= CH8_W || y >= CH8_H) return '#';
  return MAP[y][x];
}
int ch8_walkable(int x, int y) {
  char t = ch8_tile(x, y);
  return t != '#' && t != 'E';
}
int ch8_spot_at(int x, int y) {
  char t = ch8_tile(x, y);
  if (t >= '1' && t <= '4') return t - '1';
  return -1;
}
int ch8_exit_at(int x, int y) { return ch8_tile(x, y) == 'D' ? 1 : 0; }
int ch8_spot_x(int id) { return (id < 0 || id >= CH8_SPOTS) ? -1 : SPOT_X[id]; }
int ch8_spot_y(int id) { return (id < 0 || id >= CH8_SPOTS) ? -1 : SPOT_Y[id]; }
int ch8_examiner_x(void) { return 12; }
int ch8_examiner_y(void) { return 7; }
const char *ch8_investigate_text(int id) {
  return (id < 0 || id >= CH8_SPOTS) ? "" : SPOT_TEXT[id];
}
const char *ch8_npc_text(int i) {
  return (i < 0 || i >= CH8_NPC_N) ? "" : NPC_TEXT[i];
}

int ch8_count(unsigned mask) {
  int n = 0, i;
  for (i = 0; i < CH8_SPOTS; i++) if (mask & (1u << i)) n++;
  return n;
}
int ch8_has(unsigned mask, int id) {
  if (id < 0 || id >= CH8_SPOTS) return 0;
  return (mask >> id) & 1u ? 1 : 0;
}
int ch8_add(unsigned *mask, int id) {
  if (mask == NULL || id < 0 || id >= CH8_SPOTS) return CH8_BAD;
  if (*mask & (1u << id)) return CH8_DUP;
  *mask |= (1u << id);
  return CH8_ADDED;
}
int ch8_ready(unsigned mask) {
  return ch8_has(mask, 3) && ch8_count(mask) >= 3;
}
const char *ch8_hint(unsigned mask) {
  int c = ch8_count(mask);
  if (ch8_ready(mask)) return HINTS[4];
  if (c == 0) return HINTS[0];
  if (!ch8_has(mask, 3) && c >= 3) return HINTS[3];
  if (ch8_has(mask, 3)) return HINTS[2];
  return HINTS[1];
}
const char *ch8_choice(int i) {
  return (i < 0 || i >= CH8_CHOICES) ? "" : CHOICES[i];
}
int ch8_verdict(unsigned mask, int choice) {
  if (!ch8_ready(mask)) return CH8_NOT_READY;
  return choice == CH8_CORRECT ? CH8_RIGHT : CH8_WRONG;
}
int ch8_stars(unsigned mask, int wrong_count) {
  int s = 3;
  if (wrong_count < 0) wrong_count = 0;
  if (ch8_count(mask) < CH8_SPOTS) s--;
  if (wrong_count >= 1) s--;
  if (wrong_count >= 3) s--;
  return s < 1 ? 1 : s;
}
