// ===== game8 物理エンジン（C++ → WebAssembly）=====
// アクション（横スクロール・ジャンプ・踏みつけ）と レース（コース・CPU・ラップ）の
// あたり判定・移動計算だけを ここで行う。描画は three.js（JS側）が担当する。
// ビルド: emcc cpp/game8.cpp -O3 -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=Game8Module
//         -s EXPORTED_FUNCTIONS=... -s EXPORTED_RUNTIME_METHODS=... -o js/game8.wasm.js
#include <cmath>
#include <cstring>
#include <cstdlib>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

// ---------------------------------------------------------------------------
// 共通
// ---------------------------------------------------------------------------
static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }
static inline float lerpf(float a, float b, float t){ return a + (b - a) * t; }

// ---------------------------------------------------------------------------
// アクションモード（マリオブラザーズ風）
// ---------------------------------------------------------------------------
namespace act {
    const int MAX_PLAT = 96;
    const int MAX_ENEMY = 32;
    const int MAX_COIN = 64;
    const int MAX_ITEM = 32;

    struct Rect { float x, y, w, h; int solidTop; };
    struct Enemy { float x, y, w, h, vx; int alive; float faceDir; float startX, range; };
    struct Coin { float x, y; int collected; };
    struct Item { float x, y; int type; int collected; };   // type 1〜10（下のfireItem相当のswitchぶんを参照）

    Rect plats[MAX_PLAT]; int platCount = 0;
    Enemy enemies[MAX_ENEMY]; int enemyCount = 0;
    Coin coins[MAX_COIN]; int coinCount = 0;
    Item items[MAX_ITEM]; int itemCount = 0;
    float goalX, goalY, goalW, goalH;
    int goalSet = 0;

    float px, py, pvx, pvy;
    int onGround, alive, goalReached;
    float facing, invuln;
    int coinsCollected;
    float respawnX, respawnY;
    float coyoteT, jumpBufT;   // 操作しやすくするための「少しの甘さ」（下の act_step 内の説明を参照）
    int doubleJumpUsed;        // ジェットパック中、空中でもう一度ジャンプを使ったか

    // ---- 10種のオリジナルアイテム（マリオのキノコ・スター等とは まったく別の効果）----
    //  1 ばねブーツ：しばらく ジャンプ力がさらにアップ　2 ジェットパック：しばらく 空中でもう一度ジャンプできる
    //  3 じしゃくリング：しばらく コインを自動で引きよせる　4 ガードオーラ：次の1回のダメージを防ぐ（持ち越し可）
    //  5 ダッシュソーダ：しばらく 移動速度アップ　6 こおりスプレー：しばらく 敵の動きを遅くする
    //  7 グローブパンチ：しばらく 踏まなくても ふれるだけで敵を倒せる　8 ハートのかけら：即座にライフ+1
    //  9 レインボーオーラ：しばらく 無敵＆ふれた敵を即たおす　10 ボーナスコインぶくろ：即座にコイン+15
    float springT, jetpackT, magnetT, dashT, freezeT, punchT, invincibleT;
    int shieldCount;
    int livesGained;   // ハートのかけらを取った回数の累計（JS側がこの値の増分だけライフを増やす）

    const float GRAVITY = 1700.0f;
    const float MOVE_ACCEL = 2600.0f;
    const float MOVE_MAXSPD = 260.0f;
    const float FRICTION = 2200.0f;
    const float JUMP_VEL = 1120.0f;   // 以前の2倍（登れない高さの足場に届くように）
    const float JUMP_CUT = 0.45f;   // ボタンを早く離すと ジャンプが低くなる
    const float COYOTE_TIME = 0.1f;   // 足場から落ちた直後も、これだけの間はジャンプを受け付ける（コヨーテタイム）
    const float JUMP_BUFFER = 0.12f;  // 着地の少し前にジャンプを押しても、着地した瞬間にジャンプとして受け付ける（入力バッファ）
    const float PLAYER_W = 30.0f, PLAYER_H = 40.0f;
    const float ENEMY_W = 32.0f, ENEMY_H = 28.0f;

    const float SPRING_JUMP_MULT = 1.4f, SPRING_TIME = 8.0f;
    const float JETPACK_TIME = 10.0f;
    const float MAGNET_TIME = 9.0f, MAGNET_RADIUS = 110.0f;
    const float DASH_TIME_A = 7.0f, DASH_SPEED_MULT = 1.5f;
    const float FREEZE_TIME = 6.0f, FREEZE_MULT = 0.25f;
    const float PUNCH_TIME = 8.0f;
    const float INVINCIBLE_TIME = 6.0f;
    const int BONUS_COINS = 15;

    // 出力バッファ: [0]px [1]py [2]vx [3]vy [4]onGround [5]alive [6]facing [7]invuln
    // [8]coinsCollected [9]goalReached [10]enemyCount [11]coinCount [12]itemCount [13]livesGained
    // [14]springT [15]jetpackT [16]magnetT [17]shieldCount [18]dashT [19]freezeT [20]punchT [21]invincibleT
    // そのあと enemy*6 (x,y,w,h,alive,facing) → coin*3 (x,y,collected) → item*4 (x,y,type,collected)
    const int HEADER = 22;
    float outBuf[HEADER + MAX_ENEMY * 6 + MAX_COIN * 3 + MAX_ITEM * 4];

