// ===== OFFLINE PARADISE（game7）：①ネオン・サイバーダッシュ の物理・判定・スコア計算 =====
// もともと js/games.js の D（ダッシュ）オブジェクトの中にあった、重力・ジャンプ・スライディング・
// 障害物とコインの当たり判定・コンボ／フィーバー・スコア計算を C++ に移植したもの。
// 見た目の描画（ネオンの街・走者・パーティクル）は js/games.js 側がそのまま担当し、
// このC++コアが毎フレーム返す状態（位置・障害物・コインの配列）だけを読んで描く。
// ビルド: emcc cpp/game7.cpp -O3 -s WASM=1 ... -o js/game7.wasm.js
#include <cmath>
#include <cstring>
#include <cstdlib>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }

namespace dash {
    const int MAX_OBS = 20, MAX_COIN = 64;
    const float GROUND = 520.0f, W = 360.0f;
    const float PX = 64.0f, PW = 30.0f;

    struct Obs { float x, w, h, y; int type; int active; int done; int dead; int evt; }; // evt: 0=なし 1=フィーバーで ふっとばした 2=ぶつかった
    struct Coin { float x, y; int active; int got; };

    Obs obs[MAX_OBS]; Coin coins[MAX_COIN];
    float py, vy, slide, dist, bx, fever, inv, shake, flash, nextT;
    int combo, score10; // score は 10倍した整数で持つ（JSの小数スコアに近い値を float で返す）
    float scoreF;
    unsigned int rngState;
    int alive_ = 1;

    static float frand(){ // 0..1 の疑似乱数（JSのMath.random相当。再現性は不要なので軽量なLCG）
        rngState = rngState * 1664525u + 1013904223u;
        return (float)(rngState >> 8) / (float)(1u << 24);
    }
    static float rnd(float a, float b){ return a + frand() * (b - a); }

    EM_KEEP void dash_reset(unsigned int seed){
        rngState = seed ? seed : 1;
        py = 0; vy = 0; slide = 0; dist = 0; bx = 0; fever = 0; inv = 0; shake = 0; flash = 0;
        combo = 0; scoreF = 0; nextT = 400;
        for(int i = 0; i < MAX_OBS; i++){ obs[i] = {0, 0, 0, 0, 0, 0, 0, 0, 0}; }
        for(int i = 0; i < MAX_COIN; i++){ coins[i] = {0, 0, 0, 0}; }
    }
    EM_KEEP void dash_tap(){
        if(py == 0 && slide <= 0){ vy = -740.0f; }
    }
    EM_KEEP void dash_slide(){
        slide = 0.55f; if(py > 0) vy = vy > 600.0f ? vy : 600.0f;
    }

    static int freeObsSlot(){ for(int i = 0; i < MAX_OBS; i++) if(!obs[i].active) return i; return -1; }
    static int freeCoinSlot(){ for(int i = 0; i < MAX_COIN; i++) if(!coins[i].active) return i; return -1; }

