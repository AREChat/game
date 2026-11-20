#ifndef CH5SCRIPT_H
#define CH5SCRIPT_H
/* Update11: 第5章「首の病と最下位」のスクリプト(首が回らない→最下位→お祭りの料理で おなかが しくしく→立ち直りの言葉→回復)。game.c非依存の純粋データ。
 * 話者ID: 0=ナレーション 1=主人公 2=セラ 3=ミオ 4=保健室の先生 5=屋台のおじさん 6=級友たち
 * 場面: NECK=首が まわらない / LAST=試験で最下位 / FESTIVAL=お祭りの料理で おなかが しくしく / RIGHT=立ち直りが正解 / WRONG=不正解(やり直し) / RECOVER=回復して前へ */
#define CH5S_NARR 0
#define CH5S_HERO 1
#define CH5S_SERA 2
#define CH5S_MIO 3
#define CH5S_NURSE 4
#define CH5S_STALL 5
#define CH5S_CLASS 6
#define CH5S_SPEAKERS 7

#define CH5S_NECK 0
#define CH5S_LAST 1
#define CH5S_FESTIVAL 2
#define CH5S_RIGHT 3
#define CH5S_WRONG 4
#define CH5S_RECOVER 5
#define CH5S_SCENES 6

int ch5s_len(int scene);                    /* 範囲外は 0 */
int ch5s_speaker(int scene, int line);      /* 範囲外は -1 */
const char *ch5s_text(int scene, int line); /* 範囲外は "" */
const char *ch5s_speaker_name(int speaker); /* ナレーションは ""、範囲外も "" */
/* 立ち直りの結果(CH5_RIGHT=1 / CH5_WRONG=0)から場面を選ぶ。それ以外は -1 */
int ch5s_scene_for_verdict(int verdict);
/* 続けて流す場面。NECK->LAST、LAST->FESTIVAL、RIGHT->RECOVER。ほかは -1 */
int ch5s_next_scene(int scene);
#endif
