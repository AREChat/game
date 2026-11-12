#include "ch5script.h"

typedef struct { int sp; const char *tx; } Line;

static const Line NECK[] = {
    {CH5S_NARR, "学び舎は 試験の 週。夜ふけまで 勉強した 主人公の 首が、朝から ぎしぎし 鳴って まわらなくなった。"},
    {CH5S_SERA, "どうしたの? 首が かたまってるよ。まず 保健室に 行こう!"},
    {CH5S_NURSE, "ねる時間が みじかいと 肩に 力が 入りっぱなしに なるの。むりは しないで、少し 休んでいきなさい。"},
    {CH5S_HERO, "でも 試験が ある。休んでる ひまなんて ないよ…"}
};
static const Line LAST[] = {
    {CH5S_NARR, "試験の 結果が 張り出された。主人公の 名前は、いちばん 下に あった。"},
    {CH5S_CLASS, "えっ、最下位? いつも 謎解きは 得意なのに ね。"},
    {CH5S_HERO, "…ちゃんと やったつもり だったのに。"},
    {CH5S_MIO, "上の 子たちとは 数点しか ちがわないよ。いっしょに やり方を 見直そう。"}
};
static const Line FESTIVAL[] = {
    {CH5S_NARR, "気ばらしに 星あかり祭りへ。あつい 日だった。"},
    {CH5S_STALL, "さあ さあ、できたての 煮こみだ! ひとつ どうだい?"},
    {CH5S_NARR, "主人公は 作りおきの 料理を 食べて、あとで おなかが しくしく してきた。"},
    {CH5S_SERA, "だいじょうぶ? 横になって。水を もらってくるね。"},
    {CH5S_HERO, "…首も おなかも ダメで 最下位だ。立ち直れる かな。"}
};
static const Line RIGHT[] = {
    {CH5S_HERO, "ねる時間を まもって、ミオと 一日ひとつずつ おぼえよう。"},
    {CH5S_MIO, "うん、それが いちばんだよ! ねむる ことも 勉強の うちだもの。"},
    {CH5S_NURSE, "いい 心がけね。首も ゆっくり ほぐれていくわ。"},
    {CH5S_NARR, "主人公の 胸の あかりが ぽっと 強く なった。"}
};
static const Line WRONG[] = {
    {CH5S_MIO, "それだと また 首が かたまっちゃうよ…。もう一度 かんがえてみよう。"},
    {CH5S_HERO, "そうだね。手がかりを 見直して、もう一度 ためしてみる。"}
};
static const Line RECOVER[] = {
    {CH5S_NARR, "数日後。首は すっかり まわるように なり、おなかも 元気に なった。"},
    {CH5S_SERA, "顔色が いいね! 今日は 勉強より 先に 朝ごはんだよ。"},
    {CH5S_MIO, "つぎの 試験までに、毎日ひとつずつ 一緒に やろうね。"},
    {CH5S_HERO, "うん。星の汽車の 運転手に なる ために、ゆっくり 進もう。"}
};

#define N(a) ((int)(sizeof(a) / sizeof((a)[0])))
static const Line *const SC[CH5S_SCENES] = {NECK, LAST, FESTIVAL, RIGHT, WRONG, RECOVER};
static const int LEN[CH5S_SCENES] = {N(NECK), N(LAST), N(FESTIVAL), N(RIGHT), N(WRONG), N(RECOVER)};
static const char *const NAMES[CH5S_SPEAKERS] = {"", "主人公", "セラ", "ミオ", "保健室の先生", "屋台のおじさん", "級友たち"};

int ch5s_len(int scene) { return (scene >= 0 && scene < CH5S_SCENES) ? LEN[scene] : 0; }
int ch5s_speaker(int scene, int line) {
    if (line < 0 || line >= ch5s_len(scene)) return -1;
    return SC[scene][line].sp;
}
const char *ch5s_text(int scene, int line) {
    if (line < 0 || line >= ch5s_len(scene)) return "";
    return SC[scene][line].tx;
}
const char *ch5s_speaker_name(int speaker) {
    return (speaker >= 0 && speaker < CH5S_SPEAKERS) ? NAMES[speaker] : "";
}
int ch5s_scene_for_verdict(int verdict) {
    if (verdict == 1) return CH5S_RIGHT;
    if (verdict == 0) return CH5S_WRONG;
    return -1;
}
int ch5s_next_scene(int scene) {
    if (scene == CH5S_NECK) return CH5S_LAST;
    if (scene == CH5S_LAST) return CH5S_FESTIVAL;
    if (scene == CH5S_RIGHT) return CH5S_RECOVER;
    return -1;
}
