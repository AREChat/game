// ===== ギャラクシー・ループ：レールの かたち（3D）と ほんものの 物理スピード =====
//  「亀（タートル）」方式：いまの むき(yaw ψ)・たかさの かたむき(pitch θ)・バンク(roll φ) を すこしずつ かえながら すすむ。
//  θ は ぜんぶ つながった 角度（ループで 2π まわる）ので、さかさまの カメラも ぴったり つながる。
//  スピードは えねるぎー ほぞん（おちるほど はやい）＋ まさつ。リフトは チェーンで 一定、さいごは ブレーキ。
const TAU = Math.PI * 2, D2R = Math.PI / 180, G = 9.8, DS = .5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sst = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

class Gen {
    constructor(){ this.x = 0; this.y = 1.3; this.z = 0; this.psi = 0; this.th = 0; this.ph = 0; this.s = 0; this.pts = []; this.marks = {}; this.loops = []; this.push(); }
    push(){ this.pts.push({x: this.x, y: this.y, z: this.z, psi: this.psi, th: this.th, ph: this.ph, s: this.s}); }
    mark(n){ this.marks[n] = this.s; }
    run(L, th, ps, ph){
        const n = Math.max(1, Math.round(L / DS)), ds = L / n, t0 = this.th, p0 = this.psi, f0 = this.ph;
        for(let i = 0; i < n; i++){
            const um = (i + .5) / n, u1 = (i + 1) / n, thm = th(um, t0), psm = ps(um, p0);
            this.x += ds * Math.sin(psm) * Math.cos(thm); this.y += ds * Math.sin(thm); this.z += ds * Math.cos(psm) * Math.cos(thm);
            this.s += ds; this.th = th(u1, t0); this.psi = ps(u1, p0); this.ph = ph(u1, f0); this.push();
        }
    }
    home(){ return TAU * Math.round(this.ph / TAU); }
    relax(){ const h = this.home(); return (u, f0) => h + (f0 - h) * (1 - sst(u)); }
    straight(L){ this.run(L, (u, t0) => t0, (u, p0) => p0, this.relax()); }
    pitch(deg, L){ const t0 = this.th; let te = deg * D2R; te += TAU * Math.round((t0 - te) / TAU); this.run(L, (u, a) => a + (te - a) * sst(u), (u, p0) => p0, this.relax()); }
    // いっていの かたむきで すすむ：たかさが y に なるまで（そのあとの つなぎで かせぐ/おちる たかさも ふくめて）
    hold(yTarget, deg, tailL, toDeg){
        const a = deg * D2R, b = (toDeg || 0) * D2R; let gain = 0; const m = Math.max(1, Math.round(tailL / DS)), ds = tailL / m; for(let i = 0; i < m; i++) gain += ds * Math.sin(a + (b - a) * sst((i + .5) / m));
        let guard = 0; const up = a > b;   // のぼり（かたむき が プラス）か くだりか
        while(guard++ < 4000 && (up ? this.y + gain < yTarget : this.y + gain > yTarget)) this.run(DS, (u, t0) => t0, (u, p0) => p0, this.relax());
    }
    turn(degRight, L, bankDeg){ const bank = bankDeg * D2R, h = this.home(); this.run(L, (u, t0) => t0, (u, p0) => p0 - degRight * D2R * sst(u), (u, f0) => h + bank * sst(clamp(u / .22, 0, 1)) * sst(clamp((1 - u) / .22, 0, 1))); }
    turnPitch(degRight, L, bankDeg, pitchDeg){   // まがりながら のぼる/くだる（ヘリックス）
        const bank = bankDeg * D2R, h = this.home(), t0 = this.th, te = pitchDeg * D2R; this.run(L, (u, a) => a + (te - a) * sst(clamp(u / .15, 0, 1)) * (1 - sst(clamp((u - .85) / .15, 0, 1))), (u, p0) => p0 - degRight * D2R * sst(u), (u, f0) => h + bank * sst(clamp(u / .2, 0, 1)) * sst(clamp((1 - u) / .2, 0, 1)));
    }
    loop(R, c, a, dir){   // かんぜんな 360°ループ（しずく がた：うえが きつく、したが ゆるやか）。よこに すこし ずれる ので ぶつからない
        const L = TAU * R, s0 = this.s; this.run(L, (u, t0) => t0 + TAU * u - c * Math.sin(TAU * u), (u, p0) => p0 + dir * a * (1 - Math.cos(TAU * u)), (u, f0) => f0);
        this.loops.push({s0, s1: this.s, R});
    }
    corkscrew(L, rolls, turnDeg){ const f0 = this.ph; this.run(L, (u, t0) => t0, (u, p0) => p0 - turnDeg * D2R * sst(u), (u, f) => f0 + rolls * TAU * sst(u)); }
}

