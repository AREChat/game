#ifndef CH4SCRIPT_H
#define CH4SCRIPT_H
/* Update10: 第4章「家族の危機」のスクリプト(嵐で家がこわれる→母が家出→説得→クロモリの学び舎で名前を覚える作戦)。game.c非依存の純粋データ。
 * 話者ID: 0=ナレーション 1=主人公 2=母 3=父 4=学び舎の先生 5=ミオ 6=級友たち
 * 場面: ACCIDENT=嵐で家がこわれる / LEAVE=母の家出 / RIGHT=説得が正解 / WRONG=説得が不正解(やり直し) / NEWSCHOOL=新しい学び舎 */
#define CH4S_NARR 0
#define CH4S_HERO 1
#define CH4S_MOTHER 2
#define CH4S_FATHER 3
#define CH4S_TEACHER 4
#define CH4S_MIO 5
#define CH4S_CLASS 6
#define CH4S_SPEAKERS 7

#define CH4S_ACCIDENT 0
#define CH4S_LEAVE 1
#define CH4S_RIGHT 2
#define CH4S_WRONG 3
#define CH4S_NEWSCHOOL 4
#define CH4S_SCENES 5

int ch4s_len(int scene);                  /* 場面の行数。範囲外は 0 */
int ch4s_speaker(int scene, int line);    /* 話者ID。範囲外は -1 */
const char *ch4s_text(int scene, int line);   /* セリフ。範囲外は "" */
const char *ch4s_speaker_name(int speaker);   /* 表示名。ナレーションは ""。範囲外も "" */
/* 説得の結果(ch4data.h の CH4_RIGHT=1 / CH4_WRONG=0 / CH4_NOT_READY=-1 に対応する値)から流す場面を選ぶ。
 * 1 -> RIGHT / 0 -> WRONG / それ以外 -> -1(場面なし) */
int ch4s_scene_for_verdict(int verdict);
/* 続けて流す場面。ACCIDENT -> LEAVE、RIGHT -> NEWSCHOOL。ほかは -1 */
int ch4s_next_scene(int scene);
#endif
