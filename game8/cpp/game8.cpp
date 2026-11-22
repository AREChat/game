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

    struct Rect { float x, y, w, h; int solidTop; };
    struct Enemy { float x, y, w, h, vx; int alive; float faceDir; float startX, range; };
    struct Coin { float x, y; int collected; };

    Rect plats[MAX_PLAT]; int platCount = 0;
    Enemy enemies[MAX_ENEMY]; int enemyCount = 0;
    Coin coins[MAX_COIN]; int coinCount = 0;
    float goalX, goalY, goalW, goalH;
    int goalSet = 0;

    float px, py, pvx, pvy;
    int onGround, alive, goalReached;
    float facing, invuln;
    int coinsCollected;
    float respawnX, respawnY;
    float coyoteT, jumpBufT;   // 操作しやすくするための「少しの甘さ」（下の act_step 内の説明を参照）

    const float GRAVITY = 1700.0f;
    const float MOVE_ACCEL = 2600.0f;
    const float MOVE_MAXSPD = 260.0f;
    const float FRICTION = 2200.0f;
    const float JUMP_VEL = 560.0f;
    const float JUMP_CUT = 0.45f;   // ボタンを早く離すと ジャンプが低くなる
    const float COYOTE_TIME = 0.1f;   // 足場から落ちた直後も、これだけの間はジャンプを受け付ける（コヨーテタイム）
    const float JUMP_BUFFER = 0.12f;  // 着地の少し前にジャンプを押しても、着地した瞬間にジャンプとして受け付ける（入力バッファ）
    const float PLAYER_W = 30.0f, PLAYER_H = 40.0f;
    const float ENEMY_W = 32.0f, ENEMY_H = 28.0f;

    // 出力バッファ: [0]px [1]py [2]vx [3]vy [4]onGround [5]alive [6]facing [7]invuln
    // [8]coinsCollected [9]goalReached [10]enemyCount [11]coinCount
    // そのあと enemy*6 (x,y,w,h,alive,facing) → coin*3 (x,y,collected)
    const int HEADER = 12;
    float outBuf[HEADER + MAX_ENEMY * 6 + MAX_COIN * 3];

    EM_KEEP void act_reset(float sx, float sy){
        platCount = 0; enemyCount = 0; coinCount = 0; goalSet = 0;
        px = sx; py = sy; pvx = 0; pvy = 0; onGround = 0; alive = 1; goalReached = 0;
        facing = 1; invuln = 0; coinsCollected = 0; respawnX = sx; respawnY = sy;
        coyoteT = 0; jumpBufT = 0;
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
            return;
        }
        if(goalReached){ return; }

        if(left && !right){ pvx -= MOVE_ACCEL * dt; facing = -1; }
        else if(right && !left){ pvx += MOVE_ACCEL * dt; facing = 1; }
        else {
            if(pvx > 0) pvx = (pvx - FRICTION * dt < 0) ? 0 : pvx - FRICTION * dt;
            else if(pvx < 0) pvx = (pvx + FRICTION * dt > 0) ? 0 : pvx + FRICTION * dt;
        }
        pvx = clampf(pvx, -MOVE_MAXSPD, MOVE_MAXSPD);

        // ジャンプ入力バッファ：押した瞬間を少しの間だけ覚えておく（着地の少し前に押しても ジャンプになる）
        if(jumpPressed) jumpBufT = JUMP_BUFFER;
        else if(jumpBufT > 0) jumpBufT -= dt;
        // コヨーテタイム：足場を離れた直後も、少しの間はまだジャンプできる（崖の端でのミスを減らす）
        if(jumpBufT > 0 && coyoteT > 0){ pvy = -JUMP_VEL; onGround = 0; coyoteT = 0; jumpBufT = 0; }
        if(!jumpHeld && pvy < -JUMP_VEL * JUMP_CUT) pvy = -JUMP_VEL * JUMP_CUT;

        pvy += GRAVITY * dt;
        pvy = clampf(pvy, -2000.0f, 1400.0f);

        moveAndCollide(pvx * dt, 0);
        moveAndCollide(0, pvy * dt);

        if(onGround) coyoteT = COYOTE_TIME;
        else if(coyoteT > 0) coyoteT -= dt;

        if(invuln > 0) invuln -= dt;
        if(py > 2000.0f) killPlayer(); // 落下死

        // 敵の移動とあたり判定
        for(int i = 0; i < enemyCount; i++){
            Enemy &e = enemies[i];
            if(!e.alive) continue;
            e.x += e.faceDir * e.vx * dt;
            if(e.x < e.startX - e.range){ e.x = e.startX - e.range; e.faceDir = 1; }
            if(e.x > e.startX + e.range){ e.x = e.startX + e.range; e.faceDir = -1; }
            if(overlap(px, py, PLAYER_W, PLAYER_H, e.x, e.y, e.w, e.h)){
                bool stomp = (pvy > 0) && (py + PLAYER_H - e.y) < (e.h * 0.6f);
                if(stomp){ e.alive = 0; pvy = -JUMP_VEL * 0.6f; }
                else if(invuln <= 0){ killPlayer(); }
            }
        }
        // コイン
        for(int i = 0; i < coinCount; i++){
            Coin &c = coins[i];
            if(c.collected) continue;
            if(overlap(px, py, PLAYER_W, PLAYER_H, c.x - 10, c.y - 10, 20, 20)){ c.collected = 1; coinsCollected++; }
        }
        // ゴール
        if(goalSet && overlap(px, py, PLAYER_W, PLAYER_H, goalX, goalY, goalW, goalH)) goalReached = 1;
    }

    EM_KEEP float* act_get_buffer(){
        outBuf[0] = px; outBuf[1] = py; outBuf[2] = pvx; outBuf[3] = pvy;
        outBuf[4] = (float)onGround; outBuf[5] = (float)alive; outBuf[6] = facing; outBuf[7] = invuln;
        outBuf[8] = (float)coinsCollected; outBuf[9] = (float)goalReached;
        outBuf[10] = (float)enemyCount; outBuf[11] = (float)coinCount;
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
        return outBuf;
    }
}

