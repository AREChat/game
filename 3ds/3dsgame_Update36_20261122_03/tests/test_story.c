/* test_story.c - 第6章「三つのあかり」: はい/いいえ/わからない の 27とおり ぜんぶ を さいごまで あそんで たしかめる。
 * 分岐・エンディング9つ・仲間の 出入り・星の記録(やりなおし)・文字の ゆっくり表示・戦闘の やりなおし・でたらめ入力 */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <dirent.h>
#include "../source/game.h"
#include "../source/platform.h"
#include "../source/host_api.h"
#include "../source/monster.h"
#include "../source/action.h"

static int checks = 0, fails = 0;
#define CHECK(c, ...) do { checks++; if (!(c)) { fails++; if (fails < 40) { printf("FAIL line %d: ", __LINE__); printf(__VA_ARGS__); printf("\n"); } } } while (0)

static void press(unsigned k) { static unsigned a[1]; a[0] = k; host_set_script(a, 1); host_set_max_frames(100000000); game_frame(); }
static bool scene_is(const char *s) { return strcmp(game_scene_name(), s) == 0; }

/* 新しい ゲームを はじめて マップまで すすめ、第5章を おえた つよい なかま4人の 状態にする */
static SaveData *fresh_ch5_done(int level) {
    host_set_save_path("test_story_save.dat"); remove("test_story_save.dat");
    game_test_reset_to_title();   /* まえの テストの ヘルプ画面などが のこらない ように */
    game_init(); game_seed(31); host_set_input_name("テスト");
    press(PK_A);
    for (int i = 0; i < 400 && !scene_is("map"); i++) press(PK_A);
    SaveData *g = game_data();
    g->partyN = 4;
    for (int i = 0; i < 4; i++) game_member_init(&g->party[i], i, level);
    memset(&g->ext, 0, sizeof(g->ext));
    memset(g->items, 0, sizeof(g->items));
    g->gold = 1000;
    memset(g->flags, 0, sizeof(g->flags));
    int fl[] = { F_PROLOGUE, F_MET_SERA, F_RIDE_DONE, F_BELL_DONE, F_BANDIT_DEAD, F_KINDER_ARRIVED, F_DISPUTE_DONE, F_CH1_DONE, F_CH2_START, F_SCHOOL_ENTERED, F_GAI_JOINED,
        F_CLUE_A, F_CLUE_B, F_PRINCIPAL_DONE, F_CH2_DONE, F_CH3_START, F_CH3_DONE, F_CH4_START, F_CH4_DONE, F_CH5_START, F_CH5_TALK, F_CH5_DONE };
    for (unsigned i = 0; i < sizeof(fl) / sizeof(fl[0]); i++) g->flags[fl[i]] = 1;
    g->area = AREA_CAVE; g->px = 3; g->py = 7; g->chapter = 5;
    return g;
}

/* 物語を さいごまで すすめる。choice の たびに plan[] の こたえを えらぶ。F_CH6_END が たち マップに もどったら 1 */
static int drive(const int plan[3], int maxFrames, int *framesOut, int *choicesSeen, int *actsSeen, int *endsSeen) {
    int ci = 0, moved = 0, dc = 0;
    SaveData *g = game_data();
    for (int f = 0; f < maxFrames; f++) {
        const char *sc = game_scene_name();
        if (!strcmp(sc, "map") && g->flags[F_CH6_END]) { if (framesOut) *framesOut = f; return 1; }
        if (strcmp(sc, "deduct")) dc = 0;
        if (!strcmp(sc, "choice")) {
            int want = ci < 3 ? plan[ci] : 0;
            if (moved < want) { press(PK_DOWN); moved++; }
            else { press(PK_A); moved = 0; ci++; if (choicesSeen) (*choicesSeen)++; }
        } else if (!strcmp(sc, "deduct")) { int m = dc++ % 3; press(m == 2 ? PK_DOWN : PK_A); }
        else if (!strcmp(sc, "act")) { if (actsSeen) (*actsSeen)++; press(PK_Y); }
        else if (!strcmp(sc, "ending")) { if (endsSeen) (*endsSeen)++; press(PK_A); }
        else press(PK_A);
    }
    return 0;
}

