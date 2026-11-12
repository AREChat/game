#include "ch4script.h"

typedef struct { int who; const char *text; } Line;

static const Line ACCIDENT[] = {
    { CH4S_NARR, "山里クロモリに 引っこして 十日め。夜、ひどい 嵐が きた。" },
    { CH4S_NARR, "山の 土が くずれ、家の 半分が つぶれて しまった。" },
    { CH4S_FATHER, "みんな 無事か! けがは ないか!" },
    { CH4S_MOTHER, "わたしは だいじょうぶ…でも 台所も 寝間も…" },
    { CH4S_HERO, "ぼくたち、これから どこで くらすの?" },
    { CH4S_NARR, "夜が あけても、母は ずっと だまったままだった。" }
};

static const Line LEAVE[] = {
    { CH4S_NARR, "数日 たった あさ。母の すがたが 家に なかった。" },
    { CH4S_NARR, "机の 上に 一まいの 書き置きが 残っている。" },
    { CH4S_MOTHER, "あたらしい 土地も 家も うまく いかない。少し 頭を ひやしてきます。" },
    { CH4S_FATHER, "母さんを おいかけよう。山道の 方に 行った はずだ。" },
    { CH4S_HERO, "ぼくが 話してみる。母さんに 気もちを つたえたいんだ。" },
    { CH4S_NARR, "手がかりを 集めて、母の いる 場所を つきとめよう。" }
};

static const Line RIGHT[] = {
    { CH4S_NARR, "山道の 見はらしで、母は ひとり 空を 見ていた。" },
    { CH4S_HERO, "母さん、家は 直せるよ。みんなで いっしょに 住める 場所を つくろう。" },
    { CH4S_MOTHER, "…そうね。わたしが にげたら、あなたたちが こまるわよね。" },
    { CH4S_MOTHER, "ごめんなさい。もういちど、いっしょに がんばってみる。" },
    { CH4S_FATHER, "よく 話して くれた。三人で 家を 立てなおそう。" },
    { CH4S_HERO, "うん! 村の人たちにも 手つだって もらおう。" },
    { CH4S_NARR, "家族の きずなは、まえより 強く むすばれた。" }
};

static const Line WRONG[] = {
    { CH4S_NARR, "主人公は 言葉を えらんだが、母の 心には とどかなかった。" },
    { CH4S_MOTHER, "ごめんなさい…いまは だれの 話も 聞けないの。" },
    { CH4S_HERO, "もっと 母さんの 気もちを 考えなくちゃ。" },
    { CH4S_FATHER, "あわてなくて いい。もういちど 手がかりを 見なおそう。" },
    { CH4S_NARR, "家の まわりを 調べなおして、言葉を 考えなおそう。" }
};

static const Line NEWSCHOOL[] = {
    { CH4S_NARR, "ひと月後。家は たてなおり、主人公は クロモリの 学び舎に 通いはじめた。" },
    { CH4S_TEACHER, "みなさん、新しい 友だちを しょうかいします。" },
    { CH4S_HERO, "はじめまして。どうぞ よろしく おねがいします。" },
    { CH4S_CLASS, "だれが だれだか、おぼえきれないよ。" },
    { CH4S_MIO, "わたしは ミオ。わからない ことが あったら 聞いてね。" },
    { CH4S_HERO, "ありがとう、ミオ。ぼく、クラス全員の 名前を おぼえる 作戦を 立てるよ!" },
    { CH4S_MIO, "それ いいね! 顔と 名前を いっしょに おぼえると 早いよ。" },
    { CH4S_TEACHER, "では 名前おぼえゲームを はじめましょう。" },
    { CH4S_NARR, "新しい 学び舎での 毎日が、はじまった。" }
};

#define N(a) ((int)(sizeof(a) / sizeof((a)[0])))

static const Line *scene_lines(int scene, int *n) {
    switch (scene) {
    case CH4S_ACCIDENT: *n = N(ACCIDENT); return ACCIDENT;
    case CH4S_LEAVE: *n = N(LEAVE); return LEAVE;
    case CH4S_RIGHT: *n = N(RIGHT); return RIGHT;
    case CH4S_WRONG: *n = N(WRONG); return WRONG;
    case CH4S_NEWSCHOOL: *n = N(NEWSCHOOL); return NEWSCHOOL;
    default: *n = 0; return 0;
    }
}

int ch4s_len(int scene) {
    int n;
    scene_lines(scene, &n);
    return n;
}

int ch4s_speaker(int scene, int line) {
    int n;
    const Line *l = scene_lines(scene, &n);
    if (!l || line < 0 || line >= n) return -1;
    return l[line].who;
}

const char *ch4s_text(int scene, int line) {
    int n;
    const Line *l = scene_lines(scene, &n);
    if (!l || line < 0 || line >= n) return "";
    return l[line].text;
}

const char *ch4s_speaker_name(int speaker) {
    switch (speaker) {
    case CH4S_HERO: return "主人公";
    case CH4S_MOTHER: return "母";
    case CH4S_FATHER: return "父";
    case CH4S_TEACHER: return "先生";
    case CH4S_MIO: return "ミオ";
    case CH4S_CLASS: return "級友たち";
    default: return "";
    }
}

int ch4s_scene_for_verdict(int verdict) {
    if (verdict == 1) return CH4S_RIGHT;
    if (verdict == 0) return CH4S_WRONG;
    return -1;
}

int ch4s_next_scene(int scene) {
    if (scene == CH4S_ACCIDENT) return CH4S_LEAVE;
    if (scene == CH4S_RIGHT) return CH4S_NEWSCHOOL;
    return -1;
}
