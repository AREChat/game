#include <stdio.h>
#include <stdlib.h>
#include "../source/action.h"
/* 保存された 解答を そのまま ActState に あてて クリアできるか */
int main(int argc, char **argv) {
    int st = argc > 1 ? atoi(argv[1]) : 0;
    char path[64]; snprintf(path, sizeof(path), "build_host/act_solution_%d.txt", st);
    FILE *fp = fopen(path, "r"); if (!fp) { printf("no file\n"); return 1; }
    int n; fscanf(fp, "%d", &n);
    ActState a; act_start(&a, st);
    for (int i = 0; i < n; i++) {
        unsigned v; fscanf(fp, "%u", &v);
        act_step(&a, v);
        if (a.ev & AEV_DIE) printf("died at frame %d x=%d y=%d\n", i, act_px(&a), act_py(&a));
    }
    printf("state=%d deaths=%d frames=%d\n", a.state, a.deaths, n);
    return 0;
}
