"use strict";
// ===== 屋内（店・家・ぼくじょう など）の かざり。maps.json の props / buildings から呼ばれる =====
// ・ここで作るのは、ぜんぶ「箱・円柱・球」だけの かんたんな形（既存の作品の絵・名前・音は つかわない）。
// ・props の例：{"t":"plant","x":-3,"z":2}   buildings の例：{"goods":"games", ...}（その棚の面に、商品をならべる）
// ・当たり判定が必要なものは colliders / circles に足します（歩く道をふさがない位置に置くこと）。
import {Geo, M4, canvasTex} from "./gl.js";

const PI = Math.PI;
const place = (px, pz, yaw, up) => (lx, ly, lz) => M4.mul(M4.T(px, up || 0, pz), M4.mul(M4.RY(yaw || 0), M4.T(lx || 0, ly || 0, lz || 0)));

const PALETTE = {
    games: ["#e85a5a", "#4a8ae8", "#f0c040", "#5ac878", "#a05ae8", "#f08a3a", "#3ac8d8", "#e85aa8", "#8a8a98", "#3a3a4a"],
    potion: ["#e85a5a", "#5ab8f0", "#7ad858", "#f0c040", "#b06ae8", "#f08ab0"],
    book: ["#a04a3a", "#3a6aa0", "#4a8a4a", "#c0a040", "#7a4aa0", "#3a3a3a", "#d07a3a", "#2a7a7a"],
};

// ---- はり紙・ポスターの絵（文字と かんたんな図形だけ） ----
const POSTERS = {
    new:   {bg: "#2a3a8a", fg: "#ffe680", t1: "しんさく", t2: "もうすぐ！", shape: "star"},
    sale:  {bg: "#c83a3a", fg: "#ffffff", t1: "セール", t2: "ぜんぶ おとく", shape: "tag"},
    quest: {bg: "#1a4a3a", fg: "#fff2a0", t1: "ARE QUEST", t2: "ぼうけんに でよう", shape: "sword"},
    card:  {bg: "#5a2a7a", fg: "#ffd0f0", t1: "カードバトル", t2: "つよい デッキを！", shape: "card"},
    pop:   {bg: "#f0c040", fg: "#3a2a10", t1: "おすすめ", t2: "店員さんの イチオシ", shape: "heart"},
    rule:  {bg: "#e8e0c8", fg: "#3a2a10", t1: "おねがい", t2: "ゲームは 1日1時間", shape: "none"},
    job:   {bg: "#e8e0c8", fg: "#3a2a60", t1: "しょくぎょう", t2: "ぼしゅう中！", shape: "star"},
    fight: {bg: "#8a1a1a", fg: "#ffe0a0", t1: "格闘大会", t2: "3れんしょうで ゆうしょう", shape: "fist"},
    farm:  {bg: "#e8f0c8", fg: "#3a5a20", t1: "ぼくじょう", t2: "なかよく そだてよう", shape: "heart"},
    gold:  {bg: "#4a1a6a", fg: "#ffd24a", t1: "コインで あそぼう", t2: "きょうも ラッキー", shape: "star"},
    home:  {bg: "#f0e0c8", fg: "#6a4a2a", t1: "ただいま", t2: "おかえりなさい", shape: "heart"},
    item:  {bg: "#2a5a3a", fg: "#e8ffd0", t1: "どうぐ", t2: "やくそう・まほうの薬", shape: "leaf"},
    pic1:  {bg: "#8ac8f0", fg: "#ffffff", t1: "", t2: "", shape: "hill"},
    pic2:  {bg: "#f0b080", fg: "#ffffff", t1: "", t2: "", shape: "sun"},
};
function shapeDraw(x, kind, w, h, col){
    x.fillStyle = col; x.strokeStyle = col; x.lineWidth = 6;
    const cx = w / 2, cy = h * .5;
    if(kind === "star"){ x.beginPath(); for(let i = 0; i < 10; i++){ const r = i % 2 ? w * .1 : w * .22, a = -PI / 2 + i * PI / 5; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fill(); }
    else if(kind === "heart"){ x.beginPath(); x.moveTo(cx, cy + w * .16); x.bezierCurveTo(cx - w * .34, cy - w * .05, cx - w * .12, cy - w * .26, cx, cy - w * .08); x.bezierCurveTo(cx + w * .12, cy - w * .26, cx + w * .34, cy - w * .05, cx, cy + w * .16); x.fill(); }
    else if(kind === "sword"){ x.beginPath(); x.moveTo(cx - w * .18, cy + w * .2); x.lineTo(cx + w * .18, cy - w * .2); x.stroke(); x.fillRect(cx - w * .2, cy + w * .12, w * .12, 8); }
    else if(kind === "card"){ x.fillRect(cx - w * .14, cy - w * .2, w * .28, w * .38); x.clearRect(cx - w * .09, cy - w * .15, w * .18, w * .28); }
    else if(kind === "tag"){ x.beginPath(); x.moveTo(cx - w * .2, cy - w * .1); x.lineTo(cx + w * .1, cy - w * .1); x.lineTo(cx + w * .2, cy); x.lineTo(cx + w * .1, cy + w * .1); x.lineTo(cx - w * .2, cy + w * .1); x.closePath(); x.fill(); }
    else if(kind === "leaf"){ x.beginPath(); x.ellipse(cx, cy, w * .2, w * .1, -.6, 0, PI * 2); x.fill(); }
    else if(kind === "fist"){ x.fillRect(cx - w * .16, cy - w * .1, w * .32, w * .2); x.fillRect(cx - w * .2, cy - w * .04, w * .06, w * .12); }
    else if(kind === "hill"){ x.fillStyle = "#4a9a4a"; x.beginPath(); x.arc(cx - w * .15, h, w * .38, PI, 0); x.fill(); x.fillStyle = "#6ac86a"; x.beginPath(); x.arc(cx + w * .2, h, w * .3, PI, 0); x.fill(); }
    else if(kind === "sun"){ x.fillStyle = "#ffe070"; x.beginPath(); x.arc(cx, cy, w * .16, 0, PI * 2); x.fill(); x.fillStyle = "#5a8a5a"; x.fillRect(0, h * .72, w, h * .28); }
}
export function posterTex(R, kind){
    const d = POSTERS[kind] || POSTERS.new, W = 192, H = 256;
    return R.tex(canvasTex(W, H, (x, w, h) => {
        x.direction = "ltr"; x.fillStyle = d.bg; x.fillRect(0, 0, w, h);
        x.strokeStyle = d.fg; x.lineWidth = 5; x.strokeRect(8, 8, w - 16, h - 16);
        if(d.shape) shapeDraw(x, d.shape, w, h, d.fg);
        x.fillStyle = d.fg; x.textAlign = "center"; x.textBaseline = "middle";
        if(d.t1){ x.font = "bold " + (d.t1.length > 5 ? 30 : 38) + "px sans-serif"; x.fillText(d.t1, w / 2, 52); }
        if(d.t2){ x.font = "bold " + (d.t2.length > 9 ? 17 : 21) + "px sans-serif"; x.fillText(d.t2, w / 2, h - 40); }
    }));
}

const hs = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177 | 0; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };

// ---- 棚の面に 商品をならべる（face: 面の中心 [x,z]、yaw: 外向き、len: 面の長さ、h: 棚の高さ） ----
function goodsFace(tg, kind, cx, cz, yaw, len, h, seed){
    const P = place(cx, cz, yaw), pal = PALETTE[kind] || PALETTE.games;
    const rows = Math.max(2, Math.floor((h - .1) / .5));
    for(let r = 0; r < rows; r++){
        const y0 = .18 + r * ((h - .3) / rows);
        tg.box(len, .05, .26, "#6a4a30", P(0, y0 - .03, .12));                                   // 棚板
        const cw = kind === "potion" ? .22 : .3, n = Math.floor(len / (cw + .06));
        for(let i = 0; i < n; i++){
            const u = (i - (n - 1) / 2) * (len / n), col = pal[Math.floor(hs(i + seed * 7, r + seed) * pal.length)];
            if(kind === "potion"){
                tg.cyl(.08, .1, .22 + hs(i, r + seed) * .1, 8, col, P(u, y0, .14));
                tg.cyl(.035, .035, .09, 6, "#8a6a40", P(u, y0 + .24, .14));
            }else if(kind === "book"){
                const bw = .07 + hs(i, r) * .06, bh = .3 + hs(r, i) * .12; tg.box(bw, bh, .2, col, P(u, y0, .12));
            }else{
                tg.box(cw, .4, .05, col, P(u, y0, .08)); tg.box(cw * .78, .13, .02, "#ffffff", P(u, y0 + .22, .11)); tg.box(cw * .5, .05, .02, "#2a2a3a", P(u, y0 + .08, .11));
            }
        }
    }
}

