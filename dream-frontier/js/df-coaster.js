// ===== コースター／フライト用の ばんぐみ（エンジンに よらない 計算だけ）=====
//  ・buildTrack   : 「まっすぐ○m・○度のぼる・○度まがる」を つなげて レールの 点を つくる
//  ・simBoomerang : ほんとうの 物理（いちりょく・まさつ・リニア発進・ブレーキ）で「行き → てっぺんで とまる → ぎゃくそう」を 先に 計算
//  ・simScripted  : 「ここは このスピード」と きめた ばしょ ごとの スピードで すすむ（飛行・シューティング用）
//  ・coasterCam   : その 時刻の カメラ（むき・ぼうき・バンク・G・ゆれ）
import {makePath} from "./df-path.js";
import {bootDfWasm} from "./df-wasm.js";

// ---- 物理シミュレーションの C++(WebAssembly) コア ----
// index.html が <script src="js/dreamfrontier.wasm.js"> を 先に読みこむ（js/df-wasm.js が instantiate を 1回だけ行う）。
// 読みこみが まだ・または 失敗した時は、このファイル下部の 元のJS実装に 自動で フォールバックする。
const DFC = {ready: false};
bootDfWasm().then((M) => {
    DFC.mod = M;
    DFC.setPath = M.cwrap("df_cst_set_path", null, ["number", "number", "number", "number"]);
    DFC.simBoomerangC = M.cwrap("df_sim_boomerang", "number", ["number", "number", "number", "number", "number", "number", "number", "number", "number", "number", "number", "number", "number", "number", "number", "number"]);
    DFC.simScriptedC = M.cwrap("df_sim_scripted", "number", ["number", "number", "number", "number", "number", "number", "number", "number"]);
    DFC.ready = true;
}, () => {});
export const GRAV = 9.8, D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

// よこの かたち H: [{len(よこの きょり m), turn(度・みぎが +), roll(かいてん数), mark("名まえ")}]
// たての かたち V: [[よこの きょり, たかさ m, かたむき(度)], ...]  ← ここを 通る なめらかな 山と たに（エルミート補間）
export function buildTrack(start, H, V, step){
    step = step || 5; const D = H.reduce((a, g) => a + g.len, 0), segA = []; let c = 0; for(const g of H){ segA.push(c); c += g.len; }
    const yaw0 = (start.yaw || 0) * D2R;
    const yawAt = (d) => { let y = yaw0; for(let i = 0; i < H.length; i++){ const g = H[i], a = segA[i]; if(d >= a + g.len) y -= (g.turn || 0) * D2R; else { if(d > a) y -= (g.turn || 0) * D2R * sstep((d - a) / g.len); break; } } return y; };
    const hAt = (d) => { if(d <= V[0][0]) return V[0][1]; for(let i = 1; i < V.length; i++){ if(d <= V[i][0]){ const a = V[i - 1], b = V[i], w = b[0] - a[0], t = (d - a[0]) / w, m0 = Math.tan((a[2] || 0) * D2R) * w, m1 = Math.tan((b[2] || 0) * D2R) * w, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * m1; } } return V[V.length - 1][1]; };
    const n = Math.ceil(D / step), pts = [], ds = [0], dd = D / n; let x = start.x, z = start.z, S = 0; pts.push([x, z, hAt(0)]);
    for(let i = 1; i <= n; i++){ const d0 = (i - 1) * dd, d1 = i * dd, ym = yawAt((d0 + d1) / 2); x += dd * Math.sin(ym); z += dd * Math.cos(ym); const h = hAt(d1), hp = pts[i - 1][2]; S += Math.hypot(dd, h - hp); pts.push([x, z, h]); ds.push(S); }
    const sOf = (d) => { const k = clamp(d / dd, 0, n), i = Math.min(n - 1, Math.floor(k)); return lerp(ds[i], ds[i + 1], k - i); };
    const marks = {}, rolls = []; H.forEach((g, i) => { if(g.mark) marks[g.mark] = sOf(segA[i]); if(g.roll) rolls.push({s0: sOf(segA[i]), s1: sOf(segA[i] + g.len), turns: g.roll}); });
    const ends = V.map((q) => ({d: q[0], s: sOf(q[0]), y: q[1]}));
    return {pts, rolls, marks, ends, total: S, D, sOf, end: {x, z, yaw: yawAt(D) / D2R}};
}

