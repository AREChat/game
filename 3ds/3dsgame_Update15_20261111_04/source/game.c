/* game.c - ほしあかり英雄譚 本体: シーン管理・マップ・バトル・メニュー・セーブ */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdarg.h>
#include "platform.h"
#include "game.h"

/* ================= 定数・状態 ================= */
#define TILE 16
#define FS 0.5f      /* 本体フォントの倍率(全角1文字≒15px) */
#define LH 20        /* 行間 */
#define WRAP_HALF 40 /* 1行の最大幅(半角単位: 全角=2) */

typedef enum { SC_TITLE, SC_NAME, SC_SCRIPT, SC_MAP, SC_MENU, SC_BATTLE, SC_DEDUCT, SC_CARD, SC_GAMEOVER } Scene;
typedef enum { MN_TOP, MN_ITEM, MN_ITEM_TARGET, MN_STATUS, MN_MSG } MenuState;
typedef enum { PH_COMMAND, PH_SKILL, PH_ITEM, PH_TARGET, PH_ITEM_TARGET, PH_RESOLVE, PH_END } Phase;
typedef enum { ACT_ATTACK, ACT_SKILL, ACT_ITEM, ACT_RUN, ACT_GUARD } ActType;

typedef struct { const char *name; int cost; int kind; int power; } SkillDef; /* kind 0:攻撃 1:回復 */
static const SkillDef SKILLS[] = {
    { "なし", 0, 0, 0 },
    { "ひらめき斬り", 3, 0, 180 },
    { "いやしの歌", 4, 1, 0 },
    { "ねらい撃ち", 3, 0, 170 }
};
#define SKILL_COUNT 4

static SaveData G;
static Scene scene = SC_TITLE;
static bool g_quit;
static unsigned g_rng = 1;
static int g_cursor;       /* 汎用カーソル */
static char g_hint[96];    /* 画面下の一言 */

/* スクリプト実行 */
static int s_id = -1, s_step;
static char s_who[48], s_text[256];
static int s_cardChapter;

/* ひらめき(推理)場面 */
static int d_id, d_cursor, d_state; /* 0:選択 1:不正解 2:正解 */

/* メニュー */
static MenuState m_state; static int m_cursor, m_item;
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
} B;

/* ================= 乱数・ユーティリティ ================= */
void game_seed(unsigned s) { g_rng = s ? s : 1; }
static unsigned rnd(void) { g_rng = g_rng * 1664525u + 1013904223u; return g_rng >> 8; }
static int rn(int n) { return (int)(rnd() % (unsigned)n); }
SaveData *game_data(void) { return &G; }
bool game_quit_requested(void) { return g_quit; }
const char *game_scene_name(void) {
    static const char *n[] = { "title", "name", "script", "map", "menu", "battle", "deduct", "card", "gameover" };
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

void game_init(void) {
    memset(&G, 0, sizeof(G));
    G.magic = SAVE_MAGIC; G.version = SAVE_VERSION;
    game_member_init(&G.party[0], MEM_HERO, 1); G.partyN = 1;
    G.items[ITEM_HERB] = 1;
    G.area = AREA_HINATA; G.px = 12; G.py = 7; G.chapter = 1; G.gold = 0;
}

bool game_save(void) { G.magic = SAVE_MAGIC; G.version = SAVE_VERSION; return plat_save_write(&G, sizeof(G)); }
bool game_load(void) {
    SaveData t;
    if (!plat_save_read(&t, sizeof(t))) return false;
    if (t.magic != SAVE_MAGIC || t.version != SAVE_VERSION) return false;
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
    return !(t == '#' || t == 'H' || t == 'R' || t == 'W' || t == 'T');
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

static void change_area(int area, int x, int y) { G.area = area; G.px = x; G.py = y; }

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
        int chance = (t == '^') ? 14 : 6; /* % */
        if (rn(100) < chance) {
            int g = a->encGroupA + rn(a->encGroupB - a->encGroupA + 1);
            battle_start(g, false); return true;
        }
    }
    return false;
}

static void try_move(int dx, int dy) {
    const Area *a = cur_area();
    int nx = G.px + dx, ny = G.py + dy;
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
        case ST_END: script_end(); return;
        }
    }
}

static void script_start(int id) {
    s_id = id; s_step = 0; script_advance();
}

