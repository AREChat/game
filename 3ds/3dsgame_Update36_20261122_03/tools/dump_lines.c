/* dump_lines.c - 台本の せりふを TSVで かきだす(ボイスの もとに する)。 id<TAB>step<TAB>しゃべる人<TAB>せりふ */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "../source/game.h"
int main(int argc, char **argv) {
    int from = argc > 1 ? atoi(argv[1]) : 0;
    for (int s = from; s < SCRIPT_COUNT; s++)
        for (int i = 0; i < SCRIPT_LEN[s]; i++) {
            const Step *st = &SCRIPTS[s][i];
            if (st->t == ST_LINE && st->who && st->who[0]) printf("%d\t%d\t%s\t%s\n", s, i, st->who, st->text);
        }
    return 0;
}
