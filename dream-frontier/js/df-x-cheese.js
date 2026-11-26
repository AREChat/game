// ===== チーズいせきの ドタバタ・ジープ（ならんで → のって → ぐるぐる 大ぼうけん）=====
//  ライバルだけど とても なかよしの 男の子「ガク」と 女の子「ミミ」の ジープに ご とうじょう！
//  いたずら ねこ「モフゾー」と ちゃっかり ねずみ「チュッピ」の ドタバタ おいかけっこの なかを ぬけて、おたからの チーズを めざそう。
//  ① キューライン（6ふん）：ならぶ へやを すこしずつ すすむ。BGM は 曲の 0:00〜6:00。  ② ライド（5ふん17びょう）：BGM は 曲の 6:00〜さいごまで。
//  E：（ならんでいる とき）みんなで かんせい！／（のって いる とき）チーズを なげる。 虫は ぜったい でてきません。キャラは ぜんぶ オリジナル。
import {TAU, clamp, lerp, ease, wrapPi, root, clearRoot, el, bodyOn} from "./df-xlib.js";
import {makePath} from "./df-path.js";
import {Snd} from "./audio.js";
import {LINES} from "./df-x-cheese-lines.js";
import {waitMinutes, started, record} from "./df-wait.js";
import {spriteReady, spriteImage, SPRITE_H} from "./df-sprites.js";
import {SX, SZ, HALL, OUTQ, SCN, SIGN, queuePts, stationPt, buildModels, buildStage, buildPark} from "./df-x-cheese-art.js";
import {propReady} from "./df-props.js";

export const QT = 360, BT = 7, RT = 317, TOT = QT + RT;   // キュー・のりこみ・ライドの ながさ（びょう）。BGM の ながさに あわせている
export const BOARD = {x: -72, z: 56};
const VOICE = new URL("../voice/", import.meta.url).href;
const WHO = {gaku: "ガク", mimi: "ミミ", gf: "ガイドの おねえさん", gm: "ガイドの おにいさん", cat: "モフゾー", mouse: "チュッピ"};
const WCOL = {gaku: "#6ab8ff", mimi: "#ff8ac0", gf: "#ffe27a", gm: "#9affc0", cat: "#ffb060", mouse: "#d8c0ff"};
// 絵が そろって いれば 1枚絵、まだなら 手作りモデル（e：モデル用の 描画データ、off：モデルの 足もとの ずれ。"c" は 中心が 原点のもの）
const SPR = (e, name, off) => { if(!spriteReady(name)) return e; const ss = e.sy || 1; let y = e.y; if(off === "c"){ const im = spriteImage(name, "f").img; y -= SPRITE_H[name] * ss * im.naturalHeight / 256 / 2; } else y -= off * ss; return {m: e.m, p: name, x: e.x, y, z: e.z, yaw: e.yaw, ss}; };
const NMAX = 1;
let RP = null, QP = null;   // ライドの みち、キューの みち

// ---------- みち ----------
function ensure(){
    if(RP) return;
    const zb = HALL.zb, pts = [stationPt()], start = [];
    SCN.forEach((sc, k) => { start.push(k === 0 ? 0 : pts.length - 1); if(k === 0) pts.push([sc.cx + 50, zb, 0]); for(const p of sc.pts) pts.push([sc.cx + p[0], zb + p[1], p[2]]); pts.push([sc.cx - 50, zb, 0]); });
    const P = makePath(pts.map((q) => [q[0] + SX, q[1] + SZ, q[2]]), false, 12), sb = start.map((i) => P.len[i * 12]); sb.push(P.total);
    // しかけの ために ゆっくり なる ところ（ホールド）を ならした ときの すすみぐあい
    const tab = SCN.map((sc, k) => { const N = 120, cum = [0], w = (tau) => { let v = 1; for(const [a, b] of sc.holds) v -= ease((tau - (a - .04)) / .04) * (1 - ease((tau - b) / .04)); if(k === 0) v *= ease(tau / .08); return Math.max(0, v); };
        for(let i = 1; i <= N; i++) cum.push(cum[i - 1] + w((i - .5) / N)); const tot = cum[N]; return cum.map((c) => c / tot); });
    const tS = []; let acc = 0; for(const sc of SCN){ tS.push(acc); acc += sc.d; }
    RP = {P, sb, tab, tS, total: acc};
    const q = queuePts().map((p) => [p[0] + SX, p[1] + SZ, p[2]]); QP = makePath(q, false, 10);
}
const prog = (k, tau) => { const T = RP.tab[k], f = clamp(tau, 0, 1) * 120, i = Math.min(119, f | 0); return lerp(T[i], T[i + 1], f - i); };
const hdg = (P, s, d) => { const a = P.at(Math.max(0, s - d)), b = P.at(Math.min(P.total - .01, s + d)); return Math.atan2(b[0] - a[0], b[2] - a[2]); };
function pp(s, lat, y){ const P = RP.P, c = P.at(s), yaw = hdg(P, s, .7); return {x: c[0] - Math.cos(yaw) * lat, y: c[1] + (y || 0), z: c[2] + Math.sin(yaw) * lat, yaw}; }
const qp = (s, lat) => { const P = QP, c = P.at(clamp(s, 0, P.total - .01)), yaw = hdg(P, clamp(s, 0, P.total - .01), .7); return {x: c[0] - Math.cos(yaw) * (lat || 0), z: c[2] + Math.sin(yaw) * (lat || 0), yaw}; };
const Q0 = 14;
function qs(t){ ensure(); const N = 26, per = QT / N, k = Math.min(N, Math.floor(t / per)), u = (t - k * per) / per, f = (k + (k >= N ? 0 : ease(clamp((u - .25) / .6, 0, 1)))) / N; return Q0 + (QP.total - Q0) * f; }