    EM_KEEP void act_reset(float sx, float sy){
        platCount = 0; enemyCount = 0; coinCount = 0; itemCount = 0; goalSet = 0;
        px = sx; py = sy; pvx = 0; pvy = 0; onGround = 0; alive = 1; goalReached = 0;
        facing = 1; invuln = 0; coinsCollected = 0; respawnX = sx; respawnY = sy;
        coyoteT = 0; jumpBufT = 0; doubleJumpUsed = 0;
        springT = jetpackT = magnetT = dashT = freezeT = punchT = invincibleT = 0;
        shieldCount = 0; livesGained = 0;
    }
    EM_KEEP int act_add_platform(float x, float y, float w, float h, int solidTop){
        if(platCount >= MAX_PLAT) return -1;
        plats[platCount] = {x, y, w, h, solidTop};
        return platCount++;
    }
    EM_KEEP int act_add_enemy(float x, float y, float speed, float range){
        if(enemyCount >= MAX_ENEMY) return -1;
        enemies[enemyCount] = {x, y, ENEMY_W, ENEMY_H, speed, 1, -1.0f, x, range};
        return enemyCount++;
    }
    EM_KEEP int act_add_coin(float x, float y){
        if(coinCount >= MAX_COIN) return -1;
        coins[coinCount] = {x, y, 0};
        return coinCount++;
    }
    EM_KEEP int act_add_item(float x, float y, int type){
        if(itemCount >= MAX_ITEM) return -1;
        items[itemCount] = {x, y, type, 0};
        return itemCount++;
    }
    EM_KEEP void act_set_goal(float x, float y, float w, float h){ goalX = x; goalY = y; goalW = w; goalH = h; goalSet = 1; }

