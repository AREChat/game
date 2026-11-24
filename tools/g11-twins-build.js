#!/usr/bin/env node
"use strict";
/* ふたごの世界：ステージ（120こ）を つくって game11/js/tw-levels.js に 書きだす。
   node tools/g11-twins-build.js [数]   ・・・ できた ステージは かならず BFS で とけること・手順の 再生で クリアできることを たしかめる */
const fs = require("fs"), path = require("path");
const TW = require("../game11/js/tw-core.js");
const N = +(process.argv[2] || 120);
const out = [], t0 = Date.now(); let bad = 0, slow = 0;
for (let n = 1; n <= N; n++) {
  const t1 = Date.now(), L = TW.gen(n);
  const dt = Date.now() - t1; if (dt > 1500) slow++;
  if (!L) { console.log("NG gen", n); bad++; continue; }
  const r = TW.replay(L, L.sol);
  const again = TW.solve(L);
  if (!r.ok || again == null || again.length !== L.par) { console.log("NG verify", n, JSON.stringify(r), again && again.length, L.par); bad++; continue; }
  out.push({ n: L.n, w: L.w, A: L.A, B: L.B, ma: L.ma, mb: L.mb, par: L.par, sol: L.sol, world: L.world });
  if (n % 20 === 0 || dt > 800) console.log("…", n, "par", L.par, "world", L.world, dt + "ms");
}
const body = "/* ふたごの世界：ステージデータ（tools/g11-twins-build.js が じどうで つくる。 手で なおさない） */\n(function(root){ var L = " + JSON.stringify(out) + ";\n root.TW_LEVELS = L; if(typeof module !== \"undefined\" && module.exports) module.exports = L; })(typeof window !== \"undefined\" ? window : this);\n";
fs.writeFileSync(path.join(__dirname, "../game11/js/tw-levels.js"), body);
const pars = out.map(l => l.par);
console.log("done", out.length, "levels, bad", bad, "slow", slow, "in", ((Date.now() - t0) / 1000).toFixed(1) + "s", "par min/avg/max", Math.min(...pars), (pars.reduce((a, b) => a + b, 0) / pars.length).toFixed(1), Math.max(...pars));
process.exit(bad ? 1 : 0);
