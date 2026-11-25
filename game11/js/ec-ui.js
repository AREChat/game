"use strict";
/* こだまの部屋：画面（タイトル・ステージえらび・あそぶ・クリア） */
(function(){
    var $ = function(id){ return document.getElementById(id); };
    var EC = window.EC, LV = window.EC_LEVELS || [], store = GK.save("echo");
    var t = GK.i18n({
        ja: {sub: "きみの うごきが「こだま」に なって、もういちど うごきだす。", stages: "▶ ステージに ちょうせん", how: "📖 あそびかた", note: "ステージの かずは ぜんぶで {n} つ。スマホ・キーボード・ゲームパッドで あそべます。",
            hT: "あそびかた",
            howL: ["きみが うごくと、あとから「こだま」が まったく おなじ うごきを します。", "「🔔 こだまに する」を おすと、いまの うごきが こだまに なって、はじめの 場所から やりなおし。こだまは うごきが おわったら、その場所に とまり つづけます。", "ゆかの スイッチ（1・2・3）を だれかが ふんでいる あいだだけ、おなじ 番号の とびらが あきます。", "とびらは、その手の はじめに スイッチが ふまれていないと とおれません。「⏸ まつ」で ちょうど いい タイミングを はかろう。", "⭐ に ついたら クリア！ こだまの かずは ステージごとに きまっています。"],
            back: "← もどる", selT: "ステージを えらぼう", stage: "ステージ", round: "ラウンド {n}", echoes: "こだま {a}／{b}", moves: "{n}手", par: "さいたん", lock: "まえの ステージを クリアすると あきます",
            echoBtn: "🔔 こだまに する", wait: "⏸ まつ", undo: "↩ ひとつ もどす", round1: "↺ このラウンドを やりなおす", resetAll: "⟲ さいしょから",
            resetAsk: "もういちど おすと、こだまも ぜんぶ きえて さいしょからです", noMove: "まず 1手 うごいてから おしてね", noEcho: "もう こだまは つくれません。いまの ラウンドで ゴールへ！", tooLong: "ながすぎます。「こだまに する」か「もどす」を つかおう", blocked: "とびらが しまっています！ まって みよう",
            clear: "クリア！", perfect: "パーフェクト！", clB: "ぜんぶで {n}手（さいたん {p}手）", next: "▶ つぎへ", retry: "もういちど", list: "いちらん", best: "ベスト",
            tip7: "ここから こだまを 2つ つくれます。1つめを おいてから、2つめを つくろう。", tip1: "まず スイッチの 上に のって、「こだまに する」を おそう。", tip2: "こだまが スイッチに つくまで、とびらの 前で「まつ」。",
            sw: "スイッチ", dr: "とびら", gl: "ゴール"},
        en: {sub: "Your moves become an \"echo\" that plays them back again.", stages: "▶ Play stages", how: "📖 How to play", note: "{n} stages in all. Works with touch, keyboard and gamepad.",
            hT: "How to play",
            howL: ["When you move, an \"echo\" later repeats exactly the same moves.", "Press \"🔔 Make echo\" to turn your moves into an echo and start over from the beginning. When its moves end, the echo keeps standing where it stopped.", "A door opens only while someone stands on the switch with the same number (1, 2, 3).", "You can only enter a door if its switch was pressed at the start of that step. Use \"⏸ Wait\" to get the timing right.", "Reach the ⭐ to clear the stage! Each stage allows a set number of echoes."],
            back: "← Back", selT: "Choose a stage", stage: "Stage", round: "Round {n}", echoes: "Echoes {a}/{b}", moves: "{n} moves", par: "Best", lock: "Clear the previous stage to unlock",
            echoBtn: "🔔 Make echo", wait: "⏸ Wait", undo: "↩ Undo", round1: "↺ Redo this round", resetAll: "⟲ Start over",
            resetAsk: "Press again to erase every echo and start over", noMove: "Make at least one move first", noEcho: "No echoes left. Head for the goal in this round!", tooLong: "Too long. Use \"Make echo\" or undo", blocked: "The door is shut! Try waiting",
            clear: "Clear!", perfect: "Perfect!", clB: "{n} moves in all (best {p})", next: "▶ Next", retry: "Retry", list: "List", best: "Best",
            tip7: "From here you can make two echoes. Place the first, then make the second.", tip1: "Step on the switch, then press \"Make echo\".", tip2: "Wait in front of the door until the echo reaches the switch.",
            sw: "Switch", dr: "Door", gl: "Goal"},
        zh: {sub: "你的动作会变成“回声”，再重复一遍。", stages: "▶ 挑战关卡", how: "📖 玩法", note: "共 {n} 个关卡。可用触屏、键盘和手柄游玩。",
            hT: "玩法",
            howL: ["你移动之后，“回声”会稍后做出一模一样的动作。", "按下“🔔 制作回声”，当前的动作就变成回声，并从起点重新开始。回声的动作结束后，会一直停在原地。", "只有当有人站在同编号的开关（1、2、3）上时，同编号的门才会打开。", "每一步开始时开关必须已被踩住，才能进门。用“⏸ 等待”来把握时机。", "到达 ⭐ 就过关！每个关卡的回声数量是固定的。"],
            back: "← 返回", selT: "选择关卡", stage: "关卡", round: "第 {n} 轮", echoes: "回声 {a}/{b}", moves: "{n} 步", par: "最少", lock: "通过上一关后解锁",
            echoBtn: "🔔 制作回声", wait: "⏸ 等待", undo: "↩ 撤销", round1: "↺ 重来本轮", resetAll: "⟲ 全部重来",
            resetAsk: "再按一次，所有回声都会消失并重新开始", noMove: "请先走一步", noEcho: "回声用完了。这一轮直接去终点吧！", tooLong: "太长了。请用“制作回声”或撤销", blocked: "门关着！试试等待",
            clear: "过关！", perfect: "完美！", clB: "共 {n} 步（最少 {p} 步）", next: "▶ 下一关", retry: "再来一次", list: "列表", best: "最佳",
            tip7: "从这里开始可以制作两个回声。先放第一个，再做第二个。", tip1: "先站到开关上，再按“制作回声”。", tip2: "在门前等待，直到回声走到开关上。",
            sw: "开关", dr: "门", gl: "终点"},
        ko: {sub: "내 움직임이 \"메아리\"가 되어 다시 움직여요.", stages: "▶ 스테이지 도전", how: "📖 방법", note: "스테이지는 모두 {n}개. 터치, 키보드, 게임패드로 즐길 수 있어요.",
            hT: "방법",
            howL: ["내가 움직이면 잠시 뒤 \"메아리\"가 똑같이 움직여요.", "\"🔔 메아리 만들기\"를 누르면 지금의 움직임이 메아리가 되고 처음 자리에서 다시 시작해요. 메아리는 움직임이 끝나면 그 자리에 계속 서 있어요.", "같은 번호의 스위치(1, 2, 3)를 누군가 밟고 있는 동안에만 같은 번호의 문이 열려요.", "그 걸음이 시작될 때 스위치가 눌려 있어야 문을 지날 수 있어요. \"⏸ 기다리기\"로 타이밍을 맞춰요.", "⭐에 도착하면 클리어! 메아리의 수는 스테이지마다 정해져 있어요."],
            back: "← 돌아가기", selT: "스테이지 선택", stage: "스테이지", round: "라운드 {n}", echoes: "메아리 {a}/{b}", moves: "{n}수", par: "최소", lock: "앞 스테이지를 클리어하면 열려요",
            echoBtn: "🔔 메아리 만들기", wait: "⏸ 기다리기", undo: "↩ 되돌리기", round1: "↺ 이번 라운드 다시", resetAll: "⟲ 처음부터",
            resetAsk: "한 번 더 누르면 메아리가 모두 사라지고 처음부터 시작해요", noMove: "먼저 한 칸 움직여 주세요", noEcho: "메아리를 더 만들 수 없어요. 이번 라운드에서 골로!", tooLong: "너무 길어요. \"메아리 만들기\"나 되돌리기를 써요", blocked: "문이 닫혀 있어요! 기다려 보세요",
            clear: "클리어!", perfect: "퍼펙트!", clB: "모두 {n}수 (최소 {p}수)", next: "▶ 다음", retry: "다시", list: "목록", best: "베스트",
            tip7: "여기부터는 메아리를 두 개 만들 수 있어요. 첫 번째를 두고 두 번째를 만들어요.", tip1: "스위치 위에 올라간 뒤 \"메아리 만들기\"를 눌러요.", tip2: "메아리가 스위치에 닿을 때까지 문 앞에서 기다려요.",
            sw: "스위치", dr: "문", gl: "골"}
    });
    var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); };
    var cv = $("cv"), ctx = cv.getContext("2d");
    var PLC = {1: "#ff6b8b", 2: "#5ad8ff", 3: "#ffd35a"}, ECC = ["#9db4ff", "#ff9fd0", "#9bf2a8"];
    var S = {scr: "title", idx: 0, L: null, G: null, won: false, anim: null, dirty: true, resetArm: -1e9, sim: null};
    var raf = 0;

    function toast(m, ms){ var e = $("toast"); e.textContent = m; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1800); }
    function msg(m, ms){ var e = $("msg"); e.textContent = m; e.classList.add("on"); clearTimeout(msg._t); msg._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1900); }
    function best(i){ var v = Math.floor(+store.get("s" + (i + 1), 0)); return v >= 1 ? Math.min(3, v) : 0; }   // こわれた 値（文字・マイナス・3より大きい）は 0〜3 に そろえる
    function unlocked(i){ return i === 0 || best(i - 1) > 0 || (i > 1 && best(i - 2) > 0); }

    function show(id){
        S.scr = id; ["title", "how", "sel", "play"].forEach(function(k){ $("s-" + k).classList.toggle("on", k === id); });
        $("lgBtn").style.display = id === "play" ? "none" : "";
        document.documentElement.lang = GK.lang(); applyText();
        if(window.GKI) GKI.mode(id === "play" ? "keys" : "menu");
        if(id === "play"){ resize(); S.dirty = true; }
    }
    function applyText(){
        $("tSub").textContent = t("sub"); $("bStages").textContent = t("stages"); $("bHow").textContent = t("how"); $("tNote").textContent = t("note", {n: LV.length});
        $("hT").textContent = t("hT"); $("hBody").innerHTML = t("howL").map(function(x){ return "<p>" + esc(x) + "</p>"; }).join("");
        $("bHowBack").textContent = t("back"); $("bSelBack").textContent = t("back"); $("selT").textContent = t("selT");
        $("exitBtn").textContent = t("back"); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊";
        $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[GK.lang()];
        $("bEcho").textContent = t("echoBtn"); $("bWait").textContent = t("wait"); $("bUndo").textContent = t("undo"); $("bRound").textContent = t("round1"); $("bReset").textContent = t("resetAll");
        $("clNext").textContent = t("next"); $("clRetry").textContent = t("retry"); $("clSel").textContent = t("list");
        if(S.scr === "sel"){
            $("levels").innerHTML = LV.map(function(l, i){
                var st = best(i), lock = !unlocked(i);
                return '<button type="button" class="lv' + (lock ? " lock" : "") + '" data-n="' + i + '" aria-label="' + esc(t("stage")) + " " + (i + 1) + '">' + (i + 1) + '<small>' + (st ? "★★★".slice(0, st) : "") + '</small></button>';
            }).join("");
        }
        if(S.scr === "play") updateBar();
    }

    // ---- ステージを ひらく ----
    function openLevel(i){
        if(i < 0 || i >= LV.length) return;
        S.idx = i; S.L = EC.parse(LV[i]); S.G = new EC.Game(S.L); S.won = false; S.anim = null; S.resetArm = -1e9;
        $("mClear").classList.remove("on");
        show("play"); GK.bgm("calm"); update(); resize();
        var tip = t("tip" + (i + 1)); if(tip && tip !== "tip" + (i + 1)) msg(tip, 4200);
    }
    function update(){ S.sim = S.G.sim(); S.dirty = true; updateBar(); }
    function updateBar(){
        if(!S.G) return;
        $("nm").textContent = t("stage") + " " + (S.idx + 1);
        $("rd").textContent = t("round", {n: S.G.recs.length + 1});
        var left = S.L.echoes - S.G.recs.length;
        $("mv").textContent = t("echoes", {a: left, b: S.L.echoes}) + " ・ " + t("moves", {n: S.G.total()});
        $("rd").classList.toggle("good", S.G.recs.length === S.L.echoes);
        $("bEcho").disabled = !S.G.canEcho();
        $("bUndo").disabled = !(S.G.cur.length || S.G.recs.length);
        $("bRound").disabled = !S.G.cur.length;
        $("bReset").disabled = !(S.G.cur.length || S.G.recs.length);
    }

    // ---- そうさ ----
    function doMove(c){
        if(S.scr !== "play" || S.won || !S.G) return;
        var prevSim = S.sim, before = S.G.cur.length;
        if(S.G.cur.length >= EC.MAXT){ msg(t("tooLong"), 2200); GK.sfx("ng"); return; }
        if(!S.G.move(c)){ GK.sfx("ng"); return; }
        var eff = S.G.cur.charAt(S.G.cur.length - 1);
        S.anim = {from: {hero: prevSim.now.hero, echoes: prevSim.now.echoes}, t0: performance.now()};
        update(); S.resetArm = -1e9;
        if(c !== "W" && eff === "W"){ GK.sfx("ng"); GK.vibrate(25); GK.shake(cv, 160); msg(t("blocked"), 1300); }
        else GK.sfx("tap");
        if(S.sim.won) win();
    }
    function makeEcho(){
        if(S.scr !== "play" || S.won) return;
        if(!S.G.canEcho()){ msg(S.G.recs.length >= S.L.echoes ? t("noEcho") : t("noMove"), 2200); GK.sfx("ng"); return; }
        S.G.echo(); S.anim = null; update(); GK.sfx("coin"); GK.vibrate(30);
    }
    function undo(){
        if(S.scr !== "play" || S.won) return;
        var ok = S.G.cur.length ? S.G.undo() : S.G.undoEcho();
        if(!ok){ GK.sfx("ng"); return; }
        S.anim = null; update(); GK.sfx("pop");
    }
    function redoRound(){ if(S.scr !== "play" || S.won || !S.G.cur.length){ GK.sfx("ng"); return; } S.G.redoRound(); S.anim = null; update(); GK.sfx("pop"); }
    function resetAll(){
        if(S.scr !== "play" || S.won) return;
        if(!S.G.recs.length && !S.G.cur.length){ GK.sfx("ng"); return; }
        var now = performance.now();
        if(S.G.recs.length && now - S.resetArm > 2600){ S.resetArm = now; msg(t("resetAsk"), 2400); GK.sfx("tap"); return; }   // こだまが きえる ときは 2かい おしてもらう（まちがいぼうし）
        S.G.reset(); S.anim = null; S.resetArm = -1e9; update(); GK.sfx("pop");
    }
    function win(){
        S.won = true; GK.sfx("win"); GK.confetti(); GK.vibrate(60);
        var total = S.G.total(), par = S.L.def.par || total, st = total <= par ? 3 : total <= par + 4 ? 2 : 1;
        if(st > best(S.idx)) store.set("s" + (S.idx + 1), st);
        setTimeout(function(){
            if(S.scr !== "play") return;
            $("clT").textContent = st === 3 ? t("perfect") : t("clear");
            $("clStars").textContent = "★★★".slice(0, st) + "☆☆☆".slice(0, 3 - st);
            $("clB").textContent = t("clB", {n: total, p: par});
            $("clNext").style.display = S.idx < LV.length - 1 ? "" : "none";
            $("mClear").classList.add("on");
        }, 650);
    }

    // ---- えがく ----
    function resize(){
        var r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr)); S.dpr = dpr; S.dirty = true;
    }
    function lerp(a, b, k){ return a + (b - a) * k; }
    function eyes(x, y, r, col){ ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - r * .32, y - r * .12, r * .13, 0, 6.3); ctx.arc(x + r * .32, y - r * .12, r * .13, 0, 6.3); ctx.fill(); }
    function draw(now){
        var W = cv.width, H = cv.height, L = S.L, G = S.G;
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
        if(!L || !G || !S.sim) return false;
        var cs = Math.floor(Math.min(W * .96 / L.w, H * .96 / L.h)), ox = Math.floor((W - cs * L.w) / 2), oy = Math.floor((H - cs * L.h) / 2);
        var sim = S.sim, open = sim.now.open, x, y, i, k = 1;
        var animating = false;
        if(S.anim){ k = Math.min(1, (now - S.anim.t0) / 130); animating = k < 1; if(!animating) S.anim = null; }
        for(y = 0; y < L.h; y++) for(x = 0; x < L.w; x++){
            var px = ox + x * cs, py = oy + y * cs;
            if(L.wall[y][x]){ ctx.fillStyle = "#0a0a28"; ctx.fillRect(px, py, cs, cs); ctx.strokeStyle = "#3a3f9a"; ctx.lineWidth = Math.max(1, cs * .04); ctx.strokeRect(px + 1, py + 1, cs - 2, cs - 2); continue; }
            ctx.fillStyle = (x + y) % 2 ? "#1a1e5c" : "#161a52"; ctx.fillRect(px, py, cs, cs);
        }
        // スタート・ゴール
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.strokeStyle = "#8a8fff"; ctx.lineWidth = Math.max(1, cs * .05); ctx.setLineDash([cs * .12, cs * .1]);
        ctx.beginPath(); ctx.arc(ox + (L.start.x + .5) * cs, oy + (L.start.y + .5) * cs, cs * .36, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = Math.floor(cs * .66) + "px sans-serif"; ctx.fillStyle = "#fff";
        ctx.fillText("⭐", ox + (L.goal.x + .5) * cs, oy + (L.goal.y + .54) * cs);
        // スイッチ
        L.plates.forEach(function(p){
            var cx = ox + (p.x + .5) * cs, cy = oy + (p.y + .5) * cs, on = !!open[p.id], c = PLC[p.id];
            ctx.beginPath(); ctx.arc(cx, cy, cs * .34, 0, 6.3); ctx.fillStyle = on ? c : "rgba(0,0,0,.35)"; ctx.fill();
            ctx.lineWidth = Math.max(2, cs * .07); ctx.strokeStyle = c; ctx.stroke();
            ctx.fillStyle = on ? "#10103a" : c; ctx.font = "900 " + Math.floor(cs * .36) + "px sans-serif"; ctx.fillText(String(p.id), cx, cy + cs * .02);
        });
        // とびら
        L.doors.forEach(function(d){
            var px = ox + d.x * cs, py = oy + d.y * cs, on = !!open[d.id], c = PLC[d.id], m = cs * .08;
            if(on){ ctx.setLineDash([cs * .12, cs * .1]); ctx.lineWidth = Math.max(2, cs * .06); ctx.strokeStyle = c; ctx.strokeRect(px + m, py + m, cs - m * 2, cs - m * 2); ctx.setLineDash([]); }
            else { ctx.fillStyle = c; ctx.fillRect(px + m, py + m, cs - m * 2, cs - m * 2); ctx.fillStyle = "rgba(10,10,40,.55)"; for(var b = 1; b < 4; b++) ctx.fillRect(px + m, py + m + (cs - m * 2) * b / 4 - 1, cs - m * 2, 3); }
            ctx.fillStyle = on ? c : "#10103a"; ctx.font = "900 " + Math.floor(cs * .34) + "px sans-serif"; ctx.fillText(String(d.id), px + cs / 2, py + cs / 2 + cs * .02);
        });
        // こだま（あしあと → からだ）
        function trail(list, col){
            if(list.length < 2) return; ctx.strokeStyle = col; ctx.globalAlpha = .28; ctx.lineWidth = Math.max(2, cs * .09); ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
            for(var j = 0; j < list.length; j++){ var qx = ox + (list[j].x + .5) * cs, qy = oy + (list[j].y + .5) * cs; if(j) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); }
            ctx.stroke(); ctx.globalAlpha = 1;
        }
        for(i = 0; i < sim.echoes.length; i++) trail(sim.echoes[i], ECC[i % 3]);
        trail(sim.hero, "#ffe36a");
        function body(pos, from, col, label, hero){
            var fx = from ? lerp(from.x, pos.x, k) : pos.x, fy = from ? lerp(from.y, pos.y, k) : pos.y;
            var cx = ox + (fx + .5) * cs, cy = oy + (fy + .5) * cs, r = cs * (hero ? .34 : .3);
            ctx.globalAlpha = hero ? 1 : .8;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fillStyle = col; ctx.fill();
            ctx.lineWidth = Math.max(2, cs * .06); ctx.strokeStyle = hero ? "#fff" : "rgba(255,255,255,.7)"; if(!hero) ctx.setLineDash([cs * .1, cs * .07]); ctx.stroke(); ctx.setLineDash([]);
            ctx.globalAlpha = 1; eyes(cx, cy, r, "#10103a");
            if(label){ ctx.fillStyle = "#10103a"; ctx.font = "900 " + Math.floor(cs * .26) + "px sans-serif"; ctx.fillText(label, cx, cy + r * .5); }
        }
        for(i = 0; i < sim.now.echoes.length; i++) body(sim.now.echoes[i], S.anim && S.anim.from.echoes[i], ECC[i % 3], String(i + 1), false);
        body(sim.now.hero, S.anim && S.anim.from.hero, "#ffe36a", "", true);
        return animating;
    }
    function loop(now){
        raf = requestAnimationFrame(loop);
        if(S.scr !== "play"){ return; }
        if(!S.dirty && !S.anim) return;
        try{ S.dirty = !!draw(now); if(S.anim) S.dirty = true; }catch(e){ console.error(e); S.dirty = false; }
    }

    // ---- つなぐ ----
    if(window.GKI){
        GKI.defaults({a: ["Enter", " "], b: ["Backspace", "z", "u"], x: ["x", "."], y: ["r", "y"], plus: ["Escape", "p"]});
        GKI.legend([{k: "dpad", t: {ja: "うごく（しゃめん スワイプも OK）", en: "Move (swipe also works)", zh: "移动（也可滑动）", ko: "이동 (스와이프도 가능)"}},
            {k: "a", t: {ja: "こだまに する", en: "Make echo", zh: "制作回声", ko: "메아리 만들기"}}, {k: "x", t: {ja: "まつ", en: "Wait", zh: "等待", ko: "기다리기"}},
            {k: "b", t: {ja: "ひとつ もどす", en: "Undo", zh: "撤销", ko: "되돌리기"}}, {k: "y", t: {ja: "さいしょから（2かい おす）", en: "Start over (press twice)", zh: "全部重来（按两次）", ko: "처음부터 (두 번)"}},
            {k: "plus", t: {ja: "ステージえらびに もどる", en: "Back to stage list", zh: "返回关卡列表", ko: "스테이지 목록으로"}}]);
        GKI.on(function(a, down){
            if(!down || S.scr !== "play" || $("mClear").classList.contains("on")) return;
            if(a === "up") doMove("U"); else if(a === "right") doMove("R"); else if(a === "down") doMove("D"); else if(a === "left") doMove("L");
            else if(a === "a") makeEcho(); else if(a === "x") doMove("W"); else if(a === "b") undo(); else if(a === "y") resetAll();
            else if(a === "plus"){ GK.bgm("off"); show("sel"); }
        });
        GKI.onBack(function(){ if(S.scr !== "title") $("exitBtn").click(); });
    }
    window.addEventListener("keydown", function(e){
        if(e.key === "Enter" && $("mClear").classList.contains("on")){ e.preventDefault(); if($("clNext").style.display !== "none") $("clNext").click(); else $("clRetry").click(); }
    });
    var sw = null;
    cv.addEventListener("pointerdown", function(e){ sw = {x: e.clientX, y: e.clientY, id: e.pointerId}; });
    cv.addEventListener("pointercancel", function(){ sw = null; });
    cv.addEventListener("pointerup", function(e){
        if(!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
        if(Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
        doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : (dy > 0 ? "D" : "U"));
    });
    $("dpad").addEventListener("pointerdown", function(e){ var b = e.target.closest("button"); if(!b) return; e.preventDefault(); doMove(b.dataset.c); });
    // ボタンを おしたあと、フォーカスを はずす（そのあとの Enter・Space が、おなじボタンを もういちど おさないように）
    function B(fn){ return function(){ try{ this.blur(); }catch(_e){} fn(); }; }
    $("bEcho").onclick = B(makeEcho); $("bWait").onclick = B(function(){ doMove("W"); }); $("bUndo").onclick = B(undo); $("bRound").onclick = B(redoRound); $("bReset").onclick = B(resetAll);
    $("bStages").onclick = function(){ show("sel"); }; $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = $("bSelBack").onclick = function(){ show("title"); };
    $("levels").addEventListener("click", function(e){ var b = e.target.closest("button"); if(!b || b.classList.contains("lock")) return; openLevel(+b.dataset.n); });
    $("clNext").onclick = function(){ if(S.idx < LV.length - 1) openLevel(S.idx + 1); };
    $("clRetry").onclick = function(){ openLevel(S.idx); };
    $("clSel").onclick = function(){ $("mClear").classList.remove("on"); GK.bgm("off"); show("sel"); };
    $("exitBtn").onclick = function(){
        if(S.scr === "play"){ GK.bgm("off"); $("mClear").classList.remove("on"); show("sel"); return; }
        if(S.scr !== "title"){ show("title"); return; }
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "./index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()){ GK.sfx("ok"); if(S.scr === "play") GK.bgm("calm"); } };
    $("lgBtn").onclick = function(){ var order = ["ja", "en", "zh", "ko"], i = order.indexOf(GK.lang()); GK.LS.set("are_lang", order[(i + 1) % 4]); show(S.scr); };
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
    window.__ec = {S: S, EC: EC, openLevel: openLevel, doMove: doMove, makeEcho: makeEcho, undo: undo, show: show, LV: LV, redoRound: redoRound, resetAll: resetAll};
    raf = requestAnimationFrame(loop);
    show("title");
})();