    static bool overlap(float ax, float ay, float aw, float ah, float bx, float by, float bw, float bh){
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    // プレイヤーを dx,dy だけ動かし、プラットフォームとのめり込みを解消する
    static void moveAndCollide(float dx, float dy){
        px += dx;
        for(int i = 0; i < platCount; i++){
            Rect &r = plats[i];
            if(!overlap(px, py, PLAYER_W, PLAYER_H, r.x, r.y, r.w, r.h)) continue;
            if(r.solidTop == 0) continue; // 横方向には one-way はすり抜ける
            if(dx > 0) px = r.x - PLAYER_W;
            else if(dx < 0) px = r.x + r.w;
        }
        py += dy;
        onGround = 0;
        for(int i = 0; i < platCount; i++){
            Rect &r = plats[i];
            if(!overlap(px, py, PLAYER_W, PLAYER_H, r.x, r.y, r.w, r.h)) continue;
            if(dy > 0){
                // one-way: 足が 上から めりこんだ時だけ 乗れる
                if(r.solidTop == 0 && (py - dy + PLAYER_H) > r.y + 1) continue;
                py = r.y - PLAYER_H; pvy = 0; onGround = 1;
            }else if(dy < 0 && r.solidTop != 0){
                py = r.y + r.h; pvy = 0;
            }
        }
    }

    static void killPlayer(){
        alive = 0;
    }

    EM_KEEP void act_step(float dt, int left, int right, int jumpPressed, int jumpHeld){
        if(dt > 0.05f) dt = 0.05f;
        if(!alive){
            // 少し待って 自動リスポーン（JS 側で演出し、呼び続けてよい）
            px = respawnX; py = respawnY; pvx = 0; pvy = 0; alive = 1; invuln = 1.2f;
            springT = jetpackT = magnetT = dashT = freezeT = punchT = invincibleT = 0; shieldCount = 0;
            return;
        }
        if(goalReached){ return; }

        // アイテム効果の残り時間を減らす
        if(springT > 0){ springT -= dt; if(springT < 0) springT = 0; }
        if(jetpackT > 0){ jetpackT -= dt; if(jetpackT < 0) jetpackT = 0; }
        if(magnetT > 0){ magnetT -= dt; if(magnetT < 0) magnetT = 0; }
        if(dashT > 0){ dashT -= dt; if(dashT < 0) dashT = 0; }
        if(freezeT > 0){ freezeT -= dt; if(freezeT < 0) freezeT = 0; }
        if(punchT > 0){ punchT -= dt; if(punchT < 0) punchT = 0; }
        if(invincibleT > 0){ invincibleT -= dt; if(invincibleT < 0) invincibleT = 0; }

        float spdMul = dashT > 0 ? DASH_SPEED_MULT : 1.0f;
        if(left && !right){ pvx -= MOVE_ACCEL * spdMul * dt; facing = -1; }
        else if(right && !left){ pvx += MOVE_ACCEL * spdMul * dt; facing = 1; }
        else {
            if(pvx > 0) pvx = (pvx - FRICTION * dt < 0) ? 0 : pvx - FRICTION * dt;
            else if(pvx < 0) pvx = (pvx + FRICTION * dt > 0) ? 0 : pvx + FRICTION * dt;
        }
        pvx = clampf(pvx, -MOVE_MAXSPD * spdMul, MOVE_MAXSPD * spdMul);

        // ジャンプ入力バッファ：押した瞬間を少しの間だけ覚えておく（着地の少し前に押しても ジャンプになる）
        if(jumpPressed) jumpBufT = JUMP_BUFFER;
        else if(jumpBufT > 0) jumpBufT -= dt;
        float jumpVelEff = JUMP_VEL * (springT > 0 ? SPRING_JUMP_MULT : 1.0f);
        // コヨーテタイム：足場を離れた直後も、少しの間はまだジャンプできる（崖の端でのミスを減らす）
        if(jumpBufT > 0 && coyoteT > 0){ pvy = -jumpVelEff; onGround = 0; coyoteT = 0; jumpBufT = 0; doubleJumpUsed = 0; }
        else if(jumpPressed && jetpackT > 0 && !onGround && !doubleJumpUsed && coyoteT <= 0){
            // ジェットパック：空中でもう一度だけ ジャンプできる
            pvy = -jumpVelEff * 0.9f; doubleJumpUsed = 1;
        }
        if(!jumpHeld && pvy < -jumpVelEff * JUMP_CUT) pvy = -jumpVelEff * JUMP_CUT;

        pvy += GRAVITY * dt;
        pvy = clampf(pvy, -2600.0f, 1400.0f);

        moveAndCollide(pvx * dt, 0);
        moveAndCollide(0, pvy * dt);

        if(onGround){ coyoteT = COYOTE_TIME; doubleJumpUsed = 0; }
        else if(coyoteT > 0) coyoteT -= dt;

        if(invuln > 0) invuln -= dt;
        if(py > 2000.0f) killPlayer(); // 落下死

        // 敵の移動とあたり判定
        for(int i = 0; i < enemyCount; i++){
            Enemy &e = enemies[i];
            if(!e.alive) continue;
            e.x += e.faceDir * e.vx * dt * (freezeT > 0 ? FREEZE_MULT : 1.0f);   // こおりスプレー中は 敵がゆっくりに
            if(e.x < e.startX - e.range){ e.x = e.startX - e.range; e.faceDir = 1; }
            if(e.x > e.startX + e.range){ e.x = e.startX + e.range; e.faceDir = -1; }
            if(overlap(px, py, PLAYER_W, PLAYER_H, e.x, e.y, e.w, e.h)){
                bool stomp = (pvy > 0) && (py + PLAYER_H - e.y) < (e.h * 0.6f);
                if(stomp || punchT > 0 || invincibleT > 0){
                    e.alive = 0;
                    if(stomp) pvy = -jumpVelEff * 0.6f;   // 踏んだ時だけ ジャンプで跳ね返る
                } else if(invuln <= 0){
                    if(shieldCount > 0){ shieldCount--; invuln = 0.8f; }   // ガードオーラで1回だけ防ぐ
                    else killPlayer();
                }
            }
        }
        // コイン（じしゃくリング中は、広い範囲から 自動で引きよせて取れる）
        for(int i = 0; i < coinCount; i++){
            Coin &c = coins[i];
            if(c.collected) continue;
            float r = (magnetT > 0) ? MAGNET_RADIUS : 10.0f;
            if(overlap(px, py, PLAYER_W, PLAYER_H, c.x - r, c.y - r, r * 2, r * 2)){ c.collected = 1; coinsCollected++; }
        }
        // アイテム
        for(int i = 0; i < itemCount; i++){
            Item &it = items[i];
            if(it.collected) continue;
            if(!overlap(px, py, PLAYER_W, PLAYER_H, it.x - 14, it.y - 14, 28, 28)) continue;
            it.collected = 1;
            switch(it.type){
                case 1: springT = SPRING_TIME; break;
                case 2: jetpackT = JETPACK_TIME; break;
                case 3: magnetT = MAGNET_TIME; break;
                case 4: shieldCount++; break;
                case 5: dashT = DASH_TIME_A; break;
                case 6: freezeT = FREEZE_TIME; break;
                case 7: punchT = PUNCH_TIME; break;
                case 8: livesGained++; break;
                case 9: invincibleT = INVINCIBLE_TIME; break;
                case 10: coinsCollected += BONUS_COINS; break;
                default: break;
            }
        }
        // ゴール
        if(goalSet && overlap(px, py, PLAYER_W, PLAYER_H, goalX, goalY, goalW, goalH)) goalReached = 1;
    }

    EM_KEEP float* act_get_buffer(){
        outBuf[0] = px; outBuf[1] = py; outBuf[2] = pvx; outBuf[3] = pvy;
        outBuf[4] = (float)onGround; outBuf[5] = (float)alive; outBuf[6] = facing; outBuf[7] = invuln;
        outBuf[8] = (float)coinsCollected; outBuf[9] = (float)goalReached;
        outBuf[10] = (float)enemyCount; outBuf[11] = (float)coinCount;
        outBuf[12] = (float)itemCount; outBuf[13] = (float)livesGained;
        outBuf[14] = springT; outBuf[15] = jetpackT; outBuf[16] = magnetT; outBuf[17] = (float)shieldCount;
        outBuf[18] = dashT; outBuf[19] = freezeT; outBuf[20] = punchT; outBuf[21] = invincibleT;
        int o = HEADER;
        for(int i = 0; i < MAX_ENEMY; i++){
            if(i < enemyCount){
                Enemy &e = enemies[i];
                outBuf[o] = e.x; outBuf[o+1] = e.y; outBuf[o+2] = e.w; outBuf[o+3] = e.h;
                outBuf[o+4] = (float)e.alive; outBuf[o+5] = e.faceDir;
            } else memset(&outBuf[o], 0, sizeof(float) * 6);
            o += 6;
        }
        for(int i = 0; i < MAX_COIN; i++){
            if(i < coinCount){ Coin &c = coins[i]; outBuf[o] = c.x; outBuf[o+1] = c.y; outBuf[o+2] = (float)c.collected; }
            else memset(&outBuf[o], 0, sizeof(float) * 3);
            o += 3;
        }
        for(int i = 0; i < MAX_ITEM; i++){
            if(i < itemCount){
                Item &it = items[i];
                outBuf[o] = it.x; outBuf[o+1] = it.y; outBuf[o+2] = (float)it.type; outBuf[o+3] = (float)it.collected;
            } else memset(&outBuf[o], 0, sizeof(float) * 4);
            o += 4;
        }
        return outBuf;
    }
}

// ---------------------------------------------------------------------------
// レースモード（マラソン風ランナー・10種のオリジナルアイテムつき）
// ---------------------------------------------------------------------------
namespace race {
    const int MAX_WP = 240;   // 32種のコース用：曲がりくねった道は制御点を増やして滑らかにするため点数を多めに確保
    const int MAX_CAR = 4;
    const int MAX_TRAP = 16;
    const int MAX_ITEMBOX = 8;
    const int MAX_OBSTACLE = 40;   // コース固定の障害物（ランナーがぶつかると つまずく。アイテムとは別物で消えない）

