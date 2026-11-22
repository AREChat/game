// ===== 新アトラクション②③ の 舞台・まと・のりば =====
//  ② キラキラ・スイーツ・ブラスター … おかしの せかいを ブラスターで ねらう（絵・名前・音は ぜんぶ オリジナル）
//  ③ オーロラ・スカイウィング … 夜空を とぶ 大ぼうけん
import {SW_TR, AU_TR} from "./df-data.js";
import {trackPath} from "./df-coaster.js";

const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
// レールの 上の ばしょ s の ざひょうと むき。よこ k の ばしょは (x + c*k, z - n*k)
export function frameAt(P, s){ const a = P.at(s), b = P.at(s + 2); const yaw = Math.atan2(b[0] - a[0], b[2] - a[2]); return {x: a[0], y: a[1], z: a[2], yaw, c: Math.cos(yaw), n: Math.sin(yaw)}; }

// ---------------- まと（シューティング）----------------
export const TARGETS = {lolly: {r: 1.15, pts: 50, m: "tgtLolly"}, jelly: {r: 1.45, pts: 100, m: "tgtJelly"}, gold: {r: 1.7, pts: 300, m: "tgtGold"}};
export function genTargets(A, path){
    let sd = 7771; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
    const L = path.total, M = A.track.marks, out = []; let s = 46, i = 0;
    while(s < L - 36){
        const f = frameAt(path, s), side = (i % 2 ? 1 : -1) * (rnd() < .22 ? -1 : 1), lat = side * (3.4 + rnd() * 6.4), r = rnd();
        let k = r < .3 ? "jelly" : r > .93 ? "gold" : "lolly";
        let hh = 1.7 + rnd() * 6.2; if(s > M.tower && s < M.tower + 96) hh += rnd() * 8;
        const d = TARGETS[k];
        out.push({s, k, x: f.x + f.c * lat, y: f.y + hh, z: f.z - f.n * lat, r: d.r, pts: d.pts, amp: k === "jelly" ? 2 + rnd() * 2.4 : 0, f: .5 + rnd() * .5, ph: rnd() * 6, nx: f.c, nz: -f.n});
        s += 5 + rnd() * 3; i++;
    }
    for(let j = 0; j < 9; j++){   // フィナーレの きんいろ ゾーン
        const sj = M.finale + 5 + j * 5; if(sj > L - 14) break; const f = frameAt(path, sj), lat = (j % 2 ? 1 : -1) * (4 + (j % 3) * 2.4);
        out.push({s: sj, k: "gold", x: f.x + f.c * lat, y: f.y + 3 + (j % 4) * 1.7, z: f.z - f.n * lat, r: 1.8, pts: 300, amp: 0, f: 0, ph: 0, nx: f.c, nz: -f.n});
    }
    out.sort((a, b) => a.s - b.s); return out;
}
export function targetPos(tg, T){
    if(!tg.amp) return [tg.x, tg.y, tg.z];
    const o = Math.sin(T * tg.f * 2 + tg.ph) * tg.amp; return [tg.x + tg.nx * o, tg.y + Math.sin(T * 1.3 + tg.ph) * .35, tg.z + tg.nz * o];
}

