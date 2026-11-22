#include "cheat.h"
#include "monster.h"
#include "skills.h"
#include <string.h>
#include <stdio.h>

enum { OP_GOLD, OP_GOLDMAX, OP_COIN, OP_COINMAX, OP_ITEM, OP_ALLITEM, OP_LEVEL, OP_JOB, OP_ALLJOB, OP_HEAL, OP_HP, OP_MP, OP_REVIVE,
       OP_MON, OP_MONALL, OP_MONUP, OP_MONSET, OP_ARENA, OP_WEAPON, OP_ARMOR, OP_ALLEQUIP, OP_ZUKAN, OP_ZUKANALL,
       OP_WARP, OP_SET, OP_RESETMOD, OP_STAT, OP_PACK };
typedef struct { const char *code; const char *name; unsigned char op; int a, b, c; } CheatDef;

#define GOLD_CAP 999999
#define COIN_CAP 999999

static const CheatDef CH[CHEAT_COUNT] = {
    /* ゴールド 6 */
    { "g1k", "ゴールド +1000", OP_GOLD, 1000, 0, 0 },
    { "g5k", "ゴールド +5000", OP_GOLD, 5000, 0, 0 },
    { "g10k", "ゴールド +10000", OP_GOLD, 10000, 0, 0 },
    { "g50k", "ゴールド +50000", OP_GOLD, 50000, 0, 0 },
    { "g100k", "ゴールド +100000", OP_GOLD, 100000, 0, 0 },
    { "gmax", "ゴールドを さいだい(999999)に", OP_GOLDMAX, 0, 0, 0 },
    /* コイン 6 */
    { "c100", "コイン +100", OP_COIN, 100, 0, 0 },
    { "c500", "コイン +500", OP_COIN, 500, 0, 0 },
    { "c1k", "コイン +1000", OP_COIN, 1000, 0, 0 },
    { "c5k", "コイン +5000", OP_COIN, 5000, 0, 0 },
    { "c10k", "コイン +10000", OP_COIN, 10000, 0, 0 },
    { "cmax", "コインを 99999まいに", OP_COINMAX, 0, 0, 0 },
    /* どうぐ 10 */
    { "herb10", "やくそう +10", OP_ITEM, ITEM_HERB, 10, 0 },
    { "herb30", "やくそう +30", OP_ITEM, ITEM_HERB, 30, 0 },
    { "herb99", "やくそうを 99こに", OP_ITEM, ITEM_HERB, 99, 0 },
    { "ether10", "ふしぎな水 +10", OP_ITEM, ITEM_ETHER, 10, 0 },
    { "ether30", "ふしぎな水 +30", OP_ITEM, ITEM_ETHER, 30, 0 },
    { "ether99", "ふしぎな水を 99こに", OP_ITEM, ITEM_ETHER, 99, 0 },
    { "tonic10", "ほしのしずく +10", OP_ITEM, ITEM_TONIC, 10, 0 },
    { "tonic30", "ほしのしずく +30", OP_ITEM, ITEM_TONIC, 30, 0 },
    { "tonic99", "ほしのしずくを 99こに", OP_ITEM, ITEM_TONIC, 99, 0 },
    { "allitem99", "どうぐを ぜんぶ 99こに", OP_ALLITEM, 99, 0, 0 },
    /* レベル 12 */
    { "lv5", "ぜんいん レベル5", OP_LEVEL, 5, 0, 0 },
    { "lv10", "ぜんいん レベル10(転職できる)", OP_LEVEL, 10, 0, 0 },
    { "lv15", "ぜんいん レベル15", OP_LEVEL, 15, 0, 0 },
    { "lv20", "ぜんいん レベル20", OP_LEVEL, 20, 0, 0 },
    { "lv25", "ぜんいん レベル25", OP_LEVEL, 25, 0, 0 },
    { "lv30", "ぜんいん レベル30", OP_LEVEL, 30, 0, 0 },
    { "lv40", "ぜんいん レベル40", OP_LEVEL, 40, 0, 0 },
    { "lv50", "ぜんいん レベル50", OP_LEVEL, 50, 0, 0 },
    { "lv60", "ぜんいん レベル60", OP_LEVEL, 60, 0, 0 },
    { "lv70", "ぜんいん レベル70", OP_LEVEL, 70, 0, 0 },
    { "lv80", "ぜんいん レベル80", OP_LEVEL, 80, 0, 0 },
    { "lv99", "ぜんいん レベル99", OP_LEVEL, 99, 0, 0 },
    /* 職業 4 */
    { "job10", "いまの職業の レベルを 10に", OP_JOB, 10, 0, 0 },
    { "job20", "いまの職業の レベルを 20に", OP_JOB, 20, 0, 0 },
    { "job30", "いまの職業の レベルを 30に", OP_JOB, 30, 0, 0 },
    { "alljob30", "ぜんいんの ぜんぶの職業を レベル30に", OP_ALLJOB, 30, 0, 0 },
    /* かいふく 4 */
    { "heal", "HPと MPを ぜんかいふく", OP_HEAL, 0, 0, 0 },
    { "hp", "HPを ぜんかいふく", OP_HP, 0, 0, 0 },
    { "mp", "MPを ぜんかいふく", OP_MP, 0, 0, 0 },
    { "revive", "たおれた なかまを ふっかつ", OP_REVIVE, 0, 0, 0 },
    /* モンスター 14 */
    { "mon01", "しずくの精を なかまに", OP_MON, 0, 0, 0 },
    { "mon02", "こもれびウサギを なかまに", OP_MON, 1, 0, 0 },
    { "mon03", "ちびコウモリを なかまに", OP_MON, 2, 0, 0 },
    { "mon04", "短剣の山賊を なかまに", OP_MON, 3, 0, 0 },
    { "mon05", "ほうきのおばけを なかまに", OP_MON, 4, 0, 0 },
    { "mon06", "すずりの精を なかまに", OP_MON, 5, 0, 0 },
    { "mon07", "校長の用心棒を なかまに", OP_MON, 6, 0, 0 },
    { "mon08", "がんてつを なかまに", OP_MON, 7, 0, 0 },
    { "mon09", "かげぼうしを なかまに", OP_MON, 8, 0, 0 },
    { "mon10", "やみがらすを なかまに", OP_MON, 9, 0, 0 },
    { "mon11", "ダッシュ王を なかまに", OP_MON, 10, 0, 0 },
    { "monall", "魔物を ぜんしゅるい なかまに", OP_MONALL, 0, 0, 0 },
    { "monup5", "なかまの 魔物の レベル +5", OP_MONUP, 5, 0, 0 },
    { "mon50", "なかまの 魔物を ぜんいん レベル50に", OP_MONSET, 50, 0, 0 },
    /* 格闘場 5 */
    { "arena1", "格闘場の ランクを 2つめまで ひらく", OP_ARENA, 1, 0, 0 },
    { "arena2", "格闘場の ランクを 3つめまで ひらく", OP_ARENA, 2, 0, 0 },
    { "arena3", "格闘場の ランクを 4つめまで ひらく", OP_ARENA, 3, 0, 0 },
    { "arena4", "格闘場の ランクを 5つめまで ひらく", OP_ARENA, 4, 0, 0 },
    { "arena5", "格闘場の ランクを ぜんぶ ひらく", OP_ARENA, 5, 0, 0 },
    /* そうび 7 */
    { "weapon1", "ぶき1を もらう", OP_WEAPON, 1, 0, 0 },
    { "weapon2", "ぶき2を もらう", OP_WEAPON, 2, 0, 0 },
    { "weapon3", "ぶき3を もらう", OP_WEAPON, 3, 0, 0 },
    { "armor1", "ぼうぐ1を もらう", OP_ARMOR, 1, 0, 0 },
    { "armor2", "ぼうぐ2を もらう", OP_ARMOR, 2, 0, 0 },
    { "armor3", "ぼうぐ3を もらう", OP_ARMOR, 3, 0, 0 },
    { "allequip", "ぶき・ぼうぐを ぜんぶ もらう", OP_ALLEQUIP, 0, 0, 0 },
    /* ずかん 2 */
    { "zukan", "ずかんに ぜんぶの 魔物が のる(見た)", OP_ZUKAN, 0, 0, 0 },
    { "zukanall", "ずかんを ぜんぶ なかまずみに", OP_ZUKANALL, 0, 0, 0 },
    /* ワープ 9 (あんぜんな 場所へ) */
    { "warp1", "ひなた村へ", OP_WARP, AREA_HINATA, 12, 7 },
    { "warp2", "ひだまり公園へ", OP_WARP, AREA_PLAZA, 12, 12 },
    { "warp3", "ひなた原っぱへ", OP_WARP, AREA_FIELD, 1, 7 },
    { "warp4", "みつば園へ", OP_WARP, AREA_KINDER, 12, 12 },
    { "warp5", "町ミルフィへ", OP_WARP, AREA_MILFI, 11, 8 },
    { "warp6", "学び舎へ", OP_WARP, AREA_SCHOOL, 12, 12 },
    { "warp7", "勤勉の像の庭へ", OP_WARP, AREA_STATUE, 12, 13 },
    { "warp8", "山里クロモリへ", OP_WARP, AREA_KUROMORI, 12, 13 },
    { "warp9", "星あかりの洞くつへ", OP_WARP, AREA_CAVE, 1, 7 },
    /* スイッチ 11 */
    { "noenc", "魔物と であわなくなる", OP_SET, 11, 1, 0 },
    { "enc", "魔物と であう ふつうに もどす", OP_SET, 11, 0, 0 },
    { "god", "むてき(戦闘で ダメージを うけない)", OP_SET, 12, 1, 0 },
    { "mortal", "むてきを やめる", OP_SET, 12, 0, 0 },
    { "exp2", "けいけんち 2ばい", OP_SET, 13, 2, 0 },
    { "exp3", "けいけんち 3ばい", OP_SET, 13, 3, 0 },
    { "exp1", "けいけんち ふつうに もどす", OP_SET, 13, 0, 0 },
    { "gold2", "戦闘の ゴールド 2ばい", OP_SET, 14, 2, 0 },
    { "gold3", "戦闘の ゴールド 3ばい", OP_SET, 14, 3, 0 },
    { "gold1", "戦闘の ゴールドを ふつうに もどす", OP_SET, 14, 0, 0 },
    { "resetmod", "チートの スイッチを ぜんぶ もどす", OP_RESETMOD, 0, 0, 0 },
    /* のうりょく 5 */
    { "maxhp50", "ぜんいんの さいだいHP +50", OP_STAT, 0, 50, 0 },
    { "maxmp20", "ぜんいんの さいだいMP +20", OP_STAT, 1, 20, 0 },
    { "atkup", "ぜんいんの こうげき +5", OP_STAT, 2, 5, 0 },
    { "defup", "ぜんいんの ぼうぎょ +5", OP_STAT, 3, 5, 0 },
    { "spdup", "ぜんいんの すばやさ +5", OP_STAT, 4, 5, 0 },
    /* セット 5 */
    { "pack1", "ぼうけんセット(どうぐ +30・5000G)", OP_PACK, 1, 0, 0 },
    { "pack2", "つよくてニューゲーム(Lv30・そうび・50000G)", OP_PACK, 2, 0, 0 },
    { "pack3", "カジノセット(コイン5000・5000G)", OP_PACK, 3, 0, 0 },
    { "pack4", "牧場セット(魔物5体 Lv20)", OP_PACK, 4, 0, 0 },
    { "pack5", "ぜんぶのせ(ほぼ ぜんぶ さいだい)", OP_PACK, 5, 0, 0 },
};

