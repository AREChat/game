/* render.c - 画面を PPM に かきだして 目で たしかめる ための ちいさな 描画ホスト(PCの 確認用)。
 * platform_host.c の かわりに リンクする。文字は 位置と 大きさだけ しるし(うすい 四角)で あらわす。 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <math.h>
#include "platform.h"
#include "host_api.h"
#include "game.h"

static unsigned char top[TOP_H][TOP_W][3], bot[BOT_H][BOT_W][3];
static int cur = 0;
static unsigned g_down, g_held;
static const unsigned *g_script; static int g_script_n, g_frame;
static int g_shx, g_shy;
static char g_input_name[64] = "主人公";

void host_set_script(const unsigned *keys, int n) { g_script = keys; g_script_n = n; g_frame = 0; }
void host_set_max_frames(int n) { (void)n; }
void host_set_input_name(const char *s) { strncpy(g_input_name, s, sizeof(g_input_name) - 1); }
void host_set_save_path(const char *p) { (void)p; }
const char *host_screen_text(void) { return ""; }
int host_frame(void) { return g_frame; }
int host_rect_count(void) { return 0; }
int host_sfx_count(int id) { (void)id; return 0; }
int host_sfx_total(void) { return 0; }
int host_shake_x(void) { return g_shx; }
int host_shake_y(void) { return g_shy; }

void plat_init(void) {}
void plat_exit(void) {}
bool plat_running(void) { return true; }
void plat_poll(void) { unsigned k = (g_script && g_frame < g_script_n) ? g_script[g_frame] : 0; g_down = k; g_held = k; g_frame++; }
unsigned plat_keys_down(void) { return g_down; }
unsigned plat_keys_held(void) { return g_held; }
void plat_frame_begin(void) {}
void plat_frame_end(void) {}
void plat_screen(int s, unsigned char r, unsigned char g, unsigned char b) {
    cur = s;
    if (s == SCR_TOP) { for (int y = 0; y < TOP_H; y++) for (int x = 0; x < TOP_W; x++) { top[y][x][0] = r; top[y][x][1] = g; top[y][x][2] = b; } }
    else { for (int y = 0; y < BOT_H; y++) for (int x = 0; x < BOT_W; x++) { bot[y][x][0] = r; bot[y][x][1] = g; bot[y][x][2] = b; } }
}
void plat_rect(int x, int y, int w, int h, unsigned char r, unsigned char g, unsigned char b) {
    int W = cur == SCR_TOP ? TOP_W : BOT_W, H = cur == SCR_TOP ? TOP_H : BOT_H;
    if (cur == SCR_TOP) { x += g_shx; y += g_shy; }
    for (int j = y; j < y + h; j++) for (int i = x; i < x + w; i++) {
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        unsigned char *p = cur == SCR_TOP ? top[j][i] : bot[j][i];
        p[0] = r; p[1] = g; p[2] = b;
    }
}
void plat_text(int x, int y, float sc, unsigned char r, unsigned char g, unsigned char b, const char *s) {
    int n = 0; for (const char *p = s; *p; p++) if (((unsigned char)*p & 0xC0) != 0x80) n++;
    int cw = (int)(30.0f * sc), ch = (int)(26.0f * sc);
    for (int i = 0; i < n; i++) plat_rect(x + i * cw + 1, y + ch / 4, cw - 3, ch / 2, (unsigned char)(r * 3 / 4), (unsigned char)(g * 3 / 4), (unsigned char)(b * 3 / 4));
}
bool plat_text_input(const char *hint, char *out, int outsz) { (void)hint; strncpy(out, g_input_name, (size_t)outsz - 1); out[outsz - 1] = 0; return true; }
bool plat_save_write(const void *d, size_t sz) { (void)d; (void)sz; return true; }
bool plat_save_read(void *d, size_t sz) { (void)d; (void)sz; return false; }
unsigned plat_time_seed(void) { return 1; }
bool plat_draw_enemy(int e, int x, int y, int size) { (void)e; (void)x; (void)y; (void)size; return false; }
bool plat_draw_battle_bg(int a) { (void)a; return false; }
void plat_bgm_enable(bool on) { (void)on; }
bool plat_bgm_enabled(void) { return true; }
void plat_sfx(int id) { (void)id; }
bool plat_art(int a, int c, int x, int y, float s) { (void)a; (void)c; (void)x; (void)y; (void)s; return false; }
void plat_art_unload(int a) { (void)a; }
int host_art_count(int a) { (void)a; return 0; }
bool plat_voice(int s, int st) { (void)s; (void)st; return false; }
void plat_voice_stop(void) {}
void plat_voice_enable(bool on) { (void)on; }
bool plat_voice_enabled(void) { return true; }
int host_voice_count(void) { return 0; }
void plat_shake(int dx, int dy) { g_shx = dx; g_shy = dy; }

static void dump(const char *path, int top_) {
    FILE *f = fopen(path, "wb"); if (!f) return;
    int W = top_ ? TOP_W : BOT_W, H = top_ ? TOP_H : BOT_H;
    fprintf(f, "P6\n%d %d\n255\n", W, H);
    fwrite(top_ ? (void *)top : (void *)bot, 1, (size_t)W * H * 3, f);
    fclose(f);
}

static void run(unsigned k, int n) { static unsigned a[1]; a[0] = k; for (int i = 0; i < n; i++) { host_set_script(a, 1); game_frame(); } }

int main(int argc, char **argv) {
    const char *what = argc > 1 ? argv[1] : "act0";
    const char *out = argc > 2 ? argv[2] : "build_host/shot";
    game_set_testmode(1); game_set_typewriter(0);
    game_init(); game_seed(3);
    SaveData *g = game_data(); g->partyN = 4;
    for (int i = 0; i < 4; i++) game_member_init(&g->party[i], i, 20);
    g->flags[F_CH2_START] = 1; g->area = AREA_MILFI; g->px = 11; g->py = 8;
    run(PK_A, 1); for (int i = 0; i < 400 && strcmp(game_scene_name(), "map"); i++) run(PK_A, 1);
    char path[128];
    if (!strncmp(what, "act", 3)) {
        int st = atoi(what + 3);
        game_set_typewriter(1);
        game_test_start_action(st);
        run(PK_RIGHT, 60);
        run(PK_RIGHT | PK_A, 20);
        run(PK_RIGHT, 6);
    } else if (!strcmp(what, "ending")) {
        game_set_typewriter(1);
        game_test_run_script(S_CH6_AE1);
        for (int i = 0; i < 40 && strcmp(game_scene_name(), "ending"); i++) run(PK_A, 1);
        run(0, 100);
    } else if (!strcmp(what, "choice")) {
        game_test_run_script(S_CH6_INTRO);
        for (int i = 0; i < 60 && strcmp(game_scene_name(), "choice"); i++) run(PK_A, 1);
        run(PK_DOWN, 1); run(0, 5);
    } else if (!strcmp(what, "script")) {
        game_set_typewriter(1);
        game_test_run_script(S_CH6_INTRO);
        run(0, 20);
    } else if (!strcmp(what, "menu")) {
        run(PK_X, 1); run(0, 3);
    } else if (!strncmp(what, "fac", 3)) {
        game_test_open_facility(atoi(what + 3)); run(0, 3);
    } else if (!strcmp(what, "gameover")) {
        g->partyN = 1; g->party[0].hp = 1;
        game_test_run_script(S_CH6_A4B);
        for (int i = 0; i < 400 && strcmp(game_scene_name(), "gameover"); i++) run(PK_A, 1);
        run(PK_DOWN, 1); run(0, 2);
    } else if (!strcmp(what, "title")) {
        game_test_reset_to_title(); run(0, 25);
    }
    snprintf(path, sizeof(path), "%s_top.ppm", out); dump(path, 1);
    snprintf(path, sizeof(path), "%s_bot.ppm", out); dump(path, 0);
    printf("scene=%s\n", game_scene_name());
    return 0;
}
