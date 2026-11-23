"use strict";
// ===== AREshoot「バトルロワイヤル」（JSだけで動く別モード。ステージ制の本編は C++/WASM のまま） =====
// ・30人（あなた＋ボット29）が、飛行機から とびおりて、ひろったぶきで たたかう。いちばん さいごまで 生きのこれば ビクトリー。
// ・どんどん せまくなる「安全地帯」（外にいると ダメージ）。補給物資（金のぶき）も 空から おちてくる。
// ・照準は「よこ方向だけ」（本編と同じ）。スマホは エイムアシストで あてやすい。虫は一切 出てきません。
import * as T from "../vendor/three/build/three.module.js";

const $ = (id) => document.getElementById(id);
const HALF = 120, TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = Math.random;
const R = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
function mulberry(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
const angDiff = (a, b) => { let d = a - b; while(d > Math.PI) d -= TAU; while(d < -Math.PI) d += TAU; return d; };

// ---------- ぶき・アイテム ----------
const WD = {
    pistol:  {n:"ピストル",         ic:"🔫", lb:"ピ",  dmg:20, rate:.30, mag:12, range:55,  spr:.022, pel:1, rel:1.3, am:"light", pref:14, sc:1},
    smg:     {n:"サブマシンガン",    ic:"⚡", lb:"SMG", dmg:12, rate:.075,mag:35, range:42,  spr:.05,  pel:1, rel:1.7, am:"light", pref:13, sc:2},
    ar:      {n:"アサルトライフル",  ic:"🔥", lb:"AR",  dmg:19, rate:.11, mag:30, range:75,  spr:.03,  pel:1, rel:2.0, am:"med",   pref:22, sc:3},
    shotgun: {n:"ショットガン",      ic:"💥", lb:"SG",  dmg:12, rate:.85, mag:6,  range:22,  spr:.12,  pel:8, rel:2.4, am:"shell", pref:7,  sc:2.5},
    sniper:  {n:"スナイパー",        ic:"🎯", lb:"SR",  dmg:82, rate:1.3, mag:5,  range:140, spr:.003, pel:1, rel:2.6, am:"snip",  pref:46, sc:2.8}
};
const WKEYS = Object.keys(WD);
const AMMO = {light:{n:"ライトだん", ic:"🟡", amt:36}, med:{n:"ミドルだん", ic:"🟠", amt:30}, shell:{n:"ショットシェル", ic:"🔴", amt:10}, snip:{n:"スナイパーだん", ic:"🟣", amt:8}};
const RAR = [{n:"ふつう", c:0xdddddd, css:"#ddd", m:1}, {n:"レア", c:0x4aa8ff, css:"#4aa8ff", m:1.12}, {n:"エピック", c:0xb04aff, css:"#b04aff", m:1.25}, {n:"ゴールド", c:0xffc83a, css:"#ffc83a", m:1.4}];
const HEAL = {band:{n:"ほうたい", ic:"🩹", lb:"+", t:1.4, hp:20, cap:85}, med:{n:"メディキット", ic:"💊", lb:"+", t:3.2, hp:100, cap:100}, shS:{n:"ちいさなシールド", ic:"🛡️", lb:"盾", t:1.0, ar:25, cap:50}, shL:{n:"おおきなシールド", ic:"🔰", lb:"盾", t:1.8, ar:50, cap:100}};
const NAMES = ["ミートボール","ポテト隊長","カレー王子","おにぎり侍","ラーメン番長","たこ焼き忍者","シチュー姫","ステーキ将軍","パスタ魔王","寿司ロボ","プリン公爵","ピザ伯爵","てんぷら先生","うどん剣士","ケーキ姫","コロッケ兄","ハンバーグ師","ドーナツ姉","とんかつ王","みそ汁博士","サラダ女王","オムライス船長","カツ丼警部","チーズ番長","メロンパン仙人","焼き鳥匠","タルト騎士","ベーコン隊長","ホットドッグ犬"];
const BNAMES = [["レストラン",0xd96a4a],["パンやさん",0xd9a24a],["カフェ",0x8a6a4a],["ラーメンや",0xc84a4a],["おすしや",0x4a9ad9],["ケーキや",0xe88ab8],["やおや",0x6ab04a],["にくや",0xb04a3a],["ちゅうぼう",0x9a9aa8],["ホテル",0x7a6ad9],["ピザや",0xe0803a],["デリ",0x4ab0a0]];
const PH = [{w:40, s:24, r:84, dps:1}, {w:26, s:22, r:56, dps:2}, {w:22, s:18, r:34, dps:4}, {w:18, s:16, r:17, dps:7}, {w:14, s:14, r:4, dps:10}];
const DIFF = {easy:{bots:15, sk:[.2,.48], dmg:.16, spd:4.6, react:1.2}, normal:{bots:29, sk:[.35,.7], dmg:.26, spd:5.0, react:.9}, hard:{bots:29, sk:[.6,.95], dmg:.42, spd:5.6, react:.5}};
const PLANE_T = 9, GLIDE_V = 16;

// ---------- 共有ジオメトリ・マテリアル ----------
const SHARED = new Set();
const sh = (o) => { SHARED.add(o); return o; };
const GEO = {
    body: sh(new T.CapsuleGeometry(.42, .78, 4, 10)), head: sh(new T.SphereGeometry(.28, 14, 10)), hat: sh(new T.CylinderGeometry(.26, .3, .32, 12)),
    gun: sh(new T.BoxGeometry(.14, .14, .7)), chute: sh(new T.SphereGeometry(2.4, 14, 8, 0, TAU, 0, Math.PI / 2)), shadow: sh(new T.CircleGeometry(.6, 14)),
    ring: sh(new T.CircleGeometry(.85, 18)), beam: sh(new T.CylinderGeometry(.1, .1, 3.2, 6)), box: sh(new T.BoxGeometry(1, 1, 1)),
    cyl: sh(new T.CylinderGeometry(1, 1, 1, 14)), trunk: sh(new T.CylinderGeometry(.35, .5, 2.4, 7)), leaf: sh(new T.ConeGeometry(2.1, 5.4, 8)), rock: sh(new T.IcosahedronGeometry(1, 0))
};
const MAT = {
    hat: sh(new T.MeshLambertMaterial({color: 0xffffff})), gun: sh(new T.MeshLambertMaterial({color: 0x2a2a2a})), chute: sh(new T.MeshLambertMaterial({color: 0xff6a3a, side: T.DoubleSide})),
    shadow: sh(new T.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: .32, depthWrite: false})),
    trunk: sh(new T.MeshLambertMaterial({color: 0x6a4a2a})), leaf: sh(new T.MeshLambertMaterial({color: 0x3f8f45})), rock: sh(new T.MeshLambertMaterial({color: 0x8a8a92})),
    crate: sh(new T.MeshLambertMaterial({color: 0xb98a52})), floor: sh(new T.MeshLambertMaterial({color: 0xcdbfa6})),
    ring: RAR.map((r) => sh(new T.MeshBasicMaterial({color: r.c, transparent: true, opacity: .55, depthWrite: false}))),
    beam: RAR.map((r) => sh(new T.MeshBasicMaterial({color: r.c, transparent: true, opacity: .4, depthWrite: false}))),
    tracer: sh(new T.LineBasicMaterial({color: 0xfff1b0, transparent: true, opacity: .9}))
};
const TEX = new Map();
let SHEET = null;   // 画像シート（img/br-items.png）が あれば、その切りぬき
function itemTex(kind, key, rar){
    const k = kind + key + rar; if(TEX.has(k)) return TEX.get(k);
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    const col = RAR[rar].css;
    const sheetIdx = sheetIndexOf(kind, key);
    if(SHEET && sheetIdx >= 0){
        const cw = SHEET.width / 4, ch = SHEET.height / 4, sx = (sheetIdx % 4) * cw, sy = Math.floor(sheetIdx / 4) * ch;
        x.drawImage(SHEET, sx, sy, cw, ch, 4, 4, 120, 120);
        x.strokeStyle = col; x.lineWidth = 6; x.strokeRect(3, 3, 122, 122);
    }else{
        x.fillStyle = "rgba(10,10,30,.78)"; x.beginPath(); x.roundRect ? x.roundRect(6, 6, 116, 116, 22) : x.rect(6, 6, 116, 116); x.fill();
        x.strokeStyle = col; x.lineWidth = 7; x.stroke();
        const def = kind === "w" ? WD[key] : kind === "a" ? AMMO[key] : HEAL[key];
        x.font = "58px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(def.ic, 64, 54);
        x.font = "bold 28px sans-serif"; x.fillStyle = col; x.fillText(kind === "w" ? def.lb : kind === "a" ? "だん" : def.lb, 64, 100);
    }
    const t = new T.CanvasTexture(c); TEX.set(k, t); return t;
}
const SHEET_ORDER = ["ar", "smg", "shotgun", "sniper", "pistol", "@ammo", "band", "med", "shS", "shL"];
function sheetIndexOf(kind, key){ if(kind === "w") return SHEET_ORDER.indexOf(key); if(kind === "a") return 5; return SHEET_ORDER.indexOf(key); }
(function loadSheet(){ try{ const im = new Image(); im.onload = () => { SHEET = im; TEX.clear(); if(S) S.pk.forEach((p) => { if(p.sprite){ p.sprite.material.map = itemTex(p.kind, p.key, p.rar); p.sprite.material.needsUpdate = true; } }); }; im.onerror = () => {}; im.src = "img/br-items.png"; }catch(_e){} })();
function labelTex(text, color){
    const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d");
    x.fillStyle = "rgba(20,10,40,.7)"; x.beginPath(); x.roundRect ? x.roundRect(4, 4, 248, 56, 16) : x.rect(4, 4, 248, 56); x.fill();
    x.font = "bold 34px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillStyle = color || "#fff"; x.fillText(text, 128, 34);
    return new T.CanvasTexture(c);
}
function groundTex(){
    const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d");
    x.fillStyle = "#5a9a4a"; x.fillRect(0, 0, 256, 256);
    const rr = mulberry(77);
    for(let i = 0; i < 900; i++){ x.fillStyle = rr() < .5 ? "rgba(70,130,60,.45)" : "rgba(130,180,95,.4)"; x.fillRect(rr() * 256, rr() * 256, 2 + rr() * 5, 2 + rr() * 5); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(18, 18); return t;
}

// ---------- 状態 ----------
let S = null, renderer = null, scene = null, camera = null, raf = 0, active = false, opts = null, lastT = 0, bgmEl = null, actx = null, sndT = 0;
const Inp = {mf: 0, ms: 0, yaw: 0, fire: false, sprint: false, rel: false, use: false, pick: false, jump: false, slot: -1};
const keys = {};

function beep(freq, dur, type, vol){
    try{
        if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type || "sine"; o.frequency.value = freq; g.gain.value = (vol == null ? 1 : vol) * ((opts && opts.settings.se) || .8);
        o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur); o.stop(actx.currentTime + dur);
    }catch(_e){}
}
const sfxShot = (type, vol) => beep({pistol: 900, smg: 1300, ar: 1050, shotgun: 140, sniper: 480}[type] || 900, type === "shotgun" || type === "sniper" ? .16 : .045, type === "shotgun" ? "sawtooth" : "square", vol);