    // 戻り値バッファに書く前に、まず C++ 側で1フレーム分 すすめる
    EM_KEEP void dash_step(float dt, float timeSec){
        if(dt > 0.05f) dt = 0.05f;
        float v = (300.0f + timeSec * 4.0f) * (fever > 0 ? 1.5f : 1.0f);
        dist += v * dt; scoreF += v * dt / 25.0f; bx += v * dt;
        if(fever > 0) fever -= dt;
        if(inv > 0) inv -= dt;
        if(slide > 0) slide -= dt;
        if(shake > 0) shake -= dt;
        if(flash > 0) flash -= dt;
        vy += 2300.0f * dt; py -= vy * dt;
        if(py <= 0) { py = 0; vy = 0; }
        if(py < 0) py = 0;

        nextT -= v * dt;
        if(nextT <= 0){
            int type = frand() < 0.5f ? 0 : 1; // 0=low,1=high
            int slot = freeObsSlot();
            if(slot >= 0){
                float w = type == 0 ? 34.0f : 56.0f, h = type == 0 ? 42.0f : 24.0f, oy = type == 0 ? 0.0f : 36.0f;
                obs[slot] = {W + 40.0f, w, h, oy, type, 1, 0, 0, 0};
                if(frand() < 0.7f){
                    float cy = type == 0 ? 120.0f : 20.0f, cx = W + 40.0f - 90.0f;
                    for(int i = 0; i < 5; i++){
                        int cs = freeCoinSlot(); if(cs < 0) break;
                        float kx = cx + i * 28.0f, ky = cy + (type == 0 ? sinf((float)i / 4.0f * 3.14159f) * 50.0f : 0.0f);
                        coins[cs] = {kx, ky, 1, 0};
                    }
                }
            }
            nextT = rnd(300, 480) + v * 0.25f;
        }

        float ph = slide > 0 ? 22.0f : 44.0f, ptop = GROUND - py - ph, pbot = GROUND - py;
        for(int i = 0; i < MAX_OBS; i++){
            if(!obs[i].active) continue;
            Obs &o = obs[i];
            o.evt = 0;
            o.x -= v * dt;
            float ot = GROUND - o.y - o.h, ob = GROUND - o.y;
            if(!o.done && o.x < PX + PW && o.x + o.w > PX && ptop < ob && pbot > ot){
                o.done = 1;
                if(fever > 0){ scoreF += 20; o.evt = 1; }
                else if(inv <= 0){ combo = 0; o.evt = 2; inv = 1; shake = 0.3f; o.dead = 1; }
            } else if(!o.done && o.x + o.w < PX){
                o.done = 1; combo++; scoreF += 10 + combo;
                if(combo % 8 == 0 && fever <= 0){ fever = 5; flash = 0.5f; }
            }
            if(o.x <= -80 || o.dead){ o.active = 0; }
        }
        for(int i = 0; i < MAX_COIN; i++){
            if(!coins[i].active) continue;
            Coin &k = coins[i];
            k.x -= v * dt;
            if(!k.got && fabsf(k.x - (PX + 15)) < 22 && fabsf((GROUND - k.y - 12) - (ptop + ph / 2)) < 34){
                k.got = 1; scoreF += 5;
            }
            if(k.x <= -20 || k.got){ /* gotはこのフレームだけ知らせてから次フレームで消す */ }
        }
        // got済み・画面外は次フレームで非アクティブ化（JS側に1フレームだけgot=1を見せるため1段遅らせる）
        for(int i = 0; i < MAX_COIN; i++){
            if(coins[i].active && (coins[i].x <= -20)) coins[i].active = 0;
        }
    }
    // コインは got を伝えた直後に消す（dash_stepの翌フレーム冒頭で呼ぶのではなく、バッファ読み出し後にJSが呼ぶ）
    EM_KEEP void dash_consume_gotcoins(){
        for(int i = 0; i < MAX_COIN; i++) if(coins[i].active && coins[i].got) coins[i].active = 0;
    }
    EM_KEEP void dash_consume_obsevents(){
        for(int i = 0; i < MAX_OBS; i++) if(obs[i].active && obs[i].evt) obs[i].evt = 0;
    }

    // 出力バッファ: [0]py [1]vy [2]slide [3]dist [4]bx [5]fever [6]inv [7]shake [8]flash
    // [9]combo [10]score [11]obsCount(常にMAX_OBS固定) [12]coinCount(常にMAX_COIN固定)
    // そのあと obs(MAX_OBS)×7: x,w,h,y,type,done,evt(active=0ならすべて0) → coin(MAX_COIN)×3: x,y,got(active=0なら0)
    const int HEADER = 13;
    float outBuf[HEADER + MAX_OBS * 7 + MAX_COIN * 3];
    EM_KEEP float* dash_get_buffer(){
        outBuf[0] = py; outBuf[1] = vy; outBuf[2] = slide; outBuf[3] = dist; outBuf[4] = bx;
        outBuf[5] = fever; outBuf[6] = inv; outBuf[7] = shake; outBuf[8] = flash;
        outBuf[9] = (float)combo; outBuf[10] = scoreF; outBuf[11] = (float)MAX_OBS; outBuf[12] = (float)MAX_COIN;
        int o = HEADER;
        for(int i = 0; i < MAX_OBS; i++){
            if(obs[i].active){ Obs &x = obs[i]; outBuf[o]=x.x; outBuf[o+1]=x.w; outBuf[o+2]=x.h; outBuf[o+3]=x.y; outBuf[o+4]=(float)x.type; outBuf[o+5]=(float)x.done; outBuf[o+6]=(float)x.evt; }
            else memset(&outBuf[o], 0, sizeof(float) * 7);
            o += 7;
        }
        for(int i = 0; i < MAX_COIN; i++){
            if(coins[i].active){ Coin &k = coins[i]; outBuf[o]=k.x; outBuf[o+1]=k.y; outBuf[o+2]=(float)k.got; }
            else memset(&outBuf[o], 0, sizeof(float) * 3);
            o += 3;
        }
        return outBuf;
    }
}

