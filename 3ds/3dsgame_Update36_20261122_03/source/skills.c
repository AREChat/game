#include "skills.h"
#include <string.h>
#include <stdio.h>

/* S(名前, 種類 0呪文/1特技, タイプ, MP, 対象, おぼえるLv, 効果1, p1, 効果2, p2, 回数) */
#define S(nm, kd, ty, mp, tg, lv, e1, p1, e2, p2, h) { nm, kd, ty, mp, tg, lv, -1, e1, p1, e2, p2, h }
/* J(名前, 種類, MP, 対象, 職業ID, 職業Lv, 効果1, p1, 効果2, p2, 回数) */
#define J(nm, kd, mp, tg, jb, jl, e1, p1, e2, p2, h) { nm, kd, 'J', mp, tg, jl, jb, e1, p1, e2, p2, h }

/* 順番が そのまま メニューの ならび。(1) こうげき呪文 (2) かいふく呪文 (3) ほじょ呪文 (4) とくぎ (5) 職業のわざ */
const SkillDef SKILLS_V3[] = {
    /* ---- こうげき呪文 (A) ---- */
    S("火花の術",        0, 'A',  4, TG_FOE1,     1, EF_MDMG, 100, 0, 0, 1),
    S("氷結ウェーブ",    0, 'A',  4, TG_FOE1,     2, EF_MDMG, 110, 0, 0, 1),
    S("雷鳴ブレス",      0, 'A',  5, TG_FOE1,     3, EF_MDMG, 120, 0, 0, 1),
    S("水流バースト",    0, 'A',  5, TG_FOE1,     4, EF_MDMG, 125, 0, 0, 1),
    S("風切の術",        0, 'A',  5, TG_FOE1,     5, EF_MDMG, 130, 0, 0, 1),
    S("大火花の術",      0, 'A',  9, TG_FOE_ALL,  6, EF_MDMG,  80, 0, 0, 1),
    S("岩砕きの術",      0, 'A',  6, TG_FOE1,     7, EF_MDMG, 150, 0, 0, 1),
    S("大氷結ウェーブ",  0, 'A',  9, TG_FOE_ALL,  8, EF_MDMG,  85, 0, 0, 1),
    S("大雷鳴ブレス",    0, 'A', 10, TG_FOE_ALL,  9, EF_MDMG,  90, 0, 0, 1),
    S("光輪の矢",        0, 'A',  7, TG_FOE1,    10, EF_MDMG, 170, 0, 0, 1),
    S("超火花の術",      0, 'A', 16, TG_FOE1,    11, EF_MDMG, 260, 0, 0, 1),
    S("星屑スパーク",    0, 'A',  8, TG_FOE1,    12, EF_MDMG, 190, 0, 0, 1),
    S("超氷結ウェーブ",  0, 'A', 16, TG_FOE1,    13, EF_MDMG, 280, 0, 0, 1),
    S("火花の極み",      0, 'A', 24, TG_FOE_ALL, 19, EF_MDMG, 160, 0, 0, 1),
    S("氷結の嵐",        0, 'A', 26, TG_FOE_ALL, 20, EF_MDMG, 150, EF_SLEEP, 30, 1),
    S("雷鳴の大号令",    0, 'A', 28, TG_FOE_ALL, 22, EF_MDMG, 185, 0, 0, 1),
    S("星降る夜",        0, 'A', 32, TG_FOE_ALL, 25, EF_MDMG, 200, EF_HEALPCT, 20, 1),
    /* ---- かいふく呪文 (H) ---- */
    S("ちょっと休憩",    0, 'H',  3, TG_ALLY1,    1, EF_HEAL,    30, 0, 0, 1),
    S("休憩",            0, 'H',  4, TG_ALLY1,    4, EF_HEAL,    70, 0, 0, 1),
    S("清浄の術",        0, 'H',  5, TG_ALLY1,    6, EF_HEALPCT, 25, 0, 0, 1),
    S("かなり休憩",      0, 'H',  6, TG_ALLY1,    8, EF_HEAL,   130, 0, 0, 1),
    S("みんな休憩",      0, 'H',  9, TG_ALLY_ALL, 10, EF_HEAL,    80, 0, 0, 1),
    S("目覚めアロー",    0, 'H', 10, TG_DEAD1,   12, EF_REVIVE,  50, 0, 0, 1),
    S("めっちゃ休憩",    0, 'H',  9, TG_ALLY1,   13, EF_HEAL,   230, 0, 0, 1),
    S("回復ブレス",      0, 'H', 10, TG_ALLY_ALL, 14, EF_HEALPCT, 35, 0, 0, 1),
    S("光輪アロー",      0, 'H', 14, TG_ALLY1,   16, EF_HEALPCT, 60, EF_DEFUP, 30, 1),
    S("1日休憩",         0, 'H', 12, TG_ALLY1,   18, EF_HEAL,   999, 0, 0, 1),
    S("みんな1日休憩",   0, 'H', 18, TG_ALLY_ALL, 20, EF_HEAL,  999, 0, 0, 1),
    S("目覚めアロー・極", 0, 'H', 22, TG_DEAD1,  22, EF_REVIVE, 100, 0, 0, 1),
    /* ---- ほじょ呪文 (S) ---- */
    S("勇気の呪文",      0, 'S',  6, TG_ALLY1,    2, EF_ATKUP,   30, EF_DEFUP, 30, 1),
    S("強化の呪文",      0, 'S',  8, TG_ALLY_ALL, 3, EF_ATKUP,   25, 0, 0, 1),
    S("弱体スパーク",    0, 'S',  7, TG_FOE_ALL,  4, EF_DEFDOWN, 30, 0, 0, 1),
    S("守護バースト",    0, 'S',  8, TG_ALLY_ALL, 5, EF_DEFUP,   30, 0, 0, 1),
    S("空の羽ばたき",    0, 'S',  6, TG_ALLY_ALL, 5, EF_ESCAPE,   0, 0, 0, 1),
    S("勇気ダウン",      0, 'S',  7, TG_FOE_ALL,  6, EF_ATKDOWN, 30, 0, 0, 1),
    S("加速ウェーブ",    0, 'S',  9, TG_ALLY_ALL, 7, EF_SPDUP,   30, 0, 0, 1),
    S("眠りライズ",      0, 'S',  8, TG_FOE_ALL,  8, EF_SLEEP,   60, 0, 0, 1),
    S("影ふみの術",      0, 'S',  9, TG_FOE1,     9, EF_SLEEP,   85, 0, 0, 1),
    S("気力のしずく",    0, 'S',  6, TG_ALLY1,    9, EF_MPPCT,   30, 0, 0, 1),
    S("結界シールド",    0, 'S', 14, TG_ALLY_ALL, 11, EF_DEFUP,   50, 0, 0, 1),
    S("幻影の術",        0, 'S', 10, TG_FOE_ALL, 12, EF_ATKDOWN, 25, EF_DEFDOWN, 25, 1),
    S("時の砂",          0, 'S', 16, TG_FOE_ALL, 15, EF_SLEEP,   80, 0, 0, 1),
    S("勝利の祈り",      0, 'S', 18, TG_ALLY_ALL, 16, EF_REWARD, 50, 0, 0, 1),
    S("虹色のしずく",    0, 'S', 12, TG_ALLY_ALL, 17, EF_MPPCT,  30, 0, 0, 1),
    S("友情の輝き",      0, 'S', 20, TG_ALLY_ALL, 18, EF_ATKUP,  25, EF_DEFUP, 25, 1),
    /* ---- 特技 (P ちから系 / T テクニック系 / H かいふくの特技) ---- */
    S("天然",            1, 'T',  2, TG_FOE1,     1, EF_SLEEP,   60, 0, 0, 1),
    S("コードアタック",  1, 'P',  3, TG_FOE1,     2, EF_DMG,    180, 0, 0, 1),
    S("リカバリー",      1, 'H',  4, TG_ALLY1,    3, EF_HEAL,    60, 0, 0, 1),
    S("落とせ",          1, 'T',  3, TG_FOE1,     3, EF_STEAL,   80, 0, 0, 1),
    S("ひらめき",        1, 'T',  0, TG_SELF,     3, EF_MPPCT,   15, EF_ATKUP, 20, 1),
    S("ぶんどり",        1, 'P',  6, TG_FOE1,     4, EF_DMG,    100, EF_STEAL, 60, 1),
    S("3分の一",         1, 'T',  4, TG_FOE1,     5, EF_PCTDMG,  33, 0, 0, 1),
    S("絶対討伐",        1, 'P',  5, TG_FOE1,     6, EF_CRIT,   100, 0, 0, 1),
    S("デバッグ・ビーム", 1, 'P',  7, TG_FOE_ALL,  6, EF_DMG,     90, 0, 0, 1),
    S("かばう",          1, 'P',  4, TG_SELF,     6, EF_DEFUP,  100, 0, 0, 1),
    S("守りの構え",      1, 'P',  5, TG_SELF,     7, EF_DEFUP,   80, 0, 0, 1),
    S("ノリノリ踊り",    1, 'T',  6, TG_ALLY_ALL, 8, EF_HEAL,    70, 0, 0, 1),
    S("気合い",          1, 'P',  5, TG_SELF,     8, EF_ATKUP,   40, 0, 0, 1),
    S("全力斬り",        1, 'P',  9, TG_FOE1,     9, EF_DMG,    220, 0, 0, 1),
    S("目くらまし",      1, 'T',  6, TG_FOE_ALL,  9, EF_ATKDOWN, 30, 0, 0, 1),
    S("タイムストップ",  1, 'T',  9, TG_FOE_ALL, 10, EF_SLEEP,   70, 0, 0, 1),
    S("集中",            1, 'T',  6, TG_SELF,    10, EF_ATKUP,   50, 0, 0, 1),
    S("はてな？",        1, 'T',  7, TG_FOE1,    10, EF_RANDOM,   0, 0, 0, 1),
    S("電光石火",        1, 'P',  8, TG_FOE1,    11, EF_DMG,     80, 0, 0, 2),
    S("追い風",          1, 'T',  8, TG_ALLY_ALL, 11, EF_SPDUP,  30, 0, 0, 1),
    S("連続パンチ",      1, 'P', 10, TG_FOE1,    12, EF_DMG,     70, 0, 0, 3),
    S("みんな行け",      1, 'P',  8, TG_FOE1,    12, EF_COMBO,   60, 0, 0, 1),
    S("回転アタック",    1, 'P', 10, TG_FOE_ALL, 12, EF_DMG,     85, 0, 0, 1),
    S("星の一撃",        1, 'P', 11, TG_FOE1,    13, EF_DMG,    260, 0, 0, 1),
    S("おうえん",        1, 'T',  7, TG_ALLY1,   13, EF_HEALPCT, 30, 0, 0, 1),
    S("幸運招き",        1, 'T',  5, TG_ALLY_ALL, 13, EF_REWARD, 30, 0, 0, 1),
    S("大ジャンプ",      1, 'P',  9, TG_FOE1,    14, EF_DMG,    200, EF_SLEEP, 30, 1),
    S("まもりの歌",      1, 'T',  9, TG_ALLY_ALL, 14, EF_DEFUP,  35, 0, 0, 1),
    S("一斉射撃",        1, 'P', 12, TG_FOE_ALL, 15, EF_DMG,    100, 0, 0, 1),
    S("弱点看破",        1, 'T',  8, TG_FOE1,    15, EF_DMG,    120, EF_DEFDOWN, 40, 1),
    S("お祭り騒ぎ",      1, 'T', 14, TG_ALLY_ALL, 16, EF_HEALPCT, 25, EF_ATKUP, 20, 1),
    S("全員防御",        1, 'P',  8, TG_ALLY_ALL, 16, EF_DEFUP,  40, 0, 0, 1),
    S("元気玉",          1, 'T', 14, TG_FOE1,    17, EF_DMG,    320, 0, 0, 1),
    S("魔力集中",        1, 'T',  0, TG_SELF,    17, EF_MPPCT,   30, 0, 0, 1),
    S("大逆転",          1, 'P', 12, TG_FOE1,    20, EF_DMG,    300, 0, 0, 1),
    /* ---- 職業のわざ (J) ---- */
    /* 1 エンジニア */
    J("デバッグ・スキャン",   1,  6, TG_FOE_ALL,  1,  5, EF_ATKDOWN, 30, EF_DEFDOWN, 30, 1),
    J("ホットフィックス",     0,  9, TG_ALLY1,    1, 12, EF_HEALPCT, 50, 0, 0, 1),
    J("ロールバック",         0, 20, TG_DEAD1,    1, 21, EF_REVIVE,  60, 0, 0, 1),
    J("フルビルド・ARE",      1, 30, TG_FOE_ALL,  1, 30, EF_DMG,    260, 0, 0, 1),
    /* 2 バトルの達人 */
    J("ばくれつ ラッシュ",    1,  5, TG_FOE1,     2,  5, EF_DMG,     70, 0, 0, 3),
    J("せいしん とういつ",    1,  8, TG_ALLY_ALL, 2, 12, EF_ATKUP,   30, EF_DEFUP, 30, 1),
    J("かわし ぎり",          1, 10, TG_FOE1,     2, 21, EF_CRIT,   110, 0, 0, 1),
    J("ひゃくれつ たつまき",  1, 32, TG_FOE_ALL,  2, 30, EF_DMG,    220, 0, 0, 1),
    /* 3 料理博士 */
    J("ほかほか スープ",      0, 12, TG_ALLY_ALL, 3,  5, EF_HEALPCT, 25, 0, 0, 1),
    J("スパイス ボンバー",    1, 10, TG_FOE_ALL,  3, 12, EF_DMG,    110, 0, 0, 1),
    J("まんぷく ごちそう",    0, 18, TG_ALLY1,    3, 21, EF_HEAL,   999, 0, 0, 1),
    J("フルコース・サプライズ", 1, 34, TG_ALLY_ALL, 3, 30, EF_HEALPCT, 80, EF_ATKUP, 30, 1),
    /* 4 星読み */
    J("ながれぼし",           0,  7, TG_FOE1,     4,  5, EF_MDMG,   150, 0, 0, 1),
    J("ほしの おつげ",        0,  9, TG_ALLY_ALL, 4, 12, EF_ATKUP,   25, EF_MPPCT, 10, 1),
    J("ほしぞら ゆうえい",    0, 18, TG_FOE_ALL,  4, 21, EF_MDMG,   120, EF_SLEEP, 40, 1),
    J("しんぱくの ほしふり",  0, 36, TG_FOE_ALL,  4, 30, EF_MDMG,   260, 0, 0, 1),
    /* 5 ぬいぐるみ使い */
    J("ぬいぐるみ ダイブ",    1,  5, TG_FOE1,     5,  5, EF_DMG,    130, 0, 0, 1),
    J("ふわふわ ガード",      1,  8, TG_ALLY_ALL, 5, 12, EF_DEFUP,   50, 0, 0, 1),
    J("おともだち ぞくぞく",  0, 16, TG_FOE_ALL,  5, 21, EF_DMG,    120, 0, 0, 1),
    J("ぬいぐるみ軍団 そうしゅつげき", 1, 30, TG_FOE_ALL, 5, 30, EF_DMG, 220, EF_ATKUP, 20, 1),
    /* 6 音楽家 */
    J("げんきの ふえ",        0, 10, TG_ALLY_ALL, 6,  6, EF_HEALPCT, 30, 0, 0, 1),
    J("ノリノリ ドラム",      1, 12, TG_ALLY_ALL, 6, 17, EF_ATKUP,   30, EF_DEFUP, 30, 1),
    J("フィナーレ・シンフォニー", 0, 34, TG_FOE_ALL, 6, 30, EF_MDMG, 220, EF_HEALPCT, 30, 1),
    /* 7 お天気博士 */
    J("にわか あめ",          0,  6, TG_FOE_ALL,  7,  6, EF_MDMG,    90, 0, 0, 1),
    J("いなずま ピカッ",      0, 14, TG_FOE1,     7, 17, EF_MDMG,   220, 0, 0, 1),
    J("ハリケーン・ホリデー", 0, 34, TG_FOE_ALL,  7, 30, EF_MDMG,   220, EF_SLEEP, 40, 1),
    /* 8 名探偵 */
    J("ちゅうい ぶかい",      1,  6, TG_FOE_ALL,  8,  6, EF_DEFDOWN, 40, 0, 0, 1),
    J("じけんの かぎ",        1, 12, TG_FOE1,     8, 17, EF_CRIT,   100, 0, 0, 1),
    J("すいり・かんぺき",     1, 30, TG_FOE1,     8, 30, EF_DMG,    500, 0, 0, 1),
    /* 9 手品師 */
    J("ハトが ポン",          1,  5, TG_FOE_ALL,  9,  6, EF_SLEEP,   70, 0, 0, 1),
    J("ぶんしん ショー",      1, 12, TG_FOE1,     9, 17, EF_DMG,     65, 0, 0, 4),
    J("ふしぎな マジック",    0, 32, TG_FOE_ALL,  9, 30, EF_MDMG,   180, EF_HEALPCT, 30, 1),
    /* 10 発明家 */
    J("ビリビリ ボール",      1,  7, TG_FOE1,    10,  6, EF_MDMG,   180, 0, 0, 1),
    J("じどう はんとうき",    1, 13, TG_ALLY1,   10, 17, EF_HEALPCT, 60, 0, 0, 1),
    J("ロボ・アーミー",       1, 32, TG_FOE_ALL, 10, 30, EF_DMG,    200, 0, 0, 1),
};
const int SKILL_COUNT_V3 = (int)(sizeof(SKILLS_V3) / sizeof(SKILLS_V3[0]));

