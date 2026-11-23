// ===== 新アトラクション（ジェット・ワールドツアー／スイーツ・ブラスター／オーロラ・スカイウィング）の のりもの ロジック =====
//  Game から よばれる：coasterInit（のりこみ）／coasterUpdate（いちフレーム）／coasterCamera（カメラ）／stageName（見せる 舞台）
import {trackPath, simBoomerang, simScripted, sample, coasterCam, sstep} from "./df-coaster.js";
import {genTargets, TARGETS, targetPos} from "./df-stages2.js";
import {bootDfWasm} from "./df-wasm.js";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// ---- シューティング判定の C++(WebAssembly) コア（キラキラ・スイーツ・ブラスター）----
// 読みこみが まだ・または 失敗した時は この下の 元のJS実装に 自動で フォールバックする。
const BLASTW = {ready: false};
bootDfWasm().then((M) => {
    BLASTW.mod = M;
    BLASTW.buf = M.cwrap("df_blaster_buf", "number", []);
    BLASTW.pick = M.cwrap("df_blaster_pick", "number", ["number", "number", "number", "number", "number", "number", "number", "number", "number"]);
    BLASTW.ready = true;
}, () => {});
const cache = {};
// 1つの「幕」の データ（レールの みちすじ・時間ごとの いち・まと）。いちど つくったら つかいまわす
export function actData(A){
    if(cache[A.id]) return cache[A.id];
    const path = trackPath(A.track), L = path.total, sp = A.sim(L);
    const tb = (A.simType === "scripted" ? simScripted : simBoomerang)(path, sp);
    return cache[A.id] = {path, L, tb, targets: A.shoot ? genTargets(A, path) : []};
}
export const rideTotal = (a) => a.acts.reduce((t, A) => t + actData(A).tb.dur, 0);

export function coasterInit(g, R){
    Object.assign(R, {ai: -1, score: 0, combo: 0, comboT: 0, hits: 0, shots: 0, bolts: [], fire: 0, hud: "", gfx: {fade: 1, vig: 0}, camOut: null, clackAcc: 0, doneT: 0, before: 0, S: null});
    nextAct(g, R);
}
function nextAct(g, R){
    if(R.A) R.before += R.D.tb.dur;
    R.ai++; if(R.ai >= R.a.acts.length) return false;
    const A = R.A = R.a.acts[R.ai]; R.D = actData(A); R.ct = 0; R.cst = {}; R.ev = {}; R.tgt = R.D.targets.map(() => ({hit: 0})); R.S = sample(R.D.tb, 0); R.lastS = R.S.s; R.bolts = [];
    return true;
}
export const stageName = (g) => (g.mode === "ride" && g.ride && g.ride.A) ? g.ride.A.stage : null;
const mult = (R) => Math.min(3, 1 + Math.floor(R.combo / 5));

