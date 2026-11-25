"use strict";
/* 人気者になろう：ミニゲーム 12種（ロジック＋描画）。ロジックは 画面なしで うごく（Node でも テストできる）。
   座標は 0〜1 に そろえる。g.W / g.H（ピクセル）は 画面側が 毎フレーム 入れる。虫は 出さない。 */
(function(root){
    var ST = root.ST = root.ST || {};
    var M = ST.MG = {};
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
    var NOP = function(){};

    ST.newGame = function(type, o){
        var m = M[type]; if(!m) throw new Error("no minigame " + type);
        var g = {type: type, m: m, d: o.d == null ? .5 : o.d, as: o.as == null ? 0 : o.as, rng: ST.rng(o.seed || 1), t: 0, state: "ready", ready: o.noReady ? 0 : 1.3, done: false, pct: 0, short: !!o.short, cfg: o.cfg || {}, W: 800, H: 450, asp: 16 / 9,
            combo: 0, maxCombo: 0, pops: [], held: {}, hk: {sfx: NOP, burst: NOP, shake: NOP, vib: NOP}, coinsDelta: 0, info: {}, endT: 0, em: o.em || ""};
        m.init(g);
        return g;
    };
    ST.stepGame = function(g, dt){
        g.asp = g.W / g.H;
        for(var i = g.pops.length - 1; i >= 0; i--){ g.pops[i].t += dt; if(g.pops[i].t > g.pops[i].life) g.pops.splice(i, 1); }
        if(g.state === "ready"){ g.ready -= dt; if(g.ready <= 0) g.state = "play"; return; }
        if(g.state === "play"){ g.t += dt; g.m.update(g, dt); if(g.done){ g.state = "end"; g.endT = 0; g.pct = clamp(Math.round(g.pct), 0, 100); } }
        else g.endT += dt;
    };
    ST.gameAct = function(g, a, down){ g.held[a] = down; if(g.state === "play" && g.m.act) g.m.act(g, a, down); };
    ST.gamePtr = function(g, x, y, kind){ if(g.state === "play" && g.m.ptr) g.m.ptr(g, x, y, kind); else if(kind === "up") g.ptrY = null; };
    function pop(g, txt, x, y, col, size){ g.pops.push({txt: txt, x: x, y: y, col: col || "#fff", t: 0, life: .8, size: size || 26}); }
    function burst(g, x, y, col, n){ g.hk.burst(x * g.W, y * g.H, col, n || 10); }
    function finish(g, pct){ g.pct = pct; g.done = true; }
    function grade(g, dt0, pw, gw, x, y){   // 時間ずれ → perfect/good/miss
        var a = Math.abs(dt0); return a <= pw ? "perfect" : a <= gw ? "good" : null;
    }
    var TXC = {perfect: "#ffe14a", great: "#6ff0ff", good: "#8dff9a", miss: "#ff6b8a"};

    // ---- 描画ヘルパー ----
    var FONT = "'Hiragino Maru Gothic ProN','Yu Gothic','Noto Sans JP','Noto Sans SC','Noto Sans KR',system-ui,sans-serif";
    function tx(c, s, x, y, size, col, align, glow){
        c.font = "900 " + size + "px " + FONT; c.textAlign = align || "center"; c.textBaseline = "middle";
        if(glow){ c.shadowColor = glow; c.shadowBlur = size * .6; }
        c.fillStyle = col || "#fff"; c.fillText(s, x, y); c.shadowBlur = 0;
    }
    function rr(c, x, y, w, h, r){ r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function hudBar(c, g, W, H, frac, label){
        var bw = Math.min(W * .6, 420), x = (W - bw) / 2, y = 14;
        c.fillStyle = "rgba(10,8,40,.55)"; rr(c, x, y, bw, 12, 6); c.fill();
        var gr = c.createLinearGradient(x, 0, x + bw, 0); gr.addColorStop(0, "#37e0ff"); gr.addColorStop(1, "#ff5fd0");
        c.fillStyle = gr; rr(c, x, y, Math.max(8, bw * clamp(frac, 0, 1)), 12, 6); c.fill();
        if(label) tx(c, label, W / 2, y + 30, 16, "#fff", "center", "#000");
        if(g.combo >= 3) tx(c, ST.tx("combo", {n: g.combo}), W / 2, y + 56, 20 + Math.min(10, g.combo / 3), "#ffe14a", "center", "#ff8a00");
    }
    function drawPops(c, g){
        for(var i = 0; i < g.pops.length; i++){
            var p = g.pops[i], k = p.t / p.life, a = 1 - k * k;
            c.globalAlpha = clamp(a, 0, 1); tx(c, p.txt, p.x * g.W, p.y * g.H - k * 36, p.size * (1 + (1 - k) * .25), p.col, "center", p.col); c.globalAlpha = 1;
        }
    }
    ST.drawGame = function(g, c, W, H, T){
        g.W = W; g.H = H; g.asp = W / H;
        g.m.draw(g, c, W, H, T || 0);
        drawPops(c, g);
        if(g.state === "ready"){
            var k = g.ready, sc = 1 + (k % 1) * .4, txt = k > .45 ? ST.tx("ready") : ST.tx("go");
            c.globalAlpha = .55; c.fillStyle = "#06031f"; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
            tx(c, g.cfg.name || "", W / 2, H * .22, Math.min(30, W / 16), "#fff", "center", "#37e0ff");
            tx(c, txt, W / 2, H * .45, Math.min(110, W / 6) * sc, "#ffe14a", "center", "#ff3ea5");
            tx(c, ST.tx(g.m.hint), W / 2, H * .66, Math.min(20, W / 26), "#d6dcff", "center", "#000");
        }
    };

    // ======================= rhythm（ダンス） =======================
    var LANECOL = ["#ff5fa8", "#37e0ff", "#9dff6a", "#ffd24a"];
    function laneGeo(g){ var lw = Math.min(.2, .24 * g.H / g.W); return {lw: lw, x0: .5 - 2 * lw}; }
    function hitLane(g, lane){
        var best = null, bd = 9, gw = g.gw;
        for(var i = 0; i < g.notes.length; i++){ var n = g.notes[i]; if(n.res || n.lane !== lane) continue; var df = Math.abs(n.t - g.t); if(n.t - g.t > gw) break; if(df < bd){ bd = df; best = n; } }
        var geo = laneGeo(g), nx = geo.x0 + (lane + .5) * geo.lw;
        if(!best || bd > gw){ return; }
        var r = bd <= g.pw ? "perfect" : "good"; best.res = r; g[r === "perfect" ? "P" : "G"]++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo);
        pop(g, ST.tx(r), nx, .74, TXC[r]); burst(g, nx, .82, LANECOL[lane], r === "perfect" ? 14 : 8); g.hk.sfx(r === "perfect" ? "coin" : "tap", g.combo); g.hk.vib(r === "perfect" ? 8 : 4);
    }
    M.rhythm = {stat: "rhy", hint: "ctl_rhythm",
        init: function(g){
            var d = g.d, r = g.rng, n = Math.round((g.short ? 18 : 34) + d * 10), bpm = 92 + 44 * d, beat = 60 / bpm, t = 2.0, last = -1, rep = 0, i;
            g.bpm = bpm; g.travel = 1.55 - .55 * d; g.notes = [];
            for(i = 0; i < n; i++){
                if(i > 0) t += beat * ((r() < .2 + .5 * d) ? .5 : 1);
                var l = Math.floor(r() * 4); if(l === last){ rep++; if(rep >= 2){ l = (l + 1 + Math.floor(r() * 3)) % 4; rep = 0; } } else rep = 0; last = l;
                g.notes.push({t: t, lane: l, res: null});
            }
            g.endAt = t + 1.3; g.P = 0; g.G = 0; g.Ms = 0; g.pw = .075 * (1 + .6 * g.as); g.gw = .15 * (1 + .6 * g.as);
        },
        update: function(g){
            for(var i = 0; i < g.notes.length; i++){ var n = g.notes[i]; if(!n.res && g.t - n.t > g.gw + .05){ n.res = "miss"; g.Ms++; g.combo = 0; var geo = laneGeo(g); pop(g, ST.tx("miss"), geo.x0 + (n.lane + .5) * geo.lw, .74, TXC.miss, 20); } }
            if(g.t > g.endAt) finish(g, 100 * (g.P + .6 * g.G) / g.notes.length);
        },
        act: function(g, a, down){ if(!down) return; var lane = {left: 0, down: 1, up: 2, right: 3, y: 0, b: 1, x: 2, a: 3}[a]; if(lane != null) hitLane(g, lane); },
        ptr: function(g, x, y, k){ if(k !== "down") return; var geo = laneGeo(g); hitLane(g, clamp(Math.floor((x - geo.x0) / geo.lw), 0, 3)); },
        draw: function(g, c, W, H, T){
            var geo = laneGeo(g), x0 = geo.x0 * W, lw = geo.lw * W, hy = H * .8, top = H * .06, i;
            c.fillStyle = "rgba(8,5,38,.5)"; c.fillRect(x0, 0, lw * 4, H);
            for(i = 0; i < 4; i++){ c.fillStyle = "rgba(255,255,255," + (g.held[["left", "down", "up", "right"][i]] || g.held[["y", "b", "x", "a"][i]] ? .16 : .05) + ")"; c.fillRect(x0 + i * lw + 2, 0, lw - 4, H); }
            c.strokeStyle = "rgba(255,255,255,.28)"; c.lineWidth = 2; for(i = 0; i <= 4; i++){ c.beginPath(); c.moveTo(x0 + i * lw, 0); c.lineTo(x0 + i * lw, H); c.stroke(); }
            c.shadowColor = "#fff"; c.shadowBlur = 16; c.strokeStyle = "#fff"; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, hy); c.lineTo(x0 + lw * 4, hy); c.stroke(); c.shadowBlur = 0;
            for(i = 0; i < 4; i++){ c.fillStyle = LANECOL[i]; c.globalAlpha = .9; c.beginPath(); c.arc(x0 + (i + .5) * lw, hy, lw * .3, 0, 6.3); c.fill(); c.globalAlpha = 1; tx(c, ["◀", "▼", "▲", "▶"][i], x0 + (i + .5) * lw, hy + 1, lw * .28, "#1a1040"); }
            for(i = 0; i < g.notes.length; i++){
                var n = g.notes[i]; if(n.res && n.res !== "miss") continue;
                var k = (n.t - g.t) / g.travel; if(k > 1.05) break; if(k < -.25) continue;
                var y = hy - k * (hy - top), x = x0 + (n.lane + .5) * lw; c.globalAlpha = n.res === "miss" ? .3 : 1;
                c.shadowColor = LANECOL[n.lane]; c.shadowBlur = 18; c.fillStyle = LANECOL[n.lane]; rr(c, x - lw * .4, y - lw * .22, lw * .8, lw * .44, lw * .2); c.fill(); c.shadowBlur = 0;
                c.fillStyle = "rgba(255,255,255,.55)"; rr(c, x - lw * .32, y - lw * .15, lw * .64, lw * .12, lw * .06); c.fill(); c.globalAlpha = 1;
            }
            hudBar(c, g, W, H, g.t / g.endAt, "");
        }};

    // ======================= karaoke（歌） =======================
    function curveAt(g, t){
        var pts = g.curve, i = 0; while(i < pts.length - 2 && pts[i + 1].t < t) i++;
        var a = pts[i], b = pts[i + 1], u = clamp((t - a.t) / (b.t - a.t), 0, 1); u = (1 - Math.cos(u * Math.PI)) / 2; return a.y + (b.y - a.y) * u;
    }
    M.karaoke = {stat: "vo", hint: "ctl_karaoke",
        init: function(g){
            var r = g.rng, dur = g.short ? 14 : 26, y = .5, t = 0; g.dur = dur; g.curve = [{t: -2, y: .5}, {t: 0, y: .5}];
            while(t < dur + 3){ t += .8 + r() * .6; var ny = y + (r() < .5 ? -1 : 1) * (.14 + r() * (.16 + .18 * g.d)); if(ny < .15 || ny > .85) ny = y - (ny - y); y = clamp(ny, .15, .85); g.curve.push({t: t, y: y}); }
            g.cur = .5; g.inside = 0; g.tol = clamp(.13 * (1 + .7 * g.as) - .035 * g.d, .06, .24); g.ptrY = null; g.ins = false;
        },
        update: function(g, dt){
            var mv = ((g.held.down ? 1 : 0) - (g.held.up ? 1 : 0)) * .95 * dt; g.cur = clamp(g.cur + mv, .06, .94);
            if(g.ptrY != null) g.cur += (g.ptrY - g.cur) * Math.min(1, dt * 14);
            var tg = curveAt(g, g.t), ins = Math.abs(g.cur - tg) < g.tol;
            if(ins){ g.inside += dt; if(!g.ins){ g.combo++; } } else if(g.ins){ g.combo = 0; }
            g.ins = ins; if(ins && Math.random() < dt * 8) burst(g, .22, g.cur, "#9dff9a", 1);
            if(g.t >= g.dur) finish(g, 100 * clamp(((g.inside / g.dur) - .22) / .68, 0, 1));
        },
        ptr: function(g, x, y, k){ g.ptrY = k === "up" ? null : y; },
        draw: function(g, c, W, H){
            var nowX = W * .22, win = 4.2, i;
            c.fillStyle = "rgba(8,5,38,.45)"; c.fillRect(0, H * .08, W, H * .86);
            c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 1; for(i = 0; i < 7; i++){ var yy = H * (.14 + i * .12); c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke(); }
            var th = g.tol * H * 2; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath();
            for(var tt = g.t - .6; tt <= g.t + win; tt += .06){ var x = nowX + (tt - g.t) / win * (W - nowX), y = curveAt(g, tt) * H; if(tt === g.t - .6) c.moveTo(x, y); else c.lineTo(x, y); }
            c.strokeStyle = g.ins ? "rgba(120,255,160,.32)" : "rgba(255,120,210,.28)"; c.lineWidth = th; c.stroke(); c.strokeStyle = g.ins ? "rgba(120,255,160,.7)" : "rgba(255,120,210,.6)"; c.lineWidth = th * .5; c.shadowColor = g.ins ? "#6dff9a" : "#ff5fd0"; c.shadowBlur = 18; c.stroke(); c.shadowBlur = 0;
            c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,.9)"; c.stroke();
            c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(nowX, H * .08); c.lineTo(nowX, H * .94); c.stroke();
            c.shadowColor = g.ins ? "#6dff9a" : "#ffd24a"; c.shadowBlur = 24; c.fillStyle = g.ins ? "#9dff9a" : "#ffe14a"; c.beginPath(); c.arc(nowX, g.cur * H, 17, 0, 6.3); c.fill(); c.shadowBlur = 0;
            tx(c, "🎤", nowX, g.cur * H + 1, 22);
            hudBar(c, g, W, H, g.t / g.dur, "");
        }};

    // ======================= timing（ストップ） =======================
    M.timing = {stat: "gt", hint: "ctl_timing",
        init: function(g){ g.rounds = g.short ? 3 : 5; g.round = 0; g.res = []; g.x = 0; g.dir = 1; g.wait = 0; M.timing.next(g); },
        next: function(g){ var r = g.rng; g.c = .22 + r() * .56; g.w = clamp((.11 - .05 * g.d) * (1 + .7 * g.as), .035, .2); g.sp = (.75 + 1.0 * g.d) * (1 + .1 * g.round); g.rT = 0; g.lastSc = null; g.x = r() < .5 ? 0 : 1; g.dir = g.x === 0 ? 1 : -1; },
        update: function(g, dt){
            if(g.wait > 0){ g.wait -= dt; if(g.wait <= 0){ g.round++; if(g.round >= g.rounds) finish(g, 100 * g.res.reduce(function(a, b){ return a + b; }, 0) / g.rounds); else M.timing.next(g); } return; }
            g.rT += dt; g.x += g.dir * g.sp * dt; if(g.x > 1){ g.x = 1; g.dir = -1; } if(g.x < 0){ g.x = 0; g.dir = 1; }
            if(g.rT > 8) M.timing.press(g);
        },
        press: function(g){
            if(g.wait > 0) return; var err = Math.abs(g.x - g.c), sc = clamp(1 - err / (g.w * 1.7), 0, 1); if(err <= g.w * .35) sc = 1; g.res.push(sc); g.lastSc = sc; g.wait = .8;
            var lab = sc >= .95 ? "perfect" : sc >= .6 ? "great" : sc > .15 ? "good" : "miss"; pop(g, ST.tx(lab), g.x, .42, TXC[lab], 34); burst(g, g.x, .5, TXC[lab], sc > .6 ? 18 : 6); g.hk.sfx(sc > .6 ? "coin" : sc > .15 ? "tap" : "ng"); if(sc >= .95){ g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); } else g.combo = 0;
        },
        act: function(g, a, down){ if(down && a !== "plus" && a !== "minus") M.timing.press(g); },
        ptr: function(g, x, y, k){ if(k === "down") M.timing.press(g); },
        draw: function(g, c, W, H){
            var gw = Math.min(W * .8, 760), x0 = (W - gw) / 2, y = H * .5, h = 46;
            c.fillStyle = "rgba(8,5,38,.55)"; rr(c, x0 - 10, y - h / 2 - 10, gw + 20, h + 20, 24); c.fill();
            c.fillStyle = "rgba(255,255,255,.1)"; rr(c, x0, y - h / 2, gw, h, 16); c.fill();
            var zx = x0 + (g.c - g.w) * gw, zw = g.w * 2 * gw; c.shadowColor = "#6dff9a"; c.shadowBlur = 22; c.fillStyle = "rgba(110,255,160,.75)"; rr(c, zx, y - h / 2, zw, h, 12); c.fill(); c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,.9)"; rr(c, x0 + (g.c - g.w * .35) * gw, y - h / 2, g.w * .7 * gw, h, 8); c.fill();
            var mx = x0 + g.x * gw; c.shadowColor = "#ffe14a"; c.shadowBlur = 20; c.fillStyle = "#ffe14a"; rr(c, mx - 6, y - h / 2 - 16, 12, h + 32, 6); c.fill(); c.shadowBlur = 0;
            for(var i = 0; i < g.rounds; i++){ c.fillStyle = i < g.res.length ? (g.res[i] > .6 ? "#6dff9a" : g.res[i] > .15 ? "#ffd24a" : "#ff6b8a") : "rgba(255,255,255,.25)"; c.beginPath(); c.arc(W / 2 + (i - (g.rounds - 1) / 2) * 30, H * .72, 9, 0, 6.3); c.fill(); }
            tx(c, g.em || "🎯", W / 2, H * .26, Math.min(86, W / 8));
            hudBar(c, g, W, H, g.round / g.rounds, "");
        }};

    // ======================= mash（れんだ・綱引き） =======================
    M.mash = {stat: "bd", hint: "ctl_mash",
        init: function(g){ g.dur = g.short ? 7 : 11; g.p = 0; g.taps = 0; g.pull = .35 + .45 * g.d; g.gain = .08 * (1 + .45 * g.as); g.flash = 0; },
        update: function(g, dt){
            g.flash = Math.max(0, g.flash - dt * 4); g.p -= g.pull * dt * (.85 + .3 * Math.sin(g.t * 5)); if(g.p < -1) g.p = -1;
            if(g.p >= 1) finish(g, 100); else if(g.t >= g.dur) finish(g, 50 + 50 * g.p);
        },
        tap: function(g){ g.p = Math.min(1, g.p + g.gain); g.taps++; g.flash = 1; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.hk.sfx("tap"); g.hk.vib(3); burst(g, .5 + g.p * .4, .52, "#ffd24a", 2); },
        act: function(g, a, down){ if(down && a !== "plus" && a !== "minus") M.mash.tap(g); },
        ptr: function(g, x, y, k){ if(k === "down") M.mash.tap(g); },
        draw: function(g, c, W, H){
            var bw = Math.min(W * .84, 800), x0 = (W - bw) / 2, y = H * .52, h = 40;
            c.fillStyle = "rgba(8,5,38,.55)"; rr(c, x0 - 10, y - h / 2 - 10, bw + 20, h + 20, 26); c.fill();
            var mid = x0 + bw / 2, px = mid + g.p * bw / 2;
            c.fillStyle = "rgba(255,95,168,.8)"; rr(c, x0, y - h / 2, Math.max(0, px - x0), h, 14); c.fill();
            c.fillStyle = "rgba(55,224,255,.7)"; rr(c, px, y - h / 2, Math.max(0, x0 + bw - px), h, 14); c.fill();
            c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 3; c.beginPath(); c.moveTo(mid, y - h); c.lineTo(mid, y + h); c.stroke();
            c.shadowColor = "#ffe14a"; c.shadowBlur = 20; tx(c, "🚩", px, y - h * .7, 54 + g.flash * 14); c.shadowBlur = 0;
            tx(c, "🙂", x0 - 2, y, 44); tx(c, "😤", x0 + bw + 2, y, 44);
            var big = 80 + g.flash * 24; tx(c, "TAP!", W / 2, H * .78, Math.min(big, W / 6), "rgba(255,255,255," + (.5 + g.flash * .5) + ")", "center", "#ff3ea5");
            tx(c, g.taps + "", W / 2, H * .26, 56, "#ffe14a", "center", "#ff8a00");
            hudBar(c, g, W, H, g.t / g.dur, "");
        }};

    // ======================= mood（きもち当て） =======================
    var PAIRS = [["😂", "🤣"], ["😢", "😭"], ["😡", "😤"], ["😲", "😱"], ["😍", "🥰"], ["😴", "😪"], ["😎", "😏"], ["😇", "😊"], ["😋", "😛"], ["🤔", "🧐"]];
    function moodRect(g){ var w = Math.min(g.W * .8, 560), h = Math.min(g.H * .4, 250); return {x: (g.W - w) / 2, y: g.H * .5, w: w, h: h}; }
    M.mood = {stat: "tk", hint: "ctl_mood",
        init: function(g){ g.rounds = g.short ? 6 : 10; g.qi = -1; g.sum = 0; g.tlim = (4.6 - 2.0 * g.d) * (1 + .5 * g.as); g.pause = 0; g.sel = 0; g.mark = null; M.mood.next(g); },
        next: function(g){
            g.qi++; if(g.qi >= g.rounds){ finish(g, 100 * g.sum / g.rounds); return; }
            var r = g.rng, pi = Math.floor(r() * PAIRS.length), pr = PAIRS[pi], fi = r() < .5 ? 0 : 1; g.face = pr[fi]; g.ans = pr[1 - fi];
            var opts = [g.ans], tries = 0; while(opts.length < 4 && tries++ < 50){ var o = PAIRS[Math.floor(r() * PAIRS.length)], e = o[Math.floor(r() * 2)]; if(o !== pr && opts.indexOf(e) < 0) opts.push(e); }
            for(var i = opts.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp; }
            g.opts = opts; g.qT = 0; g.sel = 0; g.mark = null;
        },
        update: function(g, dt){
            if(g.pause > 0){ g.pause -= dt; if(g.pause <= 0) M.mood.next(g); return; }
            g.qT += dt; if(g.qT > g.tlim) M.mood.answer(g, -1);
        },
        answer: function(g, i){
            if(g.pause > 0) return; var ok = i >= 0 && g.opts[i] === g.ans; g.mark = {i: i, ok: ok}; var rect = moodRect(g);
            if(ok){ g.sum += .65 + .35 * (1 - g.qT / g.tlim); g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); pop(g, ST.tx(g.qT < g.tlim * .4 ? "perfect" : "good"), .5, .4, TXC.perfect, 30); g.hk.sfx("coin"); burst(g, .5, .3, "#ffe14a", 14); }
            else { g.combo = 0; pop(g, ST.tx("miss"), .5, .4, TXC.miss, 28); g.hk.sfx("ng"); }
            g.pause = .55; void rect;
        },
        act: function(g, a, down){
            if(!down || g.pause > 0) return; var s = g.sel, col = s % 2, row = (s / 2) | 0;
            if(a === "left") col = 0; else if(a === "right") col = 1; else if(a === "up") row = 0; else if(a === "down") row = 1; else if(a === "a"){ M.mood.answer(g, g.sel); return; }
            g.sel = row * 2 + col; g.hk.sfx("tap");
        },
        ptr: function(g, x, y, k){
            if(k !== "down" || g.pause > 0) return; var r = moodRect(g), px = x * g.W, py = y * g.H; if(px < r.x || px > r.x + r.w || py < r.y || py > r.y + r.h) return;
            var col = px < r.x + r.w / 2 ? 0 : 1, row = py < r.y + r.h / 2 ? 0 : 1; g.sel = row * 2 + col; M.mood.answer(g, g.sel);
        },
        draw: function(g, c, W, H){
            var r = moodRect(g), i; tx(c, g.face, W / 2, H * .27, Math.min(120, W / 5)); tx(c, "💭", W / 2 - Math.min(90, W / 6), H * .17, 40);
            for(i = 0; i < 4; i++){
                var cx = r.x + (i % 2) * r.w / 2, cy = r.y + ((i / 2) | 0) * r.h / 2, ok = g.mark && g.mark.i === i ? g.mark.ok : null, sel = g.sel === i;
                c.fillStyle = ok === true ? "rgba(110,255,160,.5)" : ok === false ? "rgba(255,95,138,.5)" : "rgba(14,10,60,.6)"; rr(c, cx + 6, cy + 6, r.w / 2 - 12, r.h / 2 - 12, 20); c.fill();
                c.lineWidth = sel ? 4 : 2; c.strokeStyle = sel ? "#ffe14a" : "rgba(255,255,255,.35)"; c.stroke();
                tx(c, g.opts[i], cx + r.w / 4, cy + r.h / 4 + 2, Math.min(64, r.h / 3.2));
            }
            if(g.mark && g.mark.i < 0) tx(c, ST.tx("timeUp"), W / 2, H * .45, 28, "#ff6b8a", "center", "#000");
            hudBar(c, g, W, H, g.qi / g.rounds, ""); c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(W / 2 - 100, H * .455, 200, 6); c.fillStyle = "#37e0ff"; c.fillRect(W / 2 - 100, H * .455, 200 * clamp(1 - g.qT / g.tlim, 0, 1), 6);
        }};

    // ======================= react（早押し） =======================
    M.react = {stat: "gt", hint: "ctl_react",
        init: function(g){ g.rounds = g.short ? 3 : 5; g.round = 0; g.res = []; g.best = .18; g.worst = (.62 - .17 * g.d) * (1 + .35 * g.as); g.pause = 0; g.msg = ""; M.react.next(g); },
        next: function(g){ g.w = 1.0 + g.rng() * 2.2; g.sig = false; g.rT = 0; g.msg = ""; },
        rec: function(g, sc, msg){ g.res.push(sc); g.msg = msg; g.pause = .9; g.sig = false; if(sc > .6){ g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); } else g.combo = 0; },
        update: function(g, dt){
            if(g.pause > 0){ g.pause -= dt; if(g.pause <= 0){ g.round++; if(g.round >= g.rounds) finish(g, 100 * g.res.reduce(function(a, b){ return a + b; }, 0) / g.rounds); else M.react.next(g); } return; }
            if(!g.sig){ g.w -= dt; if(g.w <= 0){ g.sig = true; g.rT = 0; g.hk.sfx("pop"); } } else { g.rT += dt; if(g.rT > 1.6) M.react.rec(g, 0, ST.tx("miss")); }
        },
        press: function(g){
            if(g.pause > 0) return;
            if(!g.sig){ M.react.rec(g, 0, "✖ " + ST.tx("miss")); g.hk.sfx("ng"); pop(g, ST.tx("miss"), .5, .45, TXC.miss, 34); return; }
            var rt = g.rT, sc = clamp((g.worst - rt) / (g.worst - g.best), 0, 1); M.react.rec(g, sc, Math.round(rt * 1000) + " ms");
            var lab = sc >= .9 ? "perfect" : sc >= .6 ? "great" : sc > .15 ? "good" : "miss"; pop(g, ST.tx(lab), .5, .4, TXC[lab], 34); burst(g, .5, .5, TXC[lab], 16); g.hk.sfx(sc > .6 ? "coin" : "tap");
        },
        act: function(g, a, down){ if(down && a !== "plus" && a !== "minus") M.react.press(g); },
        ptr: function(g, x, y, k){ if(k === "down") M.react.press(g); },
        draw: function(g, c, W, H, T){
            var R = Math.min(W, H) * .22, sig = g.sig && g.pause <= 0;
            c.shadowColor = sig ? "#6dff9a" : "#ff5f8a"; c.shadowBlur = sig ? 60 : 24; c.fillStyle = sig ? "#7dff9f" : "#5b3cc4"; c.beginPath(); c.arc(W / 2, H * .46, R * (sig ? 1.08 : 1), 0, 6.3); c.fill(); c.shadowBlur = 0;
            tx(c, sig ? "!!" : g.pause > 0 ? g.msg : "…", W / 2, H * .46, R * .7, sig ? "#06310f" : "#fff");
            for(var i = 0; i < g.rounds; i++){ c.fillStyle = i < g.res.length ? (g.res[i] > .6 ? "#6dff9a" : g.res[i] > .15 ? "#ffd24a" : "#ff6b8a") : "rgba(255,255,255,.25)"; c.beginPath(); c.arc(W / 2 + (i - (g.rounds - 1) / 2) * 30, H * .8, 9, 0, 6.3); c.fill(); }
            hudBar(c, g, W, H, g.round / g.rounds, ""); void T;
        }};

    // ======================= memory（光った順） =======================
    var PADC = ["#ff5fa8", "#ffd24a", "#37e0ff", "#9dff6a"];
    M.memory = {stat: "wt", hint: "ctl_memory",
        init: function(g){
            var r = g.rng; g.L = (g.short ? 3 : 4) + Math.round(6 * g.d); g.seq = []; for(var i = 0; i < g.L; i++) g.seq.push(Math.floor(r() * 4));
            g.n = 2; g.lives = 1 + Math.floor(Math.max(0, g.as) / .35); g.phase = "wait"; g.pw = 0.8; g.inT = 0; g.si = 0; g.sT = 0; g.pi = 0; g.lit = -1; g.litT = 0;
        },
        startShow: function(g){ g.phase = "show"; g.si = 0; g.sT = 0; g.lit = -1; },
        update: function(g, dt){
            g.litT = Math.max(0, g.litT - dt); if(g.litT <= 0 && g.phase !== "show") g.lit = -1;
            if(g.phase === "wait"){ g.pw -= dt; if(g.pw <= 0) M.memory.startShow(g); return; }
            if(g.phase === "show"){
                var on = .52 - .2 * g.d, gap = .2; g.sT += dt; var cyc = on + gap, k = Math.floor(g.sT / cyc);
                if(k >= g.n){ g.phase = "input"; g.pi = 0; g.lit = -1; g.inT = 0; return; }
                var inside = g.sT - k * cyc < on; g.lit = inside ? g.seq[k] : -1; if(inside && g.si !== k + 1){ g.si = k + 1; g.hk.sfx("combo", g.seq[k] * 2 + 2); }
                return;
            }
            if(g.phase === "input"){ g.inT += dt; if(g.inT > 5 + 1.1 * g.n) M.memory.press(g, -1); }
        },
        press: function(g, p){
            if(g.phase !== "input") return; g.inT = 0; g.lit = p; g.litT = .22; if(p >= 0) g.hk.sfx("combo", p * 2 + 2);
            if(g.seq[g.pi] === p){ g.pi++; burst(g, .5, .5, PADC[p], 6); if(g.pi >= g.n){ g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); pop(g, ST.tx("great"), .5, .12, TXC.great, 28); if(g.n >= g.L){ finish(g, 100); return; } g.n++; g.phase = "wait"; g.pw = .7; } }
            else { g.combo = 0; g.lives--; g.hk.sfx("ng"); pop(g, ST.tx("miss"), .5, .12, TXC.miss, 28); if(g.lives < 0){ finish(g, Math.min(99, 100 * Math.max(0, g.n - 1) / g.L)); return; } g.phase = "wait"; g.pw = .9; }
        },
        act: function(g, a, down){ if(!down) return; var p = {up: 0, x: 0, right: 1, a: 1, down: 2, b: 2, left: 3, y: 3}[a]; if(p != null) M.memory.press(g, p); },
        ptr: function(g, x, y, k){ if(k !== "down") return; var dx = (x - .5) * g.asp, dy = y - .52; if(Math.hypot(dx, dy) < .06) return; M.memory.press(g, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0)); },
        draw: function(g, c, W, H){
            var cx = W / 2, cy = H * .52, R = Math.min(W, H) * .17, off = R * 1.15, pos = [[0, -off], [off, 0], [0, off], [-off, 0]];
            for(var i = 0; i < 4; i++){
                var lit = g.lit === i; c.shadowColor = PADC[i]; c.shadowBlur = lit ? 50 : 8; c.globalAlpha = lit ? 1 : .42; c.fillStyle = PADC[i];
                c.beginPath(); c.arc(cx + pos[i][0], cy + pos[i][1], R * (lit ? 1.04 : .96), 0, 6.3); c.fill(); c.globalAlpha = 1; c.shadowBlur = 0;
                tx(c, ["▲", "▶", "▼", "◀"][i], cx + pos[i][0], cy + pos[i][1], R * .55, "rgba(20,10,60,.7)");
            }
            tx(c, g.phase === "show" ? "👀" : g.phase === "input" ? "👆" : "…", cx, cy, R * .7);
            for(var j = 0; j < g.L; j++){ c.fillStyle = j < g.n - 1 ? "#6dff9a" : j === g.n - 1 ? "#ffd24a" : "rgba(255,255,255,.25)"; c.beginPath(); c.arc(W / 2 + (j - (g.L - 1) / 2) * 20, H * .9, 6, 0, 6.3); c.fill(); }
            hudBar(c, g, W, H, (g.n - 1) / g.L, "");
        }};

    // ======================= dart（まと） =======================
    M.dart = {stat: "gt", hint: "ctl_dart",
        init: function(g){ var r = g.rng; g.throws = g.short ? 3 : 6; g.tn = 0; g.score = []; g.hits = []; g.pause = 0; g.tT = 0; g.w = 1.1 + 1.5 * g.d; g.ph1 = r() * 6.28; g.ph2 = r() * 6.28; g.bull = .035 * (1 + .8 * g.as); g.cx = .5; g.cy = .5; g.tt = 0; },
        pos: function(g){ var t = g.tt; return {x: .5 + .3 * Math.sin(g.w * t + g.ph1), y: .5 + .27 * Math.sin(1.31 * g.w * t + g.ph2)}; },
        update: function(g, dt){
            if(g.pause > 0){ g.pause -= dt; if(g.pause <= 0){ g.tn++; if(g.tn >= g.throws) finish(g, 100 * g.score.reduce(function(a, b){ return a + b; }, 0) / g.throws); } return; }
            g.tt += dt; g.tT += dt; var p = M.dart.pos(g); g.cx = p.x; g.cy = p.y; if(g.tT > 9) M.dart.press(g);
        },
        press: function(g){
            if(g.pause > 0) return; var r = Math.hypot((g.cx - .5) * g.asp, g.cy - .5), sc = r < g.bull ? 1 : clamp(1 - (r - g.bull) / .2, 0, 1) * .9; g.tT = 0;
            g.score.push(sc); g.hits.push({x: g.cx, y: g.cy}); g.pause = .7; var lab = sc >= .95 ? "perfect" : sc >= .6 ? "great" : sc > .2 ? "good" : "miss"; pop(g, ST.tx(lab), g.cx, g.cy - .08, TXC[lab], 30); burst(g, g.cx, g.cy, TXC[lab], sc > .6 ? 18 : 6); g.hk.sfx(sc > .6 ? "coin" : "hit");
            if(sc >= .95){ g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); } else g.combo = 0;
        },
        act: function(g, a, down){ if(down && a !== "plus" && a !== "minus") M.dart.press(g); },
        ptr: function(g, x, y, k){ if(k === "down") M.dart.press(g); },
        draw: function(g, c, W, H){
            var cx = W / 2, cy = H * .5, R = .34 * H, cols = ["#ff5f8a", "#fff", "#37e0ff", "#fff", "#ffd24a"];
            for(var i = 0; i < 5; i++){ c.fillStyle = cols[i]; c.globalAlpha = .88; c.beginPath(); c.arc(cx, cy, R * (1 - i * .19), 0, 6.3); c.fill(); } c.globalAlpha = 1;
            c.shadowColor = "#ffe14a"; c.shadowBlur = 18; c.fillStyle = "#ff2e6a"; c.beginPath(); c.arc(cx, cy, Math.max(7, g.bull * H), 0, 6.3); c.fill(); c.shadowBlur = 0;
            for(var j = 0; j < g.hits.length; j++){ tx(c, "📍", cx + (g.hits[j].x - .5) * W, cy + (g.hits[j].y - .5) * H, 22); }
            if(g.pause <= 0){ var px = g.cx * W, py = g.cy * H; c.strokeStyle = "#fff"; c.lineWidth = 3; c.shadowColor = "#37e0ff"; c.shadowBlur = 14; c.beginPath(); c.arc(px, py, 22, 0, 6.3); c.moveTo(px - 32, py); c.lineTo(px + 32, py); c.moveTo(px, py - 32); c.lineTo(px, py + 32); c.stroke(); c.shadowBlur = 0; }
            hudBar(c, g, W, H, g.tn / g.throws, "");
        }};

    // ======================= catch（キャッチ） =======================
    var GOOD = ["💖", "⭐", "🎁", "🍰"], BAD = ["🍅", "🪨"];
    M.catch = {stat: "bd", hint: "ctl_catch",
        init: function(g){ g.dur = g.short ? 14 : 26; g.iv = .5 - .2 * g.d; g.sp = .4 + .5 * g.d; g.items = []; g.sT = 0; g.x = .5; g.bw = .085 * (1 + .7 * g.as); g.goodN = 0; g.caught = 0; g.hit = 0; g.ptrX = null; g.tail = 0; },
        update: function(g, dt){
            var mv = ((g.held.right ? 1 : 0) - (g.held.left ? 1 : 0)) * 1.0 * dt; if(g.ptrX != null) mv += clamp((g.ptrX - g.x) * 12 * dt, -1.5 * dt, 1.5 * dt); g.x = clamp(g.x + mv, .06, .94);
            if(g.t < g.dur){ g.sT -= dt; if(g.sT <= 0){ g.sT = g.iv * (.7 + g.rng() * .6); var good = g.rng() < .72 - .12 * g.d; g.items.push({x: .08 + g.rng() * .84, y: -.05, good: good, e: good ? GOOD[Math.floor(g.rng() * GOOD.length)] : BAD[Math.floor(g.rng() * BAD.length)]}); if(good) g.goodN++; } }
            for(var i = g.items.length - 1; i >= 0; i--){
                var it = g.items[i]; it.y += g.sp * dt * (1 + .0 * g.d);
                if(it.y > .8 && it.y < .96 && Math.abs(it.x - g.x) < (it.good ? g.bw + .035 : .085 * .6 + .02)){ g.items.splice(i, 1); if(it.good){ g.caught++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); g.hk.sfx("coin"); burst(g, it.x, .84, "#ffe14a", 8); if(g.combo % 5 === 0) pop(g, ST.tx("combo", {n: g.combo}), g.x, .7, TXC.perfect, 24); } else { g.hit++; g.combo = 0; g.hk.sfx("ng"); pop(g, ST.tx("miss"), g.x, .74, TXC.miss, 24); g.hk.shake(5); } }
                else if(it.y > 1.05){ if(it.good) g.combo = 0; g.items.splice(i, 1); }
            }
            if(g.t >= g.dur){ g.tail += dt; if(g.tail > 1.6 || !g.items.length) finish(g, clamp(100 * g.caught / Math.max(1, g.goodN * .9) - 8 * g.hit, 0, 100)); }
        },
        act: function(g, a, down){ },
        ptr: function(g, x, y, k){ g.ptrX = k === "up" ? null : x; },
        draw: function(g, c, W, H){
            for(var i = 0; i < g.items.length; i++){ var it = g.items[i]; tx(c, it.e, it.x * W, it.y * H, Math.min(44, W / 11)); }
            var bx = g.x * W, bw = g.bw * W * 2, by = H * .88; c.shadowColor = "#ff5fd0"; c.shadowBlur = 20; c.fillStyle = "rgba(255,95,208,.35)"; rr(c, bx - bw / 2 - 4, by - 18, bw + 8, 40, 16); c.fill(); c.shadowBlur = 0; tx(c, "🧺", bx, by, Math.min(56, bw * .9));
            hudBar(c, g, W, H, g.t / g.dur, "💖 " + g.caught);
        }};

    // ======================= pachi（ニセコインの 玉入れ・20歳以上） =======================
    var PM = [.6, 0, .6, 2.5, .6, 0, .6];
    function pegs(){ var a = [], r, i, dx = 1 / 8; for(r = 0; r < 11; r++){ var off = r % 2 ? dx / 2 : 0; for(i = 0; i < 9; i++){ var x = i * dx + off + .0625; if(x > .045 && x < .955) a.push({x: x, y: .17 + r * .06}); } } return a; }
    ST.PACHI_PEGS = pegs(); ST.PACHI_MULT = PM;
    M.pachi = {stat: "gt", hint: "ctl_pachi",
        init: function(g){ g.balls = g.short ? 5 : 8; g.fired = 0; g.ball = null; g.bet = g.cfg.bet || 100; g.pw = .5; g.net = 0; g.sumMult = 0; g.jack = 0; g.cool = 0; g.acc = 0; g.trail = []; g.pegs = ST.PACHI_PEGS; g.last = -1; g.score = 0; g.idle = 0; g.fireAcc = 0; },
        update: function(g, dt){
            if(!g.ball){ g.pw = .5 + .5 * Math.sin(g.t * (2.0 + 1.2 * g.d)); g.cool -= dt; if(g.fired >= g.balls && g.cool <= 0){ finish(g, M.pachi.pct(g)); return; } g.idle += dt; if(g.idle > 7) M.pachi.fire(g); return; }
            g.acc += dt; var step = 1 / 180, b = g.ball;
            while(g.acc >= step){
                g.acc -= step; b.vy += 2.1 * step; b.x += b.vx * step; b.y += b.vy * step; var i;
                if(b.x < .025){ b.x = .025; b.vx = Math.abs(b.vx) * .6; } if(b.x > .975){ b.x = .975; b.vx = -Math.abs(b.vx) * .6; }
                for(i = 0; i < g.pegs.length; i++){
                    var p = g.pegs[i], dx = b.x - p.x, dy = b.y - p.y, d2 = dx * dx + dy * dy, rr0 = .016 + .011;
                    if(d2 < rr0 * rr0 && d2 > 1e-8){ var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny; if(vn < 0){ var e = .5 + (g.rng() - .5) * .3; b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny; b.vx += (g.rng() - .5) * .34; } b.x = p.x + nx * rr0; b.y = p.y + ny * rr0; g.hk.sfx("tap"); }
                }
                if(b.y > .9){ M.pachi.land(g, b); break; }
            }
            g.trail.push({x: b.x, y: b.y}); if(g.trail.length > 14) g.trail.shift();
        },
        land: function(g, b){
            var idx = clamp(Math.floor(b.x * PM.length), 0, PM.length - 1), m = PM[idx]; g.net += Math.round(g.bet * (m - 1)); g.sumMult += m; g.score += .7 * g.fireAcc + .3 * (m >= 2.5 ? 1 : m > 0 ? .55 : .2); g.ball = null; g.cool = .7; g.last = idx; g.trail = [];
            if(m >= 2.5){ g.jack++; pop(g, "JACKPOT", .5, .5, TXC.perfect, 40); g.hk.sfx("win"); burst(g, b.x, .9, "#ffe14a", 40); g.hk.shake(8); g.combo++; }
            else if(m >= 1){ pop(g, "+" + Math.round(g.bet * (m - 1)), b.x, .8, TXC.great, 26); g.hk.sfx("coin"); g.combo++; } else { g.hk.sfx("ng"); g.combo = 0; }
            g.coinsDelta = g.net; g.maxCombo = Math.max(g.maxCombo, g.combo);
        },
        fire: function(g){ if(g.ball || g.fired >= g.balls || g.cool > 0) return; g.fired++; g.idle = 0; var ac = clamp(1 - Math.abs(g.pw - .5) / (.42 * (1 + .6 * g.as)), 0, 1); g.fireAcc = ac; g.ball = {x: clamp(.1 + .8 * g.pw + (g.rng() - .5) * .07, .04, .96), y: .06, vx: (g.rng() - .5) * .12, vy: 0}; g.acc = 0; g.hk.sfx("pop"); },
        pct: function(g){ return clamp(100 * g.score / g.balls, 0, 100); },
        act: function(g, a, down){ if(down && a !== "plus" && a !== "minus") M.pachi.fire(g); },
        ptr: function(g, x, y, k){ if(k === "down") M.pachi.fire(g); },
        draw: function(g, c, W, H){
            var bh = H * .9, bw = Math.min(W * .9, bh * .66), bx = (W - bw) / 2, by = H * .06, X = function(x){ return bx + x * bw; }, Y = function(y){ return by + y * bh; }, i;
            c.fillStyle = "rgba(10,6,50,.72)"; rr(c, bx - 8, by - 8, bw + 16, bh + 16, 22); c.fill(); c.strokeStyle = "#ff5fd0"; c.lineWidth = 3; c.shadowColor = "#ff5fd0"; c.shadowBlur = 16; c.stroke(); c.shadowBlur = 0;
            c.fillStyle = "#cfd8ff"; for(i = 0; i < g.pegs.length; i++){ c.beginPath(); c.arc(X(g.pegs[i].x), Y(g.pegs[i].y), Math.max(3, bw * .016), 0, 6.3); c.fill(); }
            var pw = bw / PM.length; for(i = 0; i < PM.length; i++){ c.fillStyle = PM[i] >= 3 ? "rgba(255,210,70,.85)" : PM[i] >= 1 ? "rgba(110,255,160,.55)" : PM[i] > 0 ? "rgba(255,255,255,.2)" : "rgba(255,90,130,.25)"; c.fillRect(bx + i * pw + 2, Y(.9), pw - 4, bh * .1); tx(c, "×" + PM[i], bx + (i + .5) * pw, Y(.95), Math.min(18, pw * .32), "#fff"); }
            if(g.last >= 0){ c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(bx + g.last * pw + 2, Y(.9), pw - 4, bh * .1); }
            for(i = 0; i < g.trail.length; i++){ c.globalAlpha = i / g.trail.length * .5; c.fillStyle = "#fff"; c.beginPath(); c.arc(X(g.trail[i].x), Y(g.trail[i].y), bw * .012, 0, 6.3); c.fill(); } c.globalAlpha = 1;
            if(g.ball){ c.shadowColor = "#ffe14a"; c.shadowBlur = 14; c.fillStyle = "#ffe14a"; c.beginPath(); c.arc(X(g.ball.x), Y(g.ball.y), Math.max(4, bw * .016), 0, 6.3); c.fill(); c.shadowBlur = 0; }
            else if(g.fired < g.balls){ var lx = X(.1 + .8 * g.pw); c.fillStyle = "#37e0ff"; c.shadowColor = "#37e0ff"; c.shadowBlur = 16; c.beginPath(); c.moveTo(lx, Y(.075)); c.lineTo(lx - 12, Y(.03)); c.lineTo(lx + 12, Y(.03)); c.closePath(); c.fill(); c.shadowBlur = 0; }
            tx(c, "🪙 ×" + (g.balls - g.fired) + "  " + (g.net >= 0 ? "+" : "") + g.net, W / 2, H * .035, 18, g.net >= 0 ? "#9dff9a" : "#ff9aa8", "center", "#000");
            tx(c, ST.tx("warnPachi"), W / 2, H * .985, Math.min(13, W / 40), "rgba(255,255,255,.75)", "center", "#000");
        }};

    // ======================= cheers（乾杯のノリ・20歳以上） =======================
    M.cheers = {stat: "tk", hint: "ctl_cheers",
        init: function(g){
            var n = g.short ? 10 : 18, bpm = 88 + 36 * g.d, beat = 60 / bpm, t = 2.2, r = g.rng; g.notes = [];
            for(var i = 0; i < n; i++){ if(i > 0) t += beat * (r() < .22 + .3 * g.d ? .5 : 1); g.notes.push({t: t, res: null}); }
            g.appr = 1.1; g.endAt = t + 1.2; g.P = 0; g.G = 0; g.pw = .09 * (1 + .6 * g.as); g.gw = .17 * (1 + .6 * g.as);
        },
        update: function(g){
            for(var i = 0; i < g.notes.length; i++){ var n = g.notes[i]; if(!n.res && g.t - n.t > g.gw + .05){ n.res = "miss"; g.combo = 0; pop(g, ST.tx("miss"), .5, .3, TXC.miss, 24); } }
            if(g.t > g.endAt) finish(g, 100 * (g.P + .6 * g.G) / g.notes.length);
        },
        press: function(g){
            var best = null, bd = 9; for(var i = 0; i < g.notes.length; i++){ var n = g.notes[i]; if(n.res) continue; if(n.t - g.t > g.gw) break; var d = Math.abs(n.t - g.t); if(d < bd){ bd = d; best = n; } }
            if(!best || bd > g.gw) return; var r = bd <= g.pw ? "perfect" : "good"; best.res = r; g[r === "perfect" ? "P" : "G"]++; g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); pop(g, ST.tx(r), .5, .3, TXC[r], 30); burst(g, .5, .5, "#ffe14a", r === "perfect" ? 18 : 8); g.hk.sfx("coin"); g.hk.vib(6);
        },
        act: function(g, a, down){ if(down && a !== "plus" && a !== "minus") M.cheers.press(g); },
        ptr: function(g, x, y, k){ if(k === "down") M.cheers.press(g); },
        draw: function(g, c, W, H){
            var cx = W / 2, cy = H * .5, R = Math.min(W, H) * .15, sway = Math.min(1, g.t / g.endAt) * .06 * Math.sin(g.t * 3);
            c.save(); c.translate(cx, cy); c.rotate(sway); c.translate(-cx, -cy);
            c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 5; c.shadowColor = "#ffe14a"; c.shadowBlur = 20; c.beginPath(); c.arc(cx, cy, R, 0, 6.3); c.stroke(); c.shadowBlur = 0;
            for(var i = 0; i < g.notes.length; i++){ var n = g.notes[i]; if(n.res && n.res !== "miss") continue; var k = (n.t - g.t) / g.appr; if(k > 1 || k < -.2) continue; var rad = R * (1 + k * 2.2); c.globalAlpha = n.res === "miss" ? .25 : clamp(1.1 - k, .2, 1); c.strokeStyle = "#ff5fd0"; c.lineWidth = 6; c.shadowColor = "#ff5fd0"; c.shadowBlur = 16; c.beginPath(); c.arc(cx, cy, rad, 0, 6.3); c.stroke(); c.shadowBlur = 0; c.globalAlpha = 1; }
            tx(c, "🥂", cx, cy, R * 1.1); c.restore();
            hudBar(c, g, W, H, g.t / g.endAt, "");
        }};

    // ======================= scan（ひとつだけちがう） =======================
    var SETS = [["😀", "😃"], ["🙂", "🙃"], ["🍎", "🍅"], ["🌕", "🌝"], ["⭐", "🌟"], ["❤️", "🧡"], ["🔵", "🟣"], ["🟥", "🟧"], ["🍊", "🍑"], ["😊", "😌"], ["🌻", "🌼"], ["🌙", "🌛"]];
    function scanRect(g){ var n = g.n, cs = Math.min(g.W * .84 / n, g.H * .72 / n, 90); return {n: n, cs: cs, x0: (g.W - cs * n) / 2, y0: g.H * .17}; }
    M.scan = {stat: "wt", hint: "ctl_scan",
        init: function(g){ g.rounds = g.short ? 5 : 8; g.qi = -1; g.sum = 0; g.tlim = (8 - 3.5 * g.d) * (1 + .5 * g.as); g.pause = 0; g.mark = null; M.scan.next(g); },
        next: function(g){
            g.qi++; if(g.qi >= g.rounds){ finish(g, 100 * g.sum / g.rounds); return; }
            var r = g.rng; g.n = clamp(3 + Math.floor(g.qi / 3) + Math.round(g.d * 1.5), 3, 6); var s = SETS[Math.floor(r() * SETS.length)], sw = r() < .5 ? 0 : 1;
            g.base = s[sw]; g.odd = s[1 - sw]; g.oi = Math.floor(r() * g.n * g.n); g.cur = Math.floor(g.n * g.n / 2); g.qT = 0; g.mark = null;
        },
        update: function(g, dt){
            if(g.pause > 0){ g.pause -= dt; if(g.pause <= 0) M.scan.next(g); return; }
            g.qT += dt; if(g.qT > g.tlim) M.scan.answer(g, -1);
        },
        answer: function(g, i){
            if(g.pause > 0) return; var ok = i === g.oi; g.mark = {i: i, ok: ok}; g.pause = .6;
            if(ok){ g.sum += .6 + .4 * (1 - g.qT / g.tlim); g.combo++; g.maxCombo = Math.max(g.maxCombo, g.combo); pop(g, ST.tx(g.qT < g.tlim * .35 ? "perfect" : "good"), .5, .1, TXC.perfect, 28); g.hk.sfx("coin"); }
            else { g.combo = 0; pop(g, ST.tx("miss"), .5, .1, TXC.miss, 26); g.hk.sfx("ng"); }
        },
        act: function(g, a, down){
            if(!down || g.pause > 0) return; var n = g.n, cx = g.cur % n, cy = (g.cur / n) | 0;
            if(a === "left") cx = (cx + n - 1) % n; else if(a === "right") cx = (cx + 1) % n; else if(a === "up") cy = (cy + n - 1) % n; else if(a === "down") cy = (cy + 1) % n; else if(a === "a"){ M.scan.answer(g, g.cur); return; } else return;
            g.cur = cy * n + cx; g.hk.sfx("tap");
        },
        ptr: function(g, x, y, k){
            if(k !== "down" || g.pause > 0) return; var r = scanRect(g), px = x * g.W - r.x0, py = y * g.H - r.y0; if(px < 0 || py < 0 || px >= r.cs * r.n || py >= r.cs * r.n) return;
            var i = Math.floor(py / r.cs) * r.n + Math.floor(px / r.cs); g.cur = i; M.scan.answer(g, i);
        },
        draw: function(g, c, W, H){
            var r = scanRect(g), i; c.fillStyle = "rgba(8,5,38,.55)"; rr(c, r.x0 - 10, r.y0 - 10, r.cs * r.n + 20, r.cs * r.n + 20, 20); c.fill();
            for(i = 0; i < r.n * r.n; i++){
                var cx = r.x0 + (i % r.n) * r.cs, cy = r.y0 + ((i / r.n) | 0) * r.cs, sel = g.cur === i;
                if(g.mark && g.mark.i === i){ c.fillStyle = g.mark.ok ? "rgba(110,255,160,.5)" : "rgba(255,95,138,.5)"; c.fillRect(cx + 2, cy + 2, r.cs - 4, r.cs - 4); }
                if(g.mark && !g.mark.ok && i === g.oi){ c.fillStyle = "rgba(255,225,74,.45)"; c.fillRect(cx + 2, cy + 2, r.cs - 4, r.cs - 4); }
                if(sel){ c.strokeStyle = "#ffe14a"; c.lineWidth = 3; c.strokeRect(cx + 3, cy + 3, r.cs - 6, r.cs - 6); }
                tx(c, i === g.oi ? g.odd : g.base, cx + r.cs / 2, cy + r.cs / 2 + 2, r.cs * .62);
            }
            c.fillStyle = "rgba(255,255,255,.2)"; c.fillRect(W / 2 - 100, H * .1, 200, 6); c.fillStyle = "#37e0ff"; c.fillRect(W / 2 - 100, H * .1, 200 * clamp(1 - g.qT / g.tlim, 0, 1), 6);
            hudBar(c, g, W, H, g.qi / g.rounds, "");
        }};
})(typeof window !== "undefined" ? window : globalThis);