// ---------- 当たり判定（よこ方向の2D） ----------
function rayBox(ox, oz, dx, dz, b){
    let tmin = 0, tmax = 1e9;
    if(Math.abs(dx) < 1e-9){ if(ox < b.x0 || ox > b.x1) return null; }
    else{ let t1 = (b.x0 - ox) / dx, t2 = (b.x1 - ox) / dx; if(t1 > t2){ const s = t1; t1 = t2; t2 = s; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if(tmin > tmax) return null; }
    if(Math.abs(dz) < 1e-9){ if(oz < b.z0 || oz > b.z1) return null; }
    else{ let t1 = (b.z0 - oz) / dz, t2 = (b.z1 - oz) / dz; if(t1 > t2){ const s = t1; t1 = t2; t2 = s; } tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2); if(tmin > tmax) return null; }
    return tmin;
}
function rayCirc(ox, oz, dx, dz, cx, cz, r){
    const fx = ox - cx, fz = oz - cz, b = fx * dx + fz * dz, c = fx * fx + fz * fz - r * r;
    if(c > 0 && b > 0) return null;
    const disc = b * b - c; if(disc < 0) return null;
    const t = -b - Math.sqrt(disc); return t < 0 ? 0 : t;
}
function rayWall(ox, oz, dx, dz, maxT){
    let best = maxT; const ex = ox + dx * maxT, ez = oz + dz * maxT, mnx = Math.min(ox, ex) - 2, mxx = Math.max(ox, ex) + 2, mnz = Math.min(oz, ez) - 2, mxz = Math.max(oz, ez) + 2;
    for(const c of S.col){
        if(c.t === 0){ if(c.x1 < mnx || c.x0 > mxx || c.z1 < mnz || c.z0 > mxz) continue; const t = rayBox(ox, oz, dx, dz, c); if(t !== null && t < best) best = t; }
        else{ if(c.x + c.r < mnx || c.x - c.r > mxx || c.z + c.r < mnz || c.z - c.r > mxz) continue; const t = rayCirc(ox, oz, dx, dz, c.x, c.z, c.r); if(t !== null && t < best) best = t; }
    }
    return best;
}
function los(ax, az, bx, bz){ const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz); if(d < .01) return true; return rayWall(ax, az, dx / d, dz / d, d) >= d - .01; }
function pushOut(a){
    const r = .45;
    a.x = clamp(a.x, -HALF + 1, HALF - 1); a.z = clamp(a.z, -HALF + 1, HALF - 1);
    for(const c of S.col){
        if(c.t === 0){
            if(a.x < c.x0 - r || a.x > c.x1 + r || a.z < c.z0 - r || a.z > c.z1 + r) continue;
            const nx = clamp(a.x, c.x0, c.x1), nz = clamp(a.z, c.z0, c.z1), dx = a.x - nx, dz = a.z - nz, d2 = dx * dx + dz * dz;
            if(d2 > 0){ if(d2 < r * r){ const d = Math.sqrt(d2); a.x += dx / d * (r - d); a.z += dz / d * (r - d); } }
            else{ const l = a.x - c.x0, rr = c.x1 - a.x, u = a.z - c.z0, dn = c.z1 - a.z, m = Math.min(l, rr, u, dn); if(m === l) a.x = c.x0 - r; else if(m === rr) a.x = c.x1 + r; else if(m === u) a.z = c.z0 - r; else a.z = c.z1 + r; }
        }else{
            const dx = a.x - c.x, dz = a.z - c.z, rr = r + c.r; if(Math.abs(dx) > rr || Math.abs(dz) > rr) continue;
            const d2 = dx * dx + dz * dz; if(d2 < rr * rr){ const d = Math.sqrt(d2) || .001; a.x = c.x + dx / d * rr; a.z = c.z + dz / d * rr; }
        }
    }
}

// ---------- マップ ----------
function addBox(x0, x1, z0, z1, h, mat, y0){
    const m = new T.Mesh(GEO.box, mat); m.scale.set(x1 - x0, h, z1 - z0); m.position.set((x0 + x1) / 2, (y0 || 0) + h / 2, (z0 + z1) / 2); scene.add(m);
    return m;
}
function buildWorld(){
    const rr = mulberry(20261124), col = [], blds = [];
    scene.background = new T.Color(0x9ad4ff); scene.fog = new T.Fog(0xbfe3ff, 40, 150);
    scene.add(new T.HemisphereLight(0xffffff, 0x6a8a50, .95));
    const sun = new T.DirectionalLight(0xfff1d0, .85); sun.position.set(30, 50, 20); scene.add(sun);
    const sea = new T.Mesh(new T.PlaneGeometry(900, 900), new T.MeshLambertMaterial({color: 0x3a8ad9})); sea.rotation.x = -Math.PI / 2; sea.position.y = -.2; scene.add(sea);
    const ground = new T.Mesh(new T.PlaneGeometry(HALF * 2 + 4, HALF * 2 + 4), new T.MeshLambertMaterial({map: groundTex()})); ground.rotation.x = -Math.PI / 2; scene.add(ground);
    // たてもの：マス目ごとに、ほとんどのマスに1つ（ドアが2つ）
    let bi = 0;
    for(let gx = 0; gx < 5; gx++) for(let gz = 0; gz < 5; gz++){
        if(gx === 2 && gz === 2 ? false : rr() < .2) continue;
        const cx = -96 + gx * 48 + (rr() - .5) * 14, cz = -96 + gz * 48 + (rr() - .5) * 14, w = 11 + rr() * 6, d = 10 + rr() * 5, th = .7, H = 3.6;
        const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, [nm, color] = BNAMES[bi % BNAMES.length]; bi++;
        const mat = new T.MeshLambertMaterial({color});
        const doors = [];
        const seg = (ax0, ax1, az0, az1) => { if(ax1 - ax0 < .05 || az1 - az0 < .05) return; col.push({t: 0, x0: ax0, x1: ax1, z0: az0, z1: az1}); addBox(ax0, ax1, az0, az1, H, mat); };
        // 北（z0）と南（z1）の壁：どちらかに ドア。東西の壁にも ドア
        const gapN = x0 + 2 + rr() * (w - 7), gapS = x0 + 2 + rr() * (w - 7), gapE = z0 + 2 + rr() * (d - 7), gapW = z0 + 2 + rr() * (d - 7), dw = 3.4;
        seg(x0, gapN, z0 - th / 2, z0 + th / 2); seg(gapN + dw, x1, z0 - th / 2, z0 + th / 2);
        seg(x0, gapS, z1 - th / 2, z1 + th / 2); seg(gapS + dw, x1, z1 - th / 2, z1 + th / 2);
        const noE = rr() < .3, noW = rr() < .3;
        if(noE) seg(x1 - th / 2, x1 + th / 2, z0, z1); else{ seg(x1 - th / 2, x1 + th / 2, z0, gapE); seg(x1 - th / 2, x1 + th / 2, gapE + dw, z1); doors.push({x: x1, z: gapE + dw / 2, nx: 1, nz: 0}); }
        if(noW) seg(x0 - th / 2, x0 + th / 2, z0, z1); else{ seg(x0 - th / 2, x0 + th / 2, z0, gapW); seg(x0 - th / 2, x0 + th / 2, gapW + dw, z1); doors.push({x: x0, z: gapW + dw / 2, nx: -1, nz: 0}); }
        doors.push({x: gapN + dw / 2, z: z0, nx: 0, nz: -1}, {x: gapS + dw / 2, z: z1, nx: 0, nz: 1});
        const fl = addBox(x0, x1, z0, z1, .08, MAT.floor, 0); fl.position.y = .04;
        // 中の はこ
        if(rr() < .7){ const bx = x0 + 2.5 + rr() * (w - 5), bz = z0 + 2.5 + rr() * (d - 5); col.push({t: 0, x0: bx - .8, x1: bx + .8, z0: bz - .8, z1: bz + .8}); addBox(bx - .8, bx + .8, bz - .8, bz + .8, 1.6, MAT.crate); }
        const lab = new T.Sprite(new T.SpriteMaterial({map: labelTex(nm, "#fff"), depthWrite: false})); lab.scale.set(9, 2.25, 1); lab.position.set(cx, H + 2.4, cz); scene.add(lab);
        blds.push({x0, x1, z0, z1, cx, cz, w, d, doors, name: nm});
    }
    // 木・岩・はこ
    const free = (x, z, m) => { for(const b of blds){ if(x > b.x0 - m && x < b.x1 + m && z > b.z0 - m && z < b.z1 + m) return false; } return true; };
    const trees = []; let tries = 0;
    while(trees.length < 90 && tries++ < 900){ const x = R(-HALF + 4, HALF - 4), z = R(-HALF + 4, HALF - 4); if(free(x, z, 3.5)) trees.push({x, z, s: .8 + rr() * .7}); }
    const tm = new T.InstancedMesh(GEO.trunk, MAT.trunk, trees.length), lm = new T.InstancedMesh(GEO.leaf, MAT.leaf, trees.length), dm = new T.Object3D();
    trees.forEach((t, i) => { dm.position.set(t.x, 1.2 * t.s, t.z); dm.scale.set(t.s, t.s, t.s); dm.updateMatrix(); tm.setMatrixAt(i, dm.matrix); dm.position.set(t.x, 4.2 * t.s, t.z); dm.updateMatrix(); lm.setMatrixAt(i, dm.matrix); col.push({t: 1, x: t.x, z: t.z, r: .5 * t.s}); });
    scene.add(tm, lm);
    for(let i = 0; i < 34; i++){
        const x = R(-HALF + 5, HALF - 5), z = R(-HALF + 5, HALF - 5); if(!free(x, z, 2.5)) continue;
        if(i % 2){ const r = 1 + rr() * .9; const m = new T.Mesh(GEO.rock, MAT.rock); m.scale.set(r, r * .8, r); m.position.set(x, r * .5, z); scene.add(m); col.push({t: 1, x, z, r: r * .9}); }
        else{ addBox(x - .8, x + .8, z - .8, z + .8, 1.6, MAT.crate); col.push({t: 0, x0: x - .8, x1: x + .8, z0: z - .8, z1: z + .8}); }
    }
    // 島のふち（見えないかべ＋見える柵）
    return {col, blds};
}
function bldAt(x, z, m){ for(const b of S.blds){ if(x > b.x0 - (m || 0) && x < b.x1 + (m || 0) && z > b.z0 - (m || 0) && z < b.z1 + (m || 0)) return b; } return null; }

