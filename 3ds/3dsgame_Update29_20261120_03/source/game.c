/* game.c - ほしあかり英雄譚 本体: シーン管理・マップ・バトル・メニュー・セーブ */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdarg.h>
#include "platform.h"
#include "game.h"
#include "help.h"
#include "shop.h"
#include "skills.h"
#include "monster.h"
#include "battle_ai.h"

/* ================= 定数・状態 ================= */
#define TILE 16
#define FS 0.5f      /* 本体フォントの倍率(全角1文字≒15px) */
#define LH 20        /* 行間 */
#define WRAP_HALF 40 /* 1行の最大幅(半角単位: 全角=2) */

typedef enum { SC_TITLE, SC_NAME, SC_SCRIPT, SC_MAP, SC_MENU, SC_BATTLE, SC_DEDUCT, SC_CARD, SC_GAMEOVER, SC_FAC } Scene;
typedef enum { MN_TOP, MN_ITEM, MN_ITEM_TARGET, MN_STATUS, MN_MSG, MN_SPELL_M, MN_SPELL_L, MN_SPELL_T, MN_SC_SLOT, MN_SC_PICK } MenuState;
typedef enum { PH_COMMAND, PH_SKILL, PH_ITEM, PH_TARGET, PH_ITEM_TARGET, PH_ETARGET, PH_RESOLVE, PH_END } Phase;
typedef enum { ACT_ATTACK, ACT_SKILL, ACT_ITEM, ACT_RUN, ACT_GUARD, ACT_SCOUT } ActType;

/* Update27: わざの 一覧は skills.c に ひっこし。ここは セーブの Member.skill の 検査用の 数だけ のこす */
#define SKILL_COUNT 4

static SaveData G;
static Scene scene = SC_TITLE;
static bool g_quit;
static bool g_quitAsk; /* STARTの終了確認を表示中 */
static unsigned g_rng = 1;
static int g_cursor;       /* 汎用カーソル */
static char g_hint[96];    /* 画面下の一言 */

/* Update23: ヘルプ・自動セーブ・歩き・エンカウントの安全歩数 */
static bool g_help;           /* ヘルプ表示中 */
static int g_helpPage;
static bool g_helpAsk;        /* 「安全な場所にもどる」確認中 */
static int g_toast;           /* 一言メッセージ(オートセーブなど)の残りフレーム */
static char g_toastMsg[80] = "オートセーブ しました";
static void toast(const char *m) { snprintf(g_toastMsg, sizeof(g_toastMsg), "%s", m); g_toast = 90; }
static bool g_autoPending;    /* 場所を変えたあと、落ち着いたらセーブする */
static int g_hold;            /* 十字キーを おしつづけている フレーム数 */
static int g_ff;              /* 会話はやおくりのカウンタ */
static int g_safeSteps;       /* 戦闘のあと、この歩数はエンカウントしない */
static bool g_newAsk2;
static int g_face;            /* 主人公の向き 0=下 1=上 2=左 3=右(ここに移動) */

/* スクリプト実行 */
static int s_id = -1, s_step;
static char s_who[48], s_text[256];
static int s_cardChapter;

/* ひらめき(推理)場面 */
static int d_id, d_cursor, d_state; /* 0:選択 1:不正解 2:正解 */

/* メニュー */
static MenuState m_state; static int m_cursor, m_item;
static int m_sc, m_pick;   /* ショートカット設定: えらんでいる 枠 / わざ */
static bool m_direct;      /* ショートカットで ひらいた(とじたら マップへ) */
static char m_msg[96];

/* バトル */
typedef struct { ActType type; bool enemy; int who; int arg; int target; } Action;
static struct {
    int n, def[3], hp[3];
    bool boss, scripted;
    Phase phase; int cur;   /* 現在コマンド入力中の味方 */
    int cursor, sub;
    Action cmd[MAX_PARTY]; Action queue[MAX_PARTY + 3]; int qn, qi;
    char msg[3][96]; int msgN;
    bool guard[MAX_PARTY];
    int gainExp, gainGold; bool won, fled, lost;
    /* Update27 */
    int pmod[MAX_PARTY][3], pmodT[MAX_PARTY];   /* みかたの ステータス変化(こうげき/ぼうぎょ/すばやさ の %)と のこりターン */
    int emod[3][2], emodT[3];                    /* てきの ダウン(こうげき/ぼうぎょ の %)と のこりターン */
    int esleep[3]; bool eguard[3], scouted[3];
    int rewardPct, turn;
    int known[200], nknown;                      /* 「とくぎ」メニューの 一覧 */
} B;

/* ================= 乱数・ユーティリティ ================= */
void game_seed(unsigned s) { g_rng = s ? s : 1; }
static unsigned rnd(void) { g_rng = g_rng * 1664525u + 1013904223u; return g_rng >> 8; }
static int rn(int n) { return (int)(rnd() % (unsigned)n); }
SaveData *game_data(void) { return &G; }
static bool goal_marker(int *mx, int *my);
static void fac_open(int kind);
bool game_test_goal_marker(int *x, int *y) { int a, b; if (!x) x = &a; if (!y) y = &b; return goal_marker(x, y); }
void game_test_open_facility(int kind) { fac_open(kind); }
void game_test_reset_to_title(void) { scene = SC_TITLE; s_id = -1; B.n = 0; g_help = false; g_helpAsk = false; g_quitAsk = false; g_newAsk2 = false; g_autoPending = false; g_toast = 0; }
int game_hero_dir(void) { return g_face; }
int game_hero_step(void) { return G.steps == 0 ? 0 : 1 + (G.steps & 1); }
bool game_quit_requested(void) { return g_quit; }
const char *game_scene_name(void) {
    static const char *n[] = { "title", "name", "script", "map", "menu", "battle", "deduct", "card", "gameover", "fac" };
    return n[scene];
}

static void subst(char *dst, size_t sz, const char *src) {
    size_t o = 0;
    for (; *src && o + 1 < sz; ) {
        if (src[0] == '%' && src[1] == 'N') {
            const char *nm = G.party[0].name;
            while (*nm && o + 1 < sz) dst[o++] = *nm++;
            src += 2;
        } else dst[o++] = *src++;
    }
    dst[o] = 0;
}

static int u8len(unsigned char c) { return c < 0x80 ? 1 : c < 0xE0 ? 2 : c < 0xF0 ? 3 : 4; }

/* 文字列を半角単位で折り返す。戻り値は行数 */
static int wrap(const char *s, char out[][128], int maxLines) {
    int n = 0, w = 0; size_t o = 0; out[0][0] = 0;
    while (*s) {
        if (*s == '\n') { out[n][o] = 0; if (++n >= maxLines) return n; o = 0; w = 0; out[n][0] = 0; s++; continue; }
        int len = u8len((unsigned char)*s), cw = len == 1 ? 1 : 2;
        if (w + cw > WRAP_HALF) { out[n][o] = 0; if (++n >= maxLines) return n; o = 0; w = 0; }
        if (o + (size_t)len < 127) { memcpy(out[n] + o, s, (size_t)len); o += (size_t)len; out[n][o] = 0; }
        w += cw; s += len;
    }
    return n + 1;
}

/* ================= キャラ・成長 ================= */
int game_exp_needed(int level) { return 8 * level + level * level * 2; }
int game_calc_damage(int atk, int def, int rnd100) {
    int base = atk - def / 2;
    if (base < 1) base = 1;
    int d = base * (85 + (rnd100 % 31)) / 100; /* 85%〜115% */
    if (d < 1) d = 1;
    return d;
}
void game_member_init(Member *m, int id, int level) {
    static const struct { const char *name; int hp, mp, atk, def, spd, skill; } base[MEM_COUNT] = {
        { "主人公", 24, 6, 8, 3, 6, 1 }, { "セラ", 20, 10, 5, 3, 7, 2 },
        { "ガイ", 26, 6, 9, 4, 5, 3 }, { "ミオ", 22, 12, 4, 3, 8, 2 }
    };
    memset(m, 0, sizeof(*m));
    strncpy(m->name, base[id].name, NAME_LEN - 1);
    m->id = id; m->level = 1;
    m->maxhp = base[id].hp; m->maxmp = base[id].mp; m->atk = base[id].atk;
    m->def = base[id].def; m->spd = base[id].spd; m->skill = base[id].skill;
    for (int l = 1; l < level; l++) {
        m->level++; m->maxhp += 6; m->maxmp += 2; m->atk += 2; m->def += 1; m->spd += 1;
    }
    m->hp = m->maxhp; m->mp = m->maxmp;
}
bool game_add_exp(Member *m, int amount) {
    bool up = false;
    m->exp += amount;
    while (m->level < 99 && m->exp >= game_exp_needed(m->level)) {
        m->exp -= game_exp_needed(m->level);
        m->level++; m->maxhp += 6; m->maxmp += 2; m->atk += 2; m->def += 1; m->spd += 1;
        m->hp = m->maxhp; m->mp = m->maxmp; up = true;
    }
    return up;
}

void game_set_name(const char *n) {
    if (!n || !n[0]) return;
    /* 8文字までを、文字の途中で切らずにコピーする */
    size_t o = 0; int chars = 0;
    while (*n && chars < 8 && o + 4 < NAME_LEN) {
        int len = u8len((unsigned char)*n);
        for (int i = 0; i < len && n[i]; i++) G.party[0].name[o++] = n[i];
        n += len; chars++;
    }
    G.party[0].name[o] = 0;
}

static void ext_default(ExtData *e) {
    memset(e, 0, sizeof(*e));
    equip_init(&e->eq);
}

void game_init(void) {
    memset(&G, 0, sizeof(G));
    ext_default(&G.ext);
    G.magic = SAVE_MAGIC; G.version = SAVE_VERSION;
    game_member_init(&G.party[0], MEM_HERO, 1); G.partyN = 1;
    G.items[ITEM_HERB] = 1;
    G.area = AREA_HINATA; G.px = 12; G.py = 7; G.chapter = 1; G.gold = 0;
}

bool game_save(void) { G.magic = SAVE_MAGIC; G.version = SAVE_VERSION; return plat_save_write(&G, sizeof(G)); }
/* Update27: v2 のセーブ(拡張データなし)を、そのまま よみこめるようにする */
typedef struct {
    unsigned magic, version;
    Member party[MAX_PARTY]; int partyN;
    int items[ITEM_COUNT];
    unsigned char flags[MAX_FLAGS];
    int area, px, py, chapter, gold, steps;
    unsigned playFrames;
} SaveDataV2;

static bool ext_valid(const ExtData *e, int partyN) {
    for (int i = 0; i < MAX_PARTY; i++) {
        if (e->job[i] >= JOB_COUNT) return false;
        for (int j = 0; j < JOB_COUNT; j++) if (e->jobLv[i][j] > JOB_MAX_LV || e->jobExp[i][j] < 0) return false;
    }
    if (e->coins < 0 || e->coins > 9999999 || e->monN < 0 || e->monN > MON_BOX || e->arenaRank < 0 || e->arenaWins < 0) return false;
    for (int i = 0; i < e->monN; i++) if (e->mon[i].enemy >= ENEMY_COUNT || e->mon[i].level < 1 || e->mon[i].level > 99 || e->mon[i].exp < 0) return false;
    for (int i = 0; i < ENEMY_MAX; i++) if (e->seen[i] > 2) return false;
    (void)partyN;
    return true;
}

bool game_load(void) {
    SaveData t;
    if (!plat_save_read(&t, sizeof(t))) {
        SaveDataV2 o;
        if (!plat_save_read(&o, sizeof(o)) || o.magic != SAVE_MAGIC || o.version != 2) return false;
        memset(&t, 0, sizeof(t));
        memcpy(&t, &o, sizeof(o));          /* 先頭の ぶぶんは そのまま 同じ */
        ext_default(&t.ext);
        t.version = SAVE_VERSION;
    }
    if (t.magic != SAVE_MAGIC || t.version != SAVE_VERSION) return false;
    if (!ext_valid(&t.ext, t.partyN)) return false;
    if (t.area < 0 || t.area >= AREA_COUNT || t.partyN < 1 || t.partyN > MAX_PARTY) return false;
    for (int i = 0; i < t.partyN; i++) {
        const Member *m = &t.party[i];
        if (m->skill < 0 || m->skill >= SKILL_COUNT || m->level < 1 || m->level > 99 ||
            m->maxhp < 1 || m->hp < 0 || m->hp > m->maxhp || m->mp < 0 || m->mp > m->maxmp) return false;
    }
    if (t.px < 0 || t.py < 0 || t.px >= AREAS[t.area].w || t.py >= AREAS[t.area].h) return false;
    for (int i = 0; i < ITEM_COUNT; i++) if (t.items[i] < 0) return false;
    G = t; return true;
}

/* ================= マップ ================= */
static const Area *cur_area(void) { return &AREAS[G.area]; }
static char tile_at(const Area *a, int x, int y) {
    if (x < 0 || y < 0 || x >= a->w || y >= a->h) return '#';
    return a->rows[y][x];
}
bool game_is_walkable(const Area *a, int x, int y) {
    char t = tile_at(a, x, y);
    return !(t == '#' || t == 'H' || t == 'R' || t == 'W' || t == 'T' || t == 'S' || t == 'B');
}
static bool flag(int f) { return f < 0 ? true : G.flags[f] != 0; }
static const Npc *npc_at(const Area *a, int x, int y) {
    for (int i = 0; i < a->nNpc; i++) {
        const Npc *n = &a->npc[i];
        if (n->x == x && n->y == y && flag(n->needFlag) && !(n->hideFlag >= 0 && flag(n->hideFlag))) return n;
    }
    return NULL;
}

static void script_start(int id);
static void battle_start(int group, bool scripted);

static void change_area(int area, int x, int y) { G.area = area; G.px = x; G.py = y; g_autoPending = true; }

/* 立ち位置のイベント判定(トリガー・ワープ・宝箱・エンカウント)。イベントが起きたらtrue */
static bool check_tile(bool stepped) {
    const Area *a = cur_area();
    for (int i = 0; i < a->nTrig; i++) {
        const Trigger *t = &a->trig[i];
        if (t->x == G.px && t->y == G.py && flag(t->reqFlag) && !(t->onceFlag >= 0 && G.flags[t->onceFlag])) {
            script_start(t->script); return true;
        }
    }
    for (int i = 0; i < a->nWarp; i++) {
        const Warp *w = &a->warp[i];
        if (w->x == G.px && w->y == G.py) {
            if (!flag(w->reqFlag)) {
                /* 通れない: 1歩戻して案内 */
                if (G.py == 13 || G.py == 14) G.py--; else if (G.px == 0) G.px++; else G.px--;
                script_start(w->blockedScript); return true;
            }
            change_area(w->toArea, w->tx, w->ty);
            return check_tile(false) ? true : false;
        }
    }
    if (stepped && a->encounters) {
        char t = tile_at(a, G.px, G.py);
        int chance = (t == '^') ? 10 : 4; /* % (Update23: 少しへらした) */
        if (g_safeSteps > 0) { g_safeSteps--; chance = 0; }
        if (chance > 0 && rn(100) < chance) {
            int g = a->encGroupA + rn(a->encGroupB - a->encGroupA + 1);
            battle_start(g, false); return true;
        }
    }
    return false;
}

static void try_move(int dx, int dy) {
    const Area *a = cur_area();
    int nx = G.px + dx, ny = G.py + dy;
    g_face = dy > 0 ? 0 : dy < 0 ? 1 : dx < 0 ? 2 : 3;
    if (!game_is_walkable(a, nx, ny) || npc_at(a, nx, ny)) return;
    G.px = nx; G.py = ny; G.steps++;
    check_tile(true);
}

static void interact(void) {
    const Area *a = cur_area();
    static const int dxs[4] = { 0, 0, -1, 1 }, dys[4] = { -1, 1, 0, 0 };
    for (int d = 0; d < 4; d++) {
        int x = G.px + dxs[d], y = G.py + dys[d];
        const Npc *n = npc_at(a, x, y);
        if (n) { script_start(n->script); return; }
        if (tile_at(a, x, y) == 'T') {
            script_start(G.flags[F_GOT_HERB_CHEST] ? S_CHEST_EMPTY : S_CHEST_HERB); return;
        }
    }
}

/* ================= スクリプト ================= */
static void fac_open(int kind);
static void script_end(void) {
    s_id = -1;
    scene = SC_MAP;
}

static void script_advance(void) {
    for (;;) {
        if (s_id < 0) return;
        if (s_step >= SCRIPT_LEN[s_id]) { script_end(); return; }
        const Step *s = &SCRIPTS[s_id][s_step];
        switch (s->t) {
        case ST_LINE:
            subst(s_who, sizeof(s_who), s->who ? s->who : "");
            subst(s_text, sizeof(s_text), s->text ? s->text : "");
            s_step++; scene = SC_SCRIPT; return;
        case ST_SETFLAG: if (s->a >= 0 && s->a < MAX_FLAGS) G.flags[s->a] = 1; s_step++; break;
        case ST_GIVE: if (s->a >= 0 && s->a < ITEM_COUNT) G.items[s->a] += s->b; s_step++; break;
        case ST_JOIN:
            if (G.partyN < MAX_PARTY) { game_member_init(&G.party[G.partyN], s->a, G.party[0].level); G.partyN++; }
            s_step++; break;
        case ST_HEAL:
            for (int i = 0; i < G.partyN; i++) { G.party[i].hp = G.party[i].maxhp; G.party[i].mp = G.party[i].maxmp; }
            s_step++; break;
        case ST_WARP: change_area(s->a, (s->b >> 8) & 0xFF, s->b & 0xFF); s_step++; break;
        case ST_BATTLE: s_step++; battle_start(s->a, true); return;
        case ST_DEDUCT: s_step++; d_id = s->a; d_cursor = 0; d_state = 0; scene = SC_DEDUCT; return;
        case ST_CHAPTER: s_step++; s_cardChapter = s->a; G.chapter = s->a; scene = SC_CARD; return;
        case ST_OPEN: s_step++; s_id = -1; fac_open(s->a); return;
        case ST_END: script_end(); return;
        }
    }
}

