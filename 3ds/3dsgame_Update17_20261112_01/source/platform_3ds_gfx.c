/* platform_3ds_gfx.c - 3DS実機用: citro2dで絵、ndspでBGM(WAV 16bit)を鳴らす */
#include <3ds.h>
#include <citro2d.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "plat_gfx.h"

static C2D_SpriteSheet g_sheet[SHEET_COUNT];
static bool g_ready = false;
static bool g_audio = false;
static int g_cur = BGM_NONE;
static ndspWaveBuf g_wave;
static void *g_pcm = NULL;
static const char *k_sheet[SHEET_COUNT] = { "romfs:/gfx/tiles.t3x", "romfs:/gfx/chars.t3x", "romfs:/gfx/buildings.t3x" };
static const char *k_bgm[BGM_COUNT] = { "romfs:/bgm_field.wav", "romfs:/bgm_town.wav", "romfs:/bgm_event.wav" };

bool plat_gfx_init(void)
{
    int i, ok = 0;
    for (i = 0; i < SHEET_COUNT; i++) {
        g_sheet[i] = C2D_SpriteSheetLoad(k_sheet[i]);
        if (g_sheet[i]) ok++;
    }
    g_ready = (ok == SHEET_COUNT);
    if (R_SUCCEEDED(ndspInit())) {
        ndspSetOutputMode(NDSP_OUTPUT_STEREO);
        g_audio = true;
    }
    return g_ready;
}

void plat_bgm_stop(void)
{
    if (g_audio) ndspChnWaveBufClear(0);
    if (g_pcm) { linearFree(g_pcm); g_pcm = NULL; }
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
    g_ready = false;
}

bool plat_gfx_ready(void) { return g_ready; }
int plat_bgm_current(void) { return g_cur; }

void plat_sprite(int sheet, int sx, int sy, int w, int h, int x, int y, float scale)
{
    C2D_Image img;
    Tex3DS_SubTexture st;
    if (!g_ready || sheet < 0 || sheet >= SHEET_COUNT) return;
    img = C2D_SpriteSheetGetImage(g_sheet[sheet], 0);
    st = *img.subtex;
    {   /* 元の画像の大きさ(st.width/height)を基準に、切り出す範囲を作る */
        float tw = (float)img.tex->width, th = (float)img.tex->height;
        st.left = (float)sx / tw;
        st.right = (float)(sx + w) / tw;
        st.top = 1.0f - (float)sy / th;
        st.bottom = 1.0f - (float)(sy + h) / th;
        st.width = (unsigned short)w;
        st.height = (unsigned short)h;
    }
    img.subtex = &st;
    C2D_DrawImageAt(img, (float)x, (float)y, 0.5f, NULL, scale, scale);
}

/* WAV(16bit PCM, mono/stereo)をまるごと読んでループ再生 */
void plat_bgm_play(int bgm)
{
    FILE *f;
    unsigned char hd[12], ck[8];
    unsigned ch = 2, rate = 22050, bits = 16, dlen = 0;
    long dpos = 0;
    int got_fmt = 0;
    if (bgm == g_cur) return;
    plat_bgm_stop();
    if (!g_audio || bgm < 0 || bgm >= BGM_COUNT) return;
    f = fopen(k_bgm[bgm], "rb");
    if (!f) return;
    if (fread(hd, 1, 12, f) != 12 || memcmp(hd, "RIFF", 4) != 0 || memcmp(hd + 8, "WAVE", 4) != 0) { fclose(f); return; }
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
    if (!got_fmt || !dlen || bits != 16 || (ch != 1 && ch != 2)) { fclose(f); return; }
    g_pcm = linearAlloc(dlen);
    if (!g_pcm) { fclose(f); return; }
    fseek(f, dpos, SEEK_SET);
    if (fread(g_pcm, 1, dlen, f) != dlen) { fclose(f); linearFree(g_pcm); g_pcm = NULL; return; }
    fclose(f);
    DSP_FlushDataCache(g_pcm, dlen);
    ndspChnReset(0);
    ndspChnSetInterp(0, NDSP_INTERP_LINEAR);
    ndspChnSetRate(0, (float)rate);
    ndspChnSetFormat(0, ch == 2 ? NDSP_FORMAT_STEREO_PCM16 : NDSP_FORMAT_MONO_PCM16);
    memset(&g_wave, 0, sizeof g_wave);
    g_wave.data_vaddr = g_pcm;
    g_wave.nsamples = dlen / (ch * 2);
    g_wave.looping = true;
    ndspChnWaveBufAdd(0, &g_wave);
    g_cur = bgm;
}
