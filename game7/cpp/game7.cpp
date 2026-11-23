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

EM_KEEP int game7_ping(){ return 42; }
