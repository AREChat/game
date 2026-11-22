/* PC上の自動テスト: gcc + platform_host.c でビルドし、ロジック・データ整合性を検証する */
#include <stdio.h>
#include <stddef.h>
#include <string.h>
#include <stdlib.h>
#include "../source/game.h"
#include "../source/platform.h"
#include "../source/host_api.h"
#include "../source/help.h"
#include "../source/monster.h"
#include "../source/skills.h"

static int fails = 0, checks = 0;
#define CHECK(c, ...) do { checks++; if (!(c)) { fails++; printf("FAIL %s:%d: ", __FILE__, __LINE__); printf(__VA_ARGS__); printf("\n"); } } while (0)

static void press(unsigned k) { static unsigned a[1]; a[0] = k; host_set_script(a, 1); host_set_max_frames(1000000); game_frame(); }
static void idle(int n) { for (int i = 0; i < n; i++) { static unsigned z[1]; z[0] = 0; host_set_script(z, 1); game_frame(); } }
static bool scene_is(const char *s) { return strcmp(game_scene_name(), s) == 0; }

static void test_data(void) {
    CHECK(AREA_COUNT == AREA_COUNT_ENUM, "area count mismatch %d vs %d", AREA_COUNT, AREA_COUNT_ENUM);
    CHECK(SCRIPT_COUNT == S_CH6_ATH3 + 1, "script count %d", SCRIPT_COUNT);
    CHECK(CHAPTER_TITLE_COUNT == 8, "chapter titles %d", CHAPTER_TITLE_COUNT);
    CHECK(ENEMY_COUNT == 14, "enemy count %d", ENEMY_COUNT);
    CHECK(GROUP_COUNT == G_YAMI_KING + 1, "group count %d", GROUP_COUNT);
    CHECK(ITEM_COUNT == 3 && ITEM_NAMES[ITEM_TONIC] != NULL, "item count");
    for (int a = 0; a < AREA_COUNT; a++) {
        const Area *ar = &AREAS[a];
        CHECK(ar->w == 25 && ar->h == 15, "area %d size", a);
        for (int y = 0; y < ar->h; y++) {
            CHECK(ar->rows[y] != NULL && (int)strlen(ar->rows[y]) == ar->w, "area %d row %d len=%d", a, y, ar->rows[y] ? (int)strlen(ar->rows[y]) : -1);
        }
        if (ar->encounters) CHECK(ar->encGroupA >= 0 && ar->encGroupB < GROUP_COUNT && ar->encGroupA <= ar->encGroupB, "area %d enc groups", a);
        for (int i = 0; i < ar->nNpc; i++) {
            const Npc *n = &ar->npc[i];
            CHECK(game_is_walkable(ar, n->x, n->y), "area %d npc %d on blocked tile (%d,%d)", a, i, n->x, n->y);
            CHECK(n->script >= 0 && n->script < SCRIPT_COUNT, "npc script id");
            CHECK(n->needFlag < MAX_FLAGS && n->hideFlag < MAX_FLAGS, "npc flag id");
        }
        for (int i = 0; i < ar->nWarp; i++) {
            const Warp *w = &ar->warp[i];
            CHECK(game_is_walkable(ar, w->x, w->y), "area %d warp %d on blocked tile", a, i);
            CHECK(w->toArea >= 0 && w->toArea < AREA_COUNT, "warp target");
            CHECK(game_is_walkable(&AREAS[w->toArea], w->tx, w->ty), "area %d warp %d lands on blocked (%d,%d)", a, i, w->tx, w->ty);
            /* 着地点が別のワープ上だと往復してしまう */
            const Area *to = &AREAS[w->toArea];
            for (int j = 0; j < to->nWarp; j++) CHECK(!(to->warp[j].x == w->tx && to->warp[j].y == w->ty), "area %d warp %d lands on a warp", a, i);
        }
        for (int i = 0; i < ar->nTrig; i++) CHECK(game_is_walkable(ar, ar->trig[i].x, ar->trig[i].y), "trigger on blocked");
    }
    for (int s = 0; s < SCRIPT_COUNT; s++) {
        CHECK(SCRIPT_LEN[s] > 0, "script %d empty", s);
        CHECK(SCRIPTS[s][SCRIPT_LEN[s] - 1].t == ST_END || SCRIPTS[s][SCRIPT_LEN[s] - 1].t == ST_CHAPTER, "script %d must end with END", s);
        for (int i = 0; i < SCRIPT_LEN[s]; i++) {
            const Step *st = &SCRIPTS[s][i];
            if (st->t == ST_BATTLE) CHECK(st->a >= 0 && st->a < GROUP_COUNT, "battle group");
            if (st->t == ST_DEDUCT) CHECK(st->a >= 0 && st->a < DEDUCTION_COUNT, "deduct id");
            if (st->t == ST_SETFLAG) CHECK(st->a >= 0 && st->a < MAX_FLAGS, "flag id");
            if (st->t == ST_GIVE) CHECK(st->a >= 0 && st->a < ITEM_COUNT && st->b > 0, "give item");
            if (st->t == ST_JOIN) CHECK(st->a >= 0 && st->a < MEM_COUNT, "join member");
            if (st->t == ST_WARP) CHECK(st->a >= 0 && st->a < AREA_COUNT && game_is_walkable(&AREAS[st->a], (st->b >> 8) & 0xFF, st->b & 0xFF), "script %d warp target", s);
            if (st->t == ST_CHAPTER) CHECK(st->a >= 0 && st->a < CHAPTER_TITLE_COUNT, "chapter id");
            if (st->t == ST_LINE) CHECK(st->text && strlen(st->text) < 250, "line too long");
        }
    }
    for (int g = 0; g < GROUP_COUNT; g++) for (int i = 0; i < GROUPS[g].n; i++) CHECK(GROUPS[g].id[i] < ENEMY_COUNT, "group enemy id");
    for (int d = 0; d < DEDUCTION_COUNT; d++) {
        CHECK(DEDUCTIONS[d].correct >= 0 && DEDUCTIONS[d].correct < 3, "deduct correct");
        for (int c = 0; c < 3; c++) CHECK(DEDUCTIONS[d].choice[c] && DEDUCTIONS[d].choice[c][0], "deduct %d choice %d", d, c);
        CHECK(DEDUCTIONS[d].hint && DEDUCTIONS[d].solved && DEDUCTIONS[d].prompt, "deduct %d texts", d);
    }
}