// ---------- アクター ----------
function makeChar(color){
    const g = new T.Group(), bodyM = new T.MeshLambertMaterial({color}), headM = new T.MeshLambertMaterial({color: 0xf0c8a0});
    const body = new T.Mesh(GEO.body, bodyM); body.position.y = .95; g.add(body);
    const head = new T.Mesh(GEO.head, headM); head.position.y = 1.72; g.add(head);
    const hat = new T.Mesh(GEO.hat, MAT.hat); hat.position.y = 2.02; g.add(hat);
    const gun = new T.Mesh(GEO.gun, MAT.gun); gun.position.set(.32, 1.05, .5); g.add(gun);
    const chute = new T.Mesh(GEO.chute, MAT.chute); chute.position.y = 3.4; chute.visible = false; g.add(chute);
    g.userData = {bodyM, headM, chute};
    return g;
}
function mkActor(i, isPlayer, name){
    const color = isPlayer ? 0x3a6fd9 : new T.Color().setHSL(rnd(), .6, .5).getHex();
    const a = {id: i, name, isPlayer, x: 0, z: 0, y: 0, yaw: R(0, TAU), hp: 100, armor: 0, alive: true, grounded: false, slots: [null, null, null], cur: 0, am: {light: 0, med: 0, shell: 0, snip: 0}, it: {band: 0, med: 0, shS: 0, shL: 0},
        kills: 0, fireCd: 0, reloadT: 0, healT: 0, healKind: null, flash: 0, dead: 0, walk: 0, dmgDealt: 0,
        // ボット用
        sk: .5, aggr: .5, cool: 0, fightT: 0, target: null, seeT: 0, lost: 0, thinkT: R(0, .3), mode: "loot", goal: null, wait: 0, strafe: 1, strafeT: 0, stuckT: 0, lx: 0, lz: 0, land: 0, spot: null, dist: 0, err: 0};
    a.mesh = makeChar(color); a.mesh.visible = false; scene.add(a.mesh);
    a.shadow = new T.Mesh(GEO.shadow, MAT.shadow); a.shadow.rotation.x = -Math.PI / 2; a.shadow.position.y = .05; a.shadow.visible = false; scene.add(a.shadow);
    return a;
}
const curW = (a) => a.slots[a.cur];
const hasGun = (a) => a.slots.some((w) => w && (w.mag > 0 || a.am[WD[w.type].am] > 0));
function wScore(w, a){ if(!w) return -1; const d = WD[w.type]; return d.sc * (1 + w.rar * .25) * ((w.mag > 0 || a.am[d.am] > 0) ? 1 : .2); }
function bestSlot(a){ let b = 0, bs = -2; a.slots.forEach((w, i) => { const s = wScore(w, a); if(s > bs){ bs = s; b = i; } }); return b; }

function giveWeapon(a, type, rar, slot){
    const d = WD[type];
    let i = slot != null ? slot : a.slots.findIndex((w) => !w);
    if(i < 0) return -1;
    a.slots[i] = {type, rar, mag: d.mag}; a.am[d.am] += Math.round(AMMO[d.am].amt * .8);
    if(!curW(a) || a.slots[a.cur] === a.slots[i] || wScore(a.slots[i], a) > wScore(curW(a), a) + .01){ a.cur = i; }
    return i;
}
function damage(v, dmg, src, wname, storm){
    if(!v.alive || v.god || dmg <= 0) return;
    if(!storm){ const ab = Math.min(v.armor, dmg * .6); v.armor -= ab; dmg -= ab; }
    v.hp -= dmg; v.flash = .12;
    if(v.healT > 0 && !storm){ v.healT = 0; v.healKind = null; }
    if(src && src !== v){ src.dmgDealt += dmg; if(!v.isPlayer && !v.target && src.alive && hasGun(v)) { v.target = src; v.seeT = 0; v.lost = 0; } }
    if(v.isPlayer){
        S.hurtT = .25;
        if(src && src !== v){ S.hitDir = Math.atan2(src.x - v.x, src.z - v.z); S.hitDirT = 1.2; }
        if(!storm && S.lastHurtSnd < S.t - .15){ beep(160, .15, "sawtooth", .35); S.lastHurtSnd = S.t; }
    }
    if(src && src.isPlayer && src !== v){ S.hitT = .2; floatText(v, Math.round(dmg)); beep(520, .05, "triangle", .3); }
    if(v.hp <= 0) kill(v, src, wname, storm);
}
function kill(v, src, wname, storm){
    v.alive = false; v.hp = 0; v.dead = 0; v.target = null;
    S.aliveN = Math.max(0, S.aliveN - 1); v.place = Math.max(1, S.aliveN + 1);
    if(src && src !== v) src.kills++;
    const nm = (a) => a.isPlayer ? "あなた" : a.name;
    if(S.log.length < 80) S.log.push([+S.t.toFixed(1), nm(v), src ? nm(src) : "-", wname || "", src ? Math.round(Math.hypot(src.x - v.x, src.z - v.z)) : 0, Math.round(v.armor)]);
    feed(storm ? nm(v) + " が ストームで 脱落" : nm(src) + " が " + nm(v) + " を たおした（" + (wname || "") + "）", (src && src.isPlayer) || v.isPlayer);
    // ドロップ
    v.slots.forEach((w) => { if(w) dropPk("w", w.type, w.rar, v.x + R(-1, 1), v.z + R(-1, 1)); });
    ["light", "med", "shell", "snip"].forEach((k) => { if(v.am[k] > 0) dropPk("a", k, 0, v.x + R(-1.2, 1.2), v.z + R(-1.2, 1.2)); });
    ["band", "med", "shS", "shL"].forEach((k) => { if(v.it[k] > 0) dropPk("h", k, k === "shL" ? 1 : 0, v.x + R(-1.2, 1.2), v.z + R(-1.2, 1.2)); });
    if(v.isPlayer){ S.over = {win: false, place: v.place}; S.overT = 1.6; beep(200, .4, "sawtooth", .4); }
    else if(src && src.isPlayer){ beep(300, .2, "sawtooth", .4); S.killMsgT = 1.6; S.killMsg = v.name + " を たおした！（" + src.kills + "キル）"; }
    if(S.aliveN === 1 && S.player.alive && !S.over){ S.over = {win: true, place: 1}; S.overT = 1.8; }
}

