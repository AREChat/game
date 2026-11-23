// ===== ARE QUEST 2 / 3 共通の 物理コア（C++ → WebAssembly）=====
// 当たり判定（フィールド移動の円×矩形・円×円）と、ターン制バトルの ダメージ計算だけを
// ここで行う。乱数は JS 側（シード対応の rnd()）から 1つの数として受け取り、
// その数を使って ここで計算する（挙動＝見た目を 変えないため）。
// 描画・マップ生成・UI は すべて JS（gl.js / world.js など）が担当する。
// ビルド: sh ../build.sh （game2/ の下で）
#include <cmath>
#include <cstring>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }

// ---------------------------------------------------------------------------
// フィールドの 当たり判定（world.js の hit()/move()/freeSpot() と同じ考え方）
// ---------------------------------------------------------------------------
namespace world {
    const int MAX_RECT = 256;
    const int MAX_CIRC = 512;
    float rx0[MAX_RECT], rz0[MAX_RECT], rx1[MAX_RECT], rz1[MAX_RECT]; int rectCount = 0;
    float cx[MAX_CIRC], cz[MAX_CIRC], cr[MAX_CIRC]; int circCount = 0;
    float boundX0 = -1000, boundZ0 = -1000, boundX1 = 1000, boundZ1 = 1000;

    EM_KEEP void q_world_reset(){ rectCount = 0; circCount = 0; boundX0 = -1000; boundZ0 = -1000; boundX1 = 1000; boundZ1 = 1000; }
    EM_KEEP void q_set_bounds(float x0, float z0, float x1, float z1){ boundX0 = x0; boundZ0 = z0; boundX1 = x1; boundZ1 = z1; }
    EM_KEEP int q_add_rect(float x0, float z0, float x1, float z1){
        if(rectCount >= MAX_RECT) return -1;
        rx0[rectCount] = x0; rz0[rectCount] = z0; rx1[rectCount] = x1; rz1[rectCount] = z1;
        return rectCount++;
    }
    EM_KEEP int q_add_circle(float x, float z, float r){
        if(circCount >= MAX_CIRC) return -1;
        cx[circCount] = x; cz[circCount] = z; cr[circCount] = r;
        return circCount++;
    }

    // 半径 r の 円が (x,z) に いるとき、何かに あたっているか
    static int hitTest(float x, float z, float r){
        if(x < boundX0 + r || x > boundX1 - r || z < boundZ0 + r || z > boundZ1 - r) return 1;
        for(int i = 0; i < rectCount; i++){
            if(x > rx0[i] - r && x < rx1[i] + r && z > rz0[i] - r && z < rz1[i] + r) return 1;
        }
        for(int i = 0; i < circCount; i++){
            float dx = x - cx[i], dz = z - cz[i], rr = cr[i] + r;
            if(dx * dx + dz * dz < rr * rr) return 1;
        }
        return 0;
    }
    EM_KEEP int q_hit(float x, float z, float r){ return hitTest(x, z, r); }

    // 出力バッファ: [0]nx [1]nz
    float moveBuf[2];
    EM_KEEP float* q_move(float x, float z, float dx, float dz, float r){
        float nx = x, nz = z;
        if(!hitTest(x + dx, z, r)) nx = x + dx;
        if(!hitTest(nx, z + dz, r)) nz = z + dz;
        moveBuf[0] = nx; moveBuf[1] = nz;
        return moveBuf;
    }
    // 迷子になった時に戻す、近くの空いている場所をさがす（world.js の freeSpot と同じ渦巻き探索）
    EM_KEEP float* q_free_spot(float x, float z){
        if(!hitTest(x, z, 0.4f)){ moveBuf[0] = x; moveBuf[1] = z; return moveBuf; }
        for(float rr = 0.8f; rr < 6.0f; rr += 0.6f){
            for(float a = 0.0f; a < 6.28f; a += 0.7f){
                float nx = x + cosf(a) * rr, nz = z + sinf(a) * rr;
                if(!hitTest(nx, nz, 0.4f)){ moveBuf[0] = nx; moveBuf[1] = nz; return moveBuf; }
            }
        }
        moveBuf[0] = x; moveBuf[1] = z; return moveBuf;
    }
}

// ---------------------------------------------------------------------------
// バトルの ダメージ計算（rules.js の damage() と 同じ式）
// 乱数は JS から 1つ（rnd01）渡す。クリティカルの判定用の乱数は 別に rnd2 として渡す。
// ---------------------------------------------------------------------------
namespace battle {
    // 出力バッファ: [0]damage [1]crit(0/1)
    float outBuf[2];
    EM_KEEP float* q_damage(float atk, float def, float rnd01, float rnd2, float critRate, int guard, int forceCrit){
        float d = atk * (0.85f + rnd01 * 0.3f) - def * 0.5f;
        if(d < 1.0f) d = 1.0f; d = floorf(d);
        int crit = forceCrit || (rnd2 < critRate);
        if(crit){ float cd = floorf(atk * 1.6f + 1.0f); if(cd > d) d = cd; }
        if(guard){ d = floorf(d / 2.0f); if(d < 1.0f) d = 1.0f; }
        outBuf[0] = d; outBuf[1] = (float)crit;
        return outBuf;
    }
}

EM_KEEP int quest_ping(){ return 42; }
