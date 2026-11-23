// ===== ARE BLOCKS（落ち物パズル） 判定・AIロジック（C++ → WebAssembly）=====
// 描画・入力・BGM・画面切り替えは index.html 内のJSのまま。
// 「あたり判定（衝突）・ラインぜんぶ うまっているか・おじゃまブロックの追加・
//  じゃま役AIの「どこに置くと良いか」の評価」という、純粋な計算だけを ここで行う。
#include <cstring>
#include <cstdlib>
#include <cmath>

#define EM_KEEP extern "C" __attribute__((used, visibility("default")))

namespace blk {
    const int COLS = 10, ROWS = 22;
    const int MAXM = 4; // ミノの行列サイズ（4x4まで）

    // ---------- 衝突判定・マージ・ライン消し（けす役／じゃま役 共通で使う）----------
    // grid: ROWS*COLS の int 配列（0=空、1..8=色）。m: MAXM*MAXM の 0/1（はみ出し分も含め矩形で渡す）。
    EM_KEEP int blk_collide(int* grid, int* m, int msize, int px, int py){
        for(int y = 0; y < msize; y++) for(int x = 0; x < msize; x++){
            if(!m[y * msize + x]) continue;
            int gx = px + x, gy = py + y;
            if(gx < 0 || gx >= COLS || gy >= ROWS) return 1;
            if(gy >= 0 && grid[gy * COLS + gx]) return 1;
        }
        return 0;
    }
    EM_KEEP void blk_merge(int* grid, int* m, int msize, int px, int py, int type){
        for(int y = 0; y < msize; y++) for(int x = 0; x < msize; x++){
            if(!m[y * msize + x]) continue;
            int gy = py + y; if(gy < 0) continue;
            int gx = px + x; if(gx < 0 || gx >= COLS || gy >= ROWS) continue;
            grid[gy * COLS + gx] = type;
        }
    }
    // そろったラインを消して つめる。戻り値は 消えたライン数。
    EM_KEEP int blk_clear_lines(int* grid){
        int n = 0;
        for(int y = ROWS - 1; y >= 0; y--){
            bool full = true;
            for(int x = 0; x < COLS; x++) if(!grid[y * COLS + x]){ full = false; break; }
            if(!full) continue;
            for(int yy = y; yy > 0; yy--) memcpy(&grid[yy * COLS], &grid[(yy - 1) * COLS], sizeof(int) * COLS);
            memset(&grid[0], 0, sizeof(int) * COLS);
            n++; y++; // 詰めた分、同じ行をもう一度見る
        }
        return n;
    }
    // おじゃまブロックを n段 積む（1列だけ穴を開ける）。holeColsは呼び出し側のrand列（JSのMath.random列と独立でもゲーム性は変わらない）。
    // 戻り値：いちばん上の行まで埋まって あふれたら 1。
    EM_KEEP int blk_add_garbage(int* grid, int n, int* holeCols){
        int over = 0;
        for(int i = 0; i < n; i++){
            for(int x = 0; x < COLS; x++) if(grid[x]) over = 1; // 最上段(0行目)が埋まっていたら あふれ
            memmove(&grid[0], &grid[COLS], sizeof(int) * COLS * (ROWS - 1));
            int hole = holeCols ? (holeCols[i] % COLS) : (rand() % COLS);
            for(int x = 0; x < COLS; x++) grid[(ROWS - 1) * COLS + x] = (x == hole) ? 0 : 8;
        }
        return over;
    }

    // ---------- じゃま役AI：どこに置くと良いかを評価（evalGrid） ----------
    // 高さが低く・ホール（埋もれた空白）が少なく・ラインが消えやすく・でこぼこが少ないほど 良い置き方。
    EM_KEEP float blk_eval_grid(int* grid, int lines){
        int heights[COLS], holes = 0; int agg = 0, bump = 0;
        for(int x = 0; x < COLS; x++){
            int h = 0; bool seen = false;
            for(int y = 0; y < ROWS; y++){
                if(grid[y * COLS + x]){ if(!seen){ seen = true; h = ROWS - y; } }
                else if(seen) holes++;
            }
            heights[x] = h; agg += h;
        }
        for(int i = 0; i < COLS - 1; i++) bump += abs(heights[i] - heights[i + 1]);
        return -0.5f * agg + 0.76f * lines - 0.8f * holes - 0.18f * bump;
    }

    // 1つの置き方（回転r・横位置x）を仮に置いてみて評価する。呼び出し側(JS)が shape差し替えのため
    // mはすでに回転済みのものを渡す。戻り値：置けなければ -1e18、置けたら評価値。
    // tmpGrid はワーク用に呼び出し側が渡す（grid破壊防止のため。サイズ ROWS*COLS）。
    EM_KEEP float blk_try_placement(int* grid, int* m, int msize, int px, int type, int* tmpGrid){
        if(blk_collide(grid, m, msize, px, 0)) return -1e18f;
        int y = 0; while(!blk_collide(grid, m, msize, px, y + 1)) y++;
        memcpy(tmpGrid, grid, sizeof(int) * ROWS * COLS);
        blk_merge(tmpGrid, m, msize, px, y, type);
        int lines = 0;
        for(int yy = 0; yy < ROWS; yy++){
            bool full = true;
            for(int x = 0; x < COLS; x++) if(!tmpGrid[yy * COLS + x]){ full = false; break; }
            if(full) lines++;
        }
        return blk_eval_grid(tmpGrid, lines);
    }
    // 置いた場合の 落下後のY座標（ゴースト表示・実際の着地に使う）
    EM_KEEP int blk_drop_y(int* grid, int* m, int msize, int px, int py){
        int y = py;
        while(!blk_collide(grid, m, msize, px, y + 1)) y++;
        return y;
    }

    EM_KEEP void blk_seed(unsigned int s){ srand(s); }
    EM_KEEP int blk_rand_int(int n){ return n > 0 ? rand() % n : 0; }
}

EM_KEEP int blk_ping(){ return 47; }
