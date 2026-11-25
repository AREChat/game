// AREUSO ボット：画面なしで 戦って ステージを クリアできるか 調べる
(function(){
    var US = global.US || window.US;
    function make(skill, seed){
        var rnd = US.rngf(seed || 7), react = 0, wantAtk = 0, strongT = 0, guardT = 0, jitter = 0;
        return function(B, dt){
            var P = B.P, inp = {mx: 0, mz: 0, weak: false, strong: false, jump: false, dodge: false, musou: false, guard: false};
            if(P.dead || B.state !== "play") return inp;
            react -= dt; strongT -= dt; jitter -= dt;
            // 目標
            var st = B.st, tx = null, tz = null, tgt = null, bd = 1e9, i, e;
            var alive = B.E.filter(function(x){ return x.alive; });
            var offs = alive.filter(function(x){ return x.off; });
            if(offs.length){ tgt = offs.slice().sort(function(a, b){ return Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z); })[0]; }
            else if(st.goal === "gens" && alive.some(function(x){ return x.gen; })){ tgt = alive.filter(function(x){ return x.gen; })[0]; }
            if(!tgt && st.goal === "bases"){ var bs = B.bases.filter(function(b){ return !b.done; })[0]; if(bs){ tx = bs.x; tz = bs.z; var nn = alive.filter(function(x){ return Math.hypot(x.x - P.x, x.z - P.z) < 5; }); if(Math.hypot(P.x - bs.x, P.z - bs.z) < bs.r * .6 && nn.length === 0){ tx = P.x; tz = P.z; } if(nn.length) tgt = nn[0]; else tgt = null; } }
            if(!tgt && tx === null){ for(i = 0; i < alive.length; i++){ e = alive[i]; var d = Math.hypot(e.x - P.x, e.z - P.z); if(e.gen) continue; if(d < bd){ bd = d; tgt = e; } } }
            if(tgt){ tx = tgt.x; tz = tgt.z; }
            var dist = tx === null ? 0 : Math.hypot(tx - P.x, tz - P.z);
            // 危険（よこく）を よける
            var danger = null;
            for(i = 0; i < alive.length; i++){ e = alive[i]; if((e.st === "windup" || e.st === "atk") && !e.gen){ var dd = Math.hypot(e.x - P.x, e.z - P.z); var lim = e.off ? 6.5 : e.type === "brute" ? 4.2 : e.type === "archer" ? 0 : 2.4; if(e.act === "dash") lim = 12; if(dd < lim && (e.wt < .22 || e.st === "atk")){ danger = e; } } }
            for(i = 0; i < B.PR.length; i++){ var p = B.PR[i]; if(Math.hypot(p.x - P.x, p.z - P.z) < 2.8) danger = danger || {x: p.x, z: p.z, pr: 1}; }
            var skillOk = rnd() < Math.pow(skill, 1.6);
            if(danger && P.dodgeCd <= 0 && skillOk && react <= 0){ inp.dodge = true; var a = Math.atan2(danger.x - P.x, danger.z - P.z) + 1.4; inp.mx = Math.sin(a); inp.mz = Math.cos(a); react = .5 - skill * .3; return inp; }
            // 無双
            var around = alive.filter(function(x){ return Math.hypot(x.x - P.x, x.z - P.z) < 8; }).length;
            if(P.mus >= 100 && (around >= 4 || offs.length) || (P.mus >= 50 && P.hp < P.maxhp * .4 && around >= 2)){ if(rnd() < .5 + skill * .5) inp.musou = true; }
            // 移動
            var dx = tx === null ? 0 : tx - P.x, dz = tz === null ? 0 : tz - P.z, dl = Math.hypot(dx, dz) || 1;
            var mv = B.h.weak[0], reach = Math.max(1.4, mv.range * .8);
            if(tx !== null){
                if(dist > reach){ inp.mx = dx / dl; inp.mz = dz / dl; }
                else { inp.mx = dx / dl * .1; inp.mz = dz / dl * .1; }
                // 武将の 近くで 危ない ときは 少し はなれる
                if(tgt && tgt.off && tgt.st === "windup" && dist < 3.5){ inp.mx = -dx / dl; inp.mz = -dz / dl; }
            }
            // 攻撃
            if(tx !== null && dist < reach + (tgt ? tgt.r : 0) + 1.2){
                if((P.st === "idle" || P.st === "atk") && rnd() < .35 + skill * .65){
                    if(strongT <= 0 && P.st === "idle" && rnd() < .25){ inp.strong = true; strongT = 2 + rnd() * 2; }
                    else inp.weak = true;
                }
            } else if(P.st === "idle" && B.E.length && rnd() < .01) inp.jump = true;
            if(P.hp < P.maxhp * .3 && alive.some(function(x){ return !x.off && Math.hypot(x.x - P.x, x.z - P.z) < 3 && x.st === "windup"; }) && rnd() < skill * .3) inp.guard = true;
            return inp;
        };
    }
    global.USBOT = {make: make};
})();