    float wpX[MAX_WP], wpZ[MAX_WP]; int wpCount = 0;
    float trackWidth = 10.0f;
    int lapsTarget = 3;

    struct Car {
        float x, z, heading, speed;
        int nearSeg; float segT;     // 直近のコース区間 と その中の位置(0..1)
        int lap; int finished; float finishTime; int rank;
        float maxSpeed, accelPow, aiSkill, aiOffset; int isCpu;
        float stuckT;   // コース外で ほぼ止まっている時間（これがたまると 助けが来る）
        float rescueT;  // 助け（かわいいモンスター）が コースへ運んでいる残り時間。>0の間は 見た目側で 持ち上げ演出をする
        int heldItem;        // 持っているアイテム（0=なし, 1〜10）
        float speedBuffT;    // ダッシュドリンク：残り時間（スピードアップ）
        float turnBuffT;     // スプリントシューズ：残り時間（まわりやすさアップ）
        float shieldT;       // ガードポンチョ：残り時間（次の1回の いやがらせを ふせぐ）
        float staggerT;      // つまずき：残り時間（その間は 加速できない）
        float slowT;         // スロー：残り時間（最高速が下がる）
    };
    Car cars[MAX_CAR]; int carCount = 0;
    float raceTime = 0; int finishedCount = 0;

    // トラップ（うしろに置く わな）：mud=0 スロー／pebble=1 つまずき
    struct Trap { float x, z; int kind; float life; int active; };
    Trap traps[MAX_TRAP]; int trapCount = 0;

    // アイテムボックス（コース上に置く、とると ランダムで 10種のどれかを持つ）
    struct ItemBox { float x, z; float respawnT; };
    ItemBox itemboxes[MAX_ITEMBOX]; int itemboxCount = 0;

    // 障害物（コースに固定で置かれた、よけるべきもの。ぶつかると つまずいて、ぶつかった場所から 外へ押し出される）
    struct Obstacle { float x, z, r; };
    Obstacle obstacles[MAX_OBSTACLE]; int obstacleCount = 0;

    const float BASE_MAXSPD = 46.0f;
    const float BASE_ACCEL = 34.0f;
    const float TURN_RATE = 2.6f;
    const float OFFTRACK_DRAG = 0.55f;
    const float RESCUE_DURATION = 1.3f;   // モンスターが コースへ もどしてくれるまでの 時間（秒）
    const float STUCK_SPEED = 3.0f;       // これより おそい状態で コース外にいると「止まっている」とみなす
    const float STUCK_TIME_LIMIT = 1.1f;  // これだけ 止まっていたら 助けを呼ぶ
    const float OBSTACLE_STAGGER = 0.5f;  // 障害物にぶつかった時の つまずき時間
    const float OBSTACLE_PUSHOUT = 0.9f;  // ぶつかった障害物から 外へ押し出す距離

    // ---- アイテムのバランス調整値（10種、すべて このゲームだけの オリジナル効果） ----
    const float PICKUP_RADIUS = 2.4f;
    const float ITEMBOX_RESPAWN = 5.0f;
    const float TRAP_RADIUS = 1.6f;
    const float TRAP_LIFE = 6.0f;
    const float SLOW_MULT = 0.55f;
    const float DASH_SPEED_MULT = 1.35f;   // 1: ダッシュドリンク
    const float DASH_TIME = 3.5f;
    const float SPRINT_TURN_MULT = 1.55f;  // 2: スプリントシューズ
    const float SPRINT_TIME = 4.0f;
    const float SHIELD_TIME = 8.0f;        // 3: ガードポンチョ
    const float STAGGER_TRIP = 1.2f;       // 4: 足止めロープ
    const float SLOW_DROWSY = 3.0f;        // 5: 眠気スプレー
    const float STAGGER_PEBBLE = 1.1f;     // 7: 石ころばらまき（6はスロー扱い）
    const float CRAMP_STAGGER = 1.0f;      // 8: こむら返りの風（1位をねらう）
    const float CRAMP_SLOW = 2.0f;
    const float STAGGER_CROWD = 0.8f;      // 9: 大声援どよめき（全員）
    const float STAGGER_CHEER = 0.9f;      // 10: 応援メガホン（前方の広い範囲）

