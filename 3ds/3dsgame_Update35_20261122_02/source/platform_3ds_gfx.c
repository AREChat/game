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
static bool g_bgm_on = true;   /* ヘルプの Y で オン/オフ */
static int g_want = BGM_NONE;  /* オフのあいだも、鳴らしたかった曲をおぼえておく */
static const char *k_sheet[SHEET_COUNT] = { "romfs:/gfx/tiles.t3x", "romfs:/gfx/chars.t3x", "romfs:/gfx/buildings.t3x", "romfs:/gfx/enemies.t3x", "romfs:/gfx/battlebg.t3x" };
static const char *k_bgm[BGM_COUNT] = { "romfs:/bgm_field.wav", "romfs:/bgm_town.wav", "romfs:/bgm_event.wav" };


/* ===== Update32: こうかおん(本体の中で つくる。ファイルは いらないので 読みこみは はやい) ===== */
#include <math.h>
#include "platform.h"
#define SFX_RATE 22050
typedef struct { int ms; float f0, f1; int wave; float vol; } SfxNote;   /* wave: 0=しかく 1=さんかく 2=ざつおん 3=なみ */
static short *g_sfx[SFX_COUNT];
static int g_sfxn[SFX_COUNT];
static ndspWaveBuf g_sfxw[4];
static int g_sfxch = 0;

static void sfx_build(int id, const SfxNote *nt, int n)
{
    int i, s, total = 0, pos = 0;
    unsigned lcg = 12345u + (unsigned)id * 7919u;
    float phase = 0.0f;
    short *buf;
    for (i = 0; i < n; i++) total += nt[i].ms * SFX_RATE / 1000;
    if (total <= 0) return;
    buf = (short *)linearAlloc((size_t)total * 2);
    if (!buf) return;
    for (i = 0; i < n; i++) {
        int len = nt[i].ms * SFX_RATE / 1000;
        for (s = 0; s < len; s++) {
            float t = (float)s / (float)len, f = nt[i].f0 + (nt[i].f1 - nt[i].f0) * t, v, env;
            phase += f / (float)SFX_RATE; phase -= floorf(phase);
            if (nt[i].wave == 0) v = phase < 0.5f ? 1.0f : -1.0f;
            else if (nt[i].wave == 1) v = 4.0f * fabsf(phase - 0.5f) - 1.0f;
            else if (nt[i].wave == 2) { lcg = lcg * 1664525u + 1013904223u; v = (float)((int)(lcg >> 16) & 0xFFFF) / 32768.0f - 1.0f; }
            else v = sinf(6.2831853f * phase);
            env = (1.0f - t); if (s < 40) env *= (float)s / 40.0f;   /* ぷちっ と ならないよう はじめを なめらかに */
            buf[pos++] = (short)(v * nt[i].vol * env * 11000.0f);
        }
    }
    DSP_FlushDataCache(buf, (size_t)total * 2);
    g_sfx[id] = buf; g_sfxn[id] = total;
}

static void sfx_init(void)
{
    static const float voice[7] = { 392.0f, 523.0f, 294.0f, 659.0f, 220.0f, 784.0f, 330.0f };
    int i;
    for (i = 0; i < 7; i++) {   /* しゃべる人ごとの「ぴこぴこ」声。高さと ゆがみが ちがう */
        SfxNote n[2] = { { 38, voice[i], voice[i] * 1.12f, (i == 5) ? 3 : (i % 2 ? 1 : 0), 0.42f }, { 22, voice[i] * 1.12f, voice[i] * 0.95f, (i == 5) ? 3 : 1, 0.3f } };
        sfx_build(SFX_BLIP0 + i, n, 2);
    }
    { SfxNote n[1] = { { 150, 300.0f, 820.0f, 0, 0.55f } }; sfx_build(SFX_JUMP, n, 1); }
    { SfxNote n[1] = { { 70, 140.0f, 60.0f, 2, 0.5f } }; sfx_build(SFX_LAND, n, 1); }
    { SfxNote n[3] = { { 60, 988.0f, 988.0f, 0, 0.45f }, { 60, 1319.0f, 1319.0f, 0, 0.45f }, { 120, 1760.0f, 1760.0f, 3, 0.5f } }; sfx_build(SFX_STAR, n, 3); }
    { SfxNote n[2] = { { 40, 200.0f, 200.0f, 2, 0.7f }, { 110, 180.0f, 70.0f, 0, 0.5f } }; sfx_build(SFX_HIT, n, 2); }
    { SfxNote n[1] = { { 130, 900.0f, 200.0f, 2, 0.45f } }; sfx_build(SFX_DASH, n, 1); }
    { SfxNote n[3] = { { 90, 520.0f, 360.0f, 0, 0.5f }, { 90, 360.0f, 240.0f, 0, 0.5f }, { 160, 240.0f, 90.0f, 1, 0.5f } }; sfx_build(SFX_DIE, n, 3); }
    { SfxNote n[2] = { { 70, 600.0f, 900.0f, 3, 0.5f }, { 90, 900.0f, 450.0f, 3, 0.5f } }; sfx_build(SFX_SWITCH, n, 2); }
    { SfxNote n[2] = { { 70, 660.0f, 660.0f, 3, 0.5f }, { 150, 880.0f, 880.0f, 3, 0.55f } }; sfx_build(SFX_CHOICE, n, 2); }
    { SfxNote n[3] = { { 60, 523.0f, 523.0f, 0, 0.4f }, { 60, 659.0f, 659.0f, 0, 0.4f }, { 160, 1047.0f, 1047.0f, 1, 0.5f } }; sfx_build(SFX_DECIDE, n, 3); }
    { SfxNote n[1] = { { 260, 200.0f, 1400.0f, 1, 0.45f } }; sfx_build(SFX_WIPE, n, 1); }
    { SfxNote n[5] = { { 110, 523.0f, 523.0f, 0, 0.45f }, { 110, 659.0f, 659.0f, 0, 0.45f }, { 110, 784.0f, 784.0f, 0, 0.45f }, { 110, 1047.0f, 1047.0f, 0, 0.45f }, { 380, 1319.0f, 1319.0f, 1, 0.55f } }; sfx_build(SFX_FANFARE, n, 5); }
    { SfxNote n[2] = { { 60, 90.0f, 90.0f, 2, 0.8f }, { 260, 110.0f, 40.0f, 2, 0.6f } }; sfx_build(SFX_BOOM, n, 2); }
    { SfxNote n[2] = { { 40, 1500.0f, 2200.0f, 3, 0.35f }, { 60, 2200.0f, 1200.0f, 3, 0.3f } }; sfx_build(SFX_SPARK, n, 2); }
    { SfxNote n[1] = { { 30, 800.0f, 800.0f, 0, 0.3f } }; sfx_build(SFX_CURSOR, n, 1); }
}

