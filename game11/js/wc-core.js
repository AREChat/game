"use strict";
/* ことばクラフト：物理の せかい（画面なし。ブラウザでも Node でも 動く）
   ・Matter.js（MIT）で 物理 / このファイルで「ことばの ふるまい」（風・水・磁石・爆弾・ばね・大砲…）を 足す
   ・create(stage, placements) で せかいを つくり、step(n) で すすめる。同じ ならべ方 なら いつも 同じ けっかに なる（テストできる）
   ・たいせつな ルール：ほし(★)が ゴールの 中に 0.15びょう とどまれば クリア。ようがん・がけ下 は ミス。 */
(function(root){
    var M = root.Matter || (typeof require !== "undefined" ? require("../vendor/matter.min.js") : null);
    var DICT = root.WCDict || (typeof require !== "undefined" ? require("./wc-dict.js") : null);
    var Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite, Constraint = M.Constraint, Events = M.Events, Bounds = M.Bounds;
    var W = 960, H = 540, RAD = Math.PI / 180;

    function create(stage, placements){
        var engine = Engine.create({positionIterations: 8, velocityIterations: 6});
        engine.gravity.y = 1;
        var G = engine.gravity.y * engine.gravity.scale;          // 1ステップで おちる ちから（重さ1あたり）
        var w = {idle: 0, glueCount: 0, engine: engine, stage: stage, steps: 0, status: "run", reason: "", winSteps: 0, objs: [], zones: [], events: [], star: null, goal: stage.goal, nextId: 1, pending: [], used: 0, G: G, W: W, H: H};

        // --- じめん・かべ ---
        (stage.statics || []).forEach(function(s){
            if(Array.isArray(s)) s = {x: s[0], y: s[1], w: s[2], h: s[3], a: s[4] || 0};
            var b = Bodies.rectangle(s.x, s.y, s.w, s.h, {isStatic: true, angle: (s.a || 0) * RAD, friction: s.ice ? .01 : .8, frictionStatic: 0, restitution: 0, label: "static"});
            b.plugin.st = s; Composite.add(engine.world, b);
        });
        w.lava = (stage.lava || []).map(function(l){ return Array.isArray(l) ? {x: l[0], y: l[1], w: l[2], h: l[3], a: l[4] || 0} : l; });
        // --- ほし ---
        var sp = stage.star;
        var star = Bodies.circle(sp.x, sp.y, 16, {density: .0012, friction: sp.fr == null ? 0 : sp.fr, frictionStatic: 0, restitution: .25, frictionAir: .0006, label: "star"});
        star.plugin.metal = 1; star.plugin.isStar = 1; w.star = star; Composite.add(engine.world, star);
        if(sp.vx || sp.vy) Body.setVelocity(star, {x: sp.vx || 0, y: sp.vy || 0});

        // --- あらかじめ ある もの ---
        (stage.preset || []).forEach(function(p){ addObj(w, p, true); });
        (placements || []).forEach(function(p){ if(!p.t) { addObj(w, p); w.used++; } else w.pending.push(p); });
        w.pending.sort(function(a, b){ return a.t - b.t; });

        Events.on(engine, "collisionStart", function(ev){ ev.pairs.forEach(function(pr){ onCollide(w, pr.bodyA, pr.bodyB); onCollide(w, pr.bodyB, pr.bodyA); }); });
        return w;
    }

    function addObj(w, p, locked){
        var res = DICT.make(p.w || p.word || p.text);
        if(res.err) return null;
        var t = res.spec; if(p.fixed){ t.fixed = 1; } var x = p.x, y = p.y, a = (p.a != null ? p.a : (t.a0 || 0));
        var o = {id: w.nextId++, spec: t, x: x, y: y, a: a, body: null, zone: null, t0: w.steps, locked: !!locked, label: t.label, pi: p.i, removed: false, burn: 0, cons: [], timer: -1, glued: 0, word: p.w || p.word || p.text};
        var eng = w.engine, opt, b;
        if(t.shape === "zone"){
            o.zone = {kind: t.kind, x: x, y: y, w: t.w, h: t.h, a: a, acc: t.acc || 0, color: t.color, o: o};
            w.zones.push(o.zone);
        }else{
            opt = {angle: a * RAD, friction: t.friction == null ? .6 : t.friction, restitution: t.restitution == null ? .05 : t.restitution, frictionAir: t.air != null ? t.air : .01, label: "obj"};
            if(t.density) opt.density = t.density;
            if(t.fixed) opt.isStatic = true;
            if(t.friction === 0) opt.frictionStatic = 0;
            if(t.friction >= 3) opt.frictionStatic = 8;
            if(t.shape !== "circle" && !t.fixed && Math.min(t.w, t.h) >= 8) opt.chamfer = {radius: Math.min(6, Math.min(t.w, t.h) / 2 - 1)};
            if(t.ramped && t.w > 60){ opt.chamfer = null; b = Bodies.trapezoid(x, y, t.w, t.h, Math.min(.9, 2 * Math.min(26, t.w * .25) / t.w), opt); }
            else b = t.shape === "circle" ? Bodies.circle(x, y, t.r, opt) : Bodies.rectangle(x, y, t.w, t.h, opt);
            b.plugin.o = o; if(t.metal) b.plugin.metal = 1;
            o.body = b; Composite.add(eng.world, b);
            if(t.kind === "balloon"){
                var tc = Constraint.create({pointA: {x: x, y: y + 46}, bodyB: b, length: 46, stiffness: .9, damping: .1}); o.cons.push(tc); o.tether = tc; Composite.add(eng.world, tc);
            }
            if(t.kind === "fan"){
                var d = {x: Math.cos(a * RAD), y: Math.sin(a * RAD)}, off = t.w / 2 + t.zw / 2;
                o.zone = {kind: "wind", x: x + d.x * off, y: y + d.y * off, w: t.zw, h: t.zh, a: a, acc: t.acc, color: "#cfefff", o: o, fan: 1};
                w.zones.push(o.zone);
            }else if(t.kind === "swing"){
                var half = t.w / 2 - 6, rope = t.rope;
                [-1, 1].forEach(function(s){ var c = Constraint.create({pointA: {x: x + s * half, y: y - rope}, bodyB: b, pointB: {x: s * half, y: 0}, length: rope, stiffness: 1, damping: .02}); o.cons.push(c); Composite.add(eng.world, c); });
                o.anchors = [{x: x - half, y: y - rope}, {x: x + half, y: y - rope}];
            }else if(t.kind === "seesaw"){
                var c2 = Constraint.create({pointA: {x: x, y: y}, bodyB: b, pointB: {x: 0, y: 0}, length: 0, stiffness: 1}); o.cons.push(c2); Composite.add(eng.world, c2);
                o.pivot = {x: x, y: y};
            }
        }
        w.objs.push(o);
        return o;
    }

    function removeObj(w, o, why){
        if(o.removed) return; o.removed = true;
        if(o.body) Composite.remove(w.engine.world, o.body);
        o.cons.forEach(function(c){ Composite.remove(w.engine.world, c, true); });
        if(o.zone){ var i = w.zones.indexOf(o.zone); if(i >= 0) w.zones.splice(i, 1); }
        var px = o.body ? o.body.position.x : o.x, py = o.body ? o.body.position.y : o.y;
        w.events.push({type: why || "gone", x: px, y: py, o: o});
    }

    function onCollide(w, a, b){
        var oa = a.plugin && a.plugin.o, st = b.plugin && b.plugin.isStar;
        if(!oa || oa.removed) return;
        var k = oa.spec.kind;
        if(k === "spring" && !b.isStatic){
            var n = {x: Math.sin(a.angle), y: -Math.cos(a.angle)}, v = b.velocity, vn = v.x * n.x + v.y * n.y;
            if(vn < 1){
                var boost = oa.spec.boost || 1, kick = oa.spec.kick || 6, nv = {x: v.x - vn * n.x + n.x * (-vn * boost + kick), y: v.y - vn * n.y + n.y * (-vn * boost + kick)};
                Body.setVelocity(b, nv); w.events.push({type: "boing", x: a.position.x, y: a.position.y, o: oa});
            }
        }else if(k === "cannon" && st && oa.timer < 0){
            oa.timer = 8; oa.target = b;
        }else if(k === "balloon" && st && !oa.glued && w.glueCount < 4){
            w.glueCount = (w.glueCount || 0) + 1; oa.glued = 1;
            if(oa.tether){ Composite.remove(w.engine.world, oa.tether, true); oa.cons = oa.cons.filter(function(q){ return q !== oa.tether; }); oa.tether = null; }
            var c = Constraint.create({bodyA: a, bodyB: b, length: (a.circleRadius || 20) + 16 + 8, stiffness: .06, damping: .12}); oa.cons.push(c); Composite.add(w.engine.world, c);
            w.events.push({type: "glue", x: a.position.x, y: a.position.y, o: oa});
        }
    }

    // ---- ゾーンの なかか ----
    function inRect(z, px, py){
        var dx = px - z.x, dy = py - z.y, c = Math.cos(-z.a * RAD), s = Math.sin(-z.a * RAD), lx = dx * c - dy * s, ly = dx * s + dy * c;
        return Math.abs(lx) <= z.w / 2 && Math.abs(ly) <= z.h / 2;
    }

    function explode(w, o){
        var b = o.body, R = o.spec.rad, P = o.spec.power, c = b.position;
        w.events.push({type: "boom", x: c.x, y: c.y, r: R, o: o});
        Composite.allBodies(w.engine.world).forEach(function(t){
            if(t === b || t.isStatic) return;
            var dx = t.position.x - c.x, dy = t.position.y - c.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
            if(d > R) return;
            var f = P * Math.pow(1 - d / R, .7) / (1 + t.mass * .6);
            Body.setVelocity(t, {x: t.velocity.x + dx / d * f, y: t.velocity.y + dy / d * f - f * .15});
            var ob = t.plugin.o; if(ob && ob.spec.kind === "balloon" && d < R * .55) removeObj(w, ob, "pop");
        });
        removeObj(w, o, "gone");
    }

    function step(w, n){
        n = n || 1;
        for(var i = 0; i < n && w.status === "run"; i++) stepOne(w);
        return w;
    }

    function stepOne(w){
        var eng = w.engine, G = w.G, steps = w.steps;
        // ことばの あとから 足す もの
        while(w.pending.length && w.pending[0].t * 60 <= steps){ var p = w.pending.shift(); if(addObj(w, p)) w.used++; }
        var bodies = Composite.allBodies(eng.world), zones = w.zones;
        for(var bi = 0; bi < bodies.length; bi++){
            var b = bodies[bi]; if(b.isStatic) continue;
            var o = b.plugin.o, m = b.mass, px = b.position.x, py = b.position.y;
            // ゾーンの 効果
            for(var zi = 0; zi < zones.length; zi++){
                var z = zones[zi]; if(!inRect(z, px, py)) continue;
                if(z.kind === "wind"){ var ang = z.a * RAD; Body.applyForce(b, b.position, {x: Math.cos(ang) * m * z.acc, y: Math.sin(ang) * m * z.acc}); }
                else if(z.kind === "float"){ Body.applyForce(b, b.position, {x: 0, y: -m * G * .92}); }
                else if(z.kind === "water"){
                    Body.applyForce(b, b.position, {x: 0, y: -b.area * .0024 * G});
                    Body.setVelocity(b, {x: b.velocity.x * .965, y: b.velocity.y * .94});
                    if(!b.plugin.wet){ b.plugin.wet = 1; w.events.push({type: "splash", x: px, y: py}); }
                }
                
            }
            if(!zones.length || !b.plugin.wet) { /* nothing */ }
            if(b.plugin.wet && !zones.some(function(z){ return z.kind === "water" && inRect(z, px, py); })) b.plugin.wet = 0;
            if(!o) continue;
            var s = o.spec, k = s.kind;
            if(k === "balloon"){ Body.applyForce(b, b.position, {x: 0, y: -(b.area * s.lift)}); if(b.velocity.y < -1.6) Body.setVelocity(b, {x: b.velocity.x, y: -1.6}); }
            else if(k === "rocket"){ var age = steps - o.t0; if(age > 18 && age < 130){ Body.applyForce(b, b.position, {x: Math.cos(b.angle) * m * s.acc, y: Math.sin(b.angle) * m * s.acc}); o.flame = 1; } else o.flame = 0; }
            else if(k === "bird"){ var an = o.a * RAD; Body.applyForce(b, b.position, {x: 0, y: -m * G}); Body.setVelocity(b, {x: Math.cos(an) * s.fly, y: b.velocity.y * .9 + Math.sin(an) * s.fly * .1}); }
            else if(k === "bomb"){ if(steps - o.t0 >= s.fuse) { explode(w, o); continue; } }
            // 熱い もの は ほかの もえる ものを もやす
            if(s.hot){ for(var oj = 0; oj < w.objs.length; oj++){ var q = w.objs[oj]; if(q === o || q.removed || !q.body || !(q.spec.burn || q.spec.melt)) continue; if(Bounds.overlaps(b.bounds, q.body.bounds)) q.burn += 2; } }
        }
        // ひ：ゾーンに ふれている もえる ものは もえる（うごかない ものも）
        for(var fz = 0; fz < zones.length; fz++){
            var zf = zones[fz]; if(zf.kind !== "fire") continue;
            for(var fo = 0; fo < w.objs.length; fo++){
                var fq = w.objs[fo]; if(fq.removed || !fq.body || !(fq.spec.burn || fq.spec.melt)) continue;
                var bb = fq.body.bounds;
                if(bb.max.x > zf.x - zf.w / 2 && bb.min.x < zf.x + zf.w / 2 && bb.max.y > zf.y - zf.h / 2 && bb.min.y < zf.y + zf.h / 2) fq.burn += 1;
            }
        }
        // 磁石
        for(var oi = 0; oi < w.objs.length; oi++){
            var mo = w.objs[oi]; if(mo.removed || mo.spec.kind !== "magnet") continue;
            var mc = mo.body.position;
            for(var bj = 0; bj < bodies.length; bj++){
                var t = bodies[bj]; if(t.isStatic || !t.plugin.metal) continue;
                var dx = mc.x - t.position.x, dy = mc.y - t.position.y, d = Math.sqrt(dx * dx + dy * dy);
                if(d < mo.spec.rad && d > 1){ var f = t.mass * mo.spec.pull * (1 - d / mo.spec.rad); Body.applyForce(t, t.position, {x: dx / d * f, y: dy / d * f}); }
            }
        }
        // 大砲
        for(var ci = 0; ci < w.objs.length; ci++){
            var co = w.objs[ci]; if(co.removed || co.spec.kind !== "cannon" || co.timer < 0) continue;
            if(--co.timer <= 0){
                var tg = co.target, ca = co.body.angle, dir = {x: Math.cos(ca), y: Math.sin(ca)};
                if(tg && Math.hypot(tg.position.x - co.body.position.x, tg.position.y - co.body.position.y) < 80){
                    var off = co.spec.w / 2 + 22;
                    Body.setPosition(tg, {x: co.body.position.x + dir.x * off, y: co.body.position.y + dir.y * off});
                    Body.setVelocity(tg, {x: dir.x * co.spec.speed, y: dir.y * co.spec.speed});
                    w.events.push({type: "fire", x: co.body.position.x, y: co.body.position.y, o: co});
                }
                co.timer = -1;
            }
        }
        Engine.update(eng, 1000 / 60);
        w.steps++;
        // もえる・とける
        for(var ki = 0; ki < w.objs.length; ki++){
            var bo = w.objs[ki]; if(bo.removed) continue;
            var lim = bo.spec.melt ? 28 : 40;
            if(bo.burn >= lim) removeObj(w, bo, bo.spec.melt ? "melt" : "burnt");
            else if(bo.burn > 0 && (bo.spec.burn || bo.spec.melt)) bo.burn -= .35 > bo.burn ? bo.burn : .35;
            // 画面の そとへ でた もの は けす
            if(bo.body && !bo.removed){ var q2 = bo.body.position; if(q2.y > H + 400 || q2.x < -500 || q2.x > W + 500 || q2.y < -900) removeObj(w, bo, "gone"); }
        }
        // ほしが とまった（ほかの ものも うごいていない）→ 「とまった」と おしえる
        var spd = Math.hypot(w.star.velocity.x, w.star.velocity.y), anyMove = false;
        if(spd < .06 && !w.pending.length){
            for(var mi = 0; mi < w.objs.length && !anyMove; mi++){ var mq = w.objs[mi]; if(mq.removed || !mq.body || mq.body.isStatic) continue; if(Math.hypot(mq.body.velocity.x, mq.body.velocity.y) > .15 || mq.spec.kind === "balloon" || mq.spec.kind === "rocket" || mq.spec.kind === "bird" || mq.spec.kind === "bomb") anyMove = true; }
            w.idle = anyMove ? 0 : w.idle + 1;
        }else w.idle = 0;
        // ミスと クリア
        var sp = w.star.position;
        var sb = w.stage.sandbox, respawn = function(){ if(sb){ Body.setPosition(w.star, {x: w.stage.star.x, y: w.stage.star.y}); Body.setVelocity(w.star, {x: 0, y: 0}); Body.setAngularVelocity(w.star, 0); w.events.push({type: "respawn", x: w.stage.star.x, y: w.stage.star.y}); return true; } return false; };
        for(var li = 0; li < w.lava.length; li++){ if(inRect({x: w.lava[li].x, y: w.lava[li].y, w: w.lava[li].w, h: w.lava[li].h, a: w.lava[li].a || 0}, sp.x, sp.y)){ if(respawn()) return; w.status = "lose"; w.reason = "lava"; return; } }
        if(sp.y > H + 90 || sp.x < -90 || sp.x > W + 90 || sp.y < -400){ if(respawn()) return; w.status = "lose"; w.reason = "fall"; return; }
        var g = w.goal;
        if(g && Math.abs(sp.x - g.x) < g.w / 2 && Math.abs(sp.y - g.y) < g.h / 2){ if(++w.winSteps >= 8){ w.status = "win"; w.events.push({type: "win", x: g.x, y: g.y}); } }
        else w.winSteps = 0;
        if(w.status === "run" && w.idle > 150 && !sb){ w.status = "lose"; w.reason = "stuck"; }
    }

    function add(w, p){ var o = addObj(w, p); if(o) w.used++; return o; }

    /** ならべた ことば（placements）で せかいを つくり、maxSteps まで すすめて けっかを かえす（テスト用） */
    function simulate(stage, placements, maxSteps){
        var w = create(stage, placements); step(w, maxSteps || 1500);
        return {status: w.status, reason: w.reason, steps: w.steps, used: w.used};
    }

    root.WC = {create: create, step: step, add: add, simulate: simulate, inRect: inRect, W: W, H: H, removeObj: removeObj};
    if(typeof module !== "undefined" && module.exports) module.exports = root.WC;
})(typeof window !== "undefined" ? window : globalThis);
