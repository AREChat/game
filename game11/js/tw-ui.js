"use strict";
/* ふたごの世界：画面（タイトル・ステージえらび・あそぶ・クリア） */
(function(){
    var $ = function(id){ return document.getElementById(id); };
    var TW = window.TW, LV = window.TW_LEVELS || [], store = GK.save("twins");
    var t = GK.i18n({
        ja: {sub: "かがみあわせの ふたつの せかいを、ひとつの ボタンで いっしょに うごかそう。", stages: "▶ ステージに ちょうせん", daily: "📅 きょうの パズル", how: "📖 あそびかた", note: "120ステージ＋まいにち あたらしい パズル。進み具合は この端末に 記録されます。",
            hT: "あそびかた", howL: ["ふたごは 1つの ボタンで いっしょに うごきます。", "ただし せかいによっては ボタンと ぎゃくむきに うごくことも！ ボードの すみの 小さな 十字が「どの ボタンで どっちに うごくか」を おしえてくれます。", "ふたりとも ゴールの ☆ に のれば クリア！ 同時に のるのが ポイント。", "くろい あな（×）に おちると ミス。 かべや はこが ひとりだけを とめることも あります。", "はこ（▣）は おせます。 スイッチ（◎）に のると、「あいての せかい」の とびらが ひらきます（はこを のせても OK）。", "↩ で ひとつ もどせます。 💡 で つぎの 一手を おしえます。"],
            back: "← もどる", selT: "ステージを えらぼう", moves: "手数", par: "さいたん", stage: "ステージ", dailyName: "きょうの パズル", fell: "おっこちた！", stuck: "つんだ かも… ↩ で もどろう", hintNo: "ここからは むずかしそう… ↩ で もどろう", hint: "💡 つぎは {a}", already: "もう ゴールに います", undo: "↩ もどす", reset: "⟲ やりなおし", hintBtn: "💡 ヒント",
            clear: "クリア！", clB: "{n}手で ゴール（さいたん {p}手）", perfect: "パーフェクト！", next: "▶ つぎへ", retry: "もういちど", list: "いちらん", lock: "まえの ステージを クリアすると ひらきます", best: "ベスト", mA: "ひかりの せかい", mB: "かげの せかい",
            w1: "① はじまりの かがみ", w2: "② おとしあなの へや", w3: "③ はこの へや", w4: "④ くるくる きょうめい", w5: "⑤ スイッチと とびら", w6: "⑥ ふたごの きわみ", wd: "きょうの パズル",
            same: "そのまま", mirror: "左右 ぎゃく", flip: "上下 ぎゃく", inv: "ぜんぶ ぎゃく", rot: "右に 90°", rotc: "左に 90°"},
        en: {sub: "Move two mirrored worlds at once with a single set of buttons.", stages: "▶ Play stages", daily: "📅 Daily puzzle", how: "📖 How to play", note: "120 stages + a new puzzle every day. Progress is saved on this device.",
            hT: "How to play", howL: ["Both twins move together with one set of buttons.", "But some worlds reverse the buttons! The small cross in each board's corner shows which button moves which way.", "Get both twins onto their goal ☆ at the same time.", "Black pits (×) mean a miss. Walls and crates may stop only one twin.", "Crates (▣) can be pushed. Standing on a switch (◎) opens the doors in the OTHER world (a crate on it works too).", "↩ undoes a move. 💡 shows the next move."],
            back: "← Back", selT: "Choose a stage", moves: "Moves", par: "Best", stage: "Stage", dailyName: "Daily puzzle", fell: "Fell in!", stuck: "Stuck? Press ↩ to go back", hintNo: "That looks stuck… press ↩", hint: "💡 Next: {a}", already: "Already on the goal", undo: "↩ Undo", reset: "⟲ Reset", hintBtn: "💡 Hint",
            clear: "Clear!", clB: "Goal in {n} moves (best {p})", perfect: "Perfect!", next: "▶ Next", retry: "Retry", list: "List", lock: "Clear earlier stages to unlock", best: "Best", mA: "World of Light", mB: "World of Shadow",
            w1: "1 · First Mirror", w2: "2 · Pit Rooms", w3: "3 · Crate Rooms", w4: "4 · Twisting Mirrors", w5: "5 · Switches & Doors", w6: "6 · Twin Mastery", wd: "Daily puzzle",
            same: "Same", mirror: "Left/Right flipped", flip: "Up/Down flipped", inv: "All flipped", rot: "Turned right 90°", rotc: "Turned left 90°"},
        zh: {sub: "用同一组按键，同时操控两个镜像世界。", stages: "▶ 挑战关卡", daily: "📅 每日谜题", how: "📖 玩法", note: "120 个关卡＋每天一道新谜题。进度保存在本设备。",
            hT: "玩法", howL: ["双胞胎用同一组按键一起移动。", "有些世界会让按键反方向！棋盘角落的小十字会告诉你每个按键往哪边走。", "让两个人同时站到终点 ☆ 上就过关。", "掉进黑洞（×）就失败。墙和箱子可能只挡住其中一个人。", "箱子（▣）可以推。站在开关（◎）上，会打开「另一个世界」的门（放箱子也可以）。", "↩ 撤销一步，💡 提示下一步。"],
            back: "← 返回", selT: "选择关卡", moves: "步数", par: "最少", stage: "关卡", dailyName: "每日谜题", fell: "掉下去了！", stuck: "卡住了？按 ↩ 退回", hintNo: "好像卡住了… 按 ↩", hint: "💡 下一步：{a}", already: "已经在终点了", undo: "↩ 撤销", reset: "⟲ 重来", hintBtn: "💡 提示",
            clear: "过关！", clB: "{n} 步到达（最少 {p} 步）", perfect: "完美！", next: "▶ 下一关", retry: "再来一次", list: "列表", lock: "通过前面的关卡后解锁", best: "最佳", mA: "光之世界", mB: "影之世界",
            w1: "① 最初的镜子", w2: "② 陷阱之间", w3: "③ 箱子之间", w4: "④ 旋转的镜子", w5: "⑤ 开关与门", w6: "⑥ 双生极境", wd: "每日谜题",
            same: "原样", mirror: "左右相反", flip: "上下相反", inv: "全部相反", rot: "向右转90°", rotc: "向左转90°"},
        ko: {sub: "하나의 버튼으로 거울처럼 마주한 두 세계를 동시에 움직여요.", stages: "▶ 스테이지 도전", daily: "📅 오늘의 퍼즐", how: "📖 방법", note: "120 스테이지 + 매일 새로운 퍼즐. 진행 상황은 이 기기에 저장돼요.",
            hT: "방법", howL: ["쌍둥이는 하나의 버튼으로 함께 움직여요.", "세계에 따라 버튼이 반대로 움직이기도 해요! 보드 모서리의 작은 십자가 어떤 버튼이 어느 쪽인지 알려줘요.", "두 명 모두 골 ☆ 에 동시에 서면 클리어!", "검은 구멍(×)에 빠지면 실패. 벽이나 상자가 한 명만 막을 수도 있어요.", "상자(▣)는 밀 수 있어요. 스위치(◎)에 서면 \"다른 세계\"의 문이 열려요 (상자를 올려도 돼요).", "↩ 로 한 수 되돌리고, 💡 로 다음 수를 알려줘요."],
            back: "← 돌아가기", selT: "스테이지 선택", moves: "횟수", par: "최소", stage: "스테이지", dailyName: "오늘의 퍼즐", fell: "빠졌어요!", stuck: "막힌 것 같아요… ↩ 로 되돌려요", hintNo: "막힌 것 같아요… ↩", hint: "💡 다음: {a}", already: "이미 골에 있어요", undo: "↩ 되돌리기", reset: "⟲ 다시", hintBtn: "💡 힌트",
            clear: "클리어!", clB: "{n}수에 골 (최소 {p}수)", perfect: "퍼펙트!", next: "▶ 다음", retry: "다시", list: "목록", lock: "앞 스테이지를 클리어하면 열려요", best: "최고", mA: "빛의 세계", mB: "그림자의 세계",
            w1: "① 첫 번째 거울", w2: "② 함정 방", w3: "③ 상자 방", w4: "④ 빙글빙글 거울", w5: "⑤ 스위치와 문", w6: "⑥ 쌍둥이의 극치", wd: "오늘의 퍼즐",
            same: "그대로", mirror: "좌우 반대", flip: "상하 반대", inv: "모두 반대", rot: "오른쪽 90°", rotc: "왼쪽 90°"}
    });
    var ARROWS = ["↑", "→", "↓", "←"];
    var S = {scr: "title", L: null, s: null, hist: [], moves: 0, n: 0, daily: false, lock: false, won: false, hintDir: -1, vis: null, facing: [1, 1], t0: 0, dead: null, parts: [], stuckChecked: false};
    var cv = $("cv"), g2 = cv.getContext("2d"), DPR = 1, CW = 0, CH = 0, raf = 0, last = 0;
    var COL = {A: {tile: "#1d3a63", tile2: "#234875", wall: "#0b1830", wallTop: "#3f6fb0", av: "#59c8ff", glow: "#7ae6ff", bg: "#0c1a36"}, B: {tile: "#4a1f58", tile2: "#582767", wall: "#210a2c", wallTop: "#a655c8", av: "#ff7ac8", glow: "#ffa6e0", bg: "#240d36"}};

    function toast(msg, ms){ var e = $("toast"); e.textContent = msg; e.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1800); }
    function msg(m, ms){ var e = $("msg"); e.textContent = m; e.classList.add("on"); clearTimeout(msg._t); msg._t = setTimeout(function(){ e.classList.remove("on"); }, ms || 1700); }
    function show(id){
        S.scr = id; ["title", "how", "sel", "play"].forEach(function(k){ $("s-" + k).classList.toggle("on", k === id); }); $("lgBtn").style.display = id === "play" ? "none" : "";
        document.documentElement.lang = GK.lang(); applyText();
        if(id === "sel") buildLevels();
        if(window.GKI) GKI.mode(id === "play" ? "keys" : "menu");
    }
    function applyText(){
        $("tSub").textContent = t("sub"); $("bStages").textContent = t("stages"); $("bDaily").textContent = t("daily"); $("bHow").textContent = t("how"); $("tNote").textContent = t("note");
        var l = GK.lang(); $("hT").textContent = t("hT"); $("hBody").innerHTML = t("howL").map(function(x){ return "<p>" + esc(x) + "</p>"; }).join("");
        $("bHowBack").textContent = t("back"); $("selT").textContent = t("selT"); $("bSelBack").textContent = t("back");
        $("bUndo").textContent = t("undo"); $("bReset").textContent = t("reset"); $("bHint").textContent = t("hintBtn");
        $("clNext").textContent = t("next"); $("clRetry").textContent = t("retry"); $("clSel").textContent = t("list");
        $("exitBtn").textContent = t("back"); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊";
        $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[l];
        if(S.L) updateBar();
    }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }

    // ---- ステージえらび ----
    function maxCleared(){ var m = 0; for(var i = 1; i <= LV.length; i++) if(store.get("s" + i, 0) > 0) m = i; return m; }
    function buildLevels(){
        var h = "", mc = maxCleared(), worlds = [1, 2, 3, 4, 5, 6];
        worlds.forEach(function(w){
            var list = LV.filter(function(l){ return l.world === w; }); if(!list.length) return;
            h += '<div class="wh">' + esc(t("w" + w)) + '</div><div class="wg">' + list.map(function(l){
                var st = store.get("s" + l.n, 0), lock = l.n > mc + 4;
                return '<button type="button" class="lv' + (lock ? " lock" : "") + '" data-n="' + l.n + '">' + l.n + '<small>' + (st ? "★★★".slice(0, st) : "") + '</small></button>';
            }).join("") + "</div>";
        });
        $("levels").innerHTML = h;
    }

    // ---- ステージ開始 ----
    function openLevel(L, n, daily){
        S.L = L; S.n = n; S.daily = !!daily; S.s = TW.startState(L); S.hist = []; S.moves = 0; S.won = false; S.lock = false; S.hintDir = -1; S.dead = null; S.parts = []; S.facing = [1, 1]; S.stuckKnown = false;
        S.cmp = TW.compile(L);
        S.vis = null; setVis(true);
        $("mClear").classList.remove("on"); clearHintBtn();
        show("play"); GK.bgm("calm"); updateBar(); resize(); S.t0 = performance.now();
        if(!raf){ last = performance.now(); raf = requestAnimationFrame(loop); }
    }
    function nameOf(){ return S.daily ? t("dailyName") : t("stage") + " " + S.n; }
    function updateBar(){
        $("nm").textContent = nameOf(); $("mv").textContent = t("moves") + " " + S.moves; $("pr").textContent = t("par") + " " + S.L.par;
        $("mv").classList.toggle("good", S.moves <= S.L.par);
    }
    function clearHintBtn(){ [].forEach.call(document.querySelectorAll("#dpad button"), function(b){ b.classList.remove("hint"); }); S.hintDir = -1; }

    // ---- 手を うつ ----
    function doMove(d){
        if(S.scr !== "play" || S.lock || S.won) return;
        clearHintBtn();
        var r = TW.move(S.L, S.s, d);
        S.facing = [TW.mapDir(S.cmp.ma, d), TW.mapDir(S.cmp.mb, d)];
        if(!r.moved){ GK.sfx("tap"); bump(d); return; }
        if(r.dead){
            S.lock = true; S.dead = {a: S.cmp.A.hole[r.s.a] ? 1 : 0, b: S.cmp.B.hole[r.s.b] ? 1 : 0, t: 0}; var prev = S.s; S.s = r.s;
            GK.sfx("lose"); GK.vibrate(40); msg(t("fell"), 900); GK.shake($("cv"), 300);
            setTimeout(function(){ S.s = prev; S.dead = null; S.lock = false; }, 800);
            return;
        }
        S.hist.push(S.s); S.s = r.s; S.moves++; GK.sfx("tap"); trail(); updateBar();
        if(r.won){ win(); return; }
        if((S.cmp.A.crate >= 0 || S.cmp.B.crate >= 0) && !S.stuckKnown){ setTimeout(checkStuck, 30); }
    }
    function bump(d){ if(S.vis) S.vis.shake = 1; }
    function checkStuck(){
        if(S.won || S.scr !== "play") return;
        var sol = TW.solve(S.L, S.s, 120000);
        if(sol == null && S.hist.length){ S.stuckKnown = true; msg(t("stuck"), 2600); }
    }
    function undo(){
        if(S.scr !== "play" || S.lock) return;
        if(!S.hist.length){ GK.sfx("ng"); return; }
        S.s = S.hist.pop(); S.moves = Math.max(0, S.moves - 1); S.won = false; S.stuckKnown = false; clearHintBtn(); GK.sfx("pop"); updateBar();
    }
    function reset(){ if(S.scr !== "play") return; openLevel(S.L, S.n, S.daily); GK.sfx("pop"); }
    function hint(){
        if(S.scr !== "play" || S.lock || S.won) return;
        var sol = TW.solve(S.L, S.s, 250000);
        if(sol == null){ msg(t("hintNo"), 2400); GK.sfx("ng"); return; }
        if(sol === ""){ msg(t("already"), 1500); return; }
        var d = "URDL".indexOf(sol[0]); clearHintBtn(); S.hintDir = d;
        var b = document.querySelector('#dpad button[data-d="' + d + '"]'); if(b) b.classList.add("hint");
        msg(t("hint", {a: ARROWS[d]}), 1600); GK.sfx("coin");
    }
    function stars(){ var p = S.L.par; return S.moves <= p ? 3 : S.moves <= p + Math.ceil(p * .4) ? 2 : 1; }
    function win(){
        S.won = true; S.lock = true; GK.sfx("win"); GK.confetti(); GK.vibrate(60);
        var st = stars();
        if(!S.daily){ if(st > store.get("s" + S.n, 0)) store.set("s" + S.n, st); }
        else { var k = "d" + GK.daySeed(); if(st > store.get(k, 0)) store.set(k, st); }
        for(var i = 0; i < 40; i++) S.parts.push({x: CW / 2, y: CH / 2, vx: (Math.random() - .5) * 9, vy: (Math.random() - .8) * 8, life: 1, c: i % 2 ? "#ffe36a" : "#7ae6ff"});
        setTimeout(function(){
            $("clT").textContent = st === 3 ? t("perfect") : t("clear"); $("clStars").textContent = "★★★".slice(0, st) + "☆☆☆".slice(0, 3 - st);
            $("clB").textContent = t("clB", {n: S.moves, p: S.L.par});
            $("clNext").style.display = (!S.daily && S.n < LV.length) ? "" : "none";
            $("mClear").classList.add("on");
        }, 650);
    }

    // ---- えがく ----
    function setVis(snap){
        var c = S.cmp, N = c.N, w = c.w, s = S.s;
        var P = function(i){ return i >= N ? null : {x: i % w, y: (i / w) | 0}; };
        var tgt = {a: P(s.a), b: P(s.b), ca: P(s.ca), cb: P(s.cb)};
        if(!S.vis || snap){ S.vis = {a: {x: tgt.a.x, y: tgt.a.y}, b: {x: tgt.b.x, y: tgt.b.y}, ca: tgt.ca && {x: tgt.ca.x, y: tgt.ca.y}, cb: tgt.cb && {x: tgt.cb.x, y: tgt.cb.y}, dA: 0, dB: 0, shake: 0}; return; }
        var v = S.vis, k = 1 - Math.exp(-.35 * 60 * (1 / 60) * 3);
        ["a", "b", "ca", "cb"].forEach(function(n){ if(tgt[n]){ if(!v[n]) v[n] = {x: tgt[n].x, y: tgt[n].y}; v[n].x += (tgt[n].x - v[n].x) * .38; v[n].y += (tgt[n].y - v[n].y) * .38; } else v[n] = null; });
    }
    function trail(){
        if(!S.vis || !CW) return;
        for(var i = 0; i < 6; i++){ S.parts.push({x: -1, y: -1, tr: 1, vx: 0, vy: 0, life: 1}); }
    }
    function resize(){
        var r = cv.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
        CW = r.width; CH = r.height; cv.width = Math.max(1, Math.round(CW * DPR)); cv.height = Math.max(1, Math.round(CH * DPR));
    }
    function layout(){
        var n = S.cmp.w, pad = 12, lab = 22, hor = CW >= CH * 1.15, bs, boards;
        if(hor){ bs = Math.max(60, Math.min((CW - pad * 3) / 2, CH - pad * 2 - lab)); var tw = bs * 2 + pad, x0 = (CW - tw) / 2, y0 = (CH - bs - lab) / 2 + lab; boards = [{x: x0, y: y0}, {x: x0 + bs + pad, y: y0}]; }
        else { bs = Math.max(60, Math.min(CW - pad * 2, (CH - pad * 3 - lab * 2) / 2)); var x1 = (CW - bs) / 2, y1 = Math.max(4, (CH - bs * 2 - pad - lab * 2) / 2) + lab; boards = [{x: x1, y: y1}, {x: x1, y: y1 + bs + pad + lab}]; }
        return {bs: bs, cs: bs / n, boards: boards};
    }
    function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    function drawBoard(c, ox, oy, cs, g, key, vis, pos, mode, who, tm){
        var C = COL[key], n = g.w, bs = cs * n;
        // かべ・ゆか
        rr(c, ox - 6, oy - 6, bs + 12, bs + 12, 14); c.fillStyle = C.bg; c.fill(); c.strokeStyle = C.wallTop; c.lineWidth = 2; c.stroke();
        for(var y = 0; y < n; y++) for(var x = 0; x < n; x++){
            var i = y * n + x, px = ox + x * cs, py = oy + y * cs;
            if(g.wall[i]){ rr(c, px + 2, py + 2, cs - 4, cs - 4, 7); c.fillStyle = C.wall; c.fill(); rr(c, px + 2, py + 2, cs - 4, (cs - 4) * .55, 7); c.fillStyle = C.wallTop; c.globalAlpha = .55; c.fill(); c.globalAlpha = 1; continue; }
            rr(c, px + 1.5, py + 1.5, cs - 3, cs - 3, 6); c.fillStyle = (x + y) % 2 ? C.tile : C.tile2; c.fill();
            if(g.hole[i]){ var gr = c.createRadialGradient(px + cs / 2, py + cs / 2, 2, px + cs / 2, py + cs / 2, cs * .46); gr.addColorStop(0, "#000"); gr.addColorStop(.75, "#050510"); gr.addColorStop(1, "#1a1a3a"); c.fillStyle = gr; c.beginPath(); c.arc(px + cs / 2, py + cs / 2, cs * .42, 0, 6.3); c.fill(); }
            if(i === g.goal){ var pu = .5 + .5 * Math.sin(tm / 260); c.save(); c.shadowColor = C.glow; c.shadowBlur = 14 + pu * 10; c.strokeStyle = C.glow; c.lineWidth = 3; c.beginPath(); c.arc(px + cs / 2, py + cs / 2, cs * (.32 + pu * .04), 0, 6.3); c.stroke(); c.fillStyle = "#ffe36a"; c.font = "bold " + (cs * .42 | 0) + "px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("☆", px + cs / 2, py + cs / 2 + 1); c.restore(); }
            if(i === g.plate){ var on = pos.plateOn; c.save(); c.strokeStyle = "#ffd35a"; c.lineWidth = 3; c.shadowColor = "#ffd35a"; c.shadowBlur = on ? 18 : 4; c.beginPath(); c.arc(px + cs / 2, py + cs / 2, cs * .3, 0, 6.3); c.stroke(); if(on){ c.fillStyle = "rgba(255,211,90,.5)"; c.fill(); } c.restore(); }
        }
        // とびら
        for(var di = 0; di < g.N; di++) if(g.door[di]){
            var dx = ox + (di % n) * cs, dy = oy + ((di / n) | 0) * cs, op = pos.doorV;
            c.save(); c.globalAlpha = .25 + .75 * (1 - op); rr(c, dx + 4, dy + 4, cs - 8, cs - 8, 6); c.fillStyle = "#b9822a"; c.fill(); c.strokeStyle = "#ffd35a"; c.lineWidth = 2; c.stroke();
            c.strokeStyle = "rgba(255,255,255,.5)"; for(var k = 1; k < 4; k++){ c.beginPath(); c.moveTo(dx + 4, dy + 4 + k * (cs - 8) / 4); c.lineTo(dx + cs - 4, dy + 4 + k * (cs - 8) / 4); c.stroke(); } c.restore();
        }
        // はこ
        if(vis.crate){ var bx = ox + vis.crate.x * cs, by = oy + vis.crate.y * cs; rr(c, bx + 5, by + 5, cs - 10, cs - 10, 6); c.fillStyle = "#c98a4b"; c.fill(); c.strokeStyle = "#7a4a1e"; c.lineWidth = 3; c.stroke(); c.beginPath(); c.moveTo(bx + 8, by + 8); c.lineTo(bx + cs - 8, by + cs - 8); c.moveTo(bx + cs - 8, by + 8); c.lineTo(bx + 8, by + cs - 8); c.stroke(); }
        // ぼうけんしゃ
        var av = vis.av, ax = ox + (av.x + .5) * cs, ay = oy + (av.y + .5) * cs, sc = 1, al = 1;
        if(vis.dying){ sc = Math.max(0, 1 - vis.dying); al = sc; }
        c.save(); c.globalAlpha = al; c.translate(ax, ay); c.scale(sc, sc);
        c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.ellipse(0, cs * .26, cs * .26, cs * .09, 0, 0, 6.3); c.fill();
        var bob = Math.sin(tm / 300 + (key === "B" ? 1.6 : 0)) * cs * .02;
        c.shadowColor = C.glow; c.shadowBlur = 16; c.fillStyle = C.av; c.beginPath(); c.arc(0, bob, cs * .3, 0, 6.3); c.fill(); c.shadowBlur = 0;
        c.fillStyle = "#fff"; var fx = TW.DX[vis.face] * cs * .05, fy = TW.DY[vis.face] * cs * .04;
        c.beginPath(); c.arc(-cs * .1 + fx, -cs * .04 + fy + bob, cs * .075, 0, 6.3); c.arc(cs * .1 + fx, -cs * .04 + fy + bob, cs * .075, 0, 6.3); c.fill();
        c.fillStyle = "#12123a"; c.beginPath(); c.arc(-cs * .1 + fx * 1.6, -cs * .04 + fy * 1.6 + bob, cs * .035, 0, 6.3); c.arc(cs * .1 + fx * 1.6, -cs * .04 + fy * 1.6 + bob, cs * .035, 0, 6.3); c.fill();
        c.restore();
        // ラベルと コンパス
        c.fillStyle = C.glow; c.font = "bold 13px sans-serif"; c.textAlign = "left"; c.textBaseline = "bottom"; c.fillText(who, ox, oy - 8);
        var cx0 = ox + bs - 22, cy0 = oy - 20; c.fillStyle = "#e8ecff"; c.font = "bold 11px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(ARROWS[TW.mapDir(mode, 0)], cx0, cy0 - 7); c.fillText(ARROWS[TW.mapDir(mode, 2)], cx0, cy0 + 7); c.fillText(ARROWS[TW.mapDir(mode, 3)], cx0 - 12, cy0); c.fillText(ARROWS[TW.mapDir(mode, 1)], cx0 + 12, cy0);
        c.strokeStyle = "rgba(255,255,255,.3)"; c.strokeRect(cx0 - 5, cy0 - 5, 10, 10);
        c.textAlign = "right"; c.font = "11px sans-serif"; c.fillStyle = "#c9d3ff"; c.fillText(t(mode), cx0 - 22, cy0);
    }
    function frame(tm){
        g2.setTransform(DPR, 0, 0, DPR, 0, 0); g2.clearRect(0, 0, CW, CH);
        if(!S.L || !S.vis) return;
        setVis(false);
        var L = layout(), c = S.cmp, s = S.s, v = S.vis, N = c.N;
        var plateA = c.A.plate >= 0 && (s.a === c.A.plate || s.ca === c.A.plate), plateB = c.B.plate >= 0 && (s.b === c.B.plate || s.cb === c.B.plate);
        v.dA += ((plateB ? 1 : 0) - v.dA) * .25; v.dB += ((plateA ? 1 : 0) - v.dB) * .25;
        if(S.dead){ S.dead.t += 1 / 60 * 1.6; }
        var sh = v.shake > 0 ? (Math.random() - .5) * 6 * v.shake : 0; v.shake = Math.max(0, v.shake - .08);
        g2.save(); g2.translate(sh, 0);
        drawBoard(g2, L.boards[0].x, L.boards[0].y, L.cs, c.A, "A", {av: v.a, crate: s.ca < N ? v.ca : null, face: S.facing[0], dying: S.dead && S.dead.a ? Math.min(1, S.dead.t) : 0}, {plateOn: plateA, doorV: v.dA}, c.ma, t("mA"), tm);
        drawBoard(g2, L.boards[1].x, L.boards[1].y, L.cs, c.B, "B", {av: v.b, crate: s.cb < N ? v.cb : null, face: S.facing[1], dying: S.dead && S.dead.b ? Math.min(1, S.dead.t) : 0}, {plateOn: plateB, doorV: v.dB}, c.mb, t("mB"), tm);
        g2.restore();
        // つなぐ 光
        g2.strokeStyle = "rgba(255,230,120,.25)"; g2.setLineDash([4, 6]); g2.beginPath();
        var a1 = L.boards[0], b1 = L.boards[1];
        if(CW >= CH * 1.15){ g2.moveTo(a1.x + L.bs + 6, a1.y + L.bs / 2); g2.lineTo(b1.x - 6, b1.y + L.bs / 2); } else { g2.moveTo(a1.x + L.bs / 2, a1.y + L.bs + 6); g2.lineTo(b1.x + L.bs / 2, b1.y - 22); }
        g2.stroke(); g2.setLineDash([]);
        // ひかりの つぶ
        for(var i = S.parts.length - 1; i >= 0; i--){
            var p = S.parts[i]; if(p.tr){ S.parts.splice(i, 1); continue; }
            p.x += p.vx; p.y += p.vy; p.vy += .25; p.life -= .016; if(p.life <= 0){ S.parts.splice(i, 1); continue; }
            g2.globalAlpha = p.life; g2.fillStyle = p.c; g2.fillRect(p.x, p.y, 5, 5);
        } g2.globalAlpha = 1;
    }
    function loop(now){
        raf = requestAnimationFrame(loop);
        if(S.scr !== "play"){ return; }
        try{ frame(now); }catch(e){ console.error(e); }
    }

    // ---- そうさ ----
    // キーボード・プロコンは 共通部品 GKI（そうさ設定で かえられる）。十字キー／スティック＝うごく、B＝1手もどす、Y＝さいしょから、X＝ヒント、＋＝ステージえらび
    if(window.GKI){
        GKI.defaults({b: ["Backspace", "z", "u"], x: ["x", "h", "?"], y: ["r", "y"], plus: ["Escape", "p"]});
        GKI.legend([{k: "dpad", t: {ja: "うごく（しゃめん スワイプも OK）", en: "Move (swipe also works)", zh: "移动（也可滑动）", ko: "이동 (스와이프도 가능)"}},
            {k: "b", t: {ja: "1手もどす", en: "Undo a move", zh: "撤销一步", ko: "한 수 되돌리기"}}, {k: "y", t: {ja: "さいしょから やりなおす", en: "Restart", zh: "重新开始", ko: "처음부터"}},
            {k: "x", t: {ja: "ヒント", en: "Hint", zh: "提示", ko: "힌트"}}, {k: "plus", t: {ja: "ステージえらびに もどる", en: "Back to stage list", zh: "返回关卡列表", ko: "스테이지 목록으로"}}]);
        GKI.on(function(a, down){
            if(!down || S.scr !== "play" || $("mClear").classList.contains("on")) return;
            if(a === "up") doMove(0); else if(a === "right") doMove(1); else if(a === "down") doMove(2); else if(a === "left") doMove(3);
            else if(a === "b") undo(); else if(a === "y") reset(); else if(a === "x") hint(); else if(a === "plus"){ GK.bgm("off"); show("sel"); }
        });
        GKI.onBack(function(){ if(S.scr !== "title") $("exitBtn").click(); });
    }
    window.addEventListener("keydown", function(e){   // クリアがめんの Enter（つぎへ）
        if(e.key === "Enter" && $("mClear").classList.contains("on")){ if($("clNext").style.display !== "none") $("clNext").click(); else $("clRetry").click(); }
    });
    var sw = null;
    cv.addEventListener("pointerdown", function(e){ sw = {x: e.clientX, y: e.clientY, t: performance.now()}; });
    cv.addEventListener("pointerup", function(e){
        if(!sw) return; var dx = e.clientX - sw.x, dy = e.clientY - sw.y; sw = null;
        if(Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
        doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
    });
    $("dpad").addEventListener("pointerdown", function(e){ var b = e.target.closest("button"); if(!b) return; e.preventDefault(); doMove(+b.dataset.d); });
    $("bUndo").onclick = undo; $("bReset").onclick = reset; $("bHint").onclick = hint;
    $("bStages").onclick = function(){ show("sel"); };
    $("bHow").onclick = function(){ show("how"); };
    $("bHowBack").onclick = $("bSelBack").onclick = function(){ show("title"); };
    $("bDaily").onclick = function(){
        var seed = GK.daySeed(), n = 45 + (seed % 60), L = TW.gen(n, seed);
        if(L) openLevel(L, n, true);
    };
    $("levels").addEventListener("click", function(e){ var b = e.target.closest("button"); if(!b) return; var n = +b.dataset.n; openLevel(LV[n - 1], n, false); });
    $("clNext").onclick = function(){ if(S.n < LV.length) openLevel(LV[S.n], S.n + 1, false); };
    $("clRetry").onclick = function(){ openLevel(S.L, S.n, S.daily); };
    $("clSel").onclick = function(){ $("mClear").classList.remove("on"); GK.bgm("off"); show("sel"); };
    $("exitBtn").onclick = function(){
        if(S.scr === "play"){ GK.bgm("off"); show("sel"); return; }
        if(S.scr !== "title"){ show("title"); return; }
        try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
        location.href = "./index.html";
    };
    $("sndBtn").onclick = function(){ GK.mute(!GK.isMuted()); $("sndBtn").textContent = GK.isMuted() ? "🔇" : "🔊"; if(!GK.isMuted()){ GK.sfx("ok"); if(S.scr === "play") GK.bgm("calm"); } };
    $("lgBtn").onclick = function(){ var order = ["ja", "en", "zh", "ko"], i = order.indexOf(GK.lang()); GK.LS.set("are_lang", order[(i + 1) % 4]); show(S.scr); };
    window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
    window.__tw = {S: S, TW: TW, openLevel: openLevel, doMove: doMove, LV: LV, show: show, hint: hint, undo: undo};
    show("title");
})();