/* ================= バトル ================= */
static void bmsg_clear(void) { B.msgN = 0; }
static void bmsg(const char *fmt, ...) __attribute__((format(printf, 1, 2)));
static void bmsg(const char *fmt, ...) {
    char buf[96]; va_list ap; va_start(ap, fmt); vsnprintf(buf, sizeof(buf), fmt, ap); va_end(ap);
    if (B.msgN >= 3) { memmove(B.msg[0], B.msg[1], 96); memmove(B.msg[1], B.msg[2], 96); B.msgN = 2; }
    strncpy(B.msg[B.msgN], buf, 95); B.msg[B.msgN][95] = 0; B.msgN++;
}

static bool enemies_alive(void) { for (int i = 0; i < B.n; i++) if (B.hp[i] > 0) return true; return false; }
static bool party_alive(void) { for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) return true; return false; }
static int first_enemy(void) { for (int i = 0; i < B.n; i++) if (B.hp[i] > 0) return i; return -1; }
static int next_cmd_member(int from) { for (int i = from; i < G.partyN; i++) if (G.party[i].hp > 0) return i; return -1; }

static void battle_start(int group, bool scripted) {
    memset(&B, 0, sizeof(B));
    const EnemyGroup *g = &GROUPS[group];
    B.n = g->n; B.scripted = scripted;
    for (int i = 0; i < B.n; i++) {
        B.def[i] = g->id[i]; B.hp[i] = ENEMIES[g->id[i]].hp;
        if (ENEMIES[g->id[i]].boss) B.boss = true;
    }
    B.phase = PH_COMMAND; B.cur = next_cmd_member(0);
    bmsg("%sが あらわれた！", ENEMIES[B.def[0]].name);
    scene = SC_BATTLE;
}

