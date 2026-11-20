#include "help.h"
#include "ids.h"
#include <string.h>

static int fl(const unsigned char *f, int id) { return f && id >= 0 && f[id] != 0; }

const char *help_title(int page)
{
    static const char *t[HELP_PAGES] = { "そうさの しかた", "いま やること", "たたかいの しかた", "こまったとき", "これまでの あらすじ", "まちの 施設と スカウト" };
    return (page >= 0 && page < HELP_PAGES) ? t[page] : "";
}

int help_is_end(int chapter, const unsigned char *f)
{
    (void)chapter;
    return fl(f, F_CH5_DONE);
}

/* いまの目的の表。フラグの すすみぐあいで、つぎに行く場所(area,x,y)と文章が かわる。
 * 場所は ゲームの データ(data_world.c)の NPC・トリガーの位置とそろえてある(test_main.c で確かめる) */
typedef struct { int area, x, y; const char *text; } GoalRec;

static GoalRec G(int area, int x, int y, const char *text) { GoalRec g; g.area = area; g.x = x; g.y = y; g.text = text; return g; }

static GoalRec goal_rec(const unsigned char *f)
{
    if (fl(f, F_CH5_DONE)) return G(AREA_MILFI, 18, 8, "第5章 クリア！ 格闘場や カジノで あそぼう(つづきは アップデートで)");
    if (fl(f, F_CH5_TALK)) return G(AREA_CAVE, 20, 3, "星あかりの洞くつの おくへ 行こう(！の ところ)");
    if (fl(f, F_CH5_START)) return G(AREA_MILFI, 16, 11, "ミルフィの 星読みの おじいさんに 話しかけよう(！の ところ)");
    if (fl(f, F_CH4_DONE)) return G(AREA_MILFI, 16, 11, "ミルフィの 星読みの おじいさんに 話しかけよう(！の ところ)");
    if (fl(f, F_CH4_START)) {
        if (!fl(f, F_CH4_S2)) return G(AREA_KUROMORI, 4, 7, "クロモリで あたりを しらべよう(！の ところ)");
        if (!fl(f, F_CH4_S3)) return G(AREA_KUROMORI, 20, 10, "つぎの 手がかりを しらべよう(！の ところ)");
        if (!fl(f, F_CH4_S1)) return G(AREA_KUROMORI, 12, 9, "つぎの 手がかりを しらべよう(！の ところ)");
        if (!fl(f, F_CH4_S0)) return G(AREA_KUROMORI, 5, 2, "さいごの 手がかりを しらべよう(！の ところ)");
        return G(AREA_KUROMORI, 21, 4, "お母さんに 話しかけよう(！の ところ)");
    }
    if (fl(f, F_CH3_DONE)) return G(AREA_KUROMORI, 12, 13, "山里クロモリへ 向かおう");
    if (fl(f, F_CH3_START)) {
        if (!fl(f, F_CH3_C0)) return G(AREA_STATUE, 3, 2, "像の まわりを しらべよう(！の ところ)");
        if (!fl(f, F_CH3_C1)) return G(AREA_STATUE, 17, 4, "つぎの あとを しらべよう(！の ところ)");
        if (!fl(f, F_CH3_C2)) return G(AREA_STATUE, 9, 8, "つぎの あとを しらべよう(！の ところ)");
        if (!fl(f, F_CH3_C3)) return G(AREA_STATUE, 18, 10, "つぎの あとを しらべよう(！の ところ)");
        if (!fl(f, F_CH3_C4)) return G(AREA_STATUE, 2, 12, "さいごの あとを しらべよう(！の ところ)");
        return G(AREA_STATUE, 12, 9, "人だかりの ところで 推理しよう(！の ところ)");
    }
    if (fl(f, F_CH2_DONE)) return G(AREA_STATUE, 12, 13, "学び舎の庭の 勤勉の像へ 向かおう");
    if (fl(f, F_CH2_START)) {
        if (!fl(f, F_SCHOOL_ENTERED)) return G(AREA_SCHOOL, 12, 12, "学び舎に 入ろう(まちの 北の 入口)");
        if (!fl(f, F_GAI_JOINED)) return G(AREA_SCHOOL, 14, 8, "ガイに 話しかけよう(！の ところ)");
        if (!fl(f, F_CLUE_A)) return G(AREA_SCHOOL, 3, 9, "手がかりを しらべよう(！の ところ)");
        if (!fl(f, F_CLUE_B)) return G(AREA_SCHOOL, 20, 9, "つぎの 手がかりを しらべよう(！の ところ)");
        return G(AREA_SCHOOL, 12, 4, "校長先生に 話しかけよう(！の ところ)");
    }
    if (fl(f, F_CH1_DONE)) return G(AREA_MILFI, 11, 8, "学び舎の町ミルフィへ 向かおう");
    if (!fl(f, F_MET_SERA)) return G(AREA_PLAZA, 6, 5, "ひだまり公園で セラに あおう(！の ところ)");
    if (!fl(f, F_RIDE_DONE)) return G(AREA_PLAZA, 13, 5, "のりものの おじさんに 話しかけよう(！の ところ)");
    if (!fl(f, F_BELL_DONE)) return G(AREA_HINATA, 15, 7, "ひなた村の 鐘の ところへ 行こう(！の ところ)");
    if (!fl(f, F_KINDER_ARRIVED)) return G(AREA_KINDER, 12, 12, "みつば園へ 行こう(公園の 南の 出口)");
    if (!fl(f, F_DISPUTE_DONE)) return G(AREA_KINDER, 7, 7, "けんかを している子に 話しかけよう(！の ところ)");
    return G(AREA_KINDER, 12, 4, "みつば園の 先生に 話しかけよう(！の ところ)");
}