let CACHE = null;
export function buildCourse(P){
    if(CACHE && !P) return CACHE;
    P = Object.assign({helix: -150, helixL: 120, helixBank: -50, screwTurn: 40}, P || {});
    const g = new Gen();
    g.straight(14); g.mark("station");
    g.pitch(38, 12); g.mark("lift"); g.hold(37, 38, 14, 0); g.pitch(0, 14); g.mark("crest"); g.straight(5);
    g.mark("drop"); g.pitch(-60, 14); g.hold(2.2, -60, 30, 0); g.pitch(0, 30); g.straight(8);
    g.mark("loop1"); g.loop(12.5, .40, .21, 1); g.straight(5); g.mark("loop2"); g.loop(10.5, .40, .24, 1); g.mark("loop2end"); g.straight(8);
    g.mark("turn1"); g.turn(100, 58, 48);
    g.mark("hill"); g.pitch(16, 14); g.straight(4); g.pitch(-16, 26); g.straight(2); g.pitch(0, 16);
    g.mark("hairpin"); g.turn(-180, 66, -58); g.straight(8);
    g.mark("screw"); g.corkscrew(50, 1, P.screwTurn); g.straight(6);
    g.mark("helix"); g.turn(P.helix, P.helixL, P.helixBank); g.straight(8);
    g.mark("brake"); g.straight(40);
    const pts = g.pts, total = g.s;
    // バンクが 2π の ばいすうの ままの もの：そのまま ok
    const out = {pts, total, marks: g.marks, loops: g.loops, n: pts.length}; if(!arguments[0]) CACHE = out;
    return out;
}

// ---- ある きょり s の じょうたい（かどを なめらかに）----
export function sampleAt(T, s){
    const k = clamp(s / DS, 0, T.n - 1.0001), i = Math.floor(k), u = k - i, a = T.pts[i], b = T.pts[i + 1];
    const l = (p, q) => p + (q - p) * u;
    return {x: l(a.x, b.x), y: l(a.y, b.y), z: l(a.z, b.z), psi: l(a.psi, b.psi), th: l(a.th, b.th), ph: l(a.ph, b.ph)};
}
export const frame = (st) => {   // F(すすむ), U(うえ), Rt(みぎ)
    const sy = Math.sin(st.psi), cy = Math.cos(st.psi), sp = Math.sin(st.th), cp = Math.cos(st.th), F = [sy * cp, sp, cy * cp], u0 = [-sy * sp, cp, -cy * sp];
    const r0 = [F[1] * u0[2] - F[2] * u0[1], F[2] * u0[0] - F[0] * u0[2], F[0] * u0[1] - F[1] * u0[0]], c = Math.cos(st.ph), s = Math.sin(st.ph);
    return {F, U: [u0[0] * c + r0[0] * s, u0[1] * c + r0[1] * s, u0[2] * c + r0[2] * s], Rt: [r0[0] * c - u0[0] * s, r0[1] * c - u0[1] * s, r0[2] * c - u0[2] * s]};
};

// ---- スピード（えねるぎー ほぞん）----
export function simulate(T, opt){
    const O = Object.assign({vLift: 4.2, v0: 2.6, fr: .09, drag: .00055, brakeLen: 38}, opt || {}), n = T.n, v = new Float32Array(n), M = T.marks;
    const sOf = (i) => i * DS;
    let v2 = O.v0 * O.v0; const crestI = Math.round(M.crest / DS), liftI = Math.round(M.station / DS), brakeI = Math.round(M.brake / DS);
    v[0] = O.v0;
    for(let i = 1; i < n; i++){
        const dy = T.pts[i].y - T.pts[i - 1].y;
        if(i <= crestI){ // スタート→リフト：のろのろ→チェーン
            const vt = i < liftI ? Math.min(O.vLift, O.v0 + (O.vLift - O.v0) * (i / liftI)) : O.vLift; v2 = vt * vt;
        } else if(i < brakeI){
            v2 += -2 * G * dy - 2 * O.fr * DS - 2 * O.drag * v2 * DS;
            if(v2 < 36) v2 = 36;   // ぜったいに とまらない（レールの ぶんだけ）
        } else { // ブレーキ：のこりの きょりで しずかに とまる
            const left = (n - 1 - i) * DS, vEnd = 1.6, vmax = Math.sqrt(vEnd * vEnd + 2 * 5.5 * left); v2 = Math.min(v2, vmax * vmax);
        }
        v[i] = Math.sqrt(v2);
    }
    // じかん
    const tm = new Float32Array(n); for(let i = 1; i < n; i++) tm[i] = tm[i - 1] + DS / Math.max(.5, (v[i] + v[i - 1]) / 2);
    return {v, t: tm, dur: tm[n - 1]};
}
// ある じかん t（びょう）での きょり s
export function sAtTime(T, S, t){
    const n = T.n; if(t <= 0) return 0; if(t >= S.t[n - 1]) return (n - 1) * DS;
    let lo = 0, hi = n - 1; while(hi - lo > 1){ const m = (lo + hi) >> 1; if(S.t[m] <= t) lo = m; else hi = m; }
    const u = (t - S.t[lo]) / Math.max(1e-6, S.t[hi] - S.t[lo]); return (lo + u) * DS;
}
export const speedAt = (T, S, s) => { const k = clamp(s / DS, 0, T.n - 1.0001), i = Math.floor(k); return S.v[i] + (S.v[i + 1] - S.v[i]) * (k - i); };
// かんじる Gりょく（うえ・よこ）
export function gAt(T, S, s){
    const d = 1.2, a = frame(sampleAt(T, s - d)), b = frame(sampleAt(T, s + d)), c = frame(sampleAt(T, s)), v = speedAt(T, S, s);
    const dF = [(b.F[0] - a.F[0]) / (2 * d), (b.F[1] - a.F[1]) / (2 * d), (b.F[2] - a.F[2]) / (2 * d)];
    const v1 = speedAt(T, S, s + d), v0 = speedAt(T, S, s - d), at = (v1 * v1 - v0 * v0) / (4 * d);
    const felt = [dF[0] * v * v + c.F[0] * at, dF[1] * v * v + c.F[1] * at + G, dF[2] * v * v + c.F[2] * at];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
    return {up: dot(felt, c.U) / G, side: dot(felt, c.Rt) / G, fwd: dot(felt, c.F) / G};
}
