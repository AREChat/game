"use strict";
/* 人気者になろう：ミニゲームの 実行（描画ループ・入力・一時停止・結果）。虫は 出さない。 */
(function(){
    var ST = window.ST, GK = window.GK, FX = window.STFX, STU = window.STU, G = STU.G, $ = STU.$, t = STU.t, esc = STU.esc, fmt = STU.fmt;
    var cv = $("gc"), ctx = cv.getContext("2d"), dpr = 1, cw = 1, chh = 1, P = null;
    function resize(){ var r = $("playBox").getBoundingClientRect(); if(r.width < 2) return; dpr = Math.min(window.devicePixelRatio || 1, 2); cw = r.width; chh = r.height; cv.width = Math.round(cw * dpr); cv.height = Math.round(chh * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    window.addEventListener("resize", function(){ if(P) resize(); });
    window.addEventListener("orientationchange", function(){ setTimeout(function(){ if(P) resize(); }, 250); });

    function legendFor(type){
        var lanes = type === "rhythm" || type === "memory" || type === "mood" || type === "scan" || type === "karaoke" || type === "catch";
        var hint = {}; ["ja", "en", "zh", "ko"].forEach(function(l){ hint[l] = (ST.TX[l] && ST.TX[l]["ctl_" + type]) || ST.TX.ja["ctl_" + type]; });
        var rows = [{k: lanes ? "dpad" : "a", t: hint}];
        if(type === "mood" || type === "scan") rows.push({k: "a", t: STU.L4("confirmL")});
        rows.push({k: "plus", t: STU.L4("pauseL")});
        return rows;
    }
    // ---- 粒（UI側のエフェクト）----
    function addBurst(x, y, col, n){ if(!P) return; n = Math.min(n || 10, 40); for(var i = 0; i < n && P.parts.length < 260; i++){ var a = Math.random() * 6.283, s = 60 + Math.random() * 220; P.parts.push({x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, c: col || "#fff", life: .5 + Math.random() * .5, age: 0, r: 1.8 + Math.random() * 2.6}); } }
    function stepParts(dt){ for(var i = P.parts.length - 1; i >= 0; i--){ var p = P.parts[i]; p.age += dt; p.vx *= 1 - dt * 1.8; p.vy = p.vy * (1 - dt * 1.8) + 320 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if(p.age > p.life) P.parts.splice(i, 1); } }
    function drawParts(){ ctx.globalCompositeOperation = "lighter"; for(var i = 0; i < P.parts.length; i++){ var p = P.parts[i]; ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; }

    // ---- はじまり ----
    function begin(spec){
        var S = STU.cur(), m = ST.MG[spec.type], as = ST.assist(S, m.stat);
        var g = ST.newGame(spec.type, {d: spec.d, as: as, seed: ((Math.random() * 4e9) >>> 0) || 5, short: !!spec.short, cfg: Object.assign({}, spec.cfg || {}, {name: spec.name}), em: spec.em});
        g.hk = {sfx: function(n, a){ try{ GK.sfx(n, a); }catch(_e){} }, burst: addBurst, shake: function(){ document.body.classList.add("shake"); setTimeout(function(){ document.body.classList.remove("shake"); }, 300); }, vib: function(ms){ try{ GK.vibrate(ms); }catch(_e){} }};
        if(P && P.raf) cancelAnimationFrame(P.raf);
        P = {g: g, spec: spec, parts: [], last: 0, T: 0, raf: 0, done: false, down: {}};
        G.paused = false; STU.playScene = spec.scene;
        STU.show("play"); resize();
        $("playName").textContent = spec.name; $("playHint").textContent = ST.tx("ctl_" + spec.type) + (S.cond < 25 ? "　／　" + ST.tx("cond0") : ""); $("playHint").style.display = spec.type === "pachi" ? "none" : "";
        if(window.GKI){ GKI.mode("keys"); GKI.legend(legendFor(spec.type)); }
        try{ GK.bgm("tense"); GK.sfx("charge"); }catch(_e){}
        P.raf = requestAnimationFrame(loop);
    }
    STU.startChal = function(ch, opt){
        opt = opt || {}; var S = STU.cur(), ar = ST.AREAMAP[ch.area];
        if(!opt.daily){ if(S.ap <= 0) return STU.toast(t("needAp")); if(!ST.areaOpen(S, ar)) return STU.toast(t("locked", {r: ST.t(ST.RANKS[ar.rk].n)})); }
        begin({kind: opt.daily ? "daily" : "chal", ch: ch, type: ch.type, d: ST.chDiff(ch), cfg: ch.cfg, name: STU.X(ch.n, S), scene: ch.area, em: ar.em, short: false});
    };
    STU.startTrain = function(tr){
        var S = STU.cur(); if(S.ap <= 0) return STU.toast(t("needAp"));
        begin({kind: "train", tr: tr, type: tr.type, d: ST.clamp(.2 + S.st[tr.stat] / 150, .2, .85), cfg: {}, name: tr.em + " " + ST.t(tr.n), scene: "home", em: tr.em, short: true});
    };
    // ---- ループ ----
    function loop(ts){
        if(!P) return; P.raf = requestAnimationFrame(loop);
        var dt = Math.min(.05, (ts - (P.last || ts)) / 1000); P.last = ts; var g = P.g;
        if(G.paused && !$("mMenu").classList.contains("on") && !$("mInfo").classList.contains("on")){ G.paused = false; }   // Esc で ポーズ画面が とじた
        if(!G.paused){ ST.stepGame(g, dt); stepParts(dt); P.T += dt; }
        ctx.clearRect(0, 0, cw, chh); ST.drawGame(g, ctx, cw, chh, P.T); drawParts();
        if(g.state === "end"){
            var k = Math.min(1, g.endT / .35), good = g.pct >= 50; ctx.globalAlpha = k; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = "900 " + Math.round(Math.min(96, cw / 7) * (1.25 - .25 * k)) + "px 'Hiragino Maru Gothic ProN','Yu Gothic','Noto Sans JP','Noto Sans SC','Noto Sans KR',system-ui,sans-serif"; ctx.shadowColor = good ? "#ff3ea5" : "#37e0ff"; ctx.shadowBlur = 30; ctx.fillStyle = good ? "#ffe14a" : "#d6dcff";
            ctx.fillText(good ? ST.tx("clear") : ST.tx("timeUp"), cw / 2, chh * .45); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
        if(g.state === "end" && !P.done && g.endT > (window.__stFast ? .05 : 1.25)){ P.done = true; cancelAnimationFrame(P.raf); P.raf = 0; finishPlay(); }
    }
    // ---- 入力 ----
    function send(e, kind){ if(!P) return; var r = cv.getBoundingClientRect(); ST.gamePtr(P.g, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, kind); }
    cv.addEventListener("pointerdown", function(e){ if(!P || G.paused) return; e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_e){} P.down[e.pointerId] = 1; send(e, "down"); });
    cv.addEventListener("pointermove", function(e){ if(!P || G.paused) return; if(e.pointerType === "mouse" || P.down[e.pointerId]) send(e, "move"); });
    function up(e){ if(!P || !P.down[e.pointerId]) return; delete P.down[e.pointerId]; send(e, "up"); }
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up);
    cv.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    if(window.GKI) GKI.on(function(act, down){
        if(!P || G.scr !== "play" || G.paused) return;
        if(act === "plus"){ if(down) pause(); return; }
        ST.gameAct(P.g, act, down);
    });
    // ---- 一時停止 ----
    function pause(){
        if(!P || G.scr !== "play" || G.paused || P.g.state === "end") return; G.paused = true; P.last = 0; STU.pausedAt = performance.now();
        $("menuBox").innerHTML = '<h3>' + esc(t("pause")) + '</h3><div class="row" style="flex-direction:column"><button type="button" id="pzResume" class="big" data-pad-first="1">' + esc(t("resume")) + '</button><button type="button" data-gki-settings>' + esc(t("ctlBtn")) + '</button><button type="button" id="pzQuit">' + esc(t("quit")) + '</button></div>';
        STU.open("mMenu");
        $("pzResume").onclick = function(){ STU.close("mMenu"); G.paused = false; if(P) P.last = 0; };
        $("pzQuit").onclick = function(){
            $("infoBox").innerHTML = '<h3>' + esc(t("quit")) + '</h3><p>' + esc(t("quitQ")) + '</p><div class="row"><button type="button" id="qNo" data-pad-first="1">' + esc(t("no")) + '</button><button type="button" id="qYes" class="pink">' + esc(t("yes")) + '</button></div>';
            STU.open("mInfo"); $("qNo").onclick = function(){ STU.close("mInfo"); };
            $("qYes").onclick = function(){ STU.close("mInfo"); STU.close("mMenu"); quit(); };
        };
    }
    STU.pause = pause;
    function quit(){
        if(P && P.raf) cancelAnimationFrame(P.raf); var sp = P && P.spec; P = null; G.paused = false;
        if(sp && sp.kind === "daily"){ G.daily = false; STU.show("title"); } else STU.show(G.back || "home");
    }
    document.addEventListener("visibilitychange", function(){ if(document.hidden) pause(); });
    window.addEventListener("blur", function(){ pause(); });
    $("bPause").onclick = pause;

    // ---- けっか ----
    function today(){ return GK.daySeed(); }
    function yesterday(){ var d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    function finishPlay(){
        var g = P.g, sp = P.spec, S = STU.cur(), pct = Math.round(g.pct), res = null, lines = [], stars = ST.starsOf(pct), name = sp.name;
        function line(txt, cls){ lines.push('<div class="rl' + (cls ? " " + cls : "") + '"><span>' + txt + '</span></div>'); }
        if(sp.kind === "chal"){
            var before = S.best[sp.ch.id] || 0;
            res = ST.applyChallenge(S, sp.ch, pct, {coinsDelta: g.coinsDelta || 0, pachi: sp.ch.type === "pachi"}); STU.persist(); stars = res.stars;
            line("👥 " + esc(t("fansGain", {n: fmt(res.fans)})) + (res.first ? " ／ " + esc(t("firstClear")) : "")); line("🪙 " + esc(t("coinsGain", {n: (res.coins >= 0 ? "+" : "") + fmt(res.coins)})));
            if(sp.ch.type === "pachi") line("🎰 " + esc(t("coinsGain", {n: (g.coinsDelta >= 0 ? "+" : "") + fmt(g.coinsDelta || 0)})) + " ／ " + esc(ST.tx("warnPachi")));
            if(S.streak >= 2) line("🔥 " + esc(t("streak", {n: S.streak})));
            if(pct > before && before > 0) line("✦ " + esc(t("best", {n: pct})));
            (res.rankUp || []).forEach(function(i){ line("🎉 " + esc(t("rankUp")) + "：" + ST.RANKS[i].em + " " + esc(ST.t(ST.RANKS[i].n)), "up"); });
            (res.newAreas || []).forEach(function(a){ line("🗺️ " + esc(t("newArea")) + "：" + a.em + " " + esc(ST.t(a.n)), "up"); });
        } else if(sp.kind === "train"){
            res = ST.applyTrain(S, sp.tr, pct); STU.persist(); var st = ST.STATMAP[sp.tr.stat];
            line(st.em + " " + esc(t("trainRes", {s: ST.t(st.n), a: res.now - res.gain, b: res.now})));
        } else {
            var rw = ST.reward(S, sp.ch, pct, true); res = rw; stars = rw.stars;
            var st0 = GK.save("st"), rec = st0.get("daily", null), isDone = rec && rec.date === today();
            line("👥 " + esc(t("dailyFans", {n: fmt(rw.fans)})));
            if(isDone) line(esc(t("dailyPractice")));
            else {
                var sd = st0.get("dailyStreak", 0), last = rec && rec.date === yesterday() ? sd : 0; st0.set("dailyStreak", last + 1);
                st0.set("daily", {date: today(), pct: pct, stars: stars, fans: rw.fans, ch: sp.ch.id}); var starsMap = st0.get("stars", {}); starsMap[sp.ch.id] = Math.max(starsMap[sp.ch.id] || 0, stars); st0.set("stars", starsMap);
                line("📅 " + esc(t("dailyStreak", {n: last + 1})), "up");
            }
        }
        if(sp.kind === "chal"){ var sm = GK.save("st"), mp = sm.get("stars", {}); if((mp[sp.ch.id] || 0) < stars){ mp[sp.ch.id] = stars; sm.set("stars", mp); } }
        $("resName").textContent = name; $("resPct").textContent = t("scoreLine", {n: pct});
        $("resStars").innerHTML = [0, 1, 2].map(function(k){ return '<span class="' + (k < stars ? "" : "off") + '" style="animation-delay:' + (.25 + k * .28) + 's">★</span>'; }).join("");
        $("resTitle").textContent = stars >= 3 ? t("res3") : stars === 2 ? t("res2") : stars === 1 ? t("res1") : t("resFail");
        $("resLines").innerHTML = lines.join("");
        STU.show("result");
        try{
            if(stars >= 2){ GK.sfx("win"); FX.confetti(stars >= 3 ? 150 : 70); if(stars >= 3){ FX.fireworks(3); FX.flash("#ffe9a0", .4); } } else if(stars === 1) GK.sfx("ok"); else GK.sfx("lose");
        }catch(_e){}
        $("bResOk").onclick = function(){
            var r = res, sk = sp.kind; P = null;
            if(sk === "daily"){ G.daily = false; STU.show("title"); return; }
            STU.afterAction(sk === "chal" ? r : null);
        };
    }
    window.__st = window.__st || {}; window.__st.play = function(){ return P; }; window.__st.begin = begin;
})();
