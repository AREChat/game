"use strict";
/* AREUSO：戦闘エンジン（画面なし）。座標は x,z の 平面（y は 高さ）。向き face は (sin f, cos f)。
   UI は US.step(B, dt, inp) を 毎フレーム 呼び、B.ev の イベントを 見て 演出を 出す。ボットで テストできる。 */
(function(){
    var US = window.US;
    var PI = Math.PI, TAU = PI * 2;
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
    function wrap(a){ while(a > PI) a -= TAU; while(a < -PI) a += TAU; return a; }
    function rngf(seed){ var s = seed >>> 0 || 1; return function(){ s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    US.rngf = rngf; US.wrap = wrap;
    var GEN = {n: US.P("ノイズの 発生源|Noise Generator|噪点发生源|노이즈 발생원"), hp: 450, r: 1.3};
    US.GEN = GEN;

    US.newBattle = function(o){
        var st = US.STAGEMAP[o.stage], h = US.HEROMAP[o.hero], diff = o.diff || 2;
        var hpM = [.8, 1, 1.3][diff - 1], dmM = [.7, 1, 1.25][diff - 1];
        var B = {st: st, h: h, diff: diff, hpM: hpM, dmM: dmM, rnd: rngf(o.seed || 1), t: 0, state: "intro", ev: [], E: [], PR: [], PK: [], bases: [], nid: 1,
            ko: 0, score: 0, dmgTaken: 0, combo: 0, comboT: 0, maxCombo: 0, spawnT: .5, offs: [], offSpawned: false, slow: {t: 0, s: 1}, hitstop: 0, shake: 0, clearT: 0, stats: null, genLeft: 0, basesDone: 0, flash: 0, att: 0, justDodges: 0};
        var hpP = Math.round(h.hp * [1.25, 1, .9][diff - 1]);
        B.P = {x: 0, z: 0, y: 0, vy: 0, face: 0, hp: hpP, maxhp: hpP, mus: 0, st: "idle", t: 0, ci: 0, comboWin: 0, queued: false, hitDone: false, mv: null, inv: 0, dodgeCd: 0, guard: false, vx: 0, vz: 0, dead: false, r: .5, tickN: 0, moving: false, hurtT: 0, mscale: 1};
        if(st.goal === "bases"){ for(var i = 0; i < st.bases; i++){ var a = (i / st.bases) * TAU + 1.0; B.bases.push({x: Math.sin(a) * st.r * .55, z: Math.cos(a) * st.r * .55, r: 6, prog: 0, done: false}); } }
        if(st.goal === "gens"){ for(var j = 0; j < st.gens; j++){ var a2 = (j / st.gens) * TAU + .5; var g = addEnemy(B, "gen", Math.sin(a2) * st.r * .55, Math.cos(a2) * st.r * .55); g.gen = true; B.genLeft++; } }
        if(st.goal === "king"){ spawnOfficers(B); }
        for(var k = 0; k < 6; k++) spawnNormal(B, 12 + B.rnd() * 10);
        return B;
    };
    US.begin = function(B){ B.state = "play"; };

    function ev(B, t, o){ o = o || {}; o.t = t; B.ev.push(o); if(B.ev.length > 400) B.ev.splice(0, 100); return o; }
    function addEnemy(B, type, x, z, off){
        var d = off ? US.OFFICERS[off] : US.EN[type] || GEN, hp = d.hp * B.hpM;
        var e = {id: B.nid++, type: type, off: off || null, x: x, z: z, y: 0, face: 0, hp: hp, maxhp: hp, r: d.r || .5, st: "chase", t: 0, cd: .6 + B.rnd(), wt: 0, stun: 0, air: 0, kx: 0, kz: 0, flash: 0, brk: 0, pi: 0, act: null, alive: true, phase: 0, armor: false, dx: 0, dz: 0, sx: B.rnd() < .5 ? 1 : -1, d: d};
        B.E.push(e); return e;
    }
    function spawnNormal(B, dist){
        var st = B.st, mix = st.mix, tot = 0, k;
        for(k in mix){ if(k === "brute" && countType(B, "brute") >= 2) continue; tot += mix[k]; }
        var r = B.rnd() * tot, type = "grunt";
        for(k in mix){ if(k === "brute" && countType(B, "brute") >= 2) continue; r -= mix[k]; if(r <= 0){ type = k; break; } }
        var best = null;
        for(var tries = 0; tries < 6; tries++){
            var a = B.rnd() * TAU, dd = dist || (st.r - 3), x = Math.sin(a) * Math.min(dd, st.r - 2) + B.P.x * 0, z = Math.cos(a) * Math.min(dd, st.r - 2);
            if(Math.hypot(x - B.P.x, z - B.P.z) >= 10){ best = [x, z]; break; } if(!best) best = [x, z];
        }
        var e = addEnemy(B, type, best[0], best[1]); e.spawnT = .5; return e;
    }
    function countType(B, type){ var n = 0; for(var i = 0; i < B.E.length; i++) if(B.E[i].alive && B.E[i].type === type) n++; return n; }
    function normalCount(B){ var n = 0; for(var i = 0; i < B.E.length; i++){ var e = B.E[i]; if(e.alive && !e.off && !e.gen) n++; } return n; }
    function spawnOfficers(B){
        B.offSpawned = true; var ids = B.st.off;
        ids.forEach(function(id, i){ var a = (ids.length > 1 ? (i ? 1 : -1) * .6 : 0) + PI * .15; var e = addEnemy(B, "officer", Math.sin(a) * B.st.r * .5, Math.cos(a) * B.st.r * .5, id); B.offs.push(e); e.armor = true; e.cd = 1.5; ev(B, "boss", {id: e.id, off: id, x: e.x, z: e.z}); });
    }

    /* ---------- 敵への ダメージ ---------- */
    function hurtEnemy(B, e, dmg, o){
        if(!e.alive) return 0; var P = B.P; o = o || {};
        var dx = P.x - e.x, dz = P.z - e.z, toP = Math.atan2(dx, dz);
        if(e.type === "shield" && !o.heavy && Math.abs(wrap(toP - e.face)) < 1.2 && e.st !== "stagger"){ dmg *= .12; ev(B, "block", {x: e.x, z: e.z, y: 1}); e.kx -= Math.sin(toP) * 1.5; e.kz -= Math.cos(toP) * 1.5; e.flash = .05; }
        else if(o.heavy && e.type === "shield" && e.st !== "stagger"){ e.st = "stagger"; e.t = 0; e.wt = 1.4; }
        if(e.st === "stagger") dmg *= 1.5;
        if(e.gen) dmg *= .9;
        e.hp -= dmg; e.flash = .1; B.score += dmg * .2;
        if(!o.noCombo){ B.combo++; B.comboT = 2.2; if(B.combo > B.maxCombo) B.maxCombo = B.combo; P.mus = Math.min(100, P.mus + (e.off ? .25 : .5) * (o.heavy ? 1.6 : 1) + (o.musou ? 0 : .2)); }
        var crit = o.crit;
        ev(B, "hit", {x: e.x, z: e.z, y: 1.2 + e.y, dmg: Math.round(dmg), big: !!o.heavy || !!o.launch, crit: crit, boss: !!e.off, gen: !!e.gen});
        if(o.heavy || o.launch) B.hitstop = Math.max(B.hitstop, e.off ? .07 : .05);
        if(e.hp <= 0){ killEnemy(B, e); return dmg; }
        if(e.gen) return dmg;
        var dirx = -Math.sin(toP), dirz = -Math.cos(toP);
        if(e.off){
            e.brk += dmg; var thr = e.maxhp * .22;
            if(e.brk >= thr && e.st !== "stagger"){ e.brk = 0; e.st = "stagger"; e.t = 0; e.wt = 1.7; e.act = null; ev(B, "stagger", {x: e.x, z: e.z, id: e.id}); }
            if(o.musou && e.st !== "stagger") e.brk += dmg * .6;
            e.kx += dirx * .4; e.kz += dirz * .4;
            if(e.d.phases){ var f = e.hp / e.maxhp, np = f < .34 ? 2 : f < .67 ? 1 : 0; if(np > e.phase){ e.phase = np; ev(B, "phase", {x: e.x, z: e.z, p: np}); for(var i = 0; i < 4; i++) spawnNormal(B, 14 + B.rnd() * 6); B.shake = 1; e.cd = .8; e.st = "chase"; e.act = null; } }
        } else if(e.type === "brute" && !o.launch && !o.heavy){ e.kx += dirx * .5; e.kz += dirz * .5; }
        else {
            var kb = o.launch ? 6 : o.heavy ? 5 : 2.6; e.kx += dirx * kb; e.kz += dirz * kb;
            if(e.st === "windup" || e.st === "atk"){ e.st = "chase"; e.act = null; e.cd = .5; }
            e.stun = Math.max(e.stun, o.launch ? 1.0 : o.heavy ? .8 : .35);
            if(o.launch && e.type !== "brute"){ e.air = .7; }
        }
        return dmg;
    }
    function killEnemy(B, e){
        e.alive = false; e.hp = 0; var P = B.P;
        if(e.gen){ B.genLeft--; ev(B, "gen", {x: e.x, z: e.z}); B.shake = 1; B.slow = {t: .5, s: .4}; P.mus = Math.min(100, P.mus + 15); return; }
        ev(B, "ko", {x: e.x, z: e.z, y: 1 + e.y, type: e.type, off: !!e.off, big: !!e.off}); B.ko++; B.score += e.d.score || 200;
        P.mus = Math.min(100, P.mus + (e.d.mus || 20));
        if(e.off){ B.slow = {t: 1.1, s: .25}; B.shake = 1.5; B.hitstop = .12; P.hp = Math.min(P.maxhp, P.hp + P.maxhp * .15); }
        else { var r = B.rnd(); if(r < .06) B.PK.push({x: e.x, z: e.z, k: "hp", life: 14}); else if(r < .15) B.PK.push({x: e.x, z: e.z, k: "mus", life: 14}); }
    }
    function damagePlayer(B, amt, o){
        var P = B.P; o = o || {};
        if(P.dead || P.st === "musou") return false;
        if(P.st === "dodge"){ if(!P.jd){ P.jd = true; B.justDodges++; P.mus = Math.min(100, P.mus + 7); B.slow = {t: .55, s: .35}; ev(B, "justdodge", {x: P.x, z: P.z}); } return false; }
        if(P.inv > 0) return false;
        if(o.air && P.y > .9) return false;
        var g = P.guard && P.st === "idle";
        if(g) amt *= .22; else amt = amt;
        P.hp -= amt; B.dmgTaken += amt; B.combo = 0; B.comboT = 0;
        ev(B, g ? "guard" : "hurt", {x: P.x, z: P.z, y: 1.2, dmg: Math.round(amt)});
        if(P.hp <= 0){ P.hp = 0; P.dead = true; P.st = "dead"; B.state = "dead"; ev(B, "dead", {x: P.x, z: P.z}); return true; }
        P.inv = g ? .35 : .7;
        if(!g){ P.st = "hurt"; P.t = 0; P.mv = null; var a = o.fx !== undefined ? Math.atan2(P.x - o.fx, P.z - o.fz) : P.face + PI; P.vx = Math.sin(a) * 5; P.vz = Math.cos(a) * 5; B.shake = Math.max(B.shake, .5); }
        return true;
    }

    /* ---------- プレイヤー ---------- */
    function nearestEnemy(B, x, z, maxd, dirx, dirz, cone){
        var best = null, bd = maxd;
        for(var i = 0; i < B.E.length; i++){ var e = B.E[i]; if(!e.alive) continue; var dx = e.x - x, dz = e.z - z, d = Math.hypot(dx, dz); if(d > bd) continue;
            if(cone !== undefined && d > 0.01){ var c = (dx * dirx + dz * dirz) / d; if(c < cone) continue; } best = e; bd = d; }
        return best;
    }
    function startAtk(B, mv, heavy, comboIdx){
        var P = B.P; P.st = "atk"; P.t = 0; P.mv = mv; P.heavy = heavy; P.hitDone = false; P.queued = false; P.ci = comboIdx;
        var mlen = Math.hypot(P.mx || 0, P.mz || 0), dx = mlen > .2 ? P.mx / mlen : Math.sin(P.face), dz = mlen > .2 ? P.mz / mlen : Math.cos(P.face);
        var t = nearestEnemy(B, P.x, P.z, mv.range + 3.5, dx, dz, .35);
        if(t){ P.face = Math.atan2(t.x - P.x, t.z - P.z); } else if(mlen > .2){ P.face = Math.atan2(dx, dz); }
        ev(B, "swing", {x: P.x, z: P.z, face: P.face, ci: comboIdx, heavy: heavy, w: B.h.w, range: mv.range, arc: mv.arc, dur: mv.dur, last: !heavy && comboIdx === B.h.weak.length - 1});
    }
    function playerHit(B){
        var P = B.P, mv = P.mv, hit = 0; P.hitDone = true;
        var list = B.E.slice();
        for(var i = 0; i < list.length; i++){
            var e = list[i]; if(!e.alive) continue; var dx = e.x - P.x, dz = e.z - P.z, d = Math.hypot(dx, dz);
            if(d > mv.range + e.r) continue;
            if(mv.arc < 360 && d > e.r + .3 && Math.abs(wrap(Math.atan2(dx, dz) - P.face)) > mv.arc * PI / 360) continue;
            var crit = B.rnd() < .1, dmg = mv.dmg * (crit ? 1.5 : 1) * (1 + Math.min(.25, B.combo * .004));
            hurtEnemy(B, e, dmg, {heavy: P.heavy, launch: !!mv.launch, crit: crit}); hit++;
        }
        if(hit) ev(B, "swinghit", {n: hit, heavy: P.heavy}); return hit;
    }
    function startMusou(B){
        var P = B.P; P.mscale = .6 + .4 * (P.mus / 100); P.mus = 0; P.st = "musou"; P.t = 0; P.tickN = 0; P.inv = 2.2; P.mv = null; P.guard = false;
        B.slow = {t: .6, s: .3}; B.flash = 1; B.shake = 1;
        ev(B, "musou", {x: P.x, z: P.z, w: B.h.w});
    }
    function musouTick(B, final){
        var P = B.P, m = B.h.musou, dmg = m.dmg * P.mscale * (final ? 2.4 : 1), R = m.radius * (final ? 1.2 : 1);
        var list = B.E.slice();
        for(var i = 0; i < list.length; i++){
            var e = list[i]; if(!e.alive) continue; var d = Math.hypot(e.x - P.x, e.z - P.z); if(d > R + e.r) continue;
            hurtEnemy(B, e, e.off ? dmg * .55 : dmg, {musou: true, launch: final, heavy: final, noCombo: false});
            if(final && !e.off && e.alive){ var a = Math.atan2(e.x - P.x, e.z - P.z); e.kx += Math.sin(a) * 9; e.kz += Math.cos(a) * 9; e.stun = 1.4; e.air = .9; }
        }
        ev(B, "musoutick", {x: P.x, z: P.z, r: R, final: !!final}); B.shake = Math.max(B.shake, final ? 1.6 : .5); if(final) B.hitstop = .1;
    }
    function updatePlayer(B, dt, inp){
        var P = B.P; if(P.dead) return;
        P.mx = inp.mx || 0; P.mz = inp.mz || 0;
        P.dodgeCd -= dt; P.inv -= dt; if(P.comboWin > 0) P.comboWin -= dt;
        // 重力
        if(P.y > 0 || P.vy > 0){ P.vy -= 26 * dt; P.y += P.vy * dt; if(P.y <= 0){ P.y = 0; P.vy = 0; } }
        var ml = Math.hypot(P.mx, P.mz); if(ml > 1){ P.mx /= ml; P.mz /= ml; ml = 1; }
        var h = B.h;
        if(P.st === "idle"){
            P.guard = !!inp.guard;
            if(inp.dodge && P.dodgeCd <= 0){
                P.st = "dodge"; P.t = 0; P.jd = false; var dx = ml > .2 ? P.mx / ml : Math.sin(P.face), dz = ml > .2 ? P.mz / ml : Math.cos(P.face);
                P.vx = dx * 15; P.vz = dz * 15; P.face = Math.atan2(dx, dz); P.inv = .1; P.dodgeCd = .5; P.guard = false; ev(B, "dodge", {x: P.x, z: P.z, face: P.face});
            } else if(inp.musou && P.mus >= 50){ startMusou(B); }
            else if(inp.strong && !P.guard){ startAtk(B, h.strong, true, 0); }
            else if(inp.weak && !P.guard){ var ci = P.comboWin > 0 ? (P.ci + 1) % h.weak.length : 0; startAtk(B, h.weak[ci], false, ci); }
            else if(inp.jump && P.y <= 0){ P.vy = 9; ev(B, "jump", {x: P.x, z: P.z}); }
            else {
                var sp = h.spd * (P.guard ? .4 : 1) * (P.y > 0 ? 1.05 : 1);
                P.moving = ml > .15;
                if(ml > .15){ P.x += P.mx * sp * dt; P.z += P.mz * sp * dt; var tf = Math.atan2(P.mx, P.mz); if(!P.guard) P.face += wrap(tf - P.face) * Math.min(1, dt * 16); }
            }
        } else if(P.st === "atk"){
            P.t += dt; var mv = P.mv;
            if(P.t < mv.dur * .6 && mv.lunge){ var lf = mv.lunge / (mv.dur * .6); P.x += Math.sin(P.face) * lf * dt; P.z += Math.cos(P.face) * lf * dt; }
            if(!P.hitDone && P.t >= mv.hit) playerHit(B);
            if(!P.heavy && P.t > mv.dur * .35 && inp.weak) P.queued = true;
            if(inp.musou && P.mus >= 50 && P.t > mv.hit){ startMusou(B); }
            else if(inp.dodge && P.dodgeCd <= 0 && P.t > mv.hit){ P.st = "idle"; P.comboWin = 0; B.P.mx = P.mx; B.P.mz = P.mz; updatePlayer(B, 0, {mx: P.mx, mz: P.mz, dodge: true}); return; }
            else if(P.t >= mv.dur){
                if(P.queued && !P.heavy){ var ni = (P.ci + 1) % h.weak.length; startAtk(B, h.weak[ni], false, ni); }
                else { P.st = "idle"; P.mv = null; P.comboWin = P.heavy ? 0 : .38; }
            }
        } else if(P.st === "dodge"){
            P.t += dt; var f = P.t < .22 ? 1 : 0; P.x += P.vx * f * dt; P.z += P.vz * f * dt; if(P.t > .1 && P.inv < .2) P.inv = .2;
            if(P.t >= .3){ P.st = "idle"; }
        } else if(P.st === "hurt"){
            P.t += dt; P.x += P.vx * Math.max(0, 1 - P.t * 4) * dt; P.z += P.vz * Math.max(0, 1 - P.t * 4) * dt; if(P.t >= .28) P.st = "idle";
        } else if(P.st === "musou"){
            P.t += dt; var n = Math.floor((P.t - .35) / .2); while(P.tickN <= n && P.tickN < 6){ musouTick(B, false); P.tickN++; }
            if(P.tickN === 6 && P.t >= 1.55){ musouTick(B, true); P.tickN = 7; }
            if(P.t >= 2.0){ P.st = "idle"; P.inv = Math.max(P.inv, .3); }
        }
        var rr = Math.hypot(P.x, P.z), lim = B.st.r - .8; if(rr > lim){ P.x *= lim / rr; P.z *= lim / rr; }
        if(B.comboT > 0){ B.comboT -= dt; if(B.comboT <= 0) B.combo = 0; }
    }

    /* ---------- 敵 ---------- */
    function enemyAttack(B, e, kind){
        var P = B.P, d = e.d, dm = (d.dmg || 8) * B.dmM * (e.off ? 1 : 1);
        var dist = Math.hypot(P.x - e.x, P.z - e.z);
        if(kind === "slash" || kind === "melee"){
            var range = (kind === "slash" ? 3.4 : d.range) + P.r + e.r * .5;
            if(dist <= range && Math.abs(wrap(Math.atan2(P.x - e.x, P.z - e.z) - e.face)) < 1.3) damagePlayer(B, kind === "slash" ? dm * 1.1 : dm, {air: true, fx: e.x, fz: e.z});
            ev(B, "enemyswing", {x: e.x, z: e.z, face: e.face, off: !!e.off});
        } else if(kind === "slam"){
            var R = e.off ? 5.2 : d.slam || 3;
            if(dist <= R + P.r) damagePlayer(B, dm * (e.off ? 1.4 : 1.2), {air: true, fx: e.x, fz: e.z});
            ev(B, "slam", {x: e.x, z: e.z, r: R});
        } else if(kind === "shoot"){
            var a = Math.atan2(P.x - e.x, P.z - e.z); e.face = a;
            B.PR.push({x: e.x, z: e.z, vx: Math.sin(a) * 15, vz: Math.cos(a) * 15, dmg: dm, life: 2.2, y: 1.2}); ev(B, "shoot", {x: e.x, z: e.z});
        } else if(kind === "fan"){
            var n = e.d.phases ? 7 : 5, a0 = Math.atan2(P.x - e.x, P.z - e.z);
            for(var i = 0; i < n; i++){ var a1 = a0 + (i - (n - 1) / 2) * .26; B.PR.push({x: e.x, z: e.z, vx: Math.sin(a1) * 13, vz: Math.cos(a1) * 13, dmg: dm * .55, life: 2.4, y: 1.2}); }
            ev(B, "shoot", {x: e.x, z: e.z, fan: true});
        } else if(kind === "summon"){
            for(var j = 0; j < 4; j++) if(normalCount(B) < B.st.cap + 4) spawnNormal(B, Math.max(8, Math.hypot(e.x, e.z) * .8 + B.rnd() * 6));
            ev(B, "summon", {x: e.x, z: e.z}); B.shake = .6;
        }
    }
    function updateEnemy(B, e, dt){
        var P = B.P; if(!e.alive) return;
        if(e.flash > 0) e.flash -= dt;
        if(e.gen){ e.t += dt; return; }
        e.t += dt;
        if(e.spawnT > 0){ e.spawnT -= dt; return; }
        // ノックバック
        if(e.kx || e.kz){ e.x += e.kx * dt * 3; e.z += e.kz * dt * 3; var dec = Math.max(0, 1 - dt * 6); e.kx *= dec; e.kz *= dec; if(Math.abs(e.kx) < .05) e.kx = 0; if(Math.abs(e.kz) < .05) e.kz = 0; }
        if(e.air > 0){ e.air -= dt; e.y = Math.sin(clamp(1 - e.air / .7, 0, 1) * PI) * 2.2; if(e.air <= 0) e.y = 0; }
        if(e.stun > 0){ e.stun -= dt; return; }
        var dx = P.x - e.x, dz = P.z - e.z, dist = Math.hypot(dx, dz) || .01, toP = Math.atan2(dx, dz), d = e.d;
        if(P.dead){ return; }
        var spdM = e.phase ? 1 + e.phase * .12 : 1;
        if(e.st === "stagger"){ e.wt -= dt; if(e.wt <= 0){ e.st = "chase"; e.cd = .5; } return; }
        if(e.st === "chase"){
            e.face += wrap(toP - e.face) * Math.min(1, dt * 8); e.cd -= dt;
            if(e.off){
                var want = 2.4;
                if(dist > want) { e.x += Math.sin(toP) * d.spd * spdM * dt; e.z += Math.cos(toP) * d.spd * spdM * dt; }
                if(e.cd <= 0){
                    var k = d.pat[e.pi++ % d.pat.length]; e.act = k; e.st = "windup"; e.wt = k === "slam" ? 1.0 : k === "dash" ? .75 : k === "fan" ? .8 : k === "summon" ? 1.0 : .6; e.wt0 = e.wt; e.lockA = toP;
                    ev(B, "telegraph", {id: e.id, x: e.x, z: e.z, kind: k, dur: e.wt, face: toP, off: true});
                }
            } else if(e.type === "archer"){
                if(dist < d.keep - 1.5){ e.x -= Math.sin(toP) * d.spd * dt; e.z -= Math.cos(toP) * d.spd * dt; }
                else if(dist > d.range * .85){ e.x += Math.sin(toP) * d.spd * dt; e.z += Math.cos(toP) * d.spd * dt; }
                else { var sa = toP + PI / 2 * e.sx; e.x += Math.sin(sa) * d.spd * .4 * dt; e.z += Math.cos(sa) * d.spd * .4 * dt; }
                if(e.cd <= 0 && dist <= d.range && B.shooters < 3){ e.act = "shoot"; e.st = "windup"; e.wt = d.wind; e.wt0 = e.wt; B.shooters++; ev(B, "telegraph", {id: e.id, x: e.x, z: e.z, kind: "shoot", dur: e.wt, face: toP}); }
            } else {
                var near = dist <= d.range * .95;
                if(!near){ var sp = d.spd * (dist > 14 ? 1.15 : 1); if(dist > d.range * 2.5 || B.att < 4){ e.x += Math.sin(toP) * sp * dt; e.z += Math.cos(toP) * sp * dt; } else { var sb = toP + PI / 2 * e.sx; e.x += Math.sin(sb) * sp * .45 * dt; e.z += Math.cos(sb) * sp * .45 * dt; } }
                if(near && e.cd <= 0 && B.att < 4){ e.act = e.type === "brute" ? "slam" : "melee"; e.st = "windup"; e.wt = d.wind; e.wt0 = e.wt; B.att++; ev(B, "telegraph", {id: e.id, x: e.x, z: e.z, kind: e.act, dur: e.wt, face: toP, r: d.slam}); }
            }
        } else if(e.st === "windup"){
            e.wt -= dt; if(e.wt > .18 && e.act !== "dash") e.face += wrap(toP - e.face) * Math.min(1, dt * 10); if(e.act === "dash" && e.wt > .2) e.lockA = toP;
            if(e.wt <= 0){
                if(e.act === "dash"){ e.st = "atk"; e.t = 0; e.dashT = .5; e.dashHit = false; e.face = e.lockA; ev(B, "dash", {x: e.x, z: e.z}); }
                else { enemyAttack(B, e, e.act); e.st = "chase"; e.cd = e.off ? (1.1 - e.phase * .15) : d.cd * (.8 + B.rnd() * .4); e.act = null; if(e.off) e.cd += 0; }
            }
        } else if(e.st === "atk"){
            e.dashT -= dt; var spd2 = 18 * spdM; e.x += Math.sin(e.lockA) * spd2 * dt; e.z += Math.cos(e.lockA) * spd2 * dt;
            if(!e.dashHit && Math.hypot(P.x - e.x, P.z - e.z) < e.r + P.r + .4){ e.dashHit = damagePlayer(B, d.dmg * B.dmM * 1.1, {air: true, fx: e.x, fz: e.z}) || true; }
            if(e.dashT <= 0){ e.st = "chase"; e.cd = 1.0; e.act = null; }
        }
        var rr = Math.hypot(e.x, e.z), lim = B.st.r - .5; if(rr > lim){ e.x *= lim / rr; e.z *= lim / rr; }
    }
    function separate(B){
        var E = B.E, n = E.length;
        for(var i = 0; i < n; i++){ var a = E[i]; if(!a.alive || a.gen) continue;
            for(var j = i + 1; j < n; j++){ var b = E[j]; if(!b.alive || b.gen) continue; var dx = b.x - a.x, dz = b.z - a.z, m = a.r + b.r; if(dx > m || dx < -m || dz > m || dz < -m) continue; var d = Math.hypot(dx, dz); if(d >= m || d < .001) { if(d < .001){ b.x += .02; } continue; } var p = (m - d) / 2 / d; a.x -= dx * p; a.z -= dz * p; b.x += dx * p; b.z += dz * p; } }
        var P = B.P; for(var k = 0; k < n; k++){ var e = E[k]; if(!e.alive) continue; var dx2 = e.x - P.x, dz2 = e.z - P.z, d2 = Math.hypot(dx2, dz2), m2 = e.r + P.r * .8; if(d2 < m2 && d2 > .001){ var q = (m2 - d2) / d2; e.x += dx2 * q; e.z += dz2 * q; } }
    }

    /* ---------- 進行 ---------- */
    US.step = function(B, dt, inp){
        if(B.state === "intro") return; inp = inp || {};
        if(B.state === "clear"){ B.clearT += dt; return; }
        if(B.state === "dead"){ B.t += dt * 0; for(var q = 0; q < B.E.length; q++){ B.E[q].flash = 0; } return; }
        if(dt > .1) dt = .1;
        B.t += dt; var P = B.P, st = B.st;
        if(B.shake > 0) B.shake = Math.max(0, B.shake - dt * 3); if(B.flash > 0) B.flash = Math.max(0, B.flash - dt * 2);
        updatePlayer(B, dt, inp);
        B.att = 0; B.shooters = 0; for(var i = 0; i < B.E.length; i++){ var e0 = B.E[i]; if(e0.alive && !e0.off && (e0.st === "windup" || e0.st === "atk")){ if(e0.type === "archer") B.shooters++; else B.att++; } }
        var list = B.E.slice(); for(i = 0; i < list.length; i++) updateEnemy(B, list[i], dt);
        separate(B);
        // 飛び道具
        for(i = B.PR.length - 1; i >= 0; i--){ var p = B.PR[i]; p.x += p.vx * dt; p.z += p.vz * dt; p.life -= dt; var hitP = !P.dead && Math.hypot(P.x - p.x, P.z - p.z) < .75;
            if(hitP && damagePlayer(B, p.dmg, {air: true, fx: p.x - p.vx, fz: p.z - p.vz})){ B.PR.splice(i, 1); continue; } if(hitP && P.st === "dodge"){ B.PR.splice(i, 1); continue; }
            if(p.life <= 0 || Math.hypot(p.x, p.z) > st.r + 4) B.PR.splice(i, 1); }
        // ひろいもの
        for(i = B.PK.length - 1; i >= 0; i--){ var k = B.PK[i]; k.life -= dt; if(!P.dead && Math.hypot(P.x - k.x, P.z - k.z) < 1.7){ if(k.k === "hp") P.hp = Math.min(P.maxhp, P.hp + P.maxhp * .09); else P.mus = Math.min(100, P.mus + 14); ev(B, "pickup", {x: k.x, z: k.z, k: k.k}); B.PK.splice(i, 1); } else if(k.life <= 0) B.PK.splice(i, 1); }
        // 拠点
        for(i = 0; i < B.bases.length; i++){ var b = B.bases[i]; if(b.done) continue;
            if(!P.dead && Math.hypot(P.x - b.x, P.z - b.z) < b.r){ var near = 0; for(var j = 0; j < B.E.length; j++){ var ee = B.E[j]; if(ee.alive && !ee.off && Math.hypot(ee.x - b.x, ee.z - b.z) < b.r) near++; } b.prog += dt * .1 * (1 - Math.min(.7, near * .1)); b.inside = true; } else { b.inside = false; b.prog = Math.max(0, b.prog - dt * .015); }
            if(b.prog >= 1){ b.done = true; b.prog = 1; B.basesDone++; P.hp = Math.min(P.maxhp, P.hp + P.maxhp * .2); P.mus = Math.min(100, P.mus + 20); ev(B, "base", {x: b.x, z: b.z}); } }
        // 湧き
        var offAlive = 0; for(i = 0; i < B.offs.length; i++) if(B.offs[i].alive) offAlive++;
        var cap = st.cap * (B.offSpawned ? (st.goal === "king" ? .6 : .55) : 1); if(st.goal === "king") cap = 10 + (offAlive ? 0 : 0);
        B.spawnT -= dt;
        if(B.spawnT <= 0){ B.spawnT = st.spawn * (.8 + B.rnd() * .4) * (B.offSpawned ? 1.6 : 1) * (B.diff === 1 ? 1.2 : B.diff === 3 ? .85 : 1); if(normalCount(B) < cap) spawnNormal(B); }
        if(st.goal === "gens"){ for(i = 0; i < B.E.length; i++){ var g = B.E[i]; if(g.gen && g.alive){ g.sp = (g.sp || 0) - dt; if(g.sp <= 0){ g.sp = 7; if(normalCount(B) < cap + 4){ var s = addEnemy(B, B.rnd() < .5 ? "grunt" : "shield", g.x + (B.rnd() - .5) * 4, g.z + (B.rnd() - .5) * 4); s.spawnT = .5; ev(B, "spawn", {x: s.x, z: s.z}); } } } } }
        // 武将の 出現
        if(!B.offSpawned){
            var ok = st.goal === "boss" ? B.ko >= st.ko : st.goal === "bases" ? B.basesDone >= st.bases : st.goal === "gens" ? B.genLeft <= 0 : st.goal === "duo" ? B.ko >= st.ko : false;
            if(ok) spawnOfficers(B);
        }
        // 掃除
        if(B.E.length > 80){ B.E = B.E.filter(function(e){ return e.alive; }); } else if(B.t % 3 < dt){ B.E = B.E.filter(function(e){ return e.alive || e.deadKeep; }); }
        // クリア
        if(B.offSpawned && B.offs.every(function(e){ return !e.alive; }) && B.state === "play"){
            B.state = "clear"; B.clearT = 0; for(i = 0; i < B.E.length; i++){ var ce = B.E[i]; if(ce.alive && !ce.gen){ ce.alive = false; ev(B, "ko", {x: ce.x, z: ce.z, y: 1, type: ce.type, quiet: true}); } }
            B.PR.length = 0; ev(B, "clear", {});
            var par = st.par, tm = Math.max(1, B.t), tp = clamp(par * .6 / tm, 0, 1) * 40, hp = clamp(1 - B.dmgTaken / (P.maxhp * 1.5), 0, 1) * 40, cp = clamp(B.maxCombo / 120, 0, 1) * 20, tot = tp + hp + cp;
            B.stats = {time: B.t, ko: B.ko, dmg: Math.round(B.dmgTaken), combo: B.maxCombo, pts: Math.round(tot), rank: tot >= 85 ? "S" : tot >= 68 ? "A" : tot >= 48 ? "B" : "C", score: Math.round(B.score)};
        }
    };
    US.progress = function(B){
        var st = B.st, o = {goal: st.goal, off: B.offSpawned};
        if(st.goal === "boss" || st.goal === "duo"){ o.cur = Math.min(B.ko, st.ko); o.max = st.ko; }
        else if(st.goal === "bases"){ o.cur = B.basesDone; o.max = st.bases; } else if(st.goal === "gens"){ o.cur = st.gens - B.genLeft; o.max = st.gens; }
        return o;
    };
})();