const char *help_goal(int chapter, int area, const unsigned char *f)
{
    (void)chapter; (void)area;
    return goal_rec(f).text;
}

int help_goal_info(int chapter, const unsigned char *f, int *area, int *x, int *y)
{
    GoalRec g = goal_rec(f);
    (void)chapter;
    if (area) *area = g.area;
    if (x) *x = g.x;
    if (y) *y = g.y;
    return g.area >= 0;
}

int help_lines(int page, int chapter, int area, const unsigned char *flags, const char *out[HELP_MAX_LINES])
{
    int n = 0;
    switch (page) {
    case 0:
        out[n++] = "十字キー: あるく (おしっぱなしOK)";
        out[n++] = "Bを おしながら あるく: はやあるき";
        out[n++] = "Aボタン: 人に 話す / しらべる / すすむ";
        out[n++] = "Xボタン: メニュー (転職・カジノ・ほか)";
        out[n++] = "Bボタン: もどる";
        out[n++] = "会話中に Rボタンを おしつづける: はやおくり";
        out[n++] = "STARTボタン: ゲームを おわる";
        out[n++] = "(Xメニューの「そうさ方法」でも 見られる)";
        out[n++] = "SELECTボタン: この ヘルプ";
        break;
    case 1:
        out[n++] = "【いまの もくてき】";
        out[n++] = help_goal(chapter, area, flags);
        out[n++] = "画面の ！マークが 行き先の めじるし。";
        out[n++] = "人の 近くで Aを おすと 話せるよ。";
        out[n++] = "光る ところや 箱も Aで しらべよう。";
        out[n++] = "マップの はしの 出口に 立つと";
        out[n++] = "つぎの 場所へ 行けるよ。";
        break;
    case 2:
        out[n++] = "コマンドを 十字キーで えらんで A。";
        out[n++] = "こうげき: ふつうに たたかう";
        out[n++] = "とくぎ: 呪文や とくぎを つかう";
        out[n++] = "どうぐ: やくそうで HPを かいふく";
        out[n++] = "にげる: たたかいから にげる";
        out[n++] = "スカウト: 魔物を なかまに する";
        out[n++] = "Bで ひとつ もどれるよ。";
        out[n++] = "HPが 0に なっても ペナルティは";
        out[n++] = "ゴールドが 半分に なるだけ。あんしん！";
        break;
    case 5:
        out[n++] = "ミルフィの 町には 施設が あるよ。";
        out[n++] = "道具屋: やくそう・ぶき・ぼうぐ";
        out[n++] = "宿屋: HPと MPが ぜんかいふく";
        out[n++] = "転職の間: Lv10から 職業を えらべる";
        out[n++] = "格闘場: なかまの 魔物が たたかう";
        out[n++] = "カジノ: スロット・ルーレット・タイピング";
        out[n++] = "スカウトは HPが 少ないほど 成功しやすい";
        out[n++] = "魔物は Xメニューの「モンスター」で見よう";
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
        if (fl(flags, F_CH5_START)) {
            out[n++] = "【第5章】星あかりの洞くつの 結晶を まもる。";
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
        out[n++] = "・おとが うるさい → Yボタンで BGMオフ";
        break;
    }
    return n;
}
