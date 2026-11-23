// ===== ドリーム・フロンティア：プレイヤーの移動・当たり判定（C++ → WebAssembly）=====
// もともと js/df-game.js の Game.move(dx, dz) にあった、えんの障害物（solids）との
// めり込み解消・みずうみ（湖）の侵入防止・ワールド境界クランプを C++ に移植したもの。
// 描画・のりもの・謎解き・セーブなど、それ以外のゲームロジックは js/df-game.js がそのまま担当する。
// ビルド: emcc cpp/dream-frontier.cpp -O3 -s WASM=1 ... -o js/dreamfrontier.wasm.js
#include <cmath>
#include <cstring>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

namespace df {
    const int MAX_SOLID = 64;
    struct Solid { float x, z, r; };
    Solid solids[MAX_SOLID]; int solidCount = 0;
    const float PR = 0.38f; // プレイヤーの当たり半径（df-game.jsのrと同じ）
    // ワールド境界（df-world.js buildWorld() の bounds と同じ値）
    float bx0 = -115.0f, bx1 = 115.0f, bz0 = -118.0f, bz1 = 108.0f;

    EM_KEEP void df_reset_solids(){ solidCount = 0; }
    EM_KEEP int df_add_solid(float x, float z, float r){
        if(solidCount >= MAX_SOLID) return -1;
        solids[solidCount] = {x, z, r};
        return solidCount++;
    }
    EM_KEEP void df_set_bounds(float x0, float x1, float z0, float z1){ bx0 = x0; bx1 = x1; bz0 = z0; bz1 = z1; }

    static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }

    float outBuf[2];
    // 戻り値: [0]=新しいx [1]=新しいz
    EM_KEEP float* df_move(float px, float pz, float dx, float dz){
        float x = px + dx, z = pz + dz;
        for(int k = 0; k < 2; k++){
            for(int i = 0; i < solidCount; i++){
                Solid &s = solids[i];
                float ex = x - s.x, ez = z - s.z, d = sqrtf(ex * ex + ez * ez), m = s.r + PR;
                if(d < m && d > 0.0001f){ x = s.x + ex / d * m; z = s.z + ez / d * m; }
            }
        }
        // みずうみ（中央の池）：入りこめないようにする。もとの位置が池の外ならそこへ押しかえす
        if(x > -28.0f && x < 36.0f && z > 62.5f && z < 96.0f){
            if(px > -28.0f && px < 36.0f && pz <= 62.5f) z = 62.5f;
            else if(pz >= 96.0f) z = 96.0f;
            else { x = px; z = pz; }
        }
        x = clampf(x, bx0, bx1); z = clampf(z, bz0, bz1);
        outBuf[0] = x; outBuf[1] = z;
        return outBuf;
    }
}

EM_KEEP int dreamfrontier_ping(){ return 42; }
