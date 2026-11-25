"use strict";
/* 20歳の冒険：ゲームのしくみ（画面なし。Node でも ブラウザでも うごく）
   ・1年＝52週。1週に「平日」「週末」の2つの行動 → 週のおわりに せいかつひ・習慣 → イベント。
   ・状態 S は ただの JSON（乱数も S.rs に ふくめる）なので、とちゅうセーブ・再現ができる。
   ・文章は ぜんぶ N(ja,en,zh,ko)。虫は 出さない（なし）。 */
(function(root){
    var AD = root.AD = root.AD || {};
    function N(ja, en, zh, ko){ return {ja: ja, en: en, zh: zh, ko: ko}; }
    AD.N = N; AD.LANGS = ["ja", "en", "zh", "ko"]; AD.lang = function(){ return "ja"; };
    AD.EV = []; AD.EVMAP = {}; AD.JOBS = []; AD.JOBMAP = {}; AD.ACTS = []; AD.ACTMAP = {}; AD.DEST = []; AD.DESTMAP = {}; AD.SIDES = []; AD.SIDEMAP = {};
    AD.CH = {}; AD.BGS = []; AD.BGMAP = {}; AD.ENDS = []; AD.ENDMAP = {}; AD.ACH = []; AD.DYN = {}; AD.TX = {};
    AD.STATS = ["money", "hp", "mp", "hlt", "knw", "chm", "skl", "soc", "fame", "gam", "drk", "smk"];
    var CAP = {money: [-1e9, 1e9], hp: [0, 100], mp: [0, 100], hlt: [0, 100], knw: [0, 100], chm: [0, 100], skl: [0, 100], soc: [0, 100], fame: [0, 1e9], gam: [0, 100], drk: [0, 100], smk: [0, 100]};
    AD.OK = N("つぎへ", "Next", "继续", "다음");

    // ---- 登録ヘルパ ----
    AD.E = function(id, cfg, title, body, ch){
        if(AD.EVMAP[id]) throw new Error("dup event " + id);
        var e = {id: id, cfg: cfg || {}, title: title, body: body, ch: ch && ch.length ? ch : [AD.C(AD.OK, [AD.O(1, {})])]};
        AD.EV.push(e); AD.EVMAP[id] = e; return e;
    };
    AD.C = function(t, o, opt){ opt = opt || {}; return {t: t, o: o, need: opt.need || null, chk: opt.chk || null, hint: opt.hint || null}; };
    AD.O = function(p, fx, txt, ex){ return {p: p, fx: fx || {}, txt: txt || null, ex: ex || {}}; };
    // かんたん版：Q(id, cfg, title, body, [ラベル, fx, 文章, ex, opt], ...)  各選択肢は 結果ひとつ
    AD.Q = function(id, cfg, title, body){
        var ch = [].slice.call(arguments, 4).map(function(a){ return AD.C(a[0], [AD.O(1, a[1], a[2], a[3])], a[4]); });
        return AD.E(id, cfg, title, body, ch);
    };
    // 判定つき： X(label, 成功[fx,txt,ex], 失敗[fx,txt,ex], chk)
    AD.X = function(label, ok, ng, chk, opt){ opt = opt || {}; opt.chk = chk; return AD.C(label, [AD.O(1, ok[0], ok[1], ok[2]), AD.O(1, ng[0], ng[1], ng[2])], opt); };
    AD.reg = function(list, map, arr){ arr.forEach(function(x){ if(map[x.id]) throw new Error("dup " + x.id); list.push(x); map[x.id] = x; }); };
    // 日付 → 週ばんごう（1月 第2週 = 0）
    AD.W = function(m, d){ var t0 = Date.UTC(2027, 0, 11), t = Date.UTC(2027, m - 1, d); return Math.max(0, Math.min(51, Math.floor((t - t0) / 864e5 / 7))); };
    AD.cal = function(wk){
        var d = new Date(Date.UTC(2027, 0, 11 + wk * 7)), m = d.getUTCMonth() + 1, day = d.getUTCDate();
        var season = (m >= 3 && m <= 5) ? "spring" : (m >= 6 && m <= 8) ? "summer" : (m >= 9 && m <= 11) ? "autumn" : "winter";
        return {m: m, d: day, nth: Math.ceil(day / 7), season: season};
    };

    // ---- 乱数（S にもつ） ----
    function rnd(S){ S.rs = (S.rs + 0x6D2B79F5) | 0; var t = Math.imul(S.rs ^ (S.rs >>> 15), 1 | S.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function ri(S, a, b){ return a + Math.floor(rnd(S) * (b - a + 1)); }
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
    AD.rnd = rnd; AD.ri = ri; AD.clamp = clamp;
    function pickW(S, arr, wf){ var tot = 0, i; for(i = 0; i < arr.length; i++) tot += wf(arr[i]); var r = rnd(S) * tot; for(i = 0; i < arr.length; i++){ r -= wf(arr[i]); if(r <= 0) return arr[i]; } return arr[arr.length - 1]; }
    AD.pickW = pickW;

    // ---- 状態 ----
    AD.newRun = function(o){
        var bg = AD.BGMAP[o.bg] || AD.BGS[0], seed = (o.seed || 1) >>> 0;
        var S = {v: 1, seed: seed, rs: seed || 1, daily: !!o.daily, name: o.name || "", bg: bg.id, week: 0, phase: "wd", done: {}, flags: {}, cnt: {}, rel: {}, vis: {}, pend: [], q: [], log: [], slot: {}, wkWork: 0, absent: 0, side: null, job: bg.job || null, jobWk: 0, lowMp: 0, hist: {}, endId: null, over: false, lastAct: {}, money0: bg.st.money, rep: {}};
        AD.STATS.forEach(function(k){ S[k] = 0; });
        for(var k in bg.st) S[k] = bg.st[k];
        for(k in bg.rel || {}) S.rel[k] = bg.rel[k];
        for(k in bg.flags || {}) S.flags[k] = 1;
        return S;
    };
    function snap(S){ var s = {}; AD.STATS.forEach(function(k){ s[k] = S[k]; }); s.rel = JSON.parse(JSON.stringify(S.rel)); return s; }
    function diff(b, S){ var d = {}; AD.STATS.forEach(function(k){ var v = Math.round(S[k]) - Math.round(b[k]); if(v) d[k] = v; }); var rd = {}; for(var id in S.rel){ var v2 = Math.round(S.rel[id] - (b.rel[id] || 0)); if(v2) rd[id] = v2; } if(Object.keys(rd).length) d.rel = rd; return d; }
    AD.snap = snap; AD.diff = diff;
    // 能力（知識・魅力・技術・人脈）は のびるほど のびにくい（1年で すべてを 100 には できない）
    var GROW = {knw: 1, chm: 1, skl: 1, soc: 1};
    AD.GAIN = .33;
    function add(S, k, v){
        var c = CAP[k]; if(!c) throw new Error("bad stat " + k);
        if(v > 0 && GROW[k]) v *= AD.GAIN * clamp(1.2 - S[k] / 100, .22, 1);
        S[k] = clamp(S[k] + v, c[0], c[1]);
    }
    AD.add = add;
    // 効果を適用（fx: 数値 / ex: フラグ・ジョブ・つぎのイベントなど）
    AD.apply = function(S, fx, ex){
        var k;
        for(k in fx){
            if(k === "rel"){ for(var id in fx.rel){ if(!AD.CH[id]) throw new Error("bad char " + id); S.rel[id] = clamp((S.rel[id] || 0) + fx.rel[id], 0, 100); } }
            else add(S, k, fx[k]);
        }
        ex = ex || {};
        if(ex.set) [].concat(ex.set).forEach(function(f){ S.flags[f] = 1; });
        if(ex.clr) [].concat(ex.clr).forEach(function(f){ delete S.flags[f]; });
        if(ex.cnt) for(k in ex.cnt) S.cnt[k] = (S.cnt[k] || 0) + ex.cnt[k];
        if("job" in ex){ S.job = ex.job; S.jobWk = 0; S.absent = 0; }
        if(ex.side) S.side = ex.side;
        if(ex.end) S.endId = ex.end;
        if(ex.q) S.q.push({id: ex.q[0], at: S.week + (ex.q[1] || 1)});
        if(ex.go) S.pend.unshift(ex.go);
        if(ex.sv) S.cnt[ex.sv] = Math.max(S.cnt[ex.sv] || 0, 1);
    };

    // ---- イベントの えらびかた ----
    function evOf(S, id){ var e = AD.EVMAP[id]; if(e) return e; if(AD.DYN[id]) return AD.DYN[id](S); throw new Error("no event " + id); }
    AD.evOf = evOf;
    function elig(S, e, src){
        var c = e.cfg;
        if((c.src || "week") !== src) return false;
        if(c.wk && (S.week < c.wk[0] || S.week > c.wk[1])) return false;
        var d = S.done[e.id];
        if(!c.rep && d != null) return false;
        if(c.rep && d != null && S.week - d < (c.cd || 8)) return false;
        if(c.bg && c.bg.indexOf(S.bg) < 0) return false;
        if(c.job && c.job.indexOf(S.job) < 0) return false;
        if(c.ctx && c.ctx.indexOf(S._ctx) < 0) return false;
        if(c.need && !c.need(S)) return false;
        return true;
    }
    AD.elig = elig;
    // src の イベントを 1つ えらぶ（なければ null）
    AD.pickEvent = function(S, src){
        var pool = [];
        for(var i = 0; i < AD.EV.length; i++){ var e = AD.EV[i]; if(!e.cfg.fix && !e.cfg.crisis && elig(S, e, src)) pool.push(e); }
        if(!pool.length) return null;
        return pickW(S, pool, function(e){ var w = e.cfg.w == null ? 1 : e.cfg.w; if(e.cfg.boost && e.cfg.boost(S)) w *= 3; return w; });
    };
    // 週のおわりの イベント一覧
    AD.weekEvents = function(S){
        var out = [], i, e;
        // 予約（つづき）
        for(i = S.q.length - 1; i >= 0; i--){ if(S.week >= S.q[i].at){ out.unshift(S.q[i].id); S.q.splice(i, 1); } }
        // 固定の日付イベント
        for(i = 0; i < AD.EV.length; i++){ e = AD.EV[i]; if(e.cfg.fix && elig(S, e, "week")) out.push(e.id); }
        // きけん（ピンチ）イベント
        for(i = 0; i < AD.EV.length; i++){ e = AD.EV[i]; if(e.cfg.crisis && elig(S, e, "week")) out.push(e.id); }
        out = out.filter(function(id, k){ return out.indexOf(id) === k; });
        var maxEv = 2;
        if(out.length < maxEv && rnd(S) < (out.length ? .35 : .78)){ e = AD.pickEvent(S, "week"); if(e && out.indexOf(e.id) < 0) out.push(e.id); }
        return out.slice(0, 3);
    };
    // 行動のあとの イベント（src = 行動 id / しごと id / 旅さき）
    AD.actEvent = function(S, src, prob){
        if(rnd(S) >= prob) return null;
        var e = AD.pickEvent(S, src); return e ? e.id : null;
    };
    AD.choiceOk = function(S, ch){ return !ch.need || !!ch.need(S); };
    AD.chkProb = function(S, chk){
        var p = chk.base == null ? .4 : chk.base; (chk.s || []).forEach(function(s){ p += (chk.k == null ? .01 : chk.k) * S[s]; });
        if(chk.rel) p += .004 * (S.rel[chk.rel] || 0);
        var k2; if(chk.f) for(k2 in chk.f) if(S.flags[k2]) p += chk.f[k2];
        if(chk.c) for(k2 in chk.c) p += chk.c[k2] * Math.min(20, S.cnt[k2] || 0);
        return clamp(p, .05, .95);
    };
    AD.choose = function(S, e, i){
        var ch = e.ch[i], before = snap(S), o, chkInfo = null;
        if(ch.chk){ var p = AD.chkProb(S, ch.chk), win = rnd(S) < p; o = win ? ch.o[0] : ch.o[1]; chkInfo = {p: p, win: win}; }
        else o = pickW(S, ch.o, function(x){ return x.p; });
        AD.apply(S, o.fx, o.ex);
        S.done[e.id] = S.week; S.hist[e.id] = i;
        var r = {o: o, d: diff(before, S), chk: chkInfo};
        S.log.push({w: S.week, e: e.id, c: i});
        if(S.log.length > 400) S.log.shift();
        return r;
    };

    // ---- 行動 ----
    AD.avail = function(S, slot){
        return AD.ACTS.filter(function(a){ return a.slots.indexOf(slot) >= 0; }).map(function(a){
            var why = a.can ? a.can(S) : null; return {id: a.id, ok: !why, why: why};
        });
    };
    AD.act = function(S, slot, id, arg){
        var a = AD.ACTMAP[id]; if(!a) throw new Error("no action " + id);
        var why = a.can ? a.can(S) : null; if(why) throw new Error("not available: " + id + " " + (why.ja || why));
        var before = snap(S), res = a.run(S, arg, slot) || {};
        S.slot[slot] = id; S.lastAct[id] = S.week; S.cnt["a_" + id] = (S.cnt["a_" + id] || 0) + 1;
        if(res.fx || res.ex) AD.apply(S, res.fx || {}, res.ex || {});
        var evs = [];
        if(res.ev){ evs.push(res.ev); }
        S.pend.push.apply(S.pend, evs);
        S.phase = slot === "wd" ? "we" : "end";
        return {id: id, slot: slot, txt: res.txt || null, d: diff(before, S), ev: res.ev || null, tag: res.tag || null};
    };

    // ---- 週のおわり：せいかつひ・習慣 ----
    AD.endWeek = function(S){
        var rep = {lines: [], d: null}, b = snap(S), bg = AD.BGMAP[S.bg], cal = AD.cal(S.week);
        // 生活費
        var food = bg.food != null ? bg.food : 5500; add(S, "money", -food);
        if(S.week % 4 === 3){ add(S, "money", -(bg.rent + 3000)); if(bg.allow) add(S, "money", bg.allow); rep.lines.push(AD.TX.rent); }
        // 習慣
        if(S.smk >= 15){ add(S, "money", -(1200 + S.smk * 20)); add(S, "hlt", -1.2); rep.lines.push(AD.TX.smk); }
        if(S.drk >= 30){ add(S, "money", -1000); add(S, "hlt", -.6); }
        if(S.drk > 0 && S.slot.we !== "party") S.drk = Math.max(0, S.drk - .6);
        if(S.gam > 0 && S.slot.we !== "pachinko") S.gam = Math.max(0, S.gam - 1);
        if(S.smk > 0 && !S.flags.smoker) S.smk = Math.max(0, S.smk - 1);
        // 借金の利息
        if(S.money < 0){ S.money = Math.round(S.money * 1.007); rep.lines.push(AD.TX.debt); }
        // しごとを休みつづけると
        if(S.job){
            var worked = S.wkWork > 0;
            S.absent = worked ? 0 : S.absent + 1; S.jobWk = worked ? S.jobWk + 1 : S.jobWk;
            var j = AD.JOBMAP[S.job];
            if(S.absent >= (j.tier === "full" ? 3 : 4)){ S.pend.push("fired"); }
            else if(S.absent === 2 && j.tier === "full") S.pend.push("absent_warn");
        }
        S.wkWork = 0;
        // 回復
        var healthy = S.hlt >= 40;
        add(S, "hp", healthy ? 8 : 4); add(S, "mp", S.slot.we === "rest" || S.slot.wd === "rest" ? 0 : -1);
        if(S.hp > 70 && S.drk < 20 && S.smk < 15) add(S, "hlt", 1);
        if(S.slot.we !== "friends" && S.slot.we !== "party" && S.slot.wd !== "network") add(S, "soc", -.5);
        if(S.mp <= 0) S.lowMp++; else S.lowMp = 0;
        if(S.hp <= 8 && !S.flags.collapsed_wk) S.flags.collapsed_wk = 1; else if(S.hp > 20) delete S.flags.collapsed_wk;
        rep.d = diff(b, S); rep.cal = cal;
        // イベント
        S.pend.push.apply(S.pend, AD.weekEvents(S));
        // かさなった「おなじイベント」を へらす
        S.pend = S.pend.filter(function(id, k){ return S.pend.indexOf(id) === k; });
        S.phase = "ev";
        return rep;
    };
    AD.nextEv = function(S){
        while(S.pend.length){
            var id = S.pend.shift(), e;
            try{ e = evOf(S, id); }catch(_e){ continue; }
            if(!e) continue;
            return e;
        }
        return null;
    };
    AD.crisis = function(S){
        if(S.endId) return S.endId;
        if(S.money < -450000) return "bankrupt";
        if(S.hlt <= 0) return "hospital";
        if(S.lowMp >= 3) return "burnout";
        return null;
    };
    // 1週すすめる。おわりなら エンディング id を かえす
    AD.advance = function(S){
        var c = AD.crisis(S);
        if(c){ S.over = true; S.endId = c; return c; }
        S.minM = Math.min(S.minM || 0, S.money);
        S.week++; S.slot = {}; S.phase = "wd";
        if(S.week >= 52){ S.over = true; S.endId = AD.final(S); return S.endId; }
        return null;
    };
    // ---- 点数・エンディング ----
    AD.score = function(S){
        var s = 0;
        s += clamp(S.money / 20000, -30, 60);
        s += (S.knw + S.chm + S.skl + S.soc) / 4;
        s += S.hlt * .2 + S.mp * .15 + S.hp * .05;
        s += Math.min(25, Math.log10(1 + S.fame) * 5);
        for(var id in S.rel) s += S.rel[id] / 20;
        s += Object.keys(S.vis).length * 1.5;
        s -= S.gam * .25 + S.drk * .15 + S.smk * .15;
        return Math.round(s);
    };
    AD.rank = function(sc){ return sc >= 170 ? "S" : sc >= 135 ? "A" : sc >= 100 ? "B" : sc >= 65 ? "C" : "D"; };
    AD.final = function(S){
        var list = AD.ENDS.filter(function(e){ return e.kind === "final"; }).sort(function(a, b){ return a.pri - b.pri; });
        for(var i = 0; i < list.length; i++){ if(list[i].t(S)) return list[i].id; }
        return "ordinary";
    };
    AD.achieved = function(S){ return AD.ACH.filter(function(a){ try{ return a.t(S); }catch(_e){ return false; } }).map(function(a){ return a.id; }); };
    // 文章の {n} {w} {d} に 入れる ことば
    AD.vars = function(S, lang){
        var l = lang || AD.lang(), v = {n: Math.abs(Math.round(S.cnt.pachiNet || 0)).toLocaleString("en-US")};
        var c = AD.CH[S._ctx]; if(c) v.w = c.n[l] != null ? c.n[l] : c.n.ja;
        var d = AD.DESTMAP[S._ctx]; if(d) v.d = d.n[l] != null ? d.n[l] : d.n.ja;
        return v;
    };
    // 文章を 今の言語に（{me} などを 名前に）
    AD.txt = function(S, n, lang, vars){
        if(n == null) return "";
        if(typeof n === "string") return n;
        var l = lang || AD.lang(), s = n[l] != null ? n[l] : n.ja;
        return String(s).replace(/\{(\w+)\}/g, function(m, k){
            if(vars && vars[k] != null) return vars[k];
            if(k === "me") return S && S.name ? S.name : (AD.TX.me ? AD.TX.me[l] : "You");
            var c = AD.CH[k]; if(c) return c.n[l] != null ? c.n[l] : c.n.ja;
            return m;
        });
    };
    if(typeof module !== "undefined" && module.exports) module.exports = AD;
})(typeof window !== "undefined" ? window : globalThis);