static void script_start(int id) {
    s_id = id; s_step = 0; script_advance();
}

/* ================= バトル (Update27: 呪文・特技・スカウト・職業・ステータス変化) ================= */
static void bmsg_clear(void) { B.msgN = 0; }
static void bmsg(const char *fmt, ...) __attribute__((format(printf, 1, 2)));
static void bmsg(const char *fmt, ...) {
    char buf[96]; va_list ap; va_start(ap, fmt); vsnprintf(buf, sizeof(buf), fmt, ap); va_end(ap);
    if (B.msgN >= 3) { memmove(B.msg[0], B.msg[1], 96); memmove(B.msg[1], B.msg[2], 96); B.msgN = 2; }
    snprintf(B.msg[B.msgN], sizeof(B.msg[B.msgN]), "%s", buf); B.msgN++;
}

static bool enemies_alive(void) { for (int i = 0; i < B.n; i++) if (B.hp[i] > 0) return true; return false; }
static bool party_alive(void) { for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) return true; return false; }
static int enemies_left(void) { int n = 0; for (int i = 0; i < B.n; i++) if (B.hp[i] > 0) n++; return n; }
static int next_enemy(int from, int dir) { for (int k = 1; k <= B.n; k++) { int i = ((from + dir * k) % B.n + B.n) % B.n; if (B.hp[i] > 0) return i; } return from; }
static int first_enemy(void) { for (int i = 0; i < B.n; i++) if (B.hp[i] > 0) return i; return -1; }
static int next_cmd_member(int from) { for (int i = from; i < G.partyN; i++) if (G.party[i].hp > 0) return i; return -1; }
static int first_dead_member(void) { for (int i = 0; i < G.partyN; i++) if (G.party[i].hp <= 0) return i; return -1; }

/* ---- 能力(職業・そうび・ステータス変化を ふくめた 戦闘用の 数字) ---- */
static int job_pct(int member, int which) {
    int j = G.ext.job[member]; if (j < 0 || j >= JOB_COUNT) j = 0;
    const JobDef *d = &JOBS[j];
    return which == 0 ? d->atk : which == 1 ? d->def : which == 2 ? d->spd : d->mag;
}
static int eff_atk(int i) {
    int v = stat_pct(equip_total_atk(&G, &G.ext.eq, i), job_pct(i, 0));
    if (B.pmodT[i] > 0) v = v * (100 + B.pmod[i][0]) / 100;
    return v < 1 ? 1 : v;
}
static int eff_def(int i) {
    int v = stat_pct(equip_total_def(&G, &G.ext.eq, i), job_pct(i, 1));
    if (B.pmodT[i] > 0) v = v * (100 + B.pmod[i][1]) / 100;
    return v < 0 ? 0 : v;
}
static int eff_spd(int i) {
    int v = stat_pct(equip_total_spd(&G, &G.ext.eq, i), job_pct(i, 2));
    if (B.pmodT[i] > 0) v = v * (100 + B.pmod[i][2]) / 100;
    return v < 1 ? 1 : v;
}
static int eff_mag(int i) { return stat_pct(G.party[i].level * 3 + 8, job_pct(i, 3)); }
static int e_atk(int j) { int v = ENEMIES[B.def[j]].atk; if (B.emodT[j] > 0) v = v * (100 - B.emod[j][0]) / 100; return v < 1 ? 1 : v; }
static int e_def(int j) { int v = ENEMIES[B.def[j]].def; if (B.emodT[j] > 0) v = v * (100 - B.emod[j][1]) / 100; return v < 0 ? 0 : v; }

static void battle_start(int group, bool scripted) {
    memset(&B, 0, sizeof(B));
    const EnemyGroup *g = &GROUPS[group];
    B.n = g->n; B.scripted = scripted;
    for (int i = 0; i < B.n; i++) {
        B.def[i] = g->id[i]; B.hp[i] = ENEMIES[g->id[i]].hp;
        if (ENEMIES[g->id[i]].boss) B.boss = true;
        if (B.def[i] < ENEMY_MAX && G.ext.seen[B.def[i]] == 0) G.ext.seen[B.def[i]] = 1;   /* 図鑑に のる */
    }
    g_safeSteps = 8; /* 戦闘のあとは しばらく 出ない */
    B.phase = PH_COMMAND; B.cur = next_cmd_member(0);
    bmsg("%sが あらわれた！", ENEMIES[B.def[0]].name);
    scene = SC_BATTLE;
}

static void queue_sort(void) {
    /* 素早さの高い順(単純挿入ソート) */
    for (int i = 1; i < B.qn; i++) {
        Action a = B.queue[i]; int j = i - 1;
        int sa = a.enemy ? ENEMIES[B.def[a.who]].spd : eff_spd(a.who);
        while (j >= 0) {
            int sj = B.queue[j].enemy ? ENEMIES[B.def[B.queue[j].who]].spd : eff_spd(B.queue[j].who);
            if (sj >= sa) break;
            B.queue[j + 1] = B.queue[j]; j--;
        }
        B.queue[j + 1] = a;
    }
}

static void build_queue(void) {
    B.qn = 0; B.qi = 0;
    for (int i = 0; i < G.partyN; i++) {
        if (G.party[i].hp <= 0) continue;
        B.queue[B.qn++] = B.cmd[i];
    }
    for (int i = 0; i < B.n; i++) {
        if (B.hp[i] <= 0) continue;
        Action a = { ACT_ATTACK, true, i, 0, 0 };
        B.queue[B.qn++] = a;
    }
    queue_sort();
    memset(B.guard, 0, sizeof(B.guard));
    bmsg_clear();
    B.phase = PH_RESOLVE;
}

/* 1ラウンドが おわったときの 後しまつ(ステータス変化の ターンを へらす) */
static void end_round(void) {
    for (int i = 0; i < MAX_PARTY; i++) if (B.pmodT[i] > 0 && --B.pmodT[i] == 0) memset(B.pmod[i], 0, sizeof(B.pmod[i]));
    for (int j = 0; j < 3; j++) {
        if (B.emodT[j] > 0 && --B.emodT[j] == 0) memset(B.emod[j], 0, sizeof(B.emod[j]));
        B.eguard[j] = false;
    }
    B.turn++;
}

static int pick_party_target(void) {
    int cnt = 0, idx[MAX_PARTY];
    for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) idx[cnt++] = i;
    return cnt ? idx[rn(cnt)] : 0;
}

/* レベルアップで あたらしく おぼえた わざを おしらせ */
static void announce_new_skills(int member, int lvFrom, int lvTo) {
    char names[96]; names[0] = 0; int cnt = 0;
    for (int lv = lvFrom + 1; lv <= lvTo; lv++) {
        int out[8], n = skill_learned_at(&G, member, lv, out, 8);
        for (int i = 0; i < n; i++) {
            if (cnt < 3) {
                if (names[0]) strncat(names, "・", sizeof(names) - strlen(names) - 1);
                strncat(names, SKILLS_V3[out[i]].name, sizeof(names) - strlen(names) - 1);
            }
            cnt++;
        }
    }
    if (cnt > 0) bmsg("%sは 「%s」%sを おぼえた！", G.party[member].name, names, cnt > 3 ? "など" : "");
}

static void battle_victory(void) {
    int exp = 0, gold = 0, scouted = 0;
    for (int i = 0; i < B.n; i++) {
        if (B.scouted[i]) { scouted++; continue; }
        exp += ENEMIES[B.def[i]].exp; gold += ENEMIES[B.def[i]].gold;
    }
    exp = exp * (100 + B.rewardPct) / 100; gold = gold * (100 + B.rewardPct) / 100;
    B.gainExp = exp; B.gainGold = gold; G.gold += gold; if (G.gold > 999999) G.gold = 999999;
    bmsg_clear();
    if (exp == 0 && gold == 0 && scouted > 0) bmsg("スカウトに せいこう！ なかまが ふえた！");
    else bmsg("%sを たおした！ けいけんち%d ゴールド%d", ENEMIES[B.def[0]].name, exp, gold);
    for (int i = 0; i < G.partyN; i++) {
        if (G.party[i].hp <= 0) continue;
        int before = G.party[i].level;
        if (game_add_exp(&G.party[i], exp)) {
            bmsg("%sは レベル%dに あがった！", G.party[i].name, G.party[i].level);
            announce_new_skills(i, before, G.party[i].level);
        }
        int jb = G.ext.job[i], jlv = G.ext.jobLv[i][jb];
        if (jb > 0 && job_add_exp(&G, i, exp) > 0) {
            int now = G.ext.jobLv[i][jb];
            bmsg("%sの 職業レベルが %dに あがった！", G.party[i].name, now);
            for (int l = jlv + 1; l <= now; l++)
                for (int k = 0; k < SKILL_COUNT_V3; k++)
                    if (SKILLS_V3[k].job == jb && SKILLS_V3[k].learnLv == l) bmsg("「%s」を おぼえた！", SKILLS_V3[k].name);
        }
    }
    B.won = true; B.phase = PH_END;
}

static bool is_foe_effect(int e) {
    return e == EF_DMG || e == EF_MDMG || e == EF_CRIT || e == EF_PCTDMG || e == EF_ATKDOWN || e == EF_DEFDOWN || e == EF_SLEEP || e == EF_STEAL || e == EF_COMBO || e == EF_RANDOM;
}

static void buff_member(int t, int which, int pct) {
    if (G.party[t].hp <= 0) return;
    if (B.pmodT[t] <= 0) memset(B.pmod[t], 0, sizeof(B.pmod[t]));
    if (pct > B.pmod[t][which]) B.pmod[t][which] = pct;
    B.pmodT[t] = 3;
}

/* 効果を 1つ ぶん 実行する。tg は 対象の 添字(てき or みかた)の 列 */
static void apply_effect(int who, int eff, int p, int hits, const int *tg, int nt) {
    Member *m = &G.party[who];
    switch (eff) {
    case EF_DMG: case EF_MDMG: case EF_CRIT: case EF_PCTDMG: case EF_COMBO: {
        for (int k = 0; k < nt; k++) {
            int t = tg[k]; if (B.hp[t] <= 0) continue;
            const EnemyDef *e = &ENEMIES[B.def[t]];
            int total = 0; bool crit = false;
            for (int h = 0; h < hits && B.hp[t] > 0; h++) {
                int d;
                if (eff == EF_MDMG) d = game_calc_damage(eff_mag(who) * p / 100, e_def(t) / 2, rn(100));
                else if (eff == EF_PCTDMG) { d = B.hp[t] * p / 100; if (e->boss) d /= 2; if (d < 1) d = 1; }
                else if (eff == EF_COMBO) { int sum = 0; for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) sum += eff_atk(i); d = game_calc_damage(sum * p / 100, e_def(t), rn(100)); }
                else {
                    d = game_calc_damage(eff_atk(who) * p / 100, e_def(t), rn(100));
                    if (eff == EF_CRIT) { d *= 2; crit = true; }
                    else if (rn(16) == 0) { d = d * 18 / 10; crit = true; }
                }
                if (B.eguard[t]) d = (d + 1) / 2;
                if (d < 1) d = 1;
                B.hp[t] -= d; if (B.hp[t] < 0) B.hp[t] = 0;
                total += d;
            }
            if (nt <= 1) bmsg("%s%sに %dの ダメージ！", crit ? "かいしんの いちげき！ " : "", e->name, total);
            if (B.hp[t] <= 0) bmsg("%sを たおした！", e->name);
        }
        if (nt > 1) bmsg("てきぜんたいに ダメージ！");
        break; }
    case EF_SLEEP:
        for (int k = 0; k < nt; k++) {
            int t = tg[k]; if (B.hp[t] <= 0) continue;
            int chance = ENEMIES[B.def[t]].boss ? p / 2 : p;
            if (rn(100) < chance) { B.esleep[t] = 2; bmsg("%sは ねむってしまった！", ENEMIES[B.def[t]].name); }
            else bmsg("%sには ききめが なかった。", ENEMIES[B.def[t]].name);
        }
        break;
    case EF_ATKDOWN: case EF_DEFDOWN:
        for (int k = 0; k < nt; k++) {
            int t = tg[k]; if (B.hp[t] <= 0) continue;
            if (B.emodT[t] <= 0) memset(B.emod[t], 0, sizeof(B.emod[t]));
            B.emod[t][eff == EF_ATKDOWN ? 0 : 1] = p; B.emodT[t] = 3;
        }
        bmsg("%sが さがった！", eff == EF_ATKDOWN ? "てきの こうげきりょく" : "てきの ぼうぎょりょく");
        break;
    case EF_STEAL:
        for (int k = 0; k < nt; k++) {
            int t = tg[k]; if (B.hp[t] <= 0) continue;
            int g = ENEMIES[B.def[t]].gold * p / 100; if (g < 1) g = 1;
            G.gold += g; if (G.gold > 999999) G.gold = 999999;
            bmsg("%sから %dゴールド うばった！", ENEMIES[B.def[t]].name, g);
        }
        break;
    case EF_HEAL: case EF_HEALPCT:
        for (int k = 0; k < nt; k++) {
            Member *x = &G.party[tg[k]]; if (x->hp <= 0) continue;
            int amount = eff == EF_HEAL ? (p >= 999 ? x->maxhp : p) : x->maxhp * p / 100;
            int before = x->hp; x->hp += amount; if (x->hp > x->maxhp) x->hp = x->maxhp;
            if (nt <= 1) bmsg("%sの HPが %d かいふくした！", x->name, x->hp - before);
        }
        if (nt > 1) bmsg("みんなの HPが かいふくした！");
        break;
    case EF_REVIVE:
        for (int k = 0; k < nt; k++) {
            Member *x = &G.party[tg[k]]; if (x->hp > 0) continue;
            x->hp = x->maxhp * p / 100; if (x->hp < 1) x->hp = 1;
            bmsg("%sが ふっかつした！", x->name);
        }
        break;
    case EF_MPPCT:
        for (int k = 0; k < nt; k++) {
            Member *x = &G.party[tg[k]]; if (x->hp <= 0) continue;
            x->mp += x->maxmp * p / 100; if (x->mp > x->maxmp) x->mp = x->maxmp;
        }
        bmsg("MPが かいふくした！");
        break;
    case EF_ATKUP: case EF_DEFUP: case EF_SPDUP:
        for (int k = 0; k < nt; k++) buff_member(tg[k], eff == EF_ATKUP ? 0 : eff == EF_DEFUP ? 1 : 2, p);
        bmsg("%sが あがった！", eff == EF_ATKUP ? "こうげきりょく" : eff == EF_DEFUP ? "ぼうぎょりょく" : "すばやさ");
        break;
    case EF_ESCAPE:
        if (B.boss) bmsg("にげられない！");
        else { bmsg("%sたちは にげだした！", m->name); B.fled = true; }
        break;
    case EF_REWARD:
        B.rewardPct += p; if (B.rewardPct > 100) B.rewardPct = 100;
        bmsg("ごほうびが ふえそうだ！");
        break;
    case EF_RANDOM: {
        int all[3], na = 0, foes[3], nf = 0;
        for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0 && na < 3) all[na++] = i;
        for (int i = 0; i < B.n && nf < 3; i++) if (B.hp[i] > 0) foes[nf++] = i;
        switch (rn(4)) {
        case 0: apply_effect(who, EF_DMG, 300, 1, nt ? tg : foes, nt ? nt : nf); break;
        case 1: apply_effect(who, EF_HEALPCT, 40, 1, all, na); break;
        case 2: apply_effect(who, EF_ATKUP, 40, 1, all, na); break;
        default: apply_effect(who, EF_SLEEP, 70, 1, foes, nf); break;
        }
        break; }
    default: break;
    }
}

static void exec_skill(int who, int idx, int target) {
    Member *m = &G.party[who];
    if (idx < 0 || idx >= SKILL_COUNT_V3 || !skill_is_known(&G, who, idx)) { bmsg("%sは わざを おもいだせない！", m->name); return; }
    const SkillDef *s = &SKILLS_V3[idx];
    if (m->mp < s->mp) { bmsg("%sは MPが たりない！", m->name); return; }
    m->mp -= s->mp;
    bmsg(s->kind == 0 ? "%sは %sを となえた！" : "%sの %s！", m->name, s->name);
    int tg[8], nt = 0; bool foeSide = false;
    switch (s->target) {
    case TG_FOE1: { int t = target; if (t < 0 || t >= B.n || B.hp[t] <= 0) t = first_enemy(); if (t >= 0) { tg[nt++] = t; } foeSide = true; break; }
    case TG_FOE_ALL: for (int i = 0; i < B.n; i++) if (B.hp[i] > 0 && nt < 8) tg[nt++] = i; foeSide = true; break;
    case TG_ALLY1: { int t = target; if (t < 0 || t >= G.partyN || G.party[t].hp <= 0) t = who; tg[nt++] = t; break; }
    case TG_ALLY_ALL: for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) tg[nt++] = i; break;
    case TG_SELF: tg[nt++] = who; break;
    case TG_DEAD1: { int t = target; if (t < 0 || t >= G.partyN || G.party[t].hp > 0) t = first_dead_member(); if (t >= 0) tg[nt++] = t; break; }
    }
    if (nt == 0) { bmsg("しかし だれも いない……"); return; }
    for (int pass = 0; pass < 2; pass++) {
        int e = pass == 0 ? s->eff1 : s->eff2, p = pass == 0 ? s->p1 : s->p2;
        if (!e) continue;
        int hits = pass == 0 ? s->hits : 1;
        bool foeEff = is_foe_effect(e);
        if (foeEff == foeSide) apply_effect(who, e, p, hits, tg, nt);
        else if (foeEff) { int f[8], nf = 0; for (int i = 0; i < B.n && nf < 8; i++) if (B.hp[i] > 0) f[nf++] = i; apply_effect(who, e, p, hits, f, nf); }
        else { int a[MAX_PARTY], na = 0; for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) a[na++] = i; apply_effect(who, e, p, hits, a, na); }
    }
}