static void queue_sort(void) {
    /* 素早さの高い順(単純挿入ソート) */
    for (int i = 1; i < B.qn; i++) {
        Action a = B.queue[i]; int j = i - 1;
        int sa = a.enemy ? ENEMIES[B.def[a.who]].spd : G.party[a.who].spd;
        while (j >= 0) {
            int sj = B.queue[j].enemy ? ENEMIES[B.def[B.queue[j].who]].spd : G.party[B.queue[j].who].spd;
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

static int pick_party_target(void) {
    int cnt = 0, idx[MAX_PARTY];
    for (int i = 0; i < G.partyN; i++) if (G.party[i].hp > 0) idx[cnt++] = i;
    return cnt ? idx[rn(cnt)] : 0;
}

static void battle_victory(void) {
    int exp = 0, gold = 0;
    for (int i = 0; i < B.n; i++) { exp += ENEMIES[B.def[i]].exp; gold += ENEMIES[B.def[i]].gold; }
    B.gainExp = exp; B.gainGold = gold; G.gold += gold;
    bmsg_clear();
    bmsg("%sを たおした！ けいけんち%d ゴールド%d", ENEMIES[B.def[0]].name, exp, gold);
    for (int i = 0; i < G.partyN; i++) {
        if (G.party[i].hp <= 0) continue;
        if (game_add_exp(&G.party[i], exp)) bmsg("%sは レベル%dに あがった！", G.party[i].name, G.party[i].level);
    }
    B.won = true; B.phase = PH_END;
}

static void exec_action(const Action *a) {
    bmsg_clear();
    if (a->enemy) {
        if (B.hp[a->who] <= 0) return;
        int t = pick_party_target();
        const EnemyDef *e = &ENEMIES[B.def[a->who]];
        int atk = e->atk;
        if (B.guard[t]) atk = atk / 2;
        int d = game_calc_damage(atk, G.party[t].def, rn(100));
        G.party[t].hp -= d; if (G.party[t].hp < 0) G.party[t].hp = 0;
        bmsg("%sの こうげき！", e->name);
        bmsg("%sは %dの ダメージを うけた！", G.party[t].name, d);
        if (G.party[t].hp <= 0) bmsg("%sは たおれた……", G.party[t].name);
        return;
    }
    Member *m = &G.party[a->who];
    if (m->hp <= 0) return;
    switch (a->type) {
    case ACT_ATTACK: {
        int t = a->target; if (t < 0 || t >= B.n || B.hp[t] <= 0) t = first_enemy();
        if (t < 0) return;
        const EnemyDef *e = &ENEMIES[B.def[t]];
        int d = game_calc_damage(m->atk, e->def, rn(100));
        bool crit = rn(16) == 0; if (crit) d = d * 18 / 10;
        B.hp[t] -= d; if (B.hp[t] < 0) B.hp[t] = 0;
        bmsg("%sの こうげき！", m->name);
        bmsg("%s%sに %dの ダメージ！", crit ? "かいしんの いちげき！ " : "", e->name, d);
        if (B.hp[t] <= 0) bmsg("%sを たおした！", e->name);
        break; }
    case ACT_SKILL: {
        const SkillDef *s = &SKILLS[m->skill];
        if (m->mp < s->cost) { bmsg("%sは MPが たりない！", m->name); break; }
        m->mp -= s->cost;
        if (s->kind == 1) {
            int best = a->target; if (best < 0 || best >= G.partyN) best = a->who;
            int heal = 18 + m->level * 3;
            G.party[best].hp += heal; if (G.party[best].hp > G.party[best].maxhp) G.party[best].hp = G.party[best].maxhp;
            bmsg("%sは %sを つかった！", m->name, s->name);
            bmsg("%sの HPが かいふくした！", G.party[best].name);
        } else {
            int t = a->target; if (t < 0 || t >= B.n || B.hp[t] <= 0) t = first_enemy();
            if (t < 0) break;
            const EnemyDef *e = &ENEMIES[B.def[t]];
            int d = game_calc_damage(m->atk * s->power / 100, e->def, rn(100));
            B.hp[t] -= d; if (B.hp[t] < 0) B.hp[t] = 0;
            bmsg("%sの %s！", m->name, s->name);
            bmsg("%sに %dの ダメージ！", e->name, d);
            if (B.hp[t] <= 0) bmsg("%sを たおした！", e->name);
        }
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
        if (k & PK_UP) B.cursor = (B.cursor + 3) % 4;
        if (k & PK_DOWN) B.cursor = (B.cursor + 1) % 4;
        if (k & PK_A) {
            Action *c = &B.cmd[B.cur]; memset(c, 0, sizeof(*c)); c->who = B.cur; c->target = first_enemy();
            switch (B.cursor) {
            case 0: c->type = ACT_ATTACK; battle_next_command(); break;
            case 1: B.phase = PH_SKILL; break;
            case 2: B.phase = PH_ITEM; B.sub = 0; break;
            case 3: c->type = ACT_RUN; battle_next_command(); break;
            }
        }
        if ((k & PK_B) && B.cur > 0) { /* 一つ前の味方のコマンドに戻る */
            for (int i = B.cur - 1; i >= 0; i--) if (G.party[i].hp > 0) { B.cur = i; break; }
        }
        break; }
    case PH_SKILL: {
        const Member *m = &G.party[B.cur];
        if (k & PK_B) B.phase = PH_COMMAND;
        if (k & PK_A) {
            const SkillDef *s = &SKILLS[m->skill];
            if (m->skill == 0) break;
            if (m->mp < s->cost) { bmsg_clear(); bmsg("MPが たりない！"); break; }
            Action *c = &B.cmd[B.cur]; c->type = ACT_SKILL; c->arg = m->skill;
            if (s->kind == 1) { B.phase = PH_TARGET; B.sub = 1; B.cursor = 0; }
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
            }
            B.cmd[B.cur].target = B.cursor; battle_next_command();
        }
        break; }
    case PH_RESOLVE: {
        if (!(k & PK_A)) break;
        if (B.fled) { scene = SC_MAP; return; }
        if (!enemies_alive()) { battle_victory(); break; }
        if (!party_alive()) { B.lost = true; B.phase = PH_END; bmsg_clear(); bmsg("%sたちは ちからつきた……", G.party[0].name); break; }
        if (B.qi >= B.qn) { B.phase = PH_COMMAND; B.cur = next_cmd_member(0); B.cursor = 0; bmsg_clear(); break; }
        Action a = B.queue[B.qi++];
        exec_action(&a);
        if (B.fled) break;
        break; }
    case PH_END: {
        if (!(k & PK_A)) break;
        if (B.lost) { scene = SC_GAMEOVER; return; }
        if (B.scripted) { scene = SC_SCRIPT; script_advance(); }
        else scene = SC_MAP;
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
    case '.': *r = 205; *g = 185; *b = 140; break;
    case '=': *r = 120; *g = 90; *b = 60; break;
    case 'F': *r = 240; *g = 140; *b = 190; break;
    case '^': *r = 40; *g = 130; *b = 50; break;
    default: *r = 90; *g = 190; *b = 90; break;
    }
}

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
    plat_rect(0, 0, 8 * 15 + 10, 20, 0, 0, 0);
    plat_text(4, 0, FS, 255, 255, 255, a->name);
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
}

static void draw_battle(void) {
    plat_screen(SCR_TOP, 40, 30, 70);
    plat_rect(0, 150, TOP_W, 90, 40, 80, 50);
    for (int i = 0; i < B.n; i++) {
        const EnemyDef *e = &ENEMIES[B.def[i]];
        if (B.hp[i] <= 0) continue;
        int x = 80 + i * 90; int sz = e->boss ? 70 : 44;
        plat_rect(x, 140 - sz, sz, sz, e->boss ? 120 : 90, e->boss ? 40 : 180, e->boss ? 60 : 220);
        plat_rect(x + sz / 4, 140 - sz + sz / 4, 5, 5, 255, 255, 255);
        plat_rect(x + sz * 3 / 5, 140 - sz + sz / 4, 5, 5, 255, 255, 255);
        plat_text(x, 145, 0.42f, 255, 255, 255, e->name);
        draw_hpbar(x, 166, 80, B.hp[i], e->hp);
    }
    plat_screen(SCR_BOTTOM, 14, 16, 40);
    /* ステータス */
    for (int i = 0; i < G.partyN; i++) {
        char buf[96]; const Member *m = &G.party[i];
        snprintf(buf, sizeof(buf), "%s Lv%d HP%d MP%d", m->name, m->level, m->hp, m->mp);
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
        static const char *cmd[4] = { "こうげき", "とくぎ", "どうぐ", "にげる" };
        for (int i = 0; i < 4; i++) plat_text(34 + (i % 2) * 120, 176 + (i / 2) * 28, FS, 255, 255, 255, cmd[i]);
        cursor_mark(14 + (B.cursor % 2) * 120, 176 + (B.cursor / 2) * 28);
        snprintf(buf, sizeof(buf), "%sは どうする？", m->name);
        plat_text(180, 66, 0.4f, 200, 200, 255, buf);
        break; }
    case PH_SKILL:
        snprintf(buf, sizeof(buf), "%s (MP%d)", SKILLS[m->skill].name, SKILLS[m->skill].cost);
        cursor_mark(14, 186); plat_text(34, 186, FS, 255, 255, 255, buf); break;
    case PH_ITEM:
        for (int i = 0; i < ITEM_COUNT; i++) {
            snprintf(buf, sizeof(buf), "%s x%d", ITEM_NAMES[i], G.items[i]);
            plat_text(34, 176 + i * 24, FS, 255, 255, 255, buf);
        }
        cursor_mark(14, 176 + B.sub * 24); break;
    case PH_TARGET: case PH_ITEM_TARGET:
        for (int i = 0; i < G.partyN; i++) plat_text(34 + (i % 2) * 120, 176 + (i / 2) * 24, FS, 255, 255, 255, G.party[i].name);
        cursor_mark(14 + (B.cursor % 2) * 120, 176 + (B.cursor / 2) * 24); break;
    default: break;
    }
}

static void draw_menu(void) {
    draw_map();
    plat_screen(SCR_BOTTOM, 12, 14, 40);
    char buf[128];
    switch (m_state) {
    case MN_TOP: {
        panel(10, 10, 130, 150);
        static const char *items[4] = { "どうぐ", "ステータス", "セーブ", "とじる" };
        for (int i = 0; i < 4; i++) plat_text(36, 20 + i * 32, FS, 255, 255, 255, items[i]);
        cursor_mark(16, 20 + m_cursor * 32);
        snprintf(buf, sizeof(buf), "ゴールド %d", G.gold);
        plat_text(160, 20, FS, 255, 230, 120, buf);
        snprintf(buf, sizeof(buf), "第%d章", G.chapter);
        plat_text(160, 50, FS, 200, 220, 255, buf);
        break; }
    case MN_ITEM: case MN_ITEM_TARGET:
        panel(10, 10, 300, 100);
        for (int i = 0; i < ITEM_COUNT; i++) {
            snprintf(buf, sizeof(buf), "%s x%d", ITEM_NAMES[i], G.items[i]);
            plat_text(36, 20 + i * 28, FS, 255, 255, 255, buf);
        }
        cursor_mark(16, 20 + m_item * 28);
        if (m_state == MN_ITEM_TARGET) {
            panel(10, 120, 300, 40 + G.partyN * 0);
            for (int i = 0; i < G.partyN; i++) plat_text(36 + i * 70, 130, FS, 255, 255, 255, G.party[i].name);
            cursor_mark(16 + m_cursor * 70, 130);
        }
        break;
    case MN_STATUS:
        panel(6, 6, 308, 228);
        for (int i = 0; i < G.partyN; i++) {
            const Member *m = &G.party[i];
            snprintf(buf, sizeof(buf), "%s Lv%d EXP %d/%d", m->name, m->level, m->exp, game_exp_needed(m->level));
            plat_text(14, 12 + i * 52, FS, 255, 230, 120, buf);
            snprintf(buf, sizeof(buf), "HP%d/%d MP%d/%d ATK%d DEF%d SPD%d", m->hp, m->maxhp, m->mp, m->maxmp, m->atk, m->def, m->spd);
            plat_text(14, 12 + i * 52 + 22, 0.4f, 220, 230, 255, buf);
        }
        break;
    case MN_MSG:
        draw_message_box("", m_msg); break;
    }
}

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
    switch (scene) {
    case SC_TITLE: draw_title(); break;
    case SC_NAME: plat_screen(SCR_TOP, 0, 0, 0); plat_screen(SCR_BOTTOM, 0, 0, 0); break;
    case SC_MAP:
        draw_map();
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        draw_party_status(10);
        plat_text(10, 190, 0.4f, 190, 200, 230, "十字キー:移動 A:話す X:メニュー");
        break;
    case SC_SCRIPT:
        draw_map();
        plat_screen(SCR_BOTTOM, 14, 16, 40);
        draw_message_box(s_who, s_text);
        break;
    case SC_MENU: draw_menu(); break;
    case SC_BATTLE: draw_battle(); break;
    case SC_DEDUCT: draw_deduct(); break;
    case SC_CARD: draw_card(); break;
    case SC_GAMEOVER: draw_gameover(); break;
    }
}