// ===== OFFLINE PARADISE（game7）：②スカイ・キャッスル の物理・判定・スコア計算 =====
// ブロックの左右移動・重なり判定（ぴったり／ずれ／ミス）・落下アニメ・カメラ追従・スコア計算をC++に移植。
// 見た目（テーマ色・パーティクル・SE）はJS側がそのまま担当し、このC++コアが返す状態だけを読んで描く。
namespace castle {
    const int MAX_BLOCKS = 400;
    const float W = 360.0f, BH = 26.0f;

    struct Block { float x, w; };
    Block blocks[MAX_BLOCKS]; int blockCount;
    float curX, curW, curDir, curSp;
    float dead; // 0=生存
    float fallX, fallW, fallY, fallVy; int fallActive;
    float cam, camT;
    int combo; float score;
    int over;
    int evtPerfect, evtNormal, evtDead, evtMilestone; float evtX;
    unsigned int rngState;

    static float frand(){ rngState = rngState * 1664525u + 1013904223u; return (float)(rngState >> 8) / (float)(1u << 24); }
    static float rnd(float a, float b){ return a + frand() * (b - a); }

    EM_KEEP void castle_reset(unsigned int seed){
        rngState = seed ? seed : 1;
        blocks[0] = {80.0f, 200.0f}; blockCount = 1;
        curX = 0; curW = 200.0f; curDir = 1; curSp = 130.0f;
        dead = 0; fallX = fallW = fallY = fallVy = 0; fallActive = 0;
        cam = 0; camT = 0; combo = 0; score = 0; over = 0;
        evtPerfect = evtNormal = evtDead = evtMilestone = 0; evtX = 0;
    }
    EM_KEEP void castle_tap(){
        if(dead != 0) return;
        Block &top = blocks[blockCount - 1];
        float l = fmaxf(top.x, curX), r = fminf(top.x + top.w, curX + curW), ov = r - l;
        if(ov <= 0){
            dead = 0.9f; fallActive = 1; fallX = curX; fallW = curW; fallY = 0; fallVy = 0; evtDead = 1;
            return;
        }
        int perfect = fabsf(curX - top.x) < 6.0f;
        if(perfect){
            if(blockCount < MAX_BLOCKS){ blocks[blockCount] = {top.x, top.w}; blockCount++; }
            combo++; score += 15; evtPerfect = 1; evtX = top.x + top.w / 2.0f;
        } else {
            if(blockCount < MAX_BLOCKS){ blocks[blockCount] = {l, ov}; blockCount++; }
            combo = 0; score += 10; evtNormal = 1;
        }
        int n = blockCount - 1;
        if(n % 5 == 0) evtMilestone = 1;
        float nw = blocks[blockCount - 1].w;
        float newX = frand() < 0.5f ? -nw : W;
        curX = newX; curW = nw; curSp = 130.0f + n * 7.0f; curDir = newX < 0 ? 1.0f : -1.0f;
    }
    EM_KEEP void castle_step(float dt){
        if(dt > 0.05f) dt = 0.05f;
        if(dead == 0){
            curX += curDir * curSp * dt;
            if(curX + curW > W + 40.0f) curDir = -1;
            if(curX < -40.0f) curDir = 1;
        } else {
            dead -= dt;
            if(fallActive){ fallVy += 1400.0f * dt; fallY += fallVy * dt; }
            if(dead <= 0) over = 1;
        }
        int n = blockCount;
        camT = fmaxf(0.0f, (n - 9) * BH);
        cam += (camT - cam) * fminf(1.0f, dt * 4.0f);
        score = fmaxf(score, 0.0f);
    }
    EM_KEEP void castle_consume_events(){ evtPerfect = evtNormal = evtDead = evtMilestone = 0; }