// ---------- 音声・字幕 ----------
function say(g, R, id){
    const L = LINES[id]; if(!L) return; R.cap = {id, who: L[0], text: L[1], until: g.t + L[2] + .8, from: g.t};
    if(!Snd.isOn()) return;
    try{ const a = new Audio(VOICE + "cheese_" + id + ".mp3"); a.volume = clamp(.5 + Snd.getSeVol() * .6, 0, 1); a.play().catch(() => {}); R.voices = R.voices || []; R.voices.push(a); if(R.voices.length > 6) R.voices.shift(); }catch(_e){}
}
function events(){
    const E = [[3, "q01"], [34, "q02"], [62, "q03"], [68, "q04"], [76, "q05"], [83, "q06"], [120, "q07"], [160, "q08"], [200, "q09"], [206, "q10"], [238, "q11"], [246, "q12"], [300, "q13"], [336, "q14"], [QT + .8, "b01"], [QT + 3.8, "b02"]];
    const at = (k, u, id) => E.push([QT + BT + RP.tS[k] + u, id]);
    at(0, 3, "s1a"); at(0, 8, "s1b"); at(0, 14, "s1c"); at(0, 19, "s1d"); at(1, 3, "s2a"); at(1, 11, "s2b"); at(2, 4, "s3a"); at(2, 12, "s3b"); at(3, 3, "s4a"); at(3, 20.5, "s4b"); at(3, 26, "ouch");
    at(4, 3, "s5a"); at(4, 17, "s5b"); at(5, 4, "s6a"); at(5, 16, "s6b"); at(6, 3, "s7a"); at(6, 17, "s7b"); at(7, 3, "s8a"); at(7, 14, "s8b"); at(7, 30, "s8c"); at(7, 37, "s8d"); at(7, 41, "s8e"); E.push([TOT - 5, "end"]);
    return E.sort((a, b) => a[0] - b[0]);
}

// ---------- なげる チーズの まと ----------
function makeTargets(){
    const T = [], sbk = RP.sb, add = (k, f, lat, y, kind, ex) => { const s = sbk[k] + f * (sbk[k + 1] - sbk[k]), p = pp(s, lat, y); T.push(Object.assign({k, s, x: p.x, y: p.y, z: p.z, yaw: p.yaw, kind, hit: 0, cool: 0, id: T.length, lat}, ex || {})); };
    [[.3, 3.5, 3.4], [.5, -3.5, 3.8], [.7, 3.2, 3.2]].forEach(([f, l, y]) => add(0, f, l, y, "bal"));
    [.14, .22, .32, .58, .66, .76, .86].forEach((f, i) => add(1, f, (i % 2 ? -1 : 1) * 4.9, 1.7, "paw", {side: i % 2 ? -1 : 1}));
    for(let i = 0; i < 6; i++){ const a = i / 6 * TAU + .3, c = SCN[2].cx + SX, z0 = HALL.zb + 14 + SZ; T.push({k: 2, kind: "bal", x: c + Math.cos(a) * 22, y: 3.4 + (i % 2), z: z0 + Math.sin(a) * 22, yaw: 0, hit: 0, cool: 0, id: T.length}); }
    [[.15, 4, 2.6], [.28, -4, 2.2], [.42, 4.4, 2.8], [.78, -4.2, 2.4]].forEach(([f, l, y]) => add(3, f, l, y, "bal"));
    for(let i = 0; i < 6; i++) T.push({k: 4, kind: "crate", belt: i % 3, off: i * 11.5, x: 0, y: 1.0, z: SZ + HALL.zb + (i % 3 - 1) * 22, yaw: 0, hit: 0, cool: 0, id: T.length});
    for(let i = 0; i < 5; i++) add(5, .12 + i * .17, (i % 2 ? -1 : 1) * 5.4, 1.4, "bomb");
    for(let i = 0; i < 8; i++) add(6, .08 + i * .1, (i % 2 ? -1 : 1) * (2.8 + (i % 3)), .5, "duck");
    for(let i = 0; i < 8; i++) add(7, .08 + i * .09, (i % 2 ? -1 : 1) * (3.6 + (i % 3) * 1.4), 2.6 + (i % 3) * .7, "bal");
    return T;
}
function tpos(tg, t, R){
    if(tg.kind === "paw"){ const ext = .5 + .5 * Math.sin(t * 1.4 + tg.id * 1.9), e = (tg.hit && t < tg.cool) ? Math.max(0, ext - Math.min(1, (t - tg.hit) * 3)) : ext, p = pp(tg.s, tg.side * (4.9 - 3.4 * e), 1.7); return {x: p.x, y: p.y, z: p.z, yaw: Math.PI / 2 * tg.side - p.yaw, vis: e > .12, ok: e > .35 && !(tg.hit && t < tg.cool)}; }
    if(tg.kind === "crate"){ const x = SX + SCN[4].cx + 38 - ((tg.off + t * 2.4) % 76); return {x, y: tg.y, z: tg.z + (tg.belt === 1 ? 0 : 0), yaw: 0, vis: !tg.hit || t < tg.hit + .9, ok: !tg.hit}; }
    const bob = tg.kind === "duck" ? Math.sin(t * 2 + tg.id) * .12 : tg.kind === "bal" ? Math.sin(t * 1.5 + tg.id) * .25 : 0;
    return {x: tg.x, y: tg.y + bob, z: tg.z, yaw: tg.yaw, vis: !tg.hit || t < tg.hit + .9, ok: !tg.hit};
}

