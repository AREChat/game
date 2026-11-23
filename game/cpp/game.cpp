// ===== ARE QUEST（トップレベルの本編）の バトル核心ロジック（C++ → WebAssembly）=====
// ダメージ計算・会心判定・重みつき抽選（ランダムエンカウント／敵の行動選択）・
// 行動順(すばやさ)ならべ、という「判定・計算」だけを ここで行う。
// 乱数は JS 側（シード対応の rnd()）から 1つの数として渡してもらい、その数を使って
// ここで計算する（挙動＝見た目を 変えないため）。マップ・絵・UIは すべて JS が担当する。
// ビルド: sh build.sh （game/ の下で）
#include <cmath>
#include <cstring>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

static inline float clampf(float v, float lo, float hi){ return v < lo ? lo : (v > hi ? hi : v); }

// ---------------------------------------------------------------------------
// ダメージ計算（battle.js の bDmg() と同じ式）
// ---------------------------------------------------------------------------
namespace dmg {
    // 出力バッファ: [0]damage [1]crit(0/1)
    // rnd1: ダメージのゆらぎ用／rnd2: 会心(クリティカル)判定用。forceCrit はチート(かならず会心)の時だけ 1。
    float outBuf[2];
    EM_KEEP float* g_damage(float atk, float def, float mult, float rnd1, float rnd2, float critRate, int forceCrit){
        float d = (atk - def * 0.5f) * mult * (0.88f + rnd1 * 0.24f);
        if(d < 1.0f) d = 1.0f; d = roundf(d);
        int crit = forceCrit || (rnd2 < critRate);
        if(crit) d = roundf(d * 1.7f);
        outBuf[0] = d; outBuf[1] = (float)crit;
        return outBuf;
    }
}

// ---------------------------------------------------------------------------
// 重みつき抽選（ランダムエンカウントの出現率・敵の行動テーブルの確率 と 同じ考え方）
// weights[] の 合計に対して rnd01 を 当てはめ、どの枠に落ちたかを返す
// ---------------------------------------------------------------------------
namespace pick {
    const int MAX_W = 32;
    float w[MAX_W];
    EM_KEEP int g_weighted_pick(const float* weights, int n, float rnd01){
        if(n <= 0) return 0;
        if(n > MAX_W) n = MAX_W;
        float tot = 0; for(int i = 0; i < n; i++){ float v = weights[i]; if(v < 0) v = 0; tot += v; }
        if(tot <= 0) return 0;
        float r = rnd01 * tot;
        for(int i = 0; i < n; i++){
            float v = weights[i]; if(v < 0) v = 0;
            r -= v; if(r <= 0) return i;
        }
        return n - 1;
    }
}

// ---------------------------------------------------------------------------
// 行動順（すばやさ + 乱数のゆらぎ）を 大きい順に ならべる（battleRound() の acts.sort と同じ考え方）
// keys[i] は 呼び出し側が すでに (agi + rnd()*ゆらぎ + ボーナス) を計算して渡した値。
// ここでは その値を 大きい順に 安定ソートして、もとの添字を返すだけ。
// ---------------------------------------------------------------------------
namespace order {
    const int MAX_N = 16;
    int outIdx[MAX_N];
    EM_KEEP int* g_turn_order(const float* keys, int n){
        if(n > MAX_N) n = MAX_N;
        for(int i = 0; i < n; i++) outIdx[i] = i;
        // 安定な 挿入ソート（降順）：人数が少ないので十分速い
        for(int i = 1; i < n; i++){
            int cur = outIdx[i]; float curKey = keys[cur];
            int j = i - 1;
            while(j >= 0 && keys[outIdx[j]] < curKey){ outIdx[j + 1] = outIdx[j]; j--; }
            outIdx[j + 1] = cur;
        }
        return outIdx;
    }
}

EM_KEEP int game_ping(){ return 42; }
