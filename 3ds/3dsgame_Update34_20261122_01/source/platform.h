/* platform.h - 3DS(citro2d)とPCホストテストの差を吸収する薄い層 */
#ifndef PLATFORM_H
#define PLATFORM_H
#include <stdbool.h>
#include <stddef.h>

enum {
    PK_A = 1 << 0, PK_B = 1 << 1, PK_X = 1 << 2, PK_Y = 1 << 3,
    PK_START = 1 << 4, PK_SELECT = 1 << 5,
    PK_UP = 1 << 6, PK_DOWN = 1 << 7, PK_LEFT = 1 << 8, PK_RIGHT = 1 << 9,
    PK_L = 1 << 10, PK_R = 1 << 11
};
enum { SCR_TOP = 0, SCR_BOTTOM = 1 };
#define TOP_W 400
#define TOP_H 240
#define BOT_W 320
#define BOT_H 240

void plat_init(void);
void plat_exit(void);
bool plat_running(void);              /* falseで終了 */
void plat_poll(void);                 /* 入力取得(毎フレーム先頭) */
unsigned plat_keys_down(void);
unsigned plat_keys_held(void);
void plat_frame_begin(void);
void plat_screen(int screen, unsigned char r, unsigned char g, unsigned char b); /* 画面選択+塗りつぶし */
void plat_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b);
void plat_text(int x, int y, float scale, unsigned char r, unsigned char g, unsigned char b, const char *utf8);
void plat_frame_end(void);
bool plat_text_input(const char *hint, char *out, int outsz); /* 3DSソフトウェアキーボード */
bool plat_save_write(const void *data, size_t size);
bool plat_save_read(void *data, size_t size);
unsigned plat_time_seed(void);
/* Update23: 戦闘の絵。絵があって描けたら true、なければ false(game.cは四角でえがく) */
bool plat_draw_enemy(int enemy, int x, int y, int size);   /* enemy: ENEMIES[]の番号。size: 画面での大きさ(正方形) */
bool plat_draw_battle_bg(int area);
/* Update24: BGMのオン/オフ(ヘルプのYボタン)。オフでも曲の位置づけは覚えていて、オンにすると今の場面の曲が鳴る */
void plat_bgm_enable(bool on);
bool plat_bgm_enabled(void);                          /* area: AREA_*。上画面ぜんたいに描く */
/* Update32: こうかおん(ボイスふうの「ぴこぴこ」音をふくむ)と 画面の ゆれ。音は 本体の中で つくるので、ファイルは いらない */
enum { SFX_BLIP0, SFX_BLIP1, SFX_BLIP2, SFX_BLIP3, SFX_BLIP4, SFX_BLIP5, SFX_BLIP6,   /* しゃべる人ごとの 声 */
       SFX_JUMP, SFX_LAND, SFX_STAR, SFX_HIT, SFX_DASH, SFX_DIE, SFX_SWITCH, SFX_CHOICE, SFX_DECIDE,
       SFX_WIPE, SFX_FANFARE, SFX_BOOM, SFX_SPARK, SFX_CURSOR, SFX_COUNT };
void plat_sfx(int id);                 /* 範囲外は 何もしない。音が出せない本体でも だいじょうぶ */
void plat_shake(int dx, int dy);
/* Update32: せりふの ボイス(合成音声)。romfs/voice/<スクリプトID>_<ステップ>.pcm が あれば 鳴らして true。なければ false(ぴこぴこ音が かわりに なる) */
bool plat_voice(int script, int step);
void plat_voice_stop(void);
void plat_voice_enable(bool on);
bool plat_voice_enabled(void);       /* 上画面を dx,dy ずらして えがく(0,0 で もとに) */
#endif