// ---- じゅんび：レールの みちすじ ----
export function trackPath(tr){ return makePath(tr.pts, false, 12); }

const REC = 1 / 60;
// 物理シミュレーション（行き → てっぺん → ぎゃくそう）。sp の せつめいは df-data.js を 見てね。
// WASM(C++)が 準備できていれば そちらを使い、まだ・または 失敗した時は 元のJS実装にフォールバックする。
export function simBoomerang(path, sp){
    if(DFC.ready){ try{ return simBoomerangWasm(path, sp); }catch(_e){ try{ console.warn("dream-frontier: コースター物理(WASM)に失敗。JS版にフォールバックします。", _e); }catch(_e2){} } }
    return simBoomerangJs(path, sp);
}
function simBoomerangWasm(path, sp){
    const M = DFC.mod, L = path.total;
    // レールの 高さを 密にサンプリングして C++側に渡す（path.at()のスプライン自体は移植していない）
    const step = 0.5, n = Math.min(10000, Math.max(2, Math.ceil(L / step) + 1));
    const ys = new Float32Array(n); for(let i = 0; i < n; i++) ys[i] = path.at(Math.min(L - .01, i * step))[1];
    const ysPtr = M._malloc(n * 4); M.HEAPF32.set(ys, ysPtr / 4); DFC.setPath(ysPtr, n, step, L); M._free(ysPtr);
    const fwd = sp.fwd || [], rev = sp.rev || [];
    const zoneType = (t) => t === "const" ? 0 : t === "brake" ? 2 : 1; // launch/assist は どちらも 1
    const flat = (zs) => { const f = new Float32Array(zs.length * 5); zs.forEach((z, i) => { f[i * 5] = z.s0; f[i * 5 + 1] = z.s1; f[i * 5 + 2] = zoneType(z.type); f[i * 5 + 3] = z.v; f[i * 5 + 4] = z.a || 0; }); return f; };
    const fwdF = flat(fwd), revF = flat(rev);
    const fwdPtr = fwdF.length ? M._malloc(fwdF.length * 4) : 0; if(fwdPtr) M.HEAPF32.set(fwdF, fwdPtr / 4);
    const revPtr = revF.length ? M._malloc(revF.length * 4) : 0; if(revPtr) M.HEAPF32.set(revF, revPtr / 4);
    const hasTop = sp.topS !== null && sp.topS !== undefined, hasStop = sp.stopS !== null && sp.stopS !== undefined;
    const ptr = DFC.simBoomerangC(sp.s0 || 0, sp.hold0 || 0, sp.cd || .0012, sp.cr || .05, sp.stopB || 2.2, sp.vCrawl || .6,
        hasTop ? sp.topS : 0, hasTop ? 1 : 0, hasStop ? sp.stopS : 0, hasStop ? 1 : 0, sp.topHold === undefined ? 3 : sp.topHold, sp.endHold === undefined ? 2 : sp.endHold,
        fwdPtr, fwd.length, revPtr, rev.length);
    if(fwdPtr) M._free(fwdPtr); if(revPtr) M._free(revPtr);
    const F = M.HEAPF32, idx = ptr / 4, cnt = F[idx] | 0, HEAD = 10, MAXS = 20000;
    const sArr = new Array(cnt), uArr = new Array(cnt);
    for(let i = 0; i < cnt; i++){ sArr[i] = F[idx + HEAD + i]; uArr[i] = F[idx + HEAD + MAXS + i]; }
    return {dt: F[idx + 1], s: sArr, u: uArr, notes: [], dur: F[idx + 8], n: cnt, peakV: F[idx + 9],
        marks: {dispatch: F[idx + 2], launch: F[idx + 3], top: F[idx + 4], rev: F[idx + 5], stop: F[idx + 6], end: F[idx + 7]}};
}
function simBoomerangJs(path, sp){
    const L = path.total, DT = 1 / 240, G = GRAV, out = {dt: REC, s: [], u: [], marks: {}, notes: []};
    const hAt = (s) => path.at(clamp(s, 0, L - .01))[1];
    const slope = (s) => (hAt(s + 1.5) - hAt(s - 1.5)) / 3;
    let s = sp.s0 || 0, u = 0, acc = 0, t = 0;
    const rec = () => { out.s.push(s); out.u.push(u); };
    const hold = (sec) => { const n = Math.round(sec / REC); for(let i = 0; i < n; i++){ rec(); t += REC; } };
    hold(sp.hold0 || 0); out.marks.dispatch = t;
    const run = (d, zones, stopS, nameEnd, limit) => {
        let guard = 0, vPrev = 0, ph = 0;
        for(;;){
            if(++guard > 240 * 200) { out.notes.push("時間ぎれ:" + nameEnd); return "timeout"; }
            const aG = -G * slope(s), v0 = d * u;
            let a = aG - Math.sign(u || d) * ((sp.cd || .0012) * u * u + (sp.cr || .05));
            let v = v0 + d * a * DT;
            for(const z of zones){ if(s >= z.s0 && s <= z.s1){
                if(z.type === "const") v = z.v;
                else if(z.type === "launch" || z.type === "assist"){ if(v < z.v) v = Math.min(z.v, v + z.a * DT); }
                else if(z.type === "brake"){ if(v > z.v) v = Math.max(z.v, v - z.a * DT); }
            } }
            if(stopS !== null && stopS !== undefined){ const dist = d > 0 ? stopS - s : s - stopS; const vmax = Math.sqrt(2 * (sp.stopB || 2.2) * Math.max(0, dist)) + (sp.vCrawl || .6) * clamp(dist / 4, 0, 1); if(v > vmax) v = vmax; if(dist <= .02){ u = 0; s = stopS; return "stopped"; } }
            if(v < -.2 && !(sp.allowBack)) v = 0;
            ph += DT; if(v <= .05 && ph > 3 && s > 30 && !(stopS !== null && stopS !== undefined && Math.abs(stopS - s) < 6)){ u = 0; out.notes.push("とちゅうで とまった s=" + s.toFixed(0)); return "stall"; }
            u = d * v; s += u * DT; acc += DT; t += DT;
            if(acc >= REC){ acc -= REC; rec(); }
            if(d > 0 && s >= L - .3){ s = L - .3; u = 0; return "end"; }
            if(d < 0 && s <= 0){ s = 0; u = 0; return "start"; }
            if(limit && limit(s, v)) return "limit";
            vPrev = v;
        }
    };
    out.marks.launch = t;
    const r1 = run(1, sp.fwd, sp.topS, "fwd");
    out.marks.top = t; out.notes.push("行き:" + r1 + " s=" + s.toFixed(1));
    hold(sp.topHold || 3); out.marks.rev = t;
    const r2 = run(-1, sp.rev, sp.stopS, "rev");
    out.marks.stop = t; out.notes.push("ぎゃく:" + r2 + " s=" + s.toFixed(1));
    hold(sp.endHold || 2); out.marks.end = t;
    out.dur = out.s.length * REC; out.n = out.s.length; out.peakV = out.u.reduce((m, q) => Math.max(m, Math.abs(q)), 0);
    return out;
}