// ---------- ひろいもの ----------
function addPk(kind, key, rar, x, z){
    const p = {id: ++S.pkId, kind, key, rar, x, z, alive: true, t: rnd() * 6};
    const sp = new T.Sprite(new T.SpriteMaterial({map: itemTex(kind, key, rar), depthWrite: false})); sp.scale.set(1.25, 1.25, 1); sp.position.set(x, 1.1, z); scene.add(sp); p.sprite = sp;
    const rg = new T.Mesh(GEO.ring, MAT.ring[rar]); rg.rotation.x = -Math.PI / 2; rg.position.set(x, .06, z); scene.add(rg); p.ring = rg;
    if(rar >= 1){ const bm = new T.Mesh(GEO.beam, MAT.beam[rar]); bm.position.set(x, 1.7, z); scene.add(bm); p.beam = bm; }
    S.pk.push(p); return p;
}
function dropPk(kind, key, rar, x, z){ return addPk(kind, key, rar, clamp(x, -HALF + 1, HALF - 1), clamp(z, -HALF + 1, HALF - 1)); }
function rollRar(){ const r = rnd(); return r < .58 ? 0 : r < .84 ? 1 : r < .96 ? 2 : 3; }
function rollItem(){
    const r = rnd();
    if(r < .38){ const k = rnd(), t = k < .2 ? "pistol" : k < .42 ? "smg" : k < .68 ? "ar" : k < .88 ? "shotgun" : "sniper"; return ["w", t, rollRar()]; }
    if(r < .60) return ["a", pick(["light", "light", "med", "med", "shell", "snip"]), 0];
    if(r < .82) { const k = rnd() < .62 ? "band" : "med"; return ["h", k, k === "med" ? 1 : 0]; }
    const k = rnd() < .65 ? "shS" : "shL"; return ["h", k, k === "shL" ? 1 : 0];
}
function removePk(p){ p.alive = false; scene.remove(p.sprite); scene.remove(p.ring); if(p.beam) scene.remove(p.beam); }
function wantPk(a, p){
    if(p.kind === "w"){ const d = WD[p.key]; if(a.slots.some((w) => !w)) return true; const worst = Math.min(...a.slots.map((w) => wScore(w, a))); return d.sc * (1 + p.rar * .25) > worst + .4; }
    if(p.kind === "a"){ return a.slots.some((w) => w && WD[w.type].am === p.key) && a.am[p.key] < AMMO[p.key].amt * 3; }
    if(p.key === "band") return a.it.band < 4; if(p.key === "med") return a.it.med < 2; if(p.key === "shS") return a.it.shS < 4; return a.it.shL < 2;
}
function takePk(a, p){
    if(p.kind === "w"){
        let i = a.slots.findIndex((w) => !w);
        if(i < 0){ const sc = a.slots.map((w) => wScore(w, a)); i = sc.indexOf(Math.min(...sc)); const o = a.slots[i]; if(o) dropPk("w", o.type, o.rar, a.x + R(-1.4, 1.4), a.z + R(-1.4, 1.4)); }
        giveWeapon(a, p.key, p.rar, i); if(a.isPlayer) toast(WD[p.key].ic + " " + WD[p.key].n + "（" + RAR[p.rar].n + "）をひろった");
    }else if(p.kind === "a"){ a.am[p.key] += AMMO[p.key].amt; if(a.isPlayer) toast(AMMO[p.key].ic + " " + AMMO[p.key].n + " +" + AMMO[p.key].amt); }
    else{ a.it[p.key]++; if(a.isPlayer) toast(HEAL[p.key].ic + " " + HEAL[p.key].n + " をひろった"); }
    removePk(p);
}

// ---------- 戦闘 ----------
function startReload(a){ const w = curW(a); if(!w || a.reloadT > 0) return; const d = WD[w.type]; if(w.mag >= d.mag || a.am[d.am] <= 0) return; a.reloadT = d.rel; a.healT = 0; a.healKind = null; if(a.isPlayer) beep(500, .08, "square", .2); }
function tryFire(a, yaw, dmgMul){
    const w = curW(a); if(!w || a.reloadT > 0 || a.fireCd > 0 || a.healT > 0 || !a.grounded) return false;
    const d = WD[w.type];
    if(w.mag <= 0){ startReload(a); return false; }
    w.mag--; a.fireCd = d.rate;
    const ox = a.x + Math.sin(yaw) * .6, oz = a.z + Math.cos(yaw) * .6;
    const wm = RAR[w.rar].m * (dmgMul || 1);
    for(let p = 0; p < d.pel; p++){
        const ang = yaw + gauss() * (d.spr + (a.isPlayer ? (S.crouch ? 0 : .004) : (1 - a.sk) * .035)), dx = Math.sin(ang), dz = Math.cos(ang);
        let tw = rayWall(ox, oz, dx, dz, d.range), vic = null;
        for(const v of S.actors){
            if(v === a || !v.alive || !v.grounded) continue;
            const t = rayCirc(ox, oz, dx, dz, v.x, v.z, .55); if(t !== null && t < tw){ tw = t; vic = v; }
        }
        if(vic) damage(vic, d.dmg * wm * (d.pel > 1 ? 1 - .6 * (tw / d.range) : 1), a, d.n);
        tracer(ox, oz, ox + dx * tw, oz + dz * tw);
    }
    if(a.isPlayer){ sfxShot(w.type, .22); S.muzzleT = .06; if(w.mag === 0) startReload(a); }
    else if(S.t - sndT > .05){ const dist = Math.hypot(a.x - S.player.x, a.z - S.player.z); if(dist < 50){ sfxShot(w.type, .16 / (1 + dist / 14)); sndT = S.t; } }
    return true;
}
function tracer(x0, z0, x1, z1){
    const l = S.tr[S.trI++ % S.tr.length], ar = l.geometry.attributes.position.array;
    ar[0] = x0; ar[1] = 1.15; ar[2] = z0; ar[3] = x1; ar[4] = 1.15; ar[5] = z1; l.geometry.attributes.position.needsUpdate = true; l.visible = true; l.userData.life = .07;
}
function useItem(a){
    if(a.healT > 0 || a.reloadT > 0 && false) return false;
    let k = null;
    if(a.hp <= 55 && a.it.med > 0) k = "med";
    else if(a.hp < 85 && a.it.band > 0) k = "band";
    else if(a.hp < 100 && a.it.med > 0 && a.it.band === 0) k = "med";
    else if(a.armor < 50 && a.it.shS > 0) k = "shS";
    else if(a.armor < 100 && a.it.shL > 0) k = "shL";
    else if(a.armor < 100 && a.it.shS > 0) k = "shS";
    if(!k) return false;
    a.healKind = k; a.healT = HEAL[k].t; if(a.isPlayer) toast(HEAL[k].ic + " " + HEAL[k].n + " つかっています…"); return true;
}
function finishHeal(a){ const h = HEAL[a.healKind]; if(!h) return; a.it[a.healKind]--; if(h.hp) a.hp = Math.min(h.cap, Math.max(a.hp, a.hp + h.hp)); if(h.ar) a.armor = Math.min(h.cap, a.armor + h.ar); a.healKind = null; if(a.isPlayer) beep(660, .12, "triangle", .3); }
function timers(a, dt){
    if(a.fireCd > 0) a.fireCd -= dt;
    if(a.flash > 0) a.flash -= dt;
    if(a.reloadT > 0){ a.reloadT -= dt; if(a.reloadT <= 0){ const w = curW(a); if(w){ const d = WD[w.type], take = Math.min(d.mag - w.mag, a.am[d.am]); w.mag += take; a.am[d.am] -= take; } } }
    if(a.healT > 0){ a.healT -= dt; if(a.healT <= 0 && a.healKind) finishHeal(a); }
}

// ---------- 安全地帯 ----------
function zoneNext(){
    const z = S.zone; z.ph++;
    if(z.ph >= PH.length){ z.mode = "final"; z.t = 0; return; }
    const p = PH[z.ph], maxOff = Math.max(0, z.r - p.r) * .85, ang = R(0, TAU), off = R(0, maxOff);
    z.from = {cx: z.cx, cz: z.cz, r: z.r}; z.to = {cx: clamp(z.cx + Math.cos(ang) * off, -HALF + p.r * .4, HALF - p.r * .4), cz: clamp(z.cz + Math.sin(ang) * off, -HALF + p.r * .4, HALF - p.r * .4), r: p.r};
    z.mode = "wait"; z.t = p.w; z.dps = p.dps;
    if(z.ph >= 1) supplyDrop();
    if(z.ph === 0) { z.to.cx = clamp(R(-25, 25), -HALF + p.r * .4, HALF - p.r * .4); z.to.cz = clamp(R(-25, 25), -HALF + p.r * .4, HALF - p.r * .4); }
}
function zoneUpdate(dt){
    const z = S.zone; if(z.mode === "final") return;
    z.t -= dt; const p = PH[z.ph];
    if(z.mode === "wait"){ if(z.t <= 0){ z.mode = "shrink"; z.t = p.s; toastBig("⚠ 安全地帯が せまくなる！"); } }
    else{
        const k = clamp(1 - z.t / p.s, 0, 1); z.cx = lerp(z.from.cx, z.to.cx, k); z.cz = lerp(z.from.cz, z.to.cz, k); z.r = lerp(z.from.r, z.to.r, k);
        if(z.t <= 0){ z.cx = z.to.cx; z.cz = z.to.cz; z.r = z.to.r; zoneNext(); }
    }
}
const inZone = (x, z) => Math.hypot(x - S.zone.cx, z - S.zone.cz) <= S.zone.r;
function supplyDrop(){
    const z = S.zone.to || S.zone, a = R(0, TAU), d = R(0, z.r * .6), x = clamp(z.cx + Math.cos(a) * d, -HALF + 6, HALF - 6), zz = clamp(z.cz + Math.sin(a) * d, -HALF + 6, HALF - 6);
    const crate = addBox(x - .9, x + .9, zz - .9, zz + .9, 1.8, new T.MeshLambertMaterial({color: 0xff9a2a})); S.col.push({t: 0, x0: x - .9, x1: x + .9, z0: zz - .9, z1: zz + .9});
    const beam = new T.Mesh(new T.CylinderGeometry(.5, .5, 60, 8, 1, true), new T.MeshBasicMaterial({color: 0xffd23a, transparent: true, opacity: .35, side: T.DoubleSide, depthWrite: false})); beam.position.set(x, 30, zz); scene.add(beam);
    const o = [["w", "sniper", 3], ["w", "ar", 3], ["w", pick(["shotgun", "smg"]), 2], ["h", "shL", 1], ["h", "med", 1]];
    o.forEach((it, i) => { const an = i / o.length * TAU; addPk(it[0], it[1], it[2], x + Math.cos(an) * 2.2, zz + Math.sin(an) * 2.2); });
    S.drops.push({x, z: zz, crate, beam}); toastBig("📦 補給物資が とうかした！（地図の ⭐）");
}

