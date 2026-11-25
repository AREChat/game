"use strict";
/* 人気者になろう：ゲームのしくみ（画面なし）。Node でも ブラウザでも うごく。
   状態 S は ただの JSON（乱数も S.rs）。虫は 出さない。 */
(function(root){
    var ST = root.ST = root.ST || {};
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
    ST.clamp = clamp;
    ST.rng = function(seed){ var a = (seed >>> 0) || 1; return function(){ a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    function rnd(S){ S.rs = (S.rs + 0x6D2B79F5) | 0; var t = Math.imul(S.rs ^ (S.rs >>> 15), 1 | S.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    ST.rnd = rnd;

    ST.newRun = function(o){
        var ty = ST.TYPES.filter(function(t){ return t.id === o.type; })[0] || ST.TYPES[0], seed = (o.seed || 1) >>> 0;
        var S = {v: 1, seed: seed, rs: seed || 1, name: o.name || "", type: ty.id, daily: !!o.daily, day: 1, ap: ST.AP, fans: 0, coins: 200, cond: 100, hlt: 100, gam: 0, drk: 0, smk: 0,
            st: {}, stars: {}, best: {}, gear: {outfit: 0, gear: 0, coach: 0, poster: 0, drink: 0}, streak: 0, maxStreak: 0, rk: 0, flags: {}, cnt: {}, rel: {rival: 0, mika: 0, haru: 0, master: 0}, done: {}, pend: [], story: {}, log: [], over: false, endId: null, pachiNet: 0, lastCh: null, hist: {}};
        ST.STATS.forEach(function(s){ S.st[s.id] = ty.st[s.id] || 8; });
        return S;
    };
    ST.rankIdx = function(S){ return ST.rankOf(S.fans); };
    ST.areaOpen = function(S, a){ return S.rk >= a.rk; };
    ST.openAreas = function(S){ return ST.AREAS.filter(function(a){ return ST.areaOpen(S, a); }); };

    // ミニゲームの「やさしさ」：能力・機材・コンディション
    ST.assist = function(S, stat){
        var a = clamp(S.st[stat] / 100, 0, 1) * .6 + .05 * S.gear.gear;
        if(S.cond < 25) a -= .2; else if(S.cond < 50) a -= .08;
        if(S.drk >= 60) a -= .05;
        return clamp(a, -.3, .8);
    };
    ST.fansMul = function(S){ return 1 + .06 * S.gear.outfit + .05 * S.gear.poster; };

    // チャレンジの けっか → ファン・コイン・★
    ST.STARMUL = [.15, 1, 2.1, 3.6]; ST.REPEAT = .35; ST.FANF = 1;
    ST.chDiff = function(ch){ return Math.min(1, .12 + .78 * ch.d + (ch.boss ? .04 : 0)); };   // 難しさを やわらげて 圧縮   // バランス調整用（g14-career.js で 検証）
    ST.starsOf = function(pct){ return pct >= 92 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0; };
    ST.reward = function(S, ch, pct, daily){
        var a = ST.AREAMAP[ch.area], st = ST.starsOf(pct), prev = S.stars[ch.id] || 0;
        var starMul = ST.STARMUL[st], h = S.hist[ch.id] || 0;
        var rep = (prev === 0 && st > 0) ? 2 : (st > prev ? 1.3 : Math.max(.04, ST.REPEAT / (1 + .3 * Math.max(0, h - (prev === 0 ? 0 : 1)))));
        var streakMul = 1 + Math.min(.4, S.streak * .04);
        var f = ST.FANF * a.base * ch.rv * (.35 + pct / 100) * starMul * rep * streakMul * ST.fansMul(S) * (daily ? 2 : 1);
        return {stars: st, fans: Math.round(f), first: prev === 0 && st > 0, improved: st > prev, coins: Math.round(Math.pow(f, .82) * .9)};
    };
    ST.applyChallenge = function(S, ch, pct, extra){
        extra = extra || {};
        var r = ST.reward(S, ch, pct, extra.daily), beforeR = S.rk, ar0 = ST.openAreas(S).length;
        S.fans += r.fans; S.coins += r.coins + (extra.coinsDelta || 0); if(S.coins < 0) S.coins = 0;
        if(r.stars > (S.stars[ch.id] || 0)) S.stars[ch.id] = r.stars;
        S.best[ch.id] = Math.max(S.best[ch.id] || 0, Math.round(pct));
        if(r.stars > 0){ S.streak++; S.maxStreak = Math.max(S.maxStreak, S.streak); } else S.streak = 0;
        S.cnt.chal = (S.cnt.chal || 0) + 1; S.cnt["t_" + ch.type] = (S.cnt["t_" + ch.type] || 0) + 1; if(r.stars === 3) S.cnt.s3 = (S.cnt.s3 || 0) + 1;
        if(extra.pachi){ S.pachiNet += extra.coinsDelta || 0; S.cnt.pachi = (S.cnt.pachi || 0) + 1; S.gam = Math.min(100, S.gam + 6); }
        if(ch.type === "cheers" || ch.id === "i2" || ch.id === "i4"){ S.drk = Math.min(100, S.drk + 3); }
        S.lastCh = ch.id; S.lastPct = pct;
        S.cond = clamp(S.cond - (ch.boss ? 11 : 8), 0, 100);
        S.ap--; S.fat = (S.fat || 0) + 1; S.hist[ch.id] = (S.hist[ch.id] || 0) + 1;
        var rk = ST.rankIdx(S); r.rankUp = []; for(var i = S.rk + 1; i <= rk; i++) r.rankUp.push(i);
        if(rk > S.rk) S.rk = rk;
        r.newAreas = ST.openAreas(S).slice(ar0);
        if(r.stars > 0 && ch.boss) S.flags["boss_" + ch.area] = 1;
        return r;
    };
    // 特訓：能力アップ
    ST.trainGain = function(S, tr, pct){
        var cur = S.st[tr.stat], g = (3 + 5 * pct / 100) * (1 - cur / 120) * (1 + .25 * S.gear.coach);
        return Math.max(.5, g);
    };
    ST.applyTrain = function(S, tr, pct){
        var g = ST.trainGain(S, tr, pct), before = Math.round(S.st[tr.stat]);
        S.st[tr.stat] = clamp(S.st[tr.stat] + g, 0, 100);
        S.cond = clamp(S.cond - 7, 0, 100); S.ap--; S.fat = (S.fat || 0) + 1; S.cnt.train = (S.cnt.train || 0) + 1;
        if(S.rel.master < 100) S.rel.master = clamp(S.rel.master + 1.5, 0, 100);
        return {gain: Math.round(S.st[tr.stat]) - before, now: Math.round(S.st[tr.stat]), g: g};
    };
    ST.rest = function(S){ S.cond = clamp(S.cond + 45, 0, 100); S.hlt = clamp(S.hlt + 3, 0, 100); S.fat = Math.max(0, (S.fat || 0) - ST.FAT_REST); S.ap--; S.cnt.rest = (S.cnt.rest || 0) + 1; };
    ST.buy = function(S, id){
        var it = ST.SHOPMAP[id], lv = S.gear[id] || 0;
        if(!it) return {ok: false, why: "bad"};
        if(!it.cons && lv >= it.max) return {ok: false, why: "max"};
        var p = it.price(lv); if(S.coins < p) return {ok: false, why: "poor"};
        S.coins -= p; S.gear[id] = lv + 1; return {ok: true, price: p};
    };
    ST.useDrink = function(S){ if(S.gear.drink <= 0) return false; S.gear.drink--; S.cond = clamp(S.cond + 40, 0, 100); return true; };

    // 休まずに 走り続けると 体に ガタが くる（ドクターストップ）
    // 「つかれ」：チャレンジ・特訓で たまり、やすむと へる。たまりすぎると 毎日 体力が けずられる
    ST.FAT_AT = 50; ST.FAT_REST = 15;
    ST.tired = function(S){ return (S.fat || 0) >= ST.FAT_AT - 10; };
    // ---- 1日の おわり ----
    ST.endDay = function(S){
        var rep = {day: S.day};
        S.cond = clamp(S.cond + 22, 0, 100);
        if(S.drk > 0) S.drk = Math.max(0, S.drk - 4);
        if(S.gam > 0) S.gam = Math.max(0, S.gam - 2);
        if(S.smk > 0 && !S.flags.smoker) S.smk = Math.max(0, S.smk - 2);
        if(S.smk >= 30){ S.hlt = clamp(S.hlt - 1.2, 0, 100); }
        if(S.drk >= 50){ S.hlt = clamp(S.hlt - 1, 0, 100); S.cond = clamp(S.cond - 8, 0, 100); }
        if(S.cond <= 10) S.hlt = clamp(S.hlt - 2, 0, 100); else if(S.cond >= 60) S.hlt = clamp(S.hlt + .8, 0, 100);
        if((S.fat || 0) > ST.FAT_AT) S.hlt = clamp(S.hlt - Math.min(3, (S.fat - ST.FAT_AT) * .04), 0, 100);
        S.fat = Math.max(0, (S.fat || 0) - .5);
        S.pend.push.apply(S.pend, ST.dayEvents(S));
        S.day++; S.ap = ST.AP;
        return rep;
    };
    ST.crisis = function(S){
        if(S.endId) return S.endId;
        if(S.hlt <= 0) return "hospital";
        if(S.gam >= 100 && S.coins < 30) return "hooked";
        if(S.rk >= ST.RANKS.length - 1) return "legend";
        return null;
    };
    ST.checkEnd = function(S){
        var c = ST.crisis(S); if(c){ S.over = true; S.endId = c; return c; }
        if(S.day > ST.DAYS){ S.over = true; S.endId = ST.finalEnd(S); return S.endId; }
        return null;
    };
    ST.vars = function(S){ return {me: S.name || ST.tx("suPh")}; };
    ST.txt = function(S, n){ return ST.t(n, ST.vars(S)); };

    // ---- イベント ----
    ST.dayEvents = function(S){
        var out = [], i, e;
        for(i = 0; i < ST.EV.length; i++){ e = ST.EV[i]; if(e.cfg.fix && ST.elig(S, e)) out.push(e.id); }
        if(rnd(S) < .62){
            var pool = ST.EV.filter(function(x){ return !x.cfg.fix && ST.elig(S, x); });
            if(pool.length){
                var tot = 0, pick = pool[pool.length - 1], r;
                pool.forEach(function(x){ tot += x.cfg.w || 1; });
                r = rnd(S) * tot;
                for(i = 0; i < pool.length; i++){ r -= pool[i].cfg.w || 1; if(r <= 0){ pick = pool[i]; break; } }
                out.push(pick.id);
            }
        }
        return out.filter(function(id, k){ return out.indexOf(id) === k; }).slice(0, 2);
    };
    ST.elig = function(S, e){
        var c = e.cfg, d = S.done[e.id];
        if(!c.rep && d != null) return false;
        if(c.rep && d != null && S.day - d < (c.cd || 12)) return false;
        if(c.day && (S.day < c.day[0] || S.day > c.day[1])) return false;
        if(c.rk && (S.rk < c.rk[0] || S.rk > c.rk[1])) return false;
        if(c.need && !c.need(S)) return false;
        return true;
    };
    ST.choiceOk = function(S, c){ return !c.need || !!c.need(S); };
    ST.fansPct = function(S, pct){ var base = Math.max(30 * (S.rk + 1), S.fans); return Math.round(base * pct / 100); };
    ST.choose = function(S, e, i){
        var c = e.ch[i], r = rnd(S), acc = 0, o = c.o[c.o.length - 1], k;
        for(k = 0; k < c.o.length; k++){ acc += c.o[k].p; if(r < acc){ o = c.o[k]; break; } }
        var fx = o.fx || {}, d = {};
        if(fx.f){ var v = ST.fansPct(S, fx.f); S.fans = Math.max(0, S.fans + v); d.fans = v; }
        if(fx.coins){ S.coins = Math.max(0, S.coins + fx.coins); d.coins = fx.coins; }
        if(fx.cond){ S.cond = clamp(S.cond + fx.cond, 0, 100); d.cond = fx.cond; }
        if(fx.hlt){ S.hlt = clamp(S.hlt + fx.hlt, 0, 100); d.hlt = fx.hlt; }
        if(fx.gam){ S.gam = clamp(S.gam + fx.gam, 0, 100); d.gam = fx.gam; }
        if(fx.drk){ S.drk = clamp(S.drk + fx.drk, 0, 100); d.drk = fx.drk; }
        if(fx.smk){ S.smk = clamp(S.smk + fx.smk, 0, 100); d.smk = fx.smk; }
        if(fx.st){ d.st = {}; for(k in fx.st){ S.st[k] = clamp(S.st[k] + fx.st[k], 0, 100); d.st[k] = fx.st[k]; } }
        if(fx.rel){ d.rel = {}; for(k in fx.rel){ S.rel[k] = clamp((S.rel[k] || 0) + fx.rel[k], 0, 100); d.rel[k] = fx.rel[k]; } }
        if(fx.ap){ S.ap = clamp(S.ap + fx.ap, 0, 5); d.ap = fx.ap; }
        if(o.set) [].concat(o.set).forEach(function(f){ S.flags[f] = 1; });
        if(o.clr) [].concat(o.clr).forEach(function(f){ delete S.flags[f]; });
        if(o.cnt) for(k in o.cnt) S.cnt[k] = (S.cnt[k] || 0) + o.cnt[k];
        if(o.go) S.pend.unshift(o.go);
        S.done[e.id] = S.day; S.log.push({d: S.day, e: e.id, c: i}); if(S.log.length > 200) S.log.shift();
        var rk = ST.rankIdx(S), up = []; for(k = S.rk + 1; k <= rk; k++) up.push(k); if(rk > S.rk) S.rk = rk;
        return {o: o, d: d, rankUp: up};
    };
    ST.nextEv = function(S){
        while(S.pend.length){ var id = S.pend.shift(), e = ST.EVMAP[id]; if(e) return e; }
        return null;
    };

    // ---- 点数・実績 ----
    ST.score = function(S){ return S.fans; };
    ST.achieved = function(S){ return ST.ACH.filter(function(a){ try{ return a.t(S); }catch(_e){ return false; } }).map(function(a){ return a.id; }); };
    ST.finalEnd = function(S){
        var list = ST.ENDS.filter(function(e){ return e.kind === "final"; }).sort(function(a, b){ return a.pri - b.pri; });
        for(var i = 0; i < list.length; i++) if(list[i].t(S)) return list[i].id;
        return "newcomer";
    };
    if(typeof module !== "undefined" && module.exports) module.exports = ST;
})(typeof window !== "undefined" ? window : globalThis);
