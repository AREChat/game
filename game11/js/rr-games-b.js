"use strict";
/* ルール・ルーレット：マイクロゲーム ⑬〜㉔（きまりは rr-games-a.js と おなじ） */
(function(root){
    var RR = root.RR || require("./rr-core.js"); if(!RR.util) require("./rr-games-a.js");
    var N = RR.N, W = RR.W, H = RR.H, U = RR.util, E = U.E, bg = U.bg, cl = U.cl, dist = U.dist, hud = U.hud;

    // ⑬ バランス
    RR.add({id: "balance", em: "⚖️", time: 8, type: "survive", n: N("バランス！", "Balance", "保持平衡", "균형 잡기"), how: N("ゆびを よこに うごかして 板を かたむけ、ボールを おとさないで 8びょう！", "Tilt the board by moving your finger sideways. Keep the ball on for 8 seconds!", "左右移动手指倾斜木板，让球别掉下去，坚持8秒！", "손가락을 옆으로 움직여 판을 기울여요. 공을 8초 동안 떨어뜨리지 마세요!"),
        setup: function(R){ R.bx = 0; R.bv = (R.rnd() - .5) * 60; R.th = 0; R.pt = 1.1; R.half = 150 * Math.min(1.3, Math.max(.72, R.sz)); },
        update: function(R, dt, i){
            var want = cl((i.x - W / 2) / W * 2.4, -.5, .5); R.th += cl(want - R.th, -2.6 * dt, 2.6 * dt);
            R.bv += 700 * Math.sin(R.th) * dt; R.bv -= R.bv * .7 * dt;
            R.pt -= dt; if(R.pt <= 0){ R.bv += (R.rnd() < .5 ? -1 : 1) * (125 + R.lv * 12); R.pt = .9 + R.rnd() * .5; }
            R.bx += R.bv * dt;
            if(Math.abs(R.bx) > R.half){ R.lose("fall"); R.sfx("lose"); }
        },
        draw: function(R, c){ bg(c, "#2a2a6a", "#0e0e2c"); c.save(); c.translate(W / 2, 360); c.rotate(R.th); c.fillStyle = "#c98a4b"; c.fillRect(-R.half, -8, R.half * 2, 16); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(-R.half, -8, R.half * 2, 4); c.fillStyle = "#ff6b8a"; c.beginPath(); c.arc(R.bx, -26, 18, 0, 6.3); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(R.bx - 5, -31, 4, 0, 6.3); c.fill(); c.restore(); c.fillStyle = "#59e6d0"; c.beginPath(); c.moveTo(W / 2, 360); c.lineTo(W / 2 - 24, 420); c.lineTo(W / 2 + 24, 420); c.closePath(); c.fill(); hud(c, Math.ceil(R.left()) + "s"); },
        ai: function(R, i){ var d = -(1.5 * R.bx / 150 + 1.1 * R.bv / 160) * .5; i.x = W / 2 + cl(d, -.5, .5) / 2.4 * W; i.y = 300; }});

    // ⑭ ひを けせ！
    RR.add({id: "flame", em: "🔥", time: 9, type: "survive", n: N("ひを けせ！", "Put Out Fires", "灭火", "불을 꺼요"), how: N("おおきくなる ひを タップで けそう！ ひとつでも もえきったら アウト！ 9びょう まもれ！", "Tap the flames before they blaze up! Protect the place for 9 seconds!", "在火烧大之前点灭它！坚持9秒！", "커지는 불을 터치해서 꺼요! 9초 동안 지켜내요!"),
        setup: function(R){ R.fl = []; R.sp = .3; },
        update: function(R, dt, i){
            var k = 1 + R.lv * .12; R.sp -= dt; if(R.sp <= 0 && R.fl.length < 3){ R.fl.push({x: R.ri(60, 340), y: R.ri(130, 470), g: 0}); R.sp = 1.0 / k; }
            R.fl.forEach(function(f){ f.g += dt * k / 2.6; });
            for(var q = 0; q < R.fl.length; q++) if(R.fl[q].g >= 1){ R.lose("burn"); R.sfx("boom"); return; }
            if(i.tap){ for(var a = R.fl.length - 1; a >= 0; a--){ var f = R.fl[a]; if(dist(i.x, i.y, f.x, f.y) < (28 + f.g * 30) * R.sz + 10){ R.fl.splice(a, 1); R.fx(f.x, f.y, "#7ae6ff"); R.sfx("pop"); break; } } }
        },
        draw: function(R, c){ bg(c, "#2d1b3a", "#12091c"); R.fl.forEach(function(f){ var s = 28 + f.g * 40; E(c, "🔥", f.x, f.y, s * R.sz * 1.4); c.strokeStyle = "rgba(255,255,255," + (.25 + f.g * .5) + ")"; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, s * R.sz * .9 + 6, -1.57, -1.57 + 6.28 * f.g); c.stroke(); }); hud(c, Math.ceil(R.left()) + "s"); },
        ai: function(R, i){ var t = null; R.fl.forEach(function(f){ if(!t || f.g > t.g) t = f; }); if(t){ i.x = t.x; i.y = t.y; i.tap = true; } }});

    // ⑮ リズム
    RR.add({id: "rhythm", em: "🎵", time: 12, type: "goal", n: N("リズム タップ", "Rhythm Tap", "节奏点击", "리듬 터치"), how: N("おとが せんに かさなる しゅんかんに タップ！ 6かい あてよう！", "Tap just as a note hits the line! Land 6 hits!", "音符碰到线的瞬间点击！命中6次！", "음표가 선에 닿는 순간 터치! 6번 맞추기!"),
        setup: function(R){ R.notes = []; R.nt = .5; R.need = 6; R.miss = 0; R.spawned = 0; R.line = H - 130; },
        update: function(R, dt, i){
            R.nt -= dt; if(R.nt <= 0 && R.spawned < 12){ R.notes.push({y: -30}); R.spawned++; R.nt = .6; }
            R.notes.forEach(function(n){ n.y += 310 * dt; });
            for(var q = R.notes.length - 1; q >= 0; q--){ if(R.notes[q].y > R.line + 50){ R.notes.splice(q, 1); R.miss++; R.sfx("ng"); if(R.miss >= 3){ R.lose("miss"); return; } } }
            if(i.tap){ var best = -1, bd = 1e9; R.notes.forEach(function(n, k){ var d = Math.abs(n.y - R.line); if(d < bd){ bd = d; best = k; } }); if(best >= 0 && bd < 40 * R.sz + 8){ R.notes.splice(best, 1); R.score++; R.fx(W / 2, R.line, "#ffe36a"); R.sfx("coin"); if(R.score >= R.need) R.win(); } }
        },
        draw: function(R, c){ bg(c, "#1d1a4a", "#0a0820"); c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(W / 2 - 60, 0, 120, H); c.fillStyle = "#ffe36a"; c.fillRect(W / 2 - 80, R.line - 4, 160, 8); R.notes.forEach(function(n){ c.fillStyle = "#59e6d0"; c.beginPath(); c.arc(W / 2, n.y, 24, 0, 6.3); c.fill(); E(c, "🎵", W / 2, n.y, 26); }); hud(c, R.score + " / " + R.need + "   ✕" + R.miss + " / 3"); },
        ai: function(R, i){ R.notes.forEach(function(n){ if(Math.abs(n.y - R.line) < 9) i.tap = true; }); }});

    // ⑯ スライス！
    RR.add({id: "slice", em: "🔪", time: 11, type: "goal", n: N("きって きって！", "Slice It", "切切切", "싹둑싹둑"), how: N("ゆびを すべらせて フルーツを 6こ きろう！ 💣は きっちゃだめ！", "Swipe through 6 fruits! Don't slice the 💣!", "滑过6个水果！别切💣！", "손가락을 밀어 과일 6개 베기! 💣은 베면 안 돼요!"),
        setup: function(R){ R.it = []; R.sp = .2; R.need = 6; R.px = undefined; R.py = 0; R.lb = 0; },
        update: function(R, dt, i){
            var k = 1 + R.lv * .1; R.sp -= dt; if(R.sp <= 0){ var bomb = R.rnd() < .2 && !R.lb; R.lb = bomb ? 1 : 0; R.it.push({x: R.ri(70, 330), y: H + 30, vx: R.ri(-90, 90), vy: -R.ri(620, 700), bomb: bomb, e: bomb ? "💣" : R.pick(["🍉", "🍊", "🍎", "🍍", "🥝"])}); R.sp = .6 / k; }
            R.it.forEach(function(t){ t.vy += 820 * dt; t.x += t.vx * dt; t.y += t.vy * dt; });
            if(R.px === undefined){ R.px = i.x; R.py = i.y; }
            if(i.down){
                var sx = R.px, sy = R.py, ex = i.x, ey = i.y, len = Math.hypot(ex - sx, ey - sy);
                for(var q = R.it.length - 1; q >= 0; q--){ var t = R.it[q], r = 30 * R.sz + 8, d;
                    if(len > 260 || len < 1) d = dist(ex, ey, t.x, t.y); else { var u = cl(((t.x - sx) * (ex - sx) + (t.y - sy) * (ey - sy)) / (len * len), 0, 1); d = dist(sx + (ex - sx) * u, sy + (ey - sy) * u, t.x, t.y); }
                    if(d < r){ R.it.splice(q, 1); if(t.bomb){ R.lose("bomb"); R.fx(t.x, t.y, "#ff5d7a"); R.sfx("boom"); return; } R.score++; R.fx(t.x, t.y, "#ffe36a"); R.sfx("slash"); if(R.score >= R.need){ R.win(); return; } } }
            }
            R.px = i.x; R.py = i.y;
            R.it = R.it.filter(function(t){ return !(t.y > H + 50 && t.vy > 0); });
        },
        draw: function(R, c){ bg(c, "#3b2a1a", "#150d06"); R.it.forEach(function(t){ E(c, t.e, t.x, t.y, 56 * R.sz); }); if(R.px !== undefined){ c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 3; c.beginPath(); c.arc(R.px, R.py, 10, 0, 6.3); c.stroke(); } hud(c, R.score + " / " + R.need); },
        ai: function(R, i){
            var b = null; R.it.forEach(function(t){ if(t.bomb || t.y > H - 30 || t.y < 80) return; if(!b || t.y < b.y) b = t; });
            if(b){ var bombNear = R.it.some(function(t){ return t.bomb && dist(t.x, t.y, b.x, b.y) < 70 + 30 * R.sz; }); if(!bombNear){ i.x = b.x; i.y = b.y; i.down = true; return; } }
            i.x = R.px === undefined ? 200 : R.px; i.y = R.py === undefined ? 300 : R.py; i.down = false;
        }});

    // ⑰ ほしを さがせ
    RR.add({id: "star", em: "⭐", time: 12, type: "goal", n: N("ほしを さがせ！", "Find the Star", "找星星", "별을 찾아라"), how: N("ゆらゆら うごく かたちの なかから ⭐ を みつけて タップ！ 3かい！", "Find the ⭐ among the drifting shapes! 3 times!", "在飘动的图形中找到⭐并点击！3次！", "움직이는 도형 속 ⭐을 찾아 터치! 3번!"),
        setup: function(R){ R.need = 3; R.mk = function(R){ var n = 18 + Math.floor(Math.min(2, R.lv) * 5), es = ["🔶", "🔷", "🔸", "🔹", "🟣", "🟢", "🟠", "🔴"]; R.its = []; for(var k = 0; k < n; k++) R.its.push({x: R.ri(40, 360), y: R.ri(100, 500), vx: R.ri(-30, 30), vy: R.ri(-30, 30), e: R.pick(es), star: false}); R.its[R.ri(0, n - 1)].star = true; R.its.forEach(function(t){ if(t.star) t.e = "⭐"; }); R.fresh = R.t; }; R.mk(R); },
        update: function(R, dt, i){
            R.its.forEach(function(t){ t.x += t.vx * dt; t.y += t.vy * dt; if(t.x < 30 || t.x > W - 30) t.vx = -t.vx; if(t.y < 90 || t.y > H - 30) t.vy = -t.vy; });
            if(i.tap && R.t - R.fresh > .1){ var hit = null; R.its.forEach(function(t){ if(t.star && dist(i.x, i.y, t.x, t.y) < 26 * R.sz + 6) hit = t; }); if(!hit){ for(var k = R.its.length - 1; k >= 0; k--){ var t2 = R.its[k]; if(dist(i.x, i.y, t2.x, t2.y) < 26 * R.sz + 6){ hit = t2; break; } } } if(hit){ if(hit.star){ R.score++; R.sfx("ok"); R.fx(hit.x, hit.y, "#ffe36a"); if(R.score >= R.need) R.win(); else R.mk(R); } else { R.lose("wrong"); R.sfx("ng"); } } }
        },
        draw: function(R, c){ bg(c, "#2a1f5e", "#0f0a2a"); R.its.forEach(function(t){ if(!t.star) E(c, t.e, t.x, t.y, 44 * R.sz); }); R.its.forEach(function(t){ if(t.star) E(c, t.e, t.x, t.y, 48 * R.sz); }); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ if(R.t - R.fresh > .15){ var s = R.its.filter(function(t){ return t.star; })[0]; i.x = s.x; i.y = s.y; i.tap = true; } }});

    // ⑱ リール ストップ
    RR.add({id: "reel", em: "🎰", time: 12, type: "goal", n: N("リール ストップ", "Slot Stop", "老虎机", "슬롯 스톱"), how: N("うえの マークが まんなかに きたら タップ！ 3かい！", "Tap when the top symbol reaches the center! 3 times!", "上方的图案到达中间时点击！3次！", "위의 그림이 가운데 오면 터치! 3번!"),
        setup: function(R){ R.sy = ["🍒", "🍋", "🔔", "⭐", "7️⃣", "🍇"]; R.pos = R.rnd() * 6; R.need = 3; R.pick2 = function(R){ R.target = R.ri(0, 5); }; R.pick2(R); },
        update: function(R, dt, i){
            R.pos = (R.pos + 4.0 * (1 + R.lv * .06) * dt) % 6;
            if(i.tap){ var idx = Math.round(R.pos) % 6, off = Math.abs(R.pos - Math.round(R.pos)); if(idx === R.target && off < .3 * cl(R.sz, .85, 1.4)){ R.score++; R.sfx("coin"); R.fx(W / 2, 320, "#ffe36a"); if(R.score >= R.need) R.win(); else R.pick2(R); } else { R.lose("miss"); R.sfx("ng"); } }
        },
        draw: function(R, c){ bg(c, "#3a1f4f", "#150a22"); c.fillStyle = "#12102a"; c.fillRect(W / 2 - 70, 190, 140, 260); c.fillStyle = "rgba(255,227,106,.25)"; c.fillRect(W / 2 - 70, 320 - 40, 140, 80); c.strokeStyle = "#ffe36a"; c.lineWidth = 4; c.strokeRect(W / 2 - 70, 280, 140, 80); c.save(); c.beginPath(); c.rect(W / 2 - 70, 190, 140, 260); c.clip(); for(var k = -2; k <= 2; k++){ var idx = (Math.round(R.pos) + k + 12) % 6, y = 320 + (k - (R.pos - Math.round(R.pos))) * 80; E(c, R.sy[idx], W / 2, y, 60); } c.restore(); E(c, R.sy[R.target], W / 2, 120, 70); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ var idx = Math.round(R.pos) % 6, off = Math.abs(R.pos - Math.round(R.pos)); if(idx === R.target && off < .09) i.tap = true; }});

    // ⑲ あおで GO！
    RR.add({id: "react", em: "🚦", time: 14, type: "goal", n: N("あおで タップ！", "Green Light", "绿灯点击", "초록불 터치"), how: N("あおに なった しゅんかんに タップ！ はやすぎても おそすぎても ダメ。3かい！", "Tap the instant it turns green! Too early or too late is a miss. 3 times!", "变绿的瞬间点击！太早太晚都不行。3次！", "초록이 되는 순간 터치! 너무 빠르거나 늦으면 실패. 3번!"),
        setup: function(R){ R.need = 3; R.st = "wait"; R.d = 1 + R.rnd() * 1.4; R.gt = 0; },
        update: function(R, dt, i){
            if(R.st === "wait"){ R.d -= dt; if(i.tap){ R.lose("early"); R.sfx("ng"); return; } if(R.d <= 0){ R.st = "go"; R.gt = 0; R.sfx("tap"); } }
            else { R.gt += dt; if(i.tap){ R.score++; R.sfx("coin"); R.fx(W / 2, 260, "#46d17a"); if(R.score >= R.need) R.win(); else { R.st = "wait"; R.d = .9 + R.rnd() * 1.4; } } else if(R.gt > .85){ R.lose("late"); R.sfx("ng"); } }
        },
        draw: function(R, c){ bg(c, "#1a1a2e", "#0a0a14"); c.fillStyle = "#2a2a44"; c.fillRect(W / 2 - 60, 150, 120, 260); c.fillStyle = R.st === "wait" ? "#ff4d4d" : "#33333a"; c.beginPath(); c.arc(W / 2, 220, 40, 0, 6.3); c.fill(); c.fillStyle = R.st === "go" ? "#46ff7a" : "#33333a"; c.beginPath(); c.arc(W / 2, 340, 40, 0, 6.3); c.fill(); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ if(R.st === "go" && R.gt > .1) i.tap = true; }});

    // ⑳ けいさん
    RR.add({id: "math", em: "➕", time: 13, type: "goal", n: N("すばやく けいさん", "Quick Math", "快速计算", "빠른 계산"), how: N("こたえを えらんで タップ！ 4もん せいかいで クリア", "Tap the right answer! 4 correct to clear.", "点击正确答案！答对4题过关。", "정답을 터치! 4문제 맞히면 클리어"),
        setup: function(R){ R.need = 4; R.mk = function(R){ var m = 9 + Math.floor(R.lv * 2), a = R.ri(2, m), b = R.ri(1, m), plus = R.rnd() < .6; if(!plus && b > a){ var t = a; a = b; b = t; } R.q = a + (plus ? " + " : " − ") + b; R.ans = plus ? a + b : a - b; var opts = [R.ans]; while(opts.length < 3){ var o = R.ans + R.ri(-4, 4); if(o !== R.ans && opts.indexOf(o) < 0 && o >= 0) opts.push(o); } for(var k = 2; k > 0; k--){ var j = R.ri(0, k), tmp = opts[k]; opts[k] = opts[j]; opts[j] = tmp; } R.opts = opts; R.fresh = R.t; }; R.mk(R); },
        update: function(R, dt, i){ if(i.tap && R.t - R.fresh > .1){ for(var k = 0; k < 3; k++){ var x = 70 + k * 130; if(dist(i.x, i.y, x, 420) < 52 * R.sz + 6){ if(R.opts[k] === R.ans){ R.score++; R.sfx("ok"); R.fx(x, 420, "#46d17a"); if(R.score >= R.need) R.win(); else R.mk(R); } else { R.lose("wrong"); R.sfx("ng"); } break; } } } },
        draw: function(R, c){ bg(c, "#1c3350", "#0a1424"); c.fillStyle = "#fff"; c.font = "bold 64px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(R.q + " = ?", W / 2, 230); for(var k = 0; k < 3; k++){ c.fillStyle = "#3a3d8f"; c.beginPath(); c.arc(70 + k * 130, 420, 50 * R.sz, 0, 6.3); c.fill(); c.strokeStyle = "#8a8fff"; c.lineWidth = 4; c.stroke(); c.fillStyle = "#fff"; c.font = "bold 40px sans-serif"; c.fillText(R.opts[k], 70 + k * 130, 422); } hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ if(R.t - R.fresh > .15){ var k = R.opts.indexOf(R.ans); i.x = 70 + k * 130; i.y = 420; i.tap = true; } }});

    // ㉑ まっすぐ すすめ（せまい みちを ぬける）
    RR.add({id: "path", em: "🌀", time: 9, type: "goal", n: N("みちを すすめ", "Steady Path", "走过弯路", "길 따라가기"), how: N("ゆびを たてに うごかして、うねる みちから はみださずに ゴールまで！", "Move your finger up and down to follow the winding path to the goal!", "上下移动手指，沿着弯路走到终点！", "손가락을 위아래로 움직여 구불구불한 길을 따라 골까지!"),
        setup: function(R){ R.tx = 20; R.ty = 280; R.ph = R.rnd() * 6; R.hh = 52 * Math.min(1.3, Math.max(.75, R.sz)); R.cy = function(x){ return 280 + 80 * Math.sin(x / 38 + R.ph); }; R.ty = R.cy(20); },
        update: function(R, dt, i){
            R.tx += 62 * (1 + R.lv * .08) * dt; R.ty += cl(i.y - R.ty, -420 * dt, 420 * dt);
            if(Math.abs(R.ty - R.cy(R.tx)) > R.hh - 10){ R.lose("out"); R.sfx("boom"); R.fx(R.tx, R.ty, "#ff5d7a"); return; }
            if(R.tx >= W - 14){ R.win(); }
        },
        draw: function(R, c){ bg(c, "#17213f", "#0a0f22"); c.fillStyle = "rgba(255,255,255,.12)"; c.beginPath(); for(var x = 0; x <= W; x += 6){ var y = R.cy(x) - R.hh; if(x === 0) c.moveTo(x, y); else c.lineTo(x, y); } for(var x2 = W; x2 >= 0; x2 -= 6) c.lineTo(x2, R.cy(x2) + R.hh); c.closePath(); c.fill(); c.strokeStyle = "#7ae6ff"; c.lineWidth = 3; c.stroke(); c.fillStyle = "#ffe36a"; c.fillRect(W - 12, 80, 8, H - 160); c.fillStyle = "#ff6b8a"; c.beginPath(); c.arc(R.tx, R.ty, 12, 0, 6.3); c.fill(); hud(c, "GOAL ▶"); },
        ai: function(R, i){ i.y = R.cy(R.tx + 4); i.x = R.tx; }});

    // ㉒ コインを あつめろ（おいかけられる）
    RR.add({id: "coins", em: "🪙", time: 13, type: "goal", n: N("コイン あつめ", "Coin Chase", "收集金币", "코인 모으기"), how: N("コインを 8こ あつめよう！ おばけに つかまらないで！", "Collect 8 coins! Don't let the ghost catch you!", "收集8枚金币！别被幽灵抓到！", "코인 8개 모으기! 유령에게 잡히면 안 돼요!"),
        setup: function(R){ R.px = W / 2; R.py = H / 2 + 60; R.gx = 40; R.gy = 90; R.co = []; R.need = 8; for(var k = 0; k < 4; k++) R.co.push({x: R.ri(40, 360), y: R.ri(130, 500)}); },
        update: function(R, dt, i){
            R.px += cl(i.x - R.px, -520 * dt, 520 * dt); R.py += cl(i.y - R.py, -520 * dt, 520 * dt); R.px = cl(R.px, 14, W - 14); R.py = cl(R.py, 90, H - 14);
            var gs = 88 * (1 + R.lv * .1) * dt, d = dist(R.gx, R.gy, R.px, R.py); if(d > 1){ R.gx += (R.px - R.gx) / d * gs; R.gy += (R.py - R.gy) / d * gs; }
            if(d < 28){ R.lose("caught"); R.sfx("boom"); return; }
            for(var q = R.co.length - 1; q >= 0; q--){ if(dist(R.px, R.py, R.co[q].x, R.co[q].y) < 20 * R.sz + 14){ R.fx(R.co[q].x, R.co[q].y, "#ffe36a"); R.co.splice(q, 1); R.score++; R.sfx("coin"); if(R.score >= R.need){ R.win(); return; } } }
            while(R.co.length < 4) R.co.push({x: R.ri(40, 360), y: R.ri(130, 500)});
        },
        draw: function(R, c){ bg(c, "#1b2a44", "#0a1220"); R.co.forEach(function(q){ E(c, "🪙", q.x, q.y, 38 * R.sz); }); E(c, "👻", R.gx, R.gy, 46); c.fillStyle = "#59e6d0"; c.beginPath(); c.arc(R.px, R.py, 14, 0, 6.3); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(R.px - 5, R.py - 3, 3, 0, 6.3); c.arc(R.px + 5, R.py - 3, 3, 0, 6.3); c.fill(); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ var b = null, bs = 1e9; R.co.forEach(function(q){ var s = dist(R.px, R.py, q.x, q.y) + (dist(R.gx, R.gy, q.x, q.y) < 90 ? 400 : 0); if(s < bs){ bs = s; b = q; } }); if(b){ i.x = b.x; i.y = b.y; } }});

    // ㉓ ペア あわせ
    RR.add({id: "pairs", em: "🃏", time: 14, type: "goal", n: N("ペア あわせ", "Match Pairs", "配对", "짝 맞추기"), how: N("おなじ カードを 2まい めくって ぜんぶ そろえよう！", "Flip two cards at a time and match all the pairs!", "翻开两张相同的牌，全部配对！", "같은 카드 2장을 뒤집어 모두 맞춰요!"),
        setup: function(R){ var em = ["🍎", "🍌", "🍇", "🍓", "🥝", "🍑"], pk = []; var n = R.lv > 1 ? 4 : 3; while(pk.length < n){ var e = R.pick(em); if(pk.indexOf(e) < 0) pk.push(e); } var vals = pk.concat(pk); for(var k = vals.length - 1; k > 0; k--){ var j = R.ri(0, k), t = vals[k]; vals[k] = vals[j]; vals[j] = t; } R.cd = vals.map(function(v, k){ return {v: v, up: false, ok: false, x: 70 + (k % 3) * 130, y: 190 + ((k / 3) | 0) * 120}; }); R.open = []; R.ct = 0; R.need = n; R.lastTap = -9; },
        update: function(R, dt, i){
            if(R.ct > 0){ R.ct -= dt; if(R.ct <= 0){ var a = R.open[0], b = R.open[1]; if(a.v === b.v){ a.ok = b.ok = true; R.score++; R.sfx("ok"); R.fx(a.x, a.y, "#ffe36a"); R.fx(b.x, b.y, "#ffe36a"); if(R.score >= R.need){ R.win(); return; } } else { a.up = b.up = false; } R.open = []; } return; }
            if(i.tap){ for(var k = 0; k < R.cd.length; k++){ var cd = R.cd[k]; if(!cd.up && !cd.ok && Math.abs(i.x - cd.x) < 52 * Math.min(1.2, R.sz) + 8 && Math.abs(i.y - cd.y) < 52 * Math.min(1.2, R.sz) + 8){ cd.up = true; R.open.push(cd); R.sfx("tap"); if(R.open.length === 2) R.ct = .5; break; } }
            }
        },
        draw: function(R, c){ bg(c, "#2f2a63", "#100d2c"); R.cd.forEach(function(q){ c.fillStyle = q.ok ? "#2b7a5a" : q.up ? "#fff" : "#6b73f0"; var s = 50 * Math.min(1.2, R.sz); c.fillRect(q.x - s, q.y - s, s * 2, s * 2); if(q.up || q.ok) E(c, q.v, q.x, q.y, 64); else { c.fillStyle = "#c9d3ff"; c.font = "bold 40px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", q.x, q.y); } }); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){
            if(R.ct > 0 || R.t - R.lastTap < .28) return;
            var up = R.open[0], t = null;
            if(up){ t = R.cd.filter(function(q){ return !q.up && !q.ok && q.v === up.v; })[0]; } else { t = R.cd.filter(function(q){ return !q.up && !q.ok; })[0]; }
            if(t){ i.x = t.x; i.y = t.y; i.tap = true; R.lastTap = R.t; }
        }});

    // ㉔ ブロックくずし
    RR.add({id: "breakout", em: "🏓", time: 16, type: "goal", n: N("ブロックくずし", "Brick Break", "打砖块", "벽돌 깨기"), how: N("ボールを うちかえして ブロックを 7こ こわそう！ おとしたら アウト！", "Bounce the ball back and break 7 bricks! Drop it and you're out!", "接住球打碎7块砖！掉了就输！", "공을 튕겨 벽돌 7개 부수기! 놓치면 아웃!"),
        setup: function(R){ R.pw = 90 * Math.min(1.4, Math.max(.8, R.sz)); R.pxx = W / 2; R.bx = W / 2; R.by = H - 100; var a = (R.rnd() - .5) * .8, sp = 380 * (1 + R.lv * .05); R.vx = Math.sin(a) * sp; R.vy = -Math.cos(a) * sp; R.br = []; for(var r = 0; r < 3; r++) for(var k = 0; k < 5; k++) R.br.push({x: 20 + k * 72, y: 170 + r * 30, w: 66, h: 24, a: true}); R.need = 7; },
        update: function(R, dt, i){
            R.pxx = cl(R.pxx + cl(i.x - R.pxx, -760 * dt, 760 * dt), R.pw / 2, W - R.pw / 2);
            var steps = Math.max(1, Math.ceil(Math.hypot(R.vx, R.vy) * dt / 4)), h = dt / steps;
            for(var s = 0; s < steps; s++){
                R.bx += R.vx * h; R.by += R.vy * h;
                if(R.bx < 9){ R.bx = 9; R.vx = Math.abs(R.vx); } if(R.bx > W - 9){ R.bx = W - 9; R.vx = -Math.abs(R.vx); } if(R.by < 9){ R.by = 9; R.vy = Math.abs(R.vy); }
                if(R.vy > 0 && R.by > H - 62 && R.by < H - 42 && Math.abs(R.bx - R.pxx) < R.pw / 2 + 8){ var off = (R.bx - R.pxx) / (R.pw / 2), sp = Math.hypot(R.vx, R.vy); R.vx = off * sp * .75; R.vy = -Math.sqrt(Math.max(sp * sp - R.vx * R.vx, 1)); R.by = H - 62; R.sfx("tap"); }
                for(var q = 0; q < R.br.length; q++){ var b = R.br[q]; if(b.a && R.bx > b.x - 8 && R.bx < b.x + b.w + 8 && R.by > b.y - 8 && R.by < b.y + b.h + 8){ b.a = false; R.score++; R.fx(b.x + b.w / 2, b.y + 12, "#ffe36a"); R.sfx("pop"); var cxm = b.x + b.w / 2, cym = b.y + b.h / 2; if(Math.abs((R.bx - cxm) / b.w) > Math.abs((R.by - cym) / b.h)) R.vx = -R.vx; else R.vy = -R.vy; if(R.score >= R.need){ R.win(); return; } break; } }
            }
            if(R.by > H + 10){ R.lose("drop"); R.sfx("lose"); }
        },
        draw: function(R, c){ bg(c, "#1f2c5c", "#0a1028"); R.br.forEach(function(b, k){ if(b.a){ c.fillStyle = "hsl(" + (k * 25) + ",70%,60%)"; c.fillRect(b.x, b.y, b.w, b.h); c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(b.x, b.y, b.w, 6); } }); c.fillStyle = "#59e6d0"; c.fillRect(R.pxx - R.pw / 2, H - 56, R.pw, 14); c.fillStyle = "#fff"; c.beginPath(); c.arc(R.bx, R.by, 9, 0, 6.3); c.fill(); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){
            var tgt = null; R.br.forEach(function(b){ if(!b.a) return; if(!tgt || b.y > tgt.y || (b.y === tgt.y && Math.abs(b.x - R.bx) < Math.abs(tgt.x - R.bx))) tgt = b; });
            if(R.vy > 0 && tgt){ var vx = (tgt.x + tgt.w / 2 - R.bx) / Math.max(.4, (H - 62 - tgt.y) / Math.abs(R.vy)), off = cl(vx / (Math.hypot(R.vx, R.vy) * .75), -.85, .85); i.x = R.bx - off * R.pw / 2; } else i.x = R.bx; i.y = H - 56;
        }});
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
