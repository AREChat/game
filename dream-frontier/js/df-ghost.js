// ===== ゴースト・ギャラリー（おばけやしき）の かざり 2026-11-27 =====
//  かわいい おばけが いっぱいの 「たのしい おばけやしき」。 むしは ぜったいに 出さない。
//  ・ひろまの まんなかで ワルツを おどる おばけ・シャンデリア・ひとりでに ひく ピアノ
//  ・うかぶ ろうそく／とぶ ほん／めが うごく かいが／パンプキン／おちゃかい の おばけたち
//  ・ひとだま（あおい ほのお）／かべから ひょっこり ばあっ！
//  のっている あいだだけ dyn() で 出す（そとからは 見えない）。 モデルは build() で つくる。
import {TAU, clamp} from "./df-xlib.js";
const sn = Math.sin, cs = Math.cos;
const GT = "gh_";

export function ghostBuild(K){
    const {box, cyl, sph} = K.h, M = (n, blend) => { const m = K.h.model(GT + n); if(blend){ m.blend = true; m.tint = [1, 1, 1, .9]; } return m.prims; };
    const cute = (P, wtColor, extra) => {
        const W = wtColor || "#f4f8ff";
        sph(P, 0, .95, 0, .66, W, 1.12, 12); cyl(P, 0, .02, 0, .62, .56, .8, W, 12);
        for(let i = 0; i < 7; i++){ const a = i / 7 * TAU; sph(P, cs(a) * .5, .1, sn(a) * .5, .22, W, .8, 7); }
        for(const s of [-1, 1]){ sph(P, s * .23, 1.08, .55, .15, "#1a1a30", 1.15, 8); sph(P, s * .2, 1.14, .66, .05, "#ffffff", 1, 5); sph(P, s * .43, .82, .46, .11, "#ffa0b8", .55, 6); sph(P, s * .72, .72, .1, .19, W, 1, 7); }
        box(P, 0, .8, .62, .2, .05, .04, "#1a1a30"); if(extra) extra(P);
    };
    cute(M("cute", 1), "#f4f8ff");
    cute(M("pink", 1), "#ffe9f4", (P) => { cyl(P, 0, 1.6, 0, 0, .3, .55, "#ff6aa8", 8); sph(P, 0, 2.18, 0, .08, "#ffe27a", 1, 5); });
    cute(M("blue", 1), "#e4f2ff", (P) => { box(P, 0, 1.62, .1, .46, .12, .46, "#46a0ff"); box(P, 0, 1.75, .1, .3, .12, .3, "#46a0ff"); });
    { const P = M("butler", 1); cute(P, "#f0f4ff"); cyl(P, 0, 1.64, 0, .34, .34, .5, "#1a1a2a", 10); cyl(P, 0, 1.62, 0, .62, .62, .06, "#1a1a2a", 12); box(P, 0, 1.68, .0, .7, .1, .7, "#ff4a6a", 0, 0, 0);
        box(P, -.12, .52, .55, .2, .16, .06, "#ff4a6a", 0, 0, .4); box(P, .12, .52, .55, .2, .16, .06, "#ff4a6a", 0, 0, -.4); sph(P, 0, .52, .58, .06, "#ffd24a", 1, 5); }
    { const P = M("candle"); cyl(P, 0, 0, 0, .09, .1, .55, "#fff2cc", 8); box(P, 0, .55, 0, .02, .08, .02, "#2a1a10"); }
    { const P = M("cand"); cyl(P, 0, 0, 0, .3, .38, .1, "#caa850", 10); cyl(P, 0, .1, 0, .06, .08, 1.0, "#caa850", 7); for(let i = -2; i <= 2; i++){ box(P, i * .24, 1.0 + Math.abs(i) * .0, 0, .24, .05, .05, "#caa850"); cyl(P, i * .24, 1.05, 0, .045, .05, .3, "#fff2cc", 6); } sph(P, 0, 1.1, 0, .09, "#caa850", 1, 6); }
    { const P = M("chand"); cyl(P, 0, 0, 0, 1.3, 1.3, .1, "#caa850", 16); cyl(P, 0, 0, 0, .8, .8, .08, "#caa850", 14); cyl(P, 0, .1, 0, .05, .05, 2.4, "#8a7a3a", 5); for(let i = 0; i < 10; i++){ const a = i / 10 * TAU; cyl(P, cs(a) * 1.28, .1, sn(a) * 1.28, .05, .06, .3, "#fff2cc", 6); sph(P, cs(a) * 1.28, -.15, sn(a) * 1.28, .1, "#bfe8ff", 1, 5); } }
    { const P = M("frame"); box(P, 0, 0, 0, 1.7, 2.2, .14, "#8a6a2a"); box(P, 0, .15, .05, 1.4, 1.9, .1, "#14101e"); sph(P, 0, 1.3, .13, .4, "#9a8aaa", 1.1, 8); box(P, 0, .3, .12, .9, .65, .06, "#5a4a7a"); }
    { const P = M("book"); box(P, -.3, 0, 0, .55, .05, .7, "#8a3a2a", 0, 0, .4); box(P, .3, 0, 0, .55, .05, .7, "#8a3a2a", 0, 0, -.4); box(P, -.3, .02, 0, .48, .03, .62, "#fff6e0", 0, 0, .4); box(P, .3, .02, 0, .48, .03, .62, "#fff6e0", 0, 0, -.4); }
    { const P = M("pump"); sph(P, 0, .4, 0, .5, "#ff8a1a", .82, 10); cyl(P, 0, .78, 0, .06, .1, .2, "#5a8a2a", 6);
        for(const s of [-1, 1]) box(P, s * .18, .5, .47, .12, .14, .06, "#2a1000", 0, 0, s * .3); box(P, 0, .26, .48, .3, .06, .06, "#2a1000"); }
    { const P = M("piano"); box(P, 0, .5, 0, 1.9, .9, .9, "#1a1a2a"); box(P, 0, 1.0, .1, 1.7, .06, .55, "#f4f4fa"); for(let i = 0; i < 8; i++) box(P, -.75 + i * .21, 1.04, .18, .09, .04, .3, "#10101a"); box(P, 0, 1.55, -.3, 1.9, .06, .8, "#2a2a3a", 0, -.9, 0); for(const s of [-1, 1]) cyl(P, s * .8, 0, .1, .06, .07, .5, "#1a1a2a", 6); }
    { const P = M("table"); cyl(P, 0, 0, 0, .1, .14, .72, "#8a5a3a", 7); cyl(P, 0, .72, 0, .9, .9, .07, "#e8d8c0", 14); for(let i = 0; i < 3; i++){ const a = i / 3 * TAU; cyl(P, cs(a) * .5, .79, sn(a) * .5, .08, .06, .1, "#ffffff", 7); } cyl(P, 0, .79, 0, .12, .14, .18, "#ff9ac0", 8); }
    { const P = M("wisp"); sph(P, 0, 0, 0, .22, "#9affd8", 1.5, 7); sph(P, 0, .32, 0, .12, "#c8fff0", 1.4, 6); }
}

