#ifndef ACTION_H
#define ACTION_H
/* Update32: 2Dアクション(横スクロール)。game.c 非依存の 純粋ロジック。
 * ジャンプ・はしる・ダッシュ(B)・光とかげの切りかえ(X)・バネ・トゲ・星のかけら・チェックポイント・自動スクロール。
 * こわれても 止まらない: ループは かならず 回数に 上限が あり、ミスしても その場の チェックポイントから やり直す。 */
#include <stdbool.h>

#define ACT_TILE 16
#define ACT_ROWS 15
#define ACT_VIEW_W 400
#define ACT_MAX_W 112
enum { ACT_STAGE_CLIMB, ACT_STAGE_COLLAPSE, ACT_STAGE_SHADOW, ACT_STAGE_COUNT };
/* 入力(おしている ボタン) */
enum { AIN_LEFT = 1, AIN_RIGHT = 2, AIN_JUMP = 4, AIN_DASH = 8, AIN_SWITCH = 16 };
/* このフレームに おきたこと(音・演出用) */
enum { AEV_JUMP = 1, AEV_LAND = 2, AEV_STAR = 4, AEV_DIE = 8, AEV_SWITCH = 16, AEV_DASH = 32, AEV_SPRING = 64, AEV_CHECK = 128, AEV_CLEAR = 256, AEV_SWITCH_FAIL = 512 };
enum { AST_PLAY, AST_CLEAR };

typedef struct {
    const char *title;       /* 面の なまえ */
    const char *hint;        /* あそびかた(1行) */
    int w;                   /* 横の マス数 */
    bool autoscroll;         /* 勝手に 画面が すすむ */
    bool useSwitch;          /* X で 光/かげを きりかえる */
    bool useDash;            /* B で ダッシュ */
    const char *rows[ACT_ROWS];   /* '#'かべ  '.'空  '^'トゲ  '*'星  'J'バネ  'L'光だけ  'D'かげだけ  'C'チェックポイント  'G'ゴール  'S'スタート */
} ActStage;
extern const ActStage ACT_STAGES[ACT_STAGE_COUNT];

typedef struct {
    int stage;
    int x, y, vx, vy;         /* 1/256 ピクセル。x,y は プレイヤーの 左上 */
    int face;                 /* -1 左 / 1 右 */
    bool ground, light, dashAvail;
    int coyote, jbuf, dashT, invuln, frame, cam, startDelay;
    int spawnX, spawnY;       /* 1/256 ピクセル */
    int deaths, stars;
    unsigned long long starMask[2];   /* とった 星(番号ごと) */
    unsigned prevIn;
    int state;                /* AST_* */
    unsigned ev;              /* AEV_* (毎フレーム ふたたび 作る) */
} ActState;

#define ACT_PW 10             /* プレイヤーの 大きさ(px) */
#define ACT_PH 14
int act_stage_valid(int stage);
void act_start(ActState *a, int stage);
void act_step(ActState *a, unsigned in);
int act_stars_total(int stage);
char act_tile(int stage, int tx, int ty);      /* はんいがいは '#'(左右) / '.'(上) */
bool act_star_taken(const ActState *a, int tx, int ty);   /* そのマスの 星を もう とったか */
int act_px(const ActState *a);                  /* 左上 x (px) */
int act_py(const ActState *a);
#endif
