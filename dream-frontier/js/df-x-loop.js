// ===== ギャラクシー・ループ（360°ループの 絶叫コースター）=====
//  リフトで てっぺんまで → 大ドロップ → ほんものの 360°ループ ×2 → バンク・ヘアピン・コークスクリュー・ヘリックス。
//  カメラは レールに ぴったり ついて、さかさまの ときも ちゃんと さかさまに なる。ネオンの リングを くぐろう！
//  E（スマホは 🙌ボタン）で ばんざい！ 3かい いじょうで ボーナス。さいごまで のると スタンプ。ゆっくり おりる ときは Q / Esc。
import {TAU, clamp, lerp, wrapPi, root, clearRoot, el, bodyOn} from "./df-xlib.js";
import {buildCourse, simulate, sampleAt, frame, sAtTime, speedAt, gAt} from "./df-x-loop-track.js";

export const CX = 1300, CZ = -1300, OX = CX + 60, OZ = CZ - 140;
const RING_S = [58, 92, 118, 150, 196, 236, 288, 340, 404, 470, 548, 640];
const RCOL = ["#46e6ff", "#ff6ad8", "#ffe27a", "#7affd8", "#9a8aff", "#ff9a5a"];
const START_WAIT = 3.2;

export const loop = {
    build(K){
        const {box, cyl, sph, pln} = K.h, L = K.mk("loop", {tex: "tile", glowTint: [.9, .9, .9, .9], cloudA: .5}), S = L.solid, G = L.ground, GL = L.glow, CL = L.cloud, T = buildCourse();
        pln(G, OX - 60, 0, OZ + 140, 900, 900, "#141a52", 90, 90); pln(G, OX - 60, .03, OZ + 140, 420, 420, "#1e2878", 42, 42);
        const STEP = 3, nseg = Math.floor((T.n - 1) / STEP), inLoop = (s) => T.loops.some((q) => s >= q.s0 - 1 && s <= q.s1 + 1), nearRing = (s) => RING_S.some((r) => Math.abs(r - s) < 3.2);
        for(let k = 0; k < nseg; k++){
            const i0 = k * STEP, a = T.pts[i0], b = T.pts[i0 + STEP], m = T.pts[i0 + (STEP >> 1)], fr = frame(m);
            const len = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) + .06, cx = (a.x + b.x) / 2 + OX, cy = (a.y + b.y) / 2, cz = (a.z + b.z) / 2 + OZ, ry = m.psi, rx = -m.th, rz = m.ph;
            for(const side of [-1, 1]){
                const o = side * .64, x = cx + fr.Rt[0] * o - fr.U[0] * .12, y = cy + fr.Rt[1] * o - fr.U[1] * .12, z = cz + fr.Rt[2] * o - fr.U[2] * .12;
                box(S, x, y, z, .15, .22, len, side < 0 ? "#d8f4ff" : "#ffd8f4", ry, rx, rz); box(GL, x, y, z, .09, .09, len, side < 0 ? "#46e6ff" : "#ff6ad8", ry, rx, rz);
            }
            box(S, cx - fr.U[0] * .3, cy - fr.U[1] * .3, cz - fr.U[2] * .3, 1.7, .1, .26, "#2a2a5a", ry, rx, rz);
            box(S, cx - fr.U[0] * .62, cy - fr.U[1] * .62, cz - fr.U[2] * .62, .36, .36, len, "#6a5ab0", ry, rx, rz);
            const s = i0 * .5;
            if(s > T.marks.lift && s < T.marks.crest && k % 2 === 0) box(GL, cx - fr.U[0] * .1, cy - fr.U[1] * .1, cz - fr.U[2] * .1, .5, .06, .5, "#ffe27a", ry, rx, rz);
            if(k % 6 === 0 && a.y > 3.4 && fr.U[1] > .55 && !inLoop(s) && !nearRing(s)){ cyl(S, cx, 0, cz, .26, .36, cy - .72, "#9a9ac8", 8); if(k % 12 === 0 && cy > 8) box(S, cx, cy * .5, cz, 1.4, .16, .3, "#6a6a98", ry); }
        }
        // ループの ささえ（ゲート）
        for(const lp of T.loops){
            const pts = T.pts.filter((p) => p.s >= lp.s0 && p.s <= lp.s1), n = pts.length, mx = pts.reduce((q, p) => q + p.x, 0) / n, mz = pts.reduce((q, p) => q + p.z, 0) / n, top = Math.max(...pts.map((p) => p.y)), psi0 = T.pts[Math.round(lp.s0 / .5)].psi, rt = [-Math.cos(psi0), Math.sin(psi0)];
            let lo = 1e9, hi = -1e9; for(const p of pts){ const l = (p.x - mx) * rt[0] + (p.z - mz) * rt[1]; lo = Math.min(lo, l); hi = Math.max(hi, l); }
            for(const side of [lo - 3.2, hi + 3.2]) { const x = mx + rt[0] * side + OX, z = mz + rt[1] * side + OZ; cyl(S, x, 0, z, .45, .6, top + 2.6, "#8a8ac0", 8); box(GL, x, top + 2.3, z, .5, .5, .5, "#46e6ff"); for(const hh of [.3, .6]) box(S, x - rt[0] * 0, top * hh, z, .22, .22, 1.2, "#6a6a98", psi0); }
            const cxm = mx + rt[0] * (lo + hi) / 2 + OX, czm = mz + rt[1] * (lo + hi) / 2 + OZ; box(S, cxm, top + 2.7, czm, 1.0, .5, hi - lo + 6.4, "#7a7ab8", psi0 + Math.PI / 2 * 0 + 0);
        }
        // ネオンの リング
        RING_S.forEach((s, ri) => { const st = sampleAt(T, s), fr = frame(st), col = RCOL[ri % RCOL.length]; for(let q = 0; q < 32; q++){ const a = q / 32 * TAU, c = Math.cos(a) * 4.2, u = Math.sin(a) * 4.2; sph(GL, st.x + OX + fr.Rt[0] * c + fr.U[0] * u, st.y + fr.Rt[1] * c + fr.U[1] * u, st.z + OZ + fr.Rt[2] * c + fr.U[2] * u, .13, col, 1, 5); } });
        // のりば・ゴール
        { const a = T.pts[0], ex = T.pts[T.n - 1]; box(S, a.x + OX, .45, a.z + OZ + 7, 7, .9, 22, "#3a3a7a"); box(S, a.x + OX - 3.6, 3.2, a.z + OZ + 6, .3, 6.4, 20, "#46e6ff"); box(GL, a.x + OX - 3.6, 6.4, a.z + OZ + 6, .2, .2, 20, "#46e6ff");
            for(const dz of [-2, 14]) for(const dx of [-3.4, 3.4]) cyl(S, a.x + OX + dx, 0, a.z + OZ + dz, .25, .3, 5.6, "#9a9ac8", 8);
            box(S, a.x + OX, 5.8, a.z + OZ + 6, 8.6, .4, 18, "#5a4aa0"); box(GL, a.x + OX, 6.1, a.z + OZ + 6, 7.6, .12, 17, "#ff6ad8");
            const fx = ex.x + OX, fz = ex.z + OZ; box(S, fx, .3, fz, 6, .6, 14, "#3a3a7a"); box(GL, fx, .75, fz, 5, .1, 13, "#7affd8"); }
        // ネオンの ビル・ほし・わくせい
        let sd = 77; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
        const nearTrack = (x, z) => { let m = 1e9; for(let i = 0; i < T.n; i += 6){ const p = T.pts[i], d = Math.hypot(p.x + OX - x, p.z + OZ - z); if(d < m) m = d; } return m; };
        for(let i = 0, t = 0; i < 300 && t < 70; i++){ const x = OX - 60 + (rnd() - .5) * 360, z = OZ + 140 + (rnd() - .5) * 360; if(nearTrack(x, z) < 22) continue; t++; const h = 14 + rnd() * 40, w = 4 + rnd() * 5, c = ["#2a3a8a", "#3a2a7a", "#1e4a8a"][t % 3]; box(S, x, 0, z, w, h, w, c); const gc = RCOL[t % RCOL.length]; box(GL, x, h, z, w + .3, .5, w + .3, gc); for(let q = 0; q < 4; q++) box(GL, x, h * (.2 + q * .2), z, w + .08, .22, w + .08, gc); }
        for(let i = 0; i < 260; i++){ const a = rnd() * TAU, e = .15 + rnd() * 1.2, r = 330, x = OX - 60 + Math.cos(a) * r, z = OZ + 140 + Math.sin(a) * r, y = 40 + Math.sin(e) * 190; sph(GL, x, y, z, .9 + rnd() * 1.3, ["#ffffff", "#ffe9a8", "#bfe0ff"][i % 3], 1, 4); }
        sph(S, OX + 200, 120, OZ + 330, 46, "#ff8a5a", 1, 14); sph(S, OX + 200, 120, OZ + 330, 49, "#ffb48a", 1, 12); sph(S, OX - 280, 150, OZ + 90, 28, "#7a9aff", 1, 12);
        for(let i = 0; i < 22; i++){ const a = rnd() * TAU, r = 120 + rnd() * 190, y = 55 + rnd() * 70; for(let k = 0; k < 3; k++) sph(CL, OX - 60 + Math.cos(a) * r + k * 3, y + (k % 2), OZ + 140 + Math.sin(a) * r, 4.5 + rnd() * 2, "#9aa8ff", .5, 6); }
    },
    init(g, R, a){
        const T = buildCourse(), S = simulate(T);
        Object.assign(R, {T, S, s: 0, rt: 0, ringGot: RING_S.map(() => false), rings: 0, banzai: 0, pose: 0, inv: 0, fin: 0, win: false, hud: {}, gUp: 1, gSide: 0, v: S.v[0], roll: 0, lastBanzai: -9, camShake: 0});
        ensure(R);
    },
    update(g, R, dt, inp){
        const T = R.T, S = R.S;
        const wait = START_WAIT; R.rt = Math.max(0, R.t - wait);
        const s = sAtTime(T, S, R.rt); R.s = s; R.v = speedAt(T, S, s); const gf = gAt(T, S, clamp(s, 1.5, T.total - 1.5)); R.gUp += (gf.up - R.gUp) * Math.min(1, dt * 8); R.gSide += (gf.side - R.gSide) * Math.min(1, dt * 8);
        const st = sampleAt(T, s), fr = frame(st); R.up = fr.U[1]; if(R.up < -.25 && R.rt > 0) R.inv += dt;
        if(R.t < wait){ const b = Math.ceil(wait - R.t); if(R.cdb !== b){ R.cdb = b; if(b <= 3) g.sfx("clue"); } }
        else if(!R.cdgo){ R.cdgo = true; g.sfx("start"); }
        R.ringGot.forEach((got, i) => { if(!got && s >= RING_S[i]){ R.ringGot[i] = true; R.rings++; g.sfx("coin"); } });
        if((inp.act || R.banzaiReq) && R.t > wait && R.t - R.lastBanzai > 1.2 && !R.fin){ R.banzai++; R.lastBanzai = R.t; R.pose = 1.3; g.sfx("hit"); }
        R.banzaiReq = false; R.pose = Math.max(0, R.pose - dt);
        if(R.auto && R.t > wait && R.t - R.lastBanzai > 6 && !R.fin && (R.up < -.5 || R.s > T.total - 40)){ R.banzai++; R.lastBanzai = R.t; R.pose = 1.3; }
        if(!R.fin && s >= T.total - .6){
            R.fin = 1; R.win = true; R.finT = R.t; const bonus = (R.banzai >= 3 ? 20 : 0) + (R.rings >= RING_S.length ? 20 : 0); g.sv.coins += bonus; g.sv.best_loop = Math.max(g.sv.best_loop || 0, Math.round(R.inv * 10) / 10);
            g.ui.toast("🎢 おつかれさま！ リング " + R.rings + "/" + RING_S.length + "　さかさま " + R.inv.toFixed(1) + "びょう　ばんざい " + R.banzai + "かい" + (bonus ? "  ボーナス +" + bonus + "コイン" : ""), 6200); g.sfx("gold");
        }
        if(R.fin && R.t - R.finT > 5.2) g.endRide(true, true);
        R.camShake = clamp(R.v / 30, 0, 1); updateHud(R);
    },
    camera(g, R){
        const T = R.T, st = sampleAt(T, R.s), fr = frame(st), sh = R.camShake * .012, t = R.t;
        const eye = [st.x + OX + fr.U[0] * 1.2 + fr.F[0] * .4 + Math.sin(t * 41) * sh, st.y + fr.U[1] * 1.2 + fr.F[1] * .4 + Math.sin(t * 37 + 2) * sh, st.z + OZ + fr.U[2] * 1.2 + fr.F[2] * .4];
        return {eye, yaw: st.psi, pitch: st.th, roll: st.ph - clamp(R.gSide, -1.2, 1.2) * .035 + Math.sin(t * 29 + 5) * .003 * R.camShake, fov: 70 + 10 * clamp(R.v / 30, 0, 1) + (R.gUp > 3 ? (R.gUp - 3) * 1.4 : 0)};
    },
    dyn(g, R, D){
        const T = R.T, t = g.t;
        RING_S.forEach((s, i) => { if(R.ringGot[i] && R.s - s < 1.2 && R.s >= s){ const st = sampleAt(T, s), k = (R.s - s) / 1.2; for(let q = 0; q < 8; q++){ const a = q / 8 * TAU, fr = frame(st); D.push({s: "star", x: st.x + OX + fr.Rt[0] * Math.cos(a) * 3.7 * (1 + k), y: st.y + fr.Rt[1] * Math.cos(a) * 3.7 * (1 + k) + fr.U[1] * Math.sin(a) * 3.7 * (1 + k), z: st.z + OZ + fr.Rt[2] * Math.cos(a) * 3.7 * (1 + k), w: .9, h: .9, c: [1, .9, .4], a: 1 - k}); } } });
    },
    hud(R){ return "スピード " + Math.round(R.v * 3.6) + "km/h　リング " + R.rings + "/" + RING_S.length + (R.up < -.25 ? "　さかさま！" : ""); },
    end(g, R){ clearRoot(); bodyOn("loop", false); }
};