static void enemy_act(int j) {
    const EnemyDef *e = &ENEMIES[B.def[j]];
    if (B.hp[j] <= 0) return;
    if (B.esleep[j] > 0) { B.esleep[j]--; bmsg("%sは ねむっている……", e->name); return; }
    BattleAct act = bt_enemy_choose((EnemyPattern)e->pat, B.turn, B.hp[j], e->hp);
    if (act == BA_HEAL && B.hp[j] < e->hp) {
        int h = e->hp / 5; B.hp[j] += h; if (B.hp[j] > e->hp) B.hp[j] = e->hp;
        bmsg("%sは きずを いやした！", e->name); return;
    }
    if (act == BA_GUARD) { B.eguard[j] = true; bmsg("%sは みを かためた！", e->name); return; }
    if (act == BA_WAIT) { bmsg("%sは ようすを みている。", e->name); return; }
    int power = act == BA_STRONG ? 160 : 100;
    int t = pick_party_target();
    int atk = e_atk(j) * power / 100;
    if (B.guard[t]) atk = atk / 2;
    int d = game_calc_damage(atk, eff_def(t), rn(100));
    G.party[t].hp -= d; if (G.party[t].hp < 0) G.party[t].hp = 0;
    bmsg(power > 100 ? "%sの つよい こうげき！" : "%sの こうげき！", e->name);
    bmsg("%sは %dの ダメージを うけた！", G.party[t].name, d);
    if (G.party[t].hp <= 0) bmsg("%sは たおれた……", G.party[t].name);
}

static void exec_action(const Action *a) {
    bmsg_clear();
    if (a->enemy) { enemy_act(a->who); return; }
    Member *m = &G.party[a->who];
    if (m->hp <= 0) return;
    switch (a->type) {
    case ACT_ATTACK: {
        int t = a->target; if (t < 0 || t >= B.n || B.hp[t] <= 0) t = first_enemy();
        if (t < 0) return;
        const EnemyDef *e = &ENEMIES[B.def[t]];
        int d = game_calc_damage(eff_atk(a->who), e_def(t), rn(100));
        bool crit = rn(16) == 0; if (crit) d = d * 18 / 10;
        if (B.eguard[t]) d = (d + 1) / 2;
        B.hp[t] -= d; if (B.hp[t] < 0) B.hp[t] = 0;
        bmsg("%sの こうげき！", m->name);
        bmsg("%s%sに %dの ダメージ！", crit ? "かいしんの いちげき！ " : "", e->name, d);
        if (B.hp[t] <= 0) bmsg("%sを たおした！", e->name);
        break; }
    case ACT_SKILL: exec_skill(a->who, a->arg, a->target); break;
    case ACT_SCOUT: {
        int t = a->target; if (t < 0 || t >= B.n || B.hp[t] <= 0) t = first_enemy();
        if (t < 0) return;
        const EnemyDef *e = &ENEMIES[B.def[t]];
        int chance = scout_chance(B.def[t], B.hp[t], e->hp);
        bmsg("%sは %sを スカウトした！", m->name, e->name);
        if (chance <= 0) bmsg("しかし %sは なかまに ならない……", e->name);
        else if (G.ext.monN >= MON_BOX) bmsg("しかし ぼくじょうが いっぱいだ！");
        else if (rn(100) < chance) {
            mon_add(&G.ext, B.def[t], e->lv);
            B.hp[t] = 0; B.scouted[t] = true;
            bmsg("%sが なかまに なった！", e->name);
        } else bmsg("%sは しらんぷりを している。", e->name);
        break; }
    case ACT_ITEM: {
        int it = a->arg, t = a->target;
        if (it < 0 || it >= ITEM_COUNT || G.items[it] <= 0) { bmsg("%sは どうぐを もっていない！", m->name); break; }
        if (t < 0 || t >= G.partyN) t = a->who;
        G.items[it]--;
        if (it == ITEM_HERB) { G.party[t].hp += 30; if (G.party[t].hp > G.party[t].maxhp) G.party[t].hp = G.party[t].maxhp; bmsg("%sは やくそうを つかった！ HPが かいふくした！", G.party[t].name); }
        else if (it == ITEM_TONIC) { G.party[t].hp += 60; if (G.party[t].hp > G.party[t].maxhp) G.party[t].hp = G.party[t].maxhp; bmsg("%sは ほしのしずくを つかった！ HPが おおきく かいふくした！", G.party[t].name); }
        else { G.party[t].mp += 10; if (G.party[t].mp > G.party[t].maxmp) G.party[t].mp = G.party[t].maxmp; bmsg("%sは ふしぎな水を つかった！ MPが かいふくした！", G.party[t].name); }
        break; }
    case ACT_GUARD:
        B.guard[a->who] = true; bmsg("%sは みを まもっている。", m->name); break;
    case ACT_RUN:
        if (B.boss) { bmsg("にげられない！"); }
        else if (rn(100) < 60) { bmsg("%sたちは にげだした！", m->name); B.fled = true; }
        else bmsg("しかし まわりこまれてしまった！");
        break;
    }
}

static void battle_next_command(void) {
    int n = next_cmd_member(B.cur + 1);
    if (n >= 0) { B.cur = n; B.phase = PH_COMMAND; B.cursor = 0; }
    else build_queue();
}

static void battle_update(unsigned k) {
    switch (B.phase) {
    case PH_COMMAND: {
        /* 2列 x 3行: 0こうげき 1とくぎ / 2どうぐ 3にげる / 4スカウト */
        static const int DN[5] = { 2, 3, 4, 1, 0 }, UPV[5] = { 4, 3, 0, 1, 2 };
        if (k & PK_DOWN) B.cursor = DN[B.cursor];
        if (k & PK_UP) B.cursor = UPV[B.cursor];
        if ((k & (PK_LEFT | PK_RIGHT)) && B.cursor != 4) B.cursor ^= 1;
        if (k & PK_A) {
            Action *c = &B.cmd[B.cur]; memset(c, 0, sizeof(*c)); c->who = B.cur; c->target = first_enemy();
            switch (B.cursor) {
            case 0: c->type = ACT_ATTACK;
                if (enemies_left() >= 2) { B.phase = PH_ETARGET; B.cursor = first_enemy(); }
                else battle_next_command();
                break;
            case 1:
                B.nknown = skill_known(&G, B.cur, B.known, 200); B.sub = 0;
                if (B.nknown > 0) B.phase = PH_SKILL; else { bmsg_clear(); bmsg("まだ とくぎや じゅもんを おぼえていない。"); }
                break;
            case 2: B.phase = PH_ITEM; B.sub = 0; break;
            case 3: c->type = ACT_RUN; battle_next_command(); break;
            case 4: c->type = ACT_SCOUT;
                if (enemies_left() >= 2) { B.phase = PH_ETARGET; B.cursor = first_enemy(); }
                else battle_next_command();
                break;
            }
        }
        if ((k & PK_B) && B.cur > 0) { /* 一つ前の味方のコマンドに戻る */
            for (int i = B.cur - 1; i >= 0; i--) if (G.party[i].hp > 0) { B.cur = i; break; }
        }
        break; }
    case PH_SKILL: {
        const Member *m = &G.party[B.cur];
        if (B.nknown <= 0) { B.phase = PH_COMMAND; break; }
        if (k & PK_UP) B.sub = (B.sub + B.nknown - 1) % B.nknown;
        if (k & PK_DOWN) B.sub = (B.sub + 1) % B.nknown;
        if (k & PK_LEFT) B.sub = (B.sub + B.nknown - 4) % B.nknown;    /* 4つ まえへ */
        if (k & PK_RIGHT) B.sub = (B.sub + 4) % B.nknown;              /* 4つ さきへ */
        if (k & PK_B) { B.phase = PH_COMMAND; B.cursor = 1; }
        if (k & PK_A) {
            int idx = B.known[B.sub]; const SkillDef *s = &SKILLS_V3[idx];
            if (m->mp < s->mp) { bmsg_clear(); bmsg("MPが たりない！"); break; }
            Action *c = &B.cmd[B.cur]; c->type = ACT_SKILL; c->arg = idx; c->target = first_enemy();
            if (s->target == TG_FOE1 && enemies_left() >= 2) { B.phase = PH_ETARGET; B.cursor = first_enemy(); }
            else if (s->target == TG_ALLY1) { B.phase = PH_TARGET; B.cursor = B.cur; }
            else if (s->target == TG_DEAD1) {
                int d = first_dead_member();
                if (d < 0) { bmsg_clear(); bmsg("ふっかつできる なかまが いない。"); break; }
                B.phase = PH_TARGET; B.cursor = d;
            }
            else battle_next_command();
        }
        break; }
    case PH_ITEM: {
        if (k & PK_UP) B.sub = (B.sub + ITEM_COUNT - 1) % ITEM_COUNT;
        if (k & PK_DOWN) B.sub = (B.sub + 1) % ITEM_COUNT;
        if (k & PK_B) B.phase = PH_COMMAND;
        if (k & PK_A) {
            if (G.items[B.sub] <= 0) break;
            Action *c = &B.cmd[B.cur]; c->type = ACT_ITEM; c->arg = B.sub;
            B.phase = PH_ITEM_TARGET; B.cursor = B.cur;
        }
        break; }
    case PH_TARGET: case PH_ITEM_TARGET: {
        if (k & PK_UP) B.cursor = (B.cursor + G.partyN - 1) % G.partyN;
        if (k & PK_DOWN) B.cursor = (B.cursor + 1) % G.partyN;
        if (k & PK_B) B.phase = PH_COMMAND;
        if (k & PK_A) {
            const Member *tg = &G.party[B.cursor];
            if (B.phase == PH_ITEM_TARGET) {
                int it = B.cmd[B.cur].arg;
                bool useless = ((it == ITEM_HERB || it == ITEM_TONIC) && tg->hp >= tg->maxhp) || (it == ITEM_ETHER && tg->mp >= tg->maxmp);
                if (useless) { bmsg_clear(); bmsg("いまは つかっても いみがない。"); break; }
            } else if (B.cmd[B.cur].type == ACT_SKILL) {
                const SkillDef *s = &SKILLS_V3[B.cmd[B.cur].arg];
                if (s->target == TG_DEAD1 && tg->hp > 0) { bmsg_clear(); bmsg("その なかまは たおれていない。"); break; }
                if (s->target == TG_ALLY1 && tg->hp <= 0) { bmsg_clear(); bmsg("その なかまは たおれている。"); break; }
            }
            B.cmd[B.cur].target = B.cursor; battle_next_command();
        }
        break; }
    case PH_ETARGET: {
        if (B.hp[B.cursor] <= 0) B.cursor = first_enemy();
        if (k & (PK_UP | PK_LEFT)) B.cursor = next_enemy(B.cursor, -1);
        if (k & (PK_DOWN | PK_RIGHT)) B.cursor = next_enemy(B.cursor, 1);
        if (k & PK_B) { B.phase = PH_COMMAND; B.cursor = 0; }
        if (k & PK_A) { B.cmd[B.cur].target = B.cursor; battle_next_command(); }
        break; }
    case PH_RESOLVE: {
        if (!(k & PK_A)) break;
        if (B.fled) { scene = SC_MAP; return; }
        if (!enemies_alive()) { battle_victory(); break; }
        if (!party_alive()) { B.lost = true; B.phase = PH_END; bmsg_clear(); bmsg("%sたちは ちからつきた……", G.party[0].name); break; }
        if (B.qi >= B.qn) { end_round(); B.phase = PH_COMMAND; B.cur = next_cmd_member(0); B.cursor = 0; bmsg_clear(); break; }
        Action a = B.queue[B.qi++];
        exec_action(&a);
        if (B.fled) break;
        break; }
    case PH_END: {
        if (!(k & PK_A)) break;
        if (B.lost) { scene = SC_GAMEOVER; return; }
        if (B.scripted) { scene = SC_SCRIPT; script_advance(); }
        else { scene = SC_MAP; g_autoPending = true; }
        break; }
    }
}

/* ================= 描画ヘルパー ================= */
static void panel(int x, int y, int w, int h) {
    plat_rect(x, y, w, h, 230, 230, 240);
    plat_rect(x + 2, y + 2, w - 4, h - 4, 24, 28, 60);
}
static void text_lines(int x, int y, const char *s, int maxLines, unsigned char r, unsigned char g, unsigned char b) {
    char lines[8][128];
    if (maxLines > 8) maxLines = 8;
    int n = wrap(s, lines, maxLines);
    for (int i = 0; i < n; i++) plat_text(x, y + i * LH, FS, r, g, b, lines[i]);
}
static void cursor_mark(int x, int y) { plat_text(x, y, FS, 255, 220, 80, "▶"); }

static void tile_color(char t, unsigned char *r, unsigned char *g, unsigned char *b) {
    switch (t) {
    case '#': *r = 20; *g = 90; *b = 40; break;
    case 'H': *r = 150; *g = 90; *b = 60; break;
    case 'R': *r = 200; *g = 80; *b = 120; break;
    case 'W': *r = 40; *g = 90; *b = 200; break;
    case 'T': *r = 230; *g = 190; *b = 40; break;
    case 'S': *r = 230; *g = 200; *b = 70; break;
    case 'B': *r = 140; *g = 100; *b = 70; break;
    case '.': *r = 205; *g = 185; *b = 140; break;
    case '=': *r = 120; *g = 90; *b = 60; break;
    case 'F': *r = 240; *g = 140; *b = 190; break;
    case '^': *r = 40; *g = 130; *b = 50; break;
    default: *r = 90; *g = 190; *b = 90; break;
    }
}

/* Update25: いまの目的の場所に「！」を出す。目的が ほかの場所に あるときは、その場所へ つづく 出口に出す。
 * 出口は、いま通れる出口(reqFlag が たっている)だけを使って、場所どうしを たどって えらぶ */
static bool goal_marker(int *mx, int *my) {
    int ga, gx, gy;
    if (!help_goal_info(G.chapter, G.flags, &ga, &gx, &gy)) return false;
    if (ga == G.area) {
        /* Update27: そこに 見える NPC・きっかけ・出口が あるときだけ「！」を出す(なにも ない 場所に 出さない) */
        const Area *ar = &AREAS[ga];
        bool found = false;
        for (int i = 0; i < ar->nNpc && !found; i++) { const Npc *n = &ar->npc[i]; if (n->x == gx && n->y == gy && (n->needFlag < 0 || flag(n->needFlag)) && (n->hideFlag < 0 || !flag(n->hideFlag))) found = true; }
        for (int i = 0; i < ar->nTrig && !found; i++) { const Trigger *t = &ar->trig[i]; if (t->x == gx && t->y == gy && (t->reqFlag < 0 || flag(t->reqFlag)) && (t->onceFlag < 0 || !flag(t->onceFlag))) found = true; }
        for (int i = 0; i < ar->nWarp && !found; i++) if (ar->warp[i].x == gx && ar->warp[i].y == gy) found = true;
        if (!found) return false;
        *mx = gx; *my = gy; return true;
    }
    if (ga < 0 || ga >= AREA_COUNT_ENUM || G.area < 0 || G.area >= AREA_COUNT_ENUM) return false;
    int firstX[AREA_COUNT_ENUM], firstY[AREA_COUNT_ENUM], seen[AREA_COUNT_ENUM], q[AREA_COUNT_ENUM], qh = 0, qt = 0;
    for (int i = 0; i < AREA_COUNT_ENUM; i++) { seen[i] = 0; firstX[i] = firstY[i] = -1; }
    seen[G.area] = 1; q[qt++] = G.area;
    while (qh < qt) {
        int a = q[qh++];
        const Area *ar = &AREAS[a];
        for (int i = 0; i < ar->nWarp; i++) {
            const Warp *w = &ar->warp[i];
            if (w->toArea < 0 || w->toArea >= AREA_COUNT_ENUM || seen[w->toArea]) continue;
            if (w->reqFlag >= 0 && !flag(w->reqFlag) && w->toArea != ga) continue;   /* 通れない出口は つかわない(目的地への出口だけは ひらいて いなくても 知らせる) */
            seen[w->toArea] = 1;
            if (a == G.area) { firstX[w->toArea] = w->x; firstY[w->toArea] = w->y; }
            else { firstX[w->toArea] = firstX[a]; firstY[w->toArea] = firstY[a]; }
            q[qt++] = w->toArea;
        }
    }
    if (!seen[ga] || firstX[ga] < 0) return false;
    *mx = firstX[ga]; *my = firstY[ga];
    return true;
}
static void draw_goal_marker(void) {
    int mx, my;
    if (!goal_marker(&mx, &my)) return;
    int bob = (G.playFrames / 12) % 2 ? 2 : 0;   /* ぴょこぴょこ うごく */
    int x = mx * TILE + 3, y = my * TILE - 15 + bob;
    if (y < 0) y = my * TILE + 12;
    plat_text(x + 1, y + 1, 0.6f, 0, 0, 0, "！");
    plat_text(x, y, 0.6f, 255, 225, 40, "！");
}

