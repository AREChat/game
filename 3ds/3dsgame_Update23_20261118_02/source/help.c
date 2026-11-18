#include "help.h"
#include "ids.h"
#include <string.h>

static int fl(const unsigned char *f, int id) { return f && id >= 0 && f[id] != 0; }

const char *help_title(int page)
{
    static const char *t[HELP_PAGES] = { "そうさの しかた", "いま やること", "たたかいの しかた", "こまったとき", "これまでの あらすじ" };
    return (page >= 0 && page < HELP_PAGES) ? t[page] : "";
}

int help_is_end(int chapter, const unsigned char *f)
{
    return chapter >= 4 && fl(f, F_CH4_DONE);
}

const char *help_goal(int chapter, int area, const unsigned char *f)
{
    (void)area;
    if (chapter <= 1) {
        if (!fl(f, F_MET_SERA)) return "ひなた村の 右の 出口から ひだまり公園へ 行こう";
        if (!fl(f, F_RIDE_DONE)) return "公園の のりものの おじさんに 話しかけよう";
        if (!fl(f, F_BELL_DONE)) return "ひなた村の 右がわの 道へ もどって 鐘を しらべよう";
        if (!fl(f, F_KINDER_ARRIVED)) return "公園の 南の 出口から みつば園へ 行こう";
        if (!fl(f, F_DISPUTE_DONE)) return "みつば園で けんかを している子に 話しかけよう";
        return "みつば園の 先生に 話しかけよう";
    }
    if (chapter == 2) {
        if (!fl(f, F_SCHOOL_ENTERED)) return "学び舎の町ミルフィの 学び舎に 入ろう";
        if (!fl(f, F_GAI_JOINED)) return "学び舎の 中で ガイに 話しかけよう";
        if (!fl(f, F_CLUE_A) || !fl(f, F_CLUE_B)) return "学び舎で 手がかりを あつめよう";
        return "校長先生に 会いに 行こう";
    }
    if (chapter == 3) {
        int n = fl(f, F_CH3_C0) + fl(f, F_CH3_C1) + fl(f, F_CH3_C2) + fl(f, F_CH3_C3) + fl(f, F_CH3_C4);
        if (!fl(f, F_CH3_DONE)) {
            if (n < 5) return "像の まわりの ひかる ところを しらべよう";
            return "ガイに 話しかけて 推理を はじめよう";
        }
        return "クロモリへ 向かおう";
    }
    if (chapter >= 4) {
        if (fl(f, F_CH4_DONE)) return "ここまで！ つづきは アップデートで おたのしみに";
        if (fl(f, F_CH4_READY)) return "家に もどって お母さんと 話そう";
        return "クロモリで お母さんの 手がかりを あつめよう";
    }
    return "まわりの 人に 話しかけてみよう";
}

int help_lines(int page, int chapter, int area, const unsigned char *flags, const char *out[HELP_MAX_LINES])
{
    int n = 0;
    switch (page) {
    case 0:
        out[n++] = "十字キー: あるく (おしっぱなしOK)";
        out[n++] = "Bを おしながら あるく: はやあるき";
        out[n++] = "Aボタン: 人に 話す / しらべる / すすむ";
        out[n++] = "Xボタン: メニュー (どうぐ・セーブ)";
        out[n++] = "Bボタン: もどる";
        out[n++] = "会話中に Rボタンを おしつづける: はやおくり";
        out[n++] = "STARTボタン: ゲームを おわる";
        out[n++] = "SELECTボタン: この ヘルプ";
        break;
    case 1:
        out[n++] = "【いまの もくてき】";
        out[n++] = help_goal(chapter, area, flags);
        out[n++] = "";
        out[n++] = "人の 近くで Aを おすと 話せるよ。";
        out[n++] = "光る ところや 箱も Aで しらべよう。";
        out[n++] = "マップの はしの 出口に 立つと";
        out[n++] = "つぎの 場所へ 行けるよ。";
        break;
    case 2:
        out[n++] = "コマンドを 十字キーで えらんで A。";
        out[n++] = "こうげき: ふつうに たたかう";
        out[n++] = "とくぎ: MPを つかう つよい わざ";
        out[n++] = "どうぐ: やくそうで HPを かいふく";
        out[n++] = "にげる: たたかいから にげる";
        out[n++] = "Bで ひとつ もどれるよ。";
        out[n++] = "HPが 0に なっても ペナルティは";
        out[n++] = "ゴールドが 半分に なるだけ。あんしん！";
        break;
    case 4:
        out[n++] = "【第1章】星が ふる夜、セラと であい";
        out[n++] = "空とぶ舟を なおして 山賊を おいはらう。";
        if (chapter >= 2) {
            out[n++] = "【第2章】新しい 学び舎で じけん。";
            out[n++] = "ガイと 推理して 校長の たくらみを 明かす。";
        }
        if (chapter >= 3) {
            out[n++] = "【第3章】勤勉の像の なぞを とく。";
            out[n++] = "みんなの 前で 推理して 像を まもった。";
        }
        if (chapter >= 4) {
            out[n++] = "【第4章】嵐で 家が こわれ お母さんが 家出。";
            out[n++] = "手がかりを あつめて 気持ちを つたえよう。";
        }
        break;
    default:
        out[n++] = "・何をしたら いいか わからない";
        out[n++] = "  → 「いま やること」を 見よう";
        out[n++] = "・道に まよった / 動けない";
        out[n++] = "  → この画面で Xを おすと 安全な";
        out[n++] = "    場所に もどれる(HPも 全かいふく)";
        out[n++] = "・きろくを のこしたい";
        out[n++] = "  → Xメニューの「セーブ」";
        out[n++] = "  (場所を かえると じどうでも セーブ)";
        break;
    }
    return n;
}
