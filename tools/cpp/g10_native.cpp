// ネイティブ版の 試験用ごはん：  g++ -O2 -DG10_NATIVE -o /tmp/g10main tools/cpp/g10_native.cpp
//   g10main dump LEVEL START N   … START から N 個の seed の ステージを 出す（\x01 で くぎる）。tools/g10-cpp-parity.js が WebAssembly 版と くらべる
//   g10main time LEVEL START N   … つくる時間を はかる（さいだいの 1回も 出す）
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "../../game10/cpp/g10gen.cpp"
int main(int argc, char **argv){
    if(argc < 5){ fprintf(stderr, "usage: g10main dump|time LEVEL START N\n"); return 2; }
    int level = atoi(argv[2]); unsigned s0 = (unsigned)strtoul(argv[3], 0, 10), n = (unsigned)atoi(argv[4]);
    if(!strcmp(argv[1], "dump")){
        for(unsigned s = s0; s < s0 + n; s++){ int r = g10_gen(s, level); if(r) fputs(g10_outbuf(), stdout); putchar(1); }
        return 0;
    }
    double worst = 0, total = 0; int fails = 0;
    for(unsigned s = s0; s < s0 + n; s++){
        struct timespec a, b; clock_gettime(CLOCK_MONOTONIC, &a); int r = g10_gen(s, level); clock_gettime(CLOCK_MONOTONIC, &b);
        double ms = (b.tv_sec - a.tv_sec) * 1000.0 + (b.tv_nsec - a.tv_nsec) / 1e6; total += ms; if(ms > worst) worst = ms; if(!r) fails++;
    }
    printf("level %d seeds %u..%u 失敗 %d 平均 %.2fms 最大 %.1fms\n", level, s0, s0 + n - 1, fails, total / n, worst);
    return fails ? 1 : 0;
}