// ---- 部品 ----
function plant(tg, W, p){
    const P = place(p.x, p.z, 0, p.up), s = p.s || 1;
    tg.cyl(.3 * s, .22 * s, .45 * s, 10, p.pot || "#b8643a", P(0, 0, 0), true);
    tg.cyl(.3 * s, .3 * s, .05 * s, 10, "#4a3020", P(0, .42 * s, 0));
    for(let i = 0; i < 5; i++){ const a = i * 1.26; tg.sphere(.3 * s, 7, 5, i % 2 ? "#3f9a4a" : "#56b85a", P(Math.cos(a) * .22 * s, (.8 + (i % 3) * .2) * s, Math.sin(a) * .22 * s)); }
    tg.sphere(.34 * s, 7, 5, "#4aa854", P(0, 1.35 * s, 0));
    W.circles.push([p.x, p.z, .38 * s]);
}
function rug(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), w = p.w || 4, d = p.d || 3;
    tg.box(w, .02, d, p.c2 || "#8a2a3a", P(0, .005, 0)); tg.box(w - .5, .03, d - .5, p.c1 || "#e8d8a0", P(0, .005, 0)); tg.box(w - 1.1, .035, d - 1.1, p.c2 || "#8a2a3a", P(0, .005, 0));
    tg.box(w - 1.6, .04, d - 1.6, p.c3 || "#d0a050", P(0, .005, 0));
}
function counter(tg, W, p){
    const w = p.w || 3, d = p.d || 1, P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(w, 1.0, d, p.color || "#8a5a3a", P(0, 0, 0)); tg.box(w + .12, .08, d + .12, "#b88a5a", P(0, 1.0, 0));
    for(let i = -1; i <= 1; i += 2) tg.box(w * .42, .6, .02, "#6a4228", P(i * w * .24, .2, d / 2 + .01));
    if(p.reg !== false){
        tg.box(.55, .22, .4, "#4a4a58", P(-w * .25, 1.08, 0)); tg.box(.4, .24, .06, "#7ad0f0", P(-w * .25, 1.28, -.04)); tg.box(.5, .06, .3, "#2a2a34", P(-w * .25, 1.06, .1));
        tg.cyl(.1, .12, .08, 8, "#e8c040", P(w * .12, 1.08, .05)); tg.sphere(.06, 6, 4, "#e8c040", P(w * .12, 1.2, .05));
        for(let k = 0; k < 3; k++) tg.box(.3, .05, .22, ["#e85a5a", "#4a8ae8", "#f0c040"][k], P(w * .3, 1.08 + k * .05, 0));
    }
    W.colliders.push(bounds(p.x, p.z, w, d, p.yaw));
}
function bounds(x, z, w, d, yaw){
    const q = Math.abs(Math.sin(yaw || 0)) > .7; const hw = (q ? d : w) / 2, hd = (q ? w : d) / 2; return [x - hw, z - hd, x + hw, z + hd];
}
function tv(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.screen || "#5ac8f0";
    tg.box(1.7, .55, .6, "#4a4a58", P(0, 0, 0)); tg.box(1.4, .85, .1, "#1a1a22", P(0, .6, -.1)); tg.box(1.25, .7, .04, c, P(0, .67, -.04));
    tg.box(.36, .08, .26, "#c8c8d4", P(-.4, .55, .1)); tg.box(.1, .1, .1, "#e85a5a", P(-.4, .63, .1)); tg.box(.1, .1, .1, "#4a8ae8", P(.1, .6, .12));
    tg.box(.34, .12, .24, "#2a2a34", P(.5, .55, .1));
    W.colliders.push(bounds(p.x, p.z, 1.7, .6, p.yaw));
}
function sofa(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#6a8ad0", w = p.w || 2.2;
    tg.box(w, .45, .9, c, P(0, 0, 0)); tg.box(w, .75, .25, c, P(0, .3, -.34)); for(const s of [-1, 1]) tg.box(.25, .62, .9, c, P(s * (w / 2 - .12), 0, 0));
    tg.box(w * .4, .12, .6, "#e8e0f0", P(-w * .2, .45, .08)); tg.box(w * .4, .12, .6, "#e8e0f0", P(w * .2, .45, .08));
    W.colliders.push(bounds(p.x, p.z, w, .9, p.yaw));
}
function table(tg, W, p){
    const w = p.w || 1.6, d = p.d || 1.2, h = p.h || .8, P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(w, .08, d, p.color || "#a8743a", P(0, h - .08, 0));
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) tg.box(.1, h - .08, .1, "#7a4e28", P(sx * (w / 2 - .1), 0, sz * (d / 2 - .1)));
    if(p.cloth) tg.box(w + .1, .03, d + .1, p.cloth, P(0, h, 0));
    if(p.dishes){
        for(let i = 0; i < 3; i++){ const u = (i - 1) * (w * .28); tg.cyl(.14, .1, .05, 10, "#f0f0f4", P(u, h + .03, .1), true); tg.cyl(.05, .05, .1, 8, ["#e85a5a", "#f0c040", "#5ac878"][i], P(u, h + .06, -.2)); }
        tg.sphere(.16, 7, 5, "#d8a050", P(0, h + .14, -.05));
    }
    W.colliders.push(bounds(p.x, p.z, w, d, p.yaw));
}
function chair(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#b88a50";
    tg.box(.55, .08, .55, c, P(0, .5, 0)); tg.box(.55, .6, .08, c, P(0, .5, -.24));
    for(const sx of [-1, 1]) for(const sz of [-1, 1]) tg.box(.07, .5, .07, "#7a4e28", P(sx * .22, 0, sz * .22));
    W.circles.push([p.x, p.z, .3]);
}
function bed(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#e8a0a0";
    tg.box(2.0, .3, 3.0, "#8a5a3a", P(0, 0, 0)); tg.box(1.8, .25, 2.8, "#f4f0e8", P(0, .3, 0)); tg.box(1.8, .06, 1.7, c, P(0, .53, .5)); tg.box(1.1, .16, .6, "#ffffff", P(0, .55, -1.0));
    tg.box(2.0, .9, .12, "#8a5a3a", P(0, 0, -1.5));
}
function bookcase(tg, W, p){
    const w = p.w || 2.4, h = p.h || 2.2, P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(w, h, .5, "#6a4a30", P(0, 0, 0));
    goodsFace(tg, "book", p.x, p.z, p.yaw || 0, w - .2, h, p.seed || 3);
    W.colliders.push(bounds(p.x, p.z, w, .5, p.yaw));
}
function crate(tg, W, p){
    const s = p.s || 1, P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(.9 * s, .8 * s, .9 * s, "#b88a50", P(0, 0, 0)); tg.box(.96 * s, .06, .96 * s, "#7a5a30", P(0, .8 * s, 0)); tg.box(.06, .8 * s, .96 * s, "#7a5a30", P(0, 0, 0)); tg.box(.96 * s, .8 * s, .06, "#7a5a30", P(0, 0, 0));
    if(p.top) tg.sphere(.2, 6, 4, p.top, P(0, .95 * s, 0));
    W.colliders.push(bounds(p.x, p.z, .9 * s, .9 * s, 0));
}
function barrel(tg, W, p){
    const P = place(p.x, p.z, 0, p.up);
    tg.cyl(.36, .36, .85, 10, "#9a6a3a", P(0, 0, 0), true); for(const y of [.15, .65]) tg.cyl(.38, .38, .06, 10, "#4a3a2a", P(0, y, 0));
    W.circles.push([p.x, p.z, .4]);
}
function hay(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(1.4, .8, .9, "#e0c060", P(0, 0, 0)); for(const u of [-.4, .4]) tg.box(.05, .82, .94, "#a08a40", P(u, 0, 0)); tg.box(1.2, .08, .7, "#f0d070", P(0, .8, 0));
    W.colliders.push(bounds(p.x, p.z, 1.4, .9, p.yaw));
}
function trough(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), w = p.w || 2;
    tg.box(w, .5, .7, "#8a5a3a", P(0, 0, 0)); tg.box(w - .2, .02, .5, "#6ab8f0", P(0, .5, 0));
    W.colliders.push(bounds(p.x, p.z, w, .7, p.yaw));
}
function sack(tg, W, p){
    const P = place(p.x, p.z, 0, p.up);
    tg.sphere(.4, 8, 6, p.color || "#d8c8a0", P(0, .32, 0)); tg.cyl(.1, .16, .15, 8, "#8a7a50", P(0, .62, 0)); W.circles.push([p.x, p.z, .4]);
}
function arcade(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#3a4ab0";
    tg.box(.95, 1.9, .85, c, P(0, 0, 0)); tg.box(.95, .3, .9, p.top || "#ffd24a", P(0, 1.9, 0));
    tg.box(.78, .55, .06, "#1a1a2a", P(0, 1.12, .43)); tg.box(.7, .46, .03, p.screen || "#6ad8a0", P(0, 1.16, .46));
    tg.box(.95, .08, .45, "#2a2a3a", P(0, .95, .55)); tg.cyl(.03, .03, .16, 6, "#2a2a2a", P(-.2, 1.03, .55)); tg.sphere(.06, 6, 4, "#e83a3a", P(-.2, 1.2, .55));
    for(let i = 0; i < 3; i++) tg.cyl(.04, .04, .03, 8, ["#e83a3a", "#f0c040", "#3ac878"][i], P(.05 + i * .13, 1.03, .55));
    W.colliders.push(bounds(p.x, p.z, .95, .85, p.yaw));
}
function capsule(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#e85a5a";
    tg.box(.7, .75, .7, c, P(0, 0, 0)); tg.sphere(.4, 10, 8, "#cfe8f8", P(0, 1.15, 0));
    for(let i = 0; i < 9; i++){ const a = i * 2.4; tg.sphere(.09, 6, 4, ["#f0c040", "#e85a5a", "#5ab8f0", "#7ad858", "#c06ae8"][i % 5], P(Math.cos(a) * (.14 + (i % 3) * .06), .95 + (i % 4) * .1, Math.sin(a) * (.14 + (i % 3) * .05))); }
    tg.cyl(.1, .1, .05, 8, "#f0f0f4", P(0, .5, .36)); tg.box(.24, .12, .04, "#2a2a3a", P(0, .2, .36));
    W.circles.push([p.x, p.z, .45]);
}
function crane(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#e85aa8";
    tg.box(1.2, .8, 1.0, c, P(0, 0, 0)); tg.box(1.1, 1.0, .9, "#cfe8f8", P(0, .8, 0)); for(const sx of [-1, 1]) for(const sz of [-1, 1]) tg.box(.06, 1.0, .06, "#4a4a58", P(sx * .55, .8, sz * .45));
    tg.box(1.2, .12, 1.0, "#4a4a58", P(0, 1.8, 0)); tg.cyl(.02, .02, .4, 5, "#2a2a2a", P(0, 1.4, 0));
    for(let i = 0; i < 6; i++) tg.sphere(.16, 6, 4, ["#f0c040", "#5ab8f0", "#7ad858", "#e85a5a", "#c06ae8"][i % 5], P(-.35 + (i % 3) * .35, .98, -.2 + Math.floor(i / 3) * .4));
    tg.sphere(.06, 6, 4, "#e83a3a", P(-.3, .86, .55)); tg.sphere(.06, 6, 4, "#3a8ae8", P(.3, .86, .55));
    W.colliders.push(bounds(p.x, p.z, 1.2, 1.0, p.yaw));
}
function slot(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#c03a5a";
    tg.box(.9, 1.7, .7, c, P(0, 0, 0)); tg.box(.9, .35, .74, "#ffd24a", P(0, 1.7, 0)); tg.box(.72, .4, .04, "#f8f8f0", P(0, 1.05, .36));
    for(let i = -1; i <= 1; i++) tg.box(.18, .32, .03, ["#e83a3a", "#f0c040", "#3a8ae8"][(i + 1)], P(i * .22, 1.09, .39));
    tg.box(.7, .1, .4, "#2a2a3a", P(0, .8, .38)); tg.cyl(.03, .03, .5, 6, "#c8c8d0", P(.5, .6, 0)); tg.sphere(.09, 6, 4, "#e83a3a", P(.5, 1.12, 0));
    W.colliders.push(bounds(p.x, p.z, .9, .7, p.yaw));
}
function cgame(tg, W, p){   // カジノの まるいテーブル
    const P = place(p.x, p.z, 0, p.up);
    tg.cyl(.15, .2, .85, 8, "#4a2a1a", P(0, 0, 0)); tg.cyl(1.2, 1.2, .1, 16, "#2a8a4a", P(0, .85, 0), true); tg.cyl(1.28, 1.28, .08, 16, "#6a3a1a", P(0, .8, 0));
    for(let k = 0; k < 4; k++){ const a = k * 1.6 + .4; for(let j = 0; j < 3; j++) tg.cyl(.1, .1, .04, 8, ["#e83a3a", "#f8f8f8", "#3a3ae8"][(k + j) % 3], P(Math.cos(a) * .7, .95 + j * .045, Math.sin(a) * .7)); }
    tg.box(.14, .01, .2, "#ffffff", P(.1, .96, .1));
    W.circles.push([p.x, p.z, 1.25]);
}
function punchbag(tg, W, p){
    const P = place(p.x, p.z, 0, p.up);
    tg.cyl(.02, .02, 1.2, 5, "#4a4a4a", P(0, 1.2, 0)); tg.cyl(.28, .28, .95, 10, "#c83a3a", P(0, .3, 0), true); tg.box(.7, .04, .04, "#4a4a4a", P(0, 2.4, 0));
    W.circles.push([p.x, p.z, .35]);
}
function dumbbell(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up);
    for(let i = 0; i < 3; i++){ const y = .08 + i * .22; tg.box(.7, .05, .05, "#8a8a98", P(0, y + .1, 0)); for(const s of [-1, 1]) tg.cyl(.1 + i * .02, .1 + i * .02, .06, 8, "#3a3a4a", M4.mul(P(s * .4, y + .1, 0), M4.RZ(PI / 2))); }
    tg.box(.9, .06, .35, "#6a4a30", P(0, .0, 0)); tg.box(.06, .7, .06, "#6a4a30", P(-.4, 0, 0)); tg.box(.06, .7, .06, "#6a4a30", P(.4, 0, 0));
    W.colliders.push(bounds(p.x, p.z, .9, .4, p.yaw));
}
function mat(tg, W, p){      // たたみ・リングの ゆか（歩ける）
    const P = place(p.x, p.z, 0, p.up), r = p.r || 3.2;
    tg.cyl(r, r, .03, 24, p.c1 || "#3a5ab0", P(0, 0, 0), true); tg.cyl(r * .82, r * .82, .04, 24, p.c2 || "#e8e8f0", P(0, 0, 0), true); tg.cyl(r * .78, r * .78, .045, 24, p.c1 || "#3a5ab0", P(0, 0, 0), true);
    tg.cyl(r * .14, r * .14, .05, 12, p.c2 || "#e8e8f0", P(0, 0, 0), true);
}
function bench(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), w = p.w || 1.8;
    tg.box(w, .08, .5, p.color || "#9a6e48", P(0, .45, 0)); for(const s of [-1, 1]) tg.box(.08, .45, .45, "#7a4e28", P(s * (w / 2 - .1), 0, 0));
    W.colliders.push(bounds(p.x, p.z, w, .5, p.yaw));
}
function cabinet(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), w = p.w || 1.6, h = p.h || 1.0;
    tg.box(w, h, .6, p.color || "#9a6a3a", P(0, 0, 0)); tg.box(.04, h * .85, .02, "#5a3a20", P(0, h * .06, .31)); tg.sphere(.04, 5, 4, "#e8c040", P(-.1, h * .5, .32)); tg.sphere(.04, 5, 4, "#e8c040", P(.1, h * .5, .32));
    if(p.vase !== false){ tg.cyl(.08, .12, .3, 8, "#5a9ad0", P(-w * .25, h, 0), true); for(let i = 0; i < 3; i++) tg.sphere(.09, 6, 4, ["#f0708a", "#f0c040", "#ffffff"][i], P(-w * .25 + (i - 1) * .08, h + .38 + (i % 2) * .06, 0)); }
    W.colliders.push(bounds(p.x, p.z, w, .6, p.yaw));
}
function stove(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(1.2, .9, .8, "#d8d8e0", P(0, 0, 0)); tg.box(1.0, .04, .6, "#2a2a30", P(0, .9, 0)); tg.cyl(.2, .18, .22, 10, "#8a8a98", P(-.2, .94, 0), true); tg.cyl(.04, .04, .1, 6, "#e8c040", P(.3, .95, .1));
    tg.box(.9, .4, .04, "#2a2a30", P(0, .3, .41)); for(let i = -1; i <= 1; i += 2) tg.cyl(.04, .04, .05, 8, "#c8c8d0", P(i * .3, .78, .41));
    W.colliders.push(bounds(p.x, p.z, 1.2, .8, p.yaw));
}
function fireplace(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(2.0, 1.6, .7, "#a8604a", P(0, 0, 0)); tg.box(1.2, .9, .12, "#1a1210", P(0, .1, .36)); tg.box(2.3, .12, .9, "#6a4a30", P(0, 1.6, 0));
    tg.cyl(0, .3, .6, 6, "#f08a3a", P(0, .12, .38)); tg.cyl(0, .16, .45, 6, "#ffe070", P(.1, .12, .4)); tg.cyl(.12, .12, .5, 6, "#6a4a30", M4.mul(P(-.3, .12, .42), M4.RZ(PI / 2)));
    W.colliders.push(bounds(p.x, p.z, 2.0, .7, p.yaw));
}
function board(tg, W, p){   // おしらせ板（かべ）
    const P = place(p.x, p.z, p.yaw || 0, p.up), w = p.w || 3, h = p.h || 1.6, y = p.y || 1.2;
    tg.box(w + .2, h + .2, .08, "#6a4a30", P(0, y - .1, 0)); tg.box(w, h, .06, "#c8a070", P(0, y, .03));
    for(let i = 0; i < 9; i++){ const bx = (i % 3 - 1) * (w * .3), by = y + .15 + Math.floor(i / 3) * (h * .3); tg.box(.5, .38, .02, ["#f8f0c8", "#f8c8c8", "#c8e8f8", "#d8f8c8"][i % 4], P(bx, by, .07)); tg.sphere(.035, 5, 4, "#c83a3a", P(bx, by + .32, .09)); }
}
function window_(tg, W, p){  // まど（かべ）
    const P = place(p.x, p.z, p.yaw || 0, p.up), w = p.w || 1.8, h = p.h || 1.4, y = p.y || 1.4;
    tg.box(w + .2, h + .2, .1, "#8a5a3a", P(0, y - .1, 0)); tg.box(w, h, .06, p.sky || "#a8dcf8", P(0, y, .04)); tg.box(.06, h, .08, "#8a5a3a", P(0, y, .05)); tg.box(w, .06, .08, "#8a5a3a", P(0, y + h / 2, .05));
    tg.box(.4, h + .15, .1, p.curtain || "#e87a8a", P(-w / 2 - .12, y - .05, .1)); tg.box(.4, h + .15, .1, p.curtain || "#e87a8a", P(w / 2 + .12, y - .05, .1));
}
function clock(tg, W, p){
    const P = place(p.x, p.z, p.yaw || 0, p.up), y = p.y || 2.6;
    tg.cyl(.4, .4, .08, 16, "#6a4a30", M4.mul(P(0, y, 0), M4.RX(PI / 2)), true); tg.cyl(.33, .33, .09, 16, "#f8f4e8", M4.mul(P(0, y, 0), M4.RX(PI / 2)), true);
    tg.box(.04, .22, .02, "#2a2a2a", P(0, y, .06)); tg.box(.16, .04, .02, "#2a2a2a", P(.06, y, .06));
}
function banner(tg, W, p){   // 旗（かべにかける）
    const P = place(p.x, p.z, p.yaw || 0, p.up), c = p.color || "#c83a3a";
    tg.box(.9, 1.5, .05, c, P(0, p.y || 1.5, 0)); tg.box(1.0, .07, .08, "#d0a040", P(0, (p.y || 1.5) + 1.5, 0)); tg.cyl(0, .22, .3, 3, "#ffd24a", P(0, (p.y || 1.5) + .6, .04));
    tg.box(.5, .5, .02, "#ffd24a", P(0, (p.y || 1.5) + .6, .04));
}
function lampstand(tg, W, p){
    const P = place(p.x, p.z, 0, p.up);
    tg.cyl(.07, .12, .08, 8, "#3a3f4a", P(0, 0, 0), true); tg.cyl(.035, .035, 1.4, 6, "#3a3f4a", P(0, 0, 0)); tg.cyl(.28, .18, .3, 8, "#fff2b0", P(0, 1.35, 0), true);
    W.circles.push([p.x, p.z, .2]);
}
function potionshelf(tg, W, p){
    const w = p.w || 2.2, h = p.h || 1.8; const P = place(p.x, p.z, p.yaw || 0, p.up);
    tg.box(w, h, .5, "#6a4a30", P(0, 0, 0)); goodsFace(tg, "potion", p.x, p.z, p.yaw || 0, w - .2, h, p.seed || 5);
    W.colliders.push(bounds(p.x, p.z, w, .5, p.yaw));
}
function flowerpot(tg, W, p){
    const P = place(p.x, p.z, 0, p.up);
    tg.cyl(.25, .18, .3, 8, "#c8784a", P(0, 0, 0), true); for(let i = 0; i < 5; i++){ const a = i * 1.3; tg.cyl(.012, .012, .35, 4, "#3f9a4a", P(Math.cos(a) * .1, .3, Math.sin(a) * .1)); tg.sphere(.09, 6, 4, ["#f0708a", "#f0c040", "#ffffff", "#9a7aff", "#ff9a5a"][i], P(Math.cos(a) * .12, .68, Math.sin(a) * .12)); }
    W.circles.push([p.x, p.z, .28]);
}