    EM_KEEP void race_reset(int laps){
        wpCount = 0; carCount = 0; lapsTarget = laps > 0 ? laps : 3; raceTime = 0; finishedCount = 0;
        trapCount = 0; itemboxCount = 0; obstacleCount = 0;
        for(int i = 0; i < MAX_TRAP; i++) traps[i].active = 0;
    }
    EM_KEEP void race_add_waypoint(float x, float z){
        if(wpCount >= MAX_WP) return;
        wpX[wpCount] = x; wpZ[wpCount] = z; wpCount++;
    }
    EM_KEEP void race_set_width(float w){ trackWidth = w; }
    EM_KEEP int race_add_itembox(float x, float z){
        if(itemboxCount >= MAX_ITEMBOX) return -1;
        itemboxes[itemboxCount] = {x, z, 0.0f};
        return itemboxCount++;
    }
    EM_KEEP int race_add_obstacle(float x, float z, float r){
        if(obstacleCount >= MAX_OBSTACLE) return -1;
        obstacles[obstacleCount] = {x, z, r};
        return obstacleCount++;
    }
    EM_KEEP int race_add_car(float x, float z, float heading, int isCpu, float speedMul, float aiSkill){
        if(carCount >= MAX_CAR) return -1;
        Car &c = cars[carCount];
        c.x = x; c.z = z; c.heading = heading; c.speed = 0;
        c.nearSeg = 0; c.segT = 0; c.lap = 0; c.finished = 0; c.finishTime = 0; c.rank = 0;
        c.maxSpeed = BASE_MAXSPD * speedMul; c.accelPow = BASE_ACCEL * speedMul; c.isCpu = isCpu;
        c.aiSkill = aiSkill; c.aiOffset = (float)((carCount * 37) % 11 - 5) * 0.12f;
        c.stuckT = 0; c.rescueT = 0;
        c.heldItem = 0; c.speedBuffT = 0; c.turnBuffT = 0; c.shieldT = 0; c.staggerT = 0; c.slowT = 0;
        return carCount++;
    }

    static int wrap(int i){ int n = wpCount; return ((i % n) + n) % n; }

    // 現在地から いちばん近い コース区間(i→i+1)と そこでの割合tを求める（前回の近傍から 前方だけ 少し探索）
    static void findNearest(Car &c){
        int bestSeg = c.nearSeg; float bestD = 1e18f, bestT = 0;
        for(int d = -2; d <= 6; d++){
            int i = wrap(c.nearSeg + d);
            int j = wrap(i + 1);
            float ax = wpX[i], az = wpZ[i], bx = wpX[j], bz = wpZ[j];
            float ex = bx - ax, ez = bz - az;
            float len2 = ex * ex + ez * ez; if(len2 < 1e-6f) continue;
            float t = ((c.x - ax) * ex + (c.z - az) * ez) / len2;
            t = clampf(t, 0.0f, 1.0f);
            float px = ax + ex * t, pz = az + ez * t;
            float dx = c.x - px, dz = c.z - pz;
            float d2 = dx * dx + dz * dz;
            if(d2 < bestD){ bestD = d2; bestSeg = i; bestT = t; }
        }
        int prevSeg = c.nearSeg;
        c.nearSeg = bestSeg; c.segT = bestT;
        // 周回検出：区間番号が 終盤(最後)から 序盤(0近く)へ 進んだら 1周
        if(prevSeg > wpCount - 3 && bestSeg < 3 && !c.finished) c.lap++;
    }

    // コース全体から いちばん近い点を探す（迷子になったときの「もどす先」を まちがえないための 全体さがし。重くないので ここぞという時だけ使う）
    static void findNearestFull(Car &c){
        int bestSeg = 0; float bestD = 1e18f, bestT = 0;
        for(int i = 0; i < wpCount; i++){
            int j = wrap(i + 1);
            float ax = wpX[i], az = wpZ[i], bx = wpX[j], bz = wpZ[j];
            float ex = bx - ax, ez = bz - az;
            float len2 = ex * ex + ez * ez; if(len2 < 1e-6f) continue;
            float t = ((c.x - ax) * ex + (c.z - az) * ez) / len2;
            t = clampf(t, 0.0f, 1.0f);
            float px = ax + ex * t, pz = az + ez * t;
            float dx = c.x - px, dz = c.z - pz;
            float d2 = dx * dx + dz * dz;
            if(d2 < bestD){ bestD = d2; bestSeg = i; bestT = t; }
        }
        c.nearSeg = bestSeg; c.segT = bestT;
    }

    static float lateralOffset(Car &c){
        int i = c.nearSeg, j = wrap(i + 1);
        float ax = wpX[i], az = wpZ[i], bx = wpX[j], bz = wpZ[j];
        float ex = bx - ax, ez = bz - az;
        float len = sqrtf(ex * ex + ez * ez); if(len < 1e-6f) return 0;
        float nx = -ez / len, nz = ex / len; // 法線
        float px = ax + ex * c.segT, pz = az + ez * c.segT;
        return (c.x - px) * nx + (c.z - pz) * nz;
    }

