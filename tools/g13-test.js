#!/usr/bin/env node
"use strict";
// 20歳の冒険 の 検証：全文4言語・効果の整合・ボットで 全エンディング到達・イベント発生率・お金の収支
//   node tools/g13-test.js [runsPerBot=20] [--quiet]
const fs = require("fs"), path = require("path");
global.window = global;
const root = path.join(__dirname, "..", "game13", "js");
const files = fs.readdirSync(root).filter(f => /^ad-(core|data|ev\d+|end)\.js$/.test(f)).sort((a, b) => { const o = f => f === "ad-core.js" ? 0 : f === "ad-data.js" ? 1 : f === "ad-end.js" ? 9 : 2; return o(a) - o(b) || a.localeCompare(b); });
delete global.AD; files.forEach(f => (0, eval)(fs.readFileSync(path.join(root, f), "utf8")));
const AD = global.AD, L = ["ja", "en", "zh", "ko"];
const RUNS = +(process.argv[2] || 20), QUIET = process.argv.includes("--quiet");
let fail = 0; const ng = m => { fail++; console.log("NG:", m); };

// ---------- 1. 構造チェック ----------
(function(){
    const stats = new Set(AD.STATS.concat(["rel"]));
    const chkN = (n, w) => { if(!n || typeof n !== "object") return ng(w + " なし"); L.forEach(l => { if(!n[l] || !String(n[l]).trim()) ng(w + " " + l + " が 空"); }); };
    const insect = /(蟲|昆虫|ムシ|カブト|クワガタ|ゴキ|ハチ[^ミ]|アリ[^が]|チョウチョ|蝶|蚊|蛾|蜘蛛|クモ|ミミズ|insect|beetle|cockroach|moth|spider|mosquito|butterfly|虫)/;
    const insectOK = /(虫歯|虫の知らせ)/;
    const allText = [];
    AD.EV.forEach(e => {
        chkN(e.title, e.id + ".title"); chkN(e.body, e.id + ".body"); allText.push(e.title, e.body);
        e.ch.forEach((c, i) => {
            chkN(c.t, e.id + ".c" + i); allText.push(c.t);
            if(!c.o.length) ng(e.id + " 選択肢 " + i + " の結果が ない");
            if(c.chk && c.o.length < 2) ng(e.id + " chk なのに 結果が 2つ ない");
            c.o.forEach((o, j) => {
                if(o.txt){ chkN(o.txt, e.id + ".c" + i + "o" + j); allText.push(o.txt); }
                for(const k in o.fx){ if(!stats.has(k)) ng(e.id + " 不明な効果 " + k); if(k === "rel") for(const r in o.fx.rel) if(!AD.CH[r]) ng(e.id + " 不明な人 " + r); }
                const ex = o.ex || {};
                if(ex.go && !AD.EVMAP[ex.go] && !AD.DYN[ex.go]) ng(e.id + " go 先が ない " + ex.go);
                if(ex.q && !AD.EVMAP[ex.q[0]] && !AD.DYN[ex.q[0]]) ng(e.id + " q 先が ない " + ex.q[0]);
                if(ex.end && !AD.ENDMAP[ex.end]) ng(e.id + " end が ない");
                if(ex.job && !AD.JOBMAP[ex.job]) ng(e.id + " job が ない " + ex.job);
            });
        });
    });
    AD.ACTS.forEach(a => { chkN(a.n, "act." + a.id); chkN(a.d, "act.d." + a.id); });
    AD.JOBS.forEach(j => chkN(j.n, "job." + j.id)); AD.DEST.forEach(d => chkN(d.n, "dest." + d.id)); AD.SIDES.forEach(s => chkN(s.n, "side." + s.id));
    AD.BGS.forEach(b => { chkN(b.n, "bg." + b.id); chkN(b.d, "bg.d." + b.id); }); Object.keys(AD.CH).forEach(k => { chkN(AD.CH[k].n, "ch." + k); chkN(AD.CH[k].role, "ch.role." + k); });
    AD.ENDS.forEach(e => { chkN(e.n, "end." + e.id); chkN(e.d, "end.d." + e.id); allText.push(e.n, e.d); });
    AD.ACH.forEach(a => { chkN(a.n, "ach." + a.id); chkN(a.d, "ach.d." + a.id); });
    // 虫の ことば（ja/en/zh/ko の すべて）
    allText.forEach(n => L.forEach(l => { const s = String(n[l] || ""); const m = s.replace(insectOK, "").match(insect); if(m) ng("虫の ことば？ [" + l + "] " + m[0] + " … " + s.slice(0, 40)); }));
    // 同じ id の 重複 / src の 有効性
    const srcOK = new Set(["week", "sys", "job", "study", "gym", "side", "sns", "create", "net", "friends", "party", "pachi", "trip", "date", "family", "hobby", "vol", "out"]);
    AD.EV.forEach(e => { if(!srcOK.has(e.cfg.src || "week")) ng(e.id + " src 不明 " + e.cfg.src); });
    console.log("構造: イベント", AD.EV.length, "／エンディング", AD.ENDS.length, "／実績", AD.ACH.length, "／行動", AD.ACTS.length, "／しごと", AD.JOBS.length, "／旅さき", AD.DEST.length, "／文章", allText.length, "（×4言語）");
})();

