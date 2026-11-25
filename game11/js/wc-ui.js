"use strict";
/* ことばクラフト：画面・えがき・そうさ（クラシック script） */
(function(){
    var M = window.Matter, WC = window.WC, D = window.WCDict, STAGES = window.WCStages;
    function $(id){ return document.getElementById(id); }
    var save = GK.save("wc");

    // ---------- ことば（4か国語） ----------
    var t = GK.i18n({
        ja: {sub: "打った ことばが、そのまま「もの」になる！", stages: "▶ ステージに ちょうせん", sand: "🧪 じゆうに つくる", zukan: "📖 ことばずかん", how: "❓ あそびかた", note: "つかえない ことばも あります。進み具合は この端末に 記録されます。", back: "もどる",
            howT: "あそびかた", howB: "<p>⭐ <b>ほし</b>を 右がわの <b>🚩ゴール</b>に とどけよう！</p><p>⌨️ 下の はこに <b>ことば</b>を 打つと、それが「もの」になります。たとえば「<b>はし</b>」→ 橋、「<b>ばくだん</b>」→ 爆弾、「<b>かぜ</b>」→ 風。</p><p>🔧 <b>せいしつことば</b>も 足せるよ：「<b>おおきい</b> いし」「<b>おもい</b> いわ」「<b>つるつる</b> いた」「<b>つよい</b> かぜ」…</p><p>🌏 にほんご・English・中文・한국어 どれでも OK。知らない ことばは「ふしぎもの」になります（文字の かずや にごりで 重さや はずみが 変わる！）。</p><p>📍 つくったら、場所を <b>タップ</b>して おく。<b>↻</b>で 向きを かえられます。ならべたら <b>▶スタート</b>！ 走っている あいだも ことばを 足せます。</p><p>⭐⭐⭐ すくない ことばで クリアすると ★が ふえるよ。</p>",
            selT: "ステージを えらぶ", zT: "ことばずかん", zC: "みつけた ことば {n} / {m}", ph: "ことばを いれてね（例：はし ／ big stone ／ 气球）", make: "つくる", go: "▶ スタート", stop: "■ とめる", reset: "↺ やりなおす", hintBtn: "💡",
            words: "ことば {n}/{m}", wordsInf: "ことば {n}", place: "ばしょを タップして おいてね（↻で向き）", banned: "この ことばは つかえないよ", empty: "ことばを いれてね", limit: "ことばを つかいきったよ。やりなおすか、もどしてね", full: "もう いっぱい！",
            clear: "クリア！", cl1: "ことば {n}こ で クリア！", cNext: "▶ つぎへ", cRetry: "もういちど", cSel: "ステージえらび", lava: "ほしが ようがんに…！", fall: "ほしが おちちゃった…", stuck: "ほしが とまっちゃった…", lost: "やりなおそう！", unk: "ふしぎもの！", made: "{w} → {n}",
            sandNm: "じゆうに つくる", clearAll: "ぜんぶ けす", newWord: "あたらしい ことば：{n}", hint2: "ヒント：{w}", sandHint: "じゆうに ことばを うって あそぼう。ほしを ころがしたり、ばくはつさせたり…"},
        en: {sub: "Whatever you type becomes a real object!", stages: "▶ Play Stages", sand: "🧪 Sandbox", zukan: "📖 Word Book", how: "❓ How to Play", note: "Some words can't be made. Progress is saved on this device.", back: "Back",
            howT: "How to Play", howB: "<p>⭐ Bring the <b>star</b> to the <b>🚩 goal</b> on the right!</p><p>⌨️ <b>Type a word</b> below and it becomes an object. \"<b>bridge</b>\" → a bridge, \"<b>bomb</b>\" → a bomb, \"<b>wind</b>\" → wind.</p><p>🔧 Add <b>modifiers</b>: \"<b>big</b> stone\", \"<b>heavy</b> rock\", \"<b>slippery</b> board\", \"<b>strong</b> wind\"…</p><p>🌏 Works in English, 日本語, 中文, 한국어. Unknown words become \"mystery things\" — their letters decide weight and bounce!</p><p>📍 After making a word, <b>tap</b> to place it. <b>↻</b> rotates. Then press <b>▶ Start</b>! You can add words while it runs.</p><p>⭐⭐⭐ Use fewer words for more stars.</p>",
            selT: "Choose a Stage", zT: "Word Book", zC: "Words found {n} / {m}", ph: "Type a word (e.g. bridge / big stone / 气球)", make: "Make", go: "▶ Start", stop: "■ Stop", reset: "↺ Retry", hintBtn: "💡",
            words: "Words {n}/{m}", wordsInf: "Words {n}", place: "Tap to place it (↻ to rotate)", banned: "That word can't be used", empty: "Type a word first", limit: "No words left. Retry or undo.", full: "Full!",
            clear: "Clear!", cl1: "Cleared with {n} word(s)!", cNext: "▶ Next", cRetry: "Retry", cSel: "Stages", lava: "The star fell into lava…!", fall: "The star fell…", stuck: "The star stopped…", lost: "Try again!", unk: "A mystery thing!", made: "{w} → {n}",
            sandNm: "Sandbox", clearAll: "Clear all", newWord: "New word: {n}", hint2: "Hint: {w}", sandHint: "Type anything and play. Roll the star, blow things up…"},
        zh: {sub: "你输入的词，会变成真正的东西！", stages: "▶ 挑战关卡", sand: "🧪 自由创造", zukan: "📖 词语图鉴", how: "❓ 玩法", note: "有些词无法制作。进度保存在本设备。", back: "返回",
            howT: "玩法", howB: "<p>⭐ 把<b>星星</b>送到右边的<b>🚩终点</b>！</p><p>⌨️ 在下方<b>输入词语</b>，它就会变成物体。例如「<b>桥</b>」→ 桥，「<b>炸弹</b>」→ 炸弹，「<b>风</b>」→ 风。</p><p>🔧 还可以加<b>性质词</b>：「<b>大</b>石头」「<b>重</b>岩石」「<b>光滑</b>木板」「<b>强</b>风」…</p><p>🌏 支持中文、日本語、English、한국어。不认识的词会变成「神秘物体」，字数和字形会决定轻重与弹性！</p><p>📍 做好后<b>点击</b>场地放置，<b>↻</b>可旋转。然后按<b>▶开始</b>！运行时也能继续添加。</p><p>⭐⭐⭐ 用的词越少，星星越多。</p>",
            selT: "选择关卡", zT: "词语图鉴", zC: "已发现 {n} / {m}", ph: "输入词语（如：桥 / big stone / はし）", make: "制作", go: "▶ 开始", stop: "■ 停止", reset: "↺ 重来", hintBtn: "💡",
            words: "词 {n}/{m}", wordsInf: "词 {n}", place: "点击场地放置（↻旋转）", banned: "这个词不能用", empty: "请先输入词语", limit: "词用完了。请重来或撤销。", full: "满了！",
            clear: "过关！", cl1: "用了 {n} 个词通关！", cNext: "▶ 下一关", cRetry: "再来一次", cSel: "选关", lava: "星星掉进岩浆了…！", fall: "星星掉下去了…", stuck: "星星停住了…", lost: "再试一次！", unk: "神秘物体！", made: "{w} → {n}",
            sandNm: "自由创造", clearAll: "全部清除", newWord: "新词语：{n}", hint2: "提示：{w}", sandHint: "随便输入词语来玩吧。滚动星星、引爆炸弹…"},
        ko: {sub: "입력한 말이 그대로 물건이 돼요!", stages: "▶ 스테이지 도전", sand: "🧪 자유롭게 만들기", zukan: "📖 단어 도감", how: "❓ 방법", note: "만들 수 없는 단어도 있어요. 진행 상황은 이 기기에 저장돼요.", back: "돌아가기",
            howT: "방법", howB: "<p>⭐ <b>별</b>을 오른쪽 <b>🚩골</b>까지 보내요!</p><p>⌨️ 아래에 <b>단어</b>를 입력하면 물건이 돼요. 예: \"<b>다리</b>\" → 다리, \"<b>폭탄</b>\" → 폭탄, \"<b>바람</b>\" → 바람.</p><p>🔧 <b>성질 단어</b>도 붙여요: \"<b>큰</b> 돌\", \"<b>무거운</b> 바위\", \"<b>미끄러운</b> 판자\", \"<b>강한</b> 바람\"…</p><p>🌏 한국어, 日本語, English, 中文 모두 OK. 모르는 단어는 \"수수께끼 물건\"이 돼요. 글자 수와 모양이 무게와 탄력을 정해요!</p><p>📍 만든 뒤 <b>탭</b>해서 놓아요. <b>↻</b>로 회전. 그다음 <b>▶시작</b>! 실행 중에도 단어를 더할 수 있어요.</p><p>⭐⭐⭐ 단어를 적게 쓸수록 별이 늘어요.</p>",
            selT: "스테이지 선택", zT: "단어 도감", zC: "찾은 단어 {n} / {m}", ph: "단어 입력 (예: 다리 / big stone / はし)", make: "만들기", go: "▶ 시작", stop: "■ 정지", reset: "↺ 다시", hintBtn: "💡",
            words: "단어 {n}/{m}", wordsInf: "단어 {n}", place: "탭해서 놓아요 (↻ 회전)", banned: "이 단어는 쓸 수 없어요", empty: "단어를 입력해요", limit: "단어를 다 썼어요. 다시 하거나 되돌려요.", full: "가득!",
            clear: "클리어!", cl1: "단어 {n}개로 클리어!", cNext: "▶ 다음", cRetry: "다시", cSel: "스테이지", lava: "별이 용암에 빠졌어요…!", fall: "별이 떨어졌어요…", stuck: "별이 멈췄어요…", lost: "다시 해봐요!", unk: "수수께끼 물건!", made: "{w} → {n}",
            sandNm: "자유롭게 만들기", clearAll: "모두 지우기", newWord: "새 단어: {n}", hint2: "힌트: {w}", sandHint: "마음대로 단어를 입력해 놀아요. 별을 굴리고, 폭발시키고…"}
    });
    function L(o){ var l = GK.lang(); return (o && (o[l] || o.ja)) || ""; }

    // ---------- じょうたい ----------
    var cv = $("cv"), cx = cv.getContext("2d");
    var S = {scr: "title", stage: null, mode: "stage", pl: [], world: null, running: false, held: null, sel: -1, speed: 1, acc: 0, ptr: {x: 480, y: 270, on: false}, drag: null, result: null, resultT: 0, hintLv: 0, time: 0, fx: [], shake: 0, disc: {}, cw: 960, ch: 540, scale: 1, ox: 0, oy: 0, dpr: 1};
    var discArr = save.get("disc", []); discArr.forEach(function(k){ S.disc[k] = 1; });

    var SANDBOX = {sandbox: true, world: 1, name: {ja: "じゆうに つくる", en: "Sandbox", zh: "自由创造", ko: "자유롭게 만들기"}, star: {x: 480, y: 200, vx: 0}, goal: null,
        statics: [[480, 490, 960, 40, 0], [-10, 270, 30, 600, 0], [970, 270, 30, 600, 0], [200, 400, 220, 20, -8], [760, 380, 200, 20, 10]], limit: 999, sol: []};

    function show(id){
        ["title", "how", "sel", "zukan", "play"].forEach(function(n){ $("s-" + n).classList.toggle("on", n === id); });
        S.scr = id; GK.sfx("tap");
        if(id === "play"){ fit(); }
        $("exitBtn").hidden = id === "play" && false;
        if(window.GKI) GKI.mode(id === "play" ? "pointer" : "menu", cv);
    }
    function toast(msg, ms){ var e = $("toast"); e.textContent = msg; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1800); }

    // ---------- UIの ことば ----------
    function labels(){
        document.documentElement.lang = GK.lang();
        $("tSub").textContent = t("sub"); $("bStages").textContent = t("stages"); $("bSand").textContent = t("sand"); $("bZukan").textContent = t("zukan"); $("bHow").textContent = t("how"); $("tNote").textContent = t("note");
        $("hT").textContent = t("howT"); $("hBody").innerHTML = t("howB"); $("bHowBack").textContent = t("back"); $("selT").textContent = t("selT"); $("bSelBack").textContent = t("back");
        $("zT").textContent = t("zT"); $("bZBack").textContent = t("back"); $("wi").placeholder = t("ph"); $("wMake").textContent = t("make"); $("bReset").textContent = t("reset"); $("exitBtn").textContent = "← " + t("back");
        $("clNext").textContent = t("cNext"); $("clRetry").textContent = t("cRetry"); $("clSel").textContent = t("cSel");
        $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊";
        buildLevels(); buildZukan(); buildChips(); hud();
    }
    function buildLevels(){
        var stars = save.get("stars", {}), h = "";
        STAGES.forEach(function(st){
            var n = stars[st.id] || 0;
            h += '<button type="button" class="cardbtn" data-id="' + st.id + '"><b>' + st.id + '</b><small>' + esc(L(st.name)) + '</small><span class="st">' + (n ? "★★★".slice(0, n) + "☆☆☆".slice(0, 3 - n) : "☆☆☆") + '</span></button>';
        });
        $("levels").innerHTML = h;
    }
    function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]; }); }
    function buildZukan(){
        var h = "", n = 0, l = GK.lang();
        D.NOUNS.forEach(function(nn){
            var ok = S.disc[nn.id]; if(ok) n++;
            h += '<div class="cardbtn"><span class="e">' + (ok ? nn.emoji : "❓") + '</span><small><b style="font-size:12px">' + (ok ? esc((nn[l] || nn.ja)[0]) : "？？？") + '</b><br>' + (ok ? esc(nn.ja[0] !== (nn[l] || nn.ja)[0] ? nn.ja[0] : (nn.en[0])) : "") + '</small></div>';
        });
        $("zgrid").innerHTML = h; $("zCount").textContent = t("zC", {n: n, m: D.NOUNS.length});
    }
    function buildChips(){
        var l = GK.lang(), h = "", basics = ["plank", "ramp", "spring", "wind", "balloon", "bomb", "stone", "ice", "fire", "water", "magnet", "fan", "rocket", "cannon", "swing", "seesaw"];
        basics.forEach(function(id){ var n = D.NMAP[id]; if(n) h += '<button type="button" data-w="' + esc((n[l] || n.ja)[0]) + '">' + n.emoji + " " + esc((n[l] || n.ja)[0]) + '</button>'; });
        var mods = {ja: ["おおきい", "ちいさい", "おもい", "かるい", "つるつる", "はずむ", "つよい", "ながい"], en: ["big", "small", "heavy", "light", "slippery", "bouncy", "strong", "long"], zh: ["大", "小", "重", "轻", "光滑", "弹", "强", "长"], ko: ["큰", "작은", "무거운", "가벼운", "미끄러운", "통통", "강한", "긴"]}[l] || [];
        mods.forEach(function(m){ h += '<button type="button" data-m="' + esc(m) + '" style="background:#43206b">+' + esc(m) + '</button>'; });
        $("chips").innerHTML = h;
    }

    // ---------- ステージ ----------
    function openStage(st, mode){
        S.stage = st; S.mode = mode || "stage"; S.pl = []; S.held = null; S.sel = -1; S.result = null; S.speed = 1; S.hintLv = 0; $("hintBox").classList.remove("on");
        $("bSpeed").textContent = "⏩ ×1";
        show("play");
        rebuild();
        $("nm").textContent = mode === "sand" ? t("sandNm") : st.id + ". " + L(st.name);
        if(mode === "sand") toast(t("sandHint"), 3200);
        GK.bgm(mode === "sand" ? "fun" : "calm");
        setTimeout(function(){ try{ $("wi").focus({preventScroll: true}); }catch(_e){} }, 50);
    }
    function pls(){ S.pl.forEach(function(p, i){ p.i = i; }); return S.pl; }
    function rebuild(){
        S.world = WC.create(S.stage, S.mode === "sand" ? [] : pls());
        S.running = S.mode === "sand"; S.result = null; S.acc = 0; S.fx = S.fx.filter(function(f){ return f.keep; });
        $("bGo").textContent = t("go");
        hud();
    }
    function hud(){
        if(!S.stage) return;
        var lim = S.stage.limit, n = S.pl.length, e = $("wInfo");
        e.textContent = S.mode === "sand" ? t("wordsInf", {n: S.pl.length}) : t("words", {n: n, m: lim});
        e.classList.toggle("low", S.mode !== "sand" && n >= lim);
        $("bGo").textContent = S.mode === "sand" ? t("clearAll") : (S.running ? t("stop") : t("go"));
        $("bGo").style.display = "";
        $("bDel").style.display = $("bRotL").style.display = $("bRotR").style.display = "";
    }

    // ---------- ことばを つくる ----------
    function submitWord(text){
        text = String(text || "").trim(); if(!text){ toast(t("empty")); return; }
        var res = D.make(text);
        if(res.err === "banned"){ toast(t("banned")); GK.sfx("ng"); return; }
        if(res.err){ toast(t("empty")); return; }
        if(S.mode !== "sand" && S.pl.length >= S.stage.limit){ toast(t("limit")); GK.sfx("ng"); return; }
        if(S.mode === "sand" && S.pl.length >= 60){ toast(t("full")); return; }
        S.held = {text: text, a: res.spec.a0 || 0, spec: res.spec};
        $("wi").value = ""; $("wi").blur();
        var nm = res.noun ? (res.noun[GK.lang()] || res.noun.ja)[0] : t("unk");
        toast(t("place") + "  [" + (res.noun ? res.noun.emoji + " " + nm : "✨ " + nm) + "]", 2600);
        GK.sfx("pop");
    }
    function discover(spec){
        if(spec.noun && !S.disc[spec.noun]){
            S.disc[spec.noun] = 1; save.set("disc", Object.keys(S.disc)); buildZukan();
            var nn = D.NMAP[spec.noun]; toast(t("newWord", {n: nn.emoji + " " + (nn[GK.lang()] || nn.ja)[0]}), 2200); GK.sfx("coin");
        }
    }
    function place(x, y){
        var h = S.held; if(!h) return;
        var p = {w: h.text, x: Math.round(x), y: Math.round(y), a: h.a};
        discover(h.spec);
        if(S.mode === "sand"){ var o = WC.add(S.world, p); S.pl.push(p); }
        else if(S.running){ p.t = +(S.world.steps / 60).toFixed(3); S.pl.push(p); WC.add(S.world, p); }
        else{ S.pl.push(p); rebuild(); S.sel = S.pl.length - 1; }
        S.held = null; GK.sfx("pop"); GK.burst(sx(x), sy(y), {n: 10, speed: 140, life: .5, size: 5});
        hud();
    }

    // ---------- 座標 ----------
    function fit(){
        var wrap = $("stageWrap"), r = wrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        S.dpr = dpr; cv.width = Math.max(10, Math.floor(r.width * dpr)); cv.height = Math.max(10, Math.floor(r.height * dpr));
        var sc = Math.min(r.width / 960, r.height / 540); S.scale = sc; S.ox = (r.width - 960 * sc) / 2; S.oy = (r.height - 540 * sc) / 2;
    }
    function sx(x){ var r = cv.getBoundingClientRect(); return r.left + S.ox + x * S.scale; }
    function sy(y){ var r = cv.getBoundingClientRect(); return r.top + S.oy + y * S.scale; }
    function toLogical(ev){ var r = cv.getBoundingClientRect(); return {x: (ev.clientX - r.left - S.ox) / S.scale, y: (ev.clientY - r.top - S.oy) / S.scale}; }

    // ---------- そうさ ----------
    cv.addEventListener("pointermove", function(e){ var p = toLogical(e); S.ptr.x = p.x; S.ptr.y = p.y; S.ptr.on = true; if(S.drag){ var pp = S.pl[S.drag.i]; if(pp){ pp.x = Math.round(p.x - S.drag.dx); pp.y = Math.round(p.y - S.drag.dy); S.drag.moved = true; rebuild(); } } });
    cv.addEventListener("pointerleave", function(){ S.ptr.on = false; });
    cv.addEventListener("pointerdown", function(e){
        e.preventDefault(); var p = toLogical(e); S.ptr.x = p.x; S.ptr.y = p.y; S.ptr.on = true;
        try{ cv.setPointerCapture(e.pointerId); }catch(_e){}
        if(S.held){ place(p.x, p.y); return; }
        if(S.mode !== "sand" && !S.running){
            // おいた ものを ひろう
            var bodies = M.Composite.allBodies(S.world.engine.world), hit = null;
            var hits = M.Query.point(bodies.filter(function(b){ return b.plugin && b.plugin.o && !b.plugin.o.locked; }), p);
            if(hits.length) hit = hits[0].plugin.o;
            if(!hit){ S.world.objs.forEach(function(o){ if(o.zone && !o.locked && WC.inRect(o.zone, p.x, p.y)) hit = o; }); }
            if(hit && hit.pi != null){ S.sel = hit.pi; var pp = S.pl[hit.pi]; S.drag = {i: hit.pi, dx: p.x - pp.x, dy: p.y - pp.y, moved: false}; GK.sfx("tap"); }
            else S.sel = -1;
        }
    });
    function endDrag(){ S.drag = null; }
    cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);

    $("wf").addEventListener("submit", function(e){ e.preventDefault(); submitWord($("wi").value); });
    $("chips").addEventListener("click", function(e){
        var b = e.target.closest("button"); if(!b) return;
        var wi = $("wi");
        if(b.dataset.m){ var v = wi.value.trim(); wi.value = (v ? b.dataset.m + " " + v.replace(/^\S+\s/, function(m0){ return D.parse(m0).mods.length && !D.parse(m0).noun ? "" : m0; }) : b.dataset.m + " "); wi.focus(); GK.sfx("tap"); }
        else if(b.dataset.w){ var cur = wi.value.trim(), mm = cur && D.parse(cur).mods.length && !D.parse(cur).noun; submitWord(mm ? cur + " " + b.dataset.w : b.dataset.w); }
    });
    function rot(d){
        if(S.held){ S.held.a = ((S.held.a + d) % 360 + 360) % 360; GK.sfx("tap"); }
        else if(S.sel >= 0 && S.pl[S.sel] && !S.running){ var p = S.pl[S.sel]; p.a = (((p.a || 0) + d) % 360 + 360) % 360; rebuild(); GK.sfx("tap"); }
    }
    $("bRotL").addEventListener("click", function(){ rot(-45); }); $("bRotR").addEventListener("click", function(){ rot(45); });
    $("bDel").addEventListener("click", function(){
        if(S.held){ S.held = null; return; }
        if(S.mode === "sand"){ S.pl = []; rebuild(); return; }
        if(S.sel >= 0 && S.pl[S.sel]){ S.pl.splice(S.sel, 1); S.sel = -1; rebuild(); GK.sfx("tap"); }
        else if(S.pl.length){ S.pl.pop(); rebuild(); GK.sfx("tap"); }
    });
    $("bUndo").addEventListener("click", function(){ if(S.held){ S.held = null; return; } if(S.mode === "sand"){ if(S.pl.length){ S.pl.pop(); var keep = S.pl.slice(); rebuild(); keep.forEach(function(p){ WC.add(S.world, p); }); } return; } if(S.pl.length){ S.pl.pop(); S.sel = -1; rebuild(); GK.sfx("tap"); } });
    $("bReset").addEventListener("click", function(){ S.held = null; if(S.mode === "sand"){ S.pl = []; } rebuild(); GK.sfx("tap"); });
    $("bGo").addEventListener("click", function(){
        if(S.mode === "sand"){ S.pl = []; rebuild(); GK.sfx("tap"); return; }
        if(S.running){ rebuild(); return; }          // とめる＝さいしょに もどす
        S.held = null; S.running = true; S.result = null; hud(); GK.sfx("whoosh");
    });
    $("bSpeed").addEventListener("click", function(){ S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; $("bSpeed").textContent = "⏩ ×" + S.speed; GK.sfx("tap"); });
    $("bHint").addEventListener("click", function(){
        var st = S.stage; if(!st) return; var box = $("hintBox"); GK.sfx("tap");
        if(S.mode === "sand"){ box.textContent = t("sandHint"); box.classList.add("on"); return; }
        S.hintLv++; var txt = L(st.hint);
        if(S.hintLv >= 2 && st.sol && st.sol[0]){ var w0 = String(st.sol[0].w).split(/\s+/).pop(); var r = D.make(w0); txt += "\n" + t("hint2", {w: (r.noun ? r.noun.emoji + " " : "") + (r.noun ? (r.noun[GK.lang()] || r.noun.ja)[0] : w0)}); }
        box.style.whiteSpace = "pre-line"; box.textContent = txt; box.classList.add("on"); clearTimeout(box._t); box._t = setTimeout(function(){ box.classList.remove("on"); }, 7000);
    });
    // キーボード・プロコンは 共通部品 GKI。スティック／十字＝カーソル、A＝ひろう・おく・ボタンを おす（ことば入力ぶぶんを おすと もじ盤が ひらく）
    // L／R＝まわす、X＝スタート／とめる、Y＝さいしょから、B＝キャンセル（もっていなければ 1つ もどす）、ZL＝1つもどす、ZR＝ヒント、−＝ことばを うつ、＋＝もどる
    if(window.GKI){
        GKI.defaults({a: ["Enter", "/"], b: ["Escape", "Backspace"], x: [" ", "x"], y: ["r", "y"], plus: ["p"]});
        var zc = {}; D.NOUNS.concat(D.MODS).forEach(function(x){ (x.zh || []).forEach(function(w){ Array.from(w).forEach(function(c){ zc[c] = (zc[c] || 0) + 1; }); }); });
        GKI.textpadOpts({chars: Object.keys(zc).sort(function(p, q){ return zc[q] - zc[p]; }).join("")});
        GKI.legend([{k: "dpad", t: {ja: "カーソルを うごかす", en: "Move the cursor", zh: "移动光标", ko: "커서 이동"}},
            {k: "a", t: {ja: "ひろう・おく・ボタンを おす（ことばの わくで もじ盤）", en: "Pick up / place / press (text box opens the letter pad)", zh: "拾取/放置/按钮（文字框会打开输入盘）", ko: "집기/놓기/버튼 (입력창은 글자판)"}},
            {k: "l", t: {ja: "ひだりに まわす", en: "Rotate left", zh: "向左旋转", ko: "왼쪽 회전"}}, {k: "r", t: {ja: "みぎに まわす", en: "Rotate right", zh: "向右旋转", ko: "오른쪽 회전"}},
            {k: "x", t: {ja: "スタート／とめる", en: "Start / stop", zh: "开始/停止", ko: "시작/정지"}}, {k: "y", t: {ja: "さいしょから", en: "Reset", zh: "重来", ko: "처음부터"}},
            {k: "b", t: {ja: "キャンセル／1つ もどす", en: "Cancel / undo one", zh: "取消/撤销一个", ko: "취소/하나 되돌리기"}}, {k: "zr", t: {ja: "ヒント", en: "Hint", zh: "提示", ko: "힌트"}},
            {k: "minus", t: {ja: "ことばを うつ（もじ盤）", en: "Type a word (letter pad)", zh: "输入文字（输入盘）", ko: "단어 입력 (글자판)"}}, {k: "plus", t: {ja: "もどる", en: "Back", zh: "返回", ko: "뒤로"}}]);
        GKI.on(function(a, down){
            if(!down || S.scr !== "play") return;
            if(a === "l") rot(-45); else if(a === "r") rot(45);
            else if(a === "y") $("bReset").click(); else if(a === "x") $("bGo").click();
            else if(a === "b" || a === "zl") $("bUndo").click(); else if(a === "zr") $("bHint").click();
            else if(a === "a") $("wi").focus(); else if(a === "minus") GKI.textpad($("wi"));
            else if(a === "plus") $("exitBtn").click();
        });
        GKI.onBack(function(){ if(S.scr !== "title") $("exitBtn").click(); });
        $("wi").setAttribute("data-pad-text", "1");
    }
    document.addEventListener("keydown", function(e){   // ことば入力中の Esc：入力をやめる
        if(S.scr !== "play") return;
        if(e.key === "Escape"){ S.held = null; $("wi").blur(); }
    });

    // ---------- メニュー ----------
    $("bStages").onclick = function(){ buildLevels(); show("sel"); };
    $("bSand").onclick = function(){ openStage(SANDBOX, "sand"); };
    $("bZukan").onclick = function(){ buildZukan(); show("zukan"); };
    $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = $("bSelBack").onclick = $("bZBack").onclick = function(){ show("title"); };
    $("levels").addEventListener("click", function(e){ var b = e.target.closest("button"); if(!b) return; openStage(STAGES[+b.dataset.id - 1], "stage"); });
    $("exitBtn").onclick = function(){
        if(S.scr === "play"){ S.running = false; GK.bgm("off"); show(S.mode === "sand" ? "title" : "sel"); if(S.mode !== "sand") buildLevels(); return; }
        if(S.scr !== "title"){ show("title"); return; }
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "./index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()){ GK.sfx("ok"); if(S.scr === "play") GK.bgm(S.mode === "sand" ? "fun" : "calm"); } };
    $("clNext").onclick = function(){ $("mClear").classList.remove("on"); var n = S.stage.id + 1; if(STAGES[n - 1]) openStage(STAGES[n - 1], "stage"); else { show("sel"); } };
    $("clRetry").onclick = function(){ $("mClear").classList.remove("on"); S.pl = []; rebuild(); };
    $("clSel").onclick = function(){ $("mClear").classList.remove("on"); buildLevels(); show("sel"); };
    window.addEventListener("resize", function(){ if(S.scr === "play") fit(); });

    // ---------- クリア・ミス ----------
    function finish(){
        var w = S.world; S.running = false; S.resultT = 0;
        if(w.status === "win"){
            S.result = "win"; var par = S.stage.sol.length, n = S.pl.length, stars = n <= par ? 3 : n <= par + 1 ? 2 : 1;
            var all = save.get("stars", {}); if((all[S.stage.id] || 0) < stars){ all[S.stage.id] = stars; save.set("stars", all); }
            GK.sfx("win"); GK.confetti();
            setTimeout(function(){
                $("clT").textContent = t("clear"); $("clStars").textContent = "★★★".slice(0, stars) + "☆☆☆".slice(0, 3 - stars); $("clB").textContent = t("cl1", {n: n});
                $("clNext").style.display = STAGES[S.stage.id] ? "" : "none"; $("mClear").classList.add("on");
            }, 1100);
        }else{
            S.result = "lose"; GK.sfx("lose"); GK.shake($("stageWrap"), 300); toast(t(w.reason === "lava" ? "lava" : w.reason === "stuck" ? "stuck" : "fall") + " " + t("lost"), 2600);
            $("bGo").textContent = t("go"); S.loseT = 1;
        }
    }
    function handleEvents(){
        var w = S.world, ev = w.events; if(!ev.length) return;
        ev.splice(0).forEach(function(e){
            var X = sx(e.x), Y = sy(e.y);
            if(e.type === "boing"){ GK.sfx("jump"); GK.burst(X, Y, {n: 8, speed: 160, life: .5, size: 5, colors: ["#ff7ab8", "#fff"]}); }
            else if(e.type === "boom"){ GK.sfx("boom"); GK.shake($("stageWrap"), 380); GK.vibrate(40); GK.burst(X, Y, {n: 40, speed: 520, life: .8, size: 8, colors: ["#ffcc33", "#ff7a1a", "#fff2a8", "#ff4a2a"], g: 200}); S.fx.push({k: "ring", x: e.x, y: e.y, r: 10, R: e.r, t: 0}); }
            else if(e.type === "burnt" || e.type === "melt" || e.type === "pop"){ GK.sfx(e.type === "pop" ? "pop" : "hit"); GK.burst(X, Y, {n: 14, speed: 120, life: .8, size: 7, g: -60, colors: e.type === "melt" ? ["#aee6ff", "#fff"] : e.type === "pop" ? ["#ff5d7a", "#fff"] : ["#555", "#888", "#ff8a2a"]}); }
            else if(e.type === "splash"){ GK.sfx("pop"); GK.burst(X, Y, {n: 10, speed: 200, life: .6, size: 5, colors: ["#7cc8ff", "#fff"]}); }
            else if(e.type === "fire"){ GK.sfx("boom"); GK.burst(X, Y, {n: 20, speed: 300, life: .6, size: 6, colors: ["#ffcc33", "#fff"]}); }
            else if(e.type === "glue"){ GK.sfx("coin"); GK.burst(X, Y, {n: 10, speed: 120, life: .6, size: 5, shape: "s"}); }
            else if(e.type === "respawn"){ GK.burst(X, Y, {n: 16, speed: 200, life: .6, size: 6, shape: "s"}); }
        });
    }

    // ---------- 更新・描画 ----------
    var last = 0, STEP_MS = 1000 / 60;
    function frame(ts){
        var dt = Math.min(.05, ((ts - last) / 1000) || .016); last = ts; S.time += dt;
        if(S.scr === "play" && S.world){
            if(S.running && S.world.status === "run"){
                S.acc += dt * 60 * S.speed; var n = 0;
                while(S.acc >= 1 && n < 12 && S.world.status === "run"){ WC.step(S.world, 1); S.acc -= 1; n++; }
                if(S.acc > 12) S.acc = 0;
                handleEvents();
                if(S.world.status !== "run" && S.mode !== "sand" && !S.result) finish();
            }else handleEvents();
            draw(dt);
        }
        requestAnimationFrame(frame);
    }

    var THEMES = [["#7ec8ff", "#e4f6ff", "#9be07b", "#5a3d28"], ["#ff9a7a", "#ffe0b0", "#d8b050", "#5a3028"], ["#5ab8ff", "#bdf0ff", "#60d6c0", "#2a4a5a"], ["#6a5acd", "#d6c6ff", "#ff9ad0", "#35296a"]];
    function drawBg(th){
        var g = cx.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]); cx.fillStyle = g; cx.fillRect(-20, -20, 1000, 580);
        // 太陽
        cx.save(); var rg = cx.createRadialGradient(780, 90, 10, 780, 90, 200); rg.addColorStop(0, "rgba(255,250,200,.95)"); rg.addColorStop(1, "rgba(255,250,200,0)"); cx.fillStyle = rg; cx.fillRect(500, -120, 460, 420); cx.restore();
        // 雲
        cx.fillStyle = "rgba(255,255,255,.55)";
        for(var i = 0; i < 6; i++){ var x = ((i * 190 + S.time * (8 + i * 3)) % 1200) - 120, y = 50 + (i * 53) % 190; cloud(x, y, 26 + (i % 3) * 8); }
        // 遠い やま
        cx.fillStyle = "rgba(60,80,140,.18)"; cx.beginPath(); cx.moveTo(0, 440); for(var k = 0; k <= 960; k += 60) cx.lineTo(k, 380 - Math.sin(k * .013 + 1) * 40 - Math.cos(k * .031) * 18); cx.lineTo(960, 540); cx.lineTo(0, 540); cx.fill();
        cx.fillStyle = "rgba(40,70,110,.14)"; cx.beginPath(); cx.moveTo(0, 470); for(var k2 = 0; k2 <= 960; k2 += 60) cx.lineTo(k2, 430 - Math.sin(k2 * .02) * 30); cx.lineTo(960, 540); cx.lineTo(0, 540); cx.fill();
    }
    function cloud(x, y, r){ cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.arc(x + r * .9, y + 4, r * .8, 0, 6.283); cx.arc(x - r * .9, y + 6, r * .7, 0, 6.283); cx.arc(x + r * .2, y - r * .5, r * .75, 0, 6.283); cx.fill(); }

    function poly(b){ var v = b.vertices; cx.beginPath(); cx.moveTo(v[0].x, v[0].y); for(var i = 1; i < v.length; i++) cx.lineTo(v[i].x, v[i].y); cx.closePath(); }
    function drawStatics(w, th){
        var bodies = w.engine.world.bodies;
        bodies.forEach(function(b){
            if(b.label !== "static" && !(b.plugin.o && b.isStatic && b.plugin.o.spec.fixed)) return;
            if(b.plugin.o){ return; }
            poly(b); var g = cx.createLinearGradient(0, b.bounds.min.y, 0, b.bounds.max.y); g.addColorStop(0, "#8a6040"); g.addColorStop(1, th[3]); cx.fillStyle = g; cx.fill();
            // 上の 面に 草
            var v = b.vertices; cx.lineCap = "round"; cx.strokeStyle = th[2]; cx.lineWidth = 9;
            for(var i = 0; i < v.length; i++){ var a = v[i], c = v[(i + 1) % v.length], dx = c.x - a.x, dy = c.y - a.y, len = Math.hypot(dx, dy) || 1, ny = -dx / len; if(ny < -.55 && len > 12){ cx.beginPath(); cx.moveTo(a.x + dx / len * 4, a.y + dy / len * 4 + 3); cx.lineTo(c.x - dx / len * 4, c.y - dy / len * 4 + 3); cx.stroke(); } }
            cx.strokeStyle = "rgba(0,0,0,.25)"; cx.lineWidth = 2; poly(b); cx.stroke();
        });
    }
    function drawGoal(w){
        var g = w.goal; if(!g) return; var tt = S.time;
        cx.save(); cx.translate(g.x, g.y);
        var rg = cx.createRadialGradient(0, 0, 10, 0, 0, Math.max(g.w, g.h) * .8); rg.addColorStop(0, "rgba(255,230,120,.55)"); rg.addColorStop(1, "rgba(255,230,120,0)"); cx.fillStyle = rg; cx.fillRect(-g.w, -g.h, g.w * 2, g.h * 2);
        cx.setLineDash([10, 8]); cx.lineDashOffset = -tt * 20; cx.strokeStyle = "rgba(255,240,150,.95)"; cx.lineWidth = 3; cx.strokeRect(-g.w / 2, -g.h / 2, g.w, g.h); cx.setLineDash([]);
        cx.font = "34px serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText("🚩", 0, -4 + Math.sin(tt * 3) * 3);
        cx.restore();
    }
    function drawLava(w){
        w.lava.forEach(function(l){ var g = cx.createLinearGradient(0, l.y - l.h / 2, 0, l.y + l.h / 2); g.addColorStop(0, "#ffb02e"); g.addColorStop(1, "#c2250e"); cx.fillStyle = g; cx.fillRect(l.x - l.w / 2, l.y - l.h / 2, l.w, l.h);
            cx.fillStyle = "rgba(255,230,120,.7)"; for(var i = 0; i < l.w / 24; i++){ cx.beginPath(); cx.arc(l.x - l.w / 2 + i * 24 + 12, l.y - l.h / 2 + 4 + Math.sin(S.time * 3 + i) * 3, 6, 0, 6.283); cx.fill(); } });
    }
    function drawZone(z){
        cx.save(); cx.translate(z.x, z.y); cx.rotate(z.a * Math.PI / 180); var w = z.w, h = z.h, tt = S.time;
        if(z.kind === "wind"){
            cx.fillStyle = "rgba(220,245,255,.22)"; rr(-w / 2, -h / 2, w, h, 14); cx.fill();
            cx.strokeStyle = "rgba(255,255,255,.85)"; cx.lineWidth = 3; cx.lineCap = "round";
            for(var i = 0; i < 6; i++){ var yy = -h / 2 + (i + .5) * h / 6, off = ((tt * 160 + i * 53) % (w + 60)) - w / 2 - 30; cx.beginPath(); cx.moveTo(off, yy); cx.lineTo(off + 34, yy); cx.stroke(); }
        }else if(z.kind === "water"){
            var g = cx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, "rgba(90,190,255,.55)"); g.addColorStop(1, "rgba(20,90,200,.7)"); cx.fillStyle = g; rr(-w / 2, -h / 2, w, h, 10); cx.fill();
            cx.strokeStyle = "rgba(255,255,255,.8)"; cx.lineWidth = 3; cx.beginPath(); for(var k = -w / 2; k <= w / 2; k += 8){ var wy = -h / 2 + Math.sin(k * .09 + tt * 3) * 3; if(k === -w / 2) cx.moveTo(k, wy); else cx.lineTo(k, wy); } cx.stroke();
        }else if(z.kind === "fire"){
            cx.fillStyle = "rgba(255,140,40,.28)"; rr(-w / 2, -h / 2, w, h, 20); cx.fill();
            cx.font = "34px serif"; cx.textAlign = "center"; cx.textBaseline = "middle";
            for(var f = 0; f < Math.max(1, Math.round(w / 40)); f++){ cx.globalAlpha = .8 + Math.sin(tt * 9 + f) * .2; cx.fillText("🔥", -w / 2 + 22 + f * 40, h / 2 - 22 + Math.sin(tt * 7 + f * 2) * 3); } cx.globalAlpha = 1;
        }else if(z.kind === "float"){
            cx.fillStyle = "rgba(190,170,255,.25)"; rr(-w / 2, -h / 2, w, h, 40); cx.fill(); cx.fillStyle = "rgba(255,255,255,.7)";
            for(var s = 0; s < 14; s++){ var px = ((s * 53) % w) - w / 2, py = h / 2 - ((tt * 30 + s * 41) % h); cx.beginPath(); cx.arc(px, py, 3 + (s % 3), 0, 6.283); cx.fill(); }
        }
        cx.restore();
    }
    function rr(x, y, w, h, r){ cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
    function label(text, w, size, color){
        cx.font = "800 " + size + "px sans-serif"; var m = cx.measureText(text).width; if(m > w - 4 && m > 0){ size = Math.max(8, size * (w - 4) / m); cx.font = "800 " + size + "px sans-serif"; }
        cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.55)"; cx.strokeText(text, 0, 0); cx.fillStyle = color || "#fff"; cx.fillText(text, 0, 0);
    }
    function drawBodyShape(spec, b, ghost){
        // ghost: {x,y,a} で ほんとうの からだが ないとき
        var circle = spec.shape === "circle";
        if(b){ if(circle){ cx.beginPath(); cx.arc(b.position.x, b.position.y, spec.r, 0, 6.283); } else poly(b); }
        else if(circle){ cx.beginPath(); cx.arc(0, 0, spec.r, 0, 6.283); }
        else { rr(-spec.w / 2, -spec.h / 2, spec.w, spec.h, Math.min(8, spec.h / 2)); }
        var col = spec.color || "#ccc"; cx.fillStyle = col; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.45)"; cx.stroke();
        cx.save(); cx.clip(); // ツヤ
        var bb = b ? b.bounds : {min: {x: -spec.w / 2 || -spec.r, y: -spec.h / 2 || -spec.r}, max: {x: spec.w / 2 || spec.r, y: spec.h / 2 || spec.r}};
        var gg = cx.createLinearGradient(0, bb.min.y, 0, bb.max.y); gg.addColorStop(0, "rgba(255,255,255,.45)"); gg.addColorStop(.5, "rgba(255,255,255,0)"); gg.addColorStop(1, "rgba(0,0,0,.2)"); cx.fillStyle = gg; cx.fillRect(bb.min.x - 2, bb.min.y - 2, bb.max.x - bb.min.x + 4, bb.max.y - bb.min.y + 4); cx.restore();
    }
    function drawObj(o){
        var s = o.spec, b = o.body; if(o.removed) return;
        if(o.zone && !b){ drawZone(o.zone); if(!o.locked || true){ var z = o.zone; cx.save(); cx.translate(z.x, z.y); cx.font = "26px serif"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.globalAlpha = .9; var em = D.NMAP[s.noun] ? D.NMAP[s.noun].emoji : "✨"; if(z.kind !== "fire") cx.fillText(em, 0, 0); cx.restore(); } return; }
        if(!b) return;
        var x = b.position.x, y = b.position.y;
        if(s.kind === "swing"){ cx.strokeStyle = "#7a5a3a"; cx.lineWidth = 3; (o.anchors || []).forEach(function(a, i){ var v = b.vertices; var p = i === 0 ? {x: x + (v[0].x - x) * .9, y: y + (v[0].y - y) * .9} : {x: x + (v[1].x - x) * .9, y: y + (v[1].y - y) * .9}; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(p.x, p.y); cx.stroke(); cx.fillStyle = "#444"; cx.beginPath(); cx.arc(a.x, a.y, 5, 0, 6.283); cx.fill(); }); }
        if(s.kind === "seesaw" && o.pivot){ cx.fillStyle = "#6a5a8a"; cx.beginPath(); cx.moveTo(o.pivot.x, o.pivot.y); cx.lineTo(o.pivot.x - 22, o.pivot.y + 40); cx.lineTo(o.pivot.x + 22, o.pivot.y + 40); cx.closePath(); cx.fill(); }
        if(s.kind === "balloon"){ var tc = o.tether; if(tc){ var ax = tc.pointA.x, ay = tc.pointA.y; cx.strokeStyle = "rgba(255,255,255,.8)"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x, y + s.r); cx.quadraticCurveTo(x + Math.sin(S.time * 3) * 6, (y + ay) / 2, ax, ay); cx.stroke(); cx.fillStyle = "#fff"; cx.beginPath(); cx.arc(ax, ay, 4, 0, 6.283); cx.fill(); } else { cx.strokeStyle = "rgba(255,255,255,.6)"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x, y + s.r); cx.quadraticCurveTo(x + Math.sin(S.time * 4) * 6, y + s.r + 14, x, y + s.r + 26); cx.stroke(); } }
        if(s.kind === "rocket" && o.flame){ cx.save(); cx.translate(x, y); cx.rotate(b.angle); cx.fillStyle = "rgba(255,170,40,.9)"; cx.beginPath(); cx.moveTo(-s.w / 2, -8); cx.lineTo(-s.w / 2 - 26 - Math.random() * 16, 0); cx.lineTo(-s.w / 2, 8); cx.fill(); cx.restore(); }
        drawBodyShape(s, b);
        cx.save(); cx.translate(x, y); cx.rotate(b.angle); cx.textAlign = "center"; cx.textBaseline = "middle";
        var em = D.NMAP[s.noun] ? D.NMAP[s.noun].emoji : null, big = s.shape === "circle" ? s.r * 2 : Math.min(s.w, s.h * 2.4);
        if(em && big >= 20){ cx.font = Math.min(38, big * .8) + "px serif"; cx.fillText(em, 0, s.shape === "circle" || s.h > 28 ? -s.h * .1 : 0); }
        if(s.label && (s.generic || s.h >= 14 || s.shape === "circle")){ var ty = em && (s.shape === "circle" ? s.r * .55 : s.h * .3) || 0; cx.translate(0, em ? Math.min(14, ty) : 0); label(s.label, s.shape === "circle" ? s.r * 2 : s.w, s.generic ? 16 : 11); }
        cx.restore();
        if(s.kind === "bomb"){ var left = Math.max(0, (s.fuse - (S.world.steps - o.t0)) / 60); if(S.running || S.mode === "sand"){ cx.fillStyle = "#fff"; cx.font = "800 13px sans-serif"; cx.textAlign = "center"; cx.fillText(left.toFixed(1), x, y - s.r - 8); } cx.fillStyle = "#ffb02e"; cx.beginPath(); cx.arc(x + s.r * .6, y - s.r * .9, 3 + Math.sin(S.time * 20) * 1.5, 0, 6.283); cx.fill(); }
        if(s.kind === "magnet"){ cx.save(); cx.strokeStyle = "rgba(255,90,90,.35)"; cx.lineWidth = 2; cx.setLineDash([6, 8]); cx.lineDashOffset = -S.time * 20; cx.beginPath(); cx.arc(x, y, s.rad * (.5 + .1 * Math.sin(S.time * 3)), 0, 6.283); cx.stroke(); cx.restore(); }
        if(s.kind === "cannon"){ cx.save(); cx.translate(x, y); cx.rotate(b.angle); cx.fillStyle = "#2a3042"; rr(0, -9, s.w / 2 + 14, 18, 6); cx.fill(); cx.restore(); }
        if(s.kind === "fan" && o.zone){ cx.save(); cx.translate(x, y); cx.rotate(S.time * 12); cx.fillStyle = "#cfe3ff"; for(var i = 0; i < 3; i++){ cx.rotate(2.094); cx.beginPath(); cx.ellipse(0, -10, 5, 12, 0, 0, 6.283); cx.fill(); } cx.restore(); drawZone(o.zone); }
        if(o.burn > 4 && (s.burn || s.melt)){ cx.globalAlpha = Math.min(.8, o.burn / 40); cx.font = "22px serif"; cx.textAlign = "center"; cx.fillText("🔥", x, y - 10); cx.globalAlpha = 1; }
        if(S.sel >= 0 && o.pi === S.sel && !S.running){ cx.strokeStyle = "#ffe36a"; cx.lineWidth = 3; cx.setLineDash([6, 5]); var bb = b.bounds; cx.strokeRect(bb.min.x - 5, bb.min.y - 5, bb.max.x - bb.min.x + 10, bb.max.y - bb.min.y + 10); cx.setLineDash([]); }
    }
    function drawStar(w){
        var b = w.star, x = b.position.x, y = b.position.y, tt = S.time;
        cx.save(); cx.translate(x, y); cx.rotate(Math.sin(tt * 2) * .15 + b.velocity.x * .02);
        var rg = cx.createRadialGradient(0, 0, 6, 0, 0, 40); rg.addColorStop(0, "rgba(255,240,140,.65)"); rg.addColorStop(1, "rgba(255,240,140,0)"); cx.fillStyle = rg; cx.fillRect(-44, -44, 88, 88);
        cx.beginPath(); for(var i = 0; i < 10; i++){ var r = i % 2 ? 10 : 22, a = -Math.PI / 2 + i * Math.PI / 5; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath();
        cx.fillStyle = "#ffd93a"; cx.fill(); cx.lineWidth = 3; cx.lineJoin = "round"; cx.strokeStyle = "#c98a00"; cx.stroke();
        cx.fillStyle = "#3a2a00"; var blink = (Math.sin(tt * 1.7) > .97) ? .2 : 1; cx.save(); cx.scale(1, blink); cx.beginPath(); cx.arc(-5.5, -2, 2.4, 0, 6.283); cx.arc(5.5, -2, 2.4, 0, 6.283); cx.fill(); cx.restore();
        cx.strokeStyle = "#3a2a00"; cx.lineWidth = 2; cx.beginPath();
        if(S.result === "lose") cx.arc(0, 8, 4, Math.PI * 1.15, Math.PI * 1.85); else if(S.result === "win" || w.status === "win") cx.arc(0, 2, 5, .15 * Math.PI, .85 * Math.PI); else cx.arc(0, 3, 3.5, .2 * Math.PI, .8 * Math.PI);
        cx.stroke(); cx.restore();
    }
    function drawGhost(){
        var h = S.held; if(!h || !S.ptr.on) return;
        var s = h.spec, x = S.ptr.x, y = S.ptr.y; cx.save(); cx.globalAlpha = .62; cx.translate(x, y); cx.rotate(h.a * Math.PI / 180);
        if(s.shape === "zone"){ drawZone({kind: s.kind, x: 0, y: 0, w: s.w, h: s.h, a: 0, color: s.color}); }
        else{
            drawBodyShape(s, null);
            cx.textAlign = "center"; cx.textBaseline = "middle"; var em = D.NMAP[s.noun] ? D.NMAP[s.noun].emoji : "✨"; cx.font = "28px serif"; cx.fillText(em, 0, -2);
            if(s.kind === "fan"){ var d = s.w / 2 + s.zw / 2; cx.save(); cx.translate(d, 0); drawZone({kind: "wind", x: 0, y: 0, w: s.zw, h: s.zh, a: 0}); cx.restore(); }
            if(s.kind === "cannon"){ cx.fillStyle = "#2a3042"; rr(0, -9, s.w / 2 + 14, 18, 6); cx.fill(); }
        }
        // むきの やじるし
        var dirKinds = {wind: 1, fan: 1, rocket: 1, cannon: 1, bird: 1};
        if(dirKinds[s.kind]){ cx.globalAlpha = .9; cx.strokeStyle = "#fff"; cx.lineWidth = 4; var L2 = Math.max(40, (s.w || s.r * 2) / 2 + 24); cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(L2, 0); cx.lineTo(L2 - 10, -8); cx.moveTo(L2, 0); cx.lineTo(L2 - 10, 8); cx.stroke(); }
        cx.restore();
        if(s.kind === "spring"){ cx.save(); cx.translate(x, y); cx.rotate(h.a * Math.PI / 180); cx.strokeStyle = "#fff"; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(0, -12); cx.lineTo(0, -44); cx.lineTo(-8, -34); cx.moveTo(0, -44); cx.lineTo(8, -34); cx.stroke(); cx.restore(); }
    }
    function drawFx(dt){
        S.fx = S.fx.filter(function(f){
            f.t += dt; if(f.t > .6) return false;
            if(f.k === "ring"){ var p = f.t / .6; cx.save(); cx.globalAlpha = 1 - p; cx.strokeStyle = "#ffcc33"; cx.lineWidth = 6 * (1 - p) + 1; cx.beginPath(); cx.arc(f.x, f.y, f.r + (f.R - f.r) * p, 0, 6.283); cx.stroke(); cx.restore(); }
            return true;
        });
    }
    function draw(dt){
        var w = S.world, st = S.stage; if(!w) return;
        cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, cv.width, cv.height);
        var k = S.dpr * S.scale; cx.setTransform(k, 0, 0, k, S.ox * S.dpr, S.oy * S.dpr);
        cx.save(); cx.beginPath(); cx.rect(0, 0, 960, 540); cx.clip();
        var th = THEMES[((st.world || 1) - 1) % THEMES.length];
        drawBg(th); drawGoal(w); drawLava(w); drawStatics(w, th);
        w.objs.forEach(function(o){ drawObj(o); });
        drawStar(w); drawFx(dt); drawGhost();
        // ステージの わく
        cx.restore();
        cx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // ---------- はじまり ----------
    labels();
    // ことばを きりかえたら もういちど（チャットの せってい）
    window.addEventListener("storage", function(e){ if(e.key === "are_lang") labels(); });
    // 言語ボタン（タイトルの すみ）
    (function(){
        var b = document.createElement("button"); b.type = "button"; b.id = "langBtn"; b.style.cssText = "position:fixed;right:8px;top:calc(48px + env(safe-area-inset-top));z-index:40;padding:5px 10px;font-size:12px;border-radius:999px";
        function lbl(){ b.textContent = "🌐 " + ({ja: "日本語", en: "English", zh: "中文", ko: "한국어"})[GK.lang()]; }
        b.onclick = function(){ var order = ["ja", "en", "zh", "ko"], n = order[(order.indexOf(GK.lang()) + 1) % 4]; GK.LS.set("are_lang", n); lbl(); labels(); GK.sfx("tap"); };
        lbl(); document.body.appendChild(b);
        window.__wcLangBtn = b;
    })();
    requestAnimationFrame(frame);
    window.__wc = {S: S, show: show, openStage: openStage, submitWord: submitWord, place: place, STAGES: STAGES, WC: WC};
    // タイトルでは 言語ボタンだけ見せる
    setInterval(function(){ var b = window.__wcLangBtn; if(b) b.style.display = (S.scr === "play") ? "none" : ""; }, 300);
})();