/* Update23: 右上の「こまったら SELECT」(上画面)。マップ・戦闘の上画面で呼ぶ */
static void draw_help_hint(void) {
    plat_rect(TOP_W - 150, 0, 150, 18, 230, 230, 240);
    plat_rect(TOP_W - 148, 2, 146, 14, 120, 30, 30);
    plat_text(TOP_W - 144, 1, 0.4f, 255, 255, 255, "こまったら SELECT");
}
static void draw_toast(void) {
    if (g_toast > 0) plat_text(150, 4, 0.4f, 160, 255, 160, g_toastMsg);
}
static void draw_goal(int y) {
    char buf[160];
    snprintf(buf, sizeof(buf), "もくてき: %s", help_goal(G.chapter, G.area, G.flags));
    text_lines(10, y, buf, 2, 255, 230, 130);
}
static void draw_help(void) {
    const char *ln[HELP_MAX_LINES];
    int n = help_lines(g_helpPage, G.chapter, G.area, G.flags, ln);
    char buf[160], lines[4][128];
    plat_screen(SCR_TOP, 20, 24, 60);
    panel(6, 6, TOP_W - 12, TOP_H - 12);
    snprintf(buf, sizeof(buf), "%s  (%d/%d)", help_title(g_helpPage), g_helpPage + 1, HELP_PAGES);
    plat_text(16, 12, FS, 255, 230, 120, buf);
    int y = 38;
    for (int i = 0; i < n; i++) {
        int k = wrap(ln[i], lines, 3);
        if (k < 1) { y += LH / 2; continue; }
        for (int j = 0; j < k; j++) { plat_text(16, y, FS, 235, 240, 255, lines[j]); y += LH; }
    }
    plat_screen(SCR_BOTTOM, 14, 16, 40);
    if (g_helpAsk) {
        panel(16, 40, BOT_W - 32, 120);
        text_lines(28, 50, "あんぜんな ばしょに もどりますか？ (HPも ぜんかいふく)", 3, 255, 255, 255);
        plat_text(28, 130, FS, 255, 220, 80, "A:もどる  B:やめる");
    } else {
        plat_text(14, 20, FS, 255, 255, 255, "◀ ▶ (または A): ページを かえる");
        plat_text(14, 50, FS, 255, 255, 255, "B か SELECT: ヘルプを とじる");
        plat_text(14, 90, FS, 255, 230, 120, "X: うごけなく なったら ここを おす");
        plat_text(14, 112, 0.42f, 200, 210, 240, "(あんぜんな ばしょに もどれます)");
        plat_text(14, 150, FS, 255, 255, 255, plat_bgm_enabled() ? "Y: BGMを オフに する (いま: オン)" : "Y: BGMを オンに する (いま: オフ)");
    }
}

/* 文字の幅の見積もり(ピクセル): 全角=約15px・半角=約8px(FS=0.5のとき)。UTF-8 の先頭バイトで数える */
static int text_px(const char *s) {
    int w = 0;
    for (; *s; s++) {
        unsigned char c = (unsigned char)*s;
        if ((c & 0xC0) == 0x80) continue;           /* 2バイト目以降 */
        w += (c >= 0xE0) ? 15 : (c >= 0xC0 ? 12 : 8);
    }
    return w;
}
static int name_box_width(const char *name) { return 4 + text_px(name) + 10; }

static void draw_map(void) {
    const Area *a = cur_area();
    plat_screen(SCR_TOP, 0, 0, 0);
    for (int y = 0; y < a->h; y++)
        for (int x = 0; x < a->w; x++) {
            unsigned char r, g, b; tile_color(a->rows[y][x], &r, &g, &b);
            plat_rect(x * TILE, y * TILE, TILE, TILE, r, g, b);
        }
    for (int i = 0; i < a->nNpc; i++) {
        const Npc *n = &a->npc[i];
        if (!(flag(n->needFlag) && !(n->hideFlag >= 0 && flag(n->hideFlag)))) continue;
        plat_rect(n->x * TILE + 2, n->y * TILE + 1, 12, 14, n->r, n->g, n->b);
    }
    plat_rect(G.px * TILE + 2, G.py * TILE + 1, 12, 14, 250, 60, 60); /* 主人公 */
    plat_rect(G.px * TILE + 5, G.py * TILE + 3, 6, 5, 255, 220, 190);
    plat_rect(0, 0, name_box_width(a->name), 20, 0, 0, 0);   /* Update26: 名前の長さに合わせた黒い帯(はみ出さない) */
    plat_text(4, 0, FS, 255, 255, 255, a->name);
    draw_goal_marker();
    draw_help_hint();
}

static void draw_party_status(int y0) {
    for (int i = 0; i < G.partyN; i++) {
        const Member *m = &G.party[i]; char buf[96];
        snprintf(buf, sizeof(buf), "%s Lv%d", m->name, m->level);
        plat_text(10, y0 + i * 40, FS, 255, 255, 255, buf);
        snprintf(buf, sizeof(buf), "HP %d/%d MP %d/%d", m->hp, m->maxhp, m->mp, m->maxmp);
        plat_text(10, y0 + i * 40 + 18, 0.42f, 200, 230, 255, buf);
    }
}

static void draw_hpbar(int x, int y, int w, int cur, int max) {
    plat_rect(x, y, w, 6, 60, 60, 60);
    if (max > 0 && cur > 0) plat_rect(x, y, w * cur / max, 6, 80, 220, 100);
}

static void draw_message_box(const char *who, const char *text) {
    panel(4, 4, BOT_W - 8, BOT_H - 8);
    if (who && who[0]) { plat_text(14, 10, FS, 255, 220, 120, who); }
    text_lines(14, 34, text, 7, 255, 255, 255);
    plat_text(BOT_W - 30, BOT_H - 28, FS, 255, 220, 80, "▼");
}

static void draw_title(void) {
    plat_screen(SCR_TOP, 10, 14, 50);
    for (int i = 0; i < 40; i++) plat_rect((i * 97) % TOP_W, (i * 53) % 160, 2, 2, 255, 255, 200);
    plat_text(70, 50, 1.0f, 255, 230, 120, "ほしあかり英雄譚");
    plat_text(110, 100, 0.55f, 200, 220, 255, "〜 ひなたの勇者 〜");
    plat_text(120, 190, 0.45f, 160, 170, 200, "Original RPG for Nintendo 3DS");
    plat_screen(SCR_BOTTOM, 10, 10, 30);
    panel(60, 60, 200, 110);
    plat_text(100, 80, FS + 0.05f, 255, 255, 255, "はじめから");
    plat_text(100, 115, FS + 0.05f, 255, 255, 255, "つづきから");
    cursor_mark(76, 80 + g_cursor * 35);
    if (g_hint[0]) plat_text(30, 190, 0.45f, 255, 160, 160, g_hint);
    plat_text(30, 215, 0.4f, 150, 150, 190, "STARTで終了 / Aで決定");
    plat_text(30, 232, 0.36f, 255, 200, 200, "ゲーム中 こまったら SELECTボタンで ヘルプ");
}

static void draw_battle(void) {
    plat_screen(SCR_TOP, 40, 30, 70);
    if (!plat_draw_battle_bg(G.area)) plat_rect(0, 150, TOP_W, 90, 40, 80, 50);
    for (int i = 0; i < B.n; i++) {
        const EnemyDef *e = &ENEMIES[B.def[i]];
        if (B.hp[i] <= 0) continue;
        int x = 80 + i * 90; int sz = e->boss ? 70 : 44;
        if (plat_draw_enemy(B.def[i], x - 6, 140 - (e->boss ? 96 : 72), e->boss ? 96 : 72)) {
            /* 絵で描いた */
        } else {
            plat_rect(x, 140 - sz, sz, sz, e->boss ? 120 : 90, e->boss ? 40 : 180, e->boss ? 60 : 220);
            plat_rect(x + sz / 4, 140 - sz + sz / 4, 5, 5, 255, 255, 255);
            plat_rect(x + sz * 3 / 5, 140 - sz + sz / 4, 5, 5, 255, 255, 255);
        }
        plat_text(x, 145, 0.42f, 255, 255, 255, e->name);
        draw_hpbar(x, 166, 80, B.hp[i], e->hp);
        if (B.esleep[i] > 0) plat_text(x + 20, 120 - (e->boss ? 60 : 40), 0.5f, 180, 220, 255, "Zzz");
        if (B.emodT[i] > 0) plat_text(x + 50, 120, 0.4f, 255, 150, 150, "↓");
        if (B.phase == PH_ETARGET && B.cursor == i) plat_text(x + 10, 145 - sz - 22, FS, 255, 220, 80, "▼");
    }
    draw_help_hint();
    plat_screen(SCR_BOTTOM, 14, 16, 40);
    /* ステータス */
    for (int i = 0; i < G.partyN; i++) {
        char buf[96]; const Member *m = &G.party[i];
        snprintf(buf, sizeof(buf), "%s Lv%d HP%d MP%d%s", m->name, m->level, m->hp, m->mp, B.pmodT[i] > 0 ? " ↑" : "");
        plat_text(8, 6 + i * 18, 0.42f, i == B.cur && B.phase == PH_COMMAND ? 255 : 210, 230, 255, buf);
    }
    panel(4, 84, BOT_W - 8, 78);
    for (int i = 0; i < B.msgN; i++) text_lines(12, 88 + i * 24, B.msg[i], 1, 255, 255, 255);
    if (B.phase == PH_RESOLVE || B.phase == PH_END) { plat_text(BOT_W - 30, 142, FS, 255, 220, 80, "▼"); return; }
    panel(4, 166, BOT_W - 8, 70);
    const Member *m = &G.party[B.cur];
    char buf[96];
    switch (B.phase) {
    case PH_COMMAND: {
        static const char *cmd[5] = { "こうげき", "とくぎ", "どうぐ", "にげる", "スカウト" };
        for (int i = 0; i < 5; i++) plat_text(34 + (i % 2) * 120, 172 + (i / 2) * 22, FS, 255, 255, 255, cmd[i]);
        cursor_mark(14 + (B.cursor % 2) * 120, 172 + (B.cursor / 2) * 22);
        snprintf(buf, sizeof(buf), "%sは どうする？", m->name);
        plat_text(180, 66, 0.4f, 200, 200, 255, buf);
        break; }
    case PH_SKILL: {
        int first = B.sub - 1; if (first < 0) first = 0; if (first > B.nknown - 3) first = B.nknown - 3; if (first < 0) first = 0;
        for (int r = 0; r < 3 && first + r < B.nknown; r++) {
            int idx = B.known[first + r]; const SkillDef *s = &SKILLS_V3[idx];
            bool ok = m->mp >= s->mp;
            snprintf(buf, sizeof(buf), "%s MP%d", s->name, s->mp);
            plat_text(34, 172 + r * 20, 0.46f, ok ? 255 : 130, ok ? 255 : 130, ok ? 255 : 150, buf);
            if (first + r == B.sub) cursor_mark(14, 172 + r * 20);
        }
        if (B.nknown > 3) plat_text(BOT_W - 40, 172, 0.4f, 160, 170, 210, first > 0 ? "▲" : " ");
        if (B.nknown > 3) plat_text(BOT_W - 40, 218, 0.4f, 160, 170, 210, first + 3 < B.nknown ? "▼" : " ");
        char d[160]; skill_describe(B.known[B.sub], d, sizeof(d));
        text_lines(180, 56, d, 2, 200, 230, 255);   /* こうか の せつめい */
        snprintf(buf, sizeof(buf), "(%d/%d) ←→で 4つずつ", B.sub + 1, B.nknown);
        plat_text(10, 66, 0.38f, 160, 170, 210, buf);
        break; }
    case PH_ITEM:
        for (int i = 0; i < ITEM_COUNT; i++) {
            snprintf(buf, sizeof(buf), "%s x%d", ITEM_NAMES[i], G.items[i]);
            plat_text(34, 176 + i * 24, FS, 255, 255, 255, buf);
        }
        cursor_mark(14, 176 + B.sub * 24); break;
    case PH_TARGET: case PH_ITEM_TARGET:
        for (int i = 0; i < G.partyN; i++) {
            snprintf(buf, sizeof(buf), "%s%s", G.party[i].name, G.party[i].hp <= 0 ? "(ひんし)" : "");
            plat_text(34 + (i % 2) * 120, 176 + (i / 2) * 24, FS, 255, 255, 255, buf);
        }
        cursor_mark(14 + (B.cursor % 2) * 120, 176 + (B.cursor / 2) * 24); break;
    case PH_ETARGET:
        plat_text(34, 186, FS, 255, 255, 255, "どの てきを ねらう？ (↑↓で えらぶ)"); break;
    default: break;
    }
}

/* ---- Update27: メニュー(どうぐ・じゅもん/とくぎ・ステータス・モンスター・ずかん・セーブ) ---- */
static void fac_open(int kind);   /* 下の「お店・宿屋…」で 定義 */

#define MENU_ITEMS 16
static bool f_fromMenu, f_equipOnly;
static int m_mem, m_skill, m_known[200], m_nknown;   /* じゅもんメニューの 選び中の もの */

/* マップで つかえる わざ(かいふく・ふっかつ・MP かいふく) */
static bool field_usable(int idx) {
    const SkillDef *s = &SKILLS_V3[idx];
    bool ally = s->target == TG_ALLY1 || s->target == TG_ALLY_ALL || s->target == TG_SELF || s->target == TG_DEAD1;
    bool heal = s->eff1 == EF_HEAL || s->eff1 == EF_HEALPCT || s->eff1 == EF_REVIVE || s->eff1 == EF_MPPCT;
    return ally && heal;
}
static void field_apply(int e, int p, int t) {
    Member *x = &G.party[t];
    switch (e) {
    case EF_HEAL: case EF_HEALPCT:
        if (x->hp <= 0) return;
        x->hp += (e == EF_HEAL) ? (p >= 999 ? x->maxhp : p) : x->maxhp * p / 100;
        if (x->hp > x->maxhp) x->hp = x->maxhp;
        break;
    case EF_REVIVE: if (x->hp > 0) return; x->hp = x->maxhp * p / 100; if (x->hp < 1) x->hp = 1; break;
    case EF_MPPCT: if (x->hp <= 0) return; x->mp += x->maxmp * p / 100; if (x->mp > x->maxmp) x->mp = x->maxmp; break;
    default: break;
    }
}
/* 成功なら true(MPを つかった) */
static bool field_cast(int who, int idx, int target) {
    const SkillDef *s = &SKILLS_V3[idx];
    Member *c = &G.party[who];
    if (c->hp <= 0) { snprintf(m_msg, sizeof(m_msg), "%sは たおれている。", c->name); return false; }
    if (c->mp < s->mp) { snprintf(m_msg, sizeof(m_msg), "MPが たりない！"); return false; }
    if (s->target == TG_DEAD1 && (target < 0 || G.party[target].hp > 0)) { snprintf(m_msg, sizeof(m_msg), "その なかまは たおれていない。"); return false; }
    if (s->target == TG_ALLY1 && (target < 0 || G.party[target].hp <= 0)) { snprintf(m_msg, sizeof(m_msg), "その なかまは たおれている。"); return false; }
    c->mp -= s->mp;
    for (int pass = 0; pass < 2; pass++) {
        int e = pass == 0 ? s->eff1 : s->eff2, p = pass == 0 ? s->p1 : s->p2;
        if (e != EF_HEAL && e != EF_HEALPCT && e != EF_REVIVE && e != EF_MPPCT) continue;
        if (s->target == TG_ALLY_ALL) { for (int i = 0; i < G.partyN; i++) field_apply(e, p, i); }
        else if (s->target == TG_SELF) field_apply(e, p, who);
        else field_apply(e, p, target);
    }
    snprintf(m_msg, sizeof(m_msg), "%sは %sを つかった！", c->name, s->name);
    return true;
}

/* ================= Update29: ショートカット(L/R + 十字キー)と 割り当て ================= */
enum { SA_NONE, SA_ITEM, SA_SPELL, SA_EQUIP, SA_STATUS, SA_JOB, SA_MON, SA_ZUKAN, SA_SHOP, SA_INN, SA_ARENA, SA_CASINO,
       SA_HELP, SA_GOAL, SA_SAVE, SA_HEAL, SA_BGM, SA_MENU, SA_COUNT };
static const char *const SA_NAMES[SA_COUNT] = { "なし", "どうぐ", "じゅもん・とくぎ", "そうび", "ステータス", "転職", "モンスター", "ずかん", "道具屋", "宿屋",
    "格闘場", "カジノ", "そうさ方法", "いまの もくてき", "セーブ", "じどうかいふく", "BGMオン/オフ", "メニューを ひらく" };
static const unsigned char SA_DEFAULT[8] = { SA_ITEM, SA_SPELL, SA_EQUIP, SA_STATUS, SA_SAVE, SA_HEAL, SA_MON, SA_GOAL };
static const char *const SC_SLOT_NAMES[8] = { "L + ↑", "L + ↓", "L + ←", "L + →", "R + ↑", "R + ↓", "R + ←", "R + →" };
static int sc_get(int slot) {
    if (slot < 0 || slot > 7) return SA_NONE;
    int v = G.ext.reserved[1 + slot];
    return (v >= 1 && v <= SA_COUNT) ? v - 1 : SA_DEFAULT[slot];
}
static void sc_set(int slot, int a) { if (slot >= 0 && slot < 8 && a >= 0 && a < SA_COUNT) G.ext.reserved[1 + slot] = a + 1; }
static void sc_reset(void) { for (int i = 0; i < 8; i++) G.ext.reserved[1 + i] = 0; }