    // ---- アイテム効果のたすけ関数 ----
    static float progressOf(Car &c){ return (float)c.nearSeg + c.segT; }
    // from から to までの「前方への」距離（コースを1周する分でラップする）
    static float aheadDiff(float from, float to){
        float d = to - from;
        float n = (float)wpCount;
        while(d < 0) d += n;
        while(d >= n) d -= n;
        return d;
    }
    // いやがらせ効果：ガードポンチョ(shieldT>0)を持っていたら 1回だけ ふせぐ
    static void applyStagger(Car &c, float t){
        if(c.shieldT > 0){ c.shieldT = 0; return; }
        if(t > c.staggerT) c.staggerT = t;
        c.speed = 0;
    }
    static void applySlow(Car &c, float t){
        if(c.shieldT > 0){ c.shieldT = 0; return; }
        if(t > c.slowT) c.slowT = t;
    }
    // じぶんより前にいる、いちばん近いランナーを探す（単体ねらいのアイテム用。見つからなければ -1）
    static int findAheadTarget(int from, float maxDiff){
        float fromP = progressOf(cars[from]);
        int best = -1; float bestDiff = 1e18f;
        for(int i = 0; i < carCount; i++){
            if(i == from || cars[i].finished) continue;
            float diff = aheadDiff(fromP, progressOf(cars[i]));
            if(diff > 0.0f && diff <= maxDiff && diff < bestDiff){ bestDiff = diff; best = i; }
        }
        return best;
    }
    // 現在、いちばん先に進んでいる（1位の）ランナーを探す
    static int leaderIndex(){
        int best = -1; float bestScore = -1e18f;
        for(int i = 0; i < carCount; i++){
            float score = (float)cars[i].lap * 100000.0f + progressOf(cars[i]);
            if(score > bestScore){ bestScore = score; best = i; }
        }
        return best;
    }
    // うしろに わな（トラップ）を置く
    static void addTrap(Car &c, int kind){
        float bx = c.x - sinf(c.heading) * 4.0f, bz = c.z - cosf(c.heading) * 4.0f;
        int slot = -1;
        for(int i = 0; i < trapCount; i++) if(!traps[i].active){ slot = i; break; }
        if(slot < 0){ if(trapCount < MAX_TRAP) slot = trapCount++; else slot = 0; }
        traps[slot] = {bx, bz, kind, TRAP_LIFE, 1};
    }

    // 持っているアイテムを使う（10種、すべて マリオカートの こうら・バナナなどとは まったく別のオリジナル効果）
    //  1 ダッシュドリンク：自分が 少しのあいだ 速くなる（自己バフ）
    //  2 スプリントシューズ：自分が 少しのあいだ まわりやすくなる（自己：まわりやすさ）
    //  3 ガードポンチョ：次の1回の いやがらせを ふせぐ（自己シールド）
    //  4 足止めロープ：前方の いちばん近いランナーを つまずかせる（単体・前方）
    //  5 眠気スプレー：前方の いちばん近いランナーを スローにする（単体・前方）
    //  6 ぬかるみ跳ね：うしろに スローのわなを置く（わな・後方）
    //  7 石ころばらまき：うしろに つまずきのわなを置く（わな・後方）
    //  8 こむら返りの風：現在1位のランナーを ねらって つまずかせ、そのあとスローにする（1位ねらい）
    //  9 大声援どよめき：自分以外 全員を いっせいに つまずかせる（全体）
    // 10 応援メガホン：前方の広いはんいにいる ランナーたちを まとめて つまずかせる（前方・複数）
    static void fireItem(int ci){
        Car &c = cars[ci];
        int item = c.heldItem;
        if(item <= 0) return;
        c.heldItem = 0;
        const float AHEAD_NEAR = (float)wpCount * 0.35f;
        const float AHEAD_WIDE = (float)wpCount * 0.5f;
        switch(item){
            case 1: c.speedBuffT = DASH_TIME; break;
            case 2: c.turnBuffT = SPRINT_TIME; break;
            case 3: c.shieldT = SHIELD_TIME; break;
            case 4: { int t = findAheadTarget(ci, AHEAD_NEAR); if(t >= 0) applyStagger(cars[t], STAGGER_TRIP); break; }
            case 5: { int t = findAheadTarget(ci, AHEAD_NEAR); if(t >= 0) applySlow(cars[t], SLOW_DROWSY); break; }
            case 6: addTrap(c, 0); break;
            case 7: addTrap(c, 1); break;
            case 8: {
                int L = leaderIndex();
                if(L >= 0 && L != ci){
                    Car &tc = cars[L];
                    if(tc.shieldT > 0) tc.shieldT = 0;
                    else {
                        if(CRAMP_STAGGER > tc.staggerT) tc.staggerT = CRAMP_STAGGER;
                        float slowTotal = CRAMP_STAGGER + CRAMP_SLOW;
                        if(slowTotal > tc.slowT) tc.slowT = slowTotal;
                        tc.speed = 0;
                    }
                }
                break;
            }
            case 9: for(int i = 0; i < carCount; i++){ if(i != ci && !cars[i].finished) applyStagger(cars[i], STAGGER_CROWD); } break;
            case 10: {
                float fromP = progressOf(c);
                for(int i = 0; i < carCount; i++){
                    if(i == ci || cars[i].finished) continue;
                    float diff = aheadDiff(fromP, progressOf(cars[i]));
                    if(diff > 0.0f && diff <= AHEAD_WIDE) applyStagger(cars[i], STAGGER_CHEER);
                }
                break;
            }
            default: break;
        }
    }

