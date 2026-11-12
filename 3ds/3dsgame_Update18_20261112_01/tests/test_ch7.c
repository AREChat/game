#include <stdio.h>
#include <string.h>
#include "../source/ch7data.h"
#include "../source/ch7script.h"
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
static int reach[CH7_H][CH7_W];
static void flood(void) {
 int qx[CH7_W * CH7_H], qy[CH7_W * CH7_H], h = 0, t = 0, d;
 static const int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
 memset(reach, 0, sizeof reach);
 qx[t] = CH7_START_X; qy[t++] = CH7_START_Y; reach[CH7_START_Y][CH7_START_X] = 1;
 while (h < t) {
  int x = qx[h], y = qy[h++];
  for (d = 0; d < 4; d++) {
   int nx = x + dx[d], ny = y + dy[d];
   if (ch7_walkable(nx, ny) && !reach[ny][nx]) { reach[ny][nx] = 1; qx[t] = nx; qy[t++] = ny; }
  }
 }
}
int main(void) {
 int x, y, i, s, l, c, ex = 0, sp[CH7_SPOTS] = {0};
 unsigned m;
 flood();
 for (y = 0; y < CH7_H; y++) for (x = 0; x < CH7_W; x++) {
  char t = ch7_tile(x, y);
  if (x == 0 || y == 0 || x == CH7_W - 1 || y == CH7_H - 1) CHECK(t == '#');
  CHECK(ch7_walkable(x, y) == (t != '#' && t != 'Y'));
  CHECK(t == '#' || t == '.' || t == 'Y' || t == 'D' || (t >= '1' && t <= '4'));
  if (t == 'D') { ex++; CHECK(ch7_exit_at(x, y) == 1); } else CHECK(ch7_exit_at(x, y) == 0);
  if (t >= '1' && t <= '4') sp[t - '1']++;
 }
 CHECK(ex == 1);
 for (i = 0; i < CH7_SPOTS; i++) CHECK(sp[i] == 1);
 CHECK(ch7_tile(-1, 0) == '#'); CHECK(ch7_tile(0, CH7_H) == '#');
 CHECK(ch7_walkable(CH7_START_X, CH7_START_Y));
 for (i = 0; i < CH7_SPOTS; i++) {
  CHECK(ch7_spot_at(ch7_spot_x(i), ch7_spot_y(i)) == i);
  CHECK(reach[ch7_spot_y(i)][ch7_spot_x(i)]);
  CHECK(strlen(ch7_investigate_text(i)) > 0 && utf8_ok(ch7_investigate_text(i)));
 }
 CHECK(ch7_spot_x(-1) == -1 && ch7_spot_y(CH7_SPOTS) == -1);
 CHECK(strcmp(ch7_investigate_text(9), "") == 0);
 CHECK(ch7_tile(ch7_yuno_x(), ch7_yuno_y()) == 'Y');
 CHECK(!ch7_walkable(ch7_yuno_x(), ch7_yuno_y()));
 CHECK(reach[ch7_yuno_y()][ch7_yuno_x() - 1] || reach[ch7_yuno_y()][ch7_yuno_x() + 1]
    || reach[ch7_yuno_y() - 1][ch7_yuno_x()] || reach[ch7_yuno_y() + 1][ch7_yuno_x()]);
 CHECK(ch7_exit_at(12, 13) == 1 && reach[13][12]);
 for (i = 0; i < CH7_NPC_N; i++) CHECK(strlen(ch7_npc_text(i)) > 0 && utf8_ok(ch7_npc_text(i)));
 CHECK(strlen(ch7_npc_text(CH7_NPC_N)) == 0 && strlen(ch7_npc_text(-1)) == 0);
 for (i = 0; i < CH7_CHOICES; i++) CHECK(strlen(ch7_choice(i)) > 0 && utf8_ok(ch7_choice(i)));
 CHECK(strlen(ch7_choice(-1)) == 0 && strlen(ch7_choice(3)) == 0);
 for (m = 0; m < 65536u; m++) {
  unsigned mm = m;
  int cnt = ch7_count(m), manual = 0;
  for (i = 0; i < CH7_SPOTS; i++) manual += ch7_has(m, i);
  CHECK(cnt == manual);
  CHECK(ch7_ready(m) == (ch7_has(m, 3) && cnt >= 3));
  CHECK(strlen(ch7_hint(m)) > 0 && utf8_ok(ch7_hint(m)));
  for (c = 0; c < 4; c++) {
   int v = ch7_verdict(m, c);
   if (!ch7_ready(m)) CHECK(v == CH7_NOT_READY);
   else CHECK(v == (c == CH7_CORRECT ? CH7_RIGHT : CH7_WRONG));
  }
  for (i = 0; i < 5; i++) { int st = ch7_stars(m, i); CHECK(st >= 1 && st <= 3); }
  CHECK(ch7_add(&mm, 0) == ((m & 1u) ? CH7_DUP : CH7_ADDED));
 }
 { unsigned z = 0; CHECK(ch7_add(&z, -1) == CH7_BAD); CHECK(ch7_add(&z, 4) == CH7_BAD); CHECK(ch7_add(0, 1) == CH7_BAD); CHECK(z == 0); }
 CHECK(ch7_stars(15u, 0) == 3); CHECK(ch7_stars(15u, 1) == 2); CHECK(ch7_stars(15u, 3) == 1); CHECK(ch7_stars(0u, 99) == 1);
 for (s = 0; s < CH7S_SCENES; s++) {
  CHECK(ch7s_len(s) > 0);
  for (l = 0; l < ch7s_len(s); l++) {
   int spk = ch7s_speaker(s, l);
   CHECK(spk >= 0 && spk < CH7S_SPEAKERS);
   CHECK(strlen(ch7s_text(s, l)) > 0 && utf8_ok(ch7s_text(s, l)));
  }
  CHECK(ch7s_speaker(s, -1) == -1 && ch7s_speaker(s, ch7s_len(s)) == -1);
  CHECK(strlen(ch7s_text(s, ch7s_len(s))) == 0);
 }
 CHECK(ch7s_len(-1) == 0 && ch7s_len(CH7S_SCENES) == 0);
 CHECK(strlen(ch7s_speaker_name(CH7S_NARR)) == 0);
 for (i = 1; i < CH7S_SPEAKERS; i++) CHECK(strlen(ch7s_speaker_name(i)) > 0);
 CHECK(strlen(ch7s_speaker_name(-1)) == 0 && strlen(ch7s_speaker_name(99)) == 0);
 CHECK(ch7s_scene_for_verdict(CH7_RIGHT) == CH7S_RIGHT && ch7s_scene_for_verdict(CH7_WRONG) == CH7S_WRONG);
 CHECK(ch7s_scene_for_verdict(CH7_NOT_READY) == -1 && ch7s_scene_for_verdict(7) == -1);
 CHECK(ch7s_next_scene(CH7S_MEET) == CH7S_LETTER && ch7s_next_scene(CH7S_LETTER) == CH7S_THINK);
 CHECK(ch7s_next_scene(CH7S_RIGHT) == CH7S_EXAM);
 CHECK(ch7s_next_scene(CH7S_THINK) == -1 && ch7s_next_scene(CH7S_WRONG) == -1 && ch7s_next_scene(CH7S_EXAM) == -1);
 printf("test_ch7: %ld checks, %ld failed\n", N, F);
 return F ? 1 : 0;
}