static int auto_heal(void) {
    int used = 0;
    for (int i = 0; i < G.partyN; i++) {
        Member *m = &G.party[i];
        while (m->hp > 0 && m->hp * 10 < m->maxhp * 7 && (G.items[ITEM_HERB] > 0 || G.items[ITEM_TONIC] > 0)) {
            int it = G.items[ITEM_HERB] > 0 ? ITEM_HERB : ITEM_TONIC;
            m->hp += (it == ITEM_HERB) ? 30 : 60; if (m->hp > m->maxhp) m->hp = m->maxhp;
            G.items[it]--; used++;
        }
    }
    return used;
}
static void sc_menu_state(MenuState s) { scene = SC_MENU; m_state = s; m_item = 0; m_mem = 0; m_direct = true; }
static void sc_run(int a) {
    char t[80];
    switch (a) {
    case SA_ITEM: sc_menu_state(MN_ITEM); break;
    case SA_SPELL: sc_menu_state(MN_SPELL_M); break;
    case SA_STATUS: sc_menu_state(MN_STATUS); break;
    case SA_EQUIP: fac_open(FAC_EQUIP); break;
    case SA_JOB: fac_open(FAC_JOB); break;
    case SA_MON: fac_open(FAC_BOX); break;
    case SA_ZUKAN: fac_open(FAC_ZUKAN); break;
    case SA_SHOP: fac_open(FAC_SHOP); break;
    case SA_INN: fac_open(FAC_INN); break;
    case SA_ARENA: fac_open(FAC_ARENA); break;
    case SA_CASINO: fac_open(FAC_CASINO); break;
    case SA_HELP: g_help = true; g_helpPage = 0; g_helpAsk = false; break;
    case SA_GOAL: g_help = true; g_helpPage = 1; g_helpAsk = false; break;
    case SA_SAVE: toast(game_save() ? "セーブ しました" : "セーブに しっぱい…"); break;
    case SA_HEAL: { int n = auto_heal(); if (n > 0) { snprintf(t, sizeof(t), "かいふくの どうぐを %dこ つかった", n); toast(t); } else toast("かいふくは ひつよう ないよ"); break; }
    case SA_BGM: plat_bgm_enable(!plat_bgm_enabled()); toast(plat_bgm_enabled() ? "BGM オン" : "BGM オフ"); break;
    case SA_MENU: scene = SC_MENU; m_state = MN_TOP; m_cursor = 0; m_direct = false; break;
    default: break;
    }
}
/* L/R を おしながら 十字キー。L/R を おしている あいだは true(あるかない) */
static bool sc_try(unsigned k, unsigned h) {
    if (!(h & (PK_L | PK_R))) return false;
    unsigned dm = k & (PK_UP | PK_DOWN | PK_LEFT | PK_RIGHT);
    if (dm) {
        int d = (dm & PK_UP) ? 0 : (dm & PK_DOWN) ? 1 : (dm & PK_LEFT) ? 2 : 3;
        sc_run(sc_get((h & PK_L ? 0 : 4) + d));
    }
    return true;
}
static void draw_sc_overlay(void) {
    unsigned h = plat_keys_held();
    if (!(h & (PK_L | PK_R))) return;
    int base = (h & PK_L) ? 0 : 4; char buf[96];
    panel(20, 52, BOT_W - 40, 120);
    plat_text(30, 58, 0.45f, 255, 230, 120, (h & PK_L) ? "Lボタン ショートカット" : "Rボタン ショートカット");
    for (int i = 0; i < 4; i++) { snprintf(buf, sizeof(buf), "%s  %s", SC_SLOT_NAMES[base + i], SA_NAMES[sc_get(base + i)]); plat_text(36, 84 + i * 20, 0.46f, 255, 255, 255, buf); }
}

static void draw_menu(void) {
    draw_map();
    plat_screen(SCR_BOTTOM, 12, 14, 40);
    char buf[128];
    switch (m_state) {
    case MN_TOP: {
        panel(4, 4, BOT_W - 8, 232);
        static const char *items[MENU_ITEMS] = { "どうぐ", "じゅもん・とくぎ", "そうび", "ステータス", "転職", "モンスター", "ずかん", "道具屋",
                                                 "宿屋", "格闘場", "カジノ", "そうさ方法", "いまの もくてき", "ショートカット", "セーブ", "とじる" };
        snprintf(buf, sizeof(buf), "ゴールド %d   コイン %d   第%d章", G.gold, G.ext.coins, G.chapter);
        plat_text(14, 8, 0.45f, 255, 230, 120, buf);
        for (int i = 0; i < MENU_ITEMS; i++) {
            int cx = (i / 8) * 156, cy = 32 + (i % 8) * 25;
            plat_text(34 + cx, cy, 0.5f, 255, 255, 255, items[i]);
            if (i == m_cursor) cursor_mark(14 + cx, cy);
        }
        plat_text(172, 214, 0.36f, 170, 180, 220, "←→: ページ  B: とじる");
        break; }
    case MN_ITEM: case MN_ITEM_TARGET:
        panel(10, 10, 300, 100);
        for (int i = 0; i < ITEM_COUNT; i++) {
            snprintf(buf, sizeof(buf), "%s x%d", ITEM_NAMES[i], G.items[i]);
            plat_text(36, 20 + i * 28, FS, 255, 255, 255, buf);
        }
        cursor_mark(16, 20 + m_item * 28);
        if (m_state == MN_ITEM_TARGET) {
            panel(10, 120, 300, 40);
            for (int i = 0; i < G.partyN; i++) plat_text(36 + i * 70, 130, FS, 255, 255, 255, G.party[i].name);
            cursor_mark(16 + m_cursor * 70, 130);
        }
        break;
    case MN_SPELL_M:
        panel(10, 10, 300, 140);
        plat_text(20, 14, FS, 255, 230, 120, "だれが つかう？");
        for (int i = 0; i < G.partyN; i++) {
            const Member *m = &G.party[i];
            snprintf(buf, sizeof(buf), "%s Lv%d  HP%d/%d  MP%d/%d", m->name, m->level, m->hp, m->maxhp, m->mp, m->maxmp);
            plat_text(36, 42 + i * 24, 0.45f, 255, 255, 255, buf);
        }
        cursor_mark(16, 42 + m_mem * 24);
        break;
    case MN_SPELL_L: case MN_SPELL_T: {
        panel(6, 6, 308, 150);
        int first = m_skill - 2; if (first > m_nknown - 5) first = m_nknown - 5; if (first < 0) first = 0;
        if (m_nknown == 0) plat_text(20, 20, FS, 255, 255, 255, "ここで つかえる わざは ない。");
        for (int r = 0; r < 5 && first + r < m_nknown; r++) {
            const SkillDef *s = &SKILLS_V3[m_known[first + r]];
            snprintf(buf, sizeof(buf), "%s  MP%d", s->name, s->mp);
            bool ok = G.party[m_mem].mp >= s->mp;
            plat_text(34, 12 + r * 26, 0.48f, ok ? 255 : 130, ok ? 255 : 130, ok ? 255 : 150, buf);
            if (first + r == m_skill) cursor_mark(14, 12 + r * 26);
        }
        if (m_nknown > 0) { char d[160]; skill_describe(m_known[m_skill], d, sizeof(d)); text_lines(14, 140, d, 1, 200, 230, 255); }
        snprintf(buf, sizeof(buf), "%s  MP %d/%d", G.party[m_mem].name, G.party[m_mem].mp, G.party[m_mem].maxmp);
        plat_text(14, 170, 0.45f, 255, 230, 120, buf);
        if (m_state == MN_SPELL_T) {
            panel(10, 186, 300, 46);
            for (int i = 0; i < G.partyN; i++) {
                snprintf(buf, sizeof(buf), "%s%s", G.party[i].name, G.party[i].hp <= 0 ? "(ひんし)" : "");
                plat_text(26 + i * 74, 196, 0.45f, 255, 255, 255, buf);
            }
            cursor_mark(10 + m_cursor * 74, 196);
        }
        break; }
    case MN_SC_SLOT:
        panel(4, 4, BOT_W - 8, 232);
        plat_text(14, 8, 0.45f, 255, 230, 120, "ショートカット (L/R を おしながら 十字キー)");
        for (int i = 0; i < 8; i++) { snprintf(buf, sizeof(buf), "%s   %s", SC_SLOT_NAMES[i], SA_NAMES[sc_get(i)]); plat_text(34, 30 + i * 22, 0.46f, 255, 255, 255, buf); }
        plat_text(34, 30 + 8 * 22, 0.46f, 255, 200, 160, "ぜんぶ もとに もどす");
        cursor_mark(14, 30 + m_sc * 22);
        break;
    case MN_SC_PICK: {
        panel(4, 4, BOT_W - 8, 232);
        snprintf(buf, sizeof(buf), "%s に わりあてる わざを えらぶ", SC_SLOT_NAMES[m_sc]);
        plat_text(14, 8, 0.45f, 255, 230, 120, buf);
        int first = m_pick - 4; if (first > SA_COUNT - 9) first = SA_COUNT - 9; if (first < 0) first = 0;
        for (int r = 0; r < 9 && first + r < SA_COUNT; r++) { plat_text(34, 32 + r * 22, 0.48f, 255, 255, 255, SA_NAMES[first + r]); if (first + r == m_pick) cursor_mark(14, 32 + r * 22); }
        break; }
    case MN_STATUS:
        panel(6, 6, 308, 228);
        for (int i = 0; i < G.partyN; i++) {
            const Member *m = &G.party[i];
            snprintf(buf, sizeof(buf), "%s Lv%d EXP %d/%d  [%s]", m->name, m->level, m->exp, game_exp_needed(m->level), JOBS[G.ext.job[i] < JOB_COUNT ? G.ext.job[i] : 0].name);
            plat_text(14, 12 + i * 52, 0.46f, 255, 230, 120, buf);
            snprintf(buf, sizeof(buf), "HP%d/%d MP%d/%d ATK%d DEF%d SPD%d", m->hp, m->maxhp, m->mp, m->maxmp,
                     equip_total_atk(&G, &G.ext.eq, i), equip_total_def(&G, &G.ext.eq, i), equip_total_spd(&G, &G.ext.eq, i));
            plat_text(14, 12 + i * 52 + 22, 0.4f, 220, 230, 255, buf);
        }
        { unsigned sec = G.playFrames / 60; snprintf(buf, sizeof(buf), "あるいた歩数 %d  プレイ時間 %u時間%02u分", G.steps, sec / 3600, (sec / 60) % 60); plat_text(14, 214, 0.42f, 200, 220, 255, buf); }
        break;
    case MN_MSG:
        draw_message_box("", m_msg); break;
    }
}

static void fac_update(unsigned k);
static void fac_draw(void);

static void draw_deduct(void) {
    const Deduction *d = &DEDUCTIONS[d_id];
    plat_screen(SCR_TOP, 30, 20, 60);
    plat_text(120, 14, 0.7f, 255, 230, 120, d->title);
    char buf[256]; subst(buf, sizeof(buf), d->prompt);
    text_lines(20, 60, buf, 5, 255, 255, 255);
    plat_screen(SCR_BOTTOM, 14, 16, 40);
    if (d_state == 0) {
        panel(4, 10, BOT_W - 8, 220);
        for (int i = 0; i < 3; i++) {
            char lines[3][128]; int n = wrap(d->choice[i], lines, 3);
            for (int j = 0; j < n; j++) plat_text(30, 24 + i * 66 + j * 20, FS, 255, 255, 255, lines[j]);
        }
        cursor_mark(10, 24 + d_cursor * 66);
    } else if (d_state == 1) {
        draw_message_box("ヒント", d->hint);
    } else {
        draw_message_box("ひらめき！", d->solved);
    }
}

static void draw_card(void) {
    plat_screen(SCR_TOP, 10, 10, 40);
    const char *t = (s_cardChapter >= 0 && s_cardChapter < CHAPTER_TITLE_COUNT) ? CHAPTER_TITLES[s_cardChapter] : "";
    char head[48]; snprintf(head, sizeof(head), "第%d章 おわり", s_cardChapter > 1 ? s_cardChapter - 1 : 1);
    plat_text(40, 90, 0.8f, 255, 230, 120, head);
    plat_text(40, 140, 0.5f, 200, 220, 255, t);
    plat_screen(SCR_BOTTOM, 10, 10, 40);
    char buf[96]; snprintf(buf, sizeof(buf), "プレイ歩数 %d / ゴールド %d", G.steps, G.gold);
    plat_text(30, 100, FS, 255, 255, 255, buf);
    plat_text(30, 140, FS, 255, 220, 80, "Aボタンで つづける");
}

static void draw_gameover(void) {
    plat_screen(SCR_TOP, 0, 0, 0);
    plat_text(120, 100, 0.8f, 255, 80, 80, "力つきた……");
    plat_screen(SCR_BOTTOM, 0, 0, 0);
    plat_text(40, 100, FS, 255, 255, 255, "Aボタンで まちへもどる");
}

void game_draw(void) {
    if (g_help) { draw_help(); return; }
    switch (scene) {
    case SC_TITLE: draw_title(); break;
    case SC_NAME: plat_screen(SCR_TOP, 0, 0, 0); plat_screen(SCR_BOTTOM, 0, 0, 0); break;
    case SC_MAP:
        draw_map();
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        draw_party_status(10);
        if (g_quitAsk) { panel(40, 90, BOT_W - 80, 50); plat_text(56, 98, FS, 255, 255, 255, "ゲームを おわる？"); plat_text(56, 118, FS, 255, 220, 80, "A:おわる  B:もどる"); }
        draw_goal(150);
        plat_text(10, 196, 0.4f, 190, 200, 230, "十字キー:移動(B:はやあるき) A:話す X:メニュー");
        plat_text(10, 207, 0.38f, 190, 220, 190, "L/R + 十字キー: ショートカット(Xメニューで かえられる)");
        plat_text(10, 218, 0.42f, 255, 200, 200, "こまったときは SELECTボタン");
        {   /* HPが少ないときの やさしい お知らせ */
            int low = 0;
            for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0 && G.party[i].hp * 3 < G.party[i].maxhp) low = 1;
            if (low && G.items[ITEM_HERB] + G.items[ITEM_ETHER] + G.items[ITEM_TONIC] > 0)
                plat_text(10, 231, 0.36f, 255, 150, 150, "HPが すくないよ！ R+↓ で じどうかいふく");
        }
        draw_sc_overlay();
        draw_toast();
        break;
    case SC_SCRIPT:
        draw_map();
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        draw_message_box(s_who, s_text);
        plat_text(180, 4, 0.38f, 150, 160, 200, "Rを おしつづけで はやおくり");
        draw_toast();
        break;
    case SC_MENU: draw_menu(); break;
    case SC_FAC: fac_draw(); break;
    case SC_BATTLE: draw_battle(); break;
    case SC_DEDUCT: draw_deduct(); break;
    case SC_CARD: draw_card(); break;
    case SC_GAMEOVER: draw_gameover(); break;
    }
}