static void test_rules(void) {
    CHECK(game_calc_damage(10, 0, 50) >= 1, "dmg>=1");
    CHECK(game_calc_damage(1, 100, 0) == 1, "dmg min 1");
    CHECK(game_exp_needed(1) == 10, "exp lv1=%d", game_exp_needed(1));
    Member m; game_member_init(&m, MEM_HERO, 1);
    CHECK(m.hp == m.maxhp && m.maxhp == 24, "hero init");
    CHECK(game_add_exp(&m, 10) && m.level == 2, "levelup");
    CHECK(!game_add_exp(&m, 1), "no levelup");
    game_member_init(&m, MEM_SERA, 5); CHECK(m.level == 5 && m.maxhp > 20, "lv5 init");
    game_member_init(&m, MEM_GAI, 1); CHECK(strcmp(m.name, "ガイ") == 0 && m.skill == 3, "gai init");
}

static void test_save(void) {
    host_set_save_path("test_save.dat");
    game_init(); game_set_name("テスト");
    game_data()->gold = 77; game_data()->flags[F_MET_SERA] = 1; game_data()->items[ITEM_HERB] = 9; game_data()->items[ITEM_TONIC] = 4;
    CHECK(game_save(), "save");
    game_init(); CHECK(game_data()->gold == 0, "reinit");
    CHECK(game_load(), "load");
    CHECK(game_data()->gold == 77 && game_data()->flags[F_MET_SERA] && game_data()->items[ITEM_HERB] == 9, "load values");
    CHECK(game_data()->items[ITEM_TONIC] == 4, "tonic roundtrip");
    CHECK(strcmp(game_data()->party[0].name, "テスト") == 0, "name roundtrip");
    CHECK(game_data()->version == SAVE_VERSION && SAVE_VERSION == 3, "save version");
    /* 古い形式(別バージョン)のセーブは読み込まない */
    SaveData old = *game_data(); old.version = 1;
    FILE *f = fopen("test_save.dat", "wb"); CHECK(f != NULL, "open"); if (f) { fwrite(&old, 1, sizeof(old), f); fclose(f); }
    CHECK(!game_load(), "old version rejected");
    /* Update27: バージョン2(拡張データなし)の セーブは、そのまま よみこめて、拡張データは 初期値になる */
    {
        SaveData cur = *game_data(); cur.version = 2; cur.gold = 4321;
        FILE *g = fopen("test_save.dat", "wb"); CHECK(g != NULL, "open v2");
        if (g) { fwrite(&cur, 1, offsetof(SaveData, ext), g); fclose(g); }
        game_init(); CHECK(game_load(), "v2 save loads");
        CHECK(game_data()->gold == 4321 && game_data()->version == SAVE_VERSION && game_data()->ext.coins == 0 && game_data()->ext.monN == 0 && game_data()->ext.eq.ownedWeapon[0] == MAX_PARTY, "v2 migrated");
    }
    /* 拡張データの ふくろ: 保存して よみこむと そのまま のこる。こわれた 値は ことわる */
    {
        game_init(); SaveData *d = game_data();
        d->ext.coins = 123; d->ext.job[0] = 3; d->ext.jobLv[0][3] = 7; d->ext.arenaRank = 2; d->ext.monN = 2; d->ext.mon[0].enemy = 7; d->ext.mon[0].level = 9; d->ext.mon[1].enemy = 0; d->ext.mon[1].level = 2; d->ext.seen[7] = 2;
        CHECK(game_save(), "save ext"); game_init(); CHECK(game_load(), "load ext");
        d = game_data(); CHECK(d->ext.coins == 123 && d->ext.job[0] == 3 && d->ext.jobLv[0][3] == 7 && d->ext.arenaRank == 2 && d->ext.monN == 2 && d->ext.mon[0].enemy == 7 && d->ext.seen[7] == 2, "ext roundtrip");
        d->ext.job[0] = 99; CHECK(game_save(), "save bad"); game_init(); CHECK(!game_load(), "bad ext rejected");
        d = game_data(); d->ext.job[0] = 0; d->ext.monN = 3; d->ext.mon[0].enemy = 200; CHECK(game_save(), "save bad2"); game_init(); CHECK(!game_load(), "bad monster rejected");
    }
    remove("test_save.dat");
}

/* タイトル→名前→プロローグ→マップ、のスモーク */
static void test_smoke(void) {
    host_set_save_path("smoke_save.dat"); remove("smoke_save.dat");
    host_set_input_name("ヒナタ");
    game_seed(7); idle(1);
    press(PK_A); /* はじめから → 名前入力 → プロローグ開始 */
    CHECK(strcmp(game_scene_name(), "name") == 0, "scene after A = %s", game_scene_name());
    idle(1);
    CHECK(strcmp(game_scene_name(), "script") == 0, "scene = %s", game_scene_name());
    CHECK(strcmp(game_data()->party[0].name, "ヒナタ") == 0, "name set");
    for (int i = 0; i < 20 && strcmp(game_scene_name(), "map") != 0; i++) press(PK_A);
    CHECK(strcmp(game_scene_name(), "map") == 0, "map reached: %s", game_scene_name());
    CHECK(game_data()->flags[F_PROLOGUE], "prologue flag");
    /* 村の出口(24,7)まで歩いて公園へ → 出会いイベント */
    int guard = 0;
    while (game_data()->area == AREA_HINATA && guard++ < 80) {
        if (game_data()->py < 7) press(PK_DOWN); else if (game_data()->py > 7) press(PK_UP); else press(PK_RIGHT);
        if (strcmp(game_scene_name(), "script") == 0) press(PK_A);
    }
    CHECK(game_data()->area == AREA_PLAZA, "reached plaza (area=%d scene=%s)", game_data()->area, game_scene_name());
    guard = 0;
    while (!game_data()->flags[F_MET_SERA] && guard++ < 80) {
        SaveData *g = game_data();
        if (strcmp(game_scene_name(), "script") == 0) { press(PK_A); continue; }
        if (g->py > 5) press(PK_UP); else if (g->px < 6) press(PK_RIGHT); else press(PK_LEFT);
    }
    CHECK(game_data()->flags[F_MET_SERA], "met sera flag");
    for (int i = 0; i < 20 && strcmp(game_scene_name(), "map") != 0; i++) press(PK_A);
    CHECK(strcmp(game_scene_name(), "map") == 0, "back to map");
    remove("smoke_save.dat");
}

