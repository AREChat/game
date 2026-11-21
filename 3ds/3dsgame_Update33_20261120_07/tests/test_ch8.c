#include <stdio.h>
#include <string.h>
#include "../source/ch8data.h"
#include "../source/ch8script.h"
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
static int reach[CH8_H][CH8_W];
static void flood(void) {
  int qx[CH8_W * CH8_H], qy[CH8_W * CH8_H], h = 0, t = 0, d;
  static const int dx[4] = {1, -1, 0, 0}, dy[4] = {0, 0, 1, -1};
  memset(reach, 0, sizeof reach);
  qx[t] = CH8_START_X; qy[t++] = CH8_START_Y; reach[CH8_START_Y][CH8_START_X] = 1;
  while (h < t) {
    int x = qx[h], y = qy[h++];
    for (d = 0; d < 4; d++) {
      int nx = x + dx[d], ny = y + dy[d];
      if (ch8_walkable(nx, ny) && !reach[ny][nx]) { reach[ny][nx] = 1; qx[t] = nx; qy[t++] = ny; }
    }
  }
}
int main(void) {
  int x, y, i, s, l, c, ex = 0, em = 0, sp[CH8_SPOTS] = {0};
  unsigned m;
  flood();
  for (y = 0; y < CH8_H; y++) for (x = 0; x < CH8_W; x++) {
    char t = ch8_tile(x, y);
    if (x == 0 || y == 0 || x == CH8_W - 1 || y == CH8_H - 1) CHECK(t == '#');
    CHECK(ch8_walkable(x, y) == (t != '#' && t != 'E'));
    CHECK(t == '#' || t == '.' || t == 'E' || t == 'D' || (t >= '1' && t <= '4'));
    if (t == 'D') { ex++; CHECK(ch8_exit_at(x, y) == 1); } else CHECK(ch8_exit_at(x, y) == 0);
    if (t == 'E') em++;
    if (t >= '1' && t <= '4') sp[t - '1']++;
  }
  CHECK(ex == 1); CHECK(em == 1);
  for (i = 0; i < CH8_SPOTS; i++) CHECK(sp[i] == 1);
  CHECK(ch8_tile(-1, 0) == '#'); CHECK(ch8_tile(0, CH8_H) == '#');
  CHECK(ch8_walkable(CH8_START_X, CH8_START_Y));
  for (i = 0; i < CH8_SPOTS; i++) {
    CHECK(ch8_spot_at(ch8_spot_x(i), ch8_spot_y(i)) == i);
    CHECK(reach[ch8_spot_y(i)][ch8_spot_x(i)]);
    CHECK(strlen(ch8_investigate_text(i)) > 0 && utf8_ok(ch8_investigate_text(i)));
  }
  CHECK(ch8_spot_x(-1) == -1 && ch8_spot_y(CH8_SPOTS) == -1);
  CHECK(strcmp(ch8_investigate_text(9), "") == 0);
  CHECK(ch8_tile(ch8_examiner_x(), ch8_examiner_y()) == 'E');
  CHECK(!ch8_walkable(ch8_examiner_x(), ch8_examiner_y()));
  CHECK(reach[ch8_examiner_y()][ch8_examiner_x() - 1] || reach[ch8_examiner_y()][ch8_examiner_x() + 1]
     || reach[ch8_examiner_y() - 1][ch8_examiner_x()] || reach[ch8_examiner_y() + 1][ch8_examiner_x()]);
  CHECK(ch8_exit_at(12, 13) == 1 && reach[13][12]);
  for (i = 0; i < CH8_NPC_N; i++) CHECK(strlen(ch8_npc_text(i)) > 0 && utf8_ok(ch8_npc_text(i)));
  CHECK(strlen(ch8_npc_text(CH8_NPC_N)) == 0 && strlen(ch8_npc_text(-1)) == 0);
  for (i = 0; i < CH8_CHOICES; i++) CHECK(strlen(ch8_choice(i)) > 0 && utf8_ok(ch8_choice(i)));
  CHECK(strlen(ch8_choice(-1)) == 0 && strlen(ch8_choice(3)) == 0);
  for (m = 0; m < 65536u; m++) {
    unsigned mm = m;
    int cnt = ch8_count(m), manual = 0;
    for (i = 0; i < CH8_SPOTS; i++) manual += ch8_has(m, i);
    CHECK(cnt == manual);
    CHECK(ch8_ready(m) == (ch8_has(m, 3) && cnt >= 3));
    CHECK(strlen(ch8_hint(m)) > 0 && utf8_ok(ch8_hint(m)));
    for (c = 0; c < 4; c++) {
      int v = ch8_verdict(m, c);
      if (!ch8_ready(m)) CHECK(v == CH8_NOT_READY);
      else CHECK(v == (c == CH8_CORRECT ? CH8_RIGHT : CH8_WRONG));
    }
    for (i = 0; i < 5; i++) { int st = ch8_stars(m, i); CHECK(st >= 1 && st <= 3); }
    CHECK(ch8_add(&mm, 0) == ((m & 1u) ? CH8_DUP : CH8_ADDED));
  }
  { unsigned z = 0; CHECK(ch8_add(&z, -1) == CH8_BAD); CHECK(ch8_add(&z, 4) == CH8_BAD); CHECK(ch8_add(0, 1) == CH8_BAD); CHECK(z == 0); }
  CHECK(ch8_stars(15u, 0) == 3); CHECK(ch8_stars(15u, 1) == 2); CHECK(ch8_stars(15u, 3) == 1); CHECK(ch8_stars(0u, 99) == 1);
  for (s = 0; s < CH8S_SCENES; s++) {
    CHECK(ch8s_len(s) > 0);
    for (l = 0; l < ch8s_len(s); l++) {
      int spk = ch8s_speaker(s, l);
      CHECK(spk >= 0 && spk < CH8S_SPEAKERS);
      CHECK(strlen(ch8s_text(s, l)) > 0 && utf8_ok(ch8s_text(s, l)));
    }
    CHECK(ch8s_speaker(s, -1) == -1 && ch8s_speaker(s, ch8s_len(s)) == -1);
    CHECK(strlen(ch8s_text(s, ch8s_len(s))) == 0);
  }
  CHECK(ch8s_len(-1) == 0 && ch8s_len(CH8S_SCENES) == 0);
  CHECK(strlen(ch8s_speaker_name(CH8S_NARR)) == 0);
  for (i = 1; i < CH8S_SPEAKERS; i++) CHECK(strlen(ch8s_speaker_name(i)) > 0);
  CHECK(strlen(ch8s_speaker_name(-1)) == 0 && strlen(ch8s_speaker_name(99)) == 0);
  CHECK(ch8s_scene_for_verdict(CH8_RIGHT) == CH8S_RIGHT && ch8s_scene_for_verdict(CH8_WRONG) == CH8S_WRONG);
  CHECK(ch8s_scene_for_verdict(CH8_NOT_READY) == -1 && ch8s_scene_for_verdict(7) == -1);
  CHECK(ch8s_next_scene(CH8S_ARRIVE) == CH8S_RULES && ch8s_next_scene(CH8S_RULES) == CH8S_THINK);
  CHECK(ch8s_next_scene(CH8S_RIGHT) == CH8S_RESULT);
  CHECK(ch8s_next_scene(CH8S_THINK) == -1 && ch8s_next_scene(CH8S_WRONG) == -1 && ch8s_next_scene(CH8S_RESULT) == -1);
  printf("test_ch8: %ld checks, %ld failed\n", N, F);
  return F ? 1 : 0;
}