void plat_sfx(int id)
{
    int ch;
    if (!g_audio || id < 0 || id >= SFX_COUNT || !g_sfx[id]) return;
    ch = 1 + (g_sfxch++ & 3);   /* BGM(0番)の じゃまを しない 1〜4番を 順ばんに つかう */
    ndspChnReset(ch);
    ndspChnSetInterp(ch, NDSP_INTERP_NONE);
    ndspChnSetRate(ch, (float)SFX_RATE);
    ndspChnSetFormat(ch, NDSP_FORMAT_MONO_PCM16);
    memset(&g_sfxw[ch - 1], 0, sizeof(ndspWaveBuf));
    g_sfxw[ch - 1].data_vaddr = g_sfx[id];
    g_sfxw[ch - 1].nsamples = (u32)g_sfxn[id];
    ndspChnWaveBufAdd(ch, &g_sfxw[ch - 1]);
}


/* ===== Update32: せりふの ボイス(romfs:/voice/<ID>_<ステップ>.pcm = 12000Hz 8ビット モノ)。1行ずつ その場で 読む(小さい ので はやい) ===== */
static void *g_vbuf[2]; static size_t g_vcap[2]; static ndspWaveBuf g_vwave[2]; static int g_vcur = 0;
static bool g_voice_on = true;
void plat_voice_enable(bool on) { g_voice_on = on; if (!on) plat_voice_stop(); }
bool plat_voice_enabled(void) { return g_voice_on; }
void plat_voice_stop(void) { if (g_audio) ndspChnReset(5); }
bool plat_voice(int script, int step)
{
    char path[64];
    FILE *f;
    long sz;
    int b;
    if (!g_audio || !g_voice_on) return false;
    snprintf(path, sizeof(path), "romfs:/voice/%d_%d.pcm", script, step);
    f = fopen(path, "rb");
    if (!f) { plat_voice_stop(); return false; }   /* このせりふに 声が なければ 前の 声を とめる */
    fseek(f, 0, SEEK_END); sz = ftell(f); fseek(f, 0, SEEK_SET);
    if (sz <= 0 || sz > 600000) { fclose(f); plat_voice_stop(); return false; }
    b = 1 - g_vcur;   /* 2つの バッファを こうごに つかう(いま 鳴っている 声を こわさない) */
    if ((size_t)sz > g_vcap[b]) {
        if (g_vbuf[b]) linearFree(g_vbuf[b]);
        g_vbuf[b] = linearAlloc((size_t)sz);
        g_vcap[b] = g_vbuf[b] ? (size_t)sz : 0;
        if (!g_vbuf[b]) { fclose(f); return false; }
    }
    if (fread(g_vbuf[b], 1, (size_t)sz, f) != (size_t)sz) { fclose(f); return false; }
    fclose(f);
    DSP_FlushDataCache(g_vbuf[b], (size_t)sz);
    ndspChnReset(5);
    ndspChnSetInterp(5, NDSP_INTERP_LINEAR);
    ndspChnSetRate(5, 12000.0f);
    ndspChnSetFormat(5, NDSP_FORMAT_MONO_PCM8);
    memset(&g_vwave[b], 0, sizeof(ndspWaveBuf));
    g_vwave[b].data_vaddr = g_vbuf[b];
    g_vwave[b].nsamples = (u32)sz;
    ndspChnWaveBufAdd(5, &g_vwave[b]);
    g_vcur = b;
    return true;
}

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
    if (g_audio) { sfx_init(); glog("sfx synthesized: %d", SFX_COUNT, ""); }
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
    for (i = 0; i < ART_COUNT; i++) plat_art_unload(i);
    if (g_audio) { ndspExit(); g_audio = false; }
    { int b; for (b = 0; b < 2; b++) if (g_vbuf[b]) { linearFree(g_vbuf[b]); g_vbuf[b] = NULL; } }
    { int b; for (b = 0; b < SFX_COUNT; b++) if (g_sfx[b]) { linearFree(g_sfx[b]); g_sfx[b] = NULL; } }
    { int b; for (b = 0; b < BGM_COUNT; b++) if (g_bgm[b].pcm) { linearFree(g_bgm[b].pcm); g_bgm[b].pcm = NULL; } }
    if (g_romfs) { romfsExit(); g_romfs = false; }
    if (g_log) { fclose(g_log); g_log = NULL; }
    g_ready = false;
}

