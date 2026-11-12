#include "turn_order.h"

int to_order(const int spd[], const bool alive[], int n, int out[]) {
    if (!spd || !alive || !out || n <= 0 || n > 16) return 0;
    int c = 0;
    for (int i = 0; i < n; i++) {
        if (!alive[i]) continue;
        int j = c++;
        while (j > 0 && spd[out[j - 1]] < spd[i]) { out[j] = out[j - 1]; j--; } /* 安定な挿入ソート */
        out[j] = i;
    }
    return c;
}