function ensure(R){
    bodyOn("loop", true); const r = root(), h = R.hud; clearRoot();
    h.big = el("div", "xbig", "", "top:20%;font-size:clamp(42px,11vw,100px);color:#ffe27a"); h.stat = el("div", "xh", "", "left:12px;top:86px;line-height:1.2"); h.g = el("div", "xh", "", "right:12px;top:150px;text-align:right"); h.inv = el("div", "xbig", "", "top:36%;font-size:clamp(26px,6vw,56px);color:#ff9ad8;opacity:0");
    h.bar = el("div", "xbar", "<i></i>", "top:6px"); h.pose = el("div", "xh", "🙌", "left:50%;bottom:5vh;transform:translateX(-50%);font-size:clamp(70px,16vw,150px);opacity:0;transition:opacity .15s");
    h.btn = el("div", "xbtn", "🙌", "right:14px;bottom:calc(9vh + 8px);width:72px;height:72px"); h.btn.addEventListener("pointerdown", (e) => { e.preventDefault(); R.banzaiReq = true; h.btn.classList.add("on"); }); h.btn.addEventListener("pointerup", () => h.btn.classList.remove("on")); h.btn.addEventListener("pointercancel", () => h.btn.classList.remove("on"));
    for(const e of [h.big, h.stat, h.g, h.inv, h.bar, h.pose, h.btn]) r.appendChild(e);
}
function updateHud(R){
    const h = R.hud; if(!h.big) return; const T = R.T;
    const cd = R.t < START_WAIT ? Math.ceil(START_WAIT - R.t) : 0; h.big.textContent = cd > 0 && cd <= 3 ? String(cd) : (R.rt < 1 ? "しゅっぱつ！" : ""); h.big.style.opacity = (cd > 0 && cd <= 3) || R.rt < 1 ? 1 : 0;
    h.stat.innerHTML = "<div class='sc'>" + Math.round(R.v * 3.6) + "<small> km/h</small></div><small>リング " + R.rings + " / " + RING_S.length + "　ばんざい " + R.banzai + "</small>";
    const gv = R.gUp; h.g.innerHTML = "<div class='sc' style='color:" + (gv > 4 ? "#ff7a7a" : gv < 0 ? "#9ad8ff" : "#fff") + "'>" + gv.toFixed(1) + "<small> G</small></div>";
    h.bar.firstChild.style.width = Math.round(R.s / T.total * 100) + "%"; h.inv.textContent = R.up < -.25 && R.rt > 0 ? "さかさま！！" : ""; h.inv.style.opacity = R.up < -.25 ? 1 : 0; h.pose.style.opacity = R.pose > 0 ? 1 : 0;
}
