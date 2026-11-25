// game14 ミニゲーム：画面なし bot テスト（腕前 0.2/0.6/1.0 で % が 単調に 上がるか、完走するか、NaN が ないか）
global.window = global;
const path = require("path"), D = path.join(__dirname, "..", "js");
require(path.join(D, "st-data.js")); require(path.join(D, "st-core.js")); require(path.join(D, "st-text.js")); require(path.join(D, "st-mini.js")); require("./g14-bot.js");
const ST = global.ST; let fails = 0, oks = 0;
const ok = (c, m) => { if (c) oks++; else { fails++; console.log("  ✗ " + m); } };
const TYPES = ["rhythm", "karaoke", "timing", "mash", "mood", "react", "memory", "dart", "catch", "pachi", "cheers", "scan"];
function bot(type, skill, seed, d, as, short) {
  const g = ST.newGame(type, { d, as, seed, short, cfg: { bet: 100 }, noReady: true }); g.W = 800; g.H = 450;
  const step = G14BOT.make(type, skill, seed); let guard = 0; const dt = 1 / 60;
  while (!g.done && guard++ < 60 * 200) { ST.stepGame(g, dt); step(g, dt); }
  return { g, ok: g.done, pct: g.pct, steps: guard };
}
const res = {};
for (const t of TYPES) {
  res[t] = {};
  for (const sk of [.1, .6, 1]) {
    const arr = []; for (let s = 1; s <= 12; s++) { const r = bot(t, sk, s, .5, 0, false); arr.push(r); ok(r.ok, t + " sk" + sk + " seed" + s + " finishes (steps " + r.steps + ")"); ok(Number.isFinite(r.pct) && r.pct >= 0 && r.pct <= 100, t + " pct finite " + r.pct); }
    res[t][sk] = arr.reduce((a, r) => a + r.pct, 0) / arr.length;
  }
  console.log(t.padEnd(8), "skill.1 " + res[t][.1].toFixed(1).padStart(5), " .6 " + res[t][.6].toFixed(1).padStart(5), " 1.0 " + res[t][1].toFixed(1).padStart(5));
  ok(res[t][1] > res[t][.1] + 8, t + " strong play beats weak play (" + res[t][.1].toFixed(0) + " → " + res[t][1].toFixed(0) + ")");
}
// 難易度：d=.15 と d=1 で 同じ腕前（.6）の % が さがるか
for (const t of TYPES) { let a = 0, b = 0; for (let s = 1; s <= 8; s++) { a += bot(t, .6, s, .15, 0, false).pct; b += bot(t, .6, s, 1, 0, false).pct; } a /= 8; b /= 8; console.log(("diff " + t).padEnd(14), "d.15 " + a.toFixed(0).padStart(3), " d1.0 " + b.toFixed(0).padStart(3)); ok(a >= b - 3, t + " harder is not easier (" + a.toFixed(0) + " vs " + b.toFixed(0) + ")"); }
// アシスト：as=.6 で ふつうの腕前の % が 上がるか
for (const t of TYPES) { let a = 0, b = 0; for (let s = 1; s <= 8; s++) { a += bot(t, .5, s, .6, 0, false).pct; b += bot(t, .5, s, .6, .6, false).pct; } a /= 8; b /= 8; console.log(("assist " + t).padEnd(14), "as0 " + a.toFixed(0).padStart(3), " as.6 " + b.toFixed(0).padStart(3)); ok(b >= a - 2, t + " assist does not hurt (" + a.toFixed(0) + " vs " + b.toFixed(0) + ")"); }
// short モード
for (const t of TYPES) { const r = bot(t, .8, 5, .5, 0, true); ok(r.ok, t + " short finishes"); }
// 何もしない（放置）でも 終わる＆ 0〜低い
for (const t of TYPES) { const g = ST.newGame(t, { d: .6, as: 0, seed: 3, cfg: { bet: 100 }, noReady: true }); let n = 0; while (!g.done && n++ < 60 * 300) ST.stepGame(g, 1 / 60); ok(g.done, t + " idle finishes (" + n + " frames)"); console.log(("idle " + t).padEnd(14), g.pct); }
console.log("RESULT ok=" + oks + " fail=" + fails); process.exit(fails ? 1 : 0);
