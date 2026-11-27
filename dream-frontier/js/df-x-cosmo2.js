// ===== コスモクルーズ・ミッション「ほしのたまご」（2026-11-27）=====
//  コスモクルーズ シリーズの 2つめ。 しれいかん キャプテン・ポッドから「ほしのたまご」を あずかり、
//  シャトルで しゅっぱつ → くろがねの かんたい（アイアン・フリート）に つかまる → ゼルバ そうとくの スキャン →
//  ピコの ハッキングで だっしゅつ → ろうかを ぬけて たて穴を おりる → だっしゅつ ポッドで 宇宙へ → えんぐん！
//  ぜんぶ この ゲームの オリジナル（ほかの 作品の 名前・キャラ・絵・音は つかっていません）。
//  3つの ルート × 2つの フィナーレ × 3いろの たまご ＝ 18パターンの うち どれかが ランダムに あたる。
import {TAU, clamp, lerp, ease, root, clearRoot, el, bodyOn} from "./df-xlib.js";
import {speak, stopVoices, capShow, capHide, fxFlash, fxBoom} from "./df-voice.js";
import {COSMO2_LINES} from "./df-x-cosmo2-lines.js";
import {buildCosmo2, O, COLS, CORR, CW, rng2} from "./df-x-cosmo2-art.js";
const sn = Math.sin, cs = Math.cos;
const SP = [4000, 8400];   // 宇宙の 場面の げんてん（モデルは ぜんぶ dyn で 出す）
export const N_PAT = 18, T_END = 274;
const ROUTE = ["レーザー・ろうか", "プレス・ろうか", "ねつの ガス・ろうか"], FINALE = ["わくせい・ダイブ", "いんせき・スラローム"], EGG = ["ピンク", "あお", "きんいろ"];
const T = {A0: 0, A1: 35, B0: 36, B1: 71, C0: 72, C1: 100, D0: 100, D1: 140, E0: 140, E1: 185, F0: 185, F1: 207, G0: 207, G1: 252, H0: 252};
const rngf = rng2;

