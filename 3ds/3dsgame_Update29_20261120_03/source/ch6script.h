#ifndef CH6SCRIPT_H
#define CH6SCRIPT_H
/* Update12: 第6章「ミオの特訓」のスクリプト(特訓→進路面談→暗号の暗記法→正解/やり直し→成長)。game.c非依存の純粋データ。
 * 話者ID: 0=ナレーション 1=主人公 2=セラ 3=ミオ 4=先生 */
#define CH6S_NARR 0
#define CH6S_HERO 1
#define CH6S_SERA 2
#define CH6S_MIO 3
#define CH6S_TEACHER 4
#define CH6S_SPEAKERS 5

#define CH6S_TRAIN 0
#define CH6S_COUNSEL 1
#define CH6S_CIPHER 2
#define CH6S_RIGHT 3
#define CH6S_WRONG 4
#define CH6S_GROW 5
#define CH6S_SCENES 6

int ch6s_len(int scene);
int ch6s_speaker(int scene, int line);
const char *ch6s_text(int scene, int line);
const char *ch6s_speaker_name(int speaker);
int ch6s_scene_for_verdict(int verdict);
int ch6s_next_scene(int scene);
#endif
