// ===== ワールド：エンジンに よらない「プリミティブの せつめい」を つくる =====
//   prim: {t:"b"|"c"|"s"|"p", x,y,z, ry,rx,rz, c(色)}  b:はこ(w,h,d) c:えんちゅう(rt,rb,h,seg) s:きゅう(r,sx,sy,sz) p:いた(w,d,ux,uy)
import {SKY_PTS, MINE_PTS, BOAT_PTS, SPLASH_PTS, GHOST_PTS, SAFARI_PTS, FAIRY_PTS, SHIP_PTS, ATTRACTIONS, QUARTET} from "./df-data.js";
import {makePath, yawOf, pitchOf} from "./df-path.js";
import {buildStages} from "./df-stages.js";
import {propReady, propAspect} from "./df-props.js";

let sd = 99; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
const box = (P, x, y, z, w, h, d, c, ry, rx, rz) => P.push({t: "b", x, y, z, w, h, d, c, ry: ry || 0, rx: rx || 0, rz: rz || 0});
const cyl = (P, x, y, z, rt, rb, h, c, seg) => P.push({t: "c", x, y, z, rt, rb, h, c, seg: seg || 10});
const sph = (P, x, y, z, r, c, sy, seg) => P.push({t: "s", x, y, z, r, c, sy: sy || 1, seg: seg || 8, rings: 5});
const pln = (P, x, y, z, w, d, c, ux, uy, ry) => P.push({t: "p", x, y, z, w, d, c, ux, uy, ry: ry || 0});

export function pathOf(a){ return makePath(a.pts, a.closed, 16); }