// ---------- カメラの かぎ（じかん, x, y, z）----------
const keyed = (keys, t) => { if(t <= keys[0][0]) return keys[0].slice(1); for(let i = 0; i < keys.length - 1; i++){ const a = keys[i], b = keys[i + 1]; if(t < b[0]){ const u = ease((t - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } } return keys[keys.length - 1].slice(1); };
const KA = {p: [[0, 0, 1.7, 2], [9, 0, 1.7, 13], [34, 0, 1.7, 14], [36, 6, 1.7, 14]], l: [[0, 0, 3, 26], [9, 0, 3, 28], [13, 0, 2.3, 22], [19, 0, 4.2, 31], [25, -6, 5, 34], [30, 14, 2.5, 13], [36, 16, 2.2, 13]]};
const KB = {p: [[36, 0, 1.7, 3], [52, 0, 1.7, 29], [58, 0, 2.5, 42], [60, 0, 2.5, 43]], l: [[36, 0, 3, 40], [46, 0, 5, 48], [54, 0, 3.4, 44], [60, 0, 3, 70]]};
const KD = {p: [[100, 0, 3, 2], [118, 0, 3, 46], [140, 0, 3, 62]], l: [[100, 0, 10, 120], [108, 0, 6, 84], [114, -21, 12, 88], [126, -21, 12, 88], [129, 0, 4, 100], [140, 6, 3, 110]]};
const KH = {p: [[252, 0, 3, 5], [272, 0, 2.7, 40]], l: [[252, 0, 5, 40], [262, 0, 5, 60], [272, 0, 5, 62]]};

// ---------- ろうか（E）の みちを 距離で ひく ----------
const SEGS = []; let TOT = 0; for(let i = 0; i < CORR.length - 1; i++){ const [x0, z0] = CORR[i], [x1, z1] = CORR[i + 1], ln = Math.hypot(x1 - x0, z1 - z0); SEGS.push({x0, z0, x1, z1, ln, s0: TOT}); TOT += ln; }
const corrAt = (s) => { s = clamp(s, 0, TOT - .01); for(const g of SEGS) if(s < g.s0 + g.ln){ const u = (s - g.s0) / g.ln; return [lerp(g.x0, g.x1, u), lerp(g.z0, g.z1, u)]; } return [0, 0]; };
const sOf = (t) => 5.0 * (t - T.E0) + 1.2 * sn((t - T.E0) * .6);

export const cosmo2 = {
    build(K){ buildCosmo2(K); },
    init(g, R, a){
        const mask = (g.sv.cosmo2Seen && g.sv.cosmo2Seen.length === N_PAT) ? g.sv.cosmo2Seen : "0".repeat(N_PAT);
        let id = (g._cosmo2Pat !== undefined) ? g._cosmo2Pat : Math.floor(Math.random() * N_PAT);
        if(g._cosmo2Pat === undefined && id === g.sv.cosmo2Last) id = (id + 1 + Math.floor(Math.random() * (N_PAT - 2))) % N_PAT;
        R.pat = id; R.route = id % 3; R.fin = ((id / 3) | 0) % 2; R.egg = ((id / 6) | 0) % 3; g.sv.cosmo2Last = id; R.fresh = mask[id] !== "1"; g.sv.cosmo2Seen = mask.slice(0, id) + "1" + mask.slice(id + 1);
        R.t = 0; R.flags = {}; R.voices = []; R.cap = null; R.cm = {shake: 0}; R.rnd = rngf(id * 31 + 7);
        bodyOn("cosmo", true); const r = root(); clearRoot();
        R.h = {top: el("div", "xh", "", "left:10px;top:8px;font-size:clamp(12px,2.6vw,17px)"), hint: el("div", "xh", "", "left:10px;bottom:9%;font-size:clamp(11px,2.4vw,14px)")};
        r.appendChild(R.h.top); r.appendChild(R.h.hint);
        const blk = document.createElement("div"); blk.style.cssText = "position:absolute;left:0;top:0;right:0;bottom:0;background:#000;opacity:1;pointer-events:none;z-index:3"; r.appendChild(blk); R.h.blk = blk;
        R.A.env = "cosbay"; R.A.music = "cosmo";
        g.ui.toast("🛰️ コスモクルーズ・ミッション  きょうの ミッションは 18パターンの うち「" + (id + 1) + "ばん」" + (R.fresh ? "（はじめて！）" : ""), 4600);
    },
    update(g, R, dt, inp){
        const t = R.t, F = R.flags, once = (k, at, fn) => { if(!F[k] && t >= at){ F[k] = 1; fn(); } };
        const say = (id, at) => once("v" + id, at, () => { const L = COSMO2_LINES[id]; if(L) speak(g, R, "cosmo2_" + id, L[0], L[1], L[2]); });
        // ---- こえ（じかん）----
        say("a1", 2.5); say("a2", 9.5); say("a3", 18); say("a4", 25.5); say("a5", 30.5);
        say("b1", 38); say("b2", 55); say("b3", 62.5);
        say("c1", 74); say("c2", 82); say("c3", 90.5);
        say("d1", 104); say("d2", 111); say("d3", 120); say("d4", 130.5); say("d5", 135.5);
        say("e1", 142); say("e2", 148); say("e3" + "abc"[R.route], 156); say("e4", 170); say("e5", 179);
        say("f1", 188); say("f2", 197);
        say("g1", 208); say("g2", 218); say("g3", 229); say("g4", 238.5); say("g5", 245);
        say("h1", 255); say("h2", 262); say("h3", 267.5);
        // ---- こうか ----
        once("bd", 33.5, () => g.sfx("door")); once("sh", 58.5, () => g.sfx("door")); once("sr", 62, () => { g.sfx("rumble"); }); once("sw", 70, () => { g.sfx("warp"); fxFlash(.9); fxBoom("はっしん！", 1.1); });
        for(let k = 0; k < 4; k++) once("al" + k, 78 + k * 2, () => { g.sfx("alarm"); fxFlash(.25, "#ff4a3a"); });
        once("tb", 86, () => { g.sfx("rumble"); g.sfx("whoosh"); fxBoom("トラクタービーム！", 1.3); R.cm.shake = .06; }); once("tb2", 98, () => { R.cm.shake = 0; g.sfx("door"); });
        once("dn", 100.6, () => { g.sfx("door"); g.sfx("rumble"); }); once("sc", 122, () => { g.sfx("sparkle"); g.sfx("rumble"); }); once("sc2", 126, () => g.sfx("sparkle"));
        once("bo", 128.3, () => { g.sfx("crash"); g.sfx("alarm"); fxFlash(.9, "#ff3a2a"); fxBoom("てい でん！", 1.2); R.cm.shake = .05; }); once("bo2", 131, () => { R.cm.shake = 0; });
        for(let k = 0; k < 10; k++) once("bt" + k, 147 + k * 3.8, () => { g.sfx(k % 3 === 2 ? "crash" : "pop"); g.sfx("whoosh"); });
        for(let k = 0; k < 3; k++) once("rf" + k, 150 + R.route * 4 + k * 9, () => { if(R.route === 2){ g.sfx("crash"); fxFlash(.5, "#ffb070"); } else g.sfx("alarm"); });
        once("ed", 183.5, () => g.sfx("door")); once("fd", 187, () => { g.sfx("rumble"); R.cm.shake = .035; }); for(let k = 0; k < 4; k++) once("fr" + k, 191 + k * 4, () => g.sfx("whoosh")); once("fe", 204.5, () => { R.cm.shake = 0; g.sfx("crash"); fxFlash(.7); });
        once("pl", 208, () => { g.sfx("rumble"); g.sfx("whoosh"); }); once("pw", 213.2, () => { g.sfx("warp"); fxFlash(.95); fxBoom("だっしゅつ！", 1.1); });
        for(let k = 0; k < 6; k++) once("ls" + k, 218 + k * 1.6, () => { g.sfx("pop"); g.sfx("whoosh"); });
        once("fl", 228, () => { g.sfx("cheer"); fxFlash(.7); fxBoom("えんぐん とうちゃく！", 1.3); });
        for(let k = 0; k < 6; k++) once("ex" + k, 233 + k * 1.7, () => { g.sfx(k % 2 ? "smash" : "crash"); fxFlash(.35, "#ffd070"); R.cm.shake = .05; });
        once("bx", 243, () => { g.sfx("crash"); g.sfx("cheer"); fxFlash(1, "#ffffff"); fxBoom("ドーン！", 1.3); R.cm.shake = 0; });
        once("hw", 252, () => { g.sfx("warp"); fxFlash(.95); }); for(let k = 0; k < 5; k++) once("cf" + k, 256 + k * 3, () => { g.sfx("sparkle"); g.sfx("cheer"); });
        // ---- くろい まくの ふぇーど ----
        const fadeAt = (c, w) => clamp(1 - Math.abs(t - c) / w, 0, 1);
        const blk = Math.max(t < 1.5 ? 1 - t / 1.5 : 0, fadeAt(35.2, 1.2), fadeAt(59, 1.0) * .9, fadeAt(99.8, .5) * .9, fadeAt(139.8, .5), fadeAt(184.5, 1.0), fadeAt(206.5, .8) * .8, t > T_END - 1.5 ? (t - (T_END - 1.5)) / 1.5 : 0);
        R.h.blk.style.opacity = String(blk);
        // ---- かんきょう・BGM ----
        const env = t < T.B1 ? "cosbay" : t < T.D0 ? "cosspace" : t < T.E0 ? (t < 128.3 ? "ironbay" : "cos2cor") : t < T.G0 + 6.2 ? "cos2cor" : t < 252 ? "cosspace" : "cosbay"; R.A.env = env;
        R.A.music = t < 72 ? "cosmo" : t < 140 ? "cos2dark" : t < 236 ? "cos2run" : "cosmo";
        // ---- おわり ----
        if(t >= T_END && !R.done){ R.done = 1; R.win = true; let bonus = R.fresh ? 8 : 0; if(!g.sv.cosmo2All && g.sv.cosmo2Seen.indexOf("0") < 0){ g.sv.cosmo2All = 1; bonus += 150; g.ui.toast("🏆 18パターン ぜんぶ コンプリート！ +150コイン", 5200); g.sfx("gold"); } g.sv.coins += bonus; if(bonus && bonus < 100) g.ui.toast("🆕 はじめての ミッション！ +" + bonus + "コイン  （みつけた " + (g.sv.cosmo2Seen.split("1").length - 1) + "/" + N_PAT + "）", 4200); }
        if(R.done && t > T_END + 1.2){ g.endRide(true, true); return; }
        const seen = g.sv.cosmo2Seen.split("1").length - 1;
        R.h.top.innerHTML = "<span class='xpill'>🛰️ コスモクルーズ・ミッション　パターン " + (R.pat + 1) + "/" + N_PAT + "　みつけた " + seen + "/" + N_PAT + (t > 100 ? "　" + ROUTE[R.route] + " ／ " + EGG[R.egg] + "の たまご" : "") + "</span>";
        R.h.hint.innerHTML = "<span class='xpill'>ドラッグ：みまわす　Esc：おりる</span>";
        capShow(R, g);
    },
    camera(g, R){
        const t = R.t, cm = R.cm, sh = (cm.shake || 0) + .003; let p, l, roll = 0, fov = 68, o = O.A;
        if(t < T.B0){ o = O.A; p = keyed(KA.p, t); l = keyed(KA.l, t); p[1] += sn(t * 1.7) * .02; }
        else if(t < 60){ o = O.B; p = keyed(KB.p, t); l = keyed(KB.l, t); if(t > 52) p[1] += sn(t * 2) * .02; }
        else if(t < T.C0){ o = O.B; const z = 43 + .75 * (t - 60) ** 2; p = [0, 2.5 + .1 * sn(t * 8) * clamp((t - 60) / 6, 0, 1), z]; l = [0, 3, z + 40]; fov = 68 + clamp((t - 62) * 1.6, 0, 14); cm.shake = clamp((t - 61) * .007, 0, .05); }
        else if(t < T.D0){ o = SP; const u = t - T.C0, z = u < 14 ? 22 * u : 308 + 22 * (u - 14) + 3 * (u - 14) ** 2, wz = 880, up = ease((t - 86) / 14); p = [4 * sn(u * .35) * (1 - up), -20 * up + 2.5 * sn(u * .5), Math.min(z, wz)]; l = [p[0] * .5 + 6 * sn(u * .25), p[1] * .8 + 1, p[2] + 60]; roll = .05 * sn(u * .4) + (u > 14 ? .06 * sn(u * 5) * up : 0); fov = 68 + (u > 14 ? 10 * up : 0); }
        else if(t < T.E0){ o = O.D; p = keyed(KD.p, t); l = keyed(KD.l, t); roll = t > 128.3 ? .03 * sn(t * 9) : 0; if(t > 128.3) fov = 74; }
        else if(t < T.F0){ o = O.E; let s = sOf(t); const duck = R.route === 0 ? ease(1 - Math.abs((s - 26) / 11)) : 0; const q = corrAt(s), la = corrAt(s + 6.5); const back = clamp((t - 168) / 1.5, 0, 1) * clamp((175 - t) / 1.5, 0, 1); p = [q[0], 1.75 - .8 * duck + .05 * sn(t * 11), q[1]]; const bk = corrAt(s - 9); l = [lerp(la[0], bk[0], back), 1.6, lerp(la[1], bk[1], back)]; roll = .03 * sn(t * 3.1) + .05 * duck; fov = 72; if(Math.abs(p[0] - l[0]) + Math.abs(p[2] - l[2]) < .3) l = [p[0], p[1], p[2] + 1]; }
        else if(t < T.G0){ o = O.F; const u = clamp((t - T.F0) / 18, 0, 1), y = 150 - 124 * (u * u * (3 - 2 * u)); p = [0, y, -9]; l = [0, y - 22, 4]; roll = .04 * sn(t * 2.3); fov = 76; }
        else if(t < T.G0 + 6.2){ o = O.G; const u = t - T.G0, z = 3.7 * u * u; p = [0, 4.2, z]; l = [0, 4.2, z + 40]; fov = 70 + clamp(u * 3, 0, 14); }
        else if(t < 252){ o = SP; const u = t - (T.G0 + 6.2), z = 60 * u, back = clamp((t - 219) / 1.2, 0, 1) * clamp((227 - t) / 1.2, 0, 1); p = [10 * sn(u * .4), 4 * cs(u * .55), z]; l = [p[0] + 3 * sn(u * .5), p[1], p[2] + 60]; if(back > 0){ l = [lerp(l[0], p[0] - 18, back), lerp(l[1], p[1] + 4, back), lerp(l[2], p[2] - 70, back)]; } roll = .09 * sn(u * .6) + .1 * back; fov = 78; }
        else { o = O.B; p = keyed(KH.p, t); l = keyed(KH.l, t); p[1] += sn(t * 1.5) * .03; if(t < 254) fov = 68 + (254 - t) * 4; }
        const eye = [o[0] + p[0] + (Math.random() - .5) * sh * 2, p[1] + (Math.random() - .5) * sh * 1.6, o[1] + p[2]], dx = l[0] - p[0], dy = l[1] - p[1], dz = l[2] - p[2];
        return {eye, yaw: Math.atan2(dx, dz) + g.lookYaw, pitch: Math.atan2(dy, Math.hypot(dx, dz)) + g.lookPitch, roll: roll + (Math.random() - .5) * sh * .3, fov};
    },
    dyn(g, R, D){ dynAll(g, R, D); },
    hud(R){ return R.t < 36 ? "ブリーフィング・ルーム" : R.t < 72 ? "スターライト・ハンガー" : "コスモクルーズ・ミッション  パターン " + (R.pat + 1) + "/" + N_PAT; },
    end(g, R){ stopVoices(R); capHide(); clearRoot(); bodyOn("cosmo", false); }
};

// ---------- うごく もの ----------
const glow = (D, x, y, z, w, c, a, h) => D.push({s: "glow", x, y, z, w, h: h || w, c, a});
const star = (D, x, y, z, w, c, a) => D.push({s: "star", x, y, z, w, h: w, c, a});
function dynAll(g, R, D){
    const t = R.t, Tm = g.t, egg = COLS.egg[R.egg];
    if(t < T.B0) sceneA(D, R, t, Tm, egg);
    else if(t < T.C0 || t >= 252) sceneB(D, R, t, Tm, egg);
    else if(t < T.D0) sceneC(D, R, t, Tm, egg);
    else if(t < T.E0) sceneD(D, R, t, Tm, egg);
    else if(t < T.F0) sceneE(D, R, t, Tm, egg);
    else if(t < T.G0) sceneF(D, R, t, Tm, egg);
    else sceneG(D, R, t, Tm, egg);
}
const sky = (D, cx, cy, cz, n, rad, Tm, k) => { for(let i = 0; i < n; i++){ const r = rngf(i * 7 + 3 + (k || 0)), th = r() * TAU, ph = Math.acos(1 - 2 * r()), tw = .55 + .45 * sn(Tm * 1.3 + i), sz = 4 + r() * 5, q = r(); glow(D, cx + rad * sn(ph) * cs(th), cy + rad * cs(ph), cz + rad * sn(ph) * sn(th), sz, q > .85 ? [1, .8, .6] : q > .6 ? [.7, .85, 1] : [1, 1, 1], .95 * tw); } };

function sceneA(D, R, t, Tm, egg){
    const [ox, oz] = O.A, X = (x) => ox + x, Z = (z) => oz + z;
    D.push({m: "cs2_table", x: X(0), y: 0, z: Z(22), yaw: 0, sx: 1.2, sy: 1.2, sz: 1.2});
    // ホログラムの ほしと ほしのたまご
    const ex = X(0), ez = Z(22), gl = [.45, .85, 1];
    glow(D, ex, 2.6, ez, 4.4, gl, .35); for(let i = 0; i < 18; i++){ const a = i / 18 * TAU + Tm * .6; glow(D, ex + cs(a) * 2.2, 2.6 + sn(a * 2 + Tm) * .4, ez + sn(a) * 2.2, .35, gl, .85); }
    for(let i = 0; i < 28; i++){ const a = Tm * .4 + i * .9, rr = 1.0 + (i % 5) * .35; glow(D, ex + cs(a) * rr, 1.8 + (i % 7) * .35, ez + sn(a) * rr, .22, i % 3 ? [.6, .9, 1] : [1, .9, .5], .8); }
    D.push({m: "cs2_egg", x: ex, y: 3.1 + .15 * sn(Tm * 1.8), z: ez, yaw: Tm * .9, sx: 1.2, sy: 1.2, sz: 1.2}); glow(D, ex, 3.7, ez, 2.6 + .3 * sn(Tm * 3), egg, .55);
    D.push({m: "cs_cmd", x: X(0), y: .5, z: Z(31), yaw: Math.PI, sx: .72, sy: .72 + .012 * sn(Tm * 2.2), sz: .72}); glow(D, X(0), 4, Z(31), 9, [1, .9, .6], .08);
    // ロボクルーと ピコ
    for(let k = 0; k < 2; k++) for(let i = 0; i < 4; i++){ const sx = k ? 1 : -1, hop = t > 28 ? Math.abs(sn(t * 4 + i)) * .2 : 0; D.push({m: "cs_rob" + ((i + k) % 3), x: X(sx * 10.6), y: hop, z: Z(8 + i * 6.5), yaw: -sx * Math.PI / 2, sx: .85, sy: .85, sz: .85}); }
    pico(D, X(-2.4 + .5 * sn(Tm * .9)), 2.4 + .25 * sn(Tm * 1.7), Z(15.5), Tm, 1.2, Math.PI * 0 + Math.atan2(0 - -2.4, 2 - 15.5) + .5);
    // ほしずを うつす まくの ひかり（でんこうけいじばん）
    for(let i = 0; i < 24; i++){ const a = Tm * .3 + i * .7; glow(D, X(-10.2), 3.5 + sn(a) * 2.2, Z(18 + cs(a * .8) * 8), .5, [.5, .9, 1], .6); glow(D, X(10.2), 3.5 + cs(a) * 2.2, Z(18 + sn(a * .8) * 8), .5, [1, .8, .4], .6); }
}
function pico(D, x, y, z, Tm, sc, yaw){ D.push({m: "cs2_pico", x, y, z, yaw, sx: sc, sy: sc, sz: sc}); glow(D, x, y - .5 * sc, z, .9 * sc, [.4, .9, 1], .7); glow(D, x, y, z, 2.6 * sc, [.5, .9, 1], .12); }
function sceneB(D, R, t, Tm, egg){
    const [ox, oz] = O.B, X = (x) => ox + x, Z = (z) => oz + z, end = t >= 252;
    if(!end){ if(t < 58.5) D.push({m: "cs_shuttle", x: X(0), y: .5, z: Z(44), yaw: 0, sx: 2.3, sy: 2.3, sz: 2.3}); glow(D, X(0), 3, Z(44), 14, [.5, .8, 1], .12); }
    for(let k = 0; k < 2; k++) for(let i = 0; i < 6; i++){ const sx = k ? 1 : -1, cheer = end ? Math.abs(sn(t * 5 + i * 1.3)) * .5 : Math.abs(sn(t * 3 + i)) * .1; D.push({m: "cs_rob" + ((i + k) % 3), x: X(sx * 10), y: cheer, z: Z(14 + i * 9), yaw: -sx * Math.PI / 2, sx: 1.2, sy: 1.2, sz: 1.2}); }
    for(let i = 0; i < 4; i++) D.push({m: "cs2_ban", x: X(i % 2 ? 17.6 : -17.6), y: 9, z: Z(26 + (i >> 1) * 48), yaw: i % 2 ? -Math.PI / 2 : Math.PI / 2, sx: 1.5, sy: 1.5, sz: 1.5});
    D.push({m: "cs2_crate", x: X(-14), y: 0, z: Z(70), yaw: .3, sx: 1.4, sy: 1.4, sz: 1.4}); D.push({m: "cs2_crate", x: X(14), y: 0, z: Z(78), yaw: -.2, sx: 1.4, sy: 1.4, sz: 1.4});
    if(end){ const f = clamp((t - 252) / 4, 0, 1);
        D.push({m: "cs_cmd", x: X(0), y: .5, z: Z(63), yaw: Math.PI, sx: 1.05, sy: 1.05 + .015 * sn(Tm * 3), sz: 1.05}); glow(D, X(0), 7, Z(63), 12, [1, .9, .6], .1);
        pico(D, X(1.6 + sn(Tm * 1.2)), 2.8 + .3 * sn(Tm * 2), Z(Math.min(40, 6 + (t - 252) * 2.1) + 9), Tm, 1.3, Math.PI);
        D.push({m: "cs2_egg", x: X(0), y: 6.4 + .2 * sn(Tm * 2), z: Z(63), yaw: Tm, sx: 1.4, sy: 1.4, sz: 1.4}); glow(D, X(0), 6.7, Z(63), 3.4, egg, .5);
        for(let i = 0; i < 70; i++){ const r = rngf(i * 13 + 5), life = ((Tm * .5 + r()) % 1), cx = X((r() - .5) * 30), cz = Z(10 + r() * 55); glow(D, cx + sn(Tm + i) * .6, 16 * (1 - life), cz, .35, [[1, .8, .3], [1, .4, .7], [.4, .9, 1], [.7, 1, .5]][i % 4], .9 * f); }
        for(let i = 0; i < 6; i++) D.push({m: "cs_drone", x: X(sn(Tm * .7 + i * 1.1) * 14), y: 8 + (i % 3) * 2 + sn(Tm + i), z: Z(20 + i * 8), yaw: Tm + i, sx: .6, sy: .6, sz: .6}); }
}
function sceneC(D, R, t, Tm, egg){
    const [ox, oz] = SP, u = t - T.C0, cz = oz + (u < 14 ? 22 * u : 308 + 22 * (u - 14) + 3 * (u - 14) ** 2);
    sky(D, ox, 0, cz, 260, 800, Tm, 1);
    const pi = [2, 1, 6][R.egg]; D.push({m: "cs_pl" + pi, x: ox - 620, y: -180, z: oz + 900, yaw: Tm * .02, rx: .3, sx: 150, sy: 150, sz: 150}); glow(D, ox - 620, -180, oz + 780, 560, [.5, .7, 1], .16);
    glow(D, ox + 300, 120, oz + 900, 700, [.4, .2, .5], .3);
    // アイアン・クラウン
    const k = ease(clamp((t - 74) / 8, 0, 1)) * (1 - clamp((t - 92) / 5, 0, 1)); D.push({m: "cs2_cruiser", x: ox, y: 0, z: oz + 1000, yaw: 0, sx: 4, sy: 4, sz: 4}); glow(D, ox, -20, oz + 883, 130 + 20 * sn(Tm * 3), [1, .5, .2], .35 * k); glow(D, ox, 0, oz + 990, 520, [1, .2, .15], .09 * (1 - clamp((t - 90) / 5, 0, 1)));
    if(t > 78) for(let i = 0; i < 4; i++){ const f = ((Tm * .22 + i * .25) % 1); D.push({m: "cs2_dart", x: ox + (i % 2 ? 1 : -1) * (30 + i * 8) * (1 - f * .7), y: (i - 1.5) * 8, z: cz + 320 - f * 380, yaw: Math.PI, sx: 1.4, sy: 1.4, sz: 1.4}); glow(D, ox + (i % 2 ? 1 : -1) * (30 + i * 8) * (1 - f * .7), (i - 1.5) * 8, cz + 330 - f * 380, 7, [1, .35, .2], .6); }
    // トラクタービーム
    if(t >= 86) for(let i = 0; i < 28; i++){ const z = cz + 14 + i * 22, r = 3 + i * .65, a = i * .3 - Tm * 3; for(let q = 0; q < 10; q++){ const th = q / 10 * TAU + a; glow(D, ox + cs(th) * r * (1 - .1 * sn(a)), -2 + sn(th) * r * .8 - 20 * ease((t - 86) / 14) * (i / 28), z, 1.5, i % 2 ? [.5, .9, 1] : [1, .5, .3], .55); } }
    if(t >= 90) glow(D, ox, -4, cz + 40, 40, [.5, .9, 1], .12);
    // うちの めの こども（おとぎの ぶきみさを おさえる）しんごうとう
    if(t > 76 && t < 86) glow(D, ox, 0, cz + 6, 6 + 3 * sn(Tm * 12), [1, .3, .2], .3);
}
function sceneD(D, R, t, Tm, egg){
    const [ox, oz] = O.D, X = (x) => ox + x, Z = (z) => oz + z, camP = keyed(KD.p, t), black = t >= 128.3;
    for(const col of [[-8, 1], [8, -1], [-15, 1], [15, -1], [-21, 1], [21, -1]]) for(let i = 0; i < 11; i++){ const z = 18 + i * 6.2; const dz = camP[2] - z, turn = t > 112 && dz > -40 ? Math.atan2(camP[0] - col[0], dz) : col[1] * Math.PI / 2 * -1; if(Math.abs(z - camP[2]) > 2.5 || Math.abs(col[0]) > 4) D.push({m: "cs2_sol", x: X(col[0]), y: 0, z: Z(z), yaw: black ? turn : (t > 112 ? turn : col[1] * Math.PI / 2 * -1 + Math.PI), sx: 1.25, sy: 1.25, sz: 1.25}); if(i % 2 === 0) glow(D, X(col[0] + col[1] * -.28), 2.8, Z(z) + .5, .5, black ? [1, .15, .1] : [1, .55, .15], .9); }
    for(const sx of [-1, 1]) D.push({m: "cs2_walker", x: X(sx * 13), y: 0, z: Z(150), yaw: Math.PI, sx: 1.6, sy: 1.6, sz: 1.6});
    D.push({m: "cs2_gov", x: X(-21), y: 9.6, z: Z(88), yaw: black ? Math.PI / 2 + .5 : Math.atan2(camP[0] + 21, camP[2] - 88), sx: 1.5, sy: 1.5 + .01 * sn(Tm * 2), sz: 1.5}); glow(D, X(-21), 17, Z(88), 10, [1, .2, .15], .25);
    for(let i = 0; i < 6; i++) glow(D, X(-14 + i * 5.6), 33, Z(70 + (i % 2) * 40), 8 + 2 * sn(Tm * 2 + i), [1, .25, .15], .22);
    // スキャナー
    if(t >= 121 && t < 131){ const z = 14 + (t - 121) * 5.4; for(let q = 0; q < 36; q++){ const a = q / 36 * TAU; glow(D, X(cs(a) * 11), 11 + sn(a) * 10, Z(z), 1.4, egg, .85); } glow(D, X(0), 11, Z(z), 34, egg, .1); for(let k = 0; k < 14; k++) glow(D, X(-10 + k * 1.5), .3, Z(z - 1 + sn(k) * .4), .8, egg, .8); }
    if(t > 124 && t < 128.3) for(let i = 0; i < 12; i++) glow(D, X(sn(Tm * 8 + i) * 4), 3 + (i % 4), Z(camP[2] + 4 + i * 2), 3.5, [1, .15, .1], .3);
    if(black){ pico(D, X(1.8 * sn(Tm * 2.1)), 2.6 + .3 * sn(Tm * 3), Z(camP[2] + 6), Tm, 1.5, Math.PI); if(Math.floor(Tm * 2.5) % 2) glow(D, X(0), 8, Z(camP[2] + 12), 70, [1, .1, .08], .16); }
}
function sceneE(D, R, t, Tm, egg){
    const [ox, oz] = O.E, s = sOf(t), q = corrAt(s), W = (x, z) => [ox + x, oz + z], PI = Math.PI;
    const ahead = (d) => corrAt(s + d), pc = ahead(7.5), pp = W(pc[0], pc[1]);
    pico(D, pp[0], 2.3 + .25 * sn(Tm * 3.1), pp[1], Tm, 1.1, Math.atan2(corrAt(s + 12)[0] - pc[0], corrAt(s + 12)[1] - pc[1]));
    // ついせきの アイアン兵（うしろ）
    for(let i = 0; i < 6; i++){ const d = corrAt(s - 12 - i * 2.2), nx = corrAt(s - 10 - i * 2.2), w = W(d[0] + (i % 2 ? 1.2 : -1.2), d[1]); D.push({m: "cs2_sol", x: w[0], y: Math.abs(sn(Tm * 7 + i)) * .25, z: w[1], yaw: Math.atan2(q[0] - d[0], q[1] - d[1]), sx: 1.2, sy: 1.2, sz: 1.2}); glow(D, w[0], 2.7, w[1], .5, [1, .5, .1], .8); }
    // ブラスターの たま（ターレットから）
    for(let k = 0; k < 14; k++){ const per = 3.8, ph = ((t - T.E0 - k * 1.1) % per) / per; if(ph < 0 || ph > 1 || t > 173) continue; const sd = ahead(40 - ph * 36), side = k % 2 ? 1 : -1; const bx = sd[0] + side * 2.6 * (1 - ph), w = W(bx, sd[1]); D.push({m: "cs2_bolt", x: w[0], y: 2.2 - ph * .4, z: w[1], yaw: Math.atan2(q[0] - sd[0], q[1] - sd[1]), sx: 1, sy: 1, sz: 1.2}); glow(D, w[0], 2.2 - ph * .4, w[1], 1.1, [1, .6, .2], .85); }
    // かべの タレット
    for(let d = 12; d < 200; d += 16){ const a = corrAt(d), b = corrAt(d + 1), horiz = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]), side = (d / 16 | 0) % 2 ? 1 : -1, w = horiz ? W(a[0], a[1] + side * (CW - .5)) : W(a[0] + side * (CW - .5), a[1]); if(Math.abs(d - s) < 40) D.push({m: "cs2_turret", x: w[0], y: 3.6, z: w[1], yaw: horiz ? (side > 0 ? PI : 0) : (side > 0 ? -PI / 2 : PI / 2), sx: 1.1, sy: 1.1, sz: 1.1}); }
    if(R.route === 0){ // レーザー・ろうか（はじめの まっすぐ）
        for(let i = 0; i < 9; i++){ const z = 8 + i * 4.2, y = 1.2 + 1.2 * (.5 + .5 * sn(Tm * 1.6 + i * 1.3)), w = W(0, z); box3(D, w[0], y, w[1], CW); glow(D, w[0], y, w[1], 2.2, [1, .15, .1], .55); } }
    else if(R.route === 1){ // プレス
        for(let i = 0; i < 6; i++){ const base = 84 + i * 6 - 48 + 48, z = 48 + 10 + i * 8.5, ph = (Tm * .6 + i * .37) % 1, y = 5.0 - 4.2 * (ph < .5 ? ph * 2 : (1 - ph) * 2) * (ph < .5 ? 1 : 1), w = W(30, z); D.push({m: "cs2_door", x: w[0], y, z: w[1], yaw: 0, sx: CW * 2 - .4, sy: 2.2, sz: 1.2}); glow(D, w[0], y, w[1], 5, [1, .6, .2], .1); } }
    else { // ねつの ガス
        for(let i = 0; i < 26; i++){ const z = 52 + i * 2, side = i % 2 ? 1 : -1, ph = ((Tm * .7 + i * .21) % 1), w = W(30 + side * 2.4, z); glow(D, w[0], .4 + ph * 3.4, w[1], 2.2 + ph * 2.4, [1, .95, .9], .5 * (1 - ph)); }
        for(let i = 0; i < 4; i++){ const z = 160 + i * 6, ph = ((Tm * 1.3 + i) % 1), w = W(4, z); glow(D, w[0] + sn(i) * 1.6, 1 + ph * 2, w[1], 1.2, [1, .7, .3], .8 * (1 - ph)); } }
    // おくの とびら（ひらく）
    const dd = W(4, 158); D.push({m: "cs2_door", x: dd[0] - 1.6 - 2.8 * ease((t - 175) / 6), y: 0, z: dd[1], yaw: 0, sx: 3.2, sy: 5.2, sz: .8}); D.push({m: "cs2_door", x: dd[0] + 1.6 + 2.8 * ease((t - 175) / 6), y: 0, z: dd[1], yaw: 0, sx: 3.2, sy: 5.2, sz: .8});
    if(t > 140 && t < 146) glow(D, ox + 0, 2, oz + 6, 7, [1, .2, .15], .35);
}
function box3(D, x, y, z, hw){ D.push({m: "cs2_door", x, y: y - .06, z, yaw: 0, sx: hw * 2 - .5, sy: .12, sz: .12}); }
function sceneF(D, R, t, Tm, egg){
    const [ox, oz] = O.F, u = clamp((t - T.F0) / 18, 0, 1), y = 150 - 124 * (u * u * (3 - 2 * u)), PI = Math.PI;
    D.push({m: "cs2_core", x: ox, y: 3, z: oz, yaw: Tm * .5, rx: Tm * .4, sx: 7.5, sy: 7.5, sz: 7.5}); glow(D, ox, 3, oz, 22, egg.map((c) => c * .5 + .5), .22 + .06 * sn(Tm * 4)); glow(D, ox, 3, oz, 50, [1, .7, .3], .1);
    for(let i = 0; i < 40; i++){ const r = rngf(i * 11 + 2), a = r() * TAU, rr = 3 + r() * 9, ph = ((Tm * (.2 + r() * .3) + r()) % 1); glow(D, ox + cs(a) * rr, 3 + ph * 60, oz + sn(a) * rr, .5 + r() * .5, [1, .7 + r() * .3, .3], .7 * (1 - ph)); }
    for(let i = 0; i < 16; i++){ const r = rngf(i * 7 + 9), a = r() * TAU, yy = y + 14 - (((Tm * 30 * (.5 + r())) + i * 13) % 40); glow(D, ox + cs(a) * 11.4, yy, oz + sn(a) * 11.4, .8, [1, .8, .4], .6); }
    // カメラの すこし まえの したに、 ピコ・ロボ・たまごが いっしょに おちていく
    const bx = ox, by = y - 4.6, bz = oz - 6.2;
    D.push({m: "cs2_pico", x: bx + 2.2, y: by + .9 + .15 * sn(Tm * 3), z: bz, yaw: -.4, sx: 1.0, sy: 1.0, sz: 1.0}); glow(D, bx + 2.2, by + .4, bz, .8, [.4, .9, 1], .7);
    D.push({m: "cs_rob1", x: bx - 3.4, y: by - .4, z: bz, yaw: .3, sx: .7, sy: .7, sz: .7});
    D.push({m: "cs2_egg", x: bx - 1.0, y: by + .5, z: bz, yaw: Tm, sx: .32, sy: .32, sz: .32}); glow(D, bx - 1.0, by + .6, bz, 1.0, egg, .35);
}
function sceneG(D, R, t, Tm, egg){
    if(t < T.G0 + 6.2){ const [ox, oz] = O.G, u = t - T.G0, z = 3.7 * u * u; glow(D, ox, 4.2, oz + z + 30, 5, [.5, .9, 1], .25); for(let i = 0; i < 20; i++) glow(D, ox + (i % 2 ? 1 : -1) * 3, 1 + (i % 4), oz + z + 15 + ((Tm * 80 + i * 9) % 100), .6, [.5, .9, 1], .5); return; }
    const [ox, oz] = SP, u = t - (T.G0 + 6.2), z = 60 * u, cz = oz + z, PI = Math.PI;
    sky(D, ox, 0, cz, 260, 800, Tm, 40);
    // アイアン・クラウンが うしろに
    const bx = ox - 210 + 14 * sn(Tm * .2), by = 36, bz = cz - 150 + 20 * sn(Tm * .15), dead = t > 243; D.push({m: "cs2_cruiser", x: bx, y: by, z: bz, yaw: .6, rx: -.1, sx: 3.4, sy: 3.4, sz: 3.4}); glow(D, bx, by, bz, 420, [1, .25, .15], dead ? .04 : .12);
    for(let k = 0; k < 6; k++){ const ex = t > 233 + k * 1.7 ? clamp((t - 233 - k * 1.7) / 1.4, 0, 1) : 0; if(ex > 0 && ex < 1){ const a = k * 1.7; glow(D, bx + sn(a) * 70, by + cs(a) * 60, bz + 20, 150 * ex + 30, [1, .8, .4], 1 - ex); star(D, bx + sn(a) * 70, by + cs(a) * 60, bz + 20, 200 * ex, [1, .95, .7], 1 - ex); } }
    // ダーツが おってくる（うしろ）
    if(t < 238) for(let i = 0; i < 7; i++){ const f = ((Tm * .18 + i * .14) % 1), lx = (i % 2 ? 1 : -1) * (12 + (i % 3) * 8) * (1 - f * .4) + 8 * sn(Tm + i), ly = (i % 3 - 1) * 7 + 2 * sn(Tm * 2 + i), dz = -28 - f * 70, w = [ox + lx + 10 * sn(u * .4), ly + 4 * cs(u * .55), cz + dz]; D.push({m: "cs2_dart", x: w[0], y: w[1], z: w[2], yaw: 0, sx: 1.1, sy: 1.1, sz: 1.1}); glow(D, w[0], w[1], w[2] - 3, 3.6, [1, .35, .15], .7); if(i % 2 === 0 && t > 217) { const f2 = ((Tm * 1.7 + i) % 1); glow(D, w[0] * (1 - f2) + (ox + 10 * sn(u * .4)) * f2, w[1] * (1 - f2) + 4 * cs(u * .55) * f2, w[2] * (1 - f2) + cz * f2, 1.1, [1, .5, .2], .9); } }
    // スターライト かんたい（えんぐん）
    if(t >= 227.5 && t < 246){ const f = ease(clamp((t - 227.5) / 5, 0, 1)); for(let i = 0; i < 14; i++){ const lx = (i % 2 ? 1 : -1) * (26 + (i >> 1) * 15), ly = ((i % 3) - 1) * 14, sz = cz + 330 - f * 250 + (i % 4) * 22; D.push({m: "cs2_star", x: ox + lx, y: ly, z: sz, yaw: PI, sx: 5, sy: 5, sz: 5}); glow(D, ox + lx, ly, sz + 6, 12, [.4, .9, 1], .8); } if(t < 238) for(let i = 0; i < 10; i++){ const f2 = ((Tm * 1.4 + i * .1) % 1); glow(D, lerp(ox + (i % 2 ? 40 : -40), bx, f2), lerp(ly0(i), by, f2), lerp(cz + 220, bz, f2), 2.4, [.5, 1, 1], .85); } }
    // フィナーレ（わくせい・ダイブ／いんせき）
    if(t >= 243){ const k = clamp((t - 243) / 9, 0, 1); if(R.fin === 0){ D.push({m: "cs_pl1", x: ox + 40, y: -230 + 130 * k, z: cz + 170, yaw: Tm * .05, rx: .2, sx: 180, sy: 180, sz: 180}); glow(D, ox + 40, -200 + 130 * k, cz + 90, 520, [.5, .8, 1], .18); }
        else for(let i = 0; i < 14; i++){ const r = rngf(i * 17 + 4), rz = (((t - 243) * 36 + i * 55) % 520) - 40; D.push({m: "cs_rock" + (i % 3), x: ox + (r() - .5) * 60 * (1 - .3 * sn(i)), y: (r() - .5) * 26, z: cz + rz + 20, yaw: Tm * .6 + i, rx: Tm * .5, sx: 4 + r() * 6, sy: 4 + r() * 6, sz: 4 + r() * 6}); } }
}
const ly0 = (i) => ((i % 3) - 1) * 14;
