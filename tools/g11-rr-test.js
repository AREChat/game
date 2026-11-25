#!/usr/bin/env node
"use strict";
/* ルール・ルーレット：ぜんぶの ゲーム × むずかしさ × ルール変化 で、「完璧な ボット」が かならず クリアできるか／なにも しないと まけるか を たしかめる
   node tools/g11-rr-test.js [gameId] [seeds=12] */
const path = require("path");
const RR = require(path.join(__dirname, "../game11/js/rr-core.js"));
for (const f of ["rr-games-a.js", "rr-games-b.js"]) { try { require(path.join(__dirname, "../game11/js/" + f)); } catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; } }
const only = process.argv[2] && process.argv[2] !== "all" ? process.argv[2] : null;
const seeds = +(process.argv[3] || 12);
const LVS = [0, 1, 2, 3.5];
const MODSETS = [[], ["fast"], ["slow"], ["big"], ["tiny"], ["hurry"], ["fast", "tiny"], ["fast", "hurry"], ["tiny", "hurry"], ["mirror", "spin", "dark"]];
function run(g, seed, lv, mods, bot){
  const R = new RR.Round(g, { seed: seed * 7919 + 13, lv, mods });
  const i = { x: RR.W / 2, y: RR.H / 2, tap: false, down: false };
  let n = 0;
  while (R.status === "run" && n < 60 * 40) {
    i.tap = false; i.down = false;
    if (bot) g.ai(R, i);
    R.step(1 / 60, i); n++;
  }
  return R;
}
let bad = 0, total = 0;
for (const g of RR.GAMES) {
  if (only && g.id !== only) continue;
  const row = [];
  for (const lv of LVS) {
    let w = 0, t = 0, worst = null;
    for (const m of MODSETS) for (let s = 0; s < seeds; s++) { const R = run(g, s, lv, m, true); t++; if (R.status === "win") w++; else if (!worst) worst = { m: m.join("+") || "-", s, why: R.why || R.status, t: R.t.toFixed(1), score: R.score }; }
    row.push(`lv${lv}:${w}/${t}` + (worst ? "(" + worst.m + " s" + worst.s + " " + worst.why + " t" + worst.t + " sc" + worst.score + ")" : ""));
    total += t; bad += t - w;
  }
  // なにも しない
  let idle = 0, it = 0; for (let s = 0; s < 20; s++) { const R = run(g, s, 1, [], false); it++; if (R.status === "win") idle++; }
  console.log(g.id.padEnd(8), row.join("  "), "  no-input-win:" + idle + "/" + it);
  if (idle > 4) console.log("   ⚠ なにも しなくても かてる");
}
console.log("bot failures:", bad, "/", total);
process.exit(bad ? 1 : 0);