/* ================= 更新 ================= */
static void menu_update(unsigned k) {
    if (m_direct && m_state == MN_TOP) { scene = SC_MAP; m_direct = false; return; }   /* ショートカットで ひらいた ものは とじたら マップへ */
    switch (m_state) {
    case MN_TOP:
        if (k & PK_UP) m_cursor = (m_cursor + MENU_ITEMS - 1) % MENU_ITEMS;
        if (k & PK_DOWN) m_cursor = (m_cursor + 1) % MENU_ITEMS;
        if (k & PK_LEFT) m_cursor = m_cursor >= 8 ? m_cursor - 8 : m_cursor;
        if (k & PK_RIGHT) m_cursor = m_cursor < 8 ? (m_cursor + 8 < MENU_ITEMS ? m_cursor + 8 : MENU_ITEMS - 1) : m_cursor;
        if (k & PK_B) { scene = SC_MAP; return; }
        if (k & PK_A) {
            switch (m_cursor) {
            case 0: m_state = MN_ITEM; m_item = 0; break;
            case 1: m_state = MN_SPELL_M; m_mem = 0; break;
            case 2: fac_open(FAC_EQUIP); break;
            case 3: m_state = MN_STATUS; break;
            case 4: fac_open(FAC_JOB); break;
            case 5: fac_open(FAC_BOX); break;
            case 6: fac_open(FAC_ZUKAN); break;
            case 7: fac_open(FAC_SHOP); break;
            case 8: fac_open(FAC_INN); break;
            case 9: fac_open(FAC_ARENA); break;
            case 10: fac_open(FAC_CASINO); break;
            case 11: g_help = true; g_helpPage = 0; g_helpAsk = false; break;
            case 12: g_help = true; g_helpPage = 1; g_helpAsk = false; break;
            case 13: m_state = MN_SC_SLOT; m_sc = 0; break;
            case 14:
                snprintf(m_msg, sizeof(m_msg), game_save() ? "冒険の書に きろくしました。" : "セーブに しっぱいしました……");
                m_state = MN_MSG;
                break;
            default: scene = SC_MAP; break;
            }
        }
        break;
    case MN_ITEM:
        if (k & PK_UP) m_item = (m_item + ITEM_COUNT - 1) % ITEM_COUNT;
        if (k & PK_DOWN) m_item = (m_item + 1) % ITEM_COUNT;
        if (k & PK_B) m_state = MN_TOP;
        if ((k & PK_A) && G.items[m_item] > 0) { m_state = MN_ITEM_TARGET; m_cursor = 0; }
        break;
    case MN_ITEM_TARGET:
        if (k & PK_LEFT) m_cursor = (m_cursor + G.partyN - 1) % G.partyN;
        if (k & PK_RIGHT) m_cursor = (m_cursor + 1) % G.partyN;
        if (k & PK_B) m_state = MN_ITEM;
        if ((k & PK_A) && G.items[m_item] > 0) {
            Member *m = &G.party[m_cursor];
            if (m_item == ITEM_HERB && m->hp < m->maxhp) { m->hp += 30; if (m->hp > m->maxhp) m->hp = m->maxhp; G.items[m_item]--; }
            else if (m_item == ITEM_TONIC && m->hp < m->maxhp) { m->hp += 60; if (m->hp > m->maxhp) m->hp = m->maxhp; G.items[m_item]--; }
            else if (m_item == ITEM_ETHER && m->mp < m->maxmp) { m->mp += 10; if (m->mp > m->maxmp) m->mp = m->maxmp; G.items[m_item]--; }
            m_state = MN_ITEM;
        }
        break;
    case MN_SPELL_M:
        if (k & PK_UP) m_mem = (m_mem + G.partyN - 1) % G.partyN;
        if (k & PK_DOWN) m_mem = (m_mem + 1) % G.partyN;
        if (k & PK_B) { m_state = MN_TOP; m_cursor = 1; }
        if (k & PK_A) {
            int all[200], n = skill_known(&G, m_mem, all, 200);
            m_nknown = 0;
            for (int i = 0; i < n; i++) if (field_usable(all[i])) m_known[m_nknown++] = all[i];
            m_skill = 0; m_state = MN_SPELL_L;
        }
        break;
    case MN_SPELL_L:
        if (m_nknown > 0) {
            if (k & PK_UP) m_skill = (m_skill + m_nknown - 1) % m_nknown;
            if (k & PK_DOWN) m_skill = (m_skill + 1) % m_nknown;
        }
        if (k & PK_B) m_state = MN_SPELL_M;
        if ((k & PK_A) && m_nknown > 0) {
            const SkillDef *s = &SKILLS_V3[m_known[m_skill]];
            if (s->target == TG_ALLY1 || s->target == TG_DEAD1) { m_state = MN_SPELL_T; m_cursor = (s->target == TG_DEAD1 && first_dead_member() >= 0) ? first_dead_member() : m_mem; }
            else { field_cast(m_mem, m_known[m_skill], m_mem); m_state = MN_MSG; }
        }
        break;
    case MN_SPELL_T:
        if (k & PK_LEFT) m_cursor = (m_cursor + G.partyN - 1) % G.partyN;
        if (k & PK_RIGHT) m_cursor = (m_cursor + 1) % G.partyN;
        if (k & PK_B) m_state = MN_SPELL_L;
        if (k & PK_A) { field_cast(m_mem, m_known[m_skill], m_cursor); m_state = MN_MSG; }
        break;
    case MN_SC_SLOT:
        if (k & PK_UP) m_sc = (m_sc + 8) % 9;
        if (k & PK_DOWN) m_sc = (m_sc + 1) % 9;
        if (k & PK_B) { m_state = MN_TOP; m_cursor = 13; }
        if (k & PK_A) { if (m_sc == 8) { sc_reset(); } else { m_pick = sc_get(m_sc); m_state = MN_SC_PICK; } }
        break;
    case MN_SC_PICK:
        if (k & PK_UP) m_pick = (m_pick + SA_COUNT - 1) % SA_COUNT;
        if (k & PK_DOWN) m_pick = (m_pick + 1) % SA_COUNT;
        if (k & PK_B) m_state = MN_SC_SLOT;
        if (k & PK_A) { sc_set(m_sc, m_pick); m_state = MN_SC_SLOT; }
        break;
    case MN_STATUS: if (k & (PK_A | PK_B)) m_state = MN_TOP; break;
    case MN_MSG: if (k & (PK_A | PK_B)) m_state = MN_TOP; break;
    }
}


/* ================= Update27: お店・宿屋・職業・格闘場・カジノ・ずかん・モンスター ================= */
static int f_kind, f_st, f_cur, f_a, f_b, f_c, f_d;
static char f_msg[160];
static unsigned f_rng = 7;
static ArenaLog f_log; static int f_logPos;
static int f_words[10], f_wi, f_wok, f_wbet;
static char f_input[64];

static void fac_nav(unsigned k, int *cur, int n) {
    if (n <= 0) return;
    if (k & PK_UP) *cur = (*cur + n - 1) % n;
    if (k & PK_DOWN) *cur = (*cur + 1) % n;
}
static void fac_say(const char *fmt, ...) __attribute__((format(printf, 1, 2)));
static void fac_say(const char *fmt, ...) {
    va_list ap; va_start(ap, fmt); vsnprintf(f_msg, sizeof(f_msg), fmt, ap); va_end(ap);
}
static void fac_open(int kind) {
    f_fromMenu = (scene == SC_MENU); f_equipOnly = (kind == FAC_EQUIP);
    if (kind == FAC_EQUIP) kind = FAC_SHOP;
    f_kind = kind; f_st = 0; f_cur = 0; f_a = f_b = f_c = f_d = 0; f_msg[0] = 0; f_logPos = 0;
    f_rng = (unsigned)(G.playFrames * 2654435761u + (unsigned)G.steps * 97u + 1u);
    s_id = -1; m_state = MN_TOP;
    if (f_equipOnly) { f_st = 3; f_a = 0; }
    scene = SC_FAC;
}
static void arena_bout(void) {   /* 1しあい じどうで たたかわせる(f_a=じぶんの モンスター f_b=ランク) */
    Fighter me, opp; const Mon *mm = &G.ext.mon[f_a];
    fighter_from_mon(mm, &me); arena_opponent(f_b, mm->level, &f_rng, &opp);
    f_d = arena_fight(&me, &opp, &f_rng, &f_log) == 0 ? 1 : 0;
    f_logPos = 0; f_st = 3;
}
static void fac_close(void) { scene = f_fromMenu ? SC_MENU : SC_MAP; m_state = MN_TOP; g_autoPending = true; f_msg[0] = 0; }

static const char *shop_label(int idx, int *price) {
    if (idx < ITEM_COUNT) { *price = shop_buy_price(idx); return ITEM_NAMES[idx]; }
    const EquipDef *d = equip_def(idx < ITEM_COUNT + 3 ? SLOT_WEAPON : SLOT_ARMOR, (idx - ITEM_COUNT) % 3 + 1);
    *price = d ? d->price : 0;
    return d ? d->name : "";
}

/* ---------------- 更新 ---------------- */
static void fac_update(unsigned k) {
    switch (f_kind) {
    case FAC_SHOP: {
        if (f_st == 0) {                                  /* トップ: かう/うる/そうび/やめる */
            fac_nav(k, &f_cur, 4);
            if (k & PK_B) { fac_close(); return; }
            if (k & PK_A) {
                f_msg[0] = 0;
                if (f_cur == 0) { f_st = 1; f_a = 0; }
                else if (f_cur == 1) { f_st = 2; f_a = 0; }
                else if (f_cur == 2) { f_st = 3; f_a = 0; }
                else fac_close();
            }
        } else if (f_st == 1) {                           /* かう */
            fac_nav(k, &f_a, ITEM_COUNT + 6);
            if (k & PK_B) { f_st = 0; f_cur = 0; f_msg[0] = 0; return; }
            if (k & PK_A) {
                ShopResult r;
                if (f_a < ITEM_COUNT) r = shop_buy(&G, f_a, 1);
                else r = equip_buy(&G, &G.ext.eq, f_a < ITEM_COUNT + 3 ? SLOT_WEAPON : SLOT_ARMOR, (f_a - ITEM_COUNT) % 3 + 1);
                fac_say(r == SHOP_OK ? "まいど ありっ！" : r == SHOP_NO_GOLD ? "ゴールドが たりないよ。" : "それいじょうは もてないよ。");
            }
        } else if (f_st == 2) {                           /* うる(どうぐ) */
            fac_nav(k, &f_a, ITEM_COUNT);
            if (k & PK_B) { f_st = 0; f_cur = 1; f_msg[0] = 0; return; }
            if (k & PK_A) { ShopResult r = shop_sell(&G, f_a, 1); fac_say(r == SHOP_OK ? "かいとったよ！" : "その どうぐは もっていないよ。"); }
        } else if (f_st == 3) {                           /* そうび: だれに */
            fac_nav(k, &f_a, G.partyN);
            if (k & PK_B) { if (f_equipOnly) { fac_close(); return; } f_st = 0; f_cur = 2; f_msg[0] = 0; return; }
            if (k & PK_A) { f_st = 4; f_b = 0; }
        } else if (f_st == 4) {                           /* ぶき/ぼうぐ */
            fac_nav(k, &f_b, 2);
            if (k & PK_B) { f_st = 3; return; }
            if (k & PK_A) { f_st = 5; f_c = 0; }
        } else {                                          /* もちものから えらぶ */
            EquipSlot sl = f_b == 0 ? SLOT_WEAPON : SLOT_ARMOR;
            fac_nav(k, &f_c, 4);
            if (k & PK_B) { f_st = 4; return; }
            if (k & PK_A) {
                ShopResult r = equip_set(&G, &G.ext.eq, f_a, sl, f_c);
                fac_say(r == SHOP_OK ? "そうびを かえた！" : "その そうびは もっていない。");
            }
        }
        break; }
    case FAC_INN:
        if (k & PK_B) { fac_close(); return; }
        if (k & PK_A) {
            if (f_st == 1) { fac_close(); return; }
            if (inn_rest(&G)) { fac_say("ぐっすり ねむった！ HPと MPが ぜんかいふくした！"); f_st = 1; game_save(); }
            else fac_say("ゴールドが たりないようです……");
        }
        break;
    case FAC_JOB:
        if (f_st == 0) {                                  /* だれの 職業? */
            fac_nav(k, &f_a, G.partyN);
            if (k & PK_B) { fac_close(); return; }
            if (k & PK_A) { f_st = 1; f_cur = G.ext.job[f_a]; f_msg[0] = 0; }
        } else {                                          /* どの 職業? */
            fac_nav(k, &f_cur, JOB_COUNT);
            if (k & PK_B) { f_st = 0; f_msg[0] = 0; return; }
            if (k & PK_A) {
                const char *why = "";
                if (job_change(&G, f_a, f_cur)) {
                    fac_say("%sは「%s」に 転職した！ (職業レベル %d)", G.party[f_a].name, JOBS[f_cur].name, G.ext.jobLv[f_a][f_cur]);
                    game_save();
                } else { job_can_change(&G, f_a, f_cur, &why); fac_say("%s", why); }
            }
        }
        break;
    case FAC_BOX:
        if (f_st == 0) {
            fac_nav(k, &f_cur, G.ext.monN > 0 ? G.ext.monN : 1);
            if (k & PK_B) { fac_close(); return; }
            if ((k & PK_A) && G.ext.monN > 0) { f_st = 1; f_a = 0; }
        } else {
            if (k & (PK_UP | PK_DOWN)) f_a ^= 1;
            if (k & PK_B) { f_st = 0; return; }
            if (k & PK_A) {
                if (f_a == 1 && G.ext.monN > 0) {
                    fac_say("%sを にがした。", ENEMIES[G.ext.mon[f_cur].enemy].name);
                    mon_remove(&G.ext, f_cur);
                    if (f_cur >= G.ext.monN) f_cur = G.ext.monN > 0 ? G.ext.monN - 1 : 0;
                }
                f_st = 0;
            }
        }
        break;
    case FAC_ZUKAN:
        fac_nav(k, &f_cur, ENEMY_COUNT);
        if (k & PK_LEFT) f_cur = (f_cur + ENEMY_COUNT - 4) % ENEMY_COUNT;
        if (k & PK_RIGHT) f_cur = (f_cur + 4) % ENEMY_COUNT;
        if (k & PK_B) { fac_close(); return; }
        break;

    case FAC_ARENA:
        if (f_st == 0) {                                  /* トップ */
            fac_nav(k, &f_cur, 3);
            if (k & PK_B) { fac_close(); return; }
            if (k & PK_A) {
                f_msg[0] = 0;
                if (f_cur == 0) {
                    if (G.ext.monN <= 0) fac_say("ぼくじょうに モンスターが いないぞ！ バトルで スカウトしてこい！");
                    else { f_st = 1; f_a = 0; }
                } else if (f_cur == 1) f_st = 6;
                else fac_close();
            }
        } else if (f_st == 1) {                           /* モンスターを えらぶ */
            fac_nav(k, &f_a, G.ext.monN);
            if (k & PK_B) { f_st = 0; return; }
            if (k & PK_A) { f_st = 2; f_b = G.ext.arenaRank; }
        } else if (f_st == 2) {                           /* ランクを えらぶ */
            if (k & PK_UP) f_b = f_b > 0 ? f_b - 1 : G.ext.arenaRank;
            if (k & PK_DOWN) f_b = f_b < G.ext.arenaRank ? f_b + 1 : 0;
            if (k & PK_B) { f_st = 1; return; }
            if (k & PK_A) {
                int fee = arena_entry_fee(f_b);
                if (G.gold < fee) { fac_say("さんかひが たりないぞ！ (%dゴールド)", fee); return; }
                G.gold -= fee; f_c = 0; f_wok = 0;           /* f_c=かった数 */
                arena_bout();
            }
        } else if (f_st == 3) {                           /* たたかいを みる */
            if (k & (PK_A | PK_B)) {
                if (k & PK_B) f_logPos = f_log.n;           /* Bで とばす */
                else f_logPos += 4;
                if (f_logPos >= f_log.n) {
                    if (f_d) {
                        f_c++;
                        if (f_c < 3) arena_bout();          /* つぎの しあい */
                        else f_st = 4;                      /* ゆうしょう！ */
                    } else f_st = 4;
                }
            }
        } else if (f_st == 4) {                           /* けっか */
            if (f_wok == 0) {                              /* いちど だけ ほうびを わたす */
                Mon *mm = &G.ext.mon[f_a];
                int wins = f_c;
                int gold = arena_prize_gold(f_b, mm->level, wins), coins = arena_prize_coins(f_b, wins), exp = arena_prize_exp(f_b, mm->level, wins);
                G.gold += gold; if (G.gold > 999999) G.gold = 999999;
                G.ext.coins += coins; G.ext.arenaWins += wins;
                bool up = mon_add_exp(mm, exp);
                char buf[160];
                snprintf(buf, sizeof(buf), "%dしょう！ %dG・コイン%d・けいけんち%d%s", wins, gold, coins, exp, up ? " レベルアップ！" : "");
                if (wins >= 3 && f_b == G.ext.arenaRank && G.ext.arenaRank < ARENA_RANKS - 1) { G.ext.arenaRank++; strncat(buf, " つぎの ランクが かいほう！", sizeof(buf) - strlen(buf) - 1); }
                fac_say("%s", buf);
                f_wok = 1;
            }
            if (k & (PK_A | PK_B)) { f_st = 0; f_cur = 0; f_wok = 0; game_save(); }
        } else {                                          /* ルール */
            if (k & (PK_A | PK_B)) f_st = 0;
        }
        break;

    case FAC_CASINO: {
        /* 0トップ 1コインを かう 2スロット(かけ金) 3スロット(回転) 4ハイ&ロー(かけ金) 5ハイ&ロー(あそぶ) 6ルーレット(かけ金) 7ルーレット(えらぶ) 8タイピング 9けいひん */
        static const int BETS[3] = { 1, 5, 10 };
        if (f_st == 0) {
            fac_nav(k, &f_cur, 7);
            if (k & PK_B) { fac_close(); return; }
            if (k & PK_A) {
                f_msg[0] = 0;
                switch (f_cur) {
                case 0: f_st = 1; f_a = 0; break;
                case 1: f_st = 2; f_a = 0; break;
                case 2: f_st = 4; f_a = 0; break;
                case 3: f_st = 6; f_a = 0; break;
                case 4: {  /* タイピング: 10この ことばを えらぶ */
                    int n = typing_word_count(), used[64]; memset(used, 0, sizeof(used));
                    for (int i = 0; i < 10; i++) { int w; do { w = mon_rn(&f_rng, n); } while (used[w % 64] && 10 < n); used[w % 64] = 1; f_words[i] = w; }
                    f_wi = 0; f_wok = 0; f_st = 8; f_a = 0; fac_say("じゅうこの ことばを ローマ字で うとう！ (Aで キーボード)");
                    break; }
                case 5: f_st = 9; f_a = 0; break;
                default: fac_close(); break;
                }
            }
        } else if (f_st == 1) {                           /* コインを かう */
            static const int N[4] = { 10, 50, 100, 500 };
            fac_nav(k, &f_a, 4);
            if (k & PK_B) { f_st = 0; f_cur = 0; return; }
            if (k & PK_A) {
                int cost = N[f_a] * COIN_PRICE_GOLD;
                if (G.gold < cost) fac_say("ゴールドが たりないよ。(%dG)", cost);
                else { G.gold -= cost; G.ext.coins += N[f_a]; fac_say("コインを %dまい かった！", N[f_a]); }
            }
        } else if (f_st == 2 || f_st == 4 || f_st == 6) {  /* かけ金を えらぶ */
            fac_nav(k, &f_a, 3);
            if (k & PK_B) { f_cur = f_st == 2 ? 1 : f_st == 4 ? 2 : 3; f_st = 0; f_msg[0] = 0; return; }
            if (k & PK_A) {
                int bet = BETS[f_a];
                if (G.ext.coins < bet) { fac_say("コインが たりないよ！"); return; }
                f_wbet = bet;
                if (f_st == 2) {
                    int r[3]; G.ext.coins -= bet; slot_spin(&f_rng, r);
                    int pay = slot_payout(r, bet);
                    G.ext.coins += pay; f_c = r[0] * 100 + r[1] * 10 + r[2];
                    if (pay > bet) fac_say("あたり！！ %dまい ゲット！", pay);
                    else if (pay > 0) fac_say("%dまい もどった。", pay);
                    else fac_say("はずれ……");
                    f_st = 3; f_b = 0;
                }
                else if (f_st == 4) { G.ext.coins -= bet; f_c = hl_draw(&f_rng); f_d = 0; f_st = 5; fac_say("つぎの カードは ハイ？ ロー？"); }
                else { f_st = 7; f_c = 0; f_d = 0; f_msg[0] = 0; }
            }
        } else if (f_st == 3) {                           /* スロットの かいてん */
            if (f_b < 24) { f_b++; if (k & PK_A) f_b = 24; }      /* かいてん中(Aで すぐ とめる) */
            else if (k & (PK_A | PK_B)) { f_st = 2; f_msg[0] = 0; }
        } else if (f_st == 5) {                           /* ハイ&ロー */
            bool guess = false, go = false;
            if (k & PK_UP) { guess = true; go = true; }
            if (k & PK_DOWN) { guess = false; go = true; }
            if ((k & PK_A) && f_d >= 1) {                    /* もらう */
                int pay = hl_payout(f_wbet, f_d); G.ext.coins += pay; fac_say("%dまい もらった！", pay); f_st = 4; f_a = 0; return;
            }
            if (k & PK_B) { fac_say("ここで おりた。"); f_st = 4; f_a = 0; return; }
            if (go) {
                int next = hl_draw(&f_rng), j = hl_judge(f_c, next, guess);
                if (j > 0) {
                    f_d++;
                    if (f_d >= 7) { int pay = hl_payout(f_wbet, 7); G.ext.coins += pay; fac_say("%d→%d！ 7れんしょう！ %dまい！", f_c, next, pay); f_st = 4; f_a = 0; }
                    else { fac_say("%d→%d あたり！ (%dれんしょう) Aで もらう", f_c, next, f_d); f_c = next; }
                } else if (j == 0) { fac_say("%d→%d おなじ！ ひきわけ。", f_c, next); f_c = next; }
                else { fac_say("%d→%d はずれ……", f_c, next); f_st = 4; f_a = 0; }
            }
        } else if (f_st == 7) {                           /* ルーレット */
            if (k & PK_UP) f_c = (f_c + 4) % 5;
            if (k & PK_DOWN) f_c = (f_c + 1) % 5;
            if (f_c == 4) { if (k & PK_LEFT) f_d = (f_d + 36) % 37; if (k & PK_RIGHT) f_d = (f_d + 1) % 37; }
            if (k & PK_B) { f_st = 6; f_a = 0; f_msg[0] = 0; return; }
            if (k & PK_A) {
                if (G.ext.coins < f_wbet) { fac_say("コインが たりないよ！"); return; }
                G.ext.coins -= f_wbet;
                int res = rl_spin(&f_rng), pay = rl_payout(f_wbet, f_c, f_d, res);
                G.ext.coins += pay;
                fac_say("%d(%s)！ %s", res, res == 0 ? "みどり" : rl_is_red(res) ? "あか" : "くろ", pay > 0 ? "あたり！" : "はずれ……");
                if (pay > 0) { char t[40]; snprintf(t, sizeof(t), " %dまい！", pay); strncat(f_msg, t, sizeof(f_msg) - strlen(f_msg) - 1); }
            }
        } else if (f_st == 8) {                           /* タイピング */
            if (k & PK_B) { f_st = 0; f_cur = 4; f_msg[0] = 0; return; }
            if (k & PK_A) {
                if (f_wi >= 10) { f_st = 0; f_cur = 4; return; }
                snprintf(f_input, sizeof(f_input), "%s", "");
                bool ok = plat_text_input(typing_word(f_words[f_wi]), f_input, sizeof(f_input));
                if (ok && typing_check(f_words[f_wi], f_input)) { f_wok++; fac_say("○ せいかい！ (%d/%d)", f_wok, f_wi + 1); }
                else fac_say("× ざんねん… こたえは「%s」", typing_answer(f_words[f_wi]));
                f_wi++;
                if (f_wi >= 10) {
                    int c = typing_reward(f_wok, 10, G.party[0].level); G.ext.coins += c;
                    char t[96]; snprintf(t, sizeof(t), " おわり！ %d/10もん せいかい。コイン%dまい！", f_wok, c);
                    strncat(f_msg, t, sizeof(f_msg) - strlen(f_msg) - 1);
                }
            }
        } else {                                          /* けいひん */
            fac_nav(k, &f_a, PRIZE_COUNT);
            if (k & PK_B) { f_st = 0; f_cur = 5; f_msg[0] = 0; return; }
            if (k & PK_A) {
                const Prize *p = &PRIZES[f_a];
                if (G.ext.coins < p->coins) { fac_say("コインが たりないよ！"); return; }
                bool ok = true;
                if (p->kind == 0) { if (G.items[p->arg] >= 99) ok = false; else G.items[p->arg]++; }
                else if (p->kind == 1) { if (G.ext.eq.ownedWeapon[p->arg] >= 99) ok = false; else G.ext.eq.ownedWeapon[p->arg]++; }
                else if (p->kind == 2) { if (G.ext.eq.ownedArmor[p->arg] >= 99) ok = false; else G.ext.eq.ownedArmor[p->arg]++; }
                else { if (mon_add(&G.ext, p->arg, ENEMIES[p->arg].lv) < 0) ok = false; }
                if (ok) { G.ext.coins -= p->coins; fac_say("「%s」を こうかんした！", p->name); }
                else fac_say("これいじょう もてない！ (ぼくじょうが いっぱい)");
            }
        }
        break; }
    }
}

