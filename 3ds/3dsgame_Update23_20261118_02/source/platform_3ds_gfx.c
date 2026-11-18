/* platform_3ds_gfx.c - 3DS実機用: citro2dで絵、ndspでBGM(WAV 16bit)を鳴らす */
#include <3ds.h>
#include <citro2d.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "plat_gfx.h"

static C2D_SpriteSheet g_sheet[SHEET_COUNT];
static bool g_ready = false;
static bool g_romfs = false;
static bool g_audio = false;
static int g_cur = BGM_NONE;
static ndspWaveBuf g_wave;
static void *g_pcm = NULL;   /* いま鳴らしている曲(下の g_bgm のどれか。ここでは解放しない) */
/* Update23: 曲は起動時に ぜんぶ メモリに読んでおく(場面が変わるたびに SDから読むと、そのたびに止まって遅く感じるため) */
typedef struct { void *pcm; unsigned dlen, rate, ch; } BgmCache;
static BgmCache g_bgm[BGM_COUNT];
static bool bgm_load(int bgm);
static const char *k_sheet[SHEET_COUNT] = { "romfs:/gfx/tiles.t3x", "romfs:/gfx/chars.t3x", "romfs:/gfx/buildings.t3x", "romfs:/gfx/enemies.t3x", "romfs:/gfx/battlebg.t3x" };
static const char *k_bgm[BGM_COUNT] = { "romfs:/bgm_field.wav", "romfs:/bgm_town.wav", "romfs:/bgm_event.wav" };

/* Update21: 絵と音の読み込み結果を SDカードに書く(うまく動かないとき原因がわかるように)。sdmc:/3ds/hoshiakari/gfx_log.txt */
static FILE *g_log = NULL;
static void glog(const char *fmt, int a, const char *b)
{
    if (!g_log) return;
    fprintf(g_log, fmt, a, b ? b : "");
    fputc('\n', g_log);
    fflush(g_log);
}

bool plat_gfx_init(void)
{
    int i, ok = 0;
    Result rr;
    g_log = fopen("sdmc:/3ds/hoshiakari/gfx_log.txt", "w");
    /* Update21: romfs:/ を使う前に romfsInit() が必要(これが無くて、絵もBGMも読めなかった) */
    rr = romfsInit();
    g_romfs = R_SUCCEEDED(rr);
    glog("romfsInit: result=%d %s", (int)rr, g_romfs ? "OK" : "NG");
    for (i = 0; i < SHEET_COUNT; i++) {
        g_sheet[i] = C2D_SpriteSheetLoad(k_sheet[i]);
        if (g_sheet[i] && i < SHEET_REQUIRED) ok++;
        glog("sheet %d: %s", i, g_sheet[i] ? "OK" : "NG(読めない)");
        if (g_sheet[i]) {   /* 絵の大きさと向きを記録(回転して入っていないか見る) */
            C2D_Image im = C2D_SpriteSheetGetImage(g_sheet[i], 0);
            if (g_log) fprintf(g_log, "  tex %dx%d sub %dx%d l=%.3f t=%.3f r=%.3f b=%.3f rotated=%d\n", (int)im.tex->width, (int)im.tex->height,
                (int)im.subtex->width, (int)im.subtex->height, im.subtex->left, im.subtex->top, im.subtex->right, im.subtex->bottom,
                Tex3DS_SubTextureRotated(im.subtex) ? 1 : 0);
        }
    }
    g_ready = (ok == SHEET_REQUIRED);
    rr = ndspInit();
    if (R_SUCCEEDED(rr)) {
        ndspSetOutputMode(NDSP_OUTPUT_STEREO);
        g_audio = true;
    }
    glog("ndspInit: result=%d %s", (int)rr, g_audio ? "OK" : "NG(dspfirm.cdcが無いと音は出ません)");
    if (g_audio) {   /* 曲を ぜんぶ 先に 読んでおく */
        for (i = 0; i < BGM_COUNT; i++) glog("bgm %d preload: %s", i, bgm_load(i) ? "OK" : "NG");
    }
    glog("gfx ready=%d %s", g_ready ? 1 : 0, "");
    return g_ready;
}

void plat_bgm_stop(void)
{
    if (g_audio) ndspChnWaveBufClear(0);
    g_pcm = NULL;
    g_cur = BGM_NONE;
}

void plat_gfx_exit(void)
{
    int i;
    plat_bgm_stop();
    for (i = 0; i < SHEET_COUNT; i++) {
        if (g_sheet[i]) { C2D_SpriteSheetFree(g_sheet[i]); g_sheet[i] = NULL; }
    }
    if (g_audio) { ndspExit(); g_audio = false; }
    { int b; for (b = 0; b < BGM_COUNT; b++) if (g_bgm[b].pcm) { linearFree(g_bgm[b].pcm); g_bgm[b].pcm = NULL; } }
    if (g_romfs) { romfsExit(); g_romfs = false; }
    if (g_log) { fclose(g_log); g_log = NULL; }
    g_ready = false;
}

