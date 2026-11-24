// ===== ふわふわ・スカイジャンプ（3D アクション）=====
//  空に うかぶ しまを ジャンプで わたって ほしを あつめる。E（スマホは Eボタン）で ジャンプ、空中で もう1かい おすと 2だん ジャンプ。
//  うごく ゆか・バネ・チェックポイントつき。ほし 10こ いじょうで ゴールすると スタンプ。120びょう いない。
import {TAU, clamp, lerp, wrapPi, root, clearRoot, el, bodyOn} from "./df-xlib.js";

const JX = -1300, JZ = 1300, TIME = 120, NEED = 10, G = 24, VJ = 9.6, VJ2 = 8.6, VSPRING = 17.5, SPEED = 6.6, RAD = .38, FALL_Y = -26;
// [かくど(0=おく), すきま, たかさの ちがい, おおきさ, しゅるい, ほし?, うごき]
const SEQ = [
    [0, 3.0, .4, 6, "s", 1], [14, 3.4, .5, 5, "s", 1], [26, 3.6, .4, 5, "s", 1], [0, 3.6, .6, 4.6, "s", 1], [-22, 3.2, .5, 5, "m", 0, {ax: "x", amp: 3, per: 4.4}],
    [-30, 3.2, .4, 5, "s", 1], [-10, 3.6, .8, 4.4, "s", 1], [0, 3.8, .6, 7, "c", 0], [10, 3.2, .3, 4.6, "s", 1], [20, 3.8, .9, 4.2, "s", 1],
    [0, 3.4, 1.0, 4.4, "p", 0], [0, 4.2, 4.6, 5.6, "s", 1], [14, 3.4, .4, 5, "m", 1, {ax: "y", amp: 1.4, per: 4.2}], [28, 3.2, .5, 4.6, "s", 1], [10, 3.6, .6, 4.6, "s", 0],
    [-16, 3.8, .5, 4.4, "s", 1], [-30, 3.2, .4, 7, "c", 0], [-10, 3.6, .8, 4.4, "s", 1], [0, 3.6, .8, 4.4, "m", 0, {ax: "x", amp: 2.6, per: 3.8}], [0, 3.8, .6, 4.4, "s", 1],
    [14, 3.4, 1.0, 4.6, "p", 0], [10, 4.4, 4.2, 5.4, "s", 1], [0, 3.6, .5, 4.8, "s", 1], [-20, 3.4, .6, 4.4, "s", 1], [-10, 3.2, .6, 4.4, "s", 1], [0, 3.8, .6, 13, "g", 0]
];
const STAR_EXTRA = [[8, 0, 3.4], [11, 0, 6.8], [21, 0, 6.8]];   // しまの よこに ういている ごほうびの ほし（バネ・ジャンプの さきなど）

export function course(){
    const P = [{x: JX, y: 0, z: JZ, w: 10, d: 10, t: "g0", star: false, mv: null}]; let cur = P[0], dirA = 0;
    for(const [ang, gap, dy, size, t, star, mv] of SEQ){
        dirA = Math.max(-1.1, Math.min(1.1, dirA * .6 + ang * Math.PI / 180));   // ゆるやかに ま がる
        const rp = Math.max(cur.w, cur.d) / 2, rn = size / 2, dist = rp + gap + rn;
        const nx = cur.x + Math.sin(dirA) * dist, nz = cur.z + Math.cos(dirA) * dist;
        cur = {x: nx, y: cur.y + dy, z: nz, w: size, d: size, t, star: !!star, mv: mv || null}; P.push(cur);
    }
    return P;
}
export const starAt = (R, s, t) => { if(!s.mov) return {x: s.x, y: s.y, z: s.z}; const c = posOf(R.P[s.pi], t); return {x: c.x, y: c.y + 1.7, z: c.z}; };
export const posOf = (p, t) => {
    if(!p.mv) return {x: p.x, y: p.y, z: p.z};
    const o = p.mv.amp * Math.sin(t * TAU / p.mv.per + (p.mv.ph || 0));
    return {x: p.x + (p.mv.ax === "x" ? o : 0), y: p.y + (p.mv.ax === "y" ? o : 0), z: p.z + (p.mv.ax === "z" ? o : 0)};
};

