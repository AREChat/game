// ===== コスモ・クルーズ（うちゅうの たび）2026-11-27 作り直し =====
//  ① ドックの ブリーフィング：ひろい ハンガーに ならぶ ロボクルーと キャプテン・ポッドの あいさつ
//  ② カウントダウン → ハッチが ひらいて はっしん（ひかりの トンネル）
//  ③ ワープ → 行き先（10 の わくせい）× できごと（10 の ハプニング）＝ 100 パターン から ランダム
//  ④ ワープで もどって ドックに ちゃくち
//  声（キャプテン・ガイド・ロボ）は voice/cosmo_*.mp3（オリジナルの 合成音声）。キャラクター・絵・音は すべて この ゲームの オリジナル。
import {TAU, clamp, lerp, ease, root, clearRoot, el, bodyOn} from "./df-xlib.js";
import {speak, stopVoices, capShow, capHide} from "./df-voice.js";
import {COSMO_LINES} from "./df-x-cosmo-lines.js";

export const OX = 3000, OZ = 3000;
// ---- 時間割（びょう）----
const T_CD = 19.2, T_GO = 23.4, T_SP = 31, T_EV = 45, T_EVL = 18, T_BACK = 66, T_END = 78;
// ---- 行き先 10・できごと 10 ----
export const DEST = [
    {n: "ルビーせい", body: "#c8452a", alt: "#7a2418", glow: [1, .45, .2], neb: [.5, .12, .1], r: 90},
    {n: "ブルーオーシャンせい", body: "#2a6ad8", alt: "#e8f4ff", glow: [.4, .7, 1], neb: [.1, .2, .5], r: 95},
    {n: "リングせい", body: "#d8b050", alt: "#a07830", glow: [1, .85, .4], neb: [.45, .35, .1], r: 70, ring: "#ffe9a8"},
    {n: "ミントせい", body: "#3ab88a", alt: "#1a6a4a", glow: [.4, 1, .75], neb: [.1, .4, .3], r: 85},
    {n: "ピンクガスせい", body: "#ff8ac8", alt: "#c8509a", glow: [1, .55, .85], neb: [.5, .15, .4], r: 120},
    {n: "アイスせい", body: "#bfeaff", alt: "#6ab0e0", glow: [.7, .95, 1], neb: [.15, .35, .5], r: 85},
    {n: "ツインムーン", body: "#8a7ad8", alt: "#4a3a9a", glow: [.7, .6, 1], neb: [.25, .15, .5], r: 75},
    {n: "ネオンとしせい", body: "#1a1e3a", alt: "#46e6ff", glow: [.3, .9, 1], neb: [.05, .2, .4], r: 90},
    {n: "きんいろさばくせい", body: "#e8a838", alt: "#b87020", glow: [1, .75, .3], neb: [.5, .3, .05], r: 90},
    {n: "むらさきぎんが", body: "#6a3ac8", alt: "#c89aff", glow: [.8, .5, 1], neb: [.3, .1, .55], r: 60}
];
export const EVN = ["いんせきぐん", "うちゅうクジラ", "いたずらドローン", "すいせいレース", "ブラックホール", "クリスタルどうくつ", "リング サーフィン", "たいようフレア", "まいごロボ きゅうじょ", "オーロラ ワープ"];

const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const sn = Math.sin, cs = Math.cos;