/* ---------------- 描画 ---------------- */
static void fac_top(const char *title) {
    plat_screen(SCR_TOP, 20, 24, 60);
    panel(6, 6, TOP_W - 12, TOP_H - 12);
    plat_text(16, 12, FS, 255, 230, 120, title);
}
static void fac_msg_bar(void) {
    if (f_kind == FAC_CASINO && f_st == 3 && f_b < 24) return;   /* かいてん中は けっかを かくす */
    if (f_msg[0]) { panel(4, 4, BOT_W - 8, 48); text_lines(12, 10, f_msg, 2, 255, 255, 255); }
}

static void fac_draw(void) {
    char buf[160];
    switch (f_kind) {
    case FAC_SHOP: {
        fac_top("道具屋");
        snprintf(buf, sizeof(buf), "ゴールド %d", G.gold); plat_text(16, 40, FS, 255, 230, 120, buf);
        if (f_st == 1) {
            int pr; const char *nm = shop_label(f_a, &pr);
            snprintf(buf, sizeof(buf), "%s  %dG", nm, pr); plat_text(16, 80, FS, 255, 255, 255, buf);
            if (f_a < ITEM_COUNT) { snprintf(buf, sizeof(buf), "もっている かず: %d", G.items[f_a]); plat_text(16, 110, 0.45f, 200, 220, 255, buf); }
            else { const EquipDef *d = equip_def(f_a < ITEM_COUNT + 3 ? SLOT_WEAPON : SLOT_ARMOR, (f_a - ITEM_COUNT) % 3 + 1);
                if (d) { snprintf(buf, sizeof(buf), "こうげき+%d ぼうぎょ+%d すばやさ+%d", d->atk, d->def, d->spd); plat_text(16, 110, 0.45f, 200, 220, 255, buf); } }
        }
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        fac_msg_bar();
        panel(4, 54, BOT_W - 8, 182);
        if (f_st == 0) { static const char *it[4] = { "かう", "うる", "そうび", "やめる" }; for (int i = 0; i < 4; i++) plat_text(34, 66 + i * 36, FS, 255, 255, 255, it[i]); cursor_mark(14, 66 + f_cur * 36); }
        else if (f_st == 1) {
            int first = f_a - 3; if (first > ITEM_COUNT + 6 - 7) first = ITEM_COUNT + 6 - 7; if (first < 0) first = 0;
            for (int r = 0; r < 7 && first + r < ITEM_COUNT + 6; r++) { int pr; const char *nm = shop_label(first + r, &pr); snprintf(buf, sizeof(buf), "%s  %dG", nm, pr); plat_text(34, 62 + r * 24, 0.48f, 255, 255, 255, buf); if (first + r == f_a) cursor_mark(14, 62 + r * 24); }
        } else if (f_st == 2) {
            for (int i = 0; i < ITEM_COUNT; i++) { snprintf(buf, sizeof(buf), "%s x%d  → %dG", ITEM_NAMES[i], G.items[i], shop_sell_price(i)); plat_text(34, 66 + i * 30, 0.5f, 255, 255, 255, buf); }
            cursor_mark(14, 66 + f_a * 30);
        } else if (f_st == 3) {
            for (int i = 0; i < G.partyN; i++) { snprintf(buf, sizeof(buf), "%s  ぶき:%s ぼうぐ:%s", G.party[i].name, equip_def(SLOT_WEAPON, G.ext.eq.weapon[i])->name, equip_def(SLOT_ARMOR, G.ext.eq.armor[i])->name); plat_text(34, 66 + i * 30, 0.42f, 255, 255, 255, buf); }
            cursor_mark(14, 66 + f_a * 30);
        } else if (f_st == 4) {
            plat_text(34, 66, FS, 255, 255, 255, "ぶきを かえる"); plat_text(34, 96, FS, 255, 255, 255, "ぼうぐを かえる"); cursor_mark(14, 66 + f_b * 30);
        } else {
            EquipSlot sl = f_b == 0 ? SLOT_WEAPON : SLOT_ARMOR;
            for (int i = 0; i < 4; i++) { const EquipDef *d = equip_def(sl, i); int own = sl == SLOT_WEAPON ? G.ext.eq.ownedWeapon[i] : G.ext.eq.ownedArmor[i];
                snprintf(buf, sizeof(buf), "%s  (もっている:%d)", d->name, own); plat_text(34, 66 + i * 26, 0.48f, own > 0 ? 255 : 130, own > 0 ? 255 : 130, own > 0 ? 255 : 150, buf); }
            cursor_mark(14, 66 + f_c * 26);
        }
        break; }
    case FAC_INN:
        fac_top("宿屋");
        snprintf(buf, sizeof(buf), "ひとばん %dゴールド です。 (いまの ゴールド %d)", inn_price(&G), G.gold);
        text_lines(16, 50, buf, 2, 255, 255, 255);
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        fac_msg_bar();
        plat_text(24, 90, FS, 255, 255, 255, f_st == 1 ? "A: もどる" : "A: とまる   B: やめる");
        break;
    case FAC_JOB: {
        fac_top("転職の間");
        if (f_st == 1) {
            const JobDef *d = &JOBS[f_cur]; int lv = G.ext.jobLv[f_a][f_cur];
            snprintf(buf, sizeof(buf), "%s  (%sの 職業レベル %d)", d->name, G.party[f_a].name, lv); plat_text(16, 36, FS, 255, 255, 255, buf);
            text_lines(16, 60, d->desc, 2, 200, 220, 255);
            snprintf(buf, sizeof(buf), "こうげき%d%% ぼうぎょ%d%% すばやさ%d%% まほう%d%%", d->atk, d->def, d->spd, d->mag); plat_text(16, 104, 0.45f, 255, 230, 140, buf);
            int y = 128;
            for (int i = 0; i < SKILL_COUNT_V3 && y < 220; i++) if (SKILLS_V3[i].job == f_cur) {
                bool got = lv >= SKILLS_V3[i].learnLv;
                snprintf(buf, sizeof(buf), "職業Lv%d: %s %s", SKILLS_V3[i].learnLv, SKILLS_V3[i].name, got ? "(おぼえた)" : "");
                plat_text(16, y, 0.42f, got ? 160 : 255, got ? 255 : 255, got ? 160 : 255, buf); y += 18;
            }
        } else text_lines(16, 40, "職業に ついて レベルを あげると、あたらしい 呪文や とくぎを おぼえるよ。レベル10から 転職できる。おぼえた わざは、職業を かえても つかえるよ！", 5, 255, 255, 255);
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        fac_msg_bar();
        panel(4, 54, BOT_W - 8, 182);
        if (f_st == 0) { for (int i = 0; i < G.partyN; i++) { snprintf(buf, sizeof(buf), "%s Lv%d [%s]", G.party[i].name, G.party[i].level, JOBS[G.ext.job[i]].name); plat_text(34, 66 + i * 30, 0.5f, 255, 255, 255, buf); } cursor_mark(14, 66 + f_a * 30); }
        else {
            int first = f_cur - 3; if (first > JOB_COUNT - 7) first = JOB_COUNT - 7; if (first < 0) first = 0;
            for (int r = 0; r < 7 && first + r < JOB_COUNT; r++) { int j = first + r; snprintf(buf, sizeof(buf), "%s  Lv%d%s", JOBS[j].name, G.ext.jobLv[f_a][j], G.ext.job[f_a] == j ? " ★" : ""); plat_text(34, 62 + r * 24, 0.5f, 255, 255, 255, buf); if (j == f_cur) cursor_mark(14, 62 + r * 24); }
        }
        break; }
    case FAC_BOX: {
        fac_top("モンスター ぼくじょう");
        if (G.ext.monN > 0) {
            const Mon *m = &G.ext.mon[f_cur]; MonStats st; mon_stats(m->enemy, m->level, &st);
            snprintf(buf, sizeof(buf), "%s  Lv%d", ENEMIES[m->enemy].name, m->level); plat_text(16, 36, FS, 255, 255, 255, buf);
            snprintf(buf, sizeof(buf), "HP%d こうげき%d ぼうぎょ%d すばやさ%d", st.hp, st.atk, st.def, st.spd); plat_text(16, 62, 0.45f, 220, 230, 255, buf);
            snprintf(buf, sizeof(buf), "けいけんち %d/%d", m->exp, mon_exp_need(m->level)); plat_text(16, 84, 0.45f, 200, 220, 255, buf);
            plat_draw_enemy(m->enemy, 220, 90, 96);
        } else text_lines(16, 40, "まだ モンスターは いない。バトルで 「スカウト」を つかうと なかまに なることが あるよ！", 4, 255, 255, 255);
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        fac_msg_bar();
        panel(4, 54, BOT_W - 8, 182);
        if (f_st == 1) { plat_text(34, 90, FS, 255, 255, 255, "とっておく"); plat_text(34, 126, FS, 255, 255, 255, "にがす"); cursor_mark(14, 90 + f_a * 36); }
        else {
            int first = f_cur - 3; if (first > G.ext.monN - 7) first = G.ext.monN - 7; if (first < 0) first = 0;
            for (int r = 0; r < 7 && first + r < G.ext.monN; r++) { snprintf(buf, sizeof(buf), "%s Lv%d", ENEMIES[G.ext.mon[first + r].enemy].name, G.ext.mon[first + r].level); plat_text(34, 62 + r * 24, 0.5f, 255, 255, 255, buf); if (first + r == f_cur) cursor_mark(14, 62 + r * 24); }
        }
        break; }
    case FAC_ZUKAN: {
        fac_top("モンスターずかん");
        int seen = G.ext.seen[f_cur < ENEMY_MAX ? f_cur : 0];
        if (seen > 0) {
            const EnemyDef *e = &ENEMIES[f_cur];
            snprintf(buf, sizeof(buf), "No.%d %s %s", f_cur + 1, e->name, seen == 2 ? "★なかまに した" : ""); plat_text(16, 36, FS, 255, 255, 255, buf);
            snprintf(buf, sizeof(buf), "HP%d こうげき%d ぼうぎょ%d すばやさ%d", e->hp, e->atk, e->def, e->spd); plat_text(16, 62, 0.45f, 220, 230, 255, buf);
            snprintf(buf, sizeof(buf), "スカウトの しやすさ %d%%%s", e->rate, e->boss ? " (ボスは なかまに ならない)" : ""); plat_text(16, 84, 0.42f, 200, 220, 255, buf);
            plat_draw_enemy(f_cur, 220, 90, 96);
        } else { snprintf(buf, sizeof(buf), "No.%d ？？？？？", f_cur + 1); plat_text(16, 36, FS, 255, 255, 255, buf); plat_text(16, 62, 0.45f, 200, 200, 220, "まだ あっていない モンスターだ。"); }
        int got = 0, met = 0; for (int i = 0; i < ENEMY_COUNT && i < ENEMY_MAX; i++) { if (G.ext.seen[i] >= 1) met++; if (G.ext.seen[i] == 2) got++; }
        snprintf(buf, sizeof(buf), "あった %d / なかまに した %d / ぜんぶで %d", met, got, ENEMY_COUNT); plat_text(16, 200, 0.45f, 255, 230, 140, buf);
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        panel(4, 4, BOT_W - 8, 232);
        { int first = f_cur - 4; if (first > ENEMY_COUNT - 9) first = ENEMY_COUNT - 9; if (first < 0) first = 0;
          for (int r = 0; r < 9 && first + r < ENEMY_COUNT; r++) { int i = first + r; int sn = G.ext.seen[i < ENEMY_MAX ? i : 0];
              snprintf(buf, sizeof(buf), "%02d %s%s", i + 1, sn ? ENEMIES[i].name : "？？？？？", sn == 2 ? " ★" : ""); plat_text(30, 12 + r * 24, 0.5f, sn ? 255 : 140, sn ? 255 : 140, sn ? 255 : 160, buf); if (i == f_cur) cursor_mark(10, 12 + r * 24); } }
        break; }
    case FAC_ARENA: {
        fac_top("モンスター 格闘場");
        snprintf(buf, sizeof(buf), "いまの ランク: %s  (ゴールド %d  コイン %d)", mon_rank_name(G.ext.arenaRank), G.gold, G.ext.coins); plat_text(16, 36, 0.45f, 255, 230, 120, buf);
        if (f_st == 3) {
            int from = f_logPos; if (from >= f_log.n) from = f_log.n > 4 ? f_log.n - 4 : 0;
            for (int i = 0; i < 4 && from + i < f_log.n; i++) text_lines(16, 62 + i * 36, f_log.line[from + i], 2, 255, 255, 255);
            snprintf(buf, sizeof(buf), "だい%dしあい  (A: つづき)", f_c + 1); plat_text(16, 214, 0.42f, 200, 220, 255, buf);
        } else if (f_st == 6) {
            text_lines(16, 62, "スカウトした モンスター 1体で たいかいに でよう！ ランクごとに 3れんせん。 ぜんぶ かてば ゆうしょう！ ゆうしょうすると つぎの ランクに ちょうせんできるよ。 ごほうびは ゴールド・コイン・モンスターの けいけんち。", 7, 230, 235, 255);
        } else if (f_st == 1 && G.ext.monN > 0) {
            const Mon *m = &G.ext.mon[f_a]; MonStats st; mon_stats(m->enemy, m->level, &st);
            snprintf(buf, sizeof(buf), "%s Lv%d  HP%d こうげき%d ぼうぎょ%d すばやさ%d", ENEMIES[m->enemy].name, m->level, st.hp, st.atk, st.def, st.spd); plat_text(16, 72, 0.45f, 255, 255, 255, buf);
            plat_draw_enemy(m->enemy, 280, 110, 96);
        } else if (f_st == 2) {
            snprintf(buf, sizeof(buf), "%s  さんかひ %dゴールド", mon_rank_name(f_b), arena_entry_fee(f_b)); plat_text(16, 72, FS, 255, 255, 255, buf);
        }
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        fac_msg_bar();
        panel(4, 54, BOT_W - 8, 182);
        if (f_st == 0) { static const char *it[3] = { "たいかいに でる", "ルールを きく", "やめる" }; for (int i = 0; i < 3; i++) plat_text(34, 70 + i * 40, FS, 255, 255, 255, it[i]); cursor_mark(14, 70 + f_cur * 40); }
        else if (f_st == 1) {
            int first = f_a - 3; if (first > G.ext.monN - 7) first = G.ext.monN - 7; if (first < 0) first = 0;
            for (int r = 0; r < 7 && first + r < G.ext.monN; r++) { snprintf(buf, sizeof(buf), "%s Lv%d", ENEMIES[G.ext.mon[first + r].enemy].name, G.ext.mon[first + r].level); plat_text(34, 62 + r * 24, 0.5f, 255, 255, 255, buf); if (first + r == f_a) cursor_mark(14, 62 + r * 24); }
        } else if (f_st == 2) {
            for (int i = 0; i <= G.ext.arenaRank && i < ARENA_RANKS; i++) { snprintf(buf, sizeof(buf), "%s", mon_rank_name(i)); plat_text(34, 66 + i * 26, FS, 255, 255, 255, buf); }
            cursor_mark(14, 66 + f_b * 26);
        } else if (f_st == 3) plat_text(24, 90, FS, 255, 255, 255, "Aで すすむ  Bで とばす");
        else if (f_st == 4) plat_text(24, 90, FS, 255, 255, 255, "A: おわり");
        else plat_text(24, 90, FS, 255, 255, 255, "A: もどる");
        break; }
    case FAC_CASINO: {
        fac_top("カジノ");
        snprintf(buf, sizeof(buf), "コイン %d まい   ゴールド %d", G.ext.coins, G.gold); plat_text(16, 36, FS, 255, 230, 120, buf);
        if (f_st == 3) {
            static const char *SY[SLOT_SYMBOLS] = { "さくらんぼ", "すず", "きのこ", "ほし", "つき", "7" };
            int r0, r1, r2;
            if (f_b < 24) { r0 = mon_rn(&f_rng, SLOT_SYMBOLS); r1 = mon_rn(&f_rng, SLOT_SYMBOLS); r2 = mon_rn(&f_rng, SLOT_SYMBOLS); }
            else { r0 = f_c / 100; r1 = (f_c / 10) % 10; r2 = f_c % 10; }
            snprintf(buf, sizeof(buf), "[%s] [%s] [%s]", SY[r0 % SLOT_SYMBOLS], SY[r1 % SLOT_SYMBOLS], SY[r2 % SLOT_SYMBOLS]);
            plat_text(40, 100, 0.8f, 255, 255, 200, buf);
        } else if (f_st == 5) {
            snprintf(buf, sizeof(buf), "いまの カード: %d    かけ金 %d    %dれんしょう", f_c, f_wbet, f_d); plat_text(16, 100, FS, 255, 255, 255, buf);
            plat_text(16, 130, 0.45f, 200, 220, 255, "↑: ハイ(おおきい)  ↓: ロー(ちいさい)  A: もらう  B: おりる");
        } else if (f_st == 7) {
            static const char *T[5] = { "あか", "くろ", "ぐうすう", "きすう", "すうじ" };
            snprintf(buf, sizeof(buf), "かけ金 %d   えらんだ: %s%s", f_wbet, T[f_c], f_c == 4 ? "" : "");
            plat_text(16, 90, FS, 255, 255, 255, buf);
            if (f_c == 4) { snprintf(buf, sizeof(buf), "すうじ: %d   (←→で かえる)", f_d); plat_text(16, 120, FS, 255, 230, 140, buf); }
            plat_text(16, 160, 0.42f, 200, 220, 255, "あか・くろ・ぐうすう・きすう: 2ばい / すうじ: 36ばい (0は はずれ)");
        } else if (f_st == 8 && f_wi < 10) {
            snprintf(buf, sizeof(buf), "だい%dもん:  「%s」", f_wi + 1, typing_word(f_words[f_wi])); plat_text(16, 90, 0.7f, 255, 255, 255, buf);
            plat_text(16, 150, 0.42f, 200, 220, 255, "Aボタンで キーボードを ひらいて、ローマ字(a,i,u…)で うとう！");
        } else if (f_st == 9) {
            const Prize *p = &PRIZES[f_a]; snprintf(buf, sizeof(buf), "%s  コイン%d", p->name, p->coins); plat_text(16, 90, FS, 255, 255, 255, buf);
        } else if (f_st == 0) text_lines(16, 70, "いらっしゃい！ コインを かって あそんで、けいひんと こうかんしよう！ (10ゴールドで コイン1まい)", 4, 255, 255, 255);
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        fac_msg_bar();
        panel(4, 54, BOT_W - 8, 182);
        if (f_st == 0) { static const char *it[7] = { "コインを かう", "スロット", "ハイ＆ロー", "ルーレット", "タイピング", "けいひん", "やめる" }; for (int i = 0; i < 7; i++) plat_text(34, 60 + i * 24, 0.5f, 255, 255, 255, it[i]); cursor_mark(14, 60 + f_cur * 24); }
        else if (f_st == 1) { static const int N[4] = { 10, 50, 100, 500 }; for (int i = 0; i < 4; i++) { snprintf(buf, sizeof(buf), "コイン %dまい (%dG)", N[i], N[i] * COIN_PRICE_GOLD); plat_text(34, 66 + i * 30, FS, 255, 255, 255, buf); } cursor_mark(14, 66 + f_a * 30); }
        else if (f_st == 2 || f_st == 4 || f_st == 6) { static const int B3[3] = { 1, 5, 10 }; plat_text(24, 60, 0.45f, 200, 220, 255, "かけ金を えらぶ"); for (int i = 0; i < 3; i++) { snprintf(buf, sizeof(buf), "%dまい", B3[i]); plat_text(34, 90 + i * 30, FS, 255, 255, 255, buf); } cursor_mark(14, 90 + f_a * 30); }
        else if (f_st == 3) plat_text(24, 90, FS, 255, 255, 255, f_b >= 24 ? "A: もういちど" : "Aで とめる");
        else if (f_st == 7) { static const char *T[5] = { "あか", "くろ", "ぐうすう", "きすう", "すうじ" }; for (int i = 0; i < 5; i++) plat_text(34, 62 + i * 28, FS, 255, 255, 255, T[i]); cursor_mark(14, 62 + f_c * 28); }
        else if (f_st == 9) {
            int first = f_a - 3; if (first > PRIZE_COUNT - 7) first = PRIZE_COUNT - 7; if (first < 0) first = 0;
            for (int r = 0; r < 7 && first + r < PRIZE_COUNT; r++) { snprintf(buf, sizeof(buf), "%s %d", PRIZES[first + r].name, PRIZES[first + r].coins); plat_text(34, 62 + r * 24, 0.44f, 255, 255, 255, buf); if (first + r == f_a) cursor_mark(14, 62 + r * 24); }
        } else if (f_st == 8) plat_text(24, 90, FS, 255, 255, 255, f_wi >= 10 ? "A: おわり" : "A: こたえる");
        break; }
    }
}