// ---------------------------------------------------------------------------
// レースモード（マリオカート風）
// ---------------------------------------------------------------------------
namespace race {
    const int MAX_WP = 96;
    const int MAX_CAR = 4;

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
    };
    Car cars[MAX_CAR]; int carCount = 0;
    float raceTime = 0; int finishedCount = 0;

    const float BASE_MAXSPD = 46.0f;
    const float BASE_ACCEL = 34.0f;
    const float TURN_RATE = 2.6f;
    const float OFFTRACK_DRAG = 0.55f;
    const float RESCUE_DURATION = 1.3f;   // モンスターが コースへ もどしてくれるまでの 時間（秒）
    const float STUCK_SPEED = 3.0f;       // これより おそい状態で コース外にいると「止まっている」とみなす
    const float STUCK_TIME_LIMIT = 1.1f;  // これだけ 止まっていたら 助けを呼ぶ

    EM_KEEP void race_reset(int laps){
        wpCount = 0; carCount = 0; lapsTarget = laps > 0 ? laps : 3; raceTime = 0; finishedCount = 0;
    }
    EM_KEEP void race_add_waypoint(float x, float z){
        if(wpCount >= MAX_WP) return;
        wpX[wpCount] = x; wpZ[wpCount] = z; wpCount++;
    }
    EM_KEEP void race_set_width(float w){ trackWidth = w; }
    EM_KEEP int race_add_car(float x, float z, float heading, int isCpu, float speedMul, float aiSkill){
        if(carCount >= MAX_CAR) return -1;
        Car &c = cars[carCount];
        c.x = x; c.z = z; c.heading = heading; c.speed = 0;
        c.nearSeg = 0; c.segT = 0; c.lap = 0; c.finished = 0; c.finishTime = 0; c.rank = 0;
        c.maxSpeed = BASE_MAXSPD * speedMul; c.accelPow = BASE_ACCEL * speedMul; c.isCpu = isCpu;
        c.aiSkill = aiSkill; c.aiOffset = (float)((carCount * 37) % 11 - 5) * 0.12f;
        c.stuckT = 0; c.rescueT = 0;
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

    EM_KEEP void race_step(float dt, float steer, float accel, float brake){
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

            float st = steer, ac = accel, br = brake;
            if(c.isCpu){
                int tgt = wrap(c.nearSeg + 6);
                float dx = wpX[tgt] + 0.0f - c.x, dz = wpZ[tgt] - c.z;
                float desired = atan2f(dx, dz);
                float diff = desired - c.heading;
                while(diff > 3.14159265f) diff -= 6.2831853f;
                while(diff < -3.14159265f) diff += 6.2831853f;
                st = clampf(diff * 1.6f, -1.0f, 1.0f);
                ac = 1.0f; br = 0.0f;
                // 性能差（アイテムなし。speedMul/aiSkillで 強さに差を付ける）
            }
            float off = lateralOffset(c);
            float half = trackWidth * 0.5f;
            float grip = (fabsf(off) > half) ? OFFTRACK_DRAG : 1.0f;

            c.speed += (ac * c.accelPow - br * c.accelPow * 2.2f) * dt * grip;
            c.speed -= 8.0f * dt; // 自然減速
            c.speed = clampf(c.speed, 0.0f, c.maxSpeed * grip);

            c.heading += st * TURN_RATE * dt * (0.4f + 0.6f * (c.speed / c.maxSpeed));
            c.x += sinf(c.heading) * c.speed * dt;
            c.z += cosf(c.heading) * c.speed * dt;

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
    }

    // 出力: [0]carCount [1]lapsTarget [2]raceTime [3]finishedCount
    // car毎 10: x,z,heading,speed,lap,finished,rank,progress(nearSeg+segT),isCpu,rescue(0..1 残り。0なら助けは来ていない)
    const int HEADER = 4;
    const int PER_CAR = 10;
    float outBuf[HEADER + MAX_CAR * PER_CAR];
    EM_KEEP float* race_get_buffer(){
        outBuf[0] = (float)carCount; outBuf[1] = (float)lapsTarget; outBuf[2] = raceTime; outBuf[3] = (float)finishedCount;
        int o = HEADER;
        for(int i = 0; i < MAX_CAR; i++){
            if(i < carCount){
                Car &c = cars[i];
                outBuf[o] = c.x; outBuf[o+1] = c.z; outBuf[o+2] = c.heading; outBuf[o+3] = c.speed;
                outBuf[o+4] = (float)c.lap; outBuf[o+5] = (float)c.finished; outBuf[o+6] = (float)c.rank;
                outBuf[o+7] = (float)c.nearSeg + c.segT; outBuf[o+8] = (float)c.isCpu;
                outBuf[o+9] = c.rescueT / RESCUE_DURATION;
            } else memset(&outBuf[o], 0, sizeof(float) * PER_CAR);
            o += PER_CAR;
        }
        return outBuf;
    }
}

EM_KEEP int game8_ping(){ return 42; }
