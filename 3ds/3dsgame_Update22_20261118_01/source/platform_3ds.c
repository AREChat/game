/* platform_3ds.c - 実機用(devkitARM + libctru + citro2d)。日本語は本体フォントを使う */
#include <3ds.h>
#include <citro2d.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include "platform.h"

#define SAVE_DIR  "sdmc:/3ds/hoshiakari"
#define SAVE_PATH "sdmc:/3ds/hoshiakari/save.dat"

static C3D_RenderTarget *g_top, *g_bot;
static C2D_TextBuf g_buf;
static unsigned g_down, g_held;

static unsigned conv(u32 k) {
    unsigned r = 0;
    if (k & KEY_A) r |= PK_A;
    if (k & KEY_B) r |= PK_B;
    if (k & KEY_X) r |= PK_X;
    if (k & KEY_Y) r |= PK_Y;
    if (k & KEY_START) r |= PK_START;
    if (k & KEY_SELECT) r |= PK_SELECT;
    if (k & KEY_UP) r |= PK_UP;
    if (k & KEY_DOWN) r |= PK_DOWN;
    if (k & KEY_LEFT) r |= PK_LEFT;
    if (k & KEY_RIGHT) r |= PK_RIGHT;
    if (k & KEY_L) r |= PK_L;
    if (k & KEY_R) r |= PK_R;
    return r;
}

void plat_init(void) {
    gfxInitDefault();
    C3D_Init(C3D_DEFAULT_CMDBUF_SIZE);
    C2D_Init(C2D_DEFAULT_MAX_OBJECTS);
    C2D_Prepare();
    g_top = C2D_CreateScreenTarget(GFX_TOP, GFX_LEFT);
    g_bot = C2D_CreateScreenTarget(GFX_BOTTOM, GFX_LEFT);
    g_buf = C2D_TextBufNew(8192);
}
void plat_exit(void) {
    C2D_TextBufDelete(g_buf);
    C2D_Fini();
    C3D_Fini();
    gfxExit();
}
bool plat_running(void) { return aptMainLoop(); }
void plat_poll(void) {
    hidScanInput();
    g_down = conv(hidKeysDown());
    g_held = conv(hidKeysHeld());
}
unsigned plat_keys_down(void) { return g_down; }
unsigned plat_keys_held(void) { return g_held; }

void plat_frame_begin(void) {
    C3D_FrameBegin(C3D_FRAME_SYNCDRAW);
    C2D_TextBufClear(g_buf);
}
void plat_screen(int screen, unsigned char r, unsigned char g, unsigned char b) {
    C3D_RenderTarget *t = (screen == SCR_TOP) ? g_top : g_bot;
    C2D_TargetClear(t, C2D_Color32(r, g, b, 255));
    C2D_SceneBegin(t);
}
void plat_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b) {
    C2D_DrawRectSolid((float)x, (float)y, 0.5f, (float)w, (float)h, C2D_Color32(r, g, b, 255));
}
void plat_text(int x, int y, float scale, unsigned char r, unsigned char g, unsigned char b, const char *s) {
    C2D_Text t;
    C2D_TextParse(&t, g_buf, s);
    C2D_TextOptimize(&t);
    C2D_DrawText(&t, C2D_WithColor, (float)x, (float)y, 0.6f, scale, scale, C2D_Color32(r, g, b, 255));
}
void plat_frame_end(void) { C3D_FrameEnd(0); }

bool plat_text_input(const char *hint, char *out, int outsz) {
    SwkbdState st;
    swkbdInit(&st, SWKBD_TYPE_NORMAL, 2, 8);
    swkbdSetHintText(&st, hint);
    swkbdSetInitialText(&st, out);
    SwkbdButton b = swkbdInputText(&st, out, (size_t)outsz);
    return b == SWKBD_BUTTON_CONFIRM && out[0] != '\0';
}

bool plat_save_write(const void *data, size_t size) {
    mkdir("sdmc:/3ds", 0777);
    mkdir(SAVE_DIR, 0777);
    FILE *f = fopen(SAVE_PATH, "wb");
    if (!f) return false;
    size_t n = fwrite(data, 1, size, f);
    fclose(f);
    return n == size;
}
bool plat_save_read(void *data, size_t size) {
    FILE *f = fopen(SAVE_PATH, "rb");
    if (!f) return false;
    size_t n = fread(data, 1, size, f);
    fclose(f);
    return n == size;
}
unsigned plat_time_seed(void) { return (unsigned)osGetTime(); }