const JobDef JOBS[JOB_COUNT] = {
    { "みならい",         "まだ 職業に ついて いない。",                              100, 100, 100, 100 },
    { "エンジニア",       "しくみを しりつくした 技術者。なんでも こなす。",          95, 100, 105, 110 },
    { "バトルの達人",     "たたかいを きわめた 達人。ちからと ぼうぎょが つよい。", 125, 115, 100,  70 },
    { "料理博士",         "おいしい 料理で みんなを げんきに。かいふくが とくい。",   95, 105,  95, 100 },
    { "星読み",           "星の ながれを よむ 人。まほうが とても つよい。",         70,  85, 105, 150 },
    { "ぬいぐるみ使い",   "ぬいぐるみと たたかう。かわいくて ぼうぎょが かたい。", 100, 130,  90, 100 },
    { "音楽家",           "おんがくで みんなを げんきづける。すばやい。",             85,  95, 115, 115 },
    { "お天気博士",       "あめ・かみなり・あらしを あやつる。まほうが つよい。",     80,  90, 100, 140 },
    { "名探偵",           "よわてんを みぬく。すばやくて かいしんが でる。",         105,  95, 120, 100 },
    { "手品師",           "ふしぎな マジックで てきを まどわせる。すばやさ ばつぐん。", 90, 90, 130, 115 },
    { "発明家",           "へんな どうぐを つぎつぎ はつめい。まほう力が たかい。", 100, 100, 100, 130 },
};

