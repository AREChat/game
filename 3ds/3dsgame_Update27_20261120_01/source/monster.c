#include "monster.h"
#include <stdio.h>
#include <stdarg.h>
#include <string.h>

/* ================= 乱数 ================= */
unsigned mon_rand(unsigned *rng) {
    *rng = *rng * 1664525u + 1013904223u;
    return *rng >> 8;
}
int mon_rn(unsigned *rng, int n) {
    if (n <= 0) return 0;
    return (int)(mon_rand(rng) % (unsigned)n);
}

/* ================= スカウトした モンスター ================= */
void mon_stats(int enemy, int level, MonStats *out) {
    if (!out) return;
    memset(out, 0, sizeof(*out));
    if (enemy < 0 || enemy >= ENEMY_COUNT) return;
    const EnemyDef *e = &ENEMIES[enemy];
    if (level < 1) level = 1;
    if (level > MON_MAX_LV) level = MON_MAX_LV;
    int pct = 100 + 12 * (level - e->lv);
    if (pct < 35) pct = 35;
    out->hp = e->hp * pct / 100; if (out->hp < 5) out->hp = 5;
    out->atk = e->atk * pct / 100; if (out->atk < 2) out->atk = 2;
    out->def = e->def * pct / 100; if (out->def < 0) out->def = 0;
    out->spd = e->spd + (level - e->lv) / 2; if (out->spd < 1) out->spd = 1;
}
int mon_exp_need(int level) { return 15 + level * level; }
bool mon_add_exp(Mon *m, int amount) {
    bool up = false;
    if (!m || amount <= 0) return false;
    if (m->exp > 9999999 - amount) m->exp = 9999999; else m->exp += amount;
    while (m->level < MON_MAX_LV && m->exp >= mon_exp_need(m->level)) {
        m->exp -= mon_exp_need(m->level);
        m->level++; up = true;
    }
    if (m->level >= MON_MAX_LV) m->exp = 0;
    return up;
}
int mon_add(ExtData *e, int enemy, int level) {
    if (!e || enemy < 0 || enemy >= ENEMY_COUNT) return -1;
    if (e->monN >= MON_BOX) return -1;
    if (level < 1) level = 1;
    if (level > MON_MAX_LV) level = MON_MAX_LV;
    Mon *m = &e->mon[e->monN];
    memset(m, 0, sizeof(*m));
    m->enemy = (unsigned char)enemy; m->level = (unsigned char)level;
    if (enemy < ENEMY_MAX) e->seen[enemy] = 2;
    return e->monN++;
}
bool mon_remove(ExtData *e, int index) {
    if (!e || index < 0 || index >= e->monN) return false;
    for (int i = index; i + 1 < e->monN; i++) e->mon[i] = e->mon[i + 1];
    e->monN--;
    memset(&e->mon[e->monN], 0, sizeof(Mon));
    return true;
}
int scout_chance(int enemy, int hp, int maxhp) {
    if (enemy < 0 || enemy >= ENEMY_COUNT || maxhp <= 0) return 0;
    const EnemyDef *e = &ENEMIES[enemy];
    if (e->boss || e->rate <= 0) return 0;
    if (hp < 0) hp = 0;
    if (hp > maxhp) hp = maxhp;
    int pct = e->rate * (150 - hp * 100 / maxhp) / 100;
    if (pct < 3) pct = 3;
    if (pct > 95) pct = 95;
    return pct;
}
const char *mon_rank_name(int rank) {
    static const char *n[ARENA_RANKS] = { "Fランク", "Eランク", "Dランク", "Cランク", "Bランク", "Aランク" };
    return (rank >= 0 && rank < ARENA_RANKS) ? n[rank] : "";
}

