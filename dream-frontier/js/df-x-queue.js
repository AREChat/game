// ===== ぜんアトラクション共通の キューライン（まち時間）=====
//  2026年11月26日から 導入。のりばに ちかづいて「のる」を おすと、まず キューラインに ならぶ（まち時間が みじかければ すぐ のれる）。
//  E：みんなで かんせい！／ファストパス：とばして すぐ のる。ならんでいる ひとの かずは、まち時間に あわせて ふえたり へったり する。
import {propReady} from "./df-props.js";
import {TAU, clamp, lerp, ease, root, clearRoot, el, bodyOn} from "./df-xlib.js";
import {makePath} from "./df-path.js";
import {waitMinutes, hasQueue, started, queueSeconds, mood, record, jokeNote} from "./df-wait.js";
import {digitPrims} from "./df-x-cheese-art.js";

const QX = 2600, QZ = 0;
let QP = null;
const LANES = 4, LH = 15, LS = 4.2;
function ensure(){
    if(QP) return;
    const P = [[-24, 0, 0], [-16, 0, 0]];
    for(let k = 0; k < LANES; k++){ const d = k % 2 ? -1 : 1, z = k * LS, ex = d * LH; P.push([(-d * LH + ex) / 2, z, 0], [ex, z, 0]); if(k < LANES - 1) P.push([ex + d * 2.4, z + LS / 2, 0]); P.push([k < LANES - 1 ? ex : ex, z + (k < LANES - 1 ? LS : 0), 0]); }
    P.splice(P.length - 1, 1); P.push([-20, (LANES - 1) * LS, 0]);
    QP = makePath(P.map((q) => [q[0] + QX, q[1] + QZ, q[2]]), false, 10);
}
const hd = (s, d) => { const P = QP, a = P.at(Math.max(0, s - d)), b = P.at(Math.min(P.total - .01, s + d)); return Math.atan2(b[0] - a[0], b[2] - a[2]); };
const pos = (s, lat) => { const c = QP.at(clamp(s, 0, QP.total - .01)), y = hd(clamp(s, 0, QP.total - .01), .7); return {x: c[0] - Math.cos(y) * (lat || 0), z: c[2] + Math.sin(y) * (lat || 0), yaw: y}; };
const sq = (R, t) => { const N = Math.max(4, Math.round(R.secs / 5)), per = R.secs / N, k = Math.min(N, Math.floor(t / per)), u = (t - k * per) / per, f = (k + (k >= N ? 0 : ease(clamp((u - .25) / .6, 0, 1)))) / N; return R.s0 + (QP.total - 3 - R.s0) * f; };

