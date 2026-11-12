#include "ch5data.h"
#include <string.h>

static const char *MAP[CH5_H] = {
    "#########################",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,1,,,,,,,,,,,,,,,,,2,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,#######,,,,,,,,#",
    "#,,,,,,,,#N....#,,,,,,,,#",
    "#,,,,,,,,#.....#,,,,,,,,#",
    "#,,,,,,,,###.###,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,3,,,,,,,,,,,,,,,,,4,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "#,,,,,,,,,,,,,,,,,,,,,,,#",
    "############D############"
};
static const int SX[CH5_SPOTS] = {3, 21, 3, 21};
static const int SY[CH5_SPOTS] = {2, 2, 9, 9};

static const char *INVEST[CH5_SPOTS] = {
    "保健室の先生の見立て:「首が まわらないのは、ねる時間が みじかくて 肩に 力が 入りつづけたからね」",
    "ミオの勉強ノート:毎日 夜ふけまで ペンを 走らせた あとが ある。さいごの ページに「ねむる ことも 勉強」と 書き足されている",
    "ほりだされた 順位表:いちばん 下に 主人公の 名前。でも 上の 子たちとの 差は わずか 数点だけだ",
    "屋台の食材メモ:「あつい日は 作りおきの 料理を 長く 出しっぱなしに しない」と 赤い字で 書いてある"
};
static const char *NPC[CH5_NPC_N] = {
    "保健室の先生:「首は ゆっくり あたためて ほぐせば だいじょうぶ。むりは しないでね」",
    "級友:「最下位でも めげない 主人公は すごいよ。つぎは いっしょに 勉強しよう」",
    "屋台のおじさん:「きのうの 料理は ぼくの 管理が あまかった。ごめんよ、これからは 気を つけるよ」"
};
static const char *HINTS[CH5_SPOTS] = {
    "まずは 保健室の まわりを 調べてみよう。左上の しばふに 手がかりが ありそうだ",
    "ミオの 勉強ノートを 読もう。右上の 木かげに 置いてある",
    "左下の 掲示板に 順位表が はられている",
    "右下の 屋台の ならびに 食材メモが ある"
};
static const char *CHOICES[CH5_CHOICES] = {
    "朝まで ねないで 一気に ぜんぶ おぼえるよ",
    "ねる時間を まもって、ミオと 一日ひとつずつ おぼえよう",
    "もう むりだから 勉強は やめて しまおう"
};

char ch5_tile(int x, int y) {
    if (x < 0 || y < 0 || x >= CH5_W || y >= CH5_H) return '#';
    return MAP[y][x];
}
int ch5_walkable(int x, int y) {
    char t = ch5_tile(x, y);
    return t != '#' && t != 'N';
}
int ch5_spot_at(int x, int y) {
    char t = ch5_tile(x, y);
    if (t >= '1' && t <= '4') return t - '1';
    return -1;
}
int ch5_exit_at(int x, int y) { return ch5_tile(x, y) == 'D' ? 1 : 0; }
int ch5_spot_x(int id) { return (id >= 0 && id < CH5_SPOTS) ? SX[id] : -1; }
int ch5_spot_y(int id) { return (id >= 0 && id < CH5_SPOTS) ? SY[id] : -1; }
int ch5_nurse_x(void) { return 10; }
int ch5_nurse_y(void) { return 5; }
const char *ch5_investigate_text(int id) { return (id >= 0 && id < CH5_SPOTS) ? INVEST[id] : ""; }
const char *ch5_npc_text(int i) { return (i >= 0 && i < CH5_NPC_N) ? NPC[i] : ""; }

int ch5_count(unsigned mask) {
    int n = 0, i;
    for (i = 0; i < CH5_SPOTS; i++) if (mask & (1u << i)) n++;
    return n;
}
int ch5_has(unsigned mask, int id) {
    if (id < 0 || id >= CH5_SPOTS) return 0;
    return (mask >> id) & 1u ? 1 : 0;
}
int ch5_add(unsigned *mask, int id) {
    if (!mask || id < 0 || id >= CH5_SPOTS) return CH5_BAD;
    if (*mask & (1u << id)) return CH5_DUP;
    *mask |= (1u << id);
    return CH5_ADDED;
}
int ch5_ready(unsigned mask) { return ch5_has(mask, 1) && ch5_count(mask) >= 3; }
const char *ch5_hint(unsigned mask) {
    int i;
    if (!ch5_has(mask, 1)) return HINTS[1];
    for (i = 0; i < CH5_SPOTS; i++) if (!ch5_has(mask, i)) return HINTS[i];
    return "手がかりは そろった。ミオと 話して 立ち直りの 言葉を 伝えよう";
}
const char *ch5_choice(int i) { return (i >= 0 && i < CH5_CHOICES) ? CHOICES[i] : ""; }
int ch5_verdict(unsigned mask, int choice) {
    if (!ch5_ready(mask)) return CH5_NOT_READY;
    if (choice < 0 || choice >= CH5_CHOICES) return CH5_NOT_READY;
    return choice == CH5_CORRECT ? CH5_RIGHT : CH5_WRONG;
}
int ch5_stars(unsigned mask, int wrong_count) {
    int s = 3;
    if (wrong_count > 0) s -= wrong_count;
    if (ch5_count(mask) < CH5_SPOTS) s -= 0; /* 3つでも満点にできる */
    if (s < 1) s = 1;
    if (s > 3) s = 3;
    return s;
}