int stat_pct(int base, int pct) {
    long v = (long)base * pct / 100;
    return v < 1 ? 1 : (int)v;
}

int job_need_exp(int lv) {
    if (lv < 0 || lv >= JOB_MAX_LV) return 0;
    return 12 + lv * 6 + lv * lv;
}
int job_level_of(int totalExp) {
    int lv = 0, need = 0;
    if (totalExp < 0) return 0;
    while (lv < JOB_MAX_LV) { need += job_need_exp(lv); if (totalExp < need) break; lv++; }
    return lv;
}
int job_add_exp(SaveData *g, int member, int amount) {
    if (!g || member < 0 || member >= g->partyN || amount <= 0) return 0;
    int job = g->ext.job[member];
    if (job <= 0 || job >= JOB_COUNT) return 0;
    int before = g->ext.jobLv[member][job];
    if (g->ext.jobExp[member][job] > 9999999 - amount) g->ext.jobExp[member][job] = 9999999;
    else g->ext.jobExp[member][job] += amount;
    int lv = job_level_of(g->ext.jobExp[member][job]);
    if (lv < before) lv = before;
    g->ext.jobLv[member][job] = (unsigned char)lv;
    return lv - before;
}
bool job_can_change(const SaveData *g, int member, int job, const char **why) {
    if (!g || member < 0 || member >= g->partyN || job < 0 || job >= JOB_COUNT) { if (why) *why = "えらべない。"; return false; }
    if (g->party[member].level < JOB_MIN_LEVEL) { if (why) *why = "レベル10に なると 転職できる。"; return false; }
    if (g->ext.job[member] == job) { if (why) *why = "もう その 職業に ついている。"; return false; }
    if (why) *why = "";
    return true;
}
bool job_change(SaveData *g, int member, int job) {
    if (!job_can_change(g, member, job, NULL)) return false;
    g->ext.job[member] = (unsigned char)job;
    return true;
}

