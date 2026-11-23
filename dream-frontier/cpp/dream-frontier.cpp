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

// ===== コースターの物理シミュレーション（js/df-coaster.js の simBoomerang / simScripted の移植）=====
//  ・simBoomerang : レール沿いの高さ(重力・摩擦・発進/ブレーキ・停止ブレーキ)で「行き→てっぺん→逆走」を積分計算
//  ・simScripted  : 地点ごとの目標スピードへ加減速しながら進む（飛行・シューティング用）
//  どちらも「乗車開始時に一度だけ」計算してテーブル(s,uの時系列)を作る処理で、毎フレームの処理ではない。
//  レールの形（path.at(s)の高さ）はJS側で密にサンプリングした配列として渡す（df_cst_set_path）。
namespace cst {
    const int MAX_PATH_Y = 10000;     // 高さサンプルの最大数
    const int MAX_SAMPLES = 20000;    // 出力(s,u)系列の最大フレーム数
    const int MAX_ZONES = 8;          // fwd/revゾーンの最大数

    float pathY[MAX_PATH_Y]; int pathN = 0; float pathStep = 1.0f, pathTotal = 0.0f;

    EM_KEEP void df_cst_set_path(float* ys, int n, float step, float total){
        if(n > MAX_PATH_Y) n = MAX_PATH_Y;
        for(int i = 0; i < n; i++) pathY[i] = ys[i];
        pathN = n; pathStep = step > 0.0001f ? step : 1.0f; pathTotal = total;
    }
    static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }
    static inline float hAt(float s){
        if(pathN < 2) return 0.0f;
        s = clampf(s, 0.0f, pathTotal - 0.01f);
        float k = s / pathStep; if(k < 0.0f) k = 0.0f; float kmax = (float)(pathN - 1) - 0.0001f; if(k > kmax) k = kmax;
        int i = (int)k; float f = k - i; if(i + 1 >= pathN) return pathY[pathN - 1];
        return pathY[i] + (pathY[i + 1] - pathY[i]) * f;
    }
    static inline float slope(float s){ return (hAt(s + 1.5f) - hAt(s - 1.5f)) / 3.0f; }

    struct Zone { float s0, s1, v, a; int type; }; // type: 0=const 1=launch/assist 2=brake

    // 出力バッファ: [0]n [1]dt [2]dispatch [3]launch [4]top [5]rev [6]stop [7]end [8]dur [9]peakV
    //              そのあと s[n], u[n] が続く
    const int OUT_HEAD = 10;
    float outBuf[OUT_HEAD + 2 * MAX_SAMPLES];

    static int runDir(float d, Zone* zones, int zc, float stopS, int hasStop, float stopB, float vCrawl,
                       float cd, float cr, float* sOut, int* nOut, int cap, float* sRef, float* uRef, float* tRef){
        const float DT = 1.0f / 240.0f, REC = 1.0f / 60.0f, G = 9.8f;
        float s = *sRef, u = *uRef, t = *tRef, acc = 0.0f;
        int n = *nOut, guard = 0, ph = 0; float phT = 0.0f;
        for(;;){
            if(++guard > 240 * 200) { *sRef = s; *uRef = u; *tRef = t; *nOut = n; return 2; } // timeout
            float aG = -G * slope(s);
            float sgn = (u != 0.0f) ? (u > 0.0f ? 1.0f : -1.0f) : (d > 0.0f ? 1.0f : -1.0f);
            float a = aG - sgn * (cd * u * u + cr);
            float v0 = d * u;
            float v = v0 + d * a * DT;
            for(int zi = 0; zi < zc; zi++){
                Zone &z = zones[zi];
                if(s >= z.s0 && s <= z.s1){
                    if(z.type == 0) v = z.v;
                    else if(z.type == 1){ if(v < z.v) v = v + z.a * DT < z.v ? v + z.a * DT : z.v; }
                    else if(z.type == 2){ if(v > z.v) v = v - z.a * DT > z.v ? v - z.a * DT : z.v; }
                }
            }
            if(hasStop){
                float dist = d > 0.0f ? stopS - s : s - stopS;
                float distc = dist > 0.0f ? dist : 0.0f;
                float distc4 = distc / 4.0f; if(distc4 < 0.0f) distc4 = 0.0f; if(distc4 > 1.0f) distc4 = 1.0f;
                float vmax = sqrtf(2.0f * stopB * distc) + vCrawl * distc4;
                if(v > vmax) v = vmax;
                if(dist <= 0.02f){ u = 0.0f; s = stopS; *sRef = s; *uRef = u; *tRef = t; *nOut = n; return 0; } // stopped
            }
            if(v < -0.2f) v = 0.0f; // allowBack は実データで使われないため未対応
            phT += DT; ph = 1;
            if(v <= 0.05f && phT > 3.0f && s > 30.0f && !(hasStop && fabsf(stopS - s) < 6.0f)){ u = 0.0f; *sRef = s; *uRef = u; *tRef = t; *nOut = n; return 3; } // stall
            u = d * v; s += u * DT; acc += DT; t += DT;
            if(acc >= REC){ acc -= REC; if(n < cap){ sOut[n] = s; sOut[cap + n] = u; n++; } }
            if(d > 0.0f && s >= pathTotal - 0.3f){ s = pathTotal - 0.3f; u = 0.0f; *sRef = s; *uRef = u; *tRef = t; *nOut = n; return 1; } // end
            if(d < 0.0f && s <= 0.0f){ s = 0.0f; u = 0.0f; *sRef = s; *uRef = u; *tRef = t; *nOut = n; return 1; } // start
        }
    }

    // zonesFlat: 5 floats/zone = [s0, s1, type, v, a]
    EM_KEEP float* df_sim_boomerang(float s0, float hold0, float cd, float cr, float stopB, float vCrawl,
                                     float topS, int hasTop, float stopS, int hasStop, float topHold, float endHold,
                                     float* fwdFlat, int fwdN, float* revFlat, int revN){
        if(fwdN > MAX_ZONES) fwdN = MAX_ZONES; if(revN > MAX_ZONES) revN = MAX_ZONES;
        Zone fwd[MAX_ZONES], rev[MAX_ZONES];
        for(int i = 0; i < fwdN; i++){ fwd[i] = {fwdFlat[i * 5 + 0], fwdFlat[i * 5 + 1], fwdFlat[i * 5 + 3], fwdFlat[i * 5 + 4]}; fwd[i].type = (int)fwdFlat[i * 5 + 2]; }
        for(int i = 0; i < revN; i++){ rev[i] = {revFlat[i * 5 + 0], revFlat[i * 5 + 1], revFlat[i * 5 + 3], revFlat[i * 5 + 4]}; rev[i].type = (int)revFlat[i * 5 + 2]; }
        const float REC = 1.0f / 60.0f;
        float s = s0, u = 0.0f, t = 0.0f; int n = 0;
        float *sOut = outBuf + OUT_HEAD;
        float dispatchT, launchT, topT, revT, stopT, endT;
        int holdN = (int)(hold0 / REC + 0.5f); for(int i = 0; i < holdN && n < MAX_SAMPLES; i++){ sOut[n] = s; sOut[MAX_SAMPLES + n] = u; n++; t += REC; }
        dispatchT = t; launchT = t;
        runDir(1.0f, fwd, fwdN, topS, hasTop, stopB, vCrawl, cd, cr, sOut, &n, MAX_SAMPLES, &s, &u, &t);
        topT = t;
        int topHoldN = (int)(topHold / REC + 0.5f); for(int i = 0; i < topHoldN && n < MAX_SAMPLES; i++){ sOut[n] = s; sOut[MAX_SAMPLES + n] = u; n++; t += REC; }
        revT = t;
        runDir(-1.0f, rev, revN, stopS, hasStop, stopB, vCrawl, cd, cr, sOut, &n, MAX_SAMPLES, &s, &u, &t);
        stopT = t;
        int endHoldN = (int)(endHold / REC + 0.5f); for(int i = 0; i < endHoldN && n < MAX_SAMPLES; i++){ sOut[n] = s; sOut[MAX_SAMPLES + n] = u; n++; t += REC; }
        endT = t;
        // sOut[cap+i] に積んだ u を n個ぶん 連続配置へ詰め直す（cap=MAX_SAMPLES基準で積んでいたため）
        for(int i = 0; i < n; i++) outBuf[OUT_HEAD + MAX_SAMPLES + i] = sOut[MAX_SAMPLES + i];
        float peak = 0.0f; for(int i = 0; i < n; i++){ float av = fabsf(outBuf[OUT_HEAD + MAX_SAMPLES + i]); if(av > peak) peak = av; }
        outBuf[0] = (float)n; outBuf[1] = REC; outBuf[2] = dispatchT; outBuf[3] = launchT; outBuf[4] = topT; outBuf[5] = revT; outBuf[6] = stopT; outBuf[7] = endT; outBuf[8] = endT; outBuf[9] = peak;
        return outBuf;
    }

    // keysFlat: 2 floats/key = [s, v]
    EM_KEEP float* df_sim_scripted(float* keysFlat, int keyN, float s0, float hold0, float endHold, float amax, float dmax, float total){
        if(keyN > 64) keyN = 64;
        const float DT = 1.0f / 240.0f, REC = 1.0f / 60.0f;
        float s = s0, acc = 0.0f, vc = 0.3f; int n = 0; float t = 0.0f;
        float *sOut = outBuf + OUT_HEAD;
        int holdN = (int)(hold0 / REC + 0.5f); for(int i = 0; i < holdN && n < MAX_SAMPLES; i++){ sOut[n] = s; sOut[MAX_SAMPLES + n] = 0.0f; n++; t += REC; }
        float dispatchT = t, launchT = t;
        int guard = 0;
        while(s < total - 0.3f && ++guard < 240 * 400 && n < MAX_SAMPLES){
            float want;
            if(keyN < 1) want = 0.3f;
            else if(s <= keysFlat[0]) want = keysFlat[1];
            else {
                want = keysFlat[(keyN - 1) * 2 + 1];
                for(int i = 1; i < keyN; i++){
                    if(s <= keysFlat[i * 2]){
                        float k = (s - keysFlat[(i - 1) * 2]) / ((keysFlat[i * 2] - keysFlat[(i - 1) * 2]) != 0.0f ? (keysFlat[i * 2] - keysFlat[(i - 1) * 2]) : 1.0f);
                        float ku = clampf(k, 0.0f, 1.0f); float sm = ku * ku * (3.0f - 2.0f * ku);
                        float a0 = keysFlat[(i - 1) * 2 + 1], b0 = keysFlat[i * 2 + 1];
                        want = a0 + (b0 - a0) * sm; break;
                    }
                }
            }
            if(want < 0.3f) want = 0.3f;
            float dv = want - vc; float maxUp = amax * DT, maxDn = -dmax * DT;
            if(dv > maxUp) dv = maxUp; if(dv < maxDn) dv = maxDn;
            vc += dv; float v = vc; s += v * DT; acc += DT;
            if(acc >= REC){ acc -= REC; sOut[n] = s; sOut[MAX_SAMPLES + n] = v; n++; t += REC; }
        }
        float stopT = t;
        int endHoldN = (int)(endHold / REC + 0.5f); for(int i = 0; i < endHoldN && n < MAX_SAMPLES; i++){ sOut[n] = s; sOut[MAX_SAMPLES + n] = 0.0f; n++; t += REC; }
        float endT = t;
        for(int i = 0; i < n; i++) outBuf[OUT_HEAD + MAX_SAMPLES + i] = sOut[MAX_SAMPLES + i];
        float peak = 0.0f; for(int i = 0; i < n; i++){ float av = fabsf(outBuf[OUT_HEAD + MAX_SAMPLES + i]); if(av > peak) peak = av; }
        outBuf[0] = (float)n; outBuf[1] = REC; outBuf[2] = dispatchT; outBuf[3] = launchT; outBuf[4] = -1.0f; outBuf[5] = -1.0f; outBuf[6] = stopT; outBuf[7] = endT; outBuf[8] = endT; outBuf[9] = peak;
        return outBuf;
    }
}

