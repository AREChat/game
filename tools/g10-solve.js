// game10 のステージ検査：ぶんしんの最少数(par)・かかる歩数を 数えて、levels.js の 数字と くらべる。  node tools/g10-solve.js
const fs = require("fs");
const win = {}; new Function("window", fs.readFileSync(__dirname + "/../game10/js/levels.js", "utf8"))(win);
const L = win.G10_LEVELS; let bad = 0;
function parse(m){
  const H = m.length, W = m[0].length, g = {W, H, cell: [], plates: {}, S: null, E: null};
  m.forEach((r, y) => { if(r.length !== W) throw new Error("width mismatch row " + y); [...r].forEach((c, x) => { g.cell.push(c); if(c === "S") g.S = [x, y]; if(c === "E") g.E = [x, y]; if(/[a-d]/.test(c)){ (g.plates[c] = g.plates[c] || []).push([x, y]); } }); });
  return g;
}
function bfs(g, occ){   // occ: Set of "x,y" ふまれている 場所。返り値: dist map
  const open = {}; Object.keys(g.plates).forEach((k) => { open[k.toUpperCase()] = g.plates[k].every(([x, y]) => occ.has(x + "," + y)); });
  const d = new Map(); const q = [g.S]; d.set(g.S.join(","), 0);
  for(let i = 0; i < q.length; i++){
    const [x, y] = q[i], cd = d.get(x + "," + y);
    for(const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx, ny = y + dy; if(nx < 0 || ny < 0 || nx >= g.W || ny >= g.H) continue;
      const c = g.cell[ny * g.W + nx]; if(c === "#") continue; if(/[A-D]/.test(c) && !open[c]) continue;
      const k = nx + "," + ny; if(d.has(k)) continue; d.set(k, cd + 1); q.push([nx, ny]);
    }
  }
  return d;
}
L.forEach((lv, i) => {
  const g = parse(lv.map), steps = lv.steps - 1; const allPlates = []; Object.keys(g.plates).forEach((k) => g.plates[k].forEach((p) => allPlates.push(p.join(","))));
  // ぶんしんは「ボタンの上で とまる」と考える（IDDFS）
  let best = null;
  for(let n = 0; n <= allPlates.length && best === null; n++){
    (function rec(occ, left, order, maxd){
      if(best !== null) return;
      const d = bfs(g, occ);
      if(left === 0){ const e = d.get(g.E.join(",")); if(e !== undefined && e <= steps){ best = {n, order, final: e, maxd: Math.max(maxd, e)}; } return; }
      for(const p of allPlates){ if(occ.has(p)) continue; const dd = d.get(p); if(dd === undefined || dd > steps) continue; const o2 = new Set(occ); o2.add(p); rec(o2, left - 1, order.concat([p + "@" + dd]), Math.max(maxd, dd)); }
    })(new Set(), n, [], 0);
  }
  const ok = best && best.n === lv.par;
  if(!ok) bad++;
  console.log((ok ? "OK " : "NG ") + (i + 1) + " " + lv.name + "  par(file)=" + lv.par + " par(solver)=" + (best ? best.n : "解なし") + "  steps=" + lv.steps + (best ? "  最終路=" + best.final + " 最長=" + best.maxd + " 順=" + best.order.join(" ") : ""));
});
process.exit(bad ? 1 : 0);
