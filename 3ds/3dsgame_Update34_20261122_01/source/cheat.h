#ifndef CHEAT_H
#define CHEAT_H
/* Update31: チートコード(100パターン)。コードの もじを うつと、その こうかが おこる。
 * セーブデータの 値を、安全な はんい(ゴールド 0〜999999 など)に おさえながら かえるだけの ロジック。
 * 設定の スイッチは ExtData.reserved[11..14] に 入る: 11=エンカウントなし 12=むてき 13=経験値ばいりつ 14=ゴールドばいりつ */
#include "game.h"

#define CHEAT_COUNT 100
#define CHEAT_CODE_MAX 24

int cheat_count(void);                      /* 100 */
const char *cheat_code(int i);              /* コード(半角英数・小文字)。範囲外は "" */
const char *cheat_name(int i);              /* こうかの 説明(日本語)。範囲外は "" */
int cheat_find(const char *input);          /* 入力から さがす。大文字小文字・前後の空白は むし。ないときは -1 */

typedef struct { bool ok; bool warped; char msg[96]; } CheatResult;
/* 入力の コードを つかう。見つからない/つかえないときは ok=false で メッセージを 入れる。何が あっても 値は 安全な はんいに おさまる */
CheatResult cheat_apply(SaveData *g, const char *input);
CheatResult cheat_apply_index(SaveData *g, int i);
#endif