// ---------- モジュール ----------
export const cheese = {
    build(K){ ensure(); buildModels(K); buildStage(K, RP.P); buildPark(K, BOARD); },
    init(g, R, a){
        ensure(); R.sb = RP.sb; R.targets = makeTargets(); R.shots = []; R.fx = []; R.score = 0; R.hits = 0; R.cap = null; R.ev = events(); R.evi = 0; R.cheerT = -99; R.boarded = false; R.fin = 0; R.win = false; R.V = null; R.thr = 0; R.autoT = 0; R.skipReq = false; R.fast = false; R.w0 = started() ? Math.max(5, waitMinutes("cheese")) : 25;
        R.A.music = "cheeseq"; R.A.env = "cheeseq"; g.lookYaw = 0; g.lookPitch = 0;
        const r = root(); clearRoot(); bodyOn("cheese", true);
        R.h = {top: el("div", "xh", "", "left:10px;top:8px;font-size:clamp(12px,2.6vw,17px)"), cap: el("div", "xh", "", "left:50%;transform:translateX(-50%);bottom:19%;width:min(92vw,720px);text-align:center;font-size:clamp(15px,3.4vw,24px);line-height:1.4"),
            cross: el("div", "xh", "＋", "left:50%;top:50%;transform:translate(-50%,-50%);font-size:30px;opacity:.75"), hint: el("div", "xh", "", "left:10px;bottom:9%;font-size:clamp(11px,2.4vw,14px)"), skip: el("div", "xbtn", "⏩ ファストパス", "right:12px;bottom:25%;width:auto;padding:6px 14px;font-size:clamp(13px,2.8vw,17px);height:auto")};
        R.h.skip.addEventListener("click", () => { R.skipReq = true; }); R.h.skip.addEventListener("touchstart", (e) => { R.skipReq = true; e.preventDefault(); }, {passive: false});
        for(const k of ["top", "cap", "cross", "hint", "skip"]) r.appendChild(R.h[k]);
        R.h.cross.style.display = "none";
        g.ui.toast("🧀 チーズいせき  いまの まち時間 約" + R.w0 + "ふん（ここでは 6ふんに ぎゅっと ちぢめているよ）", 4200);
        if(R.auto){ R.t = QT - .5; R.fast = true; }
    },
    update(g, R, dt, inp){
        const t = R.t, T = g.t;
        if(R.skipReq && t < QT - 1){ R.skipReq = false; R.fast = true; R.t = QT - .01; return; }
        R.skipReq = false;
        // ---- イベント（セリフ）----
        while(R.evi < R.ev.length && R.ev[R.evi][0] <= t){ const e = R.ev[R.evi++]; if(t - e[0] < 3) say(g, R, e[1]); }
        // ---- じょうたい ----
        if(t < QT){
            R.A.music = "cheeseq"; R.A.env = "cheeseq"; R.sq = qs(t);
            if(inp.act && t - R.cheerT > 1.2){ R.cheerT = t; g.sfx("fan"); g.ui.toast("🎉 みんなで かんせい！", 1400); if(R.cap === null || T > R.cap.until) say(g, R, ["h1", "h2", "h3", "h4"][(R.hits++) % 4]); }
        } else {
            if(!R.boarded){ R.boarded = true; record(g.sv, "cheese", R.w0, R.fast); g.save(); g.ui.fade(); g.ui.toast("🚙 ジープに のりこんだ！  E：チーズを なげて しかけを ねらえ！", 3800); g.sfx("start"); g.lookYaw = 0; g.lookPitch = 0; }
            R.A.music = "cheeseride"; R.A.env = "cheese"; R.V = rideState(R, t);
            // ---- チーズを なげる ----
            R.autoT -= dt;
            let go = !!inp.act, need = false; if(R.auto && R.autoT <= 0){ go = true; need = true; }   // オートは「ねらえる まとが ある ときだけ」なげる（むだな チーズを とばさない）
            if(go && !R.fin && t > QT + BT && t - R.thr > .25){ if(throwCheese(g, R, t, need)){ R.thr = t; if(need) R.autoT = 1.7; } else if(need) R.autoT = .35; }
            R.shots = R.shots.filter((s) => t - s.t0 < s.d + .05);
            R.fx = R.fx.filter((f) => t - f.t < 1.2);
            if(t >= TOT && !R.fin){ R.fin = 1; R.win = true; R.finT = t; R.thr = t; g.sv.best_cheese = Math.max(g.sv.best_cheese || 0, R.score); let m = "🎉 ゴール！ スコア " + R.score + "てん"; if(R.score >= 2000){ g.sv.coins += 30; m += "  すごい！ +30コイン"; } g.ui.toast(m, 5200); g.sfx("gold"); }
            if(R.fin && t - R.finT > 3.2) g.endRide(true, true);
        }
        // ---- がめん ----
        const h = R.h, set = (e, v) => { if(e._v !== v){ e._v = v; e.innerHTML = v; } };
        if(t < QT){ const m = Math.max(0, Math.ceil(R.w0 * (1 - t / QT))); set(h.top, "<span class='xpill'>🧀 キューライン　あと 約 <b>" + m + "</b> ふん</span>"); set(h.hint, "<span class='xpill'>E：みんなで かんせい！　ドラッグ：みまわす</span>"); h.skip.style.display = ""; h.cross.style.display = "none"; }
        else { const k = R.V.k; set(h.top, "<span class='xpill'>🧀 スコア <b>" + R.score + "</b>　" + (R.V.k >= 0 ? (k + 1) + "/8 " + SCN[k].n : "しゅっぱつ！") + "</span>"); set(h.hint, "<span class='xpill'>E：チーズを なげる　ドラッグ：みまわす</span>"); h.skip.style.display = "none"; h.cross.style.display = ""; }
        if(R.cap && T < R.cap.until) set(h.cap, "<span style='display:inline-block;padding:6px 14px;border-radius:14px;background:rgba(20,14,40,.72);border:2px solid " + WCOL[R.cap.who] + "'><b style='color:" + WCOL[R.cap.who] + "'>" + WHO[R.cap.who] + "</b>　" + R.cap.text + "</span>"); else set(h.cap, "");
    },
    camera(g, R){
        const t = R.t;
        if(t < QT){ ensure(); const s = R.sq !== undefined ? R.sq : qs(t), c = QP.at(clamp(s, 0, QP.total - .01)), yaw = hdg(QP, clamp(s, 0, QP.total - .01), 1.4), mv = qs(t + .15) - s > .002; return {eye: [c[0], 1.62 + (mv ? Math.sin(g.t * 9) * .03 : 0), c[2]], yaw: yaw + g.lookYaw, pitch: g.lookPitch * .8, fov: 72}; }
        const V = R.V || rideState(R, t), yj = V.yaw + V.psi, ex = V.x - Math.sin(yj) * .45, ez = V.z - Math.cos(yj) * .45;
        return {eye: [ex, V.y + 2.15 + Math.sin(g.t * 11) * .02 * V.v, ez], yaw: yj + g.lookYaw, pitch: V.pitch * .6 - .07 + g.lookPitch + (V.shake ? Math.sin(g.t * 40) * .012 : 0), fov: V.fov, roll: V.roll};
    },
    dyn(g, R, D){
        const T = g.t, t = R.t; ensure();
        const jeepAt = (V, yj) => { D.push({m: "ch_jeep", x: V.x, y: V.y + .05 + Math.sin(T * 12) * .015 * V.v, z: V.z, yaw: yj}); };
        const seat = (m, V, yj, side, spk) => { const fx = Math.sin(yj), fz = Math.cos(yj), rx = -Math.cos(yj), rz = Math.sin(yj), lx = side * .64, lz = .95, bob = spk ? Math.abs(Math.sin(T * 9)) * .08 : Math.sin(T * 3 + side) * .015;
            { const e = {m, x: V.x + fx * lz + rx * -lx, y: V.y + .6 + bob, z: V.z + fz * lz + rz * -lx, yaw: yj + (spk ? -side * .7 : Math.sin(T * 1.3 + side) * .15), sx: .75, sy: .75, sz: .75}, sn = m + "S"; D.push(spriteReady(sn) ? {m, p: sn, x: e.x, y: V.y + .78 + bob, z: e.z, yaw: e.yaw, ss: .75} : e); } };
        const spk = (w) => R.cap && T < R.cap.until && R.cap.who === w;
        if(t < QT){
            // ---- キュー会場：ならんでいる ひとたち ----
            const s = R.sq !== undefined ? R.sq : qs(t), cam = QP.at(clamp(s, 0, QP.total - .01)), mv = qs(t + .15) - s > .002, cheer = clamp(1 - (t - R.cheerT) / 1.1, 0, 1);
            for(let i = 0, off = -26; off < QP.total - Q0 + 6; i++, off += 2.3){
                const ahead = off > 2.2 && off < 6.8; if(ahead || Math.abs(off) < 1.6) continue;
                const sP = s + off; if(sP < 0 || sP > QP.total - 1.5) continue; const lat = ((i * 7) % 5 - 2) * .35, p = qp(sP, lat);
                if(Math.hypot(p.x - cam[0], p.z - cam[2]) > 40) continue;
                const m = "guest" + (i % 6), jump = cheer * Math.abs(Math.sin(T * 12 + i)) * .5, bob = mv ? Math.abs(Math.sin(T * 7 + i)) * .06 : Math.sin(T * 2 + i) * .015;
                D.push({m, p: m, x: p.x, y: bob + jump, z: p.z, yaw: p.yaw + (i % 4 === 0 ? .9 : 0)});
            }
            // ガクと ミミ：まえで おしゃべり（ライバルだけど なかよし）
            for(const [w, off, side] of [["gaku", 3.6, 1], ["mimi", 5.0, -1]]){ const p = qp(Math.min(s + off, QP.total - 3 - (side > 0 ? 0 : 1.2)), 0), sp = spk(w); D.push(SPR({m: w === "gaku" ? "ch_boy" : "ch_girl", x: p.x, y: .43 + (sp ? Math.abs(Math.sin(T * 9)) * .1 : 0) + cheer * Math.abs(Math.sin(T * 12)) * .4, z: p.z, yaw: p.yaw + Math.PI + (sp ? .5 * side : 0) + (w === "mimi" ? .4 : -.4), sx: .85, sy: .85, sz: .85}, w === "gaku" ? "ch_boy" : "ch_girl", .5)); }
            // のこり じかんの ひょうじ
            { const m = Math.max(0, Math.ceil(R.w0 * (1 - t / QT))), d1 = (m / 10) | 0, d0 = m % 10, zc = SZ + HALL.zb + 7.1; if(d1 > 0) D.push({m: "ch_d" + d1, x: SX - 1.3, y: 3.6, z: zc, yaw: Math.PI, sx: 1.8, sy: 1.8, sz: 1}); D.push({m: "ch_d" + d0, x: SX + (d1 > 0 ? 1.0 : 0), y: 3.6, z: zc, yaw: Math.PI, sx: 1.8, sy: 1.8, sz: 1});
                D.push({s: "glow", x: SX, y: 4.7, z: zc - .3, w: 7, h: 3.4, c: [1, .85, .3], a: .25}); }
            // ねこと ねずみの おいかけっこ（かべぎわを はしる）
            for(const [a, b, rev] of [[240, 256, 1], [284, 298, -1]]) if(t > a && t < b){ const u = (t - a) / (b - a), x = SX + (rev > 0 ? 25 - 50 * u : -25 + 50 * u), z = SZ + HALL.zb + 6.2, gal = Math.abs(Math.sin(T * 14)) * .25, face = rev > 0 ? -Math.PI / 2 : Math.PI / 2;
                D.push(SPR({m: "ch_mouse", x, y: gal, z, yaw: face, sx: 1.1, sy: 1.1, sz: 1.1}, "ch_mouse", 0)); const cu = clamp(u - .09 * rev, 0, 1), cx = SX + (rev > 0 ? 25 - 50 * cu : -25 + 50 * cu); D.push(SPR({m: "ch_cat", x: cx, y: gal, z, yaw: face, sx: .5, sy: .5, sz: .5}, "ch_cat", 0));
                for(let q = 0; q < 3; q++) D.push({s: "glow", x: cx - face * .4 * (q + 1) * -1, y: .5, z, w: 1.4, h: .7, c: [1, 1, 1], a: .3 - q * .08}); }
            // ステーションの ジープ
            const st = pp(0, 0, 0), yj = st.yaw; jeepAt({x: st.x, y: st.y, z: st.z, v: 0}, yj);
            for(const f of R.fx || []){} // （きほん：なし）
            if(cheer > 0) for(let q = 0; q < 14; q++){ const a = q / 14 * TAU + T, rr = 1.5 + (1 - cheer) * 4; D.push({s: "star", x: cam[0] + Math.sin(a) * rr + Math.sin(yawOf(QP, s)) * 3, y: 1.6 + (1 - cheer) * 3 + Math.sin(a * 3) * .5, z: cam[2] + Math.cos(a) * rr + Math.cos(yawOf(QP, s)) * 3, w: .5, h: .5, c: [1, .85, .4], a: cheer}); }
            return;
        }
        const V = R.V || rideState(R, t), yj = V.yaw + V.psi;
        jeepAt(V, yj); seat("ch_boy", V, yj, 1, spk("gaku")); seat("ch_girl", V, yj, -1, spk("mimi"));
        gags(g, R, D, V, T);
        // まと
        for(const tg of R.targets){ const p = tpos(tg, t, R); if(!p.vis) continue; const dx = p.x - V.x, dz = p.z - V.z; if(dx * dx + dz * dz > 1600) continue; const hit = tg.hit && t >= tg.hit, hu = hit ? clamp((t - tg.hit) / .9, 0, 1) : 0;
            if(tg.kind === "paw"){ D.push(SPR({m: "ch_paw", x: p.x, y: p.y, z: p.z, yaw: p.yaw, sx: 1.3, sy: 1.3, sz: 1.3}, "ch_paw", "c")); }
            else if(tg.kind === "bal") D.push(SPR({m: "ch_bal", x: p.x, y: p.y - 2 * hu, z: p.z, yaw: T, sx: 1.3 * (1 - hu), sy: 1.3 * (1 - hu), sz: 1.3 * (1 - hu)}, "ch_bal" + (R.targets.indexOf(tg) % 3), "c"));
            else if(tg.kind === "bomb") D.push(SPR({m: "ch_bomb", x: p.x, y: p.y, z: p.z, yaw: p.yaw, sx: hit ? 1 + hu * 2 : 1.4, sy: hit ? 1 + hu * 2 : 1.4, sz: hit ? 1 + hu * 2 : 1.4}, "ch_bomb", 0)), D.push({s: "glow", x: p.x, y: p.y + 1.4, z: p.z, w: .9 + Math.sin(T * 25) * .2, h: .9, c: [1, .6, .2], a: .9});
            else if(tg.kind === "duck") D.push(SPR({m: "ch_duck", x: p.x, y: p.y - hu * .6, z: p.z, yaw: p.yaw + hu * 6, sx: 1.5, sy: 1.5 * (1 - hu * .9), sz: 1.5}, "ch_duck", 0));
            else if(tg.kind === "crate") D.push({m: "ch_crate", x: p.x, y: p.y + hu * 2, z: p.z, yaw: hu * 6, sx: 1.3 * (1 - hu), sy: 1.3 * (1 - hu), sz: 1.3 * (1 - hu)});
        }
        for(const s of R.shots){ const u = (t - s.t0) / s.d; if(u < 0 || u > 1) continue; D.push({m: "ch_cheese", x: lerp(s.a[0], s.b[0], u), y: lerp(s.a[1], s.b[1], u) + Math.sin(u * Math.PI) * 1.2, z: lerp(s.a[2], s.b[2], u), yaw: T * 5, rx: T * 6, sx: .5, sy: .5, sz: .5}); }
        for(const f of R.fx){ const u = (t - f.t) / .9; if(u < 0 || u > 1) continue; for(let q = 0; q < 8; q++){ const a = q / 8 * TAU + f.id; D.push({s: "star", x: f.x + Math.cos(a) * u * 2.2, y: f.y + Math.sin(a * 2) * .6 + u * 1.2, z: f.z + Math.sin(a) * u * 2.2, w: .7 * (1 - u), h: .7 * (1 - u), c: f.c, a: 1 - u}); } }
    },
    hud(R){ return R.t < QT ? "キューライン　あと 約 " + Math.max(0, Math.ceil(R.w0 * (1 - R.t / QT))) + " ふん" : "スコア " + R.score; },
    end(g, R, ok){ clearRoot(); bodyOn("cheese", false); if(R.voices) for(const a of R.voices){ try{ a.pause(); }catch(_e){} } },
    // ---- 公園を あるいて いる ときの ならび場（ひとが ならんでいる ふんいき）----
    walkDyn(g, D){
        const T = g.t, dx = g.x - BOARD.x, dz = g.z - BOARD.z, dist = Math.hypot(dx, dz); if(dist > 140) return;
        if(dist < 15){ if(!cheese._near){ cheese._near = true; g.ui.toast("🧀 チーズいせきの ドタバタ大ぼうけん  いまの まち時間 約" + Math.max(5, waitMinutes("cheese")) + "ふん", 3600); } } else if(dist > 24) cheese._near = false;
        const segs = []; let L = 0; for(let i = 0; i < OUTQ.length - 1; i++){ const a = OUTQ[i], b = OUTQ[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l, L]); L += l; }
        const at = (s) => { for(const [a, b, l, s0] of segs) if(s <= s0 + l){ const u = (s - s0) / l; return {x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), yaw: Math.atan2(b[0] - a[0], b[1] - a[1])}; } return null; };
        const wq = started() ? waitMinutes("cheese") : 25, step = 1.55 + (1 - Math.min(1, wq / 70)) * 2.6, per = 16, sh = (Math.floor(T / per) + ease(clamp((T % per - 11) / 3, 0, 1))) * step % step;
        for(let i = 0, s = -sh; s < L; i++, s += step){ if(s < 0) continue; const p = at(s); if(!p) continue; const m = "guest" + (i % 6), wave = (i % 9 === 4), lat = ((i * 5) % 3 - 1) * .35, nx = Math.cos(p.yaw) * lat, nz = -Math.sin(p.yaw) * lat;
            D.push({m, p: m, x: p.x + nx, y: Math.abs(Math.sin(T * 2.2 + i)) * (wave ? .12 : .02), z: p.z + nz, yaw: p.yaw + (i % 5 === 0 ? .8 : 0)}); }
        // いせきの ゲートの うえの ねこと、あなから のぞく ねずみ
        if(!propReady("prop/cheese_gate")) D.push(SPR({m: "ch_cat", x: -95, y: 11.6, z: 62.8, yaw: Math.PI / 2 + Math.sin(T * 1.2) * .5, sx: .75, sy: .75 + Math.sin(T * 3) * .02, sz: .75}, "ch_cat", 0));
        if(propReady("prop/cheese_sign")){   // かんばんの パネルに 「いまの まち時間」を すうじで かさねる
            const w = started() ? Math.min(199, Math.max(0, waitMinutes("cheese"))) : 25, ds = String(w).split(""), sc = ds.length > 2 ? .55 : .8, adv = .62 * sc * 1.45, nx = Math.sin(SIGN.yaw), nz = Math.cos(SIGN.yaw), rx = Math.cos(SIGN.yaw), rz = -Math.sin(SIGN.yaw), by = SIGN.py - (1.38 * sc) / 2;
            ds.forEach((c, i) => { const o = (i - (ds.length - 1) / 2) * adv; D.push({m: "ch_d" + c, x: SIGN.x + rx * o + nx * .16, y: by, z: SIGN.z + rz * o + nz * .16, yaw: SIGN.yaw, sx: sc, sy: sc, sz: 1}); });
            D.push({s: "glow", x: SIGN.x + nx * .3, y: SIGN.py + .4, z: SIGN.z + nz * .3, w: 2.8, h: 1.6, c: [1, .85, .3], a: .22});
        }
        { const u = (Math.sin(T * 1.1) + 1) / 2; D.push(SPR({m: "ch_mouse", x: -93.5, y: 0, z: 66.2 - u * 1.2, yaw: -Math.PI / 4, sx: 1.2, sy: 1.2, sz: 1.2}, "ch_mouse", 0)); }
    }
};

