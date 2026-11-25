// AREUSO 戦闘エンジンの ボットテスト：node tools/us-test.js [runs=6]
global.window = global; const path = require("path"), D = path.join(__dirname, "..", "js");
require(path.join(D, "us-data.js")); require(path.join(D, "us-core.js")); require("./us-bot.js");
const US = global.US, RUNS = +(process.argv[2] || 6);
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log("  ✗ " + m); } };
function fight(stage, hero, skill, seed, diff) {
    const B = US.newBattle({ stage, hero, seed, diff: diff || 2 }); US.begin(B); const bot = USBOT.make(skill, seed * 3 + 1); const dt = 1 / 60; let n = 0, maxE = 0;
    while (B.state === "play" && n++ < 60 * 60 * 12) {
        const inp = bot(B, dt); US.step(B, dt, inp); B.ev.length = 0; maxE = Math.max(maxE, B.E.length);
        const P = B.P; if (!(isFinite(P.x) && isFinite(P.z) && isFinite(P.hp))) { ok(false, `NaN player ${stage}/${hero}`); break; }
        for (const e of B.E) if (!(isFinite(e.x) && isFinite(e.z) && isFinite(e.hp))) { ok(false, `NaN enemy ${e.type}`); n = 1e9; break; }
    }
    return { B, n, maxE };
}
const heroes = US.HEROES.map(h => h.id), stages = US.STAGES.map(s => s.id);
console.log("stage  hero     skill  clear%  avg-time(par)  avg-dmgTaken%  rank  maxEnemies");
for (const sk of [.35, .7, .95]) {
    for (const st of stages) {
        for (const hr of heroes) {
            let c = 0, tt = 0, dmg = 0, ranks = {}, mx = 0;
            for (let i = 0; i < RUNS; i++) { const r = fight(st, hr, sk, 100 + i * 7); const B = r.B; mx = Math.max(mx, r.maxE); if (B.state === "clear") { c++; tt += B.t; dmg += B.dmgTaken / B.P.maxhp; ranks[B.stats.rank] = (ranks[B.stats.rank] || 0) + 1; } if (r.n >= 60 * 60 * 12) ok(false, `timeout ${st}/${hr}`); }
            console.log(`${st}  ${hr.padEnd(8)} ${sk}   ${String(Math.round(c / RUNS * 100)).padStart(4)}%   ${c ? Math.round(tt / c) : "-"}s (${US.STAGEMAP[st].par})   ${c ? Math.round(dmg / c * 100) : "-"}%   ${Object.entries(ranks).map(([k, v]) => k + v).join("")}   ${mx}`);
        }
    }
}
console.log(fails ? "FAILED " + fails : "OK (no NaN / timeouts)"); process.exit(fails ? 1 : 0);