// ---------------- ② スイーツの 舞台 ----------------
export function buildSweets(K){
    const {mk, bbox, near, rnd, h, ST} = K, {model, box, cyl, sph, pln} = h;
    const L = mk("sweets", {tex: "tile", cloudA: .7, glowTint: [.62, .62, .62, .62]}), S = L.solid, G = L.ground, CL = L.cloud, GL = L.glow, tr = SW_TR, P = trackPath(tr), B = bbox(tr), M = tr.marks;
    ST.tracks.sweets = P;
    const PAL = ["#ff9ac4", "#ffc2dc", "#9af0d0", "#fff09a", "#c8a8ff", "#ffc8a0", "#a8e4ff"];
    pln(G, B.cx, 0, B.cz, 1800, 1800, "#ffd3e6", 150, 150);
    // みち（キャンディ・レーン）
    for(let s = 0; s < P.total; s += 3.2){ const f = frameAt(P, s); box(S, f.x, .02, f.z, 9, .12, 3.4, (Math.floor(s / 3.2) % 2) ? "#fff6fb" : "#ffb8d8", f.yaw); if(Math.floor(s / 3.2) % 5 === 0){ for(const k of [-5.2, 5.2]){ sph(GL, f.x + f.c * k, .7, f.z - f.n * k, .55, PAL[(Math.floor(s / 16)) % PAL.length]); cyl(S, f.x + f.c * k, 0, f.z - f.n * k, .12, .12, .7, "#ffffff", 5); } } }
    const lolly = (x, z, hh, r, c1, c2, yaw) => { cyl(S, x, 0, z, .22, .26, hh, "#ffffff", 6); S.push({t: "s", x, y: hh + r * .7, z, r, c: c1, sx: .22, sy: 1, sz: 1, seg: 12, rings: 6, ry: yaw}); S.push({t: "s", x: x + Math.cos(yaw) * .1, y: hh + r * .7, z: z - Math.sin(yaw) * .1, r: r * .66, c: c2, sx: .24, sy: 1, sz: 1, seg: 12, rings: 6, ry: yaw}); S.push({t: "s", x, y: hh + r * .7, z, r: r * .3, c: c1, sx: .26, sy: 1, sz: 1, seg: 10, rings: 5, ry: yaw}); };
    const creamTree = (x, z, sc) => { cyl(S, x, 0, z, 0, 3.4 * sc, 4.2 * sc, "#fffaf5", 9); cyl(S, x, 3 * sc, z, 0, 2.5 * sc, 3.6 * sc, "#ffe6ef", 9); cyl(S, x, 5.7 * sc, z, 0, 1.7 * sc, 3.2 * sc, "#fffaf5", 9); sph(S, x, 8.9 * sc, z, .6 * sc, "#ff3a5c"); };
    const donut = (x, z, R, yaw) => { const n = 16; for(let k = 0; k < n; k++){ const a = k / n * TAU, px = x + Math.cos(a) * R, pz = z + Math.sin(a) * R; sph(S, px, R * .34, pz, R * .34, "#e8a45a", 1, 6); sph(S, px, R * .5, pz, R * .3, "#ff6fb0", .62, 6); if(k % 2 === 0) box(S, px + R * .12, R * .74, pz, .18, .08, .5, ["#fff09a", "#9af0d0", "#ffffff", "#a8e4ff"][(k >> 1) % 4], k); } };
    const cake = (x, z, sc) => { const cols = ["#ffc2dc", "#fff7f0", "#9af0d0", "#c8a8ff"]; let y = 0; for(let t = 0; t < 4; t++){ const r = (9 - t * 1.7) * sc, hh = 7 * sc; cyl(S, x, y, z, r, r, hh, cols[t % 4], 12); cyl(S, x, y + hh - .5 * sc, z, r + .3 * sc, r + .3 * sc, .9 * sc, "#ffffff", 12); y += hh; }
        for(let k = 0; k < 5; k++){ const a = k / 5 * TAU; cyl(S, x + Math.cos(a) * 1.6 * sc, y, z + Math.sin(a) * 1.6 * sc, .22 * sc, .22 * sc, 2.4 * sc, "#fff09a", 5); sph(GL, x + Math.cos(a) * 1.6 * sc, y + 2.9 * sc, z + Math.sin(a) * 1.6 * sc, .8 * sc, "#ffb347"); } sph(S, x, y + .5, z, .9 * sc, "#ff3a5c"); };
    const gumdrop = (x, z, r, c) => sph(S, x, 0, z, r, c, .75, 8);
    const macaron = (x, z, sc, c) => { cyl(S, x, 0, z, 2.6 * sc, 2.6 * sc, .9 * sc, c, 10); cyl(S, x, .9 * sc, z, 2.3 * sc, 2.3 * sc, .5 * sc, "#fff7f0", 10); cyl(S, x, 1.4 * sc, z, 2.6 * sc, 2.6 * sc, .9 * sc, c, 10); };
    const cane = (x, z, hh, yaw) => { for(let k = 0; k < 10; k++) cyl(S, x, k * hh / 10, z, .34, .34, hh / 10 + .02, k % 2 ? "#ffffff" : "#ff4a6a", 6); for(let k = 0; k < 5; k++){ const a = k / 5 * Math.PI; sph(S, x + Math.cos(a) * 1.2 * Math.cos(yaw) - 1.2 * Math.cos(yaw), hh + Math.sin(a) * 1.2, z, .38, k % 2 ? "#ffffff" : "#ff4a6a", 1, 6); } };
    // ゲート（キャンディ・ケーン）
    { const f = frameAt(P, M.gate); for(const k of [-8, 8]){ for(let q = 0; q < 14; q++) cyl(S, f.x + f.c * k, q * .9, f.z - f.n * k, .55, .55, .92, q % 2 ? "#ffffff" : "#ff4a6a", 7); }
        box(S, f.x, 12.6, f.z, 18, 1.6, 1.4, "#ff9ac4", f.yaw); box(S, f.x, 14.2, f.z, 14, 1.2, 1.2, "#fff09a", f.yaw); for(let q = 0; q < 7; q++) sph(S, f.x + f.c * (-6 + q * 2), 15.6, f.z - f.n * (-6 + q * 2), .7, PAL[q % PAL.length]);
        for(const k of [-8, 8]) sph(GL, f.x + f.c * k, 13.2, f.z - f.n * k, 2.4, "#ffe9a0"); }
    // 場所ごとの かざり
    const reg = (s) => s < M.cream ? "gate" : s < M.donut ? "cream" : s < M.river ? "donut" : s < M.tower ? "river" : s < M.finale ? "tower" : "finale";
    for(let s = 14; s < P.total + 40; s += 11 + rnd() * 7){
        const f = frameAt(P, Math.min(s, P.total - 1)), r = reg(s);
        for(const side of [-1, 1]){
            const k = side * (12 + rnd() * 26), x = f.x + f.c * k, z = f.z - f.n * k; if(near(tr, x, z) < 9) continue;
            const q = rnd();
            if(r === "cream" || r === "gate"){ if(q < .6) creamTree(x, z, .8 + rnd() * .9); else if(q < .85) lolly(x, z, 4 + rnd() * 5, 2 + rnd() * 1.2, PAL[(rnd() * 7) | 0], "#ffffff", rnd() * 3); else gumdrop(x, z, 1.6 + rnd() * 2, PAL[(rnd() * 7) | 0]); }
            else if(r === "donut"){ if(q < .4) donut(x, z, 3 + rnd() * 2.6, 0); else if(q < .7) macaron(x, z, 1 + rnd() * 1.2, PAL[(rnd() * 7) | 0]); else lolly(x, z, 5 + rnd() * 5, 2.2 + rnd(), PAL[(rnd() * 7) | 0], "#ffffff", rnd() * 3); }
            else if(r === "river"){ if(q < .4) gumdrop(x, z, 2 + rnd() * 2.4, PAL[(rnd() * 7) | 0]); else if(q < .7) cane(x, z, 6 + rnd() * 4, rnd() * 3); else creamTree(x, z, .8 + rnd() * .6); }
            else if(r === "tower"){ if(q < .35) cake(x, z, .5 + rnd() * .45); else if(q < .7) macaron(x, z, 1.2 + rnd(), PAL[(rnd() * 7) | 0]); else lolly(x, z, 6 + rnd() * 5, 2.4 + rnd(), PAL[(rnd() * 7) | 0], "#ffffff", rnd() * 3); }
            else { if(q < .5) cake(x, z, .6 + rnd() * .5); else if(q < .8) lolly(x, z, 7 + rnd() * 6, 2.6 + rnd(), PAL[(rnd() * 7) | 0], "#ffffff", rnd() * 3); else creamTree(x, z, 1 + rnd() * .8); }
        }
    }
    // チョコの かわ（トラックが わたる ばしょ）
    { const f = frameAt(P, M.river + 40); pln(G, f.x, .05, f.z, 22, 150, "#5a2f1c", 3, 14, f.yaw + Math.PI / 2); pln(G, f.x, .08, f.z, 17, 140, "#7a4326", 3, 12, f.yaw + Math.PI / 2);
        for(let q = 0; q < 14; q++){ const a = (q - 7) * 9, x = f.x + Math.sin(f.yaw + Math.PI / 2) * a + (rnd() - .5) * 8, z = f.z + Math.cos(f.yaw + Math.PI / 2) * a + (rnd() - .5) * 8; sph(GL, x, .3, z, .9, "#ffb86a"); } }
    // ケーキの とう（おおきい）
    { const f = frameAt(P, M.tower + 40); for(const side of [-1, 1]){ cake(f.x + f.c * side * 30, f.z - f.n * side * 30, 1.5); } }
    // フィナーレ：にじ と きんの ケーキ
    { const f = frameAt(P, M.finale + 26); const rc = ["#ff4a6a", "#ff9a3a", "#ffe04a", "#5adf7a", "#4ac8ff", "#7a6aff", "#c86aff"];
        for(let c = 0; c < 7; c++){ const R = 24 - c * 1.7; for(let q = 0; q <= 16; q++){ const a = q / 16 * Math.PI; sph(GL, f.x + f.c * Math.cos(a) * R, Math.sin(a) * R * 1.05, f.z - f.n * Math.cos(a) * R, 1.3, rc[c], 1, 5); } }
        for(const side of [-1, 1]) cake(f.x + f.c * side * 26 + f.n * 6, f.z - f.n * side * 26 + f.c * 6, 1.2); }
    // とおくの かざり（にじいろの おかしの 山・わたあめの くも）
    for(let i = 0; i < 46; i++){ const a = rnd() * TAU, d = 240 + rnd() * 340, x = B.cx + Math.cos(a) * d, z = B.cz + Math.sin(a) * d, hh = 40 + rnd() * 70, c = PAL[(rnd() * 7) | 0]; cyl(S, x, 0, z, 6 + rnd() * 8, 22 + rnd() * 18, hh, c, 9); sph(S, x, hh, z, 12 + rnd() * 10, "#fffaf5", .7, 8); }
    for(let i = 0; i < 70; i++){ const a = rnd() * TAU, d = rnd() * 760; sph(CL, B.cx + Math.cos(a) * d, 60 + rnd() * 90, B.cz + Math.sin(a) * d, 26 + rnd() * 40, rnd() < .5 ? "#ffd6ec" : "#fffaf5", .34); }
    for(let i = 0; i < 80; i++){ const q = P.at(rnd() * P.total), a = rnd() * TAU, d = 20 + rnd() * 70; sph(CL, q[0] + Math.cos(a) * d, 8 + rnd() * 26, q[2] + Math.sin(a) * d, 6 + rnd() * 9, PAL[(rnd() * 7) | 0], .6); }   // ゼリーの ふうせん

    // ---- まとの モデル ----
    { const m = model("tgtLolly"), p = m.prims; p.push({t: "s", x: 0, y: 1.2, z: 0, r: 1.1, c: "#ff4a7a", sx: .24, sy: 1, sz: 1, seg: 14, rings: 6}); p.push({t: "s", x: .05, y: 1.2, z: 0, r: .74, c: "#ffffff", sx: .26, sy: 1, sz: 1, seg: 14, rings: 6}); p.push({t: "s", x: .1, y: 1.2, z: 0, r: .38, c: "#ff4a7a", sx: .28, sy: 1, sz: 1, seg: 10, rings: 5}); cyl(p, 0, -.5, 0, .09, .09, 1.1, "#ffffff", 6); }
    { const m = model("tgtJelly"), p = m.prims; sph(p, 0, .85, 0, 1.15, "#59f0a0", .82, 10); cyl(p, 0, 0, 0, 1.15, 1.2, .25, "#2fb878", 10); sph(p, -.38, 1.05, .95, .2, "#1a2a3a"); sph(p, .38, 1.05, .95, .2, "#1a2a3a"); sph(p, 0, 1.9, 0, .22, "#ff3a5c"); sph(p, -.3, 1.1, 1.05, .07, "#ffffff"); sph(p, .46, 1.1, 1.05, .07, "#ffffff"); }
    { const m = model("tgtGold"), p = m.prims; sph(p, 0, 1, 0, 1.0, "#ffd24a", 1, 10); for(let k = 0; k < 5; k++){ const a = k / 5 * TAU; box(p, Math.cos(a) * 1.2, 1 + Math.sin(a) * 1.2, 0, .5, .5, .5, "#fff09a", 0, 0, a); } sph(p, 0, 1, .55, .55, "#fff7c0"); }
    { const m = model("blastercar"), p = m.prims; box(p, -1.1, .3, -1.9, 2.2, .7, 3.8, "#ff9ac4"); box(p, -.9, .95, -1.6, 1.8, .5, 2.4, "#fff7fb"); sph(p, 0, 1.5, -.7, 1.2, "#bfeaff", .8, 10); cyl(p, .9, .8, .5, .12, .12, 1.8, "#9af0d0", 6); p[p.length - 1].rx = Math.PI / 2; sph(p, 0, .05, 0, 2.3, "#ffe9a0", .08, 10); }
}