    EM_KEEP void race_step(float dt, float steer, float accel, float brake, int useItem){
        if(dt > 0.05f) dt = 0.05f;
        if(wpCount < 3 || carCount < 1) return;
        raceTime += dt;
        for(int ci = 0; ci < carCount; ci++){
            Car &c = cars[ci];
            if(c.finished) continue;

            // 助けてもらっている最中：モンスターが運んでいる間は 操作をうけつけず じっとしている（見た目は JS 側で 持ち上げ演出）
            if(c.rescueT > 0){
                c.rescueT -= dt;
                if(c.rescueT < 0) c.rescueT = 0;
                continue;
            }

            // アイテム効果の残り時間を減らす
            if(c.staggerT > 0){ c.staggerT -= dt; if(c.staggerT < 0) c.staggerT = 0; }
            if(c.slowT > 0){ c.slowT -= dt; if(c.slowT < 0) c.slowT = 0; }
            if(c.speedBuffT > 0){ c.speedBuffT -= dt; if(c.speedBuffT < 0) c.speedBuffT = 0; }
            if(c.turnBuffT > 0){ c.turnBuffT -= dt; if(c.turnBuffT < 0) c.turnBuffT = 0; }
            if(c.shieldT > 0){ c.shieldT -= dt; if(c.shieldT < 0) c.shieldT = 0; }

            float st = steer, ac = accel, br = brake;
            if(c.isCpu){
                int lookAhead = wpCount / 11; if(lookAhead < 3) lookAhead = 3;   // 点が多い（曲がりくねった）コースでも 見る先をそろえる
                int tgt = wrap(c.nearSeg + lookAhead);
                float dx = wpX[tgt] + 0.0f - c.x, dz = wpZ[tgt] - c.z;
                float desired = atan2f(dx, dz);
                float diff = desired - c.heading;
                while(diff > 3.14159265f) diff -= 6.2831853f;
                while(diff < -3.14159265f) diff += 6.2831853f;
                st = clampf(diff * 1.6f, -1.0f, 1.0f);
                ac = 1.0f; br = 0.0f;
                // CPUは、持っていたら ごくまれに自分でアイテムを使う（シールドなどのバフはいつでも使う）
                if(c.heldItem != 0 && (rand() % 240) == 0) fireItem(ci);
            } else if(useItem && c.heldItem != 0){
                fireItem(ci);
            }

            float off = lateralOffset(c);
            float half = trackWidth * 0.5f;
            float grip = (fabsf(off) > half) ? OFFTRACK_DRAG : 1.0f;
            float speedMul = (c.speedBuffT > 0 ? DASH_SPEED_MULT : 1.0f) * (c.slowT > 0 ? SLOW_MULT : 1.0f);
            float turnMul = (c.turnBuffT > 0 ? SPRINT_TURN_MULT : 1.0f);
            float effMaxSpeed = c.maxSpeed * grip * speedMul;

            if(c.staggerT > 0.0f){
                // つまずいて、少しのあいだ 加速できない（いきおいだけで すっと止まっていく）
                c.speed -= 30.0f * dt;
                if(c.speed < 0) c.speed = 0;
            } else {
                c.speed += (ac * c.accelPow * speedMul - br * c.accelPow * 2.2f) * dt * grip;
                c.speed -= 8.0f * dt; // 自然減速
                c.speed = clampf(c.speed, 0.0f, effMaxSpeed);
                c.heading += st * TURN_RATE * turnMul * dt * (0.4f + 0.6f * (c.speed / c.maxSpeed));
            }
            c.x += sinf(c.heading) * c.speed * dt;
            c.z += cosf(c.heading) * c.speed * dt;

            // アイテムボックス：まだ何も持っていないときに 近づくと、10種のどれかをランダムで持つ
            for(int bi = 0; bi < itemboxCount; bi++){
                ItemBox &b = itemboxes[bi];
                if(b.respawnT > 0){ b.respawnT -= dt; continue; }
                if(c.heldItem != 0) continue;
                float dx = c.x - b.x, dz = c.z - b.z;
                if(dx * dx + dz * dz < PICKUP_RADIUS * PICKUP_RADIUS){
                    c.heldItem = 1 + (rand() % 10);
                    b.respawnT = ITEMBOX_RESPAWN;
                }
            }

            // わな（トラップ）に ふれたら発動して消える（1回だけ効く）
            for(int ti = 0; ti < trapCount; ti++){
                Trap &tr = traps[ti];
                if(!tr.active) continue;
                float dx = c.x - tr.x, dz = c.z - tr.z;
                if(dx * dx + dz * dz < TRAP_RADIUS * TRAP_RADIUS){
                    if(tr.kind == 0) applySlow(c, SLOW_DROWSY); else applyStagger(c, STAGGER_PEBBLE);
                    tr.active = 0;
                }
            }

            // 障害物（コース固定）：ぶつかると つまずいて、ぶつかった場所から外へ押し出される（何度も踏みつづけない）
            for(int oi = 0; oi < obstacleCount; oi++){
                Obstacle &ob = obstacles[oi];
                float dx = c.x - ob.x, dz = c.z - ob.z;
                float rr = ob.r + 0.9f;
                float d2 = dx * dx + dz * dz;
                if(d2 < rr * rr){
                    float d = sqrtf(d2); if(d < 0.001f) d = 0.001f;
                    float nx = dx / d, nz = dz / d;
                    c.x = ob.x + nx * (rr + OBSTACLE_PUSHOUT);
                    c.z = ob.z + nz * (rr + OBSTACLE_PUSHOUT);
                    applyStagger(c, OBSTACLE_STAGGER);
                }
            }

            // コース外で ほとんど止まっている時間をはかる → たまったら かわいいモンスターが助けに来る
            bool offTrack = fabsf(off) > half;
            if(offTrack && fabsf(c.speed) < STUCK_SPEED) c.stuckT += dt; else c.stuckT = 0;
            bool veryFarOff = fabsf(off) > half * 3.0f;

            if(c.stuckT > STUCK_TIME_LIMIT || veryFarOff){
                // 迷子状態でも まちがえずに戻せるよう、コース全体から 正しい最近点をさがし直す
                findNearestFull(c);
                int i = c.nearSeg, j = wrap(i + 1);
                float ex = wpX[j] - wpX[i], ez = wpZ[j] - wpZ[i];
                float px = wpX[i] + ex * c.segT, pz = wpZ[i] + ez * c.segT;
                c.x = px; c.z = pz;
                c.heading = atan2f(ex, ez);
                c.speed = 0;
                c.stuckT = 0;
                c.rescueT = RESCUE_DURATION;
                continue;
            }

            findNearest(c);
            if(c.lap >= lapsTarget && !c.finished){ c.finished = 1; c.finishTime = raceTime; finishedCount++; c.rank = finishedCount; }
        }
        // わなの寿命（使われなかったわなは、やがて自然に消える）
        for(int ti = 0; ti < trapCount; ti++){
            if(!traps[ti].active) continue;
            traps[ti].life -= dt;
            if(traps[ti].life <= 0) traps[ti].active = 0;
        }
    }

