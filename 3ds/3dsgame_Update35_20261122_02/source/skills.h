#ifndef SKILLS_H
#define SKILLS_H
/* Update27: 呪文・特技・職業のわざ(ARE QUEST の 一覧から 持ってきた もの)と、職業・おぼえるルール。
 * game.c 非依存の純粋データ/ロジック(Member と SaveData の型だけを使う)。 */
#include "game.h"

/* 対象 */
enum { TG_FOE1, TG_FOE_ALL, TG_ALLY1, TG_ALLY_ALL, TG_SELF, TG_DEAD1 };
/* 効果 */
enum {
    EF_NONE,
    EF_DMG,        /* ちから系ダメージ: こうげき力 x p% */
    EF_MDMG,       /* まほうダメージ: レベルに おうじた まほう力 x p% (ぼうぎょを あまり 受けない) */
    EF_CRIT,       /* かいしんの いちげき: こうげき力 x p% x 2 */
    EF_PCTDMG,     /* てきの いまの HP の p% */
    EF_HEAL,       /* HPを p かいふく(999 = ぜんかいふく) */
    EF_HEALPCT,    /* さいだいHP の p% かいふく */
    EF_REVIVE,     /* たおれた なかまを さいだいHP の p% で ふっかつ */
    EF_MPPCT,      /* さいだいMP の p% かいふく */
    EF_ATKUP, EF_DEFUP, EF_SPDUP,        /* 3ターン p% アップ(みかた) */
    EF_ATKDOWN, EF_DEFDOWN,              /* 3ターン p% ダウン(てき) */
    EF_SLEEP,      /* p% の かくりつで 2ターン うごけなく する */
    EF_ESCAPE,     /* かならず にげられる */
    EF_REWARD,     /* このたたかいの ゴールドと けいけんちが p% ふえる */
    EF_STEAL,      /* てきの ゴールドを うばう */
    EF_RANDOM,     /* なにが おこるか わからない */
    EF_COMBO,      /* みんなで ちからを あわせて こうげき(なかまの こうげき力の ごうけい x p%) */
    EF_COUNT
};

typedef struct {
    const char *name;
    unsigned char kind;   /* 0=呪文 1=特技 */
    char type;            /* 'A'こうげき呪文 'H'かいふく呪文 'S'ほじょ呪文 'P'ちから系の特技 'T'テクニック系の特技 'J'職業のわざ */
    unsigned char mp;
    unsigned char target;
    unsigned char learnLv;   /* おぼえる レベル(職業のわざは 職業レベル) */
    signed char job;         /* 職業のわざなら 職業ID(1〜10)、ふつうは -1 */
    unsigned char eff1; short p1;
    unsigned char eff2; short p2;
    unsigned char hits;      /* れんぞく回数(1〜) */
} SkillDef;

extern const SkillDef SKILLS_V3[];
extern const int SKILL_COUNT_V3;

/* ---- 職業 ---- */
typedef struct { const char *name; const char *desc; int atk, def, spd, mag; } JobDef;   /* 能力は % (100 = ふつう) */
extern const JobDef JOBS[JOB_COUNT];
#define JOB_MIN_LEVEL 10         /* 転職できる キャラクターレベル */
int job_need_exp(int lv);        /* 職業レベル lv -> lv+1 に 必要な 経験値(lv=0..29)。 30 では 0 */
int job_level_of(int totalExp);  /* 経験値から 職業レベル(0〜30) */
/* 経験値を 足す。上がった レベルの 数を 返す */
int job_add_exp(SaveData *g, int member, int amount);
bool job_can_change(const SaveData *g, int member, int job, const char **why);
bool job_change(SaveData *g, int member, int job);

/* ---- キャラごとの タイプ(おぼえる 呪文・特技の しゅるい) ---- */
const char *skill_member_types(int memberId);   /* 主人公 "HAP" / セラ "HST" / ガイ "APT" / ミオ "AST" */

/* ---- おぼえている わざ ---- */
/* メンバー member が いま つかえる わざの 番号(SKILLS_V3 の 添字)を、番号の 小さい 順に out へ。数を返す */
int skill_known(const SaveData *g, int member, int out[], int cap);
bool skill_is_known(const SaveData *g, int member, int idx);
/* 「このレベルで あたらしく おぼえる わざ」(レベルアップの お知らせ用)。何個か out に。数を返す */
int skill_learned_at(const SaveData *g, int member, int level, int out[], int cap);
/* わざの 説明文(1行)を buf に作る */
void skill_describe(int idx, char *buf, int size);
bool skill_is_heal_target(int idx);     /* 味方を 対象に する(かいふく・ほじょ)か */
bool skill_needs_target(int idx);       /* ターゲット選びが 必要か(てき1体 / みかた1人 / たおれた1人) */

/* ---- 能力(職業の補正) ---- */
int stat_pct(int base, int pct);   /* base x pct / 100 (最低1) */
#endif