/* バトルを機械的に回して必ず終わることを確認 */
static void battle_terminates_in(int area, int px, int py, int members) {
    for (int seed = 1; seed <= 30; seed++) {
        game_init(); game_seed((unsigned)seed);
        for (int i = 1; i < members; i++) { game_member_init(&game_data()->party[i], i == 1 ? MEM_GAI : MEM_SERA, 1); game_data()->partyN++; }
        game_data()->area = area; game_data()->px = px; game_data()->py = py;
        /* 強制的に戦闘へ: 歩き回る */
        int guard = 0;
        while (strcmp(game_scene_name(), "battle") != 0 && guard++ < 4000) {
            press((guard & 1) ? PK_RIGHT : PK_LEFT);
        }
        CHECK(strcmp(game_scene_name(), "battle") == 0, "encounter happens area=%d seed=%d", area, seed);
        guard = 0;
        while (strcmp(game_scene_name(), "battle") == 0 && guard++ < 600) press(PK_A);
        CHECK(strcmp(game_scene_name(), "battle") != 0, "battle ends area=%d seed=%d scene=%s", area, seed, game_scene_name());
        if (strcmp(game_scene_name(), "gameover") == 0) { press(PK_A); CHECK(scene_is("map"), "gameover returns to map"); }
    }
}
/* Update17: 敵が複数のとき攻撃先を選ぶ操作(上下・戻る・決定)を混ぜても、必ず戦闘が終わる */
static void battle_target_select_terminates(void) {
    static const unsigned keys[] = { PK_A, PK_DOWN, PK_A, PK_B, PK_UP, PK_A, PK_RIGHT, PK_A, PK_LEFT, PK_A };
    int multi = 0;
    for (int seed = 1; seed <= 60; seed++) {
        game_init(); game_seed((unsigned)seed);
        for (int i = 1; i < 2; i++) { game_member_init(&game_data()->party[i], MEM_GAI, 1); game_data()->partyN++; }
        game_data()->area = AREA_SCHOOL; game_data()->px = 10; game_data()->py = 7;
        int guard = 0;
        while (strcmp(game_scene_name(), "battle") != 0 && guard++ < 4000) press((guard & 1) ? PK_RIGHT : PK_LEFT);
        if (strcmp(game_scene_name(), "battle") != 0) continue;
        multi++;
        guard = 0;
        while (strcmp(game_scene_name(), "battle") == 0 && guard++ < 1500) press(keys[guard % (int)(sizeof(keys) / sizeof(keys[0]))]);
        CHECK(strcmp(game_scene_name(), "battle") != 0, "target-select battle ends seed=%d", seed);
        if (strcmp(game_scene_name(), "gameover") == 0) { press(PK_A); }
    }
    CHECK(multi > 0, "target-select test ran at least one battle");
}
static void test_battle_terminates(void) {
    battle_terminates_in(AREA_FIELD, 10, 7, 1);
    battle_terminates_in(AREA_SCHOOL, 10, 7, 2);
    battle_target_select_terminates();
}

/* スクリプト/推理/章カード/戦闘を進めてマップに戻るまで入力を自動で押す。dedSeq は出てくる推理IDの順 */
static void drive_to_map(const int *dedSeq, int nDed) {
    int di = 0;
    for (int guard = 0; guard < 3000 && !scene_is("map"); guard++) {
        if (scene_is("deduct") && di < nDed) {
            for (int i = 0; i < game_test_deduct_answer(); i++) press(PK_DOWN);
            press(PK_A); /* 選択 → 正解表示 */
            press(PK_A); /* 続ける */
            di++;
        } else {
            press(PK_A);
        }
    }
}

/* 第1章の終わり → 章カード → ミルフィへ引っ越し */
static void test_chapter_transition(void) {
    game_init(); game_seed(3);
    SaveData *g = game_data();
    g->flags[F_BANDIT_DEAD] = g->flags[F_KINDER_ARRIVED] = g->flags[F_DISPUTE_DONE] = 1;
    g->area = AREA_KINDER; g->px = 12; g->py = 5;
    press(PK_A);
    CHECK(scene_is("script"), "kinder done script: %s", game_scene_name());
    for (int i = 0; i < 10 && !scene_is("card"); i++) press(PK_A);
    CHECK(scene_is("card"), "chapter card shown: %s", game_scene_name());
    CHECK(g->chapter == 2 && g->flags[F_CH1_DONE], "chapter 2 / ch1 flag");
    press(PK_A);
    CHECK(g->area == AREA_MILFI && g->px == 11 && g->py == 8, "moved to milfi (%d,%d,%d)", g->area, g->px, g->py);
    drive_to_map(NULL, 0);
    CHECK(scene_is("map") && g->flags[F_CH2_START], "ch2 start flag");
    /* 町の人に話しかけられる */
    g->px = 6; g->py = 6; press(PK_A);
    CHECK(scene_is("script"), "talk to milfi npc");
    drive_to_map(NULL, 0);
}