/* ================= 格闘場 ================= */
void fighter_from_mon(const Mon *m, Fighter *f) {
    MonStats s;
    memset(f, 0, sizeof(*f));
    if (!m || m->enemy >= ENEMY_COUNT) return;
    mon_stats(m->enemy, m->level, &s);
    f->name = ENEMIES[m->enemy].name; f->hp = f->maxhp = s.hp; f->atk = s.atk; f->def = s.def; f->spd = s.spd;
    f->pat = ENEMIES[m->enemy].pat;
}
void arena_opponent(int rank, int myLevel, unsigned *rng, Fighter *out) {
    int cand[ENEMY_MAX], n = 0;
    for (int i = 0; i < ENEMY_COUNT && n < ENEMY_MAX; i++) if (!ENEMIES[i].boss && ENEMIES[i].rate > 0) cand[n++] = i;
    if (rank < 0) rank = 0;
    int enemy = n > 0 ? cand[mon_rn(rng, n)] : 0;
    int lv = myLevel - 1 + mon_rn(rng, 3) + rank;
    if (lv < 1) lv = 1;
    if (lv > MON_MAX_LV) lv = MON_MAX_LV;
    Mon m; memset(&m, 0, sizeof(m)); m.enemy = (unsigned char)enemy; m.level = (unsigned char)lv;
    fighter_from_mon(&m, out);
}

static void alog(ArenaLog *log, const char *fmt, ...) __attribute__((format(printf, 2, 3)));
static void alog(ArenaLog *log, const char *fmt, ...) {
    if (!log || log->n >= ARENA_LOG_MAX) return;
    va_list ap; va_start(ap, fmt); vsnprintf(log->line[log->n], sizeof(log->line[0]), fmt, ap); va_end(ap);
    log->n++;
}
static int a_damage(int atk, int def, unsigned *rng) {
    int base = atk - def / 2;
    if (base < 1) base = 1;
    int d = base * (85 + mon_rn(rng, 31)) / 100;
    return d < 1 ? 1 : d;
}
int arena_fight(Fighter *a, Fighter *b, unsigned *rng, ArenaLog *log) {
    Fighter *f[2] = { a, b };
    if (log) log->n = 0;
    alog(log, "%s  対  %s  はじめ！", a->name, b->name);
    for (int turn = 1; turn <= 60 && a->hp > 0 && b->hp > 0; turn++) {
        int first = (a->spd > b->spd) ? 0 : (b->spd > a->spd) ? 1 : mon_rn(rng, 2);
        bool guard[2] = { false, false };
        for (int k = 0; k < 2 && a->hp > 0 && b->hp > 0; k++) {
            int s = first ^ k, t = s ^ 1;
            Fighter *me = f[s], *foe = f[t];
            int power = 100;
            const char *act = "こうげき";
            switch (me->pat) {
            case 1: if (turn % 3 == 0) { power = 160; act = "つよい こうげき"; } break;
            case 2: if (me->hp * 2 < me->maxhp) { power = 160; act = "いかりの こうげき"; } break;
            case 3:
                if (me->hp * 100 < me->maxhp * 35 && turn % 2 == 0) {
                    int h = me->maxhp / 5; me->hp += h; if (me->hp > me->maxhp) me->hp = me->maxhp;
                    alog(log, "%sは いのりを ささげた。HP+%d", me->name, h);
                    power = 0;
                } else if (turn % 4 == 1) { guard[s] = true; alog(log, "%sは みを まもっている。", me->name); power = 0; }
                break;
            default: break;
            }
            if (power == 0) continue;
            int d = a_damage(me->atk * power / 100, foe->def, rng);
            if (guard[t]) d = (d + 1) / 2;
            foe->hp -= d; if (foe->hp < 0) foe->hp = 0;
            alog(log, "%sの %s！ %sに %dの ダメージ", me->name, act, foe->name, d);
            if (foe->hp <= 0) alog(log, "%sは たおれた！", foe->name);
        }
    }
    if (a->hp > 0 && b->hp > 0) alog(log, "時間ぎれ。HPが おおい ほうの かち！");
    int winner = (a->hp * 1000 / (a->maxhp > 0 ? a->maxhp : 1)) >= (b->hp * 1000 / (b->maxhp > 0 ? b->maxhp : 1)) ? 0 : 1;
    if (a->hp <= 0) winner = 1; else if (b->hp <= 0) winner = 0;
    alog(log, "%sの しょうり！", f[winner]->name);
    return winner;
}
int arena_entry_fee(int rank) { return 20 * (rank + 1); }
int arena_prize_gold(int rank, int level, int wins) {
    int mult = wins >= 3 ? 12 : wins * 2;
    return 15 * (rank + 1) * (10 + level) / 10 * mult / 2;
}
int arena_prize_coins(int rank, int wins) {
    int base = wins >= 3 ? 40 : wins * 8;
    return base * (10 + rank * 6) / 10;
}
int arena_prize_exp(int rank, int level, int wins) {
    int base = 8 * (rank + 1) * (8 + level) / 8;
    return wins >= 3 ? base * 3 : base * wins / 2 + 1;
}

