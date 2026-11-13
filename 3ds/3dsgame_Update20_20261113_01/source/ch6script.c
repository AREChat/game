#include "ch6script.h"
#include "ch6data.h"

typedef struct { int sp; const char *tx; } Line;

static const Line TRAIN[] = {
    {CH6S_NARR, "放課後の図書室。ミオが 分厚い ノートを ひろげて 待っていた。"},
    {CH6S_MIO, "さあ、今日から 特訓だよ。まず 一日ひとつ、ぜったい 思い出してね。"},
    {CH6S_HERO, "ひとつだけなら できそうだ。"},
    {CH6S_SERA, "わたしも 見ていてあげる。いっしょに がんばろう。"}
};
static const Line COUNSEL[] = {
    {CH6S_TEACHER, "進路面談を はじめます。得意なことは 何ですか。"},
    {CH6S_HERO, "なぞなぞを とくことです。"},
    {CH6S_TEACHER, "すばらしい。それを 勉強にも 生かしましょう。"}
};
static const Line CIPHER[] = {
    {CH6S_MIO, "見て。この掲示板、1文字目だけを 読むと 文になるでしょう。"},
    {CH6S_MIO, "おぼえたい言葉で、同じことを してみよう。どうすれば いいかな。"}
};
static const Line RIGHT_[] = {
    {CH6S_MIO, "そのとおり! 1文字目を ならべて おはなしにすれば、わすれにくいの。"},
    {CH6S_HERO, "ふしぎだ。すらすら 思い出せる。"}
};
static const Line WRONG_[] = {
    {CH6S_MIO, "うーん、それだと つかれちゃうよ。もう一度 掲示板を 見てみよう。"},
    {CH6S_SERA, "あせらなくて いいよ。ゆっくり 考えてね。"}
};
static const Line GROW[] = {
    {CH6S_NARR, "その日から 主人公の 勉強は ぐんぐん のびていった。"},
    {CH6S_MIO, "つぎの試験が たのしみだね。"},
    {CH6S_HERO, "うん。ミオ、ありがとう。"}
};

static const Line *SC[CH6S_SCENES] = {TRAIN, COUNSEL, CIPHER, RIGHT_, WRONG_, GROW};
static const int LEN[CH6S_SCENES] = {
    (int)(sizeof TRAIN / sizeof TRAIN[0]), (int)(sizeof COUNSEL / sizeof COUNSEL[0]),
    (int)(sizeof CIPHER / sizeof CIPHER[0]), (int)(sizeof RIGHT_ / sizeof RIGHT_[0]),
    (int)(sizeof WRONG_ / sizeof WRONG_[0]), (int)(sizeof GROW / sizeof GROW[0])
};
static const char *NAMES[CH6S_SPEAKERS] = {"", "主人公", "セラ", "ミオ", "先生"};

int ch6s_len(int scene) { return (scene < 0 || scene >= CH6S_SCENES) ? 0 : LEN[scene]; }
int ch6s_speaker(int scene, int line) {
    if (line < 0 || line >= ch6s_len(scene)) return -1;
    return SC[scene][line].sp;
}
const char *ch6s_text(int scene, int line) {
    if (line < 0 || line >= ch6s_len(scene)) return "";
    return SC[scene][line].tx;
}
const char *ch6s_speaker_name(int speaker) {
    return (speaker < 0 || speaker >= CH6S_SPEAKERS) ? "" : NAMES[speaker];
}
int ch6s_scene_for_verdict(int verdict) {
    if (verdict == CH6_RIGHT) return CH6S_RIGHT;
    if (verdict == CH6_WRONG) return CH6S_WRONG;
    return -1;
}
int ch6s_next_scene(int scene) {
    if (scene == CH6S_TRAIN) return CH6S_COUNSEL;
    if (scene == CH6S_COUNSEL) return CH6S_CIPHER;
    if (scene == CH6S_RIGHT) return CH6S_GROW;
    return -1;
}
