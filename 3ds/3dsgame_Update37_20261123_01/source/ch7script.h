#ifndef CH7SCRIPT_H
#define CH7SCRIPT_H
/* Update13: 第7章「挑戦状」のスクリプト(ユノと再会→差出人不明の手紙→考える→判断→試験へ)。game.c非依存の純粋データ。
 * 話者ID: 0=ナレーション 1=主人公 2=セラ 3=ユノ 4=駅長
 * 場面: MEET=ユノと再会 / LETTER=手紙が届く / THINK=考える / RIGHT=正解 / WRONG=不正解 / EXAM=試験の都へ */
#define CH7S_NARR 0
#define CH7S_HERO 1
#define CH7S_SERA 2
#define CH7S_YUNO 3
#define CH7S_STATION 4
#define CH7S_SPEAKERS 5

#define CH7S_MEET 0
#define CH7S_LETTER 1
#define CH7S_THINK 2
#define CH7S_RIGHT 3
#define CH7S_WRONG 4
#define CH7S_EXAM 5
#define CH7S_SCENES 6

int ch7s_len(int scene);                     /* 範囲外は 0 */
int ch7s_speaker(int scene, int line);       /* 範囲外は -1 */
const char *ch7s_text(int scene, int line);  /* 範囲外は "" */
const char *ch7s_speaker_name(int speaker);  /* ナレーション・範囲外は "" */
int ch7s_scene_for_verdict(int verdict);     /* 1 -> RIGHT / 0 -> WRONG / 他 -> -1 */
int ch7s_next_scene(int scene);              /* MEET->LETTER->THINK, RIGHT->EXAM, 他 -1 */
#endif