    // [0]curX [1]curW [2]curDir [3]curSp [4]dead [5]fallX [6]fallW [7]fallY [8]fallActive
    // [9]cam [10]camT [11]combo [12]score [13]blockCount [14]over
    // [15]evtPerfect [16]evtNormal [17]evtDead [18]evtMilestone [19]evtX
    const int HEADER = 20;
    float outBuf[HEADER + MAX_BLOCKS * 2];
    EM_KEEP float* castle_get_buffer(){
        outBuf[0]=curX; outBuf[1]=curW; outBuf[2]=curDir; outBuf[3]=curSp; outBuf[4]=dead;
        outBuf[5]=fallX; outBuf[6]=fallW; outBuf[7]=fallY; outBuf[8]=(float)fallActive;
        outBuf[9]=cam; outBuf[10]=camT; outBuf[11]=(float)combo; outBuf[12]=score; outBuf[13]=(float)blockCount; outBuf[14]=(float)over;
        outBuf[15]=(float)evtPerfect; outBuf[16]=(float)evtNormal; outBuf[17]=(float)evtDead; outBuf[18]=(float)evtMilestone; outBuf[19]=evtX;
        int o = HEADER;
        for(int i = 0; i < blockCount; i++){ outBuf[o]=blocks[i].x; outBuf[o+1]=blocks[i].w; o += 2; }
        return outBuf;
    }
}

// ===== OFFLINE PARADISE（game7）：③100階層のポケットダンジョン の判定・ダンジョン生成・スコア計算 =====
// モンスターとの当たり判定（攻撃・撃破・被弾）・宝箱の抽選・階段での階層生成・スコア計算をC++に移植。
// マス目の描画・テキスト演出・SEはJS側が、このコアが返すダンジョン状態（モンスター・宝箱・勇者・階段の位置）を読んで描く。
namespace dungeon {
    const int COLS = 6, ROWS = 8, MAX_MON = 16, MAX_CHEST = 4, MAX_GEAR = 8;
    // GEARテーブル（JS側 games.js の GEAR 配列と同じ順番・同じ atk加算/hp加算/重みを持つ。アイコン名はJS側が持つ）
    const int GEAR_N = 9;
    const float GEAR_ATK[GEAR_N] = {1, 1, 0, 0, 2, 4, 1, 2, 5};
    const float GEAR_HP[GEAR_N]  = {0, 0, 2, 3, 0, 0, 4, 3, 3};
    const float GEAR_W[GEAR_N]   = {40, 25, 40, 30, 12, 5, 5, 5, 3};

    struct Mon { int c, r; float hp; int e; int active; };
    struct Pt { int c, r; int active; };
    Mon mon[MAX_MON]; Pt chest[MAX_CHEST];
    int monCount, chestCount;
    int heroC, heroR, stairsC, stairsR;
    int floor_, maxhp, hp, kills; float atk, score;
    float gearHist[MAX_GEAR]; int gearCount;
    int evtAttack, evtKilled, evtDamaged, evtChest, chestGearIdx, chestTier, evtFloor;
    unsigned int rngState;
    bool used[COLS][ROWS];

    static float frand(){ rngState = rngState * 1664525u + 1013904223u; return (float)(rngState >> 8) / (float)(1u << 24); }

    static void freeCell(int &oc, int &or_){
        int c, r;
        do{ c = (int)(frand() * COLS); if(c >= COLS) c = COLS - 1; r = (int)(frand() * ROWS); if(r >= ROWS) r = ROWS - 1; } while(used[c][r]);
        used[c][r] = true; oc = c; or_ = r;
    }
    static int rollGear(){
        float tot = 0; for(int i = 0; i < GEAR_N; i++) tot += GEAR_W[i];
        float r = frand() * tot;
        for(int i = 0; i < GEAR_N; i++){ r -= GEAR_W[i]; if(r <= 0) return i; }
        return 0;
    }
    static void gen(){
        monCount = 0; chestCount = 0;
        for(int c = 0; c < COLS; c++) for(int r = 0; r < ROWS; r++) used[c][r] = false;
        heroC = (int)(frand() * COLS); if(heroC >= COLS) heroC = COLS - 1; heroR = ROWS - 1;
        used[heroC][heroR] = true;
        do{
            freeCell(stairsC, stairsR);
            if(stairsR > 2){
                for(int c = 0; c < COLS; c++) for(int r = 0; r < ROWS; r++) used[c][r] = false;
                used[heroC][heroR] = true;
            }
        } while(stairsR > 2);
        used[stairsC][stairsR] = true;
        int mc = 3 + (floor_ / 8 < 4 ? floor_ / 8 : 4);
        float baseHp = 1 + floor_ / 14;
        for(int i = 0; i < mc && i < MAX_MON; i++){
            int c, r; freeCell(c, r);
            float h = baseHp + (frand() < 0.25f ? 1 : 0); if(h > 5) h = 5;
            int e = (int)(frand() * 5); if(e >= 5) e = 4;
            mon[monCount] = {c, r, h, e, 1}; monCount++;
        }
        for(int j = 0; j < 2 && j < MAX_CHEST; j++){ int c, r; freeCell(c, r); chest[chestCount] = {c, r, 1}; chestCount++; }
    }