const yawOf = (P, s) => hdg(P, clamp(s, 0, P.total - .01), 1.2);

// ---------- ライドの じょうたい ----------
function rideState(R, t){
    const rt = t - QT - BT; let k = -1, u = 0, tau = 0, s = 0;
    if(rt >= 0){ k = SCN.length - 1; for(let i = 0; i < SCN.length; i++) if(rt < RP.tS[i] + SCN[i].d){ k = i; break; } u = Math.min(rt - RP.tS[k], SCN[k].d); tau = clamp(u / SCN[k].d, 0, 1); s = RP.sb[k] + (RP.sb[k + 1] - RP.sb[k]) * prog(k, tau); }
    const P = RP.P, c = P.at(s), yaw = hdg(P, s, 1.0), yaw2 = hdg(P, s + 2.5, 1.0), pitch = Math.atan2(P.at(Math.min(P.total - .01, s + 1.5))[1] - P.at(Math.max(0, s - 1.5))[1], 3);
    const v = rt < 0 ? 0 : clamp((P.at(Math.min(P.total - .01, s + .4))[0] !== c[0] || P.at(Math.min(P.total - .01, s + .4))[2] !== c[2]) ? 1 : 0, 0, 1);
    let psi = 0, roll = 0, fov = 70, yOff = 0, shake = false;
    const sn = Math.sin, E = ease;
    switch(k){
        case 0: psi = .12 * sn(tau * TAU * 3) * (1 - tau * .3); shake = u > 4 && u < 28; roll = .04 * sn(u * 3); fov = 70 + 8 * clamp(sn(tau * Math.PI), 0, 1); break;
        case 1: psi = .5 * sn(tau * Math.PI * 5); break;
        case 2: psi = 2 * Math.PI * E(tau); roll = .06 * sn(u * 1.3); fov = 74; break;
        case 3: psi = .22 * sn(tau * Math.PI * 4) + 2 * Math.PI * E((tau - .66) / .2); { const uh = SCN[3].d * .5, uf = uh + 1.3; if(u > uf) yOff = -Math.min(9, 7 * (u - uf) * (u - uf)); if(tau > .72) yOff = -9 * (1 - E((tau - .72) / .2)); shake = u > uf && u < uf + 1.4; } break;
        case 4: psi = .6 * sn(tau * Math.PI * 6); break;
        case 5: psi = .15 * sn(tau * TAU * 4) + 2 * Math.PI * E((tau - .35) / .25) + 2 * Math.PI * E((tau - .7) / .2); roll = .22 * sn(tau * TAU * 3); fov = 76 + 14 * clamp(-pitch * 3, 0, 1); shake = true; break;
        case 6: psi = .4 * sn(tau * Math.PI * 4) + 2 * Math.PI * E((tau - .45) / .3); roll = .08 * sn(u); break;
        case 7: psi = .3 * sn(tau * Math.PI * 3) + 2 * Math.PI * E((tau - .6) / .2); break;
    }
    return {k, u, tau, s, x: c[0], y: c[1] + yOff, z: c[2], yaw, yaw2, pitch, psi, roll, fov, yOff, v, shake, rt};
}