// ---------------- ③ オーロラの 舞台 ----------------
export function buildAurora(K){
    const {mk, bbox, near, rnd, h, ST} = K, {model, box, cyl, sph, pln} = h;
    const L = mk("aurora", {tex: "water", cloudA: .5, glowTint: [1, 1, 1, 1], groundOpt: {tex: "water", blend: true, tint: [1, 1, 1, .94], scroll: [.006, .012]}}), S = L.solid, G = L.ground, CL = L.cloud, GL = L.glow, tr = AU_TR, P = trackPath(tr), B = bbox(tr), M = tr.marks;
    ST.tracks.aurora = P; ST.auroraEndYaw = tr.end.yaw;
    pln(G, B.cx, 0, B.cz, 3600, 3600, "#0f2f6a", 300, 300);
    const LAN = ["#ffb347", "#ffd27a", "#ff8a5a", "#ffe9a0"], ICE = ["#d8f0ff", "#aee0ff", "#c8d8ff", "#e8f6ff"];
    // ひかりの おび（レール）と リング
    { const cols = ["#4affd8", "#6ad8ff", "#9a8aff", "#ff8ad8"]; let ring = 0;
        for(let s = 0; s < P.total - 2; s += 2.4){ const a = P.at(s), b = P.at(s + 2.4), yaw = Math.atan2(b[0] - a[0], b[2] - a[2]), pit = Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])), Ln = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) + .06, c = Math.cos(yaw), n = Math.sin(yaw), col = cols[Math.floor(s / 90) % 4];
            for(const k of [-.9, .9]) GL.push({t: "b", x: (a[0] + b[0]) / 2 + c * k, y: (a[1] + b[1]) / 2 - .5, z: (a[2] + b[2]) / 2 - n * k, w: .26, h: .14, d: Ln, c: col, ry: yaw, rx: -pit});
            if(s - ring > (s > M.helix && s < M.ship ? 20 : 66)){ ring = s;
                const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tl = Math.hypot(t[0], t[1], t[2]) || 1; t[0] /= tl; t[1] /= tl; t[2] /= tl;
                let rx = t[2], rz = -t[0]; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;   // よこ（水平）
                const U = [t[1] * rz, t[2] * rx - t[0] * rz, -t[1] * rx], ul = Math.hypot(U[0], U[1], U[2]) || 1; U[0] /= ul; U[1] /= ul; U[2] /= ul;   // うえ
                const rad = s > M.helix && s < M.ship ? 6.2 : 4.6;
                for(let q = 0; q < 12; q++){ const aa = q / 12 * TAU, cc = Math.cos(aa) * rad, ss = Math.sin(aa) * rad; sph(GL, a[0] + rx * cc + U[0] * ss, a[1] + U[1] * ss, a[2] + rz * cc + U[2] * ss, .5, col, 1, 5); } } } }
    const frameP = (s) => frameAt(P, Math.min(s, P.total - 3));
    // ランタンの うみ
    { const f0 = M.liftoff - 30, f1 = M.castle + 30; for(let i = 0; i < 640; i++){ const s = lerp(f0, f1, rnd()), f = frameP(s), k = (rnd() < .5 ? -1 : 1) * (6 + rnd() * 150), x = f.x + f.c * k, z = f.z - f.n * k; sph(GL, x, .5 + rnd() * 1.4, z, .5 + rnd() * .35, LAN[(rnd() * 4) | 0], 1, 5); if(i % 3 === 0) box(S, x - .7, .02, z - .5, 1.4, .3, 1, "#7a5a3a", rnd() * 3); }
        for(let i = 0; i < 220; i++){ const s = lerp(f0, f1, rnd()), f = frameP(s), k = (rnd() < .5 ? -1 : 1) * (8 + rnd() * 100), y = 4 + rnd() * 70; sph(GL, f.x + f.c * k, y, f.z - f.n * k, .55, LAN[(rnd() * 4) | 0], 1, 5); } }
    // こおりの おしろ
    { const f = frameP(M.castle + 80); for(const side of [-1, 1]){ for(let q = 0; q < 7; q++){ const k = side * (22 + rnd() * 30), s2 = M.castle + 20 + rnd() * 190, g = frameP(s2), x = g.x + g.c * k, z = g.z - g.n * k, hh = 22 + rnd() * 46, r = 3.4 + rnd() * 3.4, col = ICE[(rnd() * 4) | 0];
                cyl(S, x, 0, z, r, r * 1.15, hh, col, 10); cyl(S, x, hh, z, 0, r * 1.25, hh * .55, "#9ad4ff", 10); sph(GL, x, hh + hh * .55 + 1, z, 1.1, "#ffffff"); for(let w = 0; w < 4; w++) box(S, x + Math.cos(w * 1.6) * (r + .05) - .3, hh * (.2 + w * .17), z + Math.sin(w * 1.6) * (r + .05) - .3, .6, 1.3, .6, "#ffe9a0"); } }
        const yb = f.y + 16; for(const side of [-1, 1]) cyl(S, f.x + f.c * side * 17, 0, f.z - f.n * side * 17, 2.6, 3.2, yb, "#cfe8ff", 9); box(S, f.x, yb, f.z, 38, 3.2, 7, "#e8f6ff", f.yaw + Math.PI / 2 * 0); GL.push({t: "b", x: f.x, y: yb + 3.3, z: f.z, w: 38, h: .5, d: 7.4, c: "#9ad8ff", ry: f.yaw}); }
    // まほうの 森
    { for(let i = 0; i < 150; i++){ const s = lerp(M.forest - 30, M.helix + 10, rnd()), f = frameP(s), k = (rnd() < .5 ? -1 : 1) * (7 + rnd() * 70), x = f.x + f.c * k, z = f.z - f.n * k; if(near(tr, x, z) < 6) continue; const hh = 12 + rnd() * 18, col = ["#1f6a6a", "#2a8a7a", "#3aa090", "#2f7a8a"][(rnd() * 4) | 0];
            cyl(S, x, 0, z, .5, .8, hh * .35, "#4a3a3a", 6); cyl(S, x, hh * .3, z, 0, hh * .34, hh * .5, col, 8); cyl(S, x, hh * .55, z, 0, hh * .26, hh * .42, col, 8); cyl(S, x, hh * .78, z, 0, hh * .18, hh * .32, col, 8); }
        for(let i = 0; i < 110; i++){ const s = lerp(M.forest - 20, M.helix, rnd()), f = frameP(s), k = (rnd() < .5 ? -1 : 1) * (4 + rnd() * 50), x = f.x + f.c * k, z = f.z - f.n * k, c = ["#4affd8", "#c88aff", "#6ad8ff", "#ff8ad8"][(rnd() * 4) | 0], rr = .5 + rnd() * 1.2; cyl(S, x, 0, z, .14 * rr, .2 * rr, rr * 1.4, "#e8e0ff", 6); sph(GL, x, rr * 1.4, z, rr, c, .62, 7); }
        for(let i = 0; i < 260; i++){ const s = lerp(M.forest - 20, M.helix, rnd()), f = frameP(s), k = (rnd() < .5 ? -1 : 1) * (3 + rnd() * 40); sph(GL, f.x + f.c * k, f.y - 5 + rnd() * 14, f.z - f.n * k, .16, "#fff7a0", 1, 4); } }
    // うかぶ しま
    for(let i = 0; i < 34; i++){ const s = rnd() * P.total, f = frameP(s), k = (rnd() < .5 ? -1 : 1) * (45 + rnd() * 120), x = f.x + f.c * k, z = f.z - f.n * k, y = 10 + rnd() * 70, r = 7 + rnd() * 9; if(near(tr, x, z) < 36) continue;
        cyl(S, x, y, z, 1.2, r, 9, "#4a4a64", 9); cyl(S, x, y + 9, z, r, r, .6, "#2a7a6a", 9); cone(); function cone(){ for(let q = 0; q < 3; q++){ const a = q * 2.1 + i; cyl(GL, x + Math.cos(a) * r * .4, y + 9.4, z + Math.sin(a) * r * .4, 0, .9, 3.6 + q, ["#6ad8ff", "#c88aff", "#4affd8"][q], 5); } } }
    // ほか：ほしの かけら（ひかる つぶ）
    for(let i = 0; i < 160; i++){ const s = rnd() * P.total, f = frameP(s), a = rnd() * TAU, d = 8 + rnd() * 50; sph(GL, f.x + Math.cos(a) * d, f.y + (rnd() - .4) * 24, f.z + Math.sin(a) * d, .22 + rnd() * .2, ["#ffffff", "#c8f0ff", "#ffe9ff"][(rnd() * 3) | 0], 1, 4); }

    // ---- モデル ----
    { const m = model("airship"), p = m.prims; box(p, -4, 0, -9, 8, 3.2, 18, "#7a4a2a"); cyl(p, 0, 1.2, 9, 0, 4, 6, "#7a4a2a", 6); p[p.length - 1].rx = Math.PI / 2; box(p, -2.4, 3.2, -5, 4.8, 2.6, 6, "#a8683a"); cyl(p, 0, 3, -2, .3, .3, 20, "#5a3a22", 6); cyl(p, 0, 3, -9, .3, .3, 15, "#5a3a22", 6);
        box(p, -.12, 9, -2, .24, 9, 7.6, "#fff2d0"); box(p, -.12, 8, -9, .24, 7, 6, "#ffe0a0"); sph(p, 0, 15, -2, 4.6, "#ff8a6a", 1.25, 10); sph(p, 0, 16, -2, 4.1, "#ffe9a0", 1.2, 10); for(const sx of [-1, 1]){ sph(p, sx * 4.2, 1.4, 4, .5, "#ffe9a0"); sph(p, sx * 4.2, 1.4, -8, .5, "#ffe9a0"); box(p, sx * 6.4 - 1.6, 1.5, -2, 3.2, .2, 5, "#e8d8b8", 0, 0, sx * .4); } }
    { const m = model("skywing"), p = m.prims; sph(p, 0, 0, 0, 1.2, "#e8f6ff", .62, 10); sph(p, 0, .35, .5, .6, "#4affd8", .8, 8); for(const sx of [-1, 1]) for(let q = 0; q < 4; q++) box(p, sx * (1.2 + q * 1.5), .1 - q * .1, -.3 + q * .55, 1.7, .08, 1.3 - q * .2, ["#4affd8", "#6ad8ff", "#9a8aff", "#ff8ad8"][q], 0, 0, sx * -.18); }
    { const m = model("owl"), p = m.prims; sph(p, 0, 0, 0, 1.5, "#2a2640", 1, 8); sph(p, 0, 1.4, .3, 1.0, "#2a2640", 1, 8); sph(p, -.35, 1.6, 1.15, .32, "#ffe24a", 1, 6); sph(p, .35, 1.6, 1.15, .32, "#ffe24a", 1, 6); sph(p, -.35, 1.6, 1.4, .13, "#0a0a14", 1, 5); sph(p, .35, 1.6, 1.4, .13, "#0a0a14", 1, 5); box(p, -4.6, -.2, -.6, 3.4, .12, 2.4, "#3a3454", 0, 0, .22); box(p, 1.2, -.2, -.6, 3.4, .12, 2.4, "#3a3454", 0, 0, -.22); }
    { const m = model("moon", {add: true}), p = m.prims; sph(p, 0, 0, 0, 1, "#fff6d8", 1, 14); sph(p, 0, 0, 0, 1.18, "#7a7a60", 1, 14); }
    { const m = model("auroraSheet", {add: true}), p = m.prims; const cs = ["#2aff9a", "#3affc0", "#4affd8", "#5adfff", "#7aa8ff", "#9a8aff", "#b86aff", "#d86aff"]; for(let q = 0; q < 16; q++){ const x = (q - 8) * 1.1, hh = 70 + Math.sin(q * .9) * 24 + (q % 3) * 6; box(p, x, 0, 0, 1.4, hh, .16, cs[Math.floor(q / 2)], 0, 0, Math.sin(q * .7) * .05); } }
}