/* ================= カジノ ================= */
static const int SLOT_W[SLOT_SYMBOLS] = { 30, 24, 20, 14, 8, 4 };
static const int SLOT_X3[SLOT_SYMBOLS] = { 4, 8, 15, 40, 120, 400 };
const char *slot_symbol_name(int s) {
    static const char *n[SLOT_SYMBOLS] = { "さくらんぼ", "すず", "きのこ", "ほし", "つき", "7" };
    return (s >= 0 && s < SLOT_SYMBOLS) ? n[s] : "";
}
static int slot_one(unsigned *rng) {
    int r = mon_rn(rng, 100), acc = 0;
    for (int i = 0; i < SLOT_SYMBOLS; i++) { acc += SLOT_W[i]; if (r < acc) return i; }
    return 0;
}
void slot_spin(unsigned *rng, int reels[3]) { for (int i = 0; i < 3; i++) reels[i] = slot_one(rng); }
int slot_payout(const int r[3], int bet) {
    if (bet < 1) return 0;
    if (r[0] == r[1] && r[1] == r[2]) return bet * SLOT_X3[r[0] % SLOT_SYMBOLS];
    int pair = -1;
    if (r[0] == r[1] || r[0] == r[2]) pair = r[0]; else if (r[1] == r[2]) pair = r[1];
    if (pair < 0) return 0;
    if (pair == 0) return bet;                    /* さくらんぼ2つ: かけ金が もどる */
    return bet >= 2 ? bet / 2 : 0;                /* ほかの2つそろい: 半分 */
}
int hl_draw(unsigned *rng) { return 1 + mon_rn(rng, 13); }
int hl_judge(int cur, int next, bool high) {
    if (next == cur) return 0;
    return ((next > cur) == high) ? 1 : -1;
}
int hl_payout(int bet, int streak) {
    static const int mult[7] = { 125, 156, 195, 244, 305, 381, 477 };
    if (bet < 1 || streak < 1) return 0;
    if (streak > 7) streak = 7;
    return bet * mult[streak - 1] / 100;
}
int rl_spin(unsigned *rng) { return mon_rn(rng, 37); }
bool rl_is_red(int n) {
    static const int red[] = { 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36 };
    for (unsigned i = 0; i < sizeof(red) / sizeof(red[0]); i++) if (red[i] == n) return true;
    return false;
}
int rl_payout(int bet, int type, int pick, int result) {
    if (bet < 1 || result < 0 || result > 36) return 0;
    switch (type) {
    case RL_RED:    return (result != 0 && rl_is_red(result)) ? bet * 2 : 0;
    case RL_BLACK:  return (result != 0 && !rl_is_red(result)) ? bet * 2 : 0;
    case RL_EVEN:   return (result != 0 && result % 2 == 0) ? bet * 2 : 0;
    case RL_ODD:    return (result % 2 == 1) ? bet * 2 : 0;
    case RL_NUMBER: return (pick == result) ? bet * 36 : 0;
    default: return 0;
    }
}