    EM_KEEP void dungeon_reset(unsigned int seed){
        rngState = seed ? seed : 1;
        floor_ = 1; atk = 1; maxhp = 6; hp = 6; kills = 0; score = 0; gearCount = 0;
        for(int i = 0; i < MAX_GEAR; i++) gearHist[i] = -1;
        evtAttack = evtKilled = evtDamaged = evtChest = evtFloor = 0; chestGearIdx = -1; chestTier = 0;
        gen();
    }
    EM_KEEP void dungeon_consume_events(){ evtAttack = evtKilled = evtDamaged = evtChest = evtFloor = 0; }
    // dir: 0=left 1=right 2=up 3=down
    EM_KEEP void dungeon_swipe(int dir){
        int dc = dir == 0 ? -1 : dir == 1 ? 1 : 0;
        int dr = dir == 2 ? -1 : dir == 3 ? 1 : 0;
        int nc = heroC + dc, nr = heroR + dr;
        if(nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return;
        for(int i = 0; i < monCount; i++){
            if(!mon[i].active || mon[i].c != nc || mon[i].r != nr) continue;
            mon[i].hp -= atk; evtAttack = 1;
            if(mon[i].hp <= 0){
                mon[i].active = 0;
                for(int k = i; k < monCount - 1; k++) mon[k] = mon[k + 1];
                monCount--;
                score += 3; kills++; evtKilled = 1;
            } else {
                hp--;
                if(hp <= 0){ hp = maxhp; evtDamaged = 1; }
            }
            return;
        }
        heroC = nc; heroR = nr;
        for(int i = 0; i < chestCount; i++){
            if(!chest[i].active || chest[i].c != nc || chest[i].r != nr) continue;
            for(int k = i; k < chestCount - 1; k++) chest[k] = chest[k + 1];
            chestCount--;
            int gi = rollGear();
            atk += GEAR_ATK[gi]; if(atk > 10) atk = 10;
            maxhp += (int)GEAR_HP[gi];
            hp += (int)GEAR_HP[gi] + 1; if(hp > maxhp) hp = maxhp;
            if(gearCount < MAX_GEAR) gearHist[gearCount++] = (float)gi;
            else { for(int k = 0; k < MAX_GEAR - 1; k++) gearHist[k] = gearHist[k + 1]; gearHist[MAX_GEAR - 1] = (float)gi; }
            int tier = GEAR_W[gi] <= 5 ? 2 : GEAR_W[gi] <= 15 ? 1 : 0;
            score += 5 + (tier == 2 ? 20 : tier == 1 ? 8 : 0);
            evtChest = 1; chestGearIdx = gi; chestTier = tier;
            break;
        }
        if(nc == stairsC && nr == stairsR){
            floor_++; score += 10; evtFloor = 1;
            gen();
        }
    }
    // [0]floor [1]atk [2]maxhp [3]hp [4]kills [5]heroC [6]heroR [7]stairsC [8]stairsR
    // [9]monCount [10]chestCount [11]gearCount [12]score
    // [13]evtAttack [14]evtKilled [15]evtDamaged [16]evtChest [17]chestGearIdx [18]chestTier [19]evtFloor
    const int HEADER = 20;
    float outBuf[HEADER + MAX_MON * 4 + MAX_CHEST * 2 + MAX_GEAR];
    EM_KEEP float* dungeon_get_buffer(){
        outBuf[0]=(float)floor_; outBuf[1]=atk; outBuf[2]=(float)maxhp; outBuf[3]=(float)hp; outBuf[4]=(float)kills;
        outBuf[5]=(float)heroC; outBuf[6]=(float)heroR; outBuf[7]=(float)stairsC; outBuf[8]=(float)stairsR;
        outBuf[9]=(float)monCount; outBuf[10]=(float)chestCount; outBuf[11]=(float)gearCount; outBuf[12]=score;
        outBuf[13]=(float)evtAttack; outBuf[14]=(float)evtKilled; outBuf[15]=(float)evtDamaged; outBuf[16]=(float)evtChest;
        outBuf[17]=(float)chestGearIdx; outBuf[18]=(float)chestTier; outBuf[19]=(float)evtFloor;
        int o = HEADER;
        for(int i = 0; i < MAX_MON; i++){
            if(i < monCount){ outBuf[o]=(float)mon[i].c; outBuf[o+1]=(float)mon[i].r; outBuf[o+2]=mon[i].hp; outBuf[o+3]=(float)mon[i].e; }
            else memset(&outBuf[o], 0, sizeof(float) * 4);
            o += 4;
        }
        for(int i = 0; i < MAX_CHEST; i++){
            if(i < chestCount){ outBuf[o]=(float)chest[i].c; outBuf[o+1]=(float)chest[i].r; }
            else memset(&outBuf[o], 0, sizeof(float) * 2);
            o += 2;
        }
        for(int i = 0; i < MAX_GEAR; i++){ outBuf[o] = i < gearCount ? gearHist[i] : -1.0f; o++; }
        return outBuf;
    }
}

// ===== OFFLINE PARADISE（game7）：④電波ビート・ウェーブ の判定・コンボ・スコア計算 =====
// 長押しをはなしたタイミングの判定（PERFECT／GOOD／MISS）・コンボ・スコア計算をC++に移植。
// 波・サーファーの描画やSEはJS側が、このコアが返す各マークの状態（通過タイミング・判定）を読んで描く。
namespace beat {
    const int MAX_MARKS = 40;
    struct Mark { float t; int done; }; // done: 0=未 1=good 2=perfect -1=miss
    Mark marks[MAX_MARKS];
    int hold; float hs, trick, lt, aur, score; int combo, labelCode; // labelCode: 0=none 1=good 2=perfect 3=miss
    int evtDrop, evtHit; // evtHit: 0=none 1=good 2=perfect

