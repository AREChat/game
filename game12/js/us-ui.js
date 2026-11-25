"use strict";
/* AREUSO：画面（タイトル・出陣えらび・戦闘 HUD・タッチ操作・リザルト）。3D は us-3d.js、戦闘ルールは us-core.js。 */
(function(){
    var $ = function(id){ return document.getElementById(id); };
    var US = window.US, store = GK.save("us"), PI = Math.PI, TAU = PI * 2;
    var X = GK.i18n({
        ja: {note: "5つの ステージ・4人の 武将・ボス戦。進行は この端末に 保存されます。", ng: "ステージ", base: "拠点", gen: "発生源", rankS: "S", noSave: "セーブなし", sec: "秒", hit: "HIT", dead: "武将は 倒れた… もういちど 挑もう！", opt: "せってい", cfgReset: "データを けす", cfgDone: "けしました", pauseHint: "ポーズ中", qT: "画質", sT: "画面ゆれ", tT: "タッチ操作", tOn: "出す", tOff: "かくす", tAuto: "自動", clearedAll: "全ステージ クリアおめでとう！ 好きな 武将で 腕試しも できます。", newHero: "新しい 武将が 仲間に なった：", bestT: "ベスト", dmgT: "うけたダメージ", scoreT: "スコア", comboT: "さいだいコンボ", koT: "撃破数", timeT: "タイム", lowQ: "動きが おもいので「軽い」画質に しました。", hero: "武将", enemy: "ノイズ", stageN: "STAGE {n}", howT: "あそびかた", go: "出陣！", endT: "エンディング", endBtn: "タイトルへ", locked2: "ステージ{n}を クリアで 解放", rec: "記録"},
        en: {note: "5 stages, 4 heroes, boss fights. Progress is saved on this device.", ng: "Stage", base: "Bases", gen: "Generators", rankS: "S", noSave: "No save", sec: "s", hit: "HIT", dead: "Your hero has fallen… Try again!", opt: "Settings", cfgReset: "Erase data", cfgDone: "Erased", pauseHint: "Paused", qT: "Quality", sT: "Screen shake", tT: "Touch controls", tOn: "Show", tOff: "Hide", tAuto: "Auto", clearedAll: "All stages cleared — congratulations! Try other heroes too.", newHero: "A new hero joined: ", bestT: "Best", dmgT: "Damage taken", scoreT: "Score", comboT: "Max combo", koT: "KOs", timeT: "Time", lowQ: "Performance was low, so graphics were set to Light.", hero: "Hero", enemy: "Noise", stageN: "STAGE {n}", howT: "How to play", go: "Deploy!", endT: "Ending", endBtn: "To title", locked2: "Clear stage {n} to unlock", rec: "Record"},
        zh: {note: "5个关卡、4位武将、首领战。进度保存在本设备。", ng: "关卡", base: "据点", gen: "发生源", rankS: "S", noSave: "无存档", sec: "秒", hit: "HIT", dead: "武将倒下了……再挑战一次！", opt: "设置", cfgReset: "清除存档", cfgDone: "已清除", pauseHint: "暂停中", qT: "画质", sT: "画面震动", tT: "触屏操作", tOn: "显示", tOff: "隐藏", tAuto: "自动", clearedAll: "全部关卡通过，恭喜！也可以用其他武将再挑战。", newHero: "新伙伴加入：", bestT: "最佳", dmgT: "受到伤害", scoreT: "得分", comboT: "最大连击", koT: "击败数", timeT: "时间", lowQ: "运行较卡，已切换为“流畅”画质。", hero: "武将", enemy: "噪点", stageN: "第{n}关", howT: "玩法", go: "出阵！", endT: "结局", endBtn: "返回标题", locked2: "通过第{n}关解锁", rec: "记录"},
        ko: {note: "5개 스테이지, 4명의 무장, 보스전. 진행 상황은 이 기기에 저장돼요.", ng: "스테이지", base: "거점", gen: "발생원", rankS: "S", noSave: "저장 없음", sec: "초", hit: "HIT", dead: "무장이 쓰러졌어요… 다시 도전해요!", opt: "설정", cfgReset: "데이터 지우기", cfgDone: "지웠어요", pauseHint: "일시정지 중", qT: "화질", sT: "화면 흔들림", tT: "터치 조작", tOn: "표시", tOff: "숨김", tAuto: "자동", clearedAll: "모든 스테이지 클리어, 축하해요! 다른 무장으로도 도전해 보세요.", newHero: "새 동료가 합류했어요: ", bestT: "최고", dmgT: "받은 피해", scoreT: "점수", comboT: "최대 콤보", koT: "격파 수", timeT: "시간", lowQ: "움직임이 무거워 ‘가벼움’ 화질로 바꿨어요.", hero: "무장", enemy: "노이즈", stageN: "STAGE {n}", howT: "플레이 방법", go: "출진!", endT: "엔딩", endBtn: "타이틀로", locked2: "스테이지 {n} 클리어로 해금", rec: "기록"}
    });
    function L(){ return GK.lang(); }
    function T(o){ return US.t(o, L()); }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }
    function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }

    var S = {scr: "title", R: null, B: null, demo: null, stageSel: 0, heroSel: 0, diff: 2, paused: false, hold: 0, last: 0, buf: {weak: 0, strong: 0, jump: 0, dodge: 0, musou: 0}, tGuard: false, recenter: false, camDX: 0, camDY: 0, tv: {x: 0, y: 0}, clearShown: false, deadShown: false, resShown: false, fps: {t: 0, n: 0, low: 0}, cfg: {q: store.get("q", "high"), shake: store.get("shake", true), touch: store.get("touch", "auto")}, cine: 0, ended: false, hpLag: 1, banT: 0, lastCombo: 0, musReady: false, sfxAt: {}, dmgN: 0, evCount: 0, lastEsc: 0, newHeroes: [], first: true, elapsed: 0};
    window.__us = {S: S, US: US};

    function toast(m, ms){ var e = $("toast"); e.textContent = m; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 2000); }
    function sfx(n, gap){ var now = performance.now(); if(S.sfxAt[n] && now - S.sfxAt[n] < (gap || 55)) return; S.sfxAt[n] = now; try{ GK.sfx(n); }catch(_e){} }

    /* ---- 進行（セーブ） ---- */
    var RK = {S: 4, A: 3, B: 2, C: 1};
    function stageRank(i){ return store.get("rank_" + US.STAGES[i].id, ""); }
    function stageOpen(i){ return i === 0 || !!stageRank(i - 1); }
    function clearedCount(){ var n = 0; for(var i = 0; i < US.STAGES.length; i++){ if(stageRank(i)) n = i + 1; else break; } return n; }
    function heroOpen(h){ return clearedCount() >= h.unlock; }
    function bestStageIdx(){ var n = clearedCount(); return Math.min(US.STAGES.length - 1, n); }

    /* ---- 画面切り替え ---- */
    var SCRS = ["title", "how", "sel", "opt", "brief", "play", "pause", "res", "end", "nogl"];
    var BASE = {title: 1, how: 1, sel: 1, opt: 1};
    function show(id){
        S.scr = id; document.body.dataset.scr = id;
        SCRS.forEach(function(k){ var e = $("s-" + k); if(e) e.classList.toggle("on", k === id || (k === "play" && (id === "pause" || id === "res"))); });
        document.body.classList.toggle("cine", id === "brief" || S.cine > 0);
        document.documentElement.lang = L(); applyText();
        if(id === "sel") buildSel();
        if(window.GKI){ if(id === "play") { GKI.mode("keys"); GKI.legend(US.LEG); } else { GKI.mode("menu"); GKI.legend(US.LEG); } }
        if(BASE[id]) refreshDemo();
        if(id !== "play") setTimeout(focusFirst, 70);
        try{ GK.bgm(id === "play" ? "tense" : id === "end" ? "epic" : id === "title" ? "fun" : "calm"); }catch(_e){}
    }
    function applyText(){
        var TX = US.TX, l = L();
        $("tSub").textContent = T(TX.sub); $("bStart").textContent = T(TX.start); $("bCont").textContent = T(TX.cont); $("bHow").textContent = T(TX.how); $("bOpt").textContent = X("opt"); $("tNote").textContent = X("note");
        $("bCont").style.display = store.get("cleared", 0) || clearedCount() ? "" : "none";
        $("hT").textContent = T(TX.how); $("hBody").innerHTML = ["how1", "how2", "how3", "how4", "how5", "how6"].map(function(k){ return "<p>" + esc(T(TX[k])) + "</p>"; }).join(""); $("bHowBack").textContent = T(TX.back);
        $("selT").textContent = T(TX.stage); $("heroT").textContent = T(TX.hero); $("bSelBack").textContent = T(TX.back); $("bGo").textContent = T(TX.go);
        $("oT").textContent = X("opt"); $("oQ").textContent = X("qT"); $("oS").textContent = X("sT"); $("oTc").textContent = X("tT"); $("bOptBack").textContent = T(TX.back); $("bPadOpt").textContent = "🎮 " + (GKI_T()); $("bReset").textContent = T(TX.reset);
        $("paT").textContent = T(TX.pause); $("bResume").textContent = T(TX.resume); $("bPaOpt").textContent = "🎮 " + GKI_T(); $("bPaQuit").textContent = T(TX.quit);
        $("bRsMenu").textContent = T(TX.menu); $("bRsRetry").textContent = T(TX.retry); $("bRsNext").textContent = T(TX.next);
        $("ngT").textContent = T(TX.webgl); $("bNgBack").textContent = T(TX.back); $("loadTx").textContent = T(TX.loading); $("enT").textContent = T(TX.allClear); $("bEnd").textContent = X("endBtn");
        $("bBrGo").textContent = T(TX.go);
        $("exitBtn").textContent = "← " + T(TX.back); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[l];
        $("tbMus").textContent = T(TX.musou).replace(/ゲージ|Gauge/, "");
        buildOpt(); if(S.B && S.scr !== "title") buildBossBox(true); hudNames(); keyHint();
    }
    function GKI_T(){ return {ja: "操作設定", en: "Controls", zh: "操作设置", ko: "조작 설정"}[L()]; }
    function keyName(k){ return k === " " ? "Space" : k.length === 1 ? k.toUpperCase() : k === "ArrowUp" ? "↑" : k === "ArrowDown" ? "↓" : k === "ArrowLeft" ? "←" : k === "ArrowRight" ? "→" : k; }
    function keyHint(){
        if(!window.GKI) return; var out = [];
        US.LEG.forEach(function(g){ try{ out.push(GKI.keys(g.k).map(keyName).join("/") + " " + T(g.t)); }catch(_e){} });
        $("keyHint").textContent = out.join("　");
    }

    /* ---- 3D 初期化 ---- */
    function initR(){
        var q = S.cfg.q; if(S.R){ try{ S.R.renderer.dispose(); }catch(_e){} S.R = null; }
        var R = window.US3D ? US3D.create($("cv"), {quality: q, shake: S.cfg.shake !== false && !reduced()}) : null;
        if(!R){ S.R = null; return false; } S.R = R; resize(); return true;
    }
    function reduced(){ try{ return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(_e){ return false; } }
    function resize(){ if(!S.R) return; var w = window.innerWidth, h = window.innerHeight; S.R.resize(w, h, window.devicePixelRatio || 1); }
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 150); });

    function refreshDemo(){
        var R = S.R; if(!R) return; var st = US.STAGES[S.stageSel], h = US.HEROES[S.heroSel];
        if(S.demo && S.demo.stage === st.id && S.demo.hero === h.id && R.demo) { R.demo.r = S.scr === "sel" ? 8.5 : 13; R.demo.h = S.scr === "sel" ? 3 : 5.2; return; }
        var B = US.newBattle({stage: st.id, hero: h.id, diff: 2, seed: 5}); B.E.length = 0; B.PR.length = 0; R.reset(); R.B = B; R.setStage(st); R.setHero(h);
        S.demo = {B: B, stage: st.id, hero: h.id}; R.demo = {cx: 0, cz: 0, r: 13, h: 5.2, speed: .18, ly: 1.5, fov: 46, a: PI};
        if(S.scr === "sel"){ R.demo.r = 8.5; R.demo.h = 3; }
    }

    /* ---- 出陣えらび ---- */
    function rankLabel(i){ var r = stageRank(i); return r ? ("★ " + r) : ""; }
    function buildSel(){
        var h = ""; US.STAGES.forEach(function(st, i){
            var open = stageOpen(i); h += '<button type="button" class="stc' + (i === S.stageSel ? " on" : "") + (open ? "" : " lock") + '" data-i="' + i + '"' + (open ? "" : ' aria-disabled="true"') + '><span class="rk">' + (open ? esc(rankLabel(i) || X("stageN", {n: i + 1})) : "🔒") + '</span><b>' + esc(T(st.n)) + '</b></button>';
        }); $("stList").innerHTML = h;
        Array.prototype.forEach.call($("stList").children, function(b){ b.onclick = function(){ var i = +b.dataset.i; if(!stageOpen(i)){ sfx("ng"); toast(X("locked2", {n: i})); return; } S.stageSel = i; sfx("tap"); buildSel(); refreshDemo(); focusSel("#stList .stc.on"); }; });
        h = ""; US.HEROES.forEach(function(hr, i){
            var open = heroOpen(hr); var glyph = {sword: "⚔", spear: "🔱", hammer: "🔨", twin: "✦"}[hr.w];
            h += '<button type="button" class="hc' + (i === S.heroSel ? " on" : "") + (open ? "" : " lock") + '" data-i="' + i + '"><span class="ic" style="background:radial-gradient(circle at 35% 30%,#fff,#' + hr.col.toString(16).padStart(6, "0") + ' 60%);color:#' + hr.col.toString(16).padStart(6, "0") + '"></span><b>' + (open ? esc(T(hr.n)) : "🔒") + '</b><span>' + (open ? glyph : "") + '</span></button>';
        }); $("heroList").innerHTML = h;
        Array.prototype.forEach.call($("heroList").children, function(b){ b.onclick = function(){ var i = +b.dataset.i, hr = US.HEROES[i]; if(!heroOpen(hr)){ sfx("ng"); toast(X("locked2", {n: hr.unlock})); return; } S.heroSel = i; sfx("tap"); buildSel(); refreshDemo(); focusSel("#heroList .hc.on"); }; });
        var hr = US.HEROES[S.heroSel]; $("heroInfo").innerHTML = "<b>" + esc(T(hr.n)) + "</b>　" + esc(T(hr.role)) + "<br>" + esc(T(hr.desc));
        var TX = US.TX; $("diffRow").innerHTML = '<span style="font-size:13px;margin-right:6px;align-self:center">' + esc(T(TX.diff)) + '</span><div class="seg">' + [1, 2, 3].map(function(d){ return '<button type="button" data-d="' + d + '" class="' + (S.diff === d ? "on" : "") + '">' + esc(T([TX.easy, TX.normal, TX.hard][d - 1])) + '</button>'; }).join("") + '</div>';
        Array.prototype.forEach.call($("diffRow").querySelectorAll("button"), function(b){ b.onclick = function(){ S.diff = +b.dataset.d; store.set("diff", S.diff); sfx("tap"); buildSel(); focusSel('#diffRow button.on'); }; });
        $("bGo").disabled = !stageOpen(S.stageSel);
    }
    function focusFirst(){ if(!window.AREPadFocus || !window.GKI || !GKI.padConnected || !GKI.padConnected()) return; var el = document.querySelector(".scr.on:not(#s-play) [data-pad-first]:not([hidden])"); if(el && el.offsetParent !== null) try{ AREPadFocus(el); }catch(_e){} }
    function focusSel(sel){ var el = document.querySelector(sel); if(el && window.AREPadFocus && window.GKI && GKI.padConnected && GKI.padConnected()) try{ AREPadFocus(el); }catch(_e){} }

    /* ---- せってい ---- */
    function seg(id, items, cur, fn){ var el = $(id); el.innerHTML = items.map(function(it){ return '<button type="button" data-v="' + it[0] + '" class="' + (String(cur) === String(it[0]) ? "on" : "") + '">' + esc(it[1]) + '</button>'; }).join(""); Array.prototype.forEach.call(el.children, function(b){ b.onclick = function(){ fn(b.dataset.v); sfx("tap"); }; }); }
    function buildOpt(){
        var TX = US.TX;
        seg("segQ", [["high", T(TX.qHigh)], ["low", T(TX.qLow)]], S.cfg.q, function(v){ S.cfg.q = v; store.set("q", v); initR(); S.demo = null; refreshDemo(); buildOpt(); });
        seg("segS", [["1", T(TX.on)], ["0", T(TX.off)]], S.cfg.shake !== false ? "1" : "0", function(v){ S.cfg.shake = v === "1"; store.set("shake", S.cfg.shake); initR(); S.demo = null; refreshDemo(); buildOpt(); });
        seg("segT", [["auto", X("tAuto")], ["on", X("tOn")], ["off", X("tOff")]], S.cfg.touch, function(v){ S.cfg.touch = v; store.set("touch", v); applyTouchMode(); buildOpt(); });
    }
    var resetArm = -1e9;
    $("bReset").onclick = function(){
        var now = performance.now();
        if(now - resetArm < 4000){ ["rank_s1", "rank_s2", "rank_s3", "rank_s4", "rank_s5", "time_s1", "time_s2", "time_s3", "time_s4", "time_s5", "cleared", "diff"].forEach(function(k){ store.set(k, k.indexOf("rank") === 0 ? "" : 0); }); S.stageSel = 0; S.heroSel = 0; resetArm = -1e9; GK.sfx("ok"); toast(X("cfgDone")); buildOpt(); applyText(); return; }
        resetArm = now; $("bReset").textContent = T(US.TX.confirmReset) + " ▶ " + T(US.TX.reset); GK.sfx("tap"); setTimeout(function(){ if(performance.now() - resetArm >= 3900) $("bReset").textContent = T(US.TX.reset); }, 4100);
    };

    /* ---- 戦闘開始 ---- */
    function startBattle(){
        var R = S.R; var st = US.STAGES[S.stageSel], h = US.HEROES[S.heroSel];
        S.B = US.newBattle({stage: st.id, hero: h.id, diff: S.diff, seed: (Math.random() * 1e9) | 0}); var B = S.B;
        R.reset(); R.B = B; R.setStage(st); R.setHero(h); R.yaw = 0; R.pitch = .5; R.snapCamera(B);
        S.demo = null; S.paused = false; S.hold = 0; S.cine = 0; S.clearShown = S.deadShown = S.resShown = false; S.hpLag = 1; S.lastCombo = 0; S.musReady = false; S.elapsed = 0; S.newHeroes = [];
        Object.keys(S.buf).forEach(function(k){ S.buf[k] = 0; });
        R.demo = {cx: 0, cz: 0, r: 14, h: 6.2, speed: .1, ly: 1.5, fov: 48, a: 3.2};
        $("brStage").textContent = X("stageN", {n: S.stageSel + 1}); $("brName").textContent = T(st.n); $("brIntro").textContent = T(st.intro); $("brObj").textContent = T(st.obj);
        $("bossBox").innerHTML = ""; $("comboBox").classList.remove("on"); $("banner").classList.remove("on"); $("dmgLayer").innerHTML = "";
        store.set("stage", S.stageSel); store.set("hero", S.heroSel);
        show("brief"); setTimeout(function(){ var b = $("bBrGo"); if(b && S.scr === "brief") try{ b.focus({preventScroll: true}); }catch(_e){} }, 60);
    }
    function beginPlay(){
        var B = S.B, R = S.R; if(!B || S.scr !== "brief") return; R.demo = null; US.begin(B); R.snapCamera(B); show("play");
        banner(X("stageN", {n: S.stageSel + 1}), T(B.st.n)); S.hintT = 7; $("keyHint").style.display = ""; $("keyHint").style.opacity = .85; sfx("ok");
        hudNames(); buildBossBox(true);
    }

    /* ---- バナー・ダメージ数字 ---- */
    function banner(main, sub){ var b = $("banner"); b.innerHTML = esc(main) + (sub ? "<small>" + esc(sub) + "</small>" : ""); b.classList.remove("on"); void b.offsetWidth; b.classList.add("on"); }
    function dmgNum(x, y, z, v, cls){
        var R = S.R, B = S.B; if(!R) return; var p = R.project(x, y, z); if(!p.vis) return; var layer = $("dmgLayer"); if(layer.childElementCount > 28) layer.removeChild(layer.firstChild);
        var e = document.createElement("span"); e.className = "dn " + (cls || ""); e.textContent = v; e.style.left = p.x + "px"; e.style.top = p.y + "px"; layer.appendChild(e); setTimeout(function(){ if(e.parentNode) e.parentNode.removeChild(e); }, 760);
    }

    /* ---- 入力 ---- */
    function pressed(a){
        var b = S.buf;
        if(a === "y") b.weak = .14; else if(a === "x") b.strong = .14; else if(a === "a") b.jump = .12; else if(a === "b") b.dodge = .16; else if(a === "zr") b.musou = .2;
        else if(a === "l") S.recenter = true; else if(a === "plus") togglePause();
    }
    if(window.GKI){
        GKI.defaults({y: ["j", "y"], x: ["k", "x"], a: [" "], b: ["l", "Shift"], zr: ["o"], r: ["i"], l: ["q"], plus: ["Escape", "p"]});
        GKI.on(function(a, down){ if(S.scr !== "play" || S.paused) return; if(down){ if(a === "plus" && performance.now() - (S.resumedAt || 0) < 220) return; pressed(a); } });
        GKI.onBack(function(){
            var now = performance.now(); if(now - S.lastEsc < 170 || now - (S.pausedAt || 0) < 250) return; S.lastEsc = now; if(window.GKI.justClosed && GKI.justClosed(260)) return;
            if(S.scr === "pause") resume(); else if(S.scr === "how" || S.scr === "sel" || S.scr === "opt") show("title"); else if(S.scr === "brief") show("sel"); else if(S.scr === "res" && !S.endPend) { goMenu(); }
        });
    }
    // 画面ボタン
    var touchSeen = false;
    function applyTouchMode(){
        var m = S.cfg.touch, on = m === "on" || (m === "auto" && (touchSeen || (window.matchMedia && matchMedia("(pointer:coarse)").matches)));
        document.body.classList.toggle("touchui", !!on); $("touch").hidden = !on;
    }
    window.addEventListener("touchstart", function(){ if(!touchSeen){ touchSeen = true; applyTouchMode(); } }, {passive: true});
    Array.prototype.forEach.call(document.querySelectorAll("#cluster .tb"), function(b){
        var act = b.dataset.act, hold = !!b.dataset.hold;
        b.addEventListener("pointerdown", function(e){ e.preventDefault(); try{ b.setPointerCapture(e.pointerId); }catch(_e){} b.classList.add("dn2"); if(hold) S.tGuard = true; else { if(S.paused) return; pressedAct(act); } });
        var up = function(){ b.classList.remove("dn2"); if(hold) S.tGuard = false; };
        b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
        b.addEventListener("contextmenu", function(e){ e.preventDefault(); });
    });
    function pressedAct(act){ var b = S.buf; if(act === "weak") b.weak = .14; else if(act === "strong") b.strong = .14; else if(act === "jump") b.jump = .12; else if(act === "dodge") b.dodge = .16; else if(act === "musou") b.musou = .2; }
    // 仮想スティック（左）／カメラ（右・マウスの ドラッグ）
    var stk = {id: null, ox: 0, oy: 0}, cam = {id: null, x: 0, y: 0};
    var sz = $("stickZone"), cz = $("camZone"), sb = $("stickBase");
    sz.addEventListener("pointerdown", function(e){ if(stk.id !== null) return; stk.id = e.pointerId; stk.ox = e.clientX; stk.oy = e.clientY; try{ sz.setPointerCapture(e.pointerId); }catch(_e){} sb.style.display = "block"; sb.style.left = e.clientX + "px"; sb.style.top = e.clientY + "px"; sb.firstElementChild.style.transform = "translate(0,0)"; });
    sz.addEventListener("pointermove", function(e){ if(e.pointerId !== stk.id) return; var dx = e.clientX - stk.ox, dy = e.clientY - stk.oy, m = Math.hypot(dx, dy), R0 = 52; if(m > R0){ dx *= R0 / m; dy *= R0 / m; m = R0; }
        var k = m / R0; S.tv.x = m > 9 ? dx / R0 : 0; S.tv.y = m > 9 ? dy / R0 : 0; sb.firstElementChild.style.transform = "translate(" + dx + "px," + dy + "px)"; });
    function stkEnd(e){ if(e.pointerId !== stk.id) return; stk.id = null; S.tv.x = S.tv.y = 0; sb.style.display = "none"; }
    sz.addEventListener("pointerup", stkEnd); sz.addEventListener("pointercancel", stkEnd); sz.addEventListener("lostpointercapture", stkEnd);
    cz.addEventListener("pointerdown", function(e){ if(cam.id !== null) return; cam.id = e.pointerId; cam.x = e.clientX; cam.y = e.clientY; try{ cz.setPointerCapture(e.pointerId); }catch(_e){} });
    cz.addEventListener("pointermove", function(e){ if(e.pointerId !== cam.id) return; S.camDX += e.clientX - cam.x; S.camDY += e.clientY - cam.y; cam.x = e.clientX; cam.y = e.clientY; });
    function camEnd(e){ if(e.pointerId === cam.id) cam.id = null; }
    cz.addEventListener("pointerup", camEnd); cz.addEventListener("pointercancel", camEnd); cz.addEventListener("lostpointercapture", camEnd);
    // マウス（PC）：画面ドラッグでカメラ
    var mouse = {down: false, x: 0, y: 0};
    $("cv").addEventListener("pointerdown", function(e){ if(e.pointerType === "mouse"){ mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; } });
    window.addEventListener("pointermove", function(e){ if(mouse.down && e.pointerType === "mouse" && S.scr === "play"){ S.camDX += e.clientX - mouse.x; S.camDY += e.clientY - mouse.y; mouse.x = e.clientX; mouse.y = e.clientY; } });
    window.addEventListener("pointerup", function(e){ if(e.pointerType === "mouse") mouse.down = false; });
    // PC でも画面の 戦闘中は 空きエリアを ドラッグできる（HUD は pointer-events:none）
    document.body.addEventListener("pointerdown", function(e){ if(S.scr === "play" && e.pointerType === "mouse" && !e.target.closest("button")){ mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; } }, true);
    document.addEventListener("contextmenu", function(e){ if(S.scr === "play") e.preventDefault(); });

    function padCam(){ var a = navigator.getGamepads ? navigator.getGamepads() : []; for(var i = 0; i < a.length; i++){ var p = a[i]; if(p && p.connected && p.axes && p.axes.length >= 4){ var x = p.axes[2] || 0, y = p.axes[3] || 0; return {x: Math.abs(x) > .22 ? x : 0, y: Math.abs(y) > .22 ? y : 0}; } } return {x: 0, y: 0}; }
    function gatherInput(B, R, dt){
        var ax = window.GKI ? GKI.axis() : {x: 0, y: 0}, sx = clamp(ax.x + S.tv.x, -1, 1), sy = clamp(ax.y + S.tv.y, -1, 1), m = Math.hypot(sx, sy); if(m > 1){ sx /= m; sy /= m; }
        var bs = R.camBasis(), inp = {mx: bs.rx * sx + bs.fx * (-sy), mz: bs.rz * sx + bs.fz * (-sy)}, b = S.buf;
        inp.weak = b.weak > 0; inp.strong = b.strong > 0; inp.jump = b.jump > 0; inp.dodge = b.dodge > 0; inp.musou = b.musou > 0;
        inp.guard = S.tGuard || (window.GKI && GKI.held("r"));
        var pc = padCam(), c = {dyaw: S.camDX * .0062 - pc.x * dt * 2.6, dpitch: S.camDY * .004 + pc.y * dt * 1.4, recenter: S.recenter};
        S.camDX = S.camDY = 0; S.recenter = false; if(S.musReady) { /* nothing */ }
        if(window.__usInput){ var o = window.__usInput(B, dt); if(o) return {inp: o, cam: {}}; }
        return {inp: inp, cam: c};
    }
    function decayBuf(dt){ var b = S.buf; for(var k in b) if(b[k] > 0) b[k] -= dt; }
    function consumeBuf(evs, B){
        for(var i = 0; i < evs.length; i++){ var t = evs[i].t, b = S.buf;
            if(t === "swing") b.weak = b.strong = 0; else if(t === "dodge") b.dodge = 0; else if(t === "musou") b.musou = 0; else if(t === "jump") b.jump = 0; }
        if(B.P.queued) S.buf.weak = 0;
    }

    /* ---- ポーズ ---- */
    function togglePause(){ if(S.scr === "play" && !S.paused) pause(); else if(S.scr === "pause") resume(); }
    function pause(){ if(S.scr !== "play" || (S.B && S.B.state !== "play")) return; S.paused = true; S.pausedAt = performance.now(); S.tGuard = false; S.tv.x = S.tv.y = 0; show("pause"); }
    function resume(){ if(S.scr !== "pause") return; S.paused = false; S.resumedAt = performance.now(); show("play"); S.lastEsc = performance.now(); }
    $("pauseBtn").onclick = function(){ GK.sfx("tap"); pause(); };
    $("bResume").onclick = function(){ GK.sfx("tap"); resume(); };
    $("bPaQuit").onclick = function(){ GK.sfx("tap"); goMenu(); };
    document.addEventListener("visibilitychange", function(){ if(document.hidden) pause(); });
    window.addEventListener("blur", function(){ pause(); });

    function goMenu(){ S.paused = false; S.B = null; S.demo = null; S.cine = 0; show("sel"); }

    /* ---- イベント → 演出・音 ---- */
    function onEvents(B){
        var R = S.R, evs = B.ev; if(!evs.length) return; S.evCount += evs.length;
        R.process(evs, B);
        var hits = 0;
        for(var i = 0; i < evs.length; i++){ var e = evs[i], t = e.t;
            if(t === "swing") sfx(e.heavy ? "whoosh" : "slash", 40);
            else if(t === "hit"){ sfx(e.big ? "boom" : "hit", 45); if(hits++ < 6) dmgNum(e.x, e.y + .6, e.z, e.dmg, e.crit ? "crit" : e.big ? "big" : e.boss ? "boss" : ""); }
            else if(t === "block") sfx("tap", 80);
            else if(t === "guard") sfx("ok", 80);
            else if(t === "hurt"){ sfx("lose", 200); try{ GK.vibrate(40); GKI.rumble && GKI.rumble(.4, 120); }catch(_e){} dmgNum(e.x, 2.2, e.z, e.dmg, "hurt"); $("hurt").style.opacity = 1; setTimeout(function(){ $("hurt").style.opacity = 0; }, 90); }
            else if(t === "ko"){ sfx("pop", 50); }
            else if(t === "musou"){ sfx("musou", 200); try{ GKI.rumble && GKI.rumble(.8, 400); }catch(_e){} flash(.9); }
            else if(t === "musoutick") sfx(e.final ? "boom" : "charge", 90);
            else if(t === "dodge") sfx("whoosh", 60);
            else if(t === "justdodge"){ sfx("combo", 100); banner("JUST!", ""); }
            else if(t === "slam") sfx("boom", 100);
            else if(t === "shoot") sfx("pop", 120);
            else if(t === "jump") sfx("jump", 80);
            else if(t === "pickup") sfx("coin", 60);
            else if(t === "base"){ sfx("win", 300); banner(T(US.TX.capture), ""); }
            else if(t === "gen"){ sfx("boom", 100); banner(T(US.TX.gen), ""); }
            else if(t === "phase"){ sfx("musou", 300); banner(T(US.TX.phase), ""); flash(.8); }
            else if(t === "stagger") sfx("combo", 100);
            else if(t === "boss"){ bossIntro(e, B); }
            else if(t === "clear"){ sfx("win", 400); banner(T(US.TX.clear), ""); try{ GK.bgm("epic"); }catch(_e){} }
            else if(t === "dead"){ sfx("lose", 400); banner(T(US.TX.down), ""); }
        }
        // ボス撃破の きめ演出
        for(i = 0; i < evs.length; i++) if(evs[i].t === "ko" && evs[i].off){ cineFor(1.6); }
        consumeBuf(evs, B); evs.length = 0;
    }
    function flash(a){ var f = $("flash"); f.style.transition = "none"; f.style.opacity = a; void f.offsetWidth; f.style.transition = "opacity .6s"; f.style.opacity = 0; }
    function cineFor(sec){ S.cine = sec; document.body.classList.add("cine"); }
    function bossIntro(e, B){
        if(S.hold > 0) return; var R = S.R, off = US.OFFICERS[e.off]; sfx("musou", 300); S.hold = 2.6; cineFor(2.6);
        var ang = Math.atan2(e.x - B.P.x, e.z - B.P.z);
        R.cinema({kind: "orbit", cx: e.x, cz: e.z, a0: ang + PI + .9, a1: ang + PI - .3, r0: 20, r: off.phases ? 14 : 10.5, h0: 3, h: off.phases ? 6 : 4.2, dur: 2.6, look: [e.x, off.phases ? 4.2 : 3, e.z], fov: 46});
        banner(T(US.TX.boss), T(off.n) + "　" + T(off.t)); try{ GK.bgm("epic"); }catch(_e){}
        S.holdBoss = true;
    }

    /* ---- HUD ---- */
    var hudCache = {};
    function setTxt(id, v){ if(hudCache[id] !== v){ hudCache[id] = v; $(id).textContent = v; } }
    function hudNames(){ if(S.B) $("hdName").textContent = T(S.B.h.n); }
    function fmtTime(t){ t = Math.floor(t); var m = Math.floor(t / 60), s = t % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
    function buildBossBox(force){
        var B = S.B; if(!B) return; var offs = B.offs.filter(function(e){ return e.alive; }), key = offs.map(function(e){ return e.id; }).join(",") + L();
        if(!force && hudCache.bossKey === key) return; hudCache.bossKey = key;
        $("bossBox").innerHTML = offs.map(function(e){ return '<div class="bb"><span>' + esc(T(e.d.n)) + '</span><div class="bar"><i data-id="' + e.id + '"></i></div></div>'; }).join("");
    }
    function hud(B, R, dt){
        var P = B.P, pct = clamp(P.hp / P.maxhp, 0, 1);
        $("hpFill").style.width = (pct * 100).toFixed(1) + "%"; S.hpLag = Math.max(pct, S.hpLag - dt * .4); $("hpLag").style.width = (Math.max(pct, S.hpLag) * 100).toFixed(1) + "%";
        setTxt("hdHp", Math.ceil(P.hp) + " / " + P.maxhp);
        var mus = P.mus / 100; $("muFill").style.width = (clamp(mus, 0, 1) * 100).toFixed(1) + "%"; var rdy = P.mus >= 50; var mb = $("muFill").parentNode;
        if(rdy !== S.musReady){ S.musReady = rdy; mb.classList.toggle("rdy", rdy); $("tbMus").classList.toggle("rdy", rdy); if(rdy){ banner(T(US.TX.musouReady), ""); sfx("combo", 100); } }
        setTxt("muTx", rdy ? T(US.TX.musou) + " " + Math.floor(P.mus) + "%" : Math.floor(P.mus) + "%");
        var ko = $("stKo"); if(hudCache.ko !== B.ko){ hudCache.ko = B.ko; ko.firstElementChild.textContent = B.ko; ko.lastElementChild.textContent = T(US.TX.ko); }
        setTxt("stTime", fmtTime(B.t));
        // コンボ
        var cb = $("comboBox"); if(B.combo >= 2 && B.comboT > 0){ cb.classList.add("on"); if(B.combo !== S.lastCombo){ $("cmN").textContent = B.combo; $("cmT").textContent = X("hit"); cb.classList.remove("pop"); void cb.offsetWidth; cb.classList.add("pop"); } } else cb.classList.remove("on"); S.lastCombo = B.combo;
        // ボス HP
        buildBossBox(false);
        var bars = $("bossBox").querySelectorAll("i[data-id]"); for(var i = 0; i < bars.length; i++){ var id = +bars[i].dataset.id, e = null; for(var k = 0; k < B.offs.length; k++) if(B.offs[k].id === id){ e = B.offs[k]; break; } if(e) bars[i].style.width = (clamp(e.hp / e.maxhp, 0, 1) * 100).toFixed(1) + "%"; }
        // もくひょう
        var pr = US.progress(B), tx; if(pr.off) tx = T(B.st.obj); else if(pr.goal === "boss" || pr.goal === "duo") tx = T(US.TX.ko) + " " + pr.cur + " / " + pr.max; else if(pr.goal === "bases") tx = X("base") + " " + pr.cur + " / " + pr.max; else if(pr.goal === "gens") tx = X("gen") + " " + pr.cur + " / " + pr.max; else tx = T(B.st.obj);
        setTxt("objBox", tx);
        minimap(B, R);
    }
    var mmc = $("mm").getContext("2d");
    function minimap(B, R){
        var c = mmc, W = 120, P = B.P, bs = R.camBasis(), k = 1.9; c.clearRect(0, 0, W, W); c.save(); c.beginPath(); c.arc(60, 60, 59, 0, TAU); c.clip();
        function mp(x, z){ var dx = x - P.x, dz = z - P.z; return [60 + (dx * bs.rx + dz * bs.rz) * k, 60 - (dx * bs.fx + dz * bs.fz) * k]; }
        var o = mp(0, 0); c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 2; c.beginPath(); c.arc(o[0], o[1], B.st.r * k, 0, TAU); c.stroke();
        B.bases.forEach(function(b){ var p = mp(b.x, b.z); c.strokeStyle = b.done ? "#7dff9a" : "#ffd34d"; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], b.r * k, 0, TAU); c.stroke(); });
        for(var i = 0; i < B.E.length; i++){ var e = B.E[i]; if(!e.alive) continue; var p2 = mp(e.x, e.z); if(e.off){ c.fillStyle = "#ffd34d"; c.beginPath(); c.arc(p2[0], p2[1], 5, 0, TAU); c.fill(); } else if(e.gen){ c.fillStyle = "#ff4fd8"; c.fillRect(p2[0] - 4, p2[1] - 4, 8, 8); } else { c.fillStyle = e.type === "archer" ? "#4de1ff" : "#ff7ad9"; c.fillRect(p2[0] - 1.5, p2[1] - 1.5, 3, 3); } }
        var fx = Math.sin(P.face), fz = Math.cos(P.face), dx2 = fx * bs.rx + fz * bs.rz, dy2 = fx * bs.fx + fz * bs.fz, ang = Math.atan2(dx2, dy2);
        c.translate(60, 60); c.rotate(ang); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(0, -7); c.lineTo(5, 5); c.lineTo(-5, 5); c.closePath(); c.fill(); c.restore();
    }

    /* ---- リザルト ---- */
    function showResult(win){
        var B = S.B, st = B.stats, i = S.stageSel; S.resShown = true; $("bRsRetry").style.display = ""; S.endPend = false;
        $("rsTable").innerHTML = ""; $("rsNew").textContent = ""; document.body.classList.remove("cine");
        if(win){
            var prev = stageRank(i), prevCnt = clearedCount(), oldBest = store.get("time_" + US.STAGES[i].id, 0);
            if(!prev || RK[st.rank] > RK[prev]) store.set("rank_" + US.STAGES[i].id, st.rank); else if(!prev) store.set("rank_" + US.STAGES[i].id, st.rank);
            if(!oldBest || st.time < oldBest) store.set("time_" + US.STAGES[i].id, Math.round(st.time * 10) / 10);
            store.set("cleared", Math.max(store.get("cleared", 0), clearedCount()));
            var now = clearedCount(); S.newHeroes = US.HEROES.filter(function(h){ return h.unlock > prevCnt && h.unlock <= now; });
            $("rsT").textContent = T(US.TX.clear); $("rsRank").className = "rank " + st.rank; $("rsRank").textContent = st.rank;
            var best = store.get("time_" + US.STAGES[i].id, 0);
            var rows = [[X("timeT"), fmtTime(st.time) + (best ? "  (" + X("bestT") + " " + fmtTime(best) + ")" : "")], [X("koT"), st.ko], [X("comboT"), st.combo], [X("dmgT"), st.dmg], [X("scoreT"), st.score]];
            $("rsTable").innerHTML = rows.map(function(r){ return "<span>" + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span>"; }).join("");
            $("rsNew").textContent = S.newHeroes.length ? X("newHero") + S.newHeroes.map(function(h){ return T(h.n); }).join("・") : "";
            var last = i >= US.STAGES.length - 1; $("bRsNext").textContent = last ? X("endT") : T(US.TX.next); $("bRsNext").style.display = ""; S.endPend = last;
        } else {
            $("rsT").textContent = T(US.TX.down); $("rsRank").className = "rank C"; $("rsRank").textContent = "…"; $("rsNew").textContent = X("dead");
            $("rsTable").innerHTML = [[X("timeT"), fmtTime(B.t)], [X("koT"), B.ko]].map(function(r){ return "<span>" + esc(r[0]) + "</span><span>" + esc(r[1]) + "</span>"; }).join("");
            $("bRsNext").style.display = "none";
        }
        show("res"); var first = win ? $("bRsNext") : $("bRsRetry"); setTimeout(function(){ try{ first.focus({preventScroll: true}); }catch(_e){} if(window.AREPadFocus && GKI.padConnected && GKI.padConnected()) try{ AREPadFocus(first); }catch(_e){} }, 80);
    }
    $("bRsMenu").onclick = function(){ GK.sfx("tap"); goMenu(); };
    $("bRsRetry").onclick = function(){ GK.sfx("tap"); startBattle(); };
    $("bRsNext").onclick = function(){
        GK.sfx("ok");
        if(S.endPend){ store.set("over", 1); $("enBody").textContent = T(US.STAGES[US.STAGES.length - 1].end) + "\n\n" + X("clearedAll"); $("enBody").style.whiteSpace = "pre-line"; show("end"); S.endPend = false; return; }
        S.stageSel = Math.min(US.STAGES.length - 1, S.stageSel + 1); startBattle();
    };
    $("bEnd").onclick = function(){ GK.sfx("tap"); S.stageSel = 0; show("title"); };

    /* ---- メインループ ---- */
    function fpsCheck(rdt){
        var f = S.fps; f.t += rdt; f.n++; if(f.t >= 3){ var fps = f.n / f.t; f.t = 0; f.n = 0; if(S.scr === "play" && !S.paused && fps < 30 && S.cfg.q === "high" && !/noauto/.test(location.search)){ f.low++; if(f.low >= 2){ S.cfg.q = "low"; store.set("q", "low"); initR(); if(S.B && S.R){ S.R.B = S.B; S.R.setStage(S.B.st); S.R.setHero(S.B.h); } toast(X("lowQ"), 3500); } } else f.low = 0; }
    }
    function frame(ts){
        requestAnimationFrame(frame); var R = S.R; if(!R){ return; }
        var rdt = Math.min(.1, (ts - (S.last || ts)) / 1000); S.last = ts; fpsCheck(rdt);
        try{
            if(S.scr === "play" || S.scr === "pause" || S.scr === "res"){ playFrame(rdt, R); }
            else if(S.scr === "brief"){ var B0 = S.B; if(B0) R.update(B0, rdt, null); }
            else if(S.demo){ R.update(S.demo.B, rdt, null); }
            R.render();
        }catch(err){ if(!S.errShown){ S.errShown = true; console.error(err); } }
    }
    function playFrame(rdt, R){
        var B = S.B; if(!B) return;
        if(S.scr === "pause"){ R.render(); return; }
        if(S.cine > 0){ S.cine -= rdt; if(S.cine <= 0){ S.cine = 0; document.body.classList.remove("cine"); } }
        if(S.hold > 0){ S.hold -= rdt; R.update(B, rdt, null); if(S.hold <= 0){ S.hold = 0; R.cinStop(); R.snapCamera(B); } return; }
        if(S.scr === "res"){ R.update(B, rdt, null); return; }
        var g = gatherInput(B, R, rdt); decayBuf(rdt);
        var sdt = rdt; if(B.slow && B.slow.t > 0){ sdt = rdt * B.slow.s; B.slow.t -= rdt; }
        if(B.hitstop > 0){ B.hitstop -= rdt; sdt = 0; }
        S.elapsed += rdt;
        var n = sdt > .034 ? 2 : 1, h = sdt / n; for(var i = 0; i < n; i++) US.step(B, h, g.inp);
        onEvents(B);
        R.update(B, sdt > 0 ? sdt : rdt * .02, g.cam);
        hud(B, R, rdt);
        if(S.hintT > 0){ S.hintT -= rdt; $("keyHint").style.opacity = S.hintT > 1 ? .85 : S.hintT; if(S.hintT <= 0) $("keyHint").style.display = "none"; }
        if(B.state === "clear" && !S.resShown && B.clearT > 2.6) showResult(true);
        if(B.state === "dead" && !S.resShown){ S.deadT = (S.deadT || 0) + rdt; if(S.deadT > 1.7){ S.deadT = 0; showResult(false); } }
    }

    /* ---- ボタン ---- */
    $("bStart").onclick = function(){ GK.sfx("ok"); S.stageSel = 0; S.heroSel = clamp(store.get("hero", 0), 0, 3); if(!heroOpen(US.HEROES[S.heroSel])) S.heroSel = 0; S.diff = store.get("diff", 2) || 2; show("sel"); };
    $("bCont").onclick = function(){ GK.sfx("ok"); S.stageSel = clamp(Math.min(store.get("stage", 0), bestStageIdx()), 0, 4); S.stageSel = stageOpen(S.stageSel) ? S.stageSel : bestStageIdx(); S.heroSel = clamp(store.get("hero", 0), 0, 3); if(!heroOpen(US.HEROES[S.heroSel])) S.heroSel = 0; S.diff = store.get("diff", 2) || 2; show("sel"); };
    $("bHow").onclick = function(){ GK.sfx("tap"); show("how"); };
    $("bOpt").onclick = function(){ GK.sfx("tap"); show("opt"); };
    $("bHowBack").onclick = function(){ GK.sfx("tap"); show("title"); };
    $("bOptBack").onclick = function(){ GK.sfx("tap"); show("title"); };
    $("bSelBack").onclick = function(){ GK.sfx("tap"); show("title"); };
    $("bGo").onclick = function(){ if(!stageOpen(S.stageSel)) return; GK.sfx("ok"); if(!S.R) { show("nogl"); return; } startBattle(); };
    $("bBrGo").onclick = function(){ beginPlay(); };
    $("bNgBack").onclick = function(){ show("title"); };
    $("exitBtn").onclick = function(){
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "../index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()){ GK.sfx("ok"); try{ GK.bgm(S.scr === "title" ? "fun" : "calm"); }catch(_e){} } };
    $("lgBtn").onclick = function(){ var order = ["ja", "en", "zh", "ko"], i = order.indexOf(L()); GK.LS.set("are_lang", order[(i + 1) % 4]); document.documentElement.lang = L(); if(S.scr === "sel") buildSel(); applyText(); };

    /* ---- 起動 ---- */
    function boot(){
        S.stageSel = clamp(store.get("stage", 0), 0, 4); S.heroSel = clamp(store.get("hero", 0), 0, 3); S.diff = store.get("diff", 2) || 2;
        if(!stageOpen(S.stageSel)) S.stageSel = 0; if(!heroOpen(US.HEROES[S.heroSel])) S.heroSel = 0;
        applyTouchMode(); var ok = initR(); $("loading").classList.add("off"); applyText();
        var cv = $("cv"); cv.addEventListener("webglcontextlost", function(e){ e.preventDefault(); S.R = null; show("nogl"); }); cv.addEventListener("webglcontextrestored", function(){ if(initR()) show("title"); });
        if(!ok) { show("nogl"); } else show("title");
        requestAnimationFrame(frame);
    }
    function start(){ if(window.US3D) boot(); else { var done = false; window.addEventListener("us3d-ready", function(){ if(!done){ done = true; boot(); } }); setTimeout(function(){ if(!done){ done = true; boot(); } }, 9000); } }
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
    window.__us.startBattle = startBattle; window.__us.beginPlay = beginPlay; window.__us.show = show; window.__us.showResult = showResult; window.__us.pause = pause; window.__us.resume = resume;
})();