// ---------- ボット ----------
function botGoalPick(b){
    // 近くの ほしい ひろいもの → なければ ゾーンの中を ぶらぶら
    let best = null, bd = 55;
    for(const p of S.pk){ if(!p.alive) continue; const d = Math.hypot(p.x - b.x, p.z - b.z); if(d < bd && wantPk(b, p)){ bd = d; best = p; } }
    if(best){ b.goal = {x: best.x, z: best.z, pk: best}; b.mode = "loot"; return; }
    const zc = S.zone.mode === "wait" ? S.zone.to : S.zone;
    for(let i = 0; i < 10; i++){ const a = R(0, TAU), d = R(0, zc.r * .8), x = zc.cx + Math.cos(a) * d, z = zc.cz + Math.sin(a) * d; if(Math.abs(x) < HALF - 3 && Math.abs(z) < HALF - 3 && !bldAt(x, z, 1)){ b.goal = {x, z}; b.mode = "roam"; return; } }
    b.goal = {x: zc.cx, z: zc.cz}; b.mode = "roam";
}
function botWaypoint(b, g){
    // ゴールが たてものの中なら、ドアを とおる
    const gb = bldAt(g.x, g.z, -.2), mb = bldAt(b.x, b.z, .3);
    if(gb && gb !== mb){ let bd = 1e9, bs = null; gb.doors.forEach((d) => { const dd = Math.hypot(d.x - b.x, d.z - b.z); if(dd < bd){ bd = dd; bs = d; } }); if(bs){ const out = {x: bs.x + bs.nx * 2.4, z: bs.z + bs.nz * 2.4}; if(Math.hypot(out.x - b.x, out.z - b.z) > 1.3 && Math.hypot(bs.x - b.x, bs.z - b.z) > 3.5) return out; return {x: bs.x - bs.nx * 1.6, z: bs.z - bs.nz * 1.6, door: true}; } }
    if(mb && mb !== gb){ let bd = 1e9, bs = null; mb.doors.forEach((d) => { const dd = Math.hypot(d.x - b.x, d.z - b.z); if(dd < bd){ bd = dd; bs = d; } }); if(bs) return {x: bs.x + bs.nx * 2.4, z: bs.z + bs.nz * 2.4}; }
    return g;
}
function botThink(b){
    const w = curW(b), view = w && WD[w.type].range > 100 ? 70 : 38;
    let best = null, bd = 1e9;
    const armed = hasGun(b);
    // ぶきが ないあいだは たたかわない（ひろいに いく）
    if(b.cool > 0) b.cool -= .3;
    if(armed && b.cool <= 0) for(const a of S.actors){ if(a === b || !a.alive || !a.grounded) continue; const d = Math.hypot(a.x - b.x, a.z - b.z); if(d < view && d < bd && los(b.x, b.z, a.x, a.z)){ best = a; bd = d; } }
    else if(b.target){ b.target = null; }
    if(best){ if(b.target !== best){ b.target = best; b.seeT = 0; b.fightT = 0; } b.lost = 0; b.dist = bd; }
    else if(b.target){ b.lost += .3; if(b.lost > 3.5 || !b.target.alive) b.target = null; }
    if(b.target && ((b.hp < 38 && (b.it.band > 0 || b.it.med > 0)) || (b.fightT > 7 && b.aggr < .6) || b.fightT > 12)){ b.target = null; b.cool = 5 + rnd() * 3; b.fightT = 0; if(b.hp < 70) useItem(b); }
    if(armed){ const bs = bestSlot(b); if(bs !== b.cur && b.reloadT <= 0){ b.cur = bs; } }
    if(b.target) { b.mode = "fight"; return; }
    if(b.hp < 60 && (b.it.band > 0 || b.it.med > 0) && b.healT <= 0 && (b.mode !== "zone")) { useItem(b); b.mode = "heal"; return; }
    if(b.armor < 40 && (b.it.shS > 0 || b.it.shL > 0) && b.healT <= 0) { useItem(b); }
    if(b.reloadT <= 0){ const c = curW(b); if(c && c.mag < WD[c.type].mag * .5) startReload(b); }
    const z = S.zone, zc = z.mode === "wait" ? z.to : z;
    const outNow = Math.hypot(b.x - z.cx, b.z - z.cz) > z.r * .96, outNext = z.mode === "wait" && z.t < 16 && Math.hypot(b.x - z.to.cx, b.z - z.to.cz) > z.to.r * .9;
    if(outNow || outNext || z.mode === "shrink" && Math.hypot(b.x - z.to.cx, b.z - z.to.cz) > z.to.r * .9){ const a = R(0, TAU), d = R(0, zc.r * .5); b.goal = {x: zc.cx + Math.cos(a) * d, z: zc.cz + Math.sin(a) * d}; b.mode = "zone"; return; }
    if(b.mode === "zone" && b.goal && Math.hypot(b.goal.x - b.x, b.goal.z - b.z) > 2.5) return;
    if(!b.goal || (b.goal.pk && !b.goal.pk.alive) || Math.hypot(b.goal.x - b.x, b.goal.z - b.z) < 1.2 || b.wait > 8){ b.wait = 0; botGoalPick(b); }
}
function botUpdate(b, dt){
    if(!b.grounded){ b.land -= dt; if(b.land <= 0){ b.grounded = true; b.x = b.spot.x; b.z = b.spot.z; b.mesh.visible = true; b.shadow.visible = true; b.thinkT = R(0, .3); b.cool = R(10, 26); } return; }
    if(!b.alive) return;
    timers(b, dt); b.wait += dt;
    b.thinkT -= dt; if(b.thinkT <= 0){ b.thinkT = .25 + rnd() * .12; botThink(b); }
    const D = S.diff;
    let mx = 0, mz = 0, speed = D.spd * (b.healT > 0 ? .5 : 1);
    if(b.target && b.target.alive){
        const t = b.target, dx = t.x - b.x, dz = t.z - b.z, dist = Math.hypot(dx, dz), ang = Math.atan2(dx, dz), w = curW(b), pref = w ? WD[w.type].pref : 10;
        const dy = angDiff(ang, b.yaw); b.yaw += clamp(dy, -4 * dt * (.5 + b.sk), 4 * dt * (.5 + b.sk));
        b.strafeT -= dt; if(b.strafeT <= 0){ b.strafe = rnd() < .5 ? -1 : 1; b.strafeT = R(.8, 2); }
        b.fightT += dt;
        let f = 0; if(dist > pref * 1.2) f = b.aggr > .5 ? 1 : .35; else if(dist < pref * .55) f = -.8;
        const sx = Math.cos(ang), sz = -Math.sin(ang);
        mx = Math.sin(ang) * f + sx * b.strafe * .8; mz = Math.cos(ang) * f + sz * b.strafe * .8;
        b.seeT += dt;
        if(Math.abs(dy) < .16 && b.seeT > D.react * (1.1 - b.sk * .5) && b.lost < .5 && w){
            if(w.mag <= 0 && b.am[WD[w.type].am] <= 0){ const bs = bestSlot(b); if(bs !== b.cur) b.cur = bs; }
            if(tryFire(b, b.yaw + gauss() * 3 * (.025 + (1 - b.sk) * .06 + dist * .0011), D.dmg)) b.fireCd += (1 - b.sk) * .12;
        }
    }else if(b.goal && b.healT <= 0 || b.goal && b.mode === "zone"){
        const wp = botWaypoint(b, b.goal), dx = wp.x - b.x, dz = wp.z - b.z, d = Math.hypot(dx, dz) || 1;
        if(d > .4){ mx = dx / d; mz = dz / d; const ta = Math.atan2(dx, dz); b.yaw += clamp(angDiff(ta, b.yaw), -6 * dt, 6 * dt); }
        if(b.goal.pk && b.goal.pk.alive && Math.hypot(b.goal.x - b.x, b.goal.z - b.z) < 1.3 && wantPk(b, b.goal.pk)){ takePk(b, b.goal.pk); b.goal = null; }
    }
    const ml = Math.hypot(mx, mz); if(ml > 1){ mx /= ml; mz /= ml; }
    // ひっかかり対策
    b.stuckT += dt;
    if(b.stuckT > .8){ if(Math.hypot(b.x - b.lx, b.z - b.lz) < .5 && ml > .3){ b.strafe = rnd() < .5 ? -1 : 1; b.detour = .9; } b.lx = b.x; b.lz = b.z; b.stuckT = 0; }
    if(b.detour > 0){ b.detour -= dt; const c = Math.cos(1.2 * b.strafe), s = Math.sin(1.2 * b.strafe), nx = mx * c - mz * s, nz = mx * s + mz * c; mx = nx; mz = nz; }
    b.x += mx * speed * dt; b.z += mz * speed * dt; pushOut(b); b.walk += ml * dt * 9;
    // 近くの ひろいもの（ついでに）
    if(!b.target && b.thinkT > .3){ /* 間引き */ }
    for(const p of S.pk){ if(!p.alive) continue; if(Math.abs(p.x - b.x) < 1.2 && Math.abs(p.z - b.z) < 1.2 && wantPk(b, p)){ takePk(b, p); break; } }
}