export function coasterUpdate(g, dt, inp){
    const R = g.ride; if(!R.A) return; let A = R.A, D = R.D, tb = D.tb;
    R.dt = dt; R.ct += dt;
    if(R.ct >= tb.dur){ if(!nextAct(g, R)){ if(!R.doneT){ R.doneT = g.t; } g.endRide(true); return; } A = R.A; D = R.D; tb = D.tb; g.ui.toast(A.label + "…", 1800); }
    const S = R.S = sample(tb, R.ct), tr = A.track, M = tr.marks, free = !!A.shoot;
    // いべんと（せつめいの ことば）
    A.events.forEach((e, i) => {
        if(R.ev[i]) return; let ok = false;
        if(e.m){ const base = tb.marks[e.m]; if(base === undefined) return; ok = R.ct >= Math.max(.3, base + e.dt); }
        else if(e.at){ const m = M[e.at]; if(m === undefined) return; ok = S.s >= m + e.dt; }
        if(ok){ R.ev[i] = 1; g.ui.toast(e.text, 4200); if(e.m === "launch" && e.dt === .5) g.sfx("drop"); }
    });
    // ターンテーブル（木星：てっぺんで ぐるっと むきを かえる）／スピン（スイーツ）
    let turn = 0; if(A.turntable && tb.marks.top !== undefined) turn = sstep((R.ct - (tb.marks.top + .8)) / 2.6);
    const cc = coasterCam(D.path, tr, S, R.cst, {eye: R.a.eye, turn, t: g.t, dt});
    let yaw = cc.yaw;
    if(A.spins){ for(const sp of A.spins){ const m = M[sp.at]; if(m === undefined) continue; yaw += sp.turns * 2 * Math.PI * sstep((S.s - m) / sp.len) * (S.s < m + sp.len ? 1 : 0); } }
    const cam = R.camOut = {eye: cc.eye, yaw: yaw + g.lookYaw, pitch: cc.pitch + g.lookPitch, roll: cc.roll, fov: cc.fov, G: cc.G, speed: cc.speed, P: cc.P};
    // シューティング
    if(free){
        R.fire = Math.max(0, R.fire - dt); R.comboT -= dt; if(R.comboT <= 0) R.combo = 0;
        if(inp.act && R.fire <= 0 && R.ct > tb.marks.launch - 1 && R.ct < tb.dur - 3){
            R.fire = .16; R.shots++; g.sfx("shot");
            const cp = Math.cos(cam.pitch), d = [Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp], e = cam.eye;
            let best = -1; const T = g.t;
            if(BLASTW.ready && D.targets.length <= 256){
                const ptr = BLASTW.buf(), F = BLASTW.mod.HEAPF32, idx = ptr / 4;
                for(let i = 0; i < D.targets.length; i++){
                    const tg = D.targets[i], o = idx + i * 11;
                    F[o] = tg.x; F[o + 1] = tg.y; F[o + 2] = tg.z; F[o + 3] = tg.nx; F[o + 4] = tg.nz;
                    F[o + 5] = tg.amp; F[o + 6] = tg.f; F[o + 7] = tg.ph; F[o + 8] = tg.s; F[o + 9] = tg.r; F[o + 10] = R.tgt[i].hit ? 1 : 0;
                }
                best = BLASTW.pick(D.targets.length, T, S.s, e[0], e[1], e[2], d[0], d[1], d[2]);
            } else {
                let bt = 1e9;
                for(let i = 0; i < D.targets.length; i++){
                    const tg = D.targets[i]; if(R.tgt[i].hit || tg.s < S.s - 6 || tg.s > S.s + 140) continue; const p = targetPos(tg, T), wx = p[0] - e[0], wy = p[1] - e[1], wz = p[2] - e[2], tt = wx * d[0] + wy * d[1] + wz * d[2];
                    if(tt < 2 || tt > 150) continue; const px = wx - d[0] * tt, py = wy - d[1] * tt, pz = wz - d[2] * tt;
                    if(Math.hypot(px, py, pz) < tg.r + .5 && tt < bt){ bt = tt; best = i; }
                }
            }
            const m0 = [e[0] + Math.cos(cam.yaw) * .55, e[1] - .5, e[2] - Math.sin(cam.yaw) * .55];
            let end = [e[0] + d[0] * 70, e[1] + d[1] * 70, e[2] + d[2] * 70];
            if(best >= 0){ const tg = D.targets[best], p = targetPos(tg, T); end = p; R.tgt[best].hit = R.ct; R.combo++; R.comboT = 4.2; R.hits++; const pts = tg.pts * mult(R); R.score += pts; g.sfx(tg.k === "gold" ? "gold" : "hit"); if(tg.k === "gold") g.ui.toast("🌟 きんいろ！ +" + pts, 1400); }
            R.bolts.push({t: R.ct, x0: m0[0], y0: m0[1], z0: m0[2], x1: end[0], y1: end[1], z1: end[2], hit: best >= 0});
        }
        R.bolts = R.bolts.filter((b) => R.ct - b.t < .3);
    }
    // 画面の くろ（G・ふぇーど）
    const fi = clamp(1 - R.ct / .9, 0, 1), fo = clamp((R.ct - (tb.dur - .9)) / .9, 0, 1), vig = clamp((cc.G - 3.2) * .45, 0, .72);
    R.gfx = {fade: Math.max(fi, fo), vig};
    // ひょうじ
    const kmh = Math.round(Math.abs(S.u) * 3.6), tot = rideTotal(R.a), left = Math.max(0, Math.ceil(tot - R.before - R.ct));
    R.hud = A.shoot ? ("スコア " + R.score + "　コンボ ×" + mult(R) + "　" + kmh + " km/h　のこり " + left + "びょう") : ((R.a.acts.length > 1 ? "第" + (R.ai + 1) + "幕「" + A.label.replace(/^第\d幕：/, "") + "」　" : "") + kmh + " km/h　" + cc.G.toFixed(1) + "G　のこり " + left + "びょう");
    // おと（かぜ・レールの おと）
    const v01 = clamp(Math.abs(S.u) / Math.max(10, tb.peakV * .85), 0, 1);
    R.clackAcc += Math.abs(S.s - R.lastS); R.lastS = S.s;
    const chain = A.id === "jupiter" && M.lift !== undefined && M.crest !== undefined && S.s > M.lift && S.s < M.crest && S.u > 0;
    const gap = chain ? 1.7 : 7.5;
    if(R.clackAcc > gap){ R.clackAcc -= gap; if(A.rails !== false && (chain || Math.abs(S.u) > 3)) g.hooks.clack && g.hooks.clack(chain ? 1 : v01, chain); }
    g.hooks.ride && g.hooks.ride({v: v01, G: cc.G, music: v01});
}
export function coasterCamera(g){
    const R = g.ride, c = R && R.camOut; if(!c) return {eye: [g.x, 1.6, g.z], yaw: g.yaw, pitch: 0, fov: 70};
    return {eye: c.eye, yaw: c.yaw, pitch: c.pitch, roll: c.roll, fov: c.fov};
}
export {TARGETS};