// きまった スピードで すすむ（keys: [[s, v], ...]、holds: [{s, t}] で とまる）
// WASM(C++)版は holds/marks( sp.holds, sp.marks)に対応していない（実データで使われていないため）。
// そのどちらかが指定されている時は 安全のため JS版を使う。
export function simScripted(path, sp){
    if(DFC.ready && !(sp.holds && sp.holds.length) && !(sp.marks && sp.marks.length)){
        try{ return simScriptedWasm(path, sp); }catch(_e){ try{ console.warn("dream-frontier: コースター物理(WASM)に失敗。JS版にフォールバックします。", _e); }catch(_e2){} }
    }
    return simScriptedJs(path, sp);
}
function simScriptedWasm(path, sp){
    const M = DFC.mod, L = path.total, keys = sp.keys;
    const kf = new Float32Array(keys.length * 2); keys.forEach((k, i) => { kf[i * 2] = k[0]; kf[i * 2 + 1] = k[1]; });
    const kPtr = M._malloc(kf.length * 4); M.HEAPF32.set(kf, kPtr / 4);
    const ptr = DFC.simScriptedC(kPtr, keys.length, sp.s0 || 0, sp.hold0 || 0, sp.endHold === undefined ? 2 : sp.endHold, sp.amax || 4.5, sp.dmax || 5, L);
    M._free(kPtr);
    const F = M.HEAPF32, idx = ptr / 4, cnt = F[idx] | 0, HEAD = 10, MAXS = 20000;
    const sArr = new Array(cnt), uArr = new Array(cnt);
    for(let i = 0; i < cnt; i++){ sArr[i] = F[idx + HEAD + i]; uArr[i] = F[idx + HEAD + MAXS + i]; }
    return {dt: F[idx + 1], s: sArr, u: uArr, notes: [], dur: F[idx + 8], n: cnt, peakV: F[idx + 9],
        marks: {dispatch: F[idx + 2], launch: F[idx + 3], stop: F[idx + 6], end: F[idx + 7]}};
}
function simScriptedJs(path, sp){
    const L = path.total, DT = 1 / 240, out = {dt: REC, s: [], u: [], marks: {}, notes: []};
    const keys = sp.keys, vAt = (s) => { if(s <= keys[0][0]) return keys[0][1]; for(let i = 1; i < keys.length; i++){ if(s <= keys[i][0]){ const k = (s - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0] || 1); return lerp(keys[i - 1][1], keys[i][1], sstep(k)); } } return keys[keys.length - 1][1]; };
    let s = sp.s0 || 0, acc = 0; const holds = (sp.holds || []).map((h) => Object.assign({done: false}, h));
    const rec = (u) => { out.s.push(s); out.u.push(u); };
    const wait = (sec, name) => { if(name) out.marks[name] = out.s.length * REC; const n = Math.round(sec / REC); for(let i = 0; i < n; i++) rec(0); };
    wait(sp.hold0 || 0, "dispatch"); out.marks.launch = out.s.length * REC;
    let guard = 0;
    let vc = .3; const amax = sp.amax || 4.5, dmax = sp.dmax || 5;
    while(s < L - .3 && ++guard < 240 * 400){
        const want = Math.max(.3, vAt(s)); vc += Math.max(-dmax * DT, Math.min(amax * DT, want - vc)); const v = vc; s += v * DT; acc += DT;
        if(acc >= REC){ acc -= REC; rec(v); }
        for(const h of holds) if(!h.done && s >= h.s){ h.done = true; wait(h.t, h.mark); }
        if(sp.marks) for(const m of sp.marks) if(!m.done && s >= m.s){ m.done = true; out.marks[m.name] = out.s.length * REC; }
    }
    out.marks.stop = out.s.length * REC; wait(sp.endHold || 2, "end");
    out.dur = out.s.length * REC; out.n = out.s.length; out.peakV = out.u.reduce((m, q) => Math.max(m, Math.abs(q)), 0);
    return out;
}

