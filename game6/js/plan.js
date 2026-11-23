"use strict";
// ===== 100この事件（第1〜20章 × 各5話）の「なかみ」を、プレイヤーごとに 1回だけ 決める =====
// ・人の名前・「好きな◯◯」は、100この事件ぜんぶのなかで、ひとつも かぶらない（同じ文字列は 二度と出さない）。
//   （時間・順番の項目だけは、くりかえしてOK）
// ・被害者・犯人は、話ごとに ランダム。
// ・seed を保存しておけば、あとから開いても 同じ話になる（「さいしょから」を押すと、あたらしい seed でぜんぶ作りなおす）。
// ・虫に関することばは、pools.js の ブロックリスト で ぜったいに 出さない。
(function(root){
  var P = (typeof require === "function" && typeof module !== "undefined") ? require("./pools.js") : root.SuiriPools;
  var S = (typeof require === "function" && typeof module !== "undefined") ? require("./story.js") : root.SuiriStory;
  var CAST = (typeof require === "function" && typeof module !== "undefined") ? require("./cast.js") : root.SuiriCast;

  function rng(seed){ var a = seed >>> 0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(r, a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var RESERVED = ["切札", "勝", "島田", "相田", "島田会長", "切札 勝", "坂井"];
  var EPS = 5;

  function tryBuild(seed){
    var r = rng(seed), used = {}, bad = [];
    RESERVED.forEach(function(x){ used[x] = 1; });
    var sur = shuffle(r, P.SUR), giv = shuffle(r, P.GIVEN), si = 0, gi = 0;
    function takeName(style){
      var order = style === "sur" ? [["s"], ["g"]] : [["g"], ["s"]], k, v;
      for(var o = 0; o < 2; o++){
        if(order[o][0] === "s"){ while(si < sur.length){ v = sur[si++]; if(!used[v]){ used[v] = 1; return v; } } }
        else { while(gi < giv.length){ v = giv[gi++]; if(!used[v]){ used[v] = 1; return v; } } }
      }
      return null;
    }
    var pools = P.CATS.map(function(c){ return {c: c, vals: shuffle(r, c.vals), i: 0}; });
    function remain(p){ var n = 0; for(var k = p.i; k < p.vals.length; k++) if(!used[p.vals[k]]) n++; return n; }
    function takeVals(p, n){
      var out = [];
      while(out.length < n && p.i < p.vals.length){ var v = p.vals[p.i++]; if(!used[v]){ used[v] = 1; out.push(v); } }
      return out;
    }
    var eps = [], c, e;
    for(c = 0; c < S.CH.length; c++){ eps[c] = []; }
    // 1) 名前
    for(c = 0; c < S.CH.length; c++){
      var ch = S.CH[c];
      for(e = 0; e < EPS; e++){
        var style = c < 2 ? "kana" : (r() < 0.5 ? "sur" : "kana"), names = [];
        for(var q = 0; q < ch.n; q++){ var nm = takeName(style); if(nm === null) return null; names.push(nm); }
        var rs = shuffle(r, CAST[c].roles.map(function(_, i){ return i; })).slice(0, ch.n);
        var victim = Math.floor(r() * ch.n), culprit; do{ culprit = Math.floor(r() * ch.n); }while(culprit === victim);
        eps[c][e] = {c: c, e: e, n: ch.n, m: ch.m, names: names, roleIdx: rs, likes: [], victim: victim, culprit: culprit,
          order: e === 2 || e === 4, toff: Math.floor(r() * (10 - ch.n + 1)), eseed: Math.floor(r() * 2147483647)};
      }
    }
    // 2) 「好きな◯◯」：人数の多い話から先に くばる（あとで 足りなくならないように）
    var jobs = [];
    for(c = 0; c < S.CH.length; c++) for(e = 0; e < EPS; e++) for(var j = 0; j < S.CH[c].m - 1; j++) jobs.push({c: c, e: e, n: S.CH[c].n, r: r()});
    jobs.sort(function(a, b){ return b.n - a.n || a.r - b.r; });
    for(var jj = 0; jj < jobs.length; jj++){
      var jb = jobs[jj], ep = eps[jb.c][jb.e], hero = !!S.CH[jb.c].hero, cand = [], tot = 0;
      pools.forEach(function(p){
        if(p.c.hero && !hero) return;
        if(ep.likes.some(function(l){ return l.id === p.c.id; })) return;
        var rem = remain(p); if(rem < jb.n) return;
        var w = rem * (p.c.hero ? 2.5 : 1); cand.push({p: p, w: w}); tot += w;
      });
      if(!cand.length) return null;
      var x = r() * tot, pick = cand[cand.length - 1].p;
      for(var ci = 0; ci < cand.length; ci++){ x -= cand[ci].w; if(x <= 0){ pick = cand[ci].p; break; } }
      ep.likes.push({id: pick.c.id, label: pick.c.label, noun: pick.c.label.replace(/^好きな/, ""), vals: takeVals(pick, jb.n)});
    }
    // 3) 虫の言葉が 1つでも入っていないか（念のため）
    for(c = 0; c < eps.length; c++) for(e = 0; e < EPS; e++){
      var b = bugIn(eps[c][e].names.join("|") + "|" + eps[c][e].likes.map(function(l){ return l.label + l.vals.join("|"); }).join("|"));
      if(b) bad.push(b);
    }
    if(bad.length) return null;
    return {seed: seed, eps: eps};
  }
  function bugIn(text){
    var i, w;
    for(i = 0; i < P.BAD_SUB.length; i++) if(text.indexOf(P.BAD_SUB[i]) >= 0) return P.BAD_SUB[i];
    for(i = 0; i < P.BAD_EMOJI.length; i++) if(text.indexOf(P.BAD_EMOJI[i]) >= 0) return P.BAD_EMOJI[i];
    var parts = text.split("|");
    for(i = 0; i < parts.length; i++) if(P.BAD_EXACT.indexOf(parts[i]) >= 0) return parts[i];
    return null;
  }
  function build(seed){
    seed = (seed >>> 0) || 1;
    for(var k = 0; k < 40; k++){ var p = tryBuild((seed + k * 7919) >>> 0); if(p){ p.seed = seed; return p; } }
    throw new Error("plan: ことばが 足りません（pools.js を ふやしてください）");
  }
  // 100こ ぜんぶで、名前・好きなもの が ひとつも かぶっていないか（かぶり／虫の言葉があれば、その一覧を返す）
  function check(plan){
    var seen = {}, dup = [], bugs = [];
    function add(s, where){ if(seen[s]) dup.push(s + "（" + seen[s] + " と " + where + "）"); else seen[s] = where; var b = bugIn(s); if(b) bugs.push(s + "<" + b); }
    plan.eps.forEach(function(row, c){ row.forEach(function(ep, e){
      var w = "第" + (c + 1) + "章" + (e + 1) + "話";
      ep.names.forEach(function(nm){ add(nm, w); });
      ep.likes.forEach(function(l){ l.vals.forEach(function(v){ add(v, w); }); });
    }); });
    return {dup: dup, bugs: bugs, count: Object.keys(seen).length};
  }
  var api = {build: build, check: check, bugIn: bugIn, rng: rng, shuffle: shuffle, EPS: EPS};
  if(typeof module !== "undefined") module.exports = api; else root.SuiriPlan = api;
})(typeof window !== "undefined" ? window : this);
