#ifndef CH3SCRIPT_H
#define CH3SCRIPT_H
/* Update09: 第3章「勤勉の像の謎」のスクリプト(全校生徒の前での推理シーン・クロモリへの引っ越し導入)。game.c非依存の純粋データ。
 * 話者ID: 0=ナレーション 1=主人公 2=セラ 3=ガイ 4=生徒たち 5=学び舎の先生 6=主人公の母
 * 場面: INTRO=庭の調査を終えて広場へ集まる / RIGHT=推理が正解 / WRONG=推理が不正解(やり直し) / MOVE=像のその後と引っ越し導入 */
#define CH3S_NARR 0
#define CH3S_HERO 1
#define CH3S_SERA 2
#define CH3S_GAI 3
#define CH3S_CROWD 4
#define CH3S_TEACHER 5
#define CH3S_MOTHER 6
#define CH3S_SPEAKERS 7

#define CH3S_INTRO 0
#define CH3S_RIGHT 1
#define CH3S_WRONG 2
#define CH3S_MOVE 3
#define CH3S_SCENES 4

int ch3s_len(int scene);                      /* 場面の行数。範囲外は 0 */
int ch3s_speaker(int scene, int line);        /* 話者ID。範囲外は -1 */
const char *ch3s_text(int scene, int line);   /* セリフ。範囲外は "" */
const char *ch3s_speaker_name(int speaker);   /* 表示名。主人公は "主人公"。範囲外は "" */
/* 推理の結果(CL_RIGHT=1 / CL_WRONG=0 / CL_NOT_READY=-1 に対応する値)から流す場面を選ぶ。
 * 1 -> RIGHT / 0 -> WRONG / それ以外 -> -1(場面なし) */
int ch3s_scene_for_verdict(int verdict);
/* 正解の場面のあとに MOVE を続ける。続く場面があればそのID、なければ -1 */
int ch3s_next_scene(int scene);
#endif
