// ===== 新アトラクション用の ステージ（とおくに つくった 専用の せかい）=====
//  どのステージも「のっている あいだだけ」見える（のりおわると かくす）ので、公園を あるく ときの 重さには ならない。
import {STAGES, MARS_TR, JUP_TR, AU_TR} from "./df-data.js";
import {trackPath, sstep} from "./df-coaster.js";
import {buildSweets, buildAurora, buildTerminals, dynSweets, dynAurora, genTargets, TARGETS, targetPos, frameAt, ST_AZ} from "./df-stages2.js";

export const STAGE_LAYERS = {};   // ステージ名 → レイヤーID の 一覧
const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let ST = null;   // 動くものを 出す ための じょうほう（ビルド時に ためる）

export function buildStages(h){
    const {layer, model, box, cyl, sph, pln} = h;
    let sd = 4242; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
    ST = {dolls: [], jupIslands: [], tracks: {mars: trackPath(MARS_TR), jupiter: trackPath(JUP_TR)}};
    const mk = (sid, opts) => {   // ステージごとの レイヤー4つ（ぜんぶ さいしょは かくれている）
        const o = opts || {};
        const L = {
            solid: layer(sid + "_solid", {hidden: true}).prims,
            ground: layer(sid + "_ground", Object.assign({hidden: true, tex: o.tex || "dirt"}, o.groundOpt || {})).prims,
            glow: layer(sid + "_glow", {hidden: true, add: true, tint: o.glowTint || [.34, .34, .34, .34]}).prims,
            cloud: layer(sid + "_cloud", {hidden: true, blend: true, tint: [1, 1, 1, o.cloudA || .82]}).prims
        };
        STAGE_LAYERS[sid] = [sid + "_solid", sid + "_ground", sid + "_glow", sid + "_cloud"];
        return L;
    };
    const near = (tr, x, z) => { let m = 1e9; for(const q of tr.pts){ const d = Math.hypot(q[0] - x, q[1] - z); if(d < m) m = d; } return m; };
    const bbox = (tr) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for(const q of tr.pts){ x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]); } return {x0, x1, z0, z1, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2}; };

    // ---- レール（ほそい ふたすじ ＋ まくらぎ ＋ 中心の はり ＋ 支柱 ＋ ひかる ゲート）----
    const buildRails = (L, tr, opt) => {
        const P = trackPath(tr), S = L.solid, GL = L.glow, step = 2.2, n = Math.ceil(P.total / step); let last = -99, gate = 0;
        for(let i = 0; i < n; i++){
            const s0 = i / n * P.total, s1 = (i + 1) / n * P.total, A = P.at(s0), B = P.at(s1);
            const yaw = Math.atan2(B[0] - A[0], B[2] - A[2]), pit = Math.atan2(B[1] - A[1], Math.hypot(B[0] - A[0], B[2] - A[2])), Ln = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) + .06;
            const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, mz = (A[2] + B[2]) / 2, c = Math.cos(yaw), sn = Math.sin(yaw);
            // レールは 少し 太めに（遠くから 細い 1本線に 見えて 電線みたいに ならないように）。柱も ずんぐりした トラス風の 太い 柱に する
            for(const k of [-.64, .64]) S.push({t: "b", x: mx + c * k, y: my - .1, z: mz - sn * k, w: .24, h: .26, d: Ln, c: opt.rail, ry: yaw, rx: -pit});
            S.push({t: "b", x: mx, y: my - .62, z: mz, w: .95, h: .56, d: Ln, c: opt.spine, ry: yaw, rx: -pit});
            if(i % 2 === 0) S.push({t: "b", x: mx, y: my - .22, z: mz, w: 1.7, h: .1, d: .24, c: "#3a3a44", ry: yaw, rx: -pit});
            if(my > 2.2 && s0 - last >= 13){ last = s0; cyl(S, mx, 0, mz, .5, .8, my - .95, opt.pole, 7); S.push({t: "b", x: mx, y: my - .98, z: mz, w: 2.6, h: .3, d: .7, c: opt.pole, ry: yaw}); }
            // ひかる リング（うえに 細い線を わたすと 電線みたいに 見えるので、わっかに する）
            if(s0 - gate >= opt.gateEvery){ gate = s0; const col = opt.gateCols[(Math.floor(s0 / opt.gateEvery)) % opt.gateCols.length];
                for(let q = 0; q < 18; q++){ const a = q / 18 * TAU, ca = Math.cos(a) * 3.6, sa = Math.sin(a) * 3.6; sph(GL, mx + c * ca, my + 1.4 + sa, mz - sn * ca, .4, col, 1, 5); } }
        }
        return P;
    };
    const station = (L, x, y, z, yaw, col, roof) => {   // はっしゃ ホーム
        const S = L.solid, c = Math.cos(yaw), s = Math.sin(yaw);
        S.push({t: "b", x, y: y - 1.4, z, w: 9, h: .8, d: 26, c: "#c0c4d0", ry: yaw});
        for(const k of [-4.6, 4.6]){ cyl(S, x + c * k, y - 1, z - s * k, .3, .3, 5.4, "#8a8fa0", 8); }
        S.push({t: "b", x, y: y + 4.4, z, w: 10.4, h: .6, d: 28, c: roof, ry: yaw});
        cyl(S, x, 0, z, 1.4, 1.8, y - 1.4, "#9a9fb0", 8);
    };

    // ======== ① 火星 ========
    {
        const L = mk("mars"), S = L.solid, G = L.ground, CL = L.cloud, GL = L.glow, tr = MARS_TR, B = bbox(tr);
        pln(G, B.cx, 0, B.cz, 1500, 1500, "#d0663a", 150, 150);
        pln(G, B.cx, .02, B.cz, 900, 900, "#b9552f", 60, 60);
        const P = buildRails(L, tr, {rail: "#ff8a3a", spine: "#5a3a30", pole: "#9a8a80", gateEvery: 58, gateCols: ["#46e6ff", "#ff7a3a", "#ffe46a"]});
        const st = P.at(14); station(L, st[0], st[1], st[2], 0, "#ff8a3a", "#c94a2a");
        const cols = ["#a8502c", "#b95e34", "#8e4226", "#c4703c", "#9c4c2e"];
        let made = 0; for(let i = 0; i < 520 && made < 150; i++){   // 赤い岩山（メサ）
            const x = B.cx + (rnd() - .5) * 1100, z = B.cz + (rnd() - .5) * 1100, rb = 10 + rnd() * 20, hh = 14 + rnd() * 52; if(near(tr, x, z) < rb + 22) continue; made++;
            cyl(S, x, -2, z, rb * .6, rb, hh, cols[(rnd() * cols.length) | 0], 7); if(rnd() < .5) cyl(S, x, hh - 2, z, rb * .42, rb * .6, 4, cols[(rnd() * cols.length) | 0], 7);
        }
        for(let i = 0; i < 520; i++){   // ころがる 岩
            const q = tr.pts[(rnd() * tr.pts.length) | 0], a = rnd() * TAU, d = 9 + rnd() * 34, x = q[0] + Math.cos(a) * d, z = q[1] + Math.sin(a) * d; if(near(tr, x, z) < 6 || q[2] > 20) continue;
            sph(S, x, 0, z, .8 + rnd() * 2.2, cols[(rnd() * cols.length) | 0], .72, 6);
        }
        for(let i = 0; i < 60; i++){   // クレーター（うすい 円）
            const x = B.cx + (rnd() - .5) * 1000, z = B.cz + (rnd() - .5) * 1000, r = 14 + rnd() * 40; if(near(tr, x, z) < r + 6) continue; cyl(G, x, .05, z, r, r, .02, "#8a4226", 14);
        }
        // 岩の アーチ（トンネルの ように 線路が くぐる）
        for(const frac of [.17, .46, .8]){ const s = P.total * frac, q = P.at(s), q2 = P.at(s + 2), yaw = Math.atan2(q2[0] - q[0], q2[2] - q[2]), c = Math.cos(yaw), sn = Math.sin(yaw), hh = q[1] + 11;
            for(const k of [-8, 8]) cyl(S, q[0] + c * k, 0, q[2] - sn * k, 3.4, 4.8, hh, "#a8502c", 7);
            S.push({t: "b", x: q[0], y: hh - 1, z: q[2], w: 22, h: 5, d: 8, c: "#b95e34", ry: yaw}); }
        for(let i = 0; i < 26; i++){   // 基地の とう（赤い ひかり）
            const x = B.cx + (rnd() - .5) * 1000, z = B.cz + (rnd() - .5) * 1000; if(near(tr, x, z) < 50) continue; cyl(S, x, 0, z, .8, 1.2, 40 + rnd() * 30, "#d8d8e8", 8); sph(GL, x, 44 + rnd() * 26, z, 3.4, "#ff4a4a"); }
        for(let i = 0; i < 40; i++){ const x = B.cx + (rnd() - .5) * 1100, z = B.cz + (rnd() - .5) * 1100, y = 14 + rnd() * 40; sph(CL, x, y, z, 24 + rnd() * 30, "#e8a47a", .28); }   // ほこりの くも
        for(const q of tr.pts.filter((_, i) => i % 6 === 0)){ const x = q[0], z = q[1]; sph(GL, x + 4, .6, z + 4, 1.8, "#ff7a3a"); }
    }

    // ======== ② 木星 ========
    {
        const L = mk("jupiter", {tex: "tile", cloudA: .9}), S = L.solid, G = L.ground, CL = L.cloud, GL = L.glow, tr = JUP_TR, B = bbox(tr);
        pln(G, B.cx, 0, B.cz, 1500, 1500, "#f4d6a8", 150, 150);
        const P = buildRails(L, tr, {rail: "#ffffff", spine: "#d8a050", pole: "#c9b89a", gateEvery: 50, gateCols: ["#ff6a8a", "#ffd24a", "#5ac8ff", "#9a7ae8", "#6ad89a"]});
        const st = P.at(14); station(L, st[0], st[1], st[2], 0, "#ffd24a", "#ff6a8a");
        for(let i = 0; i < 260; i++){   // くもの うみ（ひくい 雲）
            const x = B.cx + (rnd() - .5) * 1300, z = B.cz + (rnd() - .5) * 1300, y = 1 + rnd() * 9; sph(CL, x, y, z, 14 + rnd() * 26, ["#ffffff", "#ffe9d0", "#ffd2b0", "#f6c8a0"][(rnd() * 4) | 0], .34);
        }
        for(let i = 0; i < 40; i++){   // たかい くもの はしら
            const a = rnd() * TAU, d = 260 + rnd() * 300, x = B.cx + Math.cos(a) * d, z = B.cz + Math.sin(a) * d, hh = 40 + rnd() * 80; cyl(CL, x, 0, z, 18 + rnd() * 10, 30 + rnd() * 20, hh, "#fff2e0", 9); sph(CL, x, hh, z, 30 + rnd() * 16, "#ffffff", .7);
        }
        // おまつりの しま（せかいの おどり）：トラックの まわりに うかぶ
        const themes = ["snow", "desert", "flower", "palm", "city", "forest"]; let ii = 0;
        for(let i = 0; i < 60 && ii < 26; i++){
            const q = tr.pts[((i * 37) % tr.pts.length)], a = rnd() * TAU, d = 38 + rnd() * 70, x = q[0] + Math.cos(a) * d, z = q[1] + Math.sin(a) * d; if(near(tr, x, z) < 30) continue;
            const y = Math.max(2, q[2] * .5 + (rnd() - .5) * 8), th = themes[ii % 6], rad = 11 + rnd() * 5; ii++;
            cyl(S, x, y - 7, z, rad, rad * .45, 7, "#8a6a4a", 10); cyl(S, x, y, z, rad, rad, .6, th === "desert" ? "#e8c880" : th === "snow" ? "#f4f8ff" : "#6fcf5a", 10);
            if(th === "snow"){ for(let k = 0; k < 3; k++){ const aa = k * 2.1; cyl(S, x + Math.cos(aa) * 5, y + .6, z + Math.sin(aa) * 5, 0, 4 + k, 6 + k * 2, "#ffffff", 8); } sph(S, x - 2, y + .6, z + 5, 2.2, "#e8f4ff", .8); }
            else if(th === "desert"){ for(let k = 0; k < 3; k++){ cyl(S, x + (k - 1) * 6, y + .6, z + (k % 2) * 3, 0, 4.2 - k * .6, 5 - k * .5, "#d8a850", 4); S[S.length - 1].ry = .78; } }
            else if(th === "flower"){ for(let k = 0; k < 26; k++){ const aa = k * 2.4, rr = 2 + (k % 6) * 1.3; sph(S, x + Math.cos(aa) * rr, y + .8, z + Math.sin(aa) * rr, .55, ["#ff6a8a", "#ffd24a", "#c88aff", "#ff9a3a"][k % 4], 1, 5); } cyl(S, x, y + .6, z, .8, 1.2, 7, "#f0e8d8", 8); for(let k = 0; k < 4; k++) S.push({t: "b", x: x + (k % 2 ? 2.4 : -2.4) * 0 , y: y + 7.4, z, w: .3, h: 5, d: .8, c: "#ff9a3a", rx: 0, rz: k * 1.57, ry: 0}); }
            else if(th === "palm"){ cyl(S, x, y + .3, z, rad * .7, rad * .7, .3, "#4aa8e8", 10); for(let k = 0; k < 5; k++){ const aa = k * 1.3, px = x + Math.cos(aa) * 6, pz = z + Math.sin(aa) * 6; cyl(S, px, y + .6, pz, .2, .34, 5, "#a0764a", 6); for(let m = 0; m < 4; m++) S.push({t: "b", x: px + Math.cos(m * 1.57) * 1, y: y + 5.4, z: pz + Math.sin(m * 1.57) * 1, w: 2.4, h: .14, d: .7, c: "#4fb25a", ry: -m * 1.57}); } }
            else if(th === "city"){ for(let k = 0; k < 9; k++){ const aa = k * .7, rr = 1 + (k % 4) * 2, hh = 3 + ((k * 5) % 8); box(S, x + Math.cos(aa) * rr, y + .6, z + Math.sin(aa) * rr, 2, hh, 2, ["#9aa8d8", "#d89aa8", "#a8d8b8"][k % 3]); sph(GL, x + Math.cos(aa) * rr, y + hh * .7, z + Math.sin(aa) * rr, 1.2, "#ffe9a0"); } }
            else { for(let k = 0; k < 7; k++){ const aa = k * 2.4, rr = 3 + (k % 3) * 2; cyl(S, x + Math.cos(aa) * rr, y + .6, z + Math.sin(aa) * rr, .3, .45, 4, "#7a5232", 6); sph(S, x + Math.cos(aa) * rr, y + 5, z + Math.sin(aa) * rr, 2, ["#3f9a4a", "#4fb25a", "#6ad86a"][k % 3], 1, 6); } }
            ST.jupIslands.push({x, y, z, rad, th});
            for(let k = 0; k < 3; k++) ST.dolls.push({x: x + Math.cos(k * 2.1 + i) * (rad * .45), y: y + .6, z: z + Math.sin(k * 2.1 + i) * (rad * .45), m: "doll" + ((ii + k) % 6), ph: rnd() * 6});
        }
    }

    // ---- 木星の おどる 人形（オリジナル：ふくの 色だけ ちがう）----
    ["#ff6a8a", "#ffd24a", "#5ac8ff", "#9a7ae8", "#6ad89a", "#ff9a3a"].forEach((c, i) => {
        const m = model("doll" + i), P = m.prims; cyl(P, 0, .4, 0, .38, .55, 1.0, c, 8); sph(P, 0, 1.75, 0, .42, "#ffe0c4", 1, 8); cyl(P, 0, 2.05, 0, .2, .46, .42, ["#ffffff", "#ffd24a", "#ff6a8a"][i % 3], 8);
        box(P, -.62, 1.0, 0, .16, .7, .16, c, 0, 0, .7); box(P, .62, 1.0, 0, .16, .7, .16, c, 0, 0, -.7); sph(P, -.14, 1.8, .36, .06, "#2a2a40"); sph(P, .14, 1.8, .36, .06, "#2a2a40");
    });
    const K = {mk, near, bbox, rnd, h, ST}; buildSweets(K); buildAurora(K); ST_AZ.moon = AU_END_YAW(); buildTerminals(h);
}
const AU_END_YAW = () => AU_TR.end.yaw * Math.PI / 180;

// いまの ステージで カメラの まわりに 出す 「動くもの」
export function stageDyn(g, D){
    const R = g.ride; if(!R || !R.A && !R.a) return; const T = g.t, A = R.A, id = A ? A.stage : (R.a.stage || R.a.id);
    if(id === "jupiter" && ST){
        for(const d of ST.dolls){ const b = Math.abs(Math.sin(T * 2.6 + d.ph)) * .5; D.push({m: d.m, x: d.x, y: d.y + b, z: d.z, yaw: T * .8 + d.ph}); }
    } else if(id === "sweets") dynSweets(g, D, R, T);
    else if(id === "aurora") dynAurora(g, D, R, T);
}
// ステージごとの そらの いろ（きかくの 時間で かわる ものは ここで）
export function stageEnv(g, base){ return base; }
export {STAGES, sstep, clamp, lerp, genTargets, TARGETS, targetPos, frameAt};