    EM_KEEP void beat_reset(unsigned int seed){
        for(int i = 0; i < MAX_MARKS; i++){ marks[i].t = 1.6f + i * 1.05f; marks[i].done = 0; }
        hold = 0; hs = 0; trick = 0; lt = 0; aur = 0; score = 0; combo = 0; labelCode = 0;
        evtDrop = 0; evtHit = 0;
    }
    EM_KEEP void beat_down(float timeSec){ hold = 1; hs = timeSec; }
    EM_KEEP void beat_up(float timeSec){
        if(!hold) return;
        hold = 0;
        float hd = timeSec - hs;
        int best = -1; float bestD = 1e9f;
        for(int i = 0; i < MAX_MARKS; i++){
            if(marks[i].done != 0) continue;
            float d = fabsf(marks[i].t - timeSec);
            if(d < 0.2f && d < bestD){ bestD = d; best = i; }
        }
        if(best < 0 || hd < 0.1f){ evtDrop = 1; return; }
        float d = bestD;
        marks[best].done = d < 0.07f ? 2 : 1;
        combo++;
        score += (d < 0.07f ? 100.0f : 50.0f) * (1.0f + (combo / 5) * 0.5f);
        labelCode = d < 0.07f ? 2 : 1; evtHit = labelCode;
        lt = 0.6f; trick = 0.7f;
    }
    EM_KEEP void beat_step(float dt, float timeSec){
        if(dt > 0.05f) dt = 0.05f;
        for(int i = 0; i < MAX_MARKS; i++){
            if(marks[i].done == 0 && marks[i].t < timeSec - 0.2f){ marks[i].done = -1; combo = 0; labelCode = 3; lt = 0.5f; }
        }
        if(trick > 0) trick -= dt;
        if(lt > 0) lt -= dt;
        float target = combo / 14.0f; if(target > 1.0f) target = 1.0f;
        aur += (target - aur) * dt * 2.0f;
    }
    EM_KEEP void beat_consume_events(){ evtDrop = 0; evtHit = 0; }
    // [0]hold [1]hs [2]trick [3]lt [4]labelCode [5]combo [6]score [7]aur [8]marksCount [9]evtDrop [10]evtHit
    const int HEADER = 11;
    float outBuf[HEADER + MAX_MARKS * 2];
    EM_KEEP float* beat_get_buffer(){
        outBuf[0]=(float)hold; outBuf[1]=hs; outBuf[2]=trick; outBuf[3]=lt; outBuf[4]=(float)labelCode;
        outBuf[5]=(float)combo; outBuf[6]=score; outBuf[7]=aur; outBuf[8]=(float)MAX_MARKS; outBuf[9]=(float)evtDrop; outBuf[10]=(float)evtHit;
        int o = HEADER;
        for(int i = 0; i < MAX_MARKS; i++){ outBuf[o]=marks[i].t; outBuf[o+1]=(float)marks[i].done; o += 2; }
        return outBuf;
    }
}

// ===== OFFLINE PARADISE（game7）：⑤ゴールデン・フィーバー の物理・判定・スコア計算 =====
// 降ってくるコイン／宝石／王冠の落下・磁石への吸いこみ・キャッチ判定・スコア計算をC++に移植。
// キラキラや積み上がる山の描画・SEはJS側が、このコアが返すアイテム状態を読んで描く。
namespace fever {
    const int MAX_ITEMS = 100;
    const float W = 360.0f, H = 640.0f;
    struct Item { float x, y, vy; int type; int got; int active; }; // type: 0=コイン 1=宝石 2=王冠
    Item items[MAX_ITEMS];
    float bx, tx, acc, score; int n;
    unsigned int rngState;