// ---------- ステージ（ハンガー ＋ トンネル）と モデル ----------
export const cosmo = {
    build(K){
        const {box, cyl, sph, pln} = K.h, L = K.mk("cosmo", {tex: "tile", glowTint: [.9, .9, .9, .9], cloudA: .5}), S = L.solid, G = L.ground, GL = L.glow;
        const b = (Q, x, y, z, w, h, d, c, ry) => box(Q, OX + x, y, OZ + z, w, h, d, c, ry || 0), y_ = (Q, x, y, z, rt, rb, h, c, sg) => cyl(Q, OX + x, y, OZ + z, rt, rb, h, c, sg || 8);
        const HX = 18, Z0 = -16, Z1 = 86, H = 24, ZC = (Z0 + Z1) / 2, LEN = Z1 - Z0;
        // ゆか・かべ・てんじょう
        pln(G, OX, 0, OZ + ZC, HX * 2, LEN, "#1c2438", 12, 30); pln(G, OX, .02, OZ + ZC, 7, LEN, "#242f4a", 2, 30);
        for(const sx of [-1, 1]){ b(S, sx * (HX + .5), 0, ZC, 1, H, LEN, "#2a3450"); b(S, sx * (HX - .1), 0, ZC, .3, 1.2, LEN, "#3a4668"); }
        b(S, 0, H, ZC, HX * 2 + 2, .6, LEN + 1, "#1a2036");
        b(S, 0, 0, Z0 - .5, HX * 2 + 2, H, 1, "#2a3450");                     // うしろの かべ（ひろい もんを あける）
        b(S, -13, 0, Z0 + .2, 10, H, .4, "#2a3450"); b(S, 13, 0, Z0 + .2, 10, H, .4, "#2a3450"); b(S, 0, 15, Z0 + .2, 16, 9, .4, "#2a3450");
        // はり・はしら（トラス）：6ごとに ならぶ
        for(let z = Z0 + 3; z < Z1; z += 6){
            for(const sx of [-1, 1]){ b(S, sx * (HX - .6), 0, z, .9, H, .9, "#3a4668"); b(S, sx * (HX - 1.4), 2, z, .3, .3, 1.6, "#5a6a98"); b(S, sx * (HX - .6), 8, z, .5, .5, 3.6, "#4a5a88"); b(S, sx * (HX - .6), 15, z, .5, .5, 3.6, "#4a5a88"); }
            b(S, 0, H - 2.2, z, HX * 2 - 1, .7, .7, "#4a5a88"); b(S, 0, H - 5.5, z, HX * 2 - 6, .35, .35, "#3a4668");
            for(const sx of [-1, 1]) for(const y of [H - 6, H - 11]) b(S, sx * 8, y, z, .3, 4.2, .3, "#3a4668");
        }
        // ひかりの おび（てんじょう・かべ）：白と あおと だいだい
        for(const x of [-14, -6, 6, 14]) b(GL, x, H - .5, ZC, 1.6, .2, LEN - 6, x % 12 ? "#dfeaff" : "#a8d8ff");
        for(const sx of [-1, 1]){ for(let z = Z0 + 5; z < Z1 - 4; z += 8){ for(const [y, c] of [[3.2, "#46d8ff"], [8.5, "#ffd8a0"], [14, "#46d8ff"]]) b(GL, sx * (HX - .15), y, z, .2, .5, 5.2, ((z / 8 | 0) % 2) ? c : "#e8f4ff"); } }
        for(const x of [-2.6, 2.6]) b(GL, x, .05, ZC, .18, .05, LEN - 4, "#46e6ff");
        // おくの ハッチ（ひらく とびらは dyn）と ひかりの まく
        b(S, -11.5, 0, Z1 - .3, 13, H, 1, "#2a3450"); b(S, 11.5, 0, Z1 - .3, 13, H, 1, "#2a3450"); b(S, 0, 17, Z1 - .3, 10.5, 7, 1, "#2a3450");
        b(GL, 0, 0, Z1 + .4, 10.4, 17, .2, "#46c8ff");
        for(const sx of [-1, 1]){ b(S, sx * 5.4, 0, Z1 - .6, .8, 17.4, 1.2, "#5a6a98"); b(GL, sx * 5.0, 0, Z1 - .9, .2, 17, .2, "#ffb04a"); }
        b(GL, 0, 17.2, Z1 - .9, 10, .25, .2, "#ffb04a");
        // ステーションの ひょうじ（ハッチの うえ）
        for(let i = 0; i < 9; i++) b(GL, -4 + i, 20.5, Z1 - .9, .6, .8, .2, i % 2 ? "#ffd24a" : "#46e6ff");
        // キャプテンの だい（スポットライトの わっか）
        y_(S, 0, 0, 34, 3.6, 3.9, .9, "#3a4668", 16); y_(GL, 0, .92, 34, 3.2, 3.2, .06, "#ffe27a", 16); y_(GL, 0, 0, 34, 4.2, 4.2, .1, "#46e6ff", 18);
        // ならぶ ロボクルーの ゆかの ライン
        for(const sx of [-1, 1]) b(GL, sx * 9.5, .04, 38, .16, .04, 52, "#ffd24a");
        // 小型シャトルの ドック（かべぎわ）
        for(const sx of [-1, 1]) for(let z = 18; z <= 62; z += 22){ b(S, sx * 14.6, 0, z, 6.2, .4, 11, "#3a4668"); b(GL, sx * 14.6, .45, z, 5.6, .06, 10.4, "#ffb04a"); }
        // トンネル（ハッチの そと）：ひかりの わっかが ならぶ
        for(let z = Z1 + 6; z < Z1 + 150; z += 11){ const c = ((z / 11) | 0) % 3 === 0 ? "#ffb04a" : "#46d8ff"; for(let q = 0; q < 20; q++){ const a = q / 20 * TAU; box(GL, OX + cs(a) * 9, 9 + sn(a) * 9 - 1, OZ + z, .9, .9, .5, c, 0, 0, a + Math.PI / 2); } for(const sx of [-1, 1]) b(S, sx * 9.8, 0, z, .8, 18, .8, "#3a4668"); }
        // うしろの トンネル（もどる とき の いりぐち）
        for(let z = Z0 - 6; z > Z0 - 110; z -= 11){ for(let q = 0; q < 20; q++){ const a = q / 20 * TAU; box(GL, OX + cs(a) * 9, 9 + sn(a) * 9 - 1, OZ + z, .9, .9, .5, (((-z / 11) | 0) % 3 === 0) ? "#ffb04a" : "#46d8ff", 0, 0, a + Math.PI / 2); } }
        // ---- モデル ----
        const M = (n) => K.h.model(n).prims;
        const rob = (n, body, accent) => { const P = M(n);
            for(const sx of [-1, 1]){ cyl(P, sx * .28, 0, 0, .2, .24, .85, "#6a748a", 8); box(P, sx * .28, 0, .14, .42, .18, .56, accent); cyl(P, sx * .78, .95, 0, .15, .18, .95, body, 7); sph(P, sx * .78, .92, 0, .22, accent, 1, 6); }
            cyl(P, 0, .8, 0, .62, .52, 1.25, body, 10); box(P, 0, 1.1, .5, .46, .5, .08, "#2a3a5a"); sph(P, 0, 1.38, .54, .1, "#7affd8", 1, 5); sph(P, -.16, 1.2, .54, .06, "#ff8a6a", 1, 5);
            sph(P, 0, 2.55, 0, .62, body, .92, 10); box(P, 0, 2.38, .5, .78, .34, .18, "#10203a"); for(const sx of [-1, 1]) sph(P, sx * .2, 2.55, .58, .1, "#7affff", 1, 5);
            cyl(P, 0, 3.1, 0, .05, .05, .42, "#8a94aa", 5); sph(P, 0, 3.55, 0, .13, accent, 1, 6); };
        rob("cs_rob0", "#eef4ff", "#46a0ff"); rob("cs_rob1", "#fff0d8", "#ff9a3a"); rob("cs_rob2", "#e0fff0", "#ff6aa8");
        { const P = M("cs_cmd");   // キャプテン・ポッド：まるい かお の おおきな ロボ（ゆうかんで やさしい）
            for(const sx of [-1, 1]){ cyl(P, sx * .55, 0, 0, .38, .46, 1.5, "#3a4a78", 9); box(P, sx * .55, 0, .2, .8, .3, 1.1, "#1a2448"); }
            cyl(P, 0, 1.4, 0, 1.0, 1.35, 2.5, "#2e3c6a", 12); box(P, 0, 2.4, .95, 1.4, 1.3, .12, "#c8d8ff"); for(let i = 0; i < 5; i++) box(P, -.5 + i * .25, 2.7, 1.02, .14, .14, .06, ["#ff6a6a", "#ffd24a", "#7affd8", "#46a0ff", "#ff9aca"][i]);
            box(P, 0, 3.55, 0, 3.6, .55, 1.5, "#ffd24a"); for(const sx of [-1, 1]){ sph(P, sx * 1.85, 3.8, 0, .72, "#ffd24a", .8, 9); cyl(P, sx * 2.0, 1.4, 0, .26, .3, 2.4, "#3a4a78", 8); sph(P, sx * 2.0, 1.4, 0, .36, "#ffe9a0", 1, 8); }
            box(P, 0, 1.2, -.95, 2.6, 3.0, .18, "#8a1a3a"); box(P, 0, 1.2, -1.05, 2.2, .3, .1, "#ffd24a");
            sph(P, 0, 4.9, 0, 1.15, "#e8f0ff", .95, 14); box(P, 0, 4.55, 1.0, 1.55, .72, .2, "#10203a"); for(const sx of [-1, 1]) sph(P, sx * .38, 4.9, 1.1, .2, "#7affff", 1, 6); box(P, 0, 4.58, 1.12, .6, .1, .08, "#ffb0c0");
            cyl(P, 0, 5.9, 0, .22, 1.1, .3, "#ffd24a", 12); cyl(P, 0, 6.2, 0, 1.55, 1.55, .12, "#ffd24a", 16); cyl(P, 0, 5.6, 0, 1.3, 1.3, .5, "#ff6a8a", 14); sph(P, 0, 6.5, 0, .22, "#ffffff", 1, 6); }
        { const P = M("cs_shuttle"); box(P, 0, .6, 0, 2.4, 1.2, 5.4, "#dfe8f8"); box(P, 0, 1.0, 2.7, 1.8, .7, .2, "#46c8ff"); for(const sx of [-1, 1]){ box(P, sx * 2.2, .5, -1, 2.2, .18, 2.8, "#8aa0d8"); box(P, sx * 3.2, .5, -1.8, .2, 1.1, .9, "#ff9a3a"); } sph(P, 0, .8, -2.8, .5, "#ffb04a", 1, 6); }
        { const P = M("cs_door"); box(P, 0, 0, 0, 1, 1, 1, "#4a5a88"); }
        // 行き先の わくせい
        DEST.forEach((d, i) => { const P = M("cs_pl" + i), r = new_rng(i + 3);
            sph(P, 0, 0, 0, 1, d.body, 1, 18);
            for(let k = 0; k < 9; k++){ const a = r() * TAU, e = (r() - .5) * 2.2, rad = .98, x = cs(a) * cs(e) * rad, y = sn(e) * rad, z = sn(a) * cs(e) * rad; sph(P, x, y, z, .18 + r() * .26, k % 3 ? d.alt : d.body, .5, 6); }
            if(i === 1) for(let k = 0; k < 8; k++){ const a = r() * TAU, e = (r() - .5) * 2, x = cs(a) * cs(e) * 1.0, y = sn(e) * 1.0, z = sn(a) * cs(e) * 1.0; sph(P, x, y, z, .22, "#ffffff", .4, 6); }
            if(i === 4) for(let k = 0; k < 6; k++){ const y = -.7 + k * .28, rr = Math.sqrt(1 - y * y) * 1.01; cyl(P, 0, y - .04, 0, rr, rr, .08, k % 2 ? "#ffd0ea" : "#d8509a", 18); }
            if(i === 9){ for(let k = 0; k < 40; k++){ const a = k / 40 * TAU * 2.5, rr = .15 + k / 40 * 1.5; sph(P, cs(a) * rr, (r() - .5) * .1, sn(a) * rr, .12 + (k % 3) * .04, ["#c89aff", "#ffffff", "#8a6aff"][k % 3], 1, 5); } }
            if(d.ring) for(let k = 0; k < 28; k++){ const a = k / 28 * TAU; for(const [rr, c] of [[1.7, d.ring], [2.15, "#c8a860"]]) box(P, cs(a) * rr, sn(a * 0) * 0, sn(a) * rr, .36, .04, .5, c, -a); }
        });
        { const P = M("cs_moon"); sph(P, 0, 0, 0, 1, "#b8bcc8", 1, 10); sph(P, .4, .3, .8, .25, "#8a8e9a", .5, 5); sph(P, -.5, -.2, .8, .2, "#8a8e9a", .5, 5); }
        for(let i = 0; i < 3; i++){ const P = M("cs_rock" + i), r = new_rng(40 + i); sph(P, 0, 0, 0, 1, "#8a7a68", .85, 7); for(let k = 0; k < 3; k++) sph(P, (r() - .5) * 1.2, (r() - .5) * .9, (r() - .5) * 1.2, .5 + r() * .4, ["#9a8a76", "#6a5a4a", "#7a6a58"][k], .9, 6); }
        ["#ff7ad8", "#7affd8", "#7ab4ff", "#ffe27a"].forEach((c, i) => { const P = M("cs_cry" + i), r = new_rng(60 + i); for(let k = 0; k < 6; k++){ const a = k / 6 * TAU, rr = k ? .55 : 0; cyl(P, cs(a) * rr, 0, sn(a) * rr, 0, .3 + r() * .15, 1.6 + r() * 1.8, c, 5); } cyl(P, 0, -.1, 0, .7, .8, .3, "#6a5a8a", 7); });
        { const P = M("cs_whale"); const body = "#8ab8f0", belly = "#e8f4ff";
            [[0, 0, 3.2, 1.7], [0, 0, 1.6, 2.1], [0, 0, 0, 2.2], [0, 0, -1.8, 1.9], [0, .1, -3.4, 1.45], [0, .3, -4.8, 1.0], [0, .5, -5.8, .65]].forEach(([x, y, z, r]) => sph(P, x, y, z, r, body, .88, 11));
            [[0, -.85, 2.6, 1.3], [0, -.95, .6, 1.6], [0, -.9, -1.4, 1.5], [0, -.7, -3.2, 1.1]].forEach(([x, y, z, r]) => sph(P, x, y, z, r, belly, .6, 9));
            for(const sx of [-1, 1]){ box(P, sx * 2.7, -.7, 1.2, 2.2, .18, 1.1, "#6a98d8"); box(P, sx * 2.1, .85, -6.2, 2.1, .2, 1.2, "#6a98d8"); sph(P, sx * 1.35, .55, 3.6, .26, "#10203a", 1, 6); sph(P, sx * 1.4, .6, 3.72, .08, "#ffffff", 1, 5); sph(P, sx * 1.1, -.2, 4.4, .24, "#ffb0c0", .5, 6); }
            box(P, 0, -.25, 4.6, 1.0, .1, .4, "#10203a"); for(let k = 0; k < 7; k++) sph(P, (k % 2 ? -1 : 1) * (.4 + k * .1), 1.45 - k * .05, 2.4 - k * 1.1, .2, "#cfe8ff", .5, 5); }
        { const P = M("cs_drone"); sph(P, 0, 0, 0, .75, "#f0f6ff", .8, 10); cyl(P, 0, -.05, 0, 1.25, 1.25, .12, "#46a0ff", 14); sph(P, 0, .05, .62, .3, "#10203a", 1, 7); sph(P, 0, .07, .86, .1, "#7affff", 1, 5); for(let k = 0; k < 4; k++){ const a = k / 4 * TAU + .8; sph(P, cs(a) * 1.15, .2, sn(a) * 1.15, .16, ["#ff6a6a", "#ffd24a", "#7affd8", "#ff9aca"][k], 1, 5); } cyl(P, 0, .6, 0, .05, .05, .6, "#8a94aa", 5); sph(P, 0, 1.25, 0, .14, "#ffd24a", 1, 5); }
        { const P = M("cs_comet"); sph(P, 0, 0, 0, 1.2, "#cfe8ff", .95, 10); sph(P, .5, .3, .9, .4, "#9ac8f0", .6, 6); sph(P, -.6, -.3, .7, .3, "#9ac8f0", .6, 6); }
        { const P = M("cs_gate"); for(let k = 0; k < 18; k++){ const a = k / 18 * TAU; box(P, cs(a), sn(a), 0, .42, .14, .3, ["#ffd24a", "#ff6ad8", "#46e6ff"][k % 3], 0, 0, a); } }
        { const P = M("cs_hole"); sph(P, 0, 0, 0, 1, "#040410", 1, 14); for(let k = 0; k < 40; k++){ const a = k / 40 * TAU, rr = 1.6 + (k % 5) * .16; box(P, cs(a) * rr, 0, sn(a) * rr, .5, .04, .34, ["#ff8a2a", "#ff4a8a", "#ffd24a", "#9a4aff", "#ff6a3a"][k % 5], -a); } }
        { const P = M("cs_sun"); sph(P, 0, 0, 0, 1, "#ffb830", 1, 14); sph(P, 0, 0, 0, 1.06, "#ff8a1a", 1, 12); }
    },
    init(g, R, a){
        const seen = (g.sv.cosmoSeen && g.sv.cosmoSeen.length === 100) ? g.sv.cosmoSeen : "0".repeat(100); R.seen0 = seen;
        let id = (g._cosmoPat !== undefined) ? g._cosmoPat : Math.floor(Math.random() * 100);
        if(g._cosmoPat === undefined && id === g.sv.cosmoLast) id = (id + 1 + Math.floor(Math.random() * 98)) % 100;   // おなじ パターンが つづかない
        R.pat = id; R.dest = id % 10; R.ev = (id / 10) | 0; g.sv.cosmoLast = id; g.sv.cosmoSeen = seen.slice(0, id) + "1" + seen.slice(id + 1);
        R.fresh = seen[id] !== "1"; R.rnd = rng(id * 977 + 13); R.flags = {}; R.cm = {roll: 0, yaw: 0, pitch: 0, fov: 0, shake: 0}; R.t = 0; R.voices = []; R.cap = null;
        R.rock = []; R.fl = 0;
        bodyOn("cosmo", true); const r = root(); clearRoot();
        R.h = {top: el("div", "xh", "", "left:10px;top:8px;font-size:clamp(12px,2.6vw,17px)"), hint: el("div", "xh", "", "left:10px;bottom:9%;font-size:clamp(11px,2.4vw,14px)"), count: el("div", "xbig", "", "top:18%;font-size:clamp(60px,16vw,140px);color:#ffe27a")};
        for(const k of ["top", "hint", "count"]) r.appendChild(R.h[k]);
        const f = document.createElement("div"); f.style.cssText = "position:absolute;left:0;top:0;right:0;bottom:0;background:#e8f4ff;opacity:0;pointer-events:none;z-index:3"; r.appendChild(f); R.h.flash = f;
        const bm = document.createElement("div"); bm.style.cssText = "position:absolute;left:50%;top:36%;transform:translate(-50%,-50%) scale(.5);opacity:0;pointer-events:none;z-index:4;font-weight:900;font-size:clamp(30px,9vw,80px);color:#fff;white-space:nowrap;text-shadow:0 0 18px #46c8ff,0 5px 0 #2a5ad8,0 0 40px #ffd23a;letter-spacing:.04em"; r.appendChild(bm); R.h.boom = bm;
        R.A.env = "cosbay"; R.A.music = "cosmo";
        g.ui.toast("🪐 コスモ・クルーズ  きょうの たびは 100パターンの うち 「" + (id + 1) + "ばん」！" + (R.fresh ? "（はじめて！）" : ""), 4200);
    },
    update(g, R, dt, inp){
        const t = R.t, F = R.flags, once = (k, at, fn) => { if(!F[k] && t >= at){ F[k] = 1; fn(); } };
        const say = (id, at) => once("v" + id, at, () => { const L = COSMO_LINES[id]; if(L) speak(g, R, "cosmo_" + id, L[0], L[1], L[2]); });
        say("b1", .8); say("b2", 6.6); say("b3", 11.7); say("b4", 15.8); say("cd", T_CD);
        once("cd3", T_CD + .3, () => { g.sfx("clue"); R.h.count.textContent = "3"; }); once("cd2", T_CD + 1.3, () => { g.sfx("clue"); R.h.count.textContent = "2"; }); once("cd1", T_CD + 2.3, () => { g.sfx("clue"); R.h.count.textContent = "1"; });
        once("cd0", T_GO - .3, () => { R.h.count.textContent = "ゴー！"; g.sfx("start"); g.sfx("rumble"); }); once("cdx", T_GO + 1.5, () => { R.h.count.textContent = ""; });
        once("hatch", T_CD + 1.8, () => { g.sfx("door"); boom(R, "ハッチ かいほう！", .8); });
        once("launch", T_GO, () => { g.sfx("warp"); flash(R, .5); });
        once("warp", T_SP - .4, () => { g.sfx("warp"); g.sfx("whoosh"); flash(R, .95); boom(R, "ワープ！", 1.0); });
        say("d" + R.dest, T_SP + 3);
        say("e" + R.ev + "a", T_EV + .6); say("e" + R.ev + "b", T_EV + 9.5);
        once("evstart", T_EV, () => { g.sfx("sparkle"); g.ui.toast("✨ " + EVN[R.ev] + "！", 2400); });
        once("back", T_BACK, () => { g.sfx("warp"); flash(R, 1); boom(R, "ワープで もどるよ！", 1.0); });
        say("l1", T_BACK + 3.2); say("l2", T_BACK + 6.6);
        once("land", T_END - 3.2, () => { g.sfx("door"); g.sfx("cheer"); });
        for(let q = 0; q < 6; q++) once("eng" + q, T_GO + 1 + q * 1.1, () => g.sfx("rumble"));
        // できごと ごとの おと
        const te = t - T_EV;
        if(te >= 0 && te < T_EVL) evFx(g, R, te, once);
        // フラッシュ・おわり
        const S = ship(R, t); R.S = S; R.A.env = S.bay ? "cosbay" : "cosspace";
        if(t >= T_END && !R.fin){ R.fin = 1; R.win = true; let bonus = R.fresh ? 5 : 0; if(!g.sv.cosmoAll && g.sv.cosmoSeen.indexOf("0") < 0){ g.sv.cosmoAll = 1; bonus += 100; g.ui.toast("🏆 100パターン ぜんぶ コンプリート！ +100コイン", 5200); g.sfx("gold"); } g.sv.coins += bonus; if(bonus && bonus < 100) g.ui.toast("🆕 はじめての パターン！ +" + bonus + "コイン  （みつけた " + (g.sv.cosmoSeen.split("1").length - 1) + "/100）", 4200); }
        if(R.fin && t > T_END + 1.5){ g.endRide(true, true); return; }
        // ひょうじ
        const seen = (g.sv.cosmoSeen.split("1").length - 1);
        R.h.top.innerHTML = "<span class='xpill'>🪐 コスモ・クルーズ　パターン " + (R.pat + 1) + "/100　みつけた " + seen + "/100" + (t > T_SP ? "　" + DEST[R.dest].n + " ／ " + EVN[R.ev] : "") + "</span>";
        R.h.hint.innerHTML = "<span class='xpill'>ドラッグ：みまわす　Esc：おりる</span>";
        capShow(R, g);
    },
    camera(g, R){
        const S = R.S || ship(R, R.t), t = R.t, cm = R.cm, sh = (cm.shake || 0) + (t > T_GO - 4 && t < T_GO + 6 ? .012 : .003);
        const eye = [OX + S.x + (Math.random() - .5) * sh * 2.2, S.y + 2.1 + (Math.random() - .5) * sh * 1.4, OZ + S.z];
        let yaw = S.yaw + cm.yaw + g.lookYaw, pitch = S.pitch + cm.pitch + g.lookPitch;
        if(t < T_CD){ yaw += .22 * sn(t * .45) * Math.min(1, t / 2); pitch += .03; }
        return {eye, yaw, pitch, roll: S.roll + cm.roll + (Math.random() - .5) * sh * .4, fov: 66 + S.fov + cm.fov};
    },
    dyn(g, R, D){ dynAll(g, R, D); },
    hud(R){ return R.t < T_SP ? "ドックで ブリーフィング" : "コスモ・クルーズ  パターン " + (R.pat + 1) + "/100"; },
    end(g, R){ stopVoices(R); capHide(); clearRoot(); bodyOn("cosmo", false); }
};
const new_rng = rng;
// ---------- フラッシュ・ドーン文字 ----------
function flash(R, a){ const f = R.h && R.h.flash; if(!f) return; f.style.transition = "none"; f.style.opacity = String(a); setTimeout(() => { f.style.transition = "opacity .9s ease-out"; f.style.opacity = "0"; }, 60); }
function boom(R, text, secs){ const b = R.h && R.h.boom; if(!b) return; b.textContent = text; b.style.transition = "none"; b.style.opacity = "1"; b.style.transform = "translate(-50%,-50%) scale(.4)";
    setTimeout(() => { b.style.transition = "transform .3s cubic-bezier(.2,1.6,.4,1)"; b.style.transform = "translate(-50%,-50%) scale(1.1)"; }, 40); setTimeout(() => { b.style.transition = "opacity .5s"; b.style.opacity = "0"; }, (secs || 1) * 1000); }