static int member_index(SaveData *g, int id) { for (int i = 0; i < g->partyN; i++) if (g->party[i].id == id) return i; return -1; }
static void check_party_valid(SaveData *g, const char *why) {
    CHECK(g->partyN >= 1 && g->partyN <= MAX_PARTY, "%s: partyN %d", why, g->partyN);
    CHECK(g->party[0].id == MEM_HERO, "%s: hero first", why);
    for (int i = 0; i < g->partyN; i++) {
        CHECK(g->party[i].id >= 0 && g->party[i].id < MEM_COUNT && g->party[i].hp >= 0 && g->party[i].hp <= g->party[i].maxhp && g->party[i].name[0], "%s: member %d broken", why, i);
        for (int j = i + 1; j < g->partyN; j++) CHECK(g->party[i].id != g->party[j].id, "%s: duplicate member id %d", why, g->party[i].id);
        CHECK(g->ext.job[i] < JOB_COUNT, "%s: job %d", why, i);
    }
    for (int i = g->partyN; i < MAX_PARTY; i++) CHECK(g->party[i].name[0] == 0 && g->ext.job[i] == 0, "%s: empty slot %d not cleared", why, i);
}

int main(void) {
    game_set_testmode(1); game_set_typewriter(0);
    static const int BASE[3] = { 1, 4, 7 };
    int routeFrames = 0, maxFrames = 0;
    /* 1. 27とおり ぜんぶ */
    for (int q1 = 0; q1 < 3; q1++) for (int q2 = 0; q2 < 3; q2++) for (int q3 = 0; q3 < 3; q3++) {
        char tag[48]; snprintf(tag, sizeof(tag), "route %d-%d-%d", q1, q2, q3);
        SaveData *g = fresh_ch5_done(60);
        int hpBase = g->party[0].maxhp;
        const int plan[3] = { q1, q2, q3 };
        int fr = 0, nch = 0, nact = 0, nend = 0;
        game_test_run_script(S_CH6_INTRO);
        int ok = drive(plan, 40000, &fr, &nch, &nact, &nend);
        CHECK(ok, "%s: did not finish (scene %s)", tag, game_scene_name());
        if (!ok) continue;
        routeFrames += fr; if (fr > maxFrames) maxFrames = fr;
        int end = BASE[q1] + q3;
        for (int e = 1; e <= 9; e++) CHECK((g->flags[F_END_A1 + e - 1] != 0) == (e == end), "%s: ending flag %d (expected only %d)", tag, e, end);
        CHECK(g->flags[F_PATH_A + q1] && !g->flags[F_PATH_A + (q1 + 1) % 3] && !g->flags[F_PATH_A + (q1 + 2) % 3], "%s: path flags", tag);
        CHECK(g->flags[F_DONE_A + q1] && !g->flags[F_DONE_A + (q1 + 1) % 3], "%s: done flags", tag);
        CHECK(g->flags[F_CNT_YES] + g->flags[F_CNT_NO] + g->flags[F_CNT_UNS] == 3 && nch == 3, "%s: choice counts %d/%d/%d seen %d", tag, g->flags[F_CNT_YES], g->flags[F_CNT_NO], g->flags[F_CNT_UNS], nch);
        CHECK(g->flags[F_CNT_YES + q1] >= 1, "%s: counter of first answer", tag);
        CHECK(g->flags[F_CHOICE_BASE + CH_Q1] == q1 + 1, "%s: Q1 record %d", tag, g->flags[F_CHOICE_BASE + CH_Q1]);
        CHECK(g->flags[F_CH6_END] && g->chapter == 7 && g->area == AREA_MILFI, "%s: epilogue state chapter %d area %d", tag, g->chapter, g->area);
        CHECK(nend == 1 || nend >= 1, "%s: ending scene seen", tag);
        CHECK(g->items[ITEM_TONIC] >= 5 && g->items[ITEM_ETHER] >= 5, "%s: epilogue reward", tag);
        /* 各 道に ある アクション面 */
        if (q1 == 0) CHECK(!g->flags[F_ACT_COLLAPSE] && !g->flags[F_ACT_SHADOW], "%s: only climb in path A", tag);
        CHECK(nact == (q1 == 0 ? 1 : 1) , "%s: action scenes seen %d", tag, nact);
        /* なかま */
        bool gaiAway = (q1 == 1 && q2 != 0);
        bool gaiBack = gaiAway && q3 == 0;
        int expectN = (gaiAway && !gaiBack) ? 3 : 4;
        CHECK(g->partyN == expectN, "%s: partyN %d expected %d", tag, g->partyN, expectN);
        CHECK((member_index(g, MEM_GAI) >= 0) == (expectN == 4), "%s: Gai presence", tag);
        CHECK(member_index(g, MEM_SERA) >= 0 && member_index(g, MEM_MIO) >= 0, "%s: Sera/Mio stay", tag);
        check_party_valid(g, tag);
        CHECK(g->flags[F_GAI_AWAY] == (gaiAway ? 1 : 0), "%s: F_GAI_AWAY", tag);
        /* ダッシュ王 */
        bool dashInBox = false; for (int i = 0; i < g->ext.monN; i++) if (g->ext.mon[i].enemy == 10) dashInBox = true;
        CHECK(dashInBox == (q1 == 0 && q2 == 0), "%s: dash king in box %d", tag, dashInBox);
        CHECK(g->flags[F_DASH_ALLY] == (q1 == 0 && q2 == 0), "%s: F_DASH_ALLY", tag);
        CHECK(g->flags[F_DASH_WATCH] == (q1 == 0 && q2 == 2), "%s: F_DASH_WATCH", tag);
        CHECK(g->flags[F_C_TRUST] == (q1 == 2 && q2 == 0), "%s: F_C_TRUST", tag);
        /* 星砕きの道: ちからが つよく なる / かえすと もとに もどる */
        if (q1 == 1) {
            int hp = g->party[0].maxhp;
            if (q3 == 0) CHECK(hp == hpBase, "%s: power returned (%d vs %d)", tag, hp, hpBase);
            else CHECK(hp == hpBase + 36, "%s: power kept (%d vs %d)", tag, hp, hpBase + 36);
        } else CHECK(g->party[0].maxhp == hpBase, "%s: no power change", tag);
        CHECK(g->gold <= 999999 && g->gold >= 1000, "%s: gold %d", tag, g->gold);
        CHECK(scene_is("map"), "%s: ends on map", tag);
        {   /* セーブして よみこんでも おなじ(どの ルートの あとでも ちゃんと ひらける) */
            SaveData snap = *g;
            CHECK(game_save(), "%s: save", tag);
            game_init();
            CHECK(game_load(), "%s: load after the route", tag);
            SaveData *h = game_data();
            CHECK(memcmp(h->flags, snap.flags, sizeof(snap.flags)) == 0 && h->partyN == snap.partyN && h->gold == snap.gold && h->chapter == snap.chapter && h->area == snap.area &&
                  memcmp(&h->ext, &snap.ext, sizeof(snap.ext)) == 0, "%s: loaded data differs", tag);
            for (int i = 0; i < h->partyN; i++) CHECK(h->party[i].id == snap.party[i].id && h->party[i].level == snap.party[i].level, "%s: loaded member %d", tag, i);
        }
    }
    printf("  27 routes done: total %d frames, longest %d\n", routeFrames, maxFrames);

    /* 2. 星の記録で べつの 道を やりなおす(3つの 道 ぜんぶ から ほかの 道へ) */
    for (int q1 = 0; q1 < 3; q1++) {
        SaveData *g = fresh_ch5_done(60);
        const int plan1[3] = { q1, 1, 1 };
        game_test_run_script(S_CH6_INTRO);
        CHECK(drive(plan1, 40000, NULL, NULL, NULL, NULL), "replay %d: first run", q1);
        game_test_run_script(S_CH6_RECORD);
        for (int i = 0; i < 40 && !(scene_is("map") && g->flags[F_CH6_READY] && !g->flags[F_CH6_END]); i++) press(PK_A);
        CHECK(scene_is("map") && !g->flags[F_CH6_END] && g->flags[F_CH6_READY] && !g->flags[F_CH6_BEGIN], "replay %d: reset state", q1);
        CHECK(!g->flags[F_PATH_A] && !g->flags[F_PATH_B] && !g->flags[F_PATH_C] && !g->flags[F_DONE_A] && !g->flags[F_DONE_B] && !g->flags[F_DONE_C], "replay %d: path flags cleared", q1);
        CHECK(member_index(g, MEM_GAI) >= 0 && g->partyN == 4, "replay %d: Gai back (partyN %d)", q1, g->partyN);
        check_party_valid(g, "after record");
        int q1b = (q1 + 1) % 3; const int plan2[3] = { q1b, 0, 2 };
        game_test_run_script(S_CH6_LUMINA);
        int ok = drive(plan2, 40000, NULL, NULL, NULL, NULL);
        CHECK(ok, "replay %d: second run did not finish", q1);
        CHECK(ok && g->flags[F_END_A1 + BASE[q1b] - 1 + 2] && g->flags[F_PATH_A + q1b] && !g->flags[F_PATH_A + q1], "replay %d: second path is %d", q1, q1b);
        /* むかしの エンディングの きろくは のこる */
        int found = 0; for (int e = 0; e < 9; e++) if (g->flags[F_END_A1 + e]) found++;
        CHECK(found >= 1, "replay: some endings recorded");
    }
    /* 3. 9つの エンディングが ぜんぶ 見られる(星の記録で なんども) */
    {
        SaveData *g = fresh_ch5_done(60);
        int got = 0;
        for (int q1 = 0; q1 < 3; q1++) for (int q3 = 0; q3 < 3; q3++) {
            if (g->flags[F_CH6_END]) { game_test_run_script(S_CH6_RECORD); for (int i = 0; i < 40 && g->flags[F_CH6_END]; i++) press(PK_A); game_test_run_script(S_CH6_LUMINA); }
            else game_test_run_script(S_CH6_INTRO);
            const int plan[3] = { q1, (q1 + q3) % 3, q3 };
            CHECK(drive(plan, 40000, NULL, NULL, NULL, NULL), "all endings: %d-%d did not finish", q1, q3);
        }
        for (int e = 0; e < 9; e++) if (g->flags[F_END_A1 + e]) got++;
        CHECK(got == 9, "all 9 endings reached on one save: %d", got);
        check_party_valid(g, "all endings");
    }

    /* 4. ストーリーの 戦いで まけたら その場で やりなおせる(ゴールドは へらない) */
    {
        SaveData *g = fresh_ch5_done(1);
        g->partyN = 1; g->party[0].hp = 1; g->gold = 777;
        game_test_run_script(S_CH6_A4B);   /* ヤミ王との 戦い */
        for (int i = 0; i < 200 && !scene_is("gameover"); i++) press(PK_A);
        CHECK(scene_is("gameover"), "defeat reaches gameover: %s", game_scene_name());
        g->party[0].hp = 0; press(PK_A);
        CHECK(scene_is("battle") && g->gold == 777 && g->party[0].hp == g->party[0].maxhp, "retry: scene %s gold %d hp %d", game_scene_name(), g->gold, g->party[0].hp);
        /* もういちど まけて、こんどは Bで まちへ */
        for (int i = 0; i < 400 && !scene_is("gameover"); i++) press(PK_A);
        CHECK(scene_is("gameover"), "second defeat");
        press(PK_B);
        CHECK(scene_is("map") && g->gold == 388, "B goes to town: scene %s gold %d", game_scene_name(), g->gold);
        /* 十字キーで 「まちへ もどる」を えらんで A でも おなじ。かーそるを 動かしても 戦闘は はじまらない */
        game_test_run_script(S_CH6_A4B);
        g->partyN = 1; g->party[0].hp = 1; g->gold = 600;
        for (int i = 0; i < 400 && !scene_is("gameover"); i++) press(PK_A);
        CHECK(scene_is("gameover"), "third defeat");
        press(PK_DOWN); press(PK_DOWN); press(PK_DOWN);   /* 0→1→0→1 */
        CHECK(scene_is("gameover"), "moving the cursor stays on the game over screen");
        press(PK_A);
        CHECK(scene_is("map") && g->gold == 300, "choose town with cursor: scene %s gold %d", game_scene_name(), g->gold);
        /* カーソルを 上下して もとの 「もういちど」に もどして A で 再戦 */
        game_test_run_script(S_CH6_A4B);
        g->partyN = 1; g->party[0].hp = 1; g->gold = 500;
        for (int i = 0; i < 400 && !scene_is("gameover"); i++) press(PK_A);
        press(PK_DOWN); press(PK_UP); press(PK_A);
        CHECK(scene_is("battle") && g->gold == 500, "cursor back to retry: scene %s gold %d", game_scene_name(), g->gold);
    }

    /* 5. 文字を 1文字ずつ 出す: 1回目の Aで ぜんぶ 出る・2回目で すすむ・音が なる */
    {
        SaveData *g = fresh_ch5_done(10); (void)g;
        game_set_typewriter(1);
        int blips0 = 0; for (int i = SFX_BLIP0; i <= SFX_BLIP6; i++) blips0 += host_sfx_count(i);
        game_test_run_script(S_CH6_INTRO);
        press(0);   /* 1フレームめ */
        CHECK(scene_is("script") && strstr(host_screen_text(), "洞くつが しずまりかえった。結晶の まん中から、青白い 光が ふわりと あふれだす。") == NULL, "text is partial at first");
        press(PK_A);
        CHECK(strstr(host_screen_text(), "あふれだす。") != NULL, "A shows all text");
        const char *before = host_screen_text(); (void)before;
        press(PK_A);
        CHECK(scene_is("script") && strstr(host_screen_text(), "洞くつが しずまりかえった。") == NULL, "second A goes to the next line");
        for (int i = 0; i < 300; i++) press(0);
        int blips1 = 0; for (int i = SFX_BLIP0; i <= SFX_BLIP6; i++) blips1 += host_sfx_count(i);
        CHECK(blips1 > blips0, "voice blips played (%d -> %d)", blips0, blips1);
        CHECK(host_sfx_count(SFX_SPARK) > 0, "spark sfx");
        /* Rを おしつづけると すぐ ぜんぶ */
        game_set_typewriter(0);
        game_test_reset_to_title();
    }

    /* 6. でたらめな ボタンで なんども はじめから ためす(止まらない・こわれない) */
    {
        unsigned rng = 4242; static unsigned keys[24000];
        static const unsigned pool[] = { PK_A, PK_A, PK_A, PK_B, PK_UP, PK_DOWN, PK_LEFT, PK_RIGHT, PK_X, PK_Y, PK_L, PK_R, PK_L | PK_UP, PK_R | PK_DOWN, 0, PK_A | PK_RIGHT, PK_SELECT, PK_START };
        for (int round = 0; round < 8; round++) {
            SaveData *g = fresh_ch5_done(10 + round * 5);
            game_set_testmode(round % 2 == 0);   /* ふつうの モードも ためす */
            game_set_typewriter(round % 3 != 0);
            game_test_run_script(S_CH6_INTRO);
            for (int i = 0; i < 24000; i++) { rng = rng * 1103515245u + 12345u; keys[i] = pool[(rng >> 16) % (sizeof(pool) / sizeof(pool[0]))]; }
            host_set_script(keys, 24000); host_set_max_frames(100000000);
            for (int i = 0; i < 24000; i++) {
                game_frame();
                if (g->gold < 0 || g->gold > 999999 || g->partyN < 1 || g->partyN > MAX_PARTY) break;
            }
            CHECK(g->gold >= 0 && g->gold <= 999999 && g->partyN >= 1 && g->partyN <= MAX_PARTY, "fuzz round %d invariants (gold %d partyN %d)", round, g->gold, g->partyN);
            check_party_valid(g, "fuzz");
            CHECK(g->ext.monN >= 0 && g->ext.monN <= MON_BOX && g->area >= 0 && g->area < AREA_COUNT, "fuzz round %d area/mon", round);
            for (int i = 0; i < ITEM_COUNT; i++) CHECK(g->items[i] >= 0, "fuzz item");
        }
        game_set_testmode(1); game_set_typewriter(0);
    }

    /* 7. 2Dアクション: ビームさがしで みつけた 入力を、本体の 画面で そのまま おして クリアできる */
    for (int st = 0; st < ACT_STAGE_COUNT; st++) {
        char path[64]; snprintf(path, sizeof(path), "build_host/act_solution_%d.txt", st);
        FILE *fp = fopen(path, "r");
        CHECK(fp != NULL, "solution file for stage %d missing (run test_action first)", st);
        if (!fp) continue;
        int n = 0; if (fscanf(fp, "%d", &n) != 1 || n <= 0 || n > 20000) { fclose(fp); CHECK(0, "bad solution file"); continue; }
        SaveData *g = fresh_ch5_done(30); int gold0 = g->gold;
        game_set_testmode(0);   /* ふつうの モード(とばす ボタンは 使えない) */
        game_test_start_action(st);
        CHECK(scene_is("act"), "action scene started: %s", game_scene_name());
        for (int i = 0; i < n; i++) {
            unsigned in = 0, v = 0; if (fscanf(fp, "%u", &v) != 1) break;
            in |= (v & AIN_LEFT) ? PK_LEFT : 0u; in |= (v & AIN_RIGHT) ? PK_RIGHT : 0u; in |= (v & AIN_JUMP) ? PK_A : 0u; in |= (v & AIN_DASH) ? PK_B : 0u; in |= (v & AIN_SWITCH) ? PK_X : 0u;
            press(in);
        }
        fclose(fp);
        for (int i = 0; i < 400 && scene_is("act"); i++) press(0);
        CHECK(!scene_is("act") && g->flags[F_ACT_CLIMB + st], "stage %d cleared in the real scene (scene %s, flag %d)", st, game_scene_name(), g->flags[F_ACT_CLIMB + st]);
        CHECK(game_test_act_deaths() == 0, "stage %d cleared without dying (%d)", st, game_test_act_deaths());
        CHECK(g->gold >= gold0 + 300, "stage %d reward gold %d -> %d", st, gold0, g->gold);
    }
    /* 8. ふつうの モードでは 3回 ミスするまで 「とばす」が 使えない。3回 ミスしたら とばせて、ごほうびは 出ない */
    {
        SaveData *g = fresh_ch5_done(30); int gold0 = g->gold;
        game_set_testmode(0);
        game_test_start_action(ACT_STAGE_CLIMB);
        for (int i = 0; i < 20; i++) press(PK_Y);
        CHECK(scene_is("act"), "skip is not allowed before 3 misses");
        for (int i = 0; i < 2000 && game_test_act_deaths() < 3; i++) press(PK_RIGHT);
        CHECK(game_test_act_deaths() >= 3, "died 3 times by running into the spikes (%d)", game_test_act_deaths());
        press(PK_Y);
        CHECK(!scene_is("act") && !g->flags[F_ACT_CLIMB] && g->gold == gold0, "skipped: no reward (scene %s)", game_scene_name());
        game_set_testmode(1);
    }

    /* 9. アスレチック場: 3つの コースが えらべる。あかりの 色(はい/いいえ/わからない の かず)には ふえない */
    for (int pick = 0; pick < 3; pick++) {
        SaveData *g = fresh_ch5_done(30);
        game_test_run_script(S_CH6_ATH);
        int cs = 0;
        for (int i = 0; i < 40 && !scene_is("choice"); i++) press(PK_A);
        CHECK(scene_is("choice"), "athletic: question shown (%s)", game_scene_name());
        for (int i = 0; i < pick; i++) press(PK_DOWN);
        press(PK_A);
        CHECK(scene_is("act"), "athletic pick %d starts an action stage (%s)", pick, game_scene_name());
        for (int i = 0; i < 6 && scene_is("act"); i++) press(PK_Y);
        for (int i = 0; i < 40 && !scene_is("map"); i++) press(PK_A);
        CHECK(scene_is("map"), "athletic ends on map (%s)", game_scene_name());
        CHECK(g->flags[F_CNT_YES] == 0 && g->flags[F_CNT_NO] == 0 && g->flags[F_CNT_UNS] == 0, "athletic does not change the light colors"); (void)cs;
        CHECK(!g->flags[F_CH6_BEGIN] && !g->flags[F_PATH_A], "athletic does not start chapter 6");
    }

    /* 10. ボイス: 声のつく せりふ(第5章おわり以降)には ぜんぶ ファイルが あり、よけいな ファイルも ない */
    {
        int need = 0, have = 0, files = 0;
        for (int s = 52; s < SCRIPT_COUNT; s++)
            for (int i = 0; i < SCRIPT_LEN[s]; i++) {
                const Step *st = &SCRIPTS[s][i];
                if (!(st->t == ST_LINE && st->who && st->who[0])) continue;
                need++;
                char p[96]; snprintf(p, sizeof(p), "romfs/voice/%d_%d.pcm", s, i);
                FILE *f = fopen(p, "rb");
                if (f) { fseek(f, 0, SEEK_END); long sz = ftell(f); fclose(f); have++; CHECK(sz >= 1500 && sz <= 300000, "voice %s size %ld", p, sz); }
                else CHECK(0, "voice file missing: %s (tools/make_voice.py を もういちど)", p);
            }
        DIR *d = opendir("romfs/voice");
        CHECK(d != NULL, "romfs/voice exists");
        if (d) { struct dirent *e; while ((e = readdir(d)) != NULL) { size_t n = strlen(e->d_name); if (n > 4 && strcmp(e->d_name + n - 4, ".pcm") == 0) files++; } closedir(d); }
        CHECK(have == need && files == need, "voice files: need %d have %d in folder %d", need, have, files);
        CHECK(host_voice_count() > 0, "voices were played during the routes (%d)", host_voice_count());
        /* ボイスを オフにすると ファイルが あっても 鳴らさない */
        int before = host_voice_count();
        plat_voice_enable(false);
        SaveData *g = fresh_ch5_done(10); (void)g;
        game_test_run_script(S_CH6_A1);
        for (int i = 0; i < 40; i++) press(PK_A);
        CHECK(host_voice_count() == before, "voice off: no voice played");
        plat_voice_enable(true);
    }

    /* 11. すべての スクリプトを 1つずつ とちゅうから はじめて、でたらめに おしても 止まらない・こわれない */
    {
        unsigned rng = 20261120; static unsigned keys[2500];
        static const unsigned pool[] = { PK_A, PK_A, PK_A, PK_B, PK_UP, PK_DOWN, PK_LEFT, PK_RIGHT, PK_X, PK_Y, PK_L, PK_R, 0, PK_A | PK_B, PK_L | PK_UP };
        for (int sid = 0; sid < SCRIPT_COUNT; sid++) {
            SaveData *g = fresh_ch5_done(12 + (sid % 4) * 20);
            game_set_testmode(sid % 2); game_set_typewriter(sid % 3 != 0);
            game_test_run_script(sid);
            for (int i = 0; i < 2500; i++) { rng = rng * 1103515245u + 12345u; keys[i] = pool[(rng >> 16) % (sizeof(pool) / sizeof(pool[0]))]; }
            host_set_script(keys, 2500); host_set_max_frames(100000000);
            for (int i = 0; i < 2500; i++) game_frame();
            CHECK(g->gold >= 0 && g->gold <= 999999 && g->partyN >= 1 && g->partyN <= MAX_PARTY, "script %d: gold %d partyN %d", sid, g->gold, g->partyN);
            CHECK(g->area >= 0 && g->area < AREA_COUNT && g->ext.monN >= 0 && g->ext.monN <= MON_BOX, "script %d: area/mon", sid);
            check_party_valid(g, "all-scripts");
        }
        game_set_testmode(1); game_set_typewriter(0);
    }

    /* 12. Update31までの セーブ(第5章を おえて 第6章の フラグが ない)を よみこむと、第6章を はじめられる */
    {
        SaveData *g = fresh_ch5_done(20);
        g->flags[F_CH6_READY] = 0; g->flags[F_CH6_BEGIN] = 0; g->flags[F_CH6_END] = 0;
        CHECK(game_save(), "old-style save written");
        game_init();
        CHECK(game_load() && game_data()->flags[F_CH6_READY] == 1, "old save gets F_CH6_READY on load");
        /* もう すすめて いる セーブには よけいな ことを しない */
        g = game_data(); g->flags[F_CH6_BEGIN] = 1; g->flags[F_CH6_READY] = 0;
        CHECK(game_save(), "save 2");
        game_init();
        CHECK(game_load() && game_data()->flags[F_CH6_READY] == 0, "in-progress save is left alone");
        /* 第5章の まえの セーブも そのまま */
        g = game_data(); g->flags[F_CH5_DONE] = 0; g->flags[F_CH6_BEGIN] = 0;
        CHECK(game_save(), "save 3");
        game_init();
        CHECK(game_load() && game_data()->flags[F_CH6_READY] == 0, "pre-chapter-5 save is left alone");
    }

    /* 13. ひらめきの 選択肢は まいかい ランダム: 正解の 位置が 3つとも 出て、かたよらない。どの 位置でも 正解を えらべば すすめる */
    {
        SaveData *g = fresh_ch5_done(20); int pos[3] = { 0, 0, 0 };
        for (int trial = 0; trial < 240; trial++) {
            game_seed(5000u + (unsigned)trial * 7u);
            game_test_run_script(S_CH6_C1);
            for (int i = 0; i < 60 && !scene_is("deduct"); i++) press(PK_A);
            CHECK(scene_is("deduct"), "trial %d: reached the deduction (%s)", trial, game_scene_name());
            if (!scene_is("deduct")) break;
            int ans = game_test_deduct_answer(); pos[ans]++;
            for (int i = 0; i < ans; i++) press(PK_DOWN);
            press(PK_A);   /* 正解 */
            CHECK(strstr(host_screen_text(), "ひらめき") != NULL, "trial %d: correct answer accepted (answer at %d)", trial, ans);
            press(PK_A);
            game_test_reset_to_title();   /* つぎの 試行は あたらしい 場面から */
            g->area = AREA_CAVE; g->px = 3; g->py = 7;
        }
        CHECK(pos[0] > 40 && pos[1] > 40 && pos[2] > 40, "answer position is spread: %d/%d/%d", pos[0], pos[1], pos[2]);
        CHECK(pos[1] < 160, "answer is not stuck in the middle: %d/%d/%d", pos[0], pos[1], pos[2]);
    }
    remove("test_story_save.dat");
    printf("story: %d checks, %d failed\n", checks, fails);
    return fails != 0;
}