// ---------- 2. ボット ----------
const W_ = {money: 1 / 20000, hp: .05, mp: .15, hlt: .35, knw: .4, chm: .4, skl: .4, soc: .3, fame: 0, gam: -.6, drk: -.35, smk: -.4};
function util(S, o, tgt){
    let u = 0; const fx = o.fx || {};
    for(const k in fx){ if(k === "rel"){ for(const r in fx.rel) u += fx.rel[r] * .15; } else if(k === "fame") u += Math.log10(1 + Math.max(0, S.fame + fx.fame)) * 3 - Math.log10(1 + S.fame) * 3; else u += (tgt.w && tgt.w[k] != null ? tgt.w[k] : W_[k] || 0) * fx[k]; }
    const ex = o.ex || {};
    [].concat(ex.set || []).forEach(f => { if(tgt.flags && tgt.flags.indexOf(f) >= 0) u += 40; });
    if(ex.job !== undefined){ if(tgt.job && ex.job === tgt.job) u += 25; else if(ex.job === null) u += (tgt.job === null ? 40 : -25); else { const j = AD.JOBMAP[ex.job]; u += (tgt.fullJob && j && j.tier === "full") ? 12 : 2; } }
    if(ex.set && [].concat(ex.set).some(f => tgt.avoid && tgt.avoid.indexOf(f) >= 0)) u -= 60;
    return u;
}
function pickChoice(S, ev, tgt, rng){
    let best = -1, bu = -1e9;
    ev.ch.forEach((c, i) => {
        if(!AD.choiceOk(S, c)) return;
        let u = 0;
        if(c.chk){ const p = AD.chkProb(S, c.chk); u = p * util(S, c.o[0], tgt) + (1 - p) * util(S, c.o[1], tgt); }
        else { let tot = 0; c.o.forEach(o => tot += o.p); c.o.forEach(o => u += o.p / tot * util(S, o, tgt)); }
        u += rng() * (tgt.noise || 0.3);
        if(u > bu){ bu = u; best = i; }
    });
    if(best < 0) best = ev.ch.findIndex(c => AD.choiceOk(S, c));
    return best < 0 ? 0 : best;
}
function mkRng(seed){ let a = seed >>> 0 || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// 行動の えらびかた（ボットごと）
const can = (S, id, slot) => { const a = AD.ACTMAP[id]; return a && a.slots.indexOf(slot) >= 0 && !(a.can && a.can(S)); };
function bestSide(S){ const l = AD.SIDES.filter(s => S[s.stat] >= s.min && S.money >= s.stock); l.sort((a, b) => (b.base + S[b.stat] * b.per) - (a.base + S[a.stat] * a.per)); return l[0] && l[0].id; }
function nextTrip(S){ const l = AD.DEST.filter(d => !S.vis[d.id] && S.money >= d.cost + 25000).sort((a, b) => a.cost - b.cost); return l[0] && l[0].id; }
function safeWork(S){ return S.job && S.money < 60000; }
const BOTS = {
    random: {
        plan(S, slot, rng){ const l = AD.avail(S, slot).filter(a => a.ok && !(a.id === "pachinko")); return l[Math.floor(rng() * l.length)].id; },
        noise: 5
    },
    balanced: {
        plan(S, slot, rng){
            if(S.hp < 35 || S.mp < 25) return "rest";
            if(slot === "wd"){ if(S.job && S.money < 150000) return "work"; return ["study", "gym", "work", "create", "network"][Math.floor(rng() * 5)] === "work" && S.job ? "work" : ["study", "gym", "create", "sns"][Math.floor(rng() * 4)]; }
            if(S.job && S.money < 60000) return "work";
            return ["friends", "hobby", "outdoors", "family", "volunteer", "rest"][Math.floor(rng() * 6)];
        }},
    ceo: {flags: ["idea", "cofounder", "proto", "funded", "first_sale", "startup_ok"], avoid: ["startup_fail"], w: {skl: .7, soc: .5, chm: .5}, bg: "dream",
        plan(S, slot, rng){
            if(S.hp < 30 || S.mp < 22) return "rest";
            if(!S.flags.idea) return slot === "wd" ? (S.knw < 32 ? "study" : "create") : (S.job && S.money < 70000 ? "work" : "friends");
            if(!S.flags.cofounder) return slot === "we" ? "friends" : (S.job && S.money < 60000 ? "work" : "network");
            if(slot === "we") return S.job && S.money < 90000 ? "work" : (S.rel.ken < 40 ? "friends" : "create");
            return S.job && S.money < 50000 ? "work" : (S.skl < 60 ? "create" : "sns");
        }},
    streamer: {w: {fame: 0}, bg: "dream", plan(S, slot, rng){ if(S.hp < 28 || S.mp < 20) return "rest"; if(S.job && S.money < 40000) return "work"; return rng() < .8 ? "sns" : "create"; }},
    lover: {flags: ["lover_misa", "lover_sak"], bg: "univ", plan(S, slot, rng){
        if(S.hp < 30 || S.mp < 20) return "rest";
        if(slot === "we"){ if(can(S, "date", "we") && S.money > 15000) return "date"; if(S.job && S.money < 40000) return "work"; return "friends"; }
        return S.job && S.money < 60000 ? "work" : (rng() < .5 ? "gym" : "study"); }},
    bigcorp: {flags: ["offer_big"], bg: "univ", plan(S, slot, rng){
        if(S.hp < 30 || S.mp < 20) return "rest";
        if(slot === "wd"){ if((S.cnt.career || 0) < 4) return "career"; return S.knw < 60 ? "study" : (rng() < .5 ? "career" : "network"); }
        return S.job && S.money < 50000 ? "work" : (rng() < .5 ? "study" : "friends"); }},
    debut: {flags: ["debut"], bg: "voc", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 20) return "rest"; if(S.job && S.money < 40000) return "work"; return "create"; }},
    world: {bg: "newbie", plan(S, slot, rng){ if(S.hp < 30) return "rest"; if(slot === "we"){ const t = nextTrip(S); if(t && can(S, "trip", "we")) return "trip"; } return S.job ? "work" : "study"; },
        arg(S, id){ if(id === "trip") return nextTrip(S); }},
    license: {flags: ["license_plan", "license"], avoid: ["offer_big"], bg: "univ", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 20) return "rest"; if(slot === "we" && S.job && S.money < 40000) return "work"; return "study"; }},
    heir: {flags: ["heir_commit"], bg: "home", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 20) return "rest"; if(slot === "we") return rng() < .4 ? "family" : "friends"; return rng() < .6 ? "work" : "create"; }},
    scholar: {bg: "univ", avoid: ["offer_big", "license_plan", "license"], plan(S, slot, rng){ if(S.hp < 30 || S.mp < 15) return "rest"; if(S.job && S.money < 30000) return "work"; return "study"; }},
    network: {bg: "univ", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 15) return "rest"; if(slot === "wd") return S.job && S.money < 40000 ? "work" : "network"; return S.job && S.money < 40000 ? "work" : (rng() < .5 ? "friends" : "party"); }},
    athlete: {bg: "voc", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 15) return "rest"; if(S.job && S.money < 25000) return "work"; return rng() < .8 ? "gym" : "outdoors"; }},
    richsave: {bg: "newbie", fullJob: true, plan(S, slot, rng){ if(S.hp < 30 || S.mp < 20) return "rest"; if(slot === "we" && S.mp < 45) return "family"; return S.job ? "work" : "career"; }},
    quitsmoke: {flags: ["smoker", "quit_smoke"], avoid: ["offer_big","debut","startup_ok","license","heir_commit","lover_misa","lover_sak","promo"], bg: "free", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 25) return "rest"; if(S.job && S.money < 60000) return "work"; return slot === "we" ? (rng() < .5 ? "outdoors" : "friends") : (rng() < .6 ? "gym" : "work"); }},
    gamble: {bg: "free", avoid: ["offer_big","debut","startup_ok","license","heir_commit","lover_misa","lover_sak","promo"], plan(S, slot, rng){ if(S.hp < 20 || S.mp < 30) return "rest"; if(slot === "we" && S.money >= 3000) return "pachinko"; if(S.job && S.money < 12000) return "work"; return slot === "we" ? "rest" : "work"; }, bet(S){ return S.money >= 10000 ? 10000 : 3000; }},
    drunk: {bg: "free", avoid: ["offer_big","debut","startup_ok","license","heir_commit","lover_misa","lover_sak","promo"], plan(S, slot, rng){ if(S.hp < 25 || S.mp < 25) return "rest"; if(slot === "we") return S.money >= 8000 && S.week % 2 === 0 ? "party" : (S.job && S.money < 40000 ? "work" : "friends"); return S.job ? "work" : "rest"; }},
    lonely: {bg: "free", avoid: ["offer_big","debut","startup_ok","license","lover_misa","lover_sak","heir_commit","promo"], w: {soc: -.2}, plan(S, slot, rng){ if(S.mp < 15) return "rest"; if(slot === "wd") return S.job && S.money < 150000 ? "work" : "study"; return S.job && S.week % 2 ? "work" : "create"; }, noise: 0.5},
    steady: {bg: "newbie", flags: ["promo", "promo2"], avoid: ["offer_big","debut","startup_ok","license","lover_misa","lover_sak","heir_commit"], fullJob: true, plan(S, slot, rng){ if(S.hp < 30 || S.mp < 25) return "rest"; return slot === "we" ? (S.mp < 55 ? "rest" : "friends") : "work"; }},
    free: {bg: "free", job: null, avoid: ["offer_big","debut","startup_ok","license","lover_misa","lover_sak","heir_commit","promo"], plan(S, slot, rng){ if(S.hp < 30 || S.mp < 35) return "rest"; if(S.job && S.money >= 300000 && slot === "wd") return "career"; if(S.job && S.money < 400000) return "work"; if(slot === "we" && Object.keys(S.vis).length < 5){ const t = nextTrip(S); if(t && can(S, "trip", "we")) return "trip"; } return S.money < 120000 ? "side" : "hobby"; },
        arg(S, id){ if(id === "trip") return nextTrip(S); if(id === "side") return bestSide(S); }},
    happy: {bg: "univ", avoid: ["offer_big","debut","startup_ok","license","heir_commit","lover_misa","lover_sak","promo"], plan(S, slot, rng){ if(S.hp < 35 || S.mp < 30) return "rest"; if(S.job && S.money < 60000) return "work"; return slot === "we" ? ["friends", "hobby", "outdoors", "family"][Math.floor(rng() * 4)] : ["gym", "hobby", "sns", "work"][Math.floor(rng() * 4)]; }},
    quitter: {flags: ["startup_fail"], bg: "dream", plan(S, slot, rng){
        if(S.hp < 30 || S.mp < 22) return "rest";
        if(!S.flags.idea) return slot === "wd" ? (S.knw < 36 ? "study" : "create") : (S.job && S.money < 70000 ? "work" : "friends");
        if(!S.flags.cofounder) return slot === "we" ? "friends" : (S.job && S.money < 60000 ? "work" : "network");
        return S.job && S.money < 60000 ? "work" : (slot === "we" ? "friends" : "create"); }},
    lover_sak: {flags: ["lover_sak"], avoid: ["lover_misa"], bg: "univ", plan(S, slot, rng){
        if(S.hp < 30 || S.mp < 20) return "rest";
        if(slot === "we"){ if(can(S, "date", "we") && S.money > 12000) return "date"; if(S.job && S.money < 40000) return "work"; return "friends"; }
        return S.job && S.money < 60000 ? "work" : (rng() < .5 ? "gym" : "study"); }, date: "sak"},
    social: {bg: "univ", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 20) return "rest"; if(S.job && S.money < 40000) return "work"; return slot === "we" ? "friends" : (rng() < .5 ? "sns" : "network"); }},
    moderate: {bg: "free", plan(S, slot, rng){ if(S.hp < 30 || S.mp < 20) return "rest"; if(S.job && S.money < 60000) return "work"; return slot === "we" ? (rng() < .7 ? "party" : "friends") : (rng() < .4 ? "work" : "rest"); }},
    lazy: {bg: "free", avoid: ["offer_big","debut","startup_ok","license","heir_commit","lover_misa","lover_sak","promo"], plan(S, slot, rng){ if(S.job && S.money < 30000) return "work"; return rng() < .6 ? "rest" : "sns"; }},
    binge: {bg: "free", avoid: ["offer_big","debut","startup_ok","license","lover_misa","lover_sak","heir_commit","promo"], plan(S, slot, rng){ if(S.hp < 12) return "rest"; if(slot === "we") return S.money >= 6500 ? "party" : "work"; return S.job ? "work" : "rest"; }},
    heirchaos: {bg: "home", noise: 8, plan(S, slot, rng){ const l = AD.avail(S, slot).filter(a => a.ok && a.id !== "pachinko"); return l[Math.floor(rng() * l.length)].id; }},
    grind: {bg: "newbie", avoid: ["offer_big","debut","startup_ok","license","heir_commit","lover_misa","lover_sak","promo"], plan(S, slot, rng){ if(S.hp < 30 || S.mp < 12) return "rest"; return S.job ? "work" : "study"; }},
    legend: {bg: "newbie", avoid: ["offer_big","startup_ok","debut"], w: {knw: .6, chm: .6, skl: .6, soc: .5, hlt: .5}, plan(S, slot, rng){ if(S.hp < 35 || S.mp < 30) return "rest"; if(S.job && S.money < 100000) return "work"; return slot === "wd" ? ["study", "create", "network", "volunteer", "gym"][S.week % 5] : ["friends", "volunteer", "outdoors", "network"][S.week % 4] === "network" ? "friends" : ["friends", "volunteer", "outdoors", "network"][S.week % 4]; }},
    chaos: {bg: "free", plan(S, slot, rng){ const l = AD.avail(S, slot).filter(a => a.ok); return l[Math.floor(rng() * l.length)].id; }, bet(S){ return S.money >= 30000 ? 30000 : 3000; }, noise: 8}
};
function argFor(bot, S, id, rng){
    if(bot.arg){ const a = bot.arg(S, id); if(a != null) return a; }
    if(id === "side") return bestSide(S);
    if(id === "trip"){ const aff = AD.DEST.filter(d => S.money >= d.cost); const d = aff.sort((a, b) => (S.vis[a.id] ? 1 : 0) - (S.vis[b.id] ? 1 : 0) || a.cost - b.cost)[0]; return d && d.id; }
    if(id === "pachinko") return bot.bet ? bot.bet(S) : 3000;
    if(id === "date") return bot.date || (S.rel.sak >= S.rel.misa ? "sak" : "misa");
    return undefined;
}
const statLog = {};
const hits = {}, endCount = {}, botEnd = {}, moneyLog = [], crisisCount = {}; let totalWeeks = 0, totalEvents = 0, sumScore = 0, nRuns = 0;
function run(botName, seed, bgOverride){
    const bot = BOTS[botName], rng = mkRng(seed * 7919 + 13);
    const bg = bgOverride || bot.bg || AD.BGS[seed % AD.BGS.length].id;
    const S = AD.newRun({seed: seed, bg: bg, name: "テスト"}); const tgt = {flags: bot.flags, avoid: bot.avoid, w: bot.w, fullJob: bot.fullJob, job: bot.job, noise: bot.noise};
    
    const flush = () => { let n = 0; while(true){ const ev = AD.nextEv(S); if(!ev) break; if(++n > 12) throw new Error("イベントが 止まらない"); const i = pickChoice(S, ev, tgt, rng); AD.choose(S, ev, i); hits[ev.id] = (hits[ev.id] || 0) + 1; totalEvents++; } };
    for(let wk = 0; wk < 60; wk++){
        for(const slot of ["wd", "we"]){
            let id = bot.plan(S, slot, rng);
            if(!S.job && !bot.quitJob && slot === "wd" && S.money < 120000 && S.hp >= 30 && can(S, "career", "wd")) id = "career";   // しごとを なくしたら 求人に 応募（ふつうの プレイヤーと おなじ）
            if(!can(S, id, slot)) { const l = AD.avail(S, slot).filter(a => a.ok && a.id !== "pachinko"); id = (l.find(a => a.id === "rest") || l[0]).id; }
            const arg = argFor(bot, S, id, rng);
            try{ AD.act(S, slot, id, arg); }catch(e){ const l = AD.avail(S, slot).filter(a => a.ok && a.id !== "pachinko" && a.id !== "trip" && a.id !== "side"); AD.act(S, slot, l[0].id); }
            flush();
        }
        AD.endWeek(S); flush();
        if(process.env.TRACE === botName && seed === 1) console.log("  w" + S.week, "¥" + S.money, S.job || "-", "hp" + Math.round(S.hp), "mp" + Math.round(S.mp), JSON.stringify(S.slot), S.log.slice(-2).map(l => l.e).join(","));
        const end = AD.advance(S); totalWeeks++;
        if(end) break;
    }
    if(!S.over) ng(botName + " seed" + seed + " 52週で おわらなかった");
    const e = S.endId; endCount[e] = (endCount[e] || 0) + 1; (botEnd[botName] = botEnd[botName] || {})[e] = ((botEnd[botName] || {})[e] || 0) + 1;
    S.score = AD.score(S); sumScore += S.score; nRuns++;
    moneyLog.push([botName, S.money, S.hp, S.mp, S.hlt, S.week]); (statLog[botName] = statLog[botName] || []).push(S);
    AD.achieved(S).forEach(a => hits["ach:" + a] = (hits["ach:" + a] || 0) + 1);
    if(["bankrupt", "hospital", "burnout"].indexOf(e) >= 0) crisisCount[botName] = (crisisCount[botName] || 0) + 1;
    return S;
}
const t0 = Date.now();
Object.keys(BOTS).forEach(b => { for(let s = 1; s <= RUNS; s++){ try{ run(b, s); }catch(e){ ng(b + " seed" + s + " 例外: " + e.stack.split("\n").slice(0, 3).join(" | ")); break; } } });
// 出身ごとの balanced（ぜんぶの 出身で 遊べるか）
AD.BGS.forEach(b => { for(let s = 1; s <= RUNS; s++){ try{ run("balanced", 100 + s, b.id); }catch(e){ ng("balanced " + b.id + " 例外: " + e.stack.split("\n").slice(0, 3).join(" | ")); break; } } });

