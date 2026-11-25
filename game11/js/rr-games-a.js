"use strict";
/* ルール・ルーレット：マイクロゲーム ①〜⑫
   ・おなじ きまり：  setup(R) / update(R, dt, i) / draw(R, c) / ai(R, i)（テスト用の「完璧な ボット」）
   ・i = {x, y, tap, down}  （ゲームの 世界の 座標。tap = この フレームで タップ）
   ・R.sz … まとの おおきさ ばいりつ  R.lv … むずかしさ(0〜)  R.fx / R.sfx … 演出 */
(function(root){
    var RR = root.RR || require("./rr-core.js"), N = RR.N, W = RR.W, H = RR.H;
    function E(c, ch, x, y, s){ c.font = (s | 0) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(ch, x, y); }
    function bg(c, a, b){ var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    function cl(v, a, b){ return v < a ? a : v > b ? b : v; }
    function dist(a, b, x, y){ return Math.hypot(a - x, b - y); }
    function hud(c, s){ c.fillStyle = "#fff"; c.font = "bold 20px sans-serif"; c.textAlign = "center"; c.textBaseline = "top"; c.fillText(s, W / 2, 10); }
    RR.util = {E: E, bg: bg, cl: cl, dist: dist, hud: hud};

    // ① タップ！
    RR.add({id: "tap", em: "🎯", time: 10, type: "goal", n: N("まとを タップ！", "Tap Targets", "点击靶子", "과녁 터치"), how: N("あらわれる まとを 8こ タップ！", "Tap 8 targets before they vanish!", "在靶子消失前点中8个！", "사라지기 전에 과녁 8개 터치!"),
        setup: function(R){ R.tg = []; R.sp = .2; R.need = 8; },
        update: function(R, dt, i){
            R.sp -= dt; var k = 1 + R.lv * .15;
            if(R.sp <= 0 && R.tg.length < 5){ R.tg.push({x: R.ri(50, 350), y: R.ri(110, 500), r: 34 * R.sz, life: 1.7 / k, max: 1.7 / k}); R.sp = .6 / k; }
            R.tg.forEach(function(t){ t.life -= dt; }); R.tg = R.tg.filter(function(t){ return t.life > 0; });
            if(i.tap){ for(var k2 = R.tg.length - 1; k2 >= 0; k2--){ var t = R.tg[k2]; if(dist(i.x, i.y, t.x, t.y) <= t.r + 8){ R.tg.splice(k2, 1); R.score++; R.fx(t.x, t.y, "#ffe36a"); R.sfx("pop"); if(R.score >= R.need) R.win(); break; } } }
        },
        draw: function(R, c){ bg(c, "#2b1f6e", "#14123a"); R.tg.forEach(function(t){ var p = t.life / t.max; c.fillStyle = "#ff6b8a"; c.beginPath(); c.arc(t.x, t.y, t.r, 0, 6.3); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(t.x, t.y, t.r * .6, 0, 6.3); c.fill(); c.fillStyle = "#ff6b8a"; c.beginPath(); c.arc(t.x, t.y, t.r * .25, 0, 6.3); c.fill(); c.strokeStyle = "#ffe36a"; c.lineWidth = 4; c.beginPath(); c.arc(t.x, t.y, t.r + 7, -1.57, -1.57 + 6.28 * p); c.stroke(); }); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ var b = null; R.tg.forEach(function(t){ if(!b || t.life < b.life) b = t; }); if(b){ i.x = b.x; i.y = b.y; i.tap = true; } }});

    // ② よけろ！（おちてくる かべの すきまを とおる）
    RR.add({id: "dodge", em: "🧱", time: 8, type: "survive", n: N("すきまを くぐれ！", "Slip Through", "穿过缝隙", "틈새로 쏙"), how: N("おちてくる かべの すきまを とおって 8びょう にげきろう！", "Slip through the gaps for 8 seconds!", "穿过缝隙坚持8秒！", "틈새로 빠져나가며 8초 버티기!"),
        setup: function(R){ R.px = W / 2; R.rows = []; R.rt = .1; R.gap = 2; },
        update: function(R, dt, i){
            var sp = 210 * (1 + R.lv * .12), PY = H - 70, cw = W / 6;
            R.rt -= dt; if(R.rt <= 0){ R.gap = cl(R.gap + R.pick([-2, -1, 0, 1, 2]), 0, 5); R.rows.push({y: -30, g: R.gap}); R.rt = 170 / sp; }
            R.rows.forEach(function(r){ r.y += sp * dt; }); R.rows = R.rows.filter(function(r){ return r.y < H + 40; });
            R.px = cl(R.px + cl(i.x - R.px, -720 * dt, 720 * dt), 14, W - 14);
            for(var k = 0; k < R.rows.length; k++){ var r = R.rows[k]; if(Math.abs(r.y - PY) < 22){ for(var cx = 0; cx < 6; cx++){ if(cx === r.g) continue; if(R.px + 12 > cx * cw + 3 && R.px - 12 < (cx + 1) * cw - 3){ R.lose("hit"); R.fx(R.px, PY, "#ff5d7a"); R.sfx("boom"); return; } } } }
        },
        draw: function(R, c){ bg(c, "#1d2a52", "#0b1128"); var cw = W / 6; R.rows.forEach(function(r){ for(var cx = 0; cx < 6; cx++){ if(cx === r.g) continue; c.fillStyle = "#e0654f"; c.fillRect(cx * cw + 3, r.y - 18, cw - 6, 36); c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(cx * cw + 3, r.y - 18, cw - 6, 8); } }); c.fillStyle = "#59e6d0"; c.beginPath(); c.arc(R.px, H - 70, 14, 0, 6.3); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(R.px - 5, H - 74, 3, 0, 6.3); c.arc(R.px + 5, H - 74, 3, 0, 6.3); c.fill(); hud(c, Math.ceil(R.left()) + "s"); },
        ai: function(R, i){ var PY = H - 70, cw = W / 6, cur = null; R.rows.slice().sort(function(a, b){ return b.y - a.y; }).forEach(function(r){ if(!cur && r.y <= PY + 22) cur = r; }); i.x = cur ? cur.g * cw + cw / 2 : W / 2; i.y = PY; }});

    // ③ キャッチ！
    RR.add({id: "catch", em: "🧺", time: 12, type: "goal", n: N("フルーツ キャッチ", "Fruit Catch", "接水果", "과일 받기"), how: N("フルーツを 7こ キャッチ！ 💣は よけて！", "Catch 7 fruits! Avoid the 💣!", "接住7个水果！别接💣！", "과일 7개 받기! 💣은 피해요!"),
        setup: function(R){ R.bx = W / 2; R.it = []; R.sp = .1; R.need = 7; R.last = -1; },
        update: function(R, dt, i){
            var BY = H - 70, k = 1 + R.lv * .1;
            R.sp -= dt; if(R.sp <= 0){ var bomb = R.rnd() < .22 && R.last !== 1; R.last = bomb ? 1 : 0; var nx = R.ri(40, 360); if(bomb){ for(var q0 = 0; q0 < 8; q0++){ var near = R.it.some(function(t){ return !t.bomb && t.y < 140 && Math.abs(t.x - nx) < 110; }); if(!near) break; nx = R.ri(40, 360); } } R.it.push({x: nx, y: -20, bomb: bomb, e: bomb ? "💣" : R.pick(["🍎", "🍊", "🍇", "🍓", "🍑"])}); R.sp = .42 / k; }
            R.it.forEach(function(t){ t.y += 230 * k * dt; });
            R.bx = cl(R.bx + cl(i.x - R.bx, -650 * dt, 650 * dt), 36, W - 36);
            for(var q = R.it.length - 1; q >= 0; q--){ var t = R.it[q]; if(Math.abs(t.y - BY) < 20 && Math.abs(t.x - R.bx) < 38 * R.sz + 8){ R.it.splice(q, 1); if(t.bomb){ R.lose("bomb"); R.fx(t.x, t.y, "#ff5d7a"); R.sfx("boom"); return; } R.score++; R.fx(t.x, t.y, "#ffe36a"); R.sfx("coin"); if(R.score >= R.need){ R.win(); return; } } else if(t.y > H + 30) R.it.splice(q, 1); }
        },
        draw: function(R, c){ bg(c, "#17496e", "#0a1a30"); R.it.forEach(function(t){ E(c, t.e, t.x, t.y, 38); }); var w = 38 * R.sz; c.fillStyle = "#c98a4b"; c.beginPath(); c.moveTo(R.bx - w, H - 84); c.lineTo(R.bx + w, H - 84); c.lineTo(R.bx + w * .7, H - 48); c.lineTo(R.bx - w * .7, H - 48); c.closePath(); c.fill(); c.strokeStyle = "#7a4a1e"; c.lineWidth = 3; c.stroke(); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){
            var BY = H - 70, best = null, bx = R.bx, v = 230 * (1 + R.lv * .1), hw = 38 * R.sz + 8 + 12, wnd = 22 / v + .03;
            var pathSafe = function(tx){ return !R.it.some(function(t){ if(!t.bomb) return false; var tb = (BY - t.y) / v; if(tb < -wnd || tb > 2.5) return false; for(var q = -wnd; q <= wnd; q += .03){ var tt = Math.max(0, tb + q), dx = tx - bx, px = bx + cl(dx, -650 * tt, 650 * tt); if(Math.abs(px - t.x) < hw) return true; } return false; }); };
            R.it.forEach(function(t){ if(t.bomb) return; var tt = (BY - t.y) / v; if(tt < -.05) return; var reach = Math.abs(t.x - bx) / 650; if(reach > tt + .02) return; if(!pathSafe(t.x)) return; if(!best || t.y > best.y) best = t; });
            if(best) i.x = best.x; else { var c2 = [bx, bx - 70, bx + 70, bx - 150, bx + 150].filter(function(x){ return x > 30 && x < W - 30 && pathSafe(x); }); i.x = c2.length ? c2[0] : bx; } i.y = BY;
        }});

    // ④ ぴったりストップ
    RR.add({id: "timing", em: "⏱️", time: 9, type: "goal", n: N("ぴったり ストップ", "Perfect Stop", "精准停止", "딱 멈춰"), how: N("みどりの ゾーンで タップ！ 3かい せいこうで クリア", "Tap inside the green zone 3 times!", "在绿色区域点击！成功3次过关", "초록 구간에서 터치! 3번 성공"),
        setup: function(R){ R.p = 0; R.dir = 1; R.zc = .3 + R.rnd() * .4; R.need = 3; },
        update: function(R, dt, i){
            var sp = 1.0 * (1 + R.lv * .25), zw = .26 * R.sz / (1 + R.lv * .12);
            R.p += R.dir * sp * dt; if(R.p > 1){ R.p = 1; R.dir = -1; } if(R.p < 0){ R.p = 0; R.dir = 1; }
            if(i.tap){ if(Math.abs(R.p - R.zc) <= zw / 2){ R.score++; R.fx(60 + R.p * 280, 280, "#59e6d0"); R.sfx("ok"); R.zc = .15 + R.rnd() * .7; if(R.score >= R.need) R.win(); } else { R.lose("miss"); R.sfx("ng"); } }
        },
        draw: function(R, c){ bg(c, "#12304a", "#0a1020"); var zw = .26 * R.sz / (1 + R.lv * .12); c.fillStyle = "#22304f"; c.fillRect(60, 250, 280, 60); c.fillStyle = "#33d17a"; c.fillRect(60 + (R.zc - zw / 2) * 280, 250, zw * 280, 60); c.fillStyle = "#fff"; c.fillRect(60 + R.p * 280 - 4, 238, 8, 84); c.strokeStyle = "#8a8fff"; c.lineWidth = 3; c.strokeRect(60, 250, 280, 60); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ var zw = .26 * R.sz / (1 + R.lv * .12); if(Math.abs(R.p - R.zc) < zw * .3) i.tap = true; }});

    // ⑤ かずくらべ
    RR.add({id: "count", em: "🔢", time: 12, type: "goal", n: N("おおいのは？", "More Dots", "哪边多？", "어느 쪽이 많아?"), how: N("まるが おおい ほうを タップ！ 4かい つづけて！", "Tap the side with more dots! 4 times!", "点击圆点多的一边！连续4次！", "점이 많은 쪽을 터치! 4번!"),
        setup: function(R){ R.need = 4; R.mk = function(R){ var diff = Math.max(1, 3 - Math.floor(R.lv)), base = R.ri(6, 13), a = base + diff, b = base; R.leftMore = R.rnd() < .5; var cnt = R.leftMore ? [a, b] : [b, a]; R.dots = [0, 1].map(function(side){ var pts = [], tries = 0; while(pts.length < cnt[side] && tries++ < 600){ var x = side * 200 + 20 + R.rnd() * 160, y = 100 + R.rnd() * 380; if(pts.every(function(p){ return Math.hypot(p[0] - x, p[1] - y) > 24; })) pts.push([x, y]); } return pts; }); R.fresh = R.t; }; R.mk(R); },
        update: function(R, dt, i){
            if(i.tap && R.t - R.fresh > .15){ var left = i.x < W / 2; if(left === R.leftMore){ R.score++; R.sfx("ok"); R.fx(i.x, i.y, "#59e6d0"); if(R.score >= R.need) R.win(); else R.mk(R); } else { R.lose("wrong"); R.sfx("ng"); } }
        },
        draw: function(R, c){ bg(c, "#2a2160", "#12102e"); c.strokeStyle = "rgba(255,255,255,.3)"; c.setLineDash([8, 8]); c.beginPath(); c.moveTo(W / 2, 80); c.lineTo(W / 2, H - 60); c.stroke(); c.setLineDash([]); c.fillStyle = "#ffd35a"; R.dots[0].forEach(function(d){ c.beginPath(); c.arc(d[0], d[1], 9, 0, 6.3); c.fill(); }); c.fillStyle = "#7ae6ff"; R.dots[1].forEach(function(d){ c.beginPath(); c.arc(d[0], d[1], 9, 0, 6.3); c.fill(); }); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ if(R.t - R.fresh > .2){ i.x = R.leftMore ? 100 : 300; i.y = 300; i.tap = true; } }});
    // ⑥ いろ そろえ
    RR.add({id: "color", em: "🎨", time: 11, type: "goal", n: N("おなじ いろ", "Same Color", "同样的颜色", "같은 색"), how: N("うえと おなじ いろを タップ！ 5かい！", "Tap the color that matches the top! 5 times!", "点击与上方相同的颜色！5次！", "위와 같은 색을 터치! 5번!"),
        setup: function(R){ R.need = 5; R.cols = ["#ff5d5d", "#4d9bff", "#46d17a", "#ffd23a", "#b46bff", "#ff9a3a"]; R.mk = function(R){ var cs = R.cols.slice(), t = R.ri(0, 5), opts = [t]; while(opts.length < 3){ var o = R.ri(0, 5); if(opts.indexOf(o) < 0) opts.push(o); } for(var k = opts.length - 1; k > 0; k--){ var j = R.ri(0, k), tmp = opts[k]; opts[k] = opts[j]; opts[j] = tmp; } R.target = t; R.opts = opts; R.pos = [[80, 400], [200, 400], [320, 400]]; R.fresh = R.t; }; R.mk(R); },
        update: function(R, dt, i){ if(i.tap && R.t - R.fresh > .1){ for(var k = 0; k < 3; k++){ if(dist(i.x, i.y, R.pos[k][0], R.pos[k][1]) < 52 * R.sz + 6){ if(R.opts[k] === R.target){ R.score++; R.sfx("ok"); R.fx(R.pos[k][0], R.pos[k][1], R.cols[R.target]); if(R.score >= R.need) R.win(); else R.mk(R); } else { R.lose("wrong"); R.sfx("ng"); } break; } } } },
        draw: function(R, c){ bg(c, "#242056", "#10102a"); c.fillStyle = R.cols[R.target]; c.beginPath(); c.arc(W / 2, 170, 70, 0, 6.3); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 5; c.stroke(); for(var k = 0; k < 3; k++){ c.fillStyle = R.cols[R.opts[k]]; c.beginPath(); c.arc(R.pos[k][0], R.pos[k][1], 46 * R.sz, 0, 6.3); c.fill(); c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 4; c.stroke(); } hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ if(R.t - R.fresh > .15){ var k = R.opts.indexOf(R.target); i.x = R.pos[k][0]; i.y = R.pos[k][1]; i.tap = true; } }});

    // ⑦ ちがいを みつけろ
    RR.add({id: "odd", em: "🔎", time: 12, type: "goal", n: N("ちがう ひとつ", "Odd One Out", "找不同", "다른 하나"), how: N("1つだけ ちがう ものを タップ！ 3かい！", "Tap the one that's different! 3 times!", "点击唯一不同的那个！3次！", "하나만 다른 것을 터치! 3번!"),
        setup: function(R){ R.need = 3; R.sets = [["🍎", "🍅"], ["😀", "🙂"], ["🌕", "🌝"], ["⭐", "🌟"], ["🔵", "🟣"], ["🧡", "🟠"], ["🍋", "🌼"], ["⚽", "🏀"]]; R.mk = function(R){ var s = R.pick(R.sets), cols = 4, rows = 5 + (R.lv > 1 ? 1 : 0); R.odd = R.ri(0, cols * rows - 1); R.cells = []; for(var k = 0; k < cols * rows; k++) R.cells.push({x: 50 + (k % cols) * 100, y: 120 + ((k / cols) | 0) * 72, e: k === R.odd ? s[1] : s[0]}); R.fresh = R.t; }; R.mk(R); },
        update: function(R, dt, i){ if(i.tap && R.t - R.fresh > .1){ for(var k = 0; k < R.cells.length; k++){ var q = R.cells[k]; if(dist(i.x, i.y, q.x, q.y) < 34 * R.sz + 6){ if(k === R.odd){ R.score++; R.sfx("ok"); R.fx(q.x, q.y, "#ffe36a"); if(R.score >= R.need) R.win(); else R.mk(R); } else { R.lose("wrong"); R.sfx("ng"); } break; } } } },
        draw: function(R, c){ bg(c, "#1f3a4f", "#0b1624"); R.cells.forEach(function(q){ E(c, q.e, q.x, q.y, 50 * R.sz); }); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ if(R.t - R.fresh > .15){ var q = R.cells[R.odd]; i.x = q.x; i.y = q.y; i.tap = true; } }});

    // ⑧ きおく
    RR.add({id: "memory", em: "🧠", time: 15, type: "goal", n: N("おなじ じゅんばん", "Remember", "记住顺序", "순서 기억"), how: N("ひかった じゅんばんを おぼえて タップ！", "Watch the lights, then repeat the order!", "记住亮灯顺序再点一遍！", "빛난 순서를 기억해 터치!"),
        setup: function(R){ var len = 3 + Math.min(2, Math.floor(R.lv)); R.seq = []; for(var k = 0; k < len; k++) R.seq.push(R.ri(0, 3)); R.ph = "show"; R.si = 0; R.tt = .6; R.inp = 0; R.on = -1; R.cols = ["#ff5d6d", "#4d9bff", "#46d17a", "#ffd23a"]; R.pads = [[110, 200], [290, 200], [110, 380], [290, 380]]; R.need = len; R.lastTap = -9; },
        update: function(R, dt, i){
            if(R.ph === "show"){ R.tt -= dt; if(R.tt <= 0){ if(R.on >= 0){ R.on = -1; R.tt = .22; R.si++; if(R.si >= R.seq.length){ R.ph = "in"; R.inp = 0; R.tt = 0; } } else { R.on = R.seq[R.si]; R.tt = .5; R.sfx("tap"); } } }
            else { if(R.on >= 0){ R.tt -= dt; if(R.tt <= 0) R.on = -1; } if(i.tap){ for(var k = 0; k < 4; k++){ if(dist(i.x, i.y, R.pads[k][0], R.pads[k][1]) < 80){ R.on = k; R.tt = .2; if(k === R.seq[R.inp]){ R.inp++; R.score = R.inp; R.sfx("ok"); if(R.inp >= R.seq.length) R.win(); } else { R.lose("wrong"); R.sfx("ng"); } break; } } } }
        },
        draw: function(R, c){ bg(c, "#241e5c", "#0e0c26"); for(var k = 0; k < 4; k++){ c.globalAlpha = R.on === k ? 1 : .38; c.fillStyle = R.cols[k]; c.beginPath(); c.arc(R.pads[k][0], R.pads[k][1], 76, 0, 6.3); c.fill(); } c.globalAlpha = 1; hud(c, R.ph === "show" ? "👀" : "👆 " + R.inp + " / " + R.seq.length); },
        ai: function(R, i){ if(R.ph === "in" && R.t - R.lastTap > .27){ var k = R.seq[R.inp]; i.x = R.pads[k][0]; i.y = R.pads[k][1]; i.tap = true; R.lastTap = R.t; } }});

    // ⑨ ジャンプ！
    RR.add({id: "jump", em: "🏃", time: 9, type: "survive", n: N("とびこえろ！", "Hurdles", "跨栏", "허들 점프"), how: N("タップで ジャンプ！ しょうがいぶつを とびこえて 9びょう！", "Tap to jump over the hurdles for 9 seconds!", "点击跳起，跨过障碍坚持9秒！", "터치로 점프! 장애물을 넘어 9초!"),
        setup: function(R){ R.y = 0; R.vy = 0; R.ob = []; R.nx = 1.0; R.gr = 2400; },
        update: function(R, dt, i){
            var sp = 270 * (1 + R.lv * .1);
            if(i.tap && R.y <= 0){ R.vy = 820; R.sfx("jump"); }
            R.vy -= R.gr * dt; R.y += R.vy * dt; if(R.y < 0){ R.y = 0; R.vy = 0; }
            R.nx -= dt; if(R.nx <= 0){ R.ob.push({x: W + 30, w: 26, h: 34 + R.ri(0, 30)}); R.nx = Math.max(1.05, (1.7 - R.lv * .1)) + R.rnd() * .5; }
            R.ob.forEach(function(o){ o.x -= sp * dt; }); R.ob = R.ob.filter(function(o){ return o.x > -40; });
            R.ob.forEach(function(o){ if(Math.abs(o.x - 80) < o.w / 2 + 12 && R.y < o.h - 4){ R.lose("hit"); R.sfx("boom"); } });
        },
        draw: function(R, c){ bg(c, "#2e7ac4", "#9bd6ff"); c.fillStyle = "#3a9b4a"; c.fillRect(0, H - 200, W, 200); c.fillStyle = "#2c7a3a"; c.fillRect(0, H - 200, W, 10); R.ob.forEach(function(o){ c.fillStyle = "#e0654f"; c.fillRect(o.x - o.w / 2, H - 200 - o.h, o.w, o.h); c.fillStyle = "#fff"; c.fillRect(o.x - o.w / 2, H - 200 - o.h, o.w, 6); }); E(c, "🏃", 80, H - 222 - R.y, 44); hud(c, Math.ceil(R.left()) + "s"); },
        ai: function(R, i){ var sp = 270 * (1 + R.lv * .1); R.ob.forEach(function(o){ var d = o.x - 80; if(d > 0 && d < sp * .3 && R.y <= 0) i.tap = true; }); }});

    // ⑩ シュート！
    RR.add({id: "shoot", em: "🚀", time: 13, type: "goal", n: N("うちおとせ！", "Blast Off", "击落", "격추!"), how: N("ブロックを 10こ うちおとそう！ したまで おちたら だめ！", "Shoot down 10 blocks! Don't let any reach the bottom!", "击落10个方块！别让它们落到底部！", "블록 10개 격추! 바닥에 닿으면 안 돼요!"),
        setup: function(R){ R.sx = W / 2; R.bl = []; R.en = []; R.fire = 0; R.sp = .3; R.need = 10; },
        update: function(R, dt, i){
            var k = 1 + R.lv * .12; R.sx = cl(R.sx + cl(i.x - R.sx, -600 * dt, 600 * dt), 24, W - 24);
            R.fire -= dt; if(R.fire <= 0){ R.bl.push({x: R.sx, y: H - 90}); R.fire = .2; }
            R.sp -= dt; if(R.sp <= 0){ R.en.push({x: R.ri(40, 360), y: -20, r: 22}); R.sp = .8 / k; }
            R.bl.forEach(function(b){ b.y -= 560 * dt; }); R.bl = R.bl.filter(function(b){ return b.y > -20; });
            R.en.forEach(function(e){ e.y += 74 * k * dt; });
            for(var a = R.en.length - 1; a >= 0; a--){ var e = R.en[a], hit = false; for(var b = R.bl.length - 1; b >= 0; b--){ if(Math.abs(R.bl[b].x - e.x) < e.r * R.sz + 8 && Math.abs(R.bl[b].y - e.y) < e.r + 10){ R.bl.splice(b, 1); hit = true; break; } } if(hit){ R.en.splice(a, 1); R.score++; R.fx(e.x, e.y, "#ffb02e"); R.sfx("hit"); if(R.score >= R.need){ R.win(); return; } continue; } if(e.y > H - 70){ R.lose("pass"); R.sfx("boom"); return; } }
        },
        draw: function(R, c){ bg(c, "#10163a", "#05060f"); c.fillStyle = "#fff"; for(var s = 0; s < 30; s++) c.fillRect((s * 97) % W, (s * 53 + R.t * 40) % H, 2, 2); R.bl.forEach(function(b){ c.fillStyle = "#7ae6ff"; c.fillRect(b.x - 2, b.y - 8, 4, 16); }); R.en.forEach(function(e){ c.fillStyle = "#c46bff"; c.fillRect(e.x - e.r * R.sz, e.y - e.r, e.r * 2 * R.sz, e.r * 2); c.fillStyle = "#fff"; c.fillRect(e.x - 8, e.y - 6, 5, 5); c.fillRect(e.x + 3, e.y - 6, 5, 5); }); E(c, "🚀", R.sx, H - 70, 40); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ var t = null; R.en.forEach(function(e){ if(!t || e.y > t.y) t = e; }); i.x = t ? t.x : W / 2; i.y = H - 70; }});

    // ⑪ つみあげ
    RR.add({id: "stack", em: "🏗️", time: 13, type: "goal", n: N("つみあげろ", "Stack Up", "叠高高", "쌓아 올려"), how: N("タップで ブロックを おとして 5だん つもう！", "Tap to drop blocks and stack 5 high!", "点击放下方块，叠5层！", "터치로 블록을 떨어뜨려 5단 쌓기!"),
        setup: function(R){ R.lay = [{x: W / 2, w: 150}]; R.cx = 40; R.dir = 1; R.cw = 150; R.need = 5; },
        update: function(R, dt, i){
            var sp = 190 * (1 + R.lv * .15), half = R.cw / 2; R.cx += R.dir * sp * dt; if(R.cx > W - half){ R.cx = W - half; R.dir = -1; } if(R.cx < half){ R.cx = half; R.dir = 1; }
            if(i.tap){ var p = R.lay[R.lay.length - 1], lo = Math.max(R.cx - half, p.x - p.w / 2), hi = Math.min(R.cx + half, p.x + p.w / 2), ov = hi - lo;
                if(ov <= 10){ R.lose("miss"); R.sfx("ng"); return; } R.lay.push({x: (lo + hi) / 2, w: ov}); R.cw = ov; R.score++; R.sfx("ok"); R.fx((lo + hi) / 2, H - 90 - R.lay.length * 34, "#ffe36a"); if(R.score >= R.need) R.win(); }
        },
        draw: function(R, c){ bg(c, "#233a63", "#0b1426"); var base = H - 80; R.lay.forEach(function(b, k){ c.fillStyle = "hsl(" + (k * 48) + ",70%,60%)"; c.fillRect(b.x - b.w / 2, base - k * 34 - 30, b.w, 30); }); c.fillStyle = "hsl(" + (R.lay.length * 48) + ",75%,65%)"; c.fillRect(R.cx - R.cw / 2, base - R.lay.length * 34 - 30 - 12, R.cw, 30); hud(c, R.score + " / " + R.need); },
        ai: function(R, i){ var p = R.lay[R.lay.length - 1]; if(Math.abs(R.cx - p.x) < 5) i.tap = true; }});

    // ⑫ ふうせん われ！
    RR.add({id: "balloon", em: "🎈", time: 12, type: "goal", n: N("ふうせん われ！", "Pop Balloons", "戳气球", "풍선 터뜨리기"), how: N("ふうせんを 10こ われ！ 4こ にげられたら アウト", "Pop 10 balloons! 4 escapes and you're out.", "戳破10个气球！跑掉4个就输。", "풍선 10개 터뜨리기! 4개 놓치면 아웃"),
        setup: function(R){ R.bs = []; R.sp = .2; R.need = 10; R.esc = 0; },
        update: function(R, dt, i){
            var k = 1 + R.lv * .1; R.sp -= dt; if(R.sp <= 0){ R.bs.push({x: R.ri(40, 360), y: H + 30, v: R.ri(95, 140) * k, c: R.ri(0, 4)}); R.sp = .62 / k; }
            R.bs.forEach(function(b){ b.y -= b.v * dt; });
            for(var q = R.bs.length - 1; q >= 0; q--){ if(R.bs[q].y < -40){ R.bs.splice(q, 1); R.esc++; R.sfx("ng"); if(R.esc >= 4){ R.lose("escaped"); return; } } }
            if(i.tap){ for(var a = R.bs.length - 1; a >= 0; a--){ var b = R.bs[a]; if(dist(i.x, i.y, b.x, b.y) < 34 * R.sz + 8){ R.bs.splice(a, 1); R.score++; R.fx(b.x, b.y, "#ffd23a"); R.sfx("pop"); if(R.score >= R.need) R.win(); break; } } }
        },
        draw: function(R, c){ bg(c, "#4aa3e8", "#bfe6ff"); var cs = ["#ff5d7a", "#ffd23a", "#46d17a", "#b46bff", "#ff9a3a"]; R.bs.forEach(function(b){ c.fillStyle = cs[b.c]; c.beginPath(); c.ellipse(b.x, b.y, 26 * R.sz, 32 * R.sz, 0, 0, 6.3); c.fill(); c.fillStyle = "rgba(255,255,255,.45)"; c.beginPath(); c.ellipse(b.x - 8 * R.sz, b.y - 11 * R.sz, 6 * R.sz, 9 * R.sz, 0, 0, 6.3); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x, b.y + 32 * R.sz); c.lineTo(b.x + 3, b.y + 52 * R.sz); c.stroke(); }); hud(c, R.score + " / " + R.need + "   ✕" + R.esc + " / 4"); },
        ai: function(R, i){ var t = null; R.bs.forEach(function(b){ if(!t || b.y < t.y) t = b; }); if(t){ i.x = t.x; i.y = t.y; i.tap = true; } }});
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