// ===== ライド中のシューティング判定（レイ・ヒットテスト）の移植 =====
//  ・df_shoot_pick   : 「スターライト・シューティング」（js/df-game.js の shoot アトラクション）の的あて
//  ・df_blaster_pick : 「キラキラ・スイーツ・ブラスター」（js/df-ride.js の coasterUpdate 内 shoot 判定）の的あて
namespace shoot {
    const int MAX_T1 = 8;           // スターライト・シューティング：同時に出る的（実際は最大5）
    float t1Buf[MAX_T1 * 4];        // [x,y,z,hitFlag] × MAX_T1

    EM_KEEP float* df_shoot_buf(){ return t1Buf; }
    // 一番近くでレイに当たっている的の index を返す（当たりが無ければ -1）
    EM_KEEP int df_shoot_pick(int n, float ex, float ey, float ez, float dx, float dy, float dz){
        if(n > MAX_T1) n = MAX_T1;
        int best = -1; float bt = 1e9f;
        for(int i = 0; i < n; i++){
            float x = t1Buf[i * 4 + 0], y = t1Buf[i * 4 + 1], z = t1Buf[i * 4 + 2], hit = t1Buf[i * 4 + 3];
            if(hit != 0.0f) continue;
            float wx = x - ex, wy = y - ey, wz = z - ez;
            float tt = wx * dx + wy * dy + wz * dz;
            if(tt < 0.0f) continue;
            float px = wx - dx * tt, py = wy - dy * tt, pz = wz - dz * tt;
            float d = sqrtf(px * px + py * py + pz * pz);
            if(d < 1.0f && tt < bt){ bt = tt; best = i; }
        }
        return best;
    }