export const queue = {
    build(K){
        ensure(); const {box, cyl, sph, pln} = K.h, L = K.mk("qline", {tex: "wood", cloudA: .8, glowTint: [.7, .7, .7, .7]}), S = L.solid, G = L.ground, GL = L.glow;
        const b = (Q, x, y, z, w, h, d, c, ry) => box(Q, QX + x, y, QZ + z, w, h, d, c, ry || 0), cz = (LANES - 1) * LS / 2;
        pln(G, QX, 0, QZ + cz, 62, 34, "#f0d8a8", 10, 6);
        for(let i = -3; i <= 3; i++) for(const sz of [-1, 1]){ b(S, i * 9, 0, cz + sz * 16, .5, 6.4, .5, "#8a5a2a"); }   // はしら
        for(let i = 0; i < 14; i++) b(S, -28 + i * 4.3, 6.6, cz, 4.3, .3, 34, i % 2 ? "#ff7a8a" : "#fff4e0");                // しましまの やね
        for(let i = 0; i < 40; i++){ const x = -28 + i * 1.5; cyl(GL, QX + x, 6.0, QZ + cz + (i % 2 ? 10 : -10), .12, .12, .1, "#ffe27a", 4); sph(GL, QX + x, 6.0, QZ + cz + (i % 2 ? 10 : -10), .2, ["#ffe27a", "#ff9aca", "#9ad8ff"][i % 3], 1, 5); }
        for(let j = 0; j <= LANES; j++){ const z = -LS / 2 + j * LS, open = j > 0 && j < LANES ? ((j - 1) % 2 === 0 ? 1 : -1) : 0, x0 = open > 0 ? -18 : -13, x1 = open > 0 ? 13 : 18;
            for(let x = x0; x <= x1; x += 3){ cyl(S, QX + x, 0, QZ + z, .1, .12, .9, "#d8d8e8", 6); sph(S, QX + x, 1.0, QZ + z, .15, "#ffd24a", 1, 6); } b(S, (x0 + x1) / 2, .75, z, x1 - x0, .06, .06, "#e83a4a"); }
        for(const sx of [-1, 1]) b(S, sx * 31, 0, cz, .5, 6.4, 34, ["#bfe8ff", "#ffe0f0"][sx > 0 ? 1 : 0]);
        b(S, 0, 0, cz + 17.4, 62, 6.4, .5, "#bfe8ff"); for(let i = 0; i < 6; i++) b(S, -22 + i * 9, 1.4, cz + 17.1, 5, 3.4, .1, ["#ff9aca", "#9ad8ff", "#ffe27a", "#9affc0", "#c8a8ff", "#ffb060"][i]);   // かべの バナー
        for(const [x, z] of [[-26, -6], [26, -6], [26, 20], [-26, 20]]){ cyl(S, QX + x, 0, QZ + z, .5, .6, 1.2, "#c8744a", 8); sph(S, QX + x, 2.0, QZ + z, 1.2, "#58b84a", 1, 7); }
        // ===== ごうかな かざり（ぜんアトラクション きょうつう）=====
        { const GOLD = "#ffd24a", DGOLD = "#c98a1a", y_ = (Q, x, y, z, rt, rb, h, c, seg) => cyl(Q, QX + x, y, QZ + z, rt, rb, h, c, seg || 10), o_ = (Q, x, y, z, r, c, sy, seg) => sph(Q, QX + x, y, QZ + z, r, c, sy || 1, seg || 7), fl = (x, z, w, d, c, y) => pln(G, QX + x, y, QZ + z, w, d, c, 1, 1);
            // ゆか：チェッカー と 赤い じゅうたん（レーンごと）、金の ふち
            for(let ix = 0; ix < 15; ix++) for(let iz = 0; iz < 9; iz++) if((ix + iz) % 2) fl(-28 + ix * 4, -10 + iz * 4, 4, 4, "#e8c870", .015);
            for(let k = 0; k < LANES; k++){ const z = k * LS; fl(0, z, 46, LS - 1.1, "#a82434", .03); fl(0, z - (LS - 1.1) / 2 + .1, 46, .2, GOLD, .04); fl(0, z + (LS - 1.1) / 2 - .1, 46, .2, GOLD, .04); fl(0, z, 46, .12, "#ff8a8a", .04); }
            // はしら（金の かざり）・ステンドグラス・はち植え（ぎゃくがわの かべ ぎわ）
            for(const sx of [-1, 1]){ const x = sx * 30.2;
                for(let i = 0; i < 6; i++){ const z = -9.5 + i * 6.2; b(S, sx * 30.4, 0, z, 1.4, .5, 1.4, "#7a4a1a"); y_(S, sx * 30.2, .5, z, .45, .5, 5.3, "#f6e4b4", 12); b(S, sx * 30.2, 5.7, z, 1.3, .4, 1.3, GOLD); b(S, sx * 30.2, 6.1, z, 1.5, .4, 1.5, DGOLD); y_(S, sx * 30.2, 1.0, z, .55, .55, .12, GOLD, 12); }
                for(let i = 0; i < 5; i++){ const z = -6.4 + i * 6.2, gc = ["#8ad0ff", "#ffb0e0", "#a8ffd0", "#ffe27a", "#d8b0ff"][i]; b(S, sx * 30.55, 3.0, z, .2, 3.0, 3.6, GOLD); b(GL, sx * 30.4, 3.0, z, .08, 2.6, 3.2, gc); b(S, sx * 30.3, 3.0, z, .1, 2.6, .12, GOLD); b(S, sx * 30.3, 3.0, z, .1, .12, 3.2, GOLD); }
                for(const z of [-4, 6.3, 16.6]){ y_(S, sx * 28.6, 0, z, .45, .36, .7, "#c8582a", 10); o_(S, sx * 28.6, 1.5, z, .8, "#3fa84a", 1, 7); o_(S, sx * 28.9, 1.15, z + .3, .5, "#52c05a", 1, 6); for(let f = 0; f < 4; f++) o_(S, sx * 28.6 + Math.cos(f * 1.7) * .7, 1.7 + (f % 2) * .3, z + Math.sin(f * 1.7) * .7, .13, ["#ff8aa8", "#fff27a", "#ffffff", "#ffa05a"][f], 1, 5); } }
            // てんじょう：金の はり ＋ シャンデリア ＋ かざりばた
            for(const z of [-8, -2, 4, 10, 16, 22]) { b(S, 0, 6.2, z, 62, .4, .6, DGOLD); }
            for(const x of [-18, 0, 18]) b(S, x, 6.2, cz, .6, .4, 34, DGOLD);
            for(const z of [-2, cz, 14.6]){ y_(S, 0, 5.6, z, .07, .07, 1.0, "#6a4a1a", 4); y_(S, 0, 5.1, z, .5, .4, .6, GOLD, 10); o_(S, 0, 5.0, z, .55, "#ffe27a", 1, 8); o_(GL, 0, 5.0, z, 1.6, "#fff0b0", .8, 8);
                for(let a = 0; a < 8; a++){ const an = a / 8 * TAU, ax = Math.cos(an) * 2.0, az = Math.sin(an) * 2.0; b(S, ax / 2, 4.95, z + az / 2, 2.0, .08, .08, GOLD, -an); y_(S, ax, 4.75, z + az, .26, .13, .28, GOLD, 8); o_(GL, ax, 5.2, z + az, .4, "#fff0b0", 1, 6); o_(S, ax, 5.15, z + az, .16, "#fffbe0", 1.3, 6); o_(S, ax, 4.4, z + az, .13, "#d8f2ff", 1.9, 5); }
                o_(S, 0, 4.2, z, .24, "#bfe8ff", 2.1, 6); }
            for(const z of [-6, 1.5, 11, 19]){ b(S, 0, 5.75, z, 58, .04, .04, "#3a2a1a"); for(let x = -28, n = 0; x <= 28; x += 1.3, n++) b(S, x, 5.1 - (n % 2) * .06, z, .5, .6, .05, ["#e83a4a", "#ffd23a", "#37a2ee", "#5ad66a", "#ff8ac0"][n % 5]); }
            // いりぐち ぎわの 金の ぞう（そらを みあげる ほし）と かざり
            for(const [x, z] of [[-24, 21.5], [24, 21.5]]){ b(S, x, 0, z, 2.2, 1.0, 2.2, "#7a4a1a"); b(S, x, 1.0, z, 2.5, .16, 2.5, GOLD); o_(S, x, 2.2, z, .8, GOLD, 1.2, 8); b(S, x, 3.0, z, .12, 1.0, .12, GOLD); o_(S, x, 3.9, z, .4, "#fff2a0", 1, 6); }
        }
    },
    // E の えんしゅつ や うしろに ならぶ ひとの かず などは dyn で
    begin(g, a){
        if(!started() || !hasQueue(a.id) || a.id === "cheese" || g.auto.on || g.mode !== "walk" || a.kind === "quest" || a.kind === "show") return false;
        const w = waitMinutes(a.id); if(w <= 0){ g.ui.toast("🟢 いま まち時間 0ふん！ すぐ のれるよ"); return false; }
        if(a.coin && g.sv.coins < a.coin){ return false; }   // コインが たりない 表示は ふつうの のりこみに まかせる
        ensure(); const fa = {id: "q_" + a.id, n: a.n + "の キューライン", kind: "queue", vehicle: "queue", area: a.area, board: a.board, coin: 0, orig: a, desc: ""};
        const R = {a: fa, t: 0, s: 0, lap: 0, text: null, texts: {}, alt: .3, spd: 1, hits: 0, targets: [], fire: 0, spawn: 0, done: false, fade: 1};
        R.xm = queue; R.A = {stage: "qline", env: "qline", xm: true}; R.auto = false; g.ride = R; g.mode = "ride"; g.lookYaw = 0; g.lookPitch = 0; g.pitch = 0;
        g.ui.rideStart(fa); queue.init(g, R, fa); return true;
    },
    init(g, R, fa){
        ensure(); const a = fa.orig; R.w = waitMinutes(a.id); R.secs = queueSeconds(R.w); R.s0 = Math.max(0, QP.total - 3 - R.secs * 1.45); R.cheerT = -99; R.skipReq = false; R.fin = 0; R.id = a.id;
        const r = root(); clearRoot(); bodyOn("queue", true);
        R.h = {top: el("div", "xh", "", "left:10px;top:8px;font-size:clamp(12px,2.6vw,17px)"), hint: el("div", "xh", "", "left:10px;bottom:9%;font-size:clamp(11px,2.4vw,14px)"), skip: el("div", "xbtn", "⏩ ファストパス", "right:12px;bottom:25%;width:auto;padding:6px 14px;font-size:clamp(13px,2.8vw,17px);height:auto")};
        R.h.skip.addEventListener("click", () => { R.skipReq = true; }); R.h.skip.addEventListener("touchstart", (e) => { R.skipReq = true; e.preventDefault(); }, {passive: false});
        for(const k of ["top", "hint", "skip"]) r.appendChild(R.h[k]);
        const [m] = mood(R.w); g.ui.toast("⏱ いまの まち時間：約 " + R.w + " ふん（" + m + "）" + (jokeNote(R.w) ? "　" + jokeNote(R.w) : "") + "。ここでは ぎゅっと " + R.secs + "びょうに ちぢめているよ", 4600);
    },
    update(g, R, dt, inp){
        const t = R.t; let fast = false;
        if(R.skipReq){ fast = true; } if(!fast && inp.act && t - R.cheerT > 1.2){ R.cheerT = t; g.sfx("fan"); g.ui.toast("🎉 みんなで かんせい！", 1200); }
        if(fast || t >= R.secs){ if(!R.fin){ R.fin = 1; const a = R.a.orig; record(g.sv, a.id, R.w, fast); g.save(); g.endRide(false, true); g._noQueue = true; g.board(a); } return; }
        const m = Math.max(0, Math.ceil(R.w * (1 - t / R.secs))), set = (e, v) => { if(e._v !== v){ e._v = v; e.innerHTML = v; } };
        set(R.h.top, "<span class='xpill'>⏱ " + R.a.orig.n + "　あと 約 <b>" + m + "</b> ふん</span>"); set(R.h.hint, "<span class='xpill'>E：みんなで かんせい！　ドラッグ：みまわす　Q：やめる</span>");
    },
    camera(g, R){ const s = sq(R, R.t), c = QP.at(clamp(s, 0, QP.total - .01)), mv = sq(R, R.t + .15) - s > .002; return {eye: [c[0], 1.62 + (mv ? Math.sin(g.t * 9) * .03 : 0), c[2]], yaw: hd(clamp(s, 0, QP.total - .01), 1.4) + g.lookYaw, pitch: g.lookPitch * .8, fov: 72}; },
    dyn(g, R, D){
        const T = g.t, t = R.t, s = sq(R, t), cam = QP.at(clamp(s, 0, QP.total - .01)), mv = sq(R, t + .15) - s > .002, cheer = clamp(1 - (t - R.cheerT) / 1.1, 0, 1), sp = lerp(4.6, 1.5, clamp(R.w / 80, 0, 1));
        for(let i = 0, off = -s; off < QP.total; i++, off += sp){ if(Math.abs(off - s) < 1.4 && false) continue; const sP = off; if(sP < 0 || sP > QP.total - 1.5 || Math.abs(sP - s) < 1.5) continue; const lat = ((i * 7) % 5 - 2) * .35, p = pos(sP, lat); if(Math.hypot(p.x - cam[0], p.z - cam[2]) > 36) continue;
            const m = "guest" + (i % 6), jump = cheer * Math.abs(Math.sin(T * 12 + i)) * .5, bob = mv ? Math.abs(Math.sin(T * 7 + i)) * .06 : Math.sin(T * 2 + i) * .015; D.push({m, p: m, x: p.x, y: bob + jump, z: p.z, yaw: p.yaw + (i % 4 === 0 ? .9 : 0)}); }
        if(cheer > 0) for(let q = 0; q < 12; q++){ const a = q / 12 * TAU + T, rr = 1.5 + (1 - cheer) * 4, yw = hd(s, 1.2); D.push({s: "star", x: cam[0] + Math.sin(a) * rr + Math.sin(yw) * 3, y: 1.6 + (1 - cheer) * 3, z: cam[2] + Math.cos(a) * rr + Math.cos(yw) * 3, w: .5, h: .5, c: [1, .85, .4], a: cheer}); }
        // ごうかな かざり：シャンデリアの きらめき・ゆれる ふうせん・そのアトラクションの いろの ひかり・キラキラ
        { const AC = {center: [1, .85, .4], grove: [.5, 1, .55], lagoon: [.5, .85, 1], manor: [.8, .55, 1], sky: [1, .6, .85]}, col = AC[R.a.orig.area] || AC.center, cz2 = (LANES - 1) * LS / 2;
            for(const zq of [-2, cz2, 14.6]) for(let a = 0; a < 8; a++){ const an = a / 8 * TAU; D.push({s: "glow", x: QX + Math.cos(an) * 2.0, y: 5.2, z: QZ + zq + Math.sin(an) * 2.0, w: 1.2, h: 1.2, c: [1, .92, .6], a: .3 + .25 * Math.sin(T * 3.2 + a * 1.3 + zq)}); }
            for(let i = 0; i < 6; i++) D.push({s: "glow", x: QX - 25 + i * 10, y: 5.6, z: QZ + cz2, w: 6, h: 3, c: col, a: .2 + .08 * Math.sin(T * 1.5 + i)});
            for(let i = 0; i < 6; i++){ const sd = i % 2 ? -1 : 1, bob = Math.sin(T * 1.4 + i * 1.7); D.push({m: "ch_bal", x: QX + sd * 27, y: 4.7 + bob * .3, z: QZ - 7 + (i >> 1) * 11, yaw: T * .6 + i, sx: 1.6, sy: 1.6, sz: 1.6}); }
            for(let i = 0; i < 20; i++){ const ph = (T * .11 + i * .137) % 1; D.push({s: "glow", x: QX - 28 + (i * 37) % 56, y: .8 + ph * 5, z: QZ - 9 + (i * 53) % 32, w: .45, h: .45, c: [col[0], col[1], col[2]], a: Math.sin(ph * Math.PI) * .85}); } }
        // かべの のこり時間
        const mm = Math.max(0, Math.ceil(R.w * (1 - t / R.secs))), d1 = (mm / 10) | 0, d0 = mm % 10, zc = QZ + (LANES - 1) * LS / 2 + 16.6;
        if(d1 > 0) D.push({m: "ch_d" + d1, x: QX - 1.2, y: 3.2, z: zc, yaw: Math.PI, sx: 2, sy: 2, sz: 1}); D.push({m: "ch_d" + d0, x: QX + (d1 > 0 ? 1.2 : 0), y: 3.2, z: zc, yaw: Math.PI, sx: 2, sy: 2, sz: 1});
    },
    hud(R){ return "キューライン　あと 約 " + Math.max(0, Math.ceil(R.w * (1 - R.t / R.secs))) + " ふん"; },
    end(g, R){ clearRoot(); bodyOn("queue", false); },
    // ---- 公園を あるく とき：のりばの そばに ならぶ ひとと、まち時間の ひょうじ ----
    walkDyn(g, D, atts){
        const T = g.t; if(!started()) return;
        for(const a of atts){ if(!hasQueue(a.id) || !a.board) continue; const bx = a.board.x, bz = a.board.z, dx = g.x - bx, dz = g.z - bz, dist = Math.hypot(dx, dz); if(dist > 46) continue;
            const w = waitMinutes(a.id), n = Math.min(14, Math.round(w / 6)), h0 = Math.hypot(bx, bz) < 22 ? [0, 1] : [bx / Math.hypot(bx, bz), bz / Math.hypot(bx, bz)], yaw = Math.atan2(-h0[0], -h0[1]);
            if(a.id !== "cheese") for(let i = 0; i < n; i++){ const back = 2.8 + i * 1.25, lat = (i % 2 ? .6 : -.6) + Math.sin(i * 1.7) * .3, rx = -Math.cos(Math.atan2(h0[0], h0[1])), rz = Math.sin(Math.atan2(h0[0], h0[1])), m = "guest" + ((i + a.id.length) % 6);
                D.push({m, p: m, x: bx + h0[0] * back + rx * lat, y: Math.abs(Math.sin(T * 2 + i)) * .02, z: bz + h0[1] * back + rz * lat, yaw}); }
            if(dist < 30 && !(a.id === "cheese" && propReady("prop/cheese_sign"))){ const yw = Math.atan2(dx, dz), rx = -Math.cos(yw), rz = Math.sin(yw), d1 = (w / 10) | 0, d0 = w % 10, col = mood(w)[1], y = 5.4 + Math.sin(T * 2 + bz) * .15, sc = 1.5;
                if(w > 0){ if(d1 > 0) D.push({m: "ch_d" + d1, x: bx + rx * -.55 * sc, y, z: bz + rz * -.55 * sc, yaw: yw + Math.PI, sx: sc, sy: sc, sz: 1}); D.push({m: "ch_d" + d0, x: bx + rx * (d1 > 0 ? .55 : 0) * sc, y, z: bz + rz * (d1 > 0 ? .55 : 0) * sc, yaw: yw + Math.PI, sx: sc, sy: sc, sz: 1}); }
                else D.push({m: "ch_d0", x: bx, y, z: bz, yaw: yw + Math.PI, sx: sc, sy: sc, sz: 1});
                const c3 = col === "#6fe08a" ? [.4, 1, .55] : col === "#ffe27a" ? [1, .9, .4] : col === "#ffa050" ? [1, .65, .3] : [1, .4, .4]; D.push({s: "glow", x: bx, y: y + .8, z: bz, w: 3.4, h: 2.4, c: c3, a: .35}); }
        }
    }
};