// ---------- チーズを なげる ----------
function throwCheese(g, R, t, need){
    const V = R.V, cam = cheese.camera(g, R), fy = cam.yaw, fp = cam.pitch, fx = Math.sin(fy), fz = Math.cos(fy);
    let best = null, bd = .42;
    for(const tg of R.targets){ const p = tpos(tg, t, R); if(!p.vis || !p.ok) continue; const dx = p.x - cam.eye[0], dz = p.z - cam.eye[2], dist = Math.hypot(dx, dz); if(dist > 30 || dist < 2) continue;
        const ang = Math.abs(wrapPi(Math.atan2(dx, dz) - fy)), pit = Math.abs(Math.atan2(p.y - cam.eye[1], dist) - (-fp)); if(ang < bd && pit < .6){ bd = ang; best = {tg, p}; } }
    const a = [cam.eye[0] + fx * .7, cam.eye[1] - .35, cam.eye[2] + fz * .7];
    if(!best && need) return false;
    if(!best){ R.shots.push({t0: t, d: .5, a, b: [cam.eye[0] + fx * 14, cam.eye[1] - 1.2 - fp * 6, cam.eye[2] + fz * 14]}); g.sfx("shot"); return true; }
    const {tg, p} = best, d = clamp(Math.hypot(p.x - a[0], p.z - a[2]) / 30, .22, .6); R.shots.push({t0: t, d, a, b: [p.x, p.y, p.z]}); g.sfx("shot"); return true;
    tg.hit = t + d; tg.cool = t + d + 3; R.score += 100; R.hits++; R.fx.push({t: t + d, x: p.x, y: p.y, z: p.z, id: tg.id, c: tg.kind === "bomb" ? [1, .6, .3] : tg.kind === "bal" ? [1, .5, .8] : [1, .9, .4]});
    setTimeout(() => { try{ g.sfx(tg.kind === "bomb" ? "drop" : "hit"); }catch(_e){} }, d * 1000);
    if(R.hits % 4 === 0 && (!R.cap || g.t > R.cap.until)) say(g, R, ["h1", "h2", "h3", "h4"][(R.hits / 4 | 0) % 4]);
}