function bedtop(tg, W, p){   // 今あるベッド（箱）の上に まくら・ふとん・かざり板をのせる
    const w = p.w || 3, d = p.d || 2.2, h = p.h || .9, P = place(p.x, p.z, 0);
    tg.box(w - .2, .12, d - .2, "#f4f0e8", P(0, h, 0)); tg.box(w * .55, .08, d - .16, p.color || "#e86a8a", P(w * .12, h + .1, 0));
    for(const s of [-.5, .5]) tg.box(.7, .16, .45, "#ffffff", P(-w / 2 + .5, h + .12, s * .8));
    tg.box(.1, h + .55, d, "#8a5a3a", P(-w / 2 - .02, 0, 0));
    for(const s of [-1, 1]) tg.sphere(.09, 6, 4, "#e8c040", P(-w / 2 - .02, h + .6, s * (d / 2 - .1)));
}
function tabletop(tg, W, p){   // 今あるテーブル（箱）の上に 布と食器をのせる
    const w = p.w || 2.6, d = p.d || 1.4, h = p.h || .8, P = place(p.x, p.z, 0);
    tg.box(w + .1, .03, d + .1, p.cloth || "#f8e8e8", P(0, h, 0)); tg.box(w * .3, .02, d + .12, "#e85a5a", P(0, h + .015, 0));
    for(let i = 0; i < 3; i++){ const u = (i - 1) * (w * .3); tg.cyl(.17, .12, .05, 10, "#f0f0f4", P(u, h + .03, .28), true); tg.cyl(.17, .12, .05, 10, "#f0f0f4", P(u, h + .03, -.28), true); }
    tg.cyl(.1, .09, .3, 8, "#5a9ad0", P(0, h + .03, 0), true); for(let i = 0; i < 3; i++) tg.sphere(.09, 6, 4, ["#f0708a", "#f0c040", "#ffffff"][i], P((i - 1) * .08, h + .38 + (i % 2) * .05, 0));
    tg.sphere(.15, 7, 5, "#d8a050", P(-w * .38, h + .15, 0)); tg.cyl(.06, .06, .12, 6, "#e85a5a", P(w * .38, h + .03, .1));
}
function counteritems(tg, W, p){   // 今あるカウンター（箱）の上に 小さな品物をならべる
    const w = p.w || 5, h = p.h || 1.1, kind = p.kind || "potion", P = place(p.x, p.z, p.yaw || 0), pal = PALETTE[kind] || PALETTE.potion;
    const n = Math.floor(w / .55);
    for(let i = 0; i < n; i++){
        const u = (i - (n - 1) / 2) * (w / n), c = pal[Math.floor(hs(i, 4) * pal.length)];
        if(kind === "potion"){ tg.cyl(.09, .11, .22, 8, c, P(u, h + .02, 0)); tg.cyl(.04, .04, .09, 6, "#8a6a40", P(u, h + .24, 0)); }
        else if(kind === "book"){ tg.box(.32, .06, .22, c, P(u, h + .02, 0)); tg.box(.28, .06, .2, pal[(i + 3) % pal.length], P(u, h + .08, 0)); }
        else tg.box(.3, .3, .1, c, P(u, h + .02, 0));
    }
}

