"use strict";
// 推理パズルの自動生成。2つの表（A=順番のある項目 / B=ふつうの項目）× 人 n 人。
// 「手がかりだけで必ず 1 つに決まる」ことを、人が使う推理ルール（消去法・ひとつだけ残る）で確かめてから出す。
(function(root){
  function rng(seed){ var a = seed >>> 0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(r, a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pc(x){ var c = 0; while(x){ c++; x &= x - 1; } return c; }
  function low(x){ var i = 0; while(!(x & 1)){ x >>= 1; i++; } return i; }
  function high(x){ var i = -1; while(x){ x >>= 1; i++; } return i; }

  // ---- 推理（伝播）----
  function newDom(n){ var f = (1 << n) - 1, D = [[], []]; for(var k = 0; k < 2; k++) for(var p = 0; p < n; p++) D[k][p] = f; return D; }
  function copyDom(D){ return [D[0].slice(), D[1].slice()]; }
  function total(D){ var s = 0; for(var k = 0; k < 2; k++) for(var i = 0; i < D[k].length; i++) s += pc(D[k][i]); return s; }
  function solved(D){ for(var k = 0; k < 2; k++) for(var i = 0; i < D[k].length; i++) if(pc(D[k][i]) !== 1) return false; return true; }
  // 1つの手がかりで絞る。変化したら true、矛盾したら "bad"
  function apply(D, c, n){
    var ch = false, k, p, q, v, m;
    function setd(kk, pp, nm){ if(nm !== D[kk][pp]){ D[kk][pp] = nm; ch = true; } }
    switch(c.t){
      case "eq": setd(c.k, c.p, D[c.k][c.p] & (1 << c.v)); break;
      case "neq": setd(c.k, c.p, D[c.k][c.p] & ~(1 << c.v)); break;
      case "either": setd(c.k, c.p, D[c.k][c.p] & ((1 << c.v) | (1 << c.w))); break;
      case "link": // A=a の人は B=b
        for(p = 0; p < n; p++){
          if(!(D[0][p] & (1 << c.a))) setd(1, p, D[1][p] & ~(1 << c.b));
          if(!(D[1][p] & (1 << c.b))) setd(0, p, D[0][p] & ~(1 << c.a));
        } break;
      case "notlink":
        for(p = 0; p < n; p++){
          if(D[0][p] === (1 << c.a)) setd(1, p, D[1][p] & ~(1 << c.b));
          if(D[1][p] === (1 << c.b)) setd(0, p, D[0][p] & ~(1 << c.a));
        } break;
      case "before": // p の A は q の A より小さい
        m = D[0][q = c.q]; p = c.p;
        setd(0, p, D[0][p] & ((1 << high(D[0][q])) - 1));
        setd(0, q, D[0][q] & ~((1 << (low(D[0][p]) + 1)) - 1));
        break;
      case "adj":
        p = c.p; q = c.q; var np = 0, nq = 0;
        for(v = 0; v < n; v++){
          if(D[0][p] & (1 << v)){ if((v > 0 && (D[0][q] & (1 << (v - 1)))) || (v < n - 1 && (D[0][q] & (1 << (v + 1))))) np |= 1 << v; }
          if(D[0][q] & (1 << v)){ if((v > 0 && (D[0][p] & (1 << (v - 1)))) || (v < n - 1 && (D[0][p] & (1 << (v + 1))))) nq |= 1 << v; }
        }
        setd(0, p, np); setd(0, q, nq); break;
      case "gap": // p の A は q の A より ちょうど d 大きい
        p = c.p; q = c.q; var gp = 0, gq = 0;
        for(v = 0; v < n; v++){
          if((D[0][p] & (1 << v)) && v - c.d >= 0 && (D[0][q] & (1 << (v - c.d)))) gp |= 1 << v;
          if((D[0][q] & (1 << v)) && v + c.d < n && (D[0][p] & (1 << (v + c.d)))) gq |= 1 << v;
        }
        setd(0, p, gp); setd(0, q, gq); break;
    }
    for(k = 0; k < 2; k++) for(p = 0; p < n; p++) if(!D[k][p]) return "bad";
    return ch;
  }
  // 「みんな違う」の整理（ひとつだけ残る・もう決まった人の分を消す）
  function alldiff(D, n){
    var ch = false, k, p, q, v, cnt, who;
    for(k = 0; k < 2; k++){
      for(p = 0; p < n; p++) if(pc(D[k][p]) === 1){
        for(q = 0; q < n; q++) if(q !== p && (D[k][q] & D[k][p])){ D[k][q] &= ~D[k][p]; ch = true; }
      }
      for(v = 0; v < n; v++){
        cnt = 0; who = -1;
        for(p = 0; p < n; p++) if(D[k][p] & (1 << v)){ cnt++; who = p; }
        if(cnt === 0) return "bad";
        if(cnt === 1 && D[k][who] !== (1 << v)){ D[k][who] = 1 << v; ch = true; }
      }
    }
    for(k = 0; k < 2; k++) for(p = 0; p < n; p++) if(!D[k][p]) return "bad";
    return ch;
  }
  function propagate(D, clues, n){
    for(var guard = 0; guard < 200; guard++){
      var ch = false;
      for(var i = 0; i < clues.length; i++){ var r = apply(D, clues[i], n); if(r === "bad") return false; if(r) ch = true; }
      var a = alldiff(D, n); if(a === "bad") return false; if(a) ch = true;
      if(!ch) break;
    }
    return true;
  }
  function solves(clues, n){ var D = newDom(n); return propagate(D, clues, n) && solved(D); }

  // ---- 手がかりの候補 ----
  function randClue(r, n, sol, w){
    // sol = {A:[値 of 人], B:[値 of 人]}。必ず「ほんとうのこと」だけを返す
    var p = Math.floor(r() * n), q, k, v, x = r() * w.sum, t = null, acc = 0;
    for(var key in w.t){ acc += w.t[key]; if(x <= acc){ t = key; break; } }
    var S = [sol.A, sol.B];
    switch(t){
      case "eq": k = r() < 0.5 ? 0 : 1; return {t: "eq", k: k, p: p, v: S[k][p]};
      case "neq": k = r() < 0.5 ? 0 : 1; do{ v = Math.floor(r() * n); }while(v === S[k][p]); return {t: "neq", k: k, p: p, v: v};
      case "either": k = r() < 0.5 ? 0 : 1; do{ v = Math.floor(r() * n); }while(v === S[k][p]); return {t: "either", k: k, p: p, v: Math.min(v, S[k][p]), w: Math.max(v, S[k][p])};
      case "link": return {t: "link", a: sol.A[p], b: sol.B[p]};
      case "notlink": var pp; do{ pp = Math.floor(r() * n); }while(pp === p); return {t: "notlink", a: sol.A[p], b: sol.B[pp]};
      case "before": do{ q = Math.floor(r() * n); }while(q === p); return sol.A[p] < sol.A[q] ? {t: "before", p: p, q: q} : {t: "before", p: q, q: p};
      case "adj": for(var g = 0; g < 30; g++){ q = Math.floor(r() * n); if(q !== p && Math.abs(sol.A[p] - sol.A[q]) === 1) return {t: "adj", p: p, q: q}; } return {t: "link", a: sol.A[p], b: sol.B[p]};
      case "gap": for(var g2 = 0; g2 < 30; g2++){ q = Math.floor(r() * n); var d = sol.A[p] - sol.A[q]; if(q !== p && d >= 2 && d <= 3) return {t: "gap", p: p, q: q, d: d}; } return {t: "neq", k: 0, p: p, v: (sol.A[p] + 1) % n};
    }
    return {t: "link", a: sol.A[p], b: sol.B[p]};
  }
  // 難しさ 0〜4（0=とてもかんたん … 4=とてもむずかしい）
  function weights(level){
    var t;
    if(level <= 0) t = {eq: 4, neq: 5, either: 4, link: 5, notlink: 1, before: 2, adj: 1, gap: 0};
    else if(level === 1) t = {eq: 2, neq: 5, either: 4, link: 5, notlink: 2, before: 3, adj: 2, gap: 1};
    else if(level === 2) t = {eq: 1, neq: 4, either: 4, link: 4, notlink: 3, before: 4, adj: 3, gap: 2};
    else if(level === 3) t = {eq: 0.3, neq: 3, either: 4, link: 3, notlink: 4, before: 5, adj: 4, gap: 3};
    else t = {eq: 0, neq: 2, either: 4, link: 2, notlink: 5, before: 6, adj: 5, gap: 4};
    var s = 0; for(var k in t) s += t[k]; return {t: t, sum: s};
  }
  function key(c){ return JSON.stringify(c); }

  function makePuzzle(n, level, seed){
    var r = rng(seed);
    var sol = {A: shuffle(r, Array.apply(null, Array(n)).map(function(_, i){ return i; })), B: shuffle(r, Array.apply(null, Array(n)).map(function(_, i){ return i; }))};
    var w = weights(level), clues = [], seen = {}, D = newDom(n), guard = 0;
    while(!solved(D) && guard++ < 1500){
      var best = null, bestGain = -1, cand = [];
      for(var i = 0; i < 14; i++){
        var c = randClue(r, n, sol, w); if(seen[key(c)]) continue;
        var D2 = copyDom(D); if(!propagate(D2, clues.concat([c]), n)) continue;
        var gain = total(D) - total(D2); if(gain <= 0) continue;
        cand.push({c: c, g: gain});
        if(gain > bestGain){ bestGain = gain; best = c; }
      }
      var pick = null;
      if(cand.length){ pick = level >= 3 ? cand[Math.floor(r() * cand.length)].c : (level === 2 ? (r() < 0.5 ? best : cand[Math.floor(r() * cand.length)].c) : best); }
      if(!pick){ if(guard > 300){ // どうしても進まない時のしあげ（ほんとうの直接の手がかり）
          for(var p = 0; p < n; p++) for(var k = 0; k < 2; k++) if(pc(D[k][p]) > 1){ var c3 = {t: "eq", k: k, p: p, v: (k ? sol.B : sol.A)[p]}; if(!seen[key(c3)]){ pick = c3; p = n; break; } }
        } if(!pick) continue; }
      seen[key(pick)] = 1; clues.push(pick);
      D = newDom(n); propagate(D, clues, n);
    }
    // むだな手がかりをけずる（難しいほどたくさんけずる）
    var strip = [0, 0.15, 0.6, 1, 1][level];
    if(strip > 0){
      var order = shuffle(r, clues.map(function(_, i){ return i; }));
      var keep = clues.slice();
      order.forEach(function(idx){
        if(r() > strip) return;
        var c = clues[idx], pos = keep.indexOf(c); if(pos < 0) return;
        var tmp = keep.slice(); tmp.splice(pos, 1);
        if(solves(tmp, n)) keep = tmp;
      });
      clues = keep;
    } else {
      // とてもかんたん：ちょっと多めに（ほんとうのこと）
      for(var e = 0, add = Math.max(2, Math.round(n * 0.7)); e < add * 6 && add > 0; e++){
        var c2 = randClue(r, n, sol, w); if(seen[key(c2)]) continue; seen[key(c2)] = 1; clues.push(c2); add--;
      }
    }
    clues = shuffle(r, clues);
    return {n: n, sol: sol, clues: clues, level: level, ok: solves(clues, n)};
  }
  var api = {makePuzzle: makePuzzle, solves: solves, rng: rng, shuffle: shuffle};
  if(typeof module !== "undefined") module.exports = api; else root.SuiriGen = api;
})(typeof window !== "undefined" ? window : this);
