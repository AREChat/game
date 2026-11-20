#include <stdio.h>
#include <string.h>
#include "../source/monster.h"
#include "../source/skills.h"
static int N = 0, F = 0;
#define CHECK(c) do { N++; if (!(c)) { F++; if (F < 25) printf("FAIL line %d: %s\n", __LINE__, #c); } } while (0)
int main(void) {
    unsigned rng = 12345; int i, j;
    /* ---- 敵データ ---- */
    CHECK(ENEMY_COUNT <= ENEMY_MAX);
    for (i = 0; i < ENEMY_COUNT; i++) {
        const EnemyDef *e = &ENEMIES[i];
        CHECK(e->name && e->hp > 0 && e->atk > 0 && e->rate >= 0 && e->rate <= 100 && e->pat >= 0 && e->pat <= 3 && e->lv >= 1);
        if (e->boss) CHECK(e->rate == 0);
    }
    /* ---- モンスターの 能力 ---- */
    { MonStats a, b, c;
      for (i = 0; i < ENEMY_COUNT; i++) {
          mon_stats(i, 1, &a); mon_stats(i, 10, &b); mon_stats(i, 30, &c);
          CHECK(a.hp >= 5 && b.hp >= a.hp && c.hp >= b.hp && c.atk >= b.atk && b.atk >= a.atk && c.spd >= b.spd);
      }
      mon_stats(-1, 5, &a); CHECK(a.hp == 0);
      mon_stats(0, 999, &a); mon_stats(0, MON_MAX_LV, &b); CHECK(a.hp == b.hp);
    }
    /* ---- スカウト ---- */
    for (i = 0; i < ENEMY_COUNT; i++) {
        int full = scout_chance(i, 100, 100), half = scout_chance(i, 50, 100), low = scout_chance(i, 5, 100);
        if (ENEMIES[i].boss || ENEMIES[i].rate == 0) CHECK(full == 0 && half == 0 && low == 0);
        else { CHECK(full >= 3 && full <= 95 && low >= half && half >= full && low <= 95); }
    }
    CHECK(scout_chance(-1, 1, 1) == 0 && scout_chance(0, 1, 0) == 0);
    /* ---- ぼくじょう ---- */
    { ExtData e; Mon m; memset(&e, 0, sizeof(e));
      for (i = 0; i < MON_BOX; i++) CHECK(mon_add(&e, i % ENEMY_COUNT, 3) == i);
      CHECK(mon_add(&e, 0, 3) == -1 && e.monN == MON_BOX);
      CHECK(e.seen[0] == 2);
      CHECK(mon_remove(&e, 0) && e.monN == MON_BOX - 1 && !mon_remove(&e, MON_BOX) && !mon_remove(&e, -1));
      memset(&m, 0, sizeof(m)); m.level = 1; m.enemy = 0;
      CHECK(mon_add_exp(&m, mon_exp_need(1)) && m.level == 2);
      CHECK(!mon_add_exp(&m, 0));
      for (i = 0; i < 200 && m.level < MON_MAX_LV; i++) mon_add_exp(&m, 100000);
      CHECK(m.level == MON_MAX_LV);
    }
    /* ---- 格闘場 ---- */
    { Fighter a, b; ArenaLog lg; unsigned r1 = 77, r2 = 77; int w1, w2, wins = 0;
      Mon strong, weak; memset(&strong, 0, sizeof(strong)); memset(&weak, 0, sizeof(weak));
      strong.enemy = 7; strong.level = 20; weak.enemy = 0; weak.level = 3;
      fighter_from_mon(&strong, &a); fighter_from_mon(&weak, &b);
      w1 = arena_fight(&a, &b, &r1, &lg); CHECK(lg.n >= 3 && lg.n <= ARENA_LOG_MAX);
      fighter_from_mon(&strong, &a); fighter_from_mon(&weak, &b);
      w2 = arena_fight(&a, &b, &r2, &lg); CHECK(w1 == w2);   /* おなじ種なら おなじ結果 */
      for (i = 0; i < 100; i++) { unsigned r = (unsigned)(i * 31 + 5); fighter_from_mon(&strong, &a); fighter_from_mon(&weak, &b); if (arena_fight(&a, &b, &r, &lg) == 0) wins++; }
      CHECK(wins >= 95);
      for (j = 0; j < ARENA_RANKS; j++) for (i = 0; i < 30; i++) {
          unsigned r = (unsigned)(j * 100 + i); Fighter o, me; arena_opponent(j, 5, &r, &o); CHECK(o.name && o.hp > 0 && o.atk > 0);
          fighter_from_mon(&weak, &me); (void)arena_fight(&me, &o, &r, &lg); CHECK(lg.n > 0 && lg.n <= ARENA_LOG_MAX);
      }
      for (j = 0; j + 1 < ARENA_RANKS; j++) { CHECK(arena_prize_gold(j + 1, 10, 3) > arena_prize_gold(j, 10, 3)); CHECK(arena_prize_coins(j + 1, 3) > arena_prize_coins(j, 3)); CHECK(arena_entry_fee(j + 1) > arena_entry_fee(j)); }
      CHECK(arena_prize_gold(0, 5, 3) > arena_prize_gold(0, 5, 1) && arena_prize_exp(0, 5, 3) > arena_prize_exp(0, 5, 1));
    }
    /* ---- カジノ: スロットの もどり率(しょうさい計算) ---- */
    { static const int W[SLOT_SYMBOLS] = { 30, 24, 20, 14, 8, 4 };
      double paid = 0, total = 0; int a, b, c; int r7[3] = { 5, 5, 5 }; int rn[3] = { 0, 1, 2 };
      for (a = 0; a < SLOT_SYMBOLS; a++) for (b = 0; b < SLOT_SYMBOLS; b++) for (c = 0; c < SLOT_SYMBOLS; c++) {
          int r[3]; double p = W[a] * W[b] * W[c] / 1000000.0; r[0] = a; r[1] = b; r[2] = c;
          paid += p * slot_payout(r, 100); total += p * 100;
      }
      CHECK(paid / total > 0.75 && paid / total < 0.97);   /* 店が ちょっと つよい。でも つづけて あそべる */
      CHECK(slot_payout(r7, 2) == 800);
      CHECK(slot_payout(rn, 5) == 0);
      for (i = 0; i < 1000; i++) { int r[3]; slot_spin(&rng, r); CHECK(r[0] >= 0 && r[0] < SLOT_SYMBOLS && r[1] >= 0 && r[1] < SLOT_SYMBOLS && r[2] >= 0 && r[2] < SLOT_SYMBOLS); }
    }
    /* ---- ハイ&ロー・ルーレット ---- */
    CHECK(hl_judge(5, 9, true) == 1 && hl_judge(5, 9, false) == -1 && hl_judge(5, 5, true) == 0 && hl_judge(5, 2, false) == 1);
    for (i = 2; i <= 8; i++) CHECK(hl_payout(100, i) >= hl_payout(100, i - 1));
    CHECK(hl_payout(100, 7) == 477 && hl_payout(100, 0) == 0 && hl_payout(0, 3) == 0);
    for (i = 0; i < 1000; i++) { int d = hl_draw(&rng), s = rl_spin(&rng); CHECK(d >= 1 && d <= 13); CHECK(s >= 0 && s <= 36); }
    { int reds = 0; for (i = 1; i <= 36; i++) if (rl_is_red(i)) reds++; CHECK(reds == 18 && !rl_is_red(0)); }
    CHECK(rl_payout(10, RL_RED, 0, 1) == 20 && rl_payout(10, RL_RED, 0, 2) == 0 && rl_payout(10, RL_BLACK, 0, 2) == 20 && rl_payout(10, RL_EVEN, 0, 0) == 0);
    CHECK(rl_payout(10, RL_NUMBER, 17, 17) == 360 && rl_payout(10, RL_NUMBER, 17, 18) == 0 && rl_payout(10, RL_ODD, 0, 3) == 20);
    { double paid = 0; for (i = 0; i <= 36; i++) paid += rl_payout(100, RL_RED, 0, i) / 37.0; CHECK(paid / 100 > 0.95 && paid / 100 < 1.0); }
    /* ---- 景品 ---- */
    for (i = 0; i < PRIZE_COUNT; i++) {
        CHECK(PRIZES[i].name && PRIZES[i].coins > 0);
        if (PRIZES[i].kind == 0) CHECK(PRIZES[i].arg >= 0 && PRIZES[i].arg < ITEM_COUNT);
        if (PRIZES[i].kind == 1) CHECK(PRIZES[i].arg >= 1 && PRIZES[i].arg < WEAPON_COUNT);
        if (PRIZES[i].kind == 2) CHECK(PRIZES[i].arg >= 1 && PRIZES[i].arg < ARMOR_COUNT);
        if (PRIZES[i].kind == 3) CHECK(PRIZES[i].arg >= 0 && PRIZES[i].arg < ENEMY_COUNT && !ENEMIES[PRIZES[i].arg].boss && ENEMIES[PRIZES[i].arg].rate > 0);
    }
    /* ---- タイピング ---- */
    CHECK(typing_word_count() >= 20);
    for (i = 0; i < typing_word_count(); i++) { CHECK(strlen(typing_word(i)) > 0 && strlen(typing_answer(i)) > 0 && typing_check(i, typing_answer(i))); }
    CHECK(typing_check(1, "tuki") && typing_check(1, "  TSUKI ") && !typing_check(1, "tsuku") && !typing_check(1, ""));
    CHECK(typing_check(0, "hosi") && typing_check(0, "hoshi"));
    CHECK(!typing_check(-1, "a") && !typing_check(0, NULL) && !typing_check(999, "a"));
    CHECK(typing_reward(10, 10, 1) > typing_reward(9, 10, 1) && typing_reward(0, 10, 1) == 0 && typing_reward(5, 0, 1) == 0);
    /* ---- 職業・呪文・特技 ---- */
    { static SaveData g; int n1, n30, out[SKILL_COUNT_V3 > 0 ? 200 : 1], n, found; const char *why = NULL; int gained;
      memset(&g, 0, sizeof(g)); g.partyN = MAX_PARTY;
      for (i = 0; i < MAX_PARTY; i++) { g.party[i].id = i; g.party[i].level = 1; g.party[i].maxhp = g.party[i].hp = 10; }
      CHECK(SKILL_COUNT_V3 >= 100 && SKILL_COUNT_V3 <= 200);
      for (i = 0; i < SKILL_COUNT_V3; i++) {
          const SkillDef *s = &SKILLS_V3[i]; char buf[160];
          CHECK(s->name && s->name[0] && s->target <= TG_DEAD1 && s->hits >= 1 && s->eff1 != EF_NONE && s->learnLv >= 1 && s->mp <= 99);
          if (s->job >= 0) CHECK(s->job >= 1 && s->job < JOB_COUNT && s->type == 'J'); else CHECK(strchr("AHSPT", s->type) != NULL);
          skill_describe(i, buf, sizeof(buf)); CHECK(strlen(buf) > 4);
      }
      /* どの キャラも レベル1で 1つ以上、レベルが 上がると ふえる */
      for (i = 0; i < MAX_PARTY; i++) {
          g.party[i].level = 1; n1 = skill_known(&g, i, out, 200); CHECK(n1 >= 1);
          g.party[i].level = 30; n30 = skill_known(&g, i, out, 200); CHECK(n30 > n1 + 8);
          g.party[i].level = 1;
      }
      /* いちばん はじめの わざは、攻撃か かいふく(つかえる) */
      skill_known(&g, MEM_HERO, out, 200); CHECK(SKILLS_V3[out[0]].eff1 == EF_MDMG);
      skill_known(&g, MEM_SERA, out, 200); CHECK(SKILLS_V3[out[0]].eff1 == EF_HEAL);
      /* 職業: レベル10から。職業レベルで 職業のわざを おぼえ、転職しても わざは のこる */
      CHECK(!job_can_change(&g, 0, 1, &why) && why && why[0]);
      g.party[0].level = 10; CHECK(job_can_change(&g, 0, 1, &why) && job_change(&g, 0, 1) && g.ext.job[0] == 1);
      CHECK(!job_change(&g, 0, 1) && !job_change(&g, 0, JOB_COUNT) && !job_change(&g, 5, 1));
      gained = job_add_exp(&g, 0, 100000); CHECK(gained > 0 && g.ext.jobLv[0][1] == JOB_MAX_LV);
      n = skill_known(&g, 0, out, 200); found = 0;
      for (i = 0; i < n; i++) if (SKILLS_V3[out[i]].job == 1 && SKILLS_V3[out[i]].learnLv == 30) found = 1;
      CHECK(found);
      CHECK(job_change(&g, 0, 2) && g.ext.job[0] == 2);
      n = skill_known(&g, 0, out, 200); found = 0;
      for (i = 0; i < n; i++) if (SKILLS_V3[out[i]].job == 1) found = 1;
      CHECK(found);   /* エンジニアの わざは のこる */
      CHECK(job_add_exp(&g, 1, 10) == 0);   /* みならいは けいけんち なし */
      CHECK(job_level_of(0) == 0 && job_level_of(job_need_exp(0)) == 1 && job_level_of(99999999) == JOB_MAX_LV);
      for (i = 0; i < JOB_COUNT; i++) CHECK(JOBS[i].name && JOBS[i].atk >= 50 && JOBS[i].atk <= 200 && JOBS[i].def >= 50 && JOBS[i].mag >= 50);
      for (j = 1; j < JOB_COUNT; j++) { int cnt = 0; for (i = 0; i < SKILL_COUNT_V3; i++) if (SKILLS_V3[i].job == j) cnt++; CHECK(cnt >= 3); }
      CHECK(stat_pct(10, 150) == 15 && stat_pct(1, 10) == 1 && stat_pct(0, 100) == 1);
    }
    printf("monster/skills: %d checks, %d failed\n", N, F);
    return F != 0;
}
