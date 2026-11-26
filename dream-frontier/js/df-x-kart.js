// ===== ドリーム・ランナー・グランプリ（3D ランナー・レース）=====
//  ライバルの ランナー 3にんと 2しゅう きそう。↑/W ダッシュ ↓/S ゆっくり ←→/AD ほうこう（スマホは スティック）。E（スマホは Eボタン）で スーパーダッシュ。
//  光る「ダッシュのたま」を あつめると ゲージが たまる。ひかる ダッシュパネルを ふむと ビューン！
//  3いまでに ゴールすると スタンプ。150びょう いない。ライバルは ひとりだけ ひきはなせない ように ちょうせいされているよ。
//  （前は カート だった。ランナーに かえた：ファイル名・のりもの種類の id は「kart」のまま ＝ 保存データ（スタンプ）を そのまま つかえるように）
import {TAU, clamp, lerp, wrapPi, root, clearRoot, el, bodyOn} from "./df-xlib.js";

export const CX = 0, CZ = 2600, ROAD_W = 14, WALL = ROAD_W / 2 + 3.4, LAPS = 2, TIME = 150, VMAX = 13.5, DS = 2;
const RUN_FR = 6;   // はしる ポーズの コマ数（1しゅうきあたり）
const CTRL = [[0, -60], [70, -60], [125, -48], [150, -10], [140, 35], [100, 60], [60, 45], [40, 70], [0, 85], [-50, 75], [-100, 50], [-135, 10], [-125, -30], [-70, -60]];
const KCOL = [{b: "#ff5a7a", h: "#ffffff", n: "あなた", sk: "#ffd9b8", sh: "#3a3a6a"}, {b: "#4aa8ff", h: "#ffe27a", n: "ブルー", sk: "#e8b890", sh: "#2a2a4a"}, {b: "#ffc94a", h: "#ff5a7a", n: "サニー", sk: "#ffd0a8", sh: "#5a3a2a"}, {b: "#6ad87a", h: "#2a2a5a", n: "ミント", sk: "#c89a78", sh: "#2a4a3a"}];
const PADS = [160, 340, 530], ORB_S = [60, 110, 200, 250, 290, 400, 450, 480, 560, 600];

let TRK = null;
export function track(){
    if(TRK) return TRK;
    const n0 = CTRL.length, dense = [], cr = (a, b, c, d, t) => .5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
    for(let i = 0; i < n0; i++){ const p0 = CTRL[(i + n0 - 1) % n0], p1 = CTRL[i], p2 = CTRL[(i + 1) % n0], p3 = CTRL[(i + 2) % n0]; for(let k = 0; k < 24; k++){ const t = k / 24; dense.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]); } }
    // ならんだ きょりで 2m ごとに さいサンプル
    const cum = [0]; for(let i = 1; i <= dense.length; i++){ const a = dense[i - 1], b = dense[i % dense.length]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const total = cum[cum.length - 1], n = Math.round(total / DS), ds = total / n, pts = []; let j = 0;
    for(let i = 0; i < n; i++){ const d = i * ds; while(cum[j + 1] < d) j++; const a = dense[j], b = dense[(j + 1) % dense.length], u = (d - cum[j]) / (cum[j + 1] - cum[j]); pts.push({x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u)}); }
    for(let i = 0; i < n; i++){ const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n]; pts[i].h = Math.atan2(b.x - a.x, b.z - a.z); }
    for(let i = 0; i < n; i++){ const a = pts[(i + n - 2) % n], b = pts[(i + 2) % n]; pts[i].k0 = wrapPi(b.h - a.h) / (4 * ds); }
    for(let i = 0; i < n; i++){ let s = 0; for(let q = -3; q <= 3; q++) s += pts[(i + q + n) % n].k0; pts[i].k = s / 7; }
    TRK = {pts, n, ds, L: n * ds, minX: Math.min(...pts.map((p) => p.x)) - 20, maxX: Math.max(...pts.map((p) => p.x)) + 20, minZ: Math.min(...pts.map((p) => p.z)) - 20, maxZ: Math.max(...pts.map((p) => p.z)) + 20};
    return TRK;
}
const rightOf = (h) => [-Math.cos(h), Math.sin(h)];   // みぎ むき（上から みて）
const at = (T, i, lat) => { const p = T.pts[((i % T.n) + T.n) % T.n], r = rightOf(p.h); return [p.x + r[0] * (lat || 0), p.z + r[1] * (lat || 0), p.h]; };
// コース上の いちを さがす（ヒントの ちかく だけ しらべる）
function locate(T, x, z, hint){
    let best = 1e9, bi = hint; for(let d = -24; d <= 24; d++){ const i = ((hint + d) % T.n + T.n) % T.n, p = T.pts[i], q = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z); if(q < best){ best = q; bi = i; } }
    const p = T.pts[bi], r = rightOf(p.h); return {i: bi, lat: (x - p.x) * r[0] + (z - p.z) * r[1]};
}