// ---------- のりものの いち・むき ----------
function ship(R, t){
    let z = 0, x = 0, y = 0, yaw = 0, pitch = 0, roll = 0, fov = 0, bay = true, v = 0;
    if(t < T_GO){ z = 0; }
    else if(t < T_SP){ const u = t - T_GO, a = 5.0; z = .5 * a * u * u; v = a * u; fov = clamp(u * 2.2, 0, 14); }
    else if(t < T_BACK){ const u = t - T_SP, v0 = 5.0 * (T_SP - T_GO); z = .5 * 5.0 * (T_SP - T_GO) ** 2 + v0 * u + 1.2 * u * u; v = v0 + 2.4 * u; fov = 14; }
    else {
        const u = clamp((t - T_BACK - .6) / 7.6, 0, 1); z = lerp(-95, 0, 1 - Math.pow(1 - u, 2.4)); v = (1 - u) * 40; fov = 8 * (1 - u);
    }
    const inHall = z > -15 && z < 83, space = t >= T_SP - .3 && t < T_BACK;
    bay = !space && inHall;
    if(space){ const u = t - T_SP; x = 1.4 * sn(u * .5) + (R.cm.px || 0); y = .8 * sn(u * .43 + 1) + (R.cm.py || 0); roll = .05 * sn(u * .5 + .6); }
    return {x, y, z, yaw, pitch, roll, fov, bay, v};
}