    const int MAX_T2 = 256;         // キラキラ・スイーツ・ブラスター：レール沿いの的の総数
    // [x, y, z, nx, nz, amp, f, ph, s, r, hitFlag] × MAX_T2
    float t2Buf[MAX_T2 * 11];

    EM_KEEP float* df_blaster_buf(){ return t2Buf; }
    EM_KEEP int df_blaster_pick(int n, float T, float curS, float ex, float ey, float ez, float dx, float dy, float dz){
        if(n > MAX_T2) n = MAX_T2;
        int best = -1; float bt = 1e9f;
        for(int i = 0; i < n; i++){
            float *tg = &t2Buf[i * 11];
            float s = tg[8], r = tg[9], hit = tg[10];
            if(hit != 0.0f) continue;
            if(s < curS - 6.0f || s > curS + 140.0f) continue;
            float ox = tg[0], oy = tg[1], oz = tg[2], nx = tg[3], nz = tg[4], amp = tg[5], f = tg[6], ph = tg[7];
            float px, py, pz;
            if(amp != 0.0f){
                float o = sinf(T * f * 2.0f + ph) * amp;
                px = ox + nx * o; py = oy + sinf(T * 1.3f + ph) * 0.35f; pz = oz + nz * o;
            } else { px = ox; py = oy; pz = oz; }
            float wx = px - ex, wy = py - ey, wz = pz - ez;
            float tt = wx * dx + wy * dy + wz * dz;
            if(tt < 2.0f || tt > 150.0f) continue;
            float qx = wx - dx * tt, qy = wy - dy * tt, qz = wz - dz * tt;
            float d = sqrtf(qx * qx + qy * qy + qz * qz);
            if(d < r + 0.5f && tt < bt){ bt = tt; best = i; }
        }
        return best;
    }
}

EM_KEEP int dreamfrontier_ping(){ return 42; }