const char *skill_member_types(int memberId) {
    switch (memberId) {
    case MEM_HERO: return "HAP";
    case MEM_SERA: return "HST";
    case MEM_GAI:  return "APT";
    case MEM_MIO:  return "AST";
    default: return "";
    }
}

static bool type_ok(int memberId, char type) {
    const char *t = skill_member_types(memberId);
    return type != 0 && strchr(t, type) != NULL;
}

bool skill_is_known(const SaveData *g, int member, int idx) {
    if (!g || member < 0 || member >= g->partyN || idx < 0 || idx >= SKILL_COUNT_V3) return false;
    const SkillDef *s = &SKILLS_V3[idx];
    const Member *m = &g->party[member];
    if (s->job >= 0) return s->job < JOB_COUNT && g->ext.jobLv[member][s->job] >= s->learnLv;
    return type_ok(m->id, s->type) && m->level >= s->learnLv;
}
int skill_known(const SaveData *g, int member, int out[], int cap) {
    int n = 0;
    for (int i = 0; i < SKILL_COUNT_V3 && n < cap; i++) if (skill_is_known(g, member, i)) out[n++] = i;
    return n;
}
int skill_learned_at(const SaveData *g, int member, int level, int out[], int cap) {
    int n = 0;
    if (!g || member < 0 || member >= g->partyN) return 0;
    for (int i = 0; i < SKILL_COUNT_V3 && n < cap; i++) {
        const SkillDef *s = &SKILLS_V3[i];
        if (s->job < 0 && s->learnLv == level && type_ok(g->party[member].id, s->type)) out[n++] = i;
    }
    return n;
}
bool skill_is_heal_target(int idx) {
    if (idx < 0 || idx >= SKILL_COUNT_V3) return false;
    int t = SKILLS_V3[idx].target;
    return t == TG_ALLY1 || t == TG_ALLY_ALL || t == TG_SELF || t == TG_DEAD1;
}
bool skill_needs_target(int idx) {
    if (idx < 0 || idx >= SKILL_COUNT_V3) return false;
    int t = SKILLS_V3[idx].target;
    return t == TG_FOE1 || t == TG_ALLY1 || t == TG_DEAD1;
}

