/* PC上の自動テスト: gcc + platform_host.c でビルドし、ロジック・データ整合性を検証する */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "../source/game.h"
#include "../source/platform.h"
#include "../source/host_api.h"

static int fails = 0, checks = 0;
#define CHECK(c, ...) do { checks++; if (!(c)) { fails++; printf("FAIL %s:%d: ", __FILE__, __LINE__); printf(__VA_ARGS__); printf("\n"); } } while (0)

static void press(unsigned k) { static unsigned a[1]; a[0] = k; host_set_script(a, 1); host_set_max_frames(1000000); game_frame(); }
static void idle(int n) { for (int i = 0; i < n; i++) { static unsigned z[1]; z[0] = 0; host_set_script(z, 1); game_frame(); } }
static bool scene_is(const char *s) { return strcmp(game_scene_name(), s) == 0; }

static void test_data(void) {
    CHECK(AREA_COUNT == AREA_COUNT_ENUM, "area count mismatch %d vs %d", AREA_COUNT, AREA_COUNT_ENUM);
    CHECK(SCRIPT_COUNT == S_PRINCIPAL_CONFRONT + 1, "script count %d", SCRIPT_COUNT);
    CHECK(CHAPTER_TITLE_COUNT == 4, "chapter titles %d", CHAPTER_TITLE_COUNT);
    CHECK(ENEMY_COUNT == 7, "enemy count %d", ENEMY_COUNT);
    CHECK(GROUP_COUNT == G_BOUNCER + 1, "group count %d", GROUP_COUNT);
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
    CHECK(game_data()->version == SAVE_VERSION && SAVE_VERSION == 2, "save version");
    /* 古い形式(別バージョン)のセーブは読み込まない */
    SaveData old = *game_data(); old.version = 1;
    FILE *f = fopen("test_save.dat", "wb"); CHECK(f != NULL, "open"); if (f) { fwrite(&old, 1, sizeof(old), f); fclose(f); }
    CHECK(!game_load(), "old version rejected");
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
static void test_battle_terminates(void) {
    battle_terminates_in(AREA_FIELD, 10, 7, 1);
    battle_terminates_in(AREA_SCHOOL, 10, 7, 2);
}

/* スクリプト/推理/章カード/戦闘を進めてマップに戻るまで入力を自動で押す。dedSeq は出てくる推理IDの順 */
static void drive_to_map(const int *dedSeq, int nDed) {
    int di = 0;
    for (int guard = 0; guard < 3000 && !scene_is("map"); guard++) {
        if (scene_is("deduct") && di < nDed) {
            for (int i = 0; i < DEDUCTIONS[dedSeq[di]].correct; i++) press(PK_DOWN);
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
    press(PK_A); /* カーソル0は不正解 */
    CHECK(scene_is("deduct") && DEDUCTIONS[1].correct != 0, "wrong answer stays in deduct");
    press(PK_A); /* ヒント→選択に戻る */
    for (int i = 0; i < DEDUCTIONS[1].correct; i++) press(PK_DOWN);
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
    /* 校長はいなくなり、先生が自由になっている */
    g->px = 12; g->py = 5; press(PK_A);
    CHECK(scene_is("map"), "principal gone");
    g->px = 5; g->py = 6; press(PK_A);
    CHECK(scene_is("script"), "free teacher talk");
    drive_to_map(NULL, 0);
    /* 出口から町へ戻れる */
    g->px = 12; g->py = 13; press(PK_DOWN);
    CHECK(g->area == AREA_MILFI && g->px == 11 && g->py == 4, "exit to milfi (%d,%d,%d)", g->area, g->px, g->py);
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

int main(void) {
    test_regress15();
    test_data(); test_rules(); test_save(); test_smoke(); test_battle_terminates();
    test_chapter_transition(); test_chapter2(); test_tonic(); test_draw_all_scenes();
    printf("%d checks, %d failures\n", checks, fails);
    return fails ? 1 : 0;
}