export const jump = {
    build(K){
        const {box, cyl, sph, pln} = K.h, L = K.mk("jump", {tex: "grass", cloudA: .85}), S = L.solid, CL = L.cloud, GL = L.glow, P = course();
        const M = K.h.model("x_plat").prims; box(M, 0, 0, 0, 4.6, .5, 4.6, "#ffb04a"); box(M, 0, .5, 0, 4.2, .1, 4.2, "#fff0c8"); cyl(M, 0, -1.4, 0, .1, 1.6, 1.4, "#e8903a", 8);
        const SP = K.h.model("x_spring").prims; cyl(SP, 0, 0, 0, .8, .9, .35, "#44485a", 10); cyl(SP, 0, .35, 0, .2, .2, .5, "#d0d4e0", 8); cyl(SP, 0, .85, 0, 1.0, 1.0, .28, "#ff4a7a", 12);
        const FL = K.h.model("x_flag").prims; cyl(FL, 0, 0, 0, .12, .16, 5, "#f0f0f8", 6); box(FL, .7, 3.6, 0, 1.4, .9, .08, "#ff5a8a"); sph(FL, 0, 5.1, 0, .25, "#ffe27a", 1, 6);
        for(const p of P){
            if(p.mv) continue;
            const r = Math.max(p.w, p.d) / 2, top = p.y;
            box(S, p.x, top - 1.5, p.z, p.w, 1.3, p.d, "#8a6a4a"); box(S, p.x, top - .2, p.z, p.w + .2, .2, p.d + .2, p.t === "g" ? "#ffd86a" : "#6fcf5a");
            cyl(S, p.x, top - 6.2, p.z, r * .8, .3, 4.7, "#7a5a3a", 8);
            if(p.t === "c"){ cyl(S, p.x, top, p.z, .14, .18, 4, "#e0e0f0", 6); box(S, p.x + .6, top + 2.9, p.z, 1.2, .8, .08, "#5ac8ff"); }
            if(p.t === "g"){ cyl(S, p.x, top, p.z, .2, .24, 6.5, "#f4f4ff", 6); box(S, p.x + .9, top + 4.7, p.z, 1.8, 1.2, .1, "#ff5a8a"); for(let k = 0; k < 14; k++){ const a = k / 14 * TAU; sph(GL, p.x + Math.cos(a) * 5.8, top + .3, p.z + Math.sin(a) * 5.8, .35, "#ffe27a", 1, 5); } }
            else if(p.star !== undefined && (p.x * 7 | 0) % 3 === 0){ cyl(S, p.x + p.w * .32, top, p.z + p.d * .3, .12, .16, .9, "#7a5a3a", 5); sph(S, p.x + p.w * .32, top + 1.1, p.z + p.d * .3, .55, "#58b84a", 1, 6); }
        }
        // くも・とおくの しま・にじ
        let sd = 7; const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
        for(let i = 0; i < 70; i++){ const x = JX + (rnd() - .5) * 220, y = -6 + rnd() * 40, z = JZ + rnd() * 200 - 20; for(let k = 0; k < 4; k++) sph(CL, x + k * 2.6, y + (k % 2) * .6, z + (k % 3) * 1.2, 2.6 + rnd() * 1.6, "#ffffff", .55, 7); }
        for(let i = 0; i < 12; i++){ const x = JX + (rnd() - .5) * 200, y = -14 - rnd() * 8, z = JZ + 10 + rnd() * 170, r = 5 + rnd() * 5; cyl(S, x, y, z, r, r * .9, 1.2, "#6fcf5a", 9); cyl(S, x, y - 5, z, r * .9, .3, 5, "#7a5a3a", 8); }
        const last = P[P.length - 1], cols = ["#ff5a5a", "#ffa84a", "#ffe24a", "#5ad86a", "#5ab8ff", "#9a6aff"];
        for(let c = 0; c < 6; c++) for(let k = 0; k < 36; k++){ const a = k / 35 * Math.PI, rr = 52 - c * 1.5; sph(GL, JX + 40 + Math.cos(a) * rr, 20 + Math.sin(a) * rr * .55, last.z + 50, .8, cols[c], 1, 4); }
    },
    init(g, R, a){
        const P = course().map((p) => Object.assign({}, p)), start = P[0];
        const stars = []; P.forEach((p, i) => { if(p.star) stars.push({x: p.x, y: p.y + 1.7, z: p.z, got: false, pi: i, mov: !!p.mv}); });
        for(const [i, dx, dy] of STAR_EXTRA){ const p = P[i]; stars.push({x: p.x + dx, y: p.y + dy, z: p.z, got: false, pi: i, bonus: true}); }
        Object.assign(R, {P, stars, got: 0, x: start.x, y: start.y, z: start.z, vx: 0, vz: 0, vy: 0, ground: null, jumps: 0, coy: 0, cy: 0, heading: 0, falls: 0, cp: {x: start.x, y: start.y + .1, z: start.z}, fin: 0, win: false, maxZ: 0, squash: 0, bi: 1, T: TIME});
        const r = root(); clearRoot();
    },
    update(g, R, dt, inp){
        R.T = TIME - R.t; const t = R.t;
        if(!R.fin){
            let mx = inp.mx || 0, my = inp.my || 0, jumpPress = !!inp.act;
            if(R.auto){ const b = bot(R, dt); mx = b.mx; my = b.my; jumpPress = b.jump; R.cy = wrapPi(R.cy + wrapPi(b.cy - R.cy) * Math.min(1, dt * 6)); }
            else{ R.cy -= (inp.lx || 0); if(Math.hypot(mx, my) > .2 && Math.abs(inp.lx || 0) < .002){ const h = R.heading; if(Math.hypot(R.vx, R.vz) > 2) R.cy = wrapPi(R.cy + wrapPi(h - R.cy) * Math.min(1, dt * .55) * Math.abs(mx) * .3 * (my > 0 ? 1 : 0)); } }
            const fw = [Math.sin(R.cy), Math.cos(R.cy)], rt = [-Math.cos(R.cy), Math.sin(R.cy)];
            let dx = fw[0] * my + rt[0] * mx, dz = fw[1] * my + rt[1] * mx; const l = Math.hypot(dx, dz); if(l > 1){ dx /= l; dz /= l; }
            const acc = (R.ground ? 54 : 24) * dt, tvx = dx * SPEED, tvz = dz * SPEED;
            R.vx += clamp(tvx - R.vx, -acc, acc); R.vz += clamp(tvz - R.vz, -acc, acc);
            if(l < .05 && R.ground){ R.vx *= Math.pow(.0005, dt); R.vz *= Math.pow(.0005, dt); }
            if(Math.hypot(R.vx, R.vz) > 1) R.heading = Math.atan2(R.vx, R.vz);
            // ジャンプ
            R.coy = R.ground ? .1 : Math.max(0, R.coy - dt);
            if(jumpPress){
                if(R.coy > 0 && R.jumps === 0){ R.vy = VJ; R.jumps = 1; R.ground = null; R.coy = 0; R.squash = .25; g.sfx("shot"); }
                else if(R.jumps < 2){ R.vy = VJ2; R.jumps = 2; R.ground = null; R.squash = .25; g.sfx("hit"); (R.fx = R.fx || []).push({x: R.x, y: R.y, z: R.z, t: 0}); }
            }
            // ゆかに のって いるとき：ゆかの うごきに ついていく
            const prev = R.P.map((p) => posOf(p, t - dt)), cur = R.P.map((p) => posOf(p, t));
            if(R.ground){ const i = R.P.indexOf(R.ground); R.x += cur[i].x - prev[i].x; R.z += cur[i].z - prev[i].z; R.y += cur[i].y - prev[i].y; }
            // よこいどう（しまの かべに ぶつかったら とめる）
            const sideHit = (nx, nz) => { for(let i = 0; i < R.P.length; i++){ const p = R.P[i], c = cur[i], hx = p.w / 2 + RAD, hz = p.d / 2 + RAD; if(Math.abs(nx - c.x) < hx && Math.abs(nz - c.z) < hz && R.y < c.y - .3 && R.y > c.y - 1.6) return true; } return false; };
            if(!sideHit(R.x + R.vx * dt, R.z)) R.x += R.vx * dt; else R.vx = 0;
            if(!sideHit(R.x, R.z + R.vz * dt)) R.z += R.vz * dt; else R.vz = 0;
            // たて
            const y0 = R.y; R.vy -= G * dt; R.y += R.vy * dt; R.ground = null;
            for(let i = 0; i < R.P.length; i++){
                const p = R.P[i], c = cur[i]; if(Math.abs(R.x - c.x) > p.w / 2 + RAD * .6 || Math.abs(R.z - c.z) > p.d / 2 + RAD * .6) continue;
                const top = c.y + (p.mv ? .5 : 0); const prevTop = prev[i].y + (p.mv ? .5 : 0);
                if(R.vy <= 0 && y0 >= prevTop - .12 && R.y <= top){
                    R.y = top; R.vy = 0; R.ground = p; R.jumps = 0; R.landed = i;
                    if(p.t === "p"){ R.vy = VSPRING; R.ground = null; R.jumps = 1; R.squash = .3; g.sfx("fan"); }
                    if(p.t === "c" && (R.cp.z < p.z)){ R.cp = {x: p.x, y: p.y + .1, z: p.z}; g.ui.toast("🚩 チェックポイント！", 1600); g.sfx("clue"); }
                    if(p.t === "g" && !R.fin) finish(g, R);
                }
            }
            for(const s of R.stars) if(!s.got){ const q = starAt(R, s, t), rr = s.bonus ? 1.9 : 1.25; if(Math.hypot(q.x - R.x, q.z - R.z) < rr && Math.abs(q.y - (R.y + 1)) < (s.bonus ? 2.2 : 1.5)){ s.got = true; R.got++; g.sfx("coin"); if(R.got === NEED) g.ui.toast("⭐ " + NEED + "こ！ スタンプの じょうけん クリア！ ゴールへ！", 2600); } }
            if(R.y < FALL_Y){ R.falls++; R.x = R.cp.x; R.y = R.cp.y; R.z = R.cp.z; R.vx = R.vz = R.vy = 0; R.jumps = 0; g.ui.toast("おちた！ チェックポイントから もういちど", 1800); g.sfx("boo"); R.t += 3; }
            R.squash = Math.max(0, R.squash - dt);
            if(R.T <= 0 && !R.fin){ R.fin = 1; R.win = false; R.finT = R.t; g.ui.toast("じかんぎれ…！ もういちど ちょうせん しよう", 4200); g.sfx("ng"); }
        } else if(R.t - R.finT > 2.6) g.endRide(R.win, true);
        if(R.fx) R.fx = R.fx.filter((f) => (f.t += dt) < .5);
    },
    camera(g, R){
        const d = 7.2, h = 3.4, cy = R.cy, x = R.x, y = R.y + 1.5, z = R.z;
        return {eye: [x - Math.sin(cy) * d, y + h, z - Math.cos(cy) * d], yaw: cy, pitch: -.3, fov: 66};
    },
    dyn(g, R, D){
        const T = g.t, t = R.t;
        const sq = R.squash > 0 ? 1 + R.squash * 1.2 : 1;
        D.push({m: "starkid", x: R.x, y: R.y + (R.ground ? 0 : .1), z: R.z, yaw: R.heading, sx: 1.1 / sq, sy: 1.1 * sq, sz: 1.1 / sq});
        for(let i = 0; i < R.P.length; i++){ const p = R.P[i]; if(p.mv){ const c = posOf(p, t); D.push({m: "x_plat", x: c.x, y: c.y, z: c.z, yaw: 0, sx: p.w / 4.6, sy: 1, sz: p.d / 4.6}); } else if(p.t === "p"){ D.push({m: "x_spring", x: p.x, y: p.y, z: p.z, sx: 1.4, sy: 1.4 + Math.abs(Math.sin(T * 5)) * .1, sz: 1.4}); } }
        for(const s of R.stars) if(!s.got){ const q = starAt(R, s, t), y = q.y + Math.sin(T * 2 + s.x) * .22; D.push({m: "star", x: q.x, y, z: q.z, yaw: T * 1.8, sx: .8, sy: .8, sz: .8}); D.push({s: "glow", x: q.x, y: y + .2, z: q.z, w: 2, h: 2, c: [1, .9, .4], a: .5}); }
        for(const f of R.fx || []){ const k = f.t / .5; for(let j = 0; j < 5; j++){ const a = j / 5 * TAU; D.push({s: "star", x: f.x + Math.cos(a) * k * 1.4, y: f.y + .3, z: f.z + Math.sin(a) * k * 1.4, w: .5 * (1 - k), h: .5 * (1 - k), c: [1, 1, 1], a: 1 - k}); } }
        const last = R.P[R.P.length - 1]; if(R.fin && R.win) for(let k = 0; k < 10; k++){ const a = k / 10 * TAU + T, rr = 2 + (T * 3 % 3); D.push({s: "star", x: last.x + Math.cos(a) * rr, y: last.y + 3 + Math.sin(a * 2) * 1.5, z: last.z + Math.sin(a) * rr, w: .8, h: .8, c: [1, .85, .4], a: 1}); }
        D.push({m: "x_flag", x: R.cp.x + 2, y: R.cp.y, z: R.cp.z, yaw: T * .3, sx: .6, sy: .6, sz: .6});
    },
    hud(R){ return "ほし " + R.got + "/" + R.stars.length + "（" + NEED + "こで スタンプ）　のこり " + Math.max(0, Math.ceil(R.T)) + "びょう　E：ジャンプ（2かい）"; },
    end(g, R){ clearRoot(); bodyOn("jump", false); }
};

