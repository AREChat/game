"use strict";
// ポコポコ太鼓：本体（画面・入力・音・判定）。絵は ぜんぶ このファイルの SVG と canvas で描いた オリジナルです。
// 画面のならびは「太鼓のリズムゲーム」の きほんの形（左上の あいぼう・魂ゲージ・流れる譜面・コンボ）に したがっていますが、
// キャラクター・名前・音・絵は すべて このゲームの オリジナルで、既存の作品とは 関係ありません。
(function(){
    var P = window.PKSongs, S = window.PKSet, DIFFS = P.DIFFS, GENRES = P.GENRES;
    var $ = function(id){ return document.getElementById(id); };
    var LANGS = ["ja", "en", "zh", "ko"];
    var T = {
        sub: {ja: "流れてくる赤と青の音符を、リズムに合わせて たたこう！", en: "Hit the red and blue notes in time with the music!", zh: "跟着节奏，敲打流过来的红蓝音符！", ko: "흘러오는 빨강·파랑 음표를 리듬에 맞춰 두드려요!"},
        note: {ja: "絵も音も、ぜんぶ このゲームのオリジナルです。キーボード・タッチ・ゲームパッドで あそべます。せっていで 自分好みに カスタマイズ！", en: "All art and music are original. Play with keyboard, touch or gamepad. Customize everything in Settings!", zh: "画面和音乐全部为原创。可用键盘、触屏或手柄游玩。", ko: "그림과 음악은 모두 오리지널입니다. 키보드·터치·게임패드로 즐겨요."},
        play: {ja: "あそぶ", en: "Play", zh: "开始", ko: "시작"}, how: {ja: "あそびかた", en: "How to play", zh: "玩法", ko: "하는 법"}, back: {ja: "もどる", en: "Back", zh: "返回", ko: "뒤로"},
        howT: {ja: "あそびかた", en: "How to play", zh: "玩法", ko: "하는 법"},
        howB: {ja: "<b>🔴 赤い音符（ドン）</b>：<b>F・J</b> キー（ふつうの たいこの まんなか）<br><b>🔵 青い音符（カッ）</b>：<b>D・K</b> キー（ふち）<br><b>大きい音符</b>：2ばいの 点です<br><b>🟡 連打</b>：光っている間、どちらでも たくさん たたく<br><b>🎈 風船</b>：決まった回数 たたくと われて ボーナス！<br><b>魂ゲージ</b>：上の ゲージが 旗（クリアライン）を こえたら クリア。<br>スマホは 画面下の たいこを タッチ。ゲームパッドは A B X Y が 赤、L R ZL ZR・十字が 青。<br><b>⚙ せってい</b>で、スクロールの はやさ・色・音・キーなど 自由に えらべます。「曲の はやさ」と「れんしゅう」で 苦手を 練習！", en: "<b>🔴 Red (Don)</b>: <b>F / J</b> keys (the drum face)<br><b>🔵 Blue (Ka)</b>: <b>D / K</b> keys (the rim)<br><b>Big notes</b> = double points<br><b>🟡 Rolls</b>: tap rapidly while it glows<br><b>🎈 Balloons</b>: hit the shown number of times to pop them for a bonus!<br><b>Soul gauge</b>: fill it past the flag to clear.<br>On phones tap the drum at the bottom. Gamepad: A B X Y = red, L R ZL ZR / D-pad = blue.<br>Open <b>⚙ Settings</b> to change scroll speed, colours, sounds, keys and more. Use tempo + practice to master hard parts!"},
        sel: {ja: "曲をえらぼう", en: "Choose a song", zh: "选择歌曲", ko: "곡을 고르세요"}, auto: {ja: "オート", en: "Auto", zh: "自动", ko: "오토"}, prac: {ja: "れんしゅう", en: "Practice", zh: "练习", ko: "연습"},
        sett: {ja: "⚙ せってい", en: "⚙ Settings", zh: "⚙ 设置", ko: "⚙ 설정"}, all: {ja: "すべて", en: "All", zh: "全部", ko: "전체"},
        diff: {ja: ["かんたん", "ふつう", "むずかしい", "おに"], en: ["Easy", "Normal", "Hard", "Oni"], zh: ["简单", "普通", "困难", "鬼"], ko: ["쉬움", "보통", "어려움", "도깨비"]},
        gauge: {ja: "魂", en: "Soul", zh: "魂", ko: "혼"},
        pause: {ja: "ポーズ", en: "Paused", zh: "暂停", ko: "일시정지"}, resume: {ja: "つづける", en: "Resume", zh: "继续", ko: "계속"}, retry: {ja: "もういちど", en: "Retry", zh: "重来", ko: "다시"}, quit: {ja: "曲えらびへ", en: "Song list", zh: "返回选曲", ko: "곡 목록"},
        res: {ja: "けっか", en: "Results", zh: "结果", ko: "결과"}, clear: {ja: "クリア！", en: "CLEARED!", zh: "通关！", ko: "클리어!"}, fail: {ja: "ざんねん…", en: "Not cleared", zh: "未通关", ko: "아쉬워요…"},
        fc: {ja: "フルコンボ！", en: "FULL COMBO!", zh: "全连击！", ko: "풀 콤보!"}, ap: {ja: "ぜんぶ「良」！", en: "ALL PERFECT!", zh: "全部“良”！", ko: "전부 ‘좋음’!"},
        jg: {ja: ["良", "可", "不可"], en: ["Perfect", "Good", "Miss"], zh: ["良", "可", "不可"], ko: ["좋음", "보통", "놓침"]},
        rows: {ja: ["スコア", "良", "可", "不可", "連打", "風船", "さいだいコンボ", "せいかくさ", "魂ゲージ"], en: ["Score", "Perfect", "Good", "Miss", "Roll hits", "Balloons", "Max combo", "Accuracy", "Soul"], zh: ["得分", "良", "可", "不可", "连打", "气球", "最大连击", "准确率", "魂槽"], ko: ["점수", "좋음", "보통", "놓침", "연타", "풍선", "최대 콤보", "정확도", "혼 게이지"]},
        newbest: {ja: "🎉 ベスト更新！", en: "🎉 New best!", zh: "🎉 刷新纪录！", ko: "🎉 최고 기록!"},
        hint: {ja: "赤：F・J　青：D・K　ポーズ：Esc", en: "Red: F/J  Blue: D/K  Pause: Esc", zh: "红：F/J　蓝：D/K　暂停：Esc", ko: "빨강: F/J  파랑: D/K  정지: Esc"},
        best: {ja: "ベスト", en: "Best", zh: "最高", ko: "최고"}, bigAuto: {ja: "（オート）", en: "(Auto)", zh: "（自动）", ko: "(오토)"}, bigPrac: {ja: "（れんしゅう）", en: "(Practice)", zh: "（练习）", ko: "(연습)"},
        go: {ja: "あそぶ！", en: "Play!", zh: "开始！", ko: "시작!"}, close: {ja: "とじる", en: "Close", zh: "关闭", ko: "닫기"}, setT: {ja: "せってい", en: "Settings", zh: "设置", ko: "설정"},
        tabs: {ja: ["演奏", "見た目", "音", "キー"], en: ["Play", "Look", "Sound", "Keys"]},
        early: {ja: "はやい", en: "Early"}, late: {ja: "おそい", en: "Late"}, combo: {ja: "コンボ", en: "COMBO"}, notes: {ja: "ノーツ", en: "notes"},
        reset: {ja: "ぜんぶ もどす", en: "Reset all"}, exp: {ja: "書き出し", en: "Export"}, imp: {ja: "読みこむ", en: "Import"}, preset: {ja: "プリセット", en: "Preset"}, saveP: {ja: "ほぞん", en: "Save"}, loadP: {ja: "よびだし", en: "Load"},
        cal: {ja: "はかる", en: "Calibrate"}, calT: {ja: "判定の ずれを はかる", en: "Measure your timing"}, calP: {ja: "ピッ という 音に あわせて、どれかの キーか たいこを たたいてください（8回い上）。", en: "Tap any key or the drum in time with each beep (8+ times)."},
        calA: {ja: "この値を 使う", en: "Use this value"}, test: {ja: "ためす", en: "Test"}, press: {ja: "キーを おす…", en: "Press a key…"}, name: {ja: "名前", en: "Name"},
        histT: {ja: "魂ゲージの うごき", en: "Soul gauge over time"}, histE: {ja: "たたいた タイミング（左：はやい ／ 右：おそい）", en: "Timing (left: early / right: late)"},
        avgErr: {ja: "平均ずれ", en: "Average"}, daily: {ja: "きょうの1曲", en: "Today's song"}, len: {ja: "長さ", en: "Length"}, playsT: {ja: "あそんだ回数", en: "Plays"},
        pracR: {ja: "れんしゅう：小節", en: "Practice bars"}, pracTo: {ja: "から", en: "to"}, pracNote: {ja: "（くり返しで あそびます。記録は のこりません）", en: "(loops; no records are saved)"},
        practiceStop: {ja: "れんしゅうを おわる", en: "Stop practice"}, balloonLeft: {ja: "あと", en: "x"}
    };
    var lang = "ja";
    try{ var sv = localStorage.getItem("are_lang"); if(LANGS.indexOf(sv) >= 0) lang = sv; }catch(_e){}
    function tl(o){ return o ? (o[lang] || o.en || o.ja) : ""; }
    function t(k){ var v = T[k]; return v ? (v[lang] || v.en || v.ja) : k; }
    var cfg = S.get();
    // ---- あいぼう（太鼓のこ）。きせかえ：色と ざっくりした 飾り ----
    function mascotSvg(skin, id){
        var sk = S.SKINS[skin] || S.SKINS[0], b = sk.body, e = sk.edge, ext = "";
        if(sk.ext === "cat") ext = '<path d="M20 34 L16 8 L38 24 Z" fill="' + b + '" stroke="' + e + '" stroke-width="3"/><path d="M80 34 L84 8 L62 24 Z" fill="' + b + '" stroke="' + e + '" stroke-width="3"/>';
        else if(sk.ext === "horn") ext = '<path d="M26 28 L20 6 L38 22 Z" fill="#fff4cc" stroke="#8a6a2a" stroke-width="2.5"/><path d="M74 28 L80 6 L62 22 Z" fill="#fff4cc" stroke="#8a6a2a" stroke-width="2.5"/>';
        else if(sk.ext === "bunny") ext = '<ellipse cx="30" cy="12" rx="8" ry="20" fill="' + b + '" stroke="' + e + '" stroke-width="3"/><ellipse cx="70" cy="12" rx="8" ry="20" fill="' + b + '" stroke="' + e + '" stroke-width="3"/><ellipse cx="30" cy="14" rx="3.5" ry="13" fill="#ffd0e4"/><ellipse cx="70" cy="14" rx="3.5" ry="13" fill="#ffd0e4"/>';
        else if(sk.ext === "star") ext = '<path d="M50 -4 L55 9 L69 9 L58 17 L62 30 L50 22 L38 30 L42 17 L31 9 L45 9 Z" fill="#ffe27a" stroke="#a07a0a" stroke-width="2.5" transform="translate(0 4)"/>';
        return '<svg viewBox="-6 -8 112 112" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="mg' + id + '" cx="50%" cy="35%"><stop offset="0" stop-color="#fff3e0"/><stop offset="1" stop-color="#ffd9a8"/></radialGradient></defs>' +
            '<ellipse cx="50" cy="94" rx="30" ry="5" fill="#0004"/>' + ext +
            '<g class="body"><rect x="14" y="26" width="72" height="62" rx="22" fill="' + b + '"/><rect x="14" y="26" width="72" height="62" rx="22" fill="none" stroke="' + e + '" stroke-width="3"/>' +
            '<ellipse cx="50" cy="30" rx="36" ry="14" fill="url(#mg' + id + ')" stroke="' + e + '" stroke-width="3"/>' +
            '<g class="mNorm"><circle cx="38" cy="52" r="7" fill="#fff"/><circle cx="62" cy="52" r="7" fill="#fff"/><circle cx="39.5" cy="53" r="3.6" fill="#2a1450"/><circle cx="63.5" cy="53" r="3.6" fill="#2a1450"/><path d="M40 66 Q50 76 60 66" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g>' +
            '<g class="mHappy"><path d="M31 54 Q38 45 45 54" fill="none" stroke="#2a1450" stroke-width="3.5" stroke-linecap="round"/><path d="M55 54 Q62 45 69 54" fill="none" stroke="#2a1450" stroke-width="3.5" stroke-linecap="round"/><path d="M38 62 Q50 82 62 62 Z" fill="#7a1a1a" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/></g>' +
            '<g class="mSad"><path d="M31 49 L45 55 M69 49 L55 55" stroke="#2a1450" stroke-width="3.5" stroke-linecap="round"/><path d="M40 72 Q50 62 60 72" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g>' +
            '<path class="sweat" d="M80 36 Q86 46 80 50 Q74 46 80 36Z" fill="#9adcff"/>' +
            '<g class="mFever"><path d="M20 40 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1Z" fill="#ffe27a" opacity=".9"/><path d="M82 70 l2 4 l4 1 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -1Z" fill="#ffe27a" opacity=".9"/></g>' +
            '<circle cx="29" cy="62" r="4.5" fill="#ff9a8a" opacity=".8"/><circle cx="71" cy="62" r="4.5" fill="#ff9a8a" opacity=".8"/></g>' +
            '<g transform="rotate(-24 22 38)"><g class="stickL"><rect x="19" y="4" width="6" height="34" rx="3" fill="#f2d08a" stroke="#8a5a2a" stroke-width="1.6"/></g></g>' +
            '<g transform="rotate(24 78 38)"><g class="stickR"><rect x="75" y="4" width="6" height="34" rx="3" fill="#f2d08a" stroke="#8a5a2a" stroke-width="1.6"/></g></g></svg>';
    }
    // ---- 状態 ----
    var G = {scr: "title", song: null, diff: 0, auto: false, practice: false, notes: [], music: [], mi: 0, ni: 0, startAt: 0, running: false, paused: false, ended: false, rate: 1, bs: .5,
             score: 0, combo: 0, maxCombo: 0, g: 0, o: 0, m: 0, roll: 0, balloons: 0, gauge: 0, gainG: 0, gainO: 0, loss: 0, total: 0, fx: [], fly: [], fw: [], gh: [], errs: [], timer: 0, pausedAt: 0,
             jT: -9, jTxt: "", jCol: "#fff", fsT: -9, fsTxt: "", comboT: -9, soulT: -9, sadT: -9, lastBeat: -1, lastGh: -1, pad: {}};
    var SEL = {genre: "all", song: 0, diff: 2, list: [], prac: {a: 1, b: 8}};
    var ctx = null, master = null, busM = null, busS = null, useCtx = false, noiseBuf = null;
    function clock(){ return useCtx ? ctx.currentTime : performance.now() / 1000; }
    function now(){ return clock() - G.startAt; }
    function ensureAudio(){
        if(!ctx){
            try{ var AC = window.AudioContext || window.webkitAudioContext; if(AC){ ctx = new AC(); master = ctx.createGain(); busM = ctx.createGain(); busS = ctx.createGain(); busM.connect(master); busS.connect(master); master.connect(ctx.destination); applyVolumes();
                noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate); var d = noiseBuf.getChannelData(0); for(var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } }catch(_e){ ctx = null; }
        }
        return ctx ? ctx.resume().catch(function(){}) : Promise.resolve();
    }
    function applyVolumes(){ if(!ctx) return; master.gain.value = cfg.vMaster * 0.9; busM.gain.value = cfg.vMusic; busS.gain.value = cfg.vSe; }
    // ---- 音（ぜんぶ その場で作る） ----
    function tone(type, f, at, dur, vol, f2, bus){
        if(!useCtx) return; var o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, at); if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), at + dur);
        g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); o.connect(g); g.connect(bus || busM); o.start(at); o.stop(at + dur + 0.02);
    }
    function noise(at, dur, vol, hp, bus){
        if(!useCtx || !noiseBuf) return; var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = hp;
        g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); s.connect(f); f.connect(g); g.connect(bus || busM); s.start(at); s.stop(at + dur + 0.02);
    }
    var SE = [
        {don: function(a, v){ tone("sine", 190, a, .16, .9 * v, 70, busS); noise(a, .05, .25 * v, 800, busS); }, ka: function(a, v){ tone("triangle", 1100, a, .06, .45 * v, 700, busS); noise(a, .07, .5 * v, 3000, busS); }},
        {don: function(a, v){ tone("sine", 700, a, .09, .8 * v, 420, busS); tone("triangle", 1400, a, .03, .3 * v, 0, busS); }, ka: function(a, v){ tone("sine", 1250, a, .05, .6 * v, 900, busS); noise(a, .03, .3 * v, 5000, busS); }},
        {don: function(a, v){ tone("square", 330, a, .1, .35 * v, 160, busS); }, ka: function(a, v){ tone("square", 1320, a, .06, .25 * v, 880, busS); }},
        {don: function(a, v){ noise(a, .09, .7 * v, 1200, busS); tone("sine", 150, a, .08, .5 * v, 80, busS); }, ka: function(a, v){ noise(a, .05, .8 * v, 4500, busS); }},
        {don: function(a, v){ tone("sine", 150, a, .2, 1 * v, 50, busS); noise(a, .08, .35 * v, 1500, busS); }, ka: function(a, v){ noise(a, .14, .7 * v, 2500, busS); tone("triangle", 220, a, .08, .3 * v, 0, busS); }}
    ];
    function sfx(kind, big){ if(!useCtx) return; var a = ctx.currentTime, p = SE[cfg.sePack] || SE[0], v = big ? 1.35 : 1; if(kind === "d") p.don(a, v); else p.ka(a, v); if(big) tone("sine", 90, a, .18, .5, 50, busS); }
    function playMusicEvent(e, at){
        var d = e.d / G.rate;
        if(e.k === "click"){ tone("square", e.v ? 1500 : 1000, at, .04, .12, 0, busS); return; }
        if(!cfg.music) return;
        if(e.k === "kick") tone("sine", 120, at, 0.14, 0.32, 45);
        else if(e.k === "snare"){ noise(at, .12, .22, 1800); tone("triangle", 200, at, .08, .14, 120); }
        else if(e.k === "hat") noise(at, d, 0.07 * (e.v || 1), 7000);
        else if(e.k === "crash") noise(at, .6, .12, 4000);
        else if(e.k === "bass") tone("triangle", e.f, at, d, 0.32);
        else if(e.k === "lead") tone("square", e.f, at, d, 0.07);
        else if(e.k === "arp") tone("sawtooth", e.f, at, d, 0.035);
        else if(e.k === "chord") e.f.forEach(function(f){ tone("sine", f, at, d, 0.06); });
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
    // ---- きろく ----
    function songKey(s){ return s.id === "daily" ? "daily_" + s.seed : s.id; }
    function bestKey(s, d){ return "are_pk_best_v2_" + songKey(s) + "_" + d; }
    function getBest(s, d){ try{ var v = JSON.parse(localStorage.getItem(bestKey(s, d)) || "null"); return v && typeof v.score === "number" ? v : null; }catch(_e){ return null; } }
    function setBest(s, d, v){ try{ localStorage.setItem(bestKey(s, d), JSON.stringify(v)); }catch(_e){} }
    function crownRank(c){ return c === "👑" ? 3 : c === "🥇" ? 2 : c === "🥈" ? 1 : 0; }
    function crownOf(r){ return r.ap ? "👑" : r.fc ? "🥇" : r.clear ? "🥈" : ""; }
    function bumpStats(hits){ try{ var v = JSON.parse(localStorage.getItem("are_pk_stats_v1") || "{}"); v.plays = (v.plays || 0) + 1; v.hits = (v.hits || 0) + hits; localStorage.setItem("are_pk_stats_v1", JSON.stringify(v)); }catch(_e){} }
    function getStats(){ try{ return JSON.parse(localStorage.getItem("are_pk_stats_v1") || "{}"); }catch(_e){ return {}; } }
    var chartCache = {};
    function chartOf(s, d){ var k = songKey(s) + "_" + d; return chartCache[k] || (chartCache[k] = P.makeChart(s, d)); }
    function paintText(){
        $("tSub").textContent = t("sub"); $("tNote").textContent = t("note"); $("bPlay").textContent = t("play"); $("bHow").textContent = t("how"); $("bSetT").textContent = t("sett"); $("bHowBack").textContent = t("back"); $("bSeBack").textContent = t("back");
        $("hT").textContent = t("howT"); $("hBody").innerHTML = t("howB"); $("seT").textContent = t("sel"); $("seAuto").textContent = t("auto"); $("sePrac").textContent = t("prac"); $("bSetS").textContent = t("sett"); $("bGo").textContent = t("go");
        $("paT").textContent = t("pause"); $("bResume").textContent = t("resume"); $("bRetry").textContent = t("retry"); $("bSetP").textContent = t("sett"); $("bQuit").textContent = t("quit");
        $("reT").textContent = t("res"); $("bReAgain").textContent = t("retry"); $("bReList").textContent = t("quit"); $("gLab1").textContent = t("histT"); $("gLab2").textContent = t("histE");
        $("exitBtn").textContent = "← " + t("back"); $("lgBtn").textContent = {ja: "日本語", en: "English", zh: "中文", ko: "한국어"}[lang]; document.documentElement.lang = lang;
        $("stT").textContent = t("setT"); $("bSetClose").textContent = t("close"); $("caT").textContent = t("calT"); $("caP").textContent = t("calP"); $("bCaApply").textContent = t("calA"); $("bCaClose").textContent = t("close");
        document.title = {ja: "ポコポコ太鼓｜リズムでたたく お祭りゲーム", en: "Poko-Poko Drum | A festival rhythm game", zh: "咚咚太鼓｜节奏敲鼓庙会游戏", ko: "포코포코 북｜리듬 축제 게임"}[lang];
        paintMascots(); var l1 = document.querySelector(".logo .l1"), l2 = document.querySelector(".logo .l2");
        var lg = {ja: ["ポコポコ", "太鼓"], en: ["Poko-Poko", "Drum"], zh: ["咚咚", "太鼓"], ko: ["포코포코", "북"]}[lang]; l1.textContent = lg[0]; l2.textContent = lg[1];
        $("keyHint").textContent = keyHintText(); paintSelect();
    }
    function keyName(k){ return k === " " ? "Space" : k.length === 1 ? k.toUpperCase() : k; }
    function keyHintText(){ return {ja: "赤：" + keyName(cfg.kd1) + "・" + keyName(cfg.kd2) + "　青：" + keyName(cfg.kk1) + "・" + keyName(cfg.kk2) + "　ポーズ：Esc", en: "Red: " + keyName(cfg.kd1) + "/" + keyName(cfg.kd2) + "  Blue: " + keyName(cfg.kk1) + "/" + keyName(cfg.kk2) + "  Pause: Esc"}[lang === "ja" ? "ja" : "en"]; }
    function paintMascots(){
        $("mascotT").innerHTML = mascotSvg(cfg.skin, "t"); $("mascotP").innerHTML = '<div class="inner">' + mascotSvg(cfg.skin, "p") + "</div>";
        $("mascotP").style.display = cfg.sMascot ? "" : "none"; $("mascotP").classList.toggle("calm", !!cfg.calm);
    }
    // ---- 曲えらび ----
    function allSongs(){ return [P.daily()].concat(P.SONGS); }
    function visibleSongs(){ var all = allSongs(); return SEL.genre === "all" ? all : all.filter(function(s){ return s.genre === SEL.genre; }); }
    function genreOf(s){ for(var i = 0; i < GENRES.length; i++) if(GENRES[i].id === s.genre) return GENRES[i]; return GENRES[1]; }
    function bestCrown(s){ var c = ""; for(var d = 0; d < 4; d++){ var b = getBest(s, d); if(b && crownRank(b.crown) > crownRank(c)) c = b.crown; } return c; }
    function fmtTime(sec){ return Math.floor(sec / 60) + ":" + ("0" + Math.round(sec % 60)).slice(-2); }
    function paintSelect(){
        var tabs = $("genreTabs"); tabs.innerHTML = "";
        [{id: "all", color: "#ff7a4a", name: {ja: "すべて", en: "All", zh: "全部", ko: "전체"}}].concat(GENRES).forEach(function(g){ var b = document.createElement("button"); b.type = "button"; b.textContent = g.name[lang] || g.name.en; b.style.setProperty("--c", g.color); if(SEL.genre === g.id) b.className = "on";
            b.onclick = function(){ SEL.genre = g.id; SEL.song = 0; paintSelect(); }; tabs.appendChild(b); });
        SEL.list = visibleSongs(); if(SEL.song >= SEL.list.length) SEL.song = Math.max(0, SEL.list.length - 1);
        var box = $("songList"); box.innerHTML = "";
        SEL.list.forEach(function(s, si){
            var row = document.createElement("div"); row.className = "song" + (si === SEL.song ? " on" : ""); row.style.setProperty("--c", s.color); row.setAttribute("role", "option");
            var cr = bestCrown(s); row.innerHTML = '<div class="nm"><b></b><small></small></div><div class="cr"></div>';
            row.querySelector("b").textContent = (s.daily ? "📅 " : "") + (s.name[lang] || s.name.en || s.name.ja); row.querySelector("small").textContent = tl(genreOf(s).name) + "　♩=" + s.bpm; row.querySelector(".cr").textContent = cr;
            row.onclick = function(){ SEL.song = si; paintSelect(); }; box.appendChild(row);
            if(si === SEL.song) setTimeout(function(){ try{ row.scrollIntoView({block: "nearest"}); }catch(_e){} }, 0);
        });
        paintDetail();
    }
    function paintDetail(){
        var s = SEL.list[SEL.song]; if(!s) return; var g = genreOf(s);
        $("dGenre").textContent = tl(g.name); $("dGenre").style.setProperty("--c", g.color); $("dName").textContent = s.name[lang] || s.name.en || s.name.ja;
        var dur = s.bars * 240 / s.bpm; $("dMeta").textContent = "♩=" + s.bpm + "　" + t("len") + " " + fmtTime(dur) + (s.daily ? "　" + t("daily") : "");
        var df = $("dDiffs"); df.innerHTML = "";
        for(var d = 0; d < 4; d++){ (function(d){ var st = P.chartStats(chartOf(s, d)), bb = getBest(s, d), bt = document.createElement("button"); bt.type = "button"; bt.style.setProperty("--d", DIFFS[d].color + "cc"); if(d === SEL.diff) bt.className = "on";
            bt.innerHTML = t("diff")[d] + "<small>★" + s.stars[d] + "　" + st.notes + t("notes") + (bb && bb.crown ? "　" + bb.crown : "") + "</small>"; bt.onclick = function(){ SEL.diff = d; paintDetail(); }; df.appendChild(bt); })(d); }
        var b = getBest(s, SEL.diff), stt = getStats();
        $("dBest").innerHTML = b ? t("best") + "：<b>" + b.score + "</b>　" + (b.acc !== undefined ? b.acc.toFixed(1) + "%　" : "") + (b.rank || "") + " " + (b.crown || "") : t("best") + "：—";
        if(stt.plays) $("dBest").innerHTML += "<br><small>" + t("playsT") + "：" + stt.plays + "</small>";
        var pr = $("dPrac"); pr.classList.toggle("on", $("pracBox").checked);
        if($("pracBox").checked){ var mx = s.bars - 1; SEL.prac.b = Math.min(SEL.prac.b, mx); SEL.prac.a = Math.min(SEL.prac.a, SEL.prac.b); pr.innerHTML = t("pracR") + ' <input id="pA" type="number" min="1" max="' + mx + '" value="' + SEL.prac.a + '"> ' + t("pracTo") + ' <input id="pB" type="number" min="1" max="' + mx + '" value="' + SEL.prac.b + '"> <small>' + t("pracNote") + "</small>";
            $("pA").onchange = function(){ SEL.prac.a = Math.max(1, Math.min(mx, +this.value || 1)); if(SEL.prac.b < SEL.prac.a) SEL.prac.b = SEL.prac.a; paintDetail(); }; $("pB").onchange = function(){ SEL.prac.b = Math.max(SEL.prac.a, Math.min(mx, +this.value || mx)); paintDetail(); }; }
    }
    function moveSong(d){ if(!SEL.list.length) return; SEL.song = (SEL.song + d + SEL.list.length) % SEL.list.length; paintSelect(); }
    function moveDiff(d){ SEL.diff = (SEL.diff + d + 4) % 4; paintDetail(); }
    // ---- 曲のはじまり ----
    var countTimer = 0;
    function startSelected(){ var s = SEL.list[SEL.song]; if(!s) return; startSong(s, SEL.diff); }
    function startSong(s, d, o){
        o = o || {}; G.song = s; G.diff = d; G.auto = o.auto !== undefined ? o.auto : $("autoBox").checked; G.practice = o.practice !== undefined ? o.practice : $("pracBox").checked; G.pr = o.pr || {a: SEL.prac.a, b: SEL.prac.b};
        ensureAudio().then(function(){ useCtx = !!(ctx && ctx.state === "running"); begin(); });
        setTimeout(function(){ if(G.scr !== "play"){ useCtx = !!(ctx && ctx.state === "running"); begin(); } }, 600);
    }
    function begin(){
        if(G.scr === "play" || G.beginning) return; G.beginning = true;
        var s = G.song, rate = cfg.rate, bar = 240 / s.bpm, chart = chartOf(s, G.diff).map(function(n){ return {t: n.t, type: n.type, end: n.end, need: n.need, done: false, hits: 0, res: ""}; }), music = P.makeMusic(s).map(function(e){ return {t: e.t, k: e.k, f: e.f, d: e.d, v: e.v}; });
        G.rate = rate; G.bs = 60 / (s.bpm * rate); G.shift = 0; G.loopEnd = 0;
        if(G.practice){ var a = Math.max(1, G.pr.a), b = Math.min(s.bars - 1, G.pr.b), sh = (a - 1) * bar; G.shift = sh; G.loopEnd = (b + 1) * bar - sh;
            chart = chart.filter(function(n){ return n.t >= a * bar - 1e-6 && n.t < (b + 1) * bar - 1e-6; }); music = music.filter(function(e){ return e.t >= (a - 1) * bar - 1e-6 && e.t < (b + 1) * bar; }); }
        // いれかえ（あかと あおを ぎゃくに／ランダム）
        if(cfg.mod){ var R = P.rng(s.seed * 17 + G.diff + 3); chart.forEach(function(n){ var flip = cfg.mod === 1 || R() < .5; if(flip && n.type === "d") n.type = "k"; else if(flip && n.type === "k") n.type = "d"; else if(flip && n.type === "D") n.type = "K"; else if(flip && n.type === "K") n.type = "D"; }); }
        var lead = G.practice ? bar : 0;
        chart.forEach(function(n){ n.t = (n.t - G.shift) / rate; if(n.end !== undefined) n.end = (n.end - G.shift) / rate; });
        music.forEach(function(e){ e.t = (e.t - G.shift) / rate; });
        if(cfg.metro){ var nb = Math.ceil((s.bars * bar / rate) / G.bs); for(var q = 0; q < nb; q++) music.push({t: q * G.bs, k: "click", v: q % 4 === 0 ? 1 : 0, d: .04}); music.sort(function(x, y){ return x.t - y.t; }); }
        G.notes = chart; G.music = music; G.mi = 0; G.ni = 0; G.score = 0; G.combo = 0; G.maxCombo = 0; G.g = 0; G.o = 0; G.m = 0; G.roll = 0; G.balloons = 0; G.gauge = 0; G.fx = []; G.fly = []; G.fw = []; G.gh = []; G.errs = []; G.lastGh = -1; G.lastBeat = -1;
        G.ended = false; G.paused = false; G.running = false; G.jT = -9; G.comboT = -9; G.sadT = -9; G.soulT = -9;
        var cnt = G.notes.filter(function(n){ return n.type !== "r" && n.type !== "R" && n.type !== "b"; }).length; G.total = Math.max(1, cnt);
        G.gainG = 100 / G.total * 1.45; G.gainO = G.gainG * 0.5; G.loss = 100 / G.total * 2.2;
        G.lastNote = G.notes.length ? Math.max(G.notes[G.notes.length - 1].t, G.notes[G.notes.length - 1].end || 0) : 1;
        $("songBanner").textContent = (s.name[lang] || s.name.en || s.name.ja) + "　" + t("diff")[G.diff] + (G.auto ? " " + t("bigAuto") : "") + (G.practice ? " " + t("bigPrac") : "") + (rate !== 1 ? " ×" + rate : "");
        $("pScore").textContent = "0"; $("pauseBox").classList.remove("on");
        G.startAt = clock() + 100; show("play"); resize(); mascotState("");
        var n = cfg.count; clearInterval(countTimer);
        if(n <= 0){ go(); } else { $("countBox").classList.add("on"); $("countNum").textContent = n; countTimer = setInterval(function(){ n--; if(n > 0){ $("countNum").textContent = n; } else { clearInterval(countTimer); $("countBox").classList.remove("on"); go(); } }, 700); }
        G.beginning = false; cancelAnimationFrame(G.raf); loop();
    }
    function go(){
        G.startAt = clock() + 0.8 + (G.practice ? 0 : 0); G.running = true; G.ended = false; clearInterval(G.timer); G.timer = setInterval(schedule, 30);
        $("mascotP").style.setProperty("--bpm", G.bs * 2 + "s");
    }
    // ---- 入力と判定 ----
    var W0 = {good: 0.050, ok: 0.100, bad: 0.135};
    function wnd(){ var m = [1.3, 1, .75][cfg.strict]; return {good: W0.good * m, ok: W0.ok * m, bad: W0.bad * m}; }
    function hit(kind){
        if(G.scr !== "play") return;
        if(!G.running || G.paused || G.auto){ if(!G.paused) { sfx(kind, false); flashPad(kind); } return; }
        flashPad(kind); mascotHit(kind); if(cfg.vib && navigator.vibrate) try{ navigator.vibrate(8); }catch(_e){}
        var tm = now() - cfg.offset / 1000, big = judge(kind, tm); sfx(kind, big);
    }
    function judge(kind, tm){
        var W = wnd(), best = null, i, n, isD;
        for(i = G.ni; i < G.notes.length; i++){ n = G.notes[i]; if(n.done) continue; if(n.t - tm > W.bad) break;
            if(n.type === "r" || n.type === "R" || n.type === "b"){
                if(tm >= n.t - 0.02 && tm <= n.end + 0.05){ n.hits++; var big = n.type === "R"; if(n.type === "b"){ addScore(300); fxBurst(0, "#ff9ac8", false); if(n.hits >= n.need){ n.done = true; G.balloons++; addScore(5000); G.gauge = Math.min(100, G.gauge + G.gainG * 2); fxBurst(0, "#ffd24a", true); popText(t("balloonLeft") === "x" ? "POP!" : "パーン！", "#ffd24a"); mascotJump(); paintHud(); } }
                    else { G.roll++; addScore(big ? 600 : 300); fxBurst(0, "#ffd24a", false); } return false; }
                continue; }
            if(Math.abs(n.t - tm) <= W.bad){ best = n; break; } }
        if(!best) return false;
        isD = best.type === "d" || best.type === "D"; var ok = (kind === "d") === isD, dt = Math.abs(best.t - tm), bigN = best.type === "D" || best.type === "K";
        if(!ok){ if(dt > W.ok) return bigN; best.done = true; best.res = "m"; missNote(best); return bigN; }
        var err = (tm - best.t) * 1000;
        if(dt <= W.good) good(best, 0, bigN, err); else if(dt <= W.ok) good(best, 1, bigN, err); else { best.done = true; best.res = "m"; missNote(best); }
        return bigN;
    }
    function good(n, grade, big, err){
        n.done = true; n.res = grade ? "o" : "g"; G.combo++; if(G.combo > G.maxCombo) G.maxCombo = G.combo; G.comboT = clock();
        if(grade){ G.o++; G.gauge = Math.min(100, G.gauge + G.gainO); } else { G.g++; G.gauge = Math.min(100, G.gauge + G.gainG); }
        G.errs.push(err);
        var base = (grade ? 500 : 1000) + Math.min(G.combo, 100) * 10; addScore(big ? base * 2 : base);
        var isD = n.type === "d" || n.type === "D"; fxBurst(isD ? 0 : 1, isD ? noteCol(0) : noteCol(1), big);
        G.fly.push({t0: clock(), c: isD ? noteCol(0) : noteCol(1)});
        popText(t("jg")[grade], grade ? "#ffd24a" : "#fff");
        if(Math.abs(err) > 25 && cfg.sFast){ G.fsT = clock(); G.fsTxt = (err < 0 ? t("early") : t("late")) + " " + Math.abs(Math.round(err)) + "ms"; G.fsCol = err < 0 ? "#7ad0ff" : "#ff9a7a"; }
        var c = G.combo; if(c === 10 || c === 25) mascotState("happy"); if(c % 50 === 0){ mascotJump(); if(cfg.fx) firework(cfg.fx === 2 ? 3 : 1); }
        if(G.gauge >= cfg.clearAt) mascotFever(true); paintHud();
    }
    function missNote(n){
        if(!n.done){ n.done = true; n.res = "m"; }
        G.m++; G.combo = 0; G.gauge = Math.max(0, G.gauge - G.loss); popText(t("jg")[2], "#8a9aff"); G.sadT = clock(); mascotState("sad"); if(G.gauge < cfg.clearAt) mascotFever(false); paintHud();
    }
    function popText(txt, col){ G.jT = clock(); G.jTxt = txt; G.jCol = col; }
    function addScore(v){ G.score += v; }
    function paintHud(){ $("pScore").textContent = G.score; var tot = G.g + G.o + G.m, acc = tot ? (G.g + G.o * .5) / tot * 100 : 100; $("pSub").textContent = acc.toFixed(1) + "%　" + (G.maxCombo ? "MAX " + G.maxCombo : ""); }
    function noteCol(k){ return S.NOTE_COLORS[k ? cfg.kaC : cfg.donC].d[k ? 1 : 0]; }
    // ---- あいぼう ----
    var mState = "", mTimer = 0;
    function mascotState(s){ var m = $("mascotP"); m.classList.remove("happy", "sad"); mState = s; if(s) m.classList.add(s); clearTimeout(mTimer); if(s === "sad") mTimer = setTimeout(function(){ if(mState === "sad"){ m.classList.remove("sad"); mState = ""; if(G.combo >= 10) m.classList.add("happy"); } }, 900); }
    function mascotFever(on){ $("mascotP").classList.toggle("fever", !!on); }
    function mascotJump(){ var m = $("mascotP"); m.classList.remove("jump"); void m.offsetWidth; m.classList.add("jump"); setTimeout(function(){ m.classList.remove("jump"); }, 520); }
    var hitFlip = 0;
    function mascotHit(kind){ var m = $("mascotP"); hitFlip ^= 1; var c = hitFlip ? "hitL" : "hitR"; m.classList.add(c, "hit"); clearTimeout(m._t); m._t = setTimeout(function(){ m.classList.remove("hitL", "hitR", "hit"); }, 80); }
    function flashPad(kind){ Array.prototype.forEach.call(document.querySelectorAll('#drumArea .pad[data-k="' + kind + '"]'), function(p){ p.classList.add("down"); clearTimeout(p._t); p._t = setTimeout(function(){ p.classList.remove("down"); }, 90); }); }
    function fxBurst(k, color, big){ if(!cfg.fx) return; var n = (big ? 14 : 7) * (cfg.fx === 2 ? 1 : .5); for(var i = 0; i < n; i++) G.fx.push({x: 0, y: 0, vx: (Math.random() - 0.2) * 300, vy: (Math.random() - 0.5) * 300, life: .45, c: color, ring: 0}); G.fx.push({x: 0, y: 0, vx: 0, vy: 0, life: .3, c: color, ring: 1, big: big}); }
    function firework(n){ for(var q = 0; q < n; q++){ var cx = .15 + Math.random() * .7, cy = .06 + Math.random() * .22, hue = Math.floor(Math.random() * 360); for(var i = 0; i < 26; i++){ var a = i / 26 * 6.283, sp = 90 + Math.random() * 90; G.fw.push({x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.1, h: hue}); } } }
    // ---- 描く：画面の大きさ ----
    var cv, cx2, bgv, bgx, dpr = 1, LW = 0, LH = 0, BW = 0, BH = 0, GEO = {};
    function resize(){
        cv = $("lane"); bgv = $("bg"); if(!cv || !bgv) return; dpr = Math.min(2, window.devicePixelRatio || 1);
        var st = $("stage").getBoundingClientRect(), SW = Math.max(300, st.width), SH = Math.max(200, st.height);
        var bandH = Math.max(64, Math.min(SH * 0.2, 170, SW * 0.24)) * cfg.laneS, gaugeH = bandH * 0.36, pat = Math.round(Math.max(10, bandH * .16)), strip = Math.round(bandH * .2), wrapH = pat + gaugeH + bandH + strip, cyTarget = SH * cfg.laneY, wrapTop = Math.max(46, Math.min(SH - wrapH - 90, cyTarget - bandH / 2 - gaugeH - pat));
        var w = $("laneWrap"); w.style.top = wrapTop + "px"; w.style.height = wrapH + "px";
        var r = cv.getBoundingClientRect(); LW = Math.max(200, r.width); LH = Math.max(80, r.height); cv.width = Math.round(LW * dpr); cv.height = Math.round(LH * dpr); cx2 = cv.getContext("2d"); cx2.setTransform(dpr, 0, 0, dpr, 0, 0);
        bgv.width = Math.round(SW * dpr * .75); bgv.height = Math.round(SH * dpr * .75); BW = SW; BH = SH; bgx = bgv.getContext("2d"); bgx.setTransform(dpr * .75, 0, 0, dpr * .75, 0, 0);
        GEO = {wrapTop: wrapTop, wrapH: wrapH, gh: gaugeH, pat: pat, strip: strip, bandTop: pat + gaugeH, bandH: bandH};
        var mS = Math.max(58, Math.min(wrapTop - 54, SW * 0.22, 200)), mm = $("mascotP"); mm.style.width = mm.style.height = mS + "px"; mm.style.left = "10px"; mm.style.top = Math.max(46, wrapTop - mS - 2) + "px";
        var sb = $("scoreBox"); sb.style.top = (wrapTop + wrapH + 4) + "px"; sb.style.display = cfg.sScore ? "" : "none";
        var da = $("drumArea"); da.style.top = (wrapTop + wrapH + 46) + "px"; da.style.height = "auto"; da.style.bottom = "14px";
        $("stage").style.setProperty("--don", noteCol(0)); $("stage").style.setProperty("--ka", noteCol(1)); document.documentElement.style.setProperty("--don", noteCol(0)); document.documentElement.style.setProperty("--ka", noteCol(1));
    }
    // ---- 描く：背景 ----
    var stars = [], petals = [];
    for(var si0 = 0; si0 < 60; si0++){ stars.push({x: Math.random(), y: Math.random() * .5, r: Math.random() * 1.4 + .4, p: Math.random() * 6}); }
    for(si0 = 0; si0 < 26; si0++){ petals.push({x: Math.random(), y: Math.random(), s: Math.random() * 6 + 4, v: Math.random() * .06 + .04, p: Math.random() * 6}); }
    function drawBg(tm, dt){
        if(!bgx) return; var c = bgx, W = BW, H = BH, th = S.THEMES[cfg.theme] || S.THEMES[0], beat = G.bs ? (tm / G.bs) : 0, ph = beat - Math.floor(beat), pulse = cfg.calm ? 0 : Math.pow(1 - ph, 3), fever = G.gauge >= cfg.clearAt, anim = cfg.bgAnim ? 1 : 0, tt = clock();
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.top); g.addColorStop(1, th.bot); c.fillStyle = g; c.fillRect(0, 0, W, H);
        if(th.star){ for(var i = 0; i < stars.length; i++){ var s = stars[i]; c.globalAlpha = .4 + .5 * Math.abs(Math.sin(tt * (anim ? 1.2 : 0) + s.p)); c.fillStyle = "#fff"; c.fillRect(s.x * W, s.y * H, s.r, s.r); } c.globalAlpha = 1; }
        // 月・太陽
        var gx = W * .82, gy = H * .2; var gr = c.createRadialGradient(gx, gy, 4, gx, gy, H * .32); gr.addColorStop(0, th.glow + "cc"); gr.addColorStop(1, th.glow + "00"); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.fillStyle = th.glow; c.beginPath(); c.arc(gx, gy, H * .05, 0, 7); c.fill();
        // 遠くの 山
        for(var L = 0; L < 2; L++){ c.fillStyle = th.hill[L]; c.beginPath(); c.moveTo(0, H); var off = anim * tt * (8 + L * 10); for(var x = 0; x <= W + 10; x += 10){ c.lineTo(x, H * (.56 + L * .1) - Math.sin((x + off) * (.006 + L * .004) + L * 2) * H * .05 - Math.sin((x + off) * .017 + L) * H * .02); } c.lineTo(W, H); c.closePath(); c.fill(); }
        if(th.wave){ c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; for(var w = 0; w < 4; w++){ c.beginPath(); for(var xx = 0; xx <= W; xx += 12){ var yy = H * (.7 + w * .05) + Math.sin(xx * .02 + tt * anim * 1.4 + w) * 5; if(xx === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy); } c.stroke(); } }
        if(th.petals){ c.fillStyle = "#ffd0e8"; for(i = 0; i < petals.length; i++){ var p = petals[i], py = (p.y + tt * anim * p.v) % 1.1, px = p.x + Math.sin(tt * anim * .8 + p.p) * .03; c.globalAlpha = .75; c.beginPath(); c.ellipse(px * W, py * H, p.s * .6, p.s * .35, tt * anim + p.p, 0, 7); c.fill(); } c.globalAlpha = 1; }
        // ちょうちんの なわ
        var colors = ["#ee4b3a", "#ffd24a", "#37a2ee", "#7ad66a", "#ff8ac0"], yb = H * .06;
        c.strokeStyle = "#0008"; c.lineWidth = 2; c.beginPath(); for(var xs = 0; xs <= W; xs += 12){ var ys = yb + Math.sin(xs / W * 3.14) * H * .03; if(xs === 0) c.moveTo(xs, ys); else c.lineTo(xs, ys); } c.stroke();
        var nl = Math.max(5, Math.round(W / 120));
        for(i = 0; i < nl; i++){ var lx = (i + .5) / nl * W, ly = yb + Math.sin(lx / W * 3.14) * H * .03 + 6 + (anim ? Math.sin(tt * 2 + i) * 2 : 0), col = colors[i % 5], rr = Math.min(18, H * .035);
            c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 8 + pulse * 18 + (fever ? 10 : 0); c.beginPath(); c.ellipse(lx, ly + rr, rr * .8, rr, 0, 0, 7); c.fill(); c.shadowBlur = 0; c.fillStyle = "#0006"; c.fillRect(lx - rr * .3, ly + rr * 0.1, rr * .6, 2); }
        // おどる ひとかげ
        var baseY = GEO.wrapTop ? GEO.wrapTop - 2 : H * .4, nC = Math.max(4, Math.round(W / 130));
        for(i = 0; i < nC; i++){ var cxp = W * (.3 + .7 * (i + .5) / nC), jmp = cfg.calm ? 0 : Math.abs(Math.sin((beat + i * .37) * 3.14)) * (4 + Math.min(10, G.combo / 8) + (fever ? 6 : 0));
            if(cxp < (GEO.wrapTop ? 90 : 0)) continue; c.fillStyle = "rgba(10,4,30,.55)"; var hh = Math.min(26, H * .05); c.beginPath(); c.arc(cxp, baseY - hh - jmp, hh * .32, 0, 7); c.fill(); c.fillRect(cxp - hh * .28, baseY - hh * .7 - jmp, hh * .56, hh * .7); }
        // はなび
        for(i = G.fw.length - 1; i >= 0; i--){ var f = G.fw[i]; f.life -= dt; if(f.life <= 0){ G.fw.splice(i, 1); continue; } f.x += f.vx * dt / W; f.y += (f.vy * dt + 60 * dt * (1.1 - f.life)) / H; c.globalAlpha = Math.max(0, f.life); c.fillStyle = "hsl(" + f.h + ",90%,65%)"; c.beginPath(); c.arc(f.x * W, f.y * H, 2.6, 0, 7); c.fill(); } c.globalAlpha = 1;
        if(fever && !cfg.calm){ c.fillStyle = "rgba(255,200,80," + (.06 + pulse * .06) + ")"; c.fillRect(0, 0, W, H); }
        else if(pulse > 0 && cfg.sBeat) { c.fillStyle = "rgba(255,255,255," + (pulse * .04) + ")"; c.fillRect(0, 0, W, H); }
    }
    // ---- 描く：レーン ----
    function rr(c, x, y, w, h, r){ c.beginPath(); if(c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
    function drawNote(c, x, y, r, type, alpha){
        var isD = type === "d" || type === "D", big = type === "D" || type === "K", R = big ? r * 1.35 : r, col = noteCol(isD ? 0 : 1);
        c.globalAlpha = alpha; c.beginPath(); c.arc(x, y, R + 3, 0, 7); c.fillStyle = "#1a0a30"; c.fill();
        c.beginPath(); c.arc(x, y, R, 0, 7); c.fillStyle = "#fff6e6"; c.fill();
        c.beginPath(); c.arc(x, y, R * 0.78, 0, 7); c.fillStyle = col; c.fill();
        c.beginPath(); c.arc(x - R * 0.2, y - R * 0.25, R * 0.22, 0, 7); c.fillStyle = "rgba(255,255,255,.35)"; c.fill();
        c.fillStyle = "rgba(255,255,255,.85)"; c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = Math.max(2, R * .09);
        if(isD){ c.fillStyle = "#2a0a0a"; c.beginPath(); c.arc(x - R * .27, y - R * .1, R * .1, 0, 7); c.fill(); c.beginPath(); c.arc(x + R * .27, y - R * .1, R * .1, 0, 7); c.fill(); c.strokeStyle = "#2a0a0a"; c.lineWidth = Math.max(2, R * .08); c.beginPath(); c.arc(x, y + R * .08, R * .3, .25, 2.9); c.stroke(); } else { c.beginPath(); c.arc(x, y, R * .42, .6, 2.54); c.stroke(); c.beginPath(); c.arc(x, y, R * .42, 3.74, 5.68); c.stroke(); }
        c.globalAlpha = 1;
    }
    function draw(dt){
        if(!cx2) return; var c = cx2, W = LW, H = LH, tm = now(), nowC = clock(), hx = W * (W < 600 ? Math.max(cfg.hitX, .3) : cfg.hitX), bt = GEO.bandTop, bh = GEO.bandH, cy = bt + bh / 2, r = bh * 0.27 * cfg.size, bpmE = G.song.bpm * G.rate, speed = W * 0.17 * (bpmE / 60) * 1.2 * cfg.speed;
        var leftW = Math.max(60, hx - r * 1.5), th = S.THEMES[cfg.theme] || S.THEMES[0];
        c.clearRect(0, 0, W, H);
        // うえの かざり（青海波もよう）と 黒い わく
        var pt = GEO.pat; c.fillStyle = "#f7a21a"; c.fillRect(0, 0, W, pt + 2); c.save(); c.beginPath(); c.rect(0, 0, W, pt + 2); c.clip();
        { var rr0 = Math.max(8, pt * 1.5); for(var row = 0; row < 3; row++) for(var col = -1; col < W / rr0 + 2; col++){ var cx0 = col * rr0 * 1.5 + (row % 2) * rr0 * .75, cy0 = row * rr0 * .5 - 2; for(var q = 0; q < 3; q++){ c.beginPath(); c.arc(cx0, cy0, rr0 * (1 - q * .28), 0, 7); c.fillStyle = q % 2 ? "#ffd04a" : "#ff8a1a"; c.fill(); c.strokeStyle = "rgba(160,60,0,.35)"; c.lineWidth = 1; c.stroke(); } } }
        c.restore();
        c.fillStyle = "#08080a"; rr(c, 0, pt - 2, W, GEO.gh + 8, 10); c.fill();
        // たましい ゲージ（左は あき、右の ほうに ぼうが のびる）
        if(cfg.sGauge){
            var gx0 = W * .3, gx1 = W - GEO.gh * 1.5 - 8, gy = pt + 4, gHt = GEO.gh - 8, segs = 50, sw = (gx1 - gx0) / segs, clearSeg = Math.round(cfg.clearAt / 2), filled = G.gauge / 2, ok = G.gauge >= cfg.clearAt;
            for(var i = 0; i < segs; i++){ var on = i < filled, x = gx0 + i * sw, col = on ? (i >= clearSeg ? (ok ? "hsl(" + ((tm * 140 + i * 6) % 360) + ",95%,62%)" : "#ffc02a") : "#ff3a3a") : (i >= clearSeg ? "#6a4a05" : "#6a0505"); c.fillStyle = col; c.fillRect(x, gy, Math.ceil(sw), gHt); c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(x + sw - 1.5, gy, 1.5, gHt); }
            var fx0 = gx0 + clearSeg * sw; c.fillStyle = "#08080a"; c.fillRect(fx0 - 2, gy - 2, 3, gHt + 4);
            c.font = "italic 900 " + Math.round(gHt * .7) + "px system-ui"; c.textAlign = "left"; c.textBaseline = "middle"; c.lineWidth = 4; c.strokeStyle = "#08080a"; c.fillStyle = ok ? "#ffe066" : "#ffffffcc"; c.strokeText("クリア", fx0 + 6, gy + gHt * .32); c.fillText("クリア", fx0 + 6, gy + gHt * .32);
            var bx = W - GEO.gh * .75 - 4, byy = gy + gHt / 2, pulse = Math.max(0, 1 - (nowC - G.soulT) * 4), fz = Math.round(GEO.gh * (1.05 + pulse * .2));
            c.font = "900 " + fz + "px 'Yu Mincho','Hiragino Mincho ProN',serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 5; c.strokeStyle = "#08080a"; c.strokeText("魂", bx, byy + 1); c.fillStyle = ok ? "#ffd24a" : "#c9c9d0"; if(ok){ c.shadowColor = "#ffb000"; c.shadowBlur = 14; } c.fillText("魂", bx, byy + 1); c.shadowBlur = 0;
            G._soul = {x: bx, y: byy};
        }
        // レーン（くらい ハイいろ）と、まんなかの したの ひとこと おび
        c.fillStyle = "#2a2a2e"; c.fillRect(0, bt, W, bh); c.fillStyle = "#08080a"; c.fillRect(0, bt - 3, W, 4); c.fillRect(0, bt + bh - 1, W, 4);
        c.fillStyle = "#86818a"; c.fillRect(0, bt + bh + 3, W, GEO.strip - 3); c.fillStyle = "#08080a"; c.fillRect(0, bt + bh + 3 + GEO.strip - 3, W, 3);
        if(G.song){ c.font = "900 " + Math.round(GEO.strip * .62) + "px system-ui"; c.textAlign = "right"; c.textBaseline = "middle"; c.fillStyle = "#fff"; c.lineWidth = 4; c.strokeStyle = "#1a1a20"; var sn = (G.song.name[lang] || G.song.name.en || G.song.name.ja); c.strokeText(sn, W - 14, bt + bh + 3 + (GEO.strip - 3) / 2); c.fillText(sn, W - 14, bt + bh + 3 + (GEO.strip - 3) / 2); }
        // ひだりの あかい ふち と こんぼの はこ
        c.fillStyle = "#f0452a"; c.fillRect(0, bt - 3, 8, bh + 6); c.fillStyle = "rgba(0,0,0,.28)"; c.fillRect(0, bt, leftW, bh); c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(leftW - 2, bt, 3, bh);
        if(cfg.sCombo){ var cb = G.combo, since = nowC - G.comboT, sc = 1 + Math.max(0, .35 - since * 2.5) * (cfg.calm ? 0 : 1); c.textAlign = "center"; c.textBaseline = "middle";
            if(cb >= 3){ var fs = bh * (cb >= 100 ? .46 : .4) * sc; c.font = "900 " + Math.round(fs) + "px system-ui"; c.lineWidth = 5; c.strokeStyle = "#1a0a30"; c.fillStyle = cb >= 100 ? "hsl(" + ((tm * 200) % 360) + ",95%,65%)" : cb >= 50 ? "#ffd24a" : "#fff"; c.strokeText(String(cb), leftW / 2, bt + bh * .46); c.fillText(String(cb), leftW / 2, bt + bh * .46);
                c.font = "800 " + Math.round(bh * .17) + "px system-ui"; c.fillStyle = "#fffd"; c.fillText(t("combo"), leftW / 2, bt + bh * .82); } }
        // ビート線
        var bs = G.bs, k0 = Math.floor((tm - hx / speed) / bs);
        if(cfg.sBeat) for(var k = k0; k < k0 + Math.ceil(W / (bs * speed)) + 3; k++){ var bxl = hx + (k * bs - tm) * speed; if(bxl < leftW || bxl > W) continue; c.fillStyle = k % 4 === 0 ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.12)"; c.fillRect(bxl - 1, bt + 3, 2, bh - 6); }
        // うける まる（くらい まんなか ＋ クリームいろの ふち ＋ めもり）
        var gl = Math.max(0, 1 - (nowC - G.jT) * 6), R0 = r * 1.3; c.beginPath(); c.arc(hx, cy, R0 + 4, 0, 7); c.fillStyle = "#0a0a0c"; c.fill(); c.beginPath(); c.arc(hx, cy, R0, 0, 7); c.fillStyle = "#fbf3dc"; c.fill();
        c.beginPath(); c.arc(hx, cy, R0 * .86, 0, 7); c.fillStyle = gl > 0 ? "rgba(255,255,255," + (.25 + gl * .5) + ")" : "#2c2c30"; c.fill(); if(gl > 0){ c.beginPath(); c.arc(hx, cy, R0 * .86, 0, 7); c.fillStyle = "rgba(60,60,64," + (1 - gl) + ")"; c.fill(); }
        c.beginPath(); c.arc(hx, cy, R0 * .58, 0, 7); c.fillStyle = "#34343a"; c.fill(); c.lineWidth = 3; c.strokeStyle = "#8a8a92"; c.stroke();
        c.fillStyle = "#fbf3dc"; c.fillRect(hx - 1.5, cy - R0 - 8, 3, 12); c.fillRect(hx - 1.5, cy + R0 - 4, 3, 12);
        // おんぷ（おくから てまえへ）
        var vis = cfg.hid, xSud = hx + (W - hx) * .52, xHid = hx + (W - hx) * .48;
        for(i = G.notes.length - 1; i >= G.ni; i--){
            var n = G.notes[i]; if(n.done && n.type !== "r" && n.type !== "R" && n.type !== "b") continue; if(n.done) continue;
            var x = hx + (n.t - tm) * speed; if(x > W + r * 3) continue;
            if(n.end !== undefined){ var x2 = hx + (n.end - tm) * speed; if(x2 < leftW - r) continue; var head = Math.max(x, hx), act = tm >= n.t && tm <= n.end, bigR = n.type === "R" ? 1.3 : 1;
                if(n.type === "b"){ var pos = Math.max(x, hx), sz = r * 1.3 * (1 + Math.min(1, n.hits / Math.max(1, n.need)) * .5); c.beginPath(); c.ellipse(pos, cy, sz * .85, sz, 0, 0, 7); var gb = c.createRadialGradient(pos - sz * .3, cy - sz * .3, 2, pos, cy, sz); gb.addColorStop(0, "#ffd0e8"); gb.addColorStop(1, act ? "#ff4a8a" : "#ff7ab0"); c.fillStyle = gb; c.fill(); c.lineWidth = 3; c.strokeStyle = "#8a1a4a"; c.stroke();
                    c.fillStyle = "#fff"; c.font = "900 " + Math.round(r * .9) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.strokeStyle = "#6a1a3a"; c.lineWidth = 4; var left = Math.max(0, n.need - n.hits); c.strokeText(String(left), pos, cy); c.fillText(String(left), pos, cy); continue; }
                var rh = r * 0.75 * bigR; c.fillStyle = act ? "#fff07a" : "#ffd24a"; var a = Math.max(head, leftW), bw = Math.min(x2, W + r) - a; rr(c, a - rh * .6, cy - rh, Math.max(4, bw + rh * .6), rh * 2, rh); c.fill(); c.strokeStyle = "#8a5a00"; c.lineWidth = 3; c.stroke();
                if(n.hits){ c.fillStyle = "#6a3a00"; c.font = "bold " + Math.round(r) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n.hits), Math.max(hx, Math.max(x, 20)) + rh + 6, cy); } continue; }
            if(x < leftW - r * 2) continue;
            var al = 1; if(vis & 1){ if(x > xSud) al = Math.max(0, 1 - (x - xSud) / (r * 3)); } if(vis & 2){ if(x < xHid) al = Math.min(al, Math.max(0, (x - hx) / (xHid - hx))); }
            if(al > .02) drawNote(c, x, cy, r, n.type, al);
        }
        // はんてい ようす
        c.save(); c.beginPath(); c.rect(leftW, 0, W - leftW, H); c.clip();
        for(i = G.fx.length - 1; i >= 0; i--){ var f = G.fx[i]; f.life -= dt; if(f.life <= 0){ G.fx.splice(i, 1); continue; }
            if(f.ring){ var q = 1 - f.life / .3; c.globalAlpha = Math.max(0, f.life / .3); c.strokeStyle = f.c; c.lineWidth = 4; c.beginPath(); c.arc(hx, cy, r * (1.2 + q * (f.big ? 1.6 : .9)), 0, 7); c.stroke(); c.globalAlpha = 1; continue; }
            f.x += f.vx * dt; f.y += f.vy * dt; c.globalAlpha = Math.max(0, f.life / 0.45); c.fillStyle = f.c; c.beginPath(); c.arc(hx + f.x, cy + f.y, 4, 0, 7); c.fill(); c.globalAlpha = 1; }
        c.restore();
        // ゲージへ とんでいく おんぷ
        if(G._soul && cfg.fx) for(i = G.fly.length - 1; i >= 0; i--){ var fl = G.fly[i], u = (nowC - fl.t0) / .38; if(u >= 1){ G.fly.splice(i, 1); G.soulT = nowC; continue; } var e = u * u * (3 - 2 * u), fxp = hx + (G._soul.x - hx) * e, fyp = cy + (G._soul.y - cy) * e - Math.sin(u * 3.14) * bh * .7; c.fillStyle = fl.c; c.globalAlpha = 1 - u * .3; c.beginPath(); c.arc(fxp, fyp, r * .3 * (1 - u * .4), 0, 7); c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; }
        else G.fly.length = 0;
        // 判定の もじ
        if(cfg.sJudge){ var ju = (nowC - G.jT) / .5; if(ju >= 0 && ju < 1){ c.globalAlpha = 1 - ju * ju; c.font = "900 " + Math.round(bh * .22 * (1 + (1 - ju) * .3)) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 5; c.strokeStyle = "#1a0a30"; c.strokeText(G.jTxt, hx, cy - r * 1.75 - ju * 14); c.fillStyle = G.jCol; c.fillText(G.jTxt, hx, cy - r * 1.75 - ju * 14); c.globalAlpha = 1; } }
        if(cfg.sFast){ var fu = (nowC - G.fsT) / .6; if(fu >= 0 && fu < 1){ c.globalAlpha = 1 - fu; c.font = "800 " + Math.round(bh * .13) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = G.fsCol; c.strokeStyle = "#1a0a30"; c.lineWidth = 3; c.strokeText(G.fsTxt, hx, cy + r * 1.85); c.fillText(G.fsTxt, hx, cy + r * 1.85); c.globalAlpha = 1; } }
    }
    var lastFrame = 0;
    function loop(){
        if(G.scr !== "play"){ return; }
        G.raf = requestAnimationFrame(loop); pollPad(); var tf = performance.now(), dt = Math.min(.1, (tf - lastFrame) / 1000 || .016); lastFrame = tf;
        var tm = now();
        if(G.running && !G.paused){
            var W = wnd(), i, n;
            for(i = G.ni; i < G.notes.length; i++){ n = G.notes[i]; if(n.done){ if(i === G.ni) G.ni++; continue; } if(n.t - tm > 0.5 && !G.auto) break;
                if(n.type === "r" || n.type === "R" || n.type === "b"){
                    if(G.auto && tm >= n.t && tm <= n.end && tm - (n._la || 0) > 0.06){ n._la = tm; n.hits++; if(n.type === "b"){ addScore(300); if(n.hits >= n.need){ n.done = true; G.balloons++; addScore(5000); popText("POP!", "#ffd24a"); fxBurst(0, "#ffd24a", true); mascotJump(); } } else { G.roll++; addScore(n.type === "R" ? 600 : 300); } sfx("d", false); mascotHit("d"); flashPad("d"); fxBurst(0, "#ffd24a", false); }
                    if(tm > n.end + 0.05 && !n.done){ n.done = true; } continue; }
                if(G.auto){ if(tm >= n.t){ var isD = n.type === "d" || n.type === "D", bg = n.type === "D" || n.type === "K"; sfx(isD ? "d" : "k", bg); mascotHit(isD ? "d" : "k"); flashPad(isD ? "d" : "k"); good(n, 0, bg, 0); } else break; }
                else if(tm - cfg.offset / 1000 - n.t > W.bad){ missNote(n); } else if(n.t - tm > W.bad) break; }
            while(G.ni < G.notes.length && G.notes[G.ni].done) G.ni++;
            if(tm > 0 && Math.floor(tm / 0.5) !== G.lastGh){ G.lastGh = Math.floor(tm / 0.5); G.gh.push(G.gauge); }
            var endT = G.practice ? G.loopEnd / G.rate + 0.6 : G.lastNote + 1.6;
            if(!G.ended && tm > endT) finish();
        }
        if(G.scr === "play"){ drawBg(Math.max(0, tm), dt); draw(dt); }
    }
    // ---- 終わり ----
    function rankOf(acc, ap){ return ap ? "S+" : acc >= 97 ? "S" : acc >= 90 ? "A" : acc >= 78 ? "B" : acc >= 55 ? "C" : "D"; }
    function finish(){
        G.ended = true; G.running = false; clearInterval(G.timer);
        if(G.practice){ setTimeout(function(){ if(G.scr === "play" && !G.paused){ G.beginning = false; var s = G.scr; G.scr = "x"; begin(); } }, 300); return; }
        var tot = G.g + G.o + G.m, acc = tot ? (G.g + G.o * .5) / tot * 100 : 0, cleared = G.gauge >= cfg.clearAt || cfg.noFail, fc = G.m === 0, ap = fc && G.o === 0, rank = rankOf(acc, ap);
        var r = {clear: cleared, fc: fc, ap: ap, score: G.score}, prev = getBest(G.song, G.diff), isNew = false, crown = crownOf(r), canSave = !G.auto && cfg.rate === 1 && !cfg.noFail;
        if(canSave){ if(!prev || G.score > prev.score){ isNew = true; setBest(G.song, G.diff, {score: G.score, acc: acc, combo: G.maxCombo, rank: rank, crown: crownRank(crown) >= crownRank(prev && prev.crown) ? crown : prev && prev.crown}); }
            else if(crownRank(crown) > crownRank(prev.crown)){ prev.crown = crown; setBest(G.song, G.diff, prev); } bumpStats(G.g + G.o); }
        $("reSong").textContent = (G.song.name[lang] || G.song.name.en || G.song.name.ja) + "　" + t("diff")[G.diff] + (G.auto ? " " + t("bigAuto") : "") + (cfg.rate !== 1 ? " ×" + cfg.rate : "");
        $("reClear").textContent = ap ? t("ap") : fc ? t("fc") : cleared ? t("clear") : t("fail"); $("reRank").textContent = rank;
        var rows = t("rows"), vals = [G.score, G.g, G.o, G.m, G.roll, G.balloons, G.maxCombo, acc.toFixed(1) + "%", Math.round(G.gauge) + "%"];
        $("reTable").innerHTML = rows.map(function(l, i){ return "<tr><td>" + l + "</td><td>" + vals[i] + "</td></tr>"; }).join("");
        $("reNew").textContent = isNew ? t("newbest") : (!canSave && !G.auto ? "（" + (lang === "ja" ? "記録は のこりません" : "record not saved") + "）" : "");
        var avg = G.errs.length ? G.errs.reduce(function(a, b){ return a + b; }, 0) / G.errs.length : 0; $("reErr").textContent = t("avgErr") + "：" + (avg > 0 ? "+" : "") + avg.toFixed(1) + "ms" + (G.errs.length ? "（" + (avg < -5 ? t("early") : avg > 5 ? t("late") : "OK") + "）" : "");
        window.PK_last = {score: G.score, g: G.g, o: G.o, m: G.m, roll: G.roll, balloons: G.balloons, maxCombo: G.maxCombo, gauge: G.gauge, clear: cleared, fc: fc, ap: ap, acc: acc, rank: rank};
        show("result"); paintResultCharts(); paintSelect();
    }
    function paintResultCharts(){
        var a = $("gGraph"), c = a.getContext("2d"), W = a.width, H = a.height; c.clearRect(0, 0, W, H);
        var y70 = H - cfg.clearAt / 100 * (H - 10) - 5; c.strokeStyle = "rgba(255,160,60,.6)"; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(0, y70); c.lineTo(W, y70); c.stroke(); c.setLineDash([]);
        var gh = G.gh.length ? G.gh : [0]; c.strokeStyle = "#4acbff"; c.lineWidth = 3; c.beginPath(); gh.forEach(function(v, i){ var x = gh.length > 1 ? i / (gh.length - 1) * (W - 6) + 3 : 3, y = H - v / 100 * (H - 10) - 5; if(i === 0) c.moveTo(x, y); else c.lineTo(x, y); }); c.stroke();
        var b = $("gHist"), d = b.getContext("2d"), BWd = b.width, BHd = b.height; d.clearRect(0, 0, BWd, BHd); var bins = new Array(21).fill(0), mx = 1;
        G.errs.forEach(function(e){ var k = Math.max(0, Math.min(20, Math.round(e / 10) + 10)); bins[k]++; }); bins.forEach(function(v){ if(v > mx) mx = v; });
        bins.forEach(function(v, i){ var w = BWd / 21, h = v / mx * (BHd - 16); d.fillStyle = i === 10 ? "#ffd24a" : (i < 10 ? "#7ad0ff" : "#ff9a7a"); d.fillRect(i * w + 2, BHd - 4 - h, w - 4, h); });
        d.fillStyle = "#fff6"; d.fillRect(BWd / 2 - 1, 0, 2, BHd);
    }
    // ---- ポーズ ----
    function pause(){ if(G.scr !== "play" || !G.running || G.paused) return; G.paused = true; if(useCtx) ctx.suspend(); else G.pausedAt = clock(); $("pauseBox").classList.add("on"); try{ $("bResume").focus(); }catch(_e){} }
    function resume(){ if(!G.paused) return; G.paused = false; $("pauseBox").classList.remove("on"); if(useCtx) ctx.resume(); else G.startAt += clock() - G.pausedAt; }
    function quit(){ G.running = false; G.paused = false; G.practice = false; clearInterval(G.timer); clearInterval(countTimer); $("pauseBox").classList.remove("on"); $("countBox").classList.remove("on"); if(useCtx && ctx.state === "suspended") ctx.resume(); show("select"); paintSelect(); }
    // ---- ゲームパッド ----
    var padPrev = {};
    function pollPad(){
        var pads = navigator.getGamepads ? navigator.getGamepads() : []; var cur = {};
        for(var i = 0; i < pads.length; i++){ var gp = pads[i]; if(!gp) continue; for(var b = 0; b < gp.buttons.length; b++){ if(gp.buttons[b].pressed) cur[b] = true; } }
        for(var k in cur){ if(!padPrev[k]){
            k = +k;
            if(G.scr === "play"){ if(k === 9 || k === 8){ if(G.paused) resume(); else pause(); } else if(G.paused){ if(k === 1) resume(); } else if(k <= 3) hit("d"); else if(k === 4 || k === 5 || k === 6 || k === 7 || (k >= 12 && k <= 15)) hit("k"); }
            if(calOn) calTap();
        } }
        padPrev = cur;
    }
    function menuPad(){
        var pads = navigator.getGamepads ? navigator.getGamepads() : []; var cur = {};
        for(var i = 0; i < pads.length; i++){ var gp = pads[i]; if(!gp) continue; for(var b = 0; b < gp.buttons.length; b++){ if(gp.buttons[b].pressed) cur[b] = true; } }
        if(G.scr !== "play" && !setOpen()){ for(var k in cur){ if(!menuPad.prev[k]){ k = +k;
            if(G.scr === "select"){ if(k === 12) moveSong(-1); else if(k === 13) moveSong(1); else if(k === 14) moveDiff(-1); else if(k === 15) moveDiff(1); else if(k === 1 || k === 9) startSelected(); else if(k === 0) $("bSeBack").click(); continue; }
            var vis = Array.prototype.filter.call(document.querySelectorAll("#s-" + G.scr + " button, #s-" + G.scr + " input"), function(e){ return e.offsetParent; }), ix = vis.indexOf(document.activeElement);
            if(k === 13 || k === 15){ if(vis.length) vis[(ix + 1) % vis.length].focus(); } else if(k === 12 || k === 14){ if(vis.length) vis[(ix - 1 + vis.length) % vis.length].focus(); }
            else if(k === 1){ if(document.activeElement && document.activeElement.click) document.activeElement.click(); }
            else if(k === 0){ var bk = document.querySelector("#s-" + G.scr + " #bSeBack, #s-" + G.scr + " #bHowBack, #s-" + G.scr + " #bReList"); if(bk) bk.click(); } } } }
        menuPad.prev = cur;
    }
    menuPad.prev = {};
    setInterval(menuPad, 60);
    // ---- せってい画面 ----
    var setTab = 0, capKey = null;
    function setOpen(){ return $("setBox").classList.contains("on") || $("calBox").classList.contains("on"); }
    function openSettings(){ $("setBox").classList.add("on"); paintSettings(); }
    function closeSettings(){ $("setBox").classList.remove("on"); capKey = null; paintText(); resize(); if(G.scr === "play" && G.paused) try{ $("bResume").focus(); }catch(_e){} }
    function paintSettings(){
        var tabs = $("setTabs"); tabs.innerHTML = ""; t("tabs")[0]; var names = (T.tabs[lang] || T.tabs.en);
        names.forEach(function(nm, i){ var b = document.createElement("button"); b.type = "button"; b.textContent = nm; if(i === setTab) b.className = "on"; b.onclick = function(){ setTab = i; paintSettings(); }; tabs.appendChild(b); });
        var body = $("setBody"); body.innerHTML = "";
        S.SCHEMA.filter(function(d){ return d.tab === setTab; }).forEach(function(d){ body.appendChild(settingRow(d)); });
        if(setTab === 3){ var r = document.createElement("div"); r.className = "setRow"; r.innerHTML = "<label>" + t("name") + "</label>"; var inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 12; inp.value = cfg.name; inp.style.cssText = "background:#1a0a30;color:#fff;border:1px solid #fff4;border-radius:8px;padding:6px 8px"; inp.oninput = function(){ S.set("name", inp.value); }; r.appendChild(inp); body.appendChild(r);
            var h = document.createElement("div"); h.className = "hint"; h.textContent = lang === "ja" ? "スペース・Enter でも 赤（ドン）を たたけます。ゲームパッドは A B X Y が 赤、L R ZL ZR・十字が 青。" : "Space/Enter also hit red. Gamepad: A B X Y = red, L R ZL ZR / D-pad = blue."; body.appendChild(h); }
        var foot = $("setFoot"); foot.innerHTML = "";
        var mk = function(txt, fn){ var b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.onclick = fn; foot.appendChild(b); return b; };
        var pres = S.presets();
        for(var i = 0; i < 3; i++){ (function(i){ var lab = (pres[i] && pres[i].name) || ("#" + (i + 1)); mk("💾" + (i + 1), function(){ S.savePreset(i, "#" + (i + 1) + " " + (cfg.name || "")); paintSettings(); }).title = t("saveP"); if(pres[i]) mk("📂" + (i + 1), function(){ S.loadPreset(i); applyAll(); paintSettings(); }).title = t("loadP"); })(i); }
        mk(t("reset"), function(){ S.reset(); applyAll(); paintSettings(); });
        var ta = document.createElement("textarea"); ta.value = S.exportJson(); ta.onfocus = function(){ ta.select(); }; foot.appendChild(ta);
        mk(t("imp"), function(){ if(S.importJson(ta.value)){ applyAll(); paintSettings(); } });
    }
    function settingRow(d){
        var row = document.createElement("div"); row.className = "setRow"; var lab = document.createElement("label"); lab.innerHTML = tl(d.l) + (d.h ? "<small>" + tl(d.h) + "</small>" : ""); row.appendChild(lab); var v = cfg[d.k];
        if(d.type === "range"){ var inp = document.createElement("input"); inp.type = "range"; inp.min = d.min; inp.max = d.max; inp.step = d.step; inp.value = v; var val = document.createElement("span"); val.className = "val"; val.textContent = S.fmt(d, +v);
            inp.oninput = function(){ S.set(d.k, +inp.value); val.textContent = S.fmt(d, cfg[d.k]); applyAll(true); }; row.appendChild(inp); row.appendChild(val);
            if(d.k === "offset"){ var cb = document.createElement("button"); cb.type = "button"; cb.className = "mini"; cb.textContent = t("cal"); cb.onclick = openCal; row.appendChild(cb); } }
        else if(d.type === "sel"){ var sel = document.createElement("select"); d.opts.forEach(function(o, i){ var op = document.createElement("option"); op.value = i; op.textContent = tl(o); sel.appendChild(op); }); sel.value = v;
            sel.onchange = function(){ S.set(d.k, +sel.value); applyAll(true); if(d.test){ ensureAudio().then(function(){ useCtx = !!(ctx && ctx.state === "running"); sfx("d", false); setTimeout(function(){ sfx("k", false); }, 220); }); } }; row.appendChild(sel);
            if(d.pair !== undefined){ var sw = document.createElement("span"); var col = S.NOTE_COLORS[v].d[d.pair]; sw.innerHTML = '<i class="swatch" style="background:' + col + '"></i>'; row.appendChild(sw); sel.addEventListener("change", function(){ sw.innerHTML = '<i class="swatch" style="background:' + S.NOTE_COLORS[+sel.value].d[d.pair] + '"></i>'; }); }
            if(d.test){ var tb = document.createElement("button"); tb.type = "button"; tb.className = "mini"; tb.textContent = t("test"); tb.onclick = function(){ ensureAudio().then(function(){ useCtx = !!(ctx && ctx.state === "running"); sfx("d", false); setTimeout(function(){ sfx("k", false); }, 220); }); }; row.appendChild(tb); } }
        else if(d.type === "tog"){ var ck = document.createElement("input"); ck.type = "checkbox"; ck.checked = !!v; ck.onchange = function(){ S.set(d.k, ck.checked); applyAll(true); }; row.appendChild(ck); }
        else if(d.type === "key"){ var kb = document.createElement("button"); kb.type = "button"; kb.className = "keyBtn"; kb.textContent = keyName(v); kb.onclick = function(){ capKey = d.k; kb.textContent = t("press"); kb.classList.add("wait"); }; row.appendChild(kb); }
        return row;
    }
    function applyAll(live){ cfg = S.get(); applyVolumes(); if(!live || true){ var m = $("mascotP"); if(m){ paintMascots(); } resize(); $("keyHint").textContent = keyHintText(); } }
    // ---- ずれを はかる ----
    var calOn = false, calClicks = [], calTaps = [], calTimer = 0;
    function openCal(){
        ensureAudio().then(function(){ useCtx = !!(ctx && ctx.state === "running"); if(!useCtx) return; $("calBox").classList.add("on"); calOn = true; calTaps = []; calClicks = []; $("caRes").textContent = "…"; var t0 = ctx.currentTime + 1, i;
            for(i = 0; i < 16; i++){ var at = t0 + i * 0.6; calClicks.push(at); tone("square", 1200, at, .06, .3, 0, busS); }
            clearInterval(calTimer); calTimer = setInterval(function(){ var cur = ctx.currentTime, hit = calClicks.some(function(a){ return cur >= a && cur < a + .08; }); $("caDot").classList.toggle("tick", hit); }, 20); });
    }
    function calTap(){
        if(!calOn || !useCtx) return; var tp = ctx.currentTime, best = null; calClicks.forEach(function(a){ var d = tp - a; if(best === null || Math.abs(d) < Math.abs(best)) best = d; });
        if(best !== null && Math.abs(best) < .3){ calTaps.push(best * 1000); var last = calTaps.slice(-8), avg = last.reduce(function(a, b){ return a + b; }, 0) / last.length; $("caRes").textContent = (calTaps.length < 4 ? "… " : "") + (avg > 0 ? "+" : "") + Math.round(avg) + "ms　(" + calTaps.length + ")"; calAvg = avg; }
    }
    var calAvg = 0;
    function closeCal(apply){ if(apply && calTaps.length >= 4){ S.set("offset", Math.max(-300, Math.min(300, Math.round(calAvg / 5) * 5))); applyAll(); } $("calBox").classList.remove("on"); calOn = false; clearInterval(calTimer); paintSettings(); }
    // ---- つなぐ ----
    function init(){
        paintText();
        $("bPlay").onclick = function(){ ensureAudio(); show("select"); paintSelect(); };
        $("bHow").onclick = function(){ show("how"); }; $("bHowBack").onclick = function(){ show("title"); }; $("bSeBack").onclick = function(){ show("title"); };
        $("bSetT").onclick = $("bSetS").onclick = $("bSetP").onclick = openSettings; $("bSetClose").onclick = closeSettings; $("bCaClose").onclick = function(){ closeCal(false); }; $("bCaApply").onclick = function(){ closeCal(true); };
        $("bGo").onclick = startSelected; $("pracBox").onchange = paintDetail; $("autoBox").onchange = function(){};
        $("bPause").onclick = pause; $("bResume").onclick = resume; $("bRetry").onclick = function(){ G.running = false; clearInterval(G.timer); if(useCtx && ctx.state === "suspended") ctx.resume(); $("pauseBox").classList.remove("on"); G.paused = false; G.beginning = false; G.scr = "x"; begin(); };
        $("bQuit").onclick = quit; $("bReAgain").onclick = function(){ G.beginning = false; G.scr = "x"; begin(); }; $("bReList").onclick = function(){ show("select"); paintSelect(); };
        $("lgBtn").onclick = function(){ lang = LANGS[(LANGS.indexOf(lang) + 1) % 4]; try{ localStorage.setItem("are_lang", lang); }catch(_e){} paintText(); };
        $("exitBtn").onclick = function(){
            if(setOpen()){ if(calOn) closeCal(false); else closeSettings(); return; }
            if(G.scr === "play"){ if(G.paused){ quit(); } else pause(); return; }
            if(G.scr !== "title"){ show(G.scr === "result" ? "select" : "title"); return; }
            try{ var b = new URLSearchParams(location.search).get("back"); if(b && /^https:\/\/arechat\.github\.io\//.test(b)){ location.href = b; return; } }catch(_e){}
            location.href = "../index.html";
        };
        document.addEventListener("keydown", function(e){
            var k = e.key;
            if(capKey){ if(k !== "Escape"){ var nk = k.length === 1 ? k.toLowerCase() : k; S.set(capKey, nk); } capKey = null; e.preventDefault(); applyAll(); paintSettings(); return; }
            if(calOn){ if(!e.repeat && k !== "Escape") calTap(); if(k === "Escape") closeCal(false); e.preventDefault(); return; }
            if(e.repeat) return;
            if(setOpen()){ if(k === "Escape") closeSettings(); return; }
            var lk = k.length === 1 ? k.toLowerCase() : k;
            if(G.scr === "play"){
                if(k === "Escape" || lk === "p"){ if(G.paused) resume(); else pause(); e.preventDefault(); return; }
                if(G.paused) return;
                if(lk === cfg.kd1 || lk === cfg.kd2 || k === " " || k === "Enter"){ hit("d"); e.preventDefault(); }
                else if(lk === cfg.kk1 || lk === cfg.kk2){ hit("k"); e.preventDefault(); }
            } else if(G.scr === "select"){
                if(k === "ArrowDown"){ moveSong(1); e.preventDefault(); } else if(k === "ArrowUp"){ moveSong(-1); e.preventDefault(); } else if(k === "ArrowLeft"){ moveDiff(-1); e.preventDefault(); } else if(k === "ArrowRight"){ moveDiff(1); e.preventDefault(); }
                else if(k === "Enter" && document.activeElement && document.activeElement.tagName !== "BUTTON" && document.activeElement.tagName !== "INPUT"){ startSelected(); e.preventDefault(); } else if(k === "Escape") $("exitBtn").click();
            } else if(k === "Escape" && G.scr !== "title"){ $("exitBtn").click(); }
        });
        Array.prototype.forEach.call(document.querySelectorAll("#drumArea .pad"), function(p){ p.addEventListener("pointerdown", function(e){ e.preventDefault(); if(calOn) calTap(); hit(p.dataset.k); }); });
        window.addEventListener("resize", resize); window.addEventListener("orientationchange", function(){ setTimeout(resize, 200); });
        document.addEventListener("visibilitychange", function(){ if(document.hidden) pause(); });
        S.onChange(function(c){ cfg = c; });
        window.PK = {G: G, SEL: SEL, hit: hit, now: now, finish: finish, begin: begin, startSong: startSong, pause: pause, resume: resume, lang: function(){ return lang; }, cfg: function(){ return cfg; }, songs: allSongs, openSettings: openSettings, paintSelect: paintSelect, show: show, resize: resize};
    }
    init();
})();