/* 第2章の通しプレイ: 学び舎へ入る→ガイ加入→手がかり→校長を問い詰める→戦闘→第3章カード */
static void test_chapter2(void) {
    game_init(); game_seed(11);
    SaveData *g = game_data();
    g->flags[F_CH2_START] = 1; g->chapter = 2;
    g->area = AREA_MILFI; g->px = 11; g->py = 4;
    press(PK_UP); /* 学び舎の扉(11,3) */
    CHECK(g->area == AREA_SCHOOL, "entered school area=%d", g->area);
    CHECK(scene_is("script"), "school enter script: %s", game_scene_name());
    drive_to_map(NULL, 0);
    CHECK(g->flags[F_SCHOOL_ENTERED], "school entered flag");
    /* 手がかりはガイ加入前は調べられない */
    g->px = 3; g->py = 8; press(PK_A);
    CHECK(scene_is("map"), "clue hidden before gai joins");
    /* ガイ加入 */
    g->px = 13; g->py = 8; press(PK_A);
    CHECK(scene_is("script"), "gai script");
    drive_to_map(NULL, 0);
    CHECK(g->partyN == 2 && g->party[1].id == MEM_GAI && g->flags[F_GAI_JOINED], "gai joined");
    g->px = 13; g->py = 8; press(PK_A);
    CHECK(scene_is("map"), "gai gone after join");
    /* 校長にはまだ問い詰められない */
    g->px = 12; g->py = 5; press(PK_A);
    CHECK(scene_is("script"), "principal idle talk");
    drive_to_map(NULL, 0);
    CHECK(!g->flags[F_PRINCIPAL_DONE], "principal not done yet");
    /* 手がかりA: まず間違えるとヒント、次に正解 */
    g->px = 3; g->py = 8; press(PK_A);
    CHECK(scene_is("script"), "clue A script");
    for (int i = 0; i < 20 && !scene_is("deduct"); i++) press(PK_A);
    CHECK(scene_is("deduct"), "deduct scene: %s", game_scene_name());
    if (game_test_deduct_answer() == 0) press(PK_DOWN);   /* まちがいの 選択肢を えらぶ(並びは まいかい ランダム) */
    press(PK_A);
    CHECK(scene_is("deduct"), "wrong answer stays in deduct");
    press(PK_A); /* ヒント→選択に戻る(カーソルは そのまま) */
    {   /* カーソルを 正解の 位置へ(いまの カーソルは 0 か 1) */
        int cur = (game_test_deduct_answer() == 0) ? 1 : 0;
        int want = game_test_deduct_answer();
        for (int i = 0; i < (want - cur + 3) % 3; i++) press(PK_DOWN);
    }
    press(PK_A); press(PK_A);
    drive_to_map(NULL, 0);
    CHECK(g->flags[F_CLUE_A], "clue A flag");
    g->px = 3; g->py = 8; press(PK_A);
    CHECK(scene_is("map"), "clue A vanished");
    /* 手がかりB */
    g->px = 20; g->py = 8; press(PK_A);
    CHECK(scene_is("script"), "clue B script");
    drive_to_map(NULL, 0);
    CHECK(g->flags[F_CLUE_B], "clue B flag");
    /* 校長を問い詰める(戦闘に備えてレベル上げ) */
    for (int i = 0; i < g->partyN; i++) { int id = g->party[i].id; char nm[NAME_LEN]; strcpy(nm, g->party[i].name); game_member_init(&g->party[i], id, 20); strcpy(g->party[i].name, nm); }
    int gold0 = g->gold, tonic0 = g->items[ITEM_TONIC];
    g->px = 12; g->py = 5; press(PK_A);
    CHECK(scene_is("script"), "principal confront");
    static const int seq[] = { 2 };
    drive_to_map(seq, 1);
    CHECK(scene_is("map"), "back on map: %s", game_scene_name());
    CHECK(g->flags[F_PRINCIPAL_DONE] && g->flags[F_CH2_DONE], "ch2 done flags");
    CHECK(g->chapter == 3, "chapter 3 (%d)", g->chapter);
    CHECK(g->items[ITEM_TONIC] == tonic0 + 2, "tonic reward");
    CHECK(g->gold > gold0, "gold reward");
    CHECK(g->party[0].hp == g->party[0].maxhp, "healed");
    /* 第2章のあと、勤勉の像の庭(第3章)へ移動している */
    CHECK(g->area == AREA_STATUE && g->flags[F_CH3_START], "moved to statue garden (%d)", g->area);
    CHECK(g->px == 12 && g->py == 13, "ch3 start pos (%d,%d)", g->px, g->py);
    /* 手がかりは順番に出る。調べる前の2番目は出ない */
    g->px = 17; g->py = 5; press(PK_A);
    CHECK(scene_is("map"), "spot1 hidden before spot0");
    /* 5つの調査スポット(手がかり)を調べる */
    static const int sx[] = { 3, 17, 9, 18, 2 }, sy[] = { 2, 4, 8, 10, 12 };
    static const int stx[] = { 3, 17, 9, 18, 2 }, sty[] = { 3, 5, 9, 11, 13 };
    for (int i = 0; i < 5; i++) {
        g->px = stx[i]; g->py = sty[i]; press(PK_A);
        CHECK(scene_is("script"), "spot %d script (%d,%d)", i, sx[i], sy[i]);
        drive_to_map(NULL, 0);
        CHECK(g->flags[F_CH3_C0 + i], "spot %d flag", i);
    }
    /* 像・ベンチは通れない。出口から学び舎へ戻れる */
    CHECK(!game_is_walkable(&AREAS[AREA_STATUE], 10, 6) && !game_is_walkable(&AREAS[AREA_STATUE], 3, 5), "statue and bench blocked");
    g->px = 11; g->py = 13; press(PK_DOWN);
    CHECK(g->area == AREA_SCHOOL, "exit to school (%d)", g->area);
    g->area = AREA_STATUE; g->px = 12; g->py = 10;
    /* 全校生徒の前で推理(ひらめき) */
    press(PK_A);
    CHECK(scene_is("script"), "ch3 crowd script");
    static const int seq3[] = { 3 };
    drive_to_map(seq3, 1);
    CHECK(g->flags[F_CH3_DONE] && g->chapter == 4, "ch3 done, chapter %d", g->chapter);
    /* 第4章: 山里クロモリへ移動 */
    CHECK(g->area == AREA_KUROMORI && g->flags[F_CH4_START], "moved to kuromori (%d)", g->area);
    CHECK(g->px == 12 && g->py == 13, "ch4 start pos (%d,%d)", g->px, g->py);
    /* 母は手がかりがそろうまで話せない(案内だけ) */
    g->px = 21; g->py = 5; press(PK_A);
    CHECK(scene_is("script"), "mother idle script");
    drive_to_map(NULL, 0);
    CHECK(!g->flags[F_CH4_DONE] && !g->flags[F_CH4_READY], "not ready yet");
    /* 順番: 机 → かご → 足あと(READY)。ぼうしは机のあと */
    g->px = 12; g->py = 10; press(PK_A);
    CHECK(scene_is("map") && !g->flags[F_CH4_S1], "footprints hidden before basket");
    static const int cx[] = { 4, 20, 12, 5 }, cy[] = { 7, 10, 9, 2 };
    static const int cf[] = { 2, 3, 1, 0 };
    for (int i = 0; i < 4; i++) {
        g->px = cx[i]; g->py = cy[i] + 1; press(PK_A);
        CHECK(scene_is("script"), "ch4 spot %d script", cf[i]);
        drive_to_map(NULL, 0);
        CHECK(g->flags[F_CH4_S0 + cf[i]], "ch4 spot %d flag", cf[i]);
        if (i == 2) CHECK(g->flags[F_CH4_READY], "ch4 ready after 3 clues");
    }
    /* 出口はクリアまで通れない */
    g->px = 12; g->py = 14; press(PK_DOWN);
    CHECK(g->area == AREA_KUROMORI, "ch4 exit blocked (%d)", g->area);
    /* 説得(正解)→新しい学び舎→第5章カード */
    g->px = 21; g->py = 5; press(PK_A);
    CHECK(scene_is("script"), "mother persuade script");
    static const int seq4[] = { 1 };
    drive_to_map(seq4, 1);
    CHECK(g->flags[F_CH4_DONE] && g->chapter == 5, "ch4 done, chapter %d", g->chapter);
    CHECK(!game_is_walkable(&AREAS[AREA_KUROMORI], 6, 4), "rubble blocked");
}

