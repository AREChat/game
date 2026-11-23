// ===== 推理ゲーム2：パズル自動生成（C++ → WebAssembly）=====
// もともと js/gen.js にあった「表パズルの自動生成（制約伝播で必ず1つに決まることを確かめる）」を
// そのまま C++ に移植したもの。出力は js/gen.js のフォールバック実装と同じ形（人数n・項目数m・
// 解S・手がかりclues）に JS 側で組み立てなおせるよう、フラットな float 配列で渡す。
// ビルド: emcc cpp/game6.cpp -O3 -s WASM=1 ... -o js/game6.wasm.js
#include <cmath>
#include <cstring>
#include <cstdlib>
#include <cstdint>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

namespace g6 {

// ---- 擬似乱数（mulberry32。決定的な乱数。JSのgen.jsとは別実装だが、同じ品質のPRNG）----
struct Mulberry {
    uint32_t a;
    explicit Mulberry(uint32_t seed) : a(seed) {}
    float next(){
        a = a + 0x6D2B79F5u;
        uint32_t t = a;
        t = (t ^ (t >> 15)) * (1u | t);
        t = t + ((t ^ (t >> 7)) * (61u | t));
        t ^= t >> 14;
        return (float)((double)t / 4294967296.0);
    }
};

static void shuffleInts(Mulberry &r, int *arr, int n){
    for(int i = n - 1; i > 0; i--){
        int j = (int)(r.next() * (i + 1));
        if(j > i) j = i;
        int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
}

static inline int popcount(uint32_t x){ int c = 0; while(x){ c++; x &= x - 1; } return c; }
static inline int lowbit(uint32_t x){ int i = 0; while(!(x & 1)){ x >>= 1; i++; } return i; }
static inline int highbit(uint32_t x){ int i = -1; while(x){ x >>= 1; i++; } return i; }

const int MAXN = 10, MAXM = 3;

// 手がかりの種類
enum ClueType { T_EQ = 0, T_MULTI = 1, T_NEQ = 2, T_EITHER = 3, T_LINK = 4, T_NOTLINK = 5, T_BEFORE = 6, T_ADJ = 7, T_GAP = 8 };

struct Clue {
    int t = -1;
    int k = 0, p = 0, v = 0, w = 0;
    int k1 = 0, a = 0, k2 = 0, b = 0;
    int q = 0, d = 0;
    int ksCount = 0;
    int ks[3] = {0, 0, 0};
    int vs[3] = {0, 0, 0};
};

static bool clueEq(const Clue &x, const Clue &y){
    if(x.t != y.t) return false;
    switch(x.t){
        case T_EQ: case T_NEQ: return x.k == y.k && x.p == y.p && x.v == y.v;
        case T_MULTI: { if(x.p != y.p || x.ksCount != y.ksCount) return false; for(int i = 0; i < x.ksCount; i++) if(x.ks[i] != y.ks[i] || x.vs[i] != y.vs[i]) return false; return true; }
        case T_EITHER: return x.k == y.k && x.p == y.p && x.v == y.v && x.w == y.w;
        case T_LINK: case T_NOTLINK: return x.k1 == y.k1 && x.a == y.a && x.k2 == y.k2 && x.b == y.b;
        case T_BEFORE: case T_ADJ: return x.p == y.p && x.q == y.q;
        case T_GAP: return x.p == y.p && x.q == y.q && x.d == y.d;
    }
    return false;
}

const int MAX_CLUES = 256;

struct Solver {
    int n = 0, m = 0;
    uint32_t D[MAXM][MAXN];     // ドメイン（ビット集合）
    int S[MAXM][MAXN];          // 正解
    uint32_t full = 0;

    void newDom(uint32_t Dm[MAXM][MAXN]){ for(int k = 0; k < m; k++) for(int p = 0; p < n; p++) Dm[k][p] = full; }
    void copyDom(const uint32_t src[MAXM][MAXN], uint32_t dst[MAXM][MAXN]){ for(int k = 0; k < m; k++) for(int p = 0; p < n; p++) dst[k][p] = src[k][p]; }
    int total(const uint32_t Dm[MAXM][MAXN]){ int s = 0; for(int k = 0; k < m; k++) for(int p = 0; p < n; p++) s += popcount(Dm[k][p]); return s; }
    bool solved(const uint32_t Dm[MAXM][MAXN]){ for(int k = 0; k < m; k++) for(int p = 0; p < n; p++) if(popcount(Dm[k][p]) != 1) return false; return true; }

    // 戻り値: 0=変化なし, 1=変化あり, -1=矛盾（bad）
    int apply(uint32_t Dm[MAXM][MAXN], const Clue &c){
        bool ch = false;
        auto setd = [&](int kk, int pp, uint32_t nm){ if(nm != Dm[kk][pp]){ Dm[kk][pp] = nm; ch = true; } };
        switch(c.t){
            case T_EQ: setd(c.k, c.p, Dm[c.k][c.p] & (1u << c.v)); break;
            case T_MULTI: for(int i = 0; i < c.ksCount; i++) setd(c.ks[i], c.p, Dm[c.ks[i]][c.p] & (1u << c.vs[i])); break;
            case T_NEQ: setd(c.k, c.p, Dm[c.k][c.p] & ~(1u << c.v)); break;
            case T_EITHER: setd(c.k, c.p, Dm[c.k][c.p] & ((1u << c.v) | (1u << c.w))); break;
            case T_LINK:
                for(int p = 0; p < n; p++){
                    if(!(Dm[c.k1][p] & (1u << c.a))) setd(c.k2, p, Dm[c.k2][p] & ~(1u << c.b));
                    if(!(Dm[c.k2][p] & (1u << c.b))) setd(c.k1, p, Dm[c.k1][p] & ~(1u << c.a));
                }
                break;
            case T_NOTLINK:
                for(int p = 0; p < n; p++){
                    if(Dm[c.k1][p] == (1u << c.a)) setd(c.k2, p, Dm[c.k2][p] & ~(1u << c.b));
                    if(Dm[c.k2][p] == (1u << c.b)) setd(c.k1, p, Dm[c.k1][p] & ~(1u << c.a));
                }
                break;
            case T_BEFORE: {
                int p = c.p, q = c.q;
                setd(0, p, Dm[0][p] & ((1u << highbit(Dm[0][q])) - 1u));
                setd(0, q, Dm[0][q] & ~((1u << (lowbit(Dm[0][p]) + 1)) - 1u));
                break;
            }
            case T_ADJ: {
                int p = c.p, q = c.q; uint32_t np = 0, nq = 0;
                for(int v = 0; v < n; v++){
                    if(Dm[0][p] & (1u << v)){ if((v > 0 && (Dm[0][q] & (1u << (v - 1)))) || (v < n - 1 && (Dm[0][q] & (1u << (v + 1))))) np |= 1u << v; }
                    if(Dm[0][q] & (1u << v)){ if((v > 0 && (Dm[0][p] & (1u << (v - 1)))) || (v < n - 1 && (Dm[0][p] & (1u << (v + 1))))) nq |= 1u << v; }
                }
                setd(0, p, np); setd(0, q, nq);
                break;
            }
            case T_GAP: {
                int p = c.p, q = c.q, d = c.d; uint32_t gp = 0, gq = 0;
                for(int v = 0; v < n; v++){
                    if((Dm[0][p] & (1u << v)) && v - d >= 0 && (Dm[0][q] & (1u << (v - d)))) gp |= 1u << v;
                    if((Dm[0][q] & (1u << v)) && v + d < n && (Dm[0][p] & (1u << (v + d)))) gq |= 1u << v;
                }
                setd(0, p, gp); setd(0, q, gq);
                break;
            }
        }
        for(int k = 0; k < m; k++) for(int p = 0; p < n; p++) if(!Dm[k][p]) return -1;
        return ch ? 1 : 0;
    }

    int alldiff(uint32_t Dm[MAXM][MAXN]){
        bool ch = false;
        for(int k = 0; k < m; k++){
            for(int p = 0; p < n; p++) if(popcount(Dm[k][p]) == 1){
                for(int q = 0; q < n; q++) if(q != p && (Dm[k][q] & Dm[k][p])){ Dm[k][q] &= ~Dm[k][p]; ch = true; }
            }
            for(int v = 0; v < n; v++){
                int cnt = 0, who = -1;
                for(int p = 0; p < n; p++) if(Dm[k][p] & (1u << v)){ cnt++; who = p; }
                if(cnt == 0) return -1;
                if(cnt == 1 && Dm[k][who] != (1u << v)){ Dm[k][who] = 1u << v; ch = true; }
            }
        }
        for(int k = 0; k < m; k++) for(int p = 0; p < n; p++) if(!Dm[k][p]) return -1;
        return ch ? 1 : 0;
    }

    bool propagate(uint32_t Dm[MAXM][MAXN], Clue *clues, int clueCount){
        for(int guard = 0; guard < 300; guard++){
            bool ch = false;
            for(int i = 0; i < clueCount; i++){ int r = apply(Dm, clues[i]); if(r < 0) return false; if(r > 0) ch = true; }
            int a = alldiff(Dm); if(a < 0) return false; if(a > 0) ch = true;
            if(!ch) break;
        }
        return true;
    }

    bool solves(Clue *clues, int clueCount){
        uint32_t Dm[MAXM][MAXN]; newDom(Dm);
        return propagate(Dm, clues, clueCount) && solved(Dm);
    }

    Clue randClue(Mulberry &r, const float *w, const char **wkeys, int wkeyCount, float wsum){
        int p = (int)(r.next() * n);
        float x = r.next() * wsum, acc = 0; int t = -1;
        for(int i = 0; i < wkeyCount; i++){ acc += w[i]; if(x <= acc){ t = i; break; } }
        if(t < 0) t = wkeyCount - 1;
        Clue c; c.t = t;
        switch(t){
            case T_EQ: { int k = (int)(r.next() * m); c.k = k; c.p = p; c.v = S[k][p]; return c; }
            case T_MULTI: {
                int ks[3] = {0, 1, 2}; int cnt = m;
                if(m == 3 && r.next() < 0.5f){
                    int rem = (int)(r.next() * 3);
                    for(int i = rem; i < 2; i++) ks[i] = ks[i + 1];
                    cnt = 2;
                }
                c.p = p; c.ksCount = cnt;
                for(int i = 0; i < cnt; i++){ c.ks[i] = ks[i]; c.vs[i] = S[ks[i]][p]; }
                return c;
            }
            case T_NEQ: { int k = (int)(r.next() * m); int v; do{ v = (int)(r.next() * n); }while(v == S[k][p]); c.k = k; c.p = p; c.v = v; return c; }
            case T_EITHER: { int k = (int)(r.next() * m); int v; do{ v = (int)(r.next() * n); }while(v == S[k][p]); int sv = S[k][p]; c.k = k; c.p = p; c.v = v < sv ? v : sv; c.w = v < sv ? sv : v; return c; }
            case T_LINK: { int k1 = (int)(r.next() * m), k2; do{ k2 = (int)(r.next() * m); }while(k2 == k1); c.k1 = k1; c.a = S[k1][p]; c.k2 = k2; c.b = S[k2][p]; return c; }
            case T_NOTLINK: { int h1 = (int)(r.next() * m), h2; do{ h2 = (int)(r.next() * m); }while(h2 == h1); int pp; do{ pp = (int)(r.next() * n); }while(pp == p); c.k1 = h1; c.a = S[h1][p]; c.k2 = h2; c.b = S[h2][pp]; return c; }
            case T_BEFORE: { int q; do{ q = (int)(r.next() * n); }while(q == p); if(S[0][p] < S[0][q]){ c.p = p; c.q = q; } else { c.p = q; c.q = p; } return c; }
            case T_ADJ: {
                for(int g = 0; g < 30; g++){ int q = (int)(r.next() * n); if(q != p && std::abs(S[0][p] - S[0][q]) == 1){ c.p = p; c.q = q; return c; } }
                c.t = T_LINK; c.k1 = 0; c.a = S[0][p]; c.k2 = 1; c.b = S[1][p]; return c;
            }
            case T_GAP: {
                for(int g = 0; g < 30; g++){ int q = (int)(r.next() * n); int d = S[0][p] - S[0][q]; if(q != p && d >= 2 && d <= 3){ c.p = p; c.q = q; c.d = d; return c; } }
                c.t = T_NEQ; c.k = 0; c.p = p; c.v = (S[0][p] + 1) % n; return c;
            }
        }
        c.t = T_LINK; c.k1 = 0; c.a = S[0][p]; c.k2 = 1; c.b = S[1][p]; return c;
    }
};

static void weightsFor(int level, float *w /*len9*/){
    static const float T0[9] = {3, 4, 5, 4, 5, 1, 2, 1, 0};
    static const float T1[9] = {2, 3, 5, 4, 5, 2, 3, 2, 1};
    static const float T2[9] = {1, 2, 4, 4, 4, 3, 4, 3, 2};
    static const float T3[9] = {0.3f, 1, 3, 4, 3, 4, 5, 4, 3};
    static const float T4[9] = {0, 0.5f, 2, 4, 2, 5, 6, 5, 4};
    const float *src = level <= 0 ? T0 : level == 1 ? T1 : level == 2 ? T2 : level == 3 ? T3 : T4;
    for(int i = 0; i < 9; i++) w[i] = src[i];
}

Solver SV;
int outN = 0, outM = 0, outLevel = 0, outClueCount = 0, outOk = 0;
Clue outClues[MAX_CLUES];

// 出力バッファ: [0]n [1]m [2]level [3]clueCount [4]ok
// そのあと S(m*n個, 人pごとの値) → clue(clueCount個 × 18個)
const int HEADER = 5;
const int CLUE_W = 18;
float gBuf[HEADER + MAXM * MAXN + MAX_CLUES * CLUE_W];

EM_KEEP float* g6_make_puzzle(int n, int level, int seed, int m){
    if(n < 2) n = 2; if(n > MAXN) n = MAXN;
    if(m < 2) m = 2; if(m > MAXM) m = MAXM;
    SV.n = n; SV.m = m; SV.full = (1u << n) - 1u;
    Mulberry r((uint32_t)seed);
    int ids[MAXN]; for(int i = 0; i < n; i++) ids[i] = i;
    for(int q0 = 0; q0 < m; q0++){
        int tmp[MAXN]; for(int i = 0; i < n; i++) tmp[i] = ids[i];
        shuffleInts(r, tmp, n);
        for(int i = 0; i < n; i++) SV.S[q0][i] = tmp[i];
    }
    float w[9]; weightsFor(level, w);
    float wsum = 0; for(int i = 0; i < 9; i++) wsum += w[i];

    Clue clues[MAX_CLUES]; int clueCount = 0;
    Clue seen[MAX_CLUES]; int seenCount = 0;
    auto wasSeen = [&](const Clue &c){ for(int i = 0; i < seenCount; i++) if(clueEq(seen[i], c)) return true; return false; };

    uint32_t Dm[MAXM][MAXN]; SV.newDom(Dm);
    int guard = 0;
    while(!SV.solved(Dm) && guard++ < 2500){
        Clue cand[14]; float candGain[14]; int candCount = 0;
        Clue best; float bestGain = -1; bool hasBest = false;
        for(int i = 0; i < 14; i++){
            Clue c = SV.randClue(r, w, nullptr, 9, wsum);
            if(wasSeen(c)) continue;
            Clue tryClues[MAX_CLUES]; for(int k = 0; k < clueCount; k++) tryClues[k] = clues[k]; tryClues[clueCount] = c;
            uint32_t D2[MAXM][MAXN]; SV.copyDom(Dm, D2);
            if(!SV.propagate(D2, tryClues, clueCount + 1)) continue;
            float gain = (float)(SV.total(Dm) - SV.total(D2));
            if(gain <= 0) continue;
            if(candCount < 14){ cand[candCount] = c; candGain[candCount] = gain; candCount++; }
            if(gain > bestGain){ bestGain = gain; best = c; hasBest = true; }
        }
        bool havePick = false; Clue pick;
        if(candCount > 0){
            if(level >= 3){ int idx = (int)(r.next() * candCount); if(idx >= candCount) idx = candCount - 1; pick = cand[idx]; havePick = true; }
            else if(level == 2){ if(r.next() < 0.5f){ pick = best; havePick = hasBest; } else { int idx = (int)(r.next() * candCount); if(idx >= candCount) idx = candCount - 1; pick = cand[idx]; havePick = true; } }
            else { pick = best; havePick = hasBest; }
        }
        if(!havePick){
            if(guard > 300){
                bool found = false;
                for(int p = 0; p < n && !found; p++) for(int k = 0; k < m && !found; k++) if(popcount(Dm[k][p]) > 1){
                    Clue c3; c3.t = T_EQ; c3.k = k; c3.p = p; c3.v = SV.S[k][p];
                    if(!wasSeen(c3)){ pick = c3; havePick = true; found = true; }
                }
            }
            if(!havePick) continue;
        }
        if(seenCount < MAX_CLUES) seen[seenCount++] = pick;
        if(clueCount < MAX_CLUES) clues[clueCount++] = pick;
        SV.newDom(Dm); SV.propagate(Dm, clues, clueCount);
    }

    static const float STRIP[5] = {0, 0.15f, 0.6f, 1, 1};
    float strip = STRIP[level >= 0 && level <= 4 ? level : 2];
    if(strip > 0){
        int order[MAX_CLUES]; for(int i = 0; i < clueCount; i++) order[i] = i;
        shuffleInts(r, order, clueCount);
        Clue keep[MAX_CLUES]; int keepCount = clueCount; for(int i = 0; i < clueCount; i++) keep[i] = clues[i];
        for(int oi = 0; oi < clueCount; oi++){
            if(r.next() > strip) continue;
            int idx = order[oi];
            // keep配列中で clues[idx] と同じ位置を探す（同値の最初の1つを外す）
            int pos = -1; for(int i = 0; i < keepCount; i++) if(clueEq(keep[i], clues[idx])){ pos = i; break; }
            if(pos < 0) continue;
            Clue tmp[MAX_CLUES]; int tc = 0;
            for(int i = 0; i < keepCount; i++) if(i != pos) tmp[tc++] = keep[i];
            if(SV.solves(tmp, tc)){ for(int i = 0; i < tc; i++) keep[i] = tmp[i]; keepCount = tc; }
        }
        clueCount = keepCount; for(int i = 0; i < clueCount; i++) clues[i] = keep[i];
    } else {
        int add = n * 7 / 10; if(add < 2) add = 2;
        for(int e = 0; e < add * 6 && add > 0 && clueCount < MAX_CLUES; e++){
            Clue c2 = SV.randClue(r, w, nullptr, 9, wsum);
            if(wasSeen(c2)) continue;
            if(seenCount < MAX_CLUES) seen[seenCount++] = c2;
            clues[clueCount++] = c2; add--;
        }
    }
    // 最終シャッフル
    int order2[MAX_CLUES]; for(int i = 0; i < clueCount; i++) order2[i] = i;
    shuffleInts(r, order2, clueCount);
    Clue finalClues[MAX_CLUES]; for(int i = 0; i < clueCount; i++) finalClues[i] = clues[order2[i]];

    outN = n; outM = m; outLevel = level; outClueCount = clueCount;
    outOk = SV.solves(finalClues, clueCount) ? 1 : 0;
    for(int i = 0; i < clueCount; i++) outClues[i] = finalClues[i];

    gBuf[0] = (float)outN; gBuf[1] = (float)outM; gBuf[2] = (float)outLevel; gBuf[3] = (float)outClueCount; gBuf[4] = (float)outOk;
    int o = HEADER;
    for(int k = 0; k < MAXM; k++) for(int p = 0; p < MAXN; p++){ gBuf[o++] = (k < m && p < n) ? (float)SV.S[k][p] : 0.0f; }
    for(int i = 0; i < MAX_CLUES; i++){
        if(i < clueCount){
            Clue &c = outClues[i];
            gBuf[o + 0] = (float)c.t; gBuf[o + 1] = (float)c.k; gBuf[o + 2] = (float)c.p; gBuf[o + 3] = (float)c.v; gBuf[o + 4] = (float)c.w;
            gBuf[o + 5] = (float)c.k1; gBuf[o + 6] = (float)c.a; gBuf[o + 7] = (float)c.k2; gBuf[o + 8] = (float)c.b;
            gBuf[o + 9] = (float)c.q; gBuf[o + 10] = (float)c.d; gBuf[o + 11] = (float)c.ksCount;
            gBuf[o + 12] = (float)c.ks[0]; gBuf[o + 13] = (float)c.ks[1]; gBuf[o + 14] = (float)c.ks[2];
            gBuf[o + 15] = (float)c.vs[0]; gBuf[o + 16] = (float)c.vs[1]; gBuf[o + 17] = (float)c.vs[2];
        } else memset(&gBuf[o], 0, sizeof(float) * CLUE_W);
        o += CLUE_W;
    }
    return gBuf;
}

} // namespace g6

EM_KEEP int game6_ping(){ return 42; }