bool plat_gfx_ready(void) { return g_ready; }
bool plat_sheet_ok(int sheet) { return sheet >= 0 && sheet < SHEET_COUNT && g_sheet[sheet] != NULL; }
int plat_bgm_current(void) { return g_cur; }

void plat_sprite(int sheet, int sx, int sy, int w, int h, int x, int y, float scale)
{
    C2D_Image img;
    Tex3DS_SubTexture st;
    if (sheet < 0 || sheet >= SHEET_COUNT || !g_sheet[sheet]) return;
    if (sheet < SHEET_REQUIRED && !g_ready) return;
    img = C2D_SpriteSheetGetImage(g_sheet[sheet], 0);
    st = *img.subtex;
    {   /* 元の画像の大きさ(st.width/height)を基準に、切り出す範囲を作る */
        /* Update22: 元の絵の左上(img.subtex の left/top)を基準にする。絵は回転させずに入れてある(t3s に --atlas を付けない) */
        float tw = (float)img.tex->width, th = (float)img.tex->height;
        float l0 = img.subtex->left, t0 = img.subtex->top;
        st.left = l0 + (float)sx / tw;
        st.right = l0 + (float)(sx + w) / tw;
        st.top = t0 - (float)sy / th;
        st.bottom = t0 - (float)(sy + h) / th;
        st.width = (unsigned short)w;
        st.height = (unsigned short)h;
    }
    img.subtex = &st;
    C2D_DrawImageAt(img, (float)x, (float)y, 0.5f, NULL, scale, scale);
}

/* WAV(16bit PCM, mono/stereo)を1曲ぶん読んで、メモリに置く(1回だけ) */
static bool bgm_load(int bgm)
{
    FILE *f;
    unsigned char hd[12], ck[8];
    unsigned ch = 2, rate = 22050, bits = 16, dlen = 0;
    long dpos = 0;
    int got_fmt = 0;
    BgmCache *c = &g_bgm[bgm];
    if (c->pcm) return true;
    f = fopen(k_bgm[bgm], "rb");
    if (!f) return false;
    if (fread(hd, 1, 12, f) != 12 || memcmp(hd, "RIFF", 4) != 0 || memcmp(hd + 8, "WAVE", 4) != 0) { fclose(f); return false; }
    while (fread(ck, 1, 8, f) == 8) {
        unsigned n = ck[4] | (ck[5] << 8) | (ck[6] << 16) | ((unsigned)ck[7] << 24);
        if (memcmp(ck, "fmt ", 4) == 0) {
            unsigned char b[16];
            if (n < 16 || fread(b, 1, 16, f) != 16) break;
            ch = b[2] | (b[3] << 8);
            rate = b[4] | (b[5] << 8) | (b[6] << 16) | ((unsigned)b[7] << 24);
            bits = b[14] | (b[15] << 8);
            got_fmt = 1;
            if (n > 16) fseek(f, (long)(n - 16), SEEK_CUR);
        } else if (memcmp(ck, "data", 4) == 0) {
            dlen = n; dpos = ftell(f); break;
        } else {
            fseek(f, (long)n, SEEK_CUR);
        }
    }
    if (!got_fmt || !dlen || bits != 16 || (ch != 1 && ch != 2)) { fclose(f); return false; }
    c->pcm = linearAlloc(dlen);
    if (!c->pcm) { fclose(f); return false; }
    fseek(f, dpos, SEEK_SET);
    if (fread(c->pcm, 1, dlen, f) != dlen) { fclose(f); linearFree(c->pcm); c->pcm = NULL; return false; }
    fclose(f);
    DSP_FlushDataCache(c->pcm, dlen);
    c->dlen = dlen; c->rate = rate; c->ch = ch;
    return true;
}

/* メモリにある曲を ループ再生(切りかえは一瞬) */
void plat_bgm_play(int bgm)
{
    BgmCache *c;
    if (bgm == g_cur) return;
    plat_bgm_stop();
    if (!g_audio || bgm < 0 || bgm >= BGM_COUNT) return;
    if (!bgm_load(bgm)) return;   /* ふつうは起動時に読めている。読めていなければ、ここで1回だけ読む */
    c = &g_bgm[bgm];
    g_pcm = c->pcm;
    ndspChnReset(0);
    ndspChnSetInterp(0, NDSP_INTERP_LINEAR);
    ndspChnSetRate(0, (float)c->rate);
    ndspChnSetFormat(0, c->ch == 2 ? NDSP_FORMAT_STEREO_PCM16 : NDSP_FORMAT_MONO_PCM16);
    memset(&g_wave, 0, sizeof g_wave);
    g_wave.data_vaddr = c->pcm;
    g_wave.nsamples = c->dlen / (c->ch * 2);
    g_wave.looping = true;
    ndspChnWaveBufAdd(0, &g_wave);
    g_cur = bgm;
}