const Prize PRIZES[] = {
    { "やくそう",                 10, 0, ITEM_HERB },
    { "ふしぎな水",               25, 0, ITEM_ETHER },
    { "ほしのしずく",             60, 0, ITEM_TONIC },
    { "ぬのの服",                100, 2, 1 },
    { "木のつるぎ",              120, 1, 1 },
    { "旅のマント",              260, 2, 2 },
    { "ひなたの短剣",            300, 1, 2 },
    { "星守りの胴着",            800, 2, 3 },
    { "星鉄のけん",              900, 1, 3 },
    { "かげぼうしの たまご",    1200, 3, 8 },
    { "やみがらすの たまご",    1200, 3, 9 },
    { "がんてつの たまご",      1500, 3, 7 },
};
const int PRIZE_COUNT = (int)(sizeof(PRIZES) / sizeof(PRIZES[0]));

/* ================= タイピング ================= */
static const char *TW[][2] = {
    { "ほし", "hoshi" }, { "つき", "tsuki" }, { "ひなた", "hinata" }, { "ぼうけん", "bouken" },
    { "えいゆう", "eiyuu" }, { "たから", "takara" }, { "まもの", "mamono" }, { "やくそう", "yakusou" },
    { "まほう", "mahou" }, { "ゆうしゃ", "yuusha" }, { "ともだち", "tomodachi" }, { "がっこう", "gakkou" },
    { "ほしあかり", "hoshiakari" }, { "おまつり", "omatsuri" }, { "ひかり", "hikari" }, { "もり", "mori" },
    { "うみ", "umi" }, { "そら", "sora" }, { "かぜ", "kaze" }, { "くも", "kumo" },
    { "はな", "hana" }, { "ゆめ", "yume" }, { "ねこ", "neko" }, { "さくら", "sakura" },
    { "いなずま", "inazuma" }, { "たいよう", "taiyou" }, { "ちから", "chikara" }, { "けん", "ken" },
    { "たて", "tate" }, { "ぼうし", "boushi" }
};
int typing_word_count(void) { return (int)(sizeof(TW) / sizeof(TW[0])); }
const char *typing_word(int i) { return (i >= 0 && i < typing_word_count()) ? TW[i][0] : ""; }
const char *typing_answer(int i) { return (i >= 0 && i < typing_word_count()) ? TW[i][1] : ""; }

/* ローマ字の ゆれを そろえる: shi→si など。大文字は 小文字に。 */
static void norm(const char *src, char *dst, size_t size) {
    static const char *rep[][2] = {
        { "shi", "si" }, { "chi", "ti" }, { "tsu", "tu" }, { "fu", "hu" }, { "sha", "sya" }, { "shu", "syu" }, { "sho", "syo" },
        { "cha", "tya" }, { "chu", "tyu" }, { "cho", "tyo" }, { "ja", "zya" }, { "ju", "zyu" }, { "jo", "zyo" }, { "ji", "zi" }, { "nn", "n" }
    };
    char tmp[128]; size_t o = 0;
    while (*src == ' ' && *src) src++;
    for (; *src && o + 1 < sizeof(tmp); src++) {
        char c = *src;
        if (c >= 'A' && c <= 'Z') c = (char)(c - 'A' + 'a');
        tmp[o++] = c;
    }
    while (o > 0 && tmp[o - 1] == ' ') o--;
    tmp[o] = 0;
    size_t w = 0;
    for (size_t i = 0; tmp[i] && w + 4 < size; ) {
        int hit = 0;
        for (unsigned k = 0; k < sizeof(rep) / sizeof(rep[0]); k++) {
            size_t L = strlen(rep[k][0]);
            if (strncmp(tmp + i, rep[k][0], L) == 0) { size_t M = strlen(rep[k][1]); memcpy(dst + w, rep[k][1], M); w += M; i += L; hit = 1; break; }
        }
        if (!hit) dst[w++] = tmp[i++];
    }
    dst[w] = 0;
}
bool typing_check(int i, const char *input) {
    char a[160], b[160];
    if (i < 0 || i >= typing_word_count() || !input) return false;
    norm(input, a, sizeof(a)); norm(TW[i][1], b, sizeof(b));
    return a[0] && strcmp(a, b) == 0;
}
int typing_reward(int correct, int total, int level) {
    if (correct < 0 || total < 1) return 0;
    if (correct > total) correct = total;
    int c = correct * 2 + (correct == total ? 5 : 0);
    return c + (level > 10 ? 2 : 0);
}
