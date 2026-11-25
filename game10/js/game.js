"use strict";
// ===== ループ・ラボ：画面・入力・描画 =====
(function(){
    var Sim = window.G10Sim, LEVELS = window.G10_LEVELS, $ = function(id){ return document.getElementById(id); };
    var PKEY = "g10_prog_v1", COL = {a: "#ff9a3c", b: "#3cc6ff", c: "#ff5fa8", d: "#8be04a"}, GCOL = ["#7fd3ff", "#ffb3e6", "#b8ff9a", "#ffe08a", "#c9b3ff", "#9af0d8", "#ffc27f"];
    var prog = {}; try{ prog = JSON.parse(localStorage.getItem(PKEY) || "{}") || {}; }catch(_e){}
    function saveProg(){ try{ localStorage.setItem(PKEY, JSON.stringify(prog)); }catch(_e){} }

    // ---------- 音 ----------
    var actx = null;
    function beep(f, d, type, v){ try{ if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); var o = actx.createOscillator(), g = actx.createGain(); o.type = type || "sine"; o.frequency.value = f; g.gain.value = v == null ? .12 : v; o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + d); o.stop(actx.currentTime + d); }catch(_e){} }
    var sfx = {move: function(){ beep(330, .05, "triangle", .08); }, bump: function(){ beep(110, .08, "square", .06); }, plate: function(){ beep(660, .12, "sine", .14); setTimeout(function(){ beep(880, .12, "sine", .12); }, 70); }, door: function(){ beep(520, .18, "triangle", .12); },
        loop: function(){ beep(880, .08, "sawtooth", .1); setTimeout(function(){ beep(660, .08, "sawtooth", .1); }, 80); setTimeout(function(){ beep(440, .14, "sawtooth", .1); }, 160); },
        clear: function(){ [523, 659, 784, 1047].forEach(function(f, i){ setTimeout(function(){ beep(f, .22, "triangle", .16); }, i * 110); }); }, fail: function(){ beep(180, .3, "sawtooth", .12); }};

    // ---------- 画面 ----------
    var scr = {title: $("s-title"), how: $("s-how"), sel: $("s-sel"), gen: $("s-gen"), play: $("s-play")};
    function show(k){ Object.keys(scr).forEach(function(n){ scr[n].classList.toggle("on", n === k); }); where = k; document.body.classList.toggle("g10play", k === "play"); if(window.GKI) GKI.mode(k === "play" ? "keys" : "menu"); if(k === "play") setTimeout(resize, 30); }
    var where = "title";
    function paintLevels(){
        $("levels").innerHTML = LEVELS.map(function(lv, i){
            var open = i === 0 || prog[i - 1] != null || prog[i] != null, st = prog[i] || 0;
            return '<button type="button" class="lv' + (open ? "" : " locked") + '" data-i="' + i + '"' + (open ? "" : " disabled") + '><b>' + (i + 1) + '</b><small>' + (open ? lv.name : "🔒") + '</small><span class="st">' + (st ? "★".repeat(st) + "☆".repeat(3 - st) : (open ? "☆☆☆" : "")) + '</span></button>';
        }).join("");
    }
    $("bPlay").onclick = function(){ paintLevels(); show("sel"); };
    $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = function(){ show("title"); };
    $("bSelBack").onclick = function(){ show("title"); };
    $("levels").addEventListener("click", function(e){ var b = e.target.closest("[data-i]"); if(b && !b.disabled) start(Number(b.dataset.i)); });
    $("exitBtn").onclick = function(){
        if(where === "play"){ if(S && S.custom){ openGen(); } else{ paintLevels(); show("sel"); } return; }
        if(where === "sel" || where === "how" || where === "gen"){ show("title"); return; }
        try{ var back = new URLSearchParams(location.search).get("back"); location.href = "../index.html" + (back ? "?back=" + encodeURIComponent(back) : ""); }catch(_e){ history.back(); }
    };

    // ---------- きょうのステージ・ランダム（C++ → WebAssembly の ステージ生成。js/g10gen.js）----------
    // このブロックの ことばは 4か国語（are_lang）。ゲームの ほかの ぶぶんは 日本語のまま。
    var TX = {
        gBtn: {ja: "🎲 きょうのステージ・ランダム", en: "🎲 Daily & random stages", zh: "🎲 每日·随机关卡", ko: "🎲 오늘의·랜덤 스테이지"},
        gTitle: {ja: "🎲 きょうのステージ ＆ ランダム", en: "🎲 Daily & Random Stages", zh: "🎲 每日关卡与随机关卡", ko: "🎲 오늘의 스테이지 & 랜덤"},
        gDaily: {ja: "きょうのステージ（{d}）", en: "Today's stage ({d})", zh: "今日关卡（{d}）", ko: "오늘의 스테이지({d})"},
        gDailyNote: {ja: "きょうは だれでも 同じステージです。1日1回、あたらしく なります。", en: "Everyone gets the same stage today. It changes once a day.", zh: "今天所有人玩同一个关卡，每天更新一次。", ko: "오늘은 누구나 같은 스테이지예요. 하루에 한 번 바뀌어요."},
        gRandom: {ja: "ランダムステージ", en: "Random stage", zh: "随机关卡", ko: "랜덤 스테이지"},
        gRandomNote: {ja: "押すたびに ちがうステージ。番号を おぼえれば また あそべます。", en: "A different stage every time. Remember the number to replay it.", zh: "每次都是不同的关卡，记住编号就能重玩。", ko: "누를 때마다 다른 스테이지예요. 번호를 기억하면 다시 할 수 있어요."},
        gLv1: {ja: "かんたん", en: "Easy", zh: "简单", ko: "쉬움"},
        gLv2: {ja: "ふつう", en: "Normal", zh: "普通", ko: "보통"},
        gLv3: {ja: "むずかしい", en: "Hard", zh: "困难", ko: "어려움"},
        gNum: {ja: "ステージ番号で えらぶ（ともだちと 同じステージで あそべます）", en: "Pick by stage number (play the same stage as a friend)", zh: "按关卡编号选择（可与朋友玩同一关）", ko: "스테이지 번호로 고르기(친구와 같은 스테이지)"},
        gGo: {ja: "▶ この番号で あそぶ", en: "▶ Play this number", zh: "▶ 玩这个编号", ko: "▶ 이 번호로 플레이"},
        gNumBad: {ja: "0〜4294967295 の 数字を 入れてね", en: "Enter a number from 0 to 4294967295", zh: "请输入 0 到 4294967295 的数字", ko: "0~4294967295 사이의 숫자를 입력하세요"},
        gLoading: {ja: "じゅんび中…", en: "Preparing…", zh: "准备中…", ko: "준비 중…"},
        gFail: {ja: "ステージを つくれませんでした（この ブラウザでは WebAssembly が つかえないかも）。", en: "Could not make a stage (WebAssembly may be unavailable in this browser).", zh: "无法生成关卡（此浏览器可能不支持 WebAssembly）。", ko: "스테이지를 만들지 못했어요(이 브라우저는 WebAssembly를 쓸 수 없을지도 몰라요)."},
        gBack: {ja: "タイトルへ", en: "Back", zh: "返回", ko: "돌아가기"},
        gNameDaily: {ja: "🎲 きょうのステージ・{lv}", en: "🎲 Today · {lv}", zh: "🎲 今日关卡·{lv}", ko: "🎲 오늘의 스테이지·{lv}"},
        gNameRand: {ja: "🎲 ランダム・{lv}  No.{n}", en: "🎲 Random · {lv}  No.{n}", zh: "🎲 随机·{lv}  编号 {n}", ko: "🎲 랜덤·{lv}  No.{n}"},
        gHint: {ja: "ボタンを 先に ぶんしんに ふんでもらおう。こまったら 💡ヒント！", en: "Let your clones step on the buttons first. Stuck? Press 💡 Hint!", zh: "先让分身踩住按钮。卡住了就按 💡 提示！", ko: "먼저 분신이 버튼을 밟게 하세요. 막히면 💡 힌트!"},
        gClearT: {ja: "🎉 クリア！", en: "🎉 Cleared!", zh: "🎉 通关！", ko: "🎉 클리어!"},
        gClearB: {ja: "ぶんしん {n}人（お手本は {p}人）", en: "Clones: {n} (model answer: {p})", zh: "分身 {n} 个（参考答案 {p} 个）", ko: "분신 {n}명(모범 답안 {p}명)"},
        gMore: {ja: "もっと すくなく できるかも？", en: "Maybe you can do it with fewer?", zh: "也许还能用更少的分身？", ko: "더 적게도 할 수 있을지도?"},
        gPerfect: {ja: "かんぺき！", en: "Perfect!", zh: "完美！", ko: "완벽!"},
        gNext: {ja: "▶ つぎの ランダム", en: "▶ Next random stage", zh: "▶ 下一个随机关卡", ko: "▶ 다음 랜덤"},
        gRetry: {ja: "もういちど", en: "Try again", zh: "再玩一次", ko: "다시 하기"}
    };
    function lang(){ try{ var l = localStorage.getItem("are_lang"); return /^(ja|en|zh|ko)$/.test(l) ? l : "ja"; }catch(_e){ return "ja"; } }
    function T(k, v){ var o = TX[k], s = o ? (o[lang()] || o.ja) : k; if(v) Object.keys(v).forEach(function(x){ s = s.split("{" + x + "}").join(String(v[x])); }); return s; }
    function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
    var DKEY = "g10_daily_v1", dstars = {};
    try{ dstars = JSON.parse(localStorage.getItem(DKEY) || "{}") || {}; if(typeof dstars !== "object" || Array.isArray(dstars)) dstars = {}; }catch(_e){ dstars = {}; }
    function saveDaily(){ var ks = Object.keys(dstars).sort(); while(ks.length > 90) delete dstars[ks.shift()]; try{ localStorage.setItem(DKEY, JSON.stringify(dstars)); }catch(_e){} }
    function todaySeed(){ var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    function dailyKey(level){ return todaySeed() + "-" + level; }
    function randSeed(){
        try{ var a = new Uint32Array(1); (window.crypto || window.msCrypto).getRandomValues(a); return a[0]; }catch(_e){ return Math.floor(Math.random() * 4294967296) >>> 0; }
    }
    function customName(c){ return c.kind === "daily" ? T("gNameDaily", {lv: T("gLv" + c.level)}) : T("gNameRand", {lv: T("gLv" + c.level), n: c.seed}); }
    function genMsg(t){ var e = $("gMsg"); if(e) e.textContent = t || ""; }
    function paintGen(){
        var d = new Date(), ds = (d.getMonth() + 1) + "/" + d.getDate(), l = lang();
        function lvBtns(kind){
            return [1, 2, 3].map(function(n){
                var st = kind === "daily" ? (dstars[dailyKey(n)] || 0) : 0;
                return '<button type="button" class="gbtn" data-k="' + kind + '" data-lv="' + n + '">' + esc(T("gLv" + n)) + (kind === "daily" ? '<br><span class="st">' + (st ? "★".repeat(st) + "☆".repeat(3 - st) : "☆☆☆") + '</span>' : '') + '</button>';
            }).join("");
        }
        $("s-gen").innerHTML = '<h2>' + esc(T("gTitle")) + '</h2>' +
            '<div class="panel"><b>' + esc(T("gDaily", {d: ds})) + '</b><p>' + esc(T("gDailyNote")) + '</p><div class="row">' + lvBtns("daily") + '</div></div>' +
            '<div class="panel"><b>' + esc(T("gRandom")) + '</b><p>' + esc(T("gRandomNote")) + '</p><div class="row">' + lvBtns("rand") + '</div></div>' +
            '<div class="panel"><b>' + esc(T("gNum")) + '</b><div class="row" style="margin-top:8px"><input id="gNum" type="text" inputmode="numeric" autocomplete="off" maxlength="10" data-pad-text aria-label="' + esc(T("gNum")) + '">' +
            '<select id="gNumLv" aria-label="level">' + [1, 2, 3].map(function(n){ return '<option value="' + n + '"' + (n === 2 ? " selected" : "") + '>' + esc(T("gLv" + n)) + '</option>'; }).join("") + '</select>' +
            '<button type="button" id="gGo">' + esc(T("gGo")) + '</button></div></div>' +
            '<p id="gMsg" class="hint" role="status"></p><div class="row"><button type="button" id="gBack">' + esc(T("gBack")) + '</button></div>';
        document.documentElement.lang = l;
    }
    function openGen(){ paintGen(); show("gen"); }
    function startGen(kind, level, seed){
        genMsg(T("gLoading"));
        if(!window.G10Gen){ genMsg(T("gFail")); return; }
        window.G10Gen.load().then(function(api){
            var lv = api.gen(seed, level);
            if(!lv) throw new Error("gen");
            genMsg("");
            begin({name: "", steps: lv.steps, par: lv.par, hint: T("gHint"), map: lv.map}, -1, {kind: kind, level: level, seed: seed});
        }).catch(function(){ if(where !== "gen") openGen(); genMsg(T("gFail")); });
    }
    $("bGen").onclick = openGen;
    $("s-gen").addEventListener("click", function(e){
        var b = e.target.closest ? e.target.closest("button") : null; if(!b) return;
        if(b.id === "gBack"){ show("title"); return; }
        if(b.id === "gGo"){
            var v = ($("gNum").value || "").trim();
            if(!/^\d{1,10}$/.test(v) || Number(v) > 4294967295){ genMsg(T("gNumBad")); $("gNum").focus(); return; }
            startGen("rand", Number($("gNumLv").value) || 2, Number(v)); return;
        }
        if(b.dataset.k){ var lv = Number(b.dataset.lv); startGen(b.dataset.k, lv, b.dataset.k === "daily" ? todaySeed() : randSeed()); }
    });
    window.addEventListener("storage", function(e){ if(e.key === "are_lang"){ $("bGen").textContent = T("gBtn"); if(where === "gen") paintGen(); } });
    $("bGen").textContent = T("gBtn");

    // ---------- ゲーム ----------
    var cv = $("cv"), ctx = cv.getContext("2d"), G = null, S = null, W = 0, H = 0, ts = 30, ox = 0, oy = 0, dpr = 1;
    // S: {idx, g, lv, ghosts:[path], run, stepsLeft, max, won, hint, vis:{me:[x,y], gh:[[x,y]]}, face, fx:[], t0}
    function start(i){ begin(LEVELS[i], i, null); }
    // custom：きょうのステージ／ランダム（{kind:"daily"|"rand", level, seed}）。ふつうの ステージは null
    function begin(lv, i, custom){
        var g = Sim.parse(lv);
        S = {idx: i, custom: custom, g: g, lv: lv, ghosts: [], run: Sim.newRun(g), stepsLeft: lv.steps, max: lv.par + 1, won: false, hint: null, vis: {me: g.S.slice(), gh: []}, face: "R", fx: [], prevOpen: null, shake: 0};
        S.prevOpen = openNow(); $("clear").hidden = true; show("play"); paintHud(); toast(lv.hint, 5200); resize();
    }
    function openNow(){ return Sim.openState(S.g, S.ghosts.map(function(p){ return p; }), S.run.me, S.run.t); }
    function paintHud(){
        $("lvName").textContent = S.custom ? customName(S.custom) : "Lv." + (S.idx + 1) + "  " + S.lv.name;
        $("gInfo").textContent = "ぶんしん " + S.ghosts.length + "/" + S.max;
        var sl = S.stepsLeft; $("sInfo").textContent = "のこり " + sl + "歩"; $("sInfo").classList.toggle("low", sl <= 5);
        $("bLoop").disabled = S.won || S.ghosts.length >= S.max;
    }
    var toastT = 0;
    function toast(t, ms){ var e = $("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function(){ e.classList.remove("on"); }, ms || 2000); }
    function doStep(dir){
        if(!S || S.won || where !== "play" || !$("clear").hidden) return;
        if(S.stepsLeft <= 0){ toast("歩数が ない！ ⏪ ぶんしんを つくる か、↺ やりなおそう", 2200); sfx.fail(); return; }
        var before = S.run.me.slice(), r = Sim.step(S.g, S.ghosts, S.run, dir);
        S.stepsLeft--; if(dir && dir !== "W") S.face = dir;
        if(dir && !r.moved){ S.shake = 6; sfx.bump(); } else if(r.moved) sfx.move();
        var now = openNow(); Object.keys(now).forEach(function(k){ var p = S.prevOpen[k]; if(p && now[k].on > p.on) sfx.plate(); if(p && now[k].open !== p.open){ sfx.door(); burst(S.g.doors[k][0], COL[k.toLowerCase()]); } }); S.prevOpen = now;
        S.hint = null; paintHud();
        if(r.win){ win(); return; }
        if(S.stepsLeft <= 0) toast("歩数が なくなった！ ⏪ ぶんしんを つくるか、↺ やりなおそう", 2600);
    }
    function newLoop(){
        if(!S || S.won) return;
        if(S.run.t === 0){ toast("すこし 動いてから 押してね", 1600); return; }
        if(S.ghosts.length >= S.max){ toast("ぶんしんは もう つくれません。🔄 ぜんぶ やりなおそう", 2400); sfx.fail(); return; }
        S.ghosts.push(S.run.path.slice()); burst(S.run.me, GCOL[(S.ghosts.length - 1) % GCOL.length]); S.run = Sim.newRun(S.g); S.stepsLeft = S.lv.steps; S.hint = null; S.face = "R";
        S.vis.me = S.g.S.slice(); S.vis.gh = S.ghosts.map(function(p){ return p[0].slice(); }); S.prevOpen = openNow(); sfx.loop(); paintHud(); toast("ぶんしん " + S.ghosts.length + "人目！ スタートから もういちど", 1800);
    }
    function retryLoop(){ if(!S || S.won) return; S.run = Sim.newRun(S.g); S.stepsLeft = S.lv.steps; S.vis.me = S.g.S.slice(); S.vis.gh = S.ghosts.map(function(p){ return p[0].slice(); }); S.hint = null; S.prevOpen = openNow(); paintHud(); toast("このループを やりなおし", 1200); }
    function resetAll(){ if(!S) return; if(S.custom){ begin(S.lv, -1, S.custom); } else start(S.idx); toast("ぜんぶ やりなおし", 1200); }
    function win(){
        S.won = true; sfx.clear();
        var n = S.ghosts.length, stars = n <= S.lv.par ? 3 : n <= S.lv.par + 1 ? 2 : 1;
        if(S.custom){ if(S.custom.kind === "daily"){ var dk = dailyKey(S.custom.level); dstars[dk] = Math.max(dstars[dk] || 0, stars); saveDaily(); } }
        else{
            var first = prog[S.idx] == null; prog[S.idx] = Math.max(prog[S.idx] || 0, stars); saveProg();
            try{ if(window.AREFeaturePanel){ var tot = 0; Object.keys(prog).forEach(function(k){ tot += prog[k]; }); window.AREFeaturePanel.recordRun("game10", tot); } }catch(_e){}
        }
        for(var k = 0; k < 40; k++) S.fx.push({x: S.g.E[0] + .5, y: S.g.E[1] + .5, vx: (Math.random() - .5) * 8, vy: (Math.random() - .5) * 8, life: 1, c: GCOL[k % GCOL.length]});
        setTimeout(function(){
            $("clStars").innerHTML = [0, 1, 2].map(function(i){ return '<i class="' + (i < stars ? "on" : "") + '" style="animation-delay:' + (i * .18) + 's">★</i>'; }).join("");
            if(S.custom){
                $("clT").textContent = T("gClearT");
                $("clB").textContent = T("gClearB", {n: n, p: S.lv.par}) + "　" + T(stars < 3 ? "gMore" : "gPerfect");
                $("clNext").textContent = T("gNext"); $("clNext").hidden = S.custom.kind !== "rand";
                $("clRetry").textContent = T("gRetry"); $("clSel").textContent = T("gBack");
            }else{
                $("clT").textContent = S.idx === LEVELS.length - 1 ? "🎉 ぜんぶ クリア！" : "🎉 クリア！";
                $("clB").textContent = "ぶんしん " + n + "人（お手本は " + S.lv.par + "人）" + (stars < 3 ? "　もっと すくなく できるかも？" : "　かんぺき！");
                $("clNext").textContent = "▶ つぎへ"; $("clRetry").textContent = "もういちど"; $("clSel").textContent = "ステージえらび";
                $("clNext").hidden = S.idx >= LEVELS.length - 1;
            }
            $("clear").hidden = false;
        }, 700);
    }
    $("clNext").onclick = function(){ if(S.custom){ startGen("rand", S.custom.level, randSeed()); } else start(S.idx + 1); };
    $("clRetry").onclick = function(){ if(S.custom){ startGen(S.custom.kind, S.custom.level, S.custom.seed); } else start(S.idx); };
    $("clSel").onclick = function(){ $("clear").hidden = true; if(S && S.custom){ openGen(); } else{ paintLevels(); show("sel"); } };
    $("bLoop").onclick = newLoop; $("bRetry").onclick = retryLoop; $("bReset").onclick = resetAll; $("bWait").onclick = function(){ doStep(null); };
    $("bHint").onclick = function(){ hint(); };

    // ---------- ヒント：のこりの ぶんしんで 解ける 次の いちばん いい ボタンを さがす ----------
    function hint(){
        if(!S || S.won) return;
        var g = S.g, steps = S.lv.steps - 1, left = S.max - S.ghosts.length, ghosts = S.ghosts, all = [];
        Object.keys(g.plates).forEach(function(k){ g.plates[k].forEach(function(p){ all.push(p); }); });
        if(Sim.plan(g, ghosts, g.E, steps)){ S.hint = {kind: "exit"}; toast("いまの ぶんしんで 出口へ いけます！ スタートから 出口まで 歩こう", 3400); return; }
        var best = null;
        (function rec(gs, used, depth, first){
            if(best || depth > left) return;
            if(depth > 0 && Sim.plan(g, gs, g.E, steps)){ best = first; return; }
            if(depth === left) return;
            all.forEach(function(p){
                if(best || used[p.join(",")]) return; var path = Sim.plan(g, gs, p, steps); if(!path) return;
                var run = Sim.newRun(g); path.forEach(function(d){ Sim.step(g, gs, run, d); }); var u = Object.assign({}, used); u[p.join(",")] = 1;
                rec(gs.concat([run.path]), u, depth + 1, first || p);
            });
        })(ghosts, {}, 0, null);
        if(best){ S.hint = {kind: "plate", x: best[0], y: best[1]}; toast("つぎは 光っている ボタンの上に 立って ⏪ を押そう", 3600); }
        else toast("この ぶんしんでは むずかしそう… 🔄 ぜんぶ やりなおして みよう", 3200);
    }

    // ---------- 入力 ----------
    // キーボード・プロコンは 共通部品 GKI（そうさ設定で かえられる）。十字／スティック＝うごく（おしっぱなしで れんぞく）、A＝⏪ぶんしん、B＝まつ、Y＝このループを やりなおす、X＝ヒント、＋＝ステージえらび
    var DIRS = {up: "U", down: "D", left: "L", right: "R"}, rp = {};
    function stopRep(a){ if(rp[a]){ clearTimeout(rp[a].t); clearInterval(rp[a].i); rp[a] = null; } }
    if(window.GKI){
        GKI.defaults({a: ["Enter", "z"], b: [" ", "."], x: ["h"], y: ["r"], plus: ["Escape", "p"]});
        GKI.legend([{k: "dpad", t: {ja: "うごく（おしっぱなしで れんぞく）", en: "Move (hold to repeat)", zh: "移动（按住连续）", ko: "이동 (누르면 연속)"}},
            {k: "a", t: {ja: "⏪ ぶんしんを つくって やりなおす", en: "⏪ Make a clone and loop again", zh: "⏪ 生成分身并重来", ko: "⏪ 분신을 만들고 다시"}}, {k: "b", t: {ja: "その場で 1歩 まつ", en: "Wait one step", zh: "原地等一步", ko: "제자리에서 한 걸음 기다리기"}},
            {k: "y", t: {ja: "このループを やりなおす", en: "Retry this loop", zh: "重来本次循环", ko: "이번 루프 다시"}}, {k: "x", t: {ja: "ヒント", en: "Hint", zh: "提示", ko: "힌트"}}, {k: "plus", t: {ja: "ステージえらびへ", en: "Stage list", zh: "关卡列表", ko: "스테이지 목록"}}]);
        GKI.on(function(a, down){
            var d = DIRS[a];
            if(d){ stopRep(a); if(down && where === "play" && S){ doStep(d); rp[a] = {t: setTimeout(function(){ rp[a].i = setInterval(function(){ if(!GKI.held(a)){ stopRep(a); return; } if(where === "play" && S && $("clear").hidden) doStep(d); }, 130); }, 320)}; } return; }
            if(!down || where !== "play" || !S || !$("clear").hidden) return;
            if(a === "b") doStep(null); else if(a === "a") newLoop(); else if(a === "y") retryLoop(); else if(a === "x") hint(); else if(a === "plus"){ if(S && S.custom){ openGen(); } else{ paintLevels(); show("sel"); } }
        });
        GKI.onBack(function(){ if(where !== "title") $("exitBtn").click(); });
    }
    var rep = null;
    $("dpad").addEventListener("pointerdown", function(e){
        var b = e.target.closest("[data-d]"); if(!b) return; e.preventDefault(); var d = b.dataset.d; doStep(d); clearInterval(rep); var n = 0;
        rep = setInterval(function(){ if(++n > 2) doStep(d); }, 130);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function(t){ $("dpad").addEventListener(t, function(){ clearInterval(rep); }); });
    window.addEventListener("pointerup", function(){ clearInterval(rep); });

    // ---------- 描画 ----------
    function resize(){
        var r = $("stageWrap").getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = Math.max(50, r.width); H = Math.max(50, r.height);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); layout();
    }
    function layout(){ if(!S) return; ts = Math.floor(Math.min((W - 16) / S.g.W, (H - 16) / S.g.H)); ts = Math.max(14, Math.min(64, ts)); ox = Math.round((W - ts * S.g.W) / 2); oy = Math.round((H - ts * S.g.H) / 2); }
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
    function burst(p, c){ for(var k = 0; k < 14; k++) S.fx.push({x: p[0] + .5, y: p[1] + .5, vx: (Math.random() - .5) * 5, vy: (Math.random() - .5) * 5, life: .8, c: c}); }
    function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function tx(x){ return ox + x * ts; } function ty(y){ return oy + y * ts; }
    function robot(cx, cy, color, face, alpha, label, bob){
        ctx.save(); ctx.globalAlpha = alpha; var r = ts * .36;
        ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(cx, cy + r * .95, r * .9, r * .3, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = color; rr(cx - r, cy - r + bob, r * 2, r * 2, r * .55); ctx.fill(); ctx.lineWidth = Math.max(1.5, ts * .06); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.stroke();
        var ex = {L: -.22, R: .22, U: 0, D: 0}[face] || 0, ey = {U: -.18, D: .12}[face] || 0;
        ctx.fillStyle = "#fff"; [-1, 1].forEach(function(s){ ctx.beginPath(); ctx.arc(cx + s * r * .38 + ex * r, cy - r * .1 + ey * r + bob, r * .24, 0, 6.3); ctx.fill(); });
        ctx.fillStyle = "#10204a"; [-1, 1].forEach(function(s){ ctx.beginPath(); ctx.arc(cx + s * r * .38 + ex * r * 1.5, cy - r * .1 + ey * r * 1.6 + bob, r * .11, 0, 6.3); ctx.fill(); });
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.moveTo(cx, cy - r + bob); ctx.lineTo(cx, cy - r * 1.35 + bob); ctx.stroke(); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy - r * 1.4 + bob, r * .14, 0, 6.3); ctx.fill();
        if(label){ ctx.fillStyle = "#10204a"; ctx.font = "bold " + Math.round(ts * .22) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, cx, cy + r * .62 + bob); }
        ctx.restore();
    }
    var last = 0;
    function frame(t){
        requestAnimationFrame(frame); var dt = Math.min(.05, (t - last) / 1000 || 0); last = t;
        if(where !== "play" || !S) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        var g = S.g, time = t / 1000;
        // 見た目の位置を、ほんとうの位置へ なめらかに ちかづける
        var k = 1 - Math.pow(.0005, dt * 1.0), me = S.run.me; S.vis.me[0] += (me[0] - S.vis.me[0]) * k; S.vis.me[1] += (me[1] - S.vis.me[1]) * k;
        S.ghosts.forEach(function(p, i){ var q = Sim.ghostPos(p, S.run.t), v = S.vis.gh[i] || (S.vis.gh[i] = q.slice()); v[0] += (q[0] - v[0]) * k; v[1] += (q[1] - v[1]) * k; });
        var sx = S.shake > 0 ? (Math.random() - .5) * S.shake : 0; if(S.shake > 0) S.shake -= 40 * dt;
        ctx.save(); ctx.translate(sx, 0);
        var open = openNow();
        // ゆか・かべ
        for(var y = 0; y < g.H; y++) for(var x = 0; x < g.W; x++){
            var c = g.cell[y * g.W + x], px = tx(x), py = ty(y);
            if(c === "#"){ ctx.fillStyle = "#4d5f9a"; rr(px + 1, py + 1, ts - 2, ts - 2, ts * .18); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.14)"; rr(px + 3, py + 3, ts - 6, ts * .3, ts * .12); ctx.fill(); continue; }
            ctx.fillStyle = (x + y) % 2 ? "#1a2c58" : "#1f3466"; ctx.fillRect(px, py, ts + .5, ts + .5);
        }
        // スタート・出口
        var s = g.S; ctx.strokeStyle = "rgba(120,180,255,.6)"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); rr(tx(s[0]) + 4, ty(s[1]) + 4, ts - 8, ts - 8, 8); ctx.stroke(); ctx.setLineDash([]);
        var e = g.E, ecx = tx(e[0]) + ts / 2, ecy = ty(e[1]) + ts / 2;
        for(var q = 0; q < 3; q++){ ctx.strokeStyle = "rgba(90,255,170," + (.8 - q * .22) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(ecx, ecy, ts * (.18 + q * .1 + Math.sin(time * 3 + q) * .02), ts * (.18 + q * .1), time * (1 + q * .5), 0, 6.3); ctx.stroke(); }
        // ボタン
        Object.keys(g.plates).forEach(function(kk){ g.plates[kk].forEach(function(p){
            var on = false, cx = tx(p[0]) + ts / 2, cy = ty(p[1]) + ts / 2;
            if(S.run.me[0] === p[0] && S.run.me[1] === p[1]) on = true; S.ghosts.forEach(function(gp){ var qq = Sim.ghostPos(gp, S.run.t); if(qq[0] === p[0] && qq[1] === p[1]) on = true; });
            ctx.fillStyle = on ? COL[kk] : "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.arc(cx, cy, ts * .34, 0, 6.3); ctx.fill();
            ctx.strokeStyle = COL[kk]; ctx.lineWidth = Math.max(2, ts * .07); ctx.beginPath(); ctx.arc(cx, cy, ts * .34, 0, 6.3); ctx.stroke();
            ctx.fillStyle = on ? "#fff" : COL[kk]; ctx.beginPath(); ctx.arc(cx, cy, ts * (on ? .14 : .1), 0, 6.3); ctx.fill();
        }); });
        // トビラ
        Object.keys(g.doors).forEach(function(kk){ var st = open[kk]; g.doors[kk].forEach(function(p){
            var px = tx(p[0]), py = ty(p[1]), col = COL[kk.toLowerCase()];
            if(st.open){ ctx.globalAlpha = .45; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([3, 4]); rr(px + 3, py + 3, ts - 6, ts - 6, 6); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
            else{ ctx.fillStyle = col; rr(px + 2, py + 2, ts - 4, ts - 4, ts * .14); ctx.fill(); ctx.fillStyle = "rgba(0,0,0,.28)"; for(var i = 1; i < 4; i++) ctx.fillRect(px + 4, py + i * ts / 4 - 1, ts - 8, 2); }
            // ひつような ボタンの数（まるで あらわす）
            for(var j = 0; j < st.need; j++){ ctx.fillStyle = j < st.on ? "#fff" : "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.arc(px + ts / 2 + (j - (st.need - 1) / 2) * ts * .2, py + ts * .16, ts * .065, 0, 6.3); ctx.fill(); }
        }); });
        // ヒント
        if(S.hint && S.hint.kind === "plate"){ var hp = S.hint, rad = ts * (.45 + Math.sin(time * 6) * .06); ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(tx(hp.x) + ts / 2, ty(hp.y) + ts / 2, rad, 0, 6.3); ctx.stroke(); }
        if(S.hint && S.hint.kind === "exit"){ ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ecx, ecy, ts * (.5 + Math.sin(time * 6) * .06), 0, 6.3); ctx.stroke(); }
        // ぶんしん・じぶん
        S.ghosts.forEach(function(p, i){ var v = S.vis.gh[i] || p[0]; robot(tx(v[0]) + ts / 2, ty(v[1]) + ts / 2, GCOL[i % GCOL.length], "R", .6 + Math.sin(time * 3 + i) * .08, String(i + 1), Math.sin(time * 4 + i) * ts * .03); });
        robot(tx(S.vis.me[0]) + ts / 2, ty(S.vis.me[1]) + ts / 2, "#5aa0ff", S.face, 1, "", Math.sin(time * 5) * ts * .02);
        // こうか
        S.fx = S.fx.filter(function(f){ f.life -= dt; f.x += f.vx * dt; f.y += f.vy * dt; if(f.life <= 0) return false; ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(tx(f.x), ty(f.y), ts * .07, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1; return true; });
        ctx.restore();
    }
    window.__g10 = {get S(){ return S; }, start: start, begin: begin, startGen: startGen, openGen: openGen, doStep: doStep, newLoop: newLoop, hint: hint, retryLoop: retryLoop};
    requestAnimationFrame(frame); resize();
})();