// ---------- プレイヤー ----------
function playerUpdate(a, dt){
    if(!a.alive) return;
    if(S.phase === "plane"){
        const k = S.t; a.x = -104 + 22 * k; a.z = S.planeZ; a.y = 70; a.yaw = Math.PI / 2 + Inp.yaw * 0;
        if(Inp.jump || k >= PLANE_T){ Inp.jump = false; S.phase = "glide"; a.mesh.userData.chute.visible = true; toastBig("🪂 ジャンプ！ スティックで おりる場所を えらぼう"); }
        return;
    }
    const fw = {f: 0, s: 0};
    let mf = Inp.mf, ms = Inp.ms;
    if(keys.KeyW || keys.ArrowUp) mf += 1; if(keys.KeyS || keys.ArrowDown) mf -= 1; if(keys.KeyD || keys.ArrowRight) ms += 1; if(keys.KeyA || keys.ArrowLeft) ms -= 1;
    mf = clamp(mf, -1, 1); ms = clamp(ms, -1, 1); const ml = Math.hypot(mf, ms); if(ml > 1){ mf /= ml; ms /= ml; }
    a.yaw = Inp.yaw;
    const sinY = Math.sin(a.yaw), cosY = Math.cos(a.yaw);
    if(S.phase === "glide"){
        a.y -= GLIDE_V * dt * (mf > .5 ? 1.25 : 1); const sp = 12;
        a.x += (mf * sinY - ms * cosY) * sp * dt; a.z += (mf * cosY + ms * sinY) * sp * dt; a.x = clamp(a.x, -HALF + 1, HALF - 1); a.z = clamp(a.z, -HALF + 1, HALF - 1);
        if(a.y <= 0){ a.y = 0; S.phase = "play"; a.grounded = true; a.mesh.userData.chute.visible = false; pushOut(a); toastBig("着地！ ぶきを さがそう"); }
        return;
    }
    timers(a, dt);
    const sprint = (keys.ShiftLeft || keys.ShiftRight || Inp.sprint || ml > .94 && S.touch) && !S.crouch && a.healT <= 0;
    S.crouch = !!(keys.KeyC || keys.ControlLeft);
    let speed = (sprint ? 8.0 : 5.6) * (S.crouch ? .55 : 1) * (a.healT > 0 ? .55 : 1);
    a.x += (mf * sinY - ms * cosY) * speed * dt; a.z += (mf * cosY + ms * sinY) * speed * dt; pushOut(a); a.walk += ml * dt * 9;
    // こうげき
    if(Inp.slot >= 0){ if(a.slots[Inp.slot]){ a.cur = Inp.slot; a.reloadT = 0; a.healT = 0; a.healKind = null; beep(700, .05, "triangle", .22); } Inp.slot = -1; }
    if(Inp.rel){ Inp.rel = false; startReload(a); }
    if(Inp.use){ Inp.use = false; if(!useItem(a)) toast("いま つかえる かいふくは ありません"); }
    if(Inp.fire){
        let aim = a.yaw;
        if(S.assist){ // エイムアシスト：まえ方向の 近い 敵に すこし すいつく
            let bt = null, bd = 1e9; const w = curW(a), rng = w ? WD[w.type].range : 40;
            for(const v of S.actors){ if(v === a || !v.alive || !v.grounded) continue; const dx = v.x - a.x, dz = v.z - a.z, d = Math.hypot(dx, dz); if(d > rng) continue; const df = Math.abs(angDiff(Math.atan2(dx, dz), a.yaw)); if(df < .17 && d * df < bd && los(a.x, a.z, v.x, v.z)){ bd = d * df; bt = v; } }
            if(bt){ aim = a.yaw + angDiff(Math.atan2(bt.x - a.x, bt.z - a.z), a.yaw) * .75; }
        }
        tryFire(a, aim, 1);
    }
    // ひろいもの
    S.prompt = null;
    for(const p of S.pk){
        if(!p.alive) continue; const dx = p.x - a.x, dz = p.z - a.z; if(Math.abs(dx) > 1.6 || Math.abs(dz) > 1.6) continue;
        if(p.kind === "w"){
            const free = a.slots.some((w) => !w);
            if(free){ takePk(a, p); }
            else{ S.prompt = p; if(Inp.pick){ Inp.pick = false; takePk(a, p); } }
        }else if(wantPk(a, p) || p.kind === "a" && a.slots.some((w) => w && WD[w.type].am === p.key)){ takePk(a, p); }
    }
    Inp.pick = false;
}

// ---------- 1ステップ ----------
function step(dt){
    if(!S) return;
    S.t += dt;
    const P = S.player;
    zoneUpdate(dt);
    playerUpdate(P, dt);
    S.actors.forEach((a) => { if(!a.isPlayer && !S.over) botUpdate(a, dt); });
    // ストーム
    if(!S.over || S.over.win === false){
        S.actors.forEach((a) => { if(a.alive && a.grounded && !inZone(a.x, a.z)) damage(a, S.zone.dps * dt, null, "ストーム", true); });
    }
    if(S.hurtT > 0) S.hurtT -= dt; if(S.hitT > 0) S.hitT -= dt; if(S.hitDirT > 0) S.hitDirT -= dt; if(S.muzzleT > 0) S.muzzleT -= dt; if(S.killMsgT > 0) S.killMsgT -= dt;
    S.tr.forEach((l) => { if(l.visible){ l.userData.life -= dt; if(l.userData.life <= 0) l.visible = false; } });
    S.actors.forEach((a) => { if(!a.alive){ a.dead += dt; } });
    if(S.over && S.overT > 0){ S.overT -= dt; if(S.overT <= 0 && !S.resShown) showResult(); }
    S.pkT = (S.pkT || 0) - dt;
}

// ---------- 描画 ----------
const camV = new T.Vector3();
function render(dt){
    const P = S.player, a = P;
    // カメラ（かべの手前でとめる）
    const sy = Math.sin(a.yaw), cy = Math.cos(a.yaw);
    if(S.phase === "plane"){
        camera.position.set(a.x - 16, a.y + 7, a.z - 6); camera.lookAt(a.x + 6, a.y - 6, a.z);
    }else if(S.phase === "glide"){
        camera.position.set(a.x - sy * 7, a.y + 4.5, a.z - cy * 7); camera.lookAt(a.x + sy * 3, Math.max(0, a.y - 4), a.z + cy * 3);
    }else{
        let dist = S.crouch ? 3.6 : 4.8; const t = rayWall(a.x, a.z, -sy, -cy, dist + .5); if(t < dist + .5) dist = Math.max(1.2, t - .5);
        const h = 2.7 - (S.crouch ? .5 : 0) - (dist < 3 ? (3 - dist) * .12 : 0);
        camera.position.set(a.x - sy * dist, h, a.z - cy * dist); camera.lookAt(a.x + sy * 6, 1.3, a.z + cy * 6);
    }
    // アクター
    S.actors.forEach((v) => {
        if(!v.grounded && !v.isPlayer){ v.mesh.visible = false; v.shadow.visible = false; return; }
        v.mesh.visible = true;
        v.mesh.position.set(v.x, v.y, v.z); v.mesh.rotation.y = v.yaw;
        if(v.alive){ v.mesh.rotation.x = 0; v.mesh.position.y = v.y + (v.healT > 0 ? 0 : Math.abs(Math.sin(v.walk)) * .06); }
        else{ v.mesh.rotation.x = -Math.min(1.45, v.dead * 4); v.mesh.position.y = 0; if(v.dead > 4) v.mesh.visible = false; }
        const fl = v.flash > 0; v.mesh.userData.bodyM.emissive.setHex(fl ? 0xffffff : 0); v.mesh.userData.bodyM.emissiveIntensity = fl ? .8 : 0;
        v.shadow.visible = v.mesh.visible && v.alive; v.shadow.position.set(v.x, .05, v.z);
        const sc = v.y > 0 ? clamp(1 - v.y / 90, .3, 1) : 1; v.shadow.scale.setScalar(sc);
    });
    // ひろいもの（とおくは かくす・ふわふわ）
    if(S.pkT <= 0){ S.pkT = .3; S.pk.forEach((p) => { if(!p.alive) return; const vis = Math.abs(p.x - a.x) < 70 && Math.abs(p.z - a.z) < 70; p.sprite.visible = p.ring.visible = vis; if(p.beam) p.beam.visible = vis; }); }
    const tt = S.t * 2;
    S.pk.forEach((p) => { if(p.alive && p.sprite.visible) p.sprite.position.y = 1.15 + Math.sin(tt + p.t) * .12; });
    // ゾーン
    const z = S.zone; S.zoneMesh.scale.set(z.r, 1, z.r); S.zoneMesh.position.set(z.cx, 35, z.cz);
    S.ringMesh.visible = z.mode === "wait" && !!z.to; if(z.to){ S.ringMesh.scale.set(z.to.r, z.to.r, 1); S.ringMesh.position.set(z.to.cx, .15, z.to.cz); }
    renderer.render(scene, camera);
}
function resize(){
    if(!renderer) return; const c = renderer.domElement, w = c.clientWidth || window.innerWidth, h = c.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix();
}

