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
#endif