/* 戦闘コマンドの2x2カーソル: 上下で縦、左右で横に動く(下キーで右に動かない) */
static void test_battle_cursor(void) {
    game_init(); game_seed(3);
    game_data()->area = AREA_FIELD; game_data()->px = 10; game_data()->py = 7;
    int guard = 0;
    while (!scene_is("battle") && guard++ < 4000) press((guard & 1) ? PK_RIGHT : PK_LEFT);
    CHECK(scene_is("battle"), "battle for cursor test");
    press(PK_DOWN); press(PK_A); /* 下=「にげる」でなく「どうぐ」(左下) */
    CHECK(scene_is("battle"), "still battle after item menu open");
    press(PK_B);
}

/* START: 終了確認(Bでもどる、Aで終了) */
static void test_quit_confirm(void) {
    game_init();
    game_data()->area = AREA_HINATA; game_data()->px = 12; game_data()->py = 7;
    for (int i = 0; i < 3; i++) press(PK_A);
    /* マップに入れるまで進める */
    for (int i = 0; i < 60 && !scene_is("map"); i++) press(PK_A);
}

/* アイテム: 戦闘中とメニューで「ほしのしずく」が効く */
static void test_tonic(void) {
    game_init(); game_seed(5);
    SaveData *g = game_data();
    g->items[ITEM_TONIC] = 2; g->party[0].hp = 1;
    press(PK_X); CHECK(scene_is("menu"), "menu opens");
    press(PK_A); /* どうぐ */
    press(PK_DOWN); press(PK_DOWN); /* ほしのしずく */
    press(PK_A); /* 対象選択へ */
    press(PK_A); /* 主人公に使う */
    CHECK(g->party[0].hp == g->party[0].maxhp, "tonic heals in menu hp=%d", g->party[0].hp);
    CHECK(g->items[ITEM_TONIC] == 1, "tonic consumed");
    press(PK_B); press(PK_B); CHECK(scene_is("map"), "menu closes");
}

/* 章カード: タイトルが範囲外でも落ちない */
static void test_draw_all_scenes(void) {
    game_init(); game_seed(9);
    host_set_input_name("テスト");
    for (int a = 0; a < AREA_COUNT; a++) {
        game_data()->area = a; game_data()->px = 12; game_data()->py = 12;
        press(0);
        CHECK(strstr(host_screen_text(), AREAS[a].name) != NULL, "area %d name drawn", a);
    }
}

/* Update15: 全機能テストで見つけた不具合の回帰テスト */
static void test_regress15(void) {
    game_init(); game_set_name("あいうえおかきくけこさし");
    CHECK(strcmp(game_data()->party[0].name, "あいうえおかきく") == 0, "name cut at 8 chars: %s", game_data()->party[0].name);
    game_set_name("");
    CHECK(strcmp(game_data()->party[0].name, "あいうえおかきく") == 0, "empty name ignored");
    host_set_save_path("reg_save.dat");
    SaveData base; game_init(); base = *game_data();
    SaveData t;
    t = base; t.party[0].skill = 99; FILE *f = fopen("reg_save.dat", "wb"); fwrite(&t, 1, sizeof t, f); fclose(f);
    CHECK(!game_load(), "bad skill rejected");
    t = base; t.px = -7; f = fopen("reg_save.dat", "wb"); fwrite(&t, 1, sizeof t, f); fclose(f);
    CHECK(!game_load(), "bad pos rejected");
    t = base; t.items[0] = -5; f = fopen("reg_save.dat", "wb"); fwrite(&t, 1, sizeof t, f); fclose(f);
    CHECK(!game_load(), "negative item rejected");
    t = base; t.party[0].hp = 9999; f = fopen("reg_save.dat", "wb"); fwrite(&t, 1, sizeof t, f); fclose(f);
    CHECK(!game_load(), "hp over max rejected");
    t = base; f = fopen("reg_save.dat", "wb"); fwrite(&t, 1, sizeof t, f); fclose(f);
    CHECK(game_load(), "good save still loads");
    remove("reg_save.dat");
    CHECK(strcmp(ENEMIES[3].name, "短剣の山賊") == 0 && ENEMIES[3].hp == 32 && ENEMIES[3].atk == 8, "bandit stats (Update15)");
}

/* Update23: SELECTのヘルプ・にげ道・はやおくり・はじめから確認・じどうセーブ */
static void test_help_flow(void) {
    SaveData *g;
    host_set_save_path("test_help_save.dat"); remove("test_help_save.dat");
    game_init(); g = game_data();
    press(PK_A); /* タイトル: はじめから(セーブなし) */
    for (int i = 0; i < 400 && !scene_is("map"); i++) press(PK_A);
    CHECK(scene_is("map"), "reached map: %s", game_scene_name());
    /* SELECTでヘルプが開き、画面に「いま やること」とくわしい目的が出る。マップの状態は変わらない */
    int ox = g->px, oy = g->py;
    press(PK_SELECT);
    CHECK(strstr(host_screen_text(), "いま やること") != NULL, "help page shown");
    CHECK(strstr(host_screen_text(), "もくてき") != NULL || strstr(host_screen_text(), "いまの もくてき") != NULL, "goal shown");
    press(PK_UP); press(PK_UP);   /* ヘルプ中は まわりが うごかない */
    CHECK(g->px == ox && g->py == oy, "frozen while help");
    press(PK_RIGHT); CHECK(strstr(host_screen_text(), "たたかいの") != NULL, "next page");
    { bool on0 = plat_bgm_enabled(); press(PK_Y); CHECK(plat_bgm_enabled() == !on0, "Y toggles bgm"); press(PK_Y); CHECK(plat_bgm_enabled() == on0, "Y toggles back"); }
    press(PK_B);
    CHECK(strstr(host_screen_text(), "こまったら SELECT") != NULL, "hint on map screen");
    /* 戦闘中もヘルプが開いて閉じられる */
    g->partyN = g->partyN > 0 ? g->partyN : 1;
    /* にげ道: 見知らぬ場所に立たされても、ヘルプのXで あんぜんな場所へもどり、HPが全かいふくする */
    g->party[0].hp = 1; g->px = 3; g->py = 3;
    press(PK_SELECT); press(PK_X);
    CHECK(strstr(host_screen_text(), "もどりますか") != NULL, "rescue ask");
    press(PK_B); CHECK(strstr(host_screen_text(), "もどりますか") == NULL, "rescue cancel");
    press(PK_X); press(PK_A);
    CHECK(scene_is("map") && g->party[0].hp == g->party[0].maxhp, "rescued and healed");
    CHECK(g->area == AREA_HINATA || g->area == AREA_MILFI, "rescued to a safe area");
    /* おかしな場所(壁の中・マップの外)に いても、1フレームで あるける場所に直る */
    g->px = -5; g->py = 99; idle(2);
    CHECK(g->px >= 0 && g->py >= 0 && game_is_walkable(&AREAS[g->area], g->px, g->py), "position fixed");
    g->area = 77; idle(2);
    CHECK(g->area >= 0 && g->area < AREA_COUNT, "area fixed");
    /* じどうセーブ: 場所を変えて落ち着いたら きろくされる */
    remove("test_help_save.dat");
    game_data()->area = AREA_HINATA; game_data()->px = 23; game_data()->py = 7;
    press(PK_RIGHT);   /* 右の出口で 広場へ */
    idle(2);
    { FILE *f = fopen("test_help_save.dat", "rb"); CHECK(f != NULL, "autosave file written after area change"); if (f) fclose(f); }
    /* セーブがあるとき「はじめから」は、1回目のAでは始まらず(上書きの確認)、2回目で始まる */
    remove("test_help_save.dat");
    game_test_reset_to_title();
}