const MAKERS = {bedtop, tabletop, counteritems, plant, rug, counter, tv, sofa, table, chair, bed, bookcase, crate, barrel, hay, trough, sack, arcade, capsule, crane, slot, cgame, punchbag, dumbbell, mat, bench, cabinet, stove, fireplace, board, window: window_, clock, banner, lampstand, potionshelf, flowerpot};

/** props の1つを作る。ここで扱える種類なら true */
export function decorProp(env, p){
    const f = MAKERS[p.t]; if(!f) return false;
    f(env.tg, env.W, p); return true;
}
/** ポスター（かべにはる絵）。p: {t:"poster", kind, x, y, z, yaw, w}  → env.posters に積む（world.js が まとめて描く） */
export function decorPoster(env, p){ env.posters.push(p); }
/** 棚（buildings の1つ）に 商品をならべる。b.goods = "games" | "potion" | "book" */
export function decorShelf(tg, b){
    const kind = b.goods, h = b.h || 1.8, seed = Math.round(b.x * 3 + b.z * 5);
    const sides = b.goodsSides || "ew";
    if(b.d >= b.w){   // たて長の棚：左右の長い面
        if(sides.includes("e")) goodsFace(tg, kind, b.x + b.w / 2, b.z, PI / 2, b.d - .3, h, seed);
        if(sides.includes("w")) goodsFace(tg, kind, b.x - b.w / 2, b.z, -PI / 2, b.d - .3, h, seed + 2);
    }else{            // 横長の棚：手前（+z）と奥の面
        if(sides.includes("s")) goodsFace(tg, kind, b.x, b.z + b.d / 2, 0, b.w - .3, h, seed);
        if(sides.includes("n")) goodsFace(tg, kind, b.x, b.z - b.d / 2, PI, b.w - .3, h, seed + 2);
    }
    // 棚の上にも 少し ならべる
    const pal = PALETTE[kind] || PALETTE.games, n = Math.floor((b.d >= b.w ? b.d : b.w) / .5);
    for(let i = 0; i < n; i++){ const u = (i - (n - 1) / 2) * .5; const col = pal[Math.floor(hs(i + seed, 9) * pal.length)]; const M = b.d >= b.w ? M4.T(b.x, h, b.z + u) : M4.T(b.x + u, h, b.z); tg.box(.34, .34, .12, col, M); }
}
export function posterMesh(R, W, env, p){
    const w = p.w || 1.3, h = w * 256 / 192, q = new Geo(); q.sprite(w, h, [1, 1, 1], M4.mul(M4.T(p.x, p.y || 1.8, p.z), M4.RY(p.yaw || 0)));
    const m = R.mesh(q); W.free.push(m); const t = posterTex(R, p.kind); W.parts.push({mesh: m, opt: {mode: 2, tex: t}}); W.free.push({tex: t});
}
