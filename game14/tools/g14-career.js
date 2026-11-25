// game14 キャリア・シミュレーション（画面なし）：腕前ごとに 90日を 何回も 自動プレイして バランスを 見る
//   node tools/g14-career.js [runs=40] [--policy=greedy|pachi|lazy]
global.window = global;
const path = require("path"), D = path.join(__dirname, "..", "js");
require(path.join(D, "st-data.js")); require(path.join(D, "st-core.js")); require(path.join(D, "st-text.js")); require(path.join(D, "st-mini.js")); require("./g14-bot.js");
const ST = global.ST;
const RUNS = +(process.argv[2] && /^\d+$/.test(process.argv[2]) ? process.argv[2] : 40);
const POL = (process.argv.find(a => a.startsWith("--policy=")) || "--policy=greedy").split("=")[1];
global.GK = { lang: () => "ja" };
if (process.env.BASES) process.env.BASES.split(',').forEach((b, i) => { ST.AREAS[i].base = +b; });
if (process.env.FANF) ST.FANF = +process.env.FANF; if (process.env.REPEAT) ST.REPEAT = +process.env.REPEAT;

function playMini(S, type, d, short, seed, skill, cfg) {
  const m = ST.MG[type], as = ST.assist(S, m.stat);
  const g = ST.newGame(type, { d, as, seed, short, cfg: cfg || {}, noReady: true }); g.W = 800; g.H = 450;
  const step = G14BOT.make(type, skill, seed); const dt = 1 / 60; let n = 0;
  while (!g.done && n++ < 60 * 200) { ST.stepGame(g, dt); step(g, dt); }
  return g;
}
function expect(c, f) { let t = 0; for (const o of c.o) t += o.p * f(o.fx || {}); return t; }
const REL = fx => fx.rel ? Object.values(fx.rel).reduce((a, b) => a + b, 0) : 0;
const HAB = fx => (fx.drk || 0) + (fx.smk || 0) + (fx.gam || 0);
function pickEvent(S, e, rnd) {
  const ok = e.ch.map((c, i) => [c, i]).filter(([c]) => ST.choiceOk(S, c));
  if (!ok.length) return 0;
  if (POL === "rel") { ok.sort((a, b) => expect(b[0], REL) - expect(a[0], REL)); return ok[0][1]; }
  if (POL === "clean") { ok.sort((a, b) => (expect(a[0], HAB) - expect(b[0], HAB)) || (expect(b[0], REL) - expect(a[0], REL))); return ok[0][1]; }
  if (POL === "reckless" || POL === "pachi") { ok.sort((a, b) => expect(b[0], HAB) - expect(a[0], HAB)); return ok[0][1]; }
  return ok[Math.floor(rnd() * ok.length)][1];
}
function buyStuff(S) {
  const order = ["outfit", "poster", "gear", "coach"];
  for (let k = 0; k < 4; k++) for (const id of order) { const it = ST.SHOPMAP[id], lv = S.gear[id] || 0; if (lv >= it.max) continue; const p = it.price(lv); if (S.coins >= p * 1.15) { ST.buy(S, id); } }
}
function runCareer(seed, skill, type) {
  const S = ST.newRun({ type, name: "bot", seed }); const rnd = ST.rng(seed * 13 + 5); let seedN = seed * 1000, acts = 0;
  const stat = { chal: 0, train: 0, rest: 0, ev: 0, pachiPlays: 0, rkDay: [] };
  while (!S.over) {
    // 1日
    while (S.ap > 0 && !S.over) {
      let did = false;
      if ((S.cond < 30 || S.hlt < 35 || (POL !== "reckless" && (S.fat || 0) >= ST.FAT_AT - 8)) && POL !== "reckless") { ST.rest(S); stat.rest++; did = true; }
      else {
        const open = ST.openAreas(S), lastArea = open[open.length - 1];
        // 特訓：ときどき（能力が 低い or 5回に 1回）
        const wantTrain = (S.cnt.chal || 0) > 2 && (acts % 5 === 4) && POL !== "lazy" && POL !== "reckless";
        if (wantTrain) {
          const tr = ST.TRAIN.slice().sort((a, b) => S.st[a.stat] - S.st[b.stat])[0];
          const g = playMini(S, tr.type, ST.clamp(.2 + S.st[tr.stat] / 150, .2, .85), true, ++seedN, skill);
          ST.applyTrain(S, tr, Math.round(g.pct)); stat.train++; did = true;
        } else {
          // チャレンジ：★が 少ない ものを 優先（高エリア優先）。大人エリア（パチンコ）は policy が pachi の ときだけ
          let cands = ST.CHS.filter(c => ST.areaOpen(S, ST.AREAMAP[c.area]) && (POL === "pachi" || c.type !== "pachi") && (!ST.AREAMAP[c.area].adult || true));
          cands.sort((a, b) => (POL === "pachi" ? ((b.type === "pachi") - (a.type === "pachi")) : 0) || ((S.stars[a.id] || 0) - (S.stars[b.id] || 0)) || (b.i - a.i) || (b.d - a.d));
          const c = cands[0];
          const g = playMini(S, c.type, ST.chDiff(c), false, ++seedN, skill, c.cfg);
          ST.applyChallenge(S, c, Math.round(g.pct), { coinsDelta: g.coinsDelta || 0, pachi: c.type === "pachi" }); stat.chal++; did = true;
        }
        if (S.coins > 150) buyStuff(S);
      }
      acts++;
      if (ST.checkEnd(S)) break;
    }
    if (S.over) break;
    // 1日の おわり
    if (S.cond < 60 && (S.gear.drink || 0) > 0) ST.useDrink(S);
    const dayBefore = S.day; ST.endDay(S);
    if (ST.checkEnd(S)) break;
    let e; while ((e = ST.nextEv(S))) { ST.choose(S, e, pickEvent(S, e, rnd)); stat.ev++; if (ST.checkEnd(S)) break; }
    if (S.over) break;
    if (!stat.rkDay[S.rk]) stat.rkDay[S.rk] = dayBefore;
    if (S.coins > 150) buyStuff(S);
  }
  if (!S.endId) ST.checkEnd(S);
  for (let r = 0; r <= S.rk; r++) if (!stat.rkDay[r]) stat.rkDay[r] = S.day;
  return { S, stat };
}
const types = ["dance", "vocal", "talk", "guts"];
const out = {};
for (const skill of (process.env.SKILLS ? process.env.SKILLS.split(",").map(Number) : [.25, .4, .55, .7, .85, .95])) {
  const rs = []; const endings = {};
  for (let i = 0; i < RUNS; i++) { const r = runCareer(1000 + i * 17, skill, types[i % 4]); rs.push(r); const id = r.S.endId; (global.__rel = global.__rel || []).push(r.S.rel); endings[id] = (endings[id] || 0) + 1; }
  const avg = f => rs.reduce((a, r) => a + f(r), 0) / rs.length;
  const rks = rs.map(r => r.S.rk).sort((a, b) => a - b);
  out[skill] = { fans: avg(r => r.S.fans), rk: avg(r => r.S.rk), rkMin: rks[0], rkMed: rks[(rks.length / 2) | 0], rkMax: rks[rks.length - 1], day: avg(r => Math.min(r.S.day, 90)), gam: avg(r => r.S.gam), hlt: avg(r => r.S.hlt), coins: avg(r => r.S.coins), pachiNet: avg(r => r.S.pachiNet), s3: avg(r => r.S.cnt.s3 || 0), chal: avg(r => r.stat.chal), ev: avg(r => r.stat.ev), endings };
  const o = out[skill];
  if (global.__rel) { const mx = k => Math.max(...global.__rel.map(r => r[k])), av = k => global.__rel.reduce((a, r) => a + r[k], 0) / global.__rel.length; console.log(`   rel avg/max  rival ${av('rival').toFixed(0)}/${mx('rival')}  haru ${av('haru').toFixed(0)}/${mx('haru')}  mika ${av('mika').toFixed(0)}/${mx('mika')}  master ${av('master').toFixed(0)}/${mx('master')}`); global.__rel = null; }
  console.log(`skill ${skill}  fans ${Math.round(o.fans).toLocaleString().padStart(9)}  rank avg ${o.rk.toFixed(1)} (min ${o.rkMin} med ${o.rkMed} max ${o.rkMax})  day ${o.day.toFixed(0)}  hlt ${o.hlt.toFixed(0)}  gam ${o.gam.toFixed(0)}  coins ${Math.round(o.coins)}  ★3 ${o.s3.toFixed(0)}  chal ${o.chal.toFixed(0)}  ev ${o.ev.toFixed(0)}`);
  console.log("   endings:", Object.entries(endings).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ":" + v).join(" "));
  const rd = []; for (let r = 1; r < 12; r++) { const ds = rs.map(x => x.stat.rkDay[r]).filter(Boolean); rd.push(ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) + "(" + ds.length + ")" : "-"); }
  console.log("   rank-reach day:", rd.join(" "));
}