    static float frand(){ rngState = rngState * 1664525u + 1013904223u; return (float)(rngState >> 8) / (float)(1u << 24); }
    static float rnd(float a, float b){ return a + frand() * (b - a); }
    static int freeSlot(){ for(int i = 0; i < MAX_ITEMS; i++) if(!items[i].active) return i; return -1; }

    EM_KEEP void fever_reset(unsigned int seed){
        rngState = seed ? seed : 1;
        bx = W / 2; tx = W / 2; acc = 0; score = 0; n = 0;
        for(int i = 0; i < MAX_ITEMS; i++) items[i] = {0, 0, 0, 0, 0, 0};
    }
    EM_KEEP void fever_set_target(float px){ tx = clampf(px, 40.0f, W - 40.0f); }
    EM_KEEP void fever_step(float dt, float timeSec){
        if(dt > 0.05f) dt = 0.05f;
        bx += (tx - bx) * fminf(1.0f, dt * 14.0f);
        float rate = 8.0f + timeSec * 0.3f;
        acc += dt * rate;
        while(acc > 1.0f){
            acc -= 1.0f;
            float r = frand();
            int slot = freeSlot();
            if(slot >= 0){
                int type = r < 0.04f ? 2 : (r < 0.28f ? 1 : 0);
                items[slot] = {rnd(16.0f, W - 16.0f), -20.0f, rnd(240.0f, 420.0f), type, 0, 1};
            }
        }
        for(int i = 0; i < MAX_ITEMS; i++){
            if(!items[i].active) continue;
            Item &it = items[i];
            it.y += it.vy * dt;
            float dx = bx - it.x;
            if(fabsf(dx) < 90.0f && it.y > 440.0f) it.x += dx * fminf(1.0f, dt * 5.0f);
            if(!it.got && it.y > 540.0f && it.y < 600.0f && fabsf(it.x - bx) < 48.0f){
                it.got = 1;
                float v = it.type == 2 ? 25.0f : it.type == 1 ? 5.0f : 1.0f;
                score += v; n++;
            }
            if(it.y >= H + 30.0f) it.active = 0;
        }
    }
    EM_KEEP void fever_consume_got(){ for(int i = 0; i < MAX_ITEMS; i++) if(items[i].active && items[i].got) items[i].active = 0; }
    // [0]bx [1]tx [2]acc [3]n(combo) [4]score [5]itemsCount(固定)
    const int HEADER = 6;
    float outBuf[HEADER + MAX_ITEMS * 4];
    EM_KEEP float* fever_get_buffer(){
        outBuf[0]=bx; outBuf[1]=tx; outBuf[2]=acc; outBuf[3]=(float)n; outBuf[4]=score; outBuf[5]=(float)MAX_ITEMS;
        int o = HEADER;
        for(int i = 0; i < MAX_ITEMS; i++){
            if(items[i].active){ outBuf[o]=items[i].x; outBuf[o+1]=items[i].y; outBuf[o+2]=(float)items[i].type; outBuf[o+3]=(float)items[i].got; }
            else memset(&outBuf[o], 0, sizeof(float) * 4);
            o += 4;
        }
        return outBuf;
    }
}

EM_KEEP int game7_ping(){ return 42; }
