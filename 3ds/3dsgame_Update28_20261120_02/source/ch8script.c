#include "ch8script.h"
#include "ch8data.h"

typedef struct { int sp; const char *tx; } Line;

static const Line ARRIVE[] = {
  {CH8S_NARR, "星の汽車を おりると、そこは 学びの都ルミナリア。高い塔が 空に のびていた。"},
  {CH8S_SERA, "すごい 人の数! みんな 試験を うけに 来たのかな。"},
  {CH8S_HERO, "ここで 手紙の 送り主の 手がかりが つかめるはずだ。"}
};
static const Line RULES[] = {
  {CH8S_EXAMINER, "わたしは 試験官の メルガ。今日の 試験は 「考える力」を 見るものだ。"},
  {CH8S_EXAMINER, "会場の 広場には 手がかりが 四つ ある。よく しらべてから 答えなさい。"},
  {CH8S_YUNO, "あとから 追いついたよ! いっしょに 手がかりを さがそう。"}
};
static const Line THINK[] = {
  {CH8S_YUNO, "掲示板や 石板に 大事な ことが 書いてありそう。"},
  {CH8S_HERO, "あわてず、一つずつ しらべて 筋道を 立てて 考えよう。"}
};
static const Line RIGHT_[] = {
  {CH8S_EXAMINER, "見事だ。手がかりを つないで 答えを みちびいたな。"},
  {CH8S_SERA, "やったね! 主人公なら できると 思ってた。"},
  {CH8S_YUNO, "ぼくも うれしいよ。これで 次へ すすめるね。"}
};
static const Line WRONG_[] = {
  {CH8S_EXAMINER, "それでは 答えに ならない。もう一度 手がかりを 見直しなさい。"},
  {CH8S_SERA, "だいじょうぶ。落ち着いて 考えれば わかるよ。"}
};
static const Line RESULT[] = {
  {CH8S_NARR, "こうして 主人公は 試験に 合格した。塔の てっぺんで 星が ひとつ かがやいた。"},
  {CH8S_EXAMINER, "星影の主は この塔の さらに 先で まっている。行きなさい。"},
  {CH8S_HERO, "はい。必ず 会いに いきます。"}
};

static const Line *SC[CH8S_SCENES] = {ARRIVE, RULES, THINK, RIGHT_, WRONG_, RESULT};
static const int LEN[CH8S_SCENES] = {
  (int)(sizeof ARRIVE / sizeof ARRIVE[0]), (int)(sizeof RULES / sizeof RULES[0]),
  (int)(sizeof THINK / sizeof THINK[0]), (int)(sizeof RIGHT_ / sizeof RIGHT_[0]),
  (int)(sizeof WRONG_ / sizeof WRONG_[0]), (int)(sizeof RESULT / sizeof RESULT[0])
};
static const char *NAMES[CH8S_SPEAKERS] = {"", "主人公", "セラ", "ユノ", "メルガ"};

int ch8s_len(int scene) { return (scene < 0 || scene >= CH8S_SCENES) ? 0 : LEN[scene]; }
int ch8s_speaker(int scene, int line) {
  if (line < 0 || line >= ch8s_len(scene)) return -1;
  return SC[scene][line].sp;
}
const char *ch8s_text(int scene, int line) {
  if (line < 0 || line >= ch8s_len(scene)) return "";
  return SC[scene][line].tx;
}
const char *ch8s_speaker_name(int speaker) {
  return (speaker < 0 || speaker >= CH8S_SPEAKERS) ? "" : NAMES[speaker];
}
int ch8s_scene_for_verdict(int verdict) {
  if (verdict == CH8_RIGHT) return CH8S_RIGHT;
  if (verdict == CH8_WRONG) return CH8S_WRONG;
  return -1;
}
int ch8s_next_scene(int scene) {
  if (scene == CH8S_ARRIVE) return CH8S_RULES;
  if (scene == CH8S_RULES) return CH8S_THINK;
  if (scene == CH8S_RIGHT) return CH8S_RESULT;
  return -1;
}