// ---------- できごとの 音・ぱっと ひかる ----------
function evFx(g, R, te, once){
    const e = R.ev;
    if(e === 0) for(let i = 0; i < 16; i++) { const ri = rockRel(R, i, te); if(Math.abs(ri.rz) < 7 && Math.abs(ri.lx) < 7 && !R.flags["rk" + i]){ R.flags["rk" + i] = 1; g.sfx("whoosh"); R.cm.shake = .05; R.cm.roll += (ri.lx > 0 ? -1 : 1) * .12; setTimeout(() => { R.cm.shake = 0; }, 260); } }
    if(e === 3) once("c1", 3, () => g.sfx("whoosh")), once("c2", 7, () => g.sfx("warp"));
    if(e === 4){ once("bh1", 2, () => g.sfx("rumble")); once("bh2", 8, () => { g.sfx("warp"); flash(R, .5); }); }
    if(e === 5) for(let k = 0; k < 6; k++) once("cr" + k, 2 + k * 2.4, () => g.sfx("sparkle"));
    if(e === 6) for(let k = 0; k < 8; k++) once("rs" + k, 1 + k * 2, () => g.sfx("whoosh"));
    if(e === 7){ once("f1", 5, () => { flash(R, .85); g.sfx("alarm"); R.cm.shake = .04; }); once("f2", 9, () => { flash(R, .9); g.sfx("crash"); boom(R, "フレア！", .8); R.cm.shake = .06; }); once("f3", 12, () => { R.cm.shake = 0; g.sfx("sparkle"); }); }
    if(e === 8){ once("r1", 7, () => g.sfx("sparkle")); once("r2", 11.5, () => { g.sfx("cheer"); flash(R, .5); boom(R, "きゅうじょ せいこう！", 1.1); }); }
    if(e === 9) for(let k = 0; k < 6; k++) once("au" + k, 1.5 + k * 2.6, () => { g.sfx("warp"); });
    if(e === 1) once("wh", 3, () => { g.sfx("sparkle"); });
    if(e === 2) for(let k = 0; k < 5; k++) once("dr" + k, 2 + k * 2.8, () => g.sfx("pop"));
}
function rockRel(R, i, te){ const r = rng(R.pat * 31 + i * 7 + 5); const lx = (r() - .5) * 26, ly = (r() - .5) * 14, rz = (((i * 27 - te * 105) % 440) + 440) % 440 - 40; return {lx, ly, rz, sc: 1.6 + r() * 3.2, m: i % 3}; }

