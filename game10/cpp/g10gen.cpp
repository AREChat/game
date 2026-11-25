// ===== ループ・ラボ：ステージ自動生成＋最少ぶんしん数ソルバー（C++ → WebAssembly）=====
// ・g10_gen(seed, level, out, cap)  … 「きょうのステージ」「ランダムステージ」を つくる。かならず クリアできて、お手本(par)つき。
// ・g10_par(map, steps)             … ステージ（文字の地図）の さいしょうの ぶんしん数。levels.js の 10ステージの 検算にも つかう。
// ルールは game10/js/sim.js（ブラウザの本物）と おなじ。ヒントの探し方（ぶんしんは「いちばん早く ボタンへ行って そこで とまる」）も
// js/game.js の hint() と 同じ順番で 数えるので、JS と C++ の答えが 一致する（tools/g10-cpp-parity.js で たしかめている）。
// 整数だけで 計算するので、どの端末でも 同じ seed から 同じステージが できる（きょうのステージを みんなが 同じにするため）。
// ビルド：sh game10/build.sh（clang++ と wasm-ld。Emscripten は いらない）。ネイティブのテスト用：g++ -DG10_NATIVE
#include <stdint.h>

#ifdef G10_NATIVE
#define G10_EXPORT extern "C"
#else
#define G10_EXPORT extern "C" __attribute__((used, visibility("default")))
#endif

#ifndef G10_NATIVE
// 標準ライブラリを つかわないので、コンパイラが 呼ぶ memcpy / memset を ここで 用意する（-fno-builtin で ふたたび 自分を 呼ばないようにしてある）
extern "C" {
__attribute__((used)) void *memcpy(void *d, const void *s, unsigned long n){ unsigned char *a = (unsigned char *)d; const unsigned char *b = (const unsigned char *)s; while(n--) *a++ = *b++; return d; }
__attribute__((used)) void *memmove(void *d, const void *s, unsigned long n){ unsigned char *a = (unsigned char *)d; const unsigned char *b = (const unsigned char *)s; if(a < b){ while(n--) *a++ = *b++; } else { a += n; b += n; while(n--) *--a = *--b; } return d; }
__attribute__((used)) void *memset(void *d, int v, unsigned long n){ unsigned char *a = (unsigned char *)d; while(n--) *a++ = (unsigned char)v; return d; }
}
#endif