// ---- 道の ぞいに ならべる かざり（いちど だけ けいさん）----
let LAY = null;
function layout(p){
    const tot = p.total, at = (u) => { const s = u * tot, a = p.at(s), b = p.at(Math.min(tot, s + .6)), yaw = Math.atan2(b[0] - a[0], b[2] - a[2]); return {x: a[0], z: a[2], y: a[1] || 0, yaw, rx: cs(yaw), rz: -sn(yaw), s}; };
    const L = [], put = (u, lat, o) => { const q = at(u), face = o.face === undefined ? 0 : o.face; L.push(Object.assign({s: q.s, x: q.x + q.rx * lat, z: q.z + q.rz * lat, yaw: q.yaw + (lat < 0 ? Math.PI / 2 : -Math.PI / 2) + face, lat}, o)); };
    // はいりぐち：しょくだい と のぞきみ おばけ
    put(.02, -2.3, {m: "cand", sc: 1.15, fl: 1}); put(.02, 2.3, {m: "cand", sc: 1.15, fl: 1}); put(.05, -2.7, {m: "cute", sc: 1.0, peek: 1, bob: .1});
    // かいが（めが うごく）
    put(.1, -3.0, {m: "frame", sc: 1.25, y: .5, eyes: 1}); put(.14, 3.0, {m: "frame", sc: 1.25, y: .5, eyes: 1}); put(.34, 3.3, {m: "frame", sc: 1.25, y: .5, eyes: 1});
    // とぶ ほん ＋ ほんを よむ おばけ
    for(let i = 0; i < 4; i++) put(.17 + i * .012, 1.4 + (i % 2) * .8, {m: "book", sc: .8, y: 1.6 + i * .3, flap: i, fly: 1});
    put(.2, 2.9, {m: "blue", sc: 1.1, bob: .15});
    // パンプキン ならび
    for(let i = 0; i < 4; i++) put(.46 + i * .035, 2.5, {m: "pump", sc: 1.0, face: 0, gl: [1, .55, .15], pm: 1});
    put(.5, -2.4, {m: "pink", sc: 1.05, peek: 1, bob: .1});
    // おちゃかい
    put(.62, -2.4, {m: "table", sc: 1.15, tea: 1}); put(.6, -1.2, {m: "cute", sc: 1.0, bob: .12, turn: 1}); put(.64, -3.6, {m: "pink", sc: 1.0, bob: .12, turn: 1});
    // ひょっこり ばあっ
    put(.74, -2.5, {m: "cute", sc: 1.25, peek: 1}); put(.77, 2.5, {m: "pink", sc: 1.25, peek: 1}); put(.8, -2.6, {m: "blue", sc: 1.2, peek: 1});
    // でぐち：しつじの おばけが おじぎ
    put(.94, 2.3, {m: "butler", sc: 1.35, bow: 1}); put(.97, -2.3, {m: "cand", sc: 1.15, fl: 1}); put(.97, 2.9, {m: "cand", sc: 1.15, fl: 1});
    return L;
}