// ---------- うごく もの（ロボ・ハッチ・わくせい・できごと・ほし）----------
function dynAll(g, R, D){
    const t = R.t, T = g.t, S = R.S || ship(R, t), wz = OZ + S.z, wx = OX + S.x, wy = S.y;
    if(S.bay){
        // ロボクルー：ならんで ばんざい／はねる
        const open = ease(clamp((t - (T_CD + 1.8)) / 3.2, 0, 1));
        for(let k = 0; k < 2; k++) for(let i = 0; i < 9; i++){ const z = 8 + i * 6.4, sx = k ? 1 : -1, hop = t < T_CD ? Math.max(0, sn(t * 3 + i * .9)) * .12 * (t > 8 ? 2 : 1) : Math.abs(sn(t * 5 + i)) * .35;
            D.push({m: "cs_rob" + ((i + k) % 3), x: OX + sx * 9.5, y: hop, z: OZ + z, yaw: -sx * Math.PI / 2 + (t > 10 ? sn(t * 1.3 + i) * .15 : 0), sx: 1.25, sy: 1.25, sz: 1.25}); D.push({s: "glow", x: OX + sx * 9.5, y: 2.9, z: OZ + z, w: .9, h: .5, c: [.4, 1, .8], a: .35}); }
        // キャプテン
        const wave = t > .8 ? sn(t * 2.2) * .12 : 0; D.push({m: "cs_cmd", x: OX, y: .9, z: OZ + 34, yaw: Math.PI + wave * .5, sx: 1.2, sy: 1.2 + wave * .05, sz: 1.2});
        D.push({s: "glow", x: OX, y: 8.5, z: OZ + 34, w: 12, h: 12, c: [1, .9, .6], a: .1});
        for(const sx of [-1, 1]) for(let z = 18; z <= 62; z += 22) D.push({m: "cs_shuttle", x: OX + sx * 14.6, y: .5, z: OZ + z, yaw: -sx * Math.PI / 2 + Math.PI / 2 * 0 + (sx > 0 ? Math.PI : 0) * 0, sx: 1.1, sy: 1.1, sz: 1.1});
        // ハッチ
        const hz = OZ + 85.5; for(const sx of [-1, 1]) D.push({m: "cs_door", x: OX + sx * (2.6 + open * 3.2), y: 0, z: hz, yaw: 0, sx: 5.2, sy: 17, sz: 1.1});
        if(open > .02) D.push({s: "glow", x: OX, y: 8.5, z: hz + 1, w: 18, h: 18, c: [.3, .8, 1], a: .3 * open});
        // ブリーフィングの ひかり
        const pulse = .5 + .5 * sn(t * 4); D.push({s: "glow", x: OX, y: 1.2, z: OZ + 34, w: 9, h: 3, c: [1, .85, .4], a: .22 + .1 * pulse});
    }
    // ひかりの トンネル・ワープ
    if(t >= T_GO - .2 && t < T_SP){ const sp = clamp(S.v / 90, 0, 1);
        for(let i = 0; i < 14; i++) D.push({s: "glow", x: wx + (i % 2 ? 1 : -1) * 7, y: 1 + i % 5, z: wz + 20 + ((i * 9 - T * 60) % 130 + 130) % 130, w: .5, h: 7 * sp + .4, c: [.5, .85, 1], a: .35 * sp}); }
    if(t >= T_SP - .3 && t < T_BACK) spaceScene(g, R, D, S, t, T);
    if(t >= T_BACK - .3 && t < T_BACK + 1){ for(let i = 0; i < 20; i++){ const a = i / 20 * TAU; D.push({s: "glow", x: wx + cs(a) * 5, y: 2 + sn(a) * 5, z: wz + 20 + (T * 80 + i * 11) % 60, w: .8, h: 6, c: [1, 1, 1], a: .5}); } }
}

