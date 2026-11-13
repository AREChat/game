/* game.h - ほしあかり英雄譚 ゲーム本体の型と公開API */
#ifndef GAME_H
#define GAME_H
#include <stdbool.h>

#define MAX_PARTY 4
#define MAX_FLAGS 128
#define NAME_LEN 32
#define SAVE_MAGIC 0x48534B31u /* "HSK1" */
#define SAVE_VERSION 2         /* v2: アイテム「ほしのしずく」追加でセーブ形式が変わった */

enum { ITEM_HERB, ITEM_ETHER, ITEM_TONIC, ITEM_COUNT };
enum { MEM_HERO, MEM_SERA, MEM_GAI, MEM_MIO, MEM_COUNT };

typedef struct {
    char name[NAME_LEN];
    int id, level, hp, maxhp, mp, maxmp, atk, def, spd, exp, skill;
} Member;

typedef struct {
    unsigned magic, version;
    Member party[MAX_PARTY]; int partyN;
    int items[ITEM_COUNT];
    unsigned char flags[MAX_FLAGS];
    int area, px, py, chapter, gold, steps;
    unsigned playFrames;
} SaveData;

/* ---- ストーリースクリプト ---- */
typedef enum {
    ST_LINE,     /* who, text */
    ST_BATTLE,   /* a = enemy group */
    ST_SETFLAG,  /* a = flag */
    ST_WARP,     /* a = area, b = (x<<8)|y */
    ST_DEDUCT,   /* a = deduction id (ひらめき場面) */
    ST_GIVE,     /* a = item, b = count */
    ST_JOIN,     /* a = member id */
    ST_HEAL,     /* 全回復 */
    ST_CHAPTER,  /* a = 新しい章番号(章カード表示) */
    ST_END
} StepType;
typedef struct { StepType t; const char *who; const char *text; int a, b; } Step;

typedef struct { const char *title; const char *prompt; const char *choice[3]; int correct; const char *hint; const char *solved; } Deduction;

typedef struct { const char *name; int hp, atk, def, spd, exp, gold; bool boss; } EnemyDef;
typedef struct { int n; int id[3]; } EnemyGroup;

typedef struct { int x, y, script, needFlag, hideFlag; unsigned char r, g, b; } Npc; /* needFlag/hideFlag: -1で無条件 */
typedef struct { int x, y, script, reqFlag, onceFlag; } Trigger; /* reqFlag:-1で無条件 */
typedef struct { int x, y, toArea, tx, ty, reqFlag, blockedScript; } Warp; /* reqFlag:-1で無条件 */
typedef struct {
    const char *name; int w, h; const char *rows[15];
    bool encounters; int encGroupA, encGroupB;
    int nNpc; const Npc *npc; int nTrig; const Trigger *trig; int nWarp; const Warp *warp;
} Area;

/* ---- データ(data_*.c) ---- */
extern const Step *const SCRIPTS[]; extern const int SCRIPT_LEN[]; extern const int SCRIPT_COUNT;
extern const Deduction DEDUCTIONS[]; extern const int DEDUCTION_COUNT;
extern const EnemyDef ENEMIES[]; extern const int ENEMY_COUNT;
extern const EnemyGroup GROUPS[]; extern const int GROUP_COUNT;
extern const Area AREAS[]; extern const int AREA_COUNT;
extern const char *const ITEM_NAMES[ITEM_COUNT];
extern const char *const CHAPTER_TITLES[];
extern const int CHAPTER_TITLE_COUNT;

/* スクリプトID / フラグID / エリアID (data_ids.h) */
#include "ids.h"

/* ---- 公開API ---- */
void game_init(void);   /* 新規状態を初期化 */
void game_run(void);    /* メインループ(3DS/ホスト共通) */
void game_step(void);   /* 1フレーム進める(入力処理) */
void game_draw(void);
void game_frame(void);  /* poll+step+draw (テスト用) */
bool game_quit_requested(void);
SaveData *game_data(void);
const char *game_scene_name(void);
bool game_is_walkable(const Area *a, int x, int y);
int game_calc_damage(int atk, int def, int rnd100); /* rnd100: 0..99 */
int game_exp_needed(int level);
void game_member_init(Member *m, int id, int level);
bool game_add_exp(Member *m, int amount); /* trueでレベルアップ */
bool game_save(void);
bool game_load(void);
void game_set_name(const char *n);
void game_seed(unsigned s);
/* Update20: 主人公の向き(0=下,1=上,2=左,3=右)と歩きコマ(0=立ち,1,2=歩き)。絵の選択用(セーブには入れない) */
int game_hero_dir(void);
int game_hero_step(void);
#endif
