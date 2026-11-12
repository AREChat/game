#ifndef CH8SCRIPT_H
#define CH8SCRIPT_H
/* Update15: 第8章「試験の都」のスクリプト(到着→試験の説明→考える→判断→結果へ)。game.c非依存の純粋データ。
 * 話者ID: 0=ナレーション 1=主人公 2=セラ 3=ユノ 4=試験官メルガ
 * 場面: ARRIVE=到着 / RULES=試験の説明 / THINK=考える / RIGHT=正解 / WRONG=不正解 / RESULT=合格発表 */
#define CH8S_NARR 0
#define CH8S_HERO 1
#define CH8S_SERA 2
#define CH8S_YUNO 3
#define CH8S_EXAMINER 4
#define CH8S_SPEAKERS 5

#define CH8S_ARRIVE 0
#define CH8S_RULES 1
#define CH8S_THINK 2
#define CH8S_RIGHT 3
#define CH8S_WRONG 4
#define CH8S_RESULT 5
#define CH8S_SCENES 6

int ch8s_len(int scene);                 /* 範囲外は 0 */
int ch8s_speaker(int scene, int line);   /* 範囲外は -1 */
const char *ch8s_text(int scene, int line); /* 範囲外は "" */
const char *ch8s_speaker_name(int speaker); /* ナレーション・範囲外は "" */
int ch8s_scene_for_verdict(int verdict); /* 1 -> RIGHT / 0 -> WRONG / 他 -> -1 */
int ch8s_next_scene(int scene);          /* ARRIVE->RULES->THINK, RIGHT->RESULT, 他 -1 */
#endif