function spaceScene(g, R, D, S, t, T){
    const d = DEST[R.dest], u = t - T_SP, zs = OZ + S.z, xs = OX + S.x, ys = S.y + 2, sp = clamp(S.v / 110, 0, 1), te = t - T_EV, r = rng(R.pat * 131 + 7);
    // ほし：ちかくの ほし（こちらへ ながれてくる）と、とおくの ほし（ぜんぶ いっしょに 見える ほしぞら）
    const rot = R.ev === 4 && te > 0 ? clamp(te / 10, 0, 1) * .5 * te * .25 : 0, wp = sp > .4;
    for(let i = 0; i < 190; i++){ const hx = (i * 73 % 197) - 98, hy = (i * 41 % 131) - 65, off = (i * 29 % 360), rel = (((off - S.z * 1) % 360) + 360) % 360, a0 = rot, x = hx * cs(a0) - hy * sn(a0), y = hx * sn(a0) + hy * cs(a0);
        const tw = .6 + .4 * sn(T * 2 + i), st = i % 7 === 0 ? [1, .85, .6] : i % 5 === 0 ? [.7, .85, 1] : [1, 1, 1], sz = .55 + (i % 3) * .25;
        D.push({s: "glow", x: xs + x, y: ys + y, z: zs + 30 + rel, w: sz * 1.5, h: sz * 1.5, c: st, a: .95 * tw});
        if(wp) for(let q = 1; q <= 2; q++) D.push({s: "glow", x: xs + x, y: ys + y, z: zs + 30 + rel + q * 4 * sp, w: sz * .7, h: sz * .7, c: st, a: .55 - q * .14}); }
    for(let i = 0; i < 240; i++){ const rr = rng(i * 7 + 3), th = rr() * TAU, ph = Math.acos(1 - 2 * rr()), tw = .55 + .45 * sn(T * 1.3 + i), sz = 4 + rr() * 5, k = rr();
        D.push({s: "glow", x: xs + 800 * sn(ph) * cs(th), y: ys + 800 * cs(ph), z: zs + 800 * sn(ph) * sn(th), w: sz, h: sz, c: k > .85 ? [1, .8, .6] : k > .6 ? [.7, .85, 1] : [1, 1, 1], a: .95 * tw}); }
    // 星ぐも（行き先の いろ）
    for(let i = 0; i < 9; i++) D.push({s: "glow", x: xs + (i - 4) * 150, y: ys + (i % 3 - 1) * 70, z: zs + 900, w: 640, h: 440, c: d.neb.map((q) => q * 1.3 + .06), a: .38});
    // わくせい
    const dist = lerp(820, -170, ease(clamp(u / 13, 0, 1))), side = R.dest % 2 ? 1 : -1, dx = side * (d.r * 1.35 * (R.dest === 9 ? 1.4 : 1) * 1.1 + 40 + 24 * (R.dest % 3)), dy = 6 * (R.dest % 4) - 10, pl = {x: xs + dx, y: ys + dy, z: zs + dist};
    if(dist > -160){
        const rr = d.r * 1.35 * (R.dest === 9 ? 1.4 : 1);
        D.push({m: "cs_pl" + R.dest, x: pl.x, y: pl.y, z: pl.z, yaw: T * .03, rx: .3, sx: rr, sy: rr, sz: rr});
        D.push({s: "glow", x: pl.x, y: pl.y, z: pl.z - rr * .9, w: rr * 3.4, h: rr * 3.4, c: d.glow, a: .22});
        if(R.dest === 6){ for(let k = 0; k < 2; k++){ const a = T * (.5 + k * .3) + k * 3; D.push({m: "cs_moon", x: pl.x + cs(a) * rr * 1.9, y: pl.y + sn(a * 1.3) * rr * .3, z: pl.z + sn(a) * rr * 1.9, sx: rr * .28, sy: rr * .28, sz: rr * .28}); } }
        if(R.dest === 1){ const a = T * .2; D.push({m: "cs_moon", x: pl.x + cs(a) * rr * 2.1, y: pl.y + rr * .2, z: pl.z + sn(a) * rr * 2.1, sx: rr * .18, sy: rr * .18, sz: rr * .18}); }
        if(R.dest === 7) for(let k = 0; k < 40; k++){ const a = k * 2.4, e = ((k * 37) % 100 / 100 - .5) * 2, x = cs(a) * cs(e), y = sn(e), z = sn(a) * cs(e); if(z < .1) D.push({s: "glow", x: pl.x + x * rr, y: pl.y + y * rr, z: pl.z + z * rr - 1, w: 3.2, h: 3.2, c: k % 3 ? [.3, .9, 1] : [1, .5, .9], a: .9}); }
        if(R.dest === 0) for(let k = 0; k < 6; k++){ const a = k * 1.9 + T * .1; D.push({s: "glow", x: pl.x + cs(a) * rr * .8, y: pl.y + sn(a * 1.7) * rr * .7, z: pl.z - rr * .98, w: 10 + 3 * sn(T * 3 + k), h: 10, c: [1, .5, .2], a: .5}); }
        if(R.dest === 9) for(let k = 0; k < 120; k++){ const a = k / 120 * TAU * 3 + T * .08, rd = (k / 120) * rr * 1.6; D.push({s: "glow", x: pl.x + cs(a) * rd, y: pl.y + sn(a * .5) * 2, z: pl.z + sn(a) * rd * .45 - rr, w: 3 + (k % 4), h: 3 + (k % 4), c: k % 3 ? [.8, .55, 1] : [1, 1, 1], a: .6}); }
    }
    // 行き先ごとの そばの ようす（とおりすぎる ときの かけら）
    if(u > 8 && u < 36){
        for(let k = 0; k < 10; k++){ const rr = rng(R.dest * 17 + k * 5), z = zs + 20 + (((k * 38 - u * 55) % 380) + 380) % 380 - 10, lx = (rr() - .5) * 90 + (R.dest % 2 ? 40 : -40), ly = (rr() - .5) * 40;
            const mm = R.dest === 3 ? "cs_cry" + (k % 4) : R.dest === 5 ? "cs_cry" + 2 : (R.dest === 2 || R.dest === 8) ? "cs_rock" + (k % 3) : R.dest === 4 ? null : "cs_rock" + (k % 3), sc = R.dest === 3 || R.dest === 5 ? 3.2 : 2.2;
            if(mm) D.push({m: mm, x: xs + lx, y: ys + ly, z, yaw: T * .3 + k, rx: T * .4 + k, sx: sc, sy: sc, sz: sc}); else D.push({s: "glow", x: xs + lx, y: ys + ly, z, w: 18, h: 18, c: [1, .5, .85], a: .25}); } }
    // できごと
    if(te > -3 && te < T_EVL + 2) eventScene(g, R, D, S, te, T, xs, ys, zs, r);
}

