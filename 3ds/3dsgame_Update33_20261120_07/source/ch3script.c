#include <stddef.h>
#include "ch3script.h"

typedef struct { int who; const char *text; } Line;

static const Line S_INTRO[] = {
    {0, "学び舎の庭に、全校生徒が集まってきた。"},
    {4, "勤勉の像は、どうして片づけられちゃうの？"},
    {5, "古くなったから、というのが学び舎の言い分です。けれど、それだけでしょうか。"},
    {3, "主人公、手がかりはそろったよね。みんなの前で話してみよう。"},
    {2, "だいじょうぶ。主人公のひらめき、わたしは信じてるよ。"},
    {1, "……はい。ぼくの考えを聞いてください。"},
};

static const Line S_RIGHT[] = {
    {1, "像の足もとには、土をほりかえした跡がありました。像を動かすのが目的ではなかったんです。"},
    {3, "台座のすき間から出てきた古い手紙。そこには、像をつくった人の願いが書かれていた。"},
    {2, "「勉強は、だれかに見せるためではなく、自分の星を磨くためにするもの」……そう書いてあったよ。"},
    {1, "像をなくそうとした人は、この手紙が見つかるのを止めたかったのだと思います。"},
    {5, "……そのとおりです。わたしの負けです。手紙は、あなたたちにお返ししましょう。"},
    {4, "すごい！ 主人公の推理、ぴったりだ！"},
    {0, "像はそのまま、庭に残されることになった。"},
};

static const Line S_WRONG[] = {
    {1, "ええと、つまり……像が古くなったから、でしょうか。"},
    {5, "それなら、予定どおりに片づけてかまいませんね。"},
    {3, "待って、まだ見ていない手がかりがあるはずだよ。もう一度、庭を調べ直そう。"},
    {2, "あわてないで。ひとつずつ、思い出していこう。"},
    {0, "主人公は、もう一度庭の調査にもどった。"},
};

static const Line S_MOVE[] = {
    {0, "事件のあと、学び舎の庭はおだやかな夕やけに包まれた。"},
    {6, "主人公、手紙が届いたの。山あいの町クロモリで、新しいお仕事が決まりそうなのよ。"},
    {1, "クロモリ……暗い山里だって聞いたことがあるよ。"},
    {3, "遠くなるけど、ぼくたちの友だちは変わらないさ。"},
    {2, "またいつか、星の下で会おうね。約束だよ。"},
    {0, "主人公は、ミルフィの町をあとにして、クロモリへ旅立った。"},
};

static const Line *const SCENES[CH3S_SCENES] = { S_INTRO, S_RIGHT, S_WRONG, S_MOVE };
static const int LENS[CH3S_SCENES] = { (int)(sizeof(S_INTRO)/sizeof(S_INTRO[0])), (int)(sizeof(S_RIGHT)/sizeof(S_RIGHT[0])), (int)(sizeof(S_WRONG)/sizeof(S_WRONG[0])), (int)(sizeof(S_MOVE)/sizeof(S_MOVE[0])) };

static const char *const NAMES[CH3S_SPEAKERS] = {
    "", "主人公", "セラ", "ガイ", "生徒たち", "先生", "母"
};

int ch3s_len(int scene)
{
    if (scene < 0 || scene >= CH3S_SCENES) return 0;
    return LENS[scene];
}

int ch3s_speaker(int scene, int line)
{
    if (line < 0 || line >= ch3s_len(scene)) return -1;
    return SCENES[scene][line].who;
}

const char *ch3s_text(int scene, int line)
{
    if (line < 0 || line >= ch3s_len(scene)) return "";
    return SCENES[scene][line].text;
}

const char *ch3s_speaker_name(int speaker)
{
    if (speaker < 0 || speaker >= CH3S_SPEAKERS) return "";
    return NAMES[speaker];
}

int ch3s_scene_for_verdict(int verdict)
{
    if (verdict == 1) return CH3S_RIGHT;
    if (verdict == 0) return CH3S_WRONG;
    return -1;
}

int ch3s_next_scene(int scene)
{
    if (scene == CH3S_RIGHT) return CH3S_MOVE;
    return -1;
}
