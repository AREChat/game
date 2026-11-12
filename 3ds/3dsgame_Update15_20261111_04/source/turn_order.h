/* turn_order.h - ほしあかり英雄譚 戦闘の行動順ロジック(Update04)
 * すばやさ降順、同値は添字の小さい方が先。戦闘不能(alive=false)は除く。game.c 非依存。 */
#ifndef TURN_ORDER_H
#define TURN_ORDER_H
#include <stdbool.h>
/* out に行動する者の添字を行動順に書き、人数を返す。不正引数は 0 */
int to_order(const int spd[], const bool alive[], int n, int out[]);
#endif
