"use strict";
/* 人気者になろう：画面（タイトル／ホーム／チャレンジ／特訓／ショップ／ステータス／イベント／エンディング／ずかん）。4か国語。虫は 出さない。
   ミニゲームの 実行は st-play.js。 */
(function(){
    var ST = window.ST, GK = window.GK, FX = window.STFX;
    var $ = function(id){ return document.getElementById(id); };
    var L = function(){ return GK.lang(); };
    var U = {
        ja: {lg1: "人気者", lg2: "になろう", endDayQ: "まだ 行動が のこっているよ。このまま 1日を おわる？", dailyPractice: "（きょうの 記録は もう あります。れんしゅうです）", dailyRec: "きょうの 記録：{n}%（★{s}）", dailyStreak: "れんぞく {n}日", dailyFans: "きょうの ファン {n}人（2倍）", newBest: "ベスト こうしん！",
            menuPick: "ボタンを えらぶ", confirmL: "決定", backL: "もどる・とじる", pauseL: "一時停止・メニュー", trainRes: "{s} が {a} → {b} に アップ！", statStats: "のうりょく", statRel: "なかよし度", statGear: "そうび", statRec: "きろく", achNone: "まだ ありません",
            tyDesc: "とくい：{a}・{b}", kindC: "とちゅうで ゲームオーバー", stChal: "チャレンジ {n}回", stS3: "★3 {n}回", stStreak: "さいこう 連続 {n}", stDay: "{n}日め まで", stCoins: "コイン {n}", recStars: "★の 合計 {n} / {m}", recDone: "クリア {n}回", ctlBtn: "🎮 そうさ設定",
            tips: ["ボスを クリアすると、次の エリアが ひらくよ。", "特訓で 能力を 上げると、ミニゲームが やさしくなる！", "★3を めざすと、ファンが たくさん ふえるよ。", "連続で 成功すると ファンが ふえやすい！", "ショップの そうびで、ファンが ふえやすく なるよ。", "元気が 少ないと ミスが ふえる。ときどき 休もう。"], tipLow: "元気が 少ないよ。「やすむ」か ドリンクで 回復しよう。", tipZero: "今日は もう 動けない。「1日を おわる」で 明日へ！", tipBad: "体調が 悪いよ…。無理せず 休もう。", tipTired: "ずっと 休んでいないよ。そろそろ 「やすむ」で 体を いたわろう。"},
        en: {lg1: "BECOME", lg2: "A STAR!", endDayQ: "You still have actions left. End the day anyway?", dailyPractice: "(Today's record is already set. This is practice.)", dailyRec: "Today's record: {n}% (★{s})", dailyStreak: "{n}-day streak", dailyFans: "Today's fans: {n} (2×)", newBest: "New best!",
            menuPick: "Pick a button", confirmL: "Confirm", backL: "Back / close", pauseL: "Pause / menu", trainRes: "{s} rose from {a} to {b}!", statStats: "Abilities", statRel: "Bonds", statGear: "Gear", statRec: "Records", achNone: "None yet",
            tyDesc: "Strong: {a}, {b}", kindC: "Game over", stChal: "Challenges: {n}", stS3: "★3 ×{n}", stStreak: "Best streak {n}", stDay: "Up to day {n}", stCoins: "Coins {n}", recStars: "Total ★ {n} / {m}", recDone: "Cleared {n} times", ctlBtn: "🎮 Controls",
            tips: ["Clear a boss to open the next area.", "Training raises abilities and makes mini-games easier!", "Aim for ★3 to gain lots of fans.", "Win in a row for more fans!", "Gear from the shop helps you gain fans.", "Low condition means more mistakes. Rest now and then."], tipLow: "Your condition is low. Rest or drink something.", tipZero: "No actions left today. Tap “End day” to move on!", tipBad: "You feel unwell… take a rest.", tipTired: "You haven’t rested in a long while. Take a “Rest” before your body gives out."},
        zh: {lg1: "成为", lg2: "人气王", endDayQ: "今天还有剩余行动。就这样结束今天吗？", dailyPractice: "（今天已有记录，这次是练习）", dailyRec: "今日记录：{n}%（★{s}）", dailyStreak: "连续{n}天", dailyFans: "今日粉丝 {n}（2倍）", newBest: "刷新纪录！",
            menuPick: "选择按钮", confirmL: "确定", backL: "返回/关闭", pauseL: "暂停/菜单", trainRes: "{s}从{a}提升到{b}！", statStats: "能力", statRel: "羁绊", statGear: "装备", statRec: "记录", achNone: "暂无",
            tyDesc: "擅长：{a}、{b}", kindC: "中途游戏结束", stChal: "挑战 {n} 次", stS3: "★3 {n} 次", stStreak: "最高连续 {n}", stDay: "到第{n}天", stCoins: "游戏币 {n}", recStars: "★总数 {n} / {m}", recDone: "通关 {n} 次", ctlBtn: "🎮 操作设置",
            tips: ["通关首领就能开启下一个区域。", "特训能提升能力，让小游戏更简单！", "目标★3，能获得大量粉丝。", "连续成功更容易涨粉！", "商店的装备能让你更容易涨粉。", "状态低会增加失误。偶尔休息一下吧。"], tipLow: "状态不佳。去休息或喝点饮料吧。", tipZero: "今天已经没有行动了。点“结束今天”进入明天！", tipBad: "身体不太舒服……好好休息吧。", tipTired: "已经很久没休息了。再不“休息”，身体会吃不消的。"},
        ko: {lg1: "인기인이", lg2: "되자!", endDayQ: "아직 행동이 남아 있어요. 이대로 하루를 끝낼까요?", dailyPractice: "(오늘 기록이 이미 있어요. 연습이에요.)", dailyRec: "오늘의 기록: {n}% (★{s})", dailyStreak: "{n}일 연속", dailyFans: "오늘의 팬 {n}명 (2배)", newBest: "최고 기록 갱신!",
            menuPick: "버튼 선택", confirmL: "결정", backL: "뒤로/닫기", pauseL: "일시정지/메뉴", trainRes: "{s}이(가) {a}→{b}(으)로 상승!", statStats: "능력", statRel: "친밀도", statGear: "장비", statRec: "기록", achNone: "아직 없어요",
            tyDesc: "특기: {a}, {b}", kindC: "도중 게임 오버", stChal: "챌린지 {n}회", stS3: "★3 {n}회", stStreak: "최고 연속 {n}", stDay: "{n}일째까지", stCoins: "코인 {n}", recStars: "★ 합계 {n} / {m}", recDone: "클리어 {n}회", ctlBtn: "🎮 조작 설정",
            tips: ["보스를 클리어하면 다음 지역이 열려요.", "특훈으로 능력을 올리면 미니게임이 쉬워져요!", "★3을 노리면 팬이 많이 늘어요.", "연속으로 성공하면 팬이 더 잘 늘어요!", "상점 장비로 팬이 더 잘 늘어요.", "컨디션이 낮으면 실수가 늘어요. 가끔 쉬세요."], tipLow: "컨디션이 낮아요. 쉬거나 음료를 마셔요.", tipZero: "오늘은 더 움직일 수 없어요. '하루 끝내기'로 내일로!", tipBad: "몸이 안 좋아요… 무리하지 말고 쉬어요.", tipTired: "오랫동안 쉬지 않았어요. 몸이 버티지 못하기 전에 “쉬기”를 눌러요."}
    };
    function fmtv(s, v){ return v ? String(s).replace(/\{(\w+)\}/g, function(m, q){ return v[q] != null ? v[q] : m; }) : s; }
    function t(k, v){ var d = U[L()] || U.ja, s = d[k]; if(s == null) s = U.ja[k]; if(s != null && typeof s === "string") return fmtv(s, v); if(s != null) return s; return ST.tx(k, v); }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
    function fmt(n){ return Math.round(n).toLocaleString("en-US"); }
    var TEM = {rhythm: "💃", karaoke: "🎤", timing: "🎯", mash: "💪", mood: "💬", react: "⚡", memory: "🧠", dart: "🎯", catch: "🧺", pachi: "🎰", cheers: "🥂", scan: "🔍"};
    var SCR = ["title", "how", "setup", "home", "area", "train", "shop", "stat", "play", "result", "end", "coll"];
    var G = {scr: "title", S: null, dS: null, type: "dance", daily: false, areaSel: "town", busy: false, back: "home", dailyCh: null};
    var store = GK.save("st"), SAVE = "are_st_save_v1";
    var X = function(n, S){ return ST.t(n, ST.vars(S || G.S || {name: ""})); };
    function cur(){ return G.daily ? G.dS : G.S; }
    function persist(){ try{ if(G.S && !G.S.over && !G.daily) localStorage.setItem(SAVE, JSON.stringify(G.S)); else if(!G.daily) localStorage.removeItem(SAVE); }catch(_e){} }
    function loadSave(){ try{ var s = JSON.parse(localStorage.getItem(SAVE) || "null"); if(s && s.v === 1 && !s.over && typeof s.day === "number" && s.st) return s; }catch(_e){} return null; }
    function toast(m, ms){ var e = $("toast"); e.textContent = m; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1800); }
    var STU = window.STU = {G: G, $: $, t: t, X: X, esc: esc, fmt: fmt, toast: toast, persist: persist, TEM: TEM, cur: cur, U: U};

    // ---- コントローラー：画面が かわった／モーダルが ひらいた とき、つぎに おす ボタンへ カーソルを あわせる ----
    var padRaf = 0;
    function padSync(){
        if(!window.AREPadFocus || !window.GKI || !GKI.padConnected || !GKI.padConnected() || padRaf) return;
        padRaf = requestAnimationFrame(function(){
            padRaf = 0;
            if(document.querySelector(".gki-modal.on") || document.getElementById("ageGate")) return;
            var sc = document.querySelector(".modal.on") || document.querySelector(".scr.on"); if(!sc) return;
            var el = sc.querySelector("[data-pad-first]:not(:disabled)") || sc.querySelector("button.big:not(:disabled)") || sc.querySelector("button:not(:disabled)");
            if(el) AREPadFocus(el);
        });
    }
    STU.padSync = padSync;
    function open(id){ $(id).classList.add("on"); padSync(); }
    function close(id){ $(id).classList.remove("on"); padSync(); }
    STU.open = open; STU.close = close;

    // ---- 画面の きりかえ ----
    var SCENE = {title: "title", home: "home", train: "home", shop: "home", stat: "home", coll: "home", how: "home", setup: "home", result: "result", end: "end"};
    function show(id){
        G.scr = id; SCR.forEach(function(k){ $("s-" + k).classList.toggle("on", k === id); });
        document.body.classList.toggle("playing", id === "play"); document.body.dataset.scr = id;
        document.documentElement.lang = L(); document.title = t("title") + " | ARE";
        text();
        if(id === "title") rTitle(); else if(id === "setup") rSetup(); else if(id === "home") rHome(); else if(id === "area") rArea(); else if(id === "train") rTrain(); else if(id === "shop") rShop(); else if(id === "stat") rStat(); else if(id === "coll") rColl(); else if(id === "end") rEnd();
        FX.scene(id === "area" ? G.areaSel : SCENE[id] || (id === "play" ? (STU.playScene || "home") : "home"));
        try{ GK.bgm(id === "play" ? "tense" : id === "end" ? "epic" : id === "title" ? "fun" : "calm"); }catch(_e){}
        if(window.GKI && id !== "play"){ GKI.mode("menu"); GKI.legend(legendMenu()); }
        padSync();
    }
    STU.show = show;
    function L4(k){ return {ja: U.ja[k], en: U.en[k], zh: U.zh[k], ko: U.ko[k]}; }
    function legendMenu(){ return [{k: "dpad", t: L4("menuPick")}, {k: "a", t: L4("confirmL")}, {k: "b", t: L4("backL")}, {k: "plus", t: L4("pauseL")}]; }
    STU.L4 = L4;
    function text(){
        $("lg1").textContent = t("lg1"); $("lg2").textContent = t("lg2");
        $("tSub").textContent = t("sub"); $("tNote").textContent = t("note"); $("bNew").textContent = t("new"); $("bDaily").textContent = t("daily"); $("bColl").textContent = t("coll"); $("bHow").textContent = t("how");
        $("hT").textContent = t("howT"); $("hBody").innerHTML = (t("howL") || []).map(function(x){ return "<p>" + esc(x) + "</p>"; }).join(""); $("bHowBack").textContent = t("back");
        $("suT").textContent = t("suT"); $("suName").textContent = t("suName"); $("nameIn").placeholder = t("suPh"); $("bGo").textContent = t("suGo"); $("bSuBack").textContent = t("back");
        $("bChal").innerHTML = t("hChal"); $("bTrain").innerHTML = t("hTrain"); $("bRest").innerHTML = t("hRest"); $("bShop").innerHTML = t("hShop"); $("bStat").innerHTML = t("hStat"); $("bEnd").innerHTML = t("hEnd"); $("bHMenu").textContent = t("hMenu");
        $("bAreaBack").textContent = "← " + t("back"); $("bTrBack").textContent = "← " + t("back"); $("bShBack").textContent = "← " + t("back"); $("bStBack").textContent = "← " + t("back");
        $("trT").textContent = t("trainT"); $("shT").textContent = t("shopT"); $("stT").textContent = t("statT");
        $("bAgain").textContent = t("again"); $("bEndColl").textContent = t("endColl"); $("bEndTitle").textContent = t("toTitle");
        $("cT").textContent = t("cT"); $("bCollBack").textContent = t("back"); var cb = $("cTabs").children; cb[0].textContent = t("cEnd"); cb[1].textContent = t("cAch"); cb[2].textContent = t("cStar");
        $("exitBtn").textContent = "← " + t("back"); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[L()];
        $("bResOk").textContent = t("okBtn");
    }

    // ---- タイトル ----
    function rTitle(){
        var sv = loadSave(); $("bCont").style.display = sv ? "" : "none"; if(sv) $("bCont").textContent = t("cont", {d: Math.min(sv.day, ST.DAYS)});
        var dr = store.get("daily", null), today = GK.daySeed(), done = dr && dr.date === today;
        $("bDaily").textContent = t("daily") + (done ? "  ✓" : "");
    }
    // ---- セットアップ ----
    function rSetup(){
        var box = $("tyList"); box.innerHTML = "";
        ST.TYPES.forEach(function(ty){
            var top = ST.STATS.slice().sort(function(a, b){ return ty.st[b.id] - ty.st[a.id]; }).slice(0, 2);
            var b = document.createElement("button"); b.type = "button"; b.className = "tycard" + (G.type === ty.id ? " sel" : ""); b.dataset.type = ty.id;
            b.innerHTML = '<span class="em">' + ty.em + '</span><b>' + esc(t("ty_" + ty.id)) + '</b><small>' + esc(t("tyDesc", {a: ST.t(top[0].n), b: ST.t(top[1].n)})) + '</small>';
            b.onclick = function(){ G.type = ty.id; GK.sfx("tap"); rSetup(); var el = document.querySelector('.tycard[data-type="' + ty.id + '"]'); if(el && window.AREPadFocus && GKI.padConnected()) AREPadFocus(el); };
            box.appendChild(b);
        });
        if(!$("nameIn").value) $("nameIn").value = GK.LS.get("st_name", "") || "";
    }
    // ---- ホーム ----
    function pips(n, max){ var s = ""; for(var i = 0; i < max; i++) s += '<span class="' + (i < n ? "on" : "off") + '">★</span>'; return s; }
    var tipI = 0;
    function rHome(){
        var S = G.S; if(!S) return show("title");
        var R = ST.RANKS[S.rk], nx = ST.RANKS[S.rk + 1];
        $("hDay").textContent = t("dayN", {d: Math.min(S.day, ST.DAYS), m: ST.DAYS}); $("hAp").innerHTML = pips(S.ap, ST.AP); $("hAp").setAttribute("aria-label", t("ap", {n: S.ap}));
        $("hRankEm").textContent = R.em; $("hRankName").textContent = ST.t(R.n);
        $("hRankFill").style.width = Math.round(100 * (nx ? ST.clamp((S.fans - R.f) / (nx.f - R.f), 0, 1) : 1)) + "%";
        $("hRankNext").textContent = nx ? t("next", {n: fmt(nx.f - S.fans)}) : t("maxRank");
        $("hFans").innerHTML = "<b>👥 " + fmt(S.fans) + "</b><small>" + esc(t("fans")) + "</small>"; $("hCoins").innerHTML = "<b>🪙 " + fmt(S.coins) + "</b><small>" + esc(t("coins")) + "</small>";
        $("hCond").querySelector("b").textContent = "💗 " + Math.round(S.cond); $("hCond").querySelector("i").style.width = Math.round(S.cond) + "%";
        $("bChal").disabled = $("bTrain").disabled = $("bRest").disabled = S.ap <= 0;
        var dk = S.gear.drink || 0; $("bDrink").style.display = dk > 0 && S.cond < 95 ? "" : "none"; $("bDrink").textContent = "🥤 " + t("use") + "（" + t("own", {n: dk}) + "）";
        var tip;
        if(S.ap <= 0) tip = t("tipZero"); else if(S.hlt < 30) tip = t("tipBad"); else if(ST.tired(S)) tip = t("tipTired"); else if(S.cond < 30) tip = t("tipLow"); else if(S.day <= 2 && !S.cnt.chal) tip = t("tutorial"); else { var a = t("tips"); tip = a[(tipI++) % a.length]; }
        $("bubEm").textContent = "🧑‍💼"; $("bubTx").textContent = tip;
    }
    // ---- チャレンジ ----
    function rArea(){
        var S = G.S, tabs = $("areaTabs"); tabs.innerHTML = "";
        if(!ST.AREAMAP[G.areaSel]) G.areaSel = "town";
        ST.AREAS.forEach(function(a){
            var open = ST.areaOpen(S, a), b = document.createElement("button"); b.type = "button"; b.className = "tab" + (G.areaSel === a.id ? " sel" : "") + (open ? "" : " lock"); b.dataset.area = a.id;
            b.innerHTML = (open ? a.em : "🔒") + " " + esc(ST.t(a.n)); b.onclick = function(){ G.areaSel = a.id; GK.sfx("tap"); rArea(); FX.scene(a.id); var el = document.querySelector('.tab[data-area="' + a.id + '"]'); if(el && window.AREPadFocus && GKI.padConnected()) AREPadFocus(el); };
            tabs.appendChild(b);
        });
        var cs = tabs.querySelector(".sel"); if(cs && cs.scrollIntoView) try{ cs.scrollIntoView({block: "nearest", inline: "center"}); }catch(_e){}
        var ar = ST.AREAMAP[G.areaSel], open = ST.areaOpen(S, ar);
        $("arT").textContent = ar.em + " " + ST.t(ar.n); $("arAp").innerHTML = pips(S.ap, ST.AP); $("arDesc").textContent = open ? ST.t(ar.d) : t("locked", {r: ST.t(ST.RANKS[ar.rk].n)});
        var box = $("chList"); box.innerHTML = "";
        ST.CHS.filter(function(c){ return c.area === ar.id; }).forEach(function(c){
            var st = S.stars[c.id] || 0, best = S.best[c.id], b = document.createElement("button"); b.type = "button"; b.className = "card" + (c.boss ? " boss" : ""); b.disabled = !open || S.ap <= 0; b.dataset.ch = c.id;
            var dif = ""; for(var i = 0; i < 5; i++) dif += '<i class="' + (i < Math.round(c.d * 5) ? "on" : "") + '"></i>';
            b.innerHTML = '<span class="em">' + TEM[c.type] + '</span><span class="tx"><b>' + esc(X(c.n)) + (c.boss ? '<span class="tag">' + esc(t("boss")) + '</span>' : "") + '<span class="dif">' + dif + '</span></b><small>' + esc(t("ctl_" + c.type)) + (c.type === "pachi" ? " 🪙" + (c.cfg.bet || 100) : "") + '</small></span>' +
                '<span class="side"><span class="stars">' + [0, 1, 2].map(function(k){ return '<span class="' + (k < st ? "" : "off") + '">★</span>'; }).join("") + '</span>' + (best != null ? '<span>' + esc(t("best", {n: best})) + '</span>' : "") + '</span>';
            b.onclick = function(){ if(window.STU.startChal) STU.startChal(c); };
            box.appendChild(b);
        });
        var first = box.querySelector("button:not(:disabled)"); if(first) first.setAttribute("data-pad-first", "1");
    }
    // ---- 特訓 ----
    function rTrain(){
        var S = G.S, box = $("trList"); box.innerHTML = ""; $("trAp").innerHTML = pips(S.ap, ST.AP);
        ST.TRAIN.forEach(function(tr){
            var st = ST.STATMAP[tr.stat], v = Math.round(S.st[tr.stat]), g = ST.trainGain(S, tr, 70), b = document.createElement("button"); b.type = "button"; b.className = "card"; b.disabled = S.ap <= 0; b.dataset.tr = tr.id;
            b.innerHTML = '<span class="em">' + tr.em + '</span><span class="tx"><b>' + esc(ST.t(tr.n)) + '</b><small>' + esc(st.em + " " + ST.t(st.n) + " " + v + " ／ " + t("trainGain", {s: ST.t(st.n), n: "+" + Math.max(1, Math.round(g))})) + '</small><span class="bar"><i style="width:' + v + '%"></i></span></span>';
            b.onclick = function(){ if(window.STU.startTrain) STU.startTrain(tr); };
            box.appendChild(b);
        });
        var first = box.querySelector("button:not(:disabled)"); if(first) first.setAttribute("data-pad-first", "1");
    }
    // ---- ショップ ----
    function rShop(){
        var S = G.S, box = $("shList"); box.innerHTML = ""; $("shCoins").textContent = "🪙 " + fmt(S.coins);
        ST.SHOP.forEach(function(it){
            var lv = S.gear[it.id] || 0, maxed = !it.cons && lv >= it.max, price = it.price(lv), b = document.createElement("div"); b.className = "card";
            var pp = ""; if(!it.cons){ pp = '<span class="pips">'; for(var i = 0; i < it.max; i++) pp += '<i class="' + (i < lv ? "on" : "") + '"></i>'; pp += "</span>"; }
            b.innerHTML = '<span class="em">' + it.em + '</span><span class="tx"><b>' + esc(ST.t(it.n)) + pp + '</b><small>' + esc(ST.t(it.d)) + (it.cons ? " ／ " + esc(t("own", {n: lv})) : "") + '</small></span>';
            var bb = document.createElement("button"); bb.type = "button"; bb.className = "buy" + (maxed ? "" : " gold"); bb.dataset.item = it.id; bb.disabled = maxed; bb.textContent = maxed ? t("maxed") : "🪙 " + fmt(price); if(!maxed && S.coins < price) bb.classList.remove("gold");
            bb.onclick = function(){ var r = ST.buy(S, it.id); if(r.ok){ GK.sfx("coin"); toast(t("bought")); persist(); rShop(); var again = document.querySelector('.buy[data-item="' + it.id + '"]'); if(again && !again.disabled && window.AREPadFocus && GKI.padConnected()) AREPadFocus(again); } else { GK.sfx("ng"); toast(t("poor")); } };
            b.appendChild(bb); box.appendChild(b);
        });
        var first = box.querySelector("button:not(:disabled)"); if(first) first.setAttribute("data-pad-first", "1");
    }
    // ---- ステータス ----
    function bar(label, v, cls){ return '<div class="srow"><b>' + label + '</b><span class="bar"><i class="' + (cls || "") + '" style="width:' + ST.clamp(v, 0, 100) + '%"></i></span><em>' + Math.round(v) + '</em></div>'; }
    function rStat(){
        var S = G.S, h = "", rel = {rival: "ryu", mika: "mika", haru: "haru", master: "master"};
        h += '<div class="sbox"><h3>' + esc(t("statStats")) + '</h3>' + ST.STATS.map(function(s){ return bar(s.em + " " + esc(ST.t(s.n)), S.st[s.id]); }).join("") + '</div>';
        h += '<div class="sbox"><h3>' + esc(t("habit")) + '</h3>' + bar("💗 " + esc(t("hlt")), S.hlt) + bar("🎰 " + esc(t("gam")), S.gam, "bad") + bar("🍶 " + esc(t("drk")), S.drk, "bad") + bar("🚬 " + esc(t("smk")), S.smk, "bad") + '</div>';
        h += '<div class="sbox"><h3>' + esc(t("statRel")) + '</h3>' + Object.keys(rel).map(function(k){ var c = ST.CAST[rel[k]]; return bar(c.em + " " + esc(ST.t(c.n)), S.rel[k] || 0, "heart"); }).join("") + '</div>';
        h += '<div class="sbox"><h3>' + esc(t("statGear")) + '</h3>' + ST.SHOP.filter(function(x){ return !x.cons; }).map(function(x){ return '<div class="srow"><b>' + x.em + " " + esc(ST.t(x.n)) + '</b><em style="flex:1;text-align:right">Lv ' + (S.gear[x.id] || 0) + " / " + x.max + '</em></div>'; }).join("") + '</div>';
        var tot = 0; for(var k in S.stars) tot += S.stars[k];
        h += '<div class="sbox"><h3>' + esc(t("statRec")) + '</h3><div class="chips">' + [t("stChal", {n: S.cnt.chal || 0}), t("stS3", {n: S.cnt.s3 || 0}), t("stStreak", {n: S.maxStreak}), t("recStars", {n: tot, m: ST.CHS.length * 3}), t("stCoins", {n: fmt(S.coins)})].map(function(x){ return "<span>" + esc(x) + "</span>"; }).join("") + '</div></div>';
        var ac = ST.achieved(S); h += '<div class="sbox"><h3>' + esc(t("achT")) + '</h3><div class="achl">' + (ac.length ? ac.map(function(id){ var a = ST.ACHMAP[id]; return "<span>" + a.em + " " + esc(ST.t(a.n)) + "</span>"; }).join("") : "<span>" + esc(t("achNone")) + "</span>") + '</div></div>';
        h += '<div class="row">' + ((S.gear.drink || 0) > 0 ? '<button type="button" id="stDrink" class="pink" data-pad-first="1">🥤 ' + esc(t("use")) + "（" + esc(t("own", {n: S.gear.drink})) + "）</button>" : "") + '<button type="button" id="stGive">' + esc(t("giveUp")) + '</button><button type="button" id="stSave">' + esc(t("saveTitle")) + '</button></div>';
        $("stBody").innerHTML = h;
        var d = $("stDrink"); if(d) d.onclick = function(){ drink(); rStat(); };
        $("stGive").onclick = confirmGiveUp; $("stSave").onclick = function(){ persist(); toast(t("saved")); show("title"); };
        var f = $("stBody").querySelector("[data-pad-first]") || $("stSave"); if(f) f.setAttribute("data-pad-first", "1");
    }
    function drink(){ var S = G.S; if(ST.useDrink(S)){ GK.sfx("coin"); toast(t("drinkUse")); persist(); } else toast(t("noEnergy")); }
    function confirmGiveUp(){
        $("infoBox").innerHTML = '<h3>' + esc(t("giveUp")) + '</h3><p>' + esc(t("giveUpQ")) + '</p><div class="row"><button type="button" id="gvNo" data-pad-first="1">' + esc(t("no")) + '</button><button type="button" id="gvYes" class="pink">' + esc(t("yes")) + '</button></div>';
        open("mInfo"); $("gvNo").onclick = function(){ close("mInfo"); }; $("gvYes").onclick = function(){ close("mInfo"); close("mMenu"); var S = G.S; S.over = true; S.endId = ST.crisis(S) || ST.finalEnd(S); finish(); };
    }
    // ---- メニュー ----
    function openMenu(){
        $("menuBox").innerHTML = '<h3>' + esc(t("hMenu")) + '</h3><div class="row" style="flex-direction:column"><button type="button" id="mnResume" class="big" data-pad-first="1">' + esc(t("resume")) + '</button><button type="button" id="mnSave">' + esc(t("saveTitle")) + '</button><button type="button" id="mnGive">' + esc(t("giveUp")) + '</button><button type="button" data-gki-settings>' + esc(t("ctlBtn")) + '</button></div>';
        open("mMenu"); $("mnResume").onclick = function(){ close("mMenu"); }; $("mnSave").onclick = function(){ close("mMenu"); persist(); toast(t("saved")); show("title"); }; $("mnGive").onclick = confirmGiveUp;
    }
    STU.openMenu = openMenu;

    // ---- ダイアログ（ストーリー）：タイプライター ----
    function dialog(lines, done){
        var i = 0; G.busy = true;
        function stepLine(){
            if(i >= lines.length){ close("mEvent"); G.busy = false; if(done) done(); return; }
            var ln = lines[i++], who = ST.CAST[ln[0]] || ST.CAST.me, txt = X(typeof ln[1] === "string" ? ST.P(ln[1]) : ln[1]), chars = Array.from(txt), n = 0, tm = 0, fin = false;
            $("evBox").innerHTML = '<div class="evwho"><span class="pt">' + who.em + '</span><b>' + esc(X(who.n)) + '</b></div><p class="evtx" id="evTx"></p><div class="row"><button type="button" id="evNext" class="big" data-pad-first="1">▶</button></div>';
            open("mEvent");
            var tx = $("evTx"), reduce = false; try{ reduce = matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(_e){}
            function complete(){ clearInterval(tm); tx.textContent = txt; fin = true; }
            if(reduce) complete(); else tm = setInterval(function(){ n += 1; tx.textContent = chars.slice(0, n).join(""); if(n % 3 === 0) try{ GK.sfx("tap"); }catch(_e){} if(n >= chars.length) { clearInterval(tm); fin = true; } }, 24);
            $("evNext").onclick = function(){ if(!fin){ complete(); return; } stepLine(); };
        }
        stepLine();
    }
    STU.dialog = dialog;
    // ---- イベント ----
    var DLB = {fans: ["👥", "fans"], coins: ["🪙", "coins"], cond: ["💗", "cond"], hlt: ["❤️", "hlt"], gam: ["🎰", "gam"], drk: ["🍶", "drk"], smk: ["🚬", "smk"]};
    function deltaChips(d){
        var out = [];
        function add(txt, pos){ out.push('<span class="' + (pos ? "pl" : "mi") + '">' + esc(txt) + "</span>"); }
        ["fans", "coins", "cond", "hlt", "gam", "drk", "smk"].forEach(function(k){ if(d[k]){ var good = (k === "gam" || k === "drk" || k === "smk") ? d[k] < 0 : d[k] > 0; add(DLB[k][0] + " " + t(DLB[k][1]) + " " + (d[k] > 0 ? "+" : "") + fmt(d[k]), good); } });
        if(d.st) for(var s in d.st){ var m = ST.STATMAP[s]; add(m.em + " " + ST.t(m.n) + " " + (d.st[s] > 0 ? "+" : "") + d.st[s], d.st[s] > 0); }
        if(d.rel) for(var r in d.rel){ var map = {rival: "ryu"}, c = ST.CAST[map[r] || r]; add("💞 " + X(c.n) + " " + (d.rel[r] > 0 ? "+" : "") + d.rel[r], d.rel[r] > 0); }
        if(d.ap) add("⭐ " + t("ap", {n: (d.ap > 0 ? "+" : "") + d.ap}), d.ap > 0);
        return out.join("");
    }
    function showEvent(e, done){
        var S = G.S, who = ST.CAST[e.who] || ST.CAST.me; G.busy = true;
        var h = '<div class="evwho"><span class="pt">' + who.em + '</span><b>' + esc(X(who.n)) + '</b></div><p class="evtit">' + esc(t("event")) + "：" + esc(X(e.title)) + '</p><p class="evtx">' + esc(X(e.body)) + '</p><div class="evch">';
        e.ch.forEach(function(c, i){ var ok = ST.choiceOk(S, c); h += '<button type="button" data-i="' + i + '"' + (ok ? "" : " disabled") + (i === 0 && ok ? ' data-pad-first="1"' : "") + ">" + esc(X(c.t)) + "</button>"; });
        $("evBox").innerHTML = h + "</div>"; open("mEvent"); GK.sfx("pop");
        var btns = $("evBox").querySelectorAll(".evch button");
        if(!$("evBox").querySelector("[data-pad-first]") && btns.length){ for(var k = 0; k < btns.length; k++) if(!btns[k].disabled){ btns[k].setAttribute("data-pad-first", "1"); break; } }
        Array.prototype.forEach.call(btns, function(b){
            b.onclick = function(){
                Array.prototype.forEach.call(btns, function(x){ x.disabled = true; });
                var r = ST.choose(S, e, +b.dataset.i); persist();
                var o = r.o, d = r.d;
                $("evBox").innerHTML = '<div class="evwho"><span class="pt">' + who.em + '</span><b>' + esc(X(who.n)) + '</b></div><p class="evtx">' + esc(o.txt ? X(o.txt) : "") + '</p><div class="dchips">' + deltaChips(d) + '</div><div class="row"><button type="button" id="evOk" class="big" data-pad-first="1">' + esc(t("okBtn")) + '</button></div>';
                padSync(); GK.sfx(d.fans > 0 || (!d.fans && (d.cond || 0) >= 0) ? "ok" : "ng");
                $("evOk").onclick = function(){ close("mEvent"); G.busy = false; rankCines(r.rankUp, function(){ done(); }); };
            };
        });
        padSync();
    }
    function runPending(done){
        var S = G.S, e = ST.nextEv(S);
        if(!e){ persist(); return done(); }
        S.pend.unshift(e.id); persist(); S.pend.shift();   // 表示の まえに 保存（とちゅうで とじても 再開できる）
        showEvent(e, function(){
            var end = ST.checkEnd(S); persist(); if(end){ finish(); return; }
            runPending(done);
        });
    }
    STU.runPending = runPending;
    // ---- ランクアップの シネマ ----
    function rankCines(list, done){
        if(!list || !list.length) return done();
        var idx = list.shift(), R = ST.RANKS[idx];
        $("cineBox").innerHTML = '<div class="big-em">' + R.em + '</div><div class="ct">' + esc(t("rankUp")) + '</div><div class="cn">' + esc(ST.t(R.n)) + '</div><div class="cl">' + esc(ST.RANK_LINE[idx] ? ST.t(ST.RANK_LINE[idx]) : "") + '</div><button type="button" id="cineOk" class="big" data-pad-first="1">' + esc(t("okBtn")) + '</button>';
        open("mCine"); try{ GK.sfx("win"); GK.bgm("epic"); FX.confetti(140); FX.fireworks(5); FX.flash("#ffe9a0", .55); GK.vibrate(30); }catch(_e){}
        $("cineOk").onclick = function(){ close("mCine"); try{ GK.bgm(G.scr === "play" ? "tense" : "calm"); }catch(_e){} rankCines(list, done); };
    }
    STU.rankCines = rankCines;

    // ---- 1日の おわり ----
    function sleepFx(cb){
        var o = document.createElement("div"); o.style.cssText = "position:fixed;inset:0;z-index:70;background:#05021a;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;opacity:0;transition:opacity .35s;color:#fff;font-weight:800"; o.innerHTML = '<div style="font-size:64px">🌙</div><div>' + esc(t("dayEnd", {d: Math.min(G.S.day, ST.DAYS)})) + '</div><div style="opacity:.7;font-size:13px">' + esc(t("sleep")) + '</div>';
        document.body.appendChild(o); requestAnimationFrame(function(){ o.style.opacity = "1"; });
        var fast = window.__stFast; setTimeout(function(){ cb(); o.style.opacity = "0"; setTimeout(function(){ if(o.parentNode) o.parentNode.removeChild(o); }, fast ? 30 : 380); }, fast ? 40 : 700);
    }
    function doEndDay(){
        var S = G.S; if(G.busy) return; G.busy = true;
        sleepFx(function(){
            ST.endDay(S); G.busy = false; persist();
            var e0 = ST.checkEnd(S); if(e0){ persist(); finish(); return; }
            runPending(function(){ var e = ST.checkEnd(S); persist(); if(e){ finish(); return; } show("home"); });
        });
    }
    STU.doEndDay = doEndDay;
    // ---- 行動の あとの 共通処理 ----
    function afterAction(res){
        var S = G.S, end = ST.checkEnd(S); persist();
        var ups = res && res.rankUp ? res.rankUp.slice() : [], areas = res && res.newAreas ? res.newAreas.slice() : [];
        if(end){ return rankCines(ups, function(){ finish(); }); }
        rankCines(ups, function(){
            (function nextArea(){
                var a = areas.shift(); if(!a) return next();
                var lines = ST.AREA_INTRO[a.id]; toast(t("newArea") + " " + a.em + " " + ST.t(a.n), 2200);
                if(lines) dialog(lines, nextArea); else nextArea();
            })();
        });
        function next(){ if(S.ap <= 0) doEndDay(); else show(G.back || "home"); }
    }
    STU.afterAction = afterAction;

    // ---- エンディング ----
    function finish(){
        var S = G.S, id = S.endId || ST.checkEnd(S) || ST.finalEnd(S), en = ST.ENDMAP[id] || ST.ENDMAP.newcomer; S.endId = id; S.over = true; persist();
        try{ localStorage.removeItem(SAVE); }catch(_e){}
        var ends = store.get("ends", {}), ach = store.get("ach", {}), stars = store.get("stars", {}), isNew = !ends[id], newAch = [];
        ends[id] = (ends[id] || 0) + 1; ST.achieved(S).forEach(function(a){ if(!ach[a]){ ach[a] = 1; newAch.push(a); } });
        for(var k in S.stars) stars[k] = Math.max(stars[k] || 0, S.stars[k]);
        var bestF = store.get("bestFans", 0), isBest = S.fans > bestF; if(isBest) bestF = S.fans;
        store.set("ends", ends); store.set("ach", ach); store.set("stars", stars); store.set("bestFans", bestF); store.set("runs", store.get("runs", 0) + 1);
        G.endInfo = {id: id, isNew: isNew, newAch: newAch, isBest: isBest, bestF: bestF};
        show("end");
    }
    STU.finish = finish;
    function rEnd(){
        var S = G.S, info = G.endInfo, en = ST.ENDMAP[info.id];
        $("endEm").textContent = en.em; $("endKind").textContent = (en.kind === "crisis" ? t("kindC") : t("endT")) + (info.isNew ? "  ✦ " + t("newEnd") : "");
        $("endT").textContent = ST.t(en.n); $("endB").textContent = X(en.d); $("endRank").textContent = ST.RANKS[S.rk].em;
        $("endScore").textContent = t("score", {n: fmt(S.fans)}); $("endBest").textContent = t("bestFans", {n: fmt(info.bestF)}) + (info.isBest ? "  ✦ " + t("newBest") : "");
        $("endStats").innerHTML = [t("stDay", {n: Math.min(S.day, ST.DAYS)}), t("stChal", {n: S.cnt.chal || 0}), t("stS3", {n: S.cnt.s3 || 0}), t("stStreak", {n: S.maxStreak}), t("stCoins", {n: fmt(S.coins)})].map(function(x){ return "<span>" + esc(x) + "</span>"; }).join("");
        $("endAch").innerHTML = info.newAch.length ? '<span style="border:0;background:none;color:#ffd0ec">' + esc(t("newAch")) + "</span>" + info.newAch.map(function(a){ var o = ST.ACHMAP[a]; return "<span>" + o.em + " " + esc(ST.t(o.n)) + "</span>"; }).join("") : "";
        try{ GK.sfx(en.kind === "crisis" ? "lose" : "win"); if(en.kind !== "crisis"){ FX.confetti(160); FX.fireworks(6); FX.flash("#ffe9a0", .5); } }catch(_e){}
    }
    // ---- ずかん ----
    var collTab = "end";
    function rColl(){
        var d = store.all(), box = $("cGrid"), seen = 0, tot = 0, h = ""; box.innerHTML = "";
        Array.prototype.forEach.call($("cTabs").children, function(b){ b.classList.toggle("on", b.dataset.c === collTab); });
        if(collTab === "end"){ var ends = d.ends || {}; ST.ENDS.forEach(function(e){ tot++; var ok = !!ends[e.id]; if(ok) seen++; h += '<div class="cg' + (ok ? "" : " lock") + '"><span class="em">' + (ok ? e.em : "❔") + '</span><b>' + esc(ok ? ST.t(e.n) : t("unknown")) + '</b>' + (ok ? "<small>×" + ends[e.id] + "</small>" : "") + "</div>"; }); }
        else if(collTab === "ach"){ var ach = d.ach || {}; ST.ACH.forEach(function(a){ tot++; var ok = !!ach[a.id]; if(ok) seen++; h += '<div class="cg' + (ok ? "" : " lock") + '"><span class="em">' + (ok ? a.em : "❔") + '</span><b>' + esc(ok ? ST.t(a.n) : t("unknown")) + '</b>' + (ok ? "<small>" + esc(ST.t(a.d)) + "</small>" : "") + "</div>"; }); }
        else { var stars = d.stars || {}; ST.CHS.forEach(function(c){ tot++; var s = stars[c.id] || 0; if(s) seen++; h += '<div class="cg' + (s ? "" : " lock") + '"><span class="em">' + TEM[c.type] + '</span><b>' + esc(s ? ST.t(c.n) : t("unknown")) + '</b><small class="stars">' + [0, 1, 2].map(function(k){ return '<span class="' + (k < s ? "" : "off") + '">★</span>'; }).join("") + "</small></div>"; }); }
        box.innerHTML = h; $("cCount").textContent = t("cCount", {a: seen, b: tot}) + (collTab === "end" && d.bestFans ? "  ／  " + t("bestFans", {n: fmt(d.bestFans)}) : "");
        var dr = d.daily; if(collTab === "star" && dr) $("cCount").textContent += "  ／  " + t("dailyRec", {n: dr.pct, s: dr.stars}) + (d.dailyStreak ? "  ／  " + t("dailyStreak", {n: d.dailyStreak}) : "");
    }

    // ---- 新しい ラン ----
    function startRun(daily){
        var name = ($("nameIn").value || "").trim().slice(0, 8); GK.LS.set("st_name", name);
        G.daily = false; G.S = ST.newRun({type: G.type, name: name, seed: ((Math.random() * 4e9) >>> 0) || 7}); G.areaSel = "town"; G.back = "home";
        try{ localStorage.removeItem(SAVE); }catch(_e){} persist();
        show("home"); dialog(ST.STORY.start, function(){ show("home"); });
    }
    function cont(){ var s = loadSave(); if(!s) return; G.daily = false; G.S = s; G.back = "home"; show("home"); if(s.pend && s.pend.length) runPending(function(){ var e = ST.checkEnd(G.S); persist(); if(e) finish(); else show("home"); }); }
    STU.startRun = startRun; STU.cont = cont;
    function startDaily(){
        var today = GK.daySeed(), rn = GK.rng(today), ch = ST.CHS[Math.floor(rn() * ST.CHS.length)], S = ST.newRun({type: "dance", seed: today, daily: true});
        ST.STATS.forEach(function(s){ S.st[s.id] = 30; }); S.coins = 999999;
        G.daily = true; G.dS = S; G.dailyCh = ch; if(STU.startChal) STU.startChal(ch, {daily: true});
    }
    STU.startDaily = startDaily;

    // ---- ボタン ----
    $("bNew").onclick = function(){ G.daily = false; show("setup"); };
    $("bCont").onclick = cont; $("bDaily").onclick = startDaily;
    $("bColl").onclick = function(){ collTab = "end"; show("coll"); }; $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = function(){ show("title"); };
    $("bSuBack").onclick = function(){ show("title"); }; $("bGo").onclick = startRun;
    $("nameIn").addEventListener("keydown", function(e){ if(e.key === "Enter"){ e.preventDefault(); e.target.blur(); } });
    $("bChal").onclick = function(){ G.back = "area"; show("area"); }; $("bTrain").onclick = function(){ G.back = "train"; show("train"); };
    $("bRest").onclick = function(){ var S = G.S; if(S.ap <= 0) return toast(t("needAp")); ST.rest(S); GK.sfx("ok"); persist(); toast(t("restDo")); G.back = "home"; if(S.ap <= 0) doEndDay(); else rHome(); };
    $("bShop").onclick = function(){ show("shop"); }; $("bStat").onclick = function(){ show("stat"); };
    $("bEnd").onclick = function(){
        var S = G.S; if(S.ap <= 0) return doEndDay();
        $("infoBox").innerHTML = '<h3>' + esc(t("hEnd")) + '</h3><p>' + esc(t("endDayQ")) + '</p><div class="row"><button type="button" id="edNo" data-pad-first="1">' + esc(t("no")) + '</button><button type="button" id="edYes" class="pink">' + esc(t("yes")) + '</button></div>';
        open("mInfo"); $("edNo").onclick = function(){ close("mInfo"); }; $("edYes").onclick = function(){ close("mInfo"); doEndDay(); };
    };
    $("bDrink").onclick = function(){ drink(); rHome(); };
    $("bHMenu").onclick = openMenu;
    ["bAreaBack", "bTrBack", "bShBack", "bStBack"].forEach(function(id){ $(id).onclick = function(){ G.back = "home"; show("home"); }; });
    $("bAgain").onclick = function(){ G.daily = false; show("setup"); }; $("bEndColl").onclick = function(){ collTab = "end"; show("coll"); }; $("bEndTitle").onclick = function(){ show("title"); };
    $("bCollBack").onclick = function(){ show("title"); };
    Array.prototype.forEach.call($("cTabs").children, function(b){ b.onclick = function(){ collTab = b.dataset.c; GK.sfx("tap"); rColl(); }; });
    $("exitBtn").onclick = function(){
        if(G.scr === "home"){ openMenu(); return; }
        if(G.scr !== "title"){ goBack(); return; }
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "../index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()){ GK.sfx("ok"); try{ GK.bgm(G.scr === "end" ? "epic" : G.scr === "title" ? "fun" : "calm"); }catch(_e){} } };
    $("lgBtn").onclick = function(){ var order = ["ja", "en", "zh", "ko"], i = order.indexOf(L()); GK.LS.set("are_lang", order[(i + 1) % 4]); show(G.scr); };
    function goBack(){
        var m = G.scr;
        if(m === "area" || m === "train" || m === "shop" || m === "stat"){ G.back = "home"; show("home"); }
        else if(m === "how" || m === "coll" || m === "setup" || m === "end") show("title");
        else if(m === "home") openMenu();
        else if(m === "result" && $("bResOk")) $("bResOk").click();
    }
    window.addEventListener("agegate-ok", padSync);
    window.addEventListener("storage", function(e){ if(e.key === "are_lang" && G.scr !== "play") show(G.scr); });
    // B / Esc：とじる・もどる（パッドの B と ＋ も Esc として とどく）
    var escAt = 0;
    window.addEventListener("keydown", function(e){
        if(e.key !== "Escape") return;
        var nw = performance.now(); if(nw - escAt < 160) return; escAt = nw;
        if(e.defaultPrevented || (window.GKI && GKI.justClosed && GKI.justClosed())) return;   // GKI が 設定パネルを とじた Esc は ここでは 使わない
        if(nw - (STU.pausedAt || -1e9) < 80) return;   // 同じ Esc で GKI が ポーズを ひらいた直後は とじない
        var a = document.activeElement; if(a && a.tagName === "INPUT"){ a.blur(); return; }
        if(document.querySelector(".gki-modal.on")) return;
        var m = document.querySelector(".modal.on[data-closable]"); if(m){ close(m.id); e.preventDefault(); return; }
        if(document.querySelector(".modal.on")) return;
        if(window.AgeGate && !AgeGate.ok()) return;
        if(G.scr === "play"){ if(STU.pause) STU.pause(); return; }
        goBack();
    });
    window.addEventListener("resize", function(){ if(FX.resize) FX.resize(); });
    if(window.GKI){ GKI.mode("menu"); GKI.legend(legendMenu()); }
    STU.rEnd = rEnd; STU.rHome = rHome;
    window.__st = {G: G, show: show, finish: finish, STU: STU, store: store, runPending: runPending, doEndDay: doEndDay};
    FX.init($("fx")); show("title");
})();