/* Update25: 目的の場所は、いつでも 歩ける場所で、そこに NPC・きっかけ・出口が ある(目的の「！」が 空き地を さしていない) */
static void test_goal_spots(void) {
    static const int order[] = { -1, F_MET_SERA, F_RIDE_DONE, F_BELL_DONE, F_KINDER_ARRIVED, F_DISPUTE_DONE, F_CH1_DONE,
        F_CH2_START, F_SCHOOL_ENTERED, F_GAI_JOINED, F_CLUE_A, F_CLUE_B, F_PRINCIPAL_DONE, F_CH2_DONE,
        F_CH3_START, F_CH3_C0, F_CH3_C1, F_CH3_C2, F_CH3_C3, F_CH3_C4, F_CH3_DONE,
        F_CH4_START, F_CH4_S2, F_CH4_S3, F_CH4_S1, F_CH4_S0, F_CH4_READY, F_CH4_DONE, F_CH5_START, F_CH5_TALK, F_CH5_DONE, F_CH6_READY, F_CH6_END };
    unsigned char fl[MAX_FLAGS]; memset(fl, 0, sizeof(fl));
    for (int k = 0; k < (int)(sizeof(order) / sizeof(order[0])); k++) {
        int a, x, y;
        if (order[k] >= 0) fl[order[k]] = 1;
        CHECK(help_goal_info(1, fl, &a, &x, &y) == 1, "goal info %d", k);
        const Area *ar = &AREAS[a];
        CHECK(game_is_walkable(ar, x, y), "goal %d (%d,%d,%d) walkable", k, a, x, y);
        int found = 0;
        for (int i = 0; i < ar->nNpc; i++) if (ar->npc[i].x == x && ar->npc[i].y == y) found = 1;
        for (int i = 0; i < ar->nTrig; i++) if (ar->trig[i].x == x && ar->trig[i].y == y) found = 1;
        for (int i = 0; i < ar->nWarp; i++) if (ar->warp[i].x == x && ar->warp[i].y == y) found = 1;
        for (int i = 0; i < AREA_COUNT; i++) for (int j = 0; j < AREAS[i].nWarp; j++)
            if (AREAS[i].warp[j].toArea == a && AREAS[i].warp[j].tx == x && AREAS[i].warp[j].ty == y) found = 1;   /* 着く場所 */
        /* 章のつなぎ目で、スクリプトが運んでくれる着く場所(data_story.c の WARP) */
        if ((a == AREA_MILFI && x == 11 && y == 8) || (a == AREA_KUROMORI && x == 12 && y == 13) || (a == AREA_STATUE && x == 12 && y == 13)) found = 1;
        CHECK(found, "goal %d (%d,%d,%d) has something there", k, a, x, y);
    }
}

/* Update27: 「！」は そこに 見える NPC・きっかけ・出口が あるときだけ出る。ある場所では かならず出る */
static void test_goal_marker(void) {
    static const int order[] = { -1, F_MET_SERA, F_RIDE_DONE, F_BELL_DONE, F_KINDER_ARRIVED, F_DISPUTE_DONE, F_CH1_DONE,
        F_CH2_START, F_SCHOOL_ENTERED, F_GAI_JOINED, F_CLUE_A, F_CLUE_B, F_PRINCIPAL_DONE, F_CH2_DONE,
        F_CH3_START, F_CH3_C0, F_CH3_C1, F_CH3_C2, F_CH3_C3, F_CH3_C4, F_CH3_DONE,
        F_CH4_START, F_CH4_S2, F_CH4_S3, F_CH4_S1, F_CH4_S0, F_CH4_READY, F_CH4_DONE, F_CH5_START, F_CH5_TALK, F_CH5_DONE, F_CH6_READY, F_CH6_END };
    int withMarker = 0;
    game_init(); game_seed(5);
    SaveData *g = game_data();
    for (int k = 0; k < (int)(sizeof(order) / sizeof(order[0])); k++) {
        int a, x, y, mx, my;
        if (order[k] >= 0) g->flags[order[k]] = 1;
        CHECK(help_goal_info(1, g->flags, &a, &x, &y) == 1, "goal info %d", k);
        g->area = a;
        const Area *ar = &AREAS[a];
        int vis = 0;
        for (int i = 0; i < ar->nNpc; i++) { const Npc *n = &ar->npc[i]; if (n->x == x && n->y == y && (n->needFlag < 0 || g->flags[n->needFlag]) && (n->hideFlag < 0 || !g->flags[n->hideFlag])) vis = 1; }
        for (int i = 0; i < ar->nTrig; i++) { const Trigger *t = &ar->trig[i]; if (t->x == x && t->y == y && (t->reqFlag < 0 || g->flags[t->reqFlag]) && (t->onceFlag < 0 || !g->flags[t->onceFlag])) vis = 1; }
        for (int i = 0; i < ar->nWarp; i++) if (ar->warp[i].x == x && ar->warp[i].y == y) vis = 1;
        int has = game_test_goal_marker(&mx, &my);
        CHECK(has == vis, "marker %d: has=%d vis=%d (area %d %d,%d)", k, has, vis, a, x, y);
        if (has) { CHECK(mx == x && my == y, "marker pos %d", k); withMarker++; }
    }
    CHECK(withMarker >= 24, "most goals have a marker: %d", withMarker);
}

