"use strict";
// ===== ループ・ラボ：画面・入力・描画 =====
(function(){
    var Sim = window.G10Sim, LEVELS = window.G10_LEVELS, $ = function(id){ return document.getElementById(id); };
    var PKEY = "g10_prog_v1", COL = {a: "#ff9a3c", b: "#3cc6ff", c: "#ff5fa8", d: "#8be04a"}, GCOL = ["#7fd3ff", "#ffb3e6", "#b8ff9a", "#ffe08a", "#c9b3ff", "#9af0d8", "#ffc27f"];
    var prog = {}; try{ prog = JSON.parse(localStorage.getItem(PKEY) || "{}") || {}; }catch(_e){}
    function saveProg(){ try{ localStorage.setItem(PKEY, JSON.stringify(prog)); }catch(_e){} }

    // ---------- 音 ----------
    var actx = null;
    function beep(f, d, type, v){ try{ if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); var o = actx.createOscillator(), g = actx.createGain(); o.type = type || "sine"; o.frequency.value = f; g.gain.value = v == null ? .12 : v; o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d); o.stop(actx.currentTime + d); }catch(_e){} }
    var sfx = {move: function(){ beep(330, .05, "triangle", .08); }, bump: function(){ beep(110, .08, "square", .06); }, plate: function(){ beep(660, .12, "sine", .14); setTimeout(function(){ beep(880, .12, "sine", .12); }, 70); }, door: function(){ beep(520, .18, "triangle", .12); },
        loop: function(){ beep(880, .08, "sawtooth", .1); setTimeout(function(){ beep(660, .08, "sawtooth", .1); }, 80); setTimeout(function(){ beep(440, .14, "sawtooth", .1); }, 160); },
        clear: function(){ [523, 659, 784, 1047].forEach(function(f, i){ setTimeout(function(){ beep(f, .22, "triangle", .16); }, i * 110); }); }, fail: function(){ beep(180, .3, "sawtooth", .12); }};

    // ---------- 画面 ----------
    var scr = {title: $("s-title"), how: $("s-how"), sel: $("s-sel"), play: $("s-play")};
    function show(k){ Object.keys(scr).forEach(function(n){ scr[n].classList.toggle("on", n === k); }); where = k; document.body.classList.toggle("g10play", k === "play"); if(window.GKI) GKI.mode(k === "play" ? "keys" : "menu"); if(k === "play") setTimeout(resize, 30); }
    var where = "title";
    function paintLevels(){
        $("levels").innerHTML = LEVELS.map(function(lv, i){
            var open = i === 0 || prog[i - 1] != null || prog[i] != null, st = prog[i] || 0;
            return '<button type="button" class="lv' + (open ? "" : " locked") + '" data-i="' + i + '"' + (open ? "" : " disabled") + '><b>' + (i + 1) + '</b><small>' + (open ? lv.name : "🔒") + '</small><span class="st">' + (st ? "★".repeat(st) + "☆".repeat(3 - st) : (open ? "☆☆☆" : "")) + '</span></button>';
        }).join("");
    }
    $("bPlay").onclick = function(){ paintLevels(); show("sel"); };
    $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = function(){ show("title"); };
    $("bSelBack").onclick = function(){ show("title"); };
    $("levels").addEventListener("click", function(e){ var b = e.target.closest("[data-i]"); if(b && !b.disabled) start(Number(b.dataset.i)); });
    $("exitBtn").onclick = function(){
        if(where === "play"){ paintLevels(); show("sel"); return; }
        if(where === "sel" || where === "how"){ show("title"); return; }
        try{ var back = new URLSearchParams(location.search).get("back"); location.href = "../index.html" + (back ? "?back=" + encodeURIComponent(back) : ""); }catch(_e){ history.back(); }
    };

    // ---------- ゲーム ----------
    var cv = $("cv"), ctx = cv.getContext("2d"), G = null, S = null, W = 0, H = 0, ts = 30, ox = 0, oy = 0, dpr = 1;
    // S: {idx, g, lv, ghosts:[path], run, stepsLeft, max, won, hint, vis:{me:[x,y], gh:[[x,y]]}, face, fx:[], t0}
    function start(i){
        var lv = LEVELS[i], g = Sim.parse(lv);
        S = {idx: i, g: g, lv: lv, ghosts: [], run: Sim.newRun(g), stepsLeft: lv.steps, max: lv.par + 1, won: false, hint: null, vis: {me: g.S.slice(), gh: []}, face: "R", fx: [], prevOpen: null, shake: 0};
        S.prevOpen = openNow(); $("clear").hidden = true; show("play"); paintHud(); toast(lv.hint, 5200); resize();
    }
    function openNow(){ return Sim.openState(S.g, S.ghosts.map(function(p){ return p; }), S.run.me, S.run.t); }
    function paintHud(){
        $("lvName").textContent = "Lv." + (S.idx + 1) + "  " + S.lv.name;
        $("gInfo").textContent = "ぶんしん " + S.ghosts.length + "/" + S.max;
        var sl = S.stepsLeft; $("sInfo").textContent = "のこり " + sl + "歩"; $("sInfo").classList.toggle("low", sl <= 5);
        $("bLoop").disabled = S.won || S.ghosts.length >= S.max;
    }
    var toastT = 0;
    function toast(t, ms){ var e = $("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function(){ e.classList.remove("on"); }, ms || 2000); }
    function doStep(dir){
        if(!S || S.won || where !== "play" || !$("clear").hidden) return;
        if(S.stepsLeft <= 0){ toast("歩数が ない！ ⏪ ぶんしんを つくる か、↺ やりなおそう", 2200); sfx.fail(); return; }
        var before = S.run.me.slice(), r = Sim.step(S.g, S.ghosts, S.run, dir);
        S.stepsLeft--; if(dir && dir !== "W") S.face = dir;
        if(dir && !r.moved){ S.shake = 6; sfx.bump(); } else if(r.moved) sfx.move();
        var now = openNow(); Object.keys(now).forEach(function(k){ var p = S.prevOpen[k]; if(p && now[k].on > p.on) sfx.plate(); if(p && now[k].open !== p.open){ sfx.door(); burst(S.g.doors[k][0], COL[k.toLowerCase()]); } }); S.prevOpen = now;
        S.hint = null; paintHud();
        if(r.win){ win(); return; }
        if(S.stepsLeft <= 0) toast("歩数が なくなった！ ⏪ ぶんしんを つくるか、↺ やりなおそう", 2600);
    }
    function newLoop(){
        if(!S || S.won) return;
        if(S.run.t === 0){ toast("すこし 動いてから 押してね", 1600); return; }
        if(S.ghosts.length >= S.max){ toast("ぶんしんは もう つくれません。🔄 ぜんぶ やりなおそう", 2400); sfx.fail(); return; }
        S.ghosts.push(S.run.path.slice()); burst(S.run.me, GCOL[(S.ghosts.length - 1) % GCOL.length]); S.run = Sim.newRun(S.g); S.stepsLeft = S.lv.steps; S.hint = null; S.face = "R";
        S.vis.me = S.g.S.slice(); S.vis.gh = S.ghosts.map(function(p){ return p[0].slice(); }); S.prevOpen = openNow(); sfx.loop(); paintHud(); toast("ぶんしん " + S.ghosts.length + "人目！ スタートから もういちど", 1800);
    }
    function retryLoop(){ if(!S || S.won) return; S.run = Sim.newRun(S.g); S.stepsLeft = S.lv.steps; S.vis.me = S.g.S.slice(); S.vis.gh = S.ghosts.map(function(p){ return p[0].slice(); }); S.hint = null; S.prevOpen = openNow(); paintHud(); toast("このループを やりなおし", 1200); }
    function resetAll(){ if(!S) return; var i = S.idx; start(i); toast("ぜんぶ やりなおし", 1200); }
    function win(){
        S.won = true; sfx.clear();
        var n = S.ghosts.length, stars = n <= S.lv.par ? 3 : n <= S.lv.par + 1 ? 2 : 1;
        var first = prog[S.idx] == null; prog[S.idx] = Math.max(prog[S.idx] || 0, stars); saveProg();
        try{ if(window.AREFeaturePanel){ var tot = 0; Object.keys(prog).forEach(function(k){ tot += prog[k]; }); window.AREFeaturePanel.recordRun("game10", tot); } }catch(_e){}
        for(var k = 0; k < 40; k++) S.fx.push({x: S.g.E[0] + .5, y: S.g.E[1] + .5, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, life: 1, c: GCOL[k % GCOL.length]});
        setTimeout(function(){
            $("clT").textContent = S.idx === LEVELS.length - 1 ? "🎉 ぜんぶ クリア！" : "🎉 クリア！";
            $("clStars").innerHTML = [0, 1, 2].map(function(i){ return '<i class="' + (i < stars ? "on" : "") + '" style="animation-delay:' + (i * .18) + 's">★</i>'; }).join("");
            $("clB").textContent = "ぶんしん " + n + "人（お手本は " + S.lv.par + "人）" + (stars < 3 ? "　もっと すくなく できるかも？" : "　かんぺき！");
            $("clNext").hidden = S.idx >= LEVELS.length - 1; $("clear").hidden = false;
        }, 700);
    }
    $("clNext").onclick = function(){ start(S.idx + 1); };
    $("clRetry").onclick = function(){ start(S.idx); };
    $("clSel").onclick = function(){ $("clear").hidden = true; paintLevels(); show("sel"); };
    $("bLoop").onclick = newLoop; $("bRetry").onclick = retryLoop; $("bReset").onclick = resetAll; $("bWait").onclick = function(){ doStep(null); };
    $("bHint").onclick = function(){ hint(); };

    // ---------- ヒント：のこりの ぶんしんで 解ける 次の いちばん いい ボタンを さがす ----------
    function hint(){
        if(!S || S.won) return;
        var g = S.g, steps = S.lv.steps - 1, left = S.max - S.ghosts.length, ghosts = S.ghosts, all = [];
        Object.keys(g.plates).forEach(function(k){ g.plates[k].forEach(function(p){ all.push(p); }); });
        if(Sim.plan(g, ghosts, g.E, steps)){ S.hint = {kind: "exit"}; toast("いまの ぶんしんで 出口へ いけます！ スタートから 出口まで 歩こう", 3400); return; }
        var best = null;
        (function rec(gs, used, depth, first){
            if(best || depth > left) return;
            if(depth > 0 && Sim.plan(g, gs, g.E, steps)){ best = first; return; }
            if(depth === left) return;
            all.forEach(function(p){
                if(best || used[p.join(",")]) return; var path = Sim.plan(g, gs, p, steps); if(!path) return;
                var run = Sim.newRun(g); path.forEach(function(d){ Sim.step(g, gs, run, d); }); var u = Object.assign({}, used); u[p.join(",")] = 1;
                rec(gs.concat([run.path]), u, depth + 1, first || p);
            });
        })(ghosts, {}, 0, null);
        if(best){ S.hint = {kind: "plate", x: best[0], y: best[1]}; toast("つぎは 光っている ボタンの上に 立って ⏪ を押そう", 3600); }
        else toast("この ぶんしんでは むずかしそう… 🔄 ぜんぶ やりなおして みよう", 3200);
    }

    // ---------- 入力 ----------
    // キーボード・プロコンは 共通部品 GKI（そうさ設定で かえられる）。十字／スティック＝うごく（おしっぱなしで れんぞく）、A＝⏪ぶんしん、B＝まつ、Y＝このループを やりなおす、X＝ヒント、＋＝ステージえらび
    var DIRS = {up: "U", down: "D", left: "L", right: "R"}, rp = {};
    function stopRep(a){ if(rp[a]){ clearTimeout(rp[a].t); clearInterval(rp[a].i); rp[a] = null; } }
    if(window.GKI){
        GKI.defaults({a: ["Enter", "z"], b: [" ", "."], x: ["h"], y: ["r"], plus: ["Escape", "p"]});
        GKI.legend([{k: "dpad", t: {ja: "うごく（おしっぱなしで れんぞく）", en: "Move (hold to repeat)", zh: "移动（按住连续）", ko: "이동 (누르면 연속)"}},
            {k: "a", t: {ja: "⏪ ぶんしんを つくって やりなおす", en: "⏪ Make a clone and loop again", zh: "⏪ 生成分身并重来", ko: "⏪ 분신을 만들고 다시"}}, {k: "b", t: {ja: "その場で 1歩 まつ", en: "Wait one step", zh: "原地等一步", ko: "제자리에서 한 걸음 기다리기"}},
            {k: "y", t: {ja: "このループを やりなおす", en: "Retry this loop", zh: "重来本次循环", ko: "이번 루프 다시"}}, {k: "x", t: {ja: "ヒント", en: "Hint", zh: "提示", ko: "힌트"}}, {k: "plus", t: {ja: "ステージえらびへ", en: "Stage list", zh: "关卡列表", ko: "스테이지 목록"}}]);
        GKI.on(function(a, down){
            var d = DIRS[a];
            if(d){ stopRep(a); if(down && where === "play" && S){ doStep(d); rp[a] = {t: setTimeout(function(){ rp[a].i = setInterval(function(){ if(!GKI.held(a)){ stopRep(a); return; } if(where === "play" && S && $("clear").hidden) doStep(d); }, 130); }, 320)}; } return; }
            if(!down || where !== "play" || !S || !$("clear").hidden) return;
            if(a === "b") doStep(null); else if(a === "a") newLoop(); else if(a === "y") retryLoop(); else if(a === "x") hint(); else if(a === "plus"){ paintLevels(); show("sel"); }
        });
        GKI.onBack(function(){ if(where !== "title") $("exitBtn").click(); });
    }
    var rep = null;
    $("dpad").addEventListener("pointerdown", function(e){
        var b = e.target.closest("[data-d]"); if(!b) return; e.preventDefault(); var d = b.dataset.d; doStep(d); clearInterval(rep); var n = 0;
        rep = setInterval(function(){ if(++n > 2) doStep(d); }, 130);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function(t){ $("dpad").addEventListener(t, function(){ clearInterval(rep); }); });
    window.addEventListener("pointerup", function(){ clearInterval(rep); });

    // ---------- 描画 ----------
    function resize(){
        var r = $("stageWrap").getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(50, r.width); H = Math.max(50, r.height);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); layout();
    }
    function layout(){ if(!S) return; ts = Math.floor(Math.min((W - 16) / S.g.W, (H - 16) / S.g.H)); ts = Math.max(14, Math.min(64, ts)); ox = Math.round((W - ts * S.g.W) / 2); oy = Math.round((H - ts * S.g.H) / 2); }
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
    function burst(p, c){ for(var k = 0; k < 14; k++) S.fx.push({x: p[0] + .5, y: p[1] + .5, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: .8, c: c}); }
    function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function tx(x){ return ox + x * ts; } function ty(y){ return oy + y * ts; }
    function robot(cx, cy, color, face, alpha, label, bob){
        ctx.save(); ctx.globalAlpha = alpha; var r = ts * .36;
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(cx, cy + r * .95, r * .9, r * .3, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = color; rr(cx - r, cy - r + bob, r * 2, r * 2, r * .55); ctx.fill(); ctx.lineWidth = Math.max(1.5, ts * .06); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.stroke();
        var ex = {L: -.22, R: .22, U: 0, D: 0}[face] || 0, ey = {U: -.18, D: .12}[face] || 0;
        ctx.fillStyle = "#fff"; [-1, 1].forEach(function(s){ ctx.beginPath(); ctx.arc(cx + s * r * .38 + ex * r, cy - r * .1 + ey * r + bob, r * .24, 0, 6.3); ctx.fill(); });
        ctx.fillStyle = "#10204a"; [-1, 1].forEach(function(s){ ctx.beginPath(); ctx.arc(cx + s * r * .38 + ex * r * 1.5, cy - r * .1 + ey * r * 1.6 + bob, r * .11, 0, 6.3); ctx.fill(); });
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(cx, cy - r + bob); ctx.lineTo(cx, cy - r * 1.35 + bob); ctx.stroke(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy - r * 1.4 + bob, r * .14, 0, 6.3); ctx.fill();
        if(label){ ctx.fillStyle = "#10204a"; ctx.font = "bold " + Math.round(ts * .22) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, cx, cy + r * .62 + bob); }
        ctx.restore();
    }
    var last = 0;
    function frame(t){
        requestAnimationFrame(frame); var dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
        if(where !== "play" || !S) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        var g = S.g, time = t / 1000;
        // 見た目の位置を、ほんとうの位置へ なめらかに ちかづける
        var k = 1 - Math.pow(.0005, dt * 1.0), me = S.run.me; S.vis.me[0] += (me[0] - S.vis.me[0]) * k; S.vis.me[1] += (me[1] - S.vis.me[1]) * k;
        S.ghosts.forEach(function(p, i){ var q = Sim.ghostPos(p, S.run.t), v = S.vis.gh[i] || (S.vis.gh[i] = q.slice()); v[0] += (q[0] - v[0]) * k; v[1] += (q[1] - v[1]) * k; });
        var sx = S.shake > 0 ? (Math.random() - .5) * S.shake : 0; if(S.shake > 0) S.shake -= 40 * dt;
        ctx.save(); ctx.translate(sx, 0);
        var open = openNow();
        // ゆか・かべ
        for(var y = 0; y < g.H; y++) for(var x = 0; x < g.W; x++){
            var c = g.cell[y * g.W + x], px = tx(x), py = ty(y);
            if(c === "#"){ ctx.fillStyle = "#4d5f9a"; rr(px + 1, py + 1, ts - 2, ts - 2, ts * .18); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.14)"; rr(px + 3, py + 3, ts - 6, ts * .3, ts * .12); ctx.fill(); continue; }
            ctx.fillStyle = (x + y) % 2 ? "#1a2c58" : "#1f3466"; ctx.fillRect(px, py, ts + .5, ts + .5);
        }
        // スタート・出口
        var s = g.S; ctx.strokeStyle = "rgba(120,180,255,.6)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); rr(tx(s[0]) + 4, ty(s[1]) + 4, ts - 8, ts - 8, 8); ctx.stroke(); ctx.setLineDash([]);
        var e = g.E, ecx = tx(e[0]) + ts / 2, ecy = ty(e[1]) + ts / 2;
        for(var q = 0; q < 3; q++){ ctx.strokeStyle = "rgba(90,255,170," + (.8 - q * .22) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ecx, ecy, ts * (.18 + q * .1 + Math.sin(time * 3 + q) * .02), ts * (.18 + q * .1), time * (1 + q * .5), 0, 6.3); ctx.stroke(); }
        // ボタン
        Object.keys(g.plates).forEach(function(kk){ g.plates[kk].forEach(function(p){
            var on = false, cx = tx(p[0]) + ts / 2, cy = ty(p[1]) + ts / 2;
            if(S.run.me[0] === p[0] && S.run.me[1] === p[1]) on = true; S.ghosts.forEach(function(gp){ var qq = Sim.ghostPos(gp, S.run.t); if(qq[0] === p[0] && qq[1] === p[1]) on = true; });
            ctx.fillStyle = on ? COL[kk] : "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(cx, cy, ts * .34, 0, 6.3); ctx.fill();
            ctx.strokeStyle = COL[kk]; ctx.lineWidth = Math.max(2, ts * .07); ctx.beginPath(); ctx.arc(cx, cy, ts * .34, 0, 6.3); ctx.stroke();
            ctx.fillStyle = on ? "#fff" : COL[kk]; ctx.beginPath(); ctx.arc(cx, cy, ts * (on ? .14 : .1), 0, 6.3); ctx.fill();
        }); });
        // トビラ
        Object.keys(g.doors).forEach(function(kk){ var st = open[kk]; g.doors[kk].forEach(function(p){
            var px = tx(p[0]), py = ty(p[1]), col = COL[kk.toLowerCase()];
            if(st.open){ ctx.globalAlpha = .45; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); rr(px + 3, py + 3, ts - 6, ts - 6, 6); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
            else{ ctx.fillStyle = col; rr(px + 2, py + 2, ts - 4, ts - 4, ts * .14); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.28)"; for(var i = 1; i < 4; i++) ctx.fillRect(px + 4, py + i * ts / 4 - 1, ts - 8, 2); }
            // ひつような ボタンの数（まるで あらわす）
            for(var j = 0; j < st.need; j++){ ctx.fillStyle = j < st.on ? "#fff" : "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.arc(px + ts / 2 + (j - (st.need - 1) / 2) * ts * .2, py + ts * .16, ts * .065, 0, 6.3); ctx.fill(); }
        }); });
        // ヒント
        if(S.hint && S.hint.kind === "plate"){ var hp = S.hint, rad = ts * (.45 + Math.sin(time * 6) * .06); ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(tx(hp.x) + ts / 2, ty(hp.y) + ts / 2, rad, 0, 6.3); ctx.stroke(); }
        if(S.hint && S.hint.kind === "exit"){ ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ecx, ecy, ts * (.5 + Math.sin(time * 6) * .06), 0, 6.3); ctx.stroke(); }
        // ぶんしん・じぶん
        S.ghosts.forEach(function(p, i){ var v = S.vis.gh[i] || p[0]; robot(tx(v[0]) + ts / 2, ty(v[1]) + ts / 2, GCOL[i % GCOL.length], "R", .6 + Math.sin(time * 3 + i) * .08, String(i + 1), Math.sin(time * 4 + i) * ts * .03); });
        robot(tx(S.vis.me[0]) + ts / 2, ty(S.vis.me[1]) + ts / 2, "#5aa0ff", S.face, 1, "", Math.sin(time * 5) * ts * .02);
        // こうか
        S.fx = S.fx.filter(function(f){ f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if(f.life <= 0) return false; ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(tx(f.x), ty(f.y), ts * .07, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; return true; });
        ctx.restore();
    }
    window.__g10 = {get S(){ return S; }, start: start, doStep: doStep, newLoop: newLoop, hint: hint, retryLoop: retryLoop};
    requestAnimationFrame(frame); resize();
})();