bool plat_gfx_ready(void) { return g_ready; }
bool plat_bgm_enabled(void) { return g_bgm_on; }
void plat_bgm_enable(bool on)
{
    g_bgm_on = on;
    if (!on) plat_bgm_stop();
    else if (g_want >= 0) plat_bgm_play(g_want);
}
bool plat_sheet_ok(int sheet) { return sheet >= 0 && sheet < SHEET_COUNT && g_sheet[sheet] != NULL; }
int plat_bgm_current(void) { return g_cur; }

static void sprite_draw(C2D_SpriteSheet sh, int sx, int sy, int w, int h, int x, int y, float scale)
{
    C2D_Image img;
    Tex3DS_SubTexture st;
    img = C2D_SpriteSheetGetImage(sh, 0);
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
    { int ox, oy; plat_shake_off(&ox, &oy); x += ox; y += oy; }
    if (scale < 0.0f) x += (int)(-scale * (float)w);   /* 左右はんてん: 右はしから 左へ えがく */
    C2D_DrawImageAt(img, (float)x, (float)y, 0.5f, NULL, scale, fabsf(scale));
}

void plat_sprite(int sheet, int sx, int sy, int w, int h, int x, int y, float scale)
{
    if (sheet < 0 || sheet >= SHEET_COUNT || !g_sheet[sheet]) return;
    if (sheet < SHEET_REQUIRED && !g_ready) return;
    sprite_draw(g_sheet[sheet], sx, sy, w, h, x, y, scale);
}

/* ===== Update35: 大きな 絵(アクション・エンディング)。つかう ときに はじめて 読み、おおきい ものは つかい おわったら はなす ===== */
typedef struct { const char *path; int cols, cw, ch; } ArtDef;
static const ArtDef k_art[ART_COUNT] = {
    { "romfs:/gfx/act_tiles.t3x", 8, 32, 32 }, { "romfs:/gfx/act_hero.t3x", 6, 32, 32 }, { "romfs:/gfx/act_bg.t3x", 1, 400, 240 },
    { "romfs:/gfx/end_a.t3x", 1, 400, 240 }, { "romfs:/gfx/end_b.t3x", 1, 400, 240 }, { "romfs:/gfx/end_c.t3x", 1, 400, 240 } };
static C2D_SpriteSheet g_artSheet[ART_COUNT];
static bool g_artTried[ART_COUNT];
void plat_art_unload(int art)
{
    if (art < 0 || art >= ART_COUNT) return;
    if (g_artSheet[art]) { C2D_SpriteSheetFree(g_artSheet[art]); g_artSheet[art] = NULL; }
    g_artTried[art] = false;
}
bool plat_art(int art, int cell, int x, int y, float scale)
{
    int sx, sy;
    if (art < 0 || art >= ART_COUNT || cell < 0 || !g_romfs) return false;
    if (!g_artSheet[art] && !g_artTried[art]) {
        g_artTried[art] = true;
        g_artSheet[art] = C2D_SpriteSheetLoad(k_art[art].path);
        glog("art %d: %s", art, g_artSheet[art] ? "OK" : "NG(読めない)");
    }
    if (!g_artSheet[art]) return false;
    sx = (cell % k_art[art].cols) * k_art[art].cw; sy = (cell / k_art[art].cols) * k_art[art].ch;
    sprite_draw(g_artSheet[art], sx, sy, k_art[art].cw, k_art[art].ch, x, y, scale);
    return true;
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
    g_want = bgm;
    if (bgm == g_cur) return;
    plat_bgm_stop();
    if (!g_bgm_on || !g_audio || bgm < 0 || bgm >= BGM_COUNT) return;
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