namespace {

const int MAXW = 24, MAXH = 12, MAXT = 100, MAXP = 10, MAXG = 8;
const int CELLS = MAXW * MAXH;

struct Level {
    int W, H, steps;
    char c[CELLS];       // y*W+x
    int sx, sy, ex, ey;
    int np;              // ボタンの数
    int px[MAXP], py[MAXP], pl[MAXP]; // 場所と 文字(0..3)。ならびは js の hint() と 同じ（文字の はじめに 出てきた順 → 左上から）
    int need[4];         // 文字ごとの ボタンの数（0 ならトビラは ひらかない）
};

struct Path { int len; uint16_t p[MAXT + 2]; };

struct Node { int16_t x, y, t; int from; int8_t dir; };
const int MAXN = (MAXT + 1) * CELLS;
Node g_q[MAXN];
uint8_t g_seen[MAXN];
// 時刻 t ごとに、ぶんしんが ふんでいない ボタンの数（文字ごと）と、足りない ボタンの場所
int8_t g_missing[MAXT + 1][4];
int16_t g_missCell[MAXT + 1][4];

const int DX[4] = {0, 0, -1, 1};   // U D L R
const int DY[4] = {-1, 1, 0, 0};

uint32_t g_rng;
uint32_t rnd32(){ g_rng += 0x6D2B79F5u; uint32_t t = g_rng; t = (t ^ (t >> 15)) * (1u | t); t = t + ((t ^ (t >> 7)) * (61u | t)); return t ^ (t >> 14); }
int rnd(int n){ return n <= 1 ? 0 : (int)(rnd32() % (uint32_t)n); }

inline char cellAt(const Level &L, int x, int y){ return (x < 0 || y < 0 || x >= L.W || y >= L.H) ? '#' : L.c[y * L.W + x]; }

// ---- 地図から、S・E・ボタンの 一覧を つくる（ボタンの ならびは js の hint() と おなじ：文字の はじめに 出てきた順 → 左上から）----
bool scan(Level &L){
    int W = L.W, H = L.H;
    L.sx = L.sy = L.ex = L.ey = -1; L.np = 0;
    for(int i = 0; i < 4; i++) L.need[i] = 0;
    int order[4], no = 0;
    for(int yy = 0; yy < H; yy++) for(int xx = 0; xx < W; xx++){
        char c = L.c[yy * W + xx];
        if(c == 'S'){ if(L.sx >= 0) return false; L.sx = xx; L.sy = yy; }
        if(c == 'E'){ if(L.ex >= 0) return false; L.ex = xx; L.ey = yy; }
        if(c >= 'a' && c <= 'd'){ int k = c - 'a', seen = 0; for(int j = 0; j < no; j++) if(order[j] == k) seen = 1; if(!seen) order[no++] = k; L.need[k]++; }
    }
    if(L.sx < 0 || L.ex < 0) return false;
    for(int j = 0; j < no; j++) for(int yy = 0; yy < H; yy++) for(int xx = 0; xx < W; xx++){
        if(L.c[yy * W + xx] == 'a' + order[j]){ if(L.np >= MAXP) return false; L.px[L.np] = xx; L.py[L.np] = yy; L.pl[L.np] = order[j]; L.np++; }
    }
    return true;
}

// ---- 地図の よみこみ（"行\n行\n…"）。かたちが おかしければ false ----
bool parse(const char *s, int steps, Level &L){
    int W = 0, H = 0, x = 0;
    for(int i = 0; s[i]; i++){
        if(s[i] == '\r') continue;
        if(s[i] == '\n'){ if(x == 0) continue; if(W == 0) W = x; else if(x != W) return false; x = 0; H++; if(H > MAXH) return false; continue; }
        x++; if(x > MAXW) return false;
    }
    if(x != 0){ if(W == 0) W = x; else if(x != W) return false; H++; }
    if(W < 3 || H < 3 || H > MAXH) return false;
    L.W = W; L.H = H; L.steps = steps;
    int y = 0; x = 0;
    for(int i = 0; s[i]; i++){
        if(s[i] == '\r') continue;
        if(s[i] == '\n'){ if(x == 0) continue; x = 0; y++; continue; }
        if(y >= H) return false;
        L.c[y * W + x] = s[i]; x++;
    }
    return scan(L);
}

// ---- 時刻 t のとき、ぶんしんが ふんでいない ボタン ----
void buildMissing(const Level &L, const Path *gh, int ng, int maxT){
    for(int t = 0; t <= maxT; t++){
        for(int k = 0; k < 4; k++){ g_missing[t][k] = 0; g_missCell[t][k] = -1; }
        for(int p = 0; p < L.np; p++){
            int cell = L.py[p] * L.W + L.px[p], on = 0;
            for(int g = 0; g < ng; g++){ int i = t < gh[g].len ? t : gh[g].len - 1; if(gh[g].p[i] == cell){ on = 1; break; } }
            if(!on){ g_missing[t][L.pl[p]]++; g_missCell[t][L.pl[p]] = (int16_t)cell; }
        }
    }
}
inline bool doorOpen(const Level &L, int letter, int t, int meCell){
    if(L.need[letter] == 0) return false;
    int m = g_missing[t][letter];
    if(m == 0) return true;
    return m == 1 && g_missCell[t][letter] == meCell;
}

// ---- 時間つき 幅ゆうせん探索（js/sim.js の plan() と おなじ順番）。goal(x,y)へ 最短の道。見つかれば out に 位置の ならび ----
bool plan(const Level &L, const Path *gh, int ng, int gx, int gy, int maxSteps, Path *out){
    if(maxSteps > MAXT) maxSteps = MAXT;
    buildMissing(L, gh, ng, maxSteps);
    int W = L.W, H = L.H, total = (maxSteps + 1) * W * H;
    for(int i = 0; i < total; i++) g_seen[i] = 0;
    int qn = 0;
    g_q[qn].x = (int16_t)L.sx; g_q[qn].y = (int16_t)L.sy; g_q[qn].t = 0; g_q[qn].from = -1; g_q[qn].dir = -1; qn++;
    g_seen[(0 * H + L.sy) * W + L.sx] = 1;
    for(int i = 0; i < qn; i++){
        Node n = g_q[i];
        if(n.x == gx && n.y == gy){
            int len = 0, k = i; while(g_q[k].from >= 0){ len++; k = g_q[k].from; }
            out->len = len + 1; k = i;
            for(int j = len; j >= 0; j--){ out->p[j] = (uint16_t)(g_q[k].y * W + g_q[k].x); k = g_q[k].from; }
            return true;
        }
        if(n.t >= maxSteps) continue;
        int me = n.y * W + n.x;
        for(int d = 0; d < 5; d++){   // U D L R まつ
            int x = n.x, y = n.y;
            if(d < 4){
                x += DX[d]; y += DY[d];
                char c = cellAt(L, x, y);
                if(c == '#') continue;
                if(c >= 'A' && c <= 'D' && !doorOpen(L, c - 'A', n.t, me)) continue;
            }
            int kk = ((n.t + 1) * H + y) * W + x;
            if(g_seen[kk]) continue;
            g_seen[kk] = 1;
            if(qn >= MAXN) return false;
            g_q[qn].x = (int16_t)x; g_q[qn].y = (int16_t)y; g_q[qn].t = (int16_t)(n.t + 1); g_q[qn].from = i; g_q[qn].dir = (int8_t)d; qn++;
        }
    }
    return false;
}

// ---- さいしょうの ぶんしん数（ふかさ ゆうせん。n人 → n+1人…）----
struct Solver {
    const Level *L; int steps; int limit; long budget; bool over;
    Path gh[MAXG + 1]; bool used[MAXP]; Path tmp[MAXG + 1];
    bool dfs(int depth){
        if(over) return false;
        if(--budget < 0){ over = true; return false; }
        Path fin;
        if(plan(*L, gh, depth, L->ex, L->ey, steps, &fin)) return true;
        if(depth >= limit) return false;
        for(int p = 0; p < L->np; p++){
            if(used[p]) continue;
            Path path;
            if(!plan(*L, gh, depth, L->px[p], L->py[p], steps, &path)) continue;
            gh[depth] = path; used[p] = true;
            bool ok = dfs(depth + 1);
            used[p] = false;
            if(ok) return true;
            if(over) return false;
        }
        return false;
    }
};
Solver g_solver;

// 戻り値：最少の人数。解けなければ -1。budget をこえたら -2
int minGhosts(const Level &L, int steps, int maxGhosts, long budget){
    if(maxGhosts > MAXG) maxGhosts = MAXG;
    g_solver.L = &L; g_solver.steps = steps; g_solver.over = false;
    for(int n = 0; n <= maxGhosts && n <= L.np; n++){
        g_solver.limit = n; g_solver.budget = budget;
        for(int i = 0; i < MAXP; i++) g_solver.used[i] = false;
        if(g_solver.dfs(0)) return n;
        if(g_solver.over) return -2;
    }
    return -1;
}

// ---- ステージの つくりかた ----
bool connected(const Level &L){   // とびら を ひらいた つもりで、ゆか が ぜんぶ つながっているか
    static int16_t q[CELLS]; static uint8_t seen[CELLS];
    int W = L.W, H = L.H, total = W * H, qn = 0, floor = 0;
    for(int i = 0; i < total; i++){ seen[i] = 0; if(L.c[i] != '#') floor++; }
    q[qn++] = (int16_t)(L.sy * W + L.sx); seen[L.sy * W + L.sx] = 1;
    for(int i = 0; i < qn; i++){
        int x = q[i] % W, y = q[i] / W;
        for(int d = 0; d < 4; d++){
            int nx = x + DX[d], ny = y + DY[d]; if(nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            int k = ny * W + nx; if(seen[k] || L.c[k] == '#') continue; seen[k] = 1; q[qn++] = (int16_t)k;
        }
    }
    return qn == floor;
}

// level: 1=かんたん 2=ふつう 3=むずかしい。ひとつの 試し。できなければ false
bool layout(Level &L, int level){
    int segs = level == 1 ? 2 : level == 2 ? 3 : 4;
    // よこはばは 18マスまで（スマホの たて向きでも ボタンが 小さくなりすぎない ように）
    int segW[4], W = 2 + (segs - 1);
    for(int i = 0; i < segs; i++){
        int w = 3 + rnd(level == 3 ? 2 : 3);
        if(W + w + 3 * (segs - 1 - i) > 18) w = 3;
        segW[i] = w; W += w;
    }
    int H = (level == 3 ? 6 : 5) + rnd(level == 1 ? 2 : 3);
    if(W > MAXW || H > MAXH) return false;
    L.W = W; L.H = H; L.np = 0; L.sx = L.sy = L.ex = L.ey = -1;
    for(int i = 0; i < 4; i++) L.need[i] = 0;
    for(int i = 0; i < W * H; i++) L.c[i] = '#';
    int segX0[4], wallX[4], doorY[4], x = 1;
    for(int i = 0; i < segs; i++){
        segX0[i] = x;
        for(int xx = x; xx < x + segW[i]; xx++) for(int y = 1; y < H - 1; y++) L.c[y * W + xx] = '.';
        x += segW[i];
        if(i < segs - 1){ wallX[i] = x; doorY[i] = 1 + rnd(H - 2); L.c[doorY[i] * W + x] = (char)('A' + i); x++; }
    }
    // かべ（じゃま）。トビラの まえ・うしろの ますは あけておく
    int walls = (W * H) / 9 + rnd(3);
    for(int k = 0; k < walls; k++){
        int xx = 1 + rnd(W - 2), yy = 1 + rnd(H - 2);
        if(L.c[yy * W + xx] != '.') continue;
        bool keep = false;
        for(int i = 0; i < segs - 1; i++) if(yy == doorY[i] && (xx == wallX[i] - 1 || xx == wallX[i] + 1)) keep = true;
        if(!keep) L.c[yy * W + xx] = '#';
    }
    // スタート と 出口
    for(int tries = 0; tries < 40 && L.sx < 0; tries++){ int xx = segX0[0] + rnd(segW[0]), yy = 1 + rnd(H - 2); if(L.c[yy * W + xx] == '.'){ L.sx = xx; L.sy = yy; } }
    for(int tries = 0; tries < 40 && L.ex < 0; tries++){ int xx = segX0[segs - 1] + rnd(segW[segs - 1]), yy = 1 + rnd(H - 2); if(L.c[yy * W + xx] == '.'){ L.ex = xx; L.ey = yy; } }
    if(L.sx < 0 || L.ex < 0) return false;
    L.c[L.sy * W + L.sx] = 'S'; L.c[L.ey * W + L.ex] = 'E';
    // ボタン：トビラ i の ボタンは、トビラ i より 手前の 部屋（0〜i）のどこかに おく
    int pcount = 0;
    for(int i = 0; i < segs - 1; i++){
        int n = 1 + rnd(2);
        for(int k = 0; k < n; k++){
            bool placed = false;
            for(int tries = 0; tries < 60 && !placed; tries++){
                int seg = rnd(2) ? i : rnd(i + 1);
                int xx = segX0[seg] + rnd(segW[seg]), yy = 1 + rnd(H - 2);
                if(L.c[yy * W + xx] != '.') continue;
                L.c[yy * W + xx] = (char)('a' + i); placed = true; pcount++;
            }
            if(!placed) return false;
        }
    }
    if(pcount > MAXP) return false;
    return scan(L) && connected(L);
}

// 地図を 文字にする：「steps\npar\n行\n行…」
int emit(const Level &L, int par, char *out, int cap){
    int n = 0;
    auto put = [&](char c){ if(n < cap - 1) out[n] = c; n++; };
    auto num = [&](int v){ char b[12]; int k = 0; if(v == 0) b[k++] = '0'; while(v > 0){ b[k++] = (char)('0' + v % 10); v /= 10; } while(k) put(b[--k]); };
    num(L.steps); put('\n'); num(par); put('\n');
    for(int y = 0; y < L.H; y++){ for(int x = 0; x < L.W; x++) put(L.c[y * L.W + x]); put('\n'); }
    if(n >= cap) return 0;
    out[n] = 0; return n;
}

char g_in[2048], g_out[2048];
Level g_level;

} // namespace

G10_EXPORT int g10_ping(){ return 1010; }
G10_EXPORT char *g10_inbuf(){ return g_in; }
G10_EXPORT char *g10_outbuf(){ return g_out; }
G10_EXPORT int g10_incap(){ return (int)sizeof(g_in); }
G10_EXPORT int g10_outcap(){ return (int)sizeof(g_out); }

// g_in の 地図（行\n行…）の さいしょうの ぶんしん数。解けない -1／かたちが おかしい -3／探しきれない -2
G10_EXPORT int g10_par(int steps){
    g_in[sizeof(g_in) - 1] = 0;
    if(steps < 1 || steps > MAXT + 1) return -3;
    if(!parse(g_in, steps, g_level)) return -3;
    return minGhosts(g_level, steps - 1, MAXG, 4000000L);
}

// level 1〜3。つくれたら g_out に「steps\npar\n行…」を かいて 文字数を 返す。つくれなければ 0
G10_EXPORT int g10_gen(uint32_t seed, int level){
    if(level < 1) level = 1; if(level > 3) level = 3;
    g_rng = seed * 2654435761u + (uint32_t)level * 97u + 12345u;
    for(int i = 0; i < 5; i++) rnd32();
    int lo = level == 1 ? 1 : level == 2 ? 2 : 3, hi = level == 1 ? 2 : level == 2 ? 3 : 5;
    for(int attempt = 0; attempt < 400; attempt++){
        if(!layout(g_level, level)) continue;
        int steps = g_level.W * 2 + g_level.H + 6 + rnd(4);
        if(steps > MAXT) steps = MAXT;
        g_level.steps = steps;
        int par = minGhosts(g_level, steps - 1, hi, 400000L);
        if(par < lo || par > hi) continue;
        return emit(g_level, par, g_out, (int)sizeof(g_out));
    }
    return 0;
}
