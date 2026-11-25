"use strict";
// ポコポコ太鼓：本体（画面・入力・音・判定）。絵は ぜんぶ このファイルの SVG と CSS で描いた オリジナルです。
(function(){
    var P = window.PKSongs, SONGS = P.SONGS, DIFFS = P.DIFFS;
    var $ = function(id){ return document.getElementById(id); };
    var LANGS = ["ja", "en", "zh", "ko"];
    var T = {
        sub: {ja: "流れてくる赤と青の音符を、リズムに合わせて たたこう！", en: "Hit the red and blue notes in time with the music!", zh: "跟着节奏，敲打流过来的红蓝音符！", ko: "흘러오는 빨강·파랑 음표를 리듬에 맞춰 두드려요!"},
        note: {ja: "絵も音も、ぜんぶ このゲームのオリジナルです。キーボード・タッチ・ゲームパッドで あそべます。", en: "All art and music are original. Play with keyboard, touch or gamepad.", zh: "画面和音乐全部为原创。可用键盘、触屏或手柄游玩。", ko: "그림과 음악은 모두 오리지널입니다. 키보드·터치·게임패드로 즐겨요."},
        play: {ja: "あそぶ", en: "Play", zh: "开始", ko: "시작"}, how: {ja: "あそびかた", en: "How to play", zh: "玩法", ko: "하는 법"}, back: {ja: "もどる", en: "Back", zh: "返回", ko: "뒤로"},
        howT: {ja: "あそびかた", en: "How to play", zh: "玩法", ko: "하는 법"},
        howB: {ja: "<b>🔴 赤い音符</b>：真ん中（ドン）をたたく　<b>F・J</b> キー<br><b>🔵 青い音符</b>：ふち（カッ）をたたく　<b>D・K</b> キー<br><b>大きい音符</b>：ふつうの 2倍の点です<br><b>🟡 長い音符（れんだ）</b>：光っている間、どちらでもいいので 連打！<br>音符が 左の まるに重なった瞬間に たたくと「良」。<br>下の魂ゲージが 70%を こえると <b>クリア</b>。<br>タッチ：画面の下の 4つの太鼓をタップ（中が赤・ふちが青）。<br>ゲームパッド：ABXY など＝赤、L・R・ZL・ZR・十字キー＝青、＋＝ポーズ。<br>オート：曲えらびの「オート」をオンにすると、自動で たたきます。", en: "<b>🔴 Red notes</b>: hit the center (don) with <b>F / J</b><br><b>🔵 Blue notes</b>: hit the rim (ka) with <b>D / K</b><br><b>Big notes</b> are worth double.<br><b>🟡 Long notes (rolls)</b>: mash either key while lit!<br>Hit when a note overlaps the circle on the left for “Perfect”.<br>Fill the soul gauge above 70% to <b>clear</b>.<br>Touch: tap the 4 drums at the bottom (center = red, rim = blue).<br>Gamepad: A/B/X/Y = red, L/R/ZL/ZR/D-pad = blue, + = pause.<br>Auto: turn on “Auto” on the song list to let the game play.", zh: "<b>🔴 红色音符</b>：敲中间（咚）— <b>F / J</b> 键<br><b>🔵 蓝色音符</b>：敲边缘（咔）— <b>D / K</b> 键<br><b>大音符</b>得分翻倍。<br><b>🟡 长音符（连打）</b>：发光期间任意连按！<br>音符与左边圆圈重叠时敲击即为“良”。<br>灵魂槽超过70%即<b>通关</b>。<br>触屏：点击下方4面鼓（中间红、边缘蓝）。<br>手柄：A/B/X/Y＝红，L/R/ZL/ZR/方向键＝蓝，＋＝暂停。<br>自动：在选曲画面打开“自动”即可自动演奏。", ko: "<b>🔴 빨간 음표</b>: 가운데(둥)를 <b>F / J</b> 키로<br><b>🔵 파란 음표</b>: 가장자리(캇)를 <b>D / K</b> 키로<br><b>큰 음표</b>는 점수 2배.<br><b>🟡 긴 음표(연타)</b>: 빛나는 동안 아무 키나 연타!<br>음표가 왼쪽 원과 겹칠 때 치면 ‘좋음’.<br>영혼 게이지가 70%를 넘으면 <b>클리어</b>.<br>터치: 아래 북 4개를 탭(가운데 빨강, 가장자리 파랑).<br>게임패드: A/B/X/Y=빨강, L/R/ZL/ZR/십자키=파랑, +=일시정지.<br>오토: 곡 선택에서 ‘오토’를 켜면 자동 연주."},
        sel: {ja: "曲をえらぼう", en: "Choose a song", zh: "选择歌曲", ko: "곡을 고르세요"}, auto: {ja: "オート（おまかせ）", en: "Auto play", zh: "自动演奏", ko: "오토 플레이"},
        diff: {ja: ["かんたん", "ふつう", "むずかしい", "おに"], en: ["Easy", "Normal", "Hard", "Oni"], zh: ["简单", "普通", "困难", "鬼"], ko: ["쉬움", "보통", "어려움", "도깨비"]},
        gauge: {ja: "魂", en: "Soul", zh: "魂", ko: "혼"},
        pause: {ja: "ポーズ", en: "Paused", zh: "暂停", ko: "일시정지"}, resume: {ja: "つづける", en: "Resume", zh: "继续", ko: "계속"}, retry: {ja: "もういちど", en: "Retry", zh: "重来", ko: "다시"}, quit: {ja: "曲えらびへ", en: "Song list", zh: "返回选曲", ko: "곡 목록"},
        res: {ja: "けっか", en: "Results", zh: "结果", ko: "결과"}, clear: {ja: "クリア！", en: "CLEARED!", zh: "通关！", ko: "클리어!"}, fail: {ja: "ざんねん…", en: "Not cleared", zh: "未通关", ko: "아쉬워요…"},
        fc: {ja: "フルコンボ！", en: "FULL COMBO!", zh: "全连击！", ko: "풀 콤보!"}, ap: {ja: "ぜんぶ「良」！", en: "ALL PERFECT!", zh: "全部“良”！", ko: "전부 ‘좋음’!"},
        jg: {ja: ["良", "可", "不可"], en: ["Perfect", "Good", "Miss"], zh: ["良", "可", "不可"], ko: ["좋음", "보통", "놓침"]},
        rows: {ja: ["スコア", "良", "可", "不可", "連打", "さいだいコンボ", "魂ゲージ"], en: ["Score", "Perfect", "Good", "Miss", "Rolls", "Max combo", "Soul"], zh: ["得分", "良", "可", "不可", "连打", "最大连击", "魂槽"], ko: ["점수", "좋음", "보통", "놓침", "연타", "최대 콤보", "영혼"]},
        newbest: {ja: "🎉 ベスト更新！", en: "🎉 New best!", zh: "🎉 刷新纪录！", ko: "🎉 최고 기록!"},
        hint: {ja: "赤：F・J　青：D・K　ポーズ：Esc", en: "Red: F/J  Blue: D/K  Pause: Esc", zh: "红：F/J　蓝：D/K　暂停：Esc", ko: "빨강: F/J  파랑: D/K  정지: Esc"},
        best: {ja: "ベスト", en: "Best", zh: "最高", ko: "최고"}, bigAuto: {ja: "（オート）", en: "(Auto)", zh: "（自动）", ko: "(오토)"}
    };
    var lang = "ja";
    try{ var sv = localStorage.getItem("are_lang"); if(LANGS.indexOf(sv) >= 0) lang = sv; }catch(_e){}
    function t(k){ var v = T[k]; return v ? (v[lang] || v.ja) : k; }
    // ---- オリジナルのマスコット「ぽこたん」（丸い太鼓のこ） ----
    var MASCOT = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="mg" cx="50%" cy="35%"><stop offset="0" stop-color="#fff3e0"/><stop offset="1" stop-color="#ffd9a8"/></radialGradient></defs>' +
        '<ellipse cx="50" cy="92" rx="30" ry="5" fill="#0004"/><rect x="14" y="26" width="72" height="62" rx="22" fill="#d8402e"/><rect x="14" y="26" width="72" height="62" rx="22" fill="none" stroke="#8f2416" stroke-width="3"/>' +
        '<ellipse cx="50" cy="30" rx="36" ry="14" fill="url(#mg)" stroke="#8f2416" stroke-width="3"/>' +
        '<circle cx="38" cy="52" r="7" fill="#fff"/><circle cx="62" cy="52" r="7" fill="#fff"/><circle cx="39.5" cy="53" r="3.6" fill="#2a1450"/><circle cx="63.5" cy="53" r="3.6" fill="#2a1450"/>' +
        '<path d="M40 66 Q50 76 60 66" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="29" cy="62" r="4.5" fill="#ff9a8a" opacity=".8"/><circle cx="71" cy="62" r="4.5" fill="#ff9a8a" opacity=".8"/>' +
        '<rect x="8" y="10" width="5" height="30" rx="2.5" transform="rotate(-25 10 25)" fill="#f2d08a" stroke="#8a5a2a" stroke-width="1.5"/><rect x="87" y="10" width="5" height="30" rx="2.5" transform="rotate(25 90 25)" fill="#f2d08a" stroke="#8a5a2a" stroke-width="1.5"/></svg>';
    // ---- 状態 ----
    var G = {scr: "title", song: null, diff: 0, auto: false, notes: [], music: [], mi: 0, startAt: 0, running: false, paused: false, ended: false,
             score: 0, combo: 0, maxCombo: 0, g: 0, o: 0, m: 0, roll: 0, gauge: 0, gainG: 0, gainO: 0, loss: 0, total: 0, fx: [], pad: {}, t0: 0, pausedAt: 0, timer: 0, music_on: true};
    var ctx = null, master = null, useCtx = false, noiseBuf = null;
    function clock(){ return useCtx ? ctx.currentTime : performance.now() / 1000; }
    function now(){ return clock() - G.startAt; }
    function ensureAudio(){
        if(!ctx){
            try{ var AC = window.AudioContext || window.webkitAudioContext; if(AC){ ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);
                noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for(var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } }catch(_e){ ctx = null; }
        }
        return ctx ? ctx.resume().catch(function(){}) : Promise.resolve();
    }
    // ---- 音（ぜんぶ その場で作る） ----
    function tone(type, f, at, dur, vol, f2){
        if(!useCtx) return; var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, at); if(f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur);
        g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); o.connect(g); g.connect(master); o.start(at); o.stop(at + dur + 0.02);
    }
    function noise(at, dur, vol, hp){
        if(!useCtx || !noiseBuf) return; var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = hp;
        g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); s.connect(f); f.connect(g); g.connect(master); s.start(at); s.stop(at + dur + 0.02);
    }
    function sfxDon(){ if(!useCtx) return; var a = ctx.currentTime; tone("sine", 190, a, 0.16, 0.9, 70); noise(a, 0.05, 0.25, 800); }
    function sfxKa(){ if(!useCtx) return; var a = ctx.currentTime; tone("triangle", 1100, a, 0.06, 0.45, 700); noise(a, 0.07, 0.5, 3000); }
    function playMusicEvent(e, at){
        if(!G.music_on) return;
        if(e.k === "kick") tone("sine", 120, at, 0.14, 0.32, 45);
        else if(e.k === "hat") noise(at, e.d, 0.07 * (e.v || 1), 7000);
        else if(e.k === "bass") tone("triangle", e.f, at, e.d, 0.32);
        else if(e.k === "lead") tone("square", e.f, at, e.d, 0.07);
        else if(e.k === "chord") e.f.forEach(function(f){ tone("sine", f, at, e.d, 0.06); });
    }
    function schedule(){
        if(!G.running || G.paused || !useCtx) return;
        var lim = ctx.currentTime + 0.3;
        while(G.mi < G.music.length && G.startAt + G.music[G.mi].t < lim){ var e = G.music[G.mi++], at = G.startAt + e.t; if(at >= ctx.currentTime - 0.02) playMusicEvent(e, Math.max(at, ctx.currentTime)); }
    }
    // ---- 画面 ----
    function show(id){
        G.scr = id; document.body.classList.toggle("playing", id === "play"); Array.prototype.forEach.call(document.querySelectorAll(".scr"), function(s){ s.classList.toggle("on", s.id === "s-" + id); });
        var f = document.querySelector("#s-" + id + " [data-pad-first]"); if(f && id !== "play") try{ f.focus({preventScroll: true}); }catch(_e){}
    }
    function bestKey(s, d){ return "are_pk_best_v1_" + s + "_" + d; }
    function getBest(s, d){ try{ var v = JSON.parse(localStorage.getItem(bestKey(s, d)) || "null"); return v && typeof v.score === "number" ? v : null; }catch(_e){ return null; } }
    function setBest(s, d, v){ try{ localStorage.setItem(bestKey(s, d), JSON.stringify(v)); }catch(_e){} }
    function crownOf(r){ return r.ap ? "👑" : r.fc ? "🥇" : r.clear ? "🥈" : ""; }
    function paintText(){
        $("tSub").textContent = t("sub"); $("tNote").textContent = t("note"); $("bPlay").textContent = t("play"); $("bHow").textContent = t("how"); $("bHowBack").textContent = t("back"); $("bSeBack").textContent = t("back");
        $("hT").textContent = t("howT"); $("hBody").innerHTML = t("howB"); $("seT").textContent = t("sel"); $("seAuto").textContent = t("auto"); $("gLbl").textContent = t("gauge");
        $("paT").textContent = t("pause"); $("bResume").textContent = t("resume"); $("bRetry").textContent = t("retry"); $("bQuit").textContent = t("quit");
        $("reT").textContent = t("res"); $("bReAgain").textContent = t("retry"); $("bReList").textContent = t("quit"); $("keyHint").textContent = t("hint");
        $("exitBtn").textContent = "← " + t("back"); $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[lang]; document.documentElement.lang = lang;
        document.title = {ja: "ポコポコ太鼓｜リズムでたたく お祭りゲーム", en: "Poko-Poko Drum | A festival rhythm game", zh: "咚咚太鼓｜节奏敲鼓庙会游戏", ko: "포코포코 북｜리듬 축제 게임"}[lang];
        $("mascotT").innerHTML = MASCOT; $("mascotP").innerHTML = MASCOT;
        var l1 = document.querySelector(".logo .l1"), l2 = document.querySelector(".logo .l2");
        var lg = {ja: ["ポコポコ", "太鼓"], en: ["Poko-Poko", "Drum"], zh: ["咚咚", "太鼓"], ko: ["포코포코", "북"]}[lang]; l1.textContent = lg[0]; l2.textContent = lg[1];
        paintSongs();
    }
    function paintSongs(){
        var box = $("songList"); box.innerHTML = "";
        SONGS.forEach(function(s, si){
            var row = document.createElement("div"); row.className = "song"; row.style.setProperty("--c", s.color);
            var best = 0, crown = ""; for(var d = 0; d < 4; d++){ var b = getBest(s.id, d); if(b){ best = Math.max(best, b.score); if(b.crown && b.crown.length) crown = b.crown; } }
            row.innerHTML = '<div class="nm"><b></b><small></small></div><div class="diffs"></div>';
            row.querySelector("b").textContent = s.name[lang] || s.name.ja;
            row.querySelector("small").textContent = "♩=" + s.bpm + (best ? "　" + t("best") + " " + best + (crown ? " " + crown : "") : "");
            var df = row.querySelector(".diffs");
            for(d = 0; d < 4; d++){ (function(d){ var bt = document.createElement("button"); bt.type = "button"; bt.style.setProperty("--d", DIFFS[d].color + "cc"); bt.dataset.s = si; bt.dataset.d = d;
                var bb = getBest(s.id, d); bt.innerHTML = t("diff")[d] + "<small>★" + s.stars[d] + (bb && bb.crown ? " " + bb.crown : "") + "</small>";
                bt.onclick = function(){ startSong(si, d); }; if(si === 0 && d === 0) bt.setAttribute("data-pad-first", ""); df.appendChild(bt); })(d); }
            box.appendChild(row);
        });
    }
    // ---- 曲のはじまり ----
    var countTimer = 0;
    function startSong(si, d){
        G.song = SONGS[si]; G.diff = d; G.auto = $("autoBox").checked; G.songIdx = si;
        ensureAudio().then(function(){ useCtx = !!(ctx && ctx.state === "running"); begin(); });
        setTimeout(function(){ if(G.scr === "select"){ useCtx = !!(ctx && ctx.state === "running"); begin(); } }, 600);   // 音の許可が おそいときも、すすめる
    }
    function begin(){
        if(G.scr === "play" || G.beginning) return; G.beginning = true;
        var s = G.song; G.notes = P.makeChart(s, G.diff).map(function(n){ return {t: n.t, type: n.type, end: n.end, done: false, hits: 0, res: ""}; });
        G.music = P.makeMusic(s); G.mi = 0; G.score = 0; G.combo = 0; G.maxCombo = 0; G.g = 0; G.o = 0; G.m = 0; G.roll = 0; G.gauge = 0; G.fx = []; G.ended = false; G.paused = false; G.running = false;
        var cnt = G.notes.filter(function(n){ return n.type !== "r"; }).length; G.total = cnt;
        G.gainG = 100 / cnt * 1.45; G.gainO = G.gainG * 0.5; G.loss = 100 / cnt * 2.2;
        $("pName").textContent = (s.name[lang] || s.name.ja) + "　" + t("diff")[G.diff] + (G.auto ? " " + t("bigAuto") : "");
        $("pScore").textContent = "0"; $("gFill").style.width = "0"; $("combo").className = ""; $("pauseBox").classList.remove("on");
        G.startAt = clock() + 100; show("play"); resize();
        var n = 3; $("countBox").classList.add("on"); $("countNum").textContent = n; clearInterval(countTimer);
        countTimer = setInterval(function(){ n--; if(n > 0){ $("countNum").textContent = n; } else { clearInterval(countTimer); $("countBox").classList.remove("on"); go(); } }, 700);
        G.beginning = false; cancelAnimationFrame(G.raf); loop();
    }
    function go(){
        G.startAt = clock() + 0.6; G.running = true; G.ended = false; clearInterval(G.timer); G.timer = setInterval(schedule, 30);
    }
    // ---- 入力と判定 ----
    var W_GOOD = 0.050, W_OK = 0.100, W_BAD = 0.135;
    function hit(kind){
        if(G.scr !== "play") return;
        if(kind === "d") sfxDon(); else sfxKa();
        flashPad(kind); mascotBump();
        if(!G.running || G.paused || G.auto) return;
        judge(kind, now());
    }
    function judge(kind, tm){
        var best = null, i, n;
        for(i = 0; i < G.notes.length; i++){ n = G.notes[i]; if(n.done) continue; if(n.t - tm > W_BAD) break;
            if(n.type === "r"){ if(tm >= n.t - 0.02 && tm <= n.end + 0.05){ n.hits++; G.roll++; addScore(300); fxBurst("#ffd24a"); showJudge("", "#ffd24a"); return; } continue; }
            if(Math.abs(n.t - tm) <= W_BAD){ best = n; break; } }
        if(!best) return;
        var isD = best.type === "d" || best.type === "D", ok = (kind === "d") === isD;
        var dt = Math.abs(best.t - tm);
        if(!ok){ best.done = true; best.res = "m"; return missNote(best, true); }
        var big = best.type === "D" || best.type === "K";
        if(dt <= W_GOOD) good(best, 0, big); else if(dt <= W_OK) good(best, 1, big); else { best.done = true; best.res = "m"; missNote(best, true); }
    }
    function good(n, grade, big){
        n.done = true; n.res = grade ? "o" : "g"; G.combo++; if(G.combo > G.maxCombo) G.maxCombo = G.combo;
        if(grade){ G.o++; G.gauge = Math.min(100, G.gauge + G.gainO); } else { G.g++; G.gauge = Math.min(100, G.gauge + G.gainG); }
        var base = (grade ? 500 : 1000) + Math.min(G.combo, 100) * 10; addScore(big ? base * 2 : base);
        fxBurst(n.type === "d" || n.type === "D" ? "#ff6a4a" : "#4ab8ff", big); showJudge(t("jg")[grade], grade ? "#ffd24a" : "#fff"); paintHud();
    }
    function missNote(n, byInput){
        if(!n.done){ n.done = true; n.res = "m"; }
        G.m++; G.combo = 0; G.gauge = Math.max(0, G.gauge - G.loss); showJudge(t("jg")[2], "#8a9aff"); paintHud();
    }
    function addScore(v){ G.score += v; }
    function paintHud(){
        $("pScore").textContent = G.score; $("gFill").style.width = G.gauge + "%";
        var c = $("combo"); if(G.combo >= 3){ c.className = "on"; c.innerHTML = G.combo + "<small>combo</small>"; } else c.className = "";
    }
    function showJudge(txt, color){ var j = $("judge"); j.textContent = txt; j.style.color = color; j.classList.remove("show"); void j.offsetWidth; j.classList.add("show"); }
    function mascotBump(){ var m = $("mascotP"); m.classList.add("hit"); clearTimeout(m._t); m._t = setTimeout(function(){ m.classList.remove("hit"); }, 90); }
    function flashPad(kind){
        Array.prototype.forEach.call(document.querySelectorAll('#drumArea .pad[data-k="' + kind + '"]'), function(p){ p.classList.add("down"); clearTimeout(p._t); p._t = setTimeout(function(){ p.classList.remove("down"); }, 90); });
    }
    function fxBurst(color, big){ var cx = 0.18; for(var i = 0; i < (big ? 12 : 7); i++) G.fx.push({x: 0, y: 0, vx: (Math.random() - 0.3) * 260, vy: (Math.random() - 0.5) * 260, life: 0.4, c: color}); }
    // ---- 描く ----
    var cv, cx2, dpr = 1, LW = 0, LH = 0;
    function resize(){
        cv = $("lane"); if(!cv) return; dpr = Math.min(2, window.devicePixelRatio || 1); var r = cv.getBoundingClientRect(); LW = Math.max(200, r.width); LH = Math.max(80, r.height);
        cv.width = Math.round(LW * dpr); cv.height = Math.round(LH * dpr); cx2 = cv.getContext("2d"); cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        $("laneWrap").style.setProperty("--hx", (LW * 0.18) + "px");
    }
    function noteX(tm, hx, speed){ return hx + (tm - now()) * speed; }
    function drawNote(c, x, y, r, type){
        var isD = type === "d" || type === "D", big = type === "D" || type === "K", R = big ? r * 1.35 : r;
        c.beginPath(); c.arc(x, y, R + 3, 0, 7); c.fillStyle = "#1a0a30"; c.fill();
        c.beginPath(); c.arc(x, y, R, 0, 7); c.fillStyle = "#fff6e6"; c.fill();
        c.beginPath(); c.arc(x, y, R * 0.78, 0, 7); c.fillStyle = isD ? "#ee4b3a" : "#37a2ee"; c.fill();
        c.beginPath(); c.arc(x - R * 0.2, y - R * 0.25, R * 0.22, 0, 7); c.fillStyle = "rgba(255,255,255,.35)"; c.fill();
        if(isD){ c.fillStyle = "rgba(255,255,255,.7)"; c.font = "bold " + Math.round(R * 0.55) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("", x, y); }
    }
    function draw(){
        if(!cx2) return; var c = cx2, W = LW, H = LH, hx = W * 0.18, cy = H * 0.5, r = H * 0.23, speed = W * 0.17 * (G.song.bpm / 60) * 1.2, tm = now();
        c.clearRect(0, 0, W, H);
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#3a2a6a"); g.addColorStop(1, "#1f1245"); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(0, H * 0.12, W, H * 0.76);
        // ビート線
        var bs = 60 / G.song.bpm, k0 = Math.floor((tm - hx / speed) / bs);
        for(var k = k0; k < k0 + Math.ceil(W / (bs * speed)) + 3; k++){ var bx = hx + (k * bs - tm) * speed; if(bx < 0 || bx > W) continue; c.fillStyle = k % 4 === 0 ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.12)"; c.fillRect(bx - 1, H * 0.12, 2, H * 0.76); }
        // 受けとめる まる
        c.beginPath(); c.arc(hx, cy, r * 1.22, 0, 7); c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 4; c.stroke();
        c.beginPath(); c.arc(hx, cy, r * 1.22, 0, 7); c.fillStyle = "rgba(255,255,255,.08)"; c.fill();
        // 音符（おくのものから 先に描いて、手前を うえに）
        for(var i = G.notes.length - 1; i >= 0; i--){
            var n = G.notes[i]; if(n.done && n.type !== "r") continue;
            var x = hx + (n.t - tm) * speed; if(n.type === "r"){ var x2 = hx + (n.end - tm) * speed; if(x2 < -r || x > W + r) continue;
                var act = tm >= n.t && tm <= n.end; c.fillStyle = act ? "#fff07a" : "#ffd24a"; var a = Math.max(x, -r), bw = Math.min(x2, W + r) - a; c.beginPath(); c.roundRect ? c.roundRect(a, cy - r * 0.75, Math.max(2, bw), r * 1.5, r * 0.75) : c.rect(a, cy - r * 0.75, Math.max(2, bw), r * 1.5); c.fill();
                c.strokeStyle = "#8a5a00"; c.lineWidth = 3; c.stroke(); if(n.hits){ c.fillStyle = "#6a3a00"; c.font = "bold " + Math.round(r) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n.hits), Math.max(hx, Math.max(x, 20)) + 20, cy); } continue; }
            if(x < -r * 2 || x > W + r * 2) continue; drawNote(c, x, cy, r, n.type);
        }
        // かがやき
        for(var f = G.fx.length - 1; f >= 0; f--){ var p = G.fx[f]; p.life -= 1 / 60; if(p.life <= 0){ G.fx.splice(f, 1); continue; } p.x += p.vx / 60; p.y += p.vy / 60; c.globalAlpha = Math.max(0, p.life / 0.4); c.fillStyle = p.c; c.beginPath(); c.arc(hx + p.x, cy + p.y, 4, 0, 7); c.fill(); c.globalAlpha = 1; }
    }
    function loop(){
        if(G.scr !== "play"){ return; }
        G.raf = requestAnimationFrame(loop); pollPad();
        if(G.running && !G.paused){
            var tm = now(), i, n;
            for(i = 0; i < G.notes.length; i++){ n = G.notes[i]; if(n.done) continue; if(n.type === "r"){
                    if(G.auto && tm >= n.t && tm <= n.end && tm - (n._la || 0) > 0.07){ n._la = tm; n.hits++; G.roll++; addScore(300); sfxDon(); fxBurst("#ffd24a"); }
                    if(tm > n.end + 0.05){ n.done = true; } continue; }
                if(G.auto){ if(tm >= n.t){ if(n.type === "d" || n.type === "D") sfxDon(); else sfxKa(); mascotBump(); flashPad(n.type === "d" || n.type === "D" ? "d" : "k"); good(n, 0, n.type === "D" || n.type === "K"); } else break; }
                else if(tm - n.t > W_BAD){ missNote(n, false); } else break; }
            if(!G.ended && tm > G.notes[G.notes.length - 1].t + 1.6) finish();
            if(G.mi >= G.music.length && tm > G.music[G.music.length - 1].t + 0.5 && !G.ended && !useCtx) { /* 音なしでも 譜面の おわりで 終わる */ }
        }
        draw();
    }
    // ---- 終わり ----
    function finish(){
        G.ended = true; G.running = false; clearInterval(G.timer);
        var cleared = G.gauge >= 70, fc = G.m === 0, ap = fc && G.o === 0;
        var r = {clear: cleared, fc: fc, ap: ap, score: G.score};
        var prev = getBest(G.song.id, G.diff), isNew = false, crown = crownOf(r);
        if(!G.auto){ if(!prev || G.score > prev.score){ isNew = true; setBest(G.song.id, G.diff, {score: G.score, crown: crown || (prev && prev.crown) || ""}); } else if(crown && (!prev.crown || crown === "👑" || (crown === "🥇" && prev.crown === "🥈"))){ setBest(G.song.id, G.diff, {score: prev.score, crown: crown}); } }
        $("reSong").textContent = (G.song.name[lang] || G.song.name.ja) + "　" + t("diff")[G.diff] + (G.auto ? " " + t("bigAuto") : "");
        $("reClear").textContent = ap ? t("ap") : fc ? t("fc") : cleared ? t("clear") : t("fail");
        var rows = t("rows"), vals = [G.score, G.g, G.o, G.m, G.roll, G.maxCombo, Math.round(G.gauge) + "%"];
        $("reTable").innerHTML = rows.map(function(l, i){ return "<tr><td>" + l + "</td><td>" + vals[i] + "</td></tr>"; }).join("");
        $("reNew").textContent = isNew ? t("newbest") : ""; window.PK_last = {score: G.score, g: G.g, o: G.o, m: G.m, roll: G.roll, maxCombo: G.maxCombo, gauge: G.gauge, clear: cleared, fc: fc, ap: ap};
        show("result"); paintSongs();
    }
    // ---- ポーズ ----
    function pause(){ if(G.scr !== "play" || !G.running || G.paused) return; G.paused = true; if(useCtx) ctx.suspend(); else G.pausedAt = clock(); $("pauseBox").classList.add("on"); try{ $("bResume").focus(); }catch(_e){} }
    function resume(){ if(!G.paused) return; G.paused = false; $("pauseBox").classList.remove("on"); if(useCtx) ctx.resume(); else G.startAt += clock() - G.pausedAt; }
    function quit(){ G.running = false; G.paused = false; clearInterval(G.timer); clearInterval(countTimer); $("pauseBox").classList.remove("on"); $("countBox").classList.remove("on"); if(useCtx && ctx.state === "suspended") ctx.resume(); show("select"); }
    // ---- ゲームパッド（ふち＝青：L R ZL ZR 十字、中＝赤：A B X Y）。メニューでは 十字で動き、Aで決定 ----
    var padPrev = {};
    function pollPad(){
        var pads = navigator.getGamepads ? navigator.getGamepads() : []; var cur = {};
        for(var i = 0; i < pads.length; i++){ var gp = pads[i]; if(!gp) continue; for(var b = 0; b < gp.buttons.length; b++){ if(gp.buttons[b].pressed) cur[b] = true; } }
        for(var k in cur){ if(!padPrev[k]){
            k = +k;
            if(G.scr === "play"){ if(k === 9 || k === 8){ if(G.paused) resume(); else pause(); } else if(G.paused){ if(k === 1) resume(); } else if(k <= 3) hit("d"); else if(k === 4 || k === 5 || k === 6 || k === 7 || (k >= 12 && k <= 15)) hit("k"); }
        } }
        padPrev = cur;
    }
    function menuPad(){
        var pads = navigator.getGamepads ? navigator.getGamepads() : []; var cur = {};
        for(var i = 0; i < pads.length; i++){ var gp = pads[i]; if(!gp) continue; for(var b = 0; b < gp.buttons.length; b++){ if(gp.buttons[b].pressed) cur[b] = true; } }
        if(G.scr !== "play"){ for(var k in cur){ if(!menuPad.prev[k]){ k = +k;
            var vis = Array.prototype.filter.call(document.querySelectorAll("#s-" + G.scr + " button, #s-" + G.scr + " input"), function(e){ return e.offsetParent; }), ix = vis.indexOf(document.activeElement);
            if(k === 13 || k === 15){ if(vis.length) vis[(ix + 1) % vis.length].focus(); } else if(k === 12 || k === 14){ if(vis.length) vis[(ix - 1 + vis.length) % vis.length].focus(); }
            else if(k === 1 || k === 0 && false){ if(document.activeElement && document.activeElement.click) document.activeElement.click(); }
            else if(k === 0){ var bk = document.querySelector("#s-" + G.scr + " #bSeBack, #s-" + G.scr + " #bHowBack"); if(bk) bk.click(); } } } }
        menuPad.prev = cur;
    }
    menuPad.prev = {};
    setInterval(menuPad, 60);
    // ---- つなぐ ----
    function init(){
        paintText();
        $("bPlay").onclick = function(){ ensureAudio(); show("select"); };
        $("bHow").onclick = function(){ show("how"); }; $("bHowBack").onclick = function(){ show("title"); }; $("bSeBack").onclick = function(){ show("title"); };
        $("bPause").onclick = pause; $("bResume").onclick = resume; $("bRetry").onclick = function(){ G.running = false; clearInterval(G.timer); if(useCtx && ctx.state === "suspended") ctx.resume(); $("pauseBox").classList.remove("on"); G.paused = false; show("select"); begin(); };
        $("bQuit").onclick = quit; $("bReAgain").onclick = function(){ begin(); }; $("bReList").onclick = function(){ show("select"); };
        $("lgBtn").onclick = function(){ lang = LANGS[(LANGS.indexOf(lang) + 1) % 4]; try{ localStorage.setItem("are_lang", lang); }catch(_e){} paintText(); };
        $("exitBtn").onclick = function(){
            if(G.scr === "play"){ if(G.paused){ quit(); } else pause(); return; }
            if(G.scr !== "title"){ show(G.scr === "result" ? "select" : G.scr === "select" || G.scr === "how" ? "title" : "title"); return; }
            try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
            location.href = "../index.html";
        };
        document.addEventListener("keydown", function(e){
            if(e.repeat) return; var k = e.key;
            if(G.scr === "play"){
                if(k === "Escape" || k === "p" || k === "P"){ if(G.paused) resume(); else pause(); e.preventDefault(); return; }
                if(G.paused) return;
                if(k === "f" || k === "F" || k === "j" || k === "J" || k === " " ){ hit("d"); e.preventDefault(); }
                else if(k === "d" || k === "D" || k === "k" || k === "K"){ hit("k"); e.preventDefault(); }
            } else if(k === "Escape" && G.scr !== "title"){ $("exitBtn").click(); }
        });
        Array.prototype.forEach.call(document.querySelectorAll("#drumArea .pad"), function(p){
            p.addEventListener("pointerdown", function(e){ e.preventDefault(); hit(p.dataset.k); });
        });
        window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
        document.addEventListener("visibilitychange", function(){ if(document.hidden) pause(); });
        window.PK = {G: G, hit: hit, now: now, finish: finish, begin: begin, startSong: startSong, pause: pause, resume: resume, lang: function(){ return lang; }};
    }
    init();
})();
