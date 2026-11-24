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
bool plat_draw_enemy(int enemy, int x, int y, int size) { (void)enemy; (void)x; (void)y; (void)size; return false; }
bool plat_draw_battle_bg(int area) { (void)area; return false; }
static int g_sfx_n[SFX_COUNT], g_sfx_total, g_shx, g_shy;
void plat_sfx(int id) { if (id >= 0 && id < SFX_COUNT) { g_sfx_n[id]++; g_sfx_total++; } }
void plat_shake(int dx, int dy) { g_shx = dx; g_shy = dy; }
int host_sfx_count(int id) { return (id >= 0 && id < SFX_COUNT) ? g_sfx_n[id] : 0; }
int host_sfx_total(void) { return g_sfx_total; }
int host_shake_x(void) { return g_shx; }
int host_shake_y(void) { return g_shy; }
static int g_art_n[ART_COUNT];
bool plat_art(int art, int cell, int x, int y, float scale) {
    static const char *const names[ART_COUNT] = { "act_tiles", "act_hero", "act_bg", "end_a", "end_b", "end_c" };
    static signed char have[ART_COUNT] = { -1, -1, -1, -1, -1, -1 };
    char p[64]; (void)cell; (void)x; (void)y; (void)scale;
    if (art < 0 || art >= ART_COUNT) return false;
    if (have[art] < 0) {   /* 絵の ファイルが あれば 「えがけた」ことに する(テストで 絵の道を とおす)。1回だけ しらべる */
        FILE *f; snprintf(p, sizeof(p), "gfx/%s.png", names[art]);
        f = fopen(p, "rb"); have[art] = f ? 1 : 0; if (f) fclose(f);
    }
    if (!have[art]) return false;
    g_art_n[art]++; return true;
}
void plat_art_unload(int art) { (void)art; }
int host_art_count(int art) { return (art >= 0 && art < ART_COUNT) ? g_art_n[art] : 0; }
static bool g_voice_on = true; static int g_voice_n;
bool plat_voice(int script, int step) {
    char p[96]; snprintf(p, sizeof(p), "romfs/voice/%d_%d.pcm", script, step);
    FILE *f = fopen(p, "rb"); if (!f) return false;
    fclose(f);
    if (!g_voice_on) return false;
    g_voice_n++; return true;
}
void plat_voice_stop(void) {}
void plat_voice_enable(bool on) { g_voice_on = on; }
bool plat_voice_enabled(void) { return g_voice_on; }
int host_voice_count(void) { return g_voice_n; }
static bool g_bgm_on = true;
void plat_bgm_enable(bool on) { g_bgm_on = on; }
bool plat_bgm_enabled(void) { return g_bgm_on; }
