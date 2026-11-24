"use strict";
// ===== ループ・ラボ：ゲームの ルール（画面に さわらない部分。ブラウザと Node の どちらでも 動く） =====
(function(root){
    var DIRS = {U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0]};
    function parse(level){
        var m = level.map, H = m.length, W = m[0].length, g = {W: W, H: H, cell: [], plates: {}, doors: {}, S: null, E: null, steps: level.steps, par: level.par};
        for(var y = 0; y < H; y++) for(var x = 0; x < W; x++){
            var c = m[y][x]; g.cell.push(c);
            if(c === "S") g.S = [x, y]; if(c === "E") g.E = [x, y];
            if(c >= "a" && c <= "d") (g.plates[c] = g.plates[c] || []).push([x, y]);
            if(c >= "A" && c <= "D") (g.doors[c] = g.doors[c] || []).push([x, y]);
        }
        return g;
    }
    var cellAt = function(g, x, y){ return x < 0 || y < 0 || x >= g.W || y >= g.H ? "#" : g.cell[y * g.W + x]; };
    var ghostPos = function(path, t){ return path[Math.min(t, path.length - 1)]; };
    /** t のときの 場所（ゴースト＋じぶん）から、どのトビラが ひらいているか */
    function openState(g, ghosts, me, t){
        var occ = {}; ghosts.forEach(function(p){ var q = ghostPos(p, t); occ[q[0] + "," + q[1]] = 1; }); if(me) occ[me[0] + "," + me[1]] = 1;
        var open = {}; Object.keys(g.plates).forEach(function(k){ var n = 0; g.plates[k].forEach(function(p){ if(occ[p[0] + "," + p[1]]) n++; }); open[k.toUpperCase()] = { on: n, need: g.plates[k].length, open: n === g.plates[k].length }; });
        return open;
    }
    /** 1歩すすむ。dir は U/D/L/R か null(まつ)。run = {t, me:[x,y], path:[[x,y]...]} */
    function step(g, ghosts, run, dir){
        var st = openState(g, ghosts, run.me, run.t), nx = run.me[0], ny = run.me[1], moved = false;
        if(dir && DIRS[dir]){
            var tx = nx + DIRS[dir][0], ty = ny + DIRS[dir][1], c = cellAt(g, tx, ty);
            if(c !== "#" && !(c >= "A" && c <= "D" && !st[c].open)){ nx = tx; ny = ty; moved = true; }
        }
        run.t++; run.me = [nx, ny]; run.path.push([nx, ny]);
        return {moved: moved, win: g.E[0] === nx && g.E[1] === ny};
    }
    function newRun(g){ return {t: 0, me: g.S.slice(), path: [g.S.slice()]}; }
    /** じっけん用：ゴーストが いるとき、(x,y,t) の 幅ゆうせん探索で、目的地(tx,ty)への さいたん経路（歩の列） */
    function plan(g, ghosts, goal, maxSteps){
        var key = function(x, y, t){ return (t * g.H + y) * g.W + x; }, seen = {}, q = [{x: g.S[0], y: g.S[1], t: 0, from: -1, dir: null}]; seen[key(g.S[0], g.S[1], 0)] = 1;
        for(var i = 0; i < q.length; i++){
            var n = q[i]; if(n.x === goal[0] && n.y === goal[1]){ var out = []; for(var k = i; q[k].from >= 0; k = q[k].from) out.push(q[k].dir); return out.reverse(); }
            if(n.t >= maxSteps) continue;
            var st = openState(g, ghosts, [n.x, n.y], n.t);
            ["U", "D", "L", "R", null].forEach(function(d){
                var x = n.x, y = n.y; if(d){ x += DIRS[d][0]; y += DIRS[d][1]; var c = cellAt(g, x, y); if(c === "#" || (c >= "A" && c <= "D" && !st[c].open)) return; }
                var kk = key(x, y, n.t + 1); if(seen[kk]) return; seen[kk] = 1; q.push({x: x, y: y, t: n.t + 1, from: i, dir: d});
            });
        }
        return null;
    }
    var api = {parse: parse, step: step, newRun: newRun, openState: openState, ghostPos: ghostPos, plan: plan, cellAt: cellAt, DIRS: DIRS};
    if(typeof module !== "undefined" && module.exports) module.exports = api; else root.G10Sim = api;
})(typeof window !== "undefined" ? window : this);
