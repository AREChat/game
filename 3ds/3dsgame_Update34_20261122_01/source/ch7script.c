#include "ch7script.h"
#include "ch7data.h"

typedef struct { int sp; const char *tx; } Line;

static const Line MEET[] = {
 {CH7S_NARR, "汽車の都レイルハイム。大きな駅の広場で、なつかしい 声が した。"},
 {CH7S_YUNO, "主人公! ひさしぶり。ずっと 手紙を 書いてたんだよ。"},
 {CH7S_HERO, "ユノ! 元気だった? 大きく なったね。"},
 {CH7S_SERA, "はじめまして。わたしは セラ。主人公の 幼なじみなの。"}
};
static const Line LETTER[] = {
 {CH7S_STATION, "主人公さん あてに、名前の ない 手紙が 届いていますよ。"},
 {CH7S_NARR, "封ろうには 星の しるし。中には 短い 文が ひとつ。"},
 {CH7S_NARR, "「試験に 合格して、おまえの 賢さを しめせ。——星影の主」"},
 {CH7S_YUNO, "星影の主…? いったい 誰なんだろう。"}
};
static const Line THINK[] = {
 {CH7S_YUNO, "駅の あちこちに 手がかりが ありそう。いっしょに 調べよう。"},
 {CH7S_HERO, "手紙を どうするか、ちゃんと 考えて 決めたいな。"}
};
static const Line RIGHT_[] = {
 {CH7S_YUNO, "うん、それが いいと 思う! 自分の ちえで しめせば いいんだ。"},
 {CH7S_SERA, "わたしも 応えんするよ。いっしょに がんばろう。"},
 {CH7S_HERO, "よし。試験を うけて、手紙の 送り主に 会いに いこう。"}
};
static const Line WRONG_[] = {
 {CH7S_YUNO, "うーん、それだと 何も わからないままだよ。もう一度 考えよう。"},
 {CH7S_SERA, "あわてなくて いいよ。手がかりを もう一度 見てみよう。"}
};
static const Line EXAM[] = {
 {CH7S_NARR, "こうして 主人公は 試験の都を めざして、星の汽車に のりこんだ。"},
 {CH7S_YUNO, "いってらっしゃい。わたしも あとから 行くからね。"},
 {CH7S_HERO, "うん。まってるよ、ユノ。"}
};

static const Line *SC[CH7S_SCENES] = {MEET, LETTER, THINK, RIGHT_, WRONG_, EXAM};
static const int LEN[CH7S_SCENES] = {
 (int)(sizeof MEET / sizeof MEET[0]), (int)(sizeof LETTER / sizeof LETTER[0]),
 (int)(sizeof THINK / sizeof THINK[0]), (int)(sizeof RIGHT_ / sizeof RIGHT_[0]),
 (int)(sizeof WRONG_ / sizeof WRONG_[0]), (int)(sizeof EXAM / sizeof EXAM[0])
};
static const char *NAMES[CH7S_SPEAKERS] = {"", "主人公", "セラ", "ユノ", "駅長"};

int ch7s_len(int scene) { return (scene < 0 || scene >= CH7S_SCENES) ? 0 : LEN[scene]; }
int ch7s_speaker(int scene, int line) {
 if (line < 0 || line >= ch7s_len(scene)) return -1;
 return SC[scene][line].sp;
}
const char *ch7s_text(int scene, int line) {
 if (line < 0 || line >= ch7s_len(scene)) return "";
 return SC[scene][line].tx;
}
const char *ch7s_speaker_name(int speaker) {
 return (speaker < 0 || speaker >= CH7S_SPEAKERS) ? "" : NAMES[speaker];
}
int ch7s_scene_for_verdict(int verdict) {
 if (verdict == CH7_RIGHT) return CH7S_RIGHT;
 if (verdict == CH7_WRONG) return CH7S_WRONG;
 return -1;
}
int ch7s_next_scene(int scene) {
 if (scene == CH7S_MEET) return CH7S_LETTER;
 if (scene == CH7S_LETTER) return CH7S_THINK;
 if (scene == CH7S_RIGHT) return CH7S_EXAM;
 return -1;
}