// ---------- HUD ----------
let hudT = 0, toastT = 0, bigT = 0;
function toast(s){ const e = $("brToast"); if(!e) return; e.textContent = s; e.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove("on"), 1700); }
function toastBig(s){ const e = $("brBig"); if(!e) return; e.textContent = s; e.classList.add("on"); clearTimeout(bigT); bigT = setTimeout(() => e.classList.remove("on"), 2600); }
function feed(s, hot){ const box = $("brFeed"); if(!box) return; const d = document.createElement("div"); d.textContent = s; if(hot) d.className = "hot"; box.appendChild(d); while(box.children.length > 5) box.removeChild(box.firstChild); setTimeout(() => d.remove(), 6500); }
const proj = new T.Vector3();
function floatText(v, n){
    const box = $("brDmg"); if(!box) return; proj.set(v.x, 2.4, v.z).project(camera);
    if(proj.z > 1) return; const w = box.clientWidth, h = box.clientHeight, d = document.createElement("div"); d.textContent = n; d.style.left = ((proj.x * .5 + .5) * w) + "px"; d.style.top = ((-proj.y * .5 + .5) * h) + "px"; box.appendChild(d); setTimeout(() => d.remove(), 650);
}
function mmDraw(){
    const c = $("brMap"); if(!c) return; const x = c.getContext("2d"), W = c.width, P = S.player, sc = W / 150;
    x.clearRect(0, 0, W, W); x.save(); x.beginPath(); x.arc(W / 2, W / 2, W / 2 - 1, 0, TAU); x.clip();
    x.fillStyle = "rgba(20,40,30,.82)"; x.fillRect(0, 0, W, W);
    const tx = (wx) => W / 2 + (wx - P.x) * sc, tz = (wz) => W / 2 - (wz - P.z) * sc;
    // ストーム（外がわ）
    x.fillStyle = "rgba(255,60,60,.32)"; x.beginPath(); x.rect(0, 0, W, W); x.arc(tx(S.zone.cx), tz(S.zone.cz), S.zone.r * sc, 0, TAU, true); x.fill("evenodd");
    x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.beginPath(); x.arc(tx(S.zone.cx), tz(S.zone.cz), S.zone.r * sc, 0, TAU); x.stroke();
    if(S.zone.mode === "wait" && S.zone.to){ x.strokeStyle = "#7fe0ff"; x.setLineDash([4, 3]); x.beginPath(); x.arc(tx(S.zone.to.cx), tz(S.zone.to.cz), S.zone.to.r * sc, 0, TAU); x.stroke(); x.setLineDash([]); }
    x.fillStyle = "#8a8a98"; S.blds.forEach((b) => { x.fillRect(tx(b.x0), tz(b.z1), b.w * sc, b.d * sc); });
    x.fillStyle = "#ffd23a"; S.drops.forEach((d) => { x.beginPath(); x.arc(tx(d.x), tz(d.z), 3.5, 0, TAU); x.fill(); });
    S.actors.forEach((v) => { if(v === P || !v.alive || !v.grounded) return; if(Math.hypot(v.x - P.x, v.z - P.z) < 34){ x.fillStyle = "#ff4a4a"; x.beginPath(); x.arc(tx(v.x), tz(v.z), 3, 0, TAU); x.fill(); } });
    if(S.phase === "plane"){ x.strokeStyle = "#fff"; x.lineWidth = 2; x.beginPath(); x.moveTo(tx(-110), tz(S.planeZ)); x.lineTo(tx(110), tz(S.planeZ)); x.stroke(); }
    x.restore();
    // じぶん（むき つき）
    x.save(); x.translate(W / 2, W / 2); x.rotate(-P.yaw + Math.PI); x.fillStyle = "#6ab4ff"; x.strokeStyle = "#fff"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, 7); x.lineTo(-5, -5); x.lineTo(5, -5); x.closePath(); x.fill(); x.stroke(); x.restore();
}
function hud(){
    const P = S.player, w = curW(P), z = S.zone;
    $("brAliveN").textContent = S.aliveN; $("brKillN").textContent = P.kills;
    let zt = "";
    if(z.mode === "wait") zt = "🔵 つぎの安全地帯まで " + Math.ceil(z.t) + "秒"; else if(z.mode === "shrink") zt = "🔴 せまくなっている… " + Math.ceil(z.t) + "秒"; else zt = "🔴 さいごの安全地帯";
    $("brZoneT").textContent = S.phase === "plane" ? "✈ ジャンプまで " + Math.max(0, Math.ceil(PLANE_T - S.t)) + "秒（スペース／🪂 でとびおりる）" : S.phase === "glide" ? "🪂 こうか中" : zt;
    $("brZoneT").classList.toggle("bad", z.mode === "shrink" && S.phase === "play");
    $("brStorm").classList.toggle("on", P.alive && P.grounded && !inZone(P.x, P.z));
    $("brHp").firstElementChild.style.width = clamp(P.hp, 0, 100) + "%"; $("brHp").lastElementChild.textContent = Math.ceil(P.hp);
    $("brArmor").firstElementChild.style.width = clamp(P.armor, 0, 100) + "%";
    $("brSlots").innerHTML = P.slots.map((s, i) => '<button type="button" class="brSlot' + (i === P.cur ? " on" : "") + '" data-i="' + i + '" style="border-color:' + (s ? RAR[s.rar].css : "#fff3") + '"><span class="k">' + (i + 1) + '</span>' + (s ? WD[s.type].ic + '<b>' + s.mag + '</b>' : "－") + '</button>').join("");
    $("brAmmo").innerHTML = w ? '<span class="n" style="color:' + RAR[w.rar].css + '">' + WD[w.type].n + '</span><span class="a">' + (P.reloadT > 0 ? "リロード中…" : w.mag + ' <small>/ ' + P.am[WD[w.type].am] + '</small>') + '</span>' : '<span class="n">ぶきが ありません</span><span class="a">たてものの 中で さがそう</span>';
    $("brItems").innerHTML = '<span>🩹' + P.it.band + '</span><span>💊' + P.it.med + '</span><span>🛡️' + P.it.shS + '</span><span>🔰' + P.it.shL + '</span>' + (P.healT > 0 ? '<span class="use">つかい中…</span>' : "");
    const pr = S.prompt; $("brbPick").classList.toggle("on", !!pr); $("brPrompt").textContent = pr ? "［E］／⭐ " + WD[pr.key].n + "（" + RAR[pr.rar].n + "）と こうかん" : ""; $("brPrompt").classList.toggle("on", !!pr);
    $("brbJump").hidden = S.phase !== "plane";
    $("brCross").style.display = S.phase === "play" ? "" : "none";
    $("brDir").style.opacity = S.hitDirT > 0 ? Math.min(1, S.hitDirT) : 0; if(S.hitDirT > 0){ const rel = S.hitDir - P.yaw; $("brDir").style.transform = "rotate(" + (-rel * 180 / Math.PI + 180) + "deg)"; }
    $("brDmgF").classList.toggle("go", S.hurtT > 0);
    $("brHit").classList.toggle("go", S.hitT > 0);
    $("brKillMsg").textContent = S.killMsgT > 0 ? S.killMsg : "";
    mmDraw();
}

// ---------- ゲームの はじめ・おわり ----------
function showResult(){
    S.resShown = true; const o = S.over, P = S.player;
    const score = P.kills * 120 + (31 - o.place) * 15 + (o.win ? 600 : 0);
    $("brResT").textContent = o.win ? "🏆 ビクトリー・ロワイヤル！" : "💥 " + o.place + "位 でした";
    $("brResB").innerHTML = "生きのこり順位：<b>" + o.place + "位 / " + (S.diff.bots + 1) + "人</b><br>たおした数：<b>" + P.kills + "</b>　あたえたダメージ：<b>" + Math.round(P.dmgDealt) + "</b><br>生きた時間：<b>" + Math.floor(S.t) + "秒</b>　スコア：<b>" + score + "</b>";
    $("brRes").hidden = false; stopBgm();
    try{
        const rec = JSON.parse(localStorage.getItem("g9_mission_rec") || "{\"runs\":0,\"clears\":0,\"bestScore\":0}");
        rec.brRuns = (rec.brRuns || 0) + 1; if(o.win) rec.brWins = (rec.brWins || 0) + 1; rec.brBestKills = Math.max(rec.brBestKills || 0, P.kills); rec.brBestPlace = Math.min(rec.brBestPlace || 99, o.place);
        rec.runs = (rec.runs || 0) + 1; rec.bestScore = Math.max(rec.bestScore || 0, score);
        localStorage.setItem("g9_mission_rec", JSON.stringify(rec));
        if(window.AREFeaturePanel) window.AREFeaturePanel.recordRun("game9", score);
    }catch(_e){}
    try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(_e){}
}
function playBgm(){ stopBgm(); try{ const n = 1 + Math.floor(rnd() * 13); bgmEl = new Audio("bgm/" + (n < 10 ? "0" : "") + n + "-" + ["hall-of-mountain-king", "toreador", "bolero", "gymnopedie", "winter", "nutcracker", "fate", "eine-kleine-nachtmusik", "dance-of-the-sugar-plum-fairy", "can-can", "william-tell", "sabre-dance", "pomp-and-circumstance"][n - 1] + ".mp3"); bgmEl.loop = true; bgmEl.volume = (opts.settings.bgm || .6) * .7; bgmEl.play().catch(() => {}); }catch(_e){} }
function stopBgm(){ if(bgmEl){ try{ bgmEl.pause(); }catch(_e){} bgmEl = null; } }
function disposeScene(){
    if(!scene) return;
    scene.traverse((o) => { if(o.geometry && !SHARED.has(o.geometry)) o.geometry.dispose(); const m = o.material; if(m && !SHARED.has(m) && !Array.isArray(m)){ if(m.map && !TEX.has(m.map)) {} m.dispose(); } });
}