static void deduct_update(unsigned k) {
    const Deduction *d = &DEDUCTIONS[d_id];
    if (d_state == 0) {
        if (k & PK_UP) d_cursor = (d_cursor + 2) % 3;
        if (k & PK_DOWN) d_cursor = (d_cursor + 1) % 3;
        if (k & PK_A) d_state = (d_cursor == d->correct) ? 2 : 1;
    } else if (k & PK_A) {
        if (d_state == 1) d_state = 0;
        else { scene = SC_SCRIPT; script_advance(); }
    }
}

/* ---- Update23: こまったときのヘルプ・にげ道・安全確認 ---- */
static bool help_available(void) {
    return scene == SC_MAP || scene == SC_SCRIPT || scene == SC_MENU || scene == SC_FAC || scene == SC_BATTLE || scene == SC_DEDUCT || scene == SC_CARD;
}
/* うごけなくなったとき用: あんぜんな場所へもどし、HP/MPを全かいふくする(ストーリーの進みは変えない) */
static void help_rescue(void) {
    for (int i = 0; i < G.partyN; i++) { G.party[i].hp = G.party[i].maxhp; G.party[i].mp = G.party[i].maxmp; }
    s_id = -1; B.n = 0; g_quitAsk = false; m_state = MN_TOP;
    if (G.flags[F_CH2_START]) change_area(AREA_MILFI, 11, 8); else change_area(AREA_HINATA, 12, 7);
    scene = SC_MAP;
}
static void help_update(unsigned k) {
    if (g_helpAsk) {
        if (k & PK_A) { help_rescue(); g_help = false; g_helpAsk = false; }
        else if (k & (PK_B | PK_SELECT)) g_helpAsk = false;
        return;
    }
    if (k & (PK_B | PK_SELECT)) { g_help = false; return; }
    if (k & (PK_RIGHT | PK_A)) g_helpPage = (g_helpPage + 1) % HELP_PAGES;
    if (k & PK_LEFT) g_helpPage = (g_helpPage + HELP_PAGES - 1) % HELP_PAGES;
    if (k & PK_X) g_helpAsk = true;
    if (k & PK_Y) plat_bgm_enable(!plat_bgm_enabled());   /* BGMの オン/オフ */
}
/* 毎フレームの安全確認: 想定外の状態になっても、止まらず・はまらないように戻す */
static void game_sanity(void) {
    if (scene == SC_SCRIPT && s_id < 0) scene = SC_MAP;
    if (scene == SC_BATTLE && B.n <= 0) scene = SC_MAP;
    if (scene == SC_MAP || scene == SC_MENU || scene == SC_SCRIPT) {
        if (G.area < 0 || G.area >= AREA_COUNT_ENUM) { G.area = AREA_HINATA; G.px = 12; G.py = 7; }
        const Area *a = cur_area();
        if (G.px < 0 || G.py < 0 || G.px >= a->w || G.py >= a->h || !game_is_walkable(a, G.px, G.py)) {
            /* 立っている場所が おかしい: 出入口の近くの 歩ける場所を さがす */
            int bx = -1, by = -1, bd = 9999;
            for (int y = 0; y < a->h; y++) for (int x = 0; x < a->w; x++) {
                if (!game_is_walkable(a, x, y) || npc_at(a, x, y)) continue;
                int d = (x - G.px) * (x - G.px) + (y - G.py) * (y - G.py);
                if (d < bd) { bd = d; bx = x; by = y; }
            }
            if (bx >= 0) { G.px = bx; G.py = by; }
        }
    }
    if (G.partyN > 0 && G.party[0].hp <= 0 && scene == SC_MAP) { /* マップで全員たおれた状態は あり得ない: 回復 */
        for (int i = 0; i < G.partyN; i++) if (G.party[i].hp <= 0) G.party[i].hp = 1;
    }
}


static bool g_newAsk;   /* タイトルで「はじめから」の上書き確認中 */

void game_step(void) {
    unsigned k = plat_keys_down();
    G.playFrames++;
    if (g_toast > 0) g_toast--;
    game_sanity();
    if (g_help) { help_update(k); return; }
    if (scene == SC_BATTLE && (B.phase == PH_RESOLVE || B.phase == PH_END) && (plat_keys_held() & PK_R)) { if (++g_ff % 4 == 0) k |= PK_A; }   /* 戦闘のメッセージも Rで はやおくり */
    if ((k & PK_SELECT) && help_available()) { g_help = true; g_helpPage = 1; g_helpAsk = false; return; }
    switch (scene) {
    case SC_TITLE:
        if (k & PK_START) g_quit = true;
        if (k & (PK_UP | PK_DOWN)) { g_cursor = 1 - g_cursor; g_newAsk = false; g_hint[0] = 0; }
        if (k & PK_B) { g_newAsk = false; g_hint[0] = 0; }
        if (k & PK_A) {
            g_hint[0] = 0;
            if (g_cursor == 0) {
                SaveData tmp;
                if (!g_newAsk && plat_save_read(&tmp, sizeof(tmp))) {
                    /* Update23: じどうセーブが あるときは、まちがえて けさないように 一度 たしかめる */
                    g_newAsk = true;
                    snprintf(g_hint, sizeof(g_hint), "セーブが あります。もう一度 Aで はじめから(上書き)");
                    break;
                }
                g_newAsk = false;
                game_init(); scene = SC_NAME;
            }
            else if (game_load()) scene = SC_MAP;
            else snprintf(g_hint, sizeof(g_hint), "セーブデータがありません");
        }
        break;
    case SC_NAME: {
        char name[NAME_LEN]; strncpy(name, "主人公", sizeof(name));
        if (plat_text_input("主人公の名前(8文字まで)", name, sizeof(name))) game_set_name(name);
        script_start(S_PROLOGUE);
        break; }
    case SC_SCRIPT:
        if (k & PK_A) { g_ff = 0; script_advance(); }
        else if (plat_keys_held() & PK_R) { if (++g_ff % 4 == 0) script_advance(); }   /* Rおしつづけ: はやおくり */
        else g_ff = 0;
        break;
    case SC_MAP:
        if (g_quitAsk) {
            if (k & PK_A) g_quit = true;
            else if (k & (PK_B | PK_START)) g_quitAsk = false;
            break;
        }
        if (k & PK_START) { g_quitAsk = true; break; }
        if (g_autoPending && s_id < 0 && G.partyN > 0) {   /* 場所を変えて落ち着いたら じどうセーブ */
            g_autoPending = false;
            if (game_save()) toast("オートセーブ しました");
        }
        if (sc_try(k, plat_keys_held())) { g_hold = 0; break; }
        {   /* 十字キーは おしっぱなしで あるける(Bを おしながらで はやあるき) */
            const unsigned DM = PK_UP | PK_DOWN | PK_LEFT | PK_RIGHT;
            unsigned h = plat_keys_held(), mk = 0;
            if (k & DM) { g_hold = 0; mk = k; }
            else if (h & DM) { g_hold++; if (g_hold >= 10 && g_hold % ((h & PK_B) ? 2 : 5) == 0) mk = h; }
            else g_hold = 0;
            if (mk & PK_UP) try_move(0, -1);
            else if (mk & PK_DOWN) try_move(0, 1);
            else if (mk & PK_LEFT) try_move(-1, 0);
            else if (mk & PK_RIGHT) try_move(1, 0);
        }
        if (scene == SC_MAP) {
            if (k & PK_A) interact();
            else if (k & PK_Y) sc_run(SA_BGM);
            else if (k & PK_X) { scene = SC_MENU; m_state = MN_TOP; m_cursor = 0; m_direct = false; }
        }
        break;
    case SC_MENU: menu_update(k); break;
    case SC_FAC: fac_update(k); break;
    case SC_BATTLE: battle_update(k); break;
    case SC_DEDUCT: deduct_update(k); break;
    case SC_CARD:
        if (k & PK_A) {
            /* 章カードのあとにスクリプトが続いていれば再開する(ワープや次章の導入) */
            if (s_id >= 0) script_advance(); else scene = SC_MAP;
        }
        break;
    case SC_GAMEOVER:
        if (k & PK_A) {
            for (int i = 0; i < G.partyN; i++) { G.party[i].hp = G.party[i].maxhp; G.party[i].mp = G.party[i].maxmp; }
            G.gold /= 2;
            if (G.flags[F_CH2_START]) change_area(AREA_MILFI, 11, 8); else change_area(AREA_HINATA, 12, 7);
            scene = SC_MAP;
        }
        break;
    }
}

void game_frame(void) {
    plat_poll();
    game_step();
    plat_frame_begin();
    game_draw();
    plat_frame_end();
}

void game_run(void) {
    plat_init();
    game_seed(plat_time_seed());
    game_init();
    scene = SC_TITLE;
    while (plat_running() && !g_quit) game_frame();
    plat_exit();
}