int cheat_count(void) { return CHEAT_COUNT; }
const char *cheat_code(int i) { return (i >= 0 && i < CHEAT_COUNT) ? CH[i].code : ""; }
const char *cheat_name(int i) { return (i >= 0 && i < CHEAT_COUNT) ? CH[i].name : ""; }

int cheat_find(const char *input) {
    char b[CHEAT_CODE_MAX + 2]; int n = 0;
    if (!input) return -1;
    while (*input == ' ' || *input == '\t') input++;
    for (; *input && n < CHEAT_CODE_MAX + 1; input++) {
        char c = *input;
        if (c >= 'A' && c <= 'Z') c = (char)(c - 'A' + 'a');
        b[n++] = c;
    }
    while (n > 0 && (b[n - 1] == ' ' || b[n - 1] == '\t' || b[n - 1] == '\r' || b[n - 1] == '\n')) n--;
    if (n <= 0 || n > CHEAT_CODE_MAX) return -1;
    b[n] = 0;
    for (int i = 0; i < CHEAT_COUNT; i++) if (strcmp(CH[i].code, b) == 0) return i;
    return -1;
}

static int clampi(int v, int lo, int hi) { return v < lo ? lo : v > hi ? hi : v; }
static void add_gold(SaveData *g, int n) { g->gold = clampi(g->gold + n, 0, GOLD_CAP); }
static void add_coin(SaveData *g, int n) { g->ext.coins = clampi(g->ext.coins + n, 0, COIN_CAP); }
static void add_item(SaveData *g, int it, int n) { if (it >= 0 && it < ITEM_COUNT) g->items[it] = clampi(g->items[it] + n, 0, 99); }
static void heal_all(SaveData *g) { for (int i = 0; i < g->partyN; i++) { g->party[i].hp = g->party[i].maxhp; g->party[i].mp = g->party[i].maxmp; } }

