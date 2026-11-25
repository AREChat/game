"use strict";
/* ルール・ルーレット：画面（タイトル・ルーレット・プレイ・ごほうび・ずかん） */
(function(){
    var RR = window.RR, $ = function(id){ return document.getElementById(id); }, W = RR.W, H = RR.H, GAMES = RR.GAMES, MODS = RR.MODS, store = GK.save("rules");
    var t = GK.i18n({
        ja: {sub: "ルールが まいかい かわる ミニゲーム。ルーレットで きまった ルールで ハイスコアを めざそう！", run: "▶ ルーレット・ラン", daily: "📅 きょうの チャレンジ", coll: "📚 ずかん", how: "📖 あそびかた", back: "← もどる", best: "ベスト {s}てん（{r}ラウンド）",
            hT: "あそびかた", howL: ["ルーレットが 「ミニゲーム」と「ルールの へんか」を きめます。", "ミニゲームは 10びょう ていど。クリアすれば とくてん、しっぱいすると ❤ が 1つ へります。", "「かがみ」「さかさま」「くらやみ」…ルールが かわると あそびかたも ガラッと かわる！", "4ラウンドごとに ごほうび（パーク）を 1つ えらべます。", "❤ が なくなると ゲームオーバー。 きょうの チャレンジは 10ラウンドの いっぽんしょうぶ！"],
            round: "ラウンド {n}", score: "{s}てん", ready: "よーい…", ok: "クリア！", ng: "ざんねん…", timeout: "じかんぎれ", spin: "ルーレット スタート！", noMod: "ルールの へんか なし", noModD: "ふつうの ルール。",
            pkT: "ごほうびを えらぼう", pkB: "どれか 1つ", pHeart: "❤ ライフ +1", pHeartD: "さいだい 5つまで", pTime: "⏳ じかん +25%", pTimeD: "ずっと つづく（さいだい +50%）", pShield: "🛡 みがわり", pShieldD: "つぎの しっぱいを 1かい ゆるす", pCalm: "🌤 おだやか", pCalmD: "つぎの 3ラウンド ルールの へんか なし", pScore: "💰 ボーナス +500", pScoreD: "いますぐ とくてん",
            over: "ゲームオーバー", overD: "{r}ラウンド・{s}てん", newBest: "しんきろく！", clearAll: "ぜんぶ クリア！", dailyDone: "きょうの チャレンジ しゅうりょう！", again: "もういちど", title: "タイトル", collT: "ずかん", collCount: "ミニゲーム {g} / {gt}　ルール {m} / {mt}", unseen: "？？？",
            rank0: "ビギナー", rank1: "ルーキー", rank2: "チャレンジャー", rank3: "ベテラン", rank4: "マスター", rank5: "でんせつ", shield: "🛡 みがわりが まもった！", dailyBest: "きょうの ベスト {s}てん"},
        en: {sub: "Mini-games whose rules change every round. Chase a high score under whatever the roulette picks!", run: "▶ Roulette Run", daily: "📅 Daily Challenge", coll: "📚 Collection", how: "📖 How to play", back: "← Back", best: "Best {s} pts ({r} rounds)",
            hT: "How to play", howL: ["The roulette picks a mini-game AND a rule twist.", "Each mini-game lasts about 10 seconds. Clear it to score; fail and lose a ❤.", "Mirror, Upside Down, Spotlight… a rule twist can change how a game feels completely!", "Every 4 rounds you can pick a perk.", "Run out of ❤ and it's over. The Daily Challenge is a single 10-round run!"],
            round: "Round {n}", score: "{s} pts", ready: "Ready…", ok: "Clear!", ng: "Miss…", timeout: "Time up", spin: "Spin!", noMod: "No rule twist", noModD: "Normal rules.",
            pkT: "Choose a perk", pkB: "Pick one", pHeart: "❤ Life +1", pHeartD: "Max 5", pTime: "⏳ Time +25%", pTimeD: "Lasts all run (max +50%)", pShield: "🛡 Shield", pShieldD: "Forgives your next miss", pCalm: "🌤 Calm", pCalmD: "No rule twists for 3 rounds", pScore: "💰 Bonus +500", pScoreD: "Points right now",
            over: "Game Over", overD: "{r} rounds · {s} pts", newBest: "New record!", clearAll: "All clear!", dailyDone: "Daily Challenge complete!", again: "Again", title: "Title", collT: "Collection", collCount: "Mini-games {g} / {gt}   Rules {m} / {mt}", unseen: "???",
            rank0: "Beginner", rank1: "Rookie", rank2: "Challenger", rank3: "Veteran", rank4: "Master", rank5: "Legend", shield: "🛡 Shield saved you!", dailyBest: "Today's best {s} pts"},
        zh: {sub: "每回合规则都会变化的小游戏。在轮盘选出的规则下冲击高分！", run: "▶ 轮盘挑战", daily: "📅 每日挑战", coll: "📚 图鉴", how: "📖 玩法", back: "← 返回", best: "最高 {s} 分（{r} 回合）",
            hT: "玩法", howL: ["轮盘会决定「小游戏」和「规则变化」。", "每个小游戏约10秒。通关得分，失败会失去一颗 ❤。", "「镜子」「颠倒」「黑暗」……规则一变，玩法完全不同！", "每4回合可以选择一个奖励（技能）。", "❤ 用完就结束。每日挑战是只有10回合的一局定胜负！"],
            round: "第 {n} 回合", score: "{s} 分", ready: "准备……", ok: "通关！", ng: "失败……", timeout: "时间到", spin: "开始转盘！", noMod: "没有规则变化", noModD: "普通规则。",
            pkT: "选择奖励", pkB: "选一个", pHeart: "❤ 生命 +1", pHeartD: "最多5个", pTime: "⏳ 时间 +25%", pTimeD: "整局有效（最多 +50%）", pShield: "🛡 护盾", pShieldD: "原谅下一次失败", pCalm: "🌤 平静", pCalmD: "接下来3回合没有规则变化", pScore: "💰 奖励 +500", pScoreD: "立刻加分",
            over: "游戏结束", overD: "{r} 回合・{s} 分", newBest: "新纪录！", clearAll: "全部通关！", dailyDone: "每日挑战结束！", again: "再来一次", title: "标题", collT: "图鉴", collCount: "小游戏 {g} / {gt}　规则 {m} / {mt}", unseen: "？？？",
            rank0: "新手", rank1: "菜鸟", rank2: "挑战者", rank3: "老手", rank4: "大师", rank5: "传说", shield: "🛡 护盾保护了你！", dailyBest: "今日最高 {s} 分"},
        ko: {sub: "라운드마다 규칙이 바뀌는 미니게임. 룰렛이 정한 규칙으로 하이스코어에 도전!", run: "▶ 룰렛 런", daily: "📅 오늘의 챌린지", coll: "📚 도감", how: "📖 방법", back: "← 돌아가기", best: "최고 {s}점 ({r}라운드)",
            hT: "방법", howL: ["룰렛이 \"미니게임\"과 \"규칙 변화\"를 정해요.", "미니게임은 약 10초. 클리어하면 득점, 실패하면 ❤ 하나를 잃어요.", "\"거울\" \"거꾸로\" \"어둠\"… 규칙이 바뀌면 느낌이 완전히 달라져요!", "4라운드마다 보상(퍽)을 하나 고를 수 있어요.", "❤ 가 없어지면 끝. 오늘의 챌린지는 10라운드 단판 승부!"],
            round: "라운드 {n}", score: "{s}점", ready: "준비…", ok: "클리어!", ng: "실패…", timeout: "시간 초과", spin: "룰렛 스타트!", noMod: "규칙 변화 없음", noModD: "평범한 규칙.",
            pkT: "보상을 고르세요", pkB: "하나 선택", pHeart: "❤ 라이프 +1", pHeartD: "최대 5개", pTime: "⏳ 시간 +25%", pTimeD: "끝까지 유지 (최대 +50%)", pShield: "🛡 방어막", pShieldD: "다음 실패를 한 번 봐줘요", pCalm: "🌤 평온", pCalmD: "다음 3라운드 규칙 변화 없음", pScore: "💰 보너스 +500", pScoreD: "바로 득점",
            over: "게임 오버", overD: "{r}라운드・{s}점", newBest: "신기록!", clearAll: "올 클리어!", dailyDone: "오늘의 챌린지 종료!", again: "다시", title: "타이틀", collT: "도감", collCount: "미니게임 {g} / {gt}　규칙 {m} / {mt}", unseen: "???",
            rank0: "비기너", rank1: "루키", rank2: "챌린저", rank3: "베테랑", rank4: "마스터", rank5: "전설", shield: "🛡 방어막이 지켜줬어요!", dailyBest: "오늘 최고 {s}점"}
    });
    function L(o){ var l = GK.lang(); return (o && (o[l] || o.ja)) || ""; }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
    function toast(msg, ms){ var e = $("toast"); e.textContent = msg; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1800); }

    var cv = $("cv"), c = cv.getContext("2d"), DPR = 1;
    var S = {scr: "title", run: null, R: null, cur: {x: W / 2, y: H / 2}, raw: {x: W / 2, y: H / 2}, down: false, tapQ: false, keys: {}, parts: [], phase: "idle", auto: false, daily: false, raf: 0, last: 0, view: null};

    function show(id){
        S.scr = id; ["title", "how", "coll", "play"].forEach(function(k){ $("s-" + k).classList.toggle("on", k === id); }); $("lgBtn").style.display = id === "play" ? "none" : "";
        document.documentElement.lang = GK.lang(); applyText();
        if(id === "coll") buildColl();
        if(window.GKI) GKI.mode(id === "play" ? "pointer" : "menu", cv);
    }
    function applyText(){
        $("tSub").textContent = t("sub"); $("bRun").textContent = t("run"); $("bDaily").textContent = t("daily"); $("bColl").textContent = t("coll"); $("bHow").textContent = t("how");
        $("hT").textContent = t("hT"); $("hBody").innerHTML = t("howL").map(function(x){ return "<p>" + esc(x) + "</p>"; }).join("");
        $("bHowBack").textContent = t("back"); $("bCollBack").textContent = t("back"); $("cT").textContent = t("collT");
        $("exitBtn").textContent = t("back"); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[GK.lang()];
        $("ovRetry").textContent = t("again"); $("ovTitle").textContent = t("title");
        var b = store.get("best", 0), br = store.get("bestRound", 0), db = store.get("d" + GK.daySeed(), 0);
        $("tBest").textContent = (b ? t("best", {s: b, r: br}) : "") + (db ? "　" + t("dailyBest", {s: db}) : "");
    }

    // ---- ラン ----
    function newRun(daily){
        var seed = daily ? GK.daySeed() : ((Math.random() * 1e9) | 0) + 1;
        S.daily = !!daily;
        S.run = {seed: seed, rng: GK.rng(seed), round: 0, lives: 3, score: 0, streak: 0, timeMul: 1, shield: 0, calm: 0, hist: [], wins: 0, maxRound: daily ? 10 : 9999};
        S.auto = !!window.__rrAuto;
        show("play"); GK.bgm("fun"); nextRound();
        if(!S.raf){ S.last = performance.now(); S.raf = requestAnimationFrame(loop); }
    }
    function pickRound(){
        var r = S.run, rng = r.rng, g = null, tries = 0;
        do { g = GAMES[Math.floor(rng() * GAMES.length)]; tries++; } while(r.hist.indexOf(g.id) >= 0 && tries < 30);
        r.hist.push(g.id); if(r.hist.length > 5) r.hist.shift();
        var mods = [];
        if(r.round > 2 && r.calm <= 0){
            var p = Math.min(1, .55 + r.round * .05);
            if(rng() < p){ var m1 = MODS[Math.floor(rng() * MODS.length)]; mods.push(m1.id);
                if(r.round > 11 && rng() < .35){ var tries2 = 0, m2; do { m2 = MODS[Math.floor(rng() * MODS.length)]; tries2++; } while((m2.id === m1.id || !compatible(m1.id, m2.id)) && tries2 < 30); if(m2.id !== m1.id && compatible(m1.id, m2.id)) mods.push(m2.id); } }
        }
        if(r.calm > 0) r.calm--;
        return {g: g, mods: mods};
    }
    function compatible(a, b){ var bad = [["fast", "slow"], ["big", "tiny"], ["mirror", "invert"], ["spin", "shake"], ["zoom", "dark"], ["fast", "hurry"], ["slow", "hurry"]]; return !bad.some(function(p){ return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); }); }
    function nextRound(){
        var r = S.run; r.round++;
        if(r.round > r.maxRound){ return endRun(true); }
        var pr = pickRound(); r.cur = pr; S.phase = "intro";
        $("lives").textContent = "❤".repeat(r.lives) + (r.shield ? " 🛡" + r.shield : ""); $("scoreP").textContent = t("score", {s: r.score}); $("roundP").textContent = t("round", {n: r.round});
        $("ban").innerHTML = ""; $("how").textContent = "";
        // ルーレット演出
        var intro = $("intro"); intro.classList.add("on"); $("introHow").textContent = "";
        var gi = 0, spins = 0, total = 16, modPool = pr.mods.length ? MODS : null;
        $("rG").innerHTML = ""; $("rM").innerHTML = ""; $("rM").style.display = "flex";
        function tick(){
            spins++;
            var g = spins >= total ? pr.g : GAMES[Math.floor(Math.random() * GAMES.length)], mm = spins >= total ? (pr.mods[0] ? RR.MOD[pr.mods[0]] : null) : (spins < total - 3 || pr.mods.length ? MODS[Math.floor(Math.random() * MODS.length)] : null);
            $("rG").innerHTML = '<span class="em">' + g.em + '</span><span>' + esc(L(g.n)) + '</span>';
            $("rM").innerHTML = mm ? '<span class="em">' + mm.em + '</span><span>' + esc(L(mm.n)) + '</span>' : '<span class="em">▫️</span><span>' + esc(t("noMod")) + '</span>';
            GK.sfx("tap");
            if(spins < total){ setTimeout(tick, 55 + spins * 9); }
            else {
                var d = pr.mods.length ? pr.mods.map(function(id){ return RR.MOD[id].em + " " + L(RR.MOD[id].d); }).join(" / ") : t("noModD");
                $("introHow").innerHTML = esc(L(pr.g.how)) + "<br><b>" + esc(d) + "</b>"; GK.sfx("coin");
                pr.mods.forEach(function(id){ store.set("m_" + id, 1); });
                setTimeout(startPlay, S.auto ? 150 : 1700);
            }
        }
        tick();
    }
    function startPlay(){
        var r = S.run, pr = r.cur; $("intro").classList.remove("on");
        var lv = Math.min(3.5, (r.round - 1) * .13);
        S.R = new RR.Round(pr.g, {seed: ((r.rng() * 1e9) | 0) + 1, lv: lv, mods: pr.mods, timeMul: r.timeMul});
        S.parts = []; S.cur = {x: W / 2, y: H / 2}; S.phase = "play"; S.tapQ = false; S.down = false; S.view = null;
        $("ban").innerHTML = '<span class="chip">' + pr.g.em + " " + esc(L(pr.g.n)) + '</span>' + pr.mods.map(function(id){ return '<span class="chip mod">' + RR.MOD[id].em + " " + esc(L(RR.MOD[id].n)) + '</span>'; }).join("");
        $("how").textContent = L(pr.g.how); GK.sfx("whoosh");
    }
    function finishRound(win){
        var r = S.run, R = S.R, pr = r.cur; S.phase = "flash";
        var fl = $("flash");
        if(win){
            var gain = 100 + Math.floor(R.left() * 10) + r.streak * 15 + (pr.mods.length ? 40 * pr.mods.length : 0); r.score += gain; r.streak++; r.wins++;
            store.set("g_" + pr.g.id, (store.get("g_" + pr.g.id, 0) || 0) + 1);
            fl.textContent = t("ok") + " +" + gain; fl.style.color = "#7dffb0"; GK.sfx("win"); GK.vibrate(30);
        } else {
            r.streak = 0;
            if(r.shield > 0){ r.shield--; fl.textContent = t("shield"); fl.style.color = "#ffe36a"; GK.sfx("ok"); }
            else { r.lives--; fl.textContent = R.why === "time" || R.why === "" ? t("timeout") : t("ng"); fl.style.color = "#ff8a9a"; GK.sfx("lose"); GK.vibrate(70); }
        }
        $("lives").textContent = "❤".repeat(Math.max(0, r.lives)) + (r.shield ? " 🛡" + r.shield : ""); $("scoreP").textContent = t("score", {s: r.score});
        fl.classList.add("on");
        setTimeout(function(){
            fl.classList.remove("on");
            if(r.lives <= 0) return endRun(false);
            if(r.round % 4 === 0 && r.round < r.maxRound) return perkChoice();
            nextRound();
        }, S.auto ? 120 : 950);
    }
    var PERKS = [["heart", "pHeart", "pHeartD"], ["time", "pTime", "pTimeD"], ["shield", "pShield", "pShieldD"], ["calm", "pCalm", "pCalmD"], ["score", "pScore", "pScoreD"]];
    function perkChoice(){
        var r = S.run, pool = PERKS.slice(), opts = [];
        while(opts.length < 3){ var k = Math.floor(r.rng() * pool.length); opts.push(pool.splice(k, 1)[0]); }
        $("pkT").textContent = t("pkT"); $("pkB").textContent = t("pkB");
        $("perks").innerHTML = opts.map(function(o){ return '<button type="button" data-p="' + o[0] + '">' + esc(t(o[1])) + '<small>' + esc(t(o[2])) + '</small></button>'; }).join("");
        $("mPerk").classList.add("on"); S.phase = "perk";
        if(S.auto) setTimeout(function(){ var b = $("perks").querySelector("button"); if(b) b.click(); }, 100);
    }
    $("perks").addEventListener("click", function(e){
        var b = e.target.closest("button"); if(!b) return; var r = S.run, p = b.dataset.p;
        if(p === "heart") r.lives = Math.min(5, r.lives + 1); else if(p === "time") r.timeMul = Math.min(1.5, r.timeMul * 1.25); else if(p === "shield") r.shield++; else if(p === "calm") r.calm = 3; else if(p === "score") r.score += 500;
        GK.sfx("coin"); $("mPerk").classList.remove("on"); nextRound();
    });
    function endRun(done){
        var r = S.run; S.phase = "over"; GK.bgm("off");
        var best = store.get("best", 0), isBest = !S.daily && r.score > best;
        if(isBest){ store.set("best", r.score); store.set("bestRound", r.round - (done ? 1 : 0)); }
        if(S.daily){ var k = "d" + GK.daySeed(); if(r.score > store.get(k, 0)) store.set(k, r.score); }
        var rank = r.score >= 6000 ? 5 : r.score >= 3500 ? 4 : r.score >= 2000 ? 3 : r.score >= 1000 ? 2 : r.score >= 400 ? 1 : 0;
        $("ovT").textContent = done ? (S.daily ? t("dailyDone") : t("clearAll")) : t("over");
        $("ovRank").textContent = "★★★★★".slice(0, Math.max(1, Math.min(5, rank + 1))) + " " + t("rank" + rank);
        $("ovB").textContent = t("overD", {r: Math.max(0, r.round - (done ? 1 : 0)), s: r.score}) + (isBest ? "　" + t("newBest") : "");
        $("mOver").classList.add("on"); if(done || isBest) GK.confetti(); GK.sfx(done ? "win" : "lose");
    }

    // ---- ずかん ----
    function buildColl(){
        var g = 0; $("cgrid").innerHTML = GAMES.map(function(x){ var n = store.get("g_" + x.id, 0); if(n) g++; return '<div class="cardbtn' + (n ? "" : " locked") + '"><span class="e">' + (n ? x.em : "❔") + '</span><b style="font-size:13px">' + esc(n ? L(x.n) : t("unseen")) + '</b><small>' + (n ? "×" + n : "") + '</small></div>'; }).join("");
        var m = 0; $("mgrid").innerHTML = MODS.map(function(x){ var s = store.get("m_" + x.id, 0); if(s) m++; return '<span class="' + (s ? "" : "lock") + '">' + (s ? x.em + " " + esc(L(x.n)) : "❔ " + esc(t("unseen"))) + '</span>'; }).join("");
        $("cCount").textContent = t("collCount", {g: g, gt: GAMES.length, m: m, mt: MODS.length});
    }

    // ---- 入力 ----
    function rawFrom(e){ var r = cv.getBoundingClientRect(); S.raw = {x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H}; }
    cv.addEventListener("pointerdown", function(e){ e.preventDefault(); try{ cv.setPointerCapture(e.pointerId); }catch(_e){} rawFrom(e); S.down = true; S.tapQ = true; S.tapRaw = {x: S.raw.x, y: S.raw.y}; mapCur(); });
    cv.addEventListener("pointermove", function(e){ rawFrom(e); mapCur(); });
    cv.addEventListener("pointerup", function(e){ S.down = false; });
    cv.addEventListener("pointercancel", function(){ S.down = false; });
    function mapCur(){ if(!S.R) return; var v = S.view || RR.viewOf(S.R.mods, S.R.t, S.cur); S.cur = RR.toGame(v, S.raw.x, S.raw.y, S.R.mods); }
    // キーボード・プロコンは 共通部品 GKI。スティック／十字＝カーソル、A＝タップ（おしっぱなし OK）、＋＝タイトルへ。キーボードは 矢印／WASD で カーソル、Enter／Space で タップ
    if(window.GKI){
        GKI.legend([{k: "dpad", t: {ja: "カーソルを うごかす（スティック・十字）", en: "Move the cursor (stick / D-pad)", zh: "移动光标（摇杆/方向键）", ko: "커서 이동 (스틱/방향키)"}},
            {k: "a", t: {ja: "タップ（おしっぱなしも OK）", en: "Tap (hold works too)", zh: "点击（可按住）", ko: "탭 (누르고 있기 가능)"}}, {k: "plus", t: {ja: "タイトルに もどる", en: "Back to title", zh: "返回标题", ko: "타이틀로"}}]);
        GKI.on(function(a, down){
            if(S.scr !== "play") return;
            if(a === "a"){ if(down){ if(!S.spaceDown){ S.spaceDown = true; S.tapQ = true; S.tapRaw = null; } } else S.spaceDown = false; }
            else if(down && a === "plus") $("exitBtn").click();
        });
        GKI.onBack(function(){ if(S.scr !== "title") $("exitBtn").click(); });
    }

    // ---- ループ ----
    function resize(){
        var wrap = $("stageWrap"), r = wrap.getBoundingClientRect(), s = Math.min((r.width - 8) / W, (r.height - 20) / H); if(s <= 0) return;
        DPR = Math.min(2, window.devicePixelRatio || 1); cv.style.width = Math.floor(W * s) + "px"; cv.style.height = Math.floor(H * s) + "px"; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    }
    var KSP = 430;
    function loop(now){
        S.raf = requestAnimationFrame(loop);
        var dt = Math.min(.05, (now - S.last) / 1000); S.last = now;
        if(S.scr !== "play" || !S.R) return;
        try{ tickGame(dt, now); }catch(e){ console.error(e); }
    }
    function tickGame(dt, now){
        var R = S.R, g = R.g;
        c.setTransform(DPR, 0, 0, DPR, 0, 0);
        if(S.phase === "play"){
            // キーボードの カーソル
            var ka = window.GKI ? GKI.keyAxis() : {x: 0, y: 0}, kx = ka.x, ky = ka.y;
            if(kx || ky){ var dir = (R.mods.indexOf("mirror") >= 0 || R.mods.indexOf("invert") >= 0) && kx ? -kx : kx; S.cur.x = Math.max(0, Math.min(W, S.cur.x + (R.mods.indexOf("invert") >= 0 ? -kx : kx) * KSP * dt)); S.cur.y = Math.max(0, Math.min(H, S.cur.y + (R.mods.indexOf("invert") >= 0 ? -ky : ky) * KSP * dt)); }
            var v = RR.viewOf(R.mods, R.t, S.cur); S.view = v;
            if(S.tapQ && S.tapRaw){ S.cur = RR.toGame(v, S.tapRaw.x, S.tapRaw.y, R.mods); }
            else if(!kx && !ky && S.raw && (S.down || S.moved !== false)){ /* pointermove が ひろう */ }
            var inp = {x: S.cur.x, y: S.cur.y, tap: !!S.tapQ, down: !!(S.down || S.spaceDown)};
            S.tapQ = false;
            if(S.auto){ inp.tap = false; inp.down = false; g.ai(R, inp); S.cur.x = inp.x; S.cur.y = inp.y; }
            R.step(dt, inp);
            R.fxq.forEach(function(f){ for(var k = 0; k < 10; k++){ var a = Math.random() * 6.28, sp = 60 + Math.random() * 180; S.parts.push({x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: .6, c: f.c}); } }); R.fxq.length = 0;
            R.sfxq.forEach(function(n){ GK.sfx(n); }); R.sfxq.length = 0;
            $("tfill").style.transform = "scaleX(" + (R.left() / R.time).toFixed(3) + ")";
            if(R.status !== "run") finishRound(R.status === "win");
        }
        draw(now);
    }
    function draw(now){
        var R = S.R, v = S.view || RR.viewOf(R.mods, R.t, S.cur);
        c.clearRect(0, 0, W, H); c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
        c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
        c.translate(W / 2 + v.jx, H / 2 + v.jy); c.rotate(v.rot); c.scale(v.zoom, v.zoom * v.flip); c.translate(-v.fx, -v.fy);
        R.g.draw(R, c);
        for(var i = S.parts.length - 1; i >= 0; i--){ var p = S.parts[i]; p.x += p.vx * .016; p.y += p.vy * .016; p.vy += 8; p.l -= .016; if(p.l <= 0){ S.parts.splice(i, 1); continue; } c.globalAlpha = Math.max(0, p.l / .6); c.fillStyle = p.c; c.fillRect(p.x - 3, p.y - 3, 6, 6); } c.globalAlpha = 1;
        // カーソル（ゲームの 世界の 座標）
        if(S.phase === "play"){ c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 2; c.beginPath(); c.arc(S.cur.x, S.cur.y, 11, 0, 6.3); c.stroke(); }
        c.restore();
        if(R.mods.indexOf("dark") >= 0 && S.phase === "play"){
            var sp = RR.toScreen(v, S.cur.x, S.cur.y), gr = c.createRadialGradient(sp.x, sp.y, 60, sp.x, sp.y, 130); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.97)");
            c.fillStyle = gr; c.fillRect(0, 0, W, H);
        }
    }
    // ---- ボタン ----
    $("bRun").onclick = function(){ newRun(false); };
    $("bDaily").onclick = function(){ newRun(true); };
    $("bColl").onclick = function(){ show("coll"); };
    $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = $("bCollBack").onclick = function(){ show("title"); };
    $("ovRetry").onclick = function(){ $("mOver").classList.remove("on"); newRun(S.daily); };
    $("ovTitle").onclick = function(){ $("mOver").classList.remove("on"); S.R = null; show("title"); };
    $("exitBtn").onclick = function(){
        if(S.scr === "play"){ S.R = null; S.phase = "idle"; $("intro").classList.remove("on"); $("flash").classList.remove("on"); $("mPerk").classList.remove("on"); GK.bgm("off"); show("title"); return; }
        if(S.scr !== "title"){ show("title"); return; }
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "./index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()) GK.sfx("ok"); };
    $("lgBtn").onclick = function(){ var order = ["ja", "en", "zh", "ko"], i = order.indexOf(GK.lang()); GK.LS.set("are_lang", order[(i + 1) % 4]); show(S.scr); };
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
    window.__rr = {S: S, RR: RR, newRun: newRun, resize: resize, show: show, finishRound: finishRound};
    show("title"); setTimeout(resize, 50);
    var _sp = show; show = function(id){ _sp(id); if(id === "play") setTimeout(resize, 30); };
})();