// ---------------- パークの のりば（3つ）----------------
export function buildTerminals(h){
    const {layer, model, box, cyl, sph, pln, sol} = h, S = layer("solid").prims, GL = layer("glow").prims;
    // ① ジェット・ワールドツアー（84, -44）
    { const x0 = 84, z0 = -44; box(S, x0 - 1, 0, z0 + 1, 36, .12, 12, "#41465c");
        for(let q = -7; q <= 7; q++) box(S, x0 + q * 2.4 - .5, .13, z0 + 1, 1, .02, .3, "#ffffff"); for(let q = -8; q <= 8; q++){ sph(GL, x0 + q * 2.2, .35, z0 - 4.6, .22, q % 2 ? "#4ac8ff" : "#ffffff", 1, 5); sph(GL, x0 + q * 2.2, .35, z0 + 6.6, .22, q % 2 ? "#ffffff" : "#4ac8ff", 1, 5); }
        cyl(S, x0 + 12, 0, z0 - 9, 1.2, 1.7, 13, "#dfe6f4", 9); cyl(S, x0 + 12, 13, z0 - 9, 3.2, 2.2, 1.2, "#8aa0c8", 9); cyl(S, x0 + 12, 14.2, z0 - 9, 3, 3, 2.6, "#7ad0ff", 9); cyl(S, x0 + 12, 16.8, z0 - 9, 3.4, 1.4, .9, "#dfe6f4", 9); sph(GL, x0 + 12, 18.6, z0 - 9, .8, "#ff4a4a"); sol(x0 + 12, z0 - 9, 2);
        for(const sx of [-1, 1]) cyl(S, x0 - 6 + sx * 4.4, 0, z0 - 5.4, .3, .3, 4.6, "#8a8fa0", 8); box(S, x0 - 6, 4.6, z0 - 5.4, 10.6, .5, 4.4, "#4a7aff"); box(S, x0 - 6, 5.1, z0 - 5.4, 11, .3, 4.8, "#f4f6ff");
        const m = model("jetplane"), p = m.prims, RX = Math.PI / 2, W = "#f4f6ff";
        cyl(p, 0, 1.9, -5.5, 1.15, 1.15, 11.5, W, 12); p[p.length - 1].rx = RX; cyl(p, 0, 1.9, 6, 0, 1.15, 3.6, W, 12); p[p.length - 1].rx = RX; cyl(p, 0, 1.9, -1.4, 1.18, 1.18, 1.1, "#4a7aff", 12); p[p.length - 1].rx = RX;
        box(p, -.12, 2.9, -6.0, .24, 3.2, 2.6, "#ff6a5a", 0, -.35); box(p, -2.2, 2.7, -5.8, 4.4, .16, 1.6, W);
        for(const sx of [-1, 1]){ box(p, sx * 4.4, 1.15, -1.6, 7, .22, 3.2, "#e6ebf8", sx * .4); cyl(p, sx * 3.4, .55, -1.0, .55, .55, 2.2, "#aab4cc", 8); p[p.length - 1].rx = RX; sph(p, sx * 7.4, 1.4, -3.2, .22, sx > 0 ? "#5aff7a" : "#ff5a5a", 1, 5); }
        for(let q = 0; q < 9; q++){ box(p, -1.2, 2.5, -3.6 + q * 1.1, .06, .5, .6, "#243a66"); box(p, 1.14, 2.5, -3.6 + q * 1.1, .06, .5, .6, "#243a66"); } sph(p, 0, 2.7, 5.4, .62, "#243a66", .7, 6); }
    // ② キラキラ・スイーツ・ブラスター（-48, 68）：ひろい カップケーキの たてもの
    { const x0 = -60, z0 = 68; cyl(S, x0, 0, z0, 7.2, 5.4, 6.4, "#ff9ac4", 14); for(let q = 0; q < 14; q++){ const a = q / 14 * TAU; box(S, x0 + Math.cos(a) * 6.3 - .12, .2, z0 + Math.sin(a) * 6.3 - .12, .24, 6, .24, "#ffd6e8", -a); }
        sph(S, x0, 6.4, z0, 7.6, "#fff7fb", .52, 12); sph(S, x0, 8.6, z0, 5.8, "#ffc2dc", .56, 12); sph(S, x0, 10.4, z0, 4.2, "#fff7fb", .62, 12); sph(S, x0, 13.2, z0, 1.5, "#ff3a5c"); sph(GL, x0, 13.2, z0, 2.4, "#ff9ab0"); box(S, x0 + 5.4, 0, z0 - 1.6, 1, 3.4, 3.2, "#4a2a3a"); sol(x0, z0, 7.4);
        for(const s of [-1, 1]){ for(let q = 0; q < 8; q++) cyl(S, -48 + s * 4.6, q * .9, 68 - 5.6, .34, .34, .92, q % 2 ? "#ffffff" : "#ff4a6a", 6); } for(let q = 0; q <= 8; q++){ const a = q / 8 * Math.PI; sph(S, -48 + Math.cos(a) * 4.6, 7.2 + Math.sin(a) * 2.6, 68 - 5.6, .36, q % 2 ? "#ffffff" : "#ff4a6a", 1, 6); } sph(GL, -48, 10.4, 62.4, 1.1, "#ffe9a0");
        box(S, -48 - 3, 0, 68 - 8, 6, 1.4, 2, "#9af0d0"); box(S, -48 - 3, 1.4, 68 - 8, 6, .5, 2.2, "#fff7fb"); for(let q = 0; q < 5; q++){ const x = -56 + q * 4.4; cyl(S, x, 0, 76.4, .22, .26, 5 + q % 3, "#ffffff", 6); S.push({t: "s", x, y: 5.8 + q % 3, z: 76.4, r: 1.8, c: ["#ff9ac4", "#9af0d0", "#fff09a", "#c8a8ff", "#a8e4ff"][q], sx: .22, sy: 1, sz: 1, seg: 12, rings: 6, ry: 0.4}); } }
    // ③ オーロラ・スカイウィング（48, -76）：ひかりの けっしょうの ゲート
    { const x0 = 48, z0 = -76; for(let q = 0; q < 5; q++){ const a = q / 5 * TAU + .4, r = 5.6 + (q % 2) * 1.6, hh = 11 + (q % 3) * 4; cyl(S, x0 + Math.cos(a) * r, 0, z0 + Math.sin(a) * r - 4, 0, 1.7 + (q % 2) * .6, hh, ["#9be8ff", "#c8a8ff", "#8affd8", "#a8c8ff", "#e8b8ff"][q], 6); sph(GL, x0 + Math.cos(a) * r, hh + .8, z0 + Math.sin(a) * r - 4, .9, ["#9be8ff", "#c8a8ff", "#8affd8", "#a8c8ff", "#e8b8ff"][q]); sol(x0 + Math.cos(a) * r, z0 + Math.sin(a) * r - 4, 1.8); }
        for(const sx of [-1, 1]){ box(S, x0 + sx * 4.4 - .12, 0, z0 + 3, .24, 7, .24, "#8a90b0"); sph(GL, x0 + sx * 4.4, 7.4, z0 + 3, .8, "#ffd27a"); GL.push({t: "b", x: x0 + sx * 7.5, y: 6.2, z: z0 + 3, w: 6.4, h: .3, d: 2.2, c: "#4affd8", rz: sx * .5, ry: 0}); }
        for(let q = 0; q < 9; q++){ const a = q / 8 * Math.PI; sph(GL, x0 + Math.cos(a) * 4.4, 7 + Math.sin(a) * 3.4, z0 + 3, .36, ["#4affd8", "#9a8aff", "#ff8ad8"][q % 3], 1, 5); } }
}

