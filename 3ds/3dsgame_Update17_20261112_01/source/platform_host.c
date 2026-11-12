/* platform_host.c - PC上の自動テスト用(画面は描かず、描画テキストを記録する) */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>
#include "platform.h"
#include "host_api.h"

static unsigned g_down, g_held;
static const unsigned *g_script; static int g_script_n, g_frame, g_max_frames = 100000;
static char g_text[16384]; static int g_text_len;
static char g_input_name[64] = "主人公";
static char g_save_path[256] = "host_save.dat";
static int g_rects;

void host_set_script(const unsigned *keys, int n) { g_script = keys; g_script_n = n; g_frame = 0; }
void host_set_max_frames(int n) { g_max_frames = n; }
void host_set_input_name(const char *s) { strncpy(g_input_name, s, sizeof(g_input_name) - 1); }
void host_set_save_path(const char *p) { strncpy(g_save_path, p, sizeof(g_save_path) - 1); }
const char *host_screen_text(void) { return g_text; }
int host_frame(void) { return g_frame; }
int host_rect_count(void) { return g_rects; }

void plat_init(void) {}
void plat_exit(void) {}
bool plat_running(void) { return g_frame < g_max_frames; }
void plat_poll(void) {
    unsigned k = (g_script && g_frame < g_script_n) ? g_script[g_frame] : 0;
    g_down = k; g_held = k;
    g_frame++;
}
unsigned plat_keys_down(void) { return g_down; }
unsigned plat_keys_held(void) { return g_held; }
void plat_frame_begin(void) { g_text_len = 0; g_text[0] = 0; g_rects = 0; }
void plat_screen(int s, unsigned char r, unsigned char g, unsigned char b) { (void)s; (void)r; (void)g; (void)b; }
void plat_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b) {
    (void)x; (void)y; (void)w; (void)h; (void)r; (void)g; (void)b; g_rects++;
}
void plat_text(int x, int y, float sc, unsigned char r, unsigned char g, unsigned char b, const char *s) {
    (void)x; (void)y; (void)sc; (void)r; (void)g; (void)b;
    size_t n = strlen(s);
    if (g_text_len + (int)n + 2 < (int)sizeof(g_text)) {
        memcpy(g_text + g_text_len, s, n); g_text_len += (int)n;
        g_text[g_text_len++] = '\n'; g_text[g_text_len] = 0;
    }
}
void plat_frame_end(void) {}
bool plat_text_input(const char *hint, char *out, int outsz) {
    (void)hint; strncpy(out, g_input_name, (size_t)outsz - 1); out[outsz - 1] = 0; return out[0] != 0;
}
bool plat_save_write(const void *d, size_t sz) {
    FILE *f = fopen(g_save_path, "wb"); if (!f) return false;
    size_t n = fwrite(d, 1, sz, f); fclose(f); return n == sz;
}
bool plat_save_read(void *d, size_t sz) {
    FILE *f = fopen(g_save_path, "rb"); if (!f) return false;
    size_t n = fread(d, 1, sz, f); fclose(f); return n == sz;
}
unsigned plat_time_seed(void) { return 12345u; }