static void eff_text(char *buf, size_t size, int e, int p, int hits) {
    char t[64];
    switch (e) {
    case EF_DMG:      if (hits > 1) snprintf(t, sizeof t, "%d回 こうげき", hits); else snprintf(t, sizeof t, "ダメージ"); break;
    case EF_MDMG:     snprintf(t, sizeof t, "まほうダメージ"); break;
    case EF_CRIT:     snprintf(t, sizeof t, "かいしんの 一撃"); break;
    case EF_PCTDMG:   snprintf(t, sizeof t, "HPを 大きく けずる"); break;
    case EF_HEAL:     if (p >= 999) snprintf(t, sizeof t, "HPを ぜんかいふく"); else snprintf(t, sizeof t, "HPを %d かいふく", p); break;
    case EF_HEALPCT:  snprintf(t, sizeof t, "HPを %d%% かいふく", p); break;
    case EF_REVIVE:   snprintf(t, sizeof t, "HP%d%%で ふっかつ", p); break;
    case EF_MPPCT:    snprintf(t, sizeof t, "MPを %d%% かいふく", p); break;
    case EF_ATKUP:    snprintf(t, sizeof t, "こうげき アップ"); break;
    case EF_DEFUP:    snprintf(t, sizeof t, "ぼうぎょ アップ"); break;
    case EF_SPDUP:    snprintf(t, sizeof t, "すばやさ アップ"); break;
    case EF_ATKDOWN:  snprintf(t, sizeof t, "こうげき ダウン"); break;
    case EF_DEFDOWN:  snprintf(t, sizeof t, "ぼうぎょ ダウン"); break;
    case EF_SLEEP:    snprintf(t, sizeof t, "ねむらせる"); break;
    case EF_ESCAPE:   snprintf(t, sizeof t, "かならず にげられる"); break;
    case EF_REWARD:   snprintf(t, sizeof t, "ごほうび アップ"); break;
    case EF_STEAL:    snprintf(t, sizeof t, "ゴールドを うばう"); break;
    case EF_RANDOM:   snprintf(t, sizeof t, "なにが おこるか？"); break;
    case EF_COMBO:    snprintf(t, sizeof t, "みんなで こうげき"); break;
    default: t[0] = 0; break;
    }
    if (!t[0]) return;
    if (buf[0]) strncat(buf, "＋", size - strlen(buf) - 1);
    strncat(buf, t, size - strlen(buf) - 1);
}

void skill_describe(int idx, char *buf, int size) {
    static const char *tg[] = { "てき1体", "てき全体", "なかま1人", "みんな", "じぶん", "たおれた なかま" };
    if (!buf || size < 1) return;
    buf[0] = 0;
    if (idx < 0 || idx >= SKILL_COUNT_V3) return;
    const SkillDef *s = &SKILLS_V3[idx];
    strncat(buf, tg[s->target], (size_t)size - 1);
    strncat(buf, ": ", (size_t)size - strlen(buf) - 1);
    char e[96]; e[0] = 0;
    eff_text(e, sizeof e, s->eff1, s->p1, s->hits);
    eff_text(e, sizeof e, s->eff2, s->p2, 1);
    strncat(buf, e, (size_t)size - strlen(buf) - 1);
}
