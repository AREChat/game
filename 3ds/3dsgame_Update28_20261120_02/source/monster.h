#ifndef MONSTER_H
#define MONSTER_H
/* Update27: スカウトした モンスター・格闘場(じどうバトル)・カジノ・タイピングの 計算ロジック。
 * game.c 非依存(game.h の型と ENEMIES だけを使う)。乱数は 呼ぶ側が 持つ状態(unsigned *rng)を 渡す。 */
#include "game.h"

/* ---------- 乱数 ---------- */
unsigned mon_rand(unsigned *rng);              /* 0..2^24-1 */
int mon_rn(unsigned *rng, int n);              /* 0..n-1 (n<=0 は 0) */

/* ---------- スカウトした モンスター ---------- */
#define MON_MAX_LV 50
typedef struct { int hp, atk, def, spd; } MonStats;
void mon_stats(int enemy, int level, MonStats *out);  /* 敵の 基本能力を レベルで 増減 */
int mon_exp_need(int level);                          /* level -> level+1 */
bool mon_add_exp(Mon *m, int amount);                 /* レベルが あがったら true */
int mon_add(ExtData *e, int enemy, int level);        /* あずける。ばしょが なければ -1。図鑑も 2(なかま)にする */
bool mon_remove(ExtData *e, int index);
int scout_chance(int enemy, int hp, int maxhp);       /* スカウト成功 %(0〜95)。ボスなど不可は 0 */
const char *mon_rank_name(int rank);                  /* 0..ARENA_RANKS-1 */

/* ---------- 格闘場 ---------- */
#define ARENA_RANKS 6
#define ARENA_LOG_MAX 48
typedef struct { const char *name; int hp, maxhp, atk, def, spd, pat; } Fighter;
typedef struct { char line[ARENA_LOG_MAX][72]; int n; } ArenaLog;
void fighter_from_mon(const Mon *m, Fighter *f);
/* ランク rank(0..) の あいて idx(0..2) を つくる。出場者の レベルに あわせる */
void arena_opponent(int rank, int myLevel, unsigned *rng, Fighter *out);
/* a と b を じどうで たたかわせる。a が かてば 0、b が かてば 1。さいだい 60ターン(HPの 多い ほうが かち) */
int arena_fight(Fighter *a, Fighter *b, unsigned *rng, ArenaLog *log);
int arena_entry_fee(int rank);        /* ゴールド */
int arena_prize_gold(int rank, int level, int wins);
int arena_prize_coins(int rank, int wins);
int arena_prize_exp(int rank, int level, int wins);

/* ---------- カジノ ---------- */
#define COIN_PRICE_GOLD 10            /* ゴールド10で コイン1まい */
#define SLOT_SYMBOLS 6
void slot_spin(unsigned *rng, int reels[3]);
int slot_payout(const int reels[3], int bet);           /* もどる コインの 数(0=はずれ。かけた分は 含む) */
const char *slot_symbol_name(int s);
int hl_draw(unsigned *rng);                              /* 1..13 */
int hl_judge(int cur, int next, bool guessHigh);         /* 1=あたり 0=ひきわけ -1=はずれ */
int hl_payout(int bet, int streak);                      /* れんしょう数に おうじた もどり(streak>=1) */
int rl_spin(unsigned *rng);                              /* 0..36 */
enum { RL_RED, RL_BLACK, RL_EVEN, RL_ODD, RL_NUMBER };
bool rl_is_red(int n);
int rl_payout(int bet, int type, int pick, int result);  /* もどる コイン(0=はずれ) */

/* 景品 */
typedef struct { const char *name; int coins; int kind; int arg; } Prize;   /* kind: 0=どうぐ 1=ぶき 2=ぼうぐ 3=モンスターのたまご */
extern const Prize PRIZES[];
extern const int PRIZE_COUNT;

/* タイピング(ローマ字) */
int typing_word_count(void);
const char *typing_word(int i);                          /* 表示する ことば(ひらがな) */
const char *typing_answer(int i);                        /* 正解(ローマ字) */
bool typing_check(int i, const char *input);             /* 大文字小文字・前後の 空白を むしして 判定。「shi/si」などの ゆれは 正解に 複数 ゆるす */
int typing_reward(int correct, int total, int level);    /* もらえる コイン */
#endif
