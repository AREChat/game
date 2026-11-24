// game10: ソルバーの さいしょう手順を、ほんもののルール(sim.js)で あそんで、ほんとうに クリアできるか たしかめる。  node tools/g10-sim-test.js
const fs = require("fs"); const win = {}; new Function("window", fs.readFileSync(__dirname + "/../game10/js/levels.js", "utf8"))(win);
const Sim = require("../game10/js/sim.js"); let bad = 0;
win.G10_LEVELS.forEach((lv, i) => {
  const g = Sim.parse(lv), all = []; Object.keys(g.plates).forEach((k) => g.plates[k].forEach((p) => all.push(p)));
  // ぶんしんを 1人ずつ「いちばん 早く つけるボタン」に とめていく（ボタンを ふんで たすけに なるものを ぜんぶ ためして 最少を さがす）
  let best = null;
  (function rec(ghosts, used){
    if(best && ghosts.length >= best.n) return;
    const fin = Sim.plan(g, ghosts, g.E, lv.steps - 1);
    if(fin){ best = {n: ghosts.length, finalLen: fin.length}; return; }
    if(ghosts.length >= lv.par) return;
    for(const p of all){ if(used.has(p.join(","))) continue; const path = Sim.plan(g, ghosts, p, lv.steps - 1); if(!path) continue; const run = Sim.newRun(g); path.forEach((d) => Sim.step(g, ghosts, run, d)); const u = new Set(used); u.add(p.join(",")); rec(ghosts.concat([run.path]), u); }
  })([], new Set());
  const ok = best && best.n === lv.par; if(!ok) bad++;
  console.log((ok ? "OK " : "NG ") + (i + 1) + " " + lv.name + " par=" + lv.par + " 実際=" + (best ? best.n + "人(最終 " + best.finalLen + "歩)" : "解けない"));
});
process.exit(bad ? 1 : 0);