export function startBR(o){
    opts = o; stopLoop();
    if(!renderer){
        renderer = new T.WebGLRenderer({canvas: $("cvb"), antialias: false, alpha: false}); renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
        camera = new T.PerspectiveCamera(68, 1, .1, 170); initInput();
    }
    disposeScene(); scene = new T.Scene();
    const diff = DIFF[o.difficulty] || DIFF.normal;
    const w = buildWorld();
    S = {log: [], t: 0, phase: "plane", planeZ: R(-40, 40), col: w.col, blds: w.blds, pk: [], pkId: 0, actors: [], aliveN: diff.bots + 1, diff, over: null, overT: 0, resShown: false, tr: [], trI: 0, drops: [], hurtT: 0, hitT: 0, hitDirT: 0, muzzleT: 0, killMsgT: 0, killMsg: "", lastHurtSnd: 0, crouch: false, prompt: null, pkT: 0,
        assist: o.assist !== false, touch: window.matchMedia && matchMedia("(pointer:coarse)").matches, zone: {cx: 0, cz: 0, r: 128, ph: -1, mode: "wait", t: 0, dps: .5, from: null, to: null}};
    // ゾーン表示
    S.zoneMesh = new T.Mesh(new T.CylinderGeometry(1, 1, 70, 64, 1, true), new T.MeshBasicMaterial({color: 0xff3a3a, transparent: true, opacity: .2, side: T.DoubleSide, depthWrite: false})); scene.add(S.zoneMesh);
    S.ringMesh = new T.Mesh(new T.RingGeometry(.99, 1, 72), new T.MeshBasicMaterial({color: 0xffffff, side: T.DoubleSide, transparent: true, opacity: .85})); S.ringMesh.rotation.x = -Math.PI / 2; scene.add(S.ringMesh);
    // トレーサー
    for(let i = 0; i < 40; i++){ const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(new Float32Array(6), 3)); const l = new T.Line(g, MAT.tracer); l.visible = false; l.frustumCulled = false; l.userData.life = 0; scene.add(l); S.tr.push(l); }
    // アクター
    const P = mkActor(0, true, "あなた"); P.grounded = false; P.y = 70; S.player = P; S.actors.push(P);
    const names = NAMES.slice().sort(() => rnd() - .5);
    for(let i = 0; i < diff.bots; i++){
        const b = mkActor(i + 1, false, names[i % names.length]); b.sk = R(diff.sk[0], diff.sk[1]); b.aggr = R(.15, .9);
        const bd = rnd() < .75 ? pick(S.blds) : null; b.spot = bd ? {x: bd.cx + R(-bd.w / 2 - 6, bd.w / 2 + 6), z: bd.cz + R(-bd.d / 2 - 6, bd.d / 2 + 6)} : {x: R(-100, 100), z: R(-100, 100)};
        b.spot.x = clamp(b.spot.x, -HALF + 3, HALF - 3); b.spot.z = clamp(b.spot.z, -HALF + 3, HALF - 3); b.land = 4 + rnd() * 8; b.mesh.userData.chute.visible = false;
        S.actors.push(b);
    }
    // ぶきの ない 位置に だけ ひろいもの：たてもの4こ ずつ ＋ そと
    S.blds.forEach((b) => { for(let i = 0; i < 4; i++){ const it = rollItem(); addPk(it[0], it[1], it[2], b.x0 + 1.6 + rnd() * (b.w - 3.2), b.z0 + 1.6 + rnd() * (b.d - 3.2)); } });
    for(let i = 0; i < 46; i++){ const x = R(-HALF + 4, HALF - 4), z = R(-HALF + 4, HALF - 4); if(bldAt(x, z, 1.5)) continue; const it = rollItem(); addPk(it[0], it[1], it[2], x, z); }
    // 弾が当たる場所に ひろいものが ないように（はこの上など）は気にしない
    zoneNext(); S.zone.r = 128; S.zone.dps = .5;
    Inp.yaw = Math.PI / 2; Inp.mf = Inp.ms = 0; Inp.fire = false; Inp.jump = false; Inp.slot = -1; Inp.rel = Inp.use = Inp.pick = false;
    P.x = -104; P.z = S.planeZ; P.mesh.visible = true; P.mesh.userData.chute.visible = false;
    $("brRes").hidden = true; $("brFeed").innerHTML = ""; $("brDmg").innerHTML = ""; $("brToast").classList.remove("on");
    active = true; resize(); lastT = performance.now(); raf = requestAnimationFrame(loop); playBgm();
    toastBig("✈ バトルロワイヤル 開始！ 好きな場所で 🪂 とびおりよう");
    window.__br = {get S(){ return S; }, step, hud, WD, giveWeapon, damage, startReload, tryFire, Inp, keys, pushOut, los};
}
function stopLoop(){ active = false; if(raf) cancelAnimationFrame(raf); raf = 0; }
export function stopBR(){ stopLoop(); stopBgm(); try{ if(document.exitPointerLock) document.exitPointerLock(); }catch(_e){} Inp.fire = false; }
export function isBRActive(){ return active; }

function loop(t){
    if(!active) return;
    raf = requestAnimationFrame(loop);
    let dt = (t - lastT) / 1000; lastT = t; if(dt > .05) dt = .05; if(dt < 0) dt = 0;
    step(dt); render(dt);
    hudT -= dt; if(hudT <= 0){ hudT = .08; hud(); }
}

// ---------- 入力 ----------
let inputReady = false;
function initInput(){
    if(inputReady) return; inputReady = true;
    window.addEventListener("keydown", (e) => {
        if(!active) return; keys[e.code] = true;
        if(e.code === "KeyR") Inp.rel = true; if(e.code === "KeyE") Inp.pick = true; if(e.code === "KeyF" || e.code === "KeyH") Inp.use = true;
        if(e.code === "Space"){ e.preventDefault(); Inp.jump = true; }
        if(e.code === "Digit1") Inp.slot = 0; if(e.code === "Digit2") Inp.slot = 1; if(e.code === "Digit3") Inp.slot = 2;
        if(e.code === "KeyQ" || e.code === "Tab"){ e.preventDefault(); if(S){ for(let k = 1; k <= 3; k++){ const i = (S.player.cur + k) % 3; if(S.player.slots[i]){ Inp.slot = i; break; } } } }
    });
    window.addEventListener("keyup", (e) => { keys[e.code] = false; });
    const cv = $("cvb");
    cv.addEventListener("pointerdown", (e) => { if(e.pointerType !== "mouse" || !active) return; try{ if(document.pointerLockElement !== cv) cv.requestPointerLock && cv.requestPointerLock(); }catch(_e){} Inp.fire = true; cv.dataset.md = "1"; });
    window.addEventListener("pointerup", (e) => { if(e.pointerType === "mouse"){ Inp.fire = false; cv.dataset.md = ""; } });
    window.addEventListener("mousemove", (e) => { if(!active) return; if(document.pointerLockElement !== cv && !cv.dataset.md) return; Inp.yaw -= (e.movementX || 0) * .0026 * ((opts && opts.settings.sens) || 1.1); });
    window.addEventListener("resize", resize);
    window.addEventListener("contextmenu", (e) => { if(active) e.preventDefault(); });
    // タッチ
    const mz = $("brMove"), lz = $("brLook"), st = $("brStick"); let mid = null, mo = {x: 0, y: 0}, lid = null, ll = {x: 0, y: 0};
    mz.addEventListener("pointerdown", (e) => { if(e.pointerType === "mouse") return; mid = e.pointerId; mo = {x: e.clientX, y: e.clientY}; st.style.display = "block"; st.style.left = (e.clientX - 43) + "px"; st.style.top = (e.clientY - 43) + "px"; });
    lz.addEventListener("pointerdown", (e) => { if(e.pointerType === "mouse") return; lid = e.pointerId; ll = {x: e.clientX, y: e.clientY}; });
    window.addEventListener("pointermove", (e) => {
        if(e.pointerId === mid){ const dx = clamp(e.clientX - mo.x, -46, 46), dy = clamp(e.clientY - mo.y, -46, 46); Inp.ms = dx / 46; Inp.mf = -dy / 46; st.style.left = (mo.x - 43 + dx) + "px"; st.style.top = (mo.y - 43 + dy) + "px"; }
        if(e.pointerId === lid){ Inp.yaw -= (e.clientX - ll.x) * .0048 * ((opts && opts.settings.sens) || 1.1); ll = {x: e.clientX, y: e.clientY}; }
    });
    const end = (e) => { if(e.pointerId === mid){ mid = null; Inp.mf = Inp.ms = 0; st.style.display = "none"; } if(e.pointerId === lid) lid = null; };
    window.addEventListener("pointerup", end); window.addEventListener("pointercancel", end);
    const hold = (id, on, off) => { const el = $(id); el.addEventListener("pointerdown", (e) => { e.preventDefault(); on(); el.classList.add("on"); }); const f = () => { off && off(); el.classList.remove("on"); }; el.addEventListener("pointerup", f); el.addEventListener("pointerleave", f); el.addEventListener("pointercancel", f); };
    hold("brbFire", () => { Inp.fire = true; }, () => { Inp.fire = false; });
    hold("brbRel", () => { Inp.rel = true; }); hold("brbUse", () => { Inp.use = true; }); hold("brbPick", () => { Inp.pick = true; }); hold("brbJump", () => { Inp.jump = true; });
    $("brSlots").addEventListener("pointerdown", (e) => { const b = e.target.closest("[data-i]"); if(b){ e.preventDefault(); Inp.slot = Number(b.dataset.i); } });
}