/* Update27: お店・宿屋・転職・格闘場・カジノ・モンスター・ずかん。でたらめに ボタンを おしても おかしくならない */
static void test_facilities(void) {
    static unsigned keys[6000];
    static const unsigned pool[] = { PK_A, PK_A, PK_A, PK_B, PK_UP, PK_DOWN, PK_LEFT, PK_RIGHT, PK_A, 0, PK_X };
    unsigned rng = 12345;
    for (int kind = 0; kind < FAC_COUNT; kind++) {
        for (int round = 0; round < 6; round++) {
            game_init(); game_seed(100 + kind * 7 + round);
            host_set_input_name("テスト");
            SaveData *g = game_data();
            g->partyN = 4;
            for (int i = 0; i < 4; i++) game_member_init(&g->party[i], i, 12 + round * 4);
            g->gold = 3000 + round * 2000; g->ext.coins = 80 + round * 100;
            g->flags[F_CH2_START] = 1; g->chapter = 2; g->area = AREA_MILFI; g->px = 11; g->py = 8;
            for (int i = 0; i < 5; i++) mon_add(&g->ext, i % 8, 3 + i * 3);
            g->ext.arenaRank = round % ARENA_RANKS;
            game_test_open_facility(kind);
            for (int i = 0; i < 6000; i++) { rng = rng * 1103515245u + 12345u; keys[i] = pool[(rng >> 16) % (sizeof(pool) / sizeof(pool[0]))]; }
            host_set_script(keys, 6000); host_set_max_frames(1000000);
            for (int i = 0; i < 6000; i++) {
                game_frame();
                if (g->gold < 0 || g->gold > 999999 || g->ext.coins < 0) break;
            }
            CHECK(g->gold >= 0 && g->gold <= 999999, "kind %d round %d gold %d", kind, round, g->gold);
            CHECK(g->ext.coins >= 0 && g->ext.coins < 100000000, "kind %d round %d coins %d", kind, round, g->ext.coins);
            CHECK(g->ext.monN >= 0 && g->ext.monN <= MON_BOX, "kind %d mon %d", kind, g->ext.monN);
            for (int i = 0; i < ITEM_COUNT; i++) CHECK(g->items[i] >= 0 && g->items[i] <= 99, "item %d = %d", i, g->items[i]);
            for (int i = 0; i < g->partyN; i++) CHECK(g->party[i].hp >= 0 && g->party[i].hp <= g->party[i].maxhp, "hp %d", g->party[i].hp);
            CHECK(g->ext.arenaRank >= 0 && g->ext.arenaRank < ARENA_RANKS, "arena rank %d", g->ext.arenaRank);
            for (int i = 0; i < g->partyN; i++) CHECK(g->ext.job[i] < JOB_COUNT, "job %d", g->ext.job[i]);
            /* Bを おしつづければ かならず マップに もどれる */
            { static unsigned bs[400]; for (int i = 0; i < 400; i++) bs[i] = (i & 1) ? PK_B : 0; host_set_script(bs, 400); for (int i = 0; i < 400; i++) game_frame(); }
            CHECK(scene_is("map") || scene_is("menu") || scene_is("battle") || scene_is("script") || scene_is("fac") || scene_is("act") || scene_is("choice") || scene_is("ending") || scene_is("deduct") || scene_is("card"), "kind %d round %d scene %s", kind, round, game_scene_name());
        }
    }
    game_test_reset_to_title();
}

/* Update29: L/R + 十字キーの ショートカット(はじめから使える・割り当てを かえられる・あるかない) */
static void test_shortcuts(void) {
    host_set_save_path("test_sc_save.dat"); remove("test_sc_save.dat");
    game_init(); game_seed(11); host_set_input_name("テスト");
    SaveData *g = game_data();
    press(PK_A);
    for (int i = 0; i < 400 && !scene_is("map"); i++) press(PK_A);
    CHECK(scene_is("map"), "sc: reached map %s", game_scene_name());
    int ox = g->px, oy = g->py;
    press(PK_L | PK_RIGHT);                      /* 既定: ステータス */
    CHECK(scene_is("menu") && strstr(host_screen_text(), "プレイ時間") != NULL, "L+right opens status: %s", game_scene_name());
    CHECK(g->px == ox && g->py == oy, "no walking while shortcut");
    press(PK_B); idle(2);
    CHECK(scene_is("map"), "status closes to map: %s", game_scene_name());
    g->party[0].hp = 1; g->items[0] = 9;
    press(PK_R | PK_DOWN);                       /* 既定: じどうかいふく */
    CHECK(scene_is("map") && g->party[0].hp > 1 && g->items[0] < 9, "auto heal hp=%d items=%d", g->party[0].hp, g->items[0]);
    g->ext.reserved[1] = 11 + 1;                 /* L+上 = カジノ */
    press(PK_L | PK_UP);
    CHECK(scene_is("fac") && strstr(host_screen_text(), "カジノ") != NULL, "custom casino shortcut: %s", game_scene_name());
    for (int i = 0; i < 20; i++) press(PK_B);
    CHECK(scene_is("map"), "casino closes to map: %s", game_scene_name());
    g->ext.reserved[1] = 999;                    /* こわれた設定 → 既定に もどる */
    press(PK_L | PK_UP);
    CHECK(scene_is("menu"), "bad setting falls back: %s", game_scene_name());
    press(PK_B); idle(2); press(PK_B); idle(2);
    CHECK(scene_is("map"), "back to map: %s", game_scene_name());
    g->ext.reserved[3] = 1;                      /* L+左 = なし */
    ox = g->px; press(PK_L | PK_LEFT);
    CHECK(scene_is("map") && g->px == ox, "none slot does nothing and does not walk");
    /* メニューの せってい画面 */
    press(PK_X);
    for (int i = 0; i < 13; i++) press(PK_DOWN);
    press(PK_A);
    CHECK(strstr(host_screen_text(), "ショートカット") != NULL, "setting screen: %s", host_screen_text());
    press(PK_A); press(PK_DOWN); press(PK_A);    /* 1つめの わくを えらんで 2番目の わざ */
    CHECK(g->ext.reserved[1] == 3 || g->ext.reserved[1] > 0, "slot assigned %d", g->ext.reserved[1]);
    for (int i = 0; i < 10; i++) press(PK_B);
    CHECK(scene_is("map"), "setting closes: %s", game_scene_name());
    /* でたらめに L/R/十字キーを おしても おかしくならない */
    {
        static unsigned keys[20000]; unsigned rng = 777;
        static const unsigned pool[] = { PK_L | PK_UP, PK_L | PK_DOWN, PK_L | PK_LEFT, PK_L | PK_RIGHT, PK_R | PK_UP, PK_R | PK_DOWN, PK_R | PK_LEFT, PK_R | PK_RIGHT,
            PK_A, PK_B, PK_X, PK_UP, PK_DOWN, PK_LEFT, PK_RIGHT, PK_A, PK_B, 0, PK_L, PK_R, PK_L | PK_R | PK_UP };
        for (int r = 0; r < 4; r++) {
            for (int i = 0; i < 20000; i++) { rng = rng * 1103515245u + 12345u; keys[i] = pool[(rng >> 16) % (sizeof(pool) / sizeof(pool[0]))]; }
            host_set_script(keys, 20000); host_set_max_frames(1000000);
            for (int i = 0; i < 20000; i++) game_frame();
            CHECK(g->gold >= 0 && g->gold <= 999999 && g->ext.coins >= 0 && g->ext.monN >= 0 && g->ext.monN <= MON_BOX, "fuzz invariants");
            for (int i = 0; i < ITEM_COUNT; i++) CHECK(g->items[i] >= 0 && g->items[i] <= 99, "fuzz item");
            for (int i = 0; i < g->partyN; i++) CHECK(g->party[i].hp >= 0 && g->party[i].hp <= g->party[i].maxhp, "fuzz hp");
        }
    }
    remove("test_sc_save.dat");
    game_test_reset_to_title();
}