// ---------- 3. 結果 ----------
console.log("ボット:", Object.keys(BOTS).length, "×", RUNS, "回 ＋ 出身別", AD.BGS.length, "×", RUNS, "回 ／", nRuns, "回 ／", totalWeeks, "週 ／ イベント", totalEvents, "回 ／", ((Date.now() - t0) / 1000).toFixed(1), "秒");
const allEnds = AD.ENDS.map(e => e.id), unreached = allEnds.filter(e => !endCount[e]);
console.log("エンディング到達:", allEnds.length - unreached.length, "/", allEnds.length, unreached.length ? "  ✗ 未到達: " + unreached.join(", ") : "  ✓ すべて");
if(!QUIET){ allEnds.forEach(e => console.log("  ", (e + "          ").slice(0, 12), String(endCount[e] || 0).padStart(4))); }
const unhit = AD.EV.filter(e => !hits[e.id]).map(e => e.id);
console.log("イベント発生:", AD.EV.length - unhit.length, "/", AD.EV.length, unhit.length ? "  ✗ 未発生: " + unhit.join(", ") : "  ✓ すべて");
const unach = AD.ACH.filter(a => !hits["ach:" + a.id]).map(a => a.id);
console.log("実績 到達:", AD.ACH.length - unach.length, "/", AD.ACH.length, unach.length ? "  ✗ 未到達: " + unach.join(", ") : "  ✓ すべて");
const bal = moneyLog.filter(m => m[0] === "balanced"); const avg = i => (bal.reduce((a, m) => a + m[i], 0) / bal.length).toFixed(0);
console.log("balanced の さいごの 平均: お金 ¥" + avg(1) + " ／ 体力 " + avg(2) + " ／ 気力 " + avg(3) + " ／ 健康 " + avg(4) + " ／ 平均スコア " + (sumScore / nRuns).toFixed(0));
const balCrisis = bal.length ? Object.keys(botEnd.balanced || {}).filter(e => ["bankrupt", "hospital", "burnout"].indexOf(e) >= 0).reduce((a, e) => a + botEnd.balanced[e], 0) : 0;
console.log("balanced の ピンチ終了:", balCrisis, "/", bal.length, "（", (balCrisis / bal.length * 100).toFixed(1), "% ）");
if(process.argv.includes("--stats")){ Object.keys(statLog).forEach(b => { const L = statLog[b], av = k => Math.round(L.reduce((a, S) => a + S[k], 0) / L.length); console.log("  ", (b + "           ").slice(0, 11), ["knw", "chm", "skl", "soc", "hlt", "mp", "fame", "smk", "drk", "gam"].map(k => k + av(k)).join(" ")); }); }
if(process.argv.includes("--bots")){ Object.keys(botEnd).forEach(b => { const ml = moneyLog.filter(m => m[0] === b); console.log("  ", (b + "           ").slice(0, 11), "お金平均 ¥" + String(Math.round(ml.reduce((a, m) => a + m[1], 0) / ml.length)).padStart(9), JSON.stringify(botEnd[b])); }); }
const top = Math.max.apply(null, allEnds.map(e => endCount[e] || 0)); console.log("最多エンディングの 割合:", (top / nRuns * 100).toFixed(1) + "%");
console.log(fail ? "失敗 " + fail + " 件" : "OK");
process.exit(fail ? 1 : 0);
