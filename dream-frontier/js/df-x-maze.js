// ===== ミラー・ラビリンス（3D めいろ）=====
//  11×11 の ガラスの めいろ。ほしを 3こ あつめると ゴールの ゲートが ひらく。ぜんぶで 3パターン（のるたびに かわる）。
//  ちず（ちかくだけ）・ヒント（E：ナビが みちを おしえる。3かいまで）つき。240びょう いない。
import {TAU, clamp, lerp, rng, wrapPi, root, clearRoot, el, bodyOn, circleRects} from "./df-xlib.js";

const CX = -1300, CZ = -1300, N = 11, C = 4.4, WALL_H = 3.4, TH = .44, NEED = 3, NSTAR = 8, TIME = 240;
const THEME = [{w: "#8a6ad8", t: "#d8c8ff", f: "#3a2a68", p: "#b89aff"}, {w: "#4ab0e0", t: "#c8f0ff", f: "#1e3a5a", p: "#8ae0ff"}, {w: "#e07aa8", t: "#ffd0e4", f: "#5a2a48", p: "#ff9ac8"}];
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];   // 0:+z(北) 1:+x(東) 2:-z 3:-x
const ox = (v) => CX + (v - 1) * 90 - N * C / 2, oz = () => CZ - N * C / 2;

// ---- めいろを つくる（さいきてき バックトラック）。open[x][z][dir] ----
export function genMaze(v){
    const r = rng(1234 + v * 7919), open = []; for(let x = 0; x < N; x++){ open.push([]); for(let z = 0; z < N; z++) open[x].push([false, false, false, false]); }
    const seen = []; for(let x = 0; x < N; x++) seen.push(new Array(N).fill(false));
    const st = [[0, 0]]; seen[0][0] = true;
    while(st.length){
        const [x, z] = st[st.length - 1], nb = [];
        for(let d = 0; d < 4; d++){ const nx = x + DIRS[d][0], nz = z + DIRS[d][1]; if(nx >= 0 && nz >= 0 && nx < N && nz < N && !seen[nx][nz]) nb.push(d); }
        if(!nb.length){ st.pop(); continue; }
        const d = nb[Math.floor(r() * nb.length)], nx = x + DIRS[d][0], nz = z + DIRS[d][1];
        open[x][z][d] = true; open[nx][nz][(d + 2) % 4] = true; seen[nx][nz] = true; st.push([nx, nz]);
    }
    // すこし 道を ふやす（ぐるぐる まわれる ところを 作る）
    for(let k = 0; k < 9; k++){ const x = 1 + Math.floor(r() * (N - 2)), z = 1 + Math.floor(r() * (N - 2)), d = Math.floor(r() * 4); open[x][z][d] = true; open[x + DIRS[d][0]][z + DIRS[d][1]][(d + 2) % 4] = true; }
    return open;
}
export function bfs(open, from, to){   // からへ の セルの みちすじ（[x,z] の 配列）
    const prev = {}, q = [from], key = (c) => c[0] * N + c[1]; prev[key(from)] = -1;
    while(q.length){
        const c = q.shift(); if(c[0] === to[0] && c[1] === to[1]) break;
        for(let d = 0; d < 4; d++){ if(!open[c[0]][c[1]][d]) continue; const n = [c[0] + DIRS[d][0], c[1] + DIRS[d][1]]; if(prev[key(n)] !== undefined) continue; prev[key(n)] = key(c); q.push(n); }
    }
    if(prev[key(to)] === undefined) return null;
    const path = []; let k = key(to); while(k !== -1){ path.push([Math.floor(k / N), k % N]); k = prev[k]; } return path.reverse();
}
const cellCenter = (v, x, z) => [ox(v) + (x + .5) * C, oz() + (z + .5) * C];
const cellOf = (v, px, pz) => [clamp(Math.floor((px - ox(v)) / C), 0, N - 1), clamp(Math.floor((pz - oz()) / C), 0, N - 1)];
export function wallRects(v, open, gateClosed){
    const rects = [], h = TH / 2, o = [ox(v), oz()];
    for(let i = 0; i <= N; i++) for(let j = 0; j < N; j++){
        // 南北に のびる かべ（x = i の せん、z = j〜j+1）：セル (i-1,j) と (i,j) の あいだ
        const closedV = i === 0 || i === N || !open[i - 1][j][1];
        if(closedV) rects.push({x0: o[0] + i * C - h, x1: o[0] + i * C + h, z0: o[1] + j * C - h, z1: o[1] + (j + 1) * C + h});
        // 東西に のびる かべ（z = i の せん、x = j〜j+1）
        let closedH = i === 0 || i === N || !open[j][i - 1][0];
        if(i === N && j === N - 1) closedH = !!gateClosed;   // ゴールの 出口（ゲート）
        if(closedH) rects.push({x0: o[0] + j * C - h, x1: o[0] + (j + 1) * C + h, z0: o[1] + i * C - h, z1: o[1] + i * C + h});
    }
    return rects;
}
function starCells(v, open){
    const r = rng(777 + v * 31), cand = [];
    for(let x = 0; x < N; x++) for(let z = 0; z < N; z++){ if((x === 0 && z === 0) || (x === N - 1 && z === N - 1)) continue; const n = open[x][z].filter(Boolean).length; if(n === 1) cand.push([x, z]); }
    for(let i = cand.length - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    const out = cand.slice(0, NSTAR);
    while(out.length < NSTAR){ const c = [Math.floor(r() * N), Math.floor(r() * N)]; if(!(c[0] === 0 && c[1] === 0) && !out.some((q) => q[0] === c[0] && q[1] === c[1])) out.push(c); }
    return out;
}

export const maze = {
    build(K){
        const {box, cyl, sph, pln} = K.h, L = K.mk("maze", {tex: "tile", glowTint: [.8, .8, .8, .8]}), S = L.solid, G = L.ground, GL = L.glow;
        for(let v = 0; v < 3; v++){
            const open = genMaze(v), T = THEME[v], o = [ox(v), oz()];
            pln(G, o[0] + N * C / 2, 0, o[1] + N * C / 2, N * C + 14, N * C + 14, T.f, 22, 22);
            for(let x = 0; x < N; x++) for(let z = 0; z < N; z++) if((x + z) % 2 === 0) pln(G, o[0] + (x + .5) * C, .02, o[1] + (z + .5) * C, C - .3, C - .3, T.f === "#3a2a68" ? "#4a3a80" : T.f, 1, 1);
            for(const w of wallRects(v, open, false)){
                const cx = (w.x0 + w.x1) / 2, cz = (w.z0 + w.z1) / 2, ww = w.x1 - w.x0, dd = w.z1 - w.z0;
                box(S, cx, 0, cz, ww, WALL_H, dd, T.w); box(GL, cx, WALL_H, cz, ww + .04, .14, dd + .04, T.t);
            }
            for(let i = 0; i <= N; i++) for(let j = 0; j <= N; j++){ cyl(S, o[0] + i * C, 0, o[1] + j * C, .34, .34, WALL_H + .35, T.p, 6); sph(GL, o[0] + i * C, WALL_H + .6, o[1] + j * C, .26, T.t, 1, 5); }
            // スタートの ゲートと ゴールの アーチ
            const sx = o[0] + C / 2, sz = o[1] - .1; box(GL, sx, 0, sz, 3.4, .12, .4, "#7affd8");
            const gx = o[0] + (N - .5) * C, gz = o[1] + N * C + 5; box(S, gx - 2.4, 0, gz, .5, 6, .5, T.p); box(S, gx + 2.4, 0, gz, .5, 6, .5, T.p); box(GL, gx, 6, gz, 5.4, .4, .5, "#ffe27a"); for(let k = 0; k < 8; k++) sph(GL, gx + Math.cos(k * .8) * 1.6, 5.2 + Math.sin(k * 2) * .4, gz, .3, "#ffe27a", 1, 5);
        }
    },
    init(g, R, a){
        const v = ((g.sv.mazeN = (g.sv.mazeN || 0) + 1) - 1) % 3, open = genMaze(v), stars = starCells(v, open).map((c) => ({c, got: false, p: cellCenter(v, c[0], c[1])}));
        const st = cellCenter(v, 0, 0), north = open[0][0][0];
        Object.assign(R, {v, open, stars, got: 0, x: st[0], z: st[1], yaw: north ? 0 : Math.PI / 2, pitch: 0, bob: 0, hints: 3, hintT: 0, seen: Array.from({length: N}, () => new Array(N).fill(false)), trail: [], gate: true, rects: wallRects(v, open, true), win: false, fin: 0, tgtPath: null, T: TIME});
        R.start = [R.x, R.z];
        ensure(R);
    },
    update(g, R, dt, inp){
        const T = THEME[R.v]; R.T = TIME - R.t;
        if(!R.fin){
            let yaw = R.yaw, mx = inp.mx || 0, my = inp.my || 0, run = inp.run;
            if(R.auto){ const bot = autoBot(R); mx = 0; my = bot.my; run = true; R.yaw += clamp(wrapPi(bot.yaw - R.yaw), -4.5 * dt, 4.5 * dt); R.pitch *= .9; }
            else { R.yaw -= (inp.lx || 0); R.pitch = clamp(R.pitch - (inp.ly || 0), -.6, .6); }
            yaw = R.yaw; const sp = (run ? 6.2 : 4.4) * dt, fw = [Math.sin(yaw), Math.cos(yaw)], rt = [-Math.cos(yaw), Math.sin(yaw)];
            let dx = fw[0] * my + rt[0] * mx, dz = fw[1] * my + rt[1] * mx; const l = Math.hypot(dx, dz); if(l > 1){ dx /= l; dz /= l; }
            const [nx, nz] = circleRects(R.x + dx * sp, R.z + dz * sp, .38, R.rects); if(l > .1) R.bob += dt * (run ? 11 : 8); R.x = nx; R.z = nz;
            // ほしを とる／ちずの きおく
            const c = cellOf(R.v, R.x, R.z); for(let i = -1; i <= 1; i++) for(let j = -1; j <= 1; j++){ const a = c[0] + i, b = c[1] + j; if(a >= 0 && b >= 0 && a < N && b < N) R.seen[a][b] = true; }
            for(const s of R.stars) if(!s.got && Math.hypot(s.p[0] - R.x, s.p[1] - R.z) < 1.25){ s.got = true; R.got++; g.sfx("coin"); g.ui.toast("⭐ ほし " + R.got + "/" + NEED + (R.got === NEED ? "  ゲートが ひらいた！ ゴールへ！" : ""), 2400); if(R.got === NEED){ R.gate = false; R.rects = wallRects(R.v, R.open, false); g.sfx("fan"); } }
            // ヒント
            if(R.hintT > 0) R.hintT -= dt;
            if((inp.act || R.auto && false) && R.hintT <= 0){ if(R.hints > 0){ R.hints--; R.hintT = 6; R.tgtPath = null; g.sfx("clue"); } else g.ui.toast("ヒントは もう ないよ", 1600); }
            // ゴール
            if(R.z > oz() + N * C + 1.5 && !R.gate){ R.fin = 1; R.win = true; const bonus = R.T > 120 ? 10 : 0; g.sv.best_maze = Math.max(g.sv.best_maze || 0, Math.round(R.T)); g.ui.toast("🎉 ゴール！ のこり " + Math.round(R.T) + "びょう で ぬけだした！" + (bonus ? "  ボーナス +10コイン" : ""), 4600); g.sv.coins += bonus; g.sfx("gold"); R.finT = R.t; }
            else if(R.T <= 0){ R.fin = 1; R.win = false; g.ui.toast("じかんぎれ…！ もういちど ちょうせん しよう", 4200); g.sfx("ng"); R.finT = R.t; }
        } else if(R.t - R.finT > 2.4) g.endRide(R.win, true);
        draw(R);
    },
    camera(g, R){ return {eye: [R.x, 1.65 + Math.sin(R.bob) * .05, R.z], yaw: R.yaw, pitch: R.pitch, fov: 74}; },
    dyn(g, R, D){
        const T = g.t;
        for(const s of R.stars) if(!s.got) D.push({m: "star", x: s.p[0], y: 1.1 + Math.sin(T * 2 + s.c[0]) * .2, z: s.p[1], yaw: T * 1.6, sx: .9, sy: .9, sz: .9}), D.push({s: "glow", x: s.p[0], y: 1.2, z: s.p[1], w: 2.2, h: 2.2, c: [1, .9, .4], a: .55});
        if(R.gate){ const gx = ox(R.v) + (N - .5) * C, gz = oz() + N * C; for(let k = 0; k < 5; k++) D.push({s: "glow", x: gx + (k - 2) * .8, y: 1.6, z: gz, w: .9, h: 3.4, c: [1, .5, .7], a: .6}); }
        else { const gx = ox(R.v) + (N - .5) * C, gz = oz() + N * C + 5; for(let k = 0; k < 6; k++){ const a = T * 2 + k; D.push({s: "star", x: gx + Math.cos(a) * 2.4, y: 3 + Math.sin(a * 1.3) * 1.2, z: gz + Math.sin(a) * .8, w: .7, h: .7, c: [1, .9, .5], a: 1}); } }
        if(R.hintT > 0 && !R.fin){   // ナビが ゴール（か ちかい ほし）への みちを あんない
            const path = hintPath(R); if(path && path.length > 1){ const nx = path[1], p = cellCenter(R.v, nx[0], nx[1]); const dx = p[0] - R.x, dz = p[1] - R.z, d = Math.hypot(dx, dz) || 1, k = Math.min(2.6, d);
                D.push({m: "navi", x: R.x + dx / d * k, y: 1.5 + Math.sin(T * 3) * .1, z: R.z + dz / d * k, yaw: T * 2}); }
        }
    },
    hud(R){ return "ほし " + R.got + "/" + NEED + "（ぜんぶで " + NSTAR + "）　のこり " + Math.max(0, Math.ceil(R.T)) + "びょう　ヒント " + R.hints + "（E）"; },
    end(g, R){ clearRoot(); bodyOn("maze", false); }
};

function hintPath(R){
    if(R.tgtPath && R.tgtPathAt && Math.abs(R.tgtPathAt - R.t) < .35) return R.tgtPath;
    const c = cellOf(R.v, R.x, R.z); let best = null;
    if(R.got >= NEED) best = bfs(R.open, c, [N - 1, N - 1]);
    else for(const s of R.stars){ if(s.got) continue; const p = bfs(R.open, c, s.c); if(p && (!best || p.length < best.length)) best = p; }
    R.tgtPath = best; R.tgtPathAt = R.t; return best;
}
function autoBot(R){
    const path = hintPath(R); let tx, tz;
    if(R.got >= NEED && path && path.length <= 1){ tx = ox(R.v) + (N - .5) * C; tz = oz() + N * C + 3; }
    else if(path && path.length > 1){ const p = cellCenter(R.v, path[1][0], path[1][1]); tx = p[0]; tz = p[1]; }
    else if(path && path.length === 1){ const s = R.stars.find((q) => !q.got && q.c[0] === path[0][0] && q.c[1] === path[0][1]); if(s){ tx = s.p[0]; tz = s.p[1]; } else { tx = R.x; tz = R.z + 1; } }
    else { tx = R.x; tz = R.z + 1; }
    return {yaw: Math.atan2(tx - R.x, tz - R.z), my: 1};
}
function ensure(R){
    bodyOn("maze", true); const r = root(); clearRoot();
    const cv = el("canvas", "xmap", "", "width:150px;height:150px;right:10px;top:104px"); cv.width = 300; cv.height = 300; r.appendChild(cv); R.map = cv; R.mctx = cv.getContext("2d");
}
function draw(R){
    const c = R.mctx, W = 300, T = THEME[R.v], s = W / (N * C + 4), px = (x) => W - (x - ox(R.v) + 2) * s, pz = (z) => W - (z - oz() + 2) * s;
    c.clearRect(0, 0, W, W);
    c.strokeStyle = T.t; c.lineWidth = 3; c.lineCap = "round";
    for(let i = 0; i <= N; i++) for(let j = 0; j < N; j++){
        const seenV = (a, b) => a >= 0 && b >= 0 && a < N && b < N && R.seen[a][b];
        if((seenV(i - 1, j) || seenV(i, j)) && (i === 0 || i === N || !R.open[i - 1][j][1])){ c.beginPath(); c.moveTo(px(ox(R.v) + i * C), pz(oz() + j * C)); c.lineTo(px(ox(R.v) + i * C), pz(oz() + (j + 1) * C)); c.stroke(); }
        let closedH = i === 0 || i === N || !R.open[j][i - 1][0]; if(i === N && j === N - 1) closedH = R.gate;
        if((seenV(j, i - 1) || seenV(j, i)) && closedH){ c.strokeStyle = (i === N && j === N - 1) ? "#ff8aa8" : T.t; c.beginPath(); c.moveTo(px(ox(R.v) + j * C), pz(oz() + i * C)); c.lineTo(px(ox(R.v) + (j + 1) * C), pz(oz() + i * C)); c.stroke(); c.strokeStyle = T.t; }
    }
    for(const st of R.stars) if(!st.got && R.seen[st.c[0]][st.c[1]]){ c.fillStyle = "#ffe27a"; c.beginPath(); c.arc(px(st.p[0]), pz(st.p[1]), 6, 0, TAU); c.fill(); }
    c.save(); c.translate(px(R.x), pz(R.z)); c.rotate(-R.yaw); c.fillStyle = "#7affd8"; c.beginPath(); c.moveTo(0, -11); c.lineTo(8, 8); c.lineTo(-8, 8); c.closePath(); c.fill(); c.restore();
}