export function buildWorld(){
    sd = 99;
    const Ls = {}; const layer = (id, o) => Ls[id] || (Ls[id] = Object.assign({id, prims: []}, o || {}));
    const models = {}; const model = (id, o) => models[id] = Object.assign({prims: []}, o || {});
    const solids = []; // 円: {x,z,r}
    const sol = (x, z, r) => solids.push({x, z, r});
    const S = layer("solid").prims, G = layer("ground", {tex: "grass"}).prims, W = layer("paths", {tex: "cobble"}).prims;
    const WAT = layer("water", {tex: "water", blend: true, tint: [1, 1, 1, .78], scroll: [.01, .02]}).prims;
    const GLOW = layer("glow", {add: true, tint: [.32, .32, .32, .32]}).prims, CLOUD = layer("cloud", {blend: true, tint: [1, 1, 1, .9]}).prims;
    // --- 立て絵（木・花・岩・水晶・街灯・雲・山・たてものの正面）：絵が 読めたものだけ 絵で、なければ 今までの 箱や円すいで つくる ---
    const PR = [], SH = layer("pshadow", {blend: true, tint: [0, 0, 0, .15]}).prims;
    const has = (n) => propReady("prop/" + n), hasB = (n) => propReady("bld/" + n);
    const prop = (n, x, z, h, o) => { PR.push(Object.assign({img: "prop/" + n, x, z, h}, o || {})); return true; };
    const propW = (n, x, z, w, o) => prop(n, x, z, w * propAspect("prop/" + n), Object.assign({w}, o || {}));
    const shadow = (x, z, r) => { sph(SH, x, .045, z, r, "#101018", .02, 14); sph(SH, x, .05, z, r * .6, "#101018", .02, 12); };   // ちかくの かげ（まるい 影。ふちが うすい 2だん）
    const hv = (i) => { let v = Math.imul(i + 1, 2654435761) >>> 0; v ^= v >>> 15; v = Math.imul(v, 2246822519) >>> 0; v ^= v >>> 13; return (v >>> 0) / 4294967296; };   // くじ（rnd と ちがって、ならびを かえない）

    // --- 地面と みち ---
    pln(G, 0, 0, 0, 420, 420, "#ffffff", 52.5, 52.5);   // 地面（芝生）の絵は 8マスぶんで 1まい
    pln(W, 0, .03, 0, 64, 64, "#ffffff", 64 / 5, 64 / 5);   // 石だたみは 5マスぶんで 1まい
    const road = (x0, z0, x1, z1, w) => { const L = Math.hypot(x1 - x0, z1 - z0); pln(W, (x0 + x1) / 2, .025, (z0 + z1) / 2, w, L, "#f0e2c0", w / 5, L / 5, Math.atan2(x1 - x0, z1 - z0)); };
    road(0, -32, 0, -44, 7); road(-32, 0, -44, 0, 7); road(-44, 0, -44, 20, 6); road(32, 0, 56, 0, 7); road(56, 0, 79, 14, 6); road(0, 32, 0, 58, 7); road(-30, 20, -38, 20, 5);
    road(-44, 0, -55, -2.5, 5); road(44, 0, 44, -13, 5); road(-32, -40, -52, -52, 5); road(30, -40, 62, -49, 5);
    road(12, 58, 40, 58, 5); road(30, -32, 30, -40, 5); road(-32, -32, -32, -40, 5);
    // 中央の しきもよう
    cyl(S, 0, .05, 0, 4, 4, .35, "#e8d8a8", 24); cyl(S, 0, .35, 0, 2.6, 2.6, .5, "#78c6ff", 20); cyl(S, 0, .85, 0, .45, .7, 2.4, "#ffe9a0", 10); sph(S, 0, 3.6, 0, .9, "#fff3b0"); sol(0, 0, 4.2);
    // 星のふんすい
    for(let i = 0; i < 8; i++){ const a = i / 8 * 6.283; sph(S, Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6, .25, "#bfe8ff"); }

    // --- パークの ゲート（南がわの 入口）と 案内板 ---
    if(hasB("gate_front")){ PR.push({img: "bld/gate_front", x: 0, y: 0, z: 30, h: 11.4, w: 16.6, yaw: 0, two: true}); for(const sx of [-1, 1]) sol(sx * 7, 30, 1.6); }   // ゲートの 絵（向きは 南向きで 固定）
    else {
    for(const sx of [-1, 1]){ box(S, sx * 7, 0, 30, 2.4, 9, 2.4, "#ff9a6a"); box(S, sx * 7, 9, 30, 3.2, .8, 3.2, "#ffd24a"); sol(sx * 7, 30, 1.6); }
    box(S, 0, 8, 30, 14, 2.2, 1.2, "#7a5ad8"); box(S, 0, 10.2, 30, 15, .6, 1.4, "#ffd24a"); for(let i = 0; i < 7; i++) sph(S, -6 + i * 2, 11.2, 30, .45, ["#ff6a6a", "#ffd24a", "#6ad86a", "#6ac8ff", "#c88aff", "#ffb06a", "#ff8ad0"][i]);
    }
    const signs = [[-4, 14, "#ff9a3a"], [4, 14, "#5ac8ff"]]; for(const [x, z, c] of signs){ if(has("signpost")){ prop("signpost", x, z, 2.7); shadow(x, z, .8); continue; } box(S, x, 0, z, .3, 2.2, .3, "#6a4a2a"); box(S, x, 1.6, z, 2.4, 1.2, .25, c); }

    // --- ショップ・たてもの（セントラル）---
    let shopI = 0;
    const shop = (x, z, w, d, wall, roof, ry) => { const c = Math.cos(ry || 0), s = Math.sin(ry || 0); const si = ++shopI;
        if(hasB("shop_" + si)){ PR.push({img: "bld/shop_" + si, x, y: 0, z, h: 8.4}); shadow(x, z, 4.0); sol(x, z, Math.hypot(w, d) / 2 * .85); return; }   // お店の 絵（いつも カメラの 方を 向く）
        box(S, x, 0, z, w, 4.2, d, wall, ry); box(S, x, 4.2, z, w + 1, .6, d + 1, roof, ry); box(S, x, 4.8, z, w * .7, 1.2, d * .7, roof, ry);
        const fx = x + s * (d / 2 + .05), fz = z + c * (d / 2 + .05); box(S, fx, 0, fz, 2.2, 2.6, .2, "#5a3a22", ry); box(S, fx - c * 2.6, 1.2, fz + s * 2.6, 1.6, 1.4, .15, "#bfe8ff", ry); box(S, fx + c * 2.6, 1.2, fz - s * 2.6, 1.6, 1.4, .15, "#bfe8ff", ry);
        const R = Math.hypot(w, d) / 2; sol(x, z, R * .85); };
    shop(-26, 6, 8, 6, "#ffd2d2", "#e85a6a", 1.57); shop(-26, -6, 8, 6, "#d2f0ff", "#4a8ad8", 1.57); shop(26, 6, 8, 6, "#fff2b0", "#e0a030", -1.57); shop(26, -6, 8, 6, "#d8ffd2", "#4aa84a", -1.57);
    shop(-12, 26, 7, 5, "#e8d2ff", "#9a5ad8", 3.14); shop(12, 26, 7, 5, "#ffe0c0", "#e07a3a", 3.14);
    // インフォメーション（ナビ）
    if(hasB("info_front")){ PR.push({img: "bld/info_front", x: 0, y: 0, z: -12, h: 7.4}); shadow(0, -12, 3.8); }
    else { box(S, 0, 0, -12, 7, 3.4, 5, "#fff6e0"); box(S, 0, 3.4, -12, 8, .5, 6, "#ff6a8a"); cyl(S, 0, 3.9, -12, 0, 2.6, 2.4, "#ff6a8a", 8); }
    sol(0, -12, 4);

    // --- 木・花・街灯 ---
    let treeI = 0; const TN = ["tree_round", "tree_puff", "tree_cone", "tree_bloom", "tree_slim", "tree_round", "tree_puff"], GN = ["tree_indigo", "tree_teal", "tree_glow", "tree_fruit"];
    const tree = (x, z, s, col) => { const ti = treeI++, nm = col ? (col === "#5a58c8" ? GN[hv(ti) < .85 ? 0 : 2] : GN[hv(ti) < .85 ? 1 : 3]) : TN[(hv(ti) * TN.length) | 0];
        if(has(nm)){ prop(nm, x, z, (nm === "tree_slim" ? 6.2 : 5.4) * s); shadow(x, z, 1.5 * s); sol(x, z, .6 * s); return; }
        box(S, x, 0, z, .5 * s, 1.8 * s, .5 * s, "#7a5232"); cyl(S, x, 1.4 * s, z, 0, 1.9 * s, 3 * s, col || "#3f9a4a", 7); cyl(S, x, 3 * s, z, 0, 1.4 * s, 2.4 * s, "#4fb25a", 7); sol(x, z, .6 * s); };
    const NOTREE = [[-55, -14, 16], [44, -16, 7], [-52, -62, 12], [62, -58, 14], [-55, -2, 6], [-84, 60, 22]];
    const free = (x, z) => !(NOTREE.some((q) => Math.hypot(x - q[0], z - q[1]) < q[2]) || Math.hypot(x, z) < 34 || (Math.abs(x) < 5 && z > 0 && z < 60) || (z > 55 && z < 100 && Math.abs(x) < 46) || (x > 56 && x < 100 && z > 8 && z < 42));
    for(let i = 0; i < 220; i++){ const x = (rnd() - .5) * 300, z = (rnd() - .5) * 280; if(!free(x, z)) continue; if(x < -36 && x > -94 && z > 6 && z < 40) continue; if(Math.abs(x) < 10 && z < -32) continue; tree(x, z, .8 + rnd() * .9, x < -36 ? (rnd() < .5 ? "#5a58c8" : "#4a8a9a") : undefined); }
    for(let i = 0; i < 40; i++){ const a = rnd() * 6.283, r = 18 + rnd() * 12; const x = Math.cos(a) * r, z = Math.sin(a) * r; if(Math.hypot(x - 0, z - 0) < 16) continue; const fn = ["flowerbed_pink", "flowerbed_yellow", "flowerbed_white", "flowerbed_violet"][i % 4]; if(has(fn)){ prop(fn, x, z, 1.1); continue; } sph(S, x, .3, z, .35, ["#ff8ab0", "#ffd24a", "#ffffff", "#c88aff"][i % 4]); }
    for(let i = 0; i < 10; i++){ const a = i / 10 * 6.283; const x = Math.cos(a) * 22, z = Math.sin(a) * 22; if(has("lamp_plaza")) prop("lamp_plaza", x, z, 4.4); else { box(S, x, 0, z, .18, 3.4, .18, "#4a4a58"); sph(S, x, 3.6, z, .38, "#fff0b0"); } sph(GLOW, x, 3.9, z, has("lamp_plaza") ? .5 : 1.1, "#ffe9a0"); }
    // --- 外周の山（かべ）---
    for(let i = 0; i < 40; i++){ const a = i / 40 * 6.283, r = 138 + rnd() * 6; const mx = Math.cos(a) * r * 1.0, mz = Math.sin(a) * r * .92, mr = 22 + rnd() * 10, mh = 28 + rnd() * 20, mn = ["mountain_a", "mountain_b", "mountain_c", "mountain_d"][(i * 3 + (i >> 2)) % 4];
        if(has(mn)){ propW(mn, mx, mz, 96 + hv(i + 500) * 36, {y: -1, far: true}); continue; } cyl(S, mx, -2, mz, 0, mr, mh, ["#7a9a7a", "#8aa8c8", "#9a8ab8"][i % 3], 6); }

    // --- カルーセル ---
    { const [cx, cz] = ATTRACTIONS.find((a) => a.id === "carousel").c; cyl(S, cx, 0, cz, 5.4, 5.6, .5, "#ffd2e2", 20); cyl(S, cx, .5, cz, .5, .5, 6, "#ffe9a0", 8); cyl(S, cx, 6, cz, 0, 6.6, 2.6, "#ff6a9a", 20); sph(S, cx, 8.8, cz, .5, "#ffd24a");
        for(let i = 0; i < 8; i++){ const a = i / 8 * 6.283; cyl(S, cx + Math.cos(a) * 5.4, .5, cz + Math.sin(a) * 5.4, .12, .12, 5.6, "#ffe9a0", 6); sph(S, cx + Math.cos(a) * 6.3, 6.1, cz + Math.sin(a) * 6.3, .22, "#fff0b0"); }
        sol(cx, cz, 6.4); }
    // --- ムーンホイール ---
    { const a = ATTRACTIONS.find((x) => x.id === "wheel"); const [cx, cz] = a.c; for(const sx of [-1, 1]){ box(S, cx + sx * 2.4, 0, cz - 5, .7, a.cy + 1, .7, "#7a8ad8", 0, .35); box(S, cx + sx * 2.4, 0, cz + 5, .7, a.cy + 1, .7, "#7a8ad8", 0, -.35); } box(S, cx, a.cy - .3, cz, 4.8, .6, .6, "#4a5a98"); sol(cx, cz, 7);
        box(S, a.board.x - 1.2, 0, a.board.z + 1.4, 3, .5, 3, "#c8d0f0"); }
    { const M = model("wheel"); const a = ATTRACTIONS.find((x) => x.id === "wheel"), R = a.R, N = 24;
        for(const sx of [-1.15, 1.15]){
            for(let i = 0; i < N; i++){ const p = (i + .5) / N * 6.283; const seg = 2 * R * Math.sin(3.14159 / N) + .12; M.prims.push({t: "b", x: sx, y: Math.cos(p) * R, z: Math.sin(p) * R, w: .4, h: .4, d: seg, c: i % 2 ? "#ffd24a" : "#ff9ac8", rx: p, ry: 0}); }
            for(let i = 0; i < 8; i++){ const p = i / 8 * 6.283; M.prims.push({t: "b", x: sx, y: 0, z: 0, w: .22, h: R, d: .22, c: "#e8e8ff", rx: p + 3.14159 }); }
            sph(M.prims, sx, 0, 0, .8, "#ffd24a"); }
        box(M.prims, 0, -.2, -.2, 2.4, .4, .4, "#ffd24a");
        const g = model("gondola"); box(g.prims, 0, -1.7, 0, 1.8, 1.5, 2.2, "#ff6a8a"); box(g.prims, 0, -.2, 0, 1.9, .25, 2.3, "#ffd24a"); box(g.prims, 0, -.2, 0, .12, .8, .12, "#e8e8ff"); box(g.prims, 0, -1.5, 1.0, 1.7, .9, .12, "#bfe8ff"); }

    // --- ふわふわバルーン（グローブ）---
    { const a = ATTRACTIONS.find((x) => x.id === "balloon"); const [cx, cz] = a.c; cyl(S, cx, 0, cz, 1.2, 1.6, 16, "#a8a0e8", 10); sph(S, cx, 16.5, cz, 1.6, "#ffd24a"); for(let i = 0; i < 6; i++){ const t = i / 6 * 6.283; cyl(S, cx + Math.cos(t) * 8, 0, cz + Math.sin(t) * 8, .2, .2, .5, "#a8a0e8", 6); } sol(cx, cz, 1.8);
        const b = model("balloon"); sph(b.prims, 0, 5.6, 0, 2.0, "#ff7ab0", 1.25); sph(b.prims, 0, 6.0, 0, 1.3, "#ffd24a", 1.2); box(b.prims, 0, 0, 0, 1.5, .8, 1.5, "#b8885a"); for(const [x, z] of [[-.62, -.62], [.62, -.62], [-.62, .62], [.62, .62]]) box(b.prims, x, .8, z, .06, 3.2, .06, "#fff0d0"); }
    // --- スカイ・ドロップ ---
    { const a = ATTRACTIONS.find((x) => x.id === "drop"); const [cx, cz] = a.c; cyl(S, cx, 0, cz, 1.5, 2.2, a.H + 4, "#c8d0e8", 12); for(let i = 0; i < 4; i++){ const t = i / 4 * 6.283 + .78; box(S, cx + Math.cos(t) * 2.3, 0, cz + Math.sin(t) * 2.3, .3, a.H + 4, .3, "#ff6a4a"); } cyl(S, cx, a.H + 4, cz, 0, 3.2, 3, "#ff6a4a", 12); sph(S, cx, a.H + 7.4, cz, .5, "#ffd24a"); sol(cx, cz, 3);
        const p = model("platform"); cyl(p.prims, 0, -.15, 0, 3.2, 3.2, .3, "#ffd24a", 4); for(let i = 0; i < 4; i++){ const t = i / 4 * 6.283 + .78; box(p.prims, Math.cos(t) * 2.7, 0, Math.sin(t) * 2.7, .9, .8, .9, "#ff6a4a"); } }
    // --- ウィンド・スイング ---
    { const a = ATTRACTIONS.find((x) => x.id === "swing"); const [cx, cz] = a.c; cyl(S, cx, 0, cz, .8, 1.3, 14, "#d8e8ff", 10); sol(cx, cz, 1.4);
        const m = model("swingtop"); cyl(m.prims, 0, 0, 0, 4.4, 4.4, .5, "#5ac8ff", 16); cyl(m.prims, 0, .5, 0, 0, 2.6, 1.2, "#ffd24a", 16); sph(m.prims, 0, 1.9, 0, .4, "#fff");
        const c = model("chair"); box(c.prims, 0, -2.4, 0, .06, 2.4, .06, "#e8e8ff"); box(c.prims, 0, -3.2, 0, 1.0, .18, .9, "#ff6aa8"); box(c.prims, 0, -2.9, -.4, 1.0, .8, .12, "#ff6aa8"); }
    // --- ステーション（のりば）の かんばんを 全アトラクションに ---
    for(const a of ATTRACTIONS){ if(!a.board) continue; const b = a.board; if(has("board_station")){ prop("board_station", b.x, b.z, 3.5); shadow(b.x, b.z, 1.3); } else { box(S, b.x, 0, b.z, .3, 3, .3, "#6a4a2a"); box(S, b.x, 2.3, b.z, 3.6, 1.3, .28, "#ffffff"); box(S, b.x, 2.3, b.z - .1, 3.4, 1.1, .1, "#ff6a8a"); } GLOW.push({t: "s", x: b.x, y: .35, z: b.z, r: b.r * .6, c: "#ffe9a0", sy: .12, seg: 12, rings: 3}); }

    // --- レール（コースター系）---
    const rails = (a, P, opt) => { const pa = pathOf(a), n = Math.ceil(pa.total / 1.4); let last = -99;
        const smp = []; for(let q = 0; q < pa.total; q += 3){ const a0 = pa.at(q); smp.push([q, a0[0], a0[1], a0[2]]); }
        const underRail = (s0, x, y, z) => smp.some((q) => Math.abs(q[0] - s0) > 20 && q[2] < y - 1 && Math.hypot(q[1] - x, q[3] - z) < 2.2);   // 真下に ほかの レールが あれば 柱は たてない
        for(let i = 0; i < n; i++){ const s0 = i / n * pa.total, s1 = (i + 1) / n * pa.total; const A = pa.at(s0), Bp = pa.at(s1); const yaw = yawOf(A, Bp), pit = pitchOf(A, Bp), L = Math.hypot(Bp[0] - A[0], Bp[1] - A[1], Bp[2] - A[2]) + .08; const mx = (A[0] + Bp[0]) / 2, my = (A[1] + Bp[1]) / 2, mz = (A[2] + Bp[2]) / 2, c = Math.cos(yaw), s = Math.sin(yaw);
            if(opt.style === "rails"){ for(const k of [-.55, .55]) P.push({t: "b", x: mx + c * k, y: my - .08, z: mz - s * k, w: .12, h: .14, d: L, c: opt.color, ry: yaw, rx: -pit}); if(i % 2 === 0) P.push({t: "b", x: mx, y: my - .16, z: mz, w: 1.35, h: .08, d: .18, c: "#5a4a3a", ry: yaw, rx: -pit});
                // まんなかの はり（ここが ないと、レールの あいだから 下の 柱が 電柱みたいに 見えてしまう）と、レールの 真下に ならぶ 2本の 支柱（まんなかには 立てない）
                P.push({t: "b", x: mx, y: my - .3, z: mz, w: .44, h: .14, d: L, c: "#5a4a3a", ry: yaw, rx: -pit});
                if(my > 1.6 && s0 - last >= 6 && !underRail(s0, mx, my, mz)){ last = s0; for(const k of [-.55, .55]) cyl(P, mx + c * k, 0, mz - s * k, .1, .17, my - .17, "#c8c0b8", 6); P.push({t: "b", x: mx, y: my - .34, z: mz, w: 1.3, h: .1, d: .14, c: "#b8b0a8", ry: yaw}); } }
            else if(opt.style === "trough"){ P.push({t: "b", x: mx, y: my - .5, z: mz, w: 2.6, h: .5, d: L, c: "#3a8ad8", ry: yaw, rx: -pit}); for(const k of [-1.4, 1.4]) P.push({t: "b", x: mx + c * k, y: my - .3, z: mz - s * k, w: .22, h: .8, d: L, c: "#8a5a32", ry: yaw, rx: -pit}); if(my > 1.6 && s0 - last >= 6 && !underRail(s0, mx, my, mz)){ last = s0; cyl(P, mx, 0, mz, .22, .3, my - .5, "#c8c0b8", 6); } } } };
    rails(ATTRACTIONS.find((x) => x.id === "mine"), S, {style: "rails", color: "#8a6a4a"});
    // マインコースターの 両がわ：ほら穴の 岩と 水晶
    { const mp = pathOf(ATTRACTIONS.find((x) => x.id === "mine")); const msm = []; for(let q = 0; q < mp.total; q += 1.5){ const a0 = mp.at(q); msm.push([q, a0[0], a0[2]]); }
        // 岩・水晶が レールの 上や すぐ そばに のらない（絵が ごちゃごちゃ しない）ように：どの 場所の レールからも 6m 以上 はなす
        const clearOf = (x, z, d0) => !msm.some((q) => Math.hypot(q[1] - x, q[2] - z) < 6 && Math.abs(q[0] - d0) > 2);
        for(let d = 0; d < mp.total; d += 4.6){ const P = mp.at(d), Q = mp.at(d + 1), yw = yawOf(P, Q), c = Math.cos(yw), sn = Math.sin(yw);
        for(const side of [-1, 1]){ const off = (5.6 + rnd() * 2.6) * side; const x = P[0] + c * off, z = P[2] - sn * off; if(!clearOf(x, z, d)){ rnd(); rnd(); rnd(); rnd(); rnd(); continue; } if(P[1] < 6){ const r0 = .5 + rnd() * .4, r1 = 1.5 + rnd() * .9, hh = 2.6 + rnd() * 3.2, ci = (rnd() * 3) | 0; if(has("rock_pillar")) prop("rock_pillar", x, z, hh * 1.15); else cyl(S, x, 0, z, r0, r1, hh, ["#6a5a8a", "#5a5080", "#7a6a9a"][ci], 6); }
            if(rnd() < .4){ const ck = (rnd() * 4) | 0, col = ["#8ad8ff", "#c88aff", "#8affc8", "#ff8ad0"][ck], h = 1 + rnd() * 2.2, x2 = x - c * side * 1.4, z2 = z + sn * side * 1.4; const cn = ["crystal_blue", "crystal_violet", "crystal_mint", "crystal_rose"][ck]; if(has(cn)) prop(cn, x2, z2, h * 1.5); else cyl(S, x2, 0, z2, 0, .5, h, col, 5); sph(GLOW, x2, h * .6, z2, has(cn) ? .9 : 1.7, col); } } } }
    rails(ATTRACTIONS.find((x) => x.id === "sky"), S, {style: "rails", color: "#ff6a4a"});
    rails(ATTRACTIONS.find((x) => x.id === "splash"), S, {style: "trough"});
    // コースターの ステーション屋根
    { const b = ATTRACTIONS.find((x) => x.id === "sky").board; box(S, b.x, 0, b.z + 2, 8, 3.4, 1, "#ffd24a"); box(S, b.x, 3.4, b.z - .2, 9, .5, 8, "#ff6a4a"); }

    // --- ファンタジー・グローブ：水晶・ほら穴 ---
    { const crys = []; for(let i = 0; i < 46; i++){ const x = -36 - rnd() * 60, z = 4 + rnd() * 40; if(Math.hypot(x + 65, z - 22) < 6) { i--; continue; } crys.push([x, z]); }
        for(const [x, z] of crys){ const h = 1.2 + rnd() * 3, ck = (rnd() * 4) | 0, col = ["#8ad8ff", "#c88aff", "#8affc8", "#ff8ad0"][ck]; const cn = (hv(Math.round(x * 7 + z * 13)) < .2) ? "crystal_tall" : ["crystal_blue", "crystal_violet", "crystal_mint", "crystal_rose"][ck]; if(has(cn)) prop(cn, x, z, h * (cn === "crystal_tall" ? 2.0 : 1.5)); else cyl(S, x, 0, z, 0, .55, h, col, 5); sph(GLOW, x, h * .7, z, (1.6 + rnd()) * (has(cn) ? .45 : 1), col); sol(x, z, .5); }
        // 魔法の塔
        cyl(S, -70, 0, -10, 2.6, 3.2, 18, "#a8a0d8", 10); cyl(S, -70, 18, -10, 0, 4, 6, "#7a5ad8", 10); sph(GLOW, -70, 25, -10, 3, "#c8a8ff"); sol(-70, -10, 3.4);
        // トンネルの入口（岩のアーチ）
        for(const sx of [-1, 1]) cyl(S, -40, 0, 22 + sx * 3.6, 1.4, 2.2, 6, "#8a8aa8", 7); box(S, -40, 5.6, 22, 3, 1.4, 9, "#9a9ab8"); }
    // --- スカイ・コースト：雲・風車 ---
    for(let i = 0; i < 14; i++){ const x = (rnd() - .5) * 200, z = -50 - rnd() * 70, y = 24 + rnd() * 18, cr = 7 + rnd() * 4, cn = ["cloud_a", "cloud_b", "cloud_c", "cloud_d", "cloud_e", "cloud_f"][i % 6]; if(has(cn)) propW(cn, x, z, cr * 2.8, {y: y - cr * .6, far: true}); else sph(CLOUD, x, y, z, cr, "#ffffff", .5); }
    { const wx = -14, wz = -34; cyl(S, wx, 0, wz, 1, 1.5, 9, "#f0e8d8", 8); sol(wx, wz, 1.7); const wm = model("windmill"); for(let i = 0; i < 4; i++){ box(wm.prims, 0, 0, 0, .12, 5.2, .5, "#ff9a3a", 0, i * 1.5708); box(wm.prims, 0, 0, 0, .06, 5.0, 1.0, "#fff6e0", 0, i * 1.5708 + .02); } }
    // --- ブルー・ラグーン：湖・滝・桟橋 ---
    pln(WAT, 0, .06, 79, 46, 30, "#ffffff", 46 / 10, 30 / 10);
    pln(WAT, 4, .06, 78, 64, 36, "#ffffff", 64 / 10, 36 / 10);
    for(let i = 0; i < 18; i++){ const a = i / 18 * 6.283; const x = Math.cos(a) * 25, z = 79 + Math.sin(a) * 15; if(Math.sin(a) > .55 && Math.abs(x) < 8) continue; if(has("rock_big")){ prop(i % 3 ? "rock_big" : "rock_small", x, z, i % 3 ? 1.9 : 1.5); shadow(x, z, 1.2); } else cyl(S, x, 0, z, .9, 1.1, 1.6, "#b0a8a0", 6); }
    for(let i = 0; i < 9; i++){ const a = (i / 9) * 6.283 + .3; const x = Math.cos(a) * 20, z = 79 + Math.sin(a) * 12; if(has("lamp_lantern")){ prop("lamp_lantern", x, z, 3.8); sph(GLOW, x, 2.7, z, .6, "#ffd28a"); continue; } box(S, x, 0, z, .2, 3.2, .2, "#6a4a2a"); sph(GLOW, x, 3.4, z, 1.1, "#ffd28a"); sph(S, x, 3.4, z, .34, "#ffb050"); }
    box(S, 0, 0, 60.3, 9, .5, 3.6, "#c9915a"); box(S, 18, 0, 58.6, 8, .5, 3.4, "#c9915a"); box(S, 40, 0, 58.4, 8, .5, 3.4, "#c9915a"); box(S, 12, 0, 58.6, 5, .5, 3.4, "#c9915a");
    { const DK = layer("dock", {tex: "wood"}).prims; for(const [x, z, w, d] of [[0, 60.3, 9, 3.6], [18, 58.6, 8, 3.4], [40, 58.4, 8, 3.4], [12, 58.6, 5, 3.4]]) pln(DK, x, .53, z, w, d, "#ffffff", w / 2.4, d / 2.4); }   // 桟橋の ほんものの板の絵（読めなければ 今の板の模様）
    // 滝
    box(S, -26, 0, 100, 18, 20, 5, "#9a9ab0"); box(S, -26, 4, 97.4, 5, 16, .6, "#9ad8ff"); sph(GLOW, -26, 3, 96.5, 4, "#bfe8ff", .6);
    // 水辺の ヤシ
    for(let i = 0; i < 14; i++){ const a = i / 14 * 6.283; const x = Math.cos(a) * 33, z = 79 + Math.sin(a) * 22; const pn = ["palm_tall", "palm_curve", "palm_short"][i % 3]; if(has(pn)){ prop(pn, x, z, [6.2, 5.6, 3.8][i % 3]); shadow(x, z, 1.4); sol(x, z, .4); continue; } cyl(S, x, 0, z, .18, .28, 4.4, "#a0764a", 6); for(let k = 0; k < 4; k++) box(S, x + Math.cos(k * 1.57) * .9, 4.2, z + Math.sin(k * 1.57) * .9, 2.2, .12, .6, "#4fb25a", -k * 1.57); sol(x, z, .4); }
    // シューティングの まと台
    { const sh = ATTRACTIONS.find((a) => a.id === "shoot"); box(S, sh.board.x, 0, sh.board.z + 1.6, 6, .3, 2, "#ff6a8a"); box(S, sh.board.x - 3, 0, sh.board.z + 1.2, .2, 1.2, .2, "#fff"); box(S, sh.board.x + 3, 0, sh.board.z + 1.2, .2, 1.2, .2, "#fff");
        const t = model("target"); cyl(t.prims, 0, -.1, 0, .9, .9, .12, "#ffffff", 14); cyl(t.prims, 0, 0, 0, .6, .6, .14, "#ff4a4a", 14); cyl(t.prims, 0, .02, 0, .3, .3, .16, "#ffffff", 14); cyl(t.prims, 0, .04, 0, .12, .12, .18, "#ff4a4a", 14); t.prims.forEach((p) => { p.rx = 1.5708; p.y += 0; }); const st = model("star"); sph(st.prims, 0, 0, 0, .5, "#ffe34a"); }

    // --- ミステリー・マナー（やかた）---
    { const x0 = 61, x1 = 97, z0 = 14, z1 = 41, h = 7, c = "#5a4a6a", ic = "#3a2e48";
        box(S, (x0 + x1) / 2, 0, z0 + .4, x1 - x0, h, .8, c); // 前（ドアのすきま 78〜81 あけるため 2枚）
        S.pop(); box(S, (x0 + 77) / 2, 0, z0 + .4, 77 - x0, h, .8, c); box(S, (x1 + 81) / 2, 0, z0 + .4, x1 - 81, h, .8, c); box(S, 79, h - 2, z0 + .4, 4, 2, .8, c);
        box(S, (x0 + x1) / 2, 0, z1 - .4, x1 - x0, h, .8, c); box(S, x0 + .4, 0, (z0 + z1) / 2, .8, h, z1 - z0, c); box(S, x1 - .4, 0, (z0 + z1) / 2, .8, h, z1 - z0, c);
        box(S, (x0 + x1) / 2, h, (z0 + z1) / 2, x1 - x0 + 2, .6, z1 - z0 + 2, "#3a2e48"); if(hasB("manor_front")) cyl(S, 79, h + .6, 27, 0, 11, 6, "#2e2438", 4); else cyl(S, 79, h + .6, 27, 0, 24, 9, "#2e2438", 4); // やね（正面の 絵が あるときは 絵の うしろに かくれる 小さな やね）
        for(const [tx, tz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]){ if(tz === z0 && hasB("manor_front")) continue; cyl(S, tx, 0, tz, 2.4, 2.8, h + 3, "#6a5a7a", 8); cyl(S, tx, h + 3, tz, 0, 3.2, 4, "#4a2e68", 8); }
        pln(S, 79, .04, 27, x1 - x0 - 2, z1 - z0 - 2, "#2c2236"); // ゆか（暗い）
        for(const [wx, wz] of [[68, 23], [90, 23], [68, 33], [90, 33]]) { box(S, wx, 0, wz, .5, 3.4, .5, "#6a4a2a"); sph(GLOW, wx, 3.5, wz, 1.2, "#ffd28a"); }
        sol((x0 + 77) / 2, z0 + .4, 0.01); solids.pop();
        // かべの あたり判定（円の ならび）
        for(let x = x0; x <= x1; x += 1.6){ if(x > 76.5 && x < 81.5) continue; sol(x, z0 + .4, 1); sol(x, z1 - .4, 1); } for(let z = z0; z <= z1; z += 1.6){ sol(x0 + .4, z, 1); sol(x1 - .4, z, 1); }
        // てがかり：とけい・え・ほん・きんこ
        const clue = (x, z, ry, fn) => fn(x, z, ry);
        box(S, 66.2, 0, 22, 1.4, 5, 1.2, "#8a6a3a"); box(S, 66.9, 3, 22, .12, 1.4, 1.4, "#ffffff"); // とけい
        box(S, 91.8, 1.4, 28, .15, 2.4, 3.2, "#c8a050"); box(S, 91.7, 1.6, 28, .1, 2, 2.8, "#78c8e8"); // え
        box(S, 70, 0, 38.8, 4.8, 3.4, 1.0, "#6a4a2a"); for(let i = 0; i < 7; i++) box(S, 68 + i * .6, .5 + (i % 2) * 1.4, 38.2, .4, 1.2, .5, ["#c84a4a", "#4a8ac8", "#4ac86a", "#c8a84a", "#8a4ac8", "#c84a8a", "#4ac8c8"][i]); // ほんだな
        box(S, 91, 0, 38, 2.4, 2.6, 2, "#8a8a98"); box(S, 91, 2.6, 38, 2.6, .3, 2.2, "#5a5a68"); sph(S, 91, 1.4, 36.9, .35, "#ffd24a"); // きんこ
        sol(66.8, 22, 1.2); sol(70, 38.3, 2.2); sol(73, 38.3, 1.5); sol(91, 38, 1.7); }
    // --- ゴースト（おばけ）---
    { const g = model("ghost"); sph(g.prims, 0, .5, 0, .65, "#f0f4ff", 1.15); cyl(g.prims, 0, -.9, 0, .65, .5, 1.3, "#f0f4ff", 9); for(const s of [-1, 1]) sph(g.prims, s * .24, .75, .55, .13, "#2a2a40"); sph(g.prims, 0, .35, .6, .12, "#2a2a40"); g.prims.forEach((p) => { p.y += 1.2; }); g.blend = true; g.tint = [1, 1, 1, .85]; }
    // --- ふしぎサファリ：どうぶつ ---
    { const g = model("giraffe"); box(g.prims, 0, 2.4, 0, 1.4, 1.3, 2.4, "#f0c050"); for(const [x, z] of [[-.5, -.9], [.5, -.9], [-.5, .9], [.5, .9]]) box(g.prims, x, 0, z, .3, 2.5, .3, "#e0a838"); box(g.prims, 0, 3.4, 1.1, .5, 3.2, .5, "#f0c050"); box(g.prims, 0, 6.4, 1.3, .7, .7, 1.3, "#f0c050"); box(g.prims, .2, 7, 1.2, .12, .5, .12, "#6a4a2a"); box(g.prims, -.2, 7, 1.2, .12, .5, .12, "#6a4a2a"); for(let i = 0; i < 6; i++) sph(g.prims, ((i % 2) * 2 - 1) * .72, 3 + (i >> 1) * .4, -.5 + (i % 3) * .5, .22, "#a8702c", 1, 5);
        const e = model("elephant"); sph(e.prims, 0, 2.2, 0, 1.7, "#a8b0c8", .85); sph(e.prims, 0, 2.7, 1.9, 1, "#a8b0c8"); box(e.prims, 0, .6, 2.9, .5, 1.9, .5, "#98a0b8"); for(const [x, z] of [[-.9, -.9], [.9, -.9], [-.9, .9], [.9, .9]]) box(e.prims, x, 0, z, .7, 1.7, .7, "#98a0b8"); for(const s of [-1, 1]) box(e.prims, s * 1.1, 2.3, 1.7, .15, 1.6, 1.6, "#b8c0d8");
        const f = model("fluffy"); sph(f.prims, 0, 1.2, 0, 1.2, "#ffb0d8", 1); sph(f.prims, 0, 1.6, 1.0, .7, "#ffd0e8"); for(const s of [-1, 1]) { sph(f.prims, s * .3, 1.8, 1.55, .12, "#3a2a40"); box(f.prims, s * .35, 2.2, 1.0, .2, .8, .2, "#ffb0d8"); } sph(f.prims, 0, 1.5, -1.2, .3, "#fff");
        const l = model("lion"); sph(l.prims, 0, 1.0, 0, .9, "#e8b060", .8); sph(l.prims, 0, 1.3, 1, .8, "#c07a30"); sph(l.prims, 0, 1.3, 1.2, .5, "#f0c880"); for(const [x, z] of [[-.4, -.5], [.4, -.5], [-.4, .5], [.4, .5]]) box(l.prims, x, 0, z, .3, .8, .3, "#d8a050"); box(l.prims, 0, 1, -1.2, .12, .12, 1, "#e8b060"); }
    // 人（NPC・ゲスト）モデル
    const person = (id, look) => { const m = model(id); const P = m.prims; box(P, -.17, 0, 0, .22, .85, .26, "#3a3a50"); box(P, .17, 0, 0, .22, .85, .26, "#3a3a50"); box(P, 0, .85, 0, .62, .75, .34, look.shirt); box(P, -.42, .9, 0, .18, .65, .2, look.shirt); box(P, .42, .9, 0, .18, .65, .2, look.shirt); sph(P, 0, 1.95, 0, .3, "#ffdcb8", 1.05); sph(P, 0, 2.05, -.05, .32, look.hair, 1.0, 7); P.push({t: "b", x: 0, y: 1.5, z: .02, w: .64, h: .12, d: .38, c: look.accent});
        if(look.style === "long") box(P, 0, 1.2, -.22, .6, .9, .12, look.hair); if(look.style === "spiky") for(let i = 0; i < 3; i++) cyl(P, (i - 1) * .17, 2.3, 0, 0, .1, .3, look.hair, 4); if(look.style === "bun") sph(P, 0, 2.4, -.2, .2, look.hair); if(look.style === "short") box(P, 0, 2.28, 0, .5, .12, .46, look.hair); };
    for(const q of QUARTET) person("npc_" + q.id, q.look);
    const cols = ["#e85a6a", "#4a8ad8", "#4aa84a", "#e0a030", "#9a5ad8", "#e07a3a"], hairs = ["#2a2a30", "#5a3a20", "#caa070", "#222", "#8a4a2a"];
    for(let i = 0; i < 6; i++) person("guest" + i, {shirt: cols[i], hair: hairs[i % 5], style: ["short", "long", "spiky", "bun", "short", "long"][i], accent: "#ffffff"});
    // ナビ（ふわふわ ほし）
    const P2 = (P, x, y, z, a) => P.push({t: "c", x, y, z, rt: 0, rb: .07, h: .3, seg: 4, c: "#ff8ac0", rz: 1.5708, ry: -a});
    { const n = model("navi"); sph(n.prims, 0, 0, 0, .2, "#ffd24a", 1, 8); for(let i = 0; i < 6; i++){ const a = i / 6 * 6.283; P2(n.prims, Math.cos(a) * .3, -.04, Math.sin(a) * .3, a); } }
    // パレード・フロート
    for(let i = 0; i < 5; i++){ const m = model("float" + i); const col = ["#ff6a8a", "#ffd24a", "#5ac8ff", "#9a7ae8", "#6ad89a"][i]; box(m.prims, 0, .5, 0, 3, 1, 5.4, col); box(m.prims, 0, 1.5, -1.2, 2.4, 1.4, 2, "#ffffff"); sph(m.prims, 0, 3.4, -1, 1.1, col); cyl(m.prims, 0, 1.5, 1.2, 0, .9, 2.2, col, 6); for(const [x, z] of [[-1.5, -2], [1.5, -2], [-1.5, 2], [1.5, 2]]) cyl(m.prims, x, 0, z, .5, .5, .4, "#3a3a4a", 8); for(let k = 0; k < 4; k++) sph(m.prims, ((k % 2) * 2 - 1) * 1.4, 1.6 + (k >> 1) * 1.2, 2.4, .26, "#fff0a0"); }
    // きらきら スプライト用の ほか
    const coin = model("coin"); cyl(coin.prims, 0, -.1, 0, .35, .35, .08, "#ffd24a", 10); coin.prims[0].rx = 1.5708;


    // ===== 追加ライド4つ =====
    // (1) ひかりの もりの おとぎライド（やかた型の ダークライド）
    { const x0 = -66, x1 = -44, z0 = -24, z1 = -6, h = 7.5, c = "#6a4a9a";
        box(S, (x0 + -57) / 2, 0, z1 - .4, -57 - x0, h, .8, c); box(S, (x1 + -53) / 2, 0, z1 - .4, x1 + 53, h, .8, c); box(S, -55, h - 2.2, z1 - .4, 4, 2.2, .8, "#ffd24a");
        box(S, (x0 + x1) / 2, 0, z0 + .4, x1 - x0, h, .8, c); box(S, x0 + .4, 0, (z0 + z1) / 2, .8, h, z1 - z0, c); box(S, x1 - .4, 0, (z0 + z1) / 2, .8, h, z1 - z0, c);
        box(S, (x0 + x1) / 2, h, (z0 + z1) / 2, x1 - x0 + 1.4, .6, z1 - z0 + 1.4, "#4a2e78"); for(const [tx, tz, th] of [[x0, z1, 12], [x1, z1, 10], [-55, z0, 14]]){ if(tz === z1 && hasB("fairy_front")) continue; cyl(S, tx, 0, tz, 1.8, 2.2, th, "#9a7ad0", 8); cyl(S, tx, th, tz, 0, 2.6, 4.2, "#ff6aa8", 8); sph(GLOW, tx, th + 1.6, tz, 1.8, "#ffd2f0"); }
        for(const sx of [-1, 1]) for(let k = 0; k < 4; k++) sph(S, -55 + sx * (3.2 + k * .5), 5.6 - k * .15, z1 - .2, .22, ["#ff6a6a", "#ffd24a", "#6ad86a", "#6ac8ff"][k]);
        pln(S, -55, .04, -15, x1 - x0 - 2, z1 - z0 - 2, "#1c1430");
        for(let x = x0; x <= x1; x += 1.6){ if(x > -57.5 && x < -52.5) continue; sol(x, z1 - .4, 1); sol(x, z0 + .4, 1); } for(let z = z0; z <= z1; z += 1.6){ sol(x0 + .4, z, 1); sol(x1 - .4, z, 1); }
        // 光る木
        const gt = (x, z, hh, col) => { cyl(S, x, 0, z, .25, .35, hh, "#4a3a5a", 6); sph(S, x, hh + .5, z, 1.0, col, 1.0); sph(GLOW, x, hh + .5, z, 1.7, col); };
        for(const [x, z, col] of [[-52.5, -12, "#6affb8"], [-48.5, -14.5, "#8ad8ff"], [-45.5, -15.6, "#6affb8"], [-49, -19.8, "#c88aff"], [-54, -22.6, "#8ad8ff"], [-60, -22.6, "#6affb8"], [-64, -19.5, "#ff9ad8"], [-63.5, -12, "#8ad8ff"], [-60.6, -9.2, "#c88aff"]]) gt(x, z, 2.4, col);
        // ガラスの おしろ（おくの かべ）
        box(S, -55, 0, -22.8, 6, 3.4, 1.4, "#cfe8ff"); cyl(S, -57.6, 0, -22.8, .9, .9, 5.4, "#bfe0ff", 8); cyl(S, -52.4, 0, -22.8, .9, .9, 5.4, "#bfe0ff", 8); cyl(S, -57.6, 5.4, -22.8, 0, 1.2, 1.8, "#ff8ac0", 8); cyl(S, -52.4, 5.4, -22.8, 0, 1.2, 1.8, "#ff8ac0", 8); cyl(S, -55, 3.4, -22.8, 0, 2.2, 3, "#ffd24a", 8); sph(GLOW, -55, 3.2, -22.2, 3.6, "#cfe8ff");
        // ランプ
        for(const [x, z] of [[-57.2, -9.6], [-53, -10.2], [-47.5, -12.5], [-47.2, -21.5], [-62.5, -21.5], [-63.8, -15.8]]){ box(S, x, 0, z, .12, 2.2, .12, "#8a6a3a"); sph(S, x, 2.4, z, .28, "#fff0b0"); sph(GLOW, x, 2.4, z, 1.1, "#ffe9a0"); }
        const sk = model("starkid"); sph(sk.prims, 0, .85, 0, .4, "#ffe34a", 1.05); sph(sk.prims, -.12, .95, .34, .06, "#2a2a40"); sph(sk.prims, .12, .95, .34, .06, "#2a2a40"); for(let i = 0; i < 5; i++){ const a = i / 5 * 6.283; cyl(sk.prims, Math.cos(a) * .45, .85 + Math.sin(a) * .45, 0, 0, .12, .3, "#ffe34a", 4); sk.prims[sk.prims.length - 1].rz = a - 1.5708; } box(sk.prims, 0, 0, 0, .4, .5, .3, "#ffb14a");
        const wt = model("witch"); cyl(wt.prims, 0, 0, 0, .3, .9, 3.2, "#1c0f2e", 8); sph(wt.prims, 0, 3.4, 0, .45, "#2b1a40"); cyl(wt.prims, 0, 3.7, 0, 0, .65, 1.2, "#150a24", 8); box(wt.prims, 0, 3.6, 0, 1.4, .08, 1.4, "#150a24"); sph(wt.prims, -.16, 3.45, .38, .07, "#ff4aa8"); sph(wt.prims, .16, 3.45, .38, .07, "#ff4aa8"); for(const sx of [-1, 1]) box(wt.prims, sx * .95, 1.2, .1, .14, 1.6, .14, "#1c0f2e", 0, 0, sx * .5);
    }
    // (2) ムーンシップ・フライト（乗り場と ふね）
    { box(S, 44, 0, -17, 7, .6, 6, "#8a6a4a"); for(const sx of [-1, 1]){ cyl(S, 44 + sx * 3.2, 0, -17, .15, .15, 4.4, "#c8c0b8", 6); sph(GLOW, 44 + sx * 3.2, 4.6, -17, 1.1, "#cfe8ff"); } box(S, 44, 4.4, -17, 6.8, .4, .4, "#5a8ad8"); sol(44, -18.6, 3.4);
        const m = model("skyship"); box(m.prims, 0, 0, 0, 2.4, .9, 6, "#8a5a32"); box(m.prims, 0, .9, 0, 2.7, .3, 6.3, "#ffd24a"); cyl(m.prims, 0, 1.1, 0, .14, .16, 5.4, "#6a4a2a", 6); box(m.prims, 0, 2.4, 0, .1, 3.2, 2.8, "#fff6e0"); box(m.prims, 0, 3, 0, .06, 2, 2.2, "#ffd2e8", 0, 0, 0); sph(m.prims, 0, 6.6, 0, .35, "#ffe34a"); sph(m.prims, 0, .6, 3.3, .45, "#5ac8ff"); sph(m.prims, 0, .6, -3.3, .3, "#ff6a8a"); }
    // (3) ポップタウン・スピナー
    { const a = ATTRACTIONS.find((q) => q.id === "spinner"); const [cx, cz] = a.c; cyl(S, cx, 0, cz, 8.4, 8.6, .5, "#ffe0f0", 24); cyl(S, cx, .5, cz, .5, 1, 4.2, "#ff6aa8", 10); cyl(S, cx, 4.7, cz, 0, 2.6, 1.8, "#ffd24a", 10); sph(S, cx, 6.6, cz, .45, "#5ac8ff"); sol(cx, cz, 1.2);
        for(let i = 0; i < 12; i++){ const t = i / 12 * 6.283; const x = cx + Math.cos(t) * 13.5, z = cz + Math.sin(t) * 13.5, col = ["#ff6a8a", "#ffd24a", "#5ac8ff", "#9a7ae8", "#6ad89a", "#ff9a3a"][i % 6]; if(i % 3 === 0){ cyl(S, x, 0, z, .3, .5, 3, "#fff6e0", 8); sph(S, x, 3.6, z, 1.9, col, .9, 9); for(let k = 0; k < 4; k++) sph(S, x + Math.cos(k * 1.57) * 1.2, 3.8, z + Math.sin(k * 1.57) * 1.2, .35, "#ffffff", 1, 5); } else { box(S, x, 0, z, 2.6, 3.4 + (i % 3), 2.6, col); box(S, x, 3.4 + (i % 3), z, 3.2, .5, 3.2, "#ffffff"); box(S, x, 1.6, z + 1.31, 1.0, 1.0, .1, "#ffffff"); } sol(x, z, 1.8); }
        const cp = model("cup"); cyl(cp.prims, 0, .1, 0, 1.5, 1.1, 1.0, "#ffd24a", 12); cyl(cp.prims, 0, 1.1, 0, 1.7, 1.5, .25, "#ff6aa8", 12); box(cp.prims, 0, .05, 0, 2.0, .15, 2.0, "#5ac8ff"); }
    // (4) コスモ・クルーズ（ドームの たてもの）
    { const cx = 62, cz = -60; cyl(S, cx, 0, cz, 9.6, 10, 3, "#c8d0e8", 20); sph(S, cx, 3, cz, 9.4, "#dfe6ff", .8, 18); sph(GLOW, cx, 7.2, cz, 7, "#8ab0ff"); box(S, cx, 0, cz + 9.2, 5, 4.4, 2, "#5a6aa8"); box(S, cx, 4.4, cz + 9.2, 5.6, .5, 2.4, "#ffd24a"); for(const [dx, dz] of [[-12, 0], [12, 0], [0, -13]]){ cyl(S, cx + dx, 0, cz + dz, .7, 1.2, 6, "#aab4d8", 8); sph(S, cx + dx, 6.6, cz + dz, 1.0, "#ffe34a"); sph(GLOW, cx + dx, 6.6, cz + dz, 2.2, "#ffe9a0"); } sol(cx, cz, 10.4);
        // 宇宙の もの（モデル）
        const pl = (id, c1, c2) => { const m = model(id); sph(m.prims, 0, 0, 0, 1, c1, 1, 14); cyl(m.prims, 0, -.12, 0, 1.55, 1.55, .12, c2, 20); m.prims[m.prims.length - 1].rx = .35; }; pl("planetA", "#4a8ae8", "#9ad0ff"); pl("planetB", "#e8884a", "#ffd9a0");
        const rk = model("rock"); sph(rk.prims, 0, 0, 0, 1, "#8a8088", .8, 6); sph(rk.prims, .5, .2, .3, .55, "#9a9098", 1, 5);
        const gt = model("gate"); for(let i = 0; i < 12; i++){ const t = i / 12 * 6.283; box(gt.prims, Math.cos(t) * 7, Math.sin(t) * 7, 0, 1.4, 1.4, 1.4, i % 2 ? "#ffe34a" : "#5ac8ff"); }
        const st = model("station"); box(st.prims, 0, 0, 0, 14, 3, 10, "#c8d0e8"); cyl(st.prims, 0, 3, 0, 2.2, 3.4, 6, "#aab4d8", 10); box(st.prims, 0, 8.8, 0, 22, .3, 2.2, "#5a6aa8"); for(const sx of [-1, 1]) box(st.prims, sx * 12, 5, 0, 5, .15, 4, "#5ac8ff"); sph(st.prims, 0, 9.6, 0, .6, "#ff6a6a");
        const dr = model("drone"); sph(dr.prims, 0, 0, 0, .8, "#ff6a6a", .6, 8); box(dr.prims, 0, 0, 0, 3, .15, .8, "#c04040"); sph(dr.prims, 0, 0, .6, .2, "#ffe34a"); }
    { const h = model("horse"); const P = h.prims; box(P, 0, 1.0, 0, .8, .8, 1.7, "#fff4f8"); for(const [x, z] of [[-.28, -.65], [.28, -.65], [-.28, .65], [.28, .65]]) box(P, x, 0, z, .2, 1.05, .2, "#f0dce6"); box(P, 0, 1.55, .85, .36, .95, .5, "#fff4f8", 0, -.45); box(P, 0, 2.2, 1.15, .34, .4, .72, "#fff4f8"); box(P, 0, 1.75, .6, .1, .8, .5, "#ff6a9a", 0, -.2); box(P, 0, 1.75, -.9, .14, .12, .9, "#ff6a9a"); box(P, 0, 1.9, .98, .02, .02, .02, "#222"); sph(P, .18, 2.42, 1.2, .05, "#222"); sph(P, -.18, 2.42, 1.2, .05, "#222"); box(P, 0, .9, 0, .9, .1, .9, "#ffd24a"); }
    { const m = model("sparkle"); sph(m.prims, 0, 0, 0, .12, "#fff6b0"); m.add = true; }
    buildStages({layer, model, box, cyl, sph, pln, sol});   // 新アトラクション3つの 舞台（ふだんは かくれている）と のりば
    // --- かざりの 立て絵（絵が あるときだけ。足すだけで、当たり判定は ほとんど ふやさない）---
    if(has("bench")) for(const [x, z] of [[-8, -8], [8, -8], [-8, 8], [8, 8]]){ prop("bench", x, z, 1.5); shadow(x, z, 1.4); sol(x, z, .9); }
    // 大きな やかたの 正面の 絵（向きは 入口の 方で 固定・りょうめんに 絵）。入口の すきまは 通れるまま
    if(hasB("manor_front")) PR.push({img: "bld/manor_front", x: 79, y: 0, z: 12.9, h: 15.9, w: 40, yaw: Math.PI, two: true});   // ミステリー・マナー（入口は 北がわ）
    if(hasB("fairy_front")) PR.push({img: "bld/fairy_front", x: -55, y: 0, z: -4.7, h: 17.4, w: 24, yaw: 0, two: true});   // ひかりの もりの おとぎ館
    if(hasB("dome_front")) PR.push({img: "bld/dome_front", x: 62, y: 0, z: -49.4, h: 12, w: 22, yaw: 0, two: true});   // コスモ・ドーム
    if(has("lamp_garden")) for(const sx of [-1, 1]) for(const z of [36, 43, 50]){ const x = sx * 5.4; prop("lamp_garden", x, z, 1.7); sph(GLOW, x, 1.2, z, .4, "#ffe9a0"); }   // ゲートへ のびる 道の 低い 庭園灯
    if(has("trashcan")) for(const [x, z] of [[-21, 1.5], [21, 1.5], [-3.5, 20], [3.5, 20]]){ prop("trashcan", x, z, 1.4); shadow(x, z, .7); sol(x, z, .5); }
    if(has("balloons")) for(const [x, z] of [[-6.5, -9.5], [6.5, -9.5], [-3.2, 29], [3.2, 29]]){ prop("balloons", x, z, 3.3); }
    if(has("reeds")) for(let i = 0; i < 18; i++){ const a = (i + .5) / 18 * 6.283; const x = Math.cos(a) * 23.6, z = 79 + Math.sin(a) * 14; if(Math.sin(a) > .5 && Math.abs(x) < 9) continue; prop("reeds", x, z, 1.8 + hv(i + 80) * .5); }
    if(has("mushroom_big") && has("fern_glow")) for(let i = 0; i < 26; i++){ const x = -38 - hv(i * 3 + 700) * 54, z = 6 + hv(i * 3 + 701) * 34; if(Math.hypot(x + 65, z - 22) < 7 || (Math.abs(x + 40) < 6 && Math.abs(z - 22) < 7)) continue; if(i % 2) prop("mushroom_big", x, z, 1.3 + hv(i + 900) * 1.0); else prop("fern_glow", x, z, 1.5 + hv(i + 901) * .7); }
    if(has("grass_tuft_a") && has("flower_tall_a")) for(let i = 0; i < 70; i++){ const x = (hv(i * 3 + 300) - .5) * 220, z = (hv(i * 3 + 301) - .5) * 200; if(!free(x, z)) continue; const q = i % 5; if(q < 2) prop(q ? "grass_tuft_b" : "grass_tuft_a", x, z, 1.0 + hv(i + 600) * .6); else prop(["flower_tall_a", "flower_tall_b", "bush_round"][q - 2], x, z, q === 4 ? 1.8 : 1.5); }
    // --- しあげ：レールの 上・すぐ そばに のってしまった 木・花・岩・水晶（柱みたいに 見えて じゃま）を とりのぞく ---
    //  ほかの 場所の 絵が かぶる ことが ないように、あとから まとめて しらべる（のりばの かんばん・たてもの・雲・山・街灯・ベンチは そのまま）
    {
        const KEEP = /board_station|bld\/|cloud|mountain|lamp|bench|signpost|trashcan|balloons/;
        const samples = [];
        for(const a of ATTRACTIONS){ if(a.kind !== "track" || !a.pts) continue; const pa = pathOf(a); for(let q = 0; q < pa.total; q += 1){ const t = pa.at(q); samples.push([t[0], t[1], t[2]]); } }
        const removed = [];
        for(let i = PR.length - 1; i >= 0; i--){
            const pr = PR[i]; if(pr.far || KEEP.test(pr.img)) continue;
            const hw = pr.w ? pr.w / 2 : (pr.h / Math.max(.3, propAspect(pr.img))) / 2, lim = 1.5 + hw * .8;
            let hit = false; for(const t of samples){ if(Math.abs(t[0] - pr.x) > lim || Math.abs(t[2] - pr.z) > lim) continue; if(Math.hypot(t[0] - pr.x, t[2] - pr.z) < lim && t[1] < pr.h + .5){ hit = true; break; } }
            if(hit){ removed.push([pr.x, pr.z]); PR.splice(i, 1); }
        }
        for(let i = solids.length - 1; i >= 0; i--){ const so = solids[i]; if(so.r <= .75 && removed.some((q) => Math.abs(q[0] - so.x) < .01 && Math.abs(q[1] - so.z) < .01)) solids.splice(i, 1); }
        const gone = (P) => { for(let i = P.length - 1; i >= 0; i--){ const q = P[i]; if(removed.some((r) => Math.abs(r[0] - q.x) < .01 && Math.abs(r[1] - q.z) < .01)) P.splice(i, 1); } };
        gone(SH); gone(GLOW);   // その 木・水晶の かげ・ひかりも いっしょに
        if(typeof window !== "undefined") window.__dfRemovedProps = removed.length;
    }
    const layers = Object.values(Ls); return {layers, models, solids, props: PR, bounds: {x0: -115, x1: 115, z0: -118, z1: 108}};
}
export {makePath};