export const kart = {
    build(K){
        const {box, cyl, sph, pln} = K.h, L = K.mk("kart", {tex: "grass", glowTint: [.8, .8, .8, .8], cloudA: .8}), S = L.solid, G = L.ground, GL = L.glow, CL = L.cloud, T = track();
        pln(G, CX, 0, CZ, 1000, 1000, "#7bd86a", 120, 120);
        // ろめん・縁石・かべ
        for(let i = 0; i < T.n; i++){
            const p = T.pts[i], a = T.pts[(i + 1) % T.n], mx = (p.x + a.x) / 2 + CX, mz = (p.z + a.z) / 2 + CZ, h = p.h;
            box(S, mx, -.04, mz, ROAD_W, .12, DS + .7, i % 2 ? "#c8573a" : "#c05033", h);
            if(i % 2 === 0) for(const side of [-1, 1]){ const r = rightOf(h), o = side * (ROAD_W / 2 + .5); box(S, mx + r[0] * o, .02, mz + r[1] * o, 1.1, .16, DS * 2, ((i / 2) | 0) % 2 ? "#ff4a5a" : "#ffffff", h); }
            if(i % 2 === 1) for(const side of [-1, 1]){ const r = rightOf(h), o = side * (WALL + .6); box(S, mx + r[0] * o, .42, mz + r[1] * o, 1.3, .84, DS * 2.1, ((i >> 1) % 3) === 0 ? "#ffd24a" : "#4a4a5a", h); }
            if(i % 5 === 0){ const r = rightOf(h); box(S, mx, .05, mz, .3, .1, 1.4, "#fffbe0", h); for(const o of [-ROAD_W / 2 + 1.2, ROAD_W / 2 - 1.2]) box(S, mx + r[0] * o, .05, mz + r[1] * o, .18, .1, DS * 1.6, "#ffffff", h); }
        }
        // スタートライン（チェッカー）と ゲート
        { const p = T.pts[0], r = rightOf(p.h), f = [Math.sin(p.h), Math.cos(p.h)];
            for(let a = 0; a < 10; a++) for(let b = 0; b < 2; b++){ const o = (a - 4.5) * (ROAD_W / 10); box(S, p.x + CX + r[0] * o + f[0] * (b - .5) * 1.1, .05, p.z + CZ + r[1] * o + f[1] * (b - .5) * 1.1, ROAD_W / 10, .14, 1.1, (a + b) % 2 ? "#ffffff" : "#222233", p.h); }
            for(const side of [-1, 1]){ const o = side * (ROAD_W / 2 + 1.4); cyl(S, p.x + CX + r[0] * o, 0, p.z + CZ + r[1] * o, .5, .6, 8.5, "#ffffff", 8); }
            box(S, p.x + CX, 7.6, p.z + CZ, ROAD_W + 4, 2.2, 1.1, "#ff5a7a", p.h); for(let a = 0; a < 14; a++) for(let b = 0; b < 2; b++) box(S, p.x + CX + r[0] * ((a - 6.5) * 1.3), 7.6 + b * 1.1, p.z + CZ + r[1] * ((a - 6.5) * 1.3) - 0, 1.3, 1.1, 1.2, (a + b) % 2 ? "#ffffff" : "#222233", p.h); }
        // ブーストパッド
        for(const s of PADS){ const [x, z, h] = at(T, Math.round(s / DS), 0), f = [Math.sin(h), Math.cos(h)]; for(let k = 0; k < 3; k++) box(GL, x + CX + f[0] * (k - 1) * 1.6, .1, z + CZ + f[1] * (k - 1) * 1.6, 6.4, .06, 1.1, ["#46e6ff", "#7affd8", "#ffe27a"][k], h); }
        // スタンド・木・山・くも
        { const p = T.pts[Math.round(20 / DS)], r = rightOf(p.h), f = [Math.sin(p.h), Math.cos(p.h)], base = [p.x + r[0] * -(WALL + 8), p.z + r[1] * -(WALL + 8)];
            for(let row = 0; row < 4; row++){ box(S, base[0] + CX - r[0] * row * 2.1, row * 1.5, base[1] + CZ - r[1] * row * 2.1, 2.1, 1.5 + .01, 42, row % 2 ? "#9a9ab8" : "#b8b8d0", p.h); for(let q = 0; q < 14; q++) sph(S, base[0] + CX - r[0] * row * 2.1 + f[0] * (q - 6.5) * 2.8 + .0, row * 1.5 + 2.1, base[1] + CZ - r[1] * row * 2.1 + f[1] * (q - 6.5) * 2.8, .5, ["#ff7a9a", "#ffd24a", "#7ad0ff", "#a8e88a", "#ffffff"][(q + row * 2) % 5], 1, 5); }
            box(S, base[0] + CX - r[0] * 9, 7.6, base[1] + CZ - r[1] * 9, 11, .5, 44, "#ff7a9a", p.h); for(const q of [-20, 20]) cyl(S, base[0] + CX - r[0] * 9 + f[0] * q, 0, base[1] + CZ - r[1] * 9 + f[1] * q, .35, .35, 7.6, "#ffffff", 6); }
        let sd = 11; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
        const nearRoad = (x, z) => { let m = 1e9; for(let i = 0; i < T.n; i += 2){ const p = T.pts[i], d = Math.hypot(p.x - x, p.z - z); if(d < m) m = d; } return m; };
        for(let i = 0, t = 0; i < 400 && t < 110; i++){ const x = T.minX - 40 + rnd() * (T.maxX - T.minX + 80), z = T.minZ - 40 + rnd() * (T.maxZ - T.minZ + 80); if(nearRoad(x, z) < WALL + 7) continue; if(x < -70 && x > -150 && z < -20 && z > -90 && false) continue; t++;
            const k = rnd(); if(k < .6){ cyl(S, x + CX, 0, z + CZ, .35, .5, 2.4, "#8a6a4a", 6); sph(S, x + CX, 3.6, z + CZ, 2 + rnd() * .9, ["#58c84a", "#46b43c", "#6fd85a"][i % 3], 1.15, 7); } else if(k < .85){ cyl(S, x + CX, 0, z + CZ, .3, .4, 1.8, "#8a6a4a", 6); for(let q = 0; q < 6; q++) sph(S, x + CX + Math.cos(q) * 1.1, 2.2, z + CZ + Math.sin(q) * 1.1, .8, ["#ff7a9a", "#ffd24a", "#ffffff"][q % 3], 1, 5); } else { sph(S, x + CX, .8, z + CZ, 1.3 + rnd(), "#8a8a9a", .7, 6); } }
        for(let i = 0; i < 18; i++){ const a = i / 18 * TAU, r = 380 + rnd() * 40, hh = 40 + rnd() * 70; cyl(S, CX + Math.cos(a) * r, 0, CZ + Math.sin(a) * r, 0, hh * .9, hh, ["#6aa8d8", "#8ab8e8", "#7ac898"][i % 3], 7); cyl(S, CX + Math.cos(a) * r, hh * .72, CZ + Math.sin(a) * r, 0, hh * .22, hh * .28, "#ffffff", 7); }
        for(let i = 0; i < 40; i++){ const a = rnd() * TAU, r = 150 + rnd() * 250, y = 32 + rnd() * 38; for(let k = 0; k < 4; k++) sph(CL, CX + Math.cos(a) * r + k * 3, y + (k % 2), CZ + Math.sin(a) * r, 4 + rnd() * 2.2, "#ffffff", .5, 7); }
        for(let i = 0; i < 6; i++){ const a = (i + .5) / 6 * TAU, r = 250; const x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r; cyl(S, x, 0, z, .3, .3, 20, "#ffffff", 6); sph(S, x, 22, z, 2.8, ["#ff5a7a", "#4aa8ff", "#ffc94a"][i % 3], 1.2, 8); }
        // ランナー 4にん：はしる ポーズ 6コマ ＋ たちポーズ（モデル名  x_kart{ci}_{0..5} / x_kart{ci}_i ）。まえ＝+z
        const limb = (p, x, y, z, w, len, d, col, th) => box(p, x, y, z, w, len, d, col, 0, Math.PI + th);   // つけね（かた・こし）を じくに、したむきに ふる。th が + で うしろ
        KCOL.forEach((c, i) => {
            for(let f = 0; f <= RUN_FR; f++){
                const idle = f === RUN_FR, ph = idle ? 0 : f / RUN_FR * TAU, sw = idle ? 0 : Math.sin(ph), lean = idle ? .03 : .2, HIP = .9;
                const p = K.h.model("x_kart" + i + "_" + (idle ? "i" : f)).prims;
                for(const side of [-1, 1]){
                    const th = (side > 0 ? sw : -sw) * 1.0 + (idle ? 0 : .08), x = side * .15;
                    limb(p, x, HIP, 0, .2, .86, .22, c.sk, th); limb(p, x, HIP, 0, .25, .4, .27, c.sh, th);   // あし ＋ ショートパンツ
                    const ey = HIP - .86 * Math.cos(th), ez = -.86 * Math.sin(th); box(p, x, ey, ez + .06, .22, .13, .36, "#f4f4ff");   // くつ
                    const ah = (side > 0 ? -sw : sw) * .95 - (idle ? 0 : .35);   // うで：あしと はんたいに ふる（ひじを まえに）
                    const sx = side * .31, sy = HIP + .62 * Math.cos(lean) - .06, sz = .62 * Math.sin(lean);
                    limb(p, sx, sy, sz, .15, .56, .15, c.sk, ah); limb(p, sx, sy, sz, .19, .22, .19, c.b, ah);   // うで ＋ そで
                }
                box(p, 0, HIP, 0, .48, .64, .29, c.b, 0, lean); box(p, 0, HIP + .3, .03, .2, .3, .02, "#ffffff", 0, lean);   // からだ ＋ ゼッケン
                const hy = HIP + .64 * Math.cos(lean) + .2, hz = .64 * Math.sin(lean) + .04;
                sph(p, 0, hy, hz, .2, c.sk, 1, 10); sph(p, 0, hy + .07, hz - .02, .215, c.h, .72, 10);   // あたま ＋ ぼうし
                box(p, 0, hy + .03, hz + .17, .46, .04, .22, c.h);   // ぼうしの つば
                for(const ex of [-.075, .075]) sph(p, ex, hy - .01, hz + .185, .03, "#222233", 1, 5);   // め
            }
        });
    },
    init(g, R, a){
        const T = track(), grid = [{s: -3, lat: -2.6}, {s: -7, lat: 2.6}, {s: -11, lat: -2.6}, {s: -15, lat: 2.6}], order = [3, 2, 1, 0]; // あなたは いちばん うしろ
        const ks = order.map((ci, slot) => { const gi = grid[slot], idx = ((Math.round(gi.s / DS) % T.n) + T.n) % T.n, [x, z, h] = at(T, idx, gi.lat); return {ci, ai: ci !== 0, x, z, h, v: 0, idx, lat: gi.lat, lapN: -1, boostT: 0, wallCd: 0, hitCd: 0, fin: 0, place: 0, lane: ci === 1 ? -3 : ci === 2 ? 2.6 : ci === 3 ? .4 : 0, skill: ci === 1 ? .955 : ci === 2 ? .94 : ci === 3 ? .925 : 1, total: gi.s, steer: 0}; });
        Object.assign(R, {T, ks, me: ks.find((k) => k.ci === 0), gauge: 0, orbs: ORB_S.map((s, i) => ({s, lat: i % 2 ? 3 : -3, got: false})), cd: 3.0, started: false, fin: 0, win: false, place: 0, camYaw: ks[0].h, roll: 0, fov: 66, T0: 0, tm: 0, hud: {}, cr: 0});
        R.rank = 4; R.finCount = 0; ensure(R);
    },
    update(g, R, dt, inp){
        const T = R.T, me = R.me;
        // カウントダウン
        if(R.cd > 0){ const before = Math.ceil(R.cd); R.cd -= dt; const after = Math.ceil(Math.max(0, R.cd)); if(after !== before){ g.sfx(after > 0 ? "clue" : "gold"); } if(R.cd <= 0){ R.started = true; R.tm = 0; } }
        else R.tm += dt;
        const auto = !!R.auto;
        for(const k of R.ks){
            let steer = 0, thr = 0, brk = 0, usePad = false;
            if(R.started && !k.fin){
                if(k.ci === 0 && !auto){ steer = inp.mx || 0; thr = clamp(inp.my || 0, 0, 1); brk = clamp(-(inp.my || 0), 0, 1); if(inp.act) useTurbo(g, R, k); }
                else { const c = drive(R, k, k.ci === 0 ? {lane: 0, skill: 1.02, plan: true} : null); steer = c.steer; thr = c.thr; brk = c.brk; if(k.ci === 0 && R.gauge >= .5 && Math.abs(T.pts[k.idx].k) < .008) useTurbo(g, R, k); }
            } else if(k.fin){ const c = drive(R, k, {lane: 0, skill: .5, plan: false}); steer = c.steer; thr = c.thr * .5; brk = c.brk; }
            move(g, R, k, dt, steer, thr, brk);
        }
        // ランナー どうしの ぶつかり
        for(let i = 0; i < R.ks.length; i++) for(let j = i + 1; j < R.ks.length; j++){
            const a = R.ks[i], b = R.ks[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
            if(d < 1.3 && d > .001){ const push = (1.3 - d) / 2, nx = dx / d, nz = dz / d; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push; const rv = (a.v - b.v) * .25; if(Math.abs(a.v - b.v) > 1){ if(a.v > b.v){ a.v -= rv * .6; b.v += rv * .4; } else { b.v += rv * .6; a.v -= rv * .4; } } if((a === me || b === me) && me.hitCd <= 0){ me.hitCd = .5; g.sfx("hit"); } }
        }
        // ダッシュの たま・パッド
        const mp = me.idx * DS; for(const o of R.orbs){ if(o.got) continue; let d = Math.abs(o.s - mp); d = Math.min(d, T.L - d); if(d < 3 && Math.abs(me.lat - o.lat) < 2.4){ o.got = true; R.gauge = Math.min(1, R.gauge + .25); g.sfx("coin"); } }
        // せいせき
        R.ks.forEach((k) => { if(!k.fin) k.total = k.lapN * T.L + k.idx * DS; });
        if(!me.fin){ if(me.lapN >= LAPS) finishKart(g, R, me); }
        for(const k of R.ks) if(k.ai && !k.fin && k.lapN >= LAPS){ k.fin = ++R.finCount; k.place = k.fin; }
        R.rank = 1 + R.ks.filter((k) => k !== me && (k.fin ? (!me.fin || k.fin < me.fin) : (!me.fin && k.total > me.total))).length;
        if(me.fin){ if(R.t - R.finT > 5.5) g.endRide(R.win, true); }
        else if(R.started && R.tm >= TIME){ me.fin = 99; R.finT = R.t; R.win = false; g.ui.toast("じかんぎれ…！ もういちど ちょうせん しよう", 4200); g.sfx("ng"); }
        // カメラ・HUD
        R.camYaw += wrapPi(me.h - R.camYaw) * Math.min(1, dt * 5.5); const tr = clamp(((me.steerS || 0)) * .05, -.06, .06); R.roll += (tr - R.roll) * Math.min(1, dt * 6);
        R.fov += ((66 + 12 * clamp(me.v / VMAX, 0, 1.2) + (me.boostT > 0 ? 8 : 0)) - R.fov) * Math.min(1, dt * 4);
        updateHud(R); R.cr = (R.cr || 0) + dt;
    },
    camera(g, R){
        const me = R.me, d = 5.6, h = 2.9, cy = R.camYaw, shake = me.boostT > 0 ? .05 : 0;
        return {eye: [CX + me.x - Math.sin(cy) * d, h + Math.sin(R.cr * 60) * shake, CZ + me.z - Math.cos(cy) * d], yaw: cy, pitch: -.17, fov: R.fov, roll: R.roll};
    },
    dyn(g, R, D){
        const T = g.t;
        for(const k of R.ks){
            const moving = (k.v || 0) > .7, fr = moving ? Math.floor((((k.ph || 0) / TAU) % 1 + 1) % 1 * RUN_FR) % RUN_FR : "i", bob = moving ? Math.abs(Math.sin(k.ph || 0)) * .1 : 0;
            D.push({m: "x_kart" + k.ci + "_" + fr, x: CX + k.x, y: bob, z: CZ + k.z, yaw: k.h});
            if(k.boostT > 0){ const f = [Math.sin(k.h), Math.cos(k.h)]; D.push({s: "glow", x: CX + k.x - f[0] * 1.9, y: .8, z: CZ + k.z - f[1] * 1.9, w: 2.4 + Math.sin(T * 40) * .4, h: 2.4, c: [.4, .9, 1], a: .9}); D.push({s: "glow", x: CX + k.x - f[0] * 2.6, y: .8, z: CZ + k.z - f[1] * 2.6, w: 1.5, h: 1.5, c: [1, .9, .4], a: .8}); }
        }
        for(const o of R.orbs){ if(o.got) continue; const [x, z] = at(R.T, Math.round(o.s / DS), o.lat), y = 1.3 + Math.sin(T * 3 + o.s) * .25; D.push({m: "star", x: CX + x, y, z: CZ + z, yaw: T * 2, sx: .8, sy: .8, sz: .8}); D.push({s: "glow", x: CX + x, y: y + .2, z: CZ + z, w: 2.4, h: 2.4, c: [.4, .9, 1], a: .75}); }
    },
    hud(R){ return "いちい " + R.rank + "/4　" + clamp(R.me.lapN + 1, 1, LAPS) + "しゅうめ /" + LAPS + "　E：スーパーダッシュ（ゲージ " + Math.round(R.gauge * 100) + "%）　のこり " + Math.max(0, Math.ceil(TIME - R.tm)) + "びょう"; },
    end(g, R){ clearRoot(); bodyOn("kart", false); }
};

function useTurbo(g, R, k){ if(R.gauge >= .3 && k.boostT < .5){ k.boostT = 1 + R.gauge * 1.2; R.gauge = 0; g.sfx("fan"); } }
function finishKart(g, R, me){
    const placed = R.finCount + 1; me.fin = ++R.finCount; R.finT = R.t; R.place = placed; R.win = placed <= 3;
    g.sv.best_kart = Math.min(g.sv.best_kart || 9, placed);
    g.ui.toast(R.win ? ("🏁 ゴール！ " + placed + "い！" + (placed === 1 ? "  ゆうしょう！ +40コイン" : "")) : "🏁 ゴール！ 4い… もういちど ちょうせん！", 5200); if(placed === 1) g.sv.coins += 40; g.sfx(R.win ? "gold" : "ng");
}
// 1だいの うごき
function move(g, R, k, dt, steerIn, thr, brk){
    const T = R.T, onRoad = Math.abs(k.lat) < ROAD_W / 2 + 1.0, vmaxBase = VMAX * (k.ai ? k.skill * (k.band || 1) : 1), vmax = (onRoad ? vmaxBase : 6.2) * (k.boostT > 0 ? 1.3 : 1);
    k.ph = (k.ph || 0) + dt * TAU * (.9 + Math.max(0, k.v) * .17) * (k.v > .7 ? 1 : 0);
    k.steerS = steerIn; k.boostT = Math.max(0, k.boostT - dt); k.wallCd = Math.max(0, k.wallCd - dt); k.hitCd = Math.max(0, k.hitCd - dt);
    let a = thr * 9.5 * (1 - clamp(k.v / (vmax * 1.12), 0, 1)) - brk * (k.v > 0 ? 19 : 5) - (onRoad ? .12 : 1.6) * k.v * Math.abs(k.v) / 12.3;
    if(k.boostT > 0) a += 8.5; k.v += a * dt; if(k.v > vmax) k.v -= (k.v - vmax) * Math.min(1, dt * 3); if(k.v < -2.5) k.v = -2.5;
    const rate = steerIn * (2.3 - .9 * clamp(k.v / VMAX, 0, 1)) * clamp(k.v / 2.6, -.5, 1); k.h -= rate * dt;
    k.x += Math.sin(k.h) * k.v * dt; k.z += Math.cos(k.h) * k.v * dt;
    const loc = locate(T, k.x, k.z, k.idx); const prev = k.idx; k.idx = loc.i; k.lat = loc.lat;
    if(prev > T.n * .75 && k.idx < T.n * .25){ k.lapN++; if(k === R.me){ R.orbs.forEach((o) => o.got = false); if(k.lapN >= 0 && k.lapN < LAPS) g.ui.toast((k.lapN + 1) + "しゅうめ / " + LAPS + (k.lapN === LAPS - 1 ? "  ラストの 1しゅう！" : ""), 2200); } }
    else if(prev < T.n * .25 && k.idx > T.n * .75) k.lapN--;
    if(Math.abs(k.lat) > WALL){   // かべ
        const p = T.pts[k.idx], r = rightOf(p.h), over = k.lat - Math.sign(k.lat) * WALL; k.x -= r[0] * over; k.z -= r[1] * over; k.lat = Math.sign(k.lat) * WALL;
        const dh = wrapPi(p.h - k.h); k.h += dh * .35; if(k.wallCd <= 0){ k.wallCd = .35; k.v *= .62; if(k === R.me) g.sfx("boo"); }
    }
    for(let i = 0; i < PADS.length; i++){ const s = PADS[i], d = Math.min(Math.abs(k.idx * DS - s), T.L - Math.abs(k.idx * DS - s)); if(d < 3.4 && Math.abs(k.lat) < 4 && k.boostT < .7){ k.boostT = 1.2; if(k === R.me) g.sfx("fan"); } }
}
// コンピューターの ランナー：コースを おいかけて、カーブの まえで スピードを おとす
function drive(R, k, o){
    const T = R.T, v = Math.max(0, k.v), look = 4 + v * .55, ti = k.idx + Math.max(3, Math.round(look / DS));
    const lane = o ? o.lane : k.lane + Math.sin(R.tm * .3 + k.ci * 2) * 1.8, skill = o ? o.skill : 1;
    const [tx, tz] = at(T, ti, clamp(lane, -ROAD_W / 2 + 2, ROAD_W / 2 - 2)); let want = Math.atan2(tx - k.x, tz - k.z), diff = wrapPi(want - k.h);
    let km = 0; for(let q = 0; q < 28; q++) km = Math.max(km, Math.abs(T.pts[(k.idx + q) % T.n].k)); const kk = Math.max(km, 1e-3);
    // ライバルは プレイヤーに ちかい ように ゴムひも
    let band = 1; if(k.ai && k.ci !== 0){ const gap = k.total - R.me.total; band = clamp(1 - gap * .0011, .93, 1.07); k.band = band; }
    const vt = Math.min(VMAX * skill * (k.ai ? k.skill * band : 1) * 1.05, Math.sqrt(11 / kk) * (k.ai && k.ci !== 0 ? .98 : 1.02)) * (k.boostT > 0 ? 1.25 : 1);
    const steer = clamp(-diff * 2.6, -1, 1);
    let thr = v < vt ? 1 : 0, brk = v > vt + 1.5 ? clamp((v - vt) / 6, 0, 1) : 0; if(Math.abs(k.lat) > ROAD_W / 2) thr *= .6;
    return {steer, thr, brk};
}

// ---- HUD ----
function ensure(R){
    bodyOn("kart", true); const r = root(); clearRoot();
    const T = R.T, W = 190, H = 190, sx = (W - 16) / (T.maxX - T.minX), sz = (H - 16) / (T.maxZ - T.minZ), s = Math.min(sx, sz);
    const cv = el("canvas", "xmap", "", "width:" + W / 1.5 + "px;height:" + H / 1.5 + "px;right:10px;top:104px"); cv.width = W; cv.height = H; r.appendChild(cv); R.map = cv; R.mctx = cv.getContext("2d"); R.ms = s;
    R.hud.big = el("div", "xbig", "", "top:22%;font-size:clamp(46px,12vw,110px);color:#ffe27a"); R.hud.pos = el("div", "xh", "", "left:12px;top:86px;line-height:1.15"); R.hud.spd = el("div", "xh", "", "right:12px;bottom:58px;text-align:right"); R.hud.gauge = el("div", "xh", "<div style='width:min(46vw,260px);height:14px;border:2px solid #fff;border-radius:9px;background:rgba(10,14,40,.6);overflow:hidden'><i style='display:block;height:100%;width:0;background:linear-gradient(90deg,#46e6ff,#7affd8,#ffe27a)'></i></div><small>スーパーダッシュ（E）</small>", "left:50%;transform:translateX(-50%);bottom:56px;text-align:center");
    for(const e of [R.hud.big, R.hud.pos, R.hud.spd, R.hud.gauge]) r.appendChild(e);
}
function updateHud(R){
    const me = R.me, T = R.T, h = R.hud; if(!h.big) return;
    h.big.textContent = R.cd > 0 ? String(Math.ceil(R.cd)) : (R.tm < .8 ? "GO!" : ""); h.big.style.opacity = R.cd > 0 || R.tm < .8 ? 1 : 0;
    h.pos.innerHTML = "<div class='sc'>" + R.rank + "<small> / 4 い</small></div><small>" + clamp(me.lapN + 1, 1, LAPS) + " しゅうめ / " + LAPS + "</small>";
    h.spd.innerHTML = "<div class='sc'>" + Math.round(Math.max(0, me.v) * .7) + "<small> m/びょう</small></div>"; h.gauge.firstChild.firstChild.style.width = Math.round(R.gauge * 100) + "%";
    if(!R.mctx) return; const c = R.mctx, W = 190, H = 190, s = R.ms, px = (x) => W - 8 - (x - T.minX) * s, pz = (z) => H - 8 - (z - T.minZ) * s;
    c.clearRect(0, 0, W, H); c.lineWidth = 7; c.strokeStyle = "rgba(255,255,255,.55)"; c.lineJoin = "round"; c.beginPath(); for(let i = 0; i <= T.n; i += 3){ const p = T.pts[i % T.n]; if(i === 0) c.moveTo(px(p.x), pz(p.z)); else c.lineTo(px(p.x), pz(p.z)); } c.closePath(); c.stroke();
    for(const k of R.ks){ c.fillStyle = KCOL[k.ci].b; c.beginPath(); c.arc(px(k.x), pz(k.z), k.ci === 0 ? 6 : 4.5, 0, TAU); c.fill(); if(k.ci === 0){ c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); } }
}