function finish(g, R){
    R.fin = 1; R.finT = R.t; R.win = R.got >= NEED; g.sv.best_jump = Math.max(g.sv.best_jump || 0, R.got);
    if(R.win){ g.ui.toast("🎉 ゴール！ ほし " + R.got + "こ！" + (R.got >= 16 ? "  ほとんど ぜんぶ！ +30コイン" : ""), 4600); if(R.got >= 16) g.sv.coins += 30; g.sfx("gold"); }
    else{ g.ui.toast("ゴール！ でも ほしが あと " + (NEED - R.got) + "こ たりないよ。 もういちど！", 4600); g.sfx("ng"); }
}
// おまかせ：つぎの しまへ むかって はしり、ふちで ジャンプ、おちそうなら 2だん ジャンプ
function bot(R, dt){
    const t = R.t; let tgt = R.P[Math.min(R.bi, R.P.length - 1)], tp = posOf(tgt, t);
    const onIdx = Math.max(R.ground ? R.P.indexOf(R.ground) : -1, R.landed | 0); if(onIdx >= R.bi) R.bi = Math.min(R.P.length - 1, onIdx + 1), tgt = R.P[R.bi], tp = posOf(tgt, t);
    // ちかくの ほしが ルートの うえに あれば そちらへ ちょっと よる
    let gx = tp.x, gz = tp.z;
    const dx = gx - R.x, dz = gz - R.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, cy = Math.atan2(dx, dz);
    let jump = false;
    if(R.ground){
        const gi = R.P.indexOf(R.ground), c = posOf(R.ground, t), ex = R.x + ux * 1.1, ez = R.z + uz * 1.1;
        const over = Math.abs(ex - c.x) < R.ground.w / 2 && Math.abs(ez - c.z) < R.ground.d / 2;
        if(!over && (R.ground !== tgt)) jump = true;
        if(R.ground.t === "p") jump = false;
    } else if(R.jumps === 1 && R.vy < 1.5 && R.y < tp.y + (tgt.mv ? .5 : 0) - .2 && d > 1.2) jump = true;
    else if(R.jumps === 1 && R.vy < -2 && d > .8 && R.y < tp.y + .3) jump = true;
    const hmove = R.ground || d > .6;
    // カメラの むきに あわせた 入力へ（cy = 進行方向）
    return {mx: 0, my: hmove ? 1 : 0, jump, cy};
}
