#!/usr/bin/env node
"use strict";
/* ことばクラフト：こたえ さがし（そうあたり）。ステージを つくる ときの 道具。
   node tools/g11-wc-solve.js <ステージ番号 または JSON> [mods=0|1] [maxShow=15] [only=ことば,ことば]
   1つの ことば（+せいしつ）を 格子の ばしょ・かくどに おいて、クリアできる ものを 数える。 */
const path = require("path");
const WC = require(path.join(__dirname, "../game11/js/wc-core.js"));
const S = require(path.join(__dirname, "../game11/js/wc-stages.js"));
const D = require(path.join(__dirname, "../game11/js/wc-dict.js"));
const arg = process.argv[2];
const st = S[+arg - 1] || JSON.parse(arg);
const useMods = process.argv[3] !== "0";
const maxShow = +(process.argv[4] || 15);
const only = process.argv[5] ? process.argv[5].split(",") : null;
const nouns = (D.NOUNS || []).map(n => n.ja[0]);
const prefixes = useMods ? ["", "おおきい ", "つよい ", "ちいさい "] : [""];
const angles = [0, 45, 90, 135, 180, -45, -90, -135, 22, -22, -60, 60];
const xs = [], ys = [];
for (let x = 40; x <= 920; x += 40) xs.push(x);
for (let y = 60; y <= 500; y += 40) ys.push(y);
let found = [], tried = 0;
const words = only || nouns;
const t0 = Date.now();
for (const nn of words) for (const pf of prefixes) {
  let hit = 0;
  for (const a of angles) for (const x of xs) for (const y of ys) {
    tried++;
    const w = WC.create(st, [{ w: pf + nn, x, y, a }]);
    let n = 0;
    while (w.status === "run" && n < 900) { WC.step(w, 15); n += 15; }
    if (w.status === "win") { hit++; found.push({ w: pf + nn, x, y, a, steps: w.steps }); }
  }
}
const by = {};
found.forEach(f => { by[f.w] = (by[f.w] || 0) + 1; });
console.log("tried", tried, "wins", found.length, "in", ((Date.now() - t0) / 1000).toFixed(0) + "s");
console.log(Object.keys(by).map(k => k + "×" + by[k]).join("  "));
found.slice(0, maxShow).forEach(f => console.log(JSON.stringify(f)));
