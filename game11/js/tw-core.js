"use strict";
/* ふたごの世界：ルール（ぱずるの 中身）・さがす（BFS）・つくる（ステージ生成）
   ・2つの せかい A / B に それぞれ ぼうけんしゃが いて、1つの ボタンで 同時に うごく。
     B（や A）は 「きょうめい」…ボタンの 向きが 変わる（mirror=左右ぎゃく / flip=上下ぎゃく / inv=ぜんぶぎゃく / rot=右に90° / rotc=左に90°）
   ・ふたりとも ゴール（G）に のれば クリア。 おとしあな（X）に おちたら ミス。
   ・はこ（B）は 1マス おせる。 かべ・あな・ほかの はこの ほうへは おせない。
   ・スイッチ（p）：のっている あいだ「あいての せかい」の とびら（D）が あく。 はこを のせても OK。
   Node でも ブラウザでも つかえる（テスト・ステージ生成に つかう）。 */
(function(root){
    var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];   // 0=上 1=右 2=下 3=左
    var DCH = "URDL";

    function mapDir(mode, d){
        var dx = DX[d], dy = DY[d], x, y;
        switch(mode){
            case "mirror": x = -dx; y = dy; break;
            case "flip": x = dx; y = -dy; break;
            case "inv": x = -dx; y = -dy; break;
            case "rot": x = -dy; y = dx; break;
            case "rotc": x = dy; y = -dx; break;
            default: x = dx; y = dy;
        }
        for(var i = 0; i < 4; i++) if(DX[i] === x && DY[i] === y) return i;
        return d;
    }

    // ---- ステージ → 中身 ----
    function parseWorld(rows){
        var h = rows.length, w = rows[0].length, g = {w: w, h: h, wall: [], hole: [], door: [], goal: -1, start: -1, crate: -1, plate: -1, N: w * h};
        for(var y = 0; y < h; y++) for(var x = 0; x < w; x++){
            var i = y * w + x, c = rows[y][x];
            g.wall[i] = c === "#" ? 1 : 0; g.hole[i] = c === "X" ? 1 : 0; g.door[i] = c === "D" ? 1 : 0;
            if(c === "G") g.goal = i; else if(c === "S") g.start = i; else if(c === "B") g.crate = i; else if(c === "p") g.plate = i;
        }
        return g;
    }
    function open(L){ return L; }
    function compile(L){
        if(L._c) return L._c;
        var c = {A: parseWorld(L.A), B: parseWorld(L.B), ma: L.ma || "same", mb: L.mb || "same"};
        c.N = c.A.N; c.w = c.A.w; c.h = c.A.h;
        L._c = c; return c;
    }
    function startState(L){ var c = compile(L), N = c.N; return {a: c.A.start, b: c.B.start, ca: c.A.crate < 0 ? N : c.A.crate, cb: c.B.crate < 0 ? N : c.B.crate}; }

    // 1つの せかいを 1歩 すすめる。 かえり値 {p, c, dead}
    function stepWorld(g, p, crate, dir, doorsOpen, N){
        var x = p % g.w, y = (p / g.w) | 0, nx = x + DX[dir], ny = y + DY[dir];
        if(nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) return {p: p, c: crate, dead: 0};
        var t = ny * g.w + nx;
        if(g.wall[t] || (g.door[t] && !doorsOpen)) return {p: p, c: crate, dead: 0};
        if(t === crate){
            var cx = nx + DX[dir], cy = ny + DY[dir];
            if(cx < 0 || cy < 0 || cx >= g.w || cy >= g.h) return {p: p, c: crate, dead: 0};
            var ci = cy * g.w + cx;
            if(g.wall[ci] || g.hole[ci] || (g.door[ci] && !doorsOpen)) return {p: p, c: crate, dead: 0};
            return {p: t, c: ci, dead: 0};
        }
        if(g.hole[t]) return {p: t, c: crate, dead: 1};
        return {p: t, c: crate, dead: 0};
    }
    // 入力 d を うけて 次の じょうたいを かえす。 dead / won も ふくむ
    function move(L, s, d){
        var c = compile(L), N = c.N;
        var plateA = c.A.plate >= 0 && (s.a === c.A.plate || s.ca === c.A.plate);
        var plateB = c.B.plate >= 0 && (s.b === c.B.plate || s.cb === c.B.plate);
        var ra = stepWorld(c.A, s.a, s.ca, mapDir(c.ma, d), plateB, N);
        var rb = stepWorld(c.B, s.b, s.cb, mapDir(c.mb, d), plateA, N);
        var ns = {a: ra.p, b: rb.p, ca: ra.c, cb: rb.c};
        var dead = ra.dead || rb.dead;
        return {s: ns, dead: !!dead, won: !dead && ns.a === c.A.goal && ns.b === c.B.goal, moved: ns.a !== s.a || ns.b !== s.b || ns.ca !== s.ca || ns.cb !== s.cb};
    }
    function key(s, N){ return ((s.a * (N + 1) + s.b) * (N + 1) + s.ca) * (N + 1) + s.cb; }

    // BFS：いまの じょうたいから ゴールまでの さいたん 手順（文字 "URDL"）。 なければ null。 limit：しらべる じょうたいの 上限
    function solve(L, from, limit){
        var c = compile(L), N = c.N, s0 = from || startState(L), lim = limit || 600000;
        var k0 = key(s0, N), par = new Map(), q = [s0], qi = 0; par.set(k0, null);
        if(s0.a === c.A.goal && s0.b === c.B.goal) return "";
        while(qi < q.length){
            if(par.size > lim) return null;
            var s = q[qi++], ks = key(s, N);
            for(var d = 0; d < 4; d++){
                var r = move(L, s, d); if(r.dead || !r.moved) continue;
                var kn = key(r.s, N); if(par.has(kn)) continue;
                par.set(kn, {k: ks, d: d});
                if(r.won){ var out = [], cur = kn; while(par.get(cur)){ var e = par.get(cur); out.push(DCH[e.d]); cur = e.k; } return out.reverse().join(""); }
                q.push(r.s);
            }
        }
        return null;
    }
    function replay(L, sol){
        var s = startState(L), res = null;
        for(var i = 0; i < sol.length; i++){ res = move(L, s, DCH.indexOf(sol[i])); if(res.dead) return {ok: false, why: "dead@" + i}; s = res.s; }
        return {ok: !!(res && res.won) || (sol.length === 0), steps: sol.length};
    }

    // てじゅんで はこを おしたか・とびらを とおったか
    function uses(L, sol){
        var c = compile(L), s = startState(L), push = 0, door = 0;
        for(var i = 0; i < sol.length; i++){
            var r = move(L, s, DCH.indexOf(sol[i]));
            if(r.s.ca !== s.ca || r.s.cb !== s.cb) push = 1;
            if(c.A.door[r.s.a] && r.s.a !== s.a) door = 1; if(c.B.door[r.s.b] && r.s.b !== s.b) door = 1;
            s = r.s;
        }
        return {push: push, door: door};
    }

    // ---- ステージ生成 ----
    function mkRng(seed){ var a = (seed >>> 0) || 1; return function(){ a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

    // n（1〜）に おうじた むずかしさ
    function tier(n){
        var w = n <= 12 ? 5 : n <= 50 ? 6 : 7;
        var t = {size: w, holes: 0, crate: 0, plate: 0, modes: ["mirror"], ma: ["same"], dens: .16};
        if(n > 12) t.holes = n <= 30 ? 2 : 3;
        if(n > 12) t.modes = ["mirror", "flip"];
        if(n > 30) t.crate = 1;
        if(n > 50) t.modes = ["mirror", "flip", "rot", "rotc", "inv"];
        if(n > 70) t.plate = 1;
        if(n > 95) { t.ma = ["same", "mirror", "rot"]; t.holes = 4; }
        t.target = Math.round(4 + Math.pow(n, .8) * .55);
        t.walk = Math.round(t.target * 2.1 + 5);
        t.world = n <= 12 ? 1 : n <= 30 ? 2 : n <= 50 ? 3 : n <= 70 ? 4 : n <= 95 ? 5 : 6;
        return t;
    }
    function worldIndex(n){ return tier(n).world; }

    function gen(n, seed0){
        var T = tier(n), w = T.size, h = T.size, N = w * h, best = null, tries = n <= 12 ? 200 : 700;
        for(var attempt = 0; attempt < tries; attempt++){
            var R = mkRng((seed0 || 7919) * 100003 + n * 977 + attempt * 31 + 1);
            var pick = function(a){ return a[(R() * a.length) | 0]; };
            var cell = function(){ return (R() * N) | 0; };
            var mk = function(){ var g = {wall: [], hole: [], door: [], goal: -1, start: -1, crate: -1, plate: -1, w: w, h: h, N: N}; for(var i = 0; i < N; i++){ g.wall[i] = R() < T.dens ? 1 : 0; g.hole[i] = 0; g.door[i] = 0; } return g; };
            var A = mk(), B = mk(), usedA = {}, usedB = {};
            var free = function(g, u){ for(var k = 0; k < 80; k++){ var i = cell(); if(!g.wall[i] && !u[i]) return i; } return -1; };
            var sa = free(A, usedA); if(sa < 0) continue; A.start = sa; usedA[sa] = 1;
            var sb = free(B, usedB); if(sb < 0) continue; B.start = sb; usedB[sb] = 1;
            for(var k = 0; k < T.holes; k++){ var hi = free(A, usedA); if(hi >= 0){ A.hole[hi] = 1; usedA[hi] = 1; } hi = free(B, usedB); if(hi >= 0){ B.hole[hi] = 1; usedB[hi] = 1; } }
            var ma = pick(T.ma), mb = pick(T.modes);
            var serial = function(g, goal){
                var rows = [];
                for(var y = 0; y < h; y++){ var r = ""; for(var x = 0; x < w; x++){ var i = y * w + x; r += g.wall[i] ? "#" : g.hole[i] ? "X" : g.door[i] ? "D" : i === goal ? "G" : i === g.start ? "S" : i === g.crate ? "B" : i === g.plate ? "p" : "."; } rows.push(r); }
                return rows;
            };
            var L = {A: serial(A, -1), B: serial(B, -1), ma: ma, mb: mb};
            // 1) しかけの ない せかいで ランダムウォーク（あなには おちない）
            var s = startState(L), dirs = [], pa = [s.a], pb = [s.b], ok = true, last = -1;
            for(var st = 0; st < T.walk; st++){
                var cand = [0, 1, 2, 3].filter(function(d){ var r = move(L, s, d); return !r.dead && r.moved; });
                if(!cand.length){ ok = false; break; }
                if(last >= 0 && cand.length > 1 && R() < .8){ var nr = cand.filter(function(d){ return (d + 2) % 4 !== last; }); if(nr.length) cand = nr; }
                var d2 = pick(cand), r2 = move(L, s, d2); dirs.push(d2); last = d2; s = r2.s; pa.push(s.a); pb.push(s.b);
            }
            if(!ok) continue;
            // 2) しかけを あるく みちに そって つける
            var firstVisit = function(path, k){ for(var q = 0; q < k; q++) if(path[q] === path[k]) return false; return true; };
            if(T.crate){
                var cw = R() < .5 ? "A" : "B", g1 = cw === "A" ? A : B, path = cw === "A" ? pa : pb, placed = false;
                for(var z = 0; z < 40 && !placed; z++){
                    var kk = 1 + ((R() * (path.length - 2)) | 0), t = path[kk], pv = path[kk - 1];
                    if(!firstVisit(path, kk) || t === g1.start || g1.hole[t]) continue;
                    var ddx = (t % w) - (pv % w), ddy = ((t / w) | 0) - ((pv / w) | 0), cx = (t % w) + ddx, cy = ((t / w) | 0) + ddy;
                    if(cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
                    var ci = cy * w + cx; if(g1.wall[ci] || g1.hole[ci]) continue;
                    g1.crate = t; placed = true;
                }
                if(!placed) continue;
            }
            if(T.plate){
                var sw = R() < .5 ? "A" : "B", src = sw === "A" ? A : B, dst = sw === "A" ? B : A, spath = sw === "A" ? pa : pb, dpath = sw === "A" ? pb : pa, done = false;
                for(var z2 = 0; z2 < 60 && !done; z2++){
                    var k2 = 1 + ((R() * (dpath.length - 2)) | 0), dt = dpath[k2], pp = spath[k2];
                    if(dt === dpath[k2 - 1] || !firstVisit(dpath, k2) || dt === dst.start || dst.hole[dt] || dst.crate === dt) continue;
                    if(pp === src.start || src.hole[pp] || src.crate === pp || src.wall[pp]) continue;
                    dst.door[dt] = 1; src.plate = pp; done = true;
                }
                if(!done) continue;
            }
            L.A = serial(A, -1); L.B = serial(B, -1); L._c = null;
            // 3) ほんとうの ルールで おなじ 手を くりかえして、あるいた さきを ゴールに する
            s = startState(L); var good = true;
            for(var q2 = 0; q2 < dirs.length; q2++){ var r3 = move(L, s, dirs[q2]); if(r3.dead){ good = false; break; } s = r3.s; }
            if(!good) continue;
            var c = compile(L);
            if(s.a === A.start && s.b === B.start) continue;
            if(s.ca === s.a || s.cb === s.b) continue;
            if(c.A.hole[s.a] || c.B.hole[s.b] || c.A.door[s.a] || c.B.door[s.b]) continue;
            if(s.a === A.start || s.b === B.start || s.a === A.plate || s.b === B.plate || s.a === A.crate || s.b === B.crate) continue;
            L.A = serial(A, s.a); L.B = serial(B, s.b); L._c = null;
            var sol = solve(L, null, 300000);
            if(sol == null) continue;
            if(T.crate || T.plate){
                var us = uses(L, sol);
                if(T.crate && !us.push) continue;
                if(T.plate && !us.door) continue;
            }
            var cand2 = {n: n, w: w, h: h, A: L.A, B: L.B, ma: ma, mb: mb, par: sol.length, sol: sol, world: T.world};
            if(!best || cand2.par > best.par) best = cand2;
            if(best.par >= T.target) break;
        }
        return best;
    }

    root.TW = {mapDir: mapDir, compile: compile, startState: startState, move: move, solve: solve, replay: replay, gen: gen, uses: uses, tier: tier, worldIndex: worldIndex, DCH: DCH, DX: DX, DY: DY, key: key};
    if(typeof module !== "undefined" && module.exports) module.exports = root.TW;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