// 時刻 t の（s, u, 加速度）
export function sample(tb, t){
    const x = clamp(t, 0, tb.dur - REC * 2) / REC, i = Math.floor(x), f = x - i, n = tb.n;
    const g = (k) => clamp(k, 0, n - 1), s = lerp(tb.s[g(i)], tb.s[g(i + 1)], f), u = lerp(tb.u[g(i)], tb.u[g(i + 1)], f);
    const a = (tb.u[g(i + 3)] - tb.u[g(i - 2)]) / (5 * REC);
    return {s, u, a};
}

const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const tang = (path, s, h) => norm(sub(path.at(s + h), path.at(s - h)));
const sn = (x) => Math.sin(x) + .5 * Math.sin(x * 2.31 + 1.7) + .3 * Math.sin(x * 5.07 + .4);

// カメラ（R: のりもの状態。R.roll など を なめらかに するための きおく）
// opt: {eye, face(+1/-1), turn(0..1: てんかん台), look:[yaw,pitch], dt}
export function coasterCam(path, tr, S, R, opt){
    const s = S.s, u = S.u, O = opt || {};
    const P = path.at(s), t = tang(path, s, 2.5), t0 = tang(path, s - 1, 2.5), t1 = tang(path, s + 1, 2.5), kap = [(t1[0] - t0[0]) / 2, (t1[1] - t0[1]) / 2, (t1[2] - t0[2]) / 2];
    const face = O.face || 1; let F = [t[0] * face, t[1] * face, t[2] * face];
    // 感じる力：加速度 + 重力の はんたい
    const felt = [t[0] * S.a + kap[0] * u * u, t[1] * S.a + kap[1] * u * u + GRAV, t[2] * S.a + kap[2] * u * u];
    const turn = O.turn || 0; // 回転台：ま上 まわりに 回す
    if(turn){ const c = Math.cos(Math.PI * turn), sI = Math.sin(Math.PI * turn); F = [F[0] * c + F[2] * sI, F[1], -F[0] * sI + F[2] * c]; }
    const Y = [0, 1, 0], up0 = norm(sub(Y, F.map((q) => q * F[1]))), right = norm(cross(F, up0));
    const fp = sub(felt, F.map((q) => q * dot(felt, F))), fl = Math.hypot(fp[0], fp[1], fp[2]);
    const w = clamp((fl / GRAV - .15) / .5, 0, 1); const fu = fl > 1e-4 ? fp.map((q) => q / fl) : up0;
    const upv = norm([up0[0] * (1 - w) + fu[0] * w, up0[1] * (1 - w) + fu[1] * w, up0[2] * (1 - w) + fu[2] * w]);
    let roll = Math.atan2(dot(upv, right), dot(upv, up0)); roll = clamp(roll, -1.15, 1.15);
    const dt = O.dt || 1 / 60, k = 1 - Math.exp(-dt / .22); R.roll = (R.roll === undefined ? roll : R.roll + (roll - R.roll) * k);
    let extra = 0; for(const r of tr.rolls || []){ if(s >= r.s0){ extra += r.turns * TAU * sstep((s - r.s0) / (r.s1 - r.s0)); } }
    const sh = clamp(Math.abs(u) / 20, 0, 1.4), T = O.t || 0;
    const eyeH = O.eye === undefined ? 1.1 : O.eye;
    const eye = [P[0] + upv[0] * eyeH, P[1] + upv[1] * eyeH + sn(T * 41) * .014 * sh, P[2] + upv[2] * eyeH];
    const pitch = Math.asin(clamp(F[1], -1, 1)) + sn(T * 37 + 2) * .0016 * sh, yaw = Math.atan2(F[0], F[2]);
    const G = fl / GRAV, Gt = Math.hypot(felt[0], felt[1], felt[2]) / GRAV;
    return {eye, yaw, pitch, roll: R.roll + extra + sn(T * 29 + 5) * .004 * sh, fov: 68 + 16 * clamp(Math.abs(u) / 32, 0, 1) + (G > 2 ? (G - 2) * 1.2 : 0), G: Gt, Gv: G, speed: Math.abs(u), P, F};
}
