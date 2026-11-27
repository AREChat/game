// ===== 新アトラクション5つ（リズム／迷路／ループ／ジャンプ／ランナー）の 登録 =====
//  Game から：X[kind] が あれば、のりこみ(init)・毎フレーム(update)・カメラ(camera)・うごくもの(dyn)・HUD(hud)・おわり(end) を その モジュールに まかせる。
//  df-stages.js の buildStages の さいごで buildExtra(K) を よぶ（ステージと 入口の ぶたいを つくる）。
import {rhythm} from "./df-x-rhythm.js";
import {maze} from "./df-x-maze.js";
import {jump} from "./df-x-jump.js";
import {kart} from "./df-x-kart.js";
import {cheese} from "./df-x-cheese.js"; import {queue} from "./df-x-queue.js"; import {loop} from "./df-x-loop.js"; import {cosmo} from "./df-x-cosmo.js"; import {ghostBuild} from "./df-ghost.js";

export const X = {rhythm, maze, jump, kart, loop, cheese, queue, cosmo};
export function buildExtra(K){ for(const k of Object.keys(X)) if(X[k].build) X[k].build(K); ghostBuild(K); buildEntrances(K); }

// ---- のりばの まえの 入口（ゲート）：5つの アトラクションの めじるし。とおくからでも みつけやすい ----
export function buildEntrances(K){
    const {box, cyl, sph} = K.h, S = K.h.layer("solid").prims, GL = K.h.layer("glow").prims, TAU = Math.PI * 2;
    const place = (bx, bz, back) => { const d = Math.hypot(bx, bz) < 22 ? [0, 1] : [bx / Math.hypot(bx, bz), bz / Math.hypot(bx, bz)], gx = bx + d[0] * back, gz = bz + d[1] * back, yaw = Math.atan2(d[0], d[1]), c = Math.cos(yaw), s = Math.sin(yaw);
        return {yaw, W: (lx, lz) => [gx + lx * c + lz * s, gz - lx * s + lz * c], B: (P, lx, y, lz, w, h, dd, col, rx, rz) => { const [x, z] = place.W0(gx, gz, c, s, lx, lz); box(P, x, y, z, w, h, dd, col, yaw, rx || 0, rz || 0); }, Y: (P, lx, y, lz, rt, rb, h, col, seg) => { const [x, z] = place.W0(gx, gz, c, s, lx, lz); cyl(P, x, y, z, rt, rb, h, col, seg || 8); }, O: (P, lx, y, lz, r, col, sy, seg) => { const [x, z] = place.W0(gx, gz, c, s, lx, lz); sph(P, x, y, z, r, col, sy || 1, seg || 6); }}; };
    place.W0 = (gx, gz, c, s, lx, lz) => [gx + lx * c + lz * s, gz - lx * s + lz * c];
    // リズム：ピアノの けんばん ゲート
    { const g = place(14, 42, 6.5), LC = ["#ff5a8a", "#ffc94a", "#46e6ff", "#9a7aff"];
        g.B(S, 0, 0, 0, 11, .4, 3.2, "#2a2a4a"); LC.forEach((c, i) => { g.B(S, (i - 1.5) * 2.4, .4, 0, 1.9, 3.4 + i * .5, 1.6, c); g.B(GL, (i - 1.5) * 2.4, 3.9 + i * .5, 0, 1.9, .12, 1.6, c); });
        for(const sx of [-1, 1]){ g.B(S, sx * 5.6, 0, 0, 1.7, 5.4, 1.7, "#1a1a30"); for(let q = 0; q < 3; q++) g.O(GL, sx * 5.6, 1.2 + q * 1.4, .9, .45, LC[(q + (sx > 0 ? 2 : 0)) % 4], 1, 6); }
        g.B(S, 0, 6.2, 0, 12, .5, 1, "#1a1a30"); for(let i = 0; i < 12; i++) g.B(GL, -5.5 + i, 6.5, 0, .5, .2, 1.1, LC[i % 4]); }
    // ミラー・ラビリンス：ガラスの パビリオン
    { const g = place(-88, -30, 6.5);
        g.B(S, 0, 0, 0, 9, .3, 5, "#3a2a68"); for(const [lx, lz, w, d] of [[-3.8, 0, .5, 5], [3.8, 0, .5, 5], [-1.4, 1.6, 3.6, .5], [1.9, -1.6, 3.4, .5]]) g.B(S, lx, .3, lz, w, 3.4, d, "#c8b4ff");
        g.Y(S, 0, 3.7, 0, 0, 4.8, 2.8, "#8a6ad8", 4); g.O(GL, 0, 6.8, 0, .7, "#ffffff", 1, 6); for(const sx of [-1, 1]){ g.Y(S, sx * 4.8, 0, 2.4, .25, .3, 4.4, "#b89aff", 6); g.O(GL, sx * 4.8, 4.8, 2.4, .5, "#ffe27a", 1, 6); } }
    // ギャラクシー・ループ：ネオンの 大きな わっか
    { const g = place(-88, -70, 7), R = 5.2, cy0 = 6.4;
        for(let i = 0; i < 30; i++){ const a2 = i / 30 * TAU + TAU / 60, x = Math.cos(a2) * R, y = cy0 + Math.sin(a2) * R; g.B(S, x, y, 0, 1.75, .4, .4, i % 2 ? "#d8f4ff" : "#ffd8f4", 0, a2 + Math.PI / 2); g.B(GL, x, y + .1, 0, 1.78, .2, .2, i % 2 ? "#46e6ff" : "#ff6ad8", 0, a2 + Math.PI / 2); }
        for(const sx of [-1, 1]) g.B(S, sx * 2.4, 0, 0, .7, 1.6, 1.2, "#5a4aa0"); g.B(S, 0, 0, 0, 7.4, .3, 4, "#2a2a5a"); for(const sx of [-1, 1]) for(let q = -1; q <= 1; q += 2) g.B(GL, sx * .64, .35, q * 1.4, .16, .1, 1.6, sx < 0 ? "#46e6ff" : "#ff6ad8"); g.O(GL, 0, cy0, 0, .9, "#ffe27a", 1, 6); }
    // ふわふわ・スカイジャンプ：ういている しま の かいだん
    { const g = place(-86, 90, 6.5);
        [[-3.4, .6, -.8, 3.2], [0, 2.0, .4, 3.4], [3.4, 3.5, -.2, 3.2]].forEach(([lx, y, lz, w], i) => { g.B(S, lx, y - 1.1, lz, w, 1.0, w, "#8a6a4a"); g.B(S, lx, y - .1, lz, w + .1, .18, w + .1, "#6fcf5a"); g.Y(S, lx, y - 3.4, lz, w * .25, w * .3, 2.3, "#7a5a3a", 6); });
        g.Y(S, 3.4, 3.4, -.2, .09, .12, 4.2, "#f4f4ff", 6); g.B(S, 4.1, 6.5, -.2, 1.4, .8, .08, "#ff5a8a"); g.O(GL, 3.4, 7.8, -.2, .3, "#ffe27a", 1, 6);
        g.Y(S, -3.4, .6, -.8, .8, .8, .35, "#44485a", 10); g.Y(S, -3.4, .95, -.8, .95, .95, .25, "#ff4a7a", 12); for(let i = 0; i < 5; i++) g.O(GL, -4.4 + i * 2.2, 5 + Math.sin(i) * 1.2, .5, .38, "#ffe27a", 1, 6); }
    // ドリーム・ランナー：チェッカーの ゲート
    { const g = place(88, -86, 6.5);
        for(const sx of [-1, 1]) g.Y(S, sx * 4.6, 0, 0, .35, .4, 6, "#ffffff", 8);
        for(let a = 0; a < 12; a++) for(let b = 0; b < 2; b++) g.B(S, (a - 5.5) * .78, 5.4 + b * .8, 0, .78, .8, .5, (a + b) % 2 ? "#ffffff" : "#222233");
        g.B(S, 0, 7.1, 0, 9.8, .5, .6, "#ff5a7a"); g.B(GL, 0, 7.55, 0, 9.4, .12, .6, "#ffe27a");
        for(const sx of [-1, 1]) for(let q = 0; q < 3; q++){ g.Y(S, sx * 6.6, q * .62, -.4, .6, .6, .6, q % 2 ? "#ffffff" : "#ff4a5a", 10); g.Y(S, sx * 6.6, q * .62 + .01, .9, .6, .6, .6, q % 2 ? "#ff4a5a" : "#ffffff", 10); }
        for(let k = 0; k < 6; k++) g.B(S, (k - 2.5) * 1.5, 0, 3, 1.5, .08, 1.5, k % 2 ? "#ffffff" : "#222233");
        g.B(S, 0, 0, 5.2, 4.6, .5, 1.4, "#ff9a4a", -.35); }
}