export function ghostDyn(g, R, D, T){
    const p = g.paths && g.paths.ghost; if(!p) return;
    if(!LAY) LAY = layout(p);
    const tot = p.total, s0 = R.s || 0, cam = g.camPos(), eyeYaw = (q) => Math.atan2(cam[0] - q.x, cam[2] - q.z);
    const glow = (x, y, z, w, c, a) => D.push({s: "glow", x, y, z, w, h: w, c, a});
    // ひろまの まんなか：ワルツ・ピアノ・シャンデリア
    const cx = 79, cz = 27.6, ctr = Math.hypot(cam[0] - cx, cam[2] - cz);
    if(ctr < 17){
        for(let i = 0; i < 3; i++){ const a = T * .55 + i * TAU / 3, r = 2.5; for(let k = 0; k < 2; k++){ const aa = a + k * .42, rr = r + k * .15, ym = ["cute", "pink", "blue"][(i + k) % 3];
                D.push({m: GT + ym, x: cx + cs(aa) * rr, y: .35 + sn(T * 2.4 + i + k * 2) * .22, z: cz + sn(aa) * rr, yaw: -aa + (k ? Math.PI : 0) + Math.PI, sx: 1.05, sy: 1.05, sz: 1.05, rx: sn(T * 2.4 + k) * .06}); } }
        D.push({m: GT + "piano", x: cx, y: 0, z: cz + .2, yaw: 0, sx: 1.1, sy: 1.1, sz: 1.1});
        for(let k = 0; k < 8; k++) glow(cx - .8 + (k % 4) * .5, 1.5 + ((T * 1.2 + k * .4) % 2.4), cz + .2 + sn(k + T) * .4, .35, [.8, .95, 1], .8 - ((T * 1.2 + k * .4) % 2.4) / 3);   // ピアノの おとの きらきら
        D.push({m: GT + "chand", x: cx, y: 4.6 + sn(T * .8) * .06, z: cz, sx: 1.3, sy: 1.3, sz: 1.3, rx: sn(T * .7) * .03});
        for(let i = 0; i < 10; i++){ const a = i / 10 * TAU, f = .8 + .2 * sn(T * 9 + i * 2.3); glow(cx + cs(a) * 1.66, 5.0, cz + sn(a) * 1.66, .9 * f, [1, .8, .4], .9); }
        glow(cx, 4.2, cz, 9, [1, .85, .5], .1);
    }
    // みちぞいの かざり
    for(const it of LAY){
        const ds = it.s - s0; if(ds < -7 || ds > 20) continue;
        const near = clamp(1 - Math.abs(ds) / 6, 0, 1), sc = it.sc || 1, y0 = (it.y || 0);
        let y = y0, yaw = it.yaw, ex = 1, sy = sc, rx = 0;
        if(it.bob) y += .15 + sn(T * 1.6 + it.s) * it.bob;
        if(it.fly) y += sn(T * 2 + it.s) * .2;
        if(it.turn) yaw = eyeYaw(it);
        if(it.peek){ const k = clamp(1 - Math.abs(ds - 1.5) / 5, 0, 1), up = k * k * (3 - 2 * k); sy = sc * (.15 + .85 * up); y = y0 - (1 - up) * .5; yaw = eyeYaw(it); ex = up; }
        if(it.bow){ rx = (ds < 6 ? .5 * clamp((6 - ds) / 4, 0, 1) : 0) * -1; yaw = eyeYaw(it); }
        if(it.flap !== undefined){ rx = sn(T * 9 + it.flap) * .3; yaw = it.yaw + T * .8 + it.flap; }
        if(ex > 0.05) D.push({m: GT + it.m, x: it.x, y, z: it.z, yaw, sx: sc, sy, sz: sc, rx});
        const nx = sn(it.yaw), nz = cs(it.yaw), rxv = cs(it.yaw), rzv = -sn(it.yaw);
        if(it.fl){ const f = .75 + .25 * sn(T * 11 + it.s * 3); for(let q = -2; q <= 2; q++) glow(it.x + rxv * q * .24 * sc, y0 + 1.42 * sc, it.z + rzv * q * .24 * sc, .55 * f, [1, .75, .3], .95); glow(it.x, y0 + 1.4 * sc, it.z, 3.2, [1, .75, .4], .16); }
        if(it.gl && it.pm) glow(it.x, y0 + .45, it.z, 1.5 * (.85 + .15 * sn(T * 5 + it.s)), it.gl, .55);
        if(it.eyes){ const k = sn(T * .9 + it.s) * .26; for(const sd of [-1, 1]) glow(it.x + nx * .25 + rxv * (sd * .2 + k) * sc, y0 + 1.32 * sc, it.z + nz * .25 + rzv * (sd * .2 + k) * sc, .3, [1, .98, .7], .95); }
        if(it.tea) for(let k = 0; k < 6; k++){ const a = k / 6 * TAU; glow(it.x + cs(a) * .5, .98 + ((T * .6 + k * .3) % 1.2), it.z + sn(a) * .5, .3, [1, 1, 1], .35 * (1 - ((T * .6 + k * .3) % 1.2) / 1.2)); }
        if(it.peek && ex > .5) glow(it.x, y + .9 * sc, it.z, 2.4, [.8, .95, 1], .12);
    }
    // ひとだま（あおい ほのお）が ふわふわ
    for(let i = 0; i < 6; i++){ const u = ((T * .018 + i / 6) % 1) * tot, a = p.at(u), a2 = p.at(Math.min(tot, u + .5)), yaw = Math.atan2(a2[0] - a[0], a2[2] - a[2]), lat = (i % 2 ? 1 : -1) * (1.2 + .6 * sn(T + i)), x = a[0] + cs(yaw) * lat, z = a[2] - sn(yaw) * lat, y = 1.3 + sn(T * 1.3 + i * 2) * .5;
        if(Math.abs(u - s0) < 16){ D.push({m: GT + "wisp", x, y, z, yaw: T + i, sx: 1.1, sy: 1.1 + sn(T * 6 + i) * .15, sz: 1.1}); glow(x, y + .1, z, 1.7, [.4, 1, .85], .35); for(let q = 1; q <= 4; q++) glow(x - sn(yaw) * q * .3, y - q * .05, z - cs(yaw) * q * .3, .5 - q * .08, [.4, 1, .85], .4 - q * .08); } }
    // ただよう ほこりの ひかり・ゆかの きり
    for(let k = 0; k < 24; k++){ const r = ((k * 37) % 100) / 100, x = cam[0] + ((k * 53) % 17) - 8.5, z = cam[2] + ((k * 29) % 17) - 8.5; glow(x, .5 + ((T * .15 + r) % 1) * 3.2, z, .22, [.8, .9, 1], .35); }
    for(let k = 0; k < 7; k++){ const a = k / 7 * TAU + T * .05; glow(cam[0] + cs(a) * 5, .35, cam[2] + sn(a) * 5, 5.5, [.55, .6, .8], .14); }
}
