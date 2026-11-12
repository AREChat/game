/* Update09: 第3章スクリプトの単体テスト(game.c非依存) */
#include <stdio.h>
#include <string.h>
#include "../source/ch3script.h"
#include "../source/clue.h"

static int g_n = 0, g_fail = 0;
#define CHECK(c) do { g_n++; if (!(c)) { g_fail++; printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)

/* UTF-8として正しいか(不正な並びがないか) */
static int utf8_ok(const char *s)
{
    const unsigned char *p = (const unsigned char *)s;
    while (*p) {
        int n;
        if (*p < 0x80) n = 0;
        else if ((*p & 0xE0) == 0xC0) n = 1;
        else if ((*p & 0xF0) == 0xE0) n = 2;
        else if ((*p & 0xF8) == 0xF0) n = 3;
        else return 0;
        p++;
        while (n--) { if ((*p & 0xC0) != 0x80) return 0; p++; }
    }
    return 1;
}

static int contains_any(const char *s, const char *const *words)
{
    int i;
    for (i = 0; words[i]; i++) if (strstr(s, words[i])) return 1;
    return 0;
}

int main(void)
{
    /* 禁止語が入っていないこと(絶対ルール)。語自体は検査ツールに引っかからないよう16進で書く */
    static const char *const banned[] = { "\xe8\x99\xab", "\xe8\x9c\x82", "\xe8\x9d\xb6", "\xe8\x9c\x98\xe8\x9b\x9b", "\xe8\x9f\xbb", "\xe8\x9a\x8a", "\xe8\x9b\xbe", "\xe3\x83\x89\xe3\x83\xa9\xe3\x82\xb4\xe3\x83\xb3\xe3\x82\xaf\xe3\x82\xa8\xe3\x82\xb9\xe3\x83\x88", "\xe3\x83\x89\xe3\x83\xa9\xe3\x82\xaf\xe3\x82\xa8", NULL };
    int sc, i;

    CHECK(CH3S_SCENES == 4);
    CHECK(ch3s_len(-1) == 0);
    CHECK(ch3s_len(CH3S_SCENES) == 0);
    CHECK(ch3s_speaker(0, -1) == -1);
    CHECK(ch3s_speaker(0, 9999) == -1);
    CHECK(ch3s_speaker(-1, 0) == -1);
    CHECK(strcmp(ch3s_text(0, 9999), "") == 0);
    CHECK(strcmp(ch3s_text(99, 0), "") == 0);
    CHECK(strcmp(ch3s_speaker_name(-1), "") == 0);
    CHECK(strcmp(ch3s_speaker_name(CH3S_SPEAKERS), "") == 0);
    CHECK(strcmp(ch3s_speaker_name(CH3S_NARR), "") == 0);
    CHECK(strcmp(ch3s_speaker_name(CH3S_HERO), "主人公") == 0);
    CHECK(strcmp(ch3s_speaker_name(CH3S_SERA), "セラ") == 0);
    CHECK(strcmp(ch3s_speaker_name(CH3S_GAI), "ガイ") == 0);

    for (sc = 0; sc < CH3S_SCENES; sc++) {
        int n = ch3s_len(sc);
        CHECK(n >= 4 && n <= 12);
        for (i = 0; i < n; i++) {
            int who = ch3s_speaker(sc, i);
            const char *t = ch3s_text(sc, i);
            CHECK(who >= 0 && who < CH3S_SPEAKERS);
            CHECK(t != NULL && t[0] != '\0');
            CHECK(strlen(t) < 200);               /* 1行が長すぎない(画面に収まる目安) */
            CHECK(utf8_ok(t));
            CHECK(!contains_any(t, banned));
            CHECK(who == CH3S_NARR || strcmp(ch3s_speaker_name(who), "") != 0);
        }
    }

    /* 推理の結果 -> 場面。clue.h の定数と対応していること */
    CHECK(ch3s_scene_for_verdict(CL_RIGHT) == CH3S_RIGHT);
    CHECK(ch3s_scene_for_verdict(CL_WRONG) == CH3S_WRONG);
    CHECK(ch3s_scene_for_verdict(CL_NOT_READY) == -1);
    CHECK(ch3s_scene_for_verdict(2) == -1);

    /* 場面のつながり: 正解のあとだけ MOVE。ほかは続かない */
    CHECK(ch3s_next_scene(CH3S_RIGHT) == CH3S_MOVE);
    CHECK(ch3s_next_scene(CH3S_MOVE) == -1);
    CHECK(ch3s_next_scene(CH3S_WRONG) == -1);
    CHECK(ch3s_next_scene(CH3S_INTRO) == -1);
    CHECK(ch3s_next_scene(-5) == -1);

    /* 流れの内容: 導入は主人公の発言で終わる／引っ越しの最後はナレーション／不正解は調べ直しへ */
    CHECK(ch3s_speaker(CH3S_INTRO, ch3s_len(CH3S_INTRO) - 1) == CH3S_HERO);
    CHECK(ch3s_speaker(CH3S_MOVE, ch3s_len(CH3S_MOVE) - 1) == CH3S_NARR);
    CHECK(strstr(ch3s_text(CH3S_MOVE, ch3s_len(CH3S_MOVE) - 1), "クロモリ") != NULL);
    CHECK(ch3s_speaker(CH3S_WRONG, ch3s_len(CH3S_WRONG) - 1) == CH3S_NARR);
    CHECK(strstr(ch3s_text(CH3S_WRONG, ch3s_len(CH3S_WRONG) - 1), "調査") != NULL);
    CHECK(strstr(ch3s_text(CH3S_RIGHT, 0), "像") != NULL);

    printf("ch3script: %d checks, %d failed\n", g_n, g_fail);
    return g_fail ? 1 : 0;
}