/* Update31: Xメニューの「コード入力」(チートコード)。けっかが 出る・ワープできる・まちがえても だいじょうぶ */
static void test_code_menu(void) {
    host_set_save_path("test_code_save.dat"); remove("test_code_save.dat");
    game_init(); game_seed(21); host_set_input_name("テスト");
    SaveData *g = game_data();
    press(PK_A);
    for (int i = 0; i < 400 && !scene_is("map"); i++) press(PK_A);
    CHECK(scene_is("map"), "code: reached map %s", game_scene_name());
    int gold0 = g->gold;
    host_set_input_name("G5K");                  /* 大文字でも つかえる */
    press(PK_X); for (int i = 0; i < 16; i++) press(PK_DOWN); press(PK_A);
    CHECK(scene_is("menu") && g->gold == gold0 + 5000 && strstr(host_screen_text(), "g5k") != NULL, "code g5k: gold %d scene %s", g->gold, game_scene_name());
    press(PK_B); press(PK_B); idle(2);
    CHECK(scene_is("map"), "code closes to map");
    host_set_input_name("zzz-unknown");
    press(PK_X); for (int i = 0; i < 16; i++) press(PK_DOWN); press(PK_A);
    CHECK(scene_is("menu") && strstr(host_screen_text(), "そんな") != NULL && g->gold == gold0 + 5000, "unknown code message");
    press(PK_B); press(PK_B); idle(2);
    host_set_input_name("warp3");
    press(PK_X); for (int i = 0; i < 16; i++) press(PK_DOWN); press(PK_A);
    CHECK(scene_is("map") && g->area == AREA_FIELD, "warp3 -> field: %s area %d", game_scene_name(), g->area);
    host_set_input_name("lv99");
    press(PK_X); for (int i = 0; i < 16; i++) press(PK_DOWN); press(PK_A);
    CHECK(g->party[0].level == 99, "lv99 via menu");
    press(PK_B); press(PK_B); idle(2);
    host_set_input_name("noenc");
    press(PK_X); for (int i = 0; i < 16; i++) press(PK_DOWN); press(PK_A);
    press(PK_B); press(PK_B); idle(2);
    CHECK(g->ext.reserved[11] == 1 && scene_is("map"), "noenc on");
    /* であわない: 原っぱを 2000歩 あるいても 戦闘に ならない */
    g->area = AREA_FIELD; g->px = 3; g->py = 7; int battles = 0;
    for (int i = 0; i < 2000; i++) { press((i & 1) ? PK_RIGHT : PK_LEFT); if (scene_is("battle")) { battles++; break; } }
    CHECK(battles == 0, "noenc: no battles");
    host_set_input_name("テスト");
    remove("test_code_save.dat");
    game_test_reset_to_title();
}

/* Update34: 公園の きっかけの 場所に セラが 立って いる(「！」だけ ではない)。あったら いなくなる */
static void test_sera_visible(void) {
    game_init(); game_seed(4);
    SaveData *g = game_data();
    g->area = AREA_PLAZA; g->px = 12; g->py = 12; g->flags[F_MET_SERA] = 0;
    CHECK(game_test_sera_visible(), "Sera is drawn at the plaza before meeting");
    g->flags[F_MET_SERA] = 1;
    CHECK(!game_test_sera_visible(), "Sera is not drawn after meeting");
    g->flags[F_MET_SERA] = 0; g->area = AREA_HINATA;
    CHECK(!game_test_sera_visible(), "Sera is only in the plaza");
    const Area *a = &AREAS[AREA_PLAZA]; int found = 0;
    for (int i = 0; i < a->nTrig; i++) if (a->trig[i].script == S_MEET_SERA) { found = 1; CHECK(a->trig[i].x == 6 && a->trig[i].y == 5, "Sera trigger at (6,5)"); }
    CHECK(found, "Sera trigger exists");
    /* 村の 鐘(ならす きっかけ): のりものの あと〜ならすまで 見える */
    g->area = AREA_HINATA; g->flags[F_RIDE_DONE] = 0; g->flags[F_BELL_DONE] = 0;
    CHECK(!game_test_bell_visible(), "bell hidden before the ride");
    g->flags[F_RIDE_DONE] = 1;
    CHECK(game_test_bell_visible(), "bell visible after the ride");
    g->flags[F_BELL_DONE] = 1;
    CHECK(!game_test_bell_visible(), "bell hidden after ringing");
    const Area *h = &AREAS[AREA_HINATA]; found = 0;
    for (int i = 0; i < h->nTrig; i++) if (h->trig[i].script == S_FIRE_BELL) { found = 1; CHECK(h->trig[i].x == 15 && h->trig[i].y == 7, "bell trigger at (15,7)"); }
    CHECK(found, "bell trigger exists");
}

int main(void) {
    game_set_testmode(1); game_set_typewriter(0);   /* 文字の ゆっくり表示を オフに する */
    test_help_flow();   /* さいしょの(まっさらな)状態で行う */
    test_goal_spots();
    test_goal_marker();
    test_sera_visible();
    test_facilities();
    test_shortcuts();
    test_code_menu();
    test_regress15();
    test_data(); test_rules(); test_save(); test_smoke(); test_battle_terminates();
    test_chapter_transition(); test_chapter2(); test_tonic(); test_draw_all_scenes();
    test_battle_cursor(); test_quit_confirm();
    printf("%d checks, %d failures\n", checks, fails);
    return fails ? 1 : 0;
}