/* ================= 更新 ================= */
static void menu_update(unsigned k) {
    switch (m_state) {
    case MN_TOP:
        if (k & PK_UP) m_cursor = (m_cursor + 3) % 4;
        if (k & PK_DOWN) m_cursor = (m_cursor + 1) % 4;
        if (k & PK_B) { scene = SC_MAP; return; }
        if (k & PK_A) {
            if (m_cursor == 0) { m_state = MN_ITEM; m_item = 0; }
            else if (m_cursor == 1) m_state = MN_STATUS;
            else if (m_cursor == 2) {
                snprintf(m_msg, sizeof(m_msg), game_save() ? "冒険の書に きろくしました。" : "セーブに しっぱいしました……");
                m_state = MN_MSG;
            } else scene = SC_MAP;
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
    case MN_STATUS: if (k & (PK_A | PK_B)) m_state = MN_TOP; break;
    case MN_MSG: if (k & (PK_A | PK_B)) m_state = MN_TOP; break;
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

void game_step(void) {
    unsigned k = plat_keys_down();
    G.playFrames++;
    switch (scene) {
    case SC_TITLE:
        if (k & PK_START) g_quit = true;
        if (k & (PK_UP | PK_DOWN)) g_cursor = 1 - g_cursor;
        if (k & PK_A) {
            g_hint[0] = 0;
            if (g_cursor == 0) { game_init(); scene = SC_NAME; }
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
        if (k & PK_A) script_advance();
        break;
    case SC_MAP:
        if (k & PK_START) { g_quit = true; break; }
        if (k & PK_UP) try_move(0, -1);
        else if (k & PK_DOWN) try_move(0, 1);
        else if (k & PK_LEFT) try_move(-1, 0);
        else if (k & PK_RIGHT) try_move(1, 0);
        if (scene == SC_MAP) {
            if (k & PK_A) interact();
            else if (k & PK_X) { scene = SC_MENU; m_state = MN_TOP; m_cursor = 0; }
        }
        break;
    case SC_MENU: menu_update(k); break;
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