static void set_level_all(SaveData *g, int lv) {
    lv = clampi(lv, 1, 99);
    for (int i = 0; i < g->partyN && i < MAX_PARTY; i++) {
        Member *m = &g->party[i];
        if (m->id < 0 || m->id >= MEM_COUNT) continue;
        char name[NAME_LEN]; memcpy(name, m->name, sizeof(name));
        int id = m->id;
        game_member_init(m, id, lv);
        memcpy(m->name, name, sizeof(name)); m->name[NAME_LEN - 1] = 0;
        m->hp = m->maxhp; m->mp = m->maxmp; m->exp = 0;
    }
}
static int job_cum(int lv) { int t = 0; for (int l = 0; l < lv && l < JOB_MAX_LV; l++) t += job_need_exp(l); return t; }
static void set_job_lv(SaveData *g, int mem, int job, int lv) {
    if (mem < 0 || mem >= MAX_PARTY || job < 1 || job >= JOB_COUNT) return;
    lv = clampi(lv, 0, JOB_MAX_LV);
    if (g->ext.jobLv[mem][job] < lv) g->ext.jobLv[mem][job] = (unsigned char)lv;
    int need = job_cum(lv);
    if (g->ext.jobExp[mem][job] < need) g->ext.jobExp[mem][job] = need;
}
static bool give_mon(SaveData *g, int enemy, int lv) {
    if (enemy < 0 || enemy >= ENEMY_COUNT) return false;
    if (lv < 1) lv = 1;
    return mon_add(&g->ext, enemy, clampi(lv, 1, 99)) >= 0;
}
static void give_all_equip(SaveData *g) {
    for (int i = 1; i < WEAPON_COUNT; i++) if (g->ext.eq.ownedWeapon[i] < 1) g->ext.eq.ownedWeapon[i] = 1;
    for (int i = 1; i < ARMOR_COUNT; i++) if (g->ext.eq.ownedArmor[i] < 1) g->ext.eq.ownedArmor[i] = 1;
}
static void give_all_mon(SaveData *g) {
    for (int e = 0; e < ENEMY_COUNT && e < ENEMY_MAX; e++) if (!give_mon(g, e, ENEMIES[e].lv)) break;
}
static void stat_up(SaveData *g, int which, int n) {
    for (int i = 0; i < g->partyN && i < MAX_PARTY; i++) {
        Member *m = &g->party[i];
        switch (which) {
        case 0: m->maxhp = clampi(m->maxhp + n, 1, 9999); m->hp = clampi(m->hp + n, 0, m->maxhp); break;
        case 1: m->maxmp = clampi(m->maxmp + n, 0, 999); m->mp = clampi(m->mp + n, 0, m->maxmp); break;
        case 2: m->atk = clampi(m->atk + n, 1, 999); break;
        case 3: m->def = clampi(m->def + n, 1, 999); break;
        default: m->spd = clampi(m->spd + n, 1, 999); break;
        }
    }
}
static void run_pack(SaveData *g, int n) {
    switch (n) {
    case 1: for (int i = 0; i < ITEM_COUNT; i++) add_item(g, i, 30); add_gold(g, 5000); break;
    case 2: set_level_all(g, 30); add_gold(g, 50000); give_all_equip(g); break;
    case 3: add_coin(g, 5000); add_gold(g, 5000); break;
    case 4: for (int e = 0; e < 5 && e < ENEMY_COUNT; e++) if (!give_mon(g, e, 20)) break; break;
    default:
        g->gold = GOLD_CAP; g->ext.coins = clampi(99999, 0, COIN_CAP);
        for (int i = 0; i < ITEM_COUNT; i++) g->items[i] = 99;
        set_level_all(g, 99); give_all_equip(g); give_all_mon(g);
        for (int e = 0; e < ENEMY_COUNT && e < ENEMY_MAX; e++) g->ext.seen[e] = 2;
        for (int m = 0; m < g->partyN && m < MAX_PARTY; m++) for (int j = 1; j < JOB_COUNT; j++) set_job_lv(g, m, j, JOB_MAX_LV);
        break;
    }
}

