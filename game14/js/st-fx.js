"use strict";
/* 人気者になろう：背景の 演出（エリアごとの ステージ）。スポットライト・レーザー・観客の サイリウム・花火・紙吹雪。
   重い端末は 自動で 軽くする。動きを へらす設定の ときは 静止画。虫は 出さない。 */
(function(){
    var FX = window.STFX = {};
    var cv, c, W = 0, H = 0, DPR = 1, scene = "home", sc = null, q = 1, running = false, raf = 0, last = 0, T = 0, slow = 0, nfr = 0, flashA = 0, flashC = "#fff", still = false;
    var parts = [], rockets = [], stars = [], bokeh = [], crowd = [], rnd = Math.random;
    try{ still = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }catch(_e){}
    var SC = {
        title:  {top: "#150a45", bot: "#ff3ea5", acc: ["#ff3ea5", "#37e0ff", "#ffd24a"], stars: 1, bokeh: 1, beams: 3, lasers: 1, grid: 1, fw: .1},
        home:   {top: "#120b3d", bot: "#5a2d9c", acc: ["#b78bff", "#37e0ff", "#ff7ac6"], stars: 1, bokeh: 1, beams: 2},
        town:   {top: "#2a1b5e", bot: "#ff8fb8", acc: ["#ffd2e6", "#fff1a8", "#8fe3ff"], stars: .5, bokeh: 1, beams: 1, crowd: .3},
        school: {top: "#1d3b8a", bot: "#ffd27a", acc: ["#fff1a8", "#8fe3ff", "#ff9ec7"], bokeh: 1, beams: 2, crowd: .6},
        arcade: {top: "#3a0f5e", bot: "#ff6a3d", acc: ["#ffb347", "#ff5f8a", "#ffe14a"], bokeh: 1, beams: 2, crowd: .7, grid: 1},
        game:   {top: "#050d33", bot: "#00bcd4", acc: ["#00e5ff", "#ff3ea5", "#9dff6a"], stars: 1, bokeh: 1, lasers: 2, grid: 1},
        izakaya:{top: "#2a0a0c", bot: "#ff9a3d", acc: ["#ffb347", "#ff7a59", "#ffe0a3"], bokeh: 1, crowd: .4, beams: 1},
        pachi:  {top: "#1d0030", bot: "#ff2fb4", acc: ["#ff2fb4", "#37e0ff", "#ffe14a"], stars: 1, bokeh: 1, beams: 2, lasers: 2, balls: 1},
        studio: {top: "#0d1038", bot: "#7a5cff", acc: ["#7a5cff", "#37e0ff", "#ff7ac6"], beams: 4, lasers: 1, crowd: .5},
        beach:  {top: "#ff7a59", bot: "#2ac3ff", acc: ["#ffe14a", "#ff8fb8", "#8fe3ff"], sun: 1, fw: .25, crowd: .8, waves: 1},
        arena:  {top: "#090826", bot: "#ff3ea5", acc: ["#ff3ea5", "#37e0ff", "#ffe14a"], stars: 1, beams: 4, lasers: 3, crowd: 1, fw: .1},
        world:  {top: "#04021a", bot: "#ffd24a", acc: ["#ffd24a", "#ff3ea5", "#37e0ff"], stars: 1, beams: 4, lasers: 3, crowd: 1, fw: .3},
        result: {top: "#150a45", bot: "#ff7ac6", acc: ["#ffe14a", "#37e0ff", "#ff7ac6"], stars: 1, bokeh: 1, beams: 3, fw: .1},
        end:    {top: "#07031f", bot: "#ff3ea5", acc: ["#ffe14a", "#ff3ea5", "#37e0ff"], stars: 1, beams: 4, lasers: 2, crowd: .8, fw: .5}
    };
    FX.scenes = SC;
    function hex(h){ h = h.replace("#", ""); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
    function mix(a, b, t){ var A = hex(a), B = hex(b); return "rgb(" + Math.round(A[0] + (B[0] - A[0]) * t) + "," + Math.round(A[1] + (B[1] - A[1]) * t) + "," + Math.round(A[2] + (B[2] - A[2]) * t) + ")"; }
    function rgba(h, a){ var A = hex(h); return "rgba(" + A[0] + "," + A[1] + "," + A[2] + "," + a + ")"; }
    function R(a, b){ return a + (b - a) * rnd(); }
    var grad = null;

    FX.init = function(canvas){
        cv = canvas; c = cv.getContext("2d"); FX.resize();
        window.addEventListener("resize", FX.resize);
        document.addEventListener("visibilitychange", function(){ if(!document.hidden) { last = 0; } });
        FX.scene("title");
    };
    FX.quality = function(v){ if(v != null){ q = Math.max(.25, Math.min(1, v)); seed(); } return q; };
    FX.resize = function(){
        if(!cv) return; DPR = Math.min(window.devicePixelRatio || 1, 1.5); W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + "px"; cv.style.height = H + "px"; c.setTransform(DPR, 0, 0, DPR, 0, 0);
        seed(); if(still || !running) draw(0);
    };
    function seed(){
        if(!sc) return; grad = null;
        var n = Math.round((sc.stars ? 70 : 0) * q * Math.min(1.6, W / 700 + .4) * sc.stars); stars = []; for(var i = 0; i < n; i++) stars.push({x: rnd(), y: rnd() * .7, r: R(.5, 1.7), p: rnd() * 6.3, s: R(.6, 2.2)});
        var nb = sc.bokeh ? Math.round(16 * q) : 0; bokeh = []; for(i = 0; i < nb; i++) bokeh.push({x: rnd(), y: rnd(), r: R(14, 56), a: R(.05, .16), vx: R(-.01, .01), vy: R(-.02, .01), c: sc.acc[i % sc.acc.length], fall: sc.balls ? 1 : 0});
        var rows = sc.crowd ? 2 : 0, per = Math.max(6, Math.round(W / 38 * sc.crowd * (.5 + .5 * q))); crowd = [];
        for(var r = 0; r < rows; r++) for(i = 0; i < per; i++) crowd.push({x: (i + R(.1, .9)) / per, row: r, h: R(.85, 1.15), ph: rnd() * 6.3, arm: rnd() < (r ? .4 : .55), col: sc.acc[Math.floor(rnd() * sc.acc.length)]});
    }
    FX.scene = function(name){
        if(!SC[name]) name = "home"; scene = name; sc = SC[name]; grad = null; seed();
        if(!running && !still) FX.start(); if(still) draw(0);
    };
    FX.start = function(){ if(running || still) return; running = true; last = 0; raf = requestAnimationFrame(loop); };
    FX.stop = function(){ running = false; cancelAnimationFrame(raf); };
    FX.confetti = function(n, cols){
        if(still) return; n = Math.round((n || 80) * q); cols = cols || (sc ? sc.acc.concat(["#ffffff", "#ff7ac6", "#9dff6a"]) : ["#fff"]);
        for(var i = 0; i < n && parts.length < 520; i++) parts.push({k: "conf", x: R(0, W), y: R(-H * .3, -10), vx: R(-40, 40), vy: R(110, 300) , w: R(5, 11), h: R(3, 7), rot: rnd() * 6.3, vr: R(-7, 7), c: cols[Math.floor(rnd() * cols.length)], life: 99, sw: rnd() * 6.3});
    };
    FX.fireworks = function(n, cols){
        if(still) return; n = Math.max(1, n || 3); for(var i = 0; i < n; i++) (function(d){ setTimeout(function(){ rocket(cols); }, d); })(i * R(260, 520));
    };
    function rocket(cols){ if(!sc || rockets.length > 6) return; rockets.push({x: R(W * .12, W * .88), y: H, ty: R(H * .12, H * .5), vy: -R(520, 760), c: (cols || sc.acc)[Math.floor(rnd() * (cols || sc.acc).length)] }); }
    function burst(x, y, col){
        var n = Math.round(30 * q) + 6, hs = [col, "#ffffff", sc ? sc.acc[Math.floor(rnd() * sc.acc.length)] : col];
        for(var i = 0; i < n && parts.length < 560; i++){ var a = rnd() * 6.283, s = R(60, 260) * (rnd() < .3 ? .5 : 1); parts.push({k: "spark", x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: hs[i % 3], life: R(.9, 1.5), age: 0, r: R(1.5, 2.8)}); }
    }
    FX.flash = function(col, a){ flashC = col || "#fff"; flashA = a == null ? .6 : a; if(still) flashA = 0; };

    function loop(ts){
        if(!running) return; raf = requestAnimationFrame(loop);
        if(!last){ last = ts; return; } var dt = Math.min(.05, (ts - last) / 1000); last = ts;
        // 自動で 軽くする：重いフレームが つづいたら 品質を さげる
        nfr++; if(dt > .034) slow++; if(nfr >= 45){ if(slow > 16 && q > .3){ q = Math.max(.3, q * .7); seed(); } nfr = 0; slow = 0; }
        T += dt; draw(dt);
    }
    function draw(dt){
        if(!c || !sc) return;
        if(!grad){ grad = c.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, sc.top); grad.addColorStop(.58, mix(sc.top, sc.bot, .38)); grad.addColorStop(1, sc.bot); }
        c.globalCompositeOperation = "source-over"; c.globalAlpha = 1; c.fillStyle = grad; c.fillRect(0, 0, W, H);
        var i, s, t = T;
        // 星
        for(i = 0; i < stars.length; i++){ s = stars[i]; c.globalAlpha = .35 + .5 * Math.abs(Math.sin(t * s.s + s.p)); c.fillStyle = "#fff"; c.fillRect(s.x * W, s.y * H, s.r, s.r); } c.globalAlpha = 1;
        // 太陽・海（ビーチ）
        if(sc.sun){ var sy = H * .56, sg = c.createRadialGradient(W * .5, sy, 0, W * .5, sy, H * .34); sg.addColorStop(0, "rgba(255,240,170,.95)"); sg.addColorStop(.25, "rgba(255,170,90,.55)"); sg.addColorStop(1, "rgba(255,120,90,0)"); c.fillStyle = sg; c.fillRect(0, 0, W, H);
            c.fillStyle = "#ffe9a0"; c.beginPath(); c.arc(W * .5, sy, H * .07, 0, 6.3); c.fill(); }
        if(sc.waves){ for(i = 0; i < 3; i++){ c.fillStyle = "rgba(20,70,160," + (.25 + i * .12) + ")"; c.beginPath(); c.moveTo(0, H); for(var x = 0; x <= W; x += 24) c.lineTo(x, H * (.66 + i * .05) + Math.sin(x * .02 + t * (1 + i * .4) + i) * 6); c.lineTo(W, H); c.closePath(); c.fill(); } }
        // グリッド床
        if(sc.grid){ var hy = H * .62; c.strokeStyle = rgba(sc.acc[0], .28); c.lineWidth = 1; c.beginPath();
            for(i = -10; i <= 10; i++){ c.moveTo(W * .5 + i * 18, hy); c.lineTo(W * .5 + i * W * .16, H); }
            var off = (t * .35) % 1; for(i = 0; i < 9; i++){ var k = (i + off) / 9, y = hy + (H - hy) * k * k; c.moveTo(0, y); c.lineTo(W, y); } c.stroke(); }
        // ボケ
        c.globalCompositeOperation = "lighter";
        for(i = 0; i < bokeh.length; i++){ s = bokeh[i]; if(dt){ s.x += s.vx * dt; s.y += (s.fall ? .08 : s.vy) * dt; if(s.x < -.1) s.x = 1.1; if(s.x > 1.1) s.x = -.1; if(s.y < -.1) s.y = 1.1; if(s.y > 1.1) s.y = -.1; }
            var bg = c.createRadialGradient(s.x * W, s.y * H, 0, s.x * W, s.y * H, s.r); bg.addColorStop(0, rgba(s.c, s.a * 1.6)); bg.addColorStop(1, rgba(s.c, 0)); c.fillStyle = bg; c.fillRect(s.x * W - s.r, s.y * H - s.r, s.r * 2, s.r * 2); }
        // スポットライト
        var nb = sc.beams ? Math.max(1, Math.round(sc.beams * (q < .5 ? .5 : 1))) : 0;
        for(i = 0; i < nb; i++){ var bx = W * (i + .5) / nb, ang = Math.sin(t * (.5 + i * .13) + i * 1.7) * .42, len = H * 1.15, hw = Math.max(26, W * .045), col = sc.acc[i % sc.acc.length];
            var ex = bx + Math.tan(ang) * len, g2 = c.createLinearGradient(bx, 0, ex, len); g2.addColorStop(0, rgba(col, .34)); g2.addColorStop(.7, rgba(col, .08)); g2.addColorStop(1, rgba(col, 0));
            c.fillStyle = g2; c.beginPath(); c.moveTo(bx - 5, 0); c.lineTo(bx + 5, 0); c.lineTo(ex + hw, len); c.lineTo(ex - hw, len); c.closePath(); c.fill(); }
        // レーザー
        var nl = sc.lasers ? Math.max(1, Math.round(sc.lasers * (q < .5 ? .5 : 1))) : 0;
        for(i = 0; i < nl; i++){ var ox = W * (.2 + .3 * i), oy = H * .02, col2 = sc.acc[(i + 1) % sc.acc.length]; c.strokeStyle = rgba(col2, .5); c.lineWidth = 1.6; c.beginPath();
            for(var j = 0; j < 6; j++){ var a2 = Math.PI / 2 + Math.sin(t * .9 + i * 2 + j * .5) * .9 + (j - 2.5) * .12; c.moveTo(ox, oy); c.lineTo(ox + Math.cos(a2) * H * 1.4, oy + Math.sin(a2) * H * 1.4); } c.stroke(); }
        c.globalCompositeOperation = "source-over";
        // 観客
        if(crowd.length){
            for(i = 0; i < crowd.length; i++){ s = crowd[i]; var px = s.x * W, base = H + 4 - s.row * H * .028, hr = (s.row ? 11 : 15) * Math.min(1.6, Math.max(.7, H / 600)) * s.h, bob = Math.sin(t * 3 + s.ph) * 3 * (1 + s.row * .3);
                c.fillStyle = s.row ? "rgba(8,5,30,.82)" : "rgba(4,2,18,.96)";
                c.beginPath(); c.arc(px, base - hr * 2.6 + bob, hr, 0, 6.3); c.fill(); c.beginPath(); c.ellipse(px, base - hr * .6 + bob, hr * 1.5, hr * 1.9, 0, Math.PI, 0); c.fill(); c.fillRect(px - hr * 1.5, base - hr * .6 + bob, hr * 3, hr * 2);
                if(s.arm){ var sw = Math.sin(t * 3.4 + s.ph) * .5, ax = px + Math.sin(sw) * hr * 2.4 + hr * 1.2, ay = base - hr * 3 - Math.cos(sw) * hr * 2 + bob; c.strokeStyle = c.fillStyle; c.lineWidth = hr * .55; c.beginPath(); c.moveTo(px + hr * .9, base - hr * 1.7 + bob); c.lineTo(ax, ay); c.stroke();
                    c.globalCompositeOperation = "lighter"; c.strokeStyle = s.col; c.shadowColor = s.col; c.shadowBlur = q > .5 ? 12 : 0; c.lineWidth = hr * .45; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + Math.sin(sw) * hr * 1.2, ay - hr * 1.9); c.stroke(); c.shadowBlur = 0; c.globalCompositeOperation = "source-over"; } }
        }
        // 花火の ロケット
        if(dt){
            if(sc.fw && rnd() < sc.fw * dt * 2.2 * q) rocket();
            for(i = rockets.length - 1; i >= 0; i--){ s = rockets[i]; s.y += s.vy * dt; s.vy += 220 * dt; if(s.y <= s.ty || s.vy >= -40){ burst(s.x, s.y, s.c); rockets.splice(i, 1); } }
        }
        c.globalCompositeOperation = "lighter";
        for(i = 0; i < rockets.length; i++){ s = rockets[i]; c.fillStyle = s.c; c.fillRect(s.x - 1.5, s.y, 3, 14); }
        // 粒（紙吹雪・火花）
        for(i = parts.length - 1; i >= 0; i--){
            s = parts[i];
            if(dt){
                if(s.k === "spark"){ s.age += dt; s.vx *= 1 - dt * 1.6; s.vy = s.vy * (1 - dt * 1.6) + 150 * dt; s.x += s.vx * dt; s.y += s.vy * dt; if(s.age > s.life){ parts.splice(i, 1); continue; } }
                else { s.sw += dt * 3; s.x += (s.vx + Math.sin(s.sw) * 40) * dt; s.y += s.vy * dt; s.rot += s.vr * dt; if(s.y > H + 20){ parts.splice(i, 1); continue; } }
            }
            if(s.k === "spark"){ c.globalAlpha = Math.max(0, 1 - s.age / s.life); c.fillStyle = s.c; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.3); c.fill(); }
        }
        c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
        for(i = 0; i < parts.length; i++){ s = parts[i]; if(s.k !== "conf") continue; c.save(); c.translate(s.x, s.y); c.rotate(s.rot); c.fillStyle = s.c; c.globalAlpha = .9; c.fillRect(-s.w / 2, -s.h / 2, s.w, s.h * Math.abs(Math.cos(s.sw))); c.restore(); }
        c.globalAlpha = 1;
        if(flashA > .01){ c.fillStyle = flashC; c.globalAlpha = flashA; c.fillRect(0, 0, W, H); c.globalAlpha = 1; if(dt) flashA *= Math.pow(.02, dt); }
    }
    FX._state = function(){ return {scene: scene, q: q, parts: parts.length, rockets: rockets.length, running: running, still: still, W: W, H: H}; };
})();