    // 出力: [0]carCount [1]lapsTarget [2]raceTime [3]finishedCount [4]trapCount [5]itemboxCount
    // car毎 16: x,z,heading,speed,lap,finished,rank,progress(nearSeg+segT),isCpu,rescue(0..1 残り),
    //           heldItem(0〜10), stagger(0/1), slow(0/1), shield(0/1), speedBuff(0/1), turnBuff(0/1)
    // そのあと わな(MAX_TRAP)×4: x,z,kind,life(0..1 残り。0なら無し) → アイテムボックス(MAX_ITEMBOX)×3: x,z,avail(0/1)
    const int HEADER = 6;
    const int PER_CAR = 16;
    float outBuf[HEADER + MAX_CAR * PER_CAR + MAX_TRAP * 4 + MAX_ITEMBOX * 3];
    EM_KEEP float* race_get_buffer(){
        outBuf[0] = (float)carCount; outBuf[1] = (float)lapsTarget; outBuf[2] = raceTime; outBuf[3] = (float)finishedCount;
        outBuf[4] = (float)trapCount; outBuf[5] = (float)itemboxCount;
        int o = HEADER;
        for(int i = 0; i < MAX_CAR; i++){
            if(i < carCount){
                Car &c = cars[i];
                outBuf[o] = c.x; outBuf[o+1] = c.z; outBuf[o+2] = c.heading; outBuf[o+3] = c.speed;
                outBuf[o+4] = (float)c.lap; outBuf[o+5] = (float)c.finished; outBuf[o+6] = (float)c.rank;
                outBuf[o+7] = (float)c.nearSeg + c.segT; outBuf[o+8] = (float)c.isCpu;
                outBuf[o+9] = c.rescueT / RESCUE_DURATION;
                outBuf[o+10] = (float)c.heldItem;
                outBuf[o+11] = c.staggerT > 0 ? 1.0f : 0.0f;
                outBuf[o+12] = c.slowT > 0 ? 1.0f : 0.0f;
                outBuf[o+13] = c.shieldT > 0 ? 1.0f : 0.0f;
                outBuf[o+14] = c.speedBuffT > 0 ? 1.0f : 0.0f;
                outBuf[o+15] = c.turnBuffT > 0 ? 1.0f : 0.0f;
            } else memset(&outBuf[o], 0, sizeof(float) * PER_CAR);
            o += PER_CAR;
        }
        for(int i = 0; i < MAX_TRAP; i++){
            if(i < trapCount && traps[i].active){
                outBuf[o] = traps[i].x; outBuf[o+1] = traps[i].z; outBuf[o+2] = (float)traps[i].kind; outBuf[o+3] = traps[i].life / TRAP_LIFE;
            } else memset(&outBuf[o], 0, sizeof(float) * 4);
            o += 4;
        }
        for(int i = 0; i < MAX_ITEMBOX; i++){
            if(i < itemboxCount){
                outBuf[o] = itemboxes[i].x; outBuf[o+1] = itemboxes[i].z; outBuf[o+2] = itemboxes[i].respawnT <= 0 ? 1.0f : 0.0f;
            } else memset(&outBuf[o], 0, sizeof(float) * 3);
            o += 3;
        }
        return outBuf;
    }
}

EM_KEEP int game8_ping(){ return 42; }
