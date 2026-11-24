// ===== スターライト・リズムステージ（音ゲー）=====
//  4つの レーンを ながれる ノーツを、リズムに あわせて たたく。 キー D F J K ／ スマホは がめんの レーンを タップ。
//  きょく・ふみ面は df-x-song.js（ぜんぶ オリジナル）。 60% 以上の せいどで スタンプ。
import {TAU, clamp, lerp, ease, root, clearRoot, el, bodyOn} from "./df-xlib.js";
import {SONG, chart, stepDur, songLen} from "./df-x-song.js";

const CX = 1300, CZ = 1300;
const COL = ["#ff6aa8", "#ffd54a", "#6ae8ff", "#a98aff"], KEYS = ["D", "F", "J", "K"], CODES = ["KeyD", "KeyF", "KeyJ", "KeyK"];
const T0 = .3, APPROACH = 1.8, W_PERFECT = .07, W_GREAT = .12, W_GOOD = .18;
const beatPhase = (R) => Math.max(0, R.t - T0) / (60 / SONG.bpm);

export const rhythm = {
    build(K){
        const {box, cyl, sph, pln} = K.h, L = K.mk("rhythm", {tex: "tile", glowTint: [.7, .7, .7, .7]}), S = L.solid, G = L.ground, GL = L.glow;
        pln(G, CX, 0, CZ, 420, 420, "#1c1440", 56, 56);
        // ステージ（ひな壇）
        box(S, CX, 0, CZ + 10, 50, 1.4, 22, "#2a2150"); box(S, CX, 1.4, CZ + 10, 47, .3, 19, "#3b2e70");
        box(GL, CX, 1.72, CZ + .2, 47, .16, .5, "#ff6aa8"); box(GL, CX, .2, CZ - .6, 50, .2, .3, "#6ae8ff");
        // LED かべ（4まい。レーンと おなじ 色）
        for(let i = 0; i < 4; i++){ box(S, CX - 18 + i * 12, 1.7, CZ + 20, 11, 17, .7, "#120d2c"); box(GL, CX - 18 + i * 12, 2.6, CZ + 19.5, 9.6, 14.6, .2, COL[i]); }
        // トラス（天井の わく）とライト
        box(S, CX, 20.5, CZ + 8, 50, .8, .8, "#8a86a8"); box(S, CX, 20.5, CZ + 1, 50, .8, .8, "#8a86a8");
        for(const sx of [-25, 25]) cyl(S, CX + sx, 0, CZ + 4, .5, .6, 20.5, "#8a86a8", 8);
        for(let i = 0; i < 13; i++){ sph(GL, CX - 24 + i * 4, 19.6, CZ + 1, .55, COL[i % 4], 1, 6); sph(GL, CX - 24 + i * 4, 19.6, CZ + 8, .55, COL[(i + 2) % 4], 1, 6); }
        // スピーカー（左右）
        for(const sx of [-31, 31]){ box(S, CX + sx, 0, CZ + 12, 4.4, 10, 4, "#1a1a2c"); for(let k = 0; k < 3; k++){ sph(S, CX + sx + (sx < 0 ? 2.2 : -2.2), 1.8 + k * 2.8, CZ + 10, .85, "#3a3a58", .35, 8); } }
        // ゆかの ネオンの せん
        for(let i = -8; i <= 8; i++){ box(GL, CX + i * 6, .03, CZ - 14, .12, .02, 28, i % 2 ? "#3a2a8a" : "#5a3aa8"); }
        for(let k = 0; k < 6; k++) box(GL, CX, .03, CZ - 26 + k * 5, 100, .02, .12, "#3a2a8a");
        // 夜空の ほし
        for(let i = 0; i < 90; i++){ const a = i * 2.399, r = 70 + (i * 37 % 60); sph(GL, CX + Math.cos(a) * r, 24 + (i * 29 % 40), CZ + 30 + Math.abs(Math.sin(a)) * r * .8, .45, ["#ffffff", "#ffe6a0", "#bfe4ff"][i % 3], 1, 4); }
        // 大きな 月（ステージの うしろ）
        sph(GL, CX, 30, CZ + 80, 9, "#fff2c8", 1, 12);
    },
    init(g, R, a){
        const notes = chart().map((n) => Object.assign({done: 0}, n));
        Object.assign(R, {notes, nextIdx: 0, score: 0, combo: 0, maxCombo: 0, cnt: {p: 0, g: 0, o: 0, m: 0}, pop: null, press: [0, 0, 0, 0], taps: [], total: notes.length, fx: [], fin: 0, win: false});
        ensureOverlay(g, R);
    },
    update(g, R, dt, inp){
        const now = R.t - T0, P = (inp && inp.P) || {};
        for(let i = 0; i < 4; i++) if(P[CODES[i]]) R.taps.push(i);
        if(R.auto){   // おまかせ：ぴったり たたく
            for(let i = R.nextIdx; i < R.notes.length; i++){ const n = R.notes[i]; if(n.t - now > .03) break; if(!n.done) R.taps.push(n.lane); }
        }
        for(const lane of R.taps) judge(g, R, lane, now); R.taps.length = 0;
        // 見のがした ノーツ
        for(let i = R.nextIdx; i < R.notes.length; i++){ const n = R.notes[i]; if(n.done) { if(i === R.nextIdx) R.nextIdx++; continue; } if(now - n.t > W_GOOD){ n.done = 2; R.cnt.m++; R.combo = 0; popup(R, "MISS", "#9aa0c0"); if(i === R.nextIdx) R.nextIdx++; } else break; }
        for(let i = 0; i < 4; i++) R.press[i] = Math.max(0, R.press[i] - dt);
        R.fx = R.fx.filter((f) => (f.t += dt) < .6);
        draw(R);
        const end = songLen() + 1.8;
        if(now > end && !R.fin){
            R.fin = 1; const acc = accuracy(R); R.win = acc >= .6; g.sv.best_rhythm = Math.max(g.sv.best_rhythm || 0, Math.round(acc * 100));
            const rank = acc >= .95 ? "S" : acc >= .85 ? "A" : acc >= .7 ? "B" : acc >= .6 ? "C" : "D";
            g.ui.toast("ランク " + rank + "！ せいど " + Math.round(acc * 100) + "%  （パーフェクト " + R.cnt.p + "／ さいだいコンボ " + R.maxCombo + "）" + (R.win ? "" : "  あと " + Math.ceil(60 - acc * 100) + "% で スタンプ！"), 5200);
            if(acc >= .95){ g.sv.coins += 30; g.ui.toast("Sランク ボーナス +30コイン", 3000); }
            g.sfx(R.win ? "gold" : "ng");
        }
        if(R.fin && now > end + 2.2) g.endRide(R.win, true);
    },
    camera(g, R){
        const b = beatPhase(R), bob = Math.sin(b * Math.PI) * .06;
        return {eye: [CX + Math.sin(R.t * .3) * 1.2, 4.6 + bob, CZ - 27], yaw: Math.sin(R.t * .3) * .02, pitch: -.04, fov: 60};
    },
    dyn(g, R, D){
        const b = beatPhase(R), pulse = Math.pow(1 - (b % 1), 2.2);
        // ステージの ダンサーと かんきゃく（ほしのこ）
        for(let i = 0; i < 5; i++) D.push({m: "starkid", x: CX - 16 + i * 8, y: 1.7 + Math.abs(Math.sin((b + i * .25) * Math.PI)) * .9, z: CZ + 9, yaw: Math.PI + Math.sin(b + i) * .35, sx: 2.1, sy: 2.1, sz: 2.1});
        for(let i = 0; i < 16; i++){ const q = i % 8, r = (i / 8) | 0; D.push({m: "starkid", x: CX - 22 + q * 6.2 + r * 3, y: Math.abs(Math.sin((b * 2 + i * .37) * Math.PI)) * .55, z: CZ - 9 + r * 5, yaw: Math.sin(i + b) * .3}); }
        // ビーム と きらめき
        for(let i = 0; i < 8; i++) D.push({s: "glow", x: CX - 24.5 + i * 7, y: 12, z: CZ + 12, w: 2.6, h: 30, c: hexRgb(COL[i % 4]), a: .16 + .22 * pulse * (1 + (i % 2) * .4)});
        for(let i = 0; i < 24; i++){ const a = i * 2.4 + R.t * .5; D.push({s: "star", x: CX + Math.cos(a) * 26, y: 8 + (i * 7 % 14) + Math.sin(R.t * 2 + i) * .6, z: CZ + 6 + Math.sin(a) * 6, w: .7 + .5 * pulse, h: .7 + .5 * pulse, c: hexRgb(COL[i % 4]), a: .9}); }
        for(const f of R.fx){ const k = f.t / .6; for(let j = 0; j < 6; j++){ const a = j / 6 * TAU + f.t * 4; D.push({s: "star", x: CX - 12 + f.lane * 8 + Math.cos(a) * k * 4, y: 6 + Math.sin(a) * k * 4 + k * 3, z: CZ + 17, w: 1.1 * (1 - k), h: 1.1 * (1 - k), c: hexRgb(COL[f.lane]), a: 1 - k}); } }
    },
    hud(R){ return "スコア " + R.score + "　コンボ " + R.combo + "　せいど " + Math.round(accuracy(R) * 100) + "%"; },
    end(g, R){ if(R.off) R.off(); clearRoot(); bodyOn("rhythm", false); }
};

