// ===== コスモクルーズ・ミッション「ほしのたまご」の 舞台と モデル（2026-11-27）=====
//  ぜんぶ この ゲームの オリジナル。 7つの 場面を、はなれた 場所に ならべて つくる（カメラが ワープ するように つなぐ）。
//  A ブリーフィング・ルーム／B スターライト・ハンガー／D アイアン・ハンガー／E ろうか／F たて穴（リアクター）／G だっしゅつ トンネル
//  宇宙の 場面（C・G の そと）は ほぼ すべて dyn の ひかりと モデルで 出す。
import {TAU} from "./df-xlib.js";
const sn = Math.sin, cs = Math.cos;
export const O = {A: [4000, 3000], B: [4000, 3500], D: [4000, 5000], E: [4000, 5600], F: [4000, 6300], G: [4000, 6900]};
export const COLS = {egg: [[1, .55, .85], [.45, .85, 1], [1, .85, .35]]};
// ろうか（E）の みち：[x, z] の つながり（まがりかど つき）
export const CORR = [[0, 0], [0, 48], [30, 48], [30, 104], [4, 104], [4, 156]];
export const CW = 3.6;   // ろうかの はば（かたがわ）

const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

export function buildCosmo2(K){
    const {box, cyl, sph, pln} = K.h, L = K.mk("cosmo2", {tex: "tile", glowTint: [.9, .9, .9, .9], cloudA: .5}), S = L.solid, G = L.ground, GL = L.glow;
    const M = (n, blend) => { const m = K.h.model(n); if(blend){ m.blend = true; m.tint = [1, 1, 1, .9]; } return m.prims; };
    // ---------- 大きな ハンガー（B：あおしろ／D：くろと あか）----------
    const hall = (o, W, Z0, Z1, H, pal) => {
        const [ox, oz] = o, b = (Q, x, y, z, w, h, d, c, ry) => box(Q, ox + x, y, oz + z, w, h, d, c, ry || 0), zc = (Z0 + Z1) / 2, LEN = Z1 - Z0;
        pln(G, ox, 0, oz + zc, W * 2, LEN, pal.floor, 12, 30); pln(G, ox, .02, oz + zc, 8, LEN, pal.lane, 2, 30);
        for(const sx of [-1, 1]){ b(S, sx * (W + .5), 0, zc, 1, H, LEN, pal.wall); b(S, sx * (W - .1), 0, zc, .3, 1.2, LEN, pal.trim); }
        b(S, 0, H, zc, W * 2 + 2, .6, LEN + 1, pal.ceil); b(S, 0, 0, Z1 + .5, W * 2 + 2, H, 1, pal.wall); b(S, 0, 0, Z0 - .5, W * 2 + 2, H, 1, pal.wall);
        for(let z = Z0 + 4; z < Z1; z += 7){
            for(const sx of [-1, 1]){ b(S, sx * (W - .7), 0, z, .9, H, .9, pal.beam); b(S, sx * (W - 1.5), 2, z, .3, .3, 1.6, pal.beam2); b(S, sx * (W - .7), H * .45, z, .5, .5, 3.6, pal.beam2); }
            b(S, 0, H - 2.4, z, W * 2 - 1, .8, .8, pal.beam); b(S, 0, H - 6, z, W * 2 - 6, .35, .35, pal.beam2);
            for(const sx of [-1, 1]) for(const y of [H - 7, H - 13]) b(S, sx * 9, y, z, .3, 4.5, .3, pal.beam2);
        }
        for(const x of [-W * .6, -W * .2, W * .2, W * .6]) b(GL, x, H - .5, zc, 1.6, .2, LEN - 6, pal.glowTop);
        for(const sx of [-1, 1]) for(let z = Z0 + 5; z < Z1 - 4; z += 8) for(const [y, c] of [[3.2, pal.g1], [H * .35, pal.g2], [H * .62, pal.g1]]) b(GL, sx * (W - .15), y, z, .2, .55, 5.2, ((z / 8 | 0) % 2) ? c : pal.g3);
        for(const x of [-2.8, 2.8]) b(GL, x, .05, zc, .18, .05, LEN - 4, pal.glowLane);
    };
    hall(O.B, 18, 0, 118, 26, {floor: "#1c2438", lane: "#242f4a", wall: "#2a3450", trim: "#3a4668", ceil: "#1a2036", beam: "#3a4668", beam2: "#5a6a98", glowTop: "#dfeaff", g1: "#46d8ff", g2: "#ffd8a0", g3: "#e8f4ff", glowLane: "#46e6ff"});
    { const [ox, oz] = O.B; const b = (Q, x, y, z, w, h, d, c) => box(Q, ox + x, y, oz + z, w, h, d, c);
        b(S, -11.5, 0, 117.7, 13, 26, 1, "#2a3450"); b(S, 11.5, 0, 117.7, 13, 26, 1, "#2a3450"); b(S, 0, 17, 117.7, 10.5, 9, 1, "#2a3450"); b(GL, 0, 0, 118.5, 10.4, 17, .2, "#46c8ff");
        for(const sx of [-1, 1]) b(GL, sx * 5.0, 0, 117, .2, 17, .2, "#ffb04a"); b(GL, 0, 17.2, 117, 10, .25, .2, "#ffb04a");
        for(let i = 0; i < 9; i++) b(GL, -4 + i, 20.5, 117, .6, .8, .2, i % 2 ? "#ffd24a" : "#46e6ff");
        for(const sx of [-1, 1]) for(let z = 22; z <= 84; z += 31){ b(S, sx * 14.4, 0, z, 6.2, .4, 11, "#3a4668"); b(GL, sx * 14.4, .45, z, 5.6, .06, 10.4, "#ffb04a"); }
        // シャトルの だい（まるい ぱっど）
        cyl(S, ox, 0, oz + 44, 6.2, 6.5, .5, "#3a4668", 20); cyl(GL, ox, .52, oz + 44, 5.8, 5.8, .05, "#46e6ff", 20);
        // うしろの かべの ほしず（おおきな ひょうじ）
        for(let i = 0; i < 12; i++) b(GL, -8 + i * 1.45, 21, 1.5, .9, .5, .2, i % 3 ? "#ffd24a" : "#46e6ff"); }
    hall(O.A, 15, 0, 38, 11, {floor: "#161e34", lane: "#1f2a4a", wall: "#222c4a", trim: "#3a4668", ceil: "#141a2c", beam: "#34406a", beam2: "#5a6a98", glowTop: "#bfe0ff", g1: "#46d8ff", g2: "#ffd8a0", g3: "#e8f4ff", glowLane: "#46e6ff"});
    { const [ox, oz] = O.A, b = (Q, x, y, z, w, h, d, c) => box(Q, ox + x, y, oz + z, w, h, d, c);
        b(GL, 0, 1, 37.4, 22, 7, .2, "#10305a"); for(let i = 0; i < 40; i++){ const r = rng(i * 5 + 1); b(GL, -10.5 + r() * 21, 1.4 + r() * 6, 37.2, .35, .35, .2, ["#46d8ff", "#ffd24a", "#ff8ac8", "#ffffff"][i % 4]); }
        for(const sz of [-1, 1]) b(GL, -14.8, 1, 18 + sz * 9, .15, 6, 7, "#12406a");
        b(GL, 14.8, 0, 14, .2, 6, 4.4, "#ffb04a"); b(GL, 0, 0, .6, 4.4, 6, .2, "#46c8ff");
        for(const [x, z] of [[-9, 8], [9, 8], [-9, 30], [9, 30]]){ cyl(S, ox + x, 0, oz + z, .3, .4, 3, "#3a4668", 8); cyl(GL, ox + x, 3, oz + z, .5, .5, .1, "#46e6ff", 10); } }
    hall(O.D, 26, 0, 168, 36, {floor: "#14121a", lane: "#2a1620", wall: "#1a1620", trim: "#3a2430", ceil: "#0e0c12", beam: "#2a2630", beam2: "#4a3038", glowTop: "#ff4a3a", g1: "#ff3a2a", g2: "#ff7a2a", g3: "#ffb04a", glowLane: "#ff3a2a"});
    { const [ox, oz] = O.D; const b = (Q, x, y, z, w, h, d, c, ry) => box(Q, ox + x, y, oz + z, w, h, d, c, ry || 0);
        // バルコニー（ゼルバ そうとくの いる ところ）と かいだん
        b(S, -21, 0, 88, 10, 9, 12, "#2a2630"); b(S, -21, 9, 88, 11, .6, 13, "#4a3038"); for(let i = 0; i < 8; i++) b(S, -26 + i * 1.5, 9.6, 82, .15, 1.4, .15, "#3a2a30"); b(GL, -15.4, 9.7, 88, .15, .5, 12, "#ff3a2a");
        for(let i = 0; i < 9; i++) b(S, -15 + i * .5, i * 1.0, 80 - i * .8, 3, 1.0, 1, "#3a2a34");
        // おくの おおきな とびら（ひらく）
        b(S, -14, 0, 167.5, 12, 36, 1, "#1a1620"); b(S, 14, 0, 167.5, 12, 36, 1, "#1a1620"); b(S, 0, 22, 167.5, 16, 14, 1, "#1a1620"); b(GL, 0, 0, 168.3, 16, 22, .2, "#ff4a2a");
        // きょだいな もよう（かべの シンボル：クラウン）
        for(let i = 0; i < 7; i++){ const a = -1.3 + i * .43; b(GL, -3 + sn(a) * 0, 22 + cs(a) * 0 + 6 - Math.abs(i - 3) * 1.2, 2, .8, 3 + (3 - Math.abs(i - 3)) * 1.1, .2, "#ff3a2a"); }
        for(const sx of [-1, 1]) for(let z = 18; z <= 150; z += 22){ b(S, sx * 23.5, 0, z, 3.2, 12, 3.2, "#241f2a"); b(GL, sx * 22, 10, z, .2, 1.6, 2.4, "#ff3a2a"); }
        for(let z = 14; z < 160; z += 12) for(const sx of [-1, 1]) for(let k = 0; k < 3; k++) b(S, sx * (11 + k * 1.1), 0, z + k * .4, 1, .5 + k * .15, 1.6, "#2e2a36"); }
    // ---------- E：ろうか（まがりかど つき）----------
    { const [ox, oz] = O.E, H = 5.2, b = (Q, x, y, z, w, h, d, c) => box(Q, ox + x, y, oz + z, w, h, d, c);
        const nS = CORR.length - 1, dirOf = (i) => { const [x0, z0] = CORR[i], [x1, z1] = CORR[i + 1], l = Math.hypot(x1 - x0, z1 - z0); return [(x1 - x0) / l, (z1 - z0) / l]; }, WC = CW + .3;
        for(let i = 0; i < nS; i++){ const [x0, z0] = CORR[i], [x1, z1] = CORR[i + 1], hz = z0 === z1, ln = Math.hypot(x1 - x0, z1 - z0), d = dirOf(i), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, ext = CW + .4;
            // ゆか・てんじょう
            if(hz){ b(G, mx, 0, mz, ln + ext * 2, .3, CW * 2, "#3a3e58"); b(S, mx, H, mz, ln + ext * 2, .5, CW * 2 + .6, "#222538"); }
            else { b(G, mx, 0, mz, CW * 2, .3, ln + ext * 2, "#3a3e58"); b(S, mx, H, mz, CW * 2 + .6, .5, ln + ext * 2, "#222538"); }
            // かべ（まがりかどでは ひらく がわを あける）
            for(const sd of [-1, 1]){ const n = [-d[1] * sd, d[0] * sd]; let a0 = -ext, a1 = ln + ext;                    // d にそった はじ（A からの きょり）
                if(i > 0){ const dp = dirOf(i - 1); if(n[0] * dp[0] + n[1] * dp[1] < 0) a0 = WC; else a0 = -WC; }
                if(i < nS - 1){ const dn = dirOf(i + 1); if(n[0] * dn[0] + n[1] * dn[1] > 0) a1 = ln - WC; else a1 = ln + WC; }
                const L = a1 - a0, c = (a0 + a1) / 2, cx = x0 + d[0] * c + n[0] * WC, cz = z0 + d[1] * c + n[1] * WC;
                if(hz){ b(S, cx, 0, cz, L, H, .6, "#3a4062"); b(GL, cx - n[0] * .35, 1.1, cz - n[1] * .35, L - 1, .12, .1, "#46c8ff"); b(GL, cx - n[0] * .35, H - .7, cz - n[1] * .35, L - 1, .12, .1, "#ffb04a"); }
                else { b(S, cx, 0, cz, .6, H, L, "#3a4062"); b(GL, cx - n[0] * .35, 1.1, cz - n[1] * .35, .1, .12, L - 1, "#46c8ff"); b(GL, cx - n[0] * .35, H - .7, cz - n[1] * .35, .1, .12, L - 1, "#ffb04a"); } }
            // リブ（はしら ×2 ＋ うえの はり。 とおりぬけられる）
            for(let q = 8; q < ln - 4; q += 6){ const px = x0 + d[0] * q, pz = z0 + d[1] * q; if(hz){ b(S, px, 0, pz - CW + .2, .5, H, .5, "#4a5280"); b(S, px, 0, pz + CW - .2, .5, H, .5, "#4a5280"); b(S, px, H - .7, pz, .5, .7, CW * 2, "#343a58"); b(GL, px, H - .75, pz, .6, .1, CW * 2 - 1, "#e8f4ff"); }
                else { b(S, px - CW + .2, 0, pz, .5, H, .5, "#4a5280"); b(S, px + CW - .2, 0, pz, .5, H, .5, "#4a5280"); b(S, px, H - .7, pz, CW * 2, .7, .5, "#343a58"); b(GL, px, H - .75, pz, CW * 2 - 1, .1, .6, "#e8f4ff"); } } }
        // ろうかの ゆかの ひかる すじ
        for(let i = 0; i < CORR.length - 1; i++){ const [x0, z0] = CORR[i], [x1, z1] = CORR[i + 1]; b(GL, (x0 + x1) / 2, .34, (z0 + z1) / 2, x0 === x1 ? .16 : Math.abs(x1 - x0), .04, x0 === x1 ? Math.abs(z1 - z0) : .16, "#ffd24a"); } }
    // ---------- F：たて穴（リアクターへ おりる）----------
    { const [ox, oz] = O.F, H = 170;
        cyl(S, ox, -4, oz, 14, 14.2, H, "#1a1c2c", 28); cyl(S, ox, -4, oz, 13.2, 13.4, H + 2, "#2a2e48", 28);
        for(let y = 0; y < H - 4; y += 6) for(let q = 0; q < 18; q++){ const t = q / 18 * TAU; box(GL, ox + cs(t) * 12.75, y, oz + sn(t) * 12.75, 4.6, .3, .22, (y / 6 | 0) % 3 === 0 ? "#ffb04a" : "#46d8ff", -t - Math.PI / 2); }
        for(let a = 0; a < 12; a++){ const t = a / 12 * TAU; box(S, ox + cs(t) * 12.6, -2, oz + sn(t) * 12.6, .9, H, .9, "#3a4060", -t); box(GL, ox + cs(t) * 12.4, 0, oz + sn(t) * 12.4, .12, H - 6, .12, a % 2 ? "#46d8ff" : "#ff7a4a", -t); }
        cyl(S, ox, -6, oz, 13, 13, 2, "#10101c", 28); }
    // ---------- G：だっしゅつ トンネル ----------
    { const [ox, oz] = O.G;
        for(let z = 0; z < 220; z += 5){ const c = (z / 5 | 0) % 3 === 0 ? "#ffb04a" : "#46d8ff"; for(let q = 0; q < 16; q++){ const a = q / 16 * TAU; box(GL, ox + cs(a) * 4.2, 4.2 + sn(a) * 4.2 - .9, oz + z, 1.0, .5, .4, c, 0, 0, a + Math.PI / 2); } for(const sx of [-1, 1]) box(S, ox + sx * 4.6, 0, oz + z, .6, 8.4, .5, "#2a2e48"); box(S, ox, 8.4, oz + z, 9, .5, .5, "#2a2e48"); box(G, ox, 0, oz + z, 9, .3, 4.8, "#1a1c2c"); } }
    // ---------- モデル ----------
    // アイアン兵（まるい ヘルメットと オレンジの バイザー。ほかの 作品の 兵隊とは ぜんぜん ちがう デザイン）
    { const P = M("cs2_sol"); for(const s of [-1, 1]){ cyl(P, s * .24, 0, 0, .17, .2, .95, "#3a3f4c", 8); box(P, s * .24, 0, .12, .36, .16, .6, "#2a2e38"); cyl(P, s * .62, .85, 0, .12, .15, .95, "#4a5060", 7); sph(P, s * .58, 1.78, 0, .3, "#5a6070", .9, 8); }
        cyl(P, 0, .9, 0, .45, .5, 1.0, "#4a5060", 10); box(P, 0, 1.15, .4, .6, .5, .1, "#2a2e38"); box(P, 0, 1.5, .46, .44, .08, .05, "#ff8a1a"); box(P, 0, .88, 0, .98, .12, .56, "#2a2e38");
        sph(P, 0, 2.08, 0, .38, "#4a5060", 1.02, 10); box(P, 0, 2.0, .3, .54, .18, .12, "#ff8a1a"); for(const s of [-1, 1]) box(P, s * .38, 2.0, 0, .1, .28, .26, "#2a2e38"); cyl(P, 0, 2.4, 0, .04, .04, .35, "#8a94aa", 5);
        box(P, .72, 1.05, .4, .12, .15, .8, "#2a2e38"); box(P, .72, 1.1, .85, .06, .06, .2, "#ff8a1a"); }
    // ゼルバ そうとく（おおきくて ひらひらの マント。あかい め。ねこの みみのような つの）
    { const P = M("cs2_gov"); for(const s of [-1, 1]){ cyl(P, s * .4, 0, 0, .3, .4, 1.8, "#14161e", 8); box(P, s * .4, 0, .15, .6, .2, .9, "#0a0c12"); sph(P, s * .95, 3.1, 0, .5, "#2a2e3c", .85, 8); cyl(P, s * 1.02, 3.4, 0, 0, .16, .7, "#4a5066", 6); cyl(P, s * 1.05, 1.8, 0, .2, .26, 1.2, "#1c1f2a", 7); }
        cyl(P, 0, 1.7, 0, .72, .55, 1.5, "#1c1f2a", 12); sph(P, 0, 2.6, .46, .16, "#ff4a2a", 1, 7); box(P, 0, 2.0, .5, .9, .14, .08, "#4a5066"); box(P, 0, 1.2, -.7, 2.3, 3.2, .1, "#7a1020"); box(P, 0, 1.2, -.78, 1.9, .3, .06, "#ffd24a"); box(P, 0, 2.5, -.5, 1.6, .9, .22, "#5a1020");
        sph(P, 0, 3.95, 0, .52, "#1c1f2a", 1.12, 12); box(P, 0, 3.88, .44, .6, .14, .1, "#ff2a2a"); for(const s of [-1, 1]){ cyl(P, s * .36, 4.25, 0, 0, .12, .95, "#2a2e3c", 6); } cyl(P, 0, 4.4, 0, 0, .12, .6, "#2a2e3c", 6);
        cyl(P, 1.35, 0, .3, .05, .05, 4.2, "#8a7a4a", 6); sph(P, 1.35, 4.35, .3, .3, "#ff5a3a", 1, 8); }
    // ピコ（ちいさな まるい ロボ。まんまるの おおきな め）
    { const P = M("cs2_pico", 0); sph(P, 0, 0, 0, .42, "#f0f6ff", 1, 12); cyl(P, 0, -.05, 0, .43, .43, .12, "#ff9a3a", 14); sph(P, 0, .06, .36, .23, "#0e1a30", 1, 10); sph(P, 0, .08, .5, .12, "#7affff", 1, 7); sph(P, .03, .13, .55, .04, "#ffffff", 1, 5);
        for(const s of [-1, 1]){ sph(P, s * .44, -.08, .05, .11, "#c8d4ee", 1, 6); box(P, s * .22, .38, 0, .06, .26, .06, "#8a94aa"); sph(P, s * .22, .64, 0, .06, "#ffd24a", 1, 5); } cyl(P, 0, -.45, 0, .12, .18, .12, "#46d8ff", 8); }
    { const P = M("cs2_walker"); box(P, 0, 4.2, 0, 3.6, 2, 5.4, "#2a2e3c"); box(P, 0, 6.1, .6, 2.6, 1.2, 3, "#3a3f4c"); box(P, 0, 6.4, 2.2, 1.6, .5, .12, "#ff8a1a"); for(const [x, z] of [[-1.9, -2.2], [1.9, -2.2], [-1.9, 2.2], [1.9, 2.2]]){ cyl(P, x, 2.4, z, .3, .4, 2.4, "#4a5060", 7); cyl(P, x * 1.25, 0, z, .24, .3, 2.5, "#3a3f4c", 7); box(P, x * 1.25, 0, z + .3, 1, .3, 1.5, "#1a1c24"); }
        for(const s of [-1, 1]){ cyl(P, s * 1.0, 5.5, 3.2, .16, .2, 2.2, "#1a1c24", 6); P[P.length - 1].rx = 1.45; sph(P, s * 1.0, 5.4, 4.8, .2, "#ff6a2a", 1, 6); } }
    { const P = M("cs2_turret"); cyl(P, 0, 0, 0, .2, .3, .8, "#3a3f4c", 8); sph(P, 0, .95, 0, .5, "#4a5060", 1, 9); for(const s of [-1, 1]){ cyl(P, s * .22, .95, .35, .07, .09, .9, "#1a1c24", 6); P[P.length - 1].rx = 1.45; sph(P, s * .22, .95, .86, .07, "#ff5a2a", 1, 5); } sph(P, 0, 1.12, .4, .12, "#ff2a2a", 1, 6); }
    // アイアン・クラウン（おおきな わっかと とげの 旗艦）
    { const P = M("cs2_cruiser"); const R0 = 30; for(let i = 0; i < 28; i++){ const a = i / 28 * TAU; box(P, cs(a) * R0, sn(a) * R0 + R0 * 0, 0, 8.6, 3.4, 6, i % 2 ? "#2a2630" : "#3a3038", 0, 0, a + Math.PI / 2); box(P, cs(a) * (R0 - 2), sn(a) * (R0 - 2), 0, 1.4, .5, 6.2, "#ff3a2a", 0, 0, a + Math.PI / 2); }
        cyl(P, 0, -9, -22, 8, 11, 44, "#1c1a22", 14); P[P.length - 1].rx = Math.PI / 2; for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; box(P, cs(a) * 14, sn(a) * 14, 4, 2, 2, 52, "#2a2630", 0, 0, a); cyl(P, cs(a) * R0 * .98, sn(a) * R0 * .98, 3, 0, 1.6, 12, "#4a3038", 5); }
        box(P, 0, -5, -26, 20, 10, 6, "#0a080e"); box(P, 0, -4.8, -29.4, 18, 8, .5, "#ff6a2a"); for(let i = 0; i < 12; i++){ const a = i / 12 * TAU; box(P, cs(a) * 5, sn(a) * 5, -40, 1, 1, 6, "#ff3a2a"); } }
    { const P = M("cs2_dart"); box(P, 0, 0, 0, 1.2, .8, 5, "#1c1a22"); box(P, 0, -.1, 3, .8, .5, 2, "#2a2630"); for(const s of [-1, 1]){ box(P, s * 1.8, 0, -1, 2.8, .12, 3, "#2a2630", s * .3); box(P, s * 3.1, -.5, -1.4, .2, 1.4, 1.2, "#3a3038"); sph(P, s * .5, 0, -2.6, .34, "#ff4a2a", 1, 6); } sph(P, 0, .35, 1, .3, "#ff8a1a", 1, 6); }
    { const P = M("cs2_star"); sph(P, 0, 0, 0, .7, "#f0f6ff", .8, 10); box(P, 0, -.1, -.4, .5, .3, 1.8, "#c8d4ee"); for(const s of [-1, 1]){ box(P, s * 1.5, 0, -.3, 2.4, .1, 1.4, "#46a0ff", s * .15); box(P, s * 2.7, -.4, -.5, .15, 1.0, .9, "#ffd24a"); sph(P, s * .35, 0, -1.2, .22, "#46d8ff", 1, 6); } sph(P, 0, .25, .5, .26, "#10203a", 1, 6); }
    { const P = M("cs2_pod"); sph(P, 0, 0, 0, .9, "#e8f0ff", 1.15, 10); sph(P, 0, .2, .7, .45, "#46c8ff", .8, 8); box(P, -.8, -.4, -.5, .2, .9, 1, "#ff9a3a"); box(P, .8, -.4, -.5, .2, .9, 1, "#ff9a3a"); box(P, 0, .9, -.5, .2, .9, 1, "#ff9a3a"); sph(P, 0, 0, -1.1, .4, "#ffb04a", 1, 6); }
    { const P = M("cs2_core"); sph(P, 0, 0, 0, 1, "#ffb870", 1, 16); for(let k = 0; k < 3; k++) for(let i = 0; i < 24; i++){ const a = i / 24 * TAU, rr = 1.5 + k * .35; const x = cs(a) * rr, y = sn(a) * rr * (k === 0 ? 1 : .2), z = sn(a) * rr * (k === 0 ? .2 : 1); box(P, x, y, z, .35, .1, .5, ["#ffd24a", "#ff7a4a", "#ff4a8a"][k], k ? -a : 0, 0, k ? 0 : a); } }
    { const P = M("cs2_door"); box(P, 0, 0, 0, 1, 1, 1, "#3a4060"); }
    { const P = M("cs2_crate"); box(P, 0, 0, 0, 1.4, 1.2, 1.4, "#5a6078"); box(P, 0, .5, .72, 1.1, .2, .04, "#ffb04a"); box(P, 0, 0, 0, 1.46, .2, 1.46, "#2a2e3c"); }
    { const P = M("cs2_egg"); sph(P, 0, 0, 0, .55, "#fff4d8", 1.35, 12); for(let i = 0; i < 6; i++){ const a = i / 6 * TAU; sph(P, cs(a) * .4, (i % 3 - 1) * .3, sn(a) * .4, .1, ["#ff8ac8", "#7ad8ff", "#ffe27a"][i % 3], 1, 5); } }
    { const P = M("cs2_table"); cyl(P, 0, 0, 0, 1.9, 2.1, .9, "#2a3450", 18); cyl(P, 0, .9, 0, 2.2, 2.2, .12, "#46d8ff", 18); cyl(P, 0, 1.0, 0, 2.0, 2.0, .06, "#0e1a34", 18); }
    { const P = M("cs2_seat"); box(P, 0, 0, 0, 1.4, .7, 1.4, "#3a4668"); box(P, 0, .7, -.6, 1.4, 1.3, .3, "#46a0ff"); }
    { const P = M("cs2_ban"); box(P, 0, 0, 0, 3, 5, .15, "#ffd24a"); box(P, 0, 1.2, .1, 2.2, 2.4, .06, "#1a2036"); sph(P, 0, 2.4, .14, .7, "#ffd24a", 1, 8); }
    { const P = M("cs2_bolt"); sph(P, 0, 0, 0, .25, "#ffe9a0", 1.8, 6); }
}
export {rng as rng2};
