"use strict";
// 推理パズルの自動生成。2つの表（A=順番のある項目 / B=ふつうの項目）× 人 n 人。
// 「手がかりだけで必ず 1 つに決まる」ことを、人が使う推理ルール（消去法・ひとつだけ残る）で確かめてから出す。
(function(root){
  function rng(seed){ var a = seed >>> 0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(r, a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pc(x){ var c = 0; while(x){ c++; x &= x - 1; } return c; }
  function low(x){ var i = 0; while(!(x & 1)){ x >>= 1; i++; } return i; }
  function high(x){ var i = -1; while(x){ x >>= 1; i++; } return i; }

  // ---- 推理（伝播）：人 n 人 × 項目 m 個。項目0だけ「順番のある項目」 ----
  function newDom(n, m){ var f = (1 << n) - 1, D = []; for(var k = 0; k < m; k++){ D[k] = []; for(var p = 0; p < n; p++) D[k][p] = f; } return D; }
  function copyDom(D){ return D.map(function(r){ return r.slice(); }); }
  function total(D){ var s = 0; D.forEach(function(r){ r.forEach(function(x){ s += pc(x); }); }); return s; }
  function solved(D){ for(var k = 0; k < D.length; k++) for(var i = 0; i < D[k].length; i++) if(pc(D[k][i]) !== 1) return false; return true; }
  function apply(D, c, n){
    var ch = false, k, p, q, v;
    function setd(kk, pp, nm){ if(nm !== D[kk][pp]){ D[kk][pp] = nm; ch = true; } }
    switch(c.t){
      case "eq": setd(c.k, c.p, D[c.k][c.p] & (1 << c.v)); break;
      case "multi": for(var i = 0; i < c.ks.length; i++) setd(c.ks[i], c.p, D[c.ks[i]][c.p] & (1 << c.vs[i])); break;
      case "neq": setd(c.k, c.p, D[c.k][c.p] & ~(1 << c.v)); break;
      case "either": setd(c.k, c.p, D[c.k][c.p] & ((1 << c.v) | (1 << c.w))); break;
      case "link": // 項目k1 が a の人は、項目k2 が b
        for(p = 0; p < n; p++){
          if(!(D[c.k1][p] & (1 << c.a))) setd(c.k2, p, D[c.k2][p] & ~(1 << c.b));
          if(!(D[c.k2][p] & (1 << c.b))) setd(c.k1, p, D[c.k1][p] & ~(1 << c.a));
        } break;
      case "notlink":
        for(p = 0; p < n; p++){
          if(D[c.k1][p] === (1 << c.a)) setd(c.k2, p, D[c.k2][p] & ~(1 << c.b));
          if(D[c.k2][p] === (1 << c.b)) setd(c.k1, p, D[c.k1][p] & ~(1 << c.a));
        } break;
      case "before": p = c.p; q = c.q;
        setd(0, p, D[0][p] & ((1 << high(D[0][q])) - 1));
        setd(0, q, D[0][q] & ~((1 << (low(D[0][p]) + 1)) - 1)); break;
      case "adj": p = c.p; q = c.q; var np = 0, nq = 0;
        for(v = 0; v < n; v++){
          if(D[0][p] & (1 << v)){ if((v > 0 && (D[0][q] & (1 << (v - 1)))) || (v < n - 1 && (D[0][q] & (1 << (v + 1))))) np |= 1 << v; }
          if(D[0][q] & (1 << v)){ if((v > 0 && (D[0][p] & (1 << (v - 1)))) || (v < n - 1 && (D[0][p] & (1 << (v + 1))))) nq |= 1 << v; }
        }
        setd(0, p, np); setd(0, q, nq); break;
      case "gap": p = c.p; q = c.q; var gp = 0, gq = 0;
        for(v = 0; v < n; v++){
          if((D[0][p] & (1 << v)) && v - c.d >= 0 && (D[0][q] & (1 << (v - c.d)))) gp |= 1 << v;
          if((D[0][q] & (1 << v)) && v + c.d < n && (D[0][p] & (1 << (v + c.d)))) gq |= 1 << v;
        }
        setd(0, p, gp); setd(0, q, gq); break;
    }
    for(k = 0; k < D.length; k++) for(p = 0; p < n; p++) if(!D[k][p]) return "bad";
    return ch;
  }
  function alldiff(D, n){
    var ch = false, k, p, q, v, cnt, who;
    for(k = 0; k < D.length; k++){
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
    for(k = 0; k < D.length; k++) for(p = 0; p < n; p++) if(!D[k][p]) return "bad";
    return ch;
  }
  function propagate(D, clues, n){
    for(var guard = 0; guard < 300; guard++){
      var ch = false;
      for(var i = 0; i < clues.length; i++){ var r = apply(D, clues[i], n); if(r === "bad") return false; if(r) ch = true; }
      var a = alldiff(D, n); if(a === "bad") return false; if(a) ch = true;
      if(!ch) break;
    }
    return true;
  }
  function solves(clues, n, m){ var D = newDom(n, m); return propagate(D, clues, n) && solved(D); }

  function randClue(r, n, m, S, w){
    var p = Math.floor(r() * n), q, k, v, x = r() * w.sum, t = null, acc = 0;
    for(var key in w.t){ acc += w.t[key]; if(x <= acc){ t = key; break; } }
    switch(t){
      case "eq": k = Math.floor(r() * m); return {t: "eq", k: k, p: p, v: S[k][p]};
      case "multi": var ks = [0]; for(var j = 1; j < m; j++) ks.push(j); if(m === 3 && r() < 0.5) ks.splice(Math.floor(r() * 3), 1);
        return {t: "multi", p: p, ks: ks, vs: ks.map(function(kk){ return S[kk][p]; })};
      case "neq": k = Math.floor(r() * m); do{ v = Math.floor(r() * n); }while(v === S[k][p]); return {t: "neq", k: k, p: p, v: v};
      case "either": k = Math.floor(r() * m); do{ v = Math.floor(r() * n); }while(v === S[k][p]); return {t: "either", k: k, p: p, v: Math.min(v, S[k][p]), w: Math.max(v, S[k][p])};
      case "link": var k1 = Math.floor(r() * m), k2; do{ k2 = Math.floor(r() * m); }while(k2 === k1); return {t: "link", k1: k1, a: S[k1][p], k2: k2, b: S[k2][p]};
      case "notlink": var h1 = Math.floor(r() * m), h2, pp; do{ h2 = Math.floor(r() * m); }while(h2 === h1); do{ pp = Math.floor(r() * n); }while(pp === p); return {t: "notlink", k1: h1, a: S[h1][p], k2: h2, b: S[h2][pp]};
      case "before": do{ q = Math.floor(r() * n); }while(q === p); return S[0][p] < S[0][q] ? {t: "before", p: p, q: q} : {t: "before", p: q, q: p};
      case "adj": for(var g = 0; g < 30; g++){ q = Math.floor(r() * n); if(q !== p && Math.abs(S[0][p] - S[0][q]) === 1) return {t: "adj", p: p, q: q}; } return {t: "link", k1: 0, a: S[0][p], k2: 1, b: S[1][p]};
      case "gap": for(var g2 = 0; g2 < 30; g2++){ q = Math.floor(r() * n); var d = S[0][p] - S[0][q]; if(q !== p && d >= 2 && d <= 3) return {t: "gap", p: p, q: q, d: d}; } return {t: "neq", k: 0, p: p, v: (S[0][p] + 1) % n};
    }
    return {t: "link", k1: 0, a: S[0][p], k2: 1, b: S[1][p]};
  }
  function weights(level){
    var t;
    if(level <= 0) t = {eq: 3, multi: 4, neq: 5, either: 4, link: 5, notlink: 1, before: 2, adj: 1, gap: 0};
    else if(level === 1) t = {eq: 2, multi: 3, neq: 5, either: 4, link: 5, notlink: 2, before: 3, adj: 2, gap: 1};
    else if(level === 2) t = {eq: 1, multi: 2, neq: 4, either: 4, link: 4, notlink: 3, before: 4, adj: 3, gap: 2};
    else if(level === 3) t = {eq: 0.3, multi: 1, neq: 3, either: 4, link: 3, notlink: 4, before: 5, adj: 4, gap: 3};
    else t = {eq: 0, multi: 0.5, neq: 2, either: 4, link: 2, notlink: 5, before: 6, adj: 5, gap: 4};
    var s = 0; for(var k in t) s += t[k]; return {t: t, sum: s};
  }
  function key(c){ return JSON.stringify(c); }

  // ---------- C++(WebAssembly) 版：パズル生成の本体を C++ に移植したもの ----------
  // js/game6.wasm.js（<script> で先に読みこみ）が グローバルに Game6Module を置く。
  // 読みこみは非同期なので、まだ準備できていない間は 下の JS 版（makePuzzleJS）に 自動でフォールバックする。
  var wasm = {mod: null, make: null, ready: false, failed: false};
  (function bootWasm(){
    if(typeof window === "undefined" || typeof window.Game6Module !== "function") return;
    try{
      window.Game6Module().then(function(M){
        wasm.mod = M;
        wasm.make = M.cwrap("g6_make_puzzle", "number", ["number", "number", "number", "number"]);
        wasm.ready = true;
      }, function(err){ wasm.failed = true; try{ console.warn("game6: WASM読みこみ失敗。JS版にフォールバックします。", err); }catch(_e){} });
    }catch(_e){ wasm.failed = true; }
  })();
  var CLUE_T = ["eq", "multi", "neq", "either", "link", "notlink", "before", "adj", "gap"];
  var MAX_CLUES_W = 256, MAXN_W = 10, MAXM_W = 3;
  function readPuzzleFromWasm(n, level, m, ptr){
    var F = wasm.mod.HEAPF32, idx = ptr / 4;
    var outN = F[idx], outM = F[idx + 1], outLevel = F[idx + 2], clueCount = F[idx + 3], ok = F[idx + 4];
    var o = idx + 5;
    var S = [];
    for(var k = 0; k < MAXM_W; k++){
      if(k < outM){ var row = []; for(var p = 0; p < outN; p++) row.push(F[o + k * MAXN_W + p]); S.push(row); }
    }
    o += MAXM_W * MAXN_W;
    var clues = [];
    for(var i = 0; i < clueCount; i++){
      var base = o + i * 18;
      var t = CLUE_T[F[base]] || "eq";
      var c = {t: t};
      if(t === "eq" || t === "neq"){ c.k = F[base + 1]; c.p = F[base + 2]; c.v = F[base + 3]; }
      else if(t === "either"){ c.k = F[base + 1]; c.p = F[base + 2]; c.v = F[base + 3]; c.w = F[base + 4]; }
      else if(t === "multi"){ c.p = F[base + 2]; var cnt = F[base + 11]; c.ks = []; c.vs = []; for(var j = 0; j < cnt; j++){ c.ks.push(F[base + 12 + j]); c.vs.push(F[base + 15 + j]); } }
      else if(t === "link" || t === "notlink"){ c.k1 = F[base + 5]; c.a = F[base + 6]; c.k2 = F[base + 7]; c.b = F[base + 8]; }
      else if(t === "before" || t === "adj"){ c.p = F[base + 2]; c.q = F[base + 9]; }
      else if(t === "gap"){ c.p = F[base + 2]; c.q = F[base + 9]; c.d = F[base + 10]; }
      clues.push(c);
    }
    return {n: outN, m: outM, sol: {S: S}, clues: clues, level: outLevel, ok: !!ok};
  }
  function makePuzzleWasm(n, level, seed, m){
    if(n > MAXN_W || m > MAXM_W) return null; // こえる大きさは JS版にまかせる（通常は起きない）
    var ptr = wasm.make(n | 0, level | 0, seed | 0, m | 0);
    return readPuzzleFromWasm(n, level, m, ptr);
  }

  // n=人数、level=0〜4、seed、m=項目の数（2か3）。sol.S[k][人]=その人の項目kの番号
  function makePuzzle(n, level, seed, m){
    m = m || 2;
    if(wasm.ready){
      try{ var r2 = makePuzzleWasm(n, level, seed, m); if(r2) return r2; }
      catch(_e){ try{ console.warn("game6: WASM生成に失敗。JS版にフォールバックします。", _e); }catch(_e2){} }
    }
    return makePuzzleJS(n, level, seed, m);
  }
  function makePuzzleJS(n, level, seed, m){
    m = m || 2;
    var r = rng(seed), ids = Array.apply(null, Array(n)).map(function(_, i){ return i; }), S = [];
    for(var q0 = 0; q0 < m; q0++) S.push(shuffle(r, ids));
    var w = weights(level), clues = [], seen = {}, D = newDom(n, m), guard = 0;
    while(!solved(D) && guard++ < 2500){
      var best = null, bestGain = -1, cand = [];
      for(var i = 0; i < 14; i++){
        var c = randClue(r, n, m, S, w); if(seen[key(c)]) continue;
        var D2 = copyDom(D); if(!propagate(D2, clues.concat([c]), n)) continue;
        var gain = total(D) - total(D2); if(gain <= 0) continue;
        cand.push({c: c, g: gain}); if(gain > bestGain){ bestGain = gain; best = c; }
      }
      var pick = null;
      if(cand.length) pick = level >= 3 ? cand[Math.floor(r() * cand.length)].c : (level === 2 ? (r() < 0.5 ? best : cand[Math.floor(r() * cand.length)].c) : best);
      if(!pick){
        if(guard > 300){
          outer: for(var p = 0; p < n; p++) for(var k = 0; k < m; k++) if(pc(D[k][p]) > 1){ var c3 = {t: "eq", k: k, p: p, v: S[k][p]}; if(!seen[key(c3)]){ pick = c3; break outer; } }
        }
        if(!pick) continue;
      }
      seen[key(pick)] = 1; clues.push(pick);
      D = newDom(n, m); propagate(D, clues, n);
    }
    var strip = [0, 0.15, 0.6, 1, 1][level];
    if(strip > 0){
      var order = shuffle(r, clues.map(function(_, i){ return i; })), keep = clues.slice();
      order.forEach(function(idx){
        if(r() > strip) return;
        var c = clues[idx], pos = keep.indexOf(c); if(pos < 0) return;
        var tmp = keep.slice(); tmp.splice(pos, 1);
        if(solves(tmp, n, m)) keep = tmp;
      });
      clues = keep;
    } else {
      for(var e = 0, add = Math.max(2, Math.round(n * 0.7)); e < add * 6 && add > 0; e++){
        var c2 = randClue(r, n, m, S, w); if(seen[key(c2)]) continue; seen[key(c2)] = 1; clues.push(c2); add--;
      }
    }
    clues = shuffle(r, clues);
    return {n: n, m: m, sol: {S: S}, clues: clues, level: level, ok: solves(clues, n, m)};
  }
  var api = {makePuzzle: makePuzzle, solves: solves, rng: rng, shuffle: shuffle};
  if(typeof module !== "undefined") module.exports = api; else root.SuiriGen = api;
})(typeof window !== "undefined" ? window : this);