function eventScene(g, R, D, S, te, T, xs, ys, zs, r){
    const e = R.ev, cm = R.cm, ev = ease(clamp(te / 2, 0, 1)) * (1 - ease(clamp((te - 16) / 2, 0, 1)));
    cm.roll = cm.roll * .9; cm.yaw *= .9; cm.pitch *= .9; cm.fov *= .9; cm.px = 0; cm.py = 0;
    if(e === 0){ for(let i = 0; i < 16; i++){ const q = rockRel(R, i, te); if(te < 0 || q.rz < -30) continue; D.push({m: "cs_rock" + q.m, x: xs + q.lx, y: ys + q.ly, z: zs + q.rz, yaw: T * .5 + i, rx: T * .7 + i, sx: q.sc, sy: q.sc, sz: q.sc}); } cm.yaw += .02 * sn(te * 1.7); }
    else if(e === 1){ const rz = lerp(170, -70, ease(clamp(te / 15, 0, 1))), wag = sn(T * 1.4), wy = 3 + sn(T * .7) * 1.2;
        D.push({m: "cs_whale", x: xs + 13, y: ys + wy, z: zs + rz, yaw: -.12 + wag * .06, rx: wag * .04, sx: 3.4, sy: 3.4, sz: 3.4}); D.push({s: "glow", x: xs + 13, y: ys + wy, z: zs + rz + 8, w: 24, h: 20, c: [.5, .8, 1], a: .12});
        for(let k = 0; k < 3; k++) D.push({m: "cs_whale", x: xs - 22 - k * 10, y: ys - 4 + k * 3 + sn(T + k) * 1.4, z: zs + rz + 30 + k * 18, yaw: .1 + sn(T * 1.6 + k) * .08, sx: .9, sy: .9, sz: .9});
        for(let k = 0; k < 12; k++) D.push({s: "glow", x: xs + 16 + (r() - .5) * 20, y: ys + wy + 3 + ((T * 2 + k) % 6), z: zs + rz + 6 - k * 1.5, w: .9, h: .9, c: [.8, .95, 1], a: .5}); }
    else if(e === 2){ for(let k = 0; k < 14; k++){ const a = T * (.8 + k * .05) + k * 1.1, rad = 10 + (k % 4) * 3, rel = 14 + 30 * ((T * .35 + k * .17) % 1), dx = cs(a) * rad, dy = sn(a * 1.3) * rad * .55;
            D.push({m: "cs_drone", x: xs + dx, y: ys + dy, z: zs + rel, yaw: a + Math.PI, sx: 1.5, sy: 1.5, sz: 1.5}); D.push({s: "glow", x: xs + dx, y: ys + dy, z: zs + rel + 1, w: 2.2, h: 2.2, c: k % 2 ? [1, .8, .3] : [.4, 1, 1], a: .6}); if(k % 3 === 0) for(let q = 0; q < 4; q++) D.push({s: "star", x: xs + dx * (1 - q * .2), y: ys + dy * (1 - q * .2), z: zs + rel - q * 2, w: .6, h: .6, c: [1, .9, .4], a: .8 - q * .2}); } }
    else if(e === 3){ for(const [sx, sy, k, col] of [[11, 3, 0, [.6, .9, 1]], [-13, -4, 1, [1, .7, .9]]]){ const rel = 26 + 12 * sn(T * .8 + k * 2) + (te > 8 ? (te - 8) * 4 * (k ? -1 : 1) : 0);
            D.push({m: "cs_comet", x: xs + sx, y: ys + sy + sn(T * 1.3 + k) * .8, z: zs + rel, yaw: T, sx: 2, sy: 2, sz: 2}); for(let q = 0; q < 22; q++) D.push({s: "glow", x: xs + sx + (r() - .5) * q * .12, y: ys + sy + (r() - .5) * q * .12, z: zs + rel - 2 - q * 2.3, w: 4.2 - q * .15, h: 4.2 - q * .15, c: col, a: .7 - q * .03}); D.push({s: "glow", x: xs + sx, y: ys + sy, z: zs + rel, w: 10, h: 10, c: col, a: .35}); }
        cm.roll += .04 * sn(te * 1.3); }
    else if(e === 4){ const rz = lerp(240, 62, ease(clamp(te / 11, 0, 1))), sc = 22, bx = xs + 2, by = ys + 1; D.push({m: "cs_hole", x: bx, y: by, z: zs + rz, yaw: T * .6, rx: .5, sx: sc, sy: sc, sz: sc});
        D.push({s: "glow", x: bx, y: by, z: zs + rz - 2, w: sc * 4.5, h: sc * 4.5, c: [1, .5, .2], a: .2}); for(let k = 0; k < 60; k++){ const a = k / 60 * TAU + T * 1.2, rd = sc * (1.8 + (k % 6) * .4); D.push({s: "glow", x: bx + cs(a) * rd, y: by + sn(a) * rd * .3, z: zs + rz + sn(a) * rd * .9, w: 1.8, h: 1.8, c: k % 2 ? [1, .6, .2] : [1, .3, .7], a: .7}); }
        cm.roll += ev * .25 * sn(te * .5); cm.pitch += ev * .04; cm.fov += ev * 8; cm.px = 0; }
    else if(e === 5){ const z0 = R.cz0 === undefined ? (R.cz0 = zs) : R.cz0; for(let k = 0; k < 60; k++){ const kz = z0 + 45 + k * 11, a = k * .9, rad = 8 + (k % 3) * 2.6, mm = "cs_cry" + (k % 4); if(kz < zs - 20 || kz > zs + 380) continue;
            D.push({m: mm, x: xs + cs(a) * rad, y: ys + sn(a) * rad * .8, z: kz, rx: a + Math.PI / 2, yaw: 0, sx: 5, sy: 5, sz: 5}); D.push({s: "glow", x: xs + cs(a) * rad * .8, y: ys + sn(a) * rad * .64, z: kz, w: 14, h: 14, c: [[1, .5, .85], [.5, 1, .85], [.5, .7, 1], [1, .9, .5]][k % 4], a: .3}); } cm.roll += .02 * sn(te * 1.1); }
    else if(e === 6){ for(let k = 0; k < 9; k++){ const rz = 40 + (((k * 42 - te * 90) % 380) + 380) % 380 - 20, wob = sn(T * 1.2 + k) * 2.2; D.push({m: "cs_gate", x: xs + wob, y: ys + 1 + sn(T + k) * 1.2, z: zs + rz, yaw: 0, sx: 10, sy: 10, sz: 10}); D.push({s: "glow", x: xs + wob, y: ys + 1, z: zs + rz, w: 26, h: 26, c: [[1, .85, .3], [1, .4, .85], [.3, .9, 1]][k % 3], a: .12}); }
        for(let k = 0; k < 40; k++) D.push({s: "glow", x: xs + (r() - .5) * 16, y: ys - 3 + (r() - .5) * 4, z: zs + 10 + ((T * 70 + k * 9) % 120), w: .6, h: 3, c: [.5, .9, 1], a: .45}); cm.roll += .1 * sn(te * 1.6); cm.yaw += .05 * sn(te * .8); }
    else if(e === 7){ const sc = 90, sx0 = xs - 150, sy0 = ys + 40, sz0 = zs + 520 - clamp(te * 18, 0, 200); D.push({m: "cs_sun", x: sx0, y: sy0, z: sz0, sx: sc, sy: sc, sz: sc}); D.push({s: "glow", x: sx0, y: sy0, z: sz0 - 30, w: sc * 5, h: sc * 5, c: [1, .7, .2], a: .35});
        for(let k = 0; k < 40; k++){ const ph = ((te * .35 + k * .07) % 1), a = k * .8; D.push({s: "glow", x: sx0 + cs(a) * sc * (1 + ph * 1.2), y: sy0 + sn(a) * sc * (1 + ph * 1.2), z: sz0 - 20, w: 14 * (1 - ph) + 3, h: 14 * (1 - ph) + 3, c: [1, .55 + ph * .3, .2], a: .6 * (1 - ph)}); }
        cm.fov += ev * 5 * (1 + sn(te * 5)); }
    else if(e === 8){ const rz = lerp(130, 2.6, ease(clamp((te - 1) / 10.5, 0, 1))), caught = te > 11.5, tum = T * 2.2; const bx = xs + (caught ? 0 : sn(te * .8) * 5 * (1 - ease(clamp((te - 6) / 5, 0, 1)))), by = ys + (caught ? -.3 : 2 * sn(te) * (1 - ease(clamp((te - 6) / 5, 0, 1))));
        D.push({m: "cs_rob1", x: bx, y: by - 1.5, z: zs + rz, yaw: caught ? Math.PI : tum, rx: caught ? 0 : sn(T * 1.3) * .5, sx: 1.5, sy: 1.5, sz: 1.5}); D.push({s: "glow", x: bx, y: by, z: zs + rz, w: 6, h: 6, c: [1, .6, .3], a: .3 + .2 * sn(T * 8)});
        if(te > 6 && !caught) for(let k = 0; k < 14; k++){ const q = k / 14; D.push({s: "glow", x: lerp(xs, bx, q), y: lerp(ys - .4, by, q), z: lerp(zs + 3, zs + rz, q), w: .9, h: .9, c: [.4, 1, .9], a: .7 - q * .4}); }
        if(caught) for(let k = 0; k < 14; k++){ const a = k / 14 * TAU + T * 3; D.push({s: "star", x: bx + cs(a) * 1.4, y: by + .8 + sn(a) * 1.4, z: zs + rz, w: .6, h: .6, c: [1, .9, .4], a: .9}); } }
    else { for(let k = 0; k < 9; k++){ const rz = 30 + (((k * 46 - te * 80) % 414) + 414) % 414 - 20; const col = [[.4, 1, .6], [.5, .8, 1], [.9, .5, 1]][k % 3];
            for(let q = 0; q < 30; q++){ const a = q / 30 * TAU, rad = 15 + sn(T + k) * 1.4; D.push({s: "glow", x: xs + cs(a) * rad, y: ys + sn(a) * rad * .8, z: zs + rz + sn(a * 3 + T) * 2, w: 2.4, h: 2.4, c: col, a: .55}); }
            D.push({s: "glow", x: xs, y: ys, z: zs + rz, w: 44, h: 44, c: col, a: .1}); } cm.roll += .03 * sn(te); }
}
