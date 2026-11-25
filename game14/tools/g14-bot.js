"use strict";
/* game14 ミニゲーム用 bot（Node でも ブラウザでも 使う）。skill 0..1 に おうじて 正しい操作を する。
   使い方：var step = G14BOT.make(type, skill, seed); … 毎フレーム step(g, dt) */
(function(root){
  var ST = function(){ return root.ST; };
  function make(type, skill, seed){
    var rnd = root.ST.rng(seed * 7 + 3), pressT = {};
    var noise = function(amp){ return (rnd() - .5) * 2 * amp * (1 - skill); };
    return function step(g, dt){
      var ST0 = root.ST; if(g.state !== "play") return;
      if (type === "rhythm") { for (const n of g.notes) { if (n.res) continue; if (!n.bt) n.bt = n.t + noise(.28); if (!n.pressed && g.t >= n.bt) { n.pressed = 1; if (rnd() < .35 + .65 * skill) ST0.gameAct(g, ["left", "down", "up", "right"][n.lane], true); } } }
      else if (type === "cheers") { for (const n of g.notes) { if (n.res) continue; if (!n.bt) n.bt = n.t + noise(.3); if (!n.pressed && g.t >= n.bt) { n.pressed = 1; if (rnd() < .35 + .65 * skill) ST0.gameAct(g, "a", true); } } }
      else if (type === "karaoke") {
        if (g.bo == null) { g.bo = 0; g.bv = 0; }
        g.bv += (rnd() - .5) * 2 * (1 - skill) * 1.6 * dt; g.bv *= (1 - dt * .8); g.bo = g.bv;
        const tt = Math.max(0, g.t - (1 - skill) * .45);
        const pts = g.curve; let i = 0; while (i < pts.length - 2 && pts[i + 1].t < tt) i++; const a0 = pts[i], b0 = pts[i + 1]; let u = Math.min(1, Math.max(0, (tt - a0.t) / (b0.t - a0.t))); u = (1 - Math.cos(u * Math.PI)) / 2; const tg = a0.y + (b0.y - a0.y) * u;
        const want = tg + g.bo; const dz = .02; ST0.gameAct(g, "up", false); ST0.gameAct(g, "down", false); if (g.cur > want + dz) ST0.gameAct(g, "up", true); else if (g.cur < want - dz) ST0.gameAct(g, "down", true); }
      else if (type === "timing") { if (g.wait <= 0) { if (g.pt == null || g.ptr !== g.round) { g.ptr = g.round; g.pt = (g.c + noise(.3) * 1.2); } if ((g.dir > 0 && g.x >= g.pt) || (g.dir < 0 && g.x <= g.pt)) { if (g.pt != null) { ST0.gameAct(g, "a", true); g.pt = null; } } } }
      else if (type === "mash") { if (!pressT.m) pressT.m = 0; pressT.m += dt; const rate = 3 + 10 * skill; while (pressT.m >= 1 / rate) { pressT.m -= 1 / rate; ST0.gameAct(g, "a", true); } }
      else if (type === "mood") { if (g.pause <= 0 && !g.botT) g.botT = g.qT + .4 + (1 - skill) * 1.8; if (g.pause <= 0 && g.qT >= g.botT) { g.botT = 0; const ans = g.opts.indexOf(g.ans); const pick = rnd() < .3 + .7 * skill ? ans : (ans + 1 + Math.floor(rnd() * 3)) % 4; g.sel = pick; ST0.gameAct(g, "a", true); } }
      else if (type === "scan") { if (g.pause <= 0 && !g.botT) g.botT = g.qT + .8 + (1 - skill) * 3; if (g.pause <= 0 && g.qT >= g.botT) { g.botT = 0; const pick = rnd() < .35 + .65 * skill ? g.oi : Math.floor(rnd() * g.n * g.n); g.cur = pick; ST0.gameAct(g, "a", true); } }
      else if (type === "react") { if (g.pause <= 0) { if (g.sig) { if (!g.botT) g.botT = g.rT + .2 + (1 - skill) * .5; if (g.rT >= g.botT) { g.botT = 0; ST0.gameAct(g, "a", true); } } else g.botT = 0; } }
      else if (type === "memory") { if (g.phase === "input") { if (!g.botT) g.botT = g.t + .25; if (g.t >= g.botT) { g.botT = 0; const want = g.seq[g.pi]; const p = rnd() < .5 + .5 * skill ? want : Math.floor(rnd() * 4); ST0.gameAct(g, ["up", "right", "down", "left"][p], true); } } else g.botT = 0; }
      else if (type === "dart") { if (g.pause <= 0) { if (g.thr == null || g.thrN !== g.tn) { g.thrN = g.tn; g.thr = .03 + (1 - skill) * (.05 + .35 * rnd()); g.lag = (1 - skill) * .12 * rnd(); g.lagT = null; } const r = Math.hypot((g.cx - .5) * g.asp, g.cy - .5); if (r < g.thr) { if (g.lagT == null) g.lagT = g.lag; g.lagT -= dt; if (g.lagT <= 0) ST0.gameAct(g, "a", true); } else g.lagT = null; } }
      else if (type === "catch") { let tgt = null; for (const it of g.items) { if (!it.good || it.y < 0) continue; if (!tgt || it.y > tgt.y) tgt = it; }
        let want = tgt ? tgt.x + (rnd() - .5) * (1 - skill) * .25 : g.x;
        if (rnd() < skill * .9 + .05) for (const it of g.items) { if (it.good || it.y < .35 || it.y > .9) continue; const dx = want - it.x; if (Math.abs(dx) < g.bw + .09) want = it.x + (dx >= 0 ? 1 : -1) * (g.bw + .1); }
        ST0.gameAct(g, "left", false); ST0.gameAct(g, "right", false); if (g.x > want + .02) ST0.gameAct(g, "left", true); else if (g.x < want - .02) ST0.gameAct(g, "right", true); }
      else if (type === "pachi") { if (!g.ball && g.cool <= 0 && g.fired < g.balls) { if (g.pthr == null || g.pN !== g.fired) { g.pN = g.fired; g.pthr = .02 + (1 - skill) * (.1 + .6 * rnd()); } if (Math.abs(g.pw - .5) < g.pthr) { g.pthr = null; ST0.gameAct(g, "a", true); } } }
    };
  }
  // 画面なしで 最後まで すすめる（テスト用）
  function runFast(g, step, maxSec){
    var dt = 1 / 60, n = 0, lim = (maxSec || 200) * 60;
    while (!g.done && n++ < lim) { root.ST.stepGame(g, dt); step(g, dt); }
    return g.done;
  }
  root.G14BOT = {make: make, runFast: runFast};
  if (typeof module !== "undefined" && module.exports) module.exports = root.G14BOT;
})(typeof window !== "undefined" ? window : globalThis);