function hexRgb(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
function accuracy(R){ const done = R.cnt.p + R.cnt.g + R.cnt.o + R.cnt.m; if(!R.total) return 0; return (R.cnt.p + R.cnt.g * .7 + R.cnt.o * .4) / R.total; }
function popup(R, text, color){ R.pop = {text, color, t: 0}; }
function judge(g, R, lane, now){
    R.press[lane] = .16;
    let best = -1, bd = 1e9;
    for(let i = R.nextIdx; i < R.notes.length; i++){ const n = R.notes[i]; if(n.t - now > W_GOOD) break; if(n.done || n.lane !== lane) continue; const d = Math.abs(n.t - now); if(d < bd){ bd = d; best = i; } }
    if(best < 0 || bd > W_GOOD) return;
    const n = R.notes[best]; n.done = 1; R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo);
    const mul = 1 + Math.min(R.combo, 40) * .02;
    if(bd <= W_PERFECT){ R.cnt.p++; R.score += Math.round(100 * mul); popup(R, "PERFECT!", "#fff27a"); }
    else if(bd <= W_GREAT){ R.cnt.g++; R.score += Math.round(70 * mul); popup(R, "GREAT", "#7affd8"); }
    else { R.cnt.o++; R.score += Math.round(40 * mul); popup(R, "GOOD", "#9ac8ff"); }
    R.fx.push({lane, t: 0}); g.sfx(bd <= W_GREAT ? "hit" : "clue");
}
function ensureOverlay(g, R){
    bodyOn("rhythm", true); const r = root(); clearRoot();
    const cv = el("canvas", "", "", "position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:auto;touch-action:none;-webkit-user-select:none;user-select:none"); r.appendChild(cv);
    R.cv = cv; R.ctx = cv.getContext("2d");
    const down = (e) => {
        e.preventDefault(); const W = innerWidth, H = innerHeight, wBot = Math.min(W * .94, H * .95, 760), x0 = W / 2 - wBot / 2;
        R.taps.push(clamp(Math.floor((e.clientX - x0) / (wBot / 4)), 0, 3));
    };
    cv.addEventListener("pointerdown", down); R.off = () => cv.removeEventListener("pointerdown", down);
}
function draw(R){
    const cv = R.cv, W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if(cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)){ cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const c = R.ctx; c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const now = R.t - T0, topY = H * .17, hitY = H * .76, wBot = Math.min(W * .94, H * .95, 760), wTop = wBot * .34, cx = W / 2, padH = wBot / 4 * .5;
    const wAt = (y) => lerp(wTop, wBot, (y - topY) / (hitY - topY)) / 4, xAt = (i, y) => cx + (i - 1.5) * wAt(y);
    const yOf = (p) => topY + (hitY - topY) * Math.pow(Math.max(p, 0), 1.35);
    // ハイウェイ
    const yEnd = hitY + padH * 1.35; const grd = c.createLinearGradient(0, topY, 0, yEnd); grd.addColorStop(0, "rgba(20,12,50,0)"); grd.addColorStop(.35, "rgba(20,12,56,.62)"); grd.addColorStop(1, "rgba(24,14,64,.82)");
    c.fillStyle = grd; c.beginPath(); c.moveTo(cx - wTop / 2, topY); c.lineTo(cx + wTop / 2, topY); c.lineTo(cx + wAt(yEnd) * 2, yEnd); c.lineTo(cx - wAt(yEnd) * 2, yEnd); c.closePath(); c.fill();
    for(let i = 0; i <= 4; i++){ c.strokeStyle = i === 0 || i === 4 ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.28)"; c.lineWidth = i === 0 || i === 4 ? 3 : 1.5; c.beginPath(); c.moveTo(cx + (i - 2) * wTop / 4, topY); c.lineTo(cx + (i - 2) * wAt(yEnd) * 1, yEnd); c.stroke(); }
    // ビートの せん
    const b = beatPhase(R); for(let k = 0; k < 6; k++){ const bt = Math.floor(b) + k, p = 1 - ((bt - b) * 60 / SONG.bpm) / APPROACH; if(p < 0 || p > 1.05) continue; const y = yOf(p), w = wAt(y) * 4; c.strokeStyle = "rgba(255,255,255," + (.1 + .12 * p) + ")"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - w / 2, y); c.lineTo(cx + w / 2, y); c.stroke(); }
    // ヒットライン と レーンの ひかり
    for(let i = 0; i < 4; i++){ const w = wAt(hitY), x = xAt(i, hitY), pr = R.press[i] > 0;
        if(pr){ const g2 = c.createLinearGradient(0, hitY - H * .3, 0, hitY); g2.addColorStop(0, "rgba(255,255,255,0)"); g2.addColorStop(1, COL[i] + "aa"); c.fillStyle = g2; c.fillRect(x - w / 2, hitY - H * .3, w, H * .3); }
        c.fillStyle = pr ? COL[i] : "rgba(20,16,50,.88)"; c.strokeStyle = COL[i]; c.lineWidth = 3; rr(c, x - w * .46, hitY + 4, w * .92, padH, 14); c.fill(); c.stroke();
        c.fillStyle = pr ? "#201040" : "#fff"; c.font = "900 " + Math.round(padH * .55) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(KEYS[i], x, hitY + 4 + padH / 2); }
    c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - wBot / 2, hitY); c.lineTo(cx + wBot / 2, hitY); c.stroke();
    // ノーツ
    for(let i = R.nextIdx; i < R.notes.length; i++){ const n = R.notes[i]; const p = 1 - (n.t - now) / APPROACH; if(p < 0) break; if(n.done === 1) continue; const y = yOf(p); if(y > H) continue; const w = wAt(y), x = xAt(n.lane, y), h = w * .34;
        c.globalAlpha = n.done === 2 ? .35 : 1; c.shadowColor = COL[n.lane]; c.shadowBlur = 14; c.fillStyle = COL[n.lane]; rr(c, x - w * .42, y - h / 2, w * .84, h, h * .4); c.fill(); c.shadowBlur = 0; c.fillStyle = "rgba(255,255,255,.55)"; rr(c, x - w * .36, y - h * .38, w * .72, h * .28, h * .14); c.fill(); c.globalAlpha = 1; }
    // はんてい・コンボ
    if(R.pop){ R.pop.t += 1 / 60; const k = R.pop.t; if(k > .7) R.pop = null; else { c.globalAlpha = 1 - k / .7; c.fillStyle = R.pop.color; c.font = "900 " + Math.round(Math.min(W, H) * .06) + "px sans-serif"; c.textAlign = "center"; c.strokeStyle = "rgba(0,0,0,.7)"; c.lineWidth = 5; c.strokeText(R.pop.text, cx, hitY - H * .16 - k * 12); c.fillText(R.pop.text, cx, hitY - H * .16 - k * 12); c.globalAlpha = 1; } }
    if(R.combo >= 2){ c.fillStyle = "#fff"; c.font = "900 " + Math.round(Math.min(W, H) * .075) + "px sans-serif"; c.textAlign = "center"; c.strokeStyle = "rgba(0,0,0,.65)"; c.lineWidth = 5; const t = R.combo + " COMBO"; c.strokeText(t, cx, topY + H * .09); c.fillText(t, cx, topY + H * .09); }
    // しんこう と さいしょの ひとこと
    c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(W * .06, H * .05, W * .88, 6); c.fillStyle = "#ffd54a"; c.fillRect(W * .06, H * .05, W * .88 * clamp(now / songLen(), 0, 1), 6);
    if(R.t < 2.4){ c.fillStyle = "#fff"; c.font = "900 " + Math.round(Math.min(W, H) * .07) + "px sans-serif"; c.textAlign = "center"; c.strokeStyle = "rgba(0,0,0,.7)"; c.lineWidth = 6; const t = R.auto ? "おまかせ プレイ" : "D F J K で たたこう！"; c.strokeText(t, cx, H * .45); c.fillText(t, cx, H * .45); }
}
function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