// ---------------- 動く もの（まと・たま・ふくろう・船・そら）----------------
export function dynSweets(g, D, R, T){
    const E = R.D.targets; const cs = R.S ? R.S.s : 0;
    for(let i = 0; i < E.length; i++){ const tg = E[i], st = R.tgt[i]; if(tg.s < cs - 12 || tg.s > cs + 130) continue; const d = TARGETS[tg.k], p = targetPos(tg, T);
        if(st.hit){ const u = (R.ct - st.hit); if(u < .5 && u >= 0){ const k = u / .5; D.push({s: "star", x: p[0], y: p[1] + k * 1.4, z: p[2], w: 1.5 + k * 3.4, h: 1.5 + k * 3.4, c: tg.k === "gold" ? [1, .9, .3] : tg.k === "jelly" ? [.4, 1, .6] : [1, .5, .7], a: 1 - k}); } continue; }
        D.push({m: d.m, x: p[0], y: p[1] - (tg.k === "lolly" ? 1.2 : 1), z: p[2], yaw: tg.k === "lolly" ? Math.atan2(R.camOut ? R.camOut.eye[0] - p[0] : 0, R.camOut ? R.camOut.eye[2] - p[2] : 1) + Math.PI / 2 : T * (tg.k === "gold" ? 2.2 : .9) + tg.ph});
        if(tg.k === "gold") D.push({s: "glow", x: p[0], y: p[1] + 1.2, z: p[2], w: 4.4, h: 4.4, c: [1, .85, .35], a: .5 + Math.sin(T * 5 + tg.ph) * .2});
    }
    for(const b of R.bolts){ const u = (R.ct - b.t) / .16; if(u < 0 || u >= 1) continue; for(let q = 0; q < 9; q++){ const k = q / 8; D.push({s: "glow", x: lerp(b.x0, b.x1, k), y: lerp(b.y0, b.y1, k), z: lerp(b.z0, b.z1, k), w: .5 * (1 - u * .6), h: .5 * (1 - u * .6), c: b.hit ? [1, .8, .4] : [.5, .9, 1], a: (1 - u) * .9}); } }
    if(R.A && R.S && R.S.s > R.A.track.marks.finale){ const f = frameAt(R.D.path, Math.min(R.D.path.total - 3, R.A.track.marks.finale + 40)); for(let q = 0; q < 14; q++){ const u = ((T * .7 + q * .37) % 1.6) / 1.6, a = q * 2.4; D.push({s: "star", x: f.x + Math.cos(a) * u * 20, y: 8 + u * 30 - u * u * 18 + (q % 3) * 3, z: f.z + Math.sin(a) * u * 20, w: 1.4, h: 1.4, c: [[1, .5, .7], [.5, 1, .8], [1, .9, .4]][q % 3], a: 1 - u}); } }
}
export function dynAurora(g, D, R, T){
    const cam = R.camOut; if(!cam) return; const ex = cam.eye[0], ey = cam.eye[1], ez = cam.eye[2], M = R.A.track.marks, P = R.D.path, cs = R.S ? R.S.s : 0;
    D.push({m: "moon", x: ex + Math.sin(ST_AZ.moon) * 300, y: ey + 120, z: ez + Math.cos(ST_AZ.moon) * 300, sx: 46, sy: 46, sz: 46, yaw: 0});
    for(let k = 0; k < 4; k++){ const az = ST_AZ.sheets[k]; D.push({m: "auroraSheet", x: ex + Math.sin(az) * 250, y: ey + 40 + k * 6, z: ez + Math.cos(az) * 250, yaw: az + Math.PI + Math.sin(T * .15 + k) * .12, sx: 2.2 + k * .3, sy: 1.1 + Math.sin(T * .3 + k * 2) * .18, sz: 1, rz: Math.sin(T * .2 + k) * .04}); }
    for(let i = 0; i < 150; i++){ const az = i * 2.399, el = .12 + ((i * 37) % 100) / 100 * 1.25, d = 285; D.push({s: "glow", x: ex + Math.cos(el) * Math.sin(az) * d, y: ey + Math.sin(el) * d, z: ez + Math.cos(el) * Math.cos(az) * d, w: 1.5 + (i % 4) * .5, h: 1.5 + (i % 4) * .5, c: [.85, .92, 1], a: .55 + .35 * Math.sin(T * 1.6 + i)}); }
    // 空とぶ 船
    for(const [off, lat, dy, sc] of [[40, 34, 6, 1], [-60, -50, 18, .8], [120, -66, -4, 1.2]]){ const f = frameAt(P, clamp(M.ship + off, 2, P.total - 4)); D.push({m: "airship", x: f.x + f.c * lat, y: f.y + dy + Math.sin(T * .8 + off) * .8, z: f.z - f.n * lat, yaw: f.yaw + .3 + Math.sin(T * .3 + off) * .06, sx: sc, sy: sc, sz: sc}); }
    // ふくろう（まほうの 森で ひゅっと よこぎる）
    { const s0 = M.forest + 70, u = (cs - s0) / 46; if(u > -.2 && u < 1.2){ const f = frameAt(P, s0 + 24), lat = lerp(-30, 30, clamp(u, 0, 1)), flap = Math.sin(T * 14) * .35; D.push({m: "owl", x: f.x + f.c * lat, y: f.y + 3 + Math.sin(u * 3) * 2, z: f.z - f.n * lat, yaw: f.yaw - Math.PI / 2, rz: flap, sx: 1.6, sy: 1.6, sz: 1.6}); } }
    // ゴールの 星
    if(cs > M.moon){ for(let q = 0; q < 22; q++){ const u = ((T * .5 + q * .21) % 1.4) / 1.4, a = q * 1.7; D.push({s: "star", x: ex + Math.cos(a) * 24 * u + Math.sin(cam.yaw) * 40 * u, y: ey + u * 30 - 6, z: ez + Math.sin(a) * 24 * u + Math.cos(cam.yaw) * 40 * u, w: 1.4, h: 1.4, c: [[.6, 1, .9], [1, .8, 1], [.8, .9, 1]][q % 3], a: .9 * (1 - u)}); } }
}
export const ST_AZ = {moon: 0, sheets: [0.4, 1.9, 3.5, 5.0]};