CheatResult cheat_apply_index(SaveData *g, int i) {
    CheatResult r; memset(&r, 0, sizeof(r));
    if (!g || i < 0 || i >= CHEAT_COUNT) { snprintf(r.msg, sizeof(r.msg), "そんな コードは ないよ。"); return r; }
    const CheatDef *c = &CH[i];
    r.ok = true;
    switch (c->op) {
    case OP_GOLD: add_gold(g, c->a); break;
    case OP_GOLDMAX: g->gold = GOLD_CAP; break;
    case OP_COIN: add_coin(g, c->a); break;
    case OP_COINMAX: g->ext.coins = 99999 > g->ext.coins ? 99999 : g->ext.coins; break;
    case OP_ITEM: if (c->b >= 99) { if (g->items[c->a] < 99) g->items[c->a] = 99; } else add_item(g, c->a, c->b); break;
    case OP_ALLITEM: for (int k = 0; k < ITEM_COUNT; k++) g->items[k] = clampi(c->a, 0, 99); break;
    case OP_LEVEL: set_level_all(g, c->a); break;
    case OP_JOB: {
        int n = 0;
        for (int m = 0; m < g->partyN && m < MAX_PARTY; m++) if (g->ext.job[m] > 0) { set_job_lv(g, m, g->ext.job[m], c->a); n++; }
        if (n == 0) { r.ok = false; snprintf(r.msg, sizeof(r.msg), "だれも 職業に ついていないよ。まず 転職しよう。"); return r; }
        break; }
    case OP_ALLJOB: for (int m = 0; m < g->partyN && m < MAX_PARTY; m++) for (int j = 1; j < JOB_COUNT; j++) set_job_lv(g, m, j, c->a); break;
    case OP_HEAL: heal_all(g); break;
    case OP_HP: for (int k = 0; k < g->partyN; k++) g->party[k].hp = g->party[k].maxhp; break;
    case OP_MP: for (int k = 0; k < g->partyN; k++) g->party[k].mp = g->party[k].maxmp; break;
    case OP_REVIVE: for (int k = 0; k < g->partyN; k++) if (g->party[k].hp <= 0) g->party[k].hp = g->party[k].maxhp; break;
    case OP_MON:
        if (!give_mon(g, c->a, ENEMIES[c->a].lv)) { r.ok = false; snprintf(r.msg, sizeof(r.msg), "ぼくじょうが いっぱいだよ！"); return r; }
        break;
    case OP_MONALL: give_all_mon(g); break;
    case OP_MONUP: for (int k = 0; k < g->ext.monN; k++) g->ext.mon[k].level = (unsigned char)clampi(g->ext.mon[k].level + c->a, 1, 99); break;
    case OP_MONSET: for (int k = 0; k < g->ext.monN; k++) g->ext.mon[k].level = (unsigned char)clampi(c->a, 1, 99); break;
    case OP_ARENA: if (g->ext.arenaRank < c->a) g->ext.arenaRank = clampi(c->a, 0, ARENA_RANKS - 1); break;
    case OP_WEAPON: if (c->a > 0 && c->a < WEAPON_COUNT && g->ext.eq.ownedWeapon[c->a] < 1) g->ext.eq.ownedWeapon[c->a] = 1; break;
    case OP_ARMOR: if (c->a > 0 && c->a < ARMOR_COUNT && g->ext.eq.ownedArmor[c->a] < 1) g->ext.eq.ownedArmor[c->a] = 1; break;
    case OP_ALLEQUIP: give_all_equip(g); break;
    case OP_ZUKAN: for (int e = 0; e < ENEMY_COUNT && e < ENEMY_MAX; e++) if (g->ext.seen[e] < 1) g->ext.seen[e] = 1; break;
    case OP_ZUKANALL: for (int e = 0; e < ENEMY_COUNT && e < ENEMY_MAX; e++) g->ext.seen[e] = 2; break;
    case OP_WARP:
        if (c->a < 0 || c->a >= AREA_COUNT) { r.ok = false; snprintf(r.msg, sizeof(r.msg), "そこへは いけないよ。"); return r; }
        g->area = c->a; g->px = c->b; g->py = c->c; r.warped = true; break;
    case OP_SET: if (c->a >= 11 && c->a <= 14) g->ext.reserved[c->a] = c->b; break;
    case OP_RESETMOD: for (int k = 11; k <= 14; k++) g->ext.reserved[k] = 0; break;
    case OP_STAT: stat_up(g, c->a, c->b); break;
    case OP_PACK: run_pack(g, c->a); break;
    default: r.ok = false; break;
    }
    if (r.ok) snprintf(r.msg, sizeof(r.msg), "コード「%s」: %s", c->code, c->name);
    return r;
}

CheatResult cheat_apply(SaveData *g, const char *input) {
    int i = cheat_find(input);
    if (i < 0) { CheatResult r; memset(&r, 0, sizeof(r)); snprintf(r.msg, sizeof(r.msg), "そんな コードは ないよ。(ABCは 大文字でも だいじょうぶ)"); return r; }
    return cheat_apply_index(g, i);
}