// ---------- 各シーンの しかけ（ねこ・ねずみ・おじゃま）----------
const Cat = (D, x, y, z, yaw, sc, soot, sq) => D.push(SPR({m: soot ? "ch_cat_soot" : "ch_cat", x, y, z, yaw, sx: sc * (sq ? sq[0] : 1), sy: sc * (sq ? sq[1] : 1), sz: sc * (sq ? sq[0] : 1)}, soot ? "ch_cat_soot" : "ch_cat", 0));
const Mouse = (D, x, y, z, yaw, sc) => D.push(SPR({m: "ch_mouse", x, y, z, yaw, sx: sc, sy: sc, sz: sc}, "ch_mouse", 0));
const stars = (D, x, y, z, T, n, r, sz) => { for(let i = 0; i < n; i++){ const a = T * 3 + i / n * TAU; D.push({s: "star", x: x + Math.cos(a) * r, y: y + Math.sin(a * 2) * .15, z: z + Math.sin(a) * r, w: sz || .5, h: sz || .5, c: [1, .9, .4], a: 1}); } };
function gags(g, R, D, V, T){
    const k = V.k, u = V.u, sb = RP.sb[k], sl = RP.sb[k + 1] - RP.sb[k], sv = V.s, tau = V.tau; if(k < 0) return;
    if(k === 0){   // ころがる おおきな チーズに おいかけられる！
        // うしろから ころがってきて、ジープの よこを ぬけて、まえの ゲートに ぶつかって ばらばら！
        const crashS = sb + sl - 7, gap = lerp(46, -16, ease(u / 22)), sw = sv - gap, e = Math.max(0, (sw - crashS) / 3.3);
        if(e <= 0){ const lat = 4.4 * Math.exp(-Math.pow(gap / 8, 2)), w = pp(Math.max(0, sw), lat, 2.3); D.push(SPR({m: "ch_wheel", x: w.x, y: w.y, z: w.z, yaw: w.yaw, rx: sw / 2.3}, "ch_wheel", "c"));
            Cat(D, w.x, w.y + 4.7 + Math.abs(Math.sin(T * 14)) * .15, w.z, w.yaw, .55, false);   // わっかの うえで あしを ばたばた
            if(u > 14 && u < 26){ const q = pp(sv + 11, 3.6, 0); Mouse(D, q.x, Math.abs(Math.sin(T * 13)) * .25, q.z, q.yaw, 1.1); }
        } else { const w = pp(crashS, 0, 1.8); if(e < 4){ D.push({s: "glow", x: w.x, y: w.y + 1, z: w.z, w: 4 + e * 10, h: 4 + e * 10, c: [1, .8, .3], a: Math.max(0, .9 - e / 1.6)}); for(let i = 0; i < 8; i++){ const a = i / 8 * TAU; D.push({m: "ch_chunk", x: w.x + Math.cos(a) * e * 4, y: w.y + 1 + e * 4 - e * e * 4, z: w.z + Math.sin(a) * e * 4, yaw: a + T * 4, rx: T * 6, sx: 1.4, sy: 1.4, sz: 1.4}); } }
            const c = pp(crashS - 2, 5.5, 0); Cat(D, c.x, 0, c.z, c.yaw + Math.PI * .6, .55, true); stars(D, c.x, 1.9, c.z, T, 4, .6); }
    } else if(k === 1){   // ねこの おおきな かおが あなから！
        for(let i = 0; i < 4; i++){ const side = i % 2 ? -1 : 1, f = .08 + i * .22, p = pp(sb + f * sl, side * lerp(6.6, 5.2, (Math.sin(T * 1.7 + i * 2) + 1) / 2), 1.2); Mouse(D, p.x, p.y, p.z, p.yaw + side * 1.4, 1.0); }
        if(u > 24){ const p = pp(sb + sl - 4, 0, 3.6), e = ease((u - 24) / 3); Cat(D, p.x, p.y - 2 * (1 - e), p.z, p.yaw + Math.PI, 1.9, false); }
        if(u > 18 && u < 24){ const p = pp(sv + 7, Math.sin(T * 3) * 2.2, 1.9), e = ease(Math.min(1, (u - 18) / 1.2)) * (1 - ease((u - 22.5) / 1.2)); D.push(SPR({m: "ch_paw", x: p.x, y: p.y, z: p.z, yaw: p.yaw + Math.PI, sx: 2.2 * e, sy: 2.2 * e, sz: 2.2 * e}, "ch_paw", "c")); }
    } else if(k === 2){   // ぐるぐる！ まんなかの おおきな ケーキで ねこが めを まわす
        const c = [SX + SCN[2].cx, SZ + HALL.zb + 14]; D.push({m: "ch_merry", x: c[0], y: 0, z: c[1], yaw: T * .9});
        Cat(D, c[0], 5.4, c[1], T * 2.4, .55, false); stars(D, c[0], 7.4, c[1], T, 5, .8);
        for(let i = 0; i < 6; i++){ const a = T * .7 + i / 6 * TAU, r = 8.5; D.push({m: "ch_cup", x: c[0] + Math.cos(a) * r, y: 0, z: c[1] + Math.sin(a) * r, yaw: -a + T * 2, sx: 1.4, sy: 1.4, sz: 1.4}); if(i === 2) Mouse(D, c[0] + Math.cos(a) * r, .9 + Math.abs(Math.sin(T * 5)) * .1, c[1] + Math.sin(a) * r, -a + T * 2, .8); }
        for(let i = 0; i < 36; i++){ const a = i / 36 * TAU + T * .4, r = 9 + (i % 4) * 5; D.push({s: "star", x: c[0] + Math.cos(a) * r, y: 3 + Math.sin(T + i) * 2 + (i % 5), z: c[1] + Math.sin(a) * r, w: .5, h: .5, c: [[1, .5, .8], [.4, .8, 1], [1, .9, .3]][i % 3], a: .8}); }
    } else if(k === 3){   // つりばし：ばらばら！ ねこは そらを はしって…
        const uh = SCN[3].d * .5, uf = uh + 1.3, sh = RP.sb[3] + sl * prog(3, .5);
        for(let i = 0; i < 20; i++){ const sP = sb + 3 + i * (sl - 6) / 19, p = pp(sP, 0, -.1); let y = 0, rot = 0; if(u > uh + .3){ const dd = Math.abs(sP - sh); if(dd < 9){ const e = Math.max(0, u - (uh + .3) - dd * .06); y = -e * e * 9; rot = e * 2; } }
            if(u > uh + 2 && sP > sh - 12 && sP < sh + 12 && false) continue; D.push({m: "ch_plank", x: p.x, y: p.y + y, z: p.z, yaw: p.yaw + Math.PI / 2, rx: rot * .5, sx: 1, sy: 1, sz: 1}); }
        { const cs = sh + 9, p = pp(cs, 0, 0), fall = u > uf + .6 ? Math.pow(u - uf - .6, 2) * 9 : 0; if(u < uh + 8 && fall < 30) Cat(D, p.x, p.y - fall, p.z, p.yaw + Math.PI, .6, false, null); if(u > uf - .5 && u < uf + .9) stars(D, p.x, p.y + 1.8, p.z, T, 3, .5); }   // そらを はしって いたけど…
        if(u > uh && u < uh + 6){ const p = pp(sv + 4, 0, 0); } if(V.yOff < -.5 && V.yOff > -8.9){ D.push({m: "ch_cheese", x: V.x, y: V.y - 1.2, z: V.z, yaw: V.yaw, sx: 5, sy: 1, sz: 5}); }
        { const p = pp(sb + .3 * sl, 3.4, 1.0); Mouse(D, p.x, p.y + Math.abs(Math.sin(T * 3)) * .15, p.z, p.yaw + 1.2, 1.2); }
    } else if(k === 4){   // ねずみの ひみつこうじょう：ハンマーで ぺしゃんこ → ぽん！
        for(let i = 0; i < 4; i++){ const p = pp(sb + (.12 + i * .22) * sl, (i % 2 ? -1 : 1) * 4.6, 5); D.push({m: "ch_gear", x: p.x, y: p.y, z: p.z, yaw: p.yaw + Math.PI / 2, rx: T * (i % 2 ? -1 : 1) * .9, sx: 1.4, sy: 1.4, sz: 1.4}); }
        for(let i = 0; i < 3; i++){ const p = pp(sb + (.2 + i * .28) * sl, 0, 9.4); D.push({m: "ch_hammer", x: p.x, y: p.y, z: p.z, yaw: p.yaw, rx: Math.sin(T * 2 + i * 1.6) * .9, sx: 1.3, sy: 1.3, sz: 1.3}); }
        { const hs = RP.sb[4] + sl * prog(4, .4), p = pp(hs + 7, 0, 0), uu = u - 15.2; let sq = [1, 1]; if(uu > 1.2 && uu < 3.2) sq = [1.7, .14]; else if(uu >= 3.2 && uu < 4.6){ const q = (uu - 3.2) / 1.4; sq = [1.7 - .7 * q, .14 + .86 * q + Math.sin(q * 9) * .18 * (1 - q)]; }
            if(uu > 0) Cat(D, p.x, p.y, p.z, p.yaw + Math.PI, .65, false, sq); if(uu > 1.2 && uu < 1.5){ D.push({m: "ch_pan", x: p.x, y: 2.2, z: p.z, yaw: p.yaw, sx: 1.6, sy: 1.6, sz: 1.6}); } if(uu > 3.2 && uu < 4.6) stars(D, p.x, 2.0, p.z, T, 5, .8); }
        { const p = pp(sb + .3 * sl, 5, .6); Mouse(D, p.x, p.y + Math.abs(Math.sin(T * 6)) * .1, p.z, p.yaw - 1.2, 1.2); }
    } else if(k === 5){   // トロッコ きゅうこうか：ダイナマイトが どっかーん（ぼうさんの はなび）
        if(u < 25){ const p = pp(sv + 10, 0, .3 + Math.abs(Math.sin(T * 9)) * .1); Cat(D, p.x, p.y, p.z, p.yaw + Math.PI * .7, .5, false); D.push(SPR({m: "ch_bomb", x: p.x, y: p.y + 1.2, z: p.z, yaw: T, sx: 1.2, sy: 1.2, sz: 1.2}, "ch_bomb", 0)); D.push({s: "glow", x: p.x, y: p.y + 2.2, z: p.z, w: 1 + Math.sin(T * 30) * .3, h: 1, c: [1, .6, .2], a: .9}); }
        else { const e = u - 25, p = pp(sb + sl * .82, 0, 0); if(e < 1.6){ D.push({s: "glow", x: p.x, y: p.y + 2, z: p.z, w: 3 + e * 14, h: 3 + e * 14, c: [1, .7, .3], a: 1 - e / 1.6}); for(let i = 0; i < 24; i++){ const a = i / 24 * TAU; D.push({s: "star", x: p.x + Math.cos(a) * e * 7, y: p.y + 2 + Math.sin(a * 3) * e * 3, z: p.z + Math.sin(a) * e * 7, w: .8 * (1 - e / 1.6), h: .8 * (1 - e / 1.6), c: [[1, .5, .8], [.4, .8, 1], [1, .9, .3]][i % 3], a: 1}); } }
            Cat(D, p.x + e * 2, p.y + 1 + Math.max(0, 4 * e - 2.6 * e * e), p.z, p.yaw + e * 3, .5, true); }
    } else if(k === 6){   // チーズフォンデュの かわ：ねこが うずまきに！
        for(let i = 0; i < 18; i++){ const sP = sb + ((i * 5.7 + T * 1.1) % sl), p = pp(sP, ((i * 37) % 9 - 4.5), .1 + ((T * .6 + i * .37) % 3) * .6); D.push({s: "glow", x: p.x, y: p.y, z: p.z, w: .5 + (i % 3) * .2, h: .5 + (i % 3) * .2, c: [1, .85, .4], a: .55}); }
        { const hs = RP.sb[6] + sl * prog(6, .5), p = pp(hs + 8, 3, .3), sp = u > 19 ? 1 : 0, e = clamp((u - 19) / 4, 0, 1); D.push({m: "ch_cheese", x: p.x, y: .2 + Math.sin(T * 2) * .1, z: p.z, yaw: T * (1 + sp * 8), sx: 3, sy: 1.6, sz: 3}); Cat(D, p.x, .9 - e * .5, p.z, T * (1 + sp * 8), .55 * (1 - e * .4), false); if(sp) stars(D, p.x, 2.5, p.z, T, 4, .7); }
        { const p = pp(sb + .3 * sl, 9, 1); Mouse(D, p.x, p.y, p.z, p.yaw - 1.4, 1.2); }
    } else {   // フィナーレ：みんなで チーズの おまつり
        const base = [SX + SCN[7].cx - 44, SZ + HALL.zb];
        Cat(D, base[0] + 5, Math.abs(Math.sin(T * 5)) * .4, base[1] + 3, -Math.PI * .7, .8, false); Mouse(D, base[0] + 5, .6 + Math.abs(Math.sin(T * 5 + 1)) * .4, base[1] - 3, -Math.PI * .3, 1.6); D.push(SPR({m: "ch_wheel", x: base[0] + 5, y: 1.6, z: base[1], yaw: 0, rx: T, sx: .45, sy: .45, sz: .45}, "ch_wheel", "c"));
        for(let i = 0; i < 40; i++){ const a = (i * 53) % 100 / 100 * TAU, r = 3 + (i * 7) % 11; D.push({s: "star", x: V.x + Math.cos(a) * r, y: 11 - ((T * 1.4 + i * .73) % 11), z: V.z + Math.sin(a) * r - 4, w: .45, h: .45, c: [[1, .5, .8], [.4, .8, 1], [1, .9, .3], [.6, 1, .6]][i % 4], a: .9}); }
        for(let i = 0; i < 4; i++){ const e = (T * .5 + i * .27) % 1, a = i * 1.7, p = pp(sb + (.25 + i * .18) * sl, (i % 2 ? -1 : 1) * 10, 9 + Math.sin(a) * 2); for(let q = 0; q < 10; q++){ const b = q / 10 * TAU; D.push({s: "star", x: p.x + Math.cos(b) * e * 5, y: p.y + Math.sin(b) * e * 5, z: p.z, w: .8 * (1 - e), h: .8 * (1 - e), c: [[1, .6, .3], [.5, .8, 1], [1, .5, .8]][i % 3], a: 1 - e}); } }
        for(const sz of [-1, 1]) for(let i = 0; i < 6; i++){ const p = pp(sb + (.12 + i * .12) * sl, sz * 15 + sz * 0, 1.6 + (i % 2) * 1); const m = "guest" + ((i + (sz > 0 ? 3 : 0)) % 6); D.push({m, p: m, x: p.x, y: p.y + Math.abs(Math.sin(T * 5 + i * 1.3)) * .5, z: p.z, yaw: p.yaw + sz * Math.PI / 2}); }
    }
}
